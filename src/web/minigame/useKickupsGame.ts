import { useEffect, useRef, useState } from "react";
import { playSfx } from "../sfxAudio";
import { loadKickupsHighScore, saveKickupsHighScore } from "../storage";
import {
  applyHit,
  applyRelaunch,
  createInitialState,
  startDrop,
  stepPhysics,
  type GameState,
} from "./kickupsEngine";
import { KICKUPS_TOP_TIER_MIN_SCORE, pickQuip } from "./quips";

const DOORMOMO_SFX_URL = "/sfxes/doormomo.mp3";
const BALL_BOUNCE_SFX_URL = "/sfxes/ball-bounce.mp3";
const QUIP_VISIBLE_MS = 3200;
// Some devices/browsers fire two pointerdown events (e.g. touch + compatibility mouse event) for
// a single physical tap; without this guard that double-counts one click as two hits.
const CLICK_DEDUPE_MS = 120;

export function useKickupsGame({
  sfxEnabled,
  sfxVolume,
}: {
  sfxEnabled: boolean;
  sfxVolume: number;
}) {
  const [state, setState] = useState<GameState>(() => createInitialState(loadKickupsHighScore()));
  const [quip, setQuip] = useState<{ id: number; text: string } | null>(null);
  const prevPhaseRef = useRef(state.phase);

  useEffect(() => {
    saveKickupsHighScore(state.highScore);
  }, [state.highScore]);

  useEffect(() => {
    if (prevPhaseRef.current !== "grounded" && state.phase === "grounded") {
      const finalScore = state.score;
      const isNewRecord = finalScore > 0 && finalScore === state.highScore;
      setQuip({ id: Date.now(), text: pickQuip(finalScore, isNewRecord) });
      if (sfxEnabled && finalScore >= KICKUPS_TOP_TIER_MIN_SCORE) {
        playSfx(DOORMOMO_SFX_URL, sfxVolume / 100);
      }
    }
    prevPhaseRef.current = state.phase;
  }, [state.phase, state.score, state.highScore, sfxEnabled, sfxVolume]);

  useEffect(() => {
    if (!quip) return;
    const timer = setTimeout(() => setQuip(null), QUIP_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [quip]);

  const settled = state.phase === "grounded" && state.ball.vx === 0 && state.ball.vy === 0;
  useEffect(() => {
    if (state.phase === "idle" || settled) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setState((current) => stepPhysics(current, dt));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state.phase, settled]);

  function handleStart() {
    setState((current) => startDrop(current));
  }

  const lastClickAtRef = useRef(0);

  function handleCanvasClick(x: number, y: number) {
    const now = performance.now();
    if (now - lastClickAtRef.current < CLICK_DEDUPE_MS) return;
    lastClickAtRef.current = now;

    const next =
      state.phase === "airborne"
        ? applyHit(state, x, y)
        : state.phase === "grounded"
          ? applyRelaunch(state, x, y)
          : state;
    if (next === state) return;

    if (sfxEnabled) playSfx(BALL_BOUNCE_SFX_URL, sfxVolume / 100);
    setState(next);
  }

  return { state, quip, handleStart, handleCanvasClick };
}
