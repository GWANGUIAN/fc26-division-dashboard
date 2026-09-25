// Wearable items and pets for the locker-room inventory (docs/pitch/13 §2). Mirrors scripts/pitch-art-manifest.json
// ("equipment" / "pets"); __tests__/equipment.test.ts fails when the two drift apart. Everything is unlocked.

import { loadPitchLoadouts, savePitchLoadouts } from "../../storage";
import { PITCH_CHARACTER_IDS } from "./characterIds";

export type EquipSlot = "hat" | "face" | "back";
export type InventoryTab = EquipSlot | "pet";
export const EQUIP_SLOTS: readonly EquipSlot[] = ["hat", "face", "back"];
export const INVENTORY_TABS: readonly InventoryTab[] = ["hat", "face", "back", "pet"];
export const TAB_LABELS: Readonly<Record<InventoryTab, string>> = { hat: "모자", face: "얼굴", back: "등", pet: "펫" };

/** What one character wears: one item per slot plus one pet (ids from the catalog below). */
export type Loadout = Partial<Record<InventoryTab, string>>;

export interface EquipSheet {
  slot: EquipSlot;
  /** Cell size of the converted atlas `equipment/acc-<sheet>` (3 columns: front / side / back, 4 rows). */
  cell: readonly [number, number];
}

export const EQUIP_SHEETS: Readonly<Record<string, EquipSheet>> = {
  "hat-a": { slot: "hat", cell: [52, 44] },
  "hat-b": { slot: "hat", cell: [52, 44] },
  "face-a": { slot: "face", cell: [36, 22] },
  "back-a": { slot: "back", cell: [76, 56] },
};

export interface EquipItem {
  id: string;
  slot: EquipSlot;
  name: string;
  sheet: string;
  /** Row inside the sheet (0-3). */
  row: number;
  /** Fine tuning in baked px (before the per-character scale): + is right / down. */
  dx?: number;
  dy?: number;
  /** Extra shift in the facing direction, side view only (baked px): + moves it toward the front of a right- or left-facing character. */
  sideDx?: number;
  /** The sheet drew the item's outer face in the FRONT column (a backpack's pockets): from behind the wearer that face is the one to show. */
  faceOutFront?: boolean;
}

const item = (sheet: string, row: number, id: string, name: string, tune: Pick<EquipItem, "dx" | "dy" | "sideDx" | "faceOutFront"> = {}): EquipItem => ({
  id,
  slot: EQUIP_SHEETS[sheet].slot,
  name,
  sheet,
  row,
  ...tune,
});

export const EQUIP_ITEMS: readonly EquipItem[] = [
  item("hat-a", 0, "cap", "야구모자"),
  item("hat-a", 1, "beanie", "비니", { sideDx: -1 }),
  item("hat-a", 2, "crown", "왕관", { dy: -5 }),
  item("hat-a", 3, "wizard", "마법사 모자", { sideDx: -1 }),
  item("hat-b", 0, "straw", "밀짚모자", { dy: 1 }),
  item("hat-b", 1, "headphones", "헤드폰", { dy: 4 }),
  item("hat-b", 2, "santa", "산타 모자", { dy: -1, sideDx: 2 }),
  item("hat-b", 3, "cowboy", "카우보이 모자"),
  item("face-a", 0, "sunglasses", "선글라스"),
  item("face-a", 1, "roundglasses", "동그란 안경"),
  item("face-a", 2, "heartglasses", "하트 안경"),
  item("face-a", 3, "eyepatch", "안대"),
  item("back-a", 0, "cape", "붉은 망토"),
  item("back-a", 1, "angelwings", "천사 날개"),
  item("back-a", 2, "devilwings", "악마 날개"),
  item("back-a", 3, "backpack", "책가방", { faceOutFront: true }),
];

export interface PetDef {
  id: string;
  name: string;
  /** Only this character can wear it; undefined = everyone. */
  exclusiveTo?: string;
}

const COMMON_PETS: readonly PetDef[] = [
  { id: "cheezenyang", name: "치즈냥" },
  { id: "kkwaegi", name: "꽥이" },
  { id: "mallangi", name: "말랑이" },
  { id: "gongdori", name: "공돌이" },
  { id: "ppiyagi", name: "삐약이" },
  { id: "ttuttu", name: "뚜뚜" },
  { id: "chuny", name: "처니" },
  { id: "jinho", name: "지노" },
  { id: "messi", name: "메시" },
  { id: "doocheely", name: "두치리" },
  { id: "naldoo", name: "날두" },
];

