import type { FormationPreset, FormationSlot, SquadPlacement } from "./types.js";

export interface FormationRemapResult {
  placements: SquadPlacement[];
  returnedToCandidateIds: string[];
}

function distance(a: FormationSlot, b: FormationSlot): number {
  return Math.hypot(a.xPct - b.xPct, a.yPct - b.yPct);
}

/**
 * Reassigns existing placements to the closest-matching slot in a new
 * formation (nearest-neighbor by pitch position), keeping the GK slot
 * carried over 1:1. Any placement that can't be matched (formation has
 * fewer slots than occupied) is reported so it can be returned to the
 * candidate list instead of being silently dropped.
 */
export function remapPlacementsToFormation(
  placements: SquadPlacement[],
  fromFormation: FormationPreset,
  toFormation: FormationPreset,
): FormationRemapResult {
  const oldSlotById = new Map(
    fromFormation.slots.map((slot) => [slot.id, slot]),
  );
  const result: SquadPlacement[] = [];
  const returnedToCandidateIds: string[] = [];
  const claimedNewSlotIds = new Set<string>();

  const gkPlacement = placements.find(
    (placement) => oldSlotById.get(placement.slotId)?.label === "GK",
  );
  const gkSlot = toFormation.slots.find((slot) => slot.label === "GK");
  if (gkPlacement) {
    if (gkSlot) {
      result.push({ slotId: gkSlot.id, streamerId: gkPlacement.streamerId });
      claimedNewSlotIds.add(gkSlot.id);
    } else {
      returnedToCandidateIds.push(gkPlacement.streamerId);
    }
  }

  const outfieldPlacements = placements.filter(
    (placement) => placement !== gkPlacement,
  );
  const outfieldNewSlots = toFormation.slots.filter(
    (slot) => slot.label !== "GK",
  );

  const pairs: { placement: SquadPlacement; slot: FormationSlot; dist: number }[] =
    [];
  for (const placement of outfieldPlacements) {
    const oldSlot = oldSlotById.get(placement.slotId);
    if (!oldSlot) continue;
    for (const slot of outfieldNewSlots) {
      pairs.push({ placement, slot, dist: distance(oldSlot, slot) });
    }
  }
  pairs.sort((a, b) => a.dist - b.dist);

  const claimedStreamerIds = new Set<string>();
  for (const pair of pairs) {
    if (claimedStreamerIds.has(pair.placement.streamerId)) continue;
    if (claimedNewSlotIds.has(pair.slot.id)) continue;
    result.push({
      slotId: pair.slot.id,
      streamerId: pair.placement.streamerId,
    });
    claimedStreamerIds.add(pair.placement.streamerId);
    claimedNewSlotIds.add(pair.slot.id);
  }

  for (const placement of outfieldPlacements) {
    if (!claimedStreamerIds.has(placement.streamerId)) {
      returnedToCandidateIds.push(placement.streamerId);
    }
  }

  return { placements: result, returnedToCandidateIds };
}
