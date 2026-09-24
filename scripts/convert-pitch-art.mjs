/**
 * Converts the AI-generated 피치 originals in tmp/pitch-src/<category>/ into the game-ready WebP assets in
 * src/web/assets/pitch/<category>/ (spec: docs/pitch/04 §4·§6·§8 and 05, slot/cell tables:
 * scripts/pitch-art-manifest.json). Originals are never deleted so they can be re-worked and re-converted.
 * The pitch has its own pipeline: it never reads anything under tmp/world-src or assets/world.
 *
 * Run with: pnpm convert:pitch-art -- <category> [id] [flags]
 *   pnpm convert:pitch-art -- characters woowakgood          one character (atlas + hero + 4 portraits)
 *   pnpm convert:pitch-art -- characters keeper-ai           the AI goalkeeper (atlas only)
 *   pnpm convert:pitch-art -- characters woowakgood --only run,shoot
 *                                                            re-convert only those sheets and splice them into the
 *                                                            existing atlas (other rows stay untouched)
 *   pnpm convert:pitch-art -- characters                     every character whose eight (five) sheets all exist
 *   pnpm convert:pitch-art -- env goal                       one sheet (ids: see the manifest "sheets")
 *   pnpm convert:pitch-art -- env | fx | ui | keyart         every sheet of the category
 *   pnpm convert:pitch-art -- --all                          everything that has an original
 * Flags: --tolerance N (chroma-key distance for magenta-background originals, default 40)
 *        --quality N (lossy WebP quality of the 960x540 scenes, default 90)
 *        --scene (treat the given env/keyart/ui id as a full-frame 16:9 scene: centre band crop -> 960x540)
 *        --only a,b (characters: sheet names to re-convert; field: stand idle run shoot skill-side skill-up emote
 *                    portrait, keeper: ready dive save react)
 *
 * Every run prints QA warnings and merges them into tmp/pitch-src/qa-report.json (one entry per character/sheet),
 * then rewrites src/web/pitch/data/assetMeta.generated.ts (bytes + dimensions of every converted file).
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import * as M from "./lib/world-art-math.mjs";
import * as P from "./lib/pitch-art-math.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const srcRoot = path.join(rootDir, "tmp", "pitch-src");
const outRoot = path.join(rootDir, "src", "web", "assets", "pitch");
const metaFile = path.join(rootDir, "src", "web", "pitch", "data", "assetMeta.generated.ts");
const reportFile = path.join(srcRoot, "qa-report.json");
const manifest = JSON.parse(readFileSync(path.join(__dirname, "pitch-art-manifest.json"), "utf8"));

const CATEGORIES = ["characters", "env", "fx", "ui", "keyart"];
const FIELD_SHEETS = ["stand", "idle", "run", "shoot", "skill-side", "skill-up", "emote", "portrait"];
const KEEPER_SHEETS = ["stand", "ready", "dive", "save", "react"];
const CELL = manifest.cell;
const FOOT_DEVIATION_WARN_PX = manifest.footSnapPx;
const ASPECT_WARN = 0.25;
const SYMMETRY_WARN = 0.08;
const MAGENTA_WARN = 3;
const FAINT_ALPHA = 16;
const SCALE_REDUCED_WARN = 0.93;
const HARD = { threshold: 240, gap: 24, minArea: 40 };
const SOFT = { threshold: 64, gap: 24, minArea: 40, softMargin: 12 };
/** Kinds that mean a frame/cell is unusable (everything else is a heads-up). */
const FATAL_KINDS = new Set(["empty", "grid", "clip"]);

// ---------------------------------------------------------------------------------------------
// Args
const rawArgs = process.argv.slice(2).filter((arg) => arg !== "--");
const flags = { all: false, tolerance: 40, quality: 90, scene: false, only: null };
const positional = [];
for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i];
  if (arg === "--all") flags.all = true;
  else if (arg === "--scene") flags.scene = true;
  else if (arg === "--tolerance") flags.tolerance = Number(rawArgs[++i]);
  else if (arg === "--quality") flags.quality = Number(rawArgs[++i]);
  else if (arg === "--only") flags.only = String(rawArgs[++i] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  else if (arg.startsWith("--")) {
    console.error(`Unknown flag ${arg}`);
    process.exit(1);
  } else positional.push(arg);
}

