import { describe, expect, it } from "vitest";
import {
  aimForTx,
  aimRay,
  aimWave,
  cancelShot,
  classifyShot,
  computeShot,
  createShot,
  flightHeight,
  isSweet,
  powerWave,
  pressShot,
  resetShot,
  shotHeight,
  shotJitterSigma,
  shotSpeed,
  stepShot,
} from "../game/shot";
import { createRng } from "../game/rng";
import { SHOT, SPAWN } from "../game/tuning";

const DT = 1 / 60;

/** Steps the shot state for `seconds` (fixed 60 Hz). */
function run(s: ReturnType<typeof createShot>, seconds: number) {
  let last: "timeout" | null = null;
  for (let t = 0; t < seconds - 1e-9; t += DT) last = stepShot(s, DT) ?? last;
  return last;
}

describe("triangle waves (02 §4)", () => {
  it("aim sweep starts at the centre heading right, period 1.1s", () => {
    const P = SHOT.aimSeconds;
    expect(aimWave(0, P)).toBeCloseTo(0, 6);
    expect(aimWave(P * 0.25, P)).toBeCloseTo(1, 6);
    expect(aimWave(P * 0.5, P)).toBeCloseTo(0, 6);
    expect(aimWave(P * 0.75, P)).toBeCloseTo(-1, 6);
    expect(aimWave(P, P)).toBeCloseTo(0, 6);
    expect(aimWave(P * 3.25, P)).toBeCloseTo(1, 6);
  });

  it("power gauge rises 0 → 100 and falls back, period 1.8s", () => {
    const P = SHOT.powerSeconds;
    expect(powerWave(0, P)).toBeCloseTo(0, 6);
    expect(powerWave(P / 4, P)).toBeCloseTo(50, 6);
    expect(powerWave(P / 2, P)).toBeCloseTo(100, 6);
    expect(powerWave((P * 3) / 4, P)).toBeCloseTo(50, 6);
    expect(powerWave(P, P)).toBeCloseTo(0, 6);
  });
});

describe("shot state machine", () => {
  it("idle → aim → power → released on three presses", () => {
    const s = createShot();
    expect(pressShot(s)).toBe("start");
    expect(s.phase).toBe("aim");
    expect(pressShot(s)).toBe("lock-aim");
    expect(s.phase).toBe("power");
    expect(pressShot(s)).toBe("release");
    expect(s.phase).toBe("released");
    expect(pressShot(s)).toBeNull();
  });

  it("the aim arrow sweeps while aiming and freezes once locked", () => {
    const s = createShot();
    pressShot(s);
    run(s, SHOT.aimSeconds / 4);
    expect(s.aim).toBeCloseTo(1, 1);
    pressShot(s);
    const locked = s.aim;
    run(s, 0.5);
    expect(s.aim).toBe(locked);
    expect(s.power).toBeGreaterThan(0);
  });

  it("cancels back to idle with Esc in the aim and power stages, but not after the kick", () => {
    const s = createShot();
    pressShot(s);
    cancelShot(s);
    expect(s.phase).toBe("idle");
    pressShot(s);
    pressShot(s);
    cancelShot(s);
    expect(s.phase).toBe("idle");
    pressShot(s);
    pressShot(s);
    pressShot(s);
    cancelShot(s);
    expect(s.phase).toBe("released");
  });

  it("times out after 3s in the aim stage and in the power stage", () => {
    const aim = createShot();
    pressShot(aim);
    expect(run(aim, 2.9)).toBeNull();
    expect(aim.phase).toBe("aim");
    expect(run(aim, 0.2)).toBe("timeout");
    expect(aim.phase).toBe("idle");

    const power = createShot();
    pressShot(power);
    pressShot(power);
    expect(run(power, 2.9)).toBeNull();
    expect(power.phase).toBe("power");
    expect(run(power, 0.2)).toBe("timeout");
    expect(power.phase).toBe("idle");
    expect(power.power).toBe(0);
  });

  it("the stage timer restarts when the aim is locked", () => {
    const s = createShot();
    pressShot(s);
    run(s, 2.5);
    pressShot(s);
    expect(run(s, 2.5)).toBeNull();
    expect(s.phase).toBe("power");
    resetShot(s);
    expect(s.phase).toBe("idle");
  });
});

describe("sweet spot (78~92)", () => {
  it("includes both ends and nothing outside", () => {
    expect(isSweet(77.9)).toBe(false);
    expect(isSweet(78)).toBe(true);
    expect(isSweet(92)).toBe(true);
    expect(isSweet(92.1)).toBe(false);
  });
});

describe("aim ray", () => {
  const { x, y } = SPAWN;

  it("from the spawn the sweep centre is the goal centre and the ends overshoot the posts by 12% of W", () => {
    expect(aimRay(x, y, 0).tx).toBeCloseTo(0, 6);
    expect(aimRay(x, y, 0).angleDeg).toBeCloseTo(0, 6);
    const reach = 120 + 240 * 0.12;
    expect(aimRay(x, y, 1).tx).toBeCloseTo(reach, 6);
    expect(aimRay(x, y, -1).tx).toBeCloseTo(-reach, 6);
    expect(aimRay(x, y, 1).angleDeg).toBeGreaterThan(0);
    expect(aimRay(x, y, -1).angleDeg).toBeLessThan(0);
  });

  it("aims at the same goal range from a wide position, and aimForTx inverts aimRay", () => {
    expect(aimRay(200, 300, -1).tx).toBeCloseTo(-148.8, 6);
    expect(aimRay(200, 300, 1).tx).toBeCloseTo(148.8, 6);
    for (const aim of [-0.7, -0.1, 0.4, 0.95]) {
      expect(aimForTx(200, 300, aimRay(200, 300, aim).tx)).toBeCloseTo(aim, 6);
    }
  });
});

