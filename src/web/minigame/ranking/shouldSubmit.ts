import { isBetterScore, type ScoreOrder } from "../../../shared/minigame-scores.js";

/**
 * Whether a finished run is worth sending to the ranking: anything when the
 * server has never confirmed a score for this game, otherwise only a strict
 * improvement (fewer turns for "asc" games, more points for "desc" games).
 */
export function shouldSubmit(order: ScoreOrder, score: number, submittedBest: number | null): boolean {
  if (!Number.isFinite(score)) return false;
  return submittedBest === null || isBetterScore(order, score, submittedBest);
}
