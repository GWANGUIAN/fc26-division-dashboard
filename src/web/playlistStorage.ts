// First-visit highlight flag for PlaylistToggle — same pattern as world/storage.ts's
// isWorldDiscovered/markWorldDiscovered, but its own key so the two discovery states stay independent.
const PLAYLIST_DISCOVERED_KEY = "fc26-playlist-discovered-v1";

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore quota / private-browsing errors */
  }
}

/** True once the visitor has opened the 잔디동 플레이리스트 popup at least once. */
export function hasDiscoveredPlaylist(): boolean {
  return readStorage(PLAYLIST_DISCOVERED_KEY) === "1";
}

export function markPlaylistDiscovered() {
  writeStorage(PLAYLIST_DISCOVERED_KEY, "1");
}
