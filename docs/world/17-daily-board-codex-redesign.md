# 17. 일일 게시판·도감 개선안 — 게임 UI로 다시 만들기

광장 **일일 게시판**(스탬프)과 **잔디동 도감** 모달을 미션 로그처럼 **월드 안 UI**로 다시 만든 기록이자 **추가 이미지 생성 요청서**다. 상태: **코드 구현 완료(2026-09-21), 새 이미지 3장 변환·연결 완료, 화면 확인은 배포 후**. 새 이미지는 선택 사항이라 없어도 지금 있는 에셋과 CSS로 화면이 정상이다. 스타일 바이블은 [04 §1](04-art-characters.md#1-스타일-바이블-모든-이미지-공통), UI 규격은 [06 §0](06-art-ui.md#0-ui-규격), 같은 방식으로 만든 [16 타이틀 개선안](16-title-menu-redesign.md)을 따른다.

## 0. 한눈에 보기

| 항목 | 내용 |
| --- | --- |
| 핵심 문제 | ① 완료/미완료가 글자("완료 · ")만 다르고 **모양이 같아** 구분이 안 됨 ② 실제 픽셀 크기의 웹 카드 UI라 **게임 화면과 따로 놂**(스테이지 밖, 24px 제목·둥근 사각형) ③ 30일 스탬프가 숫자 칸, 도감은 글 목록이라 **수집하는 맛이 없음** |
| 방향 | 두 모달을 미션 로그처럼 **스테이지(논리 640×360) 안**에서 그린다. 기존 9‑slice 프레임(`panel-frame`·`panel-parchment`·`stamp-card`·`tab-*`·`card-*`)과 스탬프·뱃지·아이콘 에셋을 그대로 쓴다 |
| 새 이미지 | **3장(모두 선택)**: `ui-extras`(뱃지 4 + 아이콘 2, 빈 칸 메우기), `ui-daily-kit`(게시판 조각 6), `ui-codex-kit`(도감 조각 8) |
| 폴백 | 새 이미지가 없으면 뱃지는 별 무늬 원판, 아이콘은 시계·반짝임 아이콘, 나머지는 CSS 상자로 그려진다. 파일이 생기면 **코드 수정 없이** 자동으로 쓴다(`import.meta.glob`) |

## 1. 진단 (이전 화면)

코드: 옛 `ui/RepeatContent.tsx`·`RepeatPanel.tsx`·`repeat-content.css`. 러시 미니게임(`GrassRushModal`)이 `RepeatPanel`을 계속 쓰므로 그 파일들은 남았고, 게시판·도감만 새 컴포넌트로 옮겼다.

| # | 문제 | 원인 |
| --- | --- | --- |
| 1 | 완료·미완료가 안 구분됨 | 두 상태 모두 같은 테두리·배경의 `<li>`, 글자 앞에 "완료 · "/"진행 · "만 붙음 |
| 2 | 게임 UI 같지 않음 | 스테이지 **밖**(`WorldModals`)에서 실제 픽셀로 그려 24px 굵은 제목, 둥근 웹 버튼, 브라우저 스크롤. 미션 로그·메뉴와 색·프레임이 다름 |
| 3 | 30일 스탬프가 숫자 상자 | `stamp-card`·`stamp-mark`가 만들어져 있었는데(06 §4) 연결 안 됨 |
| 4 | 도감이 긴 글 목록 | 최고 기록·황금 공 20개·카드 11장·뱃지가 한 화면에 이어 붙음. 아이콘·초상·뱃지 그림 미사용 |
| 5 | 뱃지 16개 중 그림 연결은 6개뿐 | `BADGES[].icon`이 6개에만 있고, 획득 조건 설명이 없음 |

## 2. 구현 결과

### 2-1. 일일 게시판 (`ui/DailyBoard.tsx`)

- 바깥 틀 `panel-frame`(메뉴와 같은 어두운 틀) 528×324 안에 **오늘의 훈련 카드**(왼쪽)와 **스탬프 카드**(오른쪽, 6×5=30칸) 두 장, 아래 줄에 **7/14/30일 뱃지 3개 + 누적 일수 + 스탬프 받기 버튼**.
- 두 카드 모두 `stamp-card` 프레임. 프레임에 원 24개가 구워져 있어 늘리면 비쳐 보이므로 **안쪽을 종이색(#fef0d0) 시트로 덮고** 그 위에 내용을 올린다. `board-paper`는 위쪽 가운데 핀이 9‑slice에서 가로로 2.5배 늘어나 쓰지 않았다.
- **완료/미완료 구분**(핵심)

  | | 미완료 | 완료 |
  | --- | --- | --- |
  | 판 | 크림 + 노란 테두리·왼쪽 노란 띠 | **초록** 판 + 초록 테두리·띠 |
  | 글자 | 진한 갈색 | 옅은 초록 + **취소선**, 아이콘은 흐리게 |
  | 오른쪽 | **빈 원 + "진행"**(또는 "1/3") | **체크 뱃지 + "완료"** |

  세는 유형(대화 n명, 카드 n장, 서로 다른 게임 n종)은 "1/3"처럼 진행도를 보여 준다(`state/daily.ts` `dailyTaskViews`).
- **스탬프 카드**: 받은 칸은 `stamp-mark`, 오늘 찍을 칸은 노란 테두리로 깜빡, 7·14·30일 칸은 금별. 방금 받으면 도장이 **꽝 찍히며** `sparkle-ring`이 퍼진다.
- 머리글에 **KST 자정까지 남은 시간**(1초 갱신, `msUntilDailyReset`). 엔딩 전에는 왼쪽 카드에 자물쇠 덮개.
- 조작: **E/Enter/Space**=스탬프 받기(길게 눌러도 한 번, 아직 못 받으면 오류음), **Esc**·바깥 클릭·✕=닫기.

### 2-2. 도감 (`ui/CollectionBook.tsx`)

미션 로그와 같은 **양피지 노트**(`panel-parchment`) 540×316, 탭 4개(`tab-*`).

| 탭 | 내용 |
| --- | --- |
| 기록 | 게임 5개 목록(아이콘·최고 기록·등급 칩) + 선택한 게임의 **랭크 사다리 8단**(도달 표시·다음 목표 점수) |
| 황금 공 | 10×2 칸. 획득(금빛)/사용(바랜 색+체크)/미발견(점선+검은 실루엣), 엔딩 후 공은 보라 점. 아래에 선택한 공의 힌트 |
| 카드 | 6×2 칸(멤버 11 + 우왁굳 히든). 캐릭터 선택의 `card-*` 프레임 + 초상, 미공개는 검은 실루엣, 선택은 `card-selected`(좌우 6px 넓게) |
| 뱃지 | 8×2 칸. 획득은 컬러, 미획득은 실루엣. 아래에 **획득 조건**(`BADGES[].hint`) |

조작: **방향키/WASD**=칸 이동, **Q/E·Tab·1~4**=탭 전환, 마우스 호버=선택, **Esc**·바깥 클릭·✕=닫기.

### 2-3. 그 밖의 변경

| 파일 | 변경 |
| --- | --- |
| `WorldOverlay.tsx`·`ui/WorldModals.tsx` | 게시판·도감을 스테이지 안(미션 로그 옆)에서 그림. `WorldModals`는 미니게임·카드 팝업만 담당 |
| `data/missionDefs.ts` | `BadgeDef.hint`(획득 조건) 추가, 뱃지 16개를 도감 순서로 정렬, 아이콘 키 16개 연결 |
| `state/daily.ts`·`state/ranks.ts` | `dailyTaskViews`·`msUntilDailyReset`·`rankTier`·`rankGoal` |
| `ui/missionIcons.ts` | `gameIconKeys`·`dailyTaskIconKeys` |
| `worldAssets.ts` | 두 패널의 프레임 7개를 `WORLD_UI_KEYS`에 추가(처음 열 때 깜빡이지 않게) |
| `scripts/world-art-manifest.json` | `extras`·`daily-kit`·`codex-kit` 시트 추가 |

## 3. 지금 있는 에셋 사용처

| 에셋 | 어디에 |
| --- | --- |
| `ui/panel-frame` | 게시판 바깥 틀 |
| `ui/panel-parchment`, `ui/tab-normal`·`tab-active` | 도감 노트와 탭 |
| `ui/stamp-card` | 게시판 두 카드의 프레임 |
| `ui/stamp-mark`, `ui/sparkle-ring`, `ui/check-badge`, `ui/mi-locked`, `ui/mn-close` | 도장, 찍는 순간 반짝임, 완료 체크, 자물쇠, 닫기 |
| `ui/btn-primary-*` (disabled 포함) | 스탬프 받기 버튼 |
| `ui/mi-sum10·kickups·freekick·cardmatch·card·talk·collect` | 일일 과제 종류 아이콘, 기록 목록 아이콘 |
| `ui/bd-*` (기존 12개) | 뱃지 12개(`first-game`·`shard-5/10`·`green-thumb`·`weed-buster`·`ball-*`·`card-collector`·`rush-1000`·`daily-7/30`) |
| `ui/card-normal`·`card-selected`·`card-dim`, `portraits/<id>-neutral` | 도감 카드 |
| `props/goldball-1` | 황금 공 칸 |

**그림이 없어 임시로 때우는 곳**: 뱃지 4개(`daily-first`·`daily-14`·`factory-gardener`·`delivery-rookie`)는 별 무늬 원판, 잔디 러시·서로 다른 게임 과제 아이콘은 시계·반짝임 아이콘.

## 4. 이미지 생성 요청서

> 생성 위치·흐름은 [16 §4](16-title-menu-redesign.md#4-이미지-생성-요청서)와 같다: 원본을 `tmp/world-src/ui/`에 아래 **파일명 그대로** 저장 → `pnpm convert:world-art -- ui <시트 이름>` → `src/web/assets/world/ui/`에 WebP가 생기면 코드가 자동으로 집는다. 배경은 **투명 또는 #FF00FF**(변환기가 마젠타 제거). 시트마다 프롬프트에 레퍼런스를 **다시 첨부**한다([04 §1](04-art-characters.md#1-스타일-바이블-모든-이미지-공통)).

| # | 저장 파일 | 캔버스 | 최종 에셋(px) | 우선순위 | 첨부 레퍼런스 | 변환 |
| --- | --- | --- | --- | --- | --- | --- |
| ① | `ui-extras.png` | 1536×1024 (3×2, 칸당 512×512) | `bd-daily-first`·`bd-stamp-14`·`bd-factory-gardener`·`bd-delivery-rookie`(48×48), `mi-rush`·`mi-plays`(32×32) | **P0** (빠진 그림 메우기) | `ui-badges.png`, `ui-icons-mission.png` | `pnpm convert:world-art -- ui extras` |
| ② | `ui-daily-kit.png` | 1536×1024 (3×2, 칸당 512×512) | `daily-task-todo`·`daily-task-done`(144×36, slice 8), `daily-box`(20×20), `daily-slot-empty`·`daily-slot-next`·`daily-slot-bonus`(24×24) | P1 | `ui-frames-panel.png`(stamp-card·stamp-mark 칸), `ui-icons-mission.png` | `pnpm convert:world-art -- ui daily-kit` |
| ③ | `ui-codex-kit.png` | 1536×1024 (4×2, 칸당 384×512) | `codex-ball-found`·`codex-ball-spent`·`codex-ball-unknown`(44×44), `codex-badge-earned`·`codex-badge-locked`(56×56), `codex-gem-on`·`codex-gem-off`(12×12), `codex-card-secret`(72×104, slice 12) | P1 | `ui-select-cards.png`(카드 프레임), `ui-frames-panel.png`, `ui-badges.png` | `pnpm convert:world-art -- ui codex-kit` |

**스레드 운영**: 새 채팅 하나에 아래 **공통 머리말**을 첫 메시지로 붙이고 ①②③을 이어서 만든다(톤이 맞는다). ②③의 조각은 **크림색 종이(#fef0d0)·양피지 위에 얹히므로** 칸 안쪽만 그리고 바깥으로 번지는 빛은 금지한다.

```text
You will create UI art for a 2D pixel-art RPG. Follow these rules for EVERY image in this conversation:
- Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG UI, chunky clearly visible pixel blocks, crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step shading, no anti-aliasing blur, no photo texture, no 3D-render look, no painterly strokes.
- Design language: dark teal panels (#052720 / #0b1614) with mint (#00e9ae) pixel trim, warm gold accents (#ffd54a), small leaf-shaped ornaments, cream parchment (#fef0d0) for paper; cheerful and inviting; identity of the football club "잔디동" (mint and white, a sprouting-seedling shield). Match the attached reference sheets exactly in outline weight, palette and shading.
- Backgrounds: flat #FF00FF magenta (or transparent). Never let any glow, halo or shadow spill outside the drawn shapes; glows must stay inside the shape.
- Never render text, letters or numbers. No watermark or signature.
```

### 4-1. ① `ui-extras.png` — 빠진 뱃지 4개 + 아이콘 2개

**레퍼런스 첨부**: `ui-badges.png`(뱃지 12개: 월계관·별·작은 반짝임 구성과 금/은/청록 링), `ui-icons-mission.png`(둥근 판 위의 굵은 기호).

```text
Using the attached badge sheet and mission icon sheet as exact style references, create one sheet on a 1536x1024 canvas: a strict grid of 3 columns x 2 rows (6 cells, each 512x512), exactly one element per cell, centred, on a flat #FF00FF magenta background, no cell borders or grid lines, at least 12% empty margin inside each cell, no text, letters or numbers anywhere.
Elements 1 to 4 are 48x48-pixel-style achievement badges in exactly the same design as the attached badges (dark round emblem plate, laurel wreath or leaf ring, small four-point gold stars). Elements 5 and 6 are 32x32-pixel-style mission icons in exactly the same design as the attached icons (a simple bold symbol on a small round dark plate with mint rim).
Elements in order (left to right, top to bottom):
1) "first daily training" badge: a clipboard with one big gold star and a green check mark, mint-green laurel ring,
2) "14 daily stamps" badge: a calendar with a green check mark, framed by a two-tone silver-and-gold laurel ring (it sits between the attached silver 7-day badge and the gold 30-day badge, so mix the two metals),
3) "factory gardener" badge: a small factory chimney with green sprouts and two leaves growing out of its top, a little gear behind it, mint-green laurel ring,
4) "delivery rookie" badge: a cardboard parcel with a mint arrow and a tiny leaf on top, mint-green laurel ring,
5) mission icon "runner": a running figure silhouette with three speed lines, on the round plate,
6) mission icon "arcade games": an arcade joystick with three small round buttons, on the round plate.
No text anywhere. Crisp pixel outlines, no blur, no glow outside the drawn shapes.
```

- **검수**: 뱃지 4장이 기존 12개와 링 굵기·별 위치가 같은가 · 14일이 7일(은)과 30일(금) 사이로 읽히는가 · 아이콘 2장이 32px로 줄여도 형태가 읽히는가 · 글자·숫자 없음.
- 코드 자동 반영: `BADGES[*].icon`이 이미 `ui/bd-daily-first`·`ui/bd-stamp-14`·`ui/bd-factory-gardener`·`ui/bd-delivery-rookie`를 가리키고, `ui/mi-rush`·`ui/mi-plays`는 `dailyTaskIconKeys`·`gameIconKeys`가 먼저 시도한다.

### 4-2. ② `ui-daily-kit.png` — 게시판 조각 6개

칸 순서(왼→오, 위→아래): 1) `daily-task-todo` 2) `daily-task-done` 3) `daily-box` 4) `daily-slot-empty` 5) `daily-slot-next` 6) `daily-slot-bonus`.

