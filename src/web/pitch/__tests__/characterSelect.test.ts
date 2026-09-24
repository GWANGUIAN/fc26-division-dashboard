import { describe, expect, it, vi } from "vitest";
import { CharacterSelectScene, PREVIEW_DWELL_SECONDS, SELECT_CONFIRM_BUTTON } from "../scenes/CharacterSelectScene";
import { PitchScene } from "../scenes/PitchScene";
import { cardRect } from "../scenes/selectGrid";
import type { PitchCharacter } from "../data/characters";
import type { AssetGroupName, LoadGroupResult } from "../engine/assets";
import type { SceneCtx } from "../engine/sceneManager";

const DT = 1 / 60;
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

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

interface Deferred {
  group: AssetGroupName;
  resolve(result?: Partial<LoadGroupResult>): void;
  reject(error: unknown): void;
}

/** Assets whose `loadGroup` calls stay pending until the test settles them. */
function makeAssets() {
  const loaded = new Set<string>();
  const pendingLoads: Deferred[] = [];
  const released: AssetGroupName[] = [];
  const assets = {
    get: (key: string) => (loaded.has(key) ? { width: 96, height: 96 } : undefined),
    has: (key: string) => loaded.has(key),
    loadGroup: (group: AssetGroupName) =>
      new Promise<LoadGroupResult>((resolve, reject) => {
        pendingLoads.push({
          group,
          resolve: (result = {}) => {
            const value = { loaded: [], failed: [], missing: [], ...result };
            if (group.startsWith("char:") && value.failed.length === 0 && value.missing.length === 0) loaded.add(`characters/${group.slice(5)}-atlas`);
            resolve(value);
          },
          reject,
        });
      }),
    release: (group: AssetGroupName) => void released.push(group),
    dispose: () => undefined,
  };
  return { assets, pendingLoads, released, loaded };
}

function makeSelect(currentId = "woowakgood") {
  const env = makeAssets();
  const popped = vi.fn();
  const played: string[] = [];
  const files: string[] = [];
  const applied: PitchCharacter[] = [];
  const save = vi.fn();
  const ctx = {
    width: 960,
    height: 540,
    manager: { transitionProgress: null, pop: popped, push: vi.fn() },
    host: {
      assets: env.assets,
      input: { isDown: () => false },
      hasKeyboardFocus: () => true,
      goDashboard: vi.fn(),
      setCursor: () => undefined,
      audio: { playSfx: (id: string) => void played.push(id), playFile: (url: string) => void files.push(url), playBgm: () => undefined, stopSfx: () => undefined, setSettings: () => undefined },
    },
  } as unknown as SceneCtx;
  const scene = new CharacterSelectScene({ currentId, onApply: (c) => applied.push(c), save });
  scene.enter(ctx);
  return { scene, ctx, popped, played, files, applied, save, ...env };
}

const key = (scene: CharacterSelectScene, code: string) => scene.onKey({ code });
const center = (index: number) => {
  const r = cardRect(index);
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
};

