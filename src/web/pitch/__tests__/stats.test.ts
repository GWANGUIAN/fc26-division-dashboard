import { describe, expect, it } from "vitest";
import { PITCH_CHARACTERS } from "../data/characters";
import {
  COMMON_AXES,
  COMMON_PASSING,
  COMMON_POSITIONING,
  COMMON_PRESS_ESCAPE,
  GOAL_FINISHING,
  POSITION_KEYS,
  STAT_AXIS_COUNT,
  STAT_PLACEHOLDER,
  STAT_SHEETS,
  axisDescription,
  axisLabel,
  axisTag,
  isPlaceholderAxis,
  isPlaceholderSheet,
  statSheetFor,
  type PositionKey,
} from "../data/stats";

const FIELD: readonly PositionKey[] = ["ST", "WF", "CB", "FB", "CM", "CDM"];
const labels = (position: PositionKey) => STAT_SHEETS[position].axes.map((axis) => axis.label);

describe("stat sheets", () => {
  it("has a sheet for each of the 8 positions with six axes and null values", () => {
    expect(POSITION_KEYS).toHaveLength(8);
    expect(Object.keys(STAT_SHEETS).sort()).toEqual([...POSITION_KEYS].sort());
    for (const key of POSITION_KEYS) {
      const sheet = STAT_SHEETS[key];
      expect(sheet.position).toBe(key);
      expect(sheet.axes).toHaveLength(STAT_AXIS_COUNT);
      expect(sheet.values).toHaveLength(STAT_AXIS_COUNT);
      expect(sheet.values.every((value) => value === null)).toBe(true);
      expect(isPlaceholderSheet(sheet)).toBe(true);
    }
  });

  it("defines all 42 field/GK axes (no placeholder) with short labels and descriptions", () => {
    let count = 0;
    for (const key of POSITION_KEYS.filter((k) => k !== "MGR")) {
      STAT_SHEETS[key].axes.forEach((axis, index) => {
        count++;
        expect(isPlaceholderAxis(axis)).toBe(false);
        expect(axis.label).not.toBe(STAT_PLACEHOLDER);
        expect([...axis.label].length).toBeLessThanOrEqual(6);
        expect(axis.description.trim()).not.toBe("");
        expect(axisLabel(STAT_SHEETS[key], index)).toBe(axis.label);
        expect(axisDescription(STAT_SHEETS[key], index)).toBe(axis.description);
        if (axis.plus !== undefined) expect(axis.plus.trim()).not.toBe("");
        if (axis.minus !== undefined) expect(axis.minus.trim()).not.toBe("");
      });
    }
    expect(count).toBe(42);
  });

  it("keeps the manager's six axes as placeholders", () => {
    for (const [index, axis] of STAT_SHEETS.MGR.axes.entries()) {
      expect(isPlaceholderAxis(axis)).toBe(true);
      expect(axis.description).toBe(STAT_PLACEHOLDER);
      expect(axisLabel(STAT_SHEETS.MGR, index)).toBe(STAT_PLACEHOLDER);
    }
  });

  it("gives every axis of a sheet a unique id", () => {
    for (const key of POSITION_KEYS) {
      const ids = STAT_SHEETS[key].axes.map((axis) => axis.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("builds field positions as the shared common three + three unique axes", () => {
    for (const key of FIELD) {
      const axes = STAT_SHEETS[key].axes;
      expect(axes.slice(0, 3)).toEqual([COMMON_POSITIONING, COMMON_PRESS_ESCAPE, COMMON_PASSING]);
      axes.slice(0, 3).forEach((axis, i) => expect(axis).toBe(COMMON_AXES[i]));
      expect(axes.slice(3).every((axis) => axis.kind === "unique")).toBe(true);
      expect(axes[0].label).toBe("위치선정");
    }
    expect(labels("ST").slice(3)).toEqual(["골 결정력", "홀딩 판단", "창조"]);
    expect(labels("WF").slice(3)).toEqual(["골 결정력", "돌파", "창조"]);
    expect(labels("CM").slice(3)).toEqual(["골 결정력", "창조", "수비"]);
    expect(labels("CDM").slice(3)).toEqual(["조율", "창조", "수비"]);
    expect(labels("CB").slice(3)).toEqual(["클리어", "창조", "수비"]);
    expect(labels("FB").slice(3)).toEqual(["클리어", "창조", "수비"]);
  });

  it("shares the wording objects that are identical across positions", () => {
    for (const key of ["ST", "WF", "CM"] as const) expect(STAT_SHEETS[key].axes[3]).toBe(GOAL_FINISHING);
    for (const key of ["CB", "FB", "CDM"] as const) expect(STAT_SHEETS[key].axes[4]).toBe(STAT_SHEETS.CB.axes[4]);
    expect(STAT_SHEETS.CB.axes[5]).toBe(STAT_SHEETS.FB.axes[5]);
    expect(STAT_SHEETS.CB.axes[3]).toBe(STAT_SHEETS.FB.axes[3]);
  });

  it("gives GK six unique axes and no common ones, starting at 위치 선정", () => {
    const axes = STAT_SHEETS.GK.axes;
    expect(axes.every((axis) => axis.kind === "unique")).toBe(true);
    expect(axes.some((axis) => COMMON_AXES.includes(axis))).toBe(false);
    expect(labels("GK")).toEqual(["위치 선정", "기본 골키핑", "상급 골키핑", "볼 배급", "패스", "승부차기"]);
    expect(axes.every((axis) => axisTag(axis) === "GK 고유")).toBe(true);
    // the GK 패스 is not the common 패스
    expect(axes[4].id).not.toBe(COMMON_PASSING.id);
  });

  it("gives the common axes their detail items and criteria", () => {
    expect(COMMON_POSITIONING.subs).toHaveLength(3);
    expect(COMMON_PRESS_ESCAPE.subs).toHaveLength(2);
    expect(COMMON_PASSING.subs).toHaveLength(2);
    expect(COMMON_POSITIONING.plus).toBeTruthy();
    expect(COMMON_POSITIONING.minus).toBeTruthy();
    expect(COMMON_PASSING.plus).toBeTruthy();
    expect(COMMON_PASSING.minus).toBeTruthy();
    expect(COMMON_PRESS_ESCAPE.subs?.every((sub) => sub.plus && sub.minus && sub.children?.length === 3)).toBe(true);
    expect(axisTag(COMMON_POSITIONING)).toBe("공통");
    expect(axisTag(GOAL_FINISHING)).toBe("고유");
  });

  it("resolves a sheet for every playable character's position", () => {
    for (const character of PITCH_CHARACTERS) expect(statSheetFor(character.position).position).toBe(character.position);
  });

  it("shows the placeholder for an empty label", () => {
    const sheet = { ...STAT_SHEETS.ST, axes: STAT_SHEETS.ST.axes.map((axis) => ({ ...axis, label: "" })) as unknown as typeof STAT_SHEETS.ST.axes };
    expect(axisLabel(sheet, 0)).toBe(STAT_PLACEHOLDER);
  });
});
