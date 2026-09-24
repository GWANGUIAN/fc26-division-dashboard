# 선수 픽셀 아트 마우스 포인터 — 이미지 생성 런북

이 문서는 FC26 디비전 대시보드의 **브라우저 전용** 캐릭터 마우스 포인터를 만들기 위한 실행 문서다. Windows `.cur`/`.ani` 파일은 이 범위에 포함하지 않는다. 모든 원본 생성과 QA가 끝난 뒤에만 `pnpm convert:cursor-art`로 웹 에셋을 만든다.

## 1. 작업 단위와 파일 규칙

선수 한 명당 이미지 생성 대화 스레드 하나를 사용한다. 한 스레드에서 아래 순서로 세 장을 생성하며, 다음 선수는 반드시 새 스레드에서 시작한다.

1. `cursor-<id>-keypose.png` — 정체성·의상·화풍을 고정하는 기준 포즈. 원본 선수 레퍼런스를 첨부한다.
2. `cursor-<id>-glyph-grid.png` — 커서 글리프 12종 시트. 기준 포즈는 첨부하지 않아도 되며, 같은 스레드의 고정 색상과 화풍을 따른다.
3. `cursor-<id>-motion-sheet.png` — 4×3, 12프레임 루프 시트. **원본 선수 레퍼런스와 1번 key pose를 모두 다시 첨부**한다.

다운로드한 원본은 다음 위치에 정확히 둔다.

```
tmp/cursor-src/<id>/cursor-<id>-keypose.png
tmp/cursor-src/<id>/cursor-<id>-glyph-grid.png
tmp/cursor-src/<id>/cursor-<id>-motion-sheet.png
```

기본 레퍼런스는 `src/web/assets/group-photo/<id>.webp`다. 사용자가 보유한 더 정확한 원본 선수 레퍼런스가 있으면 그것을 우선 첨부한다. 우왁굳도 `src/web/assets/group-photo/woowakgood.webp`를 사용한다.

## 2. 모든 프롬프트에 적용할 규칙

- 2D 고해상도 픽셀 아트, 또렷한 정사각 픽셀, 1픽셀급 짙은 청록 외곽선, 2~3단 셀 셰이딩만 사용한다. 안티앨리어싱·그라데이션·사진 질감·3D 렌더·글자·로고·워터마크는 금지한다.
- 배경은 반드시 투명 PNG. 지원하지 않으면 완전 평면 `#FF00FF` 배경만 허용하며, 피사체에는 마젠타를 쓰지 않는다. 바닥·그림자·테두리도 만들지 않는다.
- TOTY 카드의 용암, 룬, 오로라, 드래곤, 벚꽃, 레이싱 등 **모티프는 절대 가져오지 않는다**. 아래의 단일 `주색`만 커서 글리프와 작은 강조에 사용한다. 보조색·글로우는 사용하지 않는다.
- 선수는 축구 유니폼을 입는다. 재닌만 검정 GK 유니폼과 흰 장갑을 쓰고, 우왁굳만 검정 수트·흰 셔츠·페리도트 그린 타이/포켓스퀘어를 입는 감독이다.
- 최종 화면에서는 글리프 약 16px, 캐릭터 약 30px으로 축소된다. 따라서 실루엣을 단순하고 읽기 쉽게 만들며, 작은 소품·복잡한 배경 효과를 넣지 않는다.

### 글리프 시트 고정 슬롯

`glyph-grid`는 1536×1024 캔버스의 4열×3행 시트다. 셀 경계선·텍스트·라벨은 넣지 않는다. 좌상단부터 행 우선으로 아래 순서를 지킨다.

1. 기본 화살표, 2. 링크/버튼 손, 3. I-빔 텍스트, 4. 정밀 십자선
5. 이동 손, 6. 잡는 손, 7. 가로 리사이즈, 8. 세로 리사이즈
9. 대각 리사이즈, 10. 대기/진행, 11. 금지, 12. 도움말

각 셀은 클릭 지점이 셀의 좌상단에 오도록 작은 글리프 하나만 배치한다. 12개는 기능적으로 구분되어야 하며, 같은 주색 채움 + 짙은 청록 외곽선만 사용한다.

### 애니메이션 시트 고정 규칙

