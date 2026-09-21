# 축구 상식 퀴즈 — 에셋 · 이미지 생성 요청서

`축구 상식 퀴즈` 미니게임의 11개 문항 일러스트, 결과 카드, UI 장식, 오디오를 준비하는 실행 문서다. 코드에는 에셋이 없어도 읽기 좋은 CSS 폴백이 들어 있으므로, 이 문서의 파일을 준비한 뒤 같은 이름으로 변환·배치하면 자동으로 고급 아트가 연결된다.

## 1. 공통 규격 · 생성 흐름

- **스타일**: 2D 스티커풍 SD 캐릭터. 둥근 비율, 굵고 깨끗한 짙은 청록 외곽선, 부드러운 셀 셰이딩, 좌상단 하이라이트, 귀엽고 경쾌한 표정. 잔디동 유니폼은 흰색 바탕에 민트 `#00e9ae` 포인트와 작은 글자 없는 새싹 방패 크레스트, 금색 `#ffd44f` 포인트를 쓴다.
- **문항 그림**: 원본 `1280×720`, 가로형, 불투명 PNG. 화면 안에 읽을 수 있는 문장·숫자·로고·워터마크를 넣지 않는다. 문제와 선택지는 코드가 얹는다.
- **저장 경로**: 원본은 `tmp/minigame-src/football-rules-quiz/`, 변환 결과는 `public/football-rules-quiz-*.webp`다. 원본이 모두 준비되면 `pnpm convert:minigame-art -- football-rules-quiz`를 실행한다.
- **레퍼런스 표기**: 메인 캐릭터는 이름으로 표시한다. 우왁굳 외 보조 인물은 `A`, `B`처럼만 표시한다. 생성할 때 해당 슬롯에 적절한 레퍼런스 이미지를 첨부한다.
- **스레드 규칙**: Q1은 새 스레드에서 만들고 최종 선택본을 **스타일 앵커 S**로 확정한다. Q2–Q11은 각각 새 스레드에서 `S + 해당 메인 캐릭터`만 먼저 첨부한다. 보조 인물이 필요할 때만 `A` 또는 `B`를 추가한다. 서로 다른 선수의 얼굴/헤어가 섞이지 않도록 문항끼리 같은 스레드를 이어 쓰지 않는다.

### 검수 공통 체크

1. 메인 캐릭터가 장면에서 가장 크고 즉시 알아볼 수 있는가.
2. 유니폼·얼굴·헤어는 메인 레퍼런스를 유지하면서도 전체 화풍은 SD 스티커풍으로 통일되는가.
3. 공, 골대, 심판, 카드처럼 규칙을 설명하는 핵심 물체가 모바일 폭에서도 읽히는가.
4. 텍스트·숫자·워터마크가 없고, 화면의 위아래 10%에는 UI가 덮여도 되는 여백이 있는가.
5. 실패 시 같은 스레드에서 `Keep the same character identity and composition, but make the focal rule object clearer and remove all text, letters, numbers, logos, and watermarks.`만 후속 요청한다.

## 2. 문항 일러스트 11장

### Q1 — 코너킥 직접 자책골

- **원본 → 최종**: `q01-corner-own-goal.png` → `football-rules-quiz-q01.webp`
- **캔버스**: 1280×720
- **스레드**: 새 스레드. 이 결과를 스타일 앵커 `S`로 저장.
- **레퍼런스**: 메인 캐릭터 `문모모`

```text
Use case: illustration-story
Asset type: football rules quiz question illustration
Input images: Main character reference: 문모모
Primary request: Draw the exact main character from the attached reference as the single clear hero of a football rules scene. The character takes a corner kick, but a dramatic gust curls the untouched ball in a long arc all the way into their own empty goal. The character has just finished the kick and reacts with wide-eyed comic surprise; the ball and the own goal are both very clear.
Scene/backdrop: a bright friendly football pitch corner, mint-and-white team details, one empty goal in the distance, a few curved wind ribbons only.
Style/medium: polished 2D sticker-like super-deformed Korean game illustration; chibi proportions, thick clean deep-teal outline, soft cel shading, top-left highlights, rounded friendly forms.
Composition/framing: wide 16:9, main character large in the left foreground, the curved ball flight leading to the goal on the right, generous calm space at top and bottom for UI.
Color palette: white kit, mint #00e9ae accents, emerald grass, warm gold #ffd44f highlights.
Constraints: no other people, no readable text, no letters, no numbers, no logos, no watermark, no scoreboard.
```

### Q2 — 꼼수 백패스

- **원본 → 최종**: `q02-trick-backpass.png` → `football-rules-quiz-q02.webp`
- **캔버스**: 1280×720
- **스레드**: 새 스레드, `S`와 메인 캐릭터를 첨부.
- **레퍼런스**: 메인 캐릭터 `핑구`, 보조 인물 `A`

```text
Use case: illustration-story
Asset type: football rules quiz question illustration
Input images: Style anchor S; Main character reference: 핑구; Reference A: goalkeeper only if needed
Primary request: Draw the exact main character from the attached reference as the single clear hero doing a cheeky football back-pass trick: they flick a rolling ball upward with one foot and head it backward toward their goalkeeper. Make the lifted ball, the header, and the suspiciously clever expression unmistakable. A small distant goalkeeper may appear only as reference A, preparing to control the ball with a foot.
Scene/backdrop: clean training pitch, a faint goal behind the keeper, no crowd.
Style/medium: match style anchor S exactly: polished 2D sticker-like SD football game art, thick deep-teal outline, soft cel shading, rounded forms.
Composition/framing: wide 16:9; main character occupies the centre-left, ball arc reads clearly, keeper is small and secondary.
Color palette: white-and-mint 잔디동 kit, emerald grass, gold highlight accents.
Constraints: the main character must remain the only focal person; no text, letters, numbers, logos, watermark, referee card, or scoreboard.
```

### Q3 — 최소 7명

