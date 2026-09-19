import { describe, expect, it } from "vitest";
import { DEFAULT_WORLD_SETTINGS } from "../storage";
import { BGM_FADE_SECONDS, BGM_FILES, SFX_FILES, WorldAudio, crossfadeGains, type AudioDeps, type AudioLike } from "./worldAudio";

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

function makeDeps(existing: string[]) {
  const created: FakeAudio[] = [];
  const deps: AudioDeps = {
    createAudio(url) {
      const audio = new FakeAudio(url);
      created.push(audio);
      return audio;
    },
    probe: async (url) => existing.includes(url),
  };
  return { deps, created };
}

const flush = async () => {
  for (let i = 0; i < 6; i++) await Promise.resolve();
};

describe("crossfadeGains", () => {
  it("fades one channel out and the other in over the duration", () => {
    expect(crossfadeGains(0)).toEqual({ out: 1, in: 0 });
    expect(crossfadeGains(BGM_FADE_SECONDS / 2)).toEqual({ out: 0.5, in: 0.5 });
    expect(crossfadeGains(BGM_FADE_SECONDS)).toEqual({ out: 0, in: 1 });
    expect(crossfadeGains(99)).toEqual({ out: 0, in: 1 });
    expect(crossfadeGains(1, 0)).toEqual({ out: 0, in: 1 });
  });
});

describe("file names", () => {
  it("follow docs/world/07 (public/world-bgm-*.mp3 and public/sfxes/world-*.mp3)", () => {
    for (const url of Object.values(BGM_FILES)) expect(url).toMatch(/^\/world-bgm-[a-z-]+\.mp3$/);
    for (const url of Object.values(SFX_FILES)) expect(url).toMatch(/^\/sfxes\/world-[a-z]+(-[a-z]+)?\.mp3$/);
  });
});

describe("WorldAudio BGM", () => {
  it("stays silent, and never throws, when the file does not exist", async () => {
    const { deps, created } = makeDeps([]);
    const audio = new WorldAudio(DEFAULT_WORLD_SETTINGS, deps, false);
    audio.playBgm("title");
    await flush();
    audio.tick(2);
    expect(created).toHaveLength(0);
  });

  it("falls back along a preference list to the first file that exists", async () => {
    const { deps, created } = makeDeps([BGM_FILES["field-withered"]]);
    const audio = new WorldAudio(DEFAULT_WORLD_SETTINGS, deps, false);
    audio.playBgm(["region-frost", "field-withered"]);
    await flush();
    expect(created).toHaveLength(1);
    expect(created[0].src).toBe(BGM_FILES["field-withered"]);
    expect(created[0].loop).toBe(true);
    expect(created[0].plays).toBe(1);
  });

  it("crossfades between two tracks, then pauses the old one", async () => {
    const { deps, created } = makeDeps([BGM_FILES.title, BGM_FILES.interior]);
    const audio = new WorldAudio({ ...DEFAULT_WORLD_SETTINGS, bgmVolume: 50 }, deps, false);
    audio.playBgm("title");
    await flush();
    audio.tick(BGM_FADE_SECONDS);
    expect(created[0].volume).toBeCloseTo(0.5);

    audio.playBgm("interior");
    await flush();
    expect(created).toHaveLength(2);
    audio.tick(BGM_FADE_SECONDS / 2);
    expect(created[0].volume).toBeCloseTo(0.25);
    expect(created[1].volume).toBeCloseTo(0.25);
    audio.tick(BGM_FADE_SECONDS);
    expect(created[0].playing).toBe(false);
    expect(created[1].volume).toBeCloseTo(0.5);
  });

  it("ignores a repeated request for the track that is already playing", async () => {
    const { deps, created } = makeDeps([BGM_FILES.title]);
    const audio = new WorldAudio(DEFAULT_WORLD_SETTINGS, deps, false);
    audio.playBgm("title");
    await flush();
    audio.playBgm("title");
    await flush();
    expect(created).toHaveLength(1);
  });

  it("mutes when BGM is switched off", async () => {
    const { deps, created } = makeDeps([BGM_FILES.title]);
    const audio = new WorldAudio({ ...DEFAULT_WORLD_SETTINGS, bgm: false }, deps, false);
    audio.playBgm("title");
    await flush();
    audio.tick(BGM_FADE_SECONDS);
    expect(created[0].volume).toBe(0);
  });

  it("stops everything on dispose", async () => {
    const { deps, created } = makeDeps([BGM_FILES.title]);
    const audio = new WorldAudio(DEFAULT_WORLD_SETTINGS, deps, false);
    audio.playBgm("title");
    await flush();
    audio.dispose();
    expect(created[0].playing).toBe(false);
    audio.playBgm("title");
    await flush();
    expect(created).toHaveLength(1);
  });
});

describe("WorldAudio SFX", () => {
  it("drops the first call while the file is looked up, then plays from a reusable pool", async () => {
    const { deps, created } = makeDeps([SFX_FILES["door-open"]]);
    const audio = new WorldAudio(DEFAULT_WORLD_SETTINGS, deps, false);
    audio.playSfx("door-open");
    await flush();
    expect(created).toHaveLength(3);
    audio.playSfx("door-open");
    audio.playSfx("door-open");
    audio.playSfx("door-open");
    audio.playSfx("door-open");
    expect(created.map((a) => a.plays)).toEqual([2, 1, 1]);
    expect(created[0].volume).toBeCloseTo(DEFAULT_WORLD_SETTINGS.sfxVolume / 100);
  });

  it("stays silent for a missing file and when sound effects are off", async () => {
    const missing = makeDeps([]);
    const a = new WorldAudio(DEFAULT_WORLD_SETTINGS, missing.deps, false);
    a.playSfx("door-open");
    await flush();
    a.playSfx("door-open");
    expect(missing.created).toHaveLength(0);

    const off = makeDeps([SFX_FILES["door-open"]]);
    const b = new WorldAudio({ ...DEFAULT_WORLD_SETTINGS, sfx: false }, off.deps, false);
    b.preloadSfx(["door-open"]);
    await flush();
    b.playSfx("door-open");
    expect(off.created.every((audio) => audio.plays === 0)).toBe(true);
  });
});
