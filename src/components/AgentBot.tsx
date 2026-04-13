"use client";

import { useId, type ComponentType, type ReactNode } from "react";

export type AgentBotVariant = "eugene" | "alpha" | "bravo" | "charlie";

type AgentBotProps = {
  variant: AgentBotVariant;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  className?: string;
};

function BodyGradients({ uid, variant }: { uid: string; variant: AgentBotVariant }): ReactNode {
  const b = `${uid}-metal`;
  const r = `${uid}-rim`;
  if (variant === "eugene") {
    return (
      <>
        <linearGradient id={b} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5b21b6" />
          <stop offset="38%" stopColor="#a855f7" />
          <stop offset="62%" stopColor="#c4b5fd" />
          <stop offset="82%" stopColor="#ca8a04" />
          <stop offset="100%" stopColor="#fde047" />
        </linearGradient>
        <radialGradient id={r} cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="rgba(253,224,71,0.45)" />
          <stop offset="100%" stopColor="rgba(124,58,237,0)" />
        </radialGradient>
      </>
    );
  }
  if (variant === "alpha") {
    return (
      <>
        <linearGradient id={b} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="45%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <radialGradient id={r} cx="50%" cy="30%" r="65%">
          <stop offset="0%" stopColor="rgba(34,211,238,0.4)" />
          <stop offset="100%" stopColor="rgba(15,23,42,0)" />
        </radialGradient>
      </>
    );
  }
  if (variant === "bravo") {
    return (
      <>
        <linearGradient id={b} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="40%" stopColor="#334155" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <radialGradient id={r} cx="55%" cy="25%" r="60%">
          <stop offset="0%" stopColor="rgba(249,115,22,0.45)" />
          <stop offset="100%" stopColor="rgba(15,23,42,0)" />
        </radialGradient>
      </>
    );
  }
  return (
    <>
      <linearGradient id={b} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0a0a0a" />
        <stop offset="50%" stopColor="#1a1a1a" />
        <stop offset="100%" stopColor="#030303" />
      </linearGradient>
      <radialGradient id={r} cx="50%" cy="28%" r="68%">
        <stop offset="0%" stopColor="rgba(220,38,38,0.5)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
      </radialGradient>
    </>
  );
}

function MouthGradients({ uid, variant }: { uid: string; variant: AgentBotVariant }): ReactNode {
  const led = `${uid}-mouth-led`;
  if (variant === "eugene") {
    return (
      <linearGradient id={led} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="50%" stopColor="#fde047" />
        <stop offset="100%" stopColor="#a855f7" />
      </linearGradient>
    );
  }
  if (variant === "alpha") {
    return (
      <linearGradient id={led} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#22d3ee" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
    );
  }
  if (variant === "bravo") {
    return (
      <linearGradient id={led} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#fdba74" />
        <stop offset="100%" stopColor="#ea580c" />
      </linearGradient>
    );
  }
  return (
    <linearGradient id={led} x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#fca5a5" />
      <stop offset="100%" stopColor="#b91c1c" />
    </linearGradient>
  );
}

function EyeGradients({ uid, variant }: { uid: string; variant: AgentBotVariant }): ReactNode {
  const iris = `${uid}-iris`;
  const lens = `${uid}-lens`;
  if (variant === "eugene") {
    return (
      <>
        <radialGradient id={iris} cx="45%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#4c1d95" />
          <stop offset="45%" stopColor="#a78bfa" />
          <stop offset="70%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#6b21a8" />
        </radialGradient>
        <radialGradient id={lens} cx="32%" cy="32%" r="75%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="22%" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="55%" stopColor="rgba(196,181,253,0.25)" />
          <stop offset="100%" stopColor="rgba(15,23,42,0.85)" />
        </radialGradient>
      </>
    );
  }
  if (variant === "alpha") {
    return (
      <>
        <radialGradient id={iris} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="50%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#0369a1" />
        </radialGradient>
        <radialGradient id={lens} cx="30%" cy="28%" r="72%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="35%" stopColor="rgba(165,243,252,0.35)" />
          <stop offset="100%" stopColor="rgba(8,47,73,0.9)" />
        </radialGradient>
      </>
    );
  }
  if (variant === "bravo") {
    return (
      <>
        <radialGradient id={iris} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ea580c" />
          <stop offset="60%" stopColor="#c2410c" />
          <stop offset="100%" stopColor="#431407" />
        </radialGradient>
        <radialGradient id={lens} cx="28%" cy="30%" r="70%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
          <stop offset="40%" stopColor="rgba(254,215,170,0.2)" />
          <stop offset="100%" stopColor="rgba(15,23,42,0.95)" />
        </radialGradient>
      </>
    );
  }
  return (
    <>
      <radialGradient id={iris} cx="50%" cy="50%" r="48%">
        <stop offset="0%" stopColor="#fca5a5" />
        <stop offset="40%" stopColor="#dc2626" />
        <stop offset="100%" stopColor="#450a0a" />
      </radialGradient>
      <radialGradient id={lens} cx="32%" cy="30%" r="68%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.75)" />
        <stop offset="100%" stopColor="rgba(10,10,10,0.92)" />
      </radialGradient>
    </>
  );
}

