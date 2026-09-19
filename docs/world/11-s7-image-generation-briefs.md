# S7 이미지 생성 요청서 — 파일별 독립 브리프

S7에서 새로 생성해야 하는 이미지의 **실행 전용 문서**다. 기존 생성물은 덮어쓰기 전에 별도로 보관하고, 새 PNG만 `tmp/world-src/`의 같은 이름으로 전달한다. 변환과 웹 연결은 개발 세션에서 수행한다.

## 공통 사용 규칙

- `walk`와 `stand`는 캐릭터 하나당 같은 이미지 생성 대화에서 만든다. 먼저 walk를 승인한 뒤, 그 결과를 다시 첨부해 stand를 만든다. 이렇게 해야 키·머리·몸통·다리 비율이 일치한다.
- 캐릭터가 바뀌면 반드시 **새 대화**를 연다. 다른 캐릭터의 결과를 레퍼런스로 섞지 않는다.
- `turn`, `portrait`는 S7 재생성 범위가 아니다. 현재 파일은 외형 레퍼런스로만 사용한다.
- 모든 결과는 투명 PNG가 우선이며, 불가능하면 그림자·바닥·그라디언트가 전혀 없는 완전 평면 `#FF00FF` 배경 PNG를 사용한다. 글자, 숫자, 로고, 워터마크는 금지한다.
- 공통 스타일: 3/4 탑다운, 2.5등신 치비, 선명한 현대 32-bit 픽셀아트, 1px 짙은 청록 외곽선(`#16302e`), 3단 셀 셰이딩, 블러/안티앨리어싱/사진/3D 렌더 금지.
- `walk` 시트는 반드시 1536×1024, 4열×3행이다. 각 행은 **아래/오른쪽/위** 방향이며, 모든 행에서 프레임은 **1 왼발(또는 왼앞발) 접지 → 2 통과 → 3 오른발(또는 오른앞발) 접지 → 4 통과** 순서다. 1과 3은 실제로 다른 앞발이 전진한 모습이어야 한다. 특히 오른쪽으로 걷는 가운데 행은 **1번 왼발 부츠가 화면상 가장 오른쪽 선두, 3번 오른발 부츠가 화면상 가장 오른쪽 선두**여야 하며, 두 접지 프레임에서 두 부츠/발은 수평 간격을 두고 완전히 보여야 한다. 세 행은 위에서부터 341px·342px·341px를 차지한다. `1536×1024`는 3으로 정확히 나뉘지 않으므로 프롬프트에서 세로 칸이 같은 픽셀 높이라고 요구하지 않는다.
- `stand`는 1024×1024이고, 새 walk 시트의 한 칸과 같은 신장·머리/몸통/다리 비율이어야 한다. 기존처럼 세로로 길쭉한 실루엣을 만들지 않는다.

## 전달 파일 한눈에 보기

| 종류 | 생성 수 | 저장 위치 | 세션 운영 |
| --- | ---: | --- | --- |
| 사람/NPC walk | 18 | `tmp/world-src/characters/char-<id>-walk.png` | 캐릭터별 새 대화, 이어서 stand 생성 |
| 동물 walk | 2 | `tmp/world-src/characters/char-<id>-walk.png` | 동물별 새 대화, 단발 생성 |
| 사람/NPC stand | 18 | `tmp/world-src/characters/char-<id>-stand.png` | 바로 앞의 같은 캐릭터 walk 대화 유지 |
| 선택적 외곽 프레임 | 1 | `tmp/world-src/ui/ui-game-outer-frame.png` | 전용 새 대화, 단발 생성 |

---

## 1. 보행 시트 — 캐릭터별 독립 요청 20개

### 각 캐릭터 프롬프트에 포함된 옆모습 강제 기준

아래 20개 walk 코드 블록은 각각 **독립 완결형 프롬프트**다. 공통 블록을 별도로 붙이지 말고, 원하는 캐릭터의 코드 블록 하나만 통째로 복사해 한 번 생성한다. 각 블록에 화면상 위치·깊이·다리 연결을 함께 강제하는 보행 구성 지시가 들어 있다. 아래 공통 블록은 그 구성의 QA 기준을 설명하는 참고용이다. 단순히 팔만 바꾸거나 발가락·무릎의 색만 바꾼 결과는 실패다.

```text
ANIMATION CONSTRUCTION — this is one coherent 4-phase walk cycle, not four pose variations. Establish the middle right-facing row first, then draw the front and back rows. In the middle row, treat the two legs/paws as two separate full limbs from hip/shoulder to boot/paw, on visibly separate near/lower and far/upper depth tracks.

Middle-row frame plan: (1) LEFT-foot/paw contact: the LEFT full limb ends in the frontmost screen-right boot/paw; the RIGHT full limb ends behind it at screen-left. (2) RIGHT-foot/paw passing: the RIGHT boot/paw is lifted and passing beneath the body while the LEFT leg/paw is the rear supporting leg. (3) RIGHT-foot/paw contact: the RIGHT full limb ends in the frontmost screen-right boot/paw; the LEFT full limb ends behind it at screen-left. (4) LEFT-foot/paw passing: the LEFT boot/paw is lifted and passing beneath the body while the RIGHT leg/paw is the rear supporting leg.

For frames 1 and 3, show two complete boots/paws at opposite horizontal ends of a wide stride: one clearly ahead on screen-right and one clearly behind on screen-left. The leading limb must also switch depth track and hip/shoulder-to-boot/paw diagonal between frames 1 and 3; do not merely repaint a boot, toe, knee, arm, or highlight. Frames 2 and 4 are different lifted passing poses, with the body one or two final-pixel equivalents higher than contact. No overlapping feet, stacked silhouettes, hidden rear foot, arm-only motion, duplicated leg silhouette, or reused contact pose. If the middle row is cropped from the waist/chest down, all four phases must still read in order as left-contact → right-pass → right-contact → left-pass.
```

### 옆모습 실패 시 재생성 요청 — 개별 walk용

- 저장 파일: 실패한 파일과 동일한 `char-<id>-walk.png`
- 세션: **새 대화를 열지 말고** 해당 캐릭터의 walk를 만든 대화를 유지
- 필수 첨부: 실패한 `char-<id>-walk.png`, 같은 캐릭터의 `char-<id>-turn.png`
- 선택 첨부: 실패 판정 예시 `C:/Users/bbaa3/Downloads/Codex 이미지 2026년 9월 19일 오후 09_24_22.png` (발 교대 QA 예시일 뿐, 캐릭터 외형 레퍼런스로 사용하지 않음)

```text
The attached walk sheet failed side-view walk-cycle QA. Keep this exact character, palette, clothing, pixel size, grid, and the front/back rows, but regenerate the COMPLETE 4x3 sheet and correct the middle row only as a literal right-facing side-profile walk cycle. This is not a cosmetic variation request.

Middle-row construction is mandatory. Treat both legs as complete separate hip-to-boot limbs placed on distinct near/lower and far/upper depth tracks. Frame 1 is LEFT-foot contact: LEFT boot frontmost at screen-right, RIGHT boot trailing at screen-left. Frame 2 is RIGHT-foot passing: RIGHT boot lifted under the torso, LEFT leg supporting behind. Frame 3 is RIGHT-foot contact: RIGHT boot frontmost at screen-right, LEFT boot trailing at screen-left. Frame 4 is LEFT-foot passing: LEFT boot lifted under the torso, RIGHT leg supporting behind. Frames 1 and 3 must swap the leading limb's identity, depth track, and hip-to-boot diagonal — changing only a toe, knee, colour, arm, or boot is a failure. In each contact frame show two full non-overlapping boots with a wide horizontal stride gap; do not stack, hide, or reuse a leg silhouette. Before delivering, mentally crop the middle row below the waist: it must read left-contact → right-pass → right-contact → left-pass without using the arms or upper body.

Return a full transparent 1536x1024 4-column by 3-row sprite sheet, no background, no shadow, no text, no grid lines.
```

### 1. `janine95kim` — walk

- 저장 파일: `char-janine95kim-walk.png`
- 새 대화: 예 (`S7-CH-janine95kim`)
- 첨부 레퍼런스: `tmp/world-src/characters/char-janine95kim-turn.png`, 현재 `char-janine95kim-walk.png`

