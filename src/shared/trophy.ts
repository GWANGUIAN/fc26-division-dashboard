import type { PromotionPost, StreamerRecord } from "./model.js";

export type DailyPromotionTrophy = {
  streamer: StreamerRecord;
  dateKey: string;
  startDivision: number;
  endDivision: number;
  steps: number;
};

export type CurrentDivisionTrophy = {
  streamer: StreamerRecord;
  reachedAt?: string;
};

export type PromotionTrophy = {
  streamer: StreamerRecord;
  scopeCount: number;
  elevenVsElevenCount: number;
  totalCount: number;
};

export type TrophyAwards = {
  dailyPromotion: DailyPromotionTrophy[];
  currentDivision?: CurrentDivisionTrophy;
  selfPromotion: PromotionTrophy[];
};

export type TrophyBadge = {
  name: "하루 급성장" | "현재 최고 디비전" | "자기 PR 왕";
  emoji: "🚀" | "🥇" | "📣";
};

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

  const currentCandidates = streamers.flatMap((streamer) => {
    if (streamer.currentDivision >= 10) return [];
    const reachedAt = promotionPostsFor(streamer)
      .find((post) => post.division === streamer.currentDivision)?.publishedAt;
    return [{ streamer, reachedAt }];
  }).sort((left, right) =>
    left.streamer.currentDivision - right.streamer.currentDivision
    || (left.reachedAt ?? "9999-12-31").localeCompare(right.reachedAt ?? "9999-12-31")
    || left.streamer.displayName.localeCompare(right.streamer.displayName, "ko"));

  const promotionRecords = streamers.map((streamer) => {
    const scopeCount = streamer.scopePosts?.length ?? 0;
    const elevenVsElevenCount = streamer.elevenVsElevenPosts?.length ?? 0;
    return { streamer, scopeCount, elevenVsElevenCount, totalCount: scopeCount + elevenVsElevenCount };
  });
  const bestPromotionCount = Math.max(0, ...promotionRecords.map((record) => record.totalCount));

  return {
    dailyPromotion: bestDailySteps > 0 ? dailyRecords.filter((record) => record.steps === bestDailySteps) : [],
    currentDivision: currentCandidates[0],
    selfPromotion: bestPromotionCount > 0 ? promotionRecords.filter((record) => record.totalCount === bestPromotionCount) : [],
  };
}

export function trophyBadgesFor(streamer: StreamerRecord, awards: TrophyAwards): TrophyBadge[] {
  const badges: TrophyBadge[] = [];
  if (awards.dailyPromotion.some((award) => award.streamer.id === streamer.id)) badges.push({ name: "하루 급성장", emoji: "🚀" });
  if (awards.currentDivision?.streamer.id === streamer.id) badges.push({ name: "현재 최고 디비전", emoji: "🥇" });
  if (awards.selfPromotion.some((award) => award.streamer.id === streamer.id)) badges.push({ name: "자기 PR 왕", emoji: "📣" });
  return badges;
}
