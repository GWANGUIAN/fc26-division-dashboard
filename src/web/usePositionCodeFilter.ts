import { useMemo, useState } from "react";
import type { StreamerRecord } from "../shared/model.js";
import { ALL_POSITION_CODES } from "../shared/position-theme.js";

/** Position-code multi-select filter state, shared by the main board
 * (ControlsBar) and 우왁굳의 메모장 modal — each instance scoped to its own
 * streamer population, since "which codes actually have a candidate right
 * now" differs between them.
 *
 * `null` internally means "no filter customized yet" (== every code that's
 * actually in use), which self-adjusts as the underlying streamer list
 * changes instead of going stale the way a snapshot of "all codes selected"
 * captured at one point in time would. */
export function usePositionCodeFilter(streamers: StreamerRecord[]) {
  const [customSelection, setCustomSelection] = useState<string[] | null>(
    null,
  );

  const availablePositionCodes = useMemo(() => {
    const codes = new Set<string>();
    for (const streamer of streamers) {
      if (streamer.hopedPosition1) codes.add(streamer.hopedPosition1.toUpperCase());
      if (streamer.hopedPosition2) codes.add(streamer.hopedPosition2.toUpperCase());
    }
    return ALL_POSITION_CODES.filter((code) => codes.has(code));
  }, [streamers]);

  const isAllPositionsSelected = customSelection === null;
  const selectedPositions = customSelection ?? availablePositionCodes;
  const selectedPositionSet = useMemo(
    () => new Set(selectedPositions),
    [selectedPositions],
  );

  function setSelectedPositions(codes: string[]) {
    const codesSet = new Set(codes);
    const matchesAllAvailable =
      codes.length >= availablePositionCodes.length &&
      availablePositionCodes.every((code) => codesSet.has(code));
    setCustomSelection(matchesAllAvailable ? null : codes);
  }

  return {
    selectedPositions,
    setSelectedPositions,
    selectedPositionSet,
    availablePositionCodes,
    isAllPositionsSelected,
  };
}