`motion-sheet`은 1536×1024 캔버스의 4열×3행 시트다. 12칸 모두 같은 캐릭터·같은 카메라·같은 크기여야 한다. 프레임 순서는 좌→우, 위→아래이며 12번 다음이 1번으로 자연스럽게 연결된다. 캐릭터는 셀 중앙~하단에 두고, 발끝 또는 공의 기준점이 모든 칸에서 같은 행에 놓이게 한다. 격자선·텍스트·잔상·모션 블러는 금지한다.

## 3. 선수별 생성 프롬프트

각 섹션의 세 코드 블록은 **각각 한 장의 이미지 생성 요청**이다. `key pose`와 `motion sheet`에는 섹션에 쓴 레퍼런스를 첨부한다. 모든 캐릭터의 얼굴·헤어·시그니처는 첨부 레퍼런스와 일치시킨다.

### 다시바 — `tdnlamuron`

- 주색: 살구주황 `#ffb454`
- 레퍼런스: `src/web/assets/group-photo/tdnlamuron.webp`
- 고유 동작: 공을 등진 채 뒤꿈치로 패스하는 백힐 패스.

**`cursor-tdnlamuron-keypose.png`**
```text
Attached is the original character reference for 다시바. Create the same person as a compact full-body 2D pixel-art football player key pose. Keep the short black hair with orange and white streaks, cat ears, amber eyes, round-badge hairpin and black choker. Wear a plain white football kit with only apricot-orange (#ffb454) trim, white socks and boots; no motifs, particles, logos or text. Stand in a readable ready-to-pass pose with a small football near one heel. Transparent background, 1024x1024, single centred character, crisp 32-bit JRPG pixel art, dark teal one-pixel outline, no shadow.
```

**`cursor-tdnlamuron-glyph-grid.png`**
```text
Create a transparent 1536x1024 4-column by 3-row pixel-art cursor glyph sheet. Put one small, unmistakable cursor glyph in each equal cell, no labels and no grid lines. Slot order is: arrow, link hand, text I-beam, crosshair; move hand, grabbing hand, horizontal resize, vertical resize; diagonal resize, wait/progress, forbidden, help. Each glyph must be positioned toward its cell's upper-left click point, use ONLY apricot-orange #ffb454 fill with a dark teal pixel outline, and remain legible after shrinking to 16 pixels. No characters, no text, no background, no shadows, no gradients.
```

**`cursor-tdnlamuron-motion-sheet.png`**
```text
Using the attached original player reference and attached key pose as exact identity references, create a transparent 1536x1024 4-column by 3-row pixel-art animation sheet of 다시바 performing one loopable football backheel pass. The 12 frames progress from a balanced stance, a small wind-up, heel contact with a small ball, follow-through, then recover smoothly to the first stance. Keep her cat ears, black hair with orange/white streaks, badge hairpin and plain white kit with ONLY apricot-orange #ffb454 trim. Same scale, same baseline, one centred full-body character in every cell; no cell borders, text, effects, shadow, motif or motion blur.
```

### 쥬멩이 — `ju010228`

- 주색: 연두 `#d9f27a`
- 레퍼런스: `src/web/assets/group-photo/ju010228.webp`
- 고유 동작: 발바닥으로 공을 멈춘 뒤 짧게 굴리는 컨트롤 드리블.

**`cursor-ju010228-keypose.png`**
```text
Attached is the original character reference for 쥬멩이. Create the same person as a compact full-body 2D pixel-art football player key pose. Preserve very long green hair, white streak, side white ribbon and gentle expression. Wear a plain white football kit with only lime-green #d9f27a trim, white socks and boots; no vines, sprouts, motifs, logos or text. Show a calm close-control stance with a small football under one sole. Transparent background, 1024x1024, single centred character, crisp 32-bit JRPG pixel art, dark teal one-pixel outline, no shadow.
```

**`cursor-ju010228-glyph-grid.png`**
```text
Create a transparent 1536x1024 4-column by 3-row pixel-art cursor glyph sheet. Put one small, unmistakable cursor glyph in each equal cell, no labels and no grid lines. Slot order is: arrow, link hand, text I-beam, crosshair; move hand, grabbing hand, horizontal resize, vertical resize; diagonal resize, wait/progress, forbidden, help. Each glyph must be positioned toward its cell's upper-left click point, use ONLY lime-green #d9f27a fill with a dark teal pixel outline, and remain legible after shrinking to 16 pixels. No characters, no text, no background, no shadows, no gradients.
```

