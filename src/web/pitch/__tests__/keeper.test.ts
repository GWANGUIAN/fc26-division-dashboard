import { describe, expect, it } from "vitest";
import {
  createKeeper,
  diveProgress,
  keeperBallArrived,
  keeperPose,
  keeperTargetX,
  planSave,
  resolveKeeper,
  startDive,
  stepKeeper,
  KEEPER_RESOLVE_SECONDS,
  type KickInfo,
} from "../game/keeper";
import { POWER_BANDS, TARGET_SAVE_TABLE, ZONES, saveRate, saveRateTable, tableAverage } from "../game/montecarlo";
import { createRng } from "../game/rng";
import { KEEPER } from "../game/tuning";

const DT = 1 / 60;
const SEED = 20260925;
const N = 20000;

describe("save-rate table (02 §6, 20 000 shots per cell, fixed seed, ±6pt)", () => {
  const table = saveRateTable(N, SEED, 0);

  for (let zone = 0; zone < ZONES.length; zone++) {
    for (let band = 0; band < POWER_BANDS.length; band++) {
      const target = TARGET_SAVE_TABLE[zone]![band]!;
      it(`${ZONES[zone]!.name} × ${POWER_BANDS[band]!.name}: ${target}% ±6`, () => {
        expect(Math.abs(table[zone]![band]! - target)).toBeLessThanOrEqual(6);
      });
    }
  }

  it("more power and wider zones are harder to save", () => {
    for (let zone = 0; zone < 3; zone++) {
      expect(table[zone]![0]!).toBeGreaterThan(table[zone]![1]!);
      expect(table[zone]![1]!).toBeGreaterThan(table[zone]![2]!);
    }
    for (let band = 0; band < 3; band++) {
      expect(table[0]![band]!).toBeGreaterThan(table[1]![band]!);
      expect(table[1]![band]!).toBeGreaterThan(table[2]![band]!);
    }
  });

  it("is reproducible for a fixed seed", () => {
    expect(saveRate(1, 1, 500, SEED)).toBe(saveRate(1, 1, 500, SEED));
  });
});

