import type { OneVsOneResultsConfig, RosterEntry } from "../shared/model.js";
import { parseDivisionOverrides } from "../shared/division-overrides.js";
import { parseOneVsOneResults } from "../shared/one-vs-one-results.js";
import { parseRoster } from "../shared/roster.js";
import { buildDashboardSnapshot } from "../shared/snapshot.js";
import {
  getOneVsOneApplications, getPosts, getStreamerActivityPosts, getSyncState,
  putDashboardSnapshot, putDivisionOverrides, putOneVsOneResults, putRoster, putStreamers,
} from "./store.js";
import { buildStreamerRecords } from "../shared/promotion.js";

export async function handler(event: {
  rosterYaml?: string;
  streamers?: RosterEntry[];
  oneVsOneResultsYaml?: string;
  oneVsOneResults?: OneVsOneResultsConfig;
  divisionOverridesYaml?: string;
  divisionOverrides?: Record<string, number>;
}): Promise<{ count: number; evaluationResults: number }> {
  const streamers = event.rosterYaml ? parseRoster(event.rosterYaml) : event.streamers;
  if (!streamers?.length) throw new Error("Pass rosterYaml or a non-empty streamers array");
  const results = event.oneVsOneResultsYaml ? parseOneVsOneResults(event.oneVsOneResultsYaml) : event.oneVsOneResults;
  if (!results) throw new Error("Pass oneVsOneResultsYaml or oneVsOneResults");
  const divisionOverrides = event.divisionOverridesYaml
    ? parseDivisionOverrides(event.divisionOverridesYaml)
    : event.divisionOverrides;
  const [posts, applications, activityPosts, state] = await Promise.all([
    getPosts(), getOneVsOneApplications(), getStreamerActivityPosts(), getSyncState(),
  ]);
  const records = buildStreamerRecords(posts, streamers);
  await putRoster(streamers);
  await putOneVsOneResults(results);
  if (divisionOverrides) await putDivisionOverrides(divisionOverrides);
  await putStreamers(records);
  await putDashboardSnapshot(buildDashboardSnapshot({
    state,
    streamers: records,
    posts,
    applications,
    roster: streamers,
    results,
    activityPosts,
  }));
  return { count: streamers.length, evaluationResults: results.results.length };
}
