import { afterEach, describe, expect, it, vi } from "vitest";
import { resetPitchStorageMemory } from "../../storage";
import type { PitchAudioLike } from "../audio/pitchAudio";
import type { PitchSfxId } from "../audio/sfxMap";
import { getCharacter } from "../data/characters";
import { loadLoadout, saveLoadout, type Loadout } from "../data/equipment";
import type { Scene, SceneCtx } from "../engine/sceneManager";
import { ANALYZER_ZONE, CABINET_ZONE, EXIT_ZONE, LOCKER_COLLIDERS, insideBox, nearCabinet } from "../game/locker";
import { InventoryScene, PREVIEW_VIEWS } from "../scenes/InventoryScene";
import { LockerScene, lockerTargetAt } from "../scenes/LockerScene";
import { AUTO_BUTTON, BUTTON_RECTS, TAB_RECTS, slotRect } from "../ui/inventoryLayout";

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

function stubStorage() {
  const map = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
  });
}

function makeCtx(images: Record<string, unknown> = {}) {
  const events: string[] = [];
  const announced: string[] = [];
  const loaded: string[] = [];
  const log = { pushed: [] as Scene[], popped: 0 };
  const audio: PitchAudioLike = {
    playBgm: () => undefined,
    playSfx: (id: PitchSfxId) => void events.push(id),
    stopSfx: () => undefined,
    setSettings: () => undefined,
  };
  const ctx = {
    width: 960,
    height: 540,
    manager: { transitionProgress: null, replace: () => undefined, push: (scene: Scene) => void log.pushed.push(scene), pop: () => void log.popped++ },
    host: {
      assets: {
        get: (key: string) => images[key],
        has: (key: string) => key in images,
        loadGroup: (group: string) => {
          loaded.push(group);
          return Promise.resolve({ loaded: [], failed: [], missing: [] });
        },
      },
      input: { isDown: () => false },
      hasKeyboardFocus: () => true,
      goDashboard: () => undefined,
      setCursor: () => undefined,
      audio,
      reducedMotion: () => false,
      announce: (text: string) => void announced.push(text),
    },
  } as unknown as SceneCtx;
  return { ctx, events, announced, loaded, log };
}

afterEach(() => {
  vi.unstubAllGlobals();
  resetPitchStorageMemory();
});

const woowakgood = getCharacter("woowakgood");

function open(params: { onApply?: (l: Loadout) => void; onClose?: () => void } = {}, images: Record<string, unknown> = {}) {
  stubStorage();
  saveLoadout("woowakgood", {}); // start empty: a character that never saved anything wears its own pet (see the default test)
  const env = makeCtx(images);
  const scene = new InventoryScene({ character: woowakgood, ...params });
  scene.enter(env.ctx);
  return { ...env, scene };
}

const click = (scene: InventoryScene, r: { x: number; y: number; w: number; h: number }) => {
  const x = r.x + r.w / 2;
  const y = r.y + r.h / 2;
  scene.onPointer({ type: "move", x, y });
  scene.onPointer({ type: "down", x, y });
  scene.onPointer({ type: "up", x, y });
};

describe("cabinet in the locker room", () => {
  it("has its own interaction circle that overlaps neither the analyzer nor the exit nor a collider", () => {
    const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
    expect(dist(CABINET_ZONE, ANALYZER_ZONE)).toBeGreaterThan(CABINET_ZONE.r + ANALYZER_ZONE.r);
    expect(dist(CABINET_ZONE, EXIT_ZONE)).toBeGreaterThan(CABINET_ZONE.r + EXIT_ZONE.r);
    expect(LOCKER_COLLIDERS.some((box) => insideBox(CABINET_ZONE.x, CABINET_ZONE.y, box))).toBe(false);
    expect(nearCabinet(CABINET_ZONE.x, CABINET_ZONE.y)).toBe(true);
    expect(lockerTargetAt(CABINET_ZONE.x, CABINET_ZONE.y)).toBe("cabinet");
    expect(lockerTargetAt(ANALYZER_ZONE.x, ANALYZER_ZONE.y)).toBe("analyzer");
    expect(lockerTargetAt(EXIT_ZONE.x, EXIT_ZONE.y)).toBe("exit");
    expect(lockerTargetAt(300, 400)).toBeNull();
  });

  it("opens the inventory on E and offers no interaction while it is open", () => {
    stubStorage();
    const env = makeCtx();
    const scene = new LockerScene({ createPitch: () => ({ update: () => undefined, render: () => undefined }) });
    scene.enter(env.ctx);
    const player = (scene as unknown as { player: { x: number; y: number } }).player;
    player.x = CABINET_ZONE.x;
    player.y = CABINET_ZONE.y;
    expect(scene.interaction()).toBe("cabinet");
    scene.onKey({ code: "KeyE" });
    expect(env.log.pushed).toHaveLength(1);
    expect(env.log.pushed[0]).toBeInstanceOf(InventoryScene);
    expect(scene.interaction()).toBeNull();
    scene.render(fakeGraphics());
    (env.log.pushed[0] as InventoryScene).exit?.();
    expect(scene.interaction()).toBe("cabinet");
  });
});