// ---------------------------------------------------------------------------------------------
// Report (merged per scope into tmp/pitch-src/qa-report.json)
const scopes = new Map(); // scope -> { converted: [], missing: [], warnings: [] }
let currentScope = "";
function scopeEntry(scope = currentScope) {
  if (!scopes.has(scope)) scopes.set(scope, { converted: [], missing: [], warnings: [] });
  return scopes.get(scope);
}
function beginScope(scope) {
  currentScope = scope;
  scopeEntry();
  console.log(scope);
}
const rel = (file) => path.relative(rootDir, file).replaceAll("\\", "/");
// kind: empty | grid | clip | edge | foot | magenta | scale | aspect | symmetry | cellfill | gap | missing
function warn(target, message, kind = "other") {
  scopeEntry().warnings.push({ kind, target, message });
  console.warn(`  ! [${kind}] ${target}: ${message}`);
}

// ---------------------------------------------------------------------------------------------
// IO
async function loadRaster(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength), width: info.width, height: info.height };
}

function sourceFile(category, name) {
  const file = path.join(srcRoot, category, name);
  if (existsSync(file)) return file;
  scopeEntry().missing.push(rel(file));
  console.warn(`  ? original not found: ${rel(file)}`);
  return null;
}

async function saveRaster(raster, category, name, { lossy = false, note = "" } = {}) {
  const outFile = path.join(outRoot, category, `${name}.webp`);
  mkdirSync(path.dirname(outFile), { recursive: true });
  const image = sharp(Buffer.from(raster.data.buffer, raster.data.byteOffset, raster.data.byteLength), {
    raw: { width: raster.width, height: raster.height, channels: 4 },
  });
  await image.webp(lossy ? { quality: flags.quality, alphaQuality: 100, effort: 6 } : { lossless: true, effort: 6 }).toFile(outFile);
  scopeEntry().converted.push(rel(outFile));
  console.log(`  ✓ ${rel(outFile)} (${raster.width}×${raster.height}${note ? ", " + note : ""})`);
}

/**
 * Returns a raster with a usable alpha channel: existing transparency is kept (faint halo alpha is cleared),
 * opaque images get their #FF00FF background keyed out when the corners look magenta.
 */
function normalizeAlpha(raster, target) {
  const total = raster.width * raster.height;
  let clear = 0;
  for (let i = 3; i < raster.data.length; i += 4) if (raster.data[i] < 255) clear++;
  if (clear / total > 0.005) {
    for (let i = 0; i < raster.data.length; i += 4) {
      if (raster.data[i + 3] < FAINT_ALPHA) raster.data[i] = raster.data[i + 1] = raster.data[i + 2] = raster.data[i + 3] = 0;
    }
    return raster;
  }
  const corners = [[2, 2], [raster.width - 3, 2], [2, raster.height - 3], [raster.width - 3, raster.height - 3]];
  const magentaCorners = corners.filter(([x, y]) => {
    const i = (y * raster.width + x) * 4;
    return Math.hypot(raster.data[i] - 255, raster.data[i + 1], raster.data[i + 2] - 255) <= flags.tolerance;
  }).length;
  if (magentaCorners < 3) return raster;
  const removed = M.chromaKey(raster, [255, 0, 255], flags.tolerance);
  const fixed = M.despillMagenta(raster);
  console.log(`  · ${target}: chroma-keyed ${removed}px (despill ${fixed}px, tolerance ${flags.tolerance})`);
  return raster;
}

function warnMagenta(target, raster) {
  const count = M.countMagenta(raster);
  if (count >= MAGENTA_WARN) warn(target, `마젠타(#FF00FF 계열) 잔여 ${count}px`, "magenta");
}

const fullBox = (raster) => ({ x: 0, y: 0, w: raster.width, h: raster.height });

/** Scales an already trimmed sprite into a w×h canvas (aspect kept) or a tight raster; hard alpha unless `soft`. */
function renderSprite(raster, w, h, { scale, align = "bottom", pad = true, soft = false, fill = false } = {}) {
  const s = scale ?? Math.min(w / raster.width, h / raster.height);
  const dw = fill ? w : Math.min(w, Math.max(1, Math.round(raster.width * s)));
  const dh = fill ? h : Math.min(h, Math.max(1, Math.round(raster.height * s)));
  const scaled = M.boxDownscale(raster, dw, dh);
  if (!soft) M.snapAlpha(scaled);
  if (!pad) return { raster: scaled, scale: s };
  const canvas = M.createRaster(w, h);
  M.blit(canvas, scaled, Math.round((w - dw) / 2), align === "center" ? Math.round((h - dh) / 2) : h - dh);
  return { raster: canvas, scale: s };
}