```text
Using the attached turnaround sheet as the identity reference, regenerate only janine95kim's walk cycle. Create one transparent 1536x1024 pixel-art sprite sheet, strict 4 columns by 3 rows. Top row walks toward camera, middle row walks right, bottom row walks away. Every row is: frame 1 left foot forward contact, frame 2 passing pose, frame 3 right foot forward contact, frame 4 passing pose. HARD SIDE-VIEW ACCEPTANCE (middle row, moving right): frame 1 MUST show the LEFT boot as the frontmost, screen-right contact; frame 3 MUST show the RIGHT boot as the frontmost, screen-right contact. In both frames, both boots must be fully visible, non-overlapping, and separated by a clear horizontal stride gap. The leading boot must visibly swap even if the upper body is covered. Never reuse the same leg silhouette, stack one boot behind the other, hide a boot behind hair/clothes/a prop, or animate only the arms. Frames 2 and 4 must be visibly different passing poses. Reject and redraw the sheet yourself if this check fails. Arms swing opposite the legs. Keep exact hair, glasses, headset, black goalkeeper kit, proportions, palette, pixel scale, baseline, and no shadows/grid/text. High-detail crisp 32-bit JRPG pixel art, dark teal one-pixel outline, no blur or 3D rendering.
MIDDLE-ROW POSE CONSTRUCTION: Treat both legs as complete, separate hip-to-boot limbs on distinct near/lower and far/upper depth tracks. Frame 1 is LEFT contact: LEFT boot frontmost at screen-right and RIGHT boot trailing at screen-left. Frame 2 is RIGHT passing: RIGHT boot lifted beneath the torso while LEFT leg supports behind. Frame 3 is RIGHT contact: RIGHT boot frontmost at screen-right and LEFT boot trailing at screen-left. Frame 4 is LEFT passing: LEFT boot lifted beneath the torso while RIGHT leg supports behind. Frames 1 and 3 must swap leading-limb identity, depth track, and hip-to-boot diagonal; changing only a toe, knee, arm, highlight, or boot is a failure. Below-waist crop must read left-contact → right-pass → right-contact → left-pass.
```

### 2. `bboringirl` — walk

- 저장 파일: `char-bboringirl-walk.png`
- 새 대화: 예 (`S7-CH-bboringirl`)
- 첨부 레퍼런스: `tmp/world-src/characters/char-bboringirl-turn.png`, 현재 `char-bboringirl-walk.png`

```text
Using the attached turnaround sheet as the identity reference, regenerate only bboringirl's walk cycle. Create one transparent 1536x1024 pixel-art sprite sheet, strict 4 columns by 3 rows. Top row walks toward camera, middle row walks right, bottom row walks away. Every row is: frame 1 left foot forward contact, frame 2 passing pose, frame 3 right foot forward contact, frame 4 passing pose. HARD SIDE-VIEW ACCEPTANCE (middle row, moving right): frame 1 MUST show the LEFT boot as the frontmost, screen-right contact; frame 3 MUST show the RIGHT boot as the frontmost, screen-right contact. In both frames, both boots must be fully visible, non-overlapping, and separated by a clear horizontal stride gap. The leading boot must visibly swap even if the upper body is covered. Never reuse the same leg silhouette, stack one boot behind the other, hide a boot behind hair/clothes/a prop, or animate only the arms. Frames 2 and 4 must be visibly different passing poses. Reject and redraw the sheet yourself if this check fails. Arms swing opposite the legs. Keep exact silver-grey hair with red-pink streaks, side ponytail, white-and-mint kit, proportions, palette, pixel scale, baseline, and no shadows/grid/text. High-detail crisp 32-bit JRPG pixel art, dark teal one-pixel outline, no blur or 3D rendering.
MIDDLE-ROW POSE CONSTRUCTION: Treat both legs as complete, separate hip-to-boot limbs on distinct near/lower and far/upper depth tracks. Frame 1 is LEFT contact: LEFT boot frontmost at screen-right and RIGHT boot trailing at screen-left. Frame 2 is RIGHT passing: RIGHT boot lifted beneath the torso while LEFT leg supports behind. Frame 3 is RIGHT contact: RIGHT boot frontmost at screen-right and LEFT boot trailing at screen-left. Frame 4 is LEFT passing: LEFT boot lifted beneath the torso while RIGHT leg supports behind. Frames 1 and 3 must swap leading-limb identity, depth track, and hip-to-boot diagonal; changing only a toe, knee, arm, highlight, or boot is a failure. Below-waist crop must read left-contact → right-pass → right-contact → left-pass.
```

### 3. `sjh4018` — walk

- 저장 파일: `char-sjh4018-walk.png`
- 새 대화: 예 (`S7-CH-sjh4018`)
- 첨부 레퍼런스: `tmp/world-src/characters/char-sjh4018-turn.png`, 현재 `char-sjh4018-walk.png`

```text
Using the attached turnaround sheet as the identity reference, regenerate only sjh4018's walk cycle. Create one transparent 1536x1024 pixel-art sprite sheet, strict 4 columns by 3 rows. Top row walks toward camera, middle row walks right, bottom row walks away. Every row is: frame 1 left foot forward contact, frame 2 passing pose, frame 3 right foot forward contact, frame 4 passing pose. HARD SIDE-VIEW ACCEPTANCE (middle row, moving right): frame 1 MUST show the LEFT boot as the frontmost, screen-right contact; frame 3 MUST show the RIGHT boot as the frontmost, screen-right contact. In both frames, both boots must be fully visible, non-overlapping, and separated by a clear horizontal stride gap. The leading boot must visibly swap even if the upper body is covered. Never reuse the same leg silhouette, stack one boot behind the other, hide a boot behind hair/clothes/a prop, or animate only the arms. Frames 2 and 4 must be visibly different passing poses. Reject and redraw the sheet yourself if this check fails. Arms swing opposite the legs; her very long sky-blue hair moves only one or two pixels. Keep exact hairband, white-and-mint kit, proportions, palette, pixel scale, baseline, and no shadows/grid/text. High-detail crisp 32-bit JRPG pixel art, dark teal one-pixel outline, no blur or 3D rendering.
MIDDLE-ROW POSE CONSTRUCTION: Treat both legs as complete, separate hip-to-boot limbs on distinct near/lower and far/upper depth tracks. Frame 1 is LEFT contact: LEFT boot frontmost at screen-right and RIGHT boot trailing at screen-left. Frame 2 is RIGHT passing: RIGHT boot lifted beneath the torso while LEFT leg supports behind. Frame 3 is RIGHT contact: RIGHT boot frontmost at screen-right and LEFT boot trailing at screen-left. Frame 4 is LEFT passing: LEFT boot lifted beneath the torso while RIGHT leg supports behind. Frames 1 and 3 must swap leading-limb identity, depth track, and hip-to-boot diagonal; changing only a toe, knee, arm, highlight, or boot is a failure. Below-waist crop must read left-contact → right-pass → right-contact → left-pass.
```

### 4. `doormomo` — walk

- 저장 파일: `char-doormomo-walk.png`
- 새 대화: 예 (`S7-CH-doormomo`)
- 첨부 레퍼런스: `tmp/world-src/characters/char-doormomo-turn.png`, 현재 `char-doormomo-walk.png`

```text
Using the attached turnaround sheet as the identity reference, regenerate only doormomo's walk cycle. Create one transparent 1536x1024 pixel-art sprite sheet, strict 4 columns by 3 rows. Top row walks toward camera, middle row walks right, bottom row walks away. Every row is: frame 1 left foot forward contact, frame 2 passing pose, frame 3 right foot forward contact, frame 4 passing pose. HARD SIDE-VIEW ACCEPTANCE (middle row, moving right): frame 1 MUST show the LEFT boot as the frontmost, screen-right contact; frame 3 MUST show the RIGHT boot as the frontmost, screen-right contact. In both frames, both boots must be fully visible, non-overlapping, and separated by a clear horizontal stride gap. The leading boot must visibly swap even if the upper body is covered. Never reuse the same leg silhouette, stack one boot behind the other, hide a boot behind hair/clothes/a prop, or animate only the arms. Frames 2 and 4 must be visibly different passing poses. Reject and redraw the sheet yourself if this check fails. Arms swing opposite the legs. Keep exact purple-black bob, white headband, star hairpin, white-and-mint kit, proportions, palette, pixel scale, baseline, and no shadows/grid/text. High-detail crisp 32-bit JRPG pixel art, dark teal one-pixel outline, no blur or 3D rendering.
MIDDLE-ROW POSE CONSTRUCTION: Treat both legs as complete, separate hip-to-boot limbs on distinct near/lower and far/upper depth tracks. Frame 1 is LEFT contact: LEFT boot frontmost at screen-right and RIGHT boot trailing at screen-left. Frame 2 is RIGHT passing: RIGHT boot lifted beneath the torso while LEFT leg supports behind. Frame 3 is RIGHT contact: RIGHT boot frontmost at screen-right and LEFT boot trailing at screen-left. Frame 4 is LEFT passing: LEFT boot lifted beneath the torso while RIGHT leg supports behind. Frames 1 and 3 must swap leading-limb identity, depth track, and hip-to-boot diagonal; changing only a toe, knee, arm, highlight, or boot is a failure. Below-waist crop must read left-contact → right-pass → right-contact → left-pass.
```

### 5. `hachi97` — walk

- 저장 파일: `char-hachi97-walk.png`
- 새 대화: 예 (`S7-CH-hachi97`)
- 첨부 레퍼런스: `tmp/world-src/characters/char-hachi97-turn.png`, 현재 `char-hachi97-walk.png`

