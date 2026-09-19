import { describe, expect, it } from "vitest";
import { COACH_DONE, COACH_MOVE_TILES, nextCoachStep } from "./coach";

describe("nextCoachStep", () => {
  it("C1 waits for 3 tiles of walking", () => {
    expect(nextCoachStep(0, { type: "walked", tiles: COACH_MOVE_TILES - 1 })).toBe(0);
    expect(nextCoachStep(0, { type: "walked", tiles: COACH_MOVE_TILES })).toBe(1);
  });

  it("C2 waits for a finished conversation with the elder only", () => {
    expect(nextCoachStep(1, { type: "talked", cast: "kid" })).toBe(1);
    expect(nextCoachStep(1, { type: "talked", cast: "elder" })).toBe(2);
  });

  it("C3 waits for the J key", () => {
    expect(nextCoachStep(2, { type: "log" })).toBe(COACH_DONE);
  });

  it("ignores events meant for another step and stays done", () => {
    expect(nextCoachStep(0, { type: "log" })).toBe(0);
    expect(nextCoachStep(1, { type: "walked", tiles: 99 })).toBe(1);
    expect(nextCoachStep(COACH_DONE, { type: "log" })).toBe(COACH_DONE);
  });
});
