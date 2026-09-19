# 12. turn 시트 재생성 요청서 — walk 비율에 맞춰 다시 그리기

잔디동 월드 캐릭터 18명의 `turn`(정면·우측·후면 서 있는 자세) 시트가 `walk`·`stand`보다 **세로로 길쭉해서** 게임에서 idle 자세가 걷기 자세보다 홀쭉해 보인다. 이 문서는 18개 `turn` 원본을 walk 비율로 다시 생성하기 위한 **캐릭터별 독립 프롬프트·저장 파일명·첨부 레퍼런스**를 정리한다. 동물 2종(`cat-jandi`, `dog-ball`)은 turn이 없으므로 대상이 아니다. 변환과 웹 연결은 개발 세션에서 한다.

## 1. 무엇이 문제인가

변환 스크립트는 `turn` 정면 컷을 idle(아틀라스 0행)로, `walk`를 1~3행으로 쓰고, **각 시트의 정면 키를 같은 높이(58px)로 맞춘다**([convert-world-art.mjs](../../scripts/convert-world-art.mjs) `scaleFrames`). 그래서 키는 같아지지만 **가로 폭은 원본 비율 그대로** 남는다. turn 원본이 더 길쭉하면 idle은 같은 키에서 훨씬 좁아진다.

재닌 시트를 눈으로 대조하면 가장 큰 차이는 머리 크기다. turn은 머리(모자 포함)가 전체 키의 약 30%(약 3.5등신)인데 walk는 약 45%(약 2.5등신 치비)다. 다리 길이 비율은 비슷하므로 **머리·몸통이 작고 얇게 그려진 것**이 길쭉해 보이는 주원인이다(다른 캐릭터는 수치 표로만 확인).

**측정값** (2026-09-20, 변환기의 스프라이트 추출기로 알파 240 이상 성분의 bbox 측정. 높이/너비, 클수록 길쭉함. walk 정면은 팔 흔들림 때문에 폭이 넓게 잡혀 차이가 **적게** 나오는 보수적 수치다):

| id | turn 정면 | walk 정면 | turn 비율 | walk 비율 | turn이 더 길쭉한 정도 |
| --- | --- | --- | ---: | ---: | ---: |
| `janine95kim` 재닌 | 399×893 | 203×333 | 2.24 | 1.64 | +36% |
| `bboringirl` 뽀린걸 | 461×906 | 224×336 | 1.97 | 1.50 | +31% |
| `sjh4018` 핑구 | 437×825 | 222×336 | 1.89 | 1.51 | +25% |
| `doormomo` 문모모 | 347×824 | 184×326 | 2.37 | 1.77 | +34% |
| `hachi97` 하치 | 348×830 | 166×323 | 2.39 | 1.95 | +23% |
| `kaksjak0730` 한결 | 432×871 | 219×327 | 2.02 | 1.49 | +35% |
| `ju010228` 쥬멩이 | 410×867 | 195×325 | 2.11 | 1.67 | +27% |
| `haepalin` 해파린 | 416×922 | 205×343 | 2.22 | 1.67 | +32% |
| `tleod1818` 빙밍 | 420×893 | 189×335 | 2.13 | 1.77 | +20% |
| `tdnlamuron` 다시바 | 366×824 | 170×320 | 2.25 | 1.88 | +20% |
| `lina0108` 리냐 | 478×888 | 218×324 | 1.86 | 1.49 | +25% |
| `woowakgood` 우왁굳 | 321×898 | 132×311 | 2.80 | 2.36 | +19% |
| `elder` 잔디 할아버지 | 454×810 | 193×309 | 1.78 | 1.60 | +11% |
| `shopkeeper` 편의점 사장님 | 395×922 | 168×332 | 2.33 | 1.98 | +18% |
| `kid` 꼬마 팬 | 394×722 | 190×304 | 1.83 | 1.60 | +15% |
| `referee` 심판 | 321×864 | 141×327 | 2.69 | 2.32 | +16% |
| `weedking` 제초왕 | 621×848 | 250×310 | 1.37 | 1.24 | +10% |
| `weeder-grunt` 제초 요원 | 466×853 | 199×319 | 1.83 | 1.60 | +14% |

- 격차가 큰 편(30% 이상): `janine95kim`, `bboringirl`, `kaksjak0730`, `doormomo`, `haepalin`. 그다음 `lina0108`, `ju010228`, `sjh4018`.
- `elder`, `weedking`은 격차가 작지만(10~11%) 같은 기준으로 맞추기 위해 함께 재생성한다.

## 2. 목표와 합격 기준

- **목표**: turn의 세 포즈(정면·우측·후면)를 같은 캐릭터 디자인 그대로, walk 시트와 같은 치비 비율(머리 약 40~45%, 짧은 몸통·다리, 큰 신발)로 다시 그린다.
- **비율 합격선**: turn 정면 컷의 `높이/너비`가 위 표의 **walk 비율의 ±10% 이내**. (예: 재닌 1.64 → 1.48~1.80)
- 정면·우측·후면 3컷 크기·픽셀 크기 동일, 발끝 기준선 동일, 컷 사이 간격과 10% 이상 여백.
- 머리 장식·머리 길이·소품 위치는 기존 turn과 walk에서 바뀌지 않음(디자인 변경 금지, 비율만 변경).
- 기존 규격 유지: 1536×1024, 가로 3등분(정면·우측·후면), 투명 PNG(불가하면 평면 `#FF00FF`), 글자·그림자·격자선 없음.

## 3. 공통 사용 규칙

1. **캐릭터마다 새 대화**를 연다(예: `T-<id>`). 다른 캐릭터 결과를 레퍼런스로 섞지 않는다.
2. **첨부 순서를 지킨다**: ① walk 시트(비율 기준) → ② 현재 turn 시트(디자인·측면·후면 기준) → ③ (멤버·우왁굳만, 선택) 원본 일러스트. 프롬프트가 "attached WALK sheet"와 "attached CURRENT turnaround sheet"를 이 순서로 가리킨다.
3. **`stand`는 첨부하지 않는다.** 측정상 stand도 walk보다 5~25% 길쭉해서(예: 재닌 stand 1.84 vs walk 1.64) 비율 기준을 흐릴 수 있다.
4. walk가 아직 **S7 교정 전(초기본)** 인 캐릭터도 정면·측면·후면의 비율은 같으므로 지금 있는 walk를 첨부한다. 나중에 walk가 교체되면 turn 재생성이 필요 없다(비율만 기준으로 쓰기 때문). 다만 S7 walk가 이미 도착했다면 새 파일을 첨부한다.
5. 결과가 여전히 길쭉하면 새 대화가 아니라 **같은 대화에서 §5 수정 프롬프트**를 보낸다.
6. 저장 전 **기존 turn을 백업**한다: `tmp/world-src/_backup/turn-2026-09-20/`에 `char-<id>-turn.png`를 복사(변환기는 `characters/` 폴더의 정확한 파일명만 읽는다).
7. 파일명은 아래 §4 표의 `저장 파일`과 **완전히 같게** 저장하고 `tmp/world-src/characters/`에 덮어쓴다.

## 4. 파일명·레퍼런스 한눈에 보기

walk 상태는 `tmp/world-src/characters/` 파일 수정 시각으로 추정했다(9/19 21~22시대 = S7 교정본, 12~14시대 = 초기본).

