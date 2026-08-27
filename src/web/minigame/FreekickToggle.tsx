import { useEffect } from "react";
// FreekickToggle renders immediately on page load (unlike FreekickModal, which is lazy-loaded),
// so its styles need to be in a stylesheet that loads with the main bundle — importing them from
// the modal's lazy-loaded freekick.css meant the button had no sizing/layout applied at all until
// the modal's chunk loaded, rendering the raw goalpost image at its full native pixel size.
import "./freekick-toggle.css";

// Warming these up while the toggle sits idle on the dashboard means the browser has already
// fetched and decoded them by the time the modal opens, same rationale as KickupsToggle's warmup.
const WARMUP_SFX_URLS = [
  "/sfxes/ball-bounce.mp3",
  "/sfxes/goal.mp3",
  "/sfxes/game-over.mp3",
  "/sfxes/background-freekick.mp3",
];

export function FreekickToggle({ onClick }: { onClick: () => void }) {
  useEffect(() => {
    const warmups = WARMUP_SFX_URLS.map((src) => {
      const audio = new Audio();
      audio.preload = "auto";
      audio.src = src;
      return audio;
    });
    return () => {
      warmups.forEach((audio) => {
        audio.src = "";
      });
    };
  }, []);

  return (
    <button type="button" className="freekick-toggle" onClick={onClick} aria-label="3D 프리킥 미니게임 열기">
      <img src="/goalpost.webp" alt="" className="freekick-toggle__icon" />
    </button>
  );
}