```text
Using the attached turnaround sheet as the identity reference, regenerate only hachi97's walk cycle. Create one transparent 1536x1024 pixel-art sprite sheet, strict 4 columns by 3 rows. Top row walks toward camera, middle row walks right, bottom row walks away. Every row is: frame 1 left foot forward contact, frame 2 passing pose, frame 3 right foot forward contact, frame 4 passing pose. HARD SIDE-VIEW ACCEPTANCE (middle row, moving right): frame 1 MUST show the LEFT boot as the frontmost, screen-right contact; frame 3 MUST show the RIGHT boot as the frontmost, screen-right contact. In both frames, both boots must be fully visible, non-overlapping, and separated by a clear horizontal stride gap. The leading boot must visibly swap even if the upper body is covered. Never reuse the same leg silhouette, stack one boot behind the other, hide a boot behind hair/clothes/a prop, or animate only the arms. Frames 2 and 4 must be visibly different passing poses. Reject and redraw the sheet yourself if this check fails. Arms swing opposite the legs. Keep exact black bob, white streak, antler-like ornaments, white-and-mint kit, proportions, palette, pixel scale, baseline, and no shadows/grid/text. High-detail crisp 32-bit JRPG pixel art, dark teal one-pixel outline, no blur or 3D rendering.
MIDDLE-ROW POSE CONSTRUCTION: Treat both legs as complete, separate hip-to-boot limbs on distinct near/lower and far/upper depth tracks. Frame 1 is LEFT contact: LEFT boot frontmost at screen-right and RIGHT boot trailing at screen-left. Frame 2 is RIGHT passing: RIGHT boot lifted beneath the torso while LEFT leg supports behind. Frame 3 is RIGHT contact: RIGHT boot frontmost at screen-right and LEFT boot trailing at screen-left. Frame 4 is LEFT passing: LEFT boot lifted beneath the torso while RIGHT leg supports behind. Frames 1 and 3 must swap leading-limb identity, depth track, and hip-to-boot diagonal; changing only a toe, knee, arm, highlight, or boot is a failure. Below-waist crop must read left-contact → right-pass → right-contact → left-pass.
```

### 6. `kaksjak0730` — walk

- 저장 파일: `char-kaksjak0730-walk.png`
- 새 대화: 예 (`S7-CH-kaksjak0730`)
- 첨부 레퍼런스: `tmp/world-src/characters/char-kaksjak0730-turn.png`, 현재 `char-kaksjak0730-walk.png`

```text
Using the attached turnaround sheet as the identity reference, regenerate only kaksjak0730's walk cycle. Create one transparent 1536x1024 pixel-art sprite sheet, strict 4 columns by 3 rows. Top row walks toward camera, middle row walks right, bottom row walks away. Every row is: frame 1 left foot forward contact, frame 2 passing pose, frame 3 right foot forward contact, frame 4 passing pose. HARD SIDE-VIEW ACCEPTANCE (middle row, moving right): frame 1 MUST show the LEFT boot as the frontmost, screen-right contact; frame 3 MUST show the RIGHT boot as the frontmost, screen-right contact. In both frames, both boots must be fully visible, non-overlapping, and separated by a clear horizontal stride gap. The leading boot must visibly swap even if the upper body is covered. Never reuse the same leg silhouette, stack one boot behind the other, hide a boot behind hair/clothes/a prop, or animate only the arms. Frames 2 and 4 must be visibly different passing poses. Reject and redraw the sheet yourself if this check fails. Arms swing opposite the legs. Keep exact high black ponytail, cat-ear headphones, star hairpin, white-and-mint kit, proportions, palette, pixel scale, baseline, and no shadows/grid/text. High-detail crisp 32-bit JRPG pixel art, dark teal one-pixel outline, no blur or 3D rendering.
MIDDLE-ROW POSE CONSTRUCTION: Treat both legs as complete, separate hip-to-boot limbs on distinct near/lower and far/upper depth tracks. Frame 1 is LEFT contact: LEFT boot frontmost at screen-right and RIGHT boot trailing at screen-left. Frame 2 is RIGHT passing: RIGHT boot lifted beneath the torso while LEFT leg supports behind. Frame 3 is RIGHT contact: RIGHT boot frontmost at screen-right and LEFT boot trailing at screen-left. Frame 4 is LEFT passing: LEFT boot lifted beneath the torso while RIGHT leg supports behind. Frames 1 and 3 must swap leading-limb identity, depth track, and hip-to-boot diagonal; changing only a toe, knee, arm, highlight, or boot is a failure. Below-waist crop must read left-contact → right-pass → right-contact → left-pass.
```

### 7. `ju010228` — walk

- 저장 파일: `char-ju010228-walk.png`
- 새 대화: 예 (`S7-CH-ju010228`)
- 첨부 레퍼런스: `tmp/world-src/characters/char-ju010228-turn.png`, 현재 `char-ju010228-walk.png`

```text
Using the attached turnaround sheet as the identity reference, regenerate only ju010228's walk cycle. Create one transparent 1536x1024 pixel-art sprite sheet, strict 4 columns by 3 rows. Top row walks toward camera, middle row walks right, bottom row walks away. Every row is: frame 1 left foot forward contact, frame 2 passing pose, frame 3 right foot forward contact, frame 4 passing pose. HARD SIDE-VIEW ACCEPTANCE (middle row, moving right): frame 1 MUST show the LEFT boot as the frontmost, screen-right contact; frame 3 MUST show the RIGHT boot as the frontmost, screen-right contact. In both frames, both boots must be fully visible, non-overlapping, and separated by a clear horizontal stride gap. The leading boot must visibly swap even if the upper body is covered. Never reuse the same leg silhouette, stack one boot behind the other, hide a boot behind hair/clothes/a prop, or animate only the arms. Frames 2 and 4 must be visibly different passing poses. Reject and redraw the sheet yourself if this check fails. Arms swing opposite the legs; her very long green hair and side ribbon move only one or two pixels. Keep white-and-mint kit, proportions, palette, pixel scale, baseline, and no shadows/grid/text. High-detail crisp 32-bit JRPG pixel art, dark teal one-pixel outline, no blur or 3D rendering.
MIDDLE-ROW POSE CONSTRUCTION: Treat both legs as complete, separate hip-to-boot limbs on distinct near/lower and far/upper depth tracks. Frame 1 is LEFT contact: LEFT boot frontmost at screen-right and RIGHT boot trailing at screen-left. Frame 2 is RIGHT passing: RIGHT boot lifted beneath the torso while LEFT leg supports behind. Frame 3 is RIGHT contact: RIGHT boot frontmost at screen-right and LEFT boot trailing at screen-left. Frame 4 is LEFT passing: LEFT boot lifted beneath the torso while RIGHT leg supports behind. Frames 1 and 3 must swap leading-limb identity, depth track, and hip-to-boot diagonal; changing only a toe, knee, arm, highlight, or boot is a failure. Below-waist crop must read left-contact → right-pass → right-contact → left-pass.
```

### 8. `haepalin` — walk

- 저장 파일: `char-haepalin-walk.png`
- 새 대화: 예 (`S7-CH-haepalin`)
- 첨부 레퍼런스: `tmp/world-src/characters/char-haepalin-turn.png`, 현재 `char-haepalin-walk.png`

```text
Using the attached turnaround sheet as the identity reference, regenerate only haepalin's walk cycle. Create one transparent 1536x1024 pixel-art sprite sheet, strict 4 columns by 3 rows. Top row walks toward camera, middle row walks right, bottom row walks away. Every row is: frame 1 left foot forward contact, frame 2 passing pose, frame 3 right foot forward contact, frame 4 passing pose. HARD SIDE-VIEW ACCEPTANCE (middle row, moving right): frame 1 MUST show the LEFT boot as the frontmost, screen-right contact; frame 3 MUST show the RIGHT boot as the frontmost, screen-right contact. In both frames, both boots must be fully visible, non-overlapping, and separated by a clear horizontal stride gap. The leading boot must visibly swap even if the upper body is covered. Never reuse the same leg silhouette, stack one boot behind the other, hide a boot behind hair/clothes/a prop, or animate only the arms. Frames 2 and 4 must be visibly different passing poses. Reject and redraw the sheet yourself if this check fails. Arms swing opposite the legs. Keep exact lavender bob, ahoge, jellyfish ornament and heart clips, white-and-mint kit, proportions, palette, pixel scale, baseline, and no shadows/grid/text. High-detail crisp 32-bit JRPG pixel art, dark teal one-pixel outline, no blur or 3D rendering.
MIDDLE-ROW POSE CONSTRUCTION: Treat both legs as complete, separate hip-to-boot limbs on distinct near/lower and far/upper depth tracks. Frame 1 is LEFT contact: LEFT boot frontmost at screen-right and RIGHT boot trailing at screen-left. Frame 2 is RIGHT passing: RIGHT boot lifted beneath the torso while LEFT leg supports behind. Frame 3 is RIGHT contact: RIGHT boot frontmost at screen-right and LEFT boot trailing at screen-left. Frame 4 is LEFT passing: LEFT boot lifted beneath the torso while RIGHT leg supports behind. Frames 1 and 3 must swap leading-limb identity, depth track, and hip-to-boot diagonal; changing only a toe, knee, arm, highlight, or boot is a failure. Below-waist crop must read left-contact → right-pass → right-contact → left-pass.
```

