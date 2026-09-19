/**
 * docs/world/10-image-generation-runbook.md 생성 스크립트.
 *
 * 04~06 문서(프롬프트의 원천)를 읽어 **공통 문구를 각 프롬프트에 풀어 넣은 독립 프롬프트**를
 * 순차 실행 순서(#001~)와 스레드 배정과 함께 하나의 문서로 만든다.
 *
 * 실행: node docs/world/tools/build-image-runbook.mjs
 * 04~06을 고친 뒤 다시 실행하면 10번 문서가 갱신된다(10번 문서를 직접 고친 내용은 덮어써진다).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(here, "..");
const read = (f) => fs.readFileSync(path.join(docsDir, f), "utf8");
const d04 = read("04-art-characters.md");
const d05 = read("05-art-world.md");
const d06 = read("06-art-ui.md");

// ───────────────────────── 공통 문구(각 프롬프트에 인라인) ─────────────────────────
const SPRITE_STYLE =
  "Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.";
const CAM = "Camera: classic 3/4 top-down RPG view (about 45 degrees).";
const CHIBI =
  "Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.";
const CLUB =
  "The football club 잔디동 wears a white kit with mint-green (#2ee8b6) trim and a small text-free mint shield-with-sprout crest.";
const BG =
  "Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.";
const UI_LANG =
  "Design language: dark teal panels (#0b1614) with mint (#00e9ae) pixel trim and small leaf-shaped corner ornaments, cream paper for parchment items, warm gold accents (#ffd54a), matching the 잔디동 football club identity (mint and white, sprout shield).";
const SAMPLE =
  "If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.";
const HEAD_SPRITE = `${SPRITE_STYLE} ${CAM} ${CHIBI}`;

// ───────────────────────── 원천 문서 파싱 ─────────────────────────
const sheetBlocks = (doc, headingRe) => {
  const out = {};
  const re = new RegExp(headingRe + "[^\\n]*\\n`THEME`: `([^`]+)`\\n`LIST`: `([^`]+)`", "g");
  for (const m of doc.matchAll(re)) out[m[1]] = { theme: m[2], list: m[3] };
  return out;
};
const terrain = sheetBlocks(d05, "### 1-\\d+\\. `terrain-(\\w+)`");
const props = sheetBlocks(d05, "### 2-\\d+\\. `props-(\\w+)`");
const fx = sheetBlocks(d05, "### 6-\\d+\\. `fx-(\\w+)`");
const icons = {};
for (const m of d06.matchAll(/### 7-\d+\. `ui-(icons-mission|icons-menu|badges)`[^\n]*\n`LIST`: `([^`]+)`/g)) icons[m[1]] = { list: m[2] };

const buildings = {};
for (const m of d05.matchAll(/^\| `([\w-]+)` \| `bld-[\w-]+\.png` \| (\d+×\d+) \| (\d+×\d+) \| (.+) \|$/gm))
  buildings[m[1]] = { canvas: m[2], final: m[3], desc: m[4] };
const interiors = {};
for (const m of d05.matchAll(/^\| `([\w-]+)` \| `int-[\w-]+\.png` \| (.+?) \| ([^|]+) \|$/gm))
  interiors[m[1]] = { room: m[2], layout: m[3] };

const defaultOutfit = /기본 OUTFIT\(멤버 공통\)\*\*: `([^`]+)`/.exec(d04)[1];
const memberRows = {};
for (const m of d04.matchAll(/^\| `(\w+)` \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$/gm)) {
  let outfit = m[5].trim();
  outfit = outfit.includes("기본 OUTFIT") ? defaultOutfit : outfit.replace(/\*\*/g, "").replace(/`/g, "").replace(/\s*\(기본 키트 아님\)/, "");
  memberRows[m[1]] = { name: m[2].trim(), signature: m[3].trim(), arms: m[4].trim(), outfit };
}
const originals = {};
for (const m of d04.matchAll(/^\| `([\w-]+)` \| ([^|]+) \| ([^|]+) \| `char-[\w-]+\*\.png` \|$/gm))
  originals[m[1]] = { name: m[2].trim(), desc: m[3].trim() };
const animalPrompt = (id) => new RegExp("### `" + id + "`[^\\n]*\\n\\n```text\\n([\\s\\S]*?)```").exec(d04)[1].trim();

const uiBlocks = [...d06.matchAll(/```text\n([\s\S]*?)```/g)].map((m) => m[1].trim());
const [uiFab, uiLoading, uiTitle, uiLogo, uiFramesA, uiFramesB, uiButtons, uiSelectBg, uiSelectCards] = uiBlocks;
const rushRow = (id) => new RegExp("^\\| `" + id + "` \\| `rush-[\\w-]+\\.png` \\| [^|]+ \\| [^|]+ \\| `([^`]+)` \\|$", "m").exec(d05)[1];
const rushObs = /`THEME: ([^`]+)`, `LIST: ([^`]+)`/.exec(d05);

const memberExtra = {
  janine95kim: "The glasses' reflections are just two white pixels.",
  bboringirl: "Make the red-pink streaks in the hair clearly visible.",
  sjh4018: "The hair is very long (down to the ankles): keep it a compact silhouette so it animates with minimal swing.",
  doormomo: "The headband badge is a text-free red block.",
  hachi97: "Leave extra empty space above the head so the horns are not cut off.",
  kaksjak0730: "Emphasise the cat-ear headphone silhouette.",
  ju010228: "The hair is very long: keep it a compact silhouette so it animates with minimal swing.",
  haepalin: "The jellyfish hairpin is made of blue and white pixel blocks.",
  tleod1818: "Keep the leaf hairpin bright green.",
  tdnlamuron: "Leave extra empty space above the ears.",
  lina0108: "The hair is voluminous: leave enough margin so nothing is cut off.",
  woowakgood: "Keep the stylised animal-like mascot head; do not turn it into a human face.",
};

// ───────────────────────── 템플릿(04·05 문서와 동일 내용) ─────────────────────────
const fill = (tpl, vars) => tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
const T_STAND_MEMBER = `Attached (first image) is the original character illustration of "{{NAME}}". Redraw this exact character as a chibi pixel-art game sprite.
Keep: the same hairstyle and hair colours, {{SIGNATURE}}, the same face vibe, and the outfit colours.
Outfit: {{OUTFIT}}
Pose: standing idle, front view (facing the camera, slightly looking down at the viewer as in a top-down RPG), arms {{ARMS}}, feet together on one baseline, full body visible with a little empty margin on all sides.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
{{EXTRA}}`;
const T_STAND_ORIGINAL = `Create an original chibi pixel-art game character sprite: {{DESC}}
Pose: standing idle, front view, arms relaxed, feet together on one baseline, full body visible with a little empty margin.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.`;
const T_TURN = `Using the attached standing sprite as the exact reference, draw the SAME character as a turnaround sheet with three standing poses side by side on one 1536x1024 canvas, evenly spaced with clear gaps:
1) front view (facing the camera), 2) right-side view (facing right, profile), 3) back view (facing away).
Rules: identical character design, palette, proportions and pixel size in all three; same scale; all feet on the exact same baseline; standing idle with arms relaxed; no motion; no shadows; keep at least 10% empty margin around each pose; do not add any text or guide lines.
{{EXTRA}}`;
const T_WALK = `Using the attached turnaround sheet as the exact reference, draw the SAME character's walk cycle as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows, each cell the same size, one pose per cell, centred, feet on the same baseline row in every cell.
Row 1 (top): walking toward the camera (front view), 4 frames.
Row 2 (middle): walking to the right (side view), 4 frames.
Row 3 (bottom): walking away from the camera (back view), 4 frames.
Frame order in every row: (1) left foot forward contact, (2) passing pose with the body slightly higher, (3) right foot forward contact, (4) passing pose with the body slightly higher. Arms swing opposite to the legs. Hair, ribbons and accessories move by at most one or two pixels.
Rules: identical design, palette, proportions and pixel size in all 12 cells; no motion blur; no shadows; no cell borders or grid lines; leave at least 10% empty margin inside every cell; no text.
{{EXTRA}}`;
const T_PORTRAIT = `Using the attached standing sprite as the exact reference, draw a dialogue portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, same pixel style as the sprite but more detailed.
Top-left: neutral, calm expression. Top-right: happy, smiling with sparkling eyes. Bottom-left: surprised, wide eyes and open mouth. Bottom-right: worried, slightly sweating, eyebrows down.
Rules: identical hairstyle, accessories and outfit colours in all four; same framing and scale; no cell borders or grid lines; no text.
{{EXTRA}}`;
const T_TERRAIN = `Create a seamless tileset texture sheet for a top-down pixel-art RPG on one 1024x1024 canvas: a strict 4x4 grid of 16 square tiles (each 256x256, no gaps, no borders, no grid lines, tiles fill the whole canvas, no transparency). EVERY tile must tile seamlessly with itself on all four edges (left edge matches right edge, top matches bottom). Straight top-down texture, no perspective, no objects casting shadows, no text. Each visible pixel block is about 8 px so the art reads as a 32x32-pixel tile. Keep large shapes bold so the texture stays readable when scaled down.
Theme: {{THEME}}
Tiles in order (left to right, top to bottom):
{{LIST}}`;
const T_PROPS = `Create a pixel-art prop sheet for a top-down 3/4-view RPG on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows (12 cells, each 384x341), exactly one object per cell, centred and filling about 80% of its cell. Transparent background (or flat #FF00FF), no ground plane, NO cast shadow on the ground, light from the top-left, no cell borders or grid lines, at least 8% empty margin inside every cell, no text or letters.
Theme: {{THEME}}
Objects in order (left to right, top to bottom):
{{LIST}}`;
const T_BUILDING = `Draw a single building for a top-down 3/4-view pixel-art RPG (classic Pokemon/Zelda camera: you see the front facade and the roof from above at about 45 degrees). {{DESC}}
Rules: the door is at the bottom centre of the front facade with a small step; transparent background (or flat #FF00FF); NO ground, NO cast shadow, NO grass around the base; the building fills about 90% of the canvas width and sits on the bottom edge; light from the top-left; no text or letters anywhere (signs and boards are blank shapes, emblems are text-free); crisp pixel outline, three-step shading.
Canvas: {{CANVAS}}.`;
const T_INTERIOR = `Draw a single-screen interior of {{ROOM}} for a top-down 3/4-view pixel-art RPG (classic Pokemon/Stardew interior: cutaway room with the back wall and side walls visible, the floor seen from about 45 degrees). Landscape 1536x1024; the room fills the frame edge to edge with a thin dark wall border. Keep a clear open floor area in the lower-middle for walking and a door opening with a small doormat at the bottom centre. {{LAYOUT}}
Rules: no characters, no people; no readable text or letters anywhere (papers, boards and screens show abstract shapes); light from the top-left; crisp pixel outline, three-step shading; warm and cosy. Furniture is placed as described (left/right are from the viewer's view).`;
const iconHead = (kind) =>
  `Create a pixel-art UI ${kind} sheet for a game on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows (12 cells, each 384x341), exactly one icon per cell, centred, transparent background (or flat #FF00FF), no cell borders or grid lines, at least 10% empty margin in each cell, no text or letters. Each icon is a simple bold symbol on a small round or square plate, readable at 32x32 px. ${UI_LANG}`;
const frameHead = uiFramesA.split("\nElements in order")[0];
const framesElements = (block) => "Elements in order" + block.split("Elements in order")[1];

// ───────────────────────── 스텝 정의 ─────────────────────────
const items = [];
const out = (p) => `tmp/world-src/${p}`;
const step = (o) => items.push(o);
const REF = (label, file, opt = false) => ({ label, file, opt });
const cutout = (id) => REF("캐릭터 원본 일러스트(전신 컷아웃)", `src/web/assets/group-photo/${id}.webp`);
const cardRef = (id) => REF("(선택) 카드 테마 색·모티프 참고", `src/web/assets/toty-cards/${id}-background.webp`, true);
const sampleRef = (file, label = "(선택) 톤 통일용 승인된 결과 1장") => REF(label, file, true);

function addChar(id, pri, { first = false, kind }) {
  const thread = `T-CH-${id}`;
  const isMember = kind === "member";
  const row = memberRows[id];
  const extra = memberExtra[id] ?? "";
  const nm = row?.name ?? originals[id]?.name;
  const styleSample = "tmp/world-src/characters/char-janine95kim-stand.png";
  const standPrompt = isMember
    ? [HEAD_SPRITE, id === "woowakgood" ? "" : CLUB, BG, first ? "" : SAMPLE, "",
       fill(T_STAND_MEMBER, { NAME: row.name, SIGNATURE: row.signature, OUTFIT: row.outfit, ARMS: row.arms, EXTRA: extra })]
    : [HEAD_SPRITE, BG, first ? "" : SAMPLE, "", fill(T_STAND_ORIGINAL, { DESC: originals[id].desc })];
  step({
    id: `char-${id}-stand`, title: `${nm} — ① stand (정면 서기 마스터)`, thread, cat: "characters", canvas: "1024×1024", pri,
    refs: isMember ? [cutout(id), ...(first ? [] : [sampleRef(styleSample)])] : first ? [] : [sampleRef(styleSample)],
    prompt: standPrompt.filter((x) => x !== "").join("\n"),
    qa: isMember ? "배경 투명/마젠타 단색, 글자 없음, 레퍼런스의 헤어 색·소품 유지, 전신이 잘리지 않음" : "배경 투명/마젠타 단색, 글자 없음, 설명한 외형·색 반영, 전신이 잘리지 않음",
    convert: `characters ${id}`,
  });
  step({
    id: `char-${id}-turn`, title: `${nm} — ② turn (3방향 서기)`, thread, cat: "characters", canvas: "1536×1024", pri,
    refs: [REF("① 결과", out(`characters/char-${id}-stand.png`))],
    prompt: [HEAD_SPRITE, BG, "", fill(T_TURN, { EXTRA: extra })].join("\n").trim(),
    qa: "정면·우측·후면 3컷 크기·발끝 기준선 동일, 후면 뒷모습(머리 길이·장식) 자연스러움",
    convert: `characters ${id}`,
  });
  step({
    id: `char-${id}-walk`, title: `${nm} — ③ walk (걷기 4프레임×3방향)`, thread, cat: "characters", canvas: "1536×1024", pri,
    refs: [REF("② 결과", out(`characters/char-${id}-turn.png`))],
    prompt: [HEAD_SPRITE, BG, "", fill(T_WALK, { EXTRA: extra })].join("\n").trim(),
    qa: "4×3 그리드 12칸 모두 같은 크기·같은 캐릭터, 발끝 행 동일, 칸 경계선 없음, 인접 칸으로 삐져나온 부분 없음",
    convert: `characters ${id}`,
  });
  step({
    id: `char-${id}-portrait`, title: `${nm} — ④ portrait (표정 4종 2×2)`, thread, cat: "characters", canvas: "1024×1024", pri,
    refs: [REF("① 결과", out(`characters/char-${id}-stand.png`))],
    prompt: [HEAD_SPRITE, BG, "", fill(T_PORTRAIT, { EXTRA: extra })].join("\n").trim(),
    qa: "4칸 표정 구분 명확(기본/기쁨/놀람/걱정), 헤어·소품 동일, 프레이밍 동일",
    convert: `characters ${id}`,
  });
}

function addAnimals(pri) {
  const thread = "T-ANIMALS";
  for (const id of ["cat-jandi", "dog-ball"]) {
    step({
      id: `char-${id}-walk`, title: `${id === "cat-jandi" ? "잔디냥" : "공돌이"} — walk 시트`, thread, cat: "characters", canvas: "1536×1024", pri,
      refs: [sampleRef(out("characters/char-janine95kim-walk.png"), "(선택) 픽셀 크기·외곽선 톤 통일용 승인 결과 1장")],
      prompt: [SPRITE_STYLE, CAM, BG, SAMPLE, "", animalPrompt(id)].join("\n"),
      qa: "4×3 그리드 12칸, 발(paw) 행 동일, 같은 크기, 칸 경계선 없음",
      convert: `characters ${id}`,
    });
  }
}

const firstOfCat = {};
function addTerrain(name, pri, thread = "T-TERRAIN") {
  const t = terrain[name];
  const first = !firstOfCat.terrain;
  firstOfCat.terrain = true;
  step({
    id: `terrain-${name}`, title: `지면 시트 — ${name}`, thread, cat: "terrain", canvas: "1024×1024 (4×4)", pri,
    refs: first ? [] : [sampleRef(out("terrain/terrain-core.png"), "(선택) 톤 통일용 terrain-core 결과")],
    prompt: [SPRITE_STYLE, first ? "" : SAMPLE, "", fill(T_TERRAIN, { THEME: t.theme, LIST: t.list })].filter((x, i) => x !== "" || i === 2).join("\n"),
    qa: "16칸 모두 꽉 채워짐, 타일 사이 경계선 없음, 가장자리가 이어져 보임, 글자/그림자 없음",
    convert: `terrain ${name}`,
  });
}
function addProps(name, pri, thread) {
  const p = props[name];
  const first = !firstOfCat.props;
  firstOfCat.props = true;
  step({
    id: `props-${name}`, title: `소품 시트 — ${name}`, thread, cat: "props", canvas: "1536×1024 (4×3)", pri,
    refs: first ? [] : [sampleRef(out("props/props-trees.png"), "(선택) 톤 통일용 props-trees 결과")],
    prompt: [SPRITE_STYLE, CAM, first ? "" : SAMPLE, "", fill(T_PROPS, { THEME: p.theme, LIST: p.list })].filter((x, i) => x !== "" || i === 3).join("\n"),
    qa: "12칸에 오브젝트 1개씩, 각 칸 중앙·80% 크기, 바닥 그림자/배경 잔여물 없음, 칸 경계선 없음",
    convert: `props ${name}`,
  });
}
function addBuilding(id, pri, thread, sampleFile) {
  const b = buildings[id];
  const isHouse = id.startsWith("house-");
  const refs = [];
  if (isHouse) refs.push(cardRef(id.replace("house-", "")));
  if (sampleFile) refs.push(sampleRef(sampleFile, "(선택) 톤 통일용 승인된 건물 1장"));
  const notes = [];
  if (isHouse) notes.push("The attached card artwork (if provided) is only a colour and motif reference for the theme; do not copy its characters or layout.");
  if (sampleFile) notes.push(SAMPLE);
  step({
    id: `bld-${id}`, title: `건물 — ${id} (최종 ${b.final}px)`, thread, cat: "buildings", canvas: b.canvas, pri, refs,
    prompt: [SPRITE_STYLE, CAM, ...notes, "", fill(T_BUILDING, { DESC: b.desc, CANVAS: b.canvas })].join("\n"),
    qa: "문이 하단 중앙, 배경 투명/마젠타 단색, 지면·그림자 없음, 글자 없음",
    convert: `buildings ${id}`,
  });
}
function addInterior(id, pri, thread, refFile, refLabel, sampleFile) {
  const r = interiors[id];
  const refs = [REF(refLabel, refFile, true)];
  if (sampleFile) refs.push(sampleRef(sampleFile, "(선택) 톤 통일용 승인된 실내 1장"));
  const notes = ["The attached image (if provided) is the exterior or a sibling room of this place: match its colours, materials and mood."];
  if (sampleFile) notes.push(SAMPLE);
  step({
    id: `int-${id}`, title: `실내 — ${id} (최종 640×384)`, thread, cat: "interiors", canvas: "1536×1024", pri, refs,
    prompt: [SPRITE_STYLE, CAM, ...notes, "", fill(T_INTERIOR, { ROOM: r.room, LAYOUT: r.layout })].join("\n"),
    qa: "문(하단 중앙)·열린 바닥 공간 확보, 캐릭터 없음, 글자 없음, 가구 배치가 03 문서 조사 포인트와 대체로 일치",
    convert: `interiors ${id}`,
  });
}

// ── Phase 1: 스타일 테스트 + 플로팅 버튼 ──
const P1 = items.length;
step({
  id: "ui-fab-normal", title: "플로팅 버튼 — 기본", thread: "T-FAB", cat: "ui", canvas: "1536×1024", pri: "P0", refs: [],
  prompt: [SPRITE_STYLE, "", uiFab].join("\n"), qa: "판 중앙-오른쪽이 완전히 비어 있음(글자는 CSS), 배경 투명/마젠타, 그림자 없음", convert: "ui fab-normal",
});
step({
  id: "ui-fab-hover", title: "플로팅 버튼 — 호버", thread: "T-FAB", cat: "ui", canvas: "1536×1024", pri: "P0",
  refs: [REF("직전 결과 ui-fab-normal", out("ui/ui-fab-normal.png"))],
  prompt: [SPRITE_STYLE, "", "Keep exactly the same layout, size and design as the attached image (a horizontal pixel-art floating-button plate for a football club's pixel RPG world), but make it brighter with a soft mint glow around the plate, tiny gold sparkles near the medallion, and the plate looking lifted slightly. Keep the text area empty. Transparent background (or flat #FF00FF), no cast shadow, no text anywhere, no watermark. Canvas 1536x1024."].join("\n"),
  qa: "기본 버전과 구도·크기 동일(겹쳤을 때 위치 일치), 글자 영역 비어 있음", convert: "ui fab-hover",
});
step({
  id: "ui-fab-icon", title: "플로팅 버튼 — 원형 아이콘 단독", thread: "T-FAB", cat: "ui", canvas: "1024×1024", pri: "P0",
  refs: [REF("직전 결과 ui-fab-normal", out("ui/ui-fab-normal.png"))],
  prompt: [SPRITE_STYLE, "", "Draw only the round medallion from the attached button plate as a standalone icon: a tiny bright pixel village with a football stadium and a sprouting green seedling inside a round frame. Same style, colours and outline as the attached image. Canvas 1024x1024, centred, transparent background (or flat #FF00FF), no cast shadow, no text."].join("\n"),
  qa: "메달리온이 중앙, 글자 없음", convert: "ui fab-icon",
});
addChar("janine95kim", "P0", { first: true, kind: "member" });
addTerrain("core", "P0");
addBuilding("house-janine95kim", "P0", "T-BLD-1", null);
addInterior("house-janine95kim", "P0", "T-INT-1", out("buildings/bld-house-janine95kim.png"), "(선택) 같은 집 외관(방금 만든 결과)");
step({
  id: "ui-frames-dialog", title: "UI 프레임 시트 A — 대사·선택·토스트 (12칸)", thread: "T-UI-FRAMES", cat: "ui", canvas: "1536×1024 (4×3)", pri: "P0", refs: [],
  prompt: [SPRITE_STYLE, "", uiFramesA].join("\n"),
  qa: "프레임이 좌우·상하 완전 대칭, 모서리 장식 동일, 가장자리 단순 반복, 글자 없음", convert: "ui frames-dialog",
});
const P1end = items.length;

// ── Phase 2: P0 캐릭터 ──
const P2 = items.length;
for (const id of ["bboringirl", "sjh4018", "doormomo", "hachi97", "kaksjak0730", "ju010228", "haepalin", "tleod1818", "tdnlamuron", "lina0108", "woowakgood"])
  addChar(id, "P0", { kind: "member" });
addChar("elder", "P0", { kind: "original" });
const P2end = items.length;

// ── Phase 3: P0 지면·소품 ──
const P3 = items.length;
addTerrain("pitch", "P0");
addTerrain("water", "P0");
for (const n of ["trees", "plants", "rocks", "town", "football", "collect"]) addProps(n, "P0", "T-PROPS-1");
const P3end = items.length;

// ── Phase 4: P0 건물·실내 ──
const P4 = items.length;
const bSample1 = out("buildings/bld-house-janine95kim.png");
for (const id of ["house-bboringirl", "house-sjh4018", "house-doormomo", "house-hachi97", "house-kaksjak0730", "house-ju010228", "house-haepalin"])
  addBuilding(id, "P0", "T-BLD-1", null);
for (const id of ["house-tleod1818", "house-tdnlamuron", "house-lina0108", "clubhouse", "stadium", "fountain", "store"])
  addBuilding(id, "P0", "T-BLD-2", bSample1);
const iSample1 = out("interiors/int-house-janine95kim.png");
for (const id of ["bboringirl", "sjh4018", "doormomo", "hachi97", "kaksjak0730", "ju010228", "haepalin"])
  addInterior(`house-${id}`, "P0", "T-INT-1", out(`buildings/bld-house-${id}.png`), "(선택) 같은 집 외관", null);
for (const id of ["tleod1818", "tdnlamuron", "lina0108"])
  addInterior(`house-${id}`, "P0", "T-INT-2", out(`buildings/bld-house-${id}.png`), "(선택) 같은 집 외관", iSample1);
addInterior("clubhouse-lobby", "P0", "T-INT-2", out("buildings/bld-clubhouse.png"), "(선택) 클럽하우스 외관", iSample1);
addInterior("clubhouse-office", "P0", "T-INT-2", out("interiors/int-clubhouse-lobby.png"), "(선택) 같은 건물 로비 실내", null);
addInterior("arcade", "P0", "T-INT-2", out("interiors/int-clubhouse-lobby.png"), "(선택) 같은 건물 로비 실내", null);
addInterior("stadium", "P0", "T-INT-2", out("buildings/bld-stadium.png"), "(선택) 스타디움 외관", null);
addInterior("store", "P0", "T-INT-2", out("buildings/bld-store.png"), "(선택) 편의점 외관", null);
const P4end = items.length;

// ── Phase 5: P0 UI·FX ──
const P5 = items.length;
step({
  id: "ui-loading-bg", title: "로딩 화면 키아트(활기찬 마을)", thread: "T-UI-ART", cat: "ui", canvas: "1536×1024", pri: "P0", refs: [],
  prompt: [SPRITE_STYLE, "", uiLoading].join("\n"), qa: "16:9 중앙 영역에 중요 요소, 사람·글자 없음", convert: "ui loading-bg",
});
step({
  id: "ui-title-bg", title: "타이틀 화면 키아트(시든 버전)", thread: "T-UI-ART", cat: "ui", canvas: "1536×1024", pri: "P0",
  refs: [REF("직전 결과 ui-loading-bg", out("ui/ui-loading-bg.png"))],
  prompt: [SPRITE_STYLE, "", uiTitle].join("\n"), qa: "loading-bg와 같은 구도·건물 배치, 색만 시듦", convert: "ui title-bg",
});
step({
  id: "ui-logo-emblem", title: "로고 엠블럼(글자 없음)", thread: "T-UI-ART", cat: "ui", canvas: "1024×1024", pri: "P0", refs: [],
  prompt: [SPRITE_STYLE, "", uiLogo].join("\n"), qa: "글자·숫자 없음, 배경 투명/마젠타", convert: "ui logo-emblem",
});
step({
  id: "ui-select-bg", title: "캐릭터 선택 배경", thread: "T-UI-ART", cat: "ui", canvas: "1536×1024", pri: "P0",
  refs: [sampleRef(out("ui/ui-loading-bg.png"), "(선택) 톤 통일용 ui-loading-bg")],
  prompt: [SPRITE_STYLE, SAMPLE, "", uiSelectBg].join("\n"), qa: "사람 없음, 중앙이 비어 있음", convert: "ui select-bg",
});
const frameRef = REF("프레임 디자인 통일용 ui-frames-dialog 결과", out("ui/ui-frames-dialog.png"));
step({
  id: "ui-frames-panel", title: "UI 프레임 시트 B — 패널·HUD·게시판 (12칸)", thread: "T-UI-FRAMES", cat: "ui", canvas: "1536×1024 (4×3)", pri: "P0", refs: [frameRef],
  prompt: [SPRITE_STYLE, "Match the frame design (border, ornaments, colours) of the attached image.", "", frameHead, framesElements(uiFramesB)].join("\n"),
  qa: "프레임 대칭, 종이/게이지 칸은 비어 있음, 글자 없음", convert: "ui frames-panel",
});
step({
  id: "ui-buttons", title: "UI 버튼 시트 (8칸)", thread: "T-UI-FRAMES", cat: "ui", canvas: "1536×1024 (4×2)", pri: "P0", refs: [frameRef],
  prompt: [SPRITE_STYLE, "Match the design language of the attached image.", "",
    frameHead.replace("4 columns x 3 rows (12 cells, each 384x341)", "4 columns x 2 rows (8 cells, each 384x512)"),
    "grid of 4 columns x 2 rows (8 cells). " + framesElements(uiButtons)].join("\n"),
  qa: "버튼이 좌우 대칭, 글자 영역 비어 있음, 4단계 상태 차이 명확", convert: "ui buttons",
});
step({
  id: "ui-select-cards", title: "캐릭터 선택 카드·장식 시트 (12칸)", thread: "T-UI-FRAMES", cat: "ui", canvas: "1536×1024 (4×3)", pri: "P0", refs: [frameRef],
  prompt: [SPRITE_STYLE, "Match the design language of the attached image.", "", frameHead, framesElements(uiSelectCards)].join("\n"),
  qa: "카드 4종 대칭·같은 크기, 화살표/장식 각 칸 중앙", convert: "ui select-cards",
});
step({
  id: "ui-icons-mission", title: "아이콘 시트 — 미션 상태/유형 (12칸)", thread: "T-UI-FRAMES", cat: "ui", canvas: "1536×1024 (4×3)", pri: "P0", refs: [frameRef],
  prompt: [SPRITE_STYLE, "Match the design language of the attached image.", "", iconHead("icon"), "Icons in order (left to right, top to bottom):", icons["icons-mission"].list].join("\n"),
  qa: "12개 아이콘이 32px에서 읽힘, 글자 없음(! ? 은 기호 도형)", convert: "ui icons-mission",
});
step({
  id: "ui-icons-menu", title: "아이콘 시트 — 메뉴 (12칸)", thread: "T-UI-FRAMES", cat: "ui", canvas: "1536×1024 (4×3)", pri: "P0", refs: [frameRef],
  prompt: [SPRITE_STYLE, "Match the design language of the attached image.", "", iconHead("icon"), "Icons in order (left to right, top to bottom):", icons["icons-menu"].list].join("\n"),
  qa: "12개 아이콘이 24px에서 읽힘", convert: "ui icons-menu",
});
addFx("markers", "P0");
function addFx(name, pri) {
  const p = fx[name];
  const first = name === "markers";
  step({
    id: `fx-${name}`, title: `FX 시트 — ${name}`, thread: "T-FX", cat: "fx", canvas: "1536×1024 (4×3)", pri,
    refs: first ? [] : [sampleRef(out("fx/fx-markers.png"), "(선택) 톤 통일용 fx-markers 결과")],
    prompt: [SPRITE_STYLE, first ? "" : SAMPLE, "", fill(T_PROPS, { THEME: p.theme, LIST: p.list })].filter((x, i) => x !== "" || i === 2).join("\n"),
    qa: "12칸 1개씩, 기호(! ? …)는 도형, 글자 없음, 경계선 없음",
    convert: `fx ${name}`,
  });
}
const P5end = items.length;

// ── Phase 6: P1 ──
const P6 = items.length;
for (const id of ["shopkeeper", "kid", "referee", "weedking", "weeder-grunt"]) addChar(id, "P1", { kind: "original" });
addAnimals("P1");
for (const n of ["spring", "frost", "industrial", "cloud", "weed"]) addTerrain(n, "P1");
for (const n of ["spring", "frost", "forge", "cloud", "weed"]) addProps(n, "P1", "T-PROPS-2");
addBuilding("cafe", "P1", "T-BLD-2", bSample1);
addBuilding("factory", "P1", "T-BLD-2", bSample1);
addInterior("cafe", "P1", "T-INT-2", out("buildings/bld-cafe.png"), "(선택) 카페 외관", iSample1);
addInterior("clubhouse-trophy", "P1", "T-INT-2", out("interiors/int-clubhouse-lobby.png"), "(선택) 같은 건물 로비 실내", null);
addInterior("factory", "P1", "T-INT-2", out("buildings/bld-factory.png"), "(선택) 공장 외관", iSample1);
step({
  id: "ui-badges", title: "아이콘 시트 — 뱃지 (12칸)", thread: "T-UI-FRAMES", cat: "ui", canvas: "1536×1024 (4×3)", pri: "P1", refs: [frameRef],
  prompt: [SPRITE_STYLE, "Match the design language of the attached image.", "", iconHead("badge"), "Badges in order (left to right, top to bottom):", icons["badges"].list].join("\n"),
  qa: "12개 뱃지가 48px에서 읽힘, 글자 없음", convert: "ui badges",
});
addFx("emotes", "P1");
addFx("world", "P1");
const rushCommon = (extra = "") => [SPRITE_STYLE, extra, ""].filter((x, i) => x !== "" || i === 2);
step({
  id: "rush-bg-far", title: "잔디 러시 — 원경 배경", thread: "T-RUSH", cat: "rush", canvas: "1536×1024", pri: "P1", refs: [],
  prompt: [...rushCommon(), rushRow("bg-far") + " Canvas 1536x1024."].join("\n"), qa: "좌우 가장자리가 이어짐, 캐릭터·글자 없음", convert: "rush bg-far",
});
step({
  id: "rush-bg-mid", title: "잔디 러시 — 중경 배경", thread: "T-RUSH", cat: "rush", canvas: "1536×1024", pri: "P1",
  refs: [REF("직전 결과 rush-bg-far", out("rush/rush-bg-far.png"))],
  prompt: [...rushCommon("Match the style, colours and horizon of the attached image."), rushRow("bg-mid") + " Canvas 1536x1024."].join("\n"), qa: "지평선 위쪽 투명, 좌우 가장자리 이어짐", convert: "rush bg-mid",
});
step({
  id: "rush-ground", title: "잔디 러시 — 지면 띠", thread: "T-RUSH", cat: "rush", canvas: "1536×1024", pri: "P1",
  refs: [REF("직전 결과 rush-bg-far", out("rush/rush-bg-far.png"))],
  prompt: [...rushCommon("Match the style and colours of the attached image."), rushRow("ground") + " Canvas 1536x1024, the strip centred vertically."].join("\n"), qa: "좌우 가장자리 이어짐, 윗선이 선명", convert: "rush ground",
});
step({
  id: "rush-obstacles", title: "잔디 러시 — 장애물·수집품 시트 (12칸)", thread: "T-RUSH", cat: "rush", canvas: "1536×1024 (4×3)", pri: "P1",
  refs: [REF("직전 결과 rush-ground", out("rush/rush-ground.png"), true)],
  prompt: [...rushCommon("Match the style of the attached image if provided."), fill(T_PROPS, { THEME: rushObs[1], LIST: rushObs[2] }).replace("top-down 3/4-view RPG", "2D side-view runner")].join("\n"),
  qa: "12칸 1개씩, 모두 옆에서 본 시점, 그림자 없음", convert: "rush obstacles",
});
const P6end = items.length;

// ── Phase 7: P2 ──
const P7 = items.length;
step({
  id: "rush-bg-factory", title: "잔디 러시 — 제초 공장 배경(엔딩 후 스킨)", thread: "T-RUSH", cat: "rush", canvas: "1536×1024", pri: "P2",
  refs: [REF("rush-bg-far 결과", out("rush/rush-bg-far.png"))],
  prompt: [...rushCommon("Keep the same composition, horizon and pixel style as the attached image."),
    rushRow("bg-far").replace("a bright sky with soft clouds and a distant football stadium skyline with floodlights, gentle hills", "a grey weed-killing factory skyline with smokestacks under an orange sunset sky, desaturated colours") + " Canvas 1536x1024."].join("\n"),
  qa: "bg-far와 같은 구도, 색만 산업 톤", convert: "rush bg-factory",
});
const P7end = items.length;

// ───────────────────────── 번호·스레드 계산 ─────────────────────────
items.forEach((it, i) => (it.n = i + 1));
const pad = (n) => String(n).padStart(3, "0");
const rawName = (it) => {
  const dir = it.cat;
  return `tmp/world-src/${dir}/${it.id}.png`;
};
const threads = new Map();
for (const it of items) {
  if (!threads.has(it.thread)) threads.set(it.thread, []);
  threads.get(it.thread).push(it);
}
for (const it of items) {
  const list = threads.get(it.thread);
  it.threadFirst = list[0] === it;
}

const threadDesc = {
  "T-FAB": "플로팅 버튼 3장",
  "T-UI-FRAMES": "UI 프레임/버튼/아이콘 시트(프레임 디자인 통일)",
  "T-UI-ART": "키아트(로딩·타이틀·로고·선택 배경)",
  "T-TERRAIN": "지면 텍스처 시트 8장",
  "T-PROPS-1": "소품 시트 P0 6장",
  "T-PROPS-2": "소품 시트 P1 5장",
  "T-BLD-1": "건물(집 8채)",
  "T-BLD-2": "건물(나머지)",
  "T-INT-1": "실내(집 8곳)",
  "T-INT-2": "실내(나머지)",
  "T-FX": "FX 시트 3장",
  "T-RUSH": "잔디 러시 배경·시트",
  "T-ANIMALS": "동물 2종",
};
const threadName = (t) => (t.startsWith("T-CH-") ? `${t} (캐릭터 1명 = 스레드 1개, ①→④ 이어서)` : `${t} — ${threadDesc[t] ?? ""}`);

const phases = [
  [P1, P1end, "Phase 1 — 플로팅 버튼 + 스타일 테스트 (P0)", "재닌 캐릭터 세트, `terrain-core`, 재닌 집 외관/실내, UI 프레임 시트 A를 먼저 만들어 **톤을 확정**한다. 마음에 들지 않으면 해당 프롬프트의 스타일 문구(맨 앞 두 문단)를 고쳐 다시 생성하고, 확정된 문구로 이후 단계를 진행한다."],
  [P2, P2end, "Phase 2 — P0 캐릭터 12명", "멤버 10명 + 우왁굳 + 잔디 할아버지. 캐릭터 1명당 스레드 1개."],
  [P3, P3end, "Phase 3 — P0 지면·소품", "`T-TERRAIN`은 Phase 1에서 연 스레드에서 이어서 진행."],
  [P4, P4end, "Phase 4 — P0 건물·실내", "건물을 먼저 모두 만들고 실내를 만든다(실내가 같은 건물 외관을 참조). `T-BLD-1`/`T-INT-1`은 Phase 1에서 연 스레드에서 이어서."],
  [P5, P5end, "Phase 5 — P0 UI·FX", "`T-UI-FRAMES`는 Phase 1에서 연 스레드에서 이어서."],
  [P6, P6end, "Phase 6 — P1 콘텐츠 완성", "오리지널 캐릭터, 동물, 지구별 지면·소품, 카페·공장, 뱃지, 이모트/월드 FX, 러시 배경·시트."],
  [P7, P7end, "Phase 7 — P2 (여력 시)", ""],
];

// ───────────────────────── 문서 출력 ─────────────────────────
const L = [];
L.push(`# 10. 이미지 생성 실행 순서표 (ChatGPT gpt-image)

**#001부터 순서대로** 이미지를 만들 수 있게 정리한 실행 문서다. 각 스텝에 **저장 이름 / 스레드 / 첨부할 레퍼런스 / 프롬프트(독립형)**가 있다. 프롬프트는 스타일 문구를 **전부 풀어서** 담고 있어 복사해 그대로 붙여넣으면 된다. 배경·설계 이유는 [04](04-art-characters.md)~[06](06-art-ui.md), 진행 체크는 [09](09-asset-checklist.md).

> **이 문서는 스크립트로 생성된다.** 프롬프트를 고치려면 04~06(원천)을 고친 뒤 \`node docs/world/tools/build-image-runbook.mjs\`를 실행한다. 이 문서를 직접 고쳐도 되지만 재생성하면 덮어써진다.

## 사용법

1. 스텝의 **스레드** 지시를 따른다. \`🆕 새 스레드\`면 새 대화를 열고, \`↪ 이어서\`면 그 스레드를 만든 **같은 대화**에 계속 요청한다.
2. **레퍼런스 첨부**의 필수 파일을 올린 뒤 **프롬프트 전체**를 붙여넣는다. "(선택)"은 톤을 맞추고 싶을 때만 올린다. \`src/web/assets/group-photo/*.webp\`가 업로드되지 않으면 PNG로 변환해서 올린다.
3. 결과를 확인(**검수 체크**)하고, 마음에 안 들면 같은 스레드에서 \`Keep everything, but fix: …\`로 수정 요청한다.
4. 통과하면 **저장 이름**으로 저장한다(\`tmp/world-src/<카테고리>/<이름>.png\`, 폴더는 없으면 만든다). 다음 스텝의 레퍼런스가 이 파일이다.
5. 각 스텝 끝의 \`- [ ]\`를 체크한다. 변환은 구현 세션 S1에서 만드는 \`pnpm convert:world-art\` 사용(각 스텝의 "변환" 줄).
6. 캔버스 크기는 프롬프트 문장에 적혀 있다(gpt-image 지원: 1024×1024 / 1536×1024 / 1024×1536). 투명 배경이 안 나오면 \`#FF00FF\` 단색 배경 결과를 그대로 저장해도 된다(스크립트가 제거).
7. 스레드가 길어져(대략 12장 이상) 품질·속도가 떨어지면 새 스레드를 열고 **직전에 승인한 결과 1장**을 톤 샘플로 첨부한다(프롬프트에 대응 문장이 이미 들어 있다).

## 스레드 목록 (한 스레드에서 이어서 만들 것)

| 스레드 | 설명 | 스텝 |
| --- | --- | --- |`);
for (const [t, list] of threads) {
  const nums = list.map((i) => `#${pad(i.n)}`);
  const cond = nums.length > 8 ? `${nums.slice(0, 4).join(", ")} … ${nums.slice(-2).join(", ")} (${nums.length}장)` : nums.join(", ");
  L.push(`| \`${t}\` | ${threadName(t).replace(/^T-[\w-]+ ?/, "").replace(/^— /, "") || "캐릭터 1명 (①→④ 이어서)"} | ${cond} |`);
}
L.push(`
## 진행 표

| # | 저장 이름 | 스레드 | 우선순위 | ✓ |
| --- | --- | --- | --- | --- |`);
for (const it of items) L.push(`| #${pad(it.n)} | \`${it.id}.png\` | \`${it.thread}\`${it.threadFirst ? " 🆕" : ""} | ${it.pri} | [ ] |`);
L.push(`\n총 **${items.length}장** (P0 ${items.filter((i) => i.pri === "P0").length} / P1 ${items.filter((i) => i.pri === "P1").length} / P2 ${items.filter((i) => i.pri === "P2").length}).\n`);

for (const [a, b, title, note] of phases) {
  L.push(`---\n\n# ${title}\n`);
  if (note) L.push(`${note}\n`);
  for (const it of items.slice(a, b)) {
    L.push(`## #${pad(it.n)} · ${it.title}\n`);
    L.push(`- **저장 이름**: \`${rawName(it)}\` (${it.canvas}, ${it.pri})`);
    L.push(`- **스레드**: ${it.threadFirst ? `🆕 **새 스레드 시작** — \`${it.thread}\`` : `↪ **이어서** — \`${it.thread}\` (이 스레드의 첫 스텝 #${pad(threads.get(it.thread)[0].n)}을 만든 대화)`}`);
    if (it.refs.length === 0) L.push(`- **레퍼런스 첨부**: 없음`);
    else {
      L.push(`- **레퍼런스 첨부**:`);
      for (const r of it.refs) L.push(`  - ${r.opt ? "(선택) " : "**필수** "}${r.label.replace(/^\(선택\) /, "")}: \`${r.file}\``);
    }
    L.push(`- **검수 체크**: ${it.qa}`);
    L.push(`- **변환**: \`pnpm convert:world-art -- ${it.convert}\``);
    L.push(`\n**프롬프트**\n\n\`\`\`text\n${it.prompt.trim()}\n\`\`\`\n`);
    L.push(`- [ ] #${pad(it.n)} 생성·저장 완료\n`);
  }
}
fs.writeFileSync(path.join(docsDir, "10-image-generation-runbook.md"), L.join("\n"), "utf8");
console.log(`wrote 10-image-generation-runbook.md: ${items.length} steps`);
