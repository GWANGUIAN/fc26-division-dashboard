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
import { fetchLeaderboard, fetchMyRank, renameNickname, ScoreApiError, startRun, submitScore } from "./scoreApi.js";
import { shouldSubmit } from "./shouldSubmit.js";

export const NICKNAME_HINT = "2~12자, 한글·영문·숫자와 공백 _ . ! - 만 쓸 수 있어요.";

/** A result waiting to be registered: it needs a nickname, a confirmation, or a retry. */
export interface PendingSubmission {
  score: number;
  /** "record": a fresh personal best; "import": a best that predates the ranking. */
  kind: "record" | "import";
  failed: boolean;
  /** The run token that was current when this result was produced; a retry must reuse it. */
  token: string | null;
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

/** Rejections that retrying cannot fix: the result no longer counts as a verifiable run. */
const UNVERIFIABLE: Record<string, string> = {
  token_expired: "창을 너무 오래 열어둬서 기록을 확인할 수 없어요. 한 번 더 플레이해 주세요",
  implausible_score: "기록을 확인할 수 없어 등록하지 못했어요",
  invalid_token: "기록 확인에 실패했어요. 한 번 더 플레이해 주세요",
  token_required: "기록 확인에 실패했어요. 한 번 더 플레이해 주세요",
};

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

  // The run token proves how long this run could have lasted; it is renewed after every finished run.
  const tokenRef = useRef<string | null>(null);
  const enforcedRef = useRef(false);

  const playerId = () => (playerIdRef.current ??= loadPlayerId());

  const refreshToken = async () => {
    try {
      const { token } = await startRun(game, playerId());
      if (!alive.current) return;
      tokenRef.current = token;
      enforcedRef.current = token !== null;
    } catch {
      // Keep the previous token: an older one only means more elapsed time.
    }
  };

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

  const send = async (score: number, name: string, kind: PendingSubmission["kind"], token: string | null, retried = false): Promise<void> => {
    setBusy(true);
    setNicknameError(null);
    try {
      const result = await submitScore(game, { pid: playerId(), name, score, ...(token ? { token } : {}) });
      if (!alive.current) return;
      savePlayerNickname(name);
      setNickname(name);
      submittedBest.current = result.best;
      saveSubmittedScore(game, result.best);
      setPending(null);
      setNotice(result.improved ? `순위 등록 완료 · ${result.rank}위` : `저장된 최고기록이 더 좋아요 · ${result.rank}위`);
      setBusy(false);
      if (playerKeyRef.current) await load(playerKeyRef.current);
    } catch (cause) {
      if (!alive.current) return;
      // The server asks for a short pause between submits from one player; wait it out once.
      if (cause instanceof ScoreApiError && cause.code === "too_frequent" && !retried) {
        setTimeout(() => {
          if (alive.current) void send(score, name, kind, token, true);
        }, (cause.retryAfterMs ?? 5_000) + 300);
        return;
      }
      setBusy(false);
      const unverifiable = cause instanceof ScoreApiError ? UNVERIFIABLE[cause.code] : undefined;
      if (unverifiable) {
        setPending(null);
        setNotice(unverifiable);
        void refreshToken();
        return;
      }
      if (cause instanceof ScoreApiError && cause.code === "invalid_nickname") setNicknameError(NICKNAME_HINT);
      setPending({ score, kind, failed: true, token });
      setNotice("등록에 실패했어요. 다시 시도해 주세요");
    }
  };

  useEffect(() => {
    alive.current = true;
    let cancelled = false;
    void hashPlayerId(playerId()).then(async (key) => {
      if (cancelled) return;
      playerKeyRef.current = key;
      setPlayerKey(key);
      const [mine] = await Promise.all([load(key), refreshToken()]);
      if (cancelled || !mine) return;
      if (mine.rank !== null && mine.score !== undefined && submittedBest.current === null) {
        // Storage was cleared but the server still knows this player: adopt its best.
        submittedBest.current = mine.score;
        saveSubmittedScore(game, mine.score);
        return;
      }
      // A pre-existing local best cannot be verified as a timed run, so once the server checks
      // run tokens it can only be replaced by playing again: no "register my old record" card.
      const local = readLocalBestRef.current?.() ?? null;
      if (!enforcedRef.current && mine.rank === null && submittedBest.current === null && local !== null && validateScore(game, local) !== null) {
        setPending((current) => current ?? { score: local, kind: "import", failed: false, token: null });
      }
    });
    return () => {
      cancelled = true;
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load/playerId only read refs and `game`, which is the dependency
  }, [game]);

  const report = (score: number) => {
    // The token that was issued before this run is the one that proves its duration.
    const token = tokenRef.current;
    const submittable = validateScore(game, score) !== null && shouldSubmit(order, score, submittedBest.current ?? null);
    if (submittable) {
      const name = nicknameRef.current;
      if (name) void send(score, name, "record", token);
      else {
        setNicknameError(null);
        setPending((current) => (current && !isBetterScore(order, score, current.score) ? current : { score, kind: "record", failed: false, token }));
      }
    }
    // Whether or not this run was submitted, the next one needs a fresh token.
    void refreshToken();
  };

  const onSubmitPending = (name: string) => {
    if (!pending) return;
    const clean = sanitizeNickname(name);
    if (!clean) {
      setNicknameError(NICKNAME_HINT);
      return;
    }
    void send(pending.score, clean, pending.kind, pending.token);
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
    setBusy(true);
    void renameNickname(game, playerId(), clean)
      .then(() => {
        if (!alive.current) return;
        savePlayerNickname(clean);
        setNickname(clean);
        setNicknameError(null);
        setNotice("닉네임을 바꿨어요");
        if (playerKeyRef.current) void load(playerKeyRef.current);
      })
      .catch((cause: unknown) => {
        if (!alive.current) return;
        if (cause instanceof ScoreApiError && cause.code === "invalid_nickname") setNicknameError(NICKNAME_HINT);
        else setNotice("닉네임을 바꾸지 못했어요. 잠시 후 다시 시도해 주세요");
      })
      .finally(() => {
        if (alive.current) setBusy(false);
      });
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
