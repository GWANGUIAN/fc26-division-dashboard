import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FOREVER_PROGRESS_KEY, acceptQuest, addXp, advanceQuest, completeQuest, defaultProgress, grantAchievement, loadProgress, parseProgress, questMarkFor,
  questOffered, questReady, resetProgressMemory, saveProgress, xpToNext, type ForeverProgress,
} from "../game/foreverProgress";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return { data, getItem: (key: string) => data[key] ?? null, setItem: (key: string, value: string) => void (data[key] = value) };
}

beforeEach(() => resetProgressMemory());
afterEach(() => vi.unstubAllGlobals());

describe("xp and levels", () => {
  it("follows 100 + 150 * (level - 1)", () => {
    expect([1, 2, 3, 4].map(xpToNext)).toEqual([100, 250, 400, 550]);
  });

  it("levels up exactly at the boundary and keeps the surplus", () => {
    expect(addXp(defaultProgress(), 99)).toMatchObject({ progress: { level: 1, xp: 99 }, levelsGained: [] });
    expect(addXp(defaultProgress(), 100)).toMatchObject({ progress: { level: 2, xp: 0 }, levelsGained: [2] });
    expect(addXp(defaultProgress(), 130)).toMatchObject({ progress: { level: 2, xp: 30 }, levelsGained: [2] });
  });

  it("can gain several levels in one go and ignores negative xp", () => {
    expect(addXp(defaultProgress(), 350)).toMatchObject({ progress: { level: 3, xp: 0 }, levelsGained: [2, 3] });
    expect(addXp(defaultProgress(), -50).progress.xp).toBe(0);
  });
});

describe("quest state", () => {
  it("goes none → active → done, and does not move backwards", () => {
    let p = defaultProgress();
    expect(p.quests.q_rabbits).toBeUndefined();
    p = acceptQuest(p, "q_rabbits");
    expect(p.quests.q_rabbits).toEqual({ state: "active", count: 0 });
    expect(acceptQuest(p, "q_rabbits")).toBe(p);
    for (let i = 0; i < 4; i++) p = advanceQuest(p, "q_rabbits");
    expect(questReady(p, "q_rabbits")).toBe(false);
    p = advanceQuest(p, "q_rabbits");
    expect(p.quests.q_rabbits).toEqual({ state: "active", count: 5 });
    expect(advanceQuest(p, "q_rabbits")).toBe(p); // capped at the goal
    const done = completeQuest(p, "q_rabbits");
    expect(done.progress.quests.q_rabbits).toEqual({ state: "done", count: 5 });
    expect(done.progress).toMatchObject({ level: 2, xp: 0 });
    expect(done.levelsGained).toEqual([2]);
    expect(acceptQuest(done.progress, "q_rabbits")).toBe(done.progress);
    expect(advanceQuest(done.progress, "q_rabbits")).toBe(done.progress);
  });

  it("does not advance a quest that was never accepted, nor complete one that is not ready", () => {
    const p = defaultProgress();
    expect(advanceQuest(p, "q_rabbits")).toBe(p);
    expect(completeQuest(acceptQuest(p, "q_rabbits"), "q_rabbits").levelsGained).toEqual([]);
    const active = acceptQuest(p, "q_rabbits");
    expect(completeQuest(active, "q_rabbits").progress).toBe(active);
  });

  it("offers q_leroy only after q_rabbits is done", () => {
    let p = defaultProgress();
    expect(questOffered(p, "q_leroy")).toBe(false);
    expect(questOffered(p, "q_rabbits")).toBe(true);
    p = acceptQuest(p, "q_rabbits");
    p = advanceQuest(p, "q_rabbits", 5);
    p = completeQuest(p, "q_rabbits").progress;
    expect(questOffered(p, "q_leroy")).toBe(true);
    expect(questOffered(p, "q_rabbits")).toBe(false);
  });

  it("pays the achievement of the hearth quest once", () => {
    let p = acceptQuest(defaultProgress(), "q_hearth");
    p = advanceQuest(p, "q_hearth");
    const done = completeQuest(p, "q_hearth");
    expect(done.achievement).toBe("recall");
    expect(done.progress.achievements).toEqual(["recall"]);
    expect(grantAchievement(done.progress, "recall").added).toBe(false);
  });

  it("marks NPCs: ! to offer, grey ? in progress, yellow ? to hand in", () => {
    let p = defaultProgress();
    expect(questMarkFor(p, "questgiver")).toBe("available");
    expect(questMarkFor(p, "innkeeper")).toBe("available");
    expect(questMarkFor(p, "leroy")).toBeNull();
    p = acceptQuest(p, "q_rabbits");
    expect(questMarkFor(p, "questgiver")).toBe("progress");
    p = advanceQuest(p, "q_rabbits", 5);
    expect(questMarkFor(p, "questgiver")).toBe("complete");
    p = completeQuest(p, "q_rabbits").progress;
    expect(questMarkFor(p, "questgiver")).toBe("available"); // q_leroy is offered now
    p = acceptQuest(p, "q_leroy");
    expect(questMarkFor(p, "questgiver")).toBeNull();
    expect(questMarkFor(p, "leroy")).toBe("complete");
  });
});

