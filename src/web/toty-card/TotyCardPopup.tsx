import { useEffect, useState } from "react";
import { Download, ImageDown, MousePointer2, X } from "lucide-react";
import type { StreamerRecord } from "../../shared/model.js";
import { useEscape } from "../Modal.js";
import { playSfx } from "../sfxAudio.js";
import { TotyCardReveal } from "./TotyCardReveal.js";
import { exportTotyCardPng } from "./exportTotyCardImage.js";
import {
  getCardBackUrl,
  getPopupBackdropUrl,
  getTotyCardPreviewUrl,
  type TotyCardAssets,
} from "./totyCardAssets.js";
import "./toty-card.css";

// Plays independently of the shared single-slot sfxAudio.ts player (same
// reasoning as passAnnouncementSfx.ts) so the reveal stinger below never
// gets cut off by a later click on the card playing the streamer's own sfx.
const REVEAL_SFX_URL = "/sfxes/toty-reveal.mp3";
function playRevealSfx(volume: number) {
  const audio = new Audio(REVEAL_SFX_URL);
  audio.volume = volume;
  audio.play().catch(() => {
    // ignore autoplay/decoding failures, and a not-yet-provided file's 404
  });
}

/** Locks the page behind the overlay from scrolling while it's open. */
function useBodyScrollLock() {
  useEffect(() => {
    const html = document.documentElement;
    const { body } = document;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const scrollY = window.scrollY;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      window.scrollTo(0, scrollY);
    };
  }, []);
}

export function TotyCardPopup({
  streamer,
  assets,
  sfxEnabled,
  sfxVolume,
  onClose,
}: {
  streamer: Pick<StreamerRecord, "id" | "displayName" | "hopedPosition1" | "currentDivision" | "sfx">;
  assets: TotyCardAssets;
  sfxEnabled: boolean;
  sfxVolume: number;
  onClose: () => void;
}) {
  useEscape(onClose);
  useBodyScrollLock();

  // Fired by TotyCardReveal at the reveal's impact moment (or immediately,
  // under prefers-reduced-motion) rather than as soon as the popup mounts,
  // so the stinger lands together with the flip/burst instead of ahead of it.
  const handleRevealImpact = () => {
    if (sfxEnabled) playRevealSfx(sfxVolume / 100);
  };

  const handleCardClick = () => {
    if (sfxEnabled && streamer.sfx) playSfx(streamer.sfx, sfxVolume / 100);
  };

  // The mouse-tilt hint doesn't make sense over a face-down mystery card, so
  // it only appears once TotyCardReveal's flip sequence has actually finished.
  const [revealed, setRevealed] = useState(false);

  const [exportingPng, setExportingPng] = useState(false);
  const handlePngExport = async () => {
    if (exportingPng) return;
    setExportingPng(true);
    try {
      await exportTotyCardPng(streamer, assets);
    } finally {
      setExportingPng(false);
    }
  };

  const backdropUrl = getPopupBackdropUrl();
  // Pre-rendered offline (scripts/generate-toty-preview.mjs) rather than
  // encoded live in the browser — see the script's header comment for why.
  const previewUrl = getTotyCardPreviewUrl(streamer.id);

  return (
    <div
      className="toty-card-popup"
      role="dialog"
      aria-modal="true"
      aria-label={`${streamer.displayName} 3D 카드`}
      style={backdropUrl ? { backgroundImage: `url(${backdropUrl})` } : undefined}
    >
      <div className="toty-card-popup__scrim" aria-hidden="true" />
      <button
        type="button"
        className="toty-card-popup__close"
        onClick={onClose}
        aria-label="3D 카드 닫기"
      >
        <X aria-hidden="true" />
      </button>

      <div className="toty-card-popup__stage">
        <TotyCardReveal
          streamer={streamer}
          assets={assets}
          cardBackUrl={getCardBackUrl(streamer.id)}
          onCardClick={handleCardClick}
          onImpact={handleRevealImpact}
          onRevealed={() => setRevealed(true)}
        />

        {/* Always mounted (rather than conditionally rendered) so this
            reserves its layout space from the start — otherwise the stage's
            flex column grows once these appear post-reveal, and centering
            that taller column shifts the card upward out of its original spot. */}
        <p className="toty-card-popup__hint" style={{ visibility: revealed ? "visible" : "hidden" }}>
          
          카드에 <MousePointer2 aria-hidden="true" />마우스 커서를 올려 움직여 보세요
        </p>

        <div
          className="toty-card-popup__actions"
          style={{ visibility: revealed ? "visible" : "hidden" }}
        >
          <button
            type="button"
            className="toty-card-popup__download"
            onClick={handlePngExport}
            disabled={exportingPng}
          >
            <ImageDown aria-hidden="true" />
            {exportingPng ? "저장 중..." : "이미지로 저장"}
          </button>

          {previewUrl && (
            <a
              className="toty-card-popup__download"
              href={previewUrl}
              download={`${streamer.displayName}-3d-card.gif`}
            >
              <Download aria-hidden="true" />
              움짤로 저장
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
