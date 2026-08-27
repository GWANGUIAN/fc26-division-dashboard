import { GoogleGenAI } from "@google/genai";
import type { StreamerRecord, StreamerReview } from "../shared/model.js";

const apiKey = process.env.GEMINI_API_KEY;
// Falls back to the same model as record-extraction.ts so this feature works
// without a redeploy; override independently via GEMINI_REVIEW_MODEL if needed.
const model = process.env.GEMINI_REVIEW_MODEL ?? process.env.GEMINI_MODEL ?? "gemini-3.6-flash";
const requestTimeoutMs = Number(process.env.GEMINI_REVIEW_REQUEST_TIMEOUT_MS ?? 30_000);
// Generating two flavors in one call takes longer and hits transient
// 503/504s a bit more often than the single-flavor version did.
const maxAttempts = Number(process.env.GEMINI_REVIEW_MAX_ATTEMPTS ?? 3);
const client = apiKey ? new GoogleGenAI({ apiKey }) : undefined;

const reviewSchema = {
  type: "OBJECT",
  properties: {
    mild: { type: "STRING", description: "순한맛 한줄평. 200자 내외의 한국어 존댓말. 따뜻하고 다정한 톤이며 마무리에 응원·격려를 포함해도 된다." },
    spicy: { type: "STRING", description: "매운맛 한줄평. 200자 내외의 한국어 존댓말. 형식적인 응원 멘트 없이 방송각 있게 신랄하거나 과장된 톤. 다만 성적이 이미 매우 뛰어나 비판할 거리가 없으면 억지로 깎아내리지 말고 객관적이되 냉소적인 톤으로 담담하게 서술한다." },
  },
  required: ["mild", "spicy"],
};

function formatRecord(record?: { wins: number; draws: number; losses: number }): string {
  if (!record) return "전적 정보 없음";
  const total = record.wins + record.draws + record.losses;
  const winRate = total > 0 ? Math.round((record.wins / total) * 1000) / 10 : 0;
  return `${record.wins}승 ${record.draws}무 ${record.losses}패 (승률 ${winRate}%)`;
}

function formatPromotionHistory(streamer: StreamerRecord): string {
  const posts = streamer.promotionHistory ?? [];
  if (!posts.length) return "승급 이력 없음";
  return posts
    .map((post) => `${post.division}부 (${post.publishedAt.slice(0, 10)})`)
    .join(" → ");
}

function formatRoster(allStreamers: StreamerRecord[]): string {
  return [...allStreamers]
    .sort((a, b) => a.currentDivision - b.currentDivision || a.displayName.localeCompare(b.displayName, "ko"))
    .map((streamer) => `${streamer.displayName}: ${streamer.currentDivision}부${streamer.passedFirstRound ? " [1차 합격]" : ""}`)
    .join(", ");
}

function formatPassStatus(streamer: StreamerRecord): string {
  return streamer.passedFirstRound
    ? "합격 확정"
    : "미확정 (아직 결과 발표 전이거나 이번 1차에서 합격자 명단에 포함되지 않음)";
}

