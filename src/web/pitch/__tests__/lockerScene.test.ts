import { afterEach, describe, expect, it, vi } from "vitest";
import type { PitchAudioLike } from "../audio/pitchAudio";
import type { PitchSfxId } from "../audio/sfxMap";
import type { Scene, SceneCtx } from "../engine/sceneManager";
import { GATE, GATE_SPAWN } from "../game/locker";
import { LockerScene } from "../scenes/LockerScene";
import { PitchScene } from "../scenes/PitchScene";
import { StatScene } from "../scenes/StatScene";
import { STAT_AXIS_COUNT } from "../data/stats";
import { getCharacter } from "../data/characters";

const DT = 1 / 60;

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

interface Pushed {
  replaced: Array<{ scene: Scene; params: unknown; transition?: string }>;
  pushed: Scene[];
  popped: number;
}

function makeCtx() {
  const held = new Set<string>();
  const events: string[] = [];
  const announced: string[] = [];
  const log: Pushed = { replaced: [], pushed: [], popped: 0 };
  const audio: PitchAudioLike = {
    playBgm: (id) => void events.push(`bgm:${id}`),
    playSfx: (id: PitchSfxId) => void events.push(id),
    stopSfx: (id: PitchSfxId) => void events.push(`stop:${id}`),
    setSettings: () => undefined,
  };
  const loaded: string[] = [];
  const ctx = {
    width: 960,
    height: 540,
    manager: {
      transitionProgress: null,
      replace: (scene: Scene, params: unknown, options?: { transition?: string }) => void log.replaced.push({ scene, params, transition: options?.transition }),
      push: (scene: Scene) => void log.pushed.push(scene),
      pop: () => void log.popped++,
    },
    host: {
      assets: {
        get: () => undefined,
        has: () => false,
        loadGroup: (group: string) => {
          loaded.push(group);
          return Promise.resolve({ loaded: [], failed: [], missing: [] });
        },
      },
      input: { isDown: (code: string) => held.has(code) },
      hasKeyboardFocus: () => true,
      goDashboard: () => events.push("dashboard"),
      setCursor: () => undefined,
      audio,
      reducedMotion: () => false,
      announce: (text: string) => void announced.push(text),
    },
  } as unknown as SceneCtx;
  return { ctx, held, events, announced, log, loaded };
}

const run = (scene: Scene, n: number) => {
  for (let i = 0; i < n; i++) scene.update(DT);
};

interface PitchInternals {
  player: { x: number; y: number; fx: number; fy: number };
  ball: { x: number; y: number; mode: string };
  match: { goals: number; saves: number; streak: number; bestStreak: number; shots: number; phase: string };
  hintsVisible: boolean;
  gateNear: boolean;
}
const pitch = (scene: PitchScene) => scene as unknown as PitchInternals;

afterEach(() => vi.restoreAllMocks());

