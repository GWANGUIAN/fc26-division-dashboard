# 14. 엔딩 크레딧 이후 스팅어 — 「???」 이미지 생성 요청서

최종 보스(제초왕) 클리어 → 개화 → 단체샷 → 크레딧 카드가 끝난 **뒤에**, 영화 쿠키 영상처럼 짧은 컷 6장으로 다음 이야기를 암시하는 장면의 **이미지 실행 전용 문서**다. **구현 완료(2026-09-20, S8)** — 이미지 6장이 준비되어 변환·연결했다(§6, [09 §15](09-asset-checklist.md#15-엔딩-크레딧-이후-스팅어-에셋-2026-09-20)). 스타일 바이블은 [04 §1](04-art-characters.md#1-스타일-바이블-모든-이미지-공통), 키아트 스타일 기준은 [06 §2](06-art-ui.md#2-로딩타이틀로고-키아트)의 `loading-bg`를 따른다.

> **한 줄 스토리**: 모두가 돌아간 밤의 스타디움. 제초왕이 떨어뜨린 제초기를 정체불명의 하늘색 인물 「???」가 주워 들고, 황금 잔디를 노리는 새 계획을 세운다.

## 0. 한눈에 보기

모든 원본은 `tmp/world-src/ending/`에 **아래 파일명 그대로** 저장한다(이 폴더는 git 추적 제외, 다른 `tmp/world-src/` 폴더와 동일).

| # | 저장 파일 | 캔버스 | 용도 | 우선순위 | 첨부 레퍼런스 |
| --- | --- | --- | --- | --- | --- |
| 0-a | `pc-qqq-stand.png` | 1024×1024 투명 | 「???」 마스터 디자인(정면). 이후 모든 컷의 외형 기준 | P0 | ①원본 |
| 0-b | `pc-qqq-turn.png` | 1536×1024 투명 | 정면·우측·후면 시트(실루엣·뒷모습 컷용) | P0 | ①원본, 0-a |
| 1 | `pc-01-dropped-trimmer.png` | 1536×1024 | 컷1 — 밤의 스타디움, 버려진 제초기, 오른쪽에서 드리우는 그림자 | P0 | ②③④⑤ |
| 2 | `pc-02-glove-grab.png` | 1536×1024 | 컷2 — 흰 장갑이 제초기를 움켜쥠(얼굴 비공개) | P0 | ②③⑤, 0-a |
| 3 | `pc-03-silhouette-rise.png` | 1536×1024 | 컷3 — 달빛 역광 실루엣, 제초기를 어깨에 멘 「???」 | P0 | ①②③⑤, 0-a, 0-b |
| 4 | `pc-04-scheme-room.png` | 1536×1024 | 컷4 — 제초 공장 지하, 지도·설계도·황금 새싹 유리병, 뒷모습 | P0 | ②③⑥⑦, 0-b |
| 5 | `pc-05-eye-v-sign.png` | 1536×1024 | 컷5 — 눈가에 브이, 얼굴 첫 공개, 뒤에 하늘색 눈의 기계 군단 실루엣 | P0 | ①③, 0-a |
| 6 | `pc-06-village-hint.png` | 1536×1024 | 컷6 — 새벽의 잔디동 전경 + 남동쪽 구석의 불길한 회색 얼룩(“다음 이야기에서 계속”) | P0 | ⑧ |

**첨부 레퍼런스 파일** (①은 이번에 넣어 둔 파일, 나머지는 기존 원본)

| 표기 | 파일 | 쓰는 이유 |
| --- | --- | --- |
| ① | `tmp/world-src/ending/ref-qqq-original.png` (webp 원본 `ref-qqq-original.webp`) | 「???」 원본 일러스트. 얼굴·머리·후드티·브이 포즈의 기준 |
| ② | `tmp/world-src/characters/char-weedking-stand.png` | **제초기 디자인**(주황·흰 엔진식 예초기, 원형 날에 잔디 조각) 기준 |
| ③ | `tmp/world-src/ui/ui-loading-bg.png` | 그림체(HD 도트 키아트) 기준 |
| ④ | `tmp/world-src/buildings/bld-stadium.png` | 스타디움 외형(컷1) |
| ⑤ | `tmp/world-src/interiors/int-stadium.png` | 스타디움 내부·피치·조명(컷1~3) |
| ⑥ | `tmp/world-src/interiors/int-factory.png` | 제초 공장 내부 분위기(컷4) |
| ⑦ | `tmp/world-src/buildings/bld-factory.png` | 제초 공장 외형(컷4) |
| ⑧ | `tmp/world-src/ui/ui-loading-bg.png` | 컷6 구도 기준(같은 구도에서 변형) |

**최종 변환**: 실제로 받은 컷은 **1672×941**(이미 16:9)이라 1672×940으로 맞춰 `src/web/assets/world/ending/pc-0N-*.webp`(손실 q90)로 저장했다. 0-a/0-b는 **레퍼런스 전용**이라 게임에 싣지 않는다.

## 1. 연출 — 크레딧 이후 컷 진행

크레딧 카드의 마지막 줄(“잔디동 Let's Go!!”)이 사라진 뒤 이어진다. **플레이어가 Enter로 한 컷씩 넘긴다**(구현 확정, S8 후속): 컷은 입장 애니메이션(페이드·움직임·자막)이 끝나면 그 화면에서 **멈추고**, Enter를 누르면 다음 컷의 애니메이션이 시작된다. 아래 표의 시간은 자동 재생이 아니라 **컷마다 입장 애니메이션이 끝나는 시점(이후 Enter 대기)**이다(컷 길이는 `stingerData.ts`의 `settleSeconds`). **자막은 이미지에 굽지 않고 코드(CSS)로 얹는다.** 화자는 항상 `???`로만 표기하고 라벨 색은 「???」 하늘색(`#6adcf2`)을 쓴다.

| 입장 애니메이션 | 컷 | 카메라/전환 | 자막(초안) | 사운드 |
| --- | --- | --- | --- | --- |
| 1.5초 검은 화면 | 시작 | BGM 정지, 정적(이 동안 Enter는 무시) | — | 무음 |
| 4.0초 | `pc-01` | 1.2초 페이드 인, 100→106% 천천히 줌인 | — | 밤 앰비언스(귀뚜라미·바람) |
| 2.0초 | `pc-02` | 하드 컷, 짧은 흔들림 | — | 시동 걸리다 마는 “부릉…” |
| 3.5초 | `pc-03` | 아래→위 느린 틸트 | `???` “…이거, 아직 쓸 만하네.” | 엔진이 안정적으로 “부우웅” |
| 4.5초 | `pc-04` | 좌→우 천천히 팬 | `???` “제초왕은 너무 물렀어.” → “이번엔 뿌리째 밀어 주지.”(첫 줄 뒤 두 번째 줄로 교체) | 낮은 드론 |
| 3.0초 | `pc-05` | 빠른 줌인 후 정지 | `???` “다음 시즌엔… 내가 나간다.” | 짧은 스팅 |
| 4.0초 | `pc-06` | 크로스페이드, 정지 | 1.6초에 “— 다음 이야기에서 계속 —” | 새벽 새소리 |
| 마지막 Enter 뒤 1초 | 검은 화면 → 월드 복귀 | 페이드 아웃 | — | 스타디움 앰비언스·필드 BGM 복귀 |

각 컷은 입장 애니메이션이 끝나면 **그 상태로 멈추고** 화면 오른쪽 아래에 `Enter ▶ 다음`(마지막 컷은 `마치기`)이 깜빡인다. 자막과 끝맺음 문구는 다음 컷으로 넘어갈 때까지 남는다.

- 자막 톤은 기존 대사 규칙과 같이 **익살스러운 악역**이다(놀림·비하·잔혹 표현 배제).
- Enter(E·Space·클릭 포함)는 입장 애니메이션이 끝난 뒤에만 다음 컷으로 넘기며, **Esc는 남은 컷을 모두 건너뛴다.** `prefers-reduced-motion`에서는 줌·틸트·팬·흔들림을 없애고 페이드만 쓴다.
- 「???」의 **얼굴은 컷5에서 처음** 완전히 보인다(컷1 그림자 → 컷2 손 → 컷3 실루엣 → 컷4 뒷모습 → 컷5 얼굴). 이 순서가 깨지지 않게 컷3·4에서 얼굴이 읽히면 재생성한다.

## 2. 「???」 캐릭터 디자인 기준

원본(`ref-qqq-original.png`) 3D풍 일러스트에서 뽑은 특징이다. 이름은 게임 안팎 모두 `???`로만 표기한다.

| 항목 | 기준 |
| --- | --- |
| 체형 | 둥글고 포근한 치비(약 2.5등신), 넉넉한 후드티 |
| 얼굴 | 크고 둥근 **납작한 흰 얼굴**(`#fbeded`). 아주 단순한 선 표현: 작은 검은 실눈 + 짧은 가는 눈썹, 곡선 두 줄과 작은 U자 코, **굵은 가로 획 몇 줄로 된 직사각형 입**(능글맞은 웃음), 길게 휘어진 턱선. 코 음영·입술·이빨·속눈썹·홍조를 **추가하지 않는다** |
| 머리 | 풍성한 웨이브/컬, 복숭아빛 금발(`#ecba80`, 그림자 `#c4916a`), 잎사귀 같은 겹겹의 컬 덩어리 |
| 옷 | 오버사이즈 후드티, 안쪽 후드·칼라는 짙은 청록(`#0f3a46`), **노란 끈 두 줄**(`#f5d233`)이 가슴 앞에 늘어짐 |
| 손 | 크림빛 흰 장갑(`#f6eaec`), 손가락 3개+엄지의 단순한 형태 |
| 시그니처 포즈 | 장갑 낀 손으로 **브이(검지·중지)를 눈가에 대는** 포즈(원본 그대로) |
| 소품 | 제초왕이 떨어뜨린 **제초기**(주황·흰 엔진식 예초기, 원형 날). 왕관은 컷4에서 걸린 전리품으로만 등장 |

**하늘색 팔레트(메인 컬러)**: 원본 후드티의 하늘색(시안, 원본 픽셀 샘플 `#87dff1`/`#67dbf6`/`#41a8be`)을 **그대로 유지한다.** 초록 쪽으로 옮기지 않는다.

| 용도 | 색 |
| --- | --- |
| 「???」 하늘색(기본) | `#6adcf2` |
| 하이라이트 | `#8be6f7` |
| 그림자 | `#41a8be` |
| 안쪽 후드·칼라 | `#0f3a46` |

- 잔디동 팀 민트(`#2ee8b6`, 기준 [04 §1](04-art-characters.md#1-스타일-바이블-모든-이미지-공통))와는 확실히 다른 **푸른 하늘색**이다. 잔디동의 초록 민트 옆에 하늘색 인물이 서면 “외부에서 온 존재”로 읽힌다. 값을 바꾸려면 이 표와 프롬프트의 hex(`#6adcf2` `#8be6f7` `#41a8be` `#0f3a46`)를 함께 고친다.
- 어두운 밤 장면에서는 **하늘색이 유일한 밝은 포인트 색**이 되게 한다(황금 잔디의 금색과 대비). 컷1의 마을 깃발처럼 잔디동 자체의 물건은 기존 민트를 그대로 둔다.

**표현 주의**: 체형·얼굴을 놀리는 과장은 넣지 않는다. 귀엽고 익살스러운 “허세 부리는 악역”으로만 그린다. 이미지 안 글자·숫자·로고 금지.

## 3. 공통 사용 규칙

- **세션**: `PC-QQQ` 스레드에서 0-a → 0-b를 만든다(0-a 승인 후 0-b에 0-a를 다시 첨부). 컷 6장은 `PC-SCENES` 스레드 하나에서 1→6 순서로 만든다(조명·색감·캐릭터 일관성). 컷 결과가 흔들리면 새 스레드를 열고 **0-a, 0-b, 이미 승인한 컷 1장**을 다시 첨부한다.
- **모든 프롬프트는 독립 완결형**이다. 원하는 코드 블록 하나만 통째로 복사한다. 첨부 순서는 각 절의 “첨부” 목록 순서와 같게 한다.
- **캔버스**: 컷은 1536×1024로 생성하되 **중요한 요소는 중앙 16:9 띠(위아래 약 80px 제외) 안에** 둔다. 위아래는 잘린다.
- **배경**: 0-a/0-b는 투명 PNG가 우선, 불가능하면 그림자·바닥·그라디언트가 없는 완전 평면 `#FF00FF`. 컷은 불투명 전면 그림이다.
- **스타일**: 모든 이미지는 최신 32비트급 **HD 도트 일러스트**다. 또렷한 도트 블록, 1px 짙은 청록 외곽선(`#16302e`, 순검정 금지), 3단 셀 셰이딩, 도트 디더링 그라디언트는 허용, **매끈한 안티앨리어싱 그라디언트·사진 질감·3D 렌더 느낌·붓터치 금지**.
- **실패 시**: 같은 대화에서 프롬프트 뒤에 `Keep everything, but fix: …`만 덧붙여 수정한다(전체 재생성보다 일관성 유지에 유리).

## 4. 이미지별 브리프

### 0-a. `pc-qqq-stand.png` — 마스터 정면

- 저장: `tmp/world-src/ending/pc-qqq-stand.png` · 세션 `PC-QQQ`(새 대화)
- 첨부: ①`ref-qqq-original.png`

```text
Attached is the original illustration of a mysterious character. Redraw this exact character as a chibi pixel-art game sprite in high-detail modern 32-bit pixel art (chunky visible pixel blocks, crisp 1-pixel dark teal (#16302e) outlines, never pure black, three-step cel shading, no anti-aliasing blur, no smooth gradients, no 3D-render look, no photo texture).
Keep exactly: a round, plump, cheerful chibi about 2.5 heads tall; a big round pale-white FLAT face (#fbeded) with only very simple drawn features — two tiny black slit eyes with short thin eyebrow strokes, a small simple drawn nose (a short curved line pair and a tiny U-shape), a wide rectangular mouth made of a few thick horizontal black strokes (a smug closed-lip grin) and one long curved chin line; voluminous wavy peach-blonde hair (#ecba80 with #c4916a shadows) built from many layered curled leaf-like locks; an oversized hoodie with a dark teal (#0f3a46) inner hood and collar and two thin yellow (#f5d233) drawstrings hanging down the chest; simple cream-white gloves (#f6eaec) with three fingers and a thumb.
IMPORTANT colour: keep the hoodie in the original illustration's SKY-CYAN — base #6adcf2, highlights #8be6f7, shadows #41a8be. Do NOT shift it toward green or mint. Sky-cyan is this character's main colour. Pants and shoes: dark teal-navy (#0f3a46) trousers and simple chunky sky-cyan-and-white sneakers.
Do NOT make the face prettier or more detailed: no nose shading, no lips, no teeth, no eyelashes, no blush, no realistic hands.
Pose: standing idle, front view (slightly looking down at the viewer as in a top-down RPG), both arms relaxed at the sides with gloved hands visible, feet together on one baseline, full body visible with a little empty margin on all sides.
Canvas: 1024x1024, the character centred, about 85% of the canvas height, fully transparent background (or, if transparency is impossible, a perfectly flat solid #FF00FF background with no shadow, floor, gradient or border and no magenta on the character). Single character only. No text, letters, numbers, logos or watermark.
```

### 0-b. `pc-qqq-turn.png` — 정면·우측·후면 시트

- 저장: `tmp/world-src/ending/pc-qqq-turn.png` · 세션 `PC-QQQ`(0-a와 같은 대화 유지)
- 첨부: ①`ref-qqq-original.png`, 0-a `pc-qqq-stand.png`

```text
Using the attached standing sprite as the exact reference (the attached original illustration only helps with the hair, face and hoodie details), draw the SAME character as a turnaround sheet with three standing poses side by side on one 1536x1024 canvas, evenly spaced with clear gaps:
1) front view (facing the camera), 2) right-side view (facing right, profile), 3) back view (facing away — show the sky-cyan hoodie's back, the curly hair mass from behind, and the hood).
Rules: identical character design, sky-cyan (#6adcf2) hoodie, palette, proportions and pixel size in all three; same scale; all feet on the exact same baseline; standing idle with arms relaxed; no motion; no shadows; at least 10% empty margin around each pose; the face keeps its minimal flat drawn look (no extra shading, lips, teeth or eyelashes); fully transparent background (or flat #FF00FF with no shadow or gradient); no text, letters, numbers, guide lines or watermark.
```

### 1. `pc-01-dropped-trimmer.png` — 컷1 버려진 제초기

- 저장: `tmp/world-src/ending/pc-01-dropped-trimmer.png` · 세션 `PC-SCENES`(새 대화, 이 컷이 첫 요청)
- 첨부(순서대로): ③`ui-loading-bg.png`, ②`char-weedking-stand.png`, ④`bld-stadium.png`, ⑤`int-stadium.png`

```text
Attached: (1) the village panorama — match its rich, crisp HD pixel-art style; (2) the defeated villain's sprite — copy the exact design of his orange-and-white petrol grass trimmer (long shaft, engine housing, round cutter blade with green grass bits stuck to it); (3) and (4) the stadium exterior and interior for architecture and pitch layout.
Create a cinematic pixel-art establishing shot, 16:9 composition inside a 1536x1024 canvas — keep every important element inside the central 16:9 band because the top and bottom ~80 px will be cropped.
Scene: the football stadium pitch in the middle of the night, long after a celebration ended. The stands are empty, most floodlights are off and one flickers. Deep blue-violet night, a huge pale moon, a few stars. In the centre of the pitch a patch of golden grass still glows softly gold; scraps of confetti and a couple of fallen mint pennant flags lie on the ground. In the lower-right third of the frame, lying on the grass at the edge of the glowing patch, is the villain's dropped orange-and-white grass trimmer, its blade catching a thin glint of moonlight; a small ring of grass around the blade has already turned grey-yellow and withered. From the right edge of the frame a long, dark, round-and-chubby shadow with a curly-hair silhouette stretches across the grass toward the trimmer, and one small sky-cyan (#6adcf2) glint lights the ground at the very edge of the frame. The owner of the shadow is NOT visible — no character appears in the frame.
Mood: quiet, eerie but playful, the calm before the next story. Camera: wide shot, slightly high 3/4 angle, the trimmer is the focal point. Style: high-detail modern pixel art with crisp dark-teal outlines, dithering allowed, no smooth anti-aliased gradients, no 3D-render look, no photo texture. Absolutely no text, letters, numbers, logos, subtitles, watermark or drawn letterbox bars.
```

### 2. `pc-02-glove-grab.png` — 컷2 장갑이 움켜쥠

- 저장: `tmp/world-src/ending/pc-02-glove-grab.png` · 세션 `PC-SCENES`(이어서)
- 첨부: ③`ui-loading-bg.png`, ②`char-weedking-stand.png`, ⑤`int-stadium.png`, 0-a `pc-qqq-stand.png`
- 확인: 얼굴·몸통이 화면에 없어야 한다.

```text
Attached: (1) the village panorama for the art style, (2) the villain sprite for the exact design of the orange-and-white grass trimmer, (3) the stadium interior for the grass, (4) the mysterious character's master sprite for the exact glove and hoodie-sleeve design.
Create an extreme close-up cinematic pixel-art shot, 16:9 composition inside a 1536x1024 canvas (keep important elements inside the central 16:9 band; the top and bottom ~80 px will be cropped).
Scene: at night, a cream-white glove (#f6eaec, simple cartoon glove with three fingers and a thumb, dark teal outline) wearing a sky-cyan (#6adcf2) hoodie sleeve with a darker cuff reaches in from the right edge and firmly grips the shaft of the dropped orange-and-white grass trimmer lying on the grass — the exact instant of the grab, knuckles tight, two or three tiny pixel sparks at the contact point. Under and around the glove the blades of grass are turning grey-yellow. The trimmer's round cutter blade catches a thin white glint of moonlight; a few cut grass bits float in the air. The rest of the sleeve leaves the frame: NO face and NO body are visible. Background: dark blue night grass, softly out of focus, with a few faint golden glowing specks far away (made of pixel dots). Camera at ground level, the hand fills the right half, the trimmer runs diagonally from the left.
Mood: tense, tiny comic-villain wink. Style: high-detail modern pixel art, crisp dark-teal outlines, dithering allowed, no smooth anti-aliased gradients, no 3D-render look, no photo texture. No text, letters, numbers, logos, watermark or drawn letterbox bars.
```

### 3. `pc-03-silhouette-rise.png` — 컷3 역광 실루엣

- 저장: `tmp/world-src/ending/pc-03-silhouette-rise.png` · 세션 `PC-SCENES`(이어서)
- 첨부: ①`ref-qqq-original.png`, ③`ui-loading-bg.png`, ②`char-weedking-stand.png`, ⑤`int-stadium.png`, 0-a `pc-qqq-stand.png`, 0-b `pc-qqq-turn.png`
- 확인: 얼굴이 읽히면 실패(컷5에서 처음 공개).

```text
Attached: the original illustration and the master sprite + turnaround of the mysterious character (exact silhouette: round chubby chibi, big voluminous curly hair, oversized hoodie with hood, two dangling drawstrings), the village panorama for art style, the villain sprite for the exact design of the orange-and-white grass trimmer, and the stadium interior.
Create a cinematic pixel-art shot, 16:9 composition inside a 1536x1024 canvas (keep important elements inside the central 16:9 band; the top and bottom ~80 px will be cropped).
Scene: at night in the empty stadium, the mysterious character stands up in the centre-right of the frame, seen from a LOW camera angle, backlit by a huge pale moon and the one remaining floodlight so the whole body reads as a dark silhouette with a thin sky-cyan (#6adcf2) rim light along the hoodie edges, the hood, the outline of the curly hair, the two dangling drawstrings (tiny yellow #f5d233 dashes), and along the shaft of the orange-and-white grass trimmer which he carries over his right shoulder in a swaggering pose. He is still a round chubby chibi about 2.5 heads tall, so the trimmer looks oversized on him. His face stays in deep shadow: only two tiny pale slit-eye glints and one thin curved grin line are faintly visible — the face must NOT be clearly readable. Behind him the empty stands are silhouetted against the moonlit sky. At his feet a small patch of the glowing golden grass is starting to turn grey. Wind moves his hair and hoodie.
Mood: mischievous, ominous, cool. Style: high-detail modern pixel art, crisp outlines, dithering allowed, no smooth anti-aliased gradients, no 3D-render look, no photo texture. No text, letters, numbers, logos, watermark or drawn letterbox bars.
```

### 4. `pc-04-scheme-room.png` — 컷4 음모의 방

- 저장: `tmp/world-src/ending/pc-04-scheme-room.png` · 세션 `PC-SCENES`(이어서)
- 첨부: ③`ui-loading-bg.png`, ⑥`int-factory.png`, ⑦`bld-factory.png`, ②`char-weedking-stand.png`, 0-b `pc-qqq-turn.png`
- 확인: 지도·설계도에 읽히는 글자가 없어야 한다(낙서/도형만).

```text
Attached: the village panorama for art style, the weed-cutting factory's interior and exterior for the environment (grey concrete, rust-orange pipes, chains, machinery), the villain sprite (his spiky crown of spinning mower blades and his orange-and-white trimmer), and the mysterious character's turnaround sheet — use its BACK view.
Create a cinematic pixel-art shot, 16:9 composition inside a 1536x1024 canvas (keep important elements inside the central 16:9 band; the top and bottom ~80 px will be cropped).
Scene: the abandoned grass-cutting factory's basement workshop at midnight, dim and dusty. The only bright light is a sky-cyan (#6adcf2) glow. On the left-centre the mysterious character is seen from BEHIND in a three-quarter back view (round chubby chibi, big curly hair, sky-cyan hoodie with hood down), standing at a huge workbench — his face is NOT visible. On the bench: the orange-and-white grass trimmer laid flat with sky-cyan-glowing cables plugged into its engine as if it is being upgraded; a big hand-drawn pixel map of the village "잔디동" (a stadium in the middle with five districts around it) with big red X marks scribbled over the stadium's golden pitch and a red string linking them — the map has only shapes and scribbles, NO readable text; a rolled blueprint showing a bigger, spikier "weed core" (a round reactor ring with spinning blades) drawn in sky-cyan glowing lines, again with NO readable text or numbers; and a small glass jar holding one tiny glowing golden sprout (the village's golden grass, captured). On the wall behind him his own enormous shadow shows the curly hair with a grin-shaped notch of light, and the defeated villain's crown of mower blades hangs broken on a hook like a trophy. Grey-and-rust factory colours contrasted with the sky-cyan glow.
Mood: scheming, playful cartoon-villain (Saturday-morning cartoon), not gory, not scary for kids. Style: high-detail modern pixel art, crisp dark-teal outlines, dithering allowed, no smooth anti-aliased gradients, no 3D-render look, no photo texture. No text, letters, numbers, logos, watermark or drawn letterbox bars.
```

### 5. `pc-05-eye-v-sign.png` — 컷5 눈가 브이, 얼굴 공개

- 저장: `tmp/world-src/ending/pc-05-eye-v-sign.png` · 세션 `PC-SCENES`(이어서)
- 첨부: ①`ref-qqq-original.png`(브이 포즈 기준), ③`ui-loading-bg.png`, 0-a `pc-qqq-stand.png`

```text
Attached: the original illustration (use its signature pose and exact face style), the mysterious character's master sprite (exact design and palette), and the village panorama for art style.
Create a cinematic pixel-art medium close-up, 16:9 composition inside a 1536x1024 canvas (keep important elements inside the central 16:9 band; the top and bottom ~80 px will be cropped).
Scene: the mysterious character faces the camera for the first time, head slightly tilted, from the chest up, in the same signature pose as the original illustration: his cream-white gloved right hand makes a V-sign (index and middle fingers up) held against the right side of his face right next to his right eye. His FLAT round pale-white face keeps the minimal drawn look — two tiny black slit eyes with short thin brows, a small simple nose, a wide rectangular mouth of a few thick horizontal strokes in a sly, smug grin — with no extra shading, lips, teeth or eyelashes. Voluminous peach-blonde curly hair (#ecba80), sky-cyan (#6adcf2) hoodie with a dark teal inner collar and two yellow (#f5d233) drawstrings. He is a round chubby chibi, cute and cocky. One low sky-cyan spotlight lights him from the front-below. Background: a dark teal hangar, softly out of focus, with the silhouettes of many grass-cutting machines lined up in rows behind him, their little eyes/lights glowing sky-cyan, and one huge sky-cyan-glowing ring (a new weed core) behind his head like an eclipse halo.
Mood: cocky teaser for the next story, comic-villain, not scary. Style: high-detail modern pixel art, crisp dark-teal outlines, dithering allowed, no smooth anti-aliased gradients, no 3D-render look, no photo texture. No text, letters, numbers, logos, watermark or drawn letterbox bars.
```

### 6. `pc-06-village-hint.png` — 컷6 새벽 전경 + 불길한 힌트

- 저장: `tmp/world-src/ending/pc-06-village-hint.png` · 세션 `PC-SCENES`(이어서, 또는 새 대화)
- 첨부: ⑧`ui-loading-bg.png`(같은 구도로 유지)

```text
Keep exactly the same panoramic composition, camera angle, buildings, paths and district layout as the attached village panorama (16:9 composition inside a 1536x1024 canvas, important content inside the central 16:9 band), but change the time to early blue-hour dawn: a soft pink-and-blue sky, the sun not yet risen, low mist between the districts. The village looks healthy and peaceful, lush green, the golden patch of grass in the stadium glowing brightly.
Then add exactly these small ominous hints and nothing else: (1) in the far bottom-right corner, a small patch (about 8% of the image width) of grey-yellow withered ground with thin straight mowed stripes, and a slim column of sky-cyan-tinted (#6adcf2) smoke rising from it; (2) one very small sky-cyan glowing dot moving along the path from that corner toward the stadium; (3) one thin, straight grey mowed line just beginning to cut across the outer edge of the stadium's grass. Everything else stays cheerful. No people, no text, no letters, no numbers, no logos, no watermark.
Style: identical to the attached image — rich, crisp HD pixel art, dark-teal outlines, no smooth anti-aliased gradients, no 3D-render look.
```

## 5. QA 체크리스트 (수령 후 확인)

- [ ] 「???」 얼굴이 원본처럼 **납작하고 단순**하다(코 음영·입술·이빨·속눈썹·홍조 없음), 머리는 복숭아빛 금발 컬, 후드티는 초록기 없는 **하늘색**(원본에 가까움), 노란 끈 2줄, 흰 장갑.
- [ ] 제초기 디자인이 컷1~4에서 같다(주황·흰 엔진식, 원형 날). 제초왕의 왕관은 컷4의 전리품으로만 나온다.
- [ ] 컷1·2·3·4에서 「???」의 얼굴이 보이지 않는다(컷3 실루엣 이목구비 정도만 허용). 얼굴은 컷5에서 처음 공개.
- [ ] 이미지 안에 **글자·숫자·로고가 없다**(특히 컷4 지도·설계도, 컷5 배경 기계).
- [ ] 핵심 요소가 중앙 16:9 띠(위아래 80px 제외) 안에 있다.
- [ ] 조명 흐름: 밤(컷1~5, 하늘색이 유일한 밝은 포인트) → 새벽(컷6). 컷1~5 사이 달·바닥 색이 어긋나지 않는다.
- [ ] 컷6이 `ui-loading-bg`와 같은 구도이고, 힌트(회색 얼룩·하늘색 연기·하늘색 점·잘린 줄)만 추가됐다.
- [ ] 놀림·비하·잔혹 표현 없이 익살스러운 악역 톤이다.

## 6. 수령 후 전달 방법과 개발 세션 메모

**전달**: 파일명을 §0 표와 **완전히 동일하게** 저장해 `tmp/world-src/ending/`에 두고, 투명 PNG인지 마젠타 배경인지(0-a/0-b) 알려 준다.

**구현 결과(S8, 2026-09-20)**

1. **엔딩 단계**: `EndingStage`에 `"stinger"`를 더했다. 흐름은 크레딧 → 스팅어 → `finishEnding()`. 크레딧을 건너뛰어도 스팅어는 보인다. 스팅어 안에서는 Enter로 한 컷씩 넘기고(`state/stinger.ts`의 `advanceStinger`), Esc는 전부 건너뛴다(`state/escape.ts`의 `skip-stinger`, 시작 직후 0.7초는 무시).
2. **저장/재진입**: `ending-seen`은 여전히 **맨 끝**(스팅어 뒤)에서 켠다. 스팅어 도중 월드를 닫으면 엔딩이 개화부터 다시 시작한다. `qqq-stinger-seen` 같은 별도 플래그는 만들지 않았다(확장 스토리가 생기면 추가).
3. **변환/용량**: `world-art-manifest.json`의 `ending` 카테고리와 `convert-world-art.mjs`의 `ending` 분기를 추가했다. 손실 q90으로 6장 약 2.2MB이며, 개화가 시작될 때 `preloadStingerImages()`가 미리 내려받는다(로딩 프리로더에는 넣지 않음).
4. **문서·표기**: [09 §15](09-asset-checklist.md#15-엔딩-크레딧-이후-스팅어-에셋-2026-09-20), [README](README.md)의 문서 지도·S8 핸드오프, `WorldCredits.tsx`의 에셋 수(447 → 453)를 갱신했다.
5. **접근성**: reduced-motion에서 줌·틸트·팬·흔들림을 없애고 페이드만 남긴다. 자막은 `aria-live` 영역에, 컷은 대체 텍스트(`alt`)를 가지며 지나간 컷은 `aria-hidden`이다.
6. **오디오**: 새 파일 없이 기존 것을 재사용했다. 앰비언스 `frost-night`(컷1~3) → `weed`(컷4~5) → `field-day`(컷6), SFX `mower-rev`(컷2·3)·`mission-ready`(컷5). 어울리지 않으면 `data/stingerData.ts`의 `STINGER_CUES`만 바꾼다. 스팅어가 끝나면 그 장면의 앰비언스(스타디움)를 복원한다.

코드: `data/stingerData.ts`(컷·자막·소리 큐) · `state/stinger.ts`(타임라인) · `ui/StingerOverlay.tsx` · `world-mission.css`의 `.world-stinger*` · `WorldOverlay.tsx`. 테스트: `state/stinger.test.ts`, `state/escape.test.ts`, `data/maps/assetSizes.test.ts`, `ui/worldUi.test.tsx`.
