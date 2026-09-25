// Loading screen (docs/pitch/03 §1), drawn with shapes + text until the real art exists (A1).
// Loads the `core` group, shows the bar for at least 600ms, then fades into the pitch.

import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from "../engine/stage";
import type { PointerInput, Scene, SceneCtx } from "../engine/sceneManager";
import { drawStripFrame } from "../engine/sprite";
import { drawText, TEXT_COLORS } from "../engine/text";
import { getCharacter, resolveStoredCharacter } from "../data/characters";
import { LockerScene } from "./LockerScene";
import { pitchFitParams } from "./pitchDebug";
import { PitchScene } from "./PitchScene";

export const MIN_LOADING_MS = 600;
export const SLOW_LOADING_SECONDS = 8;
/** Share of the bar taken by the  group; the character group (atlas + portraits) takes the rest. */
const CORE_WEIGHT = 0.8;

/** Top edge of the title logo (480×160 at 1:1), above the stadium mouth of the key art. */
const TITLE_LOGO_Y = 40;
const BAR = { x: 240, y: 424, w: 480, h: 20 } as const;
const SLOW_LINK = { x: 340, y: 510, w: 280, h: 22 } as const;

function inside(rect: { x: number; y: number; w: number; h: number }, x: number, y: number) {
  return x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;
}

export class LoadingScene implements Scene {
  private ctx?: SceneCtx;
  private elapsed = 0;
  /** Real load progress, 0..1. */
  private target = 0;
  /** What the bar shows: never ahead of the real progress, never ahead of the 600ms floor. */
  private shown = 0;
  private done = false;
  private leaving = false;
  private linkHover = false;

  enter(ctx: SceneCtx) {
    this.ctx = ctx;
    ctx.host.audio?.playBgm("loading");
    // `core` does not contain the selected character's atlas: load its group alongside so the pitch opens with the real sprite.
    // (an id the registry does not know is corrected to the default here, before any group is chosen)
    const fit = pitchFitParams();
    const characterGroup = `char:${fit?.characterId ?? resolveStoredCharacter().id}` as const;
    const progress = { core: 0, character: 0 };
    const report = () => (this.target = progress.core * CORE_WEIGHT + progress.character * (1 - CORE_WEIGHT));
    void Promise.all([
      ctx.host.assets.loadGroup("core", { minMs: MIN_LOADING_MS, onProgress: (value) => ((progress.core = value), report()) }),
      ctx.host.assets.loadGroup(characterGroup, { minMs: MIN_LOADING_MS, onProgress: (value) => ((progress.character = value), report()) }),
    ])
      .then(() => {
        this.target = 1;
        this.done = true;
      });
  }

  exit() {
    this.ctx?.host.setCursor("default");
  }

  update(dt: number) {
    this.elapsed += dt;
    const ceiling = Math.min(this.target, this.elapsed / (MIN_LOADING_MS / 1000));
    this.shown = Math.max(this.shown, Math.min(1, ceiling));
    if (this.done && this.shown >= 1 && !this.leaving && this.ctx) {
      this.leaving = true;
      this.ctx.host.audio?.playSfx("load-complete");
      const fit = pitchFitParams();
      if (fit) {
        // item fitting tool: locker room with the inventory open
        const character = fit.characterId ? getCharacter(fit.characterId) : undefined;
        this.ctx.manager.replace(new LockerScene({ createPitch: () => new PitchScene(), character, openInventory: true }), undefined, { transition: "fade" });
      } else this.ctx.manager.replace(new PitchScene(), undefined, { transition: "fade" });
    }
  }

  onPointer(e: PointerInput) {
    if (!this.slow) return;
    const hover = inside(SLOW_LINK, e.x, e.y);
    if (hover !== this.linkHover) {
      this.linkHover = hover;
      this.ctx?.host.setCursor(hover ? "pointer" : "default");
    }
    if (e.type === "down" && hover) this.ctx?.host.goDashboard();
  }

  onKey(e: { code: string }) {
    if (this.slow && e.code === "Enter") this.ctx?.host.goDashboard();
  }

  private get slow() {
    return !this.done && this.elapsed > SLOW_LOADING_SECONDS;
  }

