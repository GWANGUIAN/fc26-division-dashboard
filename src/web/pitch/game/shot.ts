// Three-step shot (docs/pitch/02 §4): Space starts the aim (an arrow sweeps left and right), Space locks the aim and
// starts the power gauge, Space kicks. Pure and DOM-free: the state machine, the impact formulas and the goal
// classification (post / bar / wide / over) live here; the keeper's answer is game/keeper.ts.

import { gaussian, type Rng } from "./rng";
import { GOAL, GOAL_MOUTH, SHOT, clamp, type ShotTuning } from "./tuning";

export type ShotPhase = "idle" | "aim" | "power" | "released";

export interface ShotState {
  phase: ShotPhase;
  /** Seconds spent in the current stage (aim or power). */
  elapsed: number;
  /** Aim sweep, -1 (left) … +1 (right), through 0 at the start; frozen once the aim is locked. */
  aim: number;
  /** Power gauge 0…100; frozen once kicked. */
  power: number;
}

export type ShotPress = "start" | "lock-aim" | "release";

export function createShot(): ShotState {
  return { phase: "idle", elapsed: 0, aim: 0, power: 0 };
}

export function resetShot(s: ShotState) {
  s.phase = "idle";
  s.elapsed = 0;
  s.aim = 0;
  s.power = 0;
}

/** Triangle wave in [-1, 1] with the given period: 0 at t=0 and heading toward +1 (right). */
export function aimWave(t: number, period: number) {
  const u = (((t / period + 0.25) % 1) + 1) % 1;
  return u < 0.5 ? 4 * u - 1 : 3 - 4 * u;
}

/** Triangle wave 0 → 100 → 0 with the given period, 0 at t=0. */
export function powerWave(t: number, period: number) {
  const u = (((t / period) % 1) + 1) % 1;
  return 100 * (u < 0.5 ? 2 * u : 2 - 2 * u);
}

/** Space pressed. Returns which step happened (null when nothing to do, i.e. already kicked). */
export function pressShot(s: ShotState): ShotPress | null {
  if (s.phase === "idle") {
    s.phase = "aim";
    s.elapsed = 0;
    s.aim = 0;
    s.power = 0;
    return "start";
  }
  if (s.phase === "aim") {
    s.phase = "power";
    s.elapsed = 0;
    return "lock-aim";
  }
  if (s.phase === "power") {
    s.phase = "released";
    return "release";
  }
  return null;
}

/** Esc, or losing the ball: back to idle from the aim / power stage (a kicked shot cannot be cancelled). */
export function cancelShot(s: ShotState) {
  if (s.phase === "aim" || s.phase === "power") resetShot(s);
}

/** Advances the aim / power sweep; returns "timeout" when the stage ran out (state is reset to idle). */
export function stepShot(s: ShotState, dt: number, t: ShotTuning = SHOT): "timeout" | null {
  if (s.phase !== "aim" && s.phase !== "power") return null;
  s.elapsed += dt;
  if (s.elapsed >= t.timeoutSeconds) {
    resetShot(s);
    return "timeout";
  }
  if (s.phase === "aim") s.aim = aimWave(s.elapsed, t.aimSeconds);
  else s.power = powerWave(s.elapsed, t.powerSeconds);
  return null;
}

export function isSweet(power: number, t: ShotTuning = SHOT) {
  return power >= t.sweetMin && power <= t.sweetMax;
}

export interface AimRay {
  /** x where the ray meets the goal line, relative to the goal centre (before jitter). */
  tx: number;
  /** Ray angle from straight up (toward the goal line), degrees; positive = to the right. */
  angleDeg: number;
}

/**
 * Aim ray for a sweep value. The angle sweeps linearly between the rays through the left / right end of the aim range
 * (the posts plus `overshoot × W` on each side), so the arrow rotates evenly. From the spawn the sweep centre is
 * exactly the goal centre.
 */
export function aimRay(ballX: number, ballY: number, aim: number, t: ShotTuning = SHOT): AimRay {
  const reach = GOAL_MOUTH.width / 2 + GOAL_MOUTH.width * t.overshoot;
  const rise = Math.max(1, ballY - GOAL.lineY);
  const left = Math.atan2(GOAL.centerX - reach - ballX, rise);
  const right = Math.atan2(GOAL.centerX + reach - ballX, rise);
  const angle = left + (right - left) * ((clamp(aim, -1, 1) + 1) / 2);
  return { tx: ballX + Math.tan(angle) * rise - GOAL.centerX, angleDeg: (angle * 180) / Math.PI };
}