- **원본 → 최종**: `q03-seven-players.png` → `football-rules-quiz-q03.webp`
- **캔버스**: 1280×720
- **스레드**: 새 스레드, `S`와 메인 캐릭터를 첨부.
- **레퍼런스**: 메인 캐릭터 `한결___`

```text
Use case: illustration-story
Asset type: football rules quiz question illustration
Input images: Style anchor S; Main character reference: 한결___
Primary request: Draw the exact main character from the attached reference as the hero captain on a football pitch, holding up a simple tactical board with exactly seven blank player-dot icons. Six red cards are stuck dramatically into the grass behind the board, making the minimum-player rule visually understandable. The main character looks determined rather than sad.
Scene/backdrop: friendly stadium pitch at dusk with a very subtle empty-team atmosphere.
Style/medium: match style anchor S exactly: polished 2D sticker-like SD football game art, thick deep-teal outline, soft cel shading, rounded forms.
Composition/framing: wide 16:9, character and board dominate the middle, cards form a readable secondary arc.
Color palette: white-and-mint kit, emerald grass, restrained red cards, warm gold highlights.
Constraints: no other people, no readable text, no letters, no digits, no logos, no watermark, no scoreboard.
```

### Q4 — 주심 굴절 골

- **원본 → 최종**: `q04-referee-deflection.png` → `football-rules-quiz-q04.webp`
- **캔버스**: 1280×720
- **스레드**: 새 스레드, `S`와 메인 캐릭터를 첨부.
- **레퍼런스**: 메인 캐릭터 `쥬멩이`, 보조 인물 `A`

```text
Use case: illustration-story
Asset type: football rules quiz question illustration
Input images: Style anchor S; Main character reference: 쥬멩이; Reference A: referee only if needed
Primary request: Draw the exact main character from the attached reference as the hero striker after a powerful shot. The ball visibly ricochets off the small secondary referee figure A and changes direction toward goal, while the main character watches in astonishment. Use a clear comic impact star at the referee contact point without any written symbols.
Scene/backdrop: a clean football pitch with a distant goal, enough open space around the ball path.
Style/medium: match style anchor S exactly: polished 2D sticker-like SD football game art, thick deep-teal outline, soft cel shading, rounded forms.
Composition/framing: wide 16:9; striker is large at left-centre, ball path runs through the small referee to the right-side goal.
Color palette: white-and-mint kit, rich green grass, gold impact spark, restrained neutral referee kit.
Constraints: the referee is secondary and unidentifiable; no text, letters, numbers, logos, watermark, scoreboard, or handball gesture.
```

### Q5 — 스로인 직접 자책골

- **원본 → 최종**: `q05-throw-in-own-goal.png` → `football-rules-quiz-q05.webp`
- **캔버스**: 1280×720
- **스레드**: 새 스레드, `S`와 메인 캐릭터를 첨부.
- **레퍼런스**: 메인 캐릭터 `빙밍_`

```text
Use case: illustration-story
Asset type: football rules quiz question illustration
Input images: Style anchor S; Main character reference: 빙밍_
Primary request: Draw the exact main character from the attached reference performing a proper overhead throw-in from their own half, but the untouched ball rolls in a funny impossibly long line into their own empty goal. Show both hands having just released the ball and a baffled face; the untouched ball and own goal are clear.
Scene/backdrop: open football pitch with a clean sideline, an empty own goal in the distance.
Style/medium: match style anchor S exactly: polished 2D sticker-like SD football game art, thick deep-teal outline, soft cel shading, rounded forms.
Composition/framing: wide 16:9, main character at the left foreground, ball trajectory guides the eye toward the right goal.
Color palette: white-and-mint kit, emerald grass, warm gold highlights.
Constraints: no other people, no readable text, letters, numbers, logos, watermark, or scoreboard.
```

### Q6 — 신호등에서 온 카드 아이디어

- **원본 → 최종**: `q06-traffic-light-cards.png` → `football-rules-quiz-q06.webp`
- **캔버스**: 1280×720
- **스레드**: 새 스레드, `S`와 메인 캐릭터를 첨부.
- **레퍼런스**: 메인 캐릭터 `뽀린걸`

```text
Use case: illustration-story
Asset type: football rules quiz question illustration
Input images: Style anchor S; Main character reference: 뽀린걸
Primary request: Draw the exact main character from the attached reference as the hero referee-in-training, happily holding one bright yellow card and one bright red card while looking toward a simple glowing traffic light in the background. The visual connection between yellow caution and red stop must read instantly, but do not put words or symbols on the cards or light.
Scene/backdrop: charming evening street edge beside a small football practice ground, simple traffic light silhouette, no vehicles or people.
Style/medium: match style anchor S exactly: polished 2D sticker-like SD football game art, thick deep-teal outline, soft cel shading, rounded forms.
Composition/framing: wide 16:9, main character large in the foreground, traffic light as a clear secondary visual cue.
Color palette: white-and-mint 잔디동 kit with yellow, red, emerald, and warm gold accents.
Constraints: no text, letters, numbers, logos, watermark, readable road signs, or scoreboard.
```

### Q7 — 탭 페널티킥

- **원본 → 최종**: `q07-tap-penalty.png` → `football-rules-quiz-q07.webp`
- **캔버스**: 1280×720
- **스레드**: 새 스레드, `S`와 메인 캐릭터를 첨부.
- **레퍼런스**: 메인 캐릭터 `하치_HACHI`, 보조 인물 `A`

