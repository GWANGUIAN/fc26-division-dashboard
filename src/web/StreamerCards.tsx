import { useRef, useState, type ReactNode } from "react";
import { Minus, Plus, Volume2 } from "lucide-react";
import type { StreamerRecord } from "../shared/model.js";
import { formatBoardPostDate, HANGUL_PATTERN } from "../shared/dates.js";
import { winRatePercent } from "../shared/record-extraction.js";
import { divisionColor } from "../shared/division-theme.js";
import type { TrophyAwards } from "../shared/trophy.js";
import {
  AchievementBadges,
  DivisionBadge,
  fancyTierOf,
  FancyAvatar,
  FancyName,
  FifaShield,
  hexToRgba,
  mixHex,
  RecordBadge,
} from "./cardVisuals";

export function StreamerCard({
  streamer,
  awards,
  isNew,
  isLive,
  onOpen,
  onOpenTrophy,
}: {
  streamer: StreamerRecord;
  awards: TrophyAwards;
  isNew: boolean;
  isLive?: boolean;
  onOpen: () => void;
  onOpenTrophy?: () => void;
}) {
  const tier = fancyTierOf(streamer);
  const lite = tier === "lite";
  const fancyColor = lite ? mixHex("#00e9ae", "white", 0.65) : "#00e9ae";
  return (
    <button
      className={`streamer-card ${isNew ? "streamer-card--new" : ""} ${tier !== "none" ? "fancy-border" : ""} ${lite ? "fancy-border--lite" : ""}`}
      onClick={onOpen}
      aria-label={`${streamer.displayName} 상세 보기${isNew ? " (24시간 이내 업데이트됨)" : ""}`}
      style={
        tier !== "none"
          ? ({
              "--fancy-color": fancyColor,
              "--fancy-glow-soft": hexToRgba(fancyColor, lite ? 0.16 : 0.4),
              "--fancy-glow-strong": hexToRgba(fancyColor, lite ? 0.35 : 0.9),
            } as React.CSSProperties)
          : undefined
      }
    >
      <span className="streamer-card__avatar">
        <FancyAvatar streamer={streamer} />
        {isLive && (
          <span
            className="live-ring"
            role="img"
            aria-label={`${streamer.displayName} 방송중`}
            title="현재 방송중"
          />
        )}
        {streamer.sfx && (
          <Volume2 className="streamer-card__sfx-badge" aria-hidden="true" />
        )}
      </span>
      <span className="streamer-card__copy">
        <span className="streamer-card__name">
          <FancyName streamer={streamer} tag="strong">
            {streamer.displayName}
          </FancyName>
          <AchievementBadges
            streamer={streamer}
            awards={awards}
            onClick={onOpenTrophy}
          />
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

export function StreamerFifaCard({
  streamer,
  awards,
  onOpen,
  onOpenTrophy,
}: {
  streamer: StreamerRecord;
  awards: TrophyAwards;
  onOpen: () => void;
  onOpenTrophy?: () => void;
}) {
  const rate = streamer.record ? winRatePercent(streamer.record) : undefined;
  const color = divisionColor(streamer.currentDivision);
  const lastPostLabel = streamer.lastPost
    ? formatBoardPostDate(streamer.lastPost.publishedAt)
    : "첫 보고 대기";
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
      <DivisionBadge
        division={streamer.currentDivision}
        className="fifa-card__division"
      />
      <AchievementBadges
        streamer={streamer}
        awards={awards}
        onClick={onOpenTrophy}
      />
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
              {HANGUL_PATTERN.test(lastPostLabel) ? (
                <span className="fifa-card__stat-value-kr">
                  {lastPostLabel}
                </span>
              ) : (
                lastPostLabel
              )}
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

export function CardBoard({
  streamers,
  awards,
  zoom,
  onOpen,
  onOpenTrophy,
  onZoomIn,
  onZoomOut,
  zoomMin,
  zoomMax,
  railExtra,
}: {
  streamers: StreamerRecord[];
  awards: TrophyAwards;
  zoom: number;
  onOpen: (streamer: StreamerRecord) => void;
  onOpenTrophy?: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoomMin: number;
  zoomMax: number;
  railExtra?: ReactNode;
}) {
  return (
    <div className="card-board-wrap">
      <div className="card-board-zoom-rail">
        <div className="segmented segmented--zoom segmented--zoom-vertical">
          <button
            onClick={onZoomIn}
            disabled={zoom >= zoomMax}
            aria-label="카드 확대"
          >
            <Plus aria-hidden="true" />
          </button>
          <button
            onClick={onZoomOut}
            disabled={zoom <= zoomMin}
            aria-label="카드 축소"
          >
            <Minus aria-hidden="true" />
          </button>
        </div>
        {railExtra}
      </div>
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
            onOpenTrophy={onOpenTrophy}
          />
        ))}
        {streamers.length === 0 && (
          <p className="empty-list">표시할 스트리머가 없습니다.</p>
        )}
      </section>
    </div>
  );
}
