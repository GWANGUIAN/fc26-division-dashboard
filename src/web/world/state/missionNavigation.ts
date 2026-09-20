import { allSceneIds } from "../data/maps";
import type { MissionDef } from "../data/missionDefs";
import type { NavigationTarget, SceneId, WorldSave } from "../types";
import { getScene } from "../engine/mapScene";
import type { DoorTrigger, SceneObject, WorldScene } from "../engine/scene";
import { evalCondition } from "./conditions";
import { asProgress } from "./missionEval";
import type { MissionView } from "./missions";

/** Ephemeral attempt state held by the engine, used to select the next step within a timed field mission. */
export interface MissionNavigationRuntime {
  delivery?: { mission: string; carrying: readonly string[] };
  trial?: { mission: string; nextGate: string };
  kickMission?: string;
}

export interface MissionNavigationPosition {
  scene: SceneId;
  x: number;
  y: number;
}

const arcadeMachine = (game: string) => ({
  "soccer-sum10": "machine-1",
  kickups: "machine-2",
  freekick: "machine-3",
  cardmatch: "machine-4",
  rush: "machine-5",
}[game] ?? "machine-1");

function centerOfDoor(scene: SceneId, door: DoorTrigger): NavigationTarget {
  return { scene, x: door.rect.x + door.rect.w / 2, y: door.rect.y + door.rect.h / 2 };
}

function activeScenes(save: WorldSave): WorldScene[] {
  return allSceneIds().flatMap((id) => {
    const scene = getScene(id);
    return scene ? [scene] : [];
  });
}

export function navigationNpcTarget(save: WorldSave, cast: NavigationTarget["npc"]): NavigationTarget | null {
  if (!cast) return null;
  for (const scene of activeScenes(save)) {
    const npc = scene.npcSpawns.find((entry) => entry.cast === cast && evalCondition(entry.when, save));
    if (npc) return { scene: scene.id, x: npc.x, y: npc.y, npc: cast };
  }
  return null;
}

function pointFor(scene: WorldScene, x: number, y: number): NavigationTarget {
  return { scene: scene.id, x, y };
}

function examineTarget(save: WorldSave, id: string): NavigationTarget | null {
  for (const scene of activeScenes(save)) {
    const point = scene.examine.find((entry) => entry.id === id && evalCondition(entry.when, save));
    if (point) return pointFor(scene, point.area.x + point.area.w / 2, point.area.y + point.area.h / 2);
  }
  return null;
}

function objectTarget(save: WorldSave, id: string): NavigationTarget | null {
  for (const scene of activeScenes(save)) {
    const object = scene.objects.find((entry) => entry.id === id && evalCondition(entry.when, save));
    // A gate is an area, not a spot on the ground: its x/y is the bottom edge, which for the tall cone-course gates lands
    // on a cone or under the trees, so the guide points at the middle of the area instead.
    if (object?.type === "gate" && object.rect) return pointFor(scene, object.rect.x + object.rect.w / 2, object.rect.y + object.rect.h / 2);
    if (object) return pointFor(scene, object.x, object.y);
  }
  return null;
}

function nearestGoldenBall(save: WorldSave, from: MissionNavigationPosition): NavigationTarget | null {
  const candidates: { target: NavigationTarget; object: SceneObject }[] = [];
  for (const scene of activeScenes(save)) {
    for (const object of scene.objects) {
      if (object.type !== "pickup" || !/^gb-\d{2}$/.test(object.id) || save.collected.includes(object.id) || !evalCondition(object.when, save)) continue;
      candidates.push({ target: pointFor(scene, object.x, object.y), object });
    }
  }
  if (candidates.length === 0) return null;
  if (from.scene !== "overworld") return candidates.sort((a, b) => a.object.id.localeCompare(b.object.id))[0].target;
  return candidates.sort((a, b) => Math.hypot(a.target.x - from.x, a.target.y - from.y) - Math.hypot(b.target.x - from.x, b.target.y - from.y))[0].target;
}

function activeObjective(def: MissionDef, save: WorldSave, from: MissionNavigationPosition, runtime: MissionNavigationRuntime): NavigationTarget | null {
  const progress = asProgress(save.missions[def.id]?.progress);
  switch (def.kind) {
    case "card_reveal":
    case "card_variant":
    case "card_collection":
      return examineTarget(save, "card-cabinet");
    case "minigame_best":
      return examineTarget(save, arcadeMachine(def.game));
    case "collection_count":
      return nearestGoldenBall(save, from);
    case "collect":
      return def.items.find((id) => !save.collected.includes(id)) ? objectTarget(save, def.items.find((id) => !save.collected.includes(id))!) : null;
    case "daily_stamp":
      return examineTarget(save, "daily-board");
    case "delivery": {
      const carrying = runtime.delivery?.mission === def.id ? runtime.delivery.carrying : progress.carrying ?? [];
      if (def.seconds !== undefined && runtime.delivery?.mission !== def.id) return navigationNpcTarget(save, def.giver);
      const next = def.items.find((item) => carrying.includes(item.id) && !(progress.delivered ?? []).includes(item.id));
      if (!next) return null;
      return "mailbox" in next.to ? examineTarget(save, next.to.mailbox) : navigationNpcTarget(save, next.to.cast);
    }
    case "talk_chain": {
      const next = def.targets.find((cast) => !(progress.asked ?? []).includes(cast));
      return next ? navigationNpcTarget(save, next) : null;
    }
    case "time_trial":
      return objectTarget(save, runtime.trial?.mission === def.id ? runtime.trial.nextGate : def.gates[0]);
    case "kick_goals":
      return objectTarget(save, runtime.kickMission === def.id ? def.goal : def.ball);
    case "finale":
    case "talk":
      return navigationNpcTarget(save, def.giver);
  }
}

/** Selects the real next mission objective. Available and ready missions intentionally still route to their giver. */
export function missionObjectiveTarget(
  view: MissionView | null,
  save: WorldSave,
  from: MissionNavigationPosition,
  runtime: MissionNavigationRuntime = {},
): NavigationTarget | null {
  if (!view || view.status === "completed") return null;
  if (view.status !== "active") return navigationNpcTarget(save, view.def.giver);
  return activeObjective(view.def, save, from, runtime) ?? navigationNpcTarget(save, view.def.giver);
}

/**
 * Returns the first door on a shortest enabled scene route. This naturally gives an outdoor building entrance,
 * an interior exit when the player is in another building, and the correct connecting door inside the clubhouse.
 */
export function routeMissionTarget(target: NavigationTarget | null, currentScene: SceneId, save: WorldSave): NavigationTarget | null {
  if (!target) return null;
  if (target.scene === currentScene) return target;

  const queue: SceneId[] = [currentScene];
  const seen = new Set<SceneId>(queue);
  const firstDoor = new Map<SceneId, NavigationTarget>();
  while (queue.length > 0) {
    const sceneId = queue.shift()!;
    const scene = getScene(sceneId);
    if (!scene) continue;
    for (const door of scene.doors) {
      if (!evalCondition(door.when, save) || seen.has(door.to.scene)) continue;
      const first = firstDoor.get(sceneId) ?? centerOfDoor(sceneId, door);
      if (door.to.scene === target.scene) return first;
      seen.add(door.to.scene);
      firstDoor.set(door.to.scene, first);
      queue.push(door.to.scene);
    }
  }
  return null;
}
