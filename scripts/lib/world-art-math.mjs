/**
 * Pure helpers for scripts/convert-world-art.mjs (grid slicing, alpha bbox, box downscale, foot
 * alignment, seamless blending, QA metrics). No file or sharp access here so they stay unit-testable.
 *
 * A "raster" is { data: Uint8Array | Uint8ClampedArray | Buffer, width, height } with straight
 * (non-premultiplied) RGBA, 4 bytes per pixel.
 */

/** Alpha (0-255) at or above which a pixel counts as "part of the sprite" when trimming. */
export const TRIM_ALPHA = 64;
/** Alpha at or above which a pixel becomes fully opaque after the hard-edge snap. */
export const SNAP_ALPHA = 128;

export function createRaster(width, height) {
  return { data: new Uint8ClampedArray(width * height * 4), width, height };
}

/** Splits a width×height image into cols×rows cells whose integer edges cover the image exactly. */
export function gridCells(width, height, cols, rows) {
  const cells = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x0 = Math.round((col * width) / cols);
      const x1 = Math.round(((col + 1) * width) / cols);
      const y0 = Math.round((row * height) / rows);
      const y1 = Math.round(((row + 1) * height) / rows);
      cells.push({ col, row, x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
    }
  }
  return cells;
}

export function cropRaster(img, rect) {
  const out = createRaster(rect.w, rect.h);
  for (let y = 0; y < rect.h; y++) {
    const srcStart = ((rect.y + y) * img.width + rect.x) * 4;
    out.data.set(img.data.subarray(srcStart, srcStart + rect.w * 4), y * rect.w * 4);
  }
  return out;
}

/** Copies src onto dst at (dx, dy) with source-over compositing (used for atlas/sheet packing). */
export function blit(dst, src, dx, dy) {
  for (let y = 0; y < src.height; y++) {
    const ty = dy + y;
    if (ty < 0 || ty >= dst.height) continue;
    for (let x = 0; x < src.width; x++) {
      const tx = dx + x;
      if (tx < 0 || tx >= dst.width) continue;
      const si = (y * src.width + x) * 4;
      const di = (ty * dst.width + tx) * 4;
      const sa = src.data[si + 3] / 255;
      if (sa <= 0) continue;
      const da = dst.data[di + 3] / 255;
      const oa = sa + da * (1 - sa);
      for (let c = 0; c < 3; c++) {
        dst.data[di + c] = (src.data[si + c] * sa + dst.data[di + c] * da * (1 - sa)) / oa;
      }
      dst.data[di + 3] = oa * 255;
    }
  }
}

