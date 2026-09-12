import { useEffect, useRef, useState } from "react";
import { MousePointer2, X } from "lucide-react";
import type { StreamerRecord } from "../../shared/model.js";
import { useEscape } from "../Modal.js";
import { playSfx } from "../sfxAudio.js";
import { getPopupBackdropUrl, type TotyCardAssets } from "./totyCardAssets.js";
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
  streamer: Pick<StreamerRecord, "displayName" | "hopedPosition1" | "currentDivision" | "sfx">;
  assets: TotyCardAssets;
  sfxEnabled: boolean;
  sfxVolume: number;
  onClose: () => void;
}) {
  useEscape(onClose);
  useBodyScrollLock();

  // eslint-disable-next-line react-hooks/exhaustive-deps -- fires once when the popup opens, not on every sfx setting change
  useEffect(() => {
    if (sfxEnabled) playRevealSfx(sfxVolume / 100);
  }, []);

  const handleCardClick = () => {
    if (sfxEnabled && streamer.sfx) playSfx(streamer.sfx, sfxVolume / 100);
  };

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

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
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

  const backdropUrl = getPopupBackdropUrl();

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
        <div
          ref={cardRef}
          className={`toty-card ${tilt.active ? "toty-card--active" : ""}`}
          onClick={handleCardClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={
            {
              "--pointer-x": `${tilt.px}%`,
              "--pointer-y": `${tilt.py}%`,
              ...(tilt.active
                ? {
                    transform: `perspective(900px) translateY(-6px) scale(1.04) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
                  }
                : {}),
            } as React.CSSProperties
          }
        >
          <div className="toty-card__window">
            <div className="toty-card__idle-bg">
              <img
                className="toty-card__bg"
                src={assets.background}
                alt=""
                style={{ transform: `translate(${tilt.bgX}px, ${tilt.bgY}px) scale(1.06)` }}
              />
            </div>
            <div className="toty-card__idle-char">
              <img
                className="toty-card__char"
                src={assets.character}
                alt=""
                style={{ transform: `translate(${tilt.charX}px, ${tilt.charY}px)` }}
              />
            </div>
            <span className="toty-card__glare" aria-hidden="true" />
            <span className="toty-card__foil" aria-hidden="true" />
          </div>
          <img className="toty-card__frame" src={assets.frame} alt="" />

          <div className="toty-card__stats">
            {streamer.hopedPosition1 && (
              <b className="toty-card__pos">{streamer.hopedPosition1}</b>
            )}
            <span className="toty-card__div">D{streamer.currentDivision}</span>
          </div>
          <div className="toty-card__name" data-text={streamer.displayName}>
            {streamer.displayName}
          </div>
        </div>

        <p className="toty-card-popup__hint">
          <MousePointer2 aria-hidden="true" />
          카드에 마우스를 올려 움직여 보세요
        </p>
      </div>
    </div>
  );
}
