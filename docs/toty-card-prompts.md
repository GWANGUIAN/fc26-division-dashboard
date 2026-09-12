# TOTY 3D 카드 — 이미지 생성 프롬프트 레퍼런스

`src/web/toty-card/`에 구현된 "3D 카드 보기" 팝업에 쓰이는 카드 아트 생성용 프롬프트 모음. 한 명씩 이미지를 만들 때마다 이 문서의 해당 섹션을 참고해서 생성 → 파일명 규칙대로 저장 → 변환 스크립트 실행 순으로 진행하면 됨.

## 디자인 방향 (중요)

**테두리(프레임) 모양은 전부 하치 카드와 동일한 방패형 실루엣을 유지**하되(카드 안쪽 창 위치가 하치와 같아야 CSS 틸트/패럴랙스 레이아웃이 그대로 재사용됨), **테두리에 박힌 장식과 배경 재질은 선수마다 완전히 다른 모티프**로 감. 즉 "크리스탈을 색만 바꾼 버전"이 아니라 "같은 방패 틀 안에 서로 다른 소재(용암/식물/룬문양/기계 회로/유리별/구름/등나무꽃/벚꽃/심해생물/서리)가 들어간 카드 시리즈"임. 아래 표의 "모티프" 컬럼 참고.

## 공통 작업 방식

1. **캔버스**: 프레임/배경/캐릭터 전부 **1060×1484px** (5:7, 하치 카드와 동일 비율), 알파 채널 있는 투명 PNG로 생성.
   - 사용하는 생성 도구가 진짜 투명 배경(RGBA)을 지원하는지 먼저 확인 (예: ChatGPT 이미지 생성에 "배경 투명"을 명시, Adobe Firefly/Recraft의 투명 배경 옵션 등). 지원 안 하면 순수 그린/마젠타 배경으로 생성 후 배경 제거 도구로 따로 제거.
   - 생성 후 어두운 배경이나 체크무늬 배경에 올려서 가장자리에 원래 배경색 잔여 테두리(halo)가 없는지 꼭 확인.
2. **레퍼런스 이미지 첨부**: 프레임은 하치 프레임(`src/web/assets/toty-cards/hachi97-frame.webp`)을 **구조/실루엣 레퍼런스로만** 첨부 (장식·소재는 아래 프롬프트대로 완전히 다르게). 배경은 소재 자체가 다르므로 레퍼런스 없이 프롬프트만으로 생성해도 됨(원하면 하치 배경을 "구도" 참고용으로만 첨부). 캐릭터는 해당 스트리머의 실제 사진을 레퍼런스로 첨부.
3. **파일명 규칙**: `<id>-frame.webp`, `<id>-background.webp`, `<id>-character.webp` (아래 표의 `id` 컬럼 사용). PNG로 받으면 아래 명령으로 변환·이동:
   ```bash
   pnpm convert:card-art -- <id> <PNG가 들어있는 폴더 경로>
   ```
   예: `다시바` 3장을 `public/test/`에 `frame.png`/`background.png`/`character.png`로 받아뒀다면 `pnpm convert:card-art -- tdnlamuron`.
4. 3장(frame/background/character)이 모두 갖춰진 선수만 사이트에 "3D 카드 보기" 버튼이 자동으로 뜸 (`src/web/toty-card/totyCardAssets.ts`가 `src/web/assets/toty-cards/`를 자동 스캔).
5. **포지션/디비전/이름 글자색**은 이미지와 별개로 `src/web/toty-card/totyCardTheme.ts`에 선수 `id`별로 지정되어 있음. 새 선수를 추가하면 이 파일에 `{ color, glow }` 항목을 하나 추가해서 그 선수 카드 팔레트에 어울리는 색으로 맞춰야 함 (안 넣으면 하치 금색으로 기본 표시됨). `color`는 본문 글자색, `glow`는 카드 호버 시 이름 주변에 번지는 은은한 하이라이트 색.
6. **(선택) 움짤 다운로드용 애니메이션 WebP**: 팝업의 "움짤로 저장" 버튼은 `<id>-preview.webp`가 있을 때만 뜸. 3장 이미지 다 넣은 뒤 `pnpm dev`를 켜둔 상태에서:
   ```bash
   pnpm generate:toty-preview -- <id>
   ```
   를 실행하면 실제 카드를 헤드리스 브라우저로 열어 가상 마우스 경로로 훑으면서 프레임을 캡처하고, 투명 배경 애니메이션 WebP로 합쳐서 `src/web/assets/toty-cards/<id>-preview.webp`에 저장함(브라우저에서 실시간으로 만드는 게 아니라 미리 만들어두는 방식). Playwright 크로미움이 없으면 최초 1회 `npx playwright install chromium` 필요.

## 공용 팝업 배경 이미지 (완료 — 1장, 전 선수 공통)

3D 카드 팝업을 열었을 때 카드 뒤에 깔리는 전체화면 배경. `src/web/assets/toty-cards/popup-backdrop.webp`로 이미 추가됨.

- **캔버스**: 2560×1440px, PNG 또는 JPG (투명 불필요, 이후 webp로 변환)
- **프롬프트**:
  ```
  A premium dark studio showcase backdrop for a trading-card reveal screen.
  Deep navy-to-black radial gradient, a soft faint spotlight glow centered in
  the frame, fine floating dust and bokeh light particles drifting in the air,
  subtle out-of-focus stadium light beams crossing diagonally in the distant
  background. Low contrast, desaturated, moody and cinematic — neutral enough
  that any brightly colored object placed in front of it (gold, pink, emerald
  green, sky blue) will stand out clearly. No text, no logos, no people, no
  readable shapes. Ultra-wide, minimal, elegant, 4K, 2560x1440.
  ```

## 카드 뒷면 (선수별로 각각 생성 — 미구현)

