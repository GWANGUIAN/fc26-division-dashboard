import { describe, expect, it } from "vitest";
import {
  applyHit,
  applyRelaunch,
  computeBounceVelocity,
  computeGravity,
  computeHitTolerance,
  createInitialState,
  startDrop,
  stepPhysics,
  BALL_RADIUS,
  DROP_X,
  DROP_Y,
  GROUND_Y,
} from "./kickupsEngine";

describe("computeBounceVelocity", () => {
  it("sends the ball right when clicked on the left edge", () => {
    expect(computeBounceVelocity(-BALL_RADIUS, 0).vx).toBeGreaterThan(0);
  });
  it("sends the ball left when clicked on the right edge", () => {
    expect(computeBounceVelocity(BALL_RADIUS, 0).vx).toBeLessThan(0);
  });
  it("pops mostly straight up with the strongest vy on a dead-center click", () => {
    const center = computeBounceVelocity(0, 0);
    const edge = computeBounceVelocity(BALL_RADIUS, 0);
    expect(center.vx).toBeCloseTo(0);
    expect(center.vy).toBeLessThan(0);
    expect(Math.abs(center.vy)).toBeGreaterThan(Math.abs(edge.vy));
  });
  it("is sensitive near the center, so even a small offset already moves the ball noticeably sideways", () => {
    const small = Math.abs(computeBounceVelocity(-BALL_RADIUS * 0.15, 0).vx);
    const edge = Math.abs(computeBounceVelocity(-BALL_RADIUS, 0).vx);
    // Linear scaling would give small = 0.15 * edge; the sub-linear curve should exceed that.
    expect(small).toBeGreaterThan(edge * 0.18);
  });
  it("gives a bottom-left click and a top-left click the same horizontal push but a different vertical angle", () => {
    const bottomLeft = computeBounceVelocity(-BALL_RADIUS * 0.5, BALL_RADIUS * 0.5);
    const topLeft = computeBounceVelocity(-BALL_RADIUS * 0.5, -BALL_RADIUS * 0.5);
    expect(bottomLeft.vx).toBeCloseTo(topLeft.vx);
    expect(bottomLeft.vy).not.toBeCloseTo(topLeft.vy);
  });
  it("lifts the ball higher when clicked below-center than above-center, without ever pushing it downward", () => {
    const belowCenter = computeBounceVelocity(0, BALL_RADIUS);
    const aboveCenter = computeBounceVelocity(0, -BALL_RADIUS);
    expect(Math.abs(belowCenter.vy)).toBeGreaterThan(Math.abs(aboveCenter.vy));
    expect(belowCenter.vy).toBeLessThan(0);
    expect(aboveCenter.vy).toBeLessThan(0);
  });
});

describe("computeGravity", () => {
  it("increases monotonically with score", () => {
    expect(computeGravity(10)).toBeGreaterThan(computeGravity(0));
    expect(computeGravity(20)).toBeGreaterThan(computeGravity(10));
  });
  it("caps out at a maximum", () => {
    expect(computeGravity(1000)).toBe(computeGravity(500));
  });
});

describe("computeHitTolerance", () => {
  it("starts wide and shrinks with score", () => {
    expect(computeHitTolerance(0)).toBeGreaterThan(computeHitTolerance(30));
  });
  it("never shrinks below a floor", () => {
    expect(computeHitTolerance(1000)).toBe(computeHitTolerance(500));
  });
});

describe("game state transitions", () => {
  it("only drops from idle, resetting score and starting from the top-center", () => {
    const state = startDrop(createInitialState(0));
    expect(state.phase).toBe("airborne");
    expect(state.ball).toMatchObject({ x: DROP_X, y: DROP_Y, vx: 0, vy: 0 });
    expect(startDrop(state)).toBe(state);
  });

  it("ignores whiffed clicks far from the ball", () => {
    const state = startDrop(createInitialState(0));
    const next = applyHit(state, state.ball.x + 500, state.ball.y);
    expect(next).toBe(state);
  });

  it("counts a hit within tolerance and updates the high score", () => {
    const state = startDrop(createInitialState(3));
    const next = applyHit(state, state.ball.x, state.ball.y);
    expect(next.score).toBe(1);
    expect(next.phase).toBe("airborne");
    expect(next.highScore).toBe(3);
  });

  it("ends the run once the ball reaches the ground, then allows a relaunch click to reset", () => {
    let state = startDrop(createInitialState(0));
    for (let i = 0; i < 200 && state.phase === "airborne"; i++) {
      state = stepPhysics(state, 1 / 60);
    }
    expect(state.phase).toBe("grounded");

    expect(applyHit(state, state.ball.x, state.ball.y)).toBe(state);

    const relaunched = applyRelaunch(state, state.ball.x, state.ball.y);
    expect(relaunched.phase).toBe("airborne");
    expect(relaunched.score).toBe(0);
  });

  it("bounces off the side walls instead of leaving the court", () => {
    let state = startDrop(createInitialState(0));
    state = applyHit(state, state.ball.x - BALL_RADIUS, state.ball.y);
    for (let i = 0; i < 300 && state.ball.x < 900; i++) {
      state = stepPhysics(state, 1 / 60);
    }
    expect(state.ball.x).toBeLessThanOrEqual(900 - BALL_RADIUS + 0.001);
  });

  it("falls from the drop height to the ground in roughly the expected time", () => {
    let state = startDrop(createInitialState(0));
    let elapsed = 0;
    const dt = 1 / 60;
    while (state.phase === "airborne") {
      state = stepPhysics(state, dt);
      elapsed += dt;
    }
    const expectedSeconds = Math.sqrt((2 * (GROUND_Y - BALL_RADIUS - DROP_Y)) / 900);
    expect(elapsed).toBeGreaterThan(expectedSeconds * 0.85);
    expect(elapsed).toBeLessThan(expectedSeconds * 1.15);
  });
});
