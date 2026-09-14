// Auto-scans src/web/assets/fortune/ for the "오늘의 운세" tarot art, same
// import.meta.glob convention as totyCardAssets.ts/cardMatchAssets.ts — drop
// a correctly-named file in and it's picked up, no manifest to maintain.
// Unlike TOTY's layered frame/background/character trio, each tarot card
// front is a single flat illustration (see docs/fortune-prompts.md), so
// this file is much flatter: one shared back, one front per player id, and
// a handful of popup-level graphics. Every getter returns undefined when
// the file hasn't been generated yet — callers fall back to a CSS
// placeholder so the feature works end-to-end before any art exists.

const modules = import.meta.glob<string>("../assets/fortune/*.webp", {
  eager: true,
  import: "default",
  query: "?url",
});

function findByFilename(filename: string): string | undefined {
  return Object.entries(modules).find(([path]) => path.endsWith(`/${filename}`))?.[1];
}

const FRONT_SUFFIX = "-fortune-card.webp";
const frontUrls: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  const filename = path.split("/").pop() ?? "";
  if (filename.endsWith(FRONT_SUFFIX)) {
    frontUrls[filename.slice(0, -FRONT_SUFFIX.length)] = url;
  }
}

/** Shared tarot card back — identical for every card in the deck (see
 * docs/fortune-prompts.md), so a viewer can't tell cards apart face-down. */
export function getFortuneCardBackUrl(): string | undefined {
  return findByFilename("fortune-card-back.webp");
}

/** That player's finished tarot-card front illustration, if generated yet. */
export function getFortuneCardFrontUrl(streamerId: string): string | undefined {
  return frontUrls[streamerId];
}

export function getFortunePopupBackdropUrl(): string | undefined {
  return findByFilename("fortune-popup-backdrop.webp");
}

export function getFortunePopupBackdropGlowUrl(): string | undefined {
  return findByFilename("fortune-popup-backdrop-glow.webp");
}

export function getFortuneTitleUrl(): string | undefined {
  return findByFilename("fortune-title.webp");
}

export function getFortuneMascotUrl(): string | undefined {
  return findByFilename("fortune-mascot.webp");
}

export function getFortuneDrawButtonUrl(): string | undefined {
  return findByFilename("fortune-draw-button.webp");
}
