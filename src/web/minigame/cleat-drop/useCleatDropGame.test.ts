import { describe, expect, it } from "vitest";
import { createCleatDropAllClearLatch, firstUnclearedStage } from "./useCleatDropGame";
import { defaultProgress, type CleatDropProgress } from "./cleatDropProgress";
import { STAGE_COUNT } from "./cleatDropStages";

describe("cleat drop all-clear latch", () => {
  it("allows exactly one announcement until reset", () => {
    const latch = createCleatDropAllClearLatch();
    expect(latch.claim()).toBe(true);
    // A parent re-render (e.g. the sound-toggle effect) may fire before the announcing effect commits.
    expect(latch.claim()).toBe(false);
    expect(latch.claim()).toBe(false);
    latch.reset();
    expect(latch.claim()).toBe(true);
  });
});

describe("firstUnclearedStage", () => {
  it("picks stage 0 on a fresh save", () => {
    expect(firstUnclearedStage(defaultProgress())).toBe(0);
  });

  it("picks the first false entry when some stages are already cleared", () => {
    const progress: CleatDropProgress = { ...defaultProgress(), cleared: [true, true, true, false, false] };
    expect(firstUnclearedStage(progress)).toBe(3);
  });

  it("falls back to the last stage once every stage is cleared", () => {
    const progress: CleatDropProgress = { ...defaultProgress(), cleared: Array(STAGE_COUNT).fill(true) };
    expect(firstUnclearedStage(progress)).toBe(STAGE_COUNT - 1);
  });
});
