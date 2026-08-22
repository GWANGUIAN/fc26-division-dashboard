import { useEffect, type ReactNode } from "react";
import { hexToRgba } from "./cardVisuals";
import soopIcon from "./assets/soop_icon.svg";

const cafeIcon = "N";

const FANCY_BURST_STARS = [
  { left: "6%", delay: "0s", duration: "1.5s", size: 13 },
  { left: "18%", delay: ".18s", duration: "1.8s", size: 9 },
  { left: "30%", delay: ".05s", duration: "1.4s", size: 15 },
  { left: "43%", delay: ".32s", duration: "1.7s", size: 10 },
  { left: "56%", delay: ".12s", duration: "1.6s", size: 12 },
  { left: "68%", delay: ".26s", duration: "1.9s", size: 9 },
  { left: "80%", delay: ".08s", duration: "1.5s", size: 14 },
  { left: "92%", delay: ".2s", duration: "1.7s", size: 10 },
];

// The lite tier gets barely any of the stars, dawdling in twice as slowly.
const FANCY_BURST_LITE_STARS = [
  { left: "24%", delay: "0s", duration: "3.4s", size: 7 },
  { left: "74%", delay: "1.7s", duration: "3.8s", size: 6 },
];

export function FancyBurst({
  color = "#00e9ae",
  tier = "full",
}: {
  color?: string;
  tier?: "full" | "lite";
}) {
  const lite = tier === "lite";
  return (
    <div
      className={`fancy-burst ${lite ? "fancy-burst--lite" : ""}`}
      aria-hidden="true"
      style={{ "--fancy-color": color } as React.CSSProperties}
    >
      {(lite ? FANCY_BURST_LITE_STARS : FANCY_BURST_STARS).map(
        (star, index) => (
          <span
            className="fancy-burst__star"
            key={index}
            style={{
              left: star.left,
              fontSize: star.size,
              animationDelay: star.delay,
              animationDuration: star.duration,
            }}
          >
            ✦
          </span>
        ),
      )}
    </div>
  );
}

export function CafeLink({
  href,
  label = "왁물원 게시글",
}: {
  href: string;
  label?: string;
}) {
  return (
    <a className="action cafe" href={href} target="_blank" rel="noreferrer">
      <i>{cafeIcon}</i> {label}
    </a>
  );
}

export function SoopLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a className="action soop" href={href} target="_blank" rel="noreferrer">
      <img className="soop-icon" src={soopIcon} alt="" />
      {children}
    </a>
  );
}

export function Modal({
  children,
  header,
  onClose,
  label,
  decoration,
  fancyBorderColor,
  fancyLite,
}: {
  children: ReactNode;
  header: ReactNode;
  onClose: () => void;
  label: string;
  decoration?: ReactNode;
  fancyBorderColor?: string;
  fancyLite?: boolean;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="modal-frame"
        style={
          fancyBorderColor
            ? ({
                "--fancy-color": fancyBorderColor,
                "--fancy-glow-soft": hexToRgba(
                  fancyBorderColor,
                  fancyLite ? 0.16 : 0.4,
                ),
                "--fancy-glow-strong": hexToRgba(
                  fancyBorderColor,
                  fancyLite ? 0.35 : 0.9,
                ),
              } as React.CSSProperties)
            : undefined
        }
      >
        <section
          className={`modal ${fancyBorderColor ? "fancy-border" : ""} ${fancyBorderColor && fancyLite ? "fancy-border--lite" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          onMouseDown={(event) => event.stopPropagation()}
        >
          {decoration}
          <div className="modal__header">
            {header}
            <button className="close" onClick={onClose} aria-label="닫기">
              ×
            </button>
          </div>
          <div className="modal__body">{children}</div>
        </section>
        {fancyBorderColor && (
          <img
            className={`fancy-ball ${fancyLite ? "fancy-ball--lite" : ""}`}
            src={fancyLite ? "/burst_soccer_ball.webp" : "/soccer_ball.webp"}
            alt=""
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}

export function useEscape(onClose: () => void) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    addEventListener("keydown", close);
    return () => removeEventListener("keydown", close);
  }, [onClose]);
}
