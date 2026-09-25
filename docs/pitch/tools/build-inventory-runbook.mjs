// 14-inventory-image-runbook.md 생성기.
// 사용: node docs/pitch/tools/build-inventory-runbook.mjs
// 내용(아이템/펫/UI 목록·프롬프트)을 고치려면 이 파일을 수정하고 다시 실행한다. 14 문서를 직접 고치면 덮어써진다.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "..", "14-inventory-image-runbook.md");

// ───────────────────────── 공통 문구 (모든 프롬프트에 전문 반복) ─────────────────────────
const STYLE =
  "Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.";
const BG_TRANSPARENT =
  "Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).";
const NO_TEXT = "No text, no letters, no numbers, no logos anywhere in the image.";
const STYLE_REF =
  "Use the attached image(s) as the style reference for pixel size, outline, palette and lighting (they show the SAME game), but do not copy their subject unless the description says so.";

const STAND = "tmp/pitch-src/characters/char-woowakgood-stand.png";
const IDLE = "tmp/pitch-src/characters/char-woowakgood-idle.png";

// ───────────────────────── 착용 아이템 시트 ─────────────────────────
const ITEM_COLS =
  "Columns (left to right, identical in every row): column 1 = FRONT view (the item as seen from the front of the wearer, wearer facing the camera), column 2 = SIDE view (item as seen from the wearer's right side, wearer facing right), column 3 = BACK view (item as seen from behind the wearer).";

function itemSheet({ id, title, slot, rows, backEmpty, rowRule, sizeRule, refs, thread, threadNote, check, use }) {
  const rowLines = rows.map((r, i) => `Row ${i + 1}: ${r}`).join("\n");
  const prompt = [
    STYLE,
    BG_TRANSPARENT,
    `Subject: wearable ${slot} items for a small football-game character, drawn as isolated items WITHOUT any character, body or head. Each item is drawn at the size and orientation it would have when worn by the character shown in the attached reference image (the reference is used ONLY to judge the head size; do not draw the character).`,
    `Canvas: 1536x1024: a strict grid of 3 columns x 4 rows, every cell exactly 512x256, one item view per cell, centred.`,
    ITEM_COLS,
    rowLines,
    rowRule,
    sizeRule,
    backEmpty ? "The BACK column (column 3) stays completely empty in every row." : "",
    `Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; the same item keeps identical colours, proportions and pixel size in all its views; ${NO_TEXT}`,
    STYLE_REF,
  ]
    .filter(Boolean)
    .join("\n");
  return { id, title, kind: "equipment", thread, threadNote, refs, check, prompt, save: `tmp/pitch-src/equipment/acc-${id}.png`, size: "1536×1024", convert: `pnpm convert:pitch-art -- equipment ${id}`, use };
}

const ITEM_CHECK =
  "3열×4행 그리드 정확, 셀당 1개, 캐릭터·머리·몸 없음, 같은 아이템의 세 방향이 색·비율·픽셀 크기 일치, 크기가 레퍼런스 캐릭터 머리 기준으로 자연스러움, 글자·숫자 없음, 마젠타/핑크 잔여 없음, 외곽 후광 없음";

const steps = [];

