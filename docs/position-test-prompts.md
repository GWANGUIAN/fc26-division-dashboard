# 나의 축구 포지션은? — 이미지 생성 프롬프트 레퍼런스

`src/web/position-test/`에 구현되는 "나의 축구 포지션은?" 성향 테스트 팝업에 쓰이는 이미지 생성용 프롬프트 모음이다. **이 문서는 공통 프롬프트 영역을 따로 분리하지 않는다** — 각 이미지 항목의 프롬프트 전문을 그 자리에서 바로 복사해서 생성 도구에 붙여넣을 수 있도록, 스타일/프레임/색상 지시를 매 항목마다 다시 풀어써서 완전한 형태로 반복 기술했다(`docs/toty-card-prompts.md`처럼 "카드 뒷면 이미지를 레퍼런스로 첨부" 식으로 축약하지 않음).

## 1. 디자인 방향

- **캐릭터 스타일**: `docs/minigame-football-rules-quiz.md`의 문항 일러스트와 같은 톤인 **2D 스티커풍 SD(치비) 캐릭터**로 통일한다 — 둥근 비율, 굵고 깨끗한 짙은 청록(`#0b3d36`) 외곽선, 부드러운 셀 셰이딩, 좌상단 하이라이트. 잔디동 유니폼은 흰색 바탕에 민트 `#00e9ae` 포인트, 마스코트/문항 일러스트에는 로고·글자 없는 빈 크레스트만 넣는다.
- **결과 카드 프레임**: "오늘의 운세" 타로 카드의 정교한 필리그리 실루엣과는 완전히 다른, 더 가볍고 코믹한 **둥근 사각형 뱃지/스티커 카드** 프레임을 쓴다 — 장식 없이 깔끔한 둥근 사각형 테두리 하나만 쓰고(카드 실루엣 바깥은 전부 투명), 하단 여백은 카드 높이의 ~8% 정도로 최소화해서 캐릭터/배경이 카드 아래쪽까지 최대한 채우도록 한다. 카드 이름/포지션/이름 문구는 전부 HTML로 오버레이하므로(운세 카드와 동일 컨벤션) **이미지 안에 텍스트·숫자·로고를 절대 넣지 않는다**.
- **수정 이력**: 1차 생성분에서 카드 상단 중앙에 반원형 펜넌트 탭 + 좌우 원형 뱃지 3개짜리 장식을 넣었더니 캐릭터 얼굴을 가릴 만큼 크게 나오고, 하단 여백(~18%)도 지나치게 넓게 나오는 문제가 있어서 전부 제거/축소했다. 아래 모든 프롬프트는 이미 수정 반영본이다 — 이미 생성된 이미지를 고칠 때는 새로 생성하지 말고, 해당 이미지를 만든 세션에 "상단 펜넌트 탭과 좌우 원형 뱃지 3개를 전부 제거하고, 하단 여백을 카드 높이의 ~8%로 줄여줘(캐릭터/배경을 아래로 더 채워서). 캐릭터·포즈·색상·1060x1484 캔버스 크기·카드 실루엣 바깥 투명 배경은 그대로 유지" 정도로 후속 지시하면 된다.
- **포지션별 악센트 컬러** (카드 프레임의 펜넌트·코너 뱃지·배경 그라데이션에 사용):
  | 포지션 | 색상 이름 | HEX |
  |---|---|---|
  | ST | 코럴 오렌지 | `#ff7a4d` |
  | WF | 라임 옐로우 | `#c6e64a` |
  | CM | 스카이 블루 | `#4a90ff` |
  | CDM | 바이올렛 | `#8a5cff` |
  | CB | 스틸 블루그레이 | `#6b83a3` |
  | FB | 에메랄드 틸 | `#2ed9a8` |
  | GK | 골든 옐로우 | `#ffd44f` |
- **중요 — 기존 "오늘의 운세" 타로 카드와 모티프 겹치지 않기**: 같은 멤버라도 이 성향 테스트 결과 카드는 `docs/fortune-prompts.md`에서 이미 확정된 타로 카드 모티프/문구(강철 심장·엔진, 서리·얼음, 목청·퉁퉁이, 고요한 물결·침묵, 사시·갈림길·시선, 번개·질주자, 돌격병, 두고하치, 황금 드래곤, 천리안, 밤하늘·프리키커 등)와 겹치지 않는 **독자적인 포즈/소품/표정**으로 새로 설계했다. 아래 각 프롬프트에 이미 반영되어 있으니 그대로 쓰면 됨.
- **캔버스/저장**: 결과 카드 일러스트는 전부 **1060×1484px**(5:7, 세로) 알파 채널 있는 투명 PNG → webp 변환 후 `src/web/assets/position-test/`에 저장(`positionTestAssets.ts`가 `import.meta.glob`으로 자동 인식, 파일 없어도 플레이스홀더로 동작). 문항 일러스트는 **1280×720px** 가로 불투명 PNG → webp 변환 후 `public/position-test-q01.webp` ~ `q09.webp`로 저장(축구 상식 퀴즈와 동일하게 `public/` 루트, 코드가 절대경로로 참조).
- **얼굴 레퍼런스**: 결과 카드 14장은 각 멤버의 실제 참고 사진(`src/web/assets/group-photo/<id>.webp`)을 얼굴/헤어 레퍼런스로 첨부해서 생성한다. 문항 일러스트 9장은 특정 멤버가 아닌 **가상의 마스코트 캐릭터**(성별 불명확한 SD 소년/소녀상, 아래 2절에 매번 전체 묘사 포함)를 사용한다 — 질문은 "당신이라면?"을 묻는 것이지 특정 멤버의 이야기가 아니므로, 결과를 미리 암시하지 않기 위함.
- 앞면 이미지가 없어도 사이트는 정상 동작한다(플레이스홀더 아이콘으로 대체) — 급하지 않게 하나씩 채워 넣으면 된다.

## 2. 문항 일러스트 9장

파일명 규칙: `q0<N>-<slug>.png` (원본) → `public/position-test-q0<N>.webp` (최종).

### Q1 — 수비가 무너지는 순간

**파일명**: `position-test-q01.webp`

