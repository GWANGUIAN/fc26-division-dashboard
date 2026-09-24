// Volume panel under the sound button (docs/pitch/03 §0, P7+): two sliders — sound effects and music — drawn with
// rectangles on the pixel grid (no image needed). It opens while the pointer is over the sound button or the panel
// (or while a slider is being dragged), and for a moment after the `-` / `=` keys change both volumes. The sound button
// itself still mutes / unmutes; sliders write `sfxVolume` / `musicVolume` of the saved settings and apply them at once.

import type { PitchAudioLike } from "../audio/pitchAudio";
import type { PointerInput } from "../engine/sceneManager";
import { drawText, TEXT_COLORS } from "../engine/text";
import { loadPitchSettings, savePitchSettings, type PitchSettings } from "../../storage";

type Rect = { x: number; y: number; w: number; h: number };
export type VolumeChannel = "sfx" | "music";

/** Right edge = the sound button's right edge (x 724), directly under it. */
export const VOLUME_PANEL: Rect = { x: 540, y: 66, w: 184, h: 92 };
export const VOLUME_TRACK_X = 56;
export const VOLUME_TRACK_W = 80;
const ROW_Y0 = 24;
const ROW_H = 26;
const TRACK_H = 8;
/** Extra pixels above/below a track that still grab it, so a thin slider is easy to hit. */
const GRAB = 8;
/** Seconds the panel stays open after a key press. */
export const KEY_FLASH_SECONDS = 1.4;
export const KEY_STEP = 0.1;
/** The panel stays open this long after the pointer leaves it, so a slip off the edge does not close it. */
export const HOVER_CLOSE_SECONDS = 0.3;
const SOUND_BUTTON: Rect = { x: 684, y: 20, w: 40, h: 40 };

const CHANNELS: readonly VolumeChannel[] = ["sfx", "music"];
const LABELS: Readonly<Record<VolumeChannel, string>> = { sfx: "효과음", music: "배경음" };

const inside = (r: Rect, x: number, y: number) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Pointer x → volume 0..1 on a track, snapped to 5%. */
export function volumeFromX(x: number, trackX: number, trackW: number): number {
  return Math.round(clamp01((x - trackX) / trackW) * 20) / 20;
}

/** `value` moved by `delta`, kept on the 5% grid and inside 0..1. */
export function stepVolume(value: number, delta: number): number {
  return Math.round(clamp01(value + delta) * 20) / 20;
}

function trackRect(channel: VolumeChannel): Rect {
  const row = CHANNELS.indexOf(channel);
  return { x: VOLUME_PANEL.x + VOLUME_TRACK_X, y: VOLUME_PANEL.y + ROW_Y0 + row * ROW_H + 4, w: VOLUME_TRACK_W, h: TRACK_H };
}

/** Which slider (if any) a point grabs. */
export function channelAt(x: number, y: number): VolumeChannel | null {
  for (const channel of CHANNELS) {
    const t = trackRect(channel);
    if (x >= t.x - 6 && x < t.x + t.w + 6 && y >= t.y - GRAB && y < t.y + t.h + GRAB) return channel;
  }
  return null;
}

export interface VolumePanelDeps {
  audio: PitchAudioLike;
  setCursor(kind: "default" | "pointer"): void;
  /** Called after the saved settings changed (the scene refreshes its mute flag). */
  onChange?(settings: PitchSettings): void;
}

export class VolumePanel {
  private hoverOpen = false;
  private flash = 0;
  private closeLeft = 0;
  private drag: VolumeChannel | null = null;
  private overPanel = false;
  private settings: PitchSettings = loadPitchSettings();
  private wasVisible = false;

  constructor(private readonly deps: VolumePanelDeps) {}

  get visible() {
    return this.hoverOpen || this.closeLeft > 0 || this.flash > 0 || this.drag !== null;
  }

