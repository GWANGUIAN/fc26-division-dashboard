import { describe, expect, it } from "vitest";
import type { PromotionPost, StreamerRecord } from "./model.js";
import { buildTrophyAwards } from "./trophy.js";

const post = (articleId: string, division: number, publishedAt: string): PromotionPost => ({
  articleId, cafeAuthor: "후보", title: `${division}부 승격`, category: `[${division}부 승격]`, division, publishedAt,
  articleUrl: `https://example.test/${articleId}`, imageUrls: [],
});

const streamer = (id: string, history: PromotionPost[] = []): StreamerRecord => ({
  id, displayName: id, cafeAliases: [id], autoUpdate: true, overridePolicy: "auto", isMapped: true,
  currentDivision: history.length ? Math.min(...history.map((item) => item.division)) : 10,
  ...(history.length ? { promotionHistory: history } : {}),
});

describe("trophy awards", () => {
  it("uses each Korea-day's first report and last report even when divisions are skipped", () => {
    const awards = buildTrophyAwards([streamer("급성장", [
      post("1", 9, "2026-08-10T00:30:00+09:00"), post("2", 7, "2026-08-10T08:00:00+09:00"), post("3", 5, "2026-08-10T14:00:00+09:00"),
    ])]);
    expect(awards.dailyPromotion).toMatchObject([{ dateKey: "2026-08-10", startDivision: 10, endDivision: 5, steps: 5 }]);
  });

  it("counts a single daily report as one step and preserves daily ties", () => {
    const awards = buildTrophyAwards([
      streamer("A", [post("1", 7, "2026-08-10T12:00:00+09:00")]),
      streamer("B", [post("2", 7, "2026-08-10T13:00:00+09:00")]),
    ]);
    expect(awards.dailyPromotion.map((award) => award.streamer.id)).toEqual(["A", "B"]);
    expect(awards.dailyPromotion.every((award) => award.steps === 1)).toBe(true);
  });

  it("groups promotion reports by Korea date", () => {
    const awards = buildTrophyAwards([streamer("시간대", [
      post("1", 9, "2026-08-10T15:30:00Z"), post("2", 7, "2026-08-10T16:00:00Z"),
    ])]);
    expect(awards.dailyPromotion).toMatchObject([{ dateKey: "2026-08-11", steps: 3 }]);
  });

  it("selects the earliest achiever among the current highest division ties", () => {
    const early = streamer("먼저", [post("1", 3, "2026-08-10T10:00:00+09:00")]);
    const late = streamer("나중", [post("2", 3, "2026-08-10T11:00:00+09:00")]);
    expect(buildTrophyAwards([late, early]).currentDivision?.streamer.id).toBe("먼저");
  });

  it("adds scope and eleven-versus-eleven posts, retaining promotion ties", () => {
    const first = { ...streamer("A"), scopePosts: [{ articleId: "s", board: "scope" as const, cafeAuthor: "A", title: "홍보", category: "[내가 직접 홍보]", publishedAt: "2026-08-10T10:00:00+09:00", articleUrl: "https://example.test/s" }] };
    const second = { ...streamer("B"), elevenVsElevenPosts: [{ articleId: "v", board: "elevenVsEleven" as const, cafeAuthor: "B", title: "영상", category: "", publishedAt: "2026-08-10T10:00:00+09:00", articleUrl: "https://example.test/v" }] };
    expect(buildTrophyAwards([first, second]).selfPromotion.map((award) => award.streamer.id)).toEqual(["A", "B"]);
    expect(buildTrophyAwards([])).toEqual({ dailyPromotion: [], currentDivision: undefined, selfPromotion: [] });
  });
});
