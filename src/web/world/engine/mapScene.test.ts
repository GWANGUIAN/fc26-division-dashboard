import { describe, expect, it } from "vitest";
import { OVERWORLD_MAP } from "../data/maps";
import { PROP_DEFS } from "../data/propDefs";
import { footBox, rectsOverlap } from "./collision";
import { entranceX } from "./entrance";
import { getScene, terrainCodeAt, tileCenter, zoneAtPoint, buildingFronts } from "./mapScene";
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
    const inWall = footBox(door.rect.x + 32, door.rect.y - 8);
    expect(overworld.colliderRects.some((r) => rectsOverlap(inWall, r))).toBe(true);
    expect(door.rect.h).toBe(2 * 32 - 12); // outdoor trigger keeps both door tiles, minus the front-edge trim
    // The expanded trigger begins one tile higher but stays disarmed once the player has stepped past the threshold.
    expect(rectsOverlap(footBox(door.rect.x + 32, door.rect.y + door.rect.h - 8), door.rect)).toBe(true);
    expect(rectsOverlap(footBox(door.rect.x + 32, door.rect.y + door.rect.h + 12), door.rect)).toBe(false);
  });

  it("only blocks a building's ground footprint: the roof above and the transparent corners of a round base stay walkable", () => {
    const blocked = (x: number, y: number) => overworld.colliderRects.some((r) => rectsOverlap(footBox(x, y), r));
    // clubhouse box is tiles 34..45 × 6..13, its footprint starts 160px below the top of the sprite
    expect(blocked(40 * 32, 6 * 32 + 100)).toBe(false);
    expect(blocked(40 * 32, 6 * 32 + 200)).toBe(true);
    // stadium: the ellipse-shaped base leaves the bottom-left corner of its box open
    expect(blocked(27 * 32 + 40, 42 * 32 - 4)).toBe(false);
    expect(blocked(27 * 32 + 420, 42 * 32 - 40)).toBe(true);
  });

  it("sorts each column of a building where its solid ends: round-base corners and the door notch sit in front of the wall behind them", () => {
    const stadium = overworld.buildings.find((b) => b.id === "stadium")!;
    const top = stadium.y - stadium.h;
    const sortAt = (px: number) => stadium.fronts.find((f) => px >= f.x && px < f.x + f.w)!.sortY - top;
    expect(sortAt(500)).toBe(stadium.h); // under the front of the base: sorted at the sprite bottom
    expect(sortAt(400)).toBe(stadium.h - 32); // door notch: the wall above it ends one row higher
    expect(sortAt(60)).toBe(448); // rounded corner: the base ends well above the sprite bottom
    expect(stadium.fronts.reduce((sum, f) => sum + f.w, 0)).toBe(stadium.w);
    expect(stadium.fronts[0].x).toBe(0);
  });

  it("finds the sort line of a building from the solids inside its box", () => {
    const box = { x: 100, y: 200, w: 10, h: 40 };
    expect(buildingFronts(box, [])).toEqual([{ x: 0, w: 10, sortY: 240 }]);
    // one wall over columns 2..7 down to y=230; the columns beside it sort at its back edge (y=210)
    expect(buildingFronts(box, [{ x: 102, y: 210, w: 6, h: 20 }])).toEqual([
      { x: 0, w: 2, sortY: 210 },
      { x: 2, w: 6, sortY: 230 },
      { x: 8, w: 2, sortY: 210 },
    ]);
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

  it("fires every building's door only while the character's feet are over its entrance mat", () => {
    let shifted = 0;
    for (const building of OVERWORLD_MAP.buildings) {
      if (!building.door) continue;
      const trigger = overworld.doors.find((door) => door.to.scene === `interior:${building.interior}`)!;
      const mat = entranceX(building.door, OVERWORLD_MAP.props);
      expect(trigger.rect.x + trigger.rect.w / 2, building.id).toBe(mat);
      if (mat !== (building.door[0] + building.door[2] / 2) * 32) shifted++;
      const feetY = trigger.rect.y + trigger.rect.h; // a foot box ending here reaches into the trigger
      const halfMat = PROP_DEFS["mat-door"].content[0] / 2;
      for (const dx of [0, -(halfMat - 1), halfMat - 1]) expect(rectsOverlap(footBox(mat + dx, feetY), trigger.rect), `${building.id} on the mat ${dx}`).toBe(true);
      for (const dx of [-(halfMat + 1), halfMat + 1, -36, 36]) expect(rectsOverlap(footBox(mat + dx, feetY), trigger.rect), `${building.id} beside the mat ${dx}`).toBe(false);
    }
    // the door tiles had the factory wrong: its mat lies at 2224, the tiles' middle at 2208
    expect(shifted).toBeGreaterThan(0);
    const factory = overworld.doors.find((door) => door.to.scene === "interior:factory")!;
    expect(factory.rect.x + factory.rect.w / 2).toBe(2224);
  });
});
