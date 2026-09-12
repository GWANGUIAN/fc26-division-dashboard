// Auto-detects which streamers have a full TOTY 3D card art set by scanning
// src/web/assets/toty-cards/ at build time — dropping in a new streamer's
// <id>-frame.webp / -background.webp / -character.webp trio is enough to
// make their "3D 카드 보기" button appear, no manifest to hand-maintain.
// Includes .gif alongside .webp for the optional <id>-preview.gif export.

const modules = import.meta.glob<string>("../assets/toty-cards/*.{webp,gif}", {
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

export function preloadTotyCardAssets(assets: TotyCardAssets, streamerId: string): void {
  const cardBackUrl = getCardBackUrl(streamerId);
  const backgroundGlowUrl = getBackgroundGlowUrl(streamerId);
  const popupBackdropUrl = getPopupBackdropUrl(streamerId);
  const popupBackdropGlowUrl = getPopupBackdropGlowUrl(streamerId);
  const urls = [assets.frame, assets.background, assets.character];
  if (cardBackUrl) urls.push(cardBackUrl);
  if (backgroundGlowUrl) urls.push(backgroundGlowUrl);
  if (popupBackdropUrl) urls.push(popupBackdropUrl);
  if (popupBackdropGlowUrl) urls.push(popupBackdropGlowUrl);
  for (const url of urls) {
    if (preloadedUrls.has(url)) continue;
    preloadedUrls.add(url);
    const img = new Image();
    img.src = url;
  }
}

// Full-screen popup backdrop — per-player (<id>-popup-backdrop.webp,
// themed to that card's motif) when available, otherwise the original
// shared popup-backdrop.webp, otherwise TotyCardPopup falls back to a plain
// CSS gradient. See docs/toty-card-prompts.md.
const POPUP_BACKDROP_FILENAME = "popup-backdrop.webp";
const popupBackdropEntry = Object.entries(modules).find(([path]) =>
  path.endsWith(`/${POPUP_BACKDROP_FILENAME}`),
);
const POPUP_BACKDROP_SUFFIX = "-popup-backdrop.webp";
const popupBackdropUrls: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  const filename = path.split("/").pop() ?? "";
  if (filename.endsWith(POPUP_BACKDROP_SUFFIX)) {
    popupBackdropUrls[filename.slice(0, -POPUP_BACKDROP_SUFFIX.length)] = url;
  }
}

export function getPopupBackdropUrl(streamerId?: string): string | undefined {
  return (streamerId && popupBackdropUrls[streamerId]) ?? popupBackdropEntry?.[1];
}

// Per-player ambient light/particle overlay for the popup backdrop above —
// same idea as getBackgroundGlowUrl below, but for the full-screen backdrop
// rather than the card itself. Optional; no shared fallback (a mismatched
// player's light effect over a different backdrop wouldn't make sense).
const POPUP_BACKDROP_GLOW_SUFFIX = "-popup-backdrop-glow.webp";
const popupBackdropGlowUrls: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  const filename = path.split("/").pop() ?? "";
  if (filename.endsWith(POPUP_BACKDROP_GLOW_SUFFIX)) {
    popupBackdropGlowUrls[filename.slice(0, -POPUP_BACKDROP_GLOW_SUFFIX.length)] = url;
  }
}

export function getPopupBackdropGlowUrl(streamerId: string): string | undefined {
  return popupBackdropGlowUrls[streamerId];
}

// Per-player "mystery" card-back art shown mid-flip by TotyCardReveal before
// the real card is revealed — same naming convention as the
// frame/background/character trio above (see docs/toty-card-prompts.md), but
// collected separately since a player can have a full card without one yet.
// Optional: without it, the reveal falls back to a plain "?" placeholder.
const CARD_BACK_SUFFIX = "-card-back.webp";
const cardBackUrls: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  const filename = path.split("/").pop() ?? "";
  if (filename.endsWith(CARD_BACK_SUFFIX)) {
    cardBackUrls[filename.slice(0, -CARD_BACK_SUFFIX.length)] = url;
  }
}

export function getCardBackUrl(streamerId: string): string | undefined {
  return cardBackUrls[streamerId];
}

// Per-player ambient light/particle overlay (embers, sparks, motes, etc. —
// matching that card's motif) layered over the background/character in
// TotyCardVisual and animated independently of the mouse via CSS, so the
// card doesn't sit completely static while idle — see
// docs/toty-card-prompts.md. Collected separately for the same reason as
// the card-back art above: optional, doesn't gate the "3D 카드 보기" button.
const BACKGROUND_GLOW_SUFFIX = "-background-glow.webp";
const backgroundGlowUrls: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  const filename = path.split("/").pop() ?? "";
  if (filename.endsWith(BACKGROUND_GLOW_SUFFIX)) {
    backgroundGlowUrls[filename.slice(0, -BACKGROUND_GLOW_SUFFIX.length)] = url;
  }
}

export function getBackgroundGlowUrl(streamerId: string): string | undefined {
  return backgroundGlowUrls[streamerId];
}

// Pre-rendered animated GIF loop per player (background/character motion +
// a simulated hover sweep baked in, no rim glow — see TotyCardVisual's
// showGlow doc comment) — offline/opt-in, produced by
// scripts/generate-toty-preview.mjs, not required for the button/popup to
// work. Named "<id>-preview.gif" so it doesn't collide with the
// frame/background/character regex above.
const PREVIEW_SUFFIX = "-preview.gif";
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
