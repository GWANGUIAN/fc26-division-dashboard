import { useEffect, useRef } from "react";
import { BOARD_FRAME_HEIGHT, BOARD_FRAME_WIDTH, BOARD_HEIGHT, BOARD_INTERIOR, BOARD_WIDTH, DANGER_Y, DROP_Y, FIXED_STEP, TIERS, type GrassMergeState } from "./grassMergeEngine.js";
import { loadGrassMergeAssets, type GrassMergeAssets } from "./grassMergeAssets.js";

export function GrassMergeCanvas({
  engine, phase, onAim, onDrop, onAdvance,
}: {
  engine: GrassMergeState;
  phase: "playing" | "over";
  onAim: (x: number) => void;
  onDrop: () => void;
  onAdvance: (dt: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef(engine);
  const assetsRef = useRef<GrassMergeAssets | null>(null);
  const callbacksRef = useRef({ onAim, onDrop, onAdvance });
  engineRef.current = engine;
  callbacksRef.current = { onAim, onDrop, onAdvance };

  useEffect(() => {
    let live = true;
    loadGrassMergeAssets().then((assets) => {
      if (!live) return;
      assetsRef.current = assets;
      draw();
    });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      context.setTransform((rect.width * dpr) / BOARD_FRAME_WIDTH, 0, 0, (rect.height * dpr) / BOARD_FRAME_HEIGHT, 0, 0);
      draw();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (phase !== "playing") {
      draw();
      return;
    }
    let frame = 0;
    let previous = performance.now();
    let accumulator = 0;
    const tick = (now: number) => {
      accumulator = Math.min(.2, accumulator + (now - previous) / 1000);
      previous = now;
      while (accumulator >= FIXED_STEP) {
        callbacksRef.current.onAdvance(FIXED_STEP);
        accumulator -= FIXED_STEP;
      }
      draw();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  function drawFallbackItem(context: CanvasRenderingContext2D, tier: number, x: number, y: number, alpha = 1) {
    const item = TIERS[tier - 1];
    context.save();
    context.globalAlpha = alpha;
    context.beginPath();
    context.arc(x, y, item.radius, 0, Math.PI * 2);
    context.fillStyle = item.color;
    context.fill();
    context.strokeStyle = "#10271d";
    context.lineWidth = 3;
    context.stroke();
    context.beginPath();
    context.arc(x - item.radius * .26, y - item.radius * .3, item.radius * .2, 0, Math.PI * 2);
    context.fillStyle = "rgba(255,255,255,.42)";
    context.fill();
    context.font = `900 ${Math.max(13, item.radius)}px "Barlow Condensed", "Noto Sans KR", sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#10271d";
    context.fillText(String(tier), x, y + 1);
    context.restore();
  }

  function drawItem(context: CanvasRenderingContext2D, tier: number, x: number, y: number, alpha = 1) {
    const image = assetsRef.current?.tiers[tier - 1];
    const size = TIERS[tier - 1].radius * 2;
    if (!image) return drawFallbackItem(context, tier, x, y, alpha);
    context.save();
    context.globalAlpha = alpha;
    context.drawImage(image, x - size / 2, y - size / 2, size, size);
    context.restore();
  }

  function draw() {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    const state = engineRef.current;
    context.clearRect(0, 0, BOARD_FRAME_WIDTH, BOARD_FRAME_HEIGHT);
    const background = context.createLinearGradient(0, 0, 0, BOARD_FRAME_HEIGHT);
    background.addColorStop(0, "#0e5a34");
    background.addColorStop(1, "#063d24");
    context.fillStyle = background;
    context.fillRect(0, 0, BOARD_FRAME_WIDTH, BOARD_FRAME_HEIGHT);
    context.fillStyle = "rgba(255,255,255,.035)";
    for (let line = 0; line < 8; line += 1) context.fillRect(0, 120 + line * 74, BOARD_FRAME_WIDTH, 34);
    context.save();
    context.translate(BOARD_INTERIOR.x, BOARD_INTERIOR.y);
    context.strokeStyle = "rgba(255,225,124,.78)";
    context.lineWidth = 2;
    context.setLineDash([7, 6]);
    context.beginPath();
    context.moveTo(10, DANGER_Y);
    context.lineTo(BOARD_WIDTH - 10, DANGER_Y);
    context.stroke();
    context.setLineDash([]);
    state.bodies.forEach((body) => drawItem(context, body.tier, body.x, body.y));
    if (phase === "playing") {
      const next = TIERS[state.nextTier - 1];
      context.save();
      context.strokeStyle = "rgba(255,255,255,.58)";
      context.lineWidth = 1.5;
      context.setLineDash([4, 5]);
      context.beginPath();
      context.moveTo(state.aimX, 0);
      context.lineTo(state.aimX, DROP_Y - next.radius - 5);
      context.stroke();
      context.setLineDash([]);
      context.restore();
      drawItem(context, state.nextTier, state.aimX, DROP_Y, .72);
    }
    context.restore();
    const frame = assetsRef.current?.board;
    if (frame) context.drawImage(frame, 0, 0, BOARD_FRAME_WIDTH, BOARD_FRAME_HEIGHT);
    else {
      context.strokeStyle = "rgba(230,255,240,.82)";
      context.lineWidth = 8;
      context.beginPath();
      context.moveTo(BOARD_INTERIOR.x, BOARD_INTERIOR.y);
      context.lineTo(BOARD_INTERIOR.x, BOARD_INTERIOR.y + BOARD_HEIGHT);
      context.lineTo(BOARD_INTERIOR.x + BOARD_WIDTH, BOARD_INTERIOR.y + BOARD_HEIGHT);
      context.lineTo(BOARD_INTERIOR.x + BOARD_WIDTH, BOARD_INTERIOR.y);
      context.stroke();
    }
  }

  function aimForEvent(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return ((event.clientX - rect.left) / rect.width) * BOARD_FRAME_WIDTH - BOARD_INTERIOR.x;
  }
  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (phase === "playing") callbacksRef.current.onAim(aimForEvent(event));
  }
  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (phase !== "playing") return;
    event.preventDefault();
    event.currentTarget.focus();
    callbacksRef.current.onAim(aimForEvent(event));
    callbacksRef.current.onDrop();
  }
  function handleKeyDown(event: React.KeyboardEvent<HTMLCanvasElement>) {
    if (phase !== "playing") return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      callbacksRef.current.onAim(engineRef.current.aimX + (event.key === "ArrowLeft" ? -14 : 14));
    } else if (event.key === " " || event.key === "Spacebar" || event.key === "Enter") {
      event.preventDefault();
      callbacksRef.current.onDrop();
    }
  }

  return <canvas ref={canvasRef} className="grass-merge-canvas" tabIndex={0}
    aria-label="잔디 머지 보드. 마우스로 위치를 정하고 클릭 또는 Space로 아이템을 떨어뜨리세요. 화살표 키로도 이동할 수 있습니다."
    onPointerMove={handlePointerMove} onPointerDown={handlePointerDown} onKeyDown={handleKeyDown} />;
}
