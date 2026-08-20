import { parse } from "yaml";
import type { RosterEntry } from "./model.js";

export function parseRoster(source: string): RosterEntry[] {
  const parsed = parse(source) as { streamers?: RosterEntry[] } | null;
  if (!parsed?.streamers || !Array.isArray(parsed.streamers)) throw new Error("roster.yaml must contain a streamers array");
  // SOOP IDs are stable unique identifiers, so an operator may omit the
  // duplicated `slug` field when adding a mapped streamer.  Completely blank
  // template rows are ignored to keep the YAML convenient to maintain.
  const usedSlugs = new Set<string>();
  const entries = parsed.streamers
    .filter((entry) => entry.slug || entry.displayName || entry.soopId || entry.cafeAliases?.some(Boolean))
    .map((entry) => {
      const explicitSlug = entry.slug?.trim();
      const baseSlug = explicitSlug || entry.soopId?.trim() || "";
      let slug = baseSlug;
      // A malformed duplicate SOOP ID must not prevent every other roster
      // update. Keep the visible entry and make its internal key distinct.
      if (!explicitSlug) {
        let suffix = 2;
        while (usedSlugs.has(slug)) slug = `${baseSlug}-${suffix++}`;
      }
      usedSlugs.add(slug);
      return { ...entry, slug, cafeAliases: Array.isArray(entry.cafeAliases) ? entry.cafeAliases : [] };
    });
  const slugs = new Set<string>();
  for (const entry of entries) {
    if (!entry.slug || !entry.displayName) {
      throw new Error(`Invalid roster entry: ${entry.slug || "unknown"}`);
    }
    if (slugs.has(entry.slug)) throw new Error(`Duplicate roster slug: ${entry.slug}`);
    slugs.add(entry.slug);
    if (entry.override?.division !== null && entry.override?.division !== undefined && (entry.override.division < 1 || entry.override.division > 10)) {
      throw new Error(`Invalid override division for ${entry.slug}`);
    }
  }
  return entries;
}
