// Style HUD of the pitch (docs/pitch/03 §2-1): the vertical style meter with its tier marks and combo pips, the
// STYLE / PERFECT callout banner and the floating move label. Every image is optional; a missing one is a shape.

import type { AssetImage } from "../engine/assets";
import { drawText, TEXT_COLORS } from "../engine/text";
import { clamp01, easeOutBack, progress } from "../engine/tween";
import { JUICE, STYLE } from "../game/tuning";

type ImageOf = (key: string) => AssetImage | undefined;

export const STYLE_METER = { x: 916, y: 200, w: 24, h: 160 } as const;
/** The bar's inside within the frame art (the frame has caps at both ends). */
const INNER = { left: 6, right: 6, top: 10, bottom: 10 } as const;
export const CALLOUT = { x: 300, y: 150, w: 360, h: 60 } as const;

export type CalloutKind = "STYLE" | "PERFECT";

const CALLOUT_ART: Readonly<Record<CalloutKind, string>> = { STYLE: "ui/banner-style", PERFECT: "ui/banner-perfect" };
const CALLOUT_COLOR: Readonly<Record<CalloutKind, string>> = { STYLE: "#3ee6c1", PERFECT: TEXT_COLORS.gold };

/** Rectangle of the fill inside the meter frame for a gauge value 0..100 (top edge moves with the value). */
export function styleFillRect(style: number) {
  const { x, y, w, h } = STYLE_METER;
  const innerX = x + INNER.left;
  const innerW = w - INNER.left - INNER.right;
  const innerTop = y + INNER.top;
  const innerH = h - INNER.top - INNER.bottom;
  const fillH = Math.round((clamp01(style / STYLE.max)) * innerH);
  return { x: innerX, y: innerTop + innerH - fillH, w: innerW, h: fillH, bottom: innerTop + innerH, innerTop, innerH };
}

/** Y of a tier mark on the meter. */
export function tierMarkY(threshold: number) {
  const { bottom, innerH } = styleFillRect(0);
  return bottom - Math.round((threshold / STYLE.max) * innerH);
}

export function drawStyleMeter(g: CanvasRenderingContext2D, image: ImageOf, style: number, combo: number, tier: 0 | 1 | 2, clock: number) {
  const { x, y, w, h } = STYLE_METER;
  drawText(g, "STYLE", x + w / 2, y - 8, { size: 10, color: tier > 0 ? TEXT_COLORS.gold : TEXT_COLORS.base, align: "center", baseline: "middle" });

  const frame = image("ui/style-frame");
  if (frame) g.drawImage(frame, x, y);
  else {
    g.fillStyle = "#0a0a1a";
    g.fillRect(x - 2, y - 2, w + 4, h + 4);
    g.fillStyle = "#152640";
    g.fillRect(x, y, w, h);
  }

  const fill = styleFillRect(style);
  if (fill.h > 0) {
    g.save();
    g.beginPath();
    g.rect(fill.x, fill.y, fill.w, fill.h);
    g.clip();
    const tile = image("ui/style-fill");
    if (tile) {
      // stack the 24×16 tile upward from the bottom of the bar, centred so the frame's side caps are covered
      for (let ty = fill.bottom - tile.height; ty > fill.y - tile.height; ty -= tile.height) g.drawImage(tile, x + (w - tile.width) / 2, ty);
    } else {
      g.fillStyle = tier === 2 ? TEXT_COLORS.coral : tier === 1 ? TEXT_COLORS.gold : "#3ee6c1";
      g.fillRect(fill.x, fill.y, fill.w, fill.h);
    }
    g.restore();
    if (tier === 2) {
      // Tier 2 pulses
      g.save();
      g.globalAlpha = 0.25 + 0.2 * Math.sin(clock * 10);
      g.fillStyle = "#ffffff";
      g.fillRect(fill.x, fill.y, fill.w, fill.h);
      g.restore();
    }
  }

  // tier marks (50 / 80)
  g.fillStyle = TEXT_COLORS.base;
  for (const threshold of [STYLE.tier1, STYLE.tier2]) {
    const my = tierMarkY(threshold);
    g.fillRect(x + INNER.left - 3, my, 3, 1);
    g.fillRect(x + w - INNER.right, my, 3, 1);
  }

  // combo pips, stacked bottom-up on the left of the bar
  const pipX = x - 16;
  for (let i = 0; i < STYLE.pips; i++) {
    const py = y + h - 12 - i * 14;
    const lit = i < combo;
    const pip = image(lit ? "ui/pip-lit" : "ui/pip-unlit");
    if (pip) g.drawImage(pip, pipX, py);
    else {
      g.fillStyle = lit ? TEXT_COLORS.gold : "#152640";
      g.fillRect(pipX, py, 10, 10);
    }
  }

  if (tier > 0) drawText(g, `TIER ${tier}`, x + w / 2, y + h + 10, { size: 10, color: tier === 2 ? TEXT_COLORS.coral : TEXT_COLORS.gold, align: "center", baseline: "middle" });
}

/** STYLE! / PERFECT! banner `age` seconds after it appeared. */
export function drawCallout(g: CanvasRenderingContext2D, image: ImageOf, kind: CalloutKind, age: number) {
  if (age >= JUICE.calloutSeconds) return;
  const appear = progress(age, 0.18);
  const fade = clamp01((JUICE.calloutSeconds - age) / 0.25);
  const scale = 0.5 + 0.5 * easeOutBack(appear);
  const cx = CALLOUT.x + CALLOUT.w / 2;
  const cy = CALLOUT.y + CALLOUT.h / 2;
  g.save();
  g.globalAlpha = Math.min(fade, appear);
  g.translate(cx, cy);
  g.scale(scale, scale);
  g.translate(-cx, -cy);
  const art = image(CALLOUT_ART[kind]);
  if (art) g.drawImage(art, CALLOUT.x, CALLOUT.y, CALLOUT.w, CALLOUT.h);
  else {
    g.fillStyle = "#0a0a1a";
    g.fillRect(CALLOUT.x - 2, CALLOUT.y - 2, CALLOUT.w + 4, CALLOUT.h + 4);
    g.fillStyle = "#152640";
    g.fillRect(CALLOUT.x, CALLOUT.y, CALLOUT.w, CALLOUT.h);
  }
  drawText(g, `${kind}!`, cx, cy + 2, { size: 24, color: CALLOUT_COLOR[kind], align: "center", baseline: "middle" });
  g.restore();
}

/** Small text that rises from above the player and fades: the move name and its style gain. */
export function drawSkillLabel(g: CanvasRenderingContext2D, text: string, x: number, y: number, age: number, color: string) {
  if (age >= JUICE.skillLabelSeconds) return;
  const t = age / JUICE.skillLabelSeconds;
  g.save();
  g.globalAlpha = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;
  drawText(g, text, x, y - 96 - Math.round(t * 16), { size: 12, color, align: "center", baseline: "middle" });
  g.restore();
}
