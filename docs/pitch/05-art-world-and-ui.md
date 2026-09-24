# 05. 환경·UI 아트 — 경기장, 골대, 락커룸, 효과, UI 시트 규격

> **생성 실행용 문서**: 프롬프트는 [09](09-image-generation-runbook.md)에 시트별로 풀어 들어 있다. **이 문서의 시트 블록(`- \`KEY\`: value`)이 러닝북 생성기의 입력**이다 — 블록을 고치고 `node docs/pitch/tools/build-image-runbook.mjs`를 실행하면 09가 갱신된다. 스타일 바이블·팔레트는 [04 §0~§1](04-art-characters.md), 화면 좌표는 [03](03-screens-and-ui.md).
> 이미지 안에 **글자·숫자·로고를 넣지 않는다**. 버튼·배너·리본은 빈 판(블랭크)으로 생성하고 텍스트는 캔버스가 Galmuri11로 그린다.

## 0. 규칙

- 논리 해상도 **960×540**. 시트 원본 → 변환 스크립트 → `src/web/assets/pitch/<카테고리>/*.webp`. 변환 스크립트 옵션·QA 기준은 world 것을 따른다(크로마키 `#FF00FF`, 연결요소 셀 배정).
- **배경 규칙**: 스프라이트/UI 시트는 투명 PNG, 안 되면 단색 `#FF00FF`. 피사체에 마젠타·핑크 금지(코랄 `#ff4d6d`만). 풀-씬 배경(`kind=scene`)은 불투명.
- 시트는 **선/테두리 없는 엄격한 그리드**, 셀당 여백 ≥10%, 셀당 오브젝트 1개. 그리드 열×행과 순서만 지키면 캔버스 크기 드리프트는 스크립트가 흡수.
- 스레드: `T-PCH-ENV`(환경) → `T-PCH-FX`(이펙트) → `T-PCH-UI`(UI). 각 스레드의 첫 시트가 **스타일 앵커**이고 이후 시트는 직전 승인 시트를 레퍼런스로 붙인다.

## 1. 시트 블록 문법 (생성기 입력)

| 키 | 의미 |
| --- | --- |
| `FILE` | 저장 이름(`tmp/pitch-src/<CAT>/<FILE>`) |
| `CAT` | 저장 카테고리 폴더(`env`/`fx`/`ui`/`keyart`) |
| `KIND` | `scene`(불투명 풀씬) / `grid`(스프라이트 그리드) / `keyart`(불투명 키아트) |
| `CANVAS` | 요청 캔버스 (`1536x1024` / `1024x1024`) |
| `GRID` | `열x행` 또는 `none` |
| `THREAD` | 스레드 이름 |
| `PRIO` | P0(A1 필요) / P1(A2·A3 필요) / P2(폴리시) |
| `REFS` | 이전 시트 id 목록(쉼표) — 같은 스레드의 직전 승인본 등 |
| `DESC` | 영어 설명(프롬프트 본문) |
| `LIST` | `;`로 구분한 셀 내용(행 우선). 그리드 시트만 |
| `FINAL` | 최종 사용 크기/변환 메모 |

## 2. 환경 (T-PCH-ENV)

### E1. `pitch-bg` — 피치 배경 (스타일 앵커)
- `FILE`: `env-pitch-bg.png`
- `CAT`: `env`
- `KIND`: `scene`
- `CANVAS`: `1536x1024`
- `GRID`: `none`
- `THREAD`: `T-PCH-ENV`
- `PRIO`: `P0`
- `REFS`: ``
- `DESC`: The attacking half of a football pitch at night under floodlights, seen from a high 3/4 broadcast camera angle (about 35 degrees) looking toward the goal at the top centre of the image. Show alternating bright and mid green mowing stripes, white pitch lines, the penalty box, the six-yard box, the penalty spot and the top of the penalty arc, corner arcs. IMPORTANT: leave the goal mouth area completely EMPTY (no goal posts, no crossbar, no net, no players, no ball): the goal is a separate sprite. Along the top edge and both sides draw tiered stands packed with a colourful crowd of tiny pixel spectators (blocky, no faces, no text) and a row of LED-style advertising boards made of abstract colour blocks and stripes (no letters, no logos). Cool cyan-white floodlight glow from the upper left, violet shadows, a subtle vignette. Keep the bottom-left corner of the pitch clear along the touchline (a tunnel sprite will be placed there). Keep all important content inside the central 1536x864 band (top and bottom 80px are safe overflow).
- `LIST`: ``
- `FINAL`: `중앙 16:9 밴드를 크롭해 960×540으로 축소. 잔디 줄무늬 폭은 픽셀 정수배 유지(convert 옵션 --scene)`

