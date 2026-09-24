import { describe, expect, it } from "vitest";
import { ballDistance, ballSpinFrame, createBall, resetBall, stepBall, touchTarget, type BallState } from "../game/ball";
import { createPlayer, stepPlayer, type MoveInput, type PlayerState } from "../game/player";
import { DRIBBLE, MOVE, PLAY_AREA, SPAWN } from "../game/tuning";

const DT = 1 / 60;

function sim(p: PlayerState, b: BallState, input: MoveInput | ((t: number) => MoveInput), seconds: number) {
  let maxCarried = 0;
  for (let i = 0; i < Math.round(seconds / DT); i++) {
    stepPlayer(p, typeof input === "function" ? input(i * DT) : input, DT);
    stepBall(b, p, DT);
    if (b.mode === "carried") maxCarried = Math.max(maxCarried, ballDistance(b, p));
  }
  return maxCarried;
}

function fresh(x = 480, y = 340) {
  return { p: createPlayer(x, y), b: createBall(x, y) };
}

describe("carried ball", () => {
  it("spring converges to the touch point in front of the feet", () => {
    const { p, b } = fresh();
    sim(p, b, { dx: 0, dy: 0, sprint: false }, 1);
    const target = touchTarget(p);
    expect(b.mode).toBe("carried");
    expect(b.x).toBeCloseTo(target.x, 1);
    expect(b.y).toBeCloseTo(target.y, 1);
    expect(target.y).toBeCloseTo(340 - DRIBBLE.touchDistance * MOVE.yFactor);
  });

  it("keeps a steady run at the touch distance", () => {
    const { p, b } = fresh(100, 340);
    sim(p, b, { dx: 1, dy: 0, sprint: false }, 1.5);
    expect(b.mode).toBe("carried");
    expect(Math.abs(b.x - p.x - DRIBBLE.touchDistance)).toBeLessThan(5);
  });

  it("trails the feet when the direction changes, then settles on the new side", () => {
    const { p, b } = fresh(300, 340);
    sim(p, b, { dx: 1, dy: 0, sprint: false }, 1);
    sim(p, b, { dx: -1, dy: 0, sprint: false }, 0.08);
    // still on the old (right) side: the touch is visible
    expect(b.x).toBeGreaterThan(p.x);
    sim(p, b, { dx: -1, dy: 0, sprint: false }, 1.2);
    expect(b.x).toBeLessThan(p.x);
    expect(b.mode).toBe("carried");
  });

  it("stays carried through ordinary running turns", () => {
    const { p, b } = fresh(480, 340);
    sim(p, b, (t) => ({ dx: Math.floor(t / 0.4) % 2 ? -1 : 1, dy: Math.floor(t / 0.7) % 2 ? 1 : -1, sprint: false }), 6);
    expect(b.mode).toBe("carried");
  });

  it("sprinting pushes the ball further ahead", () => {
    const { p, b } = fresh(100, 340);
    sim(p, b, { dx: 1, dy: 0, sprint: true }, 1.5);
    expect(b.x - p.x).toBeGreaterThan(DRIBBLE.touchDistance + 10);
    expect(b.mode).toBe("carried");
  });

  it("a plain sprint in one direction does not lose the ball", () => {
    const { p, b } = fresh(60, 340);
    const max = sim(p, b, { dx: 1, dy: 0, sprint: true }, 2.5);
    expect(b.mode).toBe("carried");
    expect(max).toBeLessThan(DRIBBLE.looseDistance);
  });

  it("sprint weaving at ~0.4s per side swings the ball out to 90px → loose", () => {
    const { p, b } = fresh(480, 340);
    sim(p, b, (t) => ({ dx: Math.floor(t / 0.4) % 2 ? -1 : 1, dy: 0, sprint: true }), 4);
    expect(b.mode).not.toBe("carried");
  });

  it("goes loose exactly when the ball is 90px from the feet", () => {
    const { p, b } = fresh();
    b.x = p.x + 110;
    b.y = p.y;
    stepBall(b, p, DT);
    expect(b.mode).toBe("loose");
    const near = fresh();
    near.b.x = near.p.x + 85;
    stepBall(near.b, near.p, DT);
    expect(near.b.mode).toBe("carried");
  });

  it("never leaves the pitch by itself: pinned to the play area next to a wall", () => {
    const { p, b } = fresh(PLAY_AREA.minX + 2, 340);
    sim(p, b, { dx: -1, dy: 0, sprint: false }, 2);
    expect(b.mode).toBe("carried");
    expect(b.x).toBeGreaterThanOrEqual(PLAY_AREA.minX);
  });
});

