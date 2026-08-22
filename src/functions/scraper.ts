import type { ScheduledEvent } from "aws-lambda";
import {
  BOARDS, cafeArticleUrl, type BoardId, type OneVsOneApplication, type PromotionPost, type RecordOverride,
  type StreamerActivityBoard, type StreamerActivityPost, type StreamerRecord,
} from "../shared/model.js";
import { isOneVsOneApplication } from "../shared/one-vs-one.js";
import { buildStreamerRecords, isCompleteReview } from "../shared/promotion.js";
import { isDirectPromotionPost } from "../shared/streamer-activity.js";
import { buildDashboardSnapshot } from "../shared/snapshot.js";
import { collectArticle, collectPage, normalizeCafeDate, SourceBlockedError } from "./naver.js";
import { extractRecordFromImages } from "./record-extraction.js";
import { generateStreamerReview } from "./streamer-review.js";
import {
  getDivisionOverrides, getOneVsOneApplications, getOneVsOneResults, getPosts, getRecordOverrides, getReviewContext, getRoster,
  getStreamerActivityPosts, getSyncState, putDashboardSnapshot, putOneVsOneApplication, putPost, putStreamerActivityPost,
  putStreamers, putSyncState, type SyncState,
} from "./store.js";

type ScrapeMode = "incremental" | "reconcile";
type ScrapeEvent = ScheduledEvent<{ mode?: ScrapeMode; articleId?: string }> | { mode?: ScrapeMode; articleId?: string };
const maxPagesPerRun = Number(process.env.MAX_PAGES_PER_RUN ?? 20);
const maxImageBackfillsPerRun = Number(process.env.MAX_IMAGE_BACKFILLS_PER_RUN ?? 3);
const maxImageCollectionAttempts = Number(process.env.MAX_IMAGE_COLLECTION_ATTEMPTS ?? 3);
const maxRecordBackfillsPerRun = Number(process.env.MAX_RECORD_BACKFILLS_PER_RUN ?? 5);
const maxRecordExtractionAttempts = Number(process.env.MAX_RECORD_EXTRACTION_ATTEMPTS ?? 3);
const maxReviewBackfillsPerRun = Number(process.env.MAX_REVIEW_BACKFILLS_PER_RUN ?? 5);
const maxReviewAttempts = Number(process.env.MAX_REVIEW_ATTEMPTS ?? 3);
const activityBoards: StreamerActivityBoard[] = ["scope", "elevenVsEleven"];

