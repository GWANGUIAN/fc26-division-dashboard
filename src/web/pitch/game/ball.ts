// Ball state machine (docs/pitch/02 §3·§4): carried / loose / dead for dribbling, `shot` for a kicked ball
// (scripted flight to the goal plane, then free physics with a height `z` for rebounds).
// Pure and DOM-free. The carried ball is a critically damped spring toward a point in front of the feet,
// solved in the player's moving frame (damping is relative to the player's velocity) so a steady run keeps the
// ball exactly at its touch distance while a sudden turn or stop lets the ball's inertia show — that is the
// visible "touch", and at sprint stiffness it is what can drag the ball past the loose threshold.

import type { PlayerState } from "./player";
import { flightHeight, type ShotFlight } from "./shot";
import { DRIBBLE, GOAL_SCREEN, goalScreenX, MOVE, PLAY_AREA, SHOT, SPAWN, clamp } from "./tuning";

export type BallMode = "carried" | "loose" | "dead" | "shot";

/** Scripted flight of a kick, in screen ground coordinates (x, y) with the height z in screen px. */
export interface BallFlight {
  sx: number;
  sy: number;
  ex: number;
  ey: number;
  /** Time flown / total time, seconds. */
  t: number;
  time: number;
  /** Height at the goal plane and the shot data behind the arc. */
  endZ: number;
  /** Lob coefficient of the shot tuning (peak = arc × dist × power/100). */
  arc: number;
  shot: Pick<ShotFlight, "h" | "dist" | "power">;
}

/** Gravity, bounce and ground friction of a ball in free flight (after a save, post or miss). */
export const FREE_BALL = { gravity: 900, bounce: 0.5, friction: 3, restZ: 1.5 } as const;

export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mode: BallMode;
  /** Seconds left of the trapping animation after regaining the ball. */
  trap: number;
  /** Seconds left before a dead ball resets. */
  deadTimer: number;
  /** Rolling animation phase in strip frames (signed: negative rolls the other way). */
  spin: number;
  /** Height above the ground in screen px (0 while dribbling). The ground point (x, y) casts the shadow. */
  z: number;
  vz: number;
  /** Scripted flight while `mode === "shot"`; null once the ball flies free. */
  flight: BallFlight | null;
}

export function createBall(x: number = SPAWN.x, y: number = SPAWN.y): BallState {
  return { x, y, vx: 0, vy: 0, mode: "carried", trap: 0, deadTimer: 0, spin: 0, z: 0, vz: 0, flight: null };
}

/** Puts the ball at the spawn, carried (used by R and the initial state, where the player also stands at the spawn). */
export function resetBall(b: BallState) {
  Object.assign(b, createBall());
}

/** Distance from the player's feet to the ball, in raw px. */
export function ballDistance(b: BallState, p: PlayerState) {
  return Math.hypot(b.x - p.x, b.y - p.y);
}

export function isOutside(x: number, y: number) {
  return x < PLAY_AREA.minX || x > PLAY_AREA.maxX || y < PLAY_AREA.minY || y > PLAY_AREA.maxY;
}

/** Rest point of the carried ball for the current facing; kept inside the play area. */
export function touchTarget(p: PlayerState): { x: number; y: number } {
  const d = p.sprinting ? DRIBBLE.sprintTouchDistance : DRIBBLE.touchDistance;
  return {
    x: clamp(p.x + p.fx * d, PLAY_AREA.minX, PLAY_AREA.maxX),
    y: clamp(p.y + p.fy * d * MOVE.yFactor, PLAY_AREA.minY, PLAY_AREA.maxY),
  };
}

/** Advances one fixed step. `p` is the already-stepped player of this frame. */
export function stepBall(b: BallState, p: PlayerState, dt: number) {
  if (b.mode === "carried") {
    stepCarried(b, p, dt);
  } else if (b.mode === "loose") {
    stepLoose(b, p, dt);
  } else if (b.mode === "shot") {
    stepShotBall(b, dt);
  } else {
    b.deadTimer -= dt;
    if (b.deadTimer <= 0) {
      const { x, y } = SPAWN;
      Object.assign(b, { x, y, vx: 0, vy: 0, mode: "loose" as BallMode, trap: 0, deadTimer: 0, z: 0, vz: 0, flight: null });
    }
  }
  advanceSpin(b, dt);
}

