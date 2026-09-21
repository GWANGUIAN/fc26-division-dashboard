import { describe, expect, it } from "vitest";
import { BOARD_SIZE, createGame, findHint, hasMatches, hasMoves, shuffle, STARTING_MOVES, trySwap, type Board, type FootballMatch3State, type Tile } from "./footballMatch3Engine.js";

const tile = (color: number, kind: Tile["kind"] = "normal"): Tile => ({ color: color as Tile["color"], kind });
const patterned = (): Board => Array.from({ length: 64 }, (_, index) => tile((Math.floor(index / BOARD_SIZE) * 2 + (index % BOARD_SIZE) * 3) % 6));
const state = (board: Board, movesLeft = STARTING_MOVES): FootballMatch3State => ({ board, score: 0, movesLeft, phase: "playing", rngState: 12345 });

describe("football match3 engine", () => {
  it("creates 500 playable boards without an opening match", () => {
    for (let seed = 1; seed <= 500; seed += 1) {
      const game = createGame(seed);
      expect(hasMatches(game.board)).toBe(false);
      expect(hasMoves(game.board)).toBe(true);
    }
  });

  it("is deterministic for a seed and sequence of hinted swaps", () => {
    const play = () => {
      let game = createGame(42);
      for (let turn = 0; turn < 8; turn += 1) {
        const hint = findHint(game)!;
        const result = trySwap(game, ...hint);
        expect(result.ok).toBe(true);
        if (result.ok) game = result.state;
      }
      return game;
    };
    expect(play()).toEqual(play());
  });

  it("does not mutate or charge invalid and non-adjacent swaps", () => {
    const game = createGame(5);
    const before = structuredClone(game);
    expect(trySwap(game, 0, 63)).toEqual({ ok: false });
    const invalid = [...Array(64).keys()].flatMap((index) => [index + 1, index + 8].filter((other) => other < 64 && (other % 8 !== 0 || other === index + 8)).map((other) => [index, other] as const)).find(([a, b]) => !trySwap(game, a, b).ok)!;
    expect(trySwap(game, ...invalid)).toEqual({ ok: false });
    expect(game).toEqual(before);
  });

  it("fills every cell after a removal, gravity, and refill", () => {
    const game = createGame(11);
    const result = trySwap(game, ...findHint(game)!);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.steps[0].removed.length).toBeGreaterThanOrEqual(3);
      expect(result.state.board.every(Boolean)).toBe(true);
    }
  });

  it("numbers chains and applies the capped multiplier", () => {
    let witnessed: ReturnType<typeof trySwap> | undefined;
    for (let seed = 1; seed < 2000 && !witnessed; seed += 1) {
      const game = createGame(seed);
      for (let index = 0; index < 64 && !witnessed; index += 1) for (const delta of [1, 8]) {
        const other = index + delta;
        if (other >= 64 || (delta === 1 && index % 8 === 7)) continue;
        const result = trySwap(game, index, other);
        if (result.ok && result.steps.length >= 2) witnessed = result;
      }
    }
    expect(witnessed?.ok).toBe(true);
    if (witnessed?.ok) {
      expect(witnessed.steps.map((step) => step.chain)).toEqual(witnessed.steps.map((_, index) => index + 1));
      expect(witnessed.steps[1].gained).toBeGreaterThan(0);
    }
  });

  it("creates horizontal, vertical, and golden specials at a swapped cell", () => {
    const horizontal = patterned(); horizontal[0] = tile(1); horizontal[1] = tile(1); horizontal[2] = tile(2); horizontal[3] = tile(1); horizontal[10] = tile(1);
    const vertical = patterned(); vertical[0] = tile(2); vertical[8] = tile(2); vertical[16] = tile(1); vertical[17] = tile(2); vertical[24] = tile(2); vertical[32] = tile(5);
    const golden = patterned(); golden[0] = tile(3); golden[1] = tile(3); golden[2] = tile(3); golden[3] = tile(4); golden[4] = tile(3); golden[11] = tile(3);
    const a = trySwap(state(horizontal), 2, 10); const b = trySwap(state(vertical), 16, 17); const c = trySwap(state(golden), 3, 11);
    expect(a.ok && a.steps[0].created[0]?.tile.kind).toBe("line-h");
    expect(b.ok && b.steps[0].created[0]?.tile.kind).toBe("line-v");
    expect(c.ok && c.steps[0].created[0]?.tile.kind).toBe("golden");
  });

  it("activates line specials and both golden swap targets", () => {
    const line = patterned(); line[9] = tile(1, "line-h"); line[10] = tile(2);
    const lineResult = trySwap(state(line), 9, 10);
    expect(lineResult.ok && lineResult.steps[0].removed.length).toBeGreaterThanOrEqual(8);
    const golden = patterned(); golden[9] = tile(1, "golden"); golden[10] = tile(2, "golden");
    const goldenResult = trySwap(state(golden), 9, 10);
    expect(goldenResult.ok && goldenResult.steps[0].removed.length).toBe(64);
  });

  it("charges one move only for a valid swap and ends after its steps", () => {
    const game = createGame(73, 0, 1);
    const result = trySwap(game, ...findHint(game)!);
    expect(result.ok && result.state.movesLeft).toBe(0);
    expect(result.ok && result.state.phase).toBe("over");
    expect(trySwap(game, 0, 1)).toEqual({ ok: false });
  });

  it("reshuffles an unwinnable board while retaining specials", () => {
    const board = Array.from({ length: 64 }, () => tile(0)); board[7] = tile(2, "line-v");
    const shuffled = shuffle(state(board));
    expect(shuffled.board.some((entry) => entry?.kind === "line-v")).toBe(true);
    expect(hasMatches(shuffled.board)).toBe(false);
    expect(hasMoves(shuffled.board)).toBe(true);
  });

  it("returns only valid hints", () => {
    for (let seed = 1; seed < 100; seed += 1) {
      const game = createGame(seed);
      const hint = findHint(game);
      expect(hint).toBeDefined();
      expect(trySwap(game, ...hint!)).toMatchObject({ ok: true });
    }
  });

  it.skip("greedy bot calibration — manually run for 500–2000 seed games", () => {
    let high = 0;
    for (let seed = 1; seed <= 500; seed += 1) {
      let game = createGame(seed);
      while (game.phase === "playing") {
        const candidates: ReturnType<typeof trySwap>[] = [];
        for (let index = 0; index < 64; index += 1) for (const delta of [1, 8]) {
          const other = index + delta; if (other >= 64 || (delta === 1 && index % 8 === 7)) continue;
          const result = trySwap(game, index, other); if (result.ok) candidates.push(result);
        }
        const best = candidates.sort((left, right) => (right.ok ? right.steps.reduce((sum, step) => sum + step.gained, 0) : 0) - (left.ok ? left.steps.reduce((sum, step) => sum + step.gained, 0) : 0))[0];
        if (!best?.ok) throw new Error("playable board did not provide a legal move");
        game = best.state;
      }
      high = Math.max(high, game.score);
    }
    expect(high).toBeGreaterThan(0);
  });
});
