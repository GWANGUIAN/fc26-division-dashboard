import type {
  LeaderboardResponse,
  MyRankResponse,
  ScoreGameId,
  SubmitScoreRequest,
  SubmitScoreResponse,
} from "../../../shared/minigame-scores.js";

const REQUEST_TIMEOUT_MS = 8_000;

export class ScoreApiError extends Error {
  constructor(readonly status: number, readonly code: string, readonly retryAfterMs?: number) {
    super(`score api ${status} ${code}`);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`/api/scores/${path}`, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json", ...(init?.body ? { "Content-Type": "application/json" } : {}) },
    });
    const body = (await response.json().catch(() => ({}))) as { message?: string; retryAfterMs?: number };
    if (!response.ok) throw new ScoreApiError(response.status, body.message ?? "error", body.retryAfterMs);
    return body as T;
  } finally {
    clearTimeout(timer);
  }
}

export const LEADERBOARD_LIMIT = 10;

export function fetchLeaderboard(game: ScoreGameId): Promise<LeaderboardResponse> {
  return request(`${game}?limit=${LEADERBOARD_LIMIT}`);
}

export function fetchMyRank(game: ScoreGameId, playerKey: string): Promise<MyRankResponse> {
  return request(`${game}/me?k=${playerKey}`);
}

export function submitScore(game: ScoreGameId, payload: SubmitScoreRequest): Promise<SubmitScoreResponse> {
  return request(game, { method: "POST", body: JSON.stringify(payload) });
}
