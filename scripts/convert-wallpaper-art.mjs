/**
 * Bulk conversion: takes every AI-generated 잔디동 월페이퍼 PNG sitting
 * directly in public/wallpapers/ (docs/wallpaper-prompts.md's file-naming
 * convention: wallpaper-group-NN.png, wallpaper-extra-NN.png,
 * wallpaper-solo-<id>-N.png) and writes two WebP copies:
 *   - public/wallpapers/<name>.webp        — full resolution, for the big
 *     viewer and the download button.
 *   - public/wallpapers/thumbs/<name>.webp — small (360px wide) copy for the
 *     WallpaperOverlay sidebar list, so scrolling the list doesn't pull down
 *     53 multi-megabyte images.
 * The source PNG is deleted after both copies are written successfully.
 *
 * Run with: pnpm convert:wallpaper-art
 */
import { existsSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const wallpapersDir = path.join(rootDir, "public", "wallpapers");
const thumbsDir = path.join(wallpapersDir, "thumbs");

const THUMB_WIDTH = 360;

async function main() {
  if (!existsSync(wallpapersDir)) {
    console.error(`${wallpapersDir} not found`);
    process.exit(1);
  }
  mkdirSync(thumbsDir, { recursive: true });

  const pngFiles = readdirSync(wallpapersDir).filter((name) => name.toLowerCase().endsWith(".png"));
  if (pngFiles.length === 0) {
    console.log("No PNGs left to convert in public/wallpapers/.");
    return;
  }

  for (const fileName of pngFiles) {
    const name = fileName.slice(0, -".png".length);
    const srcPath = path.join(wallpapersDir, fileName);
    const fullOutPath = path.join(wallpapersDir, `${name}.webp`);
    const thumbOutPath = path.join(thumbsDir, `${name}.webp`);

    await sharp(srcPath).webp({ quality: 85 }).toFile(fullOutPath);
    await sharp(srcPath).resize({ width: THUMB_WIDTH }).webp({ quality: 80 }).toFile(thumbOutPath);
    unlinkSync(srcPath);
    console.log(`Converted ${fileName} -> ${name}.webp (+ thumbs/${name}.webp)`);
  }

  console.log(`Done: ${pngFiles.length} image(s) converted.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
