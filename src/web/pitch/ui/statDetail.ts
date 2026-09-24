// Layout of the stat screen's description panel (docs/pitch/11 §6). Pure functions: `wrapText` breaks Korean text into
// lines and `layoutStatDetail` turns one axis into positioned blocks (y relative to the top of the content area) that
// `scenes/StatScene.ts` only has to draw. The text measurer is injected so tests can use a fake (size px per char).

import { axisTag, isPlaceholderAxis, type StatAxis } from "../data/stats";

/** Width of a text at the size the caller asked for. */
export type Measure = (text: string, size: number) => number;

/** Content area of the panel (logical px, panel-local) — the art's dark body minus the fixed bottom (ability row + ribbon). */
export const DETAIL_CONTENT = { x: 40, y: 82, w: 320, h: 204 } as const;

export const DESC_SIZE = 12;
export const DESC_LINE = 15;
export const DESC_MAX_LINES = 4;
export const SMALL_SIZE = 11;
export const SMALL_LINE = 14;
export const CHIP_SIZE = 10;
export const CHIP_HEIGHT = 16;
export const CHIP_GAP = 4;
export const LABEL_HEIGHT = 14;
export const HEAD_HEIGHT = 16;
export const DIVIDER_HEIGHT = 2;
export const SIGN_CHIP = 14;

const BREAK_AFTER = new Set([" ", ",", ".", "·", "/", ")", "-", "~", "、", "。"]);

/** Breaks `text` into lines no wider than `maxWidth` (a char wider than that gets a line of its own). Prefers to break at spaces/punctuation; spaces at a break are dropped. */
export function wrapText(text: string, maxWidth: number, measure: (text: string) => number): string[] {
  const lines: string[] = [];
  const chars = [...text];
  let line = "";
  let lastBreak = -1; // length of `line` right after the latest break opportunity
  for (const ch of chars) {
    if (ch === " " && line === "") continue;
    const next = line + ch;
    if (line !== "" && ch !== " " && measure(next) > maxWidth) {
      if (lastBreak > 0 && lastBreak < line.length) {
        lines.push(line.slice(0, lastBreak).trimEnd());
        line = line.slice(lastBreak).trimStart() + ch;
      } else {
        lines.push(line.trimEnd());
        line = ch;
      }
      lastBreak = -1;
      // the carried remainder may itself contain break opportunities
      const spaceAt = line.lastIndexOf(" ");
      if (spaceAt >= 0) lastBreak = spaceAt + 1;
      continue;
    }
    line = next;
    if (BREAK_AFTER.has(ch)) lastBreak = line.length;
  }
  if (line.trim() !== "") lines.push(line.trimEnd());
  return lines;
}

/** Wraps and caps at `maxLines`, ending the last line with an ellipsis when text was cut. */
function wrapCapped(text: string, maxWidth: number, maxLines: number, measure: (text: string) => number): string[] {
  const lines = wrapText(text, maxWidth, measure);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1] ?? "";
  while (last.length > 0 && measure(`${last}…`) > maxWidth) last = last.slice(0, -1);
  kept[maxLines - 1] = `${last}…`;
  return kept;
}

export type Sign = "+" | "−";

export interface SignRow {
  sign: Sign;
  y: number;
  h: number;
  lines: string[];
}

export interface ChipBox {
  text: string;
  x: number;
  y: number;
  w: number;
}

export interface SubLayout {
  y: number;
  h: number;
  title: string;
  textLines: string[];
  rows: SignRow[];
  chips: ChipBox[];
}

export type DetailBlock =
  | { type: "head"; y: number; h: number; tag: string }
  | { type: "divider"; y: number; h: number }
  | { type: "desc"; y: number; h: number; lines: string[] }
  | { type: "criteria"; y: number; h: number; labelY: number; rows: SignRow[] }
  | { type: "subs"; y: number; h: number; labelY: number; items: SubLayout[] };

export interface StatDetailLayout {
  blocks: DetailBlock[];
  /** Total content height (also the scroll extent). */
  height: number;
}

const GAP = 6;

