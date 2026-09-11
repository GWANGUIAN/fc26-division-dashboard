import { useState } from "react";
import { Avatar } from "../cardVisuals";
import { Modal, useEscape } from "../Modal";
import { computeJandyPlayerRankings } from "./matchRecordData";
import type { LineupPlayer, PlayerRankingEntry } from "./types";

function RankingList({
  entries,
  playerById,
  sortKey,
}: {
  entries: PlayerRankingEntry[];
  playerById: Map<string, LineupPlayer>;
  sortKey: "goals" | "assists";
}) {
  if (entries.length === 0) {
    return <p className="match-record__empty">아직 기록된 골/어시스트가 없습니다</p>;
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
            <span
              className={`player-ranking__stat ${sortKey === "goals" ? "player-ranking__stat--primary" : ""}`}
            >
              ⚽ {entry.goals}
            </span>
            <span
              className={`player-ranking__stat ${sortKey === "assists" ? "player-ranking__stat--primary" : ""}`}
            >
              🅰️ {entry.assists}
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
  const { byGoals, byAssists } = computeJandyPlayerRankings();
  const entries = tab === "goals" ? byGoals : byAssists;

  return (
    <Modal
      onClose={onClose}
      label="골/어시스트 순위"
      header={
        <div>
          <p className="eyebrow">MATCH CENTER</p>
          <h2 className="match-detail__title">골/어시스트 순위</h2>
          <div className="segmented player-ranking__tabs">
            <button
              className={tab === "goals" ? "active" : ""}
              onClick={() => setTab("goals")}
            >
              골 순
            </button>
            <button
              className={tab === "assists" ? "active" : ""}
              onClick={() => setTab("assists")}
            >
              어시스트 순
            </button>
          </div>
        </div>
      }
    >
      <RankingList entries={entries} playerById={playerById} sortKey={tab} />
    </Modal>
  );
}
