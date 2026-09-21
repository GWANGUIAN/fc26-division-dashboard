import { STAGES, brickScore, parseStage, type BrickType, type KeeperBreakoutBrick } from "./keeperBreakoutStages.js";

export const LOGICAL_WIDTH = 640;
export const LOGICAL_HEIGHT = 480;
export const PADDLE_Y = 440;
export const PADDLE_HEIGHT = 28;
export const PADDLE_WIDTH = 112;
export const WIDE_PADDLE_WIDTH = 168;
export const BALL_RADIUS = 8;
export const FIXED_STEP = 1 / 60;
export const SUBSTEPS = 3;
export const KEYBOARD_SPEED = 420;
export const SHIELD_Y = 470;
export const BRICK_LEFT = 20;
export const BRICK_TOP = 60;
export const BRICK_CELL_WIDTH = 60;
export const BRICK_CELL_HEIGHT = 24;
export const BRICK_WIDTH = 56;
export const BRICK_HEIGHT = 20;

export type PowerUpKind = "wide" | "multi" | "slow" | "shield";
export type KeeperBreakoutPhase = "ready" | "playing" | "stageclear" | "over" | "cleared";
export type KeeperBreakoutEvent = "paddle" | "brick" | "clank" | "powerup" | "lifelost" | "stageclear" | "gameover";

export interface KeeperBreakoutBall { x: number; y: number; vx: number; vy: number; stuck: boolean }
export interface KeeperBreakoutDrop { x: number; y: number; kind: PowerUpKind }
export interface KeeperBreakoutState {
  phase: KeeperBreakoutPhase;
  stage: number;
  lives: number;
  score: number;
  paddle: { x: number; w: number; targetX: number };
  balls: KeeperBreakoutBall[];
  bricks: KeeperBreakoutBrick[];
  drops: KeeperBreakoutDrop[];
  effects: { wideUntil: number; slowUntil: number; shield: boolean };
  time: number;
  rngState: number;
  events: KeeperBreakoutEvent[];
}

const DROP_SPEED = 140;
const MIN_VERTICAL_RATIO = .3;
const POWERUP_CHANCE = .08;
const WIDE_SECONDS = 12;
const SLOW_SECONDS = 8;

function random(state: number) {
  let next = state >>> 0;
  next ^= next << 13; next ^= next >>> 17; next ^= next << 5;
  return { state: next >>> 0, value: (next >>> 0) / 0x1_0000_0000 };
}

function speedForStage(stage: number) {
  return Math.min(520, 340 * Math.pow(1.06, stage));
}

function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, value)); }

function normalizeVelocity(vx: number, vy: number, desiredSpeed = Math.hypot(vx, vy)) {
  const safeSpeed = desiredSpeed || 340;
  let nx = vx;
  let ny = vy;
  if (Math.abs(ny) < safeSpeed * MIN_VERTICAL_RATIO) {
    ny = (ny || -1) < 0 ? -safeSpeed * MIN_VERTICAL_RATIO : safeSpeed * MIN_VERTICAL_RATIO;
    nx = Math.sign(nx || 1) * Math.sqrt(Math.max(0, safeSpeed * safeSpeed - ny * ny));
  }
  const size = Math.hypot(nx, ny) || 1;
  return { vx: nx * safeSpeed / size, vy: ny * safeSpeed / size };
}

function initialBall(paddle: KeeperBreakoutState["paddle"]): KeeperBreakoutBall {
  return { x: paddle.x + paddle.w / 2, y: PADDLE_Y - BALL_RADIUS - 1, vx: 0, vy: 0, stuck: true };
}

export function createGame(seed = 1): KeeperBreakoutState {
  const paddle = { x: (LOGICAL_WIDTH - PADDLE_WIDTH) / 2, w: PADDLE_WIDTH, targetX: LOGICAL_WIDTH / 2 };
  return { phase: "ready", stage: 0, lives: 3, score: 0, paddle, balls: [initialBall(paddle)], bricks: parseStage(STAGES[0]), drops: [], effects: { wideUntil: 0, slowUntil: 0, shield: false }, time: 0, rngState: seed >>> 0, events: [] };
}

