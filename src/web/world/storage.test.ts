import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_WORLD_SETTINGS,
  PROLOGUE_DONE_FLAG,
  WORLD_DISCOVERED_KEY,
  WORLD_SAVE_KEY,
  WORLD_SETTINGS_KEY,
  clearWorldSave,
  createDefaultSave,
  createNewGameSave,
  isContinuableSave,
  isWorldDiscovered,
  loadWorldSave,
  loadWorldSettings,
  markWorldDiscovered,
  parseWorldSave,
  parseWorldSaveText,
  saveWorldSave,
  saveWorldSettings,
} from "./storage";

function makeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
    map,
  };
}

const playing = () => ({
  ...createDefaultSave(),
  player: "janine95kim" as const,
  x: 123.5,
  y: 456,
  facing: "left" as const,
  missions: { "m-doormomo-sum10": { status: "active" as const, progress: { best: 40 }, startedAt: 1 } },
  shards: 3,
  flags: { "tutorial-done": true as const },
  collected: ["gb-01"],
  talked: { elder: 2 },
  bests: { rush: 900, sum10: 60 },
  daily: { date: "2026-09-19", picks: ["a"], done: [], stamps: ["2026-09-18"] },
  coachDone: true,
});

describe("parseWorldSave", () => {
  it("round-trips a valid save unchanged", () => {
    const save = playing();
    const result = parseWorldSave(JSON.parse(JSON.stringify(save)));
    expect(result).toEqual({ status: "ok", save });
  });

  it("accepts a fresh default save (no player yet)", () => {
    expect(parseWorldSave(createDefaultSave()).status).toBe("ok");
  });

  it.each([
    ["not an object", 5],
    ["an array", []],
    ["missing schemaVersion", { ...playing(), schemaVersion: undefined }],
    ["schemaVersion 0", { ...playing(), schemaVersion: 0 }],
    ["a future schemaVersion", { ...playing(), schemaVersion: 99 }],
    ["a non-playable player", { ...playing(), player: "elder" }],
    ["an unknown player", { ...playing(), player: "nobody" }],
    ["a bad scene", { ...playing(), scene: "underworld" }],
    ["a malformed interior scene", { ...playing(), scene: "interior:Bad Id" }],
    ["NaN position", { ...playing(), x: Number.NaN }],
    ["a negative position", { ...playing(), y: -1 }],
    ["a bad facing", { ...playing(), facing: "sideways" }],
    ["a bad mission status", { ...playing(), missions: { m: { status: "done" } } }],
    ["non-integer shards", { ...playing(), shards: 2.5 }],
    ["too many shards", { ...playing(), shards: 11 }],
    ["non-string collected", { ...playing(), collected: [1] }],
    ["array flags", { ...playing(), flags: [] }],
    ["a broken daily block", { ...playing(), daily: { date: 5 } }],
    ["a non-boolean coachDone", { ...playing(), coachDone: "yes" }],
  ])("rejects %s so a new game starts", (_label, value) => {
    expect(parseWorldSave(value).status).toBe("invalid");
  });

  it("drops bad optional entries instead of rejecting the whole save", () => {
    const result = parseWorldSave({
      ...playing(),
      talked: { elder: 2, kid: -1, cat: "x" },
      bests: { rush: 10, sum10: -5, kickups: "fast", bogus: 1 },
      flags: { good: true, bad: false, worse: "yes" },
    });
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.save.talked).toEqual({ elder: 2 });
    expect(result.save.bests).toEqual({ rush: 10 });
    expect(result.save.flags).toEqual({ good: true });
  });

  it("runs migrations in order and reports migrated", () => {
    const migrations = {
      1: (raw: Record<string, unknown>) => ({ ...raw, coachDone: raw.tutorialDone === true }),
    };
    const old = { ...playing(), schemaVersion: 1, tutorialDone: true, coachDone: undefined };
    const result = parseWorldSave(old, migrations, 2);
    expect(result.status).toBe("migrated");
    if (result.status !== "migrated") return;
    expect(result.save.schemaVersion).toBe(2);
    expect(result.save.coachDone).toBe(true);
  });

  it("rejects a save when a migration step is missing or throws", () => {
    expect(parseWorldSave({ ...playing(), schemaVersion: 1 }, {}, 2).status).toBe("invalid");
    const throwing = { 1: () => { throw new Error("boom"); } };
    expect(parseWorldSave({ ...playing(), schemaVersion: 1 }, throwing, 2).status).toBe("invalid");
  });
});

