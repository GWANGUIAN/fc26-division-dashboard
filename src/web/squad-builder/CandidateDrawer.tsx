import { useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable";
import type { StreamerRecord } from "../../shared/model.js";
import { winRatePercent } from "../../shared/record-extraction.js";
import { searchable } from "../../shared/search.js";
import {
  type DragActiveData,
  type DragOverData,
  type DropIntent,
} from "./dragInteraction.js";
import { SquadBuilderCard } from "./SquadBuilderCard";

type SortMode = "division" | "winRate" | "name";

const SORT_OPTIONS: { mode: SortMode; label: string }[] = [
  { mode: "division", label: "디비전순" },
  { mode: "winRate", label: "승률순" },
  { mode: "name", label: "가나다순" },
];

function sortCandidateIds(
  ids: string[],
  streamerById: Map<string, StreamerRecord>,
  mode: SortMode,
): string[] {
  const streamers = ids
    .map((id) => streamerById.get(id))
    .filter((streamer): streamer is StreamerRecord => !!streamer);
  const sorted = [...streamers];
  if (mode === "division") {
    sorted.sort((a, b) => a.currentDivision - b.currentDivision);
  } else if (mode === "winRate") {
    sorted.sort((a, b) => {
      const wa = a.record ? winRatePercent(a.record) : undefined;
      const wb = b.record ? winRatePercent(b.record) : undefined;
      if (wa === undefined && wb === undefined) return 0;
      if (wa === undefined) return 1;
      if (wb === undefined) return -1;
      return wb - wa;
    });
  } else {
    sorted.sort((a, b) => a.displayName.localeCompare(b.displayName, "ko"));
  }
  return sorted.map((streamer) => streamer.id);
}

interface CandidateDrawerProps {
  candidateIds: string[];
  streamerById: Map<string, StreamerRecord>;
  /** `null` when nothing is being dragged (normal hover behavior). `true`/`false` forces the drawer open/closed for the active drag — see SquadBuilderOverlay for the pointer-position logic that decides this. */
  dragExpandOverride: boolean | null;
  dragIntent: { targetId: string; intent: DropIntent } | null;
  onSort: (order: string[]) => void;
}

export function CandidateDrawer({
  candidateIds,
  streamerById,
  dragExpandOverride,
  dragIntent,
  onSort,
}: CandidateDrawerProps) {
  const [query, setQuery] = useState("");
  // Deliberately NOT disabled based on drawer-open state: toggling a
  // droppable's `disabled` flag mid-drag (together with continuous
  // remeasuring) turned out to be the thing making pitch-slot drops
  // unreliable, especially onto empty slots. The drawer-panel stays a
  // normal, always-enabled droppable; candidateAwareCollisionDetection is
  // what makes a pitch slot win over it whenever both overlap the pointer.
  const { setNodeRef: setPanelRef } = useDroppable({
    id: "drawer-panel",
    data: { kind: "drawer" } satisfies DragOverData,
  });

  const visibleIds = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return candidateIds;
    return candidateIds.filter((id) => {
      const streamer = streamerById.get(id);
      if (!streamer) return false;
      return searchable(streamer.displayName, streamer.cafeAliases, trimmed);
    });
  }, [candidateIds, query, streamerById]);

  // Kept equal to the real order at all times (never live-reordered based on
  // drag-hover state — see the comment on resolveInsertIndex for why).
  const sortableItems = useMemo(
    () => visibleIds.map((id) => `candidate:${id}`),
    [visibleIds],
  );

  return (
    <div
      className={`candidate-drawer ${dragExpandOverride === false ? "candidate-drawer--drag-collapsed" : ""} ${dragExpandOverride === true ? "candidate-drawer--drag-expanded" : ""}`}
    >
      <div className="candidate-drawer__handle" aria-hidden="true" />
      <div className="candidate-drawer__header">
        <span className="candidate-drawer__title">
          후보 선수 <b>{candidateIds.length}</b>
        </span>
        <label className="candidate-drawer__search">
          <span className="sr-only">후보 선수 검색</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="이름 또는 카페 닉네임 검색"
          />
        </label>
        <div className="candidate-drawer__sort" role="group" aria-label="후보 선수 정렬">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.mode}
              type="button"
              onClick={() =>
                onSort(sortCandidateIds(candidateIds, streamerById, option.mode))
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="candidate-drawer__panel" ref={setPanelRef}>
        <SortableContext items={sortableItems} strategy={rectSortingStrategy}>
          <div className="candidate-drawer__grid">
            {visibleIds.map((id) => {
              const streamer = streamerById.get(id);
              if (!streamer) return null;
              return (
                <CandidateCard
                  key={id}
                  streamer={streamer}
                  dragIntent={dragIntent}
                />
              );
            })}
            {visibleIds.length === 0 && (
              <p className="candidate-drawer__empty">표시할 후보가 없습니다.</p>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

function CandidateCard({
  streamer,
  dragIntent,
}: {
  streamer: StreamerRecord;
  dragIntent: { targetId: string; intent: DropIntent } | null;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: `candidate:${streamer.id}`,
    data: { kind: "candidate", streamerId: streamer.id } satisfies DragActiveData &
      DragOverData,
  });
  const isTarget = dragIntent?.targetId === streamer.id;
  const isSwapTarget = isTarget && dragIntent?.intent === "swap";
  const isInsertBefore = isTarget && dragIntent?.intent === "insert-before";
  const isInsertAfter = isTarget && dragIntent?.intent === "insert-after";

  return (
    <div
      ref={setNodeRef}
      className={`candidate-card ${isDragging ? "candidate-card--dragging" : ""} ${isSwapTarget ? "candidate-card--swap-target" : ""} ${isInsertBefore ? "candidate-card--insert-before" : ""} ${isInsertAfter ? "candidate-card--insert-after" : ""}`}
      {...listeners}
      {...attributes}
    >
      <SquadBuilderCard streamer={streamer} variant="candidate" />
    </div>
  );
}
