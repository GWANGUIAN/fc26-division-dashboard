/**
 * docs/pitch/09-image-generation-runbook.md 생성 스크립트.
 *
 * 입력(원천): docs/pitch/04-art-characters.md (§5 필드 플레이어 표), docs/pitch/05-art-world-and-ui.md (시트 블록).
 * 출력: 공통 스타일 문구를 각 프롬프트에 풀어 넣은 **독립 프롬프트**를 #001~ 순서·스레드·레퍼런스와 함께 하나의 문서로.
 *
 * 실행: node docs/pitch/tools/build-image-runbook.mjs
 * 04/05 를 고친 뒤 다시 실행하면 09 가 갱신된다(09 를 직접 고친 내용은 덮어써진다).
 * 프롬프트 골격(템플릿)은 이 파일의 charPrompt / keeperPrompt / sheetPrompt 에 있다.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(here, "..");
const read = (f) => fs.readFileSync(path.join(docsDir, f), "utf8");
const d04 = read("04-art-characters.md");
const d05 = read("05-art-world-and-ui.md");

// ───────────────────────── 공통 문구(각 프롬프트에 인라인) ─────────────────────────
const STYLE =
  "Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature.";
const CAM = "Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player.";
const BODY =
  "Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable.";
const CLUB = "The football club 잔디동 uses mint green (#2ee8b6) and white.";
const BG =
  "Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).";
const SAMPLE =
  "If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.";
const HOME_KIT = /the 잔디동 home kit:[^`]+/.exec(d04)[0].replace(/\.$/, "");
const HEAD = `${STYLE} ${CAM} ${BODY} ${CLUB}`;
const NO_BALL =
  "Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.";

// ───────────────────────── 원천 문서 파싱 ─────────────────────────
const chars = [];
for (const m of d04.matchAll(/^\| `(\w+)` \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$/gm)) {
  chars.push({ id: m[1], name: m[2].trim(), pos: m[3].trim(), sig: m[4].trim(), kit: m[5].trim(), extra: m[6].trim() });
}
if (chars.length !== 12) throw new Error(`04 §5 표에서 캐릭터 ${chars.length}명만 읽음(12명이어야 함)`);
if (chars[0].id !== "woowakgood") throw new Error("04 §5 표의 첫 행은 woowakgood(파일럿)여야 함");

const sheets = [];
const blockRe = /^### ([A-Z]\d+)\. `([\w-]+)` — (.+)$/gm;
const heads = [...d05.matchAll(blockRe)];
heads.forEach((h, i) => {
  const end = i + 1 < heads.length ? heads[i + 1].index : d05.length;
  const body = d05.slice(h.index, end);
  const f = {};
  for (const m of body.matchAll(/^- `([A-Z]+)`: (.*)$/gm)) {
    let v = m[2].trim();
    if (v.startsWith("`") && v.endsWith("`")) v = v.slice(1, -1);
    f[m[1]] = v;
  }
  const cells = f.LIST ? f.LIST.split(";").map((s) => s.trim()).filter(Boolean) : [];
  if (f.GRID && f.GRID !== "none") {
    const [c, r] = f.GRID.split("x").map(Number);
    if (cells.length !== c * r) throw new Error(`${h[2]}: LIST ${cells.length}개 ≠ GRID ${f.GRID}(${c * r})`);
  }
  sheets.push({ code: h[1], id: h[2], title: h[3], ...f, cells });
});
const sheetById = Object.fromEntries(sheets.map((s) => [s.id, s]));

// ───────────────────────── 캐릭터 시트 정의 ─────────────────────────
const CH_STEPS = [
  { key: "stand", n: "①", title: "stand (정면 서기 마스터)", size: "1024×1024" },
  { key: "idle", n: "②", title: "idle (준비 자세 2프레임 × 3방향)", size: "1024×1024" },
  { key: "run", n: "③", title: "run (달리기 6프레임 × 3방향)", size: "1536×1024" },
  { key: "shoot", n: "④", title: "shoot (슛 4프레임 × 3방향)", size: "1536×1024" },
  { key: "skill-side", n: "⑤", title: "skill-side (개인기 4종, 측면)", size: "1536×1024" },
  { key: "skill-up", n: "⑥", title: "skill-up (개인기 4종, 후면)", size: "1536×1024" },
  { key: "emote", n: "⑦", title: "emote (세리머니·아쉬움)", size: "1536×1024" },
  { key: "portrait", n: "⑧", title: "portrait (표정 4종 2×2)", size: "1024×1024" },
];

const GRID_RULES =
  "Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.";

const kitOf = (c) => (/^HOME/.test(c.kit) ? c.kit.replace(/^HOME/, HOME_KIT).replace(" + ", ", plus ") : c.kit);

function charPrompt(c, key, pilot) {
  const H = HEAD;
  switch (key) {
    case "stand":
      return `${H}
${BG}
Attached (first image) is the reference of the real streamer character "${c.name}". Redraw this exact character as a 16-bit arcade football game player sprite with athletic proportions (about 4.5 heads tall, NOT chibi).
Keep: ${c.sig}. Keep the same colours and the same face vibe.
Outfit: ${kitOf(c)}
Pose: standing ready, front view (facing the camera), feet shoulder-width apart on one baseline, arms relaxed at the sides with loosely clenched fists, confident athletic stance, full body visible with a little empty margin on all sides.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
${c.extra}${pilot ? "" : "\n" + SAMPLE}`;
    case "idle":
      return `${H}
${BG}
Using the attached standing sprite as the exact reference, draw the SAME character's idle animation as a sprite sheet on one 1024x1024 canvas: a strict grid of 2 columns x 3 rows.
Row 1: facing the camera (front view). Row 2: facing right (side view, profile). Row 3: facing away from the camera (back view).
The head-to-foot height of the three figures must match the attached standing sprite and stay within 72% of the cell height.
Column 1: ready stance, knees slightly bent, weight forward on the toes, arms loose and slightly away from the body, eyes/head toward where the ball would be. Column 2: the same stance breathing: torso about 2 pixels lower, shoulders dropped, hair and accessories shifted by one pixel.
${NO_BALL}
${GRID_RULES}${pilot ? "" : "\n" + SAMPLE}`;
    case "run":
      return `${H}
${BG}
Using the attached standing sprite and idle sheet as the exact references, draw the SAME character's RUN cycle (a fast sprint, not a walk) as a sprite sheet on one 1536x1024 canvas: a strict grid of 6 columns x 3 rows.
Row 1 (top): running toward the camera (front view), 6 frames. Row 2 (middle): running to the right (side view), 6 frames. Row 3 (bottom): running away from the camera (back view), 6 frames.
Frame order in every row: (1) contact, left foot planted forward; (2) drive/airborne, both feet off the ground, body at its highest; (3) passing pose, right knee driving up; (4) contact, right foot planted forward; (5) drive/airborne, both feet off the ground; (6) passing pose, left knee driving up. Torso leans forward about 15 degrees, arms bent at about 90 degrees and swinging opposite to the legs, hair and accessories trailing by one or two pixels.
NON-NEGOTIABLE SIDE-VIEW CHECK (middle row, running right): in frame 1 the LEFT boot is the frontmost/rightmost boot and in frame 4 the RIGHT boot is the frontmost/rightmost boot. In those two contact frames show two fully visible, separate boots with a clear horizontal gap, and the front boot must swap sides between frame 1 and frame 4. Do not draw the same stride twice, do not put one boot directly behind the other, and do not hide a boot behind hair, clothes or a prop. Frames 2 and 5 must show both feet clearly off the ground. Before returning the image, inspect only the middle row and confirm the alternating leading boot is obvious.
BACK-VIEW ROW (bottom row, running away from the camera) must be a real sprint in EVERY frame, never a standing stance: the torso leans forward, the head stays small and compact between the shoulders (same size as in the front row), and each frame shows a different leg action: frame 1 right boot planted and left knee already lifting with the sole visible; frame 2 both boots off the ground; frame 3 right knee driving up with the sole visible; frame 4 left boot planted and right knee lifting; frame 5 both boots off the ground; frame 6 left knee driving up. Never draw the two legs side by side with both feet flat on the ground.
${NO_BALL}
${GRID_RULES}${pilot ? "" : "\n" + SAMPLE}`;
    case "shoot":
      return `${H}
${BG}
Using the attached standing sprite and run sheet as the exact references, draw the SAME character's SHOOTING animation as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows.
Row 1: kicking toward the camera (front view). Row 2: kicking toward the right (side view). Row 3: kicking away from the camera (back view, the most important row).
Frame order in every row: (1) wind-up: the kicking leg drawn far back with the knee bent, arms thrown out for balance, body leaning back slightly; (2) plant: the support foot planted firmly, torso rotating forward, kicking leg about to swing; (3) IMPACT: the kicking leg fully extended through the point where the ball would be, toes pointed, body low and driving, a sharp powerful pose; (4) follow-through: the kicking leg raised high past the impact point, torso rotated, the support leg lifting off the ground.
POSTURE RULES (all rows, especially the back-view row 3): the torso never folds forward more than about 25 degrees; the head always stays clearly ABOVE and between the shoulders and is never sunk into or hidden by the shoulders; only the hips and the kicking leg rotate hard. In the back-view row, frame 3 (IMPACT) shows the figure from behind with the upright torso, the head visible above the shoulders, the support leg planted and the kicking leg swung out to the upper right with the boot sole visible, arms out for balance. The front-view row impact frame keeps the torso upright and the head level, the kicking leg extended toward the camera without shrinking the torso.
${NO_BALL}
${GRID_RULES}${pilot ? "" : "\n" + SAMPLE}`;
    case "skill-side":
    case "skill-up": {
      const view = key === "skill-side" ? "right-side view (profile, facing right)" : "back view (facing away from the camera toward the goal)";
      return `${H}
${BG}
Using the attached standing sprite and shoot sheet as the exact references, draw the SAME character performing four football skill moves as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 4 rows, all in ${view}.
Each row is a DIFFERENT move with its own clearly different silhouette; a crouch followed by a sprint must NOT be reused in more than one row. Keep the frame order of every row.
Row 1: STEPOVER (one leg circles over the ball spot while the other stays planted): (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
Row 2: ROULETTE (Marseille turn, the whole body spins around the planted foot): (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
Row 3: RAINBOW FLICK (a small hop, the heels flick the ball up and over the head): (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
Row 4: ELASTICO (flip-flap, a wide sideways fake): (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
${NO_BALL} Every frame in the sheet must be different from the others, and each row must read as a different move even without the ball.
${GRID_RULES}${pilot ? "" : "\n" + SAMPLE}`;
    }
    case "emote":
      return `${H}
${BG}
Using the attached standing sprite and idle sheet as the exact references, draw the SAME character's reaction animations, all facing the camera (front view), as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows.
Row 1: GOAL CELEBRATION A: running with both arms spread wide and mouth open in a shout, 4 frames of a run cycle. Row 2: GOAL CELEBRATION B: a knee slide with a raised fist: (1) leap forward, (2) landing on the knees, (3) sliding with the chest out and the fist up, (4) settling with a roar. Row 3: DISAPPOINTED: (1) hands rising to the head, (2) falling to the knees, (3) head in both hands, (4) shoulders slumped, slow sway.
${NO_BALL}
${GRID_RULES}${pilot ? "" : "\n" + SAMPLE}`;
    case "portrait":
      return `${H}
${BG}
Using the attached standing sprite as the exact reference, draw a portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, drawn with more pixel detail than the sprite but in the same style, with the same bold navy outline.
Top-left: neutral focused expression. Top-right: confident smirk with a raised chin. Bottom-left: celebrating, shouting with joy and a raised fist near the face. Bottom-right: disappointed, eyes down and a grimace.
LAYOUT RULES (very important): draw each bust NARROWER than its cell: at most 80% of the cell width, centred horizontally in its own cell, so that a wide empty transparent gutter is left naturally between neighbouring busts. The four portraits sit in four equal square cells with a clear empty transparent gutter of at least 60 px between neighbouring portraits (they must never touch each other), and every portrait keeps at least 8% empty margin on its left, right and top edges. Each figure is a bust that is cut flat only along its own cell's bottom edge; the shoulders, arms, fists, headset, ears and hair must be COMPLETELY inside the cell on the left, right and top: a raised fist or elbow (bottom-left portrait) must be drawn fully inside the cell, so make that portrait's pose more compact. Identical hairstyle, accessories, kit colours and proportions in all four; same framing and scale (same head size); no glow, halo or coloured blur; no cell borders or grid lines; no text.${pilot ? "" : "\n" + SAMPLE}`;
  }
  throw new Error(key);
}

const KEEPER_DESC =
  "an original goalkeeper character: broad-shouldered burly keeper, neon orange (#ff7a1a) long-sleeve goalkeeper jersey with black trim, black shorts, black knee-high socks, big black-and-orange goalkeeper gloves, black boots, short cropped dark grey hair with a yellow (#ffd23f) headband, a confident smirk";
function keeperPrompt(key) {
  const H = `${STYLE} ${CAM} ${BODY}`;
  const K = "The character is the AI goalkeeper: " + KEEPER_DESC + ".";
  switch (key) {
    case "stand":
      return `${H}
${BG}
Create ${KEEPER_DESC}, as a 16-bit arcade football game sprite with athletic proportions (about 4.5 heads tall, NOT chibi).
Pose: standing in the goalkeeper ready stance facing the camera, feet wider than the shoulders, knees slightly bent, hands open in front of the body at hip height, full body visible with a little empty margin.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
${SAMPLE}`;
    case "ready":
      return `${H}
${BG}
${K} Using the attached standing sprite as the exact reference, draw the ready animations on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows, all facing the camera (front view, the keeper faces the shooter).
Row 1: ready idle, 2 frames (a small bounce on the toes, hands up) in columns 1-2, columns 3-4 left completely empty. Row 2: side-shuffle toward the LEFT side of the image (screen left), 4 frames (crossing steps, hands low and wide, body turned three-quarters toward the direction of travel). Row 3: side-shuffle toward the RIGHT side of the image (screen right), 4 frames.
${NO_BALL}
${GRID_RULES}`;
    case "dive":
      return `${H}
${BG}
${K} Using the attached standing sprite as the exact reference, draw the DIVE animations on one 1536x1024 canvas: a strict grid of 5 columns x 4 rows, front-facing dives toward the screen's left or right. Each cell is a wide pose, so allow generous horizontal margin.
Row 1: low dive to screen LEFT along the ground, 5 frames (crouch, push off, stretched out and low, skidding on the grass, landing). Row 2: low dive to screen RIGHT, 5 frames. Row 3: high dive to screen LEFT, body stretched fully horizontal in the air with the hands reaching, 5 frames (crouch, leap, full stretch at the peak, descent, landing on the side). Row 4: high dive to screen RIGHT, 5 frames.
${NO_BALL}
${GRID_RULES}`;
    case "save":
      return `${H}
${BG}
${K} Using the attached standing sprite as the exact reference, draw the SAVE animations on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows, front view.
Row 1: CATCH: (1) hands reaching up and forward, (2) fingers closing, (3) clutching the imaginary ball to the chest, (4) dropping into a crouch with the ball held tight. Row 2: PUNCH: (1) both fists drawn back, (2) fists swinging up, (3) impact with arms fully extended above the head, (4) recovery. Row 3: FOOT DEFLECT: (1) one leg swinging out to the side, (2) the boot fully extended, (3) the body off balance with the arms out, (4) recovering.
${NO_BALL}
${GRID_RULES}`;
    case "react":
      return `${H}
${BG}
${K} Using the attached standing sprite as the exact reference, draw the REACTION animations on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows, front view.
Row 1: BEATEN (conceded a goal): (1) lying on the ground after a dive, (2) head turning back toward the goal, (3) sitting up with a stunned face, (4) slumping. Row 2: SAVE CELEBRATE: (1) a small hop, (2) a fist pump, (3) a chest-thump roar, (4) a confident point at the shooter. Row 3: RAGE SLAM: (1) kneeling, (2) raising a fist, (3) slamming the fist into the grass, (4) shaking the head.
${NO_BALL}
${GRID_RULES}`;
  }
  throw new Error(key);
}

const KEEPER_STEPS = [
  { key: "stand", n: "K①", title: "stand (정면 준비 자세 마스터)", size: "1024×1024" },
  { key: "ready", n: "K②", title: "ready (대기·좌우 이동)", size: "1536×1024" },
  { key: "dive", n: "K③", title: "dive (다이브 저/고 × 좌/우)", size: "1536×1024" },
  { key: "save", n: "K④", title: "save (캐치·펀치·발 선방)", size: "1536×1024" },
  { key: "react", n: "K⑤", title: "react (실점·세이브 세리머니·분노)", size: "1536×1024" },
];

const CHECKS = {
  stand: "배경 투명/마젠타 단색, 글자·숫자 없음, 레퍼런스의 SIGNATURE 유지, 4.5등신 운동선수 비례(치비 아님), 네이비 2px 외곽선, 전신 잘림 없음",
  idle: "3행 방향 정확(정면/우측/후면), 2열이 서로 다른 호흡 프레임, 볼 없음, 발끝 기준선 일치",
  run: "**측면 행 접지 프레임 1·4에서 앞발이 교대로 보임**, 프레임 2·5에서 두 발이 지면에서 뜸, 6프레임 모두 서로 다름, 걷기가 아닌 전력 질주 느낌",
  shoot: "임팩트(3번째) 프레임에서 킥 다리가 완전히 뻗음, 상체가 셀 안에 있음, 후면 행(3행)이 명확, 볼 없음",
  "skill-side": "4행이 서로 다른 개인기로 읽힘, 각 행 4프레임이 순서대로 진행, 레인보우 행에서 점프 프레임 확인, 볼 없음",
  "skill-up": "skill-side와 같은 4종이 후면에서 읽힘, 머리·소품 유지, 볼 없음",
  emote: "정면, 3행이 서로 구별(팔 벌림 달리기 / 무릎 슬라이드 / 좌절), 셀 잘림 없음",
  portrait: "4표정 구별, 머리색·소품 유지, 가장자리 잘림 없음(긴 머리 끝·주먹이 칸 가장자리에 닿지 않게), 비대칭 소품이 있는 쪽(좌/우) 기록 — 좌향은 측면 프레임을 미러하므로",
};

function sheetPrompt(s) {
  const [c, r] = s.GRID && s.GRID !== "none" ? s.GRID.split("x").map(Number) : [0, 0];
  const [W, Hh] = s.CANVAS.split("x");
  const H = `${STYLE} ${CAM} ${CLUB}`;
  if (s.KIND === "scene" || s.KIND === "keyart") {
    return `${H}
Background: this is a FULL opaque scene, no transparency, no magenta.
${s.DESC}
Canvas: ${W}x${Hh}. No text, no letters, no numbers, no logos anywhere in the image.${s.REFS ? "\nUse the attached image(s) as the style reference for pixel size, outline, palette and lighting (they show the SAME game), but do not copy their subject unless the description says so." : ""}`;
  }
  const rows = [];
  for (let i = 0; i < r; i++) {
    rows.push(`Row ${i + 1}: ` + s.cells.slice(i * c, (i + 1) * c).map((t, j) => `(${j + 1}) ${t}`).join("; "));
  }
  return `${H}
${BG}
${s.DESC}
Canvas: ${W}x${Hh}: a strict grid of ${c} columns x ${r} rows, every cell exactly the same size, one item per cell, centred, ${GRID_TAIL(s)}.
${rows.join("\n")}
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; consistent pixel size, outline and lighting in all cells; no text, letters, numbers or logos.${s.REFS ? "\nUse the attached image(s) as the style reference (same game, same pixel size, outline and palette)." : ""}`;
}
const GRID_TAIL = (s) => (s.CAT === "ui" ? "items vertically centred in the cell" : "items sitting on the same baseline within their row where they are objects");

// ───────────────────────── 실행 순서 ─────────────────────────
const P0_SHARED = ["pitch-bg", "goal", "ball", "fx-impact", "fx-shot", "ui-frames", "ui-buttons", "ui-hud-gauges", "ui-hud-keys", "ui-hud-banners", "loading-bg", "loader"];
const A2_UI = ["ui-select", "ui-select-bg", "fx-celebrate"];
const A3_ENV = ["locker-gate", "locker-bg", "locker-props", "ui-stat", "ui-icons"];
const P2_SHARED = ["props", "crowd"];

const steps = [];
let n = 0;
const pilot = chars[0];
const pushChar = (c, phase, prio) => {
  CH_STEPS.forEach((st, i) =>
    steps.push({ n: ++n, phase, kind: "char", c, st, thread: `T-PCH-${c.id}`, prio, stepIdx: i }),
  );
};
const findSheet = (id) => {
  const s = sheetById[id] ?? sheets.find((x) => x.FILE === id);
  if (!s) throw new Error(`시트 id 없음: ${id}`);
  return s;
};
const pushSheet = (id, phase) => steps.push({ n: ++n, phase, kind: "sheet", s: findSheet(id), thread: findSheet(id).THREAD, prio: findSheet(id).PRIO });

const PHASES = {
  1: "Phase 1 — 스타일 파일럿: 우왁굳 8시트 (전체 스타일·포즈 문법 승인용, A1 세션)",
  2: "Phase 2 — 공용 코어 시트 P0 (A1 세션)",
  3: "Phase 3 — AI 골키퍼 5시트 (A1 세션)",
  4: "Phase 4 — 나머지 필드 플레이어 11명 (A2 세션)",
  5: "Phase 5 — 선택 화면·연출 UI (A2 세션)",
  6: "Phase 6 — 락커룸·스탯 화면 (A3 세션)",
  7: "Phase 7 — 폴리시 P2 (P7 세션 전후)",
};
pushChar(pilot, 1, "P0");
for (const id of P0_SHARED) pushSheet(id, 2);
KEEPER_STEPS.forEach((st, i) => steps.push({ n: ++n, phase: 3, kind: "keeper", st, thread: "T-PCH-KEEPER", prio: "P0", stepIdx: i }));
for (const c of chars.slice(1)) pushChar(c, 4, "P1");
for (const id of A2_UI) pushSheet(id, 5);
for (const id of A3_ENV) pushSheet(id, 6);
for (const id of P2_SHARED) pushSheet(id, 7);

if (steps.length !== 123) throw new Error(`총 ${steps.length}스텝(123이어야 함)`);
{
  const usedSheets = new Set(steps.filter((x) => x.kind === "sheet").map((x) => x.s.id));
  for (const s of sheets) if (!usedSheets.has(s.id)) throw new Error(`실행 순서에 빠진 시트: ${s.id}`);
}

// ───────────────────────── 경로/레퍼런스 ─────────────────────────
const charFile = (id, key) => `tmp/pitch-src/characters/char-${id}-${key}.png`;
const sheetPath = (s) => `tmp/pitch-src/${s.CAT}/${s.FILE}`;
const kFile = (key) => `tmp/pitch-src/characters/char-keeper-ai-${key}.png`;
const stepNo = new Map();
for (const s of steps) {
  if (s.kind === "char") stepNo.set(`${s.c.id}:${CH_STEPS[s.stepIdx].key}`, s.n);
  if (s.kind === "keeper") stepNo.set(`keeper:${s.st.key}`, s.n);
  if (s.kind === "sheet") stepNo.set(`sheet:${s.s.id}`, s.n);
}
const num = (k) => `#${String(stepNo.get(k)).padStart(3, "0")}`;

const CHAR_REQ = {
  stand: (c) => [],
  idle: (c) => [["stand"]],
  run: (c) => [["stand"], ["idle"]],
  shoot: (c) => [["stand"], ["run"]],
  "skill-side": (c) => [["stand"], ["shoot"]],
  "skill-up": (c) => [["stand"], ["skill-side"]],
  emote: (c) => [["stand"], ["idle"]],
  portrait: (c) => [["stand"]],
};

function refsFor(s) {
  const lines = [];
  if (s.kind === "char") {
    const c = s.c;
    const key = CH_STEPS[s.stepIdx].key;
    if (key === "stand") {
      lines.push(`**필수** 선수 레퍼런스(전신): \`tmp/pitch-src/refs/${c.id}-ref.png\` (사용자 보유 이미지를 이 경로에 복사)`);
      lines.push(`(선택) 얼굴 클로즈업 레퍼런스: \`tmp/pitch-src/refs/${c.id}-ref-face.png\``);
    }
    for (const [k] of CHAR_REQ[key](c)) lines.push(`**필수** 이 캐릭터의 승인본 ${k}: \`${charFile(c.id, k)}\` (${num(`${c.id}:${k}`)})`);
    if (c.id !== pilot.id) {
      lines.push(`(권장) 파일럿 우왁굳의 승인본 ${key}: \`${charFile(pilot.id, key)}\` (${num(`${pilot.id}:${key}`)}) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지`);
    }
  } else if (s.kind === "keeper") {
    const key = s.st.key;
    if (key === "stand") lines.push(`(권장) 파일럿 우왁굳의 승인본 stand: \`${charFile(pilot.id, "stand")}\` (${num(`${pilot.id}:stand`)}) — 픽셀 스타일 샘플 전용`);
    else {
      lines.push(`**필수** 골키퍼 stand: \`${kFile("stand")}\` (${num("keeper:stand")})`);
      const prev = { ready: "stand", dive: "ready", save: "dive", react: "save" }[key];
      if (prev && prev !== "stand") lines.push(`(권장) 직전 승인본 ${prev}: \`${kFile(prev)}\``);
      lines.push(`(권장) 파일럿 우왁굳의 ${key === "ready" ? "idle" : key === "dive" ? "shoot" : "emote"} 시트: 그리드 레이아웃 샘플 전용`);
    }
  } else {
    const sh = s.s;
    const ids = (sh.REFS || "").split(",").map((x) => x.trim()).filter(Boolean);
    if (!ids.length) lines.push("없음 (이 스레드의 첫 시트 = **스타일 앵커**)");
    for (const id of ids) lines.push(`**필수** 승인본 \`${sheetPath(findSheet(id))}\` (${num(`sheet:${id}`)}) — 픽셀 크기·외곽선·팔레트·조명 기준`);
    const anchor = "pitch-bg";
    if (sh.THREAD !== "T-PCH-ENV" && sh.id !== anchor && !ids.includes(anchor)) lines.push(`(권장) 환경 스타일 앵커: \`${sheetPath(findSheet(anchor))}\``);
  }
  return lines;
}

// ───────────────────────── 문서 생성 ─────────────────────────
const threadSteps = new Map();
for (const s of steps) {
  if (!threadSteps.has(s.thread)) threadSteps.set(s.thread, []);
  threadSteps.get(s.thread).push(s.n);
}
const isFirstInThread = (s) => threadSteps.get(s.thread)[0] === s.n;
const N = (x) => `#${String(x).padStart(3, "0")}`;

const out = [];
out.push(`# 09. 이미지 생성 실행 순서표 — 잔디동 피치 (ChatGPT gpt-image)

**#001부터 순서대로** 이미지를 만들 수 있게 정리한 실행 문서다. 각 스텝에 **저장 이름 / 스레드(새로 열지·이어서 할지) / 첨부할 레퍼런스 / 검수 체크 / 변환 명령 / 프롬프트(독립형)** 가 있다. 프롬프트는 스타일 문구를 **전부 풀어서** 담고 있어 복사해 그대로 붙여넣으면 된다. 총 **${steps.length}스텝**(필드 플레이어 12명×8 + 골키퍼 5 + 환경·이펙트·UI ${steps.filter((x) => x.kind === "sheet").length}).

> **이 문서는 스크립트로 생성된다.** 캐릭터 특징은 [04 §5](04-art-characters.md), 환경·UI 시트 규격과 셀 목록은 [05](05-art-world-and-ui.md)를 고친 뒤 \`node docs/pitch/tools/build-image-runbook.mjs\`를 실행한다. 프롬프트 **골격**(달리기/슛/개인기 문구 등)은 스크립트의 \`charPrompt\`·\`keeperPrompt\`·\`sheetPrompt\` 함수에 있다. 이 문서를 직접 고치면 재생성 시 덮어써진다.
>
> **잔디동 월드와 다른 컨셉**: 이 프롬프트들은 16비트 아케이드 스포츠·4.5등신·네이비 2px 외곽선·야간 경기장 조명이다. 월드 캐릭터/맵 이미지를 **레퍼런스로 첨부하지 않는다**(정체성 혼입 방지). [04 §0](04-art-characters.md) 비교표 참고.

## 사용법

1. 스텝의 **스레드** 지시를 따른다. \`🆕 새 스레드\`면 새 대화를 열고, \`↪ 이어서\`면 그 스레드를 만든 **같은 대화**에 계속 요청한다.
2. **레퍼런스 첨부**의 **필수** 파일을 올린 뒤 **프롬프트 전체**를 붙여넣는다. "(권장)/(선택)"은 일관성·톤이 흔들릴 때 올린다. 선수 레퍼런스(\`tmp/pitch-src/refs/<id>-ref.png\`)는 사용자가 가진 이미지를 해당 경로에 미리 복사해 둔다.
3. 결과를 **검수 체크**로 확인하고, 마음에 안 들면 같은 스레드에서 \`Keep everything, but fix: …\`로 수정 요청한다.
4. 통과하면 **저장 이름**으로 저장한다(폴더는 없으면 만든다). 다음 스텝의 레퍼런스가 이 파일이다.
5. 스텝 끝의 \`- [ ]\`를 체크한다. 변환은 구현 세션 A1에서 만드는 \`pnpm convert:pitch-art\`(각 스텝의 "변환" 줄).
6. 캔버스 크기는 프롬프트 문장에 적혀 있다(gpt-image: 1024×1024 / 1536×1024 / 1024×1536). 투명 배경이 안 나오면 \`#FF00FF\` 단색 배경 결과를 그대로 저장해도 된다(스크립트가 제거). **그리드 열×행과 프레임 순서**만 지켜지면 크기 드리프트는 스크립트가 처리한다.
7. 스레드가 길어져(대략 12장 이상) 품질이 떨어지면 새 스레드를 열고 **직전에 승인한 결과 1장**을 톤 샘플로 첨부한다.
8. **파일럿 우선**: Phase 1(우왁굳 8시트)을 끝까지 승인받은 뒤 다른 캐릭터를 시작한다. 이후 캐릭터 스레드에는 우왁굳 승인 시트를 "레이아웃·스타일 샘플"로 함께 첨부하되 **정체성은 복사하지 않는다**(프롬프트에 규칙이 들어 있음).
9. 글자·숫자가 이미지에 생기면 **재생성**한다(텍스트는 캔버스가 그린다).
10. 진행 표의 \`[x]\`=검토 통과, \`[ ] 🔁\`=**검토 후 재생성 필요**(스텝의 "상태(검토 결과)"에 이유와 수정 요청 문구가 있음). 셀 여백·후광·초상화 간격 규칙은 이 검토에서 얻은 것으로 모든 캐릭터 프롬프트에 이미 반영돼 있다([04 §8](04-art-characters.md)). **재생성은 수정 요청보다 새 프롬프트로 전체 다시 만드는 쪽을 권장**(같은 스레드에서 승인본 stand·idle을 다시 첨부).

## 세션 ↔ 페이즈 매핑

| 세션 | 페이즈 | 스텝 |
| --- | --- | --- |
| A1 | 1·2·3 | ${N(1)}~${N(8)}, ${N(9)}~${N(20)}, ${N(21)}~${N(25)} |
| A2 | 4·5 | ${N(26)}~${N(113)}, ${N(114)}~${N(116)} |
| A3 | 6 | ${N(117)}~${N(121)} |
| P7 전후 | 7 | ${N(122)}~${N(123)} |

## 스레드 목록

| 스레드 | 설명 | 스텝 |
| --- | --- | --- |`);
for (const [t, list] of threadSteps) {
  const desc = t.startsWith("T-PCH-") && chars.some((c) => t === `T-PCH-${c.id}`) ? `캐릭터 1명 = 스레드 1개 (①→⑧ 이어서${t === "T-PCH-woowakgood" ? ", **파일럿**" : ""})` : { "T-PCH-KEEPER": "AI 골키퍼 (K①→K⑤)", "T-PCH-ENV": "환경·키아트", "T-PCH-FX": "이펙트", "T-PCH-UI": "UI (프레임이 스타일 앵커)" }[t];
  out.push(`| \`${t}\` | ${desc} | ${list.length > 8 ? `${N(list[0])}, ${N(list[1])} … ${N(list[list.length - 1])} (${list.length}장)` : list.map(N).join(", ")} |`);
}
out.push(`
## 진행 표

| # | 저장 이름 | 스레드 | 우선순위 | ✓ |
| --- | --- | --- | --- | --- |`);
// ───── 생성 검토 결과(사용자가 만든 이미지를 검토한 뒤 갱신한다. 04 §8 참고) ─────
const STATUS = {
  "keeper:stand": { mark: "[x]", note: "파일 존재 확인(2026-09-25). 내용 검토는 하지 않음(요청 범위 밖)." },
  "keeper:ready": { mark: "[x]", note: "검토 통과(2026-09-25, 프롬프트 보강 전 생성본). 대기 2프레임 + 좌/우 셔플 4프레임씩이 읽히고 키퍼 정체성(주황 저지, 노란 헤어밴드, 장갑) 일관. 한계(수용): 셔플이 정면이 아니라 3/4로 몸을 돌린 자세, 캐릭터가 셀을 꽉 채움, 반투명 후광. 셔플 행의 방향은 **화면 기준**(행2=화면 왼쪽으로, 행3=화면 오른쪽으로 이동)으로 그려져 있음 → 04 §6에 화면 기준이라고 명시." },
  "keeper:dive": { mark: "[x]", note: "검토 통과(2026-09-25, 프롬프트 보강 전 생성본). 4행(저·좌/저·우/고·좌/고·우) 방향이 정확하고 5프레임 진행(웅크림→도약→최대 신장→하강→착지)이 잘 읽혀 골키퍼 시트 중 가장 좋음. 한계(수용): 프레임이 셀 폭을 꽉 채우고 서로 4px 이내로 맞닿는 곳이 있음(연결요소 병합 gap 24px를 쓰면 20프레임이 6덩어리로 합쳐짐, gap ≤3px에서 20프레임 정상 분리) → 변환은 gap ≤2px. 반투명 후광은 알파 이진화. 다이브 셀은 가로가 넓으므로 192×96 정규화, 행 단위로 접지 기준선 정렬." },
  "keeper:save": { mark: "[x]", note: "검토 통과(2026-09-25, 프롬프트 보강 전 생성본). 캐치(손 뻗기→모으기→가슴 품기→웅크림), 펀치(주먹 뒤로→치켜올림→점프 양팔 위→회복), 발 선방(다리 들기→수평 뻗기→도약→회복)이 명확히 구분됨, 볼 없음 규칙 준수. 한계(수용): 셀을 꽉 채움, 후광. gap ≤3px에서 12프레임 정상 분리." },
  "keeper:react": { mark: "[x]", note: "검토 통과(2026-09-25, 프롬프트 보강 전 생성본). 실점(엎드림→팔꿈치로 상체 일으킴→주저앉아 멍함→고개 숙임), 세이브 세리머니(점프 주먹→주먹 치켜올림→가슴 두드리기→슈터 가리킴), 분노(무릎 꿇고 고개 숙임→주먹 들기→바닥 내려치기→고개 젓기)가 모두 감정이 잘 읽힘. 한계(수용): 2행 2~4프레임과 3행 일부가 셀 높이 100%, 시트 좌우 가장자리 6~8px 여백, 후광. gap ≤2px에서 12프레임 정상 분리(4px에서 1쌍이 합쳐짐)." },
  "woowakgood:stand": { mark: "[x]", note: "검토 통과(2026-09-25). 재생성 불필요." },
  "woowakgood:idle": { mark: "[x]", note: "검토 통과(2026-09-25). 재생성 불필요." },
  "woowakgood:run": { mark: "[x]", note: "재생성본 검토 통과(2026-09-25). 후면 행이 실제 달리기(발바닥 교대), 후면·정면 체격 비슷, 측면 행 양호. 남은 사항은 변환 단계에서 처리: 반투명 후광(알파 이진화), 측면 행이 셀 폭을 꽉 채움(연결요소로 분리), 도약 프레임은 발이 접지 프레임보다 높이 있으므로 **행 단위로 접지 프레임 기준 발끝 정렬**(프레임마다 발끝을 바닥에 맞추면 도약이 사라짐)." },
  "woowakgood:shoot": { mark: "[x]", note: "재생성본 검토 통과(2026-09-25). 후면 임팩트에서 상체가 곧고 머리가 어깨 위에 있음, 정면·측면·후면 임팩트가 모두 강하게 읽힘. 알려진 한계(수용): 측면 행 4번째(팔로스루)가 뒤로 접은 다리라 백스윙처럼 보임, 후면 행 2번째(디딤)가 두 발이 모여 서 있는 듯함. 변환 단계 처리: 후광(알파 이진화), 캐릭터가 셀 경계를 넘어 위아래 행 사이 간격이 20~25px뿐이므로 고정 그리드가 아니라 연결요소로 프레임 분리.", fix: "Keep everything, but fix only row 2 (side view) frame 4 (follow-through): the kicking leg swings forward and UP past the impact point with the knee bent in front of the body and the boot high in front, NOT folded back behind the body; keep every other frame unchanged." },
  "woowakgood:skill-side": { mark: "[x]", note: "재생성본 검토 통과(2026-09-25). 4종이 서로 구분됨(스텝오버=한쪽 다리 들고 페이크→와이드 런지, 룰렛=등을 보이는 회전, 레인보우=양발 모으기→도약→다리 접은 공중→착지, 엘라스티코=와이드 스탠스 좌우 페이크). 알려진 한계(수용): 스텝오버 2프레임이 무릎 들기처럼 보임, 4행 모두 4번째 프레임이 거의 같은 스프린트 출발 자세(공통 출구 자세로 취급), 행 2는 셀 높이 100%로 위아래 행과 간격 13~22px뿐. 변환 단계 처리: 후광(알파 이진화), 연결요소로 프레임 분리.", fix: "Keep everything, but fix only row 1 (stepover) frame 2: the right leg swings in a wide arc OVER and across the front of the standing left leg at knee height with the boot sole facing down and the toes pointing to the left, the torso leaning right as a feint, NOT a plain knee lift; keep every other frame unchanged." },
  "woowakgood:skill-up": { mark: "[x]", note: "재생성본 검토 통과(2026-09-25). 후면 4종이 구분됨(스텝오버=다리를 반대편으로 휘두름, 룰렛=몸 비틀며 다리 교차, 레인보우=발 모으기→발바닥이 보이게 뒤로 차올림→공중→착지, 엘라스티코=다리 교차 후 넓은 스윕), 체격·머리 크기·헤드셋 일관, 머리가 어깨에 묻히지 않음. 알려진 한계(수용): 후면이라 룰렛의 회전은 측면보다 약하게 읽힘, 4번째 프레임은 공통 스프린트 출구 자세. 변환 단계 주의: 3·4행 프레임이 셀 높이 100%라 위아래 행 발–머리 간격이 7~15px뿐 → 연결요소 병합 gap 값을 그보다 작게(≤4px) 하거나 셀 중심 기준으로 성분을 선택할 것. 후광은 알파 이진화." },
  "woowakgood:emote": { mark: "[x]", note: "사용 가능(2026-09-25). 자세 양호. 다만 2·3행이 셀을 꽉 채우고 후광이 있으므로 변환 시 알파 이진화 필요. 마음에 걸리면 새 프롬프트로 재생성해도 됨(선택)." },
  "woowakgood:portrait": { mark: "[x]", note: "재생성본 검토 통과(2026-09-25). 4표정(무표정/자신감/환호+주먹/실망)이 구분되고 머리·귀·헤드셋·유니폼 일관, 주먹·팔이 셀 안에 들어옴(지난번 잘림 해결). 한계(수용): 칸 사이 투명 간격이 세로 7px·가로 23px뿐(요청한 60px 미달)이라 어깨가 중앙선 근처까지 옴 → 변환은 정확히 반으로 나누어 자르고 프레임별로 바운딩 박스 크롭. 헤드셋 배지에 숫자 비슷한 흰 표식이 있으나 192px 축소에서는 읽히지 않음. 얇은 시안 테두리 프린지는 알파 이진화/디프린지로 제거." },
};
const repoRoot = path.resolve(docsDir, "..", "..");
// A1 변환 QA 에서 프레임이 붙어 재생성이 필요한 시트(부록 A, tools/regen-appendix.md). 2026-09-25 7시트 재생성 완료 → 비움
const REGEN = new Set([]);
const statusOf = (s) => {
  if (s.kind === "char") {
    const key = s.c.id + ":" + CH_STEPS[s.stepIdx].key;
    if (STATUS[key]) return STATUS[key];
    if (REGEN.has(key)) return { mark: "[ ] 🔁", note: "A1 변환 QA: 프레임이 서로 붙어 빈 셀/행 축소 발생 → 재생성 필요(맨 아래 부록 A의 수정 프롬프트 사용)." };
    if (fs.existsSync(path.join(repoRoot, "tmp", "pitch-src", "characters", "char-" + key.replace(":", "-") + ".png"))) {
      return { mark: "[x]", note: "파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음)." };
    }
    return undefined;
  }
  if (s.kind === "keeper") return STATUS["keeper:" + s.st.key];
  // 환경·FX·UI 시트: 원본 파일이 tmp/pitch-src 에 있으면 [x] (내용 검토는 하지 않음)
  if (s.kind === "sheet" && fs.existsSync(path.join(repoRoot, "tmp", "pitch-src", s.s.CAT, s.s.FILE))) {
    return { mark: "[x]", note: "파일 존재 확인(2026-09-25). 내용 검토는 아직 하지 않음 — A1 변환 QA에서 확인." };
  }
  return undefined;
};
const extraLines = (s) => {
  const st = statusOf(s);
  if (!st) return "";
  const BT = String.fromCharCode(96);
  let t = "- **상태(검토 결과)**: " + st.note + "\n";
  if (st.fix) t += "- **부분 수정 요청(같은 스레드, 선택)**: " + BT + st.fix + BT + "\n";
  return t;
};
const nameOf = (s) =>
  s.kind === "char" ? path.basename(charFile(s.c.id, CH_STEPS[s.stepIdx].key)) : s.kind === "keeper" ? path.basename(kFile(s.st.key)) : s.s.FILE;
for (const s of steps) out.push(`| ${N(s.n)} | \`${nameOf(s)}\` | \`${s.thread}\`${isFirstInThread(s) ? " 🆕" : ""} | ${s.prio} | ${statusOf(s)?.mark ?? "[ ]"} |`);

let lastPhase = 0;
for (const s of steps) {
  if (s.phase !== lastPhase) {
    out.push(`\n---\n\n# ${PHASES[s.phase]}\n`);
    lastPhase = s.phase;
  }
  let title, saveP, saveM, check, convert, prompt;
  if (s.kind === "char") {
    const st = CH_STEPS[s.stepIdx];
    title = `${s.c.name} — ${st.n} ${st.title}`;
    saveP = charFile(s.c.id, st.key); saveM = `${st.size}, ${s.prio}`;
    check = CHECKS[st.key];
    convert = `pnpm convert:pitch-art -- characters ${s.c.id}`;
    prompt = charPrompt(s.c, st.key, s.c.id === pilot.id);
  } else if (s.kind === "keeper") {
    title = `AI 골키퍼 — ${s.st.n} ${s.st.title}`;
    saveP = kFile(s.st.key); saveM = `${s.st.size}, P0`;
    check = s.st.key === "stand" ? "네온 오렌지 GK 키트, 4.5등신 운동선수 비례, 글자 없음, 정면" : "정면(키퍼는 슈터를 향함), 프레임 순서 진행, 다이브 셀은 가로로 넓어도 잘림 없음, 볼 없음";
    convert = "pnpm convert:pitch-art -- characters keeper-ai";
    prompt = keeperPrompt(s.st.key);
  } else {
    const sh = s.s;
    title = `${sh.code} ${sh.title}`;
    saveP = sheetPath(sh); saveM = `${sh.CANVAS.replace("x", "×")}, ${sh.PRIO}`;
    check = sh.KIND === "grid" ? `${sh.GRID.replace("x", "열×")}행 그리드 정확, 셀당 1개, 요청한 가로세로비 준수(얇은 바·타일·구분선이 두껍게 나오면 변환 시 왜곡됨, A1 관찰), 글자·숫자 없음, 마젠타/핑크 잔여 없음, 이전 시트와 픽셀 크기·외곽선 일치` : "글자 없음, 스타일 앵커(피치 배경/로딩)와 조명·팔레트 일치, 중앙 16:9 밴드 안에 핵심 내용";
    convert = `pnpm convert:pitch-art -- ${sh.CAT} ${sh.id}`;
    prompt = sheetPrompt(sh);
  }
  const first = isFirstInThread(s);
  const firstOfThread = threadSteps.get(s.thread)[0];
  const thr = first ? `🆕 **새 스레드 시작** — \`${s.thread}\`` : `↪ **이어서** — \`${s.thread}\` (이 스레드의 첫 스텝은 ${N(firstOfThread)} — 그 스텝을 만든 대화)`;
  const refs = refsFor(s);
  out.push(`## ${N(s.n)} · ${title}

- **저장 이름**: \`${saveP}\` (${saveM})
- **스레드**: ${thr}
- **레퍼런스 첨부**:
${refs.map((r) => `  - ${r}`).join("\n")}
- **검수 체크**: ${check}
${extraLines(s)}- **변환**: \`${convert}\`
${s.kind === "sheet" && s.s.FINAL ? `- **최종 사용**: ${s.s.FINAL}\n` : ""}
**프롬프트**

\`\`\`text
${prompt}
\`\`\`

- ${statusOf(s)?.mark?.startsWith("[x]") ? "[x]" : "[ ]"} ${N(s.n)} 생성·저장 완료
`);
}

const appendix = path.join(docsDir, "tools", "regen-appendix.md");
if (fs.existsSync(appendix)) out.push(fs.readFileSync(appendix, "utf8").replace(/\r\n/g, "\n"));
fs.writeFileSync(path.join(docsDir, "09-image-generation-runbook.md"), out.join("\n"));
const chStepCount = steps.filter((x) => x.kind === "char").length;
console.log(`09-image-generation-runbook.md 생성: ${steps.length}스텝 (캐릭터 ${chStepCount} = ${chars.length}명×8, 골키퍼 ${steps.filter((x) => x.kind === "keeper").length}, 시트 ${steps.filter((x) => x.kind === "sheet").length})`);
