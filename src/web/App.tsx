import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Copy,
  Download,
  Info,
  List,
  Megaphone,
  Minus,
  Plus,
  Shield,
  Trophy,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react";
import { A11y, Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper/types";
import "swiper/css";
import type {
  DashboardSnapshot,
  OneVsOneApplicationView,
  PromotionPost,
  StreamerActivityPost,
  StreamerRecord,
} from "../shared/model.js";
import { defaultSoopProfileUrl, soopChannelUrl } from "../shared/model.js";
import { DEFAULT_ONE_VS_ONE_CONFIG } from "../shared/one-vs-one-results.js";
import {
  buildPromotionTimeline,
  summarizePromotionTimeline,
} from "../shared/promotion-timeline.js";
import { normalizeCafeAlias } from "../shared/promotion.js";
import {
  recordExtractionStatus,
  winRatePercent,
} from "../shared/record-extraction.js";
import {
  buildTrophyAwards,
  DIVISION_ONE_EMOJI,
  trophyBadgesFor,
  type TrophyAwards,
} from "../shared/trophy.js";
import { divisionColor } from "../shared/division-theme.js";
import { loadSnapshot } from "./api.js";
import { downloadStreamersXlsx } from "./xlsx-export.js";
import soopIcon from "./assets/soop_icon.svg";
import geminiLogo from "./assets/gemini-logo.svg";
import { DivisionHistogram } from "./DivisionHistogram";
import { MusicPlayer } from "./MusicPlayer";

const divisions = Array.from({ length: 10 }, (_, index) => index + 1);
const cafeIcon = "N";

type JandyVideo = { title: string; videoUrl: string; thumbnailUrl: string };

const jandyVideos: readonly JandyVideo[] = [
  {
    title: "FC 수비 강의.",
    videoUrl: "https://vod.sooplive.com/player/204537485",
    thumbnailUrl:
      "https://videoimg.sooplive.com/php/SnapshotLoad.php?rowKey=20260816_2F2AD58F_296407469_3_r",
  },
  {
    title: "잔디동 1:1 교육 영상 찍기.",
    videoUrl: "https://vod.sooplive.com/player/204439557",
    thumbnailUrl:
      "https://videoimg.sooplive.com/php/SnapshotLoad.php?rowKey=20260816_0FF1613F_296390051_1_r&column=2&t=1786866474",
  },
  {
    title: "잔디동 평가기준 교본 : 볼키핑.",
    videoUrl: "https://vod.sooplive.com/player/204350261",
    thumbnailUrl:
      "https://videoimg.sooplive.com/php/SnapshotLoad.php?rowKey=20260814_8CA6E131_296355533_3_r&column=2&t=1786799539",
  },
  {
    title: "후열 잔디 분석 (잔디동용)",
    videoUrl: "https://vod.sooplive.com/player/204162403",
    thumbnailUrl:
      "https://videoimg.sooplive.com/php/SnapshotLoad.php?rowKey=20260812_527B7F61_296306761_3_r&column=2&t=1786641746",
  },
  {
    title: "5동아리 잔디 동아리 공개",
    videoUrl: "https://vod.sooplive.com/player/204070471",
    thumbnailUrl:
      "https://videoimg.sooplive.com/php/SnapshotLoad.php?rowKey=20260811_27F806A7_296281607_1_r&column=2&t=1786569806",
  },
];

type JandyChapter = { title: string; seconds: number };

type JandyChapterVideo = {
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  chapters: readonly JandyChapter[];
};

const jandyChapterVideos: readonly JandyChapterVideo[] = [
  {
    title: "버튜버 쥰내 패기",
    videoUrl: "https://vod.sooplive.com/player/204887231",
    thumbnailUrl: "/thumbnails/thumbnail_hit.webp",
    chapters: [
      { title: "양지랖편", seconds: 23529 },
      { title: "오슈이편", seconds: 29976 },
      { title: "빙밍편", seconds: 30924 },
    ],
  },
  {
    title: "FC 26 포지션별 교본 영상",
    videoUrl: "https://vod.sooplive.com/player/204798839",
    thumbnailUrl: "/thumbnails/thumbnail_soccer_book.webp",
    chapters: [
      { title: "도입", seconds: 29468 },
      { title: "센터백 교본", seconds: 29981 },
      { title: "풀백 교본", seconds: 30815 },
      { title: "수비 미드필더 교본 - 1", seconds: 31731 },
      { title: "수비 미드필더 교본 - 2", seconds: 36609 },
      { title: "중앙 미드필더 교본", seconds: 32674 },
      { title: "윙 포워드 교본", seconds: 33645 },
      { title: "스트라이커 교본 - 1", seconds: 34686 },
      { title: "스트라이커 교본 - 2", seconds: 35625 },
    ],
  },
];

const koreaDateKey = (value: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);

type Announcement = {
  id: string;
  date: string;
  body: ReactNode;
  note?: string;
};

const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "2026-08-gemini-review",
    date: "2026.08.20",
    body: (
      <>
        <span className="announcement-icon-badge announcement-icon-badge--gemini">
          <img src={geminiLogo} alt="" />
        </span>{" "}
        <strong>Gemini 한줄평</strong> 기능이 추가되었습니다. 왁물원에 승격 보고
        게시글이 올라오고 전체 전적 분석이 성공하면, 스트리머 상세 정보에서 AI가
        남긴 짧은 한줄평을 확인할 수 있습니다.
      </>
    ),
    note: "조건이 아직 충족되지 않았거나 분석 전/분석 중이면 이전 평가가 대신 표시됩니다.",
  },
  {
    id: "2026-08-ai-record-extraction",
    date: "2026.08.19",
    body: (
      <>
        <strong>AI</strong>가 승격 보고 게시물의 이미지를 분석해서{" "}
        <strong>전체 전적을 추출</strong>하는 기능을 구현했습니다.
        <br />
        스트리머분들께서는 전체 전적이 포함된 게임 화면을 캡쳐해서 첨부하기를
        부탁드립니다.
      </>
    ),
    note: "자동 추출되지 않는 데이터는 별도 수동 업데이트됩니다.",
  },
  {
    id: "2026-08-card-view",
    date: "2026.08.19",
    body: (
      <>
        <strong>카드 뷰</strong>가 추가되었습니다.{" "}
        <span className="announcement-card-view-btn">
          <Shield aria-hidden="true" />
          <span>카드뷰로 보기</span>
        </span>{" "}
        버튼을 클릭하면 카드 뷰로 전환할 수 있고,
        <br />
        디비전순 / 승률순으로 정렬할 수 있습니다.
      </>
    ),
  },
  {
    id: "2026-08-trophy",
    date: "2026.08.18",
    body: (
      <>
        <strong>업적</strong> 기능이 추가되었습니다. 상단바 오른쪽{" "}
        <span className="announcement-icon-badge announcement-icon-badge--trophy">
          <Trophy aria-hidden="true" />
        </span>{" "}
        버튼을 누르면 각 카테고리별 업적을 확인할 수 있습니다.
      </>
    ),
  },
];

const ANNOUNCEMENTS_SORTED = [...ANNOUNCEMENTS].sort((a, b) =>
  b.date.localeCompare(a.date),
);

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
    localStorage.setItem(
      SEEN_ANNOUNCEMENTS_STORAGE_KEY,
      JSON.stringify(Array.from(seen)),
    );
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

const SEEN_UPDATES_STORAGE_KEY = "fc26-seen-updates";
const SFX_ENABLED_STORAGE_KEY = "fc26-sfx-enabled";
const SFX_VOLUME_STORAGE_KEY = "fc26-sfx-volume";
const SFX_HEARD_STORAGE_KEY = "fc26-sfx-heard";
const CARD_VIEW_DISCOVERED_STORAGE_KEY = "fc26-card-view-discovered";
const VIEW_MODE_STORAGE_KEY = "fc26-view-mode";
const CARD_ZOOM_STORAGE_KEY = "fc26-card-zoom-level";
const CARD_ZOOM_MIN = 0;
const CARD_ZOOM_MAX = 4;
const CARD_ZOOM_DEFAULT = 1;

function loadViewMode(): "list" | "card" {
  try {
    return localStorage.getItem(VIEW_MODE_STORAGE_KEY) === "card"
      ? "card"
      : "list";
  } catch {
    return "list";
  }
}