| id | 이름 | 저장 파일 (덮어쓸 파일) | ① 첨부: walk (비율 기준) | ② 첨부: 현재 turn (디자인 기준) | ③ 선택 첨부: 원본 일러스트 | walk 상태 | 세션 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `janine95kim` | 재닌 | `char-janine95kim-turn.png` | `char-janine95kim-walk.png` | `char-janine95kim-turn.png` (백업 전 원본) | `src/web/assets/group-photo/janine95kim.webp` | S7 교정본 | `T-janine95kim` |
| `bboringirl` | 뽀린걸 | `char-bboringirl-turn.png` | `char-bboringirl-walk.png` | `char-bboringirl-turn.png` (백업 전 원본) | `src/web/assets/group-photo/bboringirl.webp` | S7 교정본 | `T-bboringirl` |
| `sjh4018` | 핑구 | `char-sjh4018-turn.png` | `char-sjh4018-walk.png` | `char-sjh4018-turn.png` (백업 전 원본) | `src/web/assets/group-photo/sjh4018.webp` | S7 교정본 | `T-sjh4018` |
| `doormomo` | 문모모 | `char-doormomo-turn.png` | `char-doormomo-walk.png` | `char-doormomo-turn.png` (백업 전 원본) | `src/web/assets/group-photo/doormomo.webp` | 초기본 | `T-doormomo` |
| `hachi97` | 하치 | `char-hachi97-turn.png` | `char-hachi97-walk.png` | `char-hachi97-turn.png` (백업 전 원본) | `src/web/assets/group-photo/hachi97.webp` | 초기본 | `T-hachi97` |
| `kaksjak0730` | 한결 | `char-kaksjak0730-turn.png` | `char-kaksjak0730-walk.png` | `char-kaksjak0730-turn.png` (백업 전 원본) | `src/web/assets/group-photo/kaksjak0730.webp` | S7 교정본 | `T-kaksjak0730` |
| `ju010228` | 쥬멩이 | `char-ju010228-turn.png` | `char-ju010228-walk.png` | `char-ju010228-turn.png` (백업 전 원본) | `src/web/assets/group-photo/ju010228.webp` | 초기본 | `T-ju010228` |
| `haepalin` | 해파린 | `char-haepalin-turn.png` | `char-haepalin-walk.png` | `char-haepalin-turn.png` (백업 전 원본) | `src/web/assets/group-photo/haepalin.webp` | S7 교정본 | `T-haepalin` |
| `tleod1818` | 빙밍 | `char-tleod1818-turn.png` | `char-tleod1818-walk.png` | `char-tleod1818-turn.png` (백업 전 원본) | `src/web/assets/group-photo/tleod1818.webp` | 초기본 | `T-tleod1818` |
| `tdnlamuron` | 다시바 | `char-tdnlamuron-turn.png` | `char-tdnlamuron-walk.png` | `char-tdnlamuron-turn.png` (백업 전 원본) | `src/web/assets/group-photo/tdnlamuron.webp` | 초기본 | `T-tdnlamuron` |
| `lina0108` | 리냐 | `char-lina0108-turn.png` | `char-lina0108-walk.png` | `char-lina0108-turn.png` (백업 전 원본) | `src/web/assets/group-photo/lina0108.webp` | 초기본 | `T-lina0108` |
| `woowakgood` | 우왁굳 | `char-woowakgood-turn.png` | `char-woowakgood-walk.png` | `char-woowakgood-turn.png` (백업 전 원본) | `src/web/assets/group-photo/woowakgood.webp` | 초기본 | `T-woowakgood` |
| `elder` | 잔디 할아버지 | `char-elder-turn.png` | `char-elder-walk.png` | `char-elder-turn.png` (백업 전 원본) | 없음(오리지널) | 초기본 | `T-elder` |
| `shopkeeper` | 편의점 사장님 | `char-shopkeeper-turn.png` | `char-shopkeeper-walk.png` | `char-shopkeeper-turn.png` (백업 전 원본) | 없음(오리지널) | 초기본 | `T-shopkeeper` |
| `kid` | 꼬마 팬 | `char-kid-turn.png` | `char-kid-walk.png` | `char-kid-turn.png` (백업 전 원본) | 없음(오리지널) | 초기본 | `T-kid` |
| `referee` | 심판 | `char-referee-turn.png` | `char-referee-walk.png` | `char-referee-turn.png` (백업 전 원본) | 없음(오리지널) | 초기본 | `T-referee` |
| `weedking` | 제초왕 | `char-weedking-turn.png` | `char-weedking-walk.png` | `char-weedking-turn.png` (백업 전 원본) | 없음(오리지널) | 초기본 | `T-weedking` |
| `weeder-grunt` | 제초 요원 | `char-weeder-grunt-turn.png` | `char-weeder-grunt-walk.png` | `char-weeder-grunt-turn.png` (백업 전 원본) | 없음(오리지널) | 초기본 | `T-weeder-grunt` |

모든 원본 경로 접두어는 `tmp/world-src/characters/`(원본 일러스트만 `src/web/assets/group-photo/`). 산출 후 `pnpm convert:world-art -- characters <id>`가 `characters/<id>-atlas.webp`의 idle(0행)을 갱신한다.

## 5. 수정 프롬프트 (같은 대화에서)

### 5-1. 아직 길쭉하거나 머리가 작을 때

```text
The attached result is still too tall and slim compared with the walk sheet. Keep the exact same character design, but redraw the COMPLETE 3-pose turnaround sheet with a clearly larger head and a shorter, rounder body: the head (including hair volume and head accessories) must be about 45% of the figure's total height, the torso and legs short and compact, and the front pose's height-to-width ratio equal to the walk sheet's front figures (the current result is too tall). Do not change colours, outfit, accessories or hairstyle. Same 1536x1024 transparent canvas, three poses in equal thirds, same scale, same baseline, no shadow, no text, no glow.
```

### 5-2. 정면은 맞는데 측면·후면 비율이 다를 때

```text
The front pose now matches the walk sheet, but the side and/or back pose does not. Keep the front pose unchanged and redraw the COMPLETE sheet so that the right-facing profile has the proportions of the walk sheet's middle row (standing, legs together) and the back view has the proportions of the walk sheet's bottom row. All three poses must have the same head size, torso length, leg length, shoe size and pixel block size, the same scale and the same foot baseline. Do not change colours, outfit, accessories or hairstyle. Same 1536x1024 transparent canvas, no shadow, no text, no glow.
```

### 5-3. 디자인이 바뀌었을 때(머리색·장식·소품)

```text
Keep everything about the proportions, layout and pixel style, but restore the design details from the attached CURRENT turnaround sheet exactly: hairstyle and hair colours, head accessories, outfit colours, emblem and held props in the same hand. Only proportions may differ from the current sheet, not the design. Return the complete 1536x1024 transparent 3-pose sheet.
```

## 6. 캐릭터별 독립 프롬프트 18개

각 코드 블록은 **그대로 복사해 한 번 붙여넣는 독립 프롬프트**다. 첨부는 ① `char-<id>-walk.png`, ② `char-<id>-turn.png` 순서. 공통 스타일 블록은 이미 각 블록에 풀어 들어 있어 별도로 붙이지 않는다.

### 1. `janine95kim` — 재닌

- 저장 파일: `char-janine95kim-turn.png`
- 새 대화: 예 (`T-janine95kim`)
- 첨부 ①: `tmp/world-src/characters/char-janine95kim-walk.png` (비율 기준, walk S7 교정본)
- 첨부 ②: `tmp/world-src/characters/char-janine95kim-turn.png` (현재 turn, 디자인 기준 — 덮어쓰기 전 백업본)
- 선택 첨부 ③: `src/web/assets/group-photo/janine95kim.webp` (원본 일러스트, 디자인이 흔들릴 때만)
- 합격선: 정면 컷 높이/너비 1.48 ~ 1.80 (walk 1.64 ±10%)

```text
Redraw the attached CURRENT turnaround sheet of Janine with corrected chibi proportions. The character design is right, but the current figures are far too tall and slim: roughly 3.5 heads tall with a small head and a narrow body. Keep the exact same character, palette, outfit and accessories, but draw all three poses with the SAME chibi proportions as the attached WALK sheet.

PROPORTION MASTER (mandatory): the attached walk sheet is the size-and-shape reference. Copy the figure proportions from its top row (front view) for the front pose, its middle row (right-facing profile) for the side pose, and its bottom row (back view) for the back pose. The head, including hair volume and head accessories, is about 40-45% of the figure's total height (about 2.5 heads tall); the torso is short and compact, the legs are short, the shoes/boots are big. The height-to-width ratio of the front pose must equal that of the walk sheet's front figures. If in doubt make the figure shorter and rounder, never taller or slimmer. Do not reuse the tall silhouette of the current turn sheet: use it only for costume details, colours, and the design of the side and back views.

LAYOUT: one transparent 1536x1024 canvas with three standing poses side by side, each centred in its own equal third of the canvas: 1) front view facing the camera, 2) right-facing side profile, 3) back view facing away. Same scale and identical pixel size in all three; each figure about 500 px tall; all feet on exactly the same baseline; at least 10% empty margin around each pose and clear gaps between poses.
POSE: standing idle, feet together, arms relaxed as in the current turn sheet, no walking stride, no motion.

KEEP EXACTLY: long wavy vivid blue hair, round glasses, white cap-style headband/cap with a tiny ornament and a small black headset microphone, black choker; GK kit: black long-sleeve goalkeeper jersey with mint side panels and a small text-free mint shield crest, white goalkeeper gloves, black shorts with a mint stripe, black knee-high socks, black boots with mint studs.
The back view shows the white cap from behind with its strap opening, exactly as in the walk sheet's bottom row.

STYLE: crisp high-detail 32-bit JRPG pixel art at the same pixel block size and line thickness as the walk sheet, 1-pixel dark teal (#16302e) outline, three-step cel shading, 3/4 top-down view. No blur, anti-aliasing, gradients, glow, halo, vignette, 3D render or painterly strokes. No shadows, floor, text, letters, numbers, logos, grid lines or cell borders. Fully transparent background (if impossible, a perfectly flat #FF00FF background with no shadow or gradient and no magenta on the character).

SELF-CHECK before returning: put the front pose next to a walk-sheet front frame. Head size, body width, leg length and shoe size must match, and the figure must look just as short and round. If it looks taller or slimmer than the walk figure, redraw it yourself.
```

### 2. `bboringirl` — 뽀린걸

- 저장 파일: `char-bboringirl-turn.png`
- 새 대화: 예 (`T-bboringirl`)
- 첨부 ①: `tmp/world-src/characters/char-bboringirl-walk.png` (비율 기준, walk S7 교정본)
- 첨부 ②: `tmp/world-src/characters/char-bboringirl-turn.png` (현재 turn, 디자인 기준 — 덮어쓰기 전 백업본)
- 선택 첨부 ③: `src/web/assets/group-photo/bboringirl.webp` (원본 일러스트, 디자인이 흔들릴 때만)
- 합격선: 정면 컷 높이/너비 1.35 ~ 1.65 (walk 1.50 ±10%)