### E2. `goal` — 골대
- `FILE`: `env-goal.png`
- `CAT`: `env`
- `KIND`: `grid`
- `CANVAS`: `1536x1024`
- `GRID`: `3x2`
- `THREAD`: `T-PCH-ENV`
- `PRIO`: `P0`
- `REFS`: `pitch-bg`
- `DESC`: The football goal sprites for the same pitch, drawn from the same high 3/4 camera angle and the same pixel size as the attached pitch background. White steel posts and crossbar with a subtle cyan rim light, a fine net drawn as a pixel mesh.
- `LIST`: goal BACK layer: two posts, crossbar and the back and side net in shadow, seen from the front-above, wide and shallow (about 3:1); goal FRONT net layer: only the front-facing net mesh with a transparent hole area where the ball can pass (this is drawn over the ball); net ripple frame 1 (front net layer, slight bulge at the centre); net ripple frame 2 (bulge larger, mesh stretched); net ripple frame 3 (bulge released, mesh rebounding); net ripple frame 4 (almost back to rest, tiny wobble)
- `FINAL`: `골 프레임 폭 약 300px(논리 좌표), 뒷/앞 레이어와 리플 4프레임으로 분리`

### E3. `ball` — 볼
- `FILE`: `env-ball.png`
- `CAT`: `env`
- `KIND`: `grid`
- `CANVAS`: `1536x1024`
- `GRID`: `4x3`
- `THREAD`: `T-PCH-ENV`
- `PRIO`: `P0`
- `REFS`: `pitch-bg`
- `DESC`: A football (soccer ball) for a 16-bit arcade football game, classic black-and-white pentagon pattern with cyan rim light, drawn in a rotation cycle, with helper sprites.
- `LIST`: ball rotation frame 1 (rotated 0 degrees); ball rotation frame 2 (45 degrees); ball rotation frame 3 (90 degrees); ball rotation frame 4 (135 degrees); ball rotation frame 5 (180 degrees); ball rotation frame 6 (225 degrees); ball rotation frame 7 (270 degrees); ball rotation frame 8 (315 degrees); flat oval ground shadow (soft dark violet, no ball); motion streak trail (a tapering white-cyan streak, horizontal, no ball); glowing ring flash (gold ring for a perfect shot, no ball); small impact sparkle (white four-point star)
- `FINAL`: `볼 셀 16×16 논리 px 기준으로 축소, 회전 8프레임`

### E4. `props` — 필드 소품 (P2)
- `FILE`: `env-props.png`
- `CAT`: `env`
- `KIND`: `grid`
- `CANVAS`: `1536x1024`
- `GRID`: `4x3`
- `THREAD`: `T-PCH-ENV`
- `PRIO`: `P2`
- `REFS`: `ball`
- `DESC`: Small football pitch props in the same arcade pixel style and camera angle, one prop per cell, no shadow on the ground.
- `LIST`: orange training cone; yellow training cone; corner flag on a pole (still); corner flag on a pole (waving, different frame); advertising board A (abstract cyan and white block pattern, no letters); advertising board B (abstract gold and navy stripes, no letters); advertising board C (abstract mint and coral diamonds, no letters); water bottle; pile of training bibs; ball bag full of footballs; small training hurdle; agility ladder segment
- `FINAL`: `광고판은 피치 배경 위 오버레이로도 사용`

### E5. `locker-gate` — 락커룸 게이트 (피치 좌하단)
- `FILE`: `env-locker-gate.png`
- `CAT`: `env`
- `KIND`: `grid`
- `CANVAS`: `1536x1024`
- `GRID`: `3x2`
- `THREAD`: `T-PCH-ENV`
- `PRIO`: `P1`
- `REFS`: `pitch-bg`
- `DESC`: The players' tunnel entrance to the locker room at the corner of the pitch, seen from the same high 3/4 broadcast angle, a concrete and steel tunnel mouth cut into the stand wall with a heavy steel door, hazard-stripe trim in gold and navy, a blank label plate above the door (no letters), floodlit from above.
- `LIST`: tunnel gate with the steel door CLOSED; tunnel gate with the steel door OPEN and warm light spilling out; tunnel gate CLOSED with a soft cyan glow outline (interaction highlight); a bobbing down-arrow marker in gold (frame 1, arrow only); the same gold down-arrow marker (frame 2, 6 pixels higher); the blank label plate on its own (metal, empty, no letters)
- `FINAL`: `게이트 최종 약 128×128 논리 px`

