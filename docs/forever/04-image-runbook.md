# 04. 잔디 포에버 — 이미지 생성 지시서

`docs/pitch/09-image-generation-runbook.md` 와 같은 형식이다. **각 항목의 ```text 블록을 그대로 복사해 붙여넣고**, 표시된 레퍼런스를 첨부한다. 스타일 문단은 항목마다 **중복 포함**되어 있어 한 블록만 복사하면 된다.

## 사용법

1. 항목의 **스레드**를 확인한다.
   - 🆕 **새 대화** = 새 채팅을 열고 레퍼런스를 모두 첨부해 시작.
   - ↪ **이어서** = 표시된 스레드의 기존 대화에 이어서 요청(스타일이 계승됨). 그래도 **필수 레퍼런스는 다시 첨부**한다.
2. 프롬프트 블록을 붙여넣고 3~4장 뽑아 **검수 체크**를 통과한 것을 고른다.
3. **저장 이름** 그대로 `tmp/pitch-src/<카테고리>/` 에 PNG로 저장(`tmp/`는 gitignore).
4. 항목 끝의 `- [ ]` 를 `- [x]` 로 바꾸고 아래 진행 표도 갱신한다.
5. 변환은 세션 3(아트 통합)에서 한꺼번에 한다. 변환 명령은 매니페스트 추가 후의 **계획 이름**이다.

## 스레드 규칙

| 스레드 | 용도 | 시작 항목 |
| --- | --- | --- |
| `T-PCH-ENV` (기존) | 피치 환경 스레드. J1이 락커 게이트(#117)의 형제이므로 여기에 이어서 | J1 (↪) |
| `T-JF-ENV` (신규) | 포에버 환경: 로딩 배경, 광장 배경, 소품 | J3 (🆕) → J4, J6, J9 (↪) |
| `T-JF-CHR` (신규) | NPC/몬스터 | J5 (🆕) → J7, J10 (↪) |
| `T-JF-UI` (신규) | 로고/HUD | J2 (🆕) → J8 (↪) |

> `T-PCH-ENV` 를 이어갈 수 없으면 J1 도 🆕 새 대화로 하고 `env-pitch-bg.png`, `env-locker-gate.png` 를 **모두 필수 첨부**한다.

## 진행 표

| # | 저장 이름 | 스레드 | ✓ |
| --- | --- | --- | --- |
| J1 | `tmp/pitch-src/env/env-forever-gate.png` | ↪ T-PCH-ENV | [x] |
| J2 | `tmp/pitch-src/ui/ui-forever-logo.png` | 🆕 T-JF-UI | [x] |
| J3 | `tmp/pitch-src/env/env-forever-loading-bg.png` | 🆕 T-JF-ENV | [x] |
| J4 | `tmp/pitch-src/env/env-forever-hub-bg.png` | ↪ T-JF-ENV | [x] |
| J5 | `tmp/pitch-src/characters/forever-npc.png` | 🆕 T-JF-CHR | [x] |
| J6 | `tmp/pitch-src/env/env-forever-props.png` | ↪ T-JF-ENV | [x] |
| J7 | `tmp/pitch-src/characters/forever-mobs.png` | ↪ T-JF-CHR | [x] |
| J8 | `tmp/pitch-src/ui/ui-forever-hud.png` | ↪ T-JF-UI | [x] |
| J9 (옵션) | `tmp/pitch-src/env/env-forever-orgrimmar-bg.png` | ↪ T-JF-ENV | [x] |
| J10 (옵션) | `tmp/pitch-src/characters/forever-npc-2.png` | ↪ T-JF-CHR | [x] |

> **실제 저장 크기 확인 (2026-09-26, 세션 1)**: J1·J5·J6·J7·J8·J10 = 1536×1024 (알파 PNG). J2 로고 = 2172×724 (3:1, 알파) — 문서의 1536×512와 다르지만 비율은 동일해 변환기가 480×160으로 줄이면 됨. **J3·J4·J9 배경은 1672×941 (16:9)** 이라 "중앙 16:9 밴드 크롭"이 필요 없고 960×540으로 그대로 축소해야 함 → 세션 3에서 매니페스트를 `scene`이 아닌 16:9 전체 리사이즈로 설정하고 `anchorY` 크롭을 쓰지 말 것.

**권장 생성 순서**: J1 → J3 → J4 → J6 → J5 → J7 → J2 → J8 (배경으로 톤을 먼저 잡고 캐릭터·UI를 맞춘다).

---

## J1 · 피치 우측 게이트 (잔디 포에버 차원문)

- **저장 이름**: `tmp/pitch-src/env/env-forever-gate.png` (1536×1024)
- **스레드**: ↪ **이어서** — `T-PCH-ENV`
- **레퍼런스 첨부**:
  - **필수** `tmp/pitch-src/env/env-locker-gate.png` — 같은 종류의 게이트. 크기·구도·외곽선 기준(오른쪽 대칭 배치라 형제처럼 보여야 함)
  - **필수** `tmp/pitch-src/env/env-pitch-bg.png` — 픽셀 크기·팔레트·조명 기준
- **검수 체크**: 3열×2행 그리드 정확, 셀당 1개, 글자·숫자 없음, 마젠타/핑크 잔여 없음, 락커 게이트와 같은 크기감(128px급), 닫힘/열림 구분이 뚜렷, 셀 3의 글로우는 게이트 외곽선 바깥에만 얇게
- **변환**: `pnpm convert:pitch-art -- env forever-gate` (세션 3에서 매니페스트 추가)
- **최종 사용**: 피치 우측 끝 게이트, 약 128×128 논리 px (x 778~944, y 316~482)

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: a fantasy dimensional portal gate standing at the edge of a football pitch, seen from the same high 3/4 broadcast angle as the attached locker-room tunnel gate and the same overall size and footprint. It is an arch built from two chunky stone pillars topped with a football-goal crossbar (a white goalpost frame integrated into the stone arch), decorated with small blue-and-gold banners and two tiny pixel footballs carved on the pillars. The arch frames a swirling magic portal in purple-blue (#6a5cff to #38c8ff) with hard pixel-step spiral bands; a blank stone label plate hangs above the arch (no letters). Floodlit from the upper left.
Canvas: 1536x1024: a strict grid of 3 columns x 2 rows, every cell exactly the same size, one item per cell, centred, items sitting on the same baseline within their row where they are objects.
Row 1: (1) portal gate DORMANT — the arch is closed by a dark, dim, nearly still violet portal surface; (2) portal gate ACTIVE — the swirl is bright and open, cyan-white light spilling out of the arch; (3) portal gate DORMANT with a soft cyan glow outline around the whole gate silhouette (interaction highlight, the only place where an outer glow is allowed)
Row 2: (1) a bobbing down-arrow marker in gold (frame 1, arrow only); (2) the same gold down-arrow marker (frame 2, 6 pixels higher); (3) the blank label plate on its own (weathered stone with a gold trim, empty, no letters)
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; consistent pixel size, outline and lighting in all cells; no text, letters, numbers or logos; no Blizzard or Warcraft logos, emblems or exact copyrighted designs.
Use the attached image(s) as the style reference (same game, same pixel size, outline and palette). The first attached image shows the sibling locker-room gate to match in size and framing.
```

