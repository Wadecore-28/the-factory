"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FabricWorkspaceCanvas } from "./FabricWorkspaceCanvas";
import type { WorkspaceCell } from "./types";

type NavId =
  | "options"
  | "approvals"
  | "activity"
  | "agents"
  | "skills"
  | "memory"
  | "manual"
  | "gateway";

type NavItem = { id: NavId; label: string; sub?: string; href?: string };

const NAV_ITEMS: NavItem[] = [
  { id: "options", label: "OPTIONS", sub: "Indstillinger" },
  { id: "approvals", label: "GODKENDELSER" },
  { id: "activity", label: "AKTIVITET" },
  { id: "agents", label: "AGENTER" },
  { id: "skills", label: "SKILLS" },
  { id: "memory", label: "MEMORY" },
  { id: "manual", label: "MANUAL", href: "/manual" },
];

export type FabricAgentProfile = {
  key: string;
  displayName: string;
  level: number;
  xp: number;
  xpToNext: number;
  revenueUsd: number;
};

const MOCK_AGENTS: Record<string, FabricAgentProfile> = {
  eugene: {
    key: "eugene",
    displayName: "EUGENE",
    level: 7,
    xp: 6700,
    xpToNext: 3300,
    revenueUsd: 1250,
  },
  nexus: {
    key: "nexus",
    displayName: "NEXUS-3",
    level: 4,
    xp: 2100,
    xpToNext: 1900,
    revenueUsd: 482.5,
  },
  forge: {
    key: "forge",
    displayName: "FORGE",
    level: 12,
    xp: 8900,
    xpToNext: 1100,
    revenueUsd: 3201.99,
  },
  spark: {
    key: "spark",
    displayName: "SPARK",
    level: 2,
    xp: 400,
    xpToNext: 600,
    revenueUsd: 0,
  },
  void_: {
    key: "void_",
    displayName: "VOID",
    level: 9,
    xp: 7200,
    xpToNext: 2800,
    revenueUsd: 8999,
  },
  pulse: {
    key: "pulse",
    displayName: "PULSE",
    level: 5,
    xp: 5000,
    xpToNext: 5000,
    revenueUsd: 333.33,
  },
};

const WORKSPACE_CELLS: WorkspaceCell[] = [
  { id: "w1", name: "EUGENE", color: "#dc2626", agentKey: "eugene" },
  { id: "w2", name: "NEXUS-3", color: "#a855f7", agentKey: "nexus" },
  { id: "w3", name: "FORGE", color: "#22c55e", agentKey: "forge" },
  { id: "w4", name: "SPARK", color: "#eab308", agentKey: "spark" },
  { id: "w5", name: "VOID", color: "#06b6d4", agentKey: "void_" },
  { id: "w6", name: "PULSE", color: "#f97316", agentKey: "pulse" },
  { id: "w7", name: "SLOT 7", color: "#64748b", agentKey: null },
  { id: "w8", name: "SLOT 8", color: "#78716c", agentKey: null },
];

function formatMoney(usd: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(usd);
}

function xpPercent(agent: FabricAgentProfile) {
  const t = agent.xp + agent.xpToNext;
  if (t <= 0) return 0;
  return Math.round((agent.xp / t) * 100);
}

function tillNextPercent(agent: FabricAgentProfile) {
  return 100 - xpPercent(agent);
}

