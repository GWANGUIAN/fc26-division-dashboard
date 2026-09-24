/**
 * Pure placement helpers for scripts/convert-pitch-art.mjs (docs/pitch/04 §4, §8). Frames are described
 * in *source* px: { w, h, bottom, cx } = trimmed bbox size, bbox bottom edge measured in the frame's own
 * grid cell, and the alpha centroid x relative to the bbox left.
 */

/**
 * Ground line of one clip row. Airborne frames sit higher in their cell, so the ground line is the
 * median of the lowest half of the bottoms (robust against one dangling foot or one big jump).
 */
export function groundLine(bottoms) {
  if (bottoms.length === 0) return 0;
  const lowest = [...bottoms].sort((a, b) => b - a).slice(0, Math.max(1, Math.ceil(bottoms.length / 2)));
  const mid = Math.floor(lowest.length / 2);
  return lowest.length % 2 ? lowest[mid] : (lowest[mid - 1] + lowest[mid]) / 2;
}

/**
 * Largest scale at which every frame of the row still fits its cell: the part above the ground line must
 * stay under `footY - margin` px and the width under `cellW - 2*margin`. Airborne rows measure the height
 * from the ground line (a jump keeps its altitude), grounded rows from the frame's own bottom.
 */
export function rowFitScale(frames, refBottom, { cellW, footY = 92, airborne, margin = 1 }) {
  let fit = Infinity;
  for (const f of frames) {
    const above = airborne ? Math.max(f.h, refBottom - (f.bottom - f.h)) : f.h;
    if (above > 0) fit = Math.min(fit, (footY - margin) / above);
    fit = Math.min(fit, (cellW - 2 * margin) / f.w);
  }
  return fit;
}

/**
 * Where each frame of a clip row goes inside its atlas cell. The whole row shares the ground line
 * (`refBottom`): a frame that sits `raw` output px above/below it keeps that offset (jump preserved),
 * except grounded rows and offsets within `snap` px, which are pulled onto the baseline (drift noise).
 * `raw` is returned so QA can report drift on rows that must stay grounded; `shifted` = nudged sideways to stay in the cell, `clipped` = actually cut.
 */
export function planRow(frames, scale, refBottom, { cellW, cellH = 96, footY = 92, airborne, snap = 3 }) {
  return frames.map((f) => {
    const dw = Math.max(1, Math.round(f.w * scale));
    const dh = Math.max(1, Math.round(f.h * scale));
    const raw = Math.round((f.bottom - refBottom) * scale);
    const delta = !airborne || Math.abs(raw) <= snap ? 0 : raw;
    let bottomY = footY + delta;
    let clipped = false;
    let shifted = false;
    if (bottomY > cellH) {
      bottomY = cellH;
      clipped = true;
    }
    const dy = bottomY - dh;
    if (dy < 0) clipped = true;
    let dx = Math.round(cellW / 2 - f.cx * scale);
    if (dx < 0) {
      dx = 0;
      shifted = true;
    }
    if (dx + dw > cellW) {
      dx = cellW - dw;
      shifted = true;
    }
    return { dx, dy, dw, dh, raw, delta, clipped, shifted };
  });
}

/** Cell-height-normalised scale: sheets whose grid cells are taller/shorter were drawn proportionally smaller/larger. */
export function scaleByCell(refScale, refCellH, sheetCellH) {
  return refScale * (refCellH / sheetCellH);
}

/**
 * Cuts frames that only touch at a tip (a boot on a neighbour's hair, ...) apart. A connected component whose
 * bbox holds the centre of two or more grid cells is eroded step by step until it falls into 2+ significant
 * pieces; every pixel of the component is then given to the nearest piece (geodesic growth) and the pixels on
 * the seam are cleared, so the pieces stop being 8-connected. Mutates `img` (alpha must already be 0/255).
 * Returns the number of components that were split.
 */
