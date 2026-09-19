import { describe, expect, it } from "vitest";
import { getMissionDef, type MissionDef } from "../data/missionDefs";
import { describeProgress, evaluateEvent, initialProgress, meetsMinigameGoal, type EvalContext, type MissionEvent } from "./missionEval";

const def = (id: string): MissionDef => {
  const found = getMissionDef(id);
  if (!found) throw new Error(`no mission ${id}`);
  return found;
};
const ctx = (over: Partial<EvalContext> = {}): EvalContext => ({ player: "janine95kim", collected: [], ...over });
const run = (id: string, event: MissionEvent, progress: unknown = undefined, c: EvalContext = ctx()) => evaluateEvent(def(id), progress, event, c);
const round = (game: "soccer-sum10" | "kickups" | "freekick" | "cardmatch", score: number): MissionEvent => ({ type: "minigame", result: { game, score } });

describe("minigame_best", () => {
  it("needs the score at or above the minimum", () => {
    expect(run("m-doormomo-sum10", round("soccer-sum10", 59))?.ready).toBe(false);
    expect(run("m-doormomo-sum10", round("soccer-sum10", 60))?.ready).toBe(true);
    expect(run("m-sjh4018-kickups", round("kickups", 14))?.ready).toBe(false);
    expect(run("m-sjh4018-kickups", round("kickups", 15))?.ready).toBe(true);
    expect(run("m-kaksjak0730-freekick", round("freekick", 3))?.ready).toBe(false);
    expect(run("m-kaksjak0730-freekick", round("freekick", 4))?.ready).toBe(true);
  });

  it("counts the card game the other way round: fewer turns is better", () => {
    expect(run("m-janine95kim-cardmatch", round("cardmatch", 23))?.ready).toBe(false);
    expect(run("m-janine95kim-cardmatch", round("cardmatch", 22))?.ready).toBe(true);
    expect(run("m-janine95kim-cardmatch", round("cardmatch", 14))?.ready).toBe(true);
  });

  it("ignores a round of a different game", () => {
    expect(run("m-doormomo-sum10", round("kickups", 500))).toBeNull();
  });

  it("accepts any game for the warm-up, whatever the score", () => {
    expect(run("m-02-arcade", round("cardmatch", 40))?.ready).toBe(true);
    expect(run("m-02-arcade", round("kickups", 0))?.ready).toBe(true);
  });

  it("keeps the best attempt (lowest turns for the card game)", () => {
    const cards = run("m-janine95kim-cardmatch", round("cardmatch", 30), { best: 26 });
    expect(cards?.progress.best).toBe(26);
    expect(run("m-janine95kim-cardmatch", round("cardmatch", 24), { best: 26 })?.progress.best).toBe(24);
    expect(run("m-doormomo-sum10", round("soccer-sum10", 30), { best: 45 })?.progress.best).toBe(45);
    expect(run("m-doormomo-sum10", round("soccer-sum10", 50), { best: 45 })?.progress.best).toBe(50);
  });

  it("exposes the threshold check for the log", () => {
    const sum10 = def("m-doormomo-sum10");
    if (sum10.kind !== "minigame_best") throw new Error("kind");
    expect(meetsMinigameGoal(sum10, { game: "soccer-sum10", score: 60 })).toBe(true);
    expect(meetsMinigameGoal(sum10, { game: "kickups", score: 60 })).toBe(false);
  });
});

describe("card missions", () => {
  it("card_reveal wants the player's own card, any theme", () => {
    expect(run("m-01-mycard", { type: "card-view", cardId: "janine95kim", variant: "normal" })?.ready).toBe(true);
    expect(run("m-01-mycard", { type: "card-view", cardId: "doormomo", variant: "normal" })).toBeNull();
    expect(run("m-01-mycard", { type: "card-view", cardId: "ju010228", variant: "lowq" }, undefined, ctx({ player: "ju010228" }))?.ready).toBe(true);
  });

  it("card_variant wants that member's card in that theme", () => {
    expect(run("m-lina0108-card-lowq", { type: "card-view", cardId: "lina0108", variant: "lowq" })?.ready).toBe(true);
    expect(run("m-lina0108-card-lowq", { type: "card-view", cardId: "lina0108", variant: "retro" })).toBeNull();
    expect(run("m-lina0108-card-lowq", { type: "card-view", cardId: "bboringirl", variant: "lowq" })).toBeNull();
    expect(run("m-bboringirl-card-retro", { type: "card-view", cardId: "bboringirl", variant: "retro" })?.ready).toBe(true);
  });
});