  update(dt: number) {
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt);
    if (this.closeLeft > 0) this.closeLeft = Math.max(0, this.closeLeft - dt);
  }

  /** Hover on/off; leaving starts the close delay, coming back cancels it. */
  private setHover(next: boolean) {
    if (this.hoverOpen && !next) this.closeLeft = HOVER_CLOSE_SECONDS;
    else if (next) this.closeLeft = 0;
    this.hoverOpen = next;
  }

  private refreshOnOpen() {
    const visible = this.visible;
    // settings may have changed elsewhere (the M key, another scene): re-read when the panel opens
    if (visible && !this.wasVisible) this.settings = loadPitchSettings();
    this.wasVisible = visible;
  }

  private apply(channel: VolumeChannel, value: number) {
    const key = channel === "sfx" ? "sfxVolume" : "musicVolume";
    if (this.settings[key] === value && (channel === "sfx" ? this.settings.sfxOn : this.settings.musicOn)) return;
    const next: PitchSettings = { ...this.settings, [key]: value };
    // raising a slider on a muted channel turns it back on
    if (value > 0) {
      if (channel === "sfx") next.sfxOn = true;
      else next.musicOn = true;
    }
    this.settings = next;
    savePitchSettings(next);
    this.deps.audio.setSettings(next);
    this.deps.onChange?.(next);
  }

  /** `-` / `=` (also the numpad): both volumes ±10%, panel shown for a moment. Returns true when the key was ours. */
  key(code: string): boolean {
    const delta = code === "Minus" || code === "NumpadSubtract" ? -KEY_STEP : code === "Equal" || code === "NumpadAdd" ? KEY_STEP : 0;
    if (delta === 0) return false;
    this.settings = loadPitchSettings();
    this.flash = KEY_FLASH_SECONDS;
    this.wasVisible = true;
    this.apply("sfx", stepVolume(this.settings.sfxVolume, delta));
    this.apply("music", stepVolume(this.settings.musicVolume, delta));
    if (delta > 0) this.deps.audio.playSfx("ui-hover");
    return true;
  }

  /** Feeds a pointer event. Returns true when the panel used it (the scene should not handle it further). */
  pointer(e: PointerInput): boolean {
    const inButton = inside(SOUND_BUTTON, e.x, e.y);
    const inPanel = this.visible && inside(VOLUME_PANEL, e.x, e.y);
    this.setHover(inButton || inPanel || this.drag !== null);
    this.refreshOnOpen();

    let used = inPanel;
    if (e.type === "down" && inPanel) {
      const channel = channelAt(e.x, e.y);
      if (channel) {
        this.drag = channel;
        this.apply(channel, volumeFromX(e.x, trackRect(channel).x, VOLUME_TRACK_W));
      }
    } else if (this.drag) {
      used = true;
      this.apply(this.drag, volumeFromX(e.x, trackRect(this.drag).x, VOLUME_TRACK_W));
      if (e.type === "up") {
        if (this.drag === "sfx") this.deps.audio.playSfx("ui-click");
        this.drag = null;
        this.setHover(inButton || inside(VOLUME_PANEL, e.x, e.y));
      }
    }

    if (used !== this.overPanel) {
      this.overPanel = used;
      if (used) this.deps.setCursor("pointer");
      else if (!inButton) this.deps.setCursor("default");
    }
    return used;
  }

  draw(g: CanvasRenderingContext2D) {
    this.refreshOnOpen();
    if (!this.visible) return;
    const p = VOLUME_PANEL;
    g.save();
    g.fillStyle = "#0a0a1a";
    g.fillRect(p.x - 2, p.y - 2, p.w + 4, p.h + 4);
    g.fillStyle = "#3ee6c1";
    g.fillRect(p.x, p.y, p.w, p.h);
    g.fillStyle = "rgba(14, 26, 54, 0.96)";
    g.fillRect(p.x + 2, p.y + 2, p.w - 4, p.h - 4);
    drawText(g, "소리 크기", p.x + 10, p.y + 12, { size: 10, color: TEXT_COLORS.gold, baseline: "middle" });

    for (const channel of CHANNELS) {
      const t = trackRect(channel);
      const on = channel === "sfx" ? this.settings.sfxOn : this.settings.musicOn;
      const value = channel === "sfx" ? this.settings.sfxVolume : this.settings.musicVolume;
      const cy = t.y + t.h / 2;
      drawText(g, LABELS[channel], p.x + 10, cy, { size: 10, color: on ? TEXT_COLORS.base : "#7d8aa8", baseline: "middle" });
      g.fillStyle = "#0a0a1a";
      g.fillRect(t.x - 2, t.y - 2, t.w + 4, t.h + 4);
      g.fillStyle = "#1c2a4a";
      g.fillRect(t.x, t.y, t.w, t.h);
      const filled = Math.round(t.w * value);
      g.fillStyle = on ? "#2ee8b6" : "#4a5878";
      g.fillRect(t.x, t.y, filled, t.h);
      g.fillStyle = on ? "#b8ffec" : "#6d7a99";
      g.fillRect(t.x, t.y, filled, 2);
      // knob
      const knobActive = this.drag === channel;
      g.fillStyle = "#0a0a1a";
      g.fillRect(t.x + filled - 4, t.y - 5, 8, t.h + 10);
      g.fillStyle = knobActive ? TEXT_COLORS.gold : "#f7f7ff";
      g.fillRect(t.x + filled - 3, t.y - 4, 6, t.h + 8);
      drawText(g, on ? `${Math.round(value * 100)}%` : "꺼짐", p.x + p.w - 8, cy, { size: 10, color: on ? TEXT_COLORS.base : "#7d8aa8", align: "right", baseline: "middle" });
    }
    drawText(g, "M 음소거   - = 조절", p.x + p.w / 2, p.y + p.h - 10, { size: 10, color: "#9fe9ff", align: "center", baseline: "middle" });
    g.restore();
  }
}
