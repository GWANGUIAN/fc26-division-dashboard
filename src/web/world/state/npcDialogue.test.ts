import { describe, expect, it } from "vitest";
import { CAST_SCRIPTS, FINALE_SCRIPT, MISSION_SCRIPTS } from "../data/dialogueData";
import { getCast } from "../data/worldCast";
import { createNewGameSave } from "../storage";
import type { CastId, SceneId, WorldSave } from "../types";
import { acceptMission, applyMissionEvent, completeMission, completeTalk } from "./missions";
import { buildCheerDialogue, buildConversation, buildEndingDialogue, buildExamineDialogue, roundCall, type Conversation } from "./npcDialogue";
import { ENDING_FLAGS, beatFlag } from "./story";
import { getMissionDef } from "../data/missionDefs";

const talkTo = (cast: CastId, save: WorldSave, over: { talked?: number; deliveryRunning?: boolean; scene?: SceneId } = {}): Conversation =>
  buildConversation({ cast: getCast(cast), save, talked: over.talked ?? 1, deliveryRunning: over.deliveryRunning ?? false, scene: over.scene });

const text = (conversation: Conversation) => conversation.node.lines.map((entry) => entry.text).join("\n");

function mainOpen(player: CastId = "janine95kim"): WorldSave {
  let save = completeTalk(createNewGameSave(player), "m-00-hello").save;
  save = acceptMission(save, "m-01-mycard");
  save = applyMissionEvent(save, { type: "card-view", cardId: player, variant: "normal" }).save;
  return completeMission(save, "m-01-mycard").save;
}

/** All ten main missions done for a player (ten shards), without going through their dialogue. */
function allShards(player: CastId = "janine95kim"): WorldSave {
  let save = mainOpen(player);
  save = { ...save, shards: 10 };
  return save;
}

const withFlags = (save: WorldSave, ...flags: string[]): WorldSave => ({ ...save, flags: { ...save.flags, ...Object.fromEntries(flags.map((flag) => [flag, true as const])) } });

describe("the tutorial greeting", () => {
  it("is the elder's first conversation and finishes m-00 when it ends", () => {
    const first = talkTo("elder", createNewGameSave("janine95kim"), { talked: 0 });
    expect(first.endEffects).toEqual([{ type: "finish-talk", mission: "m-00-hello" }]);
    expect(text(first)).toContain("클럽하우스");
    expect(first.node.lines[0].text).toContain("새 얼굴");
    expect(first.node.choices?.map((choice) => choice.label)).toEqual(["마을 안내를 듣는다", "괜찮아요"]);
  });

  it("explains the markers and the town in the branches", () => {
    const first = talkTo("elder", createNewGameSave("janine95kim"), { talked: 0 });
    expect(text(first)).toContain("파란 물음표");
    expect(first.node.choices?.[0].next?.lines.map((line) => line.text).join(" ")).toContain("스타디움");
  });

  it("falls back to idle chatter once it is done", () => {
    const done = completeTalk(createNewGameSave("janine95kim"), "m-00-hello").save;
    const again = talkTo("elder", done);
    expect(again.endEffects).toEqual([]);
    expect(again.node.lines).toHaveLength(1);
  });
});

