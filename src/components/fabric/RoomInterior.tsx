"use client";

import type { ReactNode } from "react";
import type { AgentWorkspaceRole } from "./types";

type RoomInteriorProps = {
  role: AgentWorkspaceRole | null;
  accent: string;
  /** True when slot has no agent — always “under construction” layout */
  vacant: boolean;
};

function InteriorShell({ children }: { children: ReactNode }) {
  return (
    <div className="fabric-room-interior pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-[inherit]">
      {children}
    </div>
  );
}

function UnderConstructionInterior() {
  return (
    <InteriorShell>
      <div
        className="absolute inset-x-0 bottom-0 top-0 opacity-90"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            #ca8a04 0px,
            #ca8a04 10px,
            #171717 10px,
            #171717 20px
          )`,
          maskImage: "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-x-0 top-0 h-[10%] opacity-95"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, #ca8a04 0px, #ca8a04 8px, #171717 8px, #171717 16px)",
        }}
        aria-hidden
      />
      <div className="absolute left-[12%] top-[38%] h-[14%] w-[22%] rotate-[-4deg] rounded-sm border border-amber-900/60 bg-[#6b4f2f] shadow-lg" />
      <div className="absolute right-[14%] top-[48%] h-[11%] w-[18%] rotate-[6deg] rounded-sm border border-amber-900/50 bg-[#5c4030] shadow-md" />
      <div className="absolute left-[40%] top-[52%] h-[9%] w-[20%] rotate-[-2deg] rounded-sm border border-amber-900/55 bg-[#4a3424]" />
      <p className="absolute bottom-[14%] left-0 right-0 text-center font-mono text-[9px] font-bold uppercase tracking-[0.35em] text-amber-200/90 drop-shadow">
        Under konstruktion
      </p>
    </InteriorShell>
  );
}

function ManagerInterior({ accent }: { accent: string }) {
  const barHeights = [42, 68, 52, 88, 58];
  return (
    <InteriorShell>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute left-[8%] right-[8%] top-[6%] flex h-[22%] items-end justify-center gap-[3.5%]">
        {barHeights.map((h, i) => (
          <div key={i} className="flex h-full w-[11%] flex-col justify-end">
            <div
              className="w-full rounded-t border border-cyan-500/45 bg-slate-950/90 shadow-[0_0_14px_rgba(34,211,238,0.4)]"
              style={{ height: `${h}%` }}
            >
              <div className="h-full w-full rounded-t bg-gradient-to-t from-cyan-700/40 to-cyan-300/95" />
            </div>
          </div>
        ))}
      </div>
      <div
        className="absolute left-1/2 top-[32%] h-[22%] w-[52%] -translate-x-1/2 rounded-md border border-slate-600/80 bg-gradient-to-b from-slate-800 to-slate-950 shadow-[0_8px_24px_rgba(0,0,0,0.55)]"
        style={{ boxShadow: `0 0 0 1px rgba(0,0,0,0.5), 0 0 20px ${accent}33` }}
      />
      <div className="absolute left-1/2 top-[36%] h-[4%] w-[34%] -translate-x-1/2 rounded-sm bg-black/50" />
      <div className="fabric-room-holo absolute left-1/2 top-[58%] h-[18%] w-[18%] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full border border-sky-400/50 bg-sky-500/10 shadow-[0_0_28px_rgba(56,189,248,0.45)]" />
    </InteriorShell>
  );
}

function CreatorInterior({ accent }: { accent: string }) {
  const dots = ["#f472b6", "#22d3ee", "#a3e635", "#fbbf24", "#c084fc", "#38bdf8", "#fb7185", "#34d399"];
  return (
    <InteriorShell>
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-purple-950/40 to-black" />
      <div
        className="absolute left-[5%] top-[8%] h-[20%] w-[18%] rounded-md border border-zinc-800 bg-black shadow-inner"
        aria-hidden
      />
      <div
        className="absolute right-[5%] top-[8%] h-[20%] w-[18%] rounded-md border border-zinc-800 bg-black shadow-inner"
        aria-hidden
      />
      <div
        className="absolute bottom-[10%] left-1/2 h-[7%] w-[44%] -translate-x-1/2 rounded border border-fuchsia-500/50 bg-black/80 px-1 py-0.5 text-center font-mono text-[8px] font-black uppercase tracking-widest text-red-500"
        style={{ textShadow: "0 0 8px #ef4444, 0 0 14px #b91c1c" }}
      >
        ON AIR
      </div>
      <div
        className="absolute left-1/2 top-[48%] h-[20%] w-[64%] -translate-x-1/2 rounded-lg border border-fuchsia-500/35 bg-zinc-950/90 shadow-[0_0_24px_rgba(217,70,239,0.25)]"
        style={{
          boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.6), 0 0 22px ${accent}44, 0 0 40px rgba(217,70,239,0.12)`,
        }}
      >
        <div className="absolute inset-[10%] flex flex-wrap content-start justify-center gap-1">
          {dots.map((d, i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full shadow-[0_0_6px_currentColor]"
              style={{ backgroundColor: d, color: d }}
            />
          ))}
        </div>
      </div>
    </InteriorShell>
  );
}

