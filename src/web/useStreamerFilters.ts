import { useMemo, useState } from "react";
import type { DashboardSnapshot } from "../shared/model.js";
import { searchable } from "../shared/search.js";
import { winRatePercent } from "../shared/record-extraction.js";
import { buildTrophyAwards, trophyBadgesFor } from "../shared/trophy.js";

export function useStreamerFilters(
  snapshot: DashboardSnapshot | undefined,
  sortMode: "division" | "winRate",
) {
  const [query, setQuery] = useState("");
  const [activityOnly, setActivityOnly] = useState(false);
  const [achievementOnly, setAchievementOnly] = useState(false);

  // Only 1차 합격자로 확정된 스트리머만 메인 보드/집계 대상이다. 나머지는
  // nonPassedStreamers로 따로 모아, 접이식 섹션에서만 노출한다.
  const passedStreamers = useMemo(
    () => (snapshot?.streamers ?? []).filter((streamer) => streamer.passedFirstRound),
    [snapshot],
  );
  // Some streamers (e.g. non-applicants who post division reports anyway) are
  // flagged isExcluded so they're kept off every aggregate calculation while
  // still showing up normally in the list/cards.
  const includedStreamers = useMemo(
    () => passedStreamers.filter((streamer) => !streamer.isExcluded),
    [passedStreamers],
  );
  const excludedNames = useMemo(
    () => passedStreamers
      .filter((streamer) => streamer.isExcluded)
      .map((streamer) => streamer.displayName),
    [passedStreamers],
  );
  const trophyAwards = useMemo(
    () => buildTrophyAwards(includedStreamers),
    [includedStreamers],
  );
  const streamers = useMemo(
    () =>
      passedStreamers.filter(
        (streamer) =>
          searchable(streamer.displayName, streamer.cafeAliases, query) &&
          (!activityOnly ||
            Boolean(
              streamer.scopePosts?.length ||
              streamer.elevenVsElevenPosts?.length,
            )) &&
          (!achievementOnly ||
            trophyBadgesFor(streamer, trophyAwards).length > 0),
      ),
    [passedStreamers, query, activityOnly, achievementOnly, trophyAwards],
  );
  const nonPassedStreamers = useMemo(
    () =>
      (snapshot?.streamers ?? []).filter(
        (streamer) =>
          !streamer.passedFirstRound &&
          searchable(streamer.displayName, streamer.cafeAliases, query),
      ),
    [snapshot, query],
  );
  const divisionStats = useMemo(() => {
    const all = includedStreamers;
    const fourOrHigher = all.filter(
      (streamer) => streamer.currentDivision <= 4,
    ).length;
    const fiveOrHigher = all.filter(
      (streamer) => streamer.currentDivision <= 5,
    ).length;
    const sixOrHigher = all.filter(
      (streamer) => streamer.currentDivision <= 6,
    ).length;
    const sevenOrHigher = all.filter(
      (streamer) => streamer.currentDivision <= 7,
    ).length;
    return {
      total: all.length,
      fourOrHigher,
      fiveOrHigher,
      sixOrHigher,
      sevenOrHigher,
    };
  }, [includedStreamers]);
  const cardStreamers = useMemo(() => {
    if (sortMode === "division")
      return [...streamers].sort(
        (a, b) => a.currentDivision - b.currentDivision,
      );
    return [...streamers].sort((a, b) => {
      const wa = a.record ? winRatePercent(a.record) : undefined;
      const wb = b.record ? winRatePercent(b.record) : undefined;
      if (wa === undefined && wb === undefined) return 0;
      if (wa === undefined) return 1;
      if (wb === undefined) return -1;
      return wb - wa;
    });
  }, [streamers, sortMode]);

  return {
    query,
    setQuery,
    activityOnly,
    setActivityOnly,
    achievementOnly,
    setAchievementOnly,
    trophyAwards,
    streamers,
    includedStreamers,
    excludedNames,
    divisionStats,
    cardStreamers,
    passedStreamers,
    nonPassedStreamers,
  };
}
