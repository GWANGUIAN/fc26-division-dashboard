import type { CastDef, Facing, Rect } from "../types";
import type { WorldAssets } from "../worldAssets";
import type { Camera } from "./camera";
import type { PropInstance, WorldScene } from "./scene";
import { SANDBOX_BORDER } from "../data/sandboxMap";

export const VIEW_WIDTH = 640;
export const VIEW_HEIGHT = 360;
export const CHAR_FRAME_W = 48;
export const CHAR_FRAME_H = 64;
/** Pixels between the sprite's soles and the bottom of its atlas cell (docs/world/08 §3). */
export const CHAR_FOOT_INSET = 4;

const TILE = 32;
const GRASS_TILES = 4; // grass-a … grass-d are the first four cells of terrain/core (128×128 sheet, 4×4)

/** Deterministic tile picker so the meadow looks varied but identical on every visit. */
export function tileHash(tx: number, ty: number): number {
  let h = Math.imul(tx, 374761393) + Math.imul(ty, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

/** Pre-renders the whole ground once (S2 replaces this with 512px chunks + lush/withered variants). */
export function buildGroundCanvas(assets: WorldAssets, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  const sheet = assets.get("terrain/core");
  if (!sheet) {
    ctx.fillStyle = "#3f9e46"; // placeholder meadow
    ctx.fillRect(0, 0, width, height);
    return canvas;
  }
  for (let ty = 0; ty < height / TILE; ty++) {
    for (let tx = 0; tx < width / TILE; tx++) {
      const pick = tileHash(tx, ty) % GRASS_TILES;
      ctx.drawImage(sheet, pick * TILE, 0, TILE, TILE, tx * TILE, ty * TILE, TILE, TILE);
    }
  }
  return canvas;
}

export function drawProp(ctx: CanvasRenderingContext2D, assets: WorldAssets, prop: PropInstance, camera: Camera) {
  const x = Math.round(prop.x - prop.w / 2 - camera.x);
  const y = Math.round(prop.y - prop.h - camera.y);
  const image = assets.get(prop.key);
  if (image) {
    ctx.drawImage(image, x, y, prop.w, prop.h);
    return;
  }
  // Placeholder: a tinted block over the sprite's footprint so collisions stay understandable.
  ctx.fillStyle = "#8a6d3b";
  ctx.fillRect(x, y + prop.h - (prop.collider?.h ?? 8) - 4, prop.w, (prop.collider?.h ?? 8) + 4);
}

export interface PlayerView {
  x: number;
  y: number;
  facing: Facing;
  moving: boolean;
  running: boolean;
  animTime: number;
}

const WALK_ROW: Record<Facing, number> = { down: 1, right: 2, left: 2, up: 3 };
const IDLE_COL: Record<Facing, number> = { down: 0, right: 1, up: 2, left: 1 };

/** Draws the player from its 192×256 atlas (idle row + 3 walk rows), or a coloured placeholder. */
export function drawPlayer(ctx: CanvasRenderingContext2D, assets: WorldAssets, cast: CastDef, view: PlayerView, camera: Camera) {
  const screenX = Math.round(view.x - camera.x);
  const screenY = Math.round(view.y - camera.y);
  const atlas = assets.get(`characters/${cast.id}-atlas`);
  if (!atlas) {
    ctx.fillStyle = cast.themeColor;
    ctx.fillRect(screenX - 10, screenY - 40, 20, 40);
    ctx.fillStyle = "#0b1614";
    ctx.font = "12px Galmuri11, monospace";
    ctx.textAlign = "center";
    ctx.fillText(cast.displayName.slice(0, 1), screenX, screenY - 22);
    return;
  }
  let sx: number;
  let sy: number;
  if (view.moving) {
    const fps = view.running ? 12 : 8;
    sx = (Math.floor(view.animTime * fps) % 4) * CHAR_FRAME_W;
    sy = WALK_ROW[view.facing] * CHAR_FRAME_H;
  } else {
    sx = IDLE_COL[view.facing] * CHAR_FRAME_W;
    sy = 0;
  }
  const dx = screenX - CHAR_FRAME_W / 2;
  const dy = screenY - (CHAR_FRAME_H - CHAR_FOOT_INSET);
  if (view.facing === "left") {
    ctx.save();
    ctx.translate(screenX, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(atlas, sx, sy, CHAR_FRAME_W, CHAR_FRAME_H, -CHAR_FRAME_W / 2, dy, CHAR_FRAME_W, CHAR_FRAME_H);
    ctx.restore();
  } else {
    ctx.drawImage(atlas, sx, sy, CHAR_FRAME_W, CHAR_FRAME_H, dx, dy, CHAR_FRAME_W, CHAR_FRAME_H);
  }
}

/** Darkens the impassable border band so the edge of the walkable area is visible. */
export function drawBorderShade(ctx: CanvasRenderingContext2D, scene: WorldScene, camera: Camera) {
  ctx.fillStyle = "rgba(4, 22, 14, 0.55)";
  const { w, h } = scene.size;
  const b = SANDBOX_BORDER;
  const strips: Rect[] = [
    { x: 0, y: 0, w, h: b },
    { x: 0, y: h - b, w, h: b },
    { x: 0, y: b, w: b, h: h - b * 2 },
    { x: w - b, y: b, w: b, h: h - b * 2 },
  ];
  for (const s of strips) ctx.fillRect(Math.round(s.x - camera.x), Math.round(s.y - camera.y), s.w, s.h);
}

export interface DebugStats {
  fps: number;
  frameMs: number;
  scale: string;
  assets: string;
}

/** `?worldDebug` overlay: colliders, foot box, walkable bounds, tile grid and a stats panel. */
export function drawDebug(
  ctx: CanvasRenderingContext2D,
  scene: WorldScene,
  camera: Camera,
  player: { x: number; y: number; box: Rect; facing: Facing },
  stats: DebugStats,
) {
  ctx.save();
  ctx.lineWidth = 1;

  ctx.strokeStyle = "rgba(255, 255, 255, 0.10)";
  ctx.beginPath();
  for (let x = Math.ceil(camera.x / TILE) * TILE; x < camera.x + VIEW_WIDTH; x += TILE) {
    ctx.moveTo(Math.round(x - camera.x) + 0.5, 0);
    ctx.lineTo(Math.round(x - camera.x) + 0.5, VIEW_HEIGHT);
  }
  for (let y = Math.ceil(camera.y / TILE) * TILE; y < camera.y + VIEW_HEIGHT; y += TILE) {
    ctx.moveTo(0, Math.round(y - camera.y) + 0.5);
    ctx.lineTo(VIEW_WIDTH, Math.round(y - camera.y) + 0.5);
  }
  ctx.stroke();

  const outline = (rect: Rect, color: string) => {
    ctx.strokeStyle = color;
    ctx.strokeRect(Math.round(rect.x - camera.x) + 0.5, Math.round(rect.y - camera.y) + 0.5, rect.w - 1, rect.h - 1);
  };
  outline(scene.walkable, "#ffd54a");
  for (const rect of scene.colliderRects) outline(rect, "#ff4d4d");
  outline(player.box, "#4dff88");

  const lines = [
    `pos ${player.x.toFixed(1)}, ${player.y.toFixed(1)}  tile ${Math.floor(player.x / TILE)}, ${Math.floor(player.y / TILE)}  ${player.facing}`,
    `cam ${Math.round(camera.x)}, ${Math.round(camera.y)}  scale ${stats.scale}`,
    `fps ${stats.fps.toFixed(0)}  frame ${stats.frameMs.toFixed(1)}ms  colliders ${scene.colliderRects.length}`,
    `assets ${stats.assets}`,
  ];
  ctx.font = "10px Galmuri11, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  ctx.fillRect(4, 4, 262, lines.length * 12 + 6);
  ctx.fillStyle = "#b8ffe8";
  lines.forEach((line, index) => ctx.fillText(line, 8, 7 + index * 12));
  ctx.restore();
}
