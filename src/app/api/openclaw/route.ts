import { readFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export type OpenClawPublicConfig = {
  wsUrl: string;
  token: string;
  protocolVersion: number;
  wsPath: string;
  autoApproveDevicePair?: boolean;
  gatewayClientId?: string;
  gatewayClientMode?: string;
};

function envFallback(): OpenClawPublicConfig {
  const envAuto = process.env.OPENCLAW_AUTO_APPROVE_DEVICE_PAIR;
  const auto =
    envAuto === "0" || envAuto === "false"
      ? false
      : envAuto === "1" || envAuto === "true"
        ? true
        : undefined;
  const envClient = process.env.OPENCLAW_GATEWAY_CLIENT_ID?.trim();
  const envMode = process.env.OPENCLAW_GATEWAY_CLIENT_MODE?.trim();
  return {
    wsUrl: process.env.OPENCLAW_WS_URL || "ws://127.0.0.1:18789",
    token: process.env.OPENCLAW_GATEWAY_TOKEN || "",
    protocolVersion: 3,
    wsPath: "",
    ...(auto !== undefined ? { autoApproveDevicePair: auto } : {}),
    ...(envClient ? { gatewayClientId: envClient } : {}),
    ...(envMode ? { gatewayClientMode: envMode } : {}),
  };
}

async function loadConfig(): Promise<OpenClawPublicConfig> {
  let raw: string;
  try {
    raw = await readFile(join(process.cwd(), "openclaw.json"), "utf-8");
  } catch {
    return envFallback();
  }
  let j: Record<string, unknown>;
  try {
    j = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return envFallback();
  }
  const g = (j.gateway ?? j) as Record<string, unknown>;
  const port = typeof g.port === "number" ? g.port : 18789;
  const fileWsUrl = typeof g.wsUrl === "string" ? g.wsUrl : `ws://127.0.0.1:${port}`;
  const fileToken =
    typeof g.authToken === "string"
      ? g.authToken
      : typeof g.token === "string"
        ? g.token
        : "";
  const auto =
    typeof g.autoApproveDevicePair === "boolean" ? g.autoApproveDevicePair : undefined;
  const clientId =
    typeof g.gatewayClientId === "string" && g.gatewayClientId.trim()
      ? g.gatewayClientId.trim()
      : undefined;
  const clientMode =
    typeof g.gatewayClientMode === "string" && g.gatewayClientMode.trim()
      ? g.gatewayClientMode.trim()
      : undefined;
  const envWs = process.env.OPENCLAW_WS_URL?.trim();
  const envTok = process.env.OPENCLAW_GATEWAY_TOKEN?.trim();
  const trimmedFile = fileToken.trim();
  const token = trimmedFile || envTok || "";
  return {
    wsUrl: envWs || fileWsUrl,
    token,
    protocolVersion: typeof g.protocolVersion === "number" ? g.protocolVersion : 3,
    wsPath: typeof g.wsPath === "string" ? g.wsPath : "",
    ...(auto !== undefined ? { autoApproveDevicePair: auto } : {}),
    ...(clientId ? { gatewayClientId: clientId } : {}),
    ...(clientMode ? { gatewayClientMode: clientMode } : {}),
  };
}

export async function GET() {
  try {
    const c = await loadConfig();
    return NextResponse.json(c);
  } catch (e) {
    console.error("[api/openclaw]", e);
    return NextResponse.json(envFallback());
  }
}
