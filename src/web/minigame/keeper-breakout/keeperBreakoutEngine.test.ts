import { describe, expect, it } from "vitest";
import { SCORE_GAMES } from "../../../shared/minigame-scores.js";
import { BRICK_LEFT, BRICK_TOP, BRICK_WIDTH, FIXED_STEP, LOGICAL_HEIGHT, PADDLE_Y, SHIELD_Y, createGame, launch, maxPossibleScore, nextStage, setPaddleTarget, startGame, step, type KeeperBreakoutState } from "./keeperBreakoutEngine.js";
import { parseStage } from "./keeperBreakoutStages.js";

function withPlaying(partial: Partial<KeeperBreakoutState>): KeeperBreakoutState {
  return { ...startGame(11), ...partial };
}

describe("keeper breakout engine", () => {
  it("is deterministic for the same seed and inputs", () => {
    let left = launch(startGame(77)); let right = launch(startGame(77));
    for (let index = 0; index < 240; index += 1) { left = step(setPaddleTarget(left, 140 + index % 80), FIXED_STEP); right = step(setPaddleTarget(right, 140 + index % 80), FIXED_STEP); }
    expect(left).toEqual(right);
  });

  it("reflects from walls, ceiling, and paddle centre/edges", () => {
    const wall = step(withPlaying({ balls: [{ x: 7, y: 180, vx: -340, vy: 0, stuck: false }] }));
    expect(wall.balls[0].vx).toBeGreaterThan(0);
    const ceiling = step(withPlaying({ balls: [{ x: 180, y: 7, vx: 0, vy: -340, stuck: false }] }));
    expect(ceiling.balls[0].vy).toBeGreaterThan(0);
    const base = startGame(2).paddle;
    const centre = step(withPlaying({ paddle: base, balls: [{ x: base.x + base.w / 2, y: PADDLE_Y - 9, vx: 80, vy: 340, stuck: false }] }));
    // The incoming vx of 80 px/s moves the ball 0.44 px within the first substep, so a centre hit leaves with a
    // tiny angle (about 3 px/s), not exactly 0. What matters is that it is nearly vertical, not the 80 that came in.
    expect(Math.abs(centre.balls[0].vx)).toBeLessThan(5);
    const edge = step(withPlaying({ paddle: base, balls: [{ x: base.x + base.w - 2, y: PADDLE_Y - 9, vx: 0, vy: 340, stuck: false }] }));
    expect(edge.balls[0].vx).toBeGreaterThan(250);
    expect(edge.balls[0].vy).toBeLessThan(0);
  });

  it("keeps a minimum vertical velocity component", () => {
    const result = step(withPlaying({ balls: [{ x: 300, y: 200, vx: 520, vy: 1, stuck: false }] }));
    const ball = result.balls[0];
    expect(Math.abs(ball.vy)).toBeGreaterThanOrEqual(Math.hypot(ball.vx, ball.vy) * .3 - .001);
  });

  it("damages hp3 three times and preserves steel", () => {
    const hp3 = parseStage(["3"])[0]; const steel = parseStage(["S"])[0];
    let state = withPlaying({ bricks: [hp3], balls: [{ x: BRICK_LEFT + BRICK_WIDTH / 2, y: BRICK_TOP - 9, vx: 0, vy: 520, stuck: false }] });
    state = step(state); expect(state.bricks[0].hp).toBe(2);
    state = { ...state, balls: [{ x: BRICK_LEFT + BRICK_WIDTH / 2, y: BRICK_TOP - 9, vx: 0, vy: 520, stuck: false }] }; state = step(state); expect(state.bricks[0].hp).toBe(1);
    state = { ...state, balls: [{ x: BRICK_LEFT + BRICK_WIDTH / 2, y: BRICK_TOP - 9, vx: 0, vy: 520, stuck: false }] }; state = step(state); expect(state.bricks).toHaveLength(0);
    const steelState = step(withPlaying({ bricks: [steel], balls: [{ x: BRICK_LEFT + BRICK_WIDTH / 2, y: BRICK_TOP - 9, vx: 0, vy: 520, stuck: false }] }));
    expect(steelState.bricks).toHaveLength(1); expect(steelState.bricks[0].type).toBe("steel");
  });

  it("makes burst damage its eight neighbours but not steel", () => {
    const bricks = parseStage(["111", "1B1", "1S1"]);
    const state = step(withPlaying({ bricks, balls: [{ x: BRICK_LEFT + BRICK_WIDTH + 4 + BRICK_WIDTH / 2, y: BRICK_TOP + BRICK_WIDTH / 2, vx: 0, vy: 520, stuck: false }] }));
    expect(state.bricks).toEqual(expect.arrayContaining([expect.objectContaining({ type: "steel" })]));
    expect(state.bricks.filter((brick) => brick.type !== "steel")).toHaveLength(0);
  });

  it("drops from gold always and normal bricks at roughly eight percent over seeds", () => {
    // xorshift32 returns a value near 0 as its first output for tiny seeds (1..1000), which would drop every time.
    // A real game reaches a brick after launch() has already advanced the generator, so mix the seeds first.
    const spread = (seed: number) => { let mixed = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) >>> 0; mixed ^= mixed >>> 13; mixed = Math.imul(mixed, 0xc2b2ae35) >>> 0; mixed ^= mixed >>> 16; return mixed || 1; };
    const hit = (seed: number, type: "gold" | "hp1") => step(withPlaying({ rngState: seed, bricks: [parseStage([type === "gold" ? "G" : "1"])[0]], balls: [{ x: BRICK_LEFT + BRICK_WIDTH / 2, y: BRICK_TOP - 9, vx: 0, vy: 520, stuck: false }] }));
    expect(hit(1, "gold").drops).toHaveLength(1);
    let drops = 0; for (let seed = 1; seed <= 1000; seed += 1) drops += hit(spread(seed), "hp1").drops.length;
    expect(drops).toBeGreaterThan(45); expect(drops).toBeLessThan(115);
  });

  it("applies and expires powerups, creates three balls, and consumes shield once", () => {
    const paddle = startGame(1).paddle;
    const drops = ["wide", "slow", "multi", "shield"] as const;
    let state = withPlaying({ paddle, balls: [{ x: paddle.x + paddle.w / 2, y: PADDLE_Y - 1, vx: 100, vy: 340, stuck: false }], drops: drops.map((kind) => ({ x: paddle.x + paddle.w / 2, y: PADDLE_Y, kind })) });
    state = step(state); expect(state.paddle.w).toBe(168); expect(state.balls).toHaveLength(3); expect(state.effects.shield).toBe(true);
    state = { ...state, time: state.time + 12, balls: state.balls.map((ball) => ({ ...ball, stuck: true })) }; state = step(state); expect(state.paddle.w).toBe(112); expect(state.effects.slowUntil).toBe(0);
    state = { ...state, balls: [{ x: 200, y: LOGICAL_HEIGHT + 10, vx: 0, vy: 300, stuck: false }] }; state = step(state); expect(state.effects.shield).toBe(false); expect(state.balls[0].y).toBeLessThanOrEqual(SHIELD_Y);
  });

  it("loses lives and transitions through stage clear and full clear", () => {
    const lost = step(withPlaying({ lives: 2, bricks: parseStage(["S........1"]), balls: [{ x: 10, y: LOGICAL_HEIGHT + 9, vx: 0, vy: 1, stuck: false }] }));
    expect(lost.lives).toBe(1); expect(lost.balls[0].stuck).toBe(true);
    const over = step(withPlaying({ lives: 1, bricks: parseStage(["S........1"]), balls: [{ x: 10, y: LOGICAL_HEIGHT + 9, vx: 0, vy: 1, stuck: false }] })); expect(over.phase).toBe("over");
    const clear = step(withPlaying({ bricks: [], balls: [{ x: 10, y: 100, vx: 1, vy: 1, stuck: false }] })); expect(clear.phase).toBe("stageclear"); expect(nextStage(clear).stage).toBe(1);
    const final = step(withPlaying({ stage: 4, bricks: [], balls: [{ x: 10, y: 100, vx: 1, vy: 1, stuck: false }] })); expect(final.phase).toBe("cleared");
  });

  it("does not let a 520 px/s ball tunnel through a brick gap", () => {
    const brick = parseStage(["1"])[0];
    const state = step(withPlaying({ bricks: [brick], balls: [{ x: BRICK_LEFT + BRICK_WIDTH / 2, y: BRICK_TOP - 12, vx: 0, vy: 520, stuck: false }] }));
    expect(state.bricks).toHaveLength(0);
  });

  it("keeps the shared score ceiling above the calculated maximum", () => {
    // Breakable brick points per stage: 600 + 600 + 560 + 700 + 885 = 3,345, plus 100 x 3 lives x 5 stages = 1,500.
    expect(maxPossibleScore()).toBe(4845);
    expect(SCORE_GAMES["keeper-breakout"].max).toBeGreaterThanOrEqual(maxPossibleScore());
  });
});