- [x] J1 생성·저장 완료

---

## J2 · "잔디 포에버" 타이틀 로고

- **저장 이름**: `tmp/pitch-src/ui/ui-forever-logo.png` (**1536×512, 3:1**)
- **스레드**: 🆕 **새 대화** — `T-JF-UI`
- **레퍼런스 첨부**:
  - **필수** `tmp/pitch-src/keyart/keyart-loading-bg.png` — 색감·픽셀 크기 기준. 로고가 로딩 배경 위에 얹힌다고 알릴 것
  - (권장) **와우 스타일 로고 이미지** — 와우 클래식/포에버류 타이틀 로고를 스크린샷 등으로 직접 구해 첨부(두꺼운 금속 베벨 글자, 돌/철 장식판, 불꽃·서리 포인트의 질감·구도 기준). 색·구도만 참고하게 하고 **글자 모양·문양을 그대로 베끼지 말라고** 프롬프트 끝에 덧붙일 것
  - ~~기존 "잔디동 PITCH" 로고는 첨부하지 않는다~~ (밝은 아케이드 톤이라 와우 느낌이 약해짐)
- **검수 체크**: 3:1 정확, 여백 ≥8%, `잔디 포에버` 다섯 글자 정확(잔·디·포·에·버) — 틀리면 프롬프트 B, `FOREVER` 철자 정확, **와우 타이틀 느낌**(두껍고 무거운 금속 베벨 글자, 어두운 돌/철 장식판, 불꽃·서리 포인트)이 나는지, 네이비 외곽선, 바깥 발광 없음, 마젠타 잔여 없음, 어두운 배경 위에서 읽히는 대비
- **변환**: `pnpm convert:pitch-art -- ui forever-logo` (세션 3에서 매니페스트 추가)
- **최종 사용**: 로딩 화면 중앙 상단, 480×160

