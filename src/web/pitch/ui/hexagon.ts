// Hexagon geometry + drawing for the stat screen (docs/pitch/03 §5, 05 §7). Six axes, index 0 at 12 o'clock and the
// rest clockwise. The art (`ui/hex-bg` / `hex-fill` / `hex-frame`, all centred on the hexagon) already contains the
// rings and the corner nodes, so code only tints the fill polygon and marks the selected / hovered node; without
// the images it draws the rings, the polygon and the nodes itself. Pure geometry has no DOM dependency (tests).

import { STAT_AXIS_COUNT, type StatKind } from "../data/stats";
import type { AssetImage } from "../engine/assets";

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Centre and circumradius of the hexagon in logical px (03 §5). */
export const HEX = { cx: 276, cy: 290, radius: 140, rings: 6 } as const;

/** The polygon stands for this fraction of every axis until real values exist (03 §5 "60% 균일"). */
export const PLACEHOLDER_FILL = 0.6;

export const NODE_HIT_RADIUS = 14;
/** The `node-selected` marker (and its kind ring) is drawn this many px closer to the centre than the corner (the click target stays on the corner). */
export const SELECTED_NODE_INSET = 23;
/**
 * Per-axis fine adjustment (px, screen coordinates) of the ring and the selected marker so they sit exactly on the
 * frame's bolts. Index = axis: 12 o'clock, 2, 4~5, 6, 7~8, 10 o'clock.
 */
export const NODE_NUDGE: ReadonlyArray<Readonly<{ x: number; y: number }>> = [
  { x: -1, y: -2 },
  { x: 6, y: 7 },
  { x: 6, y: -3 },
  { x: -1, y: -1 },
  { x: -6, y: -3 },
  { x: -7, y: 7 },
];
export const AXIS_PLATE = { w: 72, h: 22 } as const;
/** Distance between a corner and its label plate. */
const PLATE_GAP = 16;

/** Text / ring colour of an axis by kind: common = cyan, position-specific = gold (11 §6-2). */
export const KIND_COLORS: Readonly<Record<StatKind, string>> = { common: "#2be4ff", unique: "#ffd23f" };

export type AxisStep = "cw" | "ccw" | "next";

