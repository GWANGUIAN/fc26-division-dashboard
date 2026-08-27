import { useState } from "react";
import { loadFreekickSfxEnabled, saveFreekickSfxEnabled } from "../storage";

export function useFreekickSfx() {
  const [sfxOn, setSfxOn] = useState(loadFreekickSfxEnabled);

  function toggleSfx() {
    setSfxOn((current) => {
      const next = !current;
      saveFreekickSfxEnabled(next);
      return next;
    });
  }

  return { sfxOn, toggleSfx };
}
