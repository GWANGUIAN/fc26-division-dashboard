import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ImageDown, RotateCcw, Sparkles } from "lucide-react";
import type { StreamerRecord } from "../../shared/model.js";
import { drawRandomFortuneCards, type FortuneCardEntry } from "./fortuneCardData";
import { getFortuneCardBackUrl, getFortuneCardFrontUrl } from "./fortuneCardAssets";
import { exportFortuneCardPng } from "./exportFortuneCardImage";
import "./fortune-draw.css";

const SHUFFLE_MS = 1800;
const FLIP_MS = 700;
const SHUFFLE_LEAF_COUNT = 6;

type Phase = "shuffling" | "dealt" | "flipping" | "revealed";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

function CardBack({ className }: { className?: string }) {
  const backUrl = getFortuneCardBackUrl();
  return (
    <div className={`fortune-card-face fortune-card-face--back ${className ?? ""}`}>
      {backUrl ? (
        <img src={backUrl} alt="" />
      ) : (
        <div className="fortune-card-face__placeholder">🔮</div>
      )}
    </div>
  );
}

/**
 * Runs the whole "오늘의 운세" draw sequence in place: a shuffling deck of
 * card backs settles into 3 face-down cards, picking one flips it (reusing
 * TOTY's card-back→front 3D flip technique from toty-reveal-flip) while the
 * other two fade out, then a description panel slides up from below. Fully
 * self-contained — "다시 뽑기" just resets internal state and replays the
 * same sequence, same reasoning TotyCardReveal has for staying mounted
 * across its own phases rather than being torn down and remounted. Closing
 * is handled entirely by FortunePopup's own [X] button (see its header) —
 * this component has no close control of its own to avoid a redundant pair.
 */
