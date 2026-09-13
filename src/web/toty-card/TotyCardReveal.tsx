import { useEffect, useRef, useState } from "react";
import type { StreamerRecord } from "../../shared/model.js";
import type { TotyCardAssets } from "./totyCardAssets.js";
import { getTotyCardTextTheme } from "./totyCardTheme.js";
import { TotyCardVisual } from "./TotyCardVisual.js";
import "./toty-card-reveal.css";

// Keep these in lockstep with the animation durations declared in
// toty-card-reveal.css (toty-tunnel-ring / toty-flip-inner) — there's no
// single source of truth across CSS/JS here, so a duration change needs to
// be made in both places.
const TUNNEL_MS = 600;
const FLIP_MS = 700;
const PARTICLE_COUNT = 18;

type RevealPhase = "waiting" | "tunnel" | "flip" | "done";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

function TunnelOverlay({
  color,
  glow,
  ringCount = 9,
}: {
  color: string;
  glow: string;
  ringCount?: number;
}) {
  const rings = Array.from({ length: ringCount }, (_, i) => i);
  return (
    <div
      className="toty-reveal-tunnel"
      style={{ "--toty-tunnel-color": color, "--toty-tunnel-glow": glow } as React.CSSProperties}
      aria-hidden="true"
    >
      {rings.map((i) => (
        <span
          key={i}
          className="toty-reveal-tunnel__ring"
          style={{ animationDelay: `${i * 45}ms` }}
        />
      ))}
      <span className="toty-reveal-tunnel__flash" />
    </div>
  );
}

