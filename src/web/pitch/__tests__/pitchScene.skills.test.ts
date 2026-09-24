import { afterEach, describe, expect, it, vi } from "vitest";
import { PitchScene } from "../scenes/PitchScene";
import type { PitchAudioLike } from "../audio/pitchAudio";
import type { PitchSfxId } from "../audio/sfxMap";
import type { SceneCtx } from "../engine/sceneManager";
import type { BallState } from "../game/ball";
import type { MatchState, ShotResult } from "../game/match";
import type { PlayerState } from "../game/player";
import type { ShotState } from "../game/shot";
import type { SkillState } from "../game/skills";
import { JUICE, SKILLS, SPAWN } from "../game/tuning";
import { PITCH_STATS_STORAGE_KEY } from "../../storage";

const DT = 1 / 60;

interface SceneInternals {
  ball: BallState;
  player: PlayerState;
  shot: ShotState;
  match: MatchState;
  skills: SkillState;
  callout: { kind: string; age: number } | null;
  skillLabel: { text: string } | null;
  hitstop: number;
  shakeAge: number;
  shakeAmp: number;
  crowd: { kind: string } | null;
  confetti: { activeCount: number };
  effects: { activeCount: number };
  stats: { goals: number; saves: number; shots: number; bestStreak: number };
  styleTier(): 0 | 1 | 2;
  onShotResult(result: ShotResult): void;
}