```text
Using the attached stamp card, stamp mark and mission icons as style references, create a daily-board UI kit on one 1536x1024 canvas: a strict grid of 3 columns x 2 rows (6 cells, each 512x512), exactly one element per cell, centred, on a flat #FF00FF magenta background, no cell borders or grid lines, at least 12% empty margin inside each cell, no text, letters or numbers anywhere. These pieces sit on cream parchment (#fef0d0), so draw them fully inside their own outline.
Elements in order (left to right, top to bottom):
1) task row "open": a slim wide plate, about 4:1, cream (#fff9e8) with a thin amber-gold (#c99a3a) outline and a small amber (#e0a21a) notch at BOTH ends, perfectly symmetrical left-right with plain straight repeating top and bottom edges so it can be stretched horizontally as a 9-slice, the centre EMPTY,
2) task row "done": exactly the same shape and size as 1, but soft green (#cfeebd) with a green (#3f9a5a) outline and green notches at both ends, the centre EMPTY,
3) empty checkbox: a small round box, cream (#fffdf3) with an amber (#c99a3a) ring, nothing inside,
4) stamp slot empty: a round dashed tan (#d3b676) ring, one-pixel dashes, nothing inside,
5) stamp slot next: exactly the same size as 4, but a solid gold (#e0a21a) ring with a soft pale-yellow (#fff3c4) glow kept inside the ring, nothing inside,
6) stamp slot bonus: exactly the same size as 4 with a gold ring and one tiny gold four-point star on its upper right edge, nothing inside.
Elements 4, 5 and 6 must have identical outer diameter and centre. No text anywhere. Crisp pixel outlines, no blur, no glow outside the drawn shapes.
```

