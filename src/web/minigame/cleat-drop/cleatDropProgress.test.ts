import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CLEAT_DROP_PROGRESS_KEY, defaultProgress, isAllCleared, loadProgress, parseProgress,
  resetProgressMemory, saveProgress, type CleatDropProgress,
} from "./cleatDropProgress";
import { STAGE_COUNT } from "./cleatDropStages";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return { data, getItem: (key: string) => data[key] ?? null, setItem: (key: string, value: string) => void (data[key] = value) };
}

beforeEach(() => resetProgressMemory());
afterEach(() => vi.unstubAllGlobals());

describe("defaultProgress / isAllCleared", () => {
  it("starts with every stage uncleared and no attempts", () => {
    const p = defaultProgress();
    expect(p).toEqual({ version: 1, cleared: Array(STAGE_COUNT).fill(false), attempts: 0, attemptsByStage: Array(STAGE_COUNT).fill(0) });
    expect(isAllCleared(p)).toBe(false);
  });

  it("is all-cleared only once every stage is true", () => {
    const almost: CleatDropProgress = { ...defaultProgress(), cleared: Array(STAGE_COUNT - 1).fill(true).concat(false) };
    expect(isAllCleared(almost)).toBe(false);
    expect(isAllCleared({ ...almost, cleared: Array(STAGE_COUNT).fill(true) })).toBe(true);
  });
});

describe("parseProgress", () => {
  it("falls back to a fresh start on damaged data", () => {
    const badLength = JSON.stringify({ version: 1, cleared: [true], attempts: 0, attemptsByStage: Array(STAGE_COUNT).fill(0) });
    for (const raw of [
      "not json",
      "null",
      "[]",
      JSON.stringify({ version: 2, cleared: Array(STAGE_COUNT).fill(false), attempts: 0, attemptsByStage: Array(STAGE_COUNT).fill(0) }),
      badLength,
      JSON.stringify({ version: 1, cleared: Array(STAGE_COUNT).fill(false), attempts: -1, attemptsByStage: Array(STAGE_COUNT).fill(0) }),
      JSON.stringify({ version: 1, cleared: Array(STAGE_COUNT).fill(false), attempts: 1.5, attemptsByStage: Array(STAGE_COUNT).fill(0) }),
      JSON.stringify({ version: 1, cleared: Array(STAGE_COUNT).fill("yes"), attempts: 0, attemptsByStage: Array(STAGE_COUNT).fill(0) }),
      JSON.stringify({ version: 1, cleared: Array(STAGE_COUNT).fill(false), attempts: 0, attemptsByStage: Array(STAGE_COUNT).fill(-1) }),
    ]) {
      expect(parseProgress(raw), raw).toEqual(defaultProgress());
    }
  });

  it("keeps a well-formed save intact", () => {
    const cleared = Array(STAGE_COUNT).fill(false);
    cleared[0] = true;
    cleared[1] = true;
    const attemptsByStage = Array(STAGE_COUNT).fill(0);
    attemptsByStage[0] = 3;
    attemptsByStage[1] = 1;
    const raw = JSON.stringify({ version: 1, cleared, attempts: 4, attemptsByStage });
    expect(parseProgress(raw)).toEqual({ version: 1, cleared, attempts: 4, attemptsByStage });
  });

  it("treats no saved value as a fresh start", () => {
    expect(parseProgress(null)).toEqual(defaultProgress());
  });
});

describe("storage", () => {
  it("round-trips through localStorage", () => {
    const storage = fakeStorage();
    vi.stubGlobal("localStorage", storage);
    const cleared = Array(STAGE_COUNT).fill(false);
    cleared[5] = true;
    const attemptsByStage = Array(STAGE_COUNT).fill(0);
    attemptsByStage[5] = 7;
    const progress: CleatDropProgress = { version: 1, cleared, attempts: 7, attemptsByStage };
    saveProgress(progress);
    expect(JSON.parse(storage.data[CLEAT_DROP_PROGRESS_KEY]!)).toEqual(progress);
    resetProgressMemory();
    expect(loadProgress()).toEqual(progress);
  });

  it("starts fresh when nothing is stored", () => {
    vi.stubGlobal("localStorage", fakeStorage());
    expect(loadProgress()).toEqual(defaultProgress());
  });

  it("uses the memory copy when localStorage throws or does not exist", () => {
    const fail = () => {
      throw new Error("blocked");
    };
    vi.stubGlobal("localStorage", { getItem: fail, setItem: fail });
    const progress = { ...defaultProgress(), attempts: 12 };
    expect(() => saveProgress(progress)).not.toThrow();
    expect(loadProgress()).toEqual(progress);
    vi.stubGlobal("localStorage", undefined);
    expect(() => saveProgress(progress)).not.toThrow();
    expect(loadProgress()).toEqual(progress);
    resetProgressMemory();
    expect(loadProgress()).toEqual(defaultProgress());
  });
});
