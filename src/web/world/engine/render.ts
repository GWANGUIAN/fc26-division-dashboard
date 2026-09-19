import type { CastDef, Facing, Rect } from "../types";
import type { WorldAssets } from "../worldAssets";
import type { MarkerKind } from "../state/missions";
import { BALL_SIZE, ballBox, type Ball } from "./ball";
import type { Camera } from "./camera";
import { footBox } from "./collision";
import { INTERACT_REACH, interactionProbe, npcHitArea } from "./interaction";
import { NPC_BOX, type Npc } from "./npc";
import type { RunHud } from "./runs";
import type { BuildingInstance, PropInstance, SceneObject, WorldScene } from "./scene";

export const VIEW_WIDTH = 640;
export const VIEW_HEIGHT = 360;
export const TILE = 32;
export const CHAR_FRAME_W = 48;
export const CHAR_FRAME_H = 64;
/** Pixels between the sprite's soles and the bottom of its atlas cell (docs/world/08 §3). */
export const CHAR_FOOT_INSET = 4;
export const ANIMAL_FRAME = 32;
export const ANIMAL_FOOT_INSET = 2;

const FONT = "Galmuri11, monospace";

// ── static scenery ────────────────────────────────────────────────────────────────────────

export interface StaticDrawable {
  sortY: number;
  /** 0 = prop, 1 = building. */
  kind: 0 | 1;
  index: number;
}

/** Props and buildings sorted back-to-front by their feet line (docs/world/01 §5 layer 3). Decals are excluded. */
export function buildStaticOrder(scene: Pick<WorldScene, "props" | "buildings">): StaticDrawable[] {
  const list: StaticDrawable[] = [];
  scene.props.forEach((prop, index) => {
    if (!prop.decal) list.push({ sortY: prop.y, kind: 0, index });
  });
  scene.buildings.forEach((building, index) => list.push({ sortY: building.y, kind: 1, index }));
  return list.sort((a, b) => a.sortY - b.sortY || a.kind - b.kind || a.index - b.index);
}

export function isVisible(x: number, y: number, w: number, h: number, camera: Camera, margin = 0): boolean {
  return x + w > camera.x - margin && x < camera.x + VIEW_WIDTH + margin && y + h > camera.y - margin && y < camera.y + VIEW_HEIGHT + margin;
}

export function propVisible(prop: PropInstance, camera: Camera): boolean {
  return isVisible(prop.x - prop.w / 2, prop.y - prop.h, prop.w, prop.h, camera);
}

type PropPart = "all" | "lower" | "upper";

function drawSpritePart(
  ctx: CanvasRenderingContext2D,
  image: ImageBitmap,
  prop: PropInstance,
  camera: Camera,
  part: PropPart,
  alpha: number,
) {
  // Anchor and split use the decoded image's real size (bottom centre = the feet), not the table size.
  const w = image.width;
  const h = image.height;
  const splitY = prop.aboveFrom === null ? 0 : Math.max(0, h - prop.aboveFrom);
  const top = part === "upper" ? 0 : part === "lower" ? splitY : 0;
  const bottom = part === "upper" ? splitY : h;
  if (bottom <= top) return;
  const dx = Math.round(prop.x - w / 2 - camera.x);
  const dy = Math.round(prop.y - h + top - camera.y);
  const previous = ctx.globalAlpha;
  if (alpha < 1) ctx.globalAlpha = previous * alpha;
  ctx.drawImage(image, 0, top, w, bottom - top, dx, dy, w, bottom - top);
  if (alpha < 1) ctx.globalAlpha = previous;
}

/**
 * Draws a prop (or one horizontal part of it). Props with a withered twin crossfade by `restore`
 * (0 = withered, 1 = lush) — the render hook S3 feeds with the mission progress.
 */
