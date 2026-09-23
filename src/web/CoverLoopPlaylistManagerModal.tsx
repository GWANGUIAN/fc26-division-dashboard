import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faYoutube } from "@fortawesome/free-brands-svg-icons";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import type { CoverLoopTrack } from "./coverLoopLabData";
import type { CoverLoopTrackFormInput, CustomCoverLoopTrack } from "./customCoverLoopTypes";
import { Modal, useEscape } from "./Modal";
import { SoopLogo } from "./SoopLogo";
import { CoverLoopTrackForm } from "./CoverLoopTrackForm";
import "./cover-loop-playlist-manager.css";

export function CoverLoopPlaylistManagerModal({
  tracks,
  customTracks,
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
  onClose,
}: {
  tracks: CoverLoopTrack[];
  customTracks: CustomCoverLoopTrack[];
  onAdd: (input: CoverLoopTrackFormInput) => Promise<void>;
  onUpdate: (id: string, input: CoverLoopTrackFormInput) => Promise<void>;
  onDelete: (id: string) => void;
  onReorder: (nextOrder: string[]) => void;
  onClose: () => void;
}) {
  // "new" = 오른쪽 패널이 항상 곡 추가 상태, 특정 id = 그 커스텀 곡을 수정하는 상태.
  const [formTarget, setFormTarget] = useState<"new" | string>("new");
  // formTarget이 "new"로 그대로일 때도(예: 추가 도중 초기화) 패널을 리마운트해 필드를 비우기
  // 위한 토큰 — CoverLoopTrackForm의 key에 섞어 쓴다.
  const [formResetToken, setFormResetToken] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<CustomCoverLoopTrack | null>(null);
  useEscape(onClose);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = tracks.map((track) => track.id);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    onReorder(arrayMove(ids, from, to));
  }

  function resetForm() {
    setFormTarget("new");
    setFormResetToken((token) => token + 1);
  }

  const editingTrack =
    formTarget !== "new" ? customTracks.find((track) => track.id === formTarget) : undefined;

  return (
    <Modal
      header={<h2>나만의 플레이 리스트 관리</h2>}
      onClose={onClose}
      label="나만의 플레이 리스트 관리"
      wide
      className="cover-loop-manager-modal"
    >
      <div className="cover-loop-manager-modal__layout">
        <div className="cover-loop-manager-modal__list-col">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={tracks.map((track) => track.id)} strategy={verticalListSortingStrategy}>
              <ul className="cover-loop-manager-modal__list">
                {tracks.map((track) => {
                  const custom = customTracks.find((item) => item.id === track.id);
                  return (
                    <CoverLoopManagerRow
                      key={track.id}
                      track={track}
                      isCustom={!!custom}
                      onEdit={() => setFormTarget(track.id)}
                      onDelete={() => custom && setDeleteTarget(custom)}
                    />
                  );
                })}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
        <div className="cover-loop-manager-modal__form-col">
          <CoverLoopTrackForm
            key={`${formTarget}-${formResetToken}`}
            existing={editingTrack}
            onSubmit={async (input) => {
              if (formTarget === "new") await onAdd(input);
              else await onUpdate(formTarget, input);
              resetForm();
            }}
            onCancel={resetForm}
          />
        </div>
      </div>
      {deleteTarget && (
        <CoverLoopConfirmDialog
          title="곡 삭제"
          message={`"${deleteTarget.title}" 곡을 삭제할까요? 되돌릴 수 없습니다.`}
          confirmLabel="삭제"
          onConfirm={() => {
            onDelete(deleteTarget.id);
            if (formTarget === deleteTarget.id) resetForm();
            setDeleteTarget(null);
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </Modal>
  );
}

// 사이트 기본 ConfirmDialog(SquadControls.tsx)는 녹색 테마라 재생목록의 다크 글래스 톤과
// 어울리지 않아, 같은 스킨으로 통일한 작은 확인 다이얼로그를 여기서 직접 둔다.
function CoverLoopConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="cover-loop-confirm-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="cover-loop-confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="cover-loop-confirm-dialog__actions">
          <button type="button" onClick={onClose}>
            취소
          </button>
          <button type="button" className="cover-loop-confirm-dialog__danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function CoverLoopManagerRow({
  track,
  isCustom,
  onEdit,
  onDelete,
}: {
  track: CoverLoopTrack;
  isCustom: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: track.id,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`cover-loop-manager-row${isDragging ? " cover-loop-manager-row--dragging" : ""}`}
    >
      <button
        type="button"
        className="cover-loop-manager-row__handle"
        aria-label="순서 변경"
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" />
      </button>
      <span className="cover-loop-manager-row__icon" aria-hidden="true">
        {track.media.type === "youtube" ? <FontAwesomeIcon icon={faYoutube} /> : <SoopLogo />}
      </span>
      <span className="cover-loop-manager-row__meta">
        <strong>{track.title}</strong>
        <small>
          {track.artist} · {track.displayName}
        </small>
      </span>
      {isCustom ? (
        <span className="cover-loop-manager-row__actions">
          <button type="button" onClick={onEdit} aria-label="수정">
            <Pencil aria-hidden="true" />
          </button>
          <button type="button" onClick={onDelete} aria-label="삭제">
            <Trash2 aria-hidden="true" />
          </button>
        </span>
      ) : (
        <span className="cover-loop-manager-row__badge">기본 제공</span>
      )}
    </li>
  );
}
