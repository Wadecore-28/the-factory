"use client";

import { useEffect, useId, useRef } from "react";

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function MechanicalRobotSvg({
  accent,
  filterId,
}: {
  accent: string;
  filterId: string;
}) {
  const stroke = "rgba(8, 8, 10, 0.95)";
  const visorBand = "rgba(12, 74, 110, 0.92)";
  const visorLed = "rgba(56, 189, 248, 0.98)";
  return (
    <svg
      viewBox="0 0 48 58"
      className="fabric-mech-svg h-14 w-[3.25rem] overflow-visible select-none"
      aria-hidden
    >
      <defs>
        <filter id={filterId} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="0.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect x="16" y="4" width="16" height="12" rx="2" fill={accent} stroke={stroke} strokeWidth="0.75" />
      <rect x="17" y="7" width="14" height="5" rx="1" fill={visorBand} stroke={stroke} strokeWidth="0.35" />
      <rect x="18" y="8" width="12" height="2.5" rx="0.5" fill={visorLed} filter={`url(#${filterId})`} />
      <circle cx="20" cy="9.25" r="0.85" fill="#f0f9ff" opacity="0.95" />
      <circle cx="28" cy="9.25" r="0.85" fill="#f0f9ff" opacity="0.95" />
      <rect x="14" y="16" width="20" height="20" rx="2" fill={accent} stroke={stroke} strokeWidth="0.85" opacity={0.97} />
      <rect x="17" y="19" width="14" height="8" rx="1" fill="rgba(0,0,0,0.2)" />
      <rect x="16" y="35" width="16" height="5" rx="1" fill={accent} stroke={stroke} strokeWidth="0.55" opacity={0.95} />
      <g transform="translate(15.5,18)">
        <g className="fabric-mech-arm-l">
          <rect x="-2.5" y="0" width="5" height="15" rx="1.5" fill={accent} stroke={stroke} strokeWidth="0.65" />
        </g>
      </g>
      <g transform="translate(32.5,18)">
        <g className="fabric-mech-arm-r">
          <rect x="-2.5" y="0" width="5" height="15" rx="1.5" fill={accent} stroke={stroke} strokeWidth="0.65" />
        </g>
      </g>
      <g transform="translate(15.5,40)">
        <g className="fabric-mech-leg-l">
          <rect x="-2.5" y="0" width="5" height="16" rx="1.5" fill={accent} stroke={stroke} strokeWidth="0.65" />
          <rect x="-2" y="13.5" width="4" height="3.5" rx="0.8" fill="rgba(28,28,32,0.98)" stroke={stroke} strokeWidth="0.4" />
        </g>
      </g>
      <g transform="translate(32.5,40)">
        <g className="fabric-mech-leg-r">
          <rect x="-2.5" y="0" width="5" height="16" rx="1.5" fill={accent} stroke={stroke} strokeWidth="0.65" />
          <rect x="-2" y="13.5" width="4" height="3.5" rx="0.8" fill="rgba(28,28,32,0.98)" stroke={stroke} strokeWidth="0.4" />
        </g>
      </g>
    </svg>
  );
}

export function FabricWanderingRobot({ accent, seed }: { accent: string; seed: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<HTMLDivElement>(null);
  const facingLeftRef = useRef(false);
  const reactId = useId().replace(/:/g, "");
  const filterId = `fabric-mech-visor-${reactId}-${seed}`;

  useEffect(() => {
    const el = wrapRef.current;
    const face = faceRef.current;
    if (!el || !face) return;

    const rand = mulberry32(seed);
    const walk = { minX: 0.14, maxX: 0.86, minY: 0.44, maxY: 0.9 };
    const nearDesk = { x: 0.5, y: 0.36 };
    const pos = { x: 0.5, y: 0.7 };
    let target = { x: 0.5, y: 0.55 };
    let idleTicks = 0;

    const pickTarget = () => {
      if (rand() < 0.22) {
        target = {
          x: nearDesk.x + (rand() - 0.5) * 0.22,
          y: nearDesk.y + (rand() - 0.5) * 0.12,
        };
      } else {
        target = {
          x: walk.minX + rand() * (walk.maxX - walk.minX),
          y: walk.minY + rand() * (walk.maxY - walk.minY),
        };
      }
    };
    pickTarget();

    let frame = 0;
    let last = performance.now();
    const speed = 0.38;

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const dx = target.x - pos.x;
      const dy = target.y - pos.y;
      const dist = Math.hypot(dx, dy);
      const moving = dist > 0.018;

      if (moving) {
        const step = speed * dt;
        const nx = dx / dist;
        const ny = dy / dist;
        const travel = Math.min(step, dist);
        pos.x += nx * travel;
        pos.y += ny * travel;
        idleTicks = 0;
        if (Math.abs(dx) > 1e-4) facingLeftRef.current = dx < 0;
      } else {
        idleTicks += 1;
        if (idleTicks > 30 + rand() * 80) {
          pickTarget();
          idleTicks = 0;
        }
      }

      el.style.left = `${pos.x * 100}%`;
      el.style.top = `${pos.y * 100}%`;
      el.style.transform = "translate(-50%, -50%)";
      face.style.transform = facingLeftRef.current ? "scaleX(-1)" : "scaleX(1)";
      face.classList.toggle("fabric-robot-walking", moving);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [seed]);

  return (
    <div
      ref={wrapRef}
      className="fabric-robot-wrap pointer-events-none absolute z-20"
      style={{ left: "50%", top: "65%", transform: "translate(-50%, -50%)" }}
    >
      <div ref={faceRef} className="fabric-mech-face will-change-transform" style={{ transformOrigin: "center center" }}>
        <MechanicalRobotSvg accent={accent} filterId={filterId} />
      </div>
    </div>
  );
}