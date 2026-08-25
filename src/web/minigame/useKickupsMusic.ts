import { useEffect, useRef, useState } from "react";
import { loadKickupsMusicEnabled, saveKickupsMusicEnabled } from "../storage";

const MUSIC_SRC = "/background-mini-game.mp3";
const MUSIC_VOLUME = 0.35;

/** Loops the minigame's background track independently of the one-shot sfx player, so it isn't
 * cut off every time a kick/goal sfx plays via the shared `playSfx` slot. */
export function useKickupsMusic() {
  const [musicOn, setMusicOn] = useState(loadKickupsMusicEnabled);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(MUSIC_SRC);
    audio.loop = true;
    audio.volume = MUSIC_VOLUME;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (musicOn) audio.play().catch(() => {});
    else audio.pause();
  }, [musicOn]);

  function toggleMusic() {
    setMusicOn((current) => {
      const next = !current;
      saveKickupsMusicEnabled(next);
      return next;
    });
  }

  return { musicOn, toggleMusic };
}
