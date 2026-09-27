import { STAGES, STAGE_COUNT, type CleatDropStage } from "./cleatDropStages";

export { STAGE_COUNT };

export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 540;

export const HOOK_X = 170;
export const HOOK_Y = 90;
export const PENDULUM_LENGTH = 150;

export const LEG_PIVOT_X = 110;
export const LEG_PIVOT_Y = 340;
export const LEG_LENGTH = 140;

export const GROUND_Y = 480;
export const BOOT_RADIUS = 14;
export const TARGET_ANCHOR_X = 760;

const GRAVITY = 1200; // px/s^2
const MAGNUS_COEFFICIENT = 35; // px/s^2 per unit of spin
const MAX_DT_SECONDS = 0.032;

const PENDULUM_INITIAL_AMPLITUDE_RAD = 0.9;
const PENDULUM_DAMPING = 0.15; // per second
const PENDULUM_ANGULAR_FREQUENCY = 2.4; // rad/s

const LEG_SWING_DURATION = 0.22; // seconds
const LEG_PEAK_ANGLE = 1.3; // rad, forward/up extent of the swing
/** Theoretical peak of legAngularSpeedAt (reached at progress 0.5), used to normalize kick power. */
const MAX_LEG_ANGULAR_SPEED = (LEG_PEAK_ANGLE * Math.PI) / (2 * LEG_SWING_DURATION);
const CONTACT_RADIUS_PX = 50;

const MAX_CONTACT_OFFSET_PX = 50;
/** <1 means even a small off-center contact already produces most of the max spin. */
const OFFSET_SPIN_EXPONENT = 0.8;
const MAX_SPIN = 6;
const MIN_LAUNCH_SPEED = 260; // px/s
const MAX_LAUNCH_SPEED = 620; // px/s
const LAUNCH_ANGLE_RAD = -1.05; // mostly upward, slightly rightward toward the target

const SETTLE_SPEED_THRESHOLD = 60; // px/s
export const HOLD_DURATION_SECONDS = 3;
const TOE_BOUNCE_RETENTION = 0.92;
const HEEL_BOUNCE_RETENTION = 0.8;
const BOUNCE_SPIN_KICK = 8; // px/s of vx added per unit of spin on each bounce

export type CleatDropPhase = "pendulum" | "falling" | "flight" | "cleared" | "failed";

export interface BootState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  spin: number;
}

export interface LegState {
  swinging: boolean;
  swingStartT: number | null;
  hasContacted: boolean;
}

export interface CleatDropState {
  stageIndex: number;
  phase: CleatDropPhase;
  t: number;
  pendulumAngle: number;
  pendulumAngularVel: number;
  boot: BootState;
  leg: LegState;
  holdTimer: number;
  /** True whenever the boot is at rest on the ground/target plane, regardless of outcome. */
  resting: boolean;
  cleared: boolean[];
  attempts: number;
  attemptsByStage: number[];
  /** Fires true exactly once, the instant the final stage is cleared; never resets. */
  allClearLatched: boolean;
}

