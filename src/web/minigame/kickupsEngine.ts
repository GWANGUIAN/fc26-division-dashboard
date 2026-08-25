export const BALL_RADIUS = 52;
export const COURT_WIDTH = 900;
export const COURT_HEIGHT = 675;
export const GROUND_Y = 620;
export const DROP_X = COURT_WIDTH / 2;
export const DROP_Y = 60;

const GRAVITY_BASE = 900;
const GRAVITY_MAX = 2200;
const GRAVITY_RAMP_PER_HIT = 35;
const HIT_TOLERANCE_BASE = 40;
const HIT_TOLERANCE_MIN = 22;
const HIT_TOLERANCE_SHRINK_PER_HIT = 0.3;
const MAX_VX = 900;
/** <1 means even a small click offset from dead-center already produces most of the max speed, so
 * only a near-perfect center click keeps the ball under control — imprecise clicks fling it away. */
const OFFSET_CURVE_EXPONENT = 0.85;
const BASE_VY = -760;
/** How much a click's vertical offset from the ball's center reshapes the pop: clicking the
 * lower half lifts it higher, clicking the upper half flattens (but never reverses) the arc. */
const VERTICAL_TILT = 0.85;
const WALL_BOUNCE_DAMPING = -0.7;
const SETTLE_VX_DAMPING = 0.4;
const SETTLE_VY_DAMPING = -0.25;
const SETTLE_VELOCITY_THRESHOLD = 30;
const MAX_DT_SECONDS = 0.032;

export type GamePhase = "idle" | "airborne" | "grounded";

export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface GameState {
  phase: GamePhase;
  ball: BallState;
  score: number;
  highScore: number;
  gravity: number;
  hitTolerance: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function computeGravity(score: number): number {
  return Math.min(GRAVITY_MAX, GRAVITY_BASE + score * GRAVITY_RAMP_PER_HIT);
}

export function computeHitTolerance(score: number): number {
  return Math.max(HIT_TOLERANCE_MIN, HIT_TOLERANCE_BASE - score * HIT_TOLERANCE_SHRINK_PER_HIT);
}

/**
 * offsetX/offsetY are the click's raw pixel offset from the ball's current center (positive x =
 * clicked right of center, positive y = clicked below center). Horizontal offset steers left/right
 * the same way as before; vertical offset now additionally reshapes the pop's arc, so a bottom-left
 * click and a top-left click send the ball off at different angles instead of an identical bounce.
 */
export function computeBounceVelocity(offsetX: number, offsetY: number): { vx: number; vy: number } {
  const normX = clamp(offsetX / BALL_RADIUS, -1, 1);
  const normY = clamp(offsetY / BALL_RADIUS, -1, 1);
  const curvedX = Math.sign(normX) * Math.abs(normX) ** OFFSET_CURVE_EXPONENT;
  return {
    vx: -curvedX * MAX_VX,
    vy: BASE_VY * (1 + VERTICAL_TILT * normY) * (1 - 0.15 * Math.abs(curvedX)),
  };
}

export function createInitialState(highScore: number): GameState {
  return {
    phase: "idle",
    score: 0,
    highScore,
    gravity: GRAVITY_BASE,
    hitTolerance: HIT_TOLERANCE_BASE,
    ball: { x: DROP_X, y: GROUND_Y - BALL_RADIUS, vx: 0, vy: 0 },
  };
}

export function startDrop(state: GameState): GameState {
  if (state.phase !== "idle") return state;
  return {
    ...state,
    phase: "airborne",
    score: 0,
    gravity: GRAVITY_BASE,
    hitTolerance: HIT_TOLERANCE_BASE,
    ball: { x: DROP_X, y: DROP_Y, vx: 0, vy: 0 },
  };
}

export function applyHit(state: GameState, clickX: number, clickY: number): GameState {
  if (state.phase !== "airborne") return state;
  const dist = Math.hypot(clickX - state.ball.x, clickY - state.ball.y);
  if (dist > BALL_RADIUS + state.hitTolerance) return state;

  const score = state.score + 1;
  const { vx, vy } = computeBounceVelocity(clickX - state.ball.x, clickY - state.ball.y);
  return {
    ...state,
    score,
    highScore: Math.max(state.highScore, score),
    gravity: computeGravity(score),
    hitTolerance: computeHitTolerance(score),
    ball: { x: state.ball.x, y: state.ball.y, vx, vy },
  };
}

export function applyRelaunch(state: GameState, clickX: number, clickY: number): GameState {
  if (state.phase !== "grounded") return state;
  const dist = Math.hypot(clickX - state.ball.x, clickY - state.ball.y);
  if (dist > BALL_RADIUS + HIT_TOLERANCE_BASE) return state;

  const { vx, vy } = computeBounceVelocity(clickX - state.ball.x, clickY - state.ball.y);
  return {
    ...state,
    phase: "airborne",
    score: 0,
    gravity: GRAVITY_BASE,
    hitTolerance: HIT_TOLERANCE_BASE,
    ball: { x: state.ball.x, y: state.ball.y, vx, vy },
  };
}

export function stepPhysics(state: GameState, dtSeconds: number): GameState {
  if (state.phase === "idle") return state;
  const dt = Math.min(dtSeconds, MAX_DT_SECONDS);

  let { x, y, vx, vy } = state.ball;
  const gravity = state.phase === "grounded" ? GRAVITY_BASE : state.gravity;
  vy += gravity * dt;
  x += vx * dt;
  y += vy * dt;

  if (x - BALL_RADIUS < 0) {
    x = BALL_RADIUS;
    vx *= WALL_BOUNCE_DAMPING;
  } else if (x + BALL_RADIUS > COURT_WIDTH) {
    x = COURT_WIDTH - BALL_RADIUS;
    vx *= WALL_BOUNCE_DAMPING;
  }

  if (y + BALL_RADIUS < GROUND_Y) {
    return { ...state, ball: { x, y, vx, vy } };
  }

  y = GROUND_Y - BALL_RADIUS;

  if (state.phase === "airborne") {
    return {
      ...state,
      phase: "grounded",
      gravity: GRAVITY_BASE,
      hitTolerance: HIT_TOLERANCE_BASE,
      ball: { x, y, vx: vx * SETTLE_VX_DAMPING, vy: vy * SETTLE_VY_DAMPING },
    };
  }

  const settled = Math.abs(vx) < SETTLE_VELOCITY_THRESHOLD && Math.abs(vy) < SETTLE_VELOCITY_THRESHOLD;
  return {
    ...state,
    ball: settled ? { x, y, vx: 0, vy: 0 } : { x, y, vx: vx * SETTLE_VX_DAMPING, vy: vy * SETTLE_VY_DAMPING },
  };
}