### 9. `tleod1818` — walk

- 저장 파일: `char-tleod1818-walk.png`
- 새 대화: 예 (`S7-CH-tleod1818`)
- 첨부 레퍼런스: `tmp/world-src/characters/char-tleod1818-turn.png`, 현재 `char-tleod1818-walk.png`

```text
Using the attached turnaround sheet as the identity reference, regenerate only tleod1818's walk cycle. Create one transparent 1536x1024 pixel-art sprite sheet, strict 4 columns by 3 rows. Top row walks toward camera, middle row walks right, bottom row walks away. Every row is: frame 1 left foot forward contact, frame 2 passing pose, frame 3 right foot forward contact, frame 4 passing pose. HARD SIDE-VIEW ACCEPTANCE (middle row, moving right): frame 1 MUST show the LEFT boot as the frontmost, screen-right contact; frame 3 MUST show the RIGHT boot as the frontmost, screen-right contact. In both frames, both boots must be fully visible, non-overlapping, and separated by a clear horizontal stride gap. The leading boot must visibly swap even if the upper body is covered. Never reuse the same leg silhouette, stack one boot behind the other, hide a boot behind hair/clothes/a prop, or animate only the arms. Frames 2 and 4 must be visibly different passing poses. Reject and redraw the sheet yourself if this check fails. Arms swing opposite the legs. Keep exact black hair bun, green leaf pin, white flower, black ribbon choker, white-and-mint kit, proportions, palette, pixel scale, baseline, and no shadows/grid/text. High-detail crisp 32-bit JRPG pixel art, dark teal one-pixel outline, no blur or 3D rendering.
MIDDLE-ROW POSE CONSTRUCTION: Treat both legs as complete, separate hip-to-boot limbs on distinct near/lower and far/upper depth tracks. Frame 1 is LEFT contact: LEFT boot frontmost at screen-right and RIGHT boot trailing at screen-left. Frame 2 is RIGHT passing: RIGHT boot lifted beneath the torso while LEFT leg supports behind. Frame 3 is RIGHT contact: RIGHT boot frontmost at screen-right and LEFT boot trailing at screen-left. Frame 4 is LEFT passing: LEFT boot lifted beneath the torso while RIGHT leg supports behind. Frames 1 and 3 must swap leading-limb identity, depth track, and hip-to-boot diagonal; changing only a toe, knee, arm, highlight, or boot is a failure. Below-waist crop must read left-contact → right-pass → right-contact → left-pass.
```

### 10. `tdnlamuron` — walk

- 저장 파일: `char-tdnlamuron-walk.png`
- 새 대화: 예 (`S7-CH-tdnlamuron`)
- 첨부 레퍼런스: `tmp/world-src/characters/char-tdnlamuron-turn.png`, 현재 `char-tdnlamuron-walk.png`

```text
Using the attached turnaround sheet as the identity reference, regenerate only tdnlamuron's walk cycle. Create one transparent 1536x1024 pixel-art sprite sheet, strict 4 columns by 3 rows. Top row walks toward camera, middle row walks right, bottom row walks away. Every row is: frame 1 left foot forward contact, frame 2 passing pose, frame 3 right foot forward contact, frame 4 passing pose. HARD SIDE-VIEW ACCEPTANCE (middle row, moving right): frame 1 MUST show the LEFT boot as the frontmost, screen-right contact; frame 3 MUST show the RIGHT boot as the frontmost, screen-right contact. In both frames, both boots must be fully visible, non-overlapping, and separated by a clear horizontal stride gap. The leading boot must visibly swap even if the upper body is covered. Never reuse the same leg silhouette, stack one boot behind the other, hide a boot behind hair/clothes/a prop, or animate only the arms. Frames 2 and 4 must be visibly different passing poses. Reject and redraw the sheet yourself if this check fails. Arms swing opposite the legs. Keep exact black hair with orange/white streaks, cat ears, black choker, white-and-mint kit, proportions, palette, pixel scale, baseline, and no shadows/grid/text. High-detail crisp 32-bit JRPG pixel art, dark teal one-pixel outline, no blur or 3D rendering.
MIDDLE-ROW POSE CONSTRUCTION: Treat both legs as complete, separate hip-to-boot limbs on distinct near/lower and far/upper depth tracks. Frame 1 is LEFT contact: LEFT boot frontmost at screen-right and RIGHT boot trailing at screen-left. Frame 2 is RIGHT passing: RIGHT boot lifted beneath the torso while LEFT leg supports behind. Frame 3 is RIGHT contact: RIGHT boot frontmost at screen-right and LEFT boot trailing at screen-left. Frame 4 is LEFT passing: LEFT boot lifted beneath the torso while RIGHT leg supports behind. Frames 1 and 3 must swap leading-limb identity, depth track, and hip-to-boot diagonal; changing only a toe, knee, arm, highlight, or boot is a failure. Below-waist crop must read left-contact → right-pass → right-contact → left-pass.
```

### 11. `lina0108` — walk

- 저장 파일: `char-lina0108-walk.png`
- 새 대화: 예 (`S7-CH-lina0108`)
- 첨부 레퍼런스: `tmp/world-src/characters/char-lina0108-turn.png`, 현재 `char-lina0108-walk.png`

```text
Using the attached turnaround sheet as the identity reference, regenerate only lina0108's walk cycle. Create one transparent 1536x1024 pixel-art sprite sheet, strict 4 columns by 3 rows. Top row walks toward camera, middle row walks right, bottom row walks away. Every row is: frame 1 left foot forward contact, frame 2 passing pose, frame 3 right foot forward contact, frame 4 passing pose. HARD SIDE-VIEW ACCEPTANCE (middle row, moving right): frame 1 MUST show the LEFT boot as the frontmost, screen-right contact; frame 3 MUST show the RIGHT boot as the frontmost, screen-right contact. In both frames, both boots must be fully visible, non-overlapping, and separated by a clear horizontal stride gap. The leading boot must visibly swap even if the upper body is covered. Never reuse the same leg silhouette, stack one boot behind the other, hide a boot behind hair/clothes/a prop, or animate only the arms. Frames 2 and 4 must be visibly different passing poses. Reject and redraw the sheet yourself if this check fails. Arms swing opposite the legs. Keep exact long messy red-pink hair, white streak, small horns, white-and-mint kit, proportions, palette, pixel scale, baseline, and no shadows/grid/text. High-detail crisp 32-bit JRPG pixel art, dark teal one-pixel outline, no blur or 3D rendering.
MIDDLE-ROW POSE CONSTRUCTION: Treat both legs as complete, separate hip-to-boot limbs on distinct near/lower and far/upper depth tracks. Frame 1 is LEFT contact: LEFT boot frontmost at screen-right and RIGHT boot trailing at screen-left. Frame 2 is RIGHT passing: RIGHT boot lifted beneath the torso while LEFT leg supports behind. Frame 3 is RIGHT contact: RIGHT boot frontmost at screen-right and LEFT boot trailing at screen-left. Frame 4 is LEFT passing: LEFT boot lifted beneath the torso while RIGHT leg supports behind. Frames 1 and 3 must swap leading-limb identity, depth track, and hip-to-boot diagonal; changing only a toe, knee, arm, highlight, or boot is a failure. Below-waist crop must read left-contact → right-pass → right-contact → left-pass.
```

### 12. `woowakgood` — walk

- 저장 파일: `char-woowakgood-walk.png`
- 새 대화: 예 (`S7-CH-woowakgood`)
- 첨부 레퍼런스: `tmp/world-src/characters/char-woowakgood-turn.png`, 현재 `char-woowakgood-walk.png`

```text
Using the attached turnaround sheet as the identity reference, regenerate only woowakgood's walk cycle. Create one transparent 1536x1024 pixel-art sprite sheet, strict 4 columns by 3 rows. Top row walks toward camera, middle row walks right, bottom row walks away. Every row is: frame 1 left foot forward contact, frame 2 passing pose, frame 3 right foot forward contact, frame 4 passing pose. HARD SIDE-VIEW ACCEPTANCE (middle row, moving right): frame 1 MUST show the LEFT boot as the frontmost, screen-right contact; frame 3 MUST show the RIGHT boot as the frontmost, screen-right contact. In both frames, both boots must be fully visible, non-overlapping, and separated by a clear horizontal stride gap. The leading boot must visibly swap even if the upper body is covered. Never reuse the same leg silhouette, stack one boot behind the other, hide a boot behind hair/clothes/a prop, or animate only the arms. Frames 2 and 4 must be visibly different passing poses. Reject and redraw the sheet yourself if this check fails. Arms swing opposite the legs. Keep the golden-tan animal mascot head, ears, headset, black suit, white shirt, mint tie and pocket square exactly; retain adult proportions. No shadows/grid/text. High-detail crisp 32-bit JRPG pixel art, dark teal one-pixel outline, no blur or 3D rendering.
MIDDLE-ROW POSE CONSTRUCTION: Treat both legs as complete, separate hip-to-boot limbs on distinct near/lower and far/upper depth tracks. Frame 1 is LEFT contact: LEFT boot frontmost at screen-right and RIGHT boot trailing at screen-left. Frame 2 is RIGHT passing: RIGHT boot lifted beneath the torso while LEFT leg supports behind. Frame 3 is RIGHT contact: RIGHT boot frontmost at screen-right and LEFT boot trailing at screen-left. Frame 4 is LEFT passing: LEFT boot lifted beneath the torso while RIGHT leg supports behind. Frames 1 and 3 must swap leading-limb identity, depth track, and hip-to-boot diagonal; changing only a toe, knee, arm, highlight, or boot is a failure. Below-waist crop must read left-contact → right-pass → right-contact → left-pass.
```