describe("a mission giver", () => {
  it("offers a new mission with the reviewed wording and an accept choice", () => {
    const offer = talkTo("doormomo", mainOpen());
    expect(text(offer)).toBe(MISSION_SCRIPTS["m-doormomo-sum10"].offer![0]);
    expect(text(offer)).not.toContain("임시 대사");
    expect(offer.node.choices?.map((choice) => choice.label)).toEqual(["받는다", "나중에"]);
    expect(offer.node.choices?.[0].effect).toEqual({ type: "accept", mission: "m-doormomo-sum10" });
    expect(offer.node.choices?.[0].next?.lines[0].text).toBe(MISSION_SCRIPTS["m-doormomo-sum10"].accept);
    expect(offer.node.choices?.[1].next).toBeNull();
  });

  it("greets on the very first meeting, before the offer", () => {
    const offer = talkTo("doormomo", mainOpen(), { talked: 0 });
    expect(offer.node.lines[0].text).toBe(CAST_SCRIPTS.doormomo!.first![0]);
    expect(offer.node.lines[1].text).toBe(MISSION_SCRIPTS["m-doormomo-sum10"].offer![0]);
  });

  it("shows the goal and progress while the mission is active, without choices", () => {
    let save = acceptMission(mainOpen(), "m-haepalin-lanterns");
    save = applyMissionEvent(save, { type: "pickup", id: "jelly-lantern-a" }).save;
    const hint = talkTo("haepalin", save);
    expect(hint.node.lines[0].text).toBe(MISSION_SCRIPTS["m-haepalin-lanterns"].active![0]);
    expect(text(hint)).toContain("1/3");
    expect(hint.node.choices).toBeUndefined();
    expect(hint.endEffects).toEqual([]);
  });

  it("takes the report when the goal is met and completes the mission at the end", () => {
    let save = acceptMission(mainOpen(), "m-sjh4018-kickups");
    save = applyMissionEvent(save, { type: "minigame", result: { game: "kickups", score: 30 } }).save;
    const report = talkTo("sjh4018", save);
    expect(report.endEffects).toEqual([{ type: "complete", mission: "m-sjh4018-kickups" }]);
    expect(report.node.lines[0]).toMatchObject({ text: expect.stringContaining("진짜 해냈네"), mood: "happy" });
    expect(text(report)).toContain("잔디 조각을 건네받았다");
  });

  it("explains the shard story when the director's mission is reported", () => {
    let save = completeTalk(createNewGameSave("janine95kim"), "m-00-hello").save;
    save = acceptMission(save, "m-01-mycard");
    save = applyMissionEvent(save, { type: "card-view", cardId: "janine95kim", variant: "normal" }).save;
    const report = talkTo("woowakgood", save);
    expect(text(report)).toContain("잔디 조각");
    expect(text(report)).toContain("제초동");
    expect(report.endEffects).toEqual([{ type: "complete", mission: "m-01-mycard" }]);
  });

  it("does not talk about a mission that belongs to the player", () => {
    const save = mainOpen("janine95kim");
    expect(text(talkTo("janine95kim", save))).not.toContain("카드 짝 맞추기");
  });

  it("swaps the player's own line for the giver's when the player is someone else", () => {
    expect(text(talkTo("janine95kim", mainOpen("doormomo")))).toContain("카드 짝 맞추기");
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
    expect(retry.node.lines[0].text).toBe(MISSION_SCRIPTS["m-tleod1818-delivery"].retryOffer);
    expect(retry.node.choices?.[0].effect).toEqual({ type: "retry", mission: "m-tleod1818-delivery" });
    expect(retry.node.choices?.[0].next?.lines[0].text).toBe(MISSION_SCRIPTS["m-tleod1818-delivery"].retry);
    const busy = talkTo("tleod1818", save, { deliveryRunning: true });
    expect(busy.node.lines[0].text).toBe(MISSION_SCRIPTS["m-tleod1818-delivery"].active![0]);
    expect(busy.node.choices).toBeUndefined();
  });
});

describe("rumors and deliveries to people", () => {
  it("asks the three people of the talk chain about the rumor once each", () => {
    let save = acceptMission(mainOpen(), "m-hachi97-talkchain");
    expect(text(talkTo("kid", save))).toBe(CAST_SCRIPTS.kid!.rumor);
    save = applyMissionEvent(save, { type: "talk", cast: "kid" }).save;
    // Asked already: the kid falls back to his own idle line.
    expect(text(talkTo("kid", save))).not.toBe(CAST_SCRIPTS.kid!.rumor);
    // The shopkeeper also has an optional side-mission offer.  A rumor is prepended so the talk-chain event
    // still fires, then the ordinary offer follows with its choice.
    expect(talkTo("shopkeeper", save).node.lines[0].text).toBe(CAST_SCRIPTS.shopkeeper!.rumor);
    expect(text(talkTo("elder", save))).toContain(CAST_SCRIPTS.elder!.rumor as string);
  });

  it("stacks the milk hand-over before the elder's own mission", () => {
    let save = acceptMission(mainOpen(), "s-shop-milk");
    const conversation = talkTo("elder", save);
    expect(conversation.node.lines[0].text).toContain("잔디 우유");
    // …and the elder still offers the watering job after it.
    expect(text(conversation)).toContain(MISSION_SCRIPTS["s-elder-water"].offer![0]);
    expect(conversation.node.choices?.[0].effect).toEqual({ type: "accept", mission: "s-elder-water" });
    save = applyMissionEvent(save, { type: "talk", cast: "elder" }).save;
    expect(text(talkTo("elder", save))).not.toContain("잔디 우유구나");
  });
});

