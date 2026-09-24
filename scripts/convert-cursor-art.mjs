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
// Some dynamic source sheets intentionally let hair, a ball, or a boot cross the nominal 4×3
// cell boundary. These rectangles isolate the complete intended frame before trimming it. They
// are authored against the documented 1536×1024 sheet and scale with future source resolutions.
const motionCropOverrides = {
  sjh4018: [
    [0, 0, 425, 390], [410, 0, 735, 390], [720, 0, 1115, 360], [1115, 0, 1536, 360],
    [0, 390, 440, 680], [455, 390, 800, 680], [800, 390, 1155, 680], [1150, 390, 1536, 680],
    [0, 680, 380, 1024], [420, 680, 780, 1024], [780, 680, 1155, 1024], [1150, 680, 1536, 1024],
  ],
};
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

function removeEdgeBleed(data, width, height) {
  const alphaAt = (x, y) => data[(y * width + x) * 4 + 3] >= 32;
  const seen = new Uint8Array(width * height);
  const components = [];
  for (let start = 0; start < seen.length; start++) {
    if (seen[start]) continue;
    const startX = start % width, startY = Math.floor(start / width);
    if (!alphaAt(startX, startY)) { seen[start] = 1; continue; }
    const pixels = [];
    const queue = [start];
    seen[start] = 1;
    let left = startX, right = startX, top = startY, bottom = startY;
    for (let index = 0; index < queue.length; index++) {
      const point = queue[index];
      const x = point % width, y = Math.floor(point / width);
      pixels.push(point);
      left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
      for (let yOffset = -1; yOffset <= 1; yOffset++) for (let xOffset = -1; xOffset <= 1; xOffset++) {
        if (xOffset === 0 && yOffset === 0) continue;
        const nextX = x + xOffset, nextY = y + yOffset;
        if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) continue;
        const next = nextY * width + nextX;
        if (seen[next] || !alphaAt(nextX, nextY)) continue;
        seen[next] = 1;
        queue.push(next);
      }
    }
    components.push({ pixels, left, right, top, bottom });
  }
  const largest = Math.max(0, ...components.map((component) => component.pixels.length));
  const edge = Math.max(2, Math.floor(Math.min(width, height) * .04));
  let removed = 0;
  for (const component of components) {
    if (component.pixels.length === largest) continue;
    const touchesHorizontal = component.left <= edge || component.right >= width - edge - 1;
    const touchesVertical = component.top <= edge || component.bottom >= height - edge - 1;
    const touchesCorner = touchesHorizontal && touchesVertical;
    const isTinyBoundaryNoise = (touchesHorizontal || touchesVertical) && component.pixels.length <= Math.max(40, largest * .035);
    const isCornerBleed = touchesCorner && component.pixels.length <= largest * .25;
    if (!isTinyBoundaryNoise && !isCornerBleed) continue;
    for (const point of component.pixels) data[point * 4 + 3] = 0;
    removed += component.pixels.length;
  }
  return removed;
}

async function alphaBox(image, removeMotionEdgeBleed = false) {
  const { data, info } = await image.clone().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const removed = removeMotionEdgeBleed ? removeEdgeBleed(data, info.width, info.height) : 0;
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
    removed,
  };
}

async function renderSprite(cell, size, align = "centre", removeMotionEdgeBleed = false) {
  const { data, info, box, removed } = await alphaBox(cell, removeMotionEdgeBleed);
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
    removed,
  };
}

function motionFrameCrop(id, index, width, height) {
  const override = motionCropOverrides[id]?.[index];
  if (override) {
    const [left, top, right, bottom] = override;
    const x = Math.floor(left / 1536 * width);
    const y = Math.floor(top / 1024 * height);
    const endX = Math.ceil(right / 1536 * width);
    const endY = Math.ceil(bottom / 1024 * height);
    return { left: x, top: y, width: endX - x, height: endY - y };
  }
  const column = index % 4, row = Math.floor(index / 4);
  const left = Math.floor(column * width / 4), top = Math.floor(row * height / 3);
  return {
    left,
    top,
    width: Math.floor((column + 1) * width / 4) - left,
    height: Math.floor((row + 1) * height / 3) - top,
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
  const frames = [];
  for (let index = 0; index < 12; index++) {
    const cell = motionSource.input.clone().extract(motionFrameCrop(id, index, motionSource.info.width, motionSource.info.height));
    const rendered = await renderSprite(cell, 32, "centre", true);
    if (rendered.empty) console.warn(`! ${id}: empty motion frame ${index + 1}`);
    if (rendered.removed) console.log(`  ${id}: removed ${rendered.removed} edge-noise pixels from frame ${index + 1}`);
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