describe("PitchScene locker-room gate", () => {
  const setup = (x: number, y: number) => {
    const env = makeCtx();
    const scene = new PitchScene();
    scene.enter(env.ctx);
    pitch(scene).player.x = x;
    pitch(scene).player.y = y;
    pitch(scene).ball.x = x + 28;
    pitch(scene).ball.y = y;
    run(scene, 2);
    return { ...env, scene };
  };

  it("does nothing on E away from the gate", () => {
    const { scene, log } = setup(480, 440);
    scene.onKey({ code: "KeyE" });
    expect(log.replaced).toHaveLength(0);
  });

  it("wipes into the locker room on E or Enter within 70px of the gate centre", () => {
    for (const code of ["KeyE", "Enter"]) {
      const { scene, log, events } = setup(GATE.centerX + 60, GATE.centerY);
      expect(pitch(scene).gateNear).toBe(true);
      scene.onKey({ code });
      expect(log.replaced).toHaveLength(1);
      expect(log.replaced[0]!.scene).toBeInstanceOf(LockerScene);
      expect(log.replaced[0]!.transition).toBe("wipe");
      expect(events).toContain("gate-open");
    }
  });

  it("does not enter just outside the prompt radius", () => {
    const { scene, log } = setup(GATE.centerX + 75, GATE.centerY);
    scene.onKey({ code: "KeyE" });
    expect(log.replaced).toHaveLength(0);
  });

  it("preloads the locker group once when the player comes within 200px", () => {
    const far = setup(480, 440);
    expect(far.loaded).toHaveLength(0);
    const near = setup(GATE.centerX + 150, GATE.centerY);
    expect(near.loaded).toEqual(["locker"]);
    run(near.scene, 30);
    expect(near.loaded).toEqual(["locker"]);
  });

  it("ignores E while a skill move is running", () => {
    const { scene, log } = setup(GATE.centerX + 60, GATE.centerY);
    scene.onKey({ code: "KeyZ" }); // a skill move is running → no gate entry
    scene.onKey({ code: "KeyE" });
    expect(log.replaced).toHaveLength(0);
  });

  it("carries the score through the locker room and spawns at (170, 470) with the ball at the feet", () => {
    const { scene, log } = setup(GATE.centerX + 60, GATE.centerY);
    const m = pitch(scene).match;
    m.goals = 3;
    m.saves = 2;
    m.streak = 2;
    m.bestStreak = 3;
    m.shots = 5;
    pitch(scene).hintsVisible = false;
    scene.onKey({ code: "KeyE" });
    const locker = log.replaced[0]!.scene as LockerScene;
    const env = makeCtx();
    locker.enter(env.ctx);
    // leaving: the locker asks the manager for a fresh pitch
    const back = (log.replaced[0]!.scene as unknown as { params: { createPitch(): Scene } }).params.createPitch();
    expect(back).toBeInstanceOf(PitchScene);
    const arrive = makeCtx();
    back.enter?.(arrive.ctx, { fromLocker: true });
    const next = pitch(back as PitchScene);
    expect(next.player.x).toBe(GATE_SPAWN.x);
    expect(next.player.y).toBe(GATE_SPAWN.y);
    expect(next.ball.mode).toBe("carried");
    expect(next.ball.y).toBe(GATE_SPAWN.y);
    expect(next.match).toMatchObject({ goals: 3, saves: 2, streak: 2, bestStreak: 3, shots: 5 });
    expect(next.hintsVisible).toBe(false);
  });

  it("starts a normal visit at the usual spawn with a zero score", () => {
    const { scene } = setup(480, 440);
    expect(pitch(scene).match.goals).toBe(0);
    expect(pitch(scene).player.x).toBe(480);
  });

  it("renders without assets", () => {
    const { scene } = setup(GATE.centerX + 60, GATE.centerY);
    expect(() => scene.render(fakeGraphics())).not.toThrow();
  });
});

