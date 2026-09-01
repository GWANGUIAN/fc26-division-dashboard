import type { SoopLiveStreamer } from "./shared/soop-live.js";

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
const API_CACHE_VERSION = "v3";
// The frontend polls this every 2 minutes while a tab is visible and the
// user is active. Cache slightly under that so a visible tab never serves
// the exact same poll cycle twice.
const SOOP_LIVE_CACHE_SECONDS = 115;
const SOOP_LIVE_CACHE_VERSION = "v1";
// sooplive's internal id for the "EA Sports FC 26" directory category, found
// via the category's own directory page network calls. Not documented
// anywhere public, so it can only be rediscovered by re-inspecting that page
// if sooplive ever reassigns it.
const SOOP_LIVE_CATEGORY_NO = "00040354";
// Scraper now runs hourly (was every 3 minutes), so generatedAt only
// advances once per cycle; allow one full cycle plus buffer before flagging
// stale, or UptimeRobot would false-alarm for most of every hour.
const HEALTH_MAX_SNAPSHOT_AGE_MS = 75 * 60 * 1_000;
// Bump whenever the static entry bundle changes. It is used only for the
// internal asset-binding request, bypassing the zone's broad cache rule while
// retaining a stable public URL for cached HTML shells.
const ASSET_REVISION = "20260817-cache-guard-1";
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

interface SoopLiveApiEntry {
  broad_no: number;
  user_id: string;
  user_nick: string;
  broad_title: string;
  view_cnt: number;
  thumbnail: string;
  user_profile_img: string;
}

/**
 * Proxies sooplive's own (uncredentialed, CORS-less) category feed so the
 * frontend can read it same-origin. Edge-cached like serveApi so any number
 * of visitors polling every 60s collapses into ~1 upstream fetch/minute per
 * Cloudflare PoP instead of one per visitor.
 */
async function serveSoopLive(request: Request, ctx: ExecutionContext): Promise<Response> {
  if (request.method !== "GET") return new Response("Method Not Allowed", { status: 405 });

  const url = new URL(request.url);
  const cacheKey = new Request(`${url.origin}/api/soop-live?edge-cache=${SOOP_LIVE_CACHE_VERSION}`, { method: "GET" });
  const cached = await edgeCache.default.match(cacheKey);
  if (cached) return cached;

  const upstreamUrl = new URL("https://sch.sooplive.com/api.php");
  upstreamUrl.searchParams.set("m", "categoryContentsList");
  upstreamUrl.searchParams.set("szType", "live");
  upstreamUrl.searchParams.set("nPageNo", "1");
  upstreamUrl.searchParams.set("nListCnt", "60");
  upstreamUrl.searchParams.set("szPlatform", "pc");
  upstreamUrl.searchParams.set("szCateNo", SOOP_LIVE_CATEGORY_NO);
  upstreamUrl.searchParams.set("szOrder", "view_cnt_desc");

  const upstream = await fetch(upstreamUrl, {
    headers: { Accept: "application/json", Referer: "https://www.sooplive.com/" },
  });
  if (!upstream.ok) return Response.json({ message: "soop live lookup failed" }, { status: 502 });

  const payload = await upstream.json() as { data?: { list?: SoopLiveApiEntry[] } };
  const streamers: SoopLiveStreamer[] = (payload.data?.list ?? []).map((entry) => ({
    broadNo: entry.broad_no,
    userId: entry.user_id,
    nickname: entry.user_nick,
    title: entry.broad_title,
    viewerCount: entry.view_cnt,
    thumbnailUrl: entry.thumbnail,
    profileImageUrl: entry.user_profile_img,
  }));

  const response = Response.json({ generatedAt: new Date().toISOString(), streamers }, {
    headers: {
      "cache-control": `public, max-age=${SOOP_LIVE_CACHE_SECONDS}, stale-while-revalidate=30`,
      "x-content-type-options": "nosniff",
    },
  });
  ctx.waitUntil(edgeCache.default.put(cacheKey, response.clone()));
  return response;
}

function healthResponse(status: number, statusText: string): Response {
  return Response.json({ ok: status === 200, status: statusText }, {
    status,
    headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}

async function serveAsset(request: Request, env: Env): Promise<Response> {
  const path = new URL(request.url).pathname;
  // A cached HTML shell can still refer to a previous Vite entry hash after a
  // deployment. The asset binding's SPA fallback would return index.html for
  // that missing JS/CSS file, preventing React from starting. Serve the
  // stable current entry instead until the cached shell naturally expires.
  const staleEntry = path.match(/^\/assets\/index-[^/]+\.(js|css)$/u);
  const assetUrl = new URL(staleEntry ? `/assets/app.${staleEntry[1]}` : request.url, request.url);
  // Static asset resolution ignores this query when selecting the file, but
  // Cloudflare's cache treats it as a new internal key for each revision.
  assetUrl.searchParams.set("__dashboard_asset_revision", ASSET_REVISION);
  const response = await env.ASSETS.fetch(new Request(assetUrl, request));
  // Never let a zone-level Cache Everything rule preserve an HTML shell or
  // entry bundle beyond the Worker revision that generated it.
  if (path === "/" || path === "/index.html" || path === "/assets/app.js" || path === "/assets/app.css" || staleEntry) {
    const headers = new Headers(response.headers);
    headers.set("cache-control", "no-store");
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
  return response;
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
    if (path === "/api/soop-live") return serveSoopLive(request, ctx);
    return serveAsset(request, env);
  },
} satisfies ExportedHandler<Env>;
