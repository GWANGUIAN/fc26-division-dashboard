import { describe, expect, it } from "vitest";
import { MEMBER_ZONE, missionDefsFor } from "../data/missionDefs";
import { OVERWORLD_MAP } from "../data/maps";
import { createNewGameSave } from "../storage";
import type { CastId, WorldSave } from "../types";
import { globalRestore, restoreForZones, restoreOfZoneId, zoneDone } from "./progress";

const done = (save: WorldSave, ...ids: string[]): WorldSave => ({
  ...save,
  shards: save.shards + ids.length,
  missions: { ...save.missions, ...Object.fromEntries(ids.map((id) => [id, { status: "completed" as const }])) },
});

describe("restoreOfZoneId", () => {
  it("is fully withered with no shards", () => {
    const save = createNewGameSave("janine95kim");
    for (const zone of OVERWORLD_MAP.zones) expect(restoreOfZoneId(zone.id, save)).toBe(0);
  });

  it("is fully lush everywhere but the Weeder district with all ten shards", () => {
    let save = createNewGameSave("janine95kim");
    save = done(save, ...missionDefsFor("janine95kim").filter((def) => def.main).map((def) => def.id));
    expect(save.shards).toBe(10);
    for (const zone of OVERWORLD_MAP.zones) expect(restoreOfZoneId(zone.id, save)).toBe(zone.id === "z-weed" ? 0 : 1);
    expect(restoreOfZoneId("z-weed", { ...save, flags: { ...save.flags, "weed-restored": true } })).toBe(1);
  });

  it("greens a member's own district faster than the rest (0.6·s + 0.4·zoneDone)", () => {
    const save = done(createNewGameSave("janine95kim"), "m-sjh4018-kickups"); // z-cloud has one member mission
    expect(globalRestore(save)).toBeCloseTo(0.1);
    expect(restoreOfZoneId("z-cloud", save)).toBeCloseTo(0.6 * 0.1 + 0.4 * 1);
    expect(restoreOfZoneId("z-spring", save)).toBeCloseTo(0.6 * 0.1 + 0.4 * 0); // spring has three, none done
    expect(restoreOfZoneId("z-center", save)).toBeCloseTo(0.1); // no member mission: follows the global value
  });

  it("mixes partial district progress", () => {
    const save = done(createNewGameSave("hachi97"), "m-ju010228-kickgoals", "m-lina0108-card-lowq");
    // hachi's own mission is excluded, so spring has two missions and both are done
    expect(zoneDone("z-spring", save)).toBe(1);
    expect(restoreOfZoneId("z-spring", save)).toBeCloseTo(0.6 * 0.2 + 0.4);
    const other = done(createNewGameSave("janine95kim"), "m-ju010228-kickgoals");
    expect(zoneDone("z-spring", other)).toBeCloseTo(1 / 3);
  });

  it("falls back to the global value for a district whose only member is the player", () => {
    const save = done(createNewGameSave("sjh4018"), "m-doormomo-sum10");
    expect(zoneDone("z-cloud", save)).toBeNull();
    expect(restoreOfZoneId("z-cloud", save)).toBeCloseTo(0.1);
  });

  it("returns values in zone order for the renderer", () => {
    const save = done(createNewGameSave("janine95kim"), "m-sjh4018-kickups");
    const ids = OVERWORLD_MAP.zones.map((zone) => zone.id);
    const values = restoreForZones(ids, save);
    expect(values).toHaveLength(ids.length);
    expect(values[ids.indexOf("z-cloud")]).toBeGreaterThan(values[ids.indexOf("z-center")]);
  });
});

describe("MEMBER_ZONE", () => {
  it("matches the district each member's house stands in", () => {
    const zoneAt = (tx: number, ty: number) => OVERWORLD_MAP.zones.find((z) => tx >= z.rect[0] && tx <= z.rect[2] && ty >= z.rect[1] && ty <= z.rect[3])?.id;
    for (const building of OVERWORLD_MAP.buildings) {
      const member = building.id.replace("house-", "") as CastId;
      if (!building.id.startsWith("house-")) continue;
      const door = building.door!;
      expect(MEMBER_ZONE[member], building.id).toBe(zoneAt(door[0], door[1]));
    }
  });
});
