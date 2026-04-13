/**
 * NemoClaw / OpenClaw gateway WebSocket bridge (browser).
 * Handshake: wait for connect.challenge, then send connect (token + operator scopes).
 * Parses hello-ok.features.methods for capability-aware UI; optional auto device.pair.approve.
 * @see https://open-claw.bot/docs/gateway/protocol/
 */

const DEFAULT_PROTOCOL = 3;

const M = {
  execResolve: "exec.approval.resolve",
  pluginResolve: "plugin.approval.resolve",
  pairApprove: "device.pair.approve",
};

function nextId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "tf-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
}

/**
 * @param {unknown} helloPayload
 * @returns {string[]}
 */
function parseGatewayMethods(helloPayload) {
  if (!helloPayload || typeof helloPayload !== "object") return [];
  const p = /** @type {Record<string, unknown>} */ (helloPayload);
  const features = p.features;
  if (!features || typeof features !== "object") return [];
  const f = /** @type {Record<string, unknown>} */ (features);
  const methods = f.methods;
  if (!Array.isArray(methods)) return [];
  return methods.filter((x) => typeof x === "string" && x.length > 0);
}

function inferGatewayClientMode(clientId) {
  const map = {
    cli: "cli",
    webchat: "webchat",
    "webchat-ui": "webchat",
    "openclaw-control-ui": "ui",
    "openclaw-tui": "cli",
    "gateway-client": "backend",
    "openclaw-macos": "ui",
    "openclaw-ios": "ui",
    "openclaw-android": "ui",
    "node-host": "node",
    test: "test",
    fingerprint: "ui",
    "openclaw-probe": "probe",
  };
  return map[clientId] || "ui";
}

/**
 * @typedef {Object} BridgeOptions
 * @property {string} url
 * @property {string} [token]
 * @property {number} [protocolMin]
 * @property {number} [protocolMax]
 * @property {number} [challengeWaitMs]
 * @property {boolean} [autoApproveDevicePair] - default true
 * @property {string} [gatewayClientId] - OpenClaw literal union; default cli
 * @property {string} [gatewayClientMode] - OpenClaw client.mode; default fra id (cli/ui/webchat/...)
 */

export class NemoClawBridge {
  /**
   * @param {BridgeOptions} options
   */
  constructor(options) {
    this.url = options.url;
    this.token = (options.token || "").trim();
    this.protocolMin = options.protocolMin ?? DEFAULT_PROTOCOL;
    this.protocolMax = options.protocolMax ?? DEFAULT_PROTOCOL;
    this.challengeWaitMs = options.challengeWaitMs ?? 8000;
    this.autoApproveDevicePair = options.autoApproveDevicePair !== false;
    /** @type {string} */
    this.gatewayClientId = options.gatewayClientId || "openclaw-control-ui";
    /** @type {string} */
    this.gatewayClientMode =
      options.gatewayClientMode || inferGatewayClientMode(this.gatewayClientId);
    /** @type {WebSocket | null} */
    this._ws = null;
    /** @type {{ nonce?: string, ts?: number } | null} */
    this._challenge = null;
    /** @type {string | null} */
    this._connectReqId = null;
    this._helloOk = false;
    /** @type {Set<string>} */
    this._gatewayMethods = new Set();
    this._methodsFromGateway = false;
    /** @type {unknown} */
    this._helloPayload = null;
    /** @type {ReturnType<typeof setTimeout> | null} */
    this._challengeTimer = null;
    /** @type {Map<string, { resolve: (v: unknown) => void, reject: (e: unknown) => void, timer: ReturnType<typeof setTimeout> }>} */
    this._pendingRpc = new Map();
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();
  }

