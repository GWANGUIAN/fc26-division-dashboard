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

// Exported so other features can gate on the same one-way achievement without duplicating it —
// e.g. the card-match minigame includes 우왁굳 in its candidate pool once this is true, rather than
// tracking its own separate "unlocked" condition.
export function hasUnlockedWoowakgoodBonus(): boolean {
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
 * been revealed at least once. Fires `onUnlock` and persists the unlock the
 * first time this happens; once unlocked it stays unlocked (a later roster
 * addition or a stale/cleared revealed-ids entry never re-locks it — this
 * is a one-way achievement, not a live "still complete?" check).
 *
 * Also gates on hasTotyCard(WOOWAKGOOD_ID) itself, so the whole feature
 * stays inert — no button, no announcement — until the bonus card's own
 * frame/background/character art actually exists, exactly like every other
 * per-id asset in this system.
 *
 * `onUnlock` takes no message (unlike the shared useToast's showToast) — the
 * caller pairs this with <WoowakgoodBonusAnnounce>, a bespoke banner rather
 * than the generic small `.toast` used everywhere else, so this achievement
 * gets to be bigger/longer-lived/more animated without changing that shared
 * component for every other toast in the app.
 */
export function useWoowakgoodBonusUnlock(
  streamers: StreamerRecord[] | undefined,
  onUnlock: () => void,
): boolean {
  const revealedIds = useSyncExternalStore(
    subscribeTotyCardRevealed,
    getRevealedIds,
    getRevealedIds,
  );
  const [unlocked, setUnlocked] = useState(() => hasUnlockedWoowakgoodBonus());

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
    onUnlock();
  }, [unlocked, streamers, revealedIds, onUnlock]);

  return unlocked;
}