steps.push(
  itemSheet({
    id: "hat-a",
    title: "모자 시트 A (야구모자·비니·왕관·마법사 모자)",
    slot: "hat",
    rows: [
      "a navy baseball cap with a mint front panel, a curved brim and a small round pixel emblem (no letters)",
      "a mustard-yellow knit beanie with a folded cuff and a round pom-pom on top",
      "a gold royal crown with five points and red round gems",
      "a tall purple wizard hat with a floppy bent tip, a wide brim and gold stars",
    ],
    rowRule:
      "Placement rule for hats: in every cell the hat is centred horizontally on the head axis and its lower edge (brim edge or band edge) touches the same horizontal baseline near the lower part of the cell, as if resting on the top of a head; the interior space under the hat is transparent (the head is NOT drawn).",
    sizeRule:
      "Size rule: the hat band is about 1.15x the head width of the reference character; the baseball cap is about 260 px wide in its cell, the other hats scale proportionally; keep every item fully inside its cell.",
    thread: "new",
    threadNote: "`T-PCH-EQP` (착용 아이템 4시트가 공유하는 스레드)",
    refs: [
      `**필수** 승인본 \`${STAND}\` — **머리 크기 기준용**(아이템 크기 판단에만 쓰고 캐릭터는 그리지 말라고 프롬프트에 명시)`,
      `선택 \`${IDLE}\` — 정면·측면·후면 idle 3방향 머리 위치 확인용`,
    ],
    check: ITEM_CHECK + ", 모자 아래쪽 밑단이 행마다 같은 기준선에 놓임, 모자 안쪽 머리 없음",
    use: "변환 시 셀별로 알파 bbox 를 잘라 정규화 셀(앵커 = 밑단 중앙)로 만들고 카탈로그 `wearScale` 로 머리 폭에 맞춘다. 아이콘 = FRONT 컷",
  }),
);
steps.push(
  itemSheet({
    id: "hat-b",
    title: "모자 시트 B (밀짚모자·헤드폰·산타 모자·카우보이 모자)",
    slot: "hat",
    rows: [
      "a woven straw hat with a wide round brim and a red band",
      "over-ear headphones: a navy headband arching over where the head would be and two mint ear cups on the sides (in SIDE view only one ear cup and the band are visible)",
      "a red Santa hat with a white fur cuff and a white pom-pom hanging at the tip",
      "a brown cowboy hat with a curled wide brim, a dented crown and a yellow band",
    ],
    rowRule:
      "Placement rule: identical to the previous hat sheet: centred on the head axis, lower edge on a common baseline, nothing drawn inside where the head would be. For the headphones the ear cups sit level with the baseline area and the band arcs above it.",
    sizeRule:
      "Size rule: same scale as the previous hat sheet (the attached approved sheet); the straw hat and cowboy hat brims are about 1.5x the head width.",
    thread: "continue:T-PCH-EQP",
    threadNote: "`T-PCH-EQP` (첫 스텝은 #I01)",
    refs: [
      "**필수** 승인본 `tmp/pitch-src/equipment/acc-hat-a.png` (#I01) — 같은 배치·크기·기준선·스타일",
      `**필수** \`${STAND}\` — 머리 크기 기준`,
    ],
    check: ITEM_CHECK + ", 헤드폰은 정면 = 밴드+양쪽 컵, 측면 = 컵 1개+밴드, 후면 = 정면과 같은 구성",
    use: "hat-a 와 같은 규칙. 헤드폰은 모자 슬롯(밑단 = 컵 중심선 근처)이라 앵커 오프셋을 카탈로그에서 개별 지정",
  }),
);
steps.push(
  itemSheet({
    id: "face-a",
    title: "얼굴 시트 A (선글라스·동그란 안경·하트 안경·안대)",
    slot: "face",
    rows: [
      "black wrap sunglasses with a small cyan glint on each lens",
      "thin round gold-frame glasses with clear pale-blue lenses",
      "heart-shaped glasses with a coral-red frame (#ff4d6d) and clear lenses",
      "a black pirate eye patch over the right eye with a thin strap going around (in FRONT view the strap runs diagonally across where the forehead would be)",
    ],
    backEmpty: true,
    rowRule:
      "Placement rule for face items: in every cell the item is centred horizontally on the face axis and vertically centred on the eye line, which is the middle of the cell height; in SIDE view show the item in profile including the temple arm going back; nothing is drawn behind or around the item (no face, no head).",
    sizeRule:
      "Size rule: the glasses are about 0.85x the head width of the reference character (about 190 px wide in FRONT view in a 512 px cell); same scale for all four items.",
    thread: "continue:T-PCH-EQP",
    threadNote: "`T-PCH-EQP` (첫 스텝은 #I01)",
    refs: [
      "**필수** 승인본 `tmp/pitch-src/equipment/acc-hat-a.png` (#I01) — 스타일·픽셀 크기·머리 대비 스케일",
      `**필수** \`${STAND}\` — 머리 크기 기준`,
    ],
    check: ITEM_CHECK + ", 3열(후면)은 완전히 비어 있음(런타임은 up 방향에서 얼굴 아이템을 숨김), 정면/측면만 채워짐",
    use: "FRONT·SIDE 컷만 사용, 앵커 = 눈높이 중앙. up 방향에서는 그리지 않음",
  }),
);
steps.push(
  itemSheet({
    id: "back-a",
    title: "등 시트 A (붉은 망토·천사 날개·악마 날개·책가방)",
    slot: "back",
    rows: [
      "a red hero cape with a gold clasp and gold trim, hanging straight down with a slightly flared hem",
      "a pair of white angel wings with soft layered feathers and pale-blue shading",
      "a pair of dark purple bat-like devil wings with a coral-red inner membrane (no pink, no magenta)",
      "a navy school backpack with a mint stripe, two straps and a small buckle",
    ],
    rowRule:
      "Placement rule for back items: draw the COMPLETE item as it looks from that direction, without any body (the body will be drawn over or under it by the game). Anchor: in every cell the item is centred horizontally on the body axis and its top edge (cape collar, wing base, backpack top) sits on the same horizontal line in the upper part of the cell. FRONT view = item seen from the front side of the wearer (its inner side, wings spread behind), SIDE view = profile facing right (the item hangs behind the wearer's back, on the left of the cell), BACK view = the outer side of the item as seen from behind.",
    sizeRule:
      "Size rule: the cape and backpack are about 1.5x the head width; the wing pair spans about 2.6x the head width in FRONT and BACK views; scale relative to the head size of the reference character; keep every item fully inside its cell.",
    thread: "continue:T-PCH-EQP",
    threadNote: "`T-PCH-EQP` (첫 스텝은 #I01)",
    refs: [
      "**필수** 승인본 `tmp/pitch-src/equipment/acc-hat-a.png` (#I01) — 스타일·픽셀 크기",
      `**필수** \`${STAND}\` — 몸·머리 크기 기준`,
      `**필수** \`${IDLE}\` — 후면(up) idle 몸통 크기·위치 확인용(등 아이템이 몸 뒤/앞에 어떻게 놓이는지)`,
    ],
    check: ITEM_CHECK + ", 세 방향이 같은 아이템으로 읽힘, 앵커 기준선(상단)이 행마다 일치",
    use: "레이어 순서: FRONT·SIDE = 몸 뒤, BACK = 몸 앞. 앵커 = 목덜미(머리 꼭대기 + 몸통 오프셋)",
  }),
);

