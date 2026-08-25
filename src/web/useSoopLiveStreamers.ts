import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { StreamerRecord } from "../shared/model.js";
import {
  matchLiveStreamers,
  type LiveRosterEntry,
  type SoopLiveSnapshot,
  type SoopLiveStreamer,
} from "../shared/soop-live.js";

const POLL_INTERVAL_MS = 120_000;
// Beyond visibility, also require actual mouse/keyboard/touch activity
// within this window — a tab left visible but unattended (e.g. a
// background browser window) stops polling until the user comes back.
const IDLE_THRESHOLD_MS = 5 * 60_000;
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "wheel"] as const;
export const SOOP_LIVE_ENABLED = import.meta.env.VITE_ENABLE_SOOP_LIVE === "true";

export interface SoopLiveState {
  enabled: boolean;
  loaded: boolean;
  entries: LiveRosterEntry[];
  updatedAt?: string;
  containerRef: RefObject<HTMLElement | null>;
}

function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Keeps previously-seen streamers in their established position and only
 * randomizes where newly-live streamers land, so the rail doesn't reshuffle
 * on every refresh (only the first time a streamer appears).
 */
function reorder(orderRef: { current: string[] }, matched: LiveRosterEntry[]): LiveRosterEntry[] {
  const bySoopId = new Map(matched.map((entry) => [entry.soopId, entry]));
  const stillLive = orderRef.current.filter((soopId) => bySoopId.has(soopId));
  const freshIds = shuffled(matched.map((entry) => entry.soopId).filter((soopId) => !stillLive.includes(soopId)));
  orderRef.current = [...stillLive, ...freshIds];
  return orderRef.current.flatMap((soopId) => bySoopId.get(soopId) ?? []);
}

export function useSoopLiveStreamers(streamers: StreamerRecord[]): SoopLiveState {
  // Raw sooplive feed, kept separate from the roster match below: the
  // dashboard snapshot (and therefore `streamers`) loads on its own
  // schedule and can resolve before or after this fetch. Matching is
  // recomputed (see the memo below) whenever either value changes, so a
  // late-arriving roster still triggers a fresh match instead of waiting
  // for the next poll to happen to catch it.
  const [rawStreamers, setRawStreamers] = useState<SoopLiveStreamer[]>();
  const [updatedAt, setUpdatedAt] = useState<string>();
  const orderRef = useRef<string[]>([]);
  const lastActivityRef = useRef(Date.now());
  const containerRef = useRef<HTMLElement | null>(null);
  // Section is above the fold on load, so default to visible instead of
  // waiting for the observer's first callback (which would otherwise skip
  // the very first tick while the section is still on screen).
  const inViewportRef = useRef(true);

  useEffect(() => {
    if (!SOOP_LIVE_ENABLED) return;
    const markActive = () => {
      lastActivityRef.current = Date.now();
    };
    for (const eventName of ACTIVITY_EVENTS) {
      document.addEventListener(eventName, markActive, { passive: true });
    }
    return () => {
      for (const eventName of ACTIVITY_EVENTS) {
        document.removeEventListener(eventName, markActive);
      }
    };
  }, []);

  useEffect(() => {
    if (!SOOP_LIVE_ENABLED) return;
    let cancelled = false;

    async function tick() {
      if (document.visibilityState !== "visible") return;
      if (!inViewportRef.current) return;
      if (Date.now() - lastActivityRef.current > IDLE_THRESHOLD_MS) return;
      try {
        // The Worker's response carries a cache-control for Cloudflare's edge
        // cache. Without no-store, the browser's own HTTP cache would also
        // honor it and skip the network entirely on a page reload, silently
        // replaying whatever (possibly empty) list was last cached.
        const response = await fetch("/api/soop-live", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!response.ok || cancelled) return;
        const snapshot = await response.json() as SoopLiveSnapshot;
        if (cancelled) return;
        setRawStreamers(snapshot.streamers);
        setUpdatedAt(snapshot.generatedAt);
      } catch {
        // A network hiccup just skips this refresh; the next tick (or the
        // next time the tab becomes visible) retries.
      }
    }

    // Re-check on both document visibility and section-in-viewport changes —
    // either one flipping to true should trigger an immediate catch-up tick
    // instead of waiting for the next scheduled interval.
    const node = containerRef.current;
    let observer: IntersectionObserver | undefined;
    if (node && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(([entry]) => {
        inViewportRef.current = entry?.isIntersecting ?? true;
        tick();
      });
      observer.observe(node);
    }

    tick();
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
      observer?.disconnect();
    };
  }, []);

  // Computed during render (not in a follow-up effect) so `loaded` and
  // `entries` always land in the same commit — an effect-based version
  // caused a one-render flash of the empty state between "raw feed just
  // arrived" and "matched against the roster" for every fetch.
  const entries = useMemo(
    () => (rawStreamers ? reorder(orderRef, matchLiveStreamers(streamers, rawStreamers)) : []),
    [streamers, rawStreamers],
  );

  return { enabled: SOOP_LIVE_ENABLED, loaded: rawStreamers !== undefined, entries, updatedAt, containerRef };
}
