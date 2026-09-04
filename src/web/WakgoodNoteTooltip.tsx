import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { StickyNote } from "lucide-react";
import type { StreamerRecord } from "../shared/model.js";
import { getWakgoodNotes } from "./wakgoodNotes";

// Keeps the bubble open for a beat after the pointer leaves the trigger (and
// while it's over the bubble itself), so a small gap or a slightly wobbly
// mouse path doesn't dismiss it before the user can read it.
const HIDE_DELAY_MS = 200;

// Module-level (not per-component) so only one bubble is ever open across the
// whole board: switching hover straight from one player to another closes
// the old one immediately and ignores its hide delay, instead of both being
// visible for a moment.
let activeStreamerId: string | null = null;
const listeners = new Set<() => void>();
function setActiveStreamerId(id: string | null) {
  activeStreamerId = id;
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useWakgoodNoteHover<T extends HTMLElement>(streamerId: string) {
  const open = useSyncExternalStore(
    subscribe,
    () => activeStreamerId === streamerId,
  );
  const anchorRef = useRef<T | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = () => {
    clearTimeout(hideTimer.current);
    setActiveStreamerId(streamerId);
  };
  const scheduleHide = () => {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      // Only clear if we're still the active one — a different trigger may
      // have already taken over before this delayed hide fires.
      if (activeStreamerId === streamerId) setActiveStreamerId(null);
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
  const notes = getWakgoodNotes(streamer.id);
  const written = Boolean(notes && notes.length > 0);

  return createPortal(
    <span
      className={`wakgood-note-bubble wakgood-note-bubble--${placement} ${written ? "wakgood-note-bubble--written" : "wakgood-note-bubble--empty"}`}
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
      <strong className="wakgood-note-bubble__title">
        <StickyNote aria-hidden="true" /> 우왁굳의 메모장
      </strong>
      {written ? (
        <ul className="wakgood-note-bubble__list">
          {notes!.map((note, index) => (
            <li key={index}>{note}</li>
          ))}
        </ul>
      ) : (
        <p className="wakgood-note-bubble__empty">작성전</p>
      )}
    </span>,
    document.body,
  );
}
