import { OVERWORLD_MAP } from "../data/maps";
import { missionDefsFor, type MissionDef } from "../data/missionDefs";
import { surfaceOf } from "../data/terrainDefs";
import { getCast } from "../data/worldCast";
import { isBackwalk, oppositeFacing } from "../state/backwalk";
import { evalCondition } from "../state/conditions";
import { markerFor, missionStatus, type MarkerKind } from "../state/missions";
import { restoreForZones } from "../state/progress";
import { ENDING_SEEN_FLAG, storyMarker } from "../state/story";
import type { OnAirSource } from "../state/onAir";
import { saveWorldSave } from "../storage";
import type { CastId, Facing, NavigationTarget, Rect, SceneId, WorldSave } from "../types";
import type { WorldAudioLike, SfxId } from "../audio/worldAudio";
import { SILENT_AUDIO } from "../audio/worldAudio";
import type { WorldAssets } from "../worldAssets";
import { BALL_SIZE, ballBox, createBall, inGoal, kickBall, stepBall, type Ball } from "./ball";
import { followCamera, interiorCamera, snapCamera, type Camera } from "./camera";
import { composeObstacles, crossesMidline, footBox, moveAndSlide, rectsOverlap } from "./collision";
import { Ambience, BLOOM_SECONDS, ambienceIdFor, drawBloom } from "./ambience";
import { findInteractTarget, type ExtraTarget, type InteractTarget } from "./interaction";
import { createInput } from "./input";
import { createLoop } from "./loop";
import { getScene, zoneAtPoint, terrainCodeAt } from "./mapScene";
import { createNpc, endTalk, npcBox, startTalk, stepNpc, type Npc } from "./npc";
import { drawOnAirSign, findOnAirSigns, homeSignAnchor, onAirSignAt, onAirSize, type OnAirSign } from "./onAirSign";
import { RunManager, type RunEvent } from "./runs";
import {
  VIEW_HEIGHT, VIEW_WIDTH, TILE, buildStaticOrder, drawBall, drawBuilding, drawCharacter, drawDebug, drawEdgePointer, drawHomeSign, drawInterior,
  drawMarker, drawProp, drawPrompt, drawRunHud, drawSceneObject, drawSpectator, drawTargetArrow, isVisible, propVisible, spriteHeight, type StaticDrawable,
} from "./render";
import { SceneTransition, zoneIndexAt, type DoorTrigger, type ExaminePoint, type SceneObject, type SpectatorSpawn, type WorldScene } from "./scene";
import { TerrainRenderer } from "./terrain";

export const WALK_SPEED = 150;
export const RUN_SPEED = 225;
const AUTOSAVE_SECONDS = 5;
const DOOR_GRACE_SECONDS = 0.35;
/** How fast a district's colours follow a new restore target (per second, exponential). */
const RESTORE_FOLLOW = 1.5;
/** After a goal the ball is gone this long before it is back on the spot. */
const BALL_RESPAWN_SECONDS = 0.7;
const HAZARD_BOX = { w: 16, h: 10 };
/** Where the golden grass sits in the stadium picture (px, docs/world/03 §9): the bloom is drawn around it. */
const STADIUM_SCENE: SceneId = "interior:stadium";
const GOLDEN_GRASS = { x: 320, y: 182 };
/** Sound cues of the bloom cut, in seconds from its start. */
const BLOOM_CUES: readonly { at: number; sfx: SfxId }[] = [
  { at: 0, sfx: "core-stop" },
  { at: 2.2, sfx: "grow" },
  { at: 3.2, sfx: "crowd-roar" },
];

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
  /** The J key (opens the mission log). */
  onLogKey?(): void;
  /** A mission pickup was taken with E (no dialogue, input stays free). */
  onPickup?(id: string): void;
  /** Something happened in a timed run (clock started, parcel delivered, goal scored, time out…). */
  onRunEvent?(event: RunEvent): void;
  /** The player walked into a door that is still shut (`text` says why). */
  onDoorLocked?(text: string): void;
  /** The golden grass finished blooming (`playBloom()`). */
  onBloomDone?(): void;
  /** A member's ON AIR sign was clicked (`live`: they are on air, so the broadcast opens instead of the station). */
  onOnAirClick?(soopId: string, live: boolean): void;
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
  /** Who is live on SOOP right now (the ON AIR signs over the member houses); absent = every sign is off. */
  onAir?: OnAirSource;
}

