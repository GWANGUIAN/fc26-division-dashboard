import { useRef, useState } from "react";
import { playSfx } from "../../sfxAudio.js";
import { loadFootballMatch3HighScore, saveFootballMatch3HighScore } from "../../storage.js";
import { createGame, trySwap, type Board, type FootballMatch3State, type Step } from "./footballMatch3Engine.js";

export interface FootballMatch3RoundResult { game: "football-match3"; score: number }
export interface FootballMatch3GameState { phase: "ready" | "playing" | "over"; engine: FootballMatch3State; animationBoard: Board; invalidSwap?: [number, number]; highScore: number; roundId: number; animating: boolean; steps: Step[] }
export function createFootballMatch3EndLatch() { let ended = false; return { claim: () => !ended && (ended = true), reset: () => { ended = false; } }; }

export function useFootballMatch3Game({ sfxOn, sfxVolume, onRoundEnd }: { sfxOn: boolean; sfxVolume: number; onRoundEnd?: (result: FootballMatch3RoundResult) => void }) {
  const [state, setState] = useState<FootballMatch3GameState>(() => { const engine = createGame(0x260921); return { phase: "ready", engine, animationBoard: engine.board, highScore: loadFootballMatch3HighScore(), roundId: 0, animating: false, steps: [] }; });
  const latch = useRef(createFootballMatch3EndLatch());
  const callback = useRef(onRoundEnd); callback.current = onRoundEnd;
  const sound = useRef({ on: sfxOn, volume: sfxVolume }); sound.current = { on: sfxOn, volume: sfxVolume };
  const startRound = () => { latch.current.reset(); setState((current) => { const engine = createGame(0x260921 + current.roundId + 1); return { ...current, phase: "playing", engine, animationBoard: engine.board, roundId: current.roundId + 1, animating: false, steps: [] }; }); };
  const tryMove = (a: number, b: number) => setState((current) => {
    if (current.phase !== "playing" || current.animating) return current;
    const result = trySwap(current.engine, a, b);
    if (!result.ok) { if (sound.current.on) playSfx("/sfxes/football-match3-invalid.mp3", sound.current.volume / 100); return { ...current, animationBoard: current.engine.board, invalidSwap: [a, b], animating: true, steps: [] }; }
    if (sound.current.on) {
      playSfx("/sfxes/football-match3-swap.mp3", sound.current.volume / 100);
    }
    const highScore = Math.max(current.highScore, result.state.score);
    if (highScore !== current.highScore) saveFootballMatch3HighScore(highScore);
    return { ...current, engine: result.state, animationBoard: current.engine.board, invalidSwap: undefined, highScore, animating: true, steps: result.steps };
  });
  const playClearStep = (step: Step) => {
    if (!sound.current.on || !step.removed.length) return;
    const special = step.created.length > 0 || step.removed.length > 8;
    playSfx(special ? "/sfxes/football-match3-special.mp3" : "/sfxes/football-match3-match.mp3", sound.current.volume / 100, (audio) => {
      audio.playbackRate = Math.min(1.8, 1 + (step.chain - 1) * .12);
    });
  };
  const finishAnimation = () => setState((current) => {
    if (!current.animating) return current;
    if (current.engine.phase === "over" && latch.current.claim()) {
      if (sound.current.on) playSfx("/sfxes/football-match3-end.mp3", sound.current.volume / 100);
      callback.current?.({ game: "football-match3", score: current.engine.score });
      return { ...current, phase: "over", animating: false };
    }
    return { ...current, invalidSwap: undefined, animating: false, steps: [] };
  });
  return { state, startRound, tryMove, playClearStep, finishAnimation };
}
