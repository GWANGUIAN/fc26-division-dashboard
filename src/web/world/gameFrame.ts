/**
 * The picture frame around the game (assets/world/ui/game-outer-frame.webp, 1672×941, see-through middle).
 *
 * The frame is not drawn as one stretched picture: its straight line runs are stretched while the corner
 * leaves and the four middle diamonds keep their shape, so it can be built around a stage of any size and
 * hug it exactly. The line sits right outside the stage; the ornaments (measured on the art) are drawn whole
 * and in front of the game, so the leaves and diamonds reach a little way in over its edge.
 */

/** Art pixels of the picture; the pieces below are all in these units. */
export const FRAME_ART_WIDTH = 1672;
export const FRAME_ART_HEIGHT = 941;

/** Art pixels per stage pixel at the frame's natural size: the stage is 640 px, the picture's opening 1536. */
export const FRAME_ART_PER_STAGE_PIXEL = 2.4;

/** Thickness of each band: from the picture's edge to the inner edge of the line. The stage sits inside them. */
export const FRAME_BAND_ART = { left: 21, right: 20, top: 20, bottom: 26 } as const;

/** Smallest CSS-pixels-per-art-pixel the frame shrinks to when the window leaves little room around the stage. */
export const FRAME_MIN_SCALE = 0.3;

type Span = readonly [from: number, to: number];

/** Each corner cluster of leaves is copied whole: a square this many art pixels wide. */
const CORNER = 95;

/** How far the ornaments of each side reach in from the picture's edge, in art pixels (diamonds and line). */
const DEPTH = { top: 40, bottom: 41, left: 44, right: 44 } as const;

/**
 * The runs between the corners along a side, in art pixels: a stretchy line run, the fixed middle diamond,
 * another line run. Line runs are plain stretches with a margin to the ornaments, so stretching them only
 * lengthens or shortens a plain line.
 */
interface SideParts {
  lineA: Span;
  center: Span;
  lineB: Span;
}

/** Top and bottom sides, along x (between the corners). */
const X_PARTS: SideParts = { lineA: [100, 770], center: [772, 900], lineB: [906, 1572] };
/** Left and right sides, along y (between the corners). */
const Y_PARTS: SideParts = { lineA: [100, 415], center: [418, 505], lineB: [512, 840] };

/** Where the frame goes, in CSS pixels inside the overlay. */
export interface FrameLayout {
  left: number;
  top: number;
  width: number;
  height: number;
  /** CSS pixels per art pixel. */
  scale: number;
  /** Device pixels per CSS pixel. */
  pixelRatio: number;
  /** The frame's thickness on each side, in CSS pixels (a whole number of device pixels). The stage sits inside them. */
  bands: { left: number; right: number; top: number; bottom: number };
}

