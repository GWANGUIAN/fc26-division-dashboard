// Stat screen overlay (docs/pitch/03 §5, 11), pushed on top of the locker room. Left: the six-axis hexagon; right: the
// structured description of the selected axis (default = the top axis): kind tag, judging criteria, detail items.
// Names and descriptions are real (data/stats.ts); only the ability NUMBERS are "???" and the COMING SOON ribbons say
// so. A hidden aria-live line mirrors the selection for screen readers.

import { PITCH_CHARACTERS, characterIndex, type PitchCharacter } from "../data/characters";
import { STAT_AXIS_COUNT, axisLabel, isPlaceholderAxis, statSheetFor, type StatAxis, type StatSheet } from "../data/stats";
import { SILENT_PITCH_AUDIO, type PitchAudioLike } from "../audio/pitchAudio";
import type { AssetImage, PitchAssets } from "../engine/assets";
import type { KeyInput, PointerInput, Scene, SceneCtx } from "../engine/sceneManager";
import { drawNineSlice } from "../engine/sprite";
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from "../engine/stage";
import { drawText, PIXEL_FONT_FAMILY, TEXT_COLORS } from "../engine/text";
import { cycleAxis, drawHexagon, hitAxis, labelPlateRect, HEX, KIND_COLORS, type AxisStep, type Rect } from "../ui/hexagon";
import { CHIP_HEIGHT, CHIP_SIZE, DESC_LINE, DESC_SIZE, DETAIL_CONTENT, SIGN_CHIP, SMALL_LINE, SMALL_SIZE, clampScroll, layoutStatDetail, type Measure, type SignRow, type StatDetailLayout } from "../ui/statDetail";
import { drawHudButtons, hudButtonAt, inside, syncSoundState, toggleSound, type HudButtonId } from "./hudCommon";

export const STAT_FRAME: Rect = { x: 32, y: 24, w: 896, h: 492 };
export const STAT_DETAIL_PANEL: Rect = { x: 512, y: 104, w: 400, h: 392 };
const FRAME_INSET = 24;
const HEADER = { x: 56, y: 40, w: 848, h: 48 } as const;
const RIBBON_ANGLE = (-12 * Math.PI) / 180;
export const STAT_OPEN_FADE_SECONDS = 0.15;
export const STAT_OPEN_SLIDE_SECONDS = 0.2;
/** Axis change: the panel content fades in over this long while sliding up 8px. */
export const STAT_SWAP_SECONDS = 0.12;
/** One wheel notch / arrow press scrolls this many px. */
export const STAT_SCROLL_STEP = 20;

const PLUS_COLOR = "#5cff9a";
const CYAN = "#2be4ff";
const SUB_TEXT_COLOR = "#b9b9e6";
/** Panel-local rows of the fixed bottom: the ability bar, and the centre of the ribbon under it. */
const ABILITY_ROW_Y = 290;
const RIBBON_Y = 328;

/** Header switcher for looking at another player's stats: ◀ name ▶ (Q / E). View only — the played character is unchanged. */
export const CHAR_PREV_RECT: Rect = { x: 300, y: 76, w: 22, h: 18 };
export const CHAR_NEXT_RECT: Rect = { x: 478, y: 76, w: 22, h: 18 };
export type CharStep = -1 | 1;

const HUD_BUTTONS: readonly HudButtonId[] = ["dashboard", "sound"];

/** Key press → selection step (03 §5: ←→ clockwise / counter-clockwise, Tab = next). */
export const AXIS_KEY_STEPS: Readonly<Record<string, AxisStep>> = {
  ArrowRight: "cw",
  ArrowLeft: "ccw",
  Tab: "next",
};

/** Measures text with the canvas font; without a canvas (tests, before the first frame) it assumes one full-width char per size px. */
function makeMeasure(g?: CanvasRenderingContext2D): Measure {
  if (!g) return (text, size) => [...text].length * size;
  return (text, size) => {
    g.font = `${size}px ${PIXEL_FONT_FAMILY}`;
    return g.measureText(text).width;
  };
}

