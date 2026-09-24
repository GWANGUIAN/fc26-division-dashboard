// Match bookkeeping (docs/pitch/02 §7): turns a kick + the keeper's plan into GOAL / SAVE / POST / BAR / MISS, keeps
// the score and the streak, and runs the result → fade → reset sequence. Also decides how the ball leaves the goal
// plane (rebounds). Pure and DOM-free.

import type { KeeperOutcome, SavePlan, SaveKind } from "./keeper";
import type { Rng } from "./rng";
import type { ShotFlight } from "./shot";
import { GOAL_SCREEN, MATCH } from "./tuning";

export type ShotOutcome = KeeperOutcome;
export type ResultDetail = "WIDE" | "OVER" | SaveKind | null;

/** Event payload of a finished shot. P4 hooks (sound, celebration, stats) receive exactly this. */
export interface ShotResult {
  outcome: ShotOutcome;
  /** WIDE / OVER for a MISS, CATCH / PUNCH / DEFLECT for a SAVE (and for a goal that grazed the keeper's fingertips). */
  detail: ResultDetail;
  power: number;
  sweet: boolean;
  /** Where the ball crossed the goal plane: x offset from the goal centre and height (z px). */
  tx: number;
  h: number;
  /** The keeper had the ball's line but only touched it. */
  grazed: boolean;
}

/** Decides the result at the moment the ball reaches the goal plane. `forced` (debug) overrides the outcome. */
export function resolveShot(flight: ShotFlight, plan: SavePlan, forced?: ShotOutcome): ShotResult {
  let outcome: ShotOutcome;
  let detail: ResultDetail = null;
  switch (flight.kind) {
    case "post":
      outcome = "POST";
      break;
    case "bar":
      outcome = "BAR";
      break;
    case "wide":
      outcome = "MISS";
      detail = "WIDE";
      break;
    case "over":
      outcome = "MISS";
      detail = "OVER";
      break;
    default:
      outcome = plan.saved ? "SAVE" : "GOAL";
      detail = plan.kind;
  }
  if (forced) {
    outcome = forced;
    if (forced === "SAVE") detail = plan.kind ?? "CATCH";
    else if (forced === "MISS") detail = detail === "OVER" ? "OVER" : "WIDE";
    else if (forced !== "GOAL") detail = null;
  }
  return { outcome, detail, power: flight.power, sweet: flight.sweet, tx: flight.tx, h: flight.h, grazed: plan.grazed && outcome === "GOAL" };
}

export interface BallExit {
  vx: number;
  vy: number;
  vz: number;
  /** The ball ends inside the goal: the front net is drawn over it. */
  inNet: boolean;
  /** The ball is held by the keeper: it stays put at the goal plane. */
  held: boolean;
}

/**
 * How the ball leaves the goal plane (screen px/s, vy < 0 is toward the goal / up the screen, vz upward).
 * `fx`/`fy` are the ball's flight velocity when it arrived.
 */
export function ballExit(result: ShotResult, plan: SavePlan, fx: number, fy: number, rng: Rng): BallExit {
  const speed = Math.hypot(fx, fy);
  const side = (a: number) => (a === 0 ? (rng() < 0.5 ? -1 : 1) : Math.sign(a));
  switch (result.outcome) {
    case "GOAL":
      // straight into the net: most of the speed is taken by the netting
      return { vx: fx * 0.12, vy: Math.min(fy * 0.12, -30), vz: 0, inNet: true, held: false };
    case "SAVE": {
      if (result.detail === "CATCH") return { vx: 0, vy: 0, vz: 0, inNet: false, held: true };
      const away = side(result.tx - (plan.endX - 480)) * (result.detail === "DEFLECT" ? 240 : 170);
      return { vx: away, vy: result.detail === "DEFLECT" ? 140 : 250, vz: result.detail === "DEFLECT" ? 260 : 210, inNet: false, held: false };
    }
    case "POST":
      return { vx: (rng() - 0.5) * 420, vy: speed * (0.16 + 0.14 * rng()), vz: 150 + 100 * rng(), inNet: false, held: false };
    case "BAR":
      return { vx: (rng() - 0.5) * 240, vy: speed * (0.14 + 0.1 * rng()), vz: 220 + 100 * rng(), inNet: false, held: false };
    default:
      // MISS: the ball keeps going — wide past the post, or up over the bar
      if (result.detail === "OVER") return { vx: fx * 0.5, vy: fy * 0.4, vz: 260, inNet: false, held: false };
      return { vx: fx * 0.6, vy: fy * 0.5, vz: 60, inNet: false, held: false };
  }
}

export type MatchPhase = "play" | "flight" | "result" | "fade";

export interface MatchState {
  goals: number;
  saves: number;
  streak: number;
  bestStreak: number;
  shots: number;
  phase: MatchPhase;
  /** Seconds in the current phase. */
  timer: number;
  result: ShotResult | null;
  /** The reset (player / ball / keeper back to their spots) already fired in the current fade. */
  resetFired: boolean;
}

export function createMatch(): MatchState {
  return { goals: 0, saves: 0, streak: 0, bestStreak: 0, shots: 0, phase: "play", timer: 0, result: null, resetFired: false };
}

/** Score reset (not used by the pitch itself; a fresh `createMatch()` is the usual way). */
export function resetMatch(m: MatchState) {
  Object.assign(m, createMatch());
}

/** The kick happened: play → flight. */
export function beginFlight(m: MatchState) {
  m.phase = "flight";
  m.timer = 0;
  m.result = null;
  m.shots++;
}

/** The ball reached the goal plane: score it and start the 2.0 s result sequence. */
export function registerResult(m: MatchState, result: ShotResult) {
  m.result = result;
  m.phase = "result";
  m.timer = 0;
  m.resetFired = false;
  if (result.outcome === "GOAL") {
    m.goals++;
    m.streak++;
    if (m.streak > m.bestStreak) m.bestStreak = m.streak;
  } else {
    if (result.outcome === "SAVE") m.saves++;
    m.streak = 0;
  }
}

/** Advances the result → fade → play sequence. Returns "reset" once, at the darkest point of the fade. */
export function stepMatch(m: MatchState, dt: number): "reset" | null {
  if (m.phase === "play" || m.phase === "flight") return null;
  m.timer += dt;
  if (m.phase === "result") {
    if (m.timer >= MATCH.resultSeconds) {
      m.phase = "fade";
      m.timer = 0;
    }
    return null;
  }
  // fade: black in the first half, reset at the middle, clear in the second half
  let event: "reset" | null = null;
  if (!m.resetFired && m.timer >= MATCH.fadeSeconds / 2) {
    m.resetFired = true;
    event = "reset";
  }
  if (m.timer >= MATCH.fadeSeconds) {
    m.phase = "play";
    m.timer = 0;
    m.result = null;
  }
  return event;
}

/** 0 = clear, 1 = black. */
export function fadeAlpha(m: MatchState): number {
  if (m.phase !== "fade") return 0;
  const half = MATCH.fadeSeconds / 2;
  return m.timer < half ? m.timer / half : Math.max(0, 1 - (m.timer - half) / half);
}

/** Is the scene waiting for input again? */
export function isPlaying(m: MatchState) {
  return m.phase === "play";
}

export const RESULT_LABEL: Readonly<Record<ShotOutcome, string>> = { GOAL: "GOAL!", SAVE: "SAVE!", POST: "POST!", BAR: "BAR!", MISS: "MISS" };

/** Height of a ball at the goal plane in screen z px (for hit boxes and the debug view). */
export function screenHeight(h: number) {
  return h * GOAL_SCREEN.zScale;
}
