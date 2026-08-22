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
  const [sfxOnly, setSfxOnly] = useState(false);
  const [achievementOnly, setAchievementOnly] = useState(false);

  // Some streamers (e.g. non-applicants who post division reports anyway) are
  // flagged isExcluded so they're kept off every aggregate calculation while
  // still showing up normally in the list/cards.
  const includedStreamers = useMemo(
    () => (snapshot?.streamers ?? []).filter((streamer) => !streamer.isExcluded),
    [snapshot],
  );
  const excludedNames = useMemo(
    () => (snapshot?.streamers ?? [])
      .filter((streamer) => streamer.isExcluded)
      .map((streamer) => streamer.displayName),
    [snapshot],
  );
  const trophyAwards = useMemo(
    () => buildTrophyAwards(includedStreamers),
    [includedStreamers],
  );
  const streamers = useMemo(
    () =>
      (snapshot?.streamers ?? []).filter(
        (streamer) =>
          searchable(streamer.displayName, streamer.cafeAliases, query) &&
          (!activityOnly ||
            Boolean(
              streamer.scopePosts?.length ||
              streamer.elevenVsElevenPosts?.length,
            )) &&
          (!sfxOnly || Boolean(streamer.sfx)) &&
          (!achievementOnly ||
            trophyBadgesFor(streamer, trophyAwards).length > 0),
      ),
    [snapshot, query, activityOnly, sfxOnly, achievementOnly, trophyAwards],
  );
  const divisionStats = useMemo(() => {
    const all = includedStreamers;
    const unreported = all.filter(
      (streamer) => streamer.currentDivision === 10,
    ).length;
    const sixOrHigher = all.filter(
      (streamer) => streamer.currentDivision <= 6,
    ).length;
    const sevenOrHigher = all.filter(
      (streamer) => streamer.currentDivision <= 7,
    ).length;
    return {
      total: all.length,
      reported: all.length - unreported,
      unreported,
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
    sfxOnly,
    setSfxOnly,
    achievementOnly,
    setAchievementOnly,
    trophyAwards,
    streamers,
    includedStreamers,
    excludedNames,
    divisionStats,
    cardStreamers,
  };
}
