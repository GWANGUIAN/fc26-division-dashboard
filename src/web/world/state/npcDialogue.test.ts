import { describe, expect, it } from "vitest";
import { getCast } from "../data/worldCast";
import { createNewGameSave } from "../storage";
import type { CastId, WorldSave } from "../types";
import { acceptMission, applyMissionEvent, completeMission, completeTalk } from "./missions";
import { buildConversation, type Conversation } from "./npcDialogue";

const talkTo = (cast: CastId, save: WorldSave, over: { talked?: number; deliveryRunning?: boolean } = {}): Conversation =>
  buildConversation({ cast: getCast(cast), save, talked: over.talked ?? 1, deliveryRunning: over.deliveryRunning ?? false });

const text = (conversation: Conversation) => conversation.node.lines.map((entry) => entry.text).join("\n");

function mainOpen(player: CastId = "janine95kim"): WorldSave {
  let save = completeTalk(createNewGameSave(player), "m-00-hello").save;
  save = acceptMission(save, "m-01-mycard");
  save = applyMissionEvent(save, { type: "card-view", cardId: player, variant: "normal" }).save;
  return completeMission(save, "m-01-mycard").save;
}

describe("the tutorial greeting", () => {
  it("is the elder's first conversation and finishes m-00 when it ends", () => {
    const first = talkTo("elder", createNewGameSave("janine95kim"), { talked: 0 });
    expect(first.endEffects).toEqual([{ type: "finish-talk", mission: "m-00-hello" }]);
    expect(text(first)).toContain("클럽하우스");
    expect(first.node.choices?.length).toBeGreaterThan(0);
  });

  it("falls back to idle chatter once it is done", () => {
    const done = completeTalk(createNewGameSave("janine95kim"), "m-00-hello").save;
    const again = talkTo("elder", done);
    expect(again.endEffects).toEqual([]);
    expect(again.node.lines.length).toBeGreaterThan(0);
  });
});

describe("a mission giver", () => {
  it("offers a new mission with an accept choice, marked as a temporary line", () => {
    const save = mainOpen();
    const offer = talkTo("doormomo", save);
    expect(text(offer)).toContain("천리안 셈법");
    expect(text(offer)).toContain("임시 대사");
    expect(offer.node.choices?.map((choice) => choice.label)).toEqual(["받는다", "나중에"]);
    expect(offer.node.choices?.[0].effect).toEqual({ type: "accept", mission: "m-doormomo-sum10" });
    expect(offer.node.choices?.[1].next).toBeNull();
  });

  it("greets on the very first meeting, before the offer", () => {
    const offer = talkTo("doormomo", mainOpen(), { talked: 0 });
    expect(offer.node.lines[0].text).toContain("문모모");
    expect(text(offer)).toContain("천리안 셈법");
  });

  it("shows the goal and progress while the mission is active, without choices", () => {
    let save = acceptMission(mainOpen(), "m-haepalin-lanterns");
    save = applyMissionEvent(save, { type: "pickup", id: "jelly-lantern-a" }).save;
    const hint = talkTo("haepalin", save);
    expect(text(hint)).toContain("1/3");
    expect(hint.node.choices).toBeUndefined();
    expect(hint.endEffects).toEqual([]);
  });

  it("takes the report when the goal is met and completes the mission at the end", () => {
    let save = acceptMission(mainOpen(), "m-sjh4018-kickups");
    save = applyMissionEvent(save, { type: "minigame", result: { game: "kickups", score: 30 } }).save;
    const report = talkTo("sjh4018", save);
    expect(report.endEffects).toEqual([{ type: "complete", mission: "m-sjh4018-kickups" }]);
    expect(text(report)).toContain("잔디 조각");
  });

  it("explains the shard story when the director's mission is reported", () => {
    let save = completeTalk(createNewGameSave("janine95kim"), "m-00-hello").save;
    save = acceptMission(save, "m-01-mycard");
    save = applyMissionEvent(save, { type: "card-view", cardId: "janine95kim", variant: "normal" }).save;
    const report = talkTo("woowakgood", save);
    expect(text(report)).toContain("잔디 조각");
    expect(report.endEffects).toEqual([{ type: "complete", mission: "m-01-mycard" }]);
  });

  it("does not talk about a mission that belongs to the player", () => {
    const save = mainOpen("janine95kim");
    expect(text(talkTo("janine95kim", save))).not.toContain("서리 카드");
  });
});

describe("the timed delivery giver", () => {
  it("offers the parcels with the time limit", () => {
    const offer = talkTo("tleod1818", mainOpen());
    expect(offer.node.choices?.[0].label).toBe("받는다 (90초)");
  });

  it("lets the player take the parcels again after a failed round, but not during one", () => {
    const save = acceptMission(mainOpen(), "m-tleod1818-delivery");
    const retry = talkTo("tleod1818", save, { deliveryRunning: false });
    expect(retry.node.choices?.[0].effect).toEqual({ type: "retry", mission: "m-tleod1818-delivery" });
    const busy = talkTo("tleod1818", save, { deliveryRunning: true });
    expect(busy.node.choices).toBeUndefined();
  });
});

describe("rumors and deliveries to people", () => {
  it("asks the three people of the talk chain about the rumor once each", () => {
    let save = acceptMission(mainOpen(), "m-hachi97-talkchain");
    expect(text(talkTo("kid", save))).toContain("용볼");
    save = applyMissionEvent(save, { type: "talk", cast: "kid" }).save;
    // Asked already: the kid falls back to his own idle line.
    expect(text(talkTo("kid", save))).not.toContain("용볼 소문이요");
    expect(text(talkTo("shopkeeper", save))).toContain("용볼");
  });

  it("stacks the milk hand-over before the elder's own mission", () => {
    let save = acceptMission(mainOpen(), "s-shop-milk");
    const conversation = talkTo("elder", save);
    expect(conversation.node.lines[0].text).toContain("잔디 우유");
    // …and the elder still offers the watering job after it.
    expect(text(conversation)).toContain("광장 잔디 물 주기");
    expect(conversation.node.choices?.[0].effect).toEqual({ type: "accept", mission: "s-elder-water" });
    save = applyMissionEvent(save, { type: "talk", cast: "elder" }).save;
    expect(text(talkTo("elder", save))).not.toContain("잔디 우유 배달이구나");
  });
});

describe("everyone else", () => {
  it("has idle chatter", () => {
    const save = mainOpen();
    expect(talkTo("cat-jandi", save).node.lines.length).toBeGreaterThan(0);
    expect(talkTo("cat-jandi", save).endEffects).toEqual([]);
  });
});