interface CachedLayout {
  axis: number;
  /** Measured with a real canvas (false = the estimate used before the first render). */
  real: boolean;
  layout: StatDetailLayout;
}

/** aria-live text of an axis: name, description, judging criteria, detail item titles, and that the number is undecided. */
export function announcementFor(sheet: StatSheet, index: number): string {
  const axis = sheet.axes[index];
  const head = `선택한 스탯 ${index + 1}/${STAT_AXIS_COUNT}: ${axisLabel(sheet, index)}`;
  if (!axis || isPlaceholderAxis(axis)) return `${head} — ???. 능력치: 미정`;
  const parts = [`${head} — ${axis.description}.`];
  if (axis.plus || axis.minus) {
    const criteria = [axis.plus ? `플러스 ${axis.plus}` : "", axis.minus ? `마이너스 ${axis.minus}` : ""].filter(Boolean).join(", ");
    parts.push(`판정 기준: ${criteria}.`);
  }
  if (axis.subs?.length) parts.push(`세부 항목: ${axis.subs.map((sub) => sub.title).join(", ")}.`);
  parts.push("능력치: 미정");
  return parts.join(" ");
}

export interface StatSceneParams {
  character: PitchCharacter;
  /** Called when the overlay closes (the analyzer goes back to its idle look). */
  onClose?(): void;
}

export class StatScene implements Scene {
  private ctx?: SceneCtx;
  private assets?: PitchAssets;
  private audio: PitchAudioLike = SILENT_PITCH_AUDIO;
  private readonly params: StatSceneParams;
  private sheet: StatSheet;
  /** The player whose stats are shown (starts as `params.character`, changed by the header switcher). */
  private character: PitchCharacter;
  private hoveredChar: CharStep | 0 = 0;
  private pressedChar: CharStep | 0 = 0;
  /** True once the `select` group (all portraits) was requested for the switcher; released on exit. */
  private portraitsRequested = false;

  private selected = 0;
  private hoveredAxis = -1;
  private hoveredButton: HudButtonId | null = null;
  private pressedButton: HudButtonId | null = null;
  private clock = 0;
  private closed = false;
  /** Detail-panel layout of the selected axis, recomputed only when the axis changes. */
  private cache?: CachedLayout;
  private scroll = 0;
  private swapClock = STAT_SWAP_SECONDS;

  constructor(params: StatSceneParams) {
    this.params = params;
    this.character = params.character;
    this.sheet = statSheetFor(params.character.position);
  }

  /** The player whose stats are on screen. */
  get viewedCharacter() {
    return this.character;
  }

  /** Shows the previous / next player of the roster (wrapping): new sheet, axis 0, scroll 0. */
  switchCharacter(step: CharStep) {
    const n = PITCH_CHARACTERS.length;
    const next = PITCH_CHARACTERS[(characterIndex(this.character.id) + step + n) % n];
    if (!next || next.id === this.character.id) return;
    this.character = next;
    this.sheet = statSheetFor(next.position);
    this.selected = 0;
    this.hoveredAxis = -1;
    this.scroll = 0;
    this.swapClock = 0;
    this.cache = undefined;
    this.audio.playSfx("stat-select");
    if (!this.portraitsRequested && this.assets) {
      this.portraitsRequested = true;
      void this.assets.loadGroup("select").catch(() => undefined);
    }
    this.ctx?.host.announce?.(`${next.name} ${next.positionLabel}. ${this.announcement()}`);
  }

  /** The axis in focus (0 = top). */
  get selectedAxis() {
    return this.selected;
  }

  enter(ctx: SceneCtx) {
    this.ctx = ctx;
    this.assets = ctx.host.assets;
    this.audio = ctx.host.audio ?? SILENT_PITCH_AUDIO;
    syncSoundState();
    this.audio.playSfx("stat-on");
    this.announce(true);
  }

