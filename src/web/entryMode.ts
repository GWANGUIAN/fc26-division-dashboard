import { useCallback, useState } from "react";
import { loadEntryMode, saveEntryMode, type EntryMode } from "./storage";

// 진입 게이트 규칙 (docs/pitch/01 §4-1). 초기값은 렌더 전에 동기적으로 정해져 잘못된 화면이 깜빡이지 않는다.

/** Query params that only the dashboard understands: a link carrying one must keep opening the dashboard. */
export const DASHBOARD_DEEP_LINK_PARAMS = ["view", "totyCapture", "fancyMembers", "worldDebug"] as const;

export interface EntryModeInput {
  /** `location.search` */
  search: string;
  /** `location.hash` */
  hash: string;
  /** The validated value from localStorage, or null. */
  stored: EntryMode | null;
  /** `matchMedia("(pointer: coarse)")` — touch-first device (open decision #1: dashboard by default). */
  coarsePointer: boolean;
}

export function resolveInitialMode({ search, hash, stored, coarsePointer }: EntryModeInput): EntryMode {
  // Touch-first devices have no pitch (no on-screen controls): always the dashboard, whatever is stored or asked for.
  if (coarsePointer) return "dashboard";
  const params = new URLSearchParams(search);
  const override = params.get("mode");
  if (override === "pitch" || override === "dashboard") return override;
  if (DASHBOARD_DEEP_LINK_PARAMS.some((name) => params.has(name)) || hash.length > 1) return "dashboard";
  if (stored) return stored;
  return "pitch";
}

/** `matchMedia("(pointer: coarse)")` — a touch-first device. False when matchMedia is missing. */
export function detectCoarsePointer(): boolean {
  try {
    return window.matchMedia("(pointer: coarse)").matches;
  } catch {
    return false;
  }
}

/**
 * The URL to leave in the address bar after switching to `target`, so a refresh keeps the mode the
 * visitor just chose: an explicit `?mode=` would otherwise win, and a dashboard deep link would send a
 * pitch visitor back to the dashboard. Returns path + query + hash.
 */
export function urlAfterSwitch(target: EntryMode, pathname: string, search: string, hash: string): string {
  const params = new URLSearchParams(search);
  params.delete("mode");
  if (target === "pitch") {
    for (const name of DASHBOARD_DEEP_LINK_PARAMS) params.delete(name);
  }
  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ""}${target === "pitch" ? "" : hash}`;
}

function readEnvironment(): EntryModeInput {
  return {
    search: window.location.search,
    hash: window.location.hash,
    stored: loadEntryMode(),
    coarsePointer: detectCoarsePointer(),
  };
}

export function useEntryMode() {
  const [mode, setMode] = useState<EntryMode>(() => resolveInitialMode(readEnvironment()));

  const switchTo = useCallback((target: EntryMode) => {
    saveEntryMode(target);
    try {
      const { pathname, search, hash } = window.location;
      window.history.replaceState(null, "", urlAfterSwitch(target, pathname, search, hash));
    } catch {
      // history unavailable: the stored mode still decides the next visit
    }
    setMode(target);
  }, []);

  const goDashboard = useCallback(() => switchTo("dashboard"), [switchTo]);
  const goPitch = useCallback(() => switchTo("pitch"), [switchTo]);
  // Decided once per page load, like the initial mode: touch devices never see the way back to the pitch.
  const [pitchAvailable] = useState(() => !detectCoarsePointer());
  return { mode, goDashboard, goPitch, pitchAvailable };
}
