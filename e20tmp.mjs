import fs from "node:fs";
const edit = (f, pairs) => { let s = fs.readFileSync(f, "utf8"); for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error(f + ": " + a.slice(0, 60)); s = s.split(a).join(b); } fs.writeFileSync(f, s); };
edit("scripts/convert-pitch-art.mjs", [["M.coverCropRect(raster.width, raster.height, 960, 540))", "M.coverCropRect(raster.width, raster.height, 960, 540, 0.5, cfg.anchorY ?? 0.5))"]]);
edit("scripts/pitch-art-manifest.json", [['"locker-bg": { "file": "env-locker-bg.png", "scene": true },', '"locker-bg": { "file": "env-locker-bg-v2.png", "scene": true, "anchorY": 0.75 },']]);
