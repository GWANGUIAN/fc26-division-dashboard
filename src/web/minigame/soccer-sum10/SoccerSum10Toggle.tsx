import { useEffect } from "react";
import "./soccer-sum10-toggle.css";

const WARMUP_URLS = [
  "/soccer-sum10-bgm.mp3",
  "/sfxes/soccer-sum10-start.mp3",
  "/sfxes/soccer-sum10-clear.mp3",
  "/sfxes/soccer-sum10-timeup.mp3",
];

export function SoccerSum10Toggle({ onClick }: { onClick: () => void }) {
  useEffect(() => {
    const warmups = WARMUP_URLS.map((src) => {
      const audio = new Audio();
      audio.preload = "auto";
      audio.src = src;
      return audio;
    });
    return () => warmups.forEach((audio) => { audio.src = ""; });
  }, []);

  return (
    <button type="button" className="soccer-sum10-toggle" onClick={onClick} aria-label="축구공 사과게임 열기">
      <img src="/soccer-sum10-icon.webp" alt="" className="soccer-sum10-toggle__icon" />
    </button>
  );
}