```
A cute 2D sticker-style SD (super-deformed) football illustration, chibi
proportions (2-3 head-tall), featuring a cheerful, gender-ambiguous
generic young football player character (short simple dark-brown hair,
round friendly face, no distinguishing real-person likeness) wearing the
standard 잔디동 kit (white jersey with mint-green #00e9ae trim, small
blank crest, mint shorts, white socks). Thick clean deep-teal (#0b3d36)
outline, soft cel shading, warm top-left highlight, polished 2D
sticker-game art style. Landscape 1280x720 canvas, soft mint-white
gradient background, no readable text, no letters, no numbers, no logos,
no watermark, no scoreboard.

The mascot stands at the edge of a bright green pitch just as the
opposing defense visibly scatters and opens up in the background (a few
simple dark silhouette defenders stumbling out of position), eyes
lighting up with a small glowing decision-spark shape above their head,
one foot already pushing off the ground — captures the split-second
instant a gap just opened up. High detail, PNG.
```

### Q2 — 단톡방 알림

**파일명**: `position-test-q02.webp`

```
A cute 2D sticker-style SD (super-deformed) football illustration, chibi
proportions (2-3 head-tall), featuring a cheerful, gender-ambiguous
generic young football player character (short simple dark-brown hair,
round friendly face, no distinguishing real-person likeness) wearing the
standard 잔디동 kit (white jersey with mint-green #00e9ae trim, small
blank crest, mint shorts, white socks). Thick clean deep-teal (#0b3d36)
outline, soft cel shading, warm top-left highlight, polished 2D
sticker-game art style. Landscape 1280x720 canvas, soft mint-white
gradient background, no readable text, no letters, no numbers, no logos,
no watermark, no scoreboard.

The mascot sits cross-legged on the grass holding a glowing smartphone
with a small plain speech-bubble icon and a chat-notification burst
floating above the screen (icon shapes only, no readable text), a
teammate's simple blurred silhouette stretching in the background —
captures a casual "team chat just lit up" moment. High detail, PNG.
```

### Q3 — 역습 위기

**파일명**: `position-test-q03.webp`

```
A cute 2D sticker-style SD (super-deformed) football illustration, chibi
proportions (2-3 head-tall), featuring a cheerful, gender-ambiguous
generic young football player character (short simple dark-brown hair,
round friendly face, no distinguishing real-person likeness) wearing the
standard 잔디동 kit (white jersey with mint-green #00e9ae trim, small
blank crest, mint shorts, white socks). Thick clean deep-teal (#0b3d36)
outline, soft cel shading, warm top-left highlight, polished 2D
sticker-game art style. Landscape 1280x720 canvas, soft mint-white
gradient background, no readable text, no letters, no numbers, no logos,
no watermark, no scoreboard.

The mascot reacts with wide alarmed eyes as a small dark silhouette
figure dribbles a ball away in the background mid-turnover, one foot
already pivoting to react, a small comic exclamation-burst shape (plain
shape, no punctuation or letters) above their head — captures the
instant panic of a turnover leading to a counter-attack. High detail,
PNG.
```

### Q4 — 경기 종료 직전

**파일명**: `position-test-q04.webp`

```
A cute 2D sticker-style SD (super-deformed) football illustration, chibi
proportions (2-3 head-tall), featuring a cheerful, gender-ambiguous
generic young football player character (short simple dark-brown hair,
round friendly face, no distinguishing real-person likeness) wearing the
standard 잔디동 kit (white jersey with mint-green #00e9ae trim, small
blank crest, mint shorts, white socks). Thick clean deep-teal (#0b3d36)
outline, soft cel shading, warm top-left highlight, polished 2D
sticker-game art style. Landscape 1280x720 canvas, soft mint-white
gradient background, no readable text, no letters, no numbers, no logos,
no watermark, no scoreboard.

The mascot stands on the pitch at dusk with a simple abstract stadium
clock silhouette in the background (just clock hands near the top, no
numbers), one bead of sweat, an intensely focused expression, both
fists clenched — captures the tension of a close match in its final
moment. High detail, PNG.
```

### Q5 — 경기 전 몸풀기

**파일명**: `position-test-q05.webp`

```
A cute 2D sticker-style SD (super-deformed) football illustration, chibi
proportions (2-3 head-tall), featuring a cheerful, gender-ambiguous
generic young football player character (short simple dark-brown hair,
round friendly face, no distinguishing real-person likeness) wearing the
standard 잔디동 kit (white jersey with mint-green #00e9ae trim, small
blank crest, mint shorts, white socks). Thick clean deep-teal (#0b3d36)
outline, soft cel shading, warm top-left highlight, polished 2D
sticker-game art style. Landscape 1280x720 canvas, soft mint-white
gradient background, no readable text, no letters, no numbers, no logos,
no watermark, no scoreboard.

The mascot does a simple warm-up lunge stretch on the grass at
golden-hour, a small rolled-out mat and a water bottle nearby, calm and
relaxed pre-match atmosphere, soft warm sunset lighting. High detail,
PNG.
```

### Q6 — 하이라이트 클립

**파일명**: `position-test-q06.webp`

```
A cute 2D sticker-style SD (super-deformed) football illustration, chibi
proportions (2-3 head-tall), featuring a cheerful, gender-ambiguous
generic young football player character (short simple dark-brown hair,
round friendly face, no distinguishing real-person likeness) wearing the
standard 잔디동 kit (white jersey with mint-green #00e9ae trim, small
blank crest, mint shorts, white socks). Thick clean deep-teal (#0b3d36)
outline, soft cel shading, warm top-left highlight, polished 2D
sticker-game art style. Landscape 1280x720 canvas, soft mint-white
gradient background, no readable text, no letters, no numbers, no logos,
no watermark, no scoreboard.

The mascot strikes a triumphant highlight-reel freeze-frame pose (both
arms up, one knee raised) on the pitch with a soft glowing spotlight
circle beneath them and a couple of sparkle bursts around them, as if
caught mid-celebration for a highlight clip. High detail, PNG.
```

### Q7 — 상대 에이스와의 기 싸움

**파일명**: `position-test-q07.webp`

