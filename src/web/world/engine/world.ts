import { OVERWORLD_MAP } from "../data/maps";
import { surfaceOf } from "../data/terrainDefs";
import { getCast } from "../data/worldCast";
import { saveWorldSave } from "../storage";
import type { CastId, Facing, SceneId, WorldSave } from "../types";
import type { WorldAudioLike, SfxId } from "../audio/worldAudio";
import { SILENT_AUDIO } from "../audio/worldAudio";
import type { WorldAssets } from "../worldAssets";
import { followCamera, interiorCamera, snapCamera, type Camera } from "./camera";
import { composeObstacles, footBox, moveAndSlide, rectsOverlap } from "./collision";
import { findInteractTarget, type InteractTarget } from "./interaction";
import { createInput } from "./input";
import { createLoop } from "./loop";
import { getScene, zoneAtPoint, terrainCodeAt } from "./mapScene";
import { createNpc, endTalk, npcBox, startTalk, stepNpc, type Npc } from "./npc";
import {
  VIEW_HEIGHT, VIEW_WIDTH, TILE, buildStaticOrder, drawBuilding, drawCharacter, drawDebug, drawEdgePointer, drawHomeSign, drawInterior,
  drawProp, drawPrompt, drawTargetArrow, isVisible, propVisible, spriteHeight, type StaticDrawable,
} from "./render";
import { SceneTransition, type DoorTrigger, type WorldScene } from "./scene";
import { TerrainRenderer } from "./terrain";

export const WALK_SPEED = 90;
export const RUN_SPEED = 150;
const AUTOSAVE_SECONDS = 5;
const DOOR_GRACE_SECONDS = 0.35;

/** The save the engine and the overlay share: the engine writes the position, the overlay flags/counters. */
export interface SaveStore {
  save: WorldSave;
}

export interface DebugPick {
  scene: SceneId;
  x: number;
  y: number;
  tx: number;
  ty: number;
}

export interface WorldEvents {
  /** An NPC or object was interacted with. The engine has already blocked input until `closeInteraction()`. */
  onInteract?(target: InteractTarget): void;
  onZoneEnter?(zone: { id: string; name: string; tint: string; bgm?: string }): void;
  onSceneChange?(scene: SceneId): void;
  /** Cumulative distance walked, in tiles (coach step C1). */
  onWalked?(tiles: number): void;
  /** The J key (mission log opens in S3). */
  onLogKey?(): void;
  onDebugPick?(pick: DebugPick): void;
}

export interface WorldEngineOptions {
  canvas: HTMLCanvasElement;
  assets: WorldAssets;
  playerId: CastId;
  store: SaveStore;
  debug: boolean;
  /** Read on every event, so the overlay can swap handlers without recreating the engine. */
  getEvents: () => WorldEvents;
  audio?: WorldAudioLike;
  /** Human-readable scale for the debug panel (the overlay knows the layout, the engine does not). */
  getScaleLabel?: () => string;
}

