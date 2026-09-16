import { useState } from "react";
import type { CSSProperties } from "react";
import { ImageDown, Volume2, X } from "lucide-react";
import type { StreamerRecord } from "../../shared/model.js";
import { useEscape } from "../Modal.js";
import { playSfx } from "../sfxAudio.js";
import { FORTUNE_CARDS, formatFortuneCardEyebrow, formatFortuneCardListLabel, type FortuneCardEntry } from "./fortuneCardData";
import { getFortuneCardFrontUrl } from "./fortuneCardAssets";
import { getFortuneRevealedIds } from "./fortuneCardHistoryStore";
import { exportFortuneCardPng } from "./exportFortuneCardImage";
import {
  FORTUNE_WOOWAKGOOD_CARDS,
  FORTUNE_WOOWAKGOOD_DISPLAY_NAME,
  FORTUNE_WOOWAKGOOD_ID,
  resolveFortuneCardSfx,
} from "./fortuneWoowakgoodCard";
import "./fortune-history-modal.css";

// The hidden cards live outside FORTUNE_CARDS (see fortuneWoowakgoodCard.ts)
// — folded back in here so both of them show up in the history list too,
// once revealed, same as every other card. This is also the pool
// getFortuneCardOrdinal-based helpers use below, so 우왁굳's two cards
// correctly read as "~의 첫번째/두번째 카드" once both exist.
const ALL_FORTUNE_CARDS = [...FORTUNE_CARDS, ...FORTUNE_WOOWAKGOOD_CARDS];

// Takes the whole entry (not just its `id`) so a second/alt card (e.g.
// janine95kim2, 우왁굳's 왁초리 card, see fortuneCardData.ts/
// fortuneWoowakgoodCard.ts) can resolve its real streamer's displayName via
// `streamerId` instead of its own asset/history-only `id`.
function displayNameFor(
  entry: FortuneCardEntry,
  streamers: Pick<StreamerRecord, "id" | "displayName">[] | undefined,
): string | undefined {
  if ((entry.streamerId ?? entry.id) === FORTUNE_WOOWAKGOOD_ID) return FORTUNE_WOOWAKGOOD_DISPLAY_NAME;
  return streamers?.find((s) => s.id === (entry.streamerId ?? entry.id))?.displayName;
}

/**
 * "뽑았던 카드 보기" — a glassmorphism overlay stacked above FortunePopup
 * (own fixed layer, higher z-index) listing every tarot card the viewer has
 * revealed at least once (see fortuneCardHistoryStore.ts), deck-ordered
 * rather than draw-ordered so the list position of a given card never
 * jumps around between visits. The first entry is selected by default.
 */
export function FortuneHistoryModal({
  streamers,
  sfxVolume,
  onClose,
}: {
  streamers?: Pick<StreamerRecord, "id" | "displayName" | "sfx">[];
  sfxVolume: number;
  onClose: () => void;
}) {
  useEscape(onClose);

  // Snapshot taken once at open time — this modal is remounted fresh every
  // time the button is clicked, so there's no need for the live
  // subscribeFortuneCardRevealed() plumbing FortunePopup's toggle uses.
  const [revealedIds] = useState(() => getFortuneRevealedIds());
  const history = ALL_FORTUNE_CARDS.filter((entry) => revealedIds.has(entry.id));
  const [selectedId, setSelectedId] = useState(() => history[0]?.id);
  const [exportingImage, setExportingImage] = useState(false);

  const selectedEntry = history.find((entry) => entry.id === selectedId);
  const selectedFrontUrl = selectedEntry ? getFortuneCardFrontUrl(selectedEntry.id) : undefined;
  const selectedDisplayName = selectedEntry ? displayNameFor(selectedEntry, streamers) : undefined;
  const selectedSfxUrl = selectedEntry ? resolveFortuneCardSfx(selectedEntry, streamers) : undefined;

  // Same DetailModal.tsx convention as FortuneDraw.tsx's own reveal-panel
  // speaker button — plays directly via the shared sfxAudio.ts singleton
  // regardless of the "효과음" on/off toggle, since this is a deliberate
  // click on the speaker icon rather than an automatic reveal-moment sting.
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

  return (
    <div className="fortune-history-modal" role="dialog" aria-modal="true" aria-label="뽑았던 카드 보기">
      <div className="fortune-history-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="fortune-history-modal__panel">
        <button type="button" className="fortune-history-modal__close" onClick={onClose} aria-label="닫기">
          <X aria-hidden="true" />
        </button>

        {history.length === 0 ? (
          <p className="fortune-history-modal__empty">아직 뽑은 카드가 없어요. 오늘의 운세를 먼저 뽑아보세요!</p>
        ) : (
          <div className="fortune-history-modal__body">
            <div className="fortune-history-modal__list">
              {history.map((entry) => {
                const displayName = displayNameFor(entry, streamers);
                const thumbUrl = getFortuneCardFrontUrl(entry.id);
                const isActive = entry.id === selectedId;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    className={`fortune-history-modal__item ${isActive ? "fortune-history-modal__item--active" : ""}`}
                    onClick={() => setSelectedId(entry.id)}
                    style={{ "--fortune-glow": entry.glowColor } as CSSProperties}
                  >
                    <span className="fortune-history-modal__item-thumb">
                      {thumbUrl ? (
                        <img src={thumbUrl} alt="" />
                      ) : (
                        <span className="fortune-history-modal__item-thumb-fallback">?</span>
                      )}
                    </span>
                    <span className="fortune-history-modal__item-name">{formatFortuneCardListLabel(displayName, entry, ALL_FORTUNE_CARDS)}</span>
                  </button>
                );
              })}
            </div>

            {selectedEntry && (
              <div className="fortune-history-modal__detail">
                <div className="fortune-card-face fortune-card-face--front fortune-history-modal__detail-card">
                  {selectedFrontUrl ? (
                    <img src={selectedFrontUrl} alt="" />
                  ) : (
                    <div className="fortune-card-face__placeholder">?</div>
                  )}
                </div>
                <p className="fortune-history-modal__detail-eyebrow">
                  {formatFortuneCardEyebrow(selectedDisplayName, selectedEntry, ALL_FORTUNE_CARDS)}
                </p>
                <h3 className="fortune-history-modal__detail-name">
                  {selectedEntry.cardName}
                  {selectedSfxUrl && (
                    <button
                      type="button"
                      className="fortune-history-modal__detail-sfx-btn"
                      onClick={handlePlaySfx}
                      aria-label="카드 효과음 재생"
                      title="카드 효과음 재생"
                    >
                      <Volume2 aria-hidden="true" />
                    </button>
                  )}
                </h3>
                <p className="fortune-history-modal__detail-text">{selectedEntry.fortuneText}</p>
                {selectedFrontUrl && (
                  <button
                    type="button"
                    className="fortune-history-modal__detail-save-btn"
                    onClick={handleSaveImage}
                    disabled={exportingImage}
                  >
                    <ImageDown aria-hidden="true" />
                    {exportingImage ? "저장 중..." : "이미지로 저장"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