export interface WorldEngine {
  start(): void;
  /** Stops the loop and writes the current position to the save. */
  destroy(): void;
  /** Dialogue/UI owns the keyboard: movement and E stop. */
  setUiBlocked(blocked: boolean): void;
  /** Ends the conversation with the NPC being talked to (they turn back) and gives the keyboard back. */
  closeInteraction(): void;
  /** Bounce an arrow over a mission NPC, object, examine point, or door (null = off). */
  setNavigationTarget(target: NavigationTarget | null): void;
  /** Debug: logical stage coordinates (640×360) → world position. */
  pick(logicalX: number, logicalY: number): DebugPick;
  /** A click at logical stage coordinates: true when it landed on an ON AIR sign (reported through `onOnAirClick`). */
  clickAt(logicalX: number, logicalY: number): boolean;
  /** Is there an ON AIR sign under this logical stage point (drives the pointer cursor)? */
  hoverAt(logicalX: number, logicalY: number): boolean;
  /** Debug: fade to another scene (default spawn unless a tile is given). */
  teleport(scene: SceneId, tile?: [number, number]): void;
  /** Debug: force the colour restoration (0 withered … 1 lush); null follows the save. */
  setRestoreOverride(value: number | null): void;
  setNoclip(on: boolean): void;
  /** The delivery giver hands over the parcels and the clock starts (mission id from missionDefs). */
  startDelivery(missionId: string): void;
  /** Drops every timed run (a mission was abandoned, the world menu opened "새로 시작"…). */
  cancelRuns(): void;
  /** The parcels are in the player's bag and the delivery clock is running. */
  isDeliveryRunning(): boolean;
  /** Transient timed-attempt state used to point the tracker at its immediate next step. */
  getNavigationRuntime(): { delivery?: { mission: string; carrying: readonly string[] }; trial?: { mission: string; nextGate: string }; kickMission?: string };
  /** Debug: put the kick ball back on its spot. */
  resetBall(): void;
  /** The ending cut: the golden grass of the stadium blooms (sound, glow, flash); `onBloomDone` fires when it is over. */
  playBloom(): void;
  /** Where the player is right now (debug panel, tests). */
  getState(): { scene: SceneId; x: number; y: number; facing: Facing };
  /** Who stands in the current scene right now (conditional residents included). */
  getNpcCasts(): CastId[];
  /** The kick ball (null while it is being put back after a goal). */
  getBall(): Ball | null;
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

const targetId = (t: InteractTarget) =>
  t.kind === "npc" ? `npc:${t.key}` : t.kind === "object" || t.kind === "ball" ? `${t.kind}:${t.id}` : `examine:${t.id ?? `${t.center.x},${t.center.y}`}`;

const centerOf = (rect: Rect) => ({ x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 });

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
  /** Every NPC entity ever created, so an NPC that disappears (a `when` turns false) and comes back keeps its state. */
  const npcPool = new Map<string, Npc>();
  const runs = new RunManager();

  // The player's "○○의 집" name plate: on the entrance mat's axis like the house's ON AIR sign, above it.
  const homeSign = homeSignAnchor(OVERWORLD_MAP, `house-${playerId}`);

