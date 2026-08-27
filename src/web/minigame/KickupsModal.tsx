import { Music4, Volume2, VolumeX } from "lucide-react";
import { Modal, useEscape } from "../Modal";
import { KickupsCanvas } from "./KickupsCanvas";
import { SoundControl } from "./SoundControl";
import { useKickupsGame } from "./useKickupsGame";
import { useKickupsMusic } from "./useKickupsMusic";
import { useKickupsSfx } from "./useKickupsSfx";

export function KickupsModal({
  onClose,
  sfxVolume,
  onSfxVolumeChange,
}: {
  onClose: () => void;
  sfxVolume: number;
  onSfxVolumeChange: (value: number) => void;
}) {
  useEscape(onClose);
  const { sfxOn, toggleSfx } = useKickupsSfx();
  const { state, liveStateRef, quip, handleStart, handleCanvasClick } = useKickupsGame({ sfxOn, sfxVolume });
  const { musicOn, toggleMusic, musicVolume, changeMusicVolume } = useKickupsMusic();

  return (
    <Modal
      onClose={onClose}
      label="축구공 튀기기"
      wide
      header={
        <div>
          <p className="eyebrow">MINIGAME</p>
          <h2 className="kickups__title">⚽ 축구공 튀기기</h2>
          <p className="kickups__intro">공을 클릭해서 최대한 오래 리프팅해보세요. 떨어뜨리면 끝, 바닥에 놓인 공을 다시 클릭하면 바로 재시작!</p>
        </div>
      }
    >
      <div className="kickups-play-area">
        <div className="kickups-badge kickups-badge--high">최고기록 {state.highScore}</div>
        <SoundControl
          enabled={musicOn}
          volume={musicVolume}
          onToggle={toggleMusic}
          onVolumeChange={changeMusicVolume}
          icon={<Music4 aria-hidden="true" />}
          label="배경음악"
          wrapperClassName={`kickups-icon-toggle kickups-icon-toggle--music ${musicOn ? "" : "kickups-icon-toggle--muted"}`}
        />
        <SoundControl
          enabled={sfxOn}
          volume={sfxVolume}
          onToggle={toggleSfx}
          onVolumeChange={onSfxVolumeChange}
          icon={sfxOn ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
          label="효과음"
          wrapperClassName={`kickups-icon-toggle kickups-icon-toggle--sfx ${sfxOn ? "" : "kickups-icon-toggle--muted"}`}
        />
        {state.phase === "idle" ? (
          <button type="button" className="kickups-start" onClick={handleStart}>
            시작
          </button>
        ) : (
          <>
            <div className="kickups-score-display">{state.score}</div>
            <KickupsCanvas stateRef={liveStateRef} onPointerDown={handleCanvasClick} />
          </>
        )}
        {quip && (
          <div key={quip.id} className="kickups-quip">
            {quip.text}
          </div>
        )}
      </div>
    </Modal>
  );
}
