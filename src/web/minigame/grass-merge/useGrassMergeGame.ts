import { useEffect, useRef, useState } from "react";
import { playSfx } from "../../sfxAudio.js";
import { loadGrassMergeHighScore, saveGrassMergeHighScore } from "../../storage.js";
import { createGame, drop, setAim, step, type GrassMergeState } from "./grassMergeEngine.js";

const DROP_SFX = "/sfxes/grass-merge-drop.mp3";
const MERGE_SFX = "/sfxes/grass-merge-merge.mp3";
const GAME_OVER_SFX = "/sfxes/grass-merge-gameover.mp3";

export interface GrassMergeRoundResult { game: "grass-merge"; score: number; }
export type GrassMergeGamePhase = "ready" | "playing" | "over";
interface GrassMergeGameState { phase: GrassMergeGamePhase; engine: GrassMergeState; highScore: number; roundId: number; }

export function createGrassMergeEndLatch() {
  let ended = false;
  return { claim: () => !ended && ((ended = true) as boolean), reset: () => { ended = false; } };
}

export function useGrassMergeGame({ sfxOn, sfxVolume, onRoundEnd }: {
  sfxOn: boolean; sfxVolume: number; onRoundEnd: (result: GrassMergeRoundResult) => void;
}) {
  const [state, setState] = useState<GrassMergeGameState>(() => ({
    phase: "ready", engine: createGame(1), highScore: loadGrassMergeHighScore(), roundId: 0,
  }));
  const endLatchRef = useRef(createGrassMergeEndLatch());
  const onRoundEndRef = useRef(onRoundEnd);
  const sfxRef = useRef({ on: sfxOn, volume: sfxVolume });
  onRoundEndRef.current = onRoundEnd;
  sfxRef.current = { on: sfxOn, volume: sfxVolume };

  useEffect(() => {
    if (state.highScore > 0) saveGrassMergeHighScore(state.highScore);
  }, [state.highScore]);
  useEffect(() => {
    if (state.phase !== "over" || !endLatchRef.current.claim()) return;
    if (sfxRef.current.on) playSfx(GAME_OVER_SFX, sfxRef.current.volume / 100);
    onRoundEndRef.current({ game: "grass-merge", score: state.engine.score });
  }, [state.engine.score, state.phase]);

  function startGame() {
    endLatchRef.current.reset();
    setState((current) => ({ ...current, phase: "playing", engine: createGame(current.roundId + 1), roundId: current.roundId + 1 }));
  }
  function aim(x: number) {
    setState((current) => current.phase === "playing" ? { ...current, engine: setAim(current.engine, x) } : current);
  }
  function release() {
    setState((current) => {
      if (current.phase !== "playing") return current;
      const next = drop(current.engine);
      if (next !== current.engine && sfxRef.current.on) playSfx(DROP_SFX, sfxRef.current.volume / 100);
      return next === current.engine ? current : { ...current, engine: next };
    });
  }
  function advance(dt: number) {
    setState((current) => {
      if (current.phase !== "playing") return current;
      const next = step(current.engine, dt);
      if (next.score > current.engine.score && sfxRef.current.on) {
        const createdTier = next.bodies.reduce((largest, item) => Math.max(largest, item.tier), 2);
        playSfx(MERGE_SFX, sfxRef.current.volume / 100, (audio) => { audio.playbackRate = Math.min(1.55, 1 + createdTier * .035); });
      }
      const phase = next.phase === "over" ? "over" : "playing";
      return { ...current, phase, engine: next, highScore: Math.max(current.highScore, next.score) };
    });
  }
  return { state, startGame, aim, release, advance };
}
