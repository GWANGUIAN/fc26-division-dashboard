/**
 * Converts the AI-generated 잔디동 월드 originals in tmp/world-src/<category>/ into the game-ready
 * WebP assets in src/web/assets/world/<category>/ (spec: docs/world/08-implementation-roadmap.md §3,
 * slot/ID/size tables: scripts/world-art-manifest.json). Originals are never deleted so they can be
 * re-worked and re-converted.
 *
 * Run with: pnpm convert:world-art -- <category> [name] [flags]
 *   pnpm convert:world-art -- characters janine95kim   one character (stand/turn/walk/portrait as available)
 *   pnpm convert:world-art -- characters janine95kim --stand-only  only that character's standing sprite
 *   pnpm convert:world-art -- characters               every character
 *   pnpm convert:world-art -- terrain core             one terrain sheet
 *   pnpm convert:world-art -- props trees              one prop sheet
 *   pnpm convert:world-art -- buildings clubhouse      one building
 *   pnpm convert:world-art -- interiors house-doormomo one interior
 *   pnpm convert:world-art -- ui frames-dialog         one UI sheet or single (fab-normal, loading-bg, ...)
 *   pnpm convert:world-art -- fx markers               one FX sheet
 *   pnpm convert:world-art -- rush obstacles           one rush sheet or single (bg-far, ground, ...)
 *   pnpm convert:world-art -- --all                    everything that has an original
 * Flags: --tolerance N (chroma-key distance, default 40) · --palette [N] (quantize sprites, default 48)
 *        --seamless (cross-fade terrain tile edges) · --quality N (lossy WebP quality, default 92)
 *        --stand-only (characters: regenerate only a human character's stand WebP)
 *
 * Every run prints QA warnings (clipped cells, foot-line drift, symmetry, leftover magenta, ...) and
 * writes tmp/world-src/qa-report.json with the same list plus originals that were not found.
 */
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import * as M from "./lib/world-art-math.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const srcRoot = path.join(rootDir, "tmp", "world-src");
const outRoot = path.join(rootDir, "src", "web", "assets", "world");
const manifest = JSON.parse(readFileSync(path.join(__dirname, "world-art-manifest.json"), "utf8"));

// ---------------------------------------------------------------------------------------------
// QA thresholds
const FOOT_DEVIATION_WARN_PX = 3;
const SYMMETRY_WARN = 0.08;
const SEAM_WARN = 0.25;
const MAGENTA_WARN_SPRITE = 3;
const MAGENTA_WARN_OPAQUE = 50;
const ASPECT_WARN = 0.25;
const FAINT_ALPHA = 16;

// ---------------------------------------------------------------------------------------------
// Args
const rawArgs = process.argv.slice(2).filter((arg) => arg !== "--");
const flags = { all: false, tolerance: 40, palette: 0, seamless: false, quality: 92, standOnly: false };
const positional = [];
for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i];
  if (arg === "--all") flags.all = true;
  else if (arg === "--stand-only") flags.standOnly = true;
  else if (arg === "--seamless") flags.seamless = true;
  else if (arg === "--tolerance") flags.tolerance = Number(rawArgs[++i]);
  else if (arg === "--quality") flags.quality = Number(rawArgs[++i]);
  else if (arg === "--palette") {
    const next = rawArgs[i + 1];
    flags.palette = next && /^\d+$/.test(next) ? Number(rawArgs[++i]) : 48;
  } else if (arg.startsWith("--")) {
    console.error(`Unknown flag ${arg}`);
    process.exit(1);
  } else positional.push(arg);
}

const report = { converted: [], missing: [], warnings: [] };
const rel = (file) => path.relative(rootDir, file).replaceAll("\\", "/");
// kind: foot | magenta | symmetry | aspect | edge | seam | scale | empty | other
function warn(target, message, kind = "other") {
  report.warnings.push({ kind, target, message });
  console.warn(`  ! [${kind}] ${target}: ${message}`);
}

// ---------------------------------------------------------------------------------------------
// IO
async function loadRaster(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength), width: info.width, height: info.height };
}

function sourceFile(category, name) {
  const file = path.join(srcRoot, category, `${name}.png`);
  if (existsSync(file)) return file;
  report.missing.push(rel(file));
  console.warn(`  ? original not found: ${rel(file)}`);
  return null;
}