// ───────────────────────── 펫 ─────────────────────────
const PET_COLS =
  "Columns (left to right, identical in every row): column 1 = idle frame A, column 2 = idle frame B (a tiny 2-pixel breathing bob or squash difference from A), column 3 = move frame A, column 4 = move frame B (a two-frame hop or waddle cycle; B is the opposite pose of A).";
const PET_ROWS =
  "Rows (top to bottom): row 1 = FRONT view (facing the camera), row 2 = SIDE view (facing right), row 3 = BACK view (seen from behind).";
const PET_RULES = `Rules: the same pet, identical colours, proportions and pixel size in all 12 cells; the feet or the bottom of the body of every cell sit on a common baseline at about 80% of the cell height; the pet fills about 60-70% of the cell width; no ground shadow, no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; ${NO_TEXT}`;
const PET_CANVAS = "Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly 384x341, one pet pose per cell, centred.";
const PET_CHECK =
  "4열×3행 그리드 정확, 12칸 모두 같은 펫(색·비율·얼굴 일치), 앞/옆(오른쪽)/뒤 방향이 맞음, idle A/B·move A/B 가 확실히 다른 포즈, 발 기준선 일치, 접지 그림자·글자 없음, 마젠타/핑크 잔여 없음";

function commonPet({ id, name, desc, first }) {
  const prompt = [
    STYLE,
    BG_TRANSPARENT,
    `Subject: a small cute mascot pet for a football arcade game: ${desc}. Chibi proportions, a big readable face, no accessories unless described.`,
    PET_CANVAS,
    PET_COLS,
    PET_ROWS,
    PET_RULES,
    first
      ? "Use the attached image as the style reference for pixel size, outline, palette and lighting (it shows the SAME game); do not copy its subject."
      : "Use the attached approved pet sheet as the layout AND style reference (same grid, same pose logic, same pixel size, outline and palette), but draw the different pet described above.",
  ].join("\n");
  return {
    id: `pet-${id}`,
    title: `공용 펫 · ${name}`,
    kind: "pet",
    thread: first ? "new" : "continue:T-PCH-PET-COM",
    threadNote: first ? "`T-PCH-PET-COM` (공용 펫 6장)" : "`T-PCH-PET-COM` (첫 스텝은 #I05)",
    refs: first
      ? [`**필수** 승인본 \`${STAND}\` — 게임 스타일·픽셀 크기 기준(캐릭터는 그리지 않음)`, "선택 기존 `tmp/pitch-src/env/env-ball.png` — 공돌이처럼 공 소재가 있을 때 색 기준"]
      : ["**필수** 승인본 `tmp/pitch-src/pets/pet-cheezenyang.png` (#I05) — 그리드·포즈·스타일 기준"],
    check: PET_CHECK,
    prompt,
    save: `tmp/pitch-src/pets/pet-${id}.png`,
    size: "1536×1024",
    convert: `pnpm convert:pitch-art -- pets ${id}`,
    use: `펫 \`${id}\` (공용). 변환: 셀 슬라이스 → 셀당 48×48 정규화(발 기준선 맞춤) → 아틀라스 12프레임 + 인벤토리 아이콘(FRONT idle A)`,
  };
}

steps.push(commonPet({ id: "cheezenyang", name: "치즈냥", first: true, desc: "a small chubby orange tabby kitten with a cream belly, pointed ears, a coral nose and a short curled tail" }));
steps.push(commonPet({ id: "kkwaegi", name: "꽥이", desc: "a round yellow duckling with a flat orange beak, tiny wings and small orange webbed feet" }));
steps.push(commonPet({ id: "mallangi", name: "말랑이", desc: "a glossy translucent mint-green slime blob with a bright highlight, two small dot eyes, a small smile and a tiny drip on one side" }));
steps.push(commonPet({ id: "gongdori", name: "공돌이", desc: "a small white football with navy pentagon patches that has two tiny arms, two tiny legs and two round eyes on its front, a football spirit" }));
steps.push(commonPet({ id: "ppiyagi", name: "삐약이", desc: "a fluffy round pale-yellow chick with a tiny orange beak, tiny orange legs and a small tuft on its head" }));
steps.push(commonPet({ id: "ttuttu", name: "뚜뚜", desc: "a boxy little silver-blue robot with a round screen face showing two cyan eyes, one antenna with a glowing cyan bulb and tiny wheels" }));

