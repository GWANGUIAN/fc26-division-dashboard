import { useDraggable, useDroppable } from "@dnd-kit/core";
import { FIFA_SHIELD_INNER, FIFA_SHIELD_OUTER } from "../cardVisuals.js";
import { SquadBuilderCard } from "./SquadBuilderCard";
import type { SquadPlayer } from "./customPlayerTypes.js";
import type { DragActiveData, DragOverData } from "./dragInteraction.js";
import type { FormationPreset, FormationSlot, SquadPlacement } from "./types.js";

interface PitchProps {
  formation: FormationPreset;
  placements: SquadPlacement[];
  streamerById: Map<string, SquadPlayer>;
  /** id of the slot a drag is currently hovering over, for the swap-target fade. */
  overSlotId: string | null;
  /** streamer whose card should skip its position transition on this render (see SquadBuilderOverlay). */
  snapStreamerId: string | null;
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
  onRequestEditCustomPlayer,
  onRequestDeleteCustomPlayer,
}: PitchProps) {
  const occupiedSlotIds = new Set(placements.map((p) => p.slotId));
  const slotById = new Map(formation.slots.map((slot) => [slot.id, slot]));

  return (
    <div className="pitch" aria-label="포메이션 피치">
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
      {!occupied && <PitchSlotPlaceholder />}
      <span className="pitch-slot__label">{slot.label}</span>
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
  onRequestEditCustomPlayer,
  onRequestDeleteCustomPlayer,
}: {
  streamer: SquadPlayer;
  slot: FormationSlot;
  isSwapTarget: boolean;
  snap: boolean;
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
  return (
    <div
      ref={setNodeRef}
      className={`pitch-card ${isDragging ? "pitch-card--dragging" : ""} ${isSwapTarget ? "pitch-card--swap-target" : ""} ${snap ? "pitch-card--snap" : ""}`}
      style={{ left: `${slot.xPct}%`, top: `${slot.yPct}%` }}
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
    </div>
  );
}
