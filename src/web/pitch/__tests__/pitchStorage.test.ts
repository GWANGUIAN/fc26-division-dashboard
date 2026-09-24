import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_PITCH_CHARACTER,
  DEFAULT_PITCH_SETTINGS,
  DEFAULT_PITCH_STATS,
  PITCH_STATS_STORAGE_KEY,
  loadPitchStats,
  savePitchStats,
  ENTRY_MODE_STORAGE_KEY,
  PITCH_CHARACTER_STORAGE_KEY,
  PITCH_SETTINGS_STORAGE_KEY,
  loadEntryMode,
  loadPitchCharacter,
  loadPitchSettings,
  saveEntryMode,
  savePitchCharacter,
  savePitchSettings,
  resetPitchStorageMemory,
} from "../../storage";
import { recordShot } from "../game/stats";

function stubStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
  });
  return map;
}

function stubBrokenStorage() {
  const fail = () => {
    throw new Error("SecurityError");
  };
  vi.stubGlobal("localStorage", { getItem: fail, setItem: fail });
}

afterEach(() => {
  vi.unstubAllGlobals();
  resetPitchStorageMemory();
});

describe("entry mode storage", () => {
  it("round-trips a valid mode", () => {
    const map = stubStorage();
    saveEntryMode("dashboard");
    expect(map.get(ENTRY_MODE_STORAGE_KEY)).toBe("dashboard");
    expect(loadEntryMode()).toBe("dashboard");
  });

  it("returns null for missing or unknown values", () => {
    stubStorage();
    expect(loadEntryMode()).toBeNull();
    stubStorage({ [ENTRY_MODE_STORAGE_KEY]: "3d" });
    expect(loadEntryMode()).toBeNull();
  });
});

describe("pitch character storage", () => {
  it("defaults to woowakgood and round-trips", () => {
    stubStorage();
    expect(loadPitchCharacter()).toBe(DEFAULT_PITCH_CHARACTER);
    savePitchCharacter("janine95kim");
    expect(loadPitchCharacter()).toBe("janine95kim");
  });

  it("corrects malformed ids to the default", () => {
    stubStorage({ [PITCH_CHARACTER_STORAGE_KEY]: "<script>" });
    expect(loadPitchCharacter()).toBe(DEFAULT_PITCH_CHARACTER);
  });
});

describe("pitch settings storage", () => {
  it("returns the defaults when nothing is stored", () => {
    stubStorage();
    expect(loadPitchSettings()).toEqual(DEFAULT_PITCH_SETTINGS);
  });

  it("round-trips and clamps out-of-range or mistyped fields", () => {
    stubStorage();
    savePitchSettings({ sfxVolume: 0.2, musicVolume: 0.9, sfxOn: false, musicOn: true });
    expect(loadPitchSettings()).toEqual({ sfxVolume: 0.2, musicVolume: 0.9, sfxOn: false, musicOn: true });
    stubStorage({ [PITCH_SETTINGS_STORAGE_KEY]: JSON.stringify({ sfxVolume: 7, musicVolume: "loud", sfxOn: "yes" }) });
    expect(loadPitchSettings()).toEqual({ ...DEFAULT_PITCH_SETTINGS, sfxVolume: 1 });
  });

  it("falls back to defaults on corrupt JSON", () => {
    stubStorage({ [PITCH_SETTINGS_STORAGE_KEY]: "{oops" });
    expect(loadPitchSettings()).toEqual(DEFAULT_PITCH_SETTINGS);
  });

  it("returns a copy, not the shared default object", () => {
    stubStorage();
    expect(loadPitchSettings()).not.toBe(DEFAULT_PITCH_SETTINGS);
  });
});

describe("storage that throws (private mode / blocked site data)", () => {
  it("loads fall back to defaults and saves do not throw", () => {
    stubBrokenStorage();
    expect(loadEntryMode()).toBeNull();
    expect(loadPitchCharacter()).toBe(DEFAULT_PITCH_CHARACTER);
    expect(loadPitchSettings()).toEqual(DEFAULT_PITCH_SETTINGS);
    expect(() => saveEntryMode("pitch")).not.toThrow();
    expect(() => savePitchCharacter("x")).not.toThrow();
    expect(() => savePitchSettings(DEFAULT_PITCH_SETTINGS)).not.toThrow();
  });

  it("loads fall back when localStorage does not exist at all", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(loadEntryMode()).toBeNull();
    expect(loadPitchSettings()).toEqual(DEFAULT_PITCH_SETTINGS);
  });
});

