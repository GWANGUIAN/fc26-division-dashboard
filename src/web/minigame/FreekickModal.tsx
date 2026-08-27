import { Volume2, VolumeX } from "lucide-react";
import { Modal, useEscape } from "../Modal";
import { FreekickScene } from "./FreekickScene";
import { STARTING_LIVES } from "./freekickEngine";
import { useFreekickGame } from "./useFreekickGame";
import { useFreekickSfx } from "./useFreekickSfx";
import "./freekick.css";

const RESULT_LABEL: Record<string, string> = {
  goal: "⚽ 골!!",
  saved: "🧤 선방!",
  miss: "❌ 아쉽네요",
};

function LivesDisplay({ lives }: { lives: number }) {
  return (
    <div className="freekick-lives" aria-label={`남은 목숨 ${lives}개`}>
      {Array.from({ length: STARTING_LIVES }, (_, i) => (
        <span
          key={i}
          className={`freekick-lives__ball ${i < lives ? "" : "freekick-lives__ball--lost"}`}
          aria-hidden="true"
        >
          ⚽
        </span>
      ))}
    </div>
  );
}

function FreekickModal({ onClose, sfxVolume }: { onClose: () => void; sfxVolume: number }) {
  useEscape(onClose);
  const { sfxOn, toggleSfx } = useFreekickSfx();
  const { state, liveStateRef, handleShoot, handleNextAttempt, handleNewRound } = useFreekickGame({
    sfxOn,
    sfxVolume,
  });

  return (
    <Modal
      onClose={onClose}
      label="3D 프리킥"
      wide
      header={
        <div>
          <p className="eyebrow">MINIGAME</p>
          <h2 className="freekick__title">
            <img src="/goalpost.webp" alt="" className="freekick__title-icon" /> 3D 프리킥
          </h2>
          <p className="freekick__intro">
            공을 클릭한 채 원하는 방향으로 드래그해서 놓으면 슛! 공의 중심에서 벗어난 위치를 잡을수록 공이
            휘어집니다. 3번 실패하면 게임 오버!
          </p>
        </div>
      }
    >
      <div className="freekick-play-area">
        <LivesDisplay lives={state.lives} />
        <div className="freekick-badge freekick-badge--score">점수 {state.score}</div>
        <div className="freekick-badge freekick-badge--best">최고 기록 {state.bestScore}</div>
        <button
          type="button"
          className={`freekick-icon-toggle ${sfxOn ? "" : "freekick-icon-toggle--muted"}`}
          onClick={toggleSfx}
          aria-pressed={sfxOn}
          aria-label={sfxOn ? "효과음 끄기" : "효과음 켜기"}
        >
          {sfxOn ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
        </button>
        <FreekickScene stateRef={liveStateRef} onShoot={handleShoot} />
        {state.phase === "idle" && (
          <div className="freekick-hint">공을 드래그해서 슛하세요</div>
        )}
        {state.phase === "result" && (
          <div className="freekick-result">
            <div className="freekick-result__label">{RESULT_LABEL[state.result ?? "miss"]}</div>
            <button type="button" className="freekick-start" onClick={handleNextAttempt}>
              다음 슛
            </button>
          </div>
        )}
        {state.phase === "gameover" && (
          <div className="freekick-result">
            <div className="freekick-result__label">{RESULT_LABEL[state.result ?? "miss"]}</div>
            <div className="freekick-result__gameover">게임 오버 · 점수 {state.score}</div>
            <button type="button" className="freekick-start" onClick={handleNewRound}>
              다시 시작
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default FreekickModal;
