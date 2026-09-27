import { useCallback, useEffect, useRef, type KeyboardEvent, type PointerEvent } from "react";
import {
  BOOT_RADIUS, CANVAS_HEIGHT, CANVAS_WIDTH, GROUND_Y, HOLD_DURATION_SECONDS, HOOK_X, HOOK_Y,
  LEG_LENGTH, LEG_PIVOT_X, LEG_PIVOT_Y, STAGE_COUNT, effectiveCatchWidth, targetCenterX, type CleatDropState,
} from "./cleatDropEngine";
import { STAGES } from "./cleatDropStages";
import { loadCleatDropAssets, type CleatDropAssets } from "./cleatDropAssets";

const BOOT_SPRITE_SIZE = 64;
const LEG_SPRITE_WIDTH = 96;
const LEG_SPRITE_HEIGHT = 132;
const TARGET_BLOCK_HEIGHT = 34;
/** Fallback flat colour per tier when a target sprite hasn't loaded. */
const TIER_COLORS: Record<number, string> = { 1: "#2f8f4e", 2: "#d98a2b", 3: "#c7a52a", 4: "#c25b3f", 5: "#8f4fd9" };
/** Discrete leg-swing angles (rad) used only by the shape fallback; the real sprites already depict each pose. */
const LEG_FALLBACK_ANGLE = { idle: 0, swinging: 0.55, contacted: 1.1 };

function pickCleatFrame(state: CleatDropState, assets: CleatDropAssets | null): HTMLImageElement | undefined {
  if (!assets) return undefined;
  if (state.phase === "pendulum") {
    if (Math.abs(state.pendulumAngle) < 0.08) return assets.cleatIdle;
    return state.pendulumAngle > 0 ? assets.cleatSwingRight : assets.cleatSwingLeft;
  }
  if (state.phase === "falling") return assets.cleatFalling;
  return state.resting ? assets.cleatLanded : assets.cleatFalling;
}

function pickLegFrame(state: CleatDropState, assets: CleatDropAssets | null): HTMLImageElement | undefined {
  if (!assets) return undefined;
  if (state.leg.hasContacted) return assets.legSwingB;
  if (state.leg.swinging) return assets.legSwingA;
  return assets.legIdle;
}

