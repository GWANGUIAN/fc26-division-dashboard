import { describe, expect, it } from "vitest";
import { clampCamera, followCamera, interiorCamera, snapCamera } from "./camera";

const view = { w: 640, h: 360 };
const map = { w: 2560, h: 1920 };

describe("clampCamera", () => {
  it("keeps the view inside the map", () => {
    expect(clampCamera(-50, -20, view, map)).toEqual({ x: 0, y: 0 });
    expect(clampCamera(5000, 5000, view, map)).toEqual({ x: 1920, y: 1560 });
    expect(clampCamera(300.5, 400.25, view, map)).toEqual({ x: 300.5, y: 400.25 });
  });

  it("centres a map smaller than the view on that axis", () => {
    // a room exactly as wide as the view but taller keeps the normal clamp (interiors use interiorCamera)
    expect(clampCamera(0, 0, view, { w: 640, h: 384 })).toEqual({ x: 0, y: 0 });
    expect(clampCamera(0, 0, view, { w: 320, h: 200 })).toEqual({ x: -160, y: -80 });
  });
});

describe("snapCamera", () => {
  it("rounds to whole pixels", () => {
    expect(snapCamera({ x: 10.4, y: 10.5 })).toEqual({ x: 10, y: 11 });
    expect(snapCamera({ x: -0.6, y: 3 })).toEqual({ x: -1, y: 3 });
  });
});

describe("followCamera", () => {
  it("jumps straight to the target when snapping, still clamped", () => {
    expect(followCamera({ x: 0, y: 0 }, { x: 1000, y: 800 }, view, map, { snap: true })).toEqual({ x: 680, y: 620 });
    expect(followCamera({ x: 900, y: 900 }, { x: 10, y: 10 }, view, map, { snap: true })).toEqual({ x: 0, y: 0 });
  });

  it("closes 15% of the gap per 60fps frame", () => {
    const next = followCamera({ x: 0, y: 0 }, { x: 1120, y: 480 }, view, map);
    expect(next.x).toBeCloseTo(800 * 0.15);
    expect(next.y).toBeCloseTo(300 * 0.15);
  });

  it("is frame-rate independent: two 30fps steps ~ four 120fps steps ~ two 60fps steps", () => {
    const target = { x: 1500, y: 900 };
    const run = (dt: number, seconds: number) => {
      let camera = { x: 0, y: 0 };
      for (let t = 0; t < seconds - 1e-9; t += dt) camera = followCamera(camera, target, view, map, { dt });
      return camera;
    };
    const a = run(1 / 30, 1 / 15);
    const b = run(1 / 60, 1 / 15);
    const c = run(1 / 120, 1 / 15);
    expect(a.x).toBeCloseTo(b.x, 5);
    expect(b.x).toBeCloseTo(c.x, 5);
  });

  it("converges on a fixed target and never leaves the map", () => {
    let camera = { x: 0, y: 0 };
    for (let i = 0; i < 200; i++) camera = followCamera(camera, { x: 1300, y: 900 }, view, map);
    expect(camera.x).toBeCloseTo(980, 1);
    expect(camera.y).toBeCloseTo(720, 1);
    for (let i = 0; i < 200; i++) camera = followCamera(camera, { x: 5, y: 5 }, view, map);
    expect(camera).toEqual({ x: expect.closeTo(0, 3), y: expect.closeTo(0, 3) });
  });
});

describe("interiorCamera", () => {
  it("trims 12px from the top and bottom of a 640×384 room", () => {
    expect(interiorCamera(view, { w: 640, h: 384 })).toEqual({ x: 0, y: 12 });
  });
});
