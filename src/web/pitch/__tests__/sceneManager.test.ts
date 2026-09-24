import { describe, expect, it } from "vitest";
import type { PitchAssets } from "../engine/assets";
import {
  FADE_SECONDS,
  REDUCED_MOTION_FADE_SECONDS,
  WIPE_SECONDS,
  createSceneManager,
  type Scene,
  type SceneManager,
} from "../engine/sceneManager";

function makeScene(name: string, log: string[]): Scene & { keys: string[] } {
  const keys: string[] = [];
  return {
    keys,
    enter: () => void log.push(`enter:${name}`),
    exit: () => void log.push(`exit:${name}`),
    update: () => void log.push(`update:${name}`),
    render: () => void log.push(`render:${name}`),
    onKey: (e) => void keys.push(e.code),
  };
}

const host = {
  assets: {} as PitchAssets,
  input: { isDown: () => false },
  hasKeyboardFocus: () => true,
  goDashboard: () => {},
  setCursor: () => {},
};

function setup(reducedMotion = false) {
  const log: string[] = [];
  const manager = createSceneManager({ width: 960, height: 540, host, reducedMotion: () => reducedMotion });
  return { log, manager };
}

/** A context that records nothing: transitions call drawWipe/drawFade, which only need these methods. */
const stubGraphics = new Proxy({}, { get: () => () => {}, set: () => true }) as unknown as CanvasRenderingContext2D;

function run(manager: SceneManager, seconds: number, step = 1 / 60) {
  for (let t = 0; t < seconds; t += step) {
    manager.update(step);
    manager.render(stubGraphics);
  }
}

describe("stack", () => {
  it("first replace is instant and enters the scene", () => {
    const { log, manager } = setup();
    const a = makeScene("a", log);
    manager.replace(a);
    expect(manager.top).toBe(a);
    expect(manager.depth).toBe(1);
    expect(log).toEqual(["enter:a"]);
  });

  it("push/pop: only the top scene updates, every scene renders, pop exits the top", () => {
    const { log, manager } = setup();
    manager.replace(makeScene("base", log));
    manager.push(makeScene("overlay", log));
    log.length = 0;
    manager.update(1 / 60);
    manager.render(stubGraphics);
    expect(log).toEqual(["update:overlay", "render:base", "render:overlay"]);
    log.length = 0;
    manager.pop();
    expect(log).toEqual(["exit:overlay"]);
    expect(manager.depth).toBe(1);
  });

  it("never pops the last scene", () => {
    const { manager, log } = setup();
    manager.replace(makeScene("only", log));
    manager.pop();
    expect(manager.depth).toBe(1);
  });

  it("keys go to the top scene only", () => {
    const { log, manager } = setup();
    const base = makeScene("base", log);
    const overlay = makeScene("overlay", log);
    manager.replace(base);
    manager.push(overlay);
    manager.key("Enter");
    expect(overlay.keys).toEqual(["Enter"]);
    expect(base.keys).toEqual([]);
  });

  it("dispose exits the whole stack top-down", () => {
    const { log, manager } = setup();
    manager.replace(makeScene("base", log));
    manager.push(makeScene("overlay", log));
    log.length = 0;
    manager.dispose();
    expect(log).toEqual(["exit:overlay", "exit:base"]);
    expect(manager.depth).toBe(0);
  });
});

describe("replace transition", () => {
  it("swaps at the midpoint of the 0.35s wipe and blocks input while running", () => {
    const { log, manager } = setup();
    const a = makeScene("a", log);
    const b = makeScene("b", log);
    manager.replace(a);
    manager.replace(b);
    expect(manager.top).toBe(a);
    expect(manager.transitionProgress).toBe(0);
    manager.key("Enter");
    expect(a.keys).toEqual([]);

    run(manager, WIPE_SECONDS / 2 - 0.02);
    expect(manager.top).toBe(a);
    run(manager, 0.06);
    expect(manager.top).toBe(b);
    expect(log).toContain("exit:a");
    expect(manager.transitionProgress).not.toBeNull();

    run(manager, WIPE_SECONDS);
    expect(manager.transitionProgress).toBeNull();
    manager.key("Space");
    expect(b.keys).toEqual(["Space"]);
  });

  it("uses a 0.3s fade when asked", () => {
    const { log, manager } = setup();
    manager.replace(makeScene("a", log));
    manager.replace(makeScene("b", log), undefined, { transition: "fade" });
    run(manager, FADE_SECONDS - 0.05);
    expect(manager.transitionProgress).not.toBeNull();
    run(manager, 0.1);
    expect(manager.transitionProgress).toBeNull();
  });

  it("prefers-reduced-motion shortens every transition to a 0.1s fade", () => {
    const { log, manager } = setup(true);
    manager.replace(makeScene("a", log));
    manager.replace(makeScene("b", log));
    run(manager, REDUCED_MOTION_FADE_SECONDS + 0.05);
    expect(manager.transitionProgress).toBeNull();
    expect(log.some((line) => line === "enter:b")).toBe(true);
  });

  it("transition 'none' swaps immediately", () => {
    const { log, manager } = setup();
    manager.replace(makeScene("a", log));
    const b = makeScene("b", log);
    manager.replace(b, undefined, { transition: "none" });
    expect(manager.top).toBe(b);
    expect(manager.transitionProgress).toBeNull();
  });

  it("a second replace before the swap retargets the pending scene", () => {
    const { log, manager } = setup();
    manager.replace(makeScene("a", log));
    manager.replace(makeScene("b", log));
    const c = makeScene("c", log);
    manager.replace(c);
    run(manager, WIPE_SECONDS + 0.05);
    expect(manager.top).toBe(c);
    expect(log).not.toContain("enter:b");
  });

  it("replace clears an overlay stack", () => {
    const { log, manager } = setup();
    manager.replace(makeScene("base", log));
    manager.push(makeScene("overlay", log));
    manager.replace(makeScene("next", log), undefined, { transition: "none" });
    expect(manager.depth).toBe(1);
    expect(log).toContain("exit:overlay");
    expect(log).toContain("exit:base");
  });
});
