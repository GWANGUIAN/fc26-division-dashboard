import { describe, expect, it, vi } from "vitest";
import { createPitchAssets, groupSpecs, type AssetImage, type AssetSpec } from "../engine/assets";
import { createInput } from "../engine/input";

const image = (name: string) => ({ name }) as unknown as AssetImage;

describe("asset store", () => {
  const urls = new Map([
    ["a", "/a.webp"],
    ["b", "/b.webp"],
  ]);
  const groups: Record<string, readonly AssetSpec[]> = {
    boot: [],
    core: [{ key: "a" }, { key: "b" }, { key: "ghost" }],
  };

  it("an empty group completes instantly with progress 1", async () => {
    const assets = createPitchAssets({ urls, groups, loadImage: async () => image("x") });
    const progress: number[] = [];
    const result = await assets.loadGroup("boot", { onProgress: (p) => progress.push(p) });
    expect(result).toEqual({ loaded: [], failed: [], missing: [] });
    expect(progress.at(-1)).toBe(1);
  });

  it("missing keys resolve to undefined and are reported, present ones load", async () => {
    const assets = createPitchAssets({ urls, groups, loadImage: async (url) => image(url) });
    const result = await assets.loadGroup("core");
    expect(result.loaded.sort()).toEqual(["a", "b"]);
    expect(result.missing).toEqual(["ghost"]);
    expect(assets.get("a")).toBeDefined();
    expect(assets.get("ghost")).toBeUndefined();
  });

  it("a failing file is reported and stays undefined without throwing", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const assets = createPitchAssets({
      urls,
      groups,
      loadImage: async (url) => {
        if (url === "/b.webp") throw new Error("boom");
        return image(url);
      },
    });
    const result = await assets.loadGroup("core");
    expect(result.failed).toEqual(["b"]);
    expect(assets.get("b")).toBeUndefined();
    expect(assets.get("a")).toBeDefined();
    vi.restoreAllMocks();
  });

  it("weights progress by bytes when every file has a size, else by file count", async () => {
    const byBytes = createPitchAssets({
      urls,
      groups: { core: [{ key: "a", bytes: 900 }, { key: "b", bytes: 100 }] },
      loadImage: async (url) => image(url),
    });
    const seen: number[] = [];
    await byBytes.loadGroup("core", { onProgress: (p) => seen.push(p) });
    expect(seen).toContain(0.9);

    const byCount = createPitchAssets({
      urls,
      groups: { core: [{ key: "a", bytes: 900 }, { key: "b" }] },
      loadImage: async (url) => image(url),
    });
    const seenCount: number[] = [];
    await byCount.loadGroup("core", { onProgress: (p) => seenCount.push(p) });
    expect(seenCount).toContain(0.5);
  });

  it("waits out the minimum display time", async () => {
    let clock = 0;
    const waits: number[] = [];
    const assets = createPitchAssets({
      urls,
      groups,
      loadImage: async (url) => image(url),
      now: () => clock,
      wait: async (ms) => void waits.push(ms),
    });
    await assets.loadGroup("core", { minMs: 600 });
    expect(waits).toEqual([600]);
    clock = 1000;
    waits.length = 0;
    await assets.loadGroup("core", { minMs: 600 });
    expect(waits).toEqual([600]);
  });

  it("release drops a group's images", async () => {
    const assets = createPitchAssets({ urls, groups, loadImage: async (url) => image(url) });
    await assets.loadGroup("core");
    assets.release("core");
    expect(assets.get("a")).toBeUndefined();
  });

  it("release keeps a file that another loaded group still lists", async () => {
    const shared: Record<string, readonly AssetSpec[]> = { core: [{ key: "a" }, { key: "b" }], locker: [{ key: "b" }] };
    const assets = createPitchAssets({ urls, groups: shared, loadImage: async (url) => image(url) });
    await assets.loadGroup("core");
    await assets.loadGroup("locker");
    assets.release("locker");
    expect(assets.get("b")).toBeDefined();
    assets.release("core");
    expect(assets.get("b")).toBeUndefined();
    expect(assets.get("a")).toBeUndefined();
  });

  it("derives char:<id> groups from the id", () => {
    expect(groupSpecs("char:janine95kim").map((spec) => spec.key)).toEqual([
      "characters/janine95kim-atlas",
      "portraits/janine95kim-neutral",
      "portraits/janine95kim-confident",
      "portraits/janine95kim-celebrate",
      "portraits/janine95kim-disappointed",
    ]);
  });
});

describe("input", () => {
  function fakeWindow() {
    const handlers = new Map<string, (e: unknown) => void>();
    return {
      addEventListener: (type: string, fn: (e: unknown) => void) => void handlers.set(type, fn),
      removeEventListener: (type: string) => void handlers.delete(type),
      fire: (type: string, event: object = {}) => handlers.get(type)?.(event),
    };
  }
  const key = (code: string, extra: object = {}) => {
    const event = { code, repeat: false, ctrlKey: false, altKey: false, metaKey: false, target: null, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...extra };
    return event;
  };

  it("tracks held state and press edges, ignoring auto-repeat", () => {
    const win = fakeWindow();
    const input = createInput(win as unknown as Window);
    input.attach();
    win.fire("keydown", key("ArrowLeft"));
    win.fire("keydown", key("ArrowLeft", { repeat: true }));
    win.fire("keydown", key("Space"));
    expect(input.isDown("ArrowLeft")).toBe(true);
    expect(input.drainPresses()).toEqual(["ArrowLeft", "Space"]);
    expect(input.drainPresses()).toEqual([]);
    win.fire("keyup", key("ArrowLeft"));
    expect(input.isDown("ArrowLeft")).toBe(false);
  });

  it("prevents default for arrows/Space/Tab only, and never with a modifier", () => {
    const win = fakeWindow();
    const input = createInput(win as unknown as Window);
    input.attach();
    const arrow = key("ArrowUp");
    const tab = key("Tab");
    const letter = key("KeyR");
    const combo = key("ArrowUp", { ctrlKey: true });
    for (const e of [arrow, tab, letter, combo]) win.fire("keydown", e);
    expect([arrow.defaultPrevented, tab.defaultPrevented, letter.defaultPrevented, combo.defaultPrevented]).toEqual([true, true, false, false]);
  });

  it("releases everything on blur", () => {
    const win = fakeWindow();
    const input = createInput(win as unknown as Window);
    input.attach();
    win.fire("keydown", key("ArrowRight"));
    win.fire("blur");
    expect(input.isDown("ArrowRight")).toBe(false);
    expect(input.drainPresses()).toEqual([]);
  });

  it("detach stops listening", () => {
    const win = fakeWindow();
    const input = createInput(win as unknown as Window);
    input.attach();
    input.detach();
    win.fire("keydown", key("ArrowLeft"));
    expect(input.isDown("ArrowLeft")).toBe(false);
  });
});
