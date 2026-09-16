// Decides, per streamer, whether a given TOTY 3D card popup open shows the
// "저퀄리티" easter egg (see totyCardAssets.ts's getLowQualityTotyCardAssets)
// or the real card — persisted in localStorage so the sequence survives
// across popup opens/sessions. The first-ever roll for a streamer is 50/50
// random; every roll after that alternates (never shows the same variant
// twice in a row for that streamer). Tracked independently per streamer id.

const STORAGE_KEY = "toty-card-lowq-last";

type Variant = "lowq" | "normal";

function loadLastVariants(): Record<string, Variant> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Variant>) : {};
  } catch {
    return {};
  }
}

function persist(variants: Record<string, Variant>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(variants));
  } catch {
    // ignore storage quota/availability failures (private browsing, etc.)
  }
}

/**
 * Call once per popup open for a streamer known to have a lowq trio — rolls
 * (and persists) this open's variant and returns whether it's the lowq one.
 * Callers must guard the call itself against React StrictMode's dev-only
 * double-invocation (e.g. a ref checked before calling, same idiom as
 * TotyCardReveal's impactFiredRef) since this both reads AND writes
 * localStorage — calling it twice in a row would silently cancel the
 * alternation back to its prior value instead of advancing it.
 */
export function rollTotyCardLowQuality(streamerId: string): boolean {
  const variants = loadLastVariants();
  const last = variants[streamerId];
  const next: Variant = last === undefined ? (Math.random() < 0.5 ? "lowq" : "normal") : last === "lowq" ? "normal" : "lowq";
  persist({ ...variants, [streamerId]: next });
  return next === "lowq";
}
