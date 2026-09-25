import { describe, expect, it } from "vitest";
import { INVENTORY_TABS } from "../data/equipment";
import {
  BUTTON_ORDER,
  BUTTON_RECTS,
  INFO_CARD,
  INV_WINDOW,
  LIST_PANEL,
  PREVIEW_PANEL,
  SLOTS_PER_PAGE,
  TAB_RECTS,
  hitInventory,
  inRect,
  moveCursor,
  pageCountFor,
  slotRect,
} from "../ui/inventoryLayout";

type R = { x: number; y: number; w: number; h: number };
const contains = (outer: R, inner: R) => inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.w <= outer.x + outer.w && inner.y + inner.h <= outer.y + outer.h;
const overlaps = (a: R, b: R) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const centre = (r: R) => [r.x + r.w / 2, r.y + r.h / 2] as const;

describe("inventory layout", () => {
  it("is a 3:2 window inside the 960×540 stage with the preview on the left of the list", () => {
    expect(INV_WINDOW.w / INV_WINDOW.h).toBe(1.5);
    expect(contains({ x: 0, y: 0, w: 960, h: 540 }, INV_WINDOW)).toBe(true);
    expect(contains(INV_WINDOW, PREVIEW_PANEL)).toBe(true);
    expect(contains(INV_WINDOW, LIST_PANEL)).toBe(true);
    expect(PREVIEW_PANEL.x + PREVIEW_PANEL.w).toBeLessThan(LIST_PANEL.x);
  });

  it("keeps tabs, the 4×3 grid, the info card and the buttons inside the window without overlaps", () => {
    expect(TAB_RECTS).toHaveLength(INVENTORY_TABS.length);
    const grid = Array.from({ length: SLOTS_PER_PAGE }, (_, i) => slotRect(i));
    const listParts = [...TAB_RECTS, ...grid, INFO_CARD];
    const parts = [...listParts, ...BUTTON_ORDER.map((id) => BUTTON_RECTS[id])];
    for (const part of parts) expect(contains(INV_WINDOW, part)).toBe(true);
    for (const part of listParts) expect(contains(LIST_PANEL, part)).toBe(true);
    for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) expect(overlaps(parts[i], parts[j]), `${i} vs ${j}`).toBe(false);
  });

  it("hit-tests buttons, tabs and only the filled slots of the page", () => {
    expect(hitInventory(...centre(BUTTON_RECTS.apply), 8, 1, 0)).toEqual({ kind: "button", id: "apply" });
    expect(hitInventory(...centre(TAB_RECTS[2]), 8, 1, 0)).toEqual({ kind: "tab", tab: "back" });
    expect(hitInventory(...centre(slotRect(3)), 8, 1, 0)).toEqual({ kind: "slot", index: 3 });
    expect(hitInventory(...centre(slotRect(9)), 8, 1, 0)).toBeNull();
    expect(hitInventory(...centre(slotRect(1)), 14, 2, 1)).toEqual({ kind: "slot", index: 13 });
    expect(hitInventory(10, 10, 8, 1, 0)).toBeNull();
    expect(inRect(INV_WINDOW, INV_WINDOW.x, INV_WINDOW.y)).toBe(true);
  });

  it("counts pages and moves the cursor over the grid", () => {
    expect(pageCountFor(0)).toBe(1);
    expect(pageCountFor(12)).toBe(1);
    expect(pageCountFor(13)).toBe(2);
    expect(moveCursor(-1, "ArrowRight", 8)).toBe(0);
    expect(moveCursor(0, "ArrowLeft", 8)).toBe(7);
    expect(moveCursor(7, "ArrowRight", 8)).toBe(0);
    expect(moveCursor(1, "ArrowDown", 8)).toBe(5);
    expect(moveCursor(5, "ArrowDown", 8)).toBe(5);
    expect(moveCursor(5, "ArrowUp", 8)).toBe(1);
    expect(moveCursor(1, "ArrowUp", 8)).toBe(1);
    expect(moveCursor(3, "ArrowRight", 0)).toBe(-1);
  });
});
