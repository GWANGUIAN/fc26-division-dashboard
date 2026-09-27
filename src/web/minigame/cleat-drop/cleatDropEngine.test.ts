import { describe, expect, it } from "vitest";
import {
  BOOT_RADIUS,
  GROUND_Y,
  STAGE_COUNT,
  TARGET_ANCHOR_X,
  advanceStage,
  computeKickImpulse,
  createGame,
  isSettled,
  releasePendulum,
  retryStage,
  stepPhysics,
  swingLeg,
  type CleatDropState,
} from "./cleatDropEngine";

const DT = 1 / 60;

function runSteps(state: CleatDropState, count: number): CleatDropState {
  let next = state;
  for (let i = 0; i < count; i++) next = stepPhysics(next, DT);
  return next;
}

describe("computeKickImpulse", () => {
  it("has no spin on a dead-center contact", () => {
    expect(computeKickImpulse(0, 10).spin).toBeCloseTo(0);
  });
  it("spins one way for a contact above center, the other way below center", () => {
    expect(computeKickImpulse(20, 10).spin).toBeGreaterThan(0);
    expect(computeKickImpulse(-20, 10).spin).toBeLessThan(0);
  });
  it("reacts monotonically to contact offset — a bigger offset means more spin", () => {
    const small = Math.abs(computeKickImpulse(10, 10).spin);
    const large = Math.abs(computeKickImpulse(40, 10).spin);
    expect(large).toBeGreaterThan(small);
  });
  it("always launches up and toward the target, and a faster swing means more power", () => {
    const weak = computeKickImpulse(0, 2);
    const strong = computeKickImpulse(0, 20);
    expect(weak.vx).toBeGreaterThan(0);
    expect(weak.vy).toBeLessThan(0);
    expect(strong.vx).toBeGreaterThan(0);
    expect(strong.vy).toBeLessThan(0);
    expect(Math.hypot(strong.vx, strong.vy)).toBeGreaterThan(Math.hypot(weak.vx, weak.vy));
  });
});

describe("determinism", () => {
  it("produces an identical state from an identical sequence of timings", () => {
    function play(): CleatDropState {
      let state = createGame(0);
      state = runSteps(state, 10);
      state = releasePendulum(state, state.t);
      state = runSteps(state, 5);
      state = swingLeg(state, state.t);
      state = runSteps(state, 60);
      return state;
    }
    expect(play()).toEqual(play());
  });
});

describe("a swing that never meets the boot", () => {
  it("lets the boot fall straight to the ground, never reaching flight", () => {
    let state = createGame(0);
    state = releasePendulum(state, 0);
    let sawFlight = false;
    for (let i = 0; i < 500 && state.phase === "falling"; i++) {
      state = stepPhysics(state, DT);
      if (state.phase === "flight") sawFlight = true;
    }
    expect(sawFlight).toBe(false);
    expect(state.phase).toBe("failed");
  });
});

describe("attempt counters", () => {
  it("increments attempts and attemptsByStage[stage] by exactly 1 on a missed drop", () => {
    let state = createGame(3);
    state = releasePendulum(state, 0);
    state = runSteps(state, 500);
    expect(state.phase).toBe("failed");
    expect(state.attempts).toBe(1);
    expect(state.attemptsByStage[3]).toBe(1);
    expect(state.attemptsByStage.filter((count) => count !== 0)).toHaveLength(1);
  });
});

