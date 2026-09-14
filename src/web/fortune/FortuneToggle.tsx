import { useState } from "react";
import type { CSSProperties } from "react";
import { Sparkles } from "lucide-react";
// Renders immediately on page load (unlike FortunePopup), so its styles need to be in a
// stylesheet loaded with the main bundle — same reasoning as CardMatchToggle's own split css file.
import "./fortune-toggle.css";
import { getFortuneCardBackUrl } from "./fortuneCardAssets";
import { hexToRgba } from "../cardVisuals";
import { hasOpenedFortune, markFortuneOpened } from "../storage";

// Same mint accent + "view-toggle-card" attention treatment used elsewhere
// for "look here, you haven't tried this yet" prompts (PhotoBoothTrigger,
// growth-graph-toggle) — a full background color flip plus twinkling
// sparks reads as much more noticeable than a subtle brightness pulse,
// which is the whole point here.
const FANCY_COLOR = "#00e9ae";

export function FortuneToggle({ onClick }: { onClick: () => void }) {
  const backUrl = getFortuneCardBackUrl();
  const [opened, setOpened] = useState(() => hasOpenedFortune());

  function handleClick() {
    if (!opened) {
      markFortuneOpened();
      setOpened(true);
    }
    onClick();
  }

  return (
    <button
      type="button"
      className={`fortune-toggle ${opened ? "" : "fancy-border view-toggle-card--attention"}`}
      onClick={handleClick}
      aria-label="오늘의 운세 뽑기 열기"
      style={
        opened
          ? undefined
          : ({
              "--fancy-color": FANCY_COLOR,
              "--fancy-glow-soft": hexToRgba(FANCY_COLOR, 0.4),
              "--fancy-glow-strong": hexToRgba(FANCY_COLOR, 0.85),
            } as CSSProperties)
      }
    >
      {backUrl ? (
        <img src={backUrl} alt="" className="fortune-toggle__icon" />
      ) : (
        <Sparkles aria-hidden="true" className="fortune-toggle__icon fortune-toggle__icon--fallback" />
      )}
      <span className="fortune-toggle__label">오늘의 운세 뽑기</span>
      {!opened && (
        <span className="view-toggle-card__sparks" aria-hidden="true">
          <i className="view-toggle-card__spark view-toggle-card__spark--1">✦</i>
          <i className="view-toggle-card__spark view-toggle-card__spark--2">✦</i>
          <i className="view-toggle-card__spark view-toggle-card__spark--3">✦</i>
          <i className="view-toggle-card__spark view-toggle-card__spark--4">✦</i>
          <i className="view-toggle-card__spark view-toggle-card__spark--5">✦</i>
        </span>
      )}
    </button>
  );
}
