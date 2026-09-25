// The pet that follows the character (docs/pitch/13 §4-4). Pure state + draw: it never touches the ball, the
// keeper or any collider. The pet trails the recorded foot positions of its owner by `TRAIL_SECONDS`.

import type { Direction } from "../data/animations";

/** Pet atlas `pets/pet-<id>`: 4 columns (idle A, idle B, move A, move B) × 3 rows (front, side, back), 48px cells. */
export const PET_CELL = 48;
/** Ground line inside a cell (scripts/pitch-art-manifest.json "pets".baseY). */
export const PET_BASE_Y = 45;
export const PET_DRAW_SCALE = 0.8;

const TRAIL_SECONDS = 0.25;
const HOME_OFFSET_X = 26;
const HOME_OFFSET_Y = 3;
const FOLLOW_RATE = 10;
const MOVE_SPEED = 18;
const IDLE_FPS = 2;
const MOVE_FPS = 7;

interface TrailPoint {
  t: number;
  x: number;
  y: number;
}

export interface PetState {
  x: number;
  y: number;
  dir: Direction;
  mirror: boolean;
  moving: boolean;
  clock: number;
  /** Which side of the owner the pet rests on: -1 left, 1 right (flips with the owner's horizontal facing). */
  side: 1 | -1;
  trail: TrailPoint[];
}

export function createPet(x: number, y: number): PetState {
  return { x: x - HOME_OFFSET_X, y: y + HOME_OFFSET_Y, dir: "down", mirror: false, moving: false, clock: 0, side: -1, trail: [{ t: 0, x, y }] };
}

/** Puts the pet next to its owner without a run-up (scene start, character swap). */
export function resetPet(pet: PetState, x: number, y: number) {
  Object.assign(pet, createPet(x, y));
}

/** `owner` = the character's foot position this frame; `facing` = its horizontal facing (-1 left / 1 right / 0 keep). */
export function updatePet(pet: PetState, owner: { x: number; y: number }, dt: number, facing = 0) {
  pet.clock += dt;
  const last = pet.trail[pet.trail.length - 1];
  if (Math.hypot(owner.x - last.x, owner.y - last.y) > 0.5) pet.trail.push({ t: pet.clock, x: owner.x, y: owner.y });
  while (pet.trail.length > 2 && pet.trail[1].t < pet.clock - TRAIL_SECONDS) pet.trail.shift();
  if (facing !== 0) pet.side = facing > 0 ? -1 : 1;
  const lagged = pet.trail[0];
  const goalX = lagged.x + pet.side * HOME_OFFSET_X;
  const goalY = lagged.y + HOME_OFFSET_Y;
  const k = Math.min(1, dt * FOLLOW_RATE);
  const vx = ((goalX - pet.x) * k) / Math.max(dt, 1e-6);
  const vy = ((goalY - pet.y) * k) / Math.max(dt, 1e-6);
  pet.x += (goalX - pet.x) * k;
  pet.y += (goalY - pet.y) * k;
  const speed = Math.hypot(vx, vy);
  pet.moving = speed > MOVE_SPEED;
  if (pet.moving) {
    if (Math.abs(vx) > Math.abs(vy)) {
      pet.dir = "side";
      pet.mirror = vx < 0;
    } else pet.dir = vy > 0 ? "down" : "up";
  }
}

/** Source cell of the pet's current frame in its atlas. */
export function petCell(pet: PetState): { sx: number; sy: number } {
  const row = pet.dir === "down" ? 0 : pet.dir === "side" ? 1 : 2;
  const frame = Math.floor(pet.clock * (pet.moving ? MOVE_FPS : IDLE_FPS)) % 2;
  return { sx: (pet.moving ? 2 + frame : frame) * PET_CELL, sy: row * PET_CELL };
}

/** Draws the pet with its feet on (x, y); `scale` is the owner's depth scale. Missing art draws nothing. */
export function drawPet(
  g: CanvasRenderingContext2D,
  atlas: CanvasImageSource | undefined,
  pet: PetState,
  scale: number,
  x = pet.x,
  y = pet.y,
) {
  if (!atlas) return;
  const { sx, sy } = petCell(pet);
  const k = scale * PET_DRAW_SCALE;
  const size = Math.round(PET_CELL * k);
  const top = Math.round(y - PET_BASE_Y * k);
  if (pet.dir === "side" && pet.mirror) {
    g.save();
    g.translate(Math.round(x), 0);
    g.scale(-1, 1);
    g.drawImage(atlas, sx, sy, PET_CELL, PET_CELL, -Math.round(size / 2), top, size, size);
    g.restore();
  } else {
    g.drawImage(atlas, sx, sy, PET_CELL, PET_CELL, Math.round(x - size / 2), top, size, size);
  }
}
