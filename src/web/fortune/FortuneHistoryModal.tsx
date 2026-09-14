import { useState } from "react";
import type { CSSProperties } from "react";
import { ImageDown, X } from "lucide-react";
import type { StreamerRecord } from "../../shared/model.js";
import { useEscape } from "../Modal.js";
import { FORTUNE_CARDS } from "./fortuneCardData";
import { getFortuneCardFrontUrl } from "./fortuneCardAssets";
import { getFortuneRevealedIds } from "./fortuneCardHistoryStore";
import { exportFortuneCardPng } from "./exportFortuneCardImage";
import { FORTUNE_WOOWAKGOOD_CARD, FORTUNE_WOOWAKGOOD_DISPLAY_NAME, FORTUNE_WOOWAKGOOD_ID } from "./fortuneWoowakgoodCard";
import "./fortune-history-modal.css";

// The hidden card lives outside FORTUNE_CARDS (see fortuneWoowakgoodCard.ts)
// — folded back in here so it shows up in the history list too, once
// revealed, same as every other card.
const ALL_FORTUNE_CARDS = [...FORTUNE_CARDS, FORTUNE_WOOWAKGOOD_CARD];

function displayNameFor(
  id: string,
  streamers: Pick<StreamerRecord, "id" | "displayName">[] | undefined,
): string | undefined {
  if (id === FORTUNE_WOOWAKGOOD_ID) return FORTUNE_WOOWAKGOOD_DISPLAY_NAME;
  return streamers?.find((s) => s.id === id)?.displayName;
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
  onClose,
}: {
  streamers?: Pick<StreamerRecord, "id" | "displayName">[];
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
  const selectedDisplayName = selectedEntry ? displayNameFor(selectedEntry.id, streamers) : undefined;

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
                const displayName = displayNameFor(entry.id, streamers);
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
                    <span className="fortune-history-modal__item-name">{displayName ?? entry.cardName}</span>
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
                  {selectedDisplayName ? `${selectedDisplayName}의 카드` : "오늘의 카드"}
                </p>
                <h3 className="fortune-history-modal__detail-name">{selectedEntry.cardName}</h3>
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
