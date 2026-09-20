import { describe, expect, it } from "vitest";
import { RunManager, type RunEvent } from "./runs";

const TRIAL = "m-tdnlamuron-conerun";
const KICK = "m-ju010228-kickgoals";
const DELIVERY = "m-tleod1818-delivery";

describe("delivery run", () => {
  it("hands over the parcels and starts the clock", () => {
    const runs = new RunManager();
    expect(runs.startDelivery(DELIVERY)).toEqual([{ type: "delivery-start", mission: DELIVERY, items: ["parcel-a", "parcel-b", "parcel-c"], seconds: 90 }]);
    expect(runs.carrying()).toHaveLength(3);
    expect(runs.hud()?.clock).toBe("90.0초");
  });

  it("delivers a parcel only at its own mailbox and ends after the last one", () => {
    const runs = new RunManager();
    runs.startDelivery(DELIVERY);
    runs.update(10);
    expect(runs.deliverAt("mb-nowhere")).toEqual([]);
    const first = runs.deliverAt("mb-east");
    expect(first).toEqual([{ type: "delivered", mission: DELIVERY, item: "parcel-b", mailbox: "mb-east", left: 80 }]);
    expect(runs.deliverAt("mb-east")).toEqual([]); // already handed over
    runs.deliverAt("mb-west");
    expect(runs.active).toBe(true);
    runs.deliverAt("mb-north");
    expect(runs.active).toBe(false);
    expect(runs.hud()).toBeNull();
  });

  it("times out after 90 seconds and drops the parcels", () => {
    const runs = new RunManager();
    runs.startDelivery(DELIVERY);
    expect(runs.update(89.9)).toEqual([]);
    expect(runs.update(0.2)).toEqual([{ type: "delivery-timeup", mission: DELIVERY }]);
    expect(runs.carrying()).toEqual([]);
    expect(runs.deliverAt("mb-west")).toEqual([]);
  });

  it("ignores a mission that is not a timed delivery", () => {
    const runs = new RunManager();
    expect(runs.startDelivery("s-shop-milk")).toEqual([]);
    expect(runs.startDelivery("m-doormomo-sum10")).toEqual([]);
  });

  it("survives a trip indoors while the field runs are dropped", () => {
    const runs = new RunManager();
    runs.startDelivery(DELIVERY);
    runs.beginTrial(TRIAL);
    runs.cancelFieldRuns();
    expect(runs.delivery).not.toBeNull();
    expect(runs.trial).toBeNull();
  });
});

describe("cone-course trial", () => {
  const cross = (runs: RunManager, times: number) => {
    const events: RunEvent[] = [];
    for (let i = 0; i < times; i++) events.push(...runs.passGate());
    return events;
  };

  it("passes when every gate is crossed within the limit", () => {
    const runs = new RunManager();
    expect(runs.beginTrial(TRIAL)).toEqual([{ type: "trial-start", mission: TRIAL, seconds: 25 }]);
    expect(runs.nextGate()).toEqual({ mission: TRIAL, gate: "tt-1" });
    runs.update(20);
    const events = cross(runs, 5);
    expect(events.at(-1)).toEqual({ type: "trial-finished", mission: TRIAL, seconds: 20, passed: true });
    expect(runs.active).toBe(false);
  });

  it("adds a second per cone and can fail at the line", () => {
    const runs = new RunManager();
    runs.beginTrial(TRIAL);
    runs.update(23.5);
    runs.hitHazard();
    runs.hitHazard();
    expect(runs.hud()?.detail).toContain("콘 +2초");
    const events = cross(runs, 5);
    expect(events.at(-1)).toEqual({ type: "trial-finished", mission: TRIAL, seconds: 25.5, passed: false });
  });

  it("counts checkpoints as they are crossed", () => {
    const runs = new RunManager();
    runs.beginTrial(TRIAL);
    expect(runs.passGate()).toEqual([{ type: "trial-gate", mission: TRIAL, passed: 1, total: 5 }]);
    expect(runs.nextGate()?.gate).toBe("tt-2");
  });

  it("times out once clock plus penalty pass the limit, and can be started again", () => {
    const runs = new RunManager();
    runs.beginTrial(TRIAL);
    runs.update(24);
    runs.hitHazard();
    expect(runs.update(0.5)).toEqual([{ type: "trial-timeup", mission: TRIAL }]);
    expect(runs.active).toBe(false);
    expect(runs.beginTrial(TRIAL)).toHaveLength(1);
  });

  it("ignores gates and cones when no trial is running", () => {
    const runs = new RunManager();
    expect(runs.passGate()).toEqual([]);
    expect(runs.hitHazard()).toEqual([]);
    expect(runs.nextGate()).toBeNull();
  });
});

describe("kick goals run", () => {
  it("passes on the fifth goal", () => {
    const runs = new RunManager();
    runs.beginKick(KICK);
    runs.update(30);
    for (let i = 1; i <= 4; i++) expect(runs.goalScored()).toEqual([{ type: "kick-goal", mission: KICK, goals: i, need: 5 }]);
    expect(runs.goalScored()).toEqual([
      { type: "kick-goal", mission: KICK, goals: 5, need: 5 },
      { type: "kick-finished", mission: KICK, goals: 5, passed: true },
    ]);
    expect(runs.active).toBe(false);
  });

  it("fails when the minute runs out, reporting the goals so far", () => {
    const runs = new RunManager();
    runs.beginKick(KICK);
    runs.goalScored();
    runs.goalScored();
    expect(runs.update(59)).toEqual([]);
    expect(runs.update(2)).toEqual([{ type: "kick-finished", mission: KICK, goals: 2, passed: false }]);
  });

  it("does not count goals when no run is on (free practice)", () => {
    expect(new RunManager().goalScored()).toEqual([]);
  });

  it("shows the goal count and time in the HUD", () => {
    const runs = new RunManager();
    runs.beginKick(KICK);
    runs.goalScored();
    runs.update(52);
    expect(runs.hud()).toEqual({ title: "골 챌린지", clock: "8.0초", detail: "1/5골", urgent: true });
  });
});
