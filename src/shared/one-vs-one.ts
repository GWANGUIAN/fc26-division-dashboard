import type { OneVsOneApplication, OneVsOneApplicationView, OneVsOneResultInput, OneVsOneResultsConfig, RosterEntry } from "./model.js";
import { matchRosterEntry, normalizeCafeAlias } from "./promotion.js";

const applicationCategory = /^\s*\[\s*1대1\s*평가\s*신청\s*\]/u;

export const ADDITIONAL_VERDICT_CRITERIA = [
  "1:1 디비전 랭크 (몇부 리거 인지)",
  "11:11 플레이 평가 (본인이 희망하는 포지션의 11:11 플레이를 올려 주시면 종합 평가로 참고)",
  "열정 평가 (방송에서 잔디를 얼마나 공부하고 연습했는지)",
  "왁덜식 (게임 외적인 부분을 포함한 종합 평가)"
] as const;

export function isOneVsOneApplication(value: Pick<OneVsOneApplication, "category" | "title">): boolean {
  return applicationCategory.test(value.category) || applicationCategory.test(value.title);
}

export function calculateOneVsOneVerdict(candidateScore: number, woowakgoodScore: number): { verdict: string; detail: string } {
  if (candidateScore > woowakgoodScore) return { verdict: "잔디동 회장", detail: "우왁굳을 상대로 승리" };
  if (candidateScore === woowakgoodScore) return { verdict: "잔디동 합격 확정", detail: "우왁굳과 무승부" };
  const gap = woowakgoodScore - candidateScore;
  const outcomes: Record<number, { verdict: string; detail: string }> = {
    1: { verdict: "잔디동 운영급 실력", detail: "1점 차 패배" },
    2: { verdict: "잔디동 반장급 실력", detail: "2점 차 패배" },
    3: { verdict: "잔디동 에이스급 실력", detail: "3점 차 패배" },
    4: { verdict: "잔디동 상현급 실력", detail: "4점 차 패배" },
    5: { verdict: "잔디동 합격 조건 충족", detail: "5점 차 패배" },
    6: { verdict: "추가 조건 1개 필요", detail: "나머지 4개 기준 중 1개 이상 높을 시 합격 조건 충족" },
    7: { verdict: "추가 조건 2개 필요", detail: "나머지 4개 기준 중 2개 이상 높을 시 합격 조건 충족" },
    8: { verdict: "추가 조건 3개 필요", detail: "나머지 4개 기준 중 3개 이상 높을 시 합격 조건 충족" },
    9: { verdict: "추가 조건 4개 필요", detail: "나머지 4개 기준이 모두 높을 시 합격 조건 충족" },
  };
  return outcomes[gap] ?? { verdict: "잔디동 합격 불투명", detail: "10점 차 이상 패배" };
}

export function buildOneVsOneApplications(
  applications: OneVsOneApplication[],
  roster: RosterEntry[],
  results: OneVsOneResultsConfig,
): OneVsOneApplicationView[] {
  const byArticle = new Map(results.results.map((result) => [result.applicationArticleId, result]));
  return applications
    .filter((application) => !matchRosterEntry(application.cafeAuthor, roster)?.deleted)
    .map((application) => {
      const entry = matchRosterEntry(application.cafeAuthor, roster);
      const result = byArticle.get(application.articleId);
      return {
        ...application,
        id: entry?.slug ?? `application:${normalizeCafeAlias(application.cafeAuthor)}`,
        displayName: entry?.displayName ?? application.cafeAuthor,
        cafeAliases: entry?.cafeAliases ?? [application.cafeAuthor],
        soopId: entry?.soopId || undefined,
        profileImageUrl: entry?.profileImageUrl,
        isMapped: Boolean(entry),
        result: result ? { ...result, ...calculateOneVsOneVerdict(result.candidateScore, result.woowakgoodScore) } : undefined,
      };
    })
    .sort((a, b) => Number(Boolean(a.result)) - Number(Boolean(b.result)) || b.publishedAt.localeCompare(a.publishedAt));
}