```text
Use case: illustration-story
Asset type: football rules quiz question illustration
Input images: Style anchor S; Main character reference: 하치_HACHI; Reference A: arriving teammate only if needed
Primary request: Draw the exact main character from the attached reference as the hero penalty kicker making a tiny clever forward sideways tap instead of shooting. Make the ball clearly move forward from the penalty spot toward a secondary teammate A who is arriving to shoot. The main character is playful and confident; the forward motion must be visually obvious.
Scene/backdrop: clean penalty area, simple goal in the far background, no crowd.
Style/medium: match style anchor S exactly: polished 2D sticker-like SD football game art, thick deep-teal outline, soft cel shading, rounded forms.
Composition/framing: wide 16:9, hero kicker foreground left, ball and forward arrow-like motion line through the middle, teammate secondary on the right.
Color palette: white-and-mint kit, emerald grass, warm gold highlights.
Constraints: no written arrows, no text, letters, numbers, logos, watermark, scoreboard, or visible goalkeeper.
```

### Q8 — 스로인과 오프사이드 예외

- **원본 → 최종**: `q08-throw-in-offside.png` → `football-rules-quiz-q08.webp`
- **캔버스**: 1280×720
- **스레드**: 새 스레드, `S`와 메인 캐릭터를 첨부.
- **레퍼런스**: 메인 캐릭터 `리냐_LINYA`, 보조 인물 `A`

```text
Use case: illustration-story
Asset type: football rules quiz question illustration
Input images: Style anchor S; Main character reference: 리냐_LINYA; Reference A: throw-in teammate only if needed
Primary request: Draw the exact main character from the attached reference as the hero receiver far upfield, joyfully catching a directly thrown-in football with plenty of open grass between them and the distant defenders. A small secondary teammate A has just taken the throw-in at the far sideline. Emphasize the direct throw-in connection and the hero's free, legal-feeling run without using any written offside marks.
Scene/backdrop: bright pitch with a sideline far left, faint distant defender silhouettes only, open green running lane.
Style/medium: match style anchor S exactly: polished 2D sticker-like SD football game art, thick deep-teal outline, soft cel shading, rounded forms.
Composition/framing: wide 16:9, receiver is the large right-side focal point, thrower is very small at left, ball trajectory is clear.
Color palette: white-and-mint kit, emerald grass, warm gold accent.
Constraints: no flags, text, letters, numbers, logos, watermark, scoreboard, or readable referee signals.
```

### Q9 — 피클스와 줄리메 컵

- **원본 → 최종**: `q09-pickles-trophy.png` → `football-rules-quiz-q09.webp`
- **캔버스**: 1280×720
- **스레드**: 새 스레드, `S`와 메인 캐릭터를 첨부.
- **레퍼런스**: 메인 캐릭터 `해파린~`, 보조 인물 `A` (개)

```text
Use case: historical-scene
Asset type: football rules quiz question illustration
Input images: Style anchor S; Main character reference: 해파린~; Reference A: small friendly dog only if needed
Primary request: Draw the exact main character from the attached reference as the hero on a cheerful neighbourhood walk, looking delighted as a small dog reference A discovers a classic old golden football trophy wrapped in plain newspaper under a hedge. The dog sniffing and the trophy discovery are the clear story, while the main character remains the biggest focal person.
Scene/backdrop: cosy 1960s-inspired London residential garden path, hedge, soft afternoon light, but no readable signs or period text.
Style/medium: match style anchor S exactly: polished 2D sticker-like SD football game art, thick deep-teal outline, soft cel shading, rounded forms.
Composition/framing: wide 16:9, main character large left-centre, dog and small trophy clear in the lower-right hedge area.
Color palette: white-and-mint team accent details, leafy emerald greens, antique gold trophy, warm cream light.
Constraints: no text, letters, numbers, logos, watermark, newspaper writing, scoreboard, or additional people.
```

### Q10 — 과거의 사각 골포스트

- **원본 → 최종**: `q10-square-goalpost.png` → `football-rules-quiz-q10.webp`
- **캔버스**: 1280×720
- **스레드**: 새 스레드, `S`와 메인 캐릭터를 첨부.
- **레퍼런스**: 메인 캐릭터 `다시바`

```text
Use case: historical-scene
Asset type: football rules quiz question illustration
Input images: Style anchor S; Main character reference: 다시바
Primary request: Draw the exact main character from the attached reference as a curious football historian examining an old-fashioned square-section goalpost beside a modern round goalpost. The old square post is the main rule object: make its four flat sides and sharp corners obvious, while the modern round post is a softer secondary comparison. The character holds a football and has an interested, playful expression.
Scene/backdrop: friendly museum-like football pitch display, no crowd and no signs.
Style/medium: match style anchor S exactly: polished 2D sticker-like SD football game art, thick deep-teal outline, soft cel shading, rounded forms.
Composition/framing: wide 16:9, character centred, old square post large on the left and smooth round post secondary on the right.
Color palette: white-and-mint kit, emerald grass, cream white goalposts, warm gold history sparkles.
Constraints: no written labels, no text, letters, numbers, logos, watermark, scoreboard, or other people.
```

### Q11 — 페널티킥 이중 터치

- **원본 → 최종**: `q11-penalty-double-touch.png` → `football-rules-quiz-q11.webp`
- **캔버스**: 1280×720
- **스레드**: 새 스레드, `S`와 메인 캐릭터를 첨부.
- **레퍼런스**: 메인 캐릭터 `재닌`

```text
Use case: illustration-story
Asset type: football rules quiz question illustration
Input images: Style anchor S; Main character reference: 재닌
Primary request: Draw the exact main character from the attached reference as the hero penalty kicker in a funny double-touch moment. Their first shot has bounced only off the goalpost and back toward them; show the ball touching the post with a clear comic sparkle, then the same hero about to kick it again before any other player can touch it. The character looks caught in a playful "wait, can I do that?" moment.
Scene/backdrop: clean penalty area and empty goal, no goalkeeper or other players.
Style/medium: match style anchor S exactly: polished 2D sticker-like SD football game art, thick deep-teal outline, soft cel shading, rounded forms.
Composition/framing: wide 16:9, hero large centre-left, post and rebounding ball clearly visible at right, generous top/bottom UI space.
Color palette: goalkeeper-inspired dark kit with mint trim, emerald grass, white post, warm gold impact highlight.
Constraints: no text, letters, numbers, logos, watermark, scoreboard, or extra people.
```