### 13. `elder` — walk

- 저장 파일: `char-elder-walk.png`
- 새 대화: 예 (`S7-CH-elder`)
- 첨부 레퍼런스: `tmp/world-src/characters/char-elder-turn.png`, 현재 `char-elder-walk.png`

```text
Using the attached turnaround sheet as the identity reference, regenerate only elder's walk cycle. Create one transparent 1536x1024 pixel-art sprite sheet, strict 4 columns by 3 rows. Top row walks toward camera, middle row walks right, bottom row walks away. Every row is: frame 1 left foot forward contact, frame 2 passing pose, frame 3 right foot forward contact, frame 4 passing pose. HARD SIDE-VIEW ACCEPTANCE (middle row, moving right): frame 1 MUST show the LEFT boot as the frontmost, screen-right contact; frame 3 MUST show the RIGHT boot as the frontmost, screen-right contact. In both frames, both boots must be fully visible, non-overlapping, and separated by a clear horizontal stride gap. The leading boot must visibly swap even if the upper body is covered. Never reuse the same leg silhouette, stack one boot behind the other, hide a boot behind hair/clothes/a prop, or animate only the arms. Frames 2 and 4 must be visibly different passing poses. Reject and redraw the sheet yourself if this check fails. Arms swing opposite the legs, while keeping his watering can stable. Preserve the straw hat, moustache, apron, proportions, palette, pixel scale, baseline, and no shadows/grid/text. High-detail crisp 32-bit JRPG pixel art, dark teal one-pixel outline, no blur or 3D rendering.
MIDDLE-ROW POSE CONSTRUCTION: Treat both legs as complete, separate hip-to-boot limbs on distinct near/lower and far/upper depth tracks. Frame 1 is LEFT contact: LEFT boot frontmost at screen-right and RIGHT boot trailing at screen-left. Frame 2 is RIGHT passing: RIGHT boot lifted beneath the torso while LEFT leg supports behind. Frame 3 is RIGHT contact: RIGHT boot frontmost at screen-right and LEFT boot trailing at screen-left. Frame 4 is LEFT passing: LEFT boot lifted beneath the torso while RIGHT leg supports behind. Frames 1 and 3 must swap leading-limb identity, depth track, and hip-to-boot diagonal; changing only a toe, knee, arm, highlight, or boot is a failure. Below-waist crop must read left-contact → right-pass → right-contact → left-pass.
```

### 14. `shopkeeper` — walk

- 저장 파일: `char-shopkeeper-walk.png`
- 새 대화: 예 (`S7-CH-shopkeeper`)
- 첨부 레퍼런스: `tmp/world-src/characters/char-shopkeeper-turn.png`, 현재 `char-shopkeeper-walk.png`

```text
Using the attached turnaround sheet as the identity reference, regenerate only shopkeeper's walk cycle. Create one transparent 1536x1024 pixel-art sprite sheet, strict 4 columns by 3 rows. Top row walks toward camera, middle row walks right, bottom row walks away. Every row is: frame 1 left foot forward contact, frame 2 passing pose, frame 3 right foot forward contact, frame 4 passing pose. HARD SIDE-VIEW ACCEPTANCE (middle row, moving right): frame 1 MUST show the LEFT boot as the frontmost, screen-right contact; frame 3 MUST show the RIGHT boot as the frontmost, screen-right contact. In both frames, both boots must be fully visible, non-overlapping, and separated by a clear horizontal stride gap. The leading boot must visibly swap even if the upper body is covered. Never reuse the same leg silhouette, stack one boot behind the other, hide a boot behind hair/clothes/a prop, or animate only the arms. Frames 2 and 4 must be visibly different passing poses. Reject and redraw the sheet yourself if this check fails. Arms swing opposite the legs while keeping the cardboard box readable. Preserve glasses, store apron, proportions, palette, pixel scale, baseline, and no shadows/grid/text. High-detail crisp 32-bit JRPG pixel art, dark teal one-pixel outline, no blur or 3D rendering.
MIDDLE-ROW POSE CONSTRUCTION: Treat both legs as complete, separate hip-to-boot limbs on distinct near/lower and far/upper depth tracks. Frame 1 is LEFT contact: LEFT boot frontmost at screen-right and RIGHT boot trailing at screen-left. Frame 2 is RIGHT passing: RIGHT boot lifted beneath the torso while LEFT leg supports behind. Frame 3 is RIGHT contact: RIGHT boot frontmost at screen-right and LEFT boot trailing at screen-left. Frame 4 is LEFT passing: LEFT boot lifted beneath the torso while RIGHT leg supports behind. Frames 1 and 3 must swap leading-limb identity, depth track, and hip-to-boot diagonal; changing only a toe, knee, arm, highlight, or boot is a failure. Below-waist crop must read left-contact → right-pass → right-contact → left-pass.
```

### 15. `kid` — walk

- 저장 파일: `char-kid-walk.png`
- 새 대화: 예 (`S7-CH-kid`)
- 첨부 레퍼런스: `tmp/world-src/characters/char-kid-turn.png`, 현재 `char-kid-walk.png`

```text
Using the attached turnaround sheet as the identity reference, regenerate only kid's walk cycle. Create one transparent 1536x1024 pixel-art sprite sheet, strict 4 columns by 3 rows. Top row walks toward camera, middle row walks right, bottom row walks away. Every row is: frame 1 left foot forward contact, frame 2 passing pose, frame 3 right foot forward contact, frame 4 passing pose. HARD SIDE-VIEW ACCEPTANCE (middle row, moving right): frame 1 MUST show the LEFT boot as the frontmost, screen-right contact; frame 3 MUST show the RIGHT boot as the frontmost, screen-right contact. In both frames, both boots must be fully visible, non-overlapping, and separated by a clear horizontal stride gap. The leading boot must visibly swap even if the upper body is covered. Never reuse the same leg silhouette, stack one boot behind the other, hide a boot behind hair/clothes/a prop, or animate only the arms. Frames 2 and 4 must be visibly different passing poses. Reject and redraw the sheet yourself if this check fails. Arms swing opposite the legs while preserving the pennant. Keep the child at about 75% adult height, oversized white-and-mint jersey, red scarf, bucket hat, proportions, palette, pixel scale, baseline, and no shadows/grid/text. High-detail crisp 32-bit JRPG pixel art, dark teal one-pixel outline, no blur or 3D rendering.
MIDDLE-ROW POSE CONSTRUCTION: Treat both legs as complete, separate hip-to-boot limbs on distinct near/lower and far/upper depth tracks. Frame 1 is LEFT contact: LEFT boot frontmost at screen-right and RIGHT boot trailing at screen-left. Frame 2 is RIGHT passing: RIGHT boot lifted beneath the torso while LEFT leg supports behind. Frame 3 is RIGHT contact: RIGHT boot frontmost at screen-right and LEFT boot trailing at screen-left. Frame 4 is LEFT passing: LEFT boot lifted beneath the torso while RIGHT leg supports behind. Frames 1 and 3 must swap leading-limb identity, depth track, and hip-to-boot diagonal; changing only a toe, knee, arm, highlight, or boot is a failure. Below-waist crop must read left-contact → right-pass → right-contact → left-pass.
```

### 16. `referee` — walk

- 저장 파일: `char-referee-walk.png`
- 새 대화: 예 (`S7-CH-referee`)
- 첨부 레퍼런스: `tmp/world-src/characters/char-referee-turn.png`, 현재 `char-referee-walk.png`