export async function handler(event: ScrapeEvent = {}): Promise<void> {
  const mode: ScrapeMode = ("detail" in event ? event.detail?.mode : event.mode) ?? "incremental";
  const articleId = "detail" in event ? event.detail?.articleId : event.articleId;
  const state = await getSyncState();
  const divisionOverrides = await getDivisionOverrides();
  const recordOverrides = await getRecordOverrides();
  const knownPosts = await getPosts();
  const knownApplications = await getOneVsOneApplications();
  const knownActivityPosts = await getStreamerActivityPosts();
  const knownIds = new Set(knownPosts.map((post) => post.articleId));
  const knownApplicationIds = new Set(knownApplications.map((application) => application.articleId));
  const knownActivityIds = new Map<StreamerActivityBoard, Set<string>>(activityBoards.map((board) => [
    board, new Set(knownActivityPosts.filter((post) => post.board === board).map((post) => post.articleId)),
  ]));
  const progress = state?.boards ?? {};
  const nextPages: Record<BoardId, number> = {
    scope: mode === "reconcile" ? (progress.scope?.page ?? 1) : 1,
    division: mode === "reconcile" ? (progress.division?.page ?? state?.page ?? 1) : 1,
    elevenVsEleven: mode === "reconcile" ? (progress.elevenVsEleven?.page ?? 1) : 1,
    oneVsOne: mode === "reconcile" ? (progress.oneVsOne?.page ?? 1) : 1,
  };
  const newest: Record<BoardId, string | undefined> = {
    scope: progress.scope?.latestArticleId,
    division: progress.division?.latestArticleId ?? state?.latestArticleId,
    elevenVsEleven: progress.elevenVsEleven?.latestArticleId,
    oneVsOne: progress.oneVsOne?.latestArticleId,
  };

  if (articleId) {
    const existing = knownPosts.find((post) => post.articleId === articleId);
    if (!existing) throw new Error(`Cannot enrich unknown article: ${articleId}`);
    const enriched = await collectArticle(existing, "division", divisionOverrides);
    if (enriched) await putPost(enriched, true);
    const updatedPosts = enriched ? knownPosts.map((post) => post.articleId === articleId ? enriched : post) : knownPosts;
    const roster = await getRoster();
    const streamers = buildStreamerRecords(updatedPosts, roster, recordOverrides);
    await putStreamers(streamers);
    await publishSnapshot({
      state,
      streamers,
      posts: updatedPosts,
      applications: knownApplications,
      roster,
      activityPosts: knownActivityPosts,
      recordOverrides,
    });
    return;
  }

  try {
    nextPages.division = await scrapeDivision(mode, nextPages.division, knownPosts, knownIds, newest, divisionOverrides);
    nextPages.oneVsOne = await scrapeOneVsOne(mode, nextPages.oneVsOne, knownApplications, knownApplicationIds, newest);
    for (const board of activityBoards) {
      const boardProgress = progress[board]?.page ?? 1;
      const knownForBoard = knownActivityIds.get(board)!;
      nextPages[board] = await scrapeActivityBoard(board, mode, nextPages[board], knownActivityPosts, knownForBoard, newest);
      // Incremental work always checks page 1 first. If an initial backfill was
      // paused, continue its independent checkpoint in the same invocation.
      if (mode === "incremental" && nextPages[board] === 1 && boardProgress > 1) {
        nextPages[board] = await scrapeActivityBoard(board, "reconcile", boardProgress, knownActivityPosts, knownForBoard, newest);
      }
    }
    const roster = await getRoster();
    await backfillMissingReportImages(knownPosts, roster, divisionOverrides);
    await backfillMissingRecords(knownPosts);
    let streamers = buildStreamerRecords(knownPosts, roster, recordOverrides);
    const reviewContext = await getReviewContext();
    await backfillMissingReviews(knownPosts, streamers, reviewContext.context);
    streamers = buildStreamerRecords(knownPosts, roster, recordOverrides);
    await putStreamers(streamers);
    const nextState = await writeState("ok", undefined, nextPages, newest);
    await publishSnapshot({
      state: nextState,
      streamers,
      posts: knownPosts,
      applications: knownApplications,
      roster,
      activityPosts: knownActivityPosts,
      recordOverrides,
    });
  } catch (error) {
    const message = error instanceof SourceBlockedError ? error.message : `Collection failed: ${(error as Error).message}`;
    await writeState("degraded", message, nextPages, newest);
    throw error;
  }
}

async function backfillMissingReportImages(
  posts: PromotionPost[],
  roster: Awaited<ReturnType<typeof getRoster>>,
  divisionOverrides: Record<string, number>,
): Promise<void> {
  const candidates = buildStreamerRecords(posts, roster)
    // A page can render before Naver exposes its lazy media. Retry only empty
    // latest reports and cap attempts so genuinely text-only reports do not
    // generate permanent collection traffic.
    .flatMap((streamer) => streamer.lastPost
      && streamer.lastPost.imageUrls.length === 0
      && (streamer.lastPost.imageCollectionAttempts ?? 0) < maxImageCollectionAttempts
      ? [streamer.lastPost]
      : [])
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, maxImageBackfillsPerRun);
  for (const candidate of candidates) {
    const enriched = await collectArticle(candidate, "division", divisionOverrides);
    if (!enriched) continue;
    if (await putPost(enriched, true)) {
      const index = posts.findIndex((post) => post.articleId === candidate.articleId);
      if (index >= 0) posts[index] = enriched;
    }
  }
}

