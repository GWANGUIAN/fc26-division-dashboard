// Terrain sheets (docs/world/05 §1): each `terrain/<sheet>.webp` is a 128×128 atlas of 4×4 tiles of 32px.
// A map legend value is "<sheet>/<slot>", e.g. "core/grass-a". Slot order = left→right, top→bottom.
//
// Plain data with no runtime imports so `scripts/build-world-map.mjs` can import it directly.

export const TERRAIN_SHEETS = ["core", "water", "spring", "frost", "industrial", "cloud", "weed", "pitch"] as const;
export type TerrainSheet = (typeof TERRAIN_SHEETS)[number];

export const TERRAIN_SLOTS: Record<TerrainSheet, readonly string[]> = {
  core: ["grass-a", "grass-b", "grass-c", "grass-d", "grass-flower-a", "grass-flower-b", "grass-tuft", "grass-shade", "path-dirt-a", "path-dirt-b", "path-stone-a", "path-stone-b", "plaza-a", "plaza-b", "plaza-c", "plaza-d"],
  water: ["water-1", "water-2", "water-3", "water-4", "water-deep-1", "water-deep-2", "water-deep-3", "water-deep-4", "sand-a", "sand-b", "sand-wet", "pebble-a", "pebble-b", "bridge-plank-a", "bridge-plank-b", "water-lily"],
  spring: ["sakura-ground-a", "sakura-ground-b", "sakura-ground-c", "clover-a", "clover-b", "flowerbed-pink", "flowerbed-yellow", "moss-a", "soft-dirt-a", "soft-dirt-b", "vine-ground", "garden-path-a", "garden-path-b", "meadow-tall-a", "meadow-tall-b", "dragon-gold-grass"],
  frost: ["snow-a", "snow-b", "snow-c", "ice-a", "ice-b", "ice-c", "frozen-grass-a", "frozen-grass-b", "night-grass-a", "night-grass-b", "night-grass-c", "star-stone-a", "star-stone-b", "starlit-path-a", "starlit-path-b", "ice-line"],
  industrial: ["cracked-rock-a", "cracked-rock-b", "lava-crack-a", "lava-crack-b", "ash-a", "ash-b", "metal-plate-a", "metal-plate-b", "grate-a", "asphalt-a", "asphalt-b", "caution-stripe", "circuit-floor-a", "circuit-floor-b", "scorched-dirt", "lava-pool"],
  cloud: ["cloud-stone-a", "cloud-stone-b", "cloud-puff-a", "cloud-puff-b", "rune-slab-a", "rune-slab-b", "rune-slab-dim", "sky-tile-a", "sky-tile-b", "wind-grass-a", "wind-grass-b", "blue-marble-a", "blue-marble-b", "moss-stone-a", "moss-stone-b", "rune-glow"],
  weed: ["gray-ground-a", "gray-ground-b", "gray-ground-c", "gray-ground-d", "concrete-a", "concrete-b", "mowed-stripe-a", "mowed-stripe-b", "gravel-a", "gravel-b", "oil-stain", "sawdust", "mower-track-a", "mower-track-b", "barren-dirt", "dead-weed-patch"],
  pitch: ["pitch-light", "pitch-dark", "pitch-worn-a", "pitch-worn-b", "track-red-a", "track-red-b", "turf-train-a", "turf-train-b", "turf-artificial-a", "turf-artificial-b", "sandpit-a", "sandpit-b", "concourse", "goal-dirt", "corner-worn", "pitch-golden"],
};

/** Sheets that have an auto-derived `<sheet>-withered.webp`. The rest (water, industrial, weed) fall back to the lush sheet. */
export const WITHERED_SHEETS: readonly TerrainSheet[] = ["core", "pitch", "spring", "frost", "cloud"];

/**
 * Base ground slots: the terrain of a zone itself. Where two zones with different ground sheets touch,
 * their edges are blended with a dithered gradient. Paths, plazas, water, ice and pitch surfaces stay
 * crisp so roads and fields keep their outline.
 */
