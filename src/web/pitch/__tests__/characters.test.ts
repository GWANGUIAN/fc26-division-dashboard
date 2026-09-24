import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_CHARACTER_ID,
  PITCH_CHARACTERS,
  POSITION_LABELS,
  characterIndex,
  getCharacter,
  isKnownCharacterId,
  resolveStoredCharacter,
} from "../data/characters";
import { PITCH_CHARACTER_IDS } from "../data/characterIds";

describe("character registry (P5)", () => {
  it("holds the 12 field characters with unique ids, woowakgood first, in the asset id order", () => {
    expect(PITCH_CHARACTERS).toHaveLength(12);
    expect(new Set(PITCH_CHARACTERS.map((c) => c.id)).size).toBe(12);
    expect(PITCH_CHARACTERS[0]!.id).toBe("woowakgood");
    expect(PITCH_CHARACTERS.map((c) => c.id)).toEqual([...PITCH_CHARACTER_IDS]);
  });

  it("keeps the select-screen order of docs/pitch/03 §3", () => {
    expect(PITCH_CHARACTERS.map((c) => c.name)).toEqual(["우왁굳", "재닌", "뽀린걸", "핑구", "문모모", "하치", "한결", "쥬멩이", "해파린", "빙밍", "다시바", "리냐"]);
  });

  it("gives every character a valid position, a label and a theme colour", () => {
    for (const c of PITCH_CHARACTERS) {
      expect(Object.keys(POSITION_LABELS)).toContain(c.position);
      expect(c.positionLabel).toBe(POSITION_LABELS[c.position]);
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.themeColor).toMatch(/^#[0-9a-f]{6}$/i);
    }
    expect(getCharacter("woowakgood").position).toBe("MGR");
    expect(getCharacter("janine95kim").position).toBe("GK");
  });

  it("looks ids up, with the first character as the fallback", () => {
    expect(isKnownCharacterId("lina0108")).toBe(true);
    expect(isKnownCharacterId("nobody")).toBe(false);
    expect(getCharacter("nobody").id).toBe(DEFAULT_CHARACTER_ID);
    expect(characterIndex("lina0108")).toBe(11);
    expect(characterIndex("nobody")).toBe(0);
  });
});

describe("stored character correction (P5)", () => {
  it("keeps a known saved id and writes nothing", () => {
    const save = vi.fn();
    expect(resolveStoredCharacter({ load: () => "hachi97", save }).id).toBe("hachi97");
    expect(save).not.toHaveBeenCalled();
  });

  it("overwrites a well-formed but unknown id with the default", () => {
    const save = vi.fn();
    expect(resolveStoredCharacter({ load: () => "removed_player", save }).id).toBe("woowakgood");
    expect(save).toHaveBeenCalledWith("woowakgood");
  });

  it("a first visit (default from storage) needs no write", () => {
    const save = vi.fn();
    expect(resolveStoredCharacter({ load: () => "woowakgood", save }).id).toBe("woowakgood");
    expect(save).not.toHaveBeenCalled();
  });
});
