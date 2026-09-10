import { useState } from "react";
import { Modal, useEscape } from "../Modal";
import { MatchLineupPitch } from "./MatchLineupPitch";
import { MatchTimeline } from "./MatchTimeline";
import type { LineupPlayer, MatchDay } from "./types";

export function MatchDetailModal({
  day,
  initialGameId,
  playerById,
  onClose,
}: {
  day: MatchDay;
  initialGameId: string;
  playerById: Map<string, LineupPlayer>;
  onClose: () => void;
}) {
  useEscape(onClose);
  const [gameIndex, setGameIndex] = useState(() => {
    const index = day.games.findIndex((game) => game.id === initialGameId);
    return index >= 0 ? index : 0;
  });
  const game = day.games[gameIndex] ?? day.games[0];
  const reviewVideoUrl = game.wakgoodReviewVideoUrl ?? day.wakgoodReviewVideoUrl;
  const gameVideoUrl = game.videoUrl
    ? game.startSeconds != null
      ? `${game.videoUrl}?change_second=${game.startSeconds}`
      : game.videoUrl
    : undefined;

  return (
    <Modal
      onClose={onClose}
      label={`${day.dateLabel} ${day.opponentName}전 경기 상세`}
      wide
      header={
        <div>
          <p className="eyebrow match-detail__date">{day.dateLabel} · MATCH CENTER</p>
          <h2 className="match-detail__title">
            {game.jandyLineup.teamLabel} vs {day.opponentName}
          </h2>
          {day.games.length > 1 && (
            <div className="segmented match-detail__game-tabs">
              {day.games.map((entry, index) => (
                <button
                  key={entry.id}
                  className={index === gameIndex ? "active" : ""}
                  onClick={() => setGameIndex(index)}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          )}
        </div>
      }
    >
      <section className="match-scoreboard">
        <p className="eyebrow">{game.label}</p>
        <div className="match-scoreboard__row">
          <div className="match-scoreboard__team">
            <img src={game.jandyLineup.teamLogoUrl} alt="" />
            <span>{game.jandyLineup.teamLabel}</span>
          </div>
          <strong className="match-scoreboard__score">
            {game.jandyScore}
            <i>:</i>
            {game.opponentScore}
          </strong>
          <div className="match-scoreboard__team match-scoreboard__team--right">
            <span>{game.opponentLineup.teamLabel}</span>
            <img src={game.opponentLineup.teamLogoUrl} alt="" />
          </div>
        </div>
        {gameVideoUrl && (
          <a
            className="action match-detail__video-link"
            href={gameVideoUrl}
            target="_blank"
            rel="noreferrer"
          >
            경기 영상 보기
          </a>
        )}
      </section>

      <MatchLineupPitch
        gameId={game.id}
        jandyLineup={game.jandyLineup}
        opponentLineup={game.opponentLineup}
        playerById={playerById}
      />

      <MatchTimeline game={game} />

      {reviewVideoUrl && (
        <section className="match-review">
          <p className="eyebrow">WAKGOOD REVIEW</p>
          <h3 className="match-review__title">우왁굳의 피드백</h3>
          <a
            className="match-review__card"
            href={reviewVideoUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="우왁굳 피드백 영상 새 탭에서 보기"
          >
            <span className="match-review__play" aria-hidden="true">▶</span>
            <span>피드백 영상 보기</span>
          </a>
        </section>
      )}
    </Modal>
  );
}
