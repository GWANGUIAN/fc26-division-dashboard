interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

interface ExportedHandler<Environment> {
  fetch(request: Request, env: Environment, ctx: ExecutionContext): Response | Promise<Response>;
}

export interface Env {
  ASSETS: Fetcher;
  API_ORIGIN_URL: string;
  ORIGIN_AUTH_TOKEN: string;
}

const API_CACHE_SECONDS = 120;
const API_CACHE_VERSION = "v2";
const HEALTH_MAX_SNAPSHOT_AGE_MS = 12 * 60 * 1_000;
const edgeCache = caches as unknown as { default: Cache };

function apiOriginUrl(origin: string, path: string): string {
  const base = new URL(origin);
  const suffix = path.replace(/^\/api\/snapshot\/?/u, "");
  base.pathname = suffix ? `/${suffix}` : "/";
  // The dashboard currently has one public snapshot. Ignore request query
  // strings so cache-busting links cannot create an unbounded cache key set.
  base.search = "";
  return base.toString();
}

async function serveApi(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (request.method !== "GET") return new Response("Method Not Allowed", { status: 405 });

  const url = new URL(request.url);
  const cacheKey = new Request(`${url.origin}/api/snapshot?edge-cache=${API_CACHE_VERSION}`, { method: "GET" });
  const cached = await edgeCache.default.match(cacheKey);
  if (cached) return cached;

  const upstream = await fetch(apiOriginUrl(env.API_ORIGIN_URL, url.pathname), {
    headers: {
      Accept: "application/json",
      "x-dashboard-origin": env.ORIGIN_AUTH_TOKEN,
    },
  });

  const headers = new Headers(upstream.headers);
  headers.set("cache-control", `public, max-age=${API_CACHE_SECONDS}, stale-while-revalidate=60`);
  headers.set("x-content-type-options", "nosniff");
  const response = new Response(upstream.body, { status: upstream.status, headers });
  if (response.ok) ctx.waitUntil(edgeCache.default.put(cacheKey, response.clone()));
  return response;
}

/**
 * Public, deliberately small health endpoint for an external uptime monitor.
 * It checks the real Reader Lambda rather than only confirming that the
 * static Worker bundle is reachable. No origin credential or dashboard data
 * is exposed in the response.
 */
async function serveHealth(env: Env): Promise<Response> {
  try {
    const upstream = await fetch(apiOriginUrl(env.API_ORIGIN_URL, "/api/snapshot"), {
      headers: {
        Accept: "application/json",
        "x-dashboard-origin": env.ORIGIN_AUTH_TOKEN,
      },
    });
    if (!upstream.ok) return healthResponse(503, "upstream_unavailable");

    const snapshot = await upstream.json() as {
      status?: string;
      generatedAt?: string;
      streamers?: unknown[];
    };
    const generatedAt = Date.parse(snapshot.generatedAt ?? "");
    const isFresh = Number.isFinite(generatedAt) && Date.now() - generatedAt <= HEALTH_MAX_SNAPSHOT_AGE_MS;
    if (snapshot.status !== "ok") return healthResponse(503, "collection_degraded");
    if (!isFresh) return healthResponse(503, "snapshot_stale");
    if (!snapshot.streamers?.length) return healthResponse(503, "snapshot_empty");
    return healthResponse(200, "ok");
  } catch {
    return healthResponse(503, "upstream_unavailable");
  }
}

function healthResponse(status: number, statusText: string): Response {
  return Response.json({ ok: status === 200, status: statusText }, {
    status,
    headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const path = new URL(request.url).pathname;
    // UptimeRobot's HTTP monitor may use HEAD for its availability probe.
    // Treat it exactly like GET so the health signal is not a false outage.
    if (path === "/healthz") return (request.method === "GET" || request.method === "HEAD")
      ? serveHealth(env)
      : new Response("Method Not Allowed", { status: 405 });
    if (path === "/api/snapshot" || path.startsWith("/api/snapshot/")) return serveApi(request, env, ctx);
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