describe("InventoryScene", () => {
  it("previews on select and only saves on apply, per character", () => {
    const applied: Loadout[] = [];
    const { scene, events, loaded } = open({ onApply: (l) => applied.push(l) });
    expect(loaded).toContain("pets:woowakgood");
    scene.toggleEntry(0); // cap
    expect(scene.draftLoadout).toEqual({ hat: "cap" });
    expect(scene.savedLoadout).toEqual({});
    expect(scene.hasChanges).toBe(true);
    expect(loadLoadout("woowakgood")).toEqual({});
    scene.onKey({ code: "KeyA" });
    expect(loadLoadout("woowakgood")).toEqual({ hat: "cap" });
    expect(loadLoadout("hachi97")).toEqual({ pet: "yongboli" });
    expect(scene.hasChanges).toBe(false);
    expect(applied).toEqual([{ hat: "cap" }]);
    expect(events).toContain("ui-select");
  });

  it("toggles an entry off again, keeps one item per slot and unequips / clears", () => {
    const { scene } = open();
    scene.toggleEntry(0);
    scene.toggleEntry(2);
    expect(scene.draftLoadout).toEqual({ hat: "crown" });
    scene.toggleEntry(2);
    expect(scene.draftLoadout).toEqual({});
    scene.toggleEntry(1);
    scene.onKey({ code: "Tab" }); // face
    expect(scene.currentTab).toBe("face");
    scene.toggleEntry(0);
    expect(scene.draftLoadout).toEqual({ hat: "beanie", face: "sunglasses" });
    scene.onKey({ code: "Delete" });
    expect(scene.draftLoadout).toEqual({ hat: "beanie" });
    scene.toggleEntry(1);
    click(scene, BUTTON_RECTS.clear);
    expect(scene.draftLoadout).toEqual({});
  });

  it("lists the exclusive pet first in the pet tab and saves it for this character only", () => {
    const { scene } = open();
    click(scene, TAB_RECTS[3]);
    expect(scene.currentTab).toBe("pet");
    click(scene, slotRect(0));
    expect(scene.draftLoadout).toEqual({ pet: "panchi" });
    click(scene, BUTTON_RECTS.apply);
    expect(loadLoadout("woowakgood")).toEqual({ pet: "panchi" });
    // an exclusive pet of somebody else is dropped on load
    saveLoadout("hachi97", { pet: "panchi" });
    expect(loadLoadout("hachi97")).toEqual({});
  });

  it("starts from the saved loadout and closes at once when nothing changed", () => {
    stubStorage();
    saveLoadout("woowakgood", { hat: "wizard", back: "cape" });
    const env = makeCtx();
    let closed = 0;
    const scene = new InventoryScene({ character: woowakgood, onClose: () => closed++ });
    scene.enter(env.ctx);
    expect(scene.draftLoadout).toEqual({ hat: "wizard", back: "cape" });
    scene.onKey({ code: "Escape" });
    expect(env.log.popped).toBe(1);
    scene.exit();
    expect(closed).toBe(1);
  });

  it("asks for a second Esc when there are unsaved changes, then throws the preview away", () => {
    const { scene, log } = open();
    scene.toggleEntry(0);
    scene.onKey({ code: "Escape" });
    expect(log.popped).toBe(0);
    scene.onKey({ code: "Escape" });
    expect(log.popped).toBe(1);
    expect(loadLoadout("woowakgood")).toEqual({});
  });

  it("forgets the close warning after a few seconds", () => {
    const { scene, log } = open();
    scene.toggleEntry(0);
    scene.onKey({ code: "Escape" });
    for (let i = 0; i < 200; i++) scene.update(DT);
    scene.onKey({ code: "Escape" });
    expect(log.popped).toBe(0);
  });

  it("moves through the grid with the arrow keys and selects with Enter", () => {
    const { scene } = open();
    scene.onKey({ code: "ArrowRight" });
    scene.onKey({ code: "ArrowRight" });
    scene.onKey({ code: "ArrowDown" });
    expect(scene.selectedIndex).toBe(5);
    scene.onKey({ code: "Enter" });
    expect(scene.draftLoadout).toEqual({ hat: "headphones" });
  });

  it("turns the preview by hand, by itself, and holds when auto-turn is off", () => {
    const { scene } = open();
    expect(scene.previewView).toEqual(PREVIEW_VIEWS[0]);
    scene.onKey({ code: "KeyE" });
    expect(scene.previewView).toEqual(PREVIEW_VIEWS[1]);
    scene.onKey({ code: "KeyQ" });
    scene.onKey({ code: "KeyQ" });
    expect(scene.previewView).toEqual(PREVIEW_VIEWS[3]);
    for (let i = 0; i < 100; i++) scene.update(DT);
    expect(scene.previewView).not.toEqual(PREVIEW_VIEWS[3]);
  });

  it("renders with and without art without throwing", () => {
    const g = fakeGraphics();
    const bare = open();
    bare.scene.toggleEntry(0);
    bare.scene.update(DT);
    bare.scene.render(g);
    const image = { width: 96, height: 96 };
    const art = open({}, { "ui/inv-frame": image, "ui/inv-slot": { width: 320, height: 64 }, "characters/woowakgood-atlas": { width: 960, height: 960 }, "equipment/acc-hat-a": { width: 156, height: 176 } });
    art.scene.toggleEntry(0);
    art.scene.update(DT);
    art.scene.render(g);
    click(art.scene, TAB_RECTS[3]);
    art.scene.render(g);
  });
});

