import { useEffect, useRef, type ReactNode } from "react";
import { useWorldKeys } from "./useWorldKeys";
import "./repeat-content.css";

export function RepeatPanel({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    root.current?.focus();
    return () => previous?.focus();
  }, []);
  useWorldKeys((code, event) => {
    if (code !== "Tab") return false;
    const buttons = [...(root.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [])];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus();
    return true;
  });
  return <div className="world-repeat-backdrop"><section ref={root} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className="world-repeat-panel">
    <header><h2>{title}</h2><button onClick={onClose}>닫기 · Esc</button></header>{children}
  </section></div>;
}
