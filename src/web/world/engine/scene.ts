import type { Rect, SceneId } from "../types";
import { SpatialHash } from "./collision";
import type { Size } from "./camera";

/** A sprite placed in a scene. (x, y) is the bottom centre — the point that sorts against the player's feet. */
export interface PropInstance {
  /** Asset key, e.g. "props/tree-oak". */
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Collision footprint centred on (x, y) and ending at y, or none for walk-through decoration. */
  collider?: { w: number; h: number };
}

export interface WorldScene {
  id: SceneId;
  size: Size;
  /** Area the character's foot box must stay inside. */
  walkable: Rect;
  colliders: SpatialHash;
  /** The same rects as `colliders`, for the debug overlay. */
  colliderRects: Rect[];
  props: PropInstance[];
  spawn: { x: number; y: number };
  /** Interiors use a fixed camera; overworld scenes follow the player. */
  fixedCamera: boolean;
}

export function propCollider(prop: PropInstance): Rect | null {
  if (!prop.collider) return null;
  return { x: prop.x - prop.collider.w / 2, y: prop.y - prop.collider.h, w: prop.collider.w, h: prop.collider.h };
}

export function buildScene(base: Omit<WorldScene, "colliders" | "colliderRects">, extraColliders: Rect[] = []): WorldScene {
  const colliders = new SpatialHash(64);
  const colliderRects: Rect[] = [];
  const add = (rect: Rect) => {
    colliders.insert(rect);
    colliderRects.push(rect);
  };
  for (const prop of base.props) {
    const rect = propCollider(prop);
    if (rect) add(rect);
  }
  extraColliders.forEach(add);
  return { ...base, colliders, colliderRects };
}

export const FADE_SECONDS = 0.25;

/**
 * Door/teleport transition (docs/world/01 §5): fade out, swap the scene while the screen is black,
 * fade in. `alpha` is the black overlay opacity. Input should be disabled while `active`.
 */
export class SceneTransition {
  private phase: "idle" | "out" | "in" = "idle";
  private elapsed = 0;
  private pendingSwap: (() => void) | null = null;

  constructor(private readonly duration = FADE_SECONDS) {}

  get active() {
    return this.phase !== "idle";
  }

  get alpha() {
    if (this.phase === "out") return Math.min(1, this.elapsed / this.duration);
    if (this.phase === "in") return Math.max(0, 1 - this.elapsed / this.duration);
    return 0;
  }

  /** Begins a transition; `swap` runs once, at the moment the screen is fully black. Ignored while one is running. */
  start(swap: () => void): boolean {
    if (this.active) return false;
    this.phase = "out";
    this.elapsed = 0;
    this.pendingSwap = swap;
    return true;
  }

  update(dt: number) {
    if (this.phase === "idle") return;
    this.elapsed += dt;
    if (this.phase === "out" && this.elapsed >= this.duration) {
      this.pendingSwap?.();
      this.pendingSwap = null;
      this.phase = "in";
      this.elapsed = 0;
    } else if (this.phase === "in" && this.elapsed >= this.duration) {
      this.phase = "idle";
      this.elapsed = 0;
    }
  }
}
