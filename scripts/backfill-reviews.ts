/**
 * One-time backfill: generates a Gemini mild/spicy review pair for every
 * streamer whose career record is already known but whose review is missing
 * or still in the legacy single-flavor string shape, mirroring scraper.ts's
 * own backfillMissingReviews() so the deployed scraper doesn't have to spend
 * Gemini calls working through the existing backlog after launch. New
 * reports going forward are handled automatically by the scraper's own
 * loop; this script only exists to seed/migrate the backlog once.
 *
 * Requires the same environment as the scraper Lambda: TABLE_NAME, AWS
 * credentials/region for DynamoDB, and GEMINI_API_KEY.
 *
 * Usage:
 *   pnpm run backfill:reviews -- --dry-run          # inspect candidates only, no writes
 *   pnpm run backfill:reviews -- --exclude-top 5     # skip the N most recent (default 5)
 *   pnpm run backfill:reviews                        # write reviews for real
 */
import { generateStreamerReview } from "../src/functions/streamer-review.js";
import { getPosts, getRecordOverrides, getReviewContext, getRoster, putPost, putStreamers } from "../src/functions/store.js";
import { buildStreamerRecords, isCompleteReview } from "../src/shared/promotion.js";
import type { PromotionPost, StreamerRecord } from "../src/shared/model.js";

function option(name: string, fallback?: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
}

async function main(): Promise<void> {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is required");
  const dryRun = process.argv.includes("--dry-run");
  const excludeTop = Number(option("--exclude-top", "5"));

  const [posts, roster, recordOverrides, reviewContext] = await Promise.all([
    getPosts(), getRoster(), getRecordOverrides(), getReviewContext(),
  ]);
  const streamers = buildStreamerRecords(posts, roster, recordOverrides);

  const candidates = streamers
    .filter((s): s is StreamerRecord & { lastPost: PromotionPost } =>
      Boolean(s.lastPost) && Boolean(s.record) && !isCompleteReview(s.lastPost!.review))
    .sort((a, b) => b.lastPost.publishedAt.localeCompare(a.lastPost.publishedAt));

  const skipped = candidates.slice(0, excludeTop);
  const toProcess = candidates.slice(excludeTop);

  console.log(`대상 ${candidates.length}명 중 최신 ${skipped.length}명은 배포 후 스케줄러가 처리하도록 남겨둡니다.`);
  console.log(`이번에 로컬에서 처리할 대상: ${toProcess.length}명${dryRun ? " [dry-run: DB에 쓰지 않음]" : ""}`);
  if (skipped.length) console.log(`  남겨둠: ${skipped.map((s) => s.displayName).join(", ")}`);

  let succeeded = 0;
  let failed = 0;
  const updatedById = new Map<string, PromotionPost>();

  for (const streamer of toProcess) {
    try {
      const review = await generateStreamerReview(streamer, streamers, reviewContext.context);
      const updated: PromotionPost = {
        ...streamer.lastPost,
        review: review ?? streamer.lastPost.review,
        reviewCheckedAt: new Date().toISOString(),
        reviewAttempts: (streamer.lastPost.reviewAttempts ?? 0) + 1,
      };
      if (!dryRun) await putPost(updated, true);
      updatedById.set(updated.articleId, updated);
      if (review) {
        succeeded += 1;
        console.log(`  OK  ${streamer.displayName}`);
        console.log(`      순한맛 (${review.mild.length}자): ${review.mild}`);
        console.log(`      매운맛 (${review.spicy.length}자): ${review.spicy}`);
      } else {
        failed += 1;
        console.log(`  FAIL ${streamer.displayName}: undefined 반환`);
      }
    } catch (error) {
      failed += 1;
      console.error(`  FAIL ${streamer.displayName}: ${(error as Error).message}`);
    }
  }

  if (!dryRun && updatedById.size) {
    const updatedPosts = posts.map((post) => updatedById.get(post.articleId) ?? post);
    await putStreamers(buildStreamerRecords(updatedPosts, roster, recordOverrides));
  }

  console.log(`\n완료: 성공 ${succeeded} · 실패 ${failed}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
