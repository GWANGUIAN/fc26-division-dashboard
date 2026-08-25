import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { StreamerRecord } from "../../shared/model.js";
import { SquadBuilderCard } from "../squad-builder/SquadBuilderCard";
import { CandidatePool } from "./CandidatePool";
import { PassList, type InsertSide } from "./PassList";
import type { PassDragData, PassDropData, PassEntry } from "./types.js";

/** Left half of the target card = insert before it, right half = after. */
function classifyInsertSide(
  pointerX: number,
  targetRect: { left: number; width: number },
): InsertSide {
  const width = targetRect.width || 1;
  const fraction = (pointerX - targetRect.left) / width;
  return fraction < 0.5 ? "before" : "after";
}

function computeInsertIndex(
  orderIds: string[],
  targetId: string | null,
  side: InsertSide | null,
): number {
  if (!targetId) return orderIds.length;
  const index = orderIds.indexOf(targetId);
  if (index === -1) return orderIds.length;
  return side === "after" ? index + 1 : index;
}

export function SelectionScreen({
  streamers,
  passList,
  onAdd,
  onRemove,
  onReorder,
  onClearAll,
  onConfirm,
}: {
  /** Already run through toPassAnnouncementStreamer (see
   * PassAnnouncementOverlay) — fancy decoration stripped, photo forced to
   * the SOOP-id default. */
  streamers: StreamerRecord[];
  passList: PassEntry[];
  onAdd: (streamerId: string, index?: number) => void;
  onRemove: (streamerId: string) => void;
  onReorder: (order: PassEntry[]) => void;
  onClearAll: () => void;
  onConfirm: () => void;
}) {
  const streamerById = useMemo(
    () => new Map(streamers.map((streamer) => [streamer.id, streamer])),
    [streamers],
  );
  const passIds = useMemo(
    () => new Set(passList.map((entry) => entry.streamerId)),
    [passList],
  );
  const poolStreamers = useMemo(
    () =>
      streamers.filter(
        (streamer) => !passIds.has(streamer.id) && !streamer.isExcluded,
      ),
    [streamers, passIds],
  );

  const [activeDragData, setActiveDragData] = useState<PassDragData | null>(null);
  const [dragOverInfo, setDragOverInfo] = useState<
    { targetId: string; side: InsertSide } | null
  >(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as PassDragData | undefined;
    if (data) setActiveDragData(data);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const activeData = event.active.data.current as PassDragData | undefined;
    const overData = event.over?.data.current as PassDropData | undefined;
    if (!overData || overData.kind !== "pass" || !event.over) {
      setDragOverInfo(null);
      return;
    }
    if (activeData?.kind === "pass" && overData.streamerId === activeData.streamerId) {
      setDragOverInfo(null);
      return;
    }
    const overRect = event.over.rect;
    const activeRect = event.active.rect.current.translated;
    const pointerX = activeRect
      ? activeRect.left + activeRect.width / 2
      : overRect.left + overRect.width / 2;
    setDragOverInfo({
      targetId: overData.streamerId,
      side: classifyInsertSide(pointerX, overRect),
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const activeData = event.active.data.current as PassDragData | undefined;
    const overData = event.over?.data.current as PassDropData | undefined;
    const overInfo = dragOverInfo;
    setActiveDragData(null);
    setDragOverInfo(null);
    if (!activeData || !overData) return;

    if (activeData.kind === "pool") {
      if (overData.kind === "pass" || overData.kind === "pass-panel") {
        const targetId = overData.kind === "pass" ? overData.streamerId : null;
        const side =
          targetId && overInfo?.targetId === targetId ? overInfo.side : null;
        const index = computeInsertIndex(
          passList.map((entry) => entry.streamerId),
          targetId,
          side,
        );
        onAdd(activeData.streamerId, index);
      }
      return;
    }

    // activeData.kind === "pass"
    if (overData.kind === "pool") {
      onRemove(activeData.streamerId);
      return;
    }
    const withoutDragged = passList.filter(
      (entry) => entry.streamerId !== activeData.streamerId,
    );
    const draggedEntry = passList.find(
      (entry) => entry.streamerId === activeData.streamerId,
    );
    if (!draggedEntry) return;

    if (overData.kind === "pass" && overData.streamerId !== activeData.streamerId) {
      const side =
        overInfo?.targetId === overData.streamerId ? overInfo.side : "before";
      const index = computeInsertIndex(
        withoutDragged.map((entry) => entry.streamerId),
        overData.streamerId,
        side,
      );
      onReorder([
        ...withoutDragged.slice(0, index),
        draggedEntry,
        ...withoutDragged.slice(index),
      ]);
    } else if (overData.kind === "pass-panel") {
      onReorder([...withoutDragged, draggedEntry]);
    }
  };

  const draggedStreamer = activeDragData
    ? streamerById.get(activeDragData.streamerId)
    : undefined;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveDragData(null);
        setDragOverInfo(null);
      }}
    >
      <div className="pass-selection">
        <CandidatePool
          streamers={poolStreamers}
          onAdd={(streamerId) => onAdd(streamerId)}
        />
        <PassList
          entries={passList}
          streamerById={streamerById}
          dragOverInfo={dragOverInfo}
          onRemove={onRemove}
          onClearAll={onClearAll}
        />
      </div>
      <div className="pass-selection__footer">
        <button
          type="button"
          className="pass-selection__confirm"
          onClick={onConfirm}
          disabled={passList.length === 0}
        >
          선정 완료
        </button>
      </div>
      <DragOverlay>
        {draggedStreamer && (
          <div className="pass-drag-overlay">
            <SquadBuilderCard streamer={draggedStreamer} variant="placed" showGamesPlayed />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
