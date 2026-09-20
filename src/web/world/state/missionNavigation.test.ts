import { describe, expect, it } from "vitest";
import { getMissionDef, totalShardsFor } from "../data/missionDefs";
import { getScene } from "../engine/mapScene";
import { createNewGameSave } from "../storage";
import type { CastId, SceneId, WorldSave } from "../types";
import { missionObjectiveTarget, navigationNpcTarget, routeMissionTarget } from "./missionNavigation";
import { acceptMission, applyMissionEvent, completeMission, completeTalk, defaultTracked, markerFor, missionStatusById, missionViews } from "./missions";
import { pendingStoryBeat } from "./story";

const PLAYER: CastId = "janine95kim";
const HERE = { scene: "overworld" as SceneId, x: 0, y: 0 };

function withMainOpen(): WorldSave {
  let save = createNewGameSave(PLAYER);
  save = completeTalk(save, "m-00-hello").save;
  save = acceptMission(save, "m-01-mycard");
  save = applyMissionEvent(save, { type: "card-view", cardId: PLAYER, variant: "normal" }).save;
  return completeMission(save, "m-01-mycard").save;
}

const view = (save: WorldSave, id: string) => missionViews(save).find((entry) => entry.def.id === id) ?? null;

describe("mission objective targets", () => {
  it("points an available mission at its giver and an active one at the real objective", () => {
    let save = withMainOpen();
    const offered = missionObjectiveTarget(view(save, "m-sjh4018-kickups"), save, HERE);
    expect(offered).toMatchObject({ npc: "sjh4018" });

    save = acceptMission(save, "m-sjh4018-kickups");
    const active = missionObjectiveTarget(view(save, "m-sjh4018-kickups"), save, HERE);
    expect(active).toMatchObject({ scene: "interior:arcade" });
    expect(active?.npc).toBeUndefined();
  });

  it("returns to the giver once the mission is ready to report", () => {
    let save = withMainOpen();
    save = acceptMission(save, "m-sjh4018-kickups");
    save = applyMissionEvent(save, { type: "minigame", result: { game: "kickups", score: 99 } }).save;
    expect(missionStatusById(save, "m-sjh4018-kickups")).toBe("ready");
    expect(missionObjectiveTarget(view(save, "m-sjh4018-kickups"), save, HERE)).toMatchObject({ npc: "sjh4018" });
  });

  it("guides a collect mission to the first item still missing", () => {
    let save = withMainOpen();
    save = acceptMission(save, "s-elder-water");
    const first = missionObjectiveTarget(view(save, "s-elder-water"), save, HERE);
    expect(first).toMatchObject({ scene: "overworld" });
    save = applyMissionEvent(save, { type: "pickup", id: "water-1" }).save;
    const second = missionObjectiveTarget(view(save, "s-elder-water"), save, HERE);
    expect(second).not.toEqual(first);
  });

  it("guides the cone course through the gaps of the cone row, one after another", () => {
    const save = acceptMission(withMainOpen(), "m-tdnlamuron-conerun");
    const def = getMissionDef("m-tdnlamuron-conerun");
    if (def?.kind !== "time_trial") throw new Error("m-tdnlamuron-conerun is not a time trial");
    const scene = getScene("overworld")!;
    const cones = def.hazards.map((id) => scene.objects.find((object) => object.id === id)!);
    const gateTarget = (gate: string) => missionObjectiveTarget(view(save, "m-tdnlamuron-conerun"), save, HERE, { trial: { mission: def.id, nextGate: gate } })!;

    for (const id of def.gates) {
      const rect = scene.objects.find((object) => object.id === id)!.rect!;
      expect(gateTarget(id)).toMatchObject({ scene: "overworld", x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 });
    }
    // every step points at the cone line itself, between two neighbours: start gap, four cone gaps, finish gap
    for (const id of def.gates) expect(gateTarget(id).y).toBe(cones[0].y);
    expect(gateTarget(def.gates[0]).x).toBeLessThan(cones[0].x);
    for (let i = 0; i < cones.length - 1; i++) {
      const at = gateTarget(def.gates[i + 1]).x;
      expect(at).toBeGreaterThan(cones[i].x);
      expect(at).toBeLessThan(cones[i + 1].x);
    }
    expect(gateTarget(def.gates.at(-1)!).x).toBeGreaterThan(cones.at(-1)!.x);
  });
});

describe("routing through doors", () => {
  const arcade = { scene: "interior:arcade" as SceneId, x: 100, y: 100 };
  const office = { scene: "interior:clubhouse-office" as SceneId, x: 100, y: 100 };
  const save = withMainOpen();

  it("uses the target itself when it is in the current scene", () => {
    expect(routeMissionTarget(arcade, "interior:arcade", save)).toBe(arcade);
  });

  it("points at the building entrance from outdoors", () => {
    const door = routeMissionTarget(arcade, "overworld", save);
    expect(door?.scene).toBe("overworld");
    expect(door).not.toEqual(arcade);
  });

  it("points at the exit from another building", () => {
    const exit = routeMissionTarget(arcade, "interior:store", save);
    expect(exit?.scene).toBe("interior:store");
  });

  it("points at the connecting door between rooms of the clubhouse", () => {
    const toOffice = routeMissionTarget(office, "interior:clubhouse-lobby", save);
    expect(toOffice?.scene).toBe("interior:clubhouse-lobby");
    const backToLobby = routeMissionTarget(office, "interior:arcade", save);
    expect(backToLobby?.scene).toBe("interior:arcade");
  });

  it("skips locked doors", () => {
    const stadium = { scene: "interior:stadium" as SceneId, x: 100, y: 100 };
    expect(routeMissionTarget(stadium, "overworld", save)).toBeNull();
  });
});

describe("director report mission", () => {
  function allShards(): WorldSave {
    return { ...withMainOpen(), shards: totalShardsFor(PLAYER) };
  }

  it("appears the moment the last shard is in, tracked by default, with a ? over the director", () => {
    const partial = { ...withMainOpen(), shards: totalShardsFor(PLAYER) - 1 };
    expect(missionStatusById(partial, "m-89-director-report")).toBe("locked");
    const save = allShards();
    expect(missionStatusById(save, "m-89-director-report")).toBe("available");
    expect(markerFor(save, "woowakgood")).toBe("new");
    expect(defaultTracked(missionViews(save))?.def.id).toBe("m-89-director-report");
  });

  it("leads the player to the director in his office", () => {
    const save = allShards();
    const target = missionObjectiveTarget(view(save, "m-89-director-report"), save, HERE);
    expect(target).toMatchObject({ scene: "interior:clubhouse-office", npc: "woowakgood" });
    expect(navigationNpcTarget(save, "woowakgood")).toEqual(target);
  });

  it("opens the stadium when reported and unlocks the finale", () => {
    const done = completeTalk(allShards(), "m-89-director-report");
    expect(done.reward?.flags).toContain("stadium-open");
    expect(missionStatusById(done.save, "m-89-director-report")).toBe("completed");
    expect(missionStatusById(done.save, "m-90-finale")).toBe("available");
    expect(pendingStoryBeat(done.save)).toBeNull();
    expect(getMissionDef("m-90-finale")?.giver).toBe("referee");
  });

  it("is not offered to saves whose stadium was opened before the mission existed", () => {
    const legacy = { ...allShards(), flags: { ...allShards().flags, "stadium-open": true as const } };
    expect(missionStatusById(legacy, "m-89-director-report")).toBe("locked");
  });
});
