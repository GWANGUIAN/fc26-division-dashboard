import { useRef, useState, type ReactNode } from "react";

/**
 * Shared primary CTA for the pass-announcement flow (선정 완료 / 합격자 공개) —
 * same pill look, size, and a cursor-tracked holo sheen (radial highlight
 * blended with color-dodge, same trick as the FIFA card's holo shield in
 * cardVisuals.tsx) on both buttons so they read as one control.
 */
export function CtaButton({
  className,
  onClick,
  disabled,
  onHoverStart,
  children,
}: {
  className?: string;
  onClick: () => void;
  disabled?: boolean;
  /** Fires once per hover-in (not while the pointer keeps moving over the
   * button) — e.g. a one-shot hover sfx. Skipped while disabled. */
  onHoverStart?: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [holo, setHolo] = useState({ x: 50, y: 50, active: false });

  function handleMouseEnter() {
    if (!disabled) onHoverStart?.();
  }
  function handleMouseMove(event: React.MouseEvent<HTMLButtonElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setHolo({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
      active: true,
    });
  }
  function handleMouseLeave() {
    setHolo((current) => ({ ...current, active: false }));
  }

  return (
    <button
      ref={ref}
      type="button"
      className={`pass-cta-button ${className ?? ""}`}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={
        {
          "--holo-x": `${holo.x}%`,
          "--holo-y": `${holo.y}%`,
          "--holo-opacity": holo.active ? 1 : 0,
        } as React.CSSProperties
      }
    >
      {children}
    </button>
  );
}