```text
Redraw the attached CURRENT turnaround sheet of Bboringirl with corrected chibi proportions. The character design is right, but the current figures are far too tall and slim: roughly 3.5 heads tall with a small head and a narrow body. Keep the exact same character, palette, outfit and accessories, but draw all three poses with the SAME chibi proportions as the attached WALK sheet.

PROPORTION MASTER (mandatory): the attached walk sheet is the size-and-shape reference. Copy the figure proportions from its top row (front view) for the front pose, its middle row (right-facing profile) for the side pose, and its bottom row (back view) for the back pose. The head, including hair volume and head accessories, is about 40-45% of the figure's total height (about 2.5 heads tall); the torso is short and compact, the legs are short, the shoes/boots are big. The height-to-width ratio of the front pose must equal that of the walk sheet's front figures. If in doubt make the figure shorter and rounder, never taller or slimmer. Do not reuse the tall silhouette of the current turn sheet: use it only for costume details, colours, and the design of the side and back views.

LAYOUT: one transparent 1536x1024 canvas with three standing poses side by side, each centred in its own equal third of the canvas: 1) front view facing the camera, 2) right-facing side profile, 3) back view facing away. Same scale and identical pixel size in all three; each figure about 500 px tall; all feet on exactly the same baseline; at least 10% empty margin around each pose and clear gaps between poses.
POSE: standing idle, feet together, arms relaxed as in the current turn sheet, no walking stride, no motion.

KEEP EXACTLY: silver-grey hair with red-pink streaks in the side locks, a low side ponytail draped over the shoulder, amber eyes, one small ahoge strand, warm smile; the 잔디동 club kit: white short-sleeve jersey with mint-green side panels, sleeve trim and a small text-free mint shield crest with a sprout on the chest, white shorts with mint side stripe, white knee-high socks with a mint band, white football boots with mint studs.
Keep the red-pink hair streaks and the side ponytail clearly visible in the side and back views.

STYLE: crisp high-detail 32-bit JRPG pixel art at the same pixel block size and line thickness as the walk sheet, 1-pixel dark teal (#16302e) outline, three-step cel shading, 3/4 top-down view. No blur, anti-aliasing, gradients, glow, halo, vignette, 3D render or painterly strokes. No shadows, floor, text, letters, numbers, logos, grid lines or cell borders. Fully transparent background (if impossible, a perfectly flat #FF00FF background with no shadow or gradient and no magenta on the character).

SELF-CHECK before returning: put the front pose next to a walk-sheet front frame. Head size, body width, leg length and shoe size must match, and the figure must look just as short and round. If it looks taller or slimmer than the walk figure, redraw it yourself.
```

### 3. `sjh4018` — 핑구

- 저장 파일: `char-sjh4018-turn.png`
- 새 대화: 예 (`T-sjh4018`)
- 첨부 ①: `tmp/world-src/characters/char-sjh4018-walk.png` (비율 기준, walk S7 교정본)
- 첨부 ②: `tmp/world-src/characters/char-sjh4018-turn.png` (현재 turn, 디자인 기준 — 덮어쓰기 전 백업본)
- 선택 첨부 ③: `src/web/assets/group-photo/sjh4018.webp` (원본 일러스트, 디자인이 흔들릴 때만)
- 합격선: 정면 컷 높이/너비 1.36 ~ 1.66 (walk 1.51 ±10%)

```text
Redraw the attached CURRENT turnaround sheet of Pinggu with corrected chibi proportions. The character design is right, but the current figures are far too tall and slim: roughly 3.5 heads tall with a small head and a narrow body. Keep the exact same character, palette, outfit and accessories, but draw all three poses with the SAME chibi proportions as the attached WALK sheet.

PROPORTION MASTER (mandatory): the attached walk sheet is the size-and-shape reference. Copy the figure proportions from its top row (front view) for the front pose, its middle row (right-facing profile) for the side pose, and its bottom row (back view) for the back pose. The head, including hair volume and head accessories, is about 40-45% of the figure's total height (about 2.5 heads tall); the torso is short and compact, the legs are short, the shoes/boots are big. The height-to-width ratio of the front pose must equal that of the walk sheet's front figures. If in doubt make the figure shorter and rounder, never taller or slimmer. Do not reuse the tall silhouette of the current turn sheet: use it only for costume details, colours, and the design of the side and back views.

LAYOUT: one transparent 1536x1024 canvas with three standing poses side by side, each centred in its own equal third of the canvas: 1) front view facing the camera, 2) right-facing side profile, 3) back view facing away. Same scale and identical pixel size in all three; each figure about 500 px tall; all feet on exactly the same baseline; at least 10% empty margin around each pose and clear gaps between poses.
POSE: standing idle, feet together, arms relaxed as in the current turn sheet, no walking stride, no motion.

KEEP EXACTLY: very long sky-blue hair with straight parted bangs, black hairband, small hair clip at the side, blue eyes, cheerful open smile; the 잔디동 club kit: white short-sleeve jersey with mint-green side panels, sleeve trim and a small text-free mint shield crest with a sprout on the chest, white shorts with mint side stripe, white knee-high socks with a mint band, white football boots with mint studs.
The hair is very long, but use exactly the hair length and volume shown in the walk sheet; the long hair must not make the figure taller than the walk figures.

STYLE: crisp high-detail 32-bit JRPG pixel art at the same pixel block size and line thickness as the walk sheet, 1-pixel dark teal (#16302e) outline, three-step cel shading, 3/4 top-down view. No blur, anti-aliasing, gradients, glow, halo, vignette, 3D render or painterly strokes. No shadows, floor, text, letters, numbers, logos, grid lines or cell borders. Fully transparent background (if impossible, a perfectly flat #FF00FF background with no shadow or gradient and no magenta on the character).

SELF-CHECK before returning: put the front pose next to a walk-sheet front frame. Head size, body width, leg length and shoe size must match, and the figure must look just as short and round. If it looks taller or slimmer than the walk figure, redraw it yourself.
```

### 4. `doormomo` — 문모모

- 저장 파일: `char-doormomo-turn.png`
- 새 대화: 예 (`T-doormomo`)
- 첨부 ①: `tmp/world-src/characters/char-doormomo-walk.png` (비율 기준, walk 초기본)
- 첨부 ②: `tmp/world-src/characters/char-doormomo-turn.png` (현재 turn, 디자인 기준 — 덮어쓰기 전 백업본)
- 선택 첨부 ③: `src/web/assets/group-photo/doormomo.webp` (원본 일러스트, 디자인이 흔들릴 때만)
- 합격선: 정면 컷 높이/너비 1.59 ~ 1.95 (walk 1.77 ±10%)

```text
Redraw the attached CURRENT turnaround sheet of Doormomo with corrected chibi proportions. The character design is right, but the current figures are far too tall and slim: roughly 3.5 heads tall with a small head and a narrow body. Keep the exact same character, palette, outfit and accessories, but draw all three poses with the SAME chibi proportions as the attached WALK sheet.

PROPORTION MASTER (mandatory): the attached walk sheet is the size-and-shape reference. Copy the figure proportions from its top row (front view) for the front pose, its middle row (right-facing profile) for the side pose, and its bottom row (back view) for the back pose. The head, including hair volume and head accessories, is about 40-45% of the figure's total height (about 2.5 heads tall); the torso is short and compact, the legs are short, the shoes/boots are big. The height-to-width ratio of the front pose must equal that of the walk sheet's front figures. If in doubt make the figure shorter and rounder, never taller or slimmer. Do not reuse the tall silhouette of the current turn sheet: use it only for costume details, colours, and the design of the side and back views.

LAYOUT: one transparent 1536x1024 canvas with three standing poses side by side, each centred in its own equal third of the canvas: 1) front view facing the camera, 2) right-facing side profile, 3) back view facing away. Same scale and identical pixel size in all three; each figure about 500 px tall; all feet on exactly the same baseline; at least 10% empty margin around each pose and clear gaps between poses.
POSE: standing idle, feet together, arms relaxed as in the current turn sheet, no walking stride, no motion.

KEEP EXACTLY: short purple-black bob with blunt bangs and purple hair tips, white headband with a small red badge shape (no readable text), silver star hairpin, purple eyes; the 잔디동 club kit: white short-sleeve jersey with mint-green side panels, sleeve trim and a small text-free mint shield crest with a sprout on the chest, white shorts with mint side stripe, white knee-high socks with a mint band, white football boots with mint studs.
Keep the headband badge as a plain red block, no text.

STYLE: crisp high-detail 32-bit JRPG pixel art at the same pixel block size and line thickness as the walk sheet, 1-pixel dark teal (#16302e) outline, three-step cel shading, 3/4 top-down view. No blur, anti-aliasing, gradients, glow, halo, vignette, 3D render or painterly strokes. No shadows, floor, text, letters, numbers, logos, grid lines or cell borders. Fully transparent background (if impossible, a perfectly flat #FF00FF background with no shadow or gradient and no magenta on the character).

SELF-CHECK before returning: put the front pose next to a walk-sheet front frame. Head size, body width, leg length and shoe size must match, and the figure must look just as short and round. If it looks taller or slimmer than the walk figure, redraw it yourself.
```

### 5. `hachi97` — 하치

- 저장 파일: `char-hachi97-turn.png`
- 새 대화: 예 (`T-hachi97`)
- 첨부 ①: `tmp/world-src/characters/char-hachi97-walk.png` (비율 기준, walk 초기본)
- 첨부 ②: `tmp/world-src/characters/char-hachi97-turn.png` (현재 turn, 디자인 기준 — 덮어쓰기 전 백업본)
- 선택 첨부 ③: `src/web/assets/group-photo/hachi97.webp` (원본 일러스트, 디자인이 흔들릴 때만)
- 합격선: 정면 컷 높이/너비 1.75 ~ 2.15 (walk 1.95 ±10%)

