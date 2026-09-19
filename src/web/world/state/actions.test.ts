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

  it("returns null for nothing, unknown games and junk", () => {
    expect(parseAction(undefined)).toBeNull();
    expect(parseAction("")).toBeNull();
    expect(parseAction("minigame:unknown")).toBeNull();
    expect(parseAction("minigame:rush")).toEqual({ type: "minigame", game: "rush" });
    expect(parseAction("daily")).toEqual({ type: "daily" });
    expect(parseAction("collection")).toEqual({ type: "collection" });
    expect(parseAction("rush-factory")).toEqual({ type: "rush-factory" });
    expect(parseAction("mailbox:")).toBeNull();
    expect(parseAction("bogus")).toBeNull();
  });
});
