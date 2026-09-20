import { Clock3, Music4, Volume2, VolumeX } from "lucide-react";
import { Modal, useEscape } from "../../Modal.js";
import { SoundControl } from "../SoundControl.js";
import { SoccerSum10Canvas } from "./SoccerSum10Canvas.js";
import { useSoccerSum10Game, type SoccerSum10RoundResult } from "./useSoccerSum10Game.js";
import { useSoccerSum10Music } from "./useSoccerSum10Music.js";
import { useSoccerSum10Sfx } from "./useSoccerSum10Sfx.js";
import "./soccer-sum10.css";

export function SoccerSum10Modal({
  onClose,
  onRoundEnd,
}: {
  onClose: () => void;
  /** Reports each finished round (the world missions listen to this; the dashboard does not need it). */
  onRoundEnd?: (result: SoccerSum10RoundResult) => void;
}) {
  useEscape(onClose);
  const { sfxOn, sfxVolume, toggleSfx, changeSfxVolume } = useSoccerSum10Sfx();
  const { musicOn, musicVolume, toggleMusic, changeMusicVolume, startMusic, stopMusic } = useSoccerSum10Music();
  const { state, startGame, resolveSelection } = useSoccerSum10Game({
    sfxOn,
    sfxVolume,
    onRoundEnd: (result) => {
      stopMusic();
      onRoundEnd?.(result);
    },
  });

  const startRound = () => {
    startGame();
    startMusic();
  };
  const ended = state.phase === "timeup" || state.phase === "cleared";

  return (
    <Modal
      onClose={onClose}
      label="축구공 사과게임"
      wide
      header={
        <div>
          <p className="eyebrow">MINIGAME</p>
          <h2 className="soccer-sum10__title"><img src="/soccer-sum10-icon.webp" alt="" /> 축구공 사과게임</h2>
          <p className="soccer-sum10__intro">축구공을 드래그해 영역 안 숫자의 합을 10으로 만드세요. 지운 공 하나당 1점, 제한시간은 1분입니다.</p>
        </div>
      }
    >
      <div className="soccer-sum10-meta">
        <div className="soccer-sum10-hud">
          <span className="soccer-sum10-badge soccer-sum10-badge--time"><Clock3 aria-hidden="true" /> {state.timeLeft.toString().padStart(2, "0")}초</span>
          <span className="soccer-sum10-badge soccer-sum10-badge--score">점수 {state.score}</span>
          <span className="soccer-sum10-badge">최고 {state.highScore}</span>
        </div>
        <SoundControl
          enabled={musicOn}
          volume={musicVolume}
          onToggle={toggleMusic}
          onVolumeChange={changeMusicVolume}
          icon={<Music4 aria-hidden="true" />}
          label="배경음악"
          wrapperClassName={`soccer-sum10-icon-toggle ${musicOn ? "" : "soccer-sum10-icon-toggle--muted"}`}
        />
        <SoundControl
          enabled={sfxOn}
          volume={sfxVolume}
          onToggle={toggleSfx}
          onVolumeChange={changeSfxVolume}
          icon={sfxOn ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
          label="효과음"
          wrapperClassName={`soccer-sum10-icon-toggle ${sfxOn ? "" : "soccer-sum10-icon-toggle--muted"}`}
        />
      </div>
      <div className="soccer-sum10-play-area">

        {state.phase !== "ready" && (
          <SoccerSum10Canvas
            key={state.roundId}
            board={state.board}
            phase={state.phase}
            timeLeft={state.timeLeft}
            onPreviewChange={() => {}}
            onResolveSelection={resolveSelection}
          />
        )}

        {state.phase === "ready" && (
          <div className="soccer-sum10-start-panel">
            <img src="/soccer-sum10-ball.webp" alt="" className="soccer-sum10-start-panel__ball" />
            <strong>합계 10을 만들어라!</strong>
            <span>드래그한 영역 안의 공을 모두 더해요.</span>
            <button type="button" className="soccer-sum10-start" onClick={startRound}>게임 시작</button>
          </div>
        )}
        {ended && (
          <div className="soccer-sum10-result" role="status">
            <strong>{state.phase === "cleared" ? "전부 클리어!" : "경기 종료!"}</strong>
            <span>{state.score}점 획득 {state.score === state.highScore && state.score > 0 ? "· 최고 기록!" : ""}</span>
            <button type="button" className="soccer-sum10-start" onClick={startRound}>다시 시작</button>
          </div>
        )}
      </div>
    </Modal>
  );
}
