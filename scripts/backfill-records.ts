/**
 * One-time backfill: read every streamer's most recent division-report post
 * and, if it has images but no extracted W-D-L record yet, run it through
 * record-extraction.ts. New posts going forward are handled automatically by
 * the scraper's own backfillMissingRecords loop; this script only exists to
 * seed existing streamers once after the feature ships.
 *
 * Requires the same environment as the scraper Lambda: TABLE_NAME, AWS
 * credentials/region for DynamoDB, and GEMINI_API_KEY.
 *
 * Usage:
 *   pnpm run backfill:records -- --dry-run --limit 5   # inspect results only, no writes
 *   pnpm run backfill:records                          # write extracted records for real
 */
import { extractRecordFromImages } from "../src/functions/record-extraction.js";
import { getPosts, getRoster, putPost, putStreamers } from "../src/functions/store.js";
import { buildStreamerRecords } from "../src/shared/promotion.js";
import type { PromotionPost } from "../src/shared/model.js";

function option(name: string, fallback?: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
}

async function main(): Promise<void> {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is required");
  const dryRun = process.argv.includes("--dry-run");
  const limit = Number(option("--limit", dryRun ? "5" : undefined) ?? Infinity);

  const [posts, roster] = await Promise.all([getPosts(), getRoster()]);
  const streamers = buildStreamerRecords(posts, roster);
  const candidates = streamers
    .flatMap((streamer) => streamer.lastPost && streamer.lastPost.imageUrls.length > 0 && !streamer.lastPost.record
      ? [{ streamer: streamer.displayName, post: streamer.lastPost }]
      : [])
    .slice(0, limit);

  console.log(`대상 게시글 ${candidates.length}건 (전체 스트리머 ${streamers.length}명 중)${dryRun ? " [dry-run: DB에 쓰지 않음]" : ""}`);

  let succeeded = 0;
  let skipped = 0;
  let failed = 0;
  const needsReview: string[] = [];
  const updatedById = new Map<string, PromotionPost>();

  for (const { streamer, post } of candidates) {
    try {
      const { record, needsReview: reviewFlag } = await extractRecordFromImages(post.imageUrls);
      const updated: PromotionPost = {
        ...post,
        record: record ?? post.record,
        recordNeedsReview: reviewFlag,
        recordCheckedAt: new Date().toISOString(),
        recordExtractionAttempts: (post.recordExtractionAttempts ?? 0) + 1,
      };
      if (!dryRun) await putPost(updated, true);
      updatedById.set(post.articleId, updated);
      if (record) {
        succeeded += 1;
        console.log(`  OK  ${streamer}: ${record.wins}-${record.draws}-${record.losses}${reviewFlag ? " (검토 필요: 이미지 간 값 불일치)" : ""}`);
        console.log(`      게시글: ${post.articleUrl}`);
        console.log(`      이미지: ${post.imageUrls.join(", ")}`);
        if (reviewFlag) needsReview.push(streamer);
      } else {
        skipped += 1;
        console.log(`  SKIP ${streamer}: 이미지에서 전적 화면을 찾지 못함 (${post.articleId})`);
        console.log(`      이미지: ${post.imageUrls.join(", ")}`);
      }
    } catch (error) {
      failed += 1;
      console.error(`  FAIL ${streamer}: ${(error as Error).message}`);
    }
  }

  if (!dryRun) {
    const updatedPosts = posts.map((post) => updatedById.get(post.articleId) ?? post);
    await putStreamers(buildStreamerRecords(updatedPosts, roster));
  }

  console.log(`\n완료: 성공 ${succeeded} · 스킵 ${skipped} · 실패 ${failed}`);
  if (needsReview.length) console.log(`검토 필요: ${needsReview.join(", ")}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
