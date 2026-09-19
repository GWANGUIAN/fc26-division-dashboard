import { useState, type CSSProperties } from "react";
// Renders on page load (the overlay itself is lazy), so its styles live in a stylesheet that ships
// with the main bundle — same split as FortuneToggle / FreekickToggle.
import "./world-toggle.css";
import { isWorldDiscovered, markWorldDiscovered } from "./storage";

// Only the three button images are pulled into the main bundle (not the whole world asset set).
// If they have not been converted yet the glob is empty and the CSS fallback plate is used.
const FAB_URLS = import.meta.glob<string>("../assets/world/ui/fab-normal.webp", {
  eager: true,
  query: "?url&no-inline",
  import: "default",
});
const fabUrl = (name: string) => FAB_URLS[`../assets/world/ui/fab-${name}.webp`];

const FANCY_COLOR = "#00e9ae";

export function WorldToggle({ onClick }: { onClick: () => void }) {
  const [discovered, setDiscovered] = useState(() => isWorldDiscovered());
  const [broken, setBroken] = useState<ReadonlySet<string>>(new Set());

  const usable = (name: string) => (broken.has(name) ? undefined : fabUrl(name));
  const markBroken = (name: string) => setBroken((current) => new Set(current).add(name));
  const normal = usable("normal");

  function handleClick() {
    if (!discovered) {
      markWorldDiscovered();
      setDiscovered(true);
    }
    onClick();
  }

  const className = ["world-toggle", normal ? "world-toggle--art" : "", discovered ? "" : "world-toggle--new"]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      aria-label="잔디동 월드 구경하기"
      style={{ "--fancy-color": FANCY_COLOR } as CSSProperties}
    >
      <span className="world-toggle__plate" aria-hidden="true">
        <span className="world-toggle__fallback" />
        {normal && <img className="world-toggle__img" src={normal} alt="" draggable={false} onError={() => markBroken("normal")} />}
        <span className="world-toggle__label">잔디동 월드 구경하기</span>
      </span>
      {!discovered && (
        <span className="view-toggle-card__sparks" aria-hidden="true">
          <i className="view-toggle-card__spark view-toggle-card__spark--1">✦</i>
          <i className="view-toggle-card__spark view-toggle-card__spark--2">✦</i>
          <i className="view-toggle-card__spark view-toggle-card__spark--3">✦</i>
          <i className="view-toggle-card__spark view-toggle-card__spark--4">✦</i>
          <i className="view-toggle-card__spark view-toggle-card__spark--5">✦</i>
        </span>
      )}
      {!discovered && <span className="world-toggle__bubble">잔디동 마을이 열렸어요!</span>}
    </button>
  );
}
