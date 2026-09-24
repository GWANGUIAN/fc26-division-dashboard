import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  cursorAssetUrls,
  cursorRoleFromCss,
  getCursorPlayer,
  type CursorGlyphRole,
  type CursorPlayerId,
} from "./cursorCatalog";

type SuppressedCursor = { element: HTMLElement; value: string; priority: string };

function canUseFinePointer() {
  return typeof window !== "undefined"
    && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function CursorOverlay({ playerId }: { playerId: CursorPlayerId }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const suppressedRef = useRef<SuppressedCursor | undefined>(undefined);
  const [enabled, setEnabled] = useState(canUseFinePointer);
  const [visible, setVisible] = useState(false);
  const [role, setRole] = useState<CursorGlyphRole>("default");
  const player = getCursorPlayer(playerId);
  const assets = cursorAssetUrls(playerId);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setEnabled(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const restore = () => {
      const saved = suppressedRef.current;
      if (!saved) return;
      if (saved.value) saved.element.style.setProperty("cursor", saved.value, saved.priority);
      else saved.element.style.removeProperty("cursor");
      suppressedRef.current = undefined;
    };
    const hide = () => {
      restore();
      setVisible(false);
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      let candidate = event.target instanceof Element ? event.target : null;
      let target: HTMLElement | null = null;
      while (candidate && !target) {
        if (candidate instanceof HTMLElement) target = candidate;
        candidate = candidate.parentElement;
      }
      if (!target || target.closest(".cursor-overlay")) return;
      if (suppressedRef.current?.element !== target) {
        restore();
        const computed = getComputedStyle(target).cursor;
        const nextRole = cursorRoleFromCss(computed);
        setRole(nextRole);
        suppressedRef.current = {
          element: target,
          value: target.style.getPropertyValue("cursor"),
          priority: target.style.getPropertyPriority("cursor"),
        };
        target.style.setProperty("cursor", "none", "important");
      }
      const overlay = overlayRef.current;
      if (overlay) overlay.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      setVisible(true);
    };

    document.addEventListener("pointermove", move, true);
    document.documentElement.addEventListener("mouseleave", hide);
    window.addEventListener("blur", hide);
    return () => {
      document.removeEventListener("pointermove", move, true);
      document.documentElement.removeEventListener("mouseleave", hide);
      window.removeEventListener("blur", hide);
      restore();
    };
  }, [enabled]);

  if (!enabled) return null;
  const glyphUrl = assets.glyph[role] ?? assets.glyph.default;

  return (
    <div
      ref={overlayRef}
      className={`cursor-overlay ${visible ? "cursor-overlay--visible" : ""}`}
      style={{ "--cursor-accent": player.accent } as CSSProperties}
      aria-hidden="true"
    >
      {glyphUrl ? <img className="cursor-overlay__glyph" src={glyphUrl} alt="" draggable={false} /> : <span className={`cursor-overlay__glyph-fallback cursor-overlay__glyph-fallback--${role}`} />}
      {assets.motion ? (
        <span className="cursor-overlay__motion" style={{ backgroundImage: `url(${assets.motion})` }} />
      ) : (
        <span className="cursor-overlay__motion-fallback" />
      )}
    </div>
  );
}