async function toSharp(raster) {
  return sharp(Buffer.from(raster.data.buffer, raster.data.byteOffset, raster.data.byteLength), {
    raw: { width: raster.width, height: raster.height, channels: 4 },
  });
}

async function saveRaster(raster, category, name, { lossless = true, note = "" } = {}) {
  const outFile = path.join(outRoot, category, `${name}.webp`);
  mkdirSync(path.dirname(outFile), { recursive: true });
  const image = await toSharp(raster);
  await image
    .webp(lossless ? { lossless: true } : { quality: flags.quality, alphaQuality: 100 })
    .toFile(outFile);
  report.converted.push(rel(outFile));
  console.log(`  ✓ ${rel(outFile)} (${raster.width}×${raster.height}${note ? ", " + note : ""})`);
}

async function quantize(raster, colours) {
  const image = await toSharp(raster);
  const png = await image.png({ palette: true, colours, dither: 0 }).toBuffer();
  return loadRasterFromBuffer(png);
}

async function loadRasterFromBuffer(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength), width: info.width, height: info.height };
}

async function modulateRaster(raster, options) {
  const image = await toSharp(raster);
  const { data, info } = await image.modulate(options).raw().toBuffer({ resolveWithObject: true });
  return { data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength), width: info.width, height: info.height };
}

async function witherRaster(raster) {
  const cfg = manifest.withered;
  const modulated = await modulateRaster(raster, { saturation: cfg.saturation, brightness: cfg.brightness, hue: cfg.hue });
  return M.tintBlend(modulated, M.parseHexColor(cfg.tint), cfg.tintAmount);
}

// ---------------------------------------------------------------------------------------------
// Alpha handling
/**
 * Returns a raster with a usable alpha channel: existing transparency is kept (faint halo alpha is
 * cleared), opaque images get their #FF00FF background keyed out when the corners look magenta,
 * anything else is left opaque.
 */
function normalizeAlpha(raster, target) {
  const total = raster.width * raster.height;
  let clear = 0;
  for (let i = 3; i < raster.data.length; i += 4) if (raster.data[i] < 255) clear++;
  if (clear / total > 0.005) {
    for (let i = 0; i < raster.data.length; i += 4) {
      if (raster.data[i + 3] < FAINT_ALPHA) raster.data[i] = raster.data[i + 1] = raster.data[i + 2] = raster.data[i + 3] = 0;
    }
    return { raster, keyed: false };
  }
  const corners = [[2, 2], [raster.width - 3, 2], [2, raster.height - 3], [raster.width - 3, raster.height - 3]];
  const magentaCorners = corners.filter(([x, y]) => {
    const i = (y * raster.width + x) * 4;
    return Math.hypot(raster.data[i] - 255, raster.data[i + 1], raster.data[i + 2] - 255) <= flags.tolerance;
  }).length;
  if (magentaCorners < 3) return { raster, keyed: false };
  const removed = M.chromaKey(raster, [255, 0, 255], flags.tolerance);
  const fixed = M.despillMagenta(raster);
  console.log(`  · ${target}: chroma-keyed ${removed}px (despill ${fixed}px)`);
  return { raster, keyed: true };
}

function warnMagenta(target, raster, opaque = false) {
  const count = M.countMagenta(raster);
  const limit = opaque ? MAGENTA_WARN_OPAQUE : MAGENTA_WARN_SPRITE;
  if (count >= limit) warn(target, `마젠타(#FF00FF 계열) 잔여 ${count}px${opaque ? " — 의도한 네온/룬 색일 수 있음" : ""}`, "magenta");
}

// ---------------------------------------------------------------------------------------------
// Sprite rendering
/**
 * Draws the trimmed `bbox` region of `source` into a w×h canvas (or a tight fitted raster when
 * `pad` is false): aspect preserved, snapped to hard alpha unless `soft`.
 */
