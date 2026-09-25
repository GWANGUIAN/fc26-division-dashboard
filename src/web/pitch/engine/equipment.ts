// Draws a character frame together with its worn items (docs/pitch/13 §4). The items are static per-direction
// images; the head anchor of every atlas cell (data/equipmentAnchors.generated.ts) makes them follow the head
// through every clip. Layer order: down/side = back item behind the body, up = back item over the body (face hidden).

import { CELL_SIZE, FOOT_Y, type Direction, type FrameRect } from "../data/animations";
import { CHARACTER_ANCHORS, HEAD_REF } from "../data/equipmentAnchors.generated";
import { faceDrop, fitFor } from "../data/equipmentFit";
import { EQUIP_SHEETS, equipItem, type EquipItem, type Loadout } from "../data/equipment";
import { drawFrame, type DrawFrameOptions } from "./sprite";

type Bitmap = CanvasImageSource & { width: number; height: number };
export type ImageLookup = (key: string) => Bitmap | undefined;

/** Item scale follows the character's head width (items are baked for `HEAD_REF`), snapped so pixels stay even. */
const SCALE_MIN = 0.7;
const SCALE_MAX = 1.3;
/** Where an item sits relative to the measured head top, in head widths. */
const HAT_SINK = 0.5;
const FACE_EYE = 0.5;
const BACK_NECK = 0.8;
/** Side view: the face points to +x, the glasses sit a little in front of the head centre. */
const FACE_FORWARD = 0.05;
/** Side view: cape / wings / backpack hang behind the back (away from the facing direction). */
const BACK_BEHIND = 0.4;

/** Direction of an atlas cell (atlas layout of data/animations.ts): idle row pairs, run/shoot rows, skills, celebrations. */
export function directionOfCell(row: number, col: number): Direction {
  if (row === 0) return col < 2 ? "down" : col < 4 ? "side" : "up";
  if (row === 1 || row >= 8) return "down";
  if (row === 2 || row === 4 || row === 5) return "side";
  return "up";
}

export function directionOfRect(rect: FrameRect): Direction {
  return directionOfCell(Math.round(rect.sy / CELL_SIZE), Math.round(rect.sx / CELL_SIZE));
}

export interface HeadAnchor {
  /** Head centre x / head top y inside the 96×96 cell, and the head width. */
  x: number;
  y: number;
  w: number;
  /** Median head width of the character (for the item scale). */
  headW: number;
}

export function headAnchor(characterId: string, rect: FrameRect): HeadAnchor | undefined {
  const anchors = CHARACTER_ANCHORS[characterId];
  if (!anchors) return undefined;
  const cols = Math.round(rect.sx / CELL_SIZE);
  const row = Math.round(rect.sy / CELL_SIZE);
  const cell = anchors.cells[row * 10 + cols];
  return cell ? { x: cell[0], y: cell[1], w: cell[2], headW: anchors.headW } : undefined;
}

export const itemScale = (headW: number) => Math.round(Math.min(SCALE_MAX, Math.max(SCALE_MIN, headW / HEAD_REF)) * 20) / 20;

