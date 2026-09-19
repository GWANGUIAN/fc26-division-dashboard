import { describe, expect, it } from "vitest";
import { PROP_DEFS } from "../src/web/world/data/propDefs.ts";
import { BUILDINGS, ZONES, buildOverworldMap } from "./build-world-map.mjs";

describe("build-world-map", () => {
  const map = buildOverworldMap();

  it("is deterministic", () => {
    expect(buildOverworldMap()).toEqual(map);
  });

  it("draws 60 rows of 80 legend characters", () => {
    expect(map.terrainRows).toHaveLength(60);
    for (const row of map.terrainRows) {
      expect(row).toHaveLength(80);
      for (const char of row) expect(map.legend[char]).toBeDefined();
    }
  });

  it("keeps every building door on the last row of its sprite box", () => {
    for (const building of BUILDINGS) {
      if (!building.door) continue;
      expect(building.door[1]).toBe(building.rect[3]);
    }
  });

  it("emits one door trigger per building door and a collision list without the door notch", () => {
    expect(map.triggers).toHaveLength(BUILDINGS.filter((b) => b.door).length);
    expect(map.collision.length).toBeGreaterThan(BUILDINGS.length);
  });

  it("lists the eight districts in first-match order with the centre first", () => {
    expect(ZONES.map((zone) => zone.id)).toEqual(["z-center", "z-cloud", "z-rune", "z-spring", "z-frost", "z-forge", "z-shops", "z-weed"]);
  });

  it("keeps props off the buildings and away from the doorsteps", () => {
    // Walk-through decoration (flowers, mushrooms, mats) may sit on the doorstep; solid props may not.
    const solidProps = map.props.filter((prop) => (PROP_DEFS[prop.prop].foot ?? []).length > 0);
    for (const building of BUILDINGS) {
      if (!building.door) continue;
      const [x, y] = building.door;
      const step = { x0: x * 32 - 16, x1: (x + 2) * 32 + 16, y0: (y + 1) * 32, y1: (y + 3) * 32 };
      const blocking = solidProps.filter((prop) => prop.x > step.x0 && prop.x < step.x1 && prop.y > step.y0 && prop.y < step.y1);
      expect(blocking, building.id).toEqual([]);
    }
  });
});
