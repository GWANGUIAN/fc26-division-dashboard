import { getCast } from "../data/worldCast";
import { SANDBOX_SCENE } from "../data/sandboxMap";
import { saveWorldSave } from "../storage";
import type { CastId, Facing, WorldSave } from "../types";
import type { WorldAssets } from "../worldAssets";
import { followCamera, snapCamera, type Camera } from "./camera";
import { footBox, moveAndSlide, rectsOverlap } from "./collision";
import { createInput } from "./input";
import { createLoop } from "./loop";
import { VIEW_HEIGHT, VIEW_WIDTH, buildGroundCanvas, drawBorderShade, drawDebug, drawPlayer, drawProp } from "./render";
import type { WorldScene } from "./scene";

export const WALK_SPEED = 90;
export const RUN_SPEED = 150;
const AUTOSAVE_SECONDS = 5;

export interface WorldEngineOptions {
  canvas: HTMLCanvasElement;
  assets: WorldAssets;
  playerId: CastId;
  save: WorldSave;
  debug: boolean;
  /** Human-readable scale for the debug panel (the overlay knows the layout, the engine does not). */
  getScaleLabel?: () => string;
}

export interface WorldEngine {
  start(): void;
  /** Stops the loop and writes the current position to the save. */
  destroy(): void;
}

/** Player facing after moving with input (vx, vy): keep the current facing while a diagonal still includes it. */
export function facingFor(vx: number, vy: number, current: Facing): Facing {
  if (vx !== 0 && vy === 0) return vx < 0 ? "left" : "right";
  if (vy !== 0 && vx === 0) return vy < 0 ? "up" : "down";
  if (vx === 0 && vy === 0) return current;
  const horizontal: Facing = vx < 0 ? "left" : "right";
  const vertical: Facing = vy < 0 ? "up" : "down";
  return current === horizontal || current === vertical ? current : horizontal;
}

export function createWorldEngine(options: WorldEngineOptions): WorldEngine {
  const { canvas, assets, playerId, save, debug } = options;
  const ctx = canvas.getContext("2d", { alpha: false })!;
  ctx.imageSmoothingEnabled = false;

  const cast = getCast(playerId);
  const scene: WorldScene = SANDBOX_SCENE;
  const input = createInput();
  const ground = buildGroundCanvas(assets, scene.size.w, scene.size.h);

  // The saved position may belong to an older map layout: fall back to the spawn if it is not usable.
  const start = footBox(save.x, save.y);
  const usable =
    save.scene === scene.id &&
    start.x >= scene.walkable.x && start.x + start.w <= scene.walkable.x + scene.walkable.w &&
    start.y >= scene.walkable.y && start.y + start.h <= scene.walkable.y + scene.walkable.h &&
    scene.colliders.query(start).every((rect) => !rectsOverlap(start, rect));
  const player = {
    x: usable ? save.x : scene.spawn.x,
    y: usable ? save.y : scene.spawn.y,
    facing: save.facing,
    moving: false,
    running: false,
    animTime: 0,
  };
  const view = { w: VIEW_WIDTH, h: VIEW_HEIGHT };
  let camera: Camera = followCamera({ x: 0, y: 0 }, player, view, scene.size, { snap: true });

  let sinceSave = 0;
  let fps = 60;
  let frameMs = 16;

  function persist() {
    saveWorldSave({ ...save, player: playerId, scene: scene.id, x: player.x, y: player.y, facing: player.facing });
  }

  function update(dt: number) {
    const move = input.move();
    player.running = input.isDown("run");
    player.moving = move.x !== 0 || move.y !== 0;
    if (player.moving) {
      const speed = (player.running ? RUN_SPEED : WALK_SPEED) * dt;
      const box = footBox(player.x, player.y);
      const result = moveAndSlide(box, move.x * speed, move.y * speed, scene.colliders, scene.walkable);
      // Blocked outright (walking straight into a wall) reads as standing still, not as a walk cycle.
      const moved = Math.abs(result.x - box.x) > 1e-6 || Math.abs(result.y - box.y) > 1e-6;
      player.x = result.x + box.w / 2;
      player.y = result.y + box.h;
      player.moving = moved;
      player.facing = facingFor(move.x, move.y, player.facing);
      player.animTime = moved ? player.animTime + dt : 0;
    } else {
      player.animTime = 0;
    }
    camera = followCamera(camera, player, view, scene.size, { dt });
    input.consumePressed("interact"); // nothing to interact with in S1; keep the edge queue empty
    input.consumePressed("log");
    input.consumePressed("map");

    sinceSave += dt;
    if (sinceSave >= AUTOSAVE_SECONDS) {
      sinceSave = 0;
      persist();
    }
  }

  function render(_alpha: number, frameSeconds: number) {
    if (frameSeconds > 0) {
      fps += (1 / frameSeconds - fps) * 0.1;
      frameMs += (frameSeconds * 1000 - frameMs) * 0.1;
    }
    const cam = snapCamera(camera);
    ctx.fillStyle = "#04120c";
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.drawImage(ground, -cam.x, -cam.y);
    drawBorderShade(ctx, scene, cam);

    // y-sort: everything with feet is drawn back-to-front by its foot y (docs/world/01 §5 layer 3).
    const drawables: { y: number; draw: () => void }[] = scene.props.map((prop) => ({ y: prop.y, draw: () => drawProp(ctx, assets, prop, cam) }));
    drawables.push({ y: player.y, draw: () => drawPlayer(ctx, assets, cast, player, cam) });
    drawables.sort((a, b) => a.y - b.y);
    for (const item of drawables) item.draw();

    if (debug) {
      drawDebug(ctx, scene, cam, { ...player, box: footBox(player.x, player.y) }, {
        fps,
        frameMs,
        scale: options.getScaleLabel?.() ?? "-",
        assets: `${["terrain/core", `characters/${playerId}-atlas`].filter((key) => assets.has(key)).length}/2 core`,
      });
    }
  }

  const loop = createLoop({ update, render });
  return {
    start() {
      input.attach();
      loop.start();
    },
    destroy() {
      loop.stop();
      input.detach();
      persist();
    },
  };
}
