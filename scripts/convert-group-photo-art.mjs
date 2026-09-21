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
 * Props (docs/group-photo-props.md): an id starting with `props/` converts
 * `<srcDir>/<name>.png|.webp` (falling back to `prop.png`) into
 * src/web/assets/group-photo/props/<name>.webp. Props are also trimmed to
 * their visible pixels — groupPhotoProps.ts anchors them by the bottom edge
 * (ground contact) and widthVw, so transparent margins in the generated
 * canvas would offset the placement. Prop sources are NOT deleted (they
 * usually live in a Downloads folder the user still wants).
 *
 * Run with: pnpm convert:group-photo-art -- <id> [srcDir]
 * Example:  pnpm convert:group-photo-art -- sjh4018
 *           pnpm convert:group-photo-art -- background
 *           pnpm convert:group-photo-art -- props/goal C:/Users/me/Downloads/props
 *           pnpm convert:group-photo-art -- props/goal C:/Users/me/Downloads/props --flop
 */
import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

// --flop: 소품을 좌우 반전해서 저장 (골대처럼 생성 결과의 좌우 방향이 마음에
// 안 들 때). 원본 파일은 그대로 두고 변환 결과만 뒤집는다.
const cliArgs = process.argv.slice(2);
const flop = cliArgs.includes("--flop");
const [id, srcDirArg] = cliArgs.filter((arg) => arg !== "--flop");
if (!id) {
  console.error("Usage: pnpm convert:group-photo-art -- <id> [srcDir]");
  process.exit(1);
}

const isProp = id.startsWith("props/");
const propName = isProp ? id.slice("props/".length) : "";
if (isProp && !/^[a-z0-9-]+$/.test(propName)) {
  console.error(`Invalid prop id "${id}" — expected props/<lowercase-name>`);
  process.exit(1);
}

const srcDir = path.resolve(rootDir, srcDirArg ?? "public/test");
const outDir = path.join(rootDir, "src", "web", "assets", "group-photo");

function resolveSourcePath() {
  if (isProp) {
    const candidates = [`${propName}.png`, `${propName}.webp`, "prop.png"];
    for (const name of candidates) {
      const candidate = path.join(srcDir, name);
      if (existsSync(candidate)) return candidate;
    }
    return path.join(srcDir, candidates[0]);
  }
  return path.join(srcDir, id === "background" ? "background.png" : "character.png");
}

// Alpha above this counts as visible ink. Generated cutouts carry faint
// matting speckles far from the object; a low threshold would keep them
// inside the trimmed bounds.
const TRIM_ALPHA_THRESHOLD = 20;

async function trimToVisiblePixels(srcPath) {
  const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > TRIM_ALPHA_THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) throw new Error(`${srcPath} has no visible pixels`);
  return sharp(srcPath)
    .ensureAlpha()
    .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 });
}

async function main() {
  const srcPath = resolveSourcePath();
  if (!existsSync(srcPath)) {
    console.error(`${srcPath} not found`);
    process.exit(1);
  }

  if (isProp) {
    const propsDir = path.join(outDir, "props");
    mkdirSync(propsDir, { recursive: true });
    const outPath = path.join(propsDir, `${propName}.webp`);
    const trimmed = await trimToVisiblePixels(srcPath);
    // 트림된 결과를 뒤집으므로 좌우 반전해도 접지점/너비 기준은 그대로다.
    if (flop) trimmed.flop();
    await trimmed.webp({ quality: 88, alphaQuality: 90 }).toFile(outPath);
    console.log(`Wrote ${path.relative(rootDir, outPath)} (trimmed from ${path.relative(rootDir, srcPath)})`);
    return;
  }

  mkdirSync(outDir, { recursive: true });
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
