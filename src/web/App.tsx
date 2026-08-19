import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Copy, Info, LayoutGrid, List, Megaphone, Trophy, Volume2, VolumeX } from "lucide-react";
import { A11y, Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper/types";
import "swiper/css";
import type { DashboardSnapshot, OneVsOneApplicationView, PromotionPost, SoopProfileTag, StreamerActivityPost, StreamerRecord } from "../shared/model.js";
import { defaultSoopProfileUrl, soopChannelUrl } from "../shared/model.js";
import { DEFAULT_ONE_VS_ONE_CONFIG } from "../shared/one-vs-one-results.js";
import { buildPromotionTimeline, summarizePromotionTimeline } from "../shared/promotion-timeline.js";
import { normalizeCafeAlias } from "../shared/promotion.js";
import { recordExtractionStatus, winRatePercent } from "../shared/record-extraction.js";
import { buildTrophyAwards, DIVISION_ONE_EMOJI, trophyBadgesFor, type TrophyAwards } from "../shared/trophy.js";
import { divisionColor } from "../shared/division-theme.js";
import { loadSnapshot } from "./api.js";
import soopIcon from "./assets/soop_icon.svg";
import { DivisionHistogram } from "./DivisionHistogram";
import { MusicPlayer } from "./MusicPlayer";

const divisions = Array.from({ length: 10 }, (_, index) => index + 1);
const cafeIcon = "N";

type JandyVideo = { title: string; videoUrl: string; thumbnailUrl: string };

const jandyVideos: readonly JandyVideo[] = [
  { title: "FC 수비 강의.", videoUrl: "https://vod.sooplive.com/player/204537485", thumbnailUrl: "https://videoimg.sooplive.com/php/SnapshotLoad.php?rowKey=20260816_2F2AD58F_296407469_3_r" },
  { title: "잔디동 1:1 교육 영상 찍기.", videoUrl: "https://vod.sooplive.com/player/204439557", thumbnailUrl: "https://videoimg.sooplive.com/php/SnapshotLoad.php?rowKey=20260816_0FF1613F_296390051_1_r&column=2&t=1786866474" },
  { title: "잔디동 평가기준 교본 : 볼키핑.", videoUrl: "https://vod.sooplive.com/player/204350261", thumbnailUrl: "https://videoimg.sooplive.com/php/SnapshotLoad.php?rowKey=20260814_8CA6E131_296355533_3_r&column=2&t=1786799539" },
  { title: "후열 잔디 분석 (잔디동용)", videoUrl: "https://vod.sooplive.com/player/204162403", thumbnailUrl: "https://videoimg.sooplive.com/php/SnapshotLoad.php?rowKey=20260812_527B7F61_296306761_3_r&column=2&t=1786641746" },
  { title: "5동아리 잔디 동아리 공개", videoUrl: "https://vod.sooplive.com/player/204070471", thumbnailUrl: "https://videoimg.sooplive.com/php/SnapshotLoad.php?rowKey=20260811_27F806A7_296281607_1_r&column=2&t=1786569806" },
];

const koreaDateKey = (value: Date) => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
}).format(value);

type Announcement = { id: string; body: ReactNode; note?: string };

const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "2026-08-ai-record-extraction",
    body: <><strong>AI</strong>가 승격 보고 게시물의 이미지를 분석해서 <strong>전체 전적을 추출</strong>하는 기능을 구현했습니다.<br />스트리머분들께서는 전체 전적이 포함된 게임 화면을 캡쳐해서 첨부하기를 추천드립니다.</>,
    note: "자동 추출되지 않는 데이터는 별도 수동 업데이트됩니다.",
  },
  {
    id: "2026-08-card-view",
    body: <><strong>카드 뷰</strong>가 추가되었습니다. <span className="announcement-icon-badge"><LayoutGrid aria-hidden="true" /></span> 버튼을 클릭하면 카드 뷰로 전환할 수 있고,<br />디비전순 / 승률순으로 정렬할 수 있습니다.</>,
  },
  {
    id: "2026-08-trophy",
    body: <><strong>업적</strong> 기능이 추가되었습니다. 상단바 오른쪽 <span className="announcement-icon-badge announcement-icon-badge--trophy"><Trophy aria-hidden="true" /></span> 버튼을 누르면 각 카테고리별 업적을 확인할 수 있습니다.</>,
  },
];

const SEEN_ANNOUNCEMENTS_STORAGE_KEY = "fc26-seen-announcements";

function loadSeenAnnouncementIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_ANNOUNCEMENTS_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function markAnnouncementsSeen(ids: string[]) {
  try {
    const seen = loadSeenAnnouncementIds();
    ids.forEach((id) => seen.add(id));
    localStorage.setItem(SEEN_ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(Array.from(seen)));
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

const SEEN_UPDATES_STORAGE_KEY = "fc26-seen-updates";
const SFX_ENABLED_STORAGE_KEY = "fc26-sfx-enabled";
const SFX_VOLUME_STORAGE_KEY = "fc26-sfx-volume";
const SFX_HEARD_STORAGE_KEY = "fc26-sfx-heard";

function hasHeardSfx(): boolean {
  try {
    return localStorage.getItem(SFX_HEARD_STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

function markSfxHeard() {
  try {
    localStorage.setItem(SFX_HEARD_STORAGE_KEY, "1");
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

function loadSfxEnabled(): boolean {
  try {
    const raw = localStorage.getItem(SFX_ENABLED_STORAGE_KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

function loadSfxVolume(): number {
  try {
    const raw = localStorage.getItem(SFX_VOLUME_STORAGE_KEY);
    if (raw === null) return 100;
    const value = Number(raw);
    return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 100;
  } catch {
    return 100;
  }
}

let activeSfxAudio: HTMLAudioElement | undefined;

function playSfx(url: string, volume = 1) {
  stopSfx();
  const audio = new Audio(url);
  audio.volume = volume;
  activeSfxAudio = audio;
  audio.play().catch(() => {
    // ignore autoplay/decoding failures
  });
}

function stopSfx() {
  activeSfxAudio?.pause();
  activeSfxAudio = undefined;
}

const SFX_POPUP_CLOSE_DELAY_MS = 500;

function SfxToggle({ enabled, volume, onToggle, onVolumeChange }: { enabled: boolean; volume: number; onToggle: () => void; onVolumeChange: (value: number) => void }) {
  const [popupOpen, setPopupOpen] = useState(false);
  const closeTimeoutRef = useRef<number | undefined>(undefined);
  const cancelClose = () => {
    clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = undefined;
  };
  const openPopup = () => { cancelClose(); setPopupOpen(true); };
  const scheduleClose = () => {
    cancelClose();
    closeTimeoutRef.current = window.setTimeout(() => setPopupOpen(false), SFX_POPUP_CLOSE_DELAY_MS);
  };
  useEffect(() => cancelClose, []);
  const displayValue = enabled ? volume : 0;
  return <div className={`sfx-control ${popupOpen ? "sfx-control--open" : ""}`} onMouseEnter={openPopup} onMouseLeave={scheduleClose} onFocus={openPopup} onBlur={scheduleClose}>
    <div className="sfx-control__popup">
      <div className="sfx-control__slider-track">
        <input type="range" className="sfx-control__slider" min={0} max={100} value={displayValue} onChange={(event) => onVolumeChange(Number(event.target.value))} aria-label="효과음 볼륨" style={{ "--volume-fill": `${displayValue}%` } as React.CSSProperties} />
      </div>
      <span className="sfx-control__value">{displayValue}</span>
    </div>
    <button type="button" className="sfx-toggle" onClick={onToggle} aria-pressed={enabled} aria-label={enabled ? "효과음 끄기" : "효과음 켜기"}>
      {enabled ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
      <span>효과음 {enabled ? "ON" : "OFF"}</span>
    </button>
  </div>;
}

function SfxIntroNotice({ onDismiss, onAcknowledge }: { onDismiss: () => void; onAcknowledge: () => void }) {
  return <aside className="sfx-intro" role="status">
    <button type="button" className="sfx-intro__close" onClick={() => { onAcknowledge(); onDismiss(); }} aria-label="안내 닫기">×</button>
    <p className="sfx-intro__title">놀라셨나요?</p>
    <img className="sfx-intro__image" src="/suprised.webp" alt="" width={400} height={687} />
    <p className="sfx-intro__body">효과음 볼륨은 화면 우측 하단 플로팅 버튼 영역에서 조절할 수 있습니다.<br />프로필 사진에 <Volume2 className="sfx-intro__icon" aria-hidden="true" /> 아이콘이 있는 스트리머는 상세 팝업이 열릴 때 효과음이 재생됩니다.</p>
  </aside>;
}

function isUpdatedToday(streamer: StreamerRecord, todayKey: string) {
  return Boolean(streamer.lastPost && koreaDateKey(new Date(streamer.lastPost.publishedAt)) === todayKey);
}

function seenKeyFor(streamer: StreamerRecord) {
  return `${streamer.id}:${streamer.lastPost?.articleId}`;
}

function loadSeenKeys(todayKey: string): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_UPDATES_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as { date: string; keys: string[] };
    return parsed.date === todayKey ? new Set(parsed.keys) : new Set();
  } catch {
    return new Set();
  }
}

function useSeenUpdates() {
  const todayKey = koreaDateKey(new Date());
  const [seenKeys, setSeenKeys] = useState(() => loadSeenKeys(todayKey));
  const markSeen = (key: string) => {
    setSeenKeys((current) => {
      if (current.has(key)) return current;
      const next = new Set(current).add(key);
      try {
        localStorage.setItem(SEEN_UPDATES_STORAGE_KEY, JSON.stringify({ date: todayKey, keys: Array.from(next) }));
      } catch {
        // ignore storage failures (e.g. private browsing)
      }
      return next;
    });
  };
  return { seenKeys, markSeen, todayKey };
}

function formatDateTime(value?: string) {
  if (!value) return "보고 없음";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Seoul" }).format(new Date(value));
}

function formatCafePostDate(value?: string) {
  if (!value) return "보고 없음";
  const date = new Date(value);
  if (koreaDateKey(date) === koreaDateKey(new Date())) {
    return new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" }).format(date);
  }
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Seoul" }).format(date);
}

function formatBoardPostDate(value?: string) {
  if (!value) return "보고 없음";
  const date = new Date(value);
  const dateKey = koreaDateKey(date);
  const today = new Date();
  if (dateKey === koreaDateKey(today)) {
    return `오늘 ${new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" }).format(date)}`;
  }
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKey === koreaDateKey(yesterday)) return "어제";
  return formatCafePostDate(value);
}

function formatTimelineDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", timeZone: "Asia/Seoul" }).format(new Date(`${value}T00:00:00+09:00`));
}

function formatTimelineTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Seoul" }).format(new Date(value));
}

function formatDuration(milliseconds: number) {
  const minutes = Math.round(milliseconds / 60_000);
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return restMinutes ? `${hours}시간 ${restMinutes}분` : `${hours}시간`;
}

const tagStyle: Record<SoopProfileTag, string> = { "파트너": "partner", "베스트": "best", "루키존": "rookie", "스포츠": "sports", "서포터즈": "supporters" };

function SoopTags({ tags }: { tags?: SoopProfileTag[] }) {
  if (!tags?.length) return null;
  return <span className="soop-tags" aria-label={`SOOP 등급: ${tags.join(", ")}`}>{tags.map((tag) => <span className={`soop-tag soop-tag--${tagStyle[tag]}`} key={tag}>{tag}</span>)}</span>;
}

function Avatar({ profileImageUrl, soopId, displayName }: Pick<StreamerRecord, "profileImageUrl" | "soopId" | "displayName">) {
  const [failed, setFailed] = useState(false);
  const src = profileImageUrl ?? defaultSoopProfileUrl(soopId);
  return src && !failed
    ? <img className="avatar" src={src} alt="" onError={() => setFailed(true)} />
    : <span className="avatar avatar-fallback" aria-hidden="true">{displayName.slice(0, 1)}</span>;
}

function JandyVideoCard({ video }: { video: JandyVideo }) {
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  return <a className="jandy-video" href={video.videoUrl} target="_blank" rel="noreferrer" aria-label={`${video.title} 영상 새 탭에서 보기`}>
    <span className={`jandy-video__thumbnail ${thumbnailFailed ? "jandy-video__thumbnail--fallback" : ""}`}>
      {thumbnailFailed
        ? <span className="jandy-video__fallback"><b>▶</b><small>VOD</small></span>
        : <img src={video.thumbnailUrl} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setThumbnailFailed(true)} />}
      <span className="jandy-video__play" aria-hidden="true">▶</span>
    </span>
    <span className="jandy-video__copy"><strong>{video.title}</strong></span>
  </a>;
}

function JandyVideoSection() {
  const swiper = useRef<SwiperInstance | null>(null);
  const [canGoPrev, setCanGoPrev] = useState(false);
  const [canGoNext, setCanGoNext] = useState(true);
  const syncNavigation = (instance: SwiperInstance) => {
    setCanGoPrev(!instance.isBeginning);
    setCanGoNext(!instance.isEnd);
  };
  return <section className="jandy-videos" aria-labelledby="jandy-videos-title">
    <div className="jandy-videos__heading"><div><p className="eyebrow">WATCH &amp; LEARN</p><h2 id="jandy-videos-title">잔디동 참고 영상</h2></div><div className="jandy-videos__actions"><span>우왁굳 VOD</span><div className="jandy-videos__navigation" aria-label="참고 영상 넘기기"><button type="button" onClick={() => swiper.current?.slidePrev()} aria-label="이전 참고 영상" disabled={!canGoPrev}><ChevronLeft aria-hidden="true" /></button><button type="button" onClick={() => swiper.current?.slideNext()} aria-label="다음 참고 영상" disabled={!canGoNext}><ChevronRight aria-hidden="true" /></button></div></div></div>
    <Swiper className="jandy-videos__swiper" modules={[A11y]} onSwiper={(instance) => { swiper.current = instance; syncNavigation(instance); }} onSlideChange={syncNavigation} onResize={syncNavigation} watchOverflow spaceBetween={10} slidesPerView={1.1} breakpoints={{ 481: { slidesPerView: 2.15 }, 760: { slidesPerView: 3.15 }, 1100: { slidesPerView: 4 } }} a11y={{ prevSlideMessage: "이전 참고 영상", nextSlideMessage: "다음 참고 영상" }}>
      {jandyVideos.map((video) => <SwiperSlide key={video.videoUrl}><JandyVideoCard video={video} /></SwiperSlide>)}
    </Swiper>
  </section>;
}

const DEFAULT_CELEBRATION_MESSAGE = "축 왁굳형 즐겨찾기 목록 입성";

type CelebrationSlide = { key: string; message: string };

function FavoriteCelebrationRow({ message }: { message: string }) {
  return <span className="favorite-celebration__row">
    <span className="favorite-celebration__icon" aria-hidden="true">🎉</span>
    <strong>{message}</strong>
    <span className="favorite-celebration__icon" aria-hidden="true">🎺</span>
  </span>;
}

function FavoriteCelebration({ slides }: { slides: CelebrationSlide[] }) {
  const label = slides.map((slide) => slide.message).join(" · ");
  return <aside className="favorite-celebration" role="note" aria-label={label}>
    <span className="favorite-celebration__spark favorite-celebration__spark--left" aria-hidden="true">✦</span>
    <div className="favorite-celebration__viewport">
      {slides.length > 1
        ? <Swiper className="favorite-celebration__swiper" modules={[Autoplay]} direction="vertical" loop allowTouchMove={false} speed={600} autoplay={{ delay: 3400, disableOnInteraction: false }}>
            {slides.map((slide) => <SwiperSlide key={slide.key}><FavoriteCelebrationRow message={slide.message} /></SwiperSlide>)}
          </Swiper>
        : <FavoriteCelebrationRow message={slides[0]?.message ?? DEFAULT_CELEBRATION_MESSAGE} />}
    </div>
    <span className="favorite-celebration__spark favorite-celebration__spark--right" aria-hidden="true">✦</span>
  </aside>;
}

function AchievementBadges({ streamer, awards }: { streamer: StreamerRecord; awards: TrophyAwards }) {
  const badges = trophyBadgesFor(streamer, awards);
  if (!badges.length) return null;
  return <span className="achievement-badges" aria-label={`${streamer.displayName} 업적`}>{badges.map((badge) => <span className="achievement-badge" role="img" title={badge.name} key={badge.key} aria-label={badge.name}><span aria-hidden="true">{badge.emoji}</span><span role="tooltip">{badge.name}</span></span>)}</span>;
}

function RecordBadge({ streamer, className = "" }: { streamer: Pick<StreamerRecord, "record" | "lastPost">; className?: string }) {
  if (streamer.record) {
    const r = streamer.record;
    return <span className={`record-badge ${className}`}><b className="record-badge__w">{r.wins}</b>/<b className="record-badge__d">{r.draws}</b>/<b className="record-badge__l">{r.losses}</b></span>;
  }
  if (!streamer.lastPost) return <span className={`record-badge record-badge--empty ${className}`}>-/-/-</span>;
  const status = recordExtractionStatus(streamer.lastPost);
  return status === "pending"
    ? <span className={`record-badge record-badge--pending ${className}`}>집계중</span>
    : <span className={`record-badge record-badge--empty ${className}`}>-/-/-</span>;
}

function StreamerCard({ streamer, awards, isNew, onOpen }: { streamer: StreamerRecord; awards: TrophyAwards; isNew: boolean; onOpen: () => void }) {
  return <button className={`streamer-card ${isNew ? "streamer-card--new" : ""}`} onClick={onOpen} aria-label={`${streamer.displayName} 상세 보기${isNew ? " (오늘 업데이트됨)" : ""}`}>
    <span className="streamer-card__avatar"><Avatar {...streamer} />{streamer.sfx && <Volume2 className="streamer-card__sfx-badge" aria-hidden="true" />}</span>
    <span className="streamer-card__copy"><span className="streamer-card__name"><strong>{streamer.displayName}</strong><AchievementBadges streamer={streamer} awards={awards} /></span><SoopTags tags={streamer.soopTags} /><RecordBadge streamer={streamer} /><small>{streamer.lastPost ? formatBoardPostDate(streamer.lastPost.publishedAt) : "첫 보고 대기"}</small></span>
    <span className="streamer-card__rank" style={{ "--division-color": divisionColor(streamer.currentDivision) } as React.CSSProperties}>D{streamer.currentDivision}</span>
    {!streamer.isMapped && <span className="unmapped" title="SOOP 정보 미연결">카페</span>}
    {isNew && <span className="streamer-card__new-badge">NEW</span>}
  </button>;
}

function mixHex(hex: string, target: "white" | "black", amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  const t = target === "white" ? 255 : 0;
  const blend = (c: number) => Math.round(c + (t - c) * amount).toString(16).padStart(2, "0");
  return `#${blend(r)}${blend(g)}${blend(b)}`;
}

const FIFA_SHIELD_OUTER = "M 150,6 C 215,6 270,14 286,28 C 295,36 298,46 298,60 L 298,350 C 298,370 278,400 150,444 C 22,400 2,370 2,350 L 2,60 C 2,46 5,36 14,28 C 30,14 85,6 150,6 Z";
const FIFA_SHIELD_INNER = "M 150,14 C 210,14 262,21 278,33 C 285,39 288,48 288,60 L 288,346 C 288,363 269,391 150,432 C 31,391 12,363 12,346 L 12,60 C 12,48 15,39 22,33 C 38,21 90,14 150,14 Z";

function FifaShield({ color }: { color: string }) {
  const uid = useId();
  const gradientId = `${uid}-grad`;
  return <svg className="fifa-card__shield" viewBox="0 0 300 450" aria-hidden="true">
    <defs>
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.55 }} />
        <stop offset="45%" style={{ stopColor: mixHex(color, "black", 0.5), stopOpacity: 0.4 }} />
        <stop offset="100%" style={{ stopColor: "#06100c", stopOpacity: 0.94 }} />
      </linearGradient>
    </defs>
    <path d={FIFA_SHIELD_OUTER} fill={`url(#${gradientId})`} stroke={mixHex(color, "black", 0.35)} strokeWidth={3} />
    <path d={FIFA_SHIELD_INNER} fill="none" stroke="rgba(255, 255, 255, 0.35)" strokeWidth={2} />
  </svg>;
}

function hexToRgba(hex: string, alpha: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function StreamerFifaCard({ streamer, awards, onOpen }: { streamer: StreamerRecord; awards: TrophyAwards; onOpen: () => void }) {
  const rate = streamer.record ? winRatePercent(streamer.record) : undefined;
  const color = divisionColor(streamer.currentDivision);
  return <button className="fifa-card" onClick={onOpen} aria-label={`${streamer.displayName} 상세 보기`}>
    <FifaShield color={color} />
    <span className="fifa-card__division">D{streamer.currentDivision}</span>
    <AchievementBadges streamer={streamer} awards={awards} />
    <span className="fifa-card__body">
      <span className="fifa-card__avatar" style={{ "--avatar-border": mixHex(color, "black", 0.45) } as React.CSSProperties}><Avatar {...streamer} />{streamer.sfx && <Volume2 className="fifa-card__sfx-badge" aria-hidden="true" />}</span>
      <span className="fifa-card__name" style={{ background: `linear-gradient(180deg, ${hexToRgba(color, 0.12)}, ${hexToRgba(color, 0.05)})` }}>
        <strong>{streamer.displayName}</strong>
      </span>
      <span className="fifa-card__stats">
        <span className="fifa-card__stat"><RecordBadge streamer={streamer} /></span>
        <span className="fifa-card__stat"><span className="fifa-card__stat-label">승률</span><b className="fifa-card__stat-value">{rate !== undefined ? `${rate.toFixed(1)}%` : "-"}</b></span>
        <span className="fifa-card__stat"><span className="fifa-card__stat-label">최근 승급일</span><b className="fifa-card__stat-value">{streamer.lastPost ? formatBoardPostDate(streamer.lastPost.publishedAt) : "첫 보고 대기"}</b></span>
      </span>
    </span>
    {!streamer.isMapped && <span className="unmapped" title="SOOP 정보 미연결">카페</span>}
  </button>;
}

function CardBoard({ streamers, awards, onOpen }: { streamers: StreamerRecord[]; awards: TrophyAwards; onOpen: (streamer: StreamerRecord) => void }) {
  return <section className="card-board" aria-label="스트리머 카드 보기">
    {streamers.map((streamer) => <StreamerFifaCard key={streamer.id} streamer={streamer} awards={awards} onOpen={() => onOpen(streamer)} />)}
    {streamers.length === 0 && <p className="empty-list">표시할 스트리머가 없습니다.</p>}
  </section>;
}

function StreamerActivitySection({ title, posts }: { title: string; posts?: StreamerActivityPost[] }) {
  return <section className="streamer-activity">
    <div className="streamer-activity__heading"><span>{title}</span><b>{posts?.length ?? 0}</b></div>
    {posts?.length ? <div className="streamer-activity__posts">{posts.map((post) => <a href={post.articleUrl} target="_blank" rel="noreferrer" key={`${post.board}:${post.articleId}`}>
      <strong>{post.title}</strong><time>{formatCafePostDate(post.publishedAt)}</time>
    </a>)}</div> : <p>등록된 게시글 없음</p>}
  </section>;
}

function PromotionTimeline({ posts }: { posts: PromotionPost[] }) {
  const events = buildPromotionTimeline(posts);
  const summary = summarizePromotionTimeline(events);
  if (!summary) return null;
  const groups = events.reduce<{ dateKey: string; events: typeof events }[]>((items, event) => {
    const group = items.at(-1);
    if (group?.dateKey === event.dateKey) group.events.push(event);
    else items.push({ dateKey: event.dateKey, events: [event] });
    return items;
  }, []);
  let index = 0;
  return <section className="promotion-timeline" aria-labelledby="promotion-timeline-title">
    <div className="promotion-timeline__heading"><div><p className="eyebrow">PROMOTION JOURNEY</p><h3 id="promotion-timeline-title">승급 여정</h3></div></div>
    <div className="promotion-timeline__stats" aria-label="승급 여정 요약"><span><b>{summary.promotionCount}</b>회 실제 승급</span>{events.length > 1 ? <span><b>{summary.exactDurationMs !== undefined ? formatDuration(summary.exactDurationMs) : `${summary.calendarDays}일`}</b> {summary.exactDurationMs !== undefined ? "소요" : "확인된 기간"}</span> : <span>첫 승급 보고</span>}</div>
    <div className="promotion-timeline__track"><div className="promotion-timeline__rail">
      {groups.map((group) => <div className="promotion-timeline__day" key={group.dateKey}>
        <p>{formatTimelineDate(group.dateKey)}</p>
        <div className="promotion-timeline__events">
          {group.events.map((event, eventIndex) => {
            const previous = group.events[eventIndex - 1];
            const interval = previous?.precision === "time" && event.precision === "time"
              ? Date.parse(event.post.publishedAt) - Date.parse(previous.post.publishedAt)
              : undefined;
            const delay = index++ * 85;
            return <div className="promotion-timeline__event" key={event.post.articleId}>
              {interval !== undefined && interval >= 0 && <span className="promotion-timeline__interval">{formatDuration(interval)} 후</span>}
              <a className="promotion-timeline__node" href={event.post.articleUrl} target="_blank" rel="noreferrer" style={{ animationDelay: `${delay}ms` }} aria-label={`${event.post.division}부 승격 게시글 보기`}><b>D{event.post.division}</b><span className={`promotion-timeline__time ${event.precision === "time" ? "" : "promotion-timeline__time--placeholder"}`} aria-hidden={event.precision !== "time"}>{event.precision === "time" ? formatTimelineTime(event.post.publishedAt) : "00:00"}</span></a>
            </div>;
          })}
        </div>
      </div>)}
    </div></div>
    <p className="promotion-timeline__notice">일부 과거 게시글은 카페 제공 정보상 날짜만 표시됩니다.</p>
  </section>;
}

function PreviousPromotionSection({ posts }: { posts?: PromotionPost[] }) {
  const [isOpen, setIsOpen] = useState(false);
  if (!posts?.length) return null;
  return <section className="streamer-activity promotion-history">
    <button className="streamer-activity__heading promotion-history__toggle" type="button" onClick={() => setIsOpen((current) => !current)} aria-expanded={isOpen}>
      <span>이전 승격 게시글</span><span className="promotion-history__meta"><b>{posts.length}</b><span className="promotion-history__icon" aria-hidden="true">{isOpen ? <ChevronUp /> : <ChevronDown />}</span></span>
    </button>
    {isOpen && <div className="streamer-activity__posts">{posts.map((post) => <a href={post.articleUrl} target="_blank" rel="noreferrer" key={post.articleId}>
      <span className="promotion-history__category">{post.category}</span><strong>{post.title}</strong><time>{formatCafePostDate(post.publishedAt)}</time>
    </a>)}</div>}
  </section>;
}

function DetailModal({ streamer, awards, onClose, latestPosts = [] }: { streamer: StreamerRecord; awards: TrophyAwards; onClose: () => void; latestPosts?: PromotionPost[] }) {
  // Combine promotionHistory with latestPosts to ensure we have all posts
  const historyPostIds = new Set((streamer.promotionHistory ?? []).map((p) => p.articleId));
  const normalizedAliases = new Set(streamer.cafeAliases.map(normalizeCafeAlias));
  const allPosts = [
    ...(streamer.promotionHistory ?? []),
    ...latestPosts.filter((p) => normalizedAliases.has(normalizeCafeAlias(p.cafeAuthor)) && !historyPostIds.has(p.articleId)),
  ];
  // Find current division post from allPosts
  const currentPost = allPosts.find((p) => p.division === streamer.currentDivision);
  // An operator override is pinning the division (roster.yaml override.policy !== "auto") and no collected
  // post actually reports that division yet — every known post is for a different (often stale) division.
  const manualOverrideNotice = !currentPost && streamer.overridePolicy !== "auto" && streamer.overrideDivision === streamer.currentDivision;
  const post = currentPost ?? (manualOverrideNotice ? undefined : (allPosts.length ? allPosts[allPosts.length - 1] : undefined));
  const promotionHistory = allPosts;
  const channel = soopChannelUrl(streamer.soopId);
  const [expandedImage, setExpandedImage] = useState<string>();
  useEscape(() => expandedImage ? setExpandedImage(undefined) : onClose());
  return <Modal onClose={onClose} label="디비전 상세" header={<div className="modal__identity"><Avatar {...streamer} /><div><span className="eyebrow">CURRENT DIVISION</span><h2>{streamer.displayName} <b style={{ "--division-color": divisionColor(streamer.currentDivision) } as React.CSSProperties}>{streamer.currentDivision}부</b> <AchievementBadges streamer={streamer} awards={awards} /></h2><SoopTags tags={streamer.soopTags} /><RecordBadge streamer={streamer} className="record-badge--lg" />{!streamer.isMapped && <p>카페 작성자 · SOOP 정보 미연결</p>}</div></div>}>
    {post
      ? <><div className="report"><span>{post.category}</span><h3>{post.title}</h3><time>{formatCafePostDate(post.publishedAt)}</time></div>{post.imageUrls.length > 0 && <div className="gallery">{post.imageUrls.map((url, index) => <button className="gallery__image" type="button" onClick={() => setExpandedImage(url)} aria-label={`${streamer.displayName} 게시글 이미지 확대`} key={url}><img src={url} alt={`${streamer.displayName} 게시글 이미지`} loading={index === 0 ? "eager" : "lazy"} referrerPolicy="no-referrer" /></button>)}</div>}<PromotionTimeline posts={promotionHistory} /></>
      : manualOverrideNotice
        ? <p className="empty-detail">카페에 {streamer.currentDivision}부 승격 게시글이 아직 올라오지 않아 운영자가 수동으로 업데이트한 디비전입니다.</p>
        : <p className="empty-detail">아직 확인된 디비전 보고 게시글이 없습니다.</p>}
    <PreviousPromotionSection posts={streamer.previousPromotionPosts} />
    <StreamerActivitySection title="잔디동 스코프" posts={streamer.scopePosts} />
    <StreamerActivitySection title="11대 11 플레이 영상" posts={streamer.elevenVsElevenPosts} />
    <div className="actions">{post && <CafeLink href={post.articleUrl} />}{channel && <SoopLink href={channel}>SOOP 방송국 ↗</SoopLink>}</div>
    {expandedImage && <div className="image-lightbox" role="dialog" aria-modal="true" aria-label="게시글 이미지 확대" onMouseDown={() => setExpandedImage(undefined)}><button className="close" type="button" onClick={() => setExpandedImage(undefined)} aria-label="확대 이미지 닫기">×</button><img src={expandedImage} alt={`${streamer.displayName} 게시글 이미지 확대`} referrerPolicy="no-referrer" onMouseDown={(event) => event.stopPropagation()} /></div>}
  </Modal>;
}

function CafeLink({ href, label = "왁물원 게시글" }: { href: string; label?: string }) { return <a className="action cafe" href={href} target="_blank" rel="noreferrer"><i>{cafeIcon}</i> {label}</a>; }
function SoopLink({ href, children }: { href: string; children: ReactNode }) { return <a className="action soop" href={href} target="_blank" rel="noreferrer"><img className="soop-icon" src={soopIcon} alt="" />{children}</a>; }

function AnnouncementModal({ announcements, onClose, onAcknowledge }: { announcements: Announcement[]; onClose: () => void; onAcknowledge: () => void }) {
  useEscape(onClose);
  return <div className="modal-backdrop announcement-backdrop" role="presentation">
    <section className="modal announcement-modal" role="dialog" aria-modal="true" aria-label="공지">
      <div className="modal__header"><div><p className="eyebrow">NOTICE</p><h2 className="announcement-modal__title"><Megaphone aria-hidden="true" /> 공지</h2></div><button className="close" onClick={onClose} aria-label="닫기">×</button></div>
      <div className="modal__body announcement-modal__body">
        {announcements.map((item, index) => <div className="announcement-item" key={item.id}>
          {index > 0 && <hr className="announcement-modal__divider" />}
          <p>{item.body}</p>
          {item.note && <small className="announcement-item__note">{item.note}</small>}
        </div>)}
      </div>
      <div className="announcement-modal__actions"><button type="button" className="announcement-modal__ack" onClick={onAcknowledge}>다시 보지 않기</button></div>
    </section>
  </div>;
}

function Modal({ children, header, onClose, label }: { children: ReactNode; header: ReactNode; onClose: () => void; label: string }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="modal" role="dialog" aria-modal="true" aria-label={label} onMouseDown={(event) => event.stopPropagation()}><div className="modal__header">{header}<button className="close" onClick={onClose} aria-label="닫기">×</button></div><div className="modal__body">{children}</div></section></div>;
}

function useEscape(onClose: () => void) { useEffect(() => { const close = (event: KeyboardEvent) => event.key === "Escape" && onClose(); addEventListener("keydown", close); return () => removeEventListener("keydown", close); }, [onClose]); }

function TrophyHelp({ children }: { children: ReactNode }) {
  return <span className="trophy-help"><button type="button" aria-label="계산 기준 보기"><Info aria-hidden="true" /></button><span role="tooltip">{children}</span></span>;
}

function TrophyWinner({ streamer, medal }: { streamer: StreamerRecord; medal?: string }) {
  return <div className="trophy-winner">{medal && <span className="trophy-winner__medal" aria-hidden="true">{medal}</span>}<Avatar {...streamer} /><div><strong>{streamer.displayName}</strong><SoopTags tags={streamer.soopTags} /></div></div>;
}

function TrophyModal({ awards, onClose }: { awards: TrophyAwards; onClose: () => void }) {
  useEscape(onClose);
  return <Modal onClose={onClose} label="업적" header={<div><p className="eyebrow">HALL OF FAME</p><h2 className="trophy-modal__title"><Trophy aria-hidden="true" /> 업적</h2><p className="trophy-modal__intro">이제야 이쪽을 봐주는구나</p></div>}>
    <div className="trophy-awards">
      <section className="trophy-award trophy-award--summit">
        <div className="trophy-award__heading"><span className="trophy-award__icon" aria-hidden="true">🏆</span><div><h3>1부 리그 달성 <TrophyHelp>가장 먼저 1부 리그를 달성한 상위 스트리머 3명을 표시합니다. 1부 리거 달성 게시글이 게시된 순서를 기준으로 하며, 이후 디비전이 바뀌어도 최초 달성 기록은 유지됩니다.</TrophyHelp></h3><p>가장 먼저 1부 리그를 달성한 스트리머들</p></div></div>
        {awards.divisionOne.length ? <div className="trophy-award__winners">{awards.divisionOne.map((award) => <article className="trophy-record" key={award.streamer.id}><TrophyWinner streamer={award.streamer} medal={DIVISION_ONE_EMOJI[award.rank]} /><div className="trophy-record__metric"><span>{formatCafePostDate(award.reachedAt)} 달성</span><strong>현재 {award.streamer.currentDivision}부</strong></div></article>)}</div> : <p className="trophy-award__empty">아직 1부 리그를 달성한 스트리머가 없습니다.</p>}
      </section>
      <section className="trophy-award trophy-award--matches">
        <div className="trophy-award__heading"><span className="trophy-award__icon" aria-hidden="true">⚔️</span><div><h3>최다 경기 출전 <TrophyHelp>커리어 전적(승+무+패)을 합산해 가장 많은 경기를 치른 스트리머를 표시합니다. 동률자는 함께 표시합니다.</TrophyHelp></h3><p>가장 많은 경기를 치른 스트리머</p></div></div>
        {awards.mostMatches.length ? <div className="trophy-award__winners">{awards.mostMatches.map((award) => <article className="trophy-record" key={award.streamer.id}><TrophyWinner streamer={award.streamer} /><div className="trophy-record__metric"><strong>총 {award.totalGames}경기</strong><span>{award.streamer.record?.wins}승 {award.streamer.record?.draws}무 {award.streamer.record?.losses}패</span></div></article>)}</div> : <p className="trophy-award__empty">아직 집계된 전적이 없습니다.</p>}
      </section>
      <section className="trophy-award trophy-award--winrate">
        <div className="trophy-award__heading"><span className="trophy-award__icon" aria-hidden="true">👑</span><div><h3>최고 승률 <TrophyHelp>커리어 전적(승+무+패)이 1경기 이상인 스트리머 중 승률이 가장 높은 스트리머를 표시합니다. 동률자는 함께 표시합니다.</TrophyHelp></h3><p>가장 높은 승률을 기록한 스트리머</p></div></div>
        {awards.bestWinRate.length ? <div className="trophy-award__winners">{awards.bestWinRate.map((award) => <article className="trophy-record" key={award.streamer.id}><TrophyWinner streamer={award.streamer} /><div className="trophy-record__metric"><strong>승률 {award.winRate.toFixed(1)}%</strong><span>{award.streamer.record?.wins}승 {award.streamer.record?.draws}무 {award.streamer.record?.losses}패</span></div></article>)}</div> : <p className="trophy-award__empty">아직 집계된 전적이 없습니다.</p>}
      </section>
      <section className="trophy-award trophy-award--growth">
        <div className="trophy-award__heading"><span className="trophy-award__icon" aria-hidden="true">🚀</span><div><h3>하루 급성장 <TrophyHelp>전체 수집 기간에서 한국 시간 하루 동안 첫 승격글의 직전 부수부터 마지막 승격글까지 계산합니다. 중간 승격글이 없어도 최종 부수까지 반영하며, 한 건만 있어도 1단계로 계산합니다.</TrophyHelp></h3><p>하루에 가장 많이 올라간 역대 기록</p></div></div>
        {awards.dailyPromotion.length ? <div className="trophy-award__winners">{awards.dailyPromotion.map((award) => <article className="trophy-record" key={`${award.streamer.id}-${award.dateKey}`}><TrophyWinner streamer={award.streamer} /><div className="trophy-record__metric"><span>{formatTimelineDate(award.dateKey)}</span><strong>{award.startDivision}부 → {award.endDivision}부</strong><b>▲ {award.steps}</b></div></article>)}</div> : <p className="trophy-award__empty">아직 기록된 승격 업적이 없습니다.</p>}
      </section>
      <section className="trophy-award trophy-award--promotion">
        <div className="trophy-award__heading"><span className="trophy-award__icon" aria-hidden="true">📣</span><div><h3>자기 PR 왕 <TrophyHelp>잔디동 스코프의 ‘내가 직접 홍보’ 글과 11대11 플레이 영상 게시글 수를 합산합니다. 동률자는 함께 표시합니다.</TrophyHelp></h3><p>가장 활발하게 자신을 알린 주인공</p></div></div>
        {awards.selfPromotion.length ? <div className="trophy-award__winners">{awards.selfPromotion.map((award) => <article className="trophy-record" key={award.streamer.id}><TrophyWinner streamer={award.streamer} /><div className="trophy-record__metric"><strong>총 {award.totalCount}개 게시글</strong><span>스코프 {award.scopeCount} · 11대11 {award.elevenVsElevenCount}</span></div></article>)}</div> : <p className="trophy-award__empty">아직 집계된 자기 PR 게시글이 없습니다.</p>}
      </section>
    </div>
  </Modal>;
}

function EvaluationCard({ application, onOpen }: { application: OneVsOneApplicationView; onOpen: () => void }) {
  const result = application.result;
  return <article className={`evaluation-card ${result ? "evaluation-card--completed" : ""}`}>
    <button className="evaluation-card__main" onClick={onOpen} aria-label={`${application.displayName} 1대1 평가 상세 보기`}><Avatar {...application} /><span><strong>{application.displayName}</strong><SoopTags tags={application.soopTags} /><small>{application.cafeAuthor} · 신청 {formatCafePostDate(application.publishedAt)}</small></span><b className={`evaluation-status ${result ? "done" : "waiting"}`}>{result ? "대결 완료" : "대결 전"}</b></button>
    {result && <button className="evaluation-result" onClick={onOpen}><span>{result.candidateScore} : {result.woowakgoodScore}</span><strong>{result.verdict}</strong><small>{formatDateTime(result.playedAt)}</small></button>}
    <div className="evaluation-card__actions"><CafeLink href={application.articleUrl} label="신청글" /></div>
  </article>;
}

function EvaluationModal({ application, onClose }: { application: OneVsOneApplicationView; onClose: () => void }) {
  const opponent = DEFAULT_ONE_VS_ONE_CONFIG.opponent;
  const result = application.result;
  useEscape(onClose);
  return <Modal onClose={onClose} label="1대1 평가 상세" header={<div className="modal__identity"><Avatar {...application} /><div><span className="eyebrow">ONE VS ONE APPLICATION</span><h2>{application.displayName}</h2><SoopTags tags={application.soopTags} /><p>{application.cafeAuthor} · 신청 {formatCafePostDate(application.publishedAt)}</p></div></div>}>
    <div className="report"><span>{application.category}</span><h3>{application.title}</h3></div>
    {result ? <section className="scoreboard"><p className="eyebrow">MATCH RESULT</p><div className="scoreboard__players"><span>{application.displayName}</span><span>{opponent.displayName}<SoopTags tags={opponent.soopTags} /></span></div><strong>{result.candidateScore}<i>:</i>{result.woowakgoodScore}</strong><time>대결 일시 · {formatDateTime(result.playedAt)}</time><div className="verdict"><b>{result.verdict}</b><p>{result.detail}</p>{result.note && <small>{result.note}</small>}</div></section> : <p className="empty-detail">대결 결과가 아직 등록되지 않았습니다. 결과가 확정되면 이 카드에 공지 기준 판정이 표시됩니다.</p>}
    <div className="actions"><CafeLink href={application.articleUrl} label="신청글" />{application.soopId && <SoopLink href={soopChannelUrl(application.soopId)!}>방송국</SoopLink>}</div>
  </Modal>;
}

export function App() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>();
  const [view, setView] = useState<"division" | "evaluation">("division");
  const [query, setQuery] = useState("");
  const [activityOnly, setActivityOnly] = useState(false);
  const [sfxOnly, setSfxOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [sortMode, setSortMode] = useState<"division" | "winRate">("division");
  const [evaluationFilter, setEvaluationFilter] = useState<"all" | "pending" | "completed">("all");
  const [selected, setSelected] = useState<StreamerRecord>();
  const [selectedApplication, setSelectedApplication] = useState<OneVsOneApplicationView>();
  const [feedOpen, setFeedOpen] = useState(false);
  const [trophyOpen, setTrophyOpen] = useState(false);
  const [toast, setToast] = useState<string>();
  const toastTimeout = useRef<number | undefined>(undefined);
  const [sfxEnabled, setSfxEnabled] = useState(loadSfxEnabled);
  const [sfxVolume, setSfxVolume] = useState(loadSfxVolume);
  const [sfxIntroVisible, setSfxIntroVisible] = useState(false);
  const [pendingAnnouncements, setPendingAnnouncements] = useState<Announcement[]>([]);
  useEffect(() => {
    const seenIds = loadSeenAnnouncementIds();
    const unseen = ANNOUNCEMENTS.filter((announcement) => !seenIds.has(announcement.id));
    if (unseen.length) setPendingAnnouncements(unseen);
  }, []);
  const { seenKeys, markSeen, todayKey } = useSeenUpdates();
  const controlsSentinelRef = useRef<HTMLDivElement>(null);
  const [controlsStuck, setControlsStuck] = useState(false);
  useEffect(() => {
    const sentinel = controlsSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setControlsStuck(!entry.isIntersecting), { threshold: 0, rootMargin: "-1px 0px 0px 0px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);
  function persistSfxEnabled(next: boolean) {
    setSfxEnabled(next);
    try {
      localStorage.setItem(SFX_ENABLED_STORAGE_KEY, next ? "1" : "0");
    } catch {
      // ignore storage failures (e.g. private browsing)
    }
  }
  function toggleSfx() {
    persistSfxEnabled(!sfxEnabled);
  }
  function changeSfxVolume(value: number) {
    setSfxVolume(value);
    try {
      localStorage.setItem(SFX_VOLUME_STORAGE_KEY, String(value));
    } catch {
      // ignore storage failures (e.g. private browsing)
    }
    if (value === 0 && sfxEnabled) persistSfxEnabled(false);
    else if (value > 0 && !sfxEnabled) persistSfxEnabled(true);
  }
  useEffect(() => { loadSnapshot().then(setSnapshot).catch(() => undefined); }, []);
  useEffect(() => () => clearTimeout(toastTimeout.current), []);
  function showToast(message: string) {
    setToast(message);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = window.setTimeout(() => setToast(undefined), 2200);
  }
  const streamers = useMemo(() => (snapshot?.streamers ?? []).filter((streamer) =>
    searchable(streamer.displayName, streamer.cafeAliases, query)
    && (!activityOnly || Boolean(streamer.scopePosts?.length || streamer.elevenVsElevenPosts?.length))
    && (!sfxOnly || Boolean(streamer.sfx))), [snapshot, query, activityOnly, sfxOnly]);
  const cardStreamers = useMemo(() => {
    if (sortMode === "division") return [...streamers].sort((a, b) => a.currentDivision - b.currentDivision);
    return [...streamers].sort((a, b) => {
      const wa = a.record ? winRatePercent(a.record) : undefined;
      const wb = b.record ? winRatePercent(b.record) : undefined;
      if (wa === undefined && wb === undefined) return 0;
      if (wa === undefined) return 1;
      if (wb === undefined) return -1;
      return wb - wa;
    });
  }, [streamers, sortMode]);
  async function handleCopyDivisionList() {
    try {
      await navigator.clipboard.writeText(buildDivisionListText(streamers));
      showToast("디비전 목록이 복사되었습니다");
    } catch {
      showToast("복사에 실패했습니다");
    }
  }
  const applications = useMemo(() => (snapshot?.oneVsOneApplications ?? []).filter((application) => searchable(application.displayName, application.cafeAliases, query) && (evaluationFilter === "all" || (evaluationFilter === "completed" ? Boolean(application.result) : !application.result))), [snapshot, query, evaluationFilter]);
  const latest = (snapshot?.latestPosts.length ? snapshot.latestPosts : streamers.flatMap((streamer) => streamer.lastPost ? [streamer.lastPost] : []).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)))
    .filter((post) => koreaDateKey(new Date(post.publishedAt)) === koreaDateKey(new Date()));
  const trophyAwards = useMemo(() => buildTrophyAwards(snapshot?.streamers ?? []), [snapshot]);
  const celebrationSlides = useMemo(() => {
    const postSlides = (snapshot?.streamers ?? []).flatMap((streamer) => {
      const normalizedAliases = new Set(streamer.cafeAliases.map(normalizeCafeAlias));
      const todaysPosts = latest.filter((post) => normalizedAliases.has(normalizeCafeAlias(post.cafeAuthor)));
      if (!todaysPosts.length) return [];
      // Lower division number = higher tier, so pick the best (minimum) division reached today.
      const bestPost = todaysPosts.reduce((best, post) => (post.division < best.division ? post : best));
      const division = bestPost.division;
      const message = streamer.celebrationMessage
        ? streamer.celebrationMessage.replace("{n}", String(division))
        : `${streamer.displayName}의 ${division}부 리그 승격을 축하합니다~!!`;
      return [{ key: bestPost.articleId, message, publishedAt: bestPost.publishedAt }];
    }).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    return [{ key: "default", message: DEFAULT_CELEBRATION_MESSAGE }, ...postSlides.map(({ key, message }) => ({ key, message })) ];
  }, [snapshot, latest]);
  function openStreamer(streamer: StreamerRecord) {
    if (streamer.lastPost) markSeen(seenKeyFor(streamer));
    if (sfxEnabled && streamer.sfx) { playSfx(streamer.sfx, sfxVolume / 100); if (!hasHeardSfx()) setSfxIntroVisible(true); }
    setSelected(streamer);
  }
  const isDivision = view === "division";
  return <main>
    <header className="topbar"><a className="brand" href="#top"><span className="brand-wak">WAK</span><span>JANDY</span><strong>동아리 후보 대시보드</strong></a><nav className="main-nav" aria-label="메인 메뉴"><button className={isDivision ? "active" : ""} onClick={() => setView("division")}>디비전 현황</button><button className={!isDivision ? "active" : ""} onClick={() => setView("evaluation")}>1:1 평가</button></nav><div className="topbar__actions"><button className="feed-toggle" onClick={() => setFeedOpen(true)}>최신 소식 <em>{latest.length}</em></button><button className="trophy-toggle" type="button" onClick={() => setTrophyOpen(true)} aria-label="업적 보기"><Trophy aria-hidden="true" /></button></div></header>
    <FavoriteCelebration slides={celebrationSlides} />
    <section className="hero" id="top"><div><p className="eyebrow">FC26 · {isDivision ? "SEASON DIVISION BOARD" : "ONE VS ONE EVALUATION"}</p><h1>{isDivision ? <>잰디 <mark>동아리 후보</mark><br />대시보드</> : <>1:1 <mark>평가 신청</mark><br />현황</>}</h1><p className="intro">{isDivision ? "왁물원에 보고된 FC26 디비전 승격 현황을 추적합니다." : "1대1 평가 신청 게시글과 대결 결과를 표시합니다."}</p></div><div className="sync"><span className="sync-dot" /> <b>3 MINUTE REFRESH</b><small><span className="refresh-icon" aria-hidden="true">↻</span> 3분마다 갱신 · {snapshot ? `${formatDateTime(snapshot.generatedAt)} 기준` : "데이터 연결 중"}</small></div></section>
    <JandyVideoSection />
    <div ref={controlsSentinelRef} className="controls-sentinel" aria-hidden="true" />
    <section className={`controls-bar ${controlsStuck ? "controls-bar--stuck" : ""}`} aria-label={isDivision ? "스트리머 검색" : "평가 신청 필터"}><div className="controls"><div className="controls__search"><label><span className="sr-only">검색</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름 또는 카페 닉네임 검색" /></label>{isDivision && <DivisionHistogram streamers={snapshot?.streamers ?? []} />}</div>{isDivision ? <div className="controls__actions"><div className="segmented"><button className={sfxOnly ? "active" : ""} onClick={() => setSfxOnly((current) => !current)} aria-pressed={sfxOnly}>효과음 있는 스트리머만</button></div><div className="segmented"><button className={activityOnly ? "active" : ""} onClick={() => setActivityOnly((current) => !current)} aria-pressed={activityOnly}>활동글 작성자만</button></div><button className="copy-list-button" type="button" onClick={handleCopyDivisionList}><Copy aria-hidden="true" /> 목록 복사</button></div> : <div className="segmented">{(["all", "pending", "completed"] as const).map((value) => <button key={value} className={evaluationFilter === value ? "active" : ""} onClick={() => setEvaluationFilter(value)}>{value === "all" ? "전체" : value === "pending" ? "대결 전" : "대결 완료"}</button>)}</div>}</div></section>
    {isDivision && <section className="view-toolbar" aria-label="보기 설정">
      {viewMode === "card" && <div className="segmented"><button className={sortMode === "division" ? "active" : ""} onClick={() => setSortMode("division")} aria-pressed={sortMode === "division"}>디비전순</button><button className={sortMode === "winRate" ? "active" : ""} onClick={() => setSortMode("winRate")} aria-pressed={sortMode === "winRate"}>승률순</button></div>}
      <div className="segmented"><button className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")} aria-pressed={viewMode === "list"} aria-label="목록 보기"><List aria-hidden="true" /></button><button className={viewMode === "card" ? "active" : ""} onClick={() => setViewMode("card")} aria-pressed={viewMode === "card"} aria-label="카드 보기"><LayoutGrid aria-hidden="true" /></button></div>
    </section>}
    {isDivision ? (viewMode === "list" ? <section className="board" aria-label="FC26 디비전 보드">{divisions.map((division) => { const entries = streamers.filter((streamer) => streamer.currentDivision === division); return <section className={`division division-${division}`} style={{ "--division-color": divisionColor(division) } as React.CSSProperties} key={division}><div className="division__label"><span>{division === 10 ? "SEASON" : "DIVISION"}</span><strong>{division}</strong>{division === 10 && <small>미참여</small>}</div><div className="division__players">{entries.map((streamer) => <StreamerCard key={streamer.id} streamer={streamer} awards={trophyAwards} isNew={isUpdatedToday(streamer, todayKey) && !seenKeys.has(seenKeyFor(streamer))} onOpen={() => openStreamer(streamer)} />)}{entries.length === 0 && <p className="vacant">{division === 10 ? "시즌 미참여 후보 없음" : "후보 대기 중"}</p>}</div></section>; })}</section> : <CardBoard streamers={cardStreamers} awards={trophyAwards} onOpen={openStreamer} />) : <section className="evaluation-list" aria-label="1대1 평가 신청 목록">{applications.map((application) => <EvaluationCard key={application.articleId} application={application} onOpen={() => setSelectedApplication(application)} />)}{applications.length === 0 && <p className="empty-list">표시할 1대1 평가 신청자가 없습니다.</p>}</section>}
    <footer>왁물원 카페 게시글 기반 · 마지막 동기화 {snapshot ? formatDateTime(snapshot.generatedAt) : "확인 중"}</footer>
    {selected && <DetailModal streamer={selected} awards={trophyAwards} onClose={() => { stopSfx(); setSelected(undefined); }} latestPosts={snapshot?.latestPosts} />}{selectedApplication && <EvaluationModal application={selectedApplication} onClose={() => setSelectedApplication(undefined)} />}{trophyOpen && <TrophyModal awards={trophyAwards} onClose={() => setTrophyOpen(false)} />}
    {feedOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setFeedOpen(false)}><aside className="feed" role="dialog" aria-modal="true" aria-label="최신 소식" onMouseDown={(event) => event.stopPropagation()}><button className="close" onClick={() => setFeedOpen(false)} aria-label="닫기">×</button><p className="eyebrow">TODAY'S REPORTS</p><h2>최신 소식</h2>{latest.length ? latest.slice(0, 25).map((post) => <a href={post.articleUrl} target="_blank" rel="noreferrer" key={post.articleId}><span>{post.category}</span><strong>{post.title}</strong><small>{post.cafeAuthor} · {formatCafePostDate(post.publishedAt)}</small></a>) : <p className="empty-list">오늘 등록된 디비전 보고가 없습니다.</p>}</aside></div>}
    <div className="floating-toolbar"><SfxToggle enabled={sfxEnabled} volume={sfxVolume} onToggle={toggleSfx} onVolumeChange={changeSfxVolume} /><MusicPlayer /></div>
    {sfxIntroVisible && <SfxIntroNotice onDismiss={() => setSfxIntroVisible(false)} onAcknowledge={markSfxHeard} />}
    {pendingAnnouncements.length > 0 && <AnnouncementModal announcements={pendingAnnouncements} onClose={() => setPendingAnnouncements([])} onAcknowledge={() => { markAnnouncementsSeen(pendingAnnouncements.map((announcement) => announcement.id)); setPendingAnnouncements([]); }} />}
    {toast && <div className="toast" role="status">{toast}</div>}
  </main>;
}

function searchable(displayName: string, aliases: string[], query: string) { return [displayName, ...aliases].join(" ").toLocaleLowerCase("ko-KR").includes(query.toLocaleLowerCase("ko-KR")); }

function buildDivisionListText(streamers: StreamerRecord[]) {
  return divisions.map((division) => {
    const label = division === 10 ? "10부(미보고)" : `${division}부`;
    const names = streamers.filter((streamer) => streamer.currentDivision === division).map((streamer) => streamer.displayName);
    return `- ${label}: ${names.length ? names.join(", ") : "-"}`;
  }).join("\n");
}