  // ── state ────────────────────────────────────────────────────────────────────────────────
  let scene: WorldScene = getScene("overworld")!;
  const player = { x: 0, y: 0, facing: "down" as Facing, moving: false, running: false, animTime: 0 };
  let camera: Camera = { x: 0, y: 0 };
  /** ON AIR signs of the current scene (member houses of the overworld, none indoors). */
  let onAirSigns: OnAirSign[] = [];
  let npcs: Npc[] = [];
  let uiBlocked = false;
  let talking: Npc | null = null;
  let inputEnabled = true;
  let doorArmed = false;
  let doorGrace = 0;
  let lastZoneId: string | null = null;
  let navigationTarget: NavigationTarget | null = null;
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
  let bumpCooldown = 0;
  const reducedMotion = typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Derived from the save; rebuilt whenever the overlay replaces `store.save` (a mission moved, an item was taken).
  let lastSave: WorldSave | null = null;
  const markerCache = new Map<CastId, MarkerKind | null>();
  let activeTrials: Extract<MissionDef, { kind: "time_trial" }>[] = [];
  let activeKicks: Extract<MissionDef, { kind: "kick_goals" }>[] = [];
  let pickups: SceneObject[] = [];
  let restoreTarget: number[] = [];
  let restoreShown: number[] = [];
  // kick ball, cone touches, where the feet were a frame ago (cone-course gates are crossed, not touched)
  let ball: Ball | null = null;
  let ballRespawn = 0;
  let ballSceneBounce = 0;
  const touchingHazards = new Set<string>();
  let courseFoot: { x: number; y: number } | null = null;
  /** The save changed while a conversation was open: the residents are re-checked once it ends. */
  let npcsStale = false;
  // story-dependent parts of the scene (barriers, decor, examine points, spectators), rebuilt with the save
  let blockers: Rect[] = [];
  let decors: SceneObject[] = [];
  let examineNow: readonly ExaminePoint[] = [];
  let spectatorsNow: SpectatorSpawn[] = [];
  const ambience = new Ambience({ view, reduced: reducedMotion });
  let ambienceZone: string | null = null;
  // the bloom cut (seconds since it began, null = not running) and whether the stadium keeps its golden glow afterwards
  let bloomAt: number | null = null;
  let bloomCue = 0;
  let bloomDone = false;

  // ── scenes ───────────────────────────────────────────────────────────────────────────────
  /** The save as the mission logic sees it (the engine's player is authoritative for "whose missions are excluded"). */
  const missionSave = (): WorldSave => (store.save.player === playerId ? store.save : { ...store.save, player: playerId });

  function npcsFor(target: WorldScene): Npc[] {
    // The chosen member's own spot stays empty; residents with a `when` stand there only while it holds.
    const save = missionSave();
    const list: Npc[] = [];
    for (const spawn of target.npcSpawns) {
      if (spawn.cast === playerId) continue;
      if (spawn.when && !evalCondition(spawn.when, save)) continue;
      const poolKey = `${target.id}|${spawn.key}`;
      let npc = npcPool.get(poolKey);
      if (!npc) {
        npc = createNpc(spawn, getCast(spawn.cast).role === "animal");
        npcPool.set(poolKey, npc);
      }
      list.push(npc);
    }
    return list;
  }

  const zoneIds = (target: WorldScene) => target.zones.map((zone) => zone.id);

  function refreshFromSave(snapRestore = false) {
    lastSave = store.save;
    const save = missionSave();
    markerCache.clear();
    const defs = missionDefsFor(playerId).filter((def) => missionStatus(save, def) === "active");
    activeTrials = defs.filter((def): def is Extract<MissionDef, { kind: "time_trial" }> => def.kind === "time_trial");
    activeKicks = defs.filter((def): def is Extract<MissionDef, { kind: "kick_goals" }> => def.kind === "kick_goals");
    pickups = scene.objects.filter((object) => object.type === "pickup" && !save.collected.includes(object.id) && evalCondition(object.when, save));
    blockers = scene.objects.filter((object) => object.type === "barrier" && object.rect && evalCondition(object.when, save)).map((object) => object.rect!);
    decors = scene.objects.filter((object) => object.type === "decor" && evalCondition(object.when, save));
    // A cheer point of the player's own seat has nobody in it.
    examineNow = scene.examine.filter((point) => evalCondition(point.when, save) && point.action !== `cheer:${playerId}`);
    spectatorsNow = scene.spectators.filter((spot) => spot.cast !== playerId && evalCondition(spot.when, save));
    if (talking) npcsStale = true;
    else npcs = npcsFor(scene);
    restoreTarget = restoreForZones(zoneIds(scene), save);
    if (snapRestore || restoreShown.length !== restoreTarget.length) restoreShown = [...restoreTarget];
  }

  function markerOf(cast: CastId): MarkerKind | null {
    let marker = markerCache.get(cast);
    if (marker === undefined) {
      marker = markerFor(missionSave(), cast) ?? storyMarker(missionSave(), cast);
      markerCache.set(cast, marker);
    }
    return marker;
  }

