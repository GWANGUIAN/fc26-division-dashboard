// Clip → atlas cell table (docs/pitch/04 §3·§4·§6). Mirrors scripts/pitch-art-manifest.json ("field"/"keeper" rows);
// __tests__/animations.test.ts fails when the two drift apart. Atlas: 960×960 = 10 cols × 10 rows of 96×96.

export type Direction = "down" | "side" | "up";

export type ClipName =
  | "idle"
  | "run"
  | "shoot"
  | "skill_stepover"
  | "skill_roulette"
  | "skill_rainbow"
  | "skill_elastico"
  | "celebrate_a"
  | "celebrate_b"
  | "disappointed";

export const CELL_SIZE = 96;
/** Feet baseline inside a cell (bottom edge of the sprite). */
export const FOOT_Y = 92;
export const ATLAS_SIZE = 960;

export interface ClipDef {
  /** Atlas row / first column, in cells of `cellW`×96. */
  row: number;
  col: number;
  frames: number;
  fps: number;
  loop: boolean;
  cellW: number;
}

const clip = (row: number, col: number, frames: number, fps: number, loop: boolean, cellW = CELL_SIZE): ClipDef => ({ row, col, frames, fps, loop, cellW });

export const CLIPS: Readonly<Record<ClipName, Partial<Record<Direction, ClipDef>>>> = {
  idle: { down: clip(0, 0, 2, 2, true), side: clip(0, 2, 2, 2, true), up: clip(0, 4, 2, 2, true) },
  run: { down: clip(1, 0, 6, 12, true), side: clip(2, 0, 6, 12, true), up: clip(3, 0, 6, 12, true) },
  shoot: { down: clip(1, 6, 4, 16, false), side: clip(2, 6, 4, 16, false), up: clip(3, 6, 4, 16, false) },
  skill_stepover: { side: clip(4, 0, 4, 12, false), up: clip(6, 0, 4, 12, false) },
  skill_roulette: { side: clip(4, 4, 4, 12, false), up: clip(6, 4, 4, 12, false) },
  skill_rainbow: { side: clip(5, 0, 4, 10, false), up: clip(7, 0, 4, 10, false) },
  skill_elastico: { side: clip(5, 4, 4, 12, false), up: clip(7, 4, 4, 12, false) },
  celebrate_a: { down: clip(8, 0, 4, 8, true) },
  celebrate_b: { down: clip(8, 4, 4, 8, true) },
  disappointed: { down: clip(9, 0, 4, 6, true) },
};

export interface FrameRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

/** Direction a clip really has: `down`-only clips ignore the request, skills have no `down` (side is mirrored/used). */
export function resolveDirection(name: ClipName, dir: Direction): Direction {
  const dirs = CLIPS[name];
  if (dirs[dir]) return dir;
  return dirs.side ? "side" : (Object.keys(dirs)[0] as Direction);
}

export function clipDef(name: ClipName, dir: Direction): ClipDef {
  return CLIPS[name][resolveDirection(name, dir)] as ClipDef;
}

/** Source rectangle of a frame in the atlas (frame index is clamped/looped by the caller or `frameAt`). */
export function frameRect(def: ClipDef, frame: number): FrameRect {
  const f = Math.max(0, Math.min(def.frames - 1, Math.floor(frame)));
  return { sx: (def.col + f) * def.cellW, sy: def.row * CELL_SIZE, sw: def.cellW, sh: CELL_SIZE };
}

/** Frame index after `seconds` of playback (loops or holds the last frame). */
export function frameAt(def: ClipDef, seconds: number): number {
  const n = Math.floor(Math.max(0, seconds) * def.fps);
  return def.loop ? n % def.frames : Math.min(def.frames - 1, n);
}

export function totalFrames(): number {
  let sum = 0;
  for (const dirs of Object.values(CLIPS)) for (const def of Object.values(dirs)) sum += def.frames;
  return sum;
}

// ---- AI goalkeeper `keeper-ai` (04 §6): atlas 960×768, dive cells are 192×96 ----

export type KeeperClipName =
  | "ready"
  | "shuffle_left"
  | "shuffle_right"
  | "catch"
  | "punch"
  | "foot_deflect"
  | "beaten"
  | "save_celebrate"
  | "rage_slam"
  | "dive_low_left"
  | "dive_low_right"
  | "dive_high_left"
  | "dive_high_right";

export const KEEPER_ATLAS = { w: 960, h: 768 } as const;

/** Shuffle rows are named by screen direction: `shuffle_left` moves toward the left of the screen. */
export const KEEPER_CLIPS: Readonly<Record<KeeperClipName, ClipDef>> = {
  ready: clip(0, 0, 2, 3, true),
  shuffle_left: clip(0, 2, 4, 10, true),
  shuffle_right: clip(0, 6, 4, 10, true),
  catch: clip(1, 0, 4, 12, false),
  punch: clip(1, 4, 4, 12, false),
  foot_deflect: clip(2, 0, 4, 12, false),
  beaten: clip(2, 4, 4, 6, false),
  save_celebrate: clip(3, 0, 4, 8, true),
  rage_slam: clip(3, 4, 4, 8, false),
  dive_low_left: clip(4, 0, 5, 12, false, 192),
  dive_low_right: clip(5, 0, 5, 12, false, 192),
  dive_high_left: clip(6, 0, 5, 12, false, 192),
  dive_high_right: clip(7, 0, 5, 12, false, 192),
};
