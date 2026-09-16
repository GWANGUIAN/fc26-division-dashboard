import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ImageDown, RotateCcw, Sparkles, Volume2 } from "lucide-react";
import type { StreamerRecord } from "../../shared/model.js";
import { playSfx, stopSfx } from "../sfxAudio.js";
import { drawRandomFromPool, formatFortuneCardEyebrow, FORTUNE_CARDS, type FortuneCardEntry } from "./fortuneCardData";
import { getFortuneCardBackUrl, getFortuneCardFrontUrl } from "./fortuneCardAssets";
import { exportFortuneCardPng } from "./exportFortuneCardImage";
import { getFortuneRevealedIds, markFortuneCardRevealed } from "./fortuneCardHistoryStore";
import {
  FORTUNE_WOOWAKGOOD_CARDS,
  FORTUNE_WOOWAKGOOD_DISPLAY_NAME,
  FORTUNE_WOOWAKGOOD_ID,
  resolveFortuneCardSfx,
} from "./fortuneWoowakgoodCard";
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

/** Samples `count` entries from `pool` WITH replacement — used only when
 * "새로운 카드만 뽑기" is on and fewer than 3 unrevealed cards remain, so the
 * 3-card spread can still always show 3 face-down cards (a real card back,
 * not an empty slot) while guaranteeing every one of them is new, even if
 * that means the same 1-2 unrevealed entries appear more than once. */
