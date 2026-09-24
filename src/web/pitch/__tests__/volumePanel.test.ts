import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PITCH_SETTINGS, loadPitchSettings, resetPitchStorageMemory, savePitchSettings, type PitchSettings } from "../../storage";
import { HOVER_CLOSE_SECONDS, KEY_FLASH_SECONDS, VOLUME_PANEL, VOLUME_TRACK_W, VOLUME_TRACK_X, VolumePanel, channelAt, stepVolume, volumeFromX } from "../ui/volumePanel";

function stubStorage() {
  const map = new Map<string, string>();
  vi.stubGlobal("localStorage", { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v) });
}

function setup() {
  const applied: PitchSettings[] = [];
  const changes: PitchSettings[] = [];
  const cursors: string[] = [];
  const sounds: string[] = [];
  const panel = new VolumePanel({
    audio: { playBgm: () => undefined, playSfx: (id) => void sounds.push(id), stopSfx: () => undefined, setSettings: (s) => void applied.push(s) },
    setCursor: (kind) => void cursors.push(kind),
    onChange: (s) => void changes.push(s),
  });
  return { panel, applied, changes, cursors, sounds };
}

const trackX = VOLUME_PANEL.x + VOLUME_TRACK_X;
const sfxY = VOLUME_PANEL.y + 24 + 4 + 4;
const musicY = VOLUME_PANEL.y + 24 + 26 + 4 + 4;
const overButton = { type: "move", x: 700, y: 40 } as const;

beforeEach(() => {
  stubStorage();
  savePitchSettings({ ...DEFAULT_PITCH_SETTINGS });
});
afterEach(() => {
  vi.unstubAllGlobals();
  resetPitchStorageMemory();
});

describe("volume helpers", () => {
  it("maps pointer x to a 5% step and clamps", () => {
    expect(volumeFromX(trackX, trackX, VOLUME_TRACK_W)).toBe(0);
    expect(volumeFromX(trackX + VOLUME_TRACK_W / 2, trackX, VOLUME_TRACK_W)).toBe(0.5);
    expect(volumeFromX(trackX + VOLUME_TRACK_W + 50, trackX, VOLUME_TRACK_W)).toBe(1);
    expect(volumeFromX(trackX - 50, trackX, VOLUME_TRACK_W)).toBe(0);
  });

  it("steps by delta on the 5% grid inside 0..1", () => {
    expect(stepVolume(0.8, 0.1)).toBe(0.9);
    expect(stepVolume(0.95, 0.1)).toBe(1);
    expect(stepVolume(0.05, -0.1)).toBe(0);
  });

  it("each slider row grabs its own channel", () => {
    expect(channelAt(trackX + 10, sfxY)).toBe("sfx");
    expect(channelAt(trackX + 10, musicY)).toBe("music");
    expect(channelAt(10, 10)).toBeNull();
  });
});

