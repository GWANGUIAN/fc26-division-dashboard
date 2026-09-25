// Locker-room and gate numbers (docs/pitch/02 §2, 03 §2-1·§4). Pure geometry, no DOM, so the interaction radii and
// the collision resolution can be tested. Coordinates are logical 960×540 px; distances are measured from the feet.

import { clamp } from "./tuning";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Circle {
  x: number;
  y: number;
  r: number;
}

/** Pitch-side gate (tile top-left (16, 400), 128×128). The prompt radius is 70 around its centre; the locker group preloads inside 200. */
export const GATE = { x: 16, y: 316, w: 166, h: 166, centerX: 99, centerY: 399, promptRadius: 70, preloadRadius: 200 } as const;
/** The gate art (128×128) is drawn 1.3× and sits on top of the control-hint row (its bottom is y=482). */
export const GATE_SCALE = 1.3;

/** Where the player appears on the pitch after leaving the locker room: in front of the gate. */
export const GATE_SPAWN = { x: 215, y: 440 } as const;

/** Walkable floor of the locker room and where the player enters (03 §4). */
/** The back row of furniture (2× props) stands on y=240, so the floor starts below it. */
export const LOCKER_AREA = { minX: 80, maxX: 880, minY: 250, maxY: 468 } as const;
export const LOCKER_SPAWN = { x: 480, y: 450 } as const;

/** Sprite anchors (bottom centre; the analyzer's top-left is (200, 266) for its 96×128 sprite — 05 §7). */
export const ANALYZER = { baseX: 712, baseY: 394, interactRadius: 64 } as const;
/** The player and the exit door are drawn larger in the locker room. */
export const LOCKER_PLAYER_SCALE = 1.5;
/** Every other prop (not the analyzer) is drawn 2×. */
export const PROP_SCALE = 2;
/**
 * The player's cabinet (docs/pitch/13 §5-1): the closed locker unit of the back row (sprite base (677, 238)). The floor starts
 * below the back row, so the interaction circle sits on the first walkable row in front of it.
 */
export const CABINET = { baseX: 677, baseY: 258, interactRadius: 56 } as const;
export const EXIT_DOOR = { baseX: 480, baseY: 478, interactRadius: 60 } as const;

export const ANALYZER_ZONE: Circle = { x: ANALYZER.baseX, y: ANALYZER.baseY, r: ANALYZER.interactRadius };
export const EXIT_ZONE: Circle = { x: EXIT_DOOR.baseX, y: EXIT_DOOR.baseY, r: EXIT_DOOR.interactRadius };
export const CABINET_ZONE: Circle = { x: CABINET.baseX, y: CABINET.baseY, r: CABINET.interactRadius };
export const GATE_ZONE: Circle = { x: GATE.centerX, y: GATE.centerY, r: GATE.promptRadius };

/** Inside the circle (border included)? */
export function withinCircle(x: number, y: number, zone: Circle): boolean {
  return Math.hypot(x - zone.x, y - zone.y) <= zone.r;
}

export function gateDistance(x: number, y: number): number {
  return Math.hypot(x - GATE.centerX, y - GATE.centerY);
}

export const nearGate = (x: number, y: number) => gateDistance(x, y) <= GATE.promptRadius;
/** Close enough to start fetching the locker-room assets. */
export const nearGatePreload = (x: number, y: number) => gateDistance(x, y) < GATE.preloadRadius;
export const nearAnalyzer = (x: number, y: number) => withinCircle(x, y, ANALYZER_ZONE);
export const nearCabinet = (x: number, y: number) => withinCircle(x, y, CABINET_ZONE);
export const nearExit = (x: number, y: number) => withinCircle(x, y, EXIT_ZONE);

/**
 * Solid furniture, as boxes on the floor (the part a foot can bump into). The two outer blocks cover the side walls'
 * lockers and diagonal benches that are painted into `env/locker-bg`; the rest match the prop sprites `LockerScene` draws.
 */
export const LOCKER_COLLIDERS: readonly Box[] = [
  { x: 0, y: 0, w: 150, h: 300 },
  { x: 835, y: 0, w: 125, h: 365 },
  // stat analyzer (base 248,394): only its base is solid, the player can stand behind it
  { x: 672, y: 368, w: 80, h: 26 },
  // kit bag; the back-wall furniture is behind the walkable floor
  { x: 735, y: 402, w: 80, h: 18 },
];

/** Half width / depth of the feet against furniture. */
export const FOOT_PAD = { x: 10, y: 4 } as const;

export interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function clampToArea(b: Body, area: { minX: number; maxX: number; minY: number; maxY: number } = LOCKER_AREA) {
  const x = clamp(b.x, area.minX, area.maxX);
  const y = clamp(b.y, area.minY, area.maxY);
  if (x !== b.x) b.vx = 0;
  if (y !== b.y) b.vy = 0;
  b.x = x;
  b.y = y;
}

/** True when the feet stand inside the (padded) box. */
export function insideBox(x: number, y: number, box: Box, pad: { x: number; y: number } = FOOT_PAD): boolean {
  return x > box.x - pad.x && x < box.x + box.w + pad.x && y > box.y - pad.y && y < box.y + box.h + pad.y;
}

/** Pushes the body out of every box along the shortest way and drops the velocity that pointed into it. */
export function resolveBoxes(b: Body, boxes: readonly Box[] = LOCKER_COLLIDERS, pad: { x: number; y: number } = FOOT_PAD) {
  clampToArea(b);
  for (let pass = 0; pass < 2; pass++) {
    for (const box of boxes) {
      if (!insideBox(b.x, b.y, box, pad)) continue;
      const left = b.x - (box.x - pad.x);
      const right = box.x + box.w + pad.x - b.x;
      const top = b.y - (box.y - pad.y);
      const bottom = box.y + box.h + pad.y - b.y;
      const min = Math.min(left, right, top, bottom);
      if (min === left) {
        b.x = box.x - pad.x;
        if (b.vx > 0) b.vx = 0;
      } else if (min === right) {
        b.x = box.x + box.w + pad.x;
        if (b.vx < 0) b.vx = 0;
      } else if (min === top) {
        b.y = box.y - pad.y;
        if (b.vy > 0) b.vy = 0;
      } else {
        b.y = box.y + box.h + pad.y;
        if (b.vy < 0) b.vy = 0;
      }
    }
  }
  clampToArea(b);
}
