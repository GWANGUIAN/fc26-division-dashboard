import { WORLD_ONAIR_SOOP_IDS } from "../../../shared/world-onair.js";
import type { MapBuilding, MapProp, Rect, TileBox } from "../types";
import type { WorldAssets } from "../worldAssets";
import type { Camera } from "./camera";
import { ON_AIR_RISE, ON_AIR_SIZE } from "./doorSigns";
import { FONT, TILE } from "./render";
import type { BuildingInstance } from "./scene";

/**
 * The ON AIR sign over a member's front door (docs/world/15-onair-sign.md). It hangs on the house
 * facade under the "~의 집" name plate, lit while the member is live on SOOP, and a click opens their
 * broadcast (or their station when they are off air).
 */

export { ON_AIR_RISE };
export const ON_AIR_KEYS = { on: "props/onair-sign-on", off: "props/onair-sign-off" } as const;
/** Size drawn while the art is missing; the converted webp is this size (scripts/world-art-manifest.json, "onair"). */
export const ON_AIR_FALLBACK_SIZE = ON_AIR_SIZE;
/** Forgiveness around the sign for a mouse click, in stage px. */
const HIT_PAD = 3;

export interface OnAirSign {
  /** The member's SOOP id (= their world id). */
  soopId: string;
  buildingIndex: number;
  /** The strip of the building drawn last: the sign is painted right after it so it never sinks behind its own wall. */
  stripIndex: number;
  /** Bottom centre of the sign in world px. */
  x: number;
  y: number;
}

const HOUSE_PREFIX = "house-";

/** The prop lying at a house's entrance: an entrance mat placed by hand, by eye, on the middle of the door art. */
const ENTRANCE_MAT = "mat-door";
/** How far below the doorstep row and how far aside of the door tiles a mat may lie and still be that house's. */
const MAT_REACH = 64;

/**
 * The x of a house's entrance: the middle of its entrance mat. The mat is the value the map's author aligned to
 * the visible door by eye, so it is what the sign follows; the door tiles' middle is only the fallback (it is a
 * few px off for most houses, up to 21 px). Falls back too when the map gives the house no mat.
 */
export function entranceX(door: TileBox, props: readonly MapProp[]): number {
  const tileMiddle = (door[0] + door[2] / 2) * TILE;
  const doorstep = (door[1] + 1) * TILE;
  let nearest: MapProp | null = null;
  for (const prop of props) {
    if (prop.prop !== ENTRANCE_MAT || prop.y < doorstep || prop.y > doorstep + MAT_REACH || Math.abs(prop.x - tileMiddle) > MAT_REACH) continue;
    if (!nearest || Math.abs(prop.x - tileMiddle) < Math.abs(nearest.x - tileMiddle)) nearest = prop;
  }
  return nearest ? nearest.x : tileMiddle;
}

/** The part of the map data the signs are placed from. */
export interface OnAirMapData {
  buildings: readonly Pick<MapBuilding, "id" | "door">[];
  props: readonly MapProp[];
}

/**
 * Where the "○○의 집" name plate of a house is anchored: x = the middle of the entrance mat (the same axis as its
 * ON AIR sign), y = the doorstep row's bottom edge. `null` for a house the map gives no door.
 */
export function homeSignAnchor(map: OnAirMapData, houseId: string): { x: number; y: number } | null {
  const door = map.buildings.find((entry) => entry.id === houseId)?.door;
  return door ? { x: entranceX(door, map.props), y: (door[1] + 1) * TILE } : null;
}

/** A sign for every member house of a scene, centred on the house's entrance mat. */
export function findOnAirSigns(buildings: readonly BuildingInstance[], map: OnAirMapData): OnAirSign[] {
  const members: readonly string[] = WORLD_ONAIR_SOOP_IDS;
  const signs: OnAirSign[] = [];
  buildings.forEach((building, buildingIndex) => {
    if (!building.id.startsWith(HOUSE_PREFIX) || building.fronts.length === 0) return;
    const soopId = building.id.slice(HOUSE_PREFIX.length);
    const door = map.buildings.find((entry) => entry.id === building.id)?.door;
    if (!members.includes(soopId) || !door) return;
    // Strips are drawn by ascending sortY (ties by index), so the last of the largest sortY is painted last.
    let stripIndex = 0;
    building.fronts.forEach((front, index) => {
      if (front.sortY >= building.fronts[stripIndex].sortY) stripIndex = index;
    });
    // y: the doorstep row's bottom edge, the same base the name plate hangs from.
    signs.push({ soopId, buildingIndex, stripIndex, x: entranceX(door, map.props), y: (door[1] + 1) * TILE - ON_AIR_RISE });
  });
  return signs;
}

