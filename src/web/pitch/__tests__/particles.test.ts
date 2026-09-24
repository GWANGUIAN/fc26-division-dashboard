import { describe, expect, it } from "vitest";
import { createParticlePool, particleProgress } from "../engine/particles";
import { stripRect } from "../engine/sprite";

describe("particle pool", () => {
  it("emits, moves and expires particles without growing", () => {
    const pool = createParticlePool(4);
    pool.emit(10, 20, 100, 0, 0.5);
    expect(pool.activeCount).toBe(1);
    pool.update(0.25);
    expect(pool.items[0]!.x).toBeCloseTo(35);
    expect(particleProgress(pool.items[0]!)).toBeCloseTo(0.5);
    pool.update(0.3);
    expect(pool.activeCount).toBe(0);
    expect(pool.items).toHaveLength(4);
  });

  it("recycles the oldest slot when full", () => {
    const pool = createParticlePool(2);
    pool.emit(1, 0, 0, 0, 10);
    pool.emit(2, 0, 0, 0, 10);
    pool.emit(3, 0, 0, 0, 10);
    expect(pool.activeCount).toBe(2);
    expect(pool.items.map((p) => p.x).sort()).toEqual([2, 3]);
  });

  it("applies drag and clears", () => {
    const pool = createParticlePool(2);
    pool.emit(0, 0, 100, 0, 5);
    pool.update(1, 2);
    expect(pool.items[0]!.vx).toBeCloseTo(100 * Math.exp(-2));
    pool.clear();
    expect(pool.activeCount).toBe(0);
  });
});

describe("stripRect", () => {
  it("splits a strip into equal frames and clamps the index", () => {
    expect(stripRect(128, 16, 8, 3)).toEqual({ sx: 48, sy: 0, sw: 16, sh: 16 });
    expect(stripRect(128, 16, 8, 99).sx).toBe(112);
    expect(stripRect(128, 16, 8, -1).sx).toBe(0);
  });
});
