# 07. 광장 정리 · 몬스터 초원 맵 · 우편함 편지 (세션 6 계획)

세션 4·5 결과 화면(엘윈 잔디숲)이 NPC 6명 + 토끼 5마리 + 소품 8개로 **너무 오밀조밀**하다는 피드백에서 나온 계획이다. 이 문서는 **(1) 무엇을 바꾸는지, (2) 추가로 필요한 이미지(J11~J14) 생성 지시서, (3) 세션 6에 붙여넣을 프롬프트**를 담는다. 이미지를 먼저 만들고, 별도 세션에서 코드를 진행한다.

> 원칙은 README와 같다: 코드가 문서와 다르면 문서를 먼저 고친다. 브라우저 확인 없이 `pnpm test` + 타입체크로 검증한다.

## 1. 변경 요약

| # | 변경 | 이미지 필요 |
| --- | --- | --- |
| A | 광장(엘윈)에서 **토끼·몬스터를 전부 빼고**, NPC·소품 간격을 넓힌다 | 없음 (좌표만) |
| B | **몬스터 초원**(3번째 맵 `field`) 신설. 토끼·멧돼지·멀록·코볼트가 넓게 흩어져 있다. 퀘스트 `q_rabbits`(토끼 5마리)는 여기서 수행 | J11 배경, J14 소품(옵션) |
| C | 광장 ↔ 몬스터 초원을 잇는 **포털** (양쪽 맵에 하나씩, E로 이동) | J12 포털 |
| D | NPC `우왁 (전설)` 이름 변경 → **`투르카 (전설)`** (오크 용병). 위치는 몬스터 초원으로 옮긴다 | 없음 (이름만) |
| E | **우편함 상호작용** = `우왁굳에게 온 편지` 읽기. 내용은 `~~~~` / `???` 로 가려서 안 보이게. 안 읽은 편지가 있으면 우편함에 편지 표시 | J13 편지 UI, J14의 `우편함(편지 있음)` |

**수정해야 하는 기존 이미지는 없다.** 광장 배경(`forever-hub-bg`), NPC/몬스터 시트, 기존 소품은 그대로 쓰고, 아래 J11~J14만 새로 만든다. (오크 NPC의 헤드셋 디자인은 이름만 바꾸고 그대로 둔다. 마음에 안 들면 J5 스레드에서 오크 셀만 다시 뽑으면 되지만 이번 범위는 아니다.)

### 1-1. 광장 정리 규칙 (A, D)

- 광장 NPC는 5명으로: `questgiver` `leroy` `innkeeper` `flightmaster` `guard`. `streamer`(투르카)는 **몬스터 초원**의 포털 근처로 이동(사냥 안내 역할, 이름표만 표시, 상호작용 없음).
- 광장 토끼는 0마리(`rabbits: []`). 퀘스트 카운트/리스폰 로직은 몬스터 초원의 토끼로 옮긴다.
- **간격 규칙(테스트로 고정)**: NPC 발 위치끼리 ≥ 100px, NPC와 자기 것이 아닌 소품 ≥ 70px, 플레이어 스폰과 모든 상호작용 원 중심 ≥ 원 반경 + 20px.
- 광장 좌표 후보(눈으로 보정, 위 규칙을 만족하도록 세션에서 조정): 여관주인 (200,315) · 퀘스트 NPC (310,350) · 모닥불 (420,335)로 이동 · 표지판 (560,312) · 리로이 (620,395) · 경비병 (690,312) · 그리핀 조련사 (820,350) · 횃대 (770,340) · 허수아비 (700,442) · 우편함 (240,432) · 귀환석 (480,472).
- 광장 포털: 우하단(후보 `(830,470)`, 오른쪽 앞 덤불 콜라이더를 치우고 그 자리에)을 1순위로 하되 배경 나무와 심하게 겹치면 좌하단 `(140,470)`으로. 어느 쪽이든 사용자가 배포 후 확인한다.

### 1-2. 몬스터 초원 맵 (B, C)