function saveViewMode(mode: "list" | "card") {
  try {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

function loadCardZoomLevel(): number {
  try {
    const stored = localStorage.getItem(CARD_ZOOM_STORAGE_KEY);
    if (stored === null) return CARD_ZOOM_DEFAULT;
    const raw = Number(stored);
    if (!Number.isInteger(raw)) return CARD_ZOOM_DEFAULT;
    return Math.min(CARD_ZOOM_MAX, Math.max(CARD_ZOOM_MIN, raw));
  } catch {
    return CARD_ZOOM_DEFAULT;
  }
}

function saveCardZoomLevel(level: number) {
  try {
    localStorage.setItem(CARD_ZOOM_STORAGE_KEY, String(level));
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

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

function hasDiscoveredCardView(): boolean {
  try {
    return localStorage.getItem(CARD_VIEW_DISCOVERED_STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

function markCardViewDiscovered() {
  try {
    localStorage.setItem(CARD_VIEW_DISCOVERED_STORAGE_KEY, "1");
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

function SfxToggle({
  enabled,
  volume,
  onToggle,
  onVolumeChange,
  highlight = false,
}: {
  enabled: boolean;
  volume: number;
  onToggle: () => void;
  onVolumeChange: (value: number) => void;
  highlight?: boolean;
}) {
  const [popupOpen, setPopupOpen] = useState(false);
  const closeTimeoutRef = useRef<number | undefined>(undefined);
  const cancelClose = () => {
    clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = undefined;
  };
  const openPopup = () => {
    cancelClose();
    setPopupOpen(true);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimeoutRef.current = window.setTimeout(
      () => setPopupOpen(false),
      SFX_POPUP_CLOSE_DELAY_MS,
    );
  };
  useEffect(() => cancelClose, []);
  const displayValue = enabled ? volume : 0;
  const open = popupOpen || highlight;
  return (
    <div
      className={`sfx-control ${open ? "sfx-control--open" : ""} ${
        highlight ? "sfx-control--highlight" : ""
      }`}
      onMouseEnter={openPopup}
      onMouseLeave={scheduleClose}
      onFocus={openPopup}
      onBlur={scheduleClose}
    >
      <div className="sfx-control__popup">
        <div className="sfx-control__slider-track">
          <input
            type="range"
            className="sfx-control__slider"
            min={0}
            max={100}
            value={displayValue}
            onChange={(event) => onVolumeChange(Number(event.target.value))}
            aria-label="효과음 볼륨"
            style={
              { "--volume-fill": `${displayValue}%` } as React.CSSProperties
            }
          />
        </div>
        <span className="sfx-control__value">{displayValue}</span>
      </div>
      <button
        type="button"
        className="sfx-toggle"
        onClick={onToggle}
        aria-pressed={enabled}
        aria-label={enabled ? "효과음 끄기" : "효과음 켜기"}
      >
        {enabled ? (
          <Volume2 aria-hidden="true" />
        ) : (
          <VolumeX aria-hidden="true" />
        )}
        <span>효과음 {enabled ? "ON" : "OFF"}</span>
      </button>
    </div>
  );
}

function SfxIntroNotice({
  enabled,
  volume,
  onToggle,
  onVolumeChange,
  onDismiss,
  onAcknowledge,
}: {
  enabled: boolean;
  volume: number;
  onToggle: () => void;
  onVolumeChange: (value: number) => void;
  onDismiss: () => void;
  onAcknowledge: () => void;
}) {
  const displayValue = enabled ? volume : 0;
  return (
    <div className="sfx-intro-backdrop">
      <aside className="sfx-intro" role="status">
        <button
          type="button"
          className="sfx-intro__close"
          onClick={() => {
            onAcknowledge();
            onDismiss();
          }}
          aria-label="안내 닫기"
        >
          ×
        </button>
        <img
          className="sfx-intro__image"
          src="/suprised.webp"
          alt=""
          width={400}
          height={687}
        />
        <p className="sfx-intro__title">놀라셨나요?</p>
        <p className="sfx-intro__body">
          프로필 사진에{" "}
          <Volume2 className="sfx-intro__icon" aria-hidden="true" /> 아이콘이
          있는 스트리머는 상세 팝업이 열릴 때 효과음이 재생됩니다.
          <br />
          <br />
          효과음 볼륨은 <mark className="sfx-intro__highlight">
            바로 아래
          </mark>{" "}
          또는{" "}
          <mark className="sfx-intro__highlight">
            화면 오른쪽 아래 플로팅 영역
          </mark>
          에서 조절할 수 있습니다.
        </p>
        <div className="sfx-intro__volume">
          <button
            type="button"
            className="sfx-toggle"
            onClick={onToggle}
            aria-pressed={enabled}
            aria-label={enabled ? "효과음 끄기" : "효과음 켜기"}
          >
            {enabled ? (
              <Volume2 aria-hidden="true" />
            ) : (
              <VolumeX aria-hidden="true" />
            )}
          </button>
          <input
            type="range"
            className="sfx-intro__slider"
            min={0}
            max={100}
            value={displayValue}
            onChange={(event) => onVolumeChange(Number(event.target.value))}
            aria-label="효과음 볼륨"
            style={
              { "--volume-fill": `${displayValue}%` } as React.CSSProperties
            }
          />
          <span className="sfx-intro__volume-value">{displayValue}</span>
        </div>
      </aside>
    </div>
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;

function isUpdatedToday(streamer: StreamerRecord) {
  return Boolean(
    streamer.lastPost &&
    Date.now() - new Date(streamer.lastPost.publishedAt).getTime() < DAY_MS,
  );
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
        localStorage.setItem(
          SEEN_UPDATES_STORAGE_KEY,
          JSON.stringify({ date: todayKey, keys: Array.from(next) }),
        );
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
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

function formatCafePostDate(value?: string) {
  if (!value) return "보고 없음";
  const date = new Date(value);
  if (koreaDateKey(date) === koreaDateKey(new Date())) {
    return new Intl.DateTimeFormat("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Seoul",
    }).format(date);
  }
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(date);
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
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(new Date(`${value}T00:00:00+09:00`));
}

function formatTimelineTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

function formatDuration(milliseconds: number) {
  const minutes = Math.round(milliseconds / 60_000);
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return restMinutes ? `${hours}시간 ${restMinutes}분` : `${hours}시간`;
}

function Avatar({
  profileImageUrl,
  soopId,
  displayName,
}: Pick<StreamerRecord, "profileImageUrl" | "soopId" | "displayName">) {
  const [failed, setFailed] = useState(false);
  const src = profileImageUrl ?? defaultSoopProfileUrl(soopId);
  return src && !failed ? (
    <img className="avatar" src={src} alt="" onError={() => setFailed(true)} />
  ) : (
    <span className="avatar avatar-fallback" aria-hidden="true">
      {displayName.slice(0, 1)}
    </span>
  );
}

const FANCY_SPARK_SLOTS = [1, 2, 3, 4, 5, 6] as const;

function isStreamerFancy(streamer: Pick<StreamerRecord, "isFancy">): boolean {
  return !!streamer.isFancy;
}

function FancyAvatar({
  streamer,
  color = "#00e9ae",
  ring = true,
}: {
  streamer: StreamerRecord;
  color?: string;
  ring?: boolean;
}) {
  if (!isStreamerFancy(streamer)) return <Avatar {...streamer} />;
  return (
    <span
      className={`fancy-avatar ${ring ? "fancy-avatar--ring" : ""}`}
      style={
        {
          "--fancy-color": color,
          "--fancy-glow-soft": hexToRgba(color, 0.4),
          "--fancy-glow-strong": hexToRgba(color, 0.85),
        } as React.CSSProperties
      }
    >
      <Avatar {...streamer} />
      <span className="fancy-avatar__sparks" aria-hidden="true">
        {FANCY_SPARK_SLOTS.map((slot) => (
          <i
            className={`fancy-avatar__spark fancy-avatar__spark--${slot}`}
            key={slot}
          >
            ✦
          </i>
        ))}
      </span>
    </span>
  );
}

const FANCY_NAME_SPARK_SLOTS = [1, 2, 3] as const;

function FancyName({
  streamer,
  color = "#00e9ae",
  tag: Tag = "span",
  children,
}: {
  streamer: StreamerRecord;
  color?: string;
  tag?: "span" | "strong";
  children: ReactNode;
}) {
  if (!isStreamerFancy(streamer)) return <Tag>{children}</Tag>;
  return (
    <span
      className="fancy-name"
      style={
        {
          "--fancy-color": color,
          "--fancy-glow-soft": hexToRgba(color, 0.4),
          "--fancy-glow-strong": hexToRgba(color, 0.85),
        } as React.CSSProperties
      }
    >
      <Tag className="fancy-name__text">{children}</Tag>
      <span className="fancy-name__sparks" aria-hidden="true">
        {FANCY_NAME_SPARK_SLOTS.map((slot) => (
          <i
            className={`fancy-name__spark fancy-name__spark--${slot}`}
            key={slot}
          >
            ✦
          </i>
        ))}
      </span>
    </span>
  );
}

const FANCY_BURST_STARS = [
  { left: "6%", delay: "0s", duration: "1.5s", size: 13 },
  { left: "18%", delay: ".18s", duration: "1.8s", size: 9 },
  { left: "30%", delay: ".05s", duration: "1.4s", size: 15 },
  { left: "43%", delay: ".32s", duration: "1.7s", size: 10 },
  { left: "56%", delay: ".12s", duration: "1.6s", size: 12 },
  { left: "68%", delay: ".26s", duration: "1.9s", size: 9 },
  { left: "80%", delay: ".08s", duration: "1.5s", size: 14 },
  { left: "92%", delay: ".2s", duration: "1.7s", size: 10 },
];

function FancyBurst({ color = "#00e9ae" }: { color?: string }) {
  return (
    <div
      className="fancy-burst"
      aria-hidden="true"
      style={{ "--fancy-color": color } as React.CSSProperties}
    >
      {FANCY_BURST_STARS.map((star, index) => (
        <span
          className="fancy-burst__star"
          key={index}
          style={{
            left: star.left,
            fontSize: star.size,
            animationDelay: star.delay,
            animationDuration: star.duration,
          }}
        >
          ✦
        </span>
      ))}
    </div>
  );
}

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

function JandyVideoSection() {
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

const DEFAULT_CELEBRATION_MESSAGE = "축 왁굳형, 핫짱 즐겨찾기 목록 입성";

type CelebrationSlide = { key: string; message: string };

function FavoriteCelebrationRow({ message }: { message: string }) {
  return (
    <span className="favorite-celebration__row">
      <span className="favorite-celebration__icon" aria-hidden="true">
        🎉
      </span>
      <strong>{message}</strong>
      <span className="favorite-celebration__icon" aria-hidden="true">
        🎺
      </span>
    </span>
  );
}

function FavoriteCelebration({ slides }: { slides: CelebrationSlide[] }) {
  const label = slides.map((slide) => slide.message).join(" · ");
  return (
    <aside className="favorite-celebration" role="note" aria-label={label}>
      <span
        className="favorite-celebration__spark favorite-celebration__spark--left"
        aria-hidden="true"
      >
        ✦
      </span>
      <div className="favorite-celebration__viewport">
        {slides.length > 1 ? (
          <Swiper
            className="favorite-celebration__swiper"
            modules={[Autoplay]}
            direction="vertical"
            loop
            allowTouchMove={false}
            speed={600}
            autoplay={{ delay: 3400, disableOnInteraction: false }}
          >
            {slides.map((slide) => (
              <SwiperSlide key={slide.key}>
                <FavoriteCelebrationRow message={slide.message} />
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <FavoriteCelebrationRow
            message={slides[0]?.message ?? DEFAULT_CELEBRATION_MESSAGE}
          />
        )}
      </div>
      <span
        className="favorite-celebration__spark favorite-celebration__spark--right"
        aria-hidden="true"
      >
        ✦
      </span>
    </aside>
  );
}

function AchievementBadges({
  streamer,
  awards,
}: {
  streamer: StreamerRecord;
  awards: TrophyAwards;
}) {
  const badges = trophyBadgesFor(streamer, awards);
  if (!badges.length) return null;
  return (
    <span
      className="achievement-badges"
      aria-label={`${streamer.displayName} 업적`}
    >
      {badges.map((badge) => (
        <span
          className="achievement-badge"
          role="img"
          title={badge.name}
          key={badge.key}
          aria-label={badge.name}
        >
          <span aria-hidden="true">{badge.emoji}</span>
          <span role="tooltip">{badge.name}</span>
        </span>
      ))}
    </span>
  );
}

function RecordBadge({
  streamer,
  className = "",
}: {
  streamer: Pick<StreamerRecord, "record" | "lastPost">;
  className?: string;
}) {
  if (streamer.record) {
    const r = streamer.record;
    return (
      <span className={`record-badge ${className}`}>
        <b className="record-badge__w">{r.wins}</b>/
        <b className="record-badge__d">{r.draws}</b>/
        <b className="record-badge__l">{r.losses}</b>
      </span>
    );
  }
  if (!streamer.lastPost)
    return (
      <span className={`record-badge record-badge--empty ${className}`}>
        -/-/-
      </span>
    );
  const status = recordExtractionStatus(streamer.lastPost);
  return status === "pending" ? (
    <span className={`record-badge record-badge--pending ${className}`}>
      집계중
    </span>
  ) : (
    <span className={`record-badge record-badge--empty ${className}`}>
      -/-/-
    </span>
  );
}

function StreamerCard({
  streamer,
  awards,
  isNew,
  onOpen,
}: {
  streamer: StreamerRecord;
  awards: TrophyAwards;
  isNew: boolean;
  onOpen: () => void;
}) {
  const fancy = isStreamerFancy(streamer);
  return (
    <button
      className={`streamer-card ${isNew ? "streamer-card--new" : ""} ${fancy ? "fancy-border" : ""}`}
      onClick={onOpen}
      aria-label={`${streamer.displayName} 상세 보기${isNew ? " (24시간 이내 업데이트됨)" : ""}`}
      style={
        fancy
          ? ({
              "--fancy-color": "#00e9ae",
              "--fancy-glow-soft": hexToRgba("#00e9ae", 0.4),
              "--fancy-glow-strong": hexToRgba("#00e9ae", 0.9),
            } as React.CSSProperties)
          : undefined
      }
    >
      <span className="streamer-card__avatar">
        <FancyAvatar streamer={streamer} />
        {streamer.sfx && (
          <Volume2 className="streamer-card__sfx-badge" aria-hidden="true" />
        )}
      </span>
      <span className="streamer-card__copy">
        <span className="streamer-card__name">
          <FancyName streamer={streamer} tag="strong">
            {streamer.displayName}
          </FancyName>
          <AchievementBadges streamer={streamer} awards={awards} />
        </span>
        <RecordBadge streamer={streamer} />
        <small>
          {streamer.lastPost
            ? formatBoardPostDate(streamer.lastPost.publishedAt)
            : "첫 보고 대기"}
        </small>
      </span>
      <span
        className="streamer-card__rank"
        style={
          {
            "--division-color": divisionColor(streamer.currentDivision),
          } as React.CSSProperties
        }
      >
        D{streamer.currentDivision}
      </span>
      {!streamer.isMapped && (
        <span className="unmapped" title="SOOP 정보 미연결">
          카페
        </span>
      )}
      {isNew && <span className="streamer-card__new-badge">NEW</span>}
    </button>
  );
}

function mixHex(
  hex: string,
  target: "white" | "black",
  amount: number,
): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  const t = target === "white" ? 255 : 0;
  const blend = (c: number) =>
    Math.round(c + (t - c) * amount)
      .toString(16)
      .padStart(2, "0");
  return `#${blend(r)}${blend(g)}${blend(b)}`;
}

const FIFA_SHIELD_OUTER =
  "M 150,6 C 215,6 270,14 286,28 C 295,36 298,46 298,60 L 298,350 C 298,370 278,400 150,444 C 22,400 2,370 2,350 L 2,60 C 2,46 5,36 14,28 C 30,14 85,6 150,6 Z";
const FIFA_SHIELD_INNER =
  "M 150,14 C 210,14 262,21 278,33 C 285,39 288,48 288,60 L 288,346 C 288,363 269,391 150,432 C 31,391 12,363 12,346 L 12,60 C 12,48 15,39 22,33 C 38,21 90,14 150,14 Z";

function FifaShield({
  color,
  holo,
}: {
  color: string;
  holo?: { x: number; y: number; opacity: number };
}) {
  const uid = useId();
  const gradientId = `${uid}-grad`;
  const holoId = `${uid}-holo`;
  return (
    <svg className="fifa-card__shield" viewBox="0 0 300 450" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.55 }} />
          <stop
            offset="45%"
            style={{ stopColor: mixHex(color, "black", 0.5), stopOpacity: 0.4 }}
          />
          <stop
            offset="100%"
            style={{ stopColor: "#06100c", stopOpacity: 0.94 }}
          />
        </linearGradient>
        {holo && (
          <radialGradient
            id={holoId}
            gradientUnits="objectBoundingBox"
            cx={holo.x}
            cy={holo.y}
            r="0.7"
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="16%" stopColor="#8ff5ff" stopOpacity="0.6" />
            <stop offset="34%" stopColor="#ff9bec" stopOpacity="0.45" />
            <stop offset="52%" stopColor="#fff29b" stopOpacity="0.3" />
            <stop offset="72%" stopColor="#9bffd6" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        )}
      </defs>
      <path
        d={FIFA_SHIELD_OUTER}
        fill={`url(#${gradientId})`}
        stroke={mixHex(color, "black", 0.35)}
        strokeWidth={3}
      />
      <path
        d={FIFA_SHIELD_INNER}
        fill="none"
        stroke="rgba(255, 255, 255, 0.35)"
        strokeWidth={2}
      />
      {holo && (
        <path
          d={FIFA_SHIELD_OUTER}
          fill={`url(#${holoId})`}
          opacity={holo.opacity}
          style={{
            mixBlendMode: "color-dodge",
            transition: "opacity .25s ease-out",
          }}
        />
      )}
    </svg>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function StreamerFifaCard({
  streamer,
  awards,
  onOpen,
}: {
  streamer: StreamerRecord;
  awards: TrophyAwards;
  onOpen: () => void;
}) {
  const rate = streamer.record ? winRatePercent(streamer.record) : undefined;
  const color = divisionColor(streamer.currentDivision);
  const cardRef = useRef<HTMLButtonElement>(null);
  const [tilt, setTilt] = useState({
    rx: 0,
    ry: 0,
    x: 0.5,
    y: 0.5,
    active: false,
  });

  const handleMouseMove = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    setTilt({
      rx: (0.5 - y) * 26,
      ry: (x - 0.5) * 30,
      x,
      y,
      active: true,
    });
  };
  const handleMouseLeave = () =>
    setTilt((current) => ({ ...current, active: false }));

  return (
    <button
      ref={cardRef}
      className="fifa-card fifa-card--holo"
      onClick={onOpen}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={
        tilt.active
          ? ({
              transform: `perspective(700px) translateY(-3px) scale(1.035) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
            } as React.CSSProperties)
          : undefined
      }
      aria-label={`${streamer.displayName} 상세 보기`}
    >
      <FifaShield
        color={color}
        holo={{ x: tilt.x, y: tilt.y, opacity: tilt.active ? 0.85 : 0 }}
      />
      <span className="fifa-card__division">D{streamer.currentDivision}</span>
      <AchievementBadges streamer={streamer} awards={awards} />
      <span className="fifa-card__body">
        <span
          className="fifa-card__avatar"
          style={
            {
              "--avatar-border": mixHex(color, "black", 0.45),
            } as React.CSSProperties
          }
        >
          <FancyAvatar streamer={streamer} color={color} ring={false} />
          {streamer.sfx && (
            <Volume2 className="fifa-card__sfx-badge" aria-hidden="true" />
          )}
        </span>
        <span
          className="fifa-card__name"
          style={{
            background: `linear-gradient(180deg, ${hexToRgba(color, 0.12)}, ${hexToRgba(color, 0.05)})`,
          }}
        >
          <FancyName streamer={streamer} color={color} tag="strong">
            {streamer.displayName}
          </FancyName>
        </span>
        <span className="fifa-card__stats">
          <span className="fifa-card__stat">
            <RecordBadge streamer={streamer} />
          </span>
          <span className="fifa-card__stat">
            <span className="fifa-card__stat-label">승률</span>
            <b className="fifa-card__stat-value">
              {rate !== undefined ? `${rate.toFixed(1)}%` : "-"}
            </b>
          </span>
          <span className="fifa-card__stat">
            <span className="fifa-card__stat-label">최근 승급일</span>
            <b className="fifa-card__stat-value">
              {streamer.lastPost
                ? formatBoardPostDate(streamer.lastPost.publishedAt)
                : "첫 보고 대기"}
            </b>
          </span>
        </span>
      </span>
      {!streamer.isMapped && (
        <span className="unmapped" title="SOOP 정보 미연결">
          카페
        </span>
      )}
    </button>
  );
}

function CardBoard({
  streamers,
  awards,
  zoom,
  onOpen,
}: {
  streamers: StreamerRecord[];
  awards: TrophyAwards;
  zoom: number;
  onOpen: (streamer: StreamerRecord) => void;
}) {
  return (
    <section
      className={`card-board card-board--zoom-${zoom}`}
      aria-label="스트리머 카드 보기"
    >
      {streamers.map((streamer) => (
        <StreamerFifaCard
          key={streamer.id}
          streamer={streamer}
          awards={awards}
          onOpen={() => onOpen(streamer)}
        />
      ))}
      {streamers.length === 0 && (
        <p className="empty-list">표시할 스트리머가 없습니다.</p>
      )}
    </section>
  );
}

function StreamerActivitySection({
  title,
  posts,
}: {
  title: string;
  posts?: StreamerActivityPost[];
}) {
  return (
    <section className="streamer-activity">
      <div className="streamer-activity__heading">
        <span>{title}</span>
        <b>{posts?.length ?? 0}</b>
      </div>
      {posts?.length ? (
        <div className="streamer-activity__posts">
          {posts.map((post) => (
            <a
              href={post.articleUrl}
              target="_blank"
              rel="noreferrer"
              key={`${post.board}:${post.articleId}`}
            >
              <strong>{post.title}</strong>
              <time>{formatCafePostDate(post.publishedAt)}</time>
            </a>
          ))}
        </div>
      ) : (
        <p>등록된 게시글 없음</p>
      )}
    </section>
  );
}

function PromotionTimeline({ posts }: { posts: PromotionPost[] }) {
  const events = buildPromotionTimeline(posts);
  const summary = summarizePromotionTimeline(events);
  if (!summary) return null;
  const groups = events.reduce<{ dateKey: string; events: typeof events }[]>(
    (items, event) => {
      const group = items.at(-1);
      if (group?.dateKey === event.dateKey) group.events.push(event);
      else items.push({ dateKey: event.dateKey, events: [event] });
      return items;
    },
    [],
  );
  let index = 0;
  return (
    <section
      className="promotion-timeline"
      aria-labelledby="promotion-timeline-title"
    >
      <div className="promotion-timeline__heading">
        <div>
          <p className="eyebrow">PROMOTION JOURNEY</p>
          <h3 id="promotion-timeline-title">승급 여정</h3>
        </div>
      </div>
      <div className="promotion-timeline__stats" aria-label="승급 여정 요약">
        <span>
          <b>{summary.promotionCount}</b>회 실제 승급
        </span>
        {events.length > 1 ? (
          <span>
            <b>
              {summary.exactDurationMs !== undefined
                ? formatDuration(summary.exactDurationMs)
                : `${summary.calendarDays}일`}
            </b>{" "}
            {summary.exactDurationMs !== undefined ? "소요" : "확인된 기간"}
          </span>
        ) : (
          <span>첫 승급 보고</span>
        )}
      </div>
      <div className="promotion-timeline__track">
        <div className="promotion-timeline__rail">
          {groups.map((group) => (
            <div className="promotion-timeline__day" key={group.dateKey}>
              <p>{formatTimelineDate(group.dateKey)}</p>
              <div className="promotion-timeline__events">
                {group.events.map((event, eventIndex) => {
                  const previous = group.events[eventIndex - 1];
                  const interval =
                    previous?.precision === "time" && event.precision === "time"
                      ? Date.parse(event.post.publishedAt) -
                        Date.parse(previous.post.publishedAt)
                      : undefined;
                  const delay = index++ * 85;
                  return (
                    <div
                      className="promotion-timeline__event"
                      key={event.post.articleId}
                    >
                      {interval !== undefined && interval >= 0 && (
                        <span className="promotion-timeline__interval">
                          {formatDuration(interval)} 후
                        </span>
                      )}
                      <a
                        className="promotion-timeline__node"
                        href={event.post.articleUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ animationDelay: `${delay}ms` }}
                        aria-label={`${event.post.division}부 승격 게시글 보기`}
                      >
                        <b>D{event.post.division}</b>
                        <span
                          className={`promotion-timeline__time ${event.precision === "time" ? "" : "promotion-timeline__time--placeholder"}`}
                          aria-hidden={event.precision !== "time"}
                        >
                          {event.precision === "time"
                            ? formatTimelineTime(event.post.publishedAt)
                            : "00:00"}
                        </span>
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="promotion-timeline__notice">
        일부 과거 게시글은 카페 제공 정보상 날짜만 표시됩니다.
      </p>
    </section>
  );
}

function PreviousPromotionSection({ posts }: { posts?: PromotionPost[] }) {
  const [isOpen, setIsOpen] = useState(false);
  if (!posts?.length) return null;
  return (
    <section className="streamer-activity promotion-history">
      <button
        className="streamer-activity__heading promotion-history__toggle"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
      >
        <span>이전 승격 게시글</span>
        <span className="promotion-history__meta">
          <b>{posts.length}</b>
          <span className="promotion-history__icon" aria-hidden="true">
            {isOpen ? <ChevronUp /> : <ChevronDown />}
          </span>
        </span>
      </button>
      {isOpen && (
        <div className="streamer-activity__posts">
          {posts.map((post) => (
            <a
              href={post.articleUrl}
              target="_blank"
              rel="noreferrer"
              key={post.articleId}
            >
              <span className="promotion-history__category">
                {post.category}
              </span>
              <strong>{post.title}</strong>
              <time>{formatCafePostDate(post.publishedAt)}</time>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

function AnimatedReviewText({ text }: { text: string }) {
  const [typedLength, setTypedLength] = useState(0);
  useEffect(() => {
    setTypedLength(0);
    const interval = setInterval(() => {
      setTypedLength((current) => {
        if (current >= text.length) {
          clearInterval(interval);
          return current;
        }
        return current + 1;
      });
    }, 10);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <p className="gemini-review__text">
      {text.slice(0, typedLength)}
      {typedLength < text.length && (
        <span className="gemini-review__cursor" aria-hidden="true" />
      )}
    </p>
  );
}

function GeminiReviewSection({
  review: rawReview,
}: {
  review?: StreamerRecord["latestReview"];
}) {
  // The live API can briefly still return the pre-mild/spicy shape (just
  // `text`) while a deploy is in flight. Treat that the same as "not yet
  // reviewed" instead of crashing on a missing mild/spicy string.
  const review =
    rawReview &&
    typeof rawReview.mild === "string" &&
    typeof rawReview.spicy === "string"
      ? rawReview
      : undefined;
  return (
    <section className="gemini-review">
      <div className="gemini-review__header">
        <img className="gemini-review__logo" src={geminiLogo} alt="" />
        <h3>Gemini 한줄평</h3>
        {review && !review.isCurrent && (
          <span className="gemini-review__badge">이전 평가</span>
        )}
      </div>
      <p className="gemini-review__note">
        {review && !review.isCurrent
          ? "현재 게시글이 분석 조건을 달성하지 않았거나 분석이 생성 중이라 이전 한줄평이 대신 표시됩니다."
          : "왁물원에 승격 보고 게시글이 올라오고 전체 전적 분석이 성공하면 한줄평이 자동 생성됩니다."}
      </p>
      {review && (
        <>
          <div className="gemini-review__flavor">
            <span className="gemini-review__flavor-tag gemini-review__flavor-tag--mild">
              순한맛
            </span>
            <AnimatedReviewText text={review.mild} />
          </div>
          <div className="gemini-review__flavor">
            <span className="gemini-review__flavor-tag gemini-review__flavor-tag--spicy">
              매운맛
            </span>
            <AnimatedReviewText text={review.spicy} />
          </div>
        </>
      )}
    </section>
  );
}

function DetailModal({
  streamer,
  awards,
  onClose,
  latestPosts = [],
  sfxVolume,
}: {
  streamer: StreamerRecord;
  awards: TrophyAwards;
  onClose: () => void;
  latestPosts?: PromotionPost[];
  sfxVolume: number;
}) {
  // Combine promotionHistory with latestPosts to ensure we have all posts
  const historyPostIds = new Set(
    (streamer.promotionHistory ?? []).map((p) => p.articleId),
  );
  const normalizedAliases = new Set(
    streamer.cafeAliases.map(normalizeCafeAlias),
  );
  const allPosts = [
    ...(streamer.promotionHistory ?? []),
    ...latestPosts.filter(
      (p) =>
        normalizedAliases.has(normalizeCafeAlias(p.cafeAuthor)) &&
        !historyPostIds.has(p.articleId),
    ),
  ];
  // Find current division post from allPosts
  const currentPost = allPosts.find(
    (p) => p.division === streamer.currentDivision,
  );
  // An operator override is pinning the division (roster.yaml override.policy !== "auto") and no collected
  // post actually reports that division yet — every known post is for a different (often stale) division.
  const manualOverrideNotice =
    !currentPost &&
    streamer.overridePolicy !== "auto" &&
    streamer.overrideDivision === streamer.currentDivision;
  const post =
    currentPost ??
    (manualOverrideNotice
      ? undefined
      : allPosts.length
        ? allPosts[allPosts.length - 1]
        : undefined);
  const promotionHistory = allPosts;
  const channel = soopChannelUrl(streamer.soopId);
  const [expandedImage, setExpandedImage] = useState<string>();
  useEscape(() => (expandedImage ? setExpandedImage(undefined) : onClose()));
  return (
    <Modal
      onClose={onClose}
      label="디비전 상세"
      decoration={isStreamerFancy(streamer) ? <FancyBurst /> : undefined}
      fancyBorderColor={isStreamerFancy(streamer) ? "#00e9ae" : undefined}
      header={
        <div className="modal__identity">
          <FancyAvatar streamer={streamer} />
          <div>
            <span className="eyebrow">CURRENT DIVISION</span>
            <h2>
              <FancyName streamer={streamer}>{streamer.displayName}</FancyName>{" "}
              <b
                style={
                  {
                    "--division-color": divisionColor(streamer.currentDivision),
                  } as React.CSSProperties
                }
              >
                {streamer.currentDivision}부
              </b>{" "}
              <AchievementBadges streamer={streamer} awards={awards} />
            </h2>
            <span className="modal__record-row">
              <RecordBadge streamer={streamer} className="record-badge--lg" />
              {streamer.sfx && (
                <button
                  type="button"
                  className="modal__sfx-play"
                  onClick={() => playSfx(streamer.sfx!, sfxVolume / 100)}
                  aria-label={`${streamer.displayName} 효과음 재생`}
                >
                  <Volume2 aria-hidden="true" />
                </button>
              )}
            </span>
            {!streamer.isMapped && <p>카페 작성자 · SOOP 정보 미연결</p>}
          </div>
        </div>
      }
    >
      <GeminiReviewSection review={streamer.latestReview} />
      {post ? (
        <>
          <div className="report">
            <span>{post.category}</span>
            <h3>{post.title}</h3>
            <time>{formatCafePostDate(post.publishedAt)}</time>
          </div>
          {post.imageUrls.length > 0 && (
            <div className="gallery">
              {post.imageUrls.map((url, index) => (
                <button
                  className="gallery__image"
                  type="button"
                  onClick={() => setExpandedImage(url)}
                  aria-label={`${streamer.displayName} 게시글 이미지 확대`}
                  key={url}
                >
                  <img
                    src={url}
                    alt={`${streamer.displayName} 게시글 이미지`}
                    loading={index === 0 ? "eager" : "lazy"}
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}
          <PromotionTimeline posts={promotionHistory} />
        </>
      ) : manualOverrideNotice ? (
        <p className="empty-detail">
          카페에 {streamer.currentDivision}부 승격 게시글이 아직 올라오지 않아
          운영자가 수동으로 업데이트한 디비전입니다.
        </p>
      ) : (
        <p className="empty-detail">
          아직 확인된 디비전 보고 게시글이 없습니다.
        </p>
      )}
      <PreviousPromotionSection posts={streamer.previousPromotionPosts} />
      <StreamerActivitySection
        title="잔디동 스코프"
        posts={streamer.scopePosts}
      />
      <StreamerActivitySection
        title="11대 11 플레이 영상"
        posts={streamer.elevenVsElevenPosts}
      />
      <div className="actions">
        {post && <CafeLink href={post.articleUrl} />}
        {channel && <SoopLink href={channel}>SOOP 방송국 ↗</SoopLink>}
      </div>
      {expandedImage && (
        <div
          className="image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="게시글 이미지 확대"
          onMouseDown={() => setExpandedImage(undefined)}
        >
          <button
            className="close"
            type="button"
            onClick={() => setExpandedImage(undefined)}
            aria-label="확대 이미지 닫기"
          >
            ×
          </button>
          <img
            src={expandedImage}
            alt={`${streamer.displayName} 게시글 이미지 확대`}
            referrerPolicy="no-referrer"
            onMouseDown={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </Modal>
  );
}

function CafeLink({
  href,
  label = "왁물원 게시글",
}: {
  href: string;
  label?: string;
}) {
  return (
    <a className="action cafe" href={href} target="_blank" rel="noreferrer">
      <i>{cafeIcon}</i> {label}
    </a>
  );
}
function SoopLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="action soop" href={href} target="_blank" rel="noreferrer">
      <img className="soop-icon" src={soopIcon} alt="" />
      {children}
    </a>
  );
}

function AnnouncementEntries({
  announcements,
}: {
  announcements: Announcement[];
}) {
  return (
    <>
      {announcements.map((item, index) => (
        <div className="announcement-item" key={item.id}>
          {index > 0 && <hr className="announcement-modal__divider" />}
          <time className="announcement-item__date">{item.date}</time>
          <p>{item.body}</p>
          {item.note && (
            <small className="announcement-item__note">{item.note}</small>
          )}
        </div>
      ))}
    </>
  );
}

function AnnouncementModal({
  announcements,
  onClose,
  onAcknowledge,
}: {
  announcements: Announcement[];
  onClose: () => void;
  onAcknowledge: () => void;
}) {
  useEscape(onClose);
  return (
    <div className="modal-backdrop announcement-backdrop" role="presentation">
      <section
        className="modal announcement-modal"
        role="dialog"
        aria-modal="true"
        aria-label="공지"
      >
        <div className="modal__header">
          <div>
            <p className="eyebrow">NOTICE</p>
            <h2 className="announcement-modal__title">
              <Megaphone aria-hidden="true" /> 공지
            </h2>
          </div>
          <button className="close" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>
        <div className="modal__body announcement-modal__body">
          <AnnouncementEntries announcements={announcements} />
        </div>
        <div className="announcement-modal__actions">
          <button
            type="button"
            className="announcement-modal__ack"
            onClick={onAcknowledge}
          >
            다시 보지 않기
          </button>
        </div>
      </section>
    </div>
  );
}

function AnnouncementWidget() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node))
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
  return (
    <div className="announcement-widget" ref={wrapRef}>
      {open && (
        <section
          className="announcement-popover"
          role="dialog"
          aria-label="공지"
        >
          <div className="announcement-popover__header">
            <h2 className="announcement-modal__title">
              <Megaphone aria-hidden="true" /> 공지
            </h2>
            <button
              className="close"
              type="button"
              onClick={() => setOpen(false)}
              aria-label="닫기"
            >
              ×
            </button>
          </div>
          <div className="announcement-popover__body">
            <AnnouncementEntries announcements={ANNOUNCEMENTS_SORTED} />
          </div>
        </section>
      )}
      <button
        type="button"
        className="announcement-toggle"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "공지 닫기" : "공지 보기"}
        aria-expanded={open}
      >
        <Megaphone aria-hidden="true" />
      </button>
    </div>
  );
}

function Modal({
  children,
  header,
  onClose,
  label,
  decoration,
  fancyBorderColor,
}: {
  children: ReactNode;
  header: ReactNode;
  onClose: () => void;
  label: string;
  decoration?: ReactNode;
  fancyBorderColor?: string;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="modal-frame"
        style={
          fancyBorderColor
            ? ({
                "--fancy-color": fancyBorderColor,
                "--fancy-glow-soft": hexToRgba(fancyBorderColor, 0.4),
                "--fancy-glow-strong": hexToRgba(fancyBorderColor, 0.9),
              } as React.CSSProperties)
            : undefined
        }
      >
        <section
          className={`modal ${fancyBorderColor ? "fancy-border" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          onMouseDown={(event) => event.stopPropagation()}
        >
          {decoration}
          <div className="modal__header">
            {header}
            <button className="close" onClick={onClose} aria-label="닫기">
              ×
            </button>
          </div>
          <div className="modal__body">{children}</div>
        </section>
        {fancyBorderColor && (
          <img
            className="fancy-ball"
            src="/soccer_ball.webp"
            alt=""
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}

function useEscape(onClose: () => void) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    addEventListener("keydown", close);
    return () => removeEventListener("keydown", close);
  }, [onClose]);
}

function TrophyHelp({ children }: { children: ReactNode }) {
  return (
    <span className="trophy-help">
      <button type="button" aria-label="계산 기준 보기">
        <Info aria-hidden="true" />
      </button>
      <span role="tooltip">{children}</span>
    </span>
  );
}

function TrophyWinner({
  streamer,
  medal,
}: {
  streamer: StreamerRecord;
  medal?: string;
}) {
  return (
    <div className="trophy-winner">
      {medal && (
        <span className="trophy-winner__medal" aria-hidden="true">
          {medal}
        </span>
      )}
      <Avatar {...streamer} />
      <div>
        <strong>{streamer.displayName}</strong>
      </div>
    </div>
  );
}

function TrophyModal({
  awards,
  onClose,
}: {
  awards: TrophyAwards;
  onClose: () => void;
}) {
  useEscape(onClose);
  return (
    <Modal
      onClose={onClose}
      label="업적"
      header={
        <div>
          <p className="eyebrow">HALL OF FAME</p>
          <h2 className="trophy-modal__title">
            <Trophy aria-hidden="true" /> 업적
          </h2>
          <p className="trophy-modal__intro">이제야 이쪽을 봐주는구나</p>
        </div>
      }
    >
      <div className="trophy-awards">
        <section className="trophy-award trophy-award--summit">
          <div className="trophy-award__heading">
            <span className="trophy-award__icon" aria-hidden="true">
              🏆
            </span>
            <div>
              <h3>
                1부 리그 달성{" "}
                <TrophyHelp>
                  가장 먼저 1부 리그를 달성한 상위 스트리머 3명을 표시합니다.
                  1부 리거 달성 게시글이 게시된 순서를 기준으로 하며, 이후
                  디비전이 바뀌어도 최초 달성 기록은 유지됩니다.
                </TrophyHelp>
              </h3>
              <p>가장 먼저 1부 리그를 달성한 스트리머들</p>
            </div>
          </div>
          {awards.divisionOne.length ? (
            <div className="trophy-award__winners">
              {awards.divisionOne.map((award) => (
                <article className="trophy-record" key={award.streamer.id}>
                  <TrophyWinner
                    streamer={award.streamer}
                    medal={DIVISION_ONE_EMOJI[award.rank]}
                  />
                  <div className="trophy-record__metric">
                    <span>{formatCafePostDate(award.reachedAt)} 달성</span>
                    <strong>현재 {award.streamer.currentDivision}부</strong>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="trophy-award__empty">
              아직 1부 리그를 달성한 스트리머가 없습니다.
            </p>
          )}
        </section>
        <section className="trophy-award trophy-award--matches">
          <div className="trophy-award__heading">
            <span className="trophy-award__icon" aria-hidden="true">
              ⚔️
            </span>
            <div>
              <h3>
                최다 경기 출전{" "}
                <TrophyHelp>
                  커리어 전적(승+무+패)을 합산해 가장 많은 경기를 치른
                  스트리머를 표시합니다. 동률자는 함께 표시합니다.
                </TrophyHelp>
              </h3>
              <p>가장 많은 경기를 치른 스트리머</p>
            </div>
          </div>
          {awards.mostMatches.length ? (
            <div className="trophy-award__winners">
              {awards.mostMatches.map((award) => (
                <article className="trophy-record" key={award.streamer.id}>
                  <TrophyWinner streamer={award.streamer} />
                  <div className="trophy-record__metric">
                    <strong>총 {award.totalGames}경기</strong>
                    <span>
                      {award.streamer.record?.wins}승{" "}
                      {award.streamer.record?.draws}무{" "}
                      {award.streamer.record?.losses}패
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="trophy-award__empty">아직 집계된 전적이 없습니다.</p>
          )}
        </section>
        <section className="trophy-award trophy-award--winrate">
          <div className="trophy-award__heading">
            <span className="trophy-award__icon" aria-hidden="true">
              👑
            </span>
            <div>
              <h3>
                최고 승률{" "}
                <TrophyHelp>
                  커리어 전적(승+무+패)이 1경기 이상인 스트리머 중 승률이 가장
                  높은 스트리머를 표시합니다. 동률자는 함께 표시합니다.
                </TrophyHelp>
              </h3>
              <p>가장 높은 승률을 기록한 스트리머</p>
            </div>
          </div>
          {awards.bestWinRate.length ? (
            <div className="trophy-award__winners">
              {awards.bestWinRate.map((award) => (
                <article className="trophy-record" key={award.streamer.id}>
                  <TrophyWinner streamer={award.streamer} />
                  <div className="trophy-record__metric">
                    <strong>승률 {award.winRate.toFixed(1)}%</strong>
                    <span>
                      {award.streamer.record?.wins}승{" "}
                      {award.streamer.record?.draws}무{" "}
                      {award.streamer.record?.losses}패
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="trophy-award__empty">아직 집계된 전적이 없습니다.</p>
          )}
        </section>
        <section className="trophy-award trophy-award--growth">
          <div className="trophy-award__heading">
            <span className="trophy-award__icon" aria-hidden="true">
              🚀
            </span>
            <div>
              <h3>
                하루 급성장{" "}
                <TrophyHelp>
                  전체 수집 기간에서 한국 시간 하루 동안 첫 승격글의 직전
                  부수부터 마지막 승격글까지 계산합니다. 중간 승격글이 없어도
                  최종 부수까지 반영하며, 한 건만 있어도 1단계로 계산합니다.
                </TrophyHelp>
              </h3>
              <p>하루에 가장 많이 올라간 역대 기록</p>
            </div>
          </div>
          {awards.dailyPromotion.length ? (
            <div className="trophy-award__winners">
              {awards.dailyPromotion.map((award) => (
                <article
                  className="trophy-record"
                  key={`${award.streamer.id}-${award.dateKey}`}
                >
                  <TrophyWinner streamer={award.streamer} />
                  <div className="trophy-record__metric">
                    <span>{formatTimelineDate(award.dateKey)}</span>
                    <strong>
                      {award.startDivision}부 → {award.endDivision}부
                    </strong>
                    <b>▲ {award.steps}</b>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="trophy-award__empty">
              아직 기록된 승격 업적이 없습니다.
            </p>
          )}
        </section>
        <section className="trophy-award trophy-award--promotion">
          <div className="trophy-award__heading">
            <span className="trophy-award__icon" aria-hidden="true">
              📣
            </span>
            <div>
              <h3>
                자기 PR 왕{" "}
                <TrophyHelp>
                  잔디동 스코프의 ‘내가 직접 홍보’ 글과 11대11 플레이 영상
                  게시글 수를 합산합니다. 동률자는 함께 표시합니다.
                </TrophyHelp>
              </h3>
              <p>가장 활발하게 자신을 알린 주인공</p>
            </div>
          </div>
          {awards.selfPromotion.length ? (
            <div className="trophy-award__winners">
              {awards.selfPromotion.map((award) => (
                <article className="trophy-record" key={award.streamer.id}>
                  <TrophyWinner streamer={award.streamer} />
                  <div className="trophy-record__metric">
                    <strong>총 {award.totalCount}개 게시글</strong>
                    <span>
                      스코프 {award.scopeCount} · 11대11{" "}
                      {award.elevenVsElevenCount}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="trophy-award__empty">
              아직 집계된 자기 PR 게시글이 없습니다.
            </p>
          )}
        </section>
        <section className="trophy-award trophy-award--retention">
          <div className="trophy-award__heading">
            <span className="trophy-award__icon" aria-hidden="true">
              🛏️
            </span>
            <div>
              <h3>
                잔류왕{" "}
                <TrophyHelp>
                  9부 이상으로 승격한 적이 있는 스트리머 중, 현재 디비전에
                  가장 오랫동안 머무른 스트리머를 표시합니다. 1부 리그는
                  제외되며, 마지막으로 디비전이 바뀐 시점부터 오늘까지 지난
                  일수를 기준으로 동률자는 함께 표시합니다.
                </TrophyHelp>
              </h3>
              <p>현재 디비전에 가장 오래 머문 스트리머</p>
            </div>
          </div>
          {awards.retention.length ? (
            <div className="trophy-award__winners">
              {awards.retention.map((award) => (
                <article className="trophy-record" key={award.streamer.id}>
                  <TrophyWinner streamer={award.streamer} />
                  <div className="trophy-record__metric">
                    <strong>{award.days}일째 잔류 중</strong>
                    <span>
                      현재 {award.currentDivision}부 ·{" "}
                      {formatCafePostDate(award.since)}부터
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="trophy-award__empty">
              아직 집계된 잔류 기록이 없습니다.
            </p>
          )}
        </section>
      </div>
    </Modal>
  );
}

function EvaluationCard({
  application,
  onOpen,
}: {
  application: OneVsOneApplicationView;
  onOpen: () => void;
}) {
  const result = application.result;
  return (
    <article
      className={`evaluation-card ${result ? "evaluation-card--completed" : ""}`}
    >
      <button
        className="evaluation-card__main"
        onClick={onOpen}
        aria-label={`${application.displayName} 1대1 평가 상세 보기`}
      >
        <Avatar {...application} />
        <span>
          <strong>{application.displayName}</strong>
          <small>
            {application.cafeAuthor} · 신청{" "}
            {formatCafePostDate(application.publishedAt)}
          </small>
        </span>
        <b className={`evaluation-status ${result ? "done" : "waiting"}`}>
          {result ? "대결 완료" : "대결 전"}
        </b>
      </button>
      {result && (
        <button className="evaluation-result" onClick={onOpen}>
          <span>
            {result.candidateScore} : {result.woowakgoodScore}
          </span>
          <strong>{result.verdict}</strong>
          <small>{formatDateTime(result.playedAt)}</small>
        </button>
      )}
      <div className="evaluation-card__actions">
        <CafeLink href={application.articleUrl} label="신청글" />
      </div>
    </article>
  );
}

function EvaluationModal({
  application,
  onClose,
}: {
  application: OneVsOneApplicationView;
  onClose: () => void;
}) {
  const opponent = DEFAULT_ONE_VS_ONE_CONFIG.opponent;
  const result = application.result;
  useEscape(onClose);
  return (
    <Modal
      onClose={onClose}
      label="1대1 평가 상세"
      header={
        <div className="modal__identity">
          <Avatar {...application} />
          <div>
            <span className="eyebrow">ONE VS ONE APPLICATION</span>
            <h2>{application.displayName}</h2>
            <p>
              {application.cafeAuthor} · 신청{" "}
              {formatCafePostDate(application.publishedAt)}
            </p>
          </div>
        </div>
      }
    >
      <div className="report">
        <span>{application.category}</span>
        <h3>{application.title}</h3>
      </div>
      {result ? (
        <section className="scoreboard">
          <p className="eyebrow">MATCH RESULT</p>
          <div className="scoreboard__players">
            <span>{application.displayName}</span>
            <span>{opponent.displayName}</span>
          </div>
          <strong>
            {result.candidateScore}
            <i>:</i>
            {result.woowakgoodScore}
          </strong>
          <time>대결 일시 · {formatDateTime(result.playedAt)}</time>
          <div className="verdict">
            <b>{result.verdict}</b>
            <p>{result.detail}</p>
            {result.note && <small>{result.note}</small>}
          </div>
        </section>
      ) : (
        <p className="empty-detail">
          대결 결과가 아직 등록되지 않았습니다. 결과가 확정되면 이 카드에 공지
          기준 판정이 표시됩니다.
        </p>
      )}
      <div className="actions">
        <CafeLink href={application.articleUrl} label="신청글" />
        {application.soopId && (
          <SoopLink href={soopChannelUrl(application.soopId)!}>방송국</SoopLink>
        )}
      </div>
    </Modal>
  );
}

export function App() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>();
  const [view, setView] = useState<"division" | "evaluation">("division");
  const [query, setQuery] = useState("");
  const [activityOnly, setActivityOnly] = useState(false);
  const [sfxOnly, setSfxOnly] = useState(false);
  const [achievementOnly, setAchievementOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "card">(() =>
    loadViewMode(),
  );
  const [cardViewDiscovered, setCardViewDiscovered] = useState(() =>
    hasDiscoveredCardView(),
  );
  const [sortMode, setSortMode] = useState<"division" | "winRate">("division");
  const [cardZoom, setCardZoom] = useState(() => loadCardZoomLevel());
  const handleZoomOut = () => {
    setCardZoom((level) => {
      const next = Math.max(CARD_ZOOM_MIN, level - 1);
      saveCardZoomLevel(next);
      return next;
    });
  };
  const handleZoomIn = () => {
    setCardZoom((level) => {
      const next = Math.min(CARD_ZOOM_MAX, level + 1);
      saveCardZoomLevel(next);
      return next;
    });
  };
  const [evaluationFilter, setEvaluationFilter] = useState<
    "all" | "pending" | "completed"
  >("all");
  const [selected, setSelected] = useState<StreamerRecord>();
  const [selectedApplication, setSelectedApplication] =
    useState<OneVsOneApplicationView>();
  const [feedOpen, setFeedOpen] = useState(false);
  const [trophyOpen, setTrophyOpen] = useState(false);
  const [toast, setToast] = useState<string>();
  const toastTimeout = useRef<number | undefined>(undefined);
  const [sfxEnabled, setSfxEnabled] = useState(loadSfxEnabled);
  const [sfxVolume, setSfxVolume] = useState(loadSfxVolume);
  const [sfxIntroVisible, setSfxIntroVisible] = useState(false);
  const [pendingAnnouncements, setPendingAnnouncements] = useState<
    Announcement[]
  >([]);
  useEffect(() => {
    const seenIds = loadSeenAnnouncementIds();
    const unseen = ANNOUNCEMENTS_SORTED.filter(
      (announcement) => !seenIds.has(announcement.id),
    );
    if (unseen.length) setPendingAnnouncements(unseen);
  }, []);
  const { seenKeys, markSeen } = useSeenUpdates();
  const controlsSentinelRef = useRef<HTMLDivElement>(null);
  const [controlsStuck, setControlsStuck] = useState(false);
  useEffect(() => {
    const sentinel = controlsSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setControlsStuck(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-1px 0px 0px 0px" },
    );
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
  useEffect(() => {
    loadSnapshot()
      .then((data) => setSnapshot(applyFancyMembersOverride(data, window.location.search)))
      .catch(() => undefined);
  }, []);
  useEffect(() => () => clearTimeout(toastTimeout.current), []);
  function showToast(message: string) {
    setToast(message);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = window.setTimeout(() => setToast(undefined), 2200);
  }
  const trophyAwards = useMemo(
    () => buildTrophyAwards(snapshot?.streamers ?? []),
    [snapshot],
  );
  const streamers = useMemo(
    () =>
      (snapshot?.streamers ?? []).filter(
        (streamer) =>
          searchable(streamer.displayName, streamer.cafeAliases, query) &&
          (!activityOnly ||
            Boolean(
              streamer.scopePosts?.length ||
              streamer.elevenVsElevenPosts?.length,
            )) &&
          (!sfxOnly || Boolean(streamer.sfx)) &&
          (!achievementOnly ||
            trophyBadgesFor(streamer, trophyAwards).length > 0),
      ),
    [snapshot, query, activityOnly, sfxOnly, achievementOnly, trophyAwards],
  );
  const divisionStats = useMemo(() => {
    const all = snapshot?.streamers ?? [];
    const unreported = all.filter(
      (streamer) => streamer.currentDivision === 10,
    ).length;
    return { total: all.length, reported: all.length - unreported, unreported };
  }, [snapshot]);
  const cardStreamers = useMemo(() => {
    if (sortMode === "division")
      return [...streamers].sort(
        (a, b) => a.currentDivision - b.currentDivision,
      );
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
  async function handleDownloadDivisionList() {
    try {
      const today = new Date().toISOString().slice(0, 10);
      await downloadStreamersXlsx(
        streamers,
        `fc26-division-list-${today}.xlsx`,
      );
    } catch {
      showToast("엑셀 다운로드에 실패했습니다");
    }
  }
  const applications = useMemo(
    () =>
      (snapshot?.oneVsOneApplications ?? []).filter(
        (application) =>
          searchable(application.displayName, application.cafeAliases, query) &&
          (evaluationFilter === "all" ||
            (evaluationFilter === "completed"
              ? Boolean(application.result)
              : !application.result)),
      ),
    [snapshot, query, evaluationFilter],
  );
  const latest = (
    snapshot?.latestPosts.length
      ? snapshot.latestPosts
      : streamers
          .flatMap((streamer) => (streamer.lastPost ? [streamer.lastPost] : []))
          .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  ).filter(
    (post) => Date.now() - new Date(post.publishedAt).getTime() < DAY_MS,
  );
  const celebrationSlides = useMemo(() => {
    const postSlides = (snapshot?.streamers ?? [])
      .flatMap((streamer) => {
        const normalizedAliases = new Set(
          streamer.cafeAliases.map(normalizeCafeAlias),
        );
        const todaysPosts = latest.filter((post) =>
          normalizedAliases.has(normalizeCafeAlias(post.cafeAuthor)),
        );
        if (!todaysPosts.length) return [];
        // Lower division number = higher tier, so pick the best (minimum) division reached today.
        const bestPost = todaysPosts.reduce((best, post) =>
          post.division < best.division ? post : best,
        );
        const division = bestPost.division;
        const message = streamer.celebrationMessage
          ? streamer.celebrationMessage.replace("{n}", String(division))
          : `${streamer.displayName}의 ${division}부 리그 승격을 축하합니다~!!`;
        return [
          {
            key: bestPost.articleId,
            message,
            publishedAt: bestPost.publishedAt,
          },
        ];
      })
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    return [
      { key: "default", message: DEFAULT_CELEBRATION_MESSAGE },
      ...postSlides.map(({ key, message }) => ({ key, message })),
    ];
  }, [snapshot, latest]);
  function openStreamer(streamer: StreamerRecord) {
    if (streamer.lastPost) markSeen(seenKeyFor(streamer));
    if (sfxEnabled && streamer.sfx) {
      playSfx(streamer.sfx, sfxVolume / 100);
      if (!hasHeardSfx()) setSfxIntroVisible(true);
    }
    setSelected(streamer);
  }
  const isDivision = view === "division";
  return (
    <main>
      <header className="topbar">
        <div className="topbar__brand-group">
          <a className="brand" href="#top">
            <span className="brand-wak">WAK</span>
            <span>JANDY</span>
            <strong>동아리 후보 대시보드</strong>
          </a>
          <AnnouncementWidget />
        </div>
        <nav className="main-nav" aria-label="메인 메뉴">
          <button
            className={isDivision ? "active" : ""}
            onClick={() => setView("division")}
          >
            디비전 현황
          </button>
          <button
            className={!isDivision ? "active" : ""}
            onClick={() => setView("evaluation")}
          >
            1:1 평가
          </button>
        </nav>
        <div className="topbar__actions">
          <button className="feed-toggle" onClick={() => setFeedOpen(true)}>
            최신 소식 <em>{latest.length}</em>
          </button>
          <button
            className="trophy-toggle"
            type="button"
            onClick={() => setTrophyOpen(true)}
            aria-label="업적 보기"
          >
            <Trophy aria-hidden="true" />
          </button>
        </div>
      </header>
      <FavoriteCelebration slides={celebrationSlides} />
      <section className="hero" id="top">
        <div>
          <p className="eyebrow">
            FC26 ·{" "}
            {isDivision ? "SEASON DIVISION BOARD" : "ONE VS ONE EVALUATION"}
          </p>
          <h1>
            {isDivision ? (
              <>
                <span className="hero-title__line hero-title__line--1">
                  잰디 <mark>동아리 후보</mark>
                </span>
                <br />
                <span className="hero-title__line hero-title__line--2">
                  대시보드
                  <img
                    className="hero-ball"
                    src="/soccer_ball.webp"
                    alt=""
                    aria-hidden="true"
                  />
                  <span className="hero-ball-impact" aria-hidden="true" />
                </span>
              </>
            ) : (
              <>
                <span className="hero-title__line hero-title__line--1">
                  1:1 <mark>평가 신청</mark>
                </span>
                <br />
                <span className="hero-title__line hero-title__line--2">
                  현황
                </span>
              </>
            )}
          </h1>
          <p className="intro">
            {isDivision
              ? "왁물원에 보고된 FC26 디비전 승격 현황을 추적합니다."
              : "1대1 평가 신청 게시글과 대결 결과를 표시합니다."}
          </p>
        </div>
        <div className="sync">
          <span className="sync-dot" /> <b>3 MINUTE REFRESH</b>
          <small>
            <span className="refresh-icon" aria-hidden="true">
              ↻
            </span>{" "}
            3분마다 갱신 ·{" "}
            {snapshot
              ? `${formatDateTime(snapshot.generatedAt)} 기준`
              : "데이터 연결 중"}
          </small>
        </div>
      </section>
      <JandyVideoSection />
      <div
        ref={controlsSentinelRef}
        className="controls-sentinel"
        aria-hidden="true"
      />
      <section
        className={`controls-bar ${controlsStuck ? "controls-bar--stuck" : ""}`}
        aria-label={isDivision ? "스트리머 검색" : "평가 신청 필터"}
      >
        <div className="controls">
          <div className="controls__search">
            <label>
              <span className="sr-only">검색</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="이름 또는 카페 닉네임 검색"
              />
            </label>
          </div>
          {isDivision ? (
            <div className="controls__actions">
              <div className="segmented segmented--filters">
                <button
                  className={`segmented__sfx-toggle${sfxOnly ? " active" : ""}`}
                  onClick={() => setSfxOnly((current) => !current)}
                  aria-pressed={sfxOnly}
                >
                  <Volume2 aria-hidden="true" />
                  효과음 있는 스트리머만
                </button>
                <button
                  className={`segmented__trophy-toggle${achievementOnly ? " active" : ""}`}
                  onClick={() => setAchievementOnly((current) => !current)}
                  aria-pressed={achievementOnly}
                >
                  <Trophy aria-hidden="true" />
                  업적 달성자만
                </button>
                <button
                  className={activityOnly ? "active" : ""}
                  onClick={() => setActivityOnly((current) => !current)}
                  aria-pressed={activityOnly}
                >
                  활동글 작성자만
                </button>
              </div>
              <button
                className="copy-list-button"
                type="button"
                onClick={handleCopyDivisionList}
              >
                <Copy aria-hidden="true" /> 목록 복사
              </button>
              <button
                className="copy-list-button"
                type="button"
                onClick={handleDownloadDivisionList}
              >
                <Download aria-hidden="true" /> 엑셀 다운로드
              </button>
            </div>
          ) : (
            <div className="segmented">
              {(["all", "pending", "completed"] as const).map((value) => (
                <button
                  key={value}
                  className={evaluationFilter === value ? "active" : ""}
                  onClick={() => setEvaluationFilter(value)}
                >
                  {value === "all"
                    ? "전체"
                    : value === "pending"
                      ? "대결 전"
                      : "대결 완료"}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
      {isDivision && (
        <section className="view-toolbar" aria-label="보기 설정">
          <div className="division-summary" aria-label="신청 현황 요약">
            <div className="division-summary__stats">
              <div
                className="division-summary__item division-summary__item--total"
                tabIndex={0}
              >
                <Users aria-hidden="true" />
                <div>
                  <strong>{divisionStats.total}</strong>
                  <span>총 신청자</span>
                </div>
                <span role="tooltip">
                  매일 오전 9시에 잔디동 모집글 댓글 기준으로 자동 업데이트 됩니다.
                </span>
              </div>
              <div className="division-summary__item division-summary__item--reported">
                <CheckCircle2 aria-hidden="true" />
                <div>
                  <strong>{divisionStats.reported}</strong>
                  <span>승격 보고</span>
                </div>
              </div>
              <div className="division-summary__item division-summary__item--unreported">
                <Clock aria-hidden="true" />
                <div>
                  <strong>{divisionStats.unreported}</strong>
                  <span>미보고</span>
                </div>
              </div>
            </div>
            <DivisionHistogram streamers={snapshot?.streamers ?? []} />
          </div>
          <div className="view-toolbar__controls">
            {viewMode === "card" && (
              <div className="segmented segmented--zoom">
                <button
                  onClick={handleZoomOut}
                  disabled={cardZoom <= CARD_ZOOM_MIN}
                  aria-label="카드 축소"
                >
                  <Minus aria-hidden="true" />
                </button>
                <button
                  onClick={handleZoomIn}
                  disabled={cardZoom >= CARD_ZOOM_MAX}
                  aria-label="카드 확대"
                >
                  <Plus aria-hidden="true" />
                </button>
              </div>
            )}
            {viewMode === "card" && (
              <div className="segmented">
                <button
                  className={sortMode === "division" ? "active" : ""}
                  onClick={() => setSortMode("division")}
                  aria-pressed={sortMode === "division"}
                >
                  디비전순
                </button>
                <button
                  className={sortMode === "winRate" ? "active" : ""}
                  onClick={() => setSortMode("winRate")}
                  aria-pressed={sortMode === "winRate"}
                >
                  승률순
                </button>
              </div>
            )}
            <div className="segmented segmented--view-mode">
              <button
                className={viewMode === "list" ? "active" : ""}
                onClick={() => {
                  setViewMode("list");
                  saveViewMode("list");
                }}
                aria-pressed={viewMode === "list"}
                aria-label="목록 보기"
              >
                <List aria-hidden="true" />
              </button>
              <button
                className={`segmented__card-view-toggle ${
                  viewMode === "card" ? "active" : ""
                } ${cardViewDiscovered ? "" : "fancy-border view-toggle-card--attention"}`}
                onClick={() => {
                  setViewMode("card");
                  saveViewMode("card");
                  if (!cardViewDiscovered) {
                    markCardViewDiscovered();
                    setCardViewDiscovered(true);
                  }
                }}
                aria-pressed={viewMode === "card"}
                style={
                  cardViewDiscovered
                    ? undefined
                    : ({
                        "--fancy-color": "#00e9ae",
                        "--fancy-glow-soft": hexToRgba("#00e9ae", 0.4),
                        "--fancy-glow-strong": hexToRgba("#00e9ae", 0.85),
                      } as React.CSSProperties)
                }
              >
                <Shield aria-hidden="true" />
                <span>카드뷰로 보기</span>
                {!cardViewDiscovered && (
                  <span className="view-toggle-card__sparks" aria-hidden="true">
                    <i className="view-toggle-card__spark view-toggle-card__spark--1">
                      ✦
                    </i>
                    <i className="view-toggle-card__spark view-toggle-card__spark--2">
                      ✦
                    </i>
                    <i className="view-toggle-card__spark view-toggle-card__spark--3">
                      ✦
                    </i>
                    <i className="view-toggle-card__spark view-toggle-card__spark--4">
                      ✦
                    </i>
                    <i className="view-toggle-card__spark view-toggle-card__spark--5">
                      ✦
                    </i>
                  </span>
                )}
              </button>
            </div>
          </div>
        </section>
      )}
      {isDivision ? (
        viewMode === "list" ? (
          <section className="board" aria-label="FC26 디비전 보드">
            {divisions.map((division) => {
              const entries = streamers.filter(
                (streamer) => streamer.currentDivision === division,
              );
              return (
                <section
                  className={`division division-${division}`}
                  style={
                    {
                      "--division-color": divisionColor(division),
                    } as React.CSSProperties
                  }
                  key={division}
                >
                  <div className="division__label">
                    <span>{division === 10 ? "SEASON" : "DIVISION"}</span>
                    <strong>{division}</strong>
                    {division === 10 && <small>미참여</small>}
                  </div>
                  <div className="division__players">
                    {entries.map((streamer) => (
                      <StreamerCard
                        key={streamer.id}
                        streamer={streamer}
                        awards={trophyAwards}
                        isNew={
                          isUpdatedToday(streamer) &&
                          !seenKeys.has(seenKeyFor(streamer))
                        }
                        onOpen={() => openStreamer(streamer)}
                      />
                    ))}
                    {entries.length === 0 && (
                      <p className="vacant">
                        {division === 10
                          ? "시즌 미참여 후보 없음"
                          : "후보 대기 중"}
                      </p>
                    )}
                  </div>
                </section>
              );
            })}
          </section>
        ) : (
          <CardBoard
            streamers={cardStreamers}
            awards={trophyAwards}
            zoom={cardZoom}
            onOpen={openStreamer}
          />
        )
      ) : (
        <section className="evaluation-list" aria-label="1대1 평가 신청 목록">
          {applications.map((application) => (
            <EvaluationCard
              key={application.articleId}
              application={application}
              onOpen={() => setSelectedApplication(application)}
            />
          ))}
          {applications.length === 0 && (
            <p className="empty-list">표시할 1대1 평가 신청자가 없습니다.</p>
          )}
        </section>
      )}
      <footer>
        왁물원 카페 게시글 기반 · 마지막 동기화{" "}
        {snapshot ? formatDateTime(snapshot.generatedAt) : "확인 중"}
      </footer>
      {selected && (
        <DetailModal
          streamer={selected}
          awards={trophyAwards}
          onClose={() => {
            stopSfx();
            setSelected(undefined);
          }}
          latestPosts={snapshot?.latestPosts}
          sfxVolume={sfxVolume}
        />
      )}
      {selectedApplication && (
        <EvaluationModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(undefined)}
        />
      )}
      {trophyOpen && (
        <TrophyModal
          awards={trophyAwards}
          onClose={() => setTrophyOpen(false)}
        />
      )}
      {feedOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => setFeedOpen(false)}
        >
          <aside
            className="feed"
            role="dialog"
            aria-modal="true"
            aria-label="최신 소식"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="close"
              onClick={() => setFeedOpen(false)}
              aria-label="닫기"
            >
              ×
            </button>
            <p className="eyebrow">LAST 24 HOURS</p>
            <h2>최신 소식</h2>
            {latest.length ? (
              latest.slice(0, 25).map((post) => (
                <a
                  href={post.articleUrl}
                  target="_blank"
                  rel="noreferrer"
                  key={post.articleId}
                >
                  <span>{post.category}</span>
                  <strong>{post.title}</strong>
                  <small>
                    {post.cafeAuthor} · {formatCafePostDate(post.publishedAt)}
                  </small>
                </a>
              ))
            ) : (
              <p className="empty-list">
                최근 24시간 내 등록된 디비전 보고가 없습니다.
              </p>
            )}
          </aside>
        </div>
      )}
      <div className="floating-toolbar">
        <SfxToggle
          enabled={sfxEnabled}
          volume={sfxVolume}
          onToggle={toggleSfx}
          onVolumeChange={changeSfxVolume}
          highlight={sfxIntroVisible}
        />
        <MusicPlayer />
      </div>
      {sfxIntroVisible && (
        <SfxIntroNotice
          enabled={sfxEnabled}
          volume={sfxVolume}
          onToggle={toggleSfx}
          onVolumeChange={changeSfxVolume}
          onDismiss={() => setSfxIntroVisible(false)}
          onAcknowledge={markSfxHeard}
        />
      )}
      {pendingAnnouncements.length > 0 && (
        <AnnouncementModal
          announcements={pendingAnnouncements}
          onClose={() => setPendingAnnouncements([])}
          onAcknowledge={() => {
            markAnnouncementsSeen(
              pendingAnnouncements.map((announcement) => announcement.id),
            );
            setPendingAnnouncements([]);
          }}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </main>
  );
}

function searchable(displayName: string, aliases: string[], query: string) {
  return [displayName, ...aliases]
    .join(" ")
    .toLocaleLowerCase("ko-KR")
    .includes(query.toLocaleLowerCase("ko-KR"));
}

/**
 * `?fancyMembers=` lets a URL grant the fancy treatment on top of whatever
 * roster.yaml already sets via isFancy. `all` (case-insensitive) applies it
 * to every streamer; otherwise each comma-separated entry is matched against
 * a streamer's slug, SOOP ID, display name, or cafe aliases.
 */
function parseFancyMembersParam(search: string): { all: boolean; matchers: Set<string> } {
  const raw = new URLSearchParams(search).get("fancyMembers");
  const parts = (raw ?? "")
    .split(",")
    .map((part) => part.trim().toLocaleLowerCase("ko-KR"))
    .filter(Boolean);
  return { all: parts.includes("all"), matchers: new Set(parts) };
}

function matchesFancyMembers(streamer: StreamerRecord, matchers: Set<string>): boolean {
  const candidates = [streamer.id, streamer.soopId, streamer.displayName, ...streamer.cafeAliases].filter(
    (value): value is string => Boolean(value),
  );
  return candidates.some((candidate) => matchers.has(candidate.toLocaleLowerCase("ko-KR")));
}

function applyFancyMembersOverride(snapshot: DashboardSnapshot, search: string): DashboardSnapshot {
  const { all, matchers } = parseFancyMembersParam(search);
  if (!all && matchers.size === 0) return snapshot;
  return {
    ...snapshot,
    streamers: snapshot.streamers.map((streamer) => ({
      ...streamer,
      isFancy: streamer.isFancy || all || matchesFancyMembers(streamer, matchers),
    })),
  };
}

function buildDivisionListText(streamers: StreamerRecord[]) {
  return divisions
    .map((division) => {
      const label = division === 10 ? "10부(미보고)" : `${division}부`;
      const names = streamers
        .filter((streamer) => streamer.currentDivision === division)
        .map((streamer) => streamer.displayName);
      return `- ${label}: ${names.length ? names.join(", ") : "-"}`;
    })
    .join("\n");
}