  exit() {
    this.closed = true;
    this.ctx?.host.setCursor("default");
    this.ctx?.host.announce?.("");
    if (this.portraitsRequested) this.assets?.release("select");
    this.params.onClose?.();
  }

  private reduced() {
    return this.ctx?.host.reducedMotion?.() ?? false;
  }

  /** Current scroll offset of the detail content (0 = top). */
  get scrollOffset() {
    return this.scroll;
  }

  /** Largest scroll offset for the selected axis (0 when the content fits). */
  get scrollMax() {
    return Math.max(0, this.layoutFor().height - DETAIL_CONTENT.h);
  }

  private layoutFor(g?: CanvasRenderingContext2D): StatDetailLayout {
    const cached = this.cache;
    if (cached && cached.axis === this.selected && (cached.real || !g)) return cached.layout;
    const layout = layoutStatDetail(this.sheet.axes[this.selected] as StatAxis, DETAIL_CONTENT.w, makeMeasure(g));
    this.cache = { axis: this.selected, real: !!g, layout };
    return layout;
  }

  private scrollBy(delta: number) {
    this.scroll = clampScroll(this.scroll + delta, this.layoutFor().height, DETAIL_CONTENT.h);
  }

  /** Text for the aria-live region: the number changes so a repeated axis is still announced. */
  announcement(): string {
    return announcementFor(this.sheet, this.selected);
  }

  private announce(opening = false) {
    const text = this.announcement();
    this.ctx?.host.announce?.(opening ? `스탯 화면. ${text}. 좌우 방향키로 축을 고르고 Esc로 닫습니다.` : text);
  }

  private select(index: number, sound = true) {
    if (index === this.selected || index < 0) return;
    this.selected = index;
    this.scroll = 0;
    this.swapClock = 0;
    if (sound) this.audio.playSfx("stat-select");
    this.announce();
  }

  private close() {
    if (this.closed) return;
    this.ctx?.manager.pop();
  }

  update(dt: number) {
    this.clock += dt;
    this.swapClock += dt;
  }

  // ---- input ----

  onKey(e: KeyInput) {
    if (e.code === "Escape") {
      this.audio.playSfx("ui-back");
      this.close();
      return;
    }
    if (e.code === "KeyM") {
      toggleSound(this.audio);
      return;
    }
    if (e.code === "ArrowDown") {
      this.scrollBy(STAT_SCROLL_STEP);
      return;
    }
    if (e.code === "ArrowUp") {
      this.scrollBy(-STAT_SCROLL_STEP);
      return;
    }
    if (e.code === "KeyQ" || e.code === "KeyE") {
      this.switchCharacter(e.code === "KeyQ" ? -1 : 1);
      return;
    }
    const step = AXIS_KEY_STEPS[e.code];
    if (step) this.select(cycleAxis(this.selected, step));
  }

  onWheel(deltaY: number) {
    if (deltaY !== 0) this.scrollBy(Math.sign(deltaY) * STAT_SCROLL_STEP);
  }

