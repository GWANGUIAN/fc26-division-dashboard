import { useRef, useState, type ReactNode } from "react";
import { Minus, Plus, Volume2 } from "lucide-react";
import { defaultSoopProfileUrl, type StreamerRecord } from "../shared/model.js";
import { formatBoardPostDate, HANGUL_PATTERN } from "../shared/dates.js";
import { winRatePercent } from "../shared/record-extraction.js";
import { divisionColor } from "../shared/division-theme.js";
import type { TrophyAwards } from "../shared/trophy.js";
import {
  AchievementBadges,
  fancyTierOf,
  FancyAvatar,
  FancyName,
  hexToRgba,
  isStreamerSavior,
  mixHex,
  RecordBadge,
  saviorCssVars,
  SaviorAvatar,
  SaviorName,
  SaviorTag,
} from "./cardVisuals";
import { DivisionSigil } from "./divisionSigils";

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
  const savior = isStreamerSavior(streamer);
  const rate = streamer.record ? winRatePercent(streamer.record) : undefined;
  return (
    <button
      className={`streamer-card ${isNew ? "streamer-card--new" : ""} ${tier !== "none" ? "fancy-border" : ""} ${lite ? "fancy-border--lite" : ""} ${savior ? "savior-border" : ""}`}
      onClick={onOpen}
      aria-label={`${streamer.displayName} 상세 보기${isNew ? " (24시간 이내 업데이트됨)" : ""}`}
      style={
        tier !== "none" || savior
          ? ({
              ...(tier !== "none"
                ? {
                    "--fancy-color": fancyColor,
                    "--fancy-glow-soft": hexToRgba(fancyColor, lite ? 0.16 : 0.4),
                    "--fancy-glow-strong": hexToRgba(fancyColor, lite ? 0.35 : 0.9),
                  }
                : {}),
              ...(savior ? saviorCssVars() : {}),
            } as React.CSSProperties)
          : undefined
      }
    >
      <span className="streamer-card__avatar">
        <SaviorAvatar streamer={streamer}>
          <FancyAvatar streamer={streamer} />
        </SaviorAvatar>
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
          <SaviorName streamer={streamer}>
            <FancyName streamer={streamer} tag="strong">
              {streamer.displayName}
            </FancyName>
          </SaviorName>
          <AchievementBadges
            streamer={streamer}
            awards={awards}
            onClick={onOpenTrophy}
          />
        </span>
        <span className="streamer-card__record-row">
          <RecordBadge streamer={streamer} />
          {rate !== undefined && (
            <span className="record-badge__rate">({rate.toFixed(1)}%)</span>
          )}
        </span>
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
  const savior = isStreamerSavior(streamer);
  const lastPostLabel = streamer.lastPost
    ? formatBoardPostDate(streamer.lastPost.publishedAt)
    : "첫 보고 대기";
  const photoSrc = streamer.profileImageUrl ?? defaultSoopProfileUrl(streamer.soopId);
  const cardRef = useRef<HTMLButtonElement>(null);
  const [tilt, setTilt] = useState({
    rx: 0,
    ry: 0,
    px: 50,
    py: 50,
    active: false,
  });

  const handleMouseMove = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    setTilt({
      rx: (0.5 - y) * 34,
      ry: (x - 0.5) * 38,
      px: x * 100,
      py: y * 100,
      active: true,
    });
  };
  const handleMouseLeave = () =>
    setTilt((current) => ({ ...current, active: false }));

  return (
    <button
      ref={cardRef}
      className={`fifa-card fifa-card--holo ${tilt.active ? "fifa-card--active" : ""} ${savior ? "fifa-card--savior" : ""}`}
      onClick={onOpen}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={
        {
          "--division-color": color,
          "--division-color-soft": hexToRgba(color, 0.65),
          "--division-color-dark": mixHex(color, "black", 0.5),
          ...(savior ? saviorCssVars() : {}),
          "--pointer-x": `${tilt.px}%`,
          "--pointer-y": `${tilt.py}%`,
          ...(tilt.active
            ? {
                transform: `perspective(750px) translateY(-6px) scale(1.045) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
              }
            : {}),
        } as React.CSSProperties
      }
      aria-label={`${streamer.displayName} 상세 보기`}
    >
      <span
        className="fifa-card__bg"
        style={{
          background: `linear-gradient(155deg, ${hexToRgba(color, 0.5)}, ${hexToRgba(mixHex(color, "black", 0.55), 0.92)} 55%, #07080a 100%)`,
        }}
        aria-hidden="true"
      />
      <span className="fifa-card__vignette" aria-hidden="true" />
      <DivisionSigil
        division={streamer.currentDivision}
        className="fifa-card__sigil"
      />
      <span className="fifa-card__glare" aria-hidden="true" />
      <span className="fifa-card__foil" aria-hidden="true" />
      <span className="fifa-card__body">
        <span className="fifa-card__header">
          <span className="fifa-card__name">
            <span className="fifa-card__name-text">
              <SaviorName streamer={streamer}>
                <FancyName streamer={streamer} color={color} tag="strong">
                  {streamer.displayName}
                </FancyName>
              </SaviorName>
            </span>
            <AchievementBadges
              streamer={streamer}
              awards={awards}
              onClick={onOpenTrophy}
            />
          </span>
          <span className="fifa-card__hp">
            <span className="fifa-card__hp-label">DIV</span>
            <b className="fifa-card__hp-value">{streamer.currentDivision}</b>
          </span>
        </span>
        <span className="fifa-card__photo">
          <span
            className="fifa-card__photo-blur"
            style={{ backgroundImage: `url(${photoSrc})` }}
            aria-hidden="true"
          />
          <span className="fifa-card__photo-sunburst" aria-hidden="true" />
          <span className="fifa-card__photo-fade" aria-hidden="true" />
          <span
            className="fifa-card__photo-fg"
            style={{ backgroundImage: `url(${photoSrc})` }}
          >
            <SaviorTag streamer={streamer} />
            {streamer.sfx && (
              <Volume2 className="fifa-card__sfx-badge" aria-hidden="true" />
            )}
            {!streamer.isMapped && (
              <span className="unmapped" title="SOOP 정보 미연결">
                카페
              </span>
            )}
          </span>
        </span>
        <span className="fifa-card__stats">
          <span className="fifa-card__stat">
            <span className="fifa-card__stat-key">
              <span className="fifa-card__stat-icon" aria-hidden="true" />
              <span className="fifa-card__stat-label">전적</span>
            </span>
            <RecordBadge streamer={streamer} className="fifa-card__stat-value" />
          </span>
          <span className="fifa-card__stat">
            <span className="fifa-card__stat-key">
              <span className="fifa-card__stat-icon" aria-hidden="true" />
              <span className="fifa-card__stat-label">승률</span>
            </span>
            <b className="fifa-card__stat-value">
              {rate !== undefined ? `${rate.toFixed(1)}%` : "-"}
            </b>
          </span>
          <span className="fifa-card__stat">
            <span className="fifa-card__stat-key">
              <span className="fifa-card__stat-icon" aria-hidden="true" />
              <span className="fifa-card__stat-label">최근 승급일</span>
            </span>
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
