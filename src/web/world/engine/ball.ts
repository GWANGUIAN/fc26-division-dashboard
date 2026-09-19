import type { Facing, Rect } from "../types";
import { moveAndSlide, rectsOverlap, type ObstacleSource } from "./collision";

// The kick ball (docs/world/01 §6): a small top-down ball that rolls, slows down by friction and bounces off
// walls, props and the pitch bounds. The player kicks it with E in the direction they face. Pure and
// deterministic — the engine owns the instance and asks it for goals.

export const BALL_SIZE = 12;
export const KICK_SPEED = 380;
/** px/s² of rolling friction: a full-power kick rolls about 340px. */
export const BALL_FRICTION = 210;
/** Share of the speed kept on a bounce. */
export const BALL_RESTITUTION = 0.72;
/** Below this speed the ball is at rest. */
export const BALL_REST_SPEED = 10;
/** The goal box counts a few pixels beyond its solid edge, since the ball stops at the surface. */
export const GOAL_MARGIN = 4;

export interface Ball {
  /** Centre of the ball. */
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export const createBall = (x: number, y: number): Ball => ({ x, y, vx: 0, vy: 0 });

export const ballBox = (ball: Pick<Ball, "x" | "y">): Rect => ({ x: ball.x - BALL_SIZE / 2, y: ball.y - BALL_SIZE / 2, w: BALL_SIZE, h: BALL_SIZE });

export const isResting = (ball: Ball) => ball.vx === 0 && ball.vy === 0;

const DIRECTION: Record<Facing, { x: number; y: number }> = { down: { x: 0, y: 1 }, up: { x: 0, y: -1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };

/** A kick sends the ball along the kicker's facing at full speed, whatever it was doing before. */
export function kickBall(ball: Ball, facing: Facing, speed = KICK_SPEED): Ball {
  const d = DIRECTION[facing];
  return { ...ball, vx: d.x * speed, vy: d.y * speed };
}

export interface BallStep {
  ball: Ball;
  /** The ball bounced off something this step (for the sound). */
  bounced: boolean;
}

/** Advances the ball by `dt`: rolls, bounces off obstacles and stays inside `bounds`, then loses speed to friction. */
export function stepBall(ball: Ball, dt: number, obstacles: ObstacleSource, bounds: Rect): BallStep {
  if (isResting(ball)) return { ball, bounced: false };
  const box = ballBox(ball);
  const move = moveAndSlide(box, ball.vx * dt, ball.vy * dt, obstacles, bounds);
  let vx = move.hitX ? -ball.vx * BALL_RESTITUTION : ball.vx;
  let vy = move.hitY ? -ball.vy * BALL_RESTITUTION : ball.vy;

  const speed = Math.hypot(vx, vy);
  const slowed = Math.max(0, speed - BALL_FRICTION * dt);
  if (slowed < BALL_REST_SPEED) {
    vx = 0;
    vy = 0;
  } else {
    vx *= slowed / speed;
    vy *= slowed / speed;
  }
  return { ball: { x: move.x + BALL_SIZE / 2, y: move.y + BALL_SIZE / 2, vx, vy }, bounced: move.hitX || move.hitY };
}

/** Has the ball touched the goal (its rect grown by GOAL_MARGIN)? */
export function inGoal(ball: Ball, goal: Rect): boolean {
  return rectsOverlap(ballBox(ball), { x: goal.x - GOAL_MARGIN, y: goal.y - GOAL_MARGIN, w: goal.w + GOAL_MARGIN * 2, h: goal.h + GOAL_MARGIN * 2 });
}

/** Is the ball within kicking range of the player's feet, in front of them? (the probe of interaction.ts) */
export function ballInReach(ball: Ball, probe: Rect): boolean {
  return rectsOverlap(ballBox(ball), probe);
}
