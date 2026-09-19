// Esc priority (docs/world/08 §5 #3, decided for S2): the topmost open UI takes the key and nothing
// else reacts; only when nothing is open does Esc leave the world (the pause menu comes with S3).

export type OverlayPhase = "boot" | "title" | "select" | "prologue" | "core" | "play";

export type EscapeAction = "close-dialogue" | "skip-coach" | "back-to-title" | "skip-prologue" | "close-world";

export interface EscapeContext {
  phase: OverlayPhase;
  dialogueOpen: boolean;
  /** The coach-mark bubble is showing. */
  coachActive: boolean;
}

export function resolveEscape({ phase, dialogueOpen, coachActive }: EscapeContext): EscapeAction {
  if (phase === "play") {
    if (dialogueOpen) return "close-dialogue";
    if (coachActive) return "skip-coach";
    return "close-world";
  }
  if (phase === "select") return "back-to-title";
  if (phase === "prologue") return "skip-prologue";
  return "close-world";
}
