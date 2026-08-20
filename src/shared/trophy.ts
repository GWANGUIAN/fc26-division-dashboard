import type { PromotionPost, StreamerRecord } from "./model.js";
import { winRatePercent } from "./record-extraction.js";

export type DailyPromotionTrophy = {
  streamer: StreamerRecord;
  dateKey: string;
  startDivision: number;
  endDivision: number;
  steps: number;
};

export type DivisionOneTrophy = {
  streamer: StreamerRecord;
  rank: 1 | 2 | 3;
  reachedAt: string;
};

export type PromotionTrophy = {
  streamer: StreamerRecord;
  scopeCount: number;
  elevenVsElevenCount: number;
  totalCount: number;
};

export type MostMatchesTrophy = {
  streamer: StreamerRecord;
  totalGames: number;
};

export type BestWinRateTrophy = {
  streamer: StreamerRecord;
  winRate: number;
};

export type RetentionTrophy = {
  streamer: StreamerRecord;
  currentDivision: number;
  since: string;
  days: number;
};

export type TrophyAwards = {
  dailyPromotion: DailyPromotionTrophy[];
  divisionOne: DivisionOneTrophy[];
  selfPromotion: PromotionTrophy[];
  mostMatches: MostMatchesTrophy[];
  bestWinRate: BestWinRateTrophy[];
  retention: RetentionTrophy[];
};

export type TrophyBadge = {
  key: "daily-promotion" | "division-one" | "self-promotion" | "most-matches" | "best-win-rate" | "retention";
  name: string;
  emoji: string;
};

/** Streamers who never reached at least division 9 aren't eligible for the retention award. */
const RETENTION_MIN_DIVISION = 9;

export const DIVISION_ONE_EMOJI = { 1: "🥇", 2: "🥈", 3: "🥉" } as const;
const DIVISION_ONE_LABEL = { 1: "가장 먼저 1부 리그 달성", 2: "두 번째로 1부 리그 달성", 3: "세 번째로 1부 리그 달성" } as const;

const koreaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
});

function chronological(posts: PromotionPost[]): PromotionPost[] {
  return [...posts].sort((left, right) =>
    left.publishedAt.localeCompare(right.publishedAt)
    || Number(left.articleId) - Number(right.articleId)
    || left.articleId.localeCompare(right.articleId));
}

function koreaDateKey(value: string): string {
  return koreaDateFormatter.format(new Date(value));
}

function promotionPostsFor(streamer: StreamerRecord): PromotionPost[] {
  if (streamer.promotionHistory?.length) return chronological(streamer.promotionHistory);
  // Snapshots published before promotionHistory existed expose the same data
  // as a current report plus previous reports. Keep awards available until
  // the next scraper publish upgrades their shape.
  return chronological([...(streamer.previousPromotionPosts ?? []), ...(streamer.lastPost ? [streamer.lastPost] : [])]);
}

