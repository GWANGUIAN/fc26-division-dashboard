import { describe, expect, it } from "vitest";
import { PitchAudio } from "../audio/pitchAudio";
import type { AudioDeps, AudioLike } from "../../world/audio/worldAudio";
import type { PitchSettings } from "../../storage";

const SETTINGS: PitchSettings = { sfxVolume: 0.8, musicVolume: 0.5, sfxOn: true, musicOn: true };

class FakeAudio implements AudioLike {
  loop = false;
  volume = 1;
  currentTime = 0;
  playing = false;
  plays = 0;
  constructor(public src: string) {}
  play() {
    this.playing = true;
    this.plays++;
  }
  pause() {
    this.playing = false;
  }
}

function makeDeps(existing: (url: string) => boolean) {
  const created: FakeAudio[] = [];
  const deps: AudioDeps = {
    createAudio(url) {
      const audio = new FakeAudio(url);
      created.push(audio);
      return audio;
    },
    probe: async (url) => existing(url),
  };
  return { deps, created };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("PitchAudio sound effects", () => {
  it("plays the file that exists, at sfx volume × the event gain", async () => {
    const { deps, created } = makeDeps((url) => url === "/sfxes/pitch-ball-touch.mp3");
    const audio = new PitchAudio(SETTINGS, deps, false);
    audio.playSfx("ball-touch");
    await settle();
    const played = created.filter((a) => a.playing);
    expect(played).toHaveLength(1);
    expect(played[0]!.src).toBe("/sfxes/pitch-ball-touch.mp3");
    expect(played[0]!.volume).toBeCloseTo(0.8 * 0.5);
  });

  it("uses the reuse fallback when the pitch- file is missing", async () => {
    const { deps, created } = makeDeps((url) => url === "/sfxes/world-ball-net.mp3");
    const audio = new PitchAudio(SETTINGS, deps, false);
    audio.playSfx("net-hit");
    await settle();
    expect(created.find((a) => a.playing)?.src).toBe("/sfxes/world-ball-net.mp3");
  });

  it("is silent, and never throws, when nothing exists", async () => {
    const { deps, created } = makeDeps(() => false);
    const audio = new PitchAudio(SETTINGS, deps, false);
    audio.playSfx("goal-cheer");
    audio.stopSfx("power-charge");
    await settle();
    expect(created).toHaveLength(0);
  });

  it("is silent when the probe itself fails", async () => {
    const deps: AudioDeps = { createAudio: (url) => new FakeAudio(url), probe: () => Promise.reject(new Error("offline")) };
    const audio = new PitchAudio(SETTINGS, deps, false);
    expect(() => audio.playSfx("net-hit")).not.toThrow();
    await settle();
  });

  it("stays silent while sound effects are off, and follows setSettings", async () => {
    const { deps, created } = makeDeps(() => true);
    const audio = new PitchAudio({ ...SETTINGS, sfxOn: false }, deps, false);
    audio.playSfx("ui-click");
    await settle();
    expect(created.filter((a) => a.playing)).toHaveLength(0);
    audio.setSettings(SETTINGS);
    audio.playSfx("ui-click");
    await settle();
    expect(created.filter((a) => a.playing)).toHaveLength(1);
  });

  it("stopSfx pauses every copy of the event", async () => {
    const { deps, created } = makeDeps(() => true);
    const audio = new PitchAudio(SETTINGS, deps, false);
    audio.playSfx("power-charge");
    await settle();
    expect(created.some((a) => a.playing)).toBe(true);
    audio.stopSfx("power-charge");
    await settle();
    expect(created.some((a) => a.playing)).toBe(false);
  });
});

describe("PitchAudio music", () => {
  it("waits for the first input, then plays the last requested track", async () => {
    const { deps, created } = makeDeps(() => true);
    const audio = new PitchAudio(SETTINGS, deps, false);
    audio.playBgm("loading");
    audio.playBgm("pitch");
    await settle();
    expect(created).toHaveLength(0);
    audio.unlock();
    await settle();
    expect(created).toHaveLength(1);
    expect(created[0]!.src).toBe("/pitch-bgm-pitch.mp3");
    expect(created[0]!.loop).toBe(true);
    expect(created[0]!.playing).toBe(true);
  });

  it("crossfades two channels and drops the old one at the end", async () => {
    const { deps, created } = makeDeps(() => true);
    const audio = new PitchAudio(SETTINGS, deps, false);
    audio.unlock();
    audio.playBgm("loading");
    await settle();
    audio.tick(1);
    expect(created[0]!.volume).toBeCloseTo(0.5);
    audio.playBgm("pitch");
    await settle();
    expect(created).toHaveLength(2);
    audio.tick(0.5);
    expect(created[0]!.volume).toBeCloseTo(0.25);
    expect(created[1]!.volume).toBeCloseTo(0.25);
    audio.tick(0.6);
    expect(created[0]!.playing).toBe(false);
    expect(created[1]!.volume).toBeCloseTo(0.5);
  });

  it("a missing track is silence", async () => {
    const { deps, created } = makeDeps(() => false);
    const audio = new PitchAudio(SETTINGS, deps, false);
    audio.unlock();
    audio.playBgm("pitch");
    await settle();
    expect(created).toHaveLength(0);
  });

  it("muting sets the music volume to zero", async () => {
    const { deps, created } = makeDeps(() => true);
    const audio = new PitchAudio(SETTINGS, deps, false);
    audio.unlock();
    audio.playBgm("pitch");
    await settle();
    audio.tick(1);
    expect(created[0]!.volume).toBeCloseTo(0.5);
    audio.setSettings({ ...SETTINGS, musicOn: false });
    expect(created[0]!.volume).toBe(0);
  });

  it("stops everything on dispose", async () => {
    const { deps, created } = makeDeps(() => true);
    const audio = new PitchAudio(SETTINGS, deps, false);
    audio.unlock();
    audio.playBgm("pitch");
    audio.playSfx("ui-click");
    await settle();
    audio.dispose();
    expect(created.some((a) => a.playing)).toBe(false);
    audio.playSfx("ui-click");
    await settle();
  });
});
