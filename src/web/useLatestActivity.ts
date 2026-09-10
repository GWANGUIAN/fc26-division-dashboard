import { useMemo } from "react";
import type { DashboardSnapshot, StreamerRecord } from "../shared/model.js";
import { fancyTierOf } from "./cardVisuals";
import { DAY_MS } from "./storage";

export function celebrationMessageFor(displayName: string, round: 1 | 2 = 1) {
  // 2차 합격이 곧 최종 합격으로 개편되어, round 2는 "2차" 대신 "최종"으로 표기한다.
  const roundLabel = round === 2 ? "최종" : `${round}차`;
  return `${displayName}의 잔디동 ${roundLabel} 합격을 축하합니다!!`;
}

/** Once anyone has passedSecondRound, everything 2차-aware (celebration banner,
 * 합격 인증샷 photo booth, main board/stats/histogram/growth graph) switches to a
 * 2차-only view. Shared by useLatestActivity and useStreamerFilters so both stay
 * in lockstep without depending on each other's hook output. */
export function determineCelebrationRound(streamers: StreamerRecord[]): 1 | 2 {
  return streamers.some((streamer) => streamer.passedSecondRound) ? 2 : 1;
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
  const celebrationRound: 1 | 2 = useMemo(
    () => determineCelebrationRound(snapshot?.streamers ?? []),
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
