// AI goalkeeper (docs/pitch/02 §6). State machine `ready → track → dive → resolve → recover`, positioning that
// narrows the angle, and a probabilistic save model: at the kick the keeper draws a noisy prediction of where the
// ball will cross the goal plane, spends its reaction time, and either reaches it or not. The whole answer is decided
// once at the kick (`planSave`) so tests can Monte-Carlo it and the scene just plays the plan back.

import { KEEPER_CLIPS, frameAt, type ClipDef, type KeeperClipName } from "../data/animations";
import { gaussian, type Rng } from "./rng";
import type { ShotFlight } from "./shot";
import { GOAL, GOAL_MOUTH, KEEPER, clamp, type KeeperTuning } from "./tuning";

export type KeeperPhase = "ready" | "track" | "dive" | "resolve" | "recover";
export type SaveKind = "CATCH" | "PUNCH" | "DEFLECT";
/** Style Tier of the shooter (02 §5): 0 = none, 1 = ≥50, 2 = ≥80. */
export type StyleTier = 0 | 1 | 2;

/** What the keeper needs to know about a kick. */
export type KickInfo = Pick<ShotFlight, "tx" | "h" | "power" | "time" | "sweet">;

export interface SavePlan {
  /** Seconds after the kick before the dive starts (reaction + style tier + any hesitation left). */
  reactDelay: number;
  /** Predicted side (-1 left of the screen, +1 right) and whether the keeper goes high. */
  dir: -1 | 1;
  high: boolean;
  startX: number;
  /** Where the keeper ends up (absolute x). */
  endX: number;
  /** Horizontal reach of this dive (incl. body). */
  reach: number;
  /** "stay": the keeper does not have to leave its spot; "dive": it throws itself sideways. */
  mode: "stay" | "dive";
  /** Would the keeper stop this ball? (only meaningful when the shot is on target). DEFLECT counts once it is a rebound. */
  saved: boolean;
  kind: SaveKind | null;
  /** The dive would have reached but the deflection only grazed the ball (a goal). */
  grazed: boolean;
  /** Style Tier fooled the keeper completely. */
  fooled: boolean;
  flightTime: number;
}

/** Keeper's answer to a kick. `keeperX` is its current absolute x; `hesitateLeft` a pending freeze in seconds. */
export function planSave(kick: KickInfo, keeperX: number, tier: StyleTier, rng: Rng, D: KeeperTuning = KEEPER, hesitateLeft = 0): SavePlan {
  const targetX = GOAL.centerX + kick.tx;
  const dx = targetX - keeperX;
  const dxAbs = Math.abs(dx);

  const reactDelay = D.react + D.tierReact[tier] + hesitateLeft;
  const available = Math.max(0, kick.time - reactDelay);
  let reach = Math.min(D.diveSpeed * available, D.maxReach);
  if (kick.sweet) reach *= D.sweetReach;
  reach = reach * Math.max(0.4, 1 + gaussian(rng) * D.reachSpread) + D.bodyReach;

  const sigma = D.predErr * GOAL_MOUTH.width * D.tierPredErr[tier];
  const predictedX = kick.tx + gaussian(rng) * sigma;
  const predictedH = kick.h + gaussian(rng) * 0.2 * GOAL_MOUTH.height;
  const predictedDx = GOAL.centerX + predictedX - keeperX;
  const dir: -1 | 1 = predictedDx < 0 ? -1 : 1;
  const high = predictedH > 0.5 * GOAL_MOUTH.height;

  const sideOk = dx === 0 || Math.sign(dx) === dir || dxAbs <= D.centerZone;
  const heightOk = high ? kick.h >= 0.35 * GOAL_MOUTH.height : kick.h <= 0.55 * GOAL_MOUTH.height;
  const fooled = D.tierFooled[tier] > 0 && rng() < D.tierFooled[tier];
  let saved = !fooled && dxAbs <= reach && sideOk && heightOk;

  let kind: SaveKind | null = null;
  let grazed = false;
  if (saved) {
    if (dxAbs <= reach - 25 && kick.power < 60) kind = "CATCH";
    else if (kick.power < 85) kind = "PUNCH";
    else kind = "DEFLECT";
    if (kind === "DEFLECT" && rng() >= 0.5) {
      saved = false;
      grazed = true;
    }
  }

  // Dive endpoint: a save reaches the ball, a miss stops short of it (or heads the predicted way).
  const wanted = saved || grazed ? dx : dir * Math.max(dxAbs * 0.6, 30);
  const travel = clamp(wanted, -reach, reach);
  const endX = clamp(keeperX + travel, D.minX - 40, D.maxX + 40);
  const mode = Math.abs(endX - keeperX) < 16 ? "stay" : "dive";
  return { reactDelay, dir, high, startX: keeperX, endX, reach, mode, saved, kind, grazed, fooled, flightTime: kick.time };
}

