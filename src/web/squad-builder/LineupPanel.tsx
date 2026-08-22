import { useState } from "react";
import { AlertCircle, Check, Copy, RotateCcw } from "lucide-react";
import type { SquadPlayer } from "./customPlayerTypes.js";
import type { FormationPreset, SquadPlacement } from "./types.js";

function buildLineupText(
  formation: FormationPreset,
  placements: SquadPlacement[],
  streamerById: Map<string, SquadPlayer>,
) {
  const streamerIdBySlot = new Map(
    placements.map((placement) => [placement.slotId, placement.streamerId]),
  );
  return [...formation.slots]
    .sort((a, b) => a.yPct - b.yPct)
    .map((slot) => {
      const streamerId = streamerIdBySlot.get(slot.id);
      const name = streamerId ? streamerById.get(streamerId)?.displayName : undefined;
      return `- ${slot.label}: ${name ?? "-"}`;
    })
    .join("\n");
}

export function LineupPanel({
  formation,
  placements,
  streamerById,
  hasSlotOffsets,
  onResetPositions,
}: {
  formation: FormationPreset;
  placements: SquadPlacement[];
  streamerById: Map<string, SquadPlayer>;
  /** Whether any pitch card has been manually nudged off its formation position. */
  hasSlotOffsets: boolean;
  onResetPositions: () => void;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(
        buildLineupText(formation, placements, streamerById),
      );
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    } finally {
      setTimeout(() => setCopyState("idle"), 1800);
    }
  }

  const streamerIdBySlot = new Map(
    placements.map((placement) => [placement.slotId, placement.streamerId]),
  );
  const sortedSlots = [...formation.slots].sort((a, b) => a.yPct - b.yPct);

  return (
    <aside className="lineup-panel" aria-label="현재 라인업">
      <div className="lineup-panel__header">
        <span className="lineup-panel__formation">{formation.label}</span>
        <div className="lineup-panel__actions">
          <button
            type="button"
            className="copy-list-button lineup-panel__copy"
            onClick={handleCopy}
            aria-label={
              copyState === "copied"
                ? "복사됨"
                : copyState === "failed"
                  ? "복사 실패"
                  : "라인업 복사"
            }
            title="라인업 복사"
          >
            {copyState === "copied" ? (
              <Check aria-hidden="true" />
            ) : copyState === "failed" ? (
              <AlertCircle aria-hidden="true" />
            ) : (
              <Copy aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className="copy-list-button lineup-panel__reset"
            onClick={onResetPositions}
            disabled={!hasSlotOffsets}
            title="드래그로 조정한 카드 위치를 초기화합니다"
          >
            <RotateCcw aria-hidden="true" />
            위치 초기화
          </button>
        </div>
      </div>
      <ul className="lineup-panel__list">
        {sortedSlots.map((slot) => {
          const streamerId = streamerIdBySlot.get(slot.id);
          const name = streamerId
            ? streamerById.get(streamerId)?.displayName
            : undefined;
          return (
            <li key={slot.id} className="lineup-panel__row">
              <span className="lineup-panel__pos">{slot.label}</span>
              <span
                className={`lineup-panel__name ${name ? "" : "lineup-panel__name--empty"}`}
              >
                {name ?? "-"}
              </span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
