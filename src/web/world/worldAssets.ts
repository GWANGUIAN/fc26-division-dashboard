import { OVERWORLD_MAP } from "./data/maps";
import { PROP_DEFS, propAssetKey } from "./data/propDefs";
import { TERRAIN_SHEETS, terrainAssetKey } from "./data/terrainDefs";
import { PLAYABLE_CAST, WORLD_CAST } from "./data/worldCast";
import type { CastId, SceneId } from "./types";

// Every converted image is picked up automatically (import.meta.glob), so dropping new files into
// src/web/assets/world/<category>/ needs no code change. Missing files are never an error: callers
// draw a placeholder when `assets.get(key)` is undefined (docs/world/01 §8).
const rawUrls = import.meta.glob<string>("../assets/world/**/*.webp", {
  eager: true,
  query: "?url&no-inline",
  import: "default",
});

/** key = path under assets/world without extension, e.g. "ui/loading-bg", "characters/janine95kim-atlas". */
const URLS = new Map<string, string>(
  Object.entries(rawUrls).map(([path, url]) => [path.replace("../assets/world/", "").replace(/\.webp$/, ""), url]),
);

export function getWorldAssetUrl(key: string): string | undefined {
  return URLS.get(key);
}

export type AssetGroup = "boot" | "core";

/** Screens shown before a character is chosen: loading art, title art, logo and the button frames. */
const BOOT_KEYS = [
  "ui/loading-bg",
  "ui/loading-bar-frame",
  "ui/title-bg",
  "ui/logo-emblem",
  "ui/title-logo",
  "ui/title-window",
  "ui/title-row-normal",
  "ui/title-row-selected",
  "ui/title-row-pressed",
  "ui/title-divider",
  "ui/cursor",
  "ui/fab-icon",
  "ui/btn-primary-normal",
  "ui/btn-primary-hover",
  "ui/btn-primary-pressed",
  "ui/btn-secondary-normal",
  "ui/btn-secondary-hover",
  "ui/btn-secondary-pressed",
  "ui/select-bg",
  "ui/card-normal",
  "ui/card-hover",
  "ui/card-selected",
  "ui/card-dim",
  "ui/ball-marker",
  ...PLAYABLE_CAST.flatMap((cast) => [`characters/${cast.id}-stand`, `portraits/${cast.id}-neutral`]),
];

/** Frames the in-world DOM UI (dialogue, toasts, coach marks) and the canvas prompt use. */
const WORLD_UI_KEYS = [
  "ui/dialog-frame", "ui/nameplate", "ui/portrait-frame", "ui/choice-normal", "ui/choice-selected", "ui/cursor",
  "ui/next-1", "ui/next-2", "ui/toast-frame", "ui/coach-frame", "ui/tooltip-frame",
];

/** Everything the overworld draws: terrain sheets (lush + withered), and the props and buildings the map uses. */
function overworldKeys(): string[] {
  const keys: string[] = [];
  for (const sheet of TERRAIN_SHEETS) keys.push(terrainAssetKey(sheet, false), terrainAssetKey(sheet, true));
  for (const id of new Set(OVERWORLD_MAP.props.map((prop) => prop.prop))) {
    keys.push(propAssetKey(id));
    if (PROP_DEFS[id]?.withered) keys.push(propAssetKey(id, true));
  }
  for (const building of OVERWORLD_MAP.buildings) keys.push(`buildings/${building.id}`);
  // The ON AIR signs over the member houses (docs/world/15-onair-sign.md).
  keys.push("props/onair-sign-on", "props/onair-sign-off");
  return keys;
}

/** Canvas art of the missions: the markers over the givers, sparkles, pickups, cones and the kick ball (docs/world/03 §7). */
function missionKeys(): string[] {
  const keys = ["fx/mark-new", "fx/mark-progress", "fx/mark-complete", "fx/sparkle-1", "fx/sparkle-2", "fx/sparkle-3", "fx/sparkle-4", "props/ball-standard"];
  for (const object of OVERWORLD_MAP.objects) {
    // Map decorations can be conditionally visible too (for example the Weed Town
    // entrance barricades), so preload them with the mission props rather than
    // allowing the renderer to fall back to its cyan placeholder.
    if (object.type !== "pickup" && object.type !== "hazard" && object.type !== "decor") continue;
    if (object.prop) keys.push(propAssetKey(object.prop));
    if (object.type === "pickup" && object.look === "withered") keys.push(propAssetKey(object.prop, true));
  }
  return keys;
}

/**
 * boot: everything up to the character select. core: what the world itself draws — terrain, props,
 * buildings, every cast atlas, the in-world UI frames and the room the game starts in (the other rooms
 * load lazily behind the door fade, docs/world/01 §8).
 */
export function assetKeysForGroup(group: AssetGroup, player: CastId | null, startScene: SceneId | null = null): string[] {
  if (group === "boot") return BOOT_KEYS;
  const keys = [...overworldKeys(), ...missionKeys(), ...WORLD_UI_KEYS, ...WORLD_CAST.map((cast) => `characters/${cast.id}-atlas`)];
  if (player) keys.push(`characters/${player}-atlas`);
  if (startScene?.startsWith("interior:")) keys.push(`interiors/int-${startScene.slice("interior:".length)}`);
  return keys;
}

export interface LoadReport {
  loaded: number;
  /** Keys with no file in the repo yet (not an error: placeholders are used). */
  missing: string[];
  /** Keys whose file exists but failed to fetch/decode. */
  failed: string[];
}

/** Decoded images by key. Bitmaps are closed by `dispose()` when the overlay unmounts. */
export class WorldAssets {
  private readonly images = new Map<string, ImageBitmap>();

  has(key: string) {
    return this.images.has(key);
  }

  get(key: string): ImageBitmap | undefined {
    return this.images.get(key);
  }

  /**
   * Loads every key that exists, reporting progress as (finished, total). Total counts only keys
   * with a file, so a half-finished art set still reaches 100%. Failures never reject.
   */
  async load(keys: readonly string[], onProgress?: (done: number, total: number) => void, signal?: AbortSignal): Promise<LoadReport> {
    const unique = [...new Set(keys)];
    const report: LoadReport = { loaded: 0, missing: [], failed: [] };
    const known = unique.filter((key) => {
      if (URLS.has(key)) return true;
      report.missing.push(key);
      return false;
    });
    let done = 0;
    onProgress?.(0, known.length);
    await Promise.all(
      known.map(async (key) => {
        if (!this.images.has(key)) {
          try {
            const response = await fetch(URLS.get(key)!, { signal });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const bitmap = await createImageBitmap(await response.blob());
            if (signal?.aborted) bitmap.close();
            else this.images.set(key, bitmap);
          } catch {
            if (!signal?.aborted) report.failed.push(key);
          }
        }
        if (this.images.has(key)) report.loaded++;
        done++;
        onProgress?.(done, known.length);
      }),
    );
    return report;
  }

  dispose() {
    for (const bitmap of this.images.values()) bitmap.close();
    this.images.clear();
  }
}
