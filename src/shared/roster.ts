import { parse } from "yaml";
import type { RosterEntry } from "./model.js";

export function parseRoster(source: string): RosterEntry[] {
  const parsed = parse(source) as { streamers?: RosterEntry[] } | null;
  if (!parsed?.streamers || !Array.isArray(parsed.streamers)) throw new Error("roster.yaml must contain a streamers array");
  // SOOP IDs are stable unique identifiers, so an operator may omit the
  // duplicated `slug` field when adding a mapped streamer.  Completely blank
  // template rows are ignored to keep the YAML convenient to maintain.
  const entries = parsed.streamers
    .filter((entry) => entry.slug || entry.displayName || entry.soopId || entry.cafeAliases?.some(Boolean))
    .map((entry) => ({ ...entry, slug: entry.slug?.trim() || entry.soopId?.trim() || "" }));
  const slugs = new Set<string>();
  for (const entry of entries) {
    if (!entry.slug || !entry.displayName || !Array.isArray(entry.cafeAliases) || entry.cafeAliases.length === 0) {
      throw new Error(`Invalid roster entry: ${entry.slug || "unknown"}`);
    }
    if (slugs.has(entry.slug)) throw new Error(`Duplicate roster slug: ${entry.slug}`);
    slugs.add(entry.slug);
    if (entry.override?.division !== null && entry.override?.division !== undefined && (entry.override.division < 1 || entry.override.division > 10)) {
      throw new Error(`Invalid override division for ${entry.slug}`);
    }
    if (entry.soopTags?.some((tag) => !["파트너", "베스트", "루키존", "스포츠", "서포터즈"].includes(tag))) {
      throw new Error(`Invalid SOOP tag for ${entry.slug}`);
    }
  }
  return entries;
}
