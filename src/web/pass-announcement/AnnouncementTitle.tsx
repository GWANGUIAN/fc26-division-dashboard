import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import {
  ANNOUNCEMENT_TITLE_DEFAULT,
  ANNOUNCEMENT_TITLE_FONT_SIZE_MAX,
  ANNOUNCEMENT_TITLE_FONT_SIZE_MIN,
} from "./announcementTitleStorage";

export function AnnouncementTitle({
  title,
  onChange,
  fontSize,
  onFontSizeChange,
}: {
  title: string;
  onChange: (title: string) => void;
  fontSize: number;
  onFontSizeChange: (fontSize: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLSpanElement>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  function startEditing() {
    setDraft(title);
    setEditing(true);
    // Focus lands after the input mounts.
    requestAnimationFrame(() => inputRef.current?.select());
  }

  function commit() {
    const trimmed = draftRef.current.trim();
    onChange(trimmed ? trimmed : ANNOUNCEMENT_TITLE_DEFAULT);
    setEditing(false);
  }

  // Same click-outside-to-close pattern as SpinDurationSettings: any
  // pointerdown outside the editor (text input + size slider) commits and
  // exits, same as the size slider popover elsewhere in this screen.
  useEffect(() => {
    if (!editing) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        commit();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [editing]);

  if (editing) {
    return (
      <span className="pass-announcement-overlay__title-editor" ref={containerRef}>
        <input
          ref={inputRef}
          className="pass-announcement-overlay__title-input"
          style={{ fontSize }}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
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
        <span className="pass-announcement-overlay__title-size-row">
          <input
            type="range"
            min={ANNOUNCEMENT_TITLE_FONT_SIZE_MIN}
            max={ANNOUNCEMENT_TITLE_FONT_SIZE_MAX}
            step={2}
            value={fontSize}
            onChange={(event) => onFontSizeChange(Number(event.target.value))}
            aria-label="발표 제목 크기"
          />
          <span className="pass-announcement-overlay__title-size-value">
            {fontSize}px
          </span>
        </span>
      </span>
    );
  }

  return (
    <span className="pass-announcement-overlay__title-group">
      <span className="pass-announcement-overlay__title" style={{ fontSize }}>
        {title}
      </span>
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
