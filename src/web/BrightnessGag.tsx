import { useEffect, useState } from "react";

const SLIDE_FALLBACK_MS = 500;
const SHUTTER_FALLBACK_MS = 500;

const SFX_URLS = [
  "/sfxes/light-on.mp3",
  "/sfxes/light-off.mp3",
  "/sfxes/turn-on.mp3",
  "/sfxes/scream.mp3",
  "/sfxes/shine.mp3",
];

export function BrightnessGag() {
  useEffect(() => {
    const warmups = SFX_URLS.map((src) => {
      const audio = new Audio();
      audio.preload = "auto";
      audio.src = src;
      return audio;
    });
    return () => {
      warmups.forEach((audio) => {
        audio.src = "";
      });
    };
  }, []);

  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [introPlaying, setIntroPlaying] = useState(false);
  const [introPhase, setIntroPhase] = useState<"slide" | "shutter">("slide");
  const [slideDurationMs, setSlideDurationMs] = useState(SLIDE_FALLBACK_MS);
  const [shutterDurationMs, setShutterDurationMs] = useState(SHUTTER_FALLBACK_MS);
  const label = active ? "라이트 오프" : "라이트 온";

  function playTurnOnSound(withScream: boolean) {
    const turnOnAudio = new Audio("/sfxes/turn-on.mp3");
    if (withScream) {
      turnOnAudio.addEventListener("ended", () => {
        new Audio("/sfxes/scream.mp3").play().catch(() => {});
      });
    }
    turnOnAudio.play().catch(() => {});
  }

  function turnOn() {
    setPlaying(true);
    setIntroPhase("slide");
    setIntroPlaying(true);
    const shine = new Audio("/sfxes/shine.mp3");
    const beginSlide = () => {
      const duration = shine.duration;
      setSlideDurationMs(
        Number.isFinite(duration) && duration > 0
          ? duration * 1000
          : SLIDE_FALLBACK_MS,
      );
      shine.play().catch(() => {});
    };
    shine.addEventListener("loadedmetadata", beginSlide, { once: true });
    shine.addEventListener("error", beginSlide, { once: true });
  }

  function handleSlideEnd() {
    setIntroPhase("shutter");
    const audio = new Audio("/sfxes/light-on.mp3");
    const start = () => {
      const duration = audio.duration;
      setShutterDurationMs(
        Number.isFinite(duration) && duration > 0
          ? duration * 1000
          : SHUTTER_FALLBACK_MS,
      );
      audio.play().catch(finish);
    };
    const finish = () => {
      setPlaying(false);
      setIntroPlaying(false);
      playTurnOnSound(true);
      setActive(true);
    };
    audio.addEventListener("loadedmetadata", start, { once: true });
    audio.addEventListener("error", start, { once: true });
    audio.addEventListener("ended", finish);
  }

  function turnOff() {
    setPlaying(true);
    const audio = new Audio("/sfxes/light-off.mp3");
    const finish = () => {
      setPlaying(false);
      playTurnOnSound(false);
      setActive(false);
    };
    audio.addEventListener("ended", finish);
    audio.play().catch(finish);
  }

  function handleClick() {
    if (playing || introPlaying) return;
    if (active) turnOff();
    else turnOn();
  }

  return (
    <>
      <button
        type="button"
        className={`brightness-gag-toggle${active ? " brightness-gag-toggle--active" : ""}${!active && playing ? " brightness-gag-toggle--hidden" : ""}`}
        onClick={handleClick}
        disabled={playing || introPlaying}
        aria-pressed={active}
        aria-label="밝기 10 (경기장 화이트아웃 패러디)"
        title="밝기 10"
      >
        <span className="brightness-gag-toggle__circle">
          <img
            src="/profiles/iro.webp"
            alt=""
            aria-hidden="true"
            className="brightness-gag-toggle__photo"
          />
        </span>
        <svg
          className="brightness-gag-toggle__label"
          viewBox="0 0 128 50"
          aria-hidden="true"
        >
          <path id="brightness-gag-arc" d="M 14,15 A 64,64 0 0 0 114,15" fill="none" />
          <text>
            <textPath href="#brightness-gag-arc" startOffset="50%" textAnchor="middle">
              {label}
            </textPath>
          </text>
        </svg>
      </button>
      {introPlaying && (
        <div
          className="brightness-gag-intro"
          aria-hidden="true"
          style={
            {
              "--slide-duration": `${slideDurationMs}ms`,
              "--shutter-duration": `${shutterDurationMs}ms`,
            } as React.CSSProperties
          }
        >
          <img
            src="/profiles/iro.webp"
            alt=""
            className="brightness-gag-intro__image"
            onAnimationEnd={handleSlideEnd}
          />
          {introPhase === "shutter" && (
            <>
              <div className="brightness-gag-intro__shutter brightness-gag-intro__shutter--top" />
              <div className="brightness-gag-intro__shutter brightness-gag-intro__shutter--bottom" />
            </>
          )}
        </div>
      )}
      {active && <div className="brightness-gag-overlay" aria-hidden="true" />}
    </>
  );
}
