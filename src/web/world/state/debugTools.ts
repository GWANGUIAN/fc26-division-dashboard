import { getMissionDef, missionDefsFor } from "../data/missionDefs";
import type { MissionStatus, WorldSave } from "../types";
import { acceptMission, completeMission, completeTalk } from "./missions";
import { initialProgress } from "./missionEval";

// Save editing for the `?worldDebug` panel (docs/world/08 §0 #4): set shards and flags, put a mission in any
// state, skip the tutorial, finish every main mission, reset the progress. Pure like the rest of the state layer.
// "completed" goes through the real completion (so the shard, badge and flags are paid out once).

export const MAX_SHARDS = 10;

export function debugSetShards<T extends WorldSave>(save: T, shards: number): T {
  return { ...save, shards: Math.min(MAX_SHARDS, Math.max(0, Math.round(shards))) };
}

export function debugSetFlag<T extends WorldSave>(save: T, name: string, on: boolean): T {
  const key = name.trim();
  if (!key) return save;
  const flags = { ...save.flags };
  if (on) flags[key] = true;
  else delete flags[key];
  return { ...save, flags };
}

/** Puts one mission in a state. `available`/`locked` forget it (the requirements decide which); `completed` pays the reward if it was not yet. */
export function debugSetMission<T extends WorldSave>(save: T, id: string, status: MissionStatus): T {
  const def = getMissionDef(id);
  if (!def) return save;
  const current = save.missions[id]?.status;
  if (status === "available" || status === "locked") {
    const { [id]: _removed, ...rest } = save.missions;
    return { ...save, missions: rest };
  }
  if (status === "active") return { ...save, missions: { ...save.missions, [id]: { status: "active", startedAt: Date.now(), progress: initialProgress(def) } } };
  if (status === "ready") return current === "completed" ? save : { ...save, missions: { ...save.missions, [id]: { status: "ready", ...(save.missions[id]?.progress !== undefined ? { progress: save.missions[id].progress } : {}) } } };
  if (current === "completed") return save;
  const ready = { ...save, missions: { ...save.missions, [id]: { status: "ready" as const, ...(save.missions[id]?.progress !== undefined ? { progress: save.missions[id].progress } : {}) } } };
  return def.kind === "talk" ? completeTalk({ ...save, missions: { ...save.missions, [id]: { status: "ready" } } }, id).save : completeMission(ready, id).save;
}

/** Finishes the tutorial (m-00, m-01) so the main missions open. */
export function debugSkipTutorial<T extends WorldSave>(save: T): T {
  let next = save;
  if (next.missions["m-00-hello"]?.status !== "completed") next = completeTalk(next, "m-00-hello").save;
  next = debugSetMission(next, "m-01-mycard", "ready");
  return completeMission(next, "m-01-mycard").save;
}

/** Completes every main mission of this player (and the tutorial before it): ten shards, the whole map restored. */
export function debugCompleteAll<T extends WorldSave>(save: T): T {
  let next = debugSkipTutorial(save);
  for (const def of missionDefsFor(next.player)) {
    if (!def.main || next.missions[def.id]?.status === "completed") continue;
    next = debugSetMission(next, def.id, "ready");
    next = completeMission(next, def.id).save;
  }
  return next;
}

/** Back to the start of the story: no mission progress, no shards, no pickups (position, tutorial guide and the finished prologue stay). */
export function debugResetProgress<T extends WorldSave>(save: T): T {
  const keep = Object.fromEntries(Object.entries(save.flags).filter(([key]) => key === "prologue-done"));
  return { ...save, missions: {}, shards: 0, flags: keep, collected: [], talked: {} };
}

/** Accepts a mission the same way a conversation would (for the panel's quick buttons). */
export const debugAccept = acceptMission;
