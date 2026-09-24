import { describe, expect, it } from "vitest";
import { createPlayer, facingDirection, playerPose, playerSpeed, runFps, stepPlayer, type MoveInput, type PlayerState } from "../game/player";
import { DEPTH, MOVE, PLAY_AREA, SPAWN, depthScale } from "../game/tuning";

const DT = 1 / 60;
const NONE: MoveInput = { dx: 0, dy: 0, sprint: false };

function run(p: PlayerState, input: MoveInput, seconds: number) {
  for (let i = 0; i < Math.round(seconds / DT); i++) stepPlayer(p, input, DT);
}

describe("player movement", () => {
  it("starts at the spawn, standing still and facing the goal", () => {
    const p = createPlayer();
    expect([p.x, p.y]).toEqual([SPAWN.x, SPAWN.y]);
    expect(playerPose(p)).toMatchObject({ clip: "idle", dir: "up", mirror: false });
  });

  it("reaches run speed and holds it", () => {
    const p = createPlayer(200, 300);
    run(p, { dx: 1, dy: 0, sprint: false }, 1);
    expect(p.vx).toBeCloseTo(MOVE.runSpeed);
    expect(p.vy).toBe(0);
  });

  it("accelerates gradually: after 0.05s only accel × t", () => {
    const p = createPlayer(200, 300);
    run(p, { dx: 1, dy: 0, sprint: false }, 0.05);
    expect(p.vx).toBeCloseTo(MOVE.accel * 0.05, 0);
    expect(p.vx).toBeLessThan(MOVE.runSpeed);
  });

  it("sprint raises the top speed", () => {
    const p = createPlayer(100, 300);
    run(p, { dx: 1, dy: 0, sprint: true }, 1);
    expect(p.vx).toBeCloseTo(MOVE.sprintSpeed);
    expect(p.sprinting).toBe(true);
  });

  it("does not sprint while standing still", () => {
    const p = createPlayer();
    run(p, { dx: 0, dy: 0, sprint: true }, 0.2);
    expect(p.sprinting).toBe(false);
  });

  it("normalises diagonals (same top speed) and applies the y factor to the vertical part", () => {
    const straight = createPlayer(480, 340);
    run(straight, { dx: 1, dy: 0, sprint: false }, 1);
    const diagonal = createPlayer(480, 340);
    run(diagonal, { dx: 1, dy: -1, sprint: false }, 0.5);
    expect(diagonal.vx).toBeCloseTo(MOVE.runSpeed / Math.SQRT2);
    expect(diagonal.vy).toBeCloseTo((-MOVE.runSpeed / Math.SQRT2) * MOVE.yFactor);
    expect(Math.abs(diagonal.vx)).toBeLessThan(straight.vx);
  });

  it("moves vertically at 0.75 of the horizontal speed", () => {
    const p = createPlayer(480, 340);
    run(p, { dx: 0, dy: -1, sprint: false }, 0.6);
    expect(-p.vy).toBeCloseTo(MOVE.runSpeed * MOVE.yFactor);
  });

  it("decelerates to a stop", () => {
    const p = createPlayer(200, 300);
    run(p, { dx: 1, dy: 0, sprint: false }, 1);
    run(p, NONE, MOVE.runSpeed / MOVE.decel + 0.05);
    expect(playerSpeed(p)).toBe(0);
  });

  it("keeps the last facing while standing still", () => {
    const p = createPlayer(300, 300);
    run(p, { dx: -1, dy: 0, sprint: false }, 0.5);
    run(p, NONE, 1);
    expect(playerPose(p)).toMatchObject({ clip: "idle", dir: "side", mirror: true });
  });

  it("clamps to the play area on every side", () => {
    const cases: Array<[MoveInput, (p: PlayerState) => number, number]> = [
      [{ dx: -1, dy: 0, sprint: true }, (p) => p.x, PLAY_AREA.minX],
      [{ dx: 1, dy: 0, sprint: true }, (p) => p.x, PLAY_AREA.maxX],
      [{ dx: 0, dy: -1, sprint: true }, (p) => p.y, PLAY_AREA.minY],
      [{ dx: 0, dy: 1, sprint: true }, (p) => p.y, PLAY_AREA.maxY],
    ];
    for (const [input, axis, limit] of cases) {
      const p = createPlayer();
      run(p, input, 6);
      expect(axis(p)).toBe(limit);
    }
  });

  it("can never get behind the goal line (y < 178) even at sprint speed toward the goal", () => {
    const p = createPlayer(480, 200);
    for (let i = 0; i < 600; i++) {
      stepPlayer(p, { dx: i % 7 < 3 ? 1 : 0, dy: -1, sprint: true }, DT);
      expect(p.y).toBeGreaterThanOrEqual(PLAY_AREA.minY);
    }
    expect(p.vy).toBe(0);
  });

  it("drops the velocity component that pushes into a wall but keeps sliding along it", () => {
    const p = createPlayer(PLAY_AREA.minX + 5, 300);
    run(p, { dx: -1, dy: 1, sprint: false }, 1);
    expect(p.x).toBe(PLAY_AREA.minX);
    expect(p.vx).toBe(0);
    expect(p.y).toBeGreaterThan(300);
  });

  it("depthScale shrinks toward the goal", () => {
    expect(depthScale(DEPTH.y0)).toBeCloseTo(0.85);
    expect(depthScale(510)).toBeCloseTo(1.1);
    expect(depthScale(100)).toBeCloseTo(0.85);
    expect(depthScale(999)).toBeCloseTo(1.1);
    expect(depthScale(344)).toBeCloseTo(0.975);
  });
});

describe("player animation", () => {
  it("picks the direction from the dominant axis; diagonals use the side clip", () => {
    expect(facingDirection(0, -1)).toEqual({ dir: "up", mirror: false });
    expect(facingDirection(0, 1)).toEqual({ dir: "down", mirror: false });
    expect(facingDirection(1, 0)).toEqual({ dir: "side", mirror: false });
    expect(facingDirection(-1, 0)).toEqual({ dir: "side", mirror: true });
    expect(facingDirection(-Math.SQRT1_2, -Math.SQRT1_2)).toEqual({ dir: "side", mirror: true });
    expect(facingDirection(0.3, -0.95)).toEqual({ dir: "up", mirror: false });
  });

  it("switches idle ↔ run at the idle speed threshold", () => {
    const p = createPlayer(300, 300);
    run(p, { dx: 1, dy: 0, sprint: false }, 0.5);
    expect(playerPose(p).clip).toBe("run");
    run(p, NONE, 1);
    expect(playerPose(p).clip).toBe("idle");
  });

  it("run frame rate is proportional to speed within 6..12 fps", () => {
    expect(runFps(MOVE.idleSpeed)).toBeCloseTo(MOVE.runFpsMin);
    expect(runFps(MOVE.sprintSpeed)).toBeCloseTo(MOVE.runFpsMax);
    expect(runFps(MOVE.runSpeed)).toBeGreaterThan(runFps(100));
    expect(runFps(9999)).toBe(MOVE.runFpsMax);
  });

  it("cycles through the 6 run frames", () => {
    const p = createPlayer(100, 300);
    const seen = new Set<number>();
    for (let i = 0; i < 120; i++) {
      stepPlayer(p, { dx: 1, dy: 0, sprint: false }, DT);
      seen.add(playerPose(p).frame);
    }
    expect([...seen].sort()).toEqual([0, 1, 2, 3, 4, 5]);
  });
});
