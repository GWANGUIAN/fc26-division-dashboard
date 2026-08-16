import chromium from "@sparticuz/chromium";
import { chromium as playwright } from "playwright-core";
import type { Locator } from "playwright-core";
import { BOARDS, CAFE, cafeArticleUrl, type BoardId, type PromotionPost } from "../shared/model.js";
import { filterArticleImages } from "../shared/images.js";
import { divisionForPost } from "../shared/promotion.js";

// Naver Café accepts up to 50 rows per list response.  Keeping this in one
// place ensures every tracked board benefits without changing the page-based
// incremental/backfill checkpoints.
export const LIST_PAGE_SIZE = 50;
export const listUrl = (board: BoardId, page: number) =>
  `${CAFE.baseUrl}/f-e/cafes/${CAFE.cafeId}/menus/${BOARDS[board].menuId}?page=${page}&size=${LIST_PAGE_SIZE}`;
const mobileArticleUrl = (articleId: string, menuId: string) =>
  `https://m.cafe.naver.com/ca-fe/web/cafes/${CAFE.cafeId}/articles/${articleId}?menuId=${menuId}`;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
// Naver's Korean ARIA labels are not stable across its rendering surfaces.
// The article URL shape is the durable public contract of the list table.
const articleListTable = 'table:has(a[href*="/articles/"])';

export class SourceBlockedError extends Error {}
export interface ListedPost {
  articleId: string;
  title: string;
  category: string;
  cafeAuthor: string;
  publishedAt: string;
  articleUrl: string;
  isNotice?: boolean;
}

async function browserLaunch() {
  return playwright.launch({
    // Chromium's single-process mode intermittently closes renderer pages in
    // the Lambda runtime while Naver hydrates iframe content. Keep the normal
    // multi-process renderer so article media can finish loading.
    args: chromium.args.filter((arg) => arg !== "--single-process"),
    executablePath: await chromium.executablePath(),
    headless: true,
  });
}

async function withRetries<T>(operation: () => Promise<T>): Promise<T> {
  let error: unknown;
  for (const wait of [0, 700, 1800]) {
    if (wait) await delay(wait);
    try { return await operation(); } catch (caught) { error = caught; }
  }
  throw error;
}

type ArticleImageCandidate = {
  src?: string;
  className?: string;
  width?: number;
  height?: number;
  inPostBody?: boolean;
};

async function hydrateArticleImages(images: Locator): Promise<void> {
  await images.evaluateAll(async (nodes) => {
    const articleImages = nodes.filter((image) => image.classList.contains("se-image-resource")
      || Boolean(image.closest(".se-main-container, .article_viewer, .ArticleContentBox, #tbody, [class*='ArticleContent'], [class*='article-content'], [class*='ContentRenderer']")));
    await Promise.all(articleImages.map(async (image) => {
      const img = image as HTMLImageElement;
      img.scrollIntoView({ block: "center", inline: "nearest" });
      if (img.complete) return;
      await new Promise<void>((resolve) => {
        img.addEventListener("load", () => resolve(), { once: true });
        img.addEventListener("error", () => resolve(), { once: true });
        setTimeout(resolve, 5_000);
      });
    }));
  });
}

async function inspectArticleImages(images: Locator): Promise<ArticleImageCandidate[]> {
  return images.evaluateAll((nodes) => nodes.map((image) => ({
    src: (image as HTMLImageElement).currentSrc || image.getAttribute("data-src") || image.getAttribute("data-lazy-src") || (image as HTMLImageElement).src,
    className: image.className,
    width: (image as HTMLImageElement).naturalWidth,
    height: (image as HTMLImageElement).naturalHeight,
    inPostBody: Boolean(image.closest(".se-main-container, .article_viewer, .ArticleContentBox, #tbody, [class*='ArticleContent'], [class*='article-content'], [class*='ContentRenderer']")),
  })));
}

export function normalizeCafeDate(value: string): string {
  const text = value.trim();
  if (/^\d{4}-\d{2}-\d{2}T/u.test(text)) return text;
  if (/^\d{4}\.\d{2}\.\d{2}\.$/u.test(text)) return `${text.replaceAll(".", "-").slice(0, -1)}T00:00:00+09:00`;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  return `${today}T${/^\d{1,2}:\d{2}$/u.test(text) ? text.padStart(5, "0") : "00:00"}:00+09:00`;
}

export async function collectPage(board: BoardId, pageNumber: number): Promise<ListedPost[]> {
  const browser = await browserLaunch();
  try {
    const page = await browser.newPage({ locale: "ko-KR", timezoneId: "Asia/Seoul" });
    await withRetries(async () => {
      const response = await page.goto(listUrl(board, pageNumber), { waitUntil: "domcontentloaded", timeout: 25_000 });
      if (!response || response.status() === 429 || response.status() >= 500) throw new Error(`Naver returned ${response?.status()}`);
      // Empty boards do not render an article-link table at all.  Waiting for
      // that exact selector made a valid empty 11v11 board look like a failed
      // collection and prevented the already-collected division posts from
      // being aggregated into streamer records.
      await page.locator("table").first().waitFor({ timeout: 20_000 });
    });
    const blocked = await page.locator("body").innerText();
    if (/captcha|자동입력|비정상적인 접근|접근이 제한/u.test(blocked)) throw new SourceBlockedError("Naver blocked automated collection");
    const listedPosts = await page.locator(`${articleListTable} tbody tr`).evaluateAll((rows) => rows.map((row) => {
      const cells = Array.from(row.querySelectorAll("td"));
      const first = cells[0]?.textContent?.trim() ?? "";
      const link = row.querySelector<HTMLAnchorElement>('a[href*="/articles/"]');
      const href = link?.href;
      const articleId = href?.match(/articles\/(\d+)/u)?.[1] ?? first;
      const title = link?.textContent?.replace(/\s+/gu, " ").trim() ?? "";
      const category = link?.querySelector(".article-board-tag, strong, em")?.textContent?.trim() ?? title.match(/^\[[^\]]+\]/u)?.[0] ?? "";
      const author = cells[2]?.textContent?.replace(/멤버등급.*/u, "").trim() ?? "";
      const date = cells[3]?.textContent?.trim() ?? "";
      return { articleId, title, category, cafeAuthor: author, publishedAt: date, articleUrl: href ?? "", isNotice: /공지/u.test(first) };
    }).filter((row) => /^\d+$/u.test(row.articleId) && row.title));
    return listedPosts;
  } finally { await browser.close(); }
}