/** Inclusive-exclusive bbox {x,y,w,h} of pixels with alpha >= threshold, or null when empty. */
export function alphaBBox(img, threshold = TRIM_ALPHA) {
  let minX = img.width, minY = img.height, maxX = -1, maxY = -1;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      if (img.data[(y * img.width + x) * 4 + 3] >= threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return maxX < 0 ? null : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/** True when the bbox comes within `margin` px of the image border (sprite probably clipped by the cell). */
export function bboxTouchesEdge(bbox, width, height, margin = 1) {
  return (
    bbox.x < margin ||
    bbox.y < margin ||
    bbox.x + bbox.w > width - margin ||
    bbox.y + bbox.h > height - margin
  );
}

/** Alpha-weighted centroid x of the pixels inside bbox, relative to bbox.x. */
export function alphaCentroidX(img, bbox, threshold = TRIM_ALPHA) {
  let sum = 0, weight = 0;
  for (let y = bbox.y; y < bbox.y + bbox.h; y++) {
    for (let x = bbox.x; x < bbox.x + bbox.w; x++) {
      const a = img.data[(y * img.width + x) * 4 + 3];
      if (a >= threshold) {
        sum += (x - bbox.x + 0.5) * a;
        weight += a;
      }
    }
  }
  return weight > 0 ? sum / weight : bbox.w / 2;
}

/** Largest size that fits inside maxW×maxH keeping aspect. Never returns less than 1px per side. */
export function fitSize(srcW, srcH, maxW, maxH) {
  const scale = Math.min(maxW / srcW, maxH / srcH);
  return {
    scale,
    w: Math.min(maxW, Math.max(1, Math.round(srcW * scale))),
    h: Math.min(maxH, Math.max(1, Math.round(srcH * scale))),
  };
}

/** Centered (anchor 0.5) crop rect with the destination aspect that covers as much of the source as possible. */
export function coverCropRect(srcW, srcH, dstW, dstH, anchorX = 0.5, anchorY = 0.5) {
  const targetAspect = dstW / dstH;
  let w = srcW;
  let h = Math.round(srcW / targetAspect);
  if (h > srcH) {
    h = srcH;
    w = Math.round(srcH * targetAspect);
  }
  return {
    x: Math.round((srcW - w) * anchorX),
    y: Math.round((srcH - h) * anchorY),
    w,
    h,
  };
}

function areaWeights(srcLen, dstLen) {
  const scale = srcLen / dstLen;
  const out = [];
  for (let d = 0; d < dstLen; d++) {
    const start = d * scale;
    const end = (d + 1) * scale;
    const first = Math.floor(start);
    const last = Math.min(srcLen, Math.ceil(end));
    const items = [];
    let total = 0;
    for (let i = first; i < last; i++) {
      const w = Math.min(end, i + 1) - Math.max(start, i);
      if (w > 1e-9) {
        items.push([i, w]);
        total += w;
      }
    }
    out.push({ items, total });
  }
  return out;
}

/**
 * Area-average ("box") resize done on premultiplied colour so transparent pixels never bleed their
 * hidden RGB into the edges. Upscaling degenerates to replication, which keeps pixel art crisp.
 */
export function boxDownscale(img, dstW, dstH) {
  if (img.width === dstW && img.height === dstH) {
    return { data: Uint8ClampedArray.from(img.data), width: dstW, height: dstH };
  }
  const xw = areaWeights(img.width, dstW);
  const yw = areaWeights(img.height, dstH);
  const mid = new Float32Array(dstW * img.height * 4);
  for (let y = 0; y < img.height; y++) {
    for (let dx = 0; dx < dstW; dx++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (const [sx, w] of xw[dx].items) {
        const i = (y * img.width + sx) * 4;
        const pa = img.data[i + 3] / 255;
        r += img.data[i] * pa * w;
        g += img.data[i + 1] * pa * w;
        b += img.data[i + 2] * pa * w;
        a += pa * w;
      }
      const t = xw[dx].total;
      const o = (y * dstW + dx) * 4;
      mid[o] = r / t;
      mid[o + 1] = g / t;
      mid[o + 2] = b / t;
      mid[o + 3] = a / t;
    }
  }
  const out = createRaster(dstW, dstH);
  for (let dy = 0; dy < dstH; dy++) {
    for (let x = 0; x < dstW; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (const [sy, w] of yw[dy].items) {
        const i = (sy * dstW + x) * 4;
        r += mid[i] * w;
        g += mid[i + 1] * w;
        b += mid[i + 2] * w;
        a += mid[i + 3] * w;
      }
      const t = yw[dy].total;
      const o = (dy * dstW + x) * 4;
      const alpha = a / t;
      if (alpha > 1e-6) {
        out.data[o] = r / t / alpha;
        out.data[o + 1] = g / t / alpha;
        out.data[o + 2] = b / t / alpha;
      }
      out.data[o + 3] = alpha * 255;
    }
  }
  return out;
}

/**
 * Removes the baked-in glow/haze the generator leaves around sprites: pixels below `threshold`
 * (default 240) are cleared, the rest become fully opaque. Do not use on intentionally soft art.
 */
export function hardenAlpha(img, threshold = 240) {
  return snapAlpha(img, threshold);
}

/** Hard-edge alpha: >= threshold becomes 255, everything else 0 (RGB of removed pixels cleared). */
export function snapAlpha(img, threshold = SNAP_ALPHA) {
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] >= threshold) {
      img.data[i + 3] = 255;
    } else {
      img.data[i] = img.data[i + 1] = img.data[i + 2] = img.data[i + 3] = 0;
    }
  }
  return img;
}

/** Removes pixels within `tolerance` (euclidean RGB) of `key`; returns how many were cleared. */
export function chromaKey(img, key = [255, 0, 255], tolerance = 40) {
  let removed = 0;
  const limit = tolerance * tolerance;
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] === 0) continue;
    const dr = img.data[i] - key[0];
    const dg = img.data[i + 1] - key[1];
    const db = img.data[i + 2] - key[2];
    if (dr * dr + dg * dg + db * db <= limit) {
      img.data[i] = img.data[i + 1] = img.data[i + 2] = img.data[i + 3] = 0;
      removed++;
    }
  }
  return removed;
}

