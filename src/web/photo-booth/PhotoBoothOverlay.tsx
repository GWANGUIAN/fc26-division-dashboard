import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { StreamerRecord } from "../../shared/model.js";
import "./photo-booth.css";
import { PhotoBoothBanner } from "./PhotoBoothBanner";
import { PhotoBoothStreamerPicker } from "./PhotoBoothStreamerPicker";
import { loadPhotoBoothState, savePhotoBoothState } from "./storage";

function useEscape(onClose: () => void) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    addEventListener("keydown", close);
    return () => removeEventListener("keydown", close);
  }, [onClose]);
}

/** Locks the page behind the overlay from scrolling while it's open. */
function useBodyScrollLock() {
  useEffect(() => {
    const html = document.documentElement;
    const { body } = document;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const scrollY = window.scrollY;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      window.scrollTo(0, scrollY);
    };
  }, []);
}

export function PhotoBoothOverlay({
  passedStreamers,
  onClose,
}: {
  passedStreamers: StreamerRecord[];
  onClose: () => void;
}) {
  useEscape(onClose);
  useBodyScrollLock();

  const [selectedStreamerId, setSelectedStreamerId] = useState<string | undefined>(
    () => loadPhotoBoothState().selectedStreamerId,
  );
  const [directorVisible, setDirectorVisible] = useState(
    () => loadPhotoBoothState().directorVisible ?? true,
  );

  // A remembered streamer who no longer has a passed-first-round entry
  // (roster changed since last visit) falls back to the first available one
  // — same dangling-id cleanup PassAnnouncementOverlay does for its list.
  useEffect(() => {
    if (passedStreamers.length === 0) return;
    if (
      selectedStreamerId &&
      passedStreamers.some((streamer) => streamer.id === selectedStreamerId)
    ) {
      return;
    }
    setSelectedStreamerId(passedStreamers[0].id);
  }, [passedStreamers, selectedStreamerId]);

  function handleSelect(id: string) {
    setSelectedStreamerId(id);
    savePhotoBoothState({ schemaVersion: 1, selectedStreamerId: id, directorVisible });
  }

  function handleToggleDirector() {
    setDirectorVisible((current) => {
      const next = !current;
      savePhotoBoothState({ schemaVersion: 1, selectedStreamerId, directorVisible: next });
      return next;
    });
  }

  const selectedStreamer = passedStreamers.find(
    (streamer) => streamer.id === selectedStreamerId,
  );

  return (
    <div
      className="photo-booth-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="합격 인증샷 찍기"
    >
      <div className="photo-booth-topbar-right">
        <button
          type="button"
          className="photo-booth-overlay__close"
          onClick={onClose}
          aria-label="합격 인증샷 닫기"
        >
          <X aria-hidden="true" />
        </button>
      </div>
      <div className="photo-booth-topbar-left">
        <PhotoBoothStreamerPicker
          streamers={passedStreamers}
          selectedId={selectedStreamerId}
          onSelect={handleSelect}
        />
        <button
          type="button"
          className={`photo-booth-director-toggle ${directorVisible ? "" : "photo-booth-director-toggle--off"}`}
          onClick={handleToggleDirector}
          aria-pressed={directorVisible}
          aria-label={directorVisible ? "우왁굳 이미지 숨기기" : "우왁굳 이미지 보이기"}
        >
          우왁굳 {directorVisible ? "ON" : "OFF"}
        </button>
      </div>
      {directorVisible && (
        <img className="photo-booth-director" src="/director.webp" alt="" aria-hidden="true" />
      )}
      {selectedStreamer && <PhotoBoothBanner streamer={selectedStreamer} />}
    </div>
  );
}
