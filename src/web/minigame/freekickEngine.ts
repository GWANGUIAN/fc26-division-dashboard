export const BALL_RADIUS_3D = 0.11; // meters, roughly a real soccer ball
export const GOAL_WIDTH = 7.32; // meters, regulation goal width
export const GOAL_HEIGHT = 2.44; // meters, regulation goal height
// Closer than a real free-kick distance on purpose — a shorter, closer-looking goal/keeper reads
// bigger on screen and leaves the keeper less time to react, both making the shot easier to line up.
export const GOAL_LINE_Z = -9;
export const SPOT_Z = 0;
// Where the keeper stands, slightly off the goal line toward the kicker (shared with the render
// layer so the "ball stops in front of the keeper" logic below and the keeper's actual rendered
// position never drift apart).
export const KEEPER_Z = GOAL_LINE_Z + 0.3;
// A save stops the ball just off the keeper's body (torso half-depth + ball radius + a small
// clearance) rather than letting it continue on to the goal line, which would render as sailing
// straight through the keeper and stopping behind them.
const SAVE_STOP_Z = KEEPER_Z + 0.4;

const GRAVITY = 9.8;
const MAGNUS_COEFFICIENT = 3.2;
// Matches the per-step curl increment in stepPhysics (`spin * MAGNUS_COEFFICIENT * dt * 0.1`) —
// used to analytically predict where a curling shot will cross the goal line.
const CURL_ACCEL_COEFFICIENT = MAGNUS_COEFFICIENT * 0.1;
const MAX_DT_SECONDS = 0.032;

const KEEPER_REACTION_DELAY = 0.4; // seconds before the keeper commits to a dive/jump

/** <1 means even a small click offset from dead-center already produces most of the max spin, so
 * only a near-perfect center strike keeps the shot straight — off-center strikes curl hard. */
const OFFSET_CURVE_EXPONENT = 0.85;
const MAX_SPIN = 9;
const MAX_POWER = 14; // m/s launch speed at full drag
const MIN_POWER = 4;

// A weak shot or one aimed too close to dead center is an easy read for any keeper — these
// always get blocked regardless of the keeper's left/right guess (see applyStrike).
const SLOW_SHOT_SPEED_THRESHOLD = MIN_POWER + 0.4 * (MAX_POWER - MIN_POWER); // m/s
const CENTERED_SHOT_HALF_WIDTH = GOAL_WIDTH / 8; // meters either side of dead center

export const STARTING_LIVES = 3;

export type GamePhase = "idle" | "flight" | "result" | "gameover";
export type ShotOutcome = "goal" | "saved" | "miss";
export type GoalZone = "left" | "right";

export interface BallState3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  spin: number;
}

export interface KeeperState {
  x: number;
  y: number;
  diving: boolean;
  diveTargetX: number;
  diveTargetY: number;
  /** Total predicted flight time (seconds) from strike to goal line — the dive animation is timed
   * to finish exactly when the ball arrives, however fast or slow that shot is (see stepPhysics),
   * so a "save" is never shown mid-dive, still short of the ball. */
  flightTime: number;
  /** Decided once, at the moment of the strike (see applyStrike) — the keeper commits to a half
   * of the goal before the shot is known, then either is guaranteed to meet the ball exactly (if
   * it guessed the right half) or dives to the wrong spot entirely (if it didn't). There is no
   * distance/overlap check anywhere else — this single flag is the save/goal outcome. */
  willSave: boolean;
}

