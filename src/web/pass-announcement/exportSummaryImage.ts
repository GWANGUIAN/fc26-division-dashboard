import type { StreamerRecord } from "../../shared/model.js";
import { defaultSoopProfileUrl } from "../../shared/model.js";
import { divisionColor } from "../../shared/division-theme.js";

const COLUMNS = 5;
const CELL_WIDTH = 200;
const CELL_HEIGHT = 210;
const AVATAR_RADIUS = 56;
const PADDING = 40;
const HEADER_HEIGHT = 90;
const IMAGE_LOAD_TIMEOUT_MS = 4000;
/** Sharper output than 1px-per-canvas-unit on high-DPI displays. */
const CANVAS_SCALE = 2;

/** Resolves to null (never rejects) on load failure/timeout/CORS block —
 * callers fall back to a plain letter avatar for that entry instead of
 * aborting the whole export. */
function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const timer = window.setTimeout(() => resolve(null), IMAGE_LOAD_TIMEOUT_MS);
    img.onload = () => {
      window.clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(null);
    };
    img.src = url;
  });
}

function drawFallbackAvatar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  initial: string,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.fillStyle = "#04140f";
  ctx.font = `800 ${Math.round(radius)}px "Noto Sans KR", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initial, cx, cy + radius * 0.05);
  ctx.restore();
}

function drawAvatarImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  radius: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.restore();
}

function drawRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
}

function truncateToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 1 && ctx.measureText(`${truncated}…`).width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}…`;
}

async function buildCanvas(
  streamers: StreamerRecord[],
  usePhotos: boolean,
  title: string,
): Promise<HTMLCanvasElement> {
  const columns = Math.min(COLUMNS, streamers.length);
  const rows = Math.ceil(streamers.length / columns);
  const width = columns * CELL_WIDTH + PADDING * 2;
  const height = HEADER_HEIGHT + rows * CELL_HEIGHT + PADDING * 2;

  const canvas = document.createElement("canvas");
  canvas.width = width * CANVAS_SCALE;
  canvas.height = height * CANVAS_SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");
  ctx.scale(CANVAS_SCALE, CANVAS_SCALE);

  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "#0a1f18");
  bg.addColorStop(1, "#04100c");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 32px 'Noto Sans KR', sans-serif";
  ctx.fillText(truncateToWidth(ctx, title, width - PADDING * 2), width / 2, PADDING + 34);
  ctx.fillStyle = "#7ee7c8";
  ctx.font = "700 16px 'Noto Sans KR', sans-serif";
  ctx.fillText(`총 ${streamers.length}명`, width / 2, PADDING + 60);

  const images: (HTMLImageElement | null)[] = usePhotos
    ? await Promise.all(
        streamers.map((streamer) =>
          loadImage(
            streamer.profileImageUrl ?? defaultSoopProfileUrl(streamer.soopId) ?? "",
          ),
        ),
      )
    : streamers.map(() => null);

  streamers.forEach((streamer, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const cx = PADDING + col * CELL_WIDTH + CELL_WIDTH / 2;
    const cy = HEADER_HEIGHT + PADDING + row * CELL_HEIGHT + AVATAR_RADIUS + 6;
    const color = divisionColor(streamer.currentDivision);

    drawRing(ctx, cx, cy, AVATAR_RADIUS, color);
    const img = images[index];
    if (usePhotos && img) {
      drawAvatarImage(ctx, img, cx, cy, AVATAR_RADIUS);
    } else {
      drawFallbackAvatar(
        ctx,
        cx,
        cy,
        AVATAR_RADIUS,
        color,
        streamer.displayName.slice(0, 1),
      );
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 19px 'Noto Sans KR', sans-serif";
    const name = truncateToWidth(ctx, streamer.displayName, CELL_WIDTH - 24);
    ctx.fillText(name, cx, cy + AVATAR_RADIUS + 32);

    if (streamer.currentDivision > 0) {
      ctx.fillStyle = color;
      ctx.font = "800 15px 'Barlow Condensed', sans-serif";
      ctx.fillText(`D${streamer.currentDivision}`, cx, cy + AVATAR_RADIUS + 54);
    }
  });

  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

async function buildBlob(
  streamers: StreamerRecord[],
  usePhotos: boolean,
  title: string,
): Promise<Blob> {
  const canvas = await buildCanvas(streamers, usePhotos, title);
  const blob = await canvasToBlob(canvas);
  if (!blob) throw new Error("failed to encode canvas to a PNG blob");
  return blob;
}

export interface CopyRosterImageResult {
  ok: boolean;
  /** false when the with-photos attempt failed (likely a CORS-blocked
   * profile image) and this fell back to plain letter avatars instead. */
  withPhotos: boolean;
}

/**
 * Draws the final roster onto a canvas (division-ring avatar + name + "D{n}"
 * per person) and copies it to the clipboard as a PNG. Player profile
 * photos are hosted on an external CDN outside our control — if it doesn't
 * serve permissive CORS headers, drawing a photo taints the canvas and
 * `toBlob` fails; this is caught and the whole image is silently redrawn
 * using plain letter avatars instead of failing outright.
 */
export async function copyRosterImageToClipboard(
  streamers: StreamerRecord[],
  title: string,
): Promise<CopyRosterImageResult> {
  if (streamers.length === 0) return { ok: false, withPhotos: false };
  if (typeof navigator === "undefined" || !navigator.clipboard || typeof ClipboardItem === "undefined") {
    return { ok: false, withPhotos: false };
  }

  try {
    const blob = await buildBlob(streamers, true, title);
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return { ok: true, withPhotos: true };
  } catch {
    try {
      const blob = await buildBlob(streamers, false, title);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      return { ok: true, withPhotos: false };
    } catch {
      return { ok: false, withPhotos: false };
    }
  }
}
