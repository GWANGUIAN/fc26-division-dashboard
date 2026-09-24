// Fixed-capacity pool of one-shot strip effects (docs/pitch/01 §7: nothing is allocated inside the frame loop):
// save sparkles, celebration bursts, stars on a sweet-spot kick. Each effect plays a strip of `frames` frames once
// over `life` seconds while drifting; a missing image draws a small shape in `color` instead. Slots are recycled
// in place, the oldest one is overwritten when the pool is full.

import type { AssetImage } from "./assets";
import { drawStripFrame } from "./sprite";

export interface Effect {
  active: boolean;
  key: string;
  frames: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  scale: number;
  /** Placeholder colour when the image is missing. */
  color: string;
}

export interface EffectSpec {
  key: string;
  frames: number;
  /** Bottom-centre anchor of the frame. */
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  life: number;
  scale?: number;
  color?: string;
}

export interface EffectPool {
  readonly items: readonly Effect[];
  readonly activeCount: number;
  spawn(spec: EffectSpec): void;
  update(dt: number): void;
  clear(): void;
}

export function createEffectPool(capacity: number): EffectPool {
  const items: Effect[] = Array.from({ length: capacity }, () => ({
    active: false,
    key: "",
    frames: 1,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    age: 0,
    life: 1,
    scale: 1,
    color: "#ffffff",
  }));
  let cursor = 0;
  let activeCount = 0;

  return {
    items,
    get activeCount() {
      return activeCount;
    },
    spawn(spec) {
      const slot = items[cursor]!;
      cursor = (cursor + 1) % capacity;
      if (!slot.active) activeCount++;
      slot.active = true;
      slot.key = spec.key;
      slot.frames = spec.frames;
      slot.x = spec.x;
      slot.y = spec.y;
      slot.vx = spec.vx ?? 0;
      slot.vy = spec.vy ?? 0;
      slot.age = 0;
      slot.life = spec.life;
      slot.scale = spec.scale ?? 1;
      slot.color = spec.color ?? "#ffffff";
    },
    update(dt) {
      for (const effect of items) {
        if (!effect.active) continue;
        effect.age += dt;
        if (effect.age >= effect.life) {
          effect.active = false;
          activeCount--;
          continue;
        }
        effect.x += effect.vx * dt;
        effect.y += effect.vy * dt;
      }
    },
    clear() {
      for (const effect of items) effect.active = false;
      activeCount = 0;
    },
  };
}

/** Frame an effect shows: the strip spread evenly over its life. */
export function effectFrame(effect: Pick<Effect, "age" | "life" | "frames">) {
  return Math.min(effect.frames - 1, Math.floor((effect.age / effect.life) * effect.frames));
}

/** Draws every live effect; `image` looks an asset up (undefined → placeholder). Fades out over the last 30%. */
export function drawEffects(g: CanvasRenderingContext2D, pool: EffectPool, image: (key: string) => AssetImage | undefined) {
  if (pool.activeCount === 0) return;
  for (const effect of pool.items) {
    if (!effect.active) continue;
    const t = effect.age / effect.life;
    const alpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
    const sprite = image(effect.key);
    if (sprite) {
      drawStripFrame(g, sprite, effect.frames, effectFrame(effect), effect.x, effect.y, { scale: effect.scale, alpha });
    } else {
      const r = Math.max(2, Math.round(6 * effect.scale * (0.6 + 0.8 * t)));
      g.save();
      g.globalAlpha = alpha;
      g.fillStyle = effect.color;
      g.fillRect(Math.round(effect.x) - r, Math.round(effect.y) - 2 * r, r * 2, r * 2);
      g.restore();
    }
  }
}
