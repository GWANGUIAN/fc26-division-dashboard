import { describe, expect, it } from "vitest";
import { FRAME_BUDGET_MS, FramePerf, countDrawImage, formatPerfLine } from "../engine/perf";

describe("FramePerf", () => {
  it("summarises update + render per frame and counts frames over the budget", () => {
    const perf = new FramePerf();
    for (let i = 0; i < 10; i++) {
      perf.addUpdate(1);
      perf.endFrame(i === 9 ? 10 : 1);
    }
    const s = perf.summary();
    expect(s.frames).toBe(10);
    expect(s.maxMs).toBe(11);
    expect(s.overBudget).toBe(1);
    expect(s.avgUpdateMs).toBeCloseTo(1);
    expect(s.avgMs).toBeCloseTo((9 * 2 + 11) / 10);
    expect(FRAME_BUDGET_MS).toBe(4);
  });

  it("sums several update steps into one frame and resets between frames", () => {
    const perf = new FramePerf();
    perf.addUpdate(0.5);
    perf.addUpdate(0.5);
    perf.endFrame(1);
    perf.endFrame(1);
    const s = perf.summary();
    expect(s.frames).toBe(2);
    expect(s.maxMs).toBeCloseTo(2);
  });

  it("keeps only the latest 120 frames", () => {
    const perf = new FramePerf();
    for (let i = 0; i < 300; i++) perf.endFrame(i < 180 ? 100 : 1);
    const s = perf.summary();
    expect(s.frames).toBe(120);
    expect(s.maxMs).toBeCloseTo(1);
  });

  it("is empty-safe", () => {
    expect(new FramePerf().summary().frames).toBe(0);
    expect(formatPerfLine(new FramePerf().summary())).toContain("0f");
  });

  it("counts drawImage calls per frame", () => {
    const calls: unknown[][] = [];
    const g = { drawImage: (...args: unknown[]) => calls.push(args) } as unknown as CanvasRenderingContext2D;
    const perf = new FramePerf();
    countDrawImage(g, perf);
    g.drawImage({} as CanvasImageSource, 0, 0);
    g.drawImage({} as CanvasImageSource, 1, 1);
    perf.endFrame(0);
    expect(calls).toHaveLength(2);
    expect(perf.summary().maxDraws).toBe(2);
  });
});