// ---- positioning + state machine ----

export interface KeeperState {
  phase: KeeperPhase;
  x: number;
  vx: number;
  /** Free-running animation clock and the clock of the current phase (seconds). */
  clock: number;
  phaseTime: number;
  /** Seconds since the kick while diving. */
  kickTime: number;
  hesitateLeft: number;
  hesitateRoll: number;
  plan: SavePlan | null;
  /** What happened, set by `resolveKeeper` at the moment the ball arrives. */
  outcome: KeeperOutcome | null;
}

export type KeeperOutcome = "GOAL" | "SAVE" | "POST" | "BAR" | "MISS";

/** Seconds the resolve pose is held before the keeper walks back. */
export const KEEPER_RESOLVE_SECONDS = 1.0;

export function createKeeper(): KeeperState {
  return {
    phase: "ready",
    x: GOAL.centerX,
    vx: 0,
    clock: 0,
    phaseTime: 0,
    kickTime: 0,
    hesitateLeft: 0,
    hesitateRoll: 0,
    plan: null,
    outcome: null,
  };
}

export function resetKeeper(k: KeeperState) {
  Object.assign(k, createKeeper());
}

/** `targetX = 480 + clamp((ball.x − 480) × follow, ±clamp)`: the keeper cuts the angle instead of chasing the ball. */
export function keeperTargetX(ballX: number, D: KeeperTuning = KEEPER) {
  return GOAL.centerX + clamp((ballX - GOAL.centerX) * D.follow, -D.followClamp, D.followClamp);
}

/** Advances one fixed step. `ballX` is where the keeper looks (the ball being carried); ignored while diving. */
export function stepKeeper(k: KeeperState, dt: number, ballX: number, rng: Rng, D: KeeperTuning = KEEPER) {
  k.clock += dt;
  k.phaseTime += dt;
  if (k.hesitateLeft > 0) k.hesitateLeft = Math.max(0, k.hesitateLeft - dt);

  if (k.phase === "dive") {
    stepDive(k, dt);
    return;
  }
  if (k.phase === "resolve") {
    if (k.phaseTime >= KEEPER_RESOLVE_SECONDS) setPhase(k, "recover");
    return;
  }

  // ready / track / recover: cut the angle, with the occasional human hesitation.
  if (k.phase !== "recover") {
    k.hesitateRoll += dt;
    while (k.hesitateRoll >= D.hesitateInterval) {
      k.hesitateRoll -= D.hesitateInterval;
      if (k.hesitateLeft <= 0 && rng() < D.hesitateChance) k.hesitateLeft = D.hesitateSeconds;
    }
  }
  const target = k.phase === "recover" ? GOAL.centerX : keeperTargetX(ballX, D);
  if (k.hesitateLeft > 0) {
    k.vx = approach(k.vx, 0, D.accel * dt);
  } else {
    const desired = clamp((target - k.x) * 6, -D.maxSpeed, D.maxSpeed);
    k.vx = approach(k.vx, desired, D.accel * dt);
  }
  k.x = clamp(k.x + k.vx * dt, D.minX, D.maxX);

  const settled = Math.abs(target - k.x) < 2 && Math.abs(k.vx) < 6;
  const next: KeeperPhase = k.phase === "recover" ? (settled ? "ready" : "recover") : settled ? "ready" : "track";
  if (next !== k.phase) setPhase(k, next);
}

