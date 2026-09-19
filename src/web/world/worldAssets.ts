import type { CastId } from "./types";

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
  "ui/fab-icon",
  "ui/btn-primary-normal",
  "ui/btn-primary-hover",
  "ui/btn-primary-pressed",
  "ui/btn-secondary-normal",
  "ui/btn-secondary-hover",
  "ui/btn-secondary-pressed",
];

/** Props used by the S1 sandbox map (replaced by the real map's prop list in S2). */
const SANDBOX_PROP_KEYS = ["props/tree-oak", "props/rock-large", "props/boulder-mossy", "props/bench-h", "props/fence-wood-h", "props/log"];

export function assetKeysForGroup(group: AssetGroup, player: CastId | null): string[] {
  if (group === "boot") return BOOT_KEYS;
  return ["terrain/core", ...(player ? [`characters/${player}-atlas`] : []), ...SANDBOX_PROP_KEYS];
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