function buildPrompt(streamer: StreamerRecord, allStreamers: StreamerRecord[], reviewContext: string): string {
  const passedCount = allStreamers.filter((candidate) => candidate.passedFirstRound).length;
  const sections = [
    "이 사이트는 왁물원 잔디동(FC 게임 동아리) 지원자들의 FC26 디비전 현황을 추적하는 대시보드입니다.",
    "현재 잔디동 모집은 1차 합격자 선발이 완료된 상태이며, 지원자 전원이 아니라 일부만 1차 합격이 확정되었습니다.",
    "아래 [전체 동아리 지원자 디비전 현황]에서 '[1차 합격]' 표시가 있는 사람만 합격이 확정된 것이고, 표시가 없는 사람은 아직 결과가 나오지 않았거나 이번 1차 합격자 명단에는 포함되지 않은 상태일 수 있습니다.",
    "아래 정보를 참고해서 이 스트리머에게 보여줄 짧은 한줄평을 작성하세요.",
    "",
    `[이 스트리머: ${streamer.displayName}]`,
    `현재 디비전: ${streamer.currentDivision}부`,
    `1차 합격 여부: ${formatPassStatus(streamer)}`,
    `통산 전적: ${formatRecord(streamer.record)}`,
    `승급 이력: ${formatPromotionHistory(streamer)}`,
  ];

  if (streamer.reviewNote?.trim()) {
    sections.push(`추가 정보: ${streamer.reviewNote.trim()}`);
  }

  sections.push(
    "",
    `[전체 동아리 지원자 디비전 현황] (총 ${allStreamers.length}명, 이 중 1차 합격 ${passedCount}명)`,
    formatRoster(allStreamers),
  );

  if (reviewContext.trim()) {
    sections.push("", "[현재 진행 중인 안내]", reviewContext.trim());
  }

  sections.push(
    "",
    "[작성 지침]",
    "- 같은 데이터를 근거로 톤이 다른 한줄평 두 개(순한맛 mild, 매운맛 spicy)를 함께 작성하세요. 각각 한국어 존댓말, 200자 내외입니다.",
    "- 이 스트리머의 승급/전적/동료 대비 위치 중 데이터로 뒷받침되는 내용만 근거로 분석하세요. 추측하지 마세요.",
    "- 1차 합격 여부가 이 스트리머와 자연스럽게 관련될 때만 짧게 언급하세요(예: 합격 확정이면 축하, 미확정이면 결과를 기다리는 상황을 담담하게 언급 등). 미확정을 '탈락'으로 단정하지 마세요. 굳이 끼워 맞출 필요는 없습니다.",
    "- [순한맛 mild] 따뜻하고 다정한 톤으로 쓰세요. 응원이나 격려하는 말로 마무리해도 좋습니다.",
    "- [매운맛 spicy] '응원합니다', '화이팅', '기대할게요' 같은 형식적인 응원·격려 멘트로 끝맺지 마세요. 시청자가 보고 웃을 수 있는 '방송각'을 뽑아내세요: 성적이 안 좋으면 예능감 있게 신랄하게 디스하고, 성적이 좋으면 오버스럽게 과장해서 극찬하는 등 캐릭터 있는 톤으로 쓰세요. 밋밋하고 무난한 코멘트는 피하세요. 단, 성적이 이미 매우 뛰어나서 신랄하게 깎아내릴 근거가 없다면 억지로 비판하지 말고, 그 격차를 객관적이지만 냉소적인 어조로 담담하게 서술하세요.",
    "- 매운맛도 조롱이나 인신공격은 아니고, 팬들이 웃으며 볼 수 있는 애정 어린 드립 수준을 유지하세요.",
    "- '현재 진행 중인 안내'가 있고 이 스트리머와 관련 있으면 자연스럽게 참고하되, 억지로 끼워넣지 마세요.",
    "- 응답은 반드시 지정된 JSON 스키마 형식(mild, spicy)으로만 반환하세요. 다른 설명이나 텍스트를 추가하지 마세요.",
  );

  return sections.join("\n");
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Gemini review request timed out after ${ms}ms`)), ms)),
  ]);
}

async function generateOnce(prompt: string): Promise<StreamerReview | undefined> {
  const response = await withTimeout(client!.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      temperature: 0.9,
      responseMimeType: "application/json",
      responseSchema: reviewSchema,
      httpOptions: { timeout: requestTimeoutMs },
    },
  }), requestTimeoutMs);
  if (!response.text) return undefined;
  const parsed = JSON.parse(response.text) as { mild?: unknown; spicy?: unknown };
  if (typeof parsed.mild !== "string" || !parsed.mild.trim() || typeof parsed.spicy !== "string" || !parsed.spicy.trim()) {
    return undefined;
  }
  return { mild: parsed.mild.trim(), spicy: parsed.spicy.trim() };
}

/** Generates paired mild/spicy Gemini one-line commentary for a streamer once their career record is known. */
export async function generateStreamerReview(
  streamer: StreamerRecord,
  allStreamers: StreamerRecord[],
  reviewContext: string,
): Promise<StreamerReview | undefined> {
  if (!client) return undefined;
  // Excluded streamers (e.g. non-applicants who still post division reports)
  // never appear in the roster context handed to Gemini, whether they're the
  // review's own subject or a bystander in the full-roster listing.
  const rosterForPrompt = allStreamers.filter((candidate) => !candidate.isExcluded);
  const prompt = buildPrompt(streamer, rosterForPrompt, reviewContext);
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await generateOnce(prompt);
      if (result) return result;
    } catch (error) {
      console.warn(`Review generation attempt ${attempt}/${maxAttempts} failed for ${streamer.id}: ${(error as Error).message}`);
    }
  }
  return undefined;
}
