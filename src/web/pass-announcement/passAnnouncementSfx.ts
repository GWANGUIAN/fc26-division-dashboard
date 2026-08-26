/**
 * SFX for the reveal sequence — plays the supplied audio files directly
 * (public/sfxes/button-click.mp3, card-flip.mp3, card-reveal.mp3). No
 * synthesized placeholder tones anymore now that real clips exist for all
 * three moments.
 */

/** Plays a one-shot audio file at the app's normal 0-100 sfxVolume scale, independent of the shared single-slot sfxAudio.ts player so it never gets cut off by an unrelated streamer sfx. */
function playFile(url: string, sfxVolume: number) {
  const audio = new Audio(url);
  audio.volume = Math.min(1, Math.max(0, sfxVolume / 100));
  audio.play().catch(() => {
    // ignore autoplay/decoding failures
  });
}

/** Clamp on the computed playbackRate — stretching/compressing far beyond
 * this starts sounding like a different sound entirely, so a clip much
 * shorter/longer than the target spin just plays at the extreme instead of
 * following it exactly the rest of the way. */
const SPIN_SFX_RATE_MIN = 0.25;
const SPIN_SFX_RATE_MAX = 4;

/** Speeds up/slows down the clip (via playbackRate, pitch-corrected by the
 * browser by default) so its own natural length is stretched or compressed
 * to line up with `targetSeconds` — used to match card-flip.mp3 to however
 * long the spin is currently configured to run (see spinDurationStorage). */
function playFileStretchedTo(url: string, sfxVolume: number, targetSeconds: number) {
  const audio = new Audio(url);
  audio.volume = Math.min(1, Math.max(0, sfxVolume / 100));
  const start = () => {
    const duration = audio.duration;
    if (Number.isFinite(duration) && duration > 0 && targetSeconds > 0) {
      const rate = duration / targetSeconds;
      audio.playbackRate = Math.min(
        SPIN_SFX_RATE_MAX,
        Math.max(SPIN_SFX_RATE_MIN, rate),
      );
    }
    audio.play().catch(() => {
      // ignore autoplay/decoding failures
    });
  };
  audio.addEventListener("loadedmetadata", start, { once: true });
  audio.addEventListener("error", start, { once: true });
}

export function playClickSfx(sfxEnabled: boolean, sfxVolume: number) {
  if (!sfxEnabled) return;
  playFile("/sfxes/button-click.mp3", sfxVolume);
}

/** card-flip.mp3, stretched or compressed to fill exactly `spinSeconds`
 * (see spinDurationStorage) so it runs the same length as whatever the spin
 * is currently configured to. */
export function startSpinSfx(
  sfxEnabled: boolean,
  sfxVolume: number,
  spinSeconds: number,
) {
  if (!sfxEnabled) return;
  playFileStretchedTo("/sfxes/card-flip.mp3", sfxVolume, spinSeconds);
}

export function playRevealStopSfx(sfxEnabled: boolean, sfxVolume: number) {
  if (!sfxEnabled) return;
  playFile("/sfxes/card-reveal.mp3", sfxVolume);
}

/** One-shot on hover-in (not a loop) — see CtaButton's onMouseEnter. */
export function playButtonHoverSfx(sfxEnabled: boolean, sfxVolume: number) {
  if (!sfxEnabled) return;
  playFile("/sfxes/button-hover.mp3", sfxVolume);
}
