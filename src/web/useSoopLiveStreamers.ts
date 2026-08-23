import { useEffect, useRef, useState } from "react";
import type { StreamerRecord } from "../shared/model.js";
import {
  matchLiveStreamers,
  type LiveRosterEntry,
  type SoopLiveSnapshot,
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
  const [entries, setEntries] = useState<LiveRosterEntry[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>();
  const orderRef = useRef<string[]>([]);
  const streamersRef = useRef(streamers);
  streamersRef.current = streamers;

  useEffect(() => {
    if (!SOOP_LIVE_ENABLED) return;
    let cancelled = false;

    async function tick() {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch("/api/soop-live", { headers: { Accept: "application/json" } });
        if (!response.ok || cancelled) return;
        const snapshot = await response.json() as SoopLiveSnapshot;
        if (cancelled) return;
        const matched = matchLiveStreamers(streamersRef.current, snapshot.streamers);
        setEntries(reorder(orderRef, matched));
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

  return { enabled: SOOP_LIVE_ENABLED, entries, updatedAt };
}
