export const CARD_MATCH_PAIR_COUNT = 10;

export type CardMatchCardStatus = "hidden" | "revealed" | "matched";

export interface CardMatchCard {
  /** Stable React key — `${streamerId}-${position}`, position fixed at deal time. */
  id: string;
  streamerId: string;
  status: CardMatchCardStatus;
}

export type CardMatchPhase = "playing" | "won";

export interface CardMatchState {
  cards: CardMatchCard[];
  phase: CardMatchPhase;
  turns: number;
  /** Set to the [firstIndex, secondIndex] of a just-revealed non-matching pair — both stay
   * face-up until the caller (see useCardMatchGame's timer) calls resolveMismatch to flip them
   * back. No further card can be flipped while this is set, so the player gets a moment to see
   * both mismatched cards before they hide again. */
  pendingMismatch: [number, number] | null;
}

export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Picks up to `count` streamer ids at random out of the full candidate pool (real cards, plus
 * the hidden 우왁굳 bonus once unlocked — see useCardMatchGame). Clamped to the pool size so the
 * game still works with fewer than CARD_MATCH_PAIR_COUNT candidates (e.g. mid-rollout). */
export function pickCandidateIds(
  candidateIds: string[],
  count: number = CARD_MATCH_PAIR_COUNT,
  rng: () => number = Math.random,
): string[] {
  return shuffle(candidateIds, rng).slice(0, Math.min(count, candidateIds.length));
}

export function buildDeck(streamerIds: string[], rng: () => number = Math.random): CardMatchCard[] {
  const doubled = streamerIds.flatMap((streamerId) => [streamerId, streamerId]);
  return shuffle(doubled, rng).map((streamerId, position) => ({
    id: `${streamerId}-${position}`,
    streamerId,
    status: "hidden" as const,
  }));
}

export function createInitialState(streamerIds: string[], rng: () => number = Math.random): CardMatchState {
  return {
    cards: buildDeck(streamerIds, rng),
    phase: "playing",
    turns: 0,
    pendingMismatch: null,
  };
}

/**
 * Flips one hidden card face-up. The first flip of a turn just reveals it; the second flip
 * increments `turns` and either matches (both cards locked as "matched", win checked) or leaves
 * both revealed with `pendingMismatch` set so the UI can show the wrong pair briefly before the
 * caller flips them back via resolveMismatch. No-ops while a mismatch is still pending, the game
 * is already won, the index is out of range, or the target card isn't currently hidden.
 */
export function flipCard(state: CardMatchState, index: number): CardMatchState {
  if (state.phase === "won") return state;
  if (state.pendingMismatch) return state;
  const card = state.cards[index];
  if (!card || card.status !== "hidden") return state;

  const revealedIndex = state.cards.findIndex((c) => c.status === "revealed");

  if (revealedIndex === -1) {
    const cards = state.cards.map((c, i) => (i === index ? { ...c, status: "revealed" as const } : c));
    return { ...state, cards };
  }

  const firstCard = state.cards[revealedIndex];
  const turns = state.turns + 1;

  if (firstCard.streamerId === card.streamerId) {
    const cards = state.cards.map((c, i) =>
      i === index || i === revealedIndex ? { ...c, status: "matched" as const } : c,
    );
    const won = cards.every((c) => c.status === "matched");
    return { ...state, cards, turns, phase: won ? "won" : state.phase };
  }

  const cards = state.cards.map((c, i) => (i === index ? { ...c, status: "revealed" as const } : c));
  return { ...state, cards, turns, pendingMismatch: [revealedIndex, index] };
}

/** Flips a pending mismatched pair back face-down. No-op if nothing is pending. */
export function resolveMismatch(state: CardMatchState): CardMatchState {
  if (!state.pendingMismatch) return state;
  const [a, b] = state.pendingMismatch;
  const cards = state.cards.map((c, i) => (i === a || i === b ? { ...c, status: "hidden" as const } : c));
  return { ...state, cards, pendingMismatch: null };
}
