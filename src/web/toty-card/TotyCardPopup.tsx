import { useEffect, useRef, useState } from "react";
import { Download, ImageDown, MousePointer2, X } from "lucide-react";
import type { StreamerRecord } from "../../shared/model.js";
import { useEscape } from "../Modal.js";
import { playSfx, stopSfx } from "../sfxAudio.js";
import { TotyCardReveal } from "./TotyCardReveal.js";
import { TotyCardDownloadMenu } from "./TotyCardDownloadMenu.js";
import { exportTotyCardPng } from "./exportTotyCardImage.js";
import {
  getBackgroundGlowUrl,
  getCardBackUrl,
  getCharacterHoverUrl,
  getLowQualityTotyCardAssets,
  getLowQualityTotyCardPreviewUrl,
  getPopupBackdropGlowUrl,
  getPopupBackdropUrl,
  getTotyCardPreviewBaseUrl,
  getTotyCardPreviewUrl,
  type TotyCardAssets,
} from "./totyCardAssets.js";
import { rollTotyCardLowQuality } from "./totyCardLowQualityRoll.js";
import { markTotyCardRevealed } from "./totyCardRevealedStore.js";
import "./toty-card.css";

// Plays independently of the shared single-slot sfxAudio.ts player (same
// reasoning as passAnnouncementSfx.ts) so the reveal stinger below never
// gets cut off by a later click on the card playing the streamer's own sfx.
const REVEAL_SFX_URL = "/sfxes/toty-reveal.mp3";
function playRevealSfx(volume: number): HTMLAudioElement {
  const audio = new Audio(REVEAL_SFX_URL);
  audio.volume = volume;
  audio.play().catch(() => {
    // ignore autoplay/decoding failures, and a not-yet-provided file's 404
  });
  return audio;
}

// Shared across every player (unlike the per-player popup-open sfx below) —
// a generic "whoosh" that plays the instant the viewer clicks "클릭해서 카드
// 공개", right as the light-tunnel effect starts, distinct from the impact
// stinger that lands later at the flip's midpoint.
const REVEAL_WHOOSH_SFX_URL = "/sfxes/toty-reveal-whoosh.mp3";
function playRevealWhooshSfx(volume: number): HTMLAudioElement {
  const audio = new Audio(REVEAL_WHOOSH_SFX_URL);
  audio.volume = volume;
  audio.play().catch(() => {
    // ignore autoplay/decoding failures, and a not-yet-provided file's 404
  });
  return audio;
}

