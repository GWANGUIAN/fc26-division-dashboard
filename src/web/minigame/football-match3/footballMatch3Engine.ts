export const BOARD_SIZE = 8;
export const TILE_COUNT = 6;
export const STARTING_MOVES = 30;

export type TileColor = 0 | 1 | 2 | 3 | 4 | 5;
export type TileKind = "normal" | "line-h" | "line-v" | "golden";
export interface Tile { color: TileColor; kind: TileKind }
export type Board = (Tile | null)[];
export interface Step {
  swapped?: [number, number];
  removed: number[];
  created: { index: number; tile: Tile }[];
  fall: { from: number; to: number }[];
  spawn: { index: number; tile: Tile }[];
  gained: number;
  chain: number;
}
export interface FootballMatch3State { board: Board; score: number; movesLeft: number; phase: "playing" | "over"; rngState: number }
export type SwapResult = { ok: false } | { ok: true; steps: Step[]; shuffled: boolean; state: FootballMatch3State };

const indexOf = (row: number, column: number) => row * BOARD_SIZE + column;
const rowOf = (index: number) => Math.floor(index / BOARD_SIZE);
const colOf = (index: number) => index % BOARD_SIZE;
const isAdjacent = (a: number, b: number) => a >= 0 && b >= 0 && a < 64 && b < 64 && Math.abs(rowOf(a) - rowOf(b)) + Math.abs(colOf(a) - colOf(b)) === 1;
const copyTile = (tile: Tile | null) => tile && { ...tile };
const cloneBoard = (board: Board) => board.map(copyTile);
const normal = (color: number): Tile => ({ color: color as TileColor, kind: "normal" });

/** xorshift32: state is part of the engine state, so no ambient randomness is needed. */
export function nextRandom(rngState: number): [number, number] {
  let value = rngState || 0x6d2b79f5;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return [value | 0, (value >>> 0) / 0x1_0000_0000];
}

function randomColor(rng: number): [number, TileColor] {
  const [next, value] = nextRandom(rng);
  return [next, Math.floor(value * TILE_COUNT) as TileColor];
}

interface Run { cells: number[]; orientation: "h" | "v" }
function runs(board: Board): Run[] {
  const result: Run[] = [];
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    let start = 0;
    while (start < BOARD_SIZE) {
      const tile = board[indexOf(row, start)];
      let end = start + 1;
      while (tile && tile.kind !== "golden" && end < BOARD_SIZE && board[indexOf(row, end)]?.kind !== "golden" && board[indexOf(row, end)]?.color === tile.color) end += 1;
      if (tile && tile.kind !== "golden" && end - start >= 3) result.push({ orientation: "h", cells: Array.from({ length: end - start }, (_, offset) => indexOf(row, start + offset)) });
      start = end;
    }
  }
  for (let column = 0; column < BOARD_SIZE; column += 1) {
    let start = 0;
    while (start < BOARD_SIZE) {
      const tile = board[indexOf(start, column)];
      let end = start + 1;
      while (tile && tile.kind !== "golden" && end < BOARD_SIZE && board[indexOf(end, column)]?.kind !== "golden" && board[indexOf(end, column)]?.color === tile.color) end += 1;
      if (tile && tile.kind !== "golden" && end - start >= 3) result.push({ orientation: "v", cells: Array.from({ length: end - start }, (_, offset) => indexOf(start + offset, column)) });
      start = end;
    }
  }
  return result;
}

export function hasMatches(board: Board) { return runs(board).length > 0; }

function expandSpecials(board: Board, initial: Set<number>, goldenTarget?: TileColor): { removed: Set<number>; specialCount: number } {
  const removed = new Set(initial);
  let specialCount = 0;
  let changed = true;
  while (changed) {
    changed = false;
    for (const index of [...removed]) {
      const tile = board[index];
      if (!tile || tile.kind === "normal") continue;
      // Marking a special as normal after it expands prevents counting it repeatedly.
      board[index] = { ...tile, kind: "normal" };
      specialCount += 1;
      if (tile.kind === "line-h") {
        for (let column = 0; column < BOARD_SIZE; column += 1) { const target = indexOf(rowOf(index), column); if (!removed.has(target)) { removed.add(target); changed = true; } }
      } else if (tile.kind === "line-v") {
        for (let row = 0; row < BOARD_SIZE; row += 1) { const target = indexOf(row, colOf(index)); if (!removed.has(target)) { removed.add(target); changed = true; } }
      } else {
        const targetColor = goldenTarget ?? tile.color;
        for (let candidate = 0; candidate < 64; candidate += 1) if (board[candidate]?.color === targetColor && !removed.has(candidate)) { removed.add(candidate); changed = true; }
      }
    }
  }
  return { removed, specialCount };
}

