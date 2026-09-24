/**
 * Packages the browser cursor art as prebuilt Windows cursor downloads.
 *
 *   pnpm build:windows-cursors -- --all
 *   pnpm build:windows-cursors -- woowakgood
 *
 * Each pack is self-contained: 12 role-specific .cur files, a 12-frame default .ani,
 * and a Korean README. The source WebP assets are never changed.
 */
import { existsSync } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ids = ["tdnlamuron", "ju010228", "doormomo", "bboringirl", "kaksjak0730", "sjh4018", "haepalin", "lina0108", "tleod1818", "janine95kim", "hachi97", "woowakgood"];
const names = {
  tdnlamuron: "다시바", ju010228: "쥬멩이", doormomo: "문모모", bboringirl: "뽀린걸",
  kaksjak0730: "한결", sjh4018: "핑구", haepalin: "해파린", lina0108: "리냐",
  tleod1818: "빙밍", janine95kim: "재닌", hachi97: "하치", woowakgood: "우왁굳",
};
const roles = [
  ["default", "01-normal"], ["pointer", "02-link"], ["text", "03-text"],
  ["crosshair", "04-precision"], ["move", "05-move"], ["grabbing", "06-grab"],
  ["resize-ew", "07-resize-horizontal"], ["resize-ns", "08-resize-vertical"],
  ["resize-diagonal", "09-resize-diagonal"], ["wait", "10-wait"],
  ["not-allowed", "11-not-allowed"], ["help", "12-help"],
];
const requested = process.argv.slice(2).filter((arg) => arg !== "--");
const targets = requested.length === 0 || requested.includes("--all") ? ids : requested.filter((id) => ids.includes(id));

if (targets.length === 0) {
  console.error(`Usage: pnpm build:windows-cursors -- <id> | --all\\nKnown ids: ${ids.join(", ")}`);
  process.exit(1);
}

function riffChunk(id, payload) {
  const padded = payload.length % 2;
  const chunk = Buffer.alloc(8 + payload.length + padded);
  chunk.write(id, 0, 4, "ascii");
  chunk.writeUInt32LE(payload.length, 4);
  payload.copy(chunk, 8);
  return chunk;
}

/** A Windows CUR is an ICONDIR of type 2 followed by a PNG image. Windows supports PNG cursor data. */
function makeCur(png, hotspotX = 0, hotspotY = 0) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(2, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt8(64, 6);
  header.writeUInt8(64, 7);
  header.writeUInt8(0, 8);
  header.writeUInt8(0, 9);
  header.writeUInt16LE(hotspotX, 10);
  header.writeUInt16LE(hotspotY, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(header.length, 18);
  return Buffer.concat([header, png]);
}

function makeAni(frames) {
  const anih = Buffer.alloc(36);
  anih.writeUInt32LE(36, 0);
  anih.writeUInt32LE(frames.length, 4);
  anih.writeUInt32LE(frames.length, 8);
  anih.writeUInt32LE(64, 12);
  anih.writeUInt32LE(64, 16);
  anih.writeUInt32LE(32, 20);
  anih.writeUInt32LE(1, 24);
  anih.writeUInt32LE(9, 28); // 9 jiffies = 150ms; 12 frames loop in 1.8 seconds.
  anih.writeUInt32LE(0, 32); // CUR data, not ICO data.
  const frameList = Buffer.concat([Buffer.from("fram", "ascii"), ...frames.map((frame) => riffChunk("icon", frame))]);
  const contents = Buffer.concat([riffChunk("anih", anih), riffChunk("LIST", frameList)]);
  const result = Buffer.alloc(12);
  result.write("RIFF", 0, 4, "ascii");
  result.writeUInt32LE(contents.length + 4, 4);
  result.write("ACON", 8, 4, "ascii");
  return Buffer.concat([result, contents]);
}

function assertCursorFiles(cur, ani, frameCount) {
  if (cur.readUInt16LE(0) !== 0 || cur.readUInt16LE(2) !== 2 || cur.readUInt16LE(4) !== 1) {
    throw new Error("Invalid CUR header");
  }
  if (ani.toString("ascii", 0, 4) !== "RIFF" || ani.toString("ascii", 8, 12) !== "ACON") {
    throw new Error("Invalid ANI header");
  }
  const iconChunks = ani.toString("ascii").match(/icon/g)?.length ?? 0;
  if (iconChunks !== frameCount) throw new Error(`Invalid ANI frame count: expected ${frameCount}, got ${iconChunks}`);
}

async function composeFrame(glyphFile, motionStrip, index) {
  const glyph = await sharp(glyphFile).resize(24, 24, { fit: "contain", kernel: sharp.kernel.nearest }).png().toBuffer();
  const character = await sharp(motionStrip)
    .extract({ left: index * 32, top: 0, width: 32, height: 32 })
    .resize(40, 40, { kernel: sharp.kernel.nearest })
    .png()
    .toBuffer();
  return sharp({ create: { width: 64, height: 64, channels: 4, background: "#00000000" } })
    .composite([{ input: glyph, left: 0, top: 0 }, { input: character, left: 14, top: 14 }])
    .png()
    .toBuffer();
}

function readme(name) {
  return `${name} 잔디동 Windows 마우스 포인터 팩\r\n\r\n`
    + "적용 방법\r\n"
    + "1. 압축을 풀어 원하는 위치에 보관하세요.\r\n"
    + "2. Windows 설정 > Bluetooth 및 장치 > 마우스 > 추가 마우스 설정으로 이동하세요.\r\n"
    + "3. '포인터' 탭에서 각 역할을 고르고 '찾아보기'로 .cur 파일을 지정하세요.\r\n"
    + "4. 일반 선택의 애니메이션을 원하면 01-normal-animated.ani를 지정하세요.\r\n"
    + "5. 구성표를 저장하면 나중에 다시 선택할 수 있습니다.\r\n\r\n"
    + "이 팩은 Windows용 정적 파일입니다. 웹사이트의 설정과는 별개로 적용됩니다.\r\n";
}

async function buildPack(id) {
  const source = path.join(root, "src", "web", "assets", "cursors", id);
  const output = path.join(source, "windows-cursor-pack.zip");
  const motionStrip = path.join(source, "motion-strip.webp");
  const missing = roles.map(([role]) => path.join(source, `glyph-${role}.webp`)).filter((file) => !existsSync(file));
  if (!existsSync(motionStrip) || missing.length) throw new Error(`${id}: run pnpm convert:cursor-art -- ${id} first`);

  const frames = [];
  for (let index = 0; index < 12; index++) {
    frames.push(makeCur(await composeFrame(path.join(source, "glyph-default.webp"), motionStrip, index)));
  }
  const ani = makeAni(frames);
  assertCursorFiles(frames[0], ani, frames.length);

  const zip = new JSZip();
  zip.file("README.txt", readme(names[id]));
  zip.file("01-normal-animated.ani", ani);
  for (const [role, filename] of roles) {
    const png = await composeFrame(path.join(source, `glyph-${role}.webp`), motionStrip, 0);
    zip.file(`${filename}.cur`, makeCur(png));
  }
  await mkdir(source, { recursive: true });
  await writeFile(output, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 9 } }));
  const { size } = await stat(output);
  console.log(`✓ ${id}: ${path.relative(root, output)} (${Math.ceil(size / 1024)} KB)`);
}

for (const id of targets) await buildPack(id);