**`cursor-ju010228-motion-sheet.png`**
```text
Using the attached original player reference and attached key pose as exact identity references, create a transparent 1536x1024 4-column by 3-row pixel-art animation sheet of 쥬멩이 looping a sole-stop and gentle rolling dribble with one small football. The 12 frames must visibly progress and return to the first stance. Keep her long green hair, white streak and ribbon, and a plain white kit with ONLY lime-green #d9f27a trim. Same scale and baseline in every cell; no borders, text, background, effects, shadows, motifs or motion blur.
```

### 문모모 — `doormomo`

- 주색: 보라 `#c9a6ff`
- 레퍼런스: `src/web/assets/group-photo/doormomo.webp`
- 고유 동작: 허벅지 트래핑으로 공을 받아 발밑으로 내리는 동작.

**`cursor-doormomo-keypose.png`**
```text
Attached is the original character reference for 문모모. Create the same person as a compact full-body 2D pixel-art football player key pose. Preserve the short purple-black bob, purple tips, white headband with plain red badge shape, silver star hairpin and purple eyes. Wear a plain white football kit with only violet #c9a6ff trim. Show a poised thigh-trap stance with one small football. No runes, magic, motifs, logos or text. Transparent background, 1024x1024, single centred character, crisp 32-bit JRPG pixel art, dark teal outline, no shadow.
```

**`cursor-doormomo-glyph-grid.png`**
```text
Create a transparent 1536x1024 4-column by 3-row pixel-art cursor glyph sheet. Put one small, unmistakable cursor glyph in each equal cell, no labels and no grid lines. Slot order is: arrow, link hand, text I-beam, crosshair; move hand, grabbing hand, horizontal resize, vertical resize; diagonal resize, wait/progress, forbidden, help. Position each glyph toward its upper-left click point. Use ONLY violet #c9a6ff fill with a dark teal pixel outline, readable at 16 pixels. No characters, text, background, shadows or gradients.
```

**`cursor-doormomo-motion-sheet.png`**
```text
Using the attached original player reference and attached key pose as exact identity references, create a transparent 1536x1024 4-column by 3-row pixel-art animation sheet of 문모모 looping a controlled thigh trap: ball descends, thigh cushions it, ball drops to the boot, then she returns to the opening ready pose. Keep the bob, headband, badge shape and star hairpin, and a plain white kit with ONLY violet #c9a6ff trim. Same scale and baseline in all 12 cells; no borders, text, magic effects, background, shadow or motion blur.
```

### 뽀린걸 — `bboringirl`

- 주색: 빨강 `#ff5c5c`
- 레퍼런스: `src/web/assets/group-photo/bboringirl.webp`
- 고유 동작: 한 발로 강하게 차는 슈팅 팔로스루.

**`cursor-bboringirl-keypose.png`**
```text
Attached is the original character reference for 뽀린걸. Create the same person as a compact full-body 2D pixel-art football player key pose. Keep the silver-grey hair, red-pink side streaks, low side ponytail, amber eyes and ahoge. Wear a plain white football kit with only vivid red #ff5c5c trim. Show a compact shooting-ready pose with a small football by the leading boot. No machinery, circuits, motifs, logos or text. Transparent background, 1024x1024, centred character, crisp 32-bit JRPG pixel art, dark teal outline, no shadow.
```

**`cursor-bboringirl-glyph-grid.png`**
```text
Create a transparent 1536x1024 4-column by 3-row pixel-art cursor glyph sheet. Put one small, unmistakable cursor glyph in each equal cell, no labels and no grid lines. Slot order is: arrow, link hand, text I-beam, crosshair; move hand, grabbing hand, horizontal resize, vertical resize; diagonal resize, wait/progress, forbidden, help. Position each glyph toward its upper-left click point. Use ONLY vivid red #ff5c5c fill with a dark teal pixel outline, readable at 16 pixels. No characters, text, background, shadows or gradients.
```

**`cursor-bboringirl-motion-sheet.png`**
```text
Using the attached original player reference and attached key pose as exact identity references, create a transparent 1536x1024 4-column by 3-row pixel-art animation sheet of 뽀린걸 looping a compact power-shot follow-through. The ball is tapped forward, the kicking leg follows through, and frame 12 returns naturally to frame 1. Keep silver-grey hair with red-pink streaks and a plain white kit with ONLY vivid red #ff5c5c trim. Same size and foot baseline in every cell; no borders, text, background, machinery motifs, shadow or motion blur.
```

