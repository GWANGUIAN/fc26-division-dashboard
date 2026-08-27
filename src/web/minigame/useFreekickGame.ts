import { useEffect, useRef, useState } from "react";
import { playSfx } from "../sfxAudio";
import { loadFreekickHighScore, saveFreekickHighScore } from "../storage";
import {
  applyStrike,
  createInitialState,
  resetForNextAttempt,
  startNewRound,
  stepPhysics,
  type GameState,
} from "./freekickEngine";

const STRIKE_SFX_URL = "/sfxes/ball-bounce.mp3";
const GOAL_SFX_URL = "/sfxes/goal.mp3";
const MISS_SFX_URL = "/sfxes/game-over.mp3";
// Some devices/browsers fire two pointerup events (e.g. touch + compatibility mouse event) for a
// single physical release; without this guard that double-counts one shot as two.
const SHOT_DEDUPE_MS = 120;

export function useFreekickGame({ sfxOn, sfxVolume }: { sfxOn: boolean; sfxVolume: number }) {
  const [state, setState] = useState<GameState>(() => createInitialState(loadFreekickHighScore()));
  const prevPhaseRef = useRef(state.phase);

  // The authoritative, continuously-updated game state during a shot. Physics steps mutate this
  // every animation frame without going through React state (and its re-render of the whole modal
  // tree) — React state is only synced at UI-relevant checkpoints (see the tick loop below).
  const liveStateRef = useRef(state);

  useEffect(() => {
    saveFreekickHighScore(state.bestScore);
  }, [state.bestScore]);

  useEffect(() => {
    // A shot resolves into either "result" (lives remain) or straight to "gameover" (last life
    // lost) — both are reached directly from "flight", so both need the goal/miss sfx cue.
    const enteredTerminal =
      prevPhaseRef.current === "flight" && (state.phase === "result" || state.phase === "gameover");
    if (enteredTerminal && sfxOn) {
      playSfx(state.result === "goal" ? GOAL_SFX_URL : MISS_SFX_URL, sfxVolume / 100);
    }
    prevPhaseRef.current = state.phase;
  }, [state.phase, state.result, sfxOn, sfxVolume]);

  useEffect(() => {
    if (state.phase !== "flight") return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;

      const prev = liveStateRef.current;
      const next = stepPhysics(prev, dt);
      liveStateRef.current = next;

      if (next.phase !== prev.phase) {
        setState(next);
        return;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state.phase]);

  const lastShotAtRef = useRef(0);

  function handleShoot(strikeOffsetX: number, strikeOffsetY: number, dragDx: number, dragDy: number) {
    const now = performance.now();
    if (now - lastShotAtRef.current < SHOT_DEDUPE_MS) return;
    lastShotAtRef.current = now;

    const current = liveStateRef.current;
    const next = applyStrike(current, strikeOffsetX, strikeOffsetY, dragDx, dragDy, Math.random());
    if (next === current) return;

    liveStateRef.current = next;
    if (sfxOn) playSfx(STRIKE_SFX_URL, sfxVolume / 100);
    setState(next);
  }

  function handleNextAttempt() {
    const next = resetForNextAttempt(liveStateRef.current);
    if (next === liveStateRef.current) return;
    liveStateRef.current = next;
    setState(next);
  }

  function handleNewRound() {
    const next = startNewRound(liveStateRef.current);
    liveStateRef.current = next;
    setState(next);
  }

  return { state, liveStateRef, handleShoot, handleNextAttempt, handleNewRound };
}