function BurstEffect({
  color,
  glow,
  particleCount = PARTICLE_COUNT,
  beamAngles = [0, 45, 90, 135],
}: {
  color: string;
  glow: string;
  particleCount?: number;
  beamAngles?: number[];
}) {
  // Computed once per mount (not on every render) — angle/distance are
  // decorative randomness, not state that should ever change mid-burst.
  const particles = useRef(
    Array.from({ length: particleCount }, () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 70 + Math.random() * 90;
      return {
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        delay: Math.random() * 80,
      };
    }),
  ).current;

  return (
    <div
      className="toty-reveal-burst"
      style={{ "--toty-tunnel-color": color, "--toty-tunnel-glow": glow } as React.CSSProperties}
      aria-hidden="true"
    >
      {beamAngles.map((deg) => (
        <span
          key={deg}
          className="toty-reveal-burst__beam"
          style={{ "--r": `${deg}deg` } as React.CSSProperties}
        />
      ))}
      {particles.map((p, i) => (
        <span
          key={i}
          className="toty-reveal-burst__spark"
          style={
            {
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
              animationDelay: `${p.delay}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/**
 * Wraps TotyCardVisual with a "pack opening" reveal sequence: the card sits
 * face-down with a "클릭해서 카드 공개" prompt until the viewer clicks it,
 * then a light tunnel rushes past, the mystery card back flips over to the
 * real card, and a light-beam/spark burst fires at the moment of impact.
 * TotyCardVisual itself stays mounted at the same spot in the tree for this
 * component's whole life (even once fully revealed) — only the chrome
 * around it (tunnel/back-face/burst) stops rendering. Swapping to a freshly
 * mounted plain TotyCardVisual once revealed used to reset its idle-drift/
 * idle-float CSS animations back to frame 0, which read as a visible
 * stutter/jump right as the card finished revealing.
 */
export function TotyCardReveal({
  streamer,
  assets,
  cardBackUrl,
  backgroundGlowUrl,
  onCardClick,
  onRevealStart,
  onImpact,
  onRevealed,
}: {
  streamer: Pick<StreamerRecord, "id" | "displayName" | "hopedPosition1" | "currentDivision">;
  assets: TotyCardAssets;
  cardBackUrl?: string;
  backgroundGlowUrl?: string;
  onCardClick?: () => void;
  /** Fired the instant the viewer clicks "클릭해서 카드 공개" — before the
   * tunnel/flip even starts (or immediately under prefers-reduced-motion). */
  onRevealStart?: () => void;
  onImpact?: () => void;
  /** Fired once the flip sequence finishes and the interactive card is showing. */
  onRevealed?: () => void;
}) {
  const theme = getTotyCardTextTheme(streamer.id);
  // hachi97 is the one deliberately "more lavish, higher-rarity" card (see
  // docs/toty-card-prompts.md's bonus section and totyCardTheme.ts) — its
  // reveal gets a denser tunnel/burst to match, rather than adding a whole
  // generic rarity system for a single special-cased card.
  const isSpecial = streamer.id === "hachi97";
  const [phase, setPhase] = useState<RevealPhase>("waiting");
  const [showBurst, setShowBurst] = useState(false);
  const impactFiredRef = useRef(false);

  const fireImpact = () => {
    if (impactFiredRef.current) return;
    impactFiredRef.current = true;
    onImpact?.();
  };

  const handleReveal = () => {
    // Safe to read `phase` directly rather than go through a setPhase
    // updater: the reveal button (the only caller) only exists in the DOM
    // while phase === "waiting" and is removed the instant it changes, so
    // this can't double-fire the way a stale-closure updater callback
    // could under React StrictMode's double-invocation.
    if (phase !== "waiting") return;
    onRevealStart?.();
    setPhase(prefersReducedMotion() ? "done" : "tunnel");
  };

  // Same mouse-tilt-plus-glare treatment as TotyCardVisual's own hover
  // handler, applied to the face-down card back while it's waiting to be
  // clicked (see toty-card-reveal.css's --pointer-x/y-driven glare/foil).
  const backCardRef = useRef<HTMLDivElement>(null);
  const backRafRef = useRef(0);
  const [backTilt, setBackTilt] = useState({ rx: 0, ry: 0, px: 50, py: 50, active: false });

  useEffect(() => () => cancelAnimationFrame(backRafRef.current), []);

  const handleBackMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = backCardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    cancelAnimationFrame(backRafRef.current);
    backRafRef.current = requestAnimationFrame(() => {
      setBackTilt({
        rx: (0.5 - y) * 22,
        ry: (x - 0.5) * 26,
        px: x * 100,
        py: y * 100,
        active: true,
      });
    });
  };

  const handleBackMouseLeave = () => {
    cancelAnimationFrame(backRafRef.current);
    setBackTilt((current) => ({ ...current, active: false }));
  };

  useEffect(() => {
    if (phase === "done") {
      // Reached either by finishing the flip, or immediately when a click
      // lands under prefers-reduced-motion — either way the reveal sfx
      // should still fire exactly once, and the parent should learn the
      // interactive card is now showing.
      fireImpact();
      onRevealed?.();
      return;
    }
    if (phase !== "tunnel") return;
    const timer = window.setTimeout(() => setPhase("flip"), TUNNEL_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fireImpact/onRevealed are stable enough for this one-shot sequence
  }, [phase]);

  useEffect(() => {
    if (phase !== "flip") return;
    const impactTimer = window.setTimeout(() => {
      fireImpact();
      setShowBurst(true);
    }, FLIP_MS / 2);
    const doneTimer = window.setTimeout(() => setPhase("done"), FLIP_MS);
    return () => {
      window.clearTimeout(impactTimer);
      window.clearTimeout(doneTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fireImpact is stable enough for this one-shot sequence
  }, [phase]);

  return (
    <div className={`toty-reveal ${showBurst ? "toty-reveal--shake" : ""}`}>
      {phase === "tunnel" && (
        <TunnelOverlay color={theme.color} glow={theme.glow} ringCount={isSpecial ? 14 : 9} />
      )}
      <div
        ref={backCardRef}
        className={`toty-reveal-flip toty-card-wrap ${phase === "flip" ? "toty-reveal-flip--flip-anim" : ""} ${phase === "flip" || phase === "done" ? "toty-reveal-flip--flipped" : ""} ${phase === "waiting" && backTilt.active ? "toty-reveal-flip--active" : ""}`}
        onMouseMove={phase === "waiting" ? handleBackMouseMove : undefined}
        onMouseLeave={phase === "waiting" ? handleBackMouseLeave : undefined}
        style={
          phase === "waiting"
            ? ({
                "--pointer-x": `${backTilt.px}%`,
                "--pointer-y": `${backTilt.py}%`,
                ...(backTilt.active
                  ? {
                      transform: `perspective(900px) translateY(-6px) scale(1.04) rotateX(${backTilt.rx}deg) rotateY(${backTilt.ry}deg)`,
                    }
                  : {}),
              } as React.CSSProperties)
            : undefined
        }
      >
        <div className="toty-reveal-flip__inner">
          <div className="toty-reveal-flip__back">
            {cardBackUrl ? (
              <img src={cardBackUrl} alt="" />
            ) : (
              <div className="toty-reveal-flip__back-fallback">?</div>
            )}
            {phase === "waiting" && (
              <>
                {/* Masked to the art's own alpha shape (below) — otherwise
                    the shine paints across the whole transparent canvas
                    rectangle the card art sits on, not just the visible
                    shield, and shows up as a stray glowing box. */}
                <span
                  className="toty-reveal-flip__glare"
                  aria-hidden="true"
                  style={
                    cardBackUrl
                      ? ({ "--toty-back-mask": `url("${cardBackUrl}")` } as React.CSSProperties)
                      : undefined
                  }
                />
                <span
                  className="toty-reveal-flip__foil"
                  aria-hidden="true"
                  style={
                    cardBackUrl
                      ? ({ "--toty-back-mask": `url("${cardBackUrl}")` } as React.CSSProperties)
                      : undefined
                  }
                />
              </>
            )}
            {phase === "waiting" && (
              <button
                type="button"
                className="toty-reveal-flip__reveal-btn"
                onClick={handleReveal}
                style={
                  {
                    "--toty-text-color": theme.color,
                    "--toty-text-glow": theme.glow,
                  } as React.CSSProperties
                }
              >
                클릭해서 카드 공개
              </button>
            )}
          </div>
          <div className="toty-reveal-flip__front">
            <TotyCardVisual
              streamer={streamer}
              assets={assets}
              backgroundGlowUrl={backgroundGlowUrl}
              onCardClick={onCardClick}
              // showBurst turns on at the flip's exact 90°-rotation midpoint
              // (see the FLIP_MS/2 timer below), where the card is edge-on
              // and this face isn't actually visible yet — punching then
              // shakes background/glow images nobody can see. Wait for the
              // flip to actually finish facing the viewer instead; the
              // still-flying burst sparks (their own longer keyframe,
              // already started at the midpoint) carry the "impact" past
              // this point regardless. Also keeps punch off entirely under
              // prefers-reduced-motion, which jumps straight to "done"
              // without ever setting showBurst.
              punch={phase === "done" && showBurst}
            />
          </div>
        </div>
      </div>
      {showBurst && (
        <BurstEffect
          color={theme.color}
          glow={theme.glow}
          particleCount={isSpecial ? 32 : PARTICLE_COUNT}
          beamAngles={isSpecial ? [0, 30, 60, 90, 120, 150] : [0, 45, 90, 135]}
        />
      )}
    </div>
  );
}