function ResearcherInterior() {
  return (
    <InteriorShell>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-zinc-950" />
      <div className="absolute left-[4%] top-[10%] flex h-[76%] gap-1">
        {[0, 1, 2].map((rack) => (
          <div
            key={rack}
            className="flex h-full w-[11%] flex-col rounded-sm border border-zinc-700 bg-zinc-900/95 px-[2px] py-1 shadow-inner"
          >
            {Array.from({ length: 11 }).map((_, i) => (
              <span
                key={i}
                className="fabric-room-led mt-[2px] block h-[4px] w-full shrink-0 rounded-[1px] bg-emerald-600/25"
              />
            ))}
          </div>
        ))}
      </div>
      <div className="absolute right-[6%] top-[14%] h-[48%] w-[42%] rounded-sm border border-zinc-500 bg-white shadow-md">
        <div className="absolute inset-2 opacity-70">
          <div className="h-px w-[88%] translate-y-2 bg-zinc-400" />
          <div className="h-px w-[72%] translate-y-5 bg-zinc-300" />
          <div className="h-px w-[80%] translate-y-8 bg-zinc-400" />
          <div className="h-px w-[60%] translate-y-11 bg-zinc-300" />
          <div className="h-px w-[90%] translate-y-14 bg-zinc-400" />
          <div className="absolute bottom-3 left-2 right-2 top-16 rounded border border-dashed border-amber-300/50" />
        </div>
      </div>
    </InteriorShell>
  );
}

function WordsmithInterior() {
  const bits = ["{ }", "§", "¶", "∞", "æ", "ß", "“”", "…"];
  return (
    <InteriorShell>
      <div className="absolute inset-0 bg-gradient-to-br from-amber-950/80 via-stone-900 to-stone-950" />
      <div className="absolute inset-y-[8%] left-[3%] w-[10%] rounded-sm border border-amber-900/50 bg-gradient-to-b from-amber-900/60 to-amber-950/90 shadow-inner" />
      <div className="absolute inset-y-[8%] right-[3%] w-[10%] rounded-sm border border-amber-900/50 bg-gradient-to-b from-amber-900/60 to-amber-950/90 shadow-inner" />
      <div className="absolute left-[22%] top-[40%] h-[18%] w-[28%] rounded-sm border border-amber-800/40 bg-stone-900/90 shadow-lg">
        <div className="absolute left-[8%] top-[12%] h-[32%] w-[38%] rounded border border-amber-700/30 bg-sky-950/50" />
        <div className="absolute right-[8%] top-[12%] h-[32%] w-[38%] rounded border border-amber-700/30 bg-sky-950/50" />
      </div>
      {bits.map((t, i) => (
        <span
          key={i}
          className="pointer-events-none absolute font-mono text-[8px] font-bold text-amber-200/40"
          style={{
            left: `${18 + (i % 4) * 22}%`,
            top: `${12 + (i % 3) * 18}%`,
          }}
        >
          <span className="fabric-room-text-bit inline-block" style={{ animationDelay: `${i * 0.35}s` }}>
            {t}
          </span>
        </span>
      ))}
    </InteriorShell>
  );
}