export function drawProp(ctx: CanvasRenderingContext2D, assets: WorldAssets, prop: PropInstance, camera: Camera, restore: number, part: PropPart = "all") {
  const lush = assets.get(`props/${prop.id}`);
  if (!lush) {
    if (part === "upper" || prop.decal) return;
    // Placeholder: a tinted block over the collision footprint so obstacles stay understandable.
    ctx.fillStyle = "#8a6d3b";
    const foot = prop.foot[0];
    const w = foot ? foot.w : Math.min(prop.w, 16);
    const h = foot ? foot.h + 4 : 8;
    ctx.fillRect(Math.round(prop.x - w / 2 - camera.x), Math.round(prop.y - h - camera.y), w, h);
    return;
  }
  const withered = prop.withered ? assets.get(`props/${prop.id}-withered`) : undefined;
  if (!withered) {
    drawSpritePart(ctx, lush, prop, camera, part, 1);
    return;
  }
  if (restore < 0.999) drawSpritePart(ctx, withered, prop, camera, part, 1);
  if (restore > 0.001) drawSpritePart(ctx, lush, prop, camera, part, restore >= 0.999 ? 1 : restore);
}

export function drawBuilding(ctx: CanvasRenderingContext2D, assets: WorldAssets, building: BuildingInstance, camera: Camera) {
  const image = assets.get(building.key);
  if (image) {
    // Bottom-centre anchored at the real image size (equal to the tile box for every converted building).
    ctx.drawImage(image, Math.round(building.x - image.width / 2 - camera.x), Math.round(building.y - image.height - camera.y));
    return;
  }
  const x = Math.round(building.x - building.w / 2 - camera.x);
  const y = Math.round(building.y - building.h - camera.y);
  ctx.fillStyle = "#6b5a45";
  ctx.fillRect(x, y + building.h * 0.4, building.w, building.h * 0.6);
  ctx.fillStyle = "#3c3226";
  ctx.font = `10px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(building.id, x + building.w / 2, y + building.h * 0.7);
}

// ── characters ────────────────────────────────────────────────────────────────────────────

export interface CharacterView {
  x: number;
  y: number;
  facing: Facing;
  moving: boolean;
  running?: boolean;
  animTime: number;
}

const WALK_ROW: Record<Facing, number> = { down: 1, right: 2, left: 2, up: 3 };
const IDLE_COL: Record<Facing, number> = { down: 0, right: 1, up: 2, left: 1 };

export function drawShadow(ctx: CanvasRenderingContext2D, x: number, y: number, w = 16, h = 6) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
  ctx.beginPath();
  ctx.ellipse(x, y - 1, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draws a character from its atlas (idle row + 3 walk rows; 192×256 of 48×64 cells, animals 128×128 of
 * 32×32), or a coloured placeholder. Left-facing frames are the right-facing ones mirrored.
 */
export function drawCharacter(ctx: CanvasRenderingContext2D, assets: WorldAssets, cast: CastDef, view: CharacterView, camera: Camera, animal = false) {
  const screenX = Math.round(view.x - camera.x);
  const screenY = Math.round(view.y - camera.y);
  drawShadow(ctx, screenX, screenY, animal ? 14 : 18, animal ? 5 : 6);
  const atlas = assets.get(`characters/${cast.id}-atlas`);
  if (!atlas) {
    ctx.fillStyle = cast.themeColor;
    const w = animal ? 14 : 20;
    const h = animal ? 14 : 40;
    ctx.fillRect(screenX - w / 2, screenY - h, w, h);
    ctx.fillStyle = "#0b1614";
    ctx.font = `12px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(cast.displayName.slice(0, 1), screenX, screenY - h / 2 + 4);
    return;
  }
  const frameW = animal ? ANIMAL_FRAME : CHAR_FRAME_W;
  const frameH = animal ? ANIMAL_FRAME : CHAR_FRAME_H;
  const inset = animal ? ANIMAL_FOOT_INSET : CHAR_FOOT_INSET;
  let sx: number;
  let sy: number;
  if (view.moving) {
    const fps = animal ? 8 : view.running ? 12 : 8;
    sx = (Math.floor(view.animTime * fps) % 4) * frameW;
    sy = WALK_ROW[view.facing] * frameH;
  } else {
    sx = IDLE_COL[view.facing] * frameW;
    sy = 0;
  }
  const dy = screenY - (frameH - inset);
  if (view.facing === "left") {
    ctx.save();
    ctx.translate(screenX, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(atlas, sx, sy, frameW, frameH, -frameW / 2, dy, frameW, frameH);
    ctx.restore();
  } else {
    ctx.drawImage(atlas, sx, sy, frameW, frameH, screenX - frameW / 2, dy, frameW, frameH);
  }
}