```text
Using the attached turnaround sheet as the identity reference, regenerate only referee's walk cycle. Create one transparent 1536x1024 pixel-art sprite sheet, strict 4 columns by 3 rows. Top row walks toward camera, middle row walks right, bottom row walks away. Every row is: frame 1 left foot forward contact, frame 2 passing pose, frame 3 right foot forward contact, frame 4 passing pose. HARD SIDE-VIEW ACCEPTANCE (middle row, moving right): frame 1 MUST show the LEFT boot as the frontmost, screen-right contact; frame 3 MUST show the RIGHT boot as the frontmost, screen-right contact. In both frames, both boots must be fully visible, non-overlapping, and separated by a clear horizontal stride gap. The leading boot must visibly swap even if the upper body is covered. Never reuse the same leg silhouette, stack one boot behind the other, hide a boot behind hair/clothes/a prop, or animate only the arms. Frames 2 and 4 must be visibly different passing poses. Reject and redraw the sheet yourself if this check fails. Arms swing opposite the legs. Preserve black referee kit with yellow trim, whistle and card-pocket details, proportions, palette, pixel scale, baseline, and no shadows/grid/text. High-detail crisp 32-bit JRPG pixel art, dark teal one-pixel outline, no blur or 3D rendering.
MIDDLE-ROW POSE CONSTRUCTION: Treat both legs as complete, separate hip-to-boot limbs on distinct near/lower and far/upper depth tracks. Frame 1 is LEFT contact: LEFT boot frontmost at screen-right and RIGHT boot trailing at screen-left. Frame 2 is RIGHT passing: RIGHT boot lifted beneath the torso while LEFT leg supports behind. Frame 3 is RIGHT contact: RIGHT boot frontmost at screen-right and LEFT boot trailing at screen-left. Frame 4 is LEFT passing: LEFT boot lifted beneath the torso while RIGHT leg supports behind. Frames 1 and 3 must swap leading-limb identity, depth track, and hip-to-boot diagonal; changing only a toe, knee, arm, highlight, or boot is a failure. Below-waist crop must read left-contact → right-pass → right-contact → left-pass.
```

### 17. `weedking` — walk

- 저장 파일: `char-weedking-walk.png`
- 새 대화: 예 (`S7-CH-weedking`)
- 첨부 레퍼런스: `tmp/world-src/characters/char-weedking-turn.png`, 현재 `char-weedking-walk.png`

```text
Using the attached turnaround sheet as the identity reference, regenerate only weedking's walk cycle. Create one transparent 1536x1024 pixel-art sprite sheet, strict 4 columns by 3 rows. Top row walks toward camera, middle row walks right, bottom row walks away. Every row is: frame 1 left foot forward contact, frame 2 passing pose, frame 3 right foot forward contact, frame 4 passing pose. HARD SIDE-VIEW ACCEPTANCE (middle row, moving right): frame 1 MUST show the LEFT boot as the frontmost, screen-right contact; frame 3 MUST show the RIGHT boot as the frontmost, screen-right contact. In both frames, both boots must be fully visible, non-overlapping, and separated by a clear horizontal stride gap. The leading boot must visibly swap even if the upper body is covered. Never reuse the same leg silhouette, stack one boot behind the other, hide a boot behind hair/clothes/a prop, or animate only the arms. Frames 2 and 4 must be visibly different passing poses. Reject and redraw the sheet yourself if this check fails. Arms swing opposite the legs, but the grass trimmer stays recognisable. Preserve taller villain proportions, blade crown, coat, sunglasses, moustache, palette, pixel scale, baseline, and no shadows/grid/text. High-detail crisp 32-bit JRPG pixel art, dark teal one-pixel outline, no blur or 3D rendering.
MIDDLE-ROW POSE CONSTRUCTION: Treat both legs as complete, separate hip-to-boot limbs on distinct near/lower and far/upper depth tracks. Frame 1 is LEFT contact: LEFT boot frontmost at screen-right and RIGHT boot trailing at screen-left. Frame 2 is RIGHT passing: RIGHT boot lifted beneath the torso while LEFT leg supports behind. Frame 3 is RIGHT contact: RIGHT boot frontmost at screen-right and LEFT boot trailing at screen-left. Frame 4 is LEFT passing: LEFT boot lifted beneath the torso while RIGHT leg supports behind. Frames 1 and 3 must swap leading-limb identity, depth track, and hip-to-boot diagonal; changing only a toe, knee, arm, highlight, or boot is a failure. Below-waist crop must read left-contact → right-pass → right-contact → left-pass.
```

### 18. `weeder-grunt` — walk

- 저장 파일: `char-weeder-grunt-walk.png`
- 새 대화: 예 (`S7-CH-weeder-grunt`)
- 첨부 레퍼런스: `tmp/world-src/characters/char-weeder-grunt-turn.png`, 현재 `char-weeder-grunt-walk.png`

```text
Using the attached turnaround sheet as the identity reference, regenerate only weeder-grunt's walk cycle. Create one transparent 1536x1024 pixel-art sprite sheet, strict 4 columns by 3 rows. Top row walks toward camera, middle row walks right, bottom row walks away. Every row is: frame 1 left foot forward contact, frame 2 passing pose, frame 3 right foot forward contact, frame 4 passing pose. HARD SIDE-VIEW ACCEPTANCE (middle row, moving right): frame 1 MUST show the LEFT boot as the frontmost, screen-right contact; frame 3 MUST show the RIGHT boot as the frontmost, screen-right contact. In both frames, both boots must be fully visible, non-overlapping, and separated by a clear horizontal stride gap. The leading boot must visibly swap even if the upper body is covered. Never reuse the same leg silhouette, stack one boot behind the other, hide a boot behind hair/clothes/a prop, or animate only the arms. Frames 2 and 4 must be visibly different passing poses. Reject and redraw the sheet yourself if this check fails. Arms swing opposite the legs, while keeping the hand trimmer stable. Preserve coveralls, rust-orange stripes, hard hat, visor and gloves, proportions, palette, pixel scale, baseline, and no shadows/grid/text. High-detail crisp 32-bit JRPG pixel art, dark teal one-pixel outline, no blur or 3D rendering.
MIDDLE-ROW POSE CONSTRUCTION: Treat both legs as complete, separate hip-to-boot limbs on distinct near/lower and far/upper depth tracks. Frame 1 is LEFT contact: LEFT boot frontmost at screen-right and RIGHT boot trailing at screen-left. Frame 2 is RIGHT passing: RIGHT boot lifted beneath the torso while LEFT leg supports behind. Frame 3 is RIGHT contact: RIGHT boot frontmost at screen-right and LEFT boot trailing at screen-left. Frame 4 is LEFT passing: LEFT boot lifted beneath the torso while RIGHT leg supports behind. Frames 1 and 3 must swap leading-limb identity, depth track, and hip-to-boot diagonal; changing only a toe, knee, arm, highlight, or boot is a failure. Below-waist crop must read left-contact → right-pass → right-contact → left-pass.
```

### 19. `cat-jandi` — walk

- 저장 파일: `char-cat-jandi-walk.png`
- 새 대화: 예 (`S7-ANIMAL-cat-jandi`)
- 첨부 레퍼런스: 현재 `tmp/world-src/characters/char-cat-jandi-walk.png`

```text
Using the attached cat sprite as the identity reference, regenerate only cat-jandi's walk cycle. Create one transparent 1536x1024 pixel-art sprite sheet, strict 4 columns by 3 rows. Top row walks toward camera, middle row walks right, bottom row walks away. Every row is: frame 1 left front paw forward contact, frame 2 passing pose, frame 3 right front paw forward contact, frame 4 passing pose. HARD SIDE-VIEW ACCEPTANCE (middle row, moving right): frame 1 MUST show the LEFT front paw as the frontmost, screen-right contact; frame 3 MUST show the RIGHT front paw as the frontmost, screen-right contact. In both frames, the two front paws must be fully visible, non-overlapping, and separated by a clear horizontal stride gap; the rear paws must also alternate. Never reuse the same paw silhouette, stack a paw behind another, hide a paw behind fur/the ball/a prop, or animate only the tail. Frames 2 and 4 must be visibly different passing poses. Reject and redraw the sheet yourself if this check fails. Keep the chubby cream-white body, mint patches, leaf, bell collar, exact proportions and pixel scale. No shadows/grid/text; crisp 32-bit JRPG pixel art with dark teal outline and no blur.
MIDDLE-ROW PAW CONSTRUCTION: Treat both front legs as complete, separate shoulder-to-paw limbs on distinct near/lower and far/upper depth tracks; rear paws alternate too. Frame 1 is LEFT-front-paw contact: LEFT front paw frontmost at screen-right and RIGHT front paw trailing at screen-left. Frame 2 is RIGHT-front-paw passing: RIGHT front paw lifted beneath the body. Frame 3 is RIGHT-front-paw contact: RIGHT front paw frontmost at screen-right and LEFT front paw trailing at screen-left. Frame 4 is LEFT-front-paw passing: LEFT front paw lifted beneath the body. Frames 1 and 3 must swap leading paw, depth track, and shoulder-to-paw diagonal; tail-only, toe-only, or duplicated-paw animation is a failure. Below-chest crop must read left-contact → right-pass → right-contact → left-pass.
```

### 20. `dog-ball` — walk

- 저장 파일: `char-dog-ball-walk.png`
- 새 대화: 예 (`S7-ANIMAL-dog-ball`)
- 첨부 레퍼런스: 현재 `tmp/world-src/characters/char-dog-ball-walk.png`