const EXCLUSIVE = [
  { id: "panchi", name: "팬치", owner: "우왁굳 (woowakgood)", thread: "T-PCH-PET-EXC-1", note: "침팬치를 형상화한 펫" },
  { id: "haepi", name: "해피", owner: "해파린 (haepalin)", thread: "T-PCH-PET-EXC-1", note: "해파리를 형상화한 펫" },
  { id: "gureumi", name: "구르미", owner: "재닌 (janine95kim)", thread: "T-PCH-PET-EXC-1", note: "구름을 형상화한 펫" },
  { id: "yongboli", name: "용볼이", owner: "하치 (hachi97)", thread: "T-PCH-PET-EXC-1", note: "드래곤볼을 형상화한 펫" },
  { id: "baemsuri", name: "뱀술이", owner: "리냐 (lina0108)", thread: "T-PCH-PET-EXC-2", note: "뱀을 형상화했지만 둥근 형태이고 뱀과 닮지 않았음 — 레퍼런스를 있는 그대로 따를 것(뱀답게 고치지 말 것)" },
  { id: "dolmengi", name: "돌멩이", owner: "쥬멩이 (ju010228)", thread: "T-PCH-PET-EXC-2", note: "돌을 형상화한 펫" },
  { id: "sibakkeo", name: "시바꺼", owner: "다시바 (tdnlamuron, 요청의 '시바')", thread: "T-PCH-PET-EXC-2", note: "시바견을 형상화한 펫" },
  { id: "penguin", name: "펭귄", owner: "핑구 (sjh4018)", thread: "T-PCH-PET-EXC-2", note: "펭귄" },
  { id: "bongbabi", name: "봉밥이", owner: "빙밍 (tleod1818)", thread: "T-PCH-PET-EXC-3", note: "" },
  { id: "dangyeol", name: "단결", owner: "한결 (kaksjak0730)", thread: "T-PCH-PET-EXC-3", note: "" },
  { id: "bbogeulseu", name: "뽀글스", owner: "뽀린걸 (bboringirl)", thread: "T-PCH-PET-EXC-3", note: "" },
  { id: "ungnami", name: "웅남이", owner: "문모모 (doormomo)", thread: "T-PCH-PET-EXC-3", note: "" },
];

EXCLUSIVE.forEach((p, i) => {
  const firstOfThread = i % 4 === 0;
  const prompt = [
    STYLE,
    BG_TRANSPARENT,
    "Subject: a small game mascot pet. Attached image 1 is the EXACT design of this pet: keep its shapes, proportions, colours, face and every detail identical; do not redesign, reinterpret, simplify into something else, or add or remove features. Re-draw it as a small game pet in the pixel art style of attached image 2.",
    PET_CANVAS,
    PET_COLS,
    PET_ROWS,
    "For the BACK row, draw the back side of the same creature in a way that is consistent with attached image 1; do not invent new features.",
    PET_RULES,
    "Attached image 2 is the approved pet sheet: use it for the grid layout, pose logic, pixel size, outline and palette treatment only, never for the design of the creature.",
  ].join("\n");
  steps.push({
    id: `pet-${p.id}`,
    title: `전용 펫 · ${p.name} (${p.owner} 전용)`,
    kind: "pet-exclusive",
    thread: firstOfThread ? "new" : `continue:${p.thread}`,
    threadNote: firstOfThread ? `\`${p.thread}\` (전용 펫 4장)` : `\`${p.thread}\` (이 스레드의 첫 스텝은 아래 진행 표 참고)`,
    refs: [
      `**필수 1** 사용자 제공 펫 레퍼런스 \`tmp/pitch-src/refs/pet-${p.id}-ref.png\` — 디자인 기준${p.note ? ` (${p.note})` : ""}`,
      "**필수 2** 승인본 `tmp/pitch-src/pets/pet-cheezenyang.png` (#I05) — 시트 그리드·포즈·스타일 기준(이 펫의 디자인은 복사하지 않음)",
    ],
    check: PET_CHECK + ", **레퍼런스와 디자인이 동일**(형태·색·얼굴 재해석 금지" + (p.id === "baemsuri" ? ", 특히 뱀답게 고치지 않았는지" : "") + ")",
    prompt,
    save: `tmp/pitch-src/pets/pet-${p.id}.png`,
    size: "1536×1024",
    convert: `pnpm convert:pitch-art -- pets ${p.id}`,
    use: `\`${p.owner}\` 전용 펫 \`${p.id}\`. 카탈로그 \`exclusiveTo\` 로 해당 캐릭터의 펫 탭에서만 노출`,
  });
});

// ───────────────────────── UI ─────────────────────────
const UI_STYLE_REFS = [
  "**필수** 기존 승인본 `tmp/pitch-src/ui/terminal-frame.png` — 프레임 외곽선·금색/민트 팔레트·픽셀 크기",
  "**필수** 기존 승인본 `tmp/pitch-src/ui/detail-panel.png` — 패널 안쪽 질감·두께",
];
const UI_NOTE = `${NO_TEXT} All UI is delivered WITHOUT any lettering; text is drawn later by the game.`;

