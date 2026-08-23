import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { A11y } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper/types";
import "swiper/css";
import type { StreamerRecord } from "../shared/model.js";
import { soopChannelUrl } from "../shared/model.js";
import type { LiveRosterEntry } from "../shared/soop-live.js";
import { Avatar } from "./cardVisuals";
import { formatDateTime } from "./formatters";
import { useSoopLiveStreamers } from "./useSoopLiveStreamers";

function SoopLiveCard({ entry }: { entry: LiveRosterEntry }) {
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  return (
    <a
      className="soop-live-card"
      href={soopChannelUrl(entry.soopId)}
      target="_blank"
      rel="noreferrer"
      aria-label={`${entry.displayName} 방송 보기: ${entry.title}`}
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
        <span className="soop-live-card__live-badge">LIVE</span>
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

export function SoopLiveSection({ streamers }: { streamers: StreamerRecord[] }) {
  const { enabled, entries, updatedAt } = useSoopLiveStreamers(streamers);
  const swiper = useRef<SwiperInstance | null>(null);
  const [canGoPrev, setCanGoPrev] = useState(false);
  const [canGoNext, setCanGoNext] = useState(true);
  const syncNavigation = (instance: SwiperInstance) => {
    setCanGoPrev(!instance.isBeginning);
    setCanGoNext(!instance.isEnd);
  };

  if (!enabled || entries.length === 0) return null;

  return (
    <section className="soop-live" aria-labelledby="soop-live-title">
      <div className="soop-live__heading">
        <div>
          <p className="eyebrow">NOW STREAMING</p>
          <h2 id="soop-live-title">
            FC26 카테고리 LIVE
            <span className="soop-live__live-dot" aria-hidden="true" />
          </h2>
        </div>
        <div className="soop-live__actions">
          <span
            className="soop-live__refresh-note"
            title={updatedAt ? `마지막 갱신: ${formatDateTime(updatedAt)}` : undefined}
          >
            <span className="sync-dot" aria-hidden="true" /> 1분마다 갱신
          </span>
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
        </div>
      </div>
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
            <SoopLiveCard entry={entry} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
