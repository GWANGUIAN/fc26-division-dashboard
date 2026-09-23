import { useState } from "react";
import { loadPositionTestSfxEnabled, savePositionTestSfxEnabled } from "../storage";

export function usePositionTestSfx() {
  const [sfxOn, setSfxOn] = useState(loadPositionTestSfxEnabled);

  function toggleSfx() {
    setSfxOn((current) => {
      const next = !current;
      savePositionTestSfxEnabled(next);
      return next;
    });
  }

  return { sfxOn, toggleSfx };
}
