import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { allSceneIds } from "../data/maps";
import { acceptMission } from "../state/missions";
import { debugSkipTutorial } from "../state/debugTools";
import { createNewGameSave } from "../storage";
import type { SceneId } from "../types";
import { WorldAssets } from "../worldAssets";
import type { InteractTarget } from "./interaction";
import type { RunEvent } from "./runs";
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
  let voices: string[];
  let pickups: string[];
  let runEvents: RunEvent[];
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
    voices = [];
    pickups = [];
    runEvents = [];
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
      onPickup: (id) => { pickups.push(id); store.save = { ...store.save, collected: [...store.save.collected, id] }; },
      onRunEvent: (event) => void runEvents.push(event),
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
      audio: { playBgm() {}, playSfx: (id) => void sfx.push(id), playVoice: (url) => void voices.push(url) },
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

  it("plays a member's own card-click clip when talking to them, but nothing for an original character", async () => {
    const talkTo = async (spawn: [number, number]) => {
      engine.teleport("overworld", spawn);
      await run(60);
      dispatch("keydown", "ArrowUp");
      await run(40);
      dispatch("keyup", "ArrowUp");
      dispatch("keydown", "KeyE");
      await run(3);
      dispatch("keyup", "KeyE");
      engine.closeInteraction();
    };
    await talkTo([36, 23]); // the elder
    expect(interactions.at(-1)).toMatchObject({ kind: "npc", cast: "elder" });
    expect(voices).toEqual([]);
    await talkTo([14, 14]); // 핑구
    expect(interactions.at(-1)).toMatchObject({ kind: "npc", cast: "sjh4018" });
    expect(voices).toEqual(["/sfxes/pinggu.mp3"]);
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

  /** Holds a key until the player satisfies `done` (or gives up), then releases it. */
  async function hold(code: string, done: (state: ReturnType<WorldEngine["getState"]>) => boolean, maxFrames = 400) {
    dispatch("keydown", code);
    for (let i = 0; i < maxFrames && !done(engine.getState()); i++) await run(1);
    dispatch("keyup", code);
    await run(1);
  }

  /** A save past the tutorial with one mission already accepted. */
  function playing(missionId: string) {
    store.save = acceptMission(debugSkipTutorial(store.save), missionId);
  }

  async function stand(tile: [number, number], facing?: "up" | "down" | "left" | "right") {
    engine.teleport("overworld", tile);
    await run(60);
    if (facing) {
      // a one-frame tap turns the character without moving it far (walls are not in the way at these spots)
      const key = { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" }[facing];
      dispatch("keydown", key);
      await run(1);
      dispatch("keyup", key);
      await run(1);
    }
  }

  it("lets conditional residents appear once their mission is completed", async () => {
    engine.teleport("interior:house-doormomo");
    await run(60);
    expect(engine.getNpcCasts()).not.toContain("doormomo");
    store.save = { ...store.save, missions: { ...store.save.missions, "m-doormomo-sum10": { status: "completed" } } };
    await run(3);
    expect(engine.getNpcCasts()).toContain("doormomo");
  });

  it("never spawns the player's own member in the overworld", async () => {
    engine.teleport("overworld");
    await run(60);
    expect(engine.getNpcCasts()).toContain("elder");
    expect(engine.getNpcCasts()).not.toContain("janine95kim");
  });

  it("only offers a lantern while its mission is active, and takes it with E without opening a dialogue", async () => {
    await stand([57, 35], "down");
    dispatch("keydown", "KeyE");
    await run(3);
    dispatch("keyup", "KeyE");
    expect(pickups).toEqual([]); // the lantern is not there yet

    playing("m-haepalin-lanterns");
    await run(3);
    dispatch("keydown", "KeyE");
    await run(3);
    dispatch("keyup", "KeyE");
    expect(pickups).toEqual(["jelly-lantern-a"]);
    expect(interactions).toEqual([]); // no dialogue, movement stays free
    expect(sfx).toContain("pickup");
    const before = engine.getState();
    dispatch("keydown", "ArrowRight");
    await run(20);
    dispatch("keyup", "ArrowRight");
    expect(engine.getState().x).toBeGreaterThan(before.x);
  });

  it("collects golden balls by contact once, but never while a modal owns input", async () => {
    engine.setUiBlocked(true);
    engine.teleport("overworld", [36,19]);
    await run(60);
    expect(pickups).toEqual([]);
    engine.setUiBlocked(false);
    await run(5);
    expect(pickups).toEqual(["gb-01"]);
    await run(60);
    expect(pickups).toEqual(["gb-01"]);
    engine.teleport("interior:factory", [14,6]);
    await run(60);
    expect(pickups).not.toContain("gb-20");
    store.save = { ...store.save, flags: { ...store.save.flags, "ending-seen": true } };
    await run(5);
    expect(pickups).toContain("gb-20");
  });

  it("stops offering a lantern once it is collected", async () => {
    playing("m-haepalin-lanterns");
    store.save = { ...store.save, collected: ["jelly-lantern-a"] };
    await stand([57, 35], "down");
    dispatch("keydown", "KeyE");
    await run(3);
    dispatch("keyup", "KeyE");
    expect(pickups).toEqual([]);
  });

  it("kicks the ball at the goal for the kick challenge: the first kick starts the minute and a goal counts", async () => {
    playing("m-ju010228-kickgoals");
    await stand([28, 11.375], "left");
    dispatch("keydown", "KeyE");
    await run(2);
    dispatch("keyup", "KeyE");
    expect(sfx).toContain("ball-kick");
    expect(runEvents[0]).toMatchObject({ type: "kick-start", mission: "m-ju010228-kickgoals" });
    await run(240); // the ball rolls west into the goal
    expect(runEvents.some((event) => event.type === "kick-goal" && event.goals === 1)).toBe(true);
    expect(sfx).toContain("ball-net");
  });

  it("does not start a kick run when no kick mission is active (free practice)", async () => {
    store.save = debugSkipTutorial(store.save);
    await stand([28, 11.375], "left");
    dispatch("keydown", "KeyE");
    await run(2);
    dispatch("keyup", "KeyE");
    await run(240);
    expect(sfx).toContain("ball-kick");
    expect(runEvents).toEqual([]);
  });

  // The cone row is y = 56 (foot y 1808): flag, five cones, flag at x 5, 7 … 17 (tile centres); the gaps between them are the gates.
  const coneLine = 56 * 32 + 16;
  const above = coneLine - 32;
  const below = coneLine + 22;
  const gapX = (tx: number) => tx * 32 + 16;

  it("runs the cone course: crossing the gap beside the first flag starts the clock, weaving through every gap finishes", async () => {
    playing("m-tdnlamuron-conerun");
    await stand([4, 55]);
    await hold("ArrowRight", (s) => s.x >= gapX(6));
    await hold("ArrowDown", (s) => s.y >= below); // through the gap between the flag and the first cone: the clock starts
    // Then through each gap between two cones, one way and back the other: up, down, up, down, up.
    for (const [gap, up] of [[8, true], [10, false], [12, true], [14, false], [16, true]] as const) {
      await hold("ArrowRight", (s) => s.x >= gapX(gap));
      await hold(up ? "ArrowUp" : "ArrowDown", (s) => (up ? s.y <= above : s.y >= below));
    }
    const kinds = runEvents.map((event) => event.type);
    expect(kinds[0]).toBe("trial-start");
    expect(kinds.filter((kind) => kind === "trial-gate")).toHaveLength(4);
    expect(kinds).not.toContain("trial-cone");
    const finished = runEvents.find((event) => event.type === "trial-finished");
    expect(finished).toMatchObject({ type: "trial-finished", mission: "m-tdnlamuron-conerun", passed: true });
  });

  it("does not start the clock by stepping into the first gap without crossing the cone line", async () => {
    playing("m-tdnlamuron-conerun");
    await stand([4, 55]);
    await hold("ArrowRight", (s) => s.x >= gapX(6));
    await hold("ArrowDown", (s) => s.y >= coneLine - 4); // inside the gap, still above the line
    await hold("ArrowUp", (s) => s.y <= above);
    expect(runEvents.map((event) => event.type)).not.toContain("trial-start");
  });

  it("fails to pass a checkpoint by running straight along the cone line (the cones cost time and no gap is crossed)", async () => {
    playing("m-tdnlamuron-conerun");
    await stand([4, 55]);
    await hold("ArrowRight", (s) => s.x >= gapX(6));
    await hold("ArrowDown", (s) => s.y >= below); // start the clock ...
    await hold("ArrowUp", (s) => s.y <= coneLine - 4); // ... and come back up next to the line, on the cones' side
    await hold("ArrowRight", (s) => s.x >= 18 * 32);
    const kinds = runEvents.map((event) => event.type);
    expect(kinds).toContain("trial-start");
    expect(kinds).toContain("trial-cone");
    expect(kinds).not.toContain("trial-gate");
    expect(kinds).not.toContain("trial-finished");
  });

  it("delivers a parcel at its own mailbox during a delivery round", async () => {
    playing("m-tleod1818-delivery");
    engine.startDelivery("m-tleod1818-delivery");
    expect(runEvents[0]).toMatchObject({ type: "delivery-start", seconds: 90 });
    expect(engine.isDeliveryRunning()).toBe(true);

    await stand([14, 39], "up"); // the west mailbox stands at tile (14, 38)
    dispatch("keydown", "KeyE");
    await run(2);
    dispatch("keyup", "KeyE");
    expect(runEvents.some((event) => event.type === "delivered" && event.item === "parcel-a" && event.mailbox === "mb-west")).toBe(true);
    expect(interactions).toEqual([]); // handed over without a dialogue
    expect(engine.isDeliveryRunning()).toBe(true); // two parcels left
  });

  it("shows the mailbox text when there is nothing to deliver", async () => {
    await stand([14, 39], "up");
    dispatch("keydown", "KeyE");
    await run(2);
    dispatch("keyup", "KeyE");
    expect(interactions[0]).toMatchObject({ kind: "examine", id: "mb-west", action: "mailbox:mb-west" });
    engine.closeInteraction();
  });

  it("opens the arcade machines and the card cabinet as actions of the interaction", async () => {
    engine.teleport("interior:arcade", [6, 5]);
    await run(60);
    dispatch("keydown", "ArrowUp");
    await run(2);
    dispatch("keyup", "ArrowUp");
    dispatch("keydown", "KeyE");
    await run(2);
    dispatch("keyup", "KeyE");
    expect(interactions[0]).toMatchObject({ kind: "examine", action: "minigame:soccer-sum10" });
  });

  it("follows a save that changes while playing (restore targets, markers) without errors", async () => {
    engine.teleport("overworld");
    await run(60);
    store.save = { ...store.save, shards: 4, missions: { ...store.save.missions, "m-sjh4018-kickups": { status: "completed" } } };
    await run(30);
    store.save = { ...store.save, missions: { ...store.save.missions, "m-doormomo-sum10": { status: "ready" } } };
    await run(30);
    expect(scenes.at(-1)).toBe("overworld");
  });

  it("saves the position when it is torn down", async () => {
    dispatch("keydown", "ArrowUp");
    await run(20);
    dispatch("keyup", "ArrowUp");
    engine.destroy();
    engine.start(); // afterEach destroys again; a second destroy must be harmless
  });
});
