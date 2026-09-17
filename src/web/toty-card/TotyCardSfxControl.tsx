import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

// Long enough that crossing the (deliberate, for a comfortable hit target)
// gap between the button and the popup below it never flashes it closed
// mid-transit, per user feedback that the plain CSS :hover/:focus-within
// version this used to be closed the instant the pointer left the button's
// own small hitbox (position: absolute takes the popup out of flow, so it
// never actually extends the wrapper's hoverable box down to cover it).
const SFX_POPUP_CLOSE_DELAY_MS = 1000;

/**
 * Local shortcut for the app-wide sfx setting (useSfxSettings.ts, same state
 * the floating toolbar's own SfxToggle in App.tsx controls) — lets the
 * viewer adjust every sound this popup plays (reveal stinger, whoosh,
 * popup-open sting, click sfx, variant-switch blip) without leaving the
 * popup. A dedicated component rather than reusing SfxControls.tsx's
 * SfxToggle: that one carries the app's green accent color (slider thumb,
 * popup border) built for the floating toolbar's own translucent-panel
 * look, which clashes against this popup's varied card-art backdrop — same
 * reasoning TotyCardVariantSelect gives for not reusing a shared dropdown.
 * Styled to match .toty-card-popup__download instead (plain
 * translucent-black pill, white text/icon). Open state is tracked in JS
 * (mouseenter cancels a pending close, mouseleave schedules one after the
 * delay above) rather than plain CSS hover, same delayed-close idiom
 * SfxControls.tsx's own SfxToggle already uses for this exact reason.
 */
export function TotyCardSfxControl({
  enabled,
  volume,
  onToggle,
  onVolumeChange,
}: {
  enabled: boolean;
  volume: number;
  onToggle: () => void;
  onVolumeChange: (value: number) => void;
}) {
  const [popupOpen, setPopupOpen] = useState(false);
  const closeTimeoutRef = useRef<number | undefined>(undefined);
  const cancelClose = () => {
    clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = undefined;
  };
  const openPopup = () => {
    cancelClose();
    setPopupOpen(true);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimeoutRef.current = window.setTimeout(() => setPopupOpen(false), SFX_POPUP_CLOSE_DELAY_MS);
  };
  useEffect(() => cancelClose, []);

  const displayValue = enabled ? volume : 0;
  return (
    <div
      className={`toty-card-popup__sfx-control ${popupOpen ? "toty-card-popup__sfx-control--open" : ""}`}
      onMouseEnter={openPopup}
      onMouseLeave={scheduleClose}
      onFocus={openPopup}
      onBlur={scheduleClose}
    >
      <button
        type="button"
        className="toty-card-popup__sfx-toggle"
        onClick={onToggle}
        aria-pressed={enabled}
        aria-label={enabled ? "3D 카드 효과음 끄기" : "3D 카드 효과음 켜기"}
      >
        {enabled ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
      </button>
      <div className="toty-card-popup__sfx-popup">
        <div className="toty-card-popup__sfx-slider-track">
          <input
            type="range"
            className="toty-card-popup__sfx-slider"
            min={0}
            max={100}
            value={displayValue}
            onChange={(event) => onVolumeChange(Number(event.target.value))}
            aria-label="3D 카드 효과음 볼륨"
            style={{ "--volume-fill": `${displayValue}%` } as React.CSSProperties}
          />
        </div>
        <span className="toty-card-popup__sfx-value">{displayValue}</span>
      </div>
    </div>
  );
}
