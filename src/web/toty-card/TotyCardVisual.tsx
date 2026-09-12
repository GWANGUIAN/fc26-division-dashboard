import { useEffect, useRef, useState } from "react";
import type { StreamerRecord } from "../../shared/model.js";
import type { TotyCardAssets } from "./totyCardAssets.js";
import { getTotyCardTextTheme } from "./totyCardTheme.js";

/**
 * The actual tilt/parallax/glare/foil/shadow card — used by the live popup
 * (TotyCardPopup) and by the offline capture page (TotyCardCapturePage,
 * driven by scripts/generate-toty-preview.mjs via synthetic mouse moves) so
 * the pre-rendered animated WebP preview is pixel-identical to what a real
 * hover looks like, with zero duplicated animation logic.
 */
export function TotyCardVisual({
  streamer,
  assets,
  onCardClick,
}: {
  streamer: Pick<StreamerRecord, "id" | "displayName" | "hopedPosition1" | "currentDivision">;
  assets: TotyCardAssets;
  onCardClick?: () => void;
}) {
  const textTheme = getTotyCardTextTheme(streamer.id);

  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const [tilt, setTilt] = useState({
    rx: 0,
    ry: 0,
    px: 50,
    py: 50,
    bgX: 0,
    bgY: 0,
    charX: 0,
    charY: 0,
    active: false,
  });

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setTilt({
        rx: (0.5 - y) * 22,
        ry: (x - 0.5) * 26,
        px: x * 100,
        py: y * 100,
        // Background moves the least, character a bit more — gives the
        // layers a sense of depth as the cursor moves (parallax).
        bgX: (x - 0.5) * -10,
        bgY: (y - 0.5) * -10,
        charX: (x - 0.5) * -22,
        charY: (y - 0.5) * -16,
        active: true,
      });
    });
  };

  const handleMouseLeave = () => {
    cancelAnimationFrame(rafRef.current);
    setTilt((current) => ({ ...current, active: false, bgX: 0, bgY: 0, charX: 0, charY: 0 }));
  };

  return (
    <div
      className={`toty-card-wrap ${tilt.active ? "toty-card-wrap--active" : ""}`}
      style={
        {
          // Declared here (not on .toty-card) so the shadow below — a
          // sibling, not a descendant of .toty-card — can also read this
          // player's theme color via inheritance.
          "--toty-text-color": textTheme.color,
          "--toty-text-glow": textTheme.glow,
        } as React.CSSProperties
      }
    >
      {/* A colored glow shadow in this player's own theme color, matching
          the card art instead of a generic dark blob — pulses on its own
          and flares brighter/faster while hovering. Follows the tilt
          horizontally so it still reads as "under" the floating card. */}
      <div
        className="toty-card-shadow"
        aria-hidden="true"
        style={{
          transform: `translateX(calc(-50% + ${tilt.active ? tilt.ry * 1.4 : 0}px))`,
        }}
      />
      <div
        ref={cardRef}
        className={`toty-card ${tilt.active ? "toty-card--active" : ""}`}
        onClick={onCardClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={
          {
            "--pointer-x": `${tilt.px}%`,
            "--pointer-y": `${tilt.py}%`,
            ...(tilt.active
              ? {
                  transform: `perspective(900px) translateY(-6px) scale(1.04) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
                }
              : {}),
          } as React.CSSProperties
        }
      >
        <div className="toty-card__window">
          <div className="toty-card__idle-bg">
            <img
              className="toty-card__bg"
              src={assets.background}
              alt=""
              fetchPriority="high"
              style={{ transform: `translate(${tilt.bgX}px, ${tilt.bgY}px) scale(1.06)` }}
            />
          </div>
          <div className="toty-card__idle-char">
            <img
              className="toty-card__char"
              src={assets.character}
              alt=""
              fetchPriority="high"
              style={{ transform: `translate(${tilt.charX}px, ${tilt.charY}px)` }}
            />
          </div>
          <span className="toty-card__glare" aria-hidden="true" />
          <span className="toty-card__foil" aria-hidden="true" />
        </div>
        <img className="toty-card__frame" src={assets.frame} alt="" fetchPriority="high" />

        <div className="toty-card__stats">
          {streamer.hopedPosition1 && (
            <b className="toty-card__pos">{streamer.hopedPosition1}</b>
          )}
          <span className="toty-card__div">D{streamer.currentDivision}</span>
        </div>
        <div className="toty-card__name" data-text={streamer.displayName}>
          {streamer.displayName}
        </div>
      </div>
    </div>
  );
}
