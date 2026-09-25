import { afterEach, describe, expect, it, vi } from "vitest";
import manifest from "../../../../scripts/pitch-art-manifest.json";
import { PITCH_LOADOUT_STORAGE_KEY, resetPitchStorageMemory } from "../../storage";
import { PITCH_CHARACTER_IDS } from "../data/characterIds";
import {
  EQUIP_ITEMS,
  defaultLoadout,
  EQUIP_SHEETS,
  PETS,
  isEmptyLoadout,
  itemsForSlot,
  loadLoadout,
  petsFor,
  sameLoadout,
  sanitizeLoadout,
  saveLoadout,
  tabEntries,
} from "../data/equipment";

function stubStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
  });
  return map;
}

afterEach(() => {
  vi.unstubAllGlobals();
  resetPitchStorageMemory();
});

describe("equipment catalog vs scripts/pitch-art-manifest.json", () => {
  it("has the same sheets, cells, slots and row order", () => {
    expect(Object.keys(EQUIP_SHEETS).sort()).toEqual(Object.keys(manifest.equipment.sheets).sort());
    for (const [sheetId, cfg] of Object.entries(manifest.equipment.sheets)) {
      expect(EQUIP_SHEETS[sheetId].slot).toBe(cfg.slot);
      expect([...EQUIP_SHEETS[sheetId].cell]).toEqual(cfg.cell);
      const rows = EQUIP_ITEMS.filter((item) => item.sheet === sheetId).sort((a, b) => a.row - b.row);
      expect(rows.map((item) => item.id)).toEqual(cfg.items.map(([id]) => id));
      expect(rows.map((item) => item.row)).toEqual([0, 1, 2, 3]);
    }
  });

  it("has 16 items with unique ids, four per sheet", () => {
    expect(EQUIP_ITEMS).toHaveLength(16);
    expect(new Set(EQUIP_ITEMS.map((item) => item.id)).size).toBe(16);
    expect(itemsForSlot("hat")).toHaveLength(8);
    expect(itemsForSlot("face")).toHaveLength(4);
    expect(itemsForSlot("back")).toHaveLength(4);
  });

  it("lists the same pets as the manifest: 11 common + 12 exclusive, one per character", () => {
    const common = PETS.filter((pet) => !pet.exclusiveTo).map((pet) => pet.id);
    expect(common).toEqual(manifest.pets.common);
    const exclusive = Object.fromEntries(PETS.filter((pet) => pet.exclusiveTo).map((pet) => [pet.id, pet.exclusiveTo]));
    expect(exclusive).toEqual(manifest.pets.exclusive);
    expect(Object.values(exclusive).sort()).toEqual([...PITCH_CHARACTER_IDS].sort());
  });
});

describe("pets per character", () => {
  it("offers its exclusive pet first, then the eleven common ones", () => {
    for (const id of PITCH_CHARACTER_IDS) {
      const pets = petsFor(id);
      expect(pets).toHaveLength(12);
      expect(pets[0].exclusiveTo).toBe(id);
      expect(pets.slice(1).every((pet) => pet.exclusiveTo === undefined)).toBe(true);
    }
    expect(tabEntries("pet", "woowakgood")[0]).toEqual({ id: "panchi", name: "팬치", exclusive: true });
    expect(tabEntries("hat", "woowakgood")).toHaveLength(8);
  });
});

describe("sanitizeLoadout", () => {
  it("keeps valid entries and drops unknown ids, wrong slots and other characters' exclusive pets", () => {
    expect(sanitizeLoadout("woowakgood", { hat: "cap", face: "sunglasses", back: "cape", pet: "panchi" })).toEqual({ hat: "cap", face: "sunglasses", back: "cape", pet: "panchi" });
    expect(sanitizeLoadout("woowakgood", { hat: "nope", face: "cap", back: 3, pet: "haepi" })).toEqual({});
    expect(sanitizeLoadout("woowakgood", { pet: "cheezenyang" })).toEqual({ pet: "cheezenyang" });
    expect(sanitizeLoadout("woowakgood", undefined)).toEqual({});
  });

  it("compares loadouts by content", () => {
    expect(sameLoadout({ hat: "cap" }, { hat: "cap" })).toBe(true);
    expect(sameLoadout({ hat: "cap" }, {})).toBe(false);
    expect(isEmptyLoadout({})).toBe(true);
    expect(isEmptyLoadout({ pet: "kkwaegi" })).toBe(false);
  });
});