## 3. 결과 등급 카드 5장

결과 화면의 그림은 1024×1024 정사각, 불투명 PNG로 만든다. 현재 제공된 원본은 `grade-01-sprout.png`…`grade-05-sprout.png`이며, 각각 `football-rules-quiz-grade-01.webp`…`-05.webp`로 변환한다. **새 결과 전용 스레드**에서 첫 카드만 `S`와 함께 만들고, 이후 네 카드는 같은 스레드를 이어 쓴다.

| 점수 | 등급 | 장면 |
| --- | --- | --- |
| 0–2 | 규정 새싹 | 작은 새싹 방패와 규칙책을 들고 다시 연습하는 귀여운 선수 |
| 3–5 | 전술 루키 | 전술판과 작은 금별을 든 자신감 있는 루키 |
| 6–8 | 그라운드 분석관 | 돋보기와 전술 라인을 살피는 분석관 |
| 9–10 | 판정 마스터 | 금빛 호루라기와 깨끗한 옐로/레드 카드 실루엣 |
| 11 | IFAB 퍼펙트 | 우왁굳 감독이 금빛 트로피를 들어 올리고 민트 색종이 조각이 터지는 축하 장면 |

### 규정 새싹

- **원본 → 최종**: `grade-01-sprout.png` → `football-rules-quiz-grade-01.webp`
- **캔버스 / 스레드 / 레퍼런스**: 1024×1024 / 결과 카드 전용 새 스레드의 첫 이미지 / 스타일 앵커 `S`

```text
Use case: stylized-concept
Asset type: 0–2 point football rules quiz result card
Input images: Style anchor S
Primary request: Create one square result-card illustration of a lovable chibi football player carefully holding a tiny mint sprouting shield and an open rulebook, with two small loose footballs and a hopeful smile.
Scene/backdrop: a simple sunny football practice pitch with a soft circular gold halo behind the player.
Style/medium: polished 2D sticker-like SD football game art, rounded proportions, thick clean deep-teal outlines, soft cel shading, white uniform with mint #00e9ae details and warm gold #ffd44f accents.
Composition/framing: 1024x1024 square, one centred full-body character, 12% calm outer margin so the image crops cleanly into a circular result thumbnail.
Constraints: no text, letters, numbers, logos, watermark, score badges, other characters, or UI.
```

### 전술 루키

- **원본 → 최종**: `grade-02-sprout.png` → `football-rules-quiz-grade-02.webp`
- **캔버스 / 스레드 / 레퍼런스**: 1024×1024 / 위 결과 카드와 같은 스레드 / 스타일 앵커 `S`

```text
Use case: stylized-concept
Asset type: 3–5 point football rules quiz result card
Input images: Style anchor S
Primary request: Create one square result-card illustration of a confident chibi rookie football player holding a small tactics board and one shining gold star, taking a proud first step forward.
Scene/backdrop: a clean green football pitch with a bright blue sky, two small footballs, and restrained mint-and-gold celebratory sparkles.
Style/medium: polished 2D sticker-like SD football game art, rounded proportions, thick clean deep-teal outlines, soft cel shading, white uniform with mint #00e9ae details and warm gold #ffd44f accents.
Composition/framing: 1024x1024 square, one centred full-body character, 12% calm outer margin so the image crops cleanly into a circular result thumbnail.
Constraints: no text, letters, numbers, logos, watermark, score badges, other characters, or UI.
```

### 그라운드 분석관

- **원본 → 최종**: `grade-03-sprout.png` → `football-rules-quiz-grade-03.webp`
- **캔버스 / 스레드 / 레퍼런스**: 1024×1024 / 위 결과 카드와 같은 스레드 / 스타일 앵커 `S`

```text
Use case: stylized-concept
Asset type: 6–8 point football rules quiz result card
Input images: Style anchor S
Primary request: Create one square result-card illustration of a clever chibi football analyst crouching over a tactics board, studying a pitch through a magnifying glass while clean mint and gold tactical route lines float as decorative shapes.
Scene/backdrop: a bright football practice pitch with a distant goal, two footballs, and a subtle sunshine glow.
Style/medium: polished 2D sticker-like SD football game art, rounded proportions, thick clean deep-teal outlines, soft cel shading, white uniform with mint #00e9ae details and warm gold #ffd44f accents.
Composition/framing: 1024x1024 square, one centred full-body character, 12% calm outer margin so the image crops cleanly into a circular result thumbnail.
Constraints: no text, letters, numbers, logos, watermark, score badges, other characters, or UI.
```

### 판정 마스터

- **원본 → 최종**: `grade-04-sprout.png` → `football-rules-quiz-grade-04.webp`
- **캔버스 / 스레드 / 레퍼런스**: 1024×1024 / 위 결과 카드와 같은 스레드 / 스타일 앵커 `S`

```text
Use case: stylized-concept
Asset type: 9–10 point football rules quiz result card
Input images: Style anchor S
Primary request: Create one square result-card illustration of a heroic chibi match official proudly holding a gold whistle, with clean yellow and red card silhouettes as decorative non-textual props and a calm expert expression.
Scene/backdrop: a premium stadium pitch with a crisp blue sky, gold sparkles, and a soft referee-style spotlight halo.
Style/medium: polished 2D sticker-like SD football game art, rounded proportions, thick clean deep-teal outlines, soft cel shading, white-and-mint #00e9ae club details and warm gold #ffd44f accents.
Composition/framing: 1024x1024 square, one centred full-body character, 12% calm outer margin so the image crops cleanly into a circular result thumbnail.
Constraints: no text, letters, numbers, logos, watermark, score badges, other characters, or UI.
```

### IFAB 퍼펙트

