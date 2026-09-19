import { groundSheet, parseTerrainCode, terrainAssetKey, type TerrainSheet } from "../data/terrainDefs";
import type { WorldAssets } from "../worldAssets";
import type { Camera, Size } from "./camera";
import type { TerrainGrid } from "./scene";

// Ground renderer (docs/world/01 §5 layer 1). The ground is baked into 512×512 chunk canvases the first
// time they come into view — one set with the lush textures, one with the withered ones — and the two are
// alpha-blended per tile by the district's restore value. Where two districts with different ground
// meet, the edge pixels are blended with an ordered-dither gradient so the border is not a hard line.

export const TILE = 32;
export const CHUNK_TILES = 16;
export const CHUNK_PX = TILE * CHUNK_TILES;
/** Each terrain chunk is an RGBA 512px canvas; lush + withered are cached independently. */
export const TERRAIN_CHUNK_BYTES = CHUNK_PX * CHUNK_PX * 4;

/** A scene-bounded upper limit. It prevents the cache from growing with camera time or a long play session. */
export function maxTerrainChunkCount(cols: number, rows: number) {
  return Math.ceil(cols / CHUNK_TILES) * Math.ceil(rows / CHUNK_TILES) * 2;
}
/** Width of the blend band on each side of a district border. */
export const BLEND_BAND = 12;
/** Crossfade resolution: restore values are quantised to 1/STEPS so a row of tiles merges into few draw calls. */
export const RESTORE_STEPS = 16;

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** Ordered-dither threshold in (0, 1) for a pixel. */
export function ditherThreshold(x: number, y: number): number {
  return (BAYER4[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
}

/** Chance that a pixel `distance` px from a district border shows the neighbouring ground (0.5 at the border, 0 at the band's end). */
export function blendWeight(distance: number, band = BLEND_BAND): number {
  if (distance < 0 || distance >= band) return 0;
  return 0.5 * (1 - distance / band);
}

export type EdgeSide = "n" | "s" | "w" | "e";
export type EdgeFlags = Partial<Record<EdgeSide, boolean>>;

/**
 * For a pixel at (px, py) inside a 32px tile, the side whose neighbour tile's texture should be shown
 * instead, or null. Only sides flagged as a district border count; the nearest one wins.
 */
export function blendSide(px: number, py: number, flags: EdgeFlags, band = BLEND_BAND): EdgeSide | null {
  const distances: [EdgeSide, number][] = [["w", px], ["e", TILE - 1 - px], ["n", py], ["s", TILE - 1 - py]];
  let side: EdgeSide | null = null;
  let nearest = Infinity;
  for (const [candidate, distance] of distances) {
    if (flags[candidate] && distance < nearest) {
      side = candidate;
      nearest = distance;
    }
  }
  if (side === null || nearest >= band) return null;
  return ditherThreshold(px, py) < blendWeight(nearest, band) ? side : null;
}

/** Quantised restore step (0..RESTORE_STEPS) for a 0..1 restore value. */
export function restoreStep(restore: number): number {
  return Math.round(Math.min(1, Math.max(0, restore)) * RESTORE_STEPS);
}

const PLACEHOLDER: Record<TerrainSheet, string> = {
  core: "#4a9a48", water: "#3d7fbf", spring: "#c98fb0", frost: "#2c3f6d", industrial: "#5a4640", cloud: "#a9c7e8", weed: "#8d8d86", pitch: "#3f8f3c",
};

export class TerrainRenderer {
  private readonly chunks = new Map<string, HTMLCanvasElement>();
  private readonly pixels = new Map<string, ImageData>();
  private readonly cols: number;
  private readonly rows: number;

  constructor(private readonly assets: WorldAssets, private readonly grid: TerrainGrid) {
    this.cols = Math.ceil(grid.cols / CHUNK_TILES);
    this.rows = Math.ceil(grid.rows / CHUNK_TILES);
  }

  /** Exposed for headless performance checks; cache lifetime is the current WorldEngine only. */
  cacheStats() {
    return { chunks: this.chunks.size, maxChunks: maxTerrainChunkCount(this.grid.cols, this.grid.rows), pixels: this.pixels.size };
  }

  dispose() {
    this.chunks.clear();
    this.pixels.clear();
  }

  private codeAt(tx: number, ty: number): string | null {
    if (tx < 0 || ty < 0 || tx >= this.grid.cols || ty >= this.grid.rows) return null;
    return this.grid.codes[this.grid.cells[ty * this.grid.cols + tx]] ?? null;
  }

  private sheetImage(sheet: TerrainSheet, withered: boolean): ImageBitmap | undefined {
    return this.assets.get(terrainAssetKey(sheet, withered)) ?? this.assets.get(terrainAssetKey(sheet, false));
  }

  /** 128×128 pixel data of a sheet, read once (used to sample neighbouring textures when blending). */
  private sheetPixels(sheet: TerrainSheet, withered: boolean): ImageData | null {
    const key = terrainAssetKey(sheet, withered);
    const image = this.sheetImage(sheet, withered);
    if (!image) return null;
    const cacheKey = `${key}|${image.width}`;
    let data = this.pixels.get(cacheKey);
    if (!data) {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(image, 0, 0);
      data = ctx.getImageData(0, 0, image.width, image.height);
      this.pixels.set(cacheKey, data);
    }
    return data;
  }

  private chunk(cx: number, cy: number, withered: boolean): HTMLCanvasElement {
    const key = `${cx},${cy},${withered ? 1 : 0}`;
    let canvas = this.chunks.get(key);
    if (canvas) return canvas;
    canvas = document.createElement("canvas");
    canvas.width = CHUNK_PX;
    canvas.height = CHUNK_PX;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.imageSmoothingEnabled = false;

    const borders: { lx: number; ly: number; code: string; flags: EdgeFlags; neighbours: Partial<Record<EdgeSide, string>> }[] = [];
    for (let ly = 0; ly < CHUNK_TILES; ly++) {
      for (let lx = 0; lx < CHUNK_TILES; lx++) {
        const tx = cx * CHUNK_TILES + lx;
        const ty = cy * CHUNK_TILES + ly;
        const code = this.codeAt(tx, ty);
        if (!code) continue;
        const slot = parseTerrainCode(code);
        const image = slot ? this.sheetImage(slot.sheet, withered) : undefined;
        if (slot && image) {
          const k = image.width / 128; // sheets are 128×128; tolerate a different scale
          ctx.drawImage(image, slot.col * TILE * k, slot.row * TILE * k, TILE * k, TILE * k, lx * TILE, ly * TILE, TILE, TILE);
        } else {
          ctx.fillStyle = slot ? PLACEHOLDER[slot.sheet] : "#4a9a48";
          ctx.fillRect(lx * TILE, ly * TILE, TILE, TILE);
        }
        const own = groundSheet(code);
        if (!own) continue;
        const flags: EdgeFlags = {};
        const neighbours: Partial<Record<EdgeSide, string>> = {};
        const sides: [EdgeSide, number, number][] = [["n", 0, -1], ["s", 0, 1], ["w", -1, 0], ["e", 1, 0]];
        for (const [side, dx, dy] of sides) {
          const other = this.codeAt(tx + dx, ty + dy);
          if (!other) continue;
          const otherSheet = groundSheet(other);
          if (otherSheet && otherSheet !== own) {
            flags[side] = true;
            neighbours[side] = other;
          }
        }
        if (Object.keys(flags).length > 0) borders.push({ lx, ly, code, flags, neighbours });
      }
    }

    if (borders.length > 0) {
      const target = ctx.getImageData(0, 0, CHUNK_PX, CHUNK_PX);
      for (const { lx, ly, flags, neighbours } of borders) {
        for (let py = 0; py < TILE; py++) {
          for (let px = 0; px < TILE; px++) {
            const side = blendSide(px, py, flags);
            if (!side) continue;
            const slot = parseTerrainCode(neighbours[side]!);
            if (!slot) continue;
            const source = this.sheetPixels(slot.sheet, withered);
            if (!source) continue;
            const k = source.width / 128;
            const sx = Math.floor((slot.col * TILE + px) * k);
            const sy = Math.floor((slot.row * TILE + py) * k);
            const from = (sy * source.width + sx) * 4;
            const to = ((ly * TILE + py) * CHUNK_PX + lx * TILE + px) * 4;
            target.data[to] = source.data[from];
            target.data[to + 1] = source.data[from + 1];
            target.data[to + 2] = source.data[from + 2];
            target.data[to + 3] = source.data[from + 3];
          }
        }
      }
      ctx.putImageData(target, 0, 0);
    }
    this.chunks.set(key, canvas);
    return canvas;
  }

  /**
   * Draws the visible ground. `restoreOfZone(zoneIndex)` is the 0..1 colour restoration of a district:
   * 0 = withered, 1 = lush, in between crossfades. (S3 supplies real values from the mission progress.)
   */
  draw(ctx: CanvasRenderingContext2D, camera: Camera, view: Size, restoreOfZone: (zoneIndex: number) => number) {
    const tx0 = Math.max(0, Math.floor(camera.x / TILE));
    const ty0 = Math.max(0, Math.floor(camera.y / TILE));
    const tx1 = Math.min(this.grid.cols - 1, Math.floor((camera.x + view.w - 1) / TILE));
    const ty1 = Math.min(this.grid.rows - 1, Math.floor((camera.y + view.h - 1) / TILE));
    const previousAlpha = ctx.globalAlpha;
    for (let ty = ty0; ty <= ty1; ty++) {
      let tx = tx0;
      while (tx <= tx1) {
        const step = restoreStep(restoreOfZone(this.grid.zoneCells[ty * this.grid.cols + tx]));
        const cx = Math.floor(tx / CHUNK_TILES);
        let end = tx;
        while (end + 1 <= tx1 && Math.floor((end + 1) / CHUNK_TILES) === cx && restoreStep(restoreOfZone(this.grid.zoneCells[ty * this.grid.cols + end + 1])) === step) end++;
        const cy = Math.floor(ty / CHUNK_TILES);
        const sx = (tx - cx * CHUNK_TILES) * TILE;
        const sy = (ty - cy * CHUNK_TILES) * TILE;
        const w = (end - tx + 1) * TILE;
        const dx = tx * TILE - camera.x;
        const dy = ty * TILE - camera.y;
        if (step < RESTORE_STEPS) ctx.drawImage(this.chunk(cx, cy, true), sx, sy, w, TILE, dx, dy, w, TILE);
        if (step > 0) {
          ctx.globalAlpha = step === RESTORE_STEPS ? 1 : step / RESTORE_STEPS;
          ctx.drawImage(this.chunk(cx, cy, false), sx, sy, w, TILE, dx, dy, w, TILE);
          ctx.globalAlpha = previousAlpha;
        }
        tx = end + 1;
      }
    }
  }
}
