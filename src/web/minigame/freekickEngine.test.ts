import { describe, expect, it } from "vitest";
import {
  applyStrike,
  computeShotVelocity,
  createInitialState,
  pickKeeperZone,
  predictArrival,
  resetForNextAttempt,
  startNewRound,
  stepPhysics,
  zoneForX,
  BALL_RADIUS_3D,
  GOAL_HEIGHT,
  GOAL_LINE_Z,
  GOAL_WIDTH,
  STARTING_LIVES,
} from "./freekickEngine";

describe("computeShotVelocity", () => {
  it("curls left when struck on the right side of the ball", () => {
    expect(computeShotVelocity(BALL_RADIUS_3D, 0, 0, 0).spin).toBeLessThan(0);
  });
  it("curls right when struck on the left side of the ball", () => {
    expect(computeShotVelocity(-BALL_RADIUS_3D, 0, 0, 0).spin).toBeGreaterThan(0);
  });
  it("has no curl on a dead-center strike", () => {
    expect(computeShotVelocity(0, 0, 0, 0).spin).toBeCloseTo(0);
  });
  it("is sensitive near the center, so a small off-center strike already produces most of the curl", () => {
    const small = Math.abs(computeShotVelocity(BALL_RADIUS_3D * 0.15, 0, 0, 0).spin);
    const edge = Math.abs(computeShotVelocity(BALL_RADIUS_3D, 0, 0, 0).spin);
    expect(small).toBeGreaterThan(edge * 0.18);
  });
  it("always shoots forward, and drag magnitude increases shot speed", () => {
    const weak = computeShotVelocity(0, 0, 0.1, 0);
    const strong = computeShotVelocity(0, 0, 1, 0);
    expect(weak.vz).toBeLessThan(0);
    expect(strong.vz).toBeLessThan(0);
    expect(Math.abs(strong.vz)).toBeGreaterThan(Math.abs(weak.vz));
  });
  it("aims right when dragging right, left when dragging left", () => {
    expect(computeShotVelocity(0, 0, 1, 0).vx).toBeGreaterThan(0);
    expect(computeShotVelocity(0, 0, -1, 0).vx).toBeLessThan(0);
  });
  it("dragging all the way to the edge is actually capable of sending the shot past the goal frame", () => {
    // Sideways speed and forward speed both scale with drag magnitude, so they'd cancel out of
    // the arrival-position math and cap the reachable width below GOAL_WIDTH/2 if the sideways
    // coefficient were too small — dragging further would just "correct" back inside the frame no
    // matter how far past the post you aimed. A full drag must be able to clear the half-width.
    const { vx, vy, vz, spin } = computeShotVelocity(0, 0, 1, 0);
    const arrival = predictArrival(vx, vy, vz, spin);
    expect(Math.abs(arrival.x)).toBeGreaterThan(GOAL_WIDTH / 2);
  });
});

describe("zoneForX", () => {
  it("splits the goal into a left half and a right half", () => {
    expect(zoneForX(-GOAL_WIDTH / 2)).toBe("left");
    expect(zoneForX(-0.01)).toBe("left");
    expect(zoneForX(0)).toBe("right");
    expect(zoneForX(0.01)).toBe("right");
    expect(zoneForX(GOAL_WIDTH / 2)).toBe("right");
  });
});

describe("predictArrival", () => {
  it("predicts no lateral drift for a straight, spin-free shot", () => {
    const arrival = predictArrival(0, 1, -10, 0);
    expect(arrival.x).toBeCloseTo(0);
  });
  it("predicts lateral drift in the direction of spin", () => {
    const rightCurl = predictArrival(0, 1, -10, 5);
    const leftCurl = predictArrival(0, 1, -10, -5);
    expect(rightCurl.x).toBeGreaterThan(0);
    expect(leftCurl.x).toBeLessThan(0);
  });
  it("never predicts a height below the ball's resting radius", () => {
    const grounder = predictArrival(0, 0, -10, 0);
    expect(grounder.y).toBeCloseTo(BALL_RADIUS_3D);
  });
});

