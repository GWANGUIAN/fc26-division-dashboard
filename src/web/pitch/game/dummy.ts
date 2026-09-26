// Training-dummy shooting (docs/forever/01 P2, 02 §11): a power meter sweeps back and forth, one press stops it and the
// shot's damage follows from where it stopped. Pure numbers only; it never touches the Forever progress data.

/** Seconds for the meter to go from 0 to 100 (it then sweeps back). */
export const DUMMY_SWEEP_SECONDS = 0.9;
/** The meter gets faster with every shot: +12% of the first speed per shot, up to 3.5x (a sweep of about 0.26 s). */
export const DUMMY_SPEEDUP_PER_SHOT = 0.12;
export const DUMMY_MAX_SPEED = 3.5;

/** Speed factor of the meter once `shots` shots have been taken in this visit. */
export function dummySpeed(shots: number): number {
  return Math.min(DUMMY_MAX_SPEED, 1 + DUMMY_SPEEDUP_PER_SHOT * Math.max(0, Math.floor(shots)));
}

/** Power band that scores a critical hit. */
export const DUMMY_SWEET = { from: 78, to: 92 } as const;
/** Below this the ball misses the dummy. */
export const DUMMY_MISS_BELOW = 8;

export type DummyHitKind = "miss" | "hit" | "crit";

export interface DummyHit {
  power: number;
  kind: DummyHitKind;
  damage: number;
}

/** Meter value (0..100) `seconds` after the sweep started: a triangle wave. */
export function meterPower(seconds: number): number {
  const phase = (((seconds / DUMMY_SWEEP_SECONDS) % 2) + 2) % 2;
  return Math.round((phase <= 1 ? phase : 2 - phase) * 100);
}

/** The result of a shot stopped at `power`; `random` (0..1) adds ±10% variation. */
export function dummyHit(power: number, random: () => number): DummyHit {
  const p = Math.max(0, Math.min(100, Math.round(power)));
  if (p < DUMMY_MISS_BELOW) return { power: p, kind: "miss", damage: 0 };
  const base = (10 + p * 0.9) * (0.9 + 0.2 * random());
  const crit = p >= DUMMY_SWEET.from && p <= DUMMY_SWEET.to;
  return { power: p, kind: crit ? "crit" : "hit", damage: Math.round(crit ? base * 2 : base) };
}
