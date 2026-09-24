// Layout and cursor movement of the character select grid (docs/pitch/03 §3). Pure functions, no canvas.

export const SELECT_GRID = { x: 320, y: 100, cols: 6, rows: 2, cardW: 96, cardH: 128, gap: 8 } as const;

export type GridDir = "left" | "right" | "up" | "down";

const rowCount = (count: number, cols: number) => Math.ceil(count / cols);
const rowLength = (row: number, count: number, cols: number) => Math.min(cols, count - row * cols);

/**
 * Moves the cursor one cell. Left/right wrap inside the row, up/down wrap between rows and keep the column
 * (clamped when the target row is shorter, so a partly filled last row never leaves the cursor in the air).
 */
export function moveCursor(index: number, dir: GridDir, count: number, cols: number = SELECT_GRID.cols): number {
  if (count <= 0) return 0;
  const at = Math.max(0, Math.min(count - 1, index));
  const row = Math.floor(at / cols);
  const col = at % cols;
  if (dir === "left" || dir === "right") {
    const length = rowLength(row, count, cols);
    return row * cols + ((col + (dir === "right" ? 1 : -1) + length) % length);
  }
  const rows = rowCount(count, cols);
  const nextRow = (row + (dir === "down" ? 1 : -1) + rows) % rows;
  return nextRow * cols + Math.min(col, rowLength(nextRow, count, cols) - 1);
}

/** Previous/next card in reading order (the arrow buttons), wrapping around. */
export function stepCursor(index: number, delta: number, count: number): number {
  if (count <= 0) return 0;
  return (((index + delta) % count) + count) % count;
}

export interface CardRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function cardRect(index: number): CardRect {
  const { x, y, cols, cardW, cardH, gap } = SELECT_GRID;
  return { x: x + (index % cols) * (cardW + gap), y: y + Math.floor(index / cols) * (cardH + gap), w: cardW, h: cardH };
}

/** Card under a logical point, or -1. The gaps between cards hit nothing. */
export function cardAt(px: number, py: number, count: number): number {
  for (let i = 0; i < count; i++) {
    const r = cardRect(i);
    if (px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h) return i;
  }
  return -1;
}
