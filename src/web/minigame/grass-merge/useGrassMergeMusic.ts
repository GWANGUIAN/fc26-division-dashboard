import { useEffect, useRef, useState } from "react";
import {
  loadGrassMergeMusicEnabled,
  loadGrassMergeMusicVolume,
  saveGrassMergeMusicEnabled,
  saveGrassMergeMusicVolume,
} from "../../storage.js";

const MUSIC_SRC = "/grass-merge-bgm.mp3";

export function useGrassMergeMusic() {
  const [musicOn, setMusicOn] = useState(loadGrassMergeMusicEnabled);
  const [musicVolume, setMusicVolume] = useState(loadGrassMergeMusicVolume);
  const [gameHasStarted, setGameHasStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(MUSIC_SRC);
    audio.loop = true;
    audio.preload = "auto";
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = musicVolume / 100;
  }, [musicVolume]);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (musicOn && gameHasStarted) audio.play().catch(() => {});
    else audio.pause();
  }, [gameHasStarted, musicOn]);

  function toggleMusic() {
    setMusicOn((current) => {
      const next = !current;
      saveGrassMergeMusicEnabled(next);
      return next;
    });
  }
  function changeMusicVolume(value: number) {
    setMusicVolume(value);
    saveGrassMergeMusicVolume(value);
  }
  return {
    musicOn, musicVolume, toggleMusic, changeMusicVolume,
    startMusic: () => setGameHasStarted(true), stopMusic: () => setGameHasStarted(false),
  };
}