describe("storage", () => {
  it("round-trips through localStorage", () => {
    const storage = fakeStorage();
    vi.stubGlobal("localStorage", storage);
    const p: ForeverProgress = { ...acceptQuest(defaultProgress(), "q_rabbits"), level: 2, xp: 40, achievements: ["level2"] };
    saveProgress(p);
    expect(JSON.parse(storage.data[FOREVER_PROGRESS_KEY]!)).toEqual(p);
    resetProgressMemory();
    expect(loadProgress()).toEqual(p);
  });

  it("starts fresh when nothing is stored", () => {
    vi.stubGlobal("localStorage", fakeStorage());
    expect(loadProgress()).toEqual(defaultProgress());
  });

  it("falls back to a fresh start on damaged data", () => {
    for (const raw of ["not json", "null", "[]", '{"version":2,"level":3,"xp":0}', '{"version":1,"level":0,"xp":0}', '{"version":1,"level":"3","xp":0}', '{"version":1,"level":2,"xp":-5}', '{"version":1,"level":2.5,"xp":0}']) {
      expect(parseProgress(raw), raw).toEqual(defaultProgress());
    }
  });

  it("keeps the valid parts of a partly damaged save", () => {
    const raw = JSON.stringify({
      version: 1, level: 3, xp: 10,
      quests: { q_rabbits: { state: "active", count: 99 }, q_leroy: { state: "bogus", count: 1 }, nope: { state: "done", count: 1 } },
      achievements: ["recall", "recall", "unknown", 7],
    });
    expect(parseProgress(raw)).toEqual({ version: 1, level: 3, xp: 10, quests: { q_rabbits: { state: "active", count: 5 } }, achievements: ["recall"] });
  });

  it("keeps the optional letterRead flag only when it is true, and old saves without it stay as they were", () => {
    const base = { version: 1, level: 2, xp: 5, quests: {}, achievements: [] };
    expect(parseProgress(JSON.stringify({ ...base, letterRead: true }))).toEqual({ ...base, letterRead: true });
    expect(parseProgress(JSON.stringify(base))).toEqual(base);
    expect(parseProgress(JSON.stringify(base))).not.toHaveProperty("letterRead");
    for (const bad of ["yes", 1, null, false, {}]) expect(parseProgress(JSON.stringify({ ...base, letterRead: bad }))).not.toHaveProperty("letterRead");
  });

  it("carries letterRead through a save and a load, and through an xp settle", () => {
    const storage = fakeStorage();
    vi.stubGlobal("localStorage", storage);
    saveProgress({ ...defaultProgress(), letterRead: true });
    resetProgressMemory();
    expect(loadProgress().letterRead).toBe(true);
    expect(parseProgress(JSON.stringify({ version: 1, level: 1, xp: 130, quests: {}, achievements: [], letterRead: true }))).toMatchObject({ level: 2, xp: 30, letterRead: true });
    vi.unstubAllGlobals();
  });

  it("settles an xp value that already exceeds its level's price", () => {
    expect(parseProgress('{"version":1,"level":1,"xp":130,"quests":{},"achievements":[]}')).toMatchObject({ level: 2, xp: 30 });
  });

  it("uses the memory copy when localStorage throws or does not exist", () => {
    const fail = () => {
      throw new Error("blocked");
    };
    vi.stubGlobal("localStorage", { getItem: fail, setItem: fail });
    const p = addXp(defaultProgress(), 120).progress;
    expect(() => saveProgress(p)).not.toThrow();
    expect(loadProgress()).toEqual(p);
    vi.stubGlobal("localStorage", undefined);
    expect(() => saveProgress(p)).not.toThrow();
    expect(loadProgress()).toEqual(p);
    resetProgressMemory();
    expect(loadProgress()).toEqual(defaultProgress());
  });
});
