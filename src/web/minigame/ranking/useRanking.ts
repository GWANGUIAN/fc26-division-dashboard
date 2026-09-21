import { useEffect, useRef, useState } from "react";
import {
  hashPlayerId,
  isBetterScore,
  sanitizeNickname,
  SCORE_GAMES,
  validateScore,
  type LeaderboardResponse,
  type MyRankResponse,
  type ScoreGameId,
} from "../../../shared/minigame-scores.js";
import { loadPlayerId, loadPlayerNickname, loadSubmittedScore, savePlayerNickname, saveSubmittedScore } from "../../storage.js";
import { fetchLeaderboard, fetchMyRank, ScoreApiError, submitScore } from "./scoreApi.js";
import { shouldSubmit } from "./shouldSubmit.js";

export const NICKNAME_HINT = "2~12자, 한글·영문·숫자와 공백 _ . ! - 만 쓸 수 있어요.";

/** A result waiting to be registered: it needs a nickname, a confirmation, or a retry. */
export interface PendingSubmission {
  score: number;
  /** "record": a fresh personal best; "import": a best that predates the ranking. */
  kind: "record" | "import";
  failed: boolean;
}

export interface RankingPanelProps {
  game: ScoreGameId;
  status: "loading" | "ready" | "error";
  board: LeaderboardResponse | null;
  me: MyRankResponse | null;
  playerKey: string | null;
  nickname: string;
  pending: PendingSubmission | null;
  busy: boolean;
  notice: string | null;
  nicknameError: string | null;
  onSubmitPending: (name: string) => void;
  onDismissPending: () => void;
  onRename: (name: string) => void;
  onReload: () => void;
}

type SendKind = PendingSubmission["kind"] | "rename";

/**
 * Online ranking for one minigame. `panel` feeds <RankingPanel>; call
 * `report(score)` whenever a run ends — it registers the score when it beats
 * the last confirmed best (asking for a nickname the first time).
 * `readLocalBest` returns the game's pre-existing localStorage record so an
 * existing player can register it once.
 */
export function useRanking(game: ScoreGameId, readLocalBest?: () => number | null) {
  const { order } = SCORE_GAMES[game];
  const [playerKey, setPlayerKey] = useState<string | null>(null);
  const [nickname, setNickname] = useState(loadPlayerNickname);
  const [status, setStatus] = useState<RankingPanelProps["status"]>("loading");
  const [board, setBoard] = useState<LeaderboardResponse | null>(null);
  const [me, setMe] = useState<MyRankResponse | null>(null);
  const [pending, setPending] = useState<PendingSubmission | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [nicknameError, setNicknameError] = useState<string | null>(null);

  // Read inside async callbacks, so they live in refs rather than closures.
  const alive = useRef(false);
  const playerIdRef = useRef<string | null>(null);
  const playerKeyRef = useRef<string | null>(null);
  const nicknameRef = useRef(nickname);
  nicknameRef.current = nickname;
  const submittedBest = useRef<number | null | undefined>(undefined);
  if (submittedBest.current === undefined) submittedBest.current = loadSubmittedScore(game);
  const readLocalBestRef = useRef(readLocalBest);
  readLocalBestRef.current = readLocalBest;

  const playerId = () => (playerIdRef.current ??= loadPlayerId());

  const load = async (key: string): Promise<MyRankResponse | null> => {
    try {
      const [nextBoard, nextMe] = await Promise.all([fetchLeaderboard(game), fetchMyRank(game, key)]);
      if (!alive.current) return null;
      setBoard(nextBoard);
      setMe(nextMe);
      setStatus("ready");
      return nextMe;
    } catch {
      if (alive.current) setStatus((current) => (current === "ready" ? current : "error"));
      return null;
    }
  };

  const send = async (score: number, name: string, kind: SendKind, retried = false): Promise<void> => {
    setBusy(true);
    setNicknameError(null);
    try {
      const result = await submitScore(game, { pid: playerId(), name, score });
      if (!alive.current) return;
      savePlayerNickname(name);
      setNickname(name);
      submittedBest.current = result.best;
      saveSubmittedScore(game, result.best);
      setPending(null);
      setNotice(
        kind === "rename"
          ? "닉네임을 바꿨어요"
          : result.improved
            ? `순위 등록 완료 · ${result.rank}위`
            : `저장된 최고기록이 더 좋아요 · ${result.rank}위`,
      );
      setBusy(false);
      if (playerKeyRef.current) await load(playerKeyRef.current);
    } catch (cause) {
      if (!alive.current) return;
      // The server asks for a short pause between submits from one player; wait it out once.
      if (cause instanceof ScoreApiError && cause.status === 429 && !retried) {
        setTimeout(() => {
          if (alive.current) void send(score, name, kind, true);
        }, (cause.retryAfterMs ?? 5_000) + 300);
        return;
      }
      setBusy(false);
      if (cause instanceof ScoreApiError && cause.code === "invalid_nickname") setNicknameError(NICKNAME_HINT);
      if (kind === "rename") setNotice("닉네임을 바꾸지 못했어요. 잠시 후 다시 시도해 주세요");
      else {
        setPending({ score, kind, failed: true });
        setNotice("등록에 실패했어요. 다시 시도해 주세요");
      }
    }
  };

  useEffect(() => {
    alive.current = true;
    let cancelled = false;
    void hashPlayerId(playerId()).then(async (key) => {
      if (cancelled) return;
      playerKeyRef.current = key;
      setPlayerKey(key);
      const mine = await load(key);
      if (cancelled || !mine) return;
      if (mine.rank !== null && mine.score !== undefined && submittedBest.current === null) {
        // Storage was cleared but the server still knows this player: adopt its best.
        submittedBest.current = mine.score;
        saveSubmittedScore(game, mine.score);
        return;
      }
      const local = readLocalBestRef.current?.() ?? null;
      if (mine.rank === null && submittedBest.current === null && local !== null && validateScore(game, local) !== null) {
        setPending((current) => current ?? { score: local, kind: "import", failed: false });
      }
    });
    return () => {
      cancelled = true;
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load/playerId only read refs and `game`, which is the dependency
  }, [game]);

  const report = (score: number) => {
    if (validateScore(game, score) === null) return;
    if (!shouldSubmit(order, score, submittedBest.current ?? null)) return;
    const name = nicknameRef.current;
    if (name) void send(score, name, "record");
    else {
      setNicknameError(null);
      setPending((current) => (current && !isBetterScore(order, score, current.score) ? current : { score, kind: "record", failed: false }));
    }
  };

  const onSubmitPending = (name: string) => {
    if (!pending) return;
    const clean = sanitizeNickname(name);
    if (!clean) {
      setNicknameError(NICKNAME_HINT);
      return;
    }
    void send(pending.score, clean, pending.kind);
  };

  const onRename = (name: string) => {
    const clean = sanitizeNickname(name);
    if (!clean) {
      setNicknameError(NICKNAME_HINT);
      return;
    }
    if (submittedBest.current === null || submittedBest.current === undefined) {
      savePlayerNickname(clean);
      setNickname(clean);
      setNicknameError(null);
      setNotice("닉네임을 저장했어요");
      return;
    }
    void send(submittedBest.current, clean, "rename");
  };

  const panel: RankingPanelProps = {
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
    onDismissPending: () => {
      setPending(null);
      setNicknameError(null);
    },
    onRename,
    onReload: () => {
      if (!playerKeyRef.current) return;
      setStatus("loading");
      void load(playerKeyRef.current);
    },
  };
  return { panel, report };
}
