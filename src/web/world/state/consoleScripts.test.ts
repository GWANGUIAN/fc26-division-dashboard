import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { getMissionDef, missionDefsFor } from "../data/missionDefs";
import { PLAYABLE_CAST } from "../data/worldCast";
import { PROLOGUE_DONE_FLAG, WORLD_SAVE_KEY, createNewGameSave, parseWorldSave } from "../storage";
import type { CastId, WorldSave } from "../types";
import { heldGoldenBalls } from "./finaleBalls";
import { canSpendBalls, finaleRoundOutcome } from "./missionEval";
import { applyMissionEvent, missionStatus } from "./missions";
import { roundCall } from "./npcDialogue";
import { pendingStoryBeat, withEndingFlags } from "./story";

// docs/world/13-debug-console-scripts.md holds scripts people paste into the browser console. They are read from
// the document and run here against a fake localStorage, so a renamed mission id or a changed save shape cannot
// silently leave the document behind.

const doc = readFileSync(new URL("../../../../docs/world/13-debug-console-scripts.md", import.meta.url), "utf8");

function scriptOf(name: string): string {
  const match = doc.match(new RegExp("<!-- script: " + name + " -->\\s*```js\\n([\\s\\S]*?)```"));
  if (!match) throw new Error(`script ${name} not found in the document`);
  return match[1];
}

function makeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    map,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
  };
}

function run(name: string, storage: ReturnType<typeof makeStorage>) {
  const messages = { log: vi.fn(), error: vi.fn() };
  new Function("localStorage", "console", scriptOf(name))(storage, messages);
  return messages;
}

const finishedPrologue = (player: CastId): WorldSave => ({ ...createNewGameSave(player), flags: { [PROLOGUE_DONE_FLAG]: true } });

function savedOf(storage: ReturnType<typeof makeStorage>): WorldSave {
  const parsed = parseWorldSave(JSON.parse(storage.getItem(WORLD_SAVE_KEY)!));
  if (parsed.status === "invalid") throw new Error(`the script left an invalid save: ${parsed.reason}`);
  return parsed.save;
}

const finale = getMissionDef("m-90-finale")!;

describe("console script: only the showdown left", () => {
  for (const { id: player } of PLAYABLE_CAST) {
    it(`leaves ${player} with ten shards, an open stadium and a fresh showdown`, () => {
      const storage = makeStorage({ [WORLD_SAVE_KEY]: JSON.stringify(finishedPrologue(player)) });
      const { error } = run("finale", storage);
      expect(error).not.toHaveBeenCalled();
      const save = savedOf(storage);
      expect(save.shards).toBe(10);
      expect(save.flags[PROLOGUE_DONE_FLAG]).toBe(true);
      expect(save.flags["stadium-open"]).toBe(true);
      expect(save.flags["ending-seen"]).toBeUndefined();
      for (const def of missionDefsFor(player).filter((entry) => entry.main)) expect(missionStatus(save, def), def.id).toBe("completed");
      expect(missionDefsFor(player).filter((entry) => entry.main)).toHaveLength(10);
      expect(missionStatus(save, getMissionDef("m-89-director-report")!)).toBe("completed");
      expect(missionStatus(save, finale)).toBe("available");
      expect(pendingStoryBeat(save)).toBeNull();
    });
  }

  it("keeps the previous save as a backup and can be run twice", () => {
    const original = JSON.stringify(finishedPrologue("janine95kim"));
    const storage = makeStorage({ [WORLD_SAVE_KEY]: original });
    run("finale", storage);
    expect(storage.getItem(WORLD_SAVE_KEY + "-backup")).toBe(original);
    const once = storage.getItem(WORLD_SAVE_KEY);
    run("finale", storage);
    expect(storage.getItem(WORLD_SAVE_KEY)).toBe(once);
  });

  it("puts a save that already saw the ending back in front of the showdown", () => {
    const done = withEndingFlags({ ...finishedPrologue("bboringirl"), flags: { [PROLOGUE_DONE_FLAG]: true, "finale-won": true, "weed-restored": true } });
    const storage = makeStorage({ [WORLD_SAVE_KEY]: JSON.stringify({ ...done, missions: { "m-90-finale": { status: "completed" } }, collected: ["gb-03"], bests: { rush: 900 } }) });
    run("finale", storage);
    const save = savedOf(storage);
    for (const flag of ["finale-won", "ending-seen", "area-weed-open", "weed-restored"]) expect(save.flags[flag], flag).toBeUndefined();
    expect(missionStatus(save, finale)).toBe("available");
    // everything else the player earned stays
    expect(save.collected).toEqual(["gb-03"]);
    expect(save.bests.rush).toBe(900);
  });

  it("changes nothing and complains when there is no save or no chosen character", () => {
    const empty = makeStorage();
    expect(run("finale", empty).error).toHaveBeenCalledTimes(1);
    expect(empty.map.size).toBe(0);
    const unpicked = makeStorage({ [WORLD_SAVE_KEY]: JSON.stringify({ ...createNewGameSave("janine95kim"), player: null }) });
    const before = unpicked.getItem(WORLD_SAVE_KEY);
    expect(run("finale", unpicked).error).toHaveBeenCalledTimes(1);
    expect(unpicked.getItem(WORLD_SAVE_KEY)).toBe(before);
  });
});

