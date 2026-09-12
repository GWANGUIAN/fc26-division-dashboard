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
  backgroundGlowUrl,
  onCardClick,
  showGlow = true,
}: {
  streamer: Pick<StreamerRecord, "id" | "displayName" | "hopedPosition1" | "currentDivision">;
  assets: TotyCardAssets;
  /** Optional ambient light/particle overlay (see totyCardAssets.ts's
   * getBackgroundGlowUrl) — animates on its own via CSS so the card isn't
   * fully static while idle. Omitted entirely for a player without one yet. */
  backgroundGlowUrl?: string;
  onCardClick?: () => void;
  /** Off for the offline GIF capture (TotyCardCapturePage) — GIF's 1-bit
   * alpha can't do the glow's soft falloff, so it renders as a hard-edged
   * ring there instead of a smooth aura; the live popup keeps it. */
  showGlow?: boolean;
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
    <div className="toty-card-wrap">
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
            // Read by .toty-card__frame's drop-shadow glow below — a
            // drop-shadow follows the frame PNG's actual alpha silhouette,
            // so the glow hugs the card's ornate shield outline instead of
            // sitting in a rectangular box or a floor-shadow blob under it.
            "--toty-text-color": textTheme.color,
            "--toty-text-glow": textTheme.glow,
            ...(tilt.active
              ? {
                  transform: `perspective(900px) translateY(-6px) scale(1.04) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
                }
              : {}),
          } as React.CSSProperties
        }
      >
        {/* Same frame art, but sitting BELOW the background/character so its
            colored drop-shadow glow (which naturally bleeds both inward and
            outward from the border's alpha edge) only ever shows on the
            outward side — the opaque window content on top hides the
            inward half. The crisp .toty-card__frame on top stays glow-free. */}
        {showGlow && (
          <img className="toty-card__frame-glow" src={assets.frame} alt="" aria-hidden="true" />
        )}
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
          {backgroundGlowUrl && (
            <div className="toty-card__idle-glow">
              <img
                className="toty-card__glow"
                src={backgroundGlowUrl}
                alt=""
                style={{ transform: `translate(${tilt.bgX}px, ${tilt.bgY}px)` }}
              />
            </div>
          )}
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