describe("height, speed and jitter (02 §4 table)", () => {
  it("h = goalH·(0.12 + 0.88·(p/100)^1.2), plus 2.4 per point above 92", () => {
    expect(shotHeight(0)).toBeCloseTo(9.6, 6);
    expect(shotHeight(50)).toBeCloseTo(80 * (0.12 + 0.88 * Math.pow(0.5, 1.2)), 6);
    expect(shotHeight(92)).toBeCloseTo(80 * (0.12 + 0.88 * Math.pow(0.92, 1.2)), 6);
    expect(shotHeight(100)).toBeCloseTo(80 + 8 * 2.4, 6);
    expect(shotHeight(100)).toBeGreaterThan(80 + SHOT.barTolerance);
  });

  it("v = lerp(420, 1100, p/100)", () => {
    expect(shotSpeed(0)).toBe(420);
    expect(shotSpeed(100)).toBe(1100);
    expect(shotSpeed(50)).toBe(760);
  });

  it("σ follows the formula and the sweet spot cuts it to 60%", () => {
    const W = 240;
    const formula = (p: number, dist: number, angle: number) => 0.06 * W * (1 + Math.abs(p - 85) / 40) * (0.8 + dist / 500) * (1 + Math.abs(angle) / 60);
    expect(shotJitterSigma(60, 300, 10)).toBeCloseTo(formula(60, 300, 10), 6);
    expect(shotJitterSigma(20, 500, 0)).toBeCloseTo(formula(20, 500, 0), 6);
    expect(shotJitterSigma(85, 300, 10)).toBeCloseTo(formula(85, 300, 10) * 0.6, 6);
    // a wide angle or a weak / overhit kick is less accurate
    expect(shotJitterSigma(60, 300, 40)).toBeGreaterThan(shotJitterSigma(60, 300, 0));
    expect(shotJitterSigma(100, 300, 0)).toBeGreaterThan(shotJitterSigma(80, 300, 0));
  });
});

describe("classifyShot", () => {
  it("in the mouth and below the bar is on target", () => {
    expect(classifyShot(0, 40)).toBe("onTarget");
    expect(classifyShot(-113, 10)).toBe("onTarget");
  });

  it("within 6px of a post is POST, either side and both inside / outside", () => {
    expect(classifyShot(120, 40)).toBe("post");
    expect(classifyShot(-114, 40)).toBe("post");
    expect(classifyShot(126, 40)).toBe("post");
    expect(classifyShot(-126, 40)).toBe("post");
    expect(classifyShot(113.9, 40)).toBe("onTarget");
    expect(classifyShot(126.1, 40)).toBe("wide");
  });

  it("within 6 of the bar height is BAR, higher is OVER", () => {
    expect(classifyShot(0, 80)).toBe("bar");
    expect(classifyShot(30, 74)).toBe("bar");
    expect(classifyShot(30, 86)).toBe("bar");
    expect(classifyShot(30, 73.9)).toBe("onTarget");
    expect(classifyShot(30, 86.1)).toBe("over");
    expect(classifyShot(0, 99)).toBe("over");
  });

  it("outside the posts is WIDE", () => {
    expect(classifyShot(200, 20)).toBe("wide");
    expect(classifyShot(-200, 20)).toBe("wide");
    expect(classifyShot(200, 99)).toBe("wide");
  });
});

describe("computeShot", () => {
  const input = { ballX: SPAWN.x, ballY: SPAWN.y, aim: 0, power: 85 };

  it("flight time = distance / speed, sweet flag, and height", () => {
    const f = computeShot(input, createRng(1));
    expect(f.sweet).toBe(true);
    expect(f.h).toBeCloseTo(shotHeight(85), 6);
    expect(f.speed).toBeCloseTo(shotSpeed(85), 6);
    expect(f.time).toBeCloseTo(f.dist / f.speed, 9);
    expect(f.dist).toBeGreaterThan(280);
    expect(f.dist).toBeLessThan(300);
  });

  it("scatters around the aim point with the documented σ (seeded)", () => {
    const rng = createRng(2026);
    const n = 6000;
    const xs: number[] = [];
    let sigma = 0;
    for (let i = 0; i < n; i++) {
      const f = computeShot({ ...input, power: 60 }, rng);
      xs.push(f.tx - f.aimTx);
      sigma = f.sigma;
    }
    const mean = xs.reduce((a, b) => a + b, 0) / n;
    const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
    expect(Math.abs(mean)).toBeLessThan(sigma * 0.06);
    expect(sd).toBeGreaterThan(sigma * 0.95);
    expect(sd).toBeLessThan(sigma * 1.05);
  });

  it("the same seed gives the same kick", () => {
    expect(computeShot(input, createRng(5))).toEqual(computeShot(input, createRng(5)));
  });

  it("an overhit kick sails over the bar", () => {
    const f = computeShot({ ...input, power: 100 }, createRng(3));
    expect(f.kind === "over" || f.kind === "wide" || f.kind === "post").toBe(true);
  });
});

describe("flight arc", () => {
  it("starts on the ground, ends at h, lobs higher with power", () => {
    const soft = { h: 20, dist: 300, power: 20 };
    const hard = { h: 60, dist: 300, power: 90 };
    expect(flightHeight(soft, 0)).toBe(0);
    expect(flightHeight(soft, 1)).toBeCloseTo(20, 9);
    expect(flightHeight(hard, 1)).toBeCloseTo(60, 9);
    const peak = (f: typeof soft) => Math.max(...Array.from({ length: 101 }, (_, i) => flightHeight(f, i / 100)));
    expect(peak(hard)).toBeGreaterThan(peak(soft));
    // a soft shot stays close to the grass
    expect(peak(soft)).toBeLessThan(45);
  });
});
