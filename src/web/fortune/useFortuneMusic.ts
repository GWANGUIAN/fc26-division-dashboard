import { useEffect, useRef, useState } from "react";
import {
  loadFortuneMusicEnabled,
  loadFortuneMusicVolume,
  saveFortuneMusicEnabled,
  saveFortuneMusicVolume,
} from "../storage";

const MUSIC_SRC = "/fortune-bgm.mp3";

/** Loops the fortune popup's mystical BGM independently of the one-shot sfx
 * player, same reasoning as useKickupsMusic.ts — so it isn't cut off every
 * time a shuffle/hover/select sfx plays via the shared playSfx slot. */
export function useFortuneMusic() {
  const [musicOn, setMusicOn] = useState(loadFortuneMusicEnabled);
  const [musicVolume, setMusicVolume] = useState(loadFortuneMusicVolume);
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
      saveFortuneMusicEnabled(next);
      return next;
    });
  }

  function changeMusicVolume(value: number) {
    setMusicVolume(value);
    saveFortuneMusicVolume(value);
  }

  return { musicOn, toggleMusic, musicVolume, changeMusicVolume };
}
