import {
  BADGES, badgeFlag, getMissionDef, isMissionEnabled, missionDefsFor, totalShardsFor, type BadgeDef, type MissionDef,
} from "../data/missionDefs";
import type { CastId, MissionStatus, WorldSave } from "../types";
import { asProgress, describeProgress, evaluateEvent, initialProgress, type MissionEvent } from "./missionEval";

// Mission state machine (docs/world/01 §7, 02 §5): locked → available → active → ready → completed.
// `locked` and `available` are derived from the requirements and never stored; `active`, `ready` and
// `completed` live in `WorldSave.missions`. Every function is pure and returns a new save.

/** The slice of the save the machine reads. */
export type MissionSave = Pick<WorldSave, "player" | "missions" | "shards" | "flags" | "collected">;

export function requirementsMet(def: MissionDef, save: MissionSave): boolean {
  const donePrereqs = (def.requires ?? []).every((id) => {
    const prereq = getMissionDef(id);
    return prereq !== undefined && missionStatus(save, prereq) === "completed";
  });
  return donePrereqs && (def.requiresFlags ?? []).every((flag) => save.flags[flag] === true);
}

export function missionStatus(save: MissionSave, def: MissionDef): MissionStatus {
  if (!isMissionEnabled(def, save.player)) return "locked";
  const stored = save.missions[def.id]?.status;
  if (stored === "active" || stored === "ready" || stored === "completed") return stored;
  return requirementsMet(def, save) ? "available" : "locked";
}

export const missionStatusById = (save: MissionSave, id: string): MissionStatus => {
  const def = getMissionDef(id);
  return def ? missionStatus(save, def) : "locked";
};

const withMission = <T extends MissionSave>(save: T, id: string, entry: WorldSave["missions"][string]): T => ({ ...save, missions: { ...save.missions, [id]: entry } });

/** available → active. The player said yes to the offer. No effect in any other state. */
export function acceptMission<T extends MissionSave>(save: T, id: string, now = Date.now()): T {
  const def = getMissionDef(id);
  if (!def || missionStatus(save, def) !== "available") return save;
  return withMission(save, id, { status: "active", startedAt: now, progress: initialProgress(def) });
}

/** A talk mission is a single conversation: it completes as soon as that conversation ends. */
export function completeTalk<T extends MissionSave>(save: T, id: string): { save: T; reward: RewardResult | null } {
  const def = getMissionDef(id);
  if (!def || def.kind !== "talk" || missionStatus(save, def) !== "available") return { save, reward: null };
  return completeMission(withMission(save, id, { status: "ready" }), id);
}

export interface MissionChange {
  id: string;
  from: MissionStatus;
  to: MissionStatus;
}

/**
 * Feeds one world event to every active mission. A pickup is recorded in `collected` first (so the
 * next event sees it), then each mission that reacts updates its progress and may become `ready`.
 */
export function applyMissionEvent<T extends MissionSave>(save: T, event: MissionEvent): { save: T; changes: MissionChange[] } {
  let next = save;
  if (event.type === "pickup" && !save.collected.includes(event.id)) next = { ...next, collected: [...next.collected, event.id] };
  const changes: MissionChange[] = [];
  for (const def of missionDefsFor(save.player)) {
    const entry = next.missions[def.id];
    if (missionStatus(next, def) !== "active") continue;
    const result = evaluateEvent(def, entry?.progress, event, { player: next.player, collected: next.collected });
    if (!result) continue;
    const status: MissionStatus = result.ready ? "ready" : "active";
    next = withMission(next, def.id, { ...entry, status, progress: result.progress });
    if (result.ready) changes.push({ id: def.id, from: "active", to: "ready" });
  }
  return { save: next, changes };
}