describe("pickKeeperZone", () => {
  it("splits the roll into a left half and a right half", () => {
    expect(pickKeeperZone(0)).toBe("left");
    expect(pickKeeperZone(0.49)).toBe("left");
    expect(pickKeeperZone(0.5)).toBe("right");
    expect(pickKeeperZone(0.999)).toBe("right");
  });
});

describe("stepPhysics", () => {
  it("only steps during flight", () => {
    const idle = createInitialState(0);
    expect(stepPhysics(idle, 1 / 60)).toBe(idle);
  });

  it("pulls the ball downward via gravity over time", () => {
    let state = applyStrike(createInitialState(0), 0, 0, 0, 0.5, 0);
    const firstVy = state.ball.vy;
    state = stepPhysics(state, 1 / 60);
    state = stepPhysics(state, 1 / 60);
    expect(state.ball.vy).toBeLessThan(firstVy);
  });

  it("keeps a zero-spin shot traveling straight in x (aside from aim), while a spun shot curls further off that line", () => {
    const straight = applyStrike(createInitialState(0), 0, 0, 0, 0.5, 0);
    const spun = applyStrike(createInitialState(0), BALL_RADIUS_3D, 0, 0, 0.5, 0);

    let straightState = straight;
    let spunState = spun;
    for (let i = 0; i < 20; i++) {
      straightState = stepPhysics(straightState, 1 / 60);
      spunState = stepPhysics(spunState, 1 / 60);
    }

    const straightDrift = Math.abs(straightState.ball.x - straightState.ball.vx * 0);
    expect(Math.abs(spunState.ball.x)).toBeGreaterThan(Math.abs(straightDrift));
  });

  it("resolves to a miss once the ball drifts past the side of the goal frame", () => {
    // Strike the left side of the ball (curls right) while also dragging right, so the curl
    // reinforces the aim instead of pulling it back toward center.
    let state = applyStrike(createInitialState(0), -BALL_RADIUS_3D, 0, 1, 0, 0);
    for (let i = 0; i < 500 && state.phase === "flight"; i++) {
      state = stepPhysics(state, 1 / 30);
    }
    expect(state.result).toBe("miss");
  });

  it("always resolves a dead-center shot to a definite outcome once it reaches the goal line", () => {
    let state = applyStrike(createInitialState(0), 0, 0, 0, 0.5, 0);
    for (let i = 0; i < 500 && state.phase === "flight"; i++) {
      state = stepPhysics(state, 1 / 60);
    }
    expect(["goal", "saved", "miss"]).toContain(state.result);
  });

  it("never resolves an outcome before the ball reaches the goal line, even once it hits the ground", () => {
    // A low grounder touches the ground almost immediately but must keep rolling toward the goal
    // line rather than resolving a save/miss right next to the kicker. Aimed off-center and at
    // speed so this isn't also an automatic "too slow/too centered" save (see below), which would
    // legitimately stop the ball early in front of the keeper for a different reason.
    let state = applyStrike(createInitialState(0), 0, 0, 0.6, 0, 0);
    let sawGroundedFarFromGoal = false;
    for (let i = 0; i < 500 && state.phase === "flight"; i++) {
      state = stepPhysics(state, 1 / 60);
      if (state.ball.y <= BALL_RADIUS_3D + 0.001 && state.ball.z > GOAL_LINE_Z + 1) {
        sawGroundedFarFromGoal = true;
      }
    }
    expect(sawGroundedFarFromGoal).toBe(true);
    expect(state.ball.z).toBeLessThanOrEqual(GOAL_LINE_Z + 0.001);
  });
});