  const objectById = (id: string) => scene.objects.find((object) => object.id === id);

  const isLive = (soopId: string) => options.onAir?.isLive(soopId) ?? false;

  /** The ON AIR sign under a logical stage point; none while a dialogue/panel owns the input or a fade runs. */
  function onAirSignAtStage(logicalX: number, logicalY: number): OnAirSign | null {
    if (onAirSigns.length === 0 || uiBlocked || transition.active) return null;
    const cam = snapCamera(camera);
    return onAirSignAt(onAirSigns, onAirSize(assets), cam.x + logicalX, cam.y + logicalY);
  }

  function enterScene(id: SceneId, x: number, y: number, facing: Facing) {
    const next = getScene(id);
    if (!next) return;
    scene = next;
    onAirSigns = next.kind === "overworld" ? findOnAirSigns(next.buildings, OVERWORLD_MAP) : [];
    player.x = x;
    player.y = y;
    player.facing = facing;
    player.moving = false;
    player.animTime = 0;
    npcs = npcsFor(next);
    runs.cancelFieldRuns();
    touchingHazards.clear();
    courseFoot = null;
    const ballSpot = next.objects.find((object) => object.type === "ball");
    if (ballSpot && !ball) ball = createBall(ballSpot.x, ballSpot.y);
    if (!staticOrders.has(id)) staticOrders.set(id, buildStaticOrder(next));
    if (next.terrain && !terrainRenderers.has(id)) terrainRenderers.set(id, new TerrainRenderer(assets, next.terrain));
    camera = next.fixedCamera ? interiorCamera(view, next.size) : followCamera({ x: 0, y: 0 }, player, view, next.size, { snap: true });
    doorArmed = false;
    doorGrace = DOOR_GRACE_SECONDS;
    lastZoneId = null;
    ambienceZone = null;
    ambience.setZone(null);
    audio.playAmbience?.(ambienceIdFor(id, null));
    target = null;
    input.reset();
    refreshFromSave(true);
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
    const enteringShop = to.scene === "interior:store" || to.scene === "interior:cafe";
    audio.playSfx(scene.kind === "interior" && to.scene === "overworld" ? "door-close" : enteringShop ? "door-bell" : "door-open");
    transition.start(async () => {
      // The room image loads while the screen is black and stays cached afterwards (docs/world/01 §8).
      if (destination.image && !assets.has(destination.image)) await assets.load([destination.image]);
      enterScene(to.scene, to.x, to.y, to.facing);
      persist();
    });
  }

  // ── update ───────────────────────────────────────────────────────────────────────────────
  /** Colour restoration of a district (docs/world/03 §3): the crossfading value the ground renderer draws. */
  const restoreOfZone = (zoneIndex: number) => restoreOverride ?? restoreShown[zoneIndex] ?? 0;
  const restoreAt = (x: number, y: number) => restoreOfZone(zoneIndexAt(scene, x, y));

