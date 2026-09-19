import { INTERIOR_MAPS, OVERWORLD_MAP, hasScene, interiorIdOf } from "../data/maps";
import { PROP_DEFS } from "../data/propDefs";
import type { Facing, InteriorMapData, MapExamine, MapNpc, MapObject, MapTrigger, OverworldMapData, PxBox, Rect, SceneId, TileBox, TileSpan } from "../types";
import { indexColliders, type BuildingInstance, type DoorTrigger, type ExaminePoint, type NpcSpawn, type PropInstance, type SceneObject, type SceneZone, type TerrainGrid, type WorldScene } from "./scene";

export const TILE = 32;
export const INTERIOR_WIDTH = 640;
export const INTERIOR_HEIGHT = 384;
const DEFAULT_EXAMINE_SIZE: [number, number] = [64, 48];

/** Feet position of a character standing on a tile (tile centre). */
export function tileCenter(tx: number, ty: number): { x: number; y: number } {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

const pxBox = ([x, y, w, h]: PxBox): Rect => ({ x, y, w, h });
const tileBox = ([x, y, w, h]: TileBox): Rect => ({ x: x * TILE, y: y * TILE, w: w * TILE, h: h * TILE });
const tileSpan = ([x0, y0, x1, y1]: TileSpan): Rect => ({ x: x0 * TILE, y: y0 * TILE, w: (x1 - x0 + 1) * TILE, h: (y1 - y0 + 1) * TILE });

/** The bottom of an outdoor door rect is trimmed so walking along the building front never counts as entering. */
const OUTDOOR_DOOR_TRIM = 12;

function buildDoors(triggers: readonly MapTrigger[], outdoor: boolean): DoorTrigger[] {
  return triggers
    .filter((trigger) => trigger.type === "door")
    .map((trigger) => {
      const at = tileCenter(trigger.to.tile[0], trigger.to.tile[1]);
      const rect = tileBox(trigger.rect);
      if (outdoor) rect.h -= OUTDOOR_DOOR_TRIM;
      return { rect, to: { scene: trigger.to.scene, x: at.x, y: at.y, facing: (trigger.to.facing ?? "up") as Facing } };
    });
}

function buildExamine(entries: readonly MapExamine[]): ExaminePoint[] {
  return entries.map((entry) => {
    const [w, h] = entry.size ?? DEFAULT_EXAMINE_SIZE;
    const c = tileCenter(entry.tile[0], entry.tile[1]);
    return { id: entry.id, text: entry.text, area: { x: c.x - w / 2, y: c.y - h / 2, w, h }, ...(entry.action ? { action: entry.action } : {}) };
  });
}

function buildObjects(entries: readonly MapObject[] | undefined): SceneObject[] {
  return (entries ?? []).map((entry): SceneObject => {
    switch (entry.type) {
      case "pickup": {
        const at = tileCenter(entry.tile[0], entry.tile[1]);
        return { id: entry.id, type: "pickup", x: at.x, y: at.y, prop: entry.prop, ...(entry.look ? { look: entry.look } : {}), ...(entry.prompt ? { prompt: entry.prompt } : {}), ...(entry.when ? { when: entry.when } : {}) };
      }
      case "hazard": {
        const at = tileCenter(entry.tile[0], entry.tile[1]);
        return { id: entry.id, type: "hazard", x: at.x, y: at.y, ...(entry.prop ? { prop: entry.prop } : {}) };
      }
      case "ball": {
        const at = tileCenter(entry.tile[0], entry.tile[1]);
        return { id: entry.id, type: "ball", x: at.x, y: at.y, rect: tileBox(entry.bounds) };
      }
      case "goal":
      case "gate": {
        const rect = tileBox(entry.rect);
        return { id: entry.id, type: entry.type, x: rect.x + rect.w / 2, y: rect.y + rect.h, rect };
      }
    }
  });
}

function buildNpcs(entries: readonly MapNpc[]): NpcSpawn[] {
  const counts = new Map<string, number>();
  return entries.map((entry) => {
    const n = counts.get(entry.cast) ?? 0;
    counts.set(entry.cast, n + 1);
    const at = tileCenter(entry.tile[0], entry.tile[1]);
    return { key: `${entry.cast}#${n}`, cast: entry.cast, x: at.x, y: at.y, ai: entry.ai, ...(entry.wander ? { wander: tileBox(entry.wander) } : {}), ...(entry.when ? { when: entry.when } : {}) };
  });
}

function decodeTerrain(data: OverworldMapData): TerrainGrid {
  const [cols, rows] = data.size;
  const chars = Object.keys(data.legend);
  const index = new Map(chars.map((c, i) => [c, i]));
  const cells = new Uint8Array(cols * rows);
  data.terrainRows.forEach((row, ty) => {
    for (let tx = 0; tx < cols; tx++) cells[ty * cols + tx] = index.get(row[tx]) ?? 0;
  });
  const zoneCells = new Uint8Array(cols * rows);
  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      const zi = data.zones.findIndex((zone) => tx >= zone.rect[0] && tx <= zone.rect[2] && ty >= zone.rect[1] && ty <= zone.rect[3]);
      zoneCells[ty * cols + tx] = zi < 0 ? 0 : zi;
    }
  }
  return { cols, rows, cells, codes: chars.map((c) => data.legend[c]), zoneCells };
}

