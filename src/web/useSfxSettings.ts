import { useState } from "react";
import {
  loadSfxEnabled,
  loadSfxVolume,
  SFX_ENABLED_STORAGE_KEY,
  SFX_VOLUME_STORAGE_KEY,
} from "./storage";

export function useSfxSettings() {
  const [sfxEnabled, setSfxEnabled] = useState(loadSfxEnabled);
  const [sfxVolume, setSfxVolume] = useState(loadSfxVolume);
  const [sfxIntroVisible, setSfxIntroVisible] = useState(false);

  function persistSfxEnabled(next: boolean) {
    setSfxEnabled(next);
    try {
      localStorage.setItem(SFX_ENABLED_STORAGE_KEY, next ? "1" : "0");
    } catch {
      // ignore storage failures (e.g. private browsing)
    }
  }
  function toggleSfx() {
    persistSfxEnabled(!sfxEnabled);
  }
  function changeSfxVolume(value: number) {
    setSfxVolume(value);
    try {
      localStorage.setItem(SFX_VOLUME_STORAGE_KEY, String(value));
    } catch {
      // ignore storage failures (e.g. private browsing)
    }
    if (value === 0 && sfxEnabled) persistSfxEnabled(false);
    else if (value > 0 && !sfxEnabled) persistSfxEnabled(true);
  }

  return {
    sfxEnabled,
    sfxVolume,
    sfxIntroVisible,
    toggleSfx,
    changeSfxVolume,
    setSfxIntroVisible,
  };
}
