// Sprite drawing helpers (docs/pitch/04 §3-4): atlas cells anchored at the feet, mirrored for left-facing,
// scaled by the depth factor. Coordinates are rounded so pixel art stays crisp on the integer-scaled canvas.

import { FOOT_Y, type FrameRect } from "../data/animations";

export interface DrawFrameOptions {
  /** Depth scale (`depthScale(y)`), 1 = native size. */
  scale?: number;
  /** Flip horizontally around the anchor (left-facing uses the side frames mirrored). */
  mirror?: boolean;
  alpha?: number;
}

/**
 * Draws one atlas cell so that the cell's feet baseline (`FOOT_Y`, horizontal centre of the cell) lands on
 * (`footX`, `footY`).
 */
export function drawFrame(
  g: CanvasRenderingContext2D,
  image: CanvasImageSource,
  rect: FrameRect,
  footX: number,
  footY: number,
  { scale = 1, mirror = false, alpha = 1 }: DrawFrameOptions = {},
) {
  const w = Math.round(rect.sw * scale);
  const h = Math.round(rect.sh * scale);
  const top = Math.round(footY - FOOT_Y * scale);
  const previousAlpha = g.globalAlpha;
  if (alpha !== 1) g.globalAlpha = previousAlpha * alpha;
  if (mirror) {
    g.save();
    g.translate(Math.round(footX), 0);
    g.scale(-1, 1);
    g.drawImage(image, rect.sx, rect.sy, rect.sw, rect.sh, -Math.round(w / 2), top, w, h);
    g.restore();
  } else {
    g.drawImage(image, rect.sx, rect.sy, rect.sw, rect.sh, Math.round(footX - w / 2), top, w, h);
  }
  if (alpha !== 1) g.globalAlpha = previousAlpha;
}

/** Source rectangle of frame `frame` in a horizontal strip of `frames` equal frames. */
export function stripRect(imageWidth: number, imageHeight: number, frames: number, frame: number): FrameRect {
  const sw = imageWidth / frames;
  const f = Math.max(0, Math.min(frames - 1, Math.floor(frame)));
  return { sx: Math.round(f * sw), sy: 0, sw: Math.round(sw), sh: imageHeight };
}

/** Draws a strip frame with its bottom-centre on (`x`, `y`) — the anchor for balls, dust and other ground props. */
export function drawStripFrame(
  g: CanvasRenderingContext2D,
  image: CanvasImageSource & { width: number; height: number },
  frames: number,
  frame: number,
  x: number,
  y: number,
  { scale = 1, alpha = 1 }: Pick<DrawFrameOptions, "scale" | "alpha"> = {},
) {
  const rect = stripRect(image.width, image.height, frames, frame);
  const w = Math.round(rect.sw * scale);
  const h = Math.round(rect.sh * scale);
  const previousAlpha = g.globalAlpha;
  if (alpha !== 1) g.globalAlpha = previousAlpha * alpha;
  g.drawImage(image, rect.sx, rect.sy, rect.sw, rect.sh, Math.round(x - w / 2), Math.round(y - h), w, h);
  if (alpha !== 1) g.globalAlpha = previousAlpha;
}

/** Stretches a 9-slice image (`inset` px corners, see `slice` in assetMeta) over a `w`×`h` rectangle. */
export function drawNineSlice(
  g: CanvasRenderingContext2D,
  image: CanvasImageSource & { width: number; height: number },
  inset: number,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const sw = image.width;
  const sh = image.height;
  const i = Math.min(inset, Math.floor(w / 2), Math.floor(h / 2));
  const cols: Array<[number, number, number, number]> = [
    [0, inset, x, i],
    [i, sw - 2 * inset, x + i, w - 2 * i],
    [sw - inset, inset, x + w - i, i],
  ];
  const rows: Array<[number, number, number, number]> = [
    [0, inset, y, i],
    [i, sh - 2 * inset, y + i, h - 2 * i],
    [sh - inset, inset, y + h - i, i],
  ];
  for (const [sy, srcH, dy, dh] of rows) {
    for (const [sx, srcW, dx, dw] of cols) {
      if (srcW > 0 && srcH > 0 && dw > 0 && dh > 0) g.drawImage(image, sx, sy, srcW, srcH, dx, dy, dw, dh);
    }
  }
}
