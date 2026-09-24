import { describe, expect, it } from "vitest";
import { FREE_BALL, ballArrived, createBall, launchBall, releaseBall, resetBall, stepBall } from "../game/ball";
import { createPlayer } from "../game/player";
import { computeShot } from "../game/shot";
import { createRng } from "../game/rng";
import { GOAL_SCREEN, SPAWN, goalScreenX } from "../game/tuning";

const DT = 1 / 60;

function kicked(power = 60, aim = 0) {
  const b = createBall();
  const p = createPlayer();
  const flight = computeShot({ ballX: b.x, ballY: b.y, aim, power }, createRng(2));
  launchBall(b, flight);
  return { b, p, flight };
}

describe("ball shot mode (P3)", () => {
  it("flies the scripted path to the goal plane in the shot's flight time", () => {
    const { b, p, flight } = kicked();
    expect(b.mode).toBe("shot");
    let t = 0;
    while (!ballArrived(b) && t < 3) {
      stepBall(b, p, DT);
      t += DT;
    }
    expect(t).toBeGreaterThanOrEqual(flight.time - DT);
    expect(t).toBeLessThan(flight.time + 2 * DT);
    expect(b.x).toBeCloseTo(goalScreenX(480 + flight.tx), 6);
    expect(b.y).toBeCloseTo(GOAL_SCREEN.planeY, 6);
    expect(b.z).toBeCloseTo(flight.h * GOAL_SCREEN.zScale, 6);
  });

  it("rises as it flies: lower than the target height at the start", () => {
    const { b, p, flight } = kicked(90);
    stepBall(b, p, DT);
    expect(b.z).toBeGreaterThan(0);
    expect(b.z).toBeLessThan(flight.h);
    expect(b.y).toBeLessThan(SPAWN.y);
  });

  it("does not become loose or dead on the way, whatever the player does", () => {
    const { b, p } = kicked();
    for (let i = 0; i < 10; i++) stepBall(b, p, DT);
    expect(b.mode).toBe("shot");
  });

  it("after release it flies free: gravity, bounces that die out, then rolls to a stop", () => {
    const { b, p } = kicked();
    while (!ballArrived(b)) stepBall(b, p, DT);
    const startZ = b.z;
    releaseBall(b, 80, 300, 260);
    expect(b.flight).toBeNull();
    let peak = 0;
    let bounces = 0;
    let wasAir = true;
    for (let i = 0; i < 60 * 8; i++) {
      stepBall(b, p, DT);
      peak = Math.max(peak, b.z);
      if (b.z === 0 && wasAir) bounces++;
      wasAir = b.z > 0;
    }
    expect(peak).toBeGreaterThan(20);
    expect(peak).toBeLessThan(startZ + (260 * 260) / (2 * FREE_BALL.gravity) + 5);
    expect(bounces).toBeGreaterThanOrEqual(2);
    expect(b.z).toBe(0);
    expect(Math.hypot(b.vx, b.vy)).toBeLessThan(5);
    expect(b.mode).toBe("shot");
  });

  it("R (resetBall) brings back a clean carried ball", () => {
    const { b } = kicked();
    resetBall(b);
    expect(b).toMatchObject({ mode: "carried", z: 0, vz: 0, flight: null, x: SPAWN.x, y: SPAWN.y });
  });
});
