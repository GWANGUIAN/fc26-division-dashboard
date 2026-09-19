import { describe, expect, it } from "vitest";
import { moveSelection } from "./selection";

describe("moveSelection on the 4-column grid of 11 cards", () => {
  it("moves right/left/down/up inside the grid", () => {
    expect(moveSelection(0, 1, 0, 11)).toBe(1);
    expect(moveSelection(1, -1, 0, 11)).toBe(0);
    expect(moveSelection(1, 0, 1, 11)).toBe(5);
    expect(moveSelection(5, 0, -1, 11)).toBe(1);
  });

  it("stays put at the edges", () => {
    expect(moveSelection(0, -1, 0, 11)).toBe(0);
    expect(moveSelection(3, 1, 0, 11)).toBe(3);
    expect(moveSelection(2, 0, -1, 11)).toBe(2);
  });

  it("never lands on the empty slot after the last card", () => {
    expect(moveSelection(10, 1, 0, 11)).toBe(10);
    expect(moveSelection(7, 0, 1, 11)).toBe(7);
    expect(moveSelection(6, 0, 1, 11)).toBe(10);
  });
});
