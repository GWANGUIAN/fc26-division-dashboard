import { describe, expect, it } from "vitest";
import { INTERIOR_IDS, INTERIOR_MAPS, OVERWORLD_MAP, allSceneIds, hasScene, interiorIdOf } from "./index";
import { composeObstacles, footBox, rectsOverlap } from "../../engine/collision";
import { getScene, tileCenter } from "../../engine/mapScene";
import { NPC_BOX } from "../../engine/npc";
import { isUsableSpot } from "../../engine/world";
import type { WorldScene } from "../../engine/scene";
import { createNewGameSave } from "../../storage";
import type { Rect, SceneId } from "../../types";
import { PROP_DEFS, propAssetKey } from "../propDefs";
import { parseTerrainCode } from "../terrainDefs";
import { PLAYABLE_CAST, WORLD_CAST, getCast, isCastId } from "../worldCast";
import { getWorldAssetUrl } from "../../worldAssets";
import { parseAction } from "../../state/actions";
import { KNOWN_CONDITION_HEADS, conditionRefs } from "../../state/conditions";
import { MISSION_DEFS, getMissionDef, missionDefsFor } from "../missionDefs";

// Map integrity (docs/world/03 §10): door targets exist, arrival spots are open ground, NPC ids belong
// to the cast, every referenced asset exists, and — beyond the doc's list — every door and resident can
// actually be reached on foot from where the player starts.

const scenes = allSceneIds().map((id) => getScene(id)!);
const overworld = getScene("overworld")!;

/** Grid flood fill: which 8px cells can the foot box stand on and walk to from `start`? Returns a lookup. */
function reachable(scene: WorldScene, start: { x: number; y: number }, blockers: Rect[] = []) {
  const step = 8;
  const cols = Math.ceil(scene.size.w / step);
  const rows = Math.ceil(scene.size.h / step);
  const obstacles = composeObstacles(scene.colliders, blockers);
  const standable = (cx: number, cy: number) => {
    const x = cx * step + step / 2;
    const y = cy * step + step / 2;
    const box = footBox(x, y);
    const w = scene.walkable;
    if (box.x < w.x || box.x + box.w > w.x + w.w || box.y < w.y || box.y + box.h > w.y + w.h) return false;
    return obstacles.query(box).every((rect) => !rectsOverlap(box, rect));
  };
  const seen = new Uint8Array(cols * rows);
  const sx = Math.floor(start.x / step);
  const sy = Math.floor(start.y / step);
  const queue: number[] = [sy * cols + sx];
  seen[sy * cols + sx] = 1;
  while (queue.length > 0) {
    const index = queue.pop()!;
    const cx = index % cols;
    const cy = Math.floor(index / cols);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || seen[ny * cols + nx]) continue;
      if (!standable(nx, ny)) continue;
      seen[ny * cols + nx] = 1;
      queue.push(ny * cols + nx);
    }
  }
  return {
    /** Can the player stand somewhere with the foot box overlapping `rect`? */
    touches(rect: Rect) {
      for (let cy = Math.floor((rect.y - 10) / step); cy <= Math.ceil((rect.y + rect.h + 10) / step); cy++) {
        for (let cx = Math.floor((rect.x - 10) / step); cx <= Math.ceil((rect.x + rect.w + 10) / step); cx++) {
          if (cx < 0 || cy < 0 || cx >= cols || cy >= rows || !seen[cy * cols + cx]) continue;
          if (rectsOverlap(footBox(cx * step + step / 2, cy * step + step / 2), rect)) return true;
        }
      }
      return false;
    },
    /** Can the player stand within `range` px of a point? */
    near(point: { x: number; y: number }, range: number) {
      return this.touches({ x: point.x - range, y: point.y - range, w: range * 2, h: range * 2 });
    },
  };
}

const residents = (scene: WorldScene) => scene.npcSpawns.filter((spawn) => !spawn.when);
const npcRects = (scene: WorldScene) => residents(scene).map((spawn) => footBox(spawn.x, spawn.y, NPC_BOX.w, NPC_BOX.h));

