"use client";

import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import { Archive, Briefcase, Coffee, Cog, Radar, RefreshCw, ScanEye, Send, Sparkles } from "lucide-react";
import { useFactoryAgents, type AgentId } from "@/context/FactoryAgentsContext";
import { AgentBot } from "./AgentBot";

function GlassBadge({
  name,
  role,
  accentClass,
}: {
  name: string;
  role: string;
  accentClass: string;
}) {
  return (
    <div
      className={
        "pointer-events-none whitespace-nowrap rounded-full border border-white/18 px-2 py-1 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl " +
        accentClass
      }
      style={{
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 45%, rgba(0,0,0,0.22) 100%)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.22), 0 6px 28px rgba(0,0,0,0.38), 0 0 0 1px rgba(255,255,255,0.07)",
      }}
    >
      <span className="text-white/95">[ {name}</span>
      <span className="mx-1.5 text-white/35">|</span>
      <span className="text-white/70">{role} ]</span>
    </div>
  );
}

type AgentKey = "alpha" | "eugene" | "charlie" | "bravo";

export type AgentFactoryProps = {
  socketPhase: "idle" | "connecting" | "live" | "error";
  sessionOptions: { key: string; label: string }[];
  onRefreshSessions: () => void;
  sessionsLoading: boolean;
  gatewayMethods: string[];
  methodsStrict: boolean;
};

function statusLabel(atLounge: boolean, activity: "idle" | "working", task: string) {
  const place = atLounge ? "Lounge" : "Station";
  const act = activity === "working" ? "Arbejder" : "Idle";
  const t = task.length > 26 ? task.slice(0, 26) + "..." : task;
  return place + " · " + act + (activity === "working" ? " · " + t : "");
}

const STATION: Record<AgentKey, { left: string; bottom: string }> = {
  alpha: { left: "16%", bottom: "52%" },
  eugene: { left: "50%", bottom: "36%" },
  charlie: { left: "84%", bottom: "52%" },
  bravo: { left: "16%", bottom: "15%" },
};

const LOUNGE: Record<AgentKey, { left: string; bottom: string }> = {
  alpha: { left: "61%", bottom: "20%" },
  eugene: { left: "53%", bottom: "24%" },
  charlie: { left: "74%", bottom: "21%" },
  bravo: { left: "68%", bottom: "17%" },
};

const DELAY_TO_LOUNGE: Record<AgentKey, string> = {
  alpha: "0ms",
  eugene: "120ms",
  charlie: "240ms",
  bravo: "360ms",
};

const DELAY_TO_STATION: Record<AgentKey, string> = {
  alpha: "320ms",
  eugene: "200ms",
  charlie: "100ms",
  bravo: "0ms",
};

function AgentPlaced({
  agent,
  atLounge,
  name,
  role,
  accent,
  icon,
  variant,
  statusLine,
}: {
  agent: AgentKey;
  atLounge: boolean;
  name: string;
  role: string;
  accent: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  variant: "eugene" | "alpha" | "bravo" | "charlie";
  statusLine: string;
}) {
  const pos = atLounge ? LOUNGE[agent] : STATION[agent];
  const delay = atLounge ? DELAY_TO_LOUNGE[agent] : DELAY_TO_STATION[agent];
  return (
    <div
      className="absolute z-30 flex -translate-x-1/2 flex-col items-center gap-2"
      style={{
        left: pos.left,
        bottom: pos.bottom,
        transition:
          "left 2.75s cubic-bezier(0.45, 0, 0.2, 1), bottom 2.75s cubic-bezier(0.45, 0, 0.2, 1)",
        transitionDelay: delay,
      }}
    >
      <GlassBadge name={name} role={role} accentClass={accent} />
      <p className="pointer-events-none max-w-[140px] text-center text-[8px] leading-tight text-slate-400">
        {statusLine}
      </p>
      <AgentBot variant={variant} icon={icon} />
    </div>
  );
}

