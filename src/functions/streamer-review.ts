import { GoogleGenAI } from "@google/genai";
import type { StreamerRecord } from "../shared/model.js";

const apiKey = process.env.GEMINI_API_KEY;
// Falls back to the same model as record-extraction.ts so this feature works
// without a redeploy; override independently via GEMINI_REVIEW_MODEL if needed.
const model = process.env.GEMINI_REVIEW_MODEL ?? process.env.GEMINI_MODEL ?? "gemini-3.6-flash";
const requestTimeoutMs = Number(process.env.GEMINI_REVIEW_REQUEST_TIMEOUT_MS ?? 30_000);
// Unlike OCR, there's no ambiguous screen to misread, so fewer retries are needed.
const maxAttempts = Number(process.env.GEMINI_REVIEW_MAX_ATTEMPTS ?? 2);
const client = apiKey ? new GoogleGenAI({ apiKey }) : undefined;

const reviewSchema = {
  type: "OBJECT",
  properties: {
    review: { type: "STRING", description: "스트리머에게 보여줄 한줄평. 200자 내외의 한국어 존댓말. 형식적인 응원 멘트 없이, 방송각 있게 신랄하거나 과장된 톤의 데이터 분석." },
  },
  required: ["review"],
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
    .map((streamer) => `${streamer.displayName}: ${streamer.currentDivision}부`)
    .join(", ");
}

function buildPrompt(streamer: StreamerRecord, allStreamers: StreamerRecord[], reviewContext: string): string {
  const sections = [
    "이 사이트는 왁물원 잔디동(FC 게임 동아리) 지원자들의 FC26 디비전 현황을 추적하는 대시보드입니다.",
    "아래 정보를 참고해서 이 스트리머에게 보여줄 짧은 한줄평을 작성하세요.",
    "",
    `[이 스트리머: ${streamer.displayName}]`,
    `현재 디비전: ${streamer.currentDivision}부`,
    `통산 전적: ${formatRecord(streamer.record)}`,
    `승급 이력: ${formatPromotionHistory(streamer)}`,
  ];

  if (streamer.reviewNote?.trim()) {
    sections.push(`추가 정보: ${streamer.reviewNote.trim()}`);
  }

  sections.push(
    "",
    `[전체 동아리 지원자 디비전 현황] (총 ${allStreamers.length}명)`,
    formatRoster(allStreamers),
  );

  if (reviewContext.trim()) {
    sections.push("", "[현재 진행 중인 안내]", reviewContext.trim());
  }

  sections.push(
    "",
    "[작성 지침]",
    "- 한국어 존댓말로, 200자 내외의 짧은 한줄평만 작성하세요.",
    "- 이 스트리머의 승급/전적/동료 대비 위치 중 데이터로 뒷받침되는 내용만 근거로 분석하세요. 추측하지 마세요.",
    "- 순수한 데이터 분석/평가만 작성하세요. '응원합니다', '화이팅', '기대할게요' 같은 형식적인 응원·격려 멘트로 끝맺지 마세요.",
    "- 시청자가 보고 웃을 수 있는 '방송각'을 뽑아내세요: 성적이 안 좋으면 예능감 있게 신랄하게 디스하거나, 성적이 좋으면 오버스럽게 과장해서 극찬하는 등 캐릭터 있는 톤으로 쓰세요. 밋밋하고 무난한 코멘트는 피하세요.",
    "- 다만 조롱이나 인신공격이 아니라, 팬들이 웃으며 볼 수 있는 애정 어린 드립 수준을 유지하세요.",
    "- '현재 진행 중인 안내'가 있고 이 스트리머와 관련 있으면 자연스럽게 참고하되, 억지로 끼워넣지 마세요.",
    "- 응답은 반드시 지정된 JSON 스키마 형식(review)으로만 반환하세요. 다른 설명이나 텍스트를 추가하지 마세요.",
  );

  return sections.join("\n");
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Gemini review request timed out after ${ms}ms`)), ms)),
  ]);
}

async function generateOnce(prompt: string): Promise<string | undefined> {
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
  const parsed = JSON.parse(response.text) as { review?: unknown };
  return typeof parsed.review === "string" && parsed.review.trim() ? parsed.review.trim() : undefined;
}

/** Generates a short Gemini one-line commentary for a streamer once their career record is known. */
export async function generateStreamerReview(
  streamer: StreamerRecord,
  allStreamers: StreamerRecord[],
  reviewContext: string,
): Promise<string | undefined> {
  if (!client) return undefined;
  const prompt = buildPrompt(streamer, allStreamers, reviewContext);
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
