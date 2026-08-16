import type { ScheduledEvent } from "aws-lambda";
import {
  BOARDS, cafeArticleUrl, type BoardId, type OneVsOneApplication, type PromotionPost,
  type StreamerActivityBoard, type StreamerActivityPost,
} from "../shared/model.js";
import { isOneVsOneApplication } from "../shared/one-vs-one.js";
import { buildStreamerRecords } from "../shared/promotion.js";
import { isDirectPromotionPost } from "../shared/streamer-activity.js";
import { collectArticle, collectPage, normalizeCafeDate, SourceBlockedError } from "./naver.js";
import {
  getOneVsOneApplications, getPosts, getRoster, getStreamerActivityPosts, getSyncState,
  putOneVsOneApplication, putPost, putStreamerActivityPost, putStreamers, putSyncState,
} from "./store.js";

type ScrapeMode = "incremental" | "reconcile";
type ScrapeEvent = ScheduledEvent<{ mode?: ScrapeMode; articleId?: string }> | { mode?: ScrapeMode; articleId?: string };
const maxPagesPerRun = Number(process.env.MAX_PAGES_PER_RUN ?? 20);
const maxImageBackfillsPerRun = Number(process.env.MAX_IMAGE_BACKFILLS_PER_RUN ?? 3);
const activityBoards: StreamerActivityBoard[] = ["scope", "elevenVsEleven"];

export async function handler(event: ScrapeEvent = {}): Promise<void> {
  const mode: ScrapeMode = ("detail" in event ? event.detail?.mode : event.mode) ?? "incremental";
  const articleId = "detail" in event ? event.detail?.articleId : event.articleId;
  const state = await getSyncState();
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
    const enriched = await collectArticle(existing, "division");
    if (enriched) await putPost(enriched, true);
    const updatedPosts = enriched ? knownPosts.map((post) => post.articleId === articleId ? enriched : post) : knownPosts;
    await putStreamers(buildStreamerRecords(updatedPosts, await getRoster()));
    return;
  }

  try {
    nextPages.division = await scrapeDivision(mode, nextPages.division, knownPosts, knownIds, newest);
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
    await backfillMissingReportImages(knownPosts, roster);
    await putStreamers(buildStreamerRecords(knownPosts, roster));
    await writeState("ok", undefined, nextPages, newest);
  } catch (error) {
    const message = error instanceof SourceBlockedError ? error.message : `Collection failed: ${(error as Error).message}`;
    await writeState("degraded", message, nextPages, newest);
    throw error;
  }
}

async function backfillMissingReportImages(posts: PromotionPost[], roster: Awaited<ReturnType<typeof getRoster>>): Promise<void> {
  const candidates = buildStreamerRecords(posts, roster)
    .flatMap((streamer) => streamer.lastPost && !streamer.lastPost.imagesCheckedAt ? [streamer.lastPost] : [])
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, maxImageBackfillsPerRun);
  for (const candidate of candidates) {
    const enriched = await collectArticle(candidate, "division");
    if (!enriched) continue;
    if (await putPost(enriched, true)) {
      const index = posts.findIndex((post) => post.articleId === candidate.articleId);
      if (index >= 0) posts[index] = enriched;
    }
  }
}

async function writeState(
  status: "ok" | "degraded",
  message: string | undefined,
  nextPages: Record<BoardId, number>,
  newest: Record<BoardId, string | undefined>,
): Promise<void> {
  await putSyncState({
    status, message, page: nextPages.division, latestArticleId: newest.division, updatedAt: new Date().toISOString(),
    boards: Object.fromEntries((Object.keys(BOARDS) as BoardId[]).map((board) => [board, {
      page: nextPages[board], latestArticleId: newest[board],
    }])),
  });
}

async function scrapeDivision(
  mode: ScrapeMode,
  page: number,
  knownPosts: PromotionPost[],
  knownIds: Set<string>,
  newest: Record<BoardId, string | undefined>,
): Promise<number> {
  let nextPage = page;
  for (let count = 0; count < maxPagesPerRun; count += 1, nextPage += 1) {
    const rows = (await collectPage("division", nextPage)).filter((post) => !post.isNotice && /^\d+$/u.test(post.articleId));
    if (!rows.length) return 1;
    const allKnown = rows.every((row) => knownIds.has(row.articleId));
    for (const row of rows) {
      if (knownIds.has(row.articleId)) continue;
      const post = await collectArticle(row, "division");
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
