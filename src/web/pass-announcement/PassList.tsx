import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CheckCircle2, X } from "lucide-react";
import type { StreamerRecord } from "../../shared/model.js";
import { ConfirmDialog } from "../squad-builder/SquadControls.js";
import { PassFifaCard } from "./PassFifaCard";
import type { PassDragData, PassDropData, PassEntry } from "./types.js";

export type InsertSide = "before" | "after";

export function PassList({
  entries,
  streamerById,
  dragOverInfo,
  onRemove,
  onClearAll,
}: {
  entries: PassEntry[];
  streamerById: Map<string, StreamerRecord>;
  dragOverInfo: { targetId: string; side: InsertSide } | null;
  onRemove: (streamerId: string) => void;
  onClearAll: () => void;
}) {
  const { setNodeRef: setPanelRef } = useDroppable({
    id: "pass-panel",
    data: { kind: "pass-panel" } satisfies PassDropData,
  });
  const sortableItems = entries.map((entry) => `pass:${entry.streamerId}`);
  const [confirmingClear, setConfirmingClear] = useState(false);

  return (
    <div className="pass-list">
      <div className="pass-list__header">
        <span className="pass-list__title">
          합격자 명단 <b>{entries.length}</b>
        </span>
        {entries.length > 0 && (
          <button
            type="button"
            className="pass-list__clear"
            onClick={() => setConfirmingClear(true)}
          >
            모두 비우기
          </button>
        )}
      </div>
      <div className="pass-list__panel" ref={setPanelRef}>
        <SortableContext items={sortableItems} strategy={rectSortingStrategy}>
          <div className="pass-list__grid">
            {entries.map((entry) => {
              const streamer = streamerById.get(entry.streamerId);
              if (!streamer) return null;
              const isTarget = dragOverInfo?.targetId === entry.streamerId;
              return (
                <PassListCard
                  key={entry.streamerId}
                  streamer={streamer}
                  revealed={entry.revealed}
                  insertSide={isTarget ? dragOverInfo.side : null}
                  onRemove={() => onRemove(entry.streamerId)}
                />
              );
            })}
            {entries.length === 0 && (
              <p className="pass-list__empty">
                후보 선수를 드래그하거나 + 버튼을 클릭해서 합격자 명단에
                추가하세요.
              </p>
            )}
            {entries.length > 0 && (
              <div className="pass-list__spacer" aria-hidden="true" />
            )}
          </div>
        </SortableContext>
      </div>
      {confirmingClear && (
        <ConfirmDialog
          title="합격자 명단 비우기"
          message="명단에 있는 모든 선수를 제거합니다. 이미 발표된 합격자도 함께 제거되며, 되돌릴 수 없습니다."
          confirmLabel="모두 비우기"
          onConfirm={() => {
            onClearAll();
            setConfirmingClear(false);
          }}
          onClose={() => setConfirmingClear(false)}
        />
      )}
    </div>
  );
}

function PassListCard({
  streamer,
  revealed,
  insertSide,
  onRemove,
}: {
  streamer: StreamerRecord;
  revealed: boolean;
  insertSide: InsertSide | null;
  onRemove: () => void;
}) {
  // Always draggable/removable, even once announced — the host may still
  // want to pull someone out or reshuffle order after the fact; `revealed`
  // only drives the small status badge below, nothing is locked.
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: `pass:${streamer.id}`,
    data: { kind: "pass", streamerId: streamer.id } satisfies PassDragData,
  });
  return (
    <div
      ref={setNodeRef}
      className={`pass-list-card ${isDragging ? "pass-list-card--dragging" : ""} ${insertSide === "before" ? "pass-list-card--insert-before" : ""} ${insertSide === "after" ? "pass-list-card--insert-after" : ""}`}
      {...listeners}
      {...attributes}
    >
      <PassFifaCard streamer={streamer} />
      {revealed && (
        <span
          className="pass-list-card__revealed-badge"
          aria-label="이미 공개된 합격자"
          title="이미 공개된 합격자입니다"
        >
          <CheckCircle2 aria-hidden="true" />
        </span>
      )}
      <button
        type="button"
        className="pass-list-card__remove"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        aria-label={`${streamer.displayName} 명단에서 제외`}
      >
        <X aria-hidden="true" />
      </button>
    </div>
  );
}
