import { describe, expect, it } from "vitest";
import { PitchScene } from "../scenes/PitchScene";
import type { SceneCtx } from "../engine/sceneManager";
import type { BallState } from "../game/ball";
import type { MatchState } from "../game/match";
import type { PlayerState } from "../game/player";
import type { ShotState } from "../game/shot";
import { SPAWN } from "../game/tuning";

const DT = 1 / 60;

interface SceneInternals {
  ball: BallState;
  player: PlayerState;
  shot: ShotState;
  match: MatchState;
  tooFarAge: number;
}

/** A recording stand-in for CanvasRenderingContext2D: every method is a no-op, every property settable. */
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

function makeScene(withAssets = false) {
  const held = new Set<string>();
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
    },
  } as unknown as SceneCtx;
  const scene = new PitchScene();
  scene.enter(ctx);
  return { scene, internals: scene as unknown as SceneInternals, held };
}

function frames(scene: PitchScene, n: number) {
  for (let i = 0; i < n; i++) scene.update(DT);
}

const space = (scene: PitchScene) => scene.onKey({ code: "Space" });

describe("PitchScene shot loop (P3)", () => {
  it("Space ×3 fires a shot, scores it, runs the 2.0s result and resets the pitch", () => {
    const { scene, internals } = makeScene();
    scene.setRng(7);
    space(scene);
    expect(internals.shot.phase).toBe("aim");
    frames(scene, 10);
    space(scene);
    expect(internals.shot.phase).toBe("power");
    frames(scene, 45);
    space(scene);
    expect(internals.shot.phase).toBe("released");
    expect(internals.match.phase).toBe("flight");
    expect(internals.ball.mode).toBe("shot");
    expect(internals.match.shots).toBe(1);

    // the flight takes well under a second
    let guard = 0;
    while (internals.match.phase === "flight" && guard++ < 120) frames(scene, 1);
    expect(internals.match.phase).toBe("result");
    const { goals, saves, streak } = internals.match;
    expect(goals + saves + (internals.match.result?.outcome === "POST" || internals.match.result?.outcome === "BAR" || internals.match.result?.outcome === "MISS" ? 1 : 0)).toBe(1);
    expect(streak).toBe(goals);

    // 2.0s result + 0.3s fade later everything is back at the spawn
    frames(scene, Math.ceil(2.4 / DT));
    expect(internals.match.phase).toBe("play");
    expect(internals.shot.phase).toBe("idle");
    expect(internals.ball.mode).toBe("carried");
    expect(internals.ball.x).toBe(SPAWN.x);
    expect(internals.player.x).toBe(SPAWN.x);
    expect(internals.player.y).toBe(SPAWN.y);
  });

  it("freezes the player while aiming even with a direction key held", () => {
    const { scene, internals, held } = makeScene();
    space(scene);
    held.add("ArrowLeft");
    frames(scene, 30);
    expect(internals.player.x).toBe(SPAWN.x);
    scene.onKey({ code: "Escape" });
    expect(internals.shot.phase).toBe("idle");
    frames(scene, 30);
    expect(internals.player.x).toBeLessThan(SPAWN.x);
  });

  it("cancels an aim on Esc and on the 3s timeout without losing the ball", () => {
    const { scene, internals } = makeScene();
    space(scene);
    scene.onKey({ code: "Escape" });
    expect(internals.shot.phase).toBe("idle");
    space(scene);
    frames(scene, Math.ceil(3.1 / DT));
    expect(internals.shot.phase).toBe("idle");
    expect(internals.ball.mode).toBe("carried");
    expect(internals.match.shots).toBe(0);
  });

  it("refuses a shot from beyond 520px of the goal (TOO FAR) and when the ball is loose", () => {
    const { scene, internals } = makeScene();
    internals.ball.x = 40;
    internals.ball.y = 510;
    internals.tooFarAge = 5;
    space(scene);
    expect(internals.shot.phase).toBe("idle");
    expect(internals.tooFarAge).toBe(0);

    internals.ball.x = SPAWN.x;
    internals.ball.y = SPAWN.y;
    internals.ball.mode = "loose";
    space(scene);
    expect(internals.shot.phase).toBe("idle");
  });

  it("R abandons a shot in flight", () => {
    const { scene, internals } = makeScene();
    space(scene);
    frames(scene, 5);
    space(scene);
    frames(scene, 20);
    space(scene);
    expect(internals.match.phase).toBe("flight");
    scene.onKey({ code: "KeyR" });
    expect(internals.match.phase).toBe("play");
    expect(internals.ball.mode).toBe("carried");
    expect(internals.shot.phase).toBe("idle");
  });

  it("plays many shots without breaking, and the streak only counts consecutive goals", () => {
    const { scene, internals } = makeScene();
    scene.setRng(123);
    let goals = 0;
    for (let i = 0; i < 60; i++) {
      space(scene);
      frames(scene, 3 + (i % 25));
      space(scene);
      frames(scene, 5 + ((i * 7) % 50));
      space(scene);
      let guard = 0;
      while (internals.match.phase !== "play" && guard++ < 600) frames(scene, 1);
      expect(internals.match.phase).toBe("play");
      goals = internals.match.goals;
    }
    expect(internals.match.shots).toBe(60);
    expect(goals + internals.match.saves).toBeLessThanOrEqual(60);
    expect(internals.match.bestStreak).toBeGreaterThanOrEqual(internals.match.streak);
    expect(goals).toBeGreaterThan(5);
    expect(internals.match.saves).toBeGreaterThan(5);
  });
});

describe("PitchScene rendering during a shot (no assets / with assets)", () => {
  for (const withAssets of [false, true]) {
    it(`draws every shot state without throwing (${withAssets ? "images" : "placeholders"})`, () => {
      const { scene } = makeScene(withAssets);
      scene.setRng(11);
      const g = fakeGraphics();
      const draw = (n: number) => {
        for (let i = 0; i < n; i++) {
          scene.update(DT);
          scene.render(g);
        }
      };
      draw(5);
      space(scene);
      draw(20);
      space(scene);
      draw(30);
      space(scene);
      draw(240);
      // a couple more full shots so different outcomes get drawn
      for (let shot = 0; shot < 8; shot++) {
        space(scene);
        draw(4 + shot * 3);
        space(scene);
        draw(10 + shot * 9);
        space(scene);
        draw(200);
      }
    });
  }
});
