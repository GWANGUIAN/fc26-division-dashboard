import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hashPlayerId } from "./shared/minigame-scores.js";
import { serveScores, type D1Database, type D1PreparedStatement, type ScoresContext, type ScoresEnv } from "./worker-scores.js";

const ORIGIN = "https://wakjandy.stream";
const SCHEMA = readFileSync(new URL("../migrations/0001_scores.sql", import.meta.url), "utf8");

/** A D1 look-alike over node:sqlite, so the real SQL and schema are exercised. */
type Statement = D1PreparedStatement & { sql: string; params: unknown[] };

function createD1(): D1Database {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(SCHEMA);
  const statement = (sql: string, params: unknown[] = []): Statement => {
    const args = params as never[];
    return {
      sql,
      params,
      bind: (...values) => statement(sql, values),
      first: async <T>() => (sqlite.prepare(sql).get(...args) as T | undefined) ?? null,
      all: async <T>() => ({ results: sqlite.prepare(sql).all(...args) as T[] }),
      run: async () => ({ meta: { changes: Number(sqlite.prepare(sql).run(...args).changes) } }),
    };
  };
  return {
    prepare: (sql) => statement(sql),
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        const out = (statements as Statement[]).map(({ sql, params }) => {
          const prepared = sqlite.prepare(sql);
          const args = params as never[];
          if (/^\s*select/iu.test(sql)) return { results: prepared.all(...args) as never[], meta: { changes: 0 } };
          return { results: [], meta: { changes: Number(prepared.run(...args).changes) } };
        });
        sqlite.exec("COMMIT");
        return out;
      } catch (cause) {
        sqlite.exec("ROLLBACK");
        throw cause;
      }
    },
  };
}

/** Map-backed stand-in for Cloudflare's caches.default. */
function createFakeCache() {
  const store = new Map<string, Response>();
  return {
    store,
    match: async (request: Request) => store.get(request.url)?.clone(),
    put: async (request: Request, response: Response) => void store.set(request.url, response),
    delete: async (request: Request) => store.delete(request.url),
  };
}

let env: ScoresEnv;
let cache: ReturnType<typeof createFakeCache>;
const pending: Promise<unknown>[] = [];
const ctx: ScoresContext = { waitUntil: (promise) => void pending.push(promise) };
let clock: number;

async function call(method: string, path: string, options: { body?: unknown; headers?: Record<string, string>; raw?: string } = {}) {
  const init: RequestInit = { method, headers: { origin: ORIGIN, ...options.headers } };
  if (options.raw !== undefined) init.body = options.raw;
  else if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
    (init.headers as Record<string, string>)["content-type"] = "application/json";
  }
  const response = await serveScores(new Request(`${ORIGIN}${path}`, init), env, ctx);
  await Promise.all(pending.splice(0));
  return { status: response.status, body: (await response.json()) as Record<string, any> };
}

const submit = (game: string, pid: string, name: string, score: number) => call("POST", `/api/scores/${game}`, { body: { pid, name, score } });
const newPid = () => crypto.randomUUID();
const advance = (ms = 10_000) => void (clock += ms, vi.setSystemTime(clock));

