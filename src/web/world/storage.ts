import { getCast, isPlayableCastId } from "./data/worldCast";
import type { CastId, Facing, MissionProgress, MissionStatus, SceneId, WorldSave, WorldSettings } from "./types";

// Three separate keys (docs/world/01 §7): the save can be wiped by "새로 시작" without touching the
// sound settings or the first-visit flag. Every access is wrapped: storage may be missing or full
// (private windows, blocked site data) and the game must still run.
export const WORLD_SAVE_KEY = "fc26-world-save-v1";
export const WORLD_DISCOVERED_KEY = "fc26-world-discovered-v1";
export const WORLD_SETTINGS_KEY = "fc26-world-settings-v1";

/** Bump when the save shape changes and add a step to MIGRATIONS (docs/world/08 §5 #11). */
export const WORLD_SAVE_SCHEMA_VERSION = 1;

const FACINGS: readonly Facing[] = ["down", "up", "left", "right"];
const MISSION_STATUSES: readonly MissionStatus[] = ["locked", "available", "active", "ready", "completed"];
const MAX_SHARDS = 10;

export const DEFAULT_WORLD_SETTINGS: WorldSettings = { bgm: true, bgmVolume: 35, sfx: true, sfxVolume: 55 };

/** Fallback position (the road below the clubhouse, docs/world/03) for a save with no player yet. */
export const DEFAULT_SPAWN = { scene: "overworld" as SceneId, x: 40 * 32 + 16, y: 17 * 32 + 16, facing: "down" as Facing };

/** Set once the prologue cut is over. Only such saves are offered as "이어하기" (S1 sandbox saves lack it). */
export const PROLOGUE_DONE_FLAG = "prologue-done";

/** Every member starts in the doorway of their own house: interior spawn tile (10, 10), facing the room. */
export const HOME_SPAWN_TILE = { x: 10, y: 10 };

export function createDefaultSave(): WorldSave {
  return {
    schemaVersion: WORLD_SAVE_SCHEMA_VERSION,
    player: null,
    scene: DEFAULT_SPAWN.scene,
    x: DEFAULT_SPAWN.x,
    y: DEFAULT_SPAWN.y,
    facing: DEFAULT_SPAWN.facing,
    missions: {},
    shards: 0,
    flags: {},
    collected: [],
    talked: {},
    bests: {},
    daily: { date: "", picks: [], done: [], stamps: [] },
    coachDone: false,
  };
}

/** A fresh game for the chosen member: inside their own house, prologue not yet marked done. */
export function createNewGameSave(player: CastId): WorldSave {
  const home = getCast(player).home ?? "interior:house-janine95kim";
  return {
    ...createDefaultSave(),
    player,
    scene: home as SceneId,
    x: HOME_SPAWN_TILE.x * 32 + 16,
    y: HOME_SPAWN_TILE.y * 32 + 16,
    facing: "up",
  };
}

/** True when the save belongs to a finished-prologue game (S1 saves never do, so they count as a new game). */
export function isContinuableSave(save: WorldSave | null): save is WorldSave {
  return save !== null && save.player !== null && save.flags[PROLOGUE_DONE_FLAG] === true;
}

type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;

/** MIGRATIONS[n] upgrades a version-n save to version n+1. Empty until the first schema change. */
const MIGRATIONS: Record<number, Migration> = {};