/** Pulls the magenta cast off edge pixels (those touching transparency) left by a chroma key. */
export function despillMagenta(img) {
  const { data, width, height } = img;
  const isClear = (x, y) =>
    x < 0 || y < 0 || x >= width || y >= height || data[(y * width + x) * 4 + 3] < 32;
  let fixed = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] === 0) continue;
      if (!(isClear(x - 1, y) || isClear(x + 1, y) || isClear(x, y - 1) || isClear(x, y + 1))) continue;
      const cast = Math.min(data[i], data[i + 2]) - data[i + 1];
      if (cast > 30) {
        const reduced = data[i + 1] + cast * 0.2;
        data[i] = Math.min(data[i], reduced);
        data[i + 2] = Math.min(data[i + 2], reduced);
        fixed++;
      }
    }
  }
  return fixed;
}

/** Count of near-#FF00FF opaque pixels (a chroma-key leftover, or intentional magenta art). */
export function countMagenta(img, distance = 60, minAlpha = SNAP_ALPHA) {
  let count = 0;
  const limit = distance * distance;
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] < minAlpha) continue;
    const dr = img.data[i] - 255;
    const db = img.data[i + 2] - 255;
    const g = img.data[i + 1];
    if (dr * dr + g * g + db * db <= limit) count++;
  }
  return count;
}

/**
 * Mean absolute RGBA difference (0..1) between the image and its left-right / top-bottom mirror —
 * 0 for a perfectly symmetric 9-slice frame.
 */
export function symmetryError(img) {
  const { data, width, height } = img;
  let lr = 0, tb = 0, count = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const mx = (y * width + (width - 1 - x)) * 4;
      const my = ((height - 1 - y) * width + x) * 4;
      for (let c = 0; c < 4; c++) {
        lr += Math.abs(data[i + c] - data[mx + c]);
        tb += Math.abs(data[i + c] - data[my + c]);
      }
      count += 4;
    }
  }
  return { lr: lr / count / 255, tb: tb / count / 255 };
}

/** Mean absolute RGB difference (0..1) between opposite edges — how visible a tile's seam is. */
export function seamError(img) {
  const { data, width, height } = img;
  let x = 0, y = 0;
  for (let row = 0; row < height; row++) {
    const a = (row * width) * 4;
    const b = (row * width + width - 1) * 4;
    for (let c = 0; c < 3; c++) x += Math.abs(data[a + c] - data[b + c]);
  }
  for (let col = 0; col < width; col++) {
    const a = col * 4;
    const b = ((height - 1) * width + col) * 4;
    for (let c = 0; c < 3; c++) y += Math.abs(data[a + c] - data[b + c]);
  }
  return { x: x / (height * 3) / 255, y: y / (width * 3) / 255 };
}

function smoothstep(t) {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

/**
 * Makes opposite edges continue into each other: pixels near the border are cross-faded with the
 * content half a period away (which is adjacent across the wrap), so left↔right / top↔bottom match.
 * The centre of the image is untouched. Works on premultiplied colour.
 */
export function makeSeamless(img, { x = true, y = false } = {}, bandFraction = 0.25) {
  const { width, height } = img;
  const out = createRaster(width, height);
  const premul = (i) => {
    const a = img.data[i + 3] / 255;
    return [img.data[i] * a, img.data[i + 1] * a, img.data[i + 2] * a, a];
  };
  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const wx = x ? smoothstep(Math.min(px, width - 1 - px) / (width * bandFraction)) : 1;
      const wy = y ? smoothstep(Math.min(py, height - 1 - py) / (height * bandFraction)) : 1;
      const weight = Math.min(wx, wy);
      const shiftedX = x ? (px + Math.floor(width / 2)) % width : px;
      const shiftedY = y ? (py + Math.floor(height / 2)) % height : py;
      const a = premul((py * width + px) * 4);
      const b = premul((shiftedY * width + shiftedX) * 4);
      const mix = a.map((v, c) => v * weight + b[c] * (1 - weight));
      const o = (py * width + px) * 4;
      const alpha = mix[3];
      if (alpha > 1e-6) {
        out.data[o] = mix[0] / alpha;
        out.data[o + 1] = mix[1] / alpha;
        out.data[o + 2] = mix[2] / alpha;
      }
      out.data[o + 3] = alpha * 255;
    }
  }
  return out;
}

