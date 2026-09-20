import { describe, expect, it } from "vitest";
import { cameraPoseFor, modelTransform } from "./stadiumShowcaseMath";

describe("modelTransform", () => {
  it("centres and normalises a rectangular stadium", () => {
    expect(modelTransform({ x: 80, y: 12, z: 113 }, { x: 40, y: 6, z: 56.5 })).toEqual({
      scale: 52 / 113,
      offset: { x: -(40 * 52) / 113, y: -(6 * 52) / 113, z: -(56.5 * 52) / 113 },
    });
  });

  it("keeps degenerate model bounds safe", () => {
    expect(modelTransform({ x: 0, y: 0, z: 0 }, { x: 4, y: 5, z: 6 })).toEqual({
      scale: 1,
      offset: { x: -4, y: -5, z: -6 },
    });
  });
});

describe("cameraPoseFor", () => {
  it("returns distinct, centred views for the viewer controls", () => {
    expect(cameraPoseFor("overview")).toEqual({ position: { x: 40, y: 28, z: 45 }, target: { x: 0, y: 1.2, z: 0 } });
    expect(cameraPoseFor("top").position.y).toBeGreaterThan(cameraPoseFor("overview").position.y);
    expect(cameraPoseFor("goal").position.z).toBeGreaterThan(0);
  });
});
