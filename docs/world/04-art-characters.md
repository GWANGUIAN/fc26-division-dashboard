# 04. 캐릭터 아트 — 스타일 바이블과 프롬프트

> **생성 실행용 문서**: 이미지를 실제로 만들 때는 스타일 문구가 프롬프트마다 풀어 들어 있고 스레드·레퍼런스·순서가 정리된 [10-image-generation-runbook.md](10-image-generation-runbook.md)를 사용한다. 이 문서는 설계·프롬프트의 원천이며, 고치면 `node docs/world/tools/build-image-runbook.mjs`로 10번 문서를 재생성한다.

잔디동 월드의 **모든 캐릭터(멤버 12 + 오리지널 6 + 동물 2 = 20)** 스프라이트·초상화 제작 문서다. 도구는 **ChatGPT gpt-image**(레퍼런스 이미지 첨부, 투명 PNG). 맵/UI 프롬프트는 [05](05-art-world.md), [06](06-art-ui.md)에서 이 문서의 **스타일 바이블**을 그대로 쓴다. 규격은 [01 §2](01-concept-and-architecture.md#2-확정-사양), 전체 체크리스트는 [09](09-asset-checklist.md).

## 1. 스타일 바이블 (모든 이미지 공통)

### 방향
- **하이디테일 2D 도트(HD 도트)**: 요즘 32비트급 JRPG/스타듀밸리 계열. 픽셀 블록이 또렷이 보이되 디테일은 풍부.
- **3/4 탑다운 시점**(약 45° 기울임, 클래식 젤다/포켓몬 시야). 캐릭터는 정면/측면/후면 3방향.
- 외곽선 1픽셀, **순검정이 아닌 색조 이동 어두운 색**(짙은 청록/자주), 3단 셀 셰이딩, 안티앨리어싱 번짐·그라디언트·사진 질감·3D 렌더 느낌 금지.
- 사이트 톤(짙은 청록 배경 `#040706`, 민트 `#00e9ae`)과 어울리는 따뜻하고 산뜻한 색감.

### 팔레트 기준

| 용도 | 색 | 비고 |
| --- | --- | --- |
| 잔디동 유니폼 흰색 | `#f4fff9` | 셔츠·반바지·양말 |
| 잔디동 민트 트림 | `#2ee8b6` (강조 `#00e9ae`) | 소매·옆판·양말 줄·방패 |
| GK 키트 검정 | `#1b2323` | 재닌 전용 |
| 잔디(밝음/중간/어둠) | `#6fcf5a` / `#3f9e46` / `#256a3a` | 지면·소품 톤 |
| 흙길 / 광장석 | `#c9a66b` / `#d9d2c0` | |
| 물 | `#4aa8d8` | |
| 외곽선(기본) | `#16302e` | 짙은 청록 |
| 강조 골드 | `#ffd54a` | 잔디 조각·황금 축구공·마커 |

### 공통 규격
- 캐릭터 프레임(최종): **48×64px**, 동물 32×32px. 발끝 기준(하단 중앙).
- 등신: 약 **2.5등신 치비**(머리 높이 ≈ 전체의 40%), 눈은 큰 블록형, 손은 단순화.
- 생성 해상도: 캐릭터는 1024×1024(단일)·1536×1024(시트). **"한 픽셀 블록 ≈ 캔버스의 14px(캐릭터 높이 ≈ 64픽셀급)"**로 그리도록 요청 → 변환 스크립트가 최근접 다운스케일해 진짜 도트로 만든다([08 §변환 스크립트](08-implementation-roadmap.md#3-변환-스크립트-사양)).
- 배경: 가능하면 **투명 PNG**, 아니면 **단색 `#FF00FF` 플랫 배경(그림자·바닥·그라디언트 없음)**. 스크립트가 크로마키를 지운다.
- 글자·로고·워터마크 금지(가슴 엠블럼은 글자 없는 민트 방패+새싹 도형으로만).

### STYLE_BLOCK — 스레드 첫 메시지로 붙여넣기 (복사용)

```text
You will create game art assets for a 2D top-down pixel-art RPG. Follow these rules for EVERY image in this conversation:
- Style: high-detail 2D pixel art, modern 32-bit JRPG look (Stardew Valley / Octopath sprite quality). Chunky, clearly visible pixel blocks (each visible pixel block is about 14 px on a 1024 px canvas, so a full-body character looks like roughly 64 pixels tall). Crisp 1-pixel outlines in a dark teal (#16302e), never pure black. Three-step cel shading. Warm, clean, cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly brush strokes.
- Camera: classic 3/4 top-down RPG view (about 45 degrees), characters drawn in chibi proportions, about 2.5 heads tall, head about 40% of total height, big simple eyes, tiny simplified hands.
- Team identity: the football club "잔디동" uses a white kit with mint-green (#2ee8b6) trim, and a small mint shield crest with a sprout on the chest. Never render readable text, letters, numbers or logos; show the crest only as a small text-free shield-with-sprout shape.
- Background: fully transparent background if possible. Otherwise a perfectly flat solid #FF00FF magenta background with no shadow, no floor, no gradient, no border, and no magenta anywhere on the subject.
- Output only the requested image, one per reply, no captions inside the image, no watermark, no signature.
Reply "ready" and wait for the first request.
```

### gpt-image 사용 팁
1. **캐릭터 1명당 채팅 스레드 1개**: STYLE_BLOCK → ① stand → ② turn → ③ walk → ④ portrait를 한 스레드에서 순서대로(앞 단계 결과가 문맥 + 첨부로 남아 일관성↑).
2. 각 단계 프롬프트에 **이전 단계 결과 이미지를 다시 첨부**한다(스레드 기억만 믿지 않기).
3. 결과가 마음에 안 들면 같은 프롬프트 뒤에 **"Keep everything, but fix: …"**로 수정 요청(전체 재생성보다 일관성 유지에 유리).
4. 다운로드 후 파일명을 아래 표의 **원본 이름**으로 바꿔 `tmp/world-src/characters/`에 둔다.
5. 처음 1명(권장: 재닌)으로 **스타일 테스트**를 끝내 톤을 승인받은 뒤 나머지를 양산한다(README 체크리스트 A1).

## 2. 4단계 워크플로

| 단계 | 산출물(원본) | 입력(레퍼런스) | 캔버스 | 용도 |
| --- | --- | --- | --- | --- |
| ① `stand` | `char-<id>-stand.png` | 멤버·우왁굳: `src/web/assets/group-photo/<id>.webp` 첨부 / 오리지널: 없음(텍스트만) | 1024×1024 | 마스터 디자인(정면 서기). 캐릭터 선택 화면 큰 이미지에도 사용 |
| ② `turn` | `char-<id>-turn.png` | ① 결과 | 1536×1024 | 정면·우측·후면 서 있는 자세 3컷 → **idle 프레임** |
| ③ `walk` | `char-<id>-walk.png` | ② 결과 | 1536×1024 | 걷기 4프레임 × 3방향(하/우/상) |
| ④ `portrait` | `char-<id>-portrait.png` | ① 결과 | 1024×1024 | 표정 4종 2×2 (대사창용) |

- **좌향**은 우향 프레임을 좌우 반전해 쓴다(비대칭 소품이 있는 캐릭터는 [QA §7](#7-qa-체크리스트)에서 별도 확인).
- 최종 아틀라스 `characters/<id>-atlas.webp` = **192×256px**(4열×4행, 셀 48×64): 0행 idle(하·우·상, 마지막 칸 비움), 1행 walk-하 ×4, 2행 walk-우 ×4, 3행 walk-상 ×4. 동물은 셀 32×32(128×128).
- 초상화 최종: `portraits/<id>-<neutral|happy|surprised|worried>.webp` 각 **128×128**(생성 512 → 다운스케일).
- 선택 화면용 큰 스탠딩은 ①의 결과를 `characters/<id>-stand.webp`(최대 256px 높이)로 저장(원본 1024 → 256, 최근접).

## 3. 단계별 프롬프트 템플릿

`{{…}}`는 아래 4장 표의 값으로 치환한다. 모든 단계는 STYLE_BLOCK이 이미 스레드에 있다고 가정한다.

### ① STAND (멤버·우왁굳: 레퍼런스 첨부)

```text
Attached is the original character illustration of "{{NAME}}". Redraw this exact character as a chibi pixel-art game sprite.
Keep: the same hairstyle and hair colours, {{SIGNATURE}}, the same face vibe, and the outfit colours.
Outfit: {{OUTFIT}}
Pose: standing idle, front view (facing the camera, slightly looking down at the viewer as in a top-down RPG), arms {{ARMS}}, feet together on one baseline, full body visible with a little empty margin on all sides.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
{{EXTRA}}
```

### ① STAND (오리지널 캐릭터: 텍스트만)

```text
Create an original chibi pixel-art game character sprite: {{DESC}}
Pose: standing idle, front view, arms relaxed, feet together on one baseline, full body visible with a little empty margin.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
{{EXTRA}}
```

### ② TURN

```text
Using the attached standing sprite as the exact reference, draw the SAME character as a turnaround sheet with three standing poses side by side on one 1536x1024 canvas, evenly spaced with clear gaps:
1) front view (facing the camera), 2) right-side view (facing right, profile), 3) back view (facing away).
Rules: identical character design, palette, proportions and pixel size in all three; same scale; all feet on the exact same baseline; standing idle with arms relaxed; no motion; no shadows; keep at least 10% empty margin around each pose; do not add any text or guide lines.
```

### ③ WALK

```text
Using the attached turnaround sheet as the exact reference, draw the SAME character's walk cycle as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows, each cell the same size, one pose per cell, centred, feet on the same baseline row in every cell.
Row 1 (top): walking toward the camera (front view), 4 frames.
Row 2 (middle): walking to the right (side view), 4 frames.
Row 3 (bottom): walking away from the camera (back view), 4 frames.
Frame order in every row: (1) left foot forward contact, (2) passing pose with the body slightly higher, (3) right foot forward contact, (4) passing pose with the body slightly higher. Arms swing opposite to the legs. Hair, ribbons and accessories move by at most one or two pixels.
NON-NEGOTIABLE SIDE-VIEW CHECK (middle row, moving right): frame 1's LEFT boot is the frontmost/rightmost boot and frame 3's RIGHT boot is the frontmost/rightmost boot. In those two contact frames, show two fully visible, separate boots with a clear horizontal gap; the front boot must swap sides between frame 1 and frame 3. Do not draw the same stride twice, put one boot directly behind the other, hide either boot behind hair/clothes/a prop, or use only arm motion to imply walking. Frames 2 and 4 must be visibly different passing poses, not duplicated contact poses. Before returning the image, inspect only the middle row and verify that covering the upper body still makes the alternating leading boot obvious.
Rules: identical design, palette, proportions and pixel size in all 12 cells; no motion blur; no shadows; no cell borders or grid lines; leave at least 10% empty margin inside every cell; no text.
```

### ④ PORTRAIT

```text
Using the attached standing sprite as the exact reference, draw a dialogue portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, same pixel size as the sprite style but more detailed.
Top-left: neutral, calm expression. Top-right: happy, smiling with sparkling eyes. Bottom-left: surprised, wide eyes and open mouth. Bottom-right: worried, slightly sweating, eyebrows down.
Rules: identical hairstyle, accessories and outfit colours in all four; same framing and scale; no cell borders or grid lines; no text.
```

## 4. 캐스트 디자인 필드 — 멤버 11명 + 우왁굳

레퍼런스는 `src/web/assets/group-photo/<id>.webp`(전신 컷아웃, 2026-09 기준 12장 모두 존재 확인). 외형 설명은 **컷아웃을 직접 보고 작성**했다. 잔디동 기본 키트가 "`{{OUTFIT}}`"의 기본값이다:

> **기본 OUTFIT(멤버 공통)**: `the 잔디동 club kit: white short-sleeve jersey with mint-green side panels, sleeve trim and a small text-free mint shield crest with a sprout on the chest, white shorts with mint side stripe, white knee-high socks with a mint band, white football boots with mint studs.`

### 4-1. 필드 값 표

| id | `NAME` | `SIGNATURE` (지켜야 할 특징) | `ARMS` | `OUTFIT` | `EXTRA` |
| --- | --- | --- | --- | --- | --- |
| `janine95kim` | 재닌 | long wavy vivid blue hair, round glasses, white cap-style headband with a tiny ornament and a small black headset microphone, black choker | on her hips, confident | **GK kit**: black long-sleeve goalkeeper jersey with mint side panels and a small text-free mint shield crest, white goalkeeper gloves, black shorts with a mint stripe, black knee-high socks, black boots with mint studs | 안경 반사는 흰 픽셀 2개로 |
| `bboringirl` | 뽀린걸 | silver-grey hair with red-pink streaks in the side locks, a low side ponytail draped over the shoulder, amber eyes, one small ahoge strand, warm smile | relaxed at sides | 기본 OUTFIT | 빨간 머리 스트릭이 잘 보이게 |
| `sjh4018` | 핑구 | very long sky-blue hair with straight parted bangs, black hairband, small hair clip at the side, blue eyes, cheerful open smile | relaxed at sides | 기본 OUTFIT | 머리가 발목 근처까지 길어 걷기에서 머리 흔들림 최소화 요청 |
| `doormomo` | 문모모 | short purple-black bob with blunt bangs and purple hair tips, white headband with a small red badge shape (no readable text), silver star hairpin, purple eyes | crossed over the chest | 기본 OUTFIT | 머리띠 로고는 글자 없는 빨간 블록으로 |
| `hachi97` | 하치 | short black bob with a white streak, small white antler-like horn ornaments on the head, purple eyes, big open-mouth smile | crossed over the chest | 기본 OUTFIT | 뿔이 잘리지 않게 위 여백 확보 |
| `kaksjak0730` | 한결 | very long black hair in a high ponytail, blue eyes, white headphones with a mint-outlined cat-ear band, small star hairpin, gentle smile | relaxed at sides | 기본 OUTFIT | 헤드폰 고양이 귀 실루엣 강조 |
| `ju010228` | 쥬멩이 | very long green hair with a white streak and a white ribbon at the side, amber eyes, gentle smile | hands clasped behind the back | 기본 OUTFIT | 긴 머리 걷기 흔들림 최소화 |
| `haepalin` | 해파린 | short lavender-periwinkle bob with one ahoge, blue eyes, a jellyfish-shaped hair ornament and small heart hair clips, soft smile | relaxed at sides | 기본 OUTFIT | 해파리 머리핀은 파랑·하양 블록 |
| `tleod1818` | 빙밍 | black hair in a bun with a green leaf hairpin and a small white flower, blunt bangs, green eyes, black ribbon choker | relaxed at sides | 기본 OUTFIT | 잎 핀 초록색 유지 |
| `tdnlamuron` | 다시바 | short black hair with orange and white streaks, cat ears with pink inner ear, a hairpin shaped like a small round badge (no readable number), amber eyes, black choker | crossed over the chest | 기본 OUTFIT | 귀 위 여백 확보 |
| `lina0108` | 리냐 | long messy red-pink hair with a white streak, small pink-and-white horns, amber eyes, playful smirk | crossed over the chest | 기본 OUTFIT | 머리 숱이 많아 실루엣이 커지므로 프레임 여백 확보 |
| `woowakgood` | 우왁굳 | adult man's body in a black suit, white shirt, mint-green necktie and mint pocket square, black dress shoes; head is a stylised golden-tan animal-like mascot head (capybara-like) with small round ears and a black headset with a boom microphone and a small red badge | one hand in the trouser pocket, the other adjusting the jacket | `black formal suit with mint tie and pocket square` (기본 키트 아님) | 얼굴은 동물풍 마스코트 유지, 사람 얼굴로 바꾸지 말 것 |

- **표 사용법**: ① 템플릿의 `{{NAME}}`, `{{SIGNATURE}}`, `{{ARMS}}`, `{{OUTFIT}}`, `{{EXTRA}}`를 표에서 복사. `OUTFIT`이 "기본 OUTFIT"이면 위 인용문 사용.
- ②~④는 필드 없이 템플릿 그대로(이전 결과 첨부). 캐릭터별 주의는 `EXTRA`를 각 단계 끝에 덧붙인다.
- **완성 예시 — 재닌 ① STAND**

```text
Attached is the original character illustration of "재닌". Redraw this exact character as a chibi pixel-art game sprite.
Keep: the same hairstyle and hair colours, long wavy vivid blue hair, round glasses, white cap-style headband with a tiny ornament and a small black headset microphone, black choker, the same face vibe, and the outfit colours.
Outfit: GK kit: black long-sleeve goalkeeper jersey with mint side panels and a small text-free mint shield crest, white goalkeeper gloves, black shorts with a mint stripe, black knee-high socks, black boots with mint studs.
Pose: standing idle, front view (facing the camera, slightly looking down at the viewer as in a top-down RPG), arms on her hips, confident, feet together on one baseline, full body visible with a little empty margin on all sides.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
Glasses reflections are just two white pixels.
```

### 4-2. 캐릭터별 파일명

| id | ① 원본 | ② 원본 | ③ 원본 | ④ 원본 | 최종 아틀라스 | 최종 초상(4) | 선택 화면 스탠딩 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `janine95kim` | `char-janine95kim-stand.png` | `…-turn.png` | `…-walk.png` | `…-portrait.png` | `characters/janine95kim-atlas.webp` | `portraits/janine95kim-{neutral,happy,surprised,worried}.webp` | `characters/janine95kim-stand.webp` |
| `bboringirl` | 동일 규칙 | | | | `characters/bboringirl-atlas.webp` | `portraits/bboringirl-*.webp` | `characters/bboringirl-stand.webp` |
| `sjh4018` | 〃 | | | | `characters/sjh4018-atlas.webp` | `portraits/sjh4018-*.webp` | `characters/sjh4018-stand.webp` |
| `doormomo` | 〃 | | | | `characters/doormomo-atlas.webp` | `portraits/doormomo-*.webp` | `characters/doormomo-stand.webp` |
| `hachi97` | 〃 | | | | `characters/hachi97-atlas.webp` | `portraits/hachi97-*.webp` | `characters/hachi97-stand.webp` |
| `kaksjak0730` | 〃 | | | | `characters/kaksjak0730-atlas.webp` | `portraits/kaksjak0730-*.webp` | `characters/kaksjak0730-stand.webp` |
| `ju010228` | 〃 | | | | `characters/ju010228-atlas.webp` | `portraits/ju010228-*.webp` | `characters/ju010228-stand.webp` |
| `haepalin` | 〃 | | | | `characters/haepalin-atlas.webp` | `portraits/haepalin-*.webp` | `characters/haepalin-stand.webp` |
| `tleod1818` | 〃 | | | | `characters/tleod1818-atlas.webp` | `portraits/tleod1818-*.webp` | `characters/tleod1818-stand.webp` |
| `tdnlamuron` | 〃 | | | | `characters/tdnlamuron-atlas.webp` | `portraits/tdnlamuron-*.webp` | `characters/tdnlamuron-stand.webp` |
| `lina0108` | 〃 | | | | `characters/lina0108-atlas.webp` | `portraits/lina0108-*.webp` | `characters/lina0108-stand.webp` |
| `woowakgood` | 〃 | | | | `characters/woowakgood-atlas.webp` | `portraits/woowakgood-*.webp` | (선택 불가, 생략 가능) |

**원본 이름 규칙**: `char-<id>-stand.png`, `char-<id>-turn.png`, `char-<id>-walk.png`, `char-<id>-portrait.png` (위치 `tmp/world-src/characters/`). 위 표의 "〃"는 같은 규칙을 그대로 적용한다는 뜻이다.

## 5. 오리지널 NPC 6종 (텍스트 프롬프트)

레퍼런스가 없으므로 ① STAND(오리지널)의 `{{DESC}}`부터 새로 만든다. ②~④는 템플릿 그대로. 대사·역할은 [02 §3](02-story-and-missions.md#3-캐스트).

| id | 한글 이름 | `{{DESC}}` (그대로 붙여넣기) | 원본 이름 |
| --- | --- | --- | --- |
| `elder` | 잔디 할아버지 | an elderly village groundskeeper, kind face, big white moustache, bald head with a worn straw hat, green work apron over a beige shirt with rolled sleeves, brown trousers and boots, holding a small metal watering can in one hand, slightly hunched, warm smile, earthy green and beige palette | `char-elder-*.png` |
| `shopkeeper` | 편의점 사장님 | a friendly middle-aged convenience-store owner, round glasses, short tidy hair, a mint-green striped store apron over a white shirt, a small name-tag shape (no readable text), sleeves rolled, holding a small cardboard box, cheerful expression, mint and white palette | `char-shopkeeper-*.png` |
| `kid` | 꼬마 팬 | a small child fan, drawn smaller than the adults (about 75% of the standard height but still centred in the same canvas), wearing an oversized white-and-mint football jersey that reaches the knees, a red scarf, a bucket cap, holding a small mint pennant flag, huge excited eyes | `char-kid-*.png` |
| `referee` | 심판 | a football referee, athletic build, black referee kit with yellow trim, a silver whistle in the mouth or hanging on a lanyard, a small yellow card and a red card sticking out of the chest pocket, a short cap, serious but fair expression | `char-referee-*.png` |
| `weedking` | 제초왕 | a comical villain "weed king", tall and imposing (drawn slightly taller, about 95% of the canvas height), long grey-brown coat with a high collar, dark sunglasses, a big curled moustache, a crown made of spinning lawn-mower blades, a petrol grass-trimmer carried over the shoulder, a round badge showing a crossed-out sprout (no text), grey and rust-orange palette with a hint of purple, smug grin | `char-weedking-*.png` |
| `weeder-grunt` | 제초 요원 | a factory-worker minion, grey coverall with rust-orange stripes, a hard hat with a face visor, thick gloves, holding a hand-held grass trimmer, goggles, expressionless, grey and rust-orange palette (same palette family as the weed king but plainer) | `char-weeder-grunt-*.png` |

- `weeder-grunt`는 엔딩 후 **정원사 버전**(모자를 밀짚모자로, 색을 초록으로)이 필요 → 변환 스크립트의 **팔레트 스왑**(회색→초록, 주황→밝은 갈색)으로 `weeder-grunt-gardener` 파생을 자동 생성([09 파생 에셋](09-asset-checklist.md#자동-생성-파생-에셋)).
- `weedking`의 엔딩 후 모습(잔디 코치)은 같은 스프라이트에서 왕관·제초기를 지우는 대신 **선글라스 유지 + 색상만 밝게(팔레트 스왑)**로 처리한다(추가 생성 없음, 필요하면 P2에서 별도 생성).

## 6. 동물 2종 (walk 시트만)

동물은 정면/후면/측면 모두 단순하므로 **한 번에 걷기 시트**만 만든다(② turn·④ portrait 없음). 셀 32×32, 최종 `characters/<id>-atlas.webp`(128×128).

### `cat-jandi` 잔디냥 (`char-cat-jandi-walk.png`)

```text
Create a pixel-art walk-cycle sprite sheet of a small cute mascot cat on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows, each cell the same size, one pose per cell, centred, paws on the same baseline row in every cell.
Design: a chubby cream-white cat with mint-green patches and a tiny green leaf on its head, a small bell collar, big simple eyes.
Row 1: walking toward the camera (front view), 4 frames. Row 2: walking to the right (side view), 4 frames. Row 3: walking away (back view), 4 frames.
Frame order: left paw forward, passing, right paw forward, passing. In the middle/right-facing row, frame 1's left front paw must be the visibly frontmost/rightmost paw and frame 3's right front paw must be visibly frontmost/rightmost; show a clear horizontal gap and never stack or hide the paws. Same scale in all cells, no shadows, no cell borders, at least 10% margin in each cell, no text.
```

### `dog-ball` 공돌이 (`char-dog-ball-walk.png`)

```text
Create a pixel-art walk-cycle sprite sheet of a small playful puppy on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows, each cell the same size, one pose per cell, centred, paws on the same baseline row in every cell.
Design: a brown-and-white puppy with floppy ears carrying a tiny mint-and-white football in its mouth, wagging tail, big simple eyes.
Row 1: walking toward the camera (front view), 4 frames. Row 2: walking to the right (side view), 4 frames. Row 3: walking away (back view), 4 frames.
Frame order: left paw forward, passing, right paw forward, passing. In the middle/right-facing row, frame 1's left front paw must be the visibly frontmost/rightmost paw and frame 3's right front paw must be visibly frontmost/rightmost; show a clear horizontal gap and never stack or hide the paws. Same scale in all cells, no shadows, no cell borders, at least 10% margin in each cell, no text.
```

동물 idle 프레임은 walk의 2번째(passing) 프레임을 재사용한다(변환 스크립트 규칙).

## 7. QA 체크리스트

각 단계 결과를 저장하기 전에 확인한다. 통과 못 하면 "Keep everything, but fix: …"로 재요청.

**공통**
- [ ] 배경이 투명 또는 완전 단색 `#FF00FF`(그림자·바닥·그라디언트 없음), 캐릭터에 마젠타 없음
- [ ] 글자/숫자/로고 없음(가슴 엠블럼은 도형만)
- [ ] 외곽선 1픽셀급, 색 번짐·그라디언트 없음, 픽셀 블록 크기 일정(캐릭터 높이 ≈ 64픽셀급)
- [ ] 레퍼런스의 헤어 색·시그니처(안경·머리핀·귀·뿔·헤드셋 등)·키트 색 유지

**② turn**
- [ ] 정면·우측·후면 3컷의 크기/비율/발끝 기준선 동일, 간격 충분
- [ ] 후면에서 머리 장식·머리 길이 등 뒷모습이 자연스러움

**③ walk**
- [ ] 4×3 그리드, 12칸 모두 같은 캐릭터·같은 크기, 발끝 행 동일
- [ ] 프레임 순서 (접촉→통과→접촉→통과), 팔다리 교차, 몸통 상하 1~2픽셀
- [ ] 칸 경계선 없음, 인접 칸으로 삐져나오는 머리카락·소품 없음

**④ portrait**
- [ ] 4칸 표정 구분 명확(기본/기쁨/놀람/걱정), 헤어·소품 동일, 프레이밍 동일

**좌우 반전 검사(우향 → 좌향)**
- [ ] 비대칭 소품(한쪽 머리핀, 한쪽 장갑, 어깨 띠 등)이 반전되어도 어색하지 않음. 어색하면 좌향 전용 시트를 추가 생성(P2).

## 8. 생성 개수 (이 문서 범위)

| 구분 | 캐릭터 수 | 캐릭터당 생성 | 소계 |
| --- | --- | --- | --- |
| 멤버 11 + 우왁굳 | 12 | 4 (stand/turn/walk/portrait) | 48 |
| 오리지널 인간 | 6 | 4 | 24 |
| 동물 | 2 | 1 (walk) | 2 |
| **합계** | **20** | | **74장** |

우선순위: **P0 = 멤버 11명 전원의 stand/turn/walk/portrait**(선택 가능해야 하므로 필수) + 우왁굳 + `elder`; P1 = `shopkeeper`, `kid`, `referee`, `weedking`, `weeder-grunt`, 동물 2종.

## 9. S7 보행·스탠딩 교정 (2026-09-19)

기존 원본의 팔 동작과 별개로 전방/측면 보행에서 앞발이 고정돼 보이는 사례가 확인됐다. S7에서는 **20명 전원의 walk**를 교체하고, 동물 2종을 제외한 **18명의 stand**를 walk와 같은 비율로 다시 만든다. `turn`과 `portrait`는 이 작업 범위에 포함하지 않는다.

| 대상 | 새 원본 | 반드시 첨부할 레퍼런스 | 생성 후 확인 |
| --- | --- | --- | --- |
| `bboringirl`, `doormomo`, `elder`, `hachi97`, `haepalin`, `janine95kim`, `ju010228`, `kaksjak0730`, `kid`, `lina0108`, `referee`, `shopkeeper`, `sjh4018`, `tdnlamuron`, `tleod1818`, `weeder-grunt`, `weedking`, `woowakgood` | `char-<id>-walk.png`, `char-<id>-stand.png` | 현재 `char-<id>-turn.png`와 현재/새 `char-<id>-walk.png` | stand의 전체 키·머리/몸통/다리 비율이 walk 12칸과 같음 |
| `cat-jandi`, `dog-ball` | `char-<id>-walk.png` | 현재 `char-<id>-walk.png` | 동물 32×32 보행 12칸의 앞발/뒷발이 교대로 움직임 |

**walk 재생성 프롬프트** — 기존 ③ 템플릿 뒤에 아래를 반드시 덧붙인다.

```text
This is a strict animation correction, not four cosmetic poses. In every row, frame 1 must show the character's left foot clearly leading and frame 3 the right foot clearly leading. The middle row is the acceptance gate: it is a right-facing side profile, so frame 1's LEFT boot must be the frontmost/rightmost boot and frame 3's RIGHT boot must be the frontmost/rightmost boot. In both contact frames, draw two complete, non-overlapping boots separated horizontally by a visible gap; do not merely change the knee, arm, toe highlight, or leg angle. Frames 2 and 4 are distinct passing poses with the body 1–2 final-pixel equivalents higher, never duplicated contact poses. Covering the upper body must still make frame 1 vs frame 3 read as opposite strides. Keep the foot baseline identical in all 12 cells and do not let hair, arms, clothing, or a prop hide either foot.
```

**옆모습 실패 재생성 프롬프트** — 첨부한 결과에서 가운데 행의 발이 고정·중첩·복제돼 보일 때, **같은 캐릭터 생성 대화**를 유지하고 실패한 walk 시트와 `turn` 시트를 모두 다시 첨부한 뒤 아래만 보낸다. 결과물은 파이프라인용 전체 4×3 시트여야 한다.

```text
The attached walk sheet failed side-view walk-cycle QA. Keep this exact character, palette, clothing, pixel size, grid, and the front/back rows, but regenerate the COMPLETE 4x3 sheet and correct the middle row only as a literal right-facing side-profile walk cycle. This is not a cosmetic variation request.

Middle row acceptance criteria: frame 1 is LEFT-foot contact, with the left boot fully visible as the frontmost/rightmost boot; frame 3 is RIGHT-foot contact, with the right boot fully visible as the frontmost/rightmost boot. The two contact frames must have opposite leading boots, two separate non-overlapping boots, and a clearly visible horizontal stride gap. Do not reuse the same leg silhouette, place one boot directly behind the other, hide a boot behind hair/clothes/props, or signal movement only with arms. Frames 2 and 4 must be distinct passing poses, not copies of the contact frames. Before delivering, inspect the middle row with the upper body mentally covered: the alternating leading boot must still be unambiguous.

Return a full transparent 1536x1024 4-column by 3-row sprite sheet, no background, no shadow, no text, no grid lines.
```

**stand 재생성 프롬프트** — 현재/새 walk 시트를 필수 첨부하고 기존 ① 템플릿 대신 아래 비율 규칙을 덧붙인다.

```text
Match the attached walk sheet exactly: use the same head-to-foot height, head/body/leg proportions, line thickness, boot size and pixel-block scale as its front-row contact frames. This is an idle pose, not a taller character: feet together on the same baseline, full-body height within two final-pixel equivalents of the walk sprite, no elongated legs or torso.
```

수령 위치는 기존대로 `tmp/world-src/characters/`이며, 변환은 `pnpm convert:world-art -- characters <id>`를 쓴다. 변환 QA는 각 행에서 frame 1↔3의 발 실루엣 차이와 12개 셀의 발끝 기준선 편차(3px 이하)를 모두 검사한다. 특히 가운데 행은 **frame 1의 좌측 발이 화면상 오른쪽 선두, frame 3의 우측 발이 화면상 오른쪽 선두, 두 부츠가 수평으로 분리**됐는지 확인한다.