async function backfillMissingRecords(posts: PromotionPost[]): Promise<void> {
  const candidates = posts
    .filter((post) => post.imageUrls.length > 0 && !post.record && (post.recordExtractionAttempts ?? 0) < maxRecordExtractionAttempts)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, maxRecordBackfillsPerRun);
  for (const candidate of candidates) {
    const { record, needsReview } = await extractRecordFromImages(candidate.imageUrls).catch((error) => {
      console.warn(`Record extraction failed for ${candidate.articleId}: ${(error as Error).message}`);
      return {} as { record?: PromotionPost["record"]; needsReview?: boolean };
    });
    const updated: PromotionPost = {
      ...candidate,
      record: record ?? candidate.record,
      recordNeedsReview: needsReview,
      recordCheckedAt: new Date().toISOString(),
      recordExtractionAttempts: (candidate.recordExtractionAttempts ?? 0) + 1,
    };
    if (await putPost(updated, true)) {
      const index = posts.findIndex((post) => post.articleId === candidate.articleId);
      if (index >= 0) posts[index] = updated;
    }
  }
}

async function backfillMissingReviews(posts: PromotionPost[], streamers: StreamerRecord[], reviewContext: string): Promise<void> {
  const candidates = streamers
    // Only attempt a review once the post's career record is settled, whether
    // via successful Gemini OCR or a matching record-overrides.yaml entry.
    // A legacy single-flavor string (pre mild/spicy split) also counts as
    // missing, so old data self-heals into the new shape over time.
    .filter((streamer) => streamer.lastPost && streamer.record && !isCompleteReview(streamer.lastPost.review)
      && (streamer.lastPost.reviewAttempts ?? 0) < maxReviewAttempts
      && !streamer.isExcluded)
    .sort((a, b) => b.lastPost!.publishedAt.localeCompare(a.lastPost!.publishedAt))
    .slice(0, maxReviewBackfillsPerRun);
  for (const streamer of candidates) {
    const review = await generateStreamerReview(streamer, streamers, reviewContext).catch((error) => {
      console.warn(`Review generation failed for ${streamer.lastPost!.articleId}: ${(error as Error).message}`);
      return undefined;
    });
    const updated: PromotionPost = {
      ...streamer.lastPost!,
      review: review ?? streamer.lastPost!.review,
      reviewCheckedAt: new Date().toISOString(),
      reviewAttempts: (streamer.lastPost!.reviewAttempts ?? 0) + 1,
    };
    if (await putPost(updated, true)) {
      const index = posts.findIndex((post) => post.articleId === updated.articleId);
      if (index >= 0) posts[index] = updated;
    }
  }
}

async function writeState(
  status: "ok" | "degraded",
  message: string | undefined,
  nextPages: Record<BoardId, number>,
  newest: Record<BoardId, string | undefined>,
): Promise<SyncState> {
  const state = {
    status, message, page: nextPages.division, latestArticleId: newest.division, updatedAt: new Date().toISOString(),
    boards: Object.fromEntries((Object.keys(BOARDS) as BoardId[]).map((board) => [board, {
      page: nextPages[board], latestArticleId: newest[board],
    }])),
  };
  await putSyncState(state);
  return state;
}

async function publishSnapshot(input: {
  state: SyncState | undefined;
  streamers: StreamerRecord[];
  posts: PromotionPost[];
  applications: OneVsOneApplication[];
  roster: Awaited<ReturnType<typeof getRoster>>;
  activityPosts: StreamerActivityPost[];
  recordOverrides: RecordOverride[];
}): Promise<void> {
  await putDashboardSnapshot(buildDashboardSnapshot({
    ...input,
    state: input.state,
    results: await getOneVsOneResults(),
  }));
}

