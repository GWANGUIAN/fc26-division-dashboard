# 오늘의 운세 — 이미지 생성 프롬프트 레퍼런스

`src/web/fortune/`에 구현되는 "오늘의 운세" 타로 팝업에 쓰이는 이미지 생성용 프롬프트 모음. `docs/toty-card-prompts.md`(3D 카드)와 같은 방식으로, 한 개씩 생성할 때마다 이 문서의 해당 섹션을 참고해서 생성 → 파일명 규칙대로 저장하면 됨.

## 디자인 방향 (중요)

- **캐릭터 스타일**: TOTY 카드(세미 리얼)와 달리 이번엔 **SD(2~3등신 귀여운 치비) 타로카드 일러스트** 톤으로 통일. 모든 캐릭터 프롬프트에 "chibi/SD, big head small body, cute mystical tarot illustration style" 명시.
- **"축구공 들고 포즈" 구도 지양 — 실제 타로 카드처럼 의미가 담긴 장면으로**: TOTY 3D 카드는 "캐릭터가 축구공과 함께 역동적인 포즈"였지만, 이번 타로 카드는 그 컨셉을 그대로 따라가지 않는다. 실제 타로 카드(예: The Chariot, The Star, Strength 등)가 그렇듯, **각 카드에 적힌 운세 문구(`fortuneCardData.ts`)의 의미를 상징적으로 표현하는 한 장면**을 그림 — 인물의 포즈, 배경 요소, 소품, 구도 전체가 그 문구의 스토리를 말해줘야 함(아래 11개 프롬프트 각각에 이미 그 장면을 구체적으로 설계해뒀음). **축구와 직접 관련될 필요는 없음** — 운세 내용이 자연스럽게 축구 장면(예: 수비를 뚫고 나가는 질주, 골키퍼의 선방)을 요구하면 그대로 담되, 좀 더 추상적/신비로운 상징(예: 서로 다른 방향을 보는 시선, 필드를 내려다보는 예언의 거울, 고요한 물결로 상대를 부드럽게 묶어두는 장면)이 문구를 더 잘 표현한다면 그쪽으로 감.
- **TOTY 3D 카드의 대표 색상·모티프를 그대로 따라가지 않음**: 같은 선수라도 이 타로 카드는 3D 카드(`totyCardTheme.ts`/`docs/toty-card-prompts.md`)와 **완전히 다른 색상·소재·컨셉**으로 독립적으로 설계함(예: 다시바=3D 카드는 용암/화산암이었지만 타로 카드는 진홍빛 혜성, 문모모=3D 카드는 마법진/룬문양이었지만 타로 카드는 예언의 거울 등). 운세 문구에 이미 들어있는 단어(예: 다시바 문구의 "불이 붙는다"🔥, 재닌 문구의 "서리가 피어나는")는 문구 자체가 요구하는 요소라 어쩔 수 없이 겹칠 수 있지만, 그런 경우에도 **구체적인 장면·소재·주변 색상 구성은 3D 카드와 다르게** 감(아래 각 프롬프트에 반영됨). 유일한 예외는 **하치**(11번) — 카드 이름 자체가 "황금 드래곤의 강림"이라 드래곤 모티프는 유지하되, 장면 구성은 3D 카드와 다르게 새로 그림.
- **카드 실루엣 — 장식이 바깥으로 삐져나온 유기적인 모양** (중요, 아래에서 변경됨): 카드를 단순 사각형이 아니라, **둥근 사각형 몸체 + 네 모서리마다 바깥으로 뻗어나가는 금색 필리그리(덩굴무늬) 장식 + 상단 중앙의 작은 아치형 크레스트 + 하단 중앙의 작은 뾰족한 피니얼(장식 돌기)**을 가진 타로카드 특유의 윤곽선으로 생성함. 이 장식 돌기들이 카드의 사각형 경계 바깥으로 살짝 삐져나오는 게 포인트 — TOTY 카드의 방패형 프레임과 같은 기법(알파 채널로 실루엣 자체를 그려냄)이되, 모양은 "축구 FIFA 카드"가 아니라 "타로카드"답게 곡선+필리그리 장식으로 감. 그래서 **카드 앞/뒷면 전부 알파 채널 있는 투명 PNG로 생성**하고 실루엣 바깥은 완전히 투명하게 만들어야 함(이전 버전 문서에서는 "불투명 사각형 + CSS로 모서리만 둥글게"였는데, 이번에 이 방식으로 변경함).
- **레이어 안 나눔**: TOTY처럼 frame/background/character를 따로 합성하지 않고, **카드 앞면은 한 장짜리 완성 일러스트**로 생성한다(실루엣 장식 + 일러스트 + 캐릭터가 전부 한 이미지 안에 있음). 대신 **카드 뒷면(`fortune-card-back.webp`)을 가장 먼저 만들어서 이 장식 실루엣을 확정**하고, 이후 11명 앞면을 생성할 때마다 그 뒷면 이미지를 "동일한 외곽 실루엣/장식 테두리 레퍼런스"로 같이 첨부해서 **12장 전부 정확히 같은 윤곽선**을 갖도록 함(뒷면이 진짜 뒷면이니 앞면과 크기·윤곽이 안 맞으면 셔플/딜 애니메이션에서 카드들이 서로 다른 모양으로 보여 어색해짐).
- **텍스트는 이미지에 굽지 않음**: 카드 이름(예: "타오르는 돌격병")은 AI 이미지에 직접 그리지 않고 웹에서 HTML로 오버레이함 — AI가 한글 텍스트를 그리면 깨지기 쉽다는 게 TOTY 작업에서 이미 확인된 교훈. 그래서 모든 캐릭터 프롬프트에 "no text, no logos"를 명시하고, **하단 12~15% 영역(장식 실루엣 안쪽)은 비워두도록**(카드 이름 오버레이 자리) 요청함.
- **운세 설명 문구는 전부 축구 드립**: 실제 문구는 이미 `src/web/fortune/fortuneCardData.ts`에 확정되어 있음 — "~수도/~지도" 식으로 얼버무리지 않고, 실제 타로 카드를 해석해주는 것처럼 단정적인 문장으로 씀. 모든 카드가 다 좋은 얘기일 필요는 없고, 몇 장은 "서두르면 놓친다", "초반엔 힘들지만" 처럼 주의를 주는 카드로도 섞어뒀음. 이 문서는 이미지만 다룸 — 문구 자체를 수정하고 싶으면 그 파일을 고치면 됨.
- **리냐 카드 — 사시(사팔눈) 컨셉**: 실제 전달할 리냐 레퍼런스 사진이 사시(두 눈이 서로 다른 방향을 보는) 특징을 가지고 있음. 이걸 결점이 아니라 **귀엽고 코믹한 매력 포인트**로 명시적으로 살릴 것(아래 8번 섹션 프롬프트 참고). 운세 문구도 "시선이 어디로 향하는지 모르겠다 → 그런데 그 끝에 의외의 행운이 있다"는 개그로 이미 연결해뒀음.

