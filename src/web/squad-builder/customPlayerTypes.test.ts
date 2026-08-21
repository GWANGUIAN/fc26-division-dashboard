import { describe, expect, it } from "vitest";
import {
  customPlayerToSquadPlayer,
  effectiveWinRatePercent,
  type CustomPlayer,
} from "./customPlayerTypes.js";

function player(overrides: Partial<CustomPlayer> = {}): CustomPlayer {
  return { id: "p1", name: "테스트 선수", ...overrides };
}

describe("customPlayerToSquadPlayer", () => {
  it("maps an unset division to the 0 sentinel", () => {
    const result = customPlayerToSquadPlayer(player());
    expect(result.currentDivision).toBe(0);
  });

  it("carries a chosen division through unchanged", () => {
    const result = customPlayerToSquadPlayer(player({ division: 3 }));
    expect(result.currentDivision).toBe(3);
  });

  it("stamps isMapped and isCustomPlayer", () => {
    const result = customPlayerToSquadPlayer(player());
    expect(result.isMapped).toBe(true);
    expect(result.isCustomPlayer).toBe(true);
  });

  it("keeps record and drops customWinRatePercent when a record is present", () => {
    const record = { wins: 4, draws: 1, losses: 2 };
    const result = customPlayerToSquadPlayer(
      player({ record, winRatePercent: 90 }),
    );
    expect(result.record).toEqual(record);
    expect(result.customWinRatePercent).toBeUndefined();
  });

  it("carries winRatePercent through as customWinRatePercent when no record is present", () => {
    const result = customPlayerToSquadPlayer(player({ winRatePercent: 55.5 }));
    expect(result.record).toBeUndefined();
    expect(result.customWinRatePercent).toBe(55.5);
  });

  it("resolves the photo URL onto profileImageUrl", () => {
    const result = customPlayerToSquadPlayer(player(), "blob:abc");
    expect(result.profileImageUrl).toBe("blob:abc");
  });

  it("falls back to staticPhotoUrl when no uploaded photo exists", () => {
    const result = customPlayerToSquadPlayer(
      player({ staticPhotoUrl: "/profiles/profile_hangyeul.webp" }),
    );
    expect(result.profileImageUrl).toBe("/profiles/profile_hangyeul.webp");
  });

  it("prefers an uploaded photo over staticPhotoUrl", () => {
    const result = customPlayerToSquadPlayer(
      player({ staticPhotoUrl: "/profiles/profile_hangyeul.webp" }),
      "blob:uploaded",
    );
    expect(result.profileImageUrl).toBe("blob:uploaded");
  });
});

describe("effectiveWinRatePercent", () => {
  it("derives from record when present", () => {
    const streamer = customPlayerToSquadPlayer(
      player({ record: { wins: 1, draws: 0, losses: 1 } }),
    );
    expect(effectiveWinRatePercent(streamer)).toBe(50);
  });

  it("falls back to customWinRatePercent when record is absent", () => {
    const streamer = customPlayerToSquadPlayer(player({ winRatePercent: 72 }));
    expect(effectiveWinRatePercent(streamer)).toBe(72);
  });

  it("is undefined when neither is present", () => {
    const streamer = customPlayerToSquadPlayer(player());
    expect(effectiveWinRatePercent(streamer)).toBeUndefined();
  });
});