export const GROUND_SLOTS: Partial<Record<TerrainSheet, readonly string[]>> = {
  core: ["grass-a", "grass-b", "grass-c", "grass-d", "grass-flower-a", "grass-flower-b", "grass-tuft", "grass-shade"],
  spring: ["sakura-ground-a", "sakura-ground-b", "sakura-ground-c", "clover-a", "clover-b", "moss-a", "soft-dirt-a", "soft-dirt-b", "vine-ground", "meadow-tall-a", "meadow-tall-b", "dragon-gold-grass"],
  frost: ["snow-a", "snow-b", "snow-c", "frozen-grass-a", "frozen-grass-b", "night-grass-a", "night-grass-b", "night-grass-c"],
  industrial: ["cracked-rock-a", "cracked-rock-b", "ash-a", "ash-b", "scorched-dirt"],
  cloud: ["cloud-stone-a", "cloud-stone-b", "cloud-puff-a", "cloud-puff-b", "wind-grass-a", "wind-grass-b", "moss-stone-a", "moss-stone-b", "rune-slab-a", "rune-slab-b", "rune-slab-dim"],
  weed: ["gray-ground-a", "gray-ground-b", "gray-ground-c", "gray-ground-d", "barren-dirt", "gravel-a", "gravel-b"],
};

export interface TerrainSlot {
  sheet: TerrainSheet;
  slot: string;
  col: number;
  row: number;
}

/** Parses a legend value such as "core/grass-a" into its atlas cell, or null when it names no known slot. */
export function parseTerrainCode(code: string): TerrainSlot | null {
  const cut = code.indexOf("/");
  if (cut < 0) return null;
  const sheet = code.slice(0, cut) as TerrainSheet;
  const slot = code.slice(cut + 1);
  const slots = TERRAIN_SLOTS[sheet];
  if (!slots) return null;
  const index = slots.indexOf(slot);
  if (index < 0) return null;
  return { sheet, slot, col: index % 4, row: Math.floor(index / 4) };
}

/** The sheet whose ground this code is (used for zone-edge blending), or null for roads/water/etc. */
export function groundSheet(code: string): TerrainSheet | null {
  const parsed = parseTerrainCode(code);
  if (!parsed) return null;
  return GROUND_SLOTS[parsed.sheet]?.includes(parsed.slot) ? parsed.sheet : null;
}

/** Asset key of a sheet's atlas image for the lush or withered look. */
export function terrainAssetKey(sheet: TerrainSheet, withered: boolean): string {
  return withered && WITHERED_SHEETS.includes(sheet) ? `terrain/${sheet}-withered` : `terrain/${sheet}`;
}

/** Footstep material under a terrain code (for the audio hook). */
export function surfaceOf(code: string): "grass" | "stone" | "dirt" | "wood" | "snow" | "metal" | "sand" | "water" {
  const parsed = parseTerrainCode(code);
  if (!parsed) return "grass";
  const { sheet, slot } = parsed;
  if (sheet === "water") {
    if (slot.startsWith("bridge")) return "wood";
    if (slot.startsWith("sand") || slot.startsWith("pebble")) return "sand";
    return "water";
  }
  if (slot.startsWith("plaza") || slot.startsWith("path-stone") || slot.startsWith("star") || slot.startsWith("starlit") || slot.startsWith("garden-path") || slot.startsWith("concourse") || slot.startsWith("concrete")) return "stone";
  if (slot.startsWith("path-dirt") || slot.startsWith("soft-dirt") || slot.startsWith("scorched") || slot.startsWith("barren")) return "dirt";
  if (sheet === "frost" && (slot.startsWith("snow") || slot.startsWith("ice"))) return "snow";
  if (sheet === "industrial" && (slot.startsWith("metal") || slot.startsWith("grate") || slot.startsWith("circuit") || slot.startsWith("asphalt") || slot.startsWith("caution"))) return "metal";
  return "grass";
}
