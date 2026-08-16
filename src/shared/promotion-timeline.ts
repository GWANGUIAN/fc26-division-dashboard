import type { PromotionPost } from "./model.js";

export type PromotionTimelineEvent = {
  post: PromotionPost;
  precision: "time" | "date";
  dateKey: string;
};

export type PromotionTimelineSummary = {
  startDivision: number;
  currentDivision: number;
  promotionCount: number;
  calendarDays: number;
  exactDurationMs?: number;
};

function precisionFor(post: PromotionPost): "time" | "date" {
  if (post.publishedAtPrecision) return post.publishedAtPrecision;
  // Earlier snapshots did not store a precision marker. Their midnight values
  // were created from Naver's date-only list format, so retain that meaning.
  return /T00:00(?::00)?(?:[+.Z]|$)/u.test(post.publishedAt) ? "date" : "time";
}

function chronological(posts: PromotionPost[]): PromotionPost[] {
  return [...posts].sort((left, right) =>
    left.publishedAt.localeCompare(right.publishedAt)
    || Number(left.articleId) - Number(right.articleId)
    || left.articleId.localeCompare(right.articleId));
}

export function buildPromotionTimeline(posts: PromotionPost[]): PromotionTimelineEvent[] {
  let bestDivision: number | undefined;
  return chronological(posts).flatMap((post) => {
    if (bestDivision !== undefined && post.division >= bestDivision) return [];
    bestDivision = post.division;
    return [{ post, precision: precisionFor(post), dateKey: post.publishedAt.slice(0, 10) }];
  });
}

export function summarizePromotionTimeline(events: PromotionTimelineEvent[]): PromotionTimelineSummary | undefined {
  const start = events[0];
  const current = events.at(-1);
  if (!start || !current) return undefined;
  const startDate = Date.parse(`${start.dateKey}T00:00:00+09:00`);
  const currentDate = Date.parse(`${current.dateKey}T00:00:00+09:00`);
  const exactDurationMs = start.precision === "time" && current.precision === "time"
    ? Date.parse(current.post.publishedAt) - Date.parse(start.post.publishedAt)
    : undefined;
  return {
    startDivision: start.post.division,
    currentDivision: current.post.division,
    promotionCount: events.length,
    calendarDays: Math.max(0, Math.round((currentDate - startDate) / 86_400_000)),
    ...(exactDurationMs !== undefined && exactDurationMs >= 0 ? { exactDurationMs } : {}),
  };
}
