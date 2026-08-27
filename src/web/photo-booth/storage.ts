import type { PhotoBoothState } from "./types.js";

const PHOTO_BOOTH_STATE_STORAGE_KEY = "fc26-photo-booth-v1";
const SCHEMA_VERSION = 1;

function createDefaultState(): PhotoBoothState {
  return { schemaVersion: SCHEMA_VERSION };
}

function isValidState(value: unknown): value is PhotoBoothState {
  if (!value || typeof value !== "object") return false;
  const state = value as PhotoBoothState;
  return (
    state.schemaVersion === SCHEMA_VERSION &&
    (state.selectedStreamerId === undefined ||
      typeof state.selectedStreamerId === "string") &&
    (state.directorVisible === undefined ||
      typeof state.directorVisible === "boolean")
  );
}

export function loadPhotoBoothState(): PhotoBoothState {
  try {
    const raw = localStorage.getItem(PHOTO_BOOTH_STATE_STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw) as unknown;
    return isValidState(parsed) ? parsed : createDefaultState();
  } catch {
    return createDefaultState();
  }
}

export function savePhotoBoothState(state: PhotoBoothState) {
  try {
    localStorage.setItem(PHOTO_BOOTH_STATE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota/private-browsing errors */
  }
}