팝업이 열리면 카드가 "팩 오프닝"처럼 미스터리 뒷면 → 실제 앞면으로 뒤집히는 리빌 연출(`TotyCardReveal.tsx`)에 쓰이는 카드 뒷면 이미지. **프레임/배경/캐릭터처럼 선수마다 따로 생성** — 그 선수 카드의 모티프/컬러를 그대로 살린 "봉인된 상태"의 뒷면이 되도록. 아래 선수별 세트 섹션마다 **뒷면** 프롬프트가 같이 있음.

- **캔버스**: 1060×1484px (다른 3장과 동일 비율), 알파 채널 있는 투명 PNG
- **레퍼런스**: 하치 프레임 이미지를 실루엣 참고용으로만 첨부 (프레임과 동일한 방식)
- **파일명**: `<id>-card-back.webp` (`totyCardAssets.ts`가 자동 스캔 — 없어도 다른 3장만으로 카드는 정상 동작하고, 리빌 연출은 플레이스홀더 "?"로 대체됨)

## 배경 반짝임 오버레이 (선수별로 각각 생성 — 미구현)

지금 배경(`<id>-background.webp`)은 정적 이미지라 카드가 심심해 보이는 문제 — **기존 배경은 그대로 두고**, 그 위에 겹쳐서 CSS로 계속 은은하게 움직이는(느린 드리프트 + opacity 펄스) "빛 효과만 있는" 투명 오버레이 레이어를 선수마다 추가함. 배경 자체를 다시 만들지 않는 이유: 이미 확정된 10장+보너스 배경을 전부 재생성하면 작업량이 두 배가 되고, 오버레이를 옅고 성기게 만들면 기존 배경에 박힌 빛 효과와 겹쳐도 자연스러움. 아래 선수별 세트 섹션마다 **빛 효과** 프롬프트가 같이 있음.

- **캔버스**: 1060×1484px (다른 레이어와 동일 비율), 알파 채널 있는 투명 PNG — 반짝이는 입자/빛만 그리고 나머지는 전부 투명
- **레퍼런스**: 불필요 (소재가 아니라 빛 자체라 프레임/배경 참고 없이 프롬프트만으로 생성)
- **파일명**: `<id>-background-glow.webp` (`totyCardAssets.ts`가 자동 스캔 — 없어도 나머지 레이어만으로 카드는 정상 동작함)
- **적용 방식**: `TotyCardVisual.tsx`에서 이 레이어가 **캐릭터 바로 위**에 얹힘(캐릭터보다 나중에 그려짐), 마우스와 무관하게 항상 재생되는 느린 CSS 키프레임(드리프트 이동 + 옅은 opacity 깜빡임)을 적용 — 기존 `.toty-card__idle-bg`/`__idle-char`와 같은 패턴.
- **주의 (중요)**: 캐릭터 위에 그대로 얹히는 레이어라, 입자가 크거나 캔버스 중앙에 몰려 있으면(특히 "마법진"처럼 원형 도형을 큼직하게 그리는 모티프) 캐릭터를 가려버림. **작고 성긴 입자를 화면 가장자리·모서리 위주로 흩뿌리고, 캐릭터가 서는 중앙~하단 영역은 비워두도록** 프롬프트에 명시할 것.

## 선수별 세트 (10개)

순서·컬러·모티프 확정본:

| # | 선수 | id (파일명 접두사) | 포지션 | 메인 컬러 | 모티프 (크리스탈 대체) |
|---|------|---------------------|--------|-----------|--------------------------|
| 1 | 다시바 | `tdnlamuron` | WF | 살구주황빛 | 용암/잉걸불 (화산암 + 마그마) |
| 2 | 쥬멩이 | `ju010228` | ST | 연두색 | 봄 넝쿨/새싹 (이끼 낀 돌 + 덩굴) |
| 3 | 문모모 | `doormomo` | CDM | 보라색 | 마법진/룬문양 (석판 + 보라빛 룬) |
| 4 | 뽀린걸 | `bboringirl` | CM | 회색 + 빨강 | 기계 장갑판 + 붉은 회로 |
| 5 | 한결 | `kaksjak0730` | CM | 딥블랙 + 사파이어 블루 | 밤하늘 유리 파편 (별빛 조각) |
| 6 | 핑구 | `sjh4018` | CB | 하늘색 + 연보라 | 구름/깃털 |
| 7 | 해파린 | `haepalin` | CB | 연한 라벤더 + 진보라 | 심해 해파리/발광생물 |
| 8 | 리냐 | `lina0108` | FB | 선명한 핑크 + 연분홍 | 벚꽃 가지/꽃잎 |
| 9 | 빙밍 | `tleod1818` | FB | 어두운 남색 + 에메랄드 | 폭풍우/번개 |
| 10 | 재닌 | `janine95kim` | GK | 스카이 블루 | 서리/오로라 |

각 세트마다 자세는 서로 겹치지 않게, 포지션·모티프 무드에 맞춰 배정함.

> **모티프 수정 이력**: 원래 빙밍이 심해 산호/해파리 모티프였는데, 해파린이 실제로 해파리 RP를 가지고 있어서 서로 뒤바뀌어 있던 것 — 심해/해파리는 해파린으로, 빙밍은 겹치지 않는 폭풍우/번개 모티프로 변경함. **해파린·빙밍은 이미 생성된 이미지(`haepalin-*.webp`, `tleod1818-*.webp`)가 옛 모티프라서, 아래 새 프롬프트로 재생성해서 같은 파일명으로 덮어써야 함.**

---

### 1. 다시바 — `tdnlamuron` — 살구주황빛 · 용암/잉걸불 (WF)