```
A cute 2D sticker-style SD (super-deformed) football illustration, chibi
proportions (2-3 head-tall), featuring a cheerful, gender-ambiguous
generic young football player character (short simple dark-brown hair,
round friendly face, no distinguishing real-person likeness) wearing the
standard 잔디동 kit (white jersey with mint-green #00e9ae trim, small
blank crest, mint shorts, white socks). Thick clean deep-teal (#0b3d36)
outline, soft cel shading, warm top-left highlight, polished 2D
sticker-game art style. Landscape 1280x720 canvas, soft mint-white
gradient background, no readable text, no letters, no numbers, no logos,
no watermark, no scoreboard.

The mascot stares down a tall, intimidating dark-silhouette rival player
standing opposite them across a short stretch of grass, jaw set with
quiet determination, a couple of small tension-line effects hovering in
the air between them. High detail, PNG.
```

### Q8 — 경기 후 회식

**파일명**: `position-test-q08.webp`

```
A cute 2D sticker-style SD (super-deformed) football illustration, chibi
proportions (2-3 head-tall), featuring a cheerful, gender-ambiguous
generic young football player character (short simple dark-brown hair,
round friendly face, no distinguishing real-person likeness) wearing the
standard 잔디동 kit (white jersey with mint-green #00e9ae trim, small
blank crest, mint shorts, white socks). Thick clean deep-teal (#0b3d36)
outline, soft cel shading, warm top-left highlight, polished 2D
sticker-game art style. Landscape 1280x720 canvas, soft mint-white
gradient background, no readable text, no letters, no numbers, no logos,
no watermark, no scoreboard.

The mascot sits at a casual round table set with simple plain-colored
plates and cups (no readable menu or text anywhere), gesturing
animatedly mid-story with one hand, a content happy smile, teammates'
simple silhouettes blurred in the background. High detail, PNG.
```

### Q9 — 새 팀원 합류

**파일명**: `position-test-q09.webp`

```
A cute 2D sticker-style SD (super-deformed) football illustration, chibi
proportions (2-3 head-tall), featuring a cheerful, gender-ambiguous
generic young football player character (short simple dark-brown hair,
round friendly face, no distinguishing real-person likeness) wearing the
standard 잔디동 kit (white jersey with mint-green #00e9ae trim, small
blank crest, mint shorts, white socks). Thick clean deep-teal (#0b3d36)
outline, soft cel shading, warm top-left highlight, polished 2D
sticker-game art style. Landscape 1280x720 canvas, soft mint-white
gradient background, no readable text, no letters, no numbers, no logos,
no watermark, no scoreboard.

The mascot warmly waves toward a new, slightly nervous-looking
silhouette teammate just arriving at the pitch entrance, other simple
teammate silhouettes visible in the background mid-warm-up, open
welcoming body language, bright friendly expression. High detail, PNG.
```

## 3. 결과 카드 캐릭터 일러스트 14장

파일명 규칙: `<memberId>-position-a.webp` / `<memberId>-position-b.webp` (포지션마다 멤버 1~2명이므로 테마가 하나뿐인 멤버는 해당 접미사 하나만 생성). 저장 위치: `src/web/assets/position-test/`. 각 프롬프트는 얼굴 레퍼런스로 `src/web/assets/group-photo/<memberId>.webp`를 함께 첨부한다.

### 1. ST-A · 쥬멩이(`ju010228`) · "주인공병 슛팅 중독자"

**파일명**: `ju010228-position-a.webp`

```
Using the attached reference photo for the character's face and hair
(this must clearly be the same person — keep their facial features and
hairstyle recognizable), draw them as a cute 2D sticker-style SD
(super-deformed) football trading-card character, chibi proportions
(2-3 head-tall), thick clean deep-teal (#0b3d36) outline, soft cel
shading, warm top-left highlight — same polished sticker style as a
football rules-quiz illustration.

The card itself is a rounded-rectangle badge shape (not a plain
rectangle photo): rounded corners, and a thick outline in coral-orange (#ff7a4d) running just inside the edge — a plain, complete rounded-rectangle silhouette with nothing poking out above the top edge or at the corners (no pennant tab, no banner, no circular badges of any kind). Background inside the card is a soft radial gradient from
#ff7a4d at the top fading to white at the bottom, with a few small
softly-blurred soccer-ball silhouettes scattered at low opacity for
texture. No text, no letters, no numbers, no logos, no watermark
anywhere in the image. Extend the character, ball/icon, and background gradient further down so only the bottom ~8% of the card is left as a clean, minimal white/transparent gradient strip (just enough space for a short title to sit on later on the website) — do not leave a large empty gap at the bottom. Entire canvas outside the card's own plain rounded-rectangle silhouette must be fully transparent (alpha 0).

The character wears the standard 잔디동 kit (white jersey with
mint-green #00e9ae trim, small blank crest, mint shorts). Dynamic
mid-shot pose: leaning back slightly right after unleashing a powerful
shot, one leg still following through in the air, both fists clenched
at chest height, eyes blazing with excited determination, a small
glowing spotlight halo bursting behind their head like a movie hero's
entrance — visually selling "main-character syndrome, always going for
the shot." A faint golden light-trail arcs away from their foot toward
the edge of frame. Warm, triumphant lighting.

Portrait orientation, 1060x1484, PNG with alpha channel, high detail.
```

### 2. ST-B · 쥬멩이(`ju010228`) · "줏어먹기 연금술사"

**파일명**: `ju010228-position-b.webp`

```
Using the attached reference photo for the character's face and hair
(this must clearly be the same person — keep their facial features and
hairstyle recognizable), draw them as a cute 2D sticker-style SD
(super-deformed) football trading-card character, chibi proportions
(2-3 head-tall), thick clean deep-teal (#0b3d36) outline, soft cel
shading, warm top-left highlight — same polished sticker style as a
football rules-quiz illustration.

The card itself is a rounded-rectangle badge shape (not a plain
rectangle photo): rounded corners, and a thick outline in coral-orange (#ff7a4d) running just inside the edge — a plain, complete rounded-rectangle silhouette with nothing poking out above the top edge or at the corners (no pennant tab, no banner, no circular badges of any kind). Background inside the card is a soft radial gradient from
#ff7a4d at the top fading to white at the bottom, with a few small
softly-blurred soccer-ball silhouettes scattered at low opacity for
texture. No text, no letters, no numbers, no logos, no watermark
anywhere in the image. Extend the character, ball/icon, and background gradient further down so only the bottom ~8% of the card is left as a clean, minimal white/transparent gradient strip (just enough space for a short title to sit on later on the website) — do not leave a large empty gap at the bottom. Entire canvas outside the card's own plain rounded-rectangle silhouette must be fully transparent (alpha 0).

The character wears the standard 잔디동 kit (white jersey with
mint-green #00e9ae trim, small blank crest, mint shorts). Captured
mid-tap-in: leaning forward with one foot lightly poking a ball that's
already glowing gold as if turning to treasure, a mischievous satisfied
smirk, one eyebrow raised like they know exactly what they're doing,
small sparkling alchemy-style motes drifting around their foot.
Relaxed, unbothered body language — clearly didn't do much work to get
here, but got the goal anyway. Warm golden accent lighting.

Portrait orientation, 1060x1484, PNG with alpha channel, high detail.
```