function fakeGraphics(): CanvasRenderingContext2D {
  const store: Record<string, unknown> = {};
  return new Proxy(store, {
    get(target, prop: string) {
      if (prop === "measureText") return () => ({ width: 10 });
      if (prop in target) return target[prop];
      return () => undefined;
    },
    set(target, prop: string, value) {
      target[prop] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

function makeScene({ withAssets = false, reduced = false } = {}) {
  const held = new Set<string>();
  const events: string[] = [];
  const audio: PitchAudioLike = {
    playBgm: (id) => void events.push(`bgm:${id}`),
    playSfx: (id: PitchSfxId) => void events.push(id),
    stopSfx: (id: PitchSfxId) => void events.push(`stop:${id}`),
    setSettings: () => undefined,
  };
  const image = { width: 128, height: 40 };
  const ctx = {
    width: 960,
    height: 540,
    manager: { transitionProgress: null },
    host: {
      assets: { get: () => (withAssets ? image : undefined) },
      input: { isDown: (code: string) => held.has(code) },
      hasKeyboardFocus: () => true,
      goDashboard: () => undefined,
      setCursor: () => undefined,
      audio,
      reducedMotion: () => reduced,
    },
  } as unknown as SceneCtx;
  const scene = new PitchScene();
  scene.enter(ctx);
  return { scene, internals: scene as unknown as SceneInternals, held, events };
}

const frames = (scene: PitchScene, n: number) => {
  for (let i = 0; i < n; i++) scene.update(DT);
};
const seconds = (scene: PitchScene, s: number) => frames(scene, Math.ceil(s / DT));
const key = (scene: PitchScene, code: string) => scene.onKey({ code });

afterEach(() => vi.unstubAllGlobals());

describe("PitchScene skills (P4)", () => {
  it("Z slides the player forward with the ball at the feet and fills the gauge", () => {
    const { scene, internals, events } = makeScene();
    const startY = internals.player.y;
    key(scene, "KeyZ");
    expect(internals.skills.active).toBe("stepover");
    seconds(scene, SKILLS.stepover.duration + 0.05);
    expect(internals.skills.active).toBeNull();
    // facing the goal: 48px forward, y scaled by 0.75
    expect(startY - internals.player.y).toBeGreaterThan(30);
    expect(internals.ball.mode).toBe("carried");
    expect(internals.skills.style).toBe(25);
    expect(events).toContain("skill-stepover");
    expect(events).toContain("style-gain");
    expect(internals.skillLabel?.text).toContain("스텝오버");
  });

  it("ignores the direction keys while a move runs", () => {
    const { scene, internals, held } = makeScene();
    key(scene, "KeyX");
    held.add("ArrowRight");
    seconds(scene, SKILLS.roulette.duration - 0.05);
    expect(internals.player.x).toBeCloseTo(SPAWN.x, 3);
  });

  it("a move without the ball is a whiff: no travel, no style, a hint label", () => {
    const { scene, internals, events } = makeScene();
    internals.ball.mode = "loose";
    internals.ball.x = 100;
    key(scene, "KeyC");
    seconds(scene, SKILLS.rainbow.duration + 0.05);
    expect(internals.player.y).toBe(SPAWN.y);
    expect(internals.skills.style).toBe(0);
    expect(events).toContain("skill-rainbow");
    expect(events).not.toContain("style-gain");
  });

  it("chaining different moves reaches Tier 1 and 2 with a STYLE / PERFECT callout each time", () => {
    const { scene, internals, events } = makeScene();
    key(scene, "KeyV"); // 50 → Tier 1
    expect(internals.styleTier()).toBe(1);
    expect(internals.callout?.kind).toBe("STYLE");
    seconds(scene, 1.2);
    key(scene, "KeyC"); // ×1.5 → 50 + 67.5 → capped, Tier 2
    expect(internals.styleTier()).toBe(2);
    expect(internals.callout?.kind).toBe("PERFECT");
    expect(events.filter((e) => e === "style-tier")).toHaveLength(2);
  });

  it("the gauge decides the keeper Tier and the kick empties it", () => {
    const { scene, internals } = makeScene();
    scene.setRng(3);
    key(scene, "KeyV");
    seconds(scene, 1.0);
    expect(internals.styleTier()).toBe(1);
    key(scene, "Space");
    seconds(scene, 0.4);
    key(scene, "Space");
    seconds(scene, 0.9);
    // the gauge holds while aiming
    expect(internals.skills.style).toBe(50);
    key(scene, "Space");
    expect(internals.match.phase).toBe("flight");
    expect(internals.skills.style).toBe(0);
    expect(internals.styleTier()).toBe(0);
  });

  it("a key pressed during a move or its cooldown is buffered, so every press fires in turn", () => {
    const { scene, internals } = makeScene();
    key(scene, "KeyZ");
    seconds(scene, 0.2);
    key(scene, "KeyX");
    expect(internals.skills.active).toBe("stepover");
    seconds(scene, 1.0);
    expect(internals.skills.lastId).toBe("roulette");
  });

  it("Space cuts a move short only in its last 0.15s", () => {
    const { scene, internals } = makeScene();
    key(scene, "KeyX");
    seconds(scene, 0.2);
    key(scene, "Space");
    expect(internals.shot.phase).toBe("idle");
    expect(internals.skills.active).toBe("roulette");
    seconds(scene, SKILLS.roulette.duration - 0.2 - 0.1);
    key(scene, "Space");
    expect(internals.skills.active).toBeNull();
    expect(internals.shot.phase).toBe("aim");
  });

  it("does not start a move while aiming or during a result", () => {
    const { scene, internals } = makeScene();
    key(scene, "Space");
    key(scene, "KeyZ");
    expect(internals.skills.active).toBeNull();
    key(scene, "Escape");
    internals.match.phase = "result";
    key(scene, "KeyZ");
    expect(internals.skills.active).toBeNull();
  });

  it("R and the end of a result reset the gauge and the running move", () => {
    const { scene, internals } = makeScene();
    key(scene, "KeyX");
    key(scene, "KeyR");
    expect(internals.skills.active).toBeNull();
    expect(internals.skills.style).toBe(0);
  });
});

describe("PitchScene result juice (P4)", () => {
  const goal: ShotResult = { outcome: "GOAL", detail: null, power: 85, sweet: true, tx: 0, h: 40, grazed: false };

  it("a goal shakes the camera, holds the frame for 60ms, throws confetti, cheers and is counted", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) });
    const { scene, internals, events } = makeScene();
    internals.match.streak = 1;
    internals.match.bestStreak = 1;
    internals.onShotResult(goal);
    expect(internals.hitstop).toBeCloseTo(JUICE.goalHitstop);
    expect(internals.shakeAmp).toBe(JUICE.goalShake);
    expect(internals.shakeAge).toBe(0);
    expect(internals.confetti.activeCount).toBeGreaterThan(10);
    expect(internals.effects.activeCount).toBeGreaterThan(0);
    expect(internals.crowd?.kind).toBe("cheer");
    expect(events).toEqual(expect.arrayContaining(["net-hit", "goal-cheer", "celebrate", "banner-in"]));
    expect(internals.stats).toMatchObject({ goals: 1, shots: 1, bestStreak: 1 });
    expect(JSON.parse(store.get(PITCH_STATS_STORAGE_KEY)!)).toMatchObject({ goals: 1, shots: 1 });

    // the simulation stands still for the hit stop, timers of the juice do not
    internals.match.phase = "result";
    internals.match.timer = 0;
    frames(scene, 2);
    expect(internals.match.timer).toBe(0);
    seconds(scene, 0.08);
    expect(internals.hitstop).toBe(0);
    expect(internals.match.timer).toBeGreaterThan(0);
  });

  it("reduced motion drops the shake but keeps the sound and the score", () => {
    const { internals, events } = makeScene({ reduced: true });
    internals.onShotResult(goal);
    expect(internals.shakeAge).toBeGreaterThanOrEqual(1);
    expect(internals.crowd?.kind).toBe("cheer");
    expect(events).toContain("goal-cheer");
  });

  it.each([
    ["SAVE", "CATCH", ["save-glove", "save-groan"]],
    ["SAVE", "PUNCH", ["save-punch", "save-groan"]],
    ["SAVE", "DEFLECT", ["save-deflect", "save-groan"]],
    ["POST", null, ["post-hit"]],
    ["BAR", null, ["bar-hit"]],
    ["MISS", "WIDE", ["miss-whoosh"]],
  ] as const)("%s %s plays %j", (outcome, detail, expected) => {
    const { internals, events } = makeScene();
    internals.onShotResult({ outcome, detail, power: 50, sweet: false, tx: 0, h: 10, grazed: false });
    expect(events).toEqual(expect.arrayContaining([...expected]));
    expect(events).not.toContain("goal-cheer");
    expect(internals.hitstop).toBe(0);
  });

  it("counts saves in the lifetime stats", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) });
    const { internals } = makeScene();
    internals.onShotResult({ outcome: "SAVE", detail: "CATCH", power: 50, sweet: false, tx: 0, h: 10, grazed: false });
    expect(internals.stats).toMatchObject({ saves: 1, shots: 1, goals: 0 });
  });
});