- **검수**: 1·2번의 **실루엣이 같고 좌우 대칭**인가(변환 QA 대칭 경고 없음) · 4·5·6번이 같은 지름·같은 중심인가 · 가운데에 아무것도 없는가(글자·번호는 코드가 얹음) · 크림 종이(#fef0d0) 위에 올려도 테두리가 분리되어 읽히는가.
- **slice**: 행 조각은 원본 8px 모서리(표시 6px)로 늘린다(`world.css`가 아니라 `board-codex.css`의 `.world-daily__task--art`). 확대해서 모서리 노치가 slice 안에 들어가는지 눈으로 재고 필요하면 매니페스트 `slice`와 CSS 숫자를 같이 고친다.

### 4-3. ③ `ui-codex-kit.png` — 도감 조각 8개

칸 순서(왼→오, 위→아래): 1) `codex-ball-found` 2) `codex-ball-spent` 3) `codex-ball-unknown` 4) `codex-badge-earned` 5) `codex-badge-locked` 6) `codex-gem-on` 7) `codex-gem-off` 8) `codex-card-secret`.

```text
Using the attached character card frames, panel frames and badges as style references, create a collection-book UI kit on one 1536x1024 canvas: a strict grid of 4 columns x 2 rows (8 cells, each 384x512), exactly one element per cell, centred, on a flat #FF00FF magenta background, no cell borders or grid lines, at least 12% empty margin inside each cell, no text, letters or numbers anywhere. Slots 1 to 5 sit on parchment paper, are perfectly symmetrical and their CENTRES ARE EMPTY (sprites are added by code).
Elements in order (left to right, top to bottom):
1) golden-ball slot "found": a square slot with slightly rounded corners, a warm gold (#d19a00) double rim and a soft cream-yellow (#fff3bc to #f3d36a) interior with a gentle glow kept inside the rim,
2) golden-ball slot "used": exactly the same shape and size as 1, but muted khaki (#a99b62) rim and a flat pale (#e5dcb4) interior, no glow,
3) golden-ball slot "not found": exactly the same shape and size as 1, but a dashed dark-brown rim and a translucent brownish interior, dim,
4) badge slot "earned": a slightly larger rounded-square slot with a gold rim, warm interior and a tiny gold gem at each corner,
5) badge slot "locked": exactly the same shape and size as 4, but a dashed dark-brown rim, a flat dim interior and no gems,
6) rank gem "reached": a tiny gold (#e0a21a) diamond gem with a one-step lighter highlight,
7) rank gem "not reached": the same diamond outline, hollow and empty, in dim tan (#8a7a5a),
8) secret character card frame: exactly the same shape, proportions and border weight as the attached dim character card frame, but with a dark violet-teal rim, gold trim, one small gold keyhole gem at the top centre and an EMPTY interior.
No text anywhere. Crisp pixel outlines, no blur, no glow outside the drawn shapes.
```

