/**
 * One-off local smoke test for streamer-review.ts: pulls one real streamer's
 * data from DynamoDB and prints a single Gemini response, without writing
 * anything back. Meant to be run once by hand to sanity-check prompt quality
 * before wiring review generation into the scraper.
 *
 * Requires the same environment as the scraper Lambda: TABLE_NAME, AWS
 * credentials/region for DynamoDB, and GEMINI_API_KEY. Reads review-context.yaml's
 * content from DynamoDB, which is empty until config-sync has synced it at least once.
 *
 * Usage:
 *   pnpm run test:streamer-review -- --slug bboringirl
 */
import { generateStreamerReview } from "../src/functions/streamer-review.js";
import { getPosts, getReviewContext, getRoster } from "../src/functions/store.js";
import { buildStreamerRecords } from "../src/shared/promotion.js";

function option(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
}

async function main(): Promise<void> {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is required");
  const slug = option("--slug", "bboringirl");

  const [posts, roster, reviewContext] = await Promise.all([getPosts(), getRoster(), getReviewContext()]);
  const streamers = buildStreamerRecords(posts, roster);
  const streamer = streamers.find((entry) => entry.id === slug);
  if (!streamer) throw new Error(`No streamer found with slug "${slug}"`);

  console.log(`대상: ${streamer.displayName} (${streamer.currentDivision}부, record=${JSON.stringify(streamer.record)})`);
  console.log("Gemini 호출 중...\n");

  const review = await generateStreamerReview(streamer, streamers, reviewContext.context);
  if (!review) {
    console.error("한줄평 생성 실패 (undefined 반환)");
    process.exitCode = 1;
    return;
  }

  console.log(`순한맛 (${review.mild.length}자):\n${review.mild}`);
  console.log(`\n매운맛 (${review.spicy.length}자):\n${review.spicy}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
