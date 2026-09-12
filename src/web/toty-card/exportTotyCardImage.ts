import type { StreamerRecord } from "../../shared/model.js";
import type { TotyCardAssets } from "./totyCardAssets.js";
import { getTotyCardTextTheme } from "./totyCardTheme.js";

// Matches the card art's own resolution (see docs/toty-card-prompts.md) —
// no need to render larger since the source frame/background/character
// PNGs top out here anyway.
const WIDTH = 1060;
const HEIGHT = 1484;

// Mirrors .toty-card__window's `inset: 7.5% 12.5% 9% 12.5%` in toty-card.css
// (top/right/bottom/left) — height is 100% - 7.5% top - 9% bottom = 83.5%.
const WINDOW = { x: WIDTH * 0.125, y: HEIGHT * 0.075, w: WIDTH * 0.75, h: HEIGHT * 0.835 };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

/** CSS object-fit:cover equivalent, centered. */
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

/** CSS object-fit:contain + object-position:center bottom equivalent. */
function drawContainBottom(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + h - dh, dw, dh);
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Outline (matching --text-outline in toty-card.css) + solid fill. */
function drawOutlinedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fillColor: string) {
  ctx.lineJoin = "round";
  ctx.lineWidth = 7;
  ctx.strokeStyle = "#000";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fillColor;
  ctx.fillText(text, x, y);
}

/** Shrinks the font size just enough for `text` to fit within `maxWidth`. */
function fitFontSize(ctx: CanvasRenderingContext2D, text: string, family: string, weight: number, startSize: number, maxWidth: number) {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

/**
 * Renders this player's card (neutral pose — no tilt/glare/foil, those are
 * hover-only interactions with no meaning in a still image) to a transparent
 * PNG and triggers a download. Pure client-side canvas composite, no
 * pre-generation step — unlike the animated WebP preview (see
 * scripts/generate-toty-preview.mjs), this needs nothing prepared ahead of
 * time and works for every player as soon as their 3 card images exist.
 */
export async function exportTotyCardPng(
  streamer: Pick<StreamerRecord, "id" | "displayName" | "hopedPosition1" | "currentDivision">,
  assets: TotyCardAssets,
): Promise<void> {
  const theme = getTotyCardTextTheme(streamer.id);
  const [frame, background, character] = await Promise.all([
    loadImage(assets.frame),
    loadImage(assets.background),
    loadImage(assets.character),
  ]);

  // Canvas text needs the webfont already loaded, or it silently falls
  // back — both are already in use elsewhere on the page by the time this
  // button is clickable, but load() is a cheap no-op if so.
  if (document.fonts?.load) {
    await Promise.all([
      document.fonts.load("800 60px 'GiantsInline'"),
      document.fonts.load("800 60px 'Barlow Condensed'"),
      document.fonts.load("700 60px 'Barlow Condensed'"),
    ]).catch(() => {});
  }

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.save();
  roundedRectPath(ctx, WINDOW.x, WINDOW.y, WINDOW.w, WINDOW.h, WINDOW.w * 0.12);
  ctx.clip();
  drawCover(ctx, background, WINDOW.x, WINDOW.y, WINDOW.w, WINDOW.h);
  drawContainBottom(ctx, character, WINDOW.x, WINDOW.y, WINDOW.w, WINDOW.h);
  ctx.restore();

  ctx.drawImage(frame, 0, 0, WIDTH, HEIGHT);

  ctx.textAlign = "center";

  // Position (big) + division (small) stacked top-left, matching
  // .toty-card__stats' `left: 13%; top: 12%` in toty-card.css.
  const statsX = WIDTH * 0.13;
  if (streamer.hopedPosition1) {
    ctx.font = "800 78px 'Barlow Condensed', sans-serif";
    drawOutlinedText(ctx, streamer.hopedPosition1, statsX, HEIGHT * 0.155, theme.color);
  }
  ctx.font = "700 44px 'Barlow Condensed', sans-serif";
  drawOutlinedText(ctx, `D${streamer.currentDivision}`, statsX, HEIGHT * 0.205, theme.color);

  // Name, matching .toty-card__name's `top: 66%`, shrunk to fit like the
  // live card's ellipsis/max-width does for long names.
  const nameSize = fitFontSize(ctx, streamer.displayName, "'GiantsInline', 'Barlow Condensed', sans-serif", 800, 62, WIDTH * 0.8);
  ctx.font = `800 ${nameSize}px 'GiantsInline', 'Barlow Condensed', sans-serif`;
  drawOutlinedText(ctx, streamer.displayName, WIDTH / 2, HEIGHT * 0.67, theme.color);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${streamer.displayName}-3d-card.png`;
  a.click();
  URL.revokeObjectURL(url);
}