describe("CharacterSelectScene (P5)", () => {
  it("starts on the current character, loads the select group lazily and renders without assets", () => {
    const { scene, pendingLoads } = makeSelect("janine95kim");
    expect(pendingLoads.map((p) => p.group)).toEqual(["select"]);
    expect(() => {
      scene.update(DT);
      scene.render(fakeGraphics());
    }).not.toThrow();
  });

  it("moves the cursor with the arrow keys and plays the cursor sound", () => {
    const { scene, played } = makeSelect();
    key(scene, "ArrowRight");
    key(scene, "ArrowDown");
    expect(played.filter((id) => id === "ui-cursor")).toHaveLength(2);
    // cursor now on card 7 (col 1, row 1): Enter starts loading exactly that character
    key(scene, "Enter");
    expect(played.at(-1)).toBe("ui-select");
  });

  it("Esc and Tab close without changing anything", () => {
    for (const code of ["Escape", "Tab"]) {
      const { scene, popped, applied, save, played } = makeSelect();
      key(scene, code);
      expect(popped).toHaveBeenCalledTimes(1);
      expect(applied).toHaveLength(0);
      expect(save).not.toHaveBeenCalled();
      expect(played.at(-1)).toBe("ui-back");
    }
  });

  it("confirming the character already in use just closes", () => {
    const { scene, popped, applied, pendingLoads } = makeSelect("woowakgood");
    key(scene, "Enter");
    expect(popped).toHaveBeenCalledTimes(1);
    expect(applied).toHaveLength(0);
    expect(pendingLoads.filter((p) => p.group.startsWith("char:"))).toHaveLength(0);
  });

  it("confirm loads char:<id> first, then saves, applies, frees the old group and closes", async () => {
    const { scene, popped, applied, save, pendingLoads, released } = makeSelect("woowakgood");
    key(scene, "ArrowRight");
    key(scene, "Enter");
    const load = pendingLoads.find((p) => p.group === "char:janine95kim")!;
    expect(load).toBeDefined();
    // nothing happens while the group is still loading
    expect(save).not.toHaveBeenCalled();
    expect(applied).toHaveLength(0);
    expect(() => scene.render(fakeGraphics())).not.toThrow();
    load.resolve();
    await flush();
    expect(save).toHaveBeenCalledWith("janine95kim");
    expect(applied.map((c) => c.id)).toEqual(["janine95kim"]);
    expect(released).toContain("char:woowakgood");
    expect(popped).toHaveBeenCalledTimes(1);
  });

  it("a failed load keeps the current character: nothing saved or applied, the overlay stays open", async () => {
    const { scene, popped, applied, save, pendingLoads, released } = makeSelect("woowakgood");
    key(scene, "ArrowRight");
    key(scene, "Enter");
    pendingLoads.find((p) => p.group === "char:janine95kim")!.resolve({ failed: ["characters/janine95kim-atlas"] });
    await flush();
    expect(save).not.toHaveBeenCalled();
    expect(applied).toHaveLength(0);
    expect(popped).not.toHaveBeenCalled();
    expect(released).toContain("char:janine95kim");
    expect(released).not.toContain("char:woowakgood");
    // the message shows, and another try is possible
    expect(() => scene.render(fakeGraphics())).not.toThrow();
    key(scene, "Enter");
    expect(pendingLoads.filter((p) => p.group === "char:janine95kim")).toHaveLength(2);
  });

  it("a load that resolves without the atlas file (missing) counts as a failure", async () => {
    const { scene, applied, save, pendingLoads } = makeSelect("woowakgood");
    key(scene, "ArrowRight");
    key(scene, "Enter");
    // resolved without any failure, but the atlas file does not exist so nothing landed in the store
    pendingLoads.find((p) => p.group === "char:janine95kim")!.resolve({ missing: ["characters/janine95kim-atlas"] });
    await flush();
    expect(applied).toHaveLength(0);
    expect(save).not.toHaveBeenCalled();
  });

  it("a rejected load is a failure too", async () => {
    const { scene, applied, save, pendingLoads } = makeSelect("woowakgood");
    key(scene, "ArrowRight");
    key(scene, "Enter");
    pendingLoads.find((p) => p.group === "char:janine95kim")!.reject(new Error("network"));
    await flush();
    expect(applied).toHaveLength(0);
    expect(save).not.toHaveBeenCalled();
  });

  it("cancelling while a load runs ignores its result", async () => {
    const { scene, popped, applied, save, pendingLoads, released } = makeSelect("woowakgood");
    key(scene, "ArrowRight");
    key(scene, "Enter");
    key(scene, "Escape");
    expect(popped).toHaveBeenCalledTimes(1);
    pendingLoads.find((p) => p.group === "char:janine95kim")!.resolve();
    await flush();
    expect(applied).toHaveLength(0);
    expect(save).not.toHaveBeenCalled();
    expect(released).toContain("char:janine95kim");
  });

  it("arrow keys are ignored while a load is pending", () => {
    const { scene, played } = makeSelect("woowakgood");
    key(scene, "ArrowRight");
    key(scene, "Enter");
    const cursorSounds = played.filter((id) => id === "ui-cursor").length;
    key(scene, "ArrowRight");
    expect(played.filter((id) => id === "ui-cursor")).toHaveLength(cursorSounds);
  });

  it("hovering does not move the cursor, a click selects it, a double click confirms", () => {
    const { scene, pendingLoads, played, files } = makeSelect("woowakgood");
    const { x, y } = center(3);
    scene.onPointer({ type: "move", x, y });
    expect(played).not.toContain("ui-cursor");
    scene.onPointer({ type: "down", x, y });
    scene.onPointer({ type: "up", x, y });
    expect(played).toContain("ui-cursor");
    expect(files).toHaveLength(0);
    expect(pendingLoads.some((p) => p.group.startsWith("char:"))).toBe(false);
    scene.onPointer({ type: "down", x, y });
    scene.onPointer({ type: "up", x, y });
    expect(pendingLoads.some((p) => p.group === "char:sjh4018")).toBe(true);
    expect(files).toEqual(["/sfxes/pinggu.mp3"]);
  });

  it("confirming plays the character's own sound, also when it is already in use", () => {
    const { scene, files } = makeSelect("woowakgood");
    key(scene, "Enter");
    expect(files).toEqual(["/sfxes/woowakgood.mp3"]);
  });

  it("the confirm button loads the cursor character; the dashboard button stays available", () => {
    const { scene, ctx, pendingLoads } = makeSelect("woowakgood");
    const c = center(1);
    scene.onPointer({ type: "down", x: c.x, y: c.y });
    scene.onPointer({ type: "up", x: c.x, y: c.y });
    const b = SELECT_CONFIRM_BUTTON;
    const at = { x: b.x + 10, y: b.y + 10 };
    scene.onPointer({ type: "move", ...at });
    scene.onPointer({ type: "down", ...at });
    scene.onPointer({ type: "up", ...at });
    expect(pendingLoads.some((p) => p.group === "char:janine95kim")).toBe(true);

    const dash = { x: 740, y: 30 };
    scene.onPointer({ type: "move", ...dash });
    scene.onPointer({ type: "down", ...dash });
    scene.onPointer({ type: "up", ...dash });
    expect(ctx.host.goDashboard).toHaveBeenCalledTimes(1);
  });

  it("fetches the cursor character's atlas for the run preview only after a short rest", () => {
    const { scene, pendingLoads } = makeSelect("woowakgood");
    key(scene, "ArrowRight");
    for (let i = 0; i < Math.floor(PREVIEW_DWELL_SECONDS / DT) - 2; i++) scene.update(DT);
    expect(pendingLoads.some((p) => p.group.startsWith("char:"))).toBe(false);
    for (let i = 0; i < 6; i++) scene.update(DT);
    expect(pendingLoads.filter((p) => p.group === "char:janine95kim")).toHaveLength(1);
  });

  it("closing frees the select group and any preview groups but keeps the active character", async () => {
    const { scene, pendingLoads, released } = makeSelect("woowakgood");
    key(scene, "ArrowRight");
    for (let i = 0; i < 20; i++) scene.update(DT);
    pendingLoads.find((p) => p.group === "char:janine95kim")!.resolve();
    await flush();
    scene.exit();
    expect(released).toContain("select");
    expect(released).toContain("char:janine95kim");
    expect(released).not.toContain("char:woowakgood");
  });
});