/** Corner `index` (0 = top, clockwise) of a hexagon with the given radius; screen y grows downward. */
export function hexVertex(index: number, radius: number = HEX.radius, cx: number = HEX.cx, cy: number = HEX.cy): Point {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / STAT_AXIS_COUNT;
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

export function hexVertices(radius: number = HEX.radius, cx: number = HEX.cx, cy: number = HEX.cy): Point[] {
  return Array.from({ length: STAT_AXIS_COUNT }, (_, index) => hexVertex(index, radius, cx, cy));
}

/** Radius of ring `ring` (1 = innermost … `HEX.rings` = outer edge). */
export function ringRadius(ring: number): number {
  return (HEX.radius * Math.min(HEX.rings, Math.max(1, ring))) / HEX.rings;
}

/** Corners of the value polygon: `value` 0..100 per axis, `null` = the placeholder fraction. */
export function fillPolygon(values: readonly (number | null)[]): Point[] {
  return Array.from({ length: STAT_AXIS_COUNT }, (_, index) => {
    const raw = values[index];
    const fraction = raw === null || raw === undefined ? PLACEHOLDER_FILL : Math.min(1, Math.max(0, raw / 100));
    return hexVertex(index, HEX.radius * fraction);
  });
}

/** Alpha of the polygon: one uniform breathing pulse (all corners together). */
export function fillPulse(seconds: number): number {
  return 0.5 + 0.2 * Math.sin(seconds * 2.4);
}

/** Label plate of axis `index`: above the top corner, below the bottom one, beside the four side corners. */
export function labelPlateRect(index: number): Rect {
  const v = hexVertex(index);
  const { w, h } = AXIS_PLATE;
  const x = Math.round(v.x);
  const y = Math.round(v.y);
  if (index === 0) return { x: x - w / 2, y: y - PLATE_GAP - h, w, h };
  if (index === 3) return { x: x - w / 2, y: y + PLATE_GAP, w, h };
  if (index < 3) return { x: x + PLATE_GAP, y: y - h / 2, w, h };
  return { x: x - PLATE_GAP - w, y: y - h / 2, w, h };
}

const inside = (rect: Rect, x: number, y: number) => x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;

/** Axis whose corner node (within `radius` px) is at the point, or -1. The nearest node wins. */
export function hitNode(x: number, y: number, radius: number = NODE_HIT_RADIUS): number {
  let best = -1;
  let bestDistance = radius;
  for (let index = 0; index < STAT_AXIS_COUNT; index++) {
    const v = hexVertex(index);
    const d = Math.hypot(x - v.x, y - v.y);
    if (d <= bestDistance) {
      best = index;
      bestDistance = d;
    }
  }
  return best;
}

/** Axis under the pointer: its node or its label plate; -1 when neither. */
export function hitAxis(x: number, y: number): number {
  const node = hitNode(x, y);
  if (node >= 0) return node;
  for (let index = 0; index < STAT_AXIS_COUNT; index++) if (inside(labelPlateRect(index), x, y)) return index;
  return -1;
}

/** Selection movement: clockwise / counter-clockwise / Tab (= next, clockwise), wrapping around. */
export function cycleAxis(current: number, step: AxisStep): number {
  const n = STAT_AXIS_COUNT;
  const from = ((Math.round(current) % n) + n) % n;
  return step === "ccw" ? (from + n - 1) % n : (from + 1) % n;
}

type Image = AssetImage | undefined;

/** Ring outlines + spokes, used when `hex-bg` is missing. */
function drawPlaceholderGrid(g: CanvasRenderingContext2D) {
  g.save();
  g.fillStyle = "rgba(10, 20, 44, 0.85)";
  g.strokeStyle = "rgba(62, 230, 193, 0.45)";
  g.lineWidth = 1;
  for (let ring = HEX.rings; ring >= 1; ring--) {
    const points = hexVertices(ringRadius(ring));
    g.beginPath();
    points.forEach((p, i) => (i === 0 ? g.moveTo(p.x, p.y) : g.lineTo(p.x, p.y)));
    g.closePath();
    if (ring === HEX.rings) g.fill();
    g.stroke();
  }
  g.beginPath();
  for (const p of hexVertices()) {
    g.moveTo(HEX.cx, HEX.cy);
    g.lineTo(p.x, p.y);
  }
  g.stroke();
  g.restore();
}

export interface HexagonDrawOptions {
  images: { bg: Image; fill: Image; frame: Image; nodeHover: Image; nodeSelected: Image };
  values: readonly (number | null)[];
  selected: number;
  hovered: number;
  seconds: number;
  /** Kind of each axis: a thin ring in its colour goes around the node. Omit / null = no ring (placeholder axes). */
  kinds?: readonly (StatKind | null)[];
}

/** Draws the hexagon board (rings, pulsing fill, frame) and the highlighted nodes. */
export function drawHexagon(g: CanvasRenderingContext2D, { images, values, selected, hovered, seconds, kinds }: HexagonDrawOptions) {
  const centred = (image: NonNullable<Image>) => g.drawImage(image, Math.round(HEX.cx - image.width / 2), Math.round(HEX.cy - image.height / 2));
  if (images.bg) centred(images.bg);
  else drawPlaceholderGrid(g);

  const flat = values.every((value) => value === null);
  g.save();
  g.globalAlpha = fillPulse(seconds);
  if (flat && images.fill) centred(images.fill);
  else {
    const points = fillPolygon(values);
    g.fillStyle = "#3ee6c1";
    g.strokeStyle = "#9fe9ff";
    g.lineWidth = 2;
    g.beginPath();
    points.forEach((p, i) => (i === 0 ? g.moveTo(p.x, p.y) : g.lineTo(p.x, p.y)));
    g.closePath();
    g.fill();
    g.stroke();
  }
  g.restore();
  if (images.frame) centred(images.frame);

  for (let index = 0; index < STAT_AXIS_COUNT; index++) {
    const isSelected = index === selected;
    const isHover = index === hovered;
    // the kind ring of every axis and the selected marker sit SELECTED_NODE_INSET px in from the corner, toward the centre
    const base = hexVertex(index, isSelected ? HEX.radius - SELECTED_NODE_INSET : HEX.radius);
    const nudge = isSelected ? NODE_NUDGE[index]! : { x: 0, y: 0 };
    const v = { x: base.x + nudge.x, y: base.y + nudge.y };
    const kind = kinds?.[index];
    if (kind) {
      g.strokeStyle = KIND_COLORS[kind];
      g.lineWidth = 1;
      g.beginPath();
      const ringBase = hexVertex(index, HEX.radius - SELECTED_NODE_INSET);
      const ring = { x: ringBase.x + NODE_NUDGE[index]!.x, y: ringBase.y + NODE_NUDGE[index]!.y };
      g.arc(Math.round(ring.x), Math.round(ring.y), isSelected ? 12 : 10, 0, Math.PI * 2);
      g.stroke();
    }
    const sprite = isSelected ? images.nodeSelected : isHover ? images.nodeHover : undefined;
    if (sprite) g.drawImage(sprite, Math.round(v.x - sprite.width / 2), Math.round(v.y - sprite.height / 2));
    else if (isSelected || isHover || !images.bg) {
      const r = isSelected ? 7 : 5;
      g.fillStyle = "#0a0a1a";
      g.fillRect(Math.round(v.x) - r - 2, Math.round(v.y) - r - 2, r * 2 + 4, r * 2 + 4);
      g.fillStyle = isSelected ? "#ffd23f" : isHover ? "#9fe9ff" : "#3ee6c1";
      g.fillRect(Math.round(v.x) - r, Math.round(v.y) - r, r * 2, r * 2);
    }
  }
}
