import fs from "node:fs";
const p = "e:/mission-control/src/components/AgentFactory.tsx";
let s = fs.readFileSync(p, "utf8");
const start = `<header className="mb-4 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">`;
const idx = s.indexOf(start);
if (idx < 0) throw new Error("header start not found");
const gridMarker = `<div className="grid h-full min-h-[760px] grid-cols-3`;
const idxGrid = s.indexOf(gridMarker, idx);
if (idxGrid < 0) throw new Error("grid not found");
const oldBlock = s.slice(idx, idxGrid);
const newBlock = `<header className="mb-4 flex flex-col gap-4 border-b border-white/10 pb-4 xl:flex-row xl:items-start xl:justify-between">
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
          `;
if (oldBlock.length < 100) throw new Error("old block too short");
s = s.slice(0, idx) + newBlock + s.slice(idxGrid);
fs.writeFileSync(p, s);
console.log("factory layout ok", oldBlock.length, newBlock.length);