export interface GameState {
  phase: GamePhase;
  ball: BallState3D;
  keeper: KeeperState;
  lives: number;
  score: number;
  bestScore: number;
  elapsed: number;
  result: ShotOutcome | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function restingBall(): BallState3D {
  return { x: 0, y: BALL_RADIUS_3D, z: SPOT_Z, vx: 0, vy: 0, vz: 0, spin: 0 };
}

function restingKeeper(): KeeperState {
  return { x: 0, y: 1, diving: false, diveTargetX: 0, diveTargetY: 1, flightTime: 1, willSave: false };
}

/** Time (seconds) for a shot with this vz to travel from the spot to the goal line. */
function computeFlightTime(vz: number): number {
  return vz !== 0 ? GOAL_LINE_Z / vz : 0;
}

export function createInitialState(bestScore: number): GameState {
  return {
    phase: "idle",
    ball: restingBall(),
    keeper: restingKeeper(),
    lives: STARTING_LIVES,
    score: 0,
    bestScore,
    elapsed: 0,
    result: null,
  };
}

/**
 * strikeOffsetX/Y are the strike point's offset from the ball's center (positive x = struck on the
 * right side, positive y = struck above center), normalized against BALL_RADIUS_3D by the caller.
 * dragDx/dragDy is the aim drag vector (positive dragDx = aiming right, positive dragDy = aiming up).
 */
export function computeShotVelocity(
  strikeOffsetX: number,
  strikeOffsetY: number,
  dragDx: number,
  dragDy: number,
): { vx: number; vy: number; vz: number; spin: number } {
  const normX = clamp(strikeOffsetX / BALL_RADIUS_3D, -1, 1);
  const curvedX = Math.sign(normX) * Math.abs(normX) ** OFFSET_CURVE_EXPONENT;
  const spin = -curvedX * MAX_SPIN;

  const dragMagnitude = clamp(Math.hypot(dragDx, dragDy), 0, 1);
  const power = MIN_POWER + dragMagnitude * (MAX_POWER - MIN_POWER);

  const aimX = clamp(dragDx, -1, 1);
  const aimY = clamp(0.15 + dragDy * 0.6, -0.1, 0.9);

  const vz = -power;
  // This coefficient sets how much of a full drag translates to sideways speed. Because power
  // cancels out of the arrival-position math (more power also means less time to drift), a full
  // drag lands at aimX * this * |GOAL_LINE_Z| regardless of how hard it was dragged — that value
  // must exceed GOAL_WIDTH/2 (currently 1 * 0.45 * 9 = 4.05 vs. 3.66) or dragging all the way to
  // the edge could never actually send the shot wide, no matter how far past the frame you aim.
  const vx = aimX * power * 0.45;
  const vy = aimY * power * 0.55 + clamp(strikeOffsetY, -BALL_RADIUS_3D, BALL_RADIUS_3D) * 6;

  return { vx, vy, vz, spin };
}

/** Which half of the goal an x position falls in. */
export function zoneForX(x: number): GoalZone {
  return x < 0 ? "left" : "right";
}

function zoneCenterX(zone: GoalZone): number {
  return zone === "left" ? -GOAL_WIDTH / 4 : GOAL_WIDTH / 4;
}

/** A uniform coin-flip between the goal's two halves, driven by a caller-supplied roll (0-1) so
 * the pure engine stays deterministic/testable — callers pass Math.random(). */
export function pickKeeperZone(roll: number): GoalZone {
  return roll < 0.5 ? "left" : "right";
}

/**
 * Analytically predicts where the ball will be (x, y) at the instant it reaches the goal line,
 * given its launch velocity/spin — closed-form version of the same gravity + curl integration
 * stepPhysics performs frame-by-frame, used so the keeper's zone-match decision can be made once
 * at the moment of the strike, before the flight actually plays out.
 */
export function predictArrival(vx: number, vy: number, vz: number, spin: number): { x: number; y: number } {
  const t = computeFlightTime(vz);
  const curlAccel = spin * CURL_ACCEL_COEFFICIENT;
  const x = vx * t + 0.5 * curlAccel * t * t;
  const y = Math.max(BALL_RADIUS_3D, BALL_RADIUS_3D + vy * t - 0.5 * GRAVITY * t * t);
  return { x, y };
}

export function applyStrike(
  state: GameState,
  strikeOffsetX: number,
  strikeOffsetY: number,
  dragDx: number,
  dragDy: number,
  keeperGuessRoll: number,
): GameState {
  if (state.phase !== "idle" || state.lives <= 0) return state;

  const { vx, vy, vz, spin } = computeShotVelocity(strikeOffsetX, strikeOffsetY, dragDx, dragDy);
  const arrival = predictArrival(vx, vy, vz, spin);
  const flightTime = computeFlightTime(vz);
  const keeperZone = pickKeeperZone(keeperGuessRoll);
  const guessedRightZone = keeperZone === zoneForX(arrival.x);
  // An easy read for any keeper — these are always blocked regardless of which half was guessed.
  const tooSlow = Math.abs(vz) < SLOW_SHOT_SPEED_THRESHOLD;
  const tooCentered = Math.abs(arrival.x) < CENTERED_SHOT_HALF_WIDTH;
  const willSave = guessedRightZone || tooSlow || tooCentered;

  const keeper: KeeperState = willSave
    ? { x: 0, y: 1, diving: false, diveTargetX: arrival.x, diveTargetY: arrival.y, flightTime, willSave: true }
    : { x: 0, y: 1, diving: false, diveTargetX: zoneCenterX(keeperZone), diveTargetY: 1, flightTime, willSave: false };

  return {
    ...state,
    phase: "flight",
    elapsed: 0,
    ball: { ...restingBall(), vx, vy, vz, spin },
    keeper,
  };
}

/**
 * Only ever called once the ball has actually reached the goal line (see stepPhysics). Whether
 * it's a save was already decided at the strike (see applyStrike/willSave) — this just applies
 * the crossbar/side-frame check first, since those override a "would have been saved" shot too.
 */
export function resolveOutcome(state: GameState): GameState {
  const { ball, keeper } = state;

  const crossedBar = ball.y > GOAL_HEIGHT;
  const crossedSide = Math.abs(ball.x) > GOAL_WIDTH / 2;
  if (crossedBar || crossedSide) {
    return finishShot(state, "miss");
  }

  return finishShot(state, keeper.willSave ? "saved" : "goal");
}

function finishShot(state: GameState, outcome: ShotOutcome): GameState {
  const isGoal = outcome === "goal";
  const score = isGoal ? state.score + 1 : state.score;
  const lives = isGoal ? state.lives : state.lives - 1;
  return {
    ...state,
    phase: lives <= 0 ? "gameover" : "result",
    result: outcome,
    lives,
    score,
    bestScore: Math.max(state.bestScore, score),
  };
}

export function stepPhysics(state: GameState, dtSeconds: number): GameState {
  if (state.phase !== "flight") return state;
  const dt = Math.min(dtSeconds, MAX_DT_SECONDS);
  const elapsed = state.elapsed + dt;

  let { x, y, z, vx, vy, vz, spin } = state.ball;
  vy -= GRAVITY * dt;
  vx += spin * CURL_ACCEL_COEFFICIENT * dt;
  x += vx * dt;
  y += vy * dt;
  z += vz * dt;

  let keeper = state.keeper;
  if (elapsed >= KEEPER_REACTION_DELAY) {
    // The dive window is scaled to this shot's actual flight time (not a fixed duration), so the
    // animation always finishes exactly as the ball arrives — a fast, powerful shot gets a quick
    // dive instead of one that's still mid-motion (and visibly not touching the ball) when the
    // outcome is decided.
    const diveWindow = Math.max(0.05, keeper.flightTime - KEEPER_REACTION_DELAY);
    const diveProgress = clamp((elapsed - KEEPER_REACTION_DELAY) / diveWindow, 0, 1);
    keeper = {
      ...keeper,
      diving: true,
      x: keeper.x + (keeper.diveTargetX - keeper.x) * diveProgress,
      y: 1 + (keeper.diveTargetY - 1) * diveProgress,
    };
  }

  // Only the min-clamp keeps the ball from tunneling underground; deliberately no max-clamp/stop
  // on the ground, so a grounder keeps rolling toward the goal line instead of resolving early.
  const ball: BallState3D = { x, y: Math.max(y, BALL_RADIUS_3D), z, vx, vy, vz, spin };
  let next: GameState = { ...state, ball, keeper, elapsed };

  if (z <= GOAL_LINE_Z) {
    // Belt-and-suspenders on top of the timing scale above: whenever this shot is a save, force
    // the keeper exactly onto the ball's *actual simulated* position at the moment of resolution
    // — not the pre-strike prediction (diveTargetX/Y), which can drift from where the ball truly
    // ends up (integration error over the flight, plus this final step's own overshoot past the
    // goal line). Snapping to the real ball position is the only way to guarantee a "saved"
    // result never renders without the keeper actually overlapping the ball.
    if (next.keeper.willSave) {
      next = {
        ...next,
        // Stop the ball just in front of the keeper instead of letting it continue on to the
        // goal line — otherwise it visibly sails through the keeper and rests behind them.
        ball: { ...next.ball, z: SAVE_STOP_Z },
        keeper: { ...next.keeper, x: next.ball.x, y: next.ball.y },
      };
    }
    return resolveOutcome(next);
  }

  return next;
}

export function resetForNextAttempt(state: GameState): GameState {
  if (state.phase !== "result") return state;
  return {
    ...state,
    phase: "idle",
    ball: restingBall(),
    keeper: restingKeeper(),
    result: null,
  };
}

export function startNewRound(state: GameState): GameState {
  return createInitialState(state.bestScore);
}
