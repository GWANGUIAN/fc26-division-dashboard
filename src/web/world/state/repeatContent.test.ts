import { describe, expect, it } from "vitest";
import { createNewGameSave, parseWorldSave } from "../storage";
import { repeatEvent } from "./repeatContent";
import { arcadeRank, rankGoal, rankTier, recordRound } from "./ranks";
import { acceptMission, applyMissionEvent, completeMission } from "./missions";
import { GOLDEN_BALLS } from "../data/goldenBalls";
import { PLAYABLE_CAST } from "../data/worldCast";
describe("repeat progression", () => {
  it("maps a best score to its rank tier and each tier to the score it asks for", () => {
    expect([undefined, 299, 300, 1000, 3000].map((score) => rankTier("rush", score))).toEqual([0, 1, 2, 4, 7]);
    expect([0, 1, 2, 4, 7].map((tier) => rankGoal("rush", tier))).toEqual([null, null, 300, 1000, 3000]);
    expect(rankGoal("cardmatch", 2)).toBe(30); expect(rankGoal("cardmatch", 7)).toBe(12);
  });
  it("uses all rank boundaries, inverse card scores, and distance rather than seed bonuses", () => {
    expect(arcadeRank("rush")).toBe("입구컷"); expect(arcadeRank("rush", 299)).toBe("합격 불투명");
    const names = ["합격 조건 충족", "상현급", "에이스급", "반장급", "운영급", "회장"];
    [300,600,1000,1500,2200,3000].forEach((score, i) => expect(arcadeRank("rush", score)).toBe(names[i]));
    expect(arcadeRank("cardmatch", 12)).toBe("회장"); expect(arcadeRank("cardmatch", 31)).toBe("합격 불투명");
    let save = recordRound(createNewGameSave("janine95kim"), { game: "rush", score: 1200, distance: 900 });
    expect(save.bests.rush).toBe(900); expect(save.flags["badge:rush-1000"]).toBeUndefined();
    save = recordRound(save, { game: "rush", score: 500, distance: 400 }); expect(save.bests.rush).toBe(900);
    save = recordRound(save, { game: "cardmatch", score: 20, cleared: true });
    save = recordRound(save, { game: "cardmatch", score: 12, cleared: false }); expect(save.bests.cardmatch).toBe(20);
    expect(recordRound(save, { game: "rush", score: NaN })).toBe(save);
    const loaded = parseWorldSave(JSON.parse(JSON.stringify(save))); expect(loaded.status).toBe("ok");
    if (loaded.status !== "invalid") expect(loaded.save.bests).toEqual(save.bests);
  });
  it("collects all balls once and counts any five collected before accepting", () => {
    let save = createNewGameSave("janine95kim"); save.flags["ending-seen"] = true;
    for (const ball of GOLDEN_BALLS.slice(10)) save = repeatEvent(save, { type: "pickup", id: ball.id }, 0);
    expect(save.flags["badge:ball-collector"]).toBe(true);
    save = acceptMission(save, "s-kid-hide"); expect(save.missions["s-kid-hide"].status).toBe("ready");
    for (const ball of GOLDEN_BALLS) save = repeatEvent(save, { type: "pickup", id: ball.id }, 0);
    expect(save.collected).toHaveLength(20); expect(save.flags["badge:ball-master"]).toBe(true);
  });
  it("counts only actual member card views and accepts prior world views", () => {
    let save = createNewGameSave("janine95kim"); save.flags["ending-seen"] = true;
    save = repeatEvent(save, { type: "card-view", cardId: "woowakgood", variant: "base" }, 0);
    expect(save.flags["card:woowakgood"]).toBeUndefined();
    for (const c of PLAYABLE_CAST) save = repeatEvent(save, { type: "card-view", cardId: c.id, variant: "base" }, 0);
    save = acceptMission(save, "m-91-cards"); expect(save.missions["m-91-cards"].status).toBe("ready");
    const completed = completeMission(save, "m-91-cards"); expect(completed.save.flags["badge:card-collector"]).toBe(true);
    expect(completeMission(completed.save, "m-91-cards").reward).toBeNull();
  });
  it("finishes factory advice and daily coach followups without granting shards", () => {
    let save = createNewGameSave("janine95kim"); save.flags["ending-seen"] = true;
    save = acceptMission(save, "s-factory-garden");
    for (const cast of ["elder", "weedking"] as const) save = applyMissionEvent(save, { type: "talk", cast }).save;
    save = completeMission(save, "s-factory-garden").save; expect(save.flags["factory-garden"]).toBe(true);
    save = acceptMission(save, "s-rush-daily"); save = applyMissionEvent(save, { type: "daily-claimed" }).save;
    expect(save.missions["s-rush-daily"].status).toBe("ready"); expect(save.shards).toBe(0);
  });
});
