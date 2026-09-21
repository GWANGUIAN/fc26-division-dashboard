import { useState } from "react";
import {
  loadGrassMergeSfxEnabled,
  loadGrassMergeSfxVolume,
  saveGrassMergeSfxEnabled,
  saveGrassMergeSfxVolume,
} from "../../storage.js";

export function useGrassMergeSfx() {
  const [sfxOn, setSfxOn] = useState(loadGrassMergeSfxEnabled);
  const [sfxVolume, setSfxVolume] = useState(loadGrassMergeSfxVolume);
  function toggleSfx() {
    setSfxOn((current) => {
      const next = !current;
      saveGrassMergeSfxEnabled(next);
      return next;
    });
  }
  function changeSfxVolume(value: number) {
    setSfxVolume(value);
    saveGrassMergeSfxVolume(value);
  }
  return { sfxOn, sfxVolume, toggleSfx, changeSfxVolume };
}
