import { GROUP_PHOTO_ROSTER } from "./groupPhotoRoster.js";
import { getGroupPhotoBackgroundUrl, getGroupPhotoCharacterUrl, getGroupPhotoPropUrl } from "./groupPhotoAssets.js";
import { GROUP_PHOTO_BALL, GROUP_PHOTO_PROPS, type GroupPhotoPropSlot } from "./groupPhotoProps.js";

// group-photo.css의 .group-photo-character--back/--front가 쓰는 것과 같은 값
// (배경 자체의 상단 가장자리 기준 오프셋, vw 단위) — 캔버스에서는 그 계산의
// "50vh - 28.125vw" 부분(뷰포트 letterbox 보정)이 필요 없다: 배경을 캔버스에
// 원본 해상도로 꽉 채워 그리므로, 남은 "+Xvw" 값이 곧 배경 자체 폭 대비 %가
// 된다.
const BACK_TOP_VW = 22;
const FRONT_TOP_VW = 31;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
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

/**
 * Measures how far the actually-drawn ink of `text` extends above/below its
 * baseline, by rendering it to a scratch canvas and scanning pixel alpha —
 * `TextMetrics.actualBoundingBoxAscent/Descent` turned out unreliable for
 * Galmuri11 (a bitmap web font) mixed with Hangul, silently under/over
 * reporting and throwing the signboard text off-center. Scanning real pixels
 * sidesteps whatever font-metrics quirk was causing that, at the cost of one
 * small offscreen render per export (fine — this only runs on a button click).
 */
function measureTextInkBounds(font: string, text: string): { ascent: number; descent: number } {
  const probe = document.createElement("canvas");
  const pctx = probe.getContext("2d");
  if (!pctx) return { ascent: 0, descent: 0 };
  pctx.font = font;
  const width = Math.max(1, Math.ceil(pctx.measureText(text).width) + 20);
  const height = 400;
  probe.width = width;
  probe.height = height;
  // Resizing a canvas resets its context state, so font must be reapplied.
  pctx.font = font;
  pctx.textAlign = "left";
  pctx.textBaseline = "alphabetic";
  pctx.fillStyle = "#fff";
  const baselineY = height / 2;
  pctx.fillText(text, 10, baselineY);

  const { data } = pctx.getImageData(0, 0, width, height);
  let top = -1;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    let rowHasInk = false;
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 10) {
        rowHasInk = true;
        break;
      }
    }
    if (rowHasInk) {
      if (top === -1) top = y;
      bottom = y;
    }
  }
  if (top === -1) return { ascent: 0, descent: 0 };
  return { ascent: baselineY - top, descent: bottom - baselineY };
}

// led-signboard.css의 .led-signboard--fancy(하치처럼 isFancy인 선수 전용, 금색
// +핑크 글로우)와 기본(민트) 팔레트.
const PALETTE = {
  normal: { border: "#00e9ae55", outerGlow: "#00e9ae4d", text: "#00e9ae", textGlow2: null as string | null },
  fancy: { border: "#ffd76ab0", outerGlow: "#ffd76a70", text: "#ffd76a", textGlow2: "#ff9bec80" },
};

/**
 * Redraws led-signboard.css's static-mode look directly on canvas — there's
 * no DOM screenshot library in this project, so every rule that CSS applies
 * to `.led-signboard--static` (and, when `fancy`, `.led-signboard--fancy`)
 * is mirrored here by hand instead:
 * - font: no font-weight is set in CSS (so NOT bold — canvas must match)
 * - padding: 1.4vh 3vw — "vh" is expressed against canvasHeight, "vw"
 *   against canvasWidth, exactly like `.group-photo-cheer`'s `top: 4vh`
 *   already does below in exportGroupPhotoPng
 * - border-radius: 6px (small, near-rectangular — NOT a pill shape)
 * - box-shadow: inset 0 0 20px rgba(0,0,0,.6) (inner vignette) + an outer
 *   glow (mint normally, gold when fancy — a still frame near the peak of
 *   led-signboard-fancy-glow's pulse, since this export is a static image)
 * - text-shadow: mint 4px+10px normally; gold 4px+10px plus an extra pink
 *   20px layer when fancy, matching .led-signboard--fancy .led-signboard__static
 * - fancy also gets 4 twinkling ✦ sparks at the panel corners, matching
 *   .led-signboard__fancy-spark
 */
