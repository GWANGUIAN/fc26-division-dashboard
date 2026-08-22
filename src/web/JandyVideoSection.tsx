import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, List } from "lucide-react";
import { A11y } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper/types";
import "swiper/css";
import {
  jandyChapterVideos,
  jandyVideos,
  type JandyChapterVideo,
  type JandyVideo,
} from "./jandyVideosData";

function JandyVideoCard({ video }: { video: JandyVideo }) {
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  return (
    <a
      className="jandy-video"
      href={video.videoUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={`${video.title} 영상 새 탭에서 보기`}
    >
      <span
        className={`jandy-video__thumbnail ${thumbnailFailed ? "jandy-video__thumbnail--fallback" : ""}`}
      >
        {thumbnailFailed ? (
          <span className="jandy-video__fallback">
            <b>▶</b>
            <small>VOD</small>
          </span>
        ) : (
          <img
            src={video.thumbnailUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setThumbnailFailed(true)}
          />
        )}
        <span className="jandy-video__play" aria-hidden="true">
          ▶
        </span>
      </span>
      <span className="jandy-video__copy">
        <strong>{video.title}</strong>
      </span>
    </a>
  );
}

const CHAPTER_CLOSE_DELAY_MS = 220;
const CHAPTER_MENU_GAP = 8;

function JandyChapterVideoCard({ video }: { video: JandyChapterVideo }) {
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{
    left: number;
    top: number;
    bottom: number;
    width: number;
  } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(
      () => setOpen(false),
      CHAPTER_CLOSE_DELAY_MS,
    );
  };

  useEffect(() => () => cancelClose(), []);

  useLayoutEffect(() => {
    if (!open) return;
    const updateRect = () => {
      const box = thumbRef.current?.getBoundingClientRect();
      if (!box) return;
      setRect({
        left: box.left,
        top: box.top,
        bottom: box.bottom,
        width: box.width,
      });
    };
    updateRect();
    addEventListener("resize", updateRect);
    addEventListener("scroll", updateRect, true);
    return () => {
      removeEventListener("resize", updateRect);
      removeEventListener("scroll", updateRect, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (wrapRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) =>
      event.key === "Escape" && setOpen(false);
    addEventListener("mousedown", closeOnOutsideClick);
    addEventListener("keydown", closeOnEscape);
    return () => {
      removeEventListener("mousedown", closeOnOutsideClick);
      removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const openAbove = rect ? rect.top > innerHeight - rect.bottom : true;

  return (
    <div
      className="jandy-video jandy-video--chapters"
      ref={wrapRef}
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className="jandy-video__thumbnail-btn"
        ref={thumbRef}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`${video.title} 구간 선택 목록 열기`}
        onClick={() => setOpen((current) => !current)}
      >
        <span
          className={`jandy-video__thumbnail ${thumbnailFailed ? "jandy-video__thumbnail--fallback" : ""}`}
        >
          {thumbnailFailed ? (
            <span className="jandy-video__fallback">
              <List aria-hidden="true" size={38} />
              <small>VOD</small>
            </span>
          ) : (
            <img
              src={video.thumbnailUrl}
              alt=""
              loading="lazy"
              onError={() => setThumbnailFailed(true)}
            />
          )}
          <span className="jandy-video__play" aria-hidden="true">
            <List size={16} />
          </span>
        </span>
        <span className="jandy-video__copy">
          <strong>{video.title}</strong>
        </span>
      </button>
      {open &&
        rect &&
        createPortal(
          <ul
            className={`jandy-video__chapters ${openAbove ? "jandy-video__chapters--above" : "jandy-video__chapters--below"}`}
            role="menu"
            aria-label={`${video.title} 구간 목록`}
            ref={menuRef}
            style={{
              left: rect.left,
              width: rect.width,
              ...(openAbove
                ? { bottom: innerHeight - rect.top + CHAPTER_MENU_GAP }
                : { top: rect.bottom + CHAPTER_MENU_GAP }),
            }}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          >
            {video.chapters.map((chapter) => (
              <li key={chapter.seconds}>
                <a
                  role="menuitem"
                  href={`${video.videoUrl}?change_second=${chapter.seconds}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {chapter.title}
                </a>
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );
}

export function JandyVideoSection() {
  const swiper = useRef<SwiperInstance | null>(null);
  const [canGoPrev, setCanGoPrev] = useState(false);
  const [canGoNext, setCanGoNext] = useState(true);
  const syncNavigation = (instance: SwiperInstance) => {
    setCanGoPrev(!instance.isBeginning);
    setCanGoNext(!instance.isEnd);
  };
  return (
    <section className="jandy-videos" aria-labelledby="jandy-videos-title">
      <div className="jandy-videos__heading">
        <div>
          <p className="eyebrow">WATCH &amp; LEARN</p>
          <h2 id="jandy-videos-title">잔디동 참고 영상</h2>
        </div>
        <div className="jandy-videos__actions">
          <span>우왁굳 VOD</span>
          <div
            className="jandy-videos__navigation"
            aria-label="참고 영상 넘기기"
          >
            <button
              type="button"
              onClick={() => swiper.current?.slidePrev()}
              aria-label="이전 참고 영상"
              disabled={!canGoPrev}
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => swiper.current?.slideNext()}
              aria-label="다음 참고 영상"
              disabled={!canGoNext}
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      <Swiper
        className="jandy-videos__swiper"
        modules={[A11y]}
        onSwiper={(instance) => {
          swiper.current = instance;
          syncNavigation(instance);
        }}
        onSlideChange={syncNavigation}
        onResize={syncNavigation}
        watchOverflow
        spaceBetween={10}
        slidesPerView={1.1}
        breakpoints={{
          481: { slidesPerView: 2.15 },
          760: { slidesPerView: 3.15 },
          1100: { slidesPerView: 4 },
        }}
        a11y={{
          prevSlideMessage: "이전 참고 영상",
          nextSlideMessage: "다음 참고 영상",
        }}
      >
        {jandyChapterVideos.map((video) => (
          <SwiperSlide key={video.videoUrl}>
            <JandyChapterVideoCard video={video} />
          </SwiperSlide>
        ))}
        {jandyVideos.map((video) => (
          <SwiperSlide key={video.videoUrl}>
            <JandyVideoCard video={video} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
