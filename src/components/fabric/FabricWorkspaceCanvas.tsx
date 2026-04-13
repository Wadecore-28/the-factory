"use client";

import { Fragment, useEffect, useRef } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { FabricFloorOperator } from "./FabricFloorOperator";
import { FabricWanderingRobot } from "./FabricRobot";
import { RoomInterior } from "./RoomInterior";
import type { WorkspaceCell } from "./types";

const ROOM_W = 408;
const ROOM_H = 328;
const CORRIDOR_V = 26;
const CORRIDOR_H = 32;
const FLOOR_W = 4 * ROOM_W + 3 * CORRIDOR_V;
const FLOOR_H = 2 * ROOM_H + CORRIDOR_H;

/** X-center of vertical corridor between room column j and j+1 (j = 0..2). */
function verticalCorridorCenterX(j: number): number {
  return (j + 1) * ROOM_W + j * CORRIDOR_V + CORRIDOR_V / 2;
}

type FabricWorkspaceCanvasProps = {
  cells: WorkspaceCell[];
  selectedKey: string | null;
  onSelectCell: (agentKey: string | null, name: string) => void;
};

/** Dør mellem to nabokontorer (vertikal gang). */
function CorridorV() {
  return (
    <div
      className="relative flex shrink-0 items-stretch justify-center border-y border-zinc-700/50 bg-[linear-gradient(90deg,#27272a,#18181b,#27272a)]"
      style={{ width: CORRIDOR_V, minHeight: ROOM_H }}
      role="img"
      aria-label="Forbindelsesdør mellem kontorer — agenter kan mødes her"
    >
      <div
        className="pointer-events-none absolute inset-y-[12%] left-1/2 z-0 w-1.5 -translate-x-1/2 rounded-full border border-dashed border-zinc-600/25 bg-zinc-950/40"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-x-0.5 top-[30%] bottom-[30%] z-[1] flex flex-col items-stretch justify-center">
        <span className="mb-0.5 text-center font-mono text-[5px] font-bold uppercase leading-none tracking-widest text-amber-600/90">
          Dør
        </span>
        <div className="flex min-h-[84px] flex-1 gap-px rounded-sm border border-amber-700/55 bg-zinc-950/90 shadow-[0_0_14px_rgba(245,158,11,0.18),inset_0_1px_0_rgba(255,255,255,0.06)]">
          <div className="flex-1 rounded-l-[3px] bg-gradient-to-b from-zinc-600/85 via-zinc-800 to-zinc-900/95 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.45)]" />
          <div className="flex-1 rounded-r-[3px] bg-gradient-to-b from-zinc-600/85 via-zinc-800 to-zinc-900/95 shadow-[inset_2px_0_4px_rgba(0,0,0,0.45)]" />
        </div>
      </div>
    </div>
  );
}