function BipedRobot({
  uid,
  variant,
}: {
  uid: string;
  variant: AgentBotVariant;
}) {
  const metal = `${uid}-metal`;
  const rim = `${uid}-rim`;
  const iris = `${uid}-iris`;
  const lens = `${uid}-lens`;

  const stance =
    variant === "eugene"
      ? "tf-biped-idle-eugene"
      : variant === "alpha"
        ? "tf-biped-idle-alpha"
        : variant === "bravo"
          ? "tf-biped-idle-bravo"
          : "tf-biped-idle-charlie";

  const eyePulse = variant === "charlie" ? "tf-biped-charlie-eye" : "";

  return (
    <svg
      viewBox="0 0 140 248"
      className="h-full w-full overflow-visible"
      aria-hidden
    >
      <defs>
        <BodyGradients uid={uid} variant={variant} />
        <EyeGradients uid={uid} variant={variant} />
        <MouthGradients uid={uid} variant={variant} />
        <filter id={`${uid}-mouth-soft`} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="1.4" result="mb" />
          <feMerge>
            <feMergeNode in="mb" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${uid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.8" result="a" />
          <feMerge>
            <feMergeNode in="a" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={`${uid}-joint`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.45)" />
        </linearGradient>
      </defs>

      <ellipse cx="70" cy="238" rx="32" ry="6" fill="rgba(0,0,0,0.42)" />

      <g className={stance}>
        <g>
          <path
            d="M 52 228 Q 48 200 50 172 Q 52 148 58 138 Q 62 132 68 138 Q 72 148 74 172 Q 76 200 72 228 Q 70 234 62 234 Q 54 234 52 228 Z"
            fill={`url(#${metal})`}
            stroke="rgba(255,255,255,0.14)"
            strokeWidth={0.5}
          />
          <circle cx="60" cy="168" r="5" fill={`url(#${uid}-joint)`} stroke="rgba(255,255,255,0.12)" strokeWidth={0.35} />
          <circle cx="58" cy="200" r="4" fill={`url(#${uid}-joint)`} stroke="rgba(255,255,255,0.1)" strokeWidth={0.3} />
        </g>
        <g>
          <path
            d="M 88 228 Q 92 200 90 172 Q 88 148 82 138 Q 78 132 72 138 Q 68 148 66 172 Q 64 200 68 228 Q 70 234 78 234 Q 86 234 88 228 Z"
            fill={`url(#${metal})`}
            stroke="rgba(255,255,255,0.14)"
            strokeWidth={0.5}
          />
          <circle cx="80" cy="168" r="5" fill={`url(#${uid}-joint)`} stroke="rgba(255,255,255,0.12)" strokeWidth={0.35} />
          <circle cx="82" cy="200" r="4" fill={`url(#${uid}-joint)`} stroke="rgba(255,255,255,0.1)" strokeWidth={0.3} />
        </g>

        <path
          d="M 70 32 C 42 32 28 58 28 92 C 28 128 40 152 70 158 C 100 152 112 128 112 92 C 112 58 98 32 70 32 Z"
          fill={`url(#${metal})`}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={0.65}
        />
        <path
          d="M 70 40 C 48 40 36 62 36 92 C 36 122 46 142 70 148 C 94 142 104 122 104 92 C 104 62 92 40 70 40 Z"
          fill={`url(#${rim})`}
          opacity={0.75}
          style={{ mixBlendMode: "screen" }}
        />

        <g className={variant === "bravo" ? "tf-biped-arm-bravo-l" : "tf-biped-arm-l"} style={{ transformOrigin: "38px 118px" }}>
          <path
            d="M 38 118 Q 22 128 16 152 Q 12 168 18 182 Q 22 188 28 184 Q 34 172 36 152 Q 40 132 44 122 Q 46 116 42 114 Q 40 112 38 118 Z"
            fill={`url(#${metal})`}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={0.45}
          />
          <circle cx="32" cy="138" r="4.5" fill={`url(#${uid}-joint)`} stroke="rgba(255,255,255,0.1)" strokeWidth={0.3} />
          <circle cx="22" cy="168" r="3.8" fill={`url(#${uid}-joint)`} stroke="rgba(255,255,255,0.08)" strokeWidth={0.25} />
          {variant === "alpha" && (
            <path
              d="M 8 178 L 4 188 L 16 186 Z"
              fill="rgba(34,211,238,0.85)"
              filter={`url(#${uid}-glow)`}
              className="tf-biped-scanner-tip"
            />
          )}
        </g>

        <g className={variant === "bravo" ? "tf-biped-arm-bravo-r" : "tf-biped-arm-r"} style={{ transformOrigin: "102px 118px" }}>
          <path
            d="M 102 118 Q 118 128 124 152 Q 128 168 122 182 Q 118 188 112 184 Q 106 172 104 152 Q 100 132 96 122 Q 94 116 98 114 Q 100 112 102 118 Z"
            fill={`url(#${metal})`}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={0.45}
          />
          <circle cx="108" cy="138" r="4.5" fill={`url(#${uid}-joint)`} stroke="rgba(255,255,255,0.1)" strokeWidth={0.3} />
          <circle cx="118" cy="168" r="3.8" fill={`url(#${uid}-joint)`} stroke="rgba(255,255,255,0.08)" strokeWidth={0.25} />
          {variant === "bravo" && (
            <ellipse cx="126" cy="176" rx="5" ry="3" fill="rgba(249,115,22,0.9)" filter={`url(#${uid}-glow)`} />
          )}
        </g>

        <g className={"tf-biped-eye-group " + eyePulse}>
          <circle cx="70" cy="92" r="28" fill="rgba(245,245,250,0.12)" stroke="rgba(255,255,255,0.35)" strokeWidth={0.8} />
          <circle cx="70" cy="92" r="24" fill={`url(#${lens})`} filter={`url(#${uid}-glow)`} />
          <circle cx="70" cy="92" r="16" fill={`url(#${iris})`} opacity={0.95} />
          <circle cx="70" cy="92" r="7" fill="#0c0a0e" opacity={0.92} />
          <ellipse cx="62" cy="84" rx="9" ry="5" fill="rgba(255,255,255,0.75)" opacity={0.9} style={{ mixBlendMode: "screen" }} />
          <ellipse cx="76" cy="98" rx="4" ry="2.5" fill="rgba(255,255,255,0.25)" opacity={0.6} />
        </g>
        <g className="tf-biped-mouth tf-biped-mouth-talk" filter={`url(#${uid}-mouth-soft)`}
        >
          <path
            d="M 44 104 Q 70 111 96 104 L 95.5 109 Q 70 116 44.5 109 Z"
            fill="rgba(5,5,8,0.82)"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth={0.45}
          />
          <path
            d="M 46 105.5 Q 70 109.5 94 105.5"
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth={0.55}
            strokeLinecap="round"
          />
          <path
            d="M 48 109.5 Q 70 113.2 92 109.5"
            fill="none"
            stroke={`url(#${uid}-mouth-led)`}
            strokeWidth={2.1}
            strokeLinecap="round"
            opacity={0.92}
          />
          <path
            d="M 50 111.2 Q 70 113.8 90 111.2"
            fill="none"
            stroke={`url(#${uid}-mouth-led)`}
            strokeWidth={0.65}
            strokeLinecap="round"
            opacity={0.45}
          />
          <path
            d="M 52 112.8 Q 70 114.5 88 112.8"
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={0.35}
            strokeLinecap="round"
          />
        </g>

        <ellipse cx="70" cy="128" rx="22" ry="12" fill="rgba(0,0,0,0.18)" opacity={0.5} />
      </g>
    </svg>
  );
}

export function AgentBot({ variant, icon: Icon, className = "" }: AgentBotProps) {
  const uid = useId().replace(/:/g, "");

  return (
    <div
      className={"relative flex flex-col items-center justify-end bg-transparent " + className}
      style={{ width: "3.9rem", height: "5.85rem" }}
    >
      <div className="relative h-[5.5rem] w-[3.65rem] bg-transparent">
        <BipedRobot uid={uid} variant={variant} />
        <div className="pointer-events-none absolute bottom-[18%] left-1/2 flex -translate-x-1/2 items-center justify-center bg-transparent">
          <Icon
            className="h-[9px] w-[9px] text-white/92 [filter:drop-shadow(0_0_3px_rgba(0,0,0,0.95))_drop-shadow(0_1px_1px_rgba(0,0,0,0.8))]"
            strokeWidth={1.35}
          />
        </div>
      </div>
    </div>
  );
}




