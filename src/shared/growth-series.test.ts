import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PromotionPost, StreamerRecord } from "./model.js";
import { buildGrowthSeries } from "./growth-series.js";

const post = (articleId: string, division: number, publishedAt: string): PromotionPost => ({
  articleId,
  cafeAuthor: "후보",
  title: `${division}부 승격`,
  category: `[${division}부 승격]`,
  publishedAt,
  division,
  articleUrl: `https://example.test/${articleId}`,
  imageUrls: [],
});

function streamer(overrides: Partial<StreamerRecord> & { id: string; displayName: string }): StreamerRecord {
  return {
    cafeAliases: [],
    autoUpdate: true,
    overridePolicy: "auto",
    currentDivision: 10,
    isMapped: true,
    ...overrides,
  };
}

describe("buildGrowthSeries", () => {
  beforeEach(() => vi.setSystemTime(new Date("2026-08-07T12:00:00+09:00")));
  afterEach(() => vi.useRealTimers());

  it("forward-fills daily divisions between reports, per the spec's worked example", () => {
    const data = buildGrowthSeries([
      streamer({
        id: "1",
        displayName: "테스트",
        currentDivision: 6,
        promotionHistory: [
          post("1", 7, "2026-08-03T10:00:00+09:00"),
          post("2", 6, "2026-08-05T10:00:00+09:00"),
        ],
      }),
    ]);
    expect(data.series).toHaveLength(1);
    expect(data.series[0].points).toEqual([
      { dateKey: "2026-08-03", division: 7 },
      { dateKey: "2026-08-04", division: 7 },
      { dateKey: "2026-08-05", division: 6 },
      { dateKey: "2026-08-06", division: 6 },
      { dateKey: "2026-08-07", division: 6 },
    ]);
  });

  it("connects a same-day multi-step promotion vertically, but only after the normal diagonal arrival", () => {
    // 1일 9부, 2일 8부/7부/6부, 3일 5부: day1→day2's first report is a normal diagonal;
    // the extra same-day reports (7부, 6부) stack vertically at day2; day2→day3 is diagonal again.
    const data = buildGrowthSeries([
      streamer({
        id: "1",
        displayName: "계단",
        currentDivision: 5,
        promotionHistory: [
          post("1", 9, "2026-08-01T00:00:00+09:00"),
          post("2", 8, "2026-08-02T01:00:00+09:00"),
          post("3", 7, "2026-08-02T02:00:00+09:00"),
          post("4", 6, "2026-08-02T03:00:00+09:00"),
          post("5", 5, "2026-08-03T00:00:00+09:00"),
        ],
      }),
    ]);
    expect(data.series[0].points.slice(0, 5)).toEqual([
      { dateKey: "2026-08-01", division: 9 },
      { dateKey: "2026-08-02", division: 8 },
      { dateKey: "2026-08-02", division: 7 },
      { dateKey: "2026-08-02", division: 6 },
      { dateKey: "2026-08-03", division: 5 },
    ]);
  });

  it("includes isExcluded streamers (e.g. 천양) as long as they have reported, but drops streamers with no reports", () => {
    const excludedButReported = streamer({ id: "1", displayName: "천양", isExcluded: true, currentDivision: 3, promotionHistory: [post("1", 3, "2026-08-01T00:00:00+09:00")] });
    const unreported = streamer({ id: "2", displayName: "미보고", currentDivision: 10 });
    const eligible = streamer({ id: "3", displayName: "참가자", currentDivision: 5, promotionHistory: [post("1", 5, "2026-08-01T00:00:00+09:00")] });
    const data = buildGrowthSeries([eligible, excludedButReported, unreported]);
    expect(data.series.map((series) => series.streamerId).sort()).toEqual(["1", "3"]);
  });

  it("forces the final point to the streamer's resolved currentDivision, e.g. under a manual override", () => {
    const data = buildGrowthSeries([
      streamer({
        id: "1",
        displayName: "오버라이드",
        currentDivision: 1,
        overridePolicy: "until-manual-release",
        overrideDivision: 1,
        promotionHistory: [post("1", 4, "2026-08-06T00:00:00+09:00")],
      }),
    ]);
    expect(data.series[0].points.at(-1)).toEqual({ dateKey: "2026-08-07", division: 1 });
  });

  it("computes the global domain as the earliest first-report date across all series through today", () => {
    const data = buildGrowthSeries([
      streamer({ id: "1", displayName: "일찍", currentDivision: 8, promotionHistory: [post("1", 9, "2026-08-01T00:00:00+09:00")] }),
      streamer({ id: "2", displayName: "늦게", currentDivision: 5, promotionHistory: [post("1", 5, "2026-08-06T00:00:00+09:00")] }),
    ]);
    expect(data.domainStartKey).toBe("2026-08-01");
    expect(data.domainEndKey).toBe("2026-08-07");
    // The later starter's own series still only spans its own first-report date onward.
    expect(data.series.find((series) => series.streamerId === "2")?.points[0].dateKey).toBe("2026-08-06");
  });

  it("computes minDivision/maxDivision across every plotted point, not just endpoints", () => {
    const data = buildGrowthSeries([
      streamer({
        id: "1",
        displayName: "폭넓음",
        currentDivision: 2,
        promotionHistory: [post("1", 9, "2026-08-01T00:00:00+09:00"), post("2", 2, "2026-08-04T00:00:00+09:00")],
      }),
    ]);
    expect(data.minDivision).toBe(2);
    expect(data.maxDivision).toBe(9);
  });

  it("includes every single calendar day as a tick, even for long domains", () => {
    const data = buildGrowthSeries([
      streamer({ id: "1", displayName: "장기간", currentDivision: 1, promotionHistory: [post("1", 9, "2026-07-01T00:00:00+09:00")] }),
    ]);
    expect(data.ticks[0]).toBe("2026-07-01");
    expect(data.ticks.at(-1)).toBe("2026-08-07");
    expect(data.ticks).toHaveLength(38);
  });

  it("uses every day as a tick when the domain is already short", () => {
    const data = buildGrowthSeries([
      streamer({ id: "1", displayName: "단기간", currentDivision: 7, promotionHistory: [post("1", 7, "2026-08-05T00:00:00+09:00")] }),
    ]);
    expect(data.ticks).toEqual(["2026-08-05", "2026-08-06", "2026-08-07"]);
  });

  it("returns an empty series with a safe fallback domain when no streamer is eligible", () => {
    const data = buildGrowthSeries([streamer({ id: "1", displayName: "없음", currentDivision: 10 })]);
    expect(data.series).toEqual([]);
    expect(data.domainEndKey).toBe("2026-08-07");
  });

  it("degenerates to a single point when a streamer's only report is today", () => {
    const data = buildGrowthSeries([
      streamer({ id: "1", displayName: "오늘가입", currentDivision: 8, promotionHistory: [post("1", 8, "2026-08-07T09:00:00+09:00")] }),
    ]);
    expect(data.series[0].points).toEqual([{ dateKey: "2026-08-07", division: 8 }]);
  });

  it("plots every same-day report as its own vertical step, and keeps them all in allReports too", () => {
    const data = buildGrowthSeries([
      streamer({
        id: "1",
        displayName: "핑구",
        currentDivision: 5,
        promotionHistory: [
          post("1", 9, "2026-08-07T01:00:00+09:00"),
          post("2", 8, "2026-08-07T02:00:00+09:00"),
          post("3", 7, "2026-08-07T03:00:00+09:00"),
          post("4", 6, "2026-08-07T04:00:00+09:00"),
          post("5", 5, "2026-08-07T05:00:00+09:00"),
        ],
      }),
    ]);
    // All 5 same-day promotions land at the same x (2026-08-07), so the line climbs vertically.
    expect(data.series[0].points).toEqual([
      { dateKey: "2026-08-07", division: 9 },
      { dateKey: "2026-08-07", division: 8 },
      { dateKey: "2026-08-07", division: 7 },
      { dateKey: "2026-08-07", division: 6 },
      { dateKey: "2026-08-07", division: 5 },
    ]);
    expect(data.series[0].allReports.map((report) => report.division)).toEqual([9, 8, 7, 6, 5]);
  });

  it("keeps a stable, unique articleId per report even when two date-only posts share the same midnight publishedAt", () => {
    // Older cafe posts often only carry a calendar date, not a time, so multiple same-day
    // reports can land on the exact same publishedAt timestamp — the tooltip list still needs
    // a unique React key per entry, which articleId (not dateKey+publishedAt) guarantees.
    const data = buildGrowthSeries([
      streamer({
        id: "1",
        displayName: "동시각",
        currentDivision: 6,
        promotionHistory: [
          post("11", 7, "2026-08-01T00:00:00+09:00"),
          post("12", 6, "2026-08-01T00:00:00+09:00"),
        ],
      }),
    ]);
    const articleIds = data.series[0].allReports.map((report) => report.articleId);
    expect(articleIds).toEqual(["11", "12"]);
    expect(new Set(articleIds).size).toBe(2);
  });

  it("carries the streamer's career record through for the tooltip's W/D/L stat line", () => {
    const data = buildGrowthSeries([
      streamer({
        id: "1",
        displayName: "전적있음",
        currentDivision: 4,
        record: { wins: 5, draws: 1, losses: 2 },
        promotionHistory: [post("1", 4, "2026-08-01T00:00:00+09:00")],
      }),
    ]);
    expect(data.series[0].record).toEqual({ wins: 5, draws: 1, losses: 2 });
  });
});