/** Height of a character's sprite above its feet (for prompts and arrows). */
export function spriteHeight(npc: Pick<Npc, "animal">): number {
  return npc.animal ? 28 : 58;
}

// ── UI drawn on the canvas ────────────────────────────────────────────────────────────────

export interface NineSliceInsets {
  l: number;
  t: number;
  r: number;
  b: number;
}

/** Stretches a 9-slice frame to (dx, dy, dw, dh): corners keep their size, edges and centre stretch. */
export function drawNineSlice(ctx: CanvasRenderingContext2D, image: ImageBitmap, ins: NineSliceInsets, dx: number, dy: number, dw: number, dh: number) {
  const { l, t, r, b } = ins;
  const sw = image.width;
  const sh = image.height;
  const cw = Math.max(0, dw - l - r);
  const ch = Math.max(0, dh - t - b);
  const parts: [number, number, number, number, number, number, number, number][] = [
    [0, 0, l, t, dx, dy, l, t],
    [sw - r, 0, r, t, dx + dw - r, dy, r, t],
    [0, sh - b, l, b, dx, dy + dh - b, l, b],
    [sw - r, sh - b, r, b, dx + dw - r, dy + dh - b, r, b],
    [l, 0, sw - l - r, t, dx + l, dy, cw, t],
    [l, sh - b, sw - l - r, b, dx + l, dy + dh - b, cw, b],
    [0, t, l, sh - t - b, dx, dy + t, l, ch],
    [sw - r, t, r, sh - t - b, dx + dw - r, dy + t, r, ch],
    [l, t, sw - l - r, sh - t - b, dx + l, dy + t, cw, ch],
  ];
  for (const [sx, sy, sW, sH, x, y, w, h] of parts) if (sW > 0 && sH > 0 && w > 0 && h > 0) ctx.drawImage(image, sx, sy, sW, sH, x, y, w, h);
}

