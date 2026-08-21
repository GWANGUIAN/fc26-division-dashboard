import { DEFAULT_FORMATION_ID } from "./formations.js";
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

export function loadSquadBuilderState(): SquadBuilderState {
  try {
    const raw = localStorage.getItem(SQUAD_BUILDER_STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw) as unknown;
    return isValidState(parsed) ? parsed : createDefaultState();
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
