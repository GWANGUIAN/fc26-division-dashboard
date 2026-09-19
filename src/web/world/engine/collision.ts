import type { Rect } from "../types";

// Pure AABB collision for the world (docs/world/01 §6). Rects are top-left based, in world pixels.

/** Strict overlap: rects that merely touch along an edge do not collide, so sliding along a wall works. */
export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** The character's collision box: `w`×`h` centred on the feet position, ending at the feet. */
export function footBox(x: number, y: number, w = 20, h = 10): Rect {
  return { x: x - w / 2, y: y - h, w, h };
}

/** Anything that can list the obstacles near a region (a spatial hash, or a hash plus moving entities). */
export interface ObstacleSource {
  query(region: Rect): readonly Rect[];
}

/** Adds loose rects (other characters) to an obstacle source, testing only those near the queried region. */
export function composeObstacles(base: ObstacleSource, extras: readonly Rect[]): ObstacleSource {
  return {
    query(region) {
      const near = extras.filter((rect) => rectsOverlap(rect, region));
      return near.length === 0 ? base.query(region) : [...base.query(region), ...near];
    },
  };
}

/** Uniform-grid spatial hash so a move only tests the few obstacles near it. */
export class SpatialHash implements ObstacleSource {
  private cells = new Map<number, number[]>();
  private rects: Rect[] = [];

  constructor(private readonly cellSize = 64) {}

  get size() {
    return this.rects.length;
  }

  clear() {
    this.cells.clear();
    this.rects = [];
  }

  private key(cx: number, cy: number) {
    // Offset keeps negative cells distinct; 20 bits per axis is far more than any map needs.
    return (cx + 0x8000) * 0x10000 + (cy + 0x8000);
  }

  insert(rect: Rect) {
    const index = this.rects.push(rect) - 1;
    const { x0, y0, x1, y1 } = this.cellRange(rect);
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const key = this.key(cx, cy);
        const bucket = this.cells.get(key);
        if (bucket) bucket.push(index);
        else this.cells.set(key, [index]);
      }
    }
  }

  private cellRange(rect: Rect) {
    const size = this.cellSize;
    return {
      x0: Math.floor(rect.x / size),
      y0: Math.floor(rect.y / size),
      // A rect ending exactly on a cell border belongs to the previous cell only.
      x1: Math.floor((rect.x + rect.w - 1e-9) / size),
      y1: Math.floor((rect.y + rect.h - 1e-9) / size),
    };
  }

  /** All rects whose cells intersect the query rect (a superset of the real overlaps, deduplicated). */
  query(rect: Rect): Rect[] {
    const { x0, y0, x1, y1 } = this.cellRange(rect);
    const seen = new Set<number>();
    const out: Rect[] = [];
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const bucket = this.cells.get(this.key(cx, cy));
        if (!bucket) continue;
        for (const index of bucket) {
          if (!seen.has(index)) {
            seen.add(index);
            out.push(this.rects[index]);
          }
        }
      }
    }
    return out;
  }
}

export interface MoveResult {
  x: number;
  y: number;
  hitX: boolean;
  hitY: boolean;
}

/**
 * Moves `box` by (dx, dy), resolving x first and then y, so it slides along walls without catching
 * on corners. Only obstacles ahead of the box are considered: one that already overlaps it never
 * pulls the box backwards, which lets a box that starts embedded walk out. `bounds` (optional)
 * keeps the whole box inside the walkable area.
 */
export function moveAndSlide(box: Rect, dx: number, dy: number, obstacles: ObstacleSource | readonly Rect[], bounds?: Rect): MoveResult {
  const near = (region: Rect): readonly Rect[] => (Array.isArray(obstacles) ? (obstacles as readonly Rect[]) : (obstacles as ObstacleSource).query(region));

  let x = box.x;
  let y = box.y;
  let hitX = false;
  let hitY = false;

  if (dx !== 0) {
    let target = x + dx;
    const sweep: Rect = { x: Math.min(x, target), y, w: box.w + Math.abs(dx), h: box.h };
    for (const o of near(sweep)) {
      if (y >= o.y + o.h || y + box.h <= o.y) continue; // no vertical overlap: not in the way
      if (dx > 0 && o.x >= x + box.w && o.x < target + box.w) {
        target = o.x - box.w;
        hitX = true;
      } else if (dx < 0 && o.x + o.w <= x && o.x + o.w > target) {
        target = o.x + o.w;
        hitX = true;
      }
    }
    if (bounds) {
      const clamped = Math.min(Math.max(target, bounds.x), bounds.x + bounds.w - box.w);
      if (clamped !== target) hitX = true;
      target = clamped;
    }
    x = target;
  }

  if (dy !== 0) {
    let target = y + dy;
    const sweep: Rect = { x, y: Math.min(y, target), w: box.w, h: box.h + Math.abs(dy) };
    for (const o of near(sweep)) {
      if (x >= o.x + o.w || x + box.w <= o.x) continue;
      if (dy > 0 && o.y >= y + box.h && o.y < target + box.h) {
        target = o.y - box.h;
        hitY = true;
      } else if (dy < 0 && o.y + o.h <= y && o.y + o.h > target) {
        target = o.y + o.h;
        hitY = true;
      }
    }
    if (bounds) {
      const clamped = Math.min(Math.max(target, bounds.y), bounds.y + bounds.h - box.h);
      if (clamped !== target) hitY = true;
      target = clamped;
    }
    y = target;
  }

  return { x, y, hitX, hitY };
}
