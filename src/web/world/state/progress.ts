import { MEMBER_ZONE, missionDefsFor, totalShardsFor } from "../data/missionDefs";
import type { WorldSave } from "../types";
import { missionStatus, type MissionSave } from "./missions";

// Colour restoration (docs/world/03 §3): the map goes from withered to lush as grass shards are won.
// A district's value is  restore(z) = 0.6·s + 0.4·zoneDone(z)  where s = shards/total is the global progress
// and zoneDone(z) the share of that district's member missions already completed, so finishing a member's
// mission greens their own neighbourhood a little faster than the rest. Districts without a member mission
// (centre, shops) follow s. The Weeder district stays withered until the ending restores it.

const GLOBAL_WEIGHT = 0.6;
const LOCAL_WEIGHT = 0.4;

/** Flag set by the ending cut (S4) that turns the Weeder district green. */
export const WEED_RESTORED_FLAG = "weed-restored";
export const WEED_ZONE_ID = "z-weed";

export type ProgressSave = MissionSave & Pick<WorldSave, "flags">;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Global progress 0–1: shards won out of the shards this player can earn. */
export function globalRestore(save: Pick<WorldSave, "shards" | "player">): number {
  const total = totalShardsFor(save.player);
  return total === 0 ? 0 : clamp01(save.shards / total);
}

/** Share of a district's (enabled) main missions that are completed, or null when it has none. */
export function zoneDone(zoneId: string, save: MissionSave): number | null {
  const mains = missionDefsFor(save.player).filter((def) => def.main && MEMBER_ZONE[def.giver] === zoneId);
  if (mains.length === 0) return null;
  return mains.filter((def) => missionStatus(save, def) === "completed").length / mains.length;
}

export function restoreOfZoneId(zoneId: string, save: ProgressSave): number {
  if (zoneId === WEED_ZONE_ID) return save.flags[WEED_RESTORED_FLAG] === true ? 1 : 0;
  const s = globalRestore(save);
  const done = zoneDone(zoneId, save);
  return clamp01(done === null ? s : GLOBAL_WEIGHT * s + LOCAL_WEIGHT * done);
}

/** Target restore values for a scene's zones, in zone-index order (what the ground renderer asks for). */
export function restoreForZones(zoneIds: readonly string[], save: ProgressSave): number[] {
  return zoneIds.map((id) => restoreOfZoneId(id, save));
}
