import { useState } from "react";

export function BrightnessGag() {
  const [active, setActive] = useState(false);
  return (
    <>
      <button
        type="button"
        className={`brightness-gag-toggle${active ? " brightness-gag-toggle--active" : ""}`}
        onClick={() => setActive((current) => !current)}
        aria-pressed={active}
        aria-label="밝기 10 (경기장 화이트아웃 패러디)"
        title="밝기 10"
      >
        라이트 온
      </button>
      {active && <div className="brightness-gag-overlay" aria-hidden="true" />}
    </>
  );
}