- 맵 id `field`, 존 이름 `잔디 포에버 — 토끼 초원`, 배경 `env/forever-field-bg`(J11), 에셋 그룹은 새로 `forever-field`(배경 + J14 소품). 광장 그룹 `forever` 에는 포털(J12), 편지(J13)를 넣는다(광장에서 바로 보이므로).
- 걷기 영역은 넓게(아래 60%), 콜라이더는 돌 원형 제단·연못·울타리·덤불 정도만. 스폰은 귀환 포털 앞.
- 몬스터 ~12마리: 토끼 6, 멧돼지 2, 멀록 2, 코볼트 2. **서로 ≥ 110px** 떨어지게 배치. E로 처치, 8초 후 리스폰. 토끼만 `q_rabbits` 카운트에 들어간다. 다른 몬스터는 채팅 한 줄(+ `forever-mob-defeat`, 멀록은 `forever-murloc` 사운드 — 지금까지 미사용이던 id 연결).
- 포털: 양쪽 맵의 `ForeverTarget` 에 `portal` 추가. 원 반경 50, 프롬프트 `E 몬스터 초원으로` / `E 성문 광장으로`. E → `forever-portal-enter` 사운드 + 짧은 페이드로 맵 전환(그리핀 비행의 맵 전환 로직 재사용, 그리핀 텍스트 없이). 귀환석·그리핀 조련사는 그대로 동작(초원의 귀환석은 없음 → 초원에서 피치로 돌아가려면 광장으로 돌아가서 귀환석/그리핀).
- 포털은 3프레임 스월 애니메이션(4fps, 감소된 모션 설정이면 1프레임).

### 1-3. 우편함 편지 (E)

- 광장 우편함에서 E → 편지 오버레이(`LetterScene`, 퀘스트 두루마리 팝업처럼 `manager.push`, 이동 차단, E/Enter/Esc로 닫기). 사운드 `forever-mailbox` + `forever-popup-open`.
- 제목 `우왁굳에게 온 편지`, 종이 위에 본문(Galmuri11)을 쓴다. **가려진 부분은 `~~~~` 와 `???` 로 그대로 표시**하고, 보이는 단어만 남긴다(초안):

```text
??? 님께,

~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~

~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~

- 우왁굳 드림
추신. ~~~~~~~~~~~~~~
```

  (`부디 ??? 하지 말고 … 잔디에서` 가 은근한 암시. 더 약하게/세게는 문구만 고치면 된다. 보이는 글자는 진한 갈색, 가려진 `~~`/`???` 는 연한 갈색으로 구분.)
- 읽지 않은 편지가 있으면 우편함 소품을 `forever-prop-mailbox-mail`(깃발 올라감, 편지 삐죽)로 바꾸고 위에 봉투 아이콘(J13)을 살짝 떠오르게 한다. 한 번 읽으면 원래 우편함으로. 읽음 상태는 `ForeverProgress` 에 **선택 필드**(`letterRead?: boolean`, 기본 false, `version` 은 올리지 않는다)로 저장하고 기존 데이터는 그대로 통과해야 한다.
- 채팅: 처음 읽으면 시스템 줄 `우편함: 우왁굳에게 온 편지를 읽었습니다.`. 기존 `우편이 없습니다` 문구는 삭제. 월드 채팅 `우편함에 편지 없어요 ㅠㅠ` 는 `우편함에 편지 왔대요 ㅋㅋ` 로 교체.

## 2. 이미지 생성 지시서

