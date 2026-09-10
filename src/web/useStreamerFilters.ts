import { useMemo, useState } from "react";
import type { DashboardSnapshot } from "../shared/model.js";
import { searchable } from "../shared/search.js";
import { winRatePercent } from "../shared/record-extraction.js";
import { buildTrophyAwards, trophyBadgesFor } from "../shared/trophy.js";
import { determineCelebrationRound } from "./useLatestActivity";
import { usePositionCodeFilter } from "./usePositionCodeFilter";

export function useStreamerFilters(
  snapshot: DashboardSnapshot | undefined,
  sortMode: "division" | "winRate",
) {
  const [query, setQuery] = useState("");
  const [activityOnly, setActivityOnly] = useState(false);
  const [achievementOnly, setAchievementOnly] = useState(false);

  // Only 1차 합격자로 확정된 스트리머만 메인 보드/집계 대상이다. 나머지는
  // nonPassedStreamers로 따로 모아, 접이식 섹션에서만 노출한다.
  // Kept 1차-only (not round-aware) on purpose — squad builder, 합격자 발표,
  // 2차 테스트일정, 우왁굳의 메모장 all still key off this. Live-stream tracking
  // uses boardStreamers instead, so once 2차 결과가 나오면 최종 합격자만 뜬다.
  const passedStreamers = useMemo(
    () => (snapshot?.streamers ?? []).filter((streamer) => streamer.passedFirstRound),
    [snapshot],
  );
  // Once anyone has passedSecondRound, the main board (list/cards/table,
  // distribution histogram, growth graph, division-summary stats) switches to
  // a 2차-only population — same round rule the celebration banner/photo booth
  // already use (see useLatestActivity.ts's determineCelebrationRound).
  const celebrationRound = useMemo(
    () => determineCelebrationRound(snapshot?.streamers ?? []),
    [snapshot],
  );
  const boardStreamers = useMemo(
    () =>
      celebrationRound === 2
        ? passedStreamers.filter((streamer) => streamer.passedSecondRound)
        : passedStreamers,
    [passedStreamers, celebrationRound],
  );
  // Only codes with at least one candidate in the currently-shown board
  // population appear in the filter dropdown at all.
  const {
    selectedPositions,
    setSelectedPositions,
    selectedPositionSet,
    availablePositionCodes,
    isAllPositionsSelected,
  } = usePositionCodeFilter(boardStreamers);
  // 1차는 합격했지만 2차는 아닌 사람들 — "2차 탈락자 보기" 섹션. 2차 결과가 아직
  // 없으면(celebrationRound === 1) 항상 빈 배열.
  const secondRoundNonPassedStreamers = useMemo(
    () =>
      celebrationRound === 2
        ? passedStreamers.filter(
            (streamer) =>
              !streamer.passedSecondRound &&
              searchable(streamer.displayName, streamer.cafeAliases, query),
          )
        : [],
    [passedStreamers, celebrationRound, query],
  );
  // Some streamers (e.g. non-applicants who post division reports anyway) are
  // flagged isExcluded so they're kept off every aggregate calculation while
  // still showing up normally in the list/cards.
  const includedStreamers = useMemo(
    () => boardStreamers.filter((streamer) => !streamer.isExcluded),
    [boardStreamers],
  );
  const excludedNames = useMemo(
    () => boardStreamers
      .filter((streamer) => streamer.isExcluded)
      .map((streamer) => streamer.displayName),
    [boardStreamers],
  );
  const trophyAwards = useMemo(
    () => buildTrophyAwards(includedStreamers),
    [includedStreamers],
  );
  const streamers = useMemo(
    () =>
      boardStreamers.filter(
        (streamer) =>
          searchable(streamer.displayName, streamer.cafeAliases, query) &&
          (!activityOnly ||
            Boolean(
              streamer.scopePosts?.length ||
              streamer.elevenVsElevenPosts?.length,
            )) &&
          (!achievementOnly ||
            trophyBadgesFor(streamer, trophyAwards).length > 0) &&
          (isAllPositionsSelected ||
            selectedPositionSet.has((streamer.hopedPosition1 ?? "").toUpperCase()) ||
            selectedPositionSet.has((streamer.hopedPosition2 ?? "").toUpperCase())),
      ),
    [
      boardStreamers,
      query,
      activityOnly,
      achievementOnly,
      trophyAwards,
      isAllPositionsSelected,
      selectedPositionSet,
    ],
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
    // Always 1차/2차 raw totals (not board-aware) so both stat boxes can show
    // side by side regardless of which population currently drives the board.
    const firstRoundTotal = passedStreamers.filter(
      (streamer) => !streamer.isExcluded,
    ).length;
    const secondRoundTotal = passedStreamers.filter(
      (streamer) => streamer.passedSecondRound && !streamer.isExcluded,
    ).length;
    return {
      firstRoundTotal,
      secondRoundTotal,
    };
  }, [passedStreamers]);
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
    selectedPositions,
    setSelectedPositions,
    availablePositionCodes,
    isAllPositionsSelected,
    trophyAwards,
    streamers,
    includedStreamers,
    excludedNames,
    divisionStats,
    cardStreamers,
    passedStreamers,
    boardStreamers,
    nonPassedStreamers,
    secondRoundNonPassedStreamers,
  };
}