function drawWithReplacement(pool: FortuneCardEntry[], count: number): FortuneCardEntry[] {
  return Array.from({ length: count }, () => pool[Math.floor(Math.random() * pool.length)]);
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
  includeHidden,
  onlyNewCards,
  sfxVolume,
  onShuffleStart,
  onCardHover,
  onCardSelectImpact,
  onStreamerSfx,
}: {
  streamers?: Pick<StreamerRecord, "id" | "displayName" | "sfx">[];
  /** Mixes 우왁굳's hidden cards (both of them, see FORTUNE_WOOWAKGOOD_CARDS)
   * into the draw pool once useFortuneBonusUnlock.ts says it's been
   * unlocked. */
  includeHidden?: boolean;
  /** "새로운 카드만 뽑기" — every dealt card is guaranteed unrevealed (see
   * fortuneCardHistoryStore.ts). With 3+ unrevealed cards left this is a
   * normal distinct 3-card draw; with only 1-2 left, those same entries
   * are sampled with replacement (drawWithReplacement) so the spread still
   * shows 3 cards and every one of them is still new. FortunePopup only
   * lets this be true when at least 1 unrevealed card exists. */
  onlyNewCards?: boolean;
  /** Powers the reveal panel's own manual "효과음 재생" replay button —
   * same DetailModal.tsx convention of playSfx(url, sfxVolume / 100),
   * played directly rather than routed through onStreamerSfx below (that
   * one is gated by the "효과음" on/off toggle for the automatic
   * reveal-moment sting; a deliberate click on the speaker icon should
   * always play regardless of that toggle). */
  sfxVolume: number;
  onShuffleStart?: () => void;
  onCardHover?: () => void;
  onCardSelectImpact?: () => void;
  /** Fired alongside onCardSelectImpact with that player's own sfx URL
   * (StreamerRecord.sfx), if they have one — lets the parent play it
   * through the shared sfxAudio.ts singleton, same as every other
   * "click this streamer" interaction in the app. */
  onStreamerSfx?: (sfxUrl: string) => void;
}) {
  const hiddenPool = includeHidden ? FORTUNE_WOOWAKGOOD_CARDS : [];

  const drawThree = (): FortuneCardEntry[] => {
    const basePool = [...FORTUNE_CARDS, ...hiddenPool];
    if (!onlyNewCards) return drawRandomFromPool(basePool, 3);
    const revealedIds = getFortuneRevealedIds();
    const unrevealedPool = basePool.filter((entry) => !revealedIds.has(entry.id));
    // FortunePopup only allows onlyNewCards when unrevealedPool has at
    // least 1 entry — the empty-pool branch here is just a defensive
    // fallback in case that ever gets out of sync.
    if (unrevealedPool.length === 0) return drawRandomFromPool(basePool, 3);
    if (unrevealedPool.length < 3) return drawWithReplacement(unrevealedPool, 3);
    return drawRandomFromPool(unrevealedPool, 3);
  };

  const [drawn, setDrawn] = useState<FortuneCardEntry[]>(drawThree);
  const [phase, setPhase] = useState<Phase>(() => (prefersReducedMotion() ? "dealt" : "shuffling"));
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [exportingImage, setExportingImage] = useState(false);
  const impactFiredRef = useRef(false);
  const hoveredIndexRef = useRef<number | null>(null);
  const skipNextOnlyNewCardsEffectRef = useRef(true);

  // Re-rolls the 3-card spread when "새로운 카드만 뽑기" is toggled WHILE
  // nothing has been picked yet (still shuffling or waiting on the dealt
  // face-down cards) — so flipping it on/off before committing to a card
  // always takes effect immediately instead of only on the next redraw.
  // Once a card is flipping/revealed, this deliberately does nothing: the
  // pick already happened, and silently swapping it out from under the
  // viewer would be confusing/unfair. Skips its very first run (the
  // mount-time effect pass every dependency-having effect gets) since
  // drawThree() already ran once for the lazy useState initializer above —
  // re-running here too would just discard that draw and pick a second one
  // for no reason.
  useEffect(() => {
    if (skipNextOnlyNewCardsEffectRef.current) {
      skipNextOnlyNewCardsEffectRef.current = false;
      return;
    }
    if (phase !== "shuffling" && phase !== "dealt") return;
    setDrawn(drawThree());
    setSelectedIndex(null);
    hoveredIndexRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberately keyed only on onlyNewCards; phase/drawThree are read fresh from the closure at the moment it changes
  }, [onlyNewCards]);

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
      if (selectedIndex !== null) {
        const sfxUrl = getStreamerSfx(selectedIndex);
        if (sfxUrl) onStreamerSfx?.(sfxUrl);
      }
    }, FLIP_MS / 2);
    const doneTimer = window.setTimeout(() => setPhase("revealed"), FLIP_MS);
    return () => {
      window.clearTimeout(impactTimer);
      window.clearTimeout(doneTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onCardSelectImpact/fireStreamerSfx are stable enough for this one-shot sequence
  }, [phase]);

  // Records the pick into the persistent "뽑았던 카드" collection the
  // instant it's actually revealed (not at pick/flip-start) — same timing
  // TOTY uses for its own markTotyCardRevealed.
  useEffect(() => {
    if (phase === "revealed" && selectedIndex !== null) {
      markFortuneCardRevealed(drawn[selectedIndex].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- drawn/selectedIndex read once per reveal, not meant to re-fire on redraw alone
  }, [phase]);

  // Looked up by explicit index (never via the selectedIndex state) so
  // there's no risk of reading it one render too early — handlePick's own
  // reduced-motion branch calls this in the same tick as setSelectedIndex,
  // before that state update has flushed. Precedence itself lives in
  // resolveFortuneCardSfx (fortuneWoowakgoodCard.ts), shared with the
  // reveal panel's own manual replay button (selectedSfxUrl below) and
  // FortuneHistoryModal.tsx's.
  const getStreamerSfx = (index: number): string | undefined => resolveFortuneCardSfx(drawn[index], streamers);

  const handlePick = (index: number) => {
    if (phase !== "dealt") return;
    setSelectedIndex(index);
    if (prefersReducedMotion()) {
      impactFiredRef.current = true;
      onCardSelectImpact?.();
      const sfxUrl = getStreamerSfx(index);
      if (sfxUrl) onStreamerSfx?.(sfxUrl);
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
    // Cuts off the just-revealed card's streamer sfx (played via the shared
    // sfxAudio.ts singleton, see getStreamerSfx/onStreamerSfx above) so it
    // doesn't keep playing over the next shuffle.
    stopSfx();
    setDrawn(drawThree());
    setSelectedIndex(null);
    hoveredIndexRef.current = null;
    setPhase(prefersReducedMotion() ? "dealt" : "shuffling");
  };

  const selectedEntry = selectedIndex !== null ? drawn[selectedIndex] : undefined;
  // 우왁굳 never appears in roster.yaml, so the streamers lookup below can't
  // find him — his display name is hardcoded the same way woowakgoodBonusCard.ts
  // does it for the 3D card feature (checked via `streamerId ?? id` so this
  // covers both of his cards, see fortuneWoowakgoodCard.ts). A second/alt
  // card (e.g. janine95kim2) has its own `id` for the image asset/history
  // entry but resolves its displayName from `streamerId` (the real roster
  // id) instead.
  const selectedDisplayName = selectedEntry
    ? (selectedEntry.streamerId ?? selectedEntry.id) === FORTUNE_WOOWAKGOOD_ID
      ? FORTUNE_WOOWAKGOOD_DISPLAY_NAME
      : streamers?.find((s) => s.id === (selectedEntry.streamerId ?? selectedEntry.id))?.displayName
    : undefined;
  const selectedFrontUrl = selectedEntry ? getFortuneCardFrontUrl(selectedEntry.id) : undefined;
  const selectedSfxUrl = selectedEntry ? resolveFortuneCardSfx(selectedEntry, streamers) : undefined;

  const handlePlaySfx = () => {
    if (selectedSfxUrl) playSfx(selectedSfxUrl, sfxVolume / 100);
  };

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
          {/* Keyed by slot position (not entry.id) — "새로운 카드만 뽑기" can
              legitimately deal the same entry into more than one of the 3
              slots (see drawWithReplacement), so entry.id isn't unique here. */}
          {drawn.map((entry, index) => {
            const isSelected = index === selectedIndex;
            const isDismissed = selectedIndex !== null && !isSelected;
            const frontUrl = isSelected ? selectedFrontUrl : undefined;

            if (isSelected && (phase === "flipping" || phase === "revealed")) {
              return (
                <div
                  key={index}
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
                key={index}
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
            {formatFortuneCardEyebrow(selectedDisplayName, selectedEntry, [...FORTUNE_CARDS, ...hiddenPool])}
          </p>
          <h3 className="fortune-reveal-panel__name">
            {selectedEntry.cardName}
            {selectedSfxUrl && (
              <button
                type="button"
                className="fortune-reveal-panel__sfx-btn"
                onClick={handlePlaySfx}
                aria-label="카드 효과음 재생"
                title="카드 효과음 재생"
              >
                <Volume2 aria-hidden="true" />
              </button>
            )}
          </h3>
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
