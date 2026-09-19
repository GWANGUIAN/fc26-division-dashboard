import { useEffect, useRef } from "react";
import { VIEW_HEIGHT, VIEW_WIDTH } from "./engine/render";
import { createWorldEngine } from "./engine/world";
import type { CastId, WorldSave } from "./types";
import type { WorldAssets } from "./worldAssets";

interface WorldCanvasProps {
  assets: WorldAssets;
  playerId: CastId;
  save: WorldSave;
  debug: boolean;
  scaleLabel: string;
}

/**
 * The game canvas. Its backing store is always the logical 640×360; the overlay scales the whole
 * stage by a whole-number factor with `image-rendering: pixelated`, so pixels stay crisp blocks.
 */
export function WorldCanvas({ assets, playerId, save, debug, scaleLabel }: WorldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scaleLabelRef = useRef(scaleLabel);
  scaleLabelRef.current = scaleLabel;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = createWorldEngine({ canvas, assets, playerId, save, debug, getScaleLabel: () => scaleLabelRef.current });
    engine.start();
    return () => engine.destroy();
    // The engine owns its state for the whole visit; a new visit remounts this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} className="world-canvas" width={VIEW_WIDTH} height={VIEW_HEIGHT} aria-label="잔디동 월드 화면" />;
}