async function renderSprite(source, bbox, w, h, { scale, align = "bottom", pad = true, soft = false } = {}) {
  const trimmed = M.cropRaster(source, bbox);
  const s = scale ?? Math.min(w / bbox.w, h / bbox.h);
  const dw = Math.min(w, Math.max(1, Math.round(bbox.w * s)));
  const dh = Math.min(h, Math.max(1, Math.round(bbox.h * s)));
  let scaled = M.boxDownscale(trimmed, dw, dh);
  if (!soft) M.snapAlpha(scaled);
  if (flags.palette) scaled = await quantize(scaled, flags.palette);
  if (!pad) return { raster: scaled, scale: s };
  const canvas = M.createRaster(w, h);
  const x = Math.round((w - dw) / 2);
  const y = align === "center" ? Math.round((h - dh) / 2) : h - dh;
  M.blit(canvas, scaled, x, y);
  return { raster: canvas, scale: s };
}

function aspectMismatch(bbox, w, h) {
  return Math.abs(bbox.w / bbox.h / (w / h) - 1);
}

function warnAspect(target, bbox, w, h) {
  const diff = aspectMismatch(bbox, w, h);
  if (diff > ASPECT_WARN) warn(target, `종횡비 차이 ${(diff * 100).toFixed(0)}% (원본 트림 ${bbox.w}×${bbox.h} → 목표 ${w}×${h}), 남는 쪽은 투명 여백`, "aspect");
}

// ---------------------------------------------------------------------------------------------
// Sprite extraction
// The generated sheets never sit exactly on their grid (objects drift and cross cell borders, and a
// wide glow is baked around every sprite), so sprites are pulled out by connected component:
// alpha < 240 (the glow) is ignored and each component belongs to the cell holding its centroid.
const HARD = { threshold: 240, gap: 24 };
const SOFT = { threshold: 64, gap: 24, softMargin: 12 };

function extractGrid(raster, cols, rows, options = HARD) {
  const cells = M.gridCells(raster.width, raster.height, cols, rows);
  return { cells, sprites: M.extractSprites(raster, cells, options) };
}

function extractOne(raster, options = HARD) {
  const [sprite] = M.extractSprites(raster, M.gridCells(raster.width, raster.height, 1, 1), { ...options, gap: 60 });
  return sprite;
}

const fullBox = (raster) => ({ x: 0, y: 0, w: raster.width, h: raster.height });

