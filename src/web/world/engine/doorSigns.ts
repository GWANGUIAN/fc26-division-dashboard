/**
 * Vertical layout of the two signs over a member's front door (docs/world/15-onair-sign.md), measured up from
 * the bottom edge of the doorstep row: the ON AIR sign sits first, the "○○의 집" name plate stacks above it.
 * Both are centred on the entrance mat (`entranceX`). Constants only, so render.ts and onAirSign.ts can share them.
 */

/** Size of the converted ON AIR art (scripts/world-art-manifest.json, "onair"); also what is drawn while the art is missing. */
export const ON_AIR_SIZE = { w: 58, h: 33 } as const;
/** The ON AIR sign's bottom edge. Fixed: the name plate moved up around it, not the other way round. */
export const ON_AIR_RISE = 72;
/** Air between the ON AIR sign's top edge and the name plate above it. */
export const HOME_SIGN_GAP = 4;
export const HOME_SIGN_HEIGHT = 14;
/** The name plate's top edge, above the ON AIR sign. */
export const HOME_SIGN_RISE = ON_AIR_RISE + ON_AIR_SIZE.h + HOME_SIGN_GAP + HOME_SIGN_HEIGHT;