function ui({ id, title, size, subject, canvas, rules, check, use, first, extraRefs = [] }) {
  const prompt = [STYLE, BG_TRANSPARENT, `Subject: ${subject}`, canvas, rules, UI_NOTE, STYLE_REF].join("\n");
  return {
    id: `ui-inv-${id}`,
    title,
    kind: "ui",
    thread: first ? "new" : "continue:T-PCH-UI-INV",
    threadNote: first ? "`T-PCH-UI-INV` (인벤토리 UI 8장, 프레임이 스타일 앵커)" : "`T-PCH-UI-INV` (첫 스텝은 #I23)",
    refs: first ? UI_STYLE_REFS : ["**필수** 승인본 `tmp/pitch-src/ui/ui-inv-frame.png` (#I23) — 인벤토리 UI 스타일 앵커", ...extraRefs],
    check,
    prompt,
    save: `tmp/pitch-src/${id === "sparkle" ? "fx/fx-equip-sparkle" : `ui/ui-inv-${id}`}.png`,
    size,
    convert: id === "sparkle" ? "pnpm convert:pitch-art -- fx equip-sparkle" : `pnpm convert:pitch-art -- ui inv-${id}`,
    use,
  };
}

steps.push(
  ui({
    id: "frame",
    first: true,
    title: "인벤토리 창 프레임",
    size: "1536×1024 (3:2, 최종 720×480)",
    subject:
      "the full window frame of a locker-cabinet inventory screen for a football arcade game, seen straight-on. A chunky navy window with a gold (#ffd23f) frame and a thin mint trim, a slim title bar along the top (empty, no text), two large recessed dark-navy panels below it: a NARROW LEFT panel (a display area for a character preview) and a WIDER RIGHT panel (an item list area), with a slim empty bottom bar under both panels for buttons. The interiors of both panels are flat dark navy with a very subtle pixel texture, completely EMPTY, no slots, no buttons, no icons, no characters. Small rivets or corner brackets on the frame corners, a subtle locker-door slot pattern (thin vertical vent lines) only on the title bar.",
    canvas:
      "Canvas: 1536x1024 (exact 3:2). The window fills the WHOLE canvas edge to edge (the outer frame touches all four canvas edges). Layout in canvas fractions: title bar = top 10%; left panel = x 2.2% to 37.8%, y 11.7% to 85%; right panel = x 40% to 97.8%, y 11.7% to 85%; bottom bar = y 86.7% to 98%.",
    rules:
      "Rules: perfectly symmetric outer frame, thick enough (about 3% of the width) to be used as a 9-slice, flat empty panel interiors, no shadows outside the frame, no cell borders or grid lines inside the panels.",
    check:
      "정확히 3:2, 창이 캔버스를 가득 채움, 좌(좁음)/우(넓음) 패널이 지정 비율 위치, 패널 안이 완전히 비어 있음(슬롯·버튼·캐릭터·글자 없음), 프레임 좌우상하 대칭, 마젠타 잔여 없음",
    use: "`InventoryScene` 배경(720×480, 창 위치 (120,30)). 패널 좌표는 `13-locker-inventory-spec.md` §5 의 레이아웃 표를 따른다",
  }),
);
steps.push(
  ui({
    id: "preview-stage",
    title: "미리보기 무대 (스포트라이트 바닥)",
    size: "1024×1536 (상단 1024×1408 = 8:11 영역 사용, 최종 256×352)",
    subject:
      "a character display stage for the left panel of the inventory: a dark navy back wall with faint vertical locker-door lines, a round raised podium floor in the lower third with a mint rim and a soft cool-white spotlight cone falling from the top centre onto the podium, tiny floating sparkle pixels near the podium, no character on it.",
    canvas:
      "Canvas: 1024x1536. The stage art fills the full width and ONLY the top 1408 px (aspect exactly 8:11); the bottom 128 px of the canvas stays completely empty/transparent. The podium centre is at 50% width and 76% of the 1408 px height.",
    rules: "Rules: the podium top surface is a flat ellipse where a character can stand; the stage art has its own opaque dark background (it fills its whole area, no transparency inside), no text, no character, no props.",
    check: "상단 8:11 영역만 사용, 하단 128px 비어 있음, 연단이 하단 3분의 1 중앙에 있고 캐릭터가 서기 좋은 평평한 타원, 스포트라이트가 가운데를 비춤, 캐릭터·글자 없음",
    use: "미리보기 캐릭터 뒤 배경. 연단 중심 좌표가 캐릭터 발 위치(스펙 §5)",
  }),
);
steps.push(
  ui({
    id: "tabs",
    title: "탭 버튼 4종 × 3상태",
    size: "1536×1024 (상단 1536×432 사용, 최종 96×36 ×12)",
    subject:
      "category tab plates for the inventory, four categories in four columns: (1) HAT tab with a small pixel cap icon on the left of the plate, (2) FACE tab with a small pixel glasses icon, (3) BACK tab with a small pixel cape/wings icon, (4) PET tab with a small pixel paw print icon. Rows are states: row 1 = NORMAL (dark navy plate, mint outline), row 2 = HOVER (slightly brighter plate, gold outline), row 3 = ACTIVE/SELECTED (bright gold-lit plate that looks joined to the panel below, mint icon glow limited to inside the outline). The right 60% of every plate is left flat EMPTY for a text label added later.",
    canvas:
      "Canvas: 1536x1024, but the grid occupies ONLY the top 1536x432: 4 columns x 3 rows, every cell exactly 384x144, one plate per cell filling about 92% of the cell width; the remaining canvas below y=432 stays completely empty/transparent.",
    rules: "Rules: all 12 plates have the identical outline shape and size; icons are simple and readable at 20x20 px; no lettering.",
    check: "상단 1536×432 안에 4열×3행, 12칸 모두 같은 판 모양, 아이콘 4종이 열마다 일치, 상태(normal/hover/active)가 행으로 구분됨, 오른쪽 60%는 비어 있음, 글자 없음",
    use: "탭 4개 (모자/얼굴/등/펫). 라벨은 캔버스 텍스트",
  }),
);
steps.push(
  ui({
    id: "slot",
    title: "아이템 슬롯 5상태",
    size: "1536×1024 (3×2 그리드, 셀 512×512 → 최종 64×64)",
    subject:
      "an inventory item slot tile (a square recessed dark-navy tile with a thin mint outline and slightly bevelled corners) drawn in five states, all with an EMPTY centre for an item icon: (1) NORMAL, (2) HOVER (brighter outline, faint lighter fill), (3) SELECTED (thick gold outline with small gold corner brackets), (4) EQUIPPED (mint outline with a mint corner ribbon in the top-left, no lettering), (5) EMPTY/NONE (dashed-look dim outline, darker fill).",
    canvas: "Canvas: 1536x1024: a strict grid of 3 columns x 2 rows, every cell exactly 512x512, states in reading order (NORMAL, HOVER, SELECTED / EQUIPPED, EMPTY, and the sixth cell left completely empty). Each tile fills about 92% of its cell and is a perfect square.",
    rules: "Rules: all tiles have exactly the same size and outline thickness; the tile centre area (about 70%) is flat and empty; no icons, no text.",
    check: "3×2 그리드, 5개 상태가 순서대로, 6번째 칸 비어 있음, 타일이 모두 같은 크기의 정사각형, 중앙이 비어 있음, 글자·아이콘 없음",
    use: "아이템 그리드 슬롯 (4×3, 64×64)",
  }),
);
steps.push(
  ui({
    id: "btn",
    title: "버튼 판 3상태 + 화살표 원형 버튼",
    size: "1536×1024 (상단 밴드 사용, 판 최종 96×36, 원형 28×28)",
    subject:
      "row A: one rectangular action button plate (dark navy fill, gold outline, chunky bevel) in three states: NORMAL, HOVER (brighter with a mint top highlight), PRESSED (darker, shifted 2 px down); the centre of the plate is EMPTY for a text label. Row B: six small round buttons: a LEFT arrow and a RIGHT arrow (chunky pixel triangles), each in NORMAL, HOVER and PRESSED states.",
    canvas:
      "Canvas: 1536x1024 with two bands: band A = y 0 to 192: 3 cells side by side, each exactly 512x192, one plate per cell filling about 92% of the cell width; band B = y 192 to 448: 6 cells side by side, each exactly 256x256, order LEFT-normal, LEFT-hover, LEFT-pressed, RIGHT-normal, RIGHT-hover, RIGHT-pressed, each circle filling about 88% of its cell; everything below y=448 stays empty/transparent.",
    rules: "Rules: same outline thickness and palette as the approved frame; no lettering on any button.",
    check: "밴드 A 3칸(512×192)·밴드 B 6칸(256×256) 위치 정확, 판 3상태 구분, 화살표 좌/우 × 3상태 순서, 판 중앙 비어 있음, 글자 없음",
    use: "[적용][해제][전체 해제][닫기] 버튼 (텍스트는 캔버스), 방향 회전 ◀▶·페이지 넘김 ◀▶",
    extraRefs: ["선택 기존 `tmp/pitch-src/ui/ui-buttons.png` — 게임 전반 버튼 톤"],
  }),
);
steps.push(
  ui({
    id: "infocard",
    title: "정보 카드 판 (9-slice)",
    size: "1024×1024 (정사각형 9-slice, 가로세로 늘려 사용)",
    subject:
      "an item information card plate: a dark-navy rounded-rectangle panel with a mint outline and gold corner brackets, a slightly lighter header band along the top (empty) and a flat empty body area, matching the approved window frame style.",
    canvas: "Canvas: 1024x1024 square. The plate fills about 96% of the canvas. All decorative details (corner brackets, outline, header band) stay within the outer 14% of each side so the flat centre can be stretched.",
    rules: "Rules: perfectly symmetric left/right, flat and empty centre, no text, no icons.",
    check: "정사각형, 좌우 대칭, 장식이 바깥 14% 안에만 있음(9-slice 가능), 가운데가 평평하고 비어 있음, 글자 없음",
    use: "아이템 선택 시 이름·슬롯·전용 배지를 보여주는 카드. 9-slice 인셋 ≈ 12px(구현 시 확정)",
  }),
);
steps.push(
  ui({
    id: "badges",
    title: "배지 4종 (착용중·전용·NEW·잠금)",
    size: "1024×1024 (상단 밴드 사용, 최종 16×16 ×4)",
    subject:
      "four tiny slot badges: (1) EQUIPPED: a mint circle with a white check mark, (2) EXCLUSIVE: a gold five-point star on a navy circle, (3) NEW: a coral-red (#ff4d6d) diamond with a white exclamation-like sparkle (no letters), (4) LOCKED: a grey padlock on a navy circle.",
    canvas: "Canvas: 1024x1024, but only the top band y 0 to 256 is used: 4 cells side by side, each exactly 256x256, one badge per cell filling about 80% of the cell; everything below y=256 stays empty/transparent.",
    rules: "Rules: each badge is readable at 16x16 px, uses a thick navy outline, and contains no text or numerals.",
    check: "상단 밴드 4칸(256×256), 배지 4종이 순서대로, 16px 크기에서도 읽힐 만큼 단순함, 글자·숫자 없음",
    use: "슬롯 모서리 배지(착용중 ✔·전용 ★). NEW·잠금은 v1 미사용 예약",
  }),
);
steps.push(
  ui({
    id: "sparkle",
    title: "착용 이펙트 스파클 6프레임",
    size: "1536×1024 (3×2 그리드, 셀 512×512 → 최종 64×64)",
    subject:
      "a six-frame equip sparkle effect, in reading order: (1) a small white-gold star flash, (2) the flash growing with four tiny stars around it, (3) a ring of gold and mint sparkles at maximum size, (4) the ring expanding and thinning, (5) a few scattered fading sparkle pixels, (6) two last tiny pixels. The effect is centred in each cell and radially symmetric.",
    canvas: "Canvas: 1536x1024: a strict grid of 3 columns x 2 rows, every cell exactly 512x512, one frame per cell, the effect centred; peak size (frame 3) fills about 85% of the cell.",
    rules: "Rules: pure effect, no character, no item, no text; no glow halo (hard-edged pixels only, gold #ffd23f, mint #2ee8b6, white).",
    check: "3×2 그리드 6프레임이 순서대로 커졌다 사라짐, 셀 중앙 정렬, 3번째가 최대 크기, 후광·글자 없음",
    use: "아이템 착용·펫 변경 시 미리보기 캐릭터 위에 재생(fx 그룹). 기존 `fx-*` 와 같은 톤",
  }),
);