// ---------------------------------------------------------------------------------------------
// Characters
async function loadCharSheet(id, sheet) {
  const file = sourceFile("characters", `char-${id}-${sheet}.png`);
  if (!file) return null;
  const raster = normalizeAlpha(await loadRaster(file), `char-${id}-${sheet}`);
  // binarise: kills the translucent halo the generator leaves around limbs (04 §8)
  M.snapAlpha(raster, manifest.alphaThreshold);
  return raster;
}

function extractCharFrames(raster, cols, rows, label) {
  const cells = M.gridCells(raster.width, raster.height, cols, rows);
  const split = P.splitTouching(raster, cells, { threshold: manifest.alphaThreshold });
  if (split) console.log(`  · ${label}: 서로 닿은 프레임 ${split}덩어리를 침식 분리로 갈랐음`);
  const sprites = M.extractSprites(raster, cells, { threshold: manifest.alphaThreshold, gap: manifest.gap, minArea: manifest.minArea });
  return { cells, sprites, cols, rows, label };
}

/** A grid whose frames merged or split shows up as a different number of big components than cells. */
function checkGridCount(raster, sheet, expected, label) {
  const { comps } = M.labelComponents(raster, manifest.alphaThreshold);
  const areas = comps.map((c) => c.area).sort((a, b) => b - a);
  const median = areas[Math.min(areas.length - 1, Math.floor(expected / 2))] ?? 0;
  const big = comps.filter((c) => c.area >= median * 0.25).length;
  if (big !== expected) warn(label, `그리드 개수 불일치: 큰 덩어리 ${big}개 vs 프레임 ${expected}개 (프레임이 합쳐졌거나 조각남, gap ${manifest.gap}px)`, "grid");
}

function frameInfo(sprite, cell) {
  return {
    sprite,
    w: sprite.bbox.w,
    h: sprite.bbox.h,
    bottom: sprite.bbox.y + sprite.bbox.h - cell.y,
    cx: M.alphaCentroidX(sprite.raster, fullBox(sprite.raster)),
  };
}

/** Frames of one sheet row (first `frames` cells), null where the cell is empty. */
function rowFrames(sheet, rowIndex, frames) {
  const out = [];
  for (let c = 0; c < frames; c++) {
    const index = rowIndex * sheet.cols + c;
    const sprite = sheet.sprites[index];
    out.push(sprite ? frameInfo(sprite, sheet.cells[index]) : null);
  }
  return out;
}

/** px-per-source-px scale of a sheet: reference rows -> reference height, or the ready sheet's scale by grid-cell height. */
async function sheetScale(id, kind, sheetName, cache) {
  const spec = manifest[kind].sheets[sheetName];
  const measured = await measureSheet(id, kind, sheetName, cache);
  if (!measured) return null;
  if (spec.ref) {
    const heights = spec.ref.rows.flatMap((r) => rowFrames(measured.sheet, r, spec.rows[r].frames)).filter(Boolean).map((f) => f.h);
    if (heights.length === 0) return null;
    const scale = spec.ref.height / M.median(heights);
    const frontFill = M.median(heights) / measured.sheet.cells[0].h;
    return { scale, cellH: measured.sheet.cells[0].h, refHeight: M.median(heights), fill: frontFill };
  }
  const from = spec.scaleFrom;
  const base = await sheetScale(id, kind, from.sheet, cache);
  if (!base) return null;
  const cellH = measured.sheet.cells[0].h;
  return { scale: from.byCell ? P.scaleByCell(base.scale, base.cellH, cellH) : base.scale, cellH, refHeight: null, fill: null };
}

async function measureSheet(id, kind, sheetName, cache) {
  const key = `${kind}:${sheetName}`;
  if (cache.has(key)) return cache.get(key);
  const spec = manifest[kind].sheets[sheetName];
  const raster = await loadCharSheet(id, sheetName);
  let result = null;
  if (raster) {
    const [cols, rows] = spec.grid;
    const sheet = extractCharFrames(raster, cols, rows, `characters/${id}-${sheetName}`);
    const expected = spec.rows.reduce((sum, row) => sum + row.frames, 0);
    checkGridCount(raster, sheetName, expected, sheet.label);
    result = { raster, sheet };
  }
  cache.set(key, result);
  return result;
}