describe("outcome boundaries", () => {
  it("counts as a miss once the ball rises above the crossbar height at the goal line", () => {
    // A near-vertical, high-power shot will climb past GOAL_HEIGHT before reaching GOAL_LINE_Z.
    let state = applyStrike(createInitialState(0), 0, -BALL_RADIUS_3D, 0, 1, 0);
    let sawOverHeight = false;
    for (let i = 0; i < 500 && state.phase === "flight"; i++) {
      state = stepPhysics(state, 1 / 60);
      if (state.ball.y > GOAL_HEIGHT) sawOverHeight = true;
    }
    if (sawOverHeight) {
      expect(state.result).toBe("miss");
    }
  });

  it("simulates a full-drag shot as an actual miss, not just the analytic prediction", () => {
    let state = applyStrike(createInitialState(0), 0, 0, 1, 0, 0);
    for (let i = 0; i < 500 && state.phase === "flight"; i++) {
      state = stepPhysics(state, 1 / 60);
    }
    expect(state.result).toBe("miss");
  });

  it("ends the flight once the ball reaches or passes the goal line", () => {
    // Off-center and full power so this isn't an automatic "too slow/too centered" save, which
    // would legitimately stop the ball short of the goal line in front of the keeper.
    let state = applyStrike(createInitialState(0), 0, 0, 0.6, 1, 0);
    let steps = 0;
    while (state.phase === "flight" && steps < 1000) {
      state = stepPhysics(state, 1 / 60);
      steps++;
    }
    expect(state.ball.z).toBeLessThanOrEqual(GOAL_LINE_Z + 0.001);
  });

  it("is a guaranteed save when the keeper's roll matches the shot's actual zone", () => {
    const { vx, vy, vz, spin } = computeShotVelocity(0, 0, 0, 1);
    const arrival = predictArrival(vx, vy, vz, spin);
    const matchingRoll = zoneForX(arrival.x) === "left" ? 0 : 0.99;

    let state = applyStrike(createInitialState(0), 0, 0, 0, 1, matchingRoll);
    for (let i = 0; i < 500 && state.phase === "flight"; i++) {
      state = stepPhysics(state, 1 / 60);
    }
    expect(state.result).toBe("saved");
    // The keeper must land exactly on the ball's real simulated position (not the pre-strike
    // prediction, which can drift from it) — this is what stops a "saved" result from ever
    // rendering with a visible gap between the keeper and the ball.
    expect(state.keeper.x).toBe(state.ball.x);
    expect(state.keeper.y).toBe(state.ball.y);
    // The ball must stop short of the goal line (in front of the keeper), not sail through to/past
    // it and render as if it went behind the keeper who supposedly just caught it.
    expect(state.ball.z).toBeGreaterThan(GOAL_LINE_Z);
  });

  it("is never a save when the keeper's roll misses the shot's actual zone (and the shot is neither too slow nor too centered)", () => {
    const { vx, vy, vz, spin } = computeShotVelocity(0, 0, 0.6, 1);
    const arrival = predictArrival(vx, vy, vz, spin);
    // Pick a roll that lands on the other half from the shot's actual zone.
    const missRoll = zoneForX(arrival.x) === "left" ? 0.99 : 0;

    let state = applyStrike(createInitialState(0), 0, 0, 0.6, 1, missRoll);
    for (let i = 0; i < 500 && state.phase === "flight"; i++) {
      state = stepPhysics(state, 1 / 60);
    }
    expect(state.result).not.toBe("saved");
  });

  it("always blocks a weak shot, even when the keeper's roll guesses the wrong half", () => {
    // Full curl (from the strike offset) sends this well off-center — ruling out the "too
    // centered" rule as the reason — but minimal drag keeps the power weak, an easy read for the
    // keeper regardless of which half it guesses.
    const { vx, vy, vz, spin } = computeShotVelocity(BALL_RADIUS_3D, 0, 0.2, 0);
    const arrival = predictArrival(vx, vy, vz, spin);
    expect(Math.abs(arrival.x)).toBeGreaterThan(GOAL_WIDTH / 8);
    const missRoll = zoneForX(arrival.x) === "left" ? 0.99 : 0;

    let state = applyStrike(createInitialState(0), BALL_RADIUS_3D, 0, 0.2, 0, missRoll);
    for (let i = 0; i < 500 && state.phase === "flight"; i++) {
      state = stepPhysics(state, 1 / 60);
    }
    expect(state.result).toBe("saved");
  });

  it("always blocks a dead-center shot, even when the keeper's roll guesses the wrong half", () => {
    // No horizontal aim/curl at all → lands dead center (zoneForX(0) is "right"), so a roll of 0
    // guesses "left" — the wrong half — yet it must still be blocked.
    let state = applyStrike(createInitialState(0), 0, 0, 0, 1, 0);
    for (let i = 0; i < 500 && state.phase === "flight"; i++) {
      state = stepPhysics(state, 1 / 60);
    }
    expect(state.result).toBe("saved");
  });
});

