import { describe, expect, it, vi } from "vitest";
import { SANDBOX_SCENE } from "../data/sandboxMap";
import { moveAndSlide, rectsOverlap, footBox } from "./collision";
import { SceneTransition, buildScene, propCollider } from "./scene";

describe("propCollider / buildScene", () => {
  it("centres the footprint on the prop's feet", () => {
    expect(propCollider({ key: "k", x: 100, y: 200, w: 96, h: 128, collider: { w: 16, h: 12 } })).toEqual({ x: 92, y: 188, w: 16, h: 12 });
    expect(propCollider({ key: "k", x: 100, y: 200, w: 96, h: 128 })).toBeNull();
  });

  it("indexes prop colliders and extra rects together", () => {
    const scene = buildScene(
      {
        id: "overworld",
        size: { w: 200, h: 200 },
        walkable: { x: 0, y: 0, w: 200, h: 200 },
        props: [
          { key: "a", x: 50, y: 50, w: 10, h: 10, collider: { w: 10, h: 10 } },
          { key: "b", x: 150, y: 150, w: 10, h: 10 },
        ],
        spawn: { x: 10, y: 10 },
        fixedCamera: false,
      },
      [{ x: 0, y: 190, w: 200, h: 10 }],
    );
    expect(scene.colliderRects).toHaveLength(2);
    expect(scene.colliders.query({ x: 0, y: 0, w: 200, h: 200 })).toHaveLength(2);
  });
});

describe("SANDBOX_SCENE", () => {
  it("spawns the player on open ground, inside the walkable area", () => {
    const box = footBox(SANDBOX_SCENE.spawn.x, SANDBOX_SCENE.spawn.y);
    expect(SANDBOX_SCENE.colliderRects.some((rect) => rectsOverlap(box, rect))).toBe(false);
    const w = SANDBOX_SCENE.walkable;
    expect(box.x).toBeGreaterThanOrEqual(w.x);
    expect(box.x + box.w).toBeLessThanOrEqual(w.x + w.w);
    expect(box.y).toBeGreaterThanOrEqual(w.y);
    expect(box.y + box.h).toBeLessThanOrEqual(w.y + w.h);
  });

  it("blocks a walk into the fence and keeps the player inside the map", () => {
    let box = footBox(SANDBOX_SCENE.spawn.x, SANDBOX_SCENE.spawn.y);
    // Walk hard in every direction for a long time: the player must never end up overlapping an obstacle or leaving the map.
    for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
      for (let i = 0; i < 1500; i++) {
        const next = moveAndSlide(box, dx * 2.5, dy * 2.5, SANDBOX_SCENE.colliders, SANDBOX_SCENE.walkable);
        box = { ...box, x: next.x, y: next.y };
        expect(SANDBOX_SCENE.colliderRects.some((rect) => rectsOverlap(box, rect))).toBe(false);
      }
      expect(box.x).toBeGreaterThanOrEqual(SANDBOX_SCENE.walkable.x);
      expect(box.x + box.w).toBeLessThanOrEqual(SANDBOX_SCENE.walkable.x + SANDBOX_SCENE.walkable.w);
      expect(box.y).toBeGreaterThanOrEqual(SANDBOX_SCENE.walkable.y);
      expect(box.y + box.h).toBeLessThanOrEqual(SANDBOX_SCENE.walkable.y + SANDBOX_SCENE.walkable.h);
    }
  });
});

describe("SceneTransition", () => {
  it("fades out, swaps at full black, then fades in", () => {
    const swap = vi.fn();
    const t = new SceneTransition(0.25);
    expect(t.active).toBe(false);
    expect(t.start(swap)).toBe(true);
    expect(t.active).toBe(true);
    t.update(0.125);
    expect(t.alpha).toBeCloseTo(0.5);
    expect(swap).not.toHaveBeenCalled();
    t.update(0.125);
    expect(swap).toHaveBeenCalledTimes(1);
    expect(t.alpha).toBeCloseTo(1);
    t.update(0.125);
    expect(t.alpha).toBeCloseTo(0.5);
    t.update(0.125);
    expect(t.active).toBe(false);
    expect(t.alpha).toBe(0);
    expect(swap).toHaveBeenCalledTimes(1);
  });

  it("ignores a second start while one is running", () => {
    const first = vi.fn();
    const second = vi.fn();
    const t = new SceneTransition(0.25);
    t.start(first);
    expect(t.start(second)).toBe(false);
    t.update(0.3);
    expect(first).toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
  });
});
