import type { StreamerRecord } from "./model.js";

export type DivisionHistogramBucket = {
  division: number;
  count: number;
  names: string[];
};

/** Groups streamers into per-division buckets (1-10) with sorted name lists, for the distribution histogram. */
export function buildDivisionHistogram(streamers: StreamerRecord[]): DivisionHistogramBucket[] {
  return Array.from({ length: 10 }, (_, index) => {
    const division = index + 1;
    const names = streamers
      .filter((streamer) => streamer.currentDivision === division)
      .map((streamer) => streamer.displayName)
      .sort((a, b) => a.localeCompare(b, "ko"));
    return { division, count: names.length, names };
  });
}
