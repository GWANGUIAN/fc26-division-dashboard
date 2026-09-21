import { useEffect, useRef, useState } from "react";
import { playSfx } from "../../sfxAudio.js";
import { loadKeeperBreakoutHighScore, saveKeeperBreakoutHighScore } from "../../storage.js";
import { createGame, launch, nextStage, setPaddleTarget, startGame, step, type KeeperBreakoutEvent, type KeeperBreakoutState } from "./keeperBreakoutEngine.js";
const SOUND: Record<KeeperBreakoutEvent, string> = { paddle: "/sfxes/keeper-breakout-paddle.mp3", brick: "/sfxes/keeper-breakout-brick.mp3", clank: "/sfxes/keeper-breakout-clank.mp3", powerup: "/sfxes/keeper-breakout-powerup.mp3", lifelost: "/sfxes/keeper-breakout-lifelost.mp3", stageclear: "/sfxes/keeper-breakout-stageclear.mp3", gameover: "/sfxes/keeper-breakout-gameover.mp3" };
export interface KeeperBreakoutRoundResult { game: "keeper-breakout"; score: number; cleared: boolean }
export function createKeeperBreakoutEndLatch() { let ended = false; return { claim: () => { if (ended) return false; ended = true; return true; }, reset: () => { ended = false; } }; }
export function useKeeperBreakoutGame({ sfxOn, sfxVolume, onRoundEnd }: { sfxOn: boolean; sfxVolume: number; onRoundEnd: (result: KeeperBreakoutRoundResult) => void }) {
  const [state, setState] = useState<KeeperBreakoutState>(() => createGame(1)); const latch = useRef(createKeeperBreakoutEndLatch()); const seed = useRef(1); const callback = useRef(onRoundEnd); callback.current = onRoundEnd; const sound = useRef({ on: sfxOn, volume: sfxVolume }); sound.current = { on: sfxOn, volume: sfxVolume };
  useEffect(() => { if (state.phase !== "stageclear") return; const timer = window.setTimeout(() => setState((current) => nextStage(current)), 800); return () => window.clearTimeout(timer); }, [state.phase]);
  const [highScore, setHighScore] = useState(loadKeeperBreakoutHighScore); const highScoreRef = useRef(highScore); highScoreRef.current = highScore;
  useEffect(() => { if (highScore) saveKeeperBreakoutHighScore(highScore); }, [highScore]);
  const advance = (dt: number) => { setState((current) => { const next = step(current, dt); if (next.score > highScoreRef.current) setHighScore(next.score); const events = next.events; if (sound.current.on && events.length) { const priority = events.includes("gameover") ? "gameover" : events.includes("stageclear") ? "stageclear" : events[events.length - 1]; playSfx(SOUND[priority], sound.current.volume / 100); } if ((next.phase === "over" || next.phase === "cleared") && latch.current.claim()) callback.current({ game: "keeper-breakout", score: next.score, cleared: next.phase === "cleared" }); return next; }); };
  const start = () => { latch.current.reset(); seed.current += 1; setState(startGame(seed.current)); };
  return { state, highScore, start, advance, setPaddleTarget: (x: number) => setState((current) => setPaddleTarget(current, x)), launch: () => setState((current) => launch(current)) };
}
