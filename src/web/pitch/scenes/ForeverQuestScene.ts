// Quest scroll of Jandi Forever (docs/forever/02 §5): a parchment overlay pushed on top of the hub map. The map below keeps
// drawing but stops updating, so the player cannot walk while it is open. E / Enter confirms, Esc closes.

import type { AssetImage } from "../engine/assets";
import type { KeyInput, Scene, SceneCtx } from "../engine/sceneManager";
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from "../engine/stage";
import { drawText } from "../engine/text";

export type QuestPopupMode = "offer" | "turnin" | "info" | "menu";

export interface QuestPopupParams {
  mode: QuestPopupMode;
  title: string;
  body: string;
  /** Reward line, e.g. `경험치 100` (empty = none shown). */
  reward?: string;
  /** Runs after the popup closed through E / Enter. Never called for `info`, nor for Esc. */
  onConfirm?(): void;
  /** `menu` only: the numbered choices (keys 1..n); each closes the popup and then runs. */
  options?: ReadonlyArray<{ label: string; onPick(): void }>;
}

const CONFIRM_KEYS: ReadonlySet<string> = new Set(["KeyE", "Enter", "NumpadEnter"]);
const SCROLL = { w: 360, h: 240 } as const;
/** Parchment ink on the light middle of the scroll. */
const INK = "#3a2410";
const INK_GOLD = "#8a4b00";
const CONFIRM_LABEL: Readonly<Record<QuestPopupMode, string>> = { offer: "E 수락", turnin: "E 완료", info: "", menu: "" };

/** Greedy wrap: breaks at spaces where it can and inside a word when a single word is wider than the line. */
export function wrapLines(measure: (text: string) => number, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const candidate = line ? `${line} ${word}` : word;
    if (measure(candidate) <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = "";
    for (const ch of word) {
      if (line && measure(line + ch) > maxWidth) {
        lines.push(line);
        line = ch;
      } else line += ch;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export class QuestPopupScene implements Scene {
  private ctx?: SceneCtx;
  private readonly params: QuestPopupParams;
  private clock = 0;

  constructor(params: QuestPopupParams) {
    this.params = params;
  }

  enter(ctx: SceneCtx) {
    this.ctx = ctx;
    ctx.host.audio?.playSfx("forever-popup-open");
  }

  update(dt: number) {
    this.clock += dt;
  }

  private close() {
    this.ctx?.manager.pop();
  }

  onKey(e: KeyInput) {
    if (e.code === "Escape") {
      this.close();
      return;
    }
    if (this.params.mode === "menu") {
      const pick = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);
      const option = pick ? this.params.options?.[Number(pick[1]) - 1] : undefined;
      if (option) {
        this.close();
        option.onPick();
      }
      return;
    }
    if (!CONFIRM_KEYS.has(e.code)) return;
    if (this.params.mode === "info") {
      this.close();
      return;
    }
    this.close();
    this.params.onConfirm?.();
  }

  render(g: CanvasRenderingContext2D) {
    g.fillStyle = "rgba(5, 6, 15, 0.55)";
    g.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    const left = Math.round((LOGICAL_WIDTH - SCROLL.w) / 2);
    const top = Math.round((LOGICAL_HEIGHT - SCROLL.h) / 2) - 16;
    const scroll = this.ctx?.host.assets.get("ui/forever-quest-scroll") as AssetImage | undefined;
    if (scroll) g.drawImage(scroll, left, top, SCROLL.w, SCROLL.h);
    else {
      g.fillStyle = "#0a0a1a";
      g.fillRect(left - 2, top - 2, SCROLL.w + 4, SCROLL.h + 4);
      g.fillStyle = "#e8d3a0";
      g.fillRect(left, top, SCROLL.w, SCROLL.h);
    }
    const cx = left + SCROLL.w / 2;
    // the readable parchment sits inside the rollers: roughly x 56..304, y 52..190 of the 360×240 art
    const textLeft = left + 62;
    const textWidth = SCROLL.w - 124;
    drawText(g, this.params.title, cx, top + 68, { size: 14, color: INK_GOLD, align: "center", baseline: "middle", shadow: false });
    g.font = "11px Galmuri11, monospace";
    const { mode, options = [] } = this.params;
    const lines = mode === "menu" ? options.map((option, index) => `${index + 1}. ${option.label}`) : wrapLines((text) => g.measureText(text).width, this.params.body, textWidth).slice(0, 5);
    lines.forEach((line, index) => drawText(g, line, textLeft, top + 92 + index * 15, { size: 11, color: INK, baseline: "middle", shadow: false }));
    if (this.params.reward) drawText(g, `보상: ${this.params.reward}`, cx, top + 178, { size: 11, color: INK_GOLD, align: "center", baseline: "middle", shadow: false });
    const label = CONFIRM_LABEL[this.params.mode];
    const hint = this.params.mode === "menu" ? "번호 선택 · Esc 닫기" : label ? `${label} · Esc 닫기` : "E / Esc 닫기";
    drawText(g, hint, cx, top + SCROLL.h + 14 + Math.round(Math.sin(this.clock * 4)), { size: 12, color: "#ffd23f", align: "center", baseline: "middle" });
  }
}
