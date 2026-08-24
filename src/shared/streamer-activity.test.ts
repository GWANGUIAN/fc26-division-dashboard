import { describe, expect, it } from "vitest";
import type { RosterEntry, StreamerActivityPost, StreamerRecord } from "./model.js";
import { attachStreamerActivityPosts, isDirectPromotionPost } from "./streamer-activity.js";

const roster: RosterEntry[] = [{
  slug: "candidate", displayName: "후보", cafeAliases: ["후 보"], soopId: "candidate", autoUpdate: true,
}];

const streamer: StreamerRecord = {
  id: "candidate", displayName: "후보", cafeAliases: ["후 보"], soopId: "candidate",
  autoUpdate: true, overridePolicy: "auto", currentDivision: 10, isMapped: true,
};

const scopePost: StreamerActivityPost = {
  articleId: "1", board: "scope", cafeAuthor: "후보", title: "직접 홍보", category: "[내가 직접 홍보]",
  publishedAt: "2026-08-16T10:00:00+09:00", articleUrl: "https://example.test/1",
};

describe("streamer activity", () => {
  it("accepts both direct-promotion scope categories and rejects unrelated ones", () => {
    expect(isDirectPromotionPost(scopePost)).toBe(true);
    expect(isDirectPromotionPost({ category: "[응원 버튜버 홍보]" })).toBe(true);
    expect(isDirectPromotionPost({ category: "[응원버튜버홍보]" })).toBe(true);
    expect(isDirectPromotionPost({ category: "[잡담]" })).toBe(false);
  });

  it("maps alias-matched posts, sorts them newest-first, and omits unmapped authors", () => {
    const records = attachStreamerActivityPosts([streamer], roster, [
      scopePost,
      { ...scopePost, articleId: "2", board: "elevenVsEleven", title: "11대11", publishedAt: "2026-08-15T10:00:00+09:00" },
      { ...scopePost, articleId: "3", board: "elevenVsEleven", title: "최신 11대11", publishedAt: "2026-08-16T11:00:00+09:00" },
      { ...scopePost, articleId: "4", cafeAuthor: "미연결", board: "scope" },
    ]);

    expect(records[0].scopePosts).toMatchObject([{ articleId: "1" }]);
    expect(records[0].elevenVsElevenPosts?.map((post) => post.articleId)).toEqual(["3", "2"]);
  });
});
