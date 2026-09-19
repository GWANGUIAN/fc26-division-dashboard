import { describe, expect, it } from "vitest";
import { MISSION_DEFS, missionDefsFor, totalShardsFor } from "../data/missionDefs";
import { createNewGameSave } from "../storage";
import type { CastId, WorldSave } from "../types";
import {
  acceptMission, applyMissionEvent, completeMission, completeTalk, defaultTracked, mainMissionCounts, markerFor, missionStatusById, missionViews, restartMission,
} from "./missions";

const fresh = (player: CastId = "janine95kim"): WorldSave => createNewGameSave(player);
const status = (save: WorldSave, id: string) => missionStatusById(save, id);

/** Plays the tutorial through so the main missions open. */
function withMainOpen(player: CastId = "janine95kim"): WorldSave {
  let save = fresh(player);
  save = completeTalk(save, "m-00-hello").save;
  save = acceptMission(save, "m-01-mycard");
  save = applyMissionEvent(save, { type: "card-view", cardId: player, variant: "normal" }).save;
  return completeMission(save, "m-01-mycard").save;
}

describe("mission state machine", () => {
  it("starts with only the elder's greeting available", () => {
    const save = fresh();
    expect(status(save, "m-00-hello")).toBe("available");
    expect(status(save, "m-01-mycard")).toBe("locked");
    expect(status(save, "m-02-arcade")).toBe("locked");
    expect(status(save, "m-doormomo-sum10")).toBe("locked");
  });

  it("walks locked → available → active → ready → completed", () => {
    let save = fresh();
    save = completeTalk(save, "m-00-hello").save;
    expect(status(save, "m-01-mycard")).toBe("available");
    save = acceptMission(save, "m-01-mycard", 1234);
    expect(status(save, "m-01-mycard")).toBe("active");
    expect(save.missions["m-01-mycard"].startedAt).toBe(1234);
    save = applyMissionEvent(save, { type: "card-view", cardId: "janine95kim", variant: "normal" }).save;
    expect(status(save, "m-01-mycard")).toBe("ready");
    const done = completeMission(save, "m-01-mycard");
    expect(status(done.save, "m-01-mycard")).toBe("completed");
    expect(done.save.flags["main-open"]).toBe(true);
  });

  it("opens the main missions only after m-01 completed", () => {
    let save = fresh();
    save = completeTalk(save, "m-00-hello").save;
    expect(status(save, "m-tdnlamuron-conerun")).toBe("locked");
    save = withMainOpen();
    expect(status(save, "m-tdnlamuron-conerun")).toBe("available");
    expect(status(save, "s-shop-milk")).toBe("available");
  });

  it("does not skip states: accept needs available, complete needs ready", () => {
    const save = fresh();
    expect(acceptMission(save, "m-01-mycard")).toBe(save); // still locked
    expect(completeMission(save, "m-00-hello").reward).toBeNull(); // available, not ready
    const active = acceptMission(withMainOpen(), "m-doormomo-sum10");
    expect(completeMission(active, "m-doormomo-sum10").reward).toBeNull(); // active, not ready
    expect(acceptMission(active, "m-doormomo-sum10")).toBe(active); // cannot accept twice
  });

  it("ignores events for missions that are not active", () => {
    const save = withMainOpen(); // m-doormomo-sum10 is only available
    const result = applyMissionEvent(save, { type: "minigame", result: { game: "soccer-sum10", score: 100 } });
    expect(status(result.save, "m-doormomo-sum10")).toBe("available");
    expect(result.changes).toEqual([]);
  });

  it("grants the reward once: a second completion changes nothing", () => {
    let save = acceptMission(withMainOpen(), "m-doormomo-sum10");
    save = applyMissionEvent(save, { type: "minigame", result: { game: "soccer-sum10", score: 80 } }).save;
    const first = completeMission(save, "m-doormomo-sum10");
    expect(first.save.shards).toBe(1);
    expect(first.reward?.shard).toBe(true);
    const second = completeMission(first.save, "m-doormomo-sum10");
    expect(second.reward).toBeNull();
    expect(second.save.shards).toBe(1);
  });

  it("gives no shard for tutorial or side missions but a badge", () => {
    let save = completeTalk(fresh(), "m-00-hello").save;
    save = acceptMission(save, "m-02-arcade");
    save = applyMissionEvent(save, { type: "minigame", result: { game: "kickups", score: 0 } }).save;
    const done = completeMission(save, "m-02-arcade");
    expect(done.save.shards).toBe(0);
    expect(done.reward?.badges.map((b) => b.id)).toEqual(["first-game"]);
    expect(done.save.flags["badge:first-game"]).toBe(true);
  });

  it("reports a change when a mission becomes ready", () => {
    const save = acceptMission(withMainOpen(), "m-sjh4018-kickups");
    const short = applyMissionEvent(save, { type: "minigame", result: { game: "kickups", score: 12 } });
    expect(short.changes).toEqual([]);
    expect(status(short.save, "m-sjh4018-kickups")).toBe("active");
    const long = applyMissionEvent(short.save, { type: "minigame", result: { game: "kickups", score: 21 } });
    expect(long.changes).toEqual([{ id: "m-sjh4018-kickups", from: "active", to: "ready" }]);
  });

  it("does not mutate the save it is given", () => {
    const save = withMainOpen();
    const frozen = JSON.stringify(save);
    acceptMission(save, "m-doormomo-sum10");
    applyMissionEvent(save, { type: "pickup", id: "jelly-lantern-a" });
    expect(JSON.stringify(save)).toBe(frozen);
  });
});

