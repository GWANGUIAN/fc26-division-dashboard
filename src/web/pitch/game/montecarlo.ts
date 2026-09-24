// Monte Carlo of the keeper's save rate (docs/pitch/02 §6 target table). Shared by keeper.test.ts (fixed seed,
// 20 000 shots per cell) and the ?pitchDebug=1 console output. The "standard shot" is fixed here so the table has a
// meaning: shot distance and shooter x are uniform over the ranges below, tx is uniform within the zone (either side),
// power is uniform within the band, and the keeper stands where 02 §6 puts it (0.35 follow) with the usual hesitation.

import { planSave, keeperTargetX, type StyleTier } from "./keeper";
import { createRng } from "./rng";
import { isSweet, shotHeight, shotSpeed } from "./shot";
import { GOAL_MOUTH, KEEPER, SHOT, type KeeperTuning, type ShotTuning } from "./tuning";

/** Zones as |tx| / (W/2) ranges and power bands (02 §6). Corner stops at 0.95 (beyond that it is a post shot). */
export const ZONES = [
  { name: "중앙", min: 0, max: 0.3 },
  { name: "중간", min: 0.3, max: 0.7 },
  { name: "코너", min: 0.7, max: 0.95 },
] as const;

export const POWER_BANDS = [
  { name: "낮음", min: 0, max: 40 },
  { name: "중간", min: 41, max: 77 },
  { name: "스윗스팟", min: 78, max: 92 },
] as const;

/** Target save rates in %, `[zone][band]` (02 §6). */
export const TARGET_SAVE_TABLE: ReadonlyArray<readonly number[]> = [
  [90, 80, 60],
  [75, 55, 30],
  [55, 35, 8],
];

export interface McScenario {
  distMin: number;
  distMax: number;
  shooterXHalf: number;
}

export const MC_SCENARIO: Readonly<McScenario> = { distMin: 250, distMax: 450, shooterXHalf: 140 };

export function saveRate(
  zone: number,
  band: number,
  n: number,
  seed: number,
  tier: StyleTier = 0,
  D: KeeperTuning = KEEPER,
  shot: ShotTuning = SHOT,
  scenario: McScenario = MC_SCENARIO,
): number {
  const z = ZONES[zone]!;
  const b = POWER_BANDS[band]!;
  const rng = createRng(seed + zone * 101 + band * 13 + tier * 1009);
  const half = GOAL_MOUTH.width / 2;
  let saved = 0;
  for (let i = 0; i < n; i++) {
    const power = b.min + rng() * (b.max - b.min);
    const tx = (rng() < 0.5 ? -1 : 1) * (z.min + rng() * (z.max - z.min)) * half;
    const dist = scenario.distMin + rng() * (scenario.distMax - scenario.distMin);
    const shooterX = 480 + (rng() * 2 - 1) * scenario.shooterXHalf;
    const hesitate = rng() < D.hesitateChance ? rng() * D.hesitateSeconds : 0;
    const plan = planSave(
      { tx, h: shotHeight(power, shot), power, time: dist / shotSpeed(power, shot), sweet: isSweet(power, shot) },
      keeperTargetX(shooterX, D),
      tier,
      rng,
      D,
      hesitate,
    );
    if (plan.saved) saved++;
  }
  return (saved / n) * 100;
}

/** `[zone][band]` save rates in %. */
export function saveRateTable(
  n: number,
  seed: number,
  tier: StyleTier = 0,
  D: KeeperTuning = KEEPER,
  shot: ShotTuning = SHOT,
  scenario: McScenario = MC_SCENARIO,
): number[][] {
  return ZONES.map((_, zone) => POWER_BANDS.map((__, band) => saveRate(zone, band, n, seed, tier, D, shot, scenario)));
}

export function tableAverage(table: ReadonlyArray<readonly number[]>) {
  let sum = 0;
  for (const row of table) for (const v of row) sum += v;
  return sum / 9;
}

/** Pretty table for the console. */
export function formatSaveTable(table: ReadonlyArray<readonly number[]>): string {
  const lines = ["구역\\파워  " + POWER_BANDS.map((b) => b.name.padEnd(8)).join("")];
  table.forEach((row, zone) => {
    lines.push(
      ZONES[zone]!.name.padEnd(9) + row.map((v, band) => `${v.toFixed(1)}(${TARGET_SAVE_TABLE[zone]![band]})`.padEnd(10)).join(""),
    );
  });
  lines.push(`평균 ${tableAverage(table).toFixed(1)}%`);
  return lines.join("\n");
}
