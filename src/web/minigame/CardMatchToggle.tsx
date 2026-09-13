import { useEffect } from "react";
// Renders immediately on page load (unlike CardMatchModal), so its styles need to be in a
// stylesheet loaded with the main bundle — same reasoning as FreekickToggle's own split css file.
import "./card-match-toggle.css";
import { getCardMatchBackUrl } from "./cardMatchAssets.js";

const WARMUP_SFX_URLS = [
  "/sfxes/card-match-flip.mp3",
  "/sfxes/card-match-success.mp3",
  "/sfxes/card-match-fail.mp3",
  "/sfxes/card-match-victory.mp3",
];

export function CardMatchToggle({ onClick }: { onClick: () => void }) {
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

  const backUrl = getCardMatchBackUrl();

  return (
    <button type="button" className="cardmatch-toggle" onClick={onClick} aria-label="카드 짝 맞추기 미니게임 열기">
      {backUrl ? (
        <img src={backUrl} alt="" className="cardmatch-toggle__icon" />
      ) : (
        <span className="cardmatch-toggle__icon cardmatch-toggle__icon--fallback" aria-hidden="true">
          🃏
        </span>
      )}
    </button>
  );
}
