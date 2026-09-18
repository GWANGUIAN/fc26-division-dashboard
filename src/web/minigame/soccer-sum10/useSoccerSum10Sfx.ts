import { useState } from "react";
import {
  loadSoccerSum10SfxEnabled,
  loadSoccerSum10SfxVolume,
  saveSoccerSum10SfxEnabled,
  saveSoccerSum10SfxVolume,
} from "../../storage.js";

export function useSoccerSum10Sfx() {
  const [sfxOn, setSfxOn] = useState(loadSoccerSum10SfxEnabled);
  const [sfxVolume, setSfxVolume] = useState(loadSoccerSum10SfxVolume);
  function toggleSfx() {
    setSfxOn((current) => {
      const next = !current;
      saveSoccerSum10SfxEnabled(next);
      return next;
    });
  }
  function changeSfxVolume(value: number) {
    setSfxVolume(value);
    saveSoccerSum10SfxVolume(value);
  }
  return { sfxOn, sfxVolume, toggleSfx, changeSfxVolume };
}
