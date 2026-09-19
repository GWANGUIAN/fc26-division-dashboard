import type { CSSProperties } from "react";
import { COACH_DONE, COACH_STEPS } from "../state/coach";
import { getWorldAssetUrl } from "../worldAssets";

const KEYS: Record<string, string[]> = {
  move: ["W", "A", "S", "D", "Shift"],
  talk: ["E"],
  log: ["J", "Esc"],
};

/**
 * Tutorial bubble C1–C3 (docs/world/02 §4), top-centre of the stage. It never captures the keyboard, so
 * the player can keep walking while it is up; Esc (handled by the overlay) skips the guide.
 */
export function CoachMarks({ step }: { step: number }) {
  if (step >= COACH_DONE) return null;
  const def = COACH_STEPS[step];
  const frame = getWorldAssetUrl("ui/coach-frame");
  const style = frame ? ({ "--frame-coach": `url(${frame})` } as CSSProperties) : undefined;
  return (
    <div className={`world-coach${frame ? " world-coach--art" : ""}`} style={style} role="status" aria-live="polite">
      <span className="world-coach__step">{step + 1}/{COACH_STEPS.length}</span>
      <p className="world-coach__text">{def.text}</p>
      {def.hint && <p className="world-coach__hint">{def.hint}</p>}
      <p className="world-coach__keys" aria-hidden="true">
        {KEYS[def.id].map((key) => (
          <kbd key={key} className="world-key">{key}</kbd>
        ))}
        <span className="world-coach__skip">Esc 건너뛰기</span>
      </p>
    </div>
  );
}