- **원본 → 최종**: `grade-05-sprout.png` → `football-rules-quiz-grade-05.webp`
- **캔버스 / 스레드 / 레퍼런스**: 1024×1024 / 위 결과 카드와 같은 스레드 / 스타일 앵커 `S`, 우왁굳 레퍼런스

```text
Use case: stylized-concept
Asset type: perfect-score football rules quiz result card
Input images: Style anchor S; Woowakgood character reference
Primary request: Create one square result-card illustration of the exact attached Woowakgood character in a proud coach pose lifting a brilliant gold football trophy, with mint confetti, gold star sparkles, and a small celebratory fist pump.
Scene/backdrop: a radiant sunny football stadium, bright blue sky, rich green grass, mint club flags, and a large soft gold victory halo behind the character.
Style/medium: polished 2D sticker-like SD football game art, rounded proportions, thick clean deep-teal outlines, soft cel shading, white-and-mint #00e9ae club styling with warm gold #ffd44f trophy highlights.
Composition/framing: 1024x1024 square, one centred full-body character and trophy, 12% calm outer margin so the image crops cleanly into a circular result thumbnail.
Constraints: no text, letters, numbers, logos, watermark, score badges, other characters, headset markings, or UI.
```

## 4. UI · 이펙트 이미지

모든 UI 텍스트·선택지 번호·정답 문구는 코드로 렌더링한다. 현재 `football-rules-quiz-ui-kit.webp`는 변환만 되어 있고 **모달에서 사용하지 않는다**. 가독성이 나쁜 한 장짜리 스프라이트 시트를 억지로 늘리지 않고, 아래 독립 에셋을 준비해 순서대로 연결한다. 각 PNG는 `tmp/minigame-src/football-rules-quiz/`에 넣고, 최종 WebP는 표기된 이름으로 변환한다.

### 제목 아이콘

- **원본 → 최종**: `icon.png` → `football-rules-quiz-icon.webp`
- **캔버스 / 스레드 / 레퍼런스**: 1024×1024 / UI 전용 새 스레드의 첫 이미지 / 스타일 앵커 `S`

```text
Use case: stylized-concept
Asset type: 24px-readable modal title and minigame menu icon
Input images: Style anchor S
Primary request: Create one bold centred icon of a classic football resting on an open referee rulebook, accompanied by one tiny mint whistle and one gold sparkle.
Scene/backdrop: no scene, isolated icon only.
Style/medium: polished 2D sticker-like SD football game art, thick clean deep-teal outline, soft cel shading, mint #00e9ae and warm gold #ffd44f details.
Composition/framing: 1024x1024 square, icon fills 78% of the canvas with an even calm margin and a strong silhouette that remains legible at 24px.
Constraints: transparent background or flat #FF00FF magenta background; no text, letters, numbers, logos, watermark, floor shadow, or outer glow.
```

### 모달 프레임 — 9슬라이스 투명 테두리

- **원본 → 최종**: `modal-frame.png` → `football-rules-quiz-modal-frame.webp`
- **캔버스 / 스레드 / 레퍼런스**: 1536×1536 / 위 UI 전용 스레드와 같은 스레드 / 스타일 앵커 `S`

```text
Use case: ui-mockup
Asset type: responsive football rules quiz modal outer frame, 9-slice raster border
Input images: Style anchor S
Primary request: Create one premium rounded rectangular modal frame only. It must have ornate but restrained deep-teal outer edges, a layered mint inner rim, small gold football-star ornaments at all four corners, and a subtle grass-and-stadium motif embedded only in the wide border. The entire central rectangle must be completely transparent and empty for live HTML content.
Scene/backdrop: isolated modal frame only, no background scene inside the transparent centre.
Style/medium: polished 2D sticker-like football game UI, thick clean deep-teal outlines, soft cel shading, mint #00e9ae trim, cream details, and warm gold #ffd44f corner accents.
Composition/framing: exact 1536x1536 square. Make a 9-slice-safe frame: every corner ornament stays entirely within a 220px corner square; top, bottom, left, and right edge patterns must continue cleanly when stretched; keep a fully transparent, plain central rectangle at least 70% of the canvas width and height.
Constraints: flat #FF00FF magenta background outside and inside the frame so it becomes transparent after conversion; no text, letters, numbers, logos, watermark, characters, buttons, icons, or drop shadows outside the frame.
```

### 모달 배경 — 프레임 아래 레이어

- **원본 → 최종**: `modal-backdrop.png` → `football-rules-quiz-modal-backdrop.webp`
- **캔버스 / 스레드 / 레퍼런스**: 1536×1024 / 위 UI 전용 스레드와 같은 스레드 / 스타일 앵커 `S`

```text
Use case: stylized-concept
Asset type: football rules quiz modal background behind the separate frame
Input images: Style anchor S
Primary request: Create a calm premium football-stadium background that will sit beneath a separate ornate modal frame: emerald grass at the bottom, a deep teal stadium tunnel vignette around the edges, faint mint field lines, a subtle gold glow at the upper centre, and tiny restrained sparkle accents.
Scene/backdrop: an empty night-to-dawn football stadium with no people, no ball, and a deliberately quiet dark centre for readable quiz content.
Style/medium: polished 2D sticker-like football game background, soft cel shading, deep-teal edge vignette, mint #00e9ae and warm gold #ffd44f accents, refined not busy.
Composition/framing: 1536x1024 landscape, dark low-detail centre and lower-middle content area, visual details pushed to the outer 18% edges so live question panels remain readable.
Constraints: opaque background; no text, letters, numbers, logos, watermark, scoreboards, characters, UI panels, or strong focal object.
```

### 문제 패널 테두리

- **원본 → 최종**: `question-panel.png` → `football-rules-quiz-question-panel.webp`
- **캔버스 / 스레드 / 레퍼런스**: 1200×360 / 위 UI 전용 스레드와 같은 스레드 / 스타일 앵커 `S`