export function buildOverworldScene(data: OverworldMapData): WorldScene {
  const props: PropInstance[] = [];
  for (const entry of data.props) {
    const def = PROP_DEFS[entry.prop];
    if (!def) continue;
    props.push({
      id: entry.prop,
      x: entry.x,
      y: entry.y,
      w: def.w,
      h: def.h,
      foot: def.foot ?? [],
      aboveFrom: def.aboveFrom ?? null,
      decal: def.decal ?? false,
      withered: def.withered ?? false,
    });
  }
  const buildings: BuildingInstance[] = data.buildings.map((b) => {
    const box = tileSpan(b.rect);
    return { id: b.id, x: box.x + box.w / 2, y: box.y + box.h, w: box.w, h: box.h, key: `buildings/${b.id}` };
  });
  const { colliders, colliderRects } = indexColliders(props, data.collision.map(pxBox));
  const zones: SceneZone[] = data.zones.map((zone) => ({ id: zone.id, name: zone.name, rect: tileSpan(zone.rect), tint: zone.tint, ...(zone.bgm ? { bgm: zone.bgm } : {}) }));
  const spawn = tileCenter(data.spawn[0], data.spawn[1]);
  return {
    id: "overworld",
    kind: "overworld",
    size: { w: data.size[0] * TILE, h: data.size[1] * TILE },
    walkable: tileBox(data.walkable),
    colliders,
    colliderRects,
    props,
    buildings,
    npcSpawns: buildNpcs(data.npcs),
    doors: buildDoors(data.triggers, true),
    examine: buildExamine(data.examine),
    objects: buildObjects(data.objects),
    spawn,
    fixedCamera: false,
    terrain: decodeTerrain(data),
    zones,
  };
}

export function buildInteriorScene(data: InteriorMapData): WorldScene {
  const { colliders, colliderRects } = indexColliders([], data.collision.map(pxBox));
  const size = { w: data.size[0] * TILE, h: data.size[1] * TILE };
  return {
    id: `interior:${data.id}`,
    kind: "interior",
    size,
    walkable: { x: 0, y: 0, w: size.w, h: size.h },
    colliders,
    colliderRects,
    props: [],
    buildings: [],
    npcSpawns: buildNpcs(data.npcs),
    doors: buildDoors(data.triggers, false),
    examine: buildExamine(data.examine),
    objects: buildObjects(data.objects),
    spawn: tileCenter(data.spawn[0], data.spawn[1]),
    fixedCamera: true,
    zones: [],
    image: data.image,
  };
}

// The scene objects are immutable once built, so they are cached for the session.
const cache = new Map<SceneId, WorldScene>();

export function getScene(id: SceneId): WorldScene | undefined {
  if (!hasScene(id)) return undefined;
  let scene = cache.get(id);
  if (!scene) {
    const interior = interiorIdOf(id);
    scene = interior === null ? buildOverworldScene(OVERWORLD_MAP) : buildInteriorScene(INTERIOR_MAPS[interior]);
    cache.set(id, scene);
  }
  return scene;
}

/** Zone (name, id) at a foot position, or null in interiors. */
export function zoneAtPoint(scene: WorldScene, x: number, y: number): SceneZone | null {
  const grid = scene.terrain;
  if (!grid) return null;
  const tx = Math.min(Math.max(Math.floor(x / TILE), 0), grid.cols - 1);
  const ty = Math.min(Math.max(Math.floor(y / TILE), 0), grid.rows - 1);
  return scene.zones[grid.zoneCells[ty * grid.cols + tx]] ?? null;
}

/** Legend code ("core/grass-a") of the tile under a point. */
export function terrainCodeAt(scene: WorldScene, x: number, y: number): string | null {
  const grid = scene.terrain;
  if (!grid) return null;
  const tx = Math.min(Math.max(Math.floor(x / TILE), 0), grid.cols - 1);
  const ty = Math.min(Math.max(Math.floor(y / TILE), 0), grid.rows - 1);
  return grid.codes[grid.cells[ty * grid.cols + tx]] ?? null;
}
