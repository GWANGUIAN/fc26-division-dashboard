// Shot HUD of the pitch (docs/pitch/03 §2-1·§2-2): aim bar, power bar, aim arrow + reticle, result banner and
// TOO FAR. Every image is optional; a missing one is drawn as a plain shape.

import type { AssetImage } from "../engine/assets";
import { drawStripFrame } from "../engine/sprite";
import { drawText, TEXT_COLORS } from "../engine/text";
import { aimForTx, aimRay, shotHeight, type ShotState } from "../game/shot";
import { RESULT_LABEL, type ShotResult } from "../game/match";
import { GOAL, GOAL_MOUTH, GOAL_SCREEN, MATCH, clamp, goalScreenX, type ShotTuning } from "../game/tuning";

export const AIM_BAR = { x: 320, y: 452, w: 320, h: 20 } as const;
export const POWER_BAR = { x: 320, y: 486, w: 320, h: 28 } as const;
export const BANNER = { x: 240, y: 200, w: 480, h: 80 } as const;

type ImageOf = (key: string) => AssetImage | undefined;

const BANNER_COLORS = { GOAL: TEXT_COLORS.gold, SAVE: "#3ee6c1", POST: TEXT_COLORS.base, BAR: TEXT_COLORS.base, MISS: TEXT_COLORS.coral } as const;
const BANNER_ART = { GOAL: "goal", SAVE: "save", POST: "post", BAR: "post", MISS: "miss" } as const;
const DETAIL_LABEL: Readonly<Record<string, string>> = {
  WIDE: "빗나감",
  OVER: "크로스바 위로",
  CATCH: "캐치",
  PUNCH: "펀칭",
  DEFLECT: "손끝 선방",
};

function plate(g: CanvasRenderingContext2D, image: AssetImage | undefined, r: { x: number; y: number; w: number; h: number }, fill: string) {
  if (image) {
    g.drawImage(image, r.x, r.y, r.w, r.h);
    return;
  }
  g.fillStyle = "#0a0a1a";
  g.fillRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4);
  g.fillStyle = fill;
  g.fillRect(r.x, r.y, r.w, r.h);
}

/** x position on the aim bar for a sweep value. */
export function aimBarX(aim: number) {
  return AIM_BAR.x + ((clamp(aim, -1, 1) + 1) / 2) * AIM_BAR.w;
}

export function drawAimBar(g: CanvasRenderingContext2D, image: ImageOf, shot: ShotState, ballX: number, ballY: number, tuning: ShotTuning) {
  plate(g, image("ui/aim-bar"), AIM_BAR, "#152640");
  // the two posts, so the player can see how much of the sweep is inside the goal
  const half = GOAL_MOUTH.width / 2;
  g.fillStyle = TEXT_COLORS.gold;
  for (const sign of [-1, 1]) {
    const x = Math.round(aimBarX(aimForTx(ballX, ballY, sign * half, tuning)));
    g.fillRect(x - 1, AIM_BAR.y + 2, 2, AIM_BAR.h - 4);
  }
  const cursor = image("ui/aim-cursor");
  const cx = Math.round(aimBarX(shot.aim));
  const cy = AIM_BAR.y + AIM_BAR.h / 2;
  if (cursor) g.drawImage(cursor, cx - 8, Math.round(cy - 8));
  else {
    g.fillStyle = "#3ee6c1";
    g.beginPath();
    g.moveTo(cx, cy - 8);
    g.lineTo(cx + 7, cy);
    g.lineTo(cx, cy + 8);
    g.lineTo(cx - 7, cy);
    g.closePath();
    g.fill();
  }
}

