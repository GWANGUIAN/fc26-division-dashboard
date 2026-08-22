import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Move } from "lucide-react";
import { FIFA_SHIELD_INNER, FIFA_SHIELD_OUTER } from "../cardVisuals.js";
import { SquadBuilderCard } from "./SquadBuilderCard";
import type { SquadPlayer } from "./customPlayerTypes.js";
import type { DragActiveData, DragOverData } from "./dragInteraction.js";
import { clampSlotOffset } from "./squadBuilderReducer.js";
import type { FormationPreset, FormationSlot, SlotOffset, SquadPlacement } from "./types.js";

interface PitchProps {
  formation: FormationPreset;
  placements: SquadPlacement[];
  streamerById: Map<string, SquadPlayer>;
  /** id of the slot a drag is currently hovering over, for the swap-target fade. */
  overSlotId: string | null;
  /** streamer whose card should skip its position transition on this render (see SquadBuilderOverlay). */
  snapStreamerId: string | null;
  /** user-controlled card size multiplier, applied via --squad-zoom (see squad-builder.css). */
  zoom: number;
  /** Manual per-slot position nudges, keyed by slot id (see squadBuilderReducer NUDGE_SLOT). */
  slotOffsets: Record<string, SlotOffset>;
  onNudgeSlot: (
    slotId: string,
    slotXPct: number,
    slotYPct: number,
    dxPct: number,
    dyPct: number,
  ) => void;
  onRequestEditCustomPlayer: (id: string) => void;
  onRequestDeleteCustomPlayer: (id: string, name: string) => void;
}

/**
 * Renders two overlapping layers at the same slot coordinates:
 * - a static drop-zone layer (one per formation slot, keyed by slot id —
 *   fine to remount on formation change, it's just an outline + label)
 * - a card layer (one per occupied placement, keyed by streamerId so the
 *   same DOM node survives a formation change and animates via CSS
 *   transition when its slot's x/y changes)
 */
export function Pitch({
  formation,
  placements,
  streamerById,
  overSlotId,
  snapStreamerId,
  zoom,
  slotOffsets,
  onNudgeSlot,
  onRequestEditCustomPlayer,
  onRequestDeleteCustomPlayer,
}: PitchProps) {
  const occupiedSlotIds = new Set(placements.map((p) => p.slotId));
  const slotById = new Map(formation.slots.map((slot) => [slot.id, slot]));

  return (
    <div
      className="pitch"
      aria-label="포메이션 피치"
      style={{ "--squad-zoom": zoom } as CSSProperties}
    >

      <PitchMarkings />
      {formation.slots.map((slot) => (
        <PitchDropZone
          key={slot.id}
          slot={slot}
          occupied={occupiedSlotIds.has(slot.id)}
        />
      ))}
      {placements.map((placement) => {
        const streamer = streamerById.get(placement.streamerId);
        const slot = slotById.get(placement.slotId);
        if (!streamer || !slot) return null;
        return (
          <PitchCard
            key={placement.streamerId}
            streamer={streamer}
            slot={slot}
            isSwapTarget={overSlotId === placement.slotId}
            snap={snapStreamerId === streamer.id}
            offset={slotOffsets[slot.id]}
            onNudgeSlot={onNudgeSlot}
            onRequestEditCustomPlayer={onRequestEditCustomPlayer}
            onRequestDeleteCustomPlayer={onRequestDeleteCustomPlayer}
          />
        );
      })}
    </div>
  );
}

function PitchMarkings() {
  return (
    <svg
      className="pitch__markings"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="98" height="98" fill="none" stroke="currentColor" strokeWidth="0.35" />
      <line x1="1" y1="50" x2="99" y2="50" stroke="currentColor" strokeWidth="0.35" />
      <circle cx="50" cy="50" r="9" fill="none" stroke="currentColor" strokeWidth="0.35" />
      <circle cx="50" cy="50" r="0.6" fill="currentColor" />
      <rect x="24" y="1" width="52" height="14" fill="none" stroke="currentColor" strokeWidth="0.35" />
      <rect x="24" y="85" width="52" height="14" fill="none" stroke="currentColor" strokeWidth="0.35" />
      <rect x="38" y="1" width="24" height="6" fill="none" stroke="currentColor" strokeWidth="0.35" />
      <rect x="38" y="93" width="24" height="6" fill="none" stroke="currentColor" strokeWidth="0.35" />
    </svg>
  );
}