// Per-player ambient sting (thunder for 빙밍, a water bloop for 해파린, a
// dragon roar for 하치, etc.) that plays the moment the popup opens — before
// the viewer has even clicked to reveal the card. Lives in public/sfxes/
// (not src/web/assets/toty-cards/, so it isn't glob-scanned by
// totyCardAssets.ts) — a missing file just 404s and playRevealSfx-style
// silently no-ops, same as the shared reveal stinger above, so a player
// without one yet simply gets no sound instead of a fallback.
function playPopupOpenSfx(streamerId: string, volume: number): HTMLAudioElement {
  const audio = new Audio(`/sfxes/${streamerId}-popup-open.mp3`);
  audio.volume = volume;
  audio.play().catch(() => {
    // ignore autoplay/decoding failures, and a not-yet-provided file's 404
  });
  return audio;
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

  // Easter egg: shows a crude crayon-on-sketchbook version of the card
  // instead (see docs/toty-card-prompts.md) — only possible once that
  // streamer's <id>-lowq-* trio has actually been added, so this stays a
  // no-op (always false) for everyone else. Per streamer (see
  // totyCardLowQualityRoll.ts): the first-ever open is 50/50 random, every
  // open after that alternates with the previous one. Rolled once per popup
  // open via a ref guarded against React StrictMode's dev-only double-
  // invocation of the component body — rollTotyCardLowQuality both reads
  // and writes localStorage, so calling it twice in a row here would
  // silently cancel the alternation back to its prior value.
  const lowQualityAssets = getLowQualityTotyCardAssets(streamer.id);
  const lowQualityRolledRef = useRef<boolean | null>(null);
  if (lowQualityRolledRef.current === null) {
    lowQualityRolledRef.current = Boolean(lowQualityAssets) && rollTotyCardLowQuality(streamer.id);
  }
  const useLowQuality = lowQualityRolledRef.current;
  const cardAssets = useLowQuality && lowQualityAssets ? lowQualityAssets : assets;

  // playRevealSfx/playPopupOpenSfx each spin up their own independent Audio
  // element (see their comments above), so nothing normally holds onto them
  // — track the ones this popup has started here so they can all be cut off
  // together if the popup closes while one is still playing.
  const localSfxRef = useRef<HTMLAudioElement[]>([]);
  useEffect(() => {
    return () => {
      for (const audio of localSfxRef.current) audio.pause();
      // Also cuts off the streamer's own click sfx below, which plays via
      // the shared sfxAudio.ts singleton rather than a locally-tracked Audio.
      stopSfx();
    };
  }, []);

  // Plays once, immediately, over the face-down "클릭해서 카드 공개" screen —
  // separate from (and in addition to) the reveal-impact stinger and the
  // streamer's own click sfx below, both of which stay exactly as they were.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fires once on mount, not on every sfx setting change
  useEffect(() => {
    if (sfxEnabled) localSfxRef.current.push(playPopupOpenSfx(streamer.id, sfxVolume / 100));
  }, []);

  // Fired by TotyCardReveal the instant the viewer clicks "클릭해서 카드 공개".
  const handleRevealStart = () => {
    if (sfxEnabled) localSfxRef.current.push(playRevealWhooshSfx(sfxVolume / 100));
  };

  // Fired by TotyCardReveal at the reveal's impact moment (or immediately,
  // under prefers-reduced-motion) rather than as soon as the popup mounts,
  // so the stinger lands together with the flip/burst instead of ahead of it.
  // Also punches the popup backdrop image/glow (below) — unlike the card's
  // own background/glow layers, these sit outside the 3D flip entirely and
  // are always fully visible, so (unlike the card ones) this moment reads
  // fine for them without waiting for the flip to finish.
  const [backdropShake, setBackdropShake] = useState(false);
  const handleRevealImpact = () => {
    if (sfxEnabled) localSfxRef.current.push(playRevealSfx(sfxVolume / 100));
    setBackdropShake(true);
  };

  const handleCardClick = () => {
    if (sfxEnabled && streamer.sfx) playSfx(streamer.sfx, sfxVolume / 100);
  };

  // The mouse-tilt hint doesn't make sense over a face-down mystery card, so
  // it only appears once TotyCardReveal's flip sequence has actually finished.
  const [revealed, setRevealed] = useState(false);

  const [exportingPng, setExportingPng] = useState(false);
  const handlePngExport = async (characterOverrideUrl?: string) => {
    if (exportingPng) return;
    setExportingPng(true);
    try {
      await exportTotyCardPng(streamer, cardAssets, characterOverrideUrl, useLowQuality);
    } finally {
      setExportingPng(false);
    }
  };

  const backdropUrl = getPopupBackdropUrl(streamer.id);
  const backdropGlowUrl = getPopupBackdropGlowUrl(streamer.id);
  // Both undefined under the lowq easter egg — that variant is explicitly
  // just the three crayon frame/background/character images, no hover swap
  // and no glow overlay (see docs/toty-card-prompts.md).
  const characterHoverUrl = useLowQuality ? undefined : getCharacterHoverUrl(streamer.id);
  // Pre-rendered offline (scripts/generate-toty-preview.mjs) rather than
  // encoded live in the browser — see the script's header comment for why.
  // previewUrl bakes in characterHoverUrl's swap for the whole loop (the
  // capture script's synthetic mouse never leaves the card), so it reads as
  // the "호버 이미지" option once one exists; previewBaseUrl is the older
  // pre-hover capture, offered alongside it as "기본 이미지". Under the lowq
  // easter egg, previewBaseUrl stays hidden (that variant never has a
  // separate pre-hover capture) and previewUrl swaps to the crayon card's
  // own gif (--lowq flag on the same script) instead of the real card's —
  // still hidden if that hasn't been generated for this player yet, rather
  // than falling back to a mismatched download of the real card.
  const previewBaseUrl = useLowQuality ? undefined : getTotyCardPreviewBaseUrl(streamer.id);
  const previewUrl = useLowQuality
    ? getLowQualityTotyCardPreviewUrl(streamer.id)
    : getTotyCardPreviewUrl(streamer.id);

  return (
    <div
      className="toty-card-popup"
      role="dialog"
      aria-modal="true"
      aria-label={`${streamer.displayName} 3D 카드`}
    >
      {/* Own wrapper (rather than .toty-card-popup's own `background`) so the
          impact shake below can move just the backdrop image + glow — not
          the close button or card stage sitting on top of them. The shake
          lands on this wrapper rather than on the image/glow divs
          themselves specifically so it doesn't fight backdrop-glow's own
          continuous drift animation (two `animation` values on one element
          would replace each other, not combine). */}
      <div
        className={`toty-card-popup__backdrop-wrap ${backdropShake ? "toty-card-popup__backdrop-wrap--shake" : ""}`}
      >
        {backdropUrl && (
          <div
            className="toty-card-popup__backdrop"
            aria-hidden="true"
            style={{ backgroundImage: `url(${backdropUrl})` }}
          />
        )}
        {backdropGlowUrl && (
          <div
            className="toty-card-popup__backdrop-glow"
            aria-hidden="true"
            style={{ backgroundImage: `url(${backdropGlowUrl})` }}
          />
        )}
      </div>
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
          assets={cardAssets}
          cardBackUrl={getCardBackUrl(streamer.id)}
          backgroundGlowUrl={useLowQuality ? undefined : getBackgroundGlowUrl(streamer.id)}
          characterHoverUrl={characterHoverUrl}
          lowQuality={useLowQuality}
          onCardClick={handleCardClick}
          onRevealStart={handleRevealStart}
          onImpact={handleRevealImpact}
          onRevealed={() => {
            setRevealed(true);
            markTotyCardRevealed(streamer.id);
          }}
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
          <TotyCardDownloadMenu
            className="toty-card-popup__download"
            icon={<ImageDown aria-hidden="true" />}
            label={exportingPng ? "저장 중..." : "이미지로 저장"}
            disabled={exportingPng}
            options={
              characterHoverUrl
                ? [
                    { key: "base", label: "기본 이미지", onSelect: () => handlePngExport() },
                    { key: "hover", label: "호버 이미지", onSelect: () => handlePngExport(characterHoverUrl) },
                  ]
                : [{ key: "base", label: "기본 이미지", onSelect: () => handlePngExport() }]
            }
          />

          <TotyCardDownloadMenu
            className="toty-card-popup__download"
            icon={<Download aria-hidden="true" />}
            label="움짤로 저장"
            options={[
              ...(previewBaseUrl
                ? [{ key: "base", label: "기본 이미지", href: previewBaseUrl, download: `${streamer.displayName}-3d-card-base.gif` }]
                : []),
              ...(previewUrl
                ? [{ key: "hover", label: "호버 이미지", href: previewUrl, download: `${streamer.displayName}-3d-card-hover.gif` }]
                : []),
            ]}
          />
        </div>
      </div>
    </div>
  );
}
