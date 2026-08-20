import type { StreamerRecord } from "./model.js";

export type DivisionHistogramEntry = {
  name: string;
  isFancy: boolean;
};

export type DivisionHistogramBucket = {
  division: number;
  count: number;
  entries: DivisionHistogramEntry[];
};

/** Groups streamers into per-division buckets (1-10) with sorted name lists, for the distribution histogram. */
export function buildDivisionHistogram(streamers: StreamerRecord[]): DivisionHistogramBucket[] {
  return Array.from({ length: 10 }, (_, index) => {
    const division = index + 1;
    const entries = streamers
      .filter((streamer) => streamer.currentDivision === division)
      .map((streamer) => ({ name: streamer.displayName, isFancy: !!streamer.isFancy }))
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));
    return { division, count: entries.length, entries };
  });
}