### 한결 — `kaksjak0730`

- 주색: 사파이어 블루 `#7ec8ff`
- 레퍼런스: `src/web/assets/group-photo/kaksjak0730.webp`
- 고유 동작: 아웃사이드 터치로 공을 옆으로 옮기는 드리블.

**`cursor-kaksjak0730-keypose.png`**
```text
Attached is the original character reference for 한결. Create the same person as a compact full-body 2D pixel-art football player key pose. Preserve very long black high-ponytail hair, blue eyes, white cat-ear headphones and star hairpin. Wear a plain white football kit with only sapphire-blue #7ec8ff trim. Show an outside-foot dribble-ready stance with a small football. No night sky, glass, motifs, logos or text. Transparent background, 1024x1024, centred character, crisp 32-bit JRPG pixel art, dark teal outline, no shadow.
```

**`cursor-kaksjak0730-glyph-grid.png`**
```text
Create a transparent 1536x1024 4-column by 3-row pixel-art cursor glyph sheet. Put one small, unmistakable cursor glyph in each equal cell, no labels and no grid lines. Slot order is: arrow, link hand, text I-beam, crosshair; move hand, grabbing hand, horizontal resize, vertical resize; diagonal resize, wait/progress, forbidden, help. Position each glyph toward its upper-left click point. Use ONLY sapphire-blue #7ec8ff fill with a dark teal pixel outline, readable at 16 pixels. No characters, text, background, shadows or gradients.
```

**`cursor-kaksjak0730-motion-sheet.png`**
```text
Using the attached original player reference and attached key pose as exact identity references, create a transparent 1536x1024 4-column by 3-row pixel-art animation sheet of 한결 looping an outside-foot dribble touch, shifting a small football sideways then returning to the ready stance. Keep her high ponytail, cat-ear headphones and star hairpin, and a plain white kit with ONLY sapphire-blue #7ec8ff trim. Same scale and baseline in all 12 cells; no borders, text, background, motifs, shadow or motion blur.
```

### 핑구 — `sjh4018`

- 주색: 하늘색 `#a6dcff`
- 레퍼런스: `src/web/assets/group-photo/sjh4018.webp`
- 고유 동작: 낮게 몸을 던져 헤딩하는 다이빙 헤더.

**`cursor-sjh4018-keypose.png`**
```text
Attached is the original character reference for 핑구. Create the same person as a compact full-body 2D pixel-art football player key pose. Preserve very long sky-blue hair, straight parted bangs, black hairband, side hair clip, blue eyes and cheerful expression. Wear a plain white football kit with only sky-blue #a6dcff trim. Show a low forward-leaning header-ready pose with a small football. No clouds, feathers, motifs, logos or text. Transparent background, 1024x1024, centred character, crisp 32-bit JRPG pixel art, dark teal outline, no shadow.
```

**`cursor-sjh4018-glyph-grid.png`**
```text
Create a transparent 1536x1024 4-column by 3-row pixel-art cursor glyph sheet. Put one small, unmistakable cursor glyph in each equal cell, no labels and no grid lines. Slot order is: arrow, link hand, text I-beam, crosshair; move hand, grabbing hand, horizontal resize, vertical resize; diagonal resize, wait/progress, forbidden, help. Position each glyph toward its upper-left click point. Use ONLY sky-blue #a6dcff fill with a dark teal pixel outline, readable at 16 pixels. No characters, text, background, shadows or gradients.
```

**`cursor-sjh4018-motion-sheet.png`**
```text
Using the attached original player reference and attached key pose as exact identity references, create a transparent 1536x1024 4-column by 3-row pixel-art animation sheet of 핑구 looping a low diving header toward a small football, then recovering cleanly to the first ready pose. Keep her very long sky-blue hair, hairband and side clip, with hair movement limited and a plain white kit with ONLY sky-blue #a6dcff trim. Same scale and baseline in all cells; no borders, text, background, cloud motifs, shadow or motion blur.
```

### 해파린 — `haepalin`

- 주색: 라벤더 `#e0a6ff`
- 레퍼런스: `src/web/assets/group-photo/haepalin.webp`
- 고유 동작: 공을 끊어 내는 짧은 슬라이딩 태클.

