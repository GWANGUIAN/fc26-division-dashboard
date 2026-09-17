import type { GroupPhotoState } from "./types.js";

const GROUP_PHOTO_STATE_STORAGE_KEY = "fc26-group-photo-state-v1";
const SCHEMA_VERSION = 1;

function createDefaultState(): GroupPhotoState {
  return { schemaVersion: SCHEMA_VERSION };
}

function isValidState(value: unknown): value is GroupPhotoState {
  if (!value || typeof value !== "object") return false;
  const state = value as GroupPhotoState;
  return (
    state.schemaVersion === SCHEMA_VERSION &&
    (state.selectedStreamerId === undefined || typeof state.selectedStreamerId === "string")
  );
}

export function loadGroupPhotoState(): GroupPhotoState {
  try {
    const raw = localStorage.getItem(GROUP_PHOTO_STATE_STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw) as unknown;
    return isValidState(parsed) ? parsed : createDefaultState();
  } catch {
    return createDefaultState();
  }
}

export function saveGroupPhotoState(state: GroupPhotoState) {
  try {
    localStorage.setItem(GROUP_PHOTO_STATE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota/private-browsing errors */
  }
}
