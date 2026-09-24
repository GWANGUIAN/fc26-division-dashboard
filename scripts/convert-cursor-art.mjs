/**
 * Converts the three AI originals documented in docs/cursor-image-generation-prompts.md into
 * small, lossless browser cursor assets. Originals are never edited or deleted.
 *
 *   pnpm convert:cursor-art -- <id>
 *   pnpm convert:cursor-art -- --all
 */
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ids = ["tdnlamuron", "ju010228", "doormomo", "bboringirl", "kaksjak0730", "sjh4018", "haepalin", "lina0108", "tleod1818", "janine95kim", "hachi97", "woowakgood"];
const roles = ["default", "pointer", "text", "crosshair", "move", "grabbing", "resize-ew", "resize-ns", "resize-diagonal", "wait", "not-allowed", "help"];
const requested = process.argv.slice(2).filter((arg) => arg !== "--");
const targets = requested.includes("--all") ? ids : requested.filter((id) => ids.includes(id));

if (targets.length === 0) {
  console.error(`Usage: pnpm convert:cursor-art -- <id> | --all\\nKnown ids: ${ids.join(", ")}`);
  process.exit(1);
}

function isMagenta(r, g, b) {
  return Math.hypot(r - 255, g, b - 255) <= 42;
}

async function normalized(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels = new Uint8Array(data);
  const corners = [[2, 2], [info.width - 3, 2], [2, info.height - 3], [info.width - 3, info.height - 3]];
  const keyed = corners.filter(([x, y]) => {
    const i = (y * info.width + x) * 4;
    return isMagenta(pixels[i], pixels[i + 1], pixels[i + 2]);
  }).length >= 3;
  if (keyed) {
    for (let i = 0; i < pixels.length; i += 4) {
      if (isMagenta(pixels[i], pixels[i + 1], pixels[i + 2])) pixels[i + 3] = 0;
    }
  }
  return { input: sharp(Buffer.from(pixels), { raw: { width: info.width, height: info.height, channels: 4 } }), info, keyed };
}

async function alphaBox(image) {
  const { data, info } = await image.clone().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] < 32) continue;
    left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
  }
  return {
    data,
    info,
    box: right < left ? null : { left, top, width: right - left + 1, height: bottom - top + 1 },
  };
}

async function renderSprite(cell, size, align = "centre") {
  const { data, info, box } = await alphaBox(cell);
  if (!box) return { image: sharp({ create: { width: size, height: size, channels: 4, background: "#00000000" } }), empty: true };
  // A second extract on a Sharp pipeline can be resolved against its original input rather than
  // the preceding grid crop. Rehydrate the already-cropped raw cell before trimming it again.
  const trimmed = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).extract(box);
  const scale = Math.min((size - 2) / box.width, (size - 2) / box.height);
  const width = Math.max(1, Math.round(box.width * scale));
  const height = Math.max(1, Math.round(box.height * scale));
  const sprite = await trimmed.resize(width, height, { kernel: sharp.kernel.nearest }).png().toBuffer();
  return {
    image: sharp({ create: { width: size, height: size, channels: 4, background: "#00000000" } }).composite([{
      input: sprite,
      left: align === "top-left" ? 0 : Math.floor((size - width) / 2),
      top: align === "top-left" ? 0 : size - height,
    }]),
    empty: false,
  };
}

async function convert(id) {
  const source = path.join(root, "tmp", "cursor-src", id);
  const keyposeFile = path.join(source, `cursor-${id}-keypose.png`);
  const glyphFile = path.join(source, `cursor-${id}-glyph-grid.png`);
  const motionFile = path.join(source, `cursor-${id}-motion-sheet.png`);
  const output = path.join(root, "src", "web", "assets", "cursors", id);
  if (!existsSync(keyposeFile) || !existsSync(glyphFile) || !existsSync(motionFile)) {
    const missing = [!existsSync(keyposeFile) && "keypose", !existsSync(glyphFile) && "glyph-grid", !existsSync(motionFile) && "motion-sheet"].filter(Boolean).join(", ");
    console.warn(`? ${id}: missing ${missing}; skipped`);
    return false;
  }
  mkdirSync(output, { recursive: true });
  const glyphSource = await normalized(glyphFile);
  const motionSource = await normalized(motionFile);
  if (glyphSource.info.width / glyphSource.info.height < 1.35 || motionSource.info.width / motionSource.info.height < 1.35) {
    throw new Error(`${id}: both sheets must use the documented 4×3 wide grid`);
  }
  const glyphCellW = Math.floor(glyphSource.info.width / 4), glyphCellH = Math.floor(glyphSource.info.height / 3);
  for (let index = 0; index < roles.length; index++) {
    const cell = glyphSource.input.clone().extract({ left: index % 4 * glyphCellW, top: Math.floor(index / 4) * glyphCellH, width: glyphCellW, height: glyphCellH });
    const rendered = await renderSprite(cell, 24, "top-left");
    if (rendered.empty) console.warn(`! ${id}: empty glyph cell ${index + 1} (${roles[index]})`);
    await rendered.image.webp({ lossless: true }).toFile(path.join(output, `glyph-${roles[index]}.webp`));
  }
  const motionCellW = Math.floor(motionSource.info.width / 4), motionCellH = Math.floor(motionSource.info.height / 3);
  const frames = [];
  for (let index = 0; index < 12; index++) {
    const cell = motionSource.input.clone().extract({ left: index % 4 * motionCellW, top: Math.floor(index / 4) * motionCellH, width: motionCellW, height: motionCellH });
    const rendered = await renderSprite(cell, 32);
    if (rendered.empty) console.warn(`! ${id}: empty motion frame ${index + 1}`);
    frames.push(await rendered.image.png().toBuffer());
  }
  await sharp({ create: { width: 32 * 12, height: 32, channels: 4, background: "#00000000" } })
    .composite(frames.map((input, index) => ({ input, left: index * 32, top: 0 })))
    .webp({ lossless: true }).toFile(path.join(output, "motion-strip.webp"));
  await sharp(frames[0]).webp({ lossless: true }).toFile(path.join(output, "preview.webp"));
  console.log(`✓ ${id}: 12 glyphs + 12-frame motion strip${glyphSource.keyed || motionSource.keyed ? " (magenta keyed)" : ""}`);
  return true;
}

let converted = 0;
for (const id of targets) if (await convert(id)) converted++;
console.log(`Cursor art complete: ${converted}/${targets.length}`);
