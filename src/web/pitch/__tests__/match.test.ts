import { describe, expect, it } from "vitest";
import {
  ballExit,
  beginFlight,
  createMatch,
  fadeAlpha,
  registerResult,
  resolveShot,
  stepMatch,
  type ShotResult,
} from "../game/match";
import type { SavePlan } from "../game/keeper";
import type { ShotFlight } from "../game/shot";
import { createRng } from "../game/rng";
import { MATCH } from "../game/tuning";

const flight = (over: Partial<ShotFlight> = {}): ShotFlight => ({
  startX: 480,
  startY: 440,
  power: 60,
  sweet: false,
  aimTx: 0,
  tx: 0,
  h: 30,
  angleDeg: 0,
  dist: 290,
  speed: 760,
  time: 0.38,
  sigma: 20,
  kind: "onTarget",
  ...over,
});

const plan = (over: Partial<SavePlan> = {}): SavePlan => ({
  reactDelay: 0.2,
  dir: 1,
  high: false,
  startX: 480,
  endX: 480,
  reach: 60,
  mode: "stay",
  saved: false,
  kind: null,
  grazed: false,
  fooled: false,
  flightTime: 0.38,
  ...over,
});

const result = (over: Partial<ShotResult> = {}): ShotResult => ({ outcome: "GOAL", detail: null, power: 60, sweet: false, tx: 0, h: 30, grazed: false, ...over });

describe("resolveShot", () => {
  it("on target: GOAL unless the keeper saves it", () => {
    expect(resolveShot(flight(), plan()).outcome).toBe("GOAL");
    const saved = resolveShot(flight(), plan({ saved: true, kind: "PUNCH" }));
    expect(saved.outcome).toBe("SAVE");
    expect(saved.detail).toBe("PUNCH");
  });

  it("post, bar, wide and over map to POST / BAR / MISS", () => {
    expect(resolveShot(flight({ kind: "post" }), plan({ saved: true })).outcome).toBe("POST");
    expect(resolveShot(flight({ kind: "bar" }), plan()).outcome).toBe("BAR");
    const wide = resolveShot(flight({ kind: "wide" }), plan({ saved: true }));
    expect(wide.outcome).toBe("MISS");
    expect(wide.detail).toBe("WIDE");
    expect(resolveShot(flight({ kind: "over" }), plan()).detail).toBe("OVER");
  });

  it("a grazed DEFLECT is a goal that remembers the touch", () => {
    const r = resolveShot(flight(), plan({ grazed: true, kind: "DEFLECT" }));
    expect(r.outcome).toBe("GOAL");
    expect(r.grazed).toBe(true);
  });

  it("the debug override wins", () => {
    expect(resolveShot(flight(), plan(), "POST").outcome).toBe("POST");
    expect(resolveShot(flight(), plan(), "SAVE").outcome).toBe("SAVE");
    expect(resolveShot(flight(), plan(), "MISS").detail).toBe("WIDE");
  });
});

describe("score and streak", () => {
  it("counts goals, saves and the streak; anything but a goal breaks the streak", () => {
    const m = createMatch();
    for (const outcome of ["GOAL", "GOAL", "GOAL"] as const) {
      beginFlight(m);
      registerResult(m, result({ outcome }));
    }
    expect(m).toMatchObject({ goals: 3, saves: 0, streak: 3, bestStreak: 3, shots: 3 });
    beginFlight(m);
    registerResult(m, result({ outcome: "SAVE", detail: "CATCH" }));
    expect(m).toMatchObject({ goals: 3, saves: 1, streak: 0, bestStreak: 3 });
    for (const outcome of ["POST", "BAR", "MISS"] as const) {
      beginFlight(m);
      registerResult(m, result({ outcome }));
    }
    expect(m).toMatchObject({ goals: 3, saves: 1, streak: 0, shots: 7 });
    beginFlight(m);
    registerResult(m, result({ outcome: "GOAL" }));
    expect(m.streak).toBe(1);
    expect(m.bestStreak).toBe(3);
  });
});

describe("result → fade → reset sequence (2.0s + 0.3s)", () => {
  it("shows the result for 2.0s, fades, resets once at the darkest point, then plays again", () => {
    const m = createMatch();
    beginFlight(m);
    expect(m.phase).toBe("flight");
    registerResult(m, result());
    expect(m.phase).toBe("result");

    const dt = 1 / 60;
    let t = 0;
    let resets = 0;
    let resetAt = -1;
    let maxFade = 0;
    while (m.phase !== "play" && t < 5) {
      const ev = stepMatch(m, dt);
      t += dt;
      if (ev === "reset") {
        resets++;
        resetAt = t;
      }
      maxFade = Math.max(maxFade, fadeAlpha(m));
    }
    expect(resets).toBe(1);
    expect(resetAt).toBeGreaterThan(MATCH.resultSeconds + MATCH.fadeSeconds / 2 - 0.05);
    expect(resetAt).toBeLessThan(MATCH.resultSeconds + MATCH.fadeSeconds / 2 + 0.05);
    expect(t).toBeGreaterThan(MATCH.resultSeconds + MATCH.fadeSeconds - 0.05);
    expect(t).toBeLessThan(MATCH.resultSeconds + MATCH.fadeSeconds + 0.05);
    expect(maxFade).toBeGreaterThan(0.9);
    expect(m.phase).toBe("play");
    expect(m.result).toBeNull();
  });

  it("does nothing while playing or in flight", () => {
    const m = createMatch();
    expect(stepMatch(m, 5)).toBeNull();
    beginFlight(m);
    expect(stepMatch(m, 5)).toBeNull();
    expect(m.phase).toBe("flight");
    expect(fadeAlpha(m)).toBe(0);
  });
});

describe("ballExit", () => {
  const rng = () => createRng(3);
  const p = plan();

  it("a goal lands in the net; a catch holds the ball", () => {
    const goal = ballExit(result(), p, 30, -900, rng());
    expect(goal.inNet).toBe(true);
    expect(Math.abs(goal.vy)).toBeLessThan(200);
    expect(goal.vy).toBeLessThan(0);
    const held = ballExit(result({ outcome: "SAVE", detail: "CATCH" }), p, 0, -900, rng());
    expect(held.held).toBe(true);
    expect(held.inNet).toBe(false);
  });

  it("post, bar, punch and deflect send the ball back toward the pitch", () => {
    for (const outcome of ["POST", "BAR"] as const) {
      const out = ballExit(result({ outcome }), p, 0, -900, rng());
      expect(out.vy).toBeGreaterThan(0);
      expect(out.inNet).toBe(false);
    }
    for (const detail of ["PUNCH", "DEFLECT"] as const) {
      const out = ballExit(result({ outcome: "SAVE", detail, tx: 40 }), p, 0, -900, rng());
      expect(out.vy).toBeGreaterThan(0);
      expect(out.vz).toBeGreaterThan(0);
      expect(out.held).toBe(false);
    }
  });

  it("a miss keeps going, over the bar with lift", () => {
    const wide = ballExit(result({ outcome: "MISS", detail: "WIDE", tx: 200 }), p, 200, -900, rng());
    expect(wide.vy).toBeLessThan(0);
    const over = ballExit(result({ outcome: "MISS", detail: "OVER" }), p, 0, -900, rng());
    expect(over.vz).toBeGreaterThan(200);
  });
});