export function startGame(seed = 1) {
  return { ...createGame(seed), phase: "playing" as const };
}

export function setPaddleTarget(state: KeeperBreakoutState, x: number): KeeperBreakoutState {
  return { ...state, paddle: { ...state.paddle, targetX: clamp(x, state.paddle.w / 2, LOGICAL_WIDTH - state.paddle.w / 2) } };
}

export function launch(state: KeeperBreakoutState): KeeperBreakoutState {
  if (state.phase !== "playing" || !state.balls.some((ball) => ball.stuck)) return state;
  const rolled = random(state.rngState);
  const angle = (rolled.value * 30 - 15) * Math.PI / 180;
  const speed = speedForStage(state.stage);
  return { ...state, rngState: rolled.state, balls: state.balls.map((ball) => ball.stuck ? { ...ball, ...normalizeVelocity(Math.sin(angle) * speed, -Math.cos(angle) * speed, speed), stuck: false } : ball) };
}

function rectangleFor(brick: KeeperBreakoutBrick) { return { x: BRICK_LEFT + brick.col * BRICK_CELL_WIDTH, y: BRICK_TOP + brick.row * BRICK_CELL_HEIGHT, w: BRICK_WIDTH, h: BRICK_HEIGHT }; }

function collideCircleRectangle(ball: KeeperBreakoutBall, rect: { x: number; y: number; w: number; h: number }) {
  const nearestX = clamp(ball.x, rect.x, rect.x + rect.w);
  const nearestY = clamp(ball.y, rect.y, rect.y + rect.h);
  const dx = ball.x - nearestX;
  const dy = ball.y - nearestY;
  if (dx * dx + dy * dy > BALL_RADIUS * BALL_RADIUS) return null;
  if (Math.abs(dx) > Math.abs(dy)) return { x: dx < 0 ? -1 : 1, y: 0 };
  if (Math.abs(dy) > Math.abs(dx)) return { x: 0, y: dy < 0 ? -1 : 1 };
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  return Math.abs(ball.x - cx) > Math.abs(ball.y - cy) ? { x: ball.x < cx ? -1 : 1, y: 0 } : { x: 0, y: ball.y < cy ? -1 : 1 };
}

function damageBrick(bricks: KeeperBreakoutBrick[], index: number, events: KeeperBreakoutEvent[], drops: KeeperBreakoutDrop[], rngState: number, exploding = new Set<number>()): { bricks: KeeperBreakoutBrick[]; score: number; rngState: number } {
  const target = bricks[index];
  if (!target || target.type === "steel") return { bricks, score: 0, rngState };
  const next = bricks.map((brick) => ({ ...brick }));
  const hit = next[index];
  hit.hp -= 1;
  if (hit.hp > 0) {
    if (hit.type === "hp3") hit.type = "hp2";
    else if (hit.type === "hp2") hit.type = "hp1";
    events.push("clank");
    return { bricks: next, score: 0, rngState };
  }
  const destroyed = next.splice(index, 1)[0];
  events.push("brick");
  let score = destroyed.value;
  let seeded = rngState;
  let shouldDrop = destroyed.type === "gold";
  if (!shouldDrop) { const roll = random(seeded); seeded = roll.state; shouldDrop = roll.value < POWERUP_CHANCE; }
  if (shouldDrop) { const roll = random(seeded); seeded = roll.state; const kinds: PowerUpKind[] = ["wide", "multi", "slow", "shield"]; drops.push({ x: BRICK_LEFT + destroyed.col * BRICK_CELL_WIDTH + BRICK_WIDTH / 2, y: BRICK_TOP + destroyed.row * BRICK_CELL_HEIGHT + BRICK_HEIGHT / 2, kind: kinds[Math.floor(roll.value * kinds.length)] }); }
  if (destroyed.type !== "burst" || exploding.has(index)) return { bricks: next, score, rngState: seeded };
  exploding.add(index);
  const neighbors = next.map((brick, neighborIndex) => ({ brick, neighborIndex })).filter(({ brick }) => Math.abs(brick.col - destroyed.col) <= 1 && Math.abs(brick.row - destroyed.row) <= 1 && brick.type !== "steel").map(({ neighborIndex }) => neighborIndex).reverse();
  for (const neighborIndex of neighbors) { const result = damageBrick(next, neighborIndex, events, drops, seeded, exploding); next.splice(0, next.length, ...result.bricks); score += result.score; seeded = result.rngState; }
  return { bricks: next, score, rngState: seeded };
}

