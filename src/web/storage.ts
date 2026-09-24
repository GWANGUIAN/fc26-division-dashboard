import { useState } from "react";
import { koreaDateKey } from "../shared/dates.js";
import type { StreamerRecord } from "../shared/model.js";
import {
  DEFAULT_CURSOR_PLAYER_ID,
  isCursorSelectionId,
  type CursorSelectionId,
} from "./cursorCatalog";

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
export const CURSOR_PLAYER_STORAGE_KEY = "fc26-cursor-player";
export const SEEN_UPDATES_STORAGE_KEY = "fc26-seen-updates";
export const SFX_ENABLED_STORAGE_KEY = "fc26-sfx-enabled";
export const SFX_VOLUME_STORAGE_KEY = "fc26-sfx-volume";
const SFX_HEARD_STORAGE_KEY = "fc26-sfx-heard";
const CURSOR_PICKER_DISCOVERED_STORAGE_KEY = "fc26-cursor-picker-discovered-v1";
const PHOTO_BOOTH_DISCOVERED_STORAGE_KEY = "fc26-photo-booth-discovered-v2";
const GROUP_PHOTO_DISCOVERED_STORAGE_KEY = "fc26-group-photo-discovered-v1";
const VIEW_MODE_STORAGE_KEY = "fc26-view-mode";
const FIRST_ROUND_HIDDEN_COLLAPSED_STORAGE_KEY = "fc26-first-round-hidden-collapsed";
const SECOND_ROUND_HIDDEN_COLLAPSED_STORAGE_KEY = "fc26-second-round-hidden-collapsed";
const PROMO_PICKER_OPEN_STORAGE_KEY = "fc26-promo-picker-open";
const JANDY_VIDEOS_COLLAPSED_STORAGE_KEY = "fc26-jandy-videos-collapsed";
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

export function loadCursorPlayerId(): CursorSelectionId {
  try {
    const stored = localStorage.getItem(CURSOR_PLAYER_STORAGE_KEY);
    return isCursorSelectionId(stored) ? stored : DEFAULT_CURSOR_PLAYER_ID;
  } catch {
    return DEFAULT_CURSOR_PLAYER_ID;
  }
}

