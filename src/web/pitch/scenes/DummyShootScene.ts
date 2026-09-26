// Training-dummy shooting overlay (docs/forever/02 §11), pushed over the Forever map: stop the sweeping power meter with
// Space / E, watch the damage number fly. No attempt limit and no rewards: it never touches the Forever progress data.
// Esc leaves. The map below keeps drawing but stops updating.

import type { PitchSfxId } from "../audio/sfxMap";
import type { AssetImage } from "../engine/assets";
import type { KeyInput, Scene, SceneCtx } from "../engine/sceneManager";
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from "../engine/stage";
import { drawText, TEXT_COLORS } from "../engine/text";
import { DUMMY_SWEET, dummyHit, dummySpeed, meterPower, type DummyHit } from "../game/dummy";

const SHOOT_KEYS: ReadonlySet<string> = new Set(["Space", "KeyE", "Enter", "NumpadEnter"]);
/** After a shot the meter rests this long so the result can be read. */
export const DUMMY_REST_SECONDS = 0.6;
const FLOAT_SECONDS = 1.1;
const BAR = { x: 300, y: 452, w: 360, h: 22 } as const;

interface Floater {
  hit: DummyHit;
  age: number;
  dx: number;
}

export interface DummyShootParams {
  random?(): number;
}

export class DummyShootScene implements Scene {
  private ctx?: SceneCtx;
  private readonly random: () => number;
  private sweep = 0;
  private rest = 0;
  private shake = 0;
  private floaters: Floater[] = [];
  private lastHit: DummyHit | null = null;
  shots = 0;
  total = 0;
  best = 0;

  constructor(params: DummyShootParams = {}) {
    this.random = params.random ?? Math.random;
  }

  enter(ctx: SceneCtx) {
    this.ctx = ctx;
    ctx.host.audio?.playSfx("forever-popup-open");
  }

  /** Meter value now (0..100). */
  get power() {
    return meterPower(this.sweep);
  }

  /** How much faster than the first shot the meter runs now. */
  get speed() {
    return dummySpeed(this.shots);
  }

  get resting() {
    return this.rest > 0;
  }

  update(dt: number) {
    if (this.rest > 0) {
      this.rest = Math.max(0, this.rest - dt);
      if (this.rest === 0) this.sweep = 0;
    } else this.sweep += dt * this.speed;
    this.shake = Math.max(0, this.shake - dt);
    for (const floater of this.floaters) floater.age += dt;
    this.floaters = this.floaters.filter((floater) => floater.age < FLOAT_SECONDS);
  }

  /** Stops the meter where it is. Ignored while the last result is still resting. */
  shoot(): DummyHit | null {
    if (this.rest > 0) return null;
    const hit = dummyHit(this.power, this.random);
    this.shots += 1;
    this.total += hit.damage;
    this.best = Math.max(this.best, hit.damage);
    this.lastHit = hit;
    this.rest = DUMMY_REST_SECONDS; // the marker stays where the shot stopped until the rest is over
    if (hit.kind !== "miss") this.shake = 0.25;
    this.floaters.push({ hit, age: 0, dx: Math.round((this.random() - 0.5) * 60) });
    const audio = this.ctx?.host.audio;
    const sounds: PitchSfxId[] = hit.kind === "miss" ? [] : hit.kind === "crit" ? ["forever-dummy-hit", "forever-mob-defeat"] : ["forever-dummy-hit"];
    for (const id of sounds) audio?.playSfx(id);
    return hit;
  }

  onKey(e: KeyInput) {
    if (e.code === "Escape") this.ctx?.manager.pop();
    else if (SHOOT_KEYS.has(e.code)) this.shoot();
  }

  render(g: CanvasRenderingContext2D) {
    g.fillStyle = "rgba(5, 6, 15, 0.7)";
    g.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    drawText(g, "허수아비 슈팅", LOGICAL_WIDTH / 2, 44, { size: 18, color: TEXT_COLORS.gold, align: "center", baseline: "middle" });
    this.drawDummy(g);
    for (const floater of this.floaters) this.drawFloater(g, floater);
    this.drawMeter(g);
    drawText(g, `슛 ${this.shots}  ·  누적 ${this.total}  ·  최고 ${this.best}  ·  속도 x${this.speed.toFixed(1)}`, LOGICAL_WIDTH / 2, 500, { size: 12, align: "center", baseline: "middle" });
    drawText(g, "Space / E 슛  ·  Esc 나가기", LOGICAL_WIDTH / 2, 520, { size: 11, color: "#9fe9ff", align: "center", baseline: "middle" });
  }

  private drawDummy(g: CanvasRenderingContext2D) {
    const image = this.ctx?.host.assets.get("env/forever-prop-dummy") as AssetImage | undefined;
    const wobble = this.shake > 0 ? Math.round(Math.sin(this.shake * 60) * 6 * (this.shake / 0.25)) : 0;
    const cx = LOGICAL_WIDTH / 2 + wobble;
    if (image) g.drawImage(image, Math.round(cx - image.width), 120, image.width * 2, image.height * 2);
    else {
      g.fillStyle = "#0a0a1a";
      g.fillRect(cx - 34, 120, 68, 300);
      g.fillStyle = "#c9a45a";
      g.fillRect(cx - 30, 124, 60, 292);
    }
  }

  private drawFloater(g: CanvasRenderingContext2D, floater: Floater) {
    const t = floater.age / FLOAT_SECONDS;
    const { hit } = floater;
    g.save();
    g.globalAlpha = Math.max(0, Math.min(1, (1 - t) * 2));
    const x = LOGICAL_WIDTH / 2 + floater.dx;
    const y = 200 - Math.round(t * 60);
    if (hit.kind === "miss") drawText(g, "빗나감", x, y, { size: 18, color: "#9aa0ad", align: "center", baseline: "middle" });
    else drawText(g, hit.kind === "crit" ? `${hit.damage}!` : String(hit.damage), x, y, { size: hit.kind === "crit" ? 36 : 24, color: hit.kind === "crit" ? TEXT_COLORS.gold : "#ffffff", align: "center", baseline: "middle" });
    g.restore();
  }

  private drawMeter(g: CanvasRenderingContext2D) {
    const { x, y, w, h } = BAR;
    g.fillStyle = "#0a0a1a";
    g.fillRect(x - 3, y - 3, w + 6, h + 6);
    g.fillStyle = "#152640";
    g.fillRect(x, y, w, h);
    g.fillStyle = "#3f7a1a";
    g.fillRect(x + Math.round((w * DUMMY_SWEET.from) / 100), y, Math.round((w * (DUMMY_SWEET.to - DUMMY_SWEET.from)) / 100), h);
    const marker = x + Math.round((w * this.power) / 100);
    g.fillStyle = this.rest > 0 ? "#9aa0ad" : TEXT_COLORS.gold;
    g.fillRect(marker - 2, y - 6, 4, h + 12);
    const label = this.lastHit && this.rest > 0 ? (this.lastHit.kind === "crit" ? "크리티컬!" : this.lastHit.kind === "miss" ? "빗나감" : "명중") : "타이밍을 맞춰 슛";
    drawText(g, label, LOGICAL_WIDTH / 2, y - 18, { size: 12, align: "center", baseline: "middle" });
  }
}
