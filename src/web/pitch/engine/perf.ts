// Frame-time meter for `?pitchDebug=1` (docs/pitch/01 §7, P7). Nothing here is created unless the query is
// present. It keeps a fixed ring of recent frames (no allocation per frame), wraps `drawImage` on the context
// to count draw calls, and draws a small overlay plus a console line every few seconds.

import { drawText, TEXT_COLORS } from "./text";

/** Frame budget from 01 §7: update + render should stay under this on a mid-range laptop. */
export const FRAME_BUDGET_MS = 4;
const RING = 120;

export interface PerfSummary {
  frames: number;
  avgMs: number;
  p95Ms: number;
  maxMs: number;
  avgUpdateMs: number;
  avgRenderMs: number;
  avgDraws: number;
  maxDraws: number;
  /** Frames (of the ring) over `FRAME_BUDGET_MS`. */
  overBudget: number;
}

export class FramePerf {
  private readonly update = new Float32Array(RING);
  private readonly render = new Float32Array(RING);
  private readonly draws = new Uint16Array(RING);
  private readonly sorted = new Float32Array(RING);
  private count = 0;
  private head = 0;
  private pendingUpdate = 0;
  private drawCount = 0;

  /** Called once per `update` step (there can be 0, 1 or several between two renders). */
  addUpdate(ms: number) {
    this.pendingUpdate += ms;
  }

  /** `drawImage` calls since the last `endFrame`. */
  countDraw() {
    this.drawCount++;
  }

  /** Called after each render with that render's duration; closes the frame. */
  endFrame(renderMs: number) {
    this.update[this.head] = this.pendingUpdate;
    this.render[this.head] = renderMs;
    this.draws[this.head] = Math.min(65535, this.drawCount);
    this.head = (this.head + 1) % RING;
    if (this.count < RING) this.count++;
    this.pendingUpdate = 0;
    this.drawCount = 0;
  }

  summary(): PerfSummary {
    const n = this.count;
    if (n === 0) return { frames: 0, avgMs: 0, p95Ms: 0, maxMs: 0, avgUpdateMs: 0, avgRenderMs: 0, avgDraws: 0, maxDraws: 0, overBudget: 0 };
    let sumU = 0;
    let sumR = 0;
    let sumD = 0;
    let maxMs = 0;
    let maxDraws = 0;
    let over = 0;
    for (let i = 0; i < n; i++) {
      const total = this.update[i]! + this.render[i]!;
      this.sorted[i] = total;
      sumU += this.update[i]!;
      sumR += this.render[i]!;
      sumD += this.draws[i]!;
      if (total > maxMs) maxMs = total;
      if (this.draws[i]! > maxDraws) maxDraws = this.draws[i]!;
      if (total > FRAME_BUDGET_MS) over++;
    }
    const view = this.sorted.subarray(0, n);
    view.sort();
    return {
      frames: n,
      avgMs: (sumU + sumR) / n,
      p95Ms: view[Math.min(n - 1, Math.floor(n * 0.95))]!,
      maxMs,
      avgUpdateMs: sumU / n,
      avgRenderMs: sumR / n,
      avgDraws: sumD / n,
      maxDraws,
      overBudget: over,
    };
  }
}

/** Counts `drawImage` calls on `g` (instance-level wrap; the context is the stage's single long-lived one). */
export function countDrawImage(g: CanvasRenderingContext2D, perf: FramePerf): void {
  const original = g.drawImage.bind(g) as (...args: unknown[]) => void;
  (g as unknown as { drawImage: (...args: unknown[]) => void }).drawImage = (...args: unknown[]) => {
    perf.countDraw();
    original(...args);
  };
}

export function formatPerfLine(s: PerfSummary): string {
  return `[pitch] perf ${s.frames}f · avg ${s.avgMs.toFixed(2)}ms (update ${s.avgUpdateMs.toFixed(2)} + render ${s.avgRenderMs.toFixed(2)}) · p95 ${s.p95Ms.toFixed(2)} · max ${s.maxMs.toFixed(2)} · >${FRAME_BUDGET_MS}ms ${s.overBudget} · drawImage avg ${s.avgDraws.toFixed(0)} max ${s.maxDraws}`;
}

export function drawPerfOverlay(g: CanvasRenderingContext2D, s: PerfSummary): void {
  const bad = s.avgMs > FRAME_BUDGET_MS || s.maxDraws > 80;
  g.save();
  g.fillStyle = "rgba(10, 10, 26, 0.82)";
  g.fillRect(16, 104, 300, 24);
  const line = `${s.avgMs.toFixed(1)}ms p95 ${s.p95Ms.toFixed(1)} max ${s.maxMs.toFixed(1)} · draw ${s.avgDraws.toFixed(0)}/${s.maxDraws}`;
  drawText(g, line, 22, 110, { size: 10, color: bad ? TEXT_COLORS.gold : TEXT_COLORS.base, baseline: "top", shadow: false });
  g.restore();
}