describe("LockerScene", () => {
  const setup = () => {
    const env = makeCtx();
    const factory = vi.fn(() => new PitchScene());
    const scene = new LockerScene({ createPitch: factory });
    scene.enter(env.ctx);
    return { ...env, scene, factory, player: () => (scene as unknown as { player: { x: number; y: number } }).player };
  };

  it("enters at (480, 450) with the locker music and a closing door, and loads its group", () => {
    const { scene, events, loaded, player } = setup();
    expect(player()).toMatchObject({ x: 480, y: 450 });
    expect(events).toEqual(expect.arrayContaining(["bgm:locker", "gate-close"]));
    expect(loaded).toEqual(["locker"]);
    expect(() => scene.render(fakeGraphics())).not.toThrow();
  });

  it("moves with the arrow keys and stops at the room's edge", () => {
    const { scene, held, player } = setup();
    held.add("ArrowUp");
    run(scene, 400);
    expect(player().y).toBe(250);
  });

  it("leaves on E at the exit door, wiping to a new pitch flagged fromLocker", () => {
    const { scene, log, events } = setup();
    expect(scene.interaction()).toBe("exit");
    scene.onKey({ code: "KeyE" });
    expect(log.replaced).toHaveLength(1);
    expect(log.replaced[0]!.params).toEqual({ fromLocker: true });
    expect(log.replaced[0]!.transition).toBe("wipe");
    expect(events).toContain("gate-open");
    // a second press while leaving does nothing
    scene.onKey({ code: "KeyE" });
    expect(log.replaced).toHaveLength(1);
  });

  it("leaves on Esc from anywhere", () => {
    const { scene, log, held } = setup();
    held.add("ArrowUp");
    run(scene, 200);
    expect(scene.interaction()).toBeNull();
    scene.onKey({ code: "Escape" });
    expect(log.replaced).toHaveLength(1);
  });

  it("opens the stat screen on E next to the analyzer and lights it while open", () => {
    const { scene, log, player } = setup();
    Object.assign(player(), { x: 712, y: 430 });
    expect(scene.interaction()).toBe("analyzer");
    run(scene, 60);
    expect(scene.analyzerState()).toBe("idle");
    scene.onKey({ code: "Enter" });
    expect(log.pushed).toHaveLength(1);
    expect(log.pushed[0]).toBeInstanceOf(StatScene);
    expect(scene.analyzerState()).toBe("active");
    expect(scene.interaction()).toBeNull();
    (log.pushed[0] as StatScene).exit();
    expect(scene.analyzerState()).toBe("active");
    run(scene, 30);
    expect(scene.analyzerState()).toBe("idle");
  });

  it("starts with the analyzer powered off", () => {
    const { scene } = setup();
    expect(scene.analyzerState()).toBe("off");
  });

  it("opens the character picker on Tab and the dashboard from its button", () => {
    const { scene, log, events } = setup();
    scene.onKey({ code: "Tab" });
    expect(log.pushed).toHaveLength(1);
    scene.onPointer({ type: "move", x: 800, y: 40 });
    scene.onPointer({ type: "down", x: 800, y: 40 });
    scene.onPointer({ type: "up", x: 800, y: 40 });
    expect(events).toContain("dashboard");
  });

  it("toggles the sound from its button", () => {
    const { scene, events } = setup();
    scene.onPointer({ type: "down", x: 700, y: 40 });
    scene.onPointer({ type: "up", x: 700, y: 40 });
    expect(events).toContain("ui-click");
  });
});