`04-image-runbook.md` 와 같은 형식이다. **각 ```text 블록을 그대로 복사해 붙여넣고**, 표시된 레퍼런스를 첨부한다. 3~4장 뽑아 검수 체크를 통과한 것을 고르고, **저장 이름 그대로** `tmp/pitch-src/<카테고리>/` 에 저장한다(gitignore). 스레드는 04의 규칙을 따른다(`T-JF-ENV` 이어서 / 새 대화면 필수 레퍼런스를 모두 첨부).

| # | 저장 이름 | 스레드 | 필수도 | ✓ |
| --- | --- | --- | --- | --- |
| J11 | `tmp/pitch-src/env/env-forever-field-bg.png` | ↪ T-JF-ENV | 필수 | [x] |
| J12 | `tmp/pitch-src/env/env-forever-portal.png` | ↪ T-JF-ENV | 필수 | [x] |
| J13 | `tmp/pitch-src/ui/ui-forever-letter.png` | ↪ T-JF-UI | 필수 | [x] |
| J14 | `tmp/pitch-src/env/env-forever-props-2.png` | ↪ T-JF-ENV | `우편함(편지 있음)` 셀은 필수, 나머지는 옵션이지만 권장 | [x] |

### J11 · 몬스터 초원 배경

- **저장 이름**: `tmp/pitch-src/env/env-forever-field-bg.png` (16:9 그대로, 예: 1672×941 — J3/J4처럼 크롭 없이 960×540로 축소됨)
- **레퍼런스**: **필수** `env-forever-hub-bg.png`(광장, 같은 시점·픽셀·조명), **필수** `env-forever-props.png`(소품 톤), (권장) `env-forever-loading-bg.png`
- **검수 체크**: 글자 없음, **건물 없음**(광장과 구분), 소품·몬스터·캐릭터·토끼 굴이 **그려져 있지 않음**(따로 스프라이트로 올림), 아래 60%가 넓고 평평한 걷기 영역, **왼쪽 중간에 비어 있는 원형 돌 제단**(포털 스프라이트 자리), 중요한 형태는 위쪽 40%에만
- **변환**: `pnpm convert:pitch-art -- env forever-field-bg` (세션 6에서 매니페스트 추가)
- **최종 사용**: `ForeverScene` 3번째 맵 배경 960×540

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), warm afternoon sunlight from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Add no watermark or signature.
Background: this is a FULL opaque scene, no transparency, no magenta.
Subject: a bright daytime top-down 3/4 view of a wide wild meadow outside a fantasy village, a monster-hunting field for a football-themed parody of a classic fantasy MMO starting zone, seen from the SAME camera angle and pixel size as the attached town-square background. Far top: rolling green hills, a dark pine forest line, a distant blue mountain range and puffy clouds; a rough wooden fence and a few round trees frame the far left and right edges. Upper right: a small blue pond with reeds and a mossy rock. Middle left: a flat circular stone dais with a ring of six low weathered standing stones around it, the centre of the dais completely EMPTY and flat (a portal will be added there separately). The entire lower 60% of the image is one big open walkable meadow of soft grass with wide patches of bare dirt, tiny flowers and small grass tufts, and a faint dirt path that enters from the bottom-left corner and fades out. No buildings, no houses, no goalposts. Do NOT draw any props, mailboxes, signs, campfires, barrels, burrows, creatures, animals, rabbits or characters anywhere on the walkable ground — those are added separately. All the important shapes sit in the upper 40% and along the left and right edges.
Canvas: 16:9 landscape (for example 1672x941). No text, no letters, no numbers, no logos anywhere in the image; no Blizzard or Warcraft logos or exact copyrighted designs.
Use the attached image(s) as the style reference for pixel size, outline, palette, lighting and camera angle (they show the SAME game and the same world), but do not copy their buildings. The first attached image shows the camera angle and the open walkable lower area to match.
```

- [x] J11 생성·저장 완료

### J12 · 포털 (광장 ↔ 몬스터 초원)

