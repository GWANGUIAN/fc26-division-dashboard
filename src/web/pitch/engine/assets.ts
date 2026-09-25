// Pitch asset groups (docs/pitch/01 §3-4). Every converted image under src/web/assets/pitch/**.webp is
// picked up by import.meta.glob, so dropping files in needs no code change (A1 fills the real key lists).
// A key with no file is *missing*, not an error: `get()` returns undefined and callers draw a placeholder.

import { PITCH_CHARACTER_IDS } from "../data/characterIds";
import { PITCH_ASSET_META } from "../data/assetMeta.generated";
import { petsFor } from "../data/equipment";

const PORTRAIT_NAMES = ["neutral", "confident", "celebrate", "disappointed"] as const;

const rawUrls = import.meta.glob<string>("../../assets/pitch/**/*.webp", {
  eager: true,
  query: "?url&no-inline",
  import: "default",
});

/** key = path under assets/pitch without extension, e.g. "characters/woowakgood-atlas". */
const URLS: ReadonlyMap<string, string> = new Map(
  Object.entries(rawUrls).map(([path, url]) => [path.replace("../../assets/pitch/", "").replace(/\.webp$/, ""), url]),
);

export type AssetImage = ImageBitmap | HTMLImageElement;

export type AssetGroupName = "boot" | "core" | "select" | "locker" | `char:${string}` | `pets:${string}`;

export interface AssetSpec {
  key: string;
  /** File size, for byte-weighted progress. Used only when every spec of the group has it, else files count equally. */
  bytes?: number;
}

const ids = (prefix: string, names: readonly string[]) => names.map((name) => `${prefix}/${name}`);

/** Bytes come from the converter's generated table, so byte-weighted progress needs no hand-written sizes. */
const spec = (key: string): AssetSpec => ({ key, bytes: PITCH_ASSET_META[key]?.bytes });

// `ui/title-logo` (docs/pitch/12) is optional: it joins the boot group only once the converted file exists.
const OPTIONAL_BOOT_KEYS = ["ui/title-logo"].filter((key) => key in PITCH_ASSET_META);
const BOOT_KEYS = ["keyart/loading-bg", ...ids("ui", ["loader-ball"]), ...OPTIONAL_BOOT_KEYS];

const CORE_KEYS = [
  ...ids("env", ["pitch-bg", "goal-back", "goal-front", "goal-ripple", "ball-spin", "ball-shadow", "ball-trail", "ball-ring", "ball-sparkle", "gate-closed", "gate-open", "gate-glow", "gate-arrow", "gate-plate", "flag", "flag-wave"]),
  ...ids("fx", ["fx-dust", "fx-grass", "fx-star", "fx-speed", "fx-aim-arrow", "fx-reticle", "fx-sweet", "fx-confetti", "fx-firework", "fx-rays", "fx-save-sparkle"]),
  ...ids("ui", ["panel-large", "panel-medium", "dialog-small", "ribbon", "nameplate", "tooltip", "corner-bracket", "btn-dashboard", "btn-change", "btn-pill", "btn-square"]),
  ...ids("ui", ["scoreboard", "aim-bar", "power-bar", "fill-green", "fill-gold", "fill-red", "sweet-spot", "aim-cursor", "style-frame", "style-fill", "pip-lit", "pip-unlit"]),
  ...ids("ui", ["key-up", "key-down", "key-arrow-up", "key-arrow-down", "key-arrow-left", "key-arrow-right", "key-space-up", "key-space-down", "key-shift", "prompt-bubble", "key-glow"]),
  ...ids("ui", ["banner-goal", "burst-goal", "banner-save", "burst-save", "banner-post", "burst-post", "banner-miss", "burst-miss", "banner-style", "star-style", "banner-perfect", "ring-perfect"]),
  ...ids("ui", ["icon-sound-on", "icon-sound-off", "icon-music-on", "icon-music-off", "icon-close", "icon-back", "icon-gear", "icon-lock"]),
  "characters/keeper-ai-atlas",
  // wearable items (docs/pitch/13): 4 sheets, ~50KB; drawn only when a loadout uses them
  ...ids("equipment", ["acc-hat-a", "acc-hat-b", "acc-face-a", "acc-back-a"]),
];