beforeEach(() => {
  env = { DB: createD1() };
  cache = createFakeCache();
  vi.stubGlobal("caches", { default: cache });
  clock = Date.UTC(2026, 8, 21);
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(clock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("POST /api/scores/:game", () => {
  it("stores a first score and reports rank 1", async () => {
    const result = await submit("kickups", newPid(), "문모모", 42);
    expect(result).toEqual({ status: 200, body: { improved: true, rank: 1, total: 1, best: 42 } });
  });

  it("keeps the best score: a worse later run changes nothing", async () => {
    const pid = newPid();
    await submit("kickups", pid, "문모모", 42);
    advance();
    expect((await submit("kickups", pid, "문모모", 30)).body).toMatchObject({ improved: false, best: 42 });
    advance();
    expect((await submit("kickups", pid, "문모모", 50)).body).toMatchObject({ improved: true, best: 50 });
  });

  it("refuses a second submit inside the cooldown", async () => {
    const pid = newPid();
    await submit("kickups", pid, "문모모", 10);
    advance(1_000);
    const result = await submit("kickups", pid, "문모모", 20);
    expect(result.status).toBe(429);
    expect(result.body.retryAfterMs).toBeGreaterThan(0);
  });

  it("ranks card match by fewest turns", async () => {
    await submit("cardmatch", newPid(), "느림보", 25);
    const fast = await submit("cardmatch", newPid(), "재빠름", 12);
    expect(fast.body).toMatchObject({ rank: 1, total: 2 });
    const board = await call("GET", "/api/scores/cardmatch");
    expect(board.body.order).toBe("asc");
    expect(board.body.entries.map((entry: { name: string }) => entry.name)).toEqual(["재빠름", "느림보"]);
  });

  it("gives a tie to whoever got there first", async () => {
    await submit("kickups", newPid(), "먼저", 30);
    advance();
    const later = await submit("kickups", newPid(), "나중", 30);
    expect(later.body.rank).toBe(2);
  });

  it("treats a different device id as a different player, never an overwrite", async () => {
    await submit("kickups", newPid(), "원래", 10);
    const other = await submit("kickups", newPid(), "다른사람", 99);
    expect(other.body).toMatchObject({ rank: 1, total: 2 });
    const board = await call("GET", "/api/scores/kickups");
    expect(board.body.entries.map((entry: { name: string }) => entry.name)).toEqual(["다른사람", "원래"]);
  });

  it("propagates a nickname change to the player's other games", async () => {
    const pid = newPid();
    const key = await hashPlayerId(pid);
    await submit("kickups", pid, "옛이름", 10);
    advance();
    await submit("freekick", pid, "옛이름", 3);
    advance();
    await submit("freekick", pid, "새이름", 2); // not a better score, but the rename must still land
    expect((await call("GET", `/api/scores/kickups/me?k=${key}`)).body.name).toBe("새이름");
    expect((await call("GET", `/api/scores/freekick/me?k=${key}`)).body).toMatchObject({ name: "새이름", score: 3 });
  });

  it("rejects bad input", async () => {
    const pid = newPid();
    expect((await call("POST", "/api/scores/nope", { body: { pid, name: "문모모", score: 1 } })).status).toBe(404);
    expect((await submit("soccer-sum10", pid, "문모모", 171)).body.message).toBe("invalid_score");
    expect((await submit("kickups", pid, "문모모", 1.5)).body.message).toBe("invalid_score");
    expect((await submit("kickups", pid, "<b>x</b>", 5)).body.message).toBe("invalid_nickname");
    expect((await submit("kickups", "short", "문모모", 5)).body.message).toBe("invalid_player_id");
    expect((await call("POST", "/api/scores/kickups", { raw: "{oops", headers: { "content-type": "application/json" } })).body.message).toBe("invalid_body");
    expect((await call("POST", "/api/scores/kickups", { raw: "[]", headers: { "content-type": "application/json" } })).body.message).toBe("invalid_body");
    expect((await call("POST", "/api/scores/kickups", { raw: "x".repeat(2000), headers: { "content-type": "application/json" } })).status).toBe(413);
    expect((await call("POST", "/api/scores/kickups", { raw: "{}", headers: { "content-type": "text/plain" } })).status).toBe(415);
  });

  it("rejects a foreign Origin but allows local dev", async () => {
    const body = { pid: newPid(), name: "문모모", score: 5 };
    expect((await call("POST", "/api/scores/kickups", { body, headers: { origin: "https://evil.example" } })).status).toBe(403);
    expect((await call("POST", "/api/scores/kickups", { body, headers: { origin: "" } })).status).toBe(403);
    expect((await call("POST", "/api/scores/kickups", { body, headers: { origin: "http://localhost:5184" } })).status).toBe(200);
  });
});

describe("GET /api/scores/:game", () => {
  it("lists ranked entries with the hashed key and a total", async () => {
    const pids = [newPid(), newPid(), newPid()];
    await submit("kickups", pids[0], "삼위", 5);
    await submit("kickups", pids[1], "일위", 30);
    await submit("kickups", pids[2], "이위", 10);
    const board = await call("GET", "/api/scores/kickups?limit=2");
    expect(board.status).toBe(200);
    expect(board.body).toMatchObject({ order: "desc", unit: "회", total: 3 });
    expect(board.body.entries).toEqual([
      { rank: 1, key: await hashPlayerId(pids[1]), name: "일위", score: 30 },
      { rank: 2, key: await hashPlayerId(pids[2]), name: "이위", score: 10 },
    ]);
  });

  it("returns an empty board for a game nobody has played", async () => {
    expect((await call("GET", "/api/scores/rush")).body).toEqual({ order: "desc", unit: "m", total: 0, entries: [] });
  });

  it("serves repeat reads from the edge cache and drops it when a score lands", async () => {
    const pid = newPid();
    await submit("kickups", pid, "문모모", 10);
    await call("GET", "/api/scores/kickups");
    expect(cache.store.size).toBe(1);

    // Bypass D1 entirely: a cached answer must not need the database.
    const brokenEnv = { DB: { prepare: () => { throw new Error("db down"); }, batch: () => { throw new Error("db down"); } } };
    const cached = await serveScores(new Request(`${ORIGIN}/api/scores/kickups`), brokenEnv, ctx);
    expect(cached.status).toBe(200);

    advance();
    await submit("kickups", pid, "문모모", 20);
    expect(cache.store.size).toBe(0);
    expect((await call("GET", "/api/scores/kickups")).body.entries[0].score).toBe(20);
  });
});

describe("GET /api/scores/:game/me", () => {
  it("returns the player's rank, including outside the visible top", async () => {
    const mine = newPid();
    await submit("kickups", mine, "나나", 1);
    for (let index = 0; index < 12; index += 1) await submit("kickups", newPid(), `상위${index}`, 10 + index);
    const key = await hashPlayerId(mine);
    expect((await call("GET", `/api/scores/kickups/me?k=${key}`)).body).toEqual({ rank: 13, score: 1, name: "나나" });
  });

  it("returns rank null for an unknown key and 400 for a malformed one", async () => {
    expect((await call("GET", `/api/scores/kickups/me?k=${"a".repeat(64)}`)).body).toEqual({ rank: null });
    expect((await call("GET", "/api/scores/kickups/me?k=zzz")).status).toBe(400);
    expect((await call("GET", "/api/scores/kickups/me")).status).toBe(400);
  });
});

describe("routing and failure modes", () => {
  it("answers 405 / 404 for unsupported requests", async () => {
    expect((await call("DELETE", "/api/scores/kickups")).status).toBe(405);
    expect((await call("GET", "/api/scores/kickups/other")).status).toBe(404);
    expect((await call("GET", "/api/scores/kickups/me/extra")).status).toBe(404);
  });

  it("degrades to 503 when the D1 binding is missing", async () => {
    const result = await serveScores(new Request(`${ORIGIN}/api/scores/kickups`), {} as ScoresEnv, ctx);
    expect(result.status).toBe(503);
    expect(await result.json()).toEqual({ message: "ranking_unavailable" });
  });
});
