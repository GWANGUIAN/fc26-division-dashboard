/**
 * One-off: manually stamp a Gemini review onto a streamer's lastPost and
 * republish the snapshot, without going through the scraper's own backfill
 * loop. Used to seed the very first review before the scraper wiring ships.
 *
 * Usage:
 *   pnpm exec tsx scripts/apply-manual-review.ts --slug bboringirl --text "..."
 */
import { getOneVsOneApplications, getOneVsOneResults, getPosts, getRecordOverrides, getRoster, getStreamerActivityPosts, getSyncState, putDashboardSnapshot, putPost, putStreamers } from "../src/functions/store.js";
import { buildStreamerRecords } from "../src/shared/promotion.js";
import { buildDashboardSnapshot } from "../src/shared/snapshot.js";
import type { PromotionPost } from "../src/shared/model.js";

function option(name: string): string {
  const index = process.argv.indexOf(name);
  if (index < 0 || !process.argv[index + 1]) throw new Error(`Missing ${name}`);
  return process.argv[index + 1];
}

async function main(): Promise<void> {
  const slug = option("--slug");
  const text = option("--text");

  const [posts, roster, applications, activityPosts, state, recordOverrides] = await Promise.all([
    getPosts(), getRoster(), getOneVsOneApplications(), getStreamerActivityPosts(), getSyncState(), getRecordOverrides(),
  ]);
  const streamers = buildStreamerRecords(posts, roster, recordOverrides);
  const streamer = streamers.find((entry) => entry.id === slug);
  if (!streamer?.lastPost) throw new Error(`No streamer/lastPost found for slug "${slug}"`);

  const updated: PromotionPost = {
    ...streamer.lastPost,
    review: text,
    reviewCheckedAt: new Date().toISOString(),
    reviewAttempts: (streamer.lastPost.reviewAttempts ?? 0) + 1,
  };
  await putPost(updated, true);
  const updatedPosts = posts.map((post) => post.articleId === updated.articleId ? updated : post);
  const updatedStreamers = buildStreamerRecords(updatedPosts, roster, recordOverrides);
  await putStreamers(updatedStreamers);
  await putDashboardSnapshot(buildDashboardSnapshot({
    state, streamers: updatedStreamers, posts: updatedPosts, applications, roster, activityPosts,
    results: await getOneVsOneResults(), recordOverrides,
  }));

  console.log(`OK: ${streamer.displayName} (${updated.articleId})의 review 저장 완료, 스냅샷 갱신됨`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