**프레임** (하치 프레임 이미지는 실루엣 참고용으로만 첨부):
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at the top center, same inner content
window position — but redesign the surface material completely: a
dark volcanic obsidian-rock frame with a molten lava/ember motif bursting
from the top-left and bottom-right corners instead of crystal shards —
glowing amber-orange magma cracks running through the black rock, small
embers and sparks drifting off the lava cluster. No player, no text, no
stats. Entire canvas outside the frame's own linework (including the inner
content window) must be fully transparent. PNG with alpha channel,
1060x1484.
```

**배경**:
```
Abstract premium trading-card background art, portrait orientation. Cracked
dark volcanic rock slab with glowing amber-orange magma veins running
through it, a cluster of molten lava and embers bursting from the
upper-right corner, drifting spark particles and heat haze, dramatic warm
rim lighting. No characters, no people, no border/frame, no text. High
detail, 4K, PNG, 1060x1484.
```

**캐릭터** (다시바 참고 사진 첨부):
```
Turn the reference photo into a stylized premium trading-card 3D player
render, semi-realistic style. Soccer kit in warm apricot-orange and cream
tones. Dynamic explosive mid-sprint dribbling pose, ball just ahead of the
feet, leaning forward with determination, one arm pumping forward for
momentum. Viewed from a slight low front 3/4 angle, visible head to
mid-thigh. Warm ember-lit rim lighting matching the lava palette. No frame,
no text, no background — fully transparent PNG with alpha channel,
1060x1484, leave open space above the head and below the waist for
name/stat overlays.
```

**뒷면**:
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at top center — design the BACK of this
same card (not the front): a dark volcanic obsidian holographic foil
surface, with faint glowing amber-orange magma cracks running beneath the
prismatic sheen, a single bold ember/flame emblem centered in the middle of
the shield (no readable text, no logos, no player), warm amber-orange
metallic trim tracing the inner border. Moody, premium, mysterious — looks
like the unrevealed back of this card before it's flipped. No text, no
numbers, no real brand marks. Entire canvas outside the frame's own
linework must stay fully transparent (alpha 0), only the shield shape
itself is opaque. 1060x1484px, transparent PNG.
```

**빛 효과**:
```
Abstract loose particle/light-effect overlay ONLY, portrait orientation,
1060x1484. Floating embers and sparks drifting slowly upward, with a soft
warm amber-orange heat-haze glow, like cinders rising off molten lava.
No solid material, no rock or stone texture, no border/frame, no
characters, no text — this is a light layer meant to be composited on top
of the existing card background, not a full scene. High detail, soft glow
bloom, 4K. Entire canvas outside the glowing particles themselves must
stay fully transparent (alpha 0), transparent PNG.
```

---

### 2. 쥬멩이 — `ju010228` — 연두색 · 봄 넝쿨/새싹 (ST)

**프레임** (하치 프레임 이미지는 실루엣 참고용으로만 첨부):
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at the top center, same inner content
window position — but redesign the surface material completely: pale mossy
stone, with fresh spring vines, budding leaves, and tiny dew-lit sprouts
bursting from the top-left and bottom-right corners instead of crystal
shards — lime-green foliage with soft morning dew sparkle. No player, no
text, no stats. Entire canvas outside the frame's own linework (including
the inner content window) must be fully transparent. PNG with alpha
channel, 1060x1484.
```

**배경**:
```
Abstract premium trading-card background art, portrait orientation. Pale
moss-covered stone slab with soft green vine-veins running through it, a
cluster of fresh spring vines and budding leaves bursting from the
upper-right corner, dew droplets catching the light, soft fresh daylight
rim lighting. No characters, no people, no border/frame, no text. High
detail, 4K, PNG, 1060x1484.
```

**캐릭터** (쥬멩이 참고 사진 첨부):
```
Turn the reference photo into a stylized premium trading-card 3D player
render, semi-realistic style. Soccer kit in fresh lime-green and white
tones. Joyful mid-air celebration pose right after scoring — knee raised,
both arms spread wide, big excited smile, hair/clothing caught mid-motion.
Viewed from a slight low front 3/4 angle, visible head to mid-thigh. Bright
fresh lighting matching the lime-green palette. No frame, no text, no
background — fully transparent PNG with alpha channel, 1060x1484, leave
open space above the head and below the waist for name/stat overlays.
```

**뒷면**:
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at top center — design the BACK of this
same card (not the front): a pale moss-covered holographic foil surface,
with faint lime-green vine-line patterns running beneath the prismatic
sheen, a single bold budding-leaf emblem centered in the middle of the
shield (no readable text, no logos, no player), soft lime-green metallic
trim tracing the inner border. Moody, premium, mysterious — looks like the
unrevealed back of this card before it's flipped. No text, no numbers, no
real brand marks. Entire canvas outside the frame's own linework must stay
fully transparent (alpha 0), only the shield shape itself is opaque.
1060x1484px, transparent PNG.
```

**빛 효과**:
```
Abstract loose particle/light-effect overlay ONLY, portrait orientation,
1060x1484. Tiny drifting motes of soft lime-green light and sparkling
dew-drop glints catching the sun, like fireflies floating over spring
vines. No solid material, no rock or stone texture, no border/frame, no
characters, no text — this is a light layer meant to be composited on top
of the existing card background, not a full scene. High detail, soft glow
bloom, 4K. Entire canvas outside the glowing particles themselves must
stay fully transparent (alpha 0), transparent PNG.
```

---

### 3. 문모모 — `doormomo` — 보라색 · 마법진/룬문양 (CDM)

