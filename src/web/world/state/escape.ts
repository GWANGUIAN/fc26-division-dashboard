// Esc priority (docs/world/08 §5 #3): the topmost open UI takes the key and nothing else reacts. From the top:
//   minigame / card modal → pause menu (a sub-page goes back to the menu first) → mission log → dialogue →
//   coach marks (skip the guide) → otherwise Esc opens the pause menu. Leaving the world is a menu item
//   (or the X button); Esc alone never closes it while playing.

export type OverlayPhase = "boot" | "title" | "select" | "prologue" | "core" | "play";

/** Which page of the pause menu is showing (closed = no menu). */
export type PauseView = "closed" | "main" | "settings" | "confirm-new";

export type EscapeAction =
  | "close-modal"
  | "pause-back"
  | "close-pause"
  | "close-log"
  | "close-dialogue"
  | "skip-coach"
  | "open-pause"
  | "back-to-title"
  | "skip-prologue"
  | "close-world";

export interface EscapeContext {
  phase: OverlayPhase;
  dialogueOpen: boolean;
  /** The coach-mark bubble is showing. */
  coachActive: boolean;
  /** A minigame or the 3D card popup rendered by the world is open. */
  modalOpen?: boolean;
  pauseView?: PauseView;
  logOpen?: boolean;
}

export function resolveEscape({ phase, dialogueOpen, coachActive, modalOpen = false, pauseView = "closed", logOpen = false }: EscapeContext): EscapeAction {
  if (phase === "play") {
    if (modalOpen) return "close-modal";
    if (pauseView === "settings" || pauseView === "confirm-new") return "pause-back";
    if (pauseView === "main") return "close-pause";
    if (logOpen) return "close-log";
    if (dialogueOpen) return "close-dialogue";
    if (coachActive) return "skip-coach";
    return "open-pause";
  }
  if (phase === "select") return "back-to-title";
  if (phase === "prologue") return "skip-prologue";
  return "close-world";
}