function specialFor(runsHere: Run[], preferred: number | undefined): { index: number; tile: Tile; bonus: number } | undefined {
  const intersections = new Set<number>();
  for (const run of runsHere) for (const cell of run.cells) if (runsHere.some((other) => other !== run && other.cells.includes(cell))) intersections.add(cell);
  const eligible = runsHere.filter((run) => run.cells.length >= 4 && !run.cells.some((cell) => intersections.has(cell)));
  if (!eligible.length) return undefined;
  const run = eligible.sort((a, b) => b.cells.length - a.cells.length)[0];
  const index = preferred !== undefined && run.cells.includes(preferred) ? preferred : run.cells[Math.floor(run.cells.length / 2)];
  return { index, tile: { color: 0 as TileColor, kind: run.cells.length >= 5 ? "golden" : run.orientation === "h" ? "line-h" : "line-v" }, bonus: run.cells.length >= 5 ? 50 : 20 };
}

function tileAtRun(board: Board, run: Run): Tile { return board[run.cells[0]]!; }

function collapse(board: Board, rngState: number) {
  const next = cloneBoard(board);
  const fall: Step["fall"] = [];
  const spawn: Step["spawn"] = [];
  let rng = rngState;
  for (let column = 0; column < BOARD_SIZE; column += 1) {
    let write = BOARD_SIZE - 1;
    for (let row = BOARD_SIZE - 1; row >= 0; row -= 1) {
      const from = indexOf(row, column);
      if (!next[from]) continue;
      const to = indexOf(write, column);
      if (from !== to) { next[to] = next[from]; next[from] = null; fall.push({ from, to }); }
      write -= 1;
    }
    while (write >= 0) {
      const target = indexOf(write, column);
      const [nextRng, color] = randomColor(rng); rng = nextRng;
      const tile = normal(color);
      next[target] = tile;
      spawn.push({ index: target, tile: { ...tile } });
      write -= 1;
    }
  }
  return { board: next, fall, spawn, rngState: rng };
}

function boardWithSwap(board: Board, a: number, b: number) { const next = cloneBoard(board); [next[a], next[b]] = [next[b], next[a]]; return next; }

function validSpecialSwap(board: Board, a: number, b: number) { return board[a]?.kind !== "normal" || board[b]?.kind !== "normal"; }

export function trySwap(state: FootballMatch3State, a: number, b: number): SwapResult {
  if (state.phase !== "playing" || !isAdjacent(a, b) || !state.board[a] || !state.board[b]) return { ok: false };
  let board = boardWithSwap(state.board, a, b);
  const firstRuns = runs(board);
  const specialSwap = validSpecialSwap(state.board, a, b);
  if (!firstRuns.length && !specialSwap) return { ok: false };
  const steps: Step[] = [];
  let score = state.score;
  let rng = state.rngState;
  let chain = 1;
  let pendingRuns = firstRuns;
  let specialInitial = new Set<number>();
  if (specialSwap) { specialInitial.add(a); specialInitial.add(b); }
  while (pendingRuns.length || specialInitial.size) {
    const working = cloneBoard(board);
    const matchCells = new Set(pendingRuns.flatMap((run) => run.cells));
    for (const cell of specialInitial) matchCells.add(cell);
    const createdDefinition = pendingRuns.length ? specialFor(pendingRuns, chain === 1 ? b : undefined) : undefined;
    if (createdDefinition) {
      const sourceRun = pendingRuns.find((run) => run.cells.includes(createdDefinition.index))!;
      createdDefinition.tile.color = tileAtRun(board, sourceRun).color;
      matchCells.delete(createdDefinition.index);
    }
    let goldenTarget: TileColor | undefined;
    if (chain === 1 && specialSwap) {
      const golden = state.board[a]?.kind === "golden" ? a : state.board[b]?.kind === "golden" ? b : undefined;
      if (golden !== undefined) {
        const other = golden === a ? state.board[b]! : state.board[a]!;
        goldenTarget = other.kind === "golden" ? undefined : other.color;
        if (other.kind === "golden") for (let cell = 0; cell < 64; cell += 1) matchCells.add(cell);
      }
    }
    const expanded = expandSpecials(working, matchCells, goldenTarget);
    const removed = [...expanded.removed].filter((cell) => cell !== createdDefinition?.index).sort((left, right) => left - right);
    for (const cell of removed) board[cell] = null;
    const created = createdDefinition ? [{ index: createdDefinition.index, tile: { ...createdDefinition.tile } }] : [];
    if (createdDefinition) board[createdDefinition.index] = { ...createdDefinition.tile };
    const collapsed = collapse(board, rng); board = collapsed.board; rng = collapsed.rngState;
    const base = removed.length * 10 + (createdDefinition?.bonus ?? 0) + expanded.specialCount * 10;
    const multiplier = Math.min(3, 1 + .5 * (chain - 1));
    const gained = Math.round(base * multiplier);
    score += gained;
    steps.push({ ...(chain === 1 ? { swapped: [a, b] as [number, number] } : {}), removed, created, fall: collapsed.fall, spawn: collapsed.spawn, gained, chain });
    pendingRuns = runs(board);
    specialInitial = new Set();
    chain += 1;
  }
  let shuffled = false;
  if (!hasMoves(board)) { const result = shuffle({ ...state, board, score, movesLeft: state.movesLeft - 1, rngState: rng, phase: state.movesLeft <= 1 ? "over" : "playing" }); board = result.board; rng = result.rngState; shuffled = true; }
  const movesLeft = state.movesLeft - 1;
  return { ok: true, steps, shuffled, state: { board, score, movesLeft, phase: movesLeft === 0 ? "over" : "playing", rngState: rng } };
}

