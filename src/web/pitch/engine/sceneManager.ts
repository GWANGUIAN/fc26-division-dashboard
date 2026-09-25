// Scene stack + transitions (docs/pitch/01 §3-3, 03 §6). Only the top scene updates and receives input;
// scenes underneath an overlay keep rendering. A `replace` runs a cover → swap → reveal transition
// (diagonal wipe 0.35s, or a fade when `prefers-reduced-motion` / asked for) and blocks input meanwhile.

import type { PitchAssets } from "./assets";
import type { PitchAudioLike } from "../audio/pitchAudio";
import type { PitchInput } from "./input";

export interface KeyInput {
  code: string;
}

export interface PointerInput {
  type: "move" | "down" | "up";
  /** Logical 960×540 coordinates. */
  x: number;
  y: number;
}

export type CursorKind = "default" | "pointer";

/** What the surrounding React component offers to scenes. */
export interface SceneHost {
  assets: PitchAssets;
  /** Held-key state for movement (press edges still arrive through Scene.onKey). */
  input: Pick<PitchInput, "isDown">;
  /** False while key presses cannot reach the game (window unfocused, or focus sits on a button/link) — shows "클릭해서 시작". */
  hasKeyboardFocus(): boolean;
  goDashboard(): void;
  setCursor(kind: CursorKind): void;
  /** Sound (docs/pitch/06). Optional so a scene can run without one (tests): missing = silence. */
  audio?: PitchAudioLike;
  /** `prefers-reduced-motion`: scenes skip camera shake and flashes. Missing = false. */
  reducedMotion?(): boolean;
  /** Screen-reader text for canvas-only state (the stat screen's selected axis); "" clears it. Missing = nothing. */
  announce?(text: string): void;
  /** Opens the full-screen 잔디동 playlist popup over the canvas; `onClose` runs when it is closed. Missing = nothing happens. */
  openPlaylist?(onClose: () => void): void;
  /** Opens the dashboard's "나만의 스쿼드 빌더" popup over the canvas (it loads the roster itself); `onClose` runs when it is closed. */
  openSquad?(onClose: () => void): void;
}

export interface SceneCtx {
  readonly width: number;
  readonly height: number;
  readonly manager: SceneManager;
  readonly host: SceneHost;
}

export interface Scene {
  enter?(ctx: SceneCtx, params?: unknown): void;
  exit?(): void;
  update(dt: number): void;
  render(g: CanvasRenderingContext2D): void;
  onKey?(e: KeyInput): void;
  onPointer?(e: PointerInput): void;
  /** Mouse wheel over the canvas (`deltaY` > 0 = down). */
  onWheel?(deltaY: number): void;
}

export type TransitionKind = "wipe" | "fade" | "none";

export const WIPE_SECONDS = 0.35;
export const FADE_SECONDS = 0.3;
export const REDUCED_MOTION_FADE_SECONDS = 0.1;

interface ActiveTransition {
  duration: number;
  kind: Exclude<TransitionKind, "none">;
  elapsed: number;
  swapped: boolean;
  swap: () => void;
}

export interface SceneManagerOptions {
  width: number;
  height: number;
  host: SceneHost;
  reducedMotion?: () => boolean;
}

export interface SceneManager {
  /** Top-most scene, or undefined when the stack is empty. */
  readonly top: Scene | undefined;
  readonly depth: number;
  /** 0..1 while a transition runs, otherwise null. */
  readonly transitionProgress: number | null;
  /** Replaces the whole stack with `scene`. Instant when the stack is empty or `transition` is "none". */
  replace(scene: Scene, params?: unknown, options?: { transition?: TransitionKind }): void;
  /** Stacks an overlay on top; the scene below is paused but still drawn. */
  push(scene: Scene, params?: unknown): void;
  /** Removes the top scene (never the last one). */
  pop(): void;
  update(dt: number): void;
  render(g: CanvasRenderingContext2D): void;
  key(code: string): void;
  pointer(e: PointerInput): void;
  wheel(deltaY: number): void;
  /** Exits every scene. */
  dispose(): void;
}

