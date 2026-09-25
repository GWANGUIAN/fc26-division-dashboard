// `?pitchDebug=1` tools (docs/pitch/02 §8): hitboxes, goal plane, keeper reach, live tuning of the difficulty
// variables and the sweet spot, forced results, a Monte Carlo printout in the console. Nothing here runs unless the
// query is present, so a normal visit is unaffected (the query also works on a deployed build, so tuning can be
// checked where the game is actually played).
//
// Keys: B panel on/off · [ ] pick a value · - = change it · 1 GOAL 2 SAVE 3 POST 4 BAR 5 MISS force the next result
// (same key again = off) · T style Tier 0/1/2 · 0 Monte Carlo table in the console.

import type { KeeperState, SavePlan, StyleTier } from "../game/keeper";
import type { BallState } from "../game/ball";
import type { PlayerState } from "../game/player";
import type { ShotFlight } from "../game/shot";
import type { ShotOutcome } from "../game/match";
import { formatSaveTable, saveRateTable } from "../game/montecarlo";
import { GOAL_MOUTH, GOAL_SCREEN, clamp, goalScreenX, type KeeperTuning, type ShotTuning } from "../game/tuning";
import { drawText, TEXT_COLORS } from "../engine/text";
import { isKnownCharacterId } from "../data/characters";

export function pitchDebugEnabled(search: string = typeof window === "undefined" ? "" : window.location.search): boolean {
  return new URLSearchParams(search).get("pitchDebug") === "1";
}

/**
 * `?pitchFit=1` (docs/pitch/13 §4-2): skips the loading fade straight into the locker room with the cabinet inventory
 * already open, for fitting worn items. `&char=<characterId>` picks the character without saving it as the selected one.
 */
export interface PitchFitParams {
  characterId?: string;
}

export function pitchFitParams(search: string = typeof window === "undefined" ? "" : window.location.search): PitchFitParams | null {
  const params = new URLSearchParams(search);
  if (!params.has("pitchFit") || params.get("pitchFit") === "0") return null;
  const id = params.get("char");
  return id && isKnownCharacterId(id) ? { characterId: id } : {};
}

interface DebugParam {
  label: string;
  get(): number;
  set(v: number): void;
  step: number;
  min: number;
  max: number;
  digits: number;
}

const FORCE_KEYS: Readonly<Record<string, ShotOutcome>> = { Digit1: "GOAL", Digit2: "SAVE", Digit3: "POST", Digit4: "BAR", Digit5: "MISS" };

export interface DebugFrame {
  player: PlayerState;
  ball: BallState;
  keeper: KeeperState;
  flight: ShotFlight | null;
  plan: SavePlan | null;
}

export class PitchDebug {
  panel = true;
  forced: ShotOutcome | null = null;
  tier: StyleTier = 0;
  private selected = 0;
  private readonly params: DebugParam[];

  constructor(
    private readonly shot: ShotTuning,
    private readonly keeper: KeeperTuning,
  ) {
    const k = keeper;
    const s = shot;
    this.params = [
      { label: "react", get: () => k.react, set: (v) => (k.react = v), step: 0.01, min: 0, max: 0.6, digits: 2 },
      { label: "diveSpeed", get: () => k.diveSpeed, set: (v) => (k.diveSpeed = v), step: 10, min: 100, max: 1200, digits: 0 },
      { label: "maxReach", get: () => k.maxReach, set: (v) => (k.maxReach = v), step: 2, min: 20, max: 260, digits: 0 },
      { label: "predErr", get: () => k.predErr, set: (v) => (k.predErr = v), step: 0.01, min: 0, max: 0.6, digits: 2 },
      { label: "bodyReach", get: () => k.bodyReach, set: (v) => (k.bodyReach = v), step: 1, min: 0, max: 80, digits: 1 },
      { label: "reachSpread", get: () => k.reachSpread, set: (v) => (k.reachSpread = v), step: 0.01, min: 0, max: 0.6, digits: 2 },
      { label: "sweetMin", get: () => s.sweetMin, set: (v) => (s.sweetMin = Math.min(v, s.sweetMax - 1)), step: 1, min: 40, max: 98, digits: 0 },
      { label: "sweetMax", get: () => s.sweetMax, set: (v) => (s.sweetMax = Math.max(v, s.sweetMin + 1)), step: 1, min: 45, max: 100, digits: 0 },
    ];
  }

  /** Returns true when the key was a debug key. */
  onKey(code: string): boolean {
    const forced = FORCE_KEYS[code];
    if (forced) {
      this.forced = this.forced === forced ? null : forced;
      return true;
    }
    switch (code) {
      case "KeyB":
        this.panel = !this.panel;
        return true;
      case "KeyT":
        this.tier = ((this.tier + 1) % 3) as StyleTier;
        return true;
      case "BracketLeft":
        this.selected = (this.selected + this.params.length - 1) % this.params.length;
        return true;
      case "BracketRight":
        this.selected = (this.selected + 1) % this.params.length;
        return true;
      case "Minus":
      case "Equal": {
        const p = this.params[this.selected]!;
        const next = clamp(p.get() + (code === "Equal" ? p.step : -p.step), p.min, p.max);
        p.set(Number(next.toFixed(3)));
        return true;
      }
      case "Digit0":
        this.printMonteCarlo();
        return true;
      default:
        return false;
    }
  }