### 3. CDM-A · 문모모(`doormomo`) · "메모장 가득 채우는 전술 덕후"

**파일명**: `doormomo-position-a.webp`

```
Using the attached reference photo for the character's face and hair
(this must clearly be the same person — keep their facial features and
hairstyle recognizable), draw them as a cute 2D sticker-style SD
(super-deformed) football trading-card character, chibi proportions
(2-3 head-tall), thick clean deep-teal (#0b3d36) outline, soft cel
shading, warm top-left highlight — same polished sticker style as a
football rules-quiz illustration.

The card itself is a rounded-rectangle badge shape (not a plain
rectangle photo): rounded corners, and a thick outline in violet (#8a5cff) running just inside the edge — a plain, complete rounded-rectangle silhouette with nothing poking out above the top edge or at the corners (no pennant tab, no banner, no circular badges of any kind). Background inside the card is a soft radial gradient from
#8a5cff at the top fading to white at the bottom, with a few small
softly-blurred soccer-ball silhouettes scattered at low opacity for
texture. No text, no letters, no numbers, no logos, no watermark
anywhere in the image. Extend the character, ball/icon, and background gradient further down so only the bottom ~8% of the card is left as a clean, minimal white/transparent gradient strip (just enough space for a short title to sit on later on the website) — do not leave a large empty gap at the bottom. Entire canvas outside the card's own plain rounded-rectangle silhouette must be fully transparent (alpha 0).

The character wears the standard 잔디동 kit (white jersey with
mint-green #00e9ae trim, small blank crest, mint shorts). Standing
calmly and holding a small open notebook covered edge-to-edge in tiny
scribbled diagrams, arrows and dots (all illegible scribble marks, not
readable text), a pencil tucked behind one ear, studying the notebook
with a focused, slightly nerdy squint. A faint holographic mini-map of
a soccer pitch glows softly just above the notebook page. Calm,
analytical expression, cool violet-tinted lighting.

Portrait orientation, 1060x1484, PNG with alpha channel, high detail.
```

### 4. CDM-B · 문모모(`doormomo`) · "은근 승부욕 폭발하는 안정감 요원"

**파일명**: `doormomo-position-b.webp`

```
Using the attached reference photo for the character's face and hair
(this must clearly be the same person — keep their facial features and
hairstyle recognizable), draw them as a cute 2D sticker-style SD
(super-deformed) football trading-card character, chibi proportions
(2-3 head-tall), thick clean deep-teal (#0b3d36) outline, soft cel
shading, warm top-left highlight — same polished sticker style as a
football rules-quiz illustration.

The card itself is a rounded-rectangle badge shape (not a plain
rectangle photo): rounded corners, and a thick outline in violet (#8a5cff) running just inside the edge — a plain, complete rounded-rectangle silhouette with nothing poking out above the top edge or at the corners (no pennant tab, no banner, no circular badges of any kind). Background inside the card is a soft radial gradient from
#8a5cff at the top fading to white at the bottom, with a few small
softly-blurred soccer-ball silhouettes scattered at low opacity for
texture. No text, no letters, no numbers, no logos, no watermark
anywhere in the image. Extend the character, ball/icon, and background gradient further down so only the bottom ~8% of the card is left as a clean, minimal white/transparent gradient strip (just enough space for a short title to sit on later on the website) — do not leave a large empty gap at the bottom. Entire canvas outside the card's own plain rounded-rectangle silhouette must be fully transparent (alpha 0).

The character wears the standard 잔디동 kit (white jersey with
mint-green #00e9ae trim, small blank crest, mint shorts). Standing in a
deliberately relaxed, arms-crossed pose with a calm closed-eye smile —
but with a single visible small tension-vein mark near their temple and
one eyebrow twitching, hinting at hidden intense competitiveness
bubbling just under the calm surface. A tiny clenched fist half-hidden
behind their back. Playful contrast between outward calm and inner
fire, soft violet rim lighting.

Portrait orientation, 1060x1484, PNG with alpha channel, high detail.
```

### 5. GK-A · 재닌(`janine95kim`) · "실점 제로 집착 완벽주의자"

**파일명**: `janine95kim-position-a.webp`

```
Using the attached reference photo for the character's face and hair
(this must clearly be the same person — keep their facial features and
hairstyle recognizable), draw them as a cute 2D sticker-style SD
(super-deformed) football trading-card character, chibi proportions
(2-3 head-tall), thick clean deep-teal (#0b3d36) outline, soft cel
shading, warm top-left highlight — same polished sticker style as a
football rules-quiz illustration.

The card itself is a rounded-rectangle badge shape (not a plain
rectangle photo): rounded corners, and a thick outline in golden-yellow (#ffd44f) running just inside the edge — a plain, complete rounded-rectangle silhouette with nothing poking out above the top edge or at the corners (no pennant tab, no banner, no circular badges of any kind). Background inside the card is a soft radial gradient from
#ffd44f at the top fading to white at the bottom, with a few small
softly-blurred soccer-ball silhouettes scattered at low opacity for
texture. No text, no letters, no numbers, no logos, no watermark
anywhere in the image. Extend the character, ball/icon, and background gradient further down so only the bottom ~8% of the card is left as a clean, minimal white/transparent gradient strip (just enough space for a short title to sit on later on the website) — do not leave a large empty gap at the bottom. Entire canvas outside the card's own plain rounded-rectangle silhouette must be fully transparent (alpha 0).

The character wears a goalkeeper kit variant of the 잔디동 colors
(long-sleeve jersey in mint-green #00e9ae with white trim, padded
gloves). Standing perfectly centered on the goal line in a sharp,
precise ready stance, both arms slightly spread, a laser-focused
unblinking stare directly at the viewer, a faint glowing golden outline
tracing the exact shape of a goal frame behind them like a protected
zone. Extremely composed, zero-tolerance expression. Cool
golden-yellow rim lighting.

Portrait orientation, 1060x1484, PNG with alpha channel, high detail.
```