**프레임** (하치 프레임 이미지는 실루엣 참고용으로만 첨부):
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at the top center, same inner content
window position — but redesign the surface material completely: a dark
engraved stone tablet, with glowing violet runic sigils and arcane
magic-circle patterns etched into it, mystical purple energy wisps bursting
from the top-left and bottom-right corners instead of crystal shards. No
player, no text, no stats. Entire canvas outside the frame's own linework
(including the inner content window) must be fully transparent. PNG with
alpha channel, 1060x1484.
```

**배경**:
```
Abstract premium trading-card background art, portrait orientation. Dark
engraved stone slab covered in glowing violet runic carvings, a cluster of
swirling arcane energy and floating rune fragments bursting from the
upper-right corner, faint magic-circle glow, cool moody purple rim
lighting. No characters, no people, no border/frame, no text. High detail,
4K, PNG, 1060x1484.
```

**캐릭터** (문모모 참고 사진 첨부):
```
Turn the reference photo into a stylized premium trading-card 3D player
render, semi-realistic style. Soccer kit in deep amethyst-purple and silver
tones. Calm, commanding stance — arms crossed, ball resting still under one
foot, chin slightly raised, composed confident expression (a midfield
playmaker controlling the tempo of the game, not celebrating). Viewed from
a slight low front 3/4 angle, visible head to mid-thigh. Cool violet rim
lighting. No frame, no text, no background — fully transparent PNG with
alpha channel, 1060x1484, leave open space above the head and below the
waist for name/stat overlays.
```

**뒷면**:
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at top center — design the BACK of this
same card (not the front): a dark engraved-stone holographic foil surface,
with faint glowing violet runic sigils running beneath the prismatic
sheen, a single bold magic-circle emblem centered in the middle of the
shield (no readable text, no logos, no player), violet metallic trim
tracing the inner border. Moody, premium, mysterious — looks like the
unrevealed back of this card before it's flipped. No text, no numbers, no
real brand marks. Entire canvas outside the frame's own linework must stay
fully transparent (alpha 0), only the shield shape itself is opaque.
1060x1484px, transparent PNG.
```

**빛 효과**:
```
Abstract loose particle/light-effect overlay ONLY, portrait orientation,
1060x1484. Small, sparse, scattered wisps of glowing violet arcane energy
and tiny floating rune-light specks, drifting slowly — NOT one large
centered magic-circle diagram. This overlay is composited directly on top
of a player render standing in the center of the frame, so the entire
center column and lower two-thirds (where the player's body is) must stay
almost completely empty/transparent — keep all particles small and
concentrated near the top corners and edges only. No solid material, no
rock or stone texture, no border/frame, no characters, no text — this is a
light layer, not a full scene. High detail, soft glow bloom, 4K. Entire
canvas outside the sparse glowing particles themselves must stay fully
transparent (alpha 0), transparent PNG.
```

---

### 4. 뽀린걸 — `bboringirl` — 회색 + 빨강 · 기계 장갑판/회로 (CM)

**프레임** (하치 프레임 이미지는 실루엣 참고용으로만 첨부):
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at the top center, same inner content
window position — but redesign the surface material completely: brushed
gunmetal-gray riveted armor plating, with glowing red energy circuit-lines
running through it, small red circuit-light clusters bursting from the
top-left and bottom-right corners instead of crystal shards — industrial
mecha aesthetic. No player, no text, no stats. Entire canvas outside the
frame's own linework (including the inner content window) must be fully
transparent. PNG with alpha channel, 1060x1484.
```

**배경**:
```
Abstract premium trading-card background art, portrait orientation. Brushed
gunmetal armor-plate slab with glowing red circuit-line veins running
through it, a cluster of red energy conduits and small glowing nodes
bursting from the upper-right corner, cool steel-toned rim lighting with
red accent glow. No characters, no people, no border/frame, no text. High
detail, 4K, PNG, 1060x1484.
```

**캐릭터** (뽀린걸 참고 사진 첨부):
```
Turn the reference photo into a stylized premium trading-card 3D player
render, semi-realistic style. Soccer kit in gunmetal-gray with red trim
accents. Gritty determined mid-run pose, leaning forward, one arm extended
pointing forward as if directing a teammate, intense focused expression.
Viewed from a slight low front 3/4 angle, visible head to mid-thigh. Cool
steel-gray rim lighting with a touch of red accent light. No frame, no
text, no background — fully transparent PNG with alpha channel, 1060x1484,
leave open space above the head and below the waist for name/stat
overlays.
```

**뒷면**:
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at top center — design the BACK of this
same card (not the front): a brushed gunmetal holographic foil surface,
with faint glowing red circuit-line patterns running beneath the prismatic
sheen, a single bold circuit-node emblem centered in the middle of the
shield (no readable text, no logos, no player), red metallic trim tracing
the inner border. Moody, premium, mysterious — looks like the unrevealed
back of this card before it's flipped. No text, no numbers, no real brand
marks. Entire canvas outside the frame's own linework must stay fully
transparent (alpha 0), only the shield shape itself is opaque. 1060x1484px,
transparent PNG.
```

**빛 효과**:
```
Abstract loose particle/light-effect overlay ONLY, portrait orientation,
1060x1484. Small pulsing red circuit-light sparks and drifting glowing
data-node particles, flickering gently. No solid material, no rock or
stone texture, no border/frame, no characters, no text — this is a light
layer meant to be composited on top of the existing card background, not a
full scene. High detail, soft glow bloom, 4K. Entire canvas outside the
glowing particles themselves must stay fully transparent (alpha 0),
transparent PNG.
```

---

### 5. 한결 — `kaksjak0730` — 딥블랙 + 사파이어 블루 · 밤하늘 유리 파편 (CM)

