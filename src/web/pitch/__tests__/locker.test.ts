import { describe, expect, it } from "vitest";
import {
  ANALYZER,
  EXIT_DOOR,
  GATE,
  GATE_SPAWN,
  LOCKER_AREA,
  LOCKER_COLLIDERS,
  LOCKER_SPAWN,
  clampToArea,
  gateDistance,
  insideBox,
  nearAnalyzer,
  nearExit,
  nearGate,
  nearGatePreload,
  resolveBoxes,
  withinCircle,
} from "../game/locker";
import { createPlayer, stepPlayer } from "../game/player";
import { lockerTargetAt } from "../scenes/LockerScene";

const body = (x: number, y: number) => ({ x, y, vx: 0, vy: 0 });

describe("gate interaction radii", () => {
  it("centres the 1.3× gate tile at (99, 399) with a 70px prompt radius and a 200px preload radius", () => {
    expect(GATE).toMatchObject({ x: 16, y: 316, w: 166, h: 166, centerX: 99, centerY: 399, promptRadius: 70, preloadRadius: 200 });
  });

  it("prompts inside 70px (border included) and not outside", () => {
    expect(nearGate(99, 399)).toBe(true);
    expect(nearGate(99 + 70, 399)).toBe(true);
    expect(nearGate(99 + 70.5, 399)).toBe(false);
    expect(nearGate(99, 399 - 69)).toBe(true);
    expect(nearGate(480, 440)).toBe(false);
  });

  it("preloads strictly inside 200px", () => {
    expect(nearGatePreload(99 + 199, 399)).toBe(true);
    expect(nearGatePreload(99 + 200, 399)).toBe(false);
    expect(gateDistance(99, 399)).toBe(0);
  });

  it("spawns the returning player just right of the gate tile, outside its prompt radius", () => {
    expect(GATE_SPAWN).toEqual({ x: 215, y: 440 });
    expect(nearGate(GATE_SPAWN.x, GATE_SPAWN.y)).toBe(false);
    expect(nearGatePreload(GATE_SPAWN.x, GATE_SPAWN.y)).toBe(true);
  });
});

describe("locker room interaction radii", () => {
  it("uses r=64 around the analyzer base and r=60 around the exit door", () => {
    expect(ANALYZER.interactRadius).toBe(64);
    expect(EXIT_DOOR.interactRadius).toBe(60);
    expect(nearAnalyzer(ANALYZER.baseX + 64, ANALYZER.baseY)).toBe(true);
    expect(nearAnalyzer(ANALYZER.baseX + 65, ANALYZER.baseY)).toBe(false);
    expect(nearExit(EXIT_DOOR.baseX, EXIT_DOOR.baseY - 60)).toBe(true);
    expect(nearExit(EXIT_DOOR.baseX, EXIT_DOOR.baseY - 61)).toBe(false);
    expect(withinCircle(0, 0, { x: 3, y: 4, r: 5 })).toBe(true);
  });

  it("starts the player at (480, 470), inside the exit prompt and clear of the analyzer", () => {
    expect(LOCKER_SPAWN).toEqual({ x: 480, y: 470 });
    expect(lockerTargetAt(LOCKER_SPAWN.x, LOCKER_SPAWN.y)).toBe("exit");
    expect(lockerTargetAt(480, 300)).toBeNull();
  });

  it("offers the analyzer next to it", () => {
    expect(lockerTargetAt(712, 420)).toBe("analyzer");
    expect(lockerTargetAt(764, 394)).toBe("analyzer");
    expect(lockerTargetAt(248, 420)).toBeNull();
  });

  it("can actually reach both interaction spots from the floor", () => {
    // straight below the analyzer: the collision box stops the feet at its padded edge
    const p = createPlayer(ANALYZER.baseX, 470);
    for (let i = 0; i < 240; i++) {
      stepPlayer(p, { dx: 0, dy: -1, sprint: false }, 1 / 60);
      resolveBoxes(p);
    }
    expect(nearAnalyzer(p.x, p.y)).toBe(true);
    // and the door
    const q = createPlayer(480, 300);
    for (let i = 0; i < 240; i++) {
      stepPlayer(q, { dx: 0, dy: 1, sprint: false }, 1 / 60);
      resolveBoxes(q);
    }
    expect(q.y).toBe(LOCKER_AREA.maxY);
    expect(nearExit(q.x, q.y)).toBe(true);
  });
});

describe("locker collisions", () => {
  it("keeps the feet on the floor", () => {
    const b = body(10, 900);
    b.vx = -50;
    b.vy = 80;
    clampToArea(b);
    expect(b).toMatchObject({ x: LOCKER_AREA.minX, y: LOCKER_AREA.maxY, vx: 0, vy: 0 });
  });

  it("pushes a body out of a box by the shortest way and drops the velocity pushing in", () => {
    const bench = LOCKER_COLLIDERS.find((box) => box.x === 735 && box.y === 402)!;
    const fromAbove = body(780, bench.y + 1);
    fromAbove.vy = 100;
    resolveBoxes(fromAbove);
    expect(insideBox(fromAbove.x, fromAbove.y, bench)).toBe(false);
    expect(fromAbove.y).toBeLessThan(bench.y);
    expect(fromAbove.vy).toBe(0);
    const fromLeft = body(bench.x + 1, bench.y + 8);
    fromLeft.vx = 90;
    resolveBoxes(fromLeft);
    expect(fromLeft.x).toBeLessThan(bench.x);
    expect(fromLeft.vx).toBe(0);
  });

  it("leaves a free body alone", () => {
    const b = body(480, 350);
    b.vx = 30;
    resolveBoxes(b);
    expect(b).toEqual({ x: 480, y: 350, vx: 30, vy: 0 });
  });

  it("stops a runner at the side-wall furniture", () => {
    const p = createPlayer(480, 260);
    for (let i = 0; i < 300; i++) {
      stepPlayer(p, { dx: -1, dy: 0, sprint: false }, 1 / 60);
      resolveBoxes(p);
    }
    expect(p.x).toBeGreaterThanOrEqual(150);
    // below the furniture the room is open to the wall
    const q = createPlayer(480, 420);
    for (let i = 0; i < 300; i++) {
      stepPlayer(q, { dx: -1, dy: 0, sprint: false }, 1 / 60);
      resolveBoxes(q);
    }
    expect(q.x).toBe(LOCKER_AREA.minX);
  });

  it("never leaves a wall-crossing body inside a box after resolving", () => {
    for (let x = 60; x <= 900; x += 20) {
      for (let y = 200; y <= 505; y += 15) {
        const b = body(x, y);
        resolveBoxes(b);
        for (const box of LOCKER_COLLIDERS) expect(insideBox(b.x, b.y, box)).toBe(false);
      }
    }
  });
});
