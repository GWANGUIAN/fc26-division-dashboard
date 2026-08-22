import { useEffect, useRef, useState } from "react";
import { Megaphone } from "lucide-react";
import { ANNOUNCEMENTS_SORTED, type Announcement } from "./announcementsData";
import { useEscape } from "./Modal";

function AnnouncementEntries({
  announcements,
}: {
  announcements: Announcement[];
}) {
  return (
    <>
      {announcements.map((item, index) => (
        <div className="announcement-item" key={item.id}>
          {index > 0 && <hr className="announcement-modal__divider" />}
          <time className="announcement-item__date">{item.date}</time>
          <p>{item.body}</p>
          {item.note && (
            <small className="announcement-item__note">{item.note}</small>
          )}
        </div>
      ))}
    </>
  );
}

export function AnnouncementModal({
  announcements,
  onClose,
  onAcknowledge,
}: {
  announcements: Announcement[];
  onClose: () => void;
  onAcknowledge: () => void;
}) {
  useEscape(onClose);
  return (
    <div className="modal-backdrop announcement-backdrop" role="presentation">
      <section
        className="modal announcement-modal"
        role="dialog"
        aria-modal="true"
        aria-label="공지"
      >
        <div className="modal__header">
          <div>
            <p className="eyebrow">NOTICE</p>
            <h2 className="announcement-modal__title">
              <Megaphone aria-hidden="true" /> 공지
            </h2>
          </div>
          <button className="close" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>
        <div className="modal__body announcement-modal__body">
          <AnnouncementEntries announcements={announcements} />
        </div>
        <div className="announcement-modal__actions">
          <button
            type="button"
            className="announcement-modal__ack"
            onClick={onAcknowledge}
          >
            다시 보지 않기
          </button>
        </div>
      </section>
    </div>
  );
}

export function AnnouncementWidget() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node))
        setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) =>
      event.key === "Escape" && setOpen(false);
    addEventListener("mousedown", closeOnOutsideClick);
    addEventListener("keydown", closeOnEscape);
    return () => {
      removeEventListener("mousedown", closeOnOutsideClick);
      removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);
  return (
    <div className="announcement-widget" ref={wrapRef}>
      {open && (
        <section
          className="announcement-popover"
          role="dialog"
          aria-label="공지"
        >
          <div className="announcement-popover__header">
            <h2 className="announcement-modal__title">
              <Megaphone aria-hidden="true" /> 공지
            </h2>
            <button
              className="close"
              type="button"
              onClick={() => setOpen(false)}
              aria-label="닫기"
            >
              ×
            </button>
          </div>
          <div className="announcement-popover__body">
            <AnnouncementEntries announcements={ANNOUNCEMENTS_SORTED} />
          </div>
        </section>
      )}
      <button
        type="button"
        className="announcement-toggle"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "공지 닫기" : "공지 보기"}
        aria-expanded={open}
      >
        <Megaphone aria-hidden="true" />
      </button>
    </div>
  );
}
