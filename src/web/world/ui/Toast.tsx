import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { getWorldAssetUrl } from "../worldAssets";

export interface ToastMessage {
  id: number;
  text: string;
  /** Small colour chip before the text (a district's tint) — a code-drawn icon instead of an emoji. */
  accent?: string;
  /** Region notices replace only earlier region notices; rewards remain independently queued. */
  channel?: "region" | "default";
}

const TOAST_MS = 2600;
const MAX_TOASTS = 2;

/** Region notices are replaceable context, unlike rewards, which retain their queue order. */
export function nextToasts(current: readonly ToastMessage[], next: ToastMessage, max = MAX_TOASTS): ToastMessage[] {
  const withoutPriorRegion = next.channel === "region" ? current.filter((toast) => toast.channel !== "region") : current;
  return [...withoutPriorRegion.slice(-(max - 1)), next];
}

/** Toast queue: `push` shows a banner for a couple of seconds; the newest MAX_TOASTS stay on screen. */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Set<number>());

  const push = useCallback((text: string, accent?: string, channel: ToastMessage["channel"] = "default") => {
    const id = nextId.current++;
    setToasts((current) => {
      return nextToasts(current, { id, text, accent, channel });
    });
    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, TOAST_MS);
    timers.current.add(timer);
  }, []);

  useEffect(() => {
    const active = timers.current;
    return () => active.forEach((timer) => window.clearTimeout(timer));
  }, []);

  return { toasts, push };
}

export function ToastLayer({ toasts }: { toasts: readonly ToastMessage[] }) {
  const frame = getWorldAssetUrl("ui/toast-frame");
  const style = frame ? ({ "--frame-toast": `url(${frame})` } as CSSProperties) : undefined;
  return (
    <div className="world-toasts" style={style} role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`world-toast${frame ? " world-toast--art" : ""}`}>
          {toast.accent && <span className="world-toast__chip" style={{ background: toast.accent }} aria-hidden="true" />}
          {toast.text}
        </div>
      ))}
    </div>
  );
}