export function createSceneManager({ width, height, host, reducedMotion = () => false }: SceneManagerOptions): SceneManager {
  const stack: Scene[] = [];
  let transition: ActiveTransition | null = null;

  const ctx: SceneCtx = { width, height, host, get manager() { return manager; } };

  const enterScene = (scene: Scene, params?: unknown) => {
    stack.push(scene);
    scene.enter?.(ctx, params);
  };
  const clearStack = () => {
    while (stack.length > 0) stack.pop()?.exit?.();
  };

  const manager: SceneManager = {
    get top() {
      return stack[stack.length - 1];
    },
    get depth() {
      return stack.length;
    },
    get transitionProgress() {
      return transition ? Math.min(1, transition.elapsed / transition.duration) : null;
    },

    replace(scene, params, options) {
      const kind = options?.transition ?? "wipe";
      const swap = () => {
        clearStack();
        enterScene(scene, params);
      };
      if (stack.length === 0 || kind === "none") {
        transition = null;
        swap();
        return;
      }
      const reduced = reducedMotion();
      const effective = reduced ? "fade" : kind;
      const duration = reduced ? REDUCED_MOTION_FADE_SECONDS : effective === "wipe" ? WIPE_SECONDS : FADE_SECONDS;
      // A second replace while one is running just retargets the pending swap.
      if (transition && !transition.swapped) {
        transition.swap = swap;
        return;
      }
      transition = { duration, kind: effective, elapsed: 0, swapped: false, swap };
    },

    push(scene, params) {
      enterScene(scene, params);
    },

    pop() {
      if (stack.length <= 1) return;
      stack.pop()?.exit?.();
    },

    update(dt) {
      if (transition) {
        transition.elapsed += dt;
        if (!transition.swapped && transition.elapsed >= transition.duration / 2) {
          transition.swapped = true;
          transition.swap();
        }
        if (transition.elapsed >= transition.duration) transition = null;
      }
      stack[stack.length - 1]?.update(dt);
    },

    render(g) {
      for (const scene of stack) scene.render(g);
      if (transition) {
        const progress = Math.min(1, transition.elapsed / transition.duration);
        const cover = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
        if (transition.kind === "wipe") drawWipe(g, width, height, cover);
        else drawFade(g, width, height, cover);
      }
    },

    key(code) {
      if (transition) return;
      stack[stack.length - 1]?.onKey?.({ code });
    },

    pointer(e) {
      if (transition) return;
      stack[stack.length - 1]?.onPointer?.(e);
    },

    wheel(deltaY) {
      if (transition) return;
      stack[stack.length - 1]?.onWheel?.(deltaY);
    },

    dispose() {
      transition = null;
      clearStack();
    },
  };
  return manager;
}

const WIPE_SLANT = 120;

/** Navy slab sweeping in from the left with a slanted leading edge; `cover` 0 = nothing, 1 = full screen. */
export function drawWipe(g: CanvasRenderingContext2D, width: number, height: number, cover: number) {
  if (cover <= 0) return;
  const edge = -WIPE_SLANT + (width + WIPE_SLANT) * Math.min(1, cover);
  g.save();
  g.fillStyle = "#0a0a1a";
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(edge + WIPE_SLANT, 0);
  g.lineTo(edge, height);
  g.lineTo(0, height);
  g.closePath();
  g.fill();
  // mint trim on the leading edge
  g.strokeStyle = "#3ee6c1";
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(edge + WIPE_SLANT, 0);
  g.lineTo(edge, height);
  g.stroke();
  g.restore();
}

export function drawFade(g: CanvasRenderingContext2D, width: number, height: number, cover: number) {
  if (cover <= 0) return;
  g.save();
  g.globalAlpha = Math.min(1, cover);
  g.fillStyle = "#05060f";
  g.fillRect(0, 0, width, height);
  g.restore();
}
