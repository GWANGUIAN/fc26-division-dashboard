import { FORMATIONS, getFormation } from "./formations.js";
import { remapPlacementsToFormation } from "./formationRemap.js";
import { reconcileAllSquads } from "./reconcile.js";
import { createId } from "./storage.js";
import type { Squad, SlotOffset, SquadBuilderState } from "./types.js";

/**
 * Margin from the pitch edge a nudged card's center may not cross, in pitch
 * %. Lets a card be dragged across virtually the whole pitch (not just a
 * small range around its formation slot) while still keeping it visibly on
 * the field.
 */
export const PITCH_EDGE_MARGIN_PCT = 4;

/**
 * Clamps a slot's manual offset so the card's resulting absolute position
 * (slot position + offset) stays within the pitch edges. Takes the slot's
 * own base xPct/yPct since the allowed offset range depends on where the
 * slot already sits (e.g. a slot near x=90 can only be nudged a little
 * further right before hitting the edge, but can move much further left).
 */
export function clampSlotOffset(
  slotXPct: number,
  slotYPct: number,
  dxPct: number,
  dyPct: number,
): SlotOffset {
  const min = PITCH_EDGE_MARGIN_PCT;
  const max = 100 - PITCH_EDGE_MARGIN_PCT;
  const clampedX = Math.max(min, Math.min(max, slotXPct + dxPct));
  const clampedY = Math.max(min, Math.min(max, slotYPct + dyPct));
  return { dxPct: clampedX - slotXPct, dyPct: clampedY - slotYPct };
}

export type SquadBuilderAction =
  | { type: "ADD_SQUAD"; name?: string; candidateOrder?: string[] }
  | { type: "RENAME_SQUAD"; squadId: string; name: string }
  | { type: "DELETE_SQUAD"; squadId: string }
  | { type: "SELECT_SQUAD"; squadId: string }
  | { type: "SET_FORMATION"; squadId: string; formationId: string }
  | {
      type: "PLACE_CANDIDATE";
      squadId: string;
      streamerId: string;
      slotId: string;
    }
  | {
      type: "MOVE_PLACED";
      squadId: string;
      fromSlotId: string;
      toSlotId: string;
    }
  | { type: "RETURN_TO_CANDIDATES"; squadId: string; streamerId: string }
  | { type: "SWAP_CANDIDATES"; squadId: string; idA: string; idB: string }
  | { type: "SORT_CANDIDATES"; squadId: string; order: string[] }
  | {
      type: "MOVE_CANDIDATE";
      squadId: string;
      streamerId: string;
      toIndex: number;
    }
  | {
      type: "RECONCILE_ROSTER";
      liveStreamerIds: string[];
      /** Newly-discovered ids to put at the front of candidateOrder instead of the end. */
      frontStreamerIds?: string[];
    }
  | {
      type: "NUDGE_SLOT";
      squadId: string;
      slotId: string;
      /** The slot's own formation position, needed to clamp against the pitch edges. */
      slotXPct: number;
      slotYPct: number;
      dxPct: number;
      dyPct: number;
    }
  | { type: "RESET_SLOT_OFFSETS"; squadId: string };

function updateSquad(
  state: SquadBuilderState,
  squadId: string,
  updater: (squad: Squad) => Squad,
): SquadBuilderState {
  let changed = false;
  const squads = state.squads.map((squad) => {
    if (squad.id !== squadId) return squad;
    const next = updater(squad);
    if (next !== squad) changed = true;
    return next;
  });
  return changed ? { ...state, squads } : state;
}

