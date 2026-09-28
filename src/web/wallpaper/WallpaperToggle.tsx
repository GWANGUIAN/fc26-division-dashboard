import { useState } from "react";
import { Image } from "lucide-react";
import "./wallpaper-toggle.css";
import { hasDiscoveredWallpaper, markWallpaperDiscovered } from "./wallpaperStorage";

// Sits right after MinigameMenu(심심풀이) in .bottom-left-toolbar (App.tsx). Same
// first-visit speech-bubble pattern as PlaylistToggle, gray-toned instead of
// PlaylistToggle's white so the two buttons read as distinct at a glance.
export function WallpaperToggle({ onClick }: { onClick: () => void }) {
  const [discovered, setDiscovered] = useState(() => hasDiscoveredWallpaper());

  function handleClick() {
    if (!discovered) {
      markWallpaperDiscovered();
      setDiscovered(true);
    }
    onClick();
  }

  return (
    <button
      type="button"
      className={`wallpaper-toggle${discovered ? "" : " wallpaper-toggle--new"}`}
      onClick={handleClick}
      aria-label="잔디동 월페이퍼 열기"
    >
      <Image aria-hidden="true" />
      <span>잔디동 월페이퍼</span>
      {!discovered && (
        <span className="wallpaper-toggle__badge" aria-hidden="true">
          잔디동 월페이퍼를 구경해보세요
        </span>
      )}
    </button>
  );
}
