import { describe, expect, it } from "vitest";
import { createEffectPool, drawEffects, effectFrame } from "../engine/effects";
import { approach, createTween, easeInOutSine, easeOutBack, easeOutCubic, lerp, progress, startTween, stepTween, tweenProgress, tweenValue } from "../engine/tween";

describe("tween", () => {
  it("easings run 0 → 1 and are clamped", () => {
    for (const ease of [easeOutCubic, easeInOutSine, easeOutBack]) {
      expect(ease(0)).toBeCloseTo(0);
      expect(ease(1)).toBeCloseTo(1);
      expect(ease(-3)).toBeCloseTo(0);
      expect(ease(5)).toBeCloseTo(1);
    }
    expect(easeInOutSine(0.5)).toBeCloseTo(0.5);
    expect(easeOutBack(0.6)).toBeGreaterThan(1);
  });

  it("interpolates a value over a duration", () => {
    expect(lerp(10, 20, 0.25)).toBe(12.5);
    expect(progress(0.5, 2)).toBe(0.25);
    expect(progress(1, 0)).toBe(1);
    expect(tweenValue(0, 100, 1, 4)).toBe(25);
  });

  it("a tween timer runs, finishes once and can be restarted without a new object", () => {
    const t = createTween();
    expect(stepTween(t, 0.1)).toBe(1);
    startTween(t, 0.5);
    expect(t.active).toBe(true);
    expect(stepTween(t, 0.25)).toBeCloseTo(0.5);
    expect(tweenProgress(t)).toBeCloseTo(0.5);
    expect(stepTween(t, 1)).toBe(1);
    expect(t.active).toBe(false);
    startTween(t, 0.2);
    expect(t.active).toBe(true);
    expect(t.elapsed).toBe(0);
  });

  it("approach never overshoots", () => {
    expect(approach(0, 10, 3)).toBe(3);
    expect(approach(9, 10, 3)).toBe(10);
    expect(approach(10, 0, 4)).toBe(6);
    expect(approach(2, 0, 4)).toBe(0);
  });
});

describe("effect pool", () => {
  it("plays an effect once, drifting, then frees the slot", () => {
    const pool = createEffectPool(3);
    pool.spawn({ key: "fx/fx-star", frames: 4, x: 10, y: 20, vy: -20, life: 0.5 });
    expect(pool.activeCount).toBe(1);
    pool.update(0.25);
    expect(pool.items[0]!.y).toBeCloseTo(15);
    expect(effectFrame(pool.items[0]!)).toBe(2);
    pool.update(0.3);
    expect(pool.activeCount).toBe(0);
    expect(pool.items).toHaveLength(3);
  });

  it("overwrites the oldest slot when full instead of growing", () => {
    const pool = createEffectPool(2);
    for (let i = 0; i < 5; i++) pool.spawn({ key: "k", frames: 1, x: i, y: 0, life: 10 });
    expect(pool.activeCount).toBe(2);
    expect(pool.items).toHaveLength(2);
    expect(pool.items.map((e) => e.x).sort()).toEqual([3, 4]);
  });

  it("the frame stays inside the strip", () => {
    expect(effectFrame({ age: 0, life: 1, frames: 4 })).toBe(0);
    expect(effectFrame({ age: 0.999, life: 1, frames: 4 })).toBe(3);
    expect(effectFrame({ age: 5, life: 1, frames: 4 })).toBe(3);
  });

  it("clear frees everything; drawing works with and without the image", () => {
    const pool = createEffectPool(4);
    const calls: string[] = [];
    const g = new Proxy({} as Record<string, unknown>, {
      get: (_t, prop: string) => (...args: unknown[]) => void calls.push(`${prop}:${args.length}`),
      set: () => true,
    }) as unknown as CanvasRenderingContext2D;
    pool.spawn({ key: "fx/fx-star", frames: 4, x: 5, y: 5, life: 1 });
    drawEffects(g, pool, () => undefined);
    expect(calls.some((c) => c.startsWith("fillRect"))).toBe(true);
    calls.length = 0;
    drawEffects(g, pool, () => ({ width: 192, height: 48 }) as never);
    expect(calls.some((c) => c.startsWith("drawImage"))).toBe(true);
    pool.clear();
    expect(pool.activeCount).toBe(0);
  });
});
