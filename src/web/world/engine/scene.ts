import type { PropFoot } from "../data/propDefs";
import type { CastId, Facing, NpcAi, Rect, SceneId } from "../types";
import type { Size } from "./camera";
import { SpatialHash } from "./collision";

/** A sprite placed in a scene. (x, y) is the bottom centre — the point that sorts against the player's feet. */
export interface PropInstance {
  /** Prop id from propDefs, e.g. "tree-oak". */
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Collision footprints, empty for walk-through decoration. */
  foot: PropFoot[];
  /** Everything higher than this many px above the base is redrawn over the player (canopies, arch spans). */
  aboveFrom: number | null;
  /** Flat ground art: drawn under every entity, not sorted. */
  decal: boolean;
  /** A `-withered` twin of the image exists. */
  withered: boolean;
}

/** A building sprite, anchored at the bottom centre of its tile box. */
export interface BuildingInstance {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Asset key, e.g. "buildings/clubhouse". */
  key: string;
}

export interface DoorTrigger {
  rect: Rect;
  to: { scene: SceneId; x: number; y: number; facing: Facing };
}

export interface ExaminePoint {
  id?: string;
  area: Rect;
  text: string;
}

export interface NpcSpawn {
  /** Unique within the scene (cast id + index). */
  key: string;
  cast: CastId;
  x: number;
  y: number;
  ai: NpcAi;
  wander?: Rect;
  when?: string;
}

export interface SceneZone {
  id: string;
  name: string;
  /** Pixel rect. */
  rect: Rect;
  tint: string;
  bgm?: string;
}

/** Decoded terrain: legend index per tile plus the legend's "sheet/slot" strings. */
export interface TerrainGrid {
  cols: number;
  rows: number;
  cells: Uint8Array;
  codes: string[];
  /** Zone index (into `WorldScene.zones`) per tile. */
  zoneCells: Uint8Array;
}

export interface WorldScene {
  id: SceneId;
  kind: "overworld" | "interior";
  size: Size;
  /** Area the character's foot box must stay inside. */
  walkable: Rect;
  colliders: SpatialHash;
  /** The same rects as `colliders`, for the debug overlay. */
  colliderRects: Rect[];
  props: PropInstance[];
  buildings: BuildingInstance[];
  npcSpawns: NpcSpawn[];
  doors: DoorTrigger[];
  examine: ExaminePoint[];
  /** Default entry point (feet) — where the debug teleport and a broken save land. */
  spawn: { x: number; y: number };
  /** Interiors use a fixed camera; overworld scenes follow the player. */
  fixedCamera: boolean;
  terrain?: TerrainGrid;
  zones: SceneZone[];
  /** Interior room image asset key. */
  image?: string;
}

/** Collision rect of one footprint entry, centred on the prop's feet and ending at the feet line. */
export function footRect(prop: { x: number; y: number }, foot: PropFoot): Rect {
  return { x: prop.x + foot.dx - foot.w / 2, y: prop.y - foot.h, w: foot.w, h: foot.h };
}

export function propColliders(prop: PropInstance): Rect[] {
  return prop.foot.map((foot) => footRect(prop, foot));
}

export function indexColliders(props: readonly PropInstance[], extra: readonly Rect[] = []): { colliders: SpatialHash; colliderRects: Rect[] } {
  const colliders = new SpatialHash(64);
  const colliderRects: Rect[] = [];
  const add = (rect: Rect) => {
    colliders.insert(rect);
    colliderRects.push(rect);
  };
  for (const prop of props) for (const rect of propColliders(prop)) add(rect);
  extra.forEach(add);
  return { colliders, colliderRects };
}

/** Zone index at a pixel position on a terrain grid, or -1 when the scene has none. */
export function zoneIndexAt(scene: Pick<WorldScene, "terrain">, x: number, y: number, tile = 32): number {
  const grid = scene.terrain;
  if (!grid) return -1;
  const tx = Math.min(Math.max(Math.floor(x / tile), 0), grid.cols - 1);
  const ty = Math.min(Math.max(Math.floor(y / tile), 0), grid.rows - 1);
  return grid.zoneCells[ty * grid.cols + tx] ?? -1;
}

export const FADE_SECONDS = 0.25;

/**
 * Door/teleport transition (docs/world/01 §5): fade out, swap the scene while the screen is black,
 * fade in. `swap` may return a promise (the interior image loads during the fade, docs/world/01 §8);
 * the screen stays black until it settles. `alpha` is the black overlay opacity. Input should be
 * disabled while `active`.
 */
export class SceneTransition {
  private phase: "idle" | "out" | "hold" | "in" = "idle";
  private elapsed = 0;
  private pendingSwap: (() => void | Promise<void>) | null = null;

  constructor(private readonly duration = FADE_SECONDS) {}

  get active() {
    return this.phase !== "idle";
  }

  get alpha() {
    if (this.phase === "out") return Math.min(1, this.elapsed / this.duration);
    if (this.phase === "hold") return 1;
    if (this.phase === "in") return Math.max(0, 1 - this.elapsed / this.duration);
    return 0;
  }

  /** Begins a transition; `swap` runs once, at the moment the screen is fully black. Ignored while one is running. */
  start(swap: () => void | Promise<void>): boolean {
    if (this.active) return false;
    this.phase = "out";
    this.elapsed = 0;
    this.pendingSwap = swap;
    return true;
  }

  private beginFadeIn() {
    this.phase = "in";
    this.elapsed = 0;
  }

  update(dt: number) {
    if (this.phase === "idle" || this.phase === "hold") return;
    this.elapsed += dt;
    if (this.phase === "out" && this.elapsed >= this.duration) {
      const swap = this.pendingSwap;
      this.pendingSwap = null;
      let result: void | Promise<void> = undefined;
      try {
        result = swap?.();
      } catch {
        result = undefined;
      }
      if (result && typeof (result as Promise<void>).then === "function") {
        this.phase = "hold";
        const settle = () => {
          if (this.phase === "hold") this.beginFadeIn();
        };
        (result as Promise<void>).then(settle, settle);
      } else {
        this.beginFadeIn();
      }
    } else if (this.phase === "in" && this.elapsed >= this.duration) {
      this.phase = "idle";
      this.elapsed = 0;
    }
  }
}
