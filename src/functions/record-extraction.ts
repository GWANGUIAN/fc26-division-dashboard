import { GoogleGenAI } from "@google/genai";
import { chooseRecord, parseRecordScreenResult, type ExtractedRecord } from "../shared/record-extraction.js";

const apiKey = process.env.GEMINI_API_KEY;
// Flash-tier model IDs are renamed periodically; override via env instead of redeploying code.
const model = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";
const requestTimeoutMs = Number(process.env.GEMINI_REQUEST_TIMEOUT_MS ?? 30_000);
// Even at temperature 0, manual testing showed the model occasionally return
// isRecordScreen:false on screenshots that unambiguously show a record panel
// (and separately, transient 429/503/504s do happen). Retrying the same
// image a couple more times reliably recovers both cases.
const maxAttemptsPerImage = Number(process.env.GEMINI_MAX_ATTEMPTS_PER_IMAGE ?? 3);
const client = apiKey ? new GoogleGenAI({ apiKey }) : undefined;

// FC26 screenshots vary: a lobby screen labels the all-time panel "기록"
// alongside a season counter, while an in-match walkout/player-card overlay
// labels the same total "전체 기록" and separately shows a season-only
// "기록" and a recent-form streak. Broadcast captures can also have a
// face-cam or alert banner layered over part of the screen.
const prompt = `이 이미지는 EA SPORTS FC 게임의 스크린샷일 수 있습니다.
이 이미지가 게임 UI의 전적/기록 화면(메인 로비 화면의 "기록" 패널, 또는 경기 중 뜨는 선수카드/워크아웃 오버레이의 "전체 기록")인지 판단하세요.

다음 규칙을 반드시 지키세요:
- 반드시 통산 누적 전적(career total)만 추출하세요. "현재 시즌"이라는 이름이 붙었거나 해당 시즌 진행 중임을 나타내는 기록(예: 로비 화면의 "현재 시즌" 패널, 워크아웃 카드의 "기록: X-X-X"이면서 옆에 "현재 시즌"류 표기가 없는 시즌 중 기록)은 통산 기록이 아니므로 반드시 무시하세요.
- "시즌: N" 같은 시즌 번호 표기와 함께 있고 "현재 시즌"이라 불리지 않는 쪽의 W-D-L 숫자가 통산 누적 전적입니다. 워크아웃 카드에서는 "전체 기록" 라벨이 이에 해당합니다.
- "폼(Form)"의 승/무/패 스트릭(예: W/L/D 나열)은 최근 경기 흐름이며 전적이 아니므로 반드시 추출 대상에서 제외하세요.
- 얼굴캠, 채팅, 구독 알림 배너 등 방송 오버레이 요소는 반드시 무시하고, 게임이 렌더링한 UI 텍스트로 실제로 화면에 보이는 숫자만 근거로 판단하세요. 추측하거나 임의로 값을 만들어내지 마세요.
- 이 화면이 전적 화면이 아니거나 통산 누적 전적을 확신할 수 없으면 반드시 isRecordScreen을 false로 반환하세요. 이 경우 wins/draws/losses는 무시되니 0으로 채우세요.
- 응답은 반드시 지정된 JSON 스키마 형식(isRecordScreen, wins, draws, losses)을 모두 포함해서 반환하세요. 필드를 생략하지 마세요. 다른 설명이나 텍스트를 추가하지 마세요.`;

const recordSchema = {
  type: "OBJECT",
  properties: {
    isRecordScreen: { type: "BOOLEAN", description: "이미지가 통산 누적 전적을 읽을 수 있는 게임 UI 화면인지 여부" },
    wins: { type: "INTEGER", description: "통산 누적 승리 수. isRecordScreen이 false면 0" },
    draws: { type: "INTEGER", description: "통산 누적 무승부 수. isRecordScreen이 false면 0" },
    losses: { type: "INTEGER", description: "통산 누적 패배 수. isRecordScreen이 false면 0" },
  },
  // All four fields are required (not just isRecordScreen) so the model
  // cannot emit a truncated object like {isRecordScreen:true, wins:53} that
  // omits draws/losses — observed happening when only isRecordScreen was required.
  required: ["isRecordScreen", "wins", "draws", "losses"],
};

async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string } | undefined> {
  const response = await fetch(url);
  if (!response.ok) return undefined;
  const mimeType = response.headers.get("content-type") ?? "image/jpeg";
  const buffer = Buffer.from(await response.arrayBuffer());
  return { data: buffer.toString("base64"), mimeType };
}

// The SDK's own httpOptions.timeout was observed to not bound every hang
// (a request can stall indefinitely with neither a response nor a thrown
// error). Race it against an independent timer so a single bad request can
// never block the rest of the batch.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Gemini request timed out after ${ms}ms`)), ms)),
  ]);
}

async function extractFromImageOnce(image: { data: string; mimeType: string }): Promise<ExtractedRecord | undefined> {
  const response = await withTimeout(client!.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType: image.mimeType, data: image.data } }] }],
    config: {
      // Zero temperature: this is a deterministic read-the-screen task, not
      // creative generation.
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: recordSchema,
      httpOptions: { timeout: requestTimeoutMs },
    },
  }), requestTimeoutMs);
  if (!response.text) return undefined;
  return parseRecordScreenResult(JSON.parse(response.text));
}

async function extractFromImage(imageUrl: string): Promise<ExtractedRecord | undefined> {
  if (!client) return undefined;
  const image = await fetchImageAsBase64(imageUrl);
  if (!image) return undefined;
  for (let attempt = 1; attempt <= maxAttemptsPerImage; attempt += 1) {
    try {
      const result = await extractFromImageOnce(image);
      if (result) return result;
    } catch (error) {
      console.warn(`Record extraction attempt ${attempt}/${maxAttemptsPerImage} failed for ${imageUrl}: ${(error as Error).message}`);
    }
  }
  return undefined;
}

/** Extracts a streamer's career W-D-L from a post's images, if any of them show a record screen. */
export async function extractRecordFromImages(imageUrls: string[]): Promise<{ record?: ExtractedRecord; needsReview?: boolean }> {
  if (!client || !imageUrls.length) return {};
  const results: Array<ExtractedRecord | undefined> = [];
  for (const imageUrl of imageUrls) {
    results.push(await extractFromImage(imageUrl));
  }
  return chooseRecord(results);
}