```text
Redraw the attached CURRENT turnaround sheet of Hachi with corrected chibi proportions. The character design is right, but the current figures are far too tall and slim: roughly 3.5 heads tall with a small head and a narrow body. Keep the exact same character, palette, outfit and accessories, but draw all three poses with the SAME chibi proportions as the attached WALK sheet.

PROPORTION MASTER (mandatory): the attached walk sheet is the size-and-shape reference. Copy the figure proportions from its top row (front view) for the front pose, its middle row (right-facing profile) for the side pose, and its bottom row (back view) for the back pose. The head, including hair volume and head accessories, is about 40-45% of the figure's total height (about 2.5 heads tall); the torso is short and compact, the legs are short, the shoes/boots are big. The height-to-width ratio of the front pose must equal that of the walk sheet's front figures. If in doubt make the figure shorter and rounder, never taller or slimmer. Do not reuse the tall silhouette of the current turn sheet: use it only for costume details, colours, and the design of the side and back views.

LAYOUT: one transparent 1536x1024 canvas with three standing poses side by side, each centred in its own equal third of the canvas: 1) front view facing the camera, 2) right-facing side profile, 3) back view facing away. Same scale and identical pixel size in all three; each figure about 500 px tall; all feet on exactly the same baseline; at least 10% empty margin around each pose and clear gaps between poses.
POSE: standing idle, feet together, arms relaxed as in the current turn sheet, no walking stride, no motion.

KEEP EXACTLY: short black bob with a white streak, small white antler-like horn ornaments on the head, purple eyes, big open-mouth smile; the 잔디동 club kit: white short-sleeve jersey with mint-green side panels, sleeve trim and a small text-free mint shield crest with a sprout on the chest, white shorts with mint side stripe, white knee-high socks with a mint band, white football boots with mint studs.
Leave enough empty space above the head so the horn ornaments are never cropped.

STYLE: crisp high-detail 32-bit JRPG pixel art at the same pixel block size and line thickness as the walk sheet, 1-pixel dark teal (#16302e) outline, three-step cel shading, 3/4 top-down view. No blur, anti-aliasing, gradients, glow, halo, vignette, 3D render or painterly strokes. No shadows, floor, text, letters, numbers, logos, grid lines or cell borders. Fully transparent background (if impossible, a perfectly flat #FF00FF background with no shadow or gradient and no magenta on the character).

SELF-CHECK before returning: put the front pose next to a walk-sheet front frame. Head size, body width, leg length and shoe size must match, and the figure must look just as short and round. If it looks taller or slimmer than the walk figure, redraw it yourself.
```

### 6. `kaksjak0730` — 한결

- 저장 파일: `char-kaksjak0730-turn.png`
- 새 대화: 예 (`T-kaksjak0730`)
- 첨부 ①: `tmp/world-src/characters/char-kaksjak0730-walk.png` (비율 기준, walk S7 교정본)
- 첨부 ②: `tmp/world-src/characters/char-kaksjak0730-turn.png` (현재 turn, 디자인 기준 — 덮어쓰기 전 백업본)
- 선택 첨부 ③: `src/web/assets/group-photo/kaksjak0730.webp` (원본 일러스트, 디자인이 흔들릴 때만)
- 합격선: 정면 컷 높이/너비 1.34 ~ 1.64 (walk 1.49 ±10%)

```text
Redraw the attached CURRENT turnaround sheet of Hangyeol with corrected chibi proportions. The character design is right, but the current figures are far too tall and slim: roughly 3.5 heads tall with a small head and a narrow body. Keep the exact same character, palette, outfit and accessories, but draw all three poses with the SAME chibi proportions as the attached WALK sheet.

PROPORTION MASTER (mandatory): the attached walk sheet is the size-and-shape reference. Copy the figure proportions from its top row (front view) for the front pose, its middle row (right-facing profile) for the side pose, and its bottom row (back view) for the back pose. The head, including hair volume and head accessories, is about 40-45% of the figure's total height (about 2.5 heads tall); the torso is short and compact, the legs are short, the shoes/boots are big. The height-to-width ratio of the front pose must equal that of the walk sheet's front figures. If in doubt make the figure shorter and rounder, never taller or slimmer. Do not reuse the tall silhouette of the current turn sheet: use it only for costume details, colours, and the design of the side and back views.

LAYOUT: one transparent 1536x1024 canvas with three standing poses side by side, each centred in its own equal third of the canvas: 1) front view facing the camera, 2) right-facing side profile, 3) back view facing away. Same scale and identical pixel size in all three; each figure about 500 px tall; all feet on exactly the same baseline; at least 10% empty margin around each pose and clear gaps between poses.
POSE: standing idle, feet together, arms relaxed as in the current turn sheet, no walking stride, no motion.

KEEP EXACTLY: very long black hair in a high ponytail, blue eyes, white headphones with a mint-outlined cat-ear band, small star hairpin, gentle smile; the 잔디동 club kit: white short-sleeve jersey with mint-green side panels, sleeve trim and a small text-free mint shield crest with a sprout on the chest, white shorts with mint side stripe, white knee-high socks with a mint band, white football boots with mint studs.
The cat-ear headphone silhouette must read clearly in all three views; the high ponytail must be visible in the side and back views.

STYLE: crisp high-detail 32-bit JRPG pixel art at the same pixel block size and line thickness as the walk sheet, 1-pixel dark teal (#16302e) outline, three-step cel shading, 3/4 top-down view. No blur, anti-aliasing, gradients, glow, halo, vignette, 3D render or painterly strokes. No shadows, floor, text, letters, numbers, logos, grid lines or cell borders. Fully transparent background (if impossible, a perfectly flat #FF00FF background with no shadow or gradient and no magenta on the character).

SELF-CHECK before returning: put the front pose next to a walk-sheet front frame. Head size, body width, leg length and shoe size must match, and the figure must look just as short and round. If it looks taller or slimmer than the walk figure, redraw it yourself.
```

### 7. `ju010228` — 쥬멩이

- 저장 파일: `char-ju010228-turn.png`
- 새 대화: 예 (`T-ju010228`)
- 첨부 ①: `tmp/world-src/characters/char-ju010228-walk.png` (비율 기준, walk 초기본)
- 첨부 ②: `tmp/world-src/characters/char-ju010228-turn.png` (현재 turn, 디자인 기준 — 덮어쓰기 전 백업본)
- 선택 첨부 ③: `src/web/assets/group-photo/ju010228.webp` (원본 일러스트, 디자인이 흔들릴 때만)
- 합격선: 정면 컷 높이/너비 1.50 ~ 1.84 (walk 1.67 ±10%)

```text
Redraw the attached CURRENT turnaround sheet of Jyumenge with corrected chibi proportions. The character design is right, but the current figures are far too tall and slim: roughly 3.5 heads tall with a small head and a narrow body. Keep the exact same character, palette, outfit and accessories, but draw all three poses with the SAME chibi proportions as the attached WALK sheet.

PROPORTION MASTER (mandatory): the attached walk sheet is the size-and-shape reference. Copy the figure proportions from its top row (front view) for the front pose, its middle row (right-facing profile) for the side pose, and its bottom row (back view) for the back pose. The head, including hair volume and head accessories, is about 40-45% of the figure's total height (about 2.5 heads tall); the torso is short and compact, the legs are short, the shoes/boots are big. The height-to-width ratio of the front pose must equal that of the walk sheet's front figures. If in doubt make the figure shorter and rounder, never taller or slimmer. Do not reuse the tall silhouette of the current turn sheet: use it only for costume details, colours, and the design of the side and back views.

LAYOUT: one transparent 1536x1024 canvas with three standing poses side by side, each centred in its own equal third of the canvas: 1) front view facing the camera, 2) right-facing side profile, 3) back view facing away. Same scale and identical pixel size in all three; each figure about 500 px tall; all feet on exactly the same baseline; at least 10% empty margin around each pose and clear gaps between poses.
POSE: standing idle, feet together, arms relaxed as in the current turn sheet, no walking stride, no motion.

KEEP EXACTLY: very long green hair with a white streak and a white ribbon at the side, amber eyes, gentle smile; the 잔디동 club kit: white short-sleeve jersey with mint-green side panels, sleeve trim and a small text-free mint shield crest with a sprout on the chest, white shorts with mint side stripe, white knee-high socks with a mint band, white football boots with mint studs.
Use exactly the hair length and volume of the walk sheet.

STYLE: crisp high-detail 32-bit JRPG pixel art at the same pixel block size and line thickness as the walk sheet, 1-pixel dark teal (#16302e) outline, three-step cel shading, 3/4 top-down view. No blur, anti-aliasing, gradients, glow, halo, vignette, 3D render or painterly strokes. No shadows, floor, text, letters, numbers, logos, grid lines or cell borders. Fully transparent background (if impossible, a perfectly flat #FF00FF background with no shadow or gradient and no magenta on the character).

SELF-CHECK before returning: put the front pose next to a walk-sheet front frame. Head size, body width, leg length and shoe size must match, and the figure must look just as short and round. If it looks taller or slimmer than the walk figure, redraw it yourself.
```

### 8. `haepalin` — 해파린

