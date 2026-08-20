import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import type { DashboardSnapshot, OneVsOneApplication, OneVsOneResultsConfig, PromotionPost, RecordOverride, ReviewContextConfig, RosterEntry, StreamerActivityPost, StreamerRecord } from "../shared/model.js";
import { DEFAULT_ONE_VS_ONE_CONFIG } from "../shared/one-vs-one-results.js";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});
const tableName = process.env.TABLE_NAME!;
if (!tableName) throw new Error("TABLE_NAME is required");

type Item = { PK: string; SK: string; [key: string]: unknown };

async function scanByPartition<T>(PK: string): Promise<T[]> {
  const values: T[] = [];
  let ExclusiveStartKey: Record<string, any> | undefined;
  do {
    const output = await client.send(new ScanCommand({
      TableName: tableName,
      FilterExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": PK },
      ExclusiveStartKey,
    }));
    values.push(...((output.Items ?? []) as T[]));
    ExclusiveStartKey = output.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return values;
}

export async function getPosts(): Promise<PromotionPost[]> {
  return (await scanByPartition<Item & { post: PromotionPost }>("POST")).map((item) => item.post);
}

export async function putPost(post: PromotionPost, overwrite = false): Promise<boolean> {
  try {
    await client.send(new PutCommand({
      TableName: tableName,
      Item: { PK: "POST", SK: post.articleId, post, createdAt: new Date().toISOString() },
      ...(overwrite ? {} : { ConditionExpression: "attribute_not_exists(PK)" }),
    }));
    return true;
  } catch (error) {
    if ((error as { name?: string }).name === "ConditionalCheckFailedException") return false;
    throw error;
  }
}

export async function getOneVsOneApplications(): Promise<OneVsOneApplication[]> {
  return (await scanByPartition<Item & { application: OneVsOneApplication }>("ONE_VS_ONE_APPLICATION")).map((item) => item.application);
}

export async function putOneVsOneApplication(application: OneVsOneApplication): Promise<boolean> {
  try {
    await client.send(new PutCommand({
      TableName: tableName,
      Item: { PK: "ONE_VS_ONE_APPLICATION", SK: application.articleId, application, createdAt: new Date().toISOString() },
      ConditionExpression: "attribute_not_exists(PK)",
    }));
    return true;
  } catch (error) {
    if ((error as { name?: string }).name === "ConditionalCheckFailedException") return false;
    throw error;
  }
}

export async function getStreamerActivityPosts(): Promise<StreamerActivityPost[]> {
  return (await scanByPartition<Item & { post: StreamerActivityPost }>("STREAMER_ACTIVITY_POST")).map((item) => item.post);
}

export async function putStreamerActivityPost(post: StreamerActivityPost): Promise<boolean> {
  try {
    await client.send(new PutCommand({
      TableName: tableName,
      Item: { PK: "STREAMER_ACTIVITY_POST", SK: `${post.board}#${post.articleId}`, post, createdAt: new Date().toISOString() },
      ConditionExpression: "attribute_not_exists(PK)",
    }));
    return true;
  } catch (error) {
    if ((error as { name?: string }).name === "ConditionalCheckFailedException") return false;
    throw error;
  }
}

export async function getRoster(): Promise<RosterEntry[]> {
  const output = await client.send(new GetCommand({ TableName: tableName, Key: { PK: "ROSTER", SK: "CONFIG" } }));
  return (output.Item?.streamers as RosterEntry[] | undefined) ?? [];
}

export async function putRoster(streamers: RosterEntry[]): Promise<void> {
  await client.send(new PutCommand({
    TableName: tableName,
    Item: { PK: "ROSTER", SK: "CONFIG", streamers, updatedAt: new Date().toISOString() },
  }));
}

export async function getOneVsOneResults(): Promise<OneVsOneResultsConfig> {
  const output = await client.send(new GetCommand({ TableName: tableName, Key: { PK: "CONFIG", SK: "ONE_VS_ONE_RESULTS" } }));
  return (output.Item?.config as OneVsOneResultsConfig | undefined) ?? DEFAULT_ONE_VS_ONE_CONFIG;
}

export async function putOneVsOneResults(config: OneVsOneResultsConfig): Promise<void> {
  await client.send(new PutCommand({
    TableName: tableName,
    Item: { PK: "CONFIG", SK: "ONE_VS_ONE_RESULTS", config, updatedAt: new Date().toISOString() },
  }));
}

export async function getDivisionOverrides(): Promise<Record<string, number>> {
  const output = await client.send(new GetCommand({ TableName: tableName, Key: { PK: "CONFIG", SK: "DIVISION_OVERRIDES" } }));
  return (output.Item?.overrides as Record<string, number> | undefined) ?? {};
}

export async function putDivisionOverrides(overrides: Record<string, number>): Promise<void> {
  await client.send(new PutCommand({
    TableName: tableName,
    Item: { PK: "CONFIG", SK: "DIVISION_OVERRIDES", overrides, updatedAt: new Date().toISOString() },
  }));
}

export async function getRecordOverrides(): Promise<RecordOverride[]> {
  const output = await client.send(new GetCommand({ TableName: tableName, Key: { PK: "CONFIG", SK: "RECORD_OVERRIDES" } }));
  return (output.Item?.overrides as RecordOverride[] | undefined) ?? [];
}

export async function putRecordOverrides(overrides: RecordOverride[]): Promise<void> {
  await client.send(new PutCommand({
    TableName: tableName,
    Item: { PK: "CONFIG", SK: "RECORD_OVERRIDES", overrides, updatedAt: new Date().toISOString() },
  }));
}

export async function getReviewContext(): Promise<ReviewContextConfig> {
  const output = await client.send(new GetCommand({ TableName: tableName, Key: { PK: "CONFIG", SK: "REVIEW_CONTEXT" } }));
  return (output.Item?.config as ReviewContextConfig | undefined) ?? { context: "" };
}

export async function putReviewContext(config: ReviewContextConfig): Promise<void> {
  await client.send(new PutCommand({
    TableName: tableName,
    Item: { PK: "CONFIG", SK: "REVIEW_CONTEXT", config, updatedAt: new Date().toISOString() },
  }));
}

export async function getStreamers(): Promise<StreamerRecord[]> {
  return (await scanByPartition<Item & { streamer: StreamerRecord }>("STREAMER")).map((item) => item.streamer);
}

export async function putStreamers(streamers: StreamerRecord[]): Promise<void> {
  await Promise.all(streamers.map((streamer) => client.send(new PutCommand({
    TableName: tableName,
    Item: { PK: "STREAMER", SK: streamer.id, streamer, updatedAt: new Date().toISOString() },
  }))));
}

export interface BoardProgress { page?: number; latestArticleId?: string }
export interface SyncState {
  page?: number;
  latestArticleId?: string;
  boards?: {
    scope?: BoardProgress;
    division?: BoardProgress;
    elevenVsEleven?: BoardProgress;
    oneVsOne?: BoardProgress;
  };
  status: "ok" | "degraded";
  message?: string;
  updatedAt: string;
}

export async function getSyncState(): Promise<SyncState | undefined> {
  const output = await client.send(new GetCommand({ TableName: tableName, Key: { PK: "SYNC", SK: "STATE" } }));
  return output.Item?.state as SyncState | undefined;
}

export async function putSyncState(state: SyncState): Promise<void> {
  await client.send(new PutCommand({ TableName: tableName, Item: { PK: "SYNC", SK: "STATE", state } }));
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot | undefined> {
  const output = await client.send(new GetCommand({ TableName: tableName, Key: { PK: "SNAPSHOT", SK: "CURRENT" } }));
  return output.Item?.snapshot as DashboardSnapshot | undefined;
}

export async function putDashboardSnapshot(snapshot: DashboardSnapshot): Promise<void> {
  await client.send(new PutCommand({
    TableName: tableName,
    Item: { PK: "SNAPSHOT", SK: "CURRENT", snapshot, updatedAt: snapshot.generatedAt },
  }));
}
