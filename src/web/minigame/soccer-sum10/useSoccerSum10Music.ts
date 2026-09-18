import { useEffect, useRef, useState } from "react";
import {
  loadSoccerSum10MusicEnabled,
  loadSoccerSum10MusicVolume,
  saveSoccerSum10MusicEnabled,
  saveSoccerSum10MusicVolume,
} from "../../storage.js";

const MUSIC_SRC = "/soccer-sum10-bgm.mp3";

export function useSoccerSum10Music() {
  const [musicOn, setMusicOn] = useState(loadSoccerSum10MusicEnabled);
  const [musicVolume, setMusicVolume] = useState(loadSoccerSum10MusicVolume);
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
    if (!audio) return;
    audio.volume = musicVolume / 100;
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
      saveSoccerSum10MusicEnabled(next);
      return next;
    });
  }

  function changeMusicVolume(value: number) {
    setMusicVolume(value);
    saveSoccerSum10MusicVolume(value);
  }

  return {
    musicOn,
    musicVolume,
    toggleMusic,
    changeMusicVolume,
    startMusic: () => setGameHasStarted(true),
    stopMusic: () => setGameHasStarted(false),
  };
}
