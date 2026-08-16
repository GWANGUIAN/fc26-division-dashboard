import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import type { DashboardSnapshot } from "../shared/model.js";
import { buildOneVsOneApplications } from "../shared/one-vs-one.js";
import { attachStreamerActivityPosts } from "../shared/streamer-activity.js";
import { getOneVsOneApplications, getOneVsOneResults, getPosts, getRoster, getStreamerActivityPosts, getStreamers, getSyncState } from "./store.js";

const headers = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "public, max-age=60, stale-while-revalidate=120",
};

function response(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return { statusCode, headers, body: JSON.stringify(body) };
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  if (event.requestContext.http.method === "OPTIONS") return { statusCode: 204, headers };
  const [streamers, posts, state, applications, roster, results, activityPosts] = await Promise.all([
    getStreamers(), getPosts(), getSyncState(), getOneVsOneApplications(), getRoster(), getOneVsOneResults(), getStreamerActivityPosts(),
  ]);
  const latestPosts = [...posts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 50);
  const snapshot: DashboardSnapshot = {
    generatedAt: state?.updatedAt ?? new Date().toISOString(),
    status: state?.status ?? "degraded",
    message: state?.message,
    streamers: attachStreamerActivityPosts(streamers, roster, activityPosts)
      .sort((a, b) => a.currentDivision - b.currentDivision || a.displayName.localeCompare(b.displayName, "ko")),
    latestPosts,
    oneVsOneApplications: buildOneVsOneApplications(applications, roster, results),
  };
  if (event.rawPath.endsWith("/latest")) return response(200, { generatedAt: snapshot.generatedAt, status: snapshot.status, posts: latestPosts });
  if (event.rawPath.endsWith("/one-vs-one")) return response(200, {
    generatedAt: snapshot.generatedAt, status: snapshot.status, opponent: results.opponent, applications: snapshot.oneVsOneApplications,
  });
  return response(200, snapshot);
}
