import { describe, expect, it } from "vitest";
import { cardAt, cardRect, moveCursor, stepCursor } from "../scenes/selectGrid";

describe("select grid cursor (6×2)", () => {
  it("moves left/right inside a row and wraps at the row ends", () => {
    expect(moveCursor(0, "right", 12)).toBe(1);
    expect(moveCursor(5, "right", 12)).toBe(0);
    expect(moveCursor(0, "left", 12)).toBe(5);
    expect(moveCursor(6, "left", 12)).toBe(11);
    expect(moveCursor(11, "right", 12)).toBe(6);
  });

  it("moves up/down between the two rows keeping the column", () => {
    expect(moveCursor(2, "down", 12)).toBe(8);
    expect(moveCursor(8, "down", 12)).toBe(2);
    expect(moveCursor(8, "up", 12)).toBe(2);
    expect(moveCursor(2, "up", 12)).toBe(8);
  });

  it("clamps the column when the target row is shorter", () => {
    // 8 cards: row 1 has only 2
    expect(moveCursor(5, "down", 8)).toBe(7);
    expect(moveCursor(7, "right", 8)).toBe(6);
    expect(moveCursor(6, "left", 8)).toBe(7);
  });

  it("steps through reading order for the arrow buttons", () => {
    expect(stepCursor(11, 1, 12)).toBe(0);
    expect(stepCursor(0, -1, 12)).toBe(11);
    expect(stepCursor(3, 1, 12)).toBe(4);
  });

  it("lays cards out at (320,100) with 96×128 cards and an 8px gap", () => {
    expect(cardRect(0)).toEqual({ x: 320, y: 100, w: 96, h: 128 });
    expect(cardRect(5)).toEqual({ x: 320 + 5 * 104, y: 100, w: 96, h: 128 });
    expect(cardRect(6)).toEqual({ x: 320, y: 236, w: 96, h: 128 });
  });

  it("hit-tests cards and ignores the gaps", () => {
    expect(cardAt(330, 110, 12)).toBe(0);
    expect(cardAt(320 + 104 * 5 + 50, 236 + 60, 12)).toBe(11);
    expect(cardAt(416 + 2, 110, 12)).toBe(-1); // gap between card 0 and 1
    expect(cardAt(100, 110, 12)).toBe(-1);
  });
});
