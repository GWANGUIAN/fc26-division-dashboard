import { useEffect } from "react";
import type { CSSProperties } from "react";
import { Sparkles } from "lucide-react";
import { hexToRgba } from "../cardVisuals";
import { getTotyCardAssets, preloadTotyCardAssets } from "./totyCardAssets";
import { WOOWAKGOOD_ID } from "./woowakgoodBonusCard";

// Peridot green — matches totyCardTheme.ts's `woowakgood` entry, fed into
// the shared --fancy-color/--fancy-glow-* custom properties that drive the
// app's existing "you found something special" sparkle treatment (same
// view-toggle-card__spark twinkles PhotoBoothTrigger uses for its own
// undiscovered state) rather than a bespoke one-off style.
const FANCY_COLOR = "#7fdca4";

// Rounded-corner parallelogram outline (top edge shifted right relative to
// the bottom edge, both edges the same length — the defining difference
// from a trapezoid, whose two parallel edges differ in length) traced as an
// SVG path rather than CSS clip-path: clip-path alone can't also stroke a
// border along a non-rectangular shape, but an SVG <path> fills (the glass
// background) and strokes (the border) the same outline at once, with all
// 4 corners rounded via a quadratic curve through each sharp vertex.
// Coordinates are in the viewBox's own 248x48 unit space; the SVG stretches
// (preserveAspectRatio="none") to whatever size CSS gives the button, so
// the same path works for the smaller mobile size too.
const SHAPE_PATH =
  "M34 0 L238 0 Q248 0 243.53 8.94 L228.47 39.06 Q224 48 214 48 L10 48 Q0 48 4.47 39.06 L19.53 8.94 Q24 0 34 0 Z";

/** Floating top-right button shown only once useWoowakgoodBonusUnlock returns
 * true — opens the hidden 우왁굳 bonus card via the same TotyCardPopup every
 * other card uses. No internal gating here; the parent decides visibility. */
export function WoowakgoodBonusButton({ onOpen }: { onOpen: () => void }) {
  // This button only ever mounts once the bonus is unlocked (see
  // useWoowakgoodBonusUnlock) — its very appearance is a stronger "about to
  // click this" signal than a hover, so warm the card art immediately
  // rather than waiting for a hover/focus, same reasoning DetailModal uses
  // for its own toty card button.
  useEffect(() => {
    const assets = getTotyCardAssets(WOOWAKGOOD_ID);
    if (assets) preloadTotyCardAssets(assets, WOOWAKGOOD_ID);
  }, []);

  return (
    <button
      type="button"
      className="woowakgood-bonus-button"
      onClick={onOpen}
      aria-label="숨겨진 카드 보기"
      title="숨겨진 카드 보기"
      style={
        {
          "--fancy-color": FANCY_COLOR,
          "--fancy-glow-soft": hexToRgba(FANCY_COLOR, 0.4),
          "--fancy-glow-strong": hexToRgba(FANCY_COLOR, 0.85),
        } as CSSProperties
      }
    >
      <svg
        className="woowakgood-bonus-button__shape"
        viewBox="0 0 248 48"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d={SHAPE_PATH} />
      </svg>
      <span className="view-toggle-card__sparks" aria-hidden="true">
        <i className="view-toggle-card__spark view-toggle-card__spark--1">✦</i>
        <i className="view-toggle-card__spark view-toggle-card__spark--2">✦</i>
        <i className="view-toggle-card__spark view-toggle-card__spark--3">✦</i>
        <i className="view-toggle-card__spark view-toggle-card__spark--4">✦</i>
        <i className="view-toggle-card__spark view-toggle-card__spark--5">✦</i>
      </span>
      <span className="woowakgood-bonus-button__content">
        <Sparkles aria-hidden="true" />
        <span>숨겨진 카드 보기</span>
      </span>
    </button>
  );
}
