import { describe, expect, it, vi } from "vitest";
import { KICKUPS_NAME_POOL, KICKUPS_QUIPS, KICKUPS_TOP_TIER_MIN_SCORE, pickQuip } from "./quips";

describe("KICKUPS_QUIPS tiers", () => {
  it("covers every score from 0 to 60 with exactly one tier, no gaps or overlaps", () => {
    for (let score = 0; score <= 60; score++) {
      const matches = KICKUPS_QUIPS.filter((tier) => score >= tier.minScore && score <= tier.maxScore);
      expect(matches).toHaveLength(1);
    }
  });

  it("only tiers at or above 26 points use the {name} placeholder", () => {
    const nonTopTiers = KICKUPS_QUIPS.filter((tier) => tier.minScore < KICKUPS_TOP_TIER_MIN_SCORE);
    const topTier = KICKUPS_QUIPS.find((tier) => tier.minScore === KICKUPS_TOP_TIER_MIN_SCORE);
    expect(topTier?.lines.some((line) => line.includes("{name}"))).toBe(true);
    expect(
      KICKUPS_QUIPS.filter((tier) => tier.minScore < 26).some((tier) =>
        tier.lines.some((line) => line.includes("{name}")),
      ),
    ).toBe(false);
    expect(nonTopTiers.some((tier) => tier.lines.some((line) => line.includes("잔디동 회장")))).toBe(false);
  });

  it("no longer includes the retired low-score roast lines", () => {
    const removedLines = [
      "시작하자마자 헛발질... 문모모가 보면 울겠다",
      "볼 터치가 아니라 볼 실종신고감",
      "이 정도면 문모모 팬미팅 가서 사인이나 받자",
      "발재간이 스탯 창에 없는 이유가 있었다",
      "그럭저럭... 문모모는 이 정도 눈감고도 함",
      "이쯤되면 프로 테스트 넣어야지",
      "리프팅 장인 등극",
      "슬슬 각 잡히는데?",
      "나쁘지 않아, 근데 딱 그정도",
    ];
    const allLines = KICKUPS_QUIPS.flatMap((tier) => tier.lines);
    for (const removed of removedLines) {
      expect(allLines).not.toContain(removed);
    }
  });

  it("randomizes the {name} placeholder between 문모모 and 라리양 for score-26+ quips", () => {
    const outputs = Array.from({ length: 300 }, () => pickQuip(45, false));
    expect(outputs.every((line) => !line.includes("{name}"))).toBe(true);
    for (const name of KICKUPS_NAME_POOL) {
      expect(outputs.some((line) => line.includes(name))).toBe(true);
    }
  });
});

describe("pickQuip", () => {
  it("picks a line from the tier matching the score", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(KICKUPS_QUIPS[0].lines).toContain(pickQuip(0, false));
    expect(KICKUPS_QUIPS.at(-1)!.lines).toContain(pickQuip(45, false));
    vi.restoreAllMocks();
  });

  it("appends a new-record marker only when isNewRecord is true", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(pickQuip(5, false)).not.toMatch(/신기록/);
    expect(pickQuip(5, true)).toMatch(/신기록/);
    vi.restoreAllMocks();
  });
});