describe("map data shape", () => {
  it("has 19 interiors and the 80×60 overworld with 60 rows of 80 legend characters", () => {
    expect(INTERIOR_IDS).toHaveLength(19);
    expect(OVERWORLD_MAP.size).toEqual([80, 60]);
    expect(OVERWORLD_MAP.terrainRows).toHaveLength(60);
    for (const row of OVERWORLD_MAP.terrainRows) {
      expect(row).toHaveLength(80);
      for (const char of row) expect(OVERWORLD_MAP.legend[char]).toBeDefined();
    }
  });

  it("uses only known terrain sheet slots in the legend", () => {
    for (const code of Object.values(OVERWORLD_MAP.legend)) expect(parseTerrainCode(code), code).not.toBeNull();
  });

  it("puts every walkable tile in a zone", () => {
    const [x, y, w, h] = OVERWORLD_MAP.walkable;
    for (let ty = y; ty < y + h; ty++) {
      for (let tx = x; tx < x + w; tx++) {
        const zone = OVERWORLD_MAP.zones.find((z) => tx >= z.rect[0] && tx <= z.rect[2] && ty >= z.rect[1] && ty <= z.rect[3]);
        expect(zone, `tile ${tx},${ty}`).toBeDefined();
      }
    }
  });

  it("has unique interior ids and examine ids", () => {
    expect(new Set(INTERIOR_IDS).size).toBe(INTERIOR_IDS.length);
    const ids = [...OVERWORLD_MAP.examine.map((e) => e.id), ...Object.values(INTERIOR_MAPS).flatMap((m) => m.examine.map((e) => e.id))].filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("doors", () => {
  it("lead to scenes that exist, onto open ground inside the destination", () => {
    for (const scene of scenes) {
      for (const door of scene.doors) {
        expect(hasScene(door.to.scene), `${scene.id} -> ${door.to.scene}`).toBe(true);
        const destination = getScene(door.to.scene)!;
        expect(isUsableSpot(destination, door.to.x, door.to.y), `${scene.id} -> ${door.to.scene} arrives inside a wall`).toBe(true);
      }
    }
  });

  it("puts every building's door on the last row of its sprite box and links it to an interior", () => {
    for (const building of OVERWORLD_MAP.buildings) {
      if (!building.door) continue;
      const [x0, , x1, y1] = building.rect;
      const [dx, dy, dw, dh] = building.door;
      expect(dy + dh - 1, building.id).toBe(y1);
      expect(dx).toBeGreaterThanOrEqual(x0);
      expect(dx + dw - 1).toBeLessThanOrEqual(x1);
      expect(building.interior && hasScene(`interior:${building.interior}`), building.id).toBe(true);
    }
  });

  it("returns from each building's interior to the tile in front of its door", () => {
    for (const building of OVERWORLD_MAP.buildings) {
      if (!building.interior || !building.door) continue;
      const room = INTERIOR_MAPS[building.interior];
      expect(room.exitTo.scene).toBe("overworld");
      expect(room.exitTo.tile, building.interior).toEqual([building.door[0] + 1, building.door[1] + building.door[3]]);
    }
  });

  it("gives every interior a bottom exit door and an open spawn above it", () => {
    for (const id of INTERIOR_IDS) {
      const room = INTERIOR_MAPS[id];
      const scene = getScene(`interior:${id}`)!;
      expect(room.triggers.some((t) => t.rect.join() === "9,11,2,1" && t.to.scene === room.exitTo.scene), id).toBe(true);
      expect(room.spawn).toEqual([10, 10]);
      expect(isUsableSpot(scene, scene.spawn.x, scene.spawn.y), `${id} spawn`).toBe(true);
    }
  });

  it("has interior-to-interior doors that come back to the same room", () => {
    for (const id of INTERIOR_IDS) {
      for (const trigger of INTERIOR_MAPS[id].triggers) {
        const target = interiorIdOf(trigger.to.scene);
        if (target === null || trigger.rect.join() === "9,11,2,1") continue;
        const back = INTERIOR_MAPS[target].triggers.find((t) => t.to.scene === `interior:${id}`);
        expect(back, `${target} should lead back to ${id}`).toBeDefined();
      }
    }
  });
});

describe("spawns and residents", () => {
  it("starts every playable member in the doorway of their own house, on open ground", () => {
    for (const cast of PLAYABLE_CAST) {
      const save = createNewGameSave(cast.id);
      expect(save.scene).toBe(`interior:house-${cast.id}`);
      const scene = getScene(save.scene)!;
      expect(scene, cast.id).toBeDefined();
      expect(isUsableSpot(scene, save.x, save.y), cast.id).toBe(true);
    }
  });

  it("has an open overworld spawn", () => {
    expect(isUsableSpot(overworld, overworld.spawn.x, overworld.spawn.y)).toBe(true);
  });

  it("only lists NPCs that are in the cast, standing on open ground", () => {
    for (const scene of scenes) {
      for (const spawn of scene.npcSpawns) {
        expect(isCastId(spawn.cast), spawn.cast).toBe(true);
        expect(isUsableSpot(scene, spawn.x, spawn.y), `${scene.id} ${spawn.key} at ${spawn.x},${spawn.y}`).toBe(true);
      }
    }
  });

  it("keeps the map's residents in step with worldCast's spawn tiles", () => {
    for (const cast of WORLD_CAST) {
      const entries = scenes.flatMap((scene) => scene.npcSpawns.filter((s) => s.cast === cast.id).map((s) => ({ scene: scene.id, x: s.x, y: s.y })));
      expect(entries.length, `${cast.id} has no place on the map`).toBeGreaterThan(0);
      expect(entries.some((e) => e.scene === cast.spawn.scene && e.x === cast.spawn.x && e.y === cast.spawn.y), cast.id).toBe(true);
      if (cast.home) expect(hasScene(cast.home as SceneId), cast.id).toBe(true);
    }
  });

  it("keeps the wander areas of walking NPCs inside their scene", () => {
    for (const scene of scenes) {
      for (const spawn of scene.npcSpawns) {
        if (spawn.ai !== "wander") continue;
        expect(spawn.wander, spawn.key).toBeDefined();
        const w = spawn.wander!;
        expect(spawn.x).toBeGreaterThanOrEqual(w.x);
        expect(spawn.x).toBeLessThanOrEqual(w.x + w.w);
        expect(spawn.y).toBeGreaterThanOrEqual(w.y);
        expect(spawn.y).toBeLessThanOrEqual(w.y + w.h);
      }
    }
  });
});

describe("assets", () => {
  it("only places props that have a definition and an image", () => {
    for (const entry of OVERWORLD_MAP.props) {
      expect(PROP_DEFS[entry.prop], entry.prop).toBeDefined();
      expect(getWorldAssetUrl(propAssetKey(entry.prop)), entry.prop).toBeDefined();
      if (PROP_DEFS[entry.prop].withered) expect(getWorldAssetUrl(propAssetKey(entry.prop, true)), `${entry.prop}-withered`).toBeDefined();
    }
  });

  it("has an image for every building, interior room, cast atlas and terrain sheet the map uses", () => {
    for (const building of OVERWORLD_MAP.buildings) expect(getWorldAssetUrl(`buildings/${building.id}`), building.id).toBeDefined();
    for (const id of INTERIOR_IDS) expect(getWorldAssetUrl(INTERIOR_MAPS[id].image), id).toBeDefined();
    for (const cast of WORLD_CAST) expect(getWorldAssetUrl(`characters/${cast.id}-atlas`), cast.id).toBeDefined();
    for (const code of Object.values(OVERWORLD_MAP.legend)) {
      const slot = parseTerrainCode(code)!;
      expect(getWorldAssetUrl(`terrain/${slot.sheet}`), code).toBeDefined();
    }
  });

  it("has a stand image and a neutral portrait for each of the 11 members", () => {
    for (const cast of PLAYABLE_CAST) {
      expect(getWorldAssetUrl(`characters/${cast.id}-stand`), cast.id).toBeDefined();
      expect(getWorldAssetUrl(`portraits/${cast.id}-neutral`), cast.id).toBeDefined();
    }
  });
});

describe("reachability on foot", () => {
  it("connects the overworld spawn to every door front and every resident", () => {
    const walk = reachable(overworld, overworld.spawn, npcRects(overworld));
    const unreachable: string[] = [];
    for (const door of overworld.doors) if (!walk.touches(door.rect)) unreachable.push(`door ${door.rect.x / 32},${door.rect.y / 32} -> ${door.to.scene}`);
    // The weed zone stays sealed until the ending (S4): its gate NPCs and the factory door are not expected to be reachable.
    for (const spawn of residents(overworld)) {
      if (spawn.x >= 54 * 32 && spawn.y >= 44 * 32 && spawn.cast === "weeder-grunt") continue;
      if (!walk.near(spawn, 30)) unreachable.push(`npc ${spawn.key}`);
    }
    const sealed = overworld.doors.filter((door) => door.to.scene === "interior:factory");
    expect(unreachable.filter((label) => !sealed.some((door) => label.startsWith(`door ${door.rect.x / 32},${door.rect.y / 32}`)))).toEqual([]);
    for (const door of sealed) expect(walk.touches(door.rect), "factory door must stay sealed until the ending").toBe(false);
  });

  it("connects each interior's spawn to its doors and residents", () => {
    for (const id of INTERIOR_IDS) {
      const scene = getScene(`interior:${id}`)!;
      const walk = reachable(scene, scene.spawn, npcRects(scene));
      for (const door of scene.doors) expect(walk.touches(door.rect), `${id}: door ${door.rect.x},${door.rect.y}`).toBe(true);
      for (const spawn of residents(scene)) expect(walk.near(spawn, 30), `${id}: ${spawn.key}`).toBe(true);
    }
  });

  it("puts each house's owner within reach of the player who is not that owner", () => {
    // The chosen member's own NPC is skipped at spawn time; everyone else must be talkable.
    for (const cast of PLAYABLE_CAST) expect(getCast(cast.id).spawn.scene).toBe("overworld");
  });
});

describe("mission objects (S3)", () => {
  const objects = overworld.objects;
  const byId = new Map(objects.map((object) => [object.id, object]));
  const mailboxes = OVERWORLD_MAP.examine.filter((entry) => parseAction(entry.action)?.type === "mailbox");
  const walk = reachable(overworld, overworld.spawn, npcRects(overworld));

  it("has unique object ids that do not clash with examine ids", () => {
    expect(byId.size).toBe(objects.length);
    const examineIds = new Set(OVERWORLD_MAP.examine.map((entry) => entry.id));
    for (const object of objects) expect(examineIds.has(object.id), object.id).toBe(false);
  });

  it("puts every pickup, cone and the ball on open ground the player can walk to", () => {
    for (const object of objects) {
      if (object.type !== "pickup" && object.type !== "hazard" && object.type !== "ball") continue;
      expect(walk.near(object, 34), `${object.id} cannot be reached on foot`).toBe(true);
    }
    for (const object of objects) {
      if (object.type !== "pickup" && object.type !== "ball") continue;
      expect(isUsableSpot(overworld, object.x, object.y), `${object.id} sits inside a wall`).toBe(true);
    }
  });

  it("can walk to every gate and to the goal's face", () => {
    for (const object of objects) if (object.type === "gate" || object.type === "goal") expect(walk.near(object.rect!, 24), object.id).toBe(true);
  });

  it("keeps the ball's pitch inside the walkable map and the goal inside the pitch", () => {
    const ball = objects.find((object) => object.type === "ball")!;
    const goal = objects.find((object) => object.type === "goal")!;
    expect(ball.rect!.x).toBeGreaterThanOrEqual(overworld.walkable.x);
    expect(goal.rect!.x).toBeGreaterThanOrEqual(ball.rect!.x);
    expect(goal.rect!.y).toBeGreaterThanOrEqual(ball.rect!.y);
    expect(goal.rect!.y + goal.rect!.h).toBeLessThanOrEqual(ball.rect!.y + ball.rect!.h);
    expect(ball.x).toBeGreaterThan(ball.rect!.x);
    expect(ball.x).toBeLessThan(ball.rect!.x + ball.rect!.w);
  });

  it("gives the goal a solid prop: the ball scores at its face, it cannot roll through", () => {
    const goal = objects.find((object) => object.type === "goal")!;
    const solid = overworld.colliderRects.filter((rect) => rectsOverlap(rect, goal.rect!));
    expect(solid.length).toBeGreaterThan(0);
  });

  it("makes the cone course a real slalom: no single lane satisfies every checkpoint", () => {
    const def = getMissionDef("m-tdnlamuron-conerun");
    if (def?.kind !== "time_trial") throw new Error("mission");
    const lanes = def.gates.slice(1, -1).map((id) => byId.get(id)!.rect!);
    const upper = lanes.filter((_, i) => i % 2 === 0);
    const lower = lanes.filter((_, i) => i % 2 === 1);
    const upperBottom = Math.max(...upper.map((rect) => rect.y + rect.h));
    const lowerTop = Math.min(...lower.map((rect) => rect.y));
    // A foot box is 10px tall: it can touch both a lane above and a lane below only if they are closer than that.
    expect(lowerTop - upperBottom).toBeGreaterThan(10);
    // Each cone sits between the two lanes of its column, so a runner keeping to one lane never touches it.
    for (const id of def.hazards) {
      const cone = byId.get(id)!;
      expect(cone.y - 10).toBeGreaterThanOrEqual(upperBottom);
      expect(cone.y).toBeLessThanOrEqual(lowerTop);
    }
  });

  it("has every world object a mission names, with the right kind", () => {
    for (const def of MISSION_DEFS) {
      if (def.kind === "collect") for (const id of def.items) expect(byId.get(id)?.type, `${def.id}: ${id}`).toBe("pickup");
      if (def.kind === "time_trial") {
        for (const id of def.gates) expect(byId.get(id)?.type, `${def.id}: ${id}`).toBe("gate");
        for (const id of def.hazards) expect(byId.get(id)?.type, `${def.id}: ${id}`).toBe("hazard");
      }
      if (def.kind === "kick_goals") {
        expect(byId.get(def.goal)?.type).toBe("goal");
        expect(byId.get(def.ball)?.type).toBe("ball");
      }
      if (def.kind === "delivery") {
        for (const item of def.items) {
          if ("mailbox" in item.to) {
            const box = item.to.mailbox;
            expect(mailboxes.some((entry) => entry.id === box), `${def.id}: ${box}`).toBe(true);
          } else expect(isCastId(item.to.cast), item.id).toBe(true);
        }
      }
    }
  });

  it("shows a pickup only while the mission that needs it is active", () => {
    for (const object of objects) {
      if (object.type !== "pickup") continue;
      const owners = MISSION_DEFS.filter((def) => def.kind === "collect" && def.items.includes(object.id));
      expect(owners, object.id).toHaveLength(1);
      expect(object.when, object.id).toBe(`mission-active:${owners[0].id}`);
    }
  });

  it("can walk up to every delivery mailbox", () => {
    for (const box of mailboxes) {
      const at = tileCenter(box.tile[0], box.tile[1]);
      expect(walk.near(at, 40), box.id).toBe(true);
    }
  });

  it("uses only conditions the game understands, naming missions that exist", () => {
    const expressions: string[] = [];
    for (const scene of scenes) {
      for (const spawn of scene.npcSpawns) if (spawn.when) expressions.push(spawn.when);
      for (const object of scene.objects) if (object.when) expressions.push(object.when);
    }
    expect(expressions.length).toBeGreaterThan(0);
    for (const expr of expressions) {
      const { heads, ids } = conditionRefs(expr);
      heads.forEach((head, index) => {
        expect(KNOWN_CONDITION_HEADS, expr).toContain(head);
        if (head.startsWith("mission-")) expect(getMissionDef(ids[index]), expr).toBeDefined();
      });
    }
  });

  it("only uses examine actions the game understands", () => {
    for (const scene of scenes) {
      for (const point of scene.examine) if (point.action) expect(parseAction(point.action), `${scene.id}: ${point.action}`).not.toBeNull();
    }
  });

  it("connects the four minigames to arcade machines and the card cabinet to the director's office", () => {
    const arcade = getScene("interior:arcade")!;
    const games = arcade.examine.map((point) => parseAction(point.action)).filter((action) => action?.type === "minigame").map((action) => (action as { game: string }).game);
    expect([...games].sort()).toEqual(["cardmatch", "freekick", "kickups", "soccer-sum10"]);
    const office = getScene("interior:clubhouse-office")!;
    expect(office.examine.some((point) => parseAction(point.action)?.type === "cards")).toBe(true);
  });
});

describe("mission definitions", () => {
  it("has unique ids, real givers and prerequisites, and a hint for every mission", () => {
    const ids = MISSION_DEFS.map((def) => def.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const def of MISSION_DEFS) {
      expect(isCastId(def.giver), def.id).toBe(true);
      expect(def.objective.length, def.id).toBeGreaterThan(0);
      expect(def.hint.length, def.id).toBeGreaterThan(0);
      for (const id of def.requires ?? []) expect(getMissionDef(id), `${def.id} requires ${id}`).toBeDefined();
    }
  });

  it("has a giver standing somewhere the player can find them, for every mission", () => {
    const placed = new Set(scenes.flatMap((scene) => scene.npcSpawns.map((spawn) => spawn.cast)));
    for (const def of MISSION_DEFS) expect(placed.has(def.giver), def.id).toBe(true);
    for (const def of MISSION_DEFS) {
      if (def.kind === "talk_chain") for (const cast of def.targets) expect(placed.has(cast), `${def.id}: ${cast}`).toBe(true);
    }
  });

  it("makes every main mission one shard, ten for any player", () => {
    for (const cast of PLAYABLE_CAST) {
      const mains = missionDefsFor(cast.id).filter((def) => def.main);
      expect(mains, cast.id).toHaveLength(10);
      expect(mains.reduce((sum, def) => sum + (def.reward.shard ?? 0), 0), cast.id).toBe(10);
    }
  });
});

describe("sanity of tileCenter", () => {
  it("puts feet in the middle of a tile", () => {
    expect(tileCenter(10, 10)).toEqual({ x: 336, y: 336 });
  });
});
