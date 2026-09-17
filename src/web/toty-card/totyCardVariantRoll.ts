// Decides, per streamer, which card art variant (see totyCardAssets.ts's
// TotyCardVariant) a given TOTY 3D card popup open shows — persisted in
// localStorage so the sequence survives across popup opens/sessions. The
// first-ever roll for a streamer is a random pick among whichever variants
// they actually have art for; every roll after that advances to the next
// available variant in the fixed 기본→저퀄리티→고전도트 cycle order
// (wrapping around), so consecutive opens never repeat and step through the
// whole set in order. Tracked independently per streamer id. The viewer can
// still freely switch variants by hand afterward via the select shown above
// a revealed card (TotyCardPopup) — that's a local override for the current
// popup only and doesn't touch this roll/cycle state.

import type { TotyCardVariant } from "./totyCardAssets.js";

const STORAGE_KEY = "toty-card-variant-last";

const VARIANT_ORDER: TotyCardVariant[] = ["normal", "lowq", "retro"];

function loadLastVariants(): Record<string, TotyCardVariant> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, TotyCardVariant>) : {};
  } catch {
    return {};
  }
}

function persist(variants: Record<string, TotyCardVariant>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(variants));
  } catch {
    // ignore storage quota/availability failures (private browsing, etc.)
  }
}

/**
 * Call once per popup open for a streamer, passing every variant they
 * actually have art for (see totyCardAssets.ts's getAvailableTotyCardVariants
 * — always includes at least "normal") — rolls (and persists) this open's
 * variant and returns it. Callers must guard the call itself against React
 * StrictMode's dev-only double-invocation (e.g. a ref checked before
 * calling, same idiom as TotyCardReveal's impactFiredRef) since this both
 * reads AND writes localStorage — calling it twice in a row would silently
 * skip ahead an extra step in the cycle instead of advancing it once.
 */
export function rollTotyCardVariant(streamerId: string, availableVariants: TotyCardVariant[]): TotyCardVariant {
  if (availableVariants.length === 0) return "normal";
  const variants = loadLastVariants();
  const last = variants[streamerId];
  const orderedAvailable = VARIANT_ORDER.filter((variant) => availableVariants.includes(variant));
  let next: TotyCardVariant;
  if (last === undefined || !orderedAvailable.includes(last)) {
    next = orderedAvailable[Math.floor(Math.random() * orderedAvailable.length)];
  } else {
    const lastIndex = orderedAvailable.indexOf(last);
    next = orderedAvailable[(lastIndex + 1) % orderedAvailable.length];
  }
  persist({ ...variants, [streamerId]: next });
  return next;
}
