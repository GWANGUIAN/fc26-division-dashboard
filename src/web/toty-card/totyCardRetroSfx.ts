// Small Web Audio helpers for the "90년대 고전 도트" TOTY card easter egg —
// a lowpass+bitcrush filter chain that makes existing mp3 sfx sound like
// they're coming out of a cheap old arcade-cabinet speaker, and a
// synthesized chiptune blip (no audio file at all) for the theme-select
// dropdown shown above a revealed card (see TotyCardPopup.tsx).

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  sharedAudioCtx ??= new Ctor();
  // Browsers start a freshly-created context "suspended" until a user
  // gesture resumes it — every call site here only ever runs in response to
  // one (popup open, reveal click, card click, select change), so this is
  // safe to fire-and-forget rather than await.
  if (sharedAudioCtx.state === "suspended") sharedAudioCtx.resume().catch(() => {});
  return sharedAudioCtx;
}

function bitcrushCurve(steps: number): Float32Array {
  const curve = new Float32Array(1024);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = Math.round(x * steps) / steps;
  }
  return curve;
}

/**
 * Routes an <audio> element through a lowpass + bitcrush filter chain before
 * it reaches the speakers, so it sounds like it's coming out of a cheap old
 * arcade-cabinet speaker instead of the crisp original. Must be called
 * before .play() — creating a MediaElementAudioSourceNode redirects the
 * element's ENTIRE output into the Web Audio graph, so this only actually
 * changes anything once connected through to .destination (below).
 * Silently no-ops, leaving the element to play normally through its default
 * output, if Web Audio is unavailable or connecting throws (e.g. this
 * element already has a source node — shouldn't happen since every caller
 * here uses a freshly-constructed Audio()).
 */
export function applyRetroSfxFilter(audio: HTMLAudioElement): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const source = ctx.createMediaElementSource(audio);
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 2600;
    const shaper = ctx.createWaveShaper();
    shaper.curve = bitcrushCurve(12) as Float32Array<ArrayBuffer>;
    shaper.oversample = "none";
    source.connect(lowpass).connect(shaper).connect(ctx.destination);
  } catch {
    // Web Audio unsupported/blocked — element just plays normally instead.
  }
}

/**
 * Short synthesized square-wave "blip" (no audio file) played when switching
 * the card-theme select — a quick two-note up-chirp evoking an old arcade
 * menu-navigate sound. `volume` follows the same 0–1 scale as playSfx.
 */
export function playRetroBlip(volume: number): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume * 0.25, now + 0.005);
  gain.gain.setValueAtTime(volume * 0.25, now + 0.09);
  gain.gain.linearRampToValueAtTime(0, now + 0.12);
  gain.connect(ctx.destination);

  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.setValueAtTime(760, now + 0.06);
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + 0.13);
}