### 6. GK-B · 재닌(`janine95kim`) · "선방하고 혼자 신난 리액션 부자"

**파일명**: `janine95kim-position-b.webp`

```
Using the attached reference photo for the character's face and hair
(this must clearly be the same person — keep their facial features and
hairstyle recognizable), draw them as a cute 2D sticker-style SD
(super-deformed) football trading-card character, chibi proportions
(2-3 head-tall), thick clean deep-teal (#0b3d36) outline, soft cel
shading, warm top-left highlight — same polished sticker style as a
football rules-quiz illustration.

The card itself is a rounded-rectangle badge shape (not a plain
rectangle photo): rounded corners, and a thick outline in golden-yellow (#ffd44f) running just inside the edge — a plain, complete rounded-rectangle silhouette with nothing poking out above the top edge or at the corners (no pennant tab, no banner, no circular badges of any kind). Background inside the card is a soft radial gradient from
#ffd44f at the top fading to white at the bottom, with a few small
softly-blurred soccer-ball silhouettes scattered at low opacity for
texture. No text, no letters, no numbers, no logos, no watermark
anywhere in the image. Extend the character, ball/icon, and background gradient further down so only the bottom ~8% of the card is left as a clean, minimal white/transparent gradient strip (just enough space for a short title to sit on later on the website) — do not leave a large empty gap at the bottom. Entire canvas outside the card's own plain rounded-rectangle silhouette must be fully transparent (alpha 0).

The character wears a goalkeeper kit variant of the 잔디동 colors
(long-sleeve jersey in mint-green #00e9ae with white trim, padded
gloves). Captured just after a diving save: still half-sprawled on the
ground propped up on one elbow, one glove triumphantly raised, mouth
wide open mid-shout with a huge excited grin, small comic motion lines
and a couple of sparkle bursts around the raised glove. Big, unfiltered
joy. Warm golden highlight bursts.

Portrait orientation, 1060x1484, PNG with alpha channel, high detail.
```

### 7. CM-A · 뽀린걸(`bboringirl`) · "티 안 나게 다 하는 그림자 일꾼"

**파일명**: `bboringirl-position-a.webp`

```
Using the attached reference photo for the character's face and hair
(this must clearly be the same person — keep their facial features and
hairstyle recognizable), draw them as a cute 2D sticker-style SD
(super-deformed) football trading-card character, chibi proportions
(2-3 head-tall), thick clean deep-teal (#0b3d36) outline, soft cel
shading, warm top-left highlight — same polished sticker style as a
football rules-quiz illustration.

The card itself is a rounded-rectangle badge shape (not a plain
rectangle photo): rounded corners, and a thick outline in sky-blue (#4a90ff) running just inside the edge — a plain, complete rounded-rectangle silhouette with nothing poking out above the top edge or at the corners (no pennant tab, no banner, no circular badges of any kind). Background inside the card is a soft radial gradient from
#4a90ff at the top fading to white at the bottom, with a few small
softly-blurred soccer-ball silhouettes scattered at low opacity for
texture. No text, no letters, no numbers, no logos, no watermark
anywhere in the image. Extend the character, ball/icon, and background gradient further down so only the bottom ~8% of the card is left as a clean, minimal white/transparent gradient strip (just enough space for a short title to sit on later on the website) — do not leave a large empty gap at the bottom. Entire canvas outside the card's own plain rounded-rectangle silhouette must be fully transparent (alpha 0).

The character wears the standard 잔디동 kit (white jersey with
mint-green #00e9ae trim, small blank crest, mint shorts). Mid-stride
jogging steadily with a calm, quietly determined expression, faint
motion-blur streaks trailing behind both legs showing a long distance
already covered, a small subtle stopwatch-shaped light glowing faintly
near their wrist. Understated, hardworking energy — not flashy, just
constantly present. Soft sky-blue rim lighting.

Portrait orientation, 1060x1484, PNG with alpha channel, high detail.
```

### 8. CM-B · 한결(`kaksjak0730`) · "패스 각도만 파는 각도기 장인"

**파일명**: `kaksjak0730-position-b.webp`

```
Using the attached reference photo for the character's face and hair
(this must clearly be the same person — keep their facial features and
hairstyle recognizable), draw them as a cute 2D sticker-style SD
(super-deformed) football trading-card character, chibi proportions
(2-3 head-tall), thick clean deep-teal (#0b3d36) outline, soft cel
shading, warm top-left highlight — same polished sticker style as a
football rules-quiz illustration.

The card itself is a rounded-rectangle badge shape (not a plain
rectangle photo): rounded corners, and a thick outline in sky-blue (#4a90ff) running just inside the edge — a plain, complete rounded-rectangle silhouette with nothing poking out above the top edge or at the corners (no pennant tab, no banner, no circular badges of any kind). Background inside the card is a soft radial gradient from
#4a90ff at the top fading to white at the bottom, with a few small
softly-blurred soccer-ball silhouettes scattered at low opacity for
texture. No text, no letters, no numbers, no logos, no watermark
anywhere in the image. Extend the character, ball/icon, and background gradient further down so only the bottom ~8% of the card is left as a clean, minimal white/transparent gradient strip (just enough space for a short title to sit on later on the website) — do not leave a large empty gap at the bottom. Entire canvas outside the card's own plain rounded-rectangle silhouette must be fully transparent (alpha 0).

The character wears the standard 잔디동 kit (white jersey with
mint-green #00e9ae trim, small blank crest, mint shorts). Standing with
one hand raised, fingers forming a small measuring/framing gesture as
if lining up an angle, one eye slightly closed in concentration, thin
glowing sky-blue geometry lines (a couple of straight lines and one
arc, plain shapes only) floating in the air in front of them like a
targeting overlay. Calm, precise, slightly nerdy focus. Cool sky-blue
rim lighting.

Portrait orientation, 1060x1484, PNG with alpha channel, high detail.
```