```text
Use case: ui-mockup
Asset type: stretchable question-copy panel ornament
Input images: Style anchor S
Primary request: Create one wide rounded cream question panel with a deep-teal outline, small mint corner leaves, and two restrained gold football-star ornaments. Leave a large completely blank opaque cream centre for live Korean question text.
Scene/backdrop: isolated UI panel only.
Style/medium: glossy polished 2D sticker game UI, thick clean deep-teal outlines, cream paper-like centre, mint #00e9ae trim, warm gold #ffd44f accents.
Composition/framing: 1200x360 landscape, perfectly symmetrical left and right edges, all ornament kept within the outer 18%, plain centre at least 64% wide.
Constraints: flat #FF00FF magenta background; no text, letters, numbers, logos, watermark, characters, question marks, or drop shadow outside the panel.
```

### 선택지 기본 패널

- **원본 → 최종**: `choice-panel-default.png` → `football-rules-quiz-choice-panel-default.webp`
- **캔버스 / 스레드 / 레퍼런스**: 960×256 / 위 UI 전용 스레드와 같은 스레드 / 스타일 앵커 `S`

```text
Use case: ui-mockup
Asset type: default quiz answer button panel
Input images: Style anchor S
Primary request: Create one wide rounded answer-button panel with a calm pale mint centre, deep-teal outline, a very subtle grass-texture edge, and a small gold glint on the upper-left rim. Leave the inner area fully blank for live Korean answer text and a separate number badge.
Scene/backdrop: isolated UI button only.
Style/medium: glossy polished 2D sticker game UI, thick clean deep-teal outlines, soft cel shading, mint #00e9ae and warm gold #ffd44f details.
Composition/framing: 960x256 landscape, perfectly symmetrical, plain central text area at least 65% wide, no visual element close to the centre baseline.
Constraints: flat #FF00FF magenta background; no text, letters, numbers, logos, watermark, characters, check marks, x marks, or external shadows.
```

### 선택지 정답 패널

- **원본 → 최종**: `choice-panel-correct.png` → `football-rules-quiz-choice-panel-correct.webp`
- **캔버스 / 스레드 / 레퍼런스**: 960×256 / 위 UI 전용 스레드와 같은 스레드 / 스타일 앵커 `S`

```text
Use case: ui-mockup
Asset type: correct quiz answer button panel
Input images: Style anchor S
Primary request: Create one wide rounded answer-button panel that feels clearly correct: rich mint centre, gold inner rim, deep-teal outline, and small leaf-and-star ornaments only at the far edges. Leave the inner area fully blank for live Korean answer text and a separate number badge.
Scene/backdrop: isolated UI button only.
Style/medium: glossy polished 2D sticker game UI, thick clean deep-teal outlines, soft cel shading, bright mint #00e9ae and warm gold #ffd44f details.
Composition/framing: 960x256 landscape, perfectly symmetrical, plain central text area at least 65% wide, restrained celebratory edge detail.
Constraints: flat #FF00FF magenta background; no text, letters, numbers, logos, watermark, characters, check marks, x marks, or external shadows.
```

### 선택지 오답 패널

- **원본 → 최종**: `choice-panel-wrong.png` → `football-rules-quiz-choice-panel-wrong.webp`
- **캔버스 / 스레드 / 레퍼런스**: 960×256 / 위 UI 전용 스레드와 같은 스레드 / 스타일 앵커 `S`

```text
Use case: ui-mockup
Asset type: wrong quiz answer button panel
Input images: Style anchor S
Primary request: Create one wide rounded answer-button panel that feels gently incorrect but friendly: soft coral centre, darker coral inner rim, deep-teal outline, and two tiny subdued mint ornaments at the far edges. Leave the inner area fully blank for live Korean answer text and a separate number badge.
Scene/backdrop: isolated UI button only.
Style/medium: glossy polished 2D sticker game UI, thick clean deep-teal outlines, soft cel shading, coral #ff9c94 balanced with restrained mint #00e9ae accents.
Composition/framing: 960x256 landscape, perfectly symmetrical, plain central text area at least 65% wide, no harsh visual aggression.
Constraints: flat #FF00FF magenta background; no text, letters, numbers, logos, watermark, characters, check marks, x marks, or external shadows.
```

### 선택지 번호 배지 — 기본

- **원본 → 최종**: `choice-number-default.png` → `football-rules-quiz-choice-number-default.webp`
- **캔버스 / 스레드 / 레퍼런스**: 256×256 / 위 UI 전용 스레드와 같은 스레드 / 스타일 앵커 `S`

```text
Use case: ui-mockup
Asset type: empty quiz answer-number badge
Input images: Style anchor S
Primary request: Create one circular mint enamel answer-number badge with a dark-teal outline, tiny gold rim, and a completely empty light-cream centre where code can render a Korean option number.
Scene/backdrop: isolated badge only.
Style/medium: glossy polished 2D sticker game UI, thick clean deep-teal outline, soft cel shading, mint #00e9ae and warm gold #ffd44f details.
Composition/framing: 256x256 square, centred circle filling 78% of the canvas, high contrast at 22px.
Constraints: flat #FF00FF magenta background; no text, letters, numbers, logos, watermark, check mark, x mark, character, or external shadow.
```

### 선택지 번호 배지 — 정답

- **원본 → 최종**: `choice-number-correct.png` → `football-rules-quiz-choice-number-correct.webp`
- **캔버스 / 스레드 / 레퍼런스**: 256×256 / 위 UI 전용 스레드와 같은 스레드 / 스타일 앵커 `S`

```text
Use case: ui-mockup
Asset type: correct quiz answer-number badge
Input images: Style anchor S
Primary request: Create one circular bright-gold enamel answer-number badge with a dark-teal outline, mint inner rim, and a completely empty pale-cream centre where code can render a Korean option number.
Scene/backdrop: isolated badge only.
Style/medium: glossy polished 2D sticker game UI, thick clean deep-teal outline, soft cel shading, warm gold #ffd44f and mint #00e9ae details.
Composition/framing: 256x256 square, centred circle filling 78% of the canvas, high contrast at 22px.
Constraints: flat #FF00FF magenta background; no text, letters, numbers, logos, watermark, check mark, x mark, character, or external shadow.
```

