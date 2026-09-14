import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Images, Music4, X } from "lucide-react";
import type { StreamerRecord } from "../../shared/model.js";
import { useEscape } from "../Modal.js";
import { playSfx, stopSfx } from "../sfxAudio.js";
import { SoundControl } from "../minigame/SoundControl.js";
import { FortuneDraw } from "./FortuneDraw";
import { FortuneHistoryModal } from "./FortuneHistoryModal";
import { FortuneBonusAnnounce } from "./FortuneBonusAnnounce";
import { FORTUNE_CARDS } from "./fortuneCardData";
import {
  getFortuneDrawButtonUrl,
  getFortuneMascotUrl,
  getFortunePopupBackdropGlowUrl,
  getFortunePopupBackdropUrl,
  getFortuneTitleUrl,
} from "./fortuneCardAssets";
import { getFortuneRevealedIds, subscribeFortuneCardRevealed } from "./fortuneCardHistoryStore";
import { useFortuneBonusUnlock } from "./useFortuneBonusUnlock";
import { useFortuneMusic } from "./useFortuneMusic";
import "./fortune-popup.css";

// Independent Audio() instances (not the shared single-slot sfxAudio.ts
// player) — same reasoning as TotyCardPopup's own reveal stingers: these
// shouldn't get cut off by each other or by anything else playing via the
// shared slot.
//
// Self-removes from `tracked` once playback ends/errors, instead of just
// accumulating there for the popup's whole lifetime — a single draw can fire
// several of these (shuffle + up to 3 hovers + select), so leaving finished
// ones in the array let it grow unbounded across "다시 뽑기" replays within
// one popup session. `tracked` still exists so FortunePopup's unmount
// cleanup can pause anything still actually playing.
function playLocalSfx(url: string, volume: number, tracked: HTMLAudioElement[]): void {
  const audio = new Audio(url);
  audio.volume = volume;
  const untrack = () => {
    const index = tracked.indexOf(audio);
    if (index !== -1) tracked.splice(index, 1);
  };
  audio.addEventListener("ended", untrack);
  audio.addEventListener("error", untrack);
  tracked.push(audio);
  audio.play().catch(() => {
    // ignore autoplay/decoding failures, and a not-yet-provided file's 404
    untrack();
  });
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
  const [bonusAnnounceVisible, setBonusAnnounceVisible] = useState(false);
  const bonusUnlocked = useFortuneBonusUnlock(() => setBonusAnnounceVisible(true));

  // Reactive so the checkbox locks itself the instant the last card gets
  // revealed, without needing the popup closed/reopened.
  const revealedCount = useSyncExternalStore(
    subscribeFortuneCardRevealed,
    () => getFortuneRevealedIds().size,
  );
  const totalCardCount = FORTUNE_CARDS.length + (bonusUnlocked ? 1 : 0);
  // Only disabled once there's truly nothing new left to draw — with 1-2
  // unrevealed cards remaining, FortuneDraw.tsx's drawThree() samples them
  // WITH replacement so the 3-card spread still always shows 3 backs and
  // every one of them is still guaranteed new (see drawWithReplacement).
  // Unlocking the hidden 우왁굳 card after drawing all 11 regular ones bumps
  // totalCardCount to 12 while revealedCount stays at 11, which re-enables
  // this on its own — no separate wiring needed for that case.
  const newCardsRemaining = totalCardCount - revealedCount;
  const newOnlyUnavailable = newCardsRemaining < 1;

  // Deliberately NOT force-reset to false when newOnlyUnavailable goes
  // true — it used to be, but that fought the 우왁굳 unlock sequence: the
  // instant the 11th regular card is revealed, newOnlyUnavailable flips
  // true for one render (nothing new left yet) and then false again right
  // after (the bonus card unlocking adds one), and forcing the checkbox
  // off during that brief window threw away whatever the viewer had it
  // set to. The checkbox's own `disabled` state below already keeps it
  // inert while nothing new exists — and `onlyNewCards={onlyNewCards &&
  // !newOnlyUnavailable}` passed to FortuneDraw is what actually gates the
  // behavior — so leaving the underlying state alone just means it picks
  // back up automatically the moment something new becomes drawable again.
  const [onlyNewCards, setOnlyNewCards] = useState(true);

  const localSfxRef = useRef<HTMLAudioElement[]>([]);
  useEffect(() => {
    return () => {
      for (const audio of localSfxRef.current) audio.pause();
      // Also cuts off the currently revealed card's streamer sfx (see
      // handleStreamerSfx below), which plays through the shared
      // sfxAudio.ts singleton rather than one of the local Audio()
      // instances tracked above — same reasoning as TotyCardPopup's own
      // unmount cleanup.
      stopSfx();
    };
  }, []);

  const handleShuffleStart = () => {
    if (sfxEnabled) playLocalSfx("/sfxes/fortune-shuffle.mp3", sfxVolume / 100, localSfxRef.current);
  };
  const handleCardHover = () => {
    if (sfxEnabled) playLocalSfx("/sfxes/fortune-card-hover.mp3", sfxVolume / 100, localSfxRef.current);
  };
  const handleCardSelectImpact = () => {
    if (sfxEnabled) playLocalSfx("/sfxes/fortune-card-select.mp3", sfxVolume / 100, localSfxRef.current);
  };
  // That specific player's own click sfx — routed through the shared
  // sfxAudio.ts singleton (not the independent Audio() instances above),
  // same convention TOTY's TotyCardPopup.handleCardClick uses for a
  // streamer's own sfx.
  const handleStreamerSfx = (url: string) => {
    if (sfxEnabled) playSfx(url, sfxVolume / 100);
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

      <div className="fortune-popup__top-left-controls">
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
        <label
          className={`fortune-popup__new-only-toggle ${newOnlyUnavailable ? "fortune-popup__new-only-toggle--disabled" : ""}`}
          title={newOnlyUnavailable ? "모든 카드를 다 뽑았어요" : "새로운 카드만 뽑기"}
        >
          <input
            type="checkbox"
            checked={onlyNewCards}
            disabled={newOnlyUnavailable}
            onChange={(event) => setOnlyNewCards(event.target.checked)}
          />
          <span>새로운 카드만 뽑기</span>
        </label>
      </div>

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
            <div className="fortune-popup__mascot-wrap">
              <span className="fortune-popup__mascot-sparks" aria-hidden="true">
                <i className="fortune-popup__mascot-spark fortune-popup__mascot-spark--1">✦</i>
                <i className="fortune-popup__mascot-spark fortune-popup__mascot-spark--2">✦</i>
                <i className="fortune-popup__mascot-spark fortune-popup__mascot-spark--3">✦</i>
                <i className="fortune-popup__mascot-spark fortune-popup__mascot-spark--4">✦</i>
                <i className="fortune-popup__mascot-spark fortune-popup__mascot-spark--5">✦</i>
                <i className="fortune-popup__mascot-spark fortune-popup__mascot-spark--6">✦</i>
              </span>
              {mascotUrl ? (
                <img src={mascotUrl} alt="" className="fortune-popup__mascot" />
              ) : (
                <div className="fortune-popup__mascot-fallback" aria-hidden="true">
                  🧙
                </div>
              )}
            </div>
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
            includeHidden={bonusUnlocked}
            onlyNewCards={onlyNewCards && !newOnlyUnavailable}
            onShuffleStart={handleShuffleStart}
            onCardHover={handleCardHover}
            onCardSelectImpact={handleCardSelectImpact}
            onStreamerSfx={handleStreamerSfx}
          />
        )}
      </div>

      {historyOpen && <FortuneHistoryModal streamers={streamers} onClose={() => setHistoryOpen(false)} />}
      {bonusAnnounceVisible && <FortuneBonusAnnounce onDone={() => setBonusAnnounceVisible(false)} />}
    </div>
  );
}