const SELECT_KEYS = [
  "keyart/select-bg",
  ...ids("ui", ["card-normal", "card-hover", "card-selected", "tag-current", "arrow-left", "arrow-left-pressed", "arrow-right", "arrow-right-pressed", "name-plate", "pos-badge", "confirm", "confirm-pressed", "btn-return"]),
  ...PITCH_CHARACTER_IDS.flatMap((id) => [`characters/${id}-hero`, `portraits/${id}-neutral`, `portraits/${id}-confident`]),
];

// Inventory UI art (docs/pitch/14 #I23-#I30) is optional like the title logo: it joins the locker group once converted.
const INVENTORY_KEYS = [
  ...ids("ui", ["inv-frame", "inv-preview-stage", "inv-tab-hat", "inv-tab-face", "inv-tab-back", "inv-tab-pet", "inv-slot", "inv-btn", "inv-arrow-left", "inv-arrow-right", "inv-infocard", "inv-badge-equipped", "inv-badge-exclusive", "inv-badge-new", "inv-badge-locked"]),
  "fx/fx-equip-sparkle",
].filter((key) => key in PITCH_ASSET_META);

const LOCKER_KEYS = [
  ...ids("env", ["locker-bg", "terminal-off", "terminal-idle", "terminal-active", "locker-unit", "locker-unit-open", "bench", "whiteboard", "cooler", "kitbag", "bootrack"]),
  ...ids("ui", ["hex-bg", "hex-frame", "hex-fill", "node-normal", "node-hover", "node-selected", "axis-plate", "detail-panel", "coming-soon", "terminal-frame", "scan-line", "padlock"]),
  ...ids("ui", ["icon-hexagon", "icon-question", "icon-locker"]),
  ...INVENTORY_KEYS,
];

/**
 * Group → files (docs/pitch/01 §3-4). Keys are paths under assets/pitch without ".webp". The selected character's
 * `char:<id>` group is loaded on top of `core`. A key with no file yet is reported as `missing`, never an error.
 * `boot` must stay small and complete: a failed boot file sends PitchEntry back to the dashboard.
 */
export const ASSET_GROUPS: Readonly<Record<"boot" | "core" | "select" | "locker", readonly AssetSpec[]>> = {
  boot: BOOT_KEYS.map(spec),
  core: CORE_KEYS.map(spec),
  select: SELECT_KEYS.map(spec),
  locker: LOCKER_KEYS.map(spec),
};

/** `char:<id>` = the atlas + the four portraits of one field character; `pets:<id>` = its wearable pets. */
export function groupSpecs(group: AssetGroupName, groups: Readonly<Record<string, readonly AssetSpec[]>> = ASSET_GROUPS): readonly AssetSpec[] {
  if (group.startsWith("char:")) {
    const id = group.slice("char:".length);
    return [`characters/${id}-atlas`, ...PORTRAIT_NAMES.map((name) => `portraits/${id}-${name}`)].map(spec);
  }
  // `pets:<id>` = every pet character <id> may wear (docs/pitch/13 §2), loaded when the inventory opens and for the equipped pet
  if (group.startsWith("pets:")) return petsFor(group.slice("pets:".length)).map((pet) => spec(`pets/pet-${pet.id}`));
  return groups[group] ?? [];
}

export function getPitchAssetUrl(key: string): string | undefined {
  return URLS.get(key);
}

export interface LoadGroupOptions {
  onProgress?: (progress: number) => void;
  /** Resolve no earlier than this many ms after starting (flicker guard; 600 for the loading screen). */
  minMs?: number;
}

