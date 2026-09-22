import { useState } from "react";
import { ListMusic } from "lucide-react";
import "./playlist-toggle.css";
import { hasDiscoveredPlaylist, markPlaylistDiscovered } from "./playlistStorage";

// Replaces the old MusicPlayer floating icon in the same bottom-right spot
// (docs/cover-loop-lab-next-implementation.md). Opens CoverLoopPlaylistOverlay.
export function PlaylistToggle({ onClick }: { onClick: () => void }) {
  const [discovered, setDiscovered] = useState(() => hasDiscoveredPlaylist());

  function handleClick() {
    if (!discovered) {
      markPlaylistDiscovered();
      setDiscovered(true);
    }
    onClick();
  }

  return (
    <button
      type="button"
      className={`playlist-toggle${discovered ? "" : " playlist-toggle--new"}`}
      onClick={handleClick}
      aria-label="잔디동 플레이리스트 열기"
    >
      <ListMusic aria-hidden="true" />
      <span>잔디동 플레이리스트</span>
      {!discovered && (
        <span className="playlist-toggle__badge" aria-hidden="true">
          잔디동 플레이리스트를 확인해보세요
        </span>
      )}
    </button>
  );
}
