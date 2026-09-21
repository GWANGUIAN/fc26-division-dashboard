import type { StreamerRecord } from "../../shared/model.js";
import { Modal, useEscape } from "../Modal.js";
import { WOOWAKGOOD_BONUS_STREAMER } from "../toty-card/woowakgoodBonusCard.js";
import { getCardMatchBackUrl } from "./cardMatchAssets.js";
import { CardMatchCard } from "./CardMatchCard.js";
import { loadCardMatchBestTurns } from "../storage.js";
import { useCardMatchGame, type CardMatchRoundResult } from "./useCardMatchGame.js";
import { MinigameStage } from "./ranking/MinigameStage.js";
import { RankingPanel } from "./ranking/RankingPanel.js";
import { useRanking } from "./ranking/useRanking.js";
import "./card-match.css";

type CardMatchStreamer = Pick<StreamerRecord, "id" | "displayName" | "hopedPosition1" | "currentDivision">;

export function CardMatchModal({
  onClose,
  streamers,
  sfxVolume,
  onRoundEnd,
}: {
  onClose: () => void;
  streamers: StreamerRecord[] | undefined;
  sfxVolume: number;
  /** Reports each cleared board (the world missions listen to this). */
  onRoundEnd?: (result: CardMatchRoundResult) => void;
}) {
  useEscape(onClose);
  const ranking = useRanking("cardmatch", loadCardMatchBestTurns);
  const { state, bestTurns, isNewRecord, poolSize, handleFlip, newGame } = useCardMatchGame({
    streamers,
    sfxVolume,
    onRoundEnd: (result) => {
      onRoundEnd?.(result);
      ranking.report(result.score);
    },
  });

  const streamerById = new Map<string, CardMatchStreamer>();
  (streamers ?? []).forEach((s) => streamerById.set(s.id, s));
  streamerById.set(WOOWAKGOOD_BONUS_STREAMER.id, WOOWAKGOOD_BONUS_STREAMER);

  const locked = !state || state.pendingMismatch !== null || state.phase === "won";
  const titleIconUrl = getCardMatchBackUrl();

  return (
    <Modal
      onClose={onClose}
      label="카드 짝 맞추기"
      wide
      header={
        <div>
          <p className="eyebrow">MINIGAME</p>
          <h2 className="cardmatch__title">
            {titleIconUrl ? (
              <img src={titleIconUrl} alt="" className="cardmatch__title-icon" />
            ) : (
              "🃏"
            )}
            카드 짝 맞추기
          </h2>
          <p className="cardmatch__intro">
            두 장씩 뒤집어서 같은 카드를 찾아보세요. 가장 적은 턴에 20장을 전부 맞추면 신기록!
          </p>
        </div>
      }
    >
      <MinigameStage panel={<RankingPanel {...ranking.panel} />}>
        <div className="cardmatch-play-area">
          <div className="cardmatch-badges">
            <div className="cardmatch-badge">턴 {state?.turns ?? 0}</div>
            <div className="cardmatch-badge cardmatch-badge--best">
              최고 기록 {bestTurns !== null ? `${bestTurns}턴` : "-"}
            </div>
            {state?.phase === "won" && (
              <div className="cardmatch-clear" role="status">
                🎉 클리어! {state.turns}턴{isNewRecord && " · 🏆 신기록!"}
              </div>
            )}
            <button type="button" className="cardmatch-restart" onClick={newGame}>
              새 게임
            </button>
          </div>
          {poolSize === 0 || !state ? (
            <p className="cardmatch-empty">아직 3D 카드가 준비된 선수가 없어요.</p>
          ) : (
            <div className="cardmatch-grid">
              {state.cards.map((card, index) => (
                <CardMatchCard
                  key={card.id}
                  card={card}
                  streamer={streamerById.get(card.streamerId)}
                  disabled={locked}
                  shake={state.pendingMismatch?.includes(index) ?? false}
                  onFlip={() => handleFlip(index)}
                />
              ))}
            </div>
          )}
        </div>
      </MinigameStage>
    </Modal>
  );
}
