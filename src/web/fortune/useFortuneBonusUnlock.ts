import { useEffect, useState, useSyncExternalStore } from "react";
import { FORTUNE_CARDS } from "./fortuneCardData";
import { getFortuneRevealedIds, subscribeFortuneCardRevealed } from "./fortuneCardHistoryStore";

// Same try/catch-localStorage convention as toty-card/useWoowakgoodBonusUnlock.ts.
const UNLOCK_STORAGE_KEY = "fortune-card-woowakgood-bonus-unlocked";

export function hasUnlockedFortuneBonus(): boolean {
  try {
    return localStorage.getItem(UNLOCK_STORAGE_KEY) === "1";
  } catch {
    return false; // re-checked every render anyway, so failing closed is harmless
  }
}

function markBonusUnlocked() {
  try {
    localStorage.setItem(UNLOCK_STORAGE_KEY, "1");
  } catch {
    // ignore storage quota/availability failures (private browsing, etc.)
  }
}

/**
 * Unlocks the hidden 우왁굳 bonus tarot card once every one of the real
 * cards (FORTUNE_CARDS, including players' second/bonus cards like
 * janine95kim2/hachi972/tdnlamuron2) has been revealed at least once —
 * mirrors
 * toty-card/useWoowakgoodBonusUnlock.ts, but simpler: the fortune deck is a
 * fixed static list (not derived from the live roster), so this just checks
 * FORTUNE_CARDS.every(...) against the revealed-id store directly, no
 * streamers prop needed. Fires `onUnlock` once and persists the unlock —
 * a one-way achievement, never re-locks.
 */
export function useFortuneBonusUnlock(onUnlock: () => void): boolean {
  const revealedIds = useSyncExternalStore(
    subscribeFortuneCardRevealed,
    getFortuneRevealedIds,
    getFortuneRevealedIds,
  );
  const [unlocked, setUnlocked] = useState(() => hasUnlockedFortuneBonus());

  useEffect(() => {
    if (unlocked) return;
    if (!FORTUNE_CARDS.every((entry) => revealedIds.has(entry.id))) return;
    markBonusUnlocked();
    setUnlocked(true);
    onUnlock();
  }, [unlocked, revealedIds, onUnlock]);

  return unlocked;
}