  onPointer(e: PointerInput) {
    const button = hudButtonAt(HUD_BUTTONS, e.x, e.y);
    const charStep: CharStep | 0 = button ? 0 : inside(CHAR_PREV_RECT, e.x, e.y) ? -1 : inside(CHAR_NEXT_RECT, e.x, e.y) ? 1 : 0;
    if (charStep !== this.hoveredChar && charStep) this.audio.playSfx("ui-hover");
    this.hoveredChar = charStep;
    const axis = button || charStep ? -1 : hitAxis(e.x, e.y);
    if (button !== this.hoveredButton && button) this.audio.playSfx("ui-hover");
    this.hoveredButton = button;
    this.hoveredAxis = axis;
    this.ctx?.host.setCursor(button || charStep || axis >= 0 ? "pointer" : "default");

    if (e.type === "down") {
      this.pressedButton = button;
      this.pressedChar = charStep;
      return;
    }
    if (e.type !== "up") return;
    const pressed = this.pressedButton;
    const pressedChar = this.pressedChar;
    this.pressedButton = null;
    this.pressedChar = 0;
    if (pressedChar && pressedChar === charStep) {
      this.audio.playSfx("ui-click");
      this.switchCharacter(charStep);
      return;
    }
    if (pressed && pressed === button) {
      this.audio.playSfx("ui-click");
      if (pressed === "dashboard") {
        this.audio.playSfx("mode-switch");
        this.ctx?.host.goDashboard();
      } else toggleSound(this.audio);
      return;
    }
    if (axis >= 0) {
      this.select(axis);
      return;
    }
    // the ribbon / panel says COMING SOON: a click on the panel gets the matching blip
    if (inside(STAT_DETAIL_PANEL, e.x, e.y)) this.audio.playSfx("stat-soon");
  }

  // ---- render ----

  private image(key: string): AssetImage | undefined {
    return this.assets?.get(key);
  }

  render(g: CanvasRenderingContext2D) {
    const reduced = this.reduced();
    const fade = reduced ? 1 : Math.min(1, this.clock / STAT_OPEN_FADE_SECONDS);
    const slide = reduced ? 0 : Math.round((1 - Math.min(1, this.clock / STAT_OPEN_SLIDE_SECONDS)) * 16);
    g.save();
    g.globalAlpha = 0.7 * fade;
    g.fillStyle = "#05060f";
    g.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    g.globalAlpha = fade;
    g.translate(0, slide);
    this.drawFrame(g);
    this.drawHeader(g);
    this.drawHexagonArea(g);
    this.drawDetailPanel(g);
    g.restore();
    g.save();
    g.globalAlpha = fade;
    drawHudButtons(g, (key) => this.image(key), HUD_BUTTONS, { hovered: this.hoveredButton, pressed: this.pressedButton });
    g.restore();
  }

  private drawFrame(g: CanvasRenderingContext2D) {
    const { x, y, w, h } = STAT_FRAME;
    const frame = this.image("ui/terminal-frame");
    if (frame) {
      drawNineSlice(g, frame, FRAME_INSET, x, y, w, h);
      return;
    }
    g.fillStyle = "#0a0a1a";
    g.fillRect(x - 2, y - 2, w + 4, h + 4);
    g.fillStyle = "#0d1a33";
    g.fillRect(x, y, w, h);
    g.strokeStyle = "#3ee6c1";
    g.lineWidth = 2;
    g.strokeRect(x + 8, y + 8, w - 16, h - 16);
  }

  /**
   * Portrait + name + position, tucked under the frame's top bar (the art's corner bracket and side rails eat the
   * outer 50px), `PLAYER STATS` inside the top bar (clear of the sound / dashboard buttons) and the key guide beside the name.
   */
  private drawHeader(g: CanvasRenderingContext2D) {
    const { character } = this;
    const portrait = this.image(`portraits/${character.id}-neutral`);
    const px = 92;
    const py = 80;
    g.fillStyle = "#0a0a1a";
    g.fillRect(px - 2, py - 2, 44, 44);
    if (portrait) g.drawImage(portrait, px, py, 40, 40);
    else {
      g.fillStyle = character.themeColor;
      g.fillRect(px, py, 40, 40);
    }
    drawText(g, character.name, px + 52, py + 9, { size: 16, color: TEXT_COLORS.gold, baseline: "middle" });
    const badgeX = px + 52;
    const badgeY = py + 22;
    g.fillStyle = "#152640";
    g.fillRect(badgeX, badgeY, 40, 14);
    g.strokeStyle = "#3ee6c1";
    g.lineWidth = 1;
    g.strokeRect(badgeX + 0.5, badgeY + 0.5, 39, 13);
    drawText(g, this.sheet.position, badgeX + 20, badgeY + 8, { size: 10, align: "center", baseline: "middle" });
    drawText(g, character.positionLabel, badgeX + 48, badgeY + 8, { size: 10, color: "#9fe9ff", baseline: "middle" });
    drawText(g, "PLAYER STATS", LOGICAL_WIDTH / 2, 63, { size: 20, align: "center", baseline: "middle" });
    this.drawCharSwitcher(g);
    drawText(g, "←→ 축 · Tab 다음 · Q/E 선수 · Esc", 300, 106, { size: 10, color: "#9fe9ff", baseline: "middle" });
  }

