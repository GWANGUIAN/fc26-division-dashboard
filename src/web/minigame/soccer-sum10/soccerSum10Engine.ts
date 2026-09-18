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

type Coordinate = readonly [number, number];

/**
 * Builds a fresh tiling for each round instead of giving every row the same horizontal 3+3+…
 * answer.  Squares are deliberately favored, then vertical bars, so scanning horizontally no
 * longer reveals the solution; the backtracker still leaves a mathematically valid full-clear
 * route in every board.
 */
function createGroupCoordinates(rng: () => number): Coordinate[][] {
  const occupied = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLUMNS).fill(false));
  const groups: Coordinate[][] = [];

  const candidatesAt = (row: number, column: number) => {
    const candidates: { cells: Coordinate[]; bias: number }[] = [];
    const canPlace = (height: number, width: number) =>
      row + height <= GRID_ROWS &&
      column + width <= GRID_COLUMNS &&
      Array.from({ length: height }, (_, r) =>
        Array.from({ length: width }, (_, c) => !occupied[row + r][column + c]).every(Boolean),
      ).every(Boolean);
    const rectangle = (height: number, width: number) =>
      Array.from({ length: height }, (_, r) =>
        Array.from({ length: width }, (_, c) => [row + r, column + c] as Coordinate),
      ).flat();

    if (canPlace(2, 2)) candidates.push({ cells: rectangle(2, 2), bias: -0.75 });
    if (canPlace(3, 1)) candidates.push({ cells: rectangle(3, 1), bias: -0.35 });
    if (canPlace(2, 1)) candidates.push({ cells: rectangle(2, 1), bias: -0.15 });
    if (canPlace(1, 3)) candidates.push({ cells: rectangle(1, 3), bias: 0.18 });
    if (canPlace(1, 2)) candidates.push({ cells: rectangle(1, 2), bias: 0.28 });
    return candidates.sort((a, b) => a.bias + rng() - (b.bias + rng()));
  };

  const fill = (): boolean => {
    let start: Coordinate | null = null;
    for (let row = 0; row < GRID_ROWS && !start; row += 1) {
      for (let column = 0; column < GRID_COLUMNS; column += 1) {
        if (!occupied[row][column]) {
          start = [row, column];
          break;
        }
      }
    }
    if (!start) return true;
    const [row, column] = start;
    for (const candidate of candidatesAt(row, column)) {
      candidate.cells.forEach(([r, c]) => { occupied[r][c] = true; });
      groups.push(candidate.cells);
      if (fill()) return true;
      groups.pop();
      candidate.cells.forEach(([r, c]) => { occupied[r][c] = false; });
    }
    return false;
  };

  if (!fill()) throw new Error("Could not tile soccer-sum10 board");
  return groups;
}

function randomValues(groupSize: number, rng: () => number): number[] {
  const values: number[] = [];
  let remaining = 10;
  for (let index = 0; index < groupSize - 1; index += 1) {
    const slotsAfter = groupSize - index - 1;
    const max = Math.min(9, remaining - slotsAfter);
    const next = 1 + Math.floor(rng() * max);
    values.push(next);
    remaining -= next;
  }
  values.push(remaining);
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

  createGroupCoordinates(rng).forEach((coordinates) => {
    const values = randomValues(coordinates.length, rng);
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
