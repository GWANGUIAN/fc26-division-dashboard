import { useEffect } from "react";

// Warming these up while the toggle sits idle on the dashboard means the browser has already
// fetched and decoded them by the time the modal opens — measured ~50ms main-thread block
// otherwise happens right as the ball starts falling, because `new Audio(...).play()` forces
// that fetch/decode work synchronously into the same frame as the first physics step.
const WARMUP_SFX_URLS = [
  "/background-mini-game.mp3",
  "/sfxes/ball-bounce.mp3",
  "/sfxes/game-over.mp3",
  "/sfxes/doormomo.mp3",
];

export function KickupsToggle({ onClick }: { onClick: () => void }) {
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
    <button type="button" className="kickups-toggle" onClick={onClick} aria-label="키업스 미니게임 열기">
      <img src="/soccer_ball.webp" alt="" className="kickups-toggle__icon" />
    </button>
  );
}