**프레임** (하치 프레임 이미지는 실루엣 참고용으로만 첨부):
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at the top center, same inner content
window position — but redesign the surface material completely: matte
deep-black obsidian, with the corner ornament reimagined as shattered
night-sky glass shards embedded with tiny starlight glimmers (not generic
gem crystals) bursting from the top-left and bottom-right corners — cool
sapphire-blue starlight glow against the black. No player, no text, no
stats. Entire canvas outside the frame's own linework (including the inner
content window) must be fully transparent. PNG with alpha channel,
1060x1484.
```

**배경**:
```
Abstract premium trading-card background art, portrait orientation.
Near-black obsidian slab with faint star-like sparkle veins running through
it, a cluster of shattered glass-like shards glowing with sapphire
starlight bursting from the upper-right corner, tiny drifting light motes,
cool icy-blue rim lighting. No characters, no people, no border/frame, no
text. High detail, 4K, PNG, 1060x1484.
```

**캐릭터** (한결 참고 사진 첨부):
```
Turn the reference photo into a stylized premium trading-card 3D player
render, semi-realistic style. Soccer kit in matte black with sapphire-blue
trim. Poised, elegant free-kick stance — one leg planted firmly, the other
mid-swing, calm and focused gaze, composed rather than aggressive. Viewed
from a slight low front 3/4 angle, visible head to mid-thigh. Cool icy-blue
rim lighting against dark tones. No frame, no text, no background — fully
transparent PNG with alpha channel, 1060x1484, leave open space above the
head and below the waist for name/stat overlays.
```

**뒷면**:
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at top center — design the BACK of this
same card (not the front): a matte deep-black holographic foil surface,
with faint sapphire-blue starlight-shard patterns running beneath the
prismatic sheen, a single bold star-shard emblem centered in the middle of
the shield (no readable text, no logos, no player), sapphire-blue metallic
trim tracing the inner border. Moody, premium, mysterious — looks like the
unrevealed back of this card before it's flipped. No text, no numbers, no
real brand marks. Entire canvas outside the frame's own linework must stay
fully transparent (alpha 0), only the shield shape itself is opaque.
1060x1484px, transparent PNG.
```

**빛 효과**:
```
Abstract loose particle/light-effect overlay ONLY, portrait orientation,
1060x1484. Tiny drifting sapphire-blue starlight motes and soft glass-shard
glints, like starlight scattering slowly through the air. No solid
material, no rock or stone texture, no border/frame, no characters, no
text — this is a light layer meant to be composited on top of the existing
card background, not a full scene. High detail, soft glow bloom, 4K.
Entire canvas outside the glowing particles themselves must stay fully
transparent (alpha 0), transparent PNG.
```

---

### 6. 핑구 — `sjh4018` — 하늘색 + 연보라 · 구름/깃털 (CB)

**프레임** (하치 프레임 이미지는 실루엣 참고용으로만 첨부):
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at the top center, same inner content
window position — but redesign the surface material completely: soft pale
sky-blue cloud-marble, with fluffy cloud wisps and pale lavender feathers
bursting from the top-left and bottom-right corners instead of crystal
shards — airy, soft, dreamlike. No player, no text, no stats. Entire canvas
outside the frame's own linework (including the inner content window) must
be fully transparent. PNG with alpha channel, 1060x1484.
```

**배경**:
```
Abstract premium trading-card background art, portrait orientation. Soft
pale sky-blue cloud-textured slab with faint lavender veins, a cluster of
fluffy clouds and drifting pale feathers bursting from the upper-right
corner, soft airy daylight rim lighting. No characters, no people, no
border/frame, no text. High detail, 4K, PNG, 1060x1484.
```

**캐릭터** (핑구 참고 사진 첨부):
```
Turn the reference photo into a stylized premium trading-card 3D player
render, semi-realistic style. Soccer kit in sky-blue with pale lavender
trim. Grounded, reliable defensive stance — low center of gravity, knees
bent, arms out ready to block, alert and steady expression (a center-back
holding the line, not celebrating). Viewed from a slight low front 3/4
angle, visible head to mid-thigh. Soft airy blue-lavender rim lighting. No
frame, no text, no background — fully transparent PNG with alpha channel,
1060x1484, leave open space above the head and below the waist for
name/stat overlays.
```

**뒷면**:
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at top center — design the BACK of this
same card (not the front): a soft pale sky-blue holographic foil surface,
with faint lavender cloud-and-feather patterns running beneath the
prismatic sheen, a single bold cloud emblem centered in the middle of the
shield (no readable text, no logos, no player), pale lavender metallic trim
tracing the inner border. Moody, premium, mysterious — looks like the
unrevealed back of this card before it's flipped. No text, no numbers, no
real brand marks. Entire canvas outside the frame's own linework must stay
fully transparent (alpha 0), only the shield shape itself is opaque.
1060x1484px, transparent PNG.
```

**빛 효과**:
```
Abstract loose particle/light-effect overlay ONLY, portrait orientation,
1060x1484. Softly drifting pale lavender light motes and a faint glowing
cloud-wisp haze, floating gently. No solid material, no rock or stone
texture, no border/frame, no characters, no text — this is a light layer
meant to be composited on top of the existing card background, not a full
scene. High detail, soft glow bloom, 4K. Entire canvas outside the glowing
particles themselves must stay fully transparent (alpha 0), transparent
PNG.
```

---

### 7. 해파린 — `haepalin` — 연한 라벤더 + 진보라 · 심해 해파리/발광생물 (CB)

해파린의 실제 해파리(jellyfish) RP를 반영한 모티프 — 색은 원래 배정된 라벤더/진보라 그대로, 소재만 심해/해파리 컨셉으로.

