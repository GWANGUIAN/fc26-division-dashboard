import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { getDashboardSnapshot, getOneVsOneResults } from "./store.js";

const headers = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "public, max-age=60, stale-while-revalidate=120",
};

function response(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return { statusCode, headers, body: JSON.stringify(body) };
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  if (event.requestContext.http.method === "OPTIONS") return { statusCode: 204, headers };
  const expectedToken = process.env.ORIGIN_AUTH_TOKEN;
  if (expectedToken && event.headers["x-dashboard-origin"] !== expectedToken) {
    return response(403, { message: "Forbidden" });
  }
  const snapshot = await getDashboardSnapshot();
  if (!snapshot) return response(503, { message: "Initial data collection is in progress" });
  if (event.rawPath.endsWith("/latest")) return response(200, { generatedAt: snapshot.generatedAt, status: snapshot.status, posts: snapshot.latestPosts });
  if (event.rawPath.endsWith("/one-vs-one")) return response(200, {
    generatedAt: snapshot.generatedAt,
    status: snapshot.status,
    opponent: (await getOneVsOneResults()).opponent,
    applications: snapshot.oneVsOneApplications,
  });
  return response(200, snapshot);
}
