import { parse } from "yaml";
import type { RecordOverride } from "./model.js";

export function parseRecordOverrides(source: string): RecordOverride[] {
  const parsed = parse(source) as { overrides?: unknown } | null;
  const overrides = parsed?.overrides ?? [];
  if (!Array.isArray(overrides)) throw new Error("record-overrides.yaml must contain an overrides array");

  const seen = new Set<string>();
  return overrides.map((entry, index) => {
    const { soopId, division, record } = (entry ?? {}) as Record<string, unknown>;
    if (typeof soopId !== "string" || !soopId.trim()) {
      throw new Error(`record-overrides.yaml entry ${index}: soopId is required`);
    }
    if (!Number.isInteger(division) || (division as number) < 1 || (division as number) > 10) {
      throw new Error(`record-overrides.yaml entry ${index} (${soopId}): division must be an integer 1-10`);
    }
    const key = `${soopId}#${division}`;
    if (seen.has(key)) throw new Error(`record-overrides.yaml has a duplicate soopId+division: ${key}`);
    seen.add(key);

    if (typeof record !== "object" || record === null) {
      throw new Error(`record-overrides.yaml entry ${index} (${soopId}): record is required`);
    }
    const { wins, draws, losses } = record as Record<string, unknown>;
    if (![wins, draws, losses].every((count) => Number.isInteger(count) && (count as number) >= 0)) {
      throw new Error(`record-overrides.yaml entry ${index} (${soopId}): record.wins/draws/losses must be non-negative integers`);
    }

    return {
      soopId,
      division: division as number,
      record: { wins: wins as number, draws: draws as number, losses: losses as number },
    };
  });
}
