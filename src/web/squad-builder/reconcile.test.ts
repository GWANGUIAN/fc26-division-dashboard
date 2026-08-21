import { describe, expect, it } from "vitest";
import { reconcileAllSquads, reconcileRosterChange } from "./reconcile.js";
import type { Squad } from "./types.js";

function squad(overrides: Partial<Squad> = {}): Squad {
  return {
    id: "squad-1",
    name: "기본",
    formationId: "4-3-3",
    placements: [],
    candidateOrder: [],
    ...overrides,
  };
}

describe("reconcileRosterChange", () => {
  it("drops placements and candidates for streamers no longer in the live roster", () => {
    const before = squad({
      placements: [{ slotId: "gk", streamerId: "gone" }],
      candidateOrder: ["gone-too", "still-here"],
    });
    const after = reconcileRosterChange(before, new Set(["still-here"]));
    expect(after.placements).toEqual([]);
    expect(after.candidateOrder).toEqual(["still-here"]);
  });

  it("appends streamers the squad has never seen to the end of candidateOrder", () => {
    const before = squad({ candidateOrder: ["a", "b"] });
    const after = reconcileRosterChange(before, new Set(["a", "b", "c"]));
    expect(after.candidateOrder).toEqual(["a", "b", "c"]);
  });

  it("does not duplicate a streamer that is already placed", () => {
    const before = squad({
      placements: [{ slotId: "gk", streamerId: "a" }],
      candidateOrder: ["b"],
    });
    const after = reconcileRosterChange(before, new Set(["a", "b"]));
    expect(after.placements).toEqual([{ slotId: "gk", streamerId: "a" }]);
    expect(after.candidateOrder).toEqual(["b"]);
  });

  it("returns the same object reference when nothing changed", () => {
    const before = squad({ candidateOrder: ["a", "b"] });
    const after = reconcileRosterChange(before, new Set(["a", "b"]));
    expect(after).toBe(before);
  });
});

describe("reconcileAllSquads", () => {
  it("reconciles every squad independently", () => {
    const squads = [
      squad({ id: "1", candidateOrder: ["a", "gone"] }),
      squad({ id: "2", placements: [{ slotId: "gk", streamerId: "gone" }] }),
    ];
    const result = reconcileAllSquads(squads, ["a"]);
    expect(result[0].candidateOrder).toEqual(["a"]);
    expect(result[1].placements).toEqual([]);
  });
});
