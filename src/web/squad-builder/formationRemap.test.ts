import { describe, expect, it } from "vitest";
import { remapPlacementsToFormation } from "./formationRemap.js";
import { getFormation } from "./formations.js";

describe("remapPlacementsToFormation", () => {
  it("carries the GK over 1:1 regardless of formation shape", () => {
    const from = getFormation("4-3-3");
    const to = getFormation("3-5-2");
    const result = remapPlacementsToFormation(
      [{ slotId: "gk", streamerId: "keeper" }],
      from,
      to,
    );
    expect(result.placements).toEqual([{ slotId: "gk", streamerId: "keeper" }]);
    expect(result.returnedToCandidateIds).toEqual([]);
  });

  it("matches every outfield player to a slot in the new formation (same total slot count)", () => {
    const from = getFormation("4-3-3");
    const to = getFormation("4-4-2");
    const placements = from.slots.map((slot) => ({
      slotId: slot.id,
      streamerId: `p-${slot.id}`,
    }));
    const result = remapPlacementsToFormation(placements, from, to);
    expect(result.placements).toHaveLength(11);
    expect(result.returnedToCandidateIds).toEqual([]);
    // every new slot id is used exactly once
    const usedSlotIds = result.placements.map((p) => p.slotId).sort();
    expect(usedSlotIds).toEqual(to.slots.map((s) => s.id).sort());
  });

  it("assigns each player to their closest new slot (nearest-neighbor)", () => {
    const from = getFormation("4-3-3");
    const to = getFormation("4-3-3");
    // Same formation: everyone should map back to their own slot exactly.
    const placements = from.slots.map((slot) => ({
      slotId: slot.id,
      streamerId: `p-${slot.id}`,
    }));
    const result = remapPlacementsToFormation(placements, from, to);
    for (const placement of result.placements) {
      expect(placement.streamerId).toBe(`p-${placement.slotId}`);
    }
  });

  it("returns unmatched players to candidates when the GK slot disappears", () => {
    const from = getFormation("4-3-3");
    const to = { ...getFormation("4-3-3"), slots: getFormation("4-3-3").slots.filter((s) => s.label !== "GK") };
    const result = remapPlacementsToFormation(
      [{ slotId: "gk", streamerId: "keeper" }],
      from,
      to,
    );
    expect(result.placements).toEqual([]);
    expect(result.returnedToCandidateIds).toEqual(["keeper"]);
  });
});
