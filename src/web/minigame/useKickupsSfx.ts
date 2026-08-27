import { useState } from "react";
import { loadKickupsSfxEnabled, saveKickupsSfxEnabled } from "../storage";

export function useKickupsSfx() {
  const [sfxOn, setSfxOn] = useState(loadKickupsSfxEnabled);

  function toggleSfx() {
    setSfxOn((current) => {
      const next = !current;
      saveKickupsSfxEnabled(next);
      return next;
    });
  }

  return { sfxOn, toggleSfx };
}