### 선택지 번호 배지 — 오답

- **원본 → 최종**: `choice-number-wrong.png` → `football-rules-quiz-choice-number-wrong.webp`
- **캔버스 / 스레드 / 레퍼런스**: 256×256 / 위 UI 전용 스레드와 같은 스레드 / 스타일 앵커 `S`

```text
Use case: ui-mockup
Asset type: wrong quiz answer-number badge
Input images: Style anchor S
Primary request: Create one circular soft-coral enamel answer-number badge with a dark-teal outline and a completely empty pale-cream centre where code can render a Korean option number.
Scene/backdrop: isolated badge only.
Style/medium: glossy polished 2D sticker game UI, thick clean deep-teal outline, soft cel shading, gentle coral #ff9c94 with a restrained mint #00e9ae accent.
Composition/framing: 256x256 square, centred circle filling 78% of the canvas, high contrast at 22px.
Constraints: flat #FF00FF magenta background; no text, letters, numbers, logos, watermark, check mark, x mark, character, or external shadow.
```

### 해설 패널

- **원본 → 최종**: `explanation-panel.png` → `football-rules-quiz-explanation-panel.webp`
- **캔버스 / 스레드 / 레퍼런스**: 1200×440 / 위 UI 전용 스레드와 같은 스레드 / 스타일 앵커 `S`

```text
Use case: ui-mockup
Asset type: quiz explanation panel ornament
Input images: Style anchor S
Primary request: Create one wide rounded cream information panel with a dark-teal outline, a subtle open-rulebook corner ornament, mint leaves at the lower corners, and one small gold star. Keep the entire middle clear for live Korean feedback and explanation text.
Scene/backdrop: isolated information panel only.
Style/medium: glossy polished 2D sticker game UI, thick clean deep-teal outlines, cream centre, mint #00e9ae and warm gold #ffd44f details.
Composition/framing: 1200x440 landscape, perfectly symmetrical, plain central copy area at least 66% wide and 60% tall.
Constraints: flat #FF00FF magenta background; no text, letters, numbers, logos, watermark, characters, check marks, x marks, or external shadows.
```

### 진행 표시 — 미완료

- **원본 → 최종**: `progress-pip-idle.png` → `football-rules-quiz-progress-pip-idle.webp`
- **캔버스 / 스레드 / 레퍼런스**: 192×64 / 위 UI 전용 스레드와 같은 스레드 / 스타일 앵커 `S`

```text
Use case: ui-mockup
Asset type: inactive quiz progress pip
Input images: Style anchor S
Primary request: Create one small horizontal rounded progress pip with a dark-teal outline and a muted translucent mint centre, with no symbol inside.
Scene/backdrop: isolated UI indicator only.
Style/medium: polished 2D sticker game UI, clean deep-teal outline, gentle mint #00e9ae colouring, no glow.
Composition/framing: 192x64 landscape, one centred pill occupying 84% width and 58% height, visually simple at 5px display height.
Constraints: flat #FF00FF magenta background; no text, letters, numbers, logos, watermark, icons, characters, or shadows.
```

### 진행 표시 — 현재/완료

- **원본 → 최종**: `progress-pip-active.png` → `football-rules-quiz-progress-pip-active.webp`
- **캔버스 / 스레드 / 레퍼런스**: 192×64 / 위 UI 전용 스레드와 같은 스레드 / 스타일 앵커 `S`

```text
Use case: ui-mockup
Asset type: active quiz progress pip
Input images: Style anchor S
Primary request: Create one small horizontal rounded progress pip with a dark-teal outline, rich mint centre, a fine warm-gold top highlight, and no symbol inside.
Scene/backdrop: isolated UI indicator only.
Style/medium: polished 2D sticker game UI, clean deep-teal outline, bright mint #00e9ae and warm gold #ffd44f detail, no glow.
Composition/framing: 192x64 landscape, one centred pill occupying 84% width and 58% height, visually clear at 5px display height.
Constraints: flat #FF00FF magenta background; no text, letters, numbers, logos, watermark, icons, characters, or shadows.
```

### 기본 행동 버튼 판

- **원본 → 최종**: `primary-button.png` → `football-rules-quiz-primary-button.webp`
- **캔버스 / 스레드 / 레퍼런스**: 640×192 / 위 UI 전용 스레드와 같은 스레드 / 스타일 앵커 `S`

```text
Use case: ui-mockup
Asset type: primary quiz action button plate
Input images: Style anchor S
Primary request: Create one wide rounded gold action-button plate with a deep-teal outline, subtle mint rim, two tiny football-star accents at the extreme ends, and a completely blank light-gold centre for live Korean button text.
Scene/backdrop: isolated UI button only.
Style/medium: glossy polished 2D sticker game UI, thick clean deep-teal outlines, soft cel shading, warm gold #ffd44f and mint #00e9ae details.
Composition/framing: 640x192 landscape, perfectly symmetrical, centre kept plain and high contrast for code-rendered text.
Constraints: flat #FF00FF magenta background; no text, letters, numbers, logos, watermark, arrows, icons, characters, or external shadows.
```

### 정답/오답 파티클 시트

- **원본 → 최종**: `burst.png` → `football-rules-quiz-correct-burst.webp`, `football-rules-quiz-wrong-burst.webp`
- **캔버스 / 스레드 / 레퍼런스**: 1024×1024 / 위 UI 전용 스레드와 같은 스레드 / 스타일 앵커 `S`

