import { PROP_DEFS } from "../data/propDefs";
import type { MapProp, TileBox } from "../types";

/**
 * Where a building's entrance is along x. Shared by everything that hangs on or reacts to the door: the ON AIR sign and
 * name plate (`onAirSign.ts`) and the door trigger the player walks into (`mapScene.ts`). Kept free of the renderer and
 * the scene builder so both can import it.
 */

const TILE = 32;
/** The prop lying at a building's entrance: an entrance mat placed by hand, by eye, on the middle of the door art. */
const ENTRANCE_MAT = "mat-door";
/** How far below the doorstep row and how far aside of the door tiles a mat may lie and still be that building's. */
const MAT_REACH = 64;

/** The entrance mat of a building, or null when the map gives it none. */
export function findEntranceMat(door: TileBox, props: readonly MapProp[]): MapProp | null {
  const tileMiddle = (door[0] + door[2] / 2) * TILE;
  const doorstep = (door[1] + 1) * TILE;
  let nearest: MapProp | null = null;
  for (const prop of props) {
    if (prop.prop !== ENTRANCE_MAT || prop.y < doorstep || prop.y > doorstep + MAT_REACH || Math.abs(prop.x - tileMiddle) > MAT_REACH) continue;
    if (!nearest || Math.abs(prop.x - tileMiddle) < Math.abs(nearest.x - tileMiddle)) nearest = prop;
  }
  return nearest;
}

/**
 * The x of a building's entrance: the middle of its entrance mat. The mat is the value the map's author aligned to
 * the visible door by eye, so everything follows it; the door tiles' middle is only the fallback (it is a
 * few px off for most buildings, up to 21 px). Falls back too when the map gives the building no mat.
 */
export function entranceX(door: TileBox, props: readonly MapProp[]): number {
  return findEntranceMat(door, props)?.x ?? (door[0] + door[2] / 2) * TILE;
}

/** Width of the visible art of the entrance mat: how far the entrance reaches along x, since the mat is drawn as wide as the door. */
export function entranceMatWidth(mat: MapProp): number {
  return PROP_DEFS[mat.prop].content[0];
}
