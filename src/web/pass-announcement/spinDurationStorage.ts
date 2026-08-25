const SPIN_DURATION_STORAGE_KEY = "fc26-pass-announcement-spin-seconds";

/** Matches the spin's original hardcoded duration, kept as the default. */
export const SPIN_DURATION_DEFAULT = 4;
export const SPIN_DURATION_MIN = 1;
export const SPIN_DURATION_MAX = 10;

export function loadSpinDurationSeconds(): number {
  try {
    const raw = localStorage.getItem(SPIN_DURATION_STORAGE_KEY);
    if (!raw) return SPIN_DURATION_DEFAULT;
    const value = Number(raw);
    if (!Number.isFinite(value)) return SPIN_DURATION_DEFAULT;
    return Math.min(SPIN_DURATION_MAX, Math.max(SPIN_DURATION_MIN, value));
  } catch {
    return SPIN_DURATION_DEFAULT;
  }
}

export function saveSpinDurationSeconds(value: number) {
  try {
    localStorage.setItem(SPIN_DURATION_STORAGE_KEY, String(value));
  } catch {
    /* ignore quota/private-browsing errors */
  }
}