## 공통 작업 방식

1. **캔버스**: 카드 앞/뒷면 전부 **1060×1484px** (5:7, TOTY 카드와 동일 비율 — 기존 `aspect-ratio: 1060/1484` CSS를 그대로 재사용하기 위함) 캔버스 안에, 위에서 설명한 **장식 실루엣**(둥근 사각형 몸체 + 네 모서리 필리그리 + 상단 크레스트 + 하단 피니얼)을 가진 카드 하나를 그리고, **그 실루엣 바깥 캔버스 전체는 완전히 투명**(알파 채널 있는 투명 PNG)하게 생성.
   - 사용하는 생성 도구가 진짜 투명 배경(RGBA)을 지원하는지 먼저 확인 (예: ChatGPT 이미지 생성에 "배경 투명"을 명시, Adobe Firefly/Recraft의 투명 배경 옵션 등). 지원 안 하면 순수 그린/마젠타 배경으로 생성 후 배경 제거 도구로 따로 제거.
   - 생성 후 어두운 배경이나 체크무늬 배경에 올려서 가장자리(특히 필리그리 돌기 끝부분)에 원래 배경색 잔여 테두리(halo)가 없는지 꼭 확인.
2. **레퍼런스 이미지 첨부**:
   - ① 먼저 **카드 뒷면**(`fortune-card-back.webp`)부터 생성해서 장식 실루엣을 확정.
   - ② 이후 **각 선수 카드 앞면** 생성 시, (a) 확정된 카드 뒷면 이미지를 "동일한 외곽 실루엣/장식 테두리 구조 레퍼런스"로(장식 자체의 디자인 디테일은 앞면마다 살짝 달라도 되지만, 전체적인 윤곽선 구조·비율은 반드시 동일해야 함), (b) 그 선수 실제 사진을 "얼굴/헤어 특징 레퍼런스"로 같이 첨부.