### E6. `locker-bg` — 락커룸 배경
- `FILE`: `env-locker-bg.png`
- `CAT`: `env`
- `KIND`: `scene`
- `CANVAS`: `1536x1024`
- `GRID`: `none`
- `THREAD`: `T-PCH-ENV`
- `PRIO`: `P1`
- `REFS`: `locker-gate`
- `DESC`: The interior of a football club locker room seen from a high 3/4 angle (about 35 degrees) in the same 16-bit arcade pixel style: a wide room with polished blue-grey floor tiles, a back wall lined with navy metal lockers with mint stripes, benches along the side walls, cool fluorescent cyan-white ceiling light and violet shadows. Leave a clear walkable open floor in the middle, an EMPTY spot at the centre-left where a stat terminal sprite will be placed, and an EMPTY doorway at the bottom centre where an exit door sprite will be placed. No characters, no text, no numbers on the lockers.
- `LIST`: ``
- `FINAL`: `중앙 16:9 밴드 크롭 → 960×540`

### E7. `locker-props` — 락커룸 소품
- `FILE`: `env-locker-props.png`
- `CAT`: `env`
- `KIND`: `grid`
- `CANVAS`: `1536x1024`
- `GRID`: `4x3`
- `THREAD`: `T-PCH-ENV`
- `PRIO`: `P1`
- `REFS`: `locker-bg`
- `DESC`: Locker room props for the attached locker room, same pixel style and camera angle, one object per cell, no ground shadow, no text.
- `LIST`: stat analysis terminal, a standing scouting kiosk with a dark screen (OFF); the same terminal with the screen glowing cyan and a hexagon-shaped radar icon (IDLE); the same terminal with the screen bright, gold-lit and a small spark (ACTIVE); exit door closed (steel door with a small window); exit door open with light spilling in; navy locker unit with mint stripe, door closed; navy locker unit with the door open and gear inside; wooden team bench; tactics whiteboard on wheels with abstract pitch diagram (no letters); water cooler; kit bag with a football; boot rack with white boots
- `FINAL`: `스탯 분석기 3상태가 상호작용 대상`

### E8. `loading-bg` — 로딩 키아트
- `FILE`: `keyart-loading-bg.png`
- `CAT`: `keyart`
- `KIND`: `keyart`
- `CANVAS`: `1536x1024`
- `GRID`: `none`
- `THREAD`: `T-PCH-ENV`
- `PRIO`: `P0`
- `REFS`: `pitch-bg`
- `DESC`: A dramatic loading-screen key art in the same 16-bit arcade pixel style: looking down a dark player tunnel toward a blazing bright football stadium at night, with silhouetted stands and floodlight stars, a single football resting on the grass in the light at the end of the tunnel, cyan and gold light rays, violet shadows. No people, no text. Leave the lower third calmer and darker so a progress bar can be placed there.
- `LIST`: ``
- `FINAL`: `960×540`

### E9. `crowd` — 관중 애니메이션 (P2)
- `FILE`: `env-crowd.png`
- `CAT`: `env`
- `KIND`: `grid`
- `CANVAS`: `1536x1024`
- `GRID`: `4x3`
- `THREAD`: `T-PCH-ENV`
- `PRIO`: `P2`
- `REFS`: `pitch-bg`
- `DESC`: Animated stadium crowd bands matching the crowd in the attached pitch background: each cell is one frame of a wide horizontal band of tiny blocky pixel spectators (no faces, no text, seamless left and right edges, about 3:1 wide), lit from the upper left.
- `LIST`: idle crowd swaying frame 1; idle crowd swaying frame 2; idle crowd swaying frame 3; idle crowd swaying frame 4; cheering crowd with arms up frame 1; cheering crowd frame 2; cheering crowd frame 3; cheering crowd frame 4; groaning crowd with hands on heads frame 1; groaning crowd frame 2; groaning crowd frame 3; groaning crowd frame 4
- `FINAL`: `골/선방 순간 관중석 오버레이 교체용`

## 3. 이펙트 (T-PCH-FX)

### F1. `fx-impact` — 임팩트 이펙트
- `FILE`: `fx-impact.png`
- `CAT`: `fx`
- `KIND`: `grid`
- `CANVAS`: `1536x1024`
- `GRID`: `4x4`
- `THREAD`: `T-PCH-FX`
- `PRIO`: `P0`
- `REFS`: `ball`
- `DESC`: Short 4-frame arcade effect animations in the same 16-bit pixel style, drawn on their own with no characters. Each row is one effect, four frames left to right, growing then fading.
- `LIST`: dust puff frame 1; dust puff frame 2; dust puff frame 3; dust puff frame 4; grass shard burst frame 1; grass shard burst frame 2; grass shard burst frame 3; grass shard burst frame 4; white-gold impact star burst frame 1; impact star burst frame 2; impact star burst frame 3; impact star burst frame 4; horizontal speed lines frame 1; speed lines frame 2; speed lines frame 3; speed lines frame 4
- `FINAL`: `달리기 먼지, 킥 임팩트, 스프린트 라인`