describe("parseWorldSaveText", () => {
  it("distinguishes empty, corrupt and valid storage", () => {
    expect(parseWorldSaveText(null)).toBeNull();
    expect(parseWorldSaveText("{not json")).toMatchObject({ status: "invalid" });
    expect(parseWorldSaveText(JSON.stringify(playing()))).toMatchObject({ status: "ok" });
  });
});

describe("localStorage helpers", () => {
  let storage: ReturnType<typeof makeStorage>;
  beforeEach(() => {
    storage = makeStorage();
    (globalThis as { localStorage?: unknown }).localStorage = storage;
  });
  afterEach(() => {
    delete (globalThis as { localStorage?: unknown }).localStorage;
  });

  it("saves, loads and clears the game", () => {
    expect(loadWorldSave()).toBeNull();
    saveWorldSave(playing());
    expect(storage.map.has(WORLD_SAVE_KEY)).toBe(true);
    expect(loadWorldSave()).toEqual(playing());
    clearWorldSave();
    expect(loadWorldSave()).toBeNull();
  });

  it("treats corrupt or invalid stored saves as no save", () => {
    storage.map.set(WORLD_SAVE_KEY, "garbage");
    expect(loadWorldSave()).toBeNull();
    storage.map.set(WORLD_SAVE_KEY, JSON.stringify({ ...playing(), player: "elder" }));
    expect(loadWorldSave()).toBeNull();
  });

  it("loads settings with defaults, clamping and per-field fallback", () => {
    expect(loadWorldSettings()).toEqual(DEFAULT_WORLD_SETTINGS);
    storage.map.set(WORLD_SETTINGS_KEY, JSON.stringify({ bgm: false, bgmVolume: 150, sfx: "x", sfxVolume: "loud" }));
    expect(loadWorldSettings()).toEqual({ bgm: false, bgmVolume: 100, sfx: true, sfxVolume: 55 });
    storage.map.set(WORLD_SETTINGS_KEY, "nope");
    expect(loadWorldSettings()).toEqual(DEFAULT_WORLD_SETTINGS);
    saveWorldSettings({ bgm: true, bgmVolume: 10, sfx: false, sfxVolume: 0 });
    expect(loadWorldSettings()).toEqual({ bgm: true, bgmVolume: 10, sfx: false, sfxVolume: 0 });
  });

  it("remembers that the world was discovered", () => {
    expect(isWorldDiscovered()).toBe(false);
    markWorldDiscovered();
    expect(storage.map.get(WORLD_DISCOVERED_KEY)).toBe("1");
    expect(isWorldDiscovered()).toBe(true);
  });
});

describe("without localStorage", () => {
  it("never throws and falls back to defaults", () => {
    expect(loadWorldSave()).toBeNull();
    expect(loadWorldSettings()).toEqual(DEFAULT_WORLD_SETTINGS);
    expect(isWorldDiscovered()).toBe(false);
    expect(() => saveWorldSave(playing())).not.toThrow();
    expect(() => markWorldDiscovered()).not.toThrow();
    expect(() => clearWorldSave()).not.toThrow();
  });
});

describe("new game and continue (S2)", () => {
  it("starts a chosen member inside their own house, at the doorway, facing the room", () => {
    const save = createNewGameSave("doormomo");
    expect(save).toMatchObject({ player: "doormomo", scene: "interior:house-doormomo", x: 336, y: 336, facing: "up", coachDone: false, shards: 0 });
    expect(save.flags).toEqual({});
    expect(parseWorldSave(JSON.parse(JSON.stringify(save))).status).toBe("ok");
  });

  it("offers Continue only for saves that finished the prologue", () => {
    expect(isContinuableSave(null)).toBe(false);
    expect(isContinuableSave(createDefaultSave())).toBe(false);
    // An S1 sandbox save: a player and coordinates, but no prologue flag.
    expect(isContinuableSave({ ...playing() })).toBe(false);
    expect(isContinuableSave({ ...playing(), flags: { [PROLOGUE_DONE_FLAG]: true } })).toBe(true);
    expect(isContinuableSave({ ...createNewGameSave("hachi97"), flags: { [PROLOGUE_DONE_FLAG]: true } })).toBe(true);
  });

  it("falls back to the road below the clubhouse when a save has no player", () => {
    expect(createDefaultSave()).toMatchObject({ scene: "overworld", x: 1296, y: 560 });
  });
});