const EXCLUSIVE_PETS: readonly PetDef[] = [
  { id: "panchi", name: "팬치", exclusiveTo: "woowakgood" },
  { id: "haepi", name: "해피", exclusiveTo: "haepalin" },
  { id: "gureumi", name: "구르미", exclusiveTo: "janine95kim" },
  { id: "yongboli", name: "용볼이", exclusiveTo: "hachi97" },
  { id: "baemsuri", name: "뱀술이", exclusiveTo: "lina0108" },
  { id: "dolmengi", name: "돌멩이", exclusiveTo: "ju010228" },
  { id: "sibakkeo", name: "시바꺼", exclusiveTo: "tdnlamuron" },
  { id: "penguin", name: "펭귄", exclusiveTo: "sjh4018" },
  { id: "bongbabi", name: "봉밥이", exclusiveTo: "tleod1818" },
  { id: "dangyeol", name: "단결", exclusiveTo: "kaksjak0730" },
  { id: "bbogeulseu", name: "뽀글스", exclusiveTo: "bboringirl" },
  { id: "ungnami", name: "웅남이", exclusiveTo: "doormomo" },
];

export const PETS: readonly PetDef[] = [...COMMON_PETS, ...EXCLUSIVE_PETS];

const ITEM_BY_ID = new Map(EQUIP_ITEMS.map((entry) => [entry.id, entry] as const));
const PET_BY_ID = new Map(PETS.map((entry) => [entry.id, entry] as const));

export const equipItem = (id: string | undefined): EquipItem | undefined => (id ? ITEM_BY_ID.get(id) : undefined);
export const petDef = (id: string | undefined): PetDef | undefined => (id ? PET_BY_ID.get(id) : undefined);

export function itemsForSlot(slot: EquipSlot): readonly EquipItem[] {
  return EQUIP_ITEMS.filter((entry) => entry.slot === slot);
}

/** Pets that `characterId` may wear: its exclusive pet first, then the common ones. */
export function petsFor(characterId: string): readonly PetDef[] {
  return [...EXCLUSIVE_PETS.filter((pet) => pet.exclusiveTo === characterId), ...COMMON_PETS];
}

/** What the inventory shows in a tab: ids in display order (exclusive pets first). */
export function tabEntries(tab: InventoryTab, characterId: string): ReadonlyArray<{ id: string; name: string; exclusive: boolean }> {
  if (tab === "pet") return petsFor(characterId).map((pet) => ({ id: pet.id, name: pet.name, exclusive: pet.exclusiveTo !== undefined }));
  return itemsForSlot(tab).map((entry) => ({ id: entry.id, name: entry.name, exclusive: false }));
}

/** Drops unknown ids, ids in the wrong slot and pets that belong to another character. */
export function sanitizeLoadout(characterId: string, raw: Record<string, unknown> | undefined): Loadout {
  const out: Loadout = {};
  if (!raw) return out;
  for (const slot of EQUIP_SLOTS) {
    const id = raw[slot];
    if (typeof id === "string" && equipItem(id)?.slot === slot) out[slot] = id;
  }
  const pet = petDef(typeof raw.pet === "string" ? raw.pet : undefined);
  if (pet && (pet.exclusiveTo === undefined || pet.exclusiveTo === characterId)) out.pet = pet.id;
  return out;
}

export const isEmptyLoadout = (loadout: Loadout): boolean => INVENTORY_TABS.every((tab) => !loadout[tab]);

export function sameLoadout(a: Loadout, b: Loadout): boolean {
  return INVENTORY_TABS.every((tab) => (a[tab] ?? "") === (b[tab] ?? ""));
}

/** What a character wears before the player has ever saved anything: only its own exclusive pet. */
export function defaultLoadout(characterId: string): Loadout {
  const pet = EXCLUSIVE_PETS.find((entry) => entry.exclusiveTo === characterId);
  return pet ? { pet: pet.id } : {};
}

/** The saved loadout; a character with no stored entry gets its default, a stored empty entry stays empty. */
export function loadLoadout(characterId: string): Loadout {
  const stored = loadPitchLoadouts()[characterId];
  return stored ? sanitizeLoadout(characterId, stored) : defaultLoadout(characterId);
}

/** Saves one character's loadout (an empty one too, so "nothing worn" is not mistaken for "never chosen"); other characters' entries are kept, unknown characters dropped. */
export function saveLoadout(characterId: string, loadout: Loadout) {
  const store = loadPitchLoadouts();
  const next: Record<string, Record<string, string>> = {};
  for (const id of PITCH_CHARACTER_IDS) {
    const clean = id === characterId ? sanitizeLoadout(id, loadout) : store[id] ? sanitizeLoadout(id, store[id]) : undefined;
    if (clean) next[id] = clean as Record<string, string>;
  }
  savePitchLoadouts(next);
}
