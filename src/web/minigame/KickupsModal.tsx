import { Modal, useEscape } from "../Modal";
import { KickupsCanvas } from "./KickupsCanvas";
import { useKickupsGame } from "./useKickupsGame";

export function KickupsModal({
  onClose,
  sfxEnabled,
  sfxVolume,
}: {
  onClose: () => void;
  sfxEnabled: boolean;
  sfxVolume: number;
}) {
  useEscape(onClose);
  const { state, quip, handleStart, handleCanvasClick } = useKickupsGame({ sfxEnabled, sfxVolume });

  return (
    <Modal
      onClose={onClose}
      label="축구공 오래 튕기기"
      wide
      header={
        <div>
          <p className="eyebrow">MINIGAME</p>
          <h2 className="kickups__title">⚽ 축구공 오래 튕기기</h2>
          <p className="kickups__intro">공을 클릭해서 최대한 오래 리프팅해보세요. 떨어뜨리면 끝, 바닥에 놓인 공을 다시 클릭하면 바로 재시작!</p>
        </div>
      }
    >
      <div className="kickups-play-area">
        <div className="kickups-badge kickups-badge--high">최고기록 {state.highScore}</div>
        {state.phase === "idle" ? (
          <button type="button" className="kickups-start" onClick={handleStart}>
            시작
          </button>
        ) : (
          <>
            <div className="kickups-score-display">{state.score}</div>
            <KickupsCanvas state={state} onPointerDown={handleCanvasClick} />
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
