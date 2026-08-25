import { useEffect, useRef, useState } from "react";
import { Settings } from "lucide-react";
import { SPIN_DURATION_MAX, SPIN_DURATION_MIN } from "./spinDurationStorage";

export function SpinDurationSettings({
  seconds,
  onChange,
  sfxEnabled,
  sfxVolume,
  onSfxVolumeChange,
}: {
  seconds: number;
  onChange: (value: number) => void;
  sfxEnabled: boolean;
  sfxVolume: number;
  onSfxVolumeChange: (value: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const displayVolume = sfxEnabled ? sfxVolume : 0;

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div className="pass-spin-settings" ref={rootRef}>
      {open && (
        <div
          className="pass-spin-settings__popover"
          role="dialog"
          aria-label="발표 설정"
        >
          <span className="pass-spin-settings__label">카드 회전 시간</span>
          <div className="pass-spin-settings__row">
            <input
              type="range"
              min={SPIN_DURATION_MIN}
              max={SPIN_DURATION_MAX}
              step={1}
              value={seconds}
              onChange={(event) => onChange(Number(event.target.value))}
              aria-label="카드 회전 시간(초)"
            />
            <span className="pass-spin-settings__value">{seconds}초</span>
          </div>
          <span className="pass-spin-settings__label">효과음 볼륨</span>
          <div className="pass-spin-settings__row">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={displayVolume}
              onChange={(event) => onSfxVolumeChange(Number(event.target.value))}
              aria-label="효과음 볼륨"
            />
            <span className="pass-spin-settings__value">{displayVolume}</span>
          </div>
        </div>
      )}
      <button
        type="button"
        className="pass-spin-settings__toggle"
        onClick={() => setOpen((current) => !current)}
        aria-label="발표 설정"
        aria-expanded={open}
      >
        <Settings aria-hidden="true" />
      </button>
    </div>
  );
}
