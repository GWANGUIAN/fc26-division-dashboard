import { useState } from "react";
import { loadFortuneSfxEnabled, saveFortuneSfxEnabled } from "../storage";

export function useFortuneSfx() {
  const [sfxOn, setSfxOn] = useState(loadFortuneSfxEnabled);

  function toggleSfx() {
    setSfxOn((current) => {
      const next = !current;
      saveFortuneSfxEnabled(next);
      return next;
    });
  }

  return { sfxOn, toggleSfx };
}
