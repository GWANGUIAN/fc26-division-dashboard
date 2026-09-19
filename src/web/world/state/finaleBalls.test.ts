import { describe, expect, it } from "vitest";
import { availableGoldenBalls, heldGoldenBalls, spentGoldenBalls } from "./finaleBalls";

describe("golden balls held", () => {
  it("lists only golden balls, minus the ones a round has used", () => {
    expect(availableGoldenBalls(["gb-01", "jelly-lantern-a", "gb-03", "gb-02"])).toEqual(["gb-01", "gb-02", "gb-03"]);
    expect(availableGoldenBalls(["gb-01", "gb-02", "gb-03"], ["gb-02"])).toEqual(["gb-01", "gb-03"]);
  });

  it("reads the spent balls from any mission progress and ignores malformed data", () => {
    const missions = {
      "m-90-finale": { status: "active" as const, progress: { round: 1, balls: ["gb-01", "gb-02"] } },
      "m-other": { status: "active" as const, progress: { balls: "gb-09" } },
      "m-none": { status: "active" as const },
    };
    expect(spentGoldenBalls(missions)).toEqual(["gb-01", "gb-02"]);
    expect(heldGoldenBalls({ collected: ["gb-01", "gb-02", "gb-03"], missions })).toBe(1);
  });
});
