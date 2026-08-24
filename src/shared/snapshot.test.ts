import { describe, expect, it } from "vitest";
import { buildDashboardSnapshot } from "./snapshot.js";
import type { PromotionPost, RosterEntry, StreamerActivityPost, StreamerRecord } from "./model.js";

const roster: RosterEntry[] = [{ slug: "candidate", displayName: "후보", cafeAliases: ["후 보"], autoUpdate: true }];
const streamers: StreamerRecord[] = [{
  id: "candidate", displayName: "후보", cafeAliases: ["후 보"], autoUpdate: true,
  overridePolicy: "auto", currentDivision: 7, isMapped: true,
}];
const post = (articleId: string, publishedAt: string): PromotionPost => ({
  articleId, cafeAuthor: "후 보", title: "승격 보고", category: "[7부 승격]", publishedAt,
  division: 7, articleUrl: `https://example.test/${articleId}`, imageUrls: [],
});

const earlierPost: PromotionPost = {
  ...post("earlier", "2026-08-14T12:00:00+09:00"),
  title: "9부 승격 보고",
  category: "[9부 승격]",
  division: 9,
};

describe("dashboard snapshot", () => {
  it("creates the public response once with sorted latest posts", () => {
    const snapshot = buildDashboardSnapshot({
      state: { status: "ok", updatedAt: "2026-08-16T12:00:00+09:00" },
      streamers,
      posts: [earlierPost, post("old", "2026-08-15T12:00:00+09:00"), post("new", "2026-08-16T12:00:00+09:00")],
      applications: [], roster,
      results: { opponent: { displayName: "우왁굳", soopId: "ecvhao" }, results: [] },
      activityPosts: [],
    });

    expect(snapshot).toMatchObject({ generatedAt: "2026-08-16T12:00:00+09:00", status: "ok" });
    expect(snapshot.latestPosts.map((item) => item.articleId)).toEqual(["new", "old", "earlier"]);
    expect(snapshot.streamers[0].previousPromotionPosts?.map((item) => item.articleId)).toEqual(["earlier"]);
  });

  it("omits a deleted streamer's own posts from both streamers and latestPosts", () => {
    const snapshot = buildDashboardSnapshot({
      state: { status: "ok", updatedAt: "2026-08-16T12:00:00+09:00" },
      streamers,
      posts: [post("new", "2026-08-16T12:00:00+09:00")],
      applications: [], roster: [{ ...roster[0], deleted: true }],
      results: { opponent: { displayName: "우왁굳", soopId: "ecvhao" }, results: [] },
      activityPosts: [],
    });

    expect(snapshot.streamers).toEqual([]);
    expect(snapshot.latestPosts).toEqual([]);
  });

  it("collects promo posts from both scope categories and all elevenVsEleven posts, regardless of roster mapping", () => {
    const activityPosts: StreamerActivityPost[] = [
      { articleId: "s1", board: "scope", cafeAuthor: "후 보", title: "직접 홍보글", category: "[내가 직접 홍보]", publishedAt: "2026-08-15T12:00:00+09:00", articleUrl: "https://example.test/s1" },
      { articleId: "s2", board: "scope", cafeAuthor: "미연결", title: "응원 버튜버 홍보글", category: "[응원버튜버홍보]", publishedAt: "2026-08-16T12:00:00+09:00", articleUrl: "https://example.test/s2" },
      { articleId: "s3", board: "scope", cafeAuthor: "후 보", title: "잡담", category: "[잡담]", publishedAt: "2026-08-16T13:00:00+09:00", articleUrl: "https://example.test/s3" },
      { articleId: "e1", board: "elevenVsEleven", cafeAuthor: "미연결", title: "11대11 영상", category: "", publishedAt: "2026-08-14T12:00:00+09:00", articleUrl: "https://example.test/e1" },
    ];
    const snapshot = buildDashboardSnapshot({
      state: { status: "ok", updatedAt: "2026-08-16T12:00:00+09:00" },
      streamers, posts: [], applications: [], roster,
      results: { opponent: { displayName: "우왁굳", soopId: "ecvhao" }, results: [] },
      activityPosts,
    });

    expect(snapshot.promoPosts.map((item) => item.articleId)).toEqual(["s2", "s1", "e1"]);
  });
});
