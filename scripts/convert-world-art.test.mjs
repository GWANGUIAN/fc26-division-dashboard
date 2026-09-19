import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  alphaBBox,
  alphaCentroidX,
  bboxTouchesEdge,
  blit,
  boxDownscale,
  characterScale,
  chromaKey,
  countMagenta,
  coverCropRect,
  createRaster,
  cropRaster,
  extractSprites,
  fitSize,
  gridCells,
  hardenAlpha,
  labelComponents,
  rectGap,
  makeSeamless,
  maxDeviation,
  median,
  placeInFrame,
  seamError,
  sealInteriorAlpha,
  snapAlpha,
  swapToGardener,
  symmetryError,
  tintBlend,
} from "./lib/world-art-math.mjs";

function solid(width, height, [r, g, b, a]) {
  const img = createRaster(width, height);
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i] = r;
    img.data[i + 1] = g;
    img.data[i + 2] = b;
    img.data[i + 3] = a;
  }
  return img;
}

function setPixel(img, x, y, [r, g, b, a]) {
  const i = (y * img.width + x) * 4;
  [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]] = [r, g, b, a];
}

const pixel = (img, x, y) => Array.from(img.data.slice((y * img.width + x) * 4, (y * img.width + x) * 4 + 4));

describe("gridCells", () => {
  it("splits an evenly divisible image into equal cells", () => {
    const cells = gridCells(1536, 1024, 4, 3);
    expect(cells).toHaveLength(12);
    expect(cells[0]).toEqual({ col: 0, row: 0, x: 0, y: 0, w: 384, h: 341 });
    expect(cells[11]).toMatchObject({ col: 3, row: 2, x: 1152, y: 683, w: 384, h: 341 });
  });

  it("covers an image that does not divide evenly without gaps or overlap", () => {
    const cells = gridCells(1254, 1254, 4, 4);
    const rows = cells.filter((cell) => cell.col === 0);
    expect(rows.reduce((sum, cell) => sum + cell.h, 0)).toBe(1254);
    const cols = cells.filter((cell) => cell.row === 0);
    expect(cols.reduce((sum, cell) => sum + cell.w, 0)).toBe(1254);
    for (let i = 1; i < cols.length; i++) expect(cols[i].x).toBe(cols[i - 1].x + cols[i - 1].w);
  });
});

describe("alphaBBox / bboxTouchesEdge / alphaCentroidX", () => {
  const img = createRaster(10, 10);
  for (let y = 3; y < 7; y++) for (let x = 2; x < 5; x++) setPixel(img, x, y, [255, 0, 0, 255]);
  setPixel(img, 8, 8, [255, 0, 0, 10]);

  it("finds the opaque region and ignores faint alpha", () => {
    expect(alphaBBox(img)).toEqual({ x: 2, y: 3, w: 3, h: 4 });
    expect(alphaBBox(createRaster(4, 4))).toBeNull();
  });

  it("detects a sprite touching the cell border", () => {
    expect(bboxTouchesEdge({ x: 2, y: 3, w: 3, h: 4 }, 10, 10, 2)).toBe(false);
    expect(bboxTouchesEdge({ x: 0, y: 3, w: 3, h: 4 }, 10, 10, 1)).toBe(true);
    expect(bboxTouchesEdge({ x: 2, y: 3, w: 3, h: 7 }, 10, 10, 1)).toBe(true);
  });

  it("computes the centroid relative to the bbox", () => {
    expect(alphaCentroidX(img, { x: 2, y: 3, w: 3, h: 4 })).toBeCloseTo(1.5);
    const lopsided = createRaster(6, 2);
    setPixel(lopsided, 0, 0, [0, 0, 0, 255]);
    for (let x = 3; x < 6; x++) setPixel(lopsided, x, 0, [0, 0, 0, 255]);
    expect(alphaCentroidX(lopsided, { x: 0, y: 0, w: 6, h: 1 })).toBeGreaterThan(3);
  });
});