describe("loose ball", () => {
  function loose(vx: number, vy: number, x = 480, y = 300) {
    const p = createPlayer(480, 500);
    const b = createBall(x, y);
    b.mode = "loose";
    b.vx = vx;
    b.vy = vy;
    return { p, b };
  }

  it("decelerates with friction 4.0/s and stops", () => {
    const { p, b } = loose(300, 0);
    stepBall(b, p, 1);
    expect(b.vx).toBeCloseTo(300 * Math.exp(-DRIBBLE.looseFriction), 5);
    sim(p, b, { dx: 0, dy: 0, sprint: false }, 4);
    expect(b.vx).toBe(0);
    expect(b.mode).toBe("loose");
  });

  it("is regained within 20px, with the trapping timer running", () => {
    const p = createPlayer(480, 340);
    const b = createBall(480 + 30, 340);
    b.mode = "loose";
    stepBall(b, p, DT);
    expect(b.mode).toBe("loose");
    b.x = 480 + 19;
    stepBall(b, p, DT);
    expect(b.mode).toBe("carried");
    expect(b.trap).toBeCloseTo(DRIBBLE.trapSeconds);
    sim(p, b, { dx: 0, dy: 0, sprint: false }, 0.3);
    expect(b.trap).toBe(0);
  });

  it("is not regained at 21px", () => {
    const p = createPlayer(480, 340);
    const b = createBall(480 + 21, 340);
    b.mode = "loose";
    stepBall(b, p, DT);
    expect(b.mode).toBe("loose");
  });

  it("goes dead when it rolls out of the play area, then resets to the spawn after 0.6s", () => {
    const { p, b } = loose(0, -500, 480, PLAY_AREA.minY + 20);
    p.x = 900;
    p.y = 500;
    let deadAt = -1;
    for (let i = 0; i < 90; i++) {
      stepBall(b, p, DT);
      if (b.mode === "dead" && deadAt < 0) deadAt = i;
    }
    expect(deadAt).toBeGreaterThanOrEqual(0);
    expect(b.y).toBeCloseTo(SPAWN.y);
    expect(b.x).toBeCloseTo(SPAWN.x);
    expect(b.mode).toBe("loose");
    expect(b.vx).toBe(0);
  });

  it("stays dead (frozen) for 0.6s", () => {
    const { p, b } = loose(0, -500, 480, PLAY_AREA.minY + 2);
    stepBall(b, p, DT);
    expect(b.mode).toBe("dead");
    const frozenY = b.y;
    for (let i = 0; i < 30; i++) stepBall(b, p, DT);
    expect(b.mode).toBe("dead");
    expect(b.y).toBe(frozenY);
    for (let i = 0; i < 10; i++) stepBall(b, p, DT);
    expect(b.mode).toBe("loose");
  });

  it("each edge of the play area kills the ball", () => {
    for (const [vx, vy, x, y] of [
      [-400, 0, PLAY_AREA.minX + 3, 300],
      [400, 0, PLAY_AREA.maxX - 3, 300],
      [0, 400, 480, PLAY_AREA.maxY - 3],
    ] as const) {
      const { p, b } = loose(vx, vy, x, y);
      p.x = 480;
      p.y = 300;
      stepBall(b, p, DT);
      stepBall(b, p, DT);
      expect(b.mode).toBe("dead");
    }
  });
});

describe("ball animation & reset", () => {
  it("spin frame advances with speed and direction, wrapped into the strip", () => {
    const p = createPlayer(480, 500);
    const b = createBall(200, 300);
    b.mode = "loose";
    b.vx = 400;
    for (let i = 0; i < 20; i++) stepBall(b, p, DT);
    const forward = ballSpinFrame(b, 8);
    expect(forward).toBeGreaterThanOrEqual(0);
    expect(forward).toBeLessThan(8);
    const back = createBall(700, 300);
    back.mode = "loose";
    back.vx = -400;
    for (let i = 0; i < 5; i++) stepBall(back, p, DT);
    expect(back.spin).toBeLessThan(0);
    expect(ballSpinFrame(back, 8)).toBeGreaterThanOrEqual(0);
  });

  it("R reset puts the ball back at the spawn, carried and still", () => {
    const b = createBall(100, 200);
    b.mode = "dead";
    b.vx = 50;
    resetBall(b);
    expect(b).toMatchObject({ x: SPAWN.x, y: SPAWN.y, vx: 0, vy: 0, mode: "carried" });
  });
});
