import { useEffect, useRef, useState } from "react";
import type { StreamerRecord } from "../shared/model.js";
import {
  matchLiveStreamers,
  type LiveRosterEntry,
  type SoopLiveSnapshot,
  type SoopLiveStreamer,
} from "../shared/soop-live.js";

const POLL_INTERVAL_MS = 60_000;
export const SOOP_LIVE_ENABLED = import.meta.env.VITE_ENABLE_SOOP_LIVE === "true";

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
 * on every 60s refresh (only the first time a streamer appears).
 */
function reorder(orderRef: { current: string[] }, matched: LiveRosterEntry[]): LiveRosterEntry[] {
  const bySoopId = new Map(matched.map((entry) => [entry.soopId, entry]));
  const stillLive = orderRef.current.filter((soopId) => bySoopId.has(soopId));
  const freshIds = shuffled(matched.map((entry) => entry.soopId).filter((soopId) => !stillLive.includes(soopId)));
  orderRef.current = [...stillLive, ...freshIds];
  return orderRef.current.flatMap((soopId) => bySoopId.get(soopId) ?? []);
}

export function useSoopLiveStreamers(streamers: StreamerRecord[]) {
  // Raw sooplive feed, kept separate from the roster match below: the
  // dashboard snapshot (and therefore `streamers`) loads on its own
  // schedule and can resolve before or after this fetch. Matching in a
  // dedicated effect keyed on both values means a late-arriving roster
  // still triggers a fresh match instead of waiting up to 60s for the next
  // poll to happen to catch it.
  const [rawStreamers, setRawStreamers] = useState<SoopLiveStreamer[]>();
  const [updatedAt, setUpdatedAt] = useState<string>();
  const [entries, setEntries] = useState<LiveRosterEntry[]>([]);
  const orderRef = useRef<string[]>([]);

  useEffect(() => {
    if (!SOOP_LIVE_ENABLED) return;
    let cancelled = false;

    async function tick() {
      if (document.visibilityState !== "visible") return;
      try {
        // The Worker's response carries a cache-control for Cloudflare's edge
        // cache (55s). Without no-store, the browser's own HTTP cache would
        // also honor it and skip the network entirely on a page reload,
        // silently replaying whatever (possibly empty) list was last cached.
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

    tick();
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);

  useEffect(() => {
    if (!rawStreamers) return;
    setEntries(reorder(orderRef, matchLiveStreamers(streamers, rawStreamers)));
  }, [streamers, rawStreamers]);

  return { enabled: SOOP_LIVE_ENABLED, loaded: rawStreamers !== undefined, entries, updatedAt };
}