function ZoneShell({
  title,
  subtitle,
  borderClass,
  glowClass,
  children,
  className = "",
}: {
  title: string;
  subtitle: string;
  borderClass: string;
  glowClass: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "relative overflow-hidden rounded-[1.75rem] border bg-gradient-to-br from-white/[0.06] via-transparent to-black/30 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-[2px] " +
        borderClass +
        " " +
        className
      }
    >
      <div
        className={"pointer-events-none absolute -inset-px rounded-[1.75rem] opacity-40 blur-sm " + glowClass}
        aria-hidden
      />
      <div className="relative z-[1] mb-3 border-b border-white/10 pb-2">
        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">{title}</p>
        <p className="font-sans text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className="relative z-[1] min-h-[120px] flex-1">{children}</div>
    </div>
  );
}

export function AgentFactory({
  socketPhase,
  sessionOptions,
  onRefreshSessions,
  sessionsLoading,
  gatewayMethods,
  methodsStrict,
}: AgentFactoryProps) {
  const {
    agents,
    eugeneChat,
    selectedSessionKey,
    setSelectedSessionKey,
    sendToEugene,
    archiveEugeneLongTermMemory,
    eugeneLlmConfigured,
    setAgentZone,
    setAgentActivity,
    allToLounge,
    allToStations,
    markTaskDone,
    resetProgress,
    lastGatewayMirror,
  } = useFactoryAgents();

  const [draft, setDraft] = useState("");
  const [mirrorGw, setMirrorGw] = useState(false);
  const [sending, setSending] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [archiveNote, setArchiveNote] = useState<string | null>(null);

  const fabMode = useMemo(() => {
    const ids = ["eugene", "alpha", "bravo", "charlie"] as const;
    const lounge = ids.filter((id) => agents[id].zone === "lounge").length;
    const idle = ids.filter((id) => agents[id].activity === "idle").length;
    const working = 4 - idle;
    if (lounge === 4) return "SOCIAL / LOUNGE (alle)";
    if (working === 0) return "PRODUCTION · alle pauser";
    return "PRODUCTION · " + working + " aktive / " + idle + " idle";
  }, [agents]);

  const totalXp = useMemo(
    () => agents.eugene.xp + agents.alpha.xp + agents.bravo.xp + agents.charlie.xp,
    [agents],
  );

  const canMirror =
    socketPhase === "live" &&
    selectedSessionKey.trim().length > 0 &&
    (!methodsStrict ||
      gatewayMethods.includes("sessions.send") ||
      gatewayMethods.includes("chat.send"));

  const onSend = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      await sendToEugene(draft, { mirrorToGateway: mirrorGw && canMirror });
      setDraft("");
    } finally {
      setSending(false);
    }
  };

  const ctl = (id: AgentId, short: string) => (
    <div
      key={id}
      className="flex flex-wrap items-center gap-1 rounded-md border border-white/10 bg-black/50 px-1.5 py-1 text-[8px] text-slate-300"
    >
      <span className="font-semibold text-white/90">{short}</span>
      <button
        type="button"
        onClick={() => setAgentZone(id, "lounge")}
        className="rounded border border-emerald-500/30 px-1 py-0.5 text-emerald-200/90 hover:bg-emerald-500/10"
        title="Pause / lounge"
      >
        <Coffee className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={() => setAgentZone(id, "station")}
        className="rounded border border-cyan-500/30 px-1 py-0.5 text-cyan-200/90 hover:bg-cyan-500/10"
        title="Station"
      >
        <Briefcase className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={() => setAgentActivity(id, "working")}
        className="rounded border border-amber-500/30 px-1 text-amber-200/80 hover:bg-amber-500/10"
      >
        job
      </button>
      <button
        type="button"
        onClick={() => setAgentActivity(id, "idle")}
        className="rounded border border-slate-600 px-1 text-slate-400 hover:bg-slate-700/50"
      >
        idle
      </button>
      <button
        type="button"
        onClick={() => markTaskDone(id)}
        className="rounded border border-emerald-600/50 px-1 text-emerald-300 hover:bg-emerald-500/10"
      >
        done
      </button>
    </div>
  );

  return (
    <section
      className="relative overflow-hidden rounded-xl border border-cyan-500/25 lg:col-span-2 min-h-[900px] lg:min-h-[min(120vh,1200px)]"
    >
      <div
        className="absolute inset-0 bg-[#05070e]"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 95% 60% at 50% 100%, rgba(0, 229, 255, 0.1), transparent 58%),
            radial-gradient(ellipse 55% 45% at 12% 18%, rgba(168, 85, 247, 0.1), transparent 55%),
            radial-gradient(ellipse 50% 40% at 90% 22%, rgba(249, 115, 22, 0.07), transparent 52%),
            linear-gradient(185deg, #0a0f1a 0%, #05070e 45%, #03040a 100%)
          `,
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.11]"
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px)
          `,
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse 88% 75% at 50% 48%, black 15%, transparent 78%)",
        }}
      />

      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-cyan-500/[0.06] via-transparent to-transparent" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

      <div className="relative z-10 flex flex-col p-5 md:p-8">
        <header className="mb-4 flex flex-col gap-4 border-b border-white/10 pb-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="mb-1 font-sans text-[10px] font-semibold uppercase tracking-[0.42em] text-cyan-400/75">
              Agent ecosystem
            </p>
            <h2 className="font-sans text-2xl font-bold tracking-tight text-white md:text-3xl">The Factory</h2>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-500">
              Strukturerede zoner med holografiske arbejdsflader og et fælles pause-rum. Enheder arbejder ved stationerne
              og samles periodisk i lounge-zonen.
            </p>
          </div>
          <div className="flex w-full min-w-0 flex-col gap-3 xl:flex-row xl:items-stretch xl:justify-end">
            <div className="flex flex-col items-stretch gap-2 xl:items-end">
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={allToLounge}
                  className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-2 py-1 font-sans text-[9px] text-emerald-200 hover:bg-emerald-500/20"
                >
                  Alle → lounge
                </button>
                <button
                  type="button"
                  onClick={allToStations}
                  className="rounded-lg border border-cyan-500/35 bg-cyan-500/10 px-2 py-1 font-sans text-[9px] text-cyan-200 hover:bg-cyan-500/20"
                >
                  Alle → station
                </button>
                <button
                  type="button"
                  onClick={resetProgress}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 font-sans text-[9px] text-red-200/90 hover:bg-red-500/20"
                >
                  Nulstil XP/log
                </button>
              </div>
              <div className="flex max-w-full flex-wrap justify-end gap-1">
                {ctl("eugene", "Eu")}
                {ctl("alpha", "A")}
                {ctl("bravo", "B")}
                {ctl("charlie", "C")}
              </div>
              <div className="rounded-lg border border-white/12 bg-white/[0.05] px-3 py-1.5 font-mono text-[10px] text-slate-400 backdrop-blur-md">
                FAB-NET · {fabMode}
              </div>
            </div>
            <div className="min-h-0 min-w-0 flex-1 rounded-xl border border-amber-400/35 bg-black/70 p-3 shadow-[inset_0_0_24px_rgba(245,158,11,0.06)] backdrop-blur-md xl:max-w-md">
              <p className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-wider text-amber-200/90">
                Eugene · direktiv (chat her — ikke kun Telegram)
              </p>
              <div className="mb-2 flex flex-wrap gap-2">
                <select
                  value={selectedSessionKey}
                  onChange={(e) => setSelectedSessionKey(e.target.value)}
                  className="min-w-0 max-w-full flex-1 rounded border border-white/15 bg-black/60 px-2 py-1 text-[10px] text-slate-200"
                >
                  <option value="">Vælg OpenClaw-session (valgfri)</option>
                  {sessionOptions.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => onRefreshSessions()}
                  disabled={socketPhase !== "live" || sessionsLoading}
                  className="flex items-center gap-1 rounded border border-cyan-500/40 px-2 py-1 text-[9px] text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-40"
                >
                  <RefreshCw className={"h-3 w-3 " + (sessionsLoading ? "animate-spin" : "")} />
                  sessions
                </button>
              </div>
              <label className="mb-2 flex cursor-pointer flex-wrap items-center gap-2 text-[9px] text-slate-400">
                <input
                  type="checkbox"
                  checked={mirrorGw}
                  onChange={(e) => setMirrorGw(e.target.checked)}
                  className="rounded border-slate-600"
                />
                Send også til gateway (sessions.send / chat.send)
                {!canMirror && mirrorGw ? (
                  <span className="text-amber-400"> (kræver live + session + metode)</span>
                ) : null}
              </label>
              {lastGatewayMirror ? <p className="mb-2 text-[9px] text-slate-500">{lastGatewayMirror}</p> : null}
              {eugeneLlmConfigured ? (
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={archiving || eugeneChat.length === 0}
                    onClick={() => {
                      setArchiving(true);
                      setArchiveNote(null);
                      void archiveEugeneLongTermMemory().then((r) => {
                        setArchiving(false);
                        setArchiveNote(
                          r.ok ? "Langtidshukommelse arkiveret i Supabase." : (r.error ?? "Arkivering fejlede."),
                        );
                      });
                    }}
                    className="flex items-center gap-1 rounded border border-violet-500/40 bg-violet-500/10 px-2 py-1 text-[9px] text-violet-100 hover:bg-violet-500/20 disabled:opacity-40"
                    title="LLM opsummering → agent_memory"
                  >
                    <Archive className="h-3 w-3" />
                    Arkivér chat (Supabase)
                  </button>
                  {archiveNote ? <span className="text-[9px] text-slate-400">{archiveNote}</span> : null}
                </div>
              ) : null}
              <div className="mb-2 max-h-32 overflow-y-auto rounded border border-white/10 bg-black/50 p-2 text-[10px] leading-relaxed">
                {eugeneChat.length === 0 ? (
                  <p className="text-slate-500">
                    Skriv til Eugene. Nævn Alpha/Bravo/Charlie eller research/build/verify for delegation.
                  </p>
                ) : (
                  eugeneChat.map((m) => (
                    <p
                      key={m.id}
                      className={
                        m.role === "user"
                          ? "mb-1 text-cyan-200/90"
                          : m.role === "eugene"
                            ? "mb-1 text-amber-100/90"
                            : "mb-1 text-slate-500"
                      }
                    >
                      <span className="font-semibold">
                        {m.role === "user" ? "Dig" : m.role === "eugene" ? "Eugene" : "Sys"}:
                      </span>{" "}
                      {m.text}
                    </p>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={2}
                  placeholder="Opgave til Eugene..."
                  className="min-h-[44px] flex-1 resize-y rounded border border-white/12 bg-black/60 px-2 py-1 text-[11px] text-slate-200 placeholder:text-slate-600"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void onSend();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => void onSend()}
                  disabled={sending || !draft.trim()}
                  className="flex shrink-0 items-center gap-1 self-end rounded border border-amber-400/50 bg-amber-500/15 px-3 py-2 text-[10px] font-semibold text-amber-100 hover:bg-amber-500/25 disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="relative min-h-[800px] w-full">
          <div className="grid h-full min-h-[760px] grid-cols-3 grid-rows-[minmax(340px,auto)_minmax(300px,auto)] gap-x-4 gap-y-8 md:min-h-[820px] md:gap-x-5 md:gap-y-12">
            <ZoneShell
              title="Alpha · Research bay"
              subtitle="Data arrays · analyse · holografisk visualisering"
              borderClass="border-cyan-500/25"
              glowClass="bg-cyan-500/20"
              className="col-start-1 row-start-1"
            >
              <div className="relative h-full rounded-2xl border border-cyan-400/15 bg-gradient-to-b from-cyan-500/[0.07] to-transparent">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="tf-zone-drift absolute left-[8%] h-16 w-[3px] rounded-full bg-gradient-to-b from-cyan-300/50 to-transparent opacity-60"
                    style={{ top: `${18 + i * 16}%`, animationDelay: `${i * 0.4}s` }}
                  />
                ))}
                <div className="absolute bottom-[18%] left-1/2 h-24 w-[70%] -translate-x-1/2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.04] blur-[1px]" />
                <div className="absolute inset-x-[12%] top-[12%] h-[38%] rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-transparent shadow-[inset_0_0_40px_rgba(34,211,238,0.06)]">
                  <div className="tf-zone-scan-line absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-cyan-300/25 to-transparent" />
                </div>
              </div>
            </ZoneShell>

            <ZoneShell
              title="Eugene · Command deck"
              subtitle="Multi-screen consoles · strategisk overblik"
              borderClass="border-amber-400/30"
              glowClass="bg-amber-400/15"
              className="col-start-2 row-start-1"
            >
              <div className="relative flex h-full min-h-[360px] flex-col gap-2 rounded-2xl border border-violet-400/20 bg-gradient-to-b from-violet-600/[0.12] via-transparent to-amber-500/[0.06] p-3 md:min-h-[420px]">
                <div className="flex flex-1 gap-2">
                  <div className="flex w-[32%] flex-col gap-2">
                    <div className="h-[42%] rounded-xl border border-white/12 bg-gradient-to-br from-white/10 to-black/40 shadow-inner" />
                    <div className="h-[52%] rounded-xl border border-white/12 bg-gradient-to-br from-violet-400/15 to-black/50" />
                  </div>
                  <div className="relative flex-1 rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-400/10 via-violet-500/10 to-black/50 shadow-[inset_0_0_60px_rgba(168,85,247,0.12)]">
                    <div className="tf-zone-scan-line absolute inset-x-[15%] top-[8%] h-[22%] rounded-lg bg-gradient-to-b from-amber-200/20 to-transparent" />
                    <div className="absolute bottom-[12%] left-[10%] right-[10%] h-[28%] rounded-xl border border-white/10 bg-black/30 backdrop-blur-sm" />
                  </div>
                  <div className="hidden w-[18%] flex-col gap-2 md:flex">
                    <div className="h-1/3 rounded-lg border border-white/10 bg-white/5" />
                    <div className="h-1/3 rounded-lg border border-white/10 bg-white/5" />
                    <div className="h-1/3 rounded-lg border border-white/10 bg-white/5" />
                  </div>
                </div>
                <div className="h-10 rounded-xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 via-transparent to-violet-500/10" />
              </div>
            </ZoneShell>

            <ZoneShell
              title="Charlie · Quality control"
              subtitle="Sikkerhedsscannere · diagnostik · verifikation"
              borderClass="border-red-500/30"
              glowClass="bg-red-500/20"
              className="col-start-3 row-start-1"
            >
              <div className="relative h-full rounded-2xl border border-red-500/20 bg-gradient-to-b from-red-600/[0.08] to-transparent">
                <div className="absolute left-[8%] top-[10%] h-[55%] w-[28%] rounded-2xl border border-red-400/25 bg-gradient-to-b from-red-500/15 to-black/40 shadow-[0_0_30px_rgba(220,38,38,0.15)]" />
                <div className="absolute right-[8%] top-[18%] h-[40%] w-[38%] rounded-full border border-red-400/20 bg-red-500/[0.06] blur-[0.5px]" />
                <div className="absolute bottom-[14%] left-1/2 h-2 w-[72%] -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-red-400/35 to-transparent" />
              </div>
            </ZoneShell>

            <ZoneShell
              title="Bravo · Fabrication"
              subtitle="Mikro-montering · materialesyntese · værktøjsmanipulation"
              borderClass="border-orange-500/30"
              glowClass="bg-orange-500/20"
              className="col-start-1 row-start-2"
            >
              <div className="relative h-full rounded-2xl border border-orange-500/20 bg-gradient-to-b from-orange-500/[0.07] to-transparent">
                <div className="tf-zone-fab-spin absolute left-1/2 top-[12%] h-20 w-20 -translate-x-1/2 rounded-full border border-dashed border-orange-400/35 bg-orange-500/[0.05]" />
                <div className="absolute bottom-[16%] left-[12%] right-[12%] flex justify-between gap-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-10 flex-1 rounded-lg border border-white/10 bg-gradient-to-t from-black/50 to-slate-700/30"
                    />
                  ))}
                </div>
                <div className="absolute left-[20%] top-[38%] h-14 w-14 rounded-2xl border border-orange-400/30 bg-gradient-to-br from-orange-400/20 to-black/60 shadow-[inset_0_0_20px_rgba(249,115,22,0.2)]" />
              </div>
            </ZoneShell>

            <ZoneShell
              title="Communal lounge"
              subtitle="Næring-syntese · soft-tech pause · arcade feed"
              borderClass="border-emerald-400/25"
              glowClass="bg-emerald-400/15"
              className="col-span-2 col-start-2 row-start-2"
            >
              <div className="flex h-full min-h-[180px] flex-col gap-3 md:flex-row md:items-stretch">
                <div
                  className="flex flex-1 flex-col justify-end rounded-[2rem] border border-white/15 p-4 shadow-[inset_0_0_40px_rgba(255,255,255,0.06)] backdrop-blur-xl"
                  style={{
                    background:
                      "linear-gradient(165deg, rgba(255,255,255,0.12) 0%, rgba(167,243,208,0.08) 40%, rgba(15,23,42,0.5) 100%)",
                  }}
                >
                  <p className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-widest text-emerald-200/80">
                    Seating pod
                  </p>
                  <div className="h-16 rounded-[1.25rem] border border-white/12 bg-white/[0.06] shadow-inner" />
                  <p className="mt-2 text-[10px] text-slate-500">Frosted glass · diffus LED · lav akustik</p>
                </div>

                <div className="flex w-full flex-col gap-2 md:w-[140px]">
                  <div className="flex flex-1 flex-col justify-between rounded-2xl border border-cyan-400/20 bg-gradient-to-b from-cyan-500/10 to-slate-900/60 p-3 backdrop-blur-md">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-cyan-200/90">Nutrient synth</p>
                    <div className="mx-auto mt-2 h-14 w-10 rounded-full border border-cyan-300/30 bg-gradient-to-b from-cyan-400/25 to-black/70 shadow-[0_0_20px_rgba(34,211,238,0.25)]" />
                    <p className="mt-2 text-center text-[9px] text-slate-500">Dispense</p>
                  </div>
                </div>

                <div className="flex flex-1 flex-col rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/[0.12] to-black/50 p-3 font-mono backdrop-blur-sm">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-violet-200/90">Arcade / stats</p>
                  <div className="mt-2 flex-1 rounded-lg border border-white/10 bg-black/55 p-2 text-[9px] leading-relaxed text-emerald-400/90">
                    <p>XP total · {totalXp}</p>
                    <p className="text-slate-500">
                      Eu {agents.eugene.xp} · A {agents.alpha.xp} · B {agents.bravo.xp} · C {agents.charlie.xp}
                    </p>
                    <p className="text-amber-400/80">Hukommelse logget per agent</p>
                    <p className="mt-2 text-slate-500">Browser localStorage · the-factory-agents-v1</p>
                  </div>
                </div>
              </div>
            </ZoneShell>
          </div>

          <div className="pointer-events-none absolute inset-0 z-20">
            <AgentPlaced
              agent="alpha"
              atLounge={agents.alpha.zone === "lounge"}
              statusLine={statusLabel(
                agents.alpha.zone === "lounge",
                agents.alpha.activity,
                agents.alpha.currentTask,
              )}
              name="Alpha"
              role="Research"
              accent="text-cyan-200/90"
              icon={Radar}
              variant="alpha"
            />
            <AgentPlaced
              agent="eugene"
              atLounge={agents.eugene.zone === "lounge"}
              statusLine={statusLabel(
                agents.eugene.zone === "lounge",
                agents.eugene.activity,
                agents.eugene.currentTask,
              )}
              name="Eugene"
              role="Top-agent"
              accent="text-amber-100/90"
              icon={Sparkles}
              variant="eugene"
            />
            <AgentPlaced
              agent="charlie"
              atLounge={agents.charlie.zone === "lounge"}
              statusLine={statusLabel(
                agents.charlie.zone === "lounge",
                agents.charlie.activity,
                agents.charlie.currentTask,
              )}
              name="Charlie"
              role="Verify"
              accent="text-red-200/90"
              icon={ScanEye}
              variant="charlie"
            />
            <AgentPlaced
              agent="bravo"
              atLounge={agents.bravo.zone === "lounge"}
              statusLine={statusLabel(
                agents.bravo.zone === "lounge",
                agents.bravo.activity,
                agents.bravo.currentTask,
              )}
              name="Bravo"
              role="Builder"
              accent="text-orange-200/90"
              icon={Cog}
              variant="bravo"
            />
          </div>
        </div>
      </div>
    </section>
  );
}






