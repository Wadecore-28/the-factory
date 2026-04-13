export type NemoClawBridgeOptions = {
  url: string;
  token?: string;
  protocolMin?: number;
  protocolMax?: number;
  challengeWaitMs?: number;
  autoApproveDevicePair?: boolean;
  gatewayClientId?: string;
  /** OpenClaw connect.client.mode: cli | ui | webchat | backend | node | probe | test */
  gatewayClientMode?: string;
};

export type ConnectedPayload = {
  hello: unknown;
  methods: string[];
  methodsStrict: boolean;
};

export class NemoClawBridge {
  constructor(options: NemoClawBridgeOptions);
  on(event: string, fn: (data?: unknown) => void): () => void;
  connect(): void;
  disconnect(emitClose?: boolean): void;
  resolveClearance(
    kind: "exec" | "plugin",
    id: string,
    decision: "approve" | "deny",
  ): boolean;
  approveDevicePair(requestId: string): boolean;
  supportsMethod(method: string): boolean;
  supportsClearanceKind(kind: "exec" | "plugin"): boolean;
  resolveMethodForKind(kind: "exec" | "plugin"): string;
  getGatewayMethods(): string[];
  rpc(method: string, params?: Record<string, unknown>, timeoutMs?: number): Promise<unknown>;
  readonly connected: boolean;
}

export function isPairingCloseCode(code: number): boolean;

export const GATEWAY_METHODS: {
  readonly execResolve: string;
  readonly pluginResolve: string;
  readonly pairApprove: string;
};
