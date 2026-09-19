import { describe, expect, it } from "vitest";
import { createNewGameSave } from "../storage";
import type { WorldSave } from "../types";
import { conditionRefs, evalCondition } from "./conditions";

const base = (): WorldSave => createNewGameSave("janine95kim");
const withMission = (status: "active" | "ready" | "completed"): WorldSave => {
  const save = base();
  return { ...save, flags: { "main-open": true }, missions: { "m-doormomo-sum10": { status } } };
};

describe("evalCondition", () => {
  it("is true without an expression", () => {
    expect(evalCondition(undefined, base())).toBe(true);
    expect(evalCondition("", base())).toBe(true);
  });

  it("reads flags, with not: negation", () => {
    const save = { ...base(), flags: { "ending-seen": true as const } };
    expect(evalCondition("flag:ending-seen", save)).toBe(true);
    expect(evalCondition("not:flag:ending-seen", save)).toBe(false);
    expect(evalCondition("not:flag:ending-seen", base())).toBe(true);
    expect(evalCondition("flag:ending-seen", base())).toBe(false);
  });

  it("reads mission status", () => {
    expect(evalCondition("mission-completed:m-doormomo-sum10", withMission("completed"))).toBe(true);
    expect(evalCondition("mission-completed:m-doormomo-sum10", withMission("ready"))).toBe(false);
    expect(evalCondition("mission-active:m-doormomo-sum10", withMission("active"))).toBe(true);
    expect(evalCondition("mission-ready:m-doormomo-sum10", withMission("ready"))).toBe(true);
    expect(evalCondition("mission-available:m-doormomo-sum10", { ...base(), flags: { "main-open": true } })).toBe(true);
  });

  it("treats a mission that is excluded for the player as never completed", () => {
    const save: WorldSave = { ...base(), flags: { "main-open": true }, missions: { "m-janine95kim-cardmatch": { status: "completed" } } };
    expect(evalCondition("mission-completed:m-janine95kim-cardmatch", save)).toBe(false);
  });

  it("joins atoms with & and compares shards", () => {
    const save = { ...withMission("active"), shards: 3 };
    expect(evalCondition("mission-active:m-doormomo-sum10&shards>=3", save)).toBe(true);
    expect(evalCondition("mission-active:m-doormomo-sum10&shards>=4", save)).toBe(false);
    expect(evalCondition("mission-active:m-doormomo-sum10 & not:flag:x", save)).toBe(true);
  });

  it("is false for anything it does not understand", () => {
    expect(evalCondition("bogus:thing", base())).toBe(false);
    expect(evalCondition("flag", base())).toBe(false);
  });
});

describe("conditionRefs", () => {
  it("lists the atom heads and ids so the map test can validate them", () => {
    expect(conditionRefs("not:flag:ending-seen&mission-active:m-x&shards>=2")).toEqual({ heads: ["flag", "mission-active", "shards"], ids: ["ending-seen", "m-x"] });
  });
});
