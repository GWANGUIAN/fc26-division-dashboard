import { JANDY_TEAM_LOGO } from "../match-record/matchRecordData.js";
import { getUniformTextTheme, type UniformKit } from "./uniformKits.js";

// Matches the kit art's own resolution (see docs/uniform-customizer-prompts.md).
const JERSEY_WIDTH = 2000;
const JERSEY_HEIGHT = 1600;

// The kit image is a front(left)+back(right) composite. These coordinates
// were measured directly off the generated art (all 4 kits land within a
// pixel or two of each other): the back torso is centered at ~74.5% of the
// full canvas width, and even up near the collar the garment itself is
// already wide enough (>33% at y=20%, growing past 45% by y=30-40%) for a
// name/number nameplate — real jerseys print the name just below the
// collar and the number in the upper-mid back, not down near the hem, so
// that's what these mirror. The width only pinches back down to its
// narrowest (~29%) from y=52% to the hem at y=85%. Mirrors
// .uniform-customizer__preview-name/-number's `left`/`top` in styles.css —
// keep both in sync if the art changes.
const BACK_VIEW_CENTER_X = JERSEY_WIDTH * 0.745;
// Mirrors .uniform-customizer__preview-name's `top: 29.5%` in styles.css.
const NAME_Y = JERSEY_HEIGHT * 0.295;
// Mirrors .uniform-customizer__preview-number's `top: 42%` in styles.css.
const NUMBER_Y = JERSEY_HEIGHT * 0.42;
// The narrowest point the text zone ever has to clear (the torso's stable
// width from y=52% to the hem) measures ~28.7% of the full canvas width
// across all 4 kits — stay under that with a margin for stroke width, even
// though at these higher y-positions there's actually more room than this.
// Mirrors the preview overlay's `width: 26%`.
const BACK_VIEW_MAX_WIDTH = JERSEY_WIDTH * 0.26;

// Name keeps the bold display face; the number uses the brush-script team
// font instead (see .uniform-customizer__preview-name/-number in styles.css
// — keep both in sync). Each font-family only ships the weight declared in
// its @font-face, so the weight here must match that exactly.
const NAME_FONT = { family: "Aggravo", weight: 700 };
const NUMBER_FONT = { family: "Gunhamimalmunteuyeot", weight: 400 };
const RIBBON_FONT = { family: "Escoredream", weight: 100 };

// The preview's on-screen font sizes are `cqw` units (a % of the rendered
// image's own width), so their exact pixel size depends on how big the
// preview happens to be laid out — but that fraction-of-width IS exactly
// what JERSEY_WIDTH represents here (canvas width = "100% of image width").
// Multiplying the two together reproduces the preview's rendered size
// exactly regardless of on-screen container size. Keep these in sync with
// the `cqw` numbers in .uniform-customizer__preview-name/-number.
const NAME_START_SIZE = JERSEY_WIDTH * 0.03; // 3cqw
const NUMBER_START_SIZE = JERSEY_WIDTH * 0.088; // 8.8cqw

// Same idea for the top/bottom ribbon bands: every measurement below is
// that CSS rule's px value scaled by (canvas width / the ~620px content
// width the ribbon actually renders at inside the default-size modal — see
// .uniform-customizer__ribbon* in styles.css). Keep both in sync.
const RIBBON_PX = JERSEY_WIDTH / 620;
const RIBBON_PADDING_V = 7 * RIBBON_PX;
const RIBBON_PADDING_H = 12 * RIBBON_PX;
const RIBBON_UNIT_GAP = 22 * RIBBON_PX;
const RIBBON_LOGO_TEXT_GAP = 6 * RIBBON_PX;
const RIBBON_LOGO_SIZE = 13 * RIBBON_PX;
const RIBBON_FONT_SIZE = 12 * RIBBON_PX;
const RIBBON_HEIGHT = RIBBON_PADDING_V * 2 + RIBBON_FONT_SIZE * 1.2;

const CANVAS_WIDTH = JERSEY_WIDTH;
const CANVAS_HEIGHT = RIBBON_HEIGHT * 2 + JERSEY_HEIGHT;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

/** Outline (matching the preview's -webkit-text-stroke) + solid fill. */
function drawOutlinedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  lineWidth: number,
  fillColor: string,
  outlineColor: string,
) {
  ctx.lineJoin = "round";
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = outlineColor;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fillColor;
  ctx.fillText(text, x, y);
}