/** Derives display-only awards from the public dashboard snapshot. */
export function buildTrophyAwards(streamers: StreamerRecord[]): TrophyAwards {
  const dailyRecords = streamers.flatMap((streamer) => {
    const days = new Map<string, PromotionPost[]>();
    for (const post of promotionPostsFor(streamer)) {
      const dateKey = koreaDateKey(post.publishedAt);
      days.set(dateKey, [...(days.get(dateKey) ?? []), post]);
    }
    return [...days].map(([dateKey, posts]) => {
      const first = posts[0]!;
      const last = posts.at(-1)!;
      return {
        streamer,
        dateKey,
        startDivision: first.division + 1,
        endDivision: last.division,
        steps: Math.max(1, first.division + 1 - last.division),
      };
    });
  });
  const bestDailySteps = Math.max(0, ...dailyRecords.map((record) => record.steps));

  const divisionOneCandidates = streamers.flatMap((streamer) => {
    const reachedAt = promotionPostsFor(streamer).find((post) => post.division === 1)?.publishedAt;
    return reachedAt ? [{ streamer, reachedAt }] : [];
  }).sort((left, right) =>
    left.reachedAt.localeCompare(right.reachedAt)
    || left.streamer.displayName.localeCompare(right.streamer.displayName, "ko"))
    .slice(0, 3)
    .map((candidate, index) => ({ ...candidate, rank: (index + 1) as 1 | 2 | 3 }));

  const promotionRecords = streamers.map((streamer) => {
    const scopeCount = streamer.scopePosts?.length ?? 0;
    const elevenVsElevenCount = streamer.elevenVsElevenPosts?.length ?? 0;
    return { streamer, scopeCount, elevenVsElevenCount, totalCount: scopeCount + elevenVsElevenCount };
  });
  const bestPromotionCount = Math.max(0, ...promotionRecords.map((record) => record.totalCount));

  const matchRecords = streamers.flatMap((streamer) => {
    if (!streamer.record) return [];
    const totalGames = streamer.record.wins + streamer.record.draws + streamer.record.losses;
    return totalGames > 0 ? [{ streamer, totalGames }] : [];
  });
  const mostGames = Math.max(0, ...matchRecords.map((record) => record.totalGames));

  const winRateRecords = streamers.flatMap((streamer) => {
    const winRate = streamer.record ? winRatePercent(streamer.record) : undefined;
    return winRate !== undefined ? [{ streamer, winRate }] : [];
  });
  const bestRate = Math.max(-1, ...winRateRecords.map((record) => record.winRate));

  const retentionRecords = streamers.flatMap((streamer) => {
    // Division 1 streamers are covered by the division-one award instead.
    if (streamer.currentDivision === 1) return [];
    const posts = promotionPostsFor(streamer);
    const everReachedTopNine = streamer.currentDivision <= RETENTION_MIN_DIVISION
      || posts.some((post) => post.division <= RETENTION_MIN_DIVISION);
    if (!everReachedTopNine) return [];
    // Walk backward from the newest report and keep the earliest one that still
    // matches the current division, i.e. the start of the ongoing streak.
    let since: string | undefined;
    for (let i = posts.length - 1; i >= 0; i--) {
      if (posts[i]!.division !== streamer.currentDivision) break;
      since = posts[i]!.publishedAt;
    }
    if (!since) return [];
    const days = Math.floor((Date.now() - new Date(since).getTime()) / 86_400_000);
    return days >= 0 ? [{ streamer, currentDivision: streamer.currentDivision, since, days }] : [];
  });
  const longestRetention = Math.max(-1, ...retentionRecords.map((record) => record.days));

  return {
    dailyPromotion: bestDailySteps > 0 ? dailyRecords.filter((record) => record.steps === bestDailySteps) : [],
    divisionOne: divisionOneCandidates,
    selfPromotion: bestPromotionCount > 0 ? promotionRecords.filter((record) => record.totalCount === bestPromotionCount) : [],
    mostMatches: mostGames > 0 ? matchRecords.filter((record) => record.totalGames === mostGames) : [],
    bestWinRate: bestRate >= 0 ? winRateRecords.filter((record) => record.winRate === bestRate) : [],
    retention: longestRetention >= 0 ? retentionRecords.filter((record) => record.days === longestRetention) : [],
  };
}

export function trophyBadgesFor(streamer: StreamerRecord, awards: TrophyAwards): TrophyBadge[] {
  const badges: TrophyBadge[] = [];
  const divisionOne = awards.divisionOne.find((award) => award.streamer.id === streamer.id);
  if (divisionOne) badges.push({ key: "division-one", name: DIVISION_ONE_LABEL[divisionOne.rank], emoji: DIVISION_ONE_EMOJI[divisionOne.rank] });
  if (awards.mostMatches.some((award) => award.streamer.id === streamer.id)) badges.push({ key: "most-matches", name: "최다 경기 출전", emoji: "⚔️" });
  if (awards.bestWinRate.some((award) => award.streamer.id === streamer.id)) badges.push({ key: "best-win-rate", name: "최고 승률", emoji: "👑" });
  if (awards.dailyPromotion.some((award) => award.streamer.id === streamer.id)) badges.push({ key: "daily-promotion", name: "하루 급성장", emoji: "🚀" });
  if (awards.selfPromotion.some((award) => award.streamer.id === streamer.id)) badges.push({ key: "self-promotion", name: "자기 PR 왕", emoji: "📣" });
  if (awards.retention.some((award) => award.streamer.id === streamer.id)) badges.push({ key: "retention", name: "잔류왕", emoji: "🛏️" });
  return badges;
}
