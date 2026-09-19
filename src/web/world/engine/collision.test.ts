import { describe, expect, it } from "vitest";
import type { Rect } from "../types";
import { SpatialHash, composeObstacles, footBox, moveAndSlide, rectsOverlap } from "./collision";

const box = (x: number, y: number, w = 20, h = 10): Rect => ({ x, y, w, h });

describe("rectsOverlap", () => {
  it("is strict: rects that only touch do not overlap", () => {
    expect(rectsOverlap(box(0, 0), box(20, 0))).toBe(false);
    expect(rectsOverlap(box(0, 0), box(0, 10))).toBe(false);
    expect(rectsOverlap(box(0, 0), box(19, 9))).toBe(true);
  });
});

describe("footBox", () => {
  it("is centred on the feet and ends at them", () => {
    expect(footBox(100, 200)).toEqual({ x: 90, y: 190, w: 20, h: 10 });
    expect(footBox(100, 200, 16, 12)).toEqual({ x: 92, y: 188, w: 16, h: 12 });
  });
});

describe("SpatialHash", () => {
  it("returns nearby rects once, even when they span several cells", () => {
    const hash = new SpatialHash(64);
    const wide = box(10, 10, 200, 20);
    hash.insert(wide);
    hash.insert(box(500, 500, 10, 10));
    expect(hash.query(box(0, 0, 300, 100))).toEqual([wide]);
    expect(hash.query(box(400, 400, 20, 20))).toEqual([]);
    expect(hash.size).toBe(2);
  });

  it("puts a rect ending exactly on a cell border in the earlier cell only", () => {
    const hash = new SpatialHash(64);
    hash.insert(box(0, 0, 64, 10));
    expect(hash.query(box(64, 0, 10, 10))).toEqual([]);
    expect(hash.query(box(63, 0, 10, 10))).toHaveLength(1);
  });

  it("handles negative coordinates and clear()", () => {
    const hash = new SpatialHash(32);
    const r = box(-50, -50, 20, 20);
    hash.insert(r);
    expect(hash.query(box(-60, -60, 40, 40))).toEqual([r]);
    hash.clear();
    expect(hash.query(box(-60, -60, 40, 40))).toEqual([]);
  });
});

describe("moveAndSlide", () => {
  const wall = box(100, 100, 50, 50);

  it("moves freely when nothing is in the way", () => {
    expect(moveAndSlide(box(0, 0), 10, 5, [wall])).toEqual({ x: 10, y: 5, hitX: false, hitY: false });
  });

  it("stops flush against an obstacle instead of overlapping it", () => {
    const result = moveAndSlide(box(70, 105), 30, 0, [wall]);
    expect(result).toMatchObject({ x: 80, y: 105, hitX: true, hitY: false });
    expect(rectsOverlap(box(result.x, result.y), wall)).toBe(false);
    expect(moveAndSlide(box(160, 105), -30, 0, [wall])).toMatchObject({ x: 150, hitX: true });
    expect(moveAndSlide(box(110, 60), 0, 60, [wall])).toMatchObject({ y: 90, hitY: true });
    expect(moveAndSlide(box(110, 160), 0, -60, [wall])).toMatchObject({ y: 150, hitY: true });
  });

  it("slides along a wall: the blocked axis stops, the free axis keeps going", () => {
    const result = moveAndSlide(box(70, 105), 30, 8, [wall]);
    expect(result).toMatchObject({ x: 80, y: 113, hitX: true, hitY: false });
  });

  it("does not catch on a corner when passing beside it", () => {
    // Box is above the wall's top edge; moving right then down clips the corner region only in y.
    const right = moveAndSlide(box(70, 80), 20, 0, [wall]);
    expect(right).toMatchObject({ x: 90, hitX: false });
    const down = moveAndSlide(box(right.x, right.y), 0, 15, [wall]);
    expect(down).toMatchObject({ y: 90, hitY: true });
    // Touching a wall edge-on and moving along it is never blocked.
    expect(moveAndSlide(box(80, 95), 0, 30, [wall])).toMatchObject({ y: 125, hitY: false });
  });

  it("does not pull a box that starts embedded in an obstacle backwards", () => {
    const embedded = box(110, 110);
    expect(moveAndSlide(embedded, -5, 0, [wall])).toMatchObject({ x: 105, hitX: false });
    expect(moveAndSlide(embedded, 0, 5, [wall])).toMatchObject({ y: 115, hitY: false });
  });

  it("stops at the nearest of several obstacles regardless of order", () => {
    const near = box(60, 0, 10, 100);
    const far = box(120, 0, 10, 100);
    expect(moveAndSlide(box(0, 10), 200, 0, [far, near]).x).toBe(40);
    expect(moveAndSlide(box(0, 10), 200, 0, [near, far]).x).toBe(40);
  });

  it("clamps to the bounds and reports the hit", () => {
    const bounds = box(0, 0, 200, 100);
    expect(moveAndSlide(box(170, 50), 50, 0, [], bounds)).toMatchObject({ x: 180, hitX: true });
    expect(moveAndSlide(box(5, 5), -20, -20, [], bounds)).toMatchObject({ x: 0, y: 0, hitX: true, hitY: true });
    expect(moveAndSlide(box(100, 85), 0, 40, [], bounds)).toMatchObject({ y: 90, hitY: true });
  });

  it("gives the same result with a SpatialHash as with a plain list", () => {
    let seed = 12345;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const obstacles: Rect[] = Array.from({ length: 60 }, () => box(rand() * 900, rand() * 900, 8 + rand() * 60, 8 + rand() * 60));
    const hash = new SpatialHash(64);
    obstacles.forEach((o) => hash.insert(o));
    for (let i = 0; i < 300; i++) {
      const b = box(rand() * 900, rand() * 900);
      const dx = (rand() - 0.5) * 12;
      const dy = (rand() - 0.5) * 12;
      expect(moveAndSlide(b, dx, dy, hash)).toEqual(moveAndSlide(b, dx, dy, obstacles));
    }
  });

  it("never ends inside an obstacle it started outside of, over a long random walk", () => {
    const obstacles = [box(100, 100, 40, 40), box(180, 90, 30, 60), box(60, 200, 120, 24)];
    const hash = new SpatialHash(64);
    obstacles.forEach((o) => hash.insert(o));
    let seed = 7;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    let current = box(10, 10);
    for (let i = 0; i < 2000; i++) {
      const dx = (rand() - 0.5) * 6;
      const dy = (rand() - 0.5) * 6;
      const next = moveAndSlide(current, dx, dy, hash, box(0, 0, 400, 400));
      current = box(next.x, next.y);
      expect(obstacles.some((o) => rectsOverlap(current, o))).toBe(false);
    }
  });
});

describe("composeObstacles", () => {
  it("adds loose rects near the query to the hash results and leaves far ones out", () => {
    const hash = new SpatialHash(64);
    hash.insert({ x: 0, y: 0, w: 10, h: 10 });
    const source = composeObstacles(hash, [{ x: 100, y: 100, w: 10, h: 10 }, { x: 500, y: 500, w: 10, h: 10 }]);
    expect(source.query({ x: 90, y: 90, w: 30, h: 30 })).toHaveLength(1);
    expect(source.query({ x: 0, y: 0, w: 200, h: 200 })).toHaveLength(2);
  });

  it("stops a move against an NPC-style extra obstacle", () => {
    const source = composeObstacles(new SpatialHash(64), [{ x: 60, y: 0, w: 10, h: 10 }]);
    const result = moveAndSlide(box(20, 0), 100, 0, source);
    expect(result.x).toBe(40);
    expect(result.hitX).toBe(true);
  });
});
