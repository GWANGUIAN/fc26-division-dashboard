// Lifetime shot statistics (docs/pitch/01 §5: fc26-pitch-stats-v1). The match state counts one session; this folds
// each result into the stored totals. Pure: the scene loads and saves.

import type { PitchStats } from "../../storage";
import type { ShotOutcome } from "./match";

/**
 * Returns the totals after one more shot. `sessionBest` is the match's `bestStreak` (a streak that began in an
 * earlier session is not tracked, so the stored best only ever grows).
 */
export function recordShot(stats: PitchStats, outcome: ShotOutcome, sessionBest: number): PitchStats {
  return {
    shots: stats.shots + 1,
    goals: stats.goals + (outcome === "GOAL" ? 1 : 0),
    saves: stats.saves + (outcome === "SAVE" ? 1 : 0),
    bestStreak: Math.max(stats.bestStreak, sessionBest),
  };
}