function setPhase(k: KeeperState, phase: KeeperPhase) {
  k.phase = phase;
  k.phaseTime = 0;
}

function approach(v: number, target: number, maxDelta: number) {
  const d = target - v;
  return Math.abs(d) <= maxDelta ? target : v + Math.sign(d) * maxDelta;
}

/** Dive length: from the end of the reaction to the arrival, but never a blink (a late reaction still throws itself). */
function diveDuration(plan: SavePlan) {
  return Math.max(plan.flightTime - plan.reactDelay, 0.25);
}

export function diveProgress(k: KeeperState) {
  const plan = k.plan;
  if (!plan) return 0;
  return clamp((k.kickTime - plan.reactDelay) / diveDuration(plan), 0, 1);
}

function stepDive(k: KeeperState, dt: number) {
  const plan = k.plan;
  if (!plan) {
    setPhase(k, "recover");
    return;
  }
  k.kickTime += dt;
  const p = diveProgress(k);
  const eased = 1 - (1 - p) * (1 - p);
  k.vx = 0;
  k.x = plan.startX + (plan.endX - plan.startX) * eased;
}

/** Called at the kick: the keeper commits to the plan (its reaction delay already includes any pending hesitation). */
export function startDive(k: KeeperState, plan: SavePlan) {
  k.plan = plan;
  k.kickTime = 0;
  k.outcome = null;
  k.vx = 0;
  setPhase(k, "dive");
}

/** True once the ball has reached the goal plane: the scene tells the keeper what came of it. */
export function keeperBallArrived(k: KeeperState) {
  return k.phase === "dive" && !!k.plan && k.kickTime >= k.plan.flightTime;
}

export function resolveKeeper(k: KeeperState, outcome: KeeperOutcome) {
  k.outcome = outcome;
  if (k.plan) k.x = k.plan.endX;
  k.vx = 0;
  setPhase(k, "resolve");
}

export interface KeeperPose {
  clip: KeeperClipName;
  def: ClipDef;
  frame: number;
}

const pose = (clip: KeeperClipName, seconds: number): KeeperPose => {
  const def = KEEPER_CLIPS[clip];
  return { clip, def, frame: frameAt(def, seconds) };
};

const diveClip = (plan: SavePlan): KeeperClipName =>
  `dive_${plan.high ? "high" : "low"}_${plan.endX < plan.startX ? "left" : "right"}` as KeeperClipName;

/** Which keeper clip / frame to draw. */
export function keeperPose(k: KeeperState): KeeperPose {
  const plan = k.plan;
  switch (k.phase) {
    case "dive": {
      if (!plan || plan.mode === "stay" || k.kickTime < plan.reactDelay) return pose("ready", k.clock);
      const def = KEEPER_CLIPS[diveClip(plan)];
      return { clip: diveClip(plan), def, frame: Math.min(def.frames - 1, Math.floor(diveProgress(k) * def.frames)) };
    }
    case "resolve": {
      const outcome = k.outcome;
      const dived = !!plan && plan.mode === "dive";
      const t = k.phaseTime;
      if (dived && t < 0.4 && plan) {
        const def = KEEPER_CLIPS[diveClip(plan)];
        return { clip: diveClip(plan), def, frame: def.frames - 1 };
      }
      if (outcome === "GOAL") return pose("beaten", t);
      if (outcome === "SAVE") {
        if (!dived && plan?.kind && t < 0.5) return pose(plan.kind === "CATCH" ? "catch" : plan.kind === "PUNCH" ? "punch" : "foot_deflect", t);
        return pose("save_celebrate", t);
      }
      return pose("ready", k.clock);
    }
    case "track":
    case "recover":
      if (Math.abs(k.vx) > 15) return pose(k.vx < 0 ? "shuffle_left" : "shuffle_right", k.clock);
      return pose("ready", k.clock);
    default:
      return pose("ready", k.clock);
  }
}
