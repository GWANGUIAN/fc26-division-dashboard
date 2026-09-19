import { computeFrameLayout, type FrameLayout } from "./gameFrame";

export const STAGE_WIDTH = 640;
export const STAGE_HEIGHT = 360;

export interface StageLayout {
  /** Whole device pixels per logical pixel (the crisp-rendering multiplier). */
  deviceScale: number;
  /** CSS scale to apply to the 640×360 stage: deviceScale / devicePixelRatio. */
  cssScale: number;
  /** Top-left CSS offset of the scaled stage inside the overlay, snapped to device pixels. */
  left: number;
  top: number;
  /** The picture frame around the stage; null when the window is too small to show the whole stage. */
  frame: FrameLayout | null;
}

/**
 * Largest whole-number multiplier that fits the stage in the viewport, counted in *device* pixels
 * (min 1). Counting device pixels keeps every logical pixel an exact block of screen pixels even on
 * 125%/150% displays where a CSS-pixel integer would fall between physical pixels. On 100% and 200%
 * screens this equals the plain floor(min(W/640, H/360)) from the design doc. Leftover space is the
 * dark letterbox, and the frame (gameFrame.ts) is drawn in it around the stage — it never changes the
 * stage's size.
 */
export function computeStageLayout(viewportWidth: number, viewportHeight: number, devicePixelRatio = 1, framed = true): StageLayout {
  const dpr = devicePixelRatio > 0 ? devicePixelRatio : 1;
  const deviceScale = Math.max(1, Math.floor(Math.min((viewportWidth * dpr) / STAGE_WIDTH, (viewportHeight * dpr) / STAGE_HEIGHT)));
  const cssScale = deviceScale / dpr;
  const snap = (cssPixels: number) => Math.round(cssPixels * dpr) / dpr;
  const left = snap((viewportWidth - STAGE_WIDTH * cssScale) / 2);
  const top = snap((viewportHeight - STAGE_HEIGHT * cssScale) / 2);
  const width = STAGE_WIDTH * cssScale;
  const height = STAGE_HEIGHT * cssScale;
  // A window smaller than the stage already crops it, so no frame there.
  const epsilon = 1e-6;
  const stageFits = left >= -epsilon && top >= -epsilon && left + width <= viewportWidth + epsilon && top + height <= viewportHeight + epsilon;
  const frame = framed && stageFits ? computeFrameLayout({ left, top, width, height }, viewportWidth, viewportHeight, dpr, cssScale) : null;
  return { deviceScale, cssScale, left, top, frame };
}
