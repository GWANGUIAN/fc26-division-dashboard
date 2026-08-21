import { useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable";
import { Plus, UserRoundPlus } from "lucide-react";
import { searchable } from "../../shared/search.js";
import { effectiveWinRatePercent, type SquadPlayer } from "./customPlayerTypes.js";
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
  streamerById: Map<string, SquadPlayer>,
  mode: SortMode,
): string[] {
  const streamers = ids
    .map((id) => streamerById.get(id))
    .filter((streamer): streamer is SquadPlayer => !!streamer);
  const sorted = [...streamers];
  if (mode === "division") {
    sorted.sort((a, b) => {
      if (a.currentDivision === b.currentDivision) return 0;
      if (a.currentDivision === 0) return 1;
      if (b.currentDivision === 0) return -1;
      return a.currentDivision - b.currentDivision;
    });
  } else if (mode === "winRate") {
    sorted.sort((a, b) => {
      const wa = effectiveWinRatePercent(a);
      const wb = effectiveWinRatePercent(b);
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
  streamerById: Map<string, SquadPlayer>;
  /** `null` when nothing is being dragged (normal hover behavior). `true`/`false` forces the drawer open/closed for the active drag — see SquadBuilderOverlay for the pointer-position logic that decides this. */
  dragExpandOverride: boolean | null;
  dragIntent: { targetId: string; intent: DropIntent } | null;
  /** True while a *pitch* card is being dragged into the (open) drawer — a
   * placed card can only ever be returned to the candidate list here, never
   * swapped with a specific candidate, so this shows a plain "drop to
   * return" hint instead of highlighting any one card. */
  showReturnHint: boolean;
  onSort: (order: string[]) => void;
  onAddCustomPlayer: () => void;
  onRequestEditCustomPlayer: (id: string) => void;
  onRequestDeleteCustomPlayer: (id: string, name: string) => void;
}

export function CandidateDrawer({
  candidateIds,
  streamerById,
  dragExpandOverride,
  dragIntent,
  showReturnHint,
  onSort,
  onAddCustomPlayer,
  onRequestEditCustomPlayer,
  onRequestDeleteCustomPlayer,
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
        <button
          type="button"
          className="candidate-drawer__add-custom"
          onClick={onAddCustomPlayer}
        >
          <Plus aria-hidden="true" />
          커스텀 선수 추가
        </button>
      </div>
      <div className="candidate-drawer__panel-wrap">
        <div
          className={`candidate-drawer__panel ${showReturnHint ? "candidate-drawer__panel--scroll-locked" : ""}`}
          ref={setPanelRef}
        >
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
                    onRequestEditCustomPlayer={onRequestEditCustomPlayer}
                    onRequestDeleteCustomPlayer={onRequestDeleteCustomPlayer}
                  />
                );
              })}
              {visibleIds.length === 0 && (
                <p className="candidate-drawer__empty">표시할 후보가 없습니다.</p>
              )}
            </div>
          </SortableContext>
        </div>
        {showReturnHint && (
          // Deliberately a sibling of the *scrolling* panel above (not
          // nested inside it) — an absolutely positioned child of a scroll
          // container is still part of its scrollable content, so if the
          // list was already scrolled down before this hint appeared, an
          // inset:0 overlay nested inside the panel would be offset from
          // what's actually visible. This wrapper never scrolls, so the
          // overlay always lines up with the panel's current viewport.
          <div className="candidate-drawer__return-hint" aria-hidden="true">
            <UserRoundPlus aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}

function CandidateCard({
  streamer,
  dragIntent,
  onRequestEditCustomPlayer,
  onRequestDeleteCustomPlayer,
}: {
  streamer: SquadPlayer;
  dragIntent: { targetId: string; intent: DropIntent } | null;
  onRequestEditCustomPlayer: (id: string) => void;
  onRequestDeleteCustomPlayer: (id: string, name: string) => void;
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
      <SquadBuilderCard
        streamer={streamer}
        variant="candidate"
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
