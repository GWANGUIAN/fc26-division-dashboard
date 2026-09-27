import { useEffect } from "react";
import { Music4, Volume2, VolumeX } from "lucide-react";
import { Modal, useEscape } from "../../Modal.js";
import { SoundControl } from "../SoundControl.js";
import { CleatDropCanvas } from "./CleatDropCanvas.js";
import { STAGE_COUNT } from "./cleatDropEngine.js";
import { useCleatDropGame, type CleatDropRoundResult } from "./useCleatDropGame.js";
import { useCleatDropMusic } from "./useCleatDropMusic.js";
import { useCleatDropSfx } from "./useCleatDropSfx.js";
import "./cleat-drop.css";

export default function CleatDropModal({ onClose, onRoundEnd }: { onClose: () => void; onRoundEnd?: (result: CleatDropRoundResult) => void }) {
  useEscape(onClose);
  const sfx = useCleatDropSfx();
  const music = useCleatDropMusic();
  const game = useCleatDropGame({
    sfxOn: sfx.sfxOn,
    sfxVolume: sfx.sfxVolume,
    onAllClear: (result) => {
      music.stopMusic();
      onRoundEnd?.(result);
    },
  });

  // Unlike the other minigames, cleat-drop has no "ready" phase to gate playback behind a start
  // button — createGame() drops straight into the pendulum, so the music starts with the modal.
  useEffect(() => {
    if (game.showAllClear) return;
    music.startMusic();
    return () => music.stopMusic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearedCount = game.state.cleared.filter(Boolean).length;

  return (
    <Modal
      onClose={onClose}
      label="축구화 던지기"
      wide
      header={
        <div>
          <p className="eyebrow">MINIGAME</p>
          <h2 className="cleat-drop__title">
            <span aria-hidden="true">👟</span> 축구화 던지기
          </h2>
          <p className="cleat-drop__intro">진자로 흔들리는 축구화를 떨어뜨리고, 발로 차서 목표물 위에 3초간 세워두세요.</p>
        </div>
      }
    >
      <div className="cleat-drop-meta">
        <div className="cleat-drop-hud">
          <span className="cleat-drop-badge">
            스테이지 {game.state.stageIndex + 1}/{STAGE_COUNT}
          </span>
          <span className="cleat-drop-badge">이번 스테이지 시도 {game.state.attemptsByStage[game.state.stageIndex]}</span>
          <span className="cleat-drop-badge">클리어 {clearedCount}/{STAGE_COUNT}</span>
        </div>
        <SoundControl
          enabled={music.musicOn}
          volume={music.musicVolume}
          onToggle={music.toggleMusic}
          onVolumeChange={music.changeMusicVolume}
          icon={<Music4 aria-hidden="true" />}
          label="배경음악"
          wrapperClassName="cleat-drop-icon-toggle"
        />
        <SoundControl
          enabled={sfx.sfxOn}
          volume={sfx.sfxVolume}
          onToggle={sfx.toggleSfx}
          onVolumeChange={sfx.changeSfxVolume}
          icon={sfx.sfxOn ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
          label="효과음"
          wrapperClassName="cleat-drop-icon-toggle"
        />
      </div>
      <div className="cleat-drop-play-area">
        <CleatDropCanvas
          state={game.state}
          onRelease={game.onRelease}
          onSwing={game.onSwing}
          allClear={game.showAllClear ? { attempts: game.state.attempts } : null}
        />
      </div>
    </Modal>
  );
}