function drawBoot(context: CanvasRenderingContext2D, state: CleatDropState, art: CleatDropAssets | null) {
  const { x, y } = state.boot;
  const image = pickCleatFrame(state, art);
  if (image) {
    context.drawImage(image, x - BOOT_SPRITE_SIZE / 2, y - BOOT_SPRITE_SIZE / 2, BOOT_SPRITE_SIZE, BOOT_SPRITE_SIZE);
    return;
  }
  context.save();
  context.translate(x, y);
  context.fillStyle = "#e2571f";
  context.beginPath();
  context.ellipse(0, 0, BOOT_RADIUS * 1.6, BOOT_RADIUS, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#f4f1e8";
  context.fillRect(-BOOT_RADIUS * 1.6, BOOT_RADIUS * 0.35, BOOT_RADIUS * 3.2, BOOT_RADIUS * 0.5);
  context.restore();
}

function drawLeg(context: CanvasRenderingContext2D, state: CleatDropState, art: CleatDropAssets | null) {
  const image = pickLegFrame(state, art);
  if (image) {
    context.drawImage(image, LEG_PIVOT_X - LEG_SPRITE_WIDTH / 2, LEG_PIVOT_Y - 12, LEG_SPRITE_WIDTH, LEG_SPRITE_HEIGHT);
    return;
  }
  const angle = state.leg.hasContacted ? LEG_FALLBACK_ANGLE.contacted : state.leg.swinging ? LEG_FALLBACK_ANGLE.swinging : LEG_FALLBACK_ANGLE.idle;
  const tipX = LEG_PIVOT_X + LEG_LENGTH * Math.sin(angle);
  const tipY = LEG_PIVOT_Y + LEG_LENGTH * Math.cos(angle);
  context.strokeStyle = "#2fbf84";
  context.lineWidth = 14;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(LEG_PIVOT_X, LEG_PIVOT_Y);
  context.lineTo(tipX, tipY);
  context.stroke();
  context.save();
  context.translate(tipX, tipY);
  context.rotate(angle);
  context.fillStyle = "#e2571f";
  context.beginPath();
  context.ellipse(0, 0, BOOT_RADIUS * 1.1, BOOT_RADIUS * 0.75, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawTarget(context: CanvasRenderingContext2D, state: CleatDropState, art: CleatDropAssets | null) {
  const stage = STAGES[state.stageIndex];
  const tx = targetCenterX(stage, state.t);
  const width = effectiveCatchWidth(stage, state.t);
  const image = art?.targetsByKey[stage.assetKey];
  if (image) {
    const size = Math.max(56, Math.min(140, width * 1.15));
    context.drawImage(image, tx - size / 2, GROUND_Y - size, size, size);
    return;
  }
  context.save();
  context.translate(tx, GROUND_Y);
  if (!stage.curved) context.rotate((stage.tiltDeg * Math.PI) / 180);
  context.fillStyle = TIER_COLORS[stage.tier] ?? "#2f8f4e";
  if (stage.curved) {
    context.beginPath();
    context.ellipse(0, -TARGET_BLOCK_HEIGHT / 2, width / 2, TARGET_BLOCK_HEIGHT / 2, 0, 0, Math.PI * 2);
    context.fill();
  } else {
    context.fillRect(-width / 2, -TARGET_BLOCK_HEIGHT, width, TARGET_BLOCK_HEIGHT);
  }
  context.restore();
}

function drawHoldGauge(context: CanvasRenderingContext2D, state: CleatDropState, art: CleatDropAssets | null) {
  if (state.phase !== "flight" || !state.resting || state.holdTimer <= 0) return;
  const stage = STAGES[state.stageIndex];
  const tx = targetCenterX(stage, state.t);
  const progress = Math.min(1, state.holdTimer / HOLD_DURATION_SECONDS);
  context.save();
  context.translate(tx, GROUND_Y - TARGET_BLOCK_HEIGHT - 8);
  if (art?.timerRing) context.drawImage(art.timerRing, -22, -22, 44, 44);
  context.beginPath();
  context.arc(0, 0, 18, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
  context.strokeStyle = "#5cf2b0";
  context.lineWidth = 5;
  context.lineCap = "round";
  context.stroke();
  context.restore();
}

function drawAllClear(context: CanvasRenderingContext2D, state: CleatDropState, art: CleatDropAssets | null, attempts: number) {
  if (art?.background) context.drawImage(art.background, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  else {
    context.fillStyle = "#0d5a34";
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
  context.fillStyle = "rgba(4,20,12,.62)";
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawStageDots(context, state, art);
  context.textAlign = "center";
  context.fillStyle = "#ffe278";
  context.font = "bold 34px sans-serif";
  context.fillText("30 스테이지 모두 클리어!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 12);
  context.fillStyle = "#f4f1e8";
  context.font = "22px sans-serif";
  context.fillText(`총 ${attempts}번 만에 성공했습니다`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 26);
}

function drawStageDots(context: CanvasRenderingContext2D, state: CleatDropState, art: CleatDropAssets | null) {
  const spacing = 18;
  const startX = CANVAS_WIDTH / 2 - ((STAGE_COUNT - 1) * spacing) / 2;
  const y = 20;
  for (let i = 0; i < STAGE_COUNT; i++) {
    const x = startX + i * spacing;
    const filled = state.cleared[i];
    const image = filled ? art?.stageDotFilled : art?.stageDotEmpty;
    if (image) {
      context.drawImage(image, x - 7, y - 7, 14, 14);
      continue;
    }
    context.beginPath();
    context.arc(x, y, 5, 0, Math.PI * 2);
    context.fillStyle = filled ? "#ffd44f" : "rgba(255,255,255,.35)";
    context.fill();
    if (i === state.stageIndex) {
      context.strokeStyle = "#fff";
      context.lineWidth = 1.5;
      context.stroke();
    }
  }
}

export function CleatDropCanvas({
  state, onRelease, onSwing, allClear,
}: {
  state: CleatDropState;
  onRelease: () => void;
  onSwing: () => void;
  /** Non-null once all 30 stages are cleared: replaces the play field with the completion screen. */
  allClear?: { attempts: number } | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const assetsRef = useRef<CleatDropAssets | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const allClearRef = useRef(allClear);
  allClearRef.current = allClear;
  const drawRef = useRef<() => void>(() => {});

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const s = stateRef.current;
    const art = assetsRef.current;

    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (allClearRef.current) {
      drawAllClear(context, s, art, allClearRef.current.attempts);
      return;
    }

    if (art?.background) context.drawImage(art.background, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    else {
      context.fillStyle = "#0d5a34";
      context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    context.strokeStyle = "rgba(255,255,255,.55)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, GROUND_Y);
    context.lineTo(CANVAS_WIDTH, GROUND_Y);
    context.stroke();

    drawTarget(context, s, art);
    drawHoldGauge(context, s, art);

    if (art?.hook) context.drawImage(art.hook, HOOK_X - 24, HOOK_Y - 30, 48, 60);
    else {
      context.strokeStyle = "#8f8f8f";
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(HOOK_X, HOOK_Y - 24);
      context.lineTo(HOOK_X, HOOK_Y);
      context.stroke();
      context.beginPath();
      context.arc(HOOK_X, HOOK_Y, 6, 0, Math.PI * 2);
      context.stroke();
    }

    if (s.phase === "pendulum") {
      context.strokeStyle = "rgba(255,255,255,.85)";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(HOOK_X, HOOK_Y);
      context.lineTo(s.boot.x, s.boot.y);
      context.stroke();
    }

    drawLeg(context, s, art);
    drawBoot(context, s, art);
    drawStageDots(context, s, art);
  }, []);

  drawRef.current = draw;

  useEffect(() => {
    let alive = true;
    void loadCleatDropAssets().then((value) => {
      if (alive) {
        assetsRef.current = value;
        drawRef.current();
      }
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => { draw(); }, [state, allClear, draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      context.setTransform((canvas.width / CANVAS_WIDTH), 0, 0, (canvas.height / CANVAS_HEIGHT), 0, 0);
      drawRef.current();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    return () => observer.disconnect();
  }, []);

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (allClearRef.current) return;
    const phase = stateRef.current.phase;
    if (phase === "pendulum") onRelease();
    else if (phase === "falling") onSwing();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    if (allClearRef.current) return;
    const phase = stateRef.current.phase;
    if (phase === "pendulum") onRelease();
    else if (phase === "falling") onSwing();
  };

  return (
    <canvas
      ref={canvasRef}
      className="cleat-drop-canvas"
      tabIndex={0}
      aria-label="축구화 던지기 플레이 화면"
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
    />
  );
}
