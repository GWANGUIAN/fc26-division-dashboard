import type { PassAnnouncementState } from "./types.js";

const PASS_ANNOUNCEMENT_STORAGE_KEY = "fc26-pass-announcement-v1";
const SCHEMA_VERSION = 1;

function createDefaultState(): PassAnnouncementState {
  return { schemaVersion: SCHEMA_VERSION, passList: [] };
}

function isValidState(value: unknown): value is PassAnnouncementState {
  if (!value || typeof value !== "object") return false;
  const state = value as PassAnnouncementState;
  return (
    state.schemaVersion === SCHEMA_VERSION &&
    Array.isArray(state.passList) &&
    state.passList.every(
      (entry) =>
        entry &&
        typeof entry.streamerId === "string" &&
        typeof entry.revealed === "boolean",
    )
  );
}

export function loadPassAnnouncementState(): PassAnnouncementState {
  try {
    const raw = localStorage.getItem(PASS_ANNOUNCEMENT_STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw) as unknown;
    return isValidState(parsed) ? parsed : createDefaultState();
  } catch {
    return createDefaultState();
  }
}

export function savePassAnnouncementState(state: PassAnnouncementState) {
  try {
    localStorage.setItem(PASS_ANNOUNCEMENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota/private-browsing errors */
  }
}