describe("collect", () => {
  it("is ready once every item is in the collected list", () => {
    const lanterns = ["jelly-lantern-a", "jelly-lantern-b", "jelly-lantern-c"];
    expect(run("m-haepalin-lanterns", { type: "pickup", id: "jelly-lantern-a" }, undefined, ctx({ collected: ["jelly-lantern-a"] }))?.ready).toBe(false);
    expect(run("m-haepalin-lanterns", { type: "pickup", id: "jelly-lantern-c" }, undefined, ctx({ collected: lanterns }))?.ready).toBe(true);
  });

  it("ignores items of other missions", () => {
    expect(run("m-haepalin-lanterns", { type: "pickup", id: "water-1" })).toBeNull();
  });

  it("describes progress from the collected list, so it survives leaving the world", () => {
    expect(describeProgress(def("m-haepalin-lanterns"), undefined, ["jelly-lantern-b", "water-1"])).toBe("1/3 해파리 랜턴");
  });
});

describe("delivery", () => {
  const to = (mailbox: string) => ({ mailbox });

  it("hands over parcels at their own mailbox only, in any order", () => {
    let progress: unknown = initialProgress(def("m-tleod1818-delivery"));
    const wrong = run("m-tleod1818-delivery", { type: "delivered", item: "parcel-a", to: to("mb-east") }, progress);
    expect(wrong).toBeNull();
    const a = run("m-tleod1818-delivery", { type: "delivered", item: "parcel-c", to: to("mb-north") }, progress);
    expect(a?.ready).toBe(false);
    progress = a?.progress;
    const b = run("m-tleod1818-delivery", { type: "delivered", item: "parcel-a", to: to("mb-west") }, progress);
    progress = b?.progress;
    expect(b?.ready).toBe(false);
    const c = run("m-tleod1818-delivery", { type: "delivered", item: "parcel-b", to: to("mb-east") }, progress);
    expect(c?.ready).toBe(true);
    expect(describeProgress(def("m-tleod1818-delivery"), c?.progress, [])).toContain("3/3");
  });

  it("does not count the same parcel twice", () => {
    const first = run("m-tleod1818-delivery", { type: "delivered", item: "parcel-a", to: to("mb-west") }, {});
    expect(run("m-tleod1818-delivery", { type: "delivered", item: "parcel-a", to: to("mb-west") }, first?.progress)).toBeNull();
  });

  it("untimed delivery to a person: carry it, talk to them", () => {
    const start = initialProgress(def("s-shop-milk"));
    expect(start.carrying).toEqual(["milk"]);
    expect(run("s-shop-milk", { type: "talk", cast: "kid" }, start)).toBeNull();
    const done = run("s-shop-milk", { type: "talk", cast: "elder" }, start);
    expect(done?.ready).toBe(true);
    expect(done?.progress.carrying).toEqual([]);
    expect(run("s-shop-milk", { type: "talk", cast: "elder" }, done?.progress)).toBeNull(); // already handed over
  });
});

describe("time_trial and kick_goals", () => {
  it("pass a trial at or under the limit; a slower one only records the best", () => {
    expect(run("m-tdnlamuron-conerun", { type: "trial-finished", mission: "m-tdnlamuron-conerun", seconds: 25 })?.ready).toBe(true);
    const slow = run("m-tdnlamuron-conerun", { type: "trial-finished", mission: "m-tdnlamuron-conerun", seconds: 26.5 }, { best: 30 });
    expect(slow?.ready).toBe(false);
    expect(slow?.progress.best).toBe(26.5);
  });

  it("only listens to its own mission's run", () => {
    expect(run("m-tdnlamuron-conerun", { type: "trial-finished", mission: "other", seconds: 5 })).toBeNull();
    expect(run("m-ju010228-kickgoals", { type: "kick-finished", mission: "other", goals: 9 })).toBeNull();
  });

  it("kick_goals needs the required goals", () => {
    expect(run("m-ju010228-kickgoals", { type: "kick-finished", mission: "m-ju010228-kickgoals", goals: 4 })?.ready).toBe(false);
    expect(run("m-ju010228-kickgoals", { type: "kick-finished", mission: "m-ju010228-kickgoals", goals: 5 })?.ready).toBe(true);
  });
});

describe("talk_chain", () => {
  it("needs all three people, in any order, each counted once", () => {
    let progress: unknown = initialProgress(def("m-hachi97-talkchain"));
    for (const cast of ["elder", "elder", "kid"] as const) {
      const step = run("m-hachi97-talkchain", { type: "talk", cast }, progress);
      if (step) progress = step.progress;
    }
    expect(describeProgress(def("m-hachi97-talkchain"), progress, [])).toBe("2/3 명");
    expect(run("m-hachi97-talkchain", { type: "talk", cast: "cat-jandi" }, progress)).toBeNull();
    const last = run("m-hachi97-talkchain", { type: "talk", cast: "shopkeeper" }, progress);
    expect(last?.ready).toBe(true);
  });
});