/** Draws every clip row of one character sheet into the atlas. */
async function renderCharSheet(id, kind, sheetName, atlas, cache) {
  const spec = manifest[kind].sheets[sheetName];
  const measured = await measureSheet(id, kind, sheetName, cache);
  if (!measured) return false;
  const { raster, sheet } = measured;
  const label = sheet.label;
  const sizing = await sheetScale(id, kind, sheetName, cache);
  if (!sizing) {
    warn(label, "스케일 기준 프레임이 없어 변환할 수 없음", "empty");
    return false;
  }
  const s0 = sizing.scale;
  console.log(`  · ${sheetName}: scale ${s0.toFixed(4)}${sizing.refHeight ? ` (기준 ${Math.round(sizing.refHeight)}px → ${Math.round(sizing.refHeight * s0)}px)` : " (셀 높이 비례)"}, 셀 ${sheet.cells[0].w}×${sheet.cells[0].h}`);
  if (s0 > 1.001) warn(label, `원본이 목표보다 작아 확대됨(x${s0.toFixed(2)})`, "scale");
  if (sizing.fill && sizing.fill > manifest.fillWarnRatio) {
    warn(label, `기준 행 인체 높이가 셀의 ${(sizing.fill * 100).toFixed(0)}% (권장 ≤ ${manifest.fillWarnRatio * 100}%): 원본이 셀을 꽉 채움 — 이웃 행과 접촉했는지 확인`, "cellfill");
  }

  for (let r = 0; r < spec.rows.length; r++) {
    const row = spec.rows[r];
    const rowLabel = `${label} ${row.clip}/${row.dir}`;
    const frames = rowFrames(sheet, r, row.frames);
    const present = frames.filter(Boolean);
    // wipe the destination first so a spliced re-conversion never keeps stale pixels
    const x0 = row.atlas[1] * row.cellW;
    const y0 = row.atlas[0] * CELL;
    for (let y = y0; y < y0 + CELL; y++) atlas.data.fill(0, (y * atlas.width + x0) * 4, (y * atlas.width + x0 + row.frames * row.cellW) * 4);
    frames.forEach((f, c) => {
      if (!f) warn(`${rowLabel} f${c + 1}`, "셀이 비어 있음", "empty");
    });
    if (present.length === 0) continue;
    const ground = P.groundLine(present.map((f) => f.bottom));
    const fit = P.rowFitScale(present, ground, { cellW: row.cellW, footY: manifest.footY, airborne: row.airborne });
    const s = Math.min(s0, fit);
    if (s < s0 * SCALE_REDUCED_WARN) warn(rowLabel, `프레임에 맞추려고 이 행 스케일을 ${(s / s0 * 100).toFixed(0)}%로 축소(가장 큰 프레임이 셀보다 큼)`, "scale");
    const plan = P.planRow(present, s, ground, { cellW: row.cellW, cellH: CELL, footY: manifest.footY, airborne: row.airborne, snap: FOOT_DEVIATION_WARN_PX });
    let planIndex = 0;
    frames.forEach((f, c) => {
      if (!f) return;
      const p = plan[planIndex++];
      const tag = `${rowLabel} f${c + 1}`;
      if (M.bboxTouchesEdge(f.sprite.bbox, raster.width, raster.height, 1)) warn(tag, "캐릭터가 시트 가장자리에 닿음(잘렸을 수 있음)", "clip");
      if (f.sprite.dropped) console.log(`  · ${tag}: 떨어진 잡티 ${f.sprite.dropped}개 제외`);
      if (!row.airborne && Math.abs(p.raw) > FOOT_DEVIATION_WARN_PX) warn(tag, `발끝 기준선 편차 ${Math.abs(p.raw)}px (허용 ${FOOT_DEVIATION_WARN_PX}px) — 기준선으로 끌어내려 정렬함`, "foot");
      if (p.clipped) warn(tag, `아틀라스 셀(${row.cellW}×${CELL}) 밖으로 나가 잘림`, "clip");
      else if (p.shifted) warn(tag, "무게중심을 셀 중앙에 맞추면 삐져나가 좌우로 살짝 밀어 넣음", "edge");
      const sprite = M.snapAlpha(M.boxDownscale(f.sprite.raster, p.dw, p.dh));
      warnMagenta(tag, sprite);
      M.blit(atlas, sprite, x0 + c * row.cellW + p.dx, y0 + p.dy);
    });
  }
  return true;
}

