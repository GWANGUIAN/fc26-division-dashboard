import {
  isScoreGameId,
  hashPlayerId,
  LEADERBOARD_DEFAULT_LIMIT,
  LEADERBOARD_MAX_LIMIT,
  PLAYER_ID_PATTERN,
  PLAYER_KEY_PATTERN,
  SCORE_GAMES,
  sanitizeNickname,
  toRankScore,
  validateScore,
  type LeaderboardResponse,
  type MyRankResponse,
  type ScoreGameId,
  type SubmitScoreResponse,
} from "./shared/minigame-scores.js";

// The subset of the Cloudflare D1 API this file uses; declared here because
// the project does not depend on @cloudflare/workers-types.
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes: number } }>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<{ results: T[]; meta: { changes: number } }[]>;
}

export interface ScoresEnv {
  DB: D1Database;
}

export interface ScoresContext {
  waitUntil(promise: Promise<unknown>): void;
}

// Resolved per call rather than at import time so tests can substitute `caches`.
const edgeCache = () => (caches as unknown as { default: Cache }).default;

const LEADERBOARD_CACHE_SECONDS = 30;
const LEADERBOARD_CACHE_VERSION = "v1";
const MAX_BODY_BYTES = 1024;
/** A player's stored best must be at least this old before it can be replaced. */
const SUBMIT_COOLDOWN_MS = 5_000;
const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/u;

const NO_STORE = { "cache-control": "no-store", "x-content-type-options": "nosniff" };

function json(body: unknown, status = 200, headers: Record<string, string> = NO_STORE): Response {
  return Response.json(body, { status, headers });
}

function error(status: number, code: string, extra: Record<string, unknown> = {}): Response {
  return json({ message: code, ...extra }, status);
}

function leaderboardCacheKey(origin: string, game: ScoreGameId, limit: number): Request {
  return new Request(`${origin}/api/scores/${game}?limit=${limit}&edge-cache=${LEADERBOARD_CACHE_VERSION}`, { method: "GET" });
}

function parseLimit(raw: string | null): number {
  const value = raw === null ? LEADERBOARD_DEFAULT_LIMIT : Number(raw);
  if (!Number.isInteger(value)) return LEADERBOARD_DEFAULT_LIMIT;
  return Math.min(LEADERBOARD_MAX_LIMIT, Math.max(1, value));
}

interface StoredRow {
  nickname: string;
  score: number;
  rank: number;
}

/** A player's own row plus its 1-based rank (better rows + 1; ties go to the earlier run). */
function selectMine(db: D1Database, game: ScoreGameId, playerKey: string): D1PreparedStatement {
  return db.prepare(
    `SELECT s.nickname AS nickname, s.score AS score,
       (SELECT COUNT(*) FROM scores o
         WHERE o.game = s.game
           AND (o.rank_score > s.rank_score OR (o.rank_score = s.rank_score AND o.achieved_at < s.achieved_at))) + 1 AS rank
     FROM scores s WHERE s.game = ?1 AND s.player_key = ?2`,
  ).bind(game, playerKey);
}

const countAll = (db: D1Database, game: ScoreGameId) =>
  db.prepare("SELECT COUNT(*) AS total FROM scores WHERE game = ?1").bind(game);

async function serveLeaderboard(request: Request, env: ScoresEnv, ctx: ScoresContext, game: ScoreGameId): Promise<Response> {
  const url = new URL(request.url);
  const limit = parseLimit(url.searchParams.get("limit"));
  const cacheKey = leaderboardCacheKey(url.origin, game, limit);
  const cached = await edgeCache().match(cacheKey);
  if (cached) return cached;

  const [top, total] = await env.DB.batch<{ player_key: string; nickname: string; score: number } | { total: number }>([
    env.DB.prepare(
      "SELECT player_key, nickname, score FROM scores WHERE game = ?1 ORDER BY rank_score DESC, achieved_at ASC LIMIT ?2",
    ).bind(game, limit),
    countAll(env.DB, game),
  ]);
  const rows = top.results as { player_key: string; nickname: string; score: number }[];
  const body: LeaderboardResponse = {
    order: SCORE_GAMES[game].order,
    unit: SCORE_GAMES[game].unit,
    total: (total.results[0] as { total: number } | undefined)?.total ?? 0,
    entries: rows.map((row, index) => ({ rank: index + 1, key: row.player_key, name: row.nickname, score: row.score })),
  };
  const response = json(body, 200, {
    "cache-control": `public, max-age=${LEADERBOARD_CACHE_SECONDS}`,
    "x-content-type-options": "nosniff",
  });
  ctx.waitUntil(edgeCache().put(cacheKey, response.clone()));
  return response;
}

