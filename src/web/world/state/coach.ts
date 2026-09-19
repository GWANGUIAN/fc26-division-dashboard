import type { CastId } from "../types";

// Coach marks C1–C3 (docs/world/02 §4). Each step waits for its own condition and then hands over to the
// next; the bubbles never block movement, since C1 asks the player to walk.

export interface CoachStepDef {
  id: "move" | "talk" | "log";
  text: string;
  /** Extra line under the text (key hints are drawn by the view). */
  hint?: string;
}

export const COACH_STEPS: readonly CoachStepDef[] = [
  { id: "move", text: "방향키 또는 WASD로 움직여 보세요. Shift를 누르면 달려요.", hint: "집 밖으로 나가 볼까요?" },
  { id: "talk", text: "NPC 앞에서 E 키(또는 Space/Enter)를 눌러 말을 걸어 보세요.", hint: "광장의 잔디 할아버지를 찾아가 보세요. 화살표가 알려 줘요." },
  { id: "log", text: "J 키로 미션 로그를 열어 목표를 확인하세요. Esc는 메뉴예요." },
];

/** Index past the last step: the guide is finished. */
export const COACH_DONE = COACH_STEPS.length;

/** Tiles to walk for C1. */
export const COACH_MOVE_TILES = 3;

export type CoachEvent = { type: "walked"; tiles: number } | { type: "talked"; cast: CastId } | { type: "log" };

/** The step after `step` reacts to `event` (unchanged when the event is not the one that step waits for). */
export function nextCoachStep(step: number, event: CoachEvent): number {
  if (step >= COACH_DONE) return step;
  const id = COACH_STEPS[step].id;
  if (id === "move" && event.type === "walked" && event.tiles >= COACH_MOVE_TILES) return step + 1;
  if (id === "talk" && event.type === "talked" && event.cast === "elder") return step + 1;
  if (id === "log" && event.type === "log") return step + 1;
  return step;
}
