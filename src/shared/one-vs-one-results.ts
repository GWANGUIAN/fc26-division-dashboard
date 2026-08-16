import { parse } from "yaml";
import type { OneVsOneResultsConfig } from "./model.js";

export const DEFAULT_ONE_VS_ONE_CONFIG: OneVsOneResultsConfig = {
  opponent: { displayName: "우왁굳", soopId: "ecvhao", soopTags: ["파트너", "베스트"] },
  results: [],
};

export function parseOneVsOneResults(source: string): OneVsOneResultsConfig {
  const parsed = parse(source) as OneVsOneResultsConfig | null;
  if (!parsed?.opponent?.displayName || !parsed.opponent.soopId || !Array.isArray(parsed.results)) {
    throw new Error("one-vs-one-results.yaml must contain opponent and results");
  }
  if (parsed.opponent.soopTags?.some((tag) => !["파트너", "베스트", "루키존", "스포츠", "서포터즈"].includes(tag))) {
    throw new Error("one-vs-one-results.yaml opponent has an unsupported soop tag");
  }
  const articleIds = new Set<string>();
  for (const result of parsed.results) {
    if (!/^\d+$/u.test(result.applicationArticleId ?? "")) throw new Error("applicationArticleId must be a Naver article ID");
    if (articleIds.has(result.applicationArticleId)) throw new Error(`Duplicate evaluation result: ${result.applicationArticleId}`);
    articleIds.add(result.applicationArticleId);
    if (!Number.isInteger(result.candidateScore) || !Number.isInteger(result.woowakgoodScore) || result.candidateScore < 0 || result.woowakgoodScore < 0) {
      throw new Error(`Scores must be non-negative integers: ${result.applicationArticleId}`);
    }
    if (!result.playedAt || Number.isNaN(Date.parse(result.playedAt))) throw new Error(`Invalid playedAt: ${result.applicationArticleId}`);
  }
  return parsed;
}
