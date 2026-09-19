/** Index after moving dx/dy on the 4-column character-select grid; stays put at the edges and never lands past the last card. */
export function moveSelection(index: number, dx: number, dy: number, count: number, columns = 4): number {
  const col = index % columns;
  const row = Math.floor(index / columns);
  const nextCol = col + dx;
  const nextRow = row + dy;
  if (nextCol < 0 || nextCol >= columns || nextRow < 0) return index;
  const next = nextRow * columns + nextCol;
  return next < count ? next : index;
}