function DeveloperInterior() {
  return (
    <InteriorShell>
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />
      <div className="absolute left-[8%] top-[12%] h-[55%] w-[22%] overflow-hidden rounded-sm border border-emerald-900/40 bg-black font-mono text-[6px] leading-tight text-emerald-500/80 shadow-[inset_0_0_12px_rgba(16,185,129,0.12)]">
        <div className="fabric-room-matrix absolute inset-0 whitespace-pre p-1">
          {`01010101\n10101010\n01101001\n10010110\n01011010\n10100101\n01101001\n10010101`}
        </div>
      </div>
      <div className="absolute right-[10%] top-[14%] h-[48%] w-[22%] overflow-hidden rounded-sm border border-emerald-900/40 bg-black font-mono text-[6px] leading-tight text-emerald-500/75 shadow-[inset_0_0_12px_rgba(16,185,129,0.1)]">
        <div className="fabric-room-matrix absolute inset-0 whitespace-pre p-1" style={{ animationDelay: "-1.2s" }}>
          {`11001100\n00110011\n10101010\n01010101\n11100011\n00011100\n01101101\n10010010`}
        </div>
      </div>
      <div className="absolute bottom-[12%] right-[12%] h-[14%] w-[16%] rounded-md border border-zinc-600 bg-gradient-to-b from-zinc-700 to-zinc-900 shadow-lg">
        <div className="absolute left-1/2 top-[15%] h-[40%] w-[35%] -translate-x-1/2 rounded-sm bg-zinc-800" />
        <div className="absolute bottom-[18%] left-1/2 h-[28%] w-[55%] -translate-x-1/2 rounded-b-md border border-zinc-500 bg-zinc-600/80" />
      </div>
    </InteriorShell>
  );
}

function CloserInterior() {
  return (
    <InteriorShell>
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/50 via-slate-950 to-zinc-950" />
      <svg
        className="absolute left-[6%] top-[8%] h-[28%] w-[52%] overflow-visible"
        viewBox="0 0 200 80"
        aria-hidden
      >
        <path
          d="M 4 72 L 36 52 L 68 58 L 100 28 L 132 38 L 164 12 L 196 8"
          fill="none"
          stroke="#22c55e"
          strokeWidth="3"
          className="drop-shadow-[0_0_6px_rgba(34,197,94,0.8)]"
        />
      </svg>
      <div className="fabric-room-radar absolute right-[8%] top-[10%] h-[26%] w-[26%] rounded-full border border-emerald-600/50 bg-slate-950/90 shadow-[inset_0_0_12px_rgba(0,0,0,0.6)]">
        <div className="absolute inset-[12%] rounded-full border border-emerald-500/20" />
        <div className="fabric-room-radar-sweep pointer-events-none absolute inset-0 rounded-full opacity-90" />
      </div>
      <div className="absolute bottom-[14%] left-1/2 h-[11%] w-[11%] -translate-x-1/2 rounded-full border-2 border-amber-400/80 bg-gradient-to-b from-amber-300 to-amber-600 shadow-[0_0_18px_rgba(251,191,36,0.55)]" />
    </InteriorShell>
  );
}

export function RoomInterior({ role, accent, vacant }: RoomInteriorProps) {
  if (vacant || !role) {
    return <UnderConstructionInterior />;
  }
  switch (role) {
    case "manager":
      return <ManagerInterior accent={accent} />;
    case "creator":
      return <CreatorInterior accent={accent} />;
    case "researcher":
      return <ResearcherInterior />;
    case "wordsmith":
      return <WordsmithInterior />;
    case "developer":
      return <DeveloperInterior />;
    case "closer":
      return <CloserInterior />;
    default:
      return <UnderConstructionInterior />;
  }
}
