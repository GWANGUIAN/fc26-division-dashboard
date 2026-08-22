import { useState } from "react";

export function BrightnessGag() {
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const label = active ? "라이트 오프" : "라이트 온";

  function handleClick() {
    if (playing) return;
    setPlaying(true);
    const audio = new Audio(active ? "/sfxes/light-off.mp3" : "/sfxes/light-on.mp3");
    const finish = () => {
      setPlaying(false);
      const turningOn = !active;
      const turnOnAudio = new Audio("/sfxes/turn-on.mp3");
      if (turningOn) {
        turnOnAudio.addEventListener("ended", () => {
          new Audio("/sfxes/scream.mp3").play().catch(() => {});
        });
      }
      turnOnAudio.play().catch(() => {});
      setActive((current) => !current);
    };
    audio.addEventListener("ended", finish);
    audio.play().catch(finish);
  }

  return (
    <>
      <button
        type="button"
        className={`brightness-gag-toggle${active ? " brightness-gag-toggle--active" : ""}`}
        onClick={handleClick}
        disabled={playing}
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
      {active && <div className="brightness-gag-overlay" aria-hidden="true" />}
    </>
  );
}
