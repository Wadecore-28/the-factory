"use client";

import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

const SPEED_PX = 260;
const MARGIN = 16;

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  return Boolean(t.closest("input, textarea, select, [contenteditable=true]"));
}

const MOVEMENT_CODES = new Set([
  "KeyW",
  "KeyS",
  "KeyA",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
]);

function OperatorHumanSvg({ facingLeft }: { facingLeft: boolean }) {
  const stroke = "rgba(8, 8, 10, 0.95)";
  const skin = "#e8c4a8";
  const hair = "#2c1810";
  const shirt = "#3b4f6b";
  const pants = "#1e293b";
  const boots = "#0f172a";
  return (
    <svg
      viewBox="0 0 48 58"
      className="fabric-operator-svg h-14 w-[3.25rem] overflow-visible select-none drop-shadow-md"
      aria-hidden
      style={{ transform: facingLeft ? "scaleX(-1)" : "scaleX(1)", transformOrigin: "center center" }}
    >
      <ellipse cx="24" cy="10" rx="9" ry="10" fill={skin} stroke={stroke} strokeWidth="0.75" />
      <path
        d="M15 7 Q24 2 33 7"
        fill="none"
        stroke={hair}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <ellipse cx="20" cy="9" rx="1.1" ry="1.35" fill="#1a1a22" />
      <ellipse cx="28" cy="9" rx="1.1" ry="1.35" fill="#1a1a22" />
      <path d="M22 13 Q24 14.5 26 13" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="0.5" />
      <rect x="16" y="19" width="16" height="18" rx="2.5" fill={shirt} stroke={stroke} strokeWidth="0.75" />
      <rect x="19" y="22" width="10" height="5" rx="1" fill="rgba(0,0,0,0.18)" />
      <rect x="17" y="35" width="14" height="14" rx="2" fill={pants} stroke={stroke} strokeWidth="0.65" />
      <rect x="15.5" y="20" width="5" height="14" rx="1.8" fill={shirt} stroke={stroke} strokeWidth="0.55" />
      <rect x="27.5" y="20" width="5" height="14" rx="1.8" fill={shirt} stroke={stroke} strokeWidth="0.55" />
      <rect x="17.5" y="46" width="5" height="9" rx="1.2" fill={pants} stroke={stroke} strokeWidth="0.5" />
      <rect x="25.5" y="46" width="5" height="9" rx="1.2" fill={pants} stroke={stroke} strokeWidth="0.5" />
      <rect x="17" y="53" width="6" height="3.5" rx="1" fill={boots} stroke={stroke} strokeWidth="0.4" />
      <rect x="25" y="53" width="6" height="3.5" rx="1" fill={boots} stroke={stroke} strokeWidth="0.4" />
    </svg>
  );
}

type FabricFloorOperatorProps = {
  floorW: number;
  floorH: number;
  /** True while the pointer is logically over the factory canvas (updated from pointermove). */
  pointerOverHostRef: RefObject<boolean>;
};

export function FabricFloorOperator({ floorW, floorH, pointerOverHostRef }: FabricFloorOperatorProps) {
  const [pos, setPos] = useState({ x: floorW / 2, y: floorH / 2 });
  const [facingLeft, setFacingLeft] = useState(false);
  const keys = useRef(new Set<string>());
  const raf = useRef(0);
  const lastT = useRef(0);

  const clamp = useCallback(
    (x: number, y: number) => {
      const halfW = 26;
      const halfH = 44;
      return {
        x: Math.min(floorW - MARGIN - halfW, Math.max(MARGIN + halfW, x)),
        y: Math.min(floorH - MARGIN - halfH, Math.max(MARGIN + halfH, y)),
      };
    },
    [floorW, floorH],
  );

  useEffect(() => {
    setPos((p) => clamp(p.x, p.y));
  }, [floorW, floorH, clamp]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!pointerOverHostRef.current) return;
      if (isTypingTarget(e.target)) return;
      if (!MOVEMENT_CODES.has(e.code)) return;
      keys.current.add(e.code);
      e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (MOVEMENT_CODES.has(e.code)) keys.current.delete(e.code);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [pointerOverHostRef]);

  useEffect(() => {
    lastT.current = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - lastT.current) / 1000, 0.06);
      lastT.current = now;
      if (!pointerOverHostRef.current) keys.current.clear();
      let dx = 0;
      let dy = 0;
      const k = keys.current;
      if (k.has("KeyW") || k.has("ArrowUp")) dy -= 1;
      if (k.has("KeyS") || k.has("ArrowDown")) dy += 1;
      if (k.has("KeyA") || k.has("ArrowLeft")) dx -= 1;
      if (k.has("KeyD") || k.has("ArrowRight")) dx += 1;
      if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        dx /= len;
        dy /= len;
        if (dx < -0.01) setFacingLeft(true);
        else if (dx > 0.01) setFacingLeft(false);
        setPos((p) => clamp(p.x + dx * SPEED_PX * dt, p.y + dy * SPEED_PX * dt));
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [clamp, pointerOverHostRef]);

  return (
    <div
      className="pointer-events-none absolute z-[25]"
      style={{
        left: pos.x,
        top: pos.y,
        transform: "translate(-50%, -50%)",
      }}
      role="img"
      aria-label="Dig — operatør på fabriksgulvet. Musen skal være over fabrik-kortet; brug WASD eller piltaster."
    >
      <OperatorHumanSvg facingLeft={facingLeft} />
    </div>
  );
}
