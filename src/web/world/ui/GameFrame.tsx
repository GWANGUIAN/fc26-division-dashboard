import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { framePieces, type FrameLayout } from "../gameFrame";
import { getWorldAssetUrl } from "../worldAssets";

const FRAME_KEY = "ui/game-outer-frame";

let frameImage: Promise<HTMLImageElement | null> | null = null;

/** The frame picture, fetched once and shared by every overlay; null when the file is missing or fails to load. */
function loadFrameImage(): Promise<HTMLImageElement | null> {
  const url = getWorldAssetUrl(FRAME_KEY);
  if (!url) return Promise.resolve(null);
  frameImage ??= new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => {
      frameImage = null;
      resolve(null);
    };
    image.src = url;
  });
  return frameImage;
}

/**
 * The picture frame around the game, drawn from the frame art with its straight runs stretched to the stage's
 * size (gameFrame.ts). Purely decorative: it takes no clicks and the stage keeps its own size.
 */
export function GameFrame({ frame }: { frame: FrameLayout }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    let alive = true;
    void loadFrameImage().then((loaded) => alive && setImage(loaded));
    return () => {
      alive = false;
    };
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    canvas.width = Math.round(frame.width * frame.pixelRatio);
    canvas.height = Math.round(frame.height * frame.pixelRatio);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    for (const piece of framePieces(frame)) ctx.drawImage(image, piece.sx, piece.sy, piece.sw, piece.sh, piece.dx, piece.dy, piece.dw, piece.dh);
  }, [frame, image]);

  return (
    <canvas
      ref={canvasRef}
      className="world-frame"
      aria-hidden="true"
      style={{ left: frame.left, top: frame.top, width: frame.width, height: frame.height }}
    />
  );
}