describe("fitSize / coverCropRect", () => {
  it("keeps aspect ratio inside the box", () => {
    expect(fitSize(200, 100, 96, 96)).toMatchObject({ w: 96, h: 48 });
    expect(fitSize(100, 200, 96, 96)).toMatchObject({ w: 48, h: 96 });
    expect(fitSize(1, 1000, 10, 10).w).toBe(1);
  });

  it("crops a 3:2 source to 16:9 about the centre", () => {
    const rect = coverCropRect(1536, 1024, 640, 360);
    expect(rect).toEqual({ x: 0, y: 80, w: 1536, h: 864 });
    expect(coverCropRect(1536, 1024, 640, 384)).toMatchObject({ x: 0, w: 1536, h: 922 });
  });

  it("crops a wider source horizontally", () => {
    expect(coverCropRect(2000, 500, 100, 100)).toEqual({ x: 750, y: 0, w: 500, h: 500 });
  });
});

describe("boxDownscale", () => {
  it("is the identity at the same size", () => {
    const img = solid(4, 4, [10, 20, 30, 255]);
    expect(boxDownscale(img, 4, 4).data).toEqual(img.data);
  });

  it("averages 2x2 blocks", () => {
    const img = createRaster(2, 2);
    setPixel(img, 0, 0, [0, 0, 0, 255]);
    setPixel(img, 1, 0, [100, 100, 100, 255]);
    setPixel(img, 0, 1, [200, 200, 200, 255]);
    setPixel(img, 1, 1, [100, 100, 100, 255]);
    expect(pixel(boxDownscale(img, 1, 1), 0, 0)).toEqual([100, 100, 100, 255]);
  });

  it("does not bleed the hidden colour of transparent pixels into the result", () => {
    const img = createRaster(2, 1);
    setPixel(img, 0, 0, [255, 0, 0, 255]);
    setPixel(img, 1, 0, [0, 255, 0, 0]);
    const out = boxDownscale(img, 1, 1);
    expect(pixel(out, 0, 0)).toEqual([255, 0, 0, 128]);
  });

  it("replicates pixels when enlarging (pixel-art safe)", () => {
    const img = createRaster(2, 1);
    setPixel(img, 0, 0, [255, 0, 0, 255]);
    setPixel(img, 1, 0, [0, 0, 255, 255]);
    const out = boxDownscale(img, 4, 2);
    expect(pixel(out, 1, 1)).toEqual([255, 0, 0, 255]);
    expect(pixel(out, 2, 0)).toEqual([0, 0, 255, 255]);
  });
});

describe("snapAlpha / chromaKey / countMagenta", () => {
  it("makes alpha binary and clears hidden colour", () => {
    const img = createRaster(3, 1);
    setPixel(img, 0, 0, [10, 20, 30, 200]);
    setPixel(img, 1, 0, [10, 20, 30, 100]);
    snapAlpha(img, 128);
    expect(pixel(img, 0, 0)).toEqual([10, 20, 30, 255]);
    expect(pixel(img, 1, 0)).toEqual([0, 0, 0, 0]);
  });

  it("keys out the magenta background only", () => {
    const img = solid(3, 1, [255, 0, 255, 255]);
    setPixel(img, 1, 0, [240, 20, 250, 255]);
    setPixel(img, 2, 0, [20, 160, 80, 255]);
    expect(chromaKey(img, [255, 0, 255], 40)).toBe(2);
    expect(pixel(img, 2, 0)).toEqual([20, 160, 80, 255]);
    expect(alphaBBox(img)).toEqual({ x: 2, y: 0, w: 1, h: 1 });
  });

  it("counts leftover magenta but not other colours", () => {
    const img = solid(2, 1, [255, 10, 250, 255]);
    setPixel(img, 1, 0, [120, 0, 180, 255]);
    expect(countMagenta(img)).toBe(1);
  });
});

