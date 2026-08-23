import type { CareerRecord, StreamerRecord } from "./model.js";
import { koreaDateKey } from "./dates.js";
import { divisionColor } from "./division-theme.js";

const DAY_MS = 86_400_000;

export type GrowthPoint = { dateKey: string; division: number };

/** One individual promotion report, kept uncollapsed so same-day multi-step promotions (e.g. 9부 → 5부 in one day) all show up. */
export type GrowthReportEntry = { articleId: string; dateKey: string; division: number; publishedAt: string };

export type GrowthSeries = {
  streamerId: string;
  displayName: string;
  profileImageUrl?: string;
  soopId?: string;
  /** divisionColor(currentDivision) — used for the line, marker border, and marker name text. */
  color: string;
  currentDivision: number;
  /** Effective career W-D-L for the streamer's current division, for the tooltip's stat line. */
  record?: CareerRecord;
  /** Forward-filled, one point per calendar day, from this streamer's own first report through today. */
  points: GrowthPoint[];
  /** Every individual promotion report, chronological and uncollapsed (unlike `points`, which is one value per day). */
  allReports: GrowthReportEntry[];
  firstReportDateKey: string;
};

export type GrowthGraphData = {
  series: GrowthSeries[];
  domainStartKey: string;
  domainEndKey: string;
  minDivision: number;
  maxDivision: number;
  /** Every calendar day from domainStartKey through domainEndKey, for axis labels. */
  ticks: string[];
};

function nextDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  // Noon UTC sidesteps any DST edge cases entirely (Asia/Seoul itself has none),
  // keeping the +1-day step safe regardless of the host machine's local timezone.
  const next = new Date(Date.UTC(year, month - 1, day, 12));
  next.setUTCDate(next.getUTCDate() + 1);
  return koreaDateKey(next);
}

function allReportsFor(streamer: StreamerRecord): GrowthReportEntry[] {
  return (streamer.promotionHistory ?? [])
    .map((post) => ({
      articleId: post.articleId,
      dateKey: koreaDateKey(new Date(post.publishedAt)),
      division: post.division,
      publishedAt: post.publishedAt,
    }))
    // Ties (same publishedAt — common for date-only precision posts, which all default to
    // midnight) fall back to articleId, matching promotion.ts's own chronological() tiebreak.
    .sort((a, b) => a.publishedAt.localeCompare(b.publishedAt) || a.articleId.localeCompare(b.articleId));
}

/**
 * Builds the daily line geometry from the full, uncollapsed report list. Days with no report
 * carry the previous division forward flat (one point). A report day adds one point per report
 * that landed that day (chronological) — the *first* report of the day connects normally
 * (diagonally) from whatever the previous point was, but any additional same-day reports share
 * that exact x, so a streamer who jumps several divisions in one day (e.g. 9부 → 8부 → 7부 → 6부)
 * draws that day's remaining steps as one clean vertical climb rather than spreading them
 * across the following days.
 */
function buildPoints(allReports: GrowthReportEntry[], todayKey: string): GrowthPoint[] {
  const byDay = new Map<string, GrowthReportEntry[]>();
  for (const report of allReports) {
    const list = byDay.get(report.dateKey);
    if (list) list.push(report);
    else byDay.set(report.dateKey, [report]);
  }

  const points: GrowthPoint[] = [];
  let current = allReports[0].division;
  let dateKey = allReports[0].dateKey;
  while (true) {
    const dayReports = byDay.get(dateKey);
    if (dayReports) {
      for (const report of dayReports) {
        points.push({ dateKey, division: report.division });
        current = report.division;
      }
    } else {
      points.push({ dateKey, division: current });
    }
    if (dateKey === todayKey) break;
    dateKey = nextDateKey(dateKey);
  }
  return points;
}

function buildTicks(domainStartKey: string, domainEndKey: string): string[] {
  const days: string[] = [];
  for (let key = domainStartKey; ; key = nextDateKey(key)) {
    days.push(key);
    if (key === domainEndKey) break;
  }
  return days;
}

/**
 * Builds one daily forward-filled division series per eligible streamer, for the growth graph.
 * Unlike most other aggregates in this app, this intentionally does NOT filter out isExcluded
 * streamers (e.g. 천양) — callers should pass the full roster-derived streamer list. The only
 * eligibility rule here is "has ever reported a division," since a streamer with no
 * promotionHistory has nothing to plot.
 */
export function buildGrowthSeries(allStreamers: StreamerRecord[]): GrowthGraphData {
  const todayKey = koreaDateKey(new Date());
  const eligible = allStreamers.filter((streamer) => (streamer.promotionHistory?.length ?? 0) > 0);

  if (eligible.length === 0) {
    return { series: [], domainStartKey: "", domainEndKey: todayKey, minDivision: 1, maxDivision: 10, ticks: [] };
  }

  const series: GrowthSeries[] = eligible.map((streamer) => {
    const allReports = allReportsFor(streamer);
    const points = buildPoints(allReports, todayKey);
    // Force the final point to the resolved current division so the line's endpoint always
    // matches the color/badge shown elsewhere in the app, even under a manual override.
    points[points.length - 1] = { dateKey: todayKey, division: streamer.currentDivision };
    return {
      streamerId: streamer.id,
      displayName: streamer.displayName,
      profileImageUrl: streamer.profileImageUrl,
      soopId: streamer.soopId,
      color: divisionColor(streamer.currentDivision),
      currentDivision: streamer.currentDivision,
      record: streamer.record,
      points,
      allReports,
      firstReportDateKey: allReports[0].dateKey,
    };
  });

  const domainStartKey = series.reduce(
    (earliest, item) => (item.firstReportDateKey < earliest ? item.firstReportDateKey : earliest),
    series[0].firstReportDateKey,
  );
  const domainEndKey = todayKey;

  let minDivision = Infinity;
  let maxDivision = -Infinity;
  for (const item of series) {
    for (const point of item.points) {
      if (point.division < minDivision) minDivision = point.division;
      if (point.division > maxDivision) maxDivision = point.division;
    }
  }

  return {
    series,
    domainStartKey,
    domainEndKey,
    minDivision,
    maxDivision,
    ticks: buildTicks(domainStartKey, domainEndKey),
  };
}
