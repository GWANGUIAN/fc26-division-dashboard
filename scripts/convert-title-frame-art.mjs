/**
 * One-off conversion: the AI-generated title panel frame tmp/world-src/ui/ui-title-frame.png becomes the
 * 9-slice frame src/web/assets/world/ui/title-frame.webp (192×192, slice 24) behind the title menu.
 *
 * The original comes with a soft, see-through vignette in the middle and corners that are not exactly
 * mirrored, so this
 *   1. trims the transparent margin,
 *   2. mirrors the top-left quadrant onto the other three (identical corner ornaments),
 *   3. fills the dark vignette inside the mint line with the flat panel colour (the same #052720 as panel-frame),
 *   4. box-downscales to the final size and snaps the alpha.
 *
 * Run with: pnpm convert:title-frame
 */
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import * as M from "./lib/world-art-math.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const SRC = path.join(rootDir, "tmp", "world-src", "ui", "ui-title-frame.png");
const OUT = path.join(rootDir, "src", "web", "assets", "world", "ui", "title-frame.webp");

const SIZE = 192;
const FILL = [5, 39, 32];
/** Width of the border band (outline, band, gold line, mint line) in the trimmed original; everything inside is panel. */
const BAND = 52;

if (!existsSync(SRC)) {
  console.error(`original not found: ${path.relative(rootDir, SRC)}`);
  process.exit(1);
}

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const source = { data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength), width: info.width, height: info.height };
const trimmed = M.cropRaster(source, M.alphaBBox(source, 240));

// Mirror the top-left quadrant onto the rest.
const { width: w, height: h } = trimmed;
const frame = M.createRaster(w, h);
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const from = (Math.min(y, h - 1 - y) * w + Math.min(x, w - 1 - x)) * 4;
    frame.data.set(trimmed.data.subarray(from, from + 4), (y * w + x) * 4);
  }
}

// Inside the border band the near-black vignette (red ≈ 0, dim green/blue) becomes the flat panel colour and everything turns opaque;
// the ornaments that reach into the panel (gem, leaves, their dark teal outline) are brighter and stay.
for (let y = BAND; y < h - BAND; y++) {
  for (let x = BAND; x < w - BAND; x++) {
    const i = (y * w + x) * 4;
    const [r, g, b] = [frame.data[i], frame.data[i + 1], frame.data[i + 2]];
    if (r <= 8 && g <= 48 && b <= 48) frame.data.set([...FILL, 255], i);
    else frame.data[i + 3] = 255;
  }
}

const small = M.boxDownscale(frame, SIZE, SIZE);
M.snapAlpha(small);
mkdirSync(path.dirname(OUT), { recursive: true });
await sharp(Buffer.from(small.data.buffer, small.data.byteOffset, small.data.byteLength), { raw: { width: SIZE, height: SIZE, channels: 4 } })
  .webp({ lossless: true })
  .toFile(OUT);
console.log(`✓ ${path.relative(rootDir, OUT)} (${SIZE}×${SIZE}, slice 24, trimmed original ${w}×${h}, magenta px ${M.countMagenta(small)})`);
