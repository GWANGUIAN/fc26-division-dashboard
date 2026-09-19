import { useEffect, useRef } from "react";
import { isEditableTarget } from "../engine/input";

/**
 * Keyboard for a world panel (mission log, pause menu). Listens in the capture phase like the dialogue box:
 * the handler gets the `KeyboardEvent.code` (so Korean IME input still works) and returns true when it used
 * the key — that key is then swallowed. Esc is never passed on: the overlay resolves it (`state/escape.ts`).
 */
export function useWorldKeys(handler: (code: string, event: KeyboardEvent) => boolean) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey || event.code === "Escape" || isEditableTarget(event.target)) return;
      if (ref.current(event.code, event)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);
}

export const CONFIRM_CODES: ReadonlySet<string> = new Set(["KeyE", "Space", "Enter", "NumpadEnter"]);
export const UP_CODES: ReadonlySet<string> = new Set(["ArrowUp", "KeyW"]);
export const DOWN_CODES: ReadonlySet<string> = new Set(["ArrowDown", "KeyS"]);
export const LEFT_CODES: ReadonlySet<string> = new Set(["ArrowLeft", "KeyA"]);
export const RIGHT_CODES: ReadonlySet<string> = new Set(["ArrowRight", "KeyD"]);