```text
Using the attached puppy sprite as the identity reference, regenerate only dog-ball's walk cycle. Create one transparent 1536x1024 pixel-art sprite sheet, strict 4 columns by 3 rows. Top row walks toward camera, middle row walks right, bottom row walks away. Every row is: frame 1 left front paw forward contact, frame 2 passing pose, frame 3 right front paw forward contact, frame 4 passing pose. HARD SIDE-VIEW ACCEPTANCE (middle row, moving right): frame 1 MUST show the LEFT front paw as the frontmost, screen-right contact; frame 3 MUST show the RIGHT front paw as the frontmost, screen-right contact. In both frames, the two front paws must be fully visible, non-overlapping, and separated by a clear horizontal stride gap; the rear paws must also alternate. Never reuse the same paw silhouette, stack a paw behind another, hide a paw behind fur/the ball/a prop, or animate only the tail. Frames 2 and 4 must be visibly different passing poses. Reject and redraw the sheet yourself if this check fails. Keep brown-and-white floppy ears, mint-and-white football in mouth, wagging tail, exact proportions and pixel scale. No shadows/grid/text; crisp 32-bit JRPG pixel art with dark teal outline and no blur.
MIDDLE-ROW PAW CONSTRUCTION: Treat both front legs as complete, separate shoulder-to-paw limbs on distinct near/lower and far/upper depth tracks; rear paws alternate too. Frame 1 is LEFT-front-paw contact: LEFT front paw frontmost at screen-right and RIGHT front paw trailing at screen-left. Frame 2 is RIGHT-front-paw passing: RIGHT front paw lifted beneath the body. Frame 3 is RIGHT-front-paw contact: RIGHT front paw frontmost at screen-right and LEFT front paw trailing at screen-left. Frame 4 is LEFT-front-paw passing: LEFT front paw lifted beneath the body. Frames 1 and 3 must swap leading paw, depth track, and shoulder-to-paw diagonal; tail-only, toe-only, or duplicated-paw animation is a failure. Below-chest crop must read left-contact → right-pass → right-contact → left-pass.
```

---

## 2. 스탠딩 — 사람/NPC별 독립 요청 18개

아래 18개는 각각 위의 **동일 캐릭터 대화를 유지**한다. 새로 승인한 walk 시트와 현재 `turn` 시트를 모두 첨부한다. 동물은 제외한다.

각 요청의 `id`만 바꿔 쓰지 말고, 아래처럼 해당 파일명으로 저장한다. 프롬프트는 같은 비율을 강제하기 위해 의도적으로 동일하다.

### `janine95kim`

- 저장 파일: `char-janine95kim-stand.png`
- 세션: `S7-CH-janine95kim` 유지
- 첨부 레퍼런스: **새** `char-janine95kim-walk.png`, 현재 `char-janine95kim-turn.png`

```text
Using the attached NEW janine95kim walk sheet as the scale reference and the attached turn sheet as identity reference, regenerate one transparent 1024x1024 front-facing idle stand sprite of the SAME character. Match the walk sheet's body height, head-to-body ratio, leg length, boot size, pixel block size, and feet baseline exactly. Do not make the stand taller, slimmer, or more elongated than a walk-cell character. Keep the black goalkeeper kit, glasses, headset, hair, palette, and relaxed idle pose. Full body centred with small even margin; no shadow, floor, text, or 3D/blur.
```

### `bboringirl`

- 저장 파일: `char-bboringirl-stand.png`
- 세션: `S7-CH-bboringirl` 유지
- 첨부 레퍼런스: **새** `char-bboringirl-walk.png`, 현재 `char-bboringirl-turn.png`

```text
Using the attached NEW bboringirl walk sheet as the scale reference and the attached turn sheet as identity reference, regenerate one transparent 1024x1024 front-facing idle stand sprite of the SAME character. Match the walk sheet's body height, head-to-body ratio, leg length, boot size, pixel block size, and feet baseline exactly. Do not make the stand taller, slimmer, or more elongated than a walk-cell character. Preserve silver-grey hair with red-pink streaks, side ponytail and white-and-mint kit. Full body centred with small even margin; no shadow, floor, text, or 3D/blur.
```

### `sjh4018`

- 저장 파일: `char-sjh4018-stand.png`
- 세션: `S7-CH-sjh4018` 유지
- 첨부 레퍼런스: **새** `char-sjh4018-walk.png`, 현재 `char-sjh4018-turn.png`

```text
Using the attached NEW sjh4018 walk sheet as the scale reference and the attached turn sheet as identity reference, regenerate one transparent 1024x1024 front-facing idle stand sprite of the SAME character. Match the walk sheet's body height, head-to-body ratio, leg length, boot size, pixel block size, and feet baseline exactly. Do not make the stand taller, slimmer, or more elongated than a walk-cell character. Preserve very long sky-blue hair, hairband and white-and-mint kit. Full body centred with small even margin; no shadow, floor, text, or 3D/blur.
```

### `doormomo`

- 저장 파일: `char-doormomo-stand.png`
- 세션: `S7-CH-doormomo` 유지
- 첨부 레퍼런스: **새** `char-doormomo-walk.png`, 현재 `char-doormomo-turn.png`

```text
Using the attached NEW doormomo walk sheet as the scale reference and the attached turn sheet as identity reference, regenerate one transparent 1024x1024 front-facing idle stand sprite of the SAME character. Match the walk sheet's body height, head-to-body ratio, leg length, boot size, pixel block size, and feet baseline exactly. Do not make the stand taller, slimmer, or more elongated than a walk-cell character. Preserve purple-black bob, white headband, star pin and white-and-mint kit. Full body centred with small even margin; no shadow, floor, text, or 3D/blur.
```

### `hachi97`

- 저장 파일: `char-hachi97-stand.png`
- 세션: `S7-CH-hachi97` 유지
- 첨부 레퍼런스: **새** `char-hachi97-walk.png`, 현재 `char-hachi97-turn.png`

```text
Using the attached NEW hachi97 walk sheet as the scale reference and the attached turn sheet as identity reference, regenerate one transparent 1024x1024 front-facing idle stand sprite of the SAME character. Match the walk sheet's body height, head-to-body ratio, leg length, boot size, pixel block size, and feet baseline exactly. Do not make the stand taller, slimmer, or more elongated than a walk-cell character. Preserve black bob, white streak, horn ornaments and white-and-mint kit. Full body centred with small even margin; no shadow, floor, text, or 3D/blur.
```

### `kaksjak0730`

- 저장 파일: `char-kaksjak0730-stand.png`
- 세션: `S7-CH-kaksjak0730` 유지
- 첨부 레퍼런스: **새** `char-kaksjak0730-walk.png`, 현재 `char-kaksjak0730-turn.png`

```text
Using the attached NEW kaksjak0730 walk sheet as the scale reference and the attached turn sheet as identity reference, regenerate one transparent 1024x1024 front-facing idle stand sprite of the SAME character. Match the walk sheet's body height, head-to-body ratio, leg length, boot size, pixel block size, and feet baseline exactly. Do not make the stand taller, slimmer, or more elongated than a walk-cell character. Preserve high ponytail, cat-ear headphones, star pin and white-and-mint kit. Full body centred with small even margin; no shadow, floor, text, or 3D/blur.
```

### `ju010228`

- 저장 파일: `char-ju010228-stand.png`
- 세션: `S7-CH-ju010228` 유지
- 첨부 레퍼런스: **새** `char-ju010228-walk.png`, 현재 `char-ju010228-turn.png`

```text
Using the attached NEW ju010228 walk sheet as the scale reference and the attached turn sheet as identity reference, regenerate one transparent 1024x1024 front-facing idle stand sprite of the SAME character. Match the walk sheet's body height, head-to-body ratio, leg length, boot size, pixel block size, and feet baseline exactly. Do not make the stand taller, slimmer, or more elongated than a walk-cell character. Preserve long green hair, white streak, side ribbon and white-and-mint kit. Full body centred with small even margin; no shadow, floor, text, or 3D/blur.
```

### `haepalin`

- 저장 파일: `char-haepalin-stand.png`
- 세션: `S7-CH-haepalin` 유지
- 첨부 레퍼런스: **새** `char-haepalin-walk.png`, 현재 `char-haepalin-turn.png`

```text
Using the attached NEW haepalin walk sheet as the scale reference and the attached turn sheet as identity reference, regenerate one transparent 1024x1024 front-facing idle stand sprite of the SAME character. Match the walk sheet's body height, head-to-body ratio, leg length, boot size, pixel block size, and feet baseline exactly. Do not make the stand taller, slimmer, or more elongated than a walk-cell character. Preserve lavender bob, ahoge, jellyfish ornament, heart clips and white-and-mint kit. Full body centred with small even margin; no shadow, floor, text, or 3D/blur.
```

### `tleod1818`

- 저장 파일: `char-tleod1818-stand.png`
- 세션: `S7-CH-tleod1818` 유지
- 첨부 레퍼런스: **새** `char-tleod1818-walk.png`, 현재 `char-tleod1818-turn.png`

```text
Using the attached NEW tleod1818 walk sheet as the scale reference and the attached turn sheet as identity reference, regenerate one transparent 1024x1024 front-facing idle stand sprite of the SAME character. Match the walk sheet's body height, head-to-body ratio, leg length, boot size, pixel block size, and feet baseline exactly. Do not make the stand taller, slimmer, or more elongated than a walk-cell character. Preserve black hair bun, leaf pin, white flower, choker and white-and-mint kit. Full body centred with small even margin; no shadow, floor, text, or 3D/blur.
```

