import type { CastId } from "../types";

// Dialogue runner (docs/world/02 §6 node format, S2 subset): a node is a list of lines plus optional
// choices; the runner types a line out, waits for a key, moves on, and ends after the last line or a
// chosen branch. Pure functions over an immutable state so the DOM box is a thin view (and testable).

export type PortraitMood = "neutral" | "happy" | "surprised" | "worried";

export interface DialogueLine {
  /** Cast member speaking (name plate + portrait), or null for narration. */
  speaker: CastId | null;
  text: string;
  mood?: PortraitMood;
}

export interface DialogueChoice {
  label: string;
  /** What follows; null ends the conversation. */
  next: DialogueNode | null;
}

export interface DialogueNode {
  lines: DialogueLine[];
  choices?: DialogueChoice[];
}

export type DialoguePhase = "typing" | "waiting" | "choosing" | "done";

export interface DialogueState {
  node: DialogueNode;
  line: number;
  /** Characters (code points) of the current line that are visible. */
  chars: number;
  phase: DialoguePhase;
  choice: number;
}

/** Typewriter speed in characters per second. */
export const TYPE_SPEED = 42;

export const countChars = (text: string) => Array.from(text).length;

export function startDialogue(node: DialogueNode): DialogueState {
  if (node.lines.length === 0) return { node, line: 0, chars: 0, phase: node.choices?.length ? "choosing" : "done", choice: 0 };
  return { node, line: 0, chars: 0, phase: "typing", choice: 0 };
}

export function currentLine(state: DialogueState): DialogueLine | null {
  return state.node.lines[Math.min(state.line, state.node.lines.length - 1)] ?? null;
}

export function visibleText(state: DialogueState): string {
  const line = currentLine(state);
  if (!line) return "";
  return Array.from(line.text).slice(0, state.chars).join("");
}

/** Types `count` more characters; finishes the line (→ waiting) when the text is complete. */
export function tickTyping(state: DialogueState, count: number): DialogueState {
  if (state.phase !== "typing") return state;
  const line = currentLine(state);
  const total = line ? countChars(line.text) : 0;
  const chars = Math.min(total, state.chars + Math.max(0, count));
  return chars >= total ? { ...state, chars: total, phase: "waiting" } : { ...state, chars };
}

/** The confirm key: completes a line that is still typing, otherwise moves to the next line, the choices, or the end. */
export function advance(state: DialogueState): DialogueState {
  if (state.phase === "typing") {
    const line = currentLine(state);
    return { ...state, chars: line ? countChars(line.text) : 0, phase: "waiting" };
  }
  if (state.phase !== "waiting") return state;
  if (state.line + 1 < state.node.lines.length) return { ...state, line: state.line + 1, chars: 0, phase: "typing" };
  return { ...state, phase: state.node.choices?.length ? "choosing" : "done", choice: 0 };
}

export function moveChoice(state: DialogueState, delta: number): DialogueState {
  const count = state.node.choices?.length ?? 0;
  if (state.phase !== "choosing" || count === 0) return state;
  return { ...state, choice: (state.choice + delta + count) % count };
}

/** Picks the highlighted choice: continues with its branch or ends the conversation. */
export function confirmChoice(state: DialogueState): DialogueState {
  if (state.phase !== "choosing") return state;
  const pick = state.node.choices?.[state.choice];
  if (!pick?.next) return { ...state, phase: "done" };
  return startDialogue(pick.next);
}

/** `{player}` → the chosen character's name. */
export function fillPlaceholders(text: string, playerName: string): string {
  return text.split("{player}").join(playerName);
}
