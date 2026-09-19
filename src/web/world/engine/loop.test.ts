import { describe, expect, it } from "vitest";
import { advance, type Accumulator } from "./loop";

const STEP = 1 / 60;

describe("advance", () => {
  it("runs one step per 60Hz frame", () => {
    const acc: Accumulator = { carry: 0 };
    expect(advance(acc, STEP, STEP, 0.25)).toBe(1);
    expect(acc.carry).toBeCloseTo(0);
  });

  it("carries fractions between frames (144Hz display -> 60 updates per second)", () => {
    const acc: Accumulator = { carry: 0 };
    let steps = 0;
    for (let i = 0; i < 144; i++) steps += advance(acc, 1 / 144, STEP, 0.25);
    expect(steps).toBeGreaterThanOrEqual(59); // floating-point carry may leave the last step for the next frame
    expect(steps).toBeLessThanOrEqual(60);
  });

  it("runs several steps on a slow frame (30Hz display)", () => {
    const acc: Accumulator = { carry: 0 };
    expect(advance(acc, 1 / 30, STEP, 0.25)).toBe(2);
  });

  it("caps a long stall instead of spiralling", () => {
    const acc: Accumulator = { carry: 0 };
    expect(advance(acc, 10, STEP, 0.25)).toBe(15);
  });

  it("ignores negative elapsed time (clock going backwards)", () => {
    const acc: Accumulator = { carry: 0 };
    expect(advance(acc, -1, STEP, 0.25)).toBe(0);
    expect(acc.carry).toBe(0);
  });
});
