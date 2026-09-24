import { describe, expect, it } from "vitest";
import { LOGICAL_HEIGHT, LOGICAL_WIDTH, computeStageMetrics, toLogical } from "../engine/stage";

describe("computeStageMetrics", () => {
  it("fills a 16:9 container exactly", () => {
    const m = computeStageMetrics(1920, 1080, 1);
    expect(m.cssScale).toBe(2);
    expect([m.cssWidth, m.cssHeight, m.left, m.top]).toEqual([1920, 1080, 0, 0]);
    expect(m.renderScale).toBe(2);
  });

  it("letterboxes a wide container (bars left/right)", () => {
    const m = computeStageMetrics(1600, 540, 1);
    expect(m.cssScale).toBe(1);
    expect(m.left).toBe(320);
    expect(m.top).toBe(0);
  });

  it("letterboxes a tall container (bars top/bottom)", () => {
    const m = computeStageMetrics(960, 800, 1);
    expect(m.cssWidth).toBe(960);
    expect(m.top).toBe(130);
  });

  it("clamps renderScale to 1..2", () => {
    expect(computeStageMetrics(480, 270, 1).renderScale).toBe(1);
    expect(computeStageMetrics(960, 540, 1).renderScale).toBe(1);
    expect(computeStageMetrics(960, 540, 2).renderScale).toBe(2);
    expect(computeStageMetrics(2880, 1620, 3).renderScale).toBe(2);
  });

  it("survives a zero-size container and a bad dpr", () => {
    const m = computeStageMetrics(0, 0, 0);
    expect(m.cssScale).toBeGreaterThan(0);
    expect(m.renderScale).toBe(1);
  });
});

describe("toLogical", () => {
  const rect = { left: 100, top: 50, width: 1920, height: 1080 };

  it("maps the rect corners to the logical corners", () => {
    expect(toLogical(rect, 100, 50)).toEqual({ x: 0, y: 0 });
    expect(toLogical(rect, 2020, 1130)).toEqual({ x: LOGICAL_WIDTH, y: LOGICAL_HEIGHT });
  });

  it("maps the centre and scales by the css size", () => {
    expect(toLogical(rect, 1060, 590)).toEqual({ x: 480, y: 270 });
    expect(toLogical({ left: 0, top: 0, width: 480, height: 270 }, 240, 135)).toEqual({ x: 480, y: 270 });
  });

  it("returns the origin for a collapsed rect", () => {
    expect(toLogical({ left: 0, top: 0, width: 0, height: 0 }, 10, 10)).toEqual({ x: 0, y: 0 });
  });
});