**`cursor-haepalin-keypose.png`**
```text
Attached is the original character reference for 해파린. Create the same person as a compact full-body 2D pixel-art football player key pose. Preserve the short lavender-periwinkle bob, ahoge, jellyfish hair ornament, heart clips and blue eyes. Wear a plain white football kit with only lavender #e0a6ff trim. Show a compact defensive slide-ready pose with a small football. No jellyfish, sea creatures, motifs, logos or text. Transparent background, 1024x1024, centred character, crisp 32-bit JRPG pixel art, dark teal outline, no shadow.
```

**`cursor-haepalin-glyph-grid.png`**
```text
Create a transparent 1536x1024 4-column by 3-row pixel-art cursor glyph sheet. Put one small, unmistakable cursor glyph in each equal cell, no labels and no grid lines. Slot order is: arrow, link hand, text I-beam, crosshair; move hand, grabbing hand, horizontal resize, vertical resize; diagonal resize, wait/progress, forbidden, help. Position each glyph toward its upper-left click point. Use ONLY lavender #e0a6ff fill with a dark teal pixel outline, readable at 16 pixels. No characters, text, background, shadows or gradients.
```

**`cursor-haepalin-motion-sheet.png`**
```text
Using the attached original player reference and attached key pose as exact identity references, create a transparent 1536x1024 4-column by 3-row pixel-art animation sheet of 해파린 looping a short, safe sliding tackle that taps a small football away and recovers to the opening defensive pose. Keep her bob, ahoge, jellyfish ornament and heart clips, with a plain white kit trimmed ONLY in lavender #e0a6ff. Same scale and baseline in all cells; no borders, text, background, sea motifs, shadow or motion blur.
```

### 리냐 — `lina0108`

- 주색: 선명한 핑크 `#ff8fc0`
- 레퍼런스: `src/web/assets/group-photo/lina0108.webp`
- 고유 동작: 발등으로 공을 넘기는 레인보우 플릭.

**`cursor-lina0108-keypose.png`**
```text
Attached is the original character reference for 리냐. Create the same person as a compact full-body 2D pixel-art football player key pose. Preserve long messy red-pink hair, white streak, small pink-and-white horns, amber eyes and playful smirk. Wear a plain white football kit with only vivid pink #ff8fc0 trim. Show a playful rainbow-flick-ready stance with a small football near the boot. No blossoms, motifs, logos or text. Transparent background, 1024x1024, centred character, crisp 32-bit JRPG pixel art, dark teal outline, no shadow.
```

**`cursor-lina0108-glyph-grid.png`**
```text
Create a transparent 1536x1024 4-column by 3-row pixel-art cursor glyph sheet. Put one small, unmistakable cursor glyph in each equal cell, no labels and no grid lines. Slot order is: arrow, link hand, text I-beam, crosshair; move hand, grabbing hand, horizontal resize, vertical resize; diagonal resize, wait/progress, forbidden, help. Position each glyph toward its upper-left click point. Use ONLY vivid pink #ff8fc0 fill with a dark teal pixel outline, readable at 16 pixels. No characters, text, background, shadows or gradients.
```

**`cursor-lina0108-motion-sheet.png`**
```text
Using the attached original player reference and attached key pose as exact identity references, create a transparent 1536x1024 4-column by 3-row pixel-art animation sheet of 리냐 looping a compact rainbow flick: boot scoops a small ball upward, she follows through playfully, then returns to frame 1. Keep the messy red-pink hair, white streak and small horns, and a plain white kit with ONLY vivid pink #ff8fc0 trim. Same scale and baseline in all cells; no borders, text, background, blossom motifs, shadow or motion blur.
```

### 빙밍 — `tleod1818`

- 주색: 에메랄드 `#5cffb8`
- 레퍼런스: `src/web/assets/group-photo/tleod1818.webp`
- 고유 동작: 공을 가슴으로 받아 발밑으로 내리는 체스트 컨트롤.

**`cursor-tleod1818-keypose.png`**
```text
Attached is the original character reference for 빙밍. Create the same person as a compact full-body 2D pixel-art football player key pose. Preserve black hair in a bun, green leaf hairpin, white flower, blunt bangs, green eyes and black ribbon choker. Wear a plain white football kit with only emerald #5cffb8 trim. Show a chest-control-ready stance with a small football. No storm, lightning, motifs, logos or text. Transparent background, 1024x1024, centred character, crisp 32-bit JRPG pixel art, dark teal outline, no shadow.
```

