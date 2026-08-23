import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { A11y } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper/types";
import "swiper/css";
import { soopLiveBroadcastUrl } from "../shared/model.js";
import type { LiveRosterEntry } from "../shared/soop-live.js";
import { Avatar } from "./cardVisuals";
import { formatDateTime } from "./formatters";
import { playSfx, stopSfx } from "./sfxAudio";
import type { SoopLiveState } from "./useSoopLiveStreamers";

const SKELETON_SLOTS = [1, 2, 3, 4, 5] as const;

function SoopLiveSkeletonCard() {
  return (
    <div className="soop-live-card soop-live-card--skeleton" aria-hidden="true">
      <span className="soop-live-card__thumbnail soop-live-card__skeleton-shimmer" />
      <span className="soop-live-card__meta">
        <span className="soop-live-card__skeleton-avatar soop-live-card__skeleton-shimmer" />
        <span className="soop-live-card__copy">
          <span className="soop-live-card__skeleton-bar soop-live-card__skeleton-bar--name soop-live-card__skeleton-shimmer" />
          <span className="soop-live-card__skeleton-bar soop-live-card__skeleton-bar--title soop-live-card__skeleton-shimmer" />
        </span>
      </span>
    </div>
  );
}

function SoopLiveCard({
  entry,
  sfxEnabled,
  sfxVolume,
}: {
  entry: LiveRosterEntry;
  sfxEnabled: boolean;
  sfxVolume: number;
}) {
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  return (
    <a
      className="soop-live-card"
      href={soopLiveBroadcastUrl(entry.soopId)}
      target="_blank"
      rel="noreferrer"
      aria-label={`${entry.displayName} 방송 보기: ${entry.title}`}
      onMouseEnter={() => {
        // playSfx already stops whatever was playing before starting the new
        // clip, so hovering across cards never overlaps two sounds.
        if (sfxEnabled && entry.sfx) playSfx(entry.sfx, sfxVolume / 100);
      }}
      onMouseLeave={() => {
        if (sfxEnabled && entry.sfx) stopSfx();
      }}
    >
      <span className="soop-live-card__thumbnail">
        {!thumbnailFailed && (
          <img
            src={entry.thumbnailUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setThumbnailFailed(true)}
          />
        )}
        <span className="soop-live-card__viewers">
          <span className="soop-live-card__viewers-dot" aria-hidden="true" />
          {entry.viewerCount.toLocaleString("ko-KR")}
        </span>
      </span>
      <span className="soop-live-card__meta">
        <Avatar
          profileImageUrl={entry.profileImageUrl}
          soopId={entry.soopId}
          displayName={entry.displayName}
        />
        <span className="soop-live-card__copy">
          <strong>{entry.displayName}</strong>
          <small>{entry.title}</small>
        </span>
      </span>
    </a>
  );
}

export function SoopLiveSection({
  soopLive,
  sfxEnabled,
  sfxVolume,
}: {
  soopLive: SoopLiveState;
  sfxEnabled: boolean;
  sfxVolume: number;
}) {
  const { enabled, loaded, entries, updatedAt } = soopLive;
  const swiper = useRef<SwiperInstance | null>(null);
  const [canGoPrev, setCanGoPrev] = useState(false);
  const [canGoNext, setCanGoNext] = useState(true);
  const syncNavigation = (instance: SwiperInstance) => {
    setCanGoPrev(!instance.isBeginning);
    setCanGoNext(!instance.isEnd);
  };

  // Disabled is a permanent, deploy-time state — nothing ever appears, so
  // there's no layout shift to worry about. Loading/empty/live, in
  // contrast, all render the same section shell so the section's presence
  // and height never jump once the section is in the layout.
  if (!enabled) return null;
  const hasLiveStreamers = loaded && entries.length > 0;

  return (
    <section className="soop-live" aria-labelledby="soop-live-title">
      <div className="soop-live__heading">
        <div>
          <p className="eyebrow">NOW STREAMING</p>
          <h2 id="soop-live-title">
            FC26 <span className="soop-live__title-sub">카테고리</span> LIVE
            <span className="soop-live__live-dot" aria-hidden="true" />
            {hasLiveStreamers && (
              <span className="soop-live__count">{entries.length}명 방송중</span>
            )}
          </h2>
          <p className="soop-live__hint">
            현재 FC26 카테고리에서 방송 중인 스트리머는 목록 보기와 상세 정보에서{" "}
            <span className="soop-live__hint-dot" aria-hidden="true" />
            으로 표시됩니다.
          </p>
        </div>
        <div className="soop-live__actions">
          <span
            className="soop-live__refresh-note"
            title={updatedAt ? `마지막 갱신: ${formatDateTime(updatedAt)}` : undefined}
          >
            <span className="sync-dot" aria-hidden="true" /> 2분마다 업데이트
          </span>
          {hasLiveStreamers && (
            <div className="soop-live__navigation" aria-label="스트리밍 목록 넘기기">
              <button
                type="button"
                onClick={() => swiper.current?.slidePrev()}
                aria-label="이전 스트리머"
                disabled={!canGoPrev}
              >
                <ChevronLeft aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => swiper.current?.slideNext()}
                aria-label="다음 스트리머"
                disabled={!canGoNext}
              >
                <ChevronRight aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
      {!loaded ? (
        <div className="soop-live__skeleton" aria-hidden="true">
          {SKELETON_SLOTS.map((slot) => (
            <SoopLiveSkeletonCard key={slot} />
          ))}
        </div>
      ) : hasLiveStreamers ? (
        <Swiper
          className="soop-live__swiper"
          modules={[A11y]}
          onSwiper={(instance) => {
            swiper.current = instance;
            syncNavigation(instance);
          }}
          onSlideChange={syncNavigation}
          onResize={syncNavigation}
          watchOverflow
          spaceBetween={10}
          slidesPerView={1.4}
          breakpoints={{
            481: { slidesPerView: 2.3 },
            760: { slidesPerView: 3.3 },
            1100: { slidesPerView: 4.3 },
          }}
          a11y={{
            prevSlideMessage: "이전 스트리머",
            nextSlideMessage: "다음 스트리머",
          }}
        >
          {entries.map((entry) => (
            <SwiperSlide key={entry.streamerId}>
              <SoopLiveCard
                entry={entry}
                sfxEnabled={sfxEnabled}
                sfxVolume={sfxVolume}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <p className="soop-live__empty">현재 방송중인 스트리머가 없습니다</p>
      )}
    </section>
  );
}
