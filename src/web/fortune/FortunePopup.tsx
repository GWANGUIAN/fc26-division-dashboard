import { useEffect, useRef, useState } from "react";
import { Images, Music4, X } from "lucide-react";
import type { StreamerRecord } from "../../shared/model.js";
import { useEscape } from "../Modal.js";
import { SoundControl } from "../minigame/SoundControl.js";
import { FortuneDraw } from "./FortuneDraw";
import { FortuneHistoryModal } from "./FortuneHistoryModal";
import {
  getFortuneDrawButtonUrl,
  getFortuneMascotUrl,
  getFortunePopupBackdropGlowUrl,
  getFortunePopupBackdropUrl,
  getFortuneTitleUrl,
} from "./fortuneCardAssets";
import { useFortuneMusic } from "./useFortuneMusic";
import "./fortune-popup.css";

// Independent Audio() instances (not the shared single-slot sfxAudio.ts
// player) — same reasoning as TotyCardPopup's own reveal stingers: these
// shouldn't get cut off by each other or by anything else playing via the
// shared slot.
function playLocalSfx(url: string, volume: number): HTMLAudioElement {
  const audio = new Audio(url);
  audio.volume = volume;
  audio.play().catch(() => {
    // ignore autoplay/decoding failures, and a not-yet-provided file's 404
  });
  return audio;
}

/** Locks the page behind the overlay from scrolling while it's open — same
 * implementation as TotyCardPopup's own (each bespoke fixed overlay in this
 * codebase keeps its own copy rather than sharing one, see toty-card.css's
 * header comment about squad-builder/photo-booth following the same
 * convention). */
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

export function FortunePopup({
  streamers,
  sfxEnabled,
  sfxVolume,
  onClose,
}: {
  streamers?: StreamerRecord[];
  sfxEnabled: boolean;
  sfxVolume: number;
  onClose: () => void;
}) {
  useEscape(onClose);
  useBodyScrollLock();
  const { musicOn, toggleMusic, musicVolume, changeMusicVolume } = useFortuneMusic();

  const [started, setStarted] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const localSfxRef = useRef<HTMLAudioElement[]>([]);
  useEffect(() => {
    return () => {
      for (const audio of localSfxRef.current) audio.pause();
    };
  }, []);

  const handleShuffleStart = () => {
    if (sfxEnabled) localSfxRef.current.push(playLocalSfx("/sfxes/fortune-shuffle.mp3", sfxVolume / 100));
  };
  const handleCardHover = () => {
    if (sfxEnabled) localSfxRef.current.push(playLocalSfx("/sfxes/fortune-card-hover.mp3", sfxVolume / 100));
  };
  const handleCardSelectImpact = () => {
    if (sfxEnabled) localSfxRef.current.push(playLocalSfx("/sfxes/fortune-card-select.mp3", sfxVolume / 100));
  };

  const backdropUrl = getFortunePopupBackdropUrl();
  const backdropGlowUrl = getFortunePopupBackdropGlowUrl();
  const titleUrl = getFortuneTitleUrl();
  const mascotUrl = getFortuneMascotUrl();
  const drawButtonUrl = getFortuneDrawButtonUrl();

  return (
    <div className="fortune-popup" role="dialog" aria-modal="true" aria-label="오늘의 운세">
      <div className="fortune-popup__backdrop-wrap">
        {backdropUrl && (
          <div className="fortune-popup__backdrop" aria-hidden="true" style={{ backgroundImage: `url(${backdropUrl})` }} />
        )}
        {backdropGlowUrl && (
          <div
            className="fortune-popup__backdrop-glow"
            aria-hidden="true"
            style={{ backgroundImage: `url(${backdropGlowUrl})` }}
          />
        )}
      </div>
      <div className="fortune-popup__scrim" aria-hidden="true" />

      <button
        type="button"
        className="fortune-popup__history-btn"
        onClick={() => setHistoryOpen(true)}
        aria-label="뽑았던 카드 보기"
        title="뽑았던 카드 보기"
      >
        <Images aria-hidden="true" />
        <span>뽑았던 카드 보기</span>
      </button>

      <SoundControl
        enabled={musicOn}
        volume={musicVolume}
        onToggle={toggleMusic}
        onVolumeChange={changeMusicVolume}
        icon={<Music4 aria-hidden="true" />}
        label="배경음악"
        wrapperClassName={`fortune-popup__music-toggle ${musicOn ? "" : "fortune-popup__music-toggle--muted"}`}
      />
      <button type="button" className="fortune-popup__close" onClick={onClose} aria-label="오늘의 운세 닫기">
        <X aria-hidden="true" />
      </button>

      <div className="fortune-popup__stage">
        {!started ? (
          <>
            {titleUrl ? (
              <img src={titleUrl} alt="오늘의 운세 뽑아보기" className="fortune-popup__title" />
            ) : (
              <h2 className="fortune-popup__title-fallback">🔮 오늘의 운세 뽑아보기</h2>
            )}
            {mascotUrl ? (
              <img src={mascotUrl} alt="" className="fortune-popup__mascot" />
            ) : (
              <div className="fortune-popup__mascot-fallback" aria-hidden="true">
                🧙
              </div>
            )}
            <button type="button" className="fortune-popup__draw-btn" onClick={() => setStarted(true)}>
              {drawButtonUrl ? (
                <img src={drawButtonUrl} alt="운세 뽑기" />
              ) : (
                <span className="fortune-popup__draw-btn-fallback">운세 뽑기</span>
              )}
            </button>
          </>
        ) : (
          <FortuneDraw
            streamers={streamers}
            onShuffleStart={handleShuffleStart}
            onCardHover={handleCardHover}
            onCardSelectImpact={handleCardSelectImpact}
          />
        )}
      </div>

      {historyOpen && <FortuneHistoryModal streamers={streamers} onClose={() => setHistoryOpen(false)} />}
    </div>
  );
}