### F2. `fx-shot` — 조준·게이지 이펙트
- `FILE`: `fx-shot.png`
- `CAT`: `fx`
- `KIND`: `grid`
- `CANVAS`: `1536x1024`
- `GRID`: `4x3`
- `THREAD`: `T-PCH-FX`
- `PRIO`: `P0`
- `REFS`: `fx-impact`
- `DESC`: Shooting-aim effects for an arcade football game, same pixel style: glowing cyan and gold graphic elements on a transparent background.
- `LIST`: aim arrow pointing up, pulse frame 1 (a chunky chevron arrow with a cyan glow); aim arrow pulse frame 2; aim arrow pulse frame 3; aim arrow pulse frame 4; ground target reticle ring frame 1 (cyan ring with four ticks); reticle frame 2 (slightly larger); reticle frame 3 (locked, gold, contracted); reticle frame 4 (locked flash); gold sweet-spot sparkle frame 1; sweet-spot sparkle frame 2; sweet-spot sparkle frame 3; sweet-spot sparkle frame 4
- `FINAL`: `화살표는 각도로 회전해서 그림`

### F3. `fx-celebrate` — 골 연출 이펙트
- `FILE`: `fx-celebrate.png`
- `CAT`: `fx`
- `KIND`: `grid`
- `CANVAS`: `1536x1024`
- `GRID`: `4x4`
- `THREAD`: `T-PCH-FX`
- `PRIO`: `P1`
- `REFS`: `fx-impact`
- `DESC`: Celebration and reaction effects in the same 16-bit arcade pixel style, 4 frames per row.
- `LIST`: confetti burst frame 1 (mint, gold, white, cyan pieces only); confetti burst frame 2; confetti burst frame 3; confetti burst frame 4; firework burst frame 1 (gold); firework frame 2; firework frame 3; firework frame 4; radial gold light rays frame 1; light rays frame 2; light rays frame 3; light rays frame 4; blue shield sparkle for a save frame 1; save sparkle frame 2; save sparkle frame 3; save sparkle frame 4
- `FINAL`: `GOAL/SAVE 순간`

## 4. UI (T-PCH-UI)

UI 언어: **아케이드 스코어보드/LED/금속 프레임/네온**. 패널은 진한 네이비 메탈(`#23264a`)에 시안 트림, 볼트 코너, LED 앰버 포인트. 잔디동 월드의 짙은 청록+잎 장식과 다르게 **각지고 기계적**이다.

