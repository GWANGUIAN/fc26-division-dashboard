/**
 * One-off conversion: takes an AI-generated 응원 유니폼 등판 PNG sitting in
 * public/test/character.png and writes it as WebP into
 * src/web/assets/uniform-customizer/, named by id so uniformKits.ts can
 * import it.
 *
 * Only the single consumed source file is deleted afterward (not the whole
 * srcDir) — this feature's asset queue is generated one kit at a time over
 * one sitting, same as convert-group-photo-art.mjs.
 *
 * Run with: pnpm convert:uniform-art -- <id> [srcDir]
 * Example:  pnpm convert:uniform-art -- home-outfield
 */
import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const [id, srcDirArg] = process.argv.slice(2);
if (!id) {
  console.error("Usage: pnpm convert:uniform-art -- <id> [srcDir]");
  process.exit(1);
}

const srcDir = path.resolve(rootDir, srcDirArg ?? "public/test");
const outDir = path.join(rootDir, "src", "web", "assets", "uniform-customizer");
mkdirSync(outDir, { recursive: true });

const srcPath = path.join(srcDir, "character.png");

async function main() {
  if (!existsSync(srcPath)) {
    console.error(`${srcPath} not found`);
    process.exit(1);
  }
  const outPath = path.join(outDir, `${id}.webp`);
  await sharp(srcPath).webp({ quality: 92 }).toFile(outPath);
  console.log(`Wrote ${path.relative(rootDir, outPath)}`);
  unlinkSync(srcPath);
  console.log(`Removed ${path.relative(rootDir, srcPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