export function splitTouching(img, cells, { threshold = 128, maxErode = 8, minPieceRatio = 0.08 } = {}) {
  const { width, height, data } = img;
  const label = labelComponentsSimple(img, threshold);
  let splits = 0;
  for (const comp of label.comps) {
    const centres = cells.filter((c) => {
      const cx = c.x + c.w / 2;
      const cy = c.y + c.h / 2;
      return cx >= comp.x0 && cx <= comp.x1 && cy >= comp.y0 && cy <= comp.y1;
    });
    if (centres.length < 2) continue;
    const w = comp.x1 - comp.x0 + 1;
    const h = comp.y1 - comp.y0 + 1;
    const inComp = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) inComp[y * w + x] = label.labels[(comp.y0 + y) * width + comp.x0 + x] === comp.id ? 1 : 0;

    let mask = inComp;
    let seeds = null;
    for (let step = 1; step <= maxErode && !seeds; step++) {
      const next = new Uint8Array(w * h);
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          if (!mask[y * w + x]) continue;
          let keep = 1;
          for (let dy = -1; dy <= 1 && keep; dy++) for (let dx = -1; dx <= 1; dx++) if (!mask[(y + dy) * w + x + dx]) { keep = 0; break; }
          next[y * w + x] = keep;
        }
      }
      mask = next;
      const pieces = labelMask(mask, w, h);
      const big = pieces.areas.map((a, i) => [a, i + 1]).filter(([a]) => a >= comp.area * minPieceRatio);
      if (big.length >= 2) seeds = { labels: pieces.labels, ids: big.map(([, id]) => id) };
      if (pieces.areas.length === 0) break;
    }
    if (!seeds) continue;

    const owner = new Int32Array(w * h);
    let frontier = [];
    seeds.ids.forEach((id, n) => {
      for (let i = 0; i < w * h; i++) if (seeds.labels[i] === id) { owner[i] = n + 1; frontier.push(i); }
    });
    while (frontier.length) {
      const next = [];
      for (const i of frontier) {
        const x = i % w;
        const y = (i - x) / w;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            const j = ny * w + nx;
            if (inComp[j] && !owner[j]) { owner[j] = owner[i]; next.push(j); }
          }
        }
      }
      frontier = next;
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const a = owner[i];
        if (!inComp[i] || !a) continue;
        let seam = false;
        for (let dy = -1; dy <= 1 && !seam; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const b = owner[ny * w + nx];
          if (inComp[ny * w + nx] && b && b < a) { seam = true; break; }
        }
        if (seam) {
          const o = ((comp.y0 + y) * width + comp.x0 + x) * 4;
          data[o] = data[o + 1] = data[o + 2] = data[o + 3] = 0;
        }
      }
    }
    splits++;
  }
  return splits;
}

function labelComponentsSimple(img, threshold) {
  const { width, height, data } = img;
  const labels = new Int32Array(width * height);
  const comps = [];
  const stack = new Int32Array(width * height);
  for (let start = 0; start < labels.length; start++) {
    if (labels[start] || data[start * 4 + 3] < threshold) continue;
    const id = comps.length + 1;
    let sp = 0;
    stack[sp++] = start;
    labels[start] = id;
    const comp = { id, area: 0, x0: width, y0: height, x1: -1, y1: -1 };
    while (sp > 0) {
      const p = stack[--sp];
      const px = p % width, py = (p - px) / width;
      comp.area++;
      if (px < comp.x0) comp.x0 = px;
      if (px > comp.x1) comp.x1 = px;
      if (py < comp.y0) comp.y0 = py;
      if (py > comp.y1) comp.y1 = py;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = px + dx, ny = py + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const n = ny * width + nx;
        if (!labels[n] && data[n * 4 + 3] >= threshold) { labels[n] = id; stack[sp++] = n; }
      }
    }
    comps.push(comp);
  }
  return { labels, comps };
}

function labelMask(mask, w, h) {
  const labels = new Int32Array(w * h);
  const areas = [];
  const stack = [];
  for (let s = 0; s < w * h; s++) {
    if (!mask[s] || labels[s]) continue;
    const id = areas.length + 1;
    let area = 0;
    stack.push(s);
    labels[s] = id;
    while (stack.length) {
      const p = stack.pop();
      area++;
      const px = p % w, py = (p - px) / w;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = px + dx, ny = py + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const n = ny * w + nx;
        if (mask[n] && !labels[n]) { labels[n] = id; stack.push(n); }
      }
    }
    areas.push(area);
  }
  return { labels, areas };
}