  private drawCharSwitcher(g: CanvasRenderingContext2D) {
    const arrow = (rect: Rect, glyph: string, step: CharStep) => {
      const hot = this.hoveredChar === step;
      const down = this.pressedChar === step && hot;
      g.fillStyle = hot ? "#1f4a6e" : "#152640";
      g.fillRect(rect.x, rect.y + (down ? 1 : 0), rect.w, rect.h);
      g.strokeStyle = hot ? TEXT_COLORS.gold : "#3ee6c1";
      g.lineWidth = 1;
      g.strokeRect(rect.x + 0.5, rect.y + (down ? 1 : 0) + 0.5, rect.w - 1, rect.h - 1);
      drawText(g, glyph, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1 + (down ? 1 : 0), { size: 10, color: hot ? TEXT_COLORS.gold : "#9fe9ff", align: "center", baseline: "middle", shadow: false });
    };
    arrow(CHAR_PREV_RECT, "◀", -1);
    arrow(CHAR_NEXT_RECT, "▶", 1);
    const index = characterIndex(this.character.id) + 1;
    const cx = (CHAR_PREV_RECT.x + CHAR_NEXT_RECT.x + CHAR_NEXT_RECT.w) / 2;
    drawText(g, `${this.character.name} ${index}/${PITCH_CHARACTERS.length}`, cx, CHAR_PREV_RECT.y + CHAR_PREV_RECT.h / 2 + 1, { size: 10, color: TEXT_COLORS.base, align: "center", baseline: "middle" });
  }

  private drawHexagonArea(g: CanvasRenderingContext2D) {
    drawHexagon(g, {
      images: {
        bg: this.image("ui/hex-bg"),
        fill: this.image("ui/hex-fill"),
        frame: this.image("ui/hex-frame"),
        nodeHover: this.image("ui/node-hover"),
        nodeSelected: this.image("ui/node-selected"),
      },
      values: this.sheet.values,
      selected: this.selected,
      hovered: this.hoveredAxis,
      seconds: this.clock,
      kinds: this.sheet.axes.map((axis) => (isPlaceholderAxis(axis) ? null : axis.kind)),
    });
    for (let index = 0; index < STAT_AXIS_COUNT; index++) this.drawAxisPlate(g, index);
    this.drawLegend(g);
    this.drawRibbon(g, HEX.cx, HEX.cy, RIBBON_ANGLE);
  }

  /** `● 공통 스탯   ● 포지션 고유 스탯` under the hexagon (GK: a single `● GK 고유 스탯`; the manager has none). */
  private drawLegend(g: CanvasRenderingContext2D) {
    if (isPlaceholderAxis(this.sheet.axes[0])) return;
    const items: { color: string; text: string }[] = [];
    if (this.sheet.axes.some((axis) => axis.kind === "common")) items.push({ color: KIND_COLORS.common, text: "공통 스탯" });
    items.push({ color: KIND_COLORS.unique, text: this.sheet.position === "GK" ? "GK 고유 스탯" : "포지션 고유 스탯" });
    const measure = makeMeasure(g);
    let x = 56;
    for (const item of items) {
      drawText(g, "●", x, 486, { size: 10, color: item.color, baseline: "middle" });
      drawText(g, item.text, x + 14, 486, { size: 10, baseline: "middle" });
      x += 14 + Math.ceil(measure(item.text, 10)) + 16;
    }
  }