  printMonteCarlo() {
    const lines: string[] = [];
    for (const tier of [0, 1, 2] as const) {
      lines.push(`[pitch] Monte Carlo 선방률 % (괄호 = 목표) · Tier ${tier}`);
      lines.push(formatSaveTable(saveRateTable(20000, 20260925, tier, this.keeper, this.shot)));
    }
    console.info(lines.join("\n"));
  }

  draw(g: CanvasRenderingContext2D, f: DebugFrame) {
    g.save();
    this.drawGoalPlane(g);
    this.drawReach(g, f);
    this.drawHitboxes(g, f);
    if (this.panel) this.drawPanel(g, f);
    g.restore();
  }

  private drawGoalPlane(g: CanvasRenderingContext2D) {
    const half = (GOAL_MOUTH.width / 2) * GOAL_SCREEN.xScale;
    const top = GOAL_SCREEN.planeY - GOAL_MOUTH.height * GOAL_SCREEN.zScale;
    g.strokeStyle = "rgba(62, 230, 193, 0.9)";
    g.lineWidth = 1;
    g.strokeRect(480 - half + 0.5, top + 0.5, half * 2, GOAL_SCREEN.planeY - top);
    g.strokeStyle = "rgba(255, 210, 63, 0.9)";
    g.beginPath();
    g.moveTo(480 - half - 30, GOAL_SCREEN.planeY + 0.5);
    g.lineTo(480 + half + 30, GOAL_SCREEN.planeY + 0.5);
    g.stroke();
  }

  private drawReach(g: CanvasRenderingContext2D, f: DebugFrame) {
    const k = GOAL_SCREEN.xScale;
    const reach = (f.plan ? f.plan.reach : this.keeper.maxReach + this.keeper.bodyReach) * k;
    const cx = goalScreenX(f.plan ? f.plan.startX : f.keeper.x);
    g.strokeStyle = "rgba(255, 138, 61, 0.95)";
    g.lineWidth = 2;
    const y = GOAL_SCREEN.keeperY + 8;
    g.beginPath();
    g.moveTo(cx - reach, y);
    g.lineTo(cx + reach, y);
    g.moveTo(cx - reach, y - 4);
    g.lineTo(cx - reach, y + 4);
    g.moveTo(cx + reach, y - 4);
    g.lineTo(cx + reach, y + 4);
    g.stroke();
    if (f.plan) {
      g.fillStyle = f.plan.saved ? "rgba(62, 230, 193, 0.9)" : "rgba(255, 77, 109, 0.9)";
      g.fillRect(Math.round(goalScreenX(f.plan.endX)) - 3, y - 3, 6, 6);
    }
  }

  private drawHitboxes(g: CanvasRenderingContext2D, f: DebugFrame) {
    g.lineWidth = 1;
    g.strokeStyle = "rgba(255, 255, 255, 0.8)";
    g.strokeRect(Math.round(f.player.x) - 11.5, Math.round(f.player.y) - 56.5, 23, 56);
    g.beginPath();
    g.arc(Math.round(f.ball.x), Math.round(f.ball.y), 20, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = "rgba(255, 138, 61, 0.9)";
    g.strokeRect(Math.round(goalScreenX(f.keeper.x)) - 12.5, GOAL_SCREEN.keeperY - 60.5, 25, 60);
    if (f.ball.z > 0) {
      g.strokeStyle = "rgba(255, 210, 63, 0.9)";
      g.beginPath();
      g.moveTo(Math.round(f.ball.x) + 0.5, Math.round(f.ball.y));
      g.lineTo(Math.round(f.ball.x) + 0.5, Math.round(f.ball.y - f.ball.z));
      g.stroke();
    }
  }

  private drawPanel(g: CanvasRenderingContext2D, f: DebugFrame) {
    const lines: string[] = ["PITCH DEBUG  (B 패널)", `[ ] 선택  - = 조절   Tier ${this.tier} (T)   강제 ${this.forced ?? "-"} (1~5)   0 = Monte Carlo`];
    this.params.forEach((p, i) => lines.push(`${i === this.selected ? ">" : " "} ${p.label.padEnd(11)} ${p.get().toFixed(p.digits)}`));
    if (f.flight) {
      lines.push(`shot p=${f.flight.power.toFixed(0)}${f.flight.sweet ? "*" : ""} tx=${f.flight.tx.toFixed(0)} (aim ${f.flight.aimTx.toFixed(0)}, σ ${f.flight.sigma.toFixed(0)}) h=${f.flight.h.toFixed(0)}`);
      lines.push(`T=${f.flight.time.toFixed(2)}s ${f.flight.kind}` + (f.plan ? `  keeper ${f.plan.saved ? "SAVE " + (f.plan.kind ?? "") : "beaten"} reach ${f.plan.reach.toFixed(0)} react ${f.plan.reactDelay.toFixed(2)}` : ""));
    }
    const x = 16;
    const y = 132;
    const w = 420;
    g.fillStyle = "rgba(10, 10, 26, 0.82)";
    g.fillRect(x, y, w, lines.length * 13 + 8);
    lines.forEach((line, i) => drawText(g, line, x + 6, y + 6 + i * 13, { size: 10, color: i === 0 ? TEXT_COLORS.gold : TEXT_COLORS.base, baseline: "top", shadow: false }));
  }
}
