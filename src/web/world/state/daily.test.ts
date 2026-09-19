import { describe, expect, it } from "vitest";
import { claimDaily, dailyEvent, dailyPicks, kstDate, refreshDaily, DAILY_TASKS } from "./daily";
import { createNewGameSave, parseWorldSave } from "../storage";
const before = Date.parse("2026-09-19T14:59:59.999Z");
const after = before + 1;
const ended = () => ({ ...createNewGameSave("janine95kim"), flags: { "ending-seen": true as const } });
const completed = (now = before) => { const save = refreshDaily(ended(), now); return { ...save, daily: { ...save.daily, done: [...save.daily.picks] } }; };
describe("KST dailies", () => {
  it("switches at Korean midnight irrespective of the machine timezone", () => {
    expect(kstDate(before)).toBe("2026-09-19"); expect(kstDate(after)).toBe("2026-09-20");
  });
  it("draws three unique repeatable tasks deterministically, across many dates", () => {
    const draws = new Set<string>();
    for (let day = 0; day < 60; day++) {
      const date = kstDate(before + day * 86400000), picks = dailyPicks(date);
      expect(picks).toEqual(dailyPicks(date)); expect(new Set(picks).size).toBe(3);
      for (const id of picks) expect(DAILY_TASKS.some(t => t.id === id)).toBe(true);
      draws.add(picks.join());
    }
    expect(draws.size).toBeGreaterThan(10);
  });
  it("never draws two tasks of the same group and reaches every task over time", () => {
    const seen = new Set<string>();
    for (let day = 0; day < 400; day++) {
      const picks = dailyPicks(kstDate(before + day * 86400000));
      const groups = picks.map(id => DAILY_TASKS.find(t => t.id === id)!.group);
      expect(new Set(groups).size).toBe(3);
      picks.forEach(id => seen.add(id));
    }
    expect([...seen].sort()).toEqual(DAILY_TASKS.map(t => t.id).sort());
  });
  it("rejects incomplete claims, duplicates, stale open panels and clock rollback", () => {
    const fresh = refreshDaily(ended(), before);
    expect(claimDaily(fresh, fresh.daily.date, before).daily.stamps).toHaveLength(0);
    const done = completed(), once = claimDaily(done, done.daily.date, before);
    expect(once.daily.stamps).toEqual(["2026-09-19"]);
    expect(claimDaily(once, done.daily.date, before)).toBe(once);
    const parsed = parseWorldSave(JSON.parse(JSON.stringify(once)));
    if (parsed.status === "invalid") throw new Error(parsed.reason);
    expect(claimDaily(parsed.save, done.daily.date, before).daily.stamps).toHaveLength(1);
    const stale = claimDaily(done, done.daily.date, after);
    expect(stale.daily.done).toEqual([]); expect(stale.daily.stamps).toEqual([]);
    expect(claimDaily(completed(after), "2026-09-20", before).daily.stamps).toEqual([]);
    const next = completed(after); next.daily.stamps = once.daily.stamps;
    expect(claimDaily(next, next.daily.date, after).daily.stamps).toHaveLength(2);
  });
  it("counts distinct talks and completed world rounds, resets progress at midnight", () => {
    let s = refreshDaily(ended(), before); s.daily.picks = ["talk", "rush", "sum10"];
    for (let i = 0; i < 3; i++) s = dailyEvent(s, { type: "talk", cast: "elder" }, before);
    expect(s.daily.done).not.toContain("talk");
    for (const cast of ["kid", "weedking"] as const) s = dailyEvent(s, { type: "talk", cast }, before);
    expect(s.daily.done).toContain("talk");
    s = dailyEvent(s, { type: "minigame", result: { game: "rush", score: 500, distance: 299 } }, before);
    expect(s.daily.done).not.toContain("rush");
    s = dailyEvent(s, { type: "minigame", result: { game: "rush", score: 500, distance: 300 } }, before);
    expect(s.daily.done).toContain("rush");
    expect(refreshDaily(s, after).daily.done).toEqual([]);
    expect(dailyEvent(createNewGameSave("janine95kim"), { type: "talk", cast: "elder" }, before).daily.done).toEqual([]);
  });
  it("judges the card match by turns and counts distinct games, cards and residents", () => {
    let s = refreshDaily(ended(), before); s.daily.picks = ["cardmatch", "plays", "cards"];
    s = dailyEvent(s, { type: "minigame", result: { game: "cardmatch", score: 10, cleared: false } }, before);
    expect(s.daily.done).toEqual([]);
    s = dailyEvent(s, { type: "minigame", result: { game: "cardmatch", score: 25, cleared: true } }, before);
    expect(s.daily.done).not.toContain("cardmatch");
    s = dailyEvent(s, { type: "minigame", result: { game: "cardmatch", score: 24, cleared: true } }, before);
    expect(s.daily.done).toContain("cardmatch");
    for (const game of ["kickups", "kickups"] as const) s = dailyEvent(s, { type: "minigame", result: { game, score: 0 } }, before);
    expect(s.daily.done).not.toContain("plays");
    s = dailyEvent(s, { type: "minigame", result: { game: "freekick", score: 0 } }, before);
    expect(s.daily.done).toContain("plays");
    s = dailyEvent(s, { type: "card-view", cardId: "janine95kim", variant: "base" }, before);
    s = dailyEvent(s, { type: "card-view", cardId: "janine95kim", variant: "gold" }, before);
    s = dailyEvent(s, { type: "card-view", cardId: "not-a-member", variant: "base" }, before);
    expect(s.daily.done).not.toContain("cards");
    s = dailyEvent(s, { type: "card-view", cardId: "weedking", variant: "base" }, before);
    expect(s.daily.done).not.toContain("cards"); // the NPC-only hidden card is not a playable member
    s = dailyEvent(s, { type: "card-view", cardId: "sjh4018", variant: "base" }, before);
    expect(s.daily.done).toContain("cards");
  });
  it("scales the harder tiers: 70 for sum 10, 600m for rush, six residents", () => {
    let s = refreshDaily(ended(), before); s.daily.picks = ["sum10-hard", "rush-hard", "talk-many"];
    s = dailyEvent(s, { type: "minigame", result: { game: "soccer-sum10", score: 69 } }, before);
    s = dailyEvent(s, { type: "minigame", result: { game: "rush", score: 900, distance: 599 } }, before);
    expect(s.daily.done).not.toContain("sum10-hard"); expect(s.daily.done).not.toContain("rush-hard");
    s = dailyEvent(s, { type: "minigame", result: { game: "soccer-sum10", score: 70 } }, before);
    s = dailyEvent(s, { type: "minigame", result: { game: "rush", score: 900, distance: 600 } }, before);
    expect(s.daily.done).toEqual(expect.arrayContaining(["sum10-hard", "rush-hard"]));
    for (const cast of ["elder", "kid", "weedking", "janine95kim", "sjh4018"] as const) s = dailyEvent(s, { type: "talk", cast }, before);
    expect(s.daily.done).not.toContain("talk-many");
    s = dailyEvent(s, { type: "talk", cast: "doormomo" }, before);
    expect(s.daily.done).toContain("talk-many");
  });
  it("grants cumulative 7/14/30 badges atomically with one stamp", () => {
    for (const count of [7,14,30]) {
      const s = completed(); s.daily.stamps = Array.from({ length: count - 1 }, (_, i) => kstDate(before - (i + 1) * 86400000));
      const awarded = claimDaily(s, s.daily.date, before);
      expect(awarded.flags[`badge:daily-${count}`]).toBe(true);
      expect(claimDaily(awarded, s.daily.date, before).daily.stamps).toHaveLength(count);
    }
  });
});
