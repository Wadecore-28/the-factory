"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Link2,
  ListTree,
  Lock,
  Radio,
  RefreshCw,
  Shield,
  ShieldAlert,
  Skull,
  Terminal,
  Unplug,
  Users,
  Zap,
  BookOpen,
  Factory,
} from "lucide-react";
import Link from "next/link";
import {
  GATEWAY_METHODS,
  NemoClawBridge,
  type ConnectedPayload,
} from "@/lib/nemoclaw-bridge";
import { AgentFactory } from "@/components/AgentFactory";
import { MemorySkillsPanels } from "@/components/MemorySkillsPanels";
import {
  FactoryAgentsProvider,
  useFactoryAgents,
  extractSessionOptions,
} from "@/context/FactoryAgentsContext";

type OpenCfg = {
  wsUrl: string;
  token: string;
  protocolVersion: number;
  wsPath: string;
  autoApproveDevicePair?: boolean;
  gatewayClientId?: string;
  gatewayClientMode?: string;
};

type ClearanceItem = {
  key: string;
  kind: "exec" | "plugin";
  event: string;
  payload: Record<string, unknown>;
};

type PairFeedItem = {
  id: string;
  kind: "approved" | "skipped";
  requestId: string;
  label: string;
};

type GatewayFeedItem = {
  id: string;
  at: number;
  agent: string;
  text: string;
};

function hasUsableGatewayToken(token: string | undefined): boolean {
  if (!token) return false;
  const s = token.trim();
  if (!s) return false;
  const lower = s.toLowerCase();
  if (lower.includes("replace")) return false;
  if (lower.includes("indsÃ¦t") || lower.includes("indsaet")) return false;
  if (lower.includes("din_token") || lower.includes("her-limer")) return false;
  if (lower === "changeme" || lower === "secret") return false;
  return true;
}

function joinWsUrl(base: string, path: string) {
  if (!path) return base;
  const b = base.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : "/" + path;
  return b + p;
}

function pickId(p: Record<string, unknown>): string {
  if (typeof p.id === "string" && p.id) return p.id;
  if (typeof p.requestId === "string" && p.requestId) return p.requestId;
  return "";
}

function resolveMethodForKind(kind: ClearanceItem["kind"]): string {
  return kind === "plugin"
    ? GATEWAY_METHODS.pluginResolve
    : GATEWAY_METHODS.execResolve;
}

function canShowClearanceButtons(
  c: ClearanceItem,
  methodsStrict: boolean,
  gatewayMethods: string[],
): boolean {
  if (!pickId(c.payload)) return false;
  if (!methodsStrict) return true;
  return gatewayMethods.includes(resolveMethodForKind(c.kind));
}

function titleFor(c: ClearanceItem): string {
  const p = c.payload;
  if (c.kind === "plugin" && typeof p.title === "string") return p.title;
  if (typeof p.commandText === "string") return p.commandText.slice(0, 120);
  if (typeof p.command === "string") return p.command;
  return c.event;
}

function descFor(c: ClearanceItem): string {
  const p = c.payload;
  if (c.kind === "plugin" && typeof p.description === "string") return p.description;
  if (typeof p.resolvedPath === "string") return p.resolvedPath;
  if (typeof p.host === "string") return p.host;
  return JSON.stringify(p).slice(0, 280);
}

function rpcErrString(e: unknown) {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) {
    const m = /** @type {{ message?: unknown }} */ (e).message;
    if (typeof m === "string") return m;
  }
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

function truncateStr(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n) + "...";
}

function safeJsonStr(x: unknown): string {
  try {
    return typeof x === "string" ? x : JSON.stringify(x);
  } catch {
    return "";
  }
}

function guessAgentLabel(payload: unknown, eventName: string): string {
  const blob = (eventName + " " + safeJsonStr(payload)).toLowerCase();
  if (blob.includes("alpha")) return "Alpha";
  if (blob.includes("eugene") || blob.includes("eugen")) return "Eugene";
  if (blob.includes("research")) return "Alpha";
  return "Gateway";
}

