import { useState } from "react";

export function BrightnessGag() {
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);

  function handleClick() {
    if (playing) return;
    setPlaying(true);
    const audio = new Audio(active ? "/sfxes/light-off.mp3" : "/sfxes/light-on.mp3");
    const finish = () => {
      setPlaying(false);
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
        <img
          src="/profiles/iro.webp"
          alt=""
          aria-hidden="true"
          className="brightness-gag-toggle__icon"
        />
        {active ? "라이트 오프" : "라이트 온"}
      </button>
      {active && <div className="brightness-gag-overlay" aria-hidden="true" />}
    </>
  );
}