3. **파일명 규칙**: `fortune-card-back.webp`(공용, 1장), `<id>-fortune-card.webp`(선수별, 11장) — 아래 표의 `id` 컬럼 사용. `src/web/assets/fortune/` 폴더에 저장(이미 폴더 생성해둠). PNG로 받으면 webp로 변환 후 이 폴더에 그대로 넣으면 `fortuneCardAssets.ts`가 자동으로 인식함(빌드 시 `import.meta.glob`으로 스캔 — 별도 등록 코드 필요 없음).
4. 11장 앞면이 다 없어도 사이트는 정상 동작함(없는 카드는 "?" 플레이스홀더 박스로 대체) — 급하지 않게 하나씩 채워 넣으면 됨. 카드 뒷면만 먼저 넣어도 셔플/딜 애니메이션은 바로 확인 가능.
5. **팝업 배경/제목/마스코트/버튼 이미지**는 아래 "공용 팝업 에셋" 섹션 참고 — 이것도 같은 `src/web/assets/fortune/` 폴더에 파일명 규칙대로 저장.

## 선수별 카드 데이터 요약

| # | 선수 | id | 포지션 | 컬러·모티프 (3D 카드와 무관한 독자 컨셉) | 카드 이름 |
|---|------|-----|--------|-------------|-----------|
| 1 | 다시바 | `tdnlamuron` | WF | 진홍+백광 · 질주하는 혜성 | 타오르는 돌격병 |
| 2 | 쥬멩이 | `ju010228` | ST | 황금빛 노랑+주홍 · 떠오르는 태양 | 봄의 골잡이 |
| 3 | 문모모 | `doormomo` | CDM | 남색+은빛 · 천리안의 거울 | 천리안의 지휘관 |
| 4 | 뽀린걸 | `bboringirl` | CM | 버건디+청동 · 불타는 심장의 전사 | 강철 심장 미드필더 |
| 5 | 한결 | `kaksjak0730` | CM | 은빛+짙은 자주 · 달빛 궁수 | 밤하늘의 프리키커 |
| 6 | 핑구 | `sjh4018` | CB | 강철청+대리석흰 · 공중 요새의 수호기사 | 공중 요새의 수문장 |
| 7 | 해파린 | `haepalin` | CB | 세이지그린+연회색 · 고요한 물결의 파수꾼 | 고요한 물결의 파수꾼 |
| 8 | 리냐 | `lina0108` | FB | 오팔빛 무지개색 · 갈림길의 요정 (사시 컨셉) | 엇갈린 시선의 갈림길 요정 |
| 9 | 빙밍 | `tleod1818` | FB | 터콰이즈+흰색 · 번개의 전령 | 번개의 질주자 |
| 10 | 재닌 | `janine95kim` | GK | 옅은 시안+차콜 · 서리의 수호자 | 서리의 골키퍼 |
| 11 | 하치 | `hachi97` | WF | 골드+보라 · 황금 드래곤 (스페셜, 유일한 예외) | 황금 드래곤의 강림 |

**컬러/모티프는 3D 카드(`totyCardTheme.ts`/`docs/toty-card-prompts.md`)와 의도적으로 다르게 설계** — 같은 선수라도 두 카드 시리즈가 서로 다른 독자적인 정체성을 갖도록 함(하치만 예외, 위 디자인 방향 참고). 카드 이름은 이전 초안에서 3D 카드 모티프를 그대로 언급하던 것들(룬문양/구름/심해/폭풍/오로라)을 이번 새 컨셉에 맞게 다시 지었음 — 실제 운세 문구(`fortuneCardData.ts`)는 그대로 유지.

---

## 카드 뒷면 (공용, 가장 먼저 생성 — 장식 실루엣을 여기서 확정)

**파일명**: `fortune-card-back.webp`

