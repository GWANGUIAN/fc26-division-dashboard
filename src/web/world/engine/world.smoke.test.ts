import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { allSceneIds } from "../data/maps";
import { createNewGameSave } from "../storage";
import type { SceneId } from "../types";
import { WorldAssets } from "../worldAssets";
import type { InteractTarget } from "./interaction";
import { createWorldEngine, type WorldEngine, type WorldEvents } from "./world";

// A headless run of the real engine: a recording fake canvas, fake image bitmaps and a hand-cranked
// requestAnimationFrame. It cannot judge how anything looks, but it does execute every update/render
// path (both scene kinds, doors, NPCs, interaction, debug overlay) so a typo or bad property access
// shows up here instead of in the browser.

type Listener = (event: Record<string, unknown>) => void;

function makeFakeContext() {
  const calls: string[] = [];
  const target: Record<string, unknown> = {
    measureText: (text: string) => ({ width: String(text).length * 6 }),
    getImageData: (_x: number, _y: number, w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
  };
  const ctx = new Proxy(target, {
    get(obj, prop: string) {
      if (prop in obj) return obj[prop];
      return (...args: unknown[]) => {
        calls.push(prop);
        void args;
      };
    },
    set(obj, prop: string, value) {
      obj[prop] = value;
      return true;
    },
  });
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
}

const bitmap = (width: number, height: number) => ({ width, height, close() {} }) as unknown as ImageBitmap;

function fakeAssets(): WorldAssets {
  const assets = new WorldAssets();
  const images = (assets as unknown as { images: Map<string, ImageBitmap> }).images;
  for (const sheet of ["core", "water", "spring", "frost", "industrial", "cloud", "weed", "pitch"]) images.set(`terrain/${sheet}`, bitmap(128, 128));
  images.set("terrain/core-withered", bitmap(128, 128));
  for (const id of ["tree-oak", "tree-pine", "bush-a", "lamp-post", "stone-arch"]) images.set(`props/${id}`, bitmap(96, 128));
  images.set("props/tree-oak-withered", bitmap(96, 128));
  images.set("buildings/clubhouse", bitmap(384, 256));
  images.set("characters/janine95kim-atlas", bitmap(192, 256));
  images.set("characters/elder-atlas", bitmap(192, 256));
  images.set("characters/cat-jandi-atlas", bitmap(128, 128));
  images.set("interiors/int-house-janine95kim", bitmap(640, 384));
  images.set("ui/tooltip-frame", bitmap(52, 32));
  return assets;
}

describe("world engine (headless smoke run)", () => {
  let listeners: Record<string, Listener[]>;
  let frames: ((now: number) => void)[];
  let now: number;
  let engine: WorldEngine;
  let scenes: SceneId[];
  let zones: string[];
  let interactions: InteractTarget[];
  let walked: number[];
  let logKeys: number;
  let sfx: string[];
  let store: { save: ReturnType<typeof createNewGameSave> };

  const dispatch = (type: string, code: string) => {
    for (const listener of listeners[type] ?? []) listener({ code, key: code, ctrlKey: false, altKey: false, metaKey: false, repeat: false, target: null, preventDefault() {}, stopPropagation() {} });
  };

  async function run(count: number) {
    for (let i = 0; i < count; i++) {
      now += 1000 / 60;
      const pending = frames;
      frames = [];
      pending.forEach((callback) => callback(now));
      await Promise.resolve();
      await Promise.resolve();
    }
  }

  beforeEach(() => {
    listeners = {};
    frames = [];
    now = 0;
    scenes = [];
    zones = [];
    interactions = [];
    walked = [];
    logKeys = 0;
    sfx = [];
    const on = (type: string, listener: Listener) => void (listeners[type] ??= []).push(listener);
    const off = (type: string, listener: Listener) => void (listeners[type] = (listeners[type] ?? []).filter((l) => l !== listener));
    vi.stubGlobal("window", { addEventListener: on, removeEventListener: off });
    vi.stubGlobal("document", {
      hidden: false,
      addEventListener() {},
      removeEventListener() {},
      createElement: () => {
        const { ctx } = makeFakeContext();
        return { width: 0, height: 0, getContext: () => ctx };
      },
    });
    vi.stubGlobal("HTMLElement", class {});
    vi.stubGlobal("requestAnimationFrame", (callback: (now: number) => void) => frames.push(callback));
    vi.stubGlobal("cancelAnimationFrame", () => {
      frames = [];
    });

    store = { save: createNewGameSave("janine95kim") };
    const events: WorldEvents = {
      onSceneChange: (scene) => scenes.push(scene),
      onZoneEnter: (zone) => zones.push(zone.id),
      onInteract: (target) => interactions.push(target),
      onWalked: (tiles) => walked.push(tiles),
      onLogKey: () => void logKeys++,
    };
    const { ctx } = makeFakeContext();
    const canvas = { width: 640, height: 360, getContext: () => ctx } as unknown as HTMLCanvasElement;
    engine = createWorldEngine({
      canvas,
      assets: fakeAssets(),
      playerId: "janine95kim",
      store,
      debug: true,
      getEvents: () => events,
      audio: { playBgm() {}, playSfx: (id) => void sfx.push(id) },
    });
    engine.start();
  });

  afterEach(() => {
    engine.destroy();
    vi.unstubAllGlobals();
  });

  it("starts in the chosen member's house and renders it", async () => {
    expect(scenes).toEqual(["interior:house-janine95kim"]);
    await run(30);
    expect(interactions).toEqual([]);
  });

  it("walks out of the house door into the village, then back in", async () => {
    dispatch("keydown", "ArrowDown");
    await run(80); // walk down through the doorway and fade
    dispatch("keyup", "ArrowDown");
    await run(45); // fade in
    expect(scenes.at(-1)).toBe("overworld");
    expect(zones.length).toBeGreaterThan(0);
    expect(walked.length).toBeGreaterThan(0);
    expect(sfx).toContain("door-close"); // leaving a house

    // Face the door again: the doorstep is 1 tile below it, walk up into it.
    dispatch("keydown", "ArrowUp");
    await run(60);
    dispatch("keyup", "ArrowUp");
    await run(60);
    expect(scenes.at(-1)).toBe("interior:house-janine95kim");
    expect(sfx).toContain("door-open"); // entering one
  });

  it("talks to the elder: walking up to him and pressing E opens an interaction and blocks movement", async () => {
    engine.teleport("overworld", [36, 23]);
    await run(60);
    expect(scenes.at(-1)).toBe("overworld");
    dispatch("keydown", "ArrowUp");
    await run(40);
    dispatch("keyup", "ArrowUp");
    dispatch("keydown", "KeyE");
    await run(3);
    dispatch("keyup", "KeyE");
    expect(interactions).toHaveLength(1);
    expect(interactions[0]).toMatchObject({ kind: "npc", cast: "elder" });

    // While the conversation owns the keyboard the player stays put.
    dispatch("keydown", "ArrowLeft");
    const before = engine.getState();
    await run(30);
    expect(engine.getState()).toEqual(before);
    dispatch("keyup", "ArrowLeft");

    // Closing the conversation hands the keyboard back.
    engine.closeInteraction();
    dispatch("keydown", "ArrowLeft");
    await run(30);
    dispatch("keyup", "ArrowLeft");
    expect(engine.getState().x).toBeLessThan(before.x);
  });

  it("reports the J key", async () => {
    dispatch("keydown", "KeyJ");
    await run(3);
    expect(logKeys).toBe(1);
  });

  it("updates and draws every one of the 20 scenes without throwing", async () => {
    for (const id of allSceneIds()) {
      engine.teleport(id);
      await run(50);
      expect(scenes.at(-1), id).toBe(id);
    }
  });

  it("supports the debug controls", async () => {
    engine.setRestoreOverride(0.5);
    engine.setNoclip(true);
    engine.teleport("overworld");
    await run(60);
    const pick = engine.pick(320, 180);
    expect(pick.scene).toBe("overworld");
    expect(pick.tx).toBe(Math.floor(pick.x / 32));
    engine.setRestoreOverride(null);
    engine.setNoclip(false);
    await run(3);
  });

  it("saves the position when it is torn down", async () => {
    dispatch("keydown", "ArrowUp");
    await run(20);
    dispatch("keyup", "ArrowUp");
    engine.destroy();
    engine.start(); // afterEach destroys again; a second destroy must be harmless
  });
});
