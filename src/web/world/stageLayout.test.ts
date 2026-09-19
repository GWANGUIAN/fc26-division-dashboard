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

describe("computeStageLayout frame", () => {
  it("never changes the stage's size or place — the frame goes around it", () => {
    for (const [width, height, dpr] of [[1920, 1080, 1], [1920, 1000, 1], [1500, 900, 1], [1440, 900, 2], [1920, 1080, 1.25], [1001, 701, 1]] as const) {
      const bare = computeStageLayout(width, height, dpr, false);
      const framed = computeStageLayout(width, height, dpr);
      expect(framed, `${width}x${height}@${dpr}`).toMatchObject({ deviceScale: bare.deviceScale, cssScale: bare.cssScale, left: bare.left, top: bare.top });
      expect(bare.frame).toBeNull();
    }
  });

  it("hugs the stage exactly: the bands sit right outside its edges", () => {
    for (const [width, height, dpr] of [[1920, 1000, 1], [1500, 900, 1], [2560, 1300, 1], [1920, 1000, 1.25], [1440, 900, 2]] as const) {
      const layout = computeStageLayout(width, height, dpr);
      const frame = layout.frame!;
      const label = `${width}x${height}@${dpr}`;
      expect(frame, label).not.toBeNull();
      expect(frame.left + frame.bands.left, label).toBeCloseTo(layout.left, 6);
      expect(frame.top + frame.bands.top, label).toBeCloseTo(layout.top, 6);
      expect(frame.left + frame.width - frame.bands.right, label).toBeCloseTo(layout.left + 640 * layout.cssScale, 6);
      expect(frame.top + frame.height - frame.bands.bottom, label).toBeCloseTo(layout.top + 360 * layout.cssScale, 6);
      // on whole device pixels
      for (const value of [frame.left, frame.top, frame.width, frame.height, ...Object.values(frame.bands)]) expect((value * dpr) % 1 < 1e-6 || (value * dpr) % 1 > 1 - 1e-6, `${label} ${value}`).toBe(true);
      // it fits in the window
      expect(frame.left).toBeGreaterThanOrEqual(0);
      expect(frame.top).toBeGreaterThanOrEqual(0);
      expect(frame.left + frame.width).toBeLessThanOrEqual(width + 1e-6);
      expect(frame.top + frame.height).toBeLessThanOrEqual(height + 1e-6);
    }
  });

  it("scales with the stage while there is room", () => {
    expect(computeStageLayout(1920, 1000).frame!.scale).toBeCloseTo(2 / 2.4);
    expect(computeStageLayout(2560, 1300).frame!.scale).toBeCloseTo(3 / 2.4);
  });

  it("shrinks to the letterbox when it is narrower than the frame wants", () => {
    // 1920×1080 at 2x would have the frame at 0.83, but a 1300-tall window leaves 20px above and below the 1280×720 stage
    const layout = computeStageLayout(1300, 760);
    expect(layout.top).toBe(20);
    expect(layout.frame!.scale).toBeCloseTo(1); // 20 px / 20 art px of band
    expect(layout.frame!.top).toBe(0);
  });

  it("lies over the stage's rim, never outside the window, when the stage fills the window", () => {
    const layout = computeStageLayout(1920, 1080);
    const frame = layout.frame!;
    expect(frame.scale).toBeCloseTo(0.3);
    expect(frame).toMatchObject({ left: 0, top: 0, width: 1920, height: 1080 });
  });

  it("has no frame in a window smaller than the stage", () => {
    expect(computeStageLayout(300, 200).frame).toBeNull();
    expect(computeStageLayout(600, 400).frame).toBeNull();
    expect(computeStageLayout(0, 0).frame).toBeNull();
  });
});
