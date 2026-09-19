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
}

/**
 * Largest whole-number multiplier that fits the stage in the viewport, counted in *device* pixels
 * (min 1). Counting device pixels keeps every logical pixel an exact block of screen pixels even on
 * 125%/150% displays where a CSS-pixel integer would fall between physical pixels. On 100% and 200%
 * screens this equals the plain floor(min(W/640, H/360)) from the design doc. Leftover space is the
 * dark letterbox.
 */
export function computeStageLayout(viewportWidth: number, viewportHeight: number, devicePixelRatio = 1): StageLayout {
  const dpr = devicePixelRatio > 0 ? devicePixelRatio : 1;
  const deviceScale = Math.max(1, Math.floor(Math.min((viewportWidth * dpr) / STAGE_WIDTH, (viewportHeight * dpr) / STAGE_HEIGHT)));
  const cssScale = deviceScale / dpr;
  const snap = (cssPixels: number) => Math.round(cssPixels * dpr) / dpr;
  return {
    deviceScale,
    cssScale,
    left: snap((viewportWidth - STAGE_WIDTH * cssScale) / 2),
    top: snap((viewportHeight - STAGE_HEIGHT * cssScale) / 2),
  };
}
