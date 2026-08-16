import type { DashboardSnapshot } from "../shared/model.js";

const demo: DashboardSnapshot = {
  generatedAt: new Date().toISOString(), status: "ok",
  streamers: [
    { id: "demo-1", displayName: "문모모", cafeAliases: ["문 모모"], autoUpdate: true, overridePolicy: "auto", currentDivision: 5, isMapped: false, lastPost: { articleId: "21954928", cafeAuthor: "문 모모", title: "문모모 5부 보고드립니다!", category: "[5부 승격]", publishedAt: "2026-08-16T05:06:00+09:00", division: 5, articleUrl: "https://cafe.naver.com/f-e/cafes/27842958/articles/21954928?menuid=1359", imageUrls: [] } },
    { id: "demo-2", displayName: "찌 미", cafeAliases: ["찌 미"], autoUpdate: true, overridePolicy: "auto", currentDivision: 7, isMapped: false, lastPost: { articleId: "21955119", cafeAuthor: "찌 미", title: "찌미 디비전 7부 보고합니당!", category: "[7부 승격]", publishedAt: "2026-08-16T11:55:00+09:00", division: 7, articleUrl: "https://cafe.naver.com/f-e/cafes/27842958/articles/21955119?menuid=1359", imageUrls: [] } },
    { id: "demo-3", displayName: "마이곰이", cafeAliases: ["마이곰이"], autoUpdate: true, overridePolicy: "auto", currentDivision: 9, isMapped: false, lastPost: { articleId: "21954846", cafeAuthor: "마이곰이", title: "마이곰이 디비전 9부 입니당!", category: "[9부 승격]", publishedAt: "2026-08-16T03:15:00+09:00", division: 9, articleUrl: "https://cafe.naver.com/f-e/cafes/27842958/articles/21954846?menuid=1359", imageUrls: [] } },
    { id: "demo-4", displayName: "신규 후보", cafeAliases: ["신규 후보"], autoUpdate: true, overridePolicy: "auto", currentDivision: 10, isMapped: true, soopId: "", lastPost: undefined },
  ],
  latestPosts: [],
  oneVsOneApplications: [
    { id: "application:mir", articleId: "21951534", cafeAuthor: "MIR미르", displayName: "MIR미르", cafeAliases: ["MIR미르"], title: "왁굳님, 저의 희망을 밟아주세요", category: "[1대1 평가 신청]", publishedAt: "2026-08-14T20:00:00+09:00", articleUrl: "https://cafe.naver.com/f-e/cafes/27842958/articles/21951534?menuid=1361", isMapped: false },
    { id: "application:complete-demo", articleId: "21950000", cafeAuthor: "테스트 후보", displayName: "테스트 후보", cafeAliases: ["테스트 후보"], title: "1대1 평가 신청합니다", category: "[1대1 평가 신청]", publishedAt: "2026-08-12T20:00:00+09:00", articleUrl: "https://cafe.naver.com/f-e/cafes/27842958/articles/21950000?menuid=1361", isMapped: true, soopTags: ["루키존", "스포츠", "서포터즈"], result: { applicationArticleId: "21950000", playedAt: "2026-08-15T20:00:00+09:00", candidateScore: 3, woowakgoodScore: 8, verdict: "잔디동 합격 조건 충족", detail: "5점 차 패배" } },
  ],
};

export async function loadSnapshot(): Promise<DashboardSnapshot> {
  // The Function URL is public read-only data.  Keep local development on the
  // sample snapshot while making the Cloudflare production build work without
  // requiring a dashboard secret or a manually configured build variable.
  const url = import.meta.env.VITE_DATA_API_URL
    ?? (import.meta.env.PROD ? "https://xu4v4zbffpa7gajxmoc2hdvpmi0abjzw.lambda-url.ap-northeast-2.on.aws/" : undefined);
  if (!url) return demo;
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`대시보드 데이터를 불러오지 못했습니다 (${response.status})`);
  return response.json() as Promise<DashboardSnapshot>;
}
