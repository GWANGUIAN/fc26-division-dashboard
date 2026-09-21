import { describe, expect, it } from "vitest";
import {
  hashPlayerId,
  isBetterScore,
  isScoreGameId,
  sanitizeNickname,
  SCORE_GAMES,
  toRankScore,
  validateScore,
} from "./minigame-scores.js";

describe("isScoreGameId", () => {
  it("accepts registered games only", () => {
    expect(isScoreGameId("kickups")).toBe(true);
    expect(isScoreGameId("football-match3")).toBe(true);
    expect(isScoreGameId("nope")).toBe(false);
    // Must not fall through to Object.prototype members.
    expect(isScoreGameId("constructor")).toBe(false);
    expect(isScoreGameId("__proto__")).toBe(false);
  });
});

describe("validateScore", () => {
  it("accepts integers inside the game's range", () => {
    expect(validateScore("kickups", 42)).toBe(42);
    expect(validateScore("soccer-sum10", 170)).toBe(170);
    expect(validateScore("cardmatch", 10)).toBe(10);
  });

  it("rejects out-of-range, fractional and non-numeric values", () => {
    expect(validateScore("soccer-sum10", 171)).toBeNull();
    expect(validateScore("cardmatch", 9)).toBeNull(); // 10 pairs cannot be done in fewer than 10 turns
    expect(validateScore("kickups", 0)).toBeNull();
    expect(validateScore("kickups", -5)).toBeNull();
    expect(validateScore("kickups", 3.5)).toBeNull();
    expect(validateScore("kickups", Number.NaN)).toBeNull();
    expect(validateScore("kickups", "42")).toBeNull();
    expect(validateScore("kickups", null)).toBeNull();
  });
});

describe("rank ordering", () => {
  it("negates smaller-is-better games so bigger always ranks higher", () => {
    expect(SCORE_GAMES.cardmatch.order).toBe("asc");
    expect(toRankScore("cardmatch", 12)).toBeGreaterThan(toRankScore("cardmatch", 20));
    expect(toRankScore("kickups", 20)).toBeGreaterThan(toRankScore("kickups", 12));
  });

  it("isBetterScore follows the order", () => {
    expect(isBetterScore("desc", 5, 4)).toBe(true);
    expect(isBetterScore("desc", 4, 4)).toBe(false);
    expect(isBetterScore("asc", 11, 12)).toBe(true);
    expect(isBetterScore("asc", 12, 12)).toBe(false);
    expect(isBetterScore("asc", 13, 12)).toBe(false);
  });
});

describe("sanitizeNickname", () => {
  it("keeps ordinary Korean and Latin nicknames", () => {
    expect(sanitizeNickname("문모모")).toBe("문모모");
    expect(sanitizeNickname("Lari_Yang.9")).toBe("Lari_Yang.9");
  });

  it("trims and collapses whitespace", () => {
    expect(sanitizeNickname("  잔디   러너  ")).toBe("잔디 러너");
  });

  it("enforces 2–12 characters counting code points", () => {
    expect(sanitizeNickname("가")).toBeNull();
    expect(sanitizeNickname("가나")).toBe("가나");
    expect(sanitizeNickname("가나다라마바사아자차카타")).toBe("가나다라마바사아자차카타"); // 12
    expect(sanitizeNickname("가나다라마바사아자차카타파")).toBeNull(); // 13
  });

  it("rejects markup, control characters, emoji and non-strings", () => {
    expect(sanitizeNickname("<b>hi</b>")).toBeNull();
    expect(sanitizeNickname("ab\u0000cd")).toBeNull();
    expect(sanitizeNickname("ab😀")).toBeNull();
    expect(sanitizeNickname(12345)).toBeNull();
    expect(sanitizeNickname(undefined)).toBeNull();
  });

  it("rejects blocked words even when disguised with separators or case", () => {
    expect(sanitizeNickname("씨 발")).toBeNull();
    expect(sanitizeNickname("F.u_c-k")).toBeNull();
  });
});

describe("hashPlayerId", () => {
  it("is a stable sha256 hex digest", async () => {
    expect(await hashPlayerId("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(await hashPlayerId("abc")).toBe(await hashPlayerId("abc"));
    expect(await hashPlayerId("abd")).not.toBe(await hashPlayerId("abc"));
  });
});
