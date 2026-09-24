import { describe, expect, it } from "vitest";
import { POSITION_KEYS, STAT_SHEETS, type StatAxis } from "../data/stats";
import { DETAIL_CONTENT, clampScroll, layoutStatDetail, wrapText, type Measure } from "../ui/statDetail";

/** One full-width char = `size` px, like Galmuri11's Hangul. */
const fake: Measure = (text, size) => [...text].length * size;
const wrap = (text: string, width: number, size = 12) => wrapText(text, width, (t) => fake(t, size));

describe("wrapText", () => {
  it("keeps every line within the width and loses no characters", () => {
    const text = "의외성, 공격 가담 및 스위칭, 드리블 등으로 상황을 스스로 만드는 능력";
    const lines = wrap(text, 120);
    for (const line of lines) expect(fake(line, 12)).toBeLessThanOrEqual(120);
    expect(lines.join("").replace(/\s/g, "")).toBe(text.replace(/\s/g, ""));
  });

  it("prefers breaking at spaces", () => {
    expect(wrap("가나다 라마바 사아자", 96)).toEqual(["가나다 라마바", "사아자"]);
  });

  it("returns nothing for an empty or blank string", () => {
    expect(wrap("", 100)).toEqual([]);
    expect(wrap("   ", 100)).toEqual([]);
  });

  it("gives a char wider than the width its own line without looping forever", () => {
    expect(wrap("가나다", 5)).toEqual(["가", "나", "다"]);
  });
});

describe("layoutStatDetail", () => {
  const allAxes = () => POSITION_KEYS.filter((key) => key !== "MGR").flatMap((key) => STAT_SHEETS[key].axes.map((axis) => ({ key, axis })));

  it("puts blocks in order: head, divider, description, criteria, detail items", () => {
    const axis = STAT_SHEETS.ST.axes[0];
    const { blocks, height } = layoutStatDetail(axis, DETAIL_CONTENT.w, fake);
    expect(blocks.map((b) => b.type)).toEqual(["head", "divider", "desc", "criteria", "subs"]);
    for (let i = 1; i < blocks.length; i++) expect(blocks[i].y).toBeGreaterThan(blocks[i - 1].y);
    const last = blocks.at(-1)!;
    expect(height).toBe(last.y + last.h);
  });

  it("omits the criteria and detail blocks when the axis has none", () => {
    const axis = STAT_SHEETS.GK.axes[0];
    expect(layoutStatDetail(axis, DETAIL_CONTENT.w, fake).blocks.map((b) => b.type)).toEqual(["head", "divider", "desc"]);
    const pressEscape = STAT_SHEETS.ST.axes[1];
    expect(layoutStatDetail(pressEscape, DETAIL_CONTENT.w, fake).blocks.map((b) => b.type)).toEqual(["head", "divider", "desc", "subs"]);
  });

  it("lays a placeholder axis out as its description only", () => {
    const { blocks } = layoutStatDetail(STAT_SHEETS.MGR.axes[0], DETAIL_CONTENT.w, fake);
    expect(blocks.map((b) => b.type)).toEqual(["desc"]);
  });

  it("wraps child chips onto further rows when they do not fit", () => {
    const axis: StatAxis = { id: "t", label: "t", kind: "unique", description: "d", subs: [{ title: "s", children: ["가나다라마바", "가나다라마바", "가나다라마바", "가나다라마바", "가나다라마바"] }] };
    const subs = layoutStatDetail(axis, DETAIL_CONTENT.w, fake).blocks.find((b) => b.type === "subs");
    if (subs?.type !== "subs") throw new Error("no subs");
    const rows = new Set(subs.items[0].chips.map((chip) => chip.y));
    expect(rows.size).toBeGreaterThan(1);
  });

  it("fits all 42 axes into the content area without scrolling (full-width chars)", () => {
    const tooTall = allAxes().filter(({ axis }) => layoutStatDetail(axis, DETAIL_CONTENT.w, fake).height > DETAIL_CONTENT.h);
    expect(tooTall.map(({ axis }) => axis.id)).toEqual([]);
  });
});

describe("clampScroll", () => {
  it("stays within 0 .. content − view", () => {
    expect(clampScroll(-10, 300, 204)).toBe(0);
    expect(clampScroll(50, 300, 204)).toBe(50);
    expect(clampScroll(500, 300, 204)).toBe(96);
    expect(clampScroll(30, 100, 204)).toBe(0);
  });
});
