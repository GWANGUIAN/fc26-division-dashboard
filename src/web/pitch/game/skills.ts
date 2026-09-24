// Skill moves and the style gauge (docs/pitch/02 §5). Pure and DOM-free. A move is a scripted slide of the player
// with an atlas clip; a successful one (the ball is carried) fills the style gauge, a whiff plays the animation
// only. The gauge decides the keeper's Tier at the next kick (PitchScene.styleTier → planSave).

import type { StyleTier } from "./keeper";
import { easeInOutSine, progress } from "../engine/tween";
import { MOVE, SKILLS, SKILL_IDS, STYLE, type SkillId } from "./tuning";

export type { SkillId };

export interface SkillState {
  active: SkillId | null;
  /** The running move is a whiff: animation only, no travel, no style. */
  whiff: boolean;
  elapsed: number;
  /** Unit facing at the start (before the y factor). */
  dirX: number;
  dirY: number;
  /** Clip direction of the running move: skills have side and up frames only (a `down` facing plays side). */
  dir: "side" | "up";
  mirror: boolean;
  /** Seconds until the next move may start (counts down while no move runs). */
  cooldown: number;
  /** 0..100. */
  style: number;
  /** Seconds since the gauge last grew; it drains once this passes `STYLE.decayDelay`. */
  sinceGain: number;
  /** Chain: previous successful move, seconds since it, and the number of chained moves (0..pips). */
  lastId: SkillId | null;
  chainClock: number;
  combo: number;
  /** Eased fraction of the travel already applied. */
  travelled: number;
  /** Displacement of the latest `stepSkills` in screen px (already y-scaled); read by the scene. */
  stepX: number;
  stepY: number;
}

export interface SkillStart {
  id: SkillId;
  whiff: boolean;
  /** Style added (after the chain multiplier), 0 for a whiff. */
  gain: number;
  /** A different move within the chain window (×1.5) / the same move again (×0.5). */
  chained: boolean;
  repeated: boolean;
  tierBefore: StyleTier;
  tierAfter: StyleTier;
}

export function createSkills(): SkillState {
  return {
    active: null,
    whiff: false,
    elapsed: 0,
    dirX: 0,
    dirY: -1,
    dir: "up",
    mirror: false,
    cooldown: 0,
    style: 0,
    sinceGain: 0,
    lastId: null,
    chainClock: 0,
    combo: 0,
    travelled: 0,
    stepX: 0,
    stepY: 0,
  };
}

export function resetSkills(s: SkillState) {
  Object.assign(s, createSkills());
}

/** The keeper Tier the gauge stands for (02 §5). */
export function tierOf(style: number): StyleTier {
  return style >= STYLE.tier2 ? 2 : style >= STYLE.tier1 ? 1 : 0;
}

export function styleTierOf(s: SkillState): StyleTier {
  return tierOf(s.style);
}

/** Key `event.code` → move, or null. */
export function skillForKey(code: string): SkillId | null {
  for (const id of SKILL_IDS) if (SKILLS[id].code === code) return id;
  return null;
}

/**
 * Starts a move. Returns null while another move runs or the cooldown is up. `carried` is whether the ball is
 * at the player's feet; without it the move is a whiff. (fx, fy) is the facing (any non-zero length).
 */
