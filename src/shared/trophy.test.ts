import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PromotionPost, StreamerRecord } from "./model.js";
import { buildTrophyAwards, trophyBadgesFor } from "./trophy.js";

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

  it("supports snapshots that have current and previous reports but no promotion history", () => {
    const latest = post("2", 1, "2026-08-10T14:00:00+09:00");
    const legacy = { ...streamer("이전 형식"), currentDivision: 1, lastPost: latest, previousPromotionPosts: [post("1", 9, "2026-08-10T10:00:00+09:00")] };
    const awards = buildTrophyAwards([legacy]);
    expect(awards.dailyPromotion).toMatchObject([{ startDivision: 10, endDivision: 1, steps: 9 }]);
    expect(awards.divisionOne.map((award) => award.streamer.id)).toEqual(["이전 형식"]);
  });

  it("groups promotion reports by Korea date", () => {
    const awards = buildTrophyAwards([streamer("시간대", [
      post("1", 9, "2026-08-10T15:30:00Z"), post("2", 7, "2026-08-10T16:00:00Z"),
    ])]);
    expect(awards.dailyPromotion).toMatchObject([{ dateKey: "2026-08-11", steps: 3 }]);
  });

  it("ranks division-one achievers by who reached 1부 first, up to three", () => {
    const first = streamer("일등", [post("1", 1, "2026-08-10T10:00:00+09:00")]);
    const second = streamer("이등", [post("2", 1, "2026-08-10T11:00:00+09:00")]);
    const third = streamer("삼등", [post("3", 1, "2026-08-10T12:00:00+09:00")]);
    const fourth = streamer("사등", [post("4", 1, "2026-08-10T13:00:00+09:00")]);
    const awards = buildTrophyAwards([fourth, third, second, first]);
    expect(awards.divisionOne.map((award) => ({ id: award.streamer.id, rank: award.rank }))).toEqual([
      { id: "일등", rank: 1 }, { id: "이등", rank: 2 }, { id: "삼등", rank: 3 },
    ]);
  });

  it("excludes streamers who never reported reaching 1부", () => {
    const neverReached = streamer("미달성", [post("1", 3, "2026-08-10T10:00:00+09:00")]);
    expect(buildTrophyAwards([neverReached]).divisionOne).toEqual([]);
  });

  it("adds scope and eleven-versus-eleven posts, retaining promotion ties", () => {
    const first = { ...streamer("A"), scopePosts: [{ articleId: "s", board: "scope" as const, cafeAuthor: "A", title: "홍보", category: "[내가 직접 홍보]", publishedAt: "2026-08-10T10:00:00+09:00", articleUrl: "https://example.test/s" }] };
    const second = { ...streamer("B"), elevenVsElevenPosts: [{ articleId: "v", board: "elevenVsEleven" as const, cafeAuthor: "B", title: "영상", category: "", publishedAt: "2026-08-10T10:00:00+09:00", articleUrl: "https://example.test/v" }] };
    expect(buildTrophyAwards([first, second]).selfPromotion.map((award) => award.streamer.id)).toEqual(["A", "B"]);
    expect(buildTrophyAwards([])).toEqual({ dailyPromotion: [], divisionOne: [], selfPromotion: [], mostMatches: [], bestWinRate: [], retention: [], latecomer: [] });
  });

  it("awards most matches and best win rate from career records, preserving ties", () => {
    const mostGames = { ...streamer("최다출전"), record: { wins: 10, draws: 5, losses: 15 } };
    const fewerGames = { ...streamer("적은출전"), record: { wins: 3, draws: 0, losses: 1 } };
    const highRate = { ...streamer("고승률A"), record: { wins: 9, draws: 0, losses: 1 } };
    const tiedRate = { ...streamer("고승률B"), record: { wins: 18, draws: 0, losses: 2 } };
    const noRecord = streamer("전적없음");
    const awards = buildTrophyAwards([mostGames, fewerGames, highRate, tiedRate, noRecord]);
    expect(awards.mostMatches).toEqual([{ streamer: mostGames, totalGames: 30 }]);
    expect(awards.bestWinRate.map((award) => award.streamer.id)).toEqual(["고승률A", "고승률B"]);
  });

  it("returns no most-matches or win-rate awards when no streamer has a career record", () => {
    const awards = buildTrophyAwards([streamer("전적없음")]);
    expect(awards.mostMatches).toEqual([]);
    expect(awards.bestWinRate).toEqual([]);
  });

  it("returns each earned badge once even when a daily record is tied more than once", () => {
    const candidate = streamer("수상자", [post("1", 9, "2026-08-10T10:00:00+09:00"), post("2", 1, "2026-08-10T14:00:00+09:00")]);
    const awards = buildTrophyAwards([candidate]);
    expect(trophyBadgesFor(candidate, awards)).toEqual([
      { key: "division-one", name: "가장 먼저 1부 리그 달성", emoji: "🥇" }, { key: "daily-promotion", name: "하루 급성장", emoji: "🚀" },
      { key: "latecomer", name: "지각왕", emoji: "⏰" },
    ]);
  });

  describe("retention award", () => {
    beforeEach(() => vi.setSystemTime(new Date("2026-08-21T00:00:00+09:00")));
    afterEach(() => vi.useRealTimers());

    it("awards the streamer who has stayed longest in their current division, among 9부+ achievers", () => {
      const longStay = streamer("오래머묾", [post("1", 9, "2026-08-01T00:00:00+09:00")]);
      const shortStay = streamer("최근승격", [post("1", 9, "2026-08-05T00:00:00+09:00"), post("2", 8, "2026-08-15T00:00:00+09:00")]);
      const awards = buildTrophyAwards([longStay, shortStay]);
      expect(awards.retention.map((award) => award.streamer.id)).toEqual(["오래머묾"]);
    });

    it("only counts the ongoing streak in the current division, not earlier stays", () => {
      const bounced = { ...streamer("왕복", [post("1", 9, "2026-08-01T00:00:00+09:00"), post("2", 8, "2026-08-10T00:00:00+09:00"), post("3", 9, "2026-08-19T00:00:00+09:00")]), currentDivision: 9 };
      const awards = buildTrophyAwards([bounced]);
      expect(awards.retention).toMatchObject([{ since: "2026-08-19T00:00:00+09:00", days: 2 }]);
    });

    it("excludes streamers who never reached division 9 or better", () => {
      const neverTop = streamer("미승격", [post("1", 10, "2026-08-01T00:00:00+09:00")]);
      expect(buildTrophyAwards([neverTop]).retention).toEqual([]);
    });

    it("excludes streamers currently in division 1, even if they stayed the longest", () => {
      const topDivision = streamer("1부잔류", [post("1", 1, "2026-08-01T00:00:00+09:00")]);
      const nineDivision = streamer("9부잔류", [post("2", 9, "2026-08-10T00:00:00+09:00")]);
      const awards = buildTrophyAwards([topDivision, nineDivision]);
      expect(awards.retention.map((award) => award.streamer.id)).toEqual(["9부잔류"]);
    });
  });

  describe("latecomer award", () => {
    it("awards the streamer whose first promotion report was published latest", () => {
      const early = streamer("일찍", [post("1", 9, "2026-08-10T10:00:00+09:00")]);
      const late = streamer("늦게", [post("2", 8, "2026-08-10T20:00:00+09:00")]);
      const awards = buildTrophyAwards([early, late]);
      expect(awards.latecomer).toMatchObject([{ publishedAt: "2026-08-10T20:00:00+09:00", division: 8 }]);
      expect(awards.latecomer.map((award) => award.streamer.id)).toEqual(["늦게"]);
    });

    it("uses the first report even when later reports were published earlier than another streamer's first report", () => {
      const earlyStarter = streamer("먼저시작", [
        post("1", 9, "2026-08-05T10:00:00+09:00"), post("2", 5, "2026-08-15T10:00:00+09:00"),
      ]);
      const lateStarter = streamer("늦게시작", [post("3", 7, "2026-08-10T10:00:00+09:00")]);
      const awards = buildTrophyAwards([earlyStarter, lateStarter]);
      expect(awards.latecomer.map((award) => award.streamer.id)).toEqual(["늦게시작"]);
    });

    it("preserves ties when multiple streamers' first reports share the same time", () => {
      const first = streamer("A", [post("1", 5, "2026-08-10T10:00:00+09:00")]);
      const second = streamer("B", [post("2", 6, "2026-08-10T10:00:00+09:00")]);
      const awards = buildTrophyAwards([first, second]);
      expect(awards.latecomer.map((award) => award.streamer.id)).toEqual(["A", "B"]);
    });

    it("returns no latecomer award when no streamer has a promotion report", () => {
      expect(buildTrophyAwards([streamer("무보고")]).latecomer).toEqual([]);
    });
  });
});
