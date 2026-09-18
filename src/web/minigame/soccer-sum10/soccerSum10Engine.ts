export const GRID_COLUMNS = 17;
export const GRID_ROWS = 10;
export const EXPECTED_BALL_COUNT = GRID_COLUMNS * GRID_ROWS;

export interface SoccerSum10Cell {
  id: string;
  row: number;
  column: number;
  value: number;
  removed: boolean;
}

export interface GridBounds {
  startRow: number;
  endRow: number;
  startColumn: number;
  endColumn: number;
}

export interface SoccerSum10Board {
  cells: SoccerSum10Cell[];
  /** Every initial board carries a known sequence of rectangles that clears it completely. */
  solutionGroups: string[][];
}

function key(row: number, column: number) {
  return `${row}-${column}`;
}

function horizontal(row: number, startColumn: number, length: number) {
  return Array.from({ length }, (_, offset) => [row, startColumn + offset] as const);
}

/** Every 17-cell row is partitioned into five triples and one pair.  Each group sums to ten,
 * so all 170 balls are present while every fresh board still has a full-clear solution. */
const GROUP_COORDINATES = Array.from({ length: GRID_ROWS }, (_, row) => [
  horizontal(row, 0, 3),
  horizontal(row, 3, 3),
  horizontal(row, 6, 3),
  horizontal(row, 9, 3),
  horizontal(row, 12, 3),
  horizontal(row, 15, 2),
]).flat();

function randomPair(rng: () => number): number[] {
  const first = 1 + Math.floor(rng() * 9);
  return rng() < 0.5 ? [first, 10 - first] : [10 - first, first];
}

function randomTriple(rng: () => number): number[] {
  const triples: number[][] = [];
  for (let first = 1; first <= 8; first += 1) {
    for (let second = 1; second <= 9 - first; second += 1) {
      const third = 10 - first - second;
      if (third >= 1 && third <= 9) triples.push([first, second, third]);
    }
  }
  const values = [...triples[Math.floor(rng() * triples.length)]];
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1));
    [values[index], values[swap]] = [values[swap], values[index]];
  }
  return values;
}

export function normalizeBounds(a: { row: number; column: number }, b: { row: number; column: number }): GridBounds {
  return {
    startRow: Math.min(a.row, b.row),
    endRow: Math.max(a.row, b.row),
    startColumn: Math.min(a.column, b.column),
    endColumn: Math.max(a.column, b.column),
  };
}

export function cellsInBounds(board: SoccerSum10Board, bounds: GridBounds) {
  return board.cells.filter(
    (cell) =>
      !cell.removed &&
      cell.row >= bounds.startRow &&
      cell.row <= bounds.endRow &&
      cell.column >= bounds.startColumn &&
      cell.column <= bounds.endColumn,
  );
}

export function selectionSum(board: SoccerSum10Board, bounds: GridBounds) {
  return cellsInBounds(board, bounds).reduce((sum, cell) => sum + cell.value, 0);
}

export function clearSelection(board: SoccerSum10Board, bounds: GridBounds): SoccerSum10Board | null {
  const selected = cellsInBounds(board, bounds);
  if (selected.length === 0 || selected.reduce((sum, cell) => sum + cell.value, 0) !== 10) return null;
  const selectedIds = new Set(selected.map((cell) => cell.id));
  return {
    ...board,
    cells: board.cells.map((cell) => (selectedIds.has(cell.id) ? { ...cell, removed: true } : cell)),
  };
}

export function isBoardCleared(board: SoccerSum10Board) {
  return board.cells.every((cell) => cell.removed);
}

export function createSoccerSum10Board(rng: () => number = Math.random): SoccerSum10Board {
  const cells: SoccerSum10Cell[] = [];
  const solutionGroups: string[][] = [];
  const used = new Set<string>();

  GROUP_COORDINATES.forEach((coordinates) => {
    const values = coordinates.length === 2 ? randomPair(rng) : randomTriple(rng);
    const group: string[] = [];
    coordinates.forEach(([row, column], index) => {
      const id = key(row, column);
      if (used.has(id)) throw new Error(`Duplicate soccer-sum10 cell: ${id}`);
      used.add(id);
      group.push(id);
      cells.push({ id, row, column, value: values[index], removed: false });
    });
    solutionGroups.push(group);
  });

  if (cells.length !== EXPECTED_BALL_COUNT) throw new Error(`Expected ${EXPECTED_BALL_COUNT} balls, got ${cells.length}`);
  return { cells, solutionGroups };
}

/** Tests and development diagnostics use this to prove that every intended group is selectable. */
export function boundsForGroup(cells: SoccerSum10Cell[]): GridBounds {
  return {
    startRow: Math.min(...cells.map((cell) => cell.row)),
    endRow: Math.max(...cells.map((cell) => cell.row)),
    startColumn: Math.min(...cells.map((cell) => cell.column)),
    endColumn: Math.max(...cells.map((cell) => cell.column)),
  };
}