export interface CleatDropProgressSnapshot {
  cleared?: boolean[];
  attempts?: number;
  attemptsByStage?: number[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function pendulumAngleAt(t: number): number {
  return PENDULUM_INITIAL_AMPLITUDE_RAD * Math.exp(-PENDULUM_DAMPING * t) * Math.cos(PENDULUM_ANGULAR_FREQUENCY * t);
}

export function pendulumAngularVelAt(t: number): number {
  const decay = PENDULUM_INITIAL_AMPLITUDE_RAD * Math.exp(-PENDULUM_DAMPING * t);
  return decay * (-PENDULUM_DAMPING * Math.cos(PENDULUM_ANGULAR_FREQUENCY * t) - PENDULUM_ANGULAR_FREQUENCY * Math.sin(PENDULUM_ANGULAR_FREQUENCY * t));
}

function bootAtPendulum(angle: number, angularVel: number): BootState {
  return {
    x: HOOK_X + PENDULUM_LENGTH * Math.sin(angle),
    y: HOOK_Y + PENDULUM_LENGTH * Math.cos(angle),
    vx: PENDULUM_LENGTH * Math.cos(angle) * angularVel,
    vy: -PENDULUM_LENGTH * Math.sin(angle) * angularVel,
    spin: 0,
  };
}

/** Ease-in-out sweep from 0 to LEG_PEAK_ANGLE over progress 0..1. */
function legAngleAt(progress: number): number {
  return (LEG_PEAK_ANGLE * (1 - Math.cos(Math.PI * progress))) / 2;
}

function legAngularSpeedAt(progress: number): number {
  return (LEG_PEAK_ANGLE * Math.PI * Math.sin(Math.PI * progress)) / (2 * LEG_SWING_DURATION);
}

function legTipAt(progress: number): { x: number; y: number } {
  const angle = legAngleAt(progress);
  return { x: LEG_PIVOT_X + LEG_LENGTH * Math.sin(angle), y: LEG_PIVOT_Y + LEG_LENGTH * Math.cos(angle) };
}

/**
 * contactOffsetPx is the boot's vertical offset from the leg tip's center at the instant of contact
 * (which part of the swinging foot it struck); legAngularSpeed is the leg's own angular speed at
 * that instant (how hard/fast the swing was moving through contact — peaks mid-swing, weak at
 * either end, so timing the swing well is the skill, not a drag/charge input).
 */
export function computeKickImpulse(contactOffsetPx: number, legAngularSpeed: number): { vx: number; vy: number; spin: number } {
  const normOffset = clamp(contactOffsetPx / MAX_CONTACT_OFFSET_PX, -1, 1);
  const spin = Math.sign(normOffset) * Math.abs(normOffset) ** OFFSET_SPIN_EXPONENT * MAX_SPIN;
  const speedRatio = clamp(legAngularSpeed / MAX_LEG_ANGULAR_SPEED, 0, 1);
  const launchSpeed = MIN_LAUNCH_SPEED + speedRatio * (MAX_LAUNCH_SPEED - MIN_LAUNCH_SPEED);
  return { vx: launchSpeed * Math.cos(LAUNCH_ANGLE_RAD), vy: launchSpeed * Math.sin(LAUNCH_ANGLE_RAD), spin };
}

/** Flips windAccelPxPerSec2's sign every windReversalPeriodSec, if set (stage 30's storm wind). */
export function windAccelAt(stage: CleatDropStage, t: number): number {
  if (!stage.windReversalPeriodSec) return stage.windAccelPxPerSec2;
  const cycle = Math.floor(t / stage.windReversalPeriodSec);
  return cycle % 2 === 0 ? stage.windAccelPxPerSec2 : -stage.windAccelPxPerSec2;
}

export function targetCenterX(stage: CleatDropStage, t: number): number {
  const { motion } = stage;
  if (motion?.swayAxis === "x" && motion.swayAmplitudePx && motion.swayFrequencyHz) {
    return TARGET_ANCHOR_X + motion.swayAmplitudePx * Math.sin(2 * Math.PI * motion.swayFrequencyHz * t);
  }
  return TARGET_ANCHOR_X;
}

/** Curved targets already bake their curvature into catchWidthPx; flat/tilted ones lose width to tilt. */
export function effectiveCatchWidth(stage: CleatDropStage, t: number): number {
  let width = stage.curved ? stage.catchWidthPx : stage.catchWidthPx * Math.cos((stage.tiltDeg * Math.PI) / 180);
  const { motion } = stage;
  if (motion?.widthFlutterAmplitudePx && motion.widthFlutterFrequencyHz) {
    width += motion.widthFlutterAmplitudePx * Math.sin(2 * Math.PI * motion.widthFlutterFrequencyHz * t);
  }
  return Math.max(6, width);
}

function withinTargetZone(x: number, stage: CleatDropStage, t: number): boolean {
  return Math.abs(x - targetCenterX(stage, t)) <= effectiveCatchWidth(stage, t) / 2;
}

export function createGame(stageIndex: number, resume?: CleatDropProgressSnapshot): CleatDropState {
  const angle = pendulumAngleAt(0);
  const angularVel = pendulumAngularVelAt(0);
  return {
    stageIndex,
    phase: "pendulum",
    t: 0,
    pendulumAngle: angle,
    pendulumAngularVel: angularVel,
    boot: bootAtPendulum(angle, angularVel),
    leg: { swinging: false, swingStartT: null, hasContacted: false },
    holdTimer: 0,
    resting: false,
    cleared: resume?.cleared ? [...resume.cleared] : Array(STAGE_COUNT).fill(false),
    attempts: resume?.attempts ?? 0,
    attemptsByStage: resume?.attemptsByStage ? [...resume.attemptsByStage] : Array(STAGE_COUNT).fill(0),
    allClearLatched: false,
  };
}

export function releasePendulum(state: CleatDropState, t: number): CleatDropState {
  if (state.phase !== "pendulum") return state;
  const angle = pendulumAngleAt(t);
  const angularVel = pendulumAngularVelAt(t);
  return { ...state, phase: "falling", t, pendulumAngle: angle, pendulumAngularVel: angularVel, boot: bootAtPendulum(angle, angularVel), resting: false };
}

export function swingLeg(state: CleatDropState, t: number): CleatDropState {
  if (state.phase !== "falling" || state.leg.swinging || state.leg.hasContacted) return state;
  return { ...state, leg: { swinging: true, swingStartT: t, hasContacted: false } };
}

function finalizeAttempt(state: CleatDropState, outcome: "cleared" | "failed"): CleatDropState {
  const attempts = state.attempts + 1;
  const attemptsByStage = state.attemptsByStage.map((count, index) => (index === state.stageIndex ? count + 1 : count));
  if (outcome === "failed") {
    return { ...state, phase: "failed", attempts, attemptsByStage, holdTimer: 0 };
  }
  const cleared = state.cleared.map((value, index) => (index === state.stageIndex ? true : value));
  const allClearLatched = state.allClearLatched || (state.stageIndex === STAGE_COUNT - 1 && cleared.every(Boolean));
  return { ...state, phase: "cleared", attempts, attemptsByStage, cleared, allClearLatched };
}

function stepPendulum(state: CleatDropState, dt: number): CleatDropState {
  const t = state.t + dt;
  return { ...state, t, pendulumAngle: pendulumAngleAt(t), pendulumAngularVel: pendulumAngularVelAt(t) };
}

function stepFalling(state: CleatDropState, dt: number): CleatDropState {
  const t = state.t + dt;
  let { x, y, vx, vy, spin } = state.boot;
  vy += GRAVITY * dt;
  x += vx * dt;
  y += vy * dt;

  let leg = state.leg;
  let boot: BootState = { x, y, vx, vy, spin };
  let phase: CleatDropPhase = "falling";

  if (leg.swinging && !leg.hasContacted && leg.swingStartT !== null) {
    const progress = (t - leg.swingStartT) / LEG_SWING_DURATION;
    if (progress >= 1) {
      leg = { ...leg, swinging: false };
    } else {
      const legTip = legTipAt(progress);
      if (Math.hypot(x - legTip.x, y - legTip.y) <= CONTACT_RADIUS_PX) {
        const impulse = computeKickImpulse(y - legTip.y, legAngularSpeedAt(progress));
        boot = { x, y, vx: impulse.vx, vy: impulse.vy, spin: impulse.spin };
        leg = { swinging: false, swingStartT: leg.swingStartT, hasContacted: true };
        phase = "flight";
      }
    }
  }

  if (phase === "falling" && y >= GROUND_Y - BOOT_RADIUS) {
    boot = { ...boot, y: GROUND_Y - BOOT_RADIUS };
    return finalizeAttempt({ ...state, t, boot, leg, resting: true }, "failed");
  }

  return { ...state, t, boot, leg, phase, resting: false };
}

function stepFlight(state: CleatDropState, dt: number): CleatDropState {
  const t = state.t + dt;
  const stage = STAGES[state.stageIndex];
  let { x, y, vx, vy, spin } = state.boot;
  vy += GRAVITY * dt;
  vx += spin * MAGNUS_COEFFICIENT * dt;
  vx += windAccelAt(stage, state.t) * dt;
  x += vx * dt;
  y += vy * dt;

  let holdTimer = state.holdTimer;
  let resting = false;
  let outcome: "cleared" | "failed" | null = null;

  if (y >= GROUND_Y - BOOT_RADIUS) {
    y = GROUND_Y - BOOT_RADIUS;
    const speed = Math.hypot(vx, vy);
    if (speed <= SETTLE_SPEED_THRESHOLD) {
      vx = 0;
      vy = 0;
      resting = true;
      if (withinTargetZone(x, stage, t)) {
        holdTimer += dt;
        if (holdTimer >= HOLD_DURATION_SECONDS) outcome = "cleared";
      } else {
        outcome = "failed";
      }
    } else {
      const leadingToe = vx >= 0;
      vy = -vy * stage.restitution;
      vx = vx * (leadingToe ? TOE_BOUNCE_RETENTION : HEEL_BOUNCE_RETENTION) + spin * BOUNCE_SPIN_KICK;
      holdTimer = 0;
    }
  } else {
    holdTimer = 0;
  }

  const next: CleatDropState = { ...state, t, boot: { x, y, vx, vy, spin }, holdTimer, resting };
  if (outcome) return finalizeAttempt(next, outcome);
  return { ...next, phase: "flight" };
}

export function stepPhysics(state: CleatDropState, dtSeconds: number): CleatDropState {
  const dt = Math.min(dtSeconds, MAX_DT_SECONDS);
  if (state.phase === "pendulum") return stepPendulum(state, dt);
  if (state.phase === "falling") return stepFalling(state, dt);
  if (state.phase === "flight") return stepFlight(state, dt);
  return state;
}

export function isSettled(state: CleatDropState): boolean {
  return state.resting;
}

export function advanceStage(state: CleatDropState): CleatDropState {
  if (state.phase !== "cleared") return state;
  const nextIndex = Math.min(state.stageIndex + 1, STAGE_COUNT - 1);
  return createGame(nextIndex, { cleared: state.cleared, attempts: state.attempts, attemptsByStage: state.attemptsByStage });
}

export function retryStage(state: CleatDropState): CleatDropState {
  if (state.phase !== "failed") return state;
  return createGame(state.stageIndex, { cleared: state.cleared, attempts: state.attempts, attemptsByStage: state.attemptsByStage });
}