**`cursor-tleod1818-glyph-grid.png`**
```text
Create a transparent 1536x1024 4-column by 3-row pixel-art cursor glyph sheet. Put one small, unmistakable cursor glyph in each equal cell, no labels and no grid lines. Slot order is: arrow, link hand, text I-beam, crosshair; move hand, grabbing hand, horizontal resize, vertical resize; diagonal resize, wait/progress, forbidden, help. Position each glyph toward its upper-left click point. Use ONLY emerald #5cffb8 fill with a dark teal pixel outline, readable at 16 pixels. No characters, text, background, shadows or gradients.
```

**`cursor-tleod1818-motion-sheet.png`**
```text
Using the attached original player reference and attached key pose as exact identity references, create a transparent 1536x1024 4-column by 3-row pixel-art animation sheet of 빙밍 looping a chest control: a small ball drops, chest cushions it, it falls to the boot, and she returns to the opening stance. Keep the bun, leaf hairpin, flower and ribbon choker, and a plain white kit with ONLY emerald #5cffb8 trim. Same scale and baseline in all cells; no borders, text, background, storm motifs, shadow or motion blur.
```

### 재닌 — `janine95kim`

- 주색: 스카이 블루 `#a6dcff`
- 레퍼런스: `src/web/assets/group-photo/janine95kim.webp`
- 고유 동작: 검정 GK 유니폼으로 공을 막는 선방 다이빙.

**`cursor-janine95kim-keypose.png`**
```text
Attached is the original character reference for 재닌. Create the same person as a compact full-body 2D pixel-art goalkeeper key pose. Preserve long wavy vivid blue hair, round glasses, white cap-style headband with tiny ornament, black headset microphone and black choker. Wear a black long-sleeve goalkeeper kit with ONLY sky-blue #a6dcff trim, white gloves, black shorts, socks and boots. Show a confident keeper-ready stance with a small football. No frost, aurora, motifs, logos or text. Transparent background, 1024x1024, centred character, crisp 32-bit JRPG pixel art, dark teal outline, no shadow.
```

**`cursor-janine95kim-glyph-grid.png`**
```text
Create a transparent 1536x1024 4-column by 3-row pixel-art cursor glyph sheet. Put one small, unmistakable cursor glyph in each equal cell, no labels and no grid lines. Slot order is: arrow, link hand, text I-beam, crosshair; move hand, grabbing hand, horizontal resize, vertical resize; diagonal resize, wait/progress, forbidden, help. Position each glyph toward its upper-left click point. Use ONLY sky-blue #a6dcff fill with a dark teal pixel outline, readable at 16 pixels. No characters, text, background, shadows or gradients.
```

**`cursor-janine95kim-motion-sheet.png`**
```text
Using the attached original player reference and attached key pose as exact identity references, create a transparent 1536x1024 4-column by 3-row pixel-art animation sheet of 재닌 looping a goalkeeper diving save. The 12 frames show a low set, side dive with white gloved hands blocking a small football, landing, then a smooth recovery to the first stance. Keep her blue hair, glasses, headband and headset, and the black GK kit with ONLY sky-blue #a6dcff trim. Same scale and baseline in all cells; no borders, text, background, frost effects, shadow or motion blur.
```

### 하치 — `hachi97`

- 주색: 골드 앰버 `#ffe29e`
- 레퍼런스: `src/web/assets/group-photo/hachi97.webp`
- 고유 동작: 발리 슛을 위해 공을 띄우고 차는 동작.

**`cursor-hachi97-keypose.png`**
```text
Attached is the original character reference for 하치. Create the same person as a compact full-body 2D pixel-art football player key pose. Preserve the short black bob, white streak, small white antler-like ornaments, purple eyes and big smile. Wear a plain white football kit with only gold-amber #ffe29e trim. Show a compact volley-ready pose with a small football. No dragons, fire, motifs, logos or text. Transparent background, 1024x1024, centred character, crisp 32-bit JRPG pixel art, dark teal outline, no shadow.
```

**`cursor-hachi97-glyph-grid.png`**
```text
Create a transparent 1536x1024 4-column by 3-row pixel-art cursor glyph sheet. Put one small, unmistakable cursor glyph in each equal cell, no labels and no grid lines. Slot order is: arrow, link hand, text I-beam, crosshair; move hand, grabbing hand, horizontal resize, vertical resize; diagonal resize, wait/progress, forbidden, help. Position each glyph toward its upper-left click point. Use ONLY gold-amber #ffe29e fill with a dark teal pixel outline, readable at 16 pixels. No characters, text, background, shadows or gradients.
```