```text
Use case: stylized-concept
Asset type: correct and wrong game feedback particle sheet
Input images: Style anchor S
Primary request: Create one strict 2 columns by 2 rows animation sheet. Top-left is a small mint-and-gold correct sparkle, top-right is a larger expanding mint-and-gold correct starburst with leaves and diamond particles, bottom-left is a larger friendly coral wrong burst with dark-teal x-shaped gesture, bottom-right is a small fading coral particle puff. Keep every cell centred with 12% margin.
Scene/backdrop: isolated visual effects only.
Style/medium: crisp polished 2D sticker game effects, clean dark-teal outlines, mint #00e9ae, warm gold #ffd44f, and soft coral #ff9c94, no blur.
Composition/framing: 1024x1024 square divided into an exact 2x2 grid with no visible grid lines; every effect must remain inside its own cell.
Constraints: flat #FF00FF magenta background; no text, letters, numbers, logos, watermark, characters, or outer glow.
```

### 메뉴 아이콘 프롬프트

```text
Use case: stylized-concept
Asset type: menu icon for a football rules quiz
Input images: Style anchor S
Primary request: one bold centred icon: a classic football resting on an open referee rulebook, with a tiny mint whistle and one gold sparkle. It must read at 24px.
Style/medium: polished 2D sticker-like SD game art matching style anchor S exactly.
Composition/framing: square 1024x1024, subject fills 78%, transparent background or flat #FF00FF magenta background.
Constraints: no text, letters, numbers, logos, watermark, floor shadow, or outer glow.
```

### UI 키트 프롬프트

```text
Use case: ui-mockup
Asset type: raster UI ornament kit for a football rules quiz
Input images: Style anchor S
Primary request: create one strict 4 columns by 3 rows sprite sheet on a 1536x1024 canvas, one UI object per cell, centred, no cell borders or grid lines. In reading order: 1 title medallion, 2 wide question frame, 3 wide answer frame normal, 4 answer frame hover, 5 answer frame correct, 6 answer frame wrong, 7 explanation panel, 8 small progress pip inactive, 9 small progress pip active, 10 result badge bronze, 11 result badge gold, 12 rounded primary button plate. Every object has a blank calm centre where HTML text can be placed.
Style/medium: glossy 2D sticker game UI matching S; dark teal outlines, cream panels, mint #00e9ae trim, warm gold #ffd44f accents, clean symmetrical stretchable edges.
Constraints: flat #FF00FF magenta background; no text, letters, numbers, logos, watermark, characters, or shadows outside objects.
```

### 파티클 시트 프롬프트

```text
Use case: stylized-concept
Asset type: game feedback particle animation sheet
Input images: Style anchor S
Primary request: create one strict 2 columns by 2 rows animation sheet on a 1024x1024 canvas. For the correct version: frame 1 small gold-mint star flash, frame 2 expanding starburst, frame 3 tiny mint leaf and gold diamond particles, frame 4 fading particles. For the wrong version: frame 1 tiny soft coral puff, frame 2 short coral burst with a dark-teal x-shaped gesture, frame 3 scattered small rounded particles, frame 4 fading particles. Each frame is centred with 12% margin.
Style/medium: crisp polished sticker game effects matching S, no blur, no outer glow.
Constraints: flat #FF00FF magenta background; no text, letters, numbers, logos, watermark, or grid lines.
```

## 5. 오디오 요청서

모든 BGM은 무보컬·끊김 없는 루프를 우선하고, 효과음은 너무 날카롭지 않은 캐주얼 게임 톤으로 고른다. 무료 소스는 사용 전 CC0 또는 상업 이용 가능한 CC-BY 조건·저작자 표기 요구를 확인하고 출처를 기록한다.

| 파일 | 위치 | 용도/권장 길이 | 검색어 (한글 / 영어) |
| --- | --- | --- | --- |
| `football-rules-quiz-bgm.mp3` | `public/` | 풀이 중 반복, 60–120초 | `경쾌한 캐주얼 축구 퀴즈 BGM 루프` / `playful football quiz game music loop` |
| `football-rules-quiz-open.mp3` | `public/sfxes/` | 모달 열기, 0.2–0.5초 | `게임 퀴즈 카드 열기 효과음` / `game quiz card open ui sound` |
| `football-rules-quiz-select.mp3` | `public/sfxes/` | 선택지 누름, 0.08–0.2초 | `부드러운 게임 버튼 클릭` / `soft game ui select click` |
| `football-rules-quiz-correct.mp3` | `public/sfxes/` | 정답, 0.3–0.8초 | `귀여운 정답 팡파르` / `cute correct answer game fanfare` |
| `football-rules-quiz-wrong.mp3` | `public/sfxes/` | 오답, 0.2–0.5초 | `부드러운 오답 효과음` / `soft wrong answer game sound` |
| `football-rules-quiz-reveal.mp3` | `public/sfxes/` | 해설 공개, 0.2–0.5초 | `카드 정보 공개 효과음` / `game card reveal ui sound` |
| `football-rules-quiz-next.mp3` | `public/sfxes/` | 다음 문항, 0.15–0.35초 | `게임 다음 단계 전환` / `game next step transition sound` |
| `football-rules-quiz-result.mp3` | `public/sfxes/` | 일반 결과, 0.8–1.5초 | `축구 퀴즈 결과 팡파르` / `football quiz result fanfare` |
| `football-rules-quiz-perfect.mp3` | `public/sfxes/` | 11점 퍼펙트, 1–2초 | `축구 우승 완벽 점수 팡파르` / `football perfect score victory stinger` |

## 6. 에셋 연결 체크

1. 원본 PNG를 `tmp/minigame-src/football-rules-quiz/`에 위 원본명으로 둔다.
2. `pnpm convert:minigame-art -- football-rules-quiz` 실행 후 `public/`의 WebP 파일명을 확인한다.
3. 각 문항 이미지는 16:9로, 메뉴 아이콘은 24px로 축소해 검수한다.
4. 사운드 파일이 없어도 기능은 조용히 폴백해야 하며, 파일이 준비되면 메뉴 워밍업 목록과 모달의 사운드 토글이 경로를 그대로 사용한다.
