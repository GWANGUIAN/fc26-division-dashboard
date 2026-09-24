// Pitch audio (docs/pitch/01 §6, 06): a two-channel BGM crossfade and a pooled SFX player, structured like
// world/audio/worldAudio.ts (whose small helpers it reuses). Every file is optional — a missing file is silence
// and the game never waits for audio. Browsers refuse sound before the first key press or click, so BGM starts
// at `unlock()`, which PitchEntry calls on the first input.

import { BGM_FADE_SECONDS, crossfadeGains, defaultAudioDeps, type AudioDeps, type AudioLike } from "../../world/audio/worldAudio";
import type { PitchSettings } from "../../storage";
import { BGM_FILES, SFX_GAIN, resolveSfxAsync, type PitchBgmId, type PitchSfxId } from "./sfxMap";

/** What scenes need from the audio system (lets tests and scenes without a manager use a stand-in). */
export interface PitchAudioLike {
  playBgm(id: PitchBgmId | null): void;
  playSfx(id: PitchSfxId, volume?: number): void;
  /** Stops the running copies of a (looping or long) effect, e.g. the power-charge rise. */
  stopSfx(id: PitchSfxId): void;
  /** Plays a file by URL (a character's own sound) at the sound-effect volume. Optional so simple stand-ins stay valid. */
  playFile?(url: string, volume?: number): void;
  setSettings(settings: PitchSettings): void;
}

export const SILENT_PITCH_AUDIO: PitchAudioLike = { playBgm() {}, playSfx() {}, stopSfx() {}, setSettings() {} };

const SFX_POOL_SIZE = 3;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

interface BgmChannel {
  audio: AudioLike | null;
  id: PitchBgmId | null;
  gain: number;
}

interface SfxPool {
  items: AudioLike[];
  next: number;
}

export class PitchAudio implements PitchAudioLike {
  private settings: PitchSettings;
  private readonly deps: AudioDeps;
  private readonly known = new Map<string, Promise<boolean>>();
  /** Event → the file that exists (null = silent), resolved once. */
  private readonly resolved = new Map<PitchSfxId, Promise<string | null>>();
  private readonly pools = new Map<string, SfxPool>();
  private current: BgmChannel = { audio: null, id: null, gain: 1 };
  private fading: BgmChannel | null = null;
  private fadeElapsed = 0;
  private wanted: PitchBgmId | null = null;
  private unlocked = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private disposed = false;
  private readonly autoTick: boolean;

  constructor(settings: PitchSettings, deps: AudioDeps = defaultAudioDeps, autoTick = true) {
    this.settings = settings;
    this.deps = deps;
    this.autoTick = autoTick;
  }

  setSettings(settings: PitchSettings) {
    this.settings = settings;
    this.applyVolumes();
  }

  private exists(url: string): Promise<boolean> {
    let result = this.known.get(url);
    if (!result) {
      result = this.deps.probe(url).catch(() => false);
      this.known.set(url, result);
    }
    return result;
  }

  private bgmVolume(channel: BgmChannel) {
    return this.settings.musicOn ? this.settings.musicVolume * channel.gain : 0;
  }

  private applyVolumes() {
    if (this.current.audio) this.current.audio.volume = clamp01(this.bgmVolume(this.current));
    if (this.fading?.audio) this.fading.audio.volume = clamp01(this.bgmVolume(this.fading));
  }

  // ---- BGM ----

  /** Asks for a track (null = fade to silence). Nothing plays before `unlock()`; the last request is then honoured. */
  playBgm(id: PitchBgmId | null) {
    if (this.disposed || id === this.wanted) return;
    this.wanted = id;
    if (this.unlocked) void this.switchTo(id);
  }

  /** First user input arrived: sound may start now. */
  unlock() {
    if (this.unlocked || this.disposed) return;
    this.unlocked = true;
    if (this.wanted !== null) void this.switchTo(this.wanted);
  }

  private async switchTo(id: PitchBgmId | null) {
    const ok = id !== null && (await this.exists(BGM_FILES[id]));
    if (this.wanted !== id || this.disposed) return; // the request changed while probing
    const chosen = ok ? id : null;
    if (chosen === this.current.id) return;
    let next: AudioLike | null = null;
    if (chosen) {
      next = this.deps.createAudio(BGM_FILES[chosen]);
      next.loop = true;
      next.volume = 0;
      try {
        const played = next.play();
        if (played && typeof played.catch === "function") played.catch(() => {});
      } catch {
        /* autoplay blocked: stay silent */
      }
    }
    this.startFade(next, chosen);
  }