  function updateRestore(dt: number) {
    const k = 1 - Math.exp(-dt * RESTORE_FOLLOW);
    for (let i = 0; i < restoreTarget.length; i++) {
      const gap = restoreTarget[i] - (restoreShown[i] ?? 0);
      restoreShown[i] = Math.abs(gap) < 0.002 ? restoreTarget[i] : (restoreShown[i] ?? 0) + gap * k;
    }
  }

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
      stepNpc(npc, dt, composeObstacles(scene.colliders, [...others, ...blockers]));
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
    const obstacles = noclip ? [] : composeObstacles(scene.colliders, [...npcs.map(npcBox), ...blockers]);
    const result = moveAndSlide(box, move.x * speed, move.y * speed, obstacles, scene.walkable);
    // Blocked outright (walking straight into a wall) reads as standing still, not as a walk cycle.
    const moved = Math.hypot(result.x - box.x, result.y - box.y);
    player.x = result.x + box.w / 2;
    player.y = result.y + box.h;
    player.moving = moved > 1e-6;
    player.facing = facingFor(move.x, move.y, player.facing);
    player.animTime = player.moving ? player.animTime + dt : 0;
    if (!player.moving) {
      // A short bump gives feedback for a deliberate wall push without firing every simulation tick.
      if (bumpCooldown <= 0 && Math.hypot(move.x * speed, move.y * speed) > 0) {
        audio.playSfx("bump");
        bumpCooldown = 0.2;
      }
      return;
    }

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
    if (!doorArmed || doorGrace > 0) return;
    if (hit.when && !evalCondition(hit.when, missionSave())) {
      // A shut door tells the player once per approach: they have to step out of the doorway before it speaks again.
      doorArmed = false;
      audio.playSfx("ui-error");
      events().onDoorLocked?.(hit.locked ?? "문이 잠겨 있다.");
      return;
    }
    useDoor(hit);
  }

  /** The district's grade, particles and ambience follow the player even while a panel is open. */
  function updateAmbience(dt: number) {
    if (scene.kind !== "overworld") return;
    const zone = zoneAtPoint(scene, player.x, player.y);
    const id = zone?.id ?? null;
    if (id !== ambienceZone) {
      ambienceZone = id;
      ambience.setZone(zone ? { id: zone.id, tint: zone.tint, ...(zone.particles ? { particles: zone.particles } : {}) } : null);
      audio.playAmbience?.(ambienceIdFor(scene.id, id));
      if (id === "z-weed") audio.playSfx("mower-rev");
    }
    ambience.update(dt);
  }

  function updateBloom(dt: number) {
    if (bloomAt === null) return;
    bloomAt += dt;
    while (bloomCue < BLOOM_CUES.length && bloomAt >= BLOOM_CUES[bloomCue].at) audio.playSfx(BLOOM_CUES[bloomCue++].sfx);
    if (bloomAt >= BLOOM_SECONDS) {
      bloomAt = null;
      bloomDone = true;
      events().onBloomDone?.();
    }
  }

  function checkZone() {
    if (scene.kind !== "overworld") return;
    const zone = zoneAtPoint(scene, player.x, player.y);
    if (zone && zone.id !== lastZoneId) {
      lastZoneId = zone.id;
      events().onZoneEnter?.(zone);
    }
  }

  /** Pickups and the kick ball as interaction candidates (positioned by their sprites). */
  function extraTargets(): ExtraTarget[] {
    const list: ExtraTarget[] = pickups.map((object) => {
      const area: Rect = { x: object.x - 14, y: object.y - 28, w: 28, h: 32 };
      return { target: { kind: "object", id: object.id, prompt: object.prompt ?? "줍기", center: centerOf(area) }, area };
    });
    if (ball && ballRespawn <= 0) {
      const area = ballBox(ball);
      const grown: Rect = { x: area.x - 6, y: area.y - 6, w: area.w + 12, h: area.h + 12 };
      list.push({ target: { kind: "ball", id: "ball", center: centerOf(area) }, area: grown });
    }
    return list;
  }

  function updateTarget() {
    const next = findInteractTarget(player, player.facing, npcs, examineNow, extraTargets());
    if (next && (!target || targetId(next) !== targetId(target))) audio.playSfx("interact-ping");
    target = next;
    if (!next) {
      promptAnchor = null;
      return;
    }
    if (next.kind === "npc") {
      const npc = npcs.find((n) => n.key === next.key);
      promptAnchor = npc ? { x: npc.x, y: npc.y - spriteHeight(npc, getCast(npc.cast)) - 6 } : null;
    } else if (next.kind === "object") {
      promptAnchor = { x: next.center.x, y: next.center.y - 22 };
    } else if (next.kind === "ball") {
      promptAnchor = { x: next.center.x, y: next.center.y - 12 };
    } else {
      promptAnchor = { x: next.center.x, y: next.center.y - 10 };
    }
  }

  function emitRuns(list: readonly RunEvent[]) {
    for (const event of list) events().onRunEvent?.(event);
  }

  function kick() {
    if (!ball) return;
    ball = kickBall(ball, player.facing);
    audio.playSfx("ball-kick");
    // The first kick of an active challenge starts its minute.
    if (!runs.kick) {
      const challenge = activeKicks.find((def) => objectById(def.ball) !== undefined);
      if (challenge) emitRuns(runs.beginKick(challenge.id));
    }
  }

  function handleInteract() {
    if (!input.consumePressed("interact") || !target) return;
    const chosen = target;
    if (chosen.kind === "ball") {
      kick();
      return;
    }
    if (chosen.kind === "object") {
      audio.playSfx("pickup");
      events().onPickup?.(chosen.id);
      target = null;
      promptAnchor = null;
      return;
    }
    if (chosen.kind === "examine" && chosen.action?.startsWith("mailbox:")) {
      const delivered = runs.deliverAt(chosen.action.slice("mailbox:".length));
      if (delivered.length > 0) {
        audio.playSfx("parcel-get");
        emitRuns(delivered);
        target = null;
        promptAnchor = null;
        return;
      }
    }
    audio.playSfx(chosen.kind === "npc" ? "dialog-open" : "examine");
    if (chosen.kind === "npc") {
      const npc = npcs.find((n) => n.key === chosen.key);
      if (npc) {
        if (npc.cast === "cat-jandi") audio.playSfx("cat-meow");
        if (npc.cast === "dog-ball") audio.playSfx("dog-bark");
        const voice = getCast(npc.cast).voiceSfx;
        if (voice) audio.playVoice?.(voice);
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

  /**
   * Cone course (docs/world/03 §7): the gates are the gaps in the row of flags and cones. Walking through a gap (either way)
   * counts: the first one starts the clock, the rest must be crossed in order, cones cost time.
   */
  function checkCourse() {
    if (scene.kind !== "overworld" || activeTrials.length === 0) {
      courseFoot = null;
      return;
    }
    const from = courseFoot;
    courseFoot = { x: player.x, y: player.y };
    const crossed = (gate: string) => {
      const rect = objectById(gate)?.rect;
      return from !== null && rect !== undefined && crossesMidline(from, courseFoot!, rect);
    };
    if (!runs.trial) {
      const def = activeTrials.find((entry) => crossed(entry.gates[0]));
      if (def) {
        touchingHazards.clear();
        audio.playSfx("count-go");
        emitRuns(runs.beginTrial(def.id));
      }
      return;
    }
    const box = footBox(player.x, player.y);
    const next = runs.nextGate();
    if (next && crossed(next.gate)) {
      audio.playSfx("checkpoint");
      emitRuns(runs.passGate());
    }
    for (const object of scene.objects) {
      if (object.type !== "hazard") continue;
      const hit = rectsOverlap(box, { x: object.x - HAZARD_BOX.w / 2, y: object.y - HAZARD_BOX.h, w: HAZARD_BOX.w, h: HAZARD_BOX.h });
      if (!hit) touchingHazards.delete(object.id);
      else if (!touchingHazards.has(object.id)) {
        touchingHazards.add(object.id);
        audio.playSfx("cone-hit");
        emitRuns(runs.hitHazard());
      }
    }
  }

  /** Rolls the kick ball, scores goals and puts the ball back after one. */
  function updateBall(dt: number) {
    ballSceneBounce = Math.max(0, ballSceneBounce - dt);
    if (scene.kind !== "overworld") return;
    const spot = scene.objects.find((object) => object.type === "ball");
    if (!spot?.rect) return;
    if (ballRespawn > 0) {
      ballRespawn -= dt;
      if (ballRespawn <= 0) ball = createBall(spot.x, spot.y);
      return;
    }
    if (!ball) return;
    // The dog that trots around the training ground never gets in the way of a kick: only walls and props stop the ball.
    const step = stepBall(ball, dt, scene.colliders, spot.rect);
    ball = step.ball;
    const goal = scene.objects.find((object) => object.type === "goal" && object.rect && inGoal(step.ball, object.rect));
    if (goal) {
      audio.playSfx("ball-net");
      emitRuns(runs.goalScored());
      ball = null;
      ballRespawn = BALL_RESPAWN_SECONDS;
    } else if (step.bounced && ballSceneBounce === 0) {
      audio.playSfx("ball-post");
      ballSceneBounce = 0.15;
    }
  }

  function update(dt: number) {
    time += dt;
    bumpCooldown = Math.max(0, bumpCooldown - dt);
    transition.update(dt);
    const blocked = uiBlocked || transition.active;
    syncInput();

    if (store.save !== lastSave) refreshFromSave();
    else if (npcsStale && !talking) {
      npcsStale = false;
      npcs = npcsFor(scene);
    }
    updateRestore(dt);
    updateAmbience(dt);
    updateBloom(dt);
    stepNpcs(dt);

    if (!blocked) {
      movePlayer(dt);
      checkDoors(dt);
      checkZone();
      checkCourse();
      for (const object of pickups) {
        if (object.autoCollect && Math.hypot(player.x - object.x, player.y - object.y) < 24 && !store.save.collected.includes(object.id)) {
          audio.playSfx("pickup"); events().onPickup?.(object.id);
        }
      }
      if (store.save !== lastSave) refreshFromSave();
      updateTarget();
      handleInteract();
      updateBall(dt);
      emitRuns(runs.update(dt));
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
    const dynamics: Dynamic[] = npcs.map((npc) => ({ y: npc.y, draw: (c) => drawCharacter(ctx, assets, getCast(npc.cast), npc, c, npc.animal) }));
    // The statue's blessing (state/backwalk.ts) only changes the picture: the player still moves, collides and interacts by the real facing.
    const playerView = isBackwalk(store.save) ? { ...player, facing: oppositeFacing(player.facing) } : player;
    dynamics.push({ y: player.y, draw: (c) => drawCharacter(ctx, assets, playerCast, playerView, c) });
    for (const object of pickups) dynamics.push({ y: object.y, draw: (c) => drawSceneObject(ctx, assets, object, c, time) });
    for (const object of scene.objects) if (object.type === "hazard") dynamics.push({ y: object.y, draw: (c) => drawSceneObject(ctx, assets, object, c, time) });
    for (const object of decors) dynamics.push({ y: object.y, draw: (c) => drawSceneObject(ctx, assets, object, c, time) });
    if (ball) {
      const shown = ball;
      dynamics.push({ y: shown.y + BALL_SIZE / 2, draw: (c) => drawBall(ctx, assets, shown, c) });
    }
    dynamics.sort((a, b) => a.y - b.y);

    if (scene.kind === "interior") {
      drawInterior(ctx, assets, scene, cam);
      for (const spot of spectatorsNow) drawSpectator(ctx, assets, getCast(spot.cast), spot.x, spot.y, cam, time);
      for (const item of dynamics) item.draw(cam);
      // The golden grass of the stadium: it blooms during the ending cut and keeps a soft glow after the ending.
      if (scene.id === STADIUM_SCENE && (bloomAt !== null || bloomDone || store.save.flags[ENDING_SEEN_FLAG] === true)) {
        drawBloom(ctx, view, { x: GOLDEN_GRASS.x - cam.x, y: GOLDEN_GRASS.y - cam.y }, time, bloomAt ?? -1);
      }
      return;
    }

    terrainRenderers.get(scene.id)?.draw(ctx, cam, view, restoreOfZone);
    for (const prop of scene.props) if (prop.decal && propVisible(prop, cam)) drawProp(ctx, assets, prop, cam, restoreAt(prop.x, prop.y));

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
        if (propVisible(prop, cam)) drawProp(ctx, assets, prop, cam, restoreAt(prop.x, prop.y), prop.aboveFrom === null ? "all" : "lower");
      } else {
        const building = scene.buildings[entry.index];
        if (isVisible(building.x - building.w / 2, building.y - building.h, building.w, building.h, cam)) {
          drawBuilding(ctx, assets, building, cam, building.fronts[entry.strip]);
          // The ON AIR sign hangs on the facade: painted with the building's last strip, so it sorts like the wall it is on.
          for (const sign of onAirSigns) {
            if (sign.buildingIndex === entry.index && sign.stripIndex === entry.strip) drawOnAirSign(ctx, assets, sign, isLive(sign.soopId), cam, time, reducedMotion);
          }
        }
      }
    }
    flushDynamics(Infinity);

    // above: canopies and arch spans over everything (docs/world/01 §5 layer 4)
    for (const prop of scene.props) if (prop.aboveFrom !== null && !prop.decal && propVisible(prop, cam)) drawProp(ctx, assets, prop, cam, restoreAt(prop.x, prop.y), "upper");

    if (homeSign && scene.kind === "overworld") drawHomeSign(ctx, cam, homeSign.x, homeSign.y, playerCast.displayName);
  }

  function drawOverlays(cam: Camera) {
    const guide = navigationTarget;
    if (guide && guide.scene === scene.id && !uiBlocked) {
      const npc = guide.npc ? npcs.find((entry) => entry.cast === guide.npc) : undefined;
      const point = npc ?? guide;
      const sx = point.x - cam.x;
      const sy = point.y - (npc ? spriteHeight(npc, getCast(npc.cast)) + 12 : 18) - cam.y;
      if (sx > 8 && sx < VIEW_WIDTH - 8 && sy > 8 && sy < VIEW_HEIGHT - 8) drawTargetArrow(ctx, sx, sy, time);
      else drawEdgePointer(ctx, player, point, cam, time);
    }
    // Mission markers over the givers' heads (docs/world/02 §5); the E bubble and the coach arrow take their place.
    for (const npc of npcs) {
      if (npc.talking || (navigationTarget?.npc === npc.cast && navigationTarget.scene === scene.id) || (target?.kind === "npc" && target.key === npc.key)) continue;
      const marker = markerOf(npc.cast);
      if (!marker) continue;
      const sx = npc.x - cam.x;
      const sy = npc.y - spriteHeight(npc, getCast(npc.cast)) - 2 - cam.y;
      if (sx > -12 && sx < VIEW_WIDTH + 12 && sy > -4 && sy < VIEW_HEIGHT + 40) drawMarker(ctx, assets, marker, sx, sy, time, reducedMotion);
    }
    if (promptAnchor && !uiBlocked && !transition.active) drawPrompt(ctx, assets, promptAnchor.x - cam.x, promptAnchor.y - cam.y, time);
    const hud = runs.hud();
    if (hud) drawRunHud(ctx, hud);
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
    if (scene.kind === "overworld") ambience.draw(ctx);
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
        restore: restoreOverride !== null ? `${restoreOverride.toFixed(2)} (debug)` : `${(restoreShown[zoneIndexAt(scene, player.x, player.y)] ?? 0).toFixed(2)}`,
        pick: lastPick && lastPick.scene === scene.id ? { x: lastPick.x, y: lastPick.y } : null,
        ball,
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
    setNavigationTarget(target) {
      navigationTarget = target;
    },
    pick(logicalX, logicalY) {
      const cam = snapCamera(camera);
      const x = cam.x + logicalX;
      const y = cam.y + logicalY;
      lastPick = { scene: scene.id, x: Math.round(x), y: Math.round(y), tx: Math.floor(x / TILE), ty: Math.floor(y / TILE) };
      events().onDebugPick?.(lastPick);
      return lastPick;
    },
    clickAt(logicalX, logicalY) {
      const sign = onAirSignAtStage(logicalX, logicalY);
      if (!sign) return false;
      audio.playSfx("ui-select");
      events().onOnAirClick?.(sign.soopId, isLive(sign.soopId));
      return true;
    },
    hoverAt(logicalX, logicalY) {
      return onAirSignAtStage(logicalX, logicalY) !== null;
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
    startDelivery(missionId) {
      audio.playSfx("count-go");
      emitRuns(runs.startDelivery(missionId));
    },
    cancelRuns() {
      runs.cancelAll();
    },
    isDeliveryRunning() {
      return runs.delivery !== null;
    },
    getNavigationRuntime() {
      const nextGate = runs.nextGate();
      return {
        ...(runs.delivery ? { delivery: { mission: runs.delivery.mission, carrying: runs.carrying() } } : {}),
        ...(nextGate ? { trial: { mission: nextGate.mission, nextGate: nextGate.gate } } : {}),
        ...(runs.kick ? { kickMission: runs.kick.mission } : {}),
      };
    },
    playBloom() {
      bloomAt = 0;
      bloomCue = 0;
      bloomDone = false;
    },
    resetBall() {
      const spot = scene.objects.find((object) => object.type === "ball");
      if (spot) ball = createBall(spot.x, spot.y);
      ballRespawn = 0;
    },
    getState() {
      return { scene: scene.id, x: player.x, y: player.y, facing: player.facing };
    },
    getNpcCasts() {
      return npcs.map((npc) => npc.cast);
    },
    getBall() {
      return ball;
    },
  };
}