**`cursor-hachi97-motion-sheet.png`**
```text
Using the attached original player reference and attached key pose as exact identity references, create a transparent 1536x1024 4-column by 3-row pixel-art animation sheet of 하치 looping a compact volley: she pops a small football upward, strikes it mid-air, then returns to the ready pose. Keep the black bob, white streak and white antler ornaments, with a plain white kit trimmed ONLY in gold-amber #ffe29e. Same scale and baseline in all cells; no borders, text, background, dragon motifs, shadow or motion blur.
```

### 우왁굳 — `woowakgood`

- 주색: 페리도트 그린 `#7fdca4`
- 레퍼런스: `src/web/assets/group-photo/woowakgood.webp`
- 고유 동작: 수트를 입고 전술 보드를 가리키며 터치라인 지시를 내리는 감독 동작.

**`cursor-woowakgood-keypose.png`**
```text
Attached is the original character reference for 우왁굳. Create the same adult male mascot-headed club manager as a compact full-body 2D pixel-art key pose. Preserve the golden-tan capybara-like mascot head, small round ears, black headset with boom microphone and small red badge. He is a coach, not a player: wear a sharply tailored black suit, white shirt, peridot-green #7fdca4 necktie and pocket square, black dress shoes. Show a confident touchline stance holding a tiny blank tactics clipboard; no football kit, no motorsport, logos, badges, text or brand marks. Transparent background, 1024x1024, centred character, crisp 32-bit JRPG pixel art, dark teal outline, no shadow.
```

**`cursor-woowakgood-glyph-grid.png`**
```text
Create a transparent 1536x1024 4-column by 3-row pixel-art cursor glyph sheet. Put one small, unmistakable cursor glyph in each equal cell, no labels and no grid lines. Slot order is: arrow, link hand, text I-beam, crosshair; move hand, grabbing hand, horizontal resize, vertical resize; diagonal resize, wait/progress, forbidden, help. Position each glyph toward its upper-left click point. Use ONLY peridot-green #7fdca4 fill with a dark teal pixel outline, readable at 16 pixels. No characters, text, background, shadows, gradients, motorsport cues or brand marks.
```

**`cursor-woowakgood-motion-sheet.png`**
```text
Using the attached original manager reference and attached key pose as exact identity references, create a transparent 1536x1024 4-column by 3-row pixel-art animation sheet of 우왁굳 looping a touchline tactical instruction. He takes one small step, points firmly at a tiny blank tactics clipboard, makes a concise coaching gesture, then returns naturally to frame 1. Keep the capybara-like mascot head, ears, headset, black tailored suit, white shirt, and ONLY peridot-green #7fdca4 tie and pocket square. No football uniform, motorsport, logos, text, brand marks, background, shadow or motion blur. Same scale and baseline in every cell.
```

## 4. 생성 후 QA와 변환

각 선수의 세 장이 모두 준비된 뒤 확인한다.

- [ ] 3개 파일명·경로가 정확하고, key pose와 motion sheet에는 지정 레퍼런스가 첨부됐다.
- [ ] glyph-grid는 4×3 12칸, 지정 순서, 투명/마젠타 배경, 글리프 식별성, 좌상단 클릭 지점을 만족한다.
- [ ] motion-sheet은 12개의 서로 다른 프레임, 고정 기준선, 자연스러운 12→1 루프, 인물 식별성, 투명/마젠타 배경을 만족한다.
- [ ] 주색 하나만 사용했으며 카드 모티프·글자·로고·워터마크·그림자·그라데이션이 없다.
- [ ] 재닌은 검정 GK 유니폼과 장갑, 우왁굳은 수트와 감독 포즈다.

통과한 원본만 아래 명령으로 가공한다.

```bash
pnpm convert:cursor-art -- <id>
pnpm convert:cursor-art -- --all
```

변환 결과는 `src/web/assets/cursors/<id>/`에 글리프 12장과 `motion-strip.webp`로 생성된다. 변환 스크립트가 누락 파일, 셀 비율, 투명도, 마젠타 잔여, 프레임 크기와 비어 있는 셀을 검사한다.
