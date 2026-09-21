import { describe, expect, it } from "vitest";
import { isRunPlausible, SCORE_GAMES } from "./minigame-scores.js";
import { signRunToken, verifyRunToken } from "./run-token.js";

const SECRET = "unit-test-secret";
const KEY = "a".repeat(64);
const NOW = Date.UTC(2026, 8, 21);
const TTL = 60 * 60_000;

describe("run tokens", () => {
  it("round-trips and reports the elapsed time", async () => {
    const token = await signRunToken(SECRET, "kickups", KEY, NOW);
    expect(await verifyRunToken(SECRET, token, "kickups", KEY, NOW + 12_345, TTL)).toEqual({ ok: true, elapsedMs: 12_345 });
  });

  it("is bound to the game, the player and the secret", async () => {
    const token = await signRunToken(SECRET, "kickups", KEY, NOW);
    expect(await verifyRunToken(SECRET, token, "freekick", KEY, NOW + 5_000, TTL)).toEqual({ ok: false, reason: "invalid" });
    expect(await verifyRunToken(SECRET, token, "kickups", "b".repeat(64), NOW + 5_000, TTL)).toEqual({ ok: false, reason: "invalid" });
    expect(await verifyRunToken("other-secret", token, "kickups", KEY, NOW + 5_000, TTL)).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects a token whose issue time was edited to look older", async () => {
    const token = await signRunToken(SECRET, "kickups", KEY, NOW);
    const [, signature] = token.split(".");
    const backdated = `${NOW - 3_600_000}.${signature}`;
    expect(await verifyRunToken(SECRET, backdated, "kickups", KEY, NOW + 1_000, 2 * TTL)).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects malformed, future-dated and expired tokens", async () => {
    expect(await verifyRunToken(SECRET, "nonsense", "kickups", KEY, NOW, TTL)).toEqual({ ok: false, reason: "invalid" });
    expect(await verifyRunToken(SECRET, `${NOW}.${"0".repeat(64)}`, "kickups", KEY, NOW, TTL)).toEqual({ ok: false, reason: "invalid" });
    const future = await signRunToken(SECRET, "kickups", KEY, NOW + 60_000);
    expect(await verifyRunToken(SECRET, future, "kickups", KEY, NOW, TTL)).toEqual({ ok: false, reason: "invalid" });
    const token = await signRunToken(SECRET, "kickups", KEY, NOW);
    expect(await verifyRunToken(SECRET, token, "kickups", KEY, NOW + TTL + 1, TTL)).toEqual({ ok: false, reason: "expired" });
  });
});

describe("isRunPlausible", () => {
  const { timing } = SCORE_GAMES.kickups;

  it("needs both the minimum run time and time proportional to the score", () => {
    expect(isRunPlausible(timing, 5, 1_000)).toBe(false); // under minRunMs
    expect(isRunPlausible(timing, 5, 2_000)).toBe(true);
    expect(isRunPlausible(timing, 100, 19_999)).toBe(false); // 100 hits × 200 ms
    expect(isRunPlausible(timing, 100, 20_000)).toBe(true);
  });

  it("treats card match turns as time too", () => {
    const { timing: card } = SCORE_GAMES.cardmatch;
    expect(isRunPlausible(card, 10, 7_999)).toBe(false);
    expect(isRunPlausible(card, 10, 8_000)).toBe(true);
    expect(isRunPlausible(card, 30, 17_000)).toBe(false); // 30 turns × 600 ms
    expect(isRunPlausible(card, 30, 18_000)).toBe(true);
  });
});
