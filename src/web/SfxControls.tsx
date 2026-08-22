import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const SFX_POPUP_CLOSE_DELAY_MS = 500;

export function SfxToggle({
  enabled,
  volume,
  onToggle,
  onVolumeChange,
  highlight = false,
}: {
  enabled: boolean;
  volume: number;
  onToggle: () => void;
  onVolumeChange: (value: number) => void;
  highlight?: boolean;
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
    closeTimeoutRef.current = window.setTimeout(
      () => setPopupOpen(false),
      SFX_POPUP_CLOSE_DELAY_MS,
    );
  };
  useEffect(() => cancelClose, []);
  const displayValue = enabled ? volume : 0;
  const open = popupOpen || highlight;
  return (
    <div
      className={`sfx-control ${open ? "sfx-control--open" : ""} ${
        highlight ? "sfx-control--highlight" : ""
      }`}
      onMouseEnter={openPopup}
      onMouseLeave={scheduleClose}
      onFocus={openPopup}
      onBlur={scheduleClose}
    >
      <div className="sfx-control__popup">
        <div className="sfx-control__slider-track">
          <input
            type="range"
            className="sfx-control__slider"
            min={0}
            max={100}
            value={displayValue}
            onChange={(event) => onVolumeChange(Number(event.target.value))}
            aria-label="효과음 볼륨"
            style={
              { "--volume-fill": `${displayValue}%` } as React.CSSProperties
            }
          />
        </div>
        <span className="sfx-control__value">{displayValue}</span>
      </div>
      <button
        type="button"
        className="sfx-toggle"
        onClick={onToggle}
        aria-pressed={enabled}
        aria-label={enabled ? "효과음 끄기" : "효과음 켜기"}
      >
        {enabled ? (
          <Volume2 aria-hidden="true" />
        ) : (
          <VolumeX aria-hidden="true" />
        )}
        <span>효과음 {enabled ? "ON" : "OFF"}</span>
      </button>
    </div>
  );
}

export function SfxIntroNotice({
  enabled,
  volume,
  onToggle,
  onVolumeChange,
  onDismiss,
  onAcknowledge,
}: {
  enabled: boolean;
  volume: number;
  onToggle: () => void;
  onVolumeChange: (value: number) => void;
  onDismiss: () => void;
  onAcknowledge: () => void;
}) {
  const displayValue = enabled ? volume : 0;
  return (
    <div className="sfx-intro-backdrop">
      <aside className="sfx-intro" role="status">
        <button
          type="button"
          className="sfx-intro__close"
          onClick={() => {
            onAcknowledge();
            onDismiss();
          }}
          aria-label="안내 닫기"
        >
          ×
        </button>
        <img
          className="sfx-intro__image"
          src="/suprised.webp"
          alt=""
          width={400}
          height={687}
        />
        <p className="sfx-intro__title">놀라셨나요?</p>
        <p className="sfx-intro__body">
          프로필 사진에{" "}
          <Volume2 className="sfx-intro__icon" aria-hidden="true" /> 아이콘이
          있는 스트리머는 상세 팝업이 열릴 때 효과음이 재생됩니다.
          <br />
          <br />
          효과음 볼륨은 <mark className="sfx-intro__highlight">
            바로 아래
          </mark>{" "}
          또는{" "}
          <mark className="sfx-intro__highlight">
            화면 오른쪽 아래 플로팅 영역
          </mark>
          에서 조절할 수 있습니다.
        </p>
        <div className="sfx-intro__volume">
          <button
            type="button"
            className="sfx-toggle"
            onClick={onToggle}
            aria-pressed={enabled}
            aria-label={enabled ? "효과음 끄기" : "효과음 켜기"}
          >
            {enabled ? (
              <Volume2 aria-hidden="true" />
            ) : (
              <VolumeX aria-hidden="true" />
            )}
          </button>
          <input
            type="range"
            className="sfx-intro__slider"
            min={0}
            max={100}
            value={displayValue}
            onChange={(event) => onVolumeChange(Number(event.target.value))}
            aria-label="효과음 볼륨"
            style={
              { "--volume-fill": `${displayValue}%` } as React.CSSProperties
            }
          />
          <span className="sfx-intro__volume-value">{displayValue}</span>
        </div>
      </aside>
    </div>
  );
}
