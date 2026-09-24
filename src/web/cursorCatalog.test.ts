import { describe, expect, it } from "vitest";
import {
  CURSOR_PLAYERS,
  DEFAULT_CURSOR_PLAYER_ID,
  cursorAssetUrls,
  cursorRoleFromCss,
  isCursorPlayerId,
} from "./cursorCatalog";

describe("player cursor catalogue", () => {
  it("includes all eleven players plus the default coach", () => {
    expect(CURSOR_PLAYERS).toHaveLength(12);
    expect(DEFAULT_CURSOR_PLAYER_ID).toBe("woowakgood");
    expect(new Set(CURSOR_PLAYERS.map((player) => player.id)).size).toBe(12);
    expect(CURSOR_PLAYERS.every((player) => /^#[0-9a-f]{6}$/i.test(player.accent))).toBe(true);
  });

  it("accepts only known player ids", () => {
    expect(isCursorPlayerId("janine95kim")).toBe(true);
    expect(isCursorPlayerId("not-a-player")).toBe(false);
  });

  it("resolves the converted art for every player", () => {
    for (const player of CURSOR_PLAYERS) {
      const assets = cursorAssetUrls(player.id);
      expect(assets.glyph.default).toBeTruthy();
      expect(assets.preview).toBeTruthy();
      expect(assets.motion).toBeTruthy();
      expect(assets.windowsPack).toBeTruthy();
    }
  });
});

describe("CSS cursor role mapping", () => {
  it("preserves the major browser cursor semantics", () => {
    expect(cursorRoleFromCss("pointer")).toBe("pointer");
    expect(cursorRoleFromCss("text")).toBe("text");
    expect(cursorRoleFromCss("crosshair")).toBe("crosshair");
    expect(cursorRoleFromCss("grabbing")).toBe("grabbing");
    expect(cursorRoleFromCss("ew-resize")).toBe("resize-ew");
    expect(cursorRoleFromCss("ns-resize")).toBe("resize-ns");
    expect(cursorRoleFromCss("nwse-resize")).toBe("resize-diagonal");
    expect(cursorRoleFromCss("not-allowed")).toBe("not-allowed");
    expect(cursorRoleFromCss("wait")).toBe("wait");
    expect(cursorRoleFromCss("auto")).toBe("default");
  });
});
