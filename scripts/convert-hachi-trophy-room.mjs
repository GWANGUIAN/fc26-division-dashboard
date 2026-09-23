/**
 * Converts tmp/world-src/interiors/int-house-hachi97-trophy.png into the game asset, keeping the 5
 * portrait frames as transparent holes (painted #FF00FF in the source) so drawHachiTopFanPhotos can
 * show a real photo through each one before drawInterior draws the room art on top (render.ts).
 *
 * `pnpm convert:world-art -- interiors house-hachi97-trophy` is NOT a substitute: `convertInterior`
 * forces the whole room opaque (convert-world-art.mjs, `out.data[i] = 255`), which would paint the
 * magenta circles solid instead of punching them out. Re-run this script instead whenever the source
 * PNG changes.
 *
 * Run with: node scripts/convert-hachi-trophy-room.mjs
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import * as M from "./lib/world-art-math.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const manifest = JSON.parse(readFileSync(path.join(__dirname, "world-art-manifest.json"), "utf8"));
const [w, h] = manifest.interiors.size;

const SRC = path.join(rootDir, "tmp", "world-src", "interiors", "int-house-hachi97-trophy.png");
const OUT = path.join(rootDir, "src", "web", "assets", "world", "interiors", "int-house-hachi97-trophy.webp");

async function loadRaster(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength), width: info.width, height: info.height };
}

const raster = await loadRaster(SRC);
const removed = M.chromaKey(raster, [255, 0, 255], 40);
const fixed = M.despillMagenta(raster);
console.log(`chroma-keyed ${removed}px, despilled ${fixed}px`);
if (removed < 1000) console.warn("  ! fewer magenta pixels than expected — did the source lose its #FF00FF portrait circles?");

const crop = M.cropRaster(raster, M.coverCropRect(raster.width, raster.height, w, h));
const out = M.boxDownscale(crop, w, h);

await sharp(Buffer.from(out.data.buffer, out.data.byteOffset, out.data.byteLength), { raw: { width: out.width, height: out.height, channels: 4 } })
  .webp({ lossless: true })
  .toFile(OUT);

console.log(`wrote ${path.relative(rootDir, OUT)} (${out.width}x${out.height})`);
