import { useMemo } from "react";
import type { DashboardSnapshot, StreamerRecord } from "../shared/model.js";
import { fancyTierOf } from "./cardVisuals";
import { DAY_MS } from "./storage";

export function celebrationMessageFor(displayName: string, round: 1 | 2 = 1) {
  return `${displayName}의 잔디동 ${round}차 합격을 축하합니다!!`;
}

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
  // Once anyone has passedSecondRound, the celebration banner + 합격 인증샷 photo
  // booth switch entirely to a 2차-only view (wording, eligible streamers, and
  // photo booth assets). Until then everything stays keyed off passedFirstRound,
  // same as the main board.
  const celebrationRound: 1 | 2 = useMemo(
    () => ((snapshot?.streamers ?? []).some((streamer) => streamer.passedSecondRound) ? 2 : 1),
    [snapshot],
  );
  const celebrationEligibleStreamers = useMemo(
    () =>
      (snapshot?.streamers ?? []).filter((streamer) =>
        celebrationRound === 2 ? streamer.passedSecondRound : streamer.passedFirstRound,
      ),
    [snapshot, celebrationRound],
  );
  const celebrationSlides = useMemo(
    () =>
      celebrationEligibleStreamers.map((streamer) => ({
        key: streamer.id,
        message: celebrationMessageFor(streamer.nickname?.trim() || streamer.displayName, celebrationRound),
        fancyTier: fancyTierOf(streamer),
      })),
    [celebrationEligibleStreamers, celebrationRound],
  );

  return { latest, celebrationSlides, celebrationRound, celebrationEligibleStreamers };
}