**프레임** (하치 프레임 이미지는 실루엣 참고용으로만 첨부):
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at the top center, same inner content
window position — but redesign the surface material completely: pale
lilac-white coral-like stone, with glowing lavender-to-deep-purple
bioluminescent jellyfish tendrils and soft glowing sea anemone wisps
bursting from the top-left and bottom-right corners instead of crystal
shards — dreamy, ethereal, deep-sea glow. No player, no text, no stats.
Entire canvas outside the frame's own linework (including the inner
content window) must be fully transparent. PNG with alpha channel,
1060x1484.
```

**배경**:
```
Abstract premium trading-card background art, portrait orientation. Very
pale lilac coral-textured stone slab with soft violet current-like veins,
a cluster of glowing lavender-purple bioluminescent jellyfish drifting and
trailing tendrils bursting from the upper-right corner, tiny glowing
plankton particles drifting in the water, dreamy soft-focus underwater rim
lighting. No characters, no people, no border/frame, no text. High detail,
4K, PNG, 1060x1484.
```

**캐릭터** (해파린 참고 사진 첨부):
```
Turn the reference photo into a stylized premium trading-card 3D player
render, semi-realistic style. Soccer kit in pale lavender with deep purple
trim. Graceful heading pose — jumping to win an aerial ball, body arched,
hair and clothing flowing weightlessly like jellyfish tendrils, elegant
and controlled rather than aggressive, a faint soft bioluminescent glow
trailing off the hair/fabric edges. Viewed from a slight low front 3/4
angle, visible head to mid-thigh. Soft dreamy lavender-purple rim
lighting. No frame, no text, no background — fully transparent PNG with
alpha channel, 1060x1484, leave open space above the head and below the
waist for name/stat overlays.
```

**뒷면**:
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at top center — design the BACK of this
same card (not the front): a pale lilac holographic foil surface, with
faint deep-purple bioluminescent jellyfish-tendril patterns running
beneath the prismatic sheen, a single bold jellyfish-silhouette emblem
centered in the middle of the shield (no readable text, no logos, no
player), deep-purple metallic trim tracing the inner border. Moody,
premium, mysterious — looks like the unrevealed back of this card before
it's flipped. No text, no numbers, no real brand marks. Entire canvas
outside the frame's own linework must stay fully transparent (alpha 0),
only the shield shape itself is opaque. 1060x1484px, transparent PNG.
```

**빛 효과**:
```
Abstract loose particle/light-effect overlay ONLY, portrait orientation,
1060x1484. Drifting lavender-purple bioluminescent glow particles and tiny
glowing plankton specks, pulsing softly like underwater bioluminescence.
No solid material, no rock or stone texture, no border/frame, no
characters, no text — this is a light layer meant to be composited on top
of the existing card background, not a full scene. High detail, soft glow
bloom, 4K. Entire canvas outside the glowing particles themselves must
stay fully transparent (alpha 0), transparent PNG.
```

---

### 8. 리냐 — `lina0108` — 선명한 핑크 + 연분홍 · 벚꽃 (FB)

**프레임** (하치 프레임 이미지는 실루엣 참고용으로만 첨부):
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at the top center, same inner content
window position — but redesign the surface material completely: pale
blush-pink stone, with a cherry-blossom branch and swirling sakura petals
in vivid pink bursting from the top-left and bottom-right corners instead
of crystal shards — playful, romantic spring aesthetic. No player, no
text, no stats. Entire canvas outside the frame's own linework (including
the inner content window) must be fully transparent. PNG with alpha
channel, 1060x1484.
```

**배경**:
```
Abstract premium trading-card background art, portrait orientation. Pale
blush-pink stone slab with soft pink veins, a cherry-blossom branch with
vivid pink blossoms bursting from the upper-right corner, swirling petals
drifting through the air, warm playful rim lighting. No characters, no
people, no border/frame, no text. High detail, 4K, PNG, 1060x1484.
```

**캐릭터** (리냐 참고 사진 첨부):
```
Turn the reference photo into a stylized premium trading-card 3D player
render, semi-realistic style. Soccer kit in vivid pink with pale-pink trim.
Playful, energetic overlapping run down the wing — mid-stride, one hand
raised in a cheerful wave/celebration gesture, bright fun-loving grin.
Viewed from a slight low front 3/4 angle, visible head to mid-thigh. Warm
vivid pink rim lighting. No frame, no text, no background — fully
transparent PNG with alpha channel, 1060x1484, leave open space above the
head and below the waist for name/stat overlays.
```

**뒷면**:
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at top center — design the BACK of this
same card (not the front): a pale blush-pink holographic foil surface,
with faint vivid-pink sakura-branch patterns running beneath the prismatic
sheen, a single bold cherry-blossom emblem centered in the middle of the
shield (no readable text, no logos, no player), vivid-pink metallic trim
tracing the inner border. Moody, premium, mysterious — looks like the
unrevealed back of this card before it's flipped. No text, no numbers, no
real brand marks. Entire canvas outside the frame's own linework must stay
fully transparent (alpha 0), only the shield shape itself is opaque.
1060x1484px, transparent PNG.
```

**빛 효과**:
```
Abstract loose particle/light-effect overlay ONLY, portrait orientation,
1060x1484. Softly drifting glowing pink sparkle motes and faint light
glints, like sunlight catching falling petals. No solid material, no rock
or stone texture, no border/frame, no characters, no text — this is a
light layer meant to be composited on top of the existing card background,
not a full scene. High detail, soft glow bloom, 4K. Entire canvas outside
the glowing particles themselves must stay fully transparent (alpha 0),
transparent PNG.
```

---

### 9. 빙밍 — `tleod1818` — 어두운 남색 + 에메랄드 · 폭풍우/번개 (FB)

해파린에게 심해/해파리 모티프를 넘기면서, 빙밍은 다른 선수와 안 겹치는 폭풍우/번개 모티프로 변경 — 색은 원래 배정된 어두운 남색+에메랄드 그대로.