describe("sealInteriorAlpha", () => {
  it("fills accidental transparency only inside a 9-slice panel's stretch area", () => {
    const img = solid(5, 5, [0, 0, 0, 0]);
    setPixel(img, 2, 2, [100, 50, 0, 128]);
    sealInteriorAlpha(img, 1, [6, 18, 15]);
    expect(pixel(img, 0, 0)).toEqual([0, 0, 0, 0]);
    expect(pixel(img, 1, 1)).toEqual([6, 18, 15, 255]);
    expect(pixel(img, 2, 2)).toEqual([53, 34, 7, 255]);
  });
});

describe("symmetryError / seamError / makeSeamless", () => {
  it("is zero for a symmetric image and positive otherwise", () => {
    const sym = createRaster(4, 4);
    setPixel(sym, 0, 0, [255, 0, 0, 255]);
    setPixel(sym, 3, 0, [255, 0, 0, 255]);
    setPixel(sym, 0, 3, [255, 0, 0, 255]);
    setPixel(sym, 3, 3, [255, 0, 0, 255]);
    expect(symmetryError(sym)).toEqual({ lr: 0, tb: 0 });
    setPixel(sym, 3, 0, [0, 0, 0, 0]);
    expect(symmetryError(sym).lr).toBeGreaterThan(0);
  });

  it("makes opposite edges continuous", () => {
    const w = 32;
    const img = createRaster(w, 4);
    for (let y = 0; y < 4; y++) for (let x = 0; x < w; x++) setPixel(img, x, y, [Math.round((x / (w - 1)) * 255), 0, 0, 255]);
    expect(seamError(img).x).toBeGreaterThan(0.3); // only the red channel differs, so 1/3 of the RGB mean
    const seamless = makeSeamless(img, { x: true, y: false });
    expect(seamError(seamless).x).toBeLessThan(0.1);
    expect(pixel(seamless, w / 2, 0)[0]).toBe(pixel(img, w / 2, 0)[0]);
  });
});

describe("characterScale / placeInFrame", () => {
  const base = { frameW: 48, frameH: 64, footInset: 4 };

  it("maps the standing height to the target when everything fits", () => {
    const result = characterScale({ ...base, standBoxHeight: 290, standHeight: 58, boxes: [{ w: 150, h: 290 }, { w: 160, h: 295 }] });
    expect(result.scale).toBeCloseTo(58 / 290);
    expect(result.reduced).toBe(false);
  });

  it("shrinks only as far as the largest frame requires", () => {
    const result = characterScale({ ...base, standBoxHeight: 100, standHeight: 58, boxes: [{ w: 100, h: 100 }, { w: 100, h: 130 }] });
    expect(result.scale).toBeCloseTo(60 / 130);
    expect(result.reduced).toBe(true);
    expect(result.reductionRatio).toBeLessThan(1);
    const wide = characterScale({ ...base, standBoxHeight: 100, standHeight: 58, boxes: [{ w: 200, h: 100 }] });
    expect(wide.scale).toBeCloseTo(48 / 200);
  });

  it("aligns feet to the inset and centres the centre of mass", () => {
    expect(placeInFrame({ ...base, scaledW: 30, scaledH: 58, centroidX: 15 })).toEqual({ dx: 9, dy: 2, clamped: false });
  });

  it("clamps sprites that would leave the frame", () => {
    expect(placeInFrame({ ...base, scaledW: 40, scaledH: 50, centroidX: 30 })).toMatchObject({ dx: 0, clamped: true });
    expect(placeInFrame({ ...base, scaledW: 40, scaledH: 50, centroidX: 5 })).toMatchObject({ dx: 8, clamped: true });
  });
});

describe("median / maxDeviation", () => {
  it("measures foot-line drift", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(maxDeviation([100, 101, 99, 106])).toBe(5.5);
    expect(maxDeviation([])).toBe(0);
  });
});