export function drawPowerBar(g: CanvasRenderingContext2D, image: ImageOf, shot: ShotState, tuning: ShotTuning) {
  const bar = POWER_BAR;
  plate(g, image("ui/power-bar"), bar, "#152640");
  const inset = { x: 6, y: 5 };
  const innerW = bar.w - inset.x * 2;
  const innerH = bar.h - inset.y * 2;
  const ix = bar.x + inset.x;
  const iy = bar.y + inset.y;
  // sweet-spot bracket
  const sx = ix + (tuning.sweetMin / 100) * innerW;
  const sw = ((tuning.sweetMax - tuning.sweetMin) / 100) * innerW;
  g.fillStyle = "rgba(255, 210, 63, 0.28)";
  g.fillRect(Math.round(sx), iy, Math.round(sw), innerH);
  // fill: green below the sweet spot, gold inside it, red above
  const p = clamp(shot.power, 0, 100);
  const fillW = Math.round((p / 100) * innerW);
  const key = p > tuning.sweetMax ? "ui/fill-red" : p >= tuning.sweetMin ? "ui/fill-gold" : "ui/fill-green";
  const tile = image(key);
  if (fillW > 0) {
    if (tile) g.drawImage(tile, ix, iy, fillW, innerH);
    else {
      g.fillStyle = p > tuning.sweetMax ? "#ff4d6d" : p >= tuning.sweetMin ? TEXT_COLORS.gold : "#3ee68a";
      g.fillRect(ix, iy, fillW, innerH);
    }
  }
  g.strokeStyle = TEXT_COLORS.gold;
  g.lineWidth = 2;
  g.strokeRect(Math.round(sx) + 1, iy - 1, Math.round(sw) - 1, innerH + 2);
  drawText(g, "POWER", bar.x - 8, bar.y + bar.h / 2, { size: 10, align: "right", baseline: "middle" });
}

/** Aim arrow at the ball and the reticle on the goal plane (03 §2-2): the reticle rises with the power once the aim is locked. */
export function drawAimGuide(
  g: CanvasRenderingContext2D,
  image: ImageOf,
  shot: ShotState,
  ball: { x: number; y: number },
  tuning: ShotTuning,
  clock: number,
) {
  const { tx } = aimRay(ball.x, ball.y, shot.aim, tuning);
  const targetX = goalScreenX(GOAL.centerX + tx);
  const h = shot.phase === "power" ? shotHeight(shot.power, tuning) : GOAL_MOUTH.height * 0.5;
  const targetY = GOAL_SCREEN.planeY - h * GOAL_SCREEN.zScale;

  // dotted line from the ball to the reticle
  g.save();
  g.strokeStyle = "rgba(62, 230, 193, 0.4)";
  g.lineWidth = 2;
  g.setLineDash([4, 6]);
  g.beginPath();
  g.moveTo(Math.round(ball.x), Math.round(ball.y - 6));
  g.lineTo(Math.round(targetX), Math.round(GOAL_SCREEN.planeY));
  g.stroke();
  g.restore();

  const dx = targetX - ball.x;
  const dy = GOAL_SCREEN.planeY - ball.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  const angle = Math.atan2(dx, -dy);
  const baseX = ball.x + (dx / len) * 26;
  const baseY = ball.y - 6 + (dy / len) * 26;
  const arrow = image("fx/fx-aim-arrow");
  g.save();
  g.translate(Math.round(baseX), Math.round(baseY));
  g.rotate(angle);
  if (arrow) {
    const fw = arrow.width / 4;
    g.drawImage(arrow, Math.floor((clock * 8) % 4) * fw, 0, fw, arrow.height, -fw / 2, -arrow.height, fw, arrow.height);
  } else {
    g.fillStyle = "#3ee6c1";
    g.beginPath();
    g.moveTo(0, -26);
    g.lineTo(10, -6);
    g.lineTo(-10, -6);
    g.closePath();
    g.fill();
  }
  g.restore();

  const reticle = image("fx/fx-reticle");
  const locked = shot.phase === "power";
  const frame = locked ? 2 + (Math.floor(clock * 8) % 2) : Math.floor(clock * 4) % 2;
  if (reticle) {
    const size = reticle.height;
    g.drawImage(reticle, frame * (reticle.width / 4), 0, reticle.width / 4, size, Math.round(targetX - size / 2), Math.round(targetY - size / 2), size, size);
  } else {
    g.strokeStyle = locked ? TEXT_COLORS.gold : "#3ee6c1";
    g.lineWidth = 2;
    const r = 10 + (locked ? 0 : Math.round(Math.sin(clock * 8) * 2));
    g.strokeRect(Math.round(targetX) - r, Math.round(targetY) - r, r * 2, r * 2);
  }
}