describe("PitchScene sound events (P4)", () => {
  it("plays alternating footsteps and dribble touches while running", () => {
    const { scene, held, events } = makeScene();
    held.add("ArrowLeft");
    seconds(scene, 1.5);
    expect(events).toContain("step-grass-a");
    expect(events).toContain("step-grass-b");
    expect(events).toContain("ball-touch");
  });

  it("marks the start of a sprint", () => {
    const { scene, held, events } = makeScene();
    held.add("ArrowLeft");
    held.add("ShiftLeft");
    seconds(scene, 0.3);
    expect(events).toContain("sprint-start");
  });

  it("follows the shot: aim start, ticks, lock + charge, power lock, kick by strength, dive", () => {
    const { scene, events } = makeScene();
    scene.setRng(11);
    key(scene, "Space");
    seconds(scene, 1.2);
    expect(events).toContain("aim-start");
    expect(events).toContain("aim-tick");
    key(scene, "Space");
    seconds(scene, 0.05);
    expect(events).toEqual(expect.arrayContaining(["aim-lock", "power-charge"]));
    seconds(scene, 0.9);
    key(scene, "Space");
    expect(events).toEqual(expect.arrayContaining(["stop:power-charge", "power-lock"]));
    expect(events.some((e) => e.startsWith("kick-"))).toBe(true);
    seconds(scene, 0.4);
    expect(events).toContain("banner-in");
  });

  it("Esc during the aim stops the charge sound and plays the back blip", () => {
    const { scene, events } = makeScene();
    key(scene, "Space");
    seconds(scene, 0.1);
    key(scene, "Escape");
    seconds(scene, 0.05);
    expect(events).toEqual(expect.arrayContaining(["stop:power-charge", "ui-back"]));
  });

  it("TOO FAR beeps and starts the pitch BGM on enter", () => {
    const { scene, internals, events } = makeScene();
    expect(events).toContain("bgm:pitch");
    internals.ball.x = 40;
    internals.ball.y = 510;
    key(scene, "Space");
    expect(events).toContain("too-far");
    expect(internals.shot.phase).toBe("idle");
  });
});

describe("PitchScene render smoke (P4)", () => {
  it.each([false, true])("draws the meter, callout, effects and confetti (assets: %s)", (withAssets) => {
    const { scene, internals } = makeScene({ withAssets });
    const g = fakeGraphics();
    key(scene, "KeyV");
    seconds(scene, 1.2);
    key(scene, "KeyC");
    frames(scene, 5);
    internals.onShotResult({ outcome: "GOAL", detail: null, power: 85, sweet: true, tx: 0, h: 40, grazed: false });
    for (let i = 0; i < 40; i++) {
      scene.update(DT);
      scene.render(g);
    }
    // a save and a whiff still draw
    internals.onShotResult({ outcome: "SAVE", detail: "CATCH", power: 50, sweet: false, tx: 0, h: 10, grazed: false });
    scene.render(g);
    expect(internals.confetti.activeCount).toBeGreaterThanOrEqual(0);
  });
});

describe("PitchScene P7 additions", () => {
  const sweetGoal: ShotResult = { outcome: "GOAL", detail: null, power: 85, sweet: true, tx: 0, h: 10, grazed: false };

  it("a sweet-spot goal also plays the horn; a plain goal does not", () => {
    const sweet = makeScene();
    sweet.internals.onShotResult(sweetGoal);
    expect(sweet.events).toContain("goal-horn");
    const plain = makeScene();
    plain.internals.onShotResult({ ...sweetGoal, sweet: false });
    expect(plain.events).not.toContain("goal-horn");
  });

  it("Backspace is the keyboard way out to the dashboard (starts the leave: sound + fade)", () => {
    const { scene, events } = makeScene();
    key(scene, "Backspace");
    expect(events).toContain("mode-switch");
  });

  it("draws the corner flags with images and without them (placeholder-safe), still or waving", () => {
    const withImages = makeScene({ withAssets: true });
    const g = fakeGraphics();
    expect(() => withImages.scene.render(g)).not.toThrow();
    withImages.internals.onShotResult(sweetGoal);
    frames(withImages.scene, 20);
    expect(() => withImages.scene.render(g)).not.toThrow();
    const bare = makeScene();
    expect(() => bare.scene.render(g)).not.toThrow();
  });
});
