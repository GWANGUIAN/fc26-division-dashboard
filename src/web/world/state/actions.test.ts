import { describe, expect, it } from "vitest";
import { parseAction } from "./actions";

describe("parseAction", () => {
  it("reads the four minigames, the card cabinet and mailboxes", () => {
    expect(parseAction("minigame:soccer-sum10")).toEqual({ type: "minigame", game: "soccer-sum10" });
    expect(parseAction("minigame:kickups")).toEqual({ type: "minigame", game: "kickups" });
    expect(parseAction("minigame:freekick")).toEqual({ type: "minigame", game: "freekick" });
    expect(parseAction("minigame:cardmatch")).toEqual({ type: "minigame", game: "cardmatch" });
    expect(parseAction("cards")).toEqual({ type: "cards" });
    expect(parseAction("mailbox:mb-west")).toEqual({ type: "mailbox", id: "mb-west" });
  });

  it("returns null for nothing, unknown games (the grass rush machine comes with S5) and junk", () => {
    expect(parseAction(undefined)).toBeNull();
    expect(parseAction("")).toBeNull();
    expect(parseAction("minigame:rush")).toBeNull();
    expect(parseAction("mailbox:")).toBeNull();
    expect(parseAction("bogus")).toBeNull();
  });
});
