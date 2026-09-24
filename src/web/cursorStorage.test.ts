import { afterEach, describe, expect, it } from "vitest";
import {
  CURSOR_PLAYER_STORAGE_KEY,
  hasDiscoveredCursorPicker,
  loadCursorPlayerId,
  markCursorPickerDiscovered,
  saveCursorPlayerId,
} from "./storage";

const previousStorage = globalThis.localStorage;

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

afterEach(() => {
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: previousStorage });
});

describe("cursor player storage", () => {
  it("defaults invalid and missing values to woowakgood", () => {
    const storage = memoryStorage();
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
    expect(loadCursorPlayerId()).toBe("woowakgood");
    storage.setItem(CURSOR_PLAYER_STORAGE_KEY, "unknown");
    expect(loadCursorPlayerId()).toBe("woowakgood");
  });

  it("persists a valid player", () => {
    const storage = memoryStorage();
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
    saveCursorPlayerId("janine95kim");
    expect(storage.getItem(CURSOR_PLAYER_STORAGE_KEY)).toBe("janine95kim");
    expect(loadCursorPlayerId()).toBe("janine95kim");
  });

  it("persists the native cursor selection", () => {
    const storage = memoryStorage();
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
    saveCursorPlayerId("default");
    expect(storage.getItem(CURSOR_PLAYER_STORAGE_KEY)).toBe("default");
    expect(loadCursorPlayerId()).toBe("default");
  });

  it("shows the cursor picker prompt only before its first use", () => {
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: memoryStorage() });
    expect(hasDiscoveredCursorPicker()).toBe(false);
    markCursorPickerDiscovered();
    expect(hasDiscoveredCursorPicker()).toBe(true);
  });
});