export interface WorldEngine {
  start(): void;
  /** Stops the loop and writes the current position to the save. */
  destroy(): void;
  /** Dialogue/UI owns the keyboard: movement and E stop. */
  setUiBlocked(blocked: boolean): void;
  /** Ends the conversation with the NPC being talked to (they turn back) and gives the keyboard back. */
  closeInteraction(): void;
  /** Coach step C2: bounce an arrow over this cast member (null = off). */
  setHighlight(cast: CastId | null): void;
  /** Debug: logical stage coordinates (640×360) → world position. */
  pick(logicalX: number, logicalY: number): DebugPick;
  /** Debug: fade to another scene (default spawn unless a tile is given). */
  teleport(scene: SceneId, tile?: [number, number]): void;
  /** Debug: force the colour restoration (0 withered … 1 lush); null follows the save. */
  setRestoreOverride(value: number | null): void;
  setNoclip(on: boolean): void;
  /** Where the player is right now (debug panel, tests). */
  getState(): { scene: SceneId; x: number; y: number; facing: Facing };
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

/** Is a saved position a usable standing spot in this scene (inside the bounds, not inside an obstacle)? */
export function isUsableSpot(scene: WorldScene, x: number, y: number): boolean {
  const box = footBox(x, y);
  const w = scene.walkable;
  const inside = box.x >= w.x && box.x + box.w <= w.x + w.w && box.y >= w.y && box.y + box.h <= w.y + w.h;
  return inside && scene.colliders.query(box).every((rect) => !rectsOverlap(box, rect));
}

const targetId = (t: InteractTarget) => (t.kind === "npc" ? `npc:${t.key}` : `examine:${t.id ?? `${t.center.x},${t.center.y}`}`);

export function createWorldEngine(options: WorldEngineOptions): WorldEngine {
  const { canvas, assets, playerId, store, debug } = options;
  const audio = options.audio ?? SILENT_AUDIO;
  const events = () => options.getEvents();
  const ctx = canvas.getContext("2d", { alpha: false })!;
  ctx.imageSmoothingEnabled = false;

  const playerCast = getCast(playerId);
  const input = createInput();
  const transition = new SceneTransition();
  const view = { w: VIEW_WIDTH, h: VIEW_HEIGHT };
  const terrainRenderers = new Map<SceneId, TerrainRenderer>();
  const staticOrders = new Map<SceneId, StaticDrawable[]>();
  const npcsByScene = new Map<SceneId, Npc[]>();

  const home = OVERWORLD_MAP.buildings.find((b) => b.id === `house-${playerId}`);
  const homeSign = home?.door ? { x: (home.door[0] + 1) * TILE, y: (home.door[1] + 1) * TILE } : null;

  // ── state ────────────────────────────────────────────────────────────────────────────────
  let scene: WorldScene = getScene("overworld")!;
  const player = { x: 0, y: 0, facing: "down" as Facing, moving: false, running: false, animTime: 0 };
  let camera: Camera = { x: 0, y: 0 };
  let npcs: Npc[] = [];
  let uiBlocked = false;
  let talking: Npc | null = null;
  let inputEnabled = true;
  let doorArmed = false;
  let doorGrace = 0;
  let lastZoneId: string | null = null;
  let highlight: CastId | null = null;
  let restoreOverride: number | null = null;
  let noclip = false;
  let lastPick: DebugPick | null = null;
  let target: InteractTarget | null = null;
  let promptAnchor: { x: number; y: number } | null = null;
  let time = 0;
  let sinceSave = 0;
  let fps = 60;
  let frameMs = 16;
  let walkedPx = 0;
  let reportedTiles = 0;
  let stepAccum = 0;

  // ── scenes ───────────────────────────────────────────────────────────────────────────────
  function npcsFor(target: WorldScene): Npc[] {
    let list = npcsByScene.get(target.id);
    if (!list) {
      // The chosen member's own spot stays empty; conditional residents (S3+) are not spawned yet.
      list = target.npcSpawns.filter((spawn) => spawn.cast !== playerId && !spawn.when).map((spawn) => createNpc(spawn, getCast(spawn.cast).role === "animal"));
      npcsByScene.set(target.id, list);
    }
    return list;
  }

  function enterScene(id: SceneId, x: number, y: number, facing: Facing) {
    const next = getScene(id);
    if (!next) return;
    scene = next;
    player.x = x;
    player.y = y;
    player.facing = facing;
    player.moving = false;
    player.animTime = 0;
    npcs = npcsFor(next);
    if (!staticOrders.has(id)) staticOrders.set(id, buildStaticOrder(next));
    if (next.terrain && !terrainRenderers.has(id)) terrainRenderers.set(id, new TerrainRenderer(assets, next.terrain));
    camera = next.fixedCamera ? interiorCamera(view, next.size) : followCamera({ x: 0, y: 0 }, player, view, next.size, { snap: true });
    doorArmed = false;
    doorGrace = DOOR_GRACE_SECONDS;
    lastZoneId = null;
    target = null;
    input.reset();
    events().onSceneChange?.(id);
  }

  // The saved position may belong to an older map layout: fall back to the scene's spawn if it is unusable.
  const savedScene = getScene(store.save.scene);
  if (savedScene && isUsableSpot(savedScene, store.save.x, store.save.y)) enterScene(savedScene.id, store.save.x, store.save.y, store.save.facing);
  else {
    const fallback = savedScene ?? getScene("overworld")!;
    enterScene(fallback.id, fallback.spawn.x, fallback.spawn.y, "down");
  }

  function persist() {
    saveWorldSave({ ...store.save, player: playerId, scene: scene.id, x: player.x, y: player.y, facing: player.facing });
  }

  function useDoor(door: DoorTrigger) {
    const to = door.to;
    const destination = getScene(to.scene);
    if (!destination || transition.active) return;
    audio.playSfx(scene.kind === "interior" && to.scene === "overworld" ? "door-close" : "door-open");
    transition.start(async () => {
      // The room image loads while the screen is black and stays cached afterwards (docs/world/01 §8).
      if (destination.image && !assets.has(destination.image)) await assets.load([destination.image]);
      enterScene(to.scene, to.x, to.y, to.facing);
      persist();
    });
  }

  // ── update ───────────────────────────────────────────────────────────────────────────────
  function restoreValue(): number {
    return restoreOverride ?? Math.min(1, Math.max(0, store.save.shards / 10));
  }
  // S3 replaces this with the per-district mix (docs/world/03 §3); until then every district follows one value.
  const restoreOfZone = () => restoreValue();

  function surfaceSfx(): SfxId {
    if (scene.kind === "interior") return "step-wood";
    const surface = surfaceOf(terrainCodeAt(scene, player.x, player.y) ?? "");
    if (surface === "sand") return "step-dirt";
    return `step-${surface}` as SfxId;
  }

  function stepNpcs(dt: number) {
    const playerRect = footBox(player.x, player.y);
    const boxes = npcs.map((npc) => ({ npc, box: npcBox(npc) }));
    for (const { npc } of boxes) {
      const others = [playerRect, ...boxes.filter((entry) => entry.npc !== npc).map((entry) => entry.box)];
      stepNpc(npc, dt, composeObstacles(scene.colliders, others));
    }
  }

  function movePlayer(dt: number) {
    const move = input.move();
    player.running = input.isDown("run");
    player.moving = move.x !== 0 || move.y !== 0;
    if (!player.moving) {
      player.animTime = 0;
      return;
    }
    const speed = (player.running ? RUN_SPEED : WALK_SPEED) * dt;
    const box = footBox(player.x, player.y);
    const obstacles = noclip ? [] : composeObstacles(scene.colliders, npcs.map(npcBox));
    const result = moveAndSlide(box, move.x * speed, move.y * speed, obstacles, scene.walkable);
    // Blocked outright (walking straight into a wall) reads as standing still, not as a walk cycle.
    const moved = Math.hypot(result.x - box.x, result.y - box.y);
    player.x = result.x + box.w / 2;
    player.y = result.y + box.h;
    player.moving = moved > 1e-6;
    player.facing = facingFor(move.x, move.y, player.facing);
    player.animTime = player.moving ? player.animTime + dt : 0;
    if (!player.moving) return;

    walkedPx += moved;
    const tiles = Math.floor(walkedPx / TILE);
    if (tiles !== reportedTiles) {
      reportedTiles = tiles;
      events().onWalked?.(walkedPx / TILE);
    }
    stepAccum += moved;
    const stride = player.running ? 30 : 22;
    if (stepAccum >= stride) {
      stepAccum -= stride;
      audio.playSfx(surfaceSfx());
    }
  }

  function checkDoors(dt: number) {
    doorGrace = Math.max(0, doorGrace - dt);
    const box = footBox(player.x, player.y);
    const hit = scene.doors.find((door) => rectsOverlap(box, door.rect));
    if (!hit) {
      doorArmed = true;
      return;
    }
    // Arriving on top of a door (or holding the direction through it) must not bounce straight back.
    if (doorArmed && doorGrace === 0) useDoor(hit);
  }

  function checkZone() {
    if (scene.kind !== "overworld") return;
    const zone = zoneAtPoint(scene, player.x, player.y);
    if (zone && zone.id !== lastZoneId) {
      lastZoneId = zone.id;
      events().onZoneEnter?.(zone);
    }
  }

  function updateTarget() {
    const next = findInteractTarget(player, player.facing, npcs, scene.examine);
    if (next && (!target || targetId(next) !== targetId(target))) audio.playSfx("interact-ping");
    target = next;
    if (!next) {
      promptAnchor = null;
      return;
    }
    if (next.kind === "npc") {
      const npc = npcs.find((n) => n.key === next.key);
      promptAnchor = npc ? { x: npc.x, y: npc.y - spriteHeight(npc) - 6 } : null;
    } else {
      promptAnchor = { x: next.center.x, y: next.center.y - 10 };
    }
  }

  function handleInteract() {
    if (!input.consumePressed("interact") || !target) return;
    const chosen = target;
    audio.playSfx(chosen.kind === "npc" ? "dialog-open" : "examine");
    if (chosen.kind === "npc") {
      const npc = npcs.find((n) => n.key === chosen.key);
      if (npc) {
        startTalk(npc, player);
        talking = npc;
      }
    }
    uiBlocked = true;
    target = null;
    promptAnchor = null;
    events().onInteract?.(chosen);
  }

  /** Movement/E are live only while no dialogue owns the keyboard and no fade is running. */
  function syncInput() {
    const enabled = !(uiBlocked || transition.active);
    if (enabled === inputEnabled) return;
    inputEnabled = enabled;
    input.setEnabled(enabled);
  }

  function update(dt: number) {
    time += dt;
    transition.update(dt);
    const blocked = uiBlocked || transition.active;
    syncInput();

    stepNpcs(dt);

    if (!blocked) {
      movePlayer(dt);
      checkDoors(dt);
      checkZone();
      updateTarget();
      handleInteract();
      if (input.consumePressed("log")) events().onLogKey?.();
      input.consumePressed("map");
    } else {
      player.moving = false;
      player.animTime = 0;
    }

    if (!scene.fixedCamera) camera = followCamera(camera, player, view, scene.size, { dt });

    sinceSave += dt;
    if (sinceSave >= AUTOSAVE_SECONDS) {
      sinceSave = 0;
      persist();
    }
  }

  // ── render ───────────────────────────────────────────────────────────────────────────────
  interface Dynamic {
    y: number;
    draw: (cam: Camera) => void;
  }

  function drawWorld(cam: Camera) {
    const restore = restoreValue();
    const dynamics: Dynamic[] = npcs.map((npc) => ({ y: npc.y, draw: (c) => drawCharacter(ctx, assets, getCast(npc.cast), npc, c, npc.animal) }));
    dynamics.push({ y: player.y, draw: (c) => drawCharacter(ctx, assets, playerCast, player, c) });
    dynamics.sort((a, b) => a.y - b.y);

    if (scene.kind === "interior") {
      drawInterior(ctx, assets, scene, cam);
      for (const item of dynamics) item.draw(cam);
      return;
    }

    terrainRenderers.get(scene.id)?.draw(ctx, cam, view, restoreOfZone);
    for (const prop of scene.props) if (prop.decal && propVisible(prop, cam)) drawProp(ctx, assets, prop, cam, restore);

    // y-sort: everything with feet is drawn back-to-front by its feet line (docs/world/01 §5 layer 3).
    const order = staticOrders.get(scene.id) ?? [];
    let next = 0;
    const flushDynamics = (untilY: number) => {
      while (next < dynamics.length && dynamics[next].y <= untilY) dynamics[next++].draw(cam);
    };
    for (const entry of order) {
      flushDynamics(entry.sortY);
      if (entry.kind === 0) {
        const prop = scene.props[entry.index];
        if (propVisible(prop, cam)) drawProp(ctx, assets, prop, cam, restore, prop.aboveFrom === null ? "all" : "lower");
      } else {
        const building = scene.buildings[entry.index];
        if (isVisible(building.x - building.w / 2, building.y - building.h, building.w, building.h, cam)) drawBuilding(ctx, assets, building, cam);
      }
    }
    flushDynamics(Infinity);

    // above: canopies and arch spans over everything (docs/world/01 §5 layer 4)
    for (const prop of scene.props) if (prop.aboveFrom !== null && !prop.decal && propVisible(prop, cam)) drawProp(ctx, assets, prop, cam, restore, "upper");

    if (homeSign && scene.kind === "overworld") drawHomeSign(ctx, cam, homeSign.x, homeSign.y, playerCast.displayName);
  }

  function drawOverlays(cam: Camera) {
    if (highlight && scene.kind === "overworld" && !uiBlocked) {
      const npc = npcs.find((n) => n.cast === highlight);
      if (npc) {
        const sx = npc.x - cam.x;
        const sy = npc.y - spriteHeight(npc) - 12 - cam.y;
        if (sx > 8 && sx < VIEW_WIDTH - 8 && sy > 8 && sy < VIEW_HEIGHT - 8) drawTargetArrow(ctx, sx, sy, time);
        else drawEdgePointer(ctx, player, npc, cam, time);
      }
    }
    if (promptAnchor && !uiBlocked && !transition.active) drawPrompt(ctx, assets, promptAnchor.x - cam.x, promptAnchor.y - cam.y, time);
  }

  function render(_alpha: number, frameSeconds: number) {
    if (frameSeconds > 0) {
      fps += (1 / frameSeconds - fps) * 0.1;
      frameMs += (frameSeconds * 1000 - frameMs) * 0.1;
    }
    const cam = snapCamera(camera);
    ctx.fillStyle = "#04120c";
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    drawWorld(cam);
    drawOverlays(cam);

    if (transition.alpha > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${transition.alpha.toFixed(3)})`;
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    }

    if (debug) {
      const zone = zoneAtPoint(scene, player.x, player.y);
      const wanted = ["terrain/core", `characters/${playerId}-atlas`];
      drawDebug(ctx, scene, cam, player, npcs, {
        fps,
        frameMs,
        scale: options.getScaleLabel?.() ?? "-",
        assets: `${wanted.filter((key) => assets.has(key)).length}/${wanted.length} core${scene.image ? `  room ${assets.has(scene.image) ? "ok" : "missing"}` : ""}`,
        zone: zone ? `${zone.id} ${zone.name}` : "-",
        restore: `${restoreValue().toFixed(2)}${restoreOverride === null ? "" : " (debug)"}`,
        pick: lastPick && lastPick.scene === scene.id ? { x: lastPick.x, y: lastPick.y } : null,
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
      terrainRenderers.forEach((renderer) => renderer.dispose());
      terrainRenderers.clear();
    },
    setUiBlocked(blocked) {
      uiBlocked = blocked;
      if (!blocked) {
        if (talking) endTalk(talking);
        talking = null;
      }
      syncInput();
    },
    closeInteraction() {
      if (talking) endTalk(talking);
      talking = null;
      uiBlocked = false;
      syncInput();
    },
    setHighlight(cast) {
      highlight = cast;
    },
    pick(logicalX, logicalY) {
      const cam = snapCamera(camera);
      const x = cam.x + logicalX;
      const y = cam.y + logicalY;
      lastPick = { scene: scene.id, x: Math.round(x), y: Math.round(y), tx: Math.floor(x / TILE), ty: Math.floor(y / TILE) };
      events().onDebugPick?.(lastPick);
      return lastPick;
    },
    teleport(id, tile) {
      const destination = getScene(id);
      if (!destination) return;
      const x = tile ? tile[0] * TILE + TILE / 2 : destination.spawn.x;
      const y = tile ? tile[1] * TILE + TILE / 2 : destination.spawn.y;
      transition.start(async () => {
        if (destination.image && !assets.has(destination.image)) await assets.load([destination.image]);
        enterScene(id, x, y, destination.kind === "interior" ? "up" : "down");
        persist();
      });
    },
    setRestoreOverride(value) {
      restoreOverride = value === null ? null : Math.min(1, Math.max(0, value));
    },
    setNoclip(on) {
      noclip = on;
    },
    getState() {
      return { scene: scene.id, x: player.x, y: player.y, facing: player.facing };
    },
  };
}