/** Shrinks the font size just enough for `text` to fit within `maxWidth`. */
function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: { family: string; weight: number },
  startSize: number,
  maxWidth: number,
) {
  let size = startSize;
  ctx.font = `${font.weight} ${size}px "${font.family}"`;
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${font.weight} ${size}px "${font.family}"`;
  }
  return size;
}

/**
 * Draws one repeating logo+wordmark strip (mirrors .uniform-customizer__ribbon)
 * across the full canvas width, clipped to `height`, starting at `topY`.
 */
function drawRibbonBand(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement,
  topY: number,
  height: number,
  detail: string,
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, topY, CANVAS_WIDTH, height);
  ctx.clip();

  ctx.fillStyle = "#07100d";
  ctx.fillRect(0, topY, CANVAS_WIDTH, height);
  ctx.fillStyle = "#00e9ae14";
  ctx.fillRect(0, topY, CANVAS_WIDTH, height);

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "0px";
  ctx.font = `${RIBBON_FONT.weight} ${RIBBON_FONT_SIZE}px "${RIBBON_FONT.family}"`;
  ctx.fillStyle = "#fff";
  const unitText = detail ? `잔디동 JANDIDONG · ${detail}` : "잔디동 JANDIDONG";
  const centerY = topY + height / 2;
  let x = RIBBON_PADDING_H;
  while (x < CANVAS_WIDTH) {
    ctx.drawImage(logo, x, centerY - RIBBON_LOGO_SIZE / 2, RIBBON_LOGO_SIZE, RIBBON_LOGO_SIZE);
    x += RIBBON_LOGO_SIZE + RIBBON_LOGO_TEXT_GAP;
    ctx.fillText(unitText, x, centerY);
    x += ctx.measureText(unitText).width + RIBBON_UNIT_GAP;
  }

  ctx.restore();
}

/**
 * Composites the top/bottom brand ribbons plus the chosen jersey
 * number/name onto the selected kit image and triggers a PNG download.
 * Pure client-side canvas, same pattern as exportTotyCardImage.ts /
 * exportGroupPhotoImage.ts.
 */
export async function exportUniformImage(kit: UniformKit, number: string, name: string): Promise<void> {
  const [image, logo] = await Promise.all([loadImage(kit.image), loadImage(JANDY_TEAM_LOGO)]);
  const theme = getUniformTextTheme(kit.id);

  if (document.fonts?.load) {
    await Promise.all([
      document.fonts.load(`${NAME_FONT.weight} 60px "${NAME_FONT.family}"`),
      document.fonts.load(`${NUMBER_FONT.weight} 60px "${NUMBER_FONT.family}"`),
      document.fonts.load(`${RIBBON_FONT.weight} 60px "${RIBBON_FONT.family}"`),
    ]).catch(() => {});
  }

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const trimmedNumber = number.trim();
  const trimmedName = name.trim();
  const ribbonDetail = [trimmedNumber, trimmedName].filter(Boolean).join(" · ");

  drawRibbonBand(ctx, logo, 0, RIBBON_HEIGHT, ribbonDetail);

  ctx.drawImage(image, 0, RIBBON_HEIGHT, JERSEY_WIDTH, JERSEY_HEIGHT);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (trimmedName) {
    const nameSize = fitFontSize(ctx, trimmedName.toUpperCase(), NAME_FONT, NAME_START_SIZE, BACK_VIEW_MAX_WIDTH);
    ctx.font = `${NAME_FONT.weight} ${nameSize}px "${NAME_FONT.family}"`;
    ctx.letterSpacing = "0.1em";
    drawOutlinedText(ctx, trimmedName.toUpperCase(), BACK_VIEW_CENTER_X, RIBBON_HEIGHT + NAME_Y, 8, theme.fill, theme.outline);
    ctx.letterSpacing = "0px";
  }

  if (trimmedNumber) {
    const numberSize = fitFontSize(ctx, trimmedNumber, NUMBER_FONT, NUMBER_START_SIZE, BACK_VIEW_MAX_WIDTH);
    ctx.font = `${NUMBER_FONT.weight} ${numberSize}px "${NUMBER_FONT.family}"`;
    drawOutlinedText(ctx, trimmedNumber, BACK_VIEW_CENTER_X, RIBBON_HEIGHT + NUMBER_Y, 14, theme.fill, theme.outline);
  }

  drawRibbonBand(ctx, logo, RIBBON_HEIGHT + JERSEY_HEIGHT, RIBBON_HEIGHT, ribbonDetail);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `잔디동-응원유니폼-${kit.id}.png`;
  a.click();
  URL.revokeObjectURL(url);
}
