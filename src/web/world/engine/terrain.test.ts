import { describe, expect, it } from "vitest";
import { BLEND_BAND, CHUNK_PX, RESTORE_STEPS, TERRAIN_CHUNK_BYTES, blendSide, blendWeight, ditherThreshold, maxTerrainChunkCount, restoreStep } from "./terrain";

describe("blendWeight", () => {
  it("is half at the border, fades linearly and is zero outside the band", () => {
    expect(blendWeight(0)).toBeCloseTo(0.5);
    expect(blendWeight(BLEND_BAND / 2)).toBeCloseTo(0.25);
    expect(blendWeight(BLEND_BAND)).toBe(0);
    expect(blendWeight(-1)).toBe(0);
  });
});

describe("ditherThreshold", () => {
  it("covers 16 distinct levels in (0, 1) over a 4×4 cell", () => {
    const levels = new Set<number>();
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) levels.add(ditherThreshold(x, y));
    expect(levels.size).toBe(16);
    for (const level of levels) {
      expect(level).toBeGreaterThan(0);
      expect(level).toBeLessThan(1);
    }
  });
});

describe("blendSide", () => {
  it("never blends without a flagged border", () => {
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) expect(blendSide(x, y, {})).toBeNull();
  });

  it("only touches pixels inside the band next to the flagged side", () => {
    let hits = 0;
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const side = blendSide(x, y, { e: true });
        if (side) {
          expect(side).toBe("e");
          expect(31 - x).toBeLessThan(BLEND_BAND);
          hits++;
        }
      }
    }
    expect(hits).toBeGreaterThan(0);
  });

  it("blends about half of the border pixels and none at the far end of the band", () => {
    let atBorder = 0;
    for (let y = 0; y < 32; y++) if (blendSide(31, y, { e: true })) atBorder++;
    expect(atBorder / 32).toBeGreaterThan(0.35);
    expect(atBorder / 32).toBeLessThan(0.65);
    for (let y = 0; y < 32; y++) expect(blendSide(31 - BLEND_BAND, y, { e: true })).toBeNull();
  });

  it("picks the nearest flagged side in a corner", () => {
    expect(blendSide(2, 0, { n: true, w: true })).toBe("n");
    expect(blendSide(0, 2, { n: true, w: true })).toBe("w");
  });
});

describe("restoreStep", () => {
  it("quantises and clamps restore values", () => {
    expect(restoreStep(0)).toBe(0);
    expect(restoreStep(1)).toBe(RESTORE_STEPS);
    expect(restoreStep(2)).toBe(RESTORE_STEPS);
    expect(restoreStep(-1)).toBe(0);
    expect(restoreStep(0.5)).toBe(RESTORE_STEPS / 2);
  });
});

describe("terrain cache budget", () => {
  it("is bounded by map dimensions rather than camera time", () => {
    // 80×60 world → 5×4 chunks, withered and lush variants: 40 maximum 512px canvases (~40 MiB).
    expect(CHUNK_PX).toBe(512);
    expect(maxTerrainChunkCount(80, 60)).toBe(40);
    expect(maxTerrainChunkCount(80, 60) * TERRAIN_CHUNK_BYTES).toBe(40 * 1024 * 1024);
    expect(maxTerrainChunkCount(20, 12)).toBe(4); // two horizontal chunks, each with two variants
  });
});