### `tdnlamuron`

- 저장 파일: `char-tdnlamuron-stand.png`
- 세션: `S7-CH-tdnlamuron` 유지
- 첨부 레퍼런스: **새** `char-tdnlamuron-walk.png`, 현재 `char-tdnlamuron-turn.png`

```text
Using the attached NEW tdnlamuron walk sheet as the scale reference and the attached turn sheet as identity reference, regenerate one transparent 1024x1024 front-facing idle stand sprite of the SAME character. Match the walk sheet's body height, head-to-body ratio, leg length, boot size, pixel block size, and feet baseline exactly. Do not make the stand taller, slimmer, or more elongated than a walk-cell character. Preserve cat ears, black hair with orange/white streaks, choker and white-and-mint kit. Full body centred with small even margin; no shadow, floor, text, or 3D/blur.
```

### `lina0108`

- 저장 파일: `char-lina0108-stand.png`
- 세션: `S7-CH-lina0108` 유지
- 첨부 레퍼런스: **새** `char-lina0108-walk.png`, current `char-lina0108-turn.png`

```text
Using the attached NEW lina0108 walk sheet as the scale reference and the attached turn sheet as identity reference, regenerate one transparent 1024x1024 front-facing idle stand sprite of the SAME character. Match the walk sheet's body height, head-to-body ratio, leg length, boot size, pixel block size, and feet baseline exactly. Do not make the stand taller, slimmer, or more elongated than a walk-cell character. Preserve long red-pink hair, white streak, small horns and white-and-mint kit. Full body centred with small even margin; no shadow, floor, text, or 3D/blur.
```

### `woowakgood`

- 저장 파일: `char-woowakgood-stand.png`
- 세션: `S7-CH-woowakgood` 유지
- 첨부 레퍼런스: **새** `char-woowakgood-walk.png`, 현재 `char-woowakgood-turn.png`

```text
Using the attached NEW woowakgood walk sheet as the scale reference and the attached turn sheet as identity reference, regenerate one transparent 1024x1024 front-facing idle stand sprite of the SAME character. Match the walk sheet's body height, head-to-body ratio, leg length, shoe size, pixel block size, and feet baseline exactly. Do not make the stand taller, slimmer, or more elongated than a walk-cell character. Preserve golden-tan animal mascot head, headset, black suit, white shirt, mint tie/pocket square, adult proportions. Full body centred with small even margin; no shadow, floor, text, or 3D/blur.
```

### `elder`

- 저장 파일: `char-elder-stand.png`
- 세션: `S7-CH-elder` 유지
- 첨부 레퍼런스: **새** `char-elder-walk.png`, 현재 `char-elder-turn.png`

```text
Using the attached NEW elder walk sheet as the scale reference and the attached turn sheet as identity reference, regenerate one transparent 1024x1024 front-facing idle stand sprite of the SAME character. Match the walk sheet's body height, head-to-body ratio, leg length, boot size, pixel block size, and feet baseline exactly. Do not make the stand taller, slimmer, or more elongated than a walk-cell character. Preserve straw hat, white moustache, apron, watering can and warm elder proportions. Full body centred with small even margin; no shadow, floor, text, or 3D/blur.
```

### `shopkeeper`

- 저장 파일: `char-shopkeeper-stand.png`
- 세션: `S7-CH-shopkeeper` 유지
- 첨부 레퍼런스: **새** `char-shopkeeper-walk.png`, 현재 `char-shopkeeper-turn.png`

```text
Using the attached NEW shopkeeper walk sheet as the scale reference and the attached turn sheet as identity reference, regenerate one transparent 1024x1024 front-facing idle stand sprite of the SAME character. Match the walk sheet's body height, head-to-body ratio, leg length, boot size, pixel block size, and feet baseline exactly. Do not make the stand taller, slimmer, or more elongated than a walk-cell character. Preserve glasses, mint store apron, cardboard box and proportions. Full body centred with small even margin; no shadow, floor, text, or 3D/blur.
```

### `kid`

- 저장 파일: `char-kid-stand.png`
- 세션: `S7-CH-kid` 유지
- 첨부 레퍼런스: **새** `char-kid-walk.png`, 현재 `char-kid-turn.png`

```text
Using the attached NEW kid walk sheet as the scale reference and the attached turn sheet as identity reference, regenerate one transparent 1024x1024 front-facing idle stand sprite of the SAME character. Match the walk sheet's 75%-adult body height, head-to-body ratio, leg length, boot size, pixel block size, and feet baseline exactly. Do not make the stand taller, slimmer, or more elongated than a walk-cell character. Preserve oversized white-and-mint jersey, red scarf, bucket hat and mint pennant. Full body centred with small even margin; no shadow, floor, text, or 3D/blur.
```

### `referee`

- 저장 파일: `char-referee-stand.png`
- 세션: `S7-CH-referee` 유지
- 첨부 레퍼런스: **새** `char-referee-walk.png`, 현재 `char-referee-turn.png`

```text
Using the attached NEW referee walk sheet as the scale reference and the attached turn sheet as identity reference, regenerate one transparent 1024x1024 front-facing idle stand sprite of the SAME character. Match the walk sheet's body height, head-to-body ratio, leg length, boot size, pixel block size, and feet baseline exactly. Do not make the stand taller, slimmer, or more elongated than a walk-cell character. Preserve black/yellow referee kit, whistle, card-pocket details and proportions. Full body centred with small even margin; no shadow, floor, text, or 3D/blur.
```

### `weedking`

- 저장 파일: `char-weedking-stand.png`
- 세션: `S7-CH-weedking` 유지
- 첨부 레퍼런스: **새** `char-weedking-walk.png`, 현재 `char-weedking-turn.png`

```text
Using the attached NEW weedking walk sheet as the scale reference and the attached turn sheet as identity reference, regenerate one transparent 1024x1024 front-facing idle stand sprite of the SAME character. Match the walk sheet's taller body height, head-to-body ratio, leg length, boot size, pixel block size, and feet baseline exactly. Do not make the stand taller, slimmer, or more elongated than a walk-cell character. Preserve blade crown, coat, sunglasses, moustache, trimmer and villain proportions. Full body centred with small even margin; no shadow, floor, text, or 3D/blur.
```

### `weeder-grunt`

- 저장 파일: `char-weeder-grunt-stand.png`
- 세션: `S7-CH-weeder-grunt` 유지
- 첨부 레퍼런스: **새** `char-weeder-grunt-walk.png`, 현재 `char-weeder-grunt-turn.png`

```text
Using the attached NEW weeder-grunt walk sheet as the scale reference and the attached turn sheet as identity reference, regenerate one transparent 1024x1024 front-facing idle stand sprite of the SAME character. Match the walk sheet's body height, head-to-body ratio, leg length, boot size, pixel block size, and feet baseline exactly. Do not make the stand taller, slimmer, or more elongated than a walk-cell character. Preserve grey/rust coveralls, hard hat, visor, gloves and hand trimmer. Full body centred with small even margin; no shadow, floor, text, or 3D/blur.
```

---

## 3. 선택적 게임 외곽 프레임 — 독립 요청

- 저장 파일: `ui-game-outer-frame.png`
- 저장 위치: `tmp/world-src/ui/ui-game-outer-frame.png`
- 새 대화: 예 (`S7-UI-outer-frame`), 다른 UI 세션과 섞지 않음
- 첨부 레퍼런스: 현재 월드 UI 프레임 예시 1장만 선택적으로 첨부 가능 (`src/web/assets/world/ui/panel-frame.webp`). 캐릭터·배경 레퍼런스는 첨부하지 않는다.

```text
Create a single transparent PNG overlay for a 16:9 pixel-art RPG game viewport, exactly 1920x1080. The entire central play aperture must be completely transparent; draw only a decorative frame around the outermost edges. Style: high-detail modern 32-bit pixel art, crisp dark teal outlines (#16302e), deep teal panels (#0b1614), mint trim (#00e9ae), leaf-shaped ornaments, and restrained warm-gold corner jewels (#ffd54a). Keep it symmetric and thin enough that it never covers HUD text or controls. No characters, no scenery, no text, no letters, no logos, no watermark, no opaque background, and no shadow inside the transparent play area. This must be an overlay only, not a picture frame with an interior scene.
```

## 수령 후 전달 방법

1. 파일 이름을 이 문서의 `저장 파일`과 **완전히 동일하게** 지정한다.
2. walk/stand는 `tmp/world-src/characters/`, 외곽 프레임은 `tmp/world-src/ui/`에 둔다.
3. 어떤 파일이 어느 기존 파일을 대체하는지와, 투명 PNG인지/마젠타 배경인지 알려 준다.
4. 개발 세션에서 변환 스크립트·아틀라스 QA·에셋 크기 테스트를 실행한 뒤 연결한다.