- **저장 이름**: `tmp/pitch-src/env/env-forever-portal.png` (1536×1024, 알파 PNG)
- **레퍼런스**: **필수** `env-forever-gate.png`(포탈 디자인 일관성), **필수** `env-forever-field-bg.png`(돌 제단 톤)
- **검수 체크**: 3열×2행 정확, 셀당 1개, **한 행의 3프레임은 스월 모양만 다르고 아치·돌·풀 실루엣이 동일**, 글자 없음, 바닥 그림자·외곽 발광 없음(포털 면 안쪽 빛은 허용), 마젠타 잔여 없음, 아래 행(귀환용)이 위 행과 색으로 구분됨
- **변환**: `pnpm convert:pitch-art -- env forever-portal` → `env/forever-portal-field`(**112×104**, 3프레임 스트립 336×104), `env/forever-portal-town`(같은 규격) — 실제 그림이 가로로 넓어 96×128 대신 112×104로 변환됨(세션 6)
- **최종 사용**: 광장의 "몬스터 초원행" 포털(윗행), 초원의 "광장행" 포털(아랫행). 발 기준선 = 셀 하단.

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the objects (use coral red #ff4d6d instead).
Subject: two small free-standing dimensional portals for a fantasy football-parody village, each a tall upright oval swirling magic portal held by a rough ring of chunky mossy stone blocks with a small grass tuft at the base, seen from the same high 3/4 angle and with the same stone, banner and football-motif style as the attached portal gate but SMALLER and narrower (a doorway for one person, about 3/4 of a person taller than a standing adventurer), standing on a flat base with NO cast ground shadow. The swirl inside the ring uses hard pixel-step spiral bands. Each portal has 3 animation frames in which ONLY the swirl bands rotate and a few sparkle pixels move, the stone ring, grass and outline staying pixel-identical.
Portal 1 (to the monster meadow): purple-blue swirl (#6a5cff to #38c8ff) with small green vines on the stones and a tiny carved rabbit-ear notch on top of the arch. Portal 2 (back to the town): cyan-white and gold swirl with a small blue-and-gold banner hanging on each side and a tiny pixel football carved on the top stone.
Canvas: 1536x1024: a strict grid of 3 columns x 2 rows, every cell exactly the same size, one item per cell, centred, items sitting on the same baseline within their row.
Row 1: (1) portal 1 frame 1; (2) portal 1 frame 2; (3) portal 1 frame 3
Row 2: (1) portal 2 frame 1; (2) portal 2 frame 2; (3) portal 2 frame 3
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; consistent pixel size, outline and lighting in all cells; no text, letters, numbers or logos; no Blizzard or Warcraft logos, emblems or exact copyrighted designs.
Use the attached image(s) as the style reference (same game, same pixel size, outline and palette). The first attached image shows the sibling portal gate whose swirl, stone and football motifs to match; the second shows the stone dais style of the meadow.
```

- [x] J12 생성·저장 완료

### J13 · 편지 UI (편지지 · 봉투 · 밀랍 도장)

- **저장 이름**: `tmp/pitch-src/ui/ui-forever-letter.png` (1536×1024, 알파 PNG)
- **레퍼런스**: **필수** `ui-forever-hud.png`(두루마리 셀 = 톤/두께 기준), **필수** `env-forever-props.png`(우편함 톤)
- **검수 체크**: 2열×2행 정확, 셀당 1개, **편지지 안쪽이 완전히 비어 있음(글자·줄·낙서 없음)**, 편지지가 두껍고 또렷한 외곽선, 글자·숫자 없음, 마젠타 잔여 없음
- **변환**: `pnpm convert:pitch-art -- ui forever-letter` → `ui/forever-letter`(**400×230**, fill — 종이가 가로로 긴 비율이라 400×280 대신, 세션 6), `ui/forever-seal`(32×32), `ui/forever-mail-icon`(32×24), `ui/forever-mail-open-icon`(32×24)
- **최종 사용**: 편지 오버레이 종이, 편지 하단 도장, 우편함 위 새 편지 아이콘, 채팅/업적 장식

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the items (use coral red #ff4d6d instead).
Subject: four fantasy mail UI items for a football-themed parody of a classic fantasy MMO, chunky and thick, never thin.
Canvas: 1536x1024: a strict grid of 2 columns x 2 rows, every cell exactly the same size, one item per cell, centred.
Row 1: (1) a large unfolded letter sheet of aged cream parchment, landscape, wider than tall (about 10:7), with gently curled corners, two faint horizontal fold creases and a thin brown-and-gold border trim, the parchment area completely BLANK and EMPTY (no lines, no writing, no marks) so text can be added later; (2) a round wax seal in coral red (#ff4d6d) with a small embossed pixel football and a short dangling ribbon, no letters
Row 2: (3) a small sealed envelope icon in cream and blue with a gold trim and a coral-red wax seal, slightly tilted, bold and readable at small size; (4) the same envelope icon opened, with a cream letter sheet sticking out of it
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; consistent pixel size, outline and lighting in all cells; no text, letters, numbers or logos anywhere; no Blizzard or Warcraft logos, emblems or exact copyrighted UI designs.
Use the attached image(s) as the style reference (same game, same pixel size, outline and palette). The first attached image shows the parchment scroll cell whose material and thickness to match.
```

- [x] J13 생성·저장 완료

### J14 · 초원 소품 + 우편함(편지 있음)

- **저장 이름**: `tmp/pitch-src/env/env-forever-props-2.png` (1536×1024, 알파 PNG)
- **레퍼런스**: **필수** `env-forever-props.png`(J6, 같은 소품 시트 형식·우편함 원본), **필수** `env-forever-field-bg.png`
- **검수 체크**: 4열×2행 정확, 셀당 1개, **바닥 그림자 없이**, 글자 없음(경고 표지판도 비어 있음), 셀 1의 우편함이 J6의 우편함과 **같은 디자인**(색·크기·깃발)이고 깃발만 올라가 있고 편지가 삐죽 나와 있음, 마젠타 잔여 없음
- **변환**: `pnpm convert:pitch-art -- env forever-props-2` → `env/forever-prop-mailbox-mail`(48×64) · `-burrow`(64×40) · `-stump`(56×48) · `-boulder`(72×56) · `-bush`(64×56) · `-mushrooms`(48×40) · `-fence`(80×48) · `-warnsign`(48×72)
- **최종 사용**: 광장 우편함 교체용, 몬스터 초원 장식(굴은 몬스터 스폰 지점 표시)

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), warm afternoon sunlight from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the objects (use coral red #ff4d6d instead).
Subject: eight small props for a wild monster meadow of a football-themed parody of a classic fantasy MMO, all seen from the same high 3/4 angle as the attached props sheet, each standing on a flat base with NO cast ground shadow.
Canvas: 1536x1024: a strict grid of 4 columns x 2 rows, every cell exactly the same size, one item per cell, centred, items sitting on the same baseline within their row.
Row 1: (1) EXACTLY the same blue wooden post mailbox with gold trim on a stone base with grass as in the attached props sheet (same design, colours and size), but its red flag is raised and a cream envelope sticks out of the mailbox opening, no lettering; (2) a rabbit burrow: a low mound of brown earth with a dark round hole, a few grass tufts and one small white flower; (3) a chopped tree stump with visible rings and a little moss and two tiny mushrooms; (4) a cluster of three mossy grey boulders with a few grass tufts
Row 2: (1) a round green berry bush with a few red berries; (2) a small cluster of red-capped and brown mushrooms; (3) a short wooden fence segment with two posts and two rails; (4) a wooden warning signpost with a completely blank board, no drawing and no letters
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; consistent pixel size, outline and lighting in all cells; no text, letters, numbers or logos; no Blizzard or Warcraft logos, emblems or exact copyrighted designs.
Use the attached image(s) as the style reference (same game, same pixel size, outline and palette). The first attached image is the previous props sheet whose mailbox in cell (1) must be reproduced exactly with the raised flag and the envelope added.
```

- [x] J14 생성·저장 완료

## 3. 세션 6 프롬프트 (이미지 J11~J14를 만든 뒤 그대로 붙여넣기)

```text
[공통 머리말] docs/forever/README.md 를 먼저 읽고, 브라우저 수동 확인은 하지 말고 pnpm test 와 타입체크로만 검증한다. 셸 편집은 Write/Edit 도구 또는 Write로 만든 Node 스크립트를 쓴다(heredoc 아포스트로피, Python CRLF 문제). victory.mp3 계열 사운드는 재사용 금지. 문서와 다르게 구현해야 하면 문서를 먼저 고친다. 커밋은 요청 시에만.

작업: 잔디 포에버 광장 정리 + 몬스터 초원 맵 + 우편함 편지 (docs/forever/07-hub-declutter-field-map-letter.md 가 계획서, 그대로 따른다).

먼저 읽을 문서: docs/forever/07-hub-declutter-field-map-letter.md (전체), 02-scene-and-gate-spec.md §3, §10, §11, 03-art-spec.md §3.
먼저 읽을 코드: src/web/pitch/game/forever.ts (ForeverMapDef, FOREVER_NPCS, RABBIT_SPOTS, FOREVER_MAPS), src/web/pitch/game/foreverProgress.ts, src/web/pitch/scenes/ForeverScene.ts (상호작용, 토끼 처치, 맵 전환 switchMap/startFlight, 퀘스트 팝업 오버레이), src/web/pitch/scenes/ 의 퀘스트 팝업 씬, engine/assets.ts (그룹), scripts/pitch-art-manifest.json, src/web/pitch/__tests__/foreverScene.test.ts, foreverAssets.test.ts, assetBudget.test.ts.

절차:
1. tmp/pitch-src/env/env-forever-field-bg.png, env-forever-portal.png, env-forever-props-2.png, tmp/pitch-src/ui/ui-forever-letter.png 가 있는지 확인하고 크기를 보고한다. 하나라도 없으면 보고하고 멈춘다(임의로 만들지 않는다). props-2 는 옵션 셀이 비어 있어도 mailbox-mail 만 있으면 진행한다.
2. 매니페스트 슬롯 추가(07 §2 의 변환 결과 키/크기 준수): env forever-field-bg(scene), forever-portal(grid 3x2, forever-portal-field [0,1,2], forever-portal-town [3,4,5], 96x128, 2행 3프레임 스트립), forever-props-2(grid 4x2, 8종), ui forever-letter(grid 2x2: forever-letter 400x280 fill, forever-seal 32x32, forever-mail-icon 32x24, forever-mail-open-icon 32x24). pnpm convert:pitch-art 로 변환하고 QA 경고를 확인한다. assetMeta.generated.ts 는 스크립트 결과를 그대로 둔다.
3. engine/assets.ts: 새 그룹 "forever-field"(field 배경 + props-2 의 옵션 소품)를 추가하고 광장 그룹 "forever" 에는 forever-portal-*, forever-letter/seal/mail-icon, forever-prop-mailbox-mail 을 넣는다. assetBudget.test.ts 에 forever-field 예산(실측 기반)을 추가하고 forever 예산이 여전히 통과하는지 확인한다(넘으면 예산을 실측으로 갱신하고 문서에 적는다).
4. 광장 정리(07 §1-1): 광장 토끼 제거(rabbits: []), streamer NPC 는 몬스터 초원으로 옮긴다. 이름을 "투르카 (전설)" 로 바꾼다(색 #ff8000 유지, 코드·문서·테스트의 "우왁 (전설)" 모두 교체). 간격 규칙(NPC끼리 ≥100px, NPC-타 소품 ≥70px, 스폰-원 중심 ≥ 반경+20)을 만족하도록 07 의 좌표 후보를 조정하고, 규칙을 검사하는 유닛 테스트를 추가한다. 조정한 좌표는 02 §3.1/§3.2 에 반영한다.
5. 몬스터 초원 맵 "field"(07 §1-2): ForeverMapId 에 추가, FOREVER_MAPS 에 정의(존 이름, 배경, 그룹 "forever-field", 스폰, 걷기 영역, 콜라이더, 소품, 몬스터 목록 ~12마리 — 토끼6·멧돼지2·멀록2·코볼트2, 서로 ≥110px). 기존 토끼 로직(처치/리스폰/퀘스트 카운트)을 몬스터 종류 필드가 있는 목록으로 일반화하고 q_rabbits 는 토끼만 센다. 다른 몬스터 처치는 채팅 한 줄 + forever-mob-defeat, 멀록은 forever-murloc 사운드. 몬스터는 2프레임 스트립(characters/forever-mob-*)을 idle 로 그린다. 새 그룹은 포털 접근 시 미리 받고, 로드 실패해도 맵은 열린다(도형 폴백).
6. 포털(07 §1-2): ForeverTarget 에 "portal" 추가(광장/초원 각 맵 zones), 반경 50, 프롬프트 "몬스터 초원으로"/"성문 광장으로", E → forever-portal-enter 사운드 + 짧은 페이드 후 맵 전환(switchMap 재사용). 포털 스프라이트 3프레임 4fps(감소된 모션이면 1프레임). 초원 스폰은 광장행 포털 앞. 그리핀 조련사/귀환석 동작은 유지.
7. 우편함 편지(07 §1-3): LetterScene 오버레이(종이=ui/forever-letter, 도장=ui/forever-seal, 제목 "우왁굳에게 온 편지", 본문은 07 의 초안 그대로 ~~~~/??? 표기, 보이는 글자 진한 갈색·가려진 부분 연한 갈색, E/Enter/Esc 닫기, 이동 차단, 사운드 forever-mailbox + forever-popup-open). 읽지 않은 동안 우편함 소품을 forever-prop-mailbox-mail 로, 위에 forever-mail-icon 을 떠오르게. ForeverProgress 에 선택 필드 letterRead?: boolean 추가(version 유지, 기존 저장 데이터 통과·손상 데이터 폴백 테스트). 처음 읽으면 시스템 채팅 한 줄. "우편이 없습니다" 문구와 월드 채팅의 "우편함에 편지 없어요" 를 07 의 문구로 교체. 에셋이 없어도(도형 폴백) 편지 오버레이가 열리고 닫혀야 한다.
8. 테스트: forever/foreverScene/foreverProgress/foreverAssets/assetBudget 확장 — 광장 몬스터 0, 초원 몬스터 종류·수·간격, 토끼만 퀘스트 카운트, 포털 왕복 시 맵 id/스폰 위치/진행 데이터 유지, 편지 열기·닫기·읽음 저장, 이름 변경, 간격 규칙, 그룹 정의. 기존 테스트 전체가 통과해야 한다.
9. 문서: 02 에 §12(이번 변경, 스펙과 달라진 점)를 추가하고 01/03/04 의 관련 표기(streamer 이름, 새 시트 키)를 갱신, README 체크리스트에 세션 6 을 추가해 체크, 07 의 J11~J14 체크박스는 사용자가 이미지를 저장했다면 [x] 로.

완료 기준: pnpm test 전체와 타입체크 통과. 시각 확인은 하지 않고, 사용자가 확인할 항목(광장 포털 위치와 배경 겹침, 초원 포털 제단 위치·걷기 영역, 몬스터 간격, NPC 간격, 편지 종이 위 글자 위치/줄바꿈, 우편함 스프라이트 교체)을 목록으로 보고한다.
```