async function convertPortraits(id) {
  const raster = await loadCharSheet(id, "portrait");
  if (!raster) return;
  const size = manifest.portraits.size;
  const cells = M.gridCells(raster.width, raster.height, 2, 2);
  const sprites = M.extractSprites(raster, cells, { threshold: manifest.alphaThreshold, gap: 40, minArea: 200 });
  const usable = sprites.filter(Boolean);
  if (usable.length === 0) return warn(`characters/${id}-portrait`, "비어 있음", "empty");
  const common = Math.min(...usable.map((sprite) => Math.min(size / sprite.raster.width, size / sprite.raster.height)));
  for (let index = 0; index < 4; index++) {
    const sprite = sprites[index];
    const name = manifest.portraits.names[index];
    const label = `characters/${id}-portrait ${name}`;
    if (!sprite) {
      warn(label, "칸이 비어 있음", "empty");
      continue;
    }
    const cell = cells[index];
    const b = sprite.bbox;
    // busts are cut at the bottom by design, the top and both sides must stay inside their quarter
    if (b.x <= cell.x + 1 || b.y <= cell.y + 1 || b.x + b.w >= cell.x + cell.w - 1) warn(label, "칸 가장자리에 닿음(팔·주먹·머리가 잘렸을 수 있음)", "clip");
    if (b.w > cell.w * 0.8) warn(label, `흉상 폭이 칸의 ${(b.w / cell.w * 100).toFixed(0)}% (권장 ≤ 80%): 칸 사이 간격이 좁음`, "gap");
    const { raster: out } = renderSprite(sprite.raster, size, size, { scale: common, align: "bottom" });
    warnMagenta(label, out);
    await saveRaster(out, "portraits", `${id}-${name}`);
  }
}

async function convertHero(id) {
  const raster = await loadCharSheet(id, "stand");
  if (!raster) return;
  const [sprite] = M.extractSprites(raster, M.gridCells(raster.width, raster.height, 1, 1), { threshold: manifest.alphaThreshold, gap: 40, minArea: 200 });
  const label = `characters/${id}-stand`;
  if (!sprite) return warn(label, "비어 있음", "empty");
  if (M.bboxTouchesEdge(sprite.bbox, raster.width, raster.height, 1)) warn(label, "캐릭터가 시트 가장자리에 닿음(잘렸을 수 있음)", "clip");
  const height = Math.min(manifest.hero.maxHeight, sprite.raster.height);
  const width = Math.max(1, Math.round((sprite.raster.width * height) / sprite.raster.height));
  const { raster: out } = renderSprite(sprite.raster, width, height, { pad: false });
  warnMagenta(label, out);
  await saveRaster(out, "characters", `${id}-hero`);
}

async function convertCharacter(id) {
  const keeper = manifest.characters.keeper.includes(id);
  const kind = keeper ? "keeper" : "field";
  const sheetNames = keeper ? KEEPER_SHEETS : FIELD_SHEETS;
  beginScope(`characters/${id}`);
  const only = flags.only ? new Set(flags.only.map((name) => (name === "hero" ? "stand" : name))) : null;
  if (only) for (const name of only) if (!sheetNames.includes(name)) throw new Error(`Unknown sheet "${name}" for ${id}. Known: ${sheetNames.join(", ")}`);
  const wanted = (name) => !only || only.has(name);

  const atlasSheets = Object.keys(manifest[kind].sheets).filter(wanted);
  if (atlasSheets.length > 0) {
    const { w, h } = manifest[kind].atlas;
    const atlasFile = path.join(outRoot, "characters", `${id}-atlas.webp`);
    let atlas = M.createRaster(w, h);
    if (only) {
      if (existsSync(atlasFile)) {
        atlas = await loadRaster(atlasFile);
        if (atlas.width !== w || atlas.height !== h) throw new Error(`Existing ${rel(atlasFile)} is ${atlas.width}×${atlas.height}, expected ${w}×${h}; re-run without --only`);
        console.log(`  · splice into existing ${rel(atlasFile)}: ${atlasSheets.join(", ")}`);
      } else warn(`characters/${id}-atlas`, "--only 인데 기존 아틀라스가 없어 빈 아틀라스에 끼워 넣음", "missing");
    }
    const cache = new Map();
    let any = false;
    for (const sheetName of atlasSheets) any = (await renderCharSheet(id, kind, sheetName, atlas, cache)) || any;
    if (any) await saveRaster(atlas, "characters", `${id}-atlas`);
  }
  if (!keeper && wanted("portrait")) await convertPortraits(id);
  if (!keeper && wanted("stand")) await convertHero(id);
}

