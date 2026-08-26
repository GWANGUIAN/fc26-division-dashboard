import { useMemo } from "react";
import type { DashboardSnapshot, StreamerRecord } from "../shared/model.js";
import { DAY_MS } from "./storage";

export function useLatestActivity(
  snapshot: DashboardSnapshot | undefined,
  streamers: StreamerRecord[],
) {
  const recentPosts =
    snapshot?.latestPosts.length
      ? snapshot.latestPosts
      : streamers
          .flatMap((streamer) => (streamer.lastPost ? [streamer.lastPost] : []))
          .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const latest = recentPosts.filter(
    (post) => Date.now() - new Date(post.publishedAt).getTime() < DAY_MS,
  );
  const celebrationSlides = useMemo(
    () =>
      (snapshot?.streamers ?? [])
        .filter((streamer) => streamer.passedFirstRound)
        .map((streamer) => ({
          key: streamer.id,
          message: `${streamer.displayName}의 잔디동 1차 합격을 축하합니다!!`,
        })),
    [snapshot],
  );

  return { latest, celebrationSlides };
}
