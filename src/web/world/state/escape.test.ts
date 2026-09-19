import { describe, expect, it } from "vitest";
import { resolveEscape } from "./escape";

describe("resolveEscape", () => {
  it("closes only the dialogue when one is open, even with the coach marks up", () => {
    expect(resolveEscape({ phase: "play", dialogueOpen: true, coachActive: true })).toBe("close-dialogue");
  });

  it("skips the coach marks next, without leaving the world", () => {
    expect(resolveEscape({ phase: "play", dialogueOpen: false, coachActive: true })).toBe("skip-coach");
  });

  it("leaves the world only when nothing is open", () => {
    expect(resolveEscape({ phase: "play", dialogueOpen: false, coachActive: false })).toBe("close-world");
  });

  it("sends the character select back to the title and skips the prologue", () => {
    expect(resolveEscape({ phase: "select", dialogueOpen: false, coachActive: false })).toBe("back-to-title");
    expect(resolveEscape({ phase: "prologue", dialogueOpen: false, coachActive: false })).toBe("skip-prologue");
  });

  it("closes the world from the title and the loading screens", () => {
    for (const phase of ["boot", "title", "core"] as const) expect(resolveEscape({ phase, dialogueOpen: false, coachActive: false })).toBe("close-world");
  });
});
