import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { StreamerRecord } from "../../shared/model.js";
import "./pass-announcement.css";
import { SelectionScreen } from "./SelectionScreen";
import { AnnouncementScreen } from "./AnnouncementScreen";
import { AnnouncementTitle } from "./AnnouncementTitle";
import {
  loadAnnouncementTitle,
  saveAnnouncementTitle,
} from "./announcementTitleStorage";
import { loadPassAnnouncementState, savePassAnnouncementState } from "./storage";
import type { PassAnnouncementState, PassEntry } from "./types.js";

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

export function PassAnnouncementOverlay({
  streamers,
  sfxEnabled,
  sfxVolume,
  onSfxVolumeChange,
  onClose,
}: {
  streamers: StreamerRecord[];
  sfxEnabled: boolean;
  sfxVolume: number;
  onSfxVolumeChange: (value: number) => void;
  onClose: () => void;
}) {
  useEscape(onClose);
  useBodyScrollLock();

  const [state, setState] = useState<PassAnnouncementState>(() =>
    loadPassAnnouncementState(),
  );
  useEffect(() => savePassAnnouncementState(state), [state]);

  const [screen, setScreen] = useState<"selection" | "announcement">("selection");
  const [announcementTitle, setAnnouncementTitle] = useState(() =>
    loadAnnouncementTitle(),
  );

  function handleAnnouncementTitleChange(title: string) {
    setAnnouncementTitle(title);
    saveAnnouncementTitle(title);
  }

  const streamerById = useMemo(
    () => new Map(streamers.map((streamer) => [streamer.id, streamer])),
    [streamers],
  );

  // A passer whose player record has disappeared from the live snapshot
  // (e.g. removed from the roster) is dropped so the list never carries a
  // dangling id.
  useEffect(() => {
    setState((current) => {
      const filtered = current.passList.filter((entry) =>
        streamerById.has(entry.streamerId),
      );
      if (filtered.length === current.passList.length) return current;
      return { ...current, passList: filtered };
    });
  }, [streamerById]);

  function addToPassList(streamerId: string, index?: number) {
    setState((current) => {
      if (current.passList.some((entry) => entry.streamerId === streamerId)) {
        return current;
      }
      const list = [...current.passList];
      const insertAt =
        index === undefined
          ? list.length
          : Math.max(0, Math.min(index, list.length));
      list.splice(insertAt, 0, { streamerId, revealed: false });
      return { ...current, passList: list };
    });
  }
  function removeFromPassList(streamerId: string) {
    setState((current) => ({
      ...current,
      passList: current.passList.filter(
        (entry) => entry.streamerId !== streamerId,
      ),
    }));
  }
  function reorderPassList(order: PassEntry[]) {
    setState((current) => ({ ...current, passList: order }));
  }
  function clearPassList() {
    setState((current) => ({ ...current, passList: [] }));
  }
  function markRevealed(streamerId: string) {
    setState((current) => ({
      ...current,
      passList: current.passList.map((entry) =>
        entry.streamerId === streamerId ? { ...entry, revealed: true } : entry,
      ),
    }));
  }

  return (
    <div
      className="pass-announcement-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="합격자 선정"
    >
      <header className="pass-announcement-overlay__header">
        <span className="pass-announcement-overlay__header-spacer" aria-hidden="true" />
        {screen === "selection" ? (
          <span className="pass-announcement-overlay__title">합격자 선정</span>
        ) : (
          <AnnouncementTitle
            title={announcementTitle}
            onChange={handleAnnouncementTitleChange}
          />
        )}
        <button
          type="button"
          className="pass-announcement-overlay__close"
          onClick={onClose}
          aria-label="합격자 선정 닫기"
        >
          <X aria-hidden="true" />
        </button>
      </header>
      {screen === "selection" ? (
        <SelectionScreen
          streamers={streamers}
          passList={state.passList}
          onAdd={addToPassList}
          onRemove={removeFromPassList}
          onReorder={reorderPassList}
          onClearAll={clearPassList}
          onConfirm={() => setScreen("announcement")}
        />
      ) : (
        <AnnouncementScreen
          title={announcementTitle}
          passList={state.passList}
          streamerById={streamerById}
          sfxEnabled={sfxEnabled}
          sfxVolume={sfxVolume}
          onSfxVolumeChange={onSfxVolumeChange}
          onMarkRevealed={markRevealed}
          onBack={() => setScreen("selection")}
        />
      )}
    </div>
  );
}