/** A fresh attempt of an active mission (a timed delivery started again): progress goes back to the start, the best result stays. */
export function restartMission<T extends MissionSave>(save: T, id: string): T {
  const def = getMissionDef(id);
  const entry = save.missions[id];
  if (!def || !entry || entry.status !== "active") return save;
  const best = asProgress(entry.progress).best;
  return withMission(save, id, { ...entry, progress: { ...initialProgress(def), ...(best !== undefined ? { best } : {}) } });
}

export interface RewardResult {
  mission: MissionDef;
  /** The shard was granted (main mission, below the cap). */
  shard: boolean;
  shardsAfter: number;
  badges: BadgeDef[];
  flags: string[];
}

/** ready → completed with the reward, exactly once. */
export function completeMission<T extends MissionSave>(save: T, id: string): { save: T; reward: RewardResult | null } {
  const def = getMissionDef(id);
  if (!def || missionStatus(save, def) !== "ready") return { save, reward: null };
  const entry = save.missions[id];
  let next = withMission(save, id, { ...entry, status: "completed" });

  const cap = totalShardsFor(save.player);
  const wantsShard = def.main && (def.reward.shard ?? 0) > 0;
  const shard = wantsShard && next.shards < cap;
  if (shard) next = { ...next, shards: Math.min(cap, next.shards + (def.reward.shard ?? 0)) };

  const badges: BadgeDef[] = [];
  const grant = (badgeId: string | undefined) => {
    if (!badgeId || next.flags[badgeFlag(badgeId)]) return;
    next = { ...next, flags: { ...next.flags, [badgeFlag(badgeId)]: true } };
    const badge = BADGES[badgeId];
    if (badge) badges.push(badge);
  };
  grant(def.reward.badge);
  if (shard && next.shards >= 5) grant("shard-5");
  if (shard && next.shards >= 10) grant("shard-10");

  const flags = def.reward.flags ?? [];
  if (flags.length > 0) next = { ...next, flags: { ...next.flags, ...Object.fromEntries(flags.map((flag) => [flag, true as const])) } };
  return { save: next, reward: { mission: def, shard, shardsAfter: next.shards, badges, flags: [...flags] } };
}

// ── markers (docs/world/02 §5) ────────────────────────────────────────────────────────────

export type MarkerKind = "new" | "progress" | "ready";

/** The marker above a giver's head: `!` (ready to report) beats `?` (new mission) beats `…` (in progress). */
export function markerFor(save: MissionSave, cast: CastId): MarkerKind | null {
  let marker: MarkerKind | null = null;
  for (const def of missionDefsFor(save.player)) {
    if (def.giver !== cast) continue;
    const status = missionStatus(save, def);
    if (status === "ready") return "ready";
    if (status === "available") marker = "new";
    else if (status === "active" && marker === null) marker = "progress";
  }
  return marker;
}

// ── views for the log, the tracker and the dialogue ───────────────────────────────────────

export interface MissionView {
  def: MissionDef;
  status: MissionStatus;
  progressText: string;
}

/** Every mission the player has met (anything but `locked`), in the order of missionDefs. */
export function missionViews(save: MissionSave): MissionView[] {
  return missionDefsFor(save.player)
    .map((def) => ({ def, status: missionStatus(save, def), progressText: describeProgress(def, save.missions[def.id]?.progress, save.collected) }))
    .filter((view) => view.status !== "locked");
}

/** The mission shown in the tracker unless the player picked another: ready first, then active (main before side), then new. */
export function defaultTracked(views: readonly MissionView[]): MissionView | null {
  const pick = (status: MissionStatus, main?: boolean) => views.find((view) => view.status === status && (main === undefined || view.def.main === main));
  return pick("ready") ?? pick("active", true) ?? pick("active") ?? pick("available", true) ?? pick("available") ?? null;
}

/** Main missions still to do / done, for the shard gauge and tests. */
export function mainMissionCounts(save: MissionSave): { done: number; total: number } {
  const mains = missionDefsFor(save.player).filter((def) => def.main);
  return { done: mains.filter((def) => missionStatus(save, def) === "completed").length, total: mains.length };
}
