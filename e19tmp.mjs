import fs from "node:fs";
const edit = (f, pairs) => { let s = fs.readFileSync(f, "utf8"); for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error(f + ": " + a.slice(0, 60)); s = s.split(a).join(b); } fs.writeFileSync(f, s); };
edit("src/web/pitch/data/assetMeta.generated.ts", [['"ui/terminal-frame": { bytes: 34660, w: 231, h: 164, slice: 24 },', '"ui/terminal-frame": { bytes: 18494, w: 896, h: 492 },']]);
edit("src/web/pitch/__tests__/lockerAssets.test.ts", [['expect(size("ui/terminal-frame").slice).toBe(24);', 'expect(size("ui/terminal-frame")).toMatchObject({ w: 896, h: 492 });\n    expect(size("ui/terminal-frame").slice).toBeUndefined();']]);
edit("src/web/pitch/scenes/StatScene.ts", [
  ["      drawNineSlice(g, frame, FRAME_INSET, x, y, w, h);\n      return;", "      // made for exactly this rectangle (896×492): drawn 1:1, never stretched; the interior is x 59~902, y 69~482\n      g.drawImage(frame, x, y, w, h);\n      return;"],
  ["export const STAT_DETAIL_PANEL: Rect = { x: 512, y: 104, w: 400, h: 392 };", "export const STAT_DETAIL_PANEL: Rect = { x: 494, y: 80, w: 400, h: 392 };"],
  ["const py = 80;", "const py = 76;"],
  ['LOGICAL_WIDTH / 2, 63, { size: 20', 'LOGICAL_WIDTH / 2, 48, { size: 20'],
  ['drawText(g, "●", x, 486,', 'drawText(g, "●", x, 474,'],
  ["drawText(g, item.text, x + 14, 486,", "drawText(g, item.text, x + 14, 474,"],
  ["    let x = 56;\n    for (const item of items)", "    let x = 70;\n    for (const item of items)"],
]);
edit("src/web/pitch/ui/hexagon.ts", [["cx: 276, cy: 304, radius: 140", "cx: 276, cy: 290, radius: 140"]]);
edit("src/web/pitch/__tests__/lockerScene.test.ts", [["corner 3 (bottom) is at (276, 444)", "corner 3 (bottom) is at (276, 430)"], ["x: 276, y: 444", "x: 276, y: 430"]]);
edit("docs/pitch/05-art-world-and-ui.md", [["| `ui/terminal-frame` | 231×164, 9-slice 인셋 24 | 03 §5 의 896×492 로 늘림(모서리 볼트는 24px 고정) |", "| `ui/terminal-frame` | **896×492 고정(재생성본, 늘리지 않고 1:1)** — 프레임 안쪽(어두운 남색 본문)은 그림 기준 x 27~870·y 45~458, 즉 화면 좌표 x 59~902·y 69~482. 원본 `tmp/pitch-src/ui/terminal-frame.png`(1693×929, 마젠타 배경)를 마젠타 제거·트림·896×492 축소·알파 이진화로 직접 변환(`ui-stat` 시트 재변환 시 옛 231×164 로 덮어써지니 매니페스트 항목을 고칠 것) | 03 §5 의 프레임 |"]]);
fs.appendFileSync("docs/pitch/README.md", "| 2026-09-25 | P6(에셋 교체 2) | `ui/terminal-frame` 을 재생성본(896×492 고정)으로 교체. 안쪽 여백에 맞춰 육각형 중심 (276,304)→(276,290), 설명 패널 (512,104)→(494,80), 헤더 초상화 y 76, `PLAYER STATS` y 48, 범례 y 474·x 70 | 03 §5, 05 §7 | 화면 확인은 사용자 |\n");
