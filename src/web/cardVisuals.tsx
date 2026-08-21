import { useId, useState, type ReactNode } from "react";
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

export function hexToRgba(hex: string, alpha: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function AchievementBadges({
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