describe("StatScene", () => {
  const setup = (characterId = "woowakgood") => {
    const env = makeCtx();
    const closed = vi.fn();
    const scene = new StatScene({ character: getCharacter(characterId), onClose: closed });
    scene.enter(env.ctx);
    return { ...env, scene, closed };
  };

  it("selects the top axis by default and says so for screen readers", () => {
    const { scene, announced, events } = setup();
    expect(scene.selectedAxis).toBe(0);
    expect(events).toContain("stat-on");
    expect(announced[0]).toContain("선택한 스탯 1/6: ???");
    expect(scene.announcement()).toBe("선택한 스탯 1/6: ??? — ???. 능력치: 미정");
  });

  it("announces the name, description, criteria, detail items and the undecided number", () => {
    const { scene } = setup("janine95kim");
    expect(scene.announcement()).toBe("선택한 스탯 1/6: 위치 선정 — 애초에 위치를 잘 잡고 있는지. 능력치: 미정");
    const st = setup("ju010228").scene;
    expect(st.announcement()).toContain("선택한 스탯 1/6: 위치선정 — 전술적으로 올바른 위치에 서 있는 능력.");
    expect(st.announcement()).toContain("판정 기준: 플러스 전술적으로 위치했을 경우, 마이너스 위치하지 못했을 경우.");
    expect(st.announcement()).toContain("세부 항목: 수비 오프더 볼 위치선정, 공격 오프더 볼 위치선정, 스위칭 판단.");
    expect(st.announcement().endsWith("능력치: 미정")).toBe(true);
  });

  it("scrolls with the wheel and ↑↓, clamped, and resets when the axis changes", () => {
    const { scene } = setup("ju010228");
    expect(scene.scrollOffset).toBe(0);
    scene.onWheel(120);
    scene.onKey({ code: "ArrowDown" });
    expect(scene.scrollOffset).toBe(scene.scrollMax);
    scene.onWheel(-120);
    expect(scene.scrollOffset).toBe(Math.max(0, scene.scrollMax - 20));
    scene.onKey({ code: "ArrowRight" });
    expect(scene.scrollOffset).toBe(0);
    expect(scene.selectedAxis).toBe(1);
  });

  it("moves the selection clockwise with → and Tab, counter-clockwise with ←, wrapping", () => {
    const { scene, announced } = setup();
    scene.onKey({ code: "ArrowRight" });
    expect(scene.selectedAxis).toBe(1);
    scene.onKey({ code: "Tab" });
    expect(scene.selectedAxis).toBe(2);
    scene.onKey({ code: "ArrowLeft" });
    scene.onKey({ code: "ArrowLeft" });
    scene.onKey({ code: "ArrowLeft" });
    expect(scene.selectedAxis).toBe(5);
    for (let i = 0; i < STAT_AXIS_COUNT; i++) scene.onKey({ code: "ArrowRight" });
    expect(scene.selectedAxis).toBe(5);
    expect(announced.at(-1)).toBe("선택한 스탯 6/6: ??? — ???. 능력치: 미정");
  });

  it("selects an axis by clicking its node", () => {
    const { scene, events } = setup();
    // corner 3 (bottom) is at (276, 430)
    scene.onPointer({ type: "move", x: 276, y: 430 });
    scene.onPointer({ type: "down", x: 276, y: 430 });
    scene.onPointer({ type: "up", x: 276, y: 430 });
    expect(scene.selectedAxis).toBe(3);
    expect(events).toContain("stat-select");
  });

  it("closes on Esc and reports it", () => {
    const { scene, log, closed } = setup();
    scene.onKey({ code: "Escape" });
    expect(log.popped).toBe(1);
    scene.exit();
    expect(closed).toHaveBeenCalled();
  });

  it("goes to the dashboard from its button", () => {
    const { scene, events } = setup();
    scene.onPointer({ type: "move", x: 800, y: 40 });
    scene.onPointer({ type: "down", x: 800, y: 40 });
    scene.onPointer({ type: "up", x: 800, y: 40 });
    expect(events).toContain("dashboard");
  });

  it("renders for every position without assets", () => {
    for (const id of ["woowakgood", "janine95kim", "bboringirl", "sjh4018", "doormomo", "hachi97", "ju010228", "tleod1818"]) {
      const { scene } = setup(id);
      run(scene, 10);
      expect(() => scene.render(fakeGraphics())).not.toThrow();
    }
  });
});

describe("StatScene player switcher", () => {
  const setup = () => {
    const env = makeCtx();
    const scene = new StatScene({ character: getCharacter("woowakgood") });
    scene.enter(env.ctx);
    return { ...env, scene };
  };

  it("switches to the next / previous roster player with Q / E, wrapping, and resets the axis", () => {
    const { scene, announced } = setup();
    scene.onKey({ code: "ArrowRight" });
    scene.onKey({ code: "KeyE" });
    expect(scene.viewedCharacter.id).toBe("janine95kim");
    expect(scene.selectedAxis).toBe(0);
    expect(announced.at(-1)).toContain("재닌");
    expect(announced.at(-1)).toContain("위치 선정");
    scene.onKey({ code: "KeyQ" });
    scene.onKey({ code: "KeyQ" });
    expect(scene.viewedCharacter.id).toBe("lina0108");
  });

  it("switches by clicking the arrows", () => {
    const { scene } = setup();
    scene.onPointer({ type: "move", x: 469, y: 85 });
    scene.onPointer({ type: "down", x: 469, y: 85 });
    scene.onPointer({ type: "up", x: 469, y: 85 });
    expect(scene.viewedCharacter.id).toBe("janine95kim");
  });
});