// ───────────────────────── 번호 매기기 ─────────────────────────
steps.forEach((s, i) => (s.no = `#I${String(i + 1).padStart(2, "0")}`));
const firstStepOfThread = {};
for (const s of steps) {
  const t = s.thread === "new" ? s.threadNote.match(/`([^`]+)`/)[1] : s.thread.replace("continue:", "");
  if (s.thread === "new") firstStepOfThread[t] = s.no;
  s.threadName = t;
}
for (const s of steps) {
  if (s.thread !== "new") {
    s.threadNote = `\`${s.threadName}\` (이 스레드의 첫 스텝은 ${firstStepOfThread[s.threadName]} — 그 스텝을 만든 대화)`;
  }
}

// ───────────────────────── 렌더링 ─────────────────────────
const out = [];
out.push(`# 14. 락커룸 인벤토리 이미지 생성 실행 순서표 (ChatGPT gpt-image)

락커룸 캐비닛 인벤토리(캐릭터 꾸미기 + 펫) 기능에 필요한 이미지 **${steps.length}장**의 개별 지시서다. 각 스텝에 **저장 이름 / 스레드 / 첨부할 레퍼런스 / 검수 체크 / 변환 명령 / 프롬프트(독립형)** 가 있다. 설계는 [13-locker-inventory-spec.md](13-locker-inventory-spec.md). 사용법·검수 규칙은 [09](09-image-generation-runbook.md)와 같다(같은 게임이므로 스타일 문단도 동일).

> **이 문서는 스크립트로 생성된다.** \`node docs/pitch/tools/build-inventory-runbook.mjs\` 로 재생성한다. 목록·프롬프트를 고치려면 생성기를 수정한다(문서를 직접 고치면 덮어써진다). 스텝 번호는 09 와 겹치지 않도록 \`#I01\`~\`#I${String(steps.length).padStart(2, "0")}\` 를 쓴다.
>
> **월드 이미지는 레퍼런스로 첨부하지 않는다**(프로젝트 원칙). 이 이미지들은 16비트 아케이드 스포츠 스타일의 피치 게임용이다.

## 사용법

1. 스텝의 **스레드** 지시를 따른다. \`🆕 새 스레드\`면 새 대화를 열고, \`↪ 이어서\`면 그 스레드를 만든 **같은 대화**에 계속 요청한다.
2. **레퍼런스 첨부**의 필수 파일을 올린 뒤 **프롬프트 전체**를 붙여넣는다. 프롬프트는 스타일 문단을 전부 풀어 담고 있어 그대로 복사하면 된다.
3. 결과를 **검수 체크**로 확인하고, 마음에 안 들면 같은 스레드에서 \`Keep everything, but fix: …\` 로 수정을 요청한다(전체 재생성이 더 안전할 때가 많다).
4. 통과하면 **저장 이름**으로 저장한다(폴더가 없으면 만든다). 다음 스텝의 레퍼런스가 이 파일이다.
5. 스텝 끝의 \`- [ ]\` 를 체크한다.
6. 투명 배경이 안 나오면 \`#FF00FF\` 단색 배경 결과를 그대로 저장해도 된다(변환기가 키잉). **그리드 열×행과 셀 순서**만 지켜지면 크기 드리프트는 변환기가 처리한다.
7. 글자·숫자가 이미지에 생기면 **재생성**한다(텍스트는 캔버스가 그린다).
8. **첨부는 이미지로**: 펫 프롬프트에는 펫의 생김새를 글로 묘사하지 않는다. 전용 펫은 **사용자 제공 레퍼런스를 첨부**하고 "그대로 따라 그려라"만 지시한다(공용 펫 6종만 짧은 묘사가 있다).
9. **사용자 준비물**: 전용 펫 12장의 레퍼런스를 \`tmp/pitch-src/refs/pet-<펫id>-ref.png\` 로 미리 복사해 둔다(펫 id 는 아래 진행 표의 저장 이름 참고). 변환은 각 스텝의 **변환** 줄 명령(\`pnpm convert:pitch-art -- equipment|pets|ui|fx <id>\`)으로 한다. 이미지가 아직 없는 스텝은 코드가 기본 도형/무표시로 동작하므로 나중에 저장·변환만 하면 된다.

## 셀 규격 요약

| 종류 | 캔버스 | 그리드 | 셀 | 방향 |
| --- | --- | --- | --- | --- |
| 착용 아이템 시트 | 1536×1024 | 3열×4행 | 512×256 | 열 = FRONT(down) / SIDE(오른쪽) / BACK(up), 행 = 아이템 4종 |
| 펫 시트 | 1536×1024 | 4열×3행 | 384×341 | 열 = idle A·B / move A·B, 행 = FRONT / SIDE(오른쪽) / BACK |
| UI | 스텝별 | 스텝별 | 스텝별 | 각 스텝 프롬프트의 Canvas 문장 |

## 스레드 목록

| 스레드 | 설명 | 스텝 |
| --- | --- | --- |`);
const threads = new Map();
for (const s of steps) {
  if (!threads.has(s.threadName)) threads.set(s.threadName, []);
  threads.get(s.threadName).push(s.no);
}
const threadDesc = {
  "T-PCH-EQP": "착용 아이템 시트 4장 (모자 A·B, 얼굴, 등)",
  "T-PCH-PET-COM": "공용 펫 6장 (첫 장 = 스타일 앵커)",
  "T-PCH-PET-EXC-1": "전용 펫 4장 (팬치·해피·구르미·용볼이)",
  "T-PCH-PET-EXC-2": "전용 펫 4장 (뱀술이·돌멩이·시바꺼·펭귄)",
  "T-PCH-PET-EXC-3": "전용 펫 4장 (봉밥이·단결·뽀글스·웅남이)",
  "T-PCH-UI-INV": "인벤토리 UI 8장 (프레임이 스타일 앵커)",
};
for (const [t, nos] of threads) out.push(`| \`${t}\` | ${threadDesc[t] ?? ""} | ${nos.join(", ")} |`);

