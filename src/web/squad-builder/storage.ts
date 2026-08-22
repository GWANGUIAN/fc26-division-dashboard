import { DEFAULT_FORMATION_ID, FORMATIONS, getFormation } from "./formations.js";
import { remapPlacementsToFormation } from "./formationRemap.js";
import { LEGACY_FORMATIONS } from "./legacyFormations.js";
import type { Squad, SquadBuilderState } from "./types.js";

const SQUAD_BUILDER_STORAGE_KEY = "fc26-squad-builder-v1";
const SCHEMA_VERSION = 1;

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createDefaultSquad(): Squad {
  return {
    id: createId(),
    name: "기본",
    formationId: DEFAULT_FORMATION_ID,
    placements: [],
    candidateOrder: [],
    slotOffsets: {},
  };
}

function createDefaultState(): SquadBuilderState {
  const squad = createDefaultSquad();
  return {
    schemaVersion: SCHEMA_VERSION,
    squads: [squad],
    activeSquadId: squad.id,
  };
}

function isValidState(value: unknown): value is SquadBuilderState {
  if (!value || typeof value !== "object") return false;
  const state = value as SquadBuilderState;
  return (
    state.schemaVersion === SCHEMA_VERSION &&
    Array.isArray(state.squads) &&
    state.squads.length > 0 &&
    typeof state.activeSquadId === "string"
  );
}

/**
 * Remaps a squad saved under a formation id that no longer exists (e.g. a
 * "(2)"/"(3)" variant collapsed into its base formation) onto the
 * surviving formation, so previously-placed streamers reappear on the pitch
 * (or fall back to the candidate pool) instead of silently disappearing.
 */
function migrateSquad(squad: Squad): Squad {
  if (FORMATIONS.some((formation) => formation.id === squad.formationId)) {
    return squad;
  }
  const legacy = LEGACY_FORMATIONS[squad.formationId];
  if (!legacy) {
    return {
      ...squad,
      formationId: DEFAULT_FORMATION_ID,
      placements: [],
      candidateOrder: [
        ...squad.candidateOrder,
        ...squad.placements.map((placement) => placement.streamerId),
      ],
      slotOffsets: {},
    };
  }
  const toFormation = getFormation(legacy.baseId);
  const { placements, returnedToCandidateIds } = remapPlacementsToFormation(
    squad.placements,
    legacy.preset,
    toFormation,
  );
  return {
    ...squad,
    formationId: toFormation.id,
    placements,
    candidateOrder: [...squad.candidateOrder, ...returnedToCandidateIds],
    slotOffsets: {},
  };
}

function migrateState(state: SquadBuilderState): SquadBuilderState {
  const squads = state.squads.map(migrateSquad);
  const changed = squads.some((squad, index) => squad !== state.squads[index]);
  return changed ? { ...state, squads } : state;
}

export function loadSquadBuilderState(): SquadBuilderState {
  try {
    const raw = localStorage.getItem(SQUAD_BUILDER_STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw) as unknown;
    return isValidState(parsed) ? migrateState(parsed) : createDefaultState();
  } catch {
    return createDefaultState();
  }
}

export function saveSquadBuilderState(state: SquadBuilderState) {
  try {
    localStorage.setItem(SQUAD_BUILDER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota/private-browsing errors */
  }
}
