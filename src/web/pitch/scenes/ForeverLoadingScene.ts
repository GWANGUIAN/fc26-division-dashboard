// Jandi Forever loading screen (docs/forever/02 §1): a progress bar and rotating tips while the `forever` group loads.
// The bar stays up for at least FOREVER_MIN_LOADING_MS so the tip can be read; missing art never blocks it (shapes only).

import type { Scene, SceneCtx } from "../engine/sceneManager";
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from "../engine/stage";
import { drawText, TEXT_COLORS } from "../engine/text";
import { ForeverScene } from "./ForeverScene";

export const FOREVER_MIN_LOADING_MS = 1800;
/** Seconds each tip stays on screen. */
export const FOREVER_TIP_SECONDS = 3;

/** Tip drafts of docs/forever/01 (dialogue drafts). */
export const FOREVER_TIPS: readonly string[] = [
  "팁: 탱커가 없으면 던전은 시작되지 않습니다. 수비수 구함.",
  "팁: 골키퍼는 힐러가 아닙니다. 그래도 힐러입니다.",
  "팁: 킬 스틸은 반칙입니다. 오프사이드도 반칙입니다.",
  "팁: 죽으면 영혼 상태로 시체를 찾아야 합니다. 볼은 찾지 않아도 됩니다.",
];

/** Top edge of the logo (480×160 at 1:1) in the quiet top-centre third of the loading art. */
const LOGO_Y = 40;
const BAR = { x: 240, y: 440, w: 480, h: 18 } as const;

export interface ForeverLoadingParams {
  /** Builds the pitch scene to return to (a factory so this file never imports `PitchScene`). */
  createPitch(): Scene;
  /** Index of the first tip (random when omitted). */
  startTip?: number;
}

export class ForeverLoadingScene implements Scene {
  private ctx?: SceneCtx;
  private readonly params: ForeverLoadingParams;
  private readonly firstTip: number;
  private elapsed = 0;
  /** Real load progress, 0..1. */
  private target = 0;
  /** What the bar shows: never ahead of the real progress nor of the minimum-time floor. */
  private shown = 0;
  private done = false;
  private leaving = false;

  constructor(params: ForeverLoadingParams) {
    this.params = params;
    this.firstTip = params.startTip ?? Math.floor(Math.random() * FOREVER_TIPS.length);
  }

  enter(ctx: SceneCtx) {
    this.ctx = ctx;
    ctx.host.audio?.playBgm("forever-loading");
    const finish = () => {
      this.target = 1;
      this.done = true;
    };
    void ctx.host.assets.loadGroup("forever", { minMs: FOREVER_MIN_LOADING_MS, onProgress: (value) => (this.target = value) }).then(finish, finish);
  }

  exit() {
    this.ctx?.host.setCursor("default");
  }

  /** The tip on screen now (rotates every FOREVER_TIP_SECONDS). */
  tip(): string {
    return FOREVER_TIPS[(this.firstTip + Math.floor(this.elapsed / FOREVER_TIP_SECONDS)) % FOREVER_TIPS.length]!;
  }

  /** 0..1 fill of the bar. */
  get progress() {
    return this.shown;
  }

  update(dt: number) {
    this.elapsed += dt;
    const ceiling = Math.min(this.target, this.elapsed / (FOREVER_MIN_LOADING_MS / 1000));
    this.shown = Math.max(this.shown, Math.min(1, ceiling));
    if (this.done && this.shown >= 1 && !this.leaving && this.ctx) {
      this.leaving = true;
      this.ctx.host.audio?.playSfx("load-complete");
      this.ctx.manager.replace(new ForeverScene({ createPitch: this.params.createPitch }), undefined, { transition: "fade" });
    }
  }

  render(g: CanvasRenderingContext2D) {
    const cx = LOGICAL_WIDTH / 2;
    // the art is in the `forever` group (usually already fetched by the pitch gate's preload); shapes and text stand in until it is
    const bg = this.ctx?.host.assets.get("env/forever-loading-bg");
    if (bg) g.drawImage(bg, 0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    else {
      g.fillStyle = "#0b1a10";
      g.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
      g.fillStyle = "#12291a";
      for (let i = 0; i < 6; i++) g.fillRect(0, 300 + i * 48, LOGICAL_WIDTH, 24);
    }
    const logo = this.ctx?.host.assets.get("ui/forever-logo");
    if (logo) g.drawImage(logo, Math.round(cx - logo.width / 2), LOGO_Y, logo.width, logo.height);
    else {
      drawText(g, "잔디 포에버", cx, 150, { size: 32, color: TEXT_COLORS.gold, align: "center", baseline: "middle" });
      drawText(g, "11월, 잔디는 영원하다.", cx, 190, { size: 12, align: "center", baseline: "middle" });
    }

    const { x, y, w, h } = BAR;
    g.fillStyle = "#0a0a1a";
    g.fillRect(x - 2, y - 2, w + 4, h + 4);
    g.fillStyle = "#3f7a1a";
    g.fillRect(x, y, w, h);
    g.fillStyle = "#0e1a10";
    g.fillRect(x + 2, y + 2, w - 4, h - 4);
    const filled = Math.round(((w - 8) * this.shown) / 4) * 4;
    if (filled > 0) {
      g.fillStyle = "#7bd63a";
      g.fillRect(x + 4, y + 4, filled, h - 8);
      g.fillStyle = "#d4ff9c";
      g.fillRect(x + 4, y + 4, filled, 2);
    }
    drawText(g, `${Math.round(this.shown * 100)}%`, x + w + 12, y + h / 2, { size: 12, baseline: "middle" });
    drawText(g, this.tip(), cx, y + 46, { size: 12, color: "#9fe9ff", align: "center", baseline: "middle" });
  }
}