out.push(`
> 스레드가 길어져 품질이 떨어지면 새 스레드를 열고 **직전에 승인한 결과 1장**을 톤 샘플로 첨부한다. 전용 펫은 스레드를 4장 단위로 끊어 다른 펫의 디자인이 섞이는 것을 막는다.

## 진행 표

| # | 저장 이름 | 스레드 | ✓ |
| --- | --- | --- | --- |`);
for (const s of steps) {
  const mark = s.thread === "new" ? " 🆕" : "";
  out.push(`| ${s.no} | \`${s.save.replace("tmp/pitch-src/", "")}\` | \`${s.threadName}\`${mark} | [ ] |`);
}

out.push(`
## 권장 순서

1. #I01~#I04 (착용 아이템) → 2. #I05~#I10 (공용 펫, #I05 가 펫 시트 스타일 앵커) → 3. #I23~#I30 (UI, 프레임 먼저) → 4. #I11~#I22 (전용 펫, 사용자 레퍼런스 준비 후). 코드는 아트가 없으면 사각형·기본 폴백으로 동작하므로 이미지 생성과 구현을 병행할 수 있다.
`);

for (const s of steps) {
  const threadLine = s.thread === "new" ? `🆕 **새 스레드 시작** — ${s.threadNote}` : `↪ **이어서** — ${s.threadNote}`;
  out.push(`## ${s.no} · ${s.title}

- **저장 이름**: \`${s.save}\` (${s.size})
- **스레드**: ${threadLine}
- **레퍼런스 첨부**:
${s.refs.map((r) => `  - ${r}`).join("\n")}
- **검수 체크**: ${s.check}
- **변환**: \`${s.convert}\`
- **최종 사용**: ${s.use}

**프롬프트**

\`\`\`text
${s.prompt}
\`\`\`

- [ ] ${s.no} 생성·저장 완료
`);
}

writeFileSync(OUT, out.join("\n"), "utf8");
console.log(`wrote ${OUT} (${steps.length} steps)`);
