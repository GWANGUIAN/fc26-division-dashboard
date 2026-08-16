import type { ScheduledEvent } from "aws-lambda";
import { BOARDS, cafeArticleUrl, type BoardId, type OneVsOneApplication, type PromotionPost } from "../shared/model.js";
import { isOneVsOneApplication } from "../shared/one-vs-one.js";
import { buildStreamerRecords } from "../shared/promotion.js";
import { collectArticle, collectPage, normalizeCafeDate, SourceBlockedError } from "./naver.js";
import {
  getOneVsOneApplications, getPosts, getRoster, getSyncState, putOneVsOneApplication,
  putPost, putStreamers, putSyncState,
} from "./store.js";

type ScrapeMode = "incremental" | "reconcile";
type ScrapeEvent = ScheduledEvent<{ mode?: ScrapeMode; articleId?: string }> | { mode?: ScrapeMode; articleId?: string };
const maxPagesPerRun = Number(process.env.MAX_PAGES_PER_RUN ?? 20);

export async function handler(event: ScrapeEvent = {}): Promise<void> {
  const mode: ScrapeMode = ("detail" in event ? event.detail?.mode : event.mode) ?? "incremental";
  const articleId = "detail" in event ? event.detail?.articleId : event.articleId;
  const state = await getSyncState();
  const knownPosts = await getPosts();
  const knownApplications = await getOneVsOneApplications();
  const knownIds = new Set(knownPosts.map((post) => post.articleId));
  const knownApplicationIds = new Set(knownApplications.map((application) => application.articleId));
  const progress = state?.boards ?? {};
  const nextPages: Record<BoardId, number> = {
    division: mode === "reconcile" ? (progress.division?.page ?? state?.page ?? 1) : 1,
    oneVsOne: mode === "reconcile" ? (progress.oneVsOne?.page ?? 1) : 1,
  };
  const newest: Record<BoardId, string | undefined> = {
    division: progress.division?.latestArticleId ?? state?.latestArticleId,
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
    const roster = await getRoster();
    await putStreamers(buildStreamerRecords(knownPosts, roster));
    await putSyncState({
      status: "ok", page: nextPages.division, latestArticleId: newest.division, updatedAt: new Date().toISOString(),
      boards: {
        division: { page: nextPages.division, latestArticleId: newest.division },
        oneVsOne: { page: nextPages.oneVsOne, latestArticleId: newest.oneVsOne },
      },
    });
  } catch (error) {
    const message = error instanceof SourceBlockedError ? error.message : `Collection failed: ${(error as Error).message}`;
    await putSyncState({
      status: "degraded", page: nextPages.division, latestArticleId: newest.division, message, updatedAt: new Date().toISOString(),
      boards: {
        division: { page: nextPages.division, latestArticleId: newest.division },
        oneVsOne: { page: nextPages.oneVsOne, latestArticleId: newest.oneVsOne },
      },
    });
    throw error;
  }
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
    const rows = (await collectPage("division", nextPage)).filter((post) => /^\d+$/u.test(post.articleId));
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
    const normalRows = (await collectPage("oneVsOne", nextPage)).filter((post) => /^\d+$/u.test(post.articleId));
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

const pause = () => new Promise((resolve) => setTimeout(resolve, 550));