- 저장 파일: `char-haepalin-turn.png`
- 새 대화: 예 (`T-haepalin`)
- 첨부 ①: `tmp/world-src/characters/char-haepalin-walk.png` (비율 기준, walk S7 교정본)
- 첨부 ②: `tmp/world-src/characters/char-haepalin-turn.png` (현재 turn, 디자인 기준 — 덮어쓰기 전 백업본)
- 선택 첨부 ③: `src/web/assets/group-photo/haepalin.webp` (원본 일러스트, 디자인이 흔들릴 때만)
- 합격선: 정면 컷 높이/너비 1.50 ~ 1.84 (walk 1.67 ±10%)

```text
Redraw the attached CURRENT turnaround sheet of Haepalin with corrected chibi proportions. The character design is right, but the current figures are far too tall and slim: roughly 3.5 heads tall with a small head and a narrow body. Keep the exact same character, palette, outfit and accessories, but draw all three poses with the SAME chibi proportions as the attached WALK sheet.

PROPORTION MASTER (mandatory): the attached walk sheet is the size-and-shape reference. Copy the figure proportions from its top row (front view) for the front pose, its middle row (right-facing profile) for the side pose, and its bottom row (back view) for the back pose. The head, including hair volume and head accessories, is about 40-45% of the figure's total height (about 2.5 heads tall); the torso is short and compact, the legs are short, the shoes/boots are big. The height-to-width ratio of the front pose must equal that of the walk sheet's front figures. If in doubt make the figure shorter and rounder, never taller or slimmer. Do not reuse the tall silhouette of the current turn sheet: use it only for costume details, colours, and the design of the side and back views.

LAYOUT: one transparent 1536x1024 canvas with three standing poses side by side, each centred in its own equal third of the canvas: 1) front view facing the camera, 2) right-facing side profile, 3) back view facing away. Same scale and identical pixel size in all three; each figure about 500 px tall; all feet on exactly the same baseline; at least 10% empty margin around each pose and clear gaps between poses.
POSE: standing idle, feet together, arms relaxed as in the current turn sheet, no walking stride, no motion.

KEEP EXACTLY: short lavender-periwinkle bob with one ahoge, blue eyes, a jellyfish-shaped hair ornament (blue and white blocks) and small heart hair clips, soft smile; the 잔디동 club kit: white short-sleeve jersey with mint-green side panels, sleeve trim and a small text-free mint shield crest with a sprout on the chest, white shorts with mint side stripe, white knee-high socks with a mint band, white football boots with mint studs.
Keep the jellyfish ornament and heart clips visible in the side view.

STYLE: crisp high-detail 32-bit JRPG pixel art at the same pixel block size and line thickness as the walk sheet, 1-pixel dark teal (#16302e) outline, three-step cel shading, 3/4 top-down view. No blur, anti-aliasing, gradients, glow, halo, vignette, 3D render or painterly strokes. No shadows, floor, text, letters, numbers, logos, grid lines or cell borders. Fully transparent background (if impossible, a perfectly flat #FF00FF background with no shadow or gradient and no magenta on the character).

SELF-CHECK before returning: put the front pose next to a walk-sheet front frame. Head size, body width, leg length and shoe size must match, and the figure must look just as short and round. If it looks taller or slimmer than the walk figure, redraw it yourself.
```

### 9. `tleod1818` — 빙밍

- 저장 파일: `char-tleod1818-turn.png`
- 새 대화: 예 (`T-tleod1818`)
- 첨부 ①: `tmp/world-src/characters/char-tleod1818-walk.png` (비율 기준, walk 초기본)
- 첨부 ②: `tmp/world-src/characters/char-tleod1818-turn.png` (현재 turn, 디자인 기준 — 덮어쓰기 전 백업본)
- 선택 첨부 ③: `src/web/assets/group-photo/tleod1818.webp` (원본 일러스트, 디자인이 흔들릴 때만)
- 합격선: 정면 컷 높이/너비 1.59 ~ 1.95 (walk 1.77 ±10%)

```text
Redraw the attached CURRENT turnaround sheet of Bingming with corrected chibi proportions. The character design is right, but the current figures are far too tall and slim: roughly 3.5 heads tall with a small head and a narrow body. Keep the exact same character, palette, outfit and accessories, but draw all three poses with the SAME chibi proportions as the attached WALK sheet.

PROPORTION MASTER (mandatory): the attached walk sheet is the size-and-shape reference. Copy the figure proportions from its top row (front view) for the front pose, its middle row (right-facing profile) for the side pose, and its bottom row (back view) for the back pose. The head, including hair volume and head accessories, is about 40-45% of the figure's total height (about 2.5 heads tall); the torso is short and compact, the legs are short, the shoes/boots are big. The height-to-width ratio of the front pose must equal that of the walk sheet's front figures. If in doubt make the figure shorter and rounder, never taller or slimmer. Do not reuse the tall silhouette of the current turn sheet: use it only for costume details, colours, and the design of the side and back views.

LAYOUT: one transparent 1536x1024 canvas with three standing poses side by side, each centred in its own equal third of the canvas: 1) front view facing the camera, 2) right-facing side profile, 3) back view facing away. Same scale and identical pixel size in all three; each figure about 500 px tall; all feet on exactly the same baseline; at least 10% empty margin around each pose and clear gaps between poses.
POSE: standing idle, feet together, arms relaxed as in the current turn sheet, no walking stride, no motion.

KEEP EXACTLY: black hair in a bun with a green leaf hairpin and a small white flower, blunt bangs, green eyes, black ribbon choker; the 잔디동 club kit: white short-sleeve jersey with mint-green side panels, sleeve trim and a small text-free mint shield crest with a sprout on the chest, white shorts with mint side stripe, white knee-high socks with a mint band, white football boots with mint studs.
Keep the leaf pin green; the bun must be visible in the side and back views.

STYLE: crisp high-detail 32-bit JRPG pixel art at the same pixel block size and line thickness as the walk sheet, 1-pixel dark teal (#16302e) outline, three-step cel shading, 3/4 top-down view. No blur, anti-aliasing, gradients, glow, halo, vignette, 3D render or painterly strokes. No shadows, floor, text, letters, numbers, logos, grid lines or cell borders. Fully transparent background (if impossible, a perfectly flat #FF00FF background with no shadow or gradient and no magenta on the character).

SELF-CHECK before returning: put the front pose next to a walk-sheet front frame. Head size, body width, leg length and shoe size must match, and the figure must look just as short and round. If it looks taller or slimmer than the walk figure, redraw it yourself.
```

### 10. `tdnlamuron` — 다시바

- 저장 파일: `char-tdnlamuron-turn.png`
- 새 대화: 예 (`T-tdnlamuron`)
- 첨부 ①: `tmp/world-src/characters/char-tdnlamuron-walk.png` (비율 기준, walk 초기본)
- 첨부 ②: `tmp/world-src/characters/char-tdnlamuron-turn.png` (현재 turn, 디자인 기준 — 덮어쓰기 전 백업본)
- 선택 첨부 ③: `src/web/assets/group-photo/tdnlamuron.webp` (원본 일러스트, 디자인이 흔들릴 때만)
- 합격선: 정면 컷 높이/너비 1.69 ~ 2.07 (walk 1.88 ±10%)

```text
Redraw the attached CURRENT turnaround sheet of Dashiba with corrected chibi proportions. The character design is right, but the current figures are far too tall and slim: roughly 3.5 heads tall with a small head and a narrow body. Keep the exact same character, palette, outfit and accessories, but draw all three poses with the SAME chibi proportions as the attached WALK sheet.

PROPORTION MASTER (mandatory): the attached walk sheet is the size-and-shape reference. Copy the figure proportions from its top row (front view) for the front pose, its middle row (right-facing profile) for the side pose, and its bottom row (back view) for the back pose. The head, including hair volume and head accessories, is about 40-45% of the figure's total height (about 2.5 heads tall); the torso is short and compact, the legs are short, the shoes/boots are big. The height-to-width ratio of the front pose must equal that of the walk sheet's front figures. If in doubt make the figure shorter and rounder, never taller or slimmer. Do not reuse the tall silhouette of the current turn sheet: use it only for costume details, colours, and the design of the side and back views.

LAYOUT: one transparent 1536x1024 canvas with three standing poses side by side, each centred in its own equal third of the canvas: 1) front view facing the camera, 2) right-facing side profile, 3) back view facing away. Same scale and identical pixel size in all three; each figure about 500 px tall; all feet on exactly the same baseline; at least 10% empty margin around each pose and clear gaps between poses.
POSE: standing idle, feet together, arms relaxed as in the current turn sheet, no walking stride, no motion.

KEEP EXACTLY: short black hair with orange and white streaks, cat ears with pink inner ear, a hairpin shaped like a small round badge (no readable number), amber eyes, black choker; the 잔디동 club kit: white short-sleeve jersey with mint-green side panels, sleeve trim and a small text-free mint shield crest with a sprout on the chest, white shorts with mint side stripe, white knee-high socks with a mint band, white football boots with mint studs.
Leave enough empty space above the cat ears so they are never cropped.

STYLE: crisp high-detail 32-bit JRPG pixel art at the same pixel block size and line thickness as the walk sheet, 1-pixel dark teal (#16302e) outline, three-step cel shading, 3/4 top-down view. No blur, anti-aliasing, gradients, glow, halo, vignette, 3D render or painterly strokes. No shadows, floor, text, letters, numbers, logos, grid lines or cell borders. Fully transparent background (if impossible, a perfectly flat #FF00FF background with no shadow or gradient and no magenta on the character).

SELF-CHECK before returning: put the front pose next to a walk-sheet front frame. Head size, body width, leg length and shoe size must match, and the figure must look just as short and round. If it looks taller or slimmer than the walk figure, redraw it yourself.
```

