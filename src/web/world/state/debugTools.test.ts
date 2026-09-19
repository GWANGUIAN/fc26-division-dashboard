import { describe, expect, it } from "vitest";
import { createNewGameSave } from "../storage";
import { debugCompleteAll, debugResetProgress, debugSetFlag, debugSetMission, debugSetShards, debugSkipTutorial } from "./debugTools";
import { missionStatusById } from "./missions";

const fresh = () => createNewGameSave("janine95kim");

describe("debug tools", () => {
  it("clamps the shard count to 0–10", () => {
    expect(debugSetShards(fresh(), 4).shards).toBe(4);
    expect(debugSetShards(fresh(), 99).shards).toBe(10);
    expect(debugSetShards(fresh(), -3).shards).toBe(0);
  });

  it("sets and clears flags, ignoring a blank name", () => {
    const on = debugSetFlag(fresh(), "main-open", true);
    expect(on.flags["main-open"]).toBe(true);
    expect(debugSetFlag(on, "main-open", false).flags["main-open"]).toBeUndefined();
    expect(debugSetFlag(fresh(), "  ", true)).toEqual(fresh());
  });

  it("puts a mission in any state; completed pays out once", () => {
    let save = debugSkipTutorial(fresh());
    expect(missionStatusById(save, "m-doormomo-sum10")).toBe("available");
    save = debugSetMission(save, "m-doormomo-sum10", "active");
    expect(missionStatusById(save, "m-doormomo-sum10")).toBe("active");
    save = debugSetMission(save, "m-doormomo-sum10", "ready");
    expect(missionStatusById(save, "m-doormomo-sum10")).toBe("ready");
    save = debugSetMission(save, "m-doormomo-sum10", "completed");
    expect(missionStatusById(save, "m-doormomo-sum10")).toBe("completed");
    expect(save.shards).toBe(1);
    expect(debugSetMission(save, "m-doormomo-sum10", "completed").shards).toBe(1);
    expect(missionStatusById(debugSetMission(save, "m-doormomo-sum10", "available"), "m-doormomo-sum10")).toBe("available");
  });

  it("skips the tutorial so the main missions open", () => {
    const save = debugSkipTutorial(fresh());
    expect(save.flags["main-open"]).toBe(true);
    expect(missionStatusById(save, "m-00-hello")).toBe("completed");
    expect(missionStatusById(save, "m-01-mycard")).toBe("completed");
    expect(debugSkipTutorial(save).shards).toBe(0);
  });

  it("completes all ten main missions for the player and leaves their own out", () => {
    const save = debugCompleteAll(fresh());
    expect(save.shards).toBe(10);
    expect(missionStatusById(save, "m-janine95kim-cardmatch")).toBe("locked");
    expect(missionStatusById(save, "m-tdnlamuron-conerun")).toBe("completed");
    expect(save.flags["badge:shard-10"]).toBe(true);
  });

  it("resets the story but keeps the finished prologue", () => {
    const save = debugResetProgress({ ...debugCompleteAll(fresh()), flags: { "prologue-done": true, "main-open": true }, collected: ["water-1"], talked: { elder: 3 } });
    expect(save.shards).toBe(0);
    expect(save.missions).toEqual({});
    expect(save.collected).toEqual([]);
    expect(save.flags).toEqual({ "prologue-done": true });
  });
});