/** The "E" bubble above the thing that can be interacted with. */
export function drawPrompt(ctx: CanvasRenderingContext2D, assets: WorldAssets, x: number, y: number, time: number) {
  const w = 24;
  const h = 20;
  const bob = Math.round(Math.sin(time * 6) * 1.5);
  const left = Math.round(x - w / 2);
  const top = Math.round(y - h + bob);
  const frame = assets.get("ui/tooltip-frame");
  if (frame) {
    drawNineSlice(ctx, frame, { l: 10, t: 9, r: 10, b: 9 }, left, top, w, h);
  } else {
    ctx.fillStyle = "rgba(11, 22, 20, 0.92)";
    ctx.fillRect(left, top, w, h);
    ctx.strokeStyle = "#00e9ae";
    ctx.strokeRect(left + 0.5, top + 0.5, w - 1, h - 1);
  }
  ctx.fillStyle = "#ffd54a";
  ctx.font = `bold 11px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("E", left + w / 2, top + h / 2 + 1);
}

/** Bouncing gold arrow pointing down at a target (tutorial highlight). */
export function drawTargetArrow(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  const bob = Math.sin(time * 5) * 3;
  const cx = Math.round(x);
  const cy = Math.round(y + bob);
  ctx.fillStyle = "#ffd54a";
  ctx.strokeStyle = "#5a3b00";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 7, cy - 12);
  ctx.lineTo(cx + 7, cy - 12);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/** Arrow on the screen edge pointing toward an off-screen target. */
export function drawEdgePointer(ctx: CanvasRenderingContext2D, from: { x: number; y: number }, to: { x: number; y: number }, camera: Camera, time: number) {
  const sx = to.x - camera.x;
  const sy = to.y - camera.y;
  const margin = 20;
  const cx = VIEW_WIDTH / 2;
  const cy = VIEW_HEIGHT / 2;
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const scale = Math.min((cx - margin) / Math.max(Math.abs(dx), 1e-6), (cy - margin) / Math.max(Math.abs(dy), 1e-6));
  const px = cx + dx * scale;
  const py = cy + dy * scale;
  if (sx >= 0 && sx <= VIEW_WIDTH && sy >= 0 && sy <= VIEW_HEIGHT) return;
  const pulse = 1 + Math.sin(time * 6) * 0.12;
  ctx.save();
  ctx.translate(Math.round(px), Math.round(py));
  ctx.rotate(angle);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = "#ffd54a";
  ctx.strokeStyle = "#5a3b00";
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(-6, -8);
  ctx.lineTo(-6, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** Small name plate over the player's own house door ("sign-home", docs/world/03 §4 — no art, drawn by code). */
export function drawHomeSign(ctx: CanvasRenderingContext2D, camera: Camera, doorCenterX: number, baseY: number, label: string) {
  const text = `${label}의 집`;
  ctx.font = `10px ${FONT}`;
  const w = Math.ceil(ctx.measureText(text).width) + 10;
  const x = Math.round(doorCenterX - w / 2 - camera.x);
  const y = Math.round(baseY - 66 - camera.y);
  ctx.fillStyle = "rgba(11, 22, 20, 0.9)";
  ctx.fillRect(x, y, w, 14);
  ctx.strokeStyle = "#00e9ae";
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 13);
  ctx.fillStyle = "#e8fff6";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + w / 2, y + 7.5);
}

// ── mission markers, objects, ball ────────────────────────────────────────────────────────

const MARKER_ASSET: Record<MarkerKind, string> = { new: "fx/mark-new", progress: "fx/mark-progress", ready: "fx/mark-complete" };
const MARKER_FALLBACK: Record<MarkerKind, { glyph: string; fill: string }> = {
  new: { glyph: "?", fill: "#5aa8ff" },
  progress: { glyph: "…", fill: "#b8c4c0" },
  ready: { glyph: "!", fill: "#ffd54a" },
};

/**
 * The marker over a mission giver's head (docs/world/02 §5): blue `?` = new mission, grey `…` = in progress,
 * gold `!` (with a little sparkle) = goal met, report back. (sx, sy) is the screen point just above the head.
 */
export function drawMarker(ctx: CanvasRenderingContext2D, assets: WorldAssets, kind: MarkerKind, sx: number, sy: number, time: number, still = false) {
  const bob = still ? 0 : Math.round(Math.sin(time * 4 + sx * 0.05) * 2);
  const image = assets.get(MARKER_ASSET[kind]);
  const x = Math.round(sx);
  const y = Math.round(sy + bob);
  if (image) {
    ctx.drawImage(image, Math.round(x - image.width / 2), y - image.height);
    if (kind === "ready" && !still) {
      const sparkle = assets.get(`fx/sparkle-${1 + (Math.floor(time * 8) % 4)}`);
      if (sparkle) ctx.drawImage(sparkle, x + 6, y - image.height - 2);
    }
    return;
  }
  const { glyph, fill } = MARKER_FALLBACK[kind];
  ctx.fillStyle = "rgba(11, 22, 20, 0.9)";
  ctx.fillRect(x - 8, y - 18, 16, 18);
  ctx.strokeStyle = fill;
  ctx.strokeRect(x - 7.5, y - 17.5, 15, 17);
  ctx.fillStyle = fill;
  ctx.font = `bold 13px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(glyph, x, y - 8);
}

