import type { InteriorMapData, OverworldMapData, SceneId } from "../../types";
import overworldJson from "./overworld.json";

// The map files are hand-tuned JSON (docs/world/03 §10). `resolveJsonModule` infers loose types
// (number[] instead of tuples), so they are cast once here and checked by maps/mapIntegrity.test.ts.
export const OVERWORLD_MAP = overworldJson as unknown as OverworldMapData;

const interiorModules = import.meta.glob<InteriorMapData>("./interiors/*.json", { eager: true, import: "default" });

export const INTERIOR_MAPS: Record<string, InteriorMapData> = Object.fromEntries(
  Object.values(interiorModules).map((map) => [map.id, map as InteriorMapData]),
);

export const INTERIOR_IDS: string[] = Object.keys(INTERIOR_MAPS).sort();

export function interiorSceneId(interiorId: string): SceneId {
  return `interior:${interiorId}`;
}

/** "interior:house-doormomo" → "house-doormomo", or null for the overworld. */
export function interiorIdOf(scene: SceneId): string | null {
  return scene.startsWith("interior:") ? scene.slice("interior:".length) : null;
}

export function hasScene(scene: SceneId): boolean {
  if (scene === "overworld") return true;
  const id = interiorIdOf(scene);
  return id !== null && id in INTERIOR_MAPS;
}

export function allSceneIds(): SceneId[] {
  return ["overworld", ...INTERIOR_IDS.map(interiorSceneId)];
}
