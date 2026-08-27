import { useEffect, useRef, useState } from "react";
import {
  loadFreekickMusicEnabled,
  loadFreekickMusicVolume,
  saveFreekickMusicEnabled,
  saveFreekickMusicVolume,
} from "../storage";

const MUSIC_SRC = "/sfxes/background-freekick.mp3";

/** Loops the minigame's background track independently of the one-shot sfx player, so it isn't
 * cut off every time a strike/goal sfx plays via the shared `playSfx` slot. */
export function useFreekickMusic() {
  const [musicOn, setMusicOn] = useState(loadFreekickMusicEnabled);
  const [musicVolume, setMusicVolume] = useState(loadFreekickMusicVolume);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(MUSIC_SRC);
    audio.loop = true;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = musicVolume / 100;
  }, [musicVolume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (musicOn) audio.play().catch(() => {});
    else audio.pause();
  }, [musicOn]);

  function toggleMusic() {
    setMusicOn((current) => {
      const next = !current;
      saveFreekickMusicEnabled(next);
      return next;
    });
  }

  function changeMusicVolume(value: number) {
    setMusicVolume(value);
    saveFreekickMusicVolume(value);
  }

  return { musicOn, toggleMusic, musicVolume, changeMusicVolume };
}