/** One copy of a piece of art onto the frame canvas: source in art pixels, destination in canvas device pixels. */
export interface FramePiece {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

/** Destination runs (device pixels, whole numbers, touching) for the three parts of one side. */
function layoutSide(parts: SideParts, start: number, length: number, unit: number): Array<{ src: Span; from: number; to: number }> {
  const center = (parts.center[1] - parts.center[0]) * unit;
  const line = Math.max(0, (length - center) / 2);
  const order: Array<[Span, number]> = [
    [parts.lineA, line],
    [parts.center, center],
    [parts.lineB, line],
  ];
  let cursor = 0;
  return order.map(([src, run], index) => {
    const from = Math.round(start + cursor);
    cursor += run;
    // The last run ends exactly on the side's end so the rounded pieces never leave a seam.
    const to = index === order.length - 1 ? Math.round(start + length) : Math.round(start + cursor);
    return { src, from, to };
  });
}

/** Every piece to copy to a canvas of the frame's size (`width`/`height` × pixelRatio). */
export function framePieces(frame: FrameLayout): FramePiece[] {
  const { pixelRatio: ratio, scale } = frame;
  const unit = scale * ratio;
  const width = Math.round(frame.width * ratio);
  const height = Math.round(frame.height * ratio);
  const corner = Math.round(CORNER * unit);
  const depth = {
    top: Math.round(DEPTH.top * unit),
    bottom: Math.round(DEPTH.bottom * unit),
    left: Math.round(DEPTH.left * unit),
    right: Math.round(DEPTH.right * unit),
  };
  const pieces: FramePiece[] = [];

  // Corner clusters, whole.
  for (const [sx, sy, dx, dy] of [
    [0, 0, 0, 0],
    [FRAME_ART_WIDTH - CORNER, 0, width - corner, 0],
    [0, FRAME_ART_HEIGHT - CORNER, 0, height - corner],
    [FRAME_ART_WIDTH - CORNER, FRAME_ART_HEIGHT - CORNER, width - corner, height - corner],
  ]) {
    pieces.push({ sx, sy, sw: CORNER, sh: CORNER, dx, dy, dw: corner, dh: corner });
  }

  // Top and bottom sides.
  const horizontal = (sy: number, sh: number, dy: number, dh: number) => {
    for (const { src, from, to } of layoutSide(X_PARTS, corner, width - 2 * corner, unit)) {
      if (to > from) pieces.push({ sx: src[0], sy, sw: src[1] - src[0], sh, dx: from, dy, dw: to - from, dh });
    }
  };
  horizontal(0, DEPTH.top, 0, depth.top);
  horizontal(FRAME_ART_HEIGHT - DEPTH.bottom, DEPTH.bottom, height - depth.bottom, depth.bottom);

  // Left and right sides.
  const vertical = (sx: number, sw: number, dx: number, dw: number) => {
    for (const { src, from, to } of layoutSide(Y_PARTS, corner, height - 2 * corner, unit)) {
      if (to > from) pieces.push({ sx, sy: src[0], sw, sh: src[1] - src[0], dx, dy: from, dw, dh: to - from });
    }
  };
  vertical(0, DEPTH.left, 0, depth.left);
  vertical(FRAME_ART_WIDTH - DEPTH.right, DEPTH.right, width - depth.right, depth.right);
  return pieces;
}

/**
 * The frame around a stage: `scale` follows the stage's own scale (so the frame keeps the same proportions
 * at every size), but shrinks to fit the room the window leaves around the stage, down to FRAME_MIN_SCALE.
 * Where even that does not fit (a stage that fills the window) the frame is clamped to the window, and its
 * thin bands lie over the very edge of the stage.
 */
export function computeFrameLayout(
  stage: { left: number; top: number; width: number; height: number },
  viewportWidth: number,
  viewportHeight: number,
  pixelRatio: number,
  stageScale: number,
): FrameLayout {
  const room = {
    left: stage.left,
    right: viewportWidth - (stage.left + stage.width),
    top: stage.top,
    bottom: viewportHeight - (stage.top + stage.height),
  };
  const roomScale = Math.min(
    room.left / FRAME_BAND_ART.left,
    room.right / FRAME_BAND_ART.right,
    room.top / FRAME_BAND_ART.top,
    room.bottom / FRAME_BAND_ART.bottom,
  );
  const scale = Math.max(FRAME_MIN_SCALE, Math.min(stageScale / FRAME_ART_PER_STAGE_PIXEL, roomScale));
  const thick = (art: number) => Math.max(1, Math.round(art * scale * pixelRatio)) / pixelRatio;
  const bands = { left: thick(FRAME_BAND_ART.left), right: thick(FRAME_BAND_ART.right), top: thick(FRAME_BAND_ART.top), bottom: thick(FRAME_BAND_ART.bottom) };
  const left = Math.max(0, stage.left - bands.left);
  const top = Math.max(0, stage.top - bands.top);
  const right = Math.min(viewportWidth, stage.left + stage.width + bands.right);
  const bottom = Math.min(viewportHeight, stage.top + stage.height + bands.bottom);
  return { left, top, width: right - left, height: bottom - top, scale, pixelRatio, bands };
}
