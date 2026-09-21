import { useState, type FormEvent } from "react";
import { Pencil, RotateCw } from "lucide-react";
import { LEADERBOARD_DEFAULT_LIMIT, sanitizeNickname, SCORE_GAMES } from "../../../shared/minigame-scores.js";
import type { RankingPanelProps } from "./useRanking.js";

const MEDALS = ["🥇", "🥈", "🥉"];

// Varied name widths so the placeholder rows read as a list rather than a striped block.
const SKELETON_NAME_WIDTHS = [62, 48, 70, 55, 40, 66, 52, 44, 58, 36];

/** Placeholder rows shaped like the TOP list, so the panel does not jump in height when the ranking arrives. */
function RankingSkeleton() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        순위를 불러오는 중…
      </p>
      <ol className="ranking-list" aria-hidden="true">
        {Array.from({ length: LEADERBOARD_DEFAULT_LIMIT }, (_, index) => (
          <li key={index} className="ranking-row ranking-row--skeleton">
            <span className="ranking-skeleton ranking-skeleton--rank" />
            <span className="ranking-skeleton ranking-skeleton--name" style={{ width: `${SKELETON_NAME_WIDTHS[index % SKELETON_NAME_WIDTHS.length]}%` }} />
            <span className="ranking-skeleton ranking-skeleton--score" />
          </li>
        ))}
      </ol>
    </div>
  );
}

export function RankingPanel({
  game,
  status,
  board,
  me,
  playerKey,
  nickname,
  pending,
  busy,
  notice,
  nicknameError,
  onSubmitPending,
  onDismissPending,
  onRename,
  onReload,
}: RankingPanelProps) {
  const { label, unit } = SCORE_GAMES[game];
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const format = (score: number) => `${score.toLocaleString("ko-KR")}${unit}`;

  const entries = board?.entries ?? [];
  const inList = playerKey !== null && entries.some((entry) => entry.key === playerKey);
  const showMine = me?.rank != null && me.score !== undefined && !inList;

  const submitPending = (event: FormEvent) => {
    event.preventDefault();
    onSubmitPending(nickname || draft);
  };
  const submitRename = (event: FormEvent) => {
    event.preventDefault();
    const valid = sanitizeNickname(draft) !== null;
    onRename(draft);
    if (valid) setEditing(false);
  };

  return (
    <section className="ranking-panel" aria-label={`${label} 순위`}>
      <div className="ranking-panel__head">
        <h3>🏆 순위</h3>
        {board && <span>총 {board.total.toLocaleString("ko-KR")}명</span>}
        {!board && status === "loading" && <span className="ranking-skeleton ranking-skeleton--count" aria-hidden="true" />}
      </div>

      {pending && (
        <form className="ranking-card" onSubmit={submitPending}>
          <strong>
            {pending.kind === "import"
              ? `내 최고기록 ${format(pending.score)}`
              : `🎉 새 기록 ${format(pending.score)}!`}
          </strong>
          <span>{pending.failed ? "등록에 실패했어요." : "순위에 등록할까요?"}</span>
          {nickname ? (
            <span className="ranking-card__name">닉네임 · {nickname}</span>
          ) : (
            <input
              className="ranking-input"
              value={draft}
              maxLength={12}
              placeholder="닉네임 (2~12자)"
              aria-label="닉네임"
              onChange={(event) => setDraft(event.target.value)}
            />
          )}
          {nicknameError && <span className="ranking-error">{nicknameError}</span>}
          <div className="ranking-card__actions">
            <button type="submit" className="ranking-btn ranking-btn--primary" disabled={busy || (!nickname && draft.trim().length === 0)}>
              {busy ? "등록 중…" : pending.failed ? "다시 시도" : "등록"}
            </button>
            <button type="button" className="ranking-btn" onClick={onDismissPending} disabled={busy}>
              나중에
            </button>
          </div>
        </form>
      )}

      {notice && !pending && (
        <p className="ranking-notice" role="status">
          {notice}
        </p>
      )}

      {status === "loading" && !board && <RankingSkeleton />}
      {status === "error" && !board && (
        <div className="ranking-state">
          <p>순위를 불러올 수 없어요.</p>
          <button type="button" className="ranking-btn" onClick={onReload}>
            <RotateCw aria-hidden="true" /> 다시 시도
          </button>
        </div>
      )}

      {board && (
        <ol className="ranking-list">
          {entries.length === 0 ? (
            <li className="ranking-empty">아직 기록이 없어요. 첫 번째 주인공이 되어보세요!</li>
          ) : (
            entries.map((entry) => (
              <li key={entry.key} className={`ranking-row ${entry.key === playerKey ? "ranking-row--me" : ""}`}>
                <span className="ranking-row__rank">{MEDALS[entry.rank - 1] ?? entry.rank}</span>
                <span className="ranking-row__name">{entry.name}</span>
                <span className="ranking-row__score">{format(entry.score)}</span>
              </li>
            ))
          )}
        </ol>
      )}

      {showMine && me && (
        <div className="ranking-row ranking-row--me ranking-row--pinned">
          <span className="ranking-row__rank">{me.rank}위</span>
          <span className="ranking-row__name">{me.name}</span>
          <span className="ranking-row__score">{format(me.score!)}</span>
        </div>
      )}

      <div className="ranking-panel__foot">
        {editing ? (
          <form className="ranking-rename" onSubmit={submitRename}>
            <input
              className="ranking-input"
              value={draft}
              maxLength={12}
              placeholder="새 닉네임"
              aria-label="새 닉네임"
              autoFocus
              onChange={(event) => setDraft(event.target.value)}
            />
            <button type="submit" className="ranking-btn ranking-btn--primary" disabled={busy || draft.trim().length === 0}>
              저장
            </button>
            <button type="button" className="ranking-btn" onClick={() => setEditing(false)}>
              취소
            </button>
          </form>
        ) : (
          <>
            <span className="ranking-panel__nick">{nickname ? `내 닉네임 · ${nickname}` : "닉네임 없음"}</span>
            {nickname && (
              <button
                type="button"
                className="ranking-btn ranking-btn--icon"
                aria-label="닉네임 변경"
                title="닉네임 변경"
                onClick={() => {
                  setDraft(nickname);
                  setEditing(true);
                }}
              >
                <Pencil aria-hidden="true" />
              </button>
            )}
          </>
        )}
        {editing && nicknameError && <span className="ranking-error">{nicknameError}</span>}
      </div>
    </section>
  );
}
