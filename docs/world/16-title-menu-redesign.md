# 16. 타이틀 화면 개선안 — 로고 글자·메뉴 영역 리디자인

게임 시작 화면(`ui/TitleScreen.tsx`)의 **로고 + 글자 "잔디동 월드" + 메뉴 영역**을 더 예쁘게 다시 만드는 계획서이자 **이미지 생성 요청서**다. 상태: **Phase A·B + 소리 구현 완료(2026-09-21), 이미지 2장 변환·연결 완료, 화면 확인은 배포 후**. 로고는 **A안(잔디 그린 + 골드)으로 확정**. 스타일 바이블은 [04 §1](04-art-characters.md#1-스타일-바이블-모든-이미지-공통), UI 규격·디자인 언어는 [06 §0](06-art-ui.md#0-ui-규격), 현재 타이틀 구성은 [06 §8](06-art-ui.md#8-화면별-조립-참고-논리-640360)를 따른다.

## 0. 한눈에 보기

| 항목 | 내용 |
| --- | --- |
| 핵심 문제 | ① 화면 높이의 90%를 덮는 **불투명한 큰 판**이 타이틀 키아트를 가림 ② 로고 글자(진녹색 + 흰 외곽선)가 스티커처럼 밋밋 ③ 버튼 장식이 늘어나고 **선택 상태와 강조 상태가 섞임** ④ 움직임·반짝임이 전혀 없음 |
| 방향 | 판을 없애고 **"로고 + 작은 메뉴 창"** 구도로 바꿔 배경 그림을 살린다. 로고 글자는 **이미지(워드마크)로 재생성**, 메뉴는 슬림한 행 + 공 커서, 나머지는 CSS 효과 |
| 새 이미지 | **2장**: 로고 워드마크 1장(`ui-title-logo`, 글자 검수 필요) + 메뉴 킷 시트 1장(`ui-title-kit`, 8칸) |
| 이미지 없이 먼저 가능한 것 | 레이아웃 변경·비네트·엠블럼 후광/둥실·골드 CSS 글자·행 선택 표시·키캡 힌트·등장 애니메이션 (**Phase A**) |
| 폴백 | 새 이미지가 없으면 지금처럼 CSS 글자·기존 프레임으로 그려진다(이 프로젝트의 "이미지는 선택 사항" 규칙, [01 §8](01-concept-and-architecture.md)) |

## 1. 현재 화면 진단

코드: [`TitleScreen.tsx`](../../src/web/world/ui/TitleScreen.tsx), [`world.css`](../../src/web/world/world.css) `.world-title*`·`.world-btn*`, [`buttonProps.ts`](../../src/web/world/ui/buttonProps.ts).

| # | 문제 | 원인 |
| --- | --- | --- |
| 1 | 키아트가 거의 안 보이고 화면이 답답함 | `.world-title__panel--art`가 엠블럼·로고·버튼·힌트를 전부 한 판에 담아 **논리 360px 중 약 320px**을 채움. 판 안쪽은 `title-frame`이 불투명(`#052720`)으로 칠해 뒤가 안 비침 |
| 2 | 판 안이 밋밋하고 위계가 없음 | 안쪽이 평면 단색. 엠블럼도 그냥 놓여 있음(후광·빛 없음) |
| 3 | 로고 글자가 예쁘지 않음 | 진녹색(`#0e5a34`) 글자 + 흰 외곽선 8방향 text-shadow. 어두운 판 위에서 흰 스티커처럼 떠 있고 금/민트 프레임과 색이 이어지지 않음. 입체감·광택 없음 |
| 4 | 버튼 장식이 늘어져 보임 | `btn-*`는 96×28에 slice 8인데 잎·보석 장식이 약 20px라, 168px로 늘리면 장식 안쪽이 가로로 약 1.9배 늘어남 |
| 5 | 선택(커서)과 강조(primary)가 섞임 | "이어하기"는 항상 밝은 민트 primary, ↓로 옮기면 다음 버튼이 hover 그림으로 바뀜 → **밝은 버튼이 동시에 두 개**. 이미 있는 `cursor.webp`(공 커서)를 안 씀 |
| 6 | 글자가 가늘고 힌트가 약함 | 12px Galmuri 흰 글자에 그림자·자간 없음. 힌트는 일반 텍스트(프로젝트에 이미 있는 `.world-key` 키캡을 안 씀) |
| 7 | 정적임 | 등장·대기 애니메이션 없음 |

## 2. 목표 화면 (논리 640×360)

```text
   ┌──────────────── 키아트 + 비네트(가장자리 어둡게) ────────────────┐
   │                                                                 │
   │                 ✦    (엠블럼 80px, 둥실 + 후광 광선)   ✦          │   y  14
   │                      ⚜ 잔 디 동   월 드 ⚜                       │   y  90  ← 이미지 워드마크(약 260×65)
   │                ─────────── ◆ ───────────                        │   y 162  ← title-divider
   │               ╔═════════════════════════╗                       │
   │               ║ ⚽  이 어 하 기           ║  ← 선택 행(금/민트 테두리, 공 커서)   y 180
   │               ║    새 로  시 작           ║                       │
   │               ║    나 가 기               ║                       │
   │               ╚═════════════════════════╝  (창 208폭, 반투명)    │   ~ y 312
   │              [↑↓] 선택  [Enter] 확인  [Esc] 나가기                │   y 322  ← .world-key 키캡
   └─────────────────────────────────────────────────────────────────┘
```

- **판 제거**: 엠블럼과 로고는 배경 위에 그대로 떠 있고, 메뉴 행만 작은 창에 담는다. 저장이 없으면 행이 2개라 창이 짧아지고 전체를 세로 가운데에 둔다.
- **읽힘 확보**: 배경 위에 `radial-gradient` 비네트 + 아래쪽 어두운 그라데이션을 깔아 로고·창이 밝은 키아트(엔딩 후 `loading-bg` 재사용 시)에서도 읽히게 한다.
- **엔딩 후(`world-title--restored`)** 화면도 같은 구도. 밝은 배경에서도 워드마크 외곽선(진한 청록)이 충분히 분리되는지 확인한다.

## 3. 구현 단계

### Phase A — 이미지 없이 지금 가능 (기존 에셋 재사용)

| # | 작업 | 내용 | 파일 |
| --- | --- | --- | --- |
| A1 ✅ | 판 제거 → 스택 레이아웃 | `.world-title__panel` 대신 `.world-title__stack`(세로 flex, 가운데). 메뉴만 `.world-title__window`로 감싼다. `title-frame`(slice 24)을 재사용. 처음엔 안쪽 반투명을 계획했으나, slice 24 안에 밴드 바깥 평면(약 16px)이 이미 들어 있어 반투명 안쪽과 **이음매가 생기므로 `fill`(불투명)을 유지**했다. 판이 메뉴 행만 감싸는 작은 창이 되어 키아트를 가리는 문제는 해결된다 | `TitleScreen.tsx`, `world.css` |
| A2 ✅ | 비네트 | `.world-title::before`에 `radial-gradient(ellipse at 50% 42%, rgba(2,10,7,.10) 0 28%, rgba(2,10,7,.72) 100%)` + 하단 그라데이션(`pointer-events:none`) | `world.css` |
| A3 ✅ | 엠블럼 연출 | 80px로 줄이고 기존 `@keyframes world-bob`(−3px)을 `2.4s ease-in-out infinite alternate`로 재사용. 뒤에 `repeating-conic-gradient(rgba(255,231,140,.18) 0 6deg, transparent 6deg 24deg)`를 `radial-gradient` 마스크로 둥글게 자른 **광선 원반**을 40s로 천천히 회전, 그 위에 민트 `radial-gradient` 후광 | `world.css` |
| A4 ✅ | (이미지 도착 전) CSS 골드 글자 | 워드마크 이미지가 오기 전까지의 폴백이자 항상 남겨 둘 대체 글자. **2겹 구조**: 뒤 레이어 `::before{content:attr(data-text); -webkit-text-stroke:7px #0b3a2a}` + 앞 레이어는 `background:linear-gradient(#fff6c8 0 42%,#ffd54a 42% 68%,#e0a21a 68%)` + `background-clip:text`. 앞 레이어에 `text-shadow`를 주면 그림자가 배경 위로 그려져 망가지므로 **그림자는 wrapper의 `filter: drop-shadow(0 3px 0 #06231a)`로**. 4초마다 지나가는 광택(`background-position` 스윕) 추가 | `TitleScreen.tsx`, `world.css` |
| A5 ✅ | 메뉴 행 | `world-btn` 대신 `.world-title__row`(176×28). 기존 `choice-normal`/`choice-selected`(126×32·114×32, 9-slice)를 배경으로 쓰고 `cursor.webp`(24px 공)를 선택 행 왼쪽에 놓는다. **선택 = `:focus`** 하나로만 표시(hover는 `onMouseEnter → focus()`로 같은 상태에 합류 → 밝은 행이 항상 1개). primary/secondary 구분은 **없앤다**(선택 표시만 남김). 글자 13px, `letter-spacing: 2px`, 보통 `#cfeee2`, 선택 `#fff1b5` + `text-shadow: 0 1px 0 #0b1614, 0 0 6px rgba(255,213,74,.55)`. 공 커서는 `translateX(0→3px)` `steps(2)`로 살짝 흔들기 | `TitleScreen.tsx`, `world.css` |
| A6 ✅ | 위험 확인 상태 | "새로 시작"을 누르면 라벨이 "저장이 지워져요. 정말?"로 바뀌는데, 이때 행을 산호색(`#ff7a6b`) 테두리로 바꾸고 3스텝 좌우 흔들림(±2px)을 한 번 준다 | `TitleScreen.tsx`, `world.css` |
| A7 ✅ | 힌트 키캡 | `<kbd className="world-key">↑↓</kbd> 선택 · <kbd …>Enter</kbd> 확인 · <kbd …>Esc</kbd> 나가기` — 기존 `.world-key`(코치마크 키캡, `world-ui.css`) 재사용. 색은 `#b8ffe8` → 대비 확보 | `TitleScreen.tsx` |
| A8 ✅ | 등장 애니메이션 | 진입 시 엠블럼 페이드·하강 → 로고 스케일 팝(0.9→1, 0.35s) → 메뉴 행 3개가 60ms 간격으로 아래에서 슬라이드 인. `@media (prefers-reduced-motion: reduce)`에서는 전부 끔(정적 표시). 기존 `world-mission.css`의 reduced-motion 처리 방식을 따른다 | `world.css` |
| A9 ✅ | 반짝임 | 엠블럼 주변 3곳에 CSS 다이아몬드(회전한 정사각형 + `box-shadow`)가 `steps(2)`로 깜빡. 이미지가 오면 Phase B3의 `title-sparkle`로 교체 | `world.css` |

Phase A만으로도 판 제거·글자·행·힌트·움직임이 모두 바뀌므로 이미지 생성과 **병행** 가능하다.

**구현 메모 (위 표와 실제 값이 다른 곳)**: 메뉴 행은 `choice-*` 프레임 높이에 맞춰 **184×32**, CSS 글자는 30px에 **진청록 9px + 크림 4px 2겹 외곽선**, 반짝임은 다이아몬드 대신 `clip-path` 4점 별, 워드마크 이미지 표시 폭은 **232px**(세로 여유 때문에 260에서 줄임), 위험 확인 라벨은 행 폭에 맞춰 11px로 줄어든다. 새 이미지 없이 배포해도 화면이 정상이며(폴백), `ui/title-logo.webp`가 생기면 코드 수정 없이 CSS 글자 대신 자동으로 쓰인다. 눈으로 확인하는 것(§7)은 아직 안 했다.

### Phase B — 새 이미지 연결

| # | 작업 | 내용 |
| --- | --- | --- |
| B1 ✅ | 워드마크 | `ui/title-logo`가 있으면 `<img class="world-title__logo-img">`(alt "잔디동 월드", 표시 폭 260)로 그리고 없으면 A4의 CSS 글자. `<h1>`은 유지하고 글자는 시각적으로 숨김(`.world-sr-only`)이 아니라 **img의 alt**로 접근성을 확보 |
| B2 ✅ | 메뉴 킷 | `title-window`(slice 14, fill 없이 CSS 반투명), `title-row-normal/selected/pressed`(slice 9) 적용. 이미지가 없으면 A1·A5의 기존 프레임 재사용으로 폴백 |
| B3 ✅ | 구분선·파티클 | `title-divider`(160×12, 로고와 메뉴 사이), `title-leaf`·`title-sparkle`·`title-firefly`를 CSS 파티클로 배치: 잎 4~5개가 천천히 떨어지며 흔들림(같은 스프라이트를 좌우 반전·회전·크기 변화로 재사용), 반딧불 6개가 위아래로 떠다니며 깜빡 |
| B4 ✅ | 프리로드 | `worldAssets.ts`의 `BOOT_KEYS`에 `ui/title-logo`, `ui/title-window`, `ui/title-row-normal`, `ui/title-row-selected`, `ui/title-row-pressed`, `ui/title-divider` 추가(타이틀에서 바로 보이므로 로딩 화면에서 미리 받는다). 파티클 3종은 필수가 아니므로 제외 |
| B5 | 죽은 코드 정리 | 타이틀에서 `buttonProps`를 더는 안 쓰게 되어도 캐릭터 선택·일시정지 메뉴가 계속 쓰므로 **`buttonProps.ts`·`btn-*`는 그대로 둔다**. `.world-title__panel*`·`.world-title__emblem--fallback` 정리만 한다 |

**Phase B 구현 메모**
- **원본 → 변환**: `ui-title-logo.png`(트림 후 1821×464, 비율 3.9:1)는 `ui/title-logo.webp` **480×123**, 화면에는 **240폭 = 정확히 절반**으로 그린다(엠블럼과 같은 2배 슈퍼샘플). `ui-title-kit.png`는 8칸 모두 마젠타 없이 변환됐고 QA 경고 0. 크기: window 95×64, row 127/122/120×28, divider 160×24, leaf·sparkle 24×24, firefly 12×12.
- **슬라이스**: `title-window` **15**(모서리 1:1, 판 테두리 15px), `title-row-*` **위아래 10 · 좌우 16**(끝의 금 다이아가 좌우 슬라이스 안에 들어감). 매니페스트의 `slice` 값은 QA용(작은 쪽 9)이고 실제 CSS 값은 `world.css`의 `.world-title__menu--kit`·`.world-title__window--kit`.
- **폴백 단계**: `title-row-*` 3장이 **모두** 있으면 킷 행, 아니면 `choice-*` 프레임, 그것도 없으면 CSS 상자. 창은 `title-window` → `title-frame` → CSS 상자 순.
- **선택 행 너비**: 선택된 행의 판만 좌우 5px씩(총 10px) 넓어진다(`.world-title__row:focus::before { inset: 0 -5px }`). 처음 6px로 했다가 4px 더 늘렸고, 창 좌우 안쪽 여백(6px) 안에서 커진다.
- **파티클**: 잎(12/24px 두 가지, 정수 배율)이 6장 위에서 아래로 천천히 떨어지고(reduced-motion에서는 숨김), 별·반딧불은 스프라이트가 있으면 CSS 도형 대신 스프라이트를 쓴다.
- **공 커서 수직 정렬**: `cursor.webp`는 24px 칸에서 공이 아래쪽(9~23행, 중심 16)에 치우쳐 그려져 있어, 커서 박스를 행 중앙선보다 **4px 위**(`margin-top: -16px`)에 두고 24px 원본 크기(정수 배율)로 그린다.
- 크레딧의 "월드 전용 변환 에셋 N개"(`WorldCredits.tsx`)는 손으로 관리하는 수치라 이번에 늘어난 9개를 반영하지 않았다.

### Phase C — 선택 사항 (효과 대비 작업량 큼)

- **소리 ✅ (구현됨)**: `TitleScreen`에 `audio` 프롭을 받아 ↑↓·마우스 hover에 `ui-move`, 이어하기/새로 시작에 `ui-select`, 나가기에 `ui-cancel`([`PauseMenu.tsx`](../../src/web/world/ui/PauseMenu.tsx)와 같은 SFX). 타이틀은 FAB를 누른 뒤에 뜨므로 자동재생 차단 문제는 없을 것으로 본다. `WorldOverlay.tsx:848` 호출부에 `audio`를 넘기는 배선 필요.
- **저장 요약**: "이어하기" 아래 작은 글씨로 진행도(예: 잔디 조각 n/10). `savedGame`이 이미 `WorldOverlay`에 있으니 요약 문자열만 프롭으로 넘기면 된다. 필드 이름은 `storage.ts`/`types.ts`에서 확인 후 결정.
- **엠블럼 빛 스윕**: 엠블럼 위를 가끔 지나가는 흰 광택(`mask-image`로 실루엣에 맞춤).

## 4. 이미지 생성 요청서

> 생성 위치·흐름은 기존 방식과 같다: 원본을 `tmp/world-src/ui/`에 아래 **파일명 그대로** 저장 → `pnpm convert:world-art -- ui <이름>` → `src/web/assets/world/ui/`에 WebP가 생기면 코드가 자동으로 집는다([`worldAssets.ts`](../../src/web/world/worldAssets.ts)의 `import.meta.glob`). 배경은 **투명 또는 #FF00FF**(변환기가 마젠타를 자동 제거, [`convert-world-art.mjs`](../../scripts/convert-world-art.mjs) `--tolerance`).

| # | 저장 파일 | 캔버스 | 최종 에셋(px) | 우선순위 | 첨부 레퍼런스 |
| --- | --- | --- | --- | --- | --- |
| ① | `ui-title-logo.png` | 1536×1024 | `ui/title-logo.webp` (약 520×130, 2배 슈퍼샘플, 표시 260폭) | **P0** | 현재 로고 글자 캡처(§4-1), `ui-logo-emblem.png` |
| ② | `ui-title-kit.png` | 1536×1024 (4×2, 칸당 384×512) | `title-window`·`title-row-*`·`title-divider`·`title-leaf`·`title-sparkle`·`title-firefly` 8개 | P0 (행·창) / P1 (파티클) | `ui-title-frame.png`, `ui-frames-dialog.png`, `ui-logo-emblem.png` |

**스레드 운영**: 새 채팅 하나를 열고 아래 **공통 머리말**을 첫 메시지로 붙여넣는다. ①②는 같은 스레드에서 이어서 만들어 톤을 맞춘다. 각 프롬프트마다 레퍼런스를 **다시 첨부**한다([04 §1](04-art-characters.md#1-스타일-바이블-모든-이미지-공통)의 규칙과 같음).

```text
You will create UI art for a 2D pixel-art RPG title screen. Follow these rules for EVERY image in this conversation:
- Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG UI, chunky clearly visible pixel blocks, crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step shading, no anti-aliasing blur, no photo texture, no 3D-render look, no painterly strokes.
- Design language: dark teal panels (#052720 / #0b1614) with mint (#00e9ae) pixel trim, warm gold accents (#ffd54a), small leaf-shaped ornaments, cheerful and inviting; identity of the football club "잔디동" (mint and white, a sprouting-seedling shield). Match the attached title frame and logo emblem.
- Backgrounds: flat #FF00FF magenta (or transparent). Never let any glow, halo or shadow spill outside the drawn shapes; glows must stay inside the shape.
- Never render text, letters or numbers unless the prompt explicitly asks for specific text. No watermark or signature.
```

### 4-1. ① 로고 워드마크 `ui-title-logo.png` (글자 포함)

AI가 한글을 틀리게 그리는 일이 흔하다. 그래서 **글자 모양 레퍼런스를 함께 첨부**하고, **후보를 여러 장 뽑아 글자가 완전히 맞는 것만** 쓴다. 끝까지 안 맞으면 §4-1-C의 글자 없는 판 + CSS 글자(A4)로 간다.

**레퍼런스 첨부**
- **필수(글자 모양)**: 현재 타이틀 화면에서 "잔디동 월드" 글자만 캡처(또는 흰 배경에 같은 글꼴로 적은 이미지). AI가 자음·모음 구조를 그대로 따라 그리도록 "이 글자를 다시 스타일링하라"고 요청하는 용도.
- **선택(색·톤)**: `tmp/world-src/ui/ui-logo-emblem.png` — 엠블럼의 초록·금색과 어울리게.

**검수 체크 (모두 통과해야 채택)**
- [ ] 글자가 정확히 **잔 · 디 · 동 (띄어쓰기) 월 · 드** 5음절 — 받침(잔의 ㄴ, 동의 ㅇ, 월의 ㄹ)과 모음(ㅏ ㅣ ㅗ ㅝ ㅡ)이 빠지거나 바뀌지 않았는가
- [ ] 글자 외 다른 글자·숫자·영문·로고 없음, 다섯 글자가 같은 높이·같은 기준선
- [ ] 엠블럼(방패)·공은 그리지 않음(엠블럼은 기존 이미지를 따로 씀)
- [ ] 배경이 마젠타/투명이고 외곽선 밖으로 번지는 빛 없음
- [ ] 어두운 배경과 밝은 배경(엔딩 후 `loading-bg`) 양쪽에서 글자가 분리되어 읽히는가
- [ ] 글자 획이 32px 크기(표시 폭 260 기준 한 글자 약 45px)로 줄여도 뭉개지지 않는가

**A안 — 잔디 그린 + 골드 (추천)**

```text
Attached is a reference image showing the exact Korean text "잔디동 월드". Redraw exactly this text as a game logotype: use the reference only for the letter shapes and stroke structure, and restyle it.
Draw the title wordmark for a pixel-art football-club RPG, centred on a flat #FF00FF background, the wordmark filling about 80% of the canvas width. The text is exactly five Korean Hangul syllables 잔, 디, 동, 월, 드 in this order, with a small gap between 동 and 월 (two words: "잔디동" and "월드"). Do not add, remove, or change any syllable, and no other text of any kind.
Style: chunky, bold, slightly rounded pixel-art Hangul letters, all the same height on one baseline. Letter face: a fresh grass-green vertical gradient (light #9df06a at the top to #2fae4e at the bottom) with a bright 1-pixel highlight along the top edge of every stroke. Around each letter: a thick clean cream-white (#fffbe6) inner outline, then a thick dark-teal (#0b3a2a) outer outline, then a chunky 3-pixel dark-teal extruded edge below the letters for a solid block look. Add a few tiny gold (#ffd54a) four-point sparkles near the letters, and one tiny two-leaf seedling growing from the top of the syllable 동 (small, never covering the letter). Tiny grass tufts along the bottom of the outline are allowed.
No ribbon, no shield, no football, no scenery, no background, no English letters, no numbers, no watermark. Crisp pixel edges, no blur, no glow outside the outline.
```

**B안 — 민트 화이트 + 리본 플레이트 (A가 안 맞을 때)**

```text
Attached is a reference image showing the exact Korean text "잔디동 월드". Redraw exactly this text as a game logotype: use the reference only for the letter shapes and stroke structure, and restyle it.
Draw the title wordmark for a pixel-art football-club RPG, centred on a flat #FF00FF background, filling about 85% of the canvas width. The text is exactly five Korean Hangul syllables 잔, 디, 동, 월, 드 in this order, with a small gap between 동 and 월. Do not add, remove, or change any syllable, and no other text of any kind.
Style: the letters sit on a wide dark-teal (#052720) ceremonial ribbon banner with gold (#ffd54a) trim on the top and bottom edges, swallow-tail ends in mint (#00e9ae), and small leaf ornaments where the tails meet the plate. Letters: chunky bold pixel-art Hangul, cream-white (#fffbe6) face with mint (#00e9ae) shading on the lower half of each stroke, a bright highlight along the top edges, and a dark-teal (#0b3a2a) outline, all on one baseline and the same height. A few tiny gold four-point sparkles around the ribbon.
No shield, no football, no scenery, no English letters, no numbers, no watermark. Crisp pixel edges, no blur, no glow outside the drawn shapes.
```

**수정 요청 (글자가 조금 틀렸을 때)**: `Keep everything exactly, but fix the third syllable so it reads exactly 동 (consonant ㄷ, vowel ㅗ, final consonant ㅇ). Do not change anything else.` 처럼 **틀린 음절 하나만 지정**해서 고친다. 전체 재생성보다 스타일이 유지된다. 같은 수정을 3번 해도 안 되면 후보를 새로 뽑는다.

**4-1-C. 폴백(글자 없는 판)**: 끝까지 글자가 안 맞으면 B안 프롬프트의 글자 문단을 `The plate area in the middle is completely EMPTY (no letters, no symbols) because text is added by code.`로 바꿔 리본 판만 만든다(`ui-title-ribbon.png`). 이 경우 변환은 `ui/title-ribbon`(200×52, slice `14 48`)로 추가하고 CSS 골드 글자(A4)를 그 위에 얹는다.

- **변환**: `pnpm convert:world-art -- ui title-logo`
- **추가할 매니페스트**([`scripts/world-art-manifest.json`](../../scripts/world-art-manifest.json) `ui.singles`): `"title-logo": { "src": "ui-title-logo", "w": 520, "h": 130, "mode": "trim" }` — 비율이 다르면 트림 후 상자에 맞춰지므로 표시 폭 260에 맞게 `w`만 조정하고 CSS 폭도 같이 고친다.

### 4-2. ② 메뉴 킷 시트 `ui-title-kit.png`

칸 순서(왼→오, 위→아래): 1) `title-window` 2) `title-row-normal` 3) `title-row-selected` 4) `title-row-pressed` 5) `title-divider` 6) `title-leaf` 7) `title-sparkle` 8) `title-firefly`.