### 9. CB-A · 핑구(`sjh4018`) · "헤더면 헤더, 몸이면 몸 다 던지는 맷집 수비수"

**파일명**: `sjh4018-position-a.webp`

```
Using the attached reference photo for the character's face and hair
(this must clearly be the same person — keep their facial features and
hairstyle recognizable), draw them as a cute 2D sticker-style SD
(super-deformed) football trading-card character, chibi proportions
(2-3 head-tall), thick clean deep-teal (#0b3d36) outline, soft cel
shading, warm top-left highlight — same polished sticker style as a
football rules-quiz illustration.

The card itself is a rounded-rectangle badge shape (not a plain
rectangle photo): rounded corners, and a thick outline in steel
blue-grey (#6b83a3) running just inside the edge — a plain, complete
rounded-rectangle silhouette with nothing poking out above the top
edge or at the corners (no pennant tab, no banner, no circular badges
of any kind). Background inside the card is a soft radial
gradient from #6b83a3 at the top fading to white at the bottom, with a
few small softly-blurred soccer-ball silhouettes scattered at low
opacity for texture. No text, no letters, no numbers, no logos, no
watermark anywhere in the image. Extend the character and background
gradient further down so only the bottom ~8% of the card is left as a
clean, minimal white/transparent gradient strip (just enough space for
a short title to sit on later on the website) — do not leave a large
empty gap at the bottom. Entire canvas outside the card's own plain
rounded-rectangle silhouette must be fully transparent (alpha 0).

The character wears the standard 잔디동 kit (white jersey with
mint-green #00e9ae trim, small blank crest, mint shorts). Captured
mid-air in a full-commitment diving header, body angled horizontally,
both arms out for balance, face scrunched with determined effort, a
small comic impact-star burst drawn right where their forehead meets an
implied ball just off-frame. Tough, unshakeable energy. Cool
steel-blue rim lighting.

Portrait orientation, 1060x1484, PNG with alpha channel, high detail.
```

### 10. CB-B · 해파린(`haepalin`) · "그림자처럼 따라붙는 찰거머리 수비수"

**파일명**: `haepalin-position-b.webp`

```
Using the attached reference photo for the character's face and hair
(this must clearly be the same person — keep their facial features and
hairstyle recognizable), draw them as a cute 2D sticker-style SD
(super-deformed) football trading-card character, chibi proportions
(2-3 head-tall), thick clean deep-teal (#0b3d36) outline, soft cel
shading, warm top-left highlight — same polished sticker style as a
football rules-quiz illustration.

The card itself is a rounded-rectangle badge shape (not a plain
rectangle photo): rounded corners, and a thick outline in steel
blue-grey (#6b83a3) running just inside the edge — a plain, complete
rounded-rectangle silhouette with nothing poking out above the top
edge or at the corners (no pennant tab, no banner, no circular badges
of any kind). Background inside the card is a soft radial
gradient from #6b83a3 at the top fading to white at the bottom, with a
few small softly-blurred soccer-ball silhouettes scattered at low
opacity for texture. No text, no letters, no numbers, no logos, no
watermark anywhere in the image. Extend the character and background
gradient further down so only the bottom ~8% of the card is left as a
clean, minimal white/transparent gradient strip (just enough space for
a short title to sit on later on the website) — do not leave a large
empty gap at the bottom. Entire canvas outside the card's own plain
rounded-rectangle silhouette must be fully transparent (alpha 0).

The character wears the standard 잔디동 kit (white jersey with
mint-green #00e9ae trim, small blank crest, mint shorts). In a low
defensive stance leaning slightly forward, arms loose and ready, eyes
narrowed and fixed intently just past the viewer as if tracking someone
closely, a single soft dark shadow-shape stretched out beside them
shaped like a smaller trailing silhouette glued to their side. Quiet,
relentless, unblinking focus. Cool steel-blue rim lighting.

Portrait orientation, 1060x1484, PNG with alpha channel, high detail.
```

### 11. FB-A · 빙밍(`tleod1818`) · "체력 방전 모르는 무한 배터리"

**파일명**: `tleod1818-position-a.webp`

```
Using the attached reference photo for the character's face and hair
(this must clearly be the same person — keep their facial features and
hairstyle recognizable), draw them as a cute 2D sticker-style SD
(super-deformed) football trading-card character, chibi proportions
(2-3 head-tall), thick clean deep-teal (#0b3d36) outline, soft cel
shading, warm top-left highlight — same polished sticker style as a
football rules-quiz illustration.

The card itself is a rounded-rectangle badge shape (not a plain
rectangle photo): rounded corners, and a thick outline in emerald teal (#2ed9a8)
running just inside the edge — a plain, complete rounded-rectangle
silhouette with nothing poking out above the top edge or at the
corners (no pennant tab, no banner, no circular badges of any kind). Background inside the card is a soft radial gradient from
#2ed9a8 at the top fading to white at the bottom, with a few small
softly-blurred soccer-ball silhouettes scattered at low opacity for
texture. No text, no letters, no numbers, no logos, no watermark
anywhere in the image. Extend the character, ball/icon, and background gradient further down so only the bottom ~8% of the card is left as a clean, minimal white/transparent gradient strip (just enough space for a short title to sit on later on the website) — do not leave a large empty gap at the bottom. Entire canvas outside the card's own plain rounded-rectangle silhouette must be fully transparent (alpha 0).

The character wears the standard 잔디동 kit (white jersey with
mint-green #00e9ae trim, small blank crest, mint shorts). Sprinting
energetically along an invisible touchline, big open cheerful grin, a
small glowing battery icon with a full charge bar floating playfully
above their head (plain icon shape, no text), faint speed-motion lines
trailing behind both legs. Bright, tireless, endlessly energetic mood.
Bright emerald-teal rim lighting.

Portrait orientation, 1060x1484, PNG with alpha channel, high detail.
```

### 12. FB-B · 리냐(`lina0108`) · "타이밍 하나로 승부 보는 감각파 크로스러"

**파일명**: `lina0108-position-b.webp`

