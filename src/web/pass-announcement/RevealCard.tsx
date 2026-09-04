import type { AnimationEvent, CSSProperties } from "react";
import type { StreamerRecord } from "../../shared/model.js";
import { PassFifaCard } from "./PassFifaCard";
import { RevealCardFront } from "./RevealCardFront";

export type RevealStep = "entering" | "shadow-fade" | "spinning" | "revealed" | "settling";

interface RevealSparkSlot {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  size: number;
  delay: string;
  duration: string;
}

/** Around the card edges, like the outer ring of a fancy-avatar's sparks. */
const REVEAL_OUTER_SPARK_SLOTS: RevealSparkSlot[] = [
  { top: "-6%", left: "4%", size: 20, delay: "0s", duration: "2.2s" },
  { top: "-9%", left: "48%", size: 26, delay: ".3s", duration: "2.6s" },
  { top: "-6%", right: "4%", size: 20, delay: ".6s", duration: "2.1s" },
  { top: "32%", left: "-9%", size: 18, delay: ".9s", duration: "2.4s" },
  { top: "32%", right: "-9%", size: 18, delay: "1.2s", duration: "2.3s" },
  { bottom: "12%", left: "-7%", size: 20, delay: "1.5s", duration: "2.5s" },
  { bottom: "12%", right: "-7%", size: 20, delay: ".4s", duration: "2.7s" },
  { bottom: "-6%", left: "48%", size: 22, delay: "1s", duration: "2.2s" },
];

/** A few scattered across the card body itself — same fancy-avatar/fancy-name
 * spark language, just placed within the card rather than only around it. */
const REVEAL_INNER_SPARK_SLOTS: RevealSparkSlot[] = [
  { top: "13%", left: "68%", size: 13, delay: ".2s", duration: "2s" },
  { top: "40%", left: "10%", size: 11, delay: "1.1s", duration: "2.3s" },
  { top: "62%", right: "12%", size: 12, delay: ".7s", duration: "2.1s" },
  { bottom: "10%", left: "48%", size: 10, delay: "1.6s", duration: "1.9s" },
];

function renderSparks(slots: RevealSparkSlot[]) {
  return slots.map((slot, index) => (
    <span
      key={index}
      className="reveal-card__spark"
      style={{
        top: slot.top,
        left: slot.left,
        right: slot.right,
        bottom: slot.bottom,
        fontSize: slot.size,
        animationDelay: slot.delay,
        animationDuration: slot.duration,
      }}
    >
      ✦
    </span>
  ));
}

export function RevealCard({
  streamer,
  color,
  step,
  spinSeconds,
  onEnterEnd,
  onShadowFadeEnd,
  onSpinEnd,
  onSettleEnd,
}: {
  streamer: StreamerRecord;
  color: string;
  step: RevealStep;
  spinSeconds: number;
  onEnterEnd: () => void;
  onShadowFadeEnd: () => void;
  onSpinEnd: () => void;
  onSettleEnd: () => void;
}) {
  const showShadow = step === "entering" || step === "shadow-fade";
  const showBack = step === "entering" || step === "shadow-fade" || step === "spinning";
  const showSparkle = step === "revealed" || step === "settling";

  const handleCardAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (step === "entering") onEnterEnd();
    else if (step === "settling") onSettleEnd();
  };

  const handleSpinAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (step === "spinning") onSpinEnd();
  };

  const handleShadowAnimationEnd = (event: AnimationEvent<SVGSVGElement>) => {
    event.stopPropagation();
    if (step === "shadow-fade") onShadowFadeEnd();
  };

  return (
    <div
      className={`reveal-card reveal-card--${step}`}
      style={
        {
          "--reveal-glow-color": color,
          "--spin-duration": `${spinSeconds}s`,
        } as CSSProperties
      }
      onAnimationEnd={handleCardAnimationEnd}
    >
      {showBack ? (
        <div className="reveal-card__spin" onAnimationEnd={handleSpinAnimationEnd}>
          <PassFifaCard streamer={streamer} faceDown />
        </div>
      ) : (
        <RevealCardFront streamer={streamer} />
      )}
      {showShadow && (
        <svg
          className={`reveal-card__shadow ${step === "shadow-fade" ? "reveal-card__shadow--fade" : ""}`}
          viewBox="0 0 300 450"
          aria-hidden="true"
          onAnimationEnd={handleShadowAnimationEnd}
        >
          {/* Sized to exactly match the actual card box behind it (edge to
             edge, same 5%-of-300=15 corner radius as .pass-fifa-card's own
             border-radius) — a smaller/more-rounded guess here left slivers
             of the card's own colored background visible past this
             silhouette's corners while it faded in. */}
          <rect x="0" y="0" width="300" height="450" rx="15" ry="15" fill="#04100c" />
        </svg>
      )}
      {showSparkle && (
        <div className="reveal-card__sparkles reveal-card__sparkles--inner" aria-hidden="true">
          {renderSparks(REVEAL_INNER_SPARK_SLOTS)}
        </div>
      )}
      {showSparkle && (
        <div className="reveal-card__sparkles" aria-hidden="true">
          {renderSparks(REVEAL_OUTER_SPARK_SLOTS)}
        </div>
      )}
    </div>
  );
}