**레퍼런스 첨부**: `ui-title-frame.png`(창 프레임의 톤·모서리), `ui-frames-dialog.png`(선택지 행의 형태), `ui-logo-emblem.png`(색). 시트 프롬프트 앞에 "공통 머리말"이 스레드에 이미 있다고 가정한다.

```text
Using the attached title frame, dialogue choice bars and logo emblem as style references, create a title-screen menu UI kit on one 1536x1024 canvas: a strict grid of 4 columns x 2 rows (8 cells, each 384x512), exactly one element per cell, centred, on a flat #FF00FF background, no cell borders or grid lines, at least 10% empty margin inside each cell, no text or letters anywhere. Elements 1 to 5 must be perfectly symmetrical left-right with plain, straight, repeating edges so they can be stretched horizontally as 9-slice frames.
Elements in order (left to right, top to bottom):
1) menu window frame: a wide rectangle (about 3:2), thin ornate border with a mint (#00e9ae) outer trim and an inner gold (#ffd54a) hairline, a small leaf ornament and a tiny gold gem at each of the four corners kept compact (corner ornaments no larger than 12% of the width), completely plain straight edges with NO gem or ornament in the middle of any edge, and a flat calm dark-teal (#052720) interior that is empty,
2) menu row normal: a slim wide bar, about 4.5:1, a dark-teal (#0b1614) plate with a dim mint (#0f7f66) 1-pixel outline, no ornaments except tiny corner notches, understated, the centre EMPTY,
3) menu row selected: exactly the same shape and size as 2, but with a bright mint (#00e9ae) double outline, a gold (#ffd54a) inner hairline, a brighter teal (#0d3b33) fill with a lighter highlight along the top edge, and a small gold diamond at the vertical centre of each end; any glow stays inside the bar,
4) menu row pressed: exactly the same shape and size as 3, but darker (#082a24 fill), the highlight flattened and a soft shadow along the inside top edge, as if pushed down,
5) divider: a thin horizontal ornamental divider, about 12:1, a gold (#ffd54a) hairline with a small mint (#00e9ae) gem exactly at the centre and tiny leaf tips at both ends,
6) falling leaf: a single bright mint-green leaf sprite with a light vein, slightly curled, tilted about 25 degrees, isolated, about 25% of the cell size,
7) sparkle: a single four-point star sparkle, cream-white (#fffbe0) core with gold (#ffd54a) rays, symmetrical, pixel-stepped, about 25% of the cell size,
8) firefly: a single small glowing yellow-green (#d6ff6a) dot with a one-step lighter halo ring inside a 24-pixel-wide shape, about 15% of the cell size.
No text anywhere. Crisp pixel outlines, no blur, no glow outside the drawn shapes.
```