function simulateAttempt(state: ReturnType<typeof createInitialState>, wide: boolean) {
  // "wide" strikes the left side of the ball while dragging right, so curl reinforces the aim
  // and reliably sends the shot past the side of the goal frame (see the miss test above).
  let next = applyStrike(state, wide ? -BALL_RADIUS_3D : 0, 0, wide ? 1 : 0, wide ? 0 : 1, 0);
  for (let i = 0; i < 500 && next.phase === "flight"; i++) {
    next = stepPhysics(next, 1 / 30);
  }
  return next;
}

describe("lives/score state transitions", () => {
  it("scores a goal or loses a life, and never both stay unchanged", () => {
    const state = simulateAttempt(createInitialState(0), false);
    if (state.result === "goal") {
      expect(state.score).toBe(1);
      expect(state.lives).toBe(STARTING_LIVES);
      expect(state.bestScore).toBeGreaterThanOrEqual(1);
    } else {
      expect(state.score).toBe(0);
      expect(state.lives).toBe(STARTING_LIVES - 1);
    }
  });

  it("loses a life on a guaranteed miss, without changing score", () => {
    const state = simulateAttempt(createInitialState(0), true);
    expect(state.result).toBe("miss");
    expect(state.lives).toBe(STARTING_LIVES - 1);
    expect(state.score).toBe(0);
    expect(state.phase).toBe("result");
  });

  it("ends the game once lives reach zero, and ignores further strikes", () => {
    let state = createInitialState(0);
    for (let attempt = 0; attempt < STARTING_LIVES; attempt++) {
      state = simulateAttempt(state, true);
      if (state.phase === "result") state = resetForNextAttempt(state);
    }
    expect(state.phase).toBe("gameover");
    expect(state.lives).toBe(0);

    const ignored = applyStrike(state, 0, 0, 0, 1, 0);
    expect(ignored).toBe(state);
  });

  it("ignores a strike while not idle", () => {
    const state = createInitialState(0);
    const flight = applyStrike(state, 0, 0, 0, 1, 0);
    const ignored = applyStrike(flight, 0, 0, 0, 1, 0);
    expect(ignored).toBe(flight);
  });

  it("resetForNextAttempt returns to idle after a result, but is a no-op after game over", () => {
    const state = simulateAttempt(createInitialState(0), true);
    expect(state.phase).toBe("result");
    const reset = resetForNextAttempt(state);
    expect(reset.phase).toBe("idle");
    expect(resetForNextAttempt(reset)).toBe(reset);
  });

  it("startNewRound resets lives and score to their starting values but preserves bestScore", () => {
    let state = createInitialState(2);
    for (let attempt = 0; attempt < STARTING_LIVES; attempt++) {
      state = simulateAttempt(state, true);
      if (state.phase === "result") state = resetForNextAttempt(state);
    }
    expect(state.phase).toBe("gameover");

    const restarted = startNewRound(state);
    expect(restarted.phase).toBe("idle");
    expect(restarted.lives).toBe(STARTING_LIVES);
    expect(restarted.score).toBe(0);
    expect(restarted.bestScore).toBeGreaterThanOrEqual(2);
  });
});