export type SaveParseResult =
  | { status: "ok"; save: WorldSave }
  | { status: "migrated"; save: WorldSave }
  | { status: "invalid"; reason: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

function isSceneId(value: unknown): value is SceneId {
  return typeof value === "string" && (value === "overworld" || /^interior:[a-z0-9-]+$/.test(value));
}

function stringArray(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? (value as string[]) : null;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  return isFiniteNumber(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

/**
 * Validates an already JSON-parsed save. Structural problems (wrong version, bad scene/position,
 * malformed missions/daily) reject the whole save so the game starts fresh; harmless optional
 * fields (bests, individual talk counts, unknown flags) drop just the bad entries.
 * `migrations` is injectable for tests.
 */
export function parseWorldSave(
  raw: unknown,
  migrations: Record<number, Migration> = MIGRATIONS,
  currentVersion: number = WORLD_SAVE_SCHEMA_VERSION,
): SaveParseResult {
  if (!isRecord(raw)) return { status: "invalid", reason: "not an object" };
  let version = raw.schemaVersion;
  if (!Number.isInteger(version) || (version as number) < 1) return { status: "invalid", reason: "bad schemaVersion" };
  if ((version as number) > currentVersion) return { status: "invalid", reason: "save is from a newer version" };

  let data: Record<string, unknown> = raw;
  let migrated = false;
  while ((version as number) < currentVersion) {
    const step = migrations[version as number];
    if (!step) return { status: "invalid", reason: `no migration from v${version}` };
    try {
      data = { ...step(data), schemaVersion: (version as number) + 1 };
    } catch {
      return { status: "invalid", reason: `migration from v${version} failed` };
    }
    version = (version as number) + 1;
    migrated = true;
  }

  const defaults = createDefaultSave();

  if (data.player !== null && !isPlayableCastId(data.player)) return { status: "invalid", reason: "bad player" };
  if (!isSceneId(data.scene)) return { status: "invalid", reason: "bad scene" };
  if (!isFiniteNumber(data.x) || !isFiniteNumber(data.y) || data.x < 0 || data.y < 0) return { status: "invalid", reason: "bad position" };
  if (!FACINGS.includes(data.facing as Facing)) return { status: "invalid", reason: "bad facing" };
  if (typeof data.coachDone !== "boolean") return { status: "invalid", reason: "bad coachDone" };

  if (!isRecord(data.missions)) return { status: "invalid", reason: "bad missions" };
  const missions: Record<string, MissionProgress> = {};
  for (const [id, entry] of Object.entries(data.missions)) {
    if (!isRecord(entry) || !MISSION_STATUSES.includes(entry.status as MissionStatus)) return { status: "invalid", reason: `bad mission ${id}` };
    missions[id] = {
      status: entry.status as MissionStatus,
      ...(entry.progress !== undefined ? { progress: entry.progress } : {}),
      ...(isFiniteNumber(entry.startedAt) ? { startedAt: entry.startedAt } : {}),
    };
  }

  if (!Number.isInteger(data.shards) || (data.shards as number) < 0 || (data.shards as number) > MAX_SHARDS) return { status: "invalid", reason: "bad shards" };

  const collected = stringArray(data.collected);
  if (!collected) return { status: "invalid", reason: "bad collected" };

  const flags: Record<string, true> = {};
  if (!isRecord(data.flags)) return { status: "invalid", reason: "bad flags" };
  for (const [key, value] of Object.entries(data.flags)) if (value === true) flags[key] = true;

  const talked: Record<string, number> = {};
  if (isRecord(data.talked)) {
    for (const [key, value] of Object.entries(data.talked)) {
      if (Number.isInteger(value) && (value as number) >= 0) talked[key] = value as number;
    }
  }

  const bests: WorldSave["bests"] = {};
  if (isRecord(data.bests)) {
    for (const key of ["rush", "sum10", "kickups", "freekick", "cardmatch"] as const) {
      const value = data.bests[key];
      if (isFiniteNumber(value) && value >= 0) bests[key] = value;
    }
  }

  if (!isRecord(data.daily)) return { status: "invalid", reason: "bad daily" };
  const picks = stringArray(data.daily.picks);
  const done = stringArray(data.daily.done);
  const stamps = stringArray(data.daily.stamps);
  if (typeof data.daily.date !== "string" || !picks || !done || !stamps) return { status: "invalid", reason: "bad daily" };

  const save: WorldSave = {
    ...defaults,
    schemaVersion: currentVersion,
    player: data.player as WorldSave["player"],
    scene: data.scene,
    x: data.x,
    y: data.y,
    facing: data.facing as Facing,
    missions,
    shards: data.shards as number,
    flags,
    collected,
    talked,
    bests,
    daily: { date: data.daily.date, picks, done, stamps },
    coachDone: data.coachDone,
  };
  return { status: migrated ? "migrated" : "ok", save };
}

/** Parses the raw localStorage string. Anything unreadable becomes "invalid". */
export function parseWorldSaveText(text: string | null): SaveParseResult | null {
  if (text === null) return null;
  try {
    return parseWorldSave(JSON.parse(text));
  } catch {
    return { status: "invalid", reason: "not JSON" };
  }
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore quota / private-browsing errors */
  }
}

/** The stored save, or null when there is none or it failed validation (start a new game). */
export function loadWorldSave(): WorldSave | null {
  const result = parseWorldSaveText(readStorage(WORLD_SAVE_KEY));
  if (!result || result.status === "invalid") return null;
  if (result.status === "migrated") saveWorldSave(result.save);
  return result.save;
}

export function saveWorldSave(save: WorldSave) {
  writeStorage(WORLD_SAVE_KEY, JSON.stringify(save));
}

export function clearWorldSave() {
  try {
    localStorage.removeItem(WORLD_SAVE_KEY);
  } catch {
    /* ignore */
  }
}

export function loadWorldSettings(): WorldSettings {
  const defaults = DEFAULT_WORLD_SETTINGS;
  try {
    const raw = readStorage(WORLD_SETTINGS_KEY);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return { ...defaults };
    return {
      bgm: typeof parsed.bgm === "boolean" ? parsed.bgm : defaults.bgm,
      bgmVolume: clampNumber(parsed.bgmVolume, 0, 100, defaults.bgmVolume),
      sfx: typeof parsed.sfx === "boolean" ? parsed.sfx : defaults.sfx,
      sfxVolume: clampNumber(parsed.sfxVolume, 0, 100, defaults.sfxVolume),
    };
  } catch {
    return { ...defaults };
  }
}

export function saveWorldSettings(settings: WorldSettings) {
  writeStorage(WORLD_SETTINGS_KEY, JSON.stringify(settings));
}

/** True once the player has opened the world (stops the floating button's first-visit glow). */
export function isWorldDiscovered(): boolean {
  return readStorage(WORLD_DISCOVERED_KEY) === "1";
}

export function markWorldDiscovered() {
  writeStorage(WORLD_DISCOVERED_KEY, "1");
}