export function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Largest absolute distance of any value from the median. */
export function maxDeviation(values) {
  const m = median(values);
  return values.reduce((worst, v) => Math.max(worst, Math.abs(v - m)), 0);
}

/**
 * Common scale for one character's frames. The standing (turn-front) bbox height maps to
 * `standHeight`; the scale is then reduced only as far as needed so every frame's bbox still fits
 * inside the frame above the foot inset. `reduced` tells the caller a reduction happened.
 */
export function characterScale({ standBoxHeight, standHeight, boxes, frameW, frameH, footInset }) {
  const wanted = standHeight / standBoxHeight;
  let fit = Infinity;
  for (const box of boxes) {
    fit = Math.min(fit, (frameH - footInset) / box.h, frameW / box.w);
  }
  const scale = Math.min(wanted, fit);
  return { scale, wanted, reduced: scale < wanted - 1e-9, reductionRatio: scale / wanted };
}

/**
 * Where to draw a scaled sprite inside an atlas cell: feet (bbox bottom) `footInset` px above the
 * cell bottom, horizontal centre of mass on the cell centre, clamped so nothing leaves the cell.
 */
export function placeInFrame({ scaledW, scaledH, centroidX, frameW, frameH, footInset }) {
  let dx = Math.round(frameW / 2 - centroidX);
  let clamped = false;
  if (dx < 0) { dx = 0; clamped = true; }
  if (dx + scaledW > frameW) { dx = frameW - scaledW; clamped = true; }
  return { dx, dy: frameH - footInset - scaledH, clamped };
}

export function rgbToHsv(r, g, b) {
  const rf = r / 255, gf = g / 255, bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const d = max - min;
  let h = 0;
  if (d > 0) {
    if (max === rf) h = ((gf - bf) / d) % 6;
    else if (max === gf) h = (bf - rf) / d + 2;
    else h = (rf - gf) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

export function hsvToRgb(h, s, v) {
  const c = v * s;
  const hh = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hh < 1) [r, g, b] = [c, x, 0];
  else if (hh < 2) [r, g, b] = [x, c, 0];
  else if (hh < 3) [r, g, b] = [0, c, x];
  else if (hh < 4) [r, g, b] = [0, x, c];
  else if (hh < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = v - c;
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/**
 * "Gardener" palette swap for weeder-grunt: greys → grass green (#3f9e46 family), oranges → light
 * brown. Near-white and near-black (outline) pixels are left alone.
 */
export function swapToGardener(img) {
  const { data } = img;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const { h, s, v } = rgbToHsv(data[i], data[i + 1], data[i + 2]);
    let next = null;
    if (s < 0.22 && v >= 0.18 && v <= 0.95) {
      next = hsvToRgb(124, 0.55, Math.min(1, v * 0.95 + 0.05));
    } else if (h >= 10 && h <= 45 && s > 0.4) {
      next = hsvToRgb(32, s * 0.55, Math.min(1, v * 0.95 + 0.05));
    }
    if (next) [data[i], data[i + 1], data[i + 2]] = next;
  }
  return img;
}

/** Mixes `amount` (0..1) of a solid colour into every non-transparent pixel (the "withered" tint). */
export function tintBlend(img, [tr, tg, tb], amount) {
  const { data } = img;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    data[i] = data[i] * (1 - amount) + tr * amount;
    data[i + 1] = data[i + 1] * (1 - amount) + tg * amount;
    data[i + 2] = data[i + 2] * (1 - amount) + tb * amount;
  }
  return img;
}

export function parseHexColor(hex) {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16));
}

/**
 * 8-connected component labelling of pixels with alpha >= threshold. Returns per-pixel labels
 * (0 = background, ids start at 1) and one entry per component: area, bbox (x0,y0,x1,y1 inclusive)
 * and mass centroid.
 */