function signRows(plus: string | undefined, minus: string | undefined, width: number, size: number, lineHeight: number, pad: number, gap: number, measure: Measure, y0: number): { rows: SignRow[]; height: number } {
  const rows: SignRow[] = [];
  let y = y0;
  const text = (t: string) => wrapCapped(t, width, 2, (s) => measure(s, size));
  for (const [sign, value] of [["+", plus], ["−", minus]] as const) {
    if (!value) continue;
    const lines = text(value);
    const h = lines.length * lineHeight + pad;
    rows.push({ sign, y, h, lines });
    y += h + gap;
  }
  return { rows, height: rows.length === 0 ? 0 : y - gap - y0 };
}

/** Positions every block of `axis` for a content area `availableWidth` wide. Blocks without content (no plus/minus/subs) are left out. */
export function layoutStatDetail(axis: StatAxis, availableWidth: number, measure: Measure): StatDetailLayout {
  const blocks: DetailBlock[] = [];
  let y = 0;
  const bodyMeasure = (size: number) => (text: string) => measure(text, size);

  if (isPlaceholderAxis(axis)) {
    const lines = wrapCapped(axis.description, availableWidth, DESC_MAX_LINES, bodyMeasure(DESC_SIZE));
    blocks.push({ type: "desc", y, h: lines.length * DESC_LINE, lines });
    return { blocks, height: lines.length * DESC_LINE };
  }

  blocks.push({ type: "head", y, h: HEAD_HEIGHT, tag: axisTag(axis) });
  y += HEAD_HEIGHT + 4;
  blocks.push({ type: "divider", y, h: DIVIDER_HEIGHT });
  y += DIVIDER_HEIGHT + GAP;

  const descLines = wrapCapped(axis.description, availableWidth, DESC_MAX_LINES, bodyMeasure(DESC_SIZE));
  const descH = descLines.length * DESC_LINE;
  blocks.push({ type: "desc", y, h: descH, lines: descLines });
  y += descH + GAP;

  if (axis.plus || axis.minus) {
    const top = y;
    const labelY = y;
    y += LABEL_HEIGHT;
    const rowWidth = availableWidth - SIGN_CHIP - 14;
    const { rows, height } = signRows(axis.plus, axis.minus, rowWidth, SMALL_SIZE, SMALL_LINE, 6, 3, measure, y);
    y += height + GAP;
    blocks.push({ type: "criteria", y: top, h: y - GAP - top, labelY, rows });
  }

  if (axis.subs && axis.subs.length > 0) {
    const top = y;
    const labelY = y;
    y += LABEL_HEIGHT;
    const items: SubLayout[] = [];
    const inner = availableWidth - 14;
    for (const sub of axis.subs) {
      const itemTop = y;
      let cursor = y + 15; // bullet + title row
      const textLines = sub.text ? wrapCapped(sub.text, inner, 2, bodyMeasure(SMALL_SIZE)) : [];
      cursor += textLines.length * SMALL_LINE;
      const { rows, height } = signRows(sub.plus, sub.minus, inner - SIGN_CHIP - 4, SMALL_SIZE, SMALL_LINE, 0, 0, measure, cursor);
      cursor += height;
      const chips: ChipBox[] = [];
      if (sub.children && sub.children.length > 0) {
        cursor += 2;
        let x = 0;
        let rowTop = cursor;
        for (const text of sub.children) {
          const w = Math.ceil(measure(text, CHIP_SIZE)) + 10;
          if (x > 0 && x + w > inner) {
            x = 0;
            rowTop += CHIP_HEIGHT + CHIP_GAP;
          }
          chips.push({ text, x, y: rowTop, w });
          x += w + CHIP_GAP;
        }
        cursor = rowTop + CHIP_HEIGHT;
      }
      items.push({ y: itemTop, h: cursor - itemTop, title: sub.title, textLines, rows, chips });
      y = cursor + 5;
    }
    y -= 5;
    blocks.push({ type: "subs", y: top, h: y - top, labelY, items });
    y += GAP;
  }

  return { blocks, height: Math.max(0, y - GAP) };
}

/** Scroll offset kept inside 0 .. content − view (0 when everything fits). */
export function clampScroll(scroll: number, contentHeight: number, viewHeight: number): number {
  const max = Math.max(0, contentHeight - viewHeight);
  return Math.min(max, Math.max(0, scroll));
}