describe("cropRaster / blit", () => {
  it("crops and composites with source-over", () => {
    const src = solid(4, 4, [0, 0, 0, 0]);
    setPixel(src, 2, 1, [9, 8, 7, 255]);
    expect(pixel(cropRaster(src, { x: 2, y: 1, w: 2, h: 2 }), 0, 0)).toEqual([9, 8, 7, 255]);
    const dst = solid(4, 4, [0, 0, 0, 0]);
    blit(dst, cropRaster(src, { x: 2, y: 1, w: 1, h: 1 }), 3, 3);
    expect(pixel(dst, 3, 3)).toEqual([9, 8, 7, 255]);
    blit(dst, solid(2, 2, [1, 1, 1, 255]), 3, 3); // clipped at the edge
    expect(pixel(dst, 3, 3)).toEqual([1, 1, 1, 255]);
  });
});

describe("palette derivations", () => {
  it("swaps grey and orange to green/brown but keeps white and outlines", () => {
    const img = createRaster(4, 1);
    setPixel(img, 0, 0, [128, 128, 128, 255]); // grey -> green
    setPixel(img, 1, 0, [230, 120, 30, 255]); // orange -> brown
    setPixel(img, 2, 0, [255, 255, 255, 255]); // white stays
    setPixel(img, 3, 0, [22, 48, 46, 255]); // outline stays
    swapToGardener(img);
    const [r, g, b] = pixel(img, 0, 0);
    expect(g).toBeGreaterThan(r);
    expect(g).toBeGreaterThan(b);
    const [or, og, ob] = pixel(img, 1, 0);
    expect(or).toBeGreaterThan(og);
    expect(og).toBeGreaterThan(ob);
    expect(pixel(img, 2, 0)).toEqual([255, 255, 255, 255]);
    expect(pixel(img, 3, 0)).toEqual([22, 48, 46, 255]);
  });

  it("tints only non-transparent pixels", () => {
    const img = createRaster(2, 1);
    setPixel(img, 0, 0, [100, 100, 100, 255]);
    tintBlend(img, [200, 200, 200], 0.25);
    expect(pixel(img, 0, 0)).toEqual([125, 125, 125, 255]);
    expect(pixel(img, 1, 0)).toEqual([0, 0, 0, 0]);
  });
});

describe("world-art-manifest.json", () => {
  const manifest = JSON.parse(readFileSync(new URL("./world-art-manifest.json", import.meta.url), "utf8"));

  it("has 16 slots per terrain sheet and 12 per prop/fx sheet", () => {
    for (const sheet of Object.values(manifest.terrain)) expect(sheet.slots).toHaveLength(16);
    for (const slots of Object.values(manifest.props)) expect(slots).toHaveLength(12);
    for (const slots of Object.values(manifest.fx)) expect(slots).toHaveLength(12);
    expect(manifest.rush.obstacles).toHaveLength(12);
  });

  it("matches the sheet grids of the ui sheets", () => {
    for (const sheet of Object.values(manifest.ui.sheets)) expect(sheet.slots).toHaveLength(sheet.grid[0] * sheet.grid[1]);
  });

  it("has unique ids and the expected counts", () => {
    // ids only have to be unique inside their output folder (props/, fx/, rush/, ui/)
    const folders = [
      Object.values(manifest.props).flat(),
      Object.values(manifest.fx).flat(),
      manifest.rush.obstacles,
      Object.values(manifest.ui.sheets).flatMap((sheet) => sheet.slots),
    ];
    for (const slots of folders) {
      const ids = slots.map((slot) => slot[0]);
      expect(new Set(ids).size).toBe(ids.length);
    }
    expect(Object.values(manifest.props).flat().filter((slot) => slot[3]?.withered)).toHaveLength(15);
    expect(Object.keys(manifest.buildings)).toHaveLength(17);
    expect(manifest.interiors.ids).toHaveLength(19);
    expect(manifest.interiors).toMatchObject({ size: [640, 384], sourceWidth: 1536, lossless: true });
    for (const id of ["loading-bg", "title-bg", "select-bg"]) expect(manifest.ui.singles[id]).toMatchObject({ w: 1672, h: 940, lossless: true });
    expect(manifest.ui.singles["shard-gauge"]).toMatchObject({ src: "ui-shard-gauge", w: 120, h: 28, mode: "trim" });
    expect(manifest.ui.sheets["frames-panel"].slots[0][3]).toMatchObject({ opaqueInterior: true, interiorFill: [5, 39, 32] });
    expect(manifest.ui.sheets["frames-panel"].slots[6][0]).toBe("shard-gauge-legacy");
    expect(Object.entries(manifest.terrain).filter(([, sheet]) => sheet.withered).map(([name]) => name).sort()).toEqual(["cloud", "core", "frost", "pitch", "spring"]);
    expect(manifest.characters.humans).toHaveLength(18);
  });
});

