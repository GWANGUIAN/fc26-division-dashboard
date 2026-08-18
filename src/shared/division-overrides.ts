import { parse } from "yaml";

export type DivisionOverrides = Record<string, number>;

export function parseDivisionOverrides(source: string): DivisionOverrides {
  const parsed = parse(source) as { overrides?: unknown } | null;
  const overrides = parsed?.overrides ?? {};
  if (typeof overrides !== "object" || overrides === null || Array.isArray(overrides)) {
    throw new Error("division-overrides.yaml must contain an overrides map");
  }
  for (const [articleId, division] of Object.entries(overrides as Record<string, unknown>)) {
    if (!/^\d+$/u.test(articleId)) throw new Error(`Invalid article ID in division-overrides.yaml: ${articleId}`);
    if (!Number.isInteger(division) || (division as number) < 1 || (division as number) > 10) {
      throw new Error(`Invalid division for article ${articleId} in division-overrides.yaml`);
    }
  }
  return overrides as DivisionOverrides;
}
