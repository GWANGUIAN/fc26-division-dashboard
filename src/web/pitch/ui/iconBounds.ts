// Inventory icons are cut from item / pet atlas cells whose art is anchored (hats sit on the cell bottom, back items
// hang from the cell top, pets stand on a ground line), so centring the whole cell would not centre the art. This
// finds the opaque bounding box of a cell once and caches it; without a canvas (tests) it falls back to the full cell.

export interface CellBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

const ALPHA_MIN = 24;
const cache = new WeakMap<object, Map<string, CellBounds>>();

/** Opaque bounds of the cell (sx, sy, cw, ch) of `image`, in cell-local px. */
export function cellBounds(image: CanvasImageSource & { width: number; height: number }, sx: number, sy: number, cw: number, ch: number): CellBounds {
  const full: CellBounds = { x: 0, y: 0, w: cw, h: ch };
  const key = `${sx},${sy},${cw},${ch}`;
  let perImage = cache.get(image);
  const known = perImage?.get(key);
  if (known) return known;
  let bounds = full;
  try {
    if (typeof document !== "undefined") {
      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      const g = canvas.getContext("2d", { willReadFrequently: true });
      if (g) {
        g.drawImage(image, sx, sy, cw, ch, 0, 0, cw, ch);
        const data = g.getImageData(0, 0, cw, ch).data;
        let x0 = cw;
        let y0 = ch;
        let x1 = -1;
        let y1 = -1;
        for (let y = 0; y < ch; y++) {
          for (let x = 0; x < cw; x++) {
            if (data[(y * cw + x) * 4 + 3] >= ALPHA_MIN) {
              if (x < x0) x0 = x;
              if (x > x1) x1 = x;
              if (y < y0) y0 = y;
              if (y > y1) y1 = y;
            }
          }
        }
        if (x1 >= 0) bounds = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
      }
    }
  } catch {
    bounds = full;
  }
  if (!perImage) {
    perImage = new Map();
    cache.set(image, perImage);
  }
  perImage.set(key, bounds);
  return bounds;
}

/** Scale that fits `bounds` into a `box`×`box` square: whole numbers (crisp pixels) when it is at least 1, else the exact ratio. */
export function iconScale(bounds: CellBounds, box: number): number {
  const fit = Math.min(box / bounds.w, box / bounds.h);
  return fit >= 1 ? Math.min(2, Math.floor(fit)) : fit;
}