```
A mystical tarot card back design, ornate and symmetrical, portrait
orientation. IMPORTANT — the card itself is NOT a plain rectangle: it has
a rounded-rectangle body with elegant gold filigree/vine-scroll ornaments
curling outward PAST the rectangle's edges at all four corners, a small
arched crest ornament poking out above the top-center edge, and a small
pointed decorative finial poking out below the bottom-center edge — like
a classic ornate tarot card silhouette, not a simple rounded square. Deep
midnight-navy card face with delicate gold linework border just inside
the silhouette's edge, a central emblem combining a crescent moon, a
small five-pointed star cluster, and a subtle soccer-ball silhouette
woven into the pattern (as if the mystic and the sport are one motif) —
mint-teal and gold accent colors. Symmetrical repeating corner
ornaments, elegant and premium, Rider-Waite-inspired but original. No
text, no logos, no numbers, no readable characters. Entire canvas
OUTSIDE the card's own decorative silhouette (including between the
filigree curls) must be fully transparent (alpha 0) — this is a
cutout-shaped card, not a filled rectangle. PNG with alpha channel, high
detail, portrait orientation, 1060x1484.
```

---

## 1. 다시바 — `tdnlamuron` — 진홍+백광 · 질주하는 혜성 (WF)

**카드 앞면** (다시바 참고 사진 + 확정된 `fortune-card-back.webp`를 실루엣 레퍼런스로 첨부):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge (the card's outer decorative
outline must match exactly) — but redesign the illustration and palette
completely and independently for this player (do NOT reuse this
player's 3D-card look of orange volcanic rock/lava — this is a
different, unrelated design).

A cute chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card (a symbolic scene, not a simple action pose) —
big head small body, 2-3 head-tall proportions. The character (from the
attached reference photo) streaks forward like a blazing comet against a
deep crimson-red night sky, a trail of white-hot light and fire
particles burning behind them. Three dark shadow-silhouette figures
shatter like cracked glass and scatter into embers as the character
bursts straight through them, arriving at a small glowing goal-shaped
portal of light just ahead — visually telling the story "unstoppable
speed breaks through every defender and scores." Crimson-red and
white-hot color palette, small streaking spark-trail and comet-dust
flourishes decorate the corner ornaments (replacing the back's
mint-gold cosmic motif with this player's own colors, while keeping the
same silhouette shape). Leave the bottom ~15% of the card's inner area
as a simple, uncluttered space (no text) for a card-name overlay to be
added later on the website. No text, no logos, no numbers. Entire canvas
outside the card's own decorative silhouette must be fully transparent
(alpha 0). Portrait orientation, 1060x1484, PNG with alpha channel.
```

## 2. 쥬멩이 — `ju010228` — 황금빛 노랑+주홍 · 떠오르는 태양 (ST)

**카드 앞면** (쥬멩이 참고 사진 + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely and independently for this player (do NOT reuse this
player's 3D-card look of lime-green vines — this is a different,
unrelated design).

A cute chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card (a symbolic scene, not a simple action pose) —
big head small body, 2-3 head-tall proportions. The character (from the
attached reference photo) stands triumphantly as a brilliant morning sun
rises directly behind them, radiant golden-yellow and warm orange
sunbeams shooting outward in every direction like unstoppable growth;
both arms raised joyfully, a trail of light arcs from their foot like a
shooting star straight into a distant glowing goal net — visually
telling the story "unstoppable rising momentum, every shot finds the net
today." Golden-yellow and warm orange sunrise color palette, small
sunburst-ray flourishes decorate the corner ornaments (replacing the
back's mint-gold cosmic motif with this player's own colors, while
keeping the same silhouette shape). Bright warm sunrise lighting. Leave
the bottom ~15% of the card's inner area as a simple, uncluttered space
(no text) for a card-name overlay to be added later. No text, no logos,
no numbers. Entire canvas outside the card's own decorative silhouette
must be fully transparent (alpha 0). Portrait orientation, 1060x1484,
PNG with alpha channel.
```

## 3. 문모모 — `doormomo` — 남색+은빛 · 천리안의 거울 (CDM)

