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
| 7 | 해파린 | `haepalin` | CB | 연한 라벤더 + 진보라 | 등나무꽃(위스테리아) 덩굴 |
| 8 | 리냐 | `lina0108` | FB | 선명한 핑크 + 연분홍 | 벚꽃 가지/꽃잎 |
| 9 | 빙밍 | `tleod1818` | FB | 어두운 남색 + 에메랄드 | 심해 산호 + 발광 생물 |
| 10 | 재닌 | `janine95kim` | GK | 스카이 블루 | 서리/오로라 |

각 세트마다 자세는 서로 겹치지 않게, 포지션·모티프 무드에 맞춰 배정함.

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

---

### 2. 쥬멩이 — `ju010228` — 연두색 · 봄 넝쿨/새싹 (ST)

**프레임**: 실루엣은 하치와 동일 유지 지시문 + "redesign the surface as pale mossy stone, with fresh spring vines, budding leaves, and tiny dew-lit sprouts bursting from the top-left and bottom-right corners instead of crystal shards — lime-green foliage with soft morning dew sparkle."

**배경**:
```
... Pale moss-covered stone slab with soft green vine-veins running through
it, a cluster of fresh spring vines and budding leaves bursting from the
upper-right corner, dew droplets catching the light, soft fresh daylight
rim lighting. No characters, no text, no border. PNG, 1060x1484.
```

**캐릭터**:
```
... soccer kit in fresh lime-green and white tones. Joyful mid-air
celebration pose right after scoring — knee raised, both arms spread wide,
big excited smile, hair/clothing caught mid-motion. Viewed from a slight low
front 3/4 angle, head to mid-thigh. Bright fresh lighting matching the
lime-green palette. Transparent PNG, 1060x1484.
```

---

### 3. 문모모 — `doormomo` — 보라색 · 마법진/룬문양 (CDM)

**프레임**: 실루엣 동일 + "redesign the surface as a dark engraved stone tablet, with glowing violet runic sigils and arcane magic-circle patterns etched into it, mystical purple energy wisps bursting from the top-left and bottom-right corners instead of crystal shards."

**배경**:
```
... Dark engraved stone slab covered in glowing violet runic carvings, a
cluster of swirling arcane energy and floating rune fragments bursting from
the upper-right corner, faint magic-circle glow, cool moody purple rim
lighting. No characters, no text, no border. PNG, 1060x1484.
```

**캐릭터**:
```
... soccer kit in deep amethyst-purple and silver tones. Calm, commanding
stance — arms crossed, ball resting still under one foot, chin slightly
raised, composed confident expression (a midfield playmaker controlling the
tempo of the game, not celebrating). Viewed from a slight low front 3/4
angle, head to mid-thigh. Cool violet rim lighting. Transparent PNG,
1060x1484.
```

---

### 4. 뽀린걸 — `bboringirl` — 회색 + 빨강 · 기계 장갑판/회로 (CM)

**프레임**: 실루엣 동일 + "redesign the surface as brushed gunmetal-gray riveted armor plating, with glowing red energy circuit-lines running through it, small red circuit-light clusters bursting from the top-left and bottom-right corners instead of crystal shards — industrial mecha aesthetic."

**배경**:
```
... Brushed gunmetal armor-plate slab with glowing red circuit-line veins
running through it, a cluster of red energy conduits and small glowing
nodes bursting from the upper-right corner, cool steel-toned rim lighting
with red accent glow. No characters, no text, no border. PNG, 1060x1484.
```

**캐릭터**:
```
... soccer kit in gunmetal-gray with red trim accents. Gritty determined
mid-run pose, leaning forward, one arm extended pointing forward as if
directing a teammate, intense focused expression. Viewed from a slight low
front 3/4 angle, head to mid-thigh. Cool steel-gray rim lighting with a
touch of red accent light. Transparent PNG, 1060x1484.
```

---

### 5. 한결 — `kaksjak0730` — 딥블랙 + 사파이어 블루 · 밤하늘 유리 파편 (CM)

**프레임**: 실루엣 동일 + "redesign the surface as matte deep-black obsidian, with the corner ornament reimagined as shattered night-sky glass shards embedded with tiny starlight glimmers (not generic gem crystals) bursting from the top-left and bottom-right corners — cool sapphire-blue starlight glow against the black."

**배경**:
```
... Near-black obsidian slab with faint star-like sparkle veins running
through it, a cluster of shattered glass-like shards glowing with sapphire
starlight bursting from the upper-right corner, tiny drifting light motes,
cool icy-blue rim lighting. No characters, no text, no border. PNG,
1060x1484.
```

**캐릭터**:
```
... soccer kit in matte black with sapphire-blue trim. Poised, elegant
free-kick stance — one leg planted firmly, the other mid-swing, calm and
focused gaze, composed rather than aggressive. Viewed from a slight low
front 3/4 angle, head to mid-thigh. Cool icy-blue rim lighting against dark
tones. Transparent PNG, 1060x1484.
```

---

### 6. 핑구 — `sjh4018` — 하늘색 + 연보라 · 구름/깃털 (CB)

