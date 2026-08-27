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
const GAME_OVER_SFX_URL = "/sfxes/game-over.mp3";
const BALL_BOUNCE_SFX_URL = "/sfxes/ball-bounce.mp3";
const QUIP_VISIBLE_MS = 3200;
// Some devices/browsers fire two pointerdown events (e.g. touch + compatibility mouse event) for
// a single physical tap; without this guard that double-counts one click as two hits.
const CLICK_DEDUPE_MS = 120;

export function useKickupsGame({
  sfxOn,
  sfxVolume,
}: {
  sfxOn: boolean;
  sfxVolume: number;
}) {
  const [state, setState] = useState<GameState>(() => createInitialState(loadKickupsHighScore()));
  const [quip, setQuip] = useState<{ id: number; text: string } | null>(null);
  const prevPhaseRef = useRef(state.phase);

  // The authoritative, continuously-updated game state during a run. Physics steps mutate this
  // every animation frame without going through React state (and its re-render of the whole modal
  // tree) — React state is only synced at UI-relevant checkpoints (see the tick loop below).
  const liveStateRef = useRef(state);

  useEffect(() => {
    saveKickupsHighScore(state.highScore);
  }, [state.highScore]);

  useEffect(() => {
    if (prevPhaseRef.current !== "grounded" && state.phase === "grounded") {
      const finalScore = state.score;
      const isNewRecord = finalScore > 0 && finalScore === state.highScore;
      setQuip({ id: Date.now(), text: pickQuip(finalScore, isNewRecord) });
      if (sfxOn) {
        if (finalScore >= KICKUPS_TOP_TIER_MIN_SCORE) {
          playSfx(DOORMOMO_SFX_URL, sfxVolume / 100);
        } else {
          playSfx(GAME_OVER_SFX_URL, sfxVolume / 100);
        }
      }
    }
    prevPhaseRef.current = state.phase;
  }, [state.phase, state.score, state.highScore, sfxOn, sfxVolume]);

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

      const prev = liveStateRef.current;
      const next = stepPhysics(prev, dt);
      liveStateRef.current = next;

      // Only push into React state (and trigger a re-render) at checkpoints the UI actually
      // cares about — landing and coming to rest — not on every one of the ~60 physics steps/sec.
      const justSettled =
        next.phase === "grounded" &&
        next.ball.vx === 0 &&
        next.ball.vy === 0 &&
        (prev.ball.vx !== 0 || prev.ball.vy !== 0);
      if (next.phase !== prev.phase || justSettled) {
        setState(next);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state.phase, settled]);

  function handleStart() {
    const next = startDrop(liveStateRef.current);
    if (next === liveStateRef.current) return;
    liveStateRef.current = next;
    setState(next);
  }

  const lastClickAtRef = useRef(0);
  const lastRelaunchAtRef = useRef(0);

  function handleCanvasClick(x: number, y: number) {
    const now = performance.now();
    if (now - lastClickAtRef.current < CLICK_DEDUPE_MS) return;
    lastClickAtRef.current = now;

    const current = liveStateRef.current;

    // A relaunch flips phase to "airborne" the instant it's processed, before the ball has
    // visibly moved. If a duplicate/compatibility pointer event for that same physical tap slips
    // past the dedupe window above, it lands here reading "airborne" and gets treated as a real
    // in-air hit — overwriting the clean straight-up launch with direction-dependent hit physics
    // computed from the same click position, which can send the ball right back down instantly
    // (looking like the relaunch silently failed). Ignore any "hit" that arrives this soon after
    // a relaunch; no legitimate follow-up hit needs to land within a fifth of a second of the ball
    // leaving the ground.
    const RELAUNCH_HIT_GUARD_MS = 200;
    if (current.phase === "airborne" && now - lastRelaunchAtRef.current < RELAUNCH_HIT_GUARD_MS) return;

    const wasGrounded = current.phase === "grounded";
    const next =
      current.phase === "airborne"
        ? applyHit(current, x, y)
        : wasGrounded
          ? applyRelaunch(current, x, y)
          : current;
    if (next === current) return;

    liveStateRef.current = next;
    if (wasGrounded) lastRelaunchAtRef.current = now;
    if (sfxOn) playSfx(BALL_BOUNCE_SFX_URL, sfxVolume / 100);
    setState(next);
  }

  return { state, liveStateRef, quip, handleStart, handleCanvasClick };
}
