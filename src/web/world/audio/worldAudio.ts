import type { WorldSettings } from "../types";

// World audio skeleton (docs/world/01 §9, 07): a two-channel BGM crossfade and a small SFX pool.
// Every file is optional. `public/world-bgm-*.mp3` and `public/sfxes/world-*.mp3` are looked up by name
// at runtime and a missing file just means silence — the game never waits for audio and never throws.

export type BgmId =
  | "title" | "field-lush" | "field-withered" | "interior" | "arcade" | "stadium" | "boss" | "ending" | "rush"
  | "region-sky" | "region-spring" | "region-frost" | "region-forge" | "region-weed";

export const BGM_FILES: Record<BgmId, string> = {
  title: "/world-bgm-title.mp3",
  "field-lush": "/world-bgm-field-lush.mp3",
  "field-withered": "/world-bgm-field-withered.mp3",
  interior: "/world-bgm-interior.mp3",
  arcade: "/world-bgm-arcade.mp3",
  stadium: "/world-bgm-stadium.mp3",
  boss: "/world-bgm-boss.mp3",
  ending: "/world-bgm-ending.mp3",
  rush: "/world-bgm-rush.mp3",
  "region-sky": "/world-bgm-region-sky.mp3",
  "region-spring": "/world-bgm-region-spring.mp3",
  "region-frost": "/world-bgm-region-frost.mp3",
  "region-forge": "/world-bgm-region-forge.mp3",
  "region-weed": "/world-bgm-region-weed.mp3",
};

/** Loops under the BGM at a low volume (docs/world/07 §2-9). Files are `public/world-amb-<name>.mp3` and all optional. */
export type AmbienceId = "field-day" | "sky-wind" | "spring" | "frost-night" | "forge" | "weed" | "crowd" | "arcade";

export const AMBIENCE_FILES: Record<AmbienceId, string> = {
  "field-day": "/world-amb-field-day.mp3",
  "sky-wind": "/world-amb-sky-wind.mp3",
  spring: "/world-amb-spring.mp3",
  "frost-night": "/world-amb-frost-night.mp3",
  forge: "/world-amb-forge.mp3",
  weed: "/world-amb-weed.mp3",
  crowd: "/world-amb-crowd.mp3",
  arcade: "/world-amb-arcade.mp3",
};

/** Ambience sits at this share of the BGM volume setting (docs/world/07 §1). */
export const AMBIENCE_SHARE = 0.4;

/** The subset of docs/world/07 §2 in use: S2 (UI, dialogue, footsteps, doors, interaction), S3 (missions, pickups, runs, ball) and S4 (showdown, ending). */
export type SfxId =
  | "stamp"
  | "ui-move" | "ui-select" | "ui-cancel" | "ui-open" | "ui-close" | "ui-error"
  | "dialog-tick" | "dialog-next" | "dialog-open"
  | "step-grass" | "step-stone" | "step-wood" | "step-dirt" | "step-snow" | "step-metal" | "step-water" | "bump"
  | "door-open" | "door-close" | "door-bell" | "interact-ping" | "examine"
  | "mission-accept" | "mission-ready" | "mission-complete" | "shard-get" | "shard-restore" | "badge-get"
  | "pickup" | "parcel-get" | "checkpoint" | "cone-hit" | "ball-kick" | "ball-net" | "ball-post"
  | "count-tick" | "count-go" | "timeup" | "whistle-short" | "whistle-long" | "core-stop" | "grow" | "crowd-roar"
  | "cat-meow" | "dog-bark" | "mower-rev"
  | "rush-jump" | "rush-slide" | "rush-hit" | "rush-collect" | "rush-boost" | "rush-gameover";

