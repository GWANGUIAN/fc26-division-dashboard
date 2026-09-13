import { useEffect, useState, useSyncExternalStore } from "react";
import type { StreamerRecord } from "../../shared/model.js";
import { hasTotyCard } from "./totyCardAssets.js";
import { getRevealedIds, subscribeTotyCardRevealed } from "./totyCardRevealedStore.js";
import { WOOWAKGOOD_ID } from "./woowakgoodBonusCard.js";

// Same try/catch-localStorage convention as storage.ts's
// hasDiscoveredPhotoBooth/markPhotoBoothDiscovered, but kept local to this
// feature (like totyCardRevealedStore.ts's own persistence) rather than
// folded into the shared storage.ts grab-bag.
const UNLOCK_STORAGE_KEY = "toty-card-woowakgood-bonus-unlocked";

function hasUnlockedBonus(): boolean {
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
 * Unlocks the hidden 우왁굳 bonus card once every real player's card (i.e.
 * every id with a full art set — see totyCardAssets.ts's hasTotyCard) has
 * been revealed at least once. Fires `showToast` and persists the unlock
 * the first time this happens; once unlocked it stays unlocked (a later
 * roster addition or a stale/cleared revealed-ids entry never re-locks it —
 * this is a one-way achievement, not a live "still complete?" check).
 *
 * Also gates on hasTotyCard(WOOWAKGOOD_ID) itself, so the whole feature
 * stays inert — no button, no toast — until the bonus card's own
 * frame/background/character art actually exists, exactly like every other
 * per-id asset in this system.
 */
export function useWoowakgoodBonusUnlock(
  streamers: StreamerRecord[] | undefined,
  showToast: (message: string) => void,
): boolean {
  const revealedIds = useSyncExternalStore(
    subscribeTotyCardRevealed,
    getRevealedIds,
    getRevealedIds,
  );
  const [unlocked, setUnlocked] = useState(() => hasUnlockedBonus());

  useEffect(() => {
    if (unlocked) return;
    if (!hasTotyCard(WOOWAKGOOD_ID)) return;
    const realCardIds = (streamers ?? [])
      .filter((streamer) => hasTotyCard(streamer.id))
      .map((streamer) => streamer.id);
    // Guards against [].every() being vacuously true while the roster is
    // still loading (or before any real card art has been added at all).
    if (realCardIds.length === 0) return;
    if (!realCardIds.every((id) => revealedIds.has(id))) return;
    markBonusUnlocked();
    setUnlocked(true);
    showToast("🎉 모든 3D 카드를 확인했어요! 숨겨진 카드가 나타났습니다");
  }, [unlocked, streamers, revealedIds, showToast]);

  return unlocked;
}
