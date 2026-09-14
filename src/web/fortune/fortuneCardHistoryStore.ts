// Tracks which tarot cards the viewer has actually revealed (clicked and
// flipped) at least once, persisted in localStorage — same
// tiny-observable-store pattern as toty-card/totyCardRevealedStore.ts, so
// FortunePopup's "뽑았던 카드 보기" button can reactively appear the instant
// a card is revealed without needing the popup to remount. A Set naturally
// dedupes repeat draws of the same card.

const STORAGE_KEY = "fortune-card-revealed-ids";

function loadRevealedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

let revealedIds = loadRevealedIds();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...revealedIds]));
  } catch {
    // ignore storage quota/availability failures (private browsing, etc.)
  }
}

// Stable-reference getter (revealedIds is only ever replaced, never mutated
// in place — see markFortuneCardRevealed) so it doubles as a
// useSyncExternalStore getSnapshot without needing a second observable store.
export function getFortuneRevealedIds(): Set<string> {
  return revealedIds;
}

export function markFortuneCardRevealed(id: string): void {
  if (revealedIds.has(id)) return;
  revealedIds = new Set(revealedIds).add(id);
  persist();
  for (const listener of listeners) listener();
}

export function subscribeFortuneCardRevealed(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
