import { useMemo } from "react";
import type { DashboardSnapshot, StreamerRecord } from "../shared/model.js";
import { normalizeCafeAlias } from "../shared/promotion.js";
import { DEFAULT_CELEBRATION_MESSAGE } from "./FavoriteCelebration";
import { DAY_MS } from "./storage";

export function useLatestActivity(
  snapshot: DashboardSnapshot | undefined,
  streamers: StreamerRecord[],
) {
  const latest = (
    snapshot?.latestPosts.length
      ? snapshot.latestPosts
      : streamers
          .flatMap((streamer) => (streamer.lastPost ? [streamer.lastPost] : []))
          .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  ).filter(
    (post) => Date.now() - new Date(post.publishedAt).getTime() < DAY_MS,
  );
  const celebrationSlides = useMemo(() => {
    const postSlides = (snapshot?.streamers ?? [])
      .flatMap((streamer) => {
        const normalizedAliases = new Set(
          streamer.cafeAliases.map(normalizeCafeAlias),
        );
        const todaysPosts = latest.filter((post) =>
          normalizedAliases.has(normalizeCafeAlias(post.cafeAuthor)),
        );
        if (!todaysPosts.length) return [];
        // Lower division number = higher tier, so pick the best (minimum) division reached today.
        const bestPost = todaysPosts.reduce((best, post) =>
          post.division < best.division ? post : best,
        );
        const division = bestPost.division;
        const message = streamer.celebrationMessage
          ? streamer.celebrationMessage.replace("{n}", String(division))
          : `${streamer.displayName}의 ${division}부 리그 승격을 축하합니다~!!`;
        return [
          {
            key: bestPost.articleId,
            message,
            publishedAt: bestPost.publishedAt,
          },
        ];
      })
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    return [
      { key: "default", message: DEFAULT_CELEBRATION_MESSAGE },
      ...postSlides.map(({ key, message }) => ({ key, message })),
    ];
  }, [snapshot, latest]);

  return { latest, celebrationSlides };
}
