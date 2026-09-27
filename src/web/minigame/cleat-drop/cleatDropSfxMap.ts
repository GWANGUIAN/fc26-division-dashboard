// Cleat Drop sound events (docs/minigame-cleat-drop.md §7). Each event lists its own file first
// (`cleat-drop-<name>.mp3` in public/sfxes) and then the reuse candidates of §7-2, which stand in until the
// real file arrives — a missing file is silence, never an error. `victory.mp3` (and `pitch-victory*`) belong
// to another feature and must never appear here (enforced by a test).

import { playSfx } from "../../sfxAudio";

export type CleatDropSfxId =
  | "lace-release" | "leg-swing" | "kick-impact" | "miss-ground" | "bounce-soft" | "bounce-hard"
  | "land-settle" | "timer-tick" | "slip-off" | "stage-clear" | "all-clear" | "ui-click";

const own = (name: CleatDropSfxId) => `/sfxes/cleat-drop-${name}.mp3`;

/** Candidate files per event, best first — the own file, then §7-2's reuse fallbacks. */
export const CLEAT_DROP_SFX_CANDIDATES: Readonly<Record<CleatDropSfxId, readonly string[]>> = {
  "lace-release": [own("lace-release"), "/sfxes/pitch-ui-click.mp3"],
  "leg-swing": [own("leg-swing"), "/sfxes/pitch-ui-select.mp3"],
  "kick-impact": [own("kick-impact"), "/sfxes/pitch-power-charge.mp3"],
  "miss-ground": [own("miss-ground"), "/sfxes/pitch-net-hit.mp3"],
  "bounce-soft": [own("bounce-soft"), "/sfxes/pitch-ball-touch.mp3"],
  "bounce-hard": [own("bounce-hard"), "/sfxes/pitch-ball-touch.mp3"],
  "land-settle": [own("land-settle"), "/sfxes/pitch-style-gain.mp3"],
  "timer-tick": [own("timer-tick")],
  "slip-off": [own("slip-off"), "/sfxes/pitch-ui-back.mp3"],
  "stage-clear": [own("stage-clear"), "/sfxes/pitch-style-tier.mp3"],
  "all-clear": [own("all-clear"), "/sfxes/pitch-style-tier.mp3"],
  "ui-click": [own("ui-click"), "/sfxes/pitch-ui-click.mp3"],
};

/** Loudness relative to the sound-effect volume. `timer-tick` repeats often, so it sits low. */
export const CLEAT_DROP_SFX_GAIN: Readonly<Partial<Record<CleatDropSfxId, number>>> = {
  "timer-tick": 0.3,
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Plays an event's own file, or the first reuse candidate whose playback doesn't error, or nothing. */
export function playCleatDropSfx(id: CleatDropSfxId, volume = 1): void {
  const gain = clamp01(volume) * (CLEAT_DROP_SFX_GAIN[id] ?? 1);
  if (gain <= 0) return;
  playCandidate(CLEAT_DROP_SFX_CANDIDATES[id], 0, gain);
}

function playCandidate(urls: readonly string[], index: number, volume: number) {
  if (index >= urls.length) return;
  playSfx(urls[index]!, volume, (audio) => {
    audio.addEventListener("error", () => playCandidate(urls, index + 1, volume), { once: true });
  });
}
