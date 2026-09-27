import { useCallback, useEffect, useRef, useState } from "react";
import {
  STAGE_COUNT, advanceStage, createGame, releasePendulum, retryStage, stepPhysics, swingLeg, type CleatDropState,
} from "./cleatDropEngine";
import { STAGES } from "./cleatDropStages";
import { isAllCleared, loadProgress, saveProgress, type CleatDropProgress } from "./cleatDropProgress";
import { playCleatDropSfx } from "./cleatDropSfxMap";

export interface CleatDropRoundResult {
  game: "cleat-drop";
  /** Total attempts (successes + failures) it took to clear all 30 stages. */
  attempts: number;
}

/** Pause after a clear before auto-advancing to the next stage (lets the fanfare and gauge read). */
const ADVANCE_DELAY_MS = 900;
/** Pause after a failure before resetting — "즉시 리셋" (1-1 규칙 8), but not so instant it feels like a glitch. */
const RETRY_DELAY_MS = 550;
/** Cadence of the low-volume S8 timer-tick while the 3-second hold gauge fills. */
const TIMER_TICK_INTERVAL_SECONDS = 0.5;
/** Below this restitution a target reads as "soft" (cloth/foam); at or above it reads as "hard" (metal/plastic). */
const HARD_BOUNCE_RESTITUTION_THRESHOLD = 0.4;

/** First stage not yet cleared, or the last stage if every one already is (docs/minigame-cleat-drop.md §5). */
export function firstUnclearedStage(progress: CleatDropProgress): number {
  const index = progress.cleared.findIndex((cleared) => !cleared);
  return index === -1 ? STAGE_COUNT - 1 : index;
}

/** Lets the all-clear callback/sound fire exactly once per load, even once `allClearLatched` stays true forever after. */
export function createCleatDropAllClearLatch() {
  let announced = false;
  return { claim: () => !announced && (announced = true), reset: () => { announced = false; } };
}

export function useCleatDropGame({
  sfxOn,
  sfxVolume,
  onAllClear,
}: {
  sfxOn: boolean;
  sfxVolume: number;
  onAllClear?: (result: CleatDropRoundResult) => void;
}) {
  const [initialProgress] = useState(loadProgress);
  const [state, setState] = useState<CleatDropState>(() => createGame(firstUnclearedStage(initialProgress), initialProgress));
  const [showAllClear, setShowAllClear] = useState(() => isAllCleared(initialProgress));

  const stateRef = useRef(state);
  stateRef.current = state;
  const prevRef = useRef(state);
  const sound = useRef({ on: sfxOn, volume: sfxVolume });
  sound.current = { on: sfxOn, volume: sfxVolume };
  const callback = useRef(onAllClear);
  callback.current = onAllClear;
  const latchRef = useRef<ReturnType<typeof createCleatDropAllClearLatch> | null>(null);
  if (!latchRef.current) {
    latchRef.current = createCleatDropAllClearLatch();
    // Already fully cleared from a previous session: the completion screen shows again, but silently.
    if (showAllClear) latchRef.current.claim();
  }

  // Persists cleared/attempts/attemptsByStage whenever an attempt actually resolves (never on the
  // per-frame physics updates in between, since those never touch these three fields).
  useEffect(() => {
    saveProgress({ version: 1, cleared: state.cleared, attempts: state.attempts, attemptsByStage: state.attemptsByStage });
  }, [state.cleared, state.attempts, state.attemptsByStage]);

  // The physics clock: runs while a boot is actually in motion, stops once the game is fully cleared.
  useEffect(() => {
    if (showAllClear) return;
    if (state.phase !== "pendulum" && state.phase !== "falling" && state.phase !== "flight") return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const next = stepPhysics(stateRef.current, dt);
      stateRef.current = next;
      setState(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state.phase, showAllClear]);

  // Clear → next stage, fail → retry, both automatic (1-1 규칙 8, 9) — except the 30th clear, which
  // hands off to the completion screen instead of advancing into a non-existent 31st stage.
  useEffect(() => {
    if (showAllClear) return;
    if (state.phase === "cleared" && !state.allClearLatched) {
      const timer = setTimeout(() => {
        const next = advanceStage(stateRef.current);
        stateRef.current = next;
        setState(next);
      }, ADVANCE_DELAY_MS);
      return () => clearTimeout(timer);
    }
    if (state.phase === "failed") {
      const timer = setTimeout(() => {
        const next = retryStage(stateRef.current);
        stateRef.current = next;
        setState(next);
      }, RETRY_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.allClearLatched, showAllClear]);

  // One-shot: the instant stage 30 clears, show the completion screen and report the total.
  useEffect(() => {
    if (!state.allClearLatched || !latchRef.current!.claim()) return;
    setShowAllClear(true);
    if (sound.current.on) playCleatDropSfx("all-clear", sound.current.volume / 100);
    callback.current?.({ game: "cleat-drop", attempts: state.attempts });
  }, [state.allClearLatched, state.attempts]);

  // Every other sound cue (§7-2) is inferred by diffing consecutive physics states — the engine
  // itself stays free of any notion of audio.
  useEffect(() => {
    const prev = prevRef.current;
    const next = state;
    if (sound.current.on) {
      const volume = sound.current.volume / 100;
      if (!prev.leg.hasContacted && next.leg.hasContacted) playCleatDropSfx("kick-impact", volume);
      if (prev.phase !== "failed" && next.phase === "failed") {
        playCleatDropSfx(prev.phase === "falling" ? "miss-ground" : "slip-off", volume);
      }
      if (prev.phase === "flight" && next.phase === "flight") {
        if (!prev.resting && next.resting && next.holdTimer > 0) playCleatDropSfx("land-settle", volume);
        if (prev.boot.vy > 0 && next.boot.vy < 0 && !next.resting) {
          const stage = STAGES[next.stageIndex]!;
          playCleatDropSfx(stage.restitution < HARD_BOUNCE_RESTITUTION_THRESHOLD ? "bounce-soft" : "bounce-hard", volume);
        }
        if (next.resting && next.holdTimer > 0) {
          const bucket = Math.floor(next.holdTimer / TIMER_TICK_INTERVAL_SECONDS);
          if (bucket > Math.floor(prev.holdTimer / TIMER_TICK_INTERVAL_SECONDS)) playCleatDropSfx("timer-tick", volume);
        }
      }
      if (prev.phase !== "cleared" && next.phase === "cleared" && !next.allClearLatched) playCleatDropSfx("stage-clear", volume);
    }
    prevRef.current = next;
  }, [state]);

  const onRelease = useCallback(() => {
    const current = stateRef.current;
    if (current.phase !== "pendulum") return;
    const next = releasePendulum(current, current.t);
    stateRef.current = next;
    setState(next);
    if (sound.current.on) playCleatDropSfx("lace-release", sound.current.volume / 100);
  }, []);

  const onSwing = useCallback(() => {
    const current = stateRef.current;
    if (current.phase !== "falling" || current.leg.swinging || current.leg.hasContacted) return;
    const next = swingLeg(current, current.t);
    stateRef.current = next;
    setState(next);
    if (sound.current.on) playCleatDropSfx("leg-swing", sound.current.volume / 100);
  }, []);

  return { state, showAllClear, onRelease, onSwing };
}