  private startFade(next: AudioLike | null, id: PitchBgmId | null) {
    if (this.fading) this.finishFade(); // at most two channels ever exist
    this.fading = this.current;
    this.current = { audio: next, id, gain: 0 };
    this.fadeElapsed = 0;
    if (this.autoTick && !this.timer) this.timer = setInterval(() => this.tick(0.05), 50);
    if (!this.fading.audio && !next) this.finishFade();
  }

  private finishFade() {
    if (this.fading?.audio) {
      this.fading.audio.pause();
      this.fading.audio.currentTime = 0;
    }
    this.fading = null;
    this.current.gain = 1;
    this.applyVolumes();
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Advances a running crossfade (called by the internal timer; exposed for tests). */
  tick(seconds: number) {
    if (!this.fading) return;
    this.fadeElapsed += seconds;
    const gains = crossfadeGains(this.fadeElapsed);
    this.fading.gain = gains.out;
    this.current.gain = gains.in;
    this.applyVolumes();
    if (this.fadeElapsed >= BGM_FADE_SECONDS) this.finishFade();
  }

  // ---- SFX ----

  /** Looks the files of these events up ahead of time so their first play is not dropped while the probe runs. */
  preload(ids: readonly PitchSfxId[]) {
    for (const id of ids) void this.fileFor(id).then((url) => url && this.ensurePool(url));
  }

  private fileFor(id: PitchSfxId): Promise<string | null> {
    let result = this.resolved.get(id);
    if (!result) {
      result = resolveSfxAsync(id, (url) => this.exists(url)).catch(() => null);
      this.resolved.set(id, result);
    }
    return result;
  }

  private ensurePool(url: string): SfxPool | null {
    if (this.disposed) return null;
    let pool = this.pools.get(url);
    if (!pool) {
      pool = { items: Array.from({ length: SFX_POOL_SIZE }, () => this.deps.createAudio(url)), next: 0 };
      this.pools.set(url, pool);
    }
    return pool;
  }

  /** Plays an event at `volume` (0..1, default 1) × its own gain × the sound-effect setting. Unknown / missing = silence. */
  playSfx(id: PitchSfxId, volume = 1) {
    if (this.disposed || !this.settings.sfxOn || this.settings.sfxVolume <= 0) return;
    void this.fileFor(id).then((url) => {
      if (!url || this.disposed || !this.settings.sfxOn) return;
      const pool = this.ensurePool(url);
      if (!pool) return;
      const audio = pool.items[pool.next]!;
      pool.next = (pool.next + 1) % pool.items.length;
      audio.currentTime = 0;
      audio.volume = clamp01(this.settings.sfxVolume * (SFX_GAIN[id] ?? 1) * volume);
      try {
        const played = audio.play();
        if (played && typeof played.catch === "function") played.catch(() => {});
      } catch {
        /* ignore */
      }
    });
  }

  playFile(url: string, volume = 1) {
    if (this.disposed || !this.settings.sfxOn || this.settings.sfxVolume <= 0) return;
    const pool = this.ensurePool(url);
    if (!pool) return;
    const audio = pool.items[pool.next]!;
    pool.next = (pool.next + 1) % pool.items.length;
    audio.currentTime = 0;
    audio.volume = clamp01(this.settings.sfxVolume * volume);
    try {
      const played = audio.play();
      if (played && typeof played.catch === "function") played.catch(() => {});
    } catch {
      /* ignore */
    }
  }

  stopSfx(id: PitchSfxId) {
    void this.fileFor(id).then((url) => {
      const pool = url ? this.pools.get(url) : undefined;
      if (!pool) return;
      for (const audio of pool.items) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  }

  dispose() {
    this.disposed = true;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    for (const channel of [this.current, this.fading]) channel?.audio?.pause();
    for (const pool of this.pools.values()) pool.items.forEach((audio) => audio.pause());
    this.pools.clear();
    this.current = { audio: null, id: null, gain: 1 };
    this.fading = null;
  }
}