describe("pitch stats storage (P4)", () => {
  it("returns zeros when nothing is stored", () => {
    stubStorage();
    expect(loadPitchStats()).toEqual(DEFAULT_PITCH_STATS);
  });

  it("round-trips the four counters", () => {
    const map = stubStorage();
    savePitchStats({ goals: 5, saves: 3, bestStreak: 4, shots: 12 });
    expect(map.get(PITCH_STATS_STORAGE_KEY)).toBeDefined();
    expect(loadPitchStats()).toEqual({ goals: 5, saves: 3, bestStreak: 4, shots: 12 });
  });

  it("repairs bad fields one by one and survives broken JSON", () => {
    stubStorage({ [PITCH_STATS_STORAGE_KEY]: JSON.stringify({ goals: 7.9, saves: -2, bestStreak: "x", shots: 3 }) });
    expect(loadPitchStats()).toEqual({ goals: 7, saves: 0, bestStreak: 0, shots: 3 });
    stubStorage({ [PITCH_STATS_STORAGE_KEY]: "{oops" });
    expect(loadPitchStats()).toEqual(DEFAULT_PITCH_STATS);
  });

  it("does not hand out the shared default object", () => {
    stubStorage();
    const stats = loadPitchStats();
    stats.goals = 99;
    expect(DEFAULT_PITCH_STATS.goals).toBe(0);
  });

  it("survives storage that throws", () => {
    stubBrokenStorage();
    expect(loadPitchStats()).toEqual(DEFAULT_PITCH_STATS);
    expect(() => savePitchStats({ goals: 1, saves: 1, bestStreak: 1, shots: 1 })).not.toThrow();
  });
});

describe("in-memory fallback when storage cannot be written", () => {
  it("keeps the mode, character, settings and stats for the session", () => {
    stubBrokenStorage();
    saveEntryMode("dashboard");
    savePitchCharacter("janine95kim");
    savePitchSettings({ sfxVolume: 0.2, musicVolume: 0.3, sfxOn: false, musicOn: true });
    savePitchStats({ goals: 3, saves: 2, bestStreak: 2, shots: 6 });
    expect(loadEntryMode()).toBe("dashboard");
    expect(loadPitchCharacter()).toBe("janine95kim");
    expect(loadPitchSettings()).toEqual({ sfxVolume: 0.2, musicVolume: 0.3, sfxOn: false, musicOn: true });
    expect(loadPitchStats()).toEqual({ goals: 3, saves: 2, bestStreak: 2, shots: 6 });
  });

  it("working storage stays the source of truth once writes succeed again", () => {
    stubBrokenStorage();
    saveEntryMode("dashboard");
    const map = stubStorage();
    saveEntryMode("pitch");
    expect(map.get(ENTRY_MODE_STORAGE_KEY)).toBe("pitch");
    stubStorage();
    expect(loadEntryMode()).toBeNull();
  });
});

describe("recordShot", () => {
  it("folds each outcome into the totals and only ever raises the best streak", () => {
    let stats = { goals: 0, saves: 0, bestStreak: 5, shots: 0 };
    stats = recordShot(stats, "GOAL", 2);
    stats = recordShot(stats, "SAVE", 0);
    stats = recordShot(stats, "MISS", 0);
    stats = recordShot(stats, "GOAL", 7);
    expect(stats).toEqual({ goals: 2, saves: 1, bestStreak: 7, shots: 4 });
  });

  it("does not mutate its input", () => {
    const before = { goals: 1, saves: 1, bestStreak: 1, shots: 2 };
    recordShot(before, "GOAL", 3);
    expect(before).toEqual({ goals: 1, saves: 1, bestStreak: 1, shots: 2 });
  });
});
