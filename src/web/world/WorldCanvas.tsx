import { useEffect, useRef, type MutableRefObject, type PointerEvent } from "react";
import type { WorldAudioLike } from "./audio/worldAudio";
import { VIEW_HEIGHT, VIEW_WIDTH } from "./engine/render";
import { createWorldEngine, type SaveStore, type WorldEngine, type WorldEvents } from "./engine/world";
import type { CastId } from "./types";
import type { WorldAssets } from "./worldAssets";

interface WorldCanvasProps {
  assets: WorldAssets;
  playerId: CastId;
  store: SaveStore;
  debug: boolean;
  scaleLabel: string;
  audio: WorldAudioLike;
  /** Latest event handlers; the engine reads it on every event. */
  eventsRef: MutableRefObject<WorldEvents>;
  onEngine: (engine: WorldEngine | null) => void;
}

/**
 * The game canvas. Its backing store is always the logical 640×360; the overlay scales the whole
 * stage by a whole-number factor with `image-rendering: pixelated`, so pixels stay crisp blocks.
 */
export function WorldCanvas({ assets, playerId, store, debug, scaleLabel, audio, eventsRef, onEngine }: WorldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<WorldEngine | null>(null);
  const scaleLabelRef = useRef(scaleLabel);
  scaleLabelRef.current = scaleLabel;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = createWorldEngine({
      canvas,
      assets,
      playerId,
      store,
      debug,
      audio,
      getEvents: () => eventsRef.current,
      getScaleLabel: () => scaleLabelRef.current,
    });
    engineRef.current = engine;
    onEngine(engine);
    engine.start();
    return () => {
      onEngine(null);
      engineRef.current = null;
      engine.destroy();
    };
    // The engine owns its state for the whole visit; a new visit remounts this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ?worldDebug: a click reports the world position under the cursor (the stage is CSS-scaled, so map through the rect).
  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (!debug || !engineRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    engineRef.current.pick(((event.clientX - rect.left) / rect.width) * VIEW_WIDTH, ((event.clientY - rect.top) / rect.height) * VIEW_HEIGHT);
  }

  return <canvas ref={canvasRef} className="world-canvas" width={VIEW_WIDTH} height={VIEW_HEIGHT} aria-label="잔디동 월드 화면" onPointerDown={handlePointerDown} />;
}
