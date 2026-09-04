import { useMemo, useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import type { StreamerRecord } from "../../shared/model.js";
import { searchable } from "../../shared/search.js";
import { winRatePercent } from "../../shared/record-extraction.js";
import { PassFifaCard } from "./PassFifaCard";
import type { PassDragData, PassDropData } from "./types.js";

type SortMode = "division" | "winRate" | "games" | "name";

const SORT_OPTIONS: { mode: SortMode; label: string }[] = [
  { mode: "division", label: "디비전순" },
  { mode: "winRate", label: "승률순" },
  { mode: "games", label: "경기순" },
  { mode: "name", label: "가나다순" },
];

function gamesPlayedOf(streamer: StreamerRecord): number | undefined {
  return streamer.record
    ? streamer.record.wins + streamer.record.draws + streamer.record.losses
    : undefined;
}

function sortPool(streamers: StreamerRecord[], mode: SortMode): StreamerRecord[] {
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
      const wa = a.record ? winRatePercent(a.record) : undefined;
      const wb = b.record ? winRatePercent(b.record) : undefined;
      if (wa === undefined && wb === undefined) {
        return a.displayName.localeCompare(b.displayName, "ko");
      }
      if (wa === undefined) return 1;
      if (wb === undefined) return -1;
      if (wa !== wb) return wb - wa;
      return a.displayName.localeCompare(b.displayName, "ko");
    });
  } else if (mode === "games") {
    sorted.sort((a, b) => {
      const ga = gamesPlayedOf(a);
      const gb = gamesPlayedOf(b);
      if (ga === undefined && gb === undefined) {
        return a.displayName.localeCompare(b.displayName, "ko");
      }
      if (ga === undefined) return 1;
      if (gb === undefined) return -1;
      if (ga !== gb) return gb - ga;
      return a.displayName.localeCompare(b.displayName, "ko");
    });
  } else {
    sorted.sort((a, b) => a.displayName.localeCompare(b.displayName, "ko"));
  }
  return sorted;
}

export function CandidatePool({
  streamers,
  onAdd,
}: {
  streamers: StreamerRecord[];
  onAdd: (streamerId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("division");
  const { setNodeRef: setPanelRef } = useDroppable({
    id: "pool-panel",
    data: { kind: "pool" } satisfies PassDropData,
  });

  const sorted = useMemo(() => sortPool(streamers, sortMode), [streamers, sortMode]);
  const visible = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return sorted;
    return sorted.filter((streamer) =>
      searchable(streamer.displayName, streamer.cafeAliases, trimmed),
    );
  }, [sorted, query]);

  return (
    <div className="pass-pool">
      <div className="pass-pool__header">
        <span className="pass-pool__title">
          후보 선수 <b>{streamers.length}</b>
        </span>
        <label className="pass-pool__search">
          <span className="sr-only">후보 선수 검색</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="이름 또는 카페 닉네임 검색"
          />
        </label>
        <div className="pass-pool__sort" role="group" aria-label="후보 선수 정렬">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.mode}
              type="button"
              className={sortMode === option.mode ? "active" : ""}
              onClick={() => setSortMode(option.mode)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="pass-pool__panel" ref={setPanelRef}>
        <div className="pass-pool__grid">
          {visible.map((streamer) => (
            <PoolCard
              key={streamer.id}
              streamer={streamer}
              onAdd={() => onAdd(streamer.id)}
            />
          ))}
          {visible.length === 0 && (
            <p className="pass-pool__empty">표시할 후보가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PoolCard({
  streamer,
  onAdd,
}: {
  streamer: StreamerRecord;
  onAdd: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `pool:${streamer.id}`,
    data: { kind: "pool", streamerId: streamer.id } satisfies PassDragData,
  });
  return (
    <div
      ref={setNodeRef}
      className={`pass-pool-card ${isDragging ? "pass-pool-card--dragging" : ""}`}
      {...listeners}
      {...attributes}
    >
      <PassFifaCard streamer={streamer} />
      <button
        type="button"
        className="pass-pool-card__add"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onAdd();
        }}
        aria-label={`${streamer.displayName} 합격자 명단에 추가`}
        title="합격자 명단에 추가"
      >
        <Plus aria-hidden="true" />
      </button>
    </div>
  );
}
