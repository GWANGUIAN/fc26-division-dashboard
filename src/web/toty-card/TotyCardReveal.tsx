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

function TunnelOverlay({ color, glow }: { color: string; glow: string }) {
  const rings = Array.from({ length: 9 }, (_, i) => i);
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

function BurstEffect({ color, glow }: { color: string; glow: string }) {
  // Computed once per mount (not on every render) — angle/distance are
  // decorative randomness, not state that should ever change mid-burst.
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 70 + Math.random() * 90;
      return {
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        delay: Math.random() * 80,
      };
    }),
  ).current;
  const beamAngles = [0, 45, 90, 135];

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
 * Once the sequence finishes it unmounts entirely, leaving a plain
 * TotyCardVisual behind — identical to what rendered here before this
 * component existed, so the existing hover-tilt/export/GIF paths are
 * untouched.
 */
export function TotyCardReveal({
  streamer,
  assets,
  cardBackUrl,
  onCardClick,
  onImpact,
  onRevealed,
}: {
  streamer: Pick<StreamerRecord, "id" | "displayName" | "hopedPosition1" | "currentDivision">;
  assets: TotyCardAssets;
  cardBackUrl?: string;
  onCardClick?: () => void;
  onImpact?: () => void;
  /** Fired once the flip sequence finishes and the interactive card is showing. */
  onRevealed?: () => void;
}) {
  const theme = getTotyCardTextTheme(streamer.id);
  const [phase, setPhase] = useState<RevealPhase>("waiting");
  const [showBurst, setShowBurst] = useState(false);
  const impactFiredRef = useRef(false);

  const fireImpact = () => {
    if (impactFiredRef.current) return;
    impactFiredRef.current = true;
    onImpact?.();
  };

  const handleReveal = () => {
    setPhase((current) =>
      current === "waiting" ? (prefersReducedMotion() ? "done" : "tunnel") : current,
    );
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

  if (phase === "done") {
    return <TotyCardVisual streamer={streamer} assets={assets} onCardClick={onCardClick} />;
  }

  return (
    <div className="toty-reveal">
      {phase === "tunnel" && <TunnelOverlay color={theme.color} glow={theme.glow} />}
      <div
        className={`toty-reveal-flip toty-card-wrap ${phase === "flip" ? "toty-reveal-flip--flipping" : ""}`}
      >
        <div className="toty-reveal-flip__inner">
          <div className="toty-reveal-flip__back">
            {cardBackUrl ? (
              <img src={cardBackUrl} alt="" />
            ) : (
              <div className="toty-reveal-flip__back-fallback">?</div>
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
            <TotyCardVisual streamer={streamer} assets={assets} onCardClick={onCardClick} />
          </div>
        </div>
      </div>
      {showBurst && <BurstEffect color={theme.color} glow={theme.glow} />}
    </div>
  );
}
