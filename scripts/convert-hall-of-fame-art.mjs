/**
 * One-off conversion: takes the AI-generated Hall of Fame art PNGs sitting
 * in public/test/ (emblem/emblem-glow/backdrop/backdrop-glow) and writes
 * them as WebP into src/web/assets/hall-of-fame/, named by trophy category
 * key so hallOfFameArt.ts can pick them up via import.meta.glob.
 *
 * Run with: pnpm convert:hof-art -- <categoryKey> [srcDir]
 * Example:  pnpm convert:hof-art -- best-win-rate
 */
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const [categoryKey, srcDirArg] = process.argv.slice(2);
if (!categoryKey) {
  console.error("Usage: pnpm convert:hof-art -- <categoryKey> [srcDir]");
  process.exit(1);
}

const srcDir = path.resolve(rootDir, srcDirArg ?? "public/test");
const outDir = path.join(rootDir, "src", "web", "assets", "hall-of-fame");
mkdirSync(outDir, { recursive: true });

const PARTS = ["emblem", "emblem-glow", "backdrop", "backdrop-glow"];

async function main() {
  for (const part of PARTS) {
    const srcPath = path.join(srcDir, `${part}.png`);
    if (!existsSync(srcPath)) {
      console.warn(`Skipping ${part}: ${srcPath} not found`);
      continue;
    }
    const outPath = path.join(outDir, `${categoryKey}-${part}.webp`);
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
