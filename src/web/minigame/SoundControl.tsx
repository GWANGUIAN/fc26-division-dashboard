import { useEffect, useRef, useState, type ReactNode } from "react";
import "./sound-control.css";

const POPUP_CLOSE_DELAY_MS = 400;

/**
 * Wraps an existing circular icon-toggle button (its className supplies size/position/look —
 * e.g. "kickups-icon-toggle kickups-icon-toggle--music") with a hover/focus-revealed volume
 * slider, mirroring the main floating toolbar's SfxToggle but sized for these smaller in-canvas
 * buttons. The click still just mutes/unmutes; the slider is the new volume control.
 */
export function SoundControl({
  enabled,
  volume,
  onToggle,
  onVolumeChange,
  icon,
  label,
  wrapperClassName,
}: {
  enabled: boolean;
  volume: number;
  onToggle: () => void;
  onVolumeChange: (value: number) => void;
  icon: ReactNode;
  label: string;
  wrapperClassName: string;
}) {
  const [open, setOpen] = useState(false);
  const closeTimeoutRef = useRef<number | undefined>(undefined);
  const cancelClose = () => {
    clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = undefined;
  };
  const openPopup = () => {
    cancelClose();
    setOpen(true);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimeoutRef.current = window.setTimeout(() => setOpen(false), POPUP_CLOSE_DELAY_MS);
  };
  useEffect(() => cancelClose, []);

  const displayValue = enabled ? volume : 0;

  return (
    <div
      className={`${wrapperClassName} sound-control ${open ? "sound-control--open" : ""}`}
      onMouseEnter={openPopup}
      onMouseLeave={scheduleClose}
      onFocus={openPopup}
      onBlur={scheduleClose}
    >
      <button
        type="button"
        className="sound-control__button"
        onClick={onToggle}
        aria-pressed={enabled}
        aria-label={enabled ? `${label} 끄기` : `${label} 켜기`}
      >
        {icon}
      </button>
      <div className="sound-control__popup">
        <span className="sound-control__value">{displayValue}</span>
        <input
          type="range"
          className="sound-control__slider"
          min={0}
          max={100}
          value={displayValue}
          onChange={(event) => onVolumeChange(Number(event.target.value))}
          aria-label={`${label} 볼륨`}
          aria-orientation="vertical"
          style={{ "--volume-fill": `${displayValue}%` } as React.CSSProperties}
        />
      </div>
    </div>
  );
}
