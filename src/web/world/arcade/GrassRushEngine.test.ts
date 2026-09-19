import { describe, expect, it } from "vitest";
import { createRush, rushScore, stepRush } from "./GrassRushEngine";
const run = (n: number, initial = createRush()) => { let s = initial; for (let i = 0; i < n; i++) s = stepRush(s); return s; };
describe("Grass Rush", () => {
  it("is deterministic and leaves its input untouched", () => {
    const initial = createRush(7);
    expect(run(150, initial)).toEqual(run(150, createRush(7)));
    expect(initial).toEqual(createRush(7));
    expect(run(150, initial).objects.length).toBeGreaterThan(0);
  });
  it("lands after a jump and cannot double jump", () => {
    const airborne = stepRush(createRush(), "jump");
    expect(airborne.height).toBeGreaterThan(0);
    expect(stepRush(airborne, "jump").velocity).toBeLessThan(airborne.velocity);
    expect(run(70, airborne).height).toBe(0);
  });
  it("collides with a mower, freezes game over, and jumps clear", () => {
    const s = { ...createRush(), objects: [{ x: 126, kind: "mower" as const }] };
    const hit = stepRush(s);
    expect(hit.over).toBe(true);
    expect(stepRush(hit)).toBe(hit);
    expect(stepRush({ ...s, height: 70 }).over).toBe(false);
  });
  it("requires sliding under a low banner and makes slides expire", () => {
    const s = { ...createRush(), objects: [{ x: 126, kind: "banner-low" as const }] };
    expect(stepRush(s).over).toBe(true);
    expect(stepRush(s, "slide").over).toBe(false);
    expect(run(50, stepRush(createRush(), "slide")).slide).toBe(0);
  });
  it("collects a seed exactly once and adds its bonus separately from distance", () => {
    const s = stepRush({ ...createRush(), objects: [{ x: 126, kind: "seed" }] });
    expect(s.seeds).toBe(1);
    expect(stepRush(s).seeds).toBe(1);
    expect(rushScore(s)).toBe(Math.floor(s.distance) + 10);
  });
});
