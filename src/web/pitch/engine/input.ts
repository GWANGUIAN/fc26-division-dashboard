// Keyboard input for the pitch (docs/pitch/01 §3-3). Keys are matched by `KeyboardEvent.code` so they keep
// working under a Korean IME. Two views of the same keys: held state (`isDown`, for movement) and a queue of
// press edges (`drainPresses`, for one-shot actions). While the canvas owns the keyboard, arrows / Space /
// Tab are swallowed so the page never scrolls or moves focus.

/** Codes whose browser default (scroll / focus move) is suppressed while the pitch is active. */
export const PREVENT_DEFAULT_CODES: ReadonlySet<string> = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Space",
  "Tab",
]);

const MAX_QUEUED_PRESSES = 32;
const NO_PRESSES: readonly string[] = Object.freeze([]);

/** Typing into a field, or activating a real button/link, must not be hijacked by the game. */
export function isIgnoredTarget(target: EventTarget | null): boolean {
  if (typeof HTMLElement === "undefined" || !(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(target.tagName)
  );
}

export interface PitchInput {
  attach(): void;
  detach(): void;
  /** Currently held? */
  isDown(code: string): boolean;
  /** Press edges since the last call (auto-repeat excluded), oldest first. The result is only valid until the next call. */
  drainPresses(): readonly string[];
  /** Drops every held key and queued press (focus lost, tab hidden, scene change). */
  reset(): void;
  /** While false the keyboard is left alone entirely (nothing tracked, nothing prevented). */
  setEnabled(enabled: boolean): void;
}

export function createInput(target: Window = window): PitchInput {
  const held = new Set<string>();
  let presses: string[] = [];
  let enabled = true;
  let attached = false;

  const reset = () => {
    held.clear();
    presses = [];
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (!enabled || event.ctrlKey || event.altKey || event.metaKey || isIgnoredTarget(event.target)) return;
    if (PREVENT_DEFAULT_CODES.has(event.code)) event.preventDefault();
    if (event.repeat || held.has(event.code)) return;
    held.add(event.code);
    if (presses.length < MAX_QUEUED_PRESSES) presses.push(event.code);
  };

  const onKeyUp = (event: KeyboardEvent) => {
    held.delete(event.code);
  };

  const onVisibility = () => {
    if (typeof document !== "undefined" && document.hidden) reset();
  };

  return {
    attach() {
      if (attached) return;
      attached = true;
      target.addEventListener("keydown", onKeyDown);
      target.addEventListener("keyup", onKeyUp);
      target.addEventListener("blur", reset);
      if (typeof document !== "undefined") document.addEventListener("visibilitychange", onVisibility);
    },
    detach() {
      if (!attached) return;
      attached = false;
      target.removeEventListener("keydown", onKeyDown);
      target.removeEventListener("keyup", onKeyUp);
      target.removeEventListener("blur", reset);
      if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onVisibility);
      reset();
    },
    isDown: (code) => enabled && held.has(code),
    drainPresses() {
      if (presses.length === 0) return NO_PRESSES;
      const out = presses;
      presses = [];
      return out;
    },
    reset,
    setEnabled(next) {
      enabled = next;
      if (!next) reset();
    },
  };
}
