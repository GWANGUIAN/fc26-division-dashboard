import { describe, expect, it } from "vitest";
import {
  GROUP_PHOTO_BALL,
  GROUP_PHOTO_GOAL_ID,
  GROUP_PHOTO_GOAL_TARGET,
  GROUP_PHOTO_PROPS,
  getBallKickOffset,
  propTopCss,
} from "./groupPhotoProps.js";

// docs/group-photo-props.md의 "안전 영역": 21:9 창에서 배경 상하가 잘려도
// 소품이 보이려면 접지점이 배경 상단 기준 6.7vw ~ 49.5vw 안이어야 한다.
const SAFE_MIN_VW = 6.7;
const SAFE_MAX_VW = 49.5;

const ALL_SLOTS = [...GROUP_PHOTO_PROPS, GROUP_PHOTO_BALL];

describe("group photo props data", () => {
  it("has unique ids that are valid prop file names", () => {
    const ids = ALL_SLOTS.map((slot) => slot.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });

  it("keeps every prop inside the horizontal frame and the safe vertical zone", () => {
    for (const slot of ALL_SLOTS) {
      expect(slot.widthVw).toBeGreaterThan(0);
      expect(slot.left - slot.widthVw / 2).toBeGreaterThanOrEqual(0);
      expect(slot.left + slot.widthVw / 2).toBeLessThanOrEqual(100);
      expect(slot.bottomVw).toBeGreaterThanOrEqual(SAFE_MIN_VW);
      expect(slot.bottomVw).toBeLessThanOrEqual(SAFE_MAX_VW);
    }
  });

  it("does not place props over the LED signboard column", () => {
    // 전광판은 가로 33~66%, 배경 상단 기준 약 5.3~11vw. 소품은 전부 접지점이
    // 훨씬 아래라 세로로 겹칠 수 없지만, 가로 중앙에 몰리는 배치는 막는다.
    for (const slot of GROUP_PHOTO_PROPS) {
      const overlapsLedColumn = slot.left + slot.widthVw / 2 > 33 && slot.left - slot.widthVw / 2 < 66;
      expect(overlapsLedColumn).toBe(false);
    }
  });

  it("only uses the known layers", () => {
    for (const slot of ALL_SLOTS) expect(["behind", "front"]).toContain(slot.layer);
  });

  it("aims the kick at the goal prop, to its left and up from the ball", () => {
    const goal = GROUP_PHOTO_PROPS.find((slot) => slot.id === GROUP_PHOTO_GOAL_ID);
    expect(goal).toBeDefined();
    if (!goal) return;
    // 골 목표점이 골대 가로 범위 안, 접지점보다 위에 있어야 골문 안쪽이다.
    expect(Math.abs(GROUP_PHOTO_GOAL_TARGET.left - goal.left)).toBeLessThan(goal.widthVw / 2);
    expect(GROUP_PHOTO_GOAL_TARGET.centerVw).toBeLessThan(goal.bottomVw);

    const { dxVw, dyVw } = getBallKickOffset();
    expect(dxVw).toBeCloseTo(GROUP_PHOTO_GOAL_TARGET.left - GROUP_PHOTO_BALL.left);
    expect(dxVw).toBeLessThan(0);
    expect(dyVw).toBeLessThan(0);
  });

  it("anchors vertical positions to the top edge of the centered background", () => {
    expect(propTopCss(42.5)).toBe("calc(50vh - 28.125vw + 42.5vw)");
  });
});