describe("console script: showdown at round three with twelve balls", () => {
  if (finale.kind !== "finale") throw new Error("finale");

  for (const { id: player } of PLAYABLE_CAST) {
    it(`leaves ${player} in the showdown with two rounds cleared and twelve held balls`, () => {
      const storage = makeStorage({ [WORLD_SAVE_KEY]: JSON.stringify(finishedPrologue(player)) });
      const { error } = run("round3", storage);
      expect(error).not.toHaveBeenCalled();
      const save = savedOf(storage);
      expect(save.shards).toBe(10);
      expect(save.flags["stadium-open"]).toBe(true);
      expect(save.flags["ending-seen"]).toBeUndefined();
      expect(missionStatus(save, finale)).toBe("active");
      expect(save.missions["m-90-finale"].progress).toEqual({ round: 2 });
      expect(heldGoldenBalls(save)).toBe(12);
      expect(canSpendBalls(finale, save.missions["m-90-finale"].progress, save.collected)).toBe(true);
      expect(pendingStoryBeat(save)).toBeNull();
    });
  }

  it("asks for the card match next, and the balls can still clear that round", () => {
    const storage = makeStorage({ [WORLD_SAVE_KEY]: JSON.stringify(finishedPrologue("janine95kim")) });
    run("round3", storage);
    const save = savedOf(storage);
    const progress = save.missions["m-90-finale"].progress;
    expect(roundCall(finale, 2)).toBe("3라운드! 카드 짝 맞추기, 17턴 이하면 통과!");
    expect(finaleRoundOutcome(finale, progress, { game: "cardmatch", score: 17 })).toBe("cleared");
    expect(finaleRoundOutcome(finale, progress, { game: "cardmatch", score: 18 })).toBe("failed");
    expect(finaleRoundOutcome(finale, progress, { game: "freekick", score: 9 })).toBe("ignored");
    const ballsSpent = applyMissionEvent(save, { type: "finale-balls" }).save;
    expect(missionStatus(ballsSpent, finale)).toBe("ready");
  });

  it("keeps other pickups, replaces stray golden balls with exactly twelve, and can be run twice", () => {
    const start = { ...finishedPrologue("bboringirl"), collected: ["lantern-a", "gb-15", "gb-03"] };
    const storage = makeStorage({ [WORLD_SAVE_KEY]: JSON.stringify(start) });
    run("round3", storage);
    const once = storage.getItem(WORLD_SAVE_KEY);
    const save = savedOf(storage);
    expect(save.collected).toContain("lantern-a");
    expect(save.collected).not.toContain("gb-15");
    expect(save.collected.filter((id) => id.startsWith("gb-"))).toHaveLength(12);
    run("round3", storage);
    expect(storage.getItem(WORLD_SAVE_KEY)).toBe(once);
  });

  it("puts a finished showdown back at round three and can be undone with the restore script", () => {
    const done = withEndingFlags({ ...finishedPrologue("sjh4018"), flags: { [PROLOGUE_DONE_FLAG]: true, "finale-won": true } });
    const original = JSON.stringify({ ...done, missions: { "m-90-finale": { status: "completed" } } });
    const storage = makeStorage({ [WORLD_SAVE_KEY]: original });
    run("round3", storage);
    const save = savedOf(storage);
    for (const flag of ["finale-won", "ending-seen", "area-weed-open", "weed-restored"]) expect(save.flags[flag], flag).toBeUndefined();
    expect(missionStatus(save, finale)).toBe("active");
    run("restore", storage);
    expect(storage.getItem(WORLD_SAVE_KEY)).toBe(original);
  });

  it("changes nothing and complains when there is no save or no chosen character", () => {
    const empty = makeStorage();
    expect(run("round3", empty).error).toHaveBeenCalledTimes(1);
    expect(empty.map.size).toBe(0);
    const unpicked = makeStorage({ [WORLD_SAVE_KEY]: JSON.stringify({ ...createNewGameSave("janine95kim"), player: null }) });
    const before = unpicked.getItem(WORLD_SAVE_KEY);
    expect(run("round3", unpicked).error).toHaveBeenCalledTimes(1);
    expect(unpicked.getItem(WORLD_SAVE_KEY)).toBe(before);
  });
});

describe("console script: golden balls", () => {
  it("hands out twelve balls, enough for the showdown's golden-ball round, without duplicating on a second run", () => {
    const storage = makeStorage({ [WORLD_SAVE_KEY]: JSON.stringify(finishedPrologue("janine95kim")) });
    run("finale", storage);
    run("balls", storage);
    run("balls", storage);
    const save = savedOf(storage);
    expect(save.collected).toHaveLength(12);
    expect(heldGoldenBalls(save)).toBe(12);
    if (finale.kind !== "finale") throw new Error("finale");
    expect(canSpendBalls(finale, undefined, save.collected)).toBe(true);
  });
});

describe("console script: restore", () => {
  it("puts back the save from before the last script", () => {
    const original = JSON.stringify(finishedPrologue("sjh4018"));
    const storage = makeStorage({ [WORLD_SAVE_KEY]: original });
    run("finale", storage);
    expect(storage.getItem(WORLD_SAVE_KEY)).not.toBe(original);
    run("restore", storage);
    expect(storage.getItem(WORLD_SAVE_KEY)).toBe(original);
  });

  it("complains when there is nothing to restore", () => {
    expect(run("restore", makeStorage()).error).toHaveBeenCalledTimes(1);
  });
});
