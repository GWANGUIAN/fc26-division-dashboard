// The letter of the mailbox (docs/forever/07 §1-3): a parchment overlay pushed on top of the map, like the quest scroll. The
// map below keeps drawing but stops updating, so the player cannot walk while it is open. E / Enter / Esc closes it.
// The smudged parts of the text (`~~~~`, `???`) are drawn as they are, in a lighter ink.

import type { AssetImage } from "../engine/assets";
import type { KeyInput, Scene, SceneCtx } from "../engine/sceneManager";
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from "../engine/stage";
import { drawText } from "../engine/text";
import { LETTER_LINES, LETTER_TITLE } from "../game/forever";

const CLOSE_KEYS: ReadonlySet<string> = new Set(["Escape", "KeyE", "Enter", "NumpadEnter"]);
const PAPER = { w: 400, h: 230 } as const;
/** Dark ink for the readable words, a faded one for the smudged parts. */
const INK = "#3a2410";
const INK_HIDDEN = "#b39866";
const INK_GOLD = "#8a4b00";
const LINE_HEIGHT = 14;

export class ForeverLetterScene implements Scene {
  private ctx?: SceneCtx;
  private clock = 0;

  enter(ctx: SceneCtx) {
    this.ctx = ctx;
    ctx.host.audio?.playSfx("forever-popup-open");
  }

  update(dt: number) {
    this.clock += dt;
  }

  onKey(e: KeyInput) {
    if (CLOSE_KEYS.has(e.code)) this.ctx?.manager.pop();
  }

  render(g: CanvasRenderingContext2D) {
    g.fillStyle = "rgba(5, 6, 15, 0.55)";
    g.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    const left = Math.round((LOGICAL_WIDTH - PAPER.w) / 2);
    const top = Math.round((LOGICAL_HEIGHT - PAPER.h) / 2) - 10;
    const image = (key: string) => this.ctx?.host.assets.get(key) as AssetImage | undefined;
    const paper = image("ui/forever-letter");
    if (paper) g.drawImage(paper, left, top, PAPER.w, PAPER.h);
    else {
      g.fillStyle = "#0a0a1a";
      g.fillRect(left - 2, top - 2, PAPER.w + 4, PAPER.h + 4);
      g.fillStyle = "#f0dca8";
      g.fillRect(left, top, PAPER.w, PAPER.h);
    }
    drawText(g, LETTER_TITLE, left + PAPER.w / 2, top + 38, { size: 14, color: INK_GOLD, align: "center", baseline: "middle", shadow: false });
    g.font = "11px Galmuri11, monospace";
    const textLeft = left + 44;
    LETTER_LINES.forEach((parts, row) => {
      let x = textLeft;
      const y = top + 54 + row * LINE_HEIGHT;
      for (const part of parts) {
        drawText(g, part.text, x, y, { size: 11, color: part.hidden ? INK_HIDDEN : INK, baseline: "middle", shadow: false });
        x += g.measureText(part.text).width;
      }
    });
    const seal = image("ui/forever-seal");
    if (seal) g.drawImage(seal, left + PAPER.w - 78, top + PAPER.h - 62);
    drawText(g, "E / Esc 닫기", LOGICAL_WIDTH / 2, top + PAPER.h + 14 + Math.round(Math.sin(this.clock * 4)), { size: 12, color: "#ffd23f", align: "center", baseline: "middle" });
  }
}
