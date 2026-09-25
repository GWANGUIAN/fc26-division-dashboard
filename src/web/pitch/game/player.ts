// Field player movement (docs/pitch/02 §2): 8-way input, normalised diagonals, acceleration / deceleration,
// vertical speed factor, hard bounds (nothing behind the goal line). Pure and DOM-free so it can be stepped in tests.

import { clipDef, type ClipName, type Direction } from "../data/animations";
import { MOVE, PLAY_AREA, SPAWN, clamp } from "./tuning";

export interface MoveInput {
  /** -1 left, +1 right. */
  dx: number;
  /** -1 up (toward the goal), +1 down. */
  dy: number;
  sprint: boolean;
}

export interface PlayerState {
  /** Feet position. */
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Last non-zero input direction (unit vector, before the y factor); kept while standing still. */
  fx: number;
  fy: number;
  sprinting: boolean;
  /** Seconds of the current idle stretch / run-cycle phase in frames, for animation. */
  idleTime: number;
  runPhase: number;
}

export interface PlayerPose {
  clip: Extract<ClipName, "idle" | "run">;
  dir: Direction;
  mirror: boolean;
  frame: number;
}

export function createPlayer(x: number = SPAWN.x, y: number = SPAWN.y): PlayerState {
  return { x, y, vx: 0, vy: 0, fx: 0, fy: -1, sprinting: false, idleTime: 0, runPhase: 0 };
}

export function resetPlayer(p: PlayerState) {
  Object.assign(p, createPlayer());
}

export function playerSpeed(p: PlayerState) {
  return Math.hypot(p.vx, p.vy);
}

/** Advances one fixed step. */
export function stepPlayer(p: PlayerState, input: MoveInput, dt: number, area: { minX: number; maxX: number; minY: number; maxY: number } = PLAY_AREA) {
  const len = Math.hypot(input.dx, input.dy);
  const moving = len > 0;
  p.sprinting = moving && input.sprint;

  let tx = 0;
  let ty = 0;
  if (moving) {
    const ux = input.dx / len;
    const uy = input.dy / len;
    p.fx = ux;
    p.fy = uy;
    const speed = p.sprinting ? MOVE.sprintSpeed : MOVE.runSpeed;
    tx = ux * speed;
    ty = uy * speed * MOVE.yFactor;
  }

  // Approach the target velocity with a capped acceleration (deceleration when no key is held).
  const dvx = tx - p.vx;
  const dvy = ty - p.vy;
  const dv = Math.hypot(dvx, dvy);
  const maxDv = (moving ? MOVE.accel : MOVE.decel) * dt;
  if (dv <= maxDv || dv === 0) {
    p.vx = tx;
    p.vy = ty;
  } else {
    p.vx += (dvx / dv) * maxDv;
    p.vy += (dvy / dv) * maxDv;
  }

  p.x += p.vx * dt;
  p.y += p.vy * dt;

  // Bounds: clamp the position and drop the velocity component pushing into the wall.
  if (p.x < area.minX || p.x > area.maxX) {
    p.x = clamp(p.x, area.minX, area.maxX);
    p.vx = 0;
  }
  if (p.y < area.minY || p.y > area.maxY) {
    p.y = clamp(p.y, area.minY, area.maxY);
    p.vy = 0;
  }

  const speed = playerSpeed(p);
  if (speed < MOVE.idleSpeed) {
    p.idleTime += dt;
    p.runPhase = 0;
  } else {
    p.idleTime = 0;
    p.runPhase += runFps(speed) * dt;
  }
}

/** Run animation rate: proportional to speed, 6..12 fps (02 §2). */
export function runFps(speed: number) {
  const t = clamp((speed - MOVE.idleSpeed) / (MOVE.sprintSpeed - MOVE.idleSpeed), 0, 1);
  return MOVE.runFpsMin + (MOVE.runFpsMax - MOVE.runFpsMin) * t;
}

/** Vertical component dominates → up / down, otherwise side (left mirrored). Diagonals count as side. */
export function facingDirection(fx: number, fy: number): { dir: Direction; mirror: boolean } {
  if (Math.abs(fy) > Math.abs(fx)) return { dir: fy < 0 ? "up" : "down", mirror: false };
  return { dir: "side", mirror: fx < 0 };
}

const RUN_FRAMES = clipDef("run", "side").frames;
const { frames: IDLE_FRAMES, fps: IDLE_FPS } = clipDef("idle", "side");

export function playerPose(p: PlayerState): PlayerPose {
  const { dir, mirror } = facingDirection(p.fx, p.fy);
  if (playerSpeed(p) < MOVE.idleSpeed) {
    return { clip: "idle", dir, mirror, frame: Math.floor(p.idleTime * IDLE_FPS) % IDLE_FRAMES };
  }
  return { clip: "run", dir, mirror, frame: Math.floor(p.runPhase) % RUN_FRAMES };
}