- **변환**: `pnpm convert:world-art -- ui title-kit`
- **추가할 매니페스트**(`ui.sheets`, `buttons`·`select-cards`와 같은 형식):

```json
"title-kit": {
  "grid": [4, 2],
  "slots": [
    ["title-window", 96, 64, { "slice": 14 }],
    ["title-row-normal", 128, 28, { "slice": 9, "symmetry": "lr" }],
    ["title-row-selected", 128, 28, { "slice": 9, "symmetry": "lr" }],
    ["title-row-pressed", 128, 28, { "slice": 9, "symmetry": "lr" }],
    ["title-divider", 160, 12, { "symmetry": "lr" }],
    ["title-leaf", 16, 16],
    ["title-sparkle", 16, 16],
    ["title-firefly", 12, 12]
  ]
}
```

- **변환 후 확인할 것**: 실제 변환본 크기는 원본 비율을 따라 위 표와 다를 수 있다([06 §3](06-art-ui.md#3-프레임-시트-a--대사선택토스트-ui-frames-dialog)의 "S2에서 확인한 변환본 실제 크기"처럼). 확대해서 모서리 장식 크기를 눈으로 재고 slice를 확정한다. 창 안쪽은 CSS가 채우므로 AI가 그린 안쪽은 무시된다.
- **검수 체크**: 행 3장(normal/selected/pressed)의 **실루엣이 같아야** 한다(다르면 선택할 때 글자가 흔들려 보임) · 창 가장자리 중앙에 보석이 없음(가로로 늘어남) · 선택 행이 normal보다 확실히 밝고 금색이 도는지 · 시트에 글자가 없음.

## 5. 변경 파일 요약

| 파일 | 변경 |
| --- | --- |
| [`ui/TitleScreen.tsx`](../../src/web/world/ui/TitleScreen.tsx) | (구현됨 · `audio` 프롭 추가, `WorldOverlay.tsx` 호출부도 수정, `worldUi.test.tsx`에 TitleScreen 렌더 테스트 추가. 워드마크 `ui/title-logo`는 있으면 자동 사용) 스택 레이아웃·워드마크 `<img>`/CSS 글자 폴백·행 컴포넌트·`onMouseEnter → focus()`·위험 확인 클래스·키캡 힌트 |
| [`world.css`](../../src/web/world/world.css) | `.world-title__*` 재작성(비네트·후광·글자·행·창·파티클·애니메이션·reduced-motion). `.world-btn*`는 다른 화면이 쓰므로 유지 |
| [`worldAssets.ts`](../../src/web/world/worldAssets.ts) | `BOOT_KEYS`에 새 UI 키 추가(Phase B4) |
| [`scripts/world-art-manifest.json`](../../scripts/world-art-manifest.json) | `title-logo` 단일 + `title-kit` 시트 추가 |
| [`worldUi.test.tsx`](../../src/web/world/ui/worldUi.test.tsx) | 타이틀 테스트가 버튼 이름("이어하기" 등)·↑↓ 포커스 이동에 의존하므로 행 컴포넌트 전환 후에도 통과하는지 확인·보강 |
| [`06-art-ui.md`](06-art-ui.md) §8, [`09-asset-checklist.md`](09-asset-checklist.md) | 타이틀 조립 참고와 에셋 체크리스트 갱신(구현 후) |

## 6. 접근성·폴백

- 키보드: 지금처럼 ↑↓로 포커스 이동, Enter 실행, Esc 나가기는 그대로. 마우스 hover가 포커스를 옮기므로 "선택된 행"은 항상 하나.
- 메뉴는 `<button>` 유지(스크린리더·포커스 링). 포커스 링(`box-shadow: 0 0 0 2px #ffd54a`)은 선택 행 스타일과 겹치지 않게 조정.
- 워드마크 이미지에는 `alt="잔디동 월드"`. 이미지가 없으면 `<h1>` 텍스트가 그대로 보인다.
- 모션은 `prefers-reduced-motion: reduce`에서 등장·둥실·회전·파티클·광택을 전부 끄고 정적 표시.
- 새 이미지가 하나도 없어도 화면은 정상: 창은 `title-frame`, 행은 `choice-*`, 글자는 CSS 골드 글자로 그려진다.

## 7. 확인 체크리스트 (구현 후)

1. 타이틀에서 배경 키아트가 좌우로 넓게 보이고 로고·메뉴가 비네트 위에서 잘 읽힌다(저장 있음/없음 둘 다).
2. ↑↓/마우스 hover 모두 "밝은 행"이 하나만 켜지고 공 커서가 그 행에 붙는다. Enter로 이어하기/새로 시작(저장 있으면 한 번 더 확인·산호색)/나가기가 동작한다.
3. 엔딩 후(`ending-seen`) 밝은 배경에서도 워드마크·창이 분리되어 읽힌다.
4. 워드마크 글자가 정확히 "잔디동 월드"다(§4-1 검수 체크).
5. 프리로드 후 로딩 화면 → 타이틀 전환 때 새 이미지가 깜빡이며 뒤늦게 나타나지 않는다.
6. `prefers-reduced-motion`에서 움직임이 없다. 640×360 스테이지가 정수 배율(2×~5×)로 확대되어도 픽셀이 뭉개지지 않는다.
7. 캐릭터 선택·일시정지 메뉴의 버튼(`btn-*`)은 변하지 않았다.

## 8. 결정이 필요한 것

| 질문 | 추천 |
| --- | --- |
| 로고 색 방향 ✅ **A안 확정** | **A안(잔디 그린 + 골드)** — 어두운 배경에서 대비가 크고 엠블럼과 색이 이어진다. B안은 리본 판이 들어가 안정적이지만 더 무겁다 |
| 엠블럼과 워드마크를 한 장(락업)으로 만들지 | **따로**(추천) — 엠블럼만 둥실·후광 애니메이션을 줄 수 있고, 글자가 틀렸을 때 워드마크만 다시 뽑으면 된다 |
| Phase C(소리·저장 요약)를 이번에 넣을지 | 소리는 넣는 것을 추천(작업량 작고 체감 큼), 저장 요약은 나중에 |
