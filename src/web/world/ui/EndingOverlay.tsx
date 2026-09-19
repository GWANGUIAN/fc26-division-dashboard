import { useEffect, useRef } from "react";

// The ending cut's own screens (docs/world/02 §9): the banner over the blooming golden grass, and the
// credits-style card that closes the story. Both are plain DOM over the canvas; the photo in between is the
// existing group-photo overlay.

export type EndingCardStage = "bloom" | "credits";

interface EndingOverlayProps {
  stage: EndingCardStage;
  /** Credits: one line at a time, the last one large. */
  lines: readonly string[];
  /** Credits are over (all lines shown, or the player skipped). */
  onDone: () => void;
}

const CONFIRM_CODES = new Set(["KeyE", "Space", "Enter", "NumpadEnter"]);
/** Seconds each credits line takes to appear, and how long the last one stays. */
export const CREDIT_LINE_SECONDS = 2.2;
export const CREDIT_HOLD_SECONDS = 2.4;

/** How long the credits card runs before it closes by itself. */
export const creditsSeconds = (lineCount: number) => lineCount * CREDIT_LINE_SECONDS + CREDIT_HOLD_SECONDS;

export function EndingOverlay({ stage, lines, onDone }: EndingOverlayProps) {
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (stage !== "credits") return;
    const timer = window.setTimeout(() => doneRef.current(), creditsSeconds(lines.length) * 1000);
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey || !CONFIRM_CODES.has(event.code)) return;
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) doneRef.current();
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [stage, lines.length]);

  if (stage === "bloom") {
    return (
      <div className="world-ending world-ending--bloom" aria-live="polite">
        <p className="world-ending__banner world-ending__banner--first">제초 코어가 멈췄다!</p>
        <p className="world-ending__banner world-ending__banner--second">황금 잔디가 활짝 피었다!</p>
      </div>
    );
  }

  const last = lines.length - 1;
  return (
    <div className="world-ending world-ending--credits" role="status" onClick={onDone}>
      {lines.map((line, index) => (
        <p
          key={line}
          className={`world-ending__line${index === last ? " world-ending__line--last" : ""}`}
          style={{ animationDelay: `${index * CREDIT_LINE_SECONDS}s` }}
        >
          {line}
        </p>
      ))}
      <p className="world-ending__hint">E · Enter · Esc 건너뛰기</p>
    </div>
  );
}