  render(g: CanvasRenderingContext2D) {
    const cx = LOGICAL_WIDTH / 2;
    const bg = this.ctx?.host.assets.get("keyart/loading-bg");
    if (bg) {
      g.drawImage(bg, 0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    } else {
      g.fillStyle = "#0a0f24";
      g.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
      // floodlit-pitch backdrop stripes
      g.fillStyle = "#0e1a2e";
      for (let i = 0; i < 6; i++) g.fillRect(0, 300 + i * 48, LOGICAL_WIDTH, 24);
    }

    // title: the logo image when it exists (ui/title-logo, docs/pitch/12), otherwise plain canvas text
    const logo = this.ctx?.host.assets.get("ui/title-logo");
    if (logo) g.drawImage(logo, Math.round(cx - logo.width / 2), TITLE_LOGO_Y, logo.width, logo.height);
    else drawText(g, "잔디동 PITCH", cx, 120, { size: 32, color: TEXT_COLORS.gold, align: "center", baseline: "middle" });
    this.renderBall(g, 464 + 16, 380 + 16);
    this.renderBar(g);
    drawText(g, `${Math.round(this.shown * 100)}%`, BAR.x + BAR.w + 12, BAR.y + BAR.h / 2, { size: 12, baseline: "middle" });

    if (this.slow) {
      drawText(g, "대시보드로 바로 가기", cx, SLOW_LINK.y + SLOW_LINK.h / 2, {
        size: 12,
        color: this.linkHover ? TEXT_COLORS.gold : "#9fe9ff",
        align: "center",
        baseline: "middle",
      });
    }
  }

  /**
   * Progress bar drawn with rectangles on the pixel grid (the generated bar art was stretched out of proportion):
   * navy outline, mint trim, dark trough, and a mint fill in 4px steps with a lit top row and moving diagonal stripes.
   */
  private renderBar(g: CanvasRenderingContext2D) {
    const { x, y, w, h } = BAR;
    g.fillStyle = "#0a0a1a";
    g.fillRect(x - 2, y - 2, w + 4, h + 4);
    g.fillStyle = "#3ee6c1";
    g.fillRect(x, y, w, h);
    g.fillStyle = "#0e1a36";
    g.fillRect(x + 2, y + 2, w - 4, h - 4);

    const ix = x + 4;
    const iy = y + 4;
    const iw = w - 8;
    const ih = h - 8;
    const filled = Math.round((iw * this.shown) / 4) * 4;
    if (filled <= 0) return;
    g.fillStyle = "#2ee8b6";
    g.fillRect(ix, iy, filled, ih);
    // moving diagonal stripes (darker mint), clipped to the fill
    g.save();
    g.beginPath();
    g.rect(ix, iy, filled, ih);
    g.clip();
    g.fillStyle = "#1fbf94";
    const shift = Math.floor(this.elapsed * 24) % 16;
    for (let row = 0; row < ih; row += 2) {
      for (let sx = -16 + shift - row; sx < filled; sx += 16) g.fillRect(ix + sx, iy + row, 6, 2);
    }
    g.restore();
    g.fillStyle = "#b8ffec"; // lit top edge
    g.fillRect(ix, iy, filled, 2);
    g.fillStyle = "#12806a"; // shaded bottom edge
    g.fillRect(ix, iy + ih - 2, filled, 2);
  }

  /** The 8-frame rolling ball (12fps) from `ui/loader-ball`, or a 32×32 drawn placeholder. */
  private renderBall(g: CanvasRenderingContext2D, cx: number, cy: number) {
    const step = Math.floor(this.elapsed * 12) % 8;
    const art = this.ctx?.host.assets.get("ui/loader-ball");
    if (art) {
      drawStripFrame(g, art, 8, step, cx, cy + 16);
      return;
    }
    g.save();
    g.translate(cx, cy);
    g.rotate((step / 8) * Math.PI * 2);
    g.fillStyle = "#f7f7ff";
    g.beginPath();
    g.arc(0, 0, 14, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#0a0a1a";
    g.fillRect(-4, -4, 8, 8);
    g.fillRect(-2, -13, 4, 5);
    g.restore();
  }
}