function characterComplete(id) {
  const sheets = manifest.characters.keeper.includes(id) ? KEEPER_SHEETS.filter((s) => s !== "stand") : FIELD_SHEETS;
  return sheets.every((sheet) => existsSync(path.join(srcRoot, "characters", `char-${id}-${sheet}.png`)));
}

// ---------------------------------------------------------------------------------------------
// Environment / FX / UI / keyart sheets
async function convertScene(category, sheetId, cfg) {
  beginScope(`${category}/${sheetId}`);
  const file = sourceFile(category, cfg.file);
  if (!file) return;
  const raster = await loadRaster(file);
  const crop = M.cropRaster(raster, M.coverCropRect(raster.width, raster.height, 960, 540));
  const out = M.boxDownscale(crop, 960, 540);
  for (let i = 3; i < out.data.length; i += 4) out.data[i] = 255;
  const drift = raster.width !== 1536 || raster.height !== 1024;
  if (drift) console.log(`  · 원본 캔버스 ${raster.width}×${raster.height} (요청 1536×1024): 중앙 16:9 밴드 ${crop.width}×${crop.height} 크롭`);
  if (M.countMagenta(out) >= 50) warn(`${category}/${sheetId}`, `마젠타 계열 ${M.countMagenta(out)}px — 의도한 네온 색일 수 있음`, "magenta");
  await saveRaster(out, category, sheetId, { lossy: true, note: `crop ${crop.width}×${crop.height}, q${flags.quality}` });
}