function applyPowerUp(state: KeeperBreakoutState, kind: PowerUpKind) {
  const at = state.time;
  if (kind === "wide") return { ...state, paddle: { ...state.paddle, w: WIDE_PADDLE_WIDTH, x: clamp(state.paddle.x, 0, LOGICAL_WIDTH - WIDE_PADDLE_WIDTH) }, effects: { ...state.effects, wideUntil: at + WIDE_SECONDS } };
  if (kind === "slow") return { ...state, balls: state.balls.map((ball) => ball.stuck || state.effects.slowUntil > at ? ball : { ...ball, vx: ball.vx * .7, vy: ball.vy * .7 }), effects: { ...state.effects, slowUntil: at + SLOW_SECONDS } };
  if (kind === "shield") return { ...state, effects: { ...state.effects, shield: true } };
  const additions = state.balls.flatMap((ball) => {
    if (ball.stuck) return [];
    const base = Math.atan2(ball.vy, ball.vx);
    const speed = Math.hypot(ball.vx, ball.vy);
    return [-20, 20].map((degrees) => ({ ...ball, ...normalizeVelocity(Math.cos(base + degrees * Math.PI / 180) * speed, Math.sin(base + degrees * Math.PI / 180) * speed, speed) }));
  });
  return { ...state, balls: [...state.balls, ...additions] };
}

export function nextStage(state: KeeperBreakoutState): KeeperBreakoutState {
  if (state.phase !== "stageclear") return state;
  const stage = state.stage + 1;
  const paddle = { x: clamp(state.paddle.x, 0, LOGICAL_WIDTH - PADDLE_WIDTH), w: PADDLE_WIDTH, targetX: state.paddle.targetX };
  return { ...state, phase: "playing", stage, paddle, balls: [initialBall(paddle)], bricks: parseStage(STAGES[stage]), drops: [], effects: { wideUntil: 0, slowUntil: 0, shield: false }, events: [] };
}

