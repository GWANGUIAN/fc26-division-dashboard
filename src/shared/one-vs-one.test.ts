import { describe, expect, it } from "vitest";
import { buildOneVsOneApplications, calculateOneVsOneVerdict, isOneVsOneApplication } from "./one-vs-one.js";
import { parseOneVsOneResults } from "./one-vs-one-results.js";
import { buildStreamerRecords } from "./promotion.js";
import { parseRoster } from "./roster.js";
import type { OneVsOneApplication, RosterEntry } from "./model.js";

const application: OneVsOneApplication = {
  articleId: "21951534", cafeAuthor: "문 모모", title: "신청합니다", category: "[1대1 평가 신청]",
  publishedAt: "2026-08-14T20:00:00+09:00", articleUrl: "https://example.test/article",
};
const roster: RosterEntry[] = [{ slug: "momo", displayName: "문모모", cafeAliases: ["문모모"], soopTags: ["루키존", "스포츠"], autoUpdate: true }];

describe("one vs one applications", () => {
  it("recognizes the application category", () => {
    expect(isOneVsOneApplication(application)).toBe(true);
    expect(isOneVsOneApplication({ category: "[공지]", title: "일반 글" })).toBe(false);
  });

  it.each([
    [11, 10, "잔디동 회장"], [10, 10, "잔디동 합격 확정"], [9, 10, "잔디동 운영급 실력"],
    [8, 10, "잔디동 반장급 실력"], [7, 10, "잔디동 에이스급 실력"], [6, 10, "잔디동 상현급 실력"],
    [5, 10, "잔디동 합격 조건 충족"], [4, 10, "추가 조건 1개 필요"], [3, 10, "추가 조건 2개 필요"],
    [2, 10, "추가 조건 3개 필요"], [1, 10, "추가 조건 4개 필요"], [0, 10, "잔디동 합격 불투명"],
  ])("evaluates score %i:%i", (candidate, woowakgood, verdict) => {
    expect(calculateOneVsOneVerdict(candidate, woowakgood).verdict).toBe(verdict);
  });

  it("merges YAML results and roster profile tags", () => {
    const results = parseOneVsOneResults(`opponent:\n  displayName: 우왁굳\n  soopId: ecvhao\nresults:\n  - applicationArticleId: "21951534"\n    playedAt: "2026-08-15T20:00:00+09:00"\n    candidateScore: 5\n    woowakgoodScore: 10`);
    expect(buildOneVsOneApplications([application], roster, results)[0]).toMatchObject({ displayName: "문모모", soopTags: ["루키존", "스포츠"], result: { verdict: "잔디동 합격 조건 충족" } });
  });

  it("rejects duplicate IDs and invalid scores", () => {
    expect(() => parseOneVsOneResults(`opponent: { displayName: 우왁굳, soopId: ecvhao }\nresults:\n  - { applicationArticleId: "1", playedAt: "2026-08-15T20:00:00+09:00", candidateScore: -1, woowakgoodScore: 1 }`)).toThrow();
    expect(() => parseOneVsOneResults(`opponent: { displayName: 우왁굳, soopId: ecvhao }\nresults:\n  - { applicationArticleId: "1", playedAt: "2026-08-15T20:00:00+09:00", candidateScore: 1, woowakgoodScore: 1 }\n  - { applicationArticleId: "1", playedAt: "2026-08-15T20:00:00+09:00", candidateScore: 1, woowakgoodScore: 1 }`)).toThrow();
  });

  it("ignores entirely blank roster placeholders but rejects incomplete entries", () => {
    expect(parseRoster(`streamers:\n  - { slug: live, displayName: 라이브, cafeAliases: [라이브], autoUpdate: true }\n  - { slug: '', displayName: '', cafeAliases: [''], soopId: '', autoUpdate: true }`)).toHaveLength(1);
    expect(parseRoster(`streamers:\n  - { slug: '', displayName: 라이브, cafeAliases: [라이브], soopId: live, autoUpdate: true }`)[0]?.slug).toBe("live");
    expect(() => parseRoster(`streamers:\n  - { slug: '', displayName: 라이브, cafeAliases: [라이브], autoUpdate: true }`)).toThrow();
  });

  it("shows a SOOP-mapped candidate with no cafe alias as season-unparticipated", () => {
    const noAliasRoster = parseRoster(`streamers:\n  - { displayName: 별칭 없는 후보, soopId: noalias, autoUpdate: true }`);
    expect(buildStreamerRecords([], noAliasRoster)).toMatchObject([{ displayName: "별칭 없는 후보", soopId: "noalias", cafeAliases: [], currentDivision: 10 }]);
  });
});
