import { describe, expect, it } from "vitest";
import { BOARD_HEIGHT, DANGER_Y, FIXED_STEP, TIERS, createGame, drop, setAim, step, type GrassMergeBody, type GrassMergeState } from "./grassMergeEngine.js";

function body(id: number, tier: number, x: number, y: number, overrides: Partial<GrassMergeBody> = {}): GrassMergeBody {
  return { id, tier, x, y, vx: 0, vy: 0, sleepSteps: 0, sleeping: false, graceLeft: 0, dangerTime: 0, ...overrides };
}

function stateWith(bodies: GrassMergeBody[]): GrassMergeState {
  return { ...createGame(7), bodies, nextId: Math.max(0, ...bodies.map((item) => item.id)) + 1 };
}

describe("grass merge engine", () => {
  it("is deterministic when the same seeded actions are accumulated through different frame counts", () => {
    const play = (frameDt: number) => {
      let game = createGame(1234);
      let accumulator = 0;
      let simulatedFrames = 0;
      const outerFrames = frameDt === 1 / 60 ? 180 : 90;
      for (let frame = 0; frame < outerFrames; frame += 1) {
        accumulator += frameDt;
        while (accumulator + 1e-9 >= FIXED_STEP) {
          if (simulatedFrames === 0 || simulatedFrames === 45 || simulatedFrames === 100) game = drop(setAim(game, 120 + simulatedFrames));
          game = step(game, FIXED_STEP);
          simulatedFrames += 1;
          accumulator -= FIXED_STEP;
        }
      }
      return game;
    };
    expect(play(1 / 60)).toEqual(play(1 / 30));
  });

  it("merges a matching pair at its midpoint and awards the next-tier score", () => {
    const game = step(stateWith([body(1, 1, 130, 560, { sleeping: true }), body(2, 1, 150, 560, { sleeping: true })]));
    expect(game.bodies).toHaveLength(1);
    expect(game.bodies[0]).toMatchObject({ tier: 2, x: 140, y: 560 });
    expect(game.score).toBe(3);
  });

  it("does not consume one body twice when three matching bodies touch together", () => {
    const game = step(stateWith([body(1, 2, 120, 540, { sleeping: true }), body(2, 2, 145, 540, { sleeping: true }), body(3, 2, 170, 540, { sleeping: true })]));
    expect(game.bodies).toHaveLength(2);
    expect(game.bodies.filter((item) => item.tier === 3)).toHaveLength(1);
    expect(game.bodies.filter((item) => item.tier === 2)).toHaveLength(1);
    expect(game.score).toBe(6);
  });

  it("removes two final-tier items and awards 100 points", () => {
    const game = step(stateWith([body(1, 11, 150, 470, { sleeping: true }), body(2, 11, 260, 470, { sleeping: true })]));
    expect(game.bodies).toEqual([]);
    expect(game.score).toBe(100);
  });

  it("waits out drop grace, then ends after an item remains above the danger line for 1.5 seconds", () => {
    let game = stateWith([body(1, 1, 200, DANGER_Y - 20, { graceLeft: .5 })]);
    for (let index = 0; index < 30; index += 1) game = step(game);
    expect(game.phase).toBe("playing");
    game = { ...game, bodies: game.bodies.map((item) => ({ ...item, y: DANGER_Y - 20, vy: 0 })) };
    for (let index = 0; index < 91; index += 1) {
      game = { ...game, bodies: game.bodies.map((item) => ({ ...item, y: DANGER_Y - 20, vy: 0, sleeping: true })) };
      game = step(game);
    }
    expect(game.phase).toBe("over");
  });

  it("only generates tiers one through five for a thousand seeded drops", () => {
    let game = createGame(99);
    const candidates = new Set<number>([game.nextTier]);
    for (let index = 0; index < 1000; index += 1) {
      game = drop(game);
      candidates.add(game.nextTier);
      game = { ...game, cooldown: 0, bodies: [] };
    }
    expect([...candidates].every((tier) => tier >= 1 && tier <= 5)).toBe(true);
  });

  it("settles a floor item below the sleep threshold without bouncing out", () => {
    let game = stateWith([body(1, 3, 200, BOARD_HEIGHT - TIERS[2].radius, { vy: -5 })]);
    for (let index = 0; index < 600; index += 1) game = step(game, FIXED_STEP);
    expect(game.bodies[0].y + TIERS[2].radius).toBeLessThanOrEqual(BOARD_HEIGHT);
    expect(Math.hypot(game.bodies[0].vx, game.bodies[0].vy)).toBeLessThanOrEqual(8);
  });
});
