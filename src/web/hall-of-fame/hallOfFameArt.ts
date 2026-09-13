// Auto-detects which trophy categories have AI-generated medallion art by
// scanning src/web/assets/hall-of-fame/ at build time — dropping in a
// correctly-named <category>-emblem.webp is enough, no manifest to
// hand-maintain. Same convention as toty-card/totyCardAssets.ts, but keyed
// by trophy category (see src/shared/trophy.ts's TrophyBadge["key"]) instead
// of streamer id, and with only one required layer per category (there's no
// per-winner character art — the winner's own avatar is composited by
// HallOfFameCardVisual at runtime).

const modules = import.meta.glob<string>("../assets/hall-of-fame/*.webp", {
  eager: true,
  import: "default",
  query: "?url",
});

const EMBLEM_SUFFIX = "-emblem.webp";
const emblemUrls: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  const filename = path.split("/").pop() ?? "";
  if (filename.endsWith(EMBLEM_SUFFIX)) {
    emblemUrls[filename.slice(0, -EMBLEM_SUFFIX.length)] = url;
  }
}

export function getHallOfFameEmblemUrl(categoryKey: string): string | undefined {
  return emblemUrls[categoryKey];
}

// Optional ambient particle/light overlay matching that category's motif
// (embers for hard-worker, spark trail for daily-promotion, etc.) — same
// "doesn't gate rendering" convention as TOTY's -background-glow layer.
const GLOW_SUFFIX = "-emblem-glow.webp";
const glowUrls: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  const filename = path.split("/").pop() ?? "";
  if (filename.endsWith(GLOW_SUFFIX)) {
    glowUrls[filename.slice(0, -GLOW_SUFFIX.length)] = url;
  }
}

export function getHallOfFameGlowUrl(categoryKey: string): string | undefined {
  return glowUrls[categoryKey];
}

// Full-bleed atmospheric backdrop sitting behind that category's heading +
// card grid (see TrophyModal.tsx) — same idea as toty-card's per-player
// popup-backdrop, but per trophy category instead of per streamer, and with
// no shared fallback (a section without one yet just keeps its current
// plain gradient background). Optional: never gates the section rendering.
const BACKDROP_SUFFIX = "-backdrop.webp";
const backdropUrls: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  const filename = path.split("/").pop() ?? "";
  if (filename.endsWith(BACKDROP_SUFFIX)) {
    backdropUrls[filename.slice(0, -BACKDROP_SUFFIX.length)] = url;
  }
}

export function getHallOfFameBackdropUrl(categoryKey: string): string | undefined {
  return backdropUrls[categoryKey];
}

// Per-category ambient light/particle overlay for the section backdrop
// above (embers, sparks, motes, etc. — matching that category's motif),
// drifting on its own via CSS independent of the mouse. Optional, same
// "doesn't gate rendering" convention as everything else here.
const BACKDROP_GLOW_SUFFIX = "-backdrop-glow.webp";
const backdropGlowUrls: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  const filename = path.split("/").pop() ?? "";
  if (filename.endsWith(BACKDROP_GLOW_SUFFIX)) {
    backdropGlowUrls[filename.slice(0, -BACKDROP_GLOW_SUFFIX.length)] = url;
  }
}

export function getHallOfFameBackdropGlowUrl(categoryKey: string): string | undefined {
  return backdropGlowUrls[categoryKey];
}
