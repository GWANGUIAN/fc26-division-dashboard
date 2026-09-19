# 06. UI 아트 — 플로팅 버튼·키아트·프레임·아이콘

> **생성 실행용 문서**: 이미지를 실제로 만들 때는 스타일 문구가 프롬프트마다 풀어 들어 있고 스레드·레퍼런스·순서가 정리된 [10-image-generation-runbook.md](10-image-generation-runbook.md)를 사용한다. 이 문서는 설계·프롬프트의 원천이며, 고치면 `node docs/world/tools/build-image-runbook.mjs`로 10번 문서를 재생성한다.

잔디동 월드의 UI 이미지 프롬프트와 **CSS 구현 규격**을 정리한다. 글자·게이지·키캡 같은 것은 코드/CSS로 만들고, **AI 이미지는 "프레임·판·아이콘·키아트"만** 만든다. 스타일 바이블/STYLE_BLOCK/스레드 운영은 [04 §1](04-art-characters.md#1-스타일-바이블-모든-이미지-공통), 캔버스/시트 규칙은 [05 §0](05-art-world.md#0-공통-작업-방식), 체크리스트는 [09](09-asset-checklist.md).

## 0. UI 규격

### 논리 좌표계 (중요)
- 월드 화면(캔버스 + DOM UI)을 하나의 **640×360 논리 스테이지**로 취급하고, 스테이지 전체를 정수 배율(`transform: scale(var(--s))`, `transform-origin: top left`)로 확대한다. 그러면 프레임 이미지·폰트가 월드 도트와 **같은 픽셀 크기**로 보인다.
- 폰트: **Galmuri11**(이미 로드됨), 기본 11px(논리). 정수 배율에서만 선명하므로 스테이지 스케일은 항상 정수.
- 이 문서의 모든 "최종 px"는 **논리 px**(640×360 기준)다.
- 프레임은 CSS `border-image`(9‑slice)로 늘린다: `border-image: url(...) <slice> fill / <width> stretch; image-rendering: pixelated;`.

### 디자인 언어 (모든 UI 공통 문구)
`dark teal panels (#0b1614) with mint (#00e9ae) pixel trim and small leaf-shaped corner ornaments, cream paper for parchment items, warm gold accents (#ffd54a), matching the 잔디동 football club identity (mint and white, sprout shield)`

### 코드/CSS로 구현하는 요소 (AI 이미지 제외)
텍스트·라벨·로고 글자("잔디동 월드"), 키캡(← ↑ → ↓ / WASD / E / Space / Esc / J / M / Shift), 진행률바 채움, 미니맵 내용, 페이드/비네트, 파티클, 코치마크 말풍선 꼬리, 위치 태그 색(`position-theme.ts`), 조각 게이지의 채움 애니메이션, 버튼 눌림(translateY), 글로우(attention pulse, `FortuneToggle` 패턴).

## 1. 플로팅 버튼 "잔디동 월드 구경하기"

좌측 상단 고정 버튼(모바일 ≤680px 숨김). **판(plate)과 아이콘만 AI로, 글자는 CSS로 얹는다**(AI가 한글 글자를 정확히 그리지 못하고, 글자를 코드로 두면 다국어/수정이 쉬움). 생성 위치 `src/web/assets/world/ui/`.

| ID | 원본 이름 | 캔버스 | 최종 px | 용도 |
| --- | --- | --- | --- | --- |
| `fab-normal` | `ui-fab-normal.png` | 1536×1024 | 264×72 | 기본 상태 |
| `fab-hover` | `ui-fab-hover.png` | 1536×1024 | 264×72 | 호버/포커스(같은 구도, 더 밝고 글로우) |
| `fab-icon` | `ui-fab-icon.png` | 1024×1024 | 64×64 | 원형 아이콘 단독(로딩 스피너/알림 등 재사용) |

```text
Draw a horizontal pixel-art floating-button plate for a website, aspect ratio about 3.7:1, centred on the canvas on a transparent background (or flat #FF00FF), for a football club's pixel RPG world.
Design: the left end has a round medallion showing a tiny bright pixel village with a football stadium and a sprouting green seedling; the plate body is warm wooden planks with a mint-green (#2ee8b6) trim, tiny grass tufts growing on the top edge, and a small golden rivet at each corner. The middle-right area of the plate must be a calm, flat, darker green panel that is EMPTY (no text, no letters, no symbols) because text is added later by code. Crisp pixel outline, three-step shading, cheerful and inviting.
No cast shadow, no text anywhere, no watermark.
```

- **fab-hover**: 위 이미지를 첨부하고 `Keep exactly the same layout, size and design as the attached image, but make it brighter with a soft mint glow around the plate, tiny gold sparkles near the medallion, and the plate looking lifted slightly. Keep the text area empty.`
- **fab-icon**: `Draw only the round medallion from the attached plate as a standalone icon, 1024x1024, centred, transparent background, same style.`
- **(실험, 선택)** 글자 포함 버전: 프롬프트 끝에 `Write the Korean text "잔디동 월드 구경하기" in the empty panel in a clean pixel font, exactly these characters.`를 덧붙여 시도하되, **글자가 한 글자라도 틀리면 텍스트 없는 버전 + CSS 글자를 사용**한다.
- CSS 글자(구현): Galmuri11 11px, 흰색 + 1px 짙은 청록 외곽선(`text-shadow`), 판의 빈 패널 중앙(가로 62%)에 배치. 첫 방문 시 `fc26-world-discovered-v1` 미설정이면 `fancy-border`/attention glow(기존 `fortune-toggle.css` 패턴)와 말풍선("잔디동 마을이 열렸어요!") 표시.
- 배치(구현): `position: fixed; z-index: 75; top: 12px; left: 12px;`, 표시 크기 **220×60**(변환본 264×72를 축소). `.topbar` 브랜드와 sticky 검색바를 가리지 않도록 `world-toggle.css`가 좌측 패딩을 예약하고, 스크롤 80px 이상이면 `fab-icon`(48px 원형)으로 축소한다([08 §5 #2](08-implementation-roadmap.md#5-미해결-항목)). 이미지가 없거나 로드 실패하면 CSS 폴백 판(나무 테두리 + 초록 패널 + 민트 메달리온)이 대신 보이고, hover 이미지는 같은 자리에 겹쳐 페이드한다.

## 2. 로딩·타이틀·로고 키아트

| ID | 원본 이름 | 캔버스 | 최종 px | 용도 |
| --- | --- | --- | --- | --- |
| `loading-bg` | `ui-loading-bg.png` | 1536×1024 | 960×540 | 로딩 화면 배경(활기찬 잔디동 전경). **엔딩 후 타이틀 배경으로도 재사용** |
| `title-bg` | `ui-title-bg.png` | 1536×1024 | 960×540 | 엔딩 전 타이틀 배경(같은 구도, 시든 버전) |
| `logo-emblem` | `ui-logo-emblem.png` | 1024×1024 | 192×192 | 타이틀 로고 엠블럼(글자 없음, 글자는 CSS) |

**`loading-bg`**
```text
A wide panoramic pixel-art illustration (16:9 composition inside a 1536x1024 canvas, keep the important content in the central 16:9 area) of the football-club village "잔디동" at golden hour, viewed from a high 3/4 angle: a big football stadium in the centre with mint banners and a glowing golden patch of grass, a plaza with a fountain in front, and five districts around it: pink cherry-blossom garden on the left, a frozen night lake on the right, a cloud castle at the top left, a violet rune tower at the top right, and orange lava workshops at the bottom left. Warm light, tiny detailed houses, winding paths, lush green grass. No people, no text, no letters, no logos.
```
**`title-bg`** — `loading-bg`를 첨부하고:
```text
Keep exactly the same composition and buildings as the attached image, but show the village WITHERING: the grass is faded yellow-grey, the sky is a dull dusk, the cherry blossoms are bare, the colours are desaturated, weed-cutting machines and grey smoke appear at the far bottom right, and only the golden patch of grass at the stadium still glows faintly. Melancholic but not scary. No people, no text, no letters, no logos.
```
**`logo-emblem`**
```text
A round-cornered football-club shield emblem, centred, transparent background: a mint-and-white shield with gold trim, a sprouting green seedling growing out of a classic football at the centre, small laurel leaves on both sides, a subtle glow. Pixel art, crisp outline. Absolutely no text, no letters, no numbers.
```

## 3. 프레임 시트 A — 대사·선택·토스트 (`ui-frames-dialog`)

원본 이름 `ui-frames-dialog.png`, **1536×1024, 4열×3행(12칸)**. 프레임은 9‑slice로 늘리므로 **좌우·상하 완전 대칭, 모서리 장식 동일, 가장자리는 단순 반복**으로 요청한다.

```text
Create a UI frame kit for a pixel-art RPG on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows (12 cells, each 384x341), exactly one UI element per cell, centred, transparent background (or flat #FF00FF), no cell borders or grid lines, at least 8% empty margin inside each cell, no text or letters anywhere (labels and text areas are blank), crisp pixel outline, three-step shading. Design language: dark teal panels (#0b1614) with mint (#00e9ae) pixel trim and small leaf-shaped corner ornaments, warm gold accents (#ffd54a), matching a football club identity (mint and white, sprout shield). Every frame must be perfectly symmetrical left-right and top-bottom, with identical corner ornaments and plain repeating straight edges so it can be stretched as a 9-slice frame, and a flat calm centre area.
Elements in order (left to right, top to bottom):
1) large dialogue box frame (wide rectangle), 2) name plate frame (small wide tag), 3) square portrait frame with a slightly thicker ornate border, 4) choice item frame normal (wide short bar), 5) choice item frame selected (same bar, glowing mint border and gold edge), 6) menu cursor: a small pixel football pointing right, 7) dialogue-next indicator frame 1: a small mint downward triangle, 8) dialogue-next indicator frame 2: the same triangle slightly lower with a soft glow, 9) toast banner frame (wide short with ribbon ends), 10) coach-mark tutorial bubble frame (rounded rectangle, no tail), 11) tooltip frame (small rounded rectangle), 12) loading-bar frame (a long thin empty groove with a mint trim, the inside completely empty and dark)
```

| 슬롯 | ID | 최종 px | `border-image-slice` | 사용처 |
| --- | --- | --- | --- | --- |
| 1 | `dialog-frame` | 96×96 | 20 | 대사창(가로 확장), 하단 `20,252 600×88` |
| 2 | `nameplate` | 96×32 | 10 | 화자 이름표(대사창 위 왼쪽) |
| 3 | `portrait-frame` | 160×160 | 20 | 초상 프레임 안쪽 128×128에 표정 이미지 |
| 4 | `choice-normal` | 128×32 | 10 | 선택지 항목 |
| 5 | `choice-selected` | 128×32 | 10 | 선택된 항목 |
| 6 | `cursor` | 24×24 | — | 선택 커서(공 모양) |
| 7 | `next-1` | 16×16 | — | 대사 넘김 표시(2프레임 깜빡임) |
| 8 | `next-2` | 16×16 | — | |
| 9 | `toast-frame` | 192×48 | 14 | 미션 완료/조각 획득 배너 |
| 10 | `coach-frame` | 128×64 | 16 | 튜토리얼 코치마크(꼬리는 CSS) |
| 11 | `tooltip-frame` | 96×32 | 10 | 상호작용 "E" 프롬프트·조사 툴팁 |
| 12 | `loading-bar-frame` | 320×32 | 8 | 로딩 진행률바 홈(채움은 CSS 민트 스트라이프) |

## 4. 프레임 시트 B — 패널·HUD·게시판 (`ui-frames-panel`)

원본 이름 `ui-frames-panel.png`, **1536×1024, 4×3**. 프롬프트는 시트 A와 같은 머리말 + 아래 목록.

```text
(같은 머리말 — 시트 A 프롬프트의 첫 문단 그대로, 단 "12 cells" 유지)
Elements in order (left to right, top to bottom):
1) large menu window frame (near-square), 2) parchment notebook page for a mission log (cream paper with faint ruled lines, soft dark-green binding on the left, no writing), 3) tab button normal (small wide tag with top corners rounded), 4) tab button active (same tag, brighter, gold underline), 5) HUD mission-tracker frame (small wide dark panel with a tiny gold leaf icon slot at the left), 6) minimap frame (rectangle with thicker ornate corners, empty dark inside), 7) shard gauge bar frame (long thin bar holding ten round slots in a row, all slots empty), 8) one empty round shard slot (dark socket with mint rim), 9) one filled round shard slot (the same socket filled with a glowing mint-and-gold grass-blade crystal), 10) community notice board paper (pinned cream paper with a pin at the top, no writing), 11) daily stamp card frame (a cream card with a grid area of 6x5 empty circles, no writing), 12) a round red-and-mint completed stamp mark (a paw-print-like sprout stamp, no letters)
```

| 슬롯 | ID | 최종 px | slice | 사용처 |
| --- | --- | --- | --- | --- |
| 1 | `panel-frame` | 128×128 | 24 | 메뉴/설정 창 |
| 2 | `panel-parchment` | 192×128 | 24 | 미션 로그 본문 종이 |
| 3 | `tab-normal` | 64×24 | 8 | 탭 |
| 4 | `tab-active` | 64×24 | 8 | 활성 탭 |
| 5 | `hud-tracker` | 168×40 | 12 | 좌상단 현재 목표 트래커 |
| 6 | `minimap-frame` | 104×72 | 12 | 미니맵 테두리 |
| 7 | `shard-gauge` | 188×28 | 8 | 잔디 조각 10칸 게이지(칸 위치는 CSS) |
| 8 | `shard-empty` | 16×16 | — | 빈 칸 |
| 9 | `shard-filled` | 16×16 | — | 채워진 칸 |
| 10 | `board-paper` | 128×96 | 12 | 일일 미션 게시판 종이 |
| 11 | `stamp-card` | 192×160 | 16 | 출석 스탬프 카드 |
| 12 | `stamp-mark` | 24×24 | — | 도장 |

## 5. 버튼 시트 (`ui-buttons`)

원본 이름 `ui-buttons.png`, **1536×1024, 4×2(8칸, 칸당 384×512)**. 눌림/호버는 상태별 이미지를 쓴다(CSS 필터 대신).

```text
(같은 머리말) grid of 4 columns x 2 rows (8 cells). Elements in order (left to right, top to bottom):
1) primary button normal (wide rounded plate, mint-green with white top highlight and dark teal bottom edge, the centre area EMPTY), 2) primary button hover (brighter with a glow), 3) primary button pressed (darker, shifted down by a few pixels, no bottom edge), 4) primary button disabled (desaturated grey),
5) secondary button normal (dark teal plate with mint outline, centre EMPTY), 6) secondary hover (brighter outline), 7) secondary pressed (darker), 8) secondary disabled (grey outline)
Each button is perfectly symmetrical left-right so it can be stretched as a 9-slice. No text.
```

| ID | 최종 px | slice |
| --- | --- | --- |
| `btn-primary-normal`, `btn-primary-hover`, `btn-primary-pressed`, `btn-primary-disabled` | 96×28 | 8 |
| `btn-secondary-normal`, `btn-secondary-hover`, `btn-secondary-pressed`, `btn-secondary-disabled` | 96×28 | 8 |

## 6. 캐릭터 선택 화면

| ID | 원본 이름 | 캔버스 | 최종 px | 용도 |
| --- | --- | --- | --- | --- |
| `select-bg` | `ui-select-bg.png` | 1536×1024 | 960×540 | 배경(사람 없음) |
| `select-cards` (시트) | `ui-select-cards.png` | 1536×1024 (4×3) | (아래) | 카드·화살표·장식 |

**`select-bg`**
```text
A soft pixel-art background for a character-selection screen: a football pitch at dusk with a large soft spotlight cone in the centre, gentle floating cherry-blossom petals and fireflies, mint and teal tones, the centre area empty and calm so that character cards can be placed on top. 16:9 composition inside a 1536x1024 canvas (keep important content in the central 16:9). No people, no text, no letters.
```
**`select-cards` 시트**: 머리말 + 다음 목록
```text
Elements in order (left to right, top to bottom):
1) character card frame normal (tall portrait-oriented dark teal card with mint trim, empty inside with a subtle pedestal at the bottom), 2) card frame hover (brighter, mint glow), 3) card frame selected (gold trim, strong glow, small gold sparkles), 4) card frame dimmed (darker, desaturated), 5) left arrow button (pixel arrow on a round plate), 6) right arrow button, 7) name ribbon (wide ribbon banner, empty), 8) spotlight cone (soft, additive glow, transparent), 9) ground shadow ellipse (soft dark ellipse), 10) small floating football marker (bobbing above the selected card), 11) sparkle ring (thin gold ring with sparkles, for selection confirmation), 12) confirm check mark badge (mint circle with a white check)
```

| 슬롯 | ID | 최종 px | slice |
| --- | --- | --- | --- |
| 1~4 | `card-normal`, `card-hover`, `card-selected`, `card-dim` | 72×104 | 12 |
| 5, 6 | `arrow-left`, `arrow-right` | 24×24 | — |
| 7 | `name-ribbon` | 96×24 | 10 |
| 8 | `spotlight` | 96×96 | — |
| 9 | `shadow-ellipse` | 40×12 | — |
| 10 | `ball-marker` | 16×16 | — |
| 11 | `sparkle-ring` | 64×64 | — |
| 12 | `check-badge` | 20×20 | — |

레이아웃(논리 640×360): 카드 11장을 가로 스크롤(중앙 카드 확대) 또는 6+5 두 줄 그리드로 배치. 카드 안에는 `characters/<id>-stand.webp`(선택 화면 스탠딩)와 이름·포지션 태그(코드). 선택 시 `ball-marker` 바운스 + `sparkle-ring`.

## 7. 아이콘 시트 3장

공통 머리말 + "**each icon is a simple bold symbol on a small round or square plate, readable at 32x32**". 4×3 그리드, 1536×1024.

### 7-1. `ui-icons-mission` — 미션 상태/유형 (최종 32×32)
`LIST`: `1) mission in progress (a small clock), 2) mission ready to report (a gold exclamation-mark symbol), 3) mission completed (a green check), 4) mission locked (a padlock), 5) 3D card mission (a card with a star), 6) sum-ten puzzle game (a football with abstract number dots), 7) juggling game (a football bouncing on a foot), 8) free-kick game (a goal with a football), 9) card matching game (two overlapping cards), 10) delivery mission (a parcel with an arrow), 11) collect mission (a sparkle over a jar), 12) talk mission (a speech bubble)`
슬롯 ID: `mi-progress, mi-ready, mi-done, mi-locked, mi-card, mi-sum10, mi-kickups, mi-freekick, mi-cardmatch, mi-delivery, mi-collect, mi-talk`

### 7-2. `ui-icons-menu` — 메뉴 (최종 24×24)
`LIST`: `1) resume (play triangle), 2) mission log (open book), 3) world map (folded map), 4) settings (gear), 5) guide (question-mark symbol in a bubble), 6) sound on (speaker with waves), 7) sound off (speaker with a slash), 8) close (x mark), 9) back (left arrow), 10) exit (door with an arrow), 11) new game (circular refresh arrows), 12) info (small i-shaped symbol in a circle)`
슬롯 ID: `mn-resume, mn-log, mn-map, mn-settings, mn-guide, mn-sound-on, mn-sound-off, mn-close, mn-back, mn-exit, mn-new, mn-info`

### 7-3. `ui-badges` — 뱃지/칭호 (최종 48×48)
`LIST`: `1) first game badge (a small arcade joystick), 2) five grass shards badge (five green crystals), 3) ten grass shards badge (ten crystals in a golden ring), 4) defeated the weed king badge (a broken mower blade), 5) ball hunter badge (a football with a magnifying glass), 6) ball collector badge (a bronze football trophy), 7) ball master badge (a golden football trophy), 8) green thumb badge (a watering can with a sprout), 9) card collector badge (three fanned cards), 10) runner 1000 metres badge (a running shoe with wings), 11) daily stamp 7 badge (a calendar with a check, silver), 12) daily stamp 30 badge (a calendar with a check, gold)`
슬롯 ID: `bd-first-game, bd-shard-5, bd-shard-10, bd-weed-beaten, bd-ball-hunter, bd-ball-collector, bd-ball-master, bd-green-thumb, bd-card-collector, bd-rush-1000, bd-stamp-7, bd-stamp-30`

## 8. 화면별 조립 참고 (논리 640×360)

| 화면 | 구성 |
| --- | --- |
| 로딩 | `loading-bg`(cover) + 하단 `loading-bar-frame`(320×32, 중앙) + CSS 채움 + 팁 문구 + 로고 소형 |
| 타이틀 | `title-bg`(엔딩 후 `loading-bg`) + `logo-emblem` + CSS 글자 "잔디동 월드" + `btn-primary`("새로 시작"/"이어하기") + `btn-secondary`("나가기") |
| 캐릭터 선택 | `select-bg` + 카드 11장 + 좌우 `arrow-*` + `name-ribbon` + 확정 `btn-primary` + 안내 텍스트(코드) |
| 월드 HUD | 좌상단 `hud-tracker`(현재 미션 아이콘+제목), 우상단 `minimap-frame`(코드 미니맵) + `shard-gauge`(10칸), 하단 대사창 시 숨김 |
| 대사 | `dialog-frame`(하단) + `nameplate` + `portrait-frame`(초상 128×128) + `next-1/2` 깜빡임 + 선택지 `choice-*` + `cursor` |
| 미션 로그(J) | `panel-parchment` + 탭 `tab-*` + `mi-*` 아이콘 + 진행률 텍스트 |
| 메뉴(Esc) | `panel-frame` + `btn-secondary` 목록 + `mn-*` 아이콘 |
| 일일 게시판 | `board-paper` + `stamp-card` + `stamp-mark` + `bd-*` |
| 토스트 | `toast-frame` + `shard-filled`/`bd-*` 아이콘 + 텍스트 |
| 코치마크 | `coach-frame` + CSS 꼬리 + 키캡(CSS) |

## 9. 생성 개수 (이 문서 범위)

| 이미지 | 장수 |
| --- | --- |
| 플로팅 버튼(normal/hover/icon) | 3 |
| 키아트(loading/title/logo) | 3 |
| 프레임 시트 A, B | 2 |
| 버튼 시트 | 1 |
| 캐릭터 선택(배경 + 카드 시트) | 2 |
| 아이콘/뱃지 시트 3장 | 3 |
| **합계** | **14장** (슬라이스 후 최종 에셋 약 100개) |

우선순위: **P0** = 플로팅 버튼 3, 로딩/타이틀/로고 3, 프레임 시트 A·B, 버튼 시트, 캐릭터 선택 2, 미션·메뉴 아이콘. **P1** = 뱃지 시트.