describe("PitchScene ↔ select (P5)", () => {
  function makePitch() {
    const push = vi.fn();
    const ctx = {
      width: 960,
      height: 540,
      manager: { transitionProgress: null, push },
      host: {
        assets: { get: () => undefined, has: () => false },
        input: { isDown: () => false },
        hasKeyboardFocus: () => true,
        goDashboard: () => undefined,
        setCursor: () => undefined,
      },
    } as unknown as SceneCtx;
    const scene = new PitchScene();
    scene.enter(ctx);
    return { scene, push };
  }

  it("Tab and the change button push the select overlay", () => {
    const { scene, push } = makePitch();
    scene.onKey({ code: "Tab" });
    expect(push).toHaveBeenCalledTimes(1);
    expect(push.mock.calls[0]![0]).toBeInstanceOf(CharacterSelectScene);
    scene.onPointer({ type: "move", x: 800, y: 90 });
    scene.onPointer({ type: "down", x: 800, y: 90 });
    scene.onPointer({ type: "up", x: 800, y: 90 });
    expect(push).toHaveBeenCalledTimes(2);
  });

  it("setCharacter swaps the sprite owner and resets ball, keeper and skills but not the score", () => {
    const { scene } = makePitch();
    const internals = scene as unknown as { character: PitchCharacter; match: { goals: number }; player: { x: number } };
    internals.match.goals = 3;
    internals.player.x = 700;
    scene.setCharacter({ id: "lina0108", name: "리냐", positionLabel: "풀백", position: "FB", themeColor: "#ff6b8a", sfx: "/sfxes/linya.mp3" });
    expect(internals.character.id).toBe("lina0108");
    expect(internals.match.goals).toBe(3);
    expect(internals.player.x).not.toBe(700);
  });
});
