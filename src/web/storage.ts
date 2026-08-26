import { useState } from "react";
import { koreaDateKey } from "../shared/dates.js";
import type { StreamerRecord } from "../shared/model.js";

const SEEN_ANNOUNCEMENTS_STORAGE_KEY = "fc26-seen-announcements";

export function loadSeenAnnouncementIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_ANNOUNCEMENTS_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

export function markAnnouncementsSeen(ids: string[]) {
  try {
    const seen = loadSeenAnnouncementIds();
    ids.forEach((id) => seen.add(id));
    localStorage.setItem(
      SEEN_ANNOUNCEMENTS_STORAGE_KEY,
      JSON.stringify(Array.from(seen)),
    );
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

export const THEME_STORAGE_KEY = "fc26-theme";
export const SEEN_UPDATES_STORAGE_KEY = "fc26-seen-updates";
export const SFX_ENABLED_STORAGE_KEY = "fc26-sfx-enabled";
export const SFX_VOLUME_STORAGE_KEY = "fc26-sfx-volume";
const SFX_HEARD_STORAGE_KEY = "fc26-sfx-heard";
const CARD_VIEW_DISCOVERED_STORAGE_KEY = "fc26-card-view-discovered";
const GROWTH_GRAPH_DISCOVERED_STORAGE_KEY = "fc26-growth-graph-discovered";
const GROWTH_PICKER_DISCOVERED_STORAGE_KEY = "fc26-growth-picker-discovered";
const PHOTO_BOOTH_DISCOVERED_STORAGE_KEY = "fc26-photo-booth-discovered";
const VIEW_MODE_STORAGE_KEY = "fc26-view-mode";
const FIRST_ROUND_HIDDEN_COLLAPSED_STORAGE_KEY = "fc26-first-round-hidden-collapsed";
const PROMO_PICKER_OPEN_STORAGE_KEY = "fc26-promo-picker-open";
const CARD_ZOOM_STORAGE_KEY = "fc26-card-zoom-level";
export const CARD_ZOOM_MIN = 0;
export const CARD_ZOOM_MAX = 4;
const CARD_ZOOM_DEFAULT = 1;

export function loadTheme(): "dark" | "light" {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "light"
      ? "light"
      : "dark";
  } catch {
    return "dark";
  }
}

export function saveTheme(theme: "dark" | "light") {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

export function loadFirstRoundHiddenCollapsed(): boolean {
  try {
    const raw = localStorage.getItem(FIRST_ROUND_HIDDEN_COLLAPSED_STORAGE_KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

export function saveFirstRoundHiddenCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(
      FIRST_ROUND_HIDDEN_COLLAPSED_STORAGE_KEY,
      collapsed ? "1" : "0",
    );
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

export function loadPromoPickerOpen(): boolean {
  try {
    const raw = localStorage.getItem(PROMO_PICKER_OPEN_STORAGE_KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

export function savePromoPickerOpen(open: boolean) {
  try {
    localStorage.setItem(PROMO_PICKER_OPEN_STORAGE_KEY, open ? "1" : "0");
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

export function loadViewMode(): "list" | "table" | "card" {
  try {
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return stored === "card" || stored === "table" ? stored : "list";
  } catch {
    return "list";
  }
}

export function saveViewMode(mode: "list" | "table" | "card") {
  try {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

export function loadCardZoomLevel(): number {
  try {
    const stored = localStorage.getItem(CARD_ZOOM_STORAGE_KEY);
    if (stored === null) return CARD_ZOOM_DEFAULT;
    const raw = Number(stored);
    if (!Number.isInteger(raw)) return CARD_ZOOM_DEFAULT;
    return Math.min(CARD_ZOOM_MAX, Math.max(CARD_ZOOM_MIN, raw));
  } catch {
    return CARD_ZOOM_DEFAULT;
  }
}

export function saveCardZoomLevel(level: number) {
  try {
    localStorage.setItem(CARD_ZOOM_STORAGE_KEY, String(level));
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

const KICKUPS_HIGH_SCORE_KEY = "fc26-kickups-highscore";

export function loadKickupsHighScore(): number {
  try {
    const raw = localStorage.getItem(KICKUPS_HIGH_SCORE_KEY);
    const value = raw === null ? 0 : Number(raw);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  } catch {
    return 0;
  }
}

export function saveKickupsHighScore(score: number) {
  try {
    localStorage.setItem(KICKUPS_HIGH_SCORE_KEY, String(Math.floor(score)));
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

const KICKUPS_MUSIC_ENABLED_KEY = "fc26-kickups-music-enabled";

export function loadKickupsMusicEnabled(): boolean {
  try {
    const raw = localStorage.getItem(KICKUPS_MUSIC_ENABLED_KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

export function saveKickupsMusicEnabled(enabled: boolean) {
  try {
    localStorage.setItem(KICKUPS_MUSIC_ENABLED_KEY, enabled ? "1" : "0");
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

export function hasHeardSfx(): boolean {
  try {
    return localStorage.getItem(SFX_HEARD_STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markSfxHeard() {
  try {
    localStorage.setItem(SFX_HEARD_STORAGE_KEY, "1");
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

export function hasDiscoveredCardView(): boolean {
  try {
    return localStorage.getItem(CARD_VIEW_DISCOVERED_STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markCardViewDiscovered() {
  try {
    localStorage.setItem(CARD_VIEW_DISCOVERED_STORAGE_KEY, "1");
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

export function hasDiscoveredGrowthGraph(): boolean {
  try {
    return localStorage.getItem(GROWTH_GRAPH_DISCOVERED_STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markGrowthGraphDiscovered() {
  try {
    localStorage.setItem(GROWTH_GRAPH_DISCOVERED_STORAGE_KEY, "1");
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

export function hasDiscoveredGrowthPicker(): boolean {
  try {
    return localStorage.getItem(GROWTH_PICKER_DISCOVERED_STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markGrowthPickerDiscovered() {
  try {
    localStorage.setItem(GROWTH_PICKER_DISCOVERED_STORAGE_KEY, "1");
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

export function hasDiscoveredPhotoBooth(): boolean {
  try {
    return localStorage.getItem(PHOTO_BOOTH_DISCOVERED_STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markPhotoBoothDiscovered() {
  try {
    localStorage.setItem(PHOTO_BOOTH_DISCOVERED_STORAGE_KEY, "1");
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

export function loadSfxEnabled(): boolean {
  try {
    const raw = localStorage.getItem(SFX_ENABLED_STORAGE_KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

export function loadSfxVolume(): number {
  try {
    const raw = localStorage.getItem(SFX_VOLUME_STORAGE_KEY);
    if (raw === null) return 100;
    const value = Number(raw);
    return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 100;
  } catch {
    return 100;
  }
}

export const DAY_MS = 24 * 60 * 60 * 1000;

export function isUpdatedToday(streamer: StreamerRecord) {
  return Boolean(
    streamer.lastPost &&
    Date.now() - new Date(streamer.lastPost.publishedAt).getTime() < DAY_MS,
  );
}

export function seenKeyFor(streamer: StreamerRecord) {
  return `${streamer.id}:${streamer.lastPost?.articleId}`;
}

function loadSeenKeys(todayKey: string): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_UPDATES_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as { date: string; keys: string[] };
    return parsed.date === todayKey ? new Set(parsed.keys) : new Set();
  } catch {
    return new Set();
  }
}

export function useSeenUpdates() {
  const todayKey = koreaDateKey(new Date());
  const [seenKeys, setSeenKeys] = useState(() => loadSeenKeys(todayKey));
  const markSeen = (key: string) => {
    setSeenKeys((current) => {
      if (current.has(key)) return current;
      const next = new Set(current).add(key);
      try {
        localStorage.setItem(
          SEEN_UPDATES_STORAGE_KEY,
          JSON.stringify({ date: todayKey, keys: Array.from(next) }),
        );
      } catch {
        // ignore storage failures (e.g. private browsing)
      }
      return next;
    });
  };
  return { seenKeys, markSeen, todayKey };
}
