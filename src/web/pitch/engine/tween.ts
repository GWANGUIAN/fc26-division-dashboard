// Small easing / tween helpers (docs/pitch/01 §8). Pure functions plus a tiny mutable timer, so nothing is
// allocated inside the frame loop: callers keep one `Tween` per animation and re-`startTween` it.

export type Easing = (t: number) => number;

export const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const linear: Easing = (t) => clamp01(t);
export const easeOutCubic: Easing = (t) => 1 - (1 - clamp01(t)) ** 3;
export const easeInCubic: Easing = (t) => clamp01(t) ** 3;
export const easeInOutSine: Easing = (t) => (1 - Math.cos(Math.PI * clamp01(t))) / 2;
/** Overshoots past 1 and settles: the pop of a banner. */
export const easeOutBack: Easing = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const x = clamp01(t) - 1;
  return 1 + c3 * x ** 3 + c1 * x ** 2;
};

/** 0..1 progress of `elapsed` seconds through `duration` (a zero duration is already finished). */
export function progress(elapsed: number, duration: number) {
  return duration <= 0 ? 1 : clamp01(elapsed / duration);
}

/** Eased value between `from` and `to`, `elapsed` seconds into `duration`. */
export function tweenValue(from: number, to: number, elapsed: number, duration: number, easing: Easing = linear) {
  return lerp(from, to, easing(progress(elapsed, duration)));
}

export interface Tween {
  elapsed: number;
  duration: number;
  active: boolean;
}

export function createTween(): Tween {
  return { elapsed: 0, duration: 0, active: false };
}

export function startTween(t: Tween, duration: number) {
  t.elapsed = 0;
  t.duration = duration;
  t.active = duration > 0;
}

/** Advances the timer; returns its 0..1 progress (1 once finished, and `active` turns false). */
export function stepTween(t: Tween, dt: number) {
  if (!t.active) return 1;
  t.elapsed += dt;
  if (t.elapsed >= t.duration) {
    t.elapsed = t.duration;
    t.active = false;
  }
  return progress(t.elapsed, t.duration);
}

/** Eased progress of a running tween (0 when idle-before-start is not distinguishable: check `active`). */
export function tweenProgress(t: Tween, easing: Easing = linear) {
  return easing(progress(t.elapsed, t.duration));
}

/** Moves `value` toward `target` by at most `maxStep`. */
export function approach(value: number, target: number, maxStep: number) {
  if (value < target) return Math.min(target, value + maxStep);
  return Math.max(target, value - maxStep);
}