**프레임**: 실루엣 동일 + "redesign the surface as soft pale sky-blue cloud-marble, with fluffy cloud wisps and pale lavender feathers bursting from the top-left and bottom-right corners instead of crystal shards — airy, soft, dreamlike."

**배경**:
```
... Soft pale sky-blue cloud-textured slab with faint lavender veins, a
cluster of fluffy clouds and drifting pale feathers bursting from the
upper-right corner, soft airy daylight rim lighting. No characters, no
text, no border. PNG, 1060x1484.
```

**캐릭터**:
```
... soccer kit in sky-blue with pale lavender trim. Grounded, reliable
defensive stance — low center of gravity, knees bent, arms out ready to
block, alert and steady expression (a center-back holding the line, not
celebrating). Viewed from a slight low front 3/4 angle, head to mid-thigh.
Soft airy blue-lavender rim lighting. Transparent PNG, 1060x1484.
```

---

### 7. 해파린 — `haepalin` — 연한 라벤더 + 진보라 · 등나무꽃(위스테리아) (CB)

**프레임**: 실루엣 동일 + "redesign the surface as pale lilac stone, with cascading wisteria flower clusters and vines in deep purple bursting from the top-left and bottom-right corners instead of crystal shards — dreamy, romantic, soft-focus floral."

**배경**:
```
... Very pale lilac stone slab with soft violet veins, cascading wisteria
flower vines and blossom clusters bursting from the upper-right corner,
a few petals drifting in the air, dreamy soft-focus rim lighting. No
characters, no text, no border. PNG, 1060x1484.
```

**캐릭터**:
```
... soccer kit in pale lavender with deep purple trim. Graceful heading
pose — jumping to win an aerial ball, body arched, hair flowing with the
motion, elegant and controlled rather than aggressive. Viewed from a
slight low front 3/4 angle, head to mid-thigh. Soft dreamy lavender-purple
rim lighting. Transparent PNG, 1060x1484.
```

---

### 8. 리냐 — `lina0108` — 선명한 핑크 + 연분홍 · 벚꽃 (FB)

**프레임**: 실루엣 동일 + "redesign the surface as pale blush-pink stone, with a cherry-blossom branch and swirling sakura petals in vivid pink bursting from the top-left and bottom-right corners instead of crystal shards — playful, romantic spring aesthetic."

**배경**:
```
... Pale blush-pink stone slab with soft pink veins, a cherry-blossom
branch with vivid pink blossoms bursting from the upper-right corner,
swirling petals drifting through the air, warm playful rim lighting. No
characters, no text, no border. PNG, 1060x1484.
```

**캐릭터**:
```
... soccer kit in vivid pink with pale-pink trim. Playful, energetic
overlapping run down the wing — mid-stride, one hand raised in a cheerful
wave/celebration gesture, bright fun-loving grin. Viewed from a slight low
front 3/4 angle, head to mid-thigh. Warm vivid pink rim lighting.
Transparent PNG, 1060x1484.
```

---

### 9. 빙밍 — `tleod1818` — 어두운 남색 + 에메랄드 · 심해 산호/발광생물 (FB)

**프레임**: 실루엣 동일 + "redesign the surface as a very dark navy coral-reef-like rock, with glowing emerald-green bioluminescent coral and small luminous sea creatures bursting from the top-left and bottom-right corners instead of crystal shards — deep-sea, mysterious, glowing."

**배경**:
```
... Near-black navy coral-textured slab with faint blue current-like veins,
a cluster of glowing emerald-green bioluminescent coral and tiny luminous
particles bursting from the upper-right corner, cool dark underwater rim
lighting. No characters, no text, no border. PNG, 1060x1484.
```

**캐릭터**:
```
... soccer kit in dark navy with emerald-green trim. Intense low defensive
sliding-tackle pose — body low to the ground, one leg extended, sharp
focused determination. Viewed from a slight low front 3/4 angle, head to
mid-thigh. Cool dark rim lighting with an emerald-green highlight.
Transparent PNG, 1060x1484.
```

---

### 10. 재닌 — `janine95kim` — 스카이 블루 · 서리/오로라 (GK)

**프레임**: 실루엣 동일 + "redesign the surface as clean icy pale-blue frosted stone, with sharp frost patterns and a faint aurora-light streak in silvery-white bursting from the top-left and bottom-right corners instead of crystal shards — crisp, clean, wintry."

**배경**:
```
... Icy pale-blue frosted stone slab with silvery frost-vein cracks, a
streak of faint aurora-like light and frost crystals bursting from the
upper-right corner, crisp bright cold rim lighting. No characters, no text,
no border. PNG, 1060x1484.
```

**캐릭터**:
```
... goalkeeper kit in sky-blue with silver trim, goalkeeper gloves.
Dramatic full-stretch diving save pose — body fully extended horizontally
in mid-air, both arms reaching out toward the ball, intense focused
expression. Viewed from a slight low front 3/4 angle, head to mid-thigh
(crop to keep the diving pose readable within the card's portrait canvas).
Crisp bright rim lighting. Transparent PNG, 1060x1484.
```