  private drawAxisPlate(g: CanvasRenderingContext2D, index: number) {
    const r = labelPlateRect(index);
    const selected = index === this.selected;
    const plate = this.image("ui/axis-plate");
    if (plate) g.drawImage(plate, r.x, r.y, r.w, r.h);
    else {
      g.fillStyle = "#152640";
      g.fillRect(r.x, r.y, r.w, r.h);
    }
    if (selected || index === this.hoveredAxis) {
      g.strokeStyle = selected ? TEXT_COLORS.gold : "#9fe9ff";
      g.lineWidth = 2;
      g.strokeRect(r.x - 1, r.y - 1, r.w + 2, r.h + 2);
    }
    const axis = this.sheet.axes[index];
    const kindColor = axis && !isPlaceholderAxis(axis) ? KIND_COLORS[axis.kind] : TEXT_COLORS.base;
    drawText(g, axisLabel(this.sheet, index), r.x + r.w / 2, r.y + r.h / 2, { size: 10, color: selected ? TEXT_COLORS.gold : kindColor, align: "center", baseline: "middle" });
  }

  /** The COMING SOON banner (art has no letters): drawn rotated over the hexagon, upright at the bottom of the detail panel. */
  private drawRibbon(g: CanvasRenderingContext2D, cx: number, cy: number, angle: number) {
    const ribbon = this.image("ui/coming-soon");
    const w = ribbon?.width ?? 216;
    const h = ribbon?.height ?? 40;
    g.save();
    g.translate(Math.round(cx), Math.round(cy));
    g.rotate(angle);
    if (ribbon) g.drawImage(ribbon, -Math.round(w / 2), -Math.round(h / 2));
    else {
      g.fillStyle = "rgba(10, 10, 26, 0.9)";
      g.fillRect(-w / 2, -h / 2, w, h);
      g.strokeStyle = TEXT_COLORS.gold;
      g.lineWidth = 2;
      g.strokeRect(-w / 2 + 1, -h / 2 + 1, w - 2, h - 2);
    }
    // black letters with an orange drop shadow
    drawText(g, "COMING SOON", 0, 1, { size: 11, color: "#ff8a1f", align: "center", baseline: "middle", shadow: false });
    drawText(g, "COMING SOON", 0, 0, { size: 11, color: "#0a0a1a", align: "center", baseline: "middle", shadow: false });
    g.restore();
  }

  private drawDetailPanel(g: CanvasRenderingContext2D) {
    const { x, y, w, h } = STAT_DETAIL_PANEL;
    const panel = this.image("ui/detail-panel");
    // the art is made for exactly this rectangle (400×392): drawn 1:1, never stretched
    if (panel) g.drawImage(panel, x, y, w, h);
    else {
      g.fillStyle = "#0a0a1a";
      g.fillRect(x - 2, y - 2, w + 4, h + 4);
      g.fillStyle = "#101d38";
      g.fillRect(x, y, w, h);
    }
    // the art's header slot (panel x 93~309, y 27~66) holds the axis name; the dark body (y 75~350) holds the
    // structured description (clipped + scrollable), then the fixed ability row and the ribbon
    const axis = this.sheet.axes[this.selected];
    const layout = this.layoutFor(g);
    const centerX = x + w / 2;
    const t = this.reduced() ? 1 : Math.min(1, this.swapClock / STAT_SWAP_SECONDS);
    const slide = Math.round((1 - t) * 8);
    const placeholder = isPlaceholderAxis(axis);
    const measure = makeMeasure(g);

    g.save();
    g.globalAlpha *= t;
    const title = axisLabel(this.sheet, this.selected);
    const titleX = centerX + (placeholder ? 0 : 6);
    drawText(g, title, titleX, y + 47 + slide, { size: 20, color: TEXT_COLORS.gold, align: "center", baseline: "middle" });
    if (!placeholder) {
      const barX = Math.round(titleX - measure(title, 20) / 2) - 10;
      g.fillStyle = KIND_COLORS[axis.kind];
      g.fillRect(barX, y + 37 + slide, 4, 20);
    }

    g.save();
    g.beginPath();
    g.rect(x + DETAIL_CONTENT.x, y + DETAIL_CONTENT.y, DETAIL_CONTENT.w, DETAIL_CONTENT.h);
    g.clip();
    g.translate(x + DETAIL_CONTENT.x, y + DETAIL_CONTENT.y - this.scroll + slide);
    this.drawBlocks(g, axis, layout);
    g.restore();
    g.restore();

    this.drawScrollHints(g, x, y, layout);
    this.drawAbilityRow(g, x, y);
    this.drawRibbon(g, centerX, y + RIBBON_Y, 0);
  }