function summarizeGatewayFrame(msg: unknown): { agent: string; text: string } | null {
  if (!msg || typeof msg !== "object") return null;
  const m = msg as Record<string, unknown>;
  const t = m.type;

  if (t === "event") {
    const ev = typeof m.event === "string" ? m.event : "";
    if (ev === "connect.challenge") return null;
    const payload = m.payload;
    const agent = guessAgentLabel(payload, ev);
    const hint = truncateStr(safeJsonStr(payload), 180);
    return { agent, text: ev + (hint ? " | " + hint : "") };
  }

  if (t === "req") return null;

  if (t === "res") {
    if (m.ok !== false) return null;
    return {
      agent: "Gateway",
      text: "RPC error: " + truncateStr(safeJsonStr(m.error), 140),
    };
  }

  return { agent: "Gateway", text: truncateStr(safeJsonStr(msg), 220) };
}

const SUB_AGENTS = [
  { id: "alpha", name: "Alpha", role: "Research" },
  { id: "bravo", name: "Bravo", role: "Build" },
  { id: "charlie", name: "Charlie", role: "Verify" },
] as const;

function FactoryDashboardInner() {
  const bridgeRef = useRef<NemoClawBridge | null>(null);
  const [cfg, setCfg] = useState<OpenCfg | null>(null);
  const [cfgErr, setCfgErr] = useState<string | null>(null);
  const [socketPhase, setSocketPhase] = useState<
    "idle" | "connecting" | "live" | "error"
  >("idle");
  const [pairing, setPairing] = useState<{
    reason: string;
    hint: string;
  } | null>(null);
  const [lastClose, setLastClose] = useState<string>("");
  const [clearances, setClearances] = useState<ClearanceItem[]>([]);
  const [gatewayMethods, setGatewayMethods] = useState<string[]>([]);
  const [methodsStrict, setMethodsStrict] = useState(false);
  const [pairFeed, setPairFeed] = useState<PairFeedItem[]>([]);
  const [sessionsJson, setSessionsJson] = useState<string | null>(null);
  const [sessionsErr, setSessionsErr] = useState<string | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [gatewayFeed, setGatewayFeed] = useState<GatewayFeedItem[]>([]);
  const { bindGateway, ingestGatewayFrame } = useFactoryAgents();

  const sessionOptions = useMemo(() => {
    if (!sessionsJson) return [];
    try {
      return extractSessionOptions(JSON.parse(sessionsJson));
    } catch {
      return [];
    }
  }, [sessionsJson]);

  useEffect(() => {
    if (socketPhase !== "live") {
      bindGateway(null);
      return;
    }
    const b = bridgeRef.current;
    if (!b) {
      bindGateway(null);
      return;
    }
    bindGateway({
      rpc: (method, params) => b.rpc(method, params),
      methods: new Set(gatewayMethods),
      methodsStrict,
    });
    return () => bindGateway(null);
  }, [socketPhase, gatewayMethods, methodsStrict, bindGateway]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/openclaw", { cache: "no-store" });
        if (!r.ok) throw new Error("openclaw api " + r.status);
        const j = (await r.json()) as OpenCfg;
        if (!cancelled) setCfg(j);
      } catch (e) {
        if (!cancelled)
          setCfgErr(e instanceof Error ? e.message : "Kunne ikke lÃ¦se openclaw.json");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pushPairFeed = useCallback((item: Omit<PairFeedItem, "id">) => {
    const id = "pf-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    setPairFeed((prev) => [{ ...item, id }, ...prev].slice(0, 12));
  }, []);

  const refreshGatewaySessions = useCallback((opts?: { silent?: boolean }) => {
    const b = bridgeRef.current;
    if (!b?.connected) return;
    const silent = Boolean(opts?.silent);
    if (!silent) {
      setSessionsLoading(true);
      setSessionsErr(null);
    }
    void b.rpc("sessions.list", {}).then(
      (data) => {
        setSessionsJson(JSON.stringify(data, null, 2));
        if (!silent) setSessionsLoading(false);
      },
      (e) => {
        if (!silent) {
          setSessionsErr(rpcErrString(e));
          setSessionsJson(null);
          setSessionsLoading(false);
        }
      },
    );
  }, []);

  useEffect(() => {
    if (socketPhase !== "live") return;
    const t = window.setInterval(() => {
      refreshGatewaySessions({ silent: true });
    }, 12000);
    return () => clearInterval(t);
  }, [socketPhase, refreshGatewaySessions]);

  const connect = useCallback(async () => {
    let live: OpenCfg | null = null;
    try {
      const r = await fetch("/api/openclaw", { cache: "no-store" });
      if (!r.ok) throw new Error("openclaw api " + r.status);
      live = (await r.json()) as OpenCfg;
      setCfg(live);
      setCfgErr(null);
    } catch (e) {
      setCfgErr(e instanceof Error ? e.message : "Kunne ikke lÃ¦se openclaw.json");
      setSocketPhase("idle");
      return;
    }
    if (!live || !hasUsableGatewayToken(live.token)) {
      setSocketPhase("idle");
      return;
    }
    setPairing(null);
    setGatewayMethods([]);
    setMethodsStrict(false);
    setGatewayFeed([]);
    setSocketPhase("connecting");
    const url = joinWsUrl(live.wsUrl, live.wsPath);
    const b = new NemoClawBridge({
      url,
      token: live.token,
      protocolMin: live.protocolVersion,
      protocolMax: live.protocolVersion,
      autoApproveDevicePair: live.autoApproveDevicePair !== false,
      gatewayClientId: live.gatewayClientId,
      gatewayClientMode: live.gatewayClientMode,
    });
    bridgeRef.current = b;

    b.on("connected", (d) => {
      const payload = d as ConnectedPayload;
      setSocketPhase("live");
      setPairing(null);
      setGatewayMethods(payload.methods ?? []);
      setMethodsStrict(Boolean(payload.methodsStrict));
      refreshGatewaySessions();
      void bridgeRef.current?.rpc("sessions.subscribe", {}).catch(() => {});
    });
    b.on("pairing-required", (d) => {
      const x = d as { reason?: string; hint?: string };
      setPairing({
        reason: x.reason || "Pairing / policy (1008)",
        hint: x.hint || "",
      });
      setSocketPhase("error");
    });
    b.on("connect-error", (e) => {
      const err = e as { message?: string };
      const msg = typeof err.message === "string" ? err.message : "Connect afvist af gateway";
      setPairing({
        reason: msg,
        hint:
          "Tjek gatewayClientId + gatewayClientMode (fx cli/cli, webchat/webchat, openclaw-control-ui/ui), token og allowedOrigins.",
      });
      setSocketPhase("error");
    });
    b.on("close", (d) => {
      const x = d as { code?: number; reason?: string };
      setLastClose("code " + (x.code ?? "?") + " " + (x.reason || ""));
      setGatewayMethods([]);
      setMethodsStrict(false);
      setSessionsJson(null);
      setSessionsErr(null);
      setSessionsLoading(false);
      setGatewayFeed([]);
    });
    b.on("clearance", (d) => {
      const x = d as { kind: "exec" | "plugin"; event: string; payload: unknown };
      const payload =
        x.payload && typeof x.payload === "object"
          ? (x.payload as Record<string, unknown>)
          : {};
      const id = pickId(payload);
      const key = id || x.event + "-" + Date.now();
      setClearances((prev) => {
        if (id && prev.some((p) => pickId(p.payload) === id)) return prev;
        return [
          ...prev,
          { key, kind: x.kind, event: x.event, payload },
        ];
      });
    });
    b.on("frame", (raw) => {
      ingestGatewayFrame(raw);
      if (raw && typeof raw === "object") {
        const fr = raw as Record<string, unknown>;
        if (fr.type === "event") {
          const ev = typeof fr.event === "string" ? fr.event : "";
          if (ev.includes("sessions.changed")) refreshGatewaySessions({ silent: true });
        }
      }
      const line = summarizeGatewayFrame(raw);
      if (!line) return;
      const id = "gf-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
      setGatewayFeed((prev) =>
        [{ id, at: Date.now(), agent: line.agent, text: line.text }, ...prev].slice(0, 80),
      );
    });

    b.on("device-pair-auto-approved", (d) => {
      const x = d as { requestId?: string };
      const requestId = typeof x.requestId === "string" ? x.requestId : "";
      pushPairFeed({
        kind: "approved",
        requestId,
        label: "device.pair.approve sendt (auto)",
      });
    });
    b.on("device-pair-auto-skipped", (d) => {
      const x = d as { requestId?: string; reason?: string };
      const requestId = typeof x.requestId === "string" ? x.requestId : "";
      pushPairFeed({
        kind: "skipped",
        requestId,
        label: x.reason || "auto-godkendelse sprunget over",
      });
    });

    b.connect();
  }, [pushPairFeed, refreshGatewaySessions, ingestGatewayFrame]);

  const disconnect = useCallback(() => {
    bridgeRef.current?.disconnect();
    bridgeRef.current = null;
    setSocketPhase("idle");
    setGatewayMethods([]);
    setMethodsStrict(false);
    setSessionsJson(null);
    setSessionsErr(null);
    setSessionsLoading(false);
    setGatewayFeed([]);
  }, []);

  const resolveOne = useCallback((c: ClearanceItem, decision: "approve" | "deny") => {
    const id = pickId(c.payload);
    if (!id) return;
    const ok = bridgeRef.current?.resolveClearance(c.kind, id, decision);
    if (ok) setClearances((prev) => prev.filter((x) => x.key !== c.key));
  }, []);

  const eugeneStatus = useMemo(() => {
    const pending = clearances.some((c) =>
      canShowClearanceButtons(c, methodsStrict, gatewayMethods),
    );
    if (pending) return "Venter pÃ¥ godkendelse";
    if (socketPhase === "live") return "TÃ¦nker";
    return "Isoleret i Sandkasse";
  }, [clearances, methodsStrict, gatewayMethods, socketPhase]);

  const subStatus = (i: number) => {
    if (socketPhase !== "live") return "Isoleret i Sandkasse";
    const pending = clearances.some((c) =>
      canShowClearanceButtons(c, methodsStrict, gatewayMethods),
    );
    if (pending && i === 0) return "Venter pÃ¥ godkendelse";
    if (pending) return "TÃ¦nker";
    return "TÃ¦nker";
  };

  const autoPairLabel =
    cfg?.autoApproveDevicePair !== false ? "Auto device.pair: ON" : "Auto device.pair: OFF";

  return (
    <div className="min-h-screen p-6 md:p-10 font-mono text-sm">
      <header className="mb-10 flex flex-col gap-4 border-b border-tf-border pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-1 text-xs uppercase tracking-[0.35em] text-cyan-400/80">
            NemoClaw Â· OpenShell
          </p>
          <h1 className="font-sans text-3xl font-bold tracking-tight text-white md:text-4xl">
            The Factory
          </h1>
          <p className="mt-2 max-w-xl text-slate-400">
            Overblik over agenter og godkendelser. Forbind med knappen til hÃ¸jre - du skal kun
            udfylde din gateway-kode i filen openclaw.json (se den grÃ¸nne boks).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {cfgErr && (
            <span className="flex items-center gap-2 rounded border border-tf-danger/50 bg-tf-danger/10 px-3 py-2 text-tf-danger">
              <AlertTriangle className="h-4 w-4" />
              {cfgErr}
            </span>
          )}
          {cfg && !hasUsableGatewayToken(cfg.token) && (
            <span className="flex items-center gap-2 rounded border border-tf-warn/50 bg-tf-warn/10 px-3 py-2 text-tf-warn">
              <ShieldAlert className="h-4 w-4" />
              Du mangler din kode i openclaw.json (se boksen Start her)
            </span>
          )}
          {socketPhase === "live" && methodsStrict && (
            <span
              className="max-w-[min(100%,280px)] truncate rounded border border-slate-600 bg-slate-900/80 px-2 py-1 text-[10px] text-slate-400"
              title={gatewayMethods.join(", ")}
            >
              hello-ok: {gatewayMethods.length} metoder annonceret
            </span>
          )}
          {socketPhase === "live" && (
            <span className="flex items-center gap-1 rounded border border-cyan-500/30 bg-cyan-500/5 px-2 py-1 text-[10px] text-cyan-300/90">
              <CheckCircle2 className="h-3 w-3" />
              {autoPairLabel}
            </span>
          )}
          {socketPhase === "idle" || socketPhase === "error" ? (
            <button
              type="button"
              onClick={connect}
              disabled={!cfg || !hasUsableGatewayToken(cfg.token)}
              className="flex items-center gap-2 rounded border border-cyan-500/50 bg-cyan-500/10 px-4 py-2 font-sans text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-40"
            >
              <Link2 className="h-4 w-4" />
              Forbind gateway
            </button>
          ) : (
            <button
              type="button"
              onClick={disconnect}
              className="flex items-center gap-2 rounded border border-slate-600 bg-slate-800/50 px-4 py-2 text-slate-200 hover:bg-slate-800"
            >
              <Unplug className="h-4 w-4" />
              Afbryd
            </button>
          )}
          <span
            className={
              "flex items-center gap-2 rounded border px-3 py-2 " +
              (socketPhase === "live"
                ? "border-tf-ok/40 bg-tf-ok/10 text-tf-ok"
                : socketPhase === "connecting"
                  ? "border-tf-warn/40 bg-tf-warn/10 text-tf-warn"
                  : "border-slate-600 bg-tf-panel text-slate-400")
            }
          >
            <Radio className="h-4 w-4" />
            {socketPhase === "live"
              ? "Gateway LIVE"
              : socketPhase === "connecting"
                ? "Handshakeâ€¦"
                : "Offline"}
          </span>
        </div>
      </header>

      {(socketPhase === "idle" || socketPhase === "error") && (
        <>
          <div className="mb-3 flex flex-wrap justify-end gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-950/40 px-4 py-2 font-sans text-sm text-amber-100 transition hover:border-amber-400/60 hover:bg-amber-950/70"
          >
            <Factory className="h-4 w-4" />
            The Factory
          </Link>
          <Link
            href="/manual"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-500/50 bg-slate-800/60 px-4 py-2 font-sans text-sm text-slate-200 transition hover:border-cyan-500/40 hover:bg-slate-800 hover:text-cyan-200"
          >
            <BookOpen className="h-4 w-4" />
            Manual
          </Link>
        </div>
        <section className="mb-8 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-6 font-sans shadow-[0_0_32px_-8px_rgba(52,211,153,0.2)]">
          <h2 className="text-lg font-semibold text-emerald-200">
            Start her - det eneste du normalt skal gÃ¸re selv
          </h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-base leading-relaxed text-slate-200">
            <li>
              Ã…bn filen openclaw.json i projektmappen (samme rod som dette repo). (Se ogsÃ¥ START_HER.txt.)
            </li>
            <li>
              Skriv din gateway-adgangskode ved authToken (inden for anfÃ¸rselstegn).
            </li>
            <li>Gem filen. GenindlÃ¦s siden i browseren.</li>
            <li>SÃ¸rg for at gatewayen kÃ¸rer (port 18789 er allerede sat).</li>
            <li>Klik Forbind gateway.</li>
          </ol>
        </section>
        </>
      )}

      {pairFeed.length > 0 && (
        <section className="mb-6 rounded-lg border border-cyan-500/25 bg-cyan-500/5 p-4">
          <p className="mb-2 font-sans text-xs font-semibold uppercase tracking-wider text-cyan-300/90">
            Device pairing (auto)
          </p>
          <ul className="space-y-1 text-xs text-slate-400">
            {pairFeed.map((p) => (
              <li key={p.id} className="flex flex-wrap gap-2">
                <span
                  className={
                    p.kind === "approved" ? "text-tf-ok" : "text-tf-warn"
                  }
                >
                  [{p.kind === "approved" ? "OK" : "SKIP"}]
                </span>
                <code className="text-slate-500">{p.requestId || "(ukendt)"}</code>
                <span>{p.label}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {pairing && (
        <section className="mb-8 rounded-lg border border-tf-warn/60 bg-gradient-to-r from-tf-warn/10 to-transparent p-5">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-6 w-6 shrink-0 text-tf-warn" />
            <div>
              <h2 className="font-sans text-lg font-semibold text-tf-warn">
                Pairing pÃ¥krÃ¦vet (1008 / policy)
              </h2>
              <p className="mt-1 text-slate-300">{pairing.reason}</p>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">{pairing.hint}</p>
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border border-tf-border bg-tf-panel/60 p-6 shadow-[0_0_40px_-12px_rgba(0,229,255,0.25)] backdrop-blur-sm">
          <div className="mb-6 flex items-center gap-2 font-sans text-lg text-cyan-300">
            <Users className="h-5 w-5" />
            War Room
          </div>
          <ul className="space-y-4">
            <li className="flex items-start justify-between gap-4 rounded-lg border border-cyan-500/30 bg-black/30 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded bg-cyan-500/20 p-2 text-cyan-300">
                  <Cpu className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-sans text-base font-semibold text-white">Eugene</p>
                  <p className="text-xs text-slate-500">Top-agent Â· se IDENTITY.md</p>
                </div>
              </div>
              <span className="shrink-0 rounded border border-slate-600 bg-slate-900/80 px-2 py-1 text-xs text-cyan-200">
                {eugeneStatus}
              </span>
            </li>
            {SUB_AGENTS.map((a, idx) => (
              <li
                key={a.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-slate-700/80 bg-black/20 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded bg-slate-700/50 p-2 text-slate-300">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-sans text-sm font-medium text-slate-200">{a.name}</p>
                    <p className="text-xs text-slate-500">{a.role}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded border border-slate-600 px-2 py-1 text-xs text-slate-300">
                  {subStatus(idx)}
                </span>
              </li>
            ))}
          </ul>
          {lastClose ? (
            <p className="mt-4 text-xs text-slate-600">Sidste luk: {lastClose}</p>
          ) : null}
        </section>

        <section className="rounded-xl border border-red-500/30 bg-tf-panel/80 p-6 shadow-[0_0_48px_-16px_rgba(255,51,102,0.2)]">
          <div className="mb-6 flex items-center gap-2 font-sans text-lg text-red-300">
            <Shield className="h-5 w-5" />
            Clearance Room
          </div>
          {clearances.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-700 py-16 text-center text-slate-500">
              <Skull className="h-10 w-10 opacity-40" />
              <p>Ingen aktive permission requests.</p>
              <p className="max-w-md text-xs">
                NÃ¥r NemoClaw/OpenShell blokerer netvÃ¦rks- eller exec-handlinger, vises de her som
                Clearance Cards. APPROVE/DENY vises kun hvis hello-ok annoncerer den tilhÃ¸rende
                resolve-metode (tom liste = antag fuld support).
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {clearances.map((c) => {
                const showButtons = canShowClearanceButtons(
                  c,
                  methodsStrict,
                  gatewayMethods,
                );
                const needed = resolveMethodForKind(c.kind);
                return (
                  <li
                    key={c.key}
                    className="rounded-lg border border-red-500/40 bg-black/40 p-4"
                  >
                    <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-red-300/90">
                      <Terminal className="h-4 w-4" />
                      {c.kind} Â· {c.event}
                    </div>
                    <h3 className="font-sans text-base font-semibold text-white">
                      {titleFor(c)}
                    </h3>
                    <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-400">
                      {descFor(c)}
                    </p>
                    {methodsStrict && !gatewayMethods.includes(needed) && (
                      <p className="mt-3 text-xs text-tf-warn">
                        Gateway annoncerer ikke <code className="text-tf-warn">{needed}</code>.
                        Kun visning â€” brug evt. openshell term eller opgrader gateway.
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {showButtons ? (
                        <>
                          <button
                            type="button"
                            onClick={() => resolveOne(c, "approve")}
                            disabled={!pickId(c.payload)}
                            className="rounded border border-tf-ok/60 bg-tf-ok/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-tf-ok hover:bg-tf-ok/25 disabled:opacity-30"
                          >
                            APPROVE
                          </button>
                          <button
                            type="button"
                            onClick={() => resolveOne(c, "deny")}
                            disabled={!pickId(c.payload)}
                            className="rounded border border-tf-danger/60 bg-tf-danger/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-tf-danger hover:bg-tf-danger/25 disabled:opacity-30"
                          >
                            DENY
                          </button>
                        </>
                      ) : pickId(c.payload) ? (
                        <span className="text-xs text-slate-500">
                          Ingen resolve-knapper (manglende id eller metode).
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">
                          Mangler id i payload â€” kan ikke resolve.
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <AgentFactory
          socketPhase={socketPhase}
          sessionOptions={sessionOptions}
          onRefreshSessions={refreshGatewaySessions}
          sessionsLoading={sessionsLoading}
          gatewayMethods={gatewayMethods}
          methodsStrict={methodsStrict}
        />

        <section className="rounded-xl border border-emerald-500/30 bg-tf-panel/50 p-6 lg:col-span-2">
          <div className="mb-3 flex items-center gap-2 font-sans text-lg text-emerald-300">
            <Radio className="h-5 w-5 shrink-0" />
            Gateway live (WebSocket)
          </div>
          <p className="mb-4 text-xs leading-relaxed text-slate-500">
            Alt hvad gatewayen sender, vises her via{" "}
            <code className="text-slate-400">frame</code> i bridgen. Eugene/Alpha-mærker er heuristik (tekst i event/payload) — hvis OpenClaw ikke sender agent-navne, vil alt stå som Gateway. Tilføj evt. agent-id i dine prompts så feedet kan skelne.
          </p>
          {socketPhase !== "live" ? (
            <p className="text-sm text-slate-500">Forbind for at se live feed.</p>
          ) : gatewayFeed.length === 0 ? (
            <p className="text-sm text-slate-500">
              Ingen events endnu (eller kun støj vi filtrerer). Kør en agent — så dukker rækker op her.
            </p>
          ) : (
            <ul className="max-h-64 space-y-2 overflow-y-auto rounded border border-slate-700/80 bg-black/40 p-3 text-xs">
              {gatewayFeed.map((row) => (
                <li
                  key={row.id}
                  className="flex gap-2 border-b border-slate-800/80 pb-2 last:border-0 last:pb-0"
                >
                  <span
                    className={
                      "w-20 shrink-0 rounded px-1.5 py-0.5 text-center font-sans text-[10px] uppercase " +
                      (row.agent === "Alpha"
                        ? "bg-violet-500/20 text-violet-200"
                        : row.agent === "Eugene"
                          ? "bg-cyan-500/20 text-cyan-200"
                          : "bg-slate-700/50 text-slate-400")
                    }
                  >
                    {row.agent}
                  </span>
                  <span className="min-w-0 flex-1 break-words text-slate-300">{row.text}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-cyan-500/25 bg-tf-panel/40 p-6 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-sans text-lg text-cyan-300">
              <ListTree className="h-5 w-5 shrink-0" />
              Aktive sessioner
            </div>
            <button
              type="button"
              onClick={() => refreshGatewaySessions()}
              disabled={socketPhase !== "live" || sessionsLoading}
              className="flex items-center gap-2 rounded border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 font-sans text-xs text-cyan-200 transition hover:bg-cyan-500/20 disabled:opacity-40"
            >
              <RefreshCw
                className={"h-4 w-4 shrink-0 " + (sessionsLoading ? "animate-spin" : "")}
              />
              Opdater (sessions.list)
            </button>
          </div>
          <p className="mb-3 text-xs leading-relaxed text-slate-500">
            Opdateres automatisk ca. hvert 12. sekund (og ved sessions.changed). RPC over WebSocket efter hello-ok â€” <code className="text-slate-400">sessions.list</code> som i
            gateway-protokollen. Koden ligger i <code className="text-slate-400">nemoclaw-bridge.js</code> (
            <code className="text-slate-400">rpc()</code>), ikke i et separat backend-script.
          </p>
          {socketPhase !== "live" ? (
            <p className="text-sm text-slate-500">Forbind til gateway for at hente sessionlisten.</p>
          ) : sessionsErr ? (
            <p className="whitespace-pre-wrap text-sm text-tf-warn">{sessionsErr}</p>
          ) : sessionsLoading && !sessionsJson ? (
            <p className="text-sm text-slate-500">Henter sessionerâ€¦</p>
          ) : sessionsJson ? (
            <pre className="max-h-[28rem] overflow-auto rounded border border-slate-700 bg-black/50 p-4 text-xs leading-relaxed text-slate-300">
              {sessionsJson}
            </pre>
          ) : (
            <p className="text-sm text-slate-500">Ingen data endnu.</p>
          )}
        </section>

        <MemorySkillsPanels />
      </div>

      <footer className="mt-12 flex items-center gap-2 border-t border-tf-border pt-6 text-xs text-slate-600">
        <Activity className="h-4 w-4" />
        The Factory Â· OpenClaw protocol v3 handshake Â· NemoClaw sandkasse
      </footer>
    </div>
  );
}



export default function FactoryDashboard() {
  return (
    <FactoryAgentsProvider>
      <FactoryDashboardInner />
    </FactoryAgentsProvider>
  );
}