**프레임** (하치 프레임 이미지는 실루엣 참고용으로만 첨부):
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at the top center, same inner content
window position — but redesign the surface material completely: a very
dark storm-cloud-textured navy rock, with crackling emerald-green
lightning bolts and swirling storm-cloud wisps bursting from the top-left
and bottom-right corners instead of crystal shards — intense, electric,
stormy. No player, no text, no stats. Entire canvas outside the frame's
own linework (including the inner content window) must be fully
transparent. PNG with alpha channel, 1060x1484.
```

**배경**:
```
Abstract premium trading-card background art, portrait orientation.
Near-black navy storm-cloud-textured slab with faint electric-blue vein
cracks, a cluster of crackling emerald-green lightning bolts and dark
storm clouds bursting from the upper-right corner, tiny drifting spark
particles, cool dramatic stormy rim lighting. No characters, no people, no
border/frame, no text. High detail, 4K, PNG, 1060x1484.
```

**캐릭터** (빙밍 참고 사진 첨부):
```
Turn the reference photo into a stylized premium trading-card 3D player
render, semi-realistic style. Soccer kit in dark navy with emerald-green
trim. Intense low defensive sliding-tackle pose — body low to the ground,
one leg extended, sharp focused determination, a crack of emerald-green
lightning lighting up the scene behind. Viewed from a slight low front 3/4
angle, visible head to mid-thigh. Cool dramatic rim lighting with an
emerald-green electric highlight. No frame, no text, no background —
fully transparent PNG with alpha channel, 1060x1484, leave open space
above the head and below the waist for name/stat overlays.
```

**뒷면**:
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at top center — design the BACK of this
same card (not the front): a near-black navy holographic foil surface,
with faint crackling emerald-green lightning-vein patterns running beneath
the prismatic sheen, a single bold lightning-bolt emblem centered in the
middle of the shield (no readable text, no logos, no player), emerald-green
metallic trim tracing the inner border. Moody, premium, mysterious — looks
like the unrevealed back of this card before it's flipped. No text, no
numbers, no real brand marks. Entire canvas outside the frame's own
linework must stay fully transparent (alpha 0), only the shield shape
itself is opaque. 1060x1484px, transparent PNG.
```

**빛 효과**:
```
Abstract loose particle/light-effect overlay ONLY, portrait orientation,
1060x1484. Crackling emerald-green lightning-spark particles and faint
electric-blue glow flickers, sparking intermittently. No solid material,
no rock or stone texture, no border/frame, no characters, no text — this
is a light layer meant to be composited on top of the existing card
background, not a full scene. High detail, soft glow bloom, 4K. Entire
canvas outside the glowing particles themselves must stay fully
transparent (alpha 0), transparent PNG.
```

---

### 10. 재닌 — `janine95kim` — 스카이 블루 · 서리/오로라 (GK)

