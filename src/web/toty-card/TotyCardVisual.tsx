import { useEffect, useRef, useState } from "react";
import type { StreamerRecord } from "../../shared/model.js";
import type { TotyCardAssets, TotyCardVariant } from "./totyCardAssets.js";
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
  characterHoverUrl,
  onCardClick,
  showGlow = true,
  punch = false,
  variant = "normal",
}: {
  streamer: Pick<StreamerRecord, "id" | "displayName" | "hopedPosition1" | "currentDivision">;
  assets: TotyCardAssets;
  /** Optional ambient light/particle overlay (see totyCardAssets.ts's
   * getBackgroundGlowUrl) — animates on its own via CSS so the card isn't
   * fully static while idle. Omitted entirely for a player without one yet. */
  backgroundGlowUrl?: string;
  /** Optional alternate character render (see totyCardAssets.ts's
   * getCharacterHoverUrl) — crossfades in over assets.character while the
   * card is active (mouse hovering it), and back out on mouse-leave.
   * Omitted entirely for a player without one yet. */
  characterHoverUrl?: string;
  onCardClick?: () => void;
  /** Off for the offline GIF capture (TotyCardCapturePage) — GIF's 1-bit
   * alpha can't do the glow's soft falloff, so it renders as a hard-edged
   * ring there instead of a smooth aura; the live popup keeps it. */
  showGlow?: boolean;
  /** Set (and left set) by TotyCardReveal the instant its burst fires — adds
   * a one-shot punchy shake to just the background/glow layers, on top of
   * (not instead of) the whole-card shake on .toty-reveal. A plain, finite
   * CSS animation only plays once when its class is added and never
   * replays just because the class stays applied afterward, so this is
   * safe to leave true forever once set (same reasoning as
   * .toty-reveal-flip--flipped / .toty-reveal--shake elsewhere). */
  punch?: boolean;
  /** Set on an easter-egg roll or manual select (TotyCardPopup) — `assets`
   * is already swapped to the matching trio by the caller, this just adds a
   * CSS hook (.toty-card--lowq / .toty-card--retro / .toty-card--harugomem)
   * for text styling (e.g. a rough hand-drawn font, a pixel/arcade font, or
   * an elegant serif font for position/division/name) to key off. */
  variant?: TotyCardVariant;
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

  // "90년대 고전 도트" only: the mouse-tilt/parallax state below normally
  // updates every animation frame (~60fps) and CSS-eases smoothly between
  // values. Here it's instead resampled only every RETRO_STEP_MS and, paired
  // with .toty-card--retro's `transition: steps(1)` overrides in
  // toty-card.css (which skip that easing entirely), jumps instantly between
  // samples — reads as a choppy, low-refresh-rate arcade-cabinet display
  // instead of a modern buttery tilt.
  const lastRetroSampleRef = useRef(0);
  const RETRO_STEP_MS = 90;

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame((now) => {
      if (variant === "retro") {
        if (now - lastRetroSampleRef.current < RETRO_STEP_MS) return;
        lastRetroSampleRef.current = now;
      }
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
        className={`toty-card ${tilt.active ? "toty-card--active" : ""} ${variant === "lowq" ? "toty-card--lowq" : ""} ${variant === "retro" ? "toty-card--retro" : ""} ${variant === "harugomem" ? "toty-card--harugomem" : ""}`}
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
        {/* "조카의 스케치북" only: a hidden SVG filter (feTurbulence +
            feDisplacementMap, animated via SMIL <animate> so it needs no JS
            driving it) applied to just the crisp .toty-card__frame border
            below — reads as a subtly trembling hand-drawn ink line. Not
            applied to .toty-card__frame-glow or the background/character
            art: the glow already animates its own `filter` (a competing
            CSS animation would just win and discard this), and wobbling the
            character/background too would blur the art rather than read as
            charming. Zero-size and aria-hidden — this renders nothing
            itself, it only defines the filter toty-card.css references via
            url(#toty-lowq-wobble). */}
        {variant === "lowq" && (
          <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
            <filter id="toty-lowq-wobble">
              <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="2" seed="2" result="toty-lowq-noise">
                <animate attributeName="seed" values="1;9;4;7;2;5;1" dur="7s" repeatCount="indefinite" />
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" in2="toty-lowq-noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </svg>
        )}
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
              className={`toty-card__bg ${punch ? "toty-card__bg--punch" : ""}`}
              src={assets.background}
              alt=""
              fetchPriority="high"
              style={{ transform: `translate(${tilt.bgX}px, ${tilt.bgY}px) scale(1.06)` }}
            />
          </div>
          <div className="toty-card__idle-char">
            <img
              className={`toty-card__char${characterHoverUrl ? " toty-card__char--has-hover" : ""}`}
              src={assets.character}
              alt=""
              fetchPriority="high"
              style={{ transform: `translate(${tilt.charX}px, ${tilt.charY}px)` }}
            />
            {characterHoverUrl && (
              <img
                className="toty-card__char toty-card__char-hover"
                src={characterHoverUrl}
                alt=""
                style={{ transform: `translate(${tilt.charX}px, ${tilt.charY}px)` }}
              />
            )}
          </div>
          {backgroundGlowUrl && (
            <div className="toty-card__idle-glow">
              <img
                className={`toty-card__glow ${punch ? "toty-card__glow--punch" : ""}`}
                src={backgroundGlowUrl}
                alt=""
                style={{ transform: `translate(${tilt.bgX}px, ${tilt.bgY}px)` }}
              />
            </div>
          )}
          <span className="toty-card__glare" aria-hidden="true" />
          <span className="toty-card__foil" aria-hidden="true" />
          {/* CRT scanlines — "90년대 고전 도트" only, confined to this window
              (the "screen") rather than the ornate frame border (the
              "bezel") outside it. See toty-card.css. */}
          {variant === "retro" && <span className="toty-card__scanlines" aria-hidden="true" />}
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
        {/* "조카의 스케치북" only: a wobbly hand-drawn underline beneath the
            name that continuously "redraws" itself (stroke-dasharray/
            -dashoffset loop in toty-card.css) — a small kid's-notebook
            flourish. Purely decorative/live-view-only, same as the scanline
            overlay above; not reproduced in exportTotyCardImage.ts's static
            PNG export. */}
        {variant === "lowq" && (
          <svg className="toty-card__name-underline" viewBox="0 0 160 14" aria-hidden="true" focusable="false">
            {/* pathLength=100 normalizes stroke-dasharray/-dashoffset in CSS
                to a flat 0–100 scale regardless of this curve's actual
                geometric length — avoids hand-computing arc length by hand. */}
            <path d="M4,7 Q30,2 55,7 T104,6 T156,8" pathLength={100} />
          </svg>
        )}
      </div>
    </div>
  );
}