export function FortuneDraw({
  streamers,
  onShuffleStart,
  onCardHover,
  onCardSelectImpact,
}: {
  streamers?: Pick<StreamerRecord, "id" | "displayName">[];
  onShuffleStart?: () => void;
  onCardHover?: () => void;
  onCardSelectImpact?: () => void;
}) {
  const [drawn, setDrawn] = useState<FortuneCardEntry[]>(() => drawRandomFortuneCards(3));
  const [phase, setPhase] = useState<Phase>(() => (prefersReducedMotion() ? "dealt" : "shuffling"));
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [exportingImage, setExportingImage] = useState(false);
  const impactFiredRef = useRef(false);
  const hoveredIndexRef = useRef<number | null>(null);

  // Fires once per mount/redraw — not on every render — same "read phase
  // directly rather than through the effect deps" reasoning TotyCardReveal
  // uses for its own one-shot sequencing.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fires once per shuffle, deliberately not re-run on callback identity changes
  useEffect(() => {
    if (phase !== "shuffling") return;
    onShuffleStart?.();
    const timer = window.setTimeout(() => setPhase("dealt"), SHUFFLE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "flipping") return;
    impactFiredRef.current = false;
    const impactTimer = window.setTimeout(() => {
      if (impactFiredRef.current) return;
      impactFiredRef.current = true;
      onCardSelectImpact?.();
    }, FLIP_MS / 2);
    const doneTimer = window.setTimeout(() => setPhase("revealed"), FLIP_MS);
    return () => {
      window.clearTimeout(impactTimer);
      window.clearTimeout(doneTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onCardSelectImpact is stable enough for this one-shot sequence
  }, [phase]);

  const handlePick = (index: number) => {
    if (phase !== "dealt") return;
    setSelectedIndex(index);
    if (prefersReducedMotion()) {
      impactFiredRef.current = true;
      onCardSelectImpact?.();
      setPhase("revealed");
    } else {
      setPhase("flipping");
    }
  };

  const handleHover = (index: number) => {
    if (phase !== "dealt" || hoveredIndexRef.current === index) return;
    hoveredIndexRef.current = index;
    onCardHover?.();
  };

  const handleRedraw = () => {
    setDrawn(drawRandomFortuneCards(3));
    setSelectedIndex(null);
    hoveredIndexRef.current = null;
    setPhase(prefersReducedMotion() ? "dealt" : "shuffling");
  };

  const selectedEntry = selectedIndex !== null ? drawn[selectedIndex] : undefined;
  const selectedDisplayName = selectedEntry
    ? streamers?.find((s) => s.id === selectedEntry.id)?.displayName
    : undefined;
  const selectedFrontUrl = selectedEntry ? getFortuneCardFrontUrl(selectedEntry.id) : undefined;

  const handleSaveImage = async () => {
    if (exportingImage || !selectedEntry || !selectedFrontUrl) return;
    setExportingImage(true);
    try {
      await exportFortuneCardPng(selectedDisplayName, selectedEntry, selectedFrontUrl);
    } finally {
      setExportingImage(false);
    }
  };

  // One line of guidance per phase — keyed by phase so it re-plays its
  // entrance pop every time the phase changes, rather than reading as a
  // single toast quietly rewriting itself.
  const statusText =
    phase === "shuffling"
      ? "카드를 섞는 중..."
      : phase === "dealt"
        ? "카드 한 장을 선택하세요"
        : phase === "flipping"
          ? "카드를 확인하는 중..."
          : null;

  return (
    <div className="fortune-draw">
      {statusText && (
        <div className="fortune-status" key={phase}>
          <Sparkles aria-hidden="true" />
          {statusText}
        </div>
      )}

      {phase === "shuffling" && (
        <div className="fortune-shuffle" aria-hidden="true">
          {Array.from({ length: SHUFFLE_LEAF_COUNT }, (_, i) => (
            <CardBack key={i} className="fortune-shuffle__leaf" />
          ))}
        </div>
      )}

      {phase !== "shuffling" && (
        <div className={`fortune-spread ${selectedIndex !== null ? "fortune-spread--picked" : ""}`}>
          {drawn.map((entry, index) => {
            const isSelected = index === selectedIndex;
            const isDismissed = selectedIndex !== null && !isSelected;
            const frontUrl = isSelected ? selectedFrontUrl : undefined;

            if (isSelected && (phase === "flipping" || phase === "revealed")) {
              return (
                <div
                  key={entry.id}
                  className={`fortune-flip ${phase === "flipping" ? "fortune-flip--anim" : ""} fortune-flip--flipped`}
                >
                  <div className="fortune-flip__inner">
                    <CardBack className="fortune-flip__back" />
                    <div
                      className="fortune-card-face fortune-card-face--front fortune-flip__front fortune-card-face--glow"
                      style={
                        {
                          "--fortune-glow": selectedEntry?.glowColor,
                          "--fortune-glow-soft": selectedEntry?.glowColorSoft,
                        } as CSSProperties
                      }
                    >
                      {frontUrl ? (
                        <img src={frontUrl} alt="" />
                      ) : (
                        <div className="fortune-card-face__placeholder">?</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <button
                key={entry.id}
                type="button"
                className={`fortune-slot ${isDismissed ? "fortune-slot--dismissed" : ""}`}
                onClick={() => handlePick(index)}
                onMouseEnter={() => handleHover(index)}
                disabled={phase !== "dealt"}
                aria-label="타로 카드 뽑기"
              >
                <CardBack />
              </button>
            );
          })}
        </div>
      )}

      {phase === "revealed" && selectedEntry && (
        <div
          className="fortune-reveal-panel"
          style={
            {
              "--fortune-glow": selectedEntry.glowColor,
              "--fortune-glow-soft": selectedEntry.glowColorSoft,
            } as CSSProperties
          }
        >
          <p className="fortune-reveal-panel__eyebrow">
            {selectedDisplayName ? `${selectedDisplayName}의 카드` : "오늘의 카드"}
          </p>
          <h3 className="fortune-reveal-panel__name">{selectedEntry.cardName}</h3>
          <p className="fortune-reveal-panel__text">{selectedEntry.fortuneText}</p>
          <div className="fortune-reveal-panel__actions">
            <button type="button" className="fortune-reveal-panel__btn" onClick={handleRedraw}>
              <RotateCcw aria-hidden="true" />
              다시 뽑기
            </button>
            {selectedFrontUrl && (
              <button
                type="button"
                className="fortune-reveal-panel__btn fortune-reveal-panel__btn--save"
                onClick={handleSaveImage}
                disabled={exportingImage}
              >
                <ImageDown aria-hidden="true" />
                {exportingImage ? "저장 중..." : "이미지로 저장"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