export const SFX_FILES: Record<SfxId, string> = {
  stamp: "/sfxes/world-stamp.mp3",
  "ui-move": "/sfxes/world-ui-move.mp3",
  "ui-select": "/sfxes/world-ui-select.mp3",
  "ui-cancel": "/sfxes/world-ui-cancel.mp3",
  "ui-open": "/sfxes/world-ui-open.mp3",
  "ui-close": "/sfxes/world-ui-close.mp3",
  "dialog-tick": "/sfxes/world-dialog-tick.mp3",
  "dialog-next": "/sfxes/world-dialog-next.mp3",
  "dialog-open": "/sfxes/world-dialog-open.mp3",
  "step-grass": "/sfxes/world-step-grass.mp3",
  "step-stone": "/sfxes/world-step-stone.mp3",
  "step-wood": "/sfxes/world-step-wood.mp3",
  "step-dirt": "/sfxes/world-step-dirt.mp3",
  "step-snow": "/sfxes/world-step-snow.mp3",
  "step-metal": "/sfxes/world-step-metal.mp3",
  "step-water": "/sfxes/world-step-water.mp3",
  bump: "/sfxes/world-bump.mp3",
  "door-open": "/sfxes/world-door-open.mp3",
  "door-close": "/sfxes/world-door-close.mp3",
  "door-bell": "/sfxes/world-door-bell.mp3",
  "interact-ping": "/sfxes/world-interact-ping.mp3",
  examine: "/sfxes/world-examine.mp3",
  "ui-error": "/sfxes/world-ui-error.mp3",
  "mission-accept": "/sfxes/world-mission-accept.mp3",
  "mission-ready": "/sfxes/world-mission-ready.mp3",
  "mission-complete": "/sfxes/world-mission-complete.mp3",
  "shard-get": "/sfxes/world-shard-get.mp3",
  "shard-restore": "/sfxes/world-shard-restore.mp3",
  "badge-get": "/sfxes/world-badge-get.mp3",
  pickup: "/sfxes/world-pickup.mp3",
  "parcel-get": "/sfxes/world-parcel-get.mp3",
  checkpoint: "/sfxes/world-checkpoint.mp3",
  "cone-hit": "/sfxes/world-cone-hit.mp3",
  "ball-kick": "/sfxes/world-ball-kick.mp3",
  "ball-net": "/sfxes/world-ball-net.mp3",
  "ball-post": "/sfxes/world-ball-post.mp3",
  "count-tick": "/sfxes/world-count-tick.mp3",
  "count-go": "/sfxes/world-count-go.mp3",
  timeup: "/sfxes/world-timeup.mp3",
  "whistle-short": "/sfxes/world-whistle-short.mp3",
  "whistle-long": "/sfxes/world-whistle-long.mp3",
  "core-stop": "/sfxes/world-core-stop.mp3",
  grow: "/sfxes/world-grow.mp3",
  "crowd-roar": "/sfxes/world-crowd-roar.mp3",
  "cat-meow": "/sfxes/world-cat-meow.mp3",
  "dog-bark": "/sfxes/world-dog-bark.mp3",
  "mower-rev": "/sfxes/world-mower-rev.mp3",
  "rush-jump": "/sfxes/world-rush-jump.mp3",
  "rush-slide": "/sfxes/world-rush-slide.mp3",
  "rush-hit": "/sfxes/world-rush-hit.mp3",
  "rush-collect": "/sfxes/world-rush-collect.mp3",
  "rush-boost": "/sfxes/world-rush-boost.mp3",
  "rush-gameover": "/sfxes/world-rush-gameover.mp3",
};

/** What the engine and UI need from the audio system (lets tests and the title screen use a stand-in). */
export interface WorldAudioLike {
  /** A track, or a preference list (the first file that exists plays); null fades to silence. */
  playBgm(ids: BgmId | readonly BgmId[] | null): void;
  playSfx(id: SfxId): void;
  /** A member's own card-click clip (`CastDef.voiceSfx`). Optional so a stand-in can leave it out. */
  playVoice?(url: string): void;
  /** The looping background of a place (null = none). Optional so a stand-in can leave it out. */
  playAmbience?(id: AmbienceId | null): void;
}

export const SILENT_AUDIO: WorldAudioLike = { playBgm() {}, playSfx() {} };

/** Just enough of HTMLAudioElement for the skeleton (and for fakes in tests). */
export interface AudioLike {
  src: string;
  loop: boolean;
  volume: number;
  currentTime: number;
  play(): Promise<void> | void;
  pause(): void;
}

