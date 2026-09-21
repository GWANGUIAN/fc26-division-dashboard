import { describe, expect, it } from "vitest";
import { resolveEscape, type EscapeContext } from "./escape";

const play = (over: Partial<EscapeContext> = {}): EscapeContext => ({ phase: "play", dialogueOpen: false, coachActive: false, ...over });

describe("resolveEscape while playing", () => {
  it("closes a minigame or card modal before anything else", () => {
    expect(resolveEscape(play({ modalOpen: true, pauseView: "main", logOpen: true, dialogueOpen: true, coachActive: true }))).toBe("close-modal");
  });

  it("steps back out of the pause menu, sub-page first", () => {
    expect(resolveEscape(play({ pauseView: "settings", logOpen: true }))).toBe("pause-back");
    expect(resolveEscape(play({ pauseView: "confirm-new" }))).toBe("pause-back");
    expect(resolveEscape(play({ pauseView: "main", logOpen: true }))).toBe("close-pause");
  });

  it("then closes the mission log, then the dialogue", () => {
    expect(resolveEscape(play({ logOpen: true, dialogueOpen: true }))).toBe("close-log");
    expect(resolveEscape(play({ dialogueOpen: true, coachActive: true }))).toBe("close-dialogue");
  });

  it("skips the coach marks next, without opening the menu", () => {
    expect(resolveEscape(play({ coachActive: true }))).toBe("skip-coach");
  });

  it("opens the pause menu when nothing else is open (it never leaves the world by itself)", () => {
    expect(resolveEscape(play())).toBe("open-pause");
  });

  it("takes the ending one card at a time: the photo, then the credits, then the stinger; the bloom banner ignores it", () => {
    expect(resolveEscape(play({ ending: "photo", photoOpen: true }))).toBe("close-photo");
    expect(resolveEscape(play({ ending: "credits", pauseView: "main", modalOpen: true }))).toBe("skip-credits");
    expect(resolveEscape(play({ ending: "stinger", pauseView: "main", modalOpen: true }))).toBe("skip-stinger");
    expect(resolveEscape(play({ ending: "bloom" }))).toBe("ignore");
  });
});

describe("resolveEscape outside the world", () => {
  it("sends the character select back to the title and skips the prologue", () => {
    expect(resolveEscape({ phase: "select", dialogueOpen: false, coachActive: false })).toBe("back-to-title");
    expect(resolveEscape({ phase: "prologue", dialogueOpen: false, coachActive: false })).toBe("skip-prologue");
  });

  it("closes the world from the title and the loading screens", () => {
    for (const phase of ["boot", "title", "core"] as const) expect(resolveEscape({ phase, dialogueOpen: false, coachActive: false })).toBe("close-world");
  });

  it("steps back from the title's settings page before closing the world", () => {
    expect(resolveEscape({ phase: "title", dialogueOpen: false, coachActive: false, titleSettingsOpen: true })).toBe("close-title-settings");
  });
});
