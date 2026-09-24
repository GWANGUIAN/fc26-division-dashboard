// Event → sound file table of the pitch (docs/pitch/06). Files are looked up by name at runtime and a file that does
// not exist is silence — nothing here may throw or wait. Each event lists its own file first (`pitch-<name>.mp3` in
// public/sfxes, 06 §2) and then the reuse candidates of 06 §3, which stand in until the real file arrives.
// `victory.mp3` belongs to another feature and must never appear in this table (a test enforces it).

export type PitchBgmId = "loading" | "pitch" | "locker";

export const BGM_FILES: Readonly<Record<PitchBgmId, string>> = {
  loading: "/pitch-bgm-loading.mp3",
  pitch: "/pitch-bgm-pitch.mp3",
  locker: "/pitch-bgm-locker.mp3",
};

/** Sound events of the pitch. Named after the 06 file (without `pitch-` and `.mp3`). */
export type PitchSfxId =
  // UI / loading / transitions (06 §2-1)
  | "ui-hover" | "ui-click" | "ui-select" | "ui-cursor" | "ui-back" | "load-complete" | "transition-wipe" | "mode-switch"
  // movement / ball (06 §2-2)
  | "step-grass-a" | "step-grass-b" | "sprint-start" | "ball-touch" | "ball-trap" | "ball-loose" | "ball-out"
  // shot (06 §2-3)
  | "aim-start" | "aim-tick" | "aim-lock" | "power-charge" | "power-lock" | "power-sweet" | "kick-soft" | "kick-mid" | "kick-hard" | "too-far"
  // skills / style (06 §2-4)
  | "skill-stepover" | "skill-roulette" | "skill-rainbow" | "skill-elastico" | "style-gain" | "style-tier"
  // results (06 §2-5)
  | "net-hit" | "goal-cheer" | "goal-horn" | "save-glove" | "save-punch" | "save-deflect" | "save-groan" | "post-hit" | "bar-hit"
  | "miss-whoosh" | "whistle-short" | "banner-in" | "celebrate"
  // keeper / locker room / stats (06 §2-6)
  | "keeper-dive" | "gate-open" | "gate-close" | "stat-on" | "stat-select" | "stat-soon";

const sfx = (name: string) => `/sfxes/${name}.mp3`;

/**
 * Candidate files per event, best first. Reuse candidates (06 §3) are the ones after the `pitch-` file.
 * `pitch-miss-whoosh` is also listed under its on-disk spelling `pitch-miss-whoos` (the delivered file is missing an h).
 */
