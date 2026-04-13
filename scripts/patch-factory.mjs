import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const root = dirname(fileURLToPath(import.meta.url));
const mc = join(root, "..");
process.chdir(mc);
const facPath = "src/components/AgentFactory.tsx";
let fac = fs.readFileSync(facPath, "utf8");
if (fac.includes("AgentFactoryProps")) {
  console.log("AgentFactory already patched");
  process.exit(0);
}

fac = fac.replace(
  `import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { Cog, Radar, ScanEye, Sparkles } from "lucide-react";
import { AgentBot } from "./AgentBot";`,
  `import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import { Briefcase, Coffee, Cog, Radar, RefreshCw, ScanEye, Send, Sparkles } from "lucide-react";
import { useMissionAgents, type AgentId } from "@/context/MissionAgentsContext";
import { AgentBot } from "./AgentBot";`
);

fac = fac.replace(
  `type AgentKey = "alpha" | "eugene" | "charlie" | "bravo";

const STATION:`,
  `type AgentKey = "alpha" | "eugene" | "charlie" | "bravo";

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

const STATION:`
);

const oldPlaced = `function AgentPlaced({
  agent,
  atLounge,
  name,
  role,
  accent,
  icon,
  variant,
}: {
  agent: AgentKey;
  atLounge: boolean;
  name: string;
  role: string;
  accent: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  variant: "eugene" | "alpha" | "bravo" | "charlie";
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
      <AgentBot variant={variant} icon={icon} />
    </div>
  );
}`;

const newPlaced = `function AgentPlaced({
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
}`;

if (!fac.includes(oldPlaced)) {
  console.error("AgentPlaced block mismatch");
  process.exit(1);
}
fac = fac.replace(oldPlaced, newPlaced);

const oldFactory = `export function AgentFactory() {
  const [atLounge, setAtLounge] = useState(false);

  useEffect(() => {
    const t = window.setInterval(() => setAtLounge((v) => !v), 32000);
    return () => clearInterval(t);
  }, []);

  return (`;

const newFactory = `export function AgentFactory({
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
    setAgentZone,
    setAgentActivity,
    allToLounge,
    allToStations,
    markTaskDone,
    resetProgress,
    lastGatewayMirror,
  } = useMissionAgents();

  const [draft, setDraft] = useState("");
  const [mirrorGw, setMirrorGw] = useState(false);
  const [sending, setSending] = useState(false);

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

  return (`;

if (!fac.includes(oldFactory)) {
  console.error("Factory anchor not found");
  process.exit(1);
}
fac = fac.replace(oldFactory, newFactory);

fac = fac.replace(
  `<div className="rounded-lg border border-white/12 bg-white/[0.05] px-3 py-1.5 font-mono text-[10px] text-slate-400 backdrop-blur-md">
            FAB-NET · {atLounge ? "SOCIAL / LOUNGE" : "PRODUCTION"}
          </div>`,
  `<div className="flex flex-col items-end gap-2">
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
            <div className="flex max-w-[min(100%,420px)] flex-wrap justify-end gap-1">
              {ctl("eugene", "Eu")}
              {ctl("alpha", "A")}
              {ctl("bravo", "B")}
              {ctl("charlie", "C")}
            </div>
            <div className="rounded-lg border border-white/12 bg-white/[0.05] px-3 py-1.5 font-mono text-[10px] text-slate-400 backdrop-blur-md">
              FAB-NET · {fabMode}
            </div>
          </div>`
);

fac = fac.replace(
  `<div className="mt-2 flex-1 rounded-lg border border-white/10 bg-black/55 p-2 text-[9px] leading-relaxed text-emerald-400/90">
                    <p>SCORE 009,847</p>
                    <p className="text-slate-500">RUNS OK · 12</p>
                    <p className="text-amber-400/80">COOP SYNC 98.2%</p>
                    <p className="mt-2 text-slate-600">{"/// SIMULATED TELEMETRY ///"}</p>
                  </div>`,
  `<div className="mt-2 flex-1 rounded-lg border border-white/10 bg-black/55 p-2 text-[9px] leading-relaxed text-emerald-400/90">
                    <p>XP total · {totalXp}</p>
                    <p className="text-slate-500">
                      Eu {agents.eugene.xp} · A {agents.alpha.xp} · B {agents.bravo.xp} · C {agents.charlie.xp}
                    </p>
                    <p className="text-amber-400/80">Hukommelse logget per agent</p>
                    <p className="mt-2 text-slate-500">Browser localStorage · mission-control-agents-v1</p>
                  </div>`
);

fac = fac.replace(
  `            <AgentPlaced
              agent="alpha"
              atLounge={atLounge}
              name="Alpha"
              role="Research"
              accent="text-cyan-200/90"
              icon={Radar}
              variant="alpha"
            />
            <AgentPlaced
              agent="eugene"
              atLounge={atLounge}
              name="Eugene"
              role="Top-agent"
              accent="text-amber-100/90"
              icon={Sparkles}
              variant="eugene"
            />
            <AgentPlaced
              agent="charlie"
              atLounge={atLounge}
              name="Charlie"
              role="Verify"
              accent="text-red-200/90"
              icon={ScanEye}
              variant="charlie"
            />
            <AgentPlaced
              agent="bravo"
              atLounge={atLounge}
              name="Bravo"
              role="Builder"
              accent="text-orange-200/90"
              icon={Cog}
              variant="bravo"
            />`,
  `            <AgentPlaced
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
            />`
);

const eugenePanel = `
          <div className="pointer-events-auto absolute right-3 top-20 z-40 w-[min(100%,380px)] rounded-xl border border-amber-400/35 bg-black/75 p-3 shadow-[0_0_40px_rgba(245,158,11,0.12)] backdrop-blur-md md:right-6">
            <p className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-wider text-amber-200/90">Eugene · direktiv</p>
            <div className="mb-2 flex flex-wrap gap-2">
              <select
                value={selectedSessionKey}
                onChange={(e) => setSelectedSessionKey(e.target.value)}
                className="max-w-[220px] flex-1 rounded border border-white/15 bg-black/60 px-2 py-1 text-[10px] text-slate-200"
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
            <label className="mb-2 flex cursor-pointer items-center gap-2 text-[9px] text-slate-400">
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
            <div className="mb-2 max-h-36 overflow-y-auto rounded border border-white/10 bg-black/50 p-2 text-[10px] leading-relaxed">
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
                className="min-h-[48px] flex-1 resize-y rounded border border-white/12 bg-black/60 px-2 py-1 text-[11px] text-slate-200 placeholder:text-slate-600"
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
          </div>`;

fac = fac.replace(
  `        <div className="relative min-h-[800px] w-full">
          <div className="grid h-full min-h-[760px]`,
  `        <div className="relative min-h-[800px] w-full">
          ${eugenePanel}
          <div className="grid h-full min-h-[760px]`
);

fs.writeFileSync(facPath, fac);
console.log("AgentFactory patched");
