let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, startOffset: number, duration: number, gainValue: number, type: OscillatorType = "square") {
  const audioCtx = getCtx();
  if (!audioCtx || gainValue <= 0) return;
  const start = audioCtx.currentTime + startOffset;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(gainValue, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(start);
  osc.stop(start + duration);
}

let spinTimer: number | null = null;

/** sfxVolume is a 0-100 scale (see useSfxSettings/storage.ts), same convention as playSfx(url, sfxVolume / 100). */
function normalizedGain(sfxVolume: number, base: number) {
  return Math.min(1, Math.max(0, sfxVolume / 100)) * base;
}

/** Rapid ticking loop mimicking a roulette wheel clicking past each label. */
export function startSpinSound(sfxEnabled: boolean, sfxVolume: number) {
  if (spinTimer != null || !sfxEnabled) return;
  const tick = () => tone(620 + Math.random() * 180, 0, 0.045, normalizedGain(sfxVolume, 0.044));
  tick();
  spinTimer = window.setInterval(tick, 90);
}

export function stopSpinSound() {
  if (spinTimer != null) {
    window.clearInterval(spinTimer);
    spinTimer = null;
  }
}

/** Short bright chime for the roulette landing on its result. */
export function playRevealChime(sfxEnabled: boolean, sfxVolume: number) {
  if (!sfxEnabled) return;
  tone(880, 0, 0.16, normalizedGain(sfxVolume, 0.06), "sine");
  tone(1318.5, 0.07, 0.22, normalizedGain(sfxVolume, 0.06), "sine");
}
