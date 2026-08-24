import type { OverridePolicy, PromotionPost, RecordOverride, RosterEntry, StreamerRecord, StreamerReview } from "./model.js";

const firstDivision = /^\s*\[\s*1부\s*리거\s*달성\s*\]/u;
const promotionDivision = /^\s*\[\s*([2-9])부\s*승격\s*\]/u;

export function parseDivision(categoryOrTitle: string): number | undefined {
  if (firstDivision.test(categoryOrTitle)) return 1;
  const match = categoryOrTitle.match(promotionDivision);
  return match ? Number(match[1]) : undefined;
}

export function normalizeCafeAlias(value: string): string {
  return value.normalize("NFC").replace(/\s+/gu, "").trim().toLocaleLowerCase("ko-KR");
}

export function isPromotionPost(value: { category: string; title?: string }): boolean {
  return parseDivision(value.category) !== undefined || parseDivision(value.title ?? "") !== undefined;
}

export function divisionForPost(
  post: Pick<PromotionPost, "category" | "title" | "articleId">,
  overrides?: Record<string, number>,
): number | undefined {
  return parseDivision(post.category) ?? parseDivision(post.title) ?? overrides?.[post.articleId];
}

export function matchRosterEntry(author: string, roster: RosterEntry[]): RosterEntry | undefined {
  const normalized = normalizeCafeAlias(author);
  return roster.find((entry) => entry.cafeAliases.some((alias) => normalizeCafeAlias(alias) === normalized));
}

function newest(posts: PromotionPost[]): PromotionPost | undefined {
  return [...posts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];
}

function chronological(posts: PromotionPost[]): PromotionPost[] {
  return [...posts].sort((left, right) =>
    left.publishedAt.localeCompare(right.publishedAt)
    || Number(left.articleId) - Number(right.articleId)
    || left.articleId.localeCompare(right.articleId));
}

function automaticDivision(posts: PromotionPost[]): number | undefined {
  return posts.reduce<number | undefined>((best, post) =>
    best === undefined ? post.division : Math.min(best, post.division), undefined);
}

/** A plain string is a legacy single-flavor value from before the mild/spicy split and is treated as stale. */
export function isCompleteReview(review: PromotionPost["review"]): review is StreamerReview {
  return typeof review === "object" && review !== null && Boolean(review.mild) && Boolean(review.spicy);
}

function latestReviewFrom(
  posts: PromotionPost[],
  lastPost: PromotionPost | undefined,
): StreamerRecord["latestReview"] {
  const latestReviewedPost = posts
    .filter((post) => isCompleteReview(post.review))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];
  if (!latestReviewedPost) return undefined;
  const review = latestReviewedPost.review as StreamerReview;
  return {
    mild: review.mild,
    spicy: review.spicy,
    generatedAt: latestReviewedPost.reviewCheckedAt!,
    isCurrent: latestReviewedPost.articleId === lastPost?.articleId,
  };
}

function previousPromotionPosts(posts: PromotionPost[], currentDivision: number): PromotionPost[] {
  return posts
    .filter((post) => post.division > currentDivision)
    .sort((a, b) => a.division - b.division || b.publishedAt.localeCompare(a.publishedAt));
}

export function resolveDivision(
  posts: PromotionPost[],
  override: { division?: number | null; policy: OverridePolicy },
): number | undefined {
  const automatic = automaticDivision(posts);
  if (!override.division || override.policy === "auto") return automatic;
  if (override.policy === "until-manual-release") return override.division;
  // A promotion always improves the rank (smaller division number). Old or late posts
  // must not unexpectedly release a pin.
  return automatic !== undefined && automatic < override.division ? automatic : override.division;
}

export function buildStreamerRecords(
  posts: PromotionPost[],
  roster: RosterEntry[],
  recordOverrides: RecordOverride[] = [],
): StreamerRecord[] {
  const grouped = new Map<string, PromotionPost[]>();
  for (const post of posts) {
    const rosterEntry = matchRosterEntry(post.cafeAuthor, roster);
    const key = rosterEntry?.slug ?? `cafe:${normalizeCafeAlias(post.cafeAuthor)}`;
    grouped.set(key, [...(grouped.get(key) ?? []), post]);
  }

  // Deleted entries still participate in grouped-post matching above (via
  // matchRosterEntry) so their cafe posts attach to the roster slug instead
  // of falling through to the "unmapped applicant" branch below, but they
  // never produce a visible record themselves.
  const records: StreamerRecord[] = roster.filter((entry) => !entry.deleted).map((entry) => {
    const entryPosts = grouped.get(entry.slug) ?? [];
    const override = entry.override ?? { policy: "auto" as const, division: undefined };
    const currentDivision = entry.autoUpdate
      ? (resolveDivision(entryPosts, override) ?? 10)
      : (override.division ?? automaticDivision(entryPosts) ?? 10);
    const history = previousPromotionPosts(entryPosts, currentDivision);
    const lastPost = newest(entryPosts);
    // A record override only applies while the streamer sits in the division
    // it was written for, so a stale entry can never overwrite a record after
    // the streamer has since promoted or relegated.
    const recordOverride = entry.soopId
      ? recordOverrides.find((candidate) => candidate.soopId === entry.soopId && candidate.division === currentDivision)
      : undefined;
    const latestReview = latestReviewFrom(entryPosts, lastPost);
    return {
      id: entry.slug,
      displayName: entry.displayName,
      cafeAliases: entry.cafeAliases,
      soopId: entry.soopId || undefined,
      profileImageUrl: entry.profileImageUrl,
      autoUpdate: entry.autoUpdate,
      overridePolicy: override.policy,
      overrideDivision: override.division ?? undefined,
      currentDivision,
      record: recordOverride?.record ?? lastPost?.record,
      lastPost,
      promotionHistory: entryPosts.length ? chronological(entryPosts) : undefined,
      previousPromotionPosts: history.length ? history : undefined,
      isMapped: true,
      celebrationMessage: entry.celebrationMessage,
      sfx: entry.sfx,
      isFancy: entry.isFancy,
      isFancyLite: entry.isFancyLite,
      isSavior: entry.isSavior,
      reviewNote: entry.reviewNote,
      isExcluded: entry.isExcluded,
      latestReview,
    };
  });

  for (const [key, entryPosts] of grouped) {
    if (roster.some((entry) => entry.slug === key)) continue;
    const lastPost = newest(entryPosts);
    const division = automaticDivision(entryPosts);
    if (!lastPost || division === undefined) continue;
    records.push({
      id: key,
      displayName: lastPost.cafeAuthor,
      cafeAliases: [lastPost.cafeAuthor],
      autoUpdate: true,
      overridePolicy: "auto",
      currentDivision: division,
      record: lastPost.record,
      lastPost,
      promotionHistory: chronological(entryPosts),
      previousPromotionPosts: previousPromotionPosts(entryPosts, division),
      isMapped: false,
      latestReview: latestReviewFrom(entryPosts, lastPost),
    });
  }

  return records.sort((a, b) => a.currentDivision - b.currentDivision || a.displayName.localeCompare(b.displayName, "ko"));
}
