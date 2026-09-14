import { useState } from "react";
import { Sparkles } from "lucide-react";
// Renders immediately on page load (unlike FortunePopup), so its styles need to be in a
// stylesheet loaded with the main bundle — same reasoning as CardMatchToggle's own split css file.
import "./fortune-toggle.css";
import { getFortuneCardBackUrl } from "./fortuneCardAssets";
import { hasOpenedFortune, markFortuneOpened } from "../storage";

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
      className={`fortune-toggle ${opened ? "" : "fortune-toggle--unopened"}`}
      onClick={handleClick}
      aria-label="오늘의 운세 뽑기 열기"
    >
      {backUrl ? (
        <img src={backUrl} alt="" className="fortune-toggle__icon" />
      ) : (
        <Sparkles aria-hidden="true" className="fortune-toggle__icon fortune-toggle__icon--fallback" />
      )}
      <span className="fortune-toggle__label">오늘의 운세 뽑기</span>
    </button>
  );
}
