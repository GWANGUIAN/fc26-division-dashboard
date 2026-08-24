import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Shuffle, Vote } from "lucide-react";
import type { StreamerActivityPost } from "../shared/model.js";
import { formatCafePostDate } from "../shared/dates.js";
import { playRevealChime, startSpinSound, stopSpinSound } from "./rouletteSfx";
import { loadPromoPickerOpen, savePromoPickerOpen } from "./storage";

const SPIN_DURATION_MS = 2000;
const REEL_ROW_COUNT = 8;

function boardLabel(post: StreamerActivityPost) {
  return post.category || (post.board === "elevenVsEleven" ? "11대11" : "");
}

export function PromoPostPicker({
  posts,
  sfxEnabled,
  sfxVolume,
}: {
  posts: StreamerActivityPost[];
  sfxEnabled: boolean;
  sfxVolume: number;
}) {
  const [isOpen, setIsOpen] = useState(loadPromoPickerOpen);
  const [mode, setMode] = useState<"idle" | "spinning" | "stopped">("idle");
  const [reelSeed, setReelSeed] = useState(0);
  const [result, setResult] = useState<StreamerActivityPost>();
  const spinTimeoutRef = useRef<number | undefined>(undefined);
  const lastResultIdRef = useRef<string | undefined>(undefined);

  function toggleOpen() {
    setIsOpen((current) => {
      const next = !current;
      savePromoPickerOpen(next);
      return next;
    });
  }

  function spin() {
    if (posts.length === 0 || mode === "spinning") return;
    setMode("spinning");
    setResult(undefined);
    setReelSeed((seed) => seed + 1);
    startSpinSound(sfxEnabled, sfxVolume);
    if (spinTimeoutRef.current) window.clearTimeout(spinTimeoutRef.current);
    spinTimeoutRef.current = window.setTimeout(() => {
      const candidates = posts.length > 1 ? posts.filter((post) => post.articleId !== lastResultIdRef.current) : posts;
      const picked = candidates[Math.floor(Math.random() * candidates.length)];
      lastResultIdRef.current = picked.articleId;
      setResult(picked);
      setMode("stopped");
      stopSpinSound();
      playRevealChime(sfxEnabled, sfxVolume);
    }, SPIN_DURATION_MS);
  }

  useEffect(
    () => () => {
      stopSpinSound();
      if (spinTimeoutRef.current) window.clearTimeout(spinTimeoutRef.current);
    },
    [],
  );

  const reelItems = useMemo(() => {
    if (posts.length === 0) return [];
    const sample = [...posts].sort(() => Math.random() - 0.5).slice(0, Math.min(REEL_ROW_COUNT, posts.length));
    return [...sample, ...sample];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, reelSeed]);

  if (!isOpen) {
    return (
      <button
        type="button"
        className="theme-toggle promo-picker__reopen"
        onClick={toggleOpen}
        aria-label="홍보글 랜덤 선택기 열기"
      >
        <Vote aria-hidden="true" />
      </button>
    );
  }

  return (
    <div className="promo-picker">
      <div className="promo-picker__title-row">
        <p className="promo-picker__title">
          <Vote aria-hidden="true" /> 홍보글 랜덤 선택기
        </p>
        <button type="button" className="promo-picker__collapse" onClick={toggleOpen} aria-label="닫기">
          <ChevronDown aria-hidden="true" />
        </button>
      </div>
      <div className={`promo-picker__reel-window promo-picker__reel-window--${mode}`}>
        {mode === "spinning" && (
          <div className="promo-picker__reel-strip">
            {reelItems.map((post, index) => (
              <div className="promo-picker__reel-row" key={index}>
                <span className="promo-picker__reel-category">{boardLabel(post)}</span>
                <span className="promo-picker__reel-title">{post.title}</span>
              </div>
            ))}
          </div>
        )}
        {mode === "stopped" && result && (
          <a className="promo-picker__result" href={result.articleUrl} target="_blank" rel="noreferrer">
            <span className="promo-picker__reel-category">{boardLabel(result)}</span>
            <strong className="promo-picker__reel-title">{result.title}</strong>
            <small>
              {result.cafeAuthor} · {formatCafePostDate(result.publishedAt)}
            </small>
          </a>
        )}
        {mode === "idle" && (
          <p className="promo-picker__idle">
            {posts.length === 0 ? "표시할 홍보글이 없습니다" : "뽑기를 눌러 홍보글을 뽑아보세요"}
          </p>
        )}
      </div>
      <button
        type="button"
        className="promo-picker__spin"
        onClick={spin}
        disabled={posts.length === 0 || mode === "spinning"}
      >
        <Shuffle aria-hidden="true" />
        {mode === "spinning" ? "돌아가는 중..." : mode === "stopped" ? "다시 뽑기" : "뽑기"}
      </button>
    </div>
  );
}
