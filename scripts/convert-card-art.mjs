/**
 * One-off conversion: takes the AI-generated TOTY card art PNGs sitting in
 * public/test/ (frame/background/character) and writes them as WebP into
 * src/web/assets/toty-cards/, named by streamer id so totyCardAssets.ts can
 * pick them up via import.meta.glob.
 *
 * Run with: pnpm convert:card-art -- <streamerId> [srcDir]
 * Example:  pnpm convert:card-art -- hachi97
 */
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const [streamerId, srcDirArg] = process.argv.slice(2);
if (!streamerId) {
  console.error("Usage: pnpm convert:card-art -- <streamerId> [srcDir]");
  process.exit(1);
}

const srcDir = path.resolve(rootDir, srcDirArg ?? "public/test");
const outDir = path.join(rootDir, "src", "web", "assets", "toty-cards");
mkdirSync(outDir, { recursive: true });

const PARTS = ["frame", "background", "character"];

async function main() {
  for (const part of PARTS) {
    const srcPath = path.join(srcDir, `${part}.png`);
    if (!existsSync(srcPath)) {
      console.warn(`Skipping ${part}: ${srcPath} not found`);
      continue;
    }
    const outPath = path.join(outDir, `${streamerId}-${part}.webp`);
    await sharp(srcPath).webp({ quality: 92 }).toFile(outPath);
    console.log(`Wrote ${path.relative(rootDir, outPath)}`);
  }
  rmSync(srcDir, { recursive: true, force: true });
  console.log(`Removed ${path.relative(rootDir, srcDir)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