/** Horisontal gang med døre ud for hver vertikal forbindelse mellem rækkerne. */
function CorridorH() {
  const doorCenters = [0, 1, 2].map(verticalCorridorCenterX);
  return (
    <div
      className="relative flex shrink-0 items-center justify-center border-x border-zinc-700/50 bg-[linear-gradient(180deg,#27272a,#18181b,#27272a)]"
      style={{ width: FLOOR_W, height: CORRIDOR_H }}
      role="img"
      aria-label="Gang med døre mellem øvre og nedre kontor-række"
    >
      <div
        className="pointer-events-none absolute inset-x-[6%] top-1/2 z-0 h-1.5 -translate-y-1/2 rounded-full border border-dashed border-zinc-600/25 bg-zinc-950/40"
        aria-hidden
      />
      {doorCenters.map((cx, idx) => (
        <div
          key={idx}
          className="pointer-events-none absolute top-1/2 z-[1] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
          style={{ left: cx }}
          aria-hidden
        >
          <span className="mb-px font-mono text-[4px] font-bold uppercase leading-none text-amber-600/85">
            Dør
          </span>
          <div className="flex h-[18px] w-[34px] gap-px rounded-sm border border-amber-700/55 bg-zinc-950/95 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
            <div className="flex-1 rounded-l-[2px] bg-gradient-to-r from-zinc-700/90 to-zinc-900 shadow-[inset_0_-2px_3px_rgba(0,0,0,0.5)]" />
            <div className="flex-1 rounded-r-[2px] bg-gradient-to-l from-zinc-700/90 to-zinc-900 shadow-[inset_0_-2px_3px_rgba(0,0,0,0.5)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FabricOfficeRoom({
  cell,
  index,
  selected,
  onSelect,
}: {
  cell: WorkspaceCell;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const c = cell.color;
  const floorBg = `linear-gradient(135deg, ${c}16 0%, transparent 42%), repeating-linear-gradient(90deg, transparent, transparent 11px, rgba(255,255,255,0.028) 11px 12px), repeating-linear-gradient(0deg, transparent, transparent 11px, rgba(255,255,255,0.028) 11px 12px), linear-gradient(180deg, #12121a 0%, #0c0c10 100%)`;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        "fabric-office-room relative shrink-0 overflow-hidden rounded-lg border-2 text-left shadow-[inset_0_0_40px_rgba(0,0,0,0.35)] outline-none transition " +
        (selected
          ? "ring-2 ring-red-500 ring-offset-2 ring-offset-zinc-950"
          : "hover:brightness-110")
      }
      style={{
        width: ROOM_W,
        height: ROOM_H,
        borderColor: c,
        boxShadow: selected ? `0 0 28px ${c}44` : undefined,
      }}
    >
      <div
        className="fabric-office-floor pointer-events-none absolute inset-[5px] rounded-md border border-black/25"
        style={{ background: floorBg }}
      />
      <div className="pointer-events-none absolute inset-[5px] overflow-hidden rounded-md">
        <RoomInterior role={cell.role} accent={c} vacant={cell.agentKey === null} />
      </div>
      {cell.agentKey ? (
        <FabricWanderingRobot
          accent={c}
          seed={index * 9973 + cell.agentKey.length * 131}
          isEugene={cell.agentKey === "eugene"}
        />
      ) : null}
      <span
        className="pointer-events-none absolute left-2 top-2 z-10 font-mono text-[9px] font-semibold uppercase opacity-85"
        style={{ color: c }}
      >
        #{index + 1}
      </span>
      <span className="pointer-events-none absolute bottom-1.5 left-1 right-1 z-10 truncate text-center font-mono text-[9px] font-bold uppercase tracking-wide text-zinc-200/95 drop-shadow-sm">
        {cell.name}
      </span>
    </button>
  );
}

function FactoryRow({
  slice,
  cells,
  selectedKey,
  onSelectCell,
}: {
  slice: [number, number];
  cells: WorkspaceCell[];
  selectedKey: string | null;
  onSelectCell: (agentKey: string | null, name: string) => void;
}) {
  const row = cells.slice(slice[0], slice[1]);
  return (
    <div className="flex flex-row items-stretch">
      {row.map((cell, j) => {
        const i = slice[0] + j;
        const isSel = cell.agentKey !== null && cell.agentKey === selectedKey;
        return (
          <Fragment key={cell.id}>
            {j > 0 ? <CorridorV /> : null}
            <FabricOfficeRoom
              cell={cell}
              index={i}
              selected={isSel}
              onSelect={() => onSelectCell(cell.agentKey, cell.name)}
            />
          </Fragment>
        );
      })}
    </div>
  );
}

export function FabricWorkspaceCanvas({
  cells,
  selectedKey,
  onSelectCell,
}: FabricWorkspaceCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const pointerOverHostRef = useRef(false);

  useEffect(() => {
    const sync = (e: PointerEvent) => {
      const host = hostRef.current;
      if (!host) return;
      const t = e.target;
      pointerOverHostRef.current = t instanceof Node && host.contains(t);
    };
    window.addEventListener("pointermove", sync, { passive: true });
    window.addEventListener("pointerdown", sync, { passive: true });
    window.addEventListener("pointerup", sync, { passive: true });
    return () => {
      window.removeEventListener("pointermove", sync);
      window.removeEventListener("pointerdown", sync);
      window.removeEventListener("pointerup", sync);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className="fabric-canvas-host fabric-canvas-surface relative h-full min-h-[280px] w-full overflow-hidden rounded-lg border border-red-900/40 shadow-[inset_0_0_60px_rgba(0,0,0,0.45)]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-2 z-20 flex justify-center">
        <p className="rounded-full border border-red-500/30 bg-black/60 px-4 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-red-300/90">
          Fabrik · dig: mus over kortet — WASD / piltaster · pan (midter-/højreklik) · zoom (~10 %)
        </p>
      </div>
      <TransformWrapper
        initialScale={0.88}
        minScale={0.28}
        maxScale={2.4}
        centerOnInit
        smooth={false}
        wheel={{ step: 0.1 }}
        pinch={{ step: 0.08 }}
        doubleClick={{ disabled: true }}
        /* Left-click pan off: avoids stuck isPanning (which blocks wheel zoom) after clicking
           office tiles, without panning.excluded (library calls target.matches — crashes if target is a Text node). */
        panning={{ allowLeftClickPan: false }}
      >
        <TransformComponent
          wrapperClass="!w-full !h-full min-h-full min-w-full"
          wrapperStyle={{ width: "100%", height: "100%", touchAction: "none" }}
          contentClass="fabric-transform-content !w-full !h-full flex items-center justify-center p-8"
        >
          <div
            className="fabric-factory-floor shrink-0 rounded-xl border border-zinc-800/80 bg-zinc-950 p-3 shadow-2xl"
            style={{ width: FLOOR_W + 24, minHeight: FLOOR_H + 24 }}
          >
            <div
              className="relative flex flex-col items-center gap-0 rounded-lg border border-zinc-700/40 bg-black/20 p-1"
              style={{ width: FLOOR_W, minHeight: FLOOR_H }}
            >
              <FactoryRow
                slice={[0, 4]}
                cells={cells}
                selectedKey={selectedKey}
                onSelectCell={onSelectCell}
              />
              <CorridorH />
              <FactoryRow
                slice={[4, 8]}
                cells={cells}
                selectedKey={selectedKey}
                onSelectCell={onSelectCell}
              />
              <FabricFloorOperator floorW={FLOOR_W} floorH={FLOOR_H} pointerOverHostRef={pointerOverHostRef} />
            </div>
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}