/** GOAL / SAVE / POST / MISS banner for `age` seconds after the result. */
export function drawResultBanner(g: CanvasRenderingContext2D, image: ImageOf, result: ShotResult, age: number, sweetGoal: boolean) {
  if (age >= MATCH.bannerSeconds) return;
  const appear = clamp(age / 0.15, 0, 1);
  const fade = clamp((MATCH.bannerSeconds - age) / 0.25, 0, 1);
  const scale = 0.6 + 0.4 * appear;
  const cx = BANNER.x + BANNER.w / 2;
  const cy = BANNER.y + BANNER.h / 2;
  g.save();
  g.globalAlpha = Math.min(fade, appear);
  g.translate(cx, cy);
  g.scale(scale, scale);
  g.translate(-cx, -cy);
  plate(g, image(`ui/banner-${BANNER_ART[result.outcome]}`), BANNER, "#152640");
  const burst = image(`ui/burst-${BANNER_ART[result.outcome]}`);
  if (burst) g.drawImage(burst, BANNER.x - 20, cy - burst.height / 2);
  drawText(g, RESULT_LABEL[result.outcome], cx, cy + 2, { size: 32, color: BANNER_COLORS[result.outcome], align: "center", baseline: "middle" });
  const detail = result.detail ? DETAIL_LABEL[result.detail] : null;
  const sub = sweetGoal ? "SWEET SPOT!" : detail;
  if (sub) drawText(g, sub, cx, BANNER.y + BANNER.h + 14, { size: 12, color: sweetGoal ? TEXT_COLORS.gold : TEXT_COLORS.base, align: "center", baseline: "middle" });
  g.restore();
}

/** "TOO FAR" shaking above the player. */
export function drawTooFar(g: CanvasRenderingContext2D, x: number, y: number, age: number) {
  if (age >= MATCH.tooFarSeconds) return;
  const shake = Math.round(Math.sin(age * 60) * 3 * (1 - age / MATCH.tooFarSeconds));
  g.save();
  g.globalAlpha = clamp((MATCH.tooFarSeconds - age) / 0.2, 0, 1);
  drawText(g, "TOO FAR", x + shake, y - 92, { size: 16, color: TEXT_COLORS.coral, align: "center", baseline: "middle" });
  g.restore();
}

/** Golden ring around a sweet-spot ball. */
export function drawSweetRing(g: CanvasRenderingContext2D, image: ImageOf, x: number, y: number, clock: number) {
  const ring = image("env/ball-ring");
  if (ring) {
    g.drawImage(ring, Math.round(x - ring.width / 2), Math.round(y - ring.height / 2));
    return;
  }
  g.strokeStyle = TEXT_COLORS.gold;
  g.lineWidth = 2;
  g.beginPath();
  g.arc(Math.round(x), Math.round(y), 10 + Math.sin(clock * 20) * 1.5, 0, Math.PI * 2);
  g.stroke();
}

/** One net ripple frame over the goal (4 frames, 1200×74 strip). */
export function drawNetRipple(g: CanvasRenderingContext2D, image: ImageOf, age: number, x: number, y: number) {
  const ripple = image("env/goal-ripple");
  if (!ripple || age >= 0.5) return;
  const frames = 4;
  const frame = Math.min(frames - 1, Math.floor(age * 10));
  drawStripFrame(g, ripple, frames, frame, x + ripple.width / frames / 2, y + ripple.height, { alpha: 1 - age / 0.6 });
}
