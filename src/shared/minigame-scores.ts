/**
 * Online minigame rankings: the game registry plus the pure rules (score
 * bounds, nickname cleaning, rank ordering) shared by the Worker and the web
 * app. Adding a minigame to the ranking is one line in SCORE_GAMES — the
 * Worker treats this table as its allow-list.
 */

export type ScoreOrder = "desc" | "asc";

/**
 * How long a run of this game takes at the very least. A signed run token
 * proves how much wall-clock time has passed since the client asked to start,
 * so a forged score has to be "waited for" instead of just POSTed.
 */
export interface RunTiming {
  /** No real run submits sooner than this after its token was issued. */
  minRunMs: number;
  /** Fastest plausible pace: a score of N needs at least N × this many ms. */
  minMsPerUnit: number;
  /** A token older than this is refused, which also caps how far a held token can be exploited. */
  tokenTtlMs: number;
}

export interface ScoreGameDef {
  label: string;
  unit: string;
  /** "desc": bigger is better. "asc": smaller is better (card match turns). */
  order: ScoreOrder;
  /** Smallest score a real run can produce. */
  min: number;
  /** Largest score a real run can produce; anything above is a forged submit. */
  max: number;
  /** When set, submissions must carry a run token (once the server has a signing secret). */
  timing?: RunTiming;
}

export const SCORE_GAMES = {
  // Consecutive hits are at least ~0.2 s apart even for a fast clicker.
  kickups: {
    label: "축구공 튀기기", unit: "회", order: "desc", min: 1, max: 100_000,
    timing: { minRunMs: 1_500, minMsPerUnit: 200, tokenTtlMs: 2 * 60 * 60_000 },
  },
  // A goal needs a drag, ~0.7 s of flight and a click on "next shot".
  freekick: {
    label: "3D 프리킥", unit: "골", order: "desc", min: 1, max: 10_000,
    timing: { minRunMs: 2_000, minMsPerUnit: 1_200, tokenTtlMs: 60 * 60_000 },
  },
  // 17 × 10 board, one point per cleared ball; a drag clears at least two.
  "soccer-sum10": {
    label: "축구공 사과게임", unit: "점", order: "desc", min: 1, max: 170,
    timing: { minRunMs: 30_000, minMsPerUnit: 200, tokenTtlMs: 60 * 60_000 },
  },
  // 10 pairs: the fewest possible turns is 10; a mismatch alone shows for 0.7 s.
  cardmatch: {
    label: "카드 짝 맞추기", unit: "턴", order: "asc", min: 10, max: 999,
    timing: { minRunMs: 8_000, minMsPerUnit: 600, tokenTtlMs: 60 * 60_000 },
  },
  // World-only. Ranked by distance in metres, not by the seed-bonus score.
  rush: { label: "잔디 러시", unit: "m", order: "desc", min: 1, max: 100_000 },
  // Endless in theory; 200k is about 6,700 average-30-point merges, leaving normal long runs headroom.
  "grass-merge": { label: "잔디 머지", unit: "점", order: "desc", min: 1, max: 200_000 },
  "keeper-breakout": { label: "골키퍼 벽돌깨기", unit: "점", order: "desc", min: 1, max: 1_000_000 },
  "football-match3": { label: "축구 매치3", unit: "점", order: "desc", min: 1, max: 1_000_000 },
} as const satisfies Record<string, ScoreGameDef>;

export type ScoreGameId = keyof typeof SCORE_GAMES;

export function scoreGame(game: ScoreGameId): ScoreGameDef {
  return SCORE_GAMES[game];
}

export function isScoreGameId(value: string): value is ScoreGameId {
  return Object.prototype.hasOwnProperty.call(SCORE_GAMES, value);
}

export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 12;
export const LEADERBOARD_DEFAULT_LIMIT = 10;
export const LEADERBOARD_MAX_LIMIT = 50;
/** The secret device id: a UUID, hashed by the server; never sent back out. */
export const PLAYER_ID_PATTERN = /^[A-Za-z0-9-]{16,64}$/u;
/** The public id: sha256(playerId) as lowercase hex. */
export const PLAYER_KEY_PATTERN = /^[0-9a-f]{64}$/u;

export interface LeaderboardEntry {
  rank: number;
  /** sha256(playerId): lets a client spot its own row without exposing the secret. */
  key: string;
  name: string;
  score: number;
}

export interface LeaderboardResponse {
  order: ScoreOrder;
  unit: string;
  total: number;
  entries: LeaderboardEntry[];
}

export interface MyRankResponse {
  rank: number | null;
  score?: number;
  name?: string;
}

export interface SubmitScoreRequest {
  pid: string;
  name: string;
  score: number;
  /** From POST /start; required for games with `timing` once the server signs tokens. */
  token?: string;
}

export interface StartRunResponse {
  /** null when this game or this deployment does not use run tokens. */
  token: string | null;
}

export interface RenameResponse {
  changed: number;
}

export interface SubmitScoreResponse {
  /** false when the stored best was already at least as good. */
  improved: boolean;
  rank: number;
  total: number;
  best: number;
}

/** Normalises a score so that bigger always means a better rank. */
export function toRankScore(game: ScoreGameId, score: number): number {
  return SCORE_GAMES[game].order === "asc" ? -score : score;
}

/** True when `candidate` beats `current` under the game's ordering. */
export function isBetterScore(order: ScoreOrder, candidate: number, current: number): boolean {
  return order === "asc" ? candidate < current : candidate > current;
}

/** Returns the score as an integer, or null when it is not a plausible run result. */
export function validateScore(game: ScoreGameId, value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  const { min, max } = SCORE_GAMES[game];
  return value >= min && value <= max ? value : null;
}

const NICKNAME_ALLOWED = /^[\p{Script=Hangul}A-Za-z0-9 _.!-]+$/u;

// A deliberately tiny list; extend it when someone actually abuses the board.
// Matched against the nickname lowercased with spaces and punctuation removed.
const BLOCKED_NICKNAME_PARTS = ["시발", "씨발", "병신", "개새끼", "fuck", "shit", "nigg"];

/**
 * Cleans a typed nickname: NFC, trimmed, single-spaced, 2–12 characters, only
 * Hangul / Latin letters / digits / space / `_ . ! -`, no blocked words.
 * Returns null when it cannot be made acceptable.
 */
export function sanitizeNickname(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const name = input.normalize("NFC").replace(/\s+/gu, " ").trim();
  const length = Array.from(name).length;
  if (length < NICKNAME_MIN_LENGTH || length > NICKNAME_MAX_LENGTH) return null;
  if (!NICKNAME_ALLOWED.test(name)) return null;
  const squashed = name.toLowerCase().replace(/[\s_.!-]/gu, "");
  if (BLOCKED_NICKNAME_PARTS.some((part) => squashed.includes(part))) return null;
  return name;
}

/** sha256(playerId) as lowercase hex; the same call works in browsers and Workers. */
export async function hashPlayerId(playerId: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(playerId));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Whether `score` fits in the time that really passed between token issue and submit. */
export function isRunPlausible(timing: RunTiming, score: number, elapsedMs: number): boolean {
  return elapsedMs >= timing.minRunMs && elapsedMs >= score * timing.minMsPerUnit;
}