export function findHint(state: Pick<FootballMatch3State, "board" | "phase">): [number, number] | undefined {
  if (state.phase !== "playing") return undefined;
  for (let index = 0; index < 64; index += 1) for (const offset of [1, BOARD_SIZE]) {
    const other = index + offset;
    if ((offset === 1 && colOf(index) === BOARD_SIZE - 1) || other >= 64) continue;
    const swapped = boardWithSwap(state.board, index, other);
    if (runs(swapped).length || validSpecialSwap(state.board, index, other)) return [index, other];
  }
  return undefined;
}

export function hasMoves(board: Board) { return findHint({ board, phase: "playing" }) !== undefined; }

export function shuffle(state: FootballMatch3State): FootballMatch3State {
  const specials = state.board.filter((tile): tile is Tile => !!tile && tile.kind !== "normal").map((tile) => ({ ...tile }));
  let rng = state.rngState;
  for (let attempt = 0; attempt < 128; attempt += 1) {
    const board: Board = Array(64).fill(null);
    for (let index = 0; index < 64; index += 1) {
      const [next, color] = randomColor(rng); rng = next;
      board[index] = normal(color);
    }
    // Preserve specials, but put them in deterministic random slots after forming a playable normal board.
    for (const special of specials) { const [next, value] = nextRandom(rng); rng = next; board[Math.floor(value * 64)] = special; }
    if (!hasMatches(board) && hasMoves(board)) return { ...state, board, rngState: rng };
  }
  // A fresh normal board is preferable to an unwinnable game; the loop above makes this unreachable in practice.
  return createGame(rng, state.score, state.movesLeft);
}

export function createGame(seed: number, score = 0, movesLeft = STARTING_MOVES): FootballMatch3State {
  let rng = seed || 1;
  for (let attempt = 0; attempt < 128; attempt += 1) {
    const board: Board = Array(64).fill(null);
    for (let row = 0; row < BOARD_SIZE; row += 1) for (let column = 0; column < BOARD_SIZE; column += 1) {
      let color: TileColor;
      do { const result = randomColor(rng); rng = result[0]; color = result[1]; }
      while ((column >= 2 && board[indexOf(row, column - 1)]?.color === color && board[indexOf(row, column - 2)]?.color === color) || (row >= 2 && board[indexOf(row - 1, column)]?.color === color && board[indexOf(row - 2, column)]?.color === color));
      board[indexOf(row, column)] = normal(color);
    }
    if (hasMoves(board)) return { board, score, movesLeft, phase: movesLeft > 0 ? "playing" : "over", rngState: rng };
  }
  return { board: Array.from({ length: 64 }, (_, index) => normal(index % TILE_COUNT)), score, movesLeft, phase: movesLeft > 0 ? "playing" : "over", rngState: rng };
}