describe("loadout storage (per character)", () => {
  it("round-trips one character without touching the others", () => {
    stubStorage();
    saveLoadout("woowakgood", { hat: "crown", pet: "panchi" });
    saveLoadout("janine95kim", { back: "angelwings" });
    expect(loadLoadout("woowakgood")).toEqual({ hat: "crown", pet: "panchi" });
    expect(loadLoadout("janine95kim")).toEqual({ back: "angelwings" });
    expect(loadLoadout("hachi97")).toEqual({ pet: "yongboli" });
    saveLoadout("woowakgood", {});
    expect(loadLoadout("woowakgood")).toEqual({});
    expect(loadLoadout("janine95kim")).toEqual({ back: "angelwings" });
  });

  it("heals a hand-edited or broken store", () => {
    stubStorage({ [PITCH_LOADOUT_STORAGE_KEY]: JSON.stringify({ woowakgood: { hat: "ghost", pet: "haepi", back: "cape" }, stranger: { hat: "cap" } }) });
    expect(loadLoadout("woowakgood")).toEqual({ back: "cape" });
    saveLoadout("hachi97", { hat: "beanie" });
    const store = JSON.parse(localStorage.getItem(PITCH_LOADOUT_STORAGE_KEY) as string);
    expect(Object.keys(store).sort()).toEqual(["hachi97", "woowakgood"]);
    stubStorage({ [PITCH_LOADOUT_STORAGE_KEY]: "{not json" });
    expect(loadLoadout("woowakgood")).toEqual({ pet: "panchi" });
  });

  it("works without localStorage (memory fallback)", () => {
    vi.stubGlobal("localStorage", undefined);
    saveLoadout("woowakgood", { hat: "cap" });
    expect(loadLoadout("woowakgood")).toEqual({ hat: "cap" });
  });
});

describe("asset groups", () => {
  it("pets:<id> lists the twelve pets a character may wear, wearable sheets are part of core", async () => {
    const { ASSET_GROUPS, groupSpecs } = await import("../engine/assets");
    const keys = groupSpecs("pets:woowakgood").map((spec) => spec.key);
    expect(keys).toHaveLength(12);
    expect(keys[0]).toBe("pets/pet-panchi");
    expect(keys).toContain("pets/pet-cheezenyang");
    expect(keys).not.toContain("pets/pet-haepi");
    const core = ASSET_GROUPS.core.map((spec) => spec.key);
    for (const sheet of Object.keys(EQUIP_SHEETS)) expect(core).toContain(`equipment/acc-${sheet}`);
  });
});

describe("default loadout", () => {
  it("is the character's own exclusive pet and nothing else, for all twelve", () => {
    stubStorage();
    for (const id of PITCH_CHARACTER_IDS) {
      const pet = PETS.find((entry) => entry.exclusiveTo === id);
      expect(defaultLoadout(id)).toEqual({ pet: pet?.id });
      expect(loadLoadout(id)).toEqual({ pet: pet?.id });
    }
    expect(defaultLoadout("nobody")).toEqual({});
  });

  it("applies until something is saved, and an emptied loadout stays empty", () => {
    stubStorage();
    expect(loadLoadout("tdnlamuron")).toEqual({ pet: "sibakkeo" });
    saveLoadout("tdnlamuron", { hat: "cap" });
    expect(loadLoadout("tdnlamuron")).toEqual({ hat: "cap" });
    saveLoadout("tdnlamuron", {});
    expect(loadLoadout("tdnlamuron")).toEqual({});
    expect(loadLoadout("lina0108")).toEqual({ pet: "baemsuri" });
  });
});