async function convertSheet(category, sheetId) {
  const cfg = manifest.sheets[category][sheetId];
  if (cfg.scene || flags.scene) return convertScene(category, sheetId, cfg);
  beginScope(`${category}/${sheetId}`);
  const file = sourceFile(category, cfg.file);
  if (!file) return;
  const raster = normalizeAlpha(await loadRaster(file), cfg.file);
  const [cols, rows] = cfg.grid;
  const cells = M.gridCells(raster.width, raster.height, cols, rows);
  if (raster.width !== 1536 || raster.height !== 1024) console.log(`  · 원본 캔버스 ${raster.width}×${raster.height} (요청 1536×1024): 그리드 비례로 처리`);
  const wantsSoft = cfg.soft || cfg.items.some((item) => item[4]?.soft);
  const hard = M.extractSprites(raster, cells, HARD);
  const soft = wantsSoft ? M.extractSprites(raster, cells, SOFT) : null;
  const usedCells = new Set(cfg.items.flatMap((item) => (Array.isArray(item[1]) ? item[1] : [item[1]])));
  for (const cell of usedCells) if (cell >= cells.length) throw new Error(`${cfg.file}: cell ${cell} outside the ${cols}×${rows} grid`);

  const prepared = cfg.items.map(([id, cellRef, w, h, opts = {}]) => {
    const list = Array.isArray(cellRef) ? cellRef : [cellRef];
    const useSoft = Boolean(cfg.soft || opts.soft);
    const sprites = list.map((index) => (useSoft ? soft : hard)[index]);
    const target = `${category}/${id}`;
    sprites.forEach((sprite, n) => {
      const tag = list.length > 1 ? `${target} f${n + 1}` : target;
      if (!sprite) return warn(tag, "셀이 비어 있음(오브젝트 없음 또는 알파 240 미만)", "empty");
      if (M.bboxTouchesEdge(sprite.bbox, raster.width, raster.height, 1)) warn(tag, "오브젝트가 시트 가장자리에 닿음(잘렸을 수 있음)", "clip");
      if (sprite.dropped) console.log(`  · ${tag}: 떨어진 잡티 ${sprite.dropped}개 제외`);
    });
    const fit = opts.fill ? Infinity : Math.min(...sprites.filter(Boolean).map((sprite) => Math.min(w / sprite.raster.width, h / sprite.raster.height)));
    return { id, list, sprites, w, h, opts, soft: useSoft, target, fit };
  });

  const groupScale = new Map();
  for (const item of prepared) {
    if (!item.opts.group || !Number.isFinite(item.fit)) continue;
    groupScale.set(item.opts.group, Math.min(groupScale.get(item.opts.group) ?? Infinity, item.fit));
  }

  for (const item of prepared) {
    const { id, sprites, w, h, opts, soft: useSoft, target } = item;
    if (sprites.every((sprite) => !sprite)) continue;
    const scale = opts.fill ? undefined : opts.group ? groupScale.get(opts.group) : item.fit;
    const frame = opts.slice !== undefined;
    const rendered = sprites.map((sprite) => {
      if (!sprite) return { raster: M.createRaster(w, h), scale };
      return renderSprite(sprite.raster, w, h, { scale, align: opts.align ?? "bottom", pad: !frame, soft: useSoft, fill: opts.fill });
    });
    const used = rendered.find((r, n) => sprites[n]);
    if (used.scale > 1.001) warn(target, `원본(${sprites.find(Boolean).raster.width}×${sprites.find(Boolean).raster.height})이 목표(${w}×${h})보다 작아 확대됨(x${used.scale.toFixed(2)})`, "scale");
    if (opts.fill) {
      const first = sprites.find(Boolean).raster;
      const diff = Math.abs(first.width / first.height / (w / h) - 1);
      if (diff > ASPECT_WARN) warn(target, `종횡비 차이 ${(diff * 100).toFixed(0)}% (원본 ${first.width}×${first.height} → 목표 ${w}×${h}), 늘려서 맞춤`, "aspect");
    }
    if (frame) {
      const out = rendered[0].raster;
      const sym = M.symmetryError(out);
      if (opts.symmetry === "lr") sym.tb = 0;
      if (sym.lr > SYMMETRY_WARN || sym.tb > SYMMETRY_WARN) warn(target, `9-slice 대칭 오차 좌우 ${sym.lr.toFixed(3)} / 상하 ${sym.tb.toFixed(3)} (허용 ${SYMMETRY_WARN})`, "symmetry");
      if (out.width <= opts.slice * 2 || out.height <= opts.slice * 2) warn(target, `9-slice(slice ${opts.slice}) 불가: 변환 크기 ${out.width}×${out.height}`, "symmetry");
      console.log(`  · ${target}: 프레임 원본 비율 유지 → ${out.width}×${out.height} (목표 ${w}×${h}), slice ${opts.slice}`);
    }
    let strip = rendered[0].raster;
    if (rendered.length > 1) {
      strip = M.createRaster(rendered[0].raster.width * rendered.length, rendered[0].raster.height);
      rendered.forEach((r, n) => M.blit(strip, r.raster, n * r.raster.width, 0));
    }
    warnMagenta(target, strip);
    await saveRaster(strip, category, id, { note: rendered.length > 1 ? `${rendered.length}-frame strip ${w}×${h}` : "" });
  }
}

// ---------------------------------------------------------------------------------------------
// Meta (bytes + dimensions of every converted file, consumed by engine/assets.ts)
function walkWebp(dir, base = dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkWebp(full, base));
    else if (entry.name.endsWith(".webp")) out.push(full);
  }
  return out;
}

async function writeMeta() {
  const extra = new Map(); // key -> { frames?, slice? }
  for (const [category, sheets] of Object.entries(manifest.sheets)) {
    for (const cfg of Object.values(sheets)) {
      for (const [id, cellRef, , , opts = {}] of cfg.items ?? []) {
        const info = {};
        if (Array.isArray(cellRef) && cellRef.length > 1) info.frames = cellRef.length;
        if (opts.slice !== undefined) info.slice = opts.slice;
        if (Object.keys(info).length) extra.set(`${category}/${id}`, info);
      }
    }
  }
  const entries = [];
  for (const file of walkWebp(outRoot).sort()) {
    const key = path.relative(outRoot, file).replaceAll("\\", "/").replace(/\.webp$/, "");
    const { width, height } = await sharp(file).metadata();
    const parts = [`bytes: ${statSync(file).size}`, `w: ${width}`, `h: ${height}`];
    const info = extra.get(key);
    if (info?.frames) parts.push(`frames: ${info.frames}`);
    if (info?.slice !== undefined) parts.push(`slice: ${info.slice}`);
    entries.push(`  ${JSON.stringify(key)}: { ${parts.join(", ")} },`);
  }
  const text = [
    "// GENERATED by scripts/convert-pitch-art.mjs — do not edit. Bytes and pixel size of every file under src/web/assets/pitch.",
    "// `frames` = horizontal strip frame count (frame width = w / frames), `slice` = 9-slice inset in px.",
    "export interface PitchAssetMeta {",
    "  bytes: number;",
    "  w: number;",
    "  h: number;",
    "  frames?: number;",
    "  slice?: number;",
    "}",
    "",
    "export const PITCH_ASSET_META: Readonly<Record<string, PitchAssetMeta>> = {",
    ...entries,
    "};",
    "",
  ].join("\n");
  mkdirSync(path.dirname(metaFile), { recursive: true });
  writeFileSync(metaFile, text);
  console.log(`meta: ${rel(metaFile)} (${entries.length} files)`);
}