export function saveCursorPlayerId(playerId: CursorSelectionId) {
  try {
    localStorage.setItem(CURSOR_PLAYER_STORAGE_KEY, playerId);
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

export function hasDiscoveredCursorPicker(): boolean {
  try {
    return localStorage.getItem(CURSOR_PICKER_DISCOVERED_STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markCursorPickerDiscovered() {
  try {
    localStorage.setItem(CURSOR_PICKER_DISCOVERED_STORAGE_KEY, "1");
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

export function loadSecondRoundHiddenCollapsed(): boolean {
  try {
    const raw = localStorage.getItem(SECOND_ROUND_HIDDEN_COLLAPSED_STORAGE_KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

export function saveSecondRoundHiddenCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(
      SECOND_ROUND_HIDDEN_COLLAPSED_STORAGE_KEY,
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

export function loadJandyVideosCollapsed(): boolean {
  try {
    const raw = localStorage.getItem(JANDY_VIDEOS_COLLAPSED_STORAGE_KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

export function saveJandyVideosCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(
      JANDY_VIDEOS_COLLAPSED_STORAGE_KEY,
      collapsed ? "1" : "0",
    );
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

const KICKUPS_MUSIC_VOLUME_KEY = "fc26-kickups-music-volume";

export function loadKickupsMusicVolume(): number {
  try {
    const raw = localStorage.getItem(KICKUPS_MUSIC_VOLUME_KEY);
    const value = raw === null ? 35 : Number(raw);
    return Number.isFinite(value) ? Math.min(100, Math.max(0, Math.floor(value))) : 35;
  } catch {
    return 35;
  }
}

export function saveKickupsMusicVolume(volume: number) {
  try {
    localStorage.setItem(KICKUPS_MUSIC_VOLUME_KEY, String(Math.min(100, Math.max(0, Math.floor(volume)))));
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

const KICKUPS_SFX_ENABLED_KEY = "fc26-kickups-sfx-enabled";

export function loadKickupsSfxEnabled(): boolean {
  try {
    const raw = localStorage.getItem(KICKUPS_SFX_ENABLED_KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

export function saveKickupsSfxEnabled(enabled: boolean) {
  try {
    localStorage.setItem(KICKUPS_SFX_ENABLED_KEY, enabled ? "1" : "0");
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

const SOCCER_SUM10_HIGH_SCORE_KEY = "fc26-soccer-sum10-highscore";
const SOCCER_SUM10_SFX_ENABLED_KEY = "fc26-soccer-sum10-sfx-enabled";
const SOCCER_SUM10_SFX_VOLUME_KEY = "fc26-soccer-sum10-sfx-volume";
const SOCCER_SUM10_MUSIC_ENABLED_KEY = "fc26-soccer-sum10-music-enabled";
const SOCCER_SUM10_MUSIC_VOLUME_KEY = "fc26-soccer-sum10-music-volume";

function loadStoredVolume(key: string, fallback: number) {
  try {
    const raw = localStorage.getItem(key);
    const value = raw === null ? fallback : Number(raw);
    return Number.isFinite(value) ? Math.min(100, Math.max(0, Math.floor(value))) : fallback;
  } catch {
    return fallback;
  }
}

export function loadSoccerSum10HighScore(): number {
  try {
    const value = Number(localStorage.getItem(SOCCER_SUM10_HIGH_SCORE_KEY) ?? 0);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  } catch {
    return 0;
  }
}

export function saveSoccerSum10HighScore(score: number) {
  try {
    localStorage.setItem(SOCCER_SUM10_HIGH_SCORE_KEY, String(Math.max(0, Math.floor(score))));
  } catch {
    // ignore storage failures
  }
}

export function loadSoccerSum10SfxEnabled(): boolean {
  try {
    const raw = localStorage.getItem(SOCCER_SUM10_SFX_ENABLED_KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

export function saveSoccerSum10SfxEnabled(enabled: boolean) {
  try {
    localStorage.setItem(SOCCER_SUM10_SFX_ENABLED_KEY, enabled ? "1" : "0");
  } catch {
    // ignore storage failures
  }
}

export function loadSoccerSum10SfxVolume() {
  return loadStoredVolume(SOCCER_SUM10_SFX_VOLUME_KEY, 55);
}

export function saveSoccerSum10SfxVolume(volume: number) {
  try {
    localStorage.setItem(SOCCER_SUM10_SFX_VOLUME_KEY, String(Math.min(100, Math.max(0, Math.floor(volume)))));
  } catch {
    // ignore storage failures
  }
}

export function loadSoccerSum10MusicEnabled(): boolean {
  try {
    const raw = localStorage.getItem(SOCCER_SUM10_MUSIC_ENABLED_KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

export function saveSoccerSum10MusicEnabled(enabled: boolean) {
  try {
    localStorage.setItem(SOCCER_SUM10_MUSIC_ENABLED_KEY, enabled ? "1" : "0");
  } catch {
    // ignore storage failures
  }
}

export function loadSoccerSum10MusicVolume() {
  return loadStoredVolume(SOCCER_SUM10_MUSIC_VOLUME_KEY, 35);
}

export function saveSoccerSum10MusicVolume(volume: number) {
  try {
    localStorage.setItem(SOCCER_SUM10_MUSIC_VOLUME_KEY, String(Math.min(100, Math.max(0, Math.floor(volume)))));
  } catch {
    // ignore storage failures
  }
}

const GRASS_MERGE_HIGH_SCORE_KEY = "fc26-grass-merge-highscore";
const GRASS_MERGE_SFX_ENABLED_KEY = "fc26-grass-merge-sfx-enabled";
const GRASS_MERGE_SFX_VOLUME_KEY = "fc26-grass-merge-sfx-volume";
const GRASS_MERGE_MUSIC_ENABLED_KEY = "fc26-grass-merge-music-enabled";
const GRASS_MERGE_MUSIC_VOLUME_KEY = "fc26-grass-merge-music-volume";

const KEEPER_BREAKOUT_HIGH_SCORE_KEY = "fc26-keeper-breakout-highscore";
const KEEPER_BREAKOUT_SFX_ENABLED_KEY = "fc26-keeper-breakout-sfx-enabled";
const KEEPER_BREAKOUT_SFX_VOLUME_KEY = "fc26-keeper-breakout-sfx-volume";
const KEEPER_BREAKOUT_MUSIC_ENABLED_KEY = "fc26-keeper-breakout-music-enabled";
const KEEPER_BREAKOUT_MUSIC_VOLUME_KEY = "fc26-keeper-breakout-music-volume";

const FOOTBALL_MATCH3_HIGH_SCORE_KEY = "fc26-football-match3-highscore";
const FOOTBALL_MATCH3_SFX_ENABLED_KEY = "fc26-football-match3-sfx-enabled";
const FOOTBALL_MATCH3_SFX_VOLUME_KEY = "fc26-football-match3-sfx-volume";
const FOOTBALL_MATCH3_MUSIC_ENABLED_KEY = "fc26-football-match3-music-enabled";
const FOOTBALL_MATCH3_MUSIC_VOLUME_KEY = "fc26-football-match3-music-volume";

const FOOTBALL_RULES_QUIZ_SFX_ENABLED_KEY = "fc26-football-rules-quiz-sfx-enabled";
const FOOTBALL_RULES_QUIZ_SFX_VOLUME_KEY = "fc26-football-rules-quiz-sfx-volume";
const FOOTBALL_RULES_QUIZ_MUSIC_ENABLED_KEY = "fc26-football-rules-quiz-music-enabled";
const FOOTBALL_RULES_QUIZ_MUSIC_VOLUME_KEY = "fc26-football-rules-quiz-music-volume";

export function loadFootballMatch3HighScore(): number { try { const value = Number(localStorage.getItem(FOOTBALL_MATCH3_HIGH_SCORE_KEY) ?? 0); return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0; } catch { return 0; } }
export function saveFootballMatch3HighScore(score: number) { try { localStorage.setItem(FOOTBALL_MATCH3_HIGH_SCORE_KEY, String(Math.max(0, Math.floor(score)))); } catch { /* ignore storage failures */ } }
export function loadFootballMatch3SfxEnabled(): boolean { try { const value = localStorage.getItem(FOOTBALL_MATCH3_SFX_ENABLED_KEY); return value === null ? true : value === "1"; } catch { return true; } }
export function saveFootballMatch3SfxEnabled(enabled: boolean) { try { localStorage.setItem(FOOTBALL_MATCH3_SFX_ENABLED_KEY, enabled ? "1" : "0"); } catch { /* ignore storage failures */ } }
export function loadFootballMatch3SfxVolume() { return loadStoredVolume(FOOTBALL_MATCH3_SFX_VOLUME_KEY, 55); }
export function saveFootballMatch3SfxVolume(volume: number) { try { localStorage.setItem(FOOTBALL_MATCH3_SFX_VOLUME_KEY, String(Math.min(100, Math.max(0, Math.floor(volume))))); } catch { /* ignore storage failures */ } }
export function loadFootballMatch3MusicEnabled(): boolean { try { const value = localStorage.getItem(FOOTBALL_MATCH3_MUSIC_ENABLED_KEY); return value === null ? true : value === "1"; } catch { return true; } }
export function saveFootballMatch3MusicEnabled(enabled: boolean) { try { localStorage.setItem(FOOTBALL_MATCH3_MUSIC_ENABLED_KEY, enabled ? "1" : "0"); } catch { /* ignore storage failures */ } }
export function loadFootballMatch3MusicVolume() { return loadStoredVolume(FOOTBALL_MATCH3_MUSIC_VOLUME_KEY, 35); }
export function saveFootballMatch3MusicVolume(volume: number) { try { localStorage.setItem(FOOTBALL_MATCH3_MUSIC_VOLUME_KEY, String(Math.min(100, Math.max(0, Math.floor(volume))))); } catch { /* ignore storage failures */ } }

export function loadFootballRulesQuizSfxEnabled(): boolean { try { const value = localStorage.getItem(FOOTBALL_RULES_QUIZ_SFX_ENABLED_KEY); return value === null ? true : value === "1"; } catch { return true; } }
export function saveFootballRulesQuizSfxEnabled(enabled: boolean) { try { localStorage.setItem(FOOTBALL_RULES_QUIZ_SFX_ENABLED_KEY, enabled ? "1" : "0"); } catch { /* ignore storage failures */ } }
export function loadFootballRulesQuizSfxVolume() { return loadStoredVolume(FOOTBALL_RULES_QUIZ_SFX_VOLUME_KEY, 55); }
export function saveFootballRulesQuizSfxVolume(volume: number) { try { localStorage.setItem(FOOTBALL_RULES_QUIZ_SFX_VOLUME_KEY, String(Math.min(100, Math.max(0, Math.floor(volume))))); } catch { /* ignore storage failures */ } }
export function loadFootballRulesQuizMusicEnabled(): boolean { try { const value = localStorage.getItem(FOOTBALL_RULES_QUIZ_MUSIC_ENABLED_KEY); return value === null ? true : value === "1"; } catch { return true; } }
export function saveFootballRulesQuizMusicEnabled(enabled: boolean) { try { localStorage.setItem(FOOTBALL_RULES_QUIZ_MUSIC_ENABLED_KEY, enabled ? "1" : "0"); } catch { /* ignore storage failures */ } }
export function loadFootballRulesQuizMusicVolume() { return loadStoredVolume(FOOTBALL_RULES_QUIZ_MUSIC_VOLUME_KEY, 35); }
export function saveFootballRulesQuizMusicVolume(volume: number) { try { localStorage.setItem(FOOTBALL_RULES_QUIZ_MUSIC_VOLUME_KEY, String(Math.min(100, Math.max(0, Math.floor(volume))))); } catch { /* ignore storage failures */ } }

export function loadKeeperBreakoutHighScore(): number { try { const value = Number(localStorage.getItem(KEEPER_BREAKOUT_HIGH_SCORE_KEY) ?? 0); return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0; } catch { return 0; } }
export function saveKeeperBreakoutHighScore(score: number) { try { localStorage.setItem(KEEPER_BREAKOUT_HIGH_SCORE_KEY, String(Math.max(0, Math.floor(score)))); } catch { /* ignore storage failures */ } }
export function loadKeeperBreakoutSfxEnabled(): boolean { try { const value = localStorage.getItem(KEEPER_BREAKOUT_SFX_ENABLED_KEY); return value === null ? true : value === "1"; } catch { return true; } }
export function saveKeeperBreakoutSfxEnabled(enabled: boolean) { try { localStorage.setItem(KEEPER_BREAKOUT_SFX_ENABLED_KEY, enabled ? "1" : "0"); } catch { /* ignore storage failures */ } }
export function loadKeeperBreakoutSfxVolume() { return loadStoredVolume(KEEPER_BREAKOUT_SFX_VOLUME_KEY, 55); }
export function saveKeeperBreakoutSfxVolume(volume: number) { try { localStorage.setItem(KEEPER_BREAKOUT_SFX_VOLUME_KEY, String(Math.min(100, Math.max(0, Math.floor(volume))))); } catch { /* ignore storage failures */ } }
export function loadKeeperBreakoutMusicEnabled(): boolean { try { const value = localStorage.getItem(KEEPER_BREAKOUT_MUSIC_ENABLED_KEY); return value === null ? true : value === "1"; } catch { return true; } }
export function saveKeeperBreakoutMusicEnabled(enabled: boolean) { try { localStorage.setItem(KEEPER_BREAKOUT_MUSIC_ENABLED_KEY, enabled ? "1" : "0"); } catch { /* ignore storage failures */ } }
export function loadKeeperBreakoutMusicVolume() { return loadStoredVolume(KEEPER_BREAKOUT_MUSIC_VOLUME_KEY, 35); }
export function saveKeeperBreakoutMusicVolume(volume: number) { try { localStorage.setItem(KEEPER_BREAKOUT_MUSIC_VOLUME_KEY, String(Math.min(100, Math.max(0, Math.floor(volume))))); } catch { /* ignore storage failures */ } }

export function loadGrassMergeHighScore(): number {
  try {
    const value = Number(localStorage.getItem(GRASS_MERGE_HIGH_SCORE_KEY) ?? 0);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  } catch {
    return 0;
  }
}

export function saveGrassMergeHighScore(score: number) {
  try {
    localStorage.setItem(GRASS_MERGE_HIGH_SCORE_KEY, String(Math.max(0, Math.floor(score))));
  } catch {
    // ignore storage failures
  }
}

export function loadGrassMergeSfxEnabled(): boolean {
  try {
    const raw = localStorage.getItem(GRASS_MERGE_SFX_ENABLED_KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

export function saveGrassMergeSfxEnabled(enabled: boolean) {
  try {
    localStorage.setItem(GRASS_MERGE_SFX_ENABLED_KEY, enabled ? "1" : "0");
  } catch {
    // ignore storage failures
  }
}

export function loadGrassMergeSfxVolume() {
  return loadStoredVolume(GRASS_MERGE_SFX_VOLUME_KEY, 55);
}

export function saveGrassMergeSfxVolume(volume: number) {
  try {
    localStorage.setItem(GRASS_MERGE_SFX_VOLUME_KEY, String(Math.min(100, Math.max(0, Math.floor(volume)))));
  } catch {
    // ignore storage failures
  }
}

export function loadGrassMergeMusicEnabled(): boolean {
  try {
    const raw = localStorage.getItem(GRASS_MERGE_MUSIC_ENABLED_KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

export function saveGrassMergeMusicEnabled(enabled: boolean) {
  try {
    localStorage.setItem(GRASS_MERGE_MUSIC_ENABLED_KEY, enabled ? "1" : "0");
  } catch {
    // ignore storage failures
  }
}

export function loadGrassMergeMusicVolume() {
  return loadStoredVolume(GRASS_MERGE_MUSIC_VOLUME_KEY, 35);
}

export function saveGrassMergeMusicVolume(volume: number) {
  try {
    localStorage.setItem(GRASS_MERGE_MUSIC_VOLUME_KEY, String(Math.min(100, Math.max(0, Math.floor(volume)))));
  } catch {
    // ignore storage failures
  }
}

const FREEKICK_HIGH_SCORE_KEY = "fc26-freekick-highscore";

const TEST_SCHEDULE_PITCH_ASSIGNMENTS_KEY = "fc26-test-schedule-pitch-assignments";

/** Keyed by pitch slot key (`${dateIso}__${teamLabel}__${index}`). `null` explicitly vacates a slot that the base roster data fills; a streamer id assigns/replaces. Absent keys fall back to the base roster data. */
export type TestSchedulePitchAssignments = Record<string, string | null>;

export function loadTestSchedulePitchAssignments(): TestSchedulePitchAssignments {
  try {
    const raw = localStorage.getItem(TEST_SCHEDULE_PITCH_ASSIGNMENTS_KEY);
    return raw ? (JSON.parse(raw) as TestSchedulePitchAssignments) : {};
  } catch {
    return {};
  }
}

export function saveTestSchedulePitchAssignments(
  assignments: TestSchedulePitchAssignments,
) {
  try {
    localStorage.setItem(
      TEST_SCHEDULE_PITCH_ASSIGNMENTS_KEY,
      JSON.stringify(assignments),
    );
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

export function loadFreekickHighScore(): number {
  try {
    const raw = localStorage.getItem(FREEKICK_HIGH_SCORE_KEY);
    const value = raw === null ? 0 : Number(raw);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  } catch {
    return 0;
  }
}

export function saveFreekickHighScore(score: number) {
  try {
    localStorage.setItem(FREEKICK_HIGH_SCORE_KEY, String(Math.floor(score)));
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

const FREEKICK_SFX_ENABLED_KEY = "fc26-freekick-sfx-enabled";

export function loadFreekickSfxEnabled(): boolean {
  try {
    const raw = localStorage.getItem(FREEKICK_SFX_ENABLED_KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

export function saveFreekickSfxEnabled(enabled: boolean) {
  try {
    localStorage.setItem(FREEKICK_SFX_ENABLED_KEY, enabled ? "1" : "0");
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

const FREEKICK_MUSIC_ENABLED_KEY = "fc26-freekick-music-enabled";

export function loadFreekickMusicEnabled(): boolean {
  try {
    const raw = localStorage.getItem(FREEKICK_MUSIC_ENABLED_KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

export function saveFreekickMusicEnabled(enabled: boolean) {
  try {
    localStorage.setItem(FREEKICK_MUSIC_ENABLED_KEY, enabled ? "1" : "0");
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

const FREEKICK_MUSIC_VOLUME_KEY = "fc26-freekick-music-volume";

export function loadFreekickMusicVolume(): number {
  try {
    const raw = localStorage.getItem(FREEKICK_MUSIC_VOLUME_KEY);
    const value = raw === null ? 35 : Number(raw);
    return Number.isFinite(value) ? Math.min(100, Math.max(0, Math.floor(value))) : 35;
  } catch {
    return 35;
  }
}

export function saveFreekickMusicVolume(volume: number) {
  try {
    localStorage.setItem(FREEKICK_MUSIC_VOLUME_KEY, String(Math.min(100, Math.max(0, Math.floor(volume)))));
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

const CARD_MATCH_BEST_TURNS_KEY = "fc26-cardmatch-best-turns";

export function loadCardMatchBestTurns(): number | null {
  try {
    const raw = localStorage.getItem(CARD_MATCH_BEST_TURNS_KEY);
    const value = raw === null ? NaN : Number(raw);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
  } catch {
    return null;
  }
}

export function saveCardMatchBestTurns(turns: number) {
  try {
    localStorage.setItem(CARD_MATCH_BEST_TURNS_KEY, String(Math.floor(turns)));
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

const FORTUNE_SFX_ENABLED_KEY = "fc26-fortune-sfx-enabled";

export function loadFortuneSfxEnabled(): boolean {
  try {
    const raw = localStorage.getItem(FORTUNE_SFX_ENABLED_KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

export function saveFortuneSfxEnabled(enabled: boolean) {
  try {
    localStorage.setItem(FORTUNE_SFX_ENABLED_KEY, enabled ? "1" : "0");
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

const FORTUNE_MUSIC_ENABLED_KEY = "fc26-fortune-music-enabled";

export function loadFortuneMusicEnabled(): boolean {
  try {
    const raw = localStorage.getItem(FORTUNE_MUSIC_ENABLED_KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

export function saveFortuneMusicEnabled(enabled: boolean) {
  try {
    localStorage.setItem(FORTUNE_MUSIC_ENABLED_KEY, enabled ? "1" : "0");
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

const FORTUNE_MUSIC_VOLUME_KEY = "fc26-fortune-music-volume";

export function loadFortuneMusicVolume(): number {
  try {
    const raw = localStorage.getItem(FORTUNE_MUSIC_VOLUME_KEY);
    const value = raw === null ? 35 : Number(raw);
    return Number.isFinite(value) ? Math.min(100, Math.max(0, Math.floor(value))) : 35;
  } catch {
    return 35;
  }
}

export function saveFortuneMusicVolume(volume: number) {
  try {
    localStorage.setItem(FORTUNE_MUSIC_VOLUME_KEY, String(Math.min(100, Math.max(0, Math.floor(volume)))));
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

const FORTUNE_OPENED_STORAGE_KEY = "fc26-fortune-opened";

export function hasOpenedFortune(): boolean {
  try {
    return localStorage.getItem(FORTUNE_OPENED_STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markFortuneOpened() {
  try {
    localStorage.setItem(FORTUNE_OPENED_STORAGE_KEY, "1");
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

// 새 키를 써서, 기존 "합격 인증샷" 툴팁을 이미 닫은 사용자에게도 "단체샷
// 구경하기" 콜아웃이 최초 1회 노출되게 한다 (기존 키 재사용 X).
export function hasDiscoveredGroupPhoto(): boolean {
  try {
    return localStorage.getItem(GROUP_PHOTO_DISCOVERED_STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markGroupPhotoDiscovered() {
  try {
    localStorage.setItem(GROUP_PHOTO_DISCOVERED_STORAGE_KEY, "1");
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

// --- Online minigame rankings -------------------------------------------------

const PLAYER_ID_KEY = "fc26-player-id";
const PLAYER_NICKNAME_KEY = "fc26-player-nickname";
const SCORE_SUBMITTED_KEY_PREFIX = "fc26-score-submitted-";

// Fallback when localStorage is unavailable: stable for this page load only.
let memoryPlayerId: string | null = null;

/** The secret device id that authorises rank submissions; created on first use. */
export function loadPlayerId(): string {
  try {
    const stored = localStorage.getItem(PLAYER_ID_KEY);
    if (stored) return stored;
    const created = crypto.randomUUID();
    localStorage.setItem(PLAYER_ID_KEY, created);
    return created;
  } catch {
    memoryPlayerId ??= crypto.randomUUID();
    return memoryPlayerId;
  }
}

export function loadPlayerNickname(): string {
  try {
    return localStorage.getItem(PLAYER_NICKNAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function savePlayerNickname(name: string) {
  try {
    localStorage.setItem(PLAYER_NICKNAME_KEY, name);
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

/** The best result the server last confirmed for this game, or null if none was ever registered. */
export function loadSubmittedScore(game: string): number | null {
  try {
    const raw = localStorage.getItem(SCORE_SUBMITTED_KEY_PREFIX + game);
    const value = raw === null ? NaN : Number(raw);
    return Number.isFinite(value) ? Math.floor(value) : null;
  } catch {
    return null;
  }
}

export function saveSubmittedScore(game: string, score: number) {
  try {
    localStorage.setItem(SCORE_SUBMITTED_KEY_PREFIX + game, String(Math.floor(score)));
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

const POSITION_TEST_SFX_ENABLED_KEY = "fc26-position-test-sfx-enabled";

export function loadPositionTestSfxEnabled(): boolean {
  try {
    const raw = localStorage.getItem(POSITION_TEST_SFX_ENABLED_KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

export function savePositionTestSfxEnabled(enabled: boolean) {
  try {
    localStorage.setItem(POSITION_TEST_SFX_ENABLED_KEY, enabled ? "1" : "0");
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

const POSITION_TEST_NAME_KEY = "fc26-position-test-name";

/** Remembers what the viewer last typed into the name field, so reopening
 * the popup pre-fills it instead of asking again every time — a separate
 * key from PLAYER_NICKNAME_KEY (that one is tied to minigame ranking
 * submissions, a different concern than this feature's own name prompt). */
export function loadPositionTestName(): string {
  try {
    return localStorage.getItem(POSITION_TEST_NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function savePositionTestName(name: string) {
  try {
    localStorage.setItem(POSITION_TEST_NAME_KEY, name);
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

// ── 피치(2D 픽셀 축구 진입 화면) — docs/pitch/01 §5 ─────────────────────────────────────────────
export type EntryMode = "pitch" | "dashboard";

/**
 * When localStorage cannot be written (private mode, quota, blocked site data) the value lives here for the rest of
 * the session, so the pitch still remembers the mode, character, sound settings and stats until the tab closes
 * (docs/pitch/01 §9). A successful write drops the entry, so working storage is always the source of truth.
 */
const pitchMemory = new Map<string, string>();

function pitchRead(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    // no localStorage object at all (non-browser) is not "blocked storage": nothing to fall back to
    return error instanceof ReferenceError ? null : (pitchMemory.get(key) ?? null);
  }
}

function pitchWrite(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
    pitchMemory.delete(key);
  } catch (error) {
    if (!(error instanceof ReferenceError)) pitchMemory.set(key, value);
  }
}

/** Test hook: forgets the in-memory fallback values. */
export function resetPitchStorageMemory() {
  pitchMemory.clear();
}

export const ENTRY_MODE_STORAGE_KEY = "fc26-entry-mode";
export const PITCH_CHARACTER_STORAGE_KEY = "fc26-pitch-character";
export const PITCH_SETTINGS_STORAGE_KEY = "fc26-pitch-settings-v1";
export const DEFAULT_PITCH_CHARACTER = "woowakgood";

export interface PitchSettings {
  sfxVolume: number;
  musicVolume: number;
  sfxOn: boolean;
  musicOn: boolean;
}

export const DEFAULT_PITCH_SETTINGS: PitchSettings = {
  sfxVolume: 0.8,
  musicVolume: 0.5,
  sfxOn: true,
  musicOn: true,
};

/** The saved entry mode, or null when nothing valid is stored (the caller then applies its own default). */
export function loadEntryMode(): EntryMode | null {
  try {
    const value = pitchRead(ENTRY_MODE_STORAGE_KEY);
    return value === "pitch" || value === "dashboard" ? value : null;
  } catch {
    return null;
  }
}

export function saveEntryMode(mode: EntryMode) {
  pitchWrite(ENTRY_MODE_STORAGE_KEY, mode);
}

/**
 * The chosen pitch character id. Only the shape is checked here (the 12-character registry arrives with
 * P5, which must also correct ids it does not know); anything unreadable falls back to the default.
 */
export function loadPitchCharacter(): string {
  try {
    const value = pitchRead(PITCH_CHARACTER_STORAGE_KEY);
    return value && /^[a-z0-9][a-z0-9_-]{0,63}$/.test(value) ? value : DEFAULT_PITCH_CHARACTER;
  } catch {
    return DEFAULT_PITCH_CHARACTER;
  }
}

export function savePitchCharacter(id: string) {
  pitchWrite(PITCH_CHARACTER_STORAGE_KEY, id);
}

function clampUnit(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback;
}

export function loadPitchSettings(): PitchSettings {
  try {
    const raw = pitchRead(PITCH_SETTINGS_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_PITCH_SETTINGS };
    const data = parsed as Record<string, unknown>;
    return {
      sfxVolume: clampUnit(data.sfxVolume, DEFAULT_PITCH_SETTINGS.sfxVolume),
      musicVolume: clampUnit(data.musicVolume, DEFAULT_PITCH_SETTINGS.musicVolume),
      sfxOn: typeof data.sfxOn === "boolean" ? data.sfxOn : DEFAULT_PITCH_SETTINGS.sfxOn,
      musicOn: typeof data.musicOn === "boolean" ? data.musicOn : DEFAULT_PITCH_SETTINGS.musicOn,
    };
  } catch {
    return { ...DEFAULT_PITCH_SETTINGS };
  }
}

export function savePitchSettings(settings: PitchSettings) {
  pitchWrite(PITCH_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

// ── 피치 누적 기록 — docs/pitch/01 §5 (fc26-pitch-stats-v1) ─────────────────────────────────────
export const PITCH_STATS_STORAGE_KEY = "fc26-pitch-stats-v1";

export interface PitchStats {
  goals: number;
  saves: number;
  /** Longest run of consecutive goals. */
  bestStreak: number;
  shots: number;
}

export const DEFAULT_PITCH_STATS: PitchStats = { goals: 0, saves: 0, bestStreak: 0, shots: 0 };

function countOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;
}

export function loadPitchStats(): PitchStats {
  try {
    const raw = pitchRead(PITCH_STATS_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_PITCH_STATS };
    const data = parsed as Record<string, unknown>;
    return {
      goals: countOr(data.goals, 0),
      saves: countOr(data.saves, 0),
      bestStreak: countOr(data.bestStreak, 0),
      shots: countOr(data.shots, 0),
    };
  } catch {
    return { ...DEFAULT_PITCH_STATS };
  }
}

export function savePitchStats(stats: PitchStats) {
  pitchWrite(PITCH_STATS_STORAGE_KEY, JSON.stringify(stats));
}