export interface AudioDeps {
  createAudio(url: string): AudioLike;
  /** Resolves true when the URL serves an audio file (a missing file, or an SPA fallback page, is false). */
  probe(url: string): Promise<boolean>;
}

export const BGM_FADE_SECONDS = 1;
const SFX_POOL_SIZE = 3;

/** Volumes of the outgoing and incoming BGM channels `elapsed` seconds into a crossfade (each 0..1). */
export function crossfadeGains(elapsed: number, duration = BGM_FADE_SECONDS): { out: number; in: number } {
  const t = duration <= 0 ? 1 : Math.min(1, Math.max(0, elapsed / duration));
  return { out: 1 - t, in: t };
}

export const defaultAudioDeps: AudioDeps = {
  createAudio(url) {
    const audio = new Audio(url);
    audio.preload = "auto";
    return audio;
  },
  async probe(url) {
    try {
      const response = await fetch(url, { method: "HEAD" });
      if (!response.ok) return false;
      const type = response.headers.get("content-type") ?? "";
      return type.startsWith("audio/") || type.includes("mpeg") || type.includes("octet-stream");
    } catch {
      return false;
    }
  },
};

interface BgmChannel {
  audio: AudioLike | null;
  id: BgmId | null;
  /** 0..1 fade multiplier applied on top of the BGM volume setting. */
  gain: number;
}

export class WorldAudio implements WorldAudioLike {
  private settings: WorldSettings;
  private readonly deps: AudioDeps;
  private readonly known = new Map<string, Promise<boolean>>();
  private readonly pools = new Map<SfxId, { items: AudioLike[]; next: number }>();
  private current: BgmChannel = { audio: null, id: null, gain: 1 };
  private fading: BgmChannel | null = null;
  private fadeElapsed = 0;
  private wanted = "";
  private voice: AudioLike | null = null;
  private ambience: { audio: AudioLike | null; id: AmbienceId | null } = { audio: null, id: null };
  private ambienceWanted: AmbienceId | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private disposed = false;
  private readonly autoTick: boolean;

  constructor(settings: WorldSettings, deps: AudioDeps = defaultAudioDeps, autoTick = true) {
    this.settings = settings;
    this.deps = deps;
    this.autoTick = autoTick;
  }

  setSettings(settings: WorldSettings) {
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
    return this.settings.bgm ? (this.settings.bgmVolume / 100) * channel.gain : 0;
  }

  private ambienceVolume() {
    return this.settings.bgm ? clamp01((this.settings.bgmVolume / 100) * AMBIENCE_SHARE) : 0;
  }

  private applyVolumes() {
    if (this.voice) {
      if (this.settings.sfx) this.voice.volume = clamp01(this.settings.sfxVolume / 100);
      else this.stopVoice();
    }
    if (this.ambience.audio) this.ambience.audio.volume = this.ambienceVolume();
    if (this.current.audio) this.current.audio.volume = clamp01(this.bgmVolume(this.current));
    if (this.fading?.audio) this.fading.audio.volume = clamp01(this.bgmVolume(this.fading));
  }

  /**
   * Crossfades to a track (null = fade to silence). A list is a preference order: the first file that
   * exists plays, which is how a district's own music falls back to the field music. Asking again for the
   * same request does nothing.
   */
  playBgm(ids: BgmId | readonly BgmId[] | null) {
    if (this.disposed) return;
    const list: readonly BgmId[] = ids === null ? [] : typeof ids === "string" ? [ids] : ids;
    const key = list.join("|");
    if (key === this.wanted) return;
    this.wanted = key;
    void this.switchTo(list, key);
  }

