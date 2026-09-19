import { describe, expect, it } from "vitest";
import { OVERWORLD_MAP } from "../data/maps";
import { PROP_DEFS } from "../data/propDefs";
import { footBox, rectsOverlap } from "./collision";
import { getScene, terrainCodeAt, tileCenter, zoneAtPoint } from "./mapScene";
import { buildStaticOrder, isVisible } from "./render";

const overworld = getScene("overworld")!;

describe("getScene", () => {
  it("builds the overworld and every interior, caches them, and rejects unknown ids", () => {
    expect(overworld.kind).toBe("overworld");
    expect(getScene("overworld")).toBe(overworld);
    expect(getScene("interior:store")?.fixedCamera).toBe(true);
    expect(getScene("interior:store")?.size).toEqual({ w: 640, h: 384 });
    expect(getScene("interior:nope")).toBeUndefined();
  });
});

describe("overworld scene", () => {
  it("is 80×60 tiles with a two-tile border band outside the walkable area", () => {
    expect(overworld.size).toEqual({ w: 2560, h: 1920 });
    expect(overworld.walkable).toEqual({ x: 64, y: 64, w: 2432, h: 1792 });
  });

  it("anchors building sprites to the bottom edge of their tile box", () => {
    const clubhouse = overworld.buildings.find((b) => b.id === "clubhouse")!;
    expect(clubhouse).toMatchObject({ x: 40 * 32, y: 14 * 32, w: 384, h: 256, key: "buildings/clubhouse" });
    const stadium = overworld.buildings.find((b) => b.id === "stadium")!;
    expect(stadium).toMatchObject({ w: 832, h: 512 });
  });

  it("blocks the visible building but leaves the clubhouse's two-tile door trigger open at its threshold", () => {
    const door = overworld.doors.find((d) => d.to.scene === "interior:clubhouse-lobby")!;
    const inDoorway = footBox(door.rect.x + 32, door.rect.y + door.rect.h - 10);
    expect(overworld.colliderRects.some((r) => rectsOverlap(inDoorway, r))).toBe(false);
    const inWall = footBox(door.rect.x + 32, door.rect.y - 40);
    expect(overworld.colliderRects.some((r) => rectsOverlap(inWall, r))).toBe(true);
    expect(door.rect.h).toBe(2 * 32 - 12); // outdoor trigger keeps both door tiles, minus the front-edge trim
    // The expanded trigger begins one tile higher but stays disarmed once the player has stepped past the threshold.
    expect(rectsOverlap(footBox(door.rect.x + 32, door.rect.y + door.rect.h - 8), door.rect)).toBe(true);
    expect(rectsOverlap(footBox(door.rect.x + 32, door.rect.y + door.rect.h + 12), door.rect)).toBe(false);
  });

  it("puts the stadium door on its south gate, where the art has it", () => {
    const door = overworld.doors.find((d) => d.to.scene === "interior:stadium")!;
    expect(door.rect.y / 32).toBe(41);
  });

  it("gives props their footprint from propDefs and keeps decals out of the sort order", () => {
    const oak = overworld.props.find((p) => p.id === "tree-oak")!;
    expect(oak.foot).toEqual(PROP_DEFS["tree-oak"].foot);
    expect(oak.aboveFrom).toBe(40);
    const order = buildStaticOrder(overworld);
    expect(order.some((entry) => entry.kind === 0 && overworld.props[entry.index].decal)).toBe(false);
    for (let i = 1; i < order.length; i++) expect(order[i].sortY).toBeGreaterThanOrEqual(order[i - 1].sortY);
  });

  it("finds the zone and the ground under a point", () => {
    expect(zoneAtPoint(overworld, 40 * 32, 21 * 32)?.id).toBe("z-center");
    expect(zoneAtPoint(overworld, 12 * 32, 24 * 32)?.id).toBe("z-spring");
    expect(zoneAtPoint(overworld, 70 * 32, 50 * 32)?.id).toBe("z-weed");
    expect(terrainCodeAt(overworld, 40 * 32 + 5, 21 * 32 + 5)).toMatch(/^core\/plaza/);
    expect(terrainCodeAt(overworld, 66 * 32, 34 * 32 + 5)).toMatch(/^water\/bridge/);
  });

  it("keeps deep water solid except under the bridge", () => {
    const deepNorth = footBox(66 * 32, 32 * 32);
    expect(overworld.colliderRects.some((r) => rectsOverlap(deepNorth, r))).toBe(true);
    const onBridge = footBox(66 * 32, 34 * 32 + 20);
    expect(overworld.colliderRects.some((r) => rectsOverlap(onBridge, r))).toBe(false);
  });
});

describe("interior scene", () => {
  it("is a fixed-camera 640×384 room whose door leads back outside", () => {
    const room = getScene("interior:house-doormomo")!;
    expect(room.spawn).toEqual(tileCenter(10, 10));
    const exit = room.doors.find((d) => d.to.scene === "overworld")!;
    expect(exit.rect).toEqual({ x: 288, y: 352, w: 64, h: 32 });
    expect({ x: exit.to.x, y: exit.to.y }).toEqual(tileCenter(67, 13));
  });

  it("keeps the clubhouse office door open through its lower approach area", () => {
    const lobby = getScene("interior:clubhouse-lobby")!;
    const office = lobby.doors.find((door) => door.to.scene === "interior:clubhouse-office")!;
    expect(office.rect).toEqual({ x: 18 * 32, y: 4 * 32, w: 32, h: 4 * 32 });
    const lowerApproach = footBox(18 * 32 + 16, 8 * 32 + 4);
    expect(lobby.colliderRects.some((rect) => rectsOverlap(lowerApproach, rect))).toBe(false);
    expect(rectsOverlap(lowerApproach, office.rect)).toBe(true);
  });
});

describe("isVisible", () => {
  it("tests a rect against the 640×360 view", () => {
    expect(isVisible(0, 0, 10, 10, { x: 0, y: 0 })).toBe(true);
    expect(isVisible(700, 0, 10, 10, { x: 0, y: 0 })).toBe(false);
    expect(isVisible(600, 340, 100, 100, { x: 0, y: 0 })).toBe(true);
  });
});

describe("map data", () => {
  it("has door triggers for every building with a door", () => {
    const doors = OVERWORLD_MAP.buildings.filter((b) => b.door);
    expect(overworld.doors).toHaveLength(doors.length);
  });
});