describe("the 3-second hold judge", () => {
  function settledOnTargetState(): CleatDropState {
    const base = createGame(0);
    return {
      ...base,
      phase: "flight",
      boot: { x: TARGET_ANCHOR_X, y: GROUND_Y - BOOT_RADIUS, vx: 0, vy: 0, spin: 0 },
      holdTimer: 0,
      resting: true,
    };
  }

  it("clears the stage once the boot rests on the target for roughly 3 seconds, not sooner", () => {
    let state = settledOnTargetState();
    for (let i = 0; i < 2.5 * 60; i++) {
      state = stepPhysics(state, DT);
      expect(state.phase).toBe("flight");
    }
    for (let i = 0; i < 60 && state.phase === "flight"; i++) state = stepPhysics(state, DT);
    expect(state.phase).toBe("cleared");
    expect(state.cleared[0]).toBe(true);
  });

  it("resets the hold timer to 0 if the boot moves again before 3 seconds are up", () => {
    let state = settledOnTargetState();
    state = runSteps(state, 90); // 1.5s of holding
    expect(state.holdTimer).toBeGreaterThan(0);
    state = { ...state, boot: { ...state.boot, vx: 900, vy: -900 } };
    state = stepPhysics(state, DT);
    expect(state.holdTimer).toBe(0);
    expect(state.phase).toBe("flight");
  });

  it("fails immediately if the boot settles off the target", () => {
    let state = settledOnTargetState();
    state = { ...state, boot: { ...state.boot, x: TARGET_ANCHOR_X + 500 } };
    state = stepPhysics(state, DT);
    expect(state.phase).toBe("failed");
    expect(state.attempts).toBe(1);
  });
});

describe("all-clear latch", () => {
  it("turns on only when the 30th stage clears, not before", () => {
    const almostDone = createGame(STAGE_COUNT - 1, {
      cleared: Array(STAGE_COUNT - 1).fill(true).concat(false),
      attempts: 40,
      attemptsByStage: Array(STAGE_COUNT).fill(1),
    });
    let state: CleatDropState = {
      ...almostDone,
      phase: "flight",
      boot: { x: TARGET_ANCHOR_X, y: GROUND_Y - BOOT_RADIUS, vx: 0, vy: 0, spin: 0 },
      holdTimer: 2.5,
      resting: true,
    };
    expect(state.allClearLatched).toBe(false);
    for (let i = 0; i < 60 && state.phase === "flight"; i++) state = stepPhysics(state, DT);
    expect(state.phase).toBe("cleared");
    expect(state.allClearLatched).toBe(true);
  });

  it("stays off after clearing an earlier stage while later ones are still unfinished", () => {
    let state: CleatDropState = {
      ...createGame(0),
      phase: "flight",
      boot: { x: TARGET_ANCHOR_X, y: GROUND_Y - BOOT_RADIUS, vx: 0, vy: 0, spin: 0 },
      holdTimer: 2.5,
      resting: true,
    };
    for (let i = 0; i < 60 && state.phase === "flight"; i++) state = stepPhysics(state, DT);
    expect(state.phase).toBe("cleared");
    expect(state.allClearLatched).toBe(false);
  });
});

describe("isSettled", () => {
  it("is false mid-air and true once resting on the ground", () => {
    let state = createGame(0);
    state = releasePendulum(state, 0);
    expect(isSettled(state)).toBe(false);
    state = runSteps(state, 500);
    expect(state.phase).toBe("failed");
    expect(isSettled(state)).toBe(true);
  });
});

describe("stage progression", () => {
  it("advanceStage only acts from cleared, and moves to the next stage while keeping history", () => {
    const cleared: CleatDropState = {
      ...createGame(2, { attempts: 5, attemptsByStage: [0, 0, 2, 0], cleared: [false, false, true, false] }),
      phase: "cleared",
    };
    const next = advanceStage(cleared);
    expect(next.stageIndex).toBe(3);
    expect(next.phase).toBe("pendulum");
    expect(next.attempts).toBe(5);
    expect(next.cleared[2]).toBe(true);

    const untouched = createGame(2);
    expect(advanceStage(untouched)).toBe(untouched);
  });

  it("retryStage only acts from failed, and restarts the same stage while keeping history", () => {
    const failed: CleatDropState = { ...createGame(2, { attempts: 5, attemptsByStage: [0, 0, 2, 0] }), phase: "failed" };
    const retried = retryStage(failed);
    expect(retried.stageIndex).toBe(2);
    expect(retried.phase).toBe("pendulum");
    expect(retried.attempts).toBe(5);

    const untouched = createGame(2);
    expect(retryStage(untouched)).toBe(untouched);
  });
});

describe("guards", () => {
  it("ignores releasePendulum and swingLeg outside their valid phases", () => {
    const idle = createGame(0);
    expect(releasePendulum({ ...idle, phase: "flight" }, 1)).toEqual({ ...idle, phase: "flight" });
    expect(swingLeg(idle, 1)).toBe(idle);
  });
});