describe("hardenAlpha / labelComponents / extractSprites", () => {
  function blob(img, x0, y0, w, h, color = [200, 50, 50, 255]) {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) setPixel(img, x, y, color);
  }

  it("clears baked glow but keeps solid pixels", () => {
    const img = createRaster(3, 1);
    setPixel(img, 0, 0, [1, 2, 3, 252]);
    setPixel(img, 1, 0, [1, 2, 3, 200]);
    hardenAlpha(img);
    expect(pixel(img, 0, 0)).toEqual([1, 2, 3, 255]);
    expect(pixel(img, 1, 0)).toEqual([0, 0, 0, 0]);
  });

  it("labels separate blobs and measures them", () => {
    const img = createRaster(20, 10);
    blob(img, 1, 1, 4, 4);
    blob(img, 12, 2, 3, 5);
    const { comps } = labelComponents(img, 240);
    expect(comps).toHaveLength(2);
    expect(comps[0]).toMatchObject({ area: 16, x0: 1, x1: 4, y0: 1, y1: 4 });
    expect(comps[1].cx).toBeCloseTo(13);
    const diag = createRaster(4, 4);
    setPixel(diag, 0, 0, [1, 1, 1, 255]);
    setPixel(diag, 1, 1, [1, 1, 1, 255]);
    expect(labelComponents(diag, 240).comps).toHaveLength(1);
  });

  it("measures the gap between rects", () => {
    expect(rectGap({ x0: 0, y0: 0, x1: 4, y1: 4 }, { x0: 10, y0: 0, x1: 12, y1: 4 })).toBe(5);
    expect(rectGap({ x0: 0, y0: 0, x1: 4, y1: 4 }, { x0: 5, y0: 0, x1: 8, y1: 4 })).toBe(0);
  });

  it("assigns sprites that cross the grid line by centroid and drops far specks", () => {
    const img = createRaster(40, 20);
    blob(img, 8, 4, 16, 12);
    blob(img, 28, 6, 8, 8);
    setPixel(img, 39, 0, [255, 0, 0, 255]);
    const [a, b] = extractSprites(img, gridCells(40, 20, 2, 1), { threshold: 240, minArea: 1, gap: 4 });
    expect(a.bbox).toEqual({ x: 8, y: 4, w: 16, h: 12 });
    expect(b.bbox).toEqual({ x: 28, y: 6, w: 8, h: 8 });
    expect(b.dropped).toBe(1);
    expect(pixel(b.raster, 0, 0)[3]).toBe(255);
  });

  it("keeps nearby satellites and returns null for empty cells", () => {
    const img = createRaster(40, 20);
    blob(img, 2, 4, 10, 10);
    blob(img, 14, 8, 2, 2);
    const [a, b] = extractSprites(img, gridCells(40, 20, 2, 1), { threshold: 240, minArea: 1, gap: 6 });
    expect(a.components).toBe(2);
    expect(a.bbox.w).toBe(14);
    expect(b).toBeNull();
  });

  it("keeps soft glow around the sprite when a soft margin is requested", () => {
    const img = createRaster(20, 20);
    blob(img, 8, 8, 4, 4);
    setPixel(img, 6, 10, [255, 255, 255, 90]);
    const [a] = extractSprites(img, gridCells(20, 20, 1, 1), { threshold: 240, minArea: 1, softMargin: 3 });
    expect(a.bbox).toEqual({ x: 5, y: 5, w: 10, h: 10 });
    expect(pixel(a.raster, 1, 5)[3]).toBe(90);
  });
});