export async function collectArticle(listed: ListedPost, board: BoardId = "division"): Promise<PromotionPost | undefined> {
  const division = divisionForPost(listed);
  if (!division) return undefined;
  const { isNotice: _isNotice, ...article } = listed;
  const fallback: PromotionPost = {
    ...article,
    publishedAt: normalizeCafeDate(listed.publishedAt),
    division,
    articleUrl: listed.articleUrl || cafeArticleUrl(listed.articleId, BOARDS[board].menuId),
    imageUrls: [],
  };
  const browser = await browserLaunch();
  try {
    const page = await browser.newPage({ locale: "ko-KR", timezoneId: "Asia/Seoul" });
    await withRetries(async () => {
      const response = await page.goto(listed.articleUrl || cafeArticleUrl(listed.articleId, BOARDS[board].menuId), { waitUntil: "domcontentloaded", timeout: 25_000 });
      if (!response || response.status() === 429 || response.status() >= 500) throw new Error(`Naver returned ${response?.status()}`);
      await page.locator("iframe#cafe_main").waitFor({ timeout: 12_000 });
    });
    const desktopFrame = page.frameLocator("iframe#cafe_main");
    const body = await desktopFrame.locator("body").innerText();
    if (/captcha|자동입력|비정상적인 접근|접근이 제한/u.test(body)) throw new SourceBlockedError("Naver blocked article collection");
    // The iframe itself is available before the Café SPA has loaded article
    // data. Waiting only for the iframe created a race where posts with slower
    // hydration looked image-less. The listed title is present only after the
    // article has rendered; allow either rendering surface to satisfy it.
    let articleRendered = false;
    try {
      await Promise.any([
        desktopFrame.getByText(listed.title, { exact: false }).first().waitFor({ state: "visible", timeout: 12_000 }),
        page.getByText(listed.title, { exact: false }).first().waitFor({ state: "visible", timeout: 12_000 }),
      ]);
      articleRendered = true;
      await page.waitForTimeout(750);
    } catch {
      // The PC SPA occasionally returns only its navigation shell to Lambda.
      // Its public mobile view uses a different rendering path, so retry there
      // before declaring a post image-less.
      const response = await page.goto(mobileArticleUrl(listed.articleId, BOARDS[board].menuId), { waitUntil: "domcontentloaded", timeout: 25_000 });
      if (!response || response.status() === 429 || response.status() >= 500) throw new Error(`Naver mobile returned ${response?.status()}`);
      const mobileBody = await page.locator("body").innerText();
      if (/captcha|자동입력|비정상적인 접근|접근이 제한/u.test(mobileBody)) throw new SourceBlockedError("Naver blocked mobile article collection");
      try {
        await page.getByText(listed.title, { exact: false }).first().waitFor({ state: "visible", timeout: 12_000 });
        articleRendered = true;
        await page.waitForTimeout(750);
      } catch { console.info(`Article content did not render before media check: ${listed.articleId}`); }
    }
    // Café can render the article in its legacy `cafe_main` iframe, the outer
    // document, or a nested editor frame. Inspect every rendered document,
    // then accept only trusted Naver image hosts within a recognised article
    // body. Duplicate surfaces are harmless because URLs are deduplicated.
    const imageSurfaces = [page.locator("img"), ...page.frames().map((currentFrame) => currentFrame.locator("img"))];
    try {
      await Promise.all(imageSurfaces.map(async (images) => { try { await hydrateArticleImages(images); } catch { /* detached frame */ } }));
    } catch { /* text-only posts are valid */ }
    const discoveredImages = (await Promise.all(imageSurfaces.map(async (images) => {
      try { return await inspectArticleImages(images); } catch { return []; }
    }))).flat();
    const imageUrls = filterArticleImages(discoveredImages);
    if (imageUrls.length === 0) {
      // Preserve enough metadata to support new Café editor variants without
      // logging users' image URLs or post contents.
      console.info(`No accepted post media for ${listed.articleId}: ${JSON.stringify({
        articleRendered,
        frames: page.frames().map((currentFrame) => currentFrame.url().replace(/\?.*/u, "")),
        images: discoveredImages.slice(0, 12).map((image) => ({
          className: image.className,
          host: image.src?.match(/^https?:\/\/([^/]+)/u)?.[1],
          width: image.width,
          height: image.height,
          inPostBody: image.inPostBody,
        })),
      })}`);
    }
    return {
      ...fallback,
      imageUrls,
      imagesCheckedAt: new Date().toISOString(),
      imageCollectionAttempts: ((listed as Partial<PromotionPost>).imageCollectionAttempts ?? 0) + 1,
    };
  } catch (error) {
    // Keep rank reporting available when a transient detail-page render fails.
    // CAPTCHA/explicit access blocking remains a hard failure and is never bypassed.
    if (error instanceof SourceBlockedError) throw error;
    console.warn(`Article image collection skipped for ${listed.articleId}: ${(error as Error).message}`);
    return fallback;
  } finally { await browser.close(); }
}
