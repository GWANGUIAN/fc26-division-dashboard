import { describe, expect, it } from "vitest";
import { buildDivisionHistogram } from "./division-histogram.js";
import type { StreamerRecord } from "./model.js";

function streamer(
  id: string,
  displayName: string,
  currentDivision: number,
  isFancy = false,
): StreamerRecord {
  return {
    id,
    displayName,
    cafeAliases: [],
    autoUpdate: true,
    overridePolicy: "auto",
    currentDivision,
    isMapped: true,
    isFancy,
  };
}

describe("buildDivisionHistogram", () => {
  it("returns all 10 divisions with zero counts for an empty roster", () => {
    const buckets = buildDivisionHistogram([]);
    expect(buckets).toHaveLength(10);
    expect(buckets.map((bucket) => bucket.division)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(buckets.every((bucket) => bucket.count === 0 && bucket.entries.length === 0)).toBe(true);
  });

  it("counts streamers per division and sorts names within a division (Korean order)", () => {
    const buckets = buildDivisionHistogram([
      streamer("1", "다미", 3),
      streamer("2", "가은", 3),
      streamer("3", "나은", 3),
    ]);
    const division3 = buckets.find((bucket) => bucket.division === 3)!;
    expect(division3.count).toBe(3);
    expect(division3.entries.map((entry) => entry.name)).toEqual(["가은", "나은", "다미"]);
  });

  it("buckets division-10 (season non-participation) separately from real divisions", () => {
    const buckets = buildDivisionHistogram([
      streamer("1", "웨이브", 1),
      streamer("2", "미보고", 10),
    ]);
    expect(buckets.find((bucket) => bucket.division === 1)?.entries.map((entry) => entry.name)).toEqual(["웨이브"]);
    const season = buckets.find((bucket) => bucket.division === 10)!;
    expect(season.count).toBe(1);
    expect(season.entries.map((entry) => entry.name)).toEqual(["미보고"]);
  });

  it("marks fancy streamers within a bucket's entries", () => {
    const buckets = buildDivisionHistogram([
      streamer("1", "가은", 2, true),
      streamer("2", "나은", 2, false),
    ]);
    const division2 = buckets.find((bucket) => bucket.division === 2)!;
    expect(division2.entries).toEqual([
      { name: "가은", isFancy: true },
      { name: "나은", isFancy: false },
    ]);
  });
});
