import type { CastId, Facing, NpcAi, Rect } from "../types";
import { footBox, moveAndSlide, type ObstacleSource } from "./collision";
import type { NpcSpawn } from "./scene";

// NPC entities (docs/world/01 §6): `stay` never moves, `idle` turns on the spot now and then, `wander`
// strolls to random points inside its rect. While talking, an NPC faces the player and freezes; when the
// conversation ends it turns back.

export const NPC_BOX = { w: 16, h: 8 };
const HUMAN_SPEED = 34;
const ANIMAL_SPEED = 52;
const FACINGS: readonly Facing[] = ["down", "left", "up", "right"];

export interface Npc {
  key: string;
  cast: CastId;
  /** Feet position. */
  x: number;
  y: number;
  facing: Facing;
  ai: NpcAi;
  animal: boolean;
  wander: Rect | null;
  moving: boolean;
  animTime: number;
  speed: number;
  /** Seconds until the next decision. */
  timer: number;
  target: { x: number; y: number } | null;
  /** Seconds spent pushing against something on the way to `target`. */
  stuck: number;
  talking: boolean;
  facingBeforeTalk: Facing | null;
}

export function createNpc(spawn: NpcSpawn, animal: boolean, rand: () => number = Math.random): Npc {
  return {
    key: spawn.key,
    cast: spawn.cast,
    x: spawn.x,
    y: spawn.y,
    facing: "down",
    ai: spawn.ai,
    animal,
    wander: spawn.ai === "wander" ? (spawn.wander ?? { x: spawn.x - 48, y: spawn.y - 32, w: 96, h: 64 }) : null,
    moving: false,
    animTime: 0,
    speed: animal ? ANIMAL_SPEED : HUMAN_SPEED,
    timer: 0.5 + rand() * 2.5,
    target: null,
    stuck: 0,
    talking: false,
    facingBeforeTalk: null,
  };
}

export function npcBox(npc: Pick<Npc, "x" | "y">): Rect {
  return footBox(npc.x, npc.y, NPC_BOX.w, NPC_BOX.h);
}

/** Which of the four directions points most directly from `from` to `to` (ties go horizontal). */
export function facingToward(from: { x: number; y: number }, to: { x: number; y: number }): Facing {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? "left" : "right";
  return dy < 0 ? "up" : "down";
}

/** Conversation starts: stop and look at the player. */
export function startTalk(npc: Npc, player: { x: number; y: number }) {
  if (!npc.talking) npc.facingBeforeTalk = npc.facing;
  npc.talking = true;
  npc.moving = false;
  npc.target = null;
  npc.animTime = 0;
  npc.facing = facingToward(npc, player);
}

/** Conversation over: turn back to where the NPC was looking (walkers just carry on). */
export function endTalk(npc: Npc) {
  if (!npc.talking) return;
  npc.talking = false;
  if (npc.facingBeforeTalk && npc.ai !== "wander") npc.facing = npc.facingBeforeTalk;
  npc.facingBeforeTalk = null;
  npc.timer = 1 + npc.timer * 0.5;
}

function pickTarget(npc: Npc, rand: () => number) {
  const rect = npc.wander;
  if (!rect) return null;
  const halfW = NPC_BOX.w / 2;
  return {
    x: rect.x + halfW + rand() * Math.max(0, rect.w - NPC_BOX.w),
    y: rect.y + NPC_BOX.h + rand() * Math.max(0, rect.h - NPC_BOX.h),
  };
}

/**
 * Advances one NPC by `dt` seconds. `obstacles` is everything it must not walk into (scene colliders
 * plus the player and the other NPCs). `rand` is injectable so tests are deterministic.
 */
export function stepNpc(npc: Npc, dt: number, obstacles: ObstacleSource, rand: () => number = Math.random) {
  if (npc.talking || npc.ai === "stay") {
    npc.moving = false;
    npc.animTime = 0;
    return;
  }

  if (npc.ai === "idle") {
    npc.timer -= dt;
    if (npc.timer <= 0) {
      const options = FACINGS.filter((facing) => facing !== npc.facing);
      npc.facing = options[Math.floor(rand() * options.length)];
      npc.timer = 2 + rand() * 3;
    }
    npc.moving = false;
    return;
  }

  // wander
  if (!npc.target) {
    npc.moving = false;
    npc.animTime = 0;
    npc.timer -= dt;
    if (npc.timer <= 0) {
      npc.target = pickTarget(npc, rand);
      npc.stuck = 0;
    }
    return;
  }

  const dx = npc.target.x - npc.x;
  const dy = npc.target.y - npc.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 2) {
    npc.target = null;
    npc.timer = 1.2 + rand() * 2.8;
    npc.moving = false;
    npc.animTime = 0;
    return;
  }
  const step = Math.min(distance, npc.speed * dt);
  const box = footBox(npc.x, npc.y, NPC_BOX.w, NPC_BOX.h);
  const bounds = npc.wander ?? undefined;
  const result = moveAndSlide(box, (dx / distance) * step, (dy / distance) * step, obstacles, bounds);
  const moved = Math.hypot(result.x - box.x, result.y - box.y);
  npc.x = result.x + box.w / 2;
  npc.y = result.y + box.h;
  npc.facing = facingToward({ x: 0, y: 0 }, { x: dx, y: dy });
  if (moved < step * 0.3) {
    npc.stuck += dt;
    if (npc.stuck > 0.6) {
      npc.target = null;
      npc.timer = 0.4 + rand() * 1.2;
      npc.moving = false;
      npc.animTime = 0;
      return;
    }
  } else {
    npc.stuck = 0;
  }
  npc.moving = moved > 1e-6;
  npc.animTime = npc.moving ? npc.animTime + dt : 0;
}