  private drawBlocks(g: CanvasRenderingContext2D, axis: StatAxis, layout: StatDetailLayout) {
    const width = DETAIL_CONTENT.w;
    for (const block of layout.blocks) {
      if (block.type === "head") {
        const color = KIND_COLORS[axis.kind];
        g.fillStyle = "#0f1330";
        g.fillRect(0, block.y, 52, block.h);
        g.strokeStyle = color;
        g.lineWidth = 1;
        g.strokeRect(0.5, block.y + 0.5, 51, block.h - 1);
        drawText(g, block.tag, 26, block.y + block.h / 2, { size: CHIP_SIZE, color, align: "center", baseline: "middle", shadow: false });
        drawText(g, `AXIS ${this.selected + 1}/${STAT_AXIS_COUNT}`, width, block.y + block.h / 2, { size: CHIP_SIZE, color: "#9fe9ff", align: "right", baseline: "middle" });
      } else if (block.type === "divider") {
        g.fillStyle = "rgba(43, 228, 255, 0.4)";
        g.fillRect(0, block.y, width, block.h);
      } else if (block.type === "desc") {
        block.lines.forEach((line, i) => drawText(g, line, 0, block.y + i * DESC_LINE + DESC_LINE / 2, { size: DESC_SIZE, baseline: "middle" }));
      } else if (block.type === "criteria") {
        drawText(g, "판정 기준", 0, block.labelY + 6, { size: CHIP_SIZE, color: CYAN, baseline: "middle" });
        for (const row of block.rows) this.drawCriteriaRow(g, row, width);
      } else {
        drawText(g, "세부 항목", 0, block.labelY + 6, { size: CHIP_SIZE, color: CYAN, baseline: "middle" });
        for (const item of block.items) {
          g.fillStyle = TEXT_COLORS.gold;
          g.fillRect(0, item.y + 4, 6, 6);
          drawText(g, item.title, 14, item.y + 7, { size: DESC_SIZE, baseline: "middle" });
          let cursor = item.y + 15;
          for (const line of item.textLines) {
            drawText(g, line, 14, cursor + SMALL_LINE / 2, { size: SMALL_SIZE, color: SUB_TEXT_COLOR, baseline: "middle" });
            cursor += SMALL_LINE;
          }
          for (const row of item.rows) this.drawSignRow(g, row, 14, 12);
          for (const chip of item.chips) {
            g.strokeStyle = CYAN;
            g.lineWidth = 1;
            g.strokeRect(14 + chip.x + 0.5, chip.y + 0.5, chip.w - 1, CHIP_HEIGHT - 1);
            drawText(g, chip.text, 14 + chip.x + chip.w / 2, chip.y + CHIP_HEIGHT / 2, { size: CHIP_SIZE, color: CYAN, align: "center", baseline: "middle", shadow: false });
          }
        }
      }
    }
  }

  private signColor(row: SignRow) {
    return row.sign === "+" ? PLUS_COLOR : TEXT_COLORS.coral;
  }