function stepCarried(b: BallState, p: PlayerState, dt: number) {
  const k = p.sprinting ? DRIBBLE.sprintFollowK : DRIBBLE.followK;
  const zeta = p.sprinting ? DRIBBLE.sprintFollowDamping : DRIBBLE.followDamping;
  const target = touchTarget(p);
  const ax = k * k * (target.x - b.x) - 2 * zeta * k * (b.vx - p.vx);
  const ay = k * k * (target.y - b.y) - 2 * zeta * k * (b.vy - p.vy);
  b.vx += ax * dt;
  b.vy += ay * dt;
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  if (b.trap > 0) b.trap = Math.max(0, b.trap - dt);

  if (ballDistance(b, p) >= DRIBBLE.looseDistance) {
    b.mode = "loose";
    b.trap = 0;
    return;
  }
  // A carried ball never leaves the pitch by itself: pin it to the play area.
  if (isOutside(b.x, b.y)) {
    b.x = clamp(b.x, PLAY_AREA.minX, PLAY_AREA.maxX);
    b.y = clamp(b.y, PLAY_AREA.minY, PLAY_AREA.maxY);
    b.vx = 0;
    b.vy = 0;
  }
}

function stepLoose(b: BallState, p: PlayerState, dt: number) {
  const damp = Math.exp(-DRIBBLE.looseFriction * dt);
  b.vx *= damp;
  b.vy *= damp;
  if (Math.hypot(b.vx, b.vy) < DRIBBLE.stopSpeed) {
    b.vx = 0;
    b.vy = 0;
  }
  b.x += b.vx * dt;
  b.y += b.vy * dt;

  if (isOutside(b.x, b.y)) {
    b.mode = "dead";
    b.deadTimer = DRIBBLE.deadSeconds;
    b.vx = 0;
    b.vy = 0;
    return;
  }
  if (ballDistance(b, p) <= DRIBBLE.regainDistance) {
    b.mode = "carried";
    b.trap = DRIBBLE.trapSeconds;
  }
}

/** Kicks the ball: ground track from where it is to the goal plane (screen y `GOAL_SCREEN.planeY`), lifted by the shot's z arc. */
export function launchBall(b: BallState, shot: ShotFlight, arc: number = SHOT.arc) {
  b.mode = "shot";
  b.trap = 0;
  b.vx = 0;
  b.vy = 0;
  b.z = 0;
  b.vz = 0;
  b.flight = {
    sx: b.x,
    sy: b.y,
    ex: goalScreenX(480 + shot.tx),
    ey: GOAL_SCREEN.planeY,
    t: 0,
    time: Math.max(shot.time, 1e-3),
    endZ: shot.h * GOAL_SCREEN.zScale,
    arc,
    shot: { h: shot.h, dist: shot.dist, power: shot.power },
  };
}

/** True once a scripted flight reached the goal plane and is waiting for the match to decide what happens next. */
export function ballArrived(b: BallState) {
  return b.mode === "shot" && !!b.flight && b.flight.t >= b.flight.time;
}

/** Ends the scripted flight: the ball leaves the goal plane with this velocity (screen px/s; vz upward) and flies free. */
export function releaseBall(b: BallState, vx: number, vy: number, vz: number) {
  b.flight = null;
  b.vx = vx;
  b.vy = vy;
  b.vz = vz;
}

function stepShotBall(b: BallState, dt: number) {
  const f = b.flight;
  if (f) {
    if (f.t < f.time) {
      f.t = Math.min(f.time, f.t + dt);
      const s = f.t / f.time;
      b.x = f.sx + (f.ex - f.sx) * s;
      b.y = f.sy + (f.ey - f.sy) * s;
      b.z = flightHeight(f.shot, s, f.arc) * GOAL_SCREEN.zScale;
      // flight velocity (ground track + rise) so rebounds can inherit it
      b.vx = (f.ex - f.sx) / f.time;
      b.vy = (f.ey - f.sy) / f.time;
    }
    return;
  }
  // free flight: gravity, bounces, rolling friction
  b.vz -= FREE_BALL.gravity * dt;
  b.z += b.vz * dt;
  if (b.z <= 0) {
    b.z = 0;
    if (Math.abs(b.vz) > 60) b.vz = -b.vz * FREE_BALL.bounce;
    else b.vz = 0;
  }
  if (b.z === 0) {
    const damp = Math.exp(-FREE_BALL.friction * dt);
    b.vx *= damp;
    b.vy *= damp;
  }
  b.x += b.vx * dt;
  b.y += b.vy * dt;
}

function advanceSpin(b: BallState, dt: number) {
  if (b.mode === "dead") return;
  if (b.mode === "shot" && b.flight) {
    b.spin += Math.hypot(b.vx, b.vy) * dt * DRIBBLE.spinFramesPerPx * 0.5;
    return;
  }
  const sign = Math.abs(b.vx) >= Math.abs(b.vy) ? Math.sign(b.vx) : Math.sign(b.vy);
  b.spin += sign * Math.hypot(b.vx, b.vy) * dt * DRIBBLE.spinFramesPerPx;
}

/** Strip frame of the rolling ball (0..frames-1). */
export function ballSpinFrame(b: BallState, frames: number) {
  return ((Math.floor(b.spin) % frames) + frames) % frames;
}