describe("filler lines", () => {
  it("rotates through the idle lines by how often the player has spoken", () => {
    let save = mainOpen();
    save = { ...save, missions: { ...save.missions, "m-doormomo-sum10": { status: "completed" } } };
    const pool = CAST_SCRIPTS.doormomo!.idle;
    expect(talkTo("doormomo", save, { talked: 1 }).node.lines[0].text).toBe(pool[0]);
    expect(talkTo("doormomo", save, { talked: 2 }).node.lines[0].text).toBe(pool[1]);
    expect(talkTo("doormomo", save, { talked: 3 }).node.lines[0].text).toBe(pool[0]);
  });

  it("makes a member send the player to the director until the main missions are open", () => {
    const early = completeTalk(createNewGameSave("janine95kim"), "m-00-hello").save;
    for (const cast of ["doormomo", "hachi97", "lina0108"] as const) {
      expect(talkTo(cast, early, { talked: 1 }).node.lines[0].text, cast).toBe(CAST_SCRIPTS[cast]!.pre![0]);
    }
  });

  it("switches to the after-ending lines once the ending is seen", () => {
    let save = withFlags(mainOpen(), ...ENDING_FLAGS);
    save = { ...save, missions: { ...save.missions, "m-doormomo-sum10": { status: "completed" } } };
    expect(talkTo("doormomo", save, { talked: 1 }).node.lines[0].text).toBe(CAST_SCRIPTS.doormomo!.post![0]);
    save.missions["s-kid-hide"] = { status: "completed" };
    save.missions["s-factory-garden"] = { status: "completed" };
    expect(talkTo("kid", save, { talked: 1 }).node.lines[0].text).toBe(CAST_SCRIPTS.kid!.post![0]);
    expect(talkTo("weeder-grunt", save, { talked: 1 }).node.lines[0].text).toBe(CAST_SCRIPTS["weeder-grunt"]!.post![0]);
  });

  it("gives a member behind-the-scenes lines in their own house", () => {
    let save = mainOpen();
    save = { ...save, missions: { ...save.missions, "m-doormomo-sum10": { status: "completed" } } };
    const home = talkTo("doormomo", save, { talked: 1, scene: "interior:house-doormomo" });
    expect(home.node.lines[0].text).toBe(CAST_SCRIPTS.doormomo!.home![0]);
    // Anywhere else they use the idle lines.
    expect(talkTo("doormomo", save, { talked: 1, scene: "overworld" }).node.lines[0].text).toBe(CAST_SCRIPTS.doormomo!.idle[0]);
  });

  it("narrates the animals and never shows a portrait for them", () => {
    const cat = talkTo("cat-jandi", mainOpen(), { talked: 0 });
    expect(cat.node.lines[0].speaker).toBeNull();
    expect(cat.endEffects).toEqual([]);
    expect(talkTo("dog-ball", mainOpen()).node.lines[0].speaker).toBeNull();
  });

  it("never uses a temporary marker anywhere", () => {
    for (const cast of Object.keys(CAST_SCRIPTS) as CastId[]) {
      expect(text(talkTo(cast, mainOpen("hachi97"), { talked: 0 })), cast).not.toContain("임시");
    }
  });
});

describe("the director's story talks", () => {
  it("tells the progress beat once after 3, 6 and 9 shards, marking it heard", () => {
    const save = { ...mainOpen(), shards: 3 };
    const beat = talkTo("woowakgood", save);
    expect(text(beat)).toContain("세 개");
    expect(beat.endEffects).toEqual([{ type: "flags", flags: [beatFlag(3)] }]);
    const heard = withFlags(save, beatFlag(3));
    expect(text(talkTo("woowakgood", heard))).toBe(CAST_SCRIPTS.woowakgood!.idle[0]);
  });

  it("skips the earlier beats when several are due at once", () => {
    const beat = talkTo("woowakgood", { ...mainOpen(), shards: 6 });
    expect(text(beat)).toContain("절반");
    expect(beat.endEffects).toEqual([{ type: "flags", flags: [beatFlag(3), beatFlag(6)] }]);
  });

  it("turns the last shard into a report mission that opens the stadium when it is told", () => {
    const offer = talkTo("woowakgood", allShards());
    expect(text(offer)).toContain("결전");
    expect(text(offer)).toContain("{player}");
    expect(offer.endEffects).toEqual([{ type: "finish-talk", mission: "m-89-director-report" }]);
    // Told: the director falls back to his idle lines.
    const told = withFlags(allShards(), "stadium-open", "beat-3", "beat-6", "beat-9");
    expect(talkTo("woowakgood", told).endEffects).toEqual([]);
  });

  it("uses the after-ending lines for the director once the ending is seen", () => {
    const save = withFlags(allShards(), "stadium-open", ...ENDING_FLAGS);
    save.missions["m-91-cards"] = { status: "completed" };
    expect(talkTo("woowakgood", save, { talked: 1 }).node.lines[0].text).toBe(CAST_SCRIPTS.woowakgood!.post![0]);
  });
});

