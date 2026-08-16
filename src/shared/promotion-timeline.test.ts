import { describe, expect, it } from "vitest";
import type { PromotionPost } from "./model.js";
import { buildPromotionTimeline, summarizePromotionTimeline } from "./promotion-timeline.js";

const post = (articleId: string, division: number, publishedAt: string, publishedAtPrecision?: "time" | "date"): PromotionPost => ({
  articleId, cafeAuthor: "후보", title: `${division}부 승격`, category: `[${division}부 승격]`, publishedAt,
  ...(publishedAtPrecision ? { publishedAtPrecision } : {}), division, articleUrl: `https://example.test/${articleId}`, imageUrls: [],
});

describe("promotion timeline", () => {
  it("keeps only chronologically new best divisions and ignores duplicate reports", () => {
    const events = buildPromotionTimeline([
      post("4", 7, "2026-08-12T17:00:00+09:00", "time"),
      post("1", 9, "2026-08-10T09:00:00+09:00", "time"),
      post("2", 8, "2026-08-11T10:00:00+09:00", "time"),
      post("3", 8, "2026-08-12T11:00:00+09:00", "time"),
      post("5", 9, "2026-08-13T09:00:00+09:00", "time"),
    ]);
    expect(events.map((event) => event.post.articleId)).toEqual(["1", "2", "4"]);
  });

  it("orders same-day promotions by article ID when their timestamp is unavailable", () => {
    const events = buildPromotionTimeline([
      post("102", 7, "2026-08-12T00:00:00+09:00", "date"),
      post("101", 8, "2026-08-12T00:00:00+09:00", "date"),
    ]);
    expect(events.map((event) => event.post.articleId)).toEqual(["101", "102"]);
    expect(events.every((event) => event.precision === "date")).toBe(true);
  });

  it("does not calculate an exact duration when either endpoint has date-only precision", () => {
    const events = buildPromotionTimeline([
      post("1", 9, "2026-08-10T00:00:00+09:00", "date"),
      post("2", 8, "2026-08-12T13:00:00+09:00", "time"),
    ]);
    const summary = summarizePromotionTimeline(events);
    expect(summary).toMatchObject({ promotionCount: 2, calendarDays: 2 });
    expect(summary?.exactDurationMs).toBeUndefined();
  });

  it("calculates exact duration for time-precise same-day promotions", () => {
    const events = buildPromotionTimeline([
      post("1", 9, "2026-08-12T10:00:00+09:00", "time"),
      post("2", 8, "2026-08-12T13:15:00+09:00", "time"),
    ]);
    expect(summarizePromotionTimeline(events)?.exactDurationMs).toBe(11_700_000);
  });
});
