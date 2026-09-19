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

/**
 * Something a conversation makes happen in the mission system. The runner stays pure: a choice carries the
 * effect, the overlay applies it (state/npcDialogue.ts builds them, WorldOverlay executes them).
 */
export type DialogueEffect =
  | { type: "accept"; mission: string }
  | { type: "retry"; mission: string }
  | { type: "finish-talk"; mission: string }
  | { type: "complete"; mission: string }
  /** The next round of the stadium showdown starts: the minigame opens once the conversation is over. */
  | { type: "start-round"; mission: string }
  /** Story flags heard-and-done (a progress talk, the finale offer). */
  | { type: "flags"; flags: string[] }
  /** The ending cut's last line is over: the group photo comes next. */
  | { type: "ending-photo" }
  /** The backwards-walking statue gives (`on`) or takes back its blessing (state/backwalk.ts). */
  | { type: "backwalk"; on: boolean }
  /** The showdown's golden balls clear the current round (state/finaleBalls.ts); the overlay feeds it to the mission as an event. */
  | { type: "finale-balls"; mission: string };

export interface DialogueChoice {
  label: string;
  /** What follows; null ends the conversation. */
  next: DialogueNode | null;
  /** Applied the moment the choice is picked. */
  effect?: DialogueEffect;
  /** Shown greyed out and cannot be picked (the cursor skips it), so the player can see what a choice needs. */
  disabled?: boolean;
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

/** The choice the cursor starts on: the first one that can be picked. */
const firstEnabled = (node: DialogueNode): number => Math.max(0, (node.choices ?? []).findIndex((choice) => !choice.disabled));

export function startDialogue(node: DialogueNode): DialogueState {
  if (node.lines.length === 0) return { node, line: 0, chars: 0, phase: node.choices?.length ? "choosing" : "done", choice: firstEnabled(node) };
  return { node, line: 0, chars: 0, phase: "typing", choice: firstEnabled(node) };
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
  return { ...state, phase: state.node.choices?.length ? "choosing" : "done", choice: firstEnabled(state.node) };
}

/** Moves the cursor one choice up or down (wrapping), skipping the ones that cannot be picked. */
export function moveChoice(state: DialogueState, delta: number): DialogueState {
  const choices = state.node.choices ?? [];
  const count = choices.length;
  if (state.phase !== "choosing" || count === 0) return state;
  const step = delta < 0 ? -1 : 1;
  for (let tried = 1; tried <= count; tried++) {
    const index = (state.choice + step * tried + count * tried) % count;
    if (!choices[index].disabled) return { ...state, choice: index };
  }
  return state;
}

/** Picks the highlighted choice: continues with its branch or ends the conversation. */
export function confirmChoice(state: DialogueState): DialogueState {
  if (state.phase !== "choosing") return state;
  const pick = state.node.choices?.[state.choice];
  if (pick?.disabled) return state;
  if (!pick?.next) return { ...state, phase: "done" };
  return startDialogue(pick.next);
}

/** `{player}` → the chosen character's name. */
export function fillPlaceholders(text: string, playerName: string): string {
  return text.split("{player}").join(playerName);
}
