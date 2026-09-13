import { describe, expect, it } from "vitest";
import {
  buildDeck,
  createInitialState,
  flipCard,
  pickCandidateIds,
  resolveMismatch,
  shuffle,
  CARD_MATCH_PAIR_COUNT,
} from "./cardMatchEngine";

describe("shuffle", () => {
  it("keeps the same multiset of items, just reordered", () => {
    const items = [1, 2, 3, 4, 5];
    const result = shuffle(items);
    expect(result).toHaveLength(items.length);
    expect([...result].sort()).toEqual(items);
  });
  it("does not mutate the input array", () => {
    const items = [1, 2, 3];
    shuffle(items);
    expect(items).toEqual([1, 2, 3]);
  });
});

describe("pickCandidateIds", () => {
  it("picks exactly `count` ids when the pool is larger", () => {
    const pool = Array.from({ length: 11 }, (_, i) => `s${i}`);
    const picked = pickCandidateIds(pool, CARD_MATCH_PAIR_COUNT);
    expect(picked).toHaveLength(CARD_MATCH_PAIR_COUNT);
    expect(new Set(picked).size).toBe(CARD_MATCH_PAIR_COUNT);
    picked.forEach((id) => expect(pool).toContain(id));
  });
  it("clamps to the pool size when there are fewer candidates than requested", () => {
    const pool = ["a", "b", "c"];
    expect(pickCandidateIds(pool, CARD_MATCH_PAIR_COUNT)).toHaveLength(3);
  });
});

describe("buildDeck", () => {
  it("creates exactly two cards per streamer id, all hidden", () => {
    const deck = buildDeck(["a", "b", "c"]);
    expect(deck).toHaveLength(6);
    expect(deck.every((c) => c.status === "hidden")).toBe(true);
    const counts = deck.reduce<Record<string, number>>((acc, c) => {
      acc[c.streamerId] = (acc[c.streamerId] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({ a: 2, b: 2, c: 2 });
  });
  it("gives every card a unique id", () => {
    const deck = buildDeck(["a", "b"]);
    expect(new Set(deck.map((c) => c.id)).size).toBe(deck.length);
  });
});

// Deterministic rng (always returns 0) so buildDeck's shuffle is a no-op and card order is
// predictable for the flipCard/resolveMismatch tests below.
const noShuffle = () => 0;

describe("flipCard", () => {
  it("reveals the first card of a turn without incrementing turns", () => {
    const state = createInitialState(["a", "b"], noShuffle);
    const next = flipCard(state, 0);
    expect(next.cards[0].status).toBe("revealed");
    expect(next.turns).toBe(0);
  });

  it("matches two cards of the same streamer, locks them, and counts one turn", () => {
    const state = createInitialState(["a", "b"], noShuffle);
    const firstMatchIndex = state.cards.findIndex(
      (c, i) => state.cards.findIndex((other) => other.streamerId === c.streamerId) !== i,
    );
    const streamerId = state.cards[firstMatchIndex].streamerId;
    const otherIndex = state.cards.findIndex((c, i) => c.streamerId === streamerId && i !== firstMatchIndex);

    const afterFirst = flipCard(state, firstMatchIndex);
    const afterSecond = flipCard(afterFirst, otherIndex);

    expect(afterSecond.turns).toBe(1);
    expect(afterSecond.cards[firstMatchIndex].status).toBe("matched");
    expect(afterSecond.cards[otherIndex].status).toBe("matched");
    expect(afterSecond.pendingMismatch).toBeNull();
  });

  it("leaves a mismatched pair revealed with pendingMismatch set, and blocks further flips until resolved", () => {
    const state = createInitialState(["a", "b"], noShuffle);
    const aIndex = state.cards.findIndex((c) => c.streamerId === "a");
    const bIndex = state.cards.findIndex((c) => c.streamerId === "b");

    const afterFirst = flipCard(state, aIndex);
    const afterSecond = flipCard(afterFirst, bIndex);

    expect(afterSecond.turns).toBe(1);
    expect(afterSecond.cards[aIndex].status).toBe("revealed");
    expect(afterSecond.cards[bIndex].status).toBe("revealed");
    expect(afterSecond.pendingMismatch).toEqual([aIndex, bIndex]);

    const anyOtherIndex = state.cards.findIndex((_, i) => i !== aIndex && i !== bIndex);
    const blocked = flipCard(afterSecond, anyOtherIndex);
    expect(blocked).toBe(afterSecond);
  });

  it("wins once every card is matched", () => {
    let state = createInitialState(["a"], noShuffle);
    const [i0, i1] = [0, 1];
    state = flipCard(state, i0);
    state = flipCard(state, i1);
    expect(state.phase).toBe("won");
    expect(state.cards.every((c) => c.status === "matched")).toBe(true);
  });

  it("does nothing once the game is won", () => {
    let state = createInitialState(["a"], noShuffle);
    state = flipCard(state, 0);
    state = flipCard(state, 1);
    const afterWin = flipCard(state, 0);
    expect(afterWin).toBe(state);
  });
});

describe("resolveMismatch", () => {
  it("flips a pending mismatched pair back to hidden and clears pendingMismatch", () => {
    const state = createInitialState(["a", "b"], noShuffle);
    const aIndex = state.cards.findIndex((c) => c.streamerId === "a");
    const bIndex = state.cards.findIndex((c) => c.streamerId === "b");
    const mismatched = flipCard(flipCard(state, aIndex), bIndex);

    const resolved = resolveMismatch(mismatched);
    expect(resolved.pendingMismatch).toBeNull();
    expect(resolved.cards[aIndex].status).toBe("hidden");
    expect(resolved.cards[bIndex].status).toBe("hidden");
  });

  it("is a no-op when nothing is pending", () => {
    const state = createInitialState(["a", "b"], noShuffle);
    expect(resolveMismatch(state)).toBe(state);
  });
});
