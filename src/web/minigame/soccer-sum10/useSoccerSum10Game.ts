import { useEffect, useRef, useState } from "react";
import { playSfx } from "../../sfxAudio.js";
import { loadSoccerSum10HighScore, saveSoccerSum10HighScore } from "../../storage.js";
import {
  clearSelection,
  createSoccerSum10Board,
  isBoardCleared,
  selectionSum,
  type GridBounds,
  type SoccerSum10Board,
} from "./soccerSum10Engine.js";

const ROUND_SECONDS = 60;
const START_SFX = "/sfxes/soccer-sum10-start.mp3";
const CLEAR_SFX = "/sfxes/soccer-sum10-clear.mp3";
const INVALID_SFX = "/sfxes/soccer-sum10-invalid.mp3";
const TIME_UP_SFX = "/sfxes/soccer-sum10-timeup.mp3";
const COMPLETE_SFX = "/sfxes/soccer-sum10-complete.mp3";

/** What the world (docs/world/01 §10) hears when a round is over: the points of that round and whether the board was cleared. */
export interface SoccerSum10RoundResult {
  game: "soccer-sum10";
  score: number;
  cleared: boolean;
}

export type SoccerSum10Phase = "ready" | "playing" | "timeup" | "cleared";
export type SelectionResult = "cleared" | "invalid" | "ignored";

interface SoccerSum10GameState {
  phase: SoccerSum10Phase;
  board: SoccerSum10Board;
  score: number;
  highScore: number;
  timeLeft: number;
  roundId: number;
}

/** A world result mutates the parent overlay, so a round needs a latch that survives that re-render. */
export function createSoccerSum10EndLatch() {
  let ended = false;
  return {
    /** Claims the one allowed result notification for the current round. */
    claim() {
      if (ended) return false;
      ended = true;
      return true;
    },
    reset() {
      ended = false;
    },
  };
}

export function useSoccerSum10Game({
  sfxOn,
  sfxVolume,
  onRoundEnd,
}: {
  sfxOn: boolean;
  sfxVolume: number;
  onRoundEnd: (result: SoccerSum10RoundResult) => void;
}) {
  const [state, setState] = useState<SoccerSum10GameState>(() => ({
    phase: "ready",
    board: createSoccerSum10Board(),
    score: 0,
    highScore: loadSoccerSum10HighScore(),
    timeLeft: ROUND_SECONDS,
    roundId: 0,
  }));
  const endAtRef = useRef<number | null>(null);
  const endLatchRef = useRef(createSoccerSum10EndLatch());
  // The time-up tick runs from an animation frame: it reads the latest values through refs instead
  // of subscribing again after the world records a result and re-renders this modal.
  const scoreRef = useRef(state.score);
  scoreRef.current = state.score;
  const onRoundEndRef = useRef(onRoundEnd);
  onRoundEndRef.current = onRoundEnd;
  const sfxRef = useRef({ on: sfxOn, volume: sfxVolume });
  sfxRef.current = { on: sfxOn, volume: sfxVolume };

  useEffect(() => {
    if (state.phase !== "playing") return;
    if (endAtRef.current === null) endAtRef.current = performance.now() + state.timeLeft * 1000;
    let frame = 0;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endAtRef.current! - performance.now()) / 1000));
      if (remaining === 0) {
        if (endLatchRef.current.claim()) {
          if (sfxRef.current.on) playSfx(TIME_UP_SFX, sfxRef.current.volume / 100);
          setState((current) => (current.phase === "playing" ? { ...current, phase: "timeup", timeLeft: 0 } : current));
          onRoundEndRef.current({ game: "soccer-sum10", score: scoreRef.current, cleared: false });
        }
        return;
      }
      setState((current) => (current.timeLeft === remaining ? current : { ...current, timeLeft: remaining }));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [state.phase]);

  useEffect(() => {
    if (state.highScore > 0) saveSoccerSum10HighScore(state.highScore);
  }, [state.highScore]);

  function startGame() {
    endAtRef.current = null;
    endLatchRef.current.reset();
    setState((current) => ({
      ...current,
      phase: "playing",
      board: createSoccerSum10Board(),
      score: 0,
      timeLeft: ROUND_SECONDS,
      roundId: current.roundId + 1,
    }));
    if (sfxOn) playSfx(START_SFX, sfxVolume / 100);
  }

  function resolveSelection(bounds: GridBounds): SelectionResult {
    if (state.phase !== "playing") return "ignored";
    const sum = selectionSum(state.board, bounds);
    const nextBoard = clearSelection(state.board, bounds);
    if (!nextBoard || sum !== 10) {
      if (sfxOn) playSfx(INVALID_SFX, sfxVolume / 100);
      return "invalid";
    }

    const clearedCount = state.board.cells.filter((cell) => !cell.removed && nextBoard.cells.find((next) => next.id === cell.id)?.removed).length;
    const nextScore = state.score + clearedCount;
    const complete = isBoardCleared(nextBoard);
    if (sfxOn) playSfx(complete ? COMPLETE_SFX : CLEAR_SFX, sfxVolume / 100);
    setState((current) => ({
      ...current,
      board: nextBoard,
      score: nextScore,
      highScore: Math.max(current.highScore, nextScore),
      phase: complete ? "cleared" : current.phase,
    }));
    if (complete && endLatchRef.current.claim()) onRoundEndRef.current({ game: "soccer-sum10", score: nextScore, cleared: true });
    return "cleared";
  }

  return { state, startGame, resolveSelection };
}
