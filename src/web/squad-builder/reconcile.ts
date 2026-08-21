import type { Squad } from "./types.js";

/**
 * Drops placements/candidates for streamers no longer in the live roster,
 * and adds any streamer the squad has never seen before to the candidate
 * list — ids in `frontIds` (e.g. newly created custom players) are put at
 * the very front, everything else is appended to the end, as before.
 * Returns the same object when nothing changed, so callers can cheaply skip
 * re-renders.
 */
export function reconcileRosterChange(
  squad: Squad,
  liveStreamerIds: Set<string>,
  frontIds: Set<string> = new Set(),
): Squad {
  const placements = squad.placements.filter((placement) =>
    liveStreamerIds.has(placement.streamerId),
  );
  const placedIds = new Set(placements.map((placement) => placement.streamerId));
  const candidateOrder = squad.candidateOrder.filter(
    (id) => liveStreamerIds.has(id) && !placedIds.has(id),
  );
  const knownIds = new Set([...placedIds, ...candidateOrder]);
  const newIds = [...liveStreamerIds].filter((id) => !knownIds.has(id));
  const newFrontIds = newIds.filter((id) => frontIds.has(id));
  const newEndIds = newIds.filter((id) => !frontIds.has(id));

  const unchanged =
    placements.length === squad.placements.length &&
    candidateOrder.length === squad.candidateOrder.length &&
    newIds.length === 0;
  if (unchanged) return squad;

  return {
    ...squad,
    placements,
    candidateOrder: [...newFrontIds, ...candidateOrder, ...newEndIds],
  };
}

export function reconcileAllSquads(
  squads: Squad[],
  liveStreamerIds: string[],
  frontStreamerIds: string[] = [],
): Squad[] {
  const idSet = new Set(liveStreamerIds);
  const frontIdSet = new Set(frontStreamerIds);
  return squads.map((squad) => reconcileRosterChange(squad, idSet, frontIdSet));
}
