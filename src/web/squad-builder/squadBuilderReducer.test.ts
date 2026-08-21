import { describe, expect, it } from "vitest";
import { squadBuilderReducer } from "./squadBuilderReducer.js";
import type { Squad, SquadBuilderState } from "./types.js";

function squad(overrides: Partial<Squad> = {}): Squad {
  return {
    id: "squad-1",
    name: "기본",
    formationId: "4-3-3",
    placements: [],
    candidateOrder: ["a", "b", "c"],
    ...overrides,
  };
}

function state(overrides: Partial<SquadBuilderState> = {}): SquadBuilderState {
  return {
    schemaVersion: 1,
    squads: [squad()],
    activeSquadId: "squad-1",
    ...overrides,
  };
}

describe("squadBuilderReducer", () => {
  it("ADD_SQUAD appends a new squad and makes it active", () => {
    const next = squadBuilderReducer(state(), { type: "ADD_SQUAD", name: "2군" });
    expect(next.squads).toHaveLength(2);
    expect(next.activeSquadId).toBe(next.squads[1].id);
    expect(next.squads[1].name).toBe("2군");
    expect(next.squads[1].placements).toEqual([]);
  });

  it("ADD_SQUAD seeds candidateOrder with the ids it's given (live roster)", () => {
    const next = squadBuilderReducer(state(), {
      type: "ADD_SQUAD",
      name: "2군",
      candidateOrder: ["x", "y", "z"],
    });
    expect(next.squads[1].candidateOrder).toEqual(["x", "y", "z"]);
  });

  it("RENAME_SQUAD updates the name and ignores blank input", () => {
    const renamed = squadBuilderReducer(state(), {
      type: "RENAME_SQUAD",
      squadId: "squad-1",
      name: "주전",
    });
    expect(renamed.squads[0].name).toBe("주전");

    const ignored = squadBuilderReducer(renamed, {
      type: "RENAME_SQUAD",
      squadId: "squad-1",
      name: "   ",
    });
    expect(ignored.squads[0].name).toBe("주전");
  });

  it("DELETE_SQUAD refuses to delete the last remaining squad", () => {
    const next = squadBuilderReducer(state(), {
      type: "DELETE_SQUAD",
      squadId: "squad-1",
    });
    expect(next.squads).toHaveLength(1);
  });

  it("DELETE_SQUAD removes a squad and re-selects another if it was active", () => {
    const withTwo = squadBuilderReducer(state(), { type: "ADD_SQUAD" });
    const secondId = withTwo.squads[1].id;
    const next = squadBuilderReducer(withTwo, {
      type: "DELETE_SQUAD",
      squadId: secondId,
    });
    expect(next.squads).toHaveLength(1);
    expect(next.activeSquadId).toBe("squad-1");
  });

  it("SET_FORMATION remaps placements via nearest-neighbor and updates formationId", () => {
    const withGk = state({
      squads: [
        squad({ placements: [{ slotId: "gk", streamerId: "keeper" }], candidateOrder: [] }),
      ],
    });
    const next = squadBuilderReducer(withGk, {
      type: "SET_FORMATION",
      squadId: "squad-1",
      formationId: "4-4-2",
    });
    expect(next.squads[0].formationId).toBe("4-4-2");
    expect(next.squads[0].placements).toEqual([{ slotId: "gk", streamerId: "keeper" }]);
  });

  it("PLACE_CANDIDATE fills an empty slot and removes the streamer from candidates", () => {
    const next = squadBuilderReducer(state(), {
      type: "PLACE_CANDIDATE",
      squadId: "squad-1",
      streamerId: "a",
      slotId: "gk",
    });
    expect(next.squads[0].placements).toEqual([{ slotId: "gk", streamerId: "a" }]);
    expect(next.squads[0].candidateOrder).toEqual(["b", "c"]);
  });

  it("PLACE_CANDIDATE onto an occupied slot swaps: occupant returns to candidates", () => {
    const withPlacement = state({
      squads: [
        squad({
          placements: [{ slotId: "gk", streamerId: "a" }],
          candidateOrder: ["b", "c"],
        }),
      ],
    });
    const next = squadBuilderReducer(withPlacement, {
      type: "PLACE_CANDIDATE",
      squadId: "squad-1",
      streamerId: "b",
      slotId: "gk",
    });
    expect(next.squads[0].placements).toEqual([{ slotId: "gk", streamerId: "b" }]);
    expect(next.squads[0].candidateOrder).toEqual(["c", "a"]);
  });

  it("MOVE_PLACED moves a placed player to an empty slot", () => {
    const withPlacement = state({
      squads: [squad({ placements: [{ slotId: "gk", streamerId: "a" }] })],
    });
    const next = squadBuilderReducer(withPlacement, {
      type: "MOVE_PLACED",
      squadId: "squad-1",
      fromSlotId: "gk",
      toSlotId: "lb",
    });
    expect(next.squads[0].placements).toEqual([{ slotId: "lb", streamerId: "a" }]);
  });

  it("MOVE_PLACED onto an occupied slot swaps the two slot ids", () => {
    const withTwo = state({
      squads: [
        squad({
          placements: [
            { slotId: "gk", streamerId: "a" },
            { slotId: "lb", streamerId: "b" },
          ],
        }),
      ],
    });
    const next = squadBuilderReducer(withTwo, {
      type: "MOVE_PLACED",
      squadId: "squad-1",
      fromSlotId: "gk",
      toSlotId: "lb",
    });
    expect(next.squads[0].placements).toEqual(
      expect.arrayContaining([
        { slotId: "lb", streamerId: "a" },
        { slotId: "gk", streamerId: "b" },
      ]),
    );
  });

  it("RETURN_TO_CANDIDATES removes a placement and appends to candidateOrder", () => {
    const withPlacement = state({
      squads: [
        squad({ placements: [{ slotId: "gk", streamerId: "a" }], candidateOrder: ["b"] }),
      ],
    });
    const next = squadBuilderReducer(withPlacement, {
      type: "RETURN_TO_CANDIDATES",
      squadId: "squad-1",
      streamerId: "a",
    });
    expect(next.squads[0].placements).toEqual([]);
    expect(next.squads[0].candidateOrder).toEqual(["b", "a"]);
  });

  it("SWAP_CANDIDATES exchanges two positions without touching the rest", () => {
    const next = squadBuilderReducer(state(), {
      type: "SWAP_CANDIDATES",
      squadId: "squad-1",
      idA: "a",
      idB: "c",
    });
    expect(next.squads[0].candidateOrder).toEqual(["c", "b", "a"]);
  });

  it("SORT_CANDIDATES replaces the order with the given permutation", () => {
    const next = squadBuilderReducer(state(), {
      type: "SORT_CANDIDATES",
      squadId: "squad-1",
      order: ["c", "a", "b"],
    });
    expect(next.squads[0].candidateOrder).toEqual(["c", "a", "b"]);
  });

  it("SORT_CANDIDATES ignores stale ids and appends anything it omitted", () => {
    const next = squadBuilderReducer(state(), {
      type: "SORT_CANDIDATES",
      squadId: "squad-1",
      order: ["c", "no-longer-here"],
    });
    expect(next.squads[0].candidateOrder).toEqual(["c", "a", "b"]);
  });

  it("MOVE_CANDIDATE shifts the rest of the list instead of swapping", () => {
    const next = squadBuilderReducer(state(), {
      type: "MOVE_CANDIDATE",
      squadId: "squad-1",
      streamerId: "c",
      toIndex: 0,
    });
    expect(next.squads[0].candidateOrder).toEqual(["c", "a", "b"]);
  });

  it("RECONCILE_ROSTER drops stale ids and appends new ones", () => {
    const next = squadBuilderReducer(state(), {
      type: "RECONCILE_ROSTER",
      liveStreamerIds: ["a", "d"],
    });
    expect(next.squads[0].candidateOrder).toEqual(["a", "d"]);
  });

  it("RECONCILE_ROSTER returns the same state reference when nothing changed", () => {
    const initial = state();
    const next = squadBuilderReducer(initial, {
      type: "RECONCILE_ROSTER",
      liveStreamerIds: ["a", "b", "c"],
    });
    expect(next).toBe(initial);
  });
});
