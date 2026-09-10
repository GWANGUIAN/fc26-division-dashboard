import { useState } from "react";
import { Avatar } from "../cardVisuals";
import { Modal, useEscape } from "../Modal";
import { computeJandyPlayerRankings } from "./matchRecordData";
import type { LineupPlayer, PlayerRankingEntry } from "./types";

function RankingList({
  entries,
  playerById,
  statLabel,
  statKey,
}: {
  entries: PlayerRankingEntry[];
  playerById: Map<string, LineupPlayer>;
  statLabel: string;
  statKey: "goals" | "assists";
}) {
  if (entries.length === 0) {
    return <p className="match-record__empty">아직 기록된 {statLabel}이 없습니다</p>;
  }
  return (
    <ol className="player-ranking">
      {entries.map((entry, index) => {
        const player = playerById.get(entry.playerId);
        const displayName = player?.displayName ?? entry.playerId;
        return (
          <li className="player-ranking__row" key={entry.playerId}>
            <span className="player-ranking__rank">{index + 1}</span>
            {player && (player.profileImageUrl || player.soopId) ? (
              <Avatar
                profileImageUrl={player.profileImageUrl}
                soopId={player.soopId}
                displayName={displayName}
              />
            ) : (
              <span className="avatar avatar-fallback" aria-hidden="true">
                {displayName.slice(0, 1)}
              </span>
            )}
            <span className="player-ranking__name">{displayName}</span>
            <span className="player-ranking__stat player-ranking__stat--primary">
              {entry[statKey]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function MatchRankingModal({
  playerById,
  onClose,
}: {
  playerById: Map<string, LineupPlayer>;
  onClose: () => void;
}) {
  useEscape(onClose);
  const [tab, setTab] = useState<"goals" | "assists">("goals");
  const { goalRanking, assistRanking } = computeJandyPlayerRankings();

  return (
    <Modal
      onClose={onClose}
      label="잔디동 골/어시스트 순위"
      header={
        <div>
          <p className="eyebrow">MATCH CENTER</p>
          <h2 className="match-detail__title">잔디동 골/어시스트 순위</h2>
          <div className="segmented player-ranking__tabs">
            <button
              className={tab === "goals" ? "active" : ""}
              onClick={() => setTab("goals")}
            >
              ⚽ 골
            </button>
            <button
              className={tab === "assists" ? "active" : ""}
              onClick={() => setTab("assists")}
            >
              🅰️ 어시스트
            </button>
          </div>
        </div>
      }
    >
      {tab === "goals" ? (
        <RankingList entries={goalRanking} playerById={playerById} statLabel="골" statKey="goals" />
      ) : (
        <RankingList
          entries={assistRanking}
          playerById={playerById}
          statLabel="어시스트"
          statKey="assists"
        />
      )}
    </Modal>
  );
}
