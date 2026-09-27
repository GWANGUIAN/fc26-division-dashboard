import { useState } from "react";
import { loadCleatDropSfxEnabled, loadCleatDropSfxVolume, saveCleatDropSfxEnabled, saveCleatDropSfxVolume } from "../../storage.js";
export function useCleatDropSfx() { const [sfxOn, setSfxOn] = useState(loadCleatDropSfxEnabled); const [sfxVolume, setSfxVolume] = useState(loadCleatDropSfxVolume); return { sfxOn, sfxVolume, toggleSfx: () => setSfxOn((value) => { const next = !value; saveCleatDropSfxEnabled(next); return next; }), changeSfxVolume: (value: number) => { const next = Math.round(value); setSfxVolume(next); saveCleatDropSfxVolume(next); } }; }