### 11. `lina0108` — 리냐

- 저장 파일: `char-lina0108-turn.png`
- 새 대화: 예 (`T-lina0108`)
- 첨부 ①: `tmp/world-src/characters/char-lina0108-walk.png` (비율 기준, walk 초기본)
- 첨부 ②: `tmp/world-src/characters/char-lina0108-turn.png` (현재 turn, 디자인 기준 — 덮어쓰기 전 백업본)
- 선택 첨부 ③: `src/web/assets/group-photo/lina0108.webp` (원본 일러스트, 디자인이 흔들릴 때만)
- 합격선: 정면 컷 높이/너비 1.34 ~ 1.64 (walk 1.49 ±10%)

```text
Redraw the attached CURRENT turnaround sheet of Linya with corrected chibi proportions. The character design is right, but the current figures are far too tall and slim: roughly 3.5 heads tall with a small head and a narrow body. Keep the exact same character, palette, outfit and accessories, but draw all three poses with the SAME chibi proportions as the attached WALK sheet.

PROPORTION MASTER (mandatory): the attached walk sheet is the size-and-shape reference. Copy the figure proportions from its top row (front view) for the front pose, its middle row (right-facing profile) for the side pose, and its bottom row (back view) for the back pose. The head, including hair volume and head accessories, is about 40-45% of the figure's total height (about 2.5 heads tall); the torso is short and compact, the legs are short, the shoes/boots are big. The height-to-width ratio of the front pose must equal that of the walk sheet's front figures. If in doubt make the figure shorter and rounder, never taller or slimmer. Do not reuse the tall silhouette of the current turn sheet: use it only for costume details, colours, and the design of the side and back views.

LAYOUT: one transparent 1536x1024 canvas with three standing poses side by side, each centred in its own equal third of the canvas: 1) front view facing the camera, 2) right-facing side profile, 3) back view facing away. Same scale and identical pixel size in all three; each figure about 500 px tall; all feet on exactly the same baseline; at least 10% empty margin around each pose and clear gaps between poses.
POSE: standing idle, feet together, arms relaxed as in the current turn sheet, no walking stride, no motion.

KEEP EXACTLY: long messy red-pink hair with a white streak, small pink-and-white horns, amber eyes, playful smirk; the 잔디동 club kit: white short-sleeve jersey with mint-green side panels, sleeve trim and a small text-free mint shield crest with a sprout on the chest, white shorts with mint side stripe, white knee-high socks with a mint band, white football boots with mint studs.
The hair is voluminous: keep every pose within about two thirds of its column width so the hair never touches the neighbouring pose.

STYLE: crisp high-detail 32-bit JRPG pixel art at the same pixel block size and line thickness as the walk sheet, 1-pixel dark teal (#16302e) outline, three-step cel shading, 3/4 top-down view. No blur, anti-aliasing, gradients, glow, halo, vignette, 3D render or painterly strokes. No shadows, floor, text, letters, numbers, logos, grid lines or cell borders. Fully transparent background (if impossible, a perfectly flat #FF00FF background with no shadow or gradient and no magenta on the character).

SELF-CHECK before returning: put the front pose next to a walk-sheet front frame. Head size, body width, leg length and shoe size must match, and the figure must look just as short and round. If it looks taller or slimmer than the walk figure, redraw it yourself.
```

### 12. `woowakgood` — 우왁굳

- 저장 파일: `char-woowakgood-turn.png`
- 새 대화: 예 (`T-woowakgood`)
- 첨부 ①: `tmp/world-src/characters/char-woowakgood-walk.png` (비율 기준, walk 초기본)
- 첨부 ②: `tmp/world-src/characters/char-woowakgood-turn.png` (현재 turn, 디자인 기준 — 덮어쓰기 전 백업본)
- 선택 첨부 ③: `src/web/assets/group-photo/woowakgood.webp` (원본 일러스트, 디자인이 흔들릴 때만)
- 합격선: 정면 컷 높이/너비 2.12 ~ 2.60 (walk 2.36 ±10%)

```text
Redraw the attached CURRENT turnaround sheet of Woowakgood with corrected chibi proportions. The character design is right, but the current figures are far too tall and slim: roughly 3.5 heads tall with a small head and a narrow body. Keep the exact same character, palette, outfit and accessories, but draw all three poses with the SAME chibi proportions as the attached WALK sheet.

PROPORTION MASTER (mandatory): the attached walk sheet is the size-and-shape reference. Copy the figure proportions from its top row (front view) for the front pose, its middle row (right-facing profile) for the side pose, and its bottom row (back view) for the back pose. The head, including hair volume and head accessories, is about 40-45% of the figure's total height (about 2.5 heads tall); the torso is short and compact, the legs are short, the shoes/boots are big. The height-to-width ratio of the front pose must equal that of the walk sheet's front figures. If in doubt make the figure shorter and rounder, never taller or slimmer. Do not reuse the tall silhouette of the current turn sheet: use it only for costume details, colours, and the design of the side and back views.

LAYOUT: one transparent 1536x1024 canvas with three standing poses side by side, each centred in its own equal third of the canvas: 1) front view facing the camera, 2) right-facing side profile, 3) back view facing away. Same scale and identical pixel size in all three; each figure about 500 px tall; all feet on exactly the same baseline; at least 10% empty margin around each pose and clear gaps between poses.
POSE: standing idle, feet together, arms relaxed as in the current turn sheet, no walking stride, no motion.

KEEP EXACTLY: adult man's body in a black suit, white shirt, mint-green necktie and mint pocket square, black dress shoes; head is a stylised golden-tan animal-like mascot head (capybara-like) with small round ears and a black headset with a boom microphone and a small red badge.
Keep the animal-style mascot head; never turn it into a human face. Use the walk sheet's compact proportions, not realistic adult proportions.

STYLE: crisp high-detail 32-bit JRPG pixel art at the same pixel block size and line thickness as the walk sheet, 1-pixel dark teal (#16302e) outline, three-step cel shading, 3/4 top-down view. No blur, anti-aliasing, gradients, glow, halo, vignette, 3D render or painterly strokes. No shadows, floor, text, letters, numbers, logos, grid lines or cell borders. Fully transparent background (if impossible, a perfectly flat #FF00FF background with no shadow or gradient and no magenta on the character).

SELF-CHECK before returning: put the front pose next to a walk-sheet front frame. Head size, body width, leg length and shoe size must match, and the figure must look just as short and round. If it looks taller or slimmer than the walk figure, redraw it yourself.
```

### 13. `elder` — 잔디 할아버지

- 저장 파일: `char-elder-turn.png`
- 새 대화: 예 (`T-elder`)
- 첨부 ①: `tmp/world-src/characters/char-elder-walk.png` (비율 기준, walk 초기본)
- 첨부 ②: `tmp/world-src/characters/char-elder-turn.png` (현재 turn, 디자인 기준 — 덮어쓰기 전 백업본)
- 합격선: 정면 컷 높이/너비 1.44 ~ 1.76 (walk 1.60 ±10%)

```text
Redraw the attached CURRENT turnaround sheet of Jandi Grandpa (elder) with corrected chibi proportions. The character design is right, but the current figures are far too tall and slim: roughly 3.5 heads tall with a small head and a narrow body. Keep the exact same character, palette, outfit and accessories, but draw all three poses with the SAME chibi proportions as the attached WALK sheet.

PROPORTION MASTER (mandatory): the attached walk sheet is the size-and-shape reference. Copy the figure proportions from its top row (front view) for the front pose, its middle row (right-facing profile) for the side pose, and its bottom row (back view) for the back pose. The head, including hair volume and head accessories, is about 40-45% of the figure's total height (about 2.5 heads tall); the torso is short and compact, the legs are short, the shoes/boots are big. The height-to-width ratio of the front pose must equal that of the walk sheet's front figures. If in doubt make the figure shorter and rounder, never taller or slimmer. Do not reuse the tall silhouette of the current turn sheet: use it only for costume details, colours, and the design of the side and back views.

LAYOUT: one transparent 1536x1024 canvas with three standing poses side by side, each centred in its own equal third of the canvas: 1) front view facing the camera, 2) right-facing side profile, 3) back view facing away. Same scale and identical pixel size in all three; each figure about 500 px tall; all feet on exactly the same baseline; at least 10% empty margin around each pose and clear gaps between poses.
POSE: standing idle, feet together, arms relaxed as in the current turn sheet, no walking stride, no motion.

KEEP EXACTLY: an elderly village groundskeeper, kind face, big white moustache, bald head with a worn straw hat, green work apron over a beige shirt with rolled sleeves, brown trousers and boots, holding a small metal watering can in one hand, slightly hunched, warm smile, earthy green and beige palette.
Keep the slight hunch and the watering can in the same hand as in the current turn sheet.

STYLE: crisp high-detail 32-bit JRPG pixel art at the same pixel block size and line thickness as the walk sheet, 1-pixel dark teal (#16302e) outline, three-step cel shading, 3/4 top-down view. No blur, anti-aliasing, gradients, glow, halo, vignette, 3D render or painterly strokes. No shadows, floor, text, letters, numbers, logos, grid lines or cell borders. Fully transparent background (if impossible, a perfectly flat #FF00FF background with no shadow or gradient and no magenta on the character).

SELF-CHECK before returning: put the front pose next to a walk-sheet front frame. Head size, body width, leg length and shoe size must match, and the figure must look just as short and round. If it looks taller or slimmer than the walk figure, redraw it yourself.
```