describe("the player's own mission is excluded", () => {
  it("is locked for its giver and never counts", () => {
    const save = withMainOpen("janine95kim");
    expect(status(save, "m-janine95kim-cardmatch")).toBe("locked");
    expect(acceptMission(save, "m-janine95kim-cardmatch")).toBe(save);
    expect(missionViews(save).some((view) => view.def.id === "m-janine95kim-cardmatch")).toBe(false);
    expect(markerFor(save, "janine95kim")).toBeNull();
  });

  it("leaves ten shards for every member, from any of the eleven", () => {
    for (const cast of new Set(MISSION_DEFS.filter((def) => def.main).map((def) => def.giver))) {
      expect(totalShardsFor(cast)).toBe(10);
      expect(missionDefsFor(cast).filter((def) => def.main)).toHaveLength(10);
    }
    expect(MISSION_DEFS.filter((def) => def.main)).toHaveLength(11);
  });

  it("caps the shards at ten", () => {
    let save: WorldSave = { ...withMainOpen(), shards: 10 };
    save = acceptMission(save, "m-doormomo-sum10");
    save = applyMissionEvent(save, { type: "minigame", result: { game: "soccer-sum10", score: 99 } }).save;
    const done = completeMission(save, "m-doormomo-sum10");
    expect(done.save.shards).toBe(10);
    expect(done.reward?.shard).toBe(false);
  });

  it("can be finished start to end for every member (ten mains → ten shards, milestone badges)", () => {
    for (const player of ["janine95kim", "ju010228", "tdnlamuron"] as CastId[]) {
      let save = withMainOpen(player);
      for (const def of missionDefsFor(player).filter((entry) => entry.main)) {
        save = { ...save, missions: { ...save.missions, [def.id]: { status: "ready" } } };
        save = completeMission(save, def.id).save;
      }
      expect(save.shards).toBe(10);
      expect(mainMissionCounts(save)).toEqual({ done: 10, total: 10 });
      expect(save.flags["badge:shard-5"]).toBe(true);
      expect(save.flags["badge:shard-10"]).toBe(true);
    }
  });
});

describe("markers", () => {
  it("shows ? for a new mission, … while active and ! when it can be reported", () => {
    let save = fresh();
    expect(markerFor(save, "elder")).toBe("new");
    expect(markerFor(save, "woowakgood")).toBeNull(); // m-01 still locked
    save = completeTalk(save, "m-00-hello").save;
    expect(markerFor(save, "woowakgood")).toBe("new");
    save = acceptMission(save, "m-01-mycard");
    expect(markerFor(save, "woowakgood")).toBe("progress");
    save = applyMissionEvent(save, { type: "card-view", cardId: "janine95kim", variant: "lowq" }).save;
    expect(markerFor(save, "woowakgood")).toBe("ready");
    save = completeMission(save, "m-01-mycard").save;
    expect(markerFor(save, "woowakgood")).toBeNull();
  });

  it("puts ! before ? when one NPC has both", () => {
    // The shopkeeper gives m-02 and s-shop-milk: with the milk ready to report and m-02 still new, ! wins.
    let save = withMainOpen();
    save = acceptMission(save, "s-shop-milk");
    save = applyMissionEvent(save, { type: "talk", cast: "elder" }).save;
    expect(status(save, "s-shop-milk")).toBe("ready");
    expect(status(save, "m-02-arcade")).toBe("available");
    expect(markerFor(save, "shopkeeper")).toBe("ready");
  });
});

describe("mission views", () => {
  it("lists only met missions and defaults the tracker to ready, then active main, then new", () => {
    let save = fresh();
    expect(missionViews(save).map((view) => view.def.id)).toEqual(["m-00-hello"]);
    save = withMainOpen();
    const views = missionViews(save);
    expect(views.some((view) => view.def.id === "m-01-mycard")).toBe(true);
    expect(defaultTracked(views)?.def.main).toBe(true);

    save = acceptMission(save, "s-elder-water");
    save = acceptMission(save, "m-sjh4018-kickups");
    expect(defaultTracked(missionViews(save))?.def.id).toBe("m-sjh4018-kickups"); // active main beats active side
    for (const id of ["water-1", "water-2", "water-3", "water-4", "water-5"]) {
      save = applyMissionEvent(save, { type: "pickup", id }).save;
    }
    expect(status(save, "s-elder-water")).toBe("ready");
    expect(defaultTracked(missionViews(save))?.def.id).toBe("s-elder-water"); // ready beats an active main mission
  });
});

describe("restartMission", () => {
  it("wipes the delivered parcels of a timed round but keeps the best result", () => {
    let save = acceptMission(withMainOpen(), "m-tleod1818-delivery");
    save = applyMissionEvent(save, { type: "delivered", item: "parcel-a", to: { mailbox: "mb-west" } }).save;
    expect(save.missions["m-tleod1818-delivery"].progress).toEqual({ delivered: ["parcel-a"], carrying: [] });
    const again = restartMission(save, "m-tleod1818-delivery");
    expect(again.missions["m-tleod1818-delivery"].progress).toEqual({ delivered: [] });
    expect(missionStatusById(again, "m-tleod1818-delivery")).toBe("active");

    let trial = acceptMission(withMainOpen(), "m-tdnlamuron-conerun");
    trial = applyMissionEvent(trial, { type: "trial-finished", mission: "m-tdnlamuron-conerun", seconds: 30 }).save;
    expect(restartMission(trial, "m-tdnlamuron-conerun").missions["m-tdnlamuron-conerun"].progress).toEqual({ best: 30 });
  });

  it("does nothing for a mission that is not active", () => {
    const save = withMainOpen();
    expect(restartMission(save, "m-tleod1818-delivery")).toBe(save);
  });
});