### U1. `ui-frames` — 프레임/패널 (스타일 앵커)
- `FILE`: `ui-frames.png`
- `CAT`: `ui`
- `KIND`: `grid`
- `CANVAS`: `1536x1024`
- `GRID`: `4x3`
- `THREAD`: `T-PCH-UI`
- `PRIO`: `P0`
- `REFS`: ``
- `DESC`: UI frame elements for a 16-bit arcade sports game in the look of a retro stadium scoreboard: dark navy brushed metal (#23264a) with electric cyan (#2be4ff) trim, small corner bolts, amber LED (#ffb400) accents, angular chamfered corners. Empty inner areas (dark, flat), no text, no icons.
- `LIST`: large rectangular panel frame (9-slice friendly: symmetric corners and straight edges, empty dark centre); medium panel frame with a gold trim variant; small dialog frame with corner bolts; wide horizontal ribbon (blank, three-part: left cap, middle, right cap in one cell); name plate (blank, wide and short); tooltip speech bubble frame (blank); thin horizontal divider; thin vertical divider; corner bracket ornament; tab-shaped header plate (blank); LED dot-matrix overlay tile (subtle, seamless); dark translucent-looking modal backdrop tile (flat navy, seamless)
- `FINAL`: `9-slice 인셋은 매니페스트에서 지정`

### U2. `ui-buttons` — 버튼 (대시보드 이동 / 캐릭터 변경 / 피치 복귀)
- `FILE`: `ui-buttons.png`
- `CAT`: `ui`
- `KIND`: `grid`
- `CANVAS`: `1536x1024`
- `GRID`: `3x5`
- `THREAD`: `T-PCH-UI`
- `PRIO`: `P0`
- `REFS`: `ui-frames`
- `DESC`: Button sprites for the same arcade scoreboard UI as the attached frames. Every row is ONE button in three states left to right: normal, hover (brighter cyan glow, raised), pressed (darker, pushed down 2 pixels). Each button is a wide blank plate with NO text, and a small icon at its left end. Keep the identical button size within a row.
- `LIST`: [row 1, wide 4.4:1] dashboard button: an LED scoreboard plate with a small bar-chart-and-trophy icon at the left, normal; dashboard button hover; dashboard button pressed; [row 2, wide 4.5:1] change-character button: navy plate with a small two-arrows swap icon at the left and a tiny silhouette-of-a-player-head icon, normal; change-character hover; change-character pressed; [row 3, wide 3:1] generic pill button, blank plate, normal; generic hover; generic pressed; [row 4, wide 4:1] return-to-pitch button for the website: a mint-green (#2ee8b6) plate with a small football-pitch-goal icon at the left, normal; return-to-pitch hover; return-to-pitch pressed; [row 5, square 1:1] square icon button, blank, normal; square icon button hover; square icon button pressed
- `FINAL`: `dashboard 212×48, change 212×40, pill 120×36, return 168×40, square 40×40 논리 px. return 버튼은 대시보드 DOM에서 <img>/CSS로 사용`

### U3. `ui-hud-gauges` — 슛 게이지·스코어보드
- `FILE`: `ui-hud-gauges.png`
- `CAT`: `ui`
- `KIND`: `grid`
- `CANVAS`: `1536x1024`
- `GRID`: `4x3`
- `THREAD`: `T-PCH-UI`
- `PRIO`: `P0`
- `REFS`: `ui-buttons`
- `DESC`: HUD elements for the shooting mini-game in the same arcade scoreboard UI, no text and no digits.
- `LIST`: scoreboard frame, wide LED plate with two empty dark digit windows separated by a small dot and a slot for a keeper icon; horizontal aim bar frame (long thin metal track with empty dark inside, tick marks); horizontal power bar frame (long chunky track with empty dark inside); power bar fill segment tile: green; power bar fill segment tile: gold; power bar fill segment tile: coral-red; sweet-spot marker overlay (a bright gold bracket for the perfect zone); aim bar cursor (a cyan diamond marker); style meter frame (vertical bar with empty inside); style meter fill tile (cyan to gold, seamless vertical); combo pip lit (small gold hexagon); combo pip unlit (dark hexagon)
- `FINAL`: `조준 바 320×20, 파워 바 320×28, 스타일 미터 24×160`

### U4. `ui-hud-keys` — 키캡·프롬프트
- `FILE`: `ui-hud-keys.png`
- `CAT`: `ui`
- `KIND`: `grid`
- `CANVAS`: `1536x1024`
- `GRID`: `4x3`
- `THREAD`: `T-PCH-UI`
- `PRIO`: `P0`
- `REFS`: `ui-hud-gauges`
- `DESC`: Keyboard key cap sprites and prompts for on-screen controls in the same arcade UI. The key caps are blank (the game draws the letter itself) except the arrow keys, which show arrow triangles. No letters or digits anywhere.
- `LIST`: blank square key cap, up state; blank square key cap, pressed state; arrow-up key cap; arrow-down key cap; arrow-left key cap; arrow-right key cap; wide blank space-bar key cap, up; wide space-bar key cap, pressed; wide blank shift key cap; interaction prompt speech bubble (small, blank, with a downward tail); gold glow outline for a highlighted key (frame only); small blank round mouse-click icon (a mouse with a left button lit)
- `FINAL`: `키 32×32, 스페이스 96×32`

### U5. `ui-hud-banners` — 결과 배너
- `FILE`: `ui-hud-banners.png`
- `CAT`: `ui`
- `KIND`: `grid`
- `CANVAS`: `1536x1024`
- `GRID`: `2x6`
- `THREAD`: `T-PCH-UI`
- `PRIO`: `P0`
- `REFS`: `ui-hud-gauges`
- `DESC`: Result banner backdrops for an arcade football game: wide angular banner plates with speed-stripe edges and no text (the game draws the words). Each banner is wide (about 6:1), colour-coded, glossy metal with a light streak. Two cells per row: the banner and a matching small burst decoration.
- `LIST`: GOAL banner plate in gold and mint; burst decoration in gold; SAVE banner plate in cyan and navy; burst decoration in cyan; POST banner plate in white and steel blue; burst decoration in white; MISS banner plate in coral red and navy; burst decoration in coral; STYLE callout ribbon in gold and cyan; small star decoration; PERFECT callout ribbon in gold; small gold ring decoration
- `FINAL`: `배너 480×80 논리 px`

### U6. `ui-select` — 캐릭터 선택 UI
- `FILE`: `ui-select.png`
- `CAT`: `ui`
- `KIND`: `grid`
- `CANVAS`: `1536x1024`
- `GRID`: `4x3`
- `THREAD`: `T-PCH-UI`
- `PRIO`: `P1`
- `REFS`: `ui-frames`
- `DESC`: Character-select screen UI parts in the same arcade scoreboard style, blank, no text.
- `LIST`: character card frame, normal (tall, about 3:4, dark navy, empty inner area); character card frame, hover (cyan glow); character card frame, selected (gold border, corner brackets); "current character" tag plate (small blank gold plate); left arrow button, normal; left arrow button, pressed; right arrow button, normal; right arrow button, pressed; big name plate (blank, wide, gold trim); position badge (blank small hexagon plate); confirm button plate (blank, mint-green, wide) normal; confirm button plate pressed
- `FINAL`: `카드 96×128 논리 px(초상화 96×96 + 이름 판)`

### U7. `ui-select-bg` — 선택 화면 배경
- `FILE`: `keyart-select-bg.png`
- `CAT`: `keyart`
- `KIND`: `keyart`
- `CANVAS`: `1536x1024`
- `GRID`: `none`
- `THREAD`: `T-PCH-UI`
- `PRIO`: `P1`
- `REFS`: `loading-bg`
- `DESC`: A character-select stage backdrop in the same 16-bit arcade pixel style: a dark stadium tunnel-hall stage with a glowing cyan spotlight cone on a raised podium in the centre-left, a large empty dark area on the right for panels, floor reflections, violet shadows, tiny floodlight stars. No people, no text.
- `LIST`: ``
- `FINAL`: `960×540`

### U8. `ui-stat` — 스탯 육각형·설명 패널
- `FILE`: `ui-stat.png`
- `CAT`: `ui`
- `KIND`: `grid`
- `CANVAS`: `1536x1024`
- `GRID`: `4x3`
- `THREAD`: `T-PCH-UI`
- `PRIO`: `P1`
- `REFS`: `ui-frames`
- `DESC`: Stat-screen UI parts (like a football-game player attribute hexagon) in the same arcade scoreboard style, blank, no text, no digits, no question marks.
- `LIST`: hexagon radar background: six concentric hexagon rings with six spokes (cyan lines on dark navy), square cell; hexagon outer frame ornament (metal hexagon border); radar fill polygon overlay (semi-solid cyan hexagon shape, flat colour); vertex node normal (small cyan round node); vertex node hover (larger, bright); vertex node selected (gold, glowing); axis label plate (small blank dark plate with cyan trim); detail panel frame (large, empty inside, top header slot); COMING SOON ribbon (wide diagonal-cut gold ribbon, blank); terminal screen frame (rounded screen bezel, dark glass inside, scan lines); scan-line sweep overlay (thin cyan glowing horizontal line, transparent); padlock icon (small, gold)
- `FINAL`: `육각형 320×280, 패널 340×300`

### U9. `ui-icons` — 아이콘
- `FILE`: `ui-icons.png`
- `CAT`: `ui`
- `KIND`: `grid`
- `CANVAS`: `1536x1024`
- `GRID`: `6x4`
- `THREAD`: `T-PCH-UI`
- `PRIO`: `P1`
- `REFS`: `ui-buttons`
- `DESC`: 24 small icons for an arcade football game UI, each a simple bold symbol with a navy outline in cyan, gold or white, one per cell, no text.
- `LIST`: speaker on; speaker muted; music note; music note muted; close X; back arrow; gear; scoreboard; locker; football; goal; goalkeeper glove; star; trophy; lightning bolt (sprint); shoe (kick); shield with sprout; hexagon radar; question badge; lock; keyboard; refresh arrows; pause bars; play triangle
- `FINAL`: `아이콘 24×24 논리 px`

### U10. `loader` — 로더·진행 바
- `FILE`: `ui-loader.png`
- `CAT`: `ui`
- `KIND`: `grid`
- `CANVAS`: `1536x1024`
- `GRID`: `4x3`
- `THREAD`: `T-PCH-UI`
- `PRIO`: `P0`
- `REFS`: `ball,ui-frames`
- `DESC`: Loading-screen parts in the same 16-bit arcade UI style. The football matches the attached ball sprites. No text.
- `LIST`: spinning football frame 1; spinning football frame 2; spinning football frame 3; spinning football frame 4; spinning football frame 5; spinning football frame 6; spinning football frame 7; spinning football frame 8; progress bar frame (long metal track, empty dark inside, rivets); progress bar fill tile (mint-cyan gradient-free segments with a light streak, seamless horizontally); progress bar shine overlay (a moving diagonal highlight, transparent); tip plate (blank dark plate with cyan trim for tip text)
- `FINAL`: `프로그레스 바 480×24, 볼 32×32`

## 5. 에셋 총계 (이미지 생성 기준)

| 구분 | 시트 수 | 비고 |
| --- | --- | --- |
| 필드 플레이어 12명 × 8시트 | 96 | [04 §3~§5](04-art-characters.md) |
| AI 골키퍼 | 5 | [04 §6](04-art-characters.md) |
| 환경 (E1~E9) | 9 | E4·E9는 P2 |
| 이펙트 (F1~F3) | 3 | |
| UI (U1~U10) | 10 | |
| **합계** | **123** | 러닝북 진행표 `#001~#123` |

## 6. 변환 결과 규칙 (A1, `scripts/pitch-art-manifest.json` `sheets`)

- 저장 위치 `src/web/assets/pitch/<CAT>/<id>.webp`(무손실, scene·keyart 는 손실 q90). 셀은 연결요소로 배정(알파 240 미만·떨어진 잡티 제외), 시트 안의 애니메이션은 **가로 스트립** 한 장(프레임 수·폭은 `data/assetMeta.generated.ts` 의 `frames`, 프레임 폭 = w/frames), 9-slice 프레임은 원본 비율을 유지해 축소하고 인셋을 `slice` 로 기록(엔진이 필요한 크기로 늘림). 같은 `group` 은 스케일을 공유해 상태 교체 시 위치가 안 튐(골 뒤/앞/리플, 게이트 3상태, 터미널 3상태 등). FX 시트는 반투명 글로우를 살리려고 소프트 추출.
- **scene/keyart**: 원본 1536×1024 불투명 → 중앙 16:9 밴드 1536×864 크롭 → 960×540 축소(축소 배율 0.625 라 잔디 줄무늬가 정수배는 아님).
- **실제 id 목록**(파일명 = id): env `pitch-bg locker-bg goal-back goal-front goal-ripple(4) ball-spin(8) ball-shadow ball-trail ball-ring ball-sparkle gate-closed gate-open gate-glow gate-arrow gate-plate terminal-off/idle/active exit-closed/open locker-unit(-open) bench whiteboard cooler kitbag bootrack cone-* flag(-wave) ad-a/b/c bottle bibs ballbag hurdle ladder crowd-idle/cheer/groan(4)`, fx `fx-dust fx-grass fx-star fx-speed fx-aim-arrow fx-reticle fx-sweet (각 4프레임)`(fx-celebrate 원본은 아직 없음), keyart `loading-bg select-bg`, ui = 05 §4 시트별 `manifest` 참고(`btn-*` 는 상태 3프레임 스트립, `icon-*` 24개, `loader-ball` 8프레임).
- **AI 시트가 요청 비율을 못 지킨 곳**(늘려서 맞춤 경고 17건): 얇은 바·타일·구분선(aim-bar 353×86→320×20, power-bar, fill-*, style-frame, divider-*, loader-bar/tip, scan-line), btn-change 455×129(요청 4.5:1 → 3.5:1), confirm 378×124. 실제 화면에서 왜곡이 거슬리면 해당 시트를 `slice` 모드(9-slice)로 바꾸거나 재생성한다.
- 9-slice 프레임 실제 변환 크기: panel-large 240×151, panel-medium 180×115, dialog-small 140×79, ribbon 130×32, nameplate 117×28, tooltip 80×48, tab-header 126×28, name-plate 104×40, detail-panel 220×149, terminal-frame 231×164. 대칭 오차 경고(상하): nameplate·tooltip·detail-panel·terminal-frame.
- **골대 그물(2026-09-25)**: 그물 격자는 반투명 가는 선이라 하드 추출(알파 240 미만 제외 + 알파 128 이진화)에서 대부분 사라졌다 → `goal-back`·`goal-front`·`goal-ripple` 은 `soft` 로 변환(반투명 유지). 가는 반투명 선을 가진 시트(그물·창살 등)는 매니페스트에서 `"soft": true` 를 준다. 참고: 리플 프레임은 원본에서 뒤/앞 레이어보다 작게 그려져(폭 약 108px vs 145px) 그룹 스케일 공유 후에도 크기가 다르다 — 런타임에서 중앙 정렬·배율 보정 필요.

## 7. 락커룸·스탯 UI 변환 결과 (A3)

A1 `--all` 이 5개 시트(locker-gate·locker-bg·locker-props·ui-stat·ui-icons)를 이미 변환했고, A3 는 재변환 없이 컨택트 시트로 육안 검수 + `__tests__/lockerAssets.test.ts` 로 계약을 고정했다(누락 0, 셀 분리 실패 0).

| 스프라이트 | 변환 크기 | 앵커(P6 그릴 때) |
| --- | --- | --- |
| `env/gate-closed`·`gate-open`·`gate-glow` | 128×128 3상태(열림=터널 안이 금빛, 글로우=외곽 시안 후광) | 좌상단 (16, 400) 그대로 = 타일. 하단 잔디 라인이 스프라이트 바닥까지 이어짐 |
| `env/gate-arrow` · `gate-plate` | 24×32 · 64×24 | 게이트 위 중앙 정렬(화살표 바운스는 y ±4 코드 애니메이션) |
| `env/terminal-off`·`terminal-idle`·`terminal-active` | 96×128 3상태(꺼짐/시안 글로우/금색 글로우) | **하단 중앙**(알파 bbox 가 바닥까지 닿음) — 03 §4 의 분석기는 P6 후속 조정으로 하단 중앙 (712, 394), 그릴 때 좌상단 = (664, 266) |
| `env/exit-closed`·`exit-open` | 64×96 2상태 | 하단 중앙 = 문 바닥, 03 §4 출구 (480, 520) 를 바닥 중앙으로 취급 |
| `env/locker-unit`·`locker-unit-open` | 48×80 2상태 | 하단 중앙 |
| `env/bench` 96×40 · `whiteboard` 56×72 · `cooler` 32×48 · `kitbag` 40×32 · `bootrack` 48×32 | 그림자 없음 | 하단 중앙, 충돌 박스는 하단 절반 |
| `env/locker-bg` | 960×540 불투명 | 전체 |
| `ui/hex-bg`·`hex-fill` 280×280 · `hex-frame` 320×280 | 꼭짓점 12시(뾰족한 위) 육각형, 알파 bbox 가 세로로 꽉 참 | **셋 다 중앙 정렬**로 육각형 중심 (276, 304) 에 겹친다. 육각형 꼭짓점 노드가 이미지에 포함돼 있으므로 노드 스프라이트는 선택/호버 상태 표시로만 덧그림 |
| `ui/node-normal` 12 · `node-hover` 16 · `node-selected` 16 | 정사각 | 중앙 정렬 |
| `ui/axis-plate` | 72×22, 평행사변형 금색 판 | 라벨 판, 늘려서 맞춤(fill) |
| `ui/detail-panel` | **400×392 고정(재생성본, 늘리지 않고 1:1 로 그림)** — 헤더 칸 안쪽 x 93~309·y 27~66, 본문 y 75~350. 원본 `tmp/pitch-src/ui/detail-panel.png`(1254², 마젠타 배경)를 마젠타 제거·여백 트림·400×392 축소·알파 이진화로 직접 변환했다(`ui-stat` 시트 재변환 시 옛 220×149 로 덮어써지니 매니페스트 항목을 고치거나 이 파일만 다시 변환할 것) | 패널 크기 = `STAT_DETAIL_PANEL` 400×392 |
| `ui/terminal-frame` | 231×164, 9-slice 인셋 24 | 03 §5 의 896×492 로 늘림(모서리 볼트는 24px 고정) |
| `ui/coming-soon` 216×40 · `padlock` 16×16 · `scan-line` 320×8 | 중앙 정렬 / scan-line 은 가로 채움 | |
| `ui/icon-*` | 24개 전부 24×24 | 중앙 정렬 |

- **QA 경고 3건(수용)**: `detail-panel`·`terminal-frame` 9-slice 상하 대칭 오차 0.109/0.097(허용 0.08, 좌우는 통과 — 상단 장식이 하단보다 살짝 두꺼움, 육안으로 문제 없음), `scan-line` 종횡비 86% 늘림(370×64→320×8, 얇은 발광선이라 왜곡 무관). select 그룹의 `nameplate`·`tooltip` 대칭 경고는 select 밖이라 A2 결론 유지.
- **`hex-frame` 폭 320**: 좌우 30px 여백 포함. 육각형 본체 폭은 `hex-bg`(약 260)와 같게 겹치므로 프레임을 (276−160, 304−140) 에 두면 된다.
- **에셋 그룹**: `ASSET_GROUPS.locker` = env 13(locker-bg + 분석기 3 + 출구 2 + 사물함 2 + 벤치·전술판·냉수기·킷백·부츠랙) + ui 12(스탯 시트 전부) + 아이콘 3(`icon-hexagon`·`icon-question`·`icon-locker`) = 28개, 전부 존재·바이트 가중. 게이트 5종은 `core` 에 있어 피치 진입 시 이미 로드돼 있다(락커룸 프리로드는 `locker` 그룹만). 나머지 아이콘(`icon-scoreboard`·`ball`·`goal`·`glove`·`star`·`trophy`·`bolt`·`shoe`·`crest`·`keyboard`·`refresh`·`pause`·`play`)은 어느 그룹에도 없다 — 쓰는 세션(P7 통계 표시 등)이 그룹에 추가한다.