describe("?pitchFit=1 tool", () => {
  it("parses the query: off by default, on with pitchFit, an optional known character", async () => {
    const { pitchFitParams } = await import("../scenes/pitchDebug");
    expect(pitchFitParams("")).toBeNull();
    expect(pitchFitParams("?pitchFit=0")).toBeNull();
    expect(pitchFitParams("?pitchFit=1")).toEqual({});
    expect(pitchFitParams("?pitchFit=1&char=tleod1818")).toEqual({ characterId: "tleod1818" });
    expect(pitchFitParams("?pitchFit=1&char=nobody")).toEqual({});
  });

  it("forces the pitch entry mode even with a stored dashboard mode", async () => {
    const { resolveInitialMode } = await import("../../entryMode");
    expect(resolveInitialMode({ search: "?pitchFit=1", hash: "", stored: "dashboard", coarsePointer: false })).toBe("pitch");
  });

  it("opens the inventory by itself once the room is ready, with the fixed character", () => {
    stubStorage();
    const env = makeCtx({ "env/locker-bg": { width: 960, height: 540 } });
    const scene = new LockerScene({ createPitch: () => ({ update: () => undefined, render: () => undefined }), character: getCharacter("tleod1818"), openInventory: true });
    scene.enter(env.ctx);
    scene.update(DT);
    expect(env.log.pushed).toHaveLength(1);
    expect(env.log.pushed[0]).toBeInstanceOf(InventoryScene);
    scene.update(DT);
    expect(env.log.pushed).toHaveLength(1);
    expect(loadLoadout("tleod1818")).toEqual({ pet: "bongbabi" });
  });
});

describe("auto-turn preference", () => {
  it("is remembered in localStorage between openings", () => {
    const first = open();
    expect(first.scene.autoTurning).toBe(true);
    click(first.scene, AUTO_BUTTON);
    expect(first.scene.autoTurning).toBe(false);
    expect(JSON.parse(localStorage.getItem("fc26-pitch-inventory-v1") as string)).toEqual({ autoTurn: false });
    const env = makeCtx();
    const again = new InventoryScene({ character: woowakgood });
    again.enter(env.ctx);
    expect(again.autoTurning).toBe(false);
    for (let i = 0; i < 200; i++) again.update(DT);
    expect(again.previewView).toEqual(PREVIEW_VIEWS[0]);
    click(again, AUTO_BUTTON);
    expect(JSON.parse(localStorage.getItem("fc26-pitch-inventory-v1") as string)).toEqual({ autoTurn: true });
  });

  it("falls back to auto-turn for a broken value", () => {
    stubStorage();
    localStorage.setItem("fc26-pitch-inventory-v1", "{nope");
    const env = makeCtx();
    const scene = new InventoryScene({ character: woowakgood });
    scene.enter(env.ctx);
    expect(scene.autoTurning).toBe(true);
  });
});