describe("VolumePanel", () => {
  it("opens over the sound button, stays over the panel, closes elsewhere", () => {
    const { panel } = setup();
    expect(panel.visible).toBe(false);
    expect(panel.pointer(overButton)).toBe(false);
    expect(panel.visible).toBe(true);
    expect(panel.pointer({ type: "move", x: VOLUME_PANEL.x + 20, y: VOLUME_PANEL.y + 40 })).toBe(true);
    expect(panel.visible).toBe(true);
    expect(panel.pointer({ type: "move", x: 300, y: 300 })).toBe(false);
    // leaving does not close it at once: 0.3s of grace
    expect(panel.visible).toBe(true);
    panel.update(HOVER_CLOSE_SECONDS - 0.05);
    expect(panel.visible).toBe(true);
    panel.update(0.1);
    expect(panel.visible).toBe(false);
  });

  it("coming back within the grace time keeps it open and cancels the close", () => {
    const { panel } = setup();
    panel.pointer(overButton);
    panel.pointer({ type: "move", x: 300, y: 300 });
    panel.update(0.2);
    panel.pointer({ type: "move", x: VOLUME_PANEL.x + 20, y: VOLUME_PANEL.y + 40 });
    panel.update(1);
    expect(panel.visible).toBe(true);
  });

  it("does not react to the panel area while closed (clicks go to the game)", () => {
    const { panel } = setup();
    expect(panel.pointer({ type: "down", x: trackX + 40, y: sfxY })).toBe(false);
    expect(loadPitchSettings().sfxVolume).toBe(DEFAULT_PITCH_SETTINGS.sfxVolume);
  });

  it("dragging the effects slider saves and applies the volume, and previews on release", () => {
    const { panel, applied, changes, sounds } = setup();
    panel.pointer(overButton);
    expect(panel.pointer({ type: "down", x: trackX + VOLUME_TRACK_W / 2, y: sfxY })).toBe(true);
    expect(loadPitchSettings().sfxVolume).toBe(0.5);
    panel.pointer({ type: "move", x: trackX + VOLUME_TRACK_W * 0.25, y: 400 });
    expect(loadPitchSettings().sfxVolume).toBe(0.25);
    panel.pointer({ type: "up", x: trackX + VOLUME_TRACK_W * 0.25, y: 400 });
    expect(sounds).toContain("ui-click");
    expect(applied.at(-1)?.sfxVolume).toBe(0.25);
    expect(changes.length).toBeGreaterThan(0);
    expect(loadPitchSettings().musicVolume).toBe(DEFAULT_PITCH_SETTINGS.musicVolume);
  });

  it("the music slider only changes music, and raising a muted channel turns it back on", () => {
    savePitchSettings({ ...DEFAULT_PITCH_SETTINGS, musicOn: false });
    const { panel } = setup();
    panel.pointer(overButton);
    panel.pointer({ type: "down", x: trackX + VOLUME_TRACK_W * 0.7, y: musicY });
    panel.pointer({ type: "up", x: trackX + VOLUME_TRACK_W * 0.7, y: musicY });
    const saved = loadPitchSettings();
    expect(saved.musicVolume).toBe(0.7);
    expect(saved.musicOn).toBe(true);
    expect(saved.sfxVolume).toBe(DEFAULT_PITCH_SETTINGS.sfxVolume);
  });

  it("sliding to 0 keeps the channel switched on (it is a volume, not a mute)", () => {
    const { panel } = setup();
    panel.pointer(overButton);
    panel.pointer({ type: "down", x: trackX - 4, y: sfxY });
    panel.pointer({ type: "up", x: trackX - 4, y: sfxY });
    expect(loadPitchSettings()).toMatchObject({ sfxVolume: 0, sfxOn: true });
  });

  it("- and = change both volumes by 10% and flash the panel open for a moment", () => {
    const { panel, sounds } = setup();
    expect(panel.key("Equal")).toBe(true);
    expect(loadPitchSettings()).toMatchObject({ sfxVolume: 0.9, musicVolume: 0.6 });
    expect(panel.visible).toBe(true);
    expect(sounds).toContain("ui-hover");
    expect(panel.key("Minus")).toBe(true);
    expect(panel.key("Minus")).toBe(true);
    expect(loadPitchSettings()).toMatchObject({ sfxVolume: 0.7, musicVolume: 0.4 });
    panel.update(KEY_FLASH_SECONDS + 0.1);
    expect(panel.visible).toBe(false);
    expect(panel.key("KeyA")).toBe(false);
  });

  it("asks for the pointer cursor over the panel and the default one when leaving it", () => {
    const { panel, cursors } = setup();
    panel.pointer(overButton);
    panel.pointer({ type: "move", x: VOLUME_PANEL.x + 20, y: VOLUME_PANEL.y + 40 });
    panel.pointer({ type: "move", x: 300, y: 300 });
    expect(cursors).toEqual(["pointer", "default"]);
  });

  it("draws (open and closed) without throwing", () => {
    const { panel } = setup();
    const g = new Proxy({}, { get: (_t, prop) => (prop === "measureText" ? () => ({ width: 10 }) : () => undefined), set: () => true }) as unknown as CanvasRenderingContext2D;
    panel.draw(g);
    panel.key("Equal");
    expect(() => panel.draw(g)).not.toThrow();
  });
});