**프롬프트 A — 글자 포함 (먼저 시도)**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette and every letter, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the logo (use coral red #ff4d6d instead).
Subject: a game title logo in the look of a classic high-fantasy MMORPG title screen (heavy, epic, ancient-and-weathered feeling), rendered as detailed pixel art, wide 3:1 lockup, centred, with at least 8% empty margin on every side. The big top line is the Korean phrase "잔디 포에버" in very thick, heavy, carved-metal Hangul with slightly flared serif-like stroke ends (five syllables exactly: 잔 디 포 에 버, with a small gap between 디 and 포), the letters made of beveled burnished gold (#ffd23f to #b8862b with a bright pale-gold top-left edge highlight and dark bronze shadow on the lower-right bevel), chipped and scratched like old armor, a thick dark navy outline, a heavy dark iron/stone extrusion below and to the right, a few tiny ember sparks and frost-blue sparkle pixels. Under it, a wide ornate banner of dark rune-carved stone and black iron with gold rivets and small curled flourishes on both ends, holding the Latin word "FOREVER" in wide heavy engraved capitals, icy blue-white (#dff6ff to #38c8ff) with a dark navy outline; a large swirling purple-blue (#6a5cff to #38c8ff) magic portal ring is half-hidden behind the whole title as a backdrop, with two small crossed football-corner flags and a small pixel football emblem worked into the banner as subtle nods to football. Overall palette: gold, dark iron, deep navy, icy blue, and a little ember orange. Spell the text exactly: 잔디 포에버 and FOREVER, nothing else, no extra letters, numbers or slogans. Do not copy the lettering, dragon, logo shapes or emblems of any existing game; create an original design in that genre.
Canvas: 1536x512 (3:1).
Use the attached image(s) as a reference for colour, metal texture and overall lockup composition only (the pixel art style should still match the loading key art); the logo will be placed over the attached loading key art.
```

**프롬프트 B — 글자 없는 엠블럼 (폴백)** — Style/Background/Canvas/레퍼런스 문단은 A와 동일하게 앞뒤에 붙이고 `Subject` 만 교체(글자는 코드가 Galmuri11로 얹음):

```text
Subject: an empty game-title plate in the look of a classic high-fantasy MMORPG title screen, wide 3:1, centred, with at least 8% empty margin on every side: a heavy ornate banner of dark rune-carved stone and black iron with beveled burnished-gold (#ffd23f to #b8862b) trim, gold rivets and curled flourishes on both ends, its wide centre area a flat dark navy band left completely EMPTY for text to be added later, a large swirling purple-blue (#6a5cff to #38c8ff) magic portal ring half-hidden behind it, a small pixel football emblem on each end, two small crossed corner flags above, tiny ember and frost sparkle pixels, a heavy dark drop-shadow below. Absolutely no letters, numbers, symbols or logos anywhere. Do not copy the shapes or emblems of any existing game.
```

- [x] J2 생성·저장 완료

---

## J3 · 로딩 화면 배경

- **저장 이름**: `tmp/pitch-src/env/env-forever-loading-bg.png` (1536×1024 → 중앙 16:9 크롭 960×540)
- **스레드**: 🆕 **새 대화** — `T-JF-ENV`
- **레퍼런스 첨부**:
  - **필수** `tmp/pitch-src/keyart/keyart-loading-bg.png` — 로딩 화면 톤·구도 기준
  - **필수** `tmp/pitch-src/env/env-pitch-bg.png` — 픽셀 크기·외곽선·조명 기준
  - (권장) J1 승인본 `env-forever-gate.png` — 포탈 디자인 일관성
- **검수 체크**: 글자 없음, **상단 중앙 ~35%(로고 자리)와 하단 ~25%(진행 바·팁 자리)가 비교적 조용하고 어두움**, 핵심 형태는 중앙 16:9 밴드 안, 마젠타 없음, J1 포탈과 같은 보라-파랑 계열
- **변환**: `pnpm convert:pitch-art -- env forever-loading-bg` (씬 크롭)
- **최종 사용**: `ForeverLoadingScene` 배경 960×540

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Add no watermark or signature.
Background: this is a FULL opaque scene, no transparency, no magenta.
Subject: a dramatic loading-screen backdrop, night time. In the centre-middle of the image a huge swirling purple-blue (#6a5cff to #38c8ff) dimensional portal ring stands upright on a grassy football pitch, with hard pixel-step spiral bands and a few drifting energy sparks. On the left in the distance a silhouette of a medieval human-kingdom castle gate with blue-and-gold banners; on the right in the distance a huge football goal frame overgrown with vines and an old stadium floodlight tower, as if the two worlds merge. A dark star-filled sky with two big moons. The pitch grass in the foreground has chalk lines that fade into a rocky fantasy dirt road. Keep the TOP CENTER third of the image (above the portal) and the BOTTOM QUARTER of the image relatively empty, dark and calm (deep blue-violet, minimal detail) because a logo and a progress bar with tips will be placed there. All the important shapes sit inside the central 16:9 band of the canvas.
Canvas: 1536x1024. No text, no letters, no numbers, no logos anywhere in the image; no Blizzard or Warcraft logos or exact copyrighted designs.
Use the attached image(s) as the style reference for pixel size, outline, palette and lighting (they show the SAME game), but do not copy their subject.
```

- [x] J3 생성·저장 완료

---

## J4 · 스톰피치 성문 광장 (맵 배경)

- **저장 이름**: `tmp/pitch-src/env/env-forever-hub-bg.png` (1536×1024 → 중앙 16:9 크롭 960×540)
- **스레드**: ↪ **이어서** — `T-JF-ENV` (J3 대화)
- **레퍼런스 첨부**:
  - **필수** J3 승인본 `tmp/pitch-src/env/env-forever-loading-bg.png`
  - **필수** `tmp/pitch-src/env/env-locker-bg-v2.png` — 실내가 아닌 "걷는 맵 배경"의 구도·시점·상하 비율 기준
  - (권장) `tmp/pitch-src/env/env-pitch-bg.png`
- **검수 체크**: 글자 없음, **소품(우편함/허수아비/모닥불/귀환석/표지판)이 배경에 그려져 있지 않음**(따로 스프라이트로 올림), 아래쪽 45%가 걸어다닐 수 있는 넓고 평평한 길/잔디, 좌측 여관·우측 풍차 위치가 02 §3.1 콜라이더와 대략 일치, 중앙 16:9 밴드 안에 핵심, 낮 시간대 밝은 톤
- **변환**: `pnpm convert:pitch-art -- env forever-hub-bg`
- **최종 사용**: `ForeverScene` 배경 960×540 (좌표 보정은 세션 3)

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), warm afternoon sunlight from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Add no watermark or signature.
Background: this is a FULL opaque scene, no transparency, no magenta.
Subject: a bright daytime top-down 3/4 view of a fantasy forest-village town square that parodies the starting zone of a classic fantasy MMO, blended with football. Far top: rolling green hills and a medieval human-kingdom stone castle gate with blue-and-gold banners in the distance. Upper left: a two-storey wooden inn with a stone chimney and a blank hanging signboard bracket (no sign drawn). Upper right: a wooden windmill beside a small storehouse. Upper middle: a stone well or fountain. In the mid-ground behind the town, on a grassy hill, a white football goalpost with a net and faded chalk pitch lines painted on the grass. A wide flat dirt road and soft grass fill the entire lower 45% of the image as a big open walkable area, with only small tufts of grass, tiny flowers and a wooden fence along the far edges. A few round green trees frame the left and right edges. Do NOT draw any small props such as mailboxes, campfires, training dummies, signposts, barrels, stones, or characters on the walkable ground — those are added separately. All the important shapes sit inside the central 16:9 band of the canvas.
Canvas: 1536x1024. No text, no letters, no numbers, no logos anywhere in the image; no Blizzard or Warcraft logos or exact copyrighted designs.
Use the attached image(s) as the style reference for pixel size, outline, palette and lighting (they show the SAME game), but do not copy their subject unless the description says so. The second attached image shows the camera angle and the open walkable lower area to match.
```

- [x] J4 생성·저장 완료

---

## J5 · NPC 6종 (정면 idle 2프레임)

- **저장 이름**: `tmp/pitch-src/characters/forever-npc.png` (1536×1024)
- **스레드**: 🆕 **새 대화** — `T-JF-CHR`
- **레퍼런스 첨부**:
  - **필수** `tmp/pitch-src/characters/` 의 승인된 캐릭터 시트 1개 — 픽셀 크기·비율(약 96px 셀, 발 기준선)·외곽선 기준
  - **필수** J4 승인본 `tmp/pitch-src/env/env-forever-hub-bg.png` — 배경과의 색감/스케일 기준
  - (권장) `tmp/pitch-src/pets/` 의 murloc 관련 PNG — 작은 몬스터 톤
- **검수 체크**: 4열×3행 정확, 셀당 캐릭터 1명, 같은 NPC의 A/B 프레임은 **호흡(1~2px 상하 이동, 팔 미세 변화)만** 다르고 실루엣 동일, 모두 정면(아래) 응시, 머리 위 마크·글자 없음, 발 기준선이 행 안에서 동일, 마젠타 잔여 없음, 실존 인물 얼굴 닮음 없음
- **변환**: `pnpm convert:pitch-art -- characters forever-npc` (세션 3에서 매니페스트 추가)
- **최종 사용**: 96×96 셀, `ForeverScene` NPC(머리 위 `!`/`?` 마크는 J8에서 코드로 올림)

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the characters (use coral red #ff4d6d instead).
Subject: six standing NPC characters for a fantasy village parody, each shown FRONT-FACING (looking down toward the viewer), full body, chibi-ish game proportions matching the attached character sheet (about 2.5 heads tall), feet on the same baseline. Each NPC has two idle frames: frame A and frame B, where B differs only by a tiny breathing bob (1-2 pixels up) and a small arm or prop shift, with an identical silhouette otherwise. The NPCs:
(1) QUEST GIVER: a kind old human village captain with a grey moustache, blue tabard with gold trim, holding a rolled scroll. 
(2) STREAMER ORC: a burly friendly green-skinned orc with small tusks, wearing a gaming headset and a mint-and-white football jersey, holding a big mouse-shaped wooden club; a legendary orange-gold shoulder pauldron. 
(3) CHICKEN PALADIN: a very muscular blond human paladin in shiny silver-and-gold plate armor, cheering with one fist raised, holding a roasted chicken drumstick in the other hand, cheeky grin. 
(4) INNKEEPER: a round cheerful bearded man in a white apron holding a foaming wooden mug. 
(5) FLIGHT MASTER: a lean adventurer in a leather cap with goggles and a long coat, holding a small brass whistle, with a tiny brown-and-white griffin chick perched on his shoulder. 
(6) TOWN GUARD: a stern human soldier in steel helmet, blue-and-gold tabard, holding a spear upright and a round shield with a blank football-shaped crest.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly the same size, one character pose per cell, centred, feet on the same baseline within their row.
Row 1: (1) quest giver frame A; (2) quest giver frame B; (3) streamer orc frame A; (4) streamer orc frame B
Row 2: (1) chicken paladin frame A; (2) chicken paladin frame B; (3) innkeeper frame A; (4) innkeeper frame B
Row 3: (1) flight master frame A; (2) flight master frame B; (3) town guard frame A; (4) town guard frame B
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; consistent pixel size, outline and lighting in all cells; no text, letters, numbers or logos; no floating marks or symbols above heads; no Blizzard or Warcraft logos, emblems or exact copyrighted character designs; no likeness of any real person.
Use the attached image(s) as the style reference (same game, same pixel size, outline and palette, same character proportions).
```

- [x] J5 생성·저장 완료

---

## J6 · 소품 8종

- **저장 이름**: `tmp/pitch-src/env/env-forever-props.png` (1536×1024)
- **스레드**: ↪ **이어서** — `T-JF-ENV`
- **레퍼런스 첨부**:
  - **필수** J4 승인본 `tmp/pitch-src/env/env-forever-hub-bg.png` — 배경과 어울리는 색·조명·스케일 기준
  - (권장) `tmp/pitch-src/env/env-locker-gate.png` — 소품 스프라이트 시트 형식 기준(같은 3/4 시점)
- **검수 체크**: 4열×2행 정확, 셀당 1개, **바닥 그림자 없이** 오브젝트만(변환 시 y정렬용 발 기준선은 셀 하단), 글자 없음(간판·표지판·우편함 모두 비어 있음), 마젠타 잔여 없음, 오브젝트 크기 비율이 현실감 있게 다름(귀환석≈사람 무릎 높이, 허수아비≈사람 키)
- **변환**: `pnpm convert:pitch-art -- env forever-props`
- **최종 사용**: `ForeverScene` 소품(02 §3.2 대상 위치에 배치), 각 48~96px

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), warm afternoon sunlight from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the objects (use coral red #ff4d6d instead).
Subject: eight fantasy village props for a football-themed parody of a classic fantasy MMO starting town, all seen from the same high 3/4 angle as the attached background, each standing on a flat base with NO cast ground shadow.
Canvas: 1536x1024: a strict grid of 4 columns x 2 rows, every cell exactly the same size, one item per cell, centred, items sitting on the same baseline within their row.
Row 1: (1) a blue wooden post mailbox with a gold trim and a small red flag, no lettering; (2) a wooden inn signboard hanging from an iron bracket, the board itself completely blank; (3) a HEARTHSTONE: a smooth rounded runic stone about knee height on a small stone pedestal, glowing softly from inside with cyan light (glow stays inside the outline), carved with a simple swirl and a small football pentagon pattern, no letters; (4) a campfire with stacked logs, bright orange-yellow flames and a few sparks
Row 2: (1) a straw-stuffed training dummy on a wooden stake wearing a tiny football jersey with a blank chest, human height; (2) a wooden signpost with two blank arrow boards pointing left and right; (3) a griffin perch: a tall wooden pole with a straw nest platform on top and a couple of brown-and-white feathers; (4) a stack of two wooden barrels and one crate tied with rope
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; consistent pixel size, outline and lighting in all cells; no text, letters, numbers or logos; no Blizzard or Warcraft logos, emblems or exact copyrighted designs.
Use the attached image(s) as the style reference (same game, same pixel size, outline and palette).
```

- [x] J6 생성·저장 완료

---

## J7 · 몬스터 4종 (2프레임)

- **저장 이름**: `tmp/pitch-src/characters/forever-mobs.png` (1536×1024)
- **스레드**: ↪ **이어서** — `T-JF-CHR`
- **레퍼런스 첨부**:
  - **필수** J5 승인본 `tmp/pitch-src/characters/forever-npc.png` — 스케일·외곽선 기준
  - **필수** `tmp/pitch-src/pets/` 의 murloc 관련 PNG — 멀록형 몬스터 디자인 일관성(같은 종족으로 보이게)
- **검수 체크**: 4열×2행 정확(1행=프레임 A 4종, 2행=프레임 B 4종, **열이 같은 몬스터**), A/B는 미세 동작만 다름, 글자 없음, 마젠타 잔여 없음
- **변환**: `pnpm convert:pitch-art -- characters forever-mobs`
- **최종 사용**: `ForeverScene` 몬스터(토끼는 Q1 대상), 각 48~64px

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the creatures (use coral red #ff4d6d instead).
Subject: four small beginner-zone monsters for a fantasy village parody, each FRONT-FACING three-quarter view, full body, small cute game proportions, feet or body bottom on the same baseline: (1) a brown-and-white wild rabbit sitting up with big ears; (2) a wild boar with small tusks and bristly back; (3) a murloc: a small green-blue fishman with a spiky head fin, big eyes and a wide mouth, matching the attached murloc pet design; (4) a kobold: a small brown rat-like miner in a yellow hard hat with a lit candle on top of it, holding a tiny pickaxe.
Canvas: 1536x1024: a strict grid of 4 columns x 2 rows, every cell exactly the same size, one creature pose per cell, centred, feet on the same baseline within their row.
Row 1 (frame A): (1) rabbit; (2) boar; (3) murloc; (4) kobold
Row 2 (frame B): the same four creatures in the same columns, each differing only by a tiny idle motion (1-2 pixels up, ear or arm shift), identical silhouette otherwise
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; consistent pixel size, outline and lighting in all cells; no text, letters, numbers or logos; no Blizzard or Warcraft logos, emblems or exact copyrighted creature designs.
Use the attached image(s) as the style reference (same game, same pixel size, outline and palette).
```

- [x] J7 생성·저장 완료

---

## J8 · HUD / 퀘스트 UI 12종

- **저장 이름**: `tmp/pitch-src/ui/ui-forever-hud.png` (1536×1024)
- **스레드**: ↪ **이어서** — `T-JF-UI` (J2 대화)
- **레퍼런스 첨부**:
  - **필수** `tmp/pitch-src/ui/ui-hud-banners.png` — 기존 UI의 외곽선·금색/민트 팔레트 기준
  - **필수** J2 승인본 `tmp/pitch-src/ui/ui-forever-logo.png` — 포에버 포인트 컬러(보라-파랑, 금색) 기준
- **검수 체크**: 4열×3행 정확, 셀당 1개, **`!`/`?` 기호 외 글자·숫자 없음**(프레임/판은 전부 비어 있음), 바/프레임류가 **얇지 않고 두껍게**(높이가 셀의 35% 이상), 마젠타 잔여 없음, DING 버스트/빛기둥만 발광 허용
- **변환**: `pnpm convert:pitch-art -- ui forever-hud`
- **최종 사용**: 머리 위 마크(24~32px), 퀘스트 팝업, 캐스트 바, 경험치 바, 업적 토스트, 채팅 패널, 액션바 슬롯, 레벨업 연출, 코인

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura or background tint outside the outline, except where a cell below explicitly asks for glow. Add no watermark or signature.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the items (use coral red #ff4d6d instead).
Subject: twelve game UI elements for a fantasy MMO-style football parody. All frames and panels are completely EMPTY (no text, no numbers) and drawn chunky and thick, never thin.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly the same size, one item per cell, centred.
Row 1: (1) a bold golden-yellow exclamation-mark quest marker "!" (the only symbol drawn), chunky, fits a tall narrow box; (2) a bold golden-yellow question-mark quest marker "?" in the same style; (3) a bold grey "?" marker in the same style (quest in progress); (4) a golden hard-edged starburst with eight rays (level-up burst, no letters), with a soft warm glow allowed
Row 2: (5) a wide parchment quest scroll panel with rolled top and bottom ends and a thin brown border, the parchment area completely blank; (6) a thick horizontal cast-bar frame with a gold border and a dark navy empty interior, chunky: its height is at least one quarter of its width; (7) a thick horizontal experience-bar frame with a purple-blue (#6a5cff) border and a dark empty interior; (8) an achievement toast plaque of stone and gold trim with an empty round icon slot on the left and an empty blank plate on the right
Row 3: (9) a dark navy chat panel frame with a thin gold trim, completely empty inside; (10) a square action-bar slot: a dark navy square with a gold beveled border, empty; (11) a tall vertical golden light pillar beam for a level-up effect, glow allowed; (12) a single gold coin with a small pixel football embossed on it
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; consistent pixel size, outline and lighting in all cells; no text, letters or numbers anywhere except the two quest-marker symbols in cells (1)-(3); no Blizzard or Warcraft logos, emblems or exact copyrighted UI designs.
Use the attached image(s) as the style reference (same game, same pixel size, outline and palette).
```

- [x] J8 생성·저장 완료

---

## J9 · (옵션) 오그리 잔디마 배경 — 2차 맵

- **저장 이름**: `tmp/pitch-src/env/env-forever-orgrimmar-bg.png` (1536×1024 → 960×540)
- **스레드**: ↪ **이어서** — `T-JF-ENV`
- **레퍼런스 첨부**: **필수** J4 승인본 `env-forever-hub-bg.png` (구도·바닥 비율 기준, 색만 호드풍으로)
- **검수 체크**: J4와 같은 카메라 각도·아래 45% 걷기 영역, 글자 없음, 소품·캐릭터 없음
- **변환**: `pnpm convert:pitch-art -- env forever-orgrimmar-bg`
- **최종 사용**: 2차 맵 배경 960×540

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), warm late-afternoon sunlight from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Add no watermark or signature.
Background: this is a FULL opaque scene, no transparency, no magenta.
Subject: a warm red-brown desert-canyon fortress town square that parodies an orc-faction capital of a classic fantasy MMO, blended with football, seen from the same high 3/4 angle and with the same open walkable lower 45% as the attached background. Far top: red rock cliffs and a huge spiked wooden-and-iron fortress gate with crimson banners. Upper left: a hide-and-timber war hall with skull-free tribal decorations. Upper right: a tall stone watchtower with a rope bridge. Mid-ground on a dry hill: a white football goalpost with a torn net and faded chalk pitch lines on the dusty ground. The entire lower 45% is a wide flat packed-dust road with sparse tufts of dry grass and a few bones-free rocks at the far edges. Do NOT draw any small props or characters on the walkable ground. All the important shapes sit inside the central 16:9 band of the canvas.
Canvas: 1536x1024. No text, no letters, no numbers, no logos anywhere in the image; no Blizzard or Warcraft logos or exact copyrighted designs.
Use the attached image(s) as the style reference for pixel size, outline, palette and lighting and for camera angle and open ground layout, but change the architecture and colours as described.
```

- [x] J9 생성·저장 완료 (옵션)

---

## J10 · (옵션) 2차 맵 NPC 6종

- **저장 이름**: `tmp/pitch-src/characters/forever-npc-2.png` (1536×1024)
- **스레드**: ↪ **이어서** — `T-JF-CHR`
- **레퍼런스 첨부**: **필수** J5 승인본 `forever-npc.png`
- **검수 체크**: J5와 동일(4×3, 정면, A/B 미세 차이, 글자 없음)
- **변환**: `pnpm convert:pitch-art -- characters forever-npc-2`
- **최종 사용**: 2차 맵 NPC 96×96

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the characters (use coral red #ff4d6d instead).
Subject: six standing NPC characters for an orc-faction fortress parody, each FRONT-FACING, full body, the same chibi-ish game proportions and baseline as the attached NPC sheet. Each has two idle frames A and B (B differs only by a tiny 1-2 pixel breathing bob and a small prop shift):
(1) ORC QUEST GIVER: a tall green orc elder with a braided beard, red-and-black tabard, holding a wooden staff with a football charm; (2) TAUREN-STYLE ELDER: a gentle brown bull-headed giant in a leather vest holding a totem; (3) GOBLIN MERCHANT: a small green goblin with a big satchel and a gold coin in hand; (4) ORC GRUNT GUARD: a stern orc in spiked shoulder armor with a war axe upright; (5) WIND RIDER MASTER: an orc in a leather hood holding a horn, a small wolf pup at his feet; (6) COOK: a round orc in a stained apron with a big ladle.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly the same size, one character pose per cell, centred, feet on the same baseline within their row.
Row 1: (1) orc quest giver A; (2) orc quest giver B; (3) elder A; (4) elder B
Row 2: (1) goblin merchant A; (2) goblin merchant B; (3) grunt guard A; (4) grunt guard B
Row 3: (1) wind rider master A; (2) wind rider master B; (3) cook A; (4) cook B
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; consistent pixel size, outline and lighting in all cells; no text, letters, numbers or logos; no floating marks above heads; no Blizzard or Warcraft logos, emblems or exact copyrighted character designs.
Use the attached image(s) as the style reference (same game, same pixel size, outline and palette, same character proportions).
```

- [x] J10 생성·저장 완료 (옵션)
