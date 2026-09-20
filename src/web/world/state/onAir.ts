import { soopLiveUrl, soopStationUrl, type WorldOnAirSnapshot } from "../../../shared/world-onair.js";

/** Live status of the world members for the ON AIR signs (docs/world/15-onair-sign.md). */

export const ON_AIR_ENDPOINT = "/api/soop-onair";
/** Same rhythm as the dashboard's LIVE rail. */
export const ON_AIR_POLL_MS = 120_000;
/** A reading older than three polls is dropped: a sign goes dark rather than vouch for a status it can no longer confirm. */
export const ON_AIR_STALE_MS = ON_AIR_POLL_MS * 3;

/** What the engine asks: is this member on air right now? */
export interface OnAirSource {
  isLive(soopId: string): boolean;
}

export interface OnAirTrackerOptions {
  fetchImpl?: typeof fetch;
  now?: () => number;
  endpoint?: string;
  intervalMs?: number;
  staleMs?: number;
  /** Where visibility comes from (tests pass a stub). */
  doc?: Pick<Document, "visibilityState" | "addEventListener" | "removeEventListener">;
}

interface Reading {
  live: boolean;
  at: number;
}

/**
 * Polls `/api/soop-onair` while it is running and only while the tab is visible. The world overlay starts it
 * when the world opens and stops it when the world closes, so nothing is fetched while the game is off.
 */
export class OnAirTracker implements OnAirSource {
  private readonly readings = new Map<string, Reading>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private inFlight: AbortController | null = null;
  private lastFetchAt = -Infinity;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  private readonly endpoint: string;
  private readonly intervalMs: number;
  private readonly staleMs: number;
  private readonly docOverride: OnAirTrackerOptions["doc"];

  constructor(options: OnAirTrackerOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? ((input, init) => fetch(input, init));
    this.now = options.now ?? (() => Date.now());
    this.endpoint = options.endpoint ?? ON_AIR_ENDPOINT;
    this.intervalMs = options.intervalMs ?? ON_AIR_POLL_MS;
    this.staleMs = options.staleMs ?? ON_AIR_STALE_MS;
    this.docOverride = options.doc;
  }

  /** Resolved on use, so building a tracker outside a browser (a server render, a test) never touches `document`. */
  private get doc(): NonNullable<OnAirTrackerOptions["doc"]> {
    return this.docOverride ?? document;
  }

  isLive(soopId: string): boolean {
    const reading = this.readings.get(soopId);
    return reading !== undefined && reading.live && this.now() - reading.at < this.staleMs;
  }

  start() {
    if (this.timer) return;
    this.doc.addEventListener("visibilitychange", this.onVisibility);
    this.timer = setInterval(() => void this.refresh(), this.intervalMs);
    void this.refresh();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.doc.removeEventListener("visibilitychange", this.onVisibility);
    this.inFlight?.abort();
    this.inFlight = null;
  }

  /** Coming back to the tab refreshes at once if the last reading is already a poll old. */
  private readonly onVisibility = () => {
    if (this.doc.visibilityState === "visible" && this.now() - this.lastFetchAt >= this.intervalMs) void this.refresh();
  };

  async refresh(): Promise<void> {
    if (this.doc.visibilityState !== "visible" || this.inFlight) return;
    const controller = new AbortController();
    this.inFlight = controller;
    this.lastFetchAt = this.now();
    try {
      // no-store: the Worker's cache-control is meant for Cloudflare's edge, not for the browser's own HTTP cache.
      const response = await this.fetchImpl(this.endpoint, { cache: "no-store", headers: { Accept: "application/json" }, signal: controller.signal });
      if (!response.ok || controller.signal.aborted) return;
      this.apply((await response.json()) as WorldOnAirSnapshot);
    } catch {
      // A network hiccup just skips this reading; the next poll retries and stale readings expire on their own.
    } finally {
      if (this.inFlight === controller) this.inFlight = null;
    }
  }

  private apply(snapshot: WorldOnAirSnapshot) {
    if (!Array.isArray(snapshot?.streamers)) return;
    const at = this.now();
    for (const entry of snapshot.streamers) {
      if (typeof entry?.soopId === "string" && typeof entry.live === "boolean") this.readings.set(entry.soopId, { live: entry.live, at });
    }
  }
}

/** Where a click on a member's sign goes: their live broadcast, or their station when they are off air. */
export function onAirLink(soopId: string, live: boolean): string {
  return live ? soopLiveUrl(soopId) : soopStationUrl(soopId);
}

/**
 * Opens a page in a new browser TAB. A link click is used instead of `window.open` because passing any window
 * features to `window.open` (even just noopener) makes some browsers open a popup window instead of a tab.
 */
export function openInNewTab(url: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

export function openOnAirLink(soopId: string, live: boolean, open: (url: string) => void = openInNewTab) {
  open(onAirLink(soopId, live));
}
