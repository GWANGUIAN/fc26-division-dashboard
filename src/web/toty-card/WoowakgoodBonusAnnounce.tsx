import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Sparkles } from "lucide-react";
import { hexToRgba } from "../cardVisuals";

// Same peridot green as WoowakgoodBonusButton/totyCardTheme.ts's
// `woowakgood` entry — keeps the whole "you found the hidden card" moment
// (announcement → floating button → card itself) visually one identity.
const FANCY_COLOR = "#7fdca4";

// Deliberately its own bigger, longer-lived, more animated banner instead
// of routing through the shared useToast()/.toast used everywhere else in
// the app — that one is a small, brief, generic confirmation ("복사되었습니다"
// etc.), and stretching it to also cover a rare, celebratory achievement
// would either make every plain toast bigger/longer or need a one-off
// variant prop bolted onto a component nothing else needs. This is shown
// twice as long (VISIBLE_MS) and reads more like the reveal-popup's own
// fancy treatment than a routine notification.
const VISIBLE_MS = 4200;
const EXIT_MS = 350;

/** Fired once by useWoowakgoodBonusUnlock's onUnlock callback — the caller
 * (App.tsx) mounts this and unmounts it again via onDone once the exit
 * animation finishes. */
export function WoowakgoodBonusAnnounce({ onDone }: { onDone: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setExiting(true), VISIBLE_MS);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!exiting) return;
    const exitTimer = setTimeout(onDone, EXIT_MS);
    return () => clearTimeout(exitTimer);
  }, [exiting, onDone]);

  return (
    <div
      className={`woowakgood-bonus-announce${exiting ? " woowakgood-bonus-announce--exiting" : ""}`}
      role="status"
      style={
        {
          "--fancy-color": FANCY_COLOR,
          "--fancy-glow-soft": hexToRgba(FANCY_COLOR, 0.4),
          "--fancy-glow-strong": hexToRgba(FANCY_COLOR, 0.85),
        } as CSSProperties
      }
    >
      <span className="view-toggle-card__sparks" aria-hidden="true">
        <i className="view-toggle-card__spark view-toggle-card__spark--1">✦</i>
        <i className="view-toggle-card__spark view-toggle-card__spark--2">✦</i>
        <i className="view-toggle-card__spark view-toggle-card__spark--3">✦</i>
        <i className="view-toggle-card__spark view-toggle-card__spark--4">✦</i>
        <i className="view-toggle-card__spark view-toggle-card__spark--5">✦</i>
      </span>
      <Sparkles aria-hidden="true" />
      <span>모든 3D 카드를 확인했어요! 숨겨진 카드가 나타났습니다</span>
    </div>
  );
}
