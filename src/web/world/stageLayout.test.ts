import { describe, expect, it } from "vitest";
import { computeStageLayout } from "./stageLayout";

describe("computeStageLayout", () => {
  it("uses the largest whole multiplier that fits (floor of min(W/640, H/360))", () => {
    expect(computeStageLayout(1920, 1080).deviceScale).toBe(3);
    expect(computeStageLayout(1280, 720).deviceScale).toBe(2);
    expect(computeStageLayout(1919, 1080).deviceScale).toBe(2); // width-limited: 1919/640 = 2.99
    expect(computeStageLayout(2560, 1080).deviceScale).toBe(3); // height-limited
  });

  it("never drops below 1x, even in a tiny viewport", () => {
    expect(computeStageLayout(300, 200).deviceScale).toBe(1);
    expect(computeStageLayout(0, 0).deviceScale).toBe(1);
  });

  it("centres the stage with a letterbox on the leftover space", () => {
    const layout = computeStageLayout(1920, 1080);
    expect(layout.cssScale).toBe(3);
    expect(layout.left).toBe(0);
    expect(layout.top).toBe(0);
    const wide = computeStageLayout(1500, 900);
    expect(wide.deviceScale).toBe(2);
    expect(wide.left).toBe((1500 - 1280) / 2);
    expect(wide.top).toBe((900 - 720) / 2);
  });

  it("counts device pixels so fractional DPR screens stay crisp", () => {
    const layout = computeStageLayout(1920, 1080, 1.25); // 2400×1350 device pixels
    expect(layout.deviceScale).toBe(3);
    expect(layout.cssScale).toBeCloseTo(2.4);
    // the stage's CSS size times DPR is a whole number of device pixels
    expect(640 * layout.cssScale * 1.25).toBeCloseTo(1920);
    const retina = computeStageLayout(1440, 900, 2); // 2880×1800 device pixels
    expect(retina.deviceScale).toBe(4); // width-limited: 2880/640 = 4.5
    expect(retina.cssScale).toBe(2);
  });

  it("snaps the offset to whole device pixels", () => {
    const layout = computeStageLayout(1001, 701, 1);
    expect(Number.isInteger(layout.left)).toBe(true);
    expect(Number.isInteger(layout.top)).toBe(true);
    const fractional = computeStageLayout(1001, 701, 2);
    expect((fractional.left * 2) % 1).toBe(0);
  });

  it("falls back to DPR 1 for a bogus ratio", () => {
    expect(computeStageLayout(1280, 720, 0).deviceScale).toBe(2);
    expect(computeStageLayout(1280, 720, Number.NaN).deviceScale).toBe(2);
  });
});