export function startSkill(s: SkillState, id: SkillId, carried: boolean, fx: number, fy: number): SkillStart | null {
  if (s.active !== null || s.cooldown > 0) return null;
  const def = SKILLS[id];
  const len = Math.hypot(fx, fy) || 1;
  s.dirX = fx / len;
  s.dirY = fy / len;
  // vertical dominance → up clip, a down facing has no clip of its own and plays side
  const up = s.dirY < 0 && Math.abs(s.dirY) > Math.abs(s.dirX);
  s.dir = up ? "up" : "side";
  s.mirror = !up && s.dirX < 0;
  s.active = id;
  s.whiff = !carried;
  s.elapsed = 0;
  s.travelled = 0;
  s.stepX = 0;
  s.stepY = 0;

  const tierBefore = tierOf(s.style);
  const start: SkillStart = { id, whiff: s.whiff, gain: 0, chained: false, repeated: false, tierBefore, tierAfter: tierBefore };
  if (s.whiff) return start;

  const inWindow = s.lastId !== null && s.chainClock <= STYLE.chainWindow;
  let multiplier = 1;
  if (inWindow && s.lastId !== id) {
    multiplier = STYLE.chainBonus;
    start.chained = true;
    s.combo = Math.min(STYLE.pips, s.combo + 1);
  } else if (inWindow) {
    multiplier = STYLE.repeatPenalty;
    start.repeated = true;
  } else {
    s.combo = 1;
  }
  start.gain = def.style * multiplier;
  s.style = Math.min(STYLE.max, s.style + start.gain);
  s.sinceGain = 0;
  s.lastId = id;
  s.chainClock = 0;
  start.tierAfter = tierOf(s.style);
  return start;
}

function finish(s: SkillState) {
  s.active = null;
  s.whiff = false;
  s.cooldown = STYLE.cooldown;
}

/** Ends the running move early (the shot cancel). */
export function cancelSkill(s: SkillState) {
  if (s.active !== null) finish(s);
  s.stepX = 0;
  s.stepY = 0;
}

/** True during the last `STYLE.cancelWindow` seconds of a move: Space may cut it short for a shot. */
export function canCancelSkill(s: SkillState) {
  return s.active !== null && SKILLS[s.active].duration - s.elapsed <= STYLE.cancelWindow;
}

/**
 * Advances one step: the travel of the running move lands in `stepX/stepY`, timers run, the gauge drains.
 * `hold` freezes the drain (aiming a shot must not cost style).
 */
export function stepSkills(s: SkillState, dt: number, hold = false) {
  s.stepX = 0;
  s.stepY = 0;
  const running = s.active !== null && !s.whiff;
  if (!running) s.chainClock += dt;
  if (s.chainClock > STYLE.chainWindow && s.combo > 0) {
    s.combo = 0;
    s.lastId = null;
  }

  if (s.active !== null) {
    const def = SKILLS[s.active];
    s.elapsed = Math.min(def.duration, s.elapsed + dt);
    const eased = easeInOutSine(progress(s.elapsed, def.duration));
    if (!s.whiff) {
      const travel = def.move * (eased - s.travelled);
      s.stepX = s.dirX * travel;
      s.stepY = s.dirY * travel * MOVE.yFactor;
    }
    s.travelled = eased;
    if (s.elapsed >= def.duration) finish(s);
  } else if (s.cooldown > 0) {
    s.cooldown = Math.max(0, s.cooldown - dt);
  }

  if (!hold && s.style > 0) {
    s.sinceGain += dt;
    if (s.sinceGain > STYLE.decayDelay) s.style = Math.max(0, s.style - STYLE.decayPerSecond * dt);
  }
}

/** Reads the gauge at the kick and empties it: returns the Tier that was standing. */
export function consumeStyle(s: SkillState): StyleTier {
  const tier = tierOf(s.style);
  s.style = 0;
  s.sinceGain = 0;
  s.combo = 0;
  s.lastId = null;
  s.chainClock = 0;
  return tier;
}

/** Atlas pose of the running move: the 4 frames are spread over its duration. Null when no move runs. */
export function skillPose(s: SkillState): { clip: (typeof SKILLS)[SkillId]["clip"]; dir: "side" | "up"; mirror: boolean; frame: number } | null {
  if (s.active === null) return null;
  const def = SKILLS[s.active];
  const frame = Math.min(3, Math.floor(progress(s.elapsed, def.duration) * 4));
  return { clip: def.clip, dir: s.dir, mirror: s.mirror, frame };
}

/** Height of the hop (screen px) of the running move; only the rainbow flick leaves the ground. */
export function skillHop(s: SkillState) {
  if (s.active === null) return 0;
  const def = SKILLS[s.active];
  return def.hop * Math.sin(Math.PI * progress(s.elapsed, def.duration));
}
