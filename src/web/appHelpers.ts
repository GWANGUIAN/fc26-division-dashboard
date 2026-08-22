import type { DashboardSnapshot, StreamerRecord } from "../shared/model.js";

export const divisions = Array.from({ length: 10 }, (_, index) => index + 1);

/**
 * `?fancyMembers=` lets a URL grant the fancy treatment on top of whatever
 * roster.yaml already sets via isFancy. `all` (case-insensitive) applies it
 * to every streamer; otherwise each comma-separated entry is matched against
 * a streamer's slug, SOOP ID, display name, or cafe aliases.
 */
function parseFancyMembersParam(search: string): {
  all: boolean;
  matchers: Set<string>;
} {
  const raw = new URLSearchParams(search).get("fancyMembers");
  const parts = (raw ?? "")
    .split(",")
    .map((part) => part.trim().toLocaleLowerCase("ko-KR"))
    .filter(Boolean);
  return { all: parts.includes("all"), matchers: new Set(parts) };
}

function matchesFancyMembers(
  streamer: StreamerRecord,
  matchers: Set<string>,
): boolean {
  const candidates = [
    streamer.id,
    streamer.soopId,
    streamer.displayName,
    ...streamer.cafeAliases,
  ].filter((value): value is string => Boolean(value));
  return candidates.some((candidate) =>
    matchers.has(candidate.toLocaleLowerCase("ko-KR")),
  );
}

export function applyFancyMembersOverride(
  snapshot: DashboardSnapshot,
  search: string,
): DashboardSnapshot {
  const { all, matchers } = parseFancyMembersParam(search);
  if (!all && matchers.size === 0) return snapshot;
  return {
    ...snapshot,
    streamers: snapshot.streamers.map((streamer) => ({
      ...streamer,
      isFancy:
        streamer.isFancy || all || matchesFancyMembers(streamer, matchers),
    })),
  };
}

export function buildDivisionListText(streamers: StreamerRecord[]) {
  return divisions
    .map((division) => {
      const label = division === 10 ? "10부(미보고)" : `${division}부`;
      const names = streamers
        .filter((streamer) => streamer.currentDivision === division)
        .map((streamer) => streamer.displayName);
      return `- ${label}: ${names.length ? names.join(", ") : "-"}`;
    })
    .join("\n");
}
