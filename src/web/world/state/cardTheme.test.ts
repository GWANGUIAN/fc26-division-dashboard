import { describe, expect, it } from "vitest";
import { createNewGameSave } from "../storage";
import { acceptMission, applyMissionEvent, completeMission, completeTalk } from "./missions";
import { initialWorldCardVariant } from "./cardTheme";

describe("initialWorldCardVariant", () => {
  it("pins only the unfinished first world-card mission to normal", () => {
    let save = acceptMission(completeTalk(createNewGameSave("janine95kim"), "m-00-hello").save, "m-01-mycard");
    expect(initialWorldCardVariant(save)).toBe("normal");
    save = applyMissionEvent(save, { type: "card-view", cardId: "janine95kim", variant: "normal" }).save;
    expect(initialWorldCardVariant(save)).toBe("normal");
    save = completeMission(save, "m-01-mycard").save;
    expect(initialWorldCardVariant(save)).toBeUndefined();
  });
});
