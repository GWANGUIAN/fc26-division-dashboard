// A one-shot message handed from the pitch to the dashboard when the pitch could not run (docs/pitch/01 §9):
// the pitch sets it just before switching, the dashboard's toast reads it once on mount.

export const PITCH_FALLBACK_NOTICE = "피치를 불러오지 못해 대시보드로 이동했어요";

let pending: string | null = null;

export function setEntryNotice(message: string) {
  pending = message;
}

/** Returns the pending message once, then clears it. */
export function consumeEntryNotice(): string | null {
  const message = pending;
  pending = null;
  return message;
}