export default function TheFabric() {
  const [activeNav, setActiveNav] = useState<NavId>("agents");
  const [gatewayOpen, setGatewayOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string>("eugene");
  const [chatDraft, setChatDraft] = useState("");

  const agent = MOCK_AGENTS[selectedKey] ?? MOCK_AGENTS.eugene;
  const pct = xpPercent(agent);
  const nextPct = tillNextPercent(agent);

  const sectionHint = useMemo(() => {
    const map: Record<NavId, string> = {
      options: "Systemkonfiguration (placeholder).",
      approvals: "Godkend eller afvis Agent-opgaver (placeholder).",
      activity: "Tidslinje med datofilter (placeholder).",
      agents: "Vælg et kontor i fabrikken for at skifte Agent.",
      skills: "Aktive evner pr. Agent (placeholder).",
      memory: "Husk / glem — memory banks (placeholder).",
      manual: "Åbn MANUAL for komplet guide.",
      gateway: "Forbind eksterne APIer (placeholder).",
    };
    return map[activeNav];
  }, [activeNav]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-zinc-950 text-zinc-100">
      <div className="flex min-h-0 flex-1 flex-col xl:flex-row xl:overflow-hidden">
        <aside className="order-2 flex w-full shrink-0 flex-col border-zinc-800 bg-zinc-950 xl:order-1 xl:h-auto xl:w-[280px] xl:max-w-[280px] xl:border-r">
          <header className="border-b border-red-900/50 bg-gradient-to-br from-red-700 to-red-950 px-4 py-5 shadow-[0_0_40px_rgba(220,38,38,0.25)]">
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-red-200/80">
              Control
            </p>
            <h1 className="mt-1 font-sans text-2xl font-bold tracking-tight text-white drop-shadow-md">
              THE FACTORY
            </h1>
          </header>
          <nav className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
            {NAV_ITEMS.map((item) => {
              const active = activeNav === item.id;
              const pillBase =
                "block w-full rounded-full border-2 px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide transition ";
              const pillOn =
                "border-red-500 bg-red-950/80 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.35)]";
              const pillOff =
                "border-red-800/60 bg-zinc-900/50 text-zinc-300 hover:border-red-600 hover:bg-zinc-900";
              const inner = (
                <>
                  <span className="block">{item.label}</span>
                  {item.sub ? (
                    <span className="mt-0.5 block text-[10px] font-normal normal-case tracking-normal text-zinc-500">
                      {item.sub}
                    </span>
                  ) : null}
                </>
              );
              if (item.href) {
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setActiveNav(item.id)}
                    className={pillBase + (active ? pillOn : pillOff) + " text-left"}
                  >
                    {inner}
                  </Link>
                );
              }
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveNav(item.id)}
                  className={pillBase + (active ? pillOn : pillOff) + " text-left"}
                >
                  {inner}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setGatewayOpen(true);
                setActiveNav("gateway");
              }}
              className="rounded-full border-2 border-red-500 bg-red-600/90 px-4 py-3 font-mono text-xs font-bold uppercase tracking-wide text-white shadow-[0_0_24px_rgba(220,38,38,0.45)] transition hover:bg-red-500"
            >
              FORBIND GATEWAY
            </button>
          </nav>
          <footer className="border-t border-zinc-800/80 p-3 font-mono text-[10px] leading-relaxed text-zinc-500">
            {sectionHint}
          </footer>
        </aside>

        <main className="order-1 flex min-h-[42vh] min-w-0 flex-1 flex-col p-3 xl:order-2 xl:min-h-0 xl:p-4">
          <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-red-400/90">
              Workspace sandbox
            </h2>
            <span className="rounded border border-red-900/40 bg-black/40 px-2 py-0.5 font-mono text-[10px] text-zinc-500">
              8 celler
            </span>
          </div>
          <div className="min-h-0 flex-1">
            <FabricWorkspaceCanvas
              cells={WORKSPACE_CELLS}
              selectedKey={selectedKey}
              onSelectCell={(key) => {
                if (key) setSelectedKey(key);
              }}
            />
          </div>
        </main>

        <aside className="order-3 flex w-full shrink-0 flex-col border-zinc-800 bg-zinc-950 xl:w-[320px] xl:max-w-[320px] xl:border-l">
          <header className="border-b border-red-900/40 bg-zinc-900/80 px-4 py-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-red-400/80">
              Aktiv Agent
            </p>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <h2 className="truncate text-lg font-bold tracking-tight text-white">
                {agent.displayName}
              </h2>
              <span className="shrink-0 font-mono text-[10px] text-zinc-500">
                LV {agent.level}
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-zinc-400">AGENT-XP</p>
          </header>

          <div className="border-b border-red-900/30 bg-gradient-to-b from-red-950/40 to-zinc-950 px-4 py-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-red-300/90">
              Revenue
            </p>
            <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-red-100 drop-shadow-[0_0_12px_rgba(248,113,113,0.35)]">
              {formatMoney(agent.revenueUsd)}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">
              Real-world værdi for denne Agent (placeholder data).
            </p>
          </div>

          <div className="border-b border-zinc-800 px-4 py-4">
            <div className="flex justify-between font-mono text-[11px] text-zinc-400">
              <span>XP {pct}%</span>
              <span>Til næste level: {nextPct}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-700 to-red-400 transition-[width] duration-500 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col px-4 py-3">
            <p className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-red-400/90">
              CHAT WITH AGENT
            </p>
            <div className="mt-2 flex min-h-[180px] flex-1 flex-col overflow-hidden rounded-lg border-2 border-red-600/50 bg-black/50 shadow-[inset_0_0_24px_rgba(127,29,29,0.2)]">
              <div className="flex-1 space-y-3 overflow-y-auto p-3 font-mono text-xs">
                <div>
                  <span className="text-red-400">BOSS</span>
                  <p className="mt-1 rounded-md bg-zinc-900/80 p-2 text-zinc-200">
                    Status på gateway?
                  </p>
                </div>
                <div>
                  <span className="text-emerald-400">{agent.displayName}</span>
                  <p className="mt-1 rounded-md border border-red-900/30 bg-red-950/20 p-2 text-zinc-200">
                    Forbindelser er stabile. Klar til næste batch.
                  </p>
                </div>
              </div>
              <form
                className="flex gap-2 border-t border-red-900/30 p-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setChatDraft("");
                }}
              >
                <input
                  value={chatDraft}
                  onChange={(e) => setChatDraft(e.target.value)}
                  placeholder="Kommando..."
                  className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-md border-2 border-red-600 bg-red-700/90 px-3 py-2 font-mono text-[10px] font-bold uppercase text-white hover:bg-red-600"
                >
                  SKRIV HER
                </button>
              </form>
            </div>
          </div>
        </aside>
      </div>

      {gatewayOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="fabric-gateway-title"
        >
          <div className="w-full max-w-lg rounded-xl border-2 border-red-600 bg-zinc-950 p-6 shadow-[0_0_60px_rgba(220,38,38,0.35)]">
            <h2
              id="fabric-gateway-title"
              className="font-mono text-lg font-bold uppercase tracking-wide text-red-100"
            >
              Forbind Gateway
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Administrer eksterne API-forbindelser, integrationer og gateway-status. Placeholder —
              rigtig connect-flow kommer i næste iteration.
            </p>
            <ul className="mt-4 space-y-2 font-mono text-xs text-zinc-500">
              <li>- OpenClaw / bridge status: ukendt</li>
              <li>- Webhooks: ikke konfigureret</li>
              <li>- API nøgler: maskeret</li>
            </ul>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setGatewayOpen(false)}
                className="rounded-md border border-zinc-600 px-4 py-2 font-mono text-xs text-zinc-300 hover:bg-zinc-900"
              >
                Luk
              </button>
              <button
                type="button"
                className="rounded-md border-2 border-red-600 bg-red-700 px-4 py-2 font-mono text-xs font-bold uppercase text-white hover:bg-red-600"
              >
                Forbind (demo)
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