describe("the showdown", () => {
  const finale = getMissionDef("m-90-finale");
  if (finale?.kind !== "finale") throw new Error("finale mission");
  const open = () => withFlags(allShards(), "stadium-open");

  it("opens with the two cut-1 lines and a choice to start, for the referee and the Weeder King alike", () => {
    for (const cast of ["referee", "weedking"] as const) {
      const cut = talkTo(cast, open());
      expect(cut.node.lines.map((line) => line.speaker), cast).toEqual(["weedking", "referee"]);
      expect(cut.node.choices?.map((choice) => choice.label)).toEqual(["결전을 시작한다", "잠깐만"]);
      expect(cut.node.choices?.[0].effect).toEqual({ type: "accept", mission: "m-90-finale" });
    }
  });

  it("goes from accepting straight to the first round's call, taunt and start button", () => {
    const start = talkTo("referee", open()).node.choices![0].next!;
    expect(start.lines.map((line) => line.text)).toEqual([FINALE_SCRIPT.rounds[0].taunt, roundCall(finale, 0)]);
    expect(start.choices?.[0]).toMatchObject({ label: "1라운드 도전!", effect: { type: "start-round", mission: "m-90-finale" } });
    expect(roundCall(finale, 0)).toBe("1라운드! 축구공 합 10, 80점 이상이면 통과!");
    expect(roundCall(finale, 1)).toBe("2라운드! 축구공 튀기기, 20회 이상이면 통과!");
    expect(roundCall(finale, 2)).toBe("3라운드! 3D 프리킥, 5골 이상이면 통과!");
  });

  it("asks for the round the player is on, and the King answers the last one", () => {
    let save = acceptMission(open(), "m-90-finale");
    expect(text(talkTo("referee", save))).toContain("1라운드!");
    save = applyMissionEvent(save, { type: "finale-round", result: { game: "soccer-sum10", score: 90 } }).save;
    const second = talkTo("referee", save);
    expect(second.node.lines.map((line) => line.text)).toEqual([FINALE_SCRIPT.rounds[0].cleared, FINALE_SCRIPT.rounds[1].taunt, roundCall(finale, 1)]);
    expect(second.node.choices?.[0].label).toBe("2라운드 도전!");
  });

  it("reports the win with the whistle and pays the mission out at the end", () => {
    let save = acceptMission(open(), "m-90-finale");
    for (const game of ["soccer-sum10", "kickups", "freekick"] as const) save = applyMissionEvent(save, { type: "finale-round", result: { game, score: 99 } }).save;
    const win = talkTo("referee", save);
    expect(win.node.lines.map((line) => line.text)).toEqual(FINALE_SCRIPT.victory.map((line) => line.text));
    expect(win.endEffects).toEqual([{ type: "complete", mission: "m-90-finale" }]);
    expect(win.node.choices).toBeUndefined();
  });

  it("wears the marker on the referee only: a blue ? when it can be accepted", () => {
    expect(getCast("referee").role).toBe("original");
    expect(finale.giver).toBe("referee");
  });

  it("has an ending cut that ends with the director calling for the photo", () => {
    const ending = buildEndingDialogue();
    expect(ending.node.lines.at(-1)).toMatchObject({ speaker: "woowakgood", text: "자, 다 같이 사진 한 장 찍자!" });
    expect(ending.endEffects).toEqual([{ type: "ending-photo" }]);
    expect(ending.node.lines[0].speaker).toBe("weedking");
  });
});

describe("read-only and cheering dialogue", () => {
  it("narrates an examine text with no speaker", () => {
    expect(buildExamineDialogue("벤치다.").lines).toEqual([{ speaker: null, text: "벤치다." }]);
  });

  it("lets a member in the stands shout their own line", () => {
    const cheer = buildCheerDialogue("hachi97");
    expect(cheer.lines).toHaveLength(1);
    expect(cheer.lines[0]).toMatchObject({ speaker: "hachi97", text: CAST_SCRIPTS.hachi97!.cheer });
  });
});
