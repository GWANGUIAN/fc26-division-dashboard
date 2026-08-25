import { useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { ANNOUNCEMENT_TITLE_DEFAULT } from "./announcementTitleStorage";

export function AnnouncementTitle({
  title,
  onChange,
}: {
  title: string;
  onChange: (title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEditing() {
    setDraft(title);
    setEditing(true);
    // Focus lands after the input mounts.
    requestAnimationFrame(() => inputRef.current?.select());
  }

  function commit() {
    const trimmed = draft.trim();
    onChange(trimmed ? trimmed : ANNOUNCEMENT_TITLE_DEFAULT);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="pass-announcement-overlay__title-input"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          } else if (event.key === "Escape") {
            event.preventDefault();
            setEditing(false);
          }
        }}
        aria-label="발표 제목 수정"
      />
    );
  }

  return (
    <span className="pass-announcement-overlay__title-group">
      <span className="pass-announcement-overlay__title">{title}</span>
      <button
        type="button"
        className="pass-announcement-overlay__title-edit"
        onClick={startEditing}
        aria-label="발표 제목 수정"
        title="제목 수정"
      >
        <Pencil aria-hidden="true" />
      </button>
    </span>
  );
}