export interface LoadGroupResult {
  loaded: string[];
  /** Files that exist but failed to load (they stay undefined → placeholders). */
  failed: string[];
  /** Keys with no file at all. */
  missing: string[];
}

export interface PitchAssets {
  get(key: string): AssetImage | undefined;
  has(key: string): boolean;
  loadGroup(group: AssetGroupName, options?: LoadGroupOptions): Promise<LoadGroupResult>;
  /** Frees the decoded bitmaps of a group (locker/select/previous character). */
  release(group: AssetGroupName): void;
  dispose(): void;
}

export interface AssetStoreDeps {
  urls?: ReadonlyMap<string, string>;
  groups?: Readonly<Record<string, readonly AssetSpec[]>>;
  loadImage?: (url: string) => Promise<AssetImage>;
  now?: () => number;
  wait?: (ms: number) => Promise<void>;
}

/** Bitmap decode off the main thread when supported, otherwise a plain <img>. */
export async function loadImage(url: string): Promise<AssetImage> {
  if (typeof createImageBitmap === "function" && typeof fetch === "function") {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return createImageBitmap(await response.blob());
  }
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image load failed"));
    image.src = url;
  });
}

export function createPitchAssets(deps: AssetStoreDeps = {}): PitchAssets {
  const urls = deps.urls ?? URLS;
  const groups = deps.groups ?? ASSET_GROUPS;
  const load = deps.loadImage ?? loadImage;
  const now = deps.now ?? (() => performance.now());
  const wait = deps.wait ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

  const images = new Map<string, AssetImage>();
  const groupKeys = new Map<AssetGroupName, string[]>();
  let disposed = false;

  const close = (image: AssetImage) => {
    if (typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap) image.close();
  };

  return {
    get: (key) => images.get(key),
    has: (key) => images.has(key),

    async loadGroup(group, options = {}) {
      const startedAt = now();
      const specs = groupSpecs(group, groups);
      const result: LoadGroupResult = { loaded: [], failed: [], missing: [] };
      const present: AssetSpec[] = [];
      for (const spec of specs) {
        if (urls.has(spec.key)) present.push(spec);
        else result.missing.push(spec.key);
      }

      const useBytes = present.length > 0 && present.every((spec) => typeof spec.bytes === "number" && spec.bytes > 0);
      const weightOf = (spec: AssetSpec) => (useBytes ? (spec.bytes as number) : 1);
      const total = present.reduce((sum, spec) => sum + weightOf(spec), 0);
      let done = 0;
      const report = () => options.onProgress?.(total === 0 ? 1 : Math.min(1, done / total));
      report();

      await Promise.all(
        present.map(async (spec) => {
          try {
            if (!images.has(spec.key)) {
              const image = await load(urls.get(spec.key) as string);
              if (disposed) {
                close(image);
                return;
              }
              images.set(spec.key, image);
            }
            result.loaded.push(spec.key);
          } catch (error) {
            console.warn(`[pitch] asset failed: ${spec.key}`, error);
            result.failed.push(spec.key);
          }
          done += weightOf(spec);
          report();
        }),
      );

      groupKeys.set(group, present.map((spec) => spec.key).filter((key) => images.has(key)));
      const remaining = (options.minMs ?? 0) - (now() - startedAt);
      if (remaining > 0) await wait(remaining);
      return result;
    },

    release(group) {
      // a file another loaded group still lists (a portrait is in both `select` and `char:<id>`) stays decoded
      const shared = new Set<string>();
      for (const [name, keys] of groupKeys) if (name !== group) for (const key of keys) shared.add(key);
      for (const key of groupKeys.get(group) ?? []) {
        if (shared.has(key)) continue;
        const image = images.get(key);
        if (image) close(image);
        images.delete(key);
      }
      groupKeys.delete(group);
    },

    dispose() {
      disposed = true;
      for (const image of images.values()) close(image);
      images.clear();
      groupKeys.clear();
    },
  };
}