async function serveMyRank(url: URL, env: ScoresEnv, game: ScoreGameId): Promise<Response> {
  const key = url.searchParams.get("k") ?? "";
  if (!PLAYER_KEY_PATTERN.test(key)) return error(400, "invalid_key");
  const mine = await selectMine(env.DB, game, key).first<StoredRow>();
  const body: MyRankResponse = mine ? { rank: mine.rank, score: mine.score, name: mine.nickname } : { rank: null };
  return json(body);
}

function originAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return origin === new URL(request.url).origin || LOCAL_ORIGIN.test(origin);
}

async function submitScore(request: Request, env: ScoresEnv, ctx: ScoresContext, game: ScoreGameId): Promise<Response> {
  if (!originAllowed(request)) return error(403, "forbidden_origin");
  if (!(request.headers.get("content-type") ?? "").includes("application/json")) return error(415, "expected_json");

  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return error(413, "body_too_large");
  let payload: { pid?: unknown; name?: unknown; score?: unknown };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return error(400, "invalid_body");
    payload = parsed;
  } catch {
    return error(400, "invalid_body");
  }

  if (typeof payload.pid !== "string" || !PLAYER_ID_PATTERN.test(payload.pid)) return error(400, "invalid_player_id");
  const nickname = sanitizeNickname(payload.name);
  if (!nickname) return error(400, "invalid_nickname");
  const score = validateScore(game, payload.score);
  if (score === null) return error(400, "invalid_score");

  const playerKey = await hashPlayerId(payload.pid);
  const now = Date.now();
  const existing = await env.DB
    .prepare("SELECT achieved_at FROM scores WHERE game = ?1 AND player_key = ?2")
    .bind(game, playerKey)
    .first<{ achieved_at: number }>();
  if (existing && now - existing.achieved_at < SUBMIT_COOLDOWN_MS) {
    return error(429, "too_frequent", { retryAfterMs: SUBMIT_COOLDOWN_MS - (now - existing.achieved_at) });
  }

  const rankScore = toRankScore(game, score);
  const [upsert, rename] = await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO scores (game, player_key, nickname, score, rank_score, achieved_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)
       ON CONFLICT (game, player_key) DO UPDATE SET
         nickname = excluded.nickname, score = excluded.score,
         rank_score = excluded.rank_score, achieved_at = excluded.achieved_at
       WHERE excluded.rank_score > scores.rank_score`,
    ).bind(game, playerKey, nickname, score, rankScore, now),
    // Keeps the nickname consistent across all of this player's games.
    env.DB.prepare("UPDATE scores SET nickname = ?1 WHERE player_key = ?2 AND nickname <> ?1").bind(nickname, playerKey),
  ]);
  const improved = upsert.meta.changes > 0;
  if (improved || rename.meta.changes > 0) {
    const url = new URL(request.url);
    ctx.waitUntil(edgeCache().delete(leaderboardCacheKey(url.origin, game, LEADERBOARD_DEFAULT_LIMIT)));
  }

  const [mine, total] = await env.DB.batch<StoredRow | { total: number }>([selectMine(env.DB, game, playerKey), countAll(env.DB, game)]);
  const stored = mine.results[0] as StoredRow | undefined;
  if (!stored) return error(500, "not_stored");
  const body: SubmitScoreResponse = {
    improved,
    rank: stored.rank,
    total: (total.results[0] as { total: number } | undefined)?.total ?? 0,
    best: stored.score,
  };
  return json(body);
}

/** Routes /api/scores/:game[/me]. Anything unexpected in D1 degrades to a 503 so the UI can say "unavailable". */
export async function serveScores(request: Request, env: ScoresEnv, ctx: ScoresContext): Promise<Response> {
  const url = new URL(request.url);
  const [, , , game, sub, ...rest] = url.pathname.split("/");
  if (!game || !isScoreGameId(game) || rest.length > 0) return error(404, "not_found");

  try {
    if (request.method === "GET" && sub === undefined) return await serveLeaderboard(request, env, ctx, game);
    if (request.method === "GET" && sub === "me") return await serveMyRank(url, env, game);
    if (request.method === "POST" && sub === undefined) return await submitScore(request, env, ctx, game);
  } catch {
    return error(503, "ranking_unavailable");
  }
  return sub === undefined || sub === "me" ? error(405, "method_not_allowed") : error(404, "not_found");
}
