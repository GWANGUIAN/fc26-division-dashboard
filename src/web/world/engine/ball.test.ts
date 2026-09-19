import { describe, expect, it } from "vitest";
import { SpatialHash } from "./collision";
import { BALL_FRICTION, BALL_REST_SPEED, KICK_SPEED, ballBox, createBall, inGoal, isResting, kickBall, stepBall } from "./ball";

const open = new SpatialHash(64);
const pitch = { x: 0, y: 0, w: 400, h: 300 };

function roll(ball: ReturnType<typeof createBall>, obstacles = open, seconds = 4, bounds = pitch) {
  let current = ball;
  let bounces = 0;
  for (let t = 0; t < seconds * 60; t++) {
    const step = stepBall(current, 1 / 60, obstacles, bounds);
    current = step.ball;
    if (step.bounced) bounces++;
  }
  return { ball: current, bounces };
}

describe("kickBall", () => {
  it("sends the ball along the kicker's facing at full speed", () => {
    expect(kickBall(createBall(10, 10), "right")).toMatchObject({ vx: KICK_SPEED, vy: 0 });
    expect(kickBall(createBall(10, 10), "up")).toMatchObject({ vx: 0, vy: -KICK_SPEED });
    expect(kickBall(createBall(10, 10), "left").vx).toBe(-KICK_SPEED);
  });

  it("replaces whatever motion it had", () => {
    expect(kickBall({ x: 0, y: 0, vx: 50, vy: 50 }, "down")).toMatchObject({ vx: 0, vy: KICK_SPEED });
  });
});

describe("stepBall", () => {
  it("leaves a resting ball alone", () => {
    const ball = createBall(100, 100);
    expect(stepBall(ball, 1 / 60, open, pitch).ball).toBe(ball);
    expect(isResting(ball)).toBe(true);
  });

  it("rolls, slows by friction and comes to rest", () => {
    const start = createBall(50, 150);
    const { ball } = roll(kickBall(start, "right"), open, 6, { x: 0, y: 0, w: 3000, h: 300 });
    expect(isResting(ball)).toBe(true);
    // v²/2a = 380²/(2·210) ≈ 344px of rolling
    expect(ball.x - start.x).toBeGreaterThan(300);
    expect(ball.x - start.x).toBeLessThan(380);
  });

  it("never gets faster on its own and never rests above the rest speed", () => {
    let ball = kickBall(createBall(50, 150), "right");
    let previous = Math.hypot(ball.vx, ball.vy);
    for (let t = 0; t < 400; t++) {
      ball = stepBall(ball, 1 / 60, open, { x: 0, y: 0, w: 5000, h: 300 }).ball;
      const speed = Math.hypot(ball.vx, ball.vy);
      expect(speed).toBeLessThanOrEqual(previous + 1e-9);
      if (speed > 0) expect(speed).toBeGreaterThanOrEqual(BALL_REST_SPEED - BALL_FRICTION / 60);
      previous = speed;
    }
  });

  it("bounces off a wall and keeps most of its speed", () => {
    const walls = new SpatialHash(64);
    walls.insert({ x: 200, y: 100, w: 20, h: 100 });
    let ball = kickBall(createBall(100, 150), "right");
    let bounced = false;
    for (let t = 0; t < 120 && !bounced; t++) {
      const step = stepBall(ball, 1 / 60, walls, pitch);
      ball = step.ball;
      bounced = step.bounced;
    }
    expect(bounced).toBe(true);
    expect(ball.vx).toBeLessThan(0);
    expect(Math.abs(ball.vx)).toBeGreaterThan(150);
    expect(ballBox(ball).x + ballBox(ball).w).toBeLessThanOrEqual(200 + 1e-6);
  });

  it("stays inside the pitch bounds (bounces off the edge)", () => {
    const { ball, bounces } = roll(kickBall(createBall(350, 150), "right"), open, 4);
    expect(bounces).toBeGreaterThan(0);
    expect(ball.x + 6).toBeLessThanOrEqual(pitch.w + 1e-6);
    expect(ball.x - 6).toBeGreaterThanOrEqual(0);
  });

  it("does not tunnel through a thin wall at kick speed", () => {
    const walls = new SpatialHash(64);
    walls.insert({ x: 200, y: 0, w: 2, h: 300 });
    const { ball } = roll(kickBall(createBall(150, 150), "right"), walls, 3);
    expect(ball.x).toBeLessThan(200);
  });
});

describe("inGoal", () => {
  const goal = { x: 100, y: 100, w: 64, h: 96 };
  it("counts the ball touching the goal's face", () => {
    expect(inGoal({ x: 164 + 8, y: 150, vx: 0, vy: 0 }, goal)).toBe(true); // resting against the edge (within margin)
    expect(inGoal({ x: 164 + 30, y: 150, vx: 0, vy: 0 }, goal)).toBe(false);
    expect(inGoal({ x: 130, y: 60, vx: 0, vy: 0 }, goal)).toBe(false);
  });
});
