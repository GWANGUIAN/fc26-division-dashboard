// Layout of the cabinet inventory window (docs/pitch/13 §5-2), 960×540 logical px. The window is 720×480 (3:2, the
// aspect of the frame art `ui/inv-frame`); the rectangles below are window-relative in the spec and absolute here.
// Pure geometry so hit testing and grid navigation can be tested without a canvas.

import { INVENTORY_TABS, type InventoryTab } from "../data/equipment";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const INV_WINDOW: Rect = { x: 120, y: 30, w: 720, h: 480 };
const rel = (x: number, y: number, w: number, h: number): Rect => ({ x: INV_WINDOW.x + x, y: INV_WINDOW.y + y, w, h });

export const INV_TITLE = { x: INV_WINDOW.x + 360, y: INV_WINDOW.y + 40 } as const;
/** Left: character preview stage. Right: tabs, item grid, info card, pager. */
// (the recessed panels of `ui/inv-frame`: left 28..241 x 73..412, right 260..691 x 73..412 in window px)
export const PREVIEW_PANEL = rel(29, 74, 212, 337);
export const LIST_PANEL = rel(261, 74, 430, 337);
/** `ui/inv-preview-stage` (212×233) sits in the middle of the left panel; its podium is at ~85% of its height. */
export const STAGE_RECT = rel(29, 121, 212, 233);
/** Feet of the preview character (the podium of `ui/inv-preview-stage`). */
export const PREVIEW_FOOT = { x: INV_WINDOW.x + 135, y: INV_WINDOW.y + 319 } as const;
export const PREVIEW_SCALE = 2;

export const TAB_RECTS: readonly Rect[] = INVENTORY_TABS.map((_, i) => rel(275 + i * 102, 82, 96, 36));

export const SLOT_COLS = 4;
export const SLOT_ROWS = 3;
export const SLOTS_PER_PAGE = SLOT_COLS * SLOT_ROWS;
export const SLOT_SIZE = 64;
export const SLOT_GAP = 6;
const GRID_ORIGIN = { x: 275, y: 128 } as const;

/** Rectangle of the slot at `index` inside a page (0..11). */
export function slotRect(index: number): Rect {
  const col = index % SLOT_COLS;
  const row = Math.floor(index / SLOT_COLS);
  return rel(GRID_ORIGIN.x + col * (SLOT_SIZE + SLOT_GAP), GRID_ORIGIN.y + row * (SLOT_SIZE + SLOT_GAP), SLOT_SIZE, SLOT_SIZE);
}

export const INFO_CARD = rel(557, 128, 126, 204);
export const PAGER_PREV = rel(275, 340, 28, 28);
export const PAGER_NEXT = rel(367, 340, 28, 28);
export const PAGER_LABEL = { x: INV_WINDOW.x + 335, y: INV_WINDOW.y + 354 } as const;

export const ROTATE_PREV = rel(34, 372, 28, 28);
export const ROTATE_NEXT = rel(208, 372, 28, 28);
export const POSE_BUTTON = rel(66, 372, 68, 28);
export const AUTO_BUTTON = rel(138, 372, 68, 28);

export type InventoryButton = "apply" | "unequip" | "clear" | "close";
export const BUTTON_ORDER: readonly InventoryButton[] = ["apply", "unequip", "clear", "close"];
export const BUTTON_RECTS: Readonly<Record<InventoryButton, Rect>> = {
  apply: rel(156, 429, 96, 32),
  unequip: rel(260, 429, 96, 32),
  clear: rel(364, 429, 96, 32),
  close: rel(468, 429, 96, 32),
};
export const BUTTON_LABELS: Readonly<Record<InventoryButton, string>> = { apply: "적용", unequip: "해제", clear: "전체 해제", close: "닫기" };
/** Hint / toast lines at the bottom of the list panel, under the grid. */
export const HINT_POS = { x: INV_WINDOW.x + 275, y: INV_WINDOW.y + 384 } as const;

export type InventoryHit =
  | { kind: "tab"; tab: InventoryTab }
  | { kind: "slot"; index: number }
  | { kind: "pager"; step: -1 | 1 }
  | { kind: "rotate"; step: -1 | 1 }
  | { kind: "pose" }
  | { kind: "auto" }
  | { kind: "button"; id: InventoryButton };

export const inRect = (rect: Rect, x: number, y: number) => x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;

export const pageCountFor = (entries: number) => Math.max(1, Math.ceil(entries / SLOTS_PER_PAGE));

/** What lies under the pointer. `entries` = items in the current tab, `pages` = its page count. */
export function hitInventory(x: number, y: number, entries: number, pages: number, page: number): InventoryHit | null {
  for (const id of BUTTON_ORDER) if (inRect(BUTTON_RECTS[id], x, y)) return { kind: "button", id };
  for (let i = 0; i < TAB_RECTS.length; i++) if (inRect(TAB_RECTS[i], x, y)) return { kind: "tab", tab: INVENTORY_TABS[i] };
  for (let i = 0; i < SLOTS_PER_PAGE; i++) {
    if (page * SLOTS_PER_PAGE + i < entries && inRect(slotRect(i), x, y)) return { kind: "slot", index: page * SLOTS_PER_PAGE + i };
  }
  if (pages > 1) {
    if (inRect(PAGER_PREV, x, y)) return { kind: "pager", step: -1 };
    if (inRect(PAGER_NEXT, x, y)) return { kind: "pager", step: 1 };
  }
  if (inRect(ROTATE_PREV, x, y)) return { kind: "rotate", step: -1 };
  if (inRect(ROTATE_NEXT, x, y)) return { kind: "rotate", step: 1 };
  if (inRect(POSE_BUTTON, x, y)) return { kind: "pose" };
  if (inRect(AUTO_BUTTON, x, y)) return { kind: "auto" };
  return null;
}

/**
 * Arrow-key move of the cursor over `count` entries laid out in `SLOT_COLS` columns (row-major, across pages).
 * Left/right wrap inside the list, up/down stay put at the first/last row.
 */
export function moveCursor(cursor: number, key: string, count: number): number {
  if (count <= 0) return -1;
  if (cursor < 0) return 0;
  switch (key) {
    case "ArrowLeft":
      return (cursor - 1 + count) % count;
    case "ArrowRight":
      return (cursor + 1) % count;
    case "ArrowUp":
      return cursor - SLOT_COLS >= 0 ? cursor - SLOT_COLS : cursor;
    case "ArrowDown":
      return cursor + SLOT_COLS < count ? cursor + SLOT_COLS : cursor;
    default:
      return cursor;
  }
}
