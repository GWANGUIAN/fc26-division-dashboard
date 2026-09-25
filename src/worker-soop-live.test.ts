import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Env } from "./worker.js";

// worker.ts grabs `caches.default` at import time, so the stub must exist before it loads.
const store = new Map<string, Response>();
vi.stubGlobal("caches", {
  default: {
    match: async (request: Request) => store.get(request.url)?.clone(),
    put: async (request: Request, response: Response) => void store.set(request.url, response),
  },
});
const { default: worker } = await import("./worker.js");

const list = (userId: string) => ({ data: { list: [{ broad_no: 1, user_id: userId, user_nick: "n", broad_title: "t", view_cnt: 1, thumbnail: "", user_profile_img: "" }] } });
const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
const never = (signal?: AbortSignal | null) =>
  new Promise<Response>((_, reject) => signal?.addEventListener("abort", () => reject(new Error("aborted"))));

async function call(): Promise<Response> {
  const ctx = { waitUntil: (promise: Promise<unknown>) => void promise };
  return worker.fetch(new Request("https://example.test/api/soop-live"), {} as Env, ctx);
}

describe("/api/soop-live upstream handling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    store.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("re-asks sooplive when the first request hangs instead of waiting it out", async () => {
    let calls = 0;
    vi.stubGlobal("fetch", vi.fn(async (_url: URL, init?: RequestInit) => {
      calls += 1;
      // The very first request never answers; every later one is instant.
      return calls === 1 ? never(init?.signal) : json({ data: { list: [] } });
    }));
    const pending = call();
    await vi.advanceTimersByTimeAsync(1_300);
    const response = await pending;
    expect(response.status).toBe(200);
    expect(calls).toBeGreaterThanOrEqual(3);
  });

  it("returns the working category when the other one never answers", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: URL, init?: RequestInit) =>
      url.searchParams.get("szCateNo") === "00040354" ? never(init?.signal) : json(list("abc"))));
    const pending = call();
    await vi.advanceTimersByTimeAsync(4_500);
    const response = await pending;
    expect(response.status).toBe(200);
    const body = await response.json() as { streamers: { userId: string }[] };
    expect(body.streamers.map((s) => s.userId)).toEqual(["abc"]);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("falls back to the last complete snapshot when sooplive is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json(list("fresh"))));
    expect((await call()).status).toBe(200);
    store.delete("https://example.test/api/soop-live?edge-cache=v3");

    vi.stubGlobal("fetch", vi.fn(async (_url: URL, init?: RequestInit) => never(init?.signal)));
    const pending = call();
    await vi.advanceTimersByTimeAsync(4_500);
    const response = await pending;
    expect(response.status).toBe(200);
    expect((await response.json() as { streamers: { userId: string }[] }).streamers[0].userId).toBe("fresh");
  });

  it("answers 502 within the timeout when there is nothing to fall back on", async () => {
    vi.stubGlobal("fetch", vi.fn(async (_url: URL, init?: RequestInit) => never(init?.signal)));
    const pending = call();
    await vi.advanceTimersByTimeAsync(4_500);
    expect((await pending).status).toBe(502);
  });
});