```
Using the attached reference photo for the character's face and hair
(this must clearly be the same person — keep their facial features and
hairstyle recognizable), draw them as a cute 2D sticker-style SD
(super-deformed) football trading-card character, chibi proportions
(2-3 head-tall), thick clean deep-teal (#0b3d36) outline, soft cel
shading, warm top-left highlight — same polished sticker style as a
football rules-quiz illustration.

The card itself is a rounded-rectangle badge shape (not a plain
rectangle photo): rounded corners, and a thick outline in emerald teal (#2ed9a8)
running just inside the edge — a plain, complete rounded-rectangle
silhouette with nothing poking out above the top edge or at the
corners (no pennant tab, no banner, no circular badges of any kind). Background inside the card is a soft radial gradient from
#2ed9a8 at the top fading to white at the bottom, with a few small
softly-blurred soccer-ball silhouettes scattered at low opacity for
texture. No text, no letters, no numbers, no logos, no watermark
anywhere in the image. Extend the character, ball/icon, and background gradient further down so only the bottom ~8% of the card is left as a clean, minimal white/transparent gradient strip (just enough space for a short title to sit on later on the website) — do not leave a large empty gap at the bottom. Entire canvas outside the card's own plain rounded-rectangle silhouette must be fully transparent (alpha 0).

The character wears the standard 잔디동 kit (white jersey with
mint-green #00e9ae trim, small blank crest, mint shorts). Captured
mid-motion just after whipping in a cross, one leg still following
through in the air, eyes closed with a serene confident half-smile as
if trusting feel over sight, a thin glowing teal ribbon trail arcing
away from their foot. Effortless, intuitive, dreamy confidence. Bright
emerald-teal rim lighting.

Portrait orientation, 1060x1484, PNG with alpha channel, high detail.
```

### 13. WF-A · 다시바(`tdnlamuron`) · "생각보다 발이 먼저 나가는 스피드광"

**파일명**: `tdnlamuron-position-a.webp`

```
Using the attached reference photo for the character's face and hair
(this must clearly be the same person — keep their facial features and
hairstyle recognizable), draw them as a cute 2D sticker-style SD
(super-deformed) football trading-card character, chibi proportions
(2-3 head-tall), thick clean deep-teal (#0b3d36) outline, soft cel
shading, warm top-left highlight — same polished sticker style as a
football rules-quiz illustration.

The card itself is a rounded-rectangle badge shape (not a plain
rectangle photo): rounded corners, and a thick outline in lime-yellow (#c6e64a) running just inside the edge — a plain, complete rounded-rectangle silhouette with nothing poking out above the top edge or at the corners (no pennant tab, no banner, no circular badges of any kind). Background inside the card is a soft radial gradient from
#c6e64a at the top fading to white at the bottom, with a few small
softly-blurred soccer-ball silhouettes scattered at low opacity for
texture. No text, no letters, no numbers, no logos, no watermark
anywhere in the image. Extend the character, ball/icon, and background gradient further down so only the bottom ~8% of the card is left as a clean, minimal white/transparent gradient strip (just enough space for a short title to sit on later on the website) — do not leave a large empty gap at the bottom. Entire canvas outside the card's own plain rounded-rectangle silhouette must be fully transparent (alpha 0).

The character wears the standard 잔디동 kit (white jersey with
mint-green #00e9ae trim, small blank crest, mint shorts). Leaning
sharply forward in an explosive sprint start, one leg still driving off
the ground, eyes wide with pure excited urgency, strong lime-yellow
speed-streak lines blurring behind their whole body. Raw, impulsive,
go-first-think-later energy. Bright lime-yellow rim lighting.

Portrait orientation, 1060x1484, PNG with alpha channel, high detail.
```

### 14. WF-B · 하치(`hachi97`) · "혼자 신난 프리스타일 드리블러"

**파일명**: `hachi97-position-b.webp`

```
Using the attached reference photo for the character's face and hair
(this must clearly be the same person — keep their facial features and
hairstyle recognizable), draw them as a cute 2D sticker-style SD
(super-deformed) football trading-card character, chibi proportions
(2-3 head-tall), thick clean deep-teal (#0b3d36) outline, soft cel
shading, warm top-left highlight — same polished sticker style as a
football rules-quiz illustration.

The card itself is a rounded-rectangle badge shape (not a plain
rectangle photo): rounded corners, and a thick outline in lime-yellow (#c6e64a) running just inside the edge — a plain, complete rounded-rectangle silhouette with nothing poking out above the top edge or at the corners (no pennant tab, no banner, no circular badges of any kind). Background inside the card is a soft radial gradient from
#c6e64a at the top fading to white at the bottom, with a few small
softly-blurred soccer-ball silhouettes scattered at low opacity for
texture. No text, no letters, no numbers, no logos, no watermark
anywhere in the image. Extend the character, ball/icon, and background gradient further down so only the bottom ~8% of the card is left as a clean, minimal white/transparent gradient strip (just enough space for a short title to sit on later on the website) — do not leave a large empty gap at the bottom. Entire canvas outside the card's own plain rounded-rectangle silhouette must be fully transparent (alpha 0).

The character wears the standard 잔디동 kit (white jersey with
mint-green #00e9ae trim, small blank crest, mint shorts). Mid dribbling
flourish with the ball balanced momentarily on the top of one foot, one
arm flung out theatrically, big carefree delighted grin with eyes
closed, a couple of small glowing musical-note-shaped sparkles floating
around them (plain glowing shapes, not readable notation) to suggest
playful improvisation. Loose, joyful, unpredictable energy. Bright
lime-yellow rim lighting.

Portrait orientation, 1060x1484, PNG with alpha channel, high detail.
```

## 4. UI 공용 에셋

저장 위치는 결과 카드와 동일하게 `src/web/assets/position-test/`.

### 카드 뒷면 (공용, 1장)

**파일명**: `position-test-card-back.webp`

