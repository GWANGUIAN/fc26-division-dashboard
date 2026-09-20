import { useEffect, useRef, type MouseEvent, type MutableRefObject, type PointerEvent } from "react";
import type { WorldAudioLike } from "./audio/worldAudio";
import { VIEW_HEIGHT, VIEW_WIDTH } from "./engine/render";
import { createWorldEngine, type SaveStore, type WorldEngine, type WorldEvents } from "./engine/world";
import type { OnAirSource } from "./state/onAir";
import type { CastId } from "./types";
import type { WorldAssets } from "./worldAssets";

interface WorldCanvasProps {
  assets: WorldAssets;
  playerId: CastId;
  store: SaveStore;
  debug: boolean;
  scaleLabel: string;
  audio: WorldAudioLike;
  /** Who is live on SOOP (the ON AIR signs over the member houses). */
  onAir?: OnAirSource;
  /** Latest event handlers; the engine reads it on every event. */
  eventsRef: MutableRefObject<WorldEvents>;
  onEngine: (engine: WorldEngine | null) => void;
}

/**
 * The game canvas. Its backing store is always the logical 640×360; the overlay scales the whole
 * stage by a whole-number factor with `image-rendering: pixelated`, so pixels stay crisp blocks.
 */
export function WorldCanvas({ assets, playerId, store, debug, scaleLabel, audio, onAir, eventsRef, onEngine }: WorldCanvasProps) {
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
      onAir,
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

  // The stage is CSS-scaled, so a pointer position maps to the logical 640×360 through the canvas rect.
  const toStage = (event: { clientX: number; clientY: number; currentTarget: HTMLCanvasElement }) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH, y: ((event.clientY - rect.top) / rect.height) * VIEW_HEIGHT };
  };

  // ?worldDebug: a click reports the world position under the cursor.
  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (!debug || !engineRef.current) return;
    const at = toStage(event);
    engineRef.current.pick(at.x, at.y);
  }

  // A click on a member's ON AIR sign opens their broadcast/station. `click` (not `pointerdown`) keeps
  // window.open inside a user activation on touch as well, so the popup blocker lets it through.
  function handleClick(event: MouseEvent<HTMLCanvasElement>) {
    const at = toStage(event);
    engineRef.current?.clickAt(at.x, at.y);
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const at = toStage(event);
    const overSign = engineRef.current?.hoverAt(at.x, at.y) ?? false;
    const cursor = overSign ? "pointer" : "";
    if (canvas.style.cursor !== cursor) canvas.style.cursor = cursor;
  }

  return (
    <canvas
      ref={canvasRef}
      className="world-canvas"
      width={VIEW_WIDTH}
      height={VIEW_HEIGHT}
      aria-label="잔디동 월드 화면"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
    />
  );
}