export function squadBuilderReducer(
  state: SquadBuilderState,
  action: SquadBuilderAction,
): SquadBuilderState {
  switch (action.type) {
    case "ADD_SQUAD": {
      const squad: Squad = {
        id: createId(),
        name: action.name?.trim() || `새 스쿼드 ${state.squads.length + 1}`,
        formationId: FORMATIONS[0].id,
        placements: [],
        candidateOrder: action.candidateOrder ?? [],
        slotOffsets: {},
      };
      return {
        ...state,
        squads: [...state.squads, squad],
        activeSquadId: squad.id,
      };
    }
    case "RENAME_SQUAD": {
      const name = action.name.trim();
      if (!name) return state;
      return updateSquad(state, action.squadId, (squad) =>
        squad.name === name ? squad : { ...squad, name },
      );
    }
    case "DELETE_SQUAD": {
      if (state.squads.length <= 1) return state;
      const squads = state.squads.filter(
        (squad) => squad.id !== action.squadId,
      );
      if (squads.length === state.squads.length) return state;
      const activeSquadId =
        state.activeSquadId === action.squadId
          ? squads[0].id
          : state.activeSquadId;
      return { ...state, squads, activeSquadId };
    }
    case "SELECT_SQUAD": {
      if (state.activeSquadId === action.squadId) return state;
      if (!state.squads.some((squad) => squad.id === action.squadId))
        return state;
      return { ...state, activeSquadId: action.squadId };
    }
    case "SET_FORMATION": {
      return updateSquad(state, action.squadId, (squad) => {
        if (squad.formationId === action.formationId) return squad;
        const fromFormation = getFormation(squad.formationId);
        const toFormation = getFormation(action.formationId);
        const { placements, returnedToCandidateIds } =
          remapPlacementsToFormation(
            squad.placements,
            fromFormation,
            toFormation,
          );
        return {
          ...squad,
          formationId: action.formationId,
          placements,
          candidateOrder: [...squad.candidateOrder, ...returnedToCandidateIds],
          // A new formation's slots sit at different coordinates, so any
          // manual nudges made under the old formation no longer apply —
          // cards fall back to the new formation's default positions.
          slotOffsets: {},
        };
      });
    }
    case "PLACE_CANDIDATE": {
      return updateSquad(state, action.squadId, (squad) => {
        if (!squad.candidateOrder.includes(action.streamerId)) return squad;
        const occupant = squad.placements.find(
          (placement) => placement.slotId === action.slotId,
        );
        const placements = squad.placements
          .filter((placement) => placement.slotId !== action.slotId)
          .concat({ slotId: action.slotId, streamerId: action.streamerId });
        const candidateOrder = squad.candidateOrder.filter(
          (id) => id !== action.streamerId,
        );
        if (occupant) candidateOrder.push(occupant.streamerId);
        return { ...squad, placements, candidateOrder };
      });
    }
    case "MOVE_PLACED": {
      return updateSquad(state, action.squadId, (squad) => {
        if (action.fromSlotId === action.toSlotId) return squad;
        const fromPlacement = squad.placements.find(
          (placement) => placement.slotId === action.fromSlotId,
        );
        if (!fromPlacement) return squad;
        const toPlacement = squad.placements.find(
          (placement) => placement.slotId === action.toSlotId,
        );
        const placements = squad.placements.map((placement) => {
          if (placement.slotId === action.fromSlotId) {
            return { ...placement, slotId: action.toSlotId };
          }
          if (toPlacement && placement.slotId === action.toSlotId) {
            return { ...placement, slotId: action.fromSlotId };
          }
          return placement;
        });
        return { ...squad, placements };
      });
    }
    case "RETURN_TO_CANDIDATES": {
      return updateSquad(state, action.squadId, (squad) => {
        const placement = squad.placements.find(
          (entry) => entry.streamerId === action.streamerId,
        );
        if (!placement) return squad;
        return {
          ...squad,
          placements: squad.placements.filter(
            (entry) => entry.streamerId !== action.streamerId,
          ),
          candidateOrder: [...squad.candidateOrder, action.streamerId],
        };
      });
    }
    case "SWAP_CANDIDATES": {
      return updateSquad(state, action.squadId, (squad) => {
        const indexA = squad.candidateOrder.indexOf(action.idA);
        const indexB = squad.candidateOrder.indexOf(action.idB);
        if (indexA === -1 || indexB === -1 || indexA === indexB) return squad;
        const candidateOrder = [...squad.candidateOrder];
        [candidateOrder[indexA], candidateOrder[indexB]] = [
          candidateOrder[indexB],
          candidateOrder[indexA],
        ];
        return { ...squad, candidateOrder };
      });
    }
    case "SORT_CANDIDATES": {
      return updateSquad(state, action.squadId, (squad) => {
        const current = new Set(squad.candidateOrder);
        const sorted = action.order.filter((id) => current.has(id));
        const missing = squad.candidateOrder.filter(
          (id) => !sorted.includes(id),
        );
        return { ...squad, candidateOrder: [...sorted, ...missing] };
      });
    }
    case "MOVE_CANDIDATE": {
      return updateSquad(state, action.squadId, (squad) => {
        const fromIndex = squad.candidateOrder.indexOf(action.streamerId);
        if (fromIndex === -1) return squad;
        const candidateOrder = [...squad.candidateOrder];
        candidateOrder.splice(fromIndex, 1);
        const clampedIndex = Math.max(
          0,
          Math.min(action.toIndex, candidateOrder.length),
        );
        candidateOrder.splice(clampedIndex, 0, action.streamerId);
        return { ...squad, candidateOrder };
      });
    }
    case "RECONCILE_ROSTER": {
      const squads = reconcileAllSquads(
        state.squads,
        action.liveStreamerIds,
        action.frontStreamerIds,
      );
      const changed = squads.some((squad, index) => squad !== state.squads[index]);
      return changed ? { ...state, squads } : state;
    }
    case "NUDGE_SLOT": {
      return updateSquad(state, action.squadId, (squad) => ({
        ...squad,
        slotOffsets: {
          ...squad.slotOffsets,
          [action.slotId]: clampSlotOffset(
            action.slotXPct,
            action.slotYPct,
            action.dxPct,
            action.dyPct,
          ),
        },
      }));
    }
    case "RESET_SLOT_OFFSETS": {
      return updateSquad(state, action.squadId, (squad) => {
        if (!squad.slotOffsets || Object.keys(squad.slotOffsets).length === 0) {
          return squad;
        }
        return { ...squad, slotOffsets: {} };
      });
    }
    default:
      return state;
  }
}
