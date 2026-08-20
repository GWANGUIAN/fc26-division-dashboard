import type { OneVsOneResultsConfig, RecordOverride, RosterEntry } from "../shared/model.js";
import { parseDivisionOverrides } from "../shared/division-overrides.js";
import { parseOneVsOneResults } from "../shared/one-vs-one-results.js";
import { parseRecordOverrides } from "../shared/record-overrides.js";
import { parseReviewContext } from "../shared/review-context.js";
import { parseRoster } from "../shared/roster.js";
import { buildDashboardSnapshot } from "../shared/snapshot.js";
import {
  getOneVsOneApplications, getPosts, getRecordOverrides, getStreamerActivityPosts, getSyncState,
  putDashboardSnapshot, putDivisionOverrides, putOneVsOneResults, putRecordOverrides, putReviewContext, putRoster, putStreamers,
} from "./store.js";
import { buildStreamerRecords } from "../shared/promotion.js";

export async function handler(event: {
  rosterYaml?: string;
  streamers?: RosterEntry[];
  oneVsOneResultsYaml?: string;
  oneVsOneResults?: OneVsOneResultsConfig;
  divisionOverridesYaml?: string;
  divisionOverrides?: Record<string, number>;
  recordOverridesYaml?: string;
  recordOverrides?: RecordOverride[];
  reviewContextYaml?: string;
  reviewContext?: { context: string };
}): Promise<{ count: number; evaluationResults: number }> {
  const streamers = event.rosterYaml ? parseRoster(event.rosterYaml) : event.streamers;
  if (!streamers?.length) throw new Error("Pass rosterYaml or a non-empty streamers array");
  const results = event.oneVsOneResultsYaml ? parseOneVsOneResults(event.oneVsOneResultsYaml) : event.oneVsOneResults;
  if (!results) throw new Error("Pass oneVsOneResultsYaml or oneVsOneResults");
  const divisionOverrides = event.divisionOverridesYaml
    ? parseDivisionOverrides(event.divisionOverridesYaml)
    : event.divisionOverrides;
  const newRecordOverrides = event.recordOverridesYaml
    ? parseRecordOverrides(event.recordOverridesYaml)
    : event.recordOverrides;
  const newReviewContext = event.reviewContextYaml ? parseReviewContext(event.reviewContextYaml) : event.reviewContext;
  const [posts, applications, activityPosts, state, storedRecordOverrides] = await Promise.all([
    getPosts(), getOneVsOneApplications(), getStreamerActivityPosts(), getSyncState(),
    newRecordOverrides ? Promise.resolve(undefined) : getRecordOverrides(),
  ]);
  const recordOverrides = newRecordOverrides ?? storedRecordOverrides ?? [];
  const records = buildStreamerRecords(posts, streamers, recordOverrides);
  await putRoster(streamers);
  await putOneVsOneResults(results);
  if (divisionOverrides) await putDivisionOverrides(divisionOverrides);
  if (newRecordOverrides) await putRecordOverrides(newRecordOverrides);
  if (newReviewContext) await putReviewContext(newReviewContext);
  await putStreamers(records);
  await putDashboardSnapshot(buildDashboardSnapshot({
    state,
    streamers: records,
    posts,
    applications,
    roster: streamers,
    results,
    activityPosts,
    recordOverrides,
  }));
  return { count: streamers.length, evaluationResults: results.results.length };
}