### 14. `shopkeeper` — 편의점 사장님

- 저장 파일: `char-shopkeeper-turn.png`
- 새 대화: 예 (`T-shopkeeper`)
- 첨부 ①: `tmp/world-src/characters/char-shopkeeper-walk.png` (비율 기준, walk 초기본)
- 첨부 ②: `tmp/world-src/characters/char-shopkeeper-turn.png` (현재 turn, 디자인 기준 — 덮어쓰기 전 백업본)
- 합격선: 정면 컷 높이/너비 1.78 ~ 2.18 (walk 1.98 ±10%)

```text
Redraw the attached CURRENT turnaround sheet of Convenience-store owner (shopkeeper) with corrected chibi proportions. The character design is right, but the current figures are far too tall and slim: roughly 3.5 heads tall with a small head and a narrow body. Keep the exact same character, palette, outfit and accessories, but draw all three poses with the SAME chibi proportions as the attached WALK sheet.

PROPORTION MASTER (mandatory): the attached walk sheet is the size-and-shape reference. Copy the figure proportions from its top row (front view) for the front pose, its middle row (right-facing profile) for the side pose, and its bottom row (back view) for the back pose. The head, including hair volume and head accessories, is about 40-45% of the figure's total height (about 2.5 heads tall); the torso is short and compact, the legs are short, the shoes/boots are big. The height-to-width ratio of the front pose must equal that of the walk sheet's front figures. If in doubt make the figure shorter and rounder, never taller or slimmer. Do not reuse the tall silhouette of the current turn sheet: use it only for costume details, colours, and the design of the side and back views.

LAYOUT: one transparent 1536x1024 canvas with three standing poses side by side, each centred in its own equal third of the canvas: 1) front view facing the camera, 2) right-facing side profile, 3) back view facing away. Same scale and identical pixel size in all three; each figure about 500 px tall; all feet on exactly the same baseline; at least 10% empty margin around each pose and clear gaps between poses.
POSE: standing idle, feet together, arms relaxed as in the current turn sheet, no walking stride, no motion.

KEEP EXACTLY: a friendly middle-aged convenience-store owner, round glasses, short tidy hair, a mint-green striped store apron over a white shirt, a small name-tag shape (no readable text), sleeves rolled, holding a small cardboard box, cheerful expression, mint and white palette.
Keep the cardboard box in the same hand as in the current turn sheet; the name tag is a plain shape with no text.

STYLE: crisp high-detail 32-bit JRPG pixel art at the same pixel block size and line thickness as the walk sheet, 1-pixel dark teal (#16302e) outline, three-step cel shading, 3/4 top-down view. No blur, anti-aliasing, gradients, glow, halo, vignette, 3D render or painterly strokes. No shadows, floor, text, letters, numbers, logos, grid lines or cell borders. Fully transparent background (if impossible, a perfectly flat #FF00FF background with no shadow or gradient and no magenta on the character).

SELF-CHECK before returning: put the front pose next to a walk-sheet front frame. Head size, body width, leg length and shoe size must match, and the figure must look just as short and round. If it looks taller or slimmer than the walk figure, redraw it yourself.
```

### 15. `kid` — 꼬마 팬

- 저장 파일: `char-kid-turn.png`
- 새 대화: 예 (`T-kid`)
- 첨부 ①: `tmp/world-src/characters/char-kid-walk.png` (비율 기준, walk 초기본)
- 첨부 ②: `tmp/world-src/characters/char-kid-turn.png` (현재 turn, 디자인 기준 — 덮어쓰기 전 백업본)
- 합격선: 정면 컷 높이/너비 1.44 ~ 1.76 (walk 1.60 ±10%)

```text
Redraw the attached CURRENT turnaround sheet of Little fan (kid) with corrected chibi proportions. The character design is right, but the current figures are far too tall and slim: roughly 3.5 heads tall with a small head and a narrow body. Keep the exact same character, palette, outfit and accessories, but draw all three poses with the SAME chibi proportions as the attached WALK sheet.

PROPORTION MASTER (mandatory): the attached walk sheet is the size-and-shape reference. Copy the figure proportions from its top row (front view) for the front pose, its middle row (right-facing profile) for the side pose, and its bottom row (back view) for the back pose. The head, including hair volume and head accessories, is about 40-45% of the figure's total height (about 2.5 heads tall); the torso is short and compact, the legs are short, the shoes/boots are big. The height-to-width ratio of the front pose must equal that of the walk sheet's front figures. If in doubt make the figure shorter and rounder, never taller or slimmer. Do not reuse the tall silhouette of the current turn sheet: use it only for costume details, colours, and the design of the side and back views.

LAYOUT: one transparent 1536x1024 canvas with three standing poses side by side, each centred in its own equal third of the canvas: 1) front view facing the camera, 2) right-facing side profile, 3) back view facing away. Same scale and identical pixel size in all three; each figure about 375 px tall; all feet on exactly the same baseline; at least 10% empty margin around each pose and clear gaps between poses.
POSE: standing idle, feet together, arms relaxed as in the current turn sheet, no walking stride, no motion.

KEEP EXACTLY: a small child fan, wearing an oversized white-and-mint football jersey that reaches the knees, a red scarf, a bucket cap, holding a small mint pennant flag, huge excited eyes.
The child is drawn at about 75% of the standard adult height, so each figure is about 375 px tall (not 500), but it still uses the walk sheet's chibi proportions.

STYLE: crisp high-detail 32-bit JRPG pixel art at the same pixel block size and line thickness as the walk sheet, 1-pixel dark teal (#16302e) outline, three-step cel shading, 3/4 top-down view. No blur, anti-aliasing, gradients, glow, halo, vignette, 3D render or painterly strokes. No shadows, floor, text, letters, numbers, logos, grid lines or cell borders. Fully transparent background (if impossible, a perfectly flat #FF00FF background with no shadow or gradient and no magenta on the character).

SELF-CHECK before returning: put the front pose next to a walk-sheet front frame. Head size, body width, leg length and shoe size must match, and the figure must look just as short and round. If it looks taller or slimmer than the walk figure, redraw it yourself.
```

### 16. `referee` — 심판

- 저장 파일: `char-referee-turn.png`
- 새 대화: 예 (`T-referee`)
- 첨부 ①: `tmp/world-src/characters/char-referee-walk.png` (비율 기준, walk 초기본)
- 첨부 ②: `tmp/world-src/characters/char-referee-turn.png` (현재 turn, 디자인 기준 — 덮어쓰기 전 백업본)
- 합격선: 정면 컷 높이/너비 2.09 ~ 2.55 (walk 2.32 ±10%)

```text
Redraw the attached CURRENT turnaround sheet of Referee with corrected chibi proportions. The character design is right, but the current figures are far too tall and slim: roughly 3.5 heads tall with a small head and a narrow body. Keep the exact same character, palette, outfit and accessories, but draw all three poses with the SAME chibi proportions as the attached WALK sheet.

PROPORTION MASTER (mandatory): the attached walk sheet is the size-and-shape reference. Copy the figure proportions from its top row (front view) for the front pose, its middle row (right-facing profile) for the side pose, and its bottom row (back view) for the back pose. The head, including hair volume and head accessories, is about 40-45% of the figure's total height (about 2.5 heads tall); the torso is short and compact, the legs are short, the shoes/boots are big. The height-to-width ratio of the front pose must equal that of the walk sheet's front figures. If in doubt make the figure shorter and rounder, never taller or slimmer. Do not reuse the tall silhouette of the current turn sheet: use it only for costume details, colours, and the design of the side and back views.

LAYOUT: one transparent 1536x1024 canvas with three standing poses side by side, each centred in its own equal third of the canvas: 1) front view facing the camera, 2) right-facing side profile, 3) back view facing away. Same scale and identical pixel size in all three; each figure about 500 px tall; all feet on exactly the same baseline; at least 10% empty margin around each pose and clear gaps between poses.
POSE: standing idle, feet together, arms relaxed as in the current turn sheet, no walking stride, no motion.

KEEP EXACTLY: a football referee, athletic build, black referee kit with yellow trim, a silver whistle hanging on a lanyard, a small yellow card and a red card sticking out of the chest pocket, a short cap, serious but fair expression.
Keep the card-pocket details readable as plain shapes, no text.

STYLE: crisp high-detail 32-bit JRPG pixel art at the same pixel block size and line thickness as the walk sheet, 1-pixel dark teal (#16302e) outline, three-step cel shading, 3/4 top-down view. No blur, anti-aliasing, gradients, glow, halo, vignette, 3D render or painterly strokes. No shadows, floor, text, letters, numbers, logos, grid lines or cell borders. Fully transparent background (if impossible, a perfectly flat #FF00FF background with no shadow or gradient and no magenta on the character).

SELF-CHECK before returning: put the front pose next to a walk-sheet front frame. Head size, body width, leg length and shoe size must match, and the figure must look just as short and round. If it looks taller or slimmer than the walk figure, redraw it yourself.
```

### 17. `weedking` — 제초왕

- 저장 파일: `char-weedking-turn.png`
- 새 대화: 예 (`T-weedking`)
- 첨부 ①: `tmp/world-src/characters/char-weedking-walk.png` (비율 기준, walk 초기본)
- 첨부 ②: `tmp/world-src/characters/char-weedking-turn.png` (현재 turn, 디자인 기준 — 덮어쓰기 전 백업본)
- 합격선: 정면 컷 높이/너비 1.12 ~ 1.36 (walk 1.24 ±10%)

