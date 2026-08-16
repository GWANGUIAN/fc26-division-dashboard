import type { OneVsOneResultsConfig, RosterEntry } from "../shared/model.js";
import { parseOneVsOneResults } from "../shared/one-vs-one-results.js";
import { parseRoster } from "../shared/roster.js";
import { getPosts, putOneVsOneResults, putRoster, putStreamers } from "./store.js";
import { buildStreamerRecords } from "../shared/promotion.js";

export async function handler(event: {
  rosterYaml?: string;
  streamers?: RosterEntry[];
  oneVsOneResultsYaml?: string;
  oneVsOneResults?: OneVsOneResultsConfig;
}): Promise<{ count: number; evaluationResults: number }> {
  const streamers = event.rosterYaml ? parseRoster(event.rosterYaml) : event.streamers;
  if (!streamers?.length) throw new Error("Pass rosterYaml or a non-empty streamers array");
  const results = event.oneVsOneResultsYaml ? parseOneVsOneResults(event.oneVsOneResultsYaml) : event.oneVsOneResults;
  if (!results) throw new Error("Pass oneVsOneResultsYaml or oneVsOneResults");
  await putRoster(streamers);
  await putOneVsOneResults(results);
  await putStreamers(buildStreamerRecords(await getPosts(), streamers));
  return { count: streamers.length, evaluationResults: results.results.length };
}
