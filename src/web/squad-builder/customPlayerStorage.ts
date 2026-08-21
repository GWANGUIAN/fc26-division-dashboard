import type { CustomPlayer } from "./customPlayerTypes.js";

const CUSTOM_PLAYERS_STORAGE_KEY = "fc26-custom-players-v1";

/**
 * Seeded once for anyone who has never touched custom players (no key in
 * localStorage yet). Not re-applied after that — once `saveCustomPlayers`
 * has written anything (including `[]`, e.g. after deleting this entry),
 * `loadCustomPlayers` always reflects what's actually stored.
 */
const DEFAULT_CUSTOM_PLAYERS: CustomPlayer[] = [
  {
    id: "custom-default-wakgood",
    name: "우왁굳",
    division: 1,
    staticPhotoUrl: "/profiles/profile_wakgood.webp",
    isFancy: true,
  },
];

function isCustomPlayer(value: unknown): value is CustomPlayer {
  if (!value || typeof value !== "object") return false;
  const player = value as CustomPlayer;
  return typeof player.id === "string" && typeof player.name === "string";
}

export function loadCustomPlayers(): CustomPlayer[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PLAYERS_STORAGE_KEY);
    if (!raw) return DEFAULT_CUSTOM_PLAYERS;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_CUSTOM_PLAYERS;
    return parsed.filter(isCustomPlayer);
  } catch {
    return DEFAULT_CUSTOM_PLAYERS;
  }
}

export function saveCustomPlayers(players: CustomPlayer[]) {
  try {
    localStorage.setItem(CUSTOM_PLAYERS_STORAGE_KEY, JSON.stringify(players));
  } catch {
    /* ignore quota/private-browsing errors */
  }
}
