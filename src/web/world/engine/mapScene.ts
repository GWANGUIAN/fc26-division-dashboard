import { INTERIOR_MAPS, OVERWORLD_MAP, hasScene, interiorIdOf } from "../data/maps";
import { PROP_DEFS } from "../data/propDefs";
import type { Facing, InteriorMapData, MapExamine, MapNpc, MapObject, MapProp, MapSpectator, MapTrigger, OverworldMapData, PxBox, Rect, SceneId, TileBox, TileSpan } from "../types";
import { FOOT_W } from "./collision";
import { entranceMatWidth, findEntranceMat } from "./entrance";
import { indexColliders, type BuildingFront, type BuildingInstance, type DoorTrigger, type ExaminePoint, type NpcSpawn, type PropInstance, type SceneObject, type SceneZone, type SpectatorSpawn, type TerrainGrid, type WorldScene } from "./scene";

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

/**
 * How a building sprite is y-sorted against characters, column by column. A column under the footprint sorts at the front
 * edge of the solid there (so the door notch sorts at the wall above it, and a round base's corners sort where the base ends);
 * a column beside the footprint holds no solid, so it sorts at the back of the nearest solid. `solids` are the collision
 * rects inside `box`; without any, the whole sprite sorts at its bottom edge. Neighbouring columns with the same line merge.
 */
export function buildingFronts(box: Rect, solids: readonly Rect[]): BuildingFront[] {
  if (solids.length === 0) return [{ x: 0, w: box.w, sortY: box.y + box.h }];
  const fronts: BuildingFront[] = [];
  for (let x = 0; x < box.w; x++) {
    const at = box.x + x + 0.5;
    let front = -Infinity;
    for (const solid of solids) if (at >= solid.x && at < solid.x + solid.w) front = Math.max(front, solid.y + solid.h);
    if (front === -Infinity) {
      let nearest = Infinity;
      for (const solid of solids) {
        const gap = at < solid.x ? solid.x - at : at - (solid.x + solid.w);
        if (gap < nearest) {
          nearest = gap;
          front = solid.y;
        } else if (gap === nearest) front = Math.min(front, solid.y);
      }
    }
    const last = fronts[fronts.length - 1];
    if (last && last.sortY === front) last.w += 1;
    else fronts.push({ x, w: 1, sortY: front });
  }
  return fronts;
}

/** The bottom of an outdoor door rect is trimmed so walking along the building front never counts as entering. */
const OUTDOOR_DOOR_TRIM = 12;

/**
 * `props` (overworld only): the entrance trigger sits on the building's entrance mat, the hand-aligned truth of where the
 * door is drawn, instead of on the door tiles (up to 21 px off, and 64 px wide against a ~53 px door). The trigger fires while
 * the foot box overlaps it, so it is made `FOOT_W` narrower than the mat: it fires exactly while the character's feet
 * (their middle) are over the mat, and not when the character stands beside it. A building without a mat keeps its tiles.
 */
function buildDoors(triggers: readonly MapTrigger[], outdoor: boolean, props?: readonly MapProp[]): DoorTrigger[] {
  return triggers
    .filter((trigger) => trigger.type === "door")
    .map((trigger) => {
      const at = tileCenter(trigger.to.tile[0], trigger.to.tile[1]);
      const rect = tileBox(trigger.rect);
      if (outdoor) rect.h -= OUTDOOR_DOOR_TRIM;
      const mat = props && findEntranceMat(trigger.rect, props);
      if (mat) {
        rect.w = entranceMatWidth(mat) - FOOT_W;
        rect.x = mat.x - rect.w / 2;
      }
      return {
        rect,
        to: { scene: trigger.to.scene, x: at.x, y: at.y, facing: (trigger.to.facing ?? "up") as Facing },
        ...(trigger.when ? { when: trigger.when } : {}),
        ...(trigger.locked ? { locked: trigger.locked } : {}),
      };
    });
}

function buildExamine(entries: readonly MapExamine[]): ExaminePoint[] {
  return entries.map((entry) => {
    const [w, h] = entry.size ?? DEFAULT_EXAMINE_SIZE;
    const c = tileCenter(entry.tile[0], entry.tile[1]);
    return { id: entry.id, text: entry.text, area: { x: c.x - w / 2, y: c.y - h / 2, w, h }, ...(entry.action ? { action: entry.action } : {}), ...(entry.when ? { when: entry.when } : {}) };
  });
}

function buildObjects(entries: readonly MapObject[] | undefined): SceneObject[] {
  return (entries ?? []).map((entry): SceneObject => {
    switch (entry.type) {
      case "pickup": {
        const at = tileCenter(entry.tile[0], entry.tile[1]);
        return { id: entry.id, type: "pickup", x: at.x, y: at.y, prop: entry.prop, autoCollect: entry.autoCollect, ...(entry.look ? { look: entry.look } : {}), ...(entry.prompt ? { prompt: entry.prompt } : {}), ...(entry.when ? { when: entry.when } : {}) };
      }
      case "hazard": {
        const at = tileCenter(entry.tile[0], entry.tile[1]);
        return { id: entry.id, type: "hazard", x: at.x, y: at.y, ...(entry.prop ? { prop: entry.prop } : {}) };
      }
      case "ball": {
        const at = tileCenter(entry.tile[0], entry.tile[1]);
        return { id: entry.id, type: "ball", x: at.x, y: at.y, rect: tileBox(entry.bounds) };
      }
      case "decor":
        return { id: entry.id, type: "decor", x: entry.at[0], y: entry.at[1], prop: entry.prop, when: entry.when };
      case "barrier": {
        const rect = tileBox(entry.rect);
        return { id: entry.id, type: "barrier", x: rect.x + rect.w / 2, y: rect.y + rect.h, rect, when: entry.when };
      }
      case "goal":
      case "gate": {
        const rect = tileBox(entry.rect);
        return { id: entry.id, type: entry.type, x: rect.x + rect.w / 2, y: rect.y + rect.h, rect };
      }
    }
  });
}

function buildSpectators(entries: readonly MapSpectator[] | undefined): SpectatorSpawn[] {
  return (entries ?? []).map((entry) => {
    const at = tileCenter(entry.tile[0], entry.tile[1]);
    return { cast: entry.cast, x: at.x, y: at.y, ...(entry.when ? { when: entry.when } : {}) };
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
  const solids = data.collision.map(pxBox);
  const buildings: BuildingInstance[] = data.buildings.map((b) => {
    const box = tileSpan(b.rect);
    const inside = solids.filter((s) => s.x >= box.x && s.y >= box.y && s.x + s.w <= box.x + box.w && s.y + s.h <= box.y + box.h);
    return { id: b.id, x: box.x + box.w / 2, y: box.y + box.h, w: box.w, h: box.h, key: `buildings/${b.id}`, fronts: buildingFronts(box, inside) };
  });
  const { colliders, colliderRects } = indexColliders(props, solids);
  const zones: SceneZone[] = data.zones.map((zone) => ({ id: zone.id, name: zone.name, rect: tileSpan(zone.rect), tint: zone.tint, ...(zone.particles ? { particles: zone.particles } : {}), ...(zone.bgm ? { bgm: zone.bgm } : {}) }));
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
    doors: buildDoors(data.triggers, true, data.props),
    examine: buildExamine(data.examine),
    objects: buildObjects(data.objects),
    spectators: [],
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
    spectators: buildSpectators(data.spectators),
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