interface PlacedItem {
  item: EquipItem;
  image: Bitmap;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

function placeItem(item: EquipItem | undefined, dir: Direction, lookup: ImageLookup): PlacedItem | undefined {
  if (!item) return undefined;
  const sheet = EQUIP_SHEETS[item.sheet];
  const image = lookup(`equipment/acc-${item.sheet}`);
  if (!sheet || !image) return undefined;
  const [cw, ch] = sheet.cell;
  // columns: front / side / back; an item drawn outer-face-first shows that face from behind (up) and the inner one from the front
  const view = dir === "side" ? 1 : (dir === "down") === !item.faceOutFront ? 0 : 2;
  return { item, image, sx: view * cw, sy: item.row * ch, sw: cw, sh: ch };
}

/** Everything `drawItem` needs about the character's current cell, in screen space. */
interface ItemFrame {
  characterId: string;
  anchor: HeadAnchor;
  dir: Direction;
  footX: number;
  footY: number;
  /** Depth scale of the body. */
  scale: number;
  mirror: boolean;
  alpha: number;
}

function drawItem(g: CanvasRenderingContext2D, placed: PlacedItem | undefined, frame: ItemFrame) {
  if (!placed) return;
  const { item, image, sx, sy, sw, sh } = placed;
  const { characterId, anchor, dir, footX, footY, scale, mirror, alpha } = frame;
  const fit = fitFor(characterId, item.id, dir);
  const k = scale * itemScale(anchor.headW) * fit.scale;
  const flip = mirror ? -1 : 1;
  let cellX = anchor.x;
  let cellY: number;
  let top: number;
  const w = Math.round(sw * k);
  const h = Math.round(sh * k);
  const dxPx = ((item.dx ?? 0) + (dir === "side" ? (item.sideDx ?? 0) : 0)) * k;
  const dyPx = (item.dy ?? 0) * k + fit.dy * scale;
  if (item.slot === "hat") {
    cellY = anchor.y + anchor.headW * HAT_SINK;
    top = footY + (cellY - FOOT_Y) * scale - h + dyPx;
  } else if (item.slot === "face") {
    cellY = anchor.y + anchor.headW * FACE_EYE + faceDrop(characterId);
    if (dir === "side") cellX += anchor.headW * FACE_FORWARD;
    top = footY + (cellY - FOOT_Y) * scale - h / 2 + dyPx;
  } else {
    cellY = anchor.y + anchor.headW * BACK_NECK;
    if (dir === "side") cellX -= anchor.headW * BACK_BEHIND;
    top = footY + (cellY - FOOT_Y) * scale + dyPx;
  }
  const centreX = footX + flip * (cellX - CELL_SIZE / 2) * scale + flip * (dxPx + fit.dx * scale);
  const previousAlpha = g.globalAlpha;
  if (alpha !== 1) g.globalAlpha = previousAlpha * alpha;
  if (mirror) {
    g.save();
    g.translate(Math.round(centreX), 0);
    g.scale(-1, 1);
    g.drawImage(image, sx, sy, sw, sh, -Math.round(w / 2), Math.round(top), w, h);
    g.restore();
  } else {
    g.drawImage(image, sx, sy, sw, sh, Math.round(centreX - w / 2), Math.round(top), w, h);
  }
  if (alpha !== 1) g.globalAlpha = previousAlpha;
}

/**
 * `drawFrame` plus the worn items. Falls back to the plain body when nothing is worn, the anchor table has no
 * entry for this cell, or the item art is not loaded (missing art is never an error).
 */
export function drawEquippedFrame(
  g: CanvasRenderingContext2D,
  image: CanvasImageSource,
  rect: FrameRect,
  characterId: string,
  loadout: Loadout | undefined,
  lookup: ImageLookup,
  footX: number,
  footY: number,
  options: DrawFrameOptions = {},
) {
  const anchor = loadout && (loadout.hat || loadout.face || loadout.back) ? headAnchor(characterId, rect) : undefined;
  if (!loadout || !anchor) {
    drawFrame(g, image, rect, footX, footY, options);
    return;
  }
  const dir = directionOfRect(rect);
  const frame: ItemFrame = { characterId, anchor, dir, footX, footY, scale: options.scale ?? 1, mirror: options.mirror ?? false, alpha: options.alpha ?? 1 };
  const back = placeItem(equipItem(loadout.back), dir, lookup);
  const face = dir === "up" ? undefined : placeItem(equipItem(loadout.face), dir, lookup);
  const hat = placeItem(equipItem(loadout.hat), dir, lookup);
  if (dir !== "up") drawItem(g, back, frame);
  drawFrame(g, image, rect, footX, footY, options);
  if (dir === "up") drawItem(g, back, frame);
  drawItem(g, face, frame);
  drawItem(g, hat, frame);
}
