import { describe, expect, it, vi } from "vitest";
import { SceneTransition, footRect, indexColliders, propColliders, type PropInstance } from "./scene";

const prop = (over: Partial<PropInstance> = {}): PropInstance => ({
  id: "tree-oak", x: 100, y: 200, w: 96, h: 128, foot: [{ dx: 0, w: 16, h: 12 }], aboveFrom: 40, decal: false, withered: true, ...over,
});

describe("footRect / propColliders", () => {
  it("centres the footprint on the prop's feet and ends at the feet line", () => {
    expect(footRect({ x: 100, y: 200 }, { dx: 0, w: 16, h: 12 })).toEqual({ x: 92, y: 188, w: 16, h: 12 });
  });

  it("offsets each footprint by dx (arch pillars)", () => {
    const rects = propColliders(prop({ foot: [{ dx: -48, w: 12, h: 10 }, { dx: 48, w: 12, h: 10 }] }));
    expect(rects).toEqual([{ x: 46, y: 190, w: 12, h: 10 }, { x: 142, y: 190, w: 12, h: 10 }]);
  });

  it("gives walk-through props no collider", () => {
    expect(propColliders(prop({ foot: [] }))).toEqual([]);
  });
});

describe("indexColliders", () => {
  it("indexes prop footprints and extra rects together", () => {
    const { colliders, colliderRects } = indexColliders([prop(), prop({ x: 300, foot: [] })], [{ x: 0, y: 500, w: 200, h: 10 }]);
    expect(colliderRects).toHaveLength(2);
    expect(colliders.query({ x: 0, y: 0, w: 1000, h: 1000 })).toHaveLength(2);
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

  it("stays black while an async swap (the room image loading) is pending, then fades in", async () => {
    let finish: () => void = () => {};
    const swap = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const t = new SceneTransition(0.25);
    t.start(swap);
    t.update(0.25);
    expect(swap).toHaveBeenCalledTimes(1);
    for (let i = 0; i < 10; i++) t.update(0.25);
    expect(t.active).toBe(true);
    expect(t.alpha).toBe(1);
    finish();
    await Promise.resolve();
    await Promise.resolve();
    t.update(0.125);
    expect(t.alpha).toBeCloseTo(0.5);
    t.update(0.125);
    expect(t.active).toBe(false);
  });

  it("recovers when the swap rejects", async () => {
    const t = new SceneTransition(0.25);
    t.start(() => Promise.reject(new Error("load failed")));
    t.update(0.25);
    await Promise.resolve();
    await Promise.resolve();
    t.update(0.25);
    expect(t.active).toBe(false);
  });

  it("recovers when the swap throws", () => {
    const t = new SceneTransition(0.25);
    t.start(() => {
      throw new Error("boom");
    });
    t.update(0.25);
    t.update(0.25);
    expect(t.active).toBe(false);
  });
});
