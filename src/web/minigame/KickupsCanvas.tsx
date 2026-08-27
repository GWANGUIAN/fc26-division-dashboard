import { useEffect, useRef, type RefObject } from "react";
import { BALL_RADIUS, COURT_HEIGHT, COURT_WIDTH, type GameState } from "./kickupsEngine";

const BALL_IMAGE_SRC = "/soccer_ball.webp";

export function KickupsCanvas({
  stateRef,
  onPointerDown,
}: {
  stateRef: RefObject<GameState>;
  onPointerDown: (logicalX: number, logicalY: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ballImageRef = useRef<HTMLImageElement | null>(null);
  const rotationRef = useRef(0);
  const lastFrameAtRef = useRef(performance.now());

  function draw() {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const now = performance.now();
    const dt = Math.min((now - lastFrameAtRef.current) / 1000, 0.05);
    lastFrameAtRef.current = now;

    const { x, y, vx } = stateRef.current.ball;
    // A ball rolling right without slipping spins clockwise; scale by 1/radius so it looks like it's rolling, not spinning in place.
    rotationRef.current += (vx / BALL_RADIUS) * dt;

    ctx.clearRect(0, 0, COURT_WIDTH, COURT_HEIGHT);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotationRef.current);
    const image = ballImageRef.current;
    if (image?.complete) {
      ctx.drawImage(image, -BALL_RADIUS, -BALL_RADIUS, BALL_RADIUS * 2, BALL_RADIUS * 2);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = "#f4f4f4";
      ctx.fill();
    }
    ctx.restore();
  }

  useEffect(() => {
    const image = new Image();
    image.onload = draw;
    image.src = BALL_IMAGE_SRC;
    ballImageRef.current = image;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform((dpr * rect.width) / COURT_WIDTH, 0, 0, (dpr * rect.height) / COURT_HEIGHT, 0, 0);
      draw();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  // Redraw every animation frame directly off the ref, independent of React's render/commit
  // cycle — React state (and re-renders) only change at UI checkpoints, not per physics step.
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    onPointerDown(
      ((event.clientX - rect.left) / rect.width) * COURT_WIDTH,
      ((event.clientY - rect.top) / rect.height) * COURT_HEIGHT,
    );
  }

  return <canvas ref={canvasRef} className="kickups-canvas" onPointerDown={handlePointerDown} />;
}
