import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Timer, X } from "lucide-react";
import type { CoverLoopTrack } from "./coverLoopLabData";
import "./cover-loop-lyric-timing.css";

function formatLrcTimestamp(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const minutes = Math.floor(clamped / 60);
  const rest = clamped - minutes * 60;
  return `${String(minutes).padStart(2, "0")}:${rest.toFixed(2).padStart(5, "0")}`;
}

/**
 * Dev-only manual lyric timing tool — for when a track's cues drift out of sync (e.g. Janine's
 * lyrics after "끝이 아니야"). Play the song, tap through the lyric lines as they're sung, then
 * copy the generated LRC text back into chat so it can be converted into a LyricCue[] update.
 * Never rendered in production — the caller gates it behind `import.meta.env.DEV`.
 */
export function CoverLoopLyricTimingTool({
  track,
  currentTime,
  isPlaying,
  onTogglePlayback,
  onSeekToStart,
}: {
  track: CoverLoopTrack;
  currentTime: number;
  isPlaying: boolean;
  onTogglePlayback: () => void;
  onSeekToStart: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [linesText, setLinesText] = useState(() => track.lyrics.map((cue) => cue.text).join("\n"));
  const [taps, setTaps] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);
  const copiedTimerRef = useRef<number | undefined>(undefined);

  const lines = useMemo(() => linesText.split("\n").map((line) => line.trim()).filter(Boolean), [linesText]);
  const tapIndex = taps.length;

  useEffect(() => () => window.clearTimeout(copiedTimerRef.current), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLLIElement>('[data-current="true"]')?.scrollIntoView({ block: "nearest" });
  }, [open, tapIndex]);

  function loadFromTrack() {
    setLinesText(track.lyrics.map((cue) => cue.text).join("\n"));
    setTaps([]);
  }

  function handleTap() {
    if (tapIndex >= lines.length) return;
    setTaps((previous) => [...previous, currentTime]);
  }

  function handleUndo() {
    setTaps((previous) => previous.slice(0, -1));
  }

  function handleReset() {
    setTaps([]);
  }

  const lrcOutput = taps.map((time, i) => `[${formatLrcTimestamp(time)}]${lines[i]}`).join("\n");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(lrcOutput);
      setCopied(true);
      window.clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard permission denied — the output textarea can still be selected/copied by hand */
    }
  }

  return (
    <>
      <button
        type="button"
        className="cover-loop-lyric-timing__trigger"
        onClick={() => setOpen(true)}
        aria-label="가사 타이밍 도구 열기 (개발 모드 전용)"
        title="가사 타이밍 도구 (DEV)"
      >
        <Timer aria-hidden="true" />
      </button>
      {open && (
        <div className="cover-loop-lyric-timing__backdrop" onClick={() => setOpen(false)}>
          <aside
            className="cover-loop-lyric-timing__drawer"
            role="dialog"
            aria-modal="true"
            aria-label="가사 타이밍 도구"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="cover-loop-lyric-timing__header">
              <strong>
                가사 타이밍 도구 <span>DEV</span>
              </strong>
              <button type="button" onClick={() => setOpen(false)} aria-label="닫기">
                <X aria-hidden="true" />
              </button>
            </header>

            <p className="cover-loop-lyric-timing__hint">
              아래 줄이 <strong>시작되는 순간</strong> 누르세요(끝나는 시점 아님) — 그 줄의 시작 시각으로 기록됩니다.
            </p>
            <div className="cover-loop-lyric-timing__playback">
              <button type="button" onClick={onSeekToStart}>
                처음으로
              </button>
              <button type="button" onClick={onTogglePlayback}>
                {isPlaying ? "일시정지" : "재생"}
              </button>
              <time>{formatLrcTimestamp(currentTime)}</time>
              <button type="button" className="cover-loop-lyric-timing__tap" onClick={handleTap} disabled={tapIndex >= lines.length}>
                이 줄 시작! ({Math.min(tapIndex + 1, lines.length)}/{lines.length})
              </button>
            </div>

            <div className="cover-loop-lyric-timing__lines-head">
              <span>가사 목록 (줄바꿈 구분, 수정 가능)</span>
              <button type="button" onClick={loadFromTrack}>
                현재 곡 가사 불러오기
              </button>
            </div>
            <textarea
              className="cover-loop-lyric-timing__lines-input"
              value={linesText}
              onChange={(event) => setLinesText(event.target.value)}
              rows={4}
              spellCheck={false}
            />

            <ol className="cover-loop-lyric-timing__lines" ref={listRef}>
              {lines.map((line, i) => (
                <li key={i} data-current={i === tapIndex} className={i < tapIndex ? "done" : i === tapIndex ? "current" : ""}>
                  <span className="cover-loop-lyric-timing__time">
                    {i < tapIndex ? formatLrcTimestamp(taps[i]) : i === tapIndex ? "▶" : "—"}
                  </span>
                  <span className="cover-loop-lyric-timing__text">{line}</span>
                </li>
              ))}
            </ol>

            <div className="cover-loop-lyric-timing__actions">
              <button type="button" onClick={handleUndo} disabled={taps.length === 0}>
                되돌리기
              </button>
              <button type="button" onClick={handleReset} disabled={taps.length === 0}>
                초기화
              </button>
            </div>

            <div className="cover-loop-lyric-timing__output-head">
              <span>결과 (LRC) — 복사해서 전달하세요</span>
              <button type="button" onClick={handleCopy} disabled={taps.length === 0}>
                <Copy aria-hidden="true" /> {copied ? "복사됨" : "복사"}
              </button>
            </div>
            <textarea className="cover-loop-lyric-timing__output" value={lrcOutput} readOnly rows={6} spellCheck={false} />
          </aside>
        </div>
      )}
    </>
  );
}
