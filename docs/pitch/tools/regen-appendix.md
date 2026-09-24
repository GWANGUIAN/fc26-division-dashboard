
---

## 부록 A. A1 변환 QA 결과 — 재생성(수정 요청) 대상 7시트 (✔ 2026-09-25 전부 재생성·재변환 완료)

`pnpm convert:pitch-art -- --all` 결과, 아래 7시트는 **프레임끼리 붙어 있어서**(연결요소 gap 2px 에서도 한 덩어리로 인식) 변환 후 atlas 에 빈 셀이 생기거나, 한 프레임이 너무 커서 그 행 전체가 59~70%로 축소됐다. 나머지 시트는 문제 없음. 각 시트마다 **독립형 수정 프롬프트**가 있다(기존 이미지를 레퍼런스로 붙여 고쳐 달라고 요청). 원본 프롬프트는 해당 #번호 스텝에 그대로 있다.

> 이 부록은 `docs/pitch/tools/regen-appendix.md` 를 생성기가 09 맨 아래에 붙인 것이다. 09 를 직접 고치지 말고 그 파일을 고친 뒤 `node docs/pitch/tools/build-image-runbook.mjs` 를 실행한다.

### 진행 방법 (7시트 공통)

1. 프롬프트와 함께 **① 고칠 시트(기존 이미지) ② 같은 캐릭터의 승인본 stand** 를 첨부한다(같은 캐릭터 스레드가 남아 있으면 이어서).
2. 결과가 마음에 들면 기존 파일을 `tmp/pitch-src/_old/` 로 옮겨 백업하고 새 이미지를 **같은 파일명**으로 저장.
3. `--only` 변환으로 해당 시트만 atlas 에 끼워 넣는다(다른 행은 그대로).
4. QA 리포트에서 그 시트의 `empty`·`grid`·`scale` 경고가 사라졌는지 확인하고, 이 문서 진행 표의 `🔁` 를 `[x]` 로 바꾼다.
5. 수정 요청으로 잘 안 고쳐지면 해당 스텝(#번호)의 원본 프롬프트 맨 끝에 다음 문장을 덧붙여 **처음부터 재생성**한다: *SPACING (critical): draw every figure noticeably smaller than you think is needed. Leave a wide empty transparent gutter between every two neighbouring cells, at least 40 px both horizontally and vertically, so that no frame ever touches, overlaps or shares a pixel with another one. The widest pose in a row must still be at most 80% of the cell width. Long hair, ponytails, buns, horns and ears count as part of the figure and must stay inside the cell too.*

행/프레임 번호는 위→아래(행 1~), 왼→오(프레임 1~) 기준. skill 시트 행 순서 = 스텝오버 / 룰렛 / 레인보우 / 엘라스티코, shoot 시트 행 순서 = 정면 / 측면 / 후면.

### #062 · 하치 — ⑤ skill-side (재생성)

- **저장 이름**: `tmp/pitch-src/characters/char-hachi97-skill-side.png` (1536×1024, 기존 파일은 `tmp/pitch-src/_old/` 로 백업 후 같은 이름으로 저장)
- **QA 결과**: 행3(레인보우) 프레임 1이 이웃과 붙어 사라짐 · 행4(엘라스티코)에 셀보다 큰 프레임(행 70% 축소)
- **레퍼런스 첨부**:
  - **필수** 고칠 시트 자체: `tmp/pitch-src/characters/char-hachi97-skill-side.png` (#062)
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-hachi97-stand.png` (#058)
- **변환**: `pnpm convert:pitch-art -- characters hachi97 --only skill-side`

**프롬프트**

```text
Keep everything from the attached sprite sheet exactly as it is: the same character design, palette, outline, pixel size, pose in every cell, grid layout (a strict grid of 4 columns x 4 rows), row order and frame order, on the same 1536x1024 canvas with a transparent background (or a flat #FF00FF background if transparency is impossible; never magenta on the subject).
The sheet shows the same character performing four football skill moves in right-side view (profile, facing right). Row order: Row 1 = STEPOVER (one leg circles over the ball spot while the other stays planted); Row 2 = ROULETTE (Marseille turn, the whole body spins around the planted foot); Row 3 = RAINBOW FLICK (a small hop, the heels flick the ball up and over the head); Row 4 = ELASTICO (flip-flap, a wide sideways fake). Each move keeps its own silhouette and its four frames in order:
- Row 1 = STEPOVER: (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
- Row 2 = ROULETTE: (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
- Row 3 = RAINBOW FLICK: (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
- Row 4 = ELASTICO: (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Keep the character-defining features in every frame: the small white antler-like horn ornaments and the short black bob with the white streak.
Only fix these problems, and redraw ONLY the frames named here, leaving every other frame unchanged:
Row 3 (RAINBOW FLICK), frame 1: this figure is glued to the frame next to it; redraw it (both feet close together squeezing the ball spot, knees only slightly bent, head up) with clear empty space on all sides, the horns fully inside the cell.
Row 4 (ELASTICO): one frame is much wider than the others and reaches the cell edge; redraw the widest frame smaller and more compact (still a wide fake step, but inside 80% of the cell width).
Spacing rule (very important): in the whole sheet, every figure must be separated from the figures next to it by clear empty transparent space, at least 40 px between any two neighbouring frames horizontally and vertically, so that no frame touches or overlaps another one, not even with a boot, a fist, a hair tip or a motion pose. Each figure stays fully inside its own cell with at least 12% empty space above the head and below the feet and at least 8% at both sides. If a pose is too wide or too tall, make the figure slightly smaller in that frame rather than letting it reach the cell edge; every frame must still be the same figure at the same scale as the neighbouring frames (no bigger than the standing figure of the attached stand image). The widest pose in a row must be at most 80% of the cell width.
Do NOT draw a football, text, numbers, logos, cell borders or grid lines, and add no glow, halo, aura or coloured blur around the figures.
```

- [x] #062 수정본 저장·재변환 완료

### #078 · 쥬멩이 — ⑤ skill-side (재생성)

- **저장 이름**: `tmp/pitch-src/characters/char-ju010228-skill-side.png` (1536×1024, 기존 파일은 `tmp/pitch-src/_old/` 로 백업 후 같은 이름으로 저장)
- **QA 결과**: 행2(룰렛) 프레임 1·2가 서로 붙어 둘 다 사라짐 · 행3(레인보우)에 셀보다 큰 프레임(행 61% 축소)
- **레퍼런스 첨부**:
  - **필수** 고칠 시트 자체: `tmp/pitch-src/characters/char-ju010228-skill-side.png` (#078)
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-ju010228-stand.png` (#074)
- **변환**: `pnpm convert:pitch-art -- characters ju010228 --only skill-side`

**프롬프트**

```text
Keep everything from the attached sprite sheet exactly as it is: the same character design, palette, outline, pixel size, pose in every cell, grid layout (a strict grid of 4 columns x 4 rows), row order and frame order, on the same 1536x1024 canvas with a transparent background (or a flat #FF00FF background if transparency is impossible; never magenta on the subject).
The sheet shows the same character performing four football skill moves in right-side view (profile, facing right). Row order: Row 1 = STEPOVER (one leg circles over the ball spot while the other stays planted); Row 2 = ROULETTE (Marseille turn, the whole body spins around the planted foot); Row 3 = RAINBOW FLICK (a small hop, the heels flick the ball up and over the head); Row 4 = ELASTICO (flip-flap, a wide sideways fake). Each move keeps its own silhouette and its four frames in order:
- Row 1 = STEPOVER: (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
- Row 2 = ROULETTE: (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
- Row 3 = RAINBOW FLICK: (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
- Row 4 = ELASTICO: (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Keep the character-defining features in every frame: the long green hair tied up high with the white streak and the white ribbon.
Only fix these problems, and redraw ONLY the frames named here, leaving every other frame unchanged:
Row 2 (ROULETTE), frames 1 and 2: these two figures overlap each other; redraw frame 1 (right boot sole on the ball spot, arms out) and frame 2 (body pivoting on the left foot, chest turning away) so that they are clearly separated, each centred in its own cell.
Row 3 (RAINBOW FLICK): one frame (the airborne pose) is much taller or wider than the others; keep the airborne frame at only about 10% of the cell height above the ground and keep the whole figure, including the hair, inside the cell with margin.
Spacing rule (very important): in the whole sheet, every figure must be separated from the figures next to it by clear empty transparent space, at least 40 px between any two neighbouring frames horizontally and vertically, so that no frame touches or overlaps another one, not even with a boot, a fist, a hair tip or a motion pose. Each figure stays fully inside its own cell with at least 12% empty space above the head and below the feet and at least 8% at both sides. If a pose is too wide or too tall, make the figure slightly smaller in that frame rather than letting it reach the cell edge; every frame must still be the same figure at the same scale as the neighbouring frames (no bigger than the standing figure of the attached stand image). The widest pose in a row must be at most 80% of the cell width.
Do NOT draw a football, text, numbers, logos, cell borders or grid lines, and add no glow, halo, aura or coloured blur around the figures.
```

- [x] #078 수정본 저장·재변환 완료

### #085 · 해파린 — ④ shoot (재생성)

- **저장 이름**: `tmp/pitch-src/characters/char-haepalin-shoot.png` (1536×1024, 기존 파일은 `tmp/pitch-src/_old/` 로 백업 후 같은 이름으로 저장)
- **QA 결과**: 행1(정면) 프레임 2가 셀 밖으로 나감(행 61% 축소) · 행2(측면) 프레임 2가 이웃과 붙어 사라짐
- **레퍼런스 첨부**:
  - **필수** 고칠 시트 자체: `tmp/pitch-src/characters/char-haepalin-shoot.png` (#085)
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-haepalin-stand.png` (#082)
- **변환**: `pnpm convert:pitch-art -- characters haepalin --only shoot`

**프롬프트**

```text
Keep everything from the attached sprite sheet exactly as it is: the same character design, palette, outline, pixel size, pose in every cell, grid layout (a strict grid of 4 columns x 3 rows), row order and frame order, on the same 1536x1024 canvas with a transparent background (or a flat #FF00FF background if transparency is impossible; never magenta on the subject).
The sheet shows the same character's SHOOTING animation with four frames per row (1 backswing, 2 planted standing foot, 3 impact with the kicking leg fully extended, 4 follow-through). Row order: Row 1 = kicking toward the camera (front view); Row 2 = kicking toward the right (side view); Row 3 = kicking away from the camera (back view). The upper body tilts at most 25 degrees and the head stays above the shoulders.
Keep the character-defining features in every frame: the short lavender-periwinkle bob with the ahoge and the jellyfish hair ornament.
Only fix these problems, and redraw ONLY the frames named here, leaving every other frame unchanged:
Row 1 (front view kick), frame 2: the figure extends beyond its cell; redraw it smaller, with the kicking leg and both arms fully inside the cell.
Row 2 (side view kick), frame 2: this figure is glued to a neighbouring frame; redraw it (standing leg planted, kicking leg cocked back) with clear empty space on all sides.
Spacing rule (very important): in the whole sheet, every figure must be separated from the figures next to it by clear empty transparent space, at least 40 px between any two neighbouring frames horizontally and vertically, so that no frame touches or overlaps another one, not even with a boot, a fist, a hair tip or a motion pose. Each figure stays fully inside its own cell with at least 12% empty space above the head and below the feet and at least 8% at both sides. If a pose is too wide or too tall, make the figure slightly smaller in that frame rather than letting it reach the cell edge; every frame must still be the same figure at the same scale as the neighbouring frames (no bigger than the standing figure of the attached stand image). The widest pose in a row must be at most 80% of the cell width.
Do NOT draw a football, text, numbers, logos, cell borders or grid lines, and add no glow, halo, aura or coloured blur around the figures.
```

- [x] #085 수정본 저장·재변환 완료

### #093 · 빙밍 — ④ shoot (재생성)

- **저장 이름**: `tmp/pitch-src/characters/char-tleod1818-shoot.png` (1536×1024, 기존 파일은 `tmp/pitch-src/_old/` 로 백업 후 같은 이름으로 저장)
- **QA 결과**: 행1(정면) 프레임 2가 이웃과 붙어 사라짐 · 행2(측면)에 셀보다 큰 프레임(행 61% 축소)
- **레퍼런스 첨부**:
  - **필수** 고칠 시트 자체: `tmp/pitch-src/characters/char-tleod1818-shoot.png` (#093)
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-tleod1818-stand.png` (#090)
- **변환**: `pnpm convert:pitch-art -- characters tleod1818 --only shoot`

**프롬프트**

```text
Keep everything from the attached sprite sheet exactly as it is: the same character design, palette, outline, pixel size, pose in every cell, grid layout (a strict grid of 4 columns x 3 rows), row order and frame order, on the same 1536x1024 canvas with a transparent background (or a flat #FF00FF background if transparency is impossible; never magenta on the subject).
The sheet shows the same character's SHOOTING animation with four frames per row (1 backswing, 2 planted standing foot, 3 impact with the kicking leg fully extended, 4 follow-through). Row order: Row 1 = kicking toward the camera (front view); Row 2 = kicking toward the right (side view); Row 3 = kicking away from the camera (back view). The upper body tilts at most 25 degrees and the head stays above the shoulders.
Keep the character-defining features in every frame: the black hair bun with the green leaf hairpin and the small white flower.
Only fix these problems, and redraw ONLY the frames named here, leaving every other frame unchanged:
Row 1 (front view kick), frame 2: this figure is glued to a neighbouring frame; redraw it (planted standing foot, arms out for balance) centred in its own cell with clear empty space on all sides.
Row 2 (side view kick): one frame is much wider than the others; redraw the widest frame more compactly so that the kicking leg and the hair bun stay inside 80% of the cell width.
Spacing rule (very important): in the whole sheet, every figure must be separated from the figures next to it by clear empty transparent space, at least 40 px between any two neighbouring frames horizontally and vertically, so that no frame touches or overlaps another one, not even with a boot, a fist, a hair tip or a motion pose. Each figure stays fully inside its own cell with at least 12% empty space above the head and below the feet and at least 8% at both sides. If a pose is too wide or too tall, make the figure slightly smaller in that frame rather than letting it reach the cell edge; every frame must still be the same figure at the same scale as the neighbouring frames (no bigger than the standing figure of the attached stand image). The widest pose in a row must be at most 80% of the cell width.
Do NOT draw a football, text, numbers, logos, cell borders or grid lines, and add no glow, halo, aura or coloured blur around the figures.
```

- [x] #093 수정본 저장·재변환 완료

### #095 · 빙밍 — ⑥ skill-up (재생성)

- **저장 이름**: `tmp/pitch-src/characters/char-tleod1818-skill-up.png` (1536×1024, 기존 파일은 `tmp/pitch-src/_old/` 로 백업 후 같은 이름으로 저장)
- **QA 결과**: 행3(레인보우) 프레임 1·2가 붙어 둘 다 사라짐 · 행4(엘라스티코)에 셀보다 큰 프레임(행 67% 축소)
- **레퍼런스 첨부**:
  - **필수** 고칠 시트 자체: `tmp/pitch-src/characters/char-tleod1818-skill-up.png` (#095)
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-tleod1818-stand.png` (#090)
- **변환**: `pnpm convert:pitch-art -- characters tleod1818 --only skill-up`

**프롬프트**

```text
Keep everything from the attached sprite sheet exactly as it is: the same character design, palette, outline, pixel size, pose in every cell, grid layout (a strict grid of 4 columns x 4 rows), row order and frame order, on the same 1536x1024 canvas with a transparent background (or a flat #FF00FF background if transparency is impossible; never magenta on the subject).
The sheet shows the same character performing four football skill moves in back view (facing away from the camera toward the goal). Row order: Row 1 = STEPOVER (one leg circles over the ball spot while the other stays planted); Row 2 = ROULETTE (Marseille turn, the whole body spins around the planted foot); Row 3 = RAINBOW FLICK (a small hop, the heels flick the ball up and over the head); Row 4 = ELASTICO (flip-flap, a wide sideways fake). Each move keeps its own silhouette and its four frames in order:
- Row 1 = STEPOVER: (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
- Row 2 = ROULETTE: (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
- Row 3 = RAINBOW FLICK: (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
- Row 4 = ELASTICO: (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Keep the character-defining features in every frame: the black hair bun with the green leaf hairpin and the small white flower.
Only fix these problems, and redraw ONLY the frames named here, leaving every other frame unchanged:
Row 3 (RAINBOW FLICK, back view), frames 1 and 2: these two figures are glued to each other and to the frames next to them; redraw both (frame 1: both feet close together, knees slightly bent; frame 2: both heels kicking up and back, just leaving the ground) with clear empty space around each.
Row 4 (ELASTICO, back view): one frame is much wider than the others; redraw the widest frame more compactly, inside 80% of the cell width.
Spacing rule (very important): in the whole sheet, every figure must be separated from the figures next to it by clear empty transparent space, at least 40 px between any two neighbouring frames horizontally and vertically, so that no frame touches or overlaps another one, not even with a boot, a fist, a hair tip or a motion pose. Each figure stays fully inside its own cell with at least 12% empty space above the head and below the feet and at least 8% at both sides. If a pose is too wide or too tall, make the figure slightly smaller in that frame rather than letting it reach the cell edge; every frame must still be the same figure at the same scale as the neighbouring frames (no bigger than the standing figure of the attached stand image). The widest pose in a row must be at most 80% of the cell width.
Do NOT draw a football, text, numbers, logos, cell borders or grid lines, and add no glow, halo, aura or coloured blur around the figures.
```

- [-] #095 수정본 저장·재변환 완료

### #110 · 리냐 — ⑤ skill-side (재생성)

- **저장 이름**: `tmp/pitch-src/characters/char-lina0108-skill-side.png` (1536×1024, 기존 파일은 `tmp/pitch-src/_old/` 로 백업 후 같은 이름으로 저장)
- **QA 결과**: 행3(레인보우) 프레임 2가 붙어 사라짐 · 행2(룰렛) 프레임 2가 셀 밖으로 나감(행 67% 축소)
- **레퍼런스 첨부**:
  - **필수** 고칠 시트 자체: `tmp/pitch-src/characters/char-lina0108-skill-side.png` (#110)
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-lina0108-stand.png` (#106)
- **변환**: `pnpm convert:pitch-art -- characters lina0108 --only skill-side`

**프롬프트**

```text
Keep everything from the attached sprite sheet exactly as it is: the same character design, palette, outline, pixel size, pose in every cell, grid layout (a strict grid of 4 columns x 4 rows), row order and frame order, on the same 1536x1024 canvas with a transparent background (or a flat #FF00FF background if transparency is impossible; never magenta on the subject).
The sheet shows the same character performing four football skill moves in right-side view (profile, facing right). Row order: Row 1 = STEPOVER (one leg circles over the ball spot while the other stays planted); Row 2 = ROULETTE (Marseille turn, the whole body spins around the planted foot); Row 3 = RAINBOW FLICK (a small hop, the heels flick the ball up and over the head); Row 4 = ELASTICO (flip-flap, a wide sideways fake). Each move keeps its own silhouette and its four frames in order:
- Row 1 = STEPOVER: (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
- Row 2 = ROULETTE: (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
- Row 3 = RAINBOW FLICK: (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
- Row 4 = ELASTICO: (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Keep the character-defining features in every frame: the long messy red-pink (coral) hair with the white streak and the small pink-and-white horns.
Only fix these problems, and redraw ONLY the frames named here, leaving every other frame unchanged:
Row 3 (RAINBOW FLICK), frame 2: this figure is glued to a neighbouring frame; redraw it (both heels kicking up and back, just leaving the ground) with clear empty space around it. The long voluminous hair must stay inside the cell.
Row 2 (ROULETTE), frame 2: the figure reaches beyond its cell; redraw it smaller and more compact, the hair and arms fully inside the cell.
Spacing rule (very important): in the whole sheet, every figure must be separated from the figures next to it by clear empty transparent space, at least 40 px between any two neighbouring frames horizontally and vertically, so that no frame touches or overlaps another one, not even with a boot, a fist, a hair tip or a motion pose. Each figure stays fully inside its own cell with at least 12% empty space above the head and below the feet and at least 8% at both sides. If a pose is too wide or too tall, make the figure slightly smaller in that frame rather than letting it reach the cell edge; every frame must still be the same figure at the same scale as the neighbouring frames (no bigger than the standing figure of the attached stand image). The widest pose in a row must be at most 80% of the cell width.
Do NOT draw a football, text, numbers, logos, cell borders or grid lines, and add no glow, halo, aura or coloured blur around the figures.
```

- [x] #110 수정본 저장·재변환 완료

### #111 · 리냐 — ⑥ skill-up (재생성)

- **저장 이름**: `tmp/pitch-src/characters/char-lina0108-skill-up.png` (1536×1024, 기존 파일은 `tmp/pitch-src/_old/` 로 백업 후 같은 이름으로 저장)
- **QA 결과**: 행1(스텝오버) 프레임 2 · 행3(레인보우) 프레임 1이 붙어 사라짐 · 행2(룰렛) 59%·행4(엘라스티코) 63% 축소
- **레퍼런스 첨부**:
  - **필수** 고칠 시트 자체: `tmp/pitch-src/characters/char-lina0108-skill-up.png` (#111)
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-lina0108-stand.png` (#106)
- **변환**: `pnpm convert:pitch-art -- characters lina0108 --only skill-up`

**프롬프트**

```text
Keep everything from the attached sprite sheet exactly as it is: the same character design, palette, outline, pixel size, pose in every cell, grid layout (a strict grid of 4 columns x 4 rows), row order and frame order, on the same 1536x1024 canvas with a transparent background (or a flat #FF00FF background if transparency is impossible; never magenta on the subject).
The sheet shows the same character performing four football skill moves in back view (facing away from the camera toward the goal). Row order: Row 1 = STEPOVER (one leg circles over the ball spot while the other stays planted); Row 2 = ROULETTE (Marseille turn, the whole body spins around the planted foot); Row 3 = RAINBOW FLICK (a small hop, the heels flick the ball up and over the head); Row 4 = ELASTICO (flip-flap, a wide sideways fake). Each move keeps its own silhouette and its four frames in order:
- Row 1 = STEPOVER: (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
- Row 2 = ROULETTE: (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
- Row 3 = RAINBOW FLICK: (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
- Row 4 = ELASTICO: (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Keep the character-defining features in every frame: the long messy red-pink (coral) hair with the white streak and the small pink-and-white horns.
Only fix these problems, and redraw ONLY the frames named here, leaving every other frame unchanged:
Row 1 (STEPOVER, back view), frame 2: this figure is glued to a neighbouring frame; redraw it (right leg swung in a wide arc over the ball spot) with clear empty space around it.
Row 3 (RAINBOW FLICK, back view), frame 1: this figure is glued to a neighbouring frame; redraw it (both feet close together, knees slightly bent) with clear empty space around it.
Rows 2 (ROULETTE) and 4 (ELASTICO): at least one frame per row is much larger than the rest and touches the cell edge; redraw the largest frame of each of these two rows smaller and more compact so that the hair and arms stay inside 80% of the cell width. Keep the hair volume tied up so it does not spread across neighbouring cells.
Spacing rule (very important): in the whole sheet, every figure must be separated from the figures next to it by clear empty transparent space, at least 40 px between any two neighbouring frames horizontally and vertically, so that no frame touches or overlaps another one, not even with a boot, a fist, a hair tip or a motion pose. Each figure stays fully inside its own cell with at least 12% empty space above the head and below the feet and at least 8% at both sides. If a pose is too wide or too tall, make the figure slightly smaller in that frame rather than letting it reach the cell edge; every frame must still be the same figure at the same scale as the neighbouring frames (no bigger than the standing figure of the attached stand image). The widest pose in a row must be at most 80% of the cell width.
Do NOT draw a football, text, numbers, logos, cell borders or grid lines, and add no glow, halo, aura or coloured blur around the figures.
```

- [x] #111 수정본 저장·재변환 완료