function PitchDropZone({
  slot,
  occupied,
}: {
  slot: FormationSlot;
  occupied: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot:${slot.id}`,
    data: { kind: "slot", slotId: slot.id } satisfies DragOverData,
  });
  return (
    <div
      ref={setNodeRef}
      className={`pitch-slot ${isOver ? "pitch-slot--over" : ""}`}
      style={{ left: `${slot.xPct}%`, top: `${slot.yPct}%` }}
    >
      {!occupied && (
        <>
          <PitchSlotPlaceholder />
          <span className="pitch-slot__label">{slot.label}</span>
        </>
      )}
    </div>
  );
}

function PitchSlotPlaceholder() {
  return (
    <svg
      className="pitch-slot__placeholder"
      viewBox="0 0 300 450"
      aria-hidden="true"
    >
      <path className="pitch-slot__placeholder-outer" d={FIFA_SHIELD_OUTER} />
      <path className="pitch-slot__placeholder-inner" d={FIFA_SHIELD_INNER} />
    </svg>
  );
}

function PitchCard({
  streamer,
  slot,
  isSwapTarget,
  snap,
  offset,
  onNudgeSlot,
  onRequestEditCustomPlayer,
  onRequestDeleteCustomPlayer,
}: {
  streamer: SquadPlayer;
  slot: FormationSlot;
  isSwapTarget: boolean;
  snap: boolean;
  offset: SlotOffset | undefined;
  onNudgeSlot: (
    slotId: string,
    slotXPct: number,
    slotYPct: number,
    dxPct: number,
    dyPct: number,
  ) => void;
  onRequestEditCustomPlayer: (id: string) => void;
  onRequestDeleteCustomPlayer: (id: string, name: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `placed:${streamer.id}`,
    data: {
      kind: "placed",
      streamerId: streamer.id,
      slotId: slot.id,
    } satisfies DragActiveData,
  });

  // Live nudge in progress (see PitchNudgeHandle) overrides the committed
  // offset so the card tracks the cursor 1:1 while dragging, without
  // dispatching (and localStorage-persisting) on every pointermove.
  const [liveOffset, setLiveOffset] = useState<SlotOffset | null>(null);
  const activeOffset = liveOffset ?? offset ?? { dxPct: 0, dyPct: 0 };

  return (
    <div
      ref={setNodeRef}
      className={`pitch-card ${isDragging ? "pitch-card--dragging" : ""} ${isSwapTarget ? "pitch-card--swap-target" : ""} ${snap ? "pitch-card--snap" : ""} ${liveOffset ? "pitch-card--nudging" : ""}`}
      style={{
        left: `${slot.xPct + activeOffset.dxPct}%`,
        top: `${slot.yPct + activeOffset.dyPct}%`,
      }}
      {...listeners}
      {...attributes}
    >
      <SquadBuilderCard
        streamer={streamer}
        variant="placed"
        onEdit={
          streamer.isCustomPlayer
            ? () => onRequestEditCustomPlayer(streamer.id)
            : undefined
        }
        onDelete={
          streamer.isCustomPlayer
            ? () => onRequestDeleteCustomPlayer(streamer.id, streamer.displayName)
            : undefined
        }
      />
      <span className="pitch-slot__label">{slot.label}</span>
      <PitchNudgeHandle
        slotXPct={slot.xPct}
        slotYPct={slot.yPct}
        baseOffset={offset ?? { dxPct: 0, dyPct: 0 }}
        onLiveChange={setLiveOffset}
        onCommit={(next) =>
          onNudgeSlot(slot.id, slot.xPct, slot.yPct, next.dxPct, next.dyPct)
        }
      />
    </div>
  );
}

/**
 * Small hover-revealed handle that lets the user fine-tune a card's position
 * within its slot via mouse drag, independent of the dnd-kit slot-swap drag
 * on the rest of the card (pointerdown here stops propagation so it never
 * reaches the card's dnd-kit listeners). Position is tracked locally while
 * dragging and only committed (dispatched/persisted) on release.
 */
function PitchNudgeHandle({
  slotXPct,
  slotYPct,
  baseOffset,
  onLiveChange,
  onCommit,
}: {
  slotXPct: number;
  slotYPct: number;
  baseOffset: SlotOffset;
  onLiveChange: (offset: SlotOffset | null) => void;
  onCommit: (offset: SlotOffset) => void;
}) {
  const dragState = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    pitchWidth: number;
    pitchHeight: number;
    baseOffset: SlotOffset;
    current: SlotOffset;
  } | null>(null);

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.preventDefault();
    const pitchEl = event.currentTarget.closest(".pitch") as HTMLElement | null;
    if (!pitchEl) return;
    const rect = pitchEl.getBoundingClientRect();
    dragState.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      pitchWidth: rect.width,
      pitchHeight: rect.height,
      baseOffset,
      current: baseOffset,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragState.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const dxPct = ((event.clientX - drag.startClientX) / drag.pitchWidth) * 100;
    const dyPct = ((event.clientY - drag.startClientY) / drag.pitchHeight) * 100;
    const next = clampSlotOffset(
      slotXPct,
      slotYPct,
      drag.baseOffset.dxPct + dxPct,
      drag.baseOffset.dyPct + dyPct,
    );
    drag.current = next;
    onLiveChange(next);
  };

  const endDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragState.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragState.current = null;
    onLiveChange(null);
    onCommit(drag.current);
  };

  return (
    <button
      type="button"
      className="pitch-card__nudge-handle"
      aria-label="카드 위치 조정"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <Move aria-hidden="true" />
    </button>
  );
}