describe("style Tier (02 §5)", () => {
  const t0 = tableAverage(saveRateTable(N, SEED, 0));
  const t1 = tableAverage(saveRateTable(N, SEED, 1));
  const t2 = tableAverage(saveRateTable(N, SEED, 2));

  it("Tier 1 takes about 15pt off the average save rate, Tier 2 about 30pt (floor 0)", () => {
    expect(t0 - t1).toBeGreaterThan(9);
    expect(t0 - t1).toBeLessThan(21);
    expect(t0 - t2).toBeGreaterThan(24);
    expect(t0 - t2).toBeLessThan(36);
  });

  it("never raises a cell's save rate and never goes below 0", () => {
    const a = saveRateTable(4000, SEED, 0);
    const b = saveRateTable(4000, SEED, 1);
    const c = saveRateTable(4000, SEED, 2);
    for (let z = 0; z < 3; z++) {
      for (let p = 0; p < 3; p++) {
        expect(b[z]![p]!).toBeLessThanOrEqual(a[z]![p]! + 1.5);
        expect(c[z]![p]!).toBeLessThanOrEqual(b[z]![p]! + 1.5);
        expect(c[z]![p]!).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("adds reaction time and grows the prediction error", () => {
    const kick: KickInfo = { tx: 40, h: 30, power: 50, time: 0.5, sweet: false };
    const rng = () => createRng(9);
    const plans = ([0, 1, 2] as const).map((tier) => planSave(kick, 480, tier, rng(), KEEPER));
    expect(plans[0]!.reactDelay).toBeCloseTo(KEEPER.react, 9);
    expect(plans[1]!.reactDelay).toBeCloseTo(KEEPER.react + 0.1, 9);
    expect(plans[2]!.reactDelay).toBeCloseTo(KEEPER.react + 0.2, 9);
    expect(KEEPER.tierPredErr).toEqual([1, 1.25, 1.5]);
  });
});

describe("planSave", () => {
  const rng = () => createRng(4);

  it("a pending hesitation delays the reaction", () => {
    const kick: KickInfo = { tx: 0, h: 20, power: 40, time: 0.6, sweet: false };
    expect(planSave(kick, 480, 0, rng(), KEEPER, 0.2).reactDelay).toBeCloseTo(KEEPER.react + 0.2, 9);
  });

  it("cannot save a ball that arrives before the reaction ends unless it is at the keeper's body", () => {
    const fast: KickInfo = { tx: 100, h: 20, power: 90, time: 0.1, sweet: false };
    expect(planSave(fast, 480, 0, rng(), { ...KEEPER, reachSpread: 0 }).saved).toBe(false);
    const straightAtHim: KickInfo = { tx: 4, h: 20, power: 30, time: 0.1, sweet: false };
    expect(planSave(straightAtHim, 480, 0, rng(), { ...KEEPER, reachSpread: 0, predErr: 0 }).saved).toBe(true);
  });

  it("a slow low shot to the middle is a CATCH; a hard reachable one is PUNCH or DEFLECT", () => {
    const easy: KickInfo = { tx: 10, h: 15, power: 20, time: 0.9, sweet: false };
    const plan = planSave(easy, 480, 0, rng(), { ...KEEPER, predErr: 0, reachSpread: 0 });
    expect(plan.saved).toBe(true);
    expect(plan.kind).toBe("CATCH");
    const hard: KickInfo = { tx: 10, h: 60, power: 88, time: 0.9, sweet: true };
    const kinds = new Set<string | null>();
    for (let seed = 1; seed <= 40; seed++) kinds.add(planSave(hard, 480, 0, createRng(seed), { ...KEEPER, predErr: 0, reachSpread: 0 }).kind);
    expect(kinds.has("DEFLECT")).toBe(true);
    expect(kinds.has("CATCH")).toBe(false);
  });

  it("a DEFLECT is a rebound (saved) about half the time and a grazed goal otherwise", () => {
    const hard: KickInfo = { tx: 10, h: 60, power: 88, time: 0.9, sweet: true };
    let saved = 0;
    let grazed = 0;
    for (let seed = 1; seed <= 400; seed++) {
      const plan = planSave(hard, 480, 0, createRng(seed), { ...KEEPER, reachSpread: 0 });
      if (plan.saved) saved++;
      if (plan.grazed) grazed++;
    }
    // (the prediction noise sometimes sends the keeper the wrong way, so not every shot reaches the DEFLECT roll)
    expect(saved + grazed).toBeGreaterThan(250);
    expect(saved / (saved + grazed)).toBeGreaterThan(0.4);
    expect(saved / (saved + grazed)).toBeLessThan(0.6);
  });

  it("dives toward the ball when the shot is reachable and stays for a shot at the body", () => {
    const wide: KickInfo = { tx: 60, h: 20, power: 30, time: 0.9, sweet: false };
    const dive = planSave(wide, 480, 0, rng(), { ...KEEPER, predErr: 0, reachSpread: 0 });
    expect(dive.mode).toBe("dive");
    expect(dive.endX).toBeGreaterThan(480);
    const middle: KickInfo = { tx: 3, h: 20, power: 30, time: 0.9, sweet: false };
    expect(planSave(middle, 480, 0, rng(), { ...KEEPER, predErr: 0, reachSpread: 0 }).mode).toBe("stay");
  });
});

describe("positioning (ready / track)", () => {
  it("cuts the angle: 0.35 of the ball's offset, at most 60px", () => {
    expect(keeperTargetX(480)).toBe(480);
    expect(keeperTargetX(580)).toBeCloseTo(515, 9);
    expect(keeperTargetX(900)).toBe(540);
    expect(keeperTargetX(0)).toBe(420);
  });

  it("walks to the target below the top speed and settles to ready", () => {
    const k = createKeeper();
    const rng = () => 0.99;
    let peak = 0;
    let sawTrack = false;
    for (let i = 0; i < 300; i++) {
      stepKeeper(k, DT, 700, rng);
      peak = Math.max(peak, Math.abs(k.vx));
      if (k.phase === "track") sawTrack = true;
    }
    expect(sawTrack).toBe(true);
    expect(peak).toBeLessThanOrEqual(KEEPER.maxSpeed + 1e-9);
    expect(k.x).toBeCloseTo(540, 0);
    expect(k.phase).toBe("ready");
  });

  it("hesitates now and then (5%): frozen for 0.3s", () => {
    const k = createKeeper();
    // standing at the target, the roll fires on the first 0.25s tick
    for (let i = 0; i < 16; i++) stepKeeper(k, DT, 480, () => 0);
    expect(k.hesitateLeft).toBeGreaterThan(0.2);
    // the ball moves away, but the keeper is frozen for the rest of the hesitation
    for (let i = 0; i < 6; i++) stepKeeper(k, DT, 700, () => 0.99);
    expect(k.x).toBe(480);
    // and follows again afterwards
    for (let i = 0; i < 60; i++) stepKeeper(k, DT, 700, () => 0.99);
    expect(k.x).toBeGreaterThan(500);
  });
});

describe("dive → resolve → recover", () => {
  const kick: KickInfo = { tx: 70, h: 20, power: 40, time: 0.7, sweet: false };

  it("waits out the reaction, throws itself over the flight time, then resolves and walks back", () => {
    const k = createKeeper();
    const plan = planSave(kick, k.x, 0, createRng(1), { ...KEEPER, predErr: 0, reachSpread: 0 });
    startDive(k, plan);
    expect(k.phase).toBe("dive");
    for (let t = 0; t < plan.reactDelay - 0.05; t += DT) stepKeeper(k, DT, 480, () => 0.99);
    expect(k.x).toBe(plan.startX);
    expect(keeperPose(k).clip).toBe("ready");
    expect(diveProgress(k)).toBe(0);

    let guard = 0;
    while (!keeperBallArrived(k) && guard++ < 200) stepKeeper(k, DT, 480, () => 0.99);
    expect(k.x).toBeGreaterThan(plan.startX + 30);
    expect(keeperPose(k).clip).toBe("dive_low_right");

    resolveKeeper(k, "SAVE");
    expect(k.phase).toBe("resolve");
    expect(k.x).toBe(plan.endX);
    for (let t = 0; t < KEEPER_RESOLVE_SECONDS + 0.05; t += DT) stepKeeper(k, DT, 480, () => 0.99);
    expect(k.phase).toBe("recover");
    for (let i = 0; i < 400; i++) stepKeeper(k, DT, 480, () => 0.99);
    expect(k.phase).toBe("ready");
    expect(k.x).toBeCloseTo(480, 0);
  });

  it("picks the beaten pose after a goal and the celebration after a save", () => {
    const beaten = createKeeper();
    startDive(beaten, planSave({ ...kick, tx: 3 }, beaten.x, 0, createRng(1), { ...KEEPER, predErr: 0, reachSpread: 0 }));
    resolveKeeper(beaten, "GOAL");
    for (let i = 0; i < 40; i++) stepKeeper(beaten, DT, 480, () => 0.99);
    expect(keeperPose(beaten).clip).toBe("beaten");

    const saved = createKeeper();
    startDive(saved, planSave({ ...kick, tx: 3 }, saved.x, 0, createRng(1), { ...KEEPER, predErr: 0, reachSpread: 0 }));
    resolveKeeper(saved, "SAVE");
    for (let i = 0; i < 40; i++) stepKeeper(saved, DT, 480, () => 0.99);
    expect(keeperPose(saved).clip).toBe("save_celebrate");
  });
});