- **검수**: 1·2·3이 **같은 실루엣·크기**인가(상태가 바뀔 때 흔들림 없음) · 4·5도 같은가 · 6·7 실루엣 같은가 · 8번이 `card-dim`과 같은 비율·테두리 굵기인가(선택 시 `card-selected` 프레임으로 갈아끼움) · 1~5의 가운데가 비어 있는가.

## 4-4. 변환 결과 (2026-09-21)

3장 모두 QA 경고 없이 변환됐다(카드 시크릿의 상하 대칭 경고만 위쪽 열쇠 장식 때문이라 정상). 눈으로 보고 손댄 곳:

- `daily-task-todo/done`은 **123×36**으로 나왔고 양끝 보석이 가로로 약 14px 튀어나와, 슬라이스를 상하 8·좌우 **14**(표시 테두리 6px / **10px**)로 잡았다.
- `daily-slot-*` 3장은 24×24로 나왔지만 별이 붙은 bonus는 링이 살짝 작다(별이 영역에 포함되어서). 링 자체 크기 차이는 1~2px이라 그대로 쓴다. 칸(`.world-daily__day`)은 그림이 잘리지 않게 24px로 키웠다.
- `codex-ball-unknown`·`codex-badge-locked`는 안쪽이 **불투명 자주색**으로 나와 양피지 위에서 튀어서 CSS `filter: sepia(1) brightness(1.15)`로 갈색 톤으로 눌렀다(이미지 재생성 없음).
- 공 슬롯 3장·뱃지 슬롯 2장은 변환기가 원본 비율을 지켜 아래쪽 정렬하는 바람에 **44×41·44×43·44×42·56×53**으로 제각각 나와 호버 테두리가 그림 위쪽과 어긋났다. 변환기에 슬롯 옵션 `"fill": true`(트림한 영역을 칸 크기 그대로 채움)를 추가하고 매니페스트의 5개 슬롯에 적용해 전부 44×44 / 56×56으로 꽉 채웠다. 고정 크기 칸을 격자로 놓는 슬롯에는 앞으로도 `fill`을 쓴다.
- 황금 공 칸의 번호는 프레임 갈색과 글자색이 겹쳐 안 보여서 **어두운 알약 + 크림 글자**로 아래 가운데에 두고 공을 3px 올렸다. 체크는 오른쪽 위, "?"는 실루엣 위 가운데, 엔딩 후 표시(보라 점)는 왼쪽 위다.
- 미발견 칸(자주색 판)의 갈색 톤 필터가 처음에는 칸 전체에 걸려 **보라 점까지 갈색으로 바꿨다**. 지금은 판 그림을 `::after` 층(`z-index: -1`)으로 빼서 필터가 판에만 걸린다. 뱃지 칸도 같은 구조다.
- 배포 전에 정적 페이지로 4개 탭과 게시판을 실제로 그려 확인했다(호버 테두리 정렬, 번호·체크·"?"·보라 점 가독성, 하단 뱃지 문구 줄바꿈, 할 일 판 보석 여백).
- `codex-card-secret`은 안쪽이 비어 투명해지면 흰 글자가 양피지 위에 얹혀 안 읽히므로 매니페스트에 `opaqueInterior`(안쪽 #101420)를 넣었다. 변환 크기는 72×98.

## 5. 이미지 도착 후

1. 원본을 `tmp/world-src/ui/`에 위 이름으로 저장 → 변환 명령 실행(QA 경고 확인, 특히 대칭·마젠타 잔여).
2. 화면 확인: 아래 §6. 코드 수정은 필요 없다(**칸 크기와 slice 값이 다르게 나오면** `board-codex.css`의 `.world-daily__task--art`(border 6px / slice 8)·`.world-codex__balls.is-art`(44px)·`.world-codex__badges.is-art`(56px)·`.world-codex__ladder.is-art`(12px)만 고친다).
3. [09 에셋 체크리스트](09-asset-checklist.md)에 체크하고, 크레딧의 "월드 전용 변환 에셋 N개"(`WorldCredits.tsx`, 손으로 관리하는 수치)를 늘어난 개수만큼 고친다.

## 6. 확인 체크리스트 (배포 후)

1. 광장 게시판 E → 게시판이 **월드 화면 안**에서 열리고 미션 로그와 같은 프레임 톤이다. 완료 과제는 초록+취소선+체크, 미완료는 크림+빈 원으로 **한눈에 구분**된다.
2. 3과제를 끝내면 버튼이 깜빡이고 E/Enter로 스탬프가 **꽝** 찍힌다(효과음·토스트 포함). 한 번 더 눌러도 두 번 찍히지 않는다. 다음 날(KST)에는 과제가 바뀐다.
3. 엔딩 전에는 왼쪽 카드에 자물쇠 덮개가 뜨고 받기 버튼이 잠긴다.
4. 도감 4개 탭이 모두 열리고 방향키/Q/E/1~4/마우스가 동작한다. 기록 탭의 등급 사다리 다이아몬드가 **잘리지 않는다**.
5. 카드 탭에서 선택한 카드 프레임이 이웃 카드와 겹치지 않고 옆으로 6px 넓다.
6. Esc·✕·바깥 클릭으로 닫히고, 러시 미니게임(`RepeatPanel`)은 예전 그대로다.
7. `prefers-reduced-motion`에서 깜빡임·도장 애니메이션이 없다. 스테이지가 2×~5×로 커져도 글자가 잘리거나 넘치지 않는다.