**카드 앞면** (문모모 참고 사진 + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely and independently for this player (do NOT reuse this
player's 3D-card look of violet runes/magic-circles — this is a
different, unrelated design).

A cute chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card (a symbolic scene, not a simple action pose) —
big head small body, 2-3 head-tall proportions. The character (from the
attached reference photo) stands calmly holding an ornate hand mirror
that shows a tiny glowing reflection of an entire soccer pitch seen from
above, a thin thread of silver-blue light extending from the mirror
across the scene toward a distant point — visually telling the story
"seeing the whole field, one perfect pass changes everything." Deep
navy-blue and silver color palette, small star-map and
constellation-line flourishes decorate the corner ornaments (replacing
the back's mint-gold cosmic motif with this player's own colors, while
keeping the same silhouette shape). Calm, composed expression, cool
navy-silver lighting. Leave the bottom ~15% of the card's inner area as
a simple, uncluttered space (no text) for a card-name overlay to be
added later. No text, no logos, no numbers. Entire canvas outside the
card's own decorative silhouette must be fully transparent (alpha 0).
Portrait orientation, 1060x1484, PNG with alpha channel.
```

## 4. 뽀린걸 — `bboringirl` — 버건디+청동 · 불타는 심장의 전사 (CM)

**카드 앞면** (뽀린걸 참고 사진 + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely and independently for this player (do NOT reuse this
player's 3D-card look of gunmetal-gray mecha armor/red circuits — this
is a different, unrelated design).

A cute chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card (a symbolic scene, not a simple action pose) —
big head small body, 2-3 head-tall proportions. The character (from the
attached reference photo), dressed as a small warrior in burnished
bronze armor, stands unwavering as a glowing ember-red heart burns
steadily through a crack in their breastplate; behind them an hourglass
keeps flowing without ever emptying, sand endlessly refilling itself —
visually telling the story "an engine that never tires, still fighting
hard in the final minute." Deep burgundy and bronze color palette, small
gear and ember flourishes decorate the corner ornaments (replacing the
back's mint-gold cosmic motif with this player's own colors, while
keeping the same silhouette shape). Determined, steady expression, warm
bronze rim lighting. Leave the bottom ~15% of the card's inner area as a
simple, uncluttered space (no text) for a card-name overlay to be added
later. No text, no logos, no numbers. Entire canvas outside the card's
own decorative silhouette must be fully transparent (alpha 0). Portrait
orientation, 1060x1484, PNG with alpha channel.
```

## 5. 한결 — `kaksjak0730` — 은빛+짙은 자주 · 달빛 궁수 (CM)

**카드 앞면** (한결 참고 사진 + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely and independently for this player (do NOT reuse this
player's 3D-card look of deep-black shattered glass shards — this is a
different, unrelated design).

A cute chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card (a symbolic scene, not a simple action pose) —
big head small body, 2-3 head-tall proportions. The character (from the
attached reference photo), dressed like a calm moonlit archer, draws
back a single bow with an arrow made of pure silver moonlight, aiming
steadily under a full moon and a sky full of stars; the target ahead is
already beginning to frost over in anticipation — visually telling the
story "calm like starlight, but powerful enough to freeze the keeper."
Silver moonlight and deep plum-violet night-sky color palette, small
crescent-moon and star flourishes decorate the corner ornaments
(replacing the back's mint-gold cosmic motif with this player's own
colors, while keeping the same silhouette shape). Poised, serene
expression, cool silver-plum rim lighting. Leave the bottom ~15% of the
card's inner area as a simple, uncluttered space (no text) for a
card-name overlay to be added later. No text, no logos, no numbers.
Entire canvas outside the card's own decorative silhouette must be
fully transparent (alpha 0). Portrait orientation, 1060x1484, PNG with
alpha channel.
```

## 6. 핑구 — `sjh4018` — 강철청+대리석흰 · 공중 요새의 수호기사 (CB)

**카드 앞면** (핑구 참고 사진 + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely and independently for this player (do NOT reuse this
player's 3D-card look of pastel sky-blue clouds/feathers — this is a
different, unrelated design).

A cute chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card (a symbolic scene, not a simple action pose) —
big head small body, 2-3 head-tall proportions. The character (from the
attached reference photo), dressed as a small guardian knight in
polished steel-blue armor, leaps effortlessly from a floating
marble-white rampart high in the sky, holding up a large glowing shield
that a dark shadowy comet bounces harmlessly off of — visually telling
the story "floating up lightly for the header, an unbreakable wall of
defense." Steel-blue and marble-white color palette, small rampart and
shield flourishes decorate the corner ornaments (replacing the back's
mint-gold cosmic motif with this player's own colors, while keeping the
same silhouette shape). Alert, grounded expression despite floating,
cool steel-white lighting. Leave the bottom ~15% of the card's inner
area as a simple, uncluttered space (no text) for a card-name overlay
to be added later. No text, no logos, no numbers. Entire canvas outside
the card's own decorative silhouette must be fully transparent (alpha
0). Portrait orientation, 1060x1484, PNG with alpha channel.
```

## 7. 해파린 — `haepalin` — 세이지그린+연회색 · 고요한 물결의 파수꾼 (CB)

**카드 앞면** (해파린 참고 사진 + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely and independently for this player (do NOT reuse this
player's 3D-card look of lavender-purple deep-sea jellyfish — this is a
different, unrelated design).

A cute chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card (a symbolic scene, not a simple action pose) —
big head small body, 2-3 head-tall proportions. The character (from the
attached reference photo) stands at the edge of a perfectly calm lake,
gently guiding rippling ribbons of flowing water that wrap softly but
firmly around a slumping shadow-silhouette figure, who looks exhausted
and about to collapse; the character themself remains serene and
untired — visually telling the story "marking like flowing water, until
the opponent tires out first." Soft sage-green and pale grey-blue color
palette, small ripple and water-droplet flourishes decorate the corner
ornaments (replacing the back's mint-gold cosmic motif with this
player's own colors, while keeping the same silhouette shape). Calm,
unbothered expression, soft misty lighting. Leave the bottom ~15% of the
card's inner area as a simple, uncluttered space (no text) for a
card-name overlay to be added later. No text, no logos, no numbers.
Entire canvas outside the card's own decorative silhouette must be
fully transparent (alpha 0). Portrait orientation, 1060x1484, PNG with
alpha channel.
```

## 8. 리냐 — `lina0108` — 오팔빛 무지개색 · 갈림길의 요정 (FB) — 사시 컨셉 반영

**카드 앞면** (리냐 참고 사진[사시 특징 포함] + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely and independently for this player (do NOT reuse this
player's 3D-card look of vivid pink cherry blossoms — this is a
different, unrelated design).

A cute chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card (a symbolic scene, not a simple action pose) —
big head small body, 2-3 head-tall proportions. The character (from the
attached reference photo, including her distinctive slightly wall-eyed/
cross-eyed gaze — her two eyes looking in subtly different directions,
kept exactly as shown, an endearing charming quirk to lean into rather
than correct or normalize) stands at a glowing magical crossroads where
two shimmering trails of light diverge from her — one trail from each
eye, since she's looking two ways at once. One trail wanders off and
fizzles into nothing; the other, unexpectedly, curves back around
through a hedge of glowing flowers and arrives directly at a hidden
goal — visually telling the story "nobody knows where her gaze is
really going, but somehow it finds the net." Shimmering opal/iridescent
color palette that shifts between soft teal, lavender and gold, small
prism and light-trail flourishes decorate the corner ornaments
(replacing the back's mint-gold cosmic motif with this player's own
colors, while keeping the same silhouette shape). Playful, slightly
dazed and lucky expression, dreamy prismatic lighting. Leave the bottom
~15% of the card's inner area as a simple, uncluttered space (no text)
for a card-name overlay to be added later. No text, no logos, no
numbers. Entire canvas outside the card's own decorative silhouette
must be fully transparent (alpha 0). Portrait orientation, 1060x1484,
PNG with alpha channel.
```

> 이 카드의 운세 문구("리냐의 시선이 어디를 향하는지는 아무도 모른다. 하지만 그 알 수 없는 방향 끝에, 아무도 예상 못한 찬스가 기다리고 있다.")는 이 사시 컨셉 그림과 짝을 이루도록 이미 작성해뒀음 — 그림에서 시선이 서로 다른 방향을 보고 있는 게 잘 드러나야 문구와 맞아떨어짐.

## 9. 빙밍 — `tleod1818` — 터콰이즈+흰색 · 번개의 전령 (FB)

**카드 앞면** (빙밍 참고 사진 + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely and independently for this player (do NOT reuse this
player's 3D-card look of deep-navy storm clouds/emerald lightning —
this is a different, unrelated design).

A cute chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card (a symbolic scene, not a simple action pose) —
big head small body, 2-3 head-tall proportions. The character (from the
attached reference photo) sprints along a bright coastal cliff edge, a
single ribbon of turquoise lightning trailing from their heel like a
wind-spirit's scarf; the lightning arcs forward through the air and
connects directly to a distant silhouetted teammate, delivering the
ball to them in an instant — visually telling the story "lightning-fast
overlapping run, one perfect cross becomes an assist." Bright turquoise
and white color palette, small wind-ribbon and spark flourishes
decorate the corner ornaments (replacing the back's mint-gold cosmic
motif with this player's own colors, while keeping the same silhouette
shape). Dynamic, joyful sprinting pose, bright turquoise rim lighting.
Leave the bottom ~15% of the card's inner area as a simple, uncluttered
space (no text) for a card-name overlay to be added later. No text, no
logos, no numbers. Entire canvas outside the card's own decorative
silhouette must be fully transparent (alpha 0). Portrait orientation,
1060x1484, PNG with alpha channel.
```

## 10. 재닌 — `janine95kim` — 옅은 시안+차콜 · 서리의 수호자 (GK)

**카드 앞면** (재닌 참고 사진 + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely and independently for this player (do NOT reuse this
player's 3D-card look of sky-blue with aurora ribbons — this is a
different, unrelated design; frost/ice is kept since the fortune text
itself calls for it, but skip aurora entirely).

A cute chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card (a symbolic scene, not a simple action pose) —
big head small body, 2-3 head-tall proportions. The character (from the
attached reference photo), dressed in dark charcoal goalkeeper gear with
pale icy-cyan gloves, reaches out mid-save with delicate ice crystals
blooming outward from her fingertips in a bursting star pattern,
freezing a dark silhouetted ball in place mid-air just before the goal
line — visually telling the story "frost blooms from her fingertips,
nothing gets past the perfect save." Pale icy-cyan and deep charcoal
color palette (no aurora), small snowflake and ice-crystal flourishes
decorate the corner ornaments (replacing the back's mint-gold cosmic
motif with this player's own colors, while keeping the same silhouette
shape). Focused, confident expression, cool icy rim lighting. Leave the
bottom ~15% of the card's inner area as a simple, uncluttered space (no
text) for a card-name overlay to be added later. No text, no logos, no
numbers. Entire canvas outside the card's own decorative silhouette
must be fully transparent (alpha 0). Portrait orientation, 1060x1484,
PNG with alpha channel.
```

## 11. 하치 — `hachi97` — 골드+보라 · 황금 드래곤 (스페셜, 유일한 예외, WF)

**카드 앞면** (하치 참고 사진 + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely for this player (and make the ornamentation a bit
more lavish/elaborate than the others — this is the "special/highest
rarity" card of the set). NOTE: this is the one deliberate exception
where the golden-dragon motif is intentionally kept, since it's this
player's own core signature identity tied to the card's name "황금
드래곤의 강림" — even so, compose a genuinely different scene from the
3D card, not the same pose.

A cute chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card (a symbolic scene, not a simple action pose) —
big head small body, 2-3 head-tall proportions. The character (from the
attached reference photo) dribbles confidently through a burst of
golden dragon-shaped light and smoke swirling around them, while three
shadowy stone-guardian statues crack and crumble to golden dust as they
pass by untouched; the ball trails a comet of golden light into a goal
that bursts open with radiant sunburst light — visually telling the
story "today, everything just works — even the impossible dribble
becomes real." Radiant gold and deep violet dragon-fire color palette,
small golden dragon-scale and flame-wisp flourishes decorate the corner
ornaments (replacing the back's mint-gold cosmic motif with this
player's own colors, while keeping the same silhouette shape).
Triumphant, glowing expression, radiant golden rim lighting. Leave the
bottom ~15% of the card's inner area as a simple, uncluttered space (no
text) for a card-name overlay to be added later. No text, no logos, no
numbers. Entire canvas outside the card's own decorative silhouette
must be fully transparent (alpha 0). Portrait orientation, 1060x1484,
PNG with alpha channel.
```

---

## 공용 팝업 에셋

### `fortune-popup-backdrop.webp` (2560×1440, 불투명)

```
A premium dark studio showcase backdrop for a mystical tarot-reading
popup. A cozy dim witch's study / starlit library at night — soft candle
glow, distant floating dust motes, a faint hint of bookshelves and star
charts fading into darkness, deep navy-to-black gradient overall. Low
contrast, desaturated, moody and cinematic — neutral enough that bright
tarot cards and character art placed in front of it will stand out
clearly. No text, no logos, no readable shapes, no bright highlights.
Ultra-wide, minimal, elegant, 4K, 2560x1440.
```

### `fortune-popup-backdrop-glow.webp` (2560×1440, 알파 채널 있는 투명 PNG)

```
Abstract loose particle/light-effect overlay ONLY, ultra-wide, 2560x1440.
Softly drifting golden-mint sparkle motes and faint floating star
glints, like magical dust in candlelight — sparse and soft, concentrated
toward the edges and corners, keep the vertical center column (where the
popup content sits) mostly clear. No solid material, no border/frame, no
characters, no text — this is a light layer meant to be composited on
top of the popup backdrop, not a full scene. High detail, soft glow
bloom, 4K. Entire canvas outside the glowing particles themselves must
stay fully transparent (alpha 0), transparent PNG.
```

### `fortune-title.webp` (약 1400×420, 알파 채널 있는 투명 PNG)

```
A decorative fantasy typography lockup reading "오늘의 운세 뽑아보기" in
Korean, designed as an ornate mystical/tarot-style title graphic — gold
and mint-teal color scheme, delicate star and crescent-moon flourishes
around the lettering, elegant serif-ish fantasy lettering style (legible
Korean Hangul, not decorative to the point of being unreadable). No
background, no box, no frame — just the lettering and its small
decorative flourishes floating on transparent space. Landscape
orientation, roughly 1400x420, transparent PNG with alpha channel.
```

### `fortune-mascot.webp` (약 1200×1600, 알파 채널 있는 투명 PNG)

**우왁굳 참고 사진을 반드시 같이 첨부** — 마녀 복장의 얼굴이 우왁굳 본인이어야 함(코스프레하듯 우왁굳 얼굴/헤어 그대로에 마녀 옷만 입힌 느낌).

```
Using the attached reference photo for the face — this must clearly be
the same person as the reference photo (keep his actual face, hairstyle
and likeness recognizable, like he's cosplaying as a witch rather than
becoming a generic fantasy character). Draw him wearing a witch's cloak
and a pointed witch hat over his own look, holding a glowing tarot card
in one hand, warm mischievous mystical smile, standing in a confident
half-body/three-quarter pose as if presenting a fortune-telling show to
the viewer. Soft magical sparkle particles around the hands. Mint-teal
and gold color accents on the witch outfit. No background, no frame, no
text — character cutout only, floating on transparent space. Portrait
orientation, roughly 1200x1600, transparent PNG with alpha channel.
```

*(SD/치비 톤으로 맞출지, 카드들보다 조금 더 정성스러운 일러스트 톤으로 할지는 취향껏 — 어느 쪽이든 코드 동작에는 영향 없음. 얼굴만큼은 레퍼런스 사진과 동일 인물로 나오는지 꼭 확인.)*

### `fortune-draw-button.webp` (약 560×160, 알파 채널 있는 투명 PNG)

```
A game-UI call-to-action button graphic reading "운세 뽑기" in Korean,
designed as an ornate mystical/tarot-style button — a rounded pill or
scroll-like shape with gold trim and a soft mint-teal glow, small star/
card-suit icon decorations flanking the text, glossy premium game-UI
finish (legible Korean Hangul text). No background beyond the button
shape itself — floating on transparent space so it can be placed
directly over the popup backdrop. Landscape orientation, roughly
560x160, transparent PNG with alpha channel.
```

*(버튼의 호버 상태는 별도 이미지 없이 웹에서 CSS로 밝기/확대 효과를 줄 예정이라 이 한 장이면 충분함.)*

> **"다시 뽑기" 버튼은 이미지가 아니라 일반 UI 엘리먼트(아이콘+텍스트 버튼)로 구현되어 있음** — 별도 이미지 생성 불필요.

---

## 필요 효과음 목록 & 검색 키워드

이미지와 별개로, 아래 효과음/배경음악 파일도 준비되면 `public/` 폴더(배경음악은 루트, 효과음은 `public/sfxes/`)에 아래 파일명으로 넣으면 자동으로 연결됨.

| 파일명 | 위치 | 용도 | 검색 키워드(한/영) |
|---|---|---|---|
| `fortune-bgm.mp3` | `public/` | 팝업 배경음악(루프) | "mystical ambient loop", "tarot reading background music", "신비로운 마법 배경음악", "fortune telling bgm loop" |
| `fortune-shuffle.mp3` | `public/sfxes/` | 카드 셔플 효과음 | "card shuffle sound effect", "tarot card shuffle sfx", "카드 섞는 소리" |
| `fortune-card-hover.mp3` | `public/sfxes/` | 카드 호버 시 | "magic chime hover", "soft sparkle ui sound", "마법 반짝임 효과음" |
| `fortune-card-select.mp3` | `public/sfxes/` | 카드 선택/플립 임팩트 | "card flip whoosh reveal", "magic reveal impact sound", "타로 카드 공개 효과음" |