export interface SignSize {
  w: number;
  h: number;
}

/** The size of the sign's art (both states are converted to one size), or the fallback size before it exists. */
export function onAirSize(assets: Pick<WorldAssets, "get">): SignSize {
  const image = assets.get(ON_AIR_KEYS.on) ?? assets.get(ON_AIR_KEYS.off);
  return image ? { w: image.width, h: image.height } : { w: ON_AIR_FALLBACK_SIZE.w, h: ON_AIR_FALLBACK_SIZE.h };
}

export function onAirRect(sign: OnAirSign, size: SignSize): Rect {
  return { x: sign.x - size.w / 2, y: sign.y - size.h, w: size.w, h: size.h };
}

/** The sign under a world point, if any. */
export function onAirSignAt(signs: readonly OnAirSign[], size: SignSize, x: number, y: number): OnAirSign | null {
  for (const sign of signs) {
    const rect = onAirRect(sign, size);
    if (x >= rect.x - HIT_PAD && x < rect.x + rect.w + HIT_PAD && y >= rect.y - HIT_PAD && y < rect.y + rect.h + HIT_PAD) return sign;
  }
  return null;
}

/** A soft red wash on the wall around a lit sign. Drawn under the sign, so the pixel art itself stays crisp. */
function drawGlow(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, time: number, reduced: boolean) {
  const pulse = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(time * 2.6);
  const radius = w * 0.78;
  const gradient = ctx.createRadialGradient(cx, cy, 3, cx, cy, radius);
  gradient.addColorStop(0, `rgba(255, 64, 44, ${(0.2 + 0.1 * pulse).toFixed(3)})`);
  gradient.addColorStop(1, "rgba(255, 64, 44, 0)");
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = gradient;
  ctx.fillRect(Math.round(cx - radius), Math.round(cy - radius), Math.ceil(radius * 2), Math.ceil(radius * 2));
  ctx.restore();
}

/** Stand-in until the sign art is converted: a plain marquee board so the feature works without it. */
function drawFallbackSign(ctx: CanvasRenderingContext2D, left: number, top: number, w: number, h: number, live: boolean) {
  const beacon = 6;
  const bodyTop = top + beacon;
  const bodyH = h - beacon;
  ctx.fillStyle = live ? "#ff3b30" : "#4a1c24";
  ctx.fillRect(left + Math.round(w / 2) - 3, top, 6, beacon + 1);
  ctx.fillStyle = "#16302e";
  ctx.fillRect(left, bodyTop, w, bodyH);
  ctx.fillStyle = "#e9efe8";
  ctx.fillRect(left + 1, bodyTop + 1, w - 2, bodyH - 2);
  ctx.fillStyle = "#0b1414";
  ctx.fillRect(left + 3, bodyTop + 3, w - 6, bodyH - 6);
  ctx.fillStyle = live ? "#ff5a4a" : "#6a2a34";
  ctx.font = `bold 8px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ON AIR", left + w / 2, bodyTop + bodyH / 2 + 1);
}

export function drawOnAirSign(
  ctx: CanvasRenderingContext2D,
  assets: Pick<WorldAssets, "get">,
  sign: OnAirSign,
  live: boolean,
  camera: Camera,
  time: number,
  reducedMotion: boolean,
) {
  const image = assets.get(live ? ON_AIR_KEYS.on : ON_AIR_KEYS.off);
  const w = image?.width ?? ON_AIR_FALLBACK_SIZE.w;
  const h = image?.height ?? ON_AIR_FALLBACK_SIZE.h;
  const left = Math.round(sign.x - w / 2 - camera.x);
  const top = Math.round(sign.y - h - camera.y);
  if (live) drawGlow(ctx, left + w / 2, top + h * 0.6, w, time, reducedMotion);
  if (image) ctx.drawImage(image, left, top);
  else drawFallbackSign(ctx, left, top, w, h, live);
}