/** Inverse of `aimRay`: the sweep value whose ray meets the goal line at `tx` (used to place the posts on the aim bar). */
export function aimForTx(ballX: number, ballY: number, tx: number, t: ShotTuning = SHOT): number {
  const reach = GOAL_MOUTH.width / 2 + GOAL_MOUTH.width * t.overshoot;
  const rise = Math.max(1, ballY - GOAL.lineY);
  const left = Math.atan2(GOAL.centerX - reach - ballX, rise);
  const right = Math.atan2(GOAL.centerX + reach - ballX, rise);
  const angle = Math.atan2(GOAL.centerX + tx - ballX, rise);
  return ((angle - left) / (right - left)) * 2 - 1;
}

/** Target height (z px) for a power value; above the sweet spot the ball starts to sail over the bar. */
export function shotHeight(p: number, t: ShotTuning = SHOT) {
  const base = GOAL_MOUTH.height * (t.hBase + t.hRange * Math.pow(clamp(p, 0, 100) / 100, t.hExp));
  return p > t.overPower ? base + (p - t.overPower) * t.overSlope : base;
}

export function shotSpeed(p: number, t: ShotTuning = SHOT) {
  return t.speedMin + (t.speedMax - t.speedMin) * (clamp(p, 0, 100) / 100);
}

export function shotJitterSigma(p: number, dist: number, angleDeg: number, t: ShotTuning = SHOT) {
  const sigma =
    t.jitterBase *
    GOAL_MOUTH.width *
    (1 + Math.abs(p - t.jitterPower) / t.jitterSpan) *
    (0.8 + dist / t.jitterDist) *
    (1 + Math.abs(angleDeg) / t.jitterAngle);
  return isSweet(p, t) ? sigma * t.sweetJitter : sigma;
}

export type ShotKind = "onTarget" | "post" | "bar" | "wide" | "over";

/** Where a ball crossing the goal plane at (tx, h) ends up (02 §4). Post wins over bar; anything above the bar is OVER. */
export function classifyShot(tx: number, h: number, t: ShotTuning = SHOT): ShotKind {
  const half = GOAL_MOUTH.width / 2;
  const absTx = Math.abs(tx);
  const top = GOAL_MOUTH.height;
  if (h > top + t.barTolerance) return absTx > half + t.postTolerance ? "wide" : "over";
  if (Math.abs(absTx - half) <= t.postTolerance) return "post";
  if (absTx > half) return "wide";
  return Math.abs(h - top) <= t.barTolerance ? "bar" : "onTarget";
}

export interface ShotFlight {
  startX: number;
  startY: number;
  /** Power at the kick and whether it fell in the sweet spot. */
  power: number;
  sweet: boolean;
  /** Aim point before jitter, final x offset from the goal centre, height (z px) at the goal plane. */
  aimTx: number;
  tx: number;
  h: number;
  angleDeg: number;
  dist: number;
  speed: number;
  /** Flight time to the goal plane, seconds. */
  time: number;
  sigma: number;
  kind: ShotKind;
}

export interface ShotInput {
  ballX: number;
  ballY: number;
  /** Locked aim sweep value (-1…1) and power (0…100). */
  aim: number;
  power: number;
}

/** Impact of a kick (02 §4 table). `rng` supplies the jitter. */
export function computeShot(input: ShotInput, rng: Rng, t: ShotTuning = SHOT): ShotFlight {
  const p = clamp(input.power, 0, 100);
  const { tx: aimTx, angleDeg } = aimRay(input.ballX, input.ballY, input.aim, t);
  const dist = Math.hypot(GOAL.centerX + aimTx - input.ballX, GOAL.lineY - input.ballY);
  const sigma = shotJitterSigma(p, dist, angleDeg, t);
  const tx = aimTx + gaussian(rng) * sigma;
  const h = shotHeight(p, t);
  const flightDist = Math.hypot(GOAL.centerX + tx - input.ballX, GOAL.lineY - input.ballY);
  const speed = shotSpeed(p, t);
  return {
    startX: input.ballX,
    startY: input.ballY,
    power: p,
    sweet: isSweet(p, t),
    aimTx,
    tx,
    h,
    angleDeg,
    dist: flightDist,
    speed,
    time: flightDist / speed,
    sigma,
    kind: classifyShot(tx, h, t),
  };
}

/** Height above the ground at flight progress s (0…1): rises linearly to `h`, plus a lob that grows with power (02 §4). */
export function flightHeight(f: Pick<ShotFlight, "h" | "dist" | "power">, s: number, arc: number = SHOT.arc) {
  const k = clamp(s, 0, 1);
  return f.h * k + arc * f.dist * (f.power / 100) * 4 * k * (1 - k);
}
