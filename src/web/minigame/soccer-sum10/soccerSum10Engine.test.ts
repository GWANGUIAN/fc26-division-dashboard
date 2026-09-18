import { describe, expect, it } from "vitest";
import {
  EXPECTED_BALL_COUNT,
  boundsForGroup,
  cellsInBounds,
  clearSelection,
  createSoccerSum10Board,
  isBoardCleared,
  selectionSum,
} from "./soccerSum10Engine.js";

describe("soccer sum10 board", () => {
  it("fills the 17 by 10 board and only uses numbers one through nine", () => {
    const board = createSoccerSum10Board(() => 0.42);
    expect(board.cells).toHaveLength(EXPECTED_BALL_COUNT);
    expect(board.cells.every((cell) => cell.value >= 1 && cell.value <= 9)).toBe(true);
    expect(new Set(board.cells.map((cell) => cell.id)).size).toBe(EXPECTED_BALL_COUNT);
  });

  it("has a complete sequence of exact ten selections", () => {
    let board = createSoccerSum10Board(() => 0.37);
    for (const ids of board.solutionGroups) {
      const group = board.cells.filter((cell) => ids.includes(cell.id));
      const bounds = boundsForGroup(group);
      expect(cellsInBounds(board, bounds).map((cell) => cell.id).sort()).toEqual([...ids].sort());
      expect(selectionSum(board, bounds)).toBe(10);
      board = clearSelection(board, bounds)!;
    }
    expect(isBoardCleared(board)).toBe(true);
  });

  it("leaves the board intact for a selection whose sum is not ten", () => {
    const board = createSoccerSum10Board(() => 0.37);
    const firstCell = board.cells[0];
    const result = clearSelection(board, {
      startRow: firstCell.row,
      endRow: firstCell.row,
      startColumn: firstCell.column,
      endColumn: firstCell.column,
    });
    expect(result).toBeNull();
  });
});
