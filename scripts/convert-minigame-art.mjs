/**
 * Generic converter for AI-generated minigame art.
 * Add a game entry to minigame-art-manifest.json, then run:
 *   pnpm convert:minigame-art -- grass-merge
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { alphaBBox, chromaKey, cropRaster, despillMagenta, extractSprites, fitSize, gridCells, createRaster, blit } from "./lib/world-art-math.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(readFileSync(path.join(__dirname, "minigame-art-manifest.json"), "utf8"));
const usage = "Usage: pnpm convert:minigame-art -- <game-id> [--skip-missing]\n\nConverts tmp/minigame-src/<game-id> originals according to scripts/minigame-art-manifest.json.";
const args = process.argv.slice(2).filter((arg) => arg !== "--");
const skipMissing = args.includes("--skip-missing");
const gameArgs = args.filter((arg) => arg !== "--skip-missing");

if (args.includes("--help") || args.includes("-h")) {
  console.log(usage);
  process.exit(0);
}
if (gameArgs.length !== 1) {
  console.error(usage);
  process.exit(1);
}
const game = manifest.games.find((entry) => entry.id === gameArgs[0]);
if (!game) {
  console.error(`Unknown minigame "${args[0]}". Available: ${manifest.games.map((entry) => entry.id).join(", ")}`);
  process.exit(1);
}

const sourceRoot = path.join(root, "tmp", "minigame-src", game.sourceDir);
const absent = game.assets.filter((asset) => !existsSync(path.join(sourceRoot, asset.source)));
if (absent.length && !skipMissing) {
  absent.forEach((asset) => console.error(`Original not found: tmp/minigame-src/${game.sourceDir}/${asset.source}`));
  console.error(`Conversion stopped: ${absent.length} original file(s) missing.`);
  process.exit(1);
}
if (absent.length) absent.forEach((asset) => console.warn(`Skipping missing original: tmp/minigame-src/${game.sourceDir}/${asset.source}`));
const { default: sharp } = await import("sharp");

async function loadRaster(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength), width: info.width, height: info.height };
}

async function saveRaster(raster, file) {
  await sharp(Buffer.from(raster.data.buffer, raster.data.byteOffset, raster.data.byteLength), {
    raw: { width: raster.width, height: raster.height, channels: 4 },
  }).webp({ quality: 92, alphaQuality: 100 }).toFile(file);
}

function fitRaster(source, width, height, fit, trim) {
  const box = trim ? alphaBBox(source) : null;
  if (trim && !box) throw new Error("no visible pixels after trimming");
  const subject = box ? cropRaster(source, box) : source;
  if (fit === "cover") {
    const scale = Math.max(width / subject.width, height / subject.height);
    const resizedW = Math.max(width, Math.round(subject.width * scale));
    const resizedH = Math.max(height, Math.round(subject.height * scale));
    return { subject, width, height, resizedW, resizedH, x: Math.round((width - resizedW) / 2), y: Math.round((height - resizedH) / 2) };
  }
  const size = fitSize(subject.width, subject.height, width, height);
  return { subject, width, height, resizedW: size.w, resizedH: size.h, x: Math.round((width - size.w) / 2), y: Math.round((height - size.h) / 2) };
}

async function render(source, output, asset, sprite) {
  const input = sprite ?? source;
  const configured = fitRaster(input, output.width, output.height, asset.fit ?? "contain", asset.trim === true);
  const png = await sharp(Buffer.from(configured.subject.data.buffer, configured.subject.data.byteOffset, configured.subject.data.byteLength), {
    raw: { width: configured.subject.width, height: configured.subject.height, channels: 4 },
  }).resize(configured.resizedW, configured.resizedH, { fit: "fill" }).png().toBuffer();
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  const scaled = { data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength), width: info.width, height: info.height };
  const canvas = createRaster(configured.width, configured.height);
  blit(canvas, scaled, configured.x, configured.y);
  const target = path.join(root, "public", output.file);
  await saveRaster(canvas, target);
  console.log(`✓ public/${output.file} (${output.width}×${output.height})`);
}

let missing = 0;
for (const asset of game.assets) {
  const sourceFile = path.join(root, "tmp", "minigame-src", game.sourceDir, asset.source);
  if (!existsSync(sourceFile)) continue;
  const source = await loadRaster(sourceFile);
  if (asset.key === "magenta") {
    chromaKey(source);
    despillMagenta(source);
  }
  let sprites = null;
  if (asset.grid) {
    const cells = gridCells(source.width, source.height, asset.grid.columns, asset.grid.rows);
    sprites = extractSprites(source, cells, { threshold: 64, gap: 24 });
  }
  for (const output of asset.outputs) {
    const sprite = output.cell === undefined ? undefined : sprites?.[output.cell]?.raster;
    if (output.cell !== undefined && !sprite) {
      console.error(`Sprite missing: ${asset.source} cell ${output.cell + 1}`);
      missing += 1;
      continue;
    }
    await render(source, output, asset, sprite);
  }
}
if (missing) {
  console.error(`Conversion stopped: ${missing} original or sprite item(s) missing.`);
  process.exit(1);
}