export function labelComponents(img, threshold = 240) {
  const { width, height, data } = img;
  const labels = new Int32Array(width * height);
  const comps = [];
  const stack = new Int32Array(width * height);
  for (let start = 0; start < labels.length; start++) {
    if (labels[start] !== 0 || data[start * 4 + 3] < threshold) continue;
    const id = comps.length + 1;
    let sp = 0;
    stack[sp++] = start;
    labels[start] = id;
    const comp = { id, area: 0, x0: width, y0: height, x1: -1, y1: -1, cx: 0, cy: 0 };
    let sumX = 0, sumY = 0;
    while (sp > 0) {
      const p = stack[--sp];
      const px = p % width;
      const py = (p - px) / width;
      comp.area++;
      sumX += px;
      sumY += py;
      if (px < comp.x0) comp.x0 = px;
      if (px > comp.x1) comp.x1 = px;
      if (py < comp.y0) comp.y0 = py;
      if (py > comp.y1) comp.y1 = py;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = py + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = px + dx;
          if (nx < 0 || nx >= width || (dx === 0 && dy === 0)) continue;
          const n = ny * width + nx;
          if (labels[n] === 0 && data[n * 4 + 3] >= threshold) {
            labels[n] = id;
            stack[sp++] = n;
          }
        }
      }
    }
    comp.cx = sumX / comp.area;
    comp.cy = sumY / comp.area;
    comps.push(comp);
  }
  return { labels, comps };
}

/** Gap in px between two inclusive rects {x0,y0,x1,y1}; 0 when they overlap or touch. */
export function rectGap(a, b) {
  const dx = Math.max(0, Math.max(a.x0, b.x0) - Math.min(a.x1, b.x1) - 1);
  const dy = Math.max(0, Math.max(a.y0, b.y0) - Math.min(a.y1, b.y1) - 1);
  return Math.max(dx, dy);
}

/**
 * Pulls one sprite per grid cell out of a sheet whose objects do not sit exactly on the grid
 * (generated sheets drift and overlap cell borders). Each connected component is given to the cell
 * that contains its centroid; small satellites far from the main component are dropped as noise.
 * Returns, per cell, { raster (trimmed to the sprite), bbox (sheet coords), components, dropped }
 * or null when the cell has no sprite. With `softMargin`, all original pixels (soft glow included)
 * inside the sprite bbox grown by that margin are kept instead of only the labelled ones.
 */
export function extractSprites(img, cells, { threshold = 240, minArea = 40, gap = 24, softMargin = 0 } = {}) {
  const { labels, comps } = labelComponents(img, threshold);
  const buckets = cells.map(() => []);
  for (const comp of comps) {
    if (comp.area < minArea) continue;
    const index = cells.findIndex((cell) => comp.cx >= cell.x && comp.cx < cell.x + cell.w && comp.cy >= cell.y && comp.cy < cell.y + cell.h);
    if (index >= 0) buckets[index].push(comp);
  }
  return buckets.map((list) => {
    if (list.length === 0) return null;
    const main = list.reduce((best, comp) => (comp.area > best.area ? comp : best));
    const keep = list.filter((comp) => comp === main || comp.area >= main.area * 0.02 || rectGap(comp, main) <= gap);
    let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
    for (const comp of keep) {
      x0 = Math.min(x0, comp.x0);
      y0 = Math.min(y0, comp.y0);
      x1 = Math.max(x1, comp.x1);
      y1 = Math.max(y1, comp.y1);
    }
    if (softMargin > 0) {
      x0 = Math.max(0, x0 - softMargin);
      y0 = Math.max(0, y0 - softMargin);
      x1 = Math.min(img.width - 1, x1 + softMargin);
      y1 = Math.min(img.height - 1, y1 + softMargin);
    }
    const w = x1 - x0 + 1;
    const h = y1 - y0 + 1;
    const raster = createRaster(w, h);
    const wanted = new Uint8Array(comps.length + 1);
    for (const comp of keep) wanted[comp.id] = 1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const sp = (y0 + y) * img.width + (x0 + x);
        if (softMargin > 0 || wanted[labels[sp]] === 1) {
          const di = (y * w + x) * 4;
          const si = sp * 4;
          raster.data[di] = img.data[si];
          raster.data[di + 1] = img.data[si + 1];
          raster.data[di + 2] = img.data[si + 2];
          raster.data[di + 3] = softMargin > 0 ? img.data[si + 3] : 255;
        }
      }
    }
    return { raster, bbox: { x: x0, y: y0, w, h }, components: keep.length, dropped: list.length - keep.length };
  });
}
