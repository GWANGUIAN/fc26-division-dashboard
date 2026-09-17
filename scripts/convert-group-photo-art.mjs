/**
 * One-off conversion: takes an AI-generated 잔디동 단체사진 PNG sitting in
 * public/test/ (character.png, or background.png when id is "background")
 * and writes it as WebP into src/web/assets/group-photo/, named by id so
 * groupPhotoAssets.ts can pick it up via import.meta.glob.
 *
 * Unlike convert-card-art.mjs, only the single consumed source file is
 * deleted afterward (not the whole srcDir) — this feature's asset queue is
 * typically several people generated into the same folder over one sitting.
 *
 * Run with: pnpm convert:group-photo-art -- <id> [srcDir]
 * Example:  pnpm convert:group-photo-art -- sjh4018
 *           pnpm convert:group-photo-art -- background
 */
import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const [id, srcDirArg] = process.argv.slice(2);
if (!id) {
  console.error("Usage: pnpm convert:group-photo-art -- <id> [srcDir]");
  process.exit(1);
}

const srcDir = path.resolve(rootDir, srcDirArg ?? "public/test");
const outDir = path.join(rootDir, "src", "web", "assets", "group-photo");
mkdirSync(outDir, { recursive: true });

const sourceFilename = id === "background" ? "background.png" : "character.png";
const srcPath = path.join(srcDir, sourceFilename);

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