  private async switchTo(list: readonly BgmId[], key: string) {
    let chosen: BgmId | null = null;
    for (const id of list) {
      if (await this.exists(BGM_FILES[id])) {
        chosen = id;
        break;
      }
    }
    if (this.wanted !== key || this.disposed) return; // the request changed while probing
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

  private startFade(next: AudioLike | null, id: BgmId | null) {
    // A fade already in flight ends immediately so at most two channels ever exist.
    if (this.fading) this.finishFade();
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

  /** Advances a running crossfade by `seconds` (called by the internal timer; exposed for tests). */
  tick(seconds: number) {
    if (!this.fading) return;
    this.fadeElapsed += seconds;
    const gains = crossfadeGains(this.fadeElapsed);
    this.fading.gain = gains.out;
    this.current.gain = gains.in;
    this.applyVolumes();
    if (this.fadeElapsed >= BGM_FADE_SECONDS) this.finishFade();
  }

  /** Switches the ambience loop (null = silence). Asking again for the current one does nothing; a missing file is silence. */
  playAmbience(id: AmbienceId | null) {
    if (this.disposed || id === this.ambienceWanted) return;
    this.ambienceWanted = id;
    void this.switchAmbience(id);
  }

  private async switchAmbience(id: AmbienceId | null) {
    const ok = id !== null && (await this.exists(AMBIENCE_FILES[id]));
    if (this.ambienceWanted !== id || this.disposed) return; // the request changed while probing
    const chosen = ok ? id : null;
    if (chosen === this.ambience.id) return;
    this.ambience.audio?.pause();
    let next: AudioLike | null = null;
    if (chosen) {
      next = this.deps.createAudio(AMBIENCE_FILES[chosen]);
      next.loop = true;
      next.volume = this.ambienceVolume();
      try {
        const played = next.play();
        if (played && typeof played.catch === "function") played.catch(() => {});
      } catch {
        /* autoplay blocked: stay silent */
      }
    }
    this.ambience = { audio: next, id: chosen };
  }

  /** Looks the sound effects up ahead of time so the first play is not dropped while the probe runs. */
  preloadSfx(ids: readonly SfxId[]) {
    for (const id of ids) void this.ensurePool(id);
  }

  private ensurePool(id: SfxId): Promise<boolean> {
    return this.exists(SFX_FILES[id]).then((ok) => {
      if (ok && !this.pools.has(id) && !this.disposed) {
        this.pools.set(id, { items: Array.from({ length: SFX_POOL_SIZE }, () => this.deps.createAudio(SFX_FILES[id])), next: 0 });
      }
      return ok;
    });
  }

  playSfx(id: SfxId) {
    if (this.disposed || !this.settings.sfx) return;
    const pool = this.pools.get(id);
    if (!pool) {
      void this.ensurePool(id);
      return;
    }
    const audio = pool.items[pool.next];
    pool.next = (pool.next + 1) % pool.items.length;
    audio.currentTime = 0;
    audio.volume = clamp01(this.settings.sfxVolume / 100);
    try {
      const played = audio.play();
      if (played && typeof played.catch === "function") played.catch(() => {});
    } catch {
      /* ignore */
    }
  }

  /**
   * Plays a member's card-click clip (the same file the 3D card plays). One voice at a time — a new one cuts
   * the previous — and it follows the sound-effect setting. Not probed: a missing file just fails to play.
   */
  playVoice(url: string) {
    if (this.disposed || !this.settings.sfx || !url) return;
    this.stopVoice();
    const audio = this.deps.createAudio(url);
    audio.volume = clamp01(this.settings.sfxVolume / 100);
    this.voice = audio;
    try {
      const played = audio.play();
      if (played && typeof played.catch === "function") played.catch(() => {});
    } catch {
      /* ignore */
    }
  }

  private stopVoice() {
    this.voice?.pause();
    this.voice = null;
  }

  /** Undoes `dispose()` (React StrictMode mounts, unmounts and remounts an overlay in development). */
  reset() {
    this.disposed = false;
  }

  dispose() {
    this.disposed = true;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    for (const channel of [this.current, this.fading]) channel?.audio?.pause();
    this.ambience.audio?.pause();
    this.ambience = { audio: null, id: null };
    this.ambienceWanted = null;
    this.stopVoice();
    for (const pool of this.pools.values()) pool.items.forEach((audio) => audio.pause());
    this.pools.clear();
    this.current = { audio: null, id: null, gain: 1 };
    this.fading = null;
  }
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
