import type { RosterEntry, StreamerActivityPost, StreamerRecord } from "./model.js";
import { matchRosterEntry } from "./promotion.js";

const directPromotionCategory = /^\s*\[\s*내가\s*직접\s*홍보\s*\]\s*$/u;
const cheerVtuberPromotionCategory = /^\s*\[\s*응원\s*버튜버\s*홍보\s*\]\s*$/u;

export function isDirectPromotionPost(post: Pick<StreamerActivityPost, "category">): boolean {
  return directPromotionCategory.test(post.category) || cheerVtuberPromotionCategory.test(post.category);
}

export function attachStreamerActivityPosts(
  streamers: StreamerRecord[],
  roster: RosterEntry[],
  posts: StreamerActivityPost[],
): StreamerRecord[] {
  const scopeByStreamer = new Map<string, StreamerActivityPost[]>();
  const elevenByStreamer = new Map<string, StreamerActivityPost[]>();

  for (const post of posts) {
    const streamer = matchRosterEntry(post.cafeAuthor, roster);
    if (!streamer) continue;
    const target = post.board === "scope" ? scopeByStreamer : elevenByStreamer;
    target.set(streamer.slug, [...(target.get(streamer.slug) ?? []), post]);
  }

  const newestFirst = (posts: StreamerActivityPost[]) => [...posts]
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));

  return streamers.map((streamer) => ({
    ...streamer,
    scopePosts: newestFirst(scopeByStreamer.get(streamer.id) ?? []),
    elevenVsElevenPosts: newestFirst(elevenByStreamer.get(streamer.id) ?? []),
  }));
}
