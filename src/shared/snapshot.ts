import type {
  DashboardSnapshot,
  OneVsOneApplication,
  OneVsOneResultsConfig,
  PromotionPost,
  RecordOverride,
  RosterEntry,
  StreamerActivityPost,
  StreamerRecord,
} from "./model.js";
import { buildOneVsOneApplications } from "./one-vs-one.js";
import { buildStreamerRecords, matchRosterEntry } from "./promotion.js";
import { attachStreamerActivityPosts } from "./streamer-activity.js";

export interface SnapshotState {
  status: "ok" | "degraded";
  message?: string;
  updatedAt: string;
}

export interface SnapshotInput {
  state?: SnapshotState;
  streamers: StreamerRecord[];
  posts: PromotionPost[];
  applications: OneVsOneApplication[];
  roster: RosterEntry[];
  results: OneVsOneResultsConfig;
  activityPosts: StreamerActivityPost[];
  recordOverrides?: RecordOverride[];
}

/**
 * Builds the complete public response only while data changes. Readers can
 * then retrieve one compact item instead of scanning every partition.
 */
export function buildDashboardSnapshot(input: SnapshotInput): DashboardSnapshot {
  const { state, streamers, posts, applications, roster, results, activityPosts, recordOverrides } = input;
  return {
    generatedAt: state?.updatedAt ?? new Date().toISOString(),
    status: state?.status ?? "degraded",
    message: state?.message,
    // The public record is always rebuilt from the source reports and roster.
    // This prevents a previously persisted streamer shape from omitting a
    // newly added derived field such as previous promotion history.
    streamers: attachStreamerActivityPosts(buildStreamerRecords(posts, roster, recordOverrides), roster, activityPosts)
      .sort((a, b) => a.currentDivision - b.currentDivision || a.displayName.localeCompare(b.displayName, "ko")),
    // A deleted streamer's own posts are still matched by cafeAlias (see
    // buildStreamerRecords), so they must be filtered out here too, or a
    // post from before deletion would still surface in the activity feed.
    latestPosts: posts
      .filter((post) => !matchRosterEntry(post.cafeAuthor, roster)?.deleted)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .slice(0, 50),
    oneVsOneApplications: buildOneVsOneApplications(applications, roster, results),
  };
}