/** A pickup, cone or other prop-like mission object standing on its feet position. Lanterns float a little. */
export function drawSceneObject(ctx: CanvasRenderingContext2D, assets: WorldAssets, object: SceneObject, camera: Camera, time: number) {
  if (!object.prop) return;
  const image = assets.get(object.look === "withered" ? `props/${object.prop}-withered` : `props/${object.prop}`) ?? assets.get(`props/${object.prop}`);
  const float = object.type === "pickup" && object.look !== "withered" ? Math.round(Math.sin(time * 3 + object.x * 0.1) * 2) - 3 : 0;
  const x = Math.round(object.x - camera.x);
  const y = Math.round(object.y - camera.y);
  drawShadow(ctx, x, y + 2, 14, 5);
  if (image) {
    ctx.drawImage(image, Math.round(x - image.width / 2), y - image.height + float);
    return;
  }
  ctx.fillStyle = object.type === "hazard" ? "#ff8a2e" : "#5ad1ff";
  ctx.fillRect(x - 6, y - 14 + float, 12, 14);
}

export function drawBall(ctx: CanvasRenderingContext2D, assets: WorldAssets, ball: Ball, camera: Camera) {
  const x = Math.round(ball.x - camera.x);
  const y = Math.round(ball.y - camera.y);
  drawShadow(ctx, x, y + BALL_SIZE / 2, 10, 4);
  const image = assets.get("props/ball-standard");
  if (image) {
    ctx.drawImage(image, Math.round(x - image.width / 2), Math.round(y - image.height / 2 - 2));
    return;
  }
  ctx.fillStyle = "#f4f4ee";
  ctx.beginPath();
  ctx.arc(x, y - 2, BALL_SIZE / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1c2422";
  ctx.stroke();
}

/** The timer box of a running delivery / trial / kick challenge, top centre of the stage. */
export function drawRunHud(ctx: CanvasRenderingContext2D, hud: RunHud) {
  const w = 180;
  const h = 40;
  const x = Math.round((VIEW_WIDTH - w) / 2);
  const y = 8;
  ctx.fillStyle = "rgba(6, 18, 15, 0.86)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = hud.urgent ? "#ff6a5a" : "#ffd54a";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#b8ffe8";
  ctx.font = `10px ${FONT}`;
  ctx.fillText(hud.title, x + w / 2, y + 9);
  ctx.fillStyle = hud.urgent ? "#ff8a7a" : "#ffe9b0";
  ctx.font = `bold 15px ${FONT}`;
  ctx.fillText(hud.clock, x + w / 2, y + 22);
  ctx.fillStyle = "#e8fff6";
  ctx.font = `10px ${FONT}`;
  ctx.fillText(hud.detail, x + w / 2, y + 34);
}

// ── interiors ─────────────────────────────────────────────────────────────────────────────

export function drawInterior(ctx: CanvasRenderingContext2D, assets: WorldAssets, scene: WorldScene, camera: Camera) {
  const image = scene.image ? assets.get(scene.image) : undefined;
  if (image) {
    ctx.drawImage(image, -camera.x, -camera.y, scene.size.w, scene.size.h);
    return;
  }
  ctx.fillStyle = "#241c34";
  ctx.fillRect(-camera.x, -camera.y, scene.size.w, scene.size.h);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  for (let x = 0; x <= scene.size.w; x += TILE) {
    ctx.moveTo(x - camera.x + 0.5, -camera.y);
    ctx.lineTo(x - camera.x + 0.5, scene.size.h - camera.y);
  }
  for (let y = 0; y <= scene.size.h; y += TILE) {
    ctx.moveTo(-camera.x, y - camera.y + 0.5);
    ctx.lineTo(scene.size.w - camera.x, y - camera.y + 0.5);
  }
  ctx.stroke();
  ctx.fillStyle = "#8a7fb0";
  ctx.font = `12px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText(scene.id, scene.size.w / 2 - camera.x, 24 - camera.y);
}

// ── debug overlay ─────────────────────────────────────────────────────────────────────────

export interface DebugStats {
  fps: number;
  frameMs: number;
  scale: string;
  assets: string;
  zone: string;
  restore: string;
  pick: { x: number; y: number } | null;
  ball?: Ball | null;
}

/**
 * `?worldDebug` overlay: tile grid with coordinates, walkable bounds, colliders, doors (cyan), examine
 * areas (magenta), NPC hit/wander areas (orange), the interaction probe, the foot box and a stats panel.
 */
export function drawDebug(
  ctx: CanvasRenderingContext2D,
  scene: WorldScene,
  camera: Camera,
  player: { x: number; y: number; facing: Facing },
  npcs: readonly Npc[],
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

  ctx.font = `8px ${FONT}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  for (let ty = Math.ceil(camera.y / TILE); ty * TILE < camera.y + VIEW_HEIGHT; ty++) {
    for (let tx = Math.ceil(camera.x / TILE); tx * TILE < camera.x + VIEW_WIDTH; tx++) {
      if (tx % 2 === 0 && ty % 2 === 0) ctx.fillText(`${tx},${ty}`, Math.round(tx * TILE - camera.x) + 2, Math.round(ty * TILE - camera.y) + 2);
    }
  }

  const outline = (rect: Rect, color: string, fill?: string) => {
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fillRect(Math.round(rect.x - camera.x), Math.round(rect.y - camera.y), rect.w, rect.h);
    }
    ctx.strokeStyle = color;
    ctx.strokeRect(Math.round(rect.x - camera.x) + 0.5, Math.round(rect.y - camera.y) + 0.5, rect.w - 1, rect.h - 1);
  };
  outline(scene.walkable, "#ffd54a");
  for (const rect of scene.colliderRects) outline(rect, "#ff4d4d");
  for (const door of scene.doors) outline(door.rect, "#33e0ff", "rgba(51, 224, 255, 0.18)");
  for (const point of scene.examine) outline(point.area, "#ff5cf0", "rgba(255, 92, 240, 0.10)");
  for (const npc of npcs) {
    outline(npcHitArea(npc), "#ff9d2e");
    outline(footBox(npc.x, npc.y, NPC_BOX.w, NPC_BOX.h), "#ff4d4d");
    if (npc.wander) outline(npc.wander, "rgba(255, 157, 46, 0.6)");
  }
  for (const object of scene.objects) {
    if (object.rect) outline(object.rect, object.type === "goal" ? "#ffd54a" : object.type === "gate" ? "#5affb0" : "#5ad1ff", "rgba(255, 255, 255, 0.06)");
    else outline({ x: object.x - 8, y: object.y - 8, w: 16, h: 8 }, object.type === "hazard" ? "#ff8a2e" : "#5ad1ff");
    ctx.fillStyle = "#ffffff";
    ctx.font = `8px ${FONT}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(object.id, Math.round((object.rect ? object.rect.x : object.x - 8) - camera.x) + 2, Math.round((object.rect ? object.rect.y : object.y - 8) - camera.y) + 2);
  }
  if (stats.ball) outline(ballBox(stats.ball), "#ffffff");
  outline(interactionProbe(player, player.facing, INTERACT_REACH), "#b8ff5c");
  outline(footBox(player.x, player.y), "#4dff88");

  if (stats.pick) {
    const px = Math.round(stats.pick.x - camera.x);
    const py = Math.round(stats.pick.y - camera.y);
    ctx.strokeStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(px - 6, py + 0.5);
    ctx.lineTo(px + 7, py + 0.5);
    ctx.moveTo(px + 0.5, py - 6);
    ctx.lineTo(px + 0.5, py + 7);
    ctx.stroke();
  }

  const lines = [
    `${scene.id}  pos ${player.x.toFixed(1)}, ${player.y.toFixed(1)}  tile ${Math.floor(player.x / TILE)}, ${Math.floor(player.y / TILE)}  ${player.facing}`,
    `cam ${Math.round(camera.x)}, ${Math.round(camera.y)}  scale ${stats.scale}`,
    `fps ${stats.fps.toFixed(0)}  frame ${stats.frameMs.toFixed(1)}ms  colliders ${scene.colliderRects.length}  npcs ${npcs.length}`,
    `zone ${stats.zone}  restore ${stats.restore}`,
    `assets ${stats.assets}`,
  ];
  ctx.font = `10px ${FONT}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  ctx.fillRect(4, 4, 330, lines.length * 12 + 6);
  ctx.fillStyle = "#b8ffe8";
  lines.forEach((line, index) => ctx.fillText(line, 8, 7 + index * 12));
  ctx.restore();
}
