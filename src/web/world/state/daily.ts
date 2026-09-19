import { PLAYABLE_CAST } from "../data/worldCast";
import type { MinigameRoundResult, WorldSave } from "../types";
import type { MissionEvent } from "./missionEval";
export const kstDate = (now: number) => new Date(now + 9 * 3600000).toISOString().slice(0, 10);
/**
 * A task is either a minigame goal (`game` + `min`, or `max` for turns) or a counter over distinct
 * `prefix`-ed entries in `daily.done` (`need` of them). Tasks sharing a `group` are never drawn together.
 */
interface DailyTask { id: string; label: string; group: string; game?: MinigameRoundResult["game"]; min?: number; max?: number; prefix?: string; need?: number }
export const DAILY_TASKS: readonly DailyTask[] = [
  { id: "sum10", label: "합 10 40점", group: "sum10", game: "soccer-sum10", min: 40 },
  { id: "sum10-hard", label: "합 10 70점", group: "sum10", game: "soccer-sum10", min: 70 },
  { id: "kickups", label: "공 튀기기 10회", group: "kickups", game: "kickups", min: 10 },
  { id: "kickups-hard", label: "공 튀기기 20회", group: "kickups", game: "kickups", min: 20 },
  { id: "freekick", label: "프리킥 3골", group: "freekick", game: "freekick", min: 3 },
  { id: "freekick-hard", label: "프리킥 5골", group: "freekick", game: "freekick", min: 5 },
  { id: "rush", label: "잔디 러시 300m", group: "rush", game: "rush", min: 300 },
  { id: "rush-hard", label: "잔디 러시 600m", group: "rush", game: "rush", min: 600 },
  { id: "cardmatch", label: "카드 짝 맞추기 24턴 이내 클리어", group: "cardmatch", game: "cardmatch", max: 24 },
  { id: "plays", label: "오락실 서로 다른 게임 3종 플레이", group: "plays", prefix: "play:", need: 3 },
  { id: "cards", label: "월드 카드 서로 다른 2장 공개", group: "cards", prefix: "card:", need: 2 },
  { id: "talk", label: "서로 다른 주민 3명과 대화", group: "talk", prefix: "talk:", need: 3 },
  { id: "talk-many", label: "서로 다른 주민 6명과 대화", group: "talk", prefix: "talk:", need: 6 },
];
const roundScore = (r: MinigameRoundResult) => r.game === "rush" ? r.distance ?? r.score : r.score;
export function dailyPicks(date: string): string[] {
  let seed = [...date].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
  const tasks = [...DAILY_TASKS];
  for (let i = tasks.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = seed % (i + 1); [tasks[i], tasks[j]] = [tasks[j], tasks[i]];
  }
  const groups = new Set<string>(), ids: string[] = [];
  for (const task of tasks) {
    if (groups.has(task.group)) continue;
    groups.add(task.group); ids.push(task.id);
    if (ids.length === 3) break;
  }
  return ids;
}
export function refreshDaily(save: WorldSave, now: number): WorldSave {
  const date = kstDate(now);
  // Do not let a backwards local clock reopen yesterday's progress.
  if (date <= save.daily.date) return save;
  return { ...save, daily: { date, picks: dailyPicks(date), done: [], stamps: save.daily.stamps } };
}
export function dailyEvent(save: WorldSave, event: MissionEvent, now: number): WorldSave {
  if (!save.flags["ending-seen"]) return save;
  const next = refreshDaily(save, now);
  if (next.daily.date !== kstDate(now)) return next;
  const done = new Set(next.daily.done);
  if (event.type === "talk") done.add(`talk:${event.cast}`);
  if (event.type === "card-view" && PLAYABLE_CAST.some(c => c.id === event.cardId)) done.add(`card:${event.cardId}`);
  // An abandoned card match (cleared === false) is not a played round.
  const round = event.type === "minigame" && event.result.cleared !== false ? event.result : null;
  if (round) done.add(`play:${round.game}`);
  for (const task of DAILY_TASKS) {
    if (!next.daily.picks.includes(task.id)) continue;
    if (task.prefix && [...done].filter(id => id.startsWith(task.prefix!)).length >= (task.need ?? 1)) done.add(task.id);
    if (round && task.game === round.game && (task.max !== undefined ? roundScore(round) <= task.max : roundScore(round) >= (task.min ?? 0))) done.add(task.id);
  }
  return { ...next, daily: { ...next.daily, done: [...done] } };
}
export function claimDaily(save: WorldSave, displayedDate: string, now: number): WorldSave {
  const next = refreshDaily(save, now);
  const { date, picks, done, stamps } = next.daily;
  if (!save.flags["ending-seen"] || date !== kstDate(now) || displayedDate !== date || stamps.includes(date) || picks.length !== 3 || !picks.every(id => done.includes(id))) return next;
  const earned = [...new Set([...stamps, date])];
  const flags: WorldSave["flags"] = { ...next.flags, "daily-stamp-earned": true };
  for (const count of [7, 14, 30]) if (earned.length >= count) flags[`badge:daily-${count}`] = true;
  return { ...next, daily: { ...next.daily, stamps: earned }, flags };
}
