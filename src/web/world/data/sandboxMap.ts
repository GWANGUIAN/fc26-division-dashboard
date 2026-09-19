import { buildScene, type PropInstance } from "../engine/scene";

// S1 test ground: an empty 40×30-tile meadow (1280×960 — bigger than the 640×360 view so the camera
// has to scroll and clamp) with a few props to bump into. Sizes/colliders come from docs/world/05 §2.
// S2 replaces this with the real 80×60 map loaded from data/maps/overworld.json.

const TILE = 32;
const WIDTH = 40 * TILE;
const HEIGHT = 30 * TILE;
/** Two-tile forest band around the edge, like the real map (docs/world/03 §1). */
const BORDER = 2 * TILE;

const fence = (x: number): PropInstance => ({ key: "props/fence-wood-h", x, y: 440, w: 64, h: 32, collider: { w: 64, h: 10 } });
const oak = (x: number, y: number): PropInstance => ({ key: "props/tree-oak", x, y, w: 96, h: 128, collider: { w: 16, h: 12 } });

export const SANDBOX_SCENE = buildScene({
  id: "overworld",
  size: { w: WIDTH, h: HEIGHT },
  walkable: { x: BORDER, y: BORDER, w: WIDTH - BORDER * 2, h: HEIGHT - BORDER * 2 },
  props: [
    oak(320, 360),
    oak(960, 330),
    oak(520, 760),
    { key: "props/rock-large", x: 780, y: 560, w: 64, h: 48, collider: { w: 56, h: 20 } },
    { key: "props/rock-large", x: 300, y: 620, w: 64, h: 48, collider: { w: 56, h: 20 } },
    { key: "props/boulder-mossy", x: 940, y: 780, w: 80, h: 64, collider: { w: 68, h: 24 } },
    { key: "props/bench-h", x: 640, y: 300, w: 48, h: 32, collider: { w: 44, h: 12 } },
    { key: "props/bench-h", x: 690, y: 300, w: 48, h: 32, collider: { w: 44, h: 12 } },
    { key: "props/log", x: 1060, y: 560, w: 48, h: 24, collider: { w: 44, h: 12 } },
    fence(200),
    fence(264),
    fence(328),
    fence(392),
  ],
  spawn: { x: WIDTH / 2, y: HEIGHT / 2 },
  fixedCamera: false,
});

export const SANDBOX_BORDER = BORDER;
