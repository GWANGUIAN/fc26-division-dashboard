import type { WorldSave } from "../types";
import type { MissionEvent } from "./missionEval";
export const kstDate = (now: number) => new Date(now + 9 * 3600000).toISOString().slice(0, 10);
export const DAILY_TASKS = [
  { id: "sum10", label: "합 10 40점", game: "soccer-sum10", min: 40 },
  { id: "kickups", label: "공 튀기기 10회", game: "kickups", min: 10 },
  { id: "freekick", label: "프리킥 3골", game: "freekick", min: 3 },
  { id: "rush", label: "잔디 러시 300m", game: "rush", min: 300 },
  { id: "talk", label: "서로 다른 주민 3명과 대화", game: null, min: 3 },
] as const;
export function dailyPicks(date: string): string[] {
  let seed = [...date].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
  const ids: string[] = DAILY_TASKS.map(t => t.id);
  for (let i = ids.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = seed % (i + 1); [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, 3);
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
  for (const task of DAILY_TASKS) {
    if (!next.daily.picks.includes(task.id)) continue;
    if (task.id === "talk" && [...done].filter(id => id.startsWith("talk:")).length >= 3) done.add(task.id);
    if (event.type === "minigame" && task.game === event.result.game && (event.result.game === "rush" ? event.result.distance ?? event.result.score : event.result.score) >= task.min) done.add(task.id);
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
