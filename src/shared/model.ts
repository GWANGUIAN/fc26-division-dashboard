export type OverridePolicy = "auto" | "until-next-post" | "until-manual-release";

export interface RosterEntry {
  slug: string;
  displayName: string;
  cafeAliases: string[];
  soopId?: string;
  profileImageUrl?: string;
  soopTags?: SoopProfileTag[];
  autoUpdate: boolean;
  override?: { division: number | null; policy: OverridePolicy };
  celebrationMessage?: string;
  sfx?: string;
  isFancy?: boolean;
  /** Free-text background info about this streamer, injected into the Gemini review prompt when present. */
  reviewNote?: string;
}

export type SoopProfileTag = "파트너" | "베스트" | "루키존" | "스포츠" | "서포터즈";

export interface CareerRecord {
  wins: number;
  draws: number;
  losses: number;
}

/** A manually-entered career record for one streamer, applied only while their current division matches. */
export interface RecordOverride {
  soopId: string;
  division: number;
  record: CareerRecord;
}

export interface PromotionPost {
  articleId: string;
  cafeAuthor: string;
  title: string;
  category: string;
  publishedAt: string;
  /** Whether Naver exposed an exact posting time or only a calendar date. */
  publishedAtPrecision?: "time" | "date";
  division: number;
  articleUrl: string;
  imageUrls: string[];
  /** Set after the article body has been successfully inspected for media. */
  imagesCheckedAt?: string;
  /** Limits retries for posts whose first article render did not expose media. */
  imageCollectionAttempts?: number;
  /** Career (all-time) W-D-L read from a record-screen screenshot, if one was found among imageUrls. */
  record?: CareerRecord;
  /** Set after imageUrls has been run through record extraction, successfully or not. */
  recordCheckedAt?: string;
  /** Limits retries for posts whose images did not yield a usable record. */
  recordExtractionAttempts?: number;
  /** Set when a later image in the same post produced a different record than the one kept, so it needs a human look. */
  recordNeedsReview?: boolean;
  /** Gemini one-line commentary (~200 chars), generated once the post's career record is known. */
  review?: string;
  /** Set after a review-generation attempt, successfully or not. */
  reviewCheckedAt?: string;
  /** Limits retries for posts whose review generation failed. */
  reviewAttempts?: number;
}

export type StreamerActivityBoard = "scope" | "elevenVsEleven";

export interface StreamerActivityPost {
  articleId: string;
  board: StreamerActivityBoard;
  cafeAuthor: string;
  title: string;
  category: string;
  publishedAt: string;
  articleUrl: string;
}

export interface StreamerRecord {
  id: string;
  displayName: string;
  cafeAliases: string[];
  soopId?: string;
  profileImageUrl?: string;
  soopTags?: SoopProfileTag[];
  autoUpdate: boolean;
  overridePolicy: OverridePolicy;
  overrideDivision?: number;
  currentDivision: number;
  /** Effective career W-D-L to display: a matching record-overrides.yaml entry takes precedence over lastPost.record. */
  record?: CareerRecord;
  lastPost?: PromotionPost;
  /** Every collected division report, ordered from oldest to newest. */
  promotionHistory?: PromotionPost[];
  /** Earlier rank reports, excluding the streamer's current division. */
  previousPromotionPosts?: PromotionPost[];
  scopePosts?: StreamerActivityPost[];
  elevenVsElevenPosts?: StreamerActivityPost[];
  isMapped: boolean;
  celebrationMessage?: string;
  sfx?: string;
  isFancy?: boolean;
  /** Free-text background info about this streamer, injected into the Gemini review prompt when present. */
  reviewNote?: string;
  /** Newest generated review among this streamer's posts. isCurrent is false when a newer report exists that hasn't produced a review yet (not eligible, or still pending). */
  latestReview?: { text: string; generatedAt: string; isCurrent: boolean };
}

/** Free-text background info (e.g. an active recruitment announcement) injected into the review prompt. */
export interface ReviewContextConfig {
  context: string;
}

export interface DashboardSnapshot {
  generatedAt: string;
  status: "ok" | "degraded";
  message?: string;
  streamers: StreamerRecord[];
  latestPosts: PromotionPost[];
  oneVsOneApplications: OneVsOneApplicationView[];
}

export const CAFE = {
  cafeId: "27842958",
  baseUrl: "https://cafe.naver.com",
};

export const BOARDS = {
  scope: { menuId: "1358", name: "잔디동 스코프" },
  division: { menuId: "1359", name: "디비전 보고소" },
  elevenVsEleven: { menuId: "1360", name: "11대 11 플레이 영상" },
  oneVsOne: { menuId: "1361", name: "1대1 평가 신청" },
} as const;

export type BoardId = keyof typeof BOARDS;

export const cafeArticleUrl = (articleId: string, menuId: string = BOARDS.division.menuId, page = 1) =>
  `${CAFE.baseUrl}/f-e/cafes/${CAFE.cafeId}/articles/${articleId}?menuid=${menuId}&referrerAllArticles=false&page=${page}`;

export const soopChannelUrl = (soopId?: string) =>
  soopId ? `https://ch.sooplive.co.kr/${encodeURIComponent(soopId)}` : undefined;

export const defaultSoopProfileUrl = (soopId?: string) =>
  soopId
    ? `https://stimg.sooplive.com/LOGO/${encodeURIComponent(soopId.slice(0, 2).toLowerCase())}/${encodeURIComponent(soopId)}/m/${encodeURIComponent(soopId)}.webp`
    : undefined;

export interface OneVsOneApplication {
  articleId: string;
  cafeAuthor: string;
  title: string;
  category: string;
  publishedAt: string;
  articleUrl: string;
}

export interface OneVsOneResultInput {
  applicationArticleId: string;
  playedAt: string;
  candidateScore: number;
  woowakgoodScore: number;
  note?: string;
}

export interface OneVsOneResultsConfig {
  opponent: {
    displayName: string;
    soopId: string;
    profileImageUrl?: string;
    soopTags?: SoopProfileTag[];
  };
  results: OneVsOneResultInput[];
}

export interface OneVsOneApplicationView extends OneVsOneApplication {
  id: string;
  displayName: string;
  cafeAliases: string[];
  soopId?: string;
  profileImageUrl?: string;
  soopTags?: SoopProfileTag[];
  isMapped: boolean;
  result?: OneVsOneResultInput & { verdict: string; detail: string };
}