  /**
   * @param {string} event
   * @param {(data: unknown) => void} fn
   * @returns {() => void}
   */
  on(event, fn) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(fn);
    return () => this._listeners.get(event)?.delete(fn);
  }

  /**
   * @param {string} event
   * @param {unknown} [data]
   */
  _emit(event, data) {
    const set = this._listeners.get(event);
    if (!set) return;
    for (const fn of set) {
      try {
        fn(data);
      } catch (e) {
        console.error("[NemoClawBridge]", event, e);
      }
    }
  }

  /**
   * @param {string} method
   */
  supportsMethod(method) {
    if (!this._methodsFromGateway || this._gatewayMethods.size === 0) return true;
    return this._gatewayMethods.has(method);
  }

  /**
   * @param {"exec"|"plugin"} kind
   */
  resolveMethodForKind(kind) {
    return kind === "plugin" ? M.pluginResolve : M.execResolve;
  }

  /**
   * @param {"exec"|"plugin"} kind
   */
  supportsClearanceKind(kind) {
    return this.supportsMethod(this.resolveMethodForKind(kind));
  }

  /** @returns {string[]} */
  getGatewayMethods() {
    return Array.from(this._gatewayMethods);
  }

  connect() {
    this.disconnect(false);
    this._helloOk = false;
    this._challenge = null;
    this._connectReqId = null;
    this._gatewayMethods = new Set();
    this._methodsFromGateway = false;
    this._helloPayload = null;
    this._flushPendingRpc("forbundet igen");

    const ws = new WebSocket(this.url);
    this._ws = ws;

    ws.addEventListener("open", () => {
      this._emit("socket-open", { url: this.url });
      this._challengeTimer = setTimeout(() => {
        if (!this._helloOk && !this._connectReqId) {
          this._sendConnect();
        }
      }, this.challengeWaitMs);
    });

    ws.addEventListener("message", (ev) => {
      const raw = typeof ev.data === "string" ? ev.data : "";
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }
      this._emit("frame", msg);
      this._handleFrame(msg);
    });

    ws.addEventListener("error", () => {
      this._emit("error", { message: "WebSocket error" });
    });

    ws.addEventListener("close", (ev) => {
      if (this._challengeTimer) {
        clearTimeout(this._challengeTimer);
        this._challengeTimer = null;
      }
      const pairing =
        ev.code === 1008 ||
        (ev.reason && /pairing|policy|device|auth|token/i.test(String(ev.reason)));
      if (pairing) {
        this._emit("pairing-required", {
          code: ev.code,
          reason: ev.reason || "",
          hint:
            "OpenClaw afviste forbindelsen (ofte 1008). Godkend denne klient med: openclaw devices approve (eller tilsvarende i NemoClaw-sandkassen), og sikr at gateway-token og allowedOrigins matcher dit dashboard.",
        });
      }
      this._emit("close", { code: ev.code, reason: ev.reason });
      this._ws = null;
    });
  }

  /**
   * @param {unknown} msg
   */
  _handleFrame(msg) {
    if (!msg || typeof msg !== "object") return;
    const m = /** @type {Record<string, unknown>} */ (msg);

    if (m.type === "event" && m.event === "connect.challenge") {
      if (this._challengeTimer) {
        clearTimeout(this._challengeTimer);
        this._challengeTimer = null;
      }
      this._challenge = /** @type {{ nonce?: string, ts?: number }} */ (m.payload) || null;
      this._sendConnect();
      return;
    }

    if (m.type === "res" && m.id === this._connectReqId) {
      if (m.ok) {
        this._helloOk = true;
        const payload = m.payload;
        this._helloPayload = payload;
        const list = parseGatewayMethods(payload);
        this._gatewayMethods = new Set(list);
        this._methodsFromGateway = list.length > 0;
        this._emit("connected", {
          hello: payload,
          methods: list,
          methodsStrict: this._methodsFromGateway,
        });
      } else {
        const err = m.error && typeof m.error === "object" ? m.error : {};
        const e = /** @type {Record<string, unknown>} */ (err);
        const code = typeof e.code === "string" ? e.code : "";
        const message = typeof e.message === "string" ? e.message : "connect failed";
        const pairing =
          /pairing|device|PAIR|DEVICE_AUTH|token/i.test(code + message) ||
          (e.details &&
            typeof e.details === "object" &&
            /pairing|device/i.test(JSON.stringify(e.details)));
        if (pairing) {
          this._emit("pairing-required", {
            code: 1008,
            reason: message,
            gatewayError: e,
            hint:
              "Gateway afviste connect. Tjek token, enheds-parring (openclaw devices approve) og controlUi-indstillinger i NemoClaw.",
          });
        }
        this._emit("connect-error", e);
      }
      return;
    }

    if (m.type === "res" && typeof m.id === "string") {
      const pend = this._pendingRpc.get(m.id);
      if (pend) {
        clearTimeout(pend.timer);
        this._pendingRpc.delete(m.id);
        if (m.ok) pend.resolve(m.payload);
        else pend.reject(m.error != null ? m.error : { message: "rpc error" });
        return;
      }
    }

    if (m.type === "event" && typeof m.event === "string") {
      const ev = m.event;
      const payload = m.payload;

      if (ev === "device.pair.requested" || (ev.includes("device.pair") && ev.includes("requested"))) {
        this._handleDevicePairRequested(
          payload && typeof payload === "object" ? /** @type {Record<string, unknown>} */ (payload) : {},
        );
        return;
      }

      if (ev === "exec.approval.requested" || (ev.includes("exec.approval") && !ev.includes("resolve"))) {
        if (this.supportsMethod(M.execResolve)) {
          this._emit("clearance", {
            kind: "exec",
            event: ev,
            payload,
          });
        }
        return;
      }

      if (ev === "plugin.approval.requested" || (ev.includes("plugin.approval") && !ev.includes("resolve"))) {
        if (this.supportsMethod(M.pluginResolve)) {
          this._emit("clearance", {
            kind: "plugin",
            event: ev,
            payload,
          });
        }
        return;
      }
    }
  }

  /**
   * @param {Record<string, unknown>} p
   */
  _handleDevicePairRequested(p) {
    const requestId = typeof p.requestId === "string" ? p.requestId : "";
    this._emit("device-pair-requested", p);

    if (!this.autoApproveDevicePair || !requestId) return;
    if (!this.supportsMethod(M.pairApprove)) {
      this._emit("device-pair-auto-skipped", {
        requestId,
        reason: "device.pair.approve not in hello-ok.features.methods",
        payload: p,
      });
      return;
    }

    this._send({
      type: "req",
      id: nextId(),
      method: M.pairApprove,
      params: { requestId },
    });
    this._emit("device-pair-auto-approved", { requestId, payload: p });
  }

  _sendConnect() {
    if (!this._ws || this._ws.readyState !== WebSocket.OPEN) return;
    if (this._connectReqId) return;

    const id = nextId();
    this._connectReqId = id;

    /** @type {Record<string, unknown>} */
    const params = {
      minProtocol: this.protocolMin,
      maxProtocol: this.protocolMax,
      client: {
        id: this.gatewayClientId,
        version: "0.1.0",
        platform: (function(){var u=(typeof navigator!=="undefined"&&navigator.userAgent||"").toLowerCase();var pl=(typeof navigator!=="undefined"&&navigator.platform||"").toLowerCase();if(/win/.test(u)||/win/.test(pl))return"windows";if(/mac/.test(u)||/mac/.test(pl))return"macos";if(/linux/.test(u)||/linux/.test(pl))return"linux";return"web";})(),
        mode: this.gatewayClientMode,
      },
      role: "operator",
      scopes: [
        "operator.read",
        "operator.write",
        "operator.approvals",
        "operator.pairing",
        "operator.admin",
      ],
      caps: [],
      commands: [],
      permissions: {},
      locale: "da-DK",
      userAgent: "openclaw-cli/0.1.0 (the-factory)",
    };

    if (this.token) {
      params.auth = { token: this.token };
    }

    this._ws.send(JSON.stringify({ type: "req", id, method: "connect", params }));
  }

  /**
   * @param {Record<string, unknown>} obj
   */
  _send(obj) {
    if (!this._ws || this._ws.readyState !== WebSocket.OPEN) return;
    this._ws.send(JSON.stringify(obj));
  }

  /**
   * @param {"exec"|"plugin"} kind
   * @param {string} id
   * @param {"approve"|"deny"} decision
   */
  resolveClearance(kind, id, decision) {
    const method = this.resolveMethodForKind(kind);
    if (!this.supportsMethod(method)) return false;
    this._send({
      type: "req",
      id: nextId(),
      method,
      params: { id, decision },
    });
    return true;
  }

  /**
   * @param {string} requestId
   */
  approveDevicePair(requestId) {
    if (!requestId || !this.supportsMethod(M.pairApprove)) return false;
    this._send({
      type: "req",
      id: nextId(),
      method: M.pairApprove,
      params: { requestId },
    });
    return true;
  }

  _flushPendingRpc(reason) {
    for (const [, pend] of this._pendingRpc) {
      clearTimeout(pend.timer);
      pend.reject(new Error(reason));
    }
    this._pendingRpc.clear();
  }

  /**
   * @param {string} method
   * @param {Record<string, unknown>} [params]
   * @param {number} [timeoutMs]
   * @returns {Promise<unknown>}
   */
  rpc(method, params = {}, timeoutMs = 20000) {
    if (!this.connected) {
      return Promise.reject(new Error("ikke forbundet til gateway"));
    }
    if (this._methodsFromGateway && this._gatewayMethods.size > 0 && !this._gatewayMethods.has(method)) {
      return Promise.reject(
        new Error("Gateway annoncerer ikke " + method + " i hello-ok.features.methods"),
      );
    }
    const id = nextId();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this._pendingRpc.has(id)) {
          this._pendingRpc.delete(id);
          reject(new Error("RPC timeout: " + method));
        }
      }, timeoutMs);
      this._pendingRpc.set(id, { resolve, reject, timer });
      this._send({ type: "req", id, method, params });
    });
  }

  /**
   * @param {boolean} [emitClose]
   */
  disconnect(emitClose = true) {
    this._flushPendingRpc("afbrudt");
    if (this._challengeTimer) {
      clearTimeout(this._challengeTimer);
      this._challengeTimer = null;
    }
    if (this._ws) {
      const ws = this._ws;
      this._ws = null;
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      if (emitClose) this._emit("close", { code: 1000, reason: "client disconnect" });
    }
    this._helloOk = false;
    this._connectReqId = null;
    this._gatewayMethods = new Set();
    this._methodsFromGateway = false;
    this._helloPayload = null;
  }

  get connected() {
    return Boolean(this._ws && this._ws.readyState === WebSocket.OPEN && this._helloOk);
  }
}

export function isPairingCloseCode(code) {
  return code === 1008;
}

export const GATEWAY_METHODS = M;