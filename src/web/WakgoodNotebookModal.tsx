import { NotebookPen } from "lucide-react";
import type { StreamerRecord } from "../shared/model.js";
import { Avatar } from "./cardVisuals";
import { Modal, useEscape } from "./Modal";
import { getWakgoodNotes, isSkippedWakgoodNote } from "./wakgoodNotes";

export function WakgoodNotebookModal({
  streamers,
  onClose,
}: {
  streamers: StreamerRecord[];
  onClose: () => void;
}) {
  useEscape(onClose);
  return (
    <Modal
      onClose={onClose}
      label="우왁굳의 메모장"
      wide
      header={
        <div>
          <p className="eyebrow">PLAYER NOTES</p>
          <h2 className="wakgood-notebook__title">
            <NotebookPen aria-hidden="true" /> 우왁굳의 메모장
          </h2>
        </div>
      }
    >
      <ul className="wakgood-notebook__list">
        {streamers.map((streamer) => {
          const notes = getWakgoodNotes(streamer.id);
          const skipped = isSkippedWakgoodNote(notes);
          const written = Boolean(notes && notes.length > 0) && !skipped;
          const stateClass = written
            ? "wakgood-notebook__entry--written"
            : skipped
              ? "wakgood-notebook__entry--skipped"
              : "wakgood-notebook__entry--empty";
          return (
            <li
              className={`wakgood-notebook__entry ${stateClass}`}
              key={streamer.id}
            >
              <div className="wakgood-notebook__entry-head">
                <Avatar {...streamer} />
                <strong>{streamer.displayName}</strong>
              </div>
              {written ? (
                <ul className="wakgood-notebook__notes">
                  {notes!.map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                </ul>
              ) : skipped ? (
                <p className="wakgood-notebook__skipped">{notes![0]}</p>
              ) : (
                <p className="wakgood-notebook__empty">작성전</p>
              )}
            </li>
          );
        })}
        {streamers.length === 0 && (
          <p className="empty-list">표시할 스트리머가 없습니다.</p>
        )}
      </ul>
    </Modal>
  );
}
