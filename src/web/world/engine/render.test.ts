import { describe, expect, it } from "vitest";
import type { Facing } from "../types";
import { characterFrameCell, type CharacterView } from "./render";

const view = (facing: Facing, step: number, extra: Partial<CharacterView> = {}): CharacterView => ({
  x: 0,
  y: 0,
  facing,
  moving: true,
  // 8 fps: each step is 0.125 s; aim at the middle of the step to stay clear of float edges
  animTime: (step + 0.5) / 8,
  ...extra,
});

describe("characterFrameCell", () => {
  it("shows the idle cell of the facing while standing", () => {
    expect(characterFrameCell("member", view("down", 0, { moving: false }))).toEqual({ col: 0, row: 0 });
    expect(characterFrameCell("member", view("left", 0, { moving: false }))).toEqual({ col: 1, row: 0 });
    expect(characterFrameCell("member", view("up", 0, { moving: false }))).toEqual({ col: 2, row: 0 });
  });

  it("walks a member sideways as stride, standing profile, stride, standing profile", () => {
    for (const facing of ["right", "left"] as const) {
      const cells = [0, 1, 2, 3].map((step) => characterFrameCell("member", view(facing, step)));
      expect(cells).toEqual([
        { col: 0, row: 2 },
        { col: 1, row: 0 },
        { col: 2, row: 2 },
        { col: 1, row: 0 },
      ]);
    }
  });

  it("keeps the four authored walk frames for front and back views", () => {
    expect([0, 1, 2, 3].map((step) => characterFrameCell("member", view("down", step)))).toEqual([0, 1, 2, 3].map((col) => ({ col, row: 1 })));
    expect([0, 1, 2, 3].map((step) => characterFrameCell("member", view("up", step)))).toEqual([0, 1, 2, 3].map((col) => ({ col, row: 3 })));
  });

  it("keeps the four authored side frames for non-member characters", () => {
    for (const role of ["host", "original"] as const) {
      expect([0, 1, 2, 3].map((step) => characterFrameCell(role, view("right", step)))).toEqual([0, 1, 2, 3].map((col) => ({ col, row: 2 })));
    }
    expect([0, 1, 2, 3].map((step) => characterFrameCell("animal", view("right", step), true))).toEqual([0, 1, 2, 3].map((col) => ({ col, row: 2 })));
  });

  it("runs faster than it walks", () => {
    const running = characterFrameCell("member", { ...view("right", 0), animTime: 0.5 / 12 + 1 / 12, running: true });
    expect(running).toEqual({ col: 1, row: 0 });
  });
});
