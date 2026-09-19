import { GOLDEN_BALLS } from "../data/goldenBalls";
import type { WorldSave } from "../types";

// Golden balls the showdown has used up. The balls stay in `save.collected` (so they never respawn in the world and the
// collection book still knows where they were found); the ones spent on a round are recorded in that mission's progress
// (`progress.balls`) and no longer count as held: the HUD counter, the kid's mission and the book's "보유" use held balls.
// The ball badges are earned when the balls are found and are kept.

/** The golden balls of a save that were found and not spent yet, in list order. */
export function availableGoldenBalls(collected: readonly string[], spent: readonly string[] = []): string[] {
  return GOLDEN_BALLS.filter((ball) => collected.includes(ball.id) && !spent.includes(ball.id)).map((ball) => ball.id);
}

/** Every golden ball id any mission has spent (only the showdown records them). */
export function spentGoldenBalls(missions: WorldSave["missions"]): string[] {
  const spent: string[] = [];
  for (const entry of Object.values(missions)) {
    const balls = (entry.progress as { balls?: unknown } | undefined)?.balls;
    if (Array.isArray(balls)) for (const id of balls) if (typeof id === "string") spent.push(id);
  }
  return spent;
}

/** How many golden balls the player holds right now. */
export const heldGoldenBalls = (save: Pick<WorldSave, "collected" | "missions">): number =>
  availableGoldenBalls(save.collected, spentGoldenBalls(save.missions)).length;
