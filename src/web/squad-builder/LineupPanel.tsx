import { useState } from "react";
import { Copy } from "lucide-react";
import type { StreamerRecord } from "../../shared/model.js";
import type { FormationPreset, SquadPlacement } from "./types.js";

function buildLineupText(
  formation: FormationPreset,
  placements: SquadPlacement[],
  streamerById: Map<string, StreamerRecord>,
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
}: {
  formation: FormationPreset;
  placements: SquadPlacement[];
  streamerById: Map<string, StreamerRecord>;
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
        <button
          type="button"
          className="copy-list-button lineup-panel__copy"
          onClick={handleCopy}
        >
          <Copy aria-hidden="true" />
          {copyState === "copied"
            ? "복사됨"
            : copyState === "failed"
              ? "복사 실패"
              : "라인업 복사"}
        </button>
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
