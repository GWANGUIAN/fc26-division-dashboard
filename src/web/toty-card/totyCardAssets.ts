// Auto-detects which streamers have a full TOTY 3D card art set by scanning
// src/web/assets/toty-cards/ at build time — dropping in a new streamer's
// <id>-frame.webp / -background.webp / -character.webp trio is enough to
// make their "3D 카드 보기" button appear, no manifest to hand-maintain.

const modules = import.meta.glob<string>("../assets/toty-cards/*.webp", {
  eager: true,
  import: "default",
  query: "?url",
});

export type TotyCardAssets = {
  frame: string;
  background: string;
  character: string;
};

const PARTS = ["frame", "background", "character"] as const;

const partial: Record<string, Partial<TotyCardAssets>> = {};

for (const [path, url] of Object.entries(modules)) {
  const filename = path.split("/").pop() ?? "";
  const match = /^(.+)-(frame|background|character)\.webp$/.exec(filename);
  if (!match) continue;
  const [, id, part] = match;
  (partial[id] ??= {})[part as (typeof PARTS)[number]] = url;
}

const ASSETS: Record<string, TotyCardAssets> = {};
for (const [id, parts] of Object.entries(partial)) {
  if (parts.frame && parts.background && parts.character) {
    ASSETS[id] = parts as TotyCardAssets;
  }
}

export function hasTotyCard(streamerId: string): boolean {
  return streamerId in ASSETS;
}

export function getTotyCardAssets(streamerId: string): TotyCardAssets | undefined {
  return ASSETS[streamerId];
}

// Card art is a few hundred KB to ~1MB per file — fine once cached, but
// fetching all three cold on click is what made the popup feel slow to open.
// Callers kick this off early (button hover/focus, detail modal mount) so
// the browser has a head start; the Set just avoids spawning redundant
// Image() objects on repeat hovers, the HTTP cache handles the rest.
const preloadedUrls = new Set<string>();

export function preloadTotyCardAssets(assets: TotyCardAssets): void {
  for (const url of [assets.frame, assets.background, assets.character]) {
    if (preloadedUrls.has(url)) continue;
    preloadedUrls.add(url);
    const img = new Image();
    img.src = url;
  }
}

// Shared full-screen popup backdrop (same image behind every player's card —
// see docs/toty-card-prompts.md). Optional: until it's dropped in as
// popup-backdrop.webp, TotyCardPopup falls back to a plain CSS gradient.
const POPUP_BACKDROP_FILENAME = "popup-backdrop.webp";
const popupBackdropEntry = Object.entries(modules).find(([path]) =>
  path.endsWith(`/${POPUP_BACKDROP_FILENAME}`),
);

export function getPopupBackdropUrl(): string | undefined {
  return popupBackdropEntry?.[1];
}

// Pre-rendered animated WebP loop per player (background/character motion +
// a simulated hover sweep baked in) — offline/opt-in, produced by
// scripts/generate-toty-preview.mjs, not required for the button/popup to
// work. Named "<id>-preview.webp" so it doesn't collide with the
// frame/background/character regex above.
const PREVIEW_SUFFIX = "-preview.webp";
const previewUrls: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  const filename = path.split("/").pop() ?? "";
  if (filename.endsWith(PREVIEW_SUFFIX)) {
    previewUrls[filename.slice(0, -PREVIEW_SUFFIX.length)] = url;
  }
}

export function getTotyCardPreviewUrl(streamerId: string): string | undefined {
  return previewUrls[streamerId];
}
