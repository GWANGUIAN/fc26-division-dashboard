/**
 * Renders a player's actual 3D card (via a headless browser hitting the
 * real ?totyCapture= route — not a from-scratch canvas reimplementation, so
 * it's pixel-identical to the live hover effect: same CSS, same blend
 * modes, same shine, minus the rim glow which the capture route turns off
 * via showGlow={false} — GIF's 1-bit alpha can't do its soft falloff)
 * while feeding it a synthetic sweeping mouse path, then stitches the
 * captured frames into a looping animated GIF with a transparent
 * background.
 *
 * This runs offline/on-demand (not in the browser) because there's no solid
 * client-side animated-GIF encoder yet — sharp already ships one, and
 * driving the real page beats reimplementing glare/foil/text-shine in
 * <canvas>.
 *
 * Requires the Vite dev server already running (`pnpm dev`) and Playwright's
 * Chromium installed (`npx playwright install chromium` once).
 *
 * Run with: pnpm generate:toty-preview -- <streamerId> [port] [--lowq|--retro]
 * Example:  pnpm generate:toty-preview -- hachi97
 *
 * --lowq/--retro capture an easter-egg trio (<id>-lowq-*.webp /
 * <id>-retro-*.webp — see docs/toty-card-prompts.md) instead of the real
 * card, writing <id>-lowq-preview.gif / <id>-retro-preview.gif. Neither
 * variant has hover art or a glow overlay (TotyCardCapturePage leaves both
 * off for any non-"normal" ?variant=), so there's no separate
 * "-preview-base.gif" the way the real card has one.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

// WebP's container format caps any single dimension at 16383px, and sharp's
// raw-buffer animation path builds one tall "stack" of height*FRAME_COUNT
// before slicing it back into pages — so that product must stay under the
// limit regardless of how small pageHeight ends up being. 572x800 * 20 =
// 16000, safely under it. (Prioritizes per-frame resolution over frame
// count — 20 frames is still a smooth-enough loop for a slow hover sweep,
// and much crisper than a smaller viewport with more frames.)
const VIEWPORT = { width: 572, height: 800 };
const FRAME_COUNT = 20;
const FRAME_DELAY_MS = 125; // 20 * 125ms = 2.5s loop
const STEP_SETTLE_MS = 45; // lets the .toty-card--active transition finish before each screenshot

// snapshotFixture.json IS the live roster data the deployed app currently
// serves (see src/web/api.ts) — never add a non-applicant "guest" card's id
// to it just to satisfy this script, that would make them show up as a real
// roster streamer in the actual app. Guest/bonus cards (e.g. the hidden
// 우왁굳 card — see src/web/toty-card/woowakgoodBonusCard.ts) instead get a
// small manual fallback entry here. This is plain ESM with no TS build
// step, so it can't just import that .ts module — keep this in sync by hand
// if that file's display info ever changes.
const NON_ROSTER_STREAMERS = {
  woowakgood: { displayName: "우왁굳", hopedPosition1: "ALL", currentDivision: 1 },
};

async function main() {
  const rawArgs = process.argv.slice(2);
  const variant = rawArgs.includes("--retro") ? "retro" : rawArgs.includes("--lowq") ? "lowq" : "normal";
  // Some shells/package-manager invocations of `pnpm run x -- ...` leak a
  // literal "--" through into argv instead of pnpm swallowing it — strip it
  // defensively alongside the flags above so it never gets misread as the id.
  const [id, port = "5184"] = rawArgs.filter((arg) => arg !== "--" && arg !== "--lowq" && arg !== "--retro");
  if (!id) {
    console.error("Usage: pnpm generate:toty-preview -- <streamerId> [port] [--lowq|--retro]");
    process.exit(1);
  }

  const assetsDir = path.join(rootDir, "src", "web", "assets", "toty-cards");
  const assetPrefix = variant === "normal" ? id : `${id}-${variant}`;
  for (const part of ["frame", "background", "character"]) {
    if (!existsSync(path.join(assetsDir, `${assetPrefix}-${part}.webp`))) {
      console.error(`Missing ${assetPrefix}-${part}.webp in src/web/assets/toty-cards/ — generate the 3 card images first.`);
      process.exit(1);
    }
  }

  const fixture = JSON.parse(
    readFileSync(path.join(rootDir, "src", "web", "snapshotFixture.json"), "utf8"),
  );
  const fromFixture = fixture.streamers.find((entry) => entry.id === id);
  const streamer = fromFixture ?? (NON_ROSTER_STREAMERS[id] ? { id, ...NON_ROSTER_STREAMERS[id] } : undefined);
  if (!streamer) {
    console.error(
      `No streamer with id "${id}" in src/web/snapshotFixture.json and no NON_ROSTER_STREAMERS fallback in this script — can't fill in name/position/division.`,
    );
    process.exit(1);
  }

  const url = new URL(`http://localhost:${port}/`);
  url.searchParams.set("totyCapture", id);
  url.searchParams.set("name", streamer.displayName);
  if (streamer.hopedPosition1) url.searchParams.set("pos", streamer.hopedPosition1);
  url.searchParams.set("div", String(streamer.currentDivision ?? 1));
  if (variant !== "normal") url.searchParams.set("variant", variant);

  console.log(`Capturing ${streamer.displayName} (${id})${variant !== "normal" ? ` [${variant}]` : ""} from ${url}`);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: VIEWPORT });
    await page.goto(url.toString());
    await page.waitForSelector(".toty-card", { state: "visible" });

    const box = await page.locator(".toty-card").boundingBox();
    if (!box) throw new Error("Could not find .toty-card on the page — did the capture route render?");
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    const frames = [];
    for (let i = 0; i < FRAME_COUNT; i++) {
      // A slow figure-eight sweep — periodic in i, so the loop has no jump
      // cut, and it stays inboard of the card's own edges so every frame
      // reads as "someone hovering and gently moving the mouse over it".
      const t = (i / FRAME_COUNT) * Math.PI * 2;
      const x = cx + Math.sin(t) * box.width * 0.32;
      const y = cy + Math.sin(t * 2) * box.height * 0.24;
      await page.mouse.move(x, y, { steps: 4 });
      await page.waitForTimeout(STEP_SETTLE_MS);
      frames.push(await page.screenshot({ omitBackground: true }));
      process.stdout.write(".");
    }
    console.log("");

    const decoded = await Promise.all(
      frames.map((buf) => sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })),
    );
    const { width, height } = decoded[0].info;
    for (const { info } of decoded) {
      if (info.width !== width || info.height !== height) {
        throw new Error("Captured frames don't all share the same size — the viewport must stay fixed during capture.");
      }
    }
    const stacked = Buffer.concat(decoded.map(({ data }) => data));

    const outPath = path.join(assetsDir, `${assetPrefix}-preview.gif`);
    // pageHeight on the *input* raw options (sharp >=0.34.3) is what tells
    // it this buffer is a vertically-stacked multi-frame image, not
    // `animated`/`pages` — those only apply when reading an already-encoded
    // animated file. Without this, sharp silently wrote a single flat
    // image the height of the whole stack, with alpha dropped in the
    // process (see: https://github.com/lovell/sharp/issues/3236).
    // Unlike .webp(), .gif()'s `delay` doesn't broadcast a single number to
    // every frame — passing a scalar left every page but the first at a
    // 0ms delay. Needs one entry per page explicitly.
    await sharp(stacked, {
      raw: { width, height: height * decoded.length, channels: 4, pageHeight: height },
    })
      .gif({ pageHeight: height, delay: Array(decoded.length).fill(FRAME_DELAY_MS), loop: 0 })
      .toFile(outPath);

    console.log(`Wrote ${path.relative(rootDir, outPath)} (${decoded.length} frames)`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
