import type { LyricCue } from "./coverLoopMedia";

export type LyricParseError = { line: number; message: string };
export type LyricParseResult =
  | { ok: true; cues: LyricCue[] }
  | { ok: false; errors: LyricParseError[] };

// [분:초:센티초] — 예: [03:45:20] = 3분 45.20초.
const LYRIC_LINE_RE = /^\[(\d{2}):(\d{2}):(\d{2})\](.*)$/;

/** 가사 마지막 줄은 곡 길이를 모르므로 시작 후 이만큼만 노출한다. */
export const LAST_LINE_PADDING_SECONDS = 6;

export const LYRIC_FORMAT_EXAMPLE = "[00:03:45]첫 가사줄\n[00:03:52]둘째 가사줄";

/** 가사는 선택 입력이므로 빈 텍스트는 유효하다({ok:true, cues:[]}). */
export function parseCoverLoopLyrics(raw: string): LyricParseResult {
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) return { ok: true, cues: [] };

  const errors: LyricParseError[] = [];
  const parsed: { startSeconds: number; text: string }[] = [];

  lines.forEach((line, i) => {
    const match = LYRIC_LINE_RE.exec(line);
    if (!match) {
      errors.push({ line: i + 1, message: `형식이 올바르지 않습니다: "${line}" (예: [00:03:45]가사)` });
      return;
    }
    const [, mm, ss, cc] = match;
    const text = match[4].trim();
    const startSeconds = Number(mm) * 60 + Number(ss) + Number(cc) / 100;
    if (!text) {
      errors.push({ line: i + 1, message: "가사 텍스트가 비어 있습니다." });
      return;
    }
    if (parsed.length > 0 && startSeconds <= parsed[parsed.length - 1].startSeconds) {
      errors.push({ line: i + 1, message: "이전 줄보다 시간이 늦어야 합니다." });
      return;
    }
    parsed.push({ startSeconds, text });
  });

  if (errors.length > 0) return { ok: false, errors };

  const cues: LyricCue[] = parsed.map((cue, i) => ({
    startSeconds: cue.startSeconds,
    endSeconds:
      i < parsed.length - 1 ? parsed[i + 1].startSeconds : cue.startSeconds + LAST_LINE_PADDING_SECONDS,
    text: cue.text,
  }));
  return { ok: true, cues };
}

/** 저장된 cue들을 폼 편집용 텍스트로 되돌린다(수정 화면 초기값). */
export function stringifyCoverLoopLyrics(cues: readonly LyricCue[]): string {
  return cues
    .map((cue) => {
      const totalCentiseconds = Math.round(cue.startSeconds * 100);
      const mm = Math.floor(totalCentiseconds / 6000);
      const ss = Math.floor((totalCentiseconds % 6000) / 100);
      const cc = totalCentiseconds % 100;
      const pad = (n: number) => String(n).padStart(2, "0");
      return `[${pad(mm)}:${pad(ss)}:${pad(cc)}]${cue.text}`;
    })
    .join("\n");
}
