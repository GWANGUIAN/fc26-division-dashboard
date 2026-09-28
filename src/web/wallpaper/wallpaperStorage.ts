// First-visit highlight flag for WallpaperToggle — same pattern as
// playlistStorage.ts's hasDiscoveredPlaylist/markPlaylistDiscovered, but its
// own key so the discovery states stay independent.
const WALLPAPER_DISCOVERED_KEY = "fc26-wallpaper-discovered-v1";

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

/** True once the visitor has opened the 잔디동 월페이퍼 popup at least once. */
export function hasDiscoveredWallpaper(): boolean {
  return readStorage(WALLPAPER_DISCOVERED_KEY) === "1";
}

export function markWallpaperDiscovered() {
  writeStorage(WALLPAPER_DISCOVERED_KEY, "1");
}
