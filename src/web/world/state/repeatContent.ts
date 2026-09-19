import { GOLDEN_BALLS } from "../data/goldenBalls";
import { PLAYABLE_CAST } from "../data/worldCast";
import type { WorldSave } from "../types";
import { dailyEvent } from "./daily";
import type { MissionEvent } from "./missionEval";
import { recordRound } from "./ranks";

/** Only called on world-origin events, before the mission evaluator sees the updated collection. */
export function repeatEvent(save: WorldSave, event: MissionEvent, now: number): WorldSave {
  let next = dailyEvent(save, event, now);
  if (event.type === "minigame") next = recordRound(next, event.result);
  if (event.type === "card-view" && PLAYABLE_CAST.some(c => c.id === event.cardId)) next = { ...next, flags: { ...next.flags, [`card:${event.cardId}`]: true } };
  if (event.type === "pickup" && GOLDEN_BALLS.some(b => b.id === event.id) && !next.collected.includes(event.id)) next = { ...next, collected: [...next.collected, event.id] };
  const count = GOLDEN_BALLS.filter(b => next.collected.includes(b.id)).length;
  if (count >= 10) next = { ...next, flags: { ...next.flags, "badge:ball-collector": true, ...(count === 20 ? { "badge:ball-master": true as const } : {}) } };
  return next;
}
