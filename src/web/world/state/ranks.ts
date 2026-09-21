import type { MinigameRoundResult, WorldSave } from "../types";
export const RANKS = ["입구컷", "합격 불투명", "합격 조건 충족", "상현급", "에이스급", "반장급", "운영급", "회장"];
const thresholds = {
  "soccer-sum10": [40,70,100,130,155,170], kickups: [10,20,35,50,70,100],
  freekick: [3,4,6,8,11,15], cardmatch: [30,24,20,16,14,12], rush: [300,600,1000,1500,2200,3000],
};
export function arcadeRank(game: MinigameRoundResult["game"], score?: number): string {
  if (score === undefined) return RANKS[0];
  const passed = thresholds[game].filter(t => game === "cardmatch" ? score <= t : score >= t).length;
  return RANKS[passed + 1];
}
/** Position of the rank in RANKS (0 = never played). */
export const rankTier = (game: MinigameRoundResult["game"], score?: number) => RANKS.indexOf(arcadeRank(game, score));
/** The score a game asks for to reach a rank tier (null for the two lowest: not played / played once). The card match counts turns, so lower is better there. */
export const rankGoal = (game: MinigameRoundResult["game"], tier: number): number | null => (tier >= 2 ? thresholds[game][tier - 2] ?? null : null);
/**
 * The next rank to reach and the score it asks for, plus the score of the rank below it (the start of the gauge that fills
 * towards it). Everyone is at least "합격 불투명", so the next goal starts at "합격 조건 충족". Null at the top rank.
 */
export function nextRankGoal(game: MinigameRoundResult["game"], score?: number): { rank: string; goal: number; from: number } | null {
  const target = Math.max(rankTier(game, score) + 1, 2);
  const goal = rankGoal(game, target);
  if (goal === null) return null;
  return { rank: RANKS[target], goal, from: rankGoal(game, target - 1) ?? 0 };
}
export const bestKey = (game: MinigameRoundResult["game"]): keyof WorldSave["bests"] => game === "soccer-sum10" ? "sum10" : game;
export function recordRound(save: WorldSave, result: MinigameRoundResult): WorldSave {
  if (!Number.isFinite(result.score) || result.score < 0 || (result.game === "cardmatch" && result.cleared === false)) return save;
  const key = bestKey(result.game);
  const score = result.game === "rush" ? result.distance ?? result.score : result.score;
  if (!Number.isFinite(score) || score < 0) return save;
  const old = save.bests[key];
  const best = old === undefined ? score : result.game === "cardmatch" ? Math.min(old, score) : Math.max(old, score);
  return { ...save, bests: { ...save.bests, [key]: best }, flags: { ...save.flags, [`title:${result.game}:${arcadeRank(result.game, best)}`]: true, ...(result.game === "rush" && best >= 1000 ? { "badge:rush-1000": true as const } : {}) } };
}