function drawLedSignboard(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  text: string,
  fancy: boolean,
) {
  const palette = fancy ? PALETTE.fancy : PALETTE.normal;
  const fontSize = canvasWidth * 0.032; // 3.2vw
  const font = `${fontSize}px 'Galmuri11', 'Courier New', monospace`;
  ctx.font = font;
  const textWidth = ctx.measureText(text).width;

  const paddingX = canvasWidth * 0.03; // 3vw
  const paddingY = canvasHeight * 0.014; // 1.4vh
  const panelWidth = textWidth + paddingX * 2;
  const panelHeight = fontSize + paddingY * 2;
  const panelX = canvasWidth / 2 - panelWidth / 2;
  const panelY = canvasHeight * 0.04; // 4vh, matches .group-photo-cheer's top
  // 6px at a typical ~1728px-wide browser window, scaled to this canvas.
  const radius = canvasWidth * (6 / 1728);

  // Outer glow — a blurred copy of the panel shape cast outward before the
  // real opaque fill goes on top.
  ctx.save();
  ctx.shadowColor = palette.outerGlow;
  ctx.shadowBlur = canvasWidth * (fancy ? 0.009 : 0.006);
  roundedRectPath(ctx, panelX, panelY, panelWidth, panelHeight, radius);
  ctx.fillStyle = "#050b09";
  ctx.fill();
  ctx.restore();

  // Panel fill + inner vignette, clipped to the rounded rect. (No dot grid
  // here yet — CSS layers `.led-signboard__dots` at z-index 1, ABOVE the
  // z-index:0 text, so it has to be drawn after the text below, or it's
  // just invisible black-on-black against this panel.)
  ctx.save();
  roundedRectPath(ctx, panelX, panelY, panelWidth, panelHeight, radius);
  ctx.fillStyle = "#050b09";
  ctx.fill();
  ctx.clip();

  const vignette = ctx.createRadialGradient(
    panelX + panelWidth / 2,
    panelY + panelHeight / 2,
    Math.min(panelWidth, panelHeight) * 0.15,
    panelX + panelWidth / 2,
    panelY + panelHeight / 2,
    Math.max(panelWidth, panelHeight) * 0.75,
  );
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(0, 0, 0, .6)");
  ctx.fillStyle = vignette;
  ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
  ctx.restore();

  // Border, drawn unclipped so the full stroke shows.
  ctx.save();
  roundedRectPath(ctx, panelX, panelY, panelWidth, panelHeight, radius);
  ctx.lineWidth = Math.max(1, canvasWidth * 0.0006);
  ctx.strokeStyle = palette.border;
  ctx.stroke();
  ctx.restore();

  // Text + glow. Vertical centering is based on a pixel scan of the actual
  // rendered ink (see measureTextInkBounds) rather than canvas's "middle"
  // baseline, which was measurably off-center for this font/text.
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const { ascent, descent } = measureTextInkBounds(font, text);
  const textX = canvasWidth / 2;
  const textY = panelY + panelHeight / 2 + (ascent - descent) / 2;
  ctx.save();
  ctx.fillStyle = palette.text;
  ctx.shadowColor = palette.text;
  ctx.shadowBlur = fontSize * (10 / 32);
  ctx.fillText(text, textX, textY);
  ctx.shadowBlur = fontSize * (4 / 32);
  ctx.fillText(text, textX, textY);
  if (palette.textGlow2) {
    ctx.shadowColor = palette.textGlow2;
    ctx.shadowBlur = fontSize * (20 / 32);
    ctx.fillText(text, textX, textY);
  }
  ctx.restore();

  // Dot grid overlay, drawn last (on top of the text, matching CSS's
  // z-index:1 `.led-signboard__dots` sitting above the z-index:0 text) so
  // it actually reads as a subtle LED-pixel texture across the glowing
  // letters instead of disappearing against the black panel.
  ctx.save();
  roundedRectPath(ctx, panelX, panelY, panelWidth, panelHeight, radius);
  ctx.clip();
  const dotSpacing = canvasWidth * (4 / 1728);
  ctx.fillStyle = "rgba(0, 0, 0, .45)";
  for (let dx = panelX; dx < panelX + panelWidth; dx += dotSpacing) {
    for (let dy = panelY; dy < panelY + panelHeight; dy += dotSpacing) {
      ctx.beginPath();
      ctx.arc(dx, dy, dotSpacing * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  if (!fancy) return;

  // Four twinkling ✦ sparks at the panel corners (led-signboard.css's
  // .led-signboard__fancy-spark--1..4), drawn at a representative twinkle
  // phase since this is a still image. CSS sizes these in `em` off the
  // *ambient* page font-size (not the LED text's own 3.2vw font-size) — they
  // sit outside `.led-signboard__static`, so they're small (roughly a
  // 16px-ish base font × ~1-1.3em), unlike everything else in this panel.
  // Scaled the same 1728px-reference way as the border-radius/dot-grid above.
  const sparkFontSize = canvasWidth * (18 / 1728);
  const sparkPositions = [
    { x: panelX + panelWidth * 0.06, y: panelY + panelHeight * 0.1 },
    { x: panelX + panelWidth * 0.1, y: panelY + panelHeight * 0.68 },
    { x: panelX + panelWidth * 0.94, y: panelY + panelHeight * 0.12 },
    { x: panelX + panelWidth * 0.91, y: panelY + panelHeight * 0.66 },
  ];
  ctx.save();
  ctx.font = `${sparkFontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffd76a";
  ctx.shadowColor = "#00e9ae";
  ctx.shadowBlur = canvasWidth * (14 / 1728);
  for (const pos of sparkPositions) {
    ctx.fillText("✦", pos.x, pos.y);
  }
  ctx.restore();
}

/**
 * Draws one 축구장 소품 (groupPhotoProps.ts) at its resting position — the
 * same left% / bottomVw / widthVw the DOM uses, with "vw" meaning
 * `canvasWidth / 100` here (same convention as the character rows above).
 * Kick animation, confetti and click reactions are deliberately not part of
 * the saved image.
 */
function drawProp(ctx: CanvasRenderingContext2D, canvasWidth: number, slot: GroupPhotoPropSlot, image: HTMLImageElement) {
  const widthPx = (slot.widthVw / 100) * canvasWidth;
  const heightPx = (image.naturalHeight / image.naturalWidth) * widthPx;
  const x = (slot.left / 100) * canvasWidth - widthPx / 2;
  const y = (slot.bottomVw / 100) * canvasWidth - heightPx;

  if (slot.id === GROUP_PHOTO_BALL.id) {
    // group-photo.css의 .group-photo-ball__shadow와 같은 모양: 공 폭의 84%,
    // 높이 24%의 타원, 하단이 공 하단보다 9% 아래.
    const shadowWidth = widthPx * 0.84;
    const shadowHeight = heightPx * 0.24;
    const centerX = x + widthPx / 2;
    const centerY = y + heightPx + heightPx * 0.09 - shadowHeight / 2;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(1, shadowHeight / shadowWidth);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, shadowWidth / 2);
    gradient.addColorStop(0, "rgba(0, 0, 0, .38)");
    gradient.addColorStop(0.7, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, shadowWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.drawImage(image, x, y, widthPx, heightPx);
}

/**
 * Composites the group-photo background + props + every positioned
 * character + the LED cheer signboard into a single PNG and triggers a
 * download. Pure client-side canvas composite, same approach as
 * ../toty-card/exportTotyCardImage.ts's exportTotyCardPng.
 *
 * Draw order mirrors GroupPhotoOverlay's DOM/z-index order: behind props →
 * characters (back row, then front row) → front props (ball last) → LED.
 */
export async function exportGroupPhotoPng(cheerText: string, fancy = false): Promise<void> {
  const backgroundUrl = getGroupPhotoBackgroundUrl();
  if (!backgroundUrl) return;

  const background = await loadImage(backgroundUrl);
  const canvas = document.createElement("canvas");
  canvas.width = background.naturalWidth;
  canvas.height = background.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  const characterImages = await Promise.all(
    GROUP_PHOTO_ROSTER.map(async (slot) => {
      const url = getGroupPhotoCharacterUrl(slot.id);
      if (!url) return null;
      return { slot, image: await loadImage(url) };
    }),
  );

  // 소품 이미지가 아직 없으면(null) 그냥 건너뜀 — 화면(GroupPhotoProp)과 같은 규칙.
  const propImages = await Promise.all(
    [...GROUP_PHOTO_PROPS, GROUP_PHOTO_BALL].map(async (slot) => {
      const url = getGroupPhotoPropUrl(slot.id);
      if (!url) return null;
      return { slot, image: await loadImage(url) };
    }),
  );
  const drawProps = (layer: GroupPhotoPropSlot["layer"]) => {
    for (const entry of propImages) {
      if (entry && entry.slot.layer === layer) drawProp(ctx, canvas.width, entry.slot, entry.image);
    }
  };

  drawProps("behind");

  // GROUP_PHOTO_ROSTER already lists the back row before the front row, so
  // drawing in array order naturally layers front-row characters on top —
  // same z-index intent as group-photo.css's --back (2) / --front (3).
  for (const entry of characterImages) {
    if (!entry) continue;
    const { slot, image } = entry;
    const widthPx = (slot.widthVw / 100) * canvas.width;
    const heightPx = (image.naturalHeight / image.naturalWidth) * widthPx;
    const topVw = (slot.row === "back" ? BACK_TOP_VW : FRONT_TOP_VW) + (slot.topAdjustVw ?? 0);
    const x = (slot.left / 100) * canvas.width - widthPx / 2;
    const y = (topVw / 100) * canvas.width;
    ctx.drawImage(image, x, y, widthPx, heightPx);
  }

  drawProps("front");

  // Canvas text needs the webfont already loaded, or it silently falls back.
  if (document.fonts?.load) {
    await document.fonts.load(`${Math.round(canvas.width * 0.032)}px 'Galmuri11'`).catch(() => {});
  }
  drawLedSignboard(ctx, canvas.width, canvas.height, cheerText, fancy);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "잔디동-단체샷.png";
  a.click();
  URL.revokeObjectURL(url);
}
