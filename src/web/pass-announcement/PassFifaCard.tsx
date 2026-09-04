import type { CSSProperties } from "react";
import { defaultSoopProfileUrl, type StreamerRecord } from "../../shared/model.js";
import { formatBoardPostDate, HANGUL_PATTERN } from "../../shared/dates.js";
import { winRatePercent } from "../../shared/record-extraction.js";
import { divisionColor } from "../../shared/division-theme.js";
import {
  FANCY_LITE_SPARK_SLOTS,
  FANCY_SPARK_SLOTS,
  FancyName,
  fancyCssVars,
  fancyTierOf,
  hexToRgba,
  mixHex,
  PositionTags,
  RecordBadge,
} from "../cardVisuals.js";
import { DivisionSigil } from "../divisionSigils";

/**
 * Non-interactive, container-query-scaled re-creation of the main
 * dashboard's `.fifa-card` (see StreamerFifaCard in StreamerCards.tsx) for
 * use inside pass-announcement's candidate pool, pass list, drag overlay,
 * and reveal stage. Deliberately drops everything that depends on a
 * `<button>`/pointer-driven host — mouse-tilt, glare/foil sheen,
 * achievement badges, savior treatment — the same trade-off SquadBuilderCard
 * already makes for the same reason (dnd-kit owns `transform` while
 * dragging, and these compact contexts never open a detail modal).
 */
export function PassFifaCard({
  streamer,
  faceDown = false,
}: {
  streamer: StreamerRecord;
  /** Renders only the shell — background/vignette/sigil/gold border/DIV
   * badge, no name, photo, or stats — for the reveal stage's spinning
   * back face. Same component/classes as the revealed front so the two
   * states are visibly the same card, just with the identity hidden. */
  faceDown?: boolean;
}) {
  const color = divisionColor(streamer.currentDivision);
  const tier = fancyTierOf(streamer);
  const lite = tier === "lite";
  const rate = streamer.record ? winRatePercent(streamer.record) : undefined;
  const lastPostLabel = streamer.lastPost
    ? formatBoardPostDate(streamer.lastPost.publishedAt)
    : "첫 보고 대기";
  const photoSrc = streamer.profileImageUrl ?? defaultSoopProfileUrl(streamer.soopId);

  return (
    <div
      className={`pass-fifa-card ${tier !== "none" ? "pass-fifa-card--fancy" : ""} ${lite ? "pass-fifa-card--fancy-lite" : ""}`}
      style={
        {
          "--division-color": color,
          "--division-color-soft": hexToRgba(color, 0.65),
          "--division-color-dark": mixHex(color, "black", 0.5),
          ...(tier !== "none" ? fancyCssVars("#00e9ae", tier) : {}),
        } as CSSProperties
      }
    >
      <span
        className="pass-fifa-card__bg"
        style={{
          background: `linear-gradient(155deg, ${hexToRgba(color, 0.5)}, ${hexToRgba(mixHex(color, "black", 0.55), 0.92)} 55%, #07080a 100%)`,
        }}
        aria-hidden="true"
      />
      <span className="pass-fifa-card__vignette" aria-hidden="true" />
      <DivisionSigil
        division={streamer.currentDivision}
        className="pass-fifa-card__sigil"
      />
      <span className="pass-fifa-card__body">
        <span className="pass-fifa-card__header">
          {!faceDown && (
            <span className="pass-fifa-card__name">
              <span className="pass-fifa-card__name-text">
                <FancyName streamer={streamer} color={color} tag="strong">
                  {streamer.displayName}
                </FancyName>
              </span>
            </span>
          )}
          <span className="pass-fifa-card__hp">
            <span className="pass-fifa-card__hp-label">DIV</span>
            <b className="pass-fifa-card__hp-value">{streamer.currentDivision}</b>
          </span>
        </span>
        {!faceDown && (
        <span className="pass-fifa-card__photo">
          <span
            className="pass-fifa-card__photo-blur"
            style={{ backgroundImage: `url(${photoSrc})` }}
            aria-hidden="true"
          />
          <span className="pass-fifa-card__photo-sunburst" aria-hidden="true" />
          <span className="pass-fifa-card__photo-fade" aria-hidden="true" />
          {tier !== "none" && (
            <span
              className={`pass-fifa-card__photo-sparks ${lite ? "pass-fifa-card__photo-sparks--lite" : ""}`}
              aria-hidden="true"
            >
              {(lite ? FANCY_LITE_SPARK_SLOTS : FANCY_SPARK_SLOTS).map((slot) => (
                <i
                  className={`pass-fifa-card__photo-spark pass-fifa-card__photo-spark--${slot}`}
                  key={slot}
                >
                  ✦
                </i>
              ))}
            </span>
          )}
          <span
            className="pass-fifa-card__photo-fg"
            style={{ backgroundImage: `url(${photoSrc})` }}
          >
            {!streamer.isMapped && (
              <span className="unmapped" title="SOOP 정보 미연결">
                카페
              </span>
            )}
          </span>
        </span>
        )}
        {!faceDown && (
        <span className="pass-fifa-card__stats">
          <span className="pass-fifa-card__stat">
            <span className="pass-fifa-card__stat-key">
              <span className="pass-fifa-card__stat-icon" aria-hidden="true" />
              <span className="pass-fifa-card__stat-label">전적</span>
            </span>
            <RecordBadge streamer={streamer} className="pass-fifa-card__stat-value" />
          </span>
          <span className="pass-fifa-card__stat">
            <span className="pass-fifa-card__stat-key">
              <span className="pass-fifa-card__stat-icon" aria-hidden="true" />
              <span className="pass-fifa-card__stat-label">승률</span>
            </span>
            <b className="pass-fifa-card__stat-value">
              {rate !== undefined ? `${rate.toFixed(1)}%` : "-"}
            </b>
          </span>
          <span className="pass-fifa-card__stat">
            <span className="pass-fifa-card__stat-key">
              <span className="pass-fifa-card__stat-icon" aria-hidden="true" />
              <span className="pass-fifa-card__stat-label">최근 승급일</span>
            </span>
            <b className="pass-fifa-card__stat-value">
              {HANGUL_PATTERN.test(lastPostLabel) ? (
                <span className="pass-fifa-card__stat-value-kr">
                  {lastPostLabel}
                </span>
              ) : (
                lastPostLabel
              )}
            </b>
          </span>
          {streamer.hopedPosition1 && (
            <span className="pass-fifa-card__stat">
              <span className="pass-fifa-card__stat-key">
                <span className="pass-fifa-card__stat-icon" aria-hidden="true" />
                <span className="pass-fifa-card__stat-label">희망 포지션</span>
              </span>
              <b className="pass-fifa-card__stat-value">
                <PositionTags streamer={streamer} />
              </b>
            </span>
          )}
        </span>
        )}
      </span>
    </div>
  );
}
