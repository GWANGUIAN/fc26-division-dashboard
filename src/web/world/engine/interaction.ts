import type { CastId, Facing, Rect } from "../types";
import { rectsOverlap } from "./collision";
import type { Npc } from "./npc";
import type { ExaminePoint } from "./scene";

// Interaction (docs/world/01 §6): the target is the nearest thing in a 28px probe placed in front of the
// player's feet, in the direction they face. NPCs are hit by a body-sized rect, examine points by their area.

export const INTERACT_REACH = 28;

export type InteractTarget =
  | { kind: "npc"; key: string; cast: CastId; center: { x: number; y: number } }
  | { kind: "examine"; id?: string; text: string; action?: string; center: { x: number; y: number } }
  /** A mission pickup (lantern, dry patch of grass): E takes it, no dialogue. */
  | { kind: "object"; id: string; prompt: string; center: { x: number; y: number } }
  /** The kick ball of the training ground: E kicks it the way the player faces. */
  | { kind: "ball"; id: string; center: { x: number; y: number } };

/** Something else that can be interacted with (pickups, the ball), already positioned by the engine. */
export interface ExtraTarget {
  target: InteractTarget;
  area: Rect;
}

const HALF_BOX_W = 10;
const HALF_BOX_H = 10;

/** The rect in front of the feet that an interaction reaches. */
export function interactionProbe(feet: { x: number; y: number }, facing: Facing, reach = INTERACT_REACH): Rect {
  switch (facing) {
    case "down":
      return { x: feet.x - 12, y: feet.y, w: 24, h: reach };
    case "up":
      return { x: feet.x - 12, y: feet.y - HALF_BOX_H - reach, w: 24, h: reach };
    case "left":
      return { x: feet.x - HALF_BOX_W - reach, y: feet.y - 14, w: reach, h: 18 };
    case "right":
      return { x: feet.x + HALF_BOX_W, y: feet.y - 14, w: reach, h: 18 };
  }
}

/** Body-sized hit rect of an NPC standing at its feet position. */
export function npcHitArea(npc: Pick<Npc, "x" | "y" | "animal">): Rect {
  return npc.animal ? { x: npc.x - 14, y: npc.y - 22, w: 28, h: 26 } : { x: npc.x - 12, y: npc.y - 36, w: 24, h: 40 };
}

const centerOf = (rect: Rect) => ({ x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 });

/**
 * The nearest interactable overlapped by the probe. NPCs beat examine points at the same distance, since
 * a person standing next to a bench is what the player means.
 */
export function findInteractTarget(
  feet: { x: number; y: number },
  facing: Facing,
  npcs: readonly Npc[],
  examine: readonly ExaminePoint[],
  extras: readonly ExtraTarget[] = [],
): InteractTarget | null {
  const probe = interactionProbe(feet, facing);
  const probeCenter = centerOf(probe);
  const candidates: { target: InteractTarget; area: Rect; bias: number }[] = [];
  for (const npc of npcs) {
    const area = npcHitArea(npc);
    candidates.push({ target: { kind: "npc", key: npc.key, cast: npc.cast, center: centerOf(area) }, area, bias: 0 });
  }
  for (const point of examine) {
    candidates.push({ target: { kind: "examine", id: point.id, text: point.text, ...(point.action ? { action: point.action } : {}), center: centerOf(point.area) }, area: point.area, bias: 4 });
  }
  // Things you pick up or kick sit between people (bias 0) and signs (bias 4): they are the point of walking up to them.
  for (const extra of extras) candidates.push({ target: extra.target, area: extra.area, bias: 2 });
  let best: InteractTarget | null = null;
  let bestDistance = Infinity;
  for (const { target, area, bias } of candidates) {
    if (!rectsOverlap(probe, area)) continue;
    const c = centerOf(area);
    const distance = Math.hypot(c.x - probeCenter.x, c.y - probeCenter.y) + bias;
    if (distance < bestDistance) {
      best = target;
      bestDistance = distance;
    }
  }
  return best;
}
