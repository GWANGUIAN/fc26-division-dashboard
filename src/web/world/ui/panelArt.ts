import type { CSSProperties } from "react";
import { getWorldAssetUrl } from "../worldAssets";

/**
 * `--name: url(...)` custom properties for the frames of a panel, one per asset key that exists. The art is
 * optional everywhere (docs/world/17): `has` says which names were found, so a piece falls back to plain CSS
 * when its file is not in the repo yet.
 */
export function panelArt<K extends string>(frames: Record<K, string>): { style: CSSProperties; has: Record<K, boolean> } {
  const style: Record<string, string> = {};
  const has = {} as Record<K, boolean>;
  for (const name of Object.keys(frames) as K[]) {
    const url = getWorldAssetUrl(frames[name]);
    has[name] = url !== undefined;
    if (url) style[`--${name}`] = `url(${url})`;
  }
  return { style: style as CSSProperties, has };
}

/** The first of these `ui/…` (or other) asset keys that has a file, so a new icon can stand in for an older one while its art is missing. */
export function firstAsset(...keys: string[]): string | undefined {
  for (const key of keys) {
    const url = getWorldAssetUrl(key);
    if (url) return url;
  }
  return undefined;
}