export function step(state: KeeperBreakoutState, dt = FIXED_STEP): KeeperBreakoutState {
  if (state.phase !== "playing" || dt <= 0) return state;
  const events: KeeperBreakoutEvent[] = [];
  let paddle = { ...state.paddle };
  paddle.x += clamp(paddle.targetX - (paddle.x + paddle.w / 2), -KEYBOARD_SPEED * dt, KEYBOARD_SPEED * dt);
  paddle.x = clamp(paddle.x, 0, LOGICAL_WIDTH - paddle.w);
  let balls = state.balls.map((ball) => ({ ...ball }));
  let bricks = state.bricks.map((brick) => ({ ...brick }));
  let drops = state.drops.map((drop) => ({ ...drop }));
  let score = state.score;
  let rngState = state.rngState;
  let effects = { ...state.effects };
  const time = state.time + dt;
  if (effects.wideUntil && time >= effects.wideUntil) { paddle.w = PADDLE_WIDTH; paddle.x = clamp(paddle.x, 0, LOGICAL_WIDTH - paddle.w); effects.wideUntil = 0; }
  if (effects.slowUntil && time >= effects.slowUntil) { balls = balls.map((ball) => ball.stuck ? ball : { ...ball, vx: ball.vx / .7, vy: ball.vy / .7 }); effects.slowUntil = 0; }
  const subDt = dt / SUBSTEPS;
  for (let sub = 0; sub < SUBSTEPS; sub += 1) {
    for (const ball of balls) {
      if (ball.stuck) { ball.x = paddle.x + paddle.w / 2; ball.y = PADDLE_Y - BALL_RADIUS - 1; continue; }
      Object.assign(ball, normalizeVelocity(ball.vx, ball.vy));
      ball.x += ball.vx * subDt; ball.y += ball.vy * subDt;
      if (ball.x - BALL_RADIUS < 0) { ball.x = BALL_RADIUS; ball.vx = Math.abs(ball.vx); }
      if (ball.x + BALL_RADIUS > LOGICAL_WIDTH) { ball.x = LOGICAL_WIDTH - BALL_RADIUS; ball.vx = -Math.abs(ball.vx); }
      if (ball.y - BALL_RADIUS < 0) { ball.y = BALL_RADIUS; ball.vy = Math.abs(ball.vy); }
      const paddleHit = collideCircleRectangle(ball, { x: paddle.x, y: PADDLE_Y, w: paddle.w, h: PADDLE_HEIGHT });
      if (paddleHit && ball.vy > 0) { const ratio = clamp((ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2), -1, 1); const angle = ratio * Math.PI / 3; const speed = Math.hypot(ball.vx, ball.vy); Object.assign(ball, normalizeVelocity(Math.sin(angle) * speed, -Math.cos(angle) * speed, speed)); ball.y = PADDLE_Y - BALL_RADIUS - .01; events.push("paddle"); }
      const brickIndex = bricks.findIndex((brick) => collideCircleRectangle(ball, rectangleFor(brick)));
      if (brickIndex >= 0) { const rect = rectangleFor(bricks[brickIndex]); const normal = collideCircleRectangle(ball, rect)!; if (normal.x) ball.vx = Math.abs(ball.vx) * normal.x; else ball.vy = Math.abs(ball.vy) * normal.y; ball.x += normal.x * .1; ball.y += normal.y * .1; const result = damageBrick(bricks, brickIndex, events, drops, rngState); bricks = result.bricks; score += result.score; rngState = result.rngState; }
    }
  }
  let draft: KeeperBreakoutState = { ...state, paddle, balls, bricks, drops, score, rngState, effects, time, events };
  const keptDrops: KeeperBreakoutDrop[] = [];
  for (const drop of drops) { drop.y += DROP_SPEED * dt; const caught = drop.y >= PADDLE_Y && drop.y <= PADDLE_Y + PADDLE_HEIGHT && drop.x >= paddle.x && drop.x <= paddle.x + paddle.w; if (caught) { draft = applyPowerUp({ ...draft, drops: keptDrops }, drop.kind); paddle = draft.paddle; balls = draft.balls; effects = draft.effects; events.push("powerup"); } else if (drop.y < LOGICAL_HEIGHT) keptDrops.push(drop); }
  draft = { ...draft, paddle, balls, drops: keptDrops, effects, events };
  if (!draft.bricks.some((brick) => brick.type !== "steel")) { const scoreWithBonus = draft.score + 100 * draft.lives; if (draft.stage === STAGES.length - 1) return { ...draft, score: scoreWithBonus, phase: "cleared", events: [...events, "stageclear"] }; return { ...draft, score: scoreWithBonus, phase: "stageclear", events: [...events, "stageclear"] }; }
  const surviving = draft.balls.filter((ball) => ball.y - BALL_RADIUS <= LOGICAL_HEIGHT);
  if (surviving.length) return { ...draft, balls: surviving };
  if (draft.effects.shield) return { ...draft, balls: [{ x: paddle.x + paddle.w / 2, y: SHIELD_Y - BALL_RADIUS, vx: 0, vy: -speedForStage(draft.stage), stuck: false }], effects: { ...draft.effects, shield: false } };
  const lives = draft.lives - 1;
  events.push("lifelost");
  if (lives <= 0) return { ...draft, lives: 0, phase: "over", events: [...events, "gameover"] };
  return { ...draft, lives, balls: [initialBall(paddle)] };
}

/** The score ceiling for the fixed five-stage data, before rounding server validation up. */
export function maxPossibleScore() {
  return STAGES.reduce((total, stage) => total + parseStage(stage).reduce((sum, brick) => sum + brickScore(brick.type), 0), 0) + 100 * 3 * STAGES.length;
}