```text
Redraw the attached CURRENT turnaround sheet of Weed King (weedking) with corrected chibi proportions. The character design is right, but the current figures are far too tall and slim: roughly 3.5 heads tall with a small head and a narrow body. Keep the exact same character, palette, outfit and accessories, but draw all three poses with the SAME chibi proportions as the attached WALK sheet.

PROPORTION MASTER (mandatory): the attached walk sheet is the size-and-shape reference. Copy the figure proportions from its top row (front view) for the front pose, its middle row (right-facing profile) for the side pose, and its bottom row (back view) for the back pose. The head, including hair volume and head accessories, is about 40-45% of the figure's total height (about 2.5 heads tall); the torso is short and compact, the legs are short, the shoes/boots are big. The height-to-width ratio of the front pose must equal that of the walk sheet's front figures. If in doubt make the figure shorter and rounder, never taller or slimmer. Do not reuse the tall silhouette of the current turn sheet: use it only for costume details, colours, and the design of the side and back views.

LAYOUT: one transparent 1536x1024 canvas with three standing poses side by side, each centred in its own equal third of the canvas: 1) front view facing the camera, 2) right-facing side profile, 3) back view facing away. Same scale and identical pixel size in all three; each figure about 450 px tall; all feet on exactly the same baseline; at least 10% empty margin around each pose and clear gaps between poses.
POSE: standing idle, feet together, arms relaxed as in the current turn sheet, no walking stride, no motion.

KEEP EXACTLY: a comical villain, long grey-brown coat with a high collar, dark sunglasses, a big curled moustache, a crown made of spinning lawn-mower blades, a petrol grass-trimmer carried over the shoulder, a round badge showing a crossed-out sprout (no text), grey and rust-orange palette with a hint of purple, smug grin.
He is the tallest cast member (about 95% of the canvas in the original brief), but every pose must still fit inside its column with the crown and trimmer; use about 450 px per figure and the walk sheet's proportions. Carry the trimmer the same way as in the current turn sheet.

STYLE: crisp high-detail 32-bit JRPG pixel art at the same pixel block size and line thickness as the walk sheet, 1-pixel dark teal (#16302e) outline, three-step cel shading, 3/4 top-down view. No blur, anti-aliasing, gradients, glow, halo, vignette, 3D render or painterly strokes. No shadows, floor, text, letters, numbers, logos, grid lines or cell borders. Fully transparent background (if impossible, a perfectly flat #FF00FF background with no shadow or gradient and no magenta on the character).

SELF-CHECK before returning: put the front pose next to a walk-sheet front frame. Head size, body width, leg length and shoe size must match, and the figure must look just as short and round. If it looks taller or slimmer than the walk figure, redraw it yourself.
```

### 18. `weeder-grunt` — 제초 요원

- 저장 파일: `char-weeder-grunt-turn.png`
- 새 대화: 예 (`T-weeder-grunt`)
- 첨부 ①: `tmp/world-src/characters/char-weeder-grunt-walk.png` (비율 기준, walk 초기본)
- 첨부 ②: `tmp/world-src/characters/char-weeder-grunt-turn.png` (현재 turn, 디자인 기준 — 덮어쓰기 전 백업본)
- 합격선: 정면 컷 높이/너비 1.44 ~ 1.76 (walk 1.60 ±10%)

```text
Redraw the attached CURRENT turnaround sheet of Weeder grunt with corrected chibi proportions. The character design is right, but the current figures are far too tall and slim: roughly 3.5 heads tall with a small head and a narrow body. Keep the exact same character, palette, outfit and accessories, but draw all three poses with the SAME chibi proportions as the attached WALK sheet.

PROPORTION MASTER (mandatory): the attached walk sheet is the size-and-shape reference. Copy the figure proportions from its top row (front view) for the front pose, its middle row (right-facing profile) for the side pose, and its bottom row (back view) for the back pose. The head, including hair volume and head accessories, is about 40-45% of the figure's total height (about 2.5 heads tall); the torso is short and compact, the legs are short, the shoes/boots are big. The height-to-width ratio of the front pose must equal that of the walk sheet's front figures. If in doubt make the figure shorter and rounder, never taller or slimmer. Do not reuse the tall silhouette of the current turn sheet: use it only for costume details, colours, and the design of the side and back views.

LAYOUT: one transparent 1536x1024 canvas with three standing poses side by side, each centred in its own equal third of the canvas: 1) front view facing the camera, 2) right-facing side profile, 3) back view facing away. Same scale and identical pixel size in all three; each figure about 500 px tall; all feet on exactly the same baseline; at least 10% empty margin around each pose and clear gaps between poses.
POSE: standing idle, feet together, arms relaxed as in the current turn sheet, no walking stride, no motion.

KEEP EXACTLY: a factory-worker minion, grey coverall with rust-orange stripes, a hard hat with a face visor, thick gloves, holding a hand-held grass trimmer, goggles, expressionless, grey and rust-orange palette.
Keep the trimmer in the same hand as in the current turn sheet.

STYLE: crisp high-detail 32-bit JRPG pixel art at the same pixel block size and line thickness as the walk sheet, 1-pixel dark teal (#16302e) outline, three-step cel shading, 3/4 top-down view. No blur, anti-aliasing, gradients, glow, halo, vignette, 3D render or painterly strokes. No shadows, floor, text, letters, numbers, logos, grid lines or cell borders. Fully transparent background (if impossible, a perfectly flat #FF00FF background with no shadow or gradient and no magenta on the character).

SELF-CHECK before returning: put the front pose next to a walk-sheet front frame. Head size, body width, leg length and shoe size must match, and the figure must look just as short and round. If it looks taller or slimmer than the walk figure, redraw it yourself.
```

## 7. 수령 후 전달·검증

1. 기존 turn을 §3-6대로 백업하고, 새 PNG를 §4의 `저장 파일` 이름 그대로 `tmp/world-src/characters/`에 덮어쓴다.
2. 어떤 파일이 어느 기존 파일을 대체하는지, 투명 PNG인지 마젠타 배경인지 알려 준다.
3. 개발 세션에서 다음을 수행한다.
   - 정면·우측·후면 bbox 측정으로 §2의 비율 합격선 확인(스프라이트 추출기 기준).
   - `pnpm convert:world-art -- characters <id>` 실행 후 변환기 QA(가장자리 닿음, 발끝 편차, 스케일 축소 경고) 확인.
   - 게임 내 idle ↔ walk 전환에서 폭이 튀지 않는지 확인.
4. 합격선을 못 넘긴 캐릭터만 §5 수정 프롬프트로 같은 대화에서 재요청한다.

## 8. 작업 순서 제안

1. **재닌**(격차 36%, 가장 큼)로 프롬프트를 먼저 검증한다. 합격하면 톤을 확정한다.
2. 격차 큰 순서: `bboringirl` → `kaksjak0730` → `doormomo` → `haepalin` → `lina0108` → `ju010228` → `sjh4018` → 나머지 멤버 → 오리지널 NPC.
3. 우왁굳·제초왕·꼬마 팬은 전용 지시(마스코트 머리, 최대 키, 75% 키)가 들어 있으니 프롬프트를 수정하지 말고 그대로 쓴다.
4. 우선순위: 플레이 가능한 멤버 11명(선택 화면·idle이 가장 자주 보임) → 우왁굳·`elder` → 나머지 NPC.

## 9. 진행 현황 (2026-09-20)

**적용 완료 13명**: `janine95kim`, `bboringirl`, `sjh4018`, `doormomo`, `hachi97`, `kaksjak0730`, `ju010228`, `haepalin`, `tleod1818`, `tdnlamuron`, `lina0108`, `woowakgood`, `kid`.

- 새 turn PNG를 `tmp/world-src/characters/`에 반영했고, 기존 파일은 `tmp/world-src/_backup/turn-2026-09-20/`에 백업했다.
- 정면 컷 비율 오차(walk 대비): 12명 ±9% 이내, `woowakgood` −11%(walk보다 약간 둥글게 나옴, 허용).
- 아틀라스는 **idle 행(0행)만 교체**했다. walk 행(1~3행)은 커밋된 `characters/<id>-atlas.webp`와 픽셀 단위로 동일하다.
  - 이유: 지금 `tmp/world-src/characters/`의 walk 원본으로 전체 변환하면 일부 캐릭터의 walk 행이 바뀌고, `haepalin`은 walk 시트의 빈 셀(r2c2) 때문에 walk 행이 54%로 축소돼 깨진다. walk 원본을 정리하기 전에는 전체 변환 결과를 그대로 쓰지 말 것.
- stand·portrait 웹 자산은 바뀌지 않았다.

**보류 5명(turn 재생성 안 함)**: `elder`, `shopkeeper`, `referee`, `weedking`, `weeder-grunt`. 격차가 10~18%로 작고 중요도가 낮아 기존 turn을 유지한다.

**남은 확인**
- `kid`: 새 turn에는 민트 페넌트 깃발이 들어가 있지만 walk에는 깃발이 없다. 멈출 때만 깃발이 생겼다 사라진다. 깃발을 빼고 다시 요청하거나(§5-3 변형) walk에도 깃발을 넣어야 한다.
- `haepalin` walk 원본(`char-haepalin-walk.png`)의 r2c2 셀이 비어 있다. 이 원본을 웹에 반영하려면 먼저 고쳐야 한다.
