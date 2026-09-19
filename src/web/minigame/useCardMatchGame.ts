import { useEffect, useRef, useState } from "react";
import type { StreamerRecord } from "../../shared/model.js";
import { playSfx } from "../sfxAudio.js";
import { loadCardMatchBestTurns, saveCardMatchBestTurns } from "../storage.js";
import { hasTotyCard } from "../toty-card/totyCardAssets.js";
import { hasUnlockedWoowakgoodBonus } from "../toty-card/useWoowakgoodBonusUnlock.js";
import { WOOWAKGOOD_ID } from "../toty-card/woowakgoodBonusCard.js";
import {
  CARD_MATCH_PAIR_COUNT,
  createInitialState,
  flipCard,
  pickCandidateIds,
  resolveMismatch,
  type CardMatchState,
} from "./cardMatchEngine.js";

// Dedicated filenames for this minigame (rather than reusing generic shared sfx) so each one can
// be swapped independently by just dropping a differently-sourced mp3 in under the same name.
const FLIP_SFX_URL = "/sfxes/card-match-flip.mp3";
const MATCH_SFX_URL = "/sfxes/card-match-success.mp3";
const MISMATCH_SFX_URL = "/sfxes/card-match-fail.mp3";
const WIN_SFX_URL = "/sfxes/card-match-victory.mp3";
// Long enough to actually read the wrong pair before it flips back face-down.
const MISMATCH_RESOLVE_MS = 700;

// 우왁굳's inclusion here is NOT tied to clearing this game — it reuses the exact same one-way
// achievement as the 3D card viewer's own hidden bonus card (revealing every real player's 3D
// card at least once, see useWoowakgoodBonusUnlock.ts). This game just reads that flag to decide
// whether he's eligible to be one of the 10 randomly-picked candidates for a new board.
function buildCandidateIds(streamers: StreamerRecord[] | undefined): string[] {
  const realIds = (streamers ?? []).filter((s) => hasTotyCard(s.id)).map((s) => s.id);
  return hasUnlockedWoowakgoodBonus() && hasTotyCard(WOOWAKGOOD_ID) ? [...realIds, WOOWAKGOOD_ID] : realIds;
}

/** What the world hears when the board is cleared: the turns it took (fewer is better). */
export interface CardMatchRoundResult {
  game: "cardmatch";
  score: number;
}

export function useCardMatchGame({
  streamers,
  sfxVolume,
  onRoundEnd,
}: {
  streamers: StreamerRecord[] | undefined;
  sfxVolume: number;
  onRoundEnd?: (result: CardMatchRoundResult) => void;
}) {
  const [state, setState] = useState<CardMatchState | null>(null);
  // The authoritative, synchronously-updated game state, same rationale as useKickupsGame's own
  // liveStateRef: reading `state` from the closure inside handleFlip would be stale for a second
  // click that lands before React re-renders from the first (e.g. two fast clicks batched into the
  // same event-loop tick), silently dropping the first card's flip.
  const stateRef = useRef<CardMatchState | null>(null);
  const [bestTurns, setBestTurns] = useState<number | null>(() => loadCardMatchBestTurns());
  const [isNewRecord, setIsNewRecord] = useState(false);
  const prevPhaseRef = useRef<CardMatchState["phase"] | null>(null);

  // Recomputed on every render (cheap — a filter over a few dozen streamers) rather than memoized,
  // so a 우왁굳 unlock earned via the 3D card viewer in the same session is picked up by the very
  // next "새 게임" without this hook needing to subscribe to that feature's own storage.
  const candidateIds = buildCandidateIds(streamers);
  const poolSize = candidateIds.length;

  function applyState(next: CardMatchState) {
    stateRef.current = next;
    setState(next);
  }

  function deal() {
    setIsNewRecord(false);
    prevPhaseRef.current = null;
    applyState(createInitialState(pickCandidateIds(candidateIds, CARD_MATCH_PAIR_COUNT)));
  }

  // Deals the very first board once the roster (and therefore the candidate pool) has loaded.
  // Deliberately not re-dealing on every candidateIds change afterward — that would reshuffle a
  // game the player is mid-way through just because e.g. the roster snapshot refetched.
  useEffect(() => {
    if (state === null && poolSize > 0) deal();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only wait for the pool to become non-empty once; `deal` reads candidateIds fresh via closure
  }, [poolSize]);

  useEffect(() => {
    if (!state?.pendingMismatch) return;
    const timer = window.setTimeout(() => {
      const current = stateRef.current;
      if (current) applyState(resolveMismatch(current));
    }, MISMATCH_RESOLVE_MS);
    return () => window.clearTimeout(timer);
  }, [state?.pendingMismatch]);

  useEffect(() => {
    if (!state) return;
    if (prevPhaseRef.current !== "won" && state.phase === "won") {
      const newRecord = bestTurns === null || state.turns < bestTurns;
      if (newRecord) {
        setBestTurns(state.turns);
        saveCardMatchBestTurns(state.turns);
        setIsNewRecord(true);
      }
      playSfx(WIN_SFX_URL, sfxVolume / 100);
      onRoundEnd?.({ game: "cardmatch", score: state.turns });
    }
    prevPhaseRef.current = state.phase;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fires on the win transition only; onRoundEnd is read fresh from this render
  }, [state, bestTurns, sfxVolume]);

  function handleFlip(index: number) {
    const current = stateRef.current;
    if (!current) return;
    const before = current.cards[index];
    if (!before || before.status !== "hidden") return;
    const wasSecondFlip = current.cards.some((c) => c.status === "revealed");

    const next = flipCard(current, index);
    if (next === current) return;
    applyState(next);
    playSfx(FLIP_SFX_URL, sfxVolume / 100);

    if (!wasSecondFlip) return;
    const flippedCard = next.cards[index];
    if (flippedCard.status === "matched") {
      // Skip the regular match blip for the pair that just won the game — playSfx is a
      // single-slot player (see sfxAudio.ts), so this scheduled call would otherwise cut the
      // win effect's own card-match-victory.mp3 off just ~150ms after it starts.
      if (next.phase !== "won") {
        window.setTimeout(() => playSfx(MATCH_SFX_URL, sfxVolume / 100), 150);
      }
    } else if (next.pendingMismatch) {
      window.setTimeout(() => playSfx(MISMATCH_SFX_URL, sfxVolume / 100), 250);
    }
  }

  return {
    state,
    bestTurns,
    isNewRecord,
    poolSize,
    handleFlip,
    newGame: deal,
  };
}