  /** Small +/− marker followed by the wrapped condition lines. */
  private drawSignRow(g: CanvasRenderingContext2D, row: SignRow, x: number, chip: number) {
    g.fillStyle = this.signColor(row);
    g.fillRect(x, row.y + 1, chip, chip);
    drawText(g, row.sign, x + chip / 2, row.y + 1 + chip / 2, { size: 10, color: "#0a0a1a", align: "center", baseline: "middle", shadow: false });
    row.lines.forEach((line, i) => drawText(g, line, x + chip + 4, row.y + i * SMALL_LINE + SMALL_LINE / 2, { size: SMALL_SIZE, baseline: "middle" }));
  }

  /** Top-level judging-criteria row: navy plate with a 1px border, then the marker + text. */
  private drawCriteriaRow(g: CanvasRenderingContext2D, row: SignRow, width: number) {
    g.fillStyle = "#0f1330";
    g.fillRect(0, row.y, width, row.h);
    g.strokeStyle = "rgba(43, 228, 255, 0.35)";
    g.lineWidth = 1;
    g.strokeRect(0.5, row.y + 0.5, width - 1, row.h - 1);
    g.fillStyle = this.signColor(row);
    g.fillRect(3, row.y + 3, SIGN_CHIP, SIGN_CHIP);
    drawText(g, row.sign, 3 + SIGN_CHIP / 2, row.y + 3 + SIGN_CHIP / 2, { size: 10, color: "#0a0a1a", align: "center", baseline: "middle", shadow: false });
    row.lines.forEach((line, i) => drawText(g, line, 3 + SIGN_CHIP + 5, row.y + 3 + i * SMALL_LINE + SMALL_LINE / 2, { size: SMALL_SIZE, baseline: "middle" }));
  }

  /** Fade + arrow at the clipped edges of a scrollable panel. */
  private drawScrollHints(g: CanvasRenderingContext2D, x: number, y: number, layout: StatDetailLayout) {
    const max = Math.max(0, layout.height - DETAIL_CONTENT.h);
    if (max <= 0) return;
    const left = x + DETAIL_CONTENT.x;
    const top = y + DETAIL_CONTENT.y;
    if (this.scroll < max) {
      const bottom = top + DETAIL_CONTENT.h;
      const fade = g.createLinearGradient(0, bottom - 22, 0, bottom);
      fade.addColorStop(0, "rgba(16, 29, 61, 0)");
      fade.addColorStop(1, "rgba(16, 29, 61, 0.95)");
      g.fillStyle = fade;
      g.fillRect(left, bottom - 22, DETAIL_CONTENT.w, 22);
      drawText(g, "▼", left + DETAIL_CONTENT.w / 2, bottom - 7, { size: 10, color: TEXT_COLORS.gold, align: "center", baseline: "middle" });
    }
    if (this.scroll > 0) drawText(g, "▲", left + DETAIL_CONTENT.w / 2, top + 6, { size: 10, color: TEXT_COLORS.gold, align: "center", baseline: "middle" });
  }

  /** Fixed `능력치 ???` row: an empty dark track until the numbers are decided. */
  private drawAbilityRow(g: CanvasRenderingContext2D, x: number, y: number) {
    const rowY = y + ABILITY_ROW_Y;
    drawText(g, "능력치", x + DETAIL_CONTENT.x, rowY + 7, { size: CHIP_SIZE, color: "#9fe9ff", baseline: "middle" });
    const barX = x + DETAIL_CONTENT.x + 44;
    const barW = DETAIL_CONTENT.w - 44;
    g.fillStyle = "#0a0f26";
    g.fillRect(barX, rowY, barW, 14);
    g.strokeStyle = "rgba(43, 228, 255, 0.45)";
    g.lineWidth = 1;
    g.strokeRect(barX + 0.5, rowY + 0.5, barW - 1, 13);
    drawText(g, "???", barX + barW / 2, rowY + 7, { size: CHIP_SIZE, color: TEXT_COLORS.gold, align: "center", baseline: "middle" });
  }

}
