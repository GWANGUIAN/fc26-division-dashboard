// HUD pieces shared by the locker room and the stat screen (docs/pitch/03 §0·§4·§5): the dashboard / change / sound
// buttons at their pitch positions and the "E …" interaction prompt. The pitch keeps its own copy of the buttons
// (P2); the values here mirror it.

import type { PitchAudioLike } from "../audio/pitchAudio";
import type { AssetImage } from "../engine/assets";
import { drawNineSlice, drawStripFrame } from "../engine/sprite";
import { drawText, TEXT_COLORS } from "../engine/text";
import { loadPitchSettings, savePitchSettings } from "../../storage";

export type Rect = { x: number; y: number; w: number; h: number };
export type HudButtonId = "dashboard" | "change" | "sound";

export const HUD_DASHBOARD_BUTTON: Rect = { x: 732, y: 16, w: 212, h: 48 };
export const HUD_CHANGE_BUTTON: Rect = { x: 732, y: 72, w: 212, h: 40 };
export const HUD_SOUND_BUTTON: Rect = { x: 684, y: 20, w: 40, h: 40 };

const RECTS: Readonly<Record<HudButtonId, Rect>> = { dashboard: HUD_DASHBOARD_BUTTON, change: HUD_CHANGE_BUTTON, sound: HUD_SOUND_BUTTON };

export const inside = (rect: Rect, x: number, y: number) => x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;

export function hudButtonAt(ids: readonly HudButtonId[], x: number, y: number): HudButtonId | null {
  for (const id of ids) if (inside(RECTS[id], x, y)) return id;
  return null;
}

/** Sound on/off, shared by the scenes stacked in the locker room (the pitch reads the saved settings again on entry). */
export const soundState = { muted: false };

export function syncSoundState() {
  const settings = loadPitchSettings();
  soundState.muted = !settings.sfxOn && !settings.musicOn;
}

export function toggleSound(audio: PitchAudioLike) {
  soundState.muted = !soundState.muted;
  const next = { ...loadPitchSettings(), sfxOn: !soundState.muted, musicOn: !soundState.muted };
  savePitchSettings(next);
  audio.setSettings(next);
  if (!soundState.muted) audio.playSfx("ui-click");
}

export interface HudButtonState {
  hovered: HudButtonId | null;
  pressed: HudButtonId | null;
}

type Image = AssetImage | undefined;

export function drawHudButtons(g: CanvasRenderingContext2D, image: (key: string) => Image, ids: readonly HudButtonId[], state: HudButtonState) {
  for (const id of ids) {
    const rect = RECTS[id];
    const frame = state.hovered !== id ? 0 : state.pressed === id ? 2 : 1;
    const strip = image(id === "dashboard" ? "ui/btn-dashboard" : id === "change" ? "ui/btn-change" : "ui/btn-square");
    const oy = frame === 2 ? 2 : 0;
    if (strip) drawStripFrame(g, strip, 3, frame, rect.x + rect.w / 2, rect.y + rect.h + oy);
    else {
      g.fillStyle = "#0a0a1a";
      g.fillRect(rect.x - 2, rect.y - 2 + oy, rect.w + 4, rect.h + 4);
      g.fillStyle = frame > 0 ? "#1f3a5c" : "#152640";
      g.fillRect(rect.x, rect.y + oy, rect.w, rect.h);
      if (frame > 0) {
        g.strokeStyle = "#3ee6c1";
        g.lineWidth = 2;
        g.strokeRect(rect.x + 1, rect.y + 1 + oy, rect.w - 2, rect.h - 2);
      }
    }
    const cy = rect.y + rect.h / 2 + oy;
    if (id === "dashboard") drawText(g, "잔디동 대시보드로", rect.x + 118, cy + 3, { align: "center", baseline: "middle" });
    else if (id === "change") drawText(g, "캐릭터 변경", rect.x + 115, cy + 2, { align: "center", baseline: "middle" });
    else {
      const icon = image(soundState.muted ? "ui/icon-sound-off" : "ui/icon-sound-on");
      const ix = Math.round(rect.x + (rect.w - 24) / 2);
      const iy = Math.round(rect.y + (rect.h - 24) / 2 + oy);
      if (icon) g.drawImage(icon, ix, iy);
      else drawText(g, soundState.muted ? "OFF" : "ON", ix + 12, iy + 12, { size: 10, align: "center", baseline: "middle" });
    }
  }
}

/** Speech-bubble prompt like `E  락커룸`, bottom centre at (`x`, `y`) — a gold key cap and a label on a navy plate. */
export function drawPrompt(g: CanvasRenderingContext2D, plate: Image, key: string, label: string, x: number, y: number, seconds: number) {
  g.font = "12px Galmuri11, monospace";
  const labelWidth = Math.ceil(g.measureText(label).width);
  const contentW = 22 + 8 + labelWidth + 12;
  const contentH = 26;
  // the plate is drawn 1.3× around the content
  const w = Math.round(contentW * 1.3);
  const h = Math.round(contentH * 1.3);
  const offX = Math.round((w - contentW) / 2);
  const offY = Math.round((h - contentH) / 2);
  const bob = Math.round(Math.sin(seconds * 5) * 1.5);
  const left = Math.round(x - w / 2);
  const top = Math.round(y - h + bob);
  if (plate) drawNineSlice(g, plate, 8, left, top, w, h);
  else {
    g.fillStyle = "#0a0a1a";
    g.fillRect(left - 2, top - 2, w + 4, h + 4);
    g.fillStyle = "#152640";
    g.fillRect(left, top, w, h);
  }
  const cl = left + offX;
  const ct = top + offY;
  g.fillStyle = TEXT_COLORS.gold;
  g.fillRect(cl + 6, ct + 4, 18, 18);
  g.fillStyle = "#0a0a1a";
  g.fillRect(cl + 8, ct + 6, 14, 14);
  drawText(g, key, cl + 15, ct + 13, { size: 10, color: TEXT_COLORS.gold, align: "center", baseline: "middle", shadow: false });
  drawText(g, label, cl + 30, ct + 14, { size: 12, baseline: "middle" });
}
