import { useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, StickyNote } from "lucide-react";
import type { StreamerRecord } from "../shared/model.js";
import { getWakgoodNote, isSkippedWakgoodNote } from "./wakgoodNotes";

// Keeps the bubble open for a beat after the pointer leaves the trigger (and
// while it's over the bubble itself), so a small gap or a slightly wobbly
// mouse path doesn't dismiss it before the user can read it.
const HIDE_DELAY_MS = 200;

// Module-level (not per-component) so only one bubble is ever open across the
// whole board: switching hover straight from one player to another closes
// the old one immediately and ignores its hide delay, instead of both being
// visible for a moment. Keyed by a per-mount instance id rather than the
// streamer's id — the same streamer can have more than one trigger mounted
// at once (e.g. their list/card/table row underneath an open detail modal
// that also shows the icon), and keying by streamerId made hovering one
// trigger also light up every other trigger for that same streamer.
let activeInstanceId: string | null = null;
const listeners = new Set<() => void>();
function setActiveInstanceId(id: string | null) {
  activeInstanceId = id;
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useWakgoodNoteHover<T extends HTMLElement>() {
  const instanceId = useId();
  const open = useSyncExternalStore(
    subscribe,
    () => activeInstanceId === instanceId,
  );
  const anchorRef = useRef<T | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = () => {
    clearTimeout(hideTimer.current);
    setActiveInstanceId(instanceId);
  };
  const scheduleHide = () => {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      // Only clear if we're still the active one — a different trigger may
      // have already taken over before this delayed hide fires.
      if (activeInstanceId === instanceId) setActiveInstanceId(null);
    }, HIDE_DELAY_MS);
  };

  return { open, show, scheduleHide, anchorRef };
}

/**
 * Renders into document.body (position: fixed, tracked off the trigger's own
 * rect) instead of as a normal absolutely-positioned child. The three views
 * that use this (grid card, tilting FIFA card, scrollable table) each clip
 * or reposition their own descendants in ways that would cut a locally
 * positioned bubble off; a portal sidesteps all of that.
 */
export function WakgoodNoteBubble<T extends HTMLElement>({
  streamer,
  anchorRef,
  onMouseEnter,
  onMouseLeave,
  placement = "bottom",
}: {
  streamer: StreamerRecord;
  anchorRef: React.RefObject<T | null>;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  placement?: "top" | "bottom";
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    const update = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPos(
        placement === "top"
          ? { top: rect.top - 8, left: rect.left + rect.width / 2 }
          : { top: rect.bottom + 8, left: rect.left + rect.width / 2 },
      );
    };
    update();
    addEventListener("scroll", update, true);
    addEventListener("resize", update);
    return () => {
      removeEventListener("scroll", update, true);
      removeEventListener("resize", update);
    };
  }, [anchorRef, placement]);

  if (!pos) return null;
  const entry = getWakgoodNote(streamer.id);
  const notes = entry?.notes;
  const skipped = isSkippedWakgoodNote(notes);
  const written = Boolean(notes && notes.length > 0) && !skipped;
  const stateClass = written
    ? "wakgood-note-bubble--written"
    : skipped
      ? "wakgood-note-bubble--skipped"
      : "wakgood-note-bubble--empty";
  const fancy = Boolean(entry?.fancy);

  return createPortal(
    <span
      className={`wakgood-note-bubble wakgood-note-bubble--${placement} ${stateClass} ${fancy ? "wakgood-note-bubble--fancy" : ""}`}
      role="tooltip"
      style={{ top: pos.top, left: pos.left }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      // The bubble portals to document.body but stays under its trigger in
      // React's own tree, so clicks still bubble to the card/row's onClick
      // (which opens the detail modal) unless stopped here.
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <span className="wakgood-note-bubble__header">
        <strong className="wakgood-note-bubble__title">
          <StickyNote aria-hidden="true" /> 우왁굳의 메모장
        </strong>
        {entry?.vodUrls && entry.vodUrls.length > 0 && (
          <span className="wakgood-note-bubble__vod-group">
            {entry.vodUrls.map((url, index) => (
              <a
                key={url}
                className="wakgood-note-bubble__vod"
                href={url}
                target="_blank"
                rel="noreferrer"
              >
                다시보기{entry.vodUrls!.length > 1 ? ` ${index + 1}` : ""}{" "}
                <ExternalLink aria-hidden="true" />
              </a>
            ))}
          </span>
        )}
      </span>
      {written ? (
        <ul
          className={`wakgood-note-bubble__list ${fancy ? "wakgood-note-bubble__list--fancy" : ""}`}
        >
          {notes!.map((note, index) => (
            <li key={index}>{note}</li>
          ))}
        </ul>
      ) : skipped ? (
        <p className="wakgood-note-bubble__skipped">{notes![0]}</p>
      ) : (
        <p className="wakgood-note-bubble__empty">작성전</p>
      )}
    </span>,
    document.body,
  );
}
