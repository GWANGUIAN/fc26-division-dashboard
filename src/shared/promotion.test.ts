import { describe, expect, it } from "vitest";
import { filterArticleImages } from "./images.js";
import { buildStreamerRecords, divisionForPost, matchRosterEntry, parseDivision, resolveDivision } from "./promotion.js";
import type { PromotionPost, RosterEntry } from "./model.js";

const roster: RosterEntry[] = [{ slug: "momo", displayName: "문모모", cafeAliases: ["문 모모"], autoUpdate: true, override: { division: null, policy: "auto" } }];
const posts: PromotionPost[] = [
  { articleId: "1", cafeAuthor: "문 모모", title: "9부", category: "[9부 승격]", publishedAt: "2026-08-10T00:00:00+09:00", division: 9, articleUrl: "x", imageUrls: [] },
  { articleId: "2", cafeAuthor: "문 모모", title: "7부", category: "[7부 승격]", publishedAt: "2026-08-11T00:00:00+09:00", division: 7, articleUrl: "x", imageUrls: [] },
];

describe("promotion parsing", () => {
  it("recognizes the special division one category", () => expect(parseDivision("[1부 리거 달성]")).toBe(1));
  it("falls back to a manual override when the category and title carry no 말머리", () => {
    const post = { articleId: "999", category: "", title: "말머리 없이 올린 승격 인증" };
    expect(divisionForPost(post)).toBeUndefined();
    expect(divisionForPost(post, { "999": 4 })).toBe(4);
    expect(divisionForPost(post, { "111": 4 })).toBeUndefined();
  });
  it("prefers a parsed 말머리 over a manual override", () => {
    const post = { articleId: "999", category: "[3부 승격]", title: "" };
    expect(divisionForPost(post, { "999": 4 })).toBe(3);
  });
  it("matches aliases while ignoring whitespace", () => expect(matchRosterEntry("문모모", roster)?.slug).toBe("momo"));
  it("uses the best achieved division and creates division 10 defaults", () => {
    const result = buildStreamerRecords(posts, [...roster, { slug: "new", displayName: "신규", cafeAliases: ["신규"], autoUpdate: true }]);
    expect(result.find((entry) => entry.id === "momo")?.currentDivision).toBe(7);
    expect(result.find((entry) => entry.id === "new")?.currentDivision).toBe(10);
  });
  it("lists earlier promotion reports by division, then newest duplicate first", () => {
    const result = buildStreamerRecords([
      ...posts,
      { ...posts[0], articleId: "3", cafeAuthor: "문모모", title: "8부", category: "[8부 승격]", division: 8, publishedAt: "2026-08-12T00:00:00+09:00" },
      { ...posts[0], articleId: "4", title: "7부 중복", category: "[7부 승격]", division: 7, publishedAt: "2026-08-13T00:00:00+09:00" },
      { ...posts[0], articleId: "5", title: "9부 재보고", category: "[9부 승격]", division: 9, publishedAt: "2026-08-15T00:00:00+09:00" },
    ], [{ ...roster[0], cafeAliases: ["문 모모", "문모모"] }]);

    expect(result[0].previousPromotionPosts?.map((post) => post.articleId)).toEqual(["3", "5", "1"]);
  });
  it("keeps a history absent when a manual division has no earlier reports", () => {
    const result = buildStreamerRecords(posts, [{ ...roster[0], override: { division: 10, policy: "until-manual-release" } }]);
    expect(result[0].previousPromotionPosts).toBeUndefined();
  });
  it("shows unregistered writers when they have a valid post", () => {
    const result = buildStreamerRecords([{ ...posts[0], cafeAuthor: "미등록" }], roster);
    expect(result[0]).toMatchObject({ displayName: "미등록", isMapped: false, currentDivision: 9 });
  });
  it("keeps a manual rank until a genuinely higher promotion arrives", () => {
    expect(resolveDivision(posts.slice(0, 1), { division: 7, policy: "until-next-post" })).toBe(7);
    expect(resolveDivision([...posts, { ...posts[1], articleId: "3", division: 6, category: "[6부 승격]" }], { division: 7, policy: "until-next-post" })).toBe(6);
    expect(resolveDivision(posts, { division: 7, policy: "until-manual-release" })).toBe(7);
  });
  it("applies a record override only while the streamer sits in the division it was written for", () => {
    const rosterWithSoopId = [{ ...roster[0], soopId: "momosoop" }];
    const matching = buildStreamerRecords(posts, rosterWithSoopId, [{ soopId: "momosoop", division: 7, record: { wins: 1, draws: 2, losses: 3 } }]);
    expect(matching[0].record).toEqual({ wins: 1, draws: 2, losses: 3 });

    const stale = buildStreamerRecords(posts, rosterWithSoopId, [{ soopId: "momosoop", division: 9, record: { wins: 1, draws: 2, losses: 3 } }]);
    expect(stale[0].record).toBeUndefined();
  });
  it("falls back to the last post's record when no override matches", () => {
    const withRecord = [{ ...posts[1], record: { wins: 5, draws: 5, losses: 5 } }, posts[0]];
    expect(buildStreamerRecords(withRecord, roster)[0].record).toEqual({ wins: 5, draws: 5, losses: 5 });
  });
  it("marks the newest reviewed post's review as current when it matches lastPost", () => {
    const withReview = [posts[0], { ...posts[1], review: { mild: "순한맛", spicy: "매운맛" }, reviewCheckedAt: "2026-08-11T01:00:00+09:00" }];
    const result = buildStreamerRecords(withReview, roster);
    expect(result[0].latestReview).toEqual({ mild: "순한맛", spicy: "매운맛", generatedAt: "2026-08-11T01:00:00+09:00", isCurrent: true });
  });
  it("marks a review as not current once a newer, still-unreviewed post arrives", () => {
    const withStaleReview = [
      { ...posts[0], review: { mild: "예전 순한맛", spicy: "예전 매운맛" }, reviewCheckedAt: "2026-08-10T01:00:00+09:00" },
      posts[1],
      { ...posts[1], articleId: "3", title: "6부", category: "[6부 승격]", division: 6, publishedAt: "2026-08-12T00:00:00+09:00" },
    ];
    const result = buildStreamerRecords(withStaleReview, roster);
    expect(result[0].latestReview).toEqual({ mild: "예전 순한맛", spicy: "예전 매운맛", generatedAt: "2026-08-10T01:00:00+09:00", isCurrent: false });
  });
  it("leaves latestReview undefined when no post has a review", () => {
    expect(buildStreamerRecords(posts, roster)[0].latestReview).toBeUndefined();
  });
  it("treats a legacy single-flavor string review as stale, not a complete review", () => {
    const withLegacyReview = [posts[0], { ...posts[1], review: "구버전 한줄평", reviewCheckedAt: "2026-08-11T01:00:00+09:00" }];
    const result = buildStreamerRecords(withLegacyReview, roster);
    expect(result[0].latestReview).toBeUndefined();
  });
  it("omits a deleted roster entry from the output, without falling back to an unmapped writer card", () => {
    const result = buildStreamerRecords(posts, [{ ...roster[0], deleted: true }]);
    expect(result).toHaveLength(0);
  });
});

describe("article image filtering", () => {
  it("rejects emoji, avatars, and thumbnails", () => {
    expect(filterArticleImages([
      { src: "https://cafeptthumb-phinf.pstatic.net/a.png", className: "se-image-resource", width: 800, height: 600 },
      { src: "https://cafeptthumb-phinf.pstatic.net/b.png", className: "", width: 800, height: 600 },
      { src: "https://cafeptthumb-phinf.pstatic.net/c.png", className: "se-image-resource", width: 100, height: 100 },
      { src: "https://cafeptthumb-phinf.pstatic.net/d.png", className: "se-image-resource", width: 0, height: 0 },
      { src: "https://ssl.pstatic.net/avatar.png", className: "se-image-resource", width: 800, height: 600 },
    ])).toEqual(["https://cafeptthumb-phinf.pstatic.net/a.png", "https://cafeptthumb-phinf.pstatic.net/d.png"]);
  });
});