**프레임** (하치 프레임 이미지는 실루엣 참고용으로만 첨부):
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at the top center, same inner content
window position — but redesign the surface material completely: clean icy
pale-blue frosted stone, with sharp frost patterns and a faint aurora-light
streak in silvery-white bursting from the top-left and bottom-right
corners instead of crystal shards — crisp, clean, wintry. No player, no
text, no stats. Entire canvas outside the frame's own linework (including
the inner content window) must be fully transparent. PNG with alpha
channel, 1060x1484.
```

**배경**:
```
Abstract premium trading-card background art, portrait orientation. Icy
pale-blue frosted stone slab with silvery frost-vein cracks, a streak of
faint aurora-like light and frost crystals bursting from the upper-right
corner, crisp bright cold rim lighting. No characters, no people, no
border/frame, no text. High detail, 4K, PNG, 1060x1484.
```

**캐릭터** (재닌 참고 사진 첨부):
```
Turn the reference photo into a stylized premium trading-card 3D player
render, semi-realistic style. Goalkeeper kit in sky-blue with silver trim,
goalkeeper gloves. Dramatic full-stretch diving save pose — body fully
extended horizontally in mid-air, both arms reaching out toward the ball,
intense focused expression. Viewed from a slight low front 3/4 angle,
visible head to mid-thigh (crop to keep the diving pose readable within the
card's portrait canvas). Crisp bright rim lighting. No frame, no text, no
background — fully transparent PNG with alpha channel, 1060x1484, leave
open space above the head and below the waist for name/stat overlays.
```

**뒷면**:
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at top center — design the BACK of this
same card (not the front): an icy pale-blue holographic foil surface, with
faint silvery aurora-streak patterns running beneath the prismatic sheen, a
single bold frost-crystal emblem centered in the middle of the shield (no
readable text, no logos, no player), silvery-white metallic trim tracing
the inner border. Moody, premium, mysterious — looks like the unrevealed
back of this card before it's flipped. No text, no numbers, no real brand
marks. Entire canvas outside the frame's own linework must stay fully
transparent (alpha 0), only the shield shape itself is opaque. 1060x1484px,
transparent PNG.
```

**빛 효과**:
```
Abstract loose particle/light-effect overlay ONLY, portrait orientation,
1060x1484. Softly drifting silvery-white aurora light streaks and tiny
glowing frost-crystal sparkle particles, shimmering gently. No solid
material, no rock or stone texture, no border/frame, no characters, no
text — this is a light layer meant to be composited on top of the existing
card background, not a full scene. High detail, soft glow bloom, 4K.
Entire canvas outside the glowing particles themselves must stay fully
transparent (alpha 0), transparent PNG.
```

---

## 보너스: 하치 — 화려한 스페셜 리메이크 (`hachi97`)

하치는 이 카드 시리즈의 첫 번째 테스트 카드이자 제일 좋아하는 캐릭터라, 다른 10명과 똑같은 톤으로 두지 않고 **더 화려하고 장식이 많은 상위 등급 느낌**으로 새로 만들고 싶을 때 쓰는 프롬프트. 하치 RP가 **용(龍)**이라(팬닉도 "용볼") 모티프를 용으로 고정 — 다른 9명처럼 크리스탈/식물/룬문양 같은 무생물 모티프가 아니라, 용 비늘·발톱·날개·용의 기운(불/신비로운 에너지) 같은 "용" 자체를 형상화한 장식으로.

**팔레트는 고정: 금색(골드/앰버) + 자수정(바이올렛) 용의 기운** — `totyCardTheme.ts`의 `hachi97` 항목(`color: #ffe29e`, `glow: #d9b3ff`)과 이미 맞춰져 있는 값. 원래는 "캐릭터 사진에서 어울리는 색을 생성 도구가 스스로 고르게" 하려 했는데, 프레임/배경/캐릭터/뒷면/빛효과가 전부 **별도의 생성 요청**이다 보니 매번 새로 색을 추론하면서 서로 어긋남 — 실제로 프레임은 금색+자수정으로 나왔는데 배경은 하늘색으로 나오는 불일치가 발생했음. 그래서 **팔레트를 텍스트로 고정**하고, **프레임 이미지를 실루엣뿐 아니라 색상 참고용으로도 함께 첨부**하도록 아래 프롬프트를 수정함 — 하늘색 등으로 다시 어긋나면 이 두 가지(고정 팔레트 문구 + 프레임 이미지 색상 참고 첨부)가 실제로 지켜졌는지 먼저 확인.

**프레임** (하치 캐릭터 참고 사진 첨부 + 기존 하치 프레임 이미지를 실루엣 참고용으로 첨부):
```
Using a warm golden-amber palette with soft amethyst-violet accents (the
same palette this card's dragon-fire motif always uses — do not substitute
a different color scheme such as blue), and using the attached card frame
image ONLY as a silhouette/structure reference (same ornate shield-shaped
outer silhouette, same scalloped border curve, same inner content window
position), design a noticeably more lavish, higher-rarity dragon-themed
version of this frame using that palette: the corner ornament reimagined
as coiling dragon
claws and dragon scales bursting from the top-left and bottom-right
corners (instead of generic crystal shards), fine dragon-scale texture
etched into the metal along the whole border, small dragon horns or
wing-tip motifs flanking the top crest. Replace the plain laurel-wreath
crest with a larger, more intricate crest featuring a small coiled dragon
emblem. Add wisps of mystical dragon-fire or glowing draconic energy
drifting from the claw clusters, extra sparkle/ember particles, and a
subtle prismatic sheen along the metal edges to read as the rarest tier in
the set — more ornate and detailed than a standard card in this series,
while keeping the same overall silhouette. No player, no text, no stats.
Entire canvas outside the frame's own linework (including the inner
content window) must be fully transparent. PNG with alpha channel,
1060x1484.
```

**배경** (완성된 하치 프레임 이미지를 색상 참고용으로 함께 첨부 — 구도가 아니라 팔레트를 그 이미지에 맞추라는 의미):
```
Abstract premium trading-card background art, portrait orientation, using
the exact same warm golden-amber + amethyst-violet color palette as the
attached frame image — match those colors closely, do not introduce a
different color scheme such as blue. A dense, richly detailed cracked slab
with glowing veins, a large cluster of coiling dragon claws and dragon
scales bursting from one corner, wisps of mystical dragon-fire or glowing
draconic energy swirling through the air, extra layers of sparkle, ember,
and glitter dust, dramatic rim lighting for a noticeably more lavish,
higher-rarity look than a standard card in this series. No characters, no
people, no border/frame, no text. High detail, 4K, PNG, 1060x1484.
```

**캐릭터** (하치 참고 사진 + 완성된 하치 프레임 이미지를 색상 참고용으로 함께 첨부):
```
Turn the reference photo into a stylized premium trading-card 3D player
render, semi-realistic style, using the same warm golden-amber +
amethyst-violet palette as the attached frame image (not a palette
re-derived from her hair/eye/outfit colors — match the frame's colors
specifically). A confident, dynamic hero pose (keep
her signature thumbs-up-forward energy if it fits, or a slightly more
dynamic action variant), full of personality. Subtle draconic accents tying
into her dragon RP — small dragon-scale pattern trim or a tiny dragon
emblem on the kit, and a faint aura of glowing draconic energy or wisps of
mystical fire curling around her (she stays fully human — this is a subtle
aura/accessory effect, not a literal dragon transformation). Viewed from a
slight low front 3/4 angle, visible head to mid-thigh. Rich, dramatic rim
lighting with a touch of sparkle/ember, matching the more lavish,
higher-rarity treatment of the rest of this card (more detail and polish
than a standard card in this series). No frame, no text, no background —
fully transparent PNG with alpha channel, 1060x1484, leave open space
above the head and below the waist for name/stat overlays.
```

**뒷면** (완성된 하치 프레임 이미지를 실루엣 + 색상 참고용으로 함께 첨부):
```
Using the attached card frame image as a silhouette/structure reference
(same ornate shield-shaped outer silhouette, same scalloped border curve,
same inner content window position) AND matching its exact warm
golden-amber + amethyst-violet color palette (do not introduce a different
color scheme such as blue), design the BACK of this same card (not the
front): a dark holographic foil surface with faint dragon-scale texture
and wisps of
glowing draconic energy drifting beneath the prismatic sheen, a single bold
coiled-dragon emblem centered in the middle of the shield (no readable
text, no logos, no player), metallic trim in that same palette tracing the
inner border — noticeably more lavish and detailed than a standard card in
this series, matching the higher-rarity treatment of the rest of this card.
Moody, premium, mysterious — looks like the unrevealed back of this card
before it's flipped. No text, no numbers, no real brand marks. Entire
canvas outside the frame's own linework must stay fully transparent
(alpha 0), only the shield shape itself is opaque. 1060x1484px, transparent
PNG.
```

**빛 효과** (완성된 하치 프레임 이미지를 색상 참고용으로 함께 첨부):
```
Abstract loose particle/light-effect overlay ONLY, portrait orientation,
1060x1484, matching the exact warm golden-amber + amethyst-violet color
palette of the attached frame image (do not introduce a different color
scheme such as blue). Wisps of glowing draconic energy, sparkle, ember,
and glitter dust drifting slowly through the air — noticeably more lavish
and dense than a
standard card in this series, matching the higher-rarity treatment of the
rest of this card. No solid material, no rock or stone texture, no
border/frame, no characters, no text — this is a light layer meant to be
composited on top of the existing card background, not a full scene. High
detail, soft glow bloom, 4K. Entire canvas outside the glowing particles
themselves must stay fully transparent (alpha 0), transparent PNG.
```
