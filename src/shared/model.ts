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
}

export type SoopProfileTag = "파트너" | "베스트" | "루키존" | "스포츠" | "서포터즈";

export interface PromotionPost {
  articleId: string;
  cafeAuthor: string;
  title: string;
  category: string;
  publishedAt: string;
  division: number;
  articleUrl: string;
  imageUrls: string[];
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
  lastPost?: PromotionPost;
  isMapped: boolean;
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
  division: { menuId: "1359", name: "디비전 보고소" },
  oneVsOne: { menuId: "1361", name: "1대1 평가 신청" },
} as const;

export type BoardId = keyof typeof BOARDS;

export const cafeArticleUrl = (articleId: string, menuId: string = BOARDS.division.menuId, page = 1) =>
  `${CAFE.baseUrl}/f-e/cafes/${CAFE.cafeId}/articles/${articleId}?menuid=${menuId}&referrerAllArticles=false&page=${page}`;

export const soopChannelUrl = (soopId?: string) =>
  soopId ? `https://ch.sooplive.co.kr/${encodeURIComponent(soopId)}` : undefined;

export const defaultSoopProfileUrl = (soopId?: string) =>
  soopId
    ? `https://profile.img.sooplive.com/LOGO/af/${encodeURIComponent(soopId)}/${encodeURIComponent(soopId)}.jpg`
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