async function scrapeDivision(
  mode: ScrapeMode,
  page: number,
  knownPosts: PromotionPost[],
  knownIds: Set<string>,
  newest: Record<BoardId, string | undefined>,
  divisionOverrides: Record<string, number>,
): Promise<number> {
  let nextPage = page;
  for (let count = 0; count < maxPagesPerRun; count += 1, nextPage += 1) {
    const rows = (await collectPage("division", nextPage)).filter((post) => !post.isNotice && /^\d+$/u.test(post.articleId));
    if (!rows.length) return 1;
    const allKnown = rows.every((row) => knownIds.has(row.articleId));
    for (const row of rows) {
      if (knownIds.has(row.articleId)) continue;
      const post = await collectArticle(row, "division", divisionOverrides);
      if (post && await putPost(post)) {
        knownPosts.push(post);
        knownIds.add(post.articleId);
        newest.division ??= post.articleId;
      }
    }
    if (mode === "incremental" && allKnown) return 1;
    await pause();
  }
  return nextPage;
}

async function scrapeOneVsOne(
  mode: ScrapeMode,
  page: number,
  knownApplications: OneVsOneApplication[],
  knownIds: Set<string>,
  newest: Record<BoardId, string | undefined>,
): Promise<number> {
  let nextPage = page;
  for (let count = 0; count < maxPagesPerRun; count += 1, nextPage += 1) {
    const normalRows = (await collectPage("oneVsOne", nextPage)).filter((post) => !post.isNotice && /^\d+$/u.test(post.articleId));
    if (!normalRows.length) return 1;
    const rows = normalRows.filter(isOneVsOneApplication);
    const allKnown = rows.every((row) => knownIds.has(row.articleId));
    for (const row of rows) {
      if (knownIds.has(row.articleId)) continue;
      const application: OneVsOneApplication = {
        articleId: row.articleId,
        cafeAuthor: row.cafeAuthor,
        title: row.title,
        category: row.category || "[1대1 평가 신청]",
        publishedAt: normalizeCafeDate(row.publishedAt),
        articleUrl: row.articleUrl || cafeArticleUrl(row.articleId, BOARDS.oneVsOne.menuId, nextPage),
      };
      if (await putOneVsOneApplication(application)) {
        knownApplications.push(application);
        knownIds.add(application.articleId);
        newest.oneVsOne ??= application.articleId;
      }
    }
    if (mode === "incremental" && allKnown) return 1;
    await pause();
  }
  return nextPage;
}

async function scrapeActivityBoard(
  board: StreamerActivityBoard,
  mode: ScrapeMode,
  page: number,
  knownPosts: StreamerActivityPost[],
  knownIds: Set<string>,
  newest: Record<BoardId, string | undefined>,
): Promise<number> {
  let nextPage = page;
  for (let count = 0; count < maxPagesPerRun; count += 1, nextPage += 1) {
    const normalRows = (await collectPage(board, nextPage)).filter((post) => !post.isNotice && /^\d+$/u.test(post.articleId));
    if (!normalRows.length) return 1;
    const rows = board === "scope" ? normalRows.filter((post) => isDirectPromotionPost(post)) : normalRows;
    const allKnown = rows.every((row) => knownIds.has(row.articleId));
    for (const row of rows) {
      if (knownIds.has(row.articleId)) continue;
      const post: StreamerActivityPost = {
        articleId: row.articleId,
        board,
        cafeAuthor: row.cafeAuthor,
        title: row.title,
        category: row.category,
        publishedAt: normalizeCafeDate(row.publishedAt),
        articleUrl: row.articleUrl || cafeArticleUrl(row.articleId, BOARDS[board].menuId, nextPage),
      };
      if (await putStreamerActivityPost(post)) {
        knownPosts.push(post);
        knownIds.add(post.articleId);
        newest[board] ??= post.articleId;
      }
    }
    if (mode === "incremental" && allKnown) return 1;
    await pause();
  }
  return nextPage;
}

const pause = () => new Promise((resolve) => setTimeout(resolve, 550));