export const SFX_CANDIDATES: Readonly<Record<PitchSfxId, readonly string[]>> = {
  "ui-hover": [sfx("pitch-ui-hover"), sfx("button-hover")],
  "ui-click": [sfx("pitch-ui-click"), sfx("button-click")],
  "ui-select": [sfx("pitch-ui-select")],
  "ui-cursor": [sfx("pitch-ui-cursor")],
  "ui-back": [sfx("pitch-ui-back")],
  "load-complete": [sfx("pitch-load-complete")],
  "transition-wipe": [sfx("pitch-transition-wipe")],
  "mode-switch": [sfx("pitch-mode-switch")],
  "step-grass-a": [sfx("pitch-step-grass-a")],
  "step-grass-b": [sfx("pitch-step-grass-b")],
  "sprint-start": [sfx("pitch-sprint-start")],
  "ball-touch": [sfx("pitch-ball-touch"), sfx("ball-bounce")],
  "ball-trap": [sfx("pitch-ball-trap"), sfx("ball-bounce")],
  "ball-loose": [sfx("pitch-ball-loose")],
  "ball-out": [sfx("pitch-ball-out")],
  "aim-start": [sfx("pitch-aim-start")],
  "aim-tick": [sfx("pitch-aim-tick")],
  "aim-lock": [sfx("pitch-aim-lock")],
  "power-charge": [sfx("pitch-power-charge")],
  "power-lock": [sfx("pitch-power-lock")],
  "power-sweet": [sfx("pitch-power-sweet")],
  "kick-soft": [sfx("pitch-kick-soft"), sfx("world-ball-kick")],
  "kick-mid": [sfx("pitch-kick-mid"), sfx("world-ball-kick")],
  "kick-hard": [sfx("pitch-kick-hard"), sfx("world-ball-kick")],
  "too-far": [sfx("pitch-too-far")],
  "skill-stepover": [sfx("pitch-skill-stepover")],
  "skill-roulette": [sfx("pitch-skill-roulette")],
  "skill-rainbow": [sfx("pitch-skill-rainbow")],
  "skill-elastico": [sfx("pitch-skill-elastico")],
  "style-gain": [sfx("pitch-style-gain")],
  "style-tier": [sfx("pitch-style-tier")],
  "net-hit": [sfx("pitch-net-hit"), sfx("world-ball-net")],
  "goal-cheer": [sfx("pitch-goal-cheer"), sfx("goal"), sfx("cheer"), sfx("world-crowd-roar")],
  "goal-horn": [sfx("pitch-goal-horn")],
  "save-glove": [sfx("pitch-save-glove")],
  "save-punch": [sfx("pitch-save-punch")],
  "save-deflect": [sfx("pitch-save-deflect")],
  "save-groan": [sfx("pitch-save-groan")],
  "post-hit": [sfx("pitch-post-hit"), sfx("world-ball-post")],
  "bar-hit": [sfx("pitch-bar-hit"), sfx("world-ball-post")],
  "miss-whoosh": [sfx("pitch-miss-whoosh"), sfx("pitch-miss-whoos")],
  "whistle-short": [sfx("pitch-whistle-short"), sfx("world-whistle-short")],
  "banner-in": [sfx("pitch-banner-in")],
  celebrate: [sfx("pitch-celebrate")],
  "keeper-dive": [sfx("pitch-keeper-dive")],
  "gate-open": [sfx("pitch-gate-open")],
  "gate-close": [sfx("pitch-gate-close")],
  "stat-on": [sfx("pitch-stat-on")],
  "stat-select": [sfx("pitch-stat-select")],
  "stat-soon": [sfx("pitch-stat-soon")],
};

/**
 * Loudness of an event relative to the sound-effect volume. Sounds that repeat many times a second (steps, touches,
 * ticks) sit low so they never mask the rest (06 §0).
 */
export const SFX_GAIN: Readonly<Partial<Record<PitchSfxId, number>>> = {
  "step-grass-a": 0.35,
  "step-grass-b": 0.35,
  "ball-touch": 0.5,
  "ball-trap": 0.7,
  "aim-tick": 0.4,
  "ui-hover": 0.5,
  "style-gain": 0.7,
  "banner-in": 0.6,
  "goal-cheer": 0.9,
  "save-groan": 0.8,
};

/** Every file the table can play (all candidates of all events). */
export function allSfxFiles(): string[] {
  return [...new Set(Object.values(SFX_CANDIDATES).flat())];
}

/** The first candidate that exists, or null (silence). `exists` decides — a probe in the game, a stub in tests. */
export function resolveSfx(id: PitchSfxId, exists: (url: string) => boolean): string | null {
  for (const url of SFX_CANDIDATES[id]) if (exists(url)) return url;
  return null;
}

/** Same as `resolveSfx` for a probe that answers later. */
export async function resolveSfxAsync(id: PitchSfxId, exists: (url: string) => Promise<boolean>): Promise<string | null> {
  for (const url of SFX_CANDIDATES[id]) if (await exists(url)) return url;
  return null;
}

/** Kick sound by shot power (the same bands as the power bar: soft < 40 ≤ mid < 78 ≤ hard). */
export function kickSfx(power: number): PitchSfxId {
  return power < 40 ? "kick-soft" : power < 78 ? "kick-mid" : "kick-hard";
}