// ---------------------------------------------------------------------------------------------
// Sheets of many sprites (props, fx, ui sheets, rush obstacles)
async function convertSprites({ sourceName, srcCategory, grid, slots, outCategory, lossless = true }) {
  const file = sourceFile(srcCategory, sourceName);
  if (!file) return;
  console.log(`${sourceName}`);
  const { raster } = normalizeAlpha(await loadRaster(file), sourceName);
  const hard = extractGrid(raster, grid[0], grid[1], HARD);
  const soft = slots.some((slot) => slot[3]?.soft) ? extractGrid(raster, grid[0], grid[1], SOFT) : null;
  if (slots.length !== hard.cells.length) throw new Error(`${sourceName}: ${slots.length} slots for ${hard.cells.length} cells`);

  const prepared = slots.map(([id, w, h, opts = {}], index) => {
    const sprite = (opts.soft ? soft : hard).sprites[index];
    const target = `${outCategory}/${id}`;
    if (!sprite) {
      warn(target, "셀이 비어 있음(오브젝트 없음 또는 알파 240 미만)", "empty");
      return null;
    }
    if (M.bboxTouchesEdge(sprite.bbox, raster.width, raster.height, 1)) warn(target, "오브젝트가 시트 가장자리에 닿음(잘렸을 수 있음)", "edge");
    if (sprite.dropped) console.log(`  · ${target}: 떨어진 잡티 ${sprite.dropped}개 제외`);
    return { id, w, h, opts, cell: sprite.raster, bbox: fullBox(sprite.raster) };
  });

  const groupScale = new Map();
  for (const item of prepared) {
    if (!item?.opts.anim) continue;
    const fit = Math.min(item.w / item.bbox.w, item.h / item.bbox.h);
    groupScale.set(item.opts.anim, Math.min(groupScale.get(item.opts.anim) ?? Infinity, fit));
  }

  for (const item of prepared) {
    if (!item) continue;
    const { id, w, h, opts, cell, bbox } = item;
    const target = `${outCategory}/${id}`;
    const frame = opts.slice !== undefined;
    const { raster: sprite, scale } = await renderSprite(cell, bbox, w, h, {
      scale: opts.anim ? groupScale.get(opts.anim) : undefined,
      align: opts.align ?? "bottom",
      pad: !frame,
      soft: opts.soft,
    });
    if (opts.opaqueInterior) M.sealInteriorAlpha(sprite, opts.slice, opts.interiorFill);
    if (scale > 1.001) warn(target, `원본(${bbox.w}×${bbox.h})이 목표(${w}×${h})보다 작아 확대됨(x${scale.toFixed(2)})`, "scale");
    if (!frame && !opts.anim) warnAspect(target, bbox, w, h);
    if (frame) {
      const sym = M.symmetryError(sprite);
      if (opts.symmetry === "lr") sym.tb = 0; // e.g. tabs with rounded top corners are not top-bottom symmetric
      if (sym.lr > SYMMETRY_WARN || sym.tb > SYMMETRY_WARN) warn(target, `9-slice 대칭 오차 좌우 ${sym.lr.toFixed(3)} / 상하 ${sym.tb.toFixed(3)} (허용 ${SYMMETRY_WARN})`, "symmetry");
      if (sprite.width <= opts.slice * 2 || sprite.height <= opts.slice * 2) warn(target, `9-slice(slice ${opts.slice}) 불가: 변환 크기 ${sprite.width}×${sprite.height}`, "symmetry");
      else if (Math.abs(sprite.width / w - 1) > 0.02 && Math.abs(sprite.height / h - 1) > 0.02) console.log(`  · ${target}: 프레임 원본 비율 유지 → ${sprite.width}×${sprite.height} (목표 ${w}×${h})`);
    }
    warnMagenta(target, sprite);
    await saveRaster(sprite, outCategory, id, { lossless, note: opts.anim ? `anim ${opts.anim}` : "" });
    if (opts.withered) {
      await saveRaster(await witherRaster(sprite), outCategory, `${id}-withered`, { lossless });
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Characters
function characterFrames(raster, cols, rows, target, name) {
  const { cells, sprites } = extractGrid(raster, cols, rows, HARD);
  return sprites.map((sprite, index) => {
    const label = `${target}-${name} r${cells[index].row + 1}c${cells[index].col + 1}`;
    if (!sprite) {
      warn(label, "셀이 비어 있음", "empty");
      return null;
    }
    if (M.bboxTouchesEdge(sprite.bbox, raster.width, raster.height, 1)) warn(label, "캐릭터가 시트 가장자리에 닿음(잘렸을 수 있음)", "edge");
    if (sprite.dropped) console.log(`  · ${label}: 떨어진 잡티 ${sprite.dropped}개 제외`);
    const bbox = fullBox(sprite.raster);
    return {
      label,
      bbox,
      trimmed: sprite.raster,
      bottomInCell: sprite.bbox.y + sprite.bbox.h - cells[index].y,
      centroidX: M.alphaCentroidX(sprite.raster, bbox),
    };
  });
}

async function convertCharacter(id) {
  const cfg = manifest.characters;
  const animal = cfg.animals.includes(id);
  console.log(`characters/${id}`);
  const load = async (kind) => {
    const file = sourceFile("characters", `char-${id}-${kind}`);
    if (!file) return null;
    return normalizeAlpha(await loadRaster(file), `char-${id}-${kind}`).raster;
  };

  const walkRaster = flags.standOnly ? null : await load("walk");
  const turnRaster = flags.standOnly || animal ? null : await load("turn");
  const frame = animal ? cfg.animalFrame : cfg.frame;
  const target = `characters/${id}`;

  if (walkRaster || turnRaster) {
    const walkCells = walkRaster ? characterFrames(walkRaster, 4, 3, target, "walk") : [];
    const turnCells = turnRaster ? characterFrames(turnRaster, 3, 1, target, "turn") : [];
    const all = [...walkCells, ...turnCells].filter(Boolean);
    if (all.length === 0) {
      warn(target, "walk/turn 프레임이 모두 비어 있음");
    } else {
      // The turn and walk sheets are drawn at different source scales, so each sheet gets its own
      // scale: its standing (turn-front) or front-walk height maps to standHeight, shrunk only if some
      // frame would not fit. Animals have no standing reference, so the largest frame just has to fit.
      const scaleFrames = (frames, standBoxHeight, label) => {
        const list = frames.filter(Boolean);
        if (list.length === 0) return;
        const sizing = M.characterScale({
          standBoxHeight,
          standHeight: animal ? Infinity : cfg.frame.standHeight,
          boxes: list.map((f) => f.bbox),
          frameW: frame.w,
          frameH: frame.h,
          footInset: frame.footInset,
        });
        if (!animal && sizing.reduced && sizing.reductionRatio < 0.93) {
          warn(target, `${label}: 프레임(${frame.w}×${frame.h})에 맞추려고 스케일을 ${(sizing.reductionRatio * 100).toFixed(0)}%로 축소(가장 큰 프레임이 서 있는 자세보다 큼: 머리 장식/팔 벌림 확인)`);
        }
        for (const f of list) f.scale = sizing.scale;
        console.log(`  · ${label} scale ${sizing.scale.toFixed(4)} (기준 높이 ${Math.round(standBoxHeight)}px → ${Math.round(standBoxHeight * sizing.scale)}px)`);
      };
      const frontWalkHeights = walkCells.slice(0, 4).filter(Boolean).map((f) => f.bbox.h);
      scaleFrames(turnCells, turnCells[0]?.bbox.h ?? 1, "turn");
      scaleFrames(walkCells, M.median(frontWalkHeights) || 1, "walk");
      if (!turnCells[0] && !animal) warn(target, "turn 시트 없음: idle 프레임은 walk 2번째 프레임으로 대체");

      // Foot-line drift inside each source sheet (bbox bottom in its cell, in output px).
      for (const [label, frames] of [["walk", walkCells], ["turn", turnCells]]) {
        const list = frames.filter(Boolean);
        const bottoms = list.map((f) => f.bottomInCell * f.scale);
        if (bottoms.length > 1) {
          const dev = M.maxDeviation(bottoms);
          console.log(`  · ${label} 발끝 편차 최대 ${dev.toFixed(1)}px`);
          if (dev > FOOT_DEVIATION_WARN_PX) warn(target, `${label} 발끝 편차 ${dev.toFixed(1)}px (허용 ${FOOT_DEVIATION_WARN_PX}px) — 스크립트가 정렬해 주지만 걸음 높이가 원본과 달라질 수 있음`, "foot");
        }
      }

      const atlas = M.createRaster(frame.w * 4, frame.h * 4);
      const place = (source, col, row) => {
        if (!source) return;
        const dw = Math.max(1, Math.round(source.bbox.w * source.scale));
        const dh = Math.max(1, Math.round(source.bbox.h * source.scale));
        const sprite = M.snapAlpha(M.boxDownscale(source.trimmed, dw, dh));
        const placement = M.placeInFrame({ scaledW: dw, scaledH: dh, centroidX: source.centroidX * source.scale, frameW: frame.w, frameH: frame.h, footInset: frame.footInset });
        if (placement.clamped) console.log(`  · ${source.label}: 프레임 좌우 끝에 맞춰 이동`);
        if (placement.dy < 0) warn(target, `${source.label}: 프레임 위로 ${-placement.dy}px 잘림`);
        M.blit(atlas, sprite, col * frame.w + placement.dx, row * frame.h + Math.max(0, placement.dy));
      };
      // Row 0 = idle (down, right, up). Animals reuse the passing (2nd) walk frame of each row.
      const idle = !animal && turnCells.length === 3 ? turnCells : [1, 5, 9].map((index) => walkCells[index]);
      idle.forEach((source, col) => place(source, col, 0));
      walkCells.forEach((source, index) => place(source, index % 4, 1 + Math.floor(index / 4)));

      if (flags.palette) atlas.data.set((await quantize(atlas, flags.palette)).data);
      warnMagenta(`${target}-atlas`, atlas);
      await saveRaster(atlas, "characters", `${id}-atlas`);

      if (!animal) {
        for (const derived of cfg.derived.filter((entry) => entry.from === id)) {
          const copy = { data: Uint8ClampedArray.from(atlas.data), width: atlas.width, height: atlas.height };
          const result = derived.kind === "gardener"
            ? M.swapToGardener(copy)
            : await modulateRaster(copy, { saturation: 1.25, brightness: 1.1, hue: 8 });
          await saveRaster(result, "characters", `${derived.id}-atlas`, { note: `derived from ${id}` });
        }
      }
    }
  }

  if (animal) return;

  const standRaster = await load("stand");
  if (standRaster) {
    const sprite = extractOne(standRaster);
    if (!sprite) warn(`${target}-stand`, "비어 있음");
    else {
      const height = Math.min(cfg.standHeight, sprite.raster.height);
      const { raster } = await renderSprite(sprite.raster, fullBox(sprite.raster), Math.ceil((sprite.raster.width * height) / sprite.raster.height), height);
      warnMagenta(`${target}-stand`, raster);
      await saveRaster(raster, "characters", `${id}-stand`);
    }
  }

  if (flags.standOnly) return;

  const portraitRaster = await load("portrait");
  if (portraitRaster) {
    const size = cfg.portrait;
    const { sprites } = extractGrid(portraitRaster, 2, 2, HARD);
    const names = ["neutral", "happy", "surprised", "worried"];
    const usable = sprites.filter(Boolean);
    if (usable.length === 0) warn(`${target}-portrait`, "비어 있음");
    else {
      const common = Math.min(...usable.map((s) => Math.min(size / s.raster.width, size / s.raster.height)));
      for (let index = 0; index < 4; index++) {
        const sprite = sprites[index];
        const label = `${target}-portrait-${names[index]}`;
        if (!sprite) { warn(label, "표정 칸이 비어 있음"); continue; }
        // busts are cropped at the shoulders by design, so only the top and sides count
        const b = sprite.bbox;
        if (b.x < 1 || b.y < 1 || b.x + b.w > portraitRaster.width - 1) warn(label, "시트 가장자리에 닿음(잘렸을 수 있음)", "edge");
        const { raster } = await renderSprite(sprite.raster, fullBox(sprite.raster), size, size, { scale: common, align: "bottom" });
        warnMagenta(label, raster);
        await saveRaster(raster, "portraits", `${id}-${names[index]}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Terrain
async function convertTerrain(name) {
  const cfg = manifest.terrain[name];
  if (!cfg) throw new Error(`Unknown terrain sheet "${name}"`);
  const file = sourceFile("terrain", `terrain-${name}`);
  if (!file) return;
  console.log(`terrain/${name}`);
  const raster = await loadRaster(file);
  const cells = M.gridCells(raster.width, raster.height, 4, 4);
  const sheet = M.createRaster(128, 128);
  let worstSeam = { id: "", value: 0 };
  cells.forEach((cell, index) => {
    let tile = M.boxDownscale(M.cropRaster(raster, cell), 32, 32);
    if (flags.seamless) tile = M.makeSeamless(tile, { x: true, y: true });
    const seam = M.seamError(tile);
    const value = Math.max(seam.x, seam.y);
    if (value > worstSeam.value) worstSeam = { id: cfg.slots[index], value };
    M.blit(sheet, tile, cell.col * 32, cell.row * 32);
  });
  console.log(`  · 최악 이음매 오차 ${worstSeam.value.toFixed(3)} (${worstSeam.id})`);
  if (worstSeam.value > SEAM_WARN) warn(`terrain/${name}`, `타일 이음매 오차 ${worstSeam.value.toFixed(3)} (${worstSeam.id}) — --seamless로 보정하거나 재생성 고려`, "seam");
  await saveRaster(sheet, "terrain", name);
  if (cfg.withered) await saveRaster(await witherRaster(sheet), "terrain", `${name}-withered`);
}

// ---------------------------------------------------------------------------------------------
// Single images: buildings, interiors, ui singles, rush singles
async function convertBuilding(id) {
  const size = manifest.buildings[id];
  if (!size) throw new Error(`Unknown building "${id}"`);
  const file = sourceFile("buildings", `bld-${id}`);
  if (!file) return;
  console.log(`buildings/${id}`);
  const { raster } = normalizeAlpha(await loadRaster(file), `bld-${id}`);
  const sprite = extractOne(raster);
  if (!sprite) return warn(`buildings/${id}`, "비어 있음");
  const [w, h] = size;
  const bbox = fullBox(sprite.raster);
  warnAspect(`buildings/${id}`, bbox, w, h);
  const { raster: out, scale } = await renderSprite(sprite.raster, bbox, w, h, { align: "bottom" });
  if (scale > 1.001) warn(`buildings/${id}`, `원본이 목표보다 작아 확대됨(x${scale.toFixed(2)})`, "scale");
  warnMagenta(`buildings/${id}`, out);
  await saveRaster(out, "buildings", id, { lossless: false });
}

async function convertInterior(id) {
  if (!manifest.interiors.ids.includes(id)) throw new Error(`Unknown interior "${id}"`);
  const file = sourceFile("interiors", `int-${id}`);
  if (!file) return;
  console.log(`interiors/int-${id}`);
  const raster = await loadRaster(file);
  const [w, h] = manifest.interiors.size;
  if (manifest.interiors.sourceWidth && raster.width !== manifest.interiors.sourceWidth) warn(`interiors/int-${id}`, `원본 폭 ${raster.width}px (S7 기준 ${manifest.interiors.sourceWidth}px)`, "source-size");
  const crop = M.cropRaster(raster, M.coverCropRect(raster.width, raster.height, w, h));
  const out = M.boxDownscale(crop, w, h);
  for (let i = 3; i < out.data.length; i += 4) out.data[i] = 255;
  warnMagenta(`interiors/int-${id}`, out, true);
  await saveRaster(out, "interiors", `int-${id}`, { lossless: manifest.interiors.lossless === true });
}

async function convertSingle(category, id, cfg) {
  const file = sourceFile(category, cfg.src);
  if (!file) return;
  console.log(`${category}/${id}`);
  const target = `${category}/${id}`;
  let raster = await loadRaster(file);
  let out;
  let lossless = true;
  if (cfg.mode === "cover") {
    const crop = M.cropRaster(raster, M.coverCropRect(raster.width, raster.height, cfg.w, cfg.h));
    out = M.boxDownscale(crop, cfg.w, cfg.h);
    for (let i = 3; i < out.data.length; i += 4) out.data[i] = 255;
    warnMagenta(target, out, true);
    lossless = cfg.lossless === true;
  } else {
    raster = normalizeAlpha(raster, cfg.src).raster;
    const sprite = extractOne(raster, cfg.soft ? SOFT : HARD);
    if (!sprite) return warn(target, "비어 있음");
    const bbox = fullBox(sprite.raster);
    if (cfg.mode === "width") {
      const scale = Math.min(cfg.w / bbox.w, cfg.h / bbox.h);
      out = (await renderSprite(sprite.raster, bbox, cfg.w, cfg.h, { scale, align: "bottom" })).raster;
      if (bbox.w * scale < cfg.w - 2) warn(target, `높이 제한(${cfg.h}px) 때문에 가로 ${cfg.w}px를 못 채움(트림 ${bbox.w}×${bbox.h}) — 반복 시 틈 생김`);
    } else {
      warnAspect(target, bbox, cfg.w, cfg.h);
      const result = await renderSprite(sprite.raster, bbox, cfg.w, cfg.h, { align: "center", soft: cfg.soft });
      if (result.scale > 1.001) warn(target, `원본이 목표보다 작아 확대됨(x${result.scale.toFixed(2)})`, "scale");
      out = result.raster;
    }
    warnMagenta(target, out);
  }
  if (cfg.seamlessX) {
    const before = M.seamError(out).x;
    out = M.makeSeamless(out, { x: true, y: false });
    console.log(`  · 가로 이음매 오차 ${before.toFixed(3)} → ${M.seamError(out).x.toFixed(3)}`);
  }
  await saveRaster(out, category, id, { lossless });
}

// ---------------------------------------------------------------------------------------------
// Dispatch
const CATEGORIES = ["characters", "terrain", "props", "buildings", "interiors", "ui", "fx", "rush"];

function unknown(category, name, known) {
  throw new Error(`Unknown ${category} "${name}". Known: ${known.join(", ")}`);
}

async function run(category, name) {
  switch (category) {
    case "characters": {
      const ids = [...manifest.characters.humans, ...manifest.characters.animals];
      const targets = name ? [name] : ids;
      for (const id of targets) {
        if (!ids.includes(id)) unknown(category, id, ids);
        await convertCharacter(id);
      }
      return;
    }
    case "terrain": {
      const names = Object.keys(manifest.terrain);
      for (const sheet of name ? [name] : names) {
        if (!names.includes(sheet)) unknown(category, sheet, names);
        await convertTerrain(sheet);
      }
      return;
    }
    case "props": {
      const names = Object.keys(manifest.props);
      for (const sheet of name ? [name] : names) {
        if (!names.includes(sheet)) unknown(category, sheet, names);
        await convertSprites({ srcCategory: "props", sourceName: `props-${sheet}`, grid: [4, 3], slots: manifest.props[sheet], outCategory: "props" });
      }
      return;
    }
    case "buildings": {
      const ids = Object.keys(manifest.buildings);
      for (const id of name ? [name] : ids) {
        if (!ids.includes(id)) unknown(category, id, ids);
        await convertBuilding(id);
      }
      return;
    }
    case "interiors": {
      const ids = manifest.interiors.ids;
      for (const id of name ? [name] : ids) {
        if (!ids.includes(id)) unknown(category, id, ids);
        await convertInterior(id);
      }
      return;
    }
    case "ui": {
      const sheets = Object.keys(manifest.ui.sheets);
      const singles = Object.keys(manifest.ui.singles);
      for (const item of name ? [name] : [...singles, ...sheets]) {
        if (manifest.ui.singles[item]) await convertSingle("ui", item, manifest.ui.singles[item]);
        else if (manifest.ui.sheets[item]) {
          const sheet = manifest.ui.sheets[item];
          await convertSprites({ srcCategory: "ui", sourceName: `ui-${item}`, grid: sheet.grid, slots: sheet.slots, outCategory: "ui" });
        } else unknown(category, item, [...singles, ...sheets]);
      }
      return;
    }
    case "fx": {
      const names = Object.keys(manifest.fx);
      for (const sheet of name ? [name] : names) {
        if (!names.includes(sheet)) unknown(category, sheet, names);
        await convertSprites({ srcCategory: "fx", sourceName: `fx-${sheet}`, grid: [4, 3], slots: manifest.fx[sheet], outCategory: "fx" });
      }
      return;
    }
    case "rush": {
      const singles = Object.keys(manifest.rush.singles);
      for (const item of name ? [name] : [...singles, "obstacles"]) {
        if (manifest.rush.singles[item]) await convertSingle("rush", item, manifest.rush.singles[item]);
        else if (item === "obstacles") {
          await convertSprites({ srcCategory: "rush", sourceName: "rush-obstacles", grid: [4, 3], slots: manifest.rush.obstacles, outCategory: "rush" });
        } else unknown(category, item, [...singles, "obstacles"]);
      }
      return;
    }
    default:
      throw new Error(`Unknown category "${category}". Known: ${CATEGORIES.join(", ")}`);
  }
}

async function main() {
  if (!flags.all && positional.length === 0) {
    console.error("Usage: pnpm convert:world-art -- <category> [name] | --all   (categories: " + CATEGORIES.join(", ") + ")");
    process.exit(1);
  }
  if (flags.all) {
    for (const category of CATEGORIES) {
      console.log(`\n=== ${category} ===`);
      await run(category);
    }
  } else {
    await run(positional[0], positional[1]);
  }

  const byKind = {};
  for (const w of report.warnings) byKind[w.kind] = (byKind[w.kind] ?? 0) + 1;
  console.log(`\n${report.converted.length} files written, ${report.missing.length} originals missing, ${report.warnings.length} QA warnings${report.warnings.length ? " (" + Object.entries(byKind).map(([k, v]) => `${k} ${v}`).join(", ") + ")" : ""}.`);
  if (report.missing.length) console.log("Missing originals:\n" + report.missing.map((file) => `  - ${file}`).join("\n"));
  if (flags.all) {
    mkdirSync(srcRoot, { recursive: true });
    const reportFile = path.join(srcRoot, "qa-report.json");
    writeFileSync(reportFile, JSON.stringify({ generatedAt: new Date().toISOString(), ...report }, null, 2));
    console.log(`QA report: ${rel(reportFile)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