```
A cute 2D sticker-style SD football trading-card back design, portrait
orientation. The card itself is a rounded-rectangle badge shape (not a
plain rectangle): rounded corners, and a thick clean deep-teal
(#0b3d36) outline running just inside the edge, with mint-green
(#00e9ae) and warm gold (#ffd44f) as accent colors in the background
icon below — a plain, complete rounded-rectangle silhouette with
nothing poking out above the top edge or at the corners (no pennant
tab, no banner, no circular badges of any kind). Background inside
the card is a soft diagonal gradient of mint-green and white, with a
single large friendly running-shoe-plus-soccer-ball icon centered (a
simple flat sticker icon, not photorealistic), and a few small blurred
soccer-ball silhouettes scattered at low opacity around it for texture.
No text, no letters, no numbers, no logos, no watermark. Entire canvas
outside the card's own plain rounded-rectangle silhouette must be fully
transparent (alpha 0). PNG with alpha channel, high detail, portrait
orientation, 1060x1484.
```

### 플로팅 버튼 아이콘

**파일명**: `position-test-button-icon.webp`

```
A small flat 2D sticker-style icon, square canvas, showing a single
friendly running-shoe silhouette mid-stride with a small soccer ball
just in front of it, thick clean deep-teal (#0b3d36) outline, mint-green
(#00e9ae) and warm gold (#ffd44f) fill colors, soft cel shading. No
text, no letters, no numbers, no logos, no watermark, no background
(fully transparent). PNG with alpha channel, 512x512, high detail.
```

### 팝업 배경

**파일명**: `position-test-popup-backdrop.webp`

```
An abstract, softly blurred football-pitch backdrop illustration for a
fullscreen app popup, landscape orientation. A wide top-down view of a
lush green pitch with faint white pitch-line markings, a warm
golden-hour sky gradient blending into a deep teal-navy at the top
corners, a soft vignette darkening toward all four edges so foreground
UI stays readable, gentle floating dust/light-mote particles scattered
throughout. No people, no characters, no text, no logos, no scoreboard,
no stands or crowd. Calm, inviting, slightly dreamy mood. High detail,
PNG, 1920x1080.
```

### 결과 리빌 스파클 버스트 (선택)

**파일명**: `position-test-reveal-burst.webp`

```
A small 2D sticker-style radial burst graphic for a card-reveal
animation: a cluster of simple rounded sparkle/star shapes and a few
small soccer-ball silhouettes exploding outward from the center, warm
gold (#ffd44f) and mint-green (#00e9ae) color palette, soft glow, clean
flat shapes (no gradients other than the glow itself). No text, no
letters, no numbers, no logos. Centered on a fully transparent
background. PNG with alpha channel, square canvas, 800x800, high
detail.
```

> 에셋이 없어도 사이트는 정상 동작한다 — 카드 뒷면은 이모지/아이콘 플레이스홀더로, 문항·결과 일러스트는 `BookOpenCheck` 아이콘 등 CSS 폴백으로 대체된다(`positionTestAssets.ts` 참고).

## 5. 효과음 목록

`docs/minigame-grass-merge.md`와 동일한 표 형식. 재생은 기존 `src/web/sfxAudio.ts`의 `playSfx(url, volume, onCreate?)`를 그대로 쓴다. 파일이 없으면 `playSfx`가 조용히 무시하므로 급하지 않게 하나씩 채워 넣으면 된다. **기존에 다른 기능이 쓰고 있는 파일명(`victory.mp3`, `card-flip.mp3`, `card-reveal.mp3` 등)은 재사용하지 않고, 이 기능 전용 `position-test-*` 접두사 파일명을 새로 만든다.**

| 파일명 | 저장 위치 | 용도 | 검색 키워드 (한글 / 영어) |
| --- | --- | --- | --- |
| `position-test-open.mp3` | `public/sfxes/` | 팝업 열림 (0.3~0.5초) | `가볍고 경쾌한 팝업 오픈 효과음`, `light cheerful UI popup open sound effect` |
| `position-test-select.mp3` | `public/sfxes/` | 문항 선택지 클릭 (0.15~0.25초) | `또각 가벼운 선택 클릭음`, `soft tap select click game sound effect` |
| `position-test-next.mp3` | `public/sfxes/` | 다음 문항으로 전환 (0.2~0.35초) | `휙 넘어가는 전환음`, `quick whoosh transition swipe sound effect` |
| `position-test-card-open.mp3` | `public/sfxes/` | 결과 카드 "공개하기" 버튼 클릭 순간 (0.3~0.5초) | `기대감 도는 카드 오픈 스팅어`, `anticipation card flip stinger sound effect` |
| `position-test-reveal-impact.mp3` | `public/sfxes/` | 카드가 완전히 뒤집히는 임팩트 순간 (0.4~0.6초) | `반짝이는 카드 공개 임팩트음`, `sparkly magical reveal impact chime` |
| `position-test-complete.mp3` | `public/sfxes/` | 결과 화면 등장 팡파레 (0.8~1.2초) | `짧고 경쾌한 완료 팡파레`, `short cheerful completion fanfare jingle` |

## 6. 데이터 요약 참고

구현 코드(`positionTestData.ts`, `positionTestResults.ts`)와 정확히 맞춰야 하는 매핑은 아래와 같다(계획 문서 `포지션 × 테마 × 멤버 매핑` 표와 동일):

| 포지션 | 테마 A | 테마 B |
|---|---|---|
| ST (쥬멩이 `ju010228`) | 주인공병 슛팅 중독자 | 줏어먹기 연금술사 |
| CDM (문모모 `doormomo`) | 메모장 가득 채우는 전술 덕후 | 은근 승부욕 폭발하는 안정감 요원 |
| GK (재닌 `janine95kim`) | 실점 제로 집착 완벽주의자 | 선방하고 혼자 신난 리액션 부자 |
| CM | 뽀린걸(`bboringirl`) — 티 안 나게 다 하는 그림자 일꾼 | 한결(`kaksjak0730`) — 패스 각도만 파는 각도기 장인 |
| CB | 핑구(`sjh4018`) — 헤더면 헤더, 몸이면 몸 다 던지는 맷집 수비수 | 해파린(`haepalin`) — 그림자처럼 따라붙는 찰거머리 수비수 |
| FB | 빙밍(`tleod1818`) — 체력 방전 모르는 무한 배터리 | 리냐(`lina0108`) — 타이밍 하나로 승부 보는 감각파 크로스러 |
| WF | 다시바(`tdnlamuron`) — 생각보다 발이 먼저 나가는 스피드광 | 하치(`hachi97`) — 혼자 신난 프리스타일 드리블러 |
