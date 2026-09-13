import { useEffect, useRef, useState } from "react";
import type { StreamerRecord } from "../../shared/model.js";
import type { TrophyBadge } from "../../shared/trophy.js";
import { Avatar, FifaShield } from "../cardVisuals.js";
import { getHallOfFameEmblemUrl, getHallOfFameGlowUrl } from "./hallOfFameArt.js";
import { getHallOfFameTheme, tierTint } from "./hallOfFameTheme.js";

export type HallOfFameStatLine = {
  label: string;
  value: string;
  emphasis?: boolean;
};

/**
 * The trophy medallion card — deliberately a different shape/material from
 * TotyCardVisual's vertical fantasy trading card: a circular engraved-metal
 * medal (one AI emblem per trophy category, not per streamer) with the
 * winner's existing avatar composited into a circular inset, sitting above
 * an engraved name plate. Tilt/glare/foil reuse the same
 * mouse-move-plus-requestAnimationFrame technique as TotyCardVisual, just
 * tuned down (a medal is "heavier" than a character card) and applied to a
 * disc instead of a shield.
 */
export function HallOfFameCardVisual({
  streamer,
  categoryKey,
  tier,
  medal,
  statLines,
  quote,
  entranceDelayMs = 0,
  onCardClick,
}: {
  streamer: Pick<StreamerRecord, "id" | "displayName" | "profileImageUrl" | "soopId">;
  categoryKey: TrophyBadge["key"];
  /** division-one only — drives the gold/silver/bronze tint of the shared emblem art. */
  tier?: 1 | 2 | 3;
  /** 🥇🥈🥉, division-one only. */
  medal?: string;
  statLines: HallOfFameStatLine[];
  /** One-off flavor caption (e.g. 노력왕's fixed pick) shown below the stat lines. */
  quote?: string;
  /** Staggered entrance delay set by HallOfFameWinnerGrid when the modal opens. */
  entranceDelayMs?: number;
  onCardClick?: () => void;
}) {
  const baseTheme = getHallOfFameTheme(categoryKey);
  const theme = tier ? tierTint(tier) : baseTheme;
  const emblemUrl = getHallOfFameEmblemUrl(categoryKey);
  const glowUrl = getHallOfFameGlowUrl(categoryKey);

  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, px: 50, py: 50, emblemX: 0, emblemY: 0, active: false });

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setTilt({
        // A medal is heavier/denser than a character card — noticeably
        // smaller rotation range than TotyCardVisual's rx/ry.
        rx: (0.5 - y) * 10,
        ry: (x - 0.5) * 12,
        px: x * 100,
        py: y * 100,
        emblemX: (x - 0.5) * -6,
        emblemY: (y - 0.5) * -6,
        active: true,
      });
    });
  };

  const handleMouseLeave = () => {
    cancelAnimationFrame(rafRef.current);
    setTilt((current) => ({ ...current, active: false, emblemX: 0, emblemY: 0 }));
  };

  return (
    <div className="hof-card-wrap" style={{ animationDelay: `${entranceDelayMs}ms` }}>
      <div
        ref={cardRef}
        className={`hof-card ${tilt.active ? "hof-card--active" : ""}`}
        onClick={onCardClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={
          {
            "--pointer-x": `${tilt.px}%`,
            "--pointer-y": `${tilt.py}%`,
            "--hof-color": theme.color,
            "--hof-glow": theme.glow,
            ...(tilt.active
              ? {
                  transform: `perspective(900px) translateY(-4px) scale(1.03) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
                }
              : {}),
          } as React.CSSProperties
        }
      >
        <div className="hof-card__disc">
          {emblemUrl ? (
            <img
              className="hof-card__emblem"
              src={emblemUrl}
              alt=""
              style={{ transform: `translate(${tilt.emblemX}px, ${tilt.emblemY}px)` }}
            />
          ) : (
            <span className="hof-card__emblem-fallback" aria-hidden="true">
              <FifaShield color={theme.color} holo={{ x: tilt.px / 100, y: tilt.py / 100, opacity: tilt.active ? 0.55 : 0.2 }} />
            </span>
          )}
          {glowUrl && (
            // Separate wrapper (twinkles via CSS, independent of the mouse)
            // around the <img> (mouse-parallax via inline transform) — same
            // split as toty-card.css's .toty-card__idle-glow, so the two
            // transforms don't fight over the same element.
            <div className="hof-card__idle-glow">
              <img
                className="hof-card__glow"
                src={glowUrl}
                alt=""
                aria-hidden="true"
                style={{ transform: `translate(${tilt.emblemX}px, ${tilt.emblemY}px)` }}
              />
            </div>
          )}
          <span className="hof-card__glare" aria-hidden="true" />
          <span className="hof-card__foil" aria-hidden="true" />
        </div>
        {/* Sibling of .hof-card__disc (not a child) — the disc clips its own
            overflow, which would cut off this badge where it pokes above
            the rim. Centered at the top rather than the corner so it reads
            like a rank pin sitting at 12 o'clock on the medal ribbon. */}
        {medal && (
          <span className="hof-card__rank" aria-hidden="true">
            {medal}
          </span>
        )}
        <div className="hof-card__plate">
          {/* Avatar sits beside the name, not over the medal — centering it
              in the disc used to hide most of the emblem art underneath. */}
          <div className="hof-card__identity">
            <span className="hof-card__avatar-ring">
              <Avatar {...streamer} />
            </span>
            <strong className="hof-card__name">{streamer.displayName}</strong>
          </div>
          {/* min-height reserved in CSS so a statless card (e.g. 노력왕,
              which has no metric) still matches every other card's height —
              otherwise every .trophy-award section's box height depended on
              which categories happened to have stat lines. */}
          <div className="hof-card__stats">
            {statLines.map((line) => (
              <span
                className={`hof-card__stat ${line.emphasis ? "hof-card__stat--emphasis" : ""}`}
                key={line.label}
              >
                <span className="hof-card__stat-label">{line.label}</span>
                <span className="hof-card__stat-value">{line.value}</span>
              </span>
            ))}
            {quote && <p className="hof-card__quote">{quote}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
