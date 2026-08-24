import {
  useId,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import type { StreamerRecord } from "../shared/model.js";
import { defaultSoopProfileUrl } from "../shared/model.js";
import { recordExtractionStatus } from "../shared/record-extraction.js";
import { trophyBadgesFor, type TrophyAwards } from "../shared/trophy.js";

export function Avatar({
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

export const FANCY_SPARK_SLOTS = [1, 2, 3, 4, 5, 6] as const;
export const FANCY_LITE_SPARK_SLOTS = [1, 2] as const;

export type FancyTier = "full" | "lite" | "none";

/** isFancyLite is ignored once isFancy is set, so a streamer never gets both effects at once. */
export function fancyTierOf(
  streamer: Pick<StreamerRecord, "isFancy" | "isFancyLite">,
): FancyTier {
  if (streamer.isFancy) return "full";
  if (streamer.isFancyLite) return "lite";
  return "none";
}

export function isStreamerFancy(
  streamer: Pick<StreamerRecord, "isFancy">,
): boolean {
  return !!streamer.isFancy;
}

export function isStreamerFancyLite(
  streamer: Pick<StreamerRecord, "isFancy" | "isFancyLite">,
): boolean {
  return fancyTierOf(streamer) === "lite";
}

/** The lite tier washes the given color toward white so it barely reads as decoration. */
function fancyCssVars(color: string, tier: "full" | "lite"): React.CSSProperties {
  const tint = tier === "lite" ? mixHex(color, "white", 0.65) : color;
  return {
    "--fancy-color": tint,
    "--fancy-glow-soft": hexToRgba(tint, tier === "lite" ? 0.16 : 0.4),
    "--fancy-glow-strong": hexToRgba(tint, tier === "lite" ? 0.35 : 0.85),
  } as React.CSSProperties;
}

export function FancyAvatar({
  streamer,
  color = "#00e9ae",
  ring = true,
}: {
  streamer: StreamerRecord;
  color?: string;
  ring?: boolean;
}) {
  const tier = fancyTierOf(streamer);
  if (tier === "none") return <Avatar {...streamer} />;
  const lite = tier === "lite";
  return (
    <span
      className={`fancy-avatar ${ring ? "fancy-avatar--ring" : ""} ${lite ? "fancy-avatar--lite" : ""}`}
      style={fancyCssVars(color, tier)}
    >
      <Avatar {...streamer} />
      <span
        className={`fancy-avatar__sparks ${lite ? "fancy-avatar__sparks--lite" : ""}`}
        aria-hidden="true"
      >
        {(lite ? FANCY_LITE_SPARK_SLOTS : FANCY_SPARK_SLOTS).map((slot) => (
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

export const FANCY_NAME_SPARK_SLOTS = [1, 2, 3] as const;
export const FANCY_NAME_LITE_SPARK_SLOTS = [1] as const;

export function FancyName({
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
  const tier = fancyTierOf(streamer);
  if (tier === "none") return <Tag>{children}</Tag>;
  const lite = tier === "lite";
  return (
    <span
      className={`fancy-name ${lite ? "fancy-name--lite" : ""}`}
      style={fancyCssVars(color, tier)}
    >
      <Tag className="fancy-name__text">{children}</Tag>
      <span
        className={`fancy-name__sparks ${lite ? "fancy-name__sparks--lite" : ""}`}
        aria-hidden="true"
      >
        {(lite ? FANCY_NAME_LITE_SPARK_SLOTS : FANCY_NAME_SPARK_SLOTS).map(
          (slot) => (
            <i
              className={`fancy-name__spark fancy-name__spark--${slot}`}
              key={slot}
            >
              ✦
            </i>
          ),
        )}
      </span>
    </span>
  );
}

export const SAVIOR_COLOR = "#ffd76a";

export function isStreamerSavior(
  streamer: Pick<StreamerRecord, "isSavior">,
): boolean {
  return !!streamer.isSavior;
}

export function saviorCssVars(): React.CSSProperties {
  return {
    "--savior-color": SAVIOR_COLOR,
    "--savior-glow-soft": hexToRgba(SAVIOR_COLOR, 0.32),
    "--savior-glow-strong": hexToRgba(SAVIOR_COLOR, 0.85),
  } as React.CSSProperties;
}

/** Wraps an avatar with a halo ring + god-rays for isSavior streamers; a transparent passthrough otherwise. */
export function SaviorAvatar({
  streamer,
  children,
}: {
  streamer: Pick<StreamerRecord, "isSavior">;
  children: ReactNode;
}) {
  if (!isStreamerSavior(streamer)) return <>{children}</>;
  return (
    <span className="savior-avatar" style={saviorCssVars()}>
      <span className="savior-avatar__rays" aria-hidden="true" />
      {children}
    </span>
  );
}

/** Small "은인" chip anchored above an avatar (card-board view) for isSavior streamers. */
export function SaviorTag({
  streamer,
}: {
  streamer: Pick<StreamerRecord, "isSavior">;
}) {
  if (!isStreamerSavior(streamer)) return null;
  return (
    <span className="savior-tag" style={saviorCssVars()}>
      은인
    </span>
  );
}

/** Wraps a streamer's name with a warm golden glow for isSavior streamers; a transparent passthrough otherwise. */
export function SaviorName({
  streamer,
  children,
}: {
  streamer: Pick<StreamerRecord, "isSavior">;
  children: ReactNode;
}) {
  if (!isStreamerSavior(streamer)) return <>{children}</>;
  return (
    <span className="savior-name" style={saviorCssVars()}>
      {children}
    </span>
  );
}

export function mixHex(
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

export const FIFA_SHIELD_OUTER =
  "M 150,6 C 215,6 270,14 286,28 C 295,36 298,46 298,60 L 298,350 C 298,370 278,400 150,444 C 22,400 2,370 2,350 L 2,60 C 2,46 5,36 14,28 C 30,14 85,6 150,6 Z";
export const FIFA_SHIELD_INNER =
  "M 150,14 C 210,14 262,21 278,33 C 285,39 288,48 288,60 L 288,346 C 288,363 269,391 150,432 C 31,391 12,363 12,346 L 12,60 C 12,48 15,39 22,33 C 38,21 90,14 150,14 Z";

export function FifaShield({
  color,
  holo,
  savior,
}: {
  color: string;
  holo?: { x: number; y: number; opacity: number };
  savior?: boolean;
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
      {savior && (
        <path className="fifa-card__shield-glow" d={FIFA_SHIELD_OUTER} />
      )}
    </svg>
  );
}

/**
 * Gold division-rank emblem (banner + striped shield + ball), based on a
 * supplied artwork template. The template ships blank (no digits printed on
 * it) so the division number is drawn in as its own gradient-filled <text>
 * layer in the shield's body, between the "DIV" banner and the ball icon.
 * Gradient/pattern/clip ids are scoped with useId since many of these render
 * on one page (one per card) and SVG ids are a global namespace.
 */
export function DivisionBadge({
  division,
  className = "",
}: {
  division: number;
  className?: string;
}) {
  const uid = useId();
  const outerId = `${uid}-outer`;
  const innerId = `${uid}-inner`;
  const bannerId = `${uid}-banner`;
  const bgId = `${uid}-bg`;
  const stripesId = `${uid}-stripes`;
  const clipId = `${uid}-clip`;
  const numberId = `${uid}-number`;

  return (
    <svg
      className={`division-badge ${className}`}
      viewBox="0 0 300 380"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={outerId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF7B8" />
          <stop offset="30%" stopColor="#E2B73B" />
          <stop offset="70%" stopColor="#93721C" />
          <stop offset="100%" stopColor="#4A3708" />
        </linearGradient>
        <linearGradient id={innerId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF1A1" />
          <stop offset="45%" stopColor="#DCAE32" />
          <stop offset="100%" stopColor="#856314" />
        </linearGradient>
        <linearGradient id={bannerId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF5B2" />
          <stop offset="50%" stopColor="#E5C14B" />
          <stop offset="100%" stopColor="#B08A23" />
        </linearGradient>
        <linearGradient id={bgId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#252527" />
          <stop offset="100%" stopColor="#0E0E0F" />
        </linearGradient>
        <linearGradient id={numberId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFAD8" />
          <stop offset="38%" stopColor="#FFDE72" />
          <stop offset="70%" stopColor="#E2A93A" />
          <stop offset="100%" stopColor="#8B5F12" />
        </linearGradient>
        <pattern
          id={stripesId}
          width="26"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <rect x="0" y="0" width="13" height="10" fill="#2D2D30" />
          <rect x="13" y="0" width="13" height="10" fill="#18181A" />
        </pattern>
        <clipPath id={clipId}>
          <path d="M 150 28 L 263 48 L 263 112 L 37 112 L 37 48 Z" />
        </clipPath>
      </defs>

      <path
        d="M 150 12 L 277 35 L 277 277 L 150 368 L 23 277 L 23 35 Z"
        fill={`url(#${outerId})`}
      />
      <path
        d="M 150 18 L 271 39 L 271 273 L 150 361 L 29 273 L 29 39 Z"
        fill="#1A150A"
        opacity={0.4}
      />
      <path
        d="M 150 22 L 267 43 L 267 271 L 150 355 L 33 271 L 33 43 Z"
        fill={`url(#${innerId})`}
      />
      <path
        d="M 150 28 L 263 48 L 263 268 L 150 350 L 37 268 L 37 48 Z"
        fill={`url(#${bgId})`}
      />
      <path
        d="M 150 28 L 263 48 L 263 268 L 150 350 L 37 268 L 37 48 Z"
        fill={`url(#${stripesId})`}
      />

      <g clipPath={`url(#${clipId})`}>
        <rect x="30" y="20" width="240" height="100" fill={`url(#${bannerId})`} />
      </g>
      <line x1="37" y1="112" x2="263" y2="112" stroke="#120E06" strokeWidth={3} />
      <line
        x1="37"
        y1="114"
        x2="263"
        y2="114"
        stroke="#FFF1A1"
        strokeWidth={1.5}
        opacity={0.5}
      />

      <text
        x="150"
        y="90"
        textAnchor="middle"
        fontFamily="'Arial Black', 'Impact', sans-serif"
        fontWeight={900}
        fontSize={52}
        fill="#0A0A0A"
        letterSpacing={1}
      >
        DIV
      </text>

      <text
        x="150"
        y="200"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="'Arial Black', 'Impact', sans-serif"
        fontWeight={900}
        fontSize={130}
        fill={`url(#${numberId})`}
        stroke="#241804"
        strokeWidth={4}
        paintOrder="stroke fill"
      >
        {division}
      </text>

      <g transform="translate(150, 305)">
        <circle
          cx="0"
          cy="0"
          r="23"
          fill={`url(#${bannerId})`}
          stroke="#0D0D0E"
          strokeWidth={2.5}
        />
        <polygon
          points="0,-7 6.6,-2.1 4.1,5.6 -4.1,5.6 -6.6,-2.1"
          fill="#0D0D0E"
        />
        <line x1="0" y1="-7" x2="0" y2="-22" stroke="#0D0D0E" strokeWidth={2} />
        <line
          x1="6.6"
          y1="-2.1"
          x2="21"
          y2="-7"
          stroke="#0D0D0E"
          strokeWidth={2}
        />
        <line x1="4.1" y1="5.6" x2="13" y2="18" stroke="#0D0D0E" strokeWidth={2} />
        <line
          x1="-4.1"
          y1="5.6"
          x2="-13"
          y2="18"
          stroke="#0D0D0E"
          strokeWidth={2}
        />
        <line
          x1="-6.6"
          y1="-2.1"
          x2="-21"
          y2="-7"
          stroke="#0D0D0E"
          strokeWidth={2}
        />
        <polygon points="0,-23 -6,-18 6,-18" fill="#0D0D0E" />
        <polygon points="22,-8 16,-1 20,6" fill="#0D0D0E" />
        <polygon points="14,19 7,21 16,13" fill="#0D0D0E" />
        <polygon points="-14,19 -7,21 -16,13" fill="#0D0D0E" />
        <polygon points="-22,-8 -16,-1 -20,6" fill="#0D0D0E" />
      </g>
    </svg>
  );
}

export function hexToRgba(hex: string, alpha: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function AchievementBadges({
  streamer,
  awards,
  onClick,
}: {
  streamer: StreamerRecord;
  awards: TrophyAwards;
  onClick?: () => void;
}) {
  const badges = trophyBadgesFor(streamer, awards);
  if (!badges.length) return null;
  const handleClick = (event: MouseEvent) => {
    if (!onClick) return;
    // Badges usually sit inside a larger clickable card/row that opens the
    // detail modal — stop the click there so only the trophy modal opens.
    event.stopPropagation();
    onClick();
  };
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!onClick) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      onClick();
    }
  };
  return (
    <span
      className={`achievement-badges${onClick ? " achievement-badges--clickable" : ""}`}
      aria-label={`${streamer.displayName} 업적${onClick ? " · 클릭하면 전체 업적 보기" : ""}`}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
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

export function RecordBadge({
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
