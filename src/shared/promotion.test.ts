import { describe, expect, it } from "vitest";
import { filterArticleImages } from "./images.js";
import { buildStreamerRecords, matchRosterEntry, parseDivision, resolveDivision } from "./promotion.js";
import type { PromotionPost, RosterEntry } from "./model.js";

const roster: RosterEntry[] = [{ slug: "momo", displayName: "문모모", cafeAliases: ["문 모모"], autoUpdate: true, override: { division: null, policy: "auto" } }];
const posts: PromotionPost[] = [
  { articleId: "1", cafeAuthor: "문 모모", title: "9부", category: "[9부 승격]", publishedAt: "2026-08-10T00:00:00+09:00", division: 9, articleUrl: "x", imageUrls: [] },
  { articleId: "2", cafeAuthor: "문 모모", title: "7부", category: "[7부 승격]", publishedAt: "2026-08-11T00:00:00+09:00", division: 7, articleUrl: "x", imageUrls: [] },
];

describe("promotion parsing", () => {
  it("recognizes the special division one category", () => expect(parseDivision("[1부 리거 달성]")).toBe(1));
  it("matches aliases while ignoring whitespace", () => expect(matchRosterEntry("문모모", roster)?.slug).toBe("momo"));
  it("uses the best achieved division and creates division 10 defaults", () => {
    const result = buildStreamerRecords(posts, [...roster, { slug: "new", displayName: "신규", cafeAliases: ["신규"], autoUpdate: true }]);
    expect(result.find((entry) => entry.id === "momo")?.currentDivision).toBe(7);
    expect(result.find((entry) => entry.id === "new")?.currentDivision).toBe(10);
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