// ---------------------------------------------------------------------------------------------
// Dispatch
async function run(category, id) {
  if (category === "characters") {
    const all = [...manifest.characters.field, ...manifest.characters.keeper];
    if (id) {
      if (!all.includes(id)) throw new Error(`Unknown character "${id}". Known: ${all.join(", ")}`);
      return convertCharacter(id);
    }
    for (const character of all) {
      if (!characterComplete(character)) {
        console.log(`characters/${character}: 시트가 모두 있지 않아 건너뜀(개별 변환은 id 를 지정)`);
        continue;
      }
      await convertCharacter(character);
    }
    return;
  }
  const sheets = manifest.sheets[category];
  if (!sheets) throw new Error(`Unknown category "${category}". Known: ${CATEGORIES.join(", ")}`);
  const ids = Object.keys(sheets);
  for (const sheetId of id ? [id] : ids) {
    if (!ids.includes(sheetId)) throw new Error(`Unknown ${category} sheet "${sheetId}". Known: ${ids.join(", ")}`);
    await convertSheet(category, sheetId);
  }
}

function mergeReport() {
  let previous = { scopes: {} };
  if (existsSync(reportFile)) {
    try {
      previous = JSON.parse(readFileSync(reportFile, "utf8"));
    } catch {
      previous = { scopes: {} };
    }
  }
  const merged = { ...(previous.scopes ?? {}) };
  for (const [scope, entry] of scopes) merged[scope] = entry;
  const summary = { fatal: 0, warnings: 0, missingOriginals: 0, byKind: {} };
  for (const entry of Object.values(merged)) {
    summary.missingOriginals += entry.missing.length;
    for (const w of entry.warnings) {
      summary.warnings++;
      if (FATAL_KINDS.has(w.kind)) summary.fatal++;
      summary.byKind[w.kind] = (summary.byKind[w.kind] ?? 0) + 1;
    }
  }
  mkdirSync(srcRoot, { recursive: true });
  writeFileSync(reportFile, JSON.stringify({ generatedAt: new Date().toISOString(), summary, scopes: merged }, null, 2));
  return summary;
}

async function main() {
  if (!flags.all && positional.length === 0) {
    console.error(`Usage: pnpm convert:pitch-art -- <category> [id] | --all   (categories: ${CATEGORIES.join(", ")})`);
    process.exit(1);
  }
  if (flags.all) {
    for (const category of CATEGORIES) {
      console.log(`\n=== ${category} ===`);
      await run(category);
    }
  } else await run(positional[0], positional[1]);

  await writeMeta();
  const runWarnings = [...scopes.values()].flatMap((entry) => entry.warnings);
  const byKind = {};
  for (const w of runWarnings) byKind[w.kind] = (byKind[w.kind] ?? 0) + 1;
  const written = [...scopes.values()].reduce((sum, entry) => sum + entry.converted.length, 0);
  const missing = [...scopes.values()].flatMap((entry) => entry.missing);
  const fatal = runWarnings.filter((w) => FATAL_KINDS.has(w.kind)).length;
  console.log(`\n${written} files written, ${missing.length} originals missing, ${runWarnings.length} QA warnings (fatal ${fatal})${runWarnings.length ? " — " + Object.entries(byKind).map(([k, v]) => `${k} ${v}`).join(", ") : ""}.`);
  if (missing.length) console.log("Missing originals:\n" + missing.map((file) => `  - ${file}`).join("\n"));
  const summary = mergeReport();
  console.log(`QA report: ${rel(reportFile)} (all scopes: fatal ${summary.fatal}, warnings ${summary.warnings})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
