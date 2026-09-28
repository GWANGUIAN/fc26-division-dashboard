# 잔디동 월페이퍼 — 이미지 생성 프롬프트 레퍼런스

향후 추가할 "잔디동 월페이퍼" 기능(전체화면 팝업에서 배경화면 이미지를 구경하고 다운로드하는 기능)에 쓰일 월페이퍼 아트 생성용 프롬프트 모음. 한 장씩 이미지를 만들 때마다 이 문서의 해당 섹션을 참고해서 생성 → 파일명 규칙대로 저장 순으로 진행하면 됨. 이 문서는 프롬프트 정리용이며, 실제 버튼/팝업 UI는 아직 구현되지 않았다(아래 "향후 구현 참고" 섹션에 방향만 적어둠).

## 향후 구현 참고 (UI, 아직 미구현)

- **버튼**: `심심풀이`(`MinigameMenu`, [App.tsx:518](../src/web/App.tsx:518))가 있는 `.bottom-left-toolbar`에서 그 오른쪽에 "잔디동 월페이퍼" 버튼 추가. 한 번도 클릭 안 했을 때 유입 유도 말풍선을 보여주는 패턴은 [PlaylistToggle.tsx](../src/web/PlaylistToggle.tsx) + [playlistStorage.ts](../src/web/playlistStorage.ts)(로컬스토리지 키로 "발견 여부" 기억)와 동일하게 재사용.
- **팝업**: 버튼 클릭 시 전체화면 팝업. 스크롤락+ESC+포커스리턴 패턴은 [CoverLoopPlaylistOverlay.tsx](../src/web/CoverLoopPlaylistOverlay.tsx)/`GroupPhotoOverlay`와 동일하게 재사용.
- **레이아웃**: 팝업 왼쪽에 이미지 썸네일 + 제목이 보이는 세로 스와이퍼 목록, 오른쪽에 선택된 이미지를 크게 보여주는 영역 + 다운로드 버튼.

## 디자인 방향 (중요)

- **범위는 12명으로 고정**: `passedSecondRound: true`인 11명의 최종합격자(재닌·뽀린걸·핑구·문모모·하치·한결·쥬멩이·빙밍·리냐·해파린·다시바) + 로스터에 없는 감독 우왁굳. [`docs/group-photo-prompts.md`](group-photo-prompts.md)가 이미 채택한 범위와 동일 — 새로 2차 합격자가 추가되면 이 문서에 섹션을 더 추가해야 함.
- **컨셉을 다양하게**: 축구 경기 액션, 훈련, 락커룸, 회식/야식, 노래방 뒷풀이, 원정 버스/숙소, 시상식/셀레브레이션, 일상 나들이 등 장면을 44장에 고르게 분산.
- **화풍도 다양하게**: 일본 애니메이션풍, 레트로 픽셀아트, 단색 배경 SD 치비, 3D/픽사풍 렌더, 수채화, 웹툰/코믹북 컷, 파스텔 색연필, 네온 팝아트, 시네마틱 반실사, 레트로 스포츠 포스터, 홀로그램 글리터 치비 등 — 화풍이 애니메이션/픽셀아트/3D처럼 원래 스트리머 그림체와 다른 컷은 "그림체 자체를 이 스타일로 새로 그리되, 얼굴 생김새·헤어스타일 등 인물 특징만 유지"라고 프롬프트에 명시. 반대로 화풍 변경이 없는 컷(반실사/수채화 등)은 group-photo-prompts.md와 같은 원칙으로 "첨부한 레퍼런스 사진의 화풍을 최대한 유지".
- **의상도 다양하게**: 유니폼 외에 트레이닝복, 캐주얼 사복, 잠옷, 겨울 패딩, 여름 원피스, 파티룩, 정장(우왁굳) 등을 컨셉에 맞게 사용.
- **유니폼을 입는 컷**은 [`group-photo-prompts.md`의 "유니폼 레퍼런스" 섹션](group-photo-prompts.md#유니폼-레퍼런스-가장-먼저-생성--완료) 프롬프트로 유니폼 디자인 레퍼런스 이미지를 새로 생성(또는 기존에 만들어 둔 파일)해서 재사용 — 이 문서에서 다시 만들지 않음. 사이트에 올라가는 에셋이 아니라 작업용 참고 이미지이므로 저장소에는 없음.
- **펫 마스코트**: 각 인물은 이미 고유한 팬덤 마스코트 펫이 있음(`scripts/pitch-art-manifest.json`의 `pets.exclusive`). 일상/캐주얼 계열 컷에는 해당 인물의 펫을 작게 동반시켜서 그 사람만의 컷이라는 느낌을 더함.

| 인물 | id | 펫 이름 | 펫 레퍼런스 파일 | 펫 생김새 |
|---|---|---|---|---|
| 우왁굳 | `woowakgood` | 판치 | `tmp/pitch-src/pets/pet-panchi.png` | 크림색 얼굴·귀·손발에 민트색 헤어 스트릭이 있는 통통한 검은 원숭이 |
| 재닌 | `janine95kim` | 구르미 | `tmp/pitch-src/pets/pet-gureumi.png` | 동그란 안경을 쓴 하얀 뭉게구름, 분홍 볼터치 |
| 뽀린걸 | `bboringirl` | 뽀글스 | `tmp/pitch-src/pets/pet-bbogeulseu.png` | 회색 줄무늬 배, 놀란 표정의 동그란 하얀 올빼미/병아리형 새 |
| 핑구 | `sjh4018` | 펭귄 | `tmp/pitch-src/pets/pet-penguin.png` | 금관을 쓴 흑백 펭귄, 나른한 눈, 주황 발 |
| 문모모 | `doormomo` | 웅냐미 | `tmp/pitch-src/pets/pet-ungnami.png` | 이어붙인 자국과 X자 단추눈이 있는 갈색 헝겊 곰인형, 빨간 리본 |
| 하치_HACHI | `hachi97` | 용볼이 | `src/web/assets/pitch/pets/pet-yongboli.webp` | 노란 병아리, 하트 모양 입 |
| 한결___ | `kaksjak0730` | 단결 | `tmp/pitch-src/pets/pet-dangyeol.png` | 연한 하늘색 귀 끝 + 분홍색 꼬리 여러 개(구미호풍)의 하얀 아기고양이 |
| 쥬멩이 | `ju010228` | 돌멩이 | `tmp/pitch-src/pets/pet-dolmengi.png` | 웃는 얼굴의 동글동글한 회색 돌멩이 |
| 빙밍_ | `tleod1818` | 봉바비 | `tmp/pitch-src/pets/pet-bongbabi.png` | 정수리에 초록 새싹이 달린 하얀 찹쌀떡, 울먹이는 표정 |
| 리냐_LINYA | `lina0108` | 뱀수리 | `tmp/pitch-src/pets/pet-baemsuri.png` | 연보라색 동글동글한 알/씨앗 모양, 작은 발 |
| 해파린~ | `haepalin` | 해피 | `tmp/pitch-src/pets/pet-haepi.png` | 보라색 해파리, 늘어진 다리(촉수), 웃는 얼굴 |
| 다시바 | `tdnlamuron` | 시바꺼 | `tmp/pitch-src/pets/pet-sibakkeo.png` | 목에 뼈다귀를 두른 주황색 시바견 강아지, 동그랗게 만 꼬리 |

## 공통 작업 방식

1. **캔버스**: 전부 **3840×2160px**(16:9, 4K 데스크톱 배경화면 규격), 불투명 PNG 또는 JPG로 생성 후 webp로 변환해서 저장. 투명 배경 불필요 — 각 이미지는 배경까지 전부 포함된 완성된 한 장짜리 장면(컷아웃 아님).
2. **바탕화면 배치 고려**: 데스크톱에 깔리면 화면 아이콘이 좌측 상단 열에 겹치는 경우가 많으므로, 인물의 얼굴 등 핵심 요소는 화면 좌측 상단 모서리를 피해 중앙~하단 또는 우측에 배치하도록 프롬프트에 명시.
3. **레퍼런스 이미지 첨부**: 인물마다 **(a) 그 스트리머의 실제 아바타/레퍼런스 사진**을 얼굴·헤어스타일·기존 캐릭터 화풍 참고용으로 첨부. 유니폼을 입는 컷은 **(b) 유니폼 레퍼런스**(위 "디자인 방향" 참고)도 함께 첨부. 펫이 등장하는 컷은 **(c) 해당 인물의 펫 레퍼런스**(위 표의 파일)도 함께 첨부.
4. **파일명 규칙**: 전부 `public/wallpapers/` 아래에 저장. **12명 전원이 한 번에 나오는 단체샷은 두지 않는다** — AI 생성 특성상 인원이 많을수록 얼굴이 뭉개지거나 인원수가 틀어지는 등 실패율이 높기 때문에, "전체가 다 나오는 느낌"은 아래 소그룹들을 여러 컨셉으로 다양하게 조합해서 대신한다.
   - 소그룹(2~5명): `wallpaper-group-01.webp` ~ `wallpaper-group-20.webp`
   - 개인 솔로: `wallpaper-solo-<id>-1.webp`(액션 계열), `wallpaper-solo-<id>-2.webp`(일상/캐주얼 계열) — `<id>`는 위 표의 id 컬럼(우왁굳은 `woowakgood`).
5. 생성 후 프롬프트에 없는 글자/워터마크/로고가 실수로 들어가지 않았는지, 얼굴이 뭉개지지 않았는지 확인 후 저장.

---

## B. 소그룹 (20장)

### 1. 최후의 수비라인 — `wallpaper-group-01.webp`

- **참여 인물**: 재닌, 핑구, 해파린 (3명)
- **파일 경로**: `public/wallpapers/wallpaper-group-01.webp`
- **레퍼런스**: 3명의 (a) 실제 레퍼런스 사진
- **프롬프트**:
  ```
  A dynamic sports illustration wallpaper with bold ink linework and
  vivid flat colors, showing three soccer players mid defensive drill on
  a training pitch — the goalkeeper diving to catch a ball, the two
  center-backs jogging backward in defensive stance, calling out to each
  other. The three characters are the exact people in the attached
  reference photos, redrawn with bold black outlines and dynamic
  cel-shaded color (keep faces and hairstyles recognizable, redraw only
  the rendering technique). All three in training kit — dark athletic
  tracksuits/training tops with mint-green (#00e9ae) trim, the
  goalkeeper additionally wearing padded gloves. Overcast practice-pitch
  background, training cones scattered, soft diffuse daylight.
  Characters positioned across the lower-center of the frame, upper-left
  corner kept relatively open. No readable text, no watermark.
  Landscape, 3840x2160.
  ```
- [x] wallpaper-group-01.webp

### 2. 사이드라인 드리블 듀오 — `wallpaper-group-02.webp`

- **참여 인물**: 하치_HACHI, 다시바 (2명)
- **파일 경로**: `public/wallpapers/wallpaper-group-02.webp`
- **레퍼런스**: 2명의 (a) 실제 레퍼런스 사진
- **프롬프트**:
  ```
  A crisp, classic Japanese cel-shaded anime style wallpaper showing two
  wingers practicing dribbling drills side by side along the touchline —
  one weaving through cone markers with the ball at their feet, the
  other watching and cheering them on. The two characters are the exact
  people in the attached reference photos, redrawn in a clean anime cel-
  shading style with crisp outlines and soft anime-style shading (keep
  faces and hairstyles recognizable, redraw only the rendering
  technique). Both in training kit — light athletic tracksuit tops with
  mint-green (#00e9ae) trim, shin guards visible. Late-afternoon
  training pitch background, warm golden-hour light, long shadows across
  the grass. Figures placed in the lower-right two-thirds of the frame,
  upper-left corner left relatively open. No readable text, no
  watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-group-02.webp

### 3. 패스 훈련 콤비 — `wallpaper-group-03.webp`

- **참여 인물**: 한결___, 뽀린걸 (2명)
- **파일 경로**: `public/wallpapers/wallpaper-group-03.webp`
- **레퍼런스**: 2명의 (a) 실제 레퍼런스 사진
- **프롬프트**:
  ```
  A soft watercolor illustration wallpaper of two midfielders practicing
  short passes back and forth on a quiet training pitch — one mid-pass
  with leg extended, the other trapping the ball with focused
  expression. The two characters are the exact people in the attached
  reference photos, redrawn in a gentle watercolor painting style with
  visible paper texture and soft bleeding edges (keep faces and
  hairstyles recognizable, redraw only the rendering technique). Both in
  training kit — light tracksuit tops with mint-green (#00e9ae) trim.
  Soft morning light, dewy grass, faint mist in the far background.
  Figures placed center-right, upper-left corner left relatively open.
  No readable text, no watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-group-03.webp

### 4. 오버래핑 런 — `wallpaper-group-04.webp`

- **참여 인물**: 빙밍_, 리냐_LINYA (2명)
- **파일 경로**: `public/wallpapers/wallpaper-group-04.webp`
- **레퍼런스**: 2명의 (a) 실제 레퍼런스 사진
- **프롬프트**:
  ```
  A stylized 3D rendered wallpaper of two fullbacks sprinting down the
  touchline side by side in an overlapping run, wind blowing their hair
  back, determined athletic expressions, motion blur trailing behind
  their legs. The two characters are the exact people in the attached
  reference photos, redrawn as clean stylized 3D characters with soft
  studio-quality lighting and glossy highlights (keep faces and
  hairstyles recognizable, redraw only the rendering technique). Both in
  training kit — athletic tracksuit tops with mint-green (#00e9ae) trim.
  Bright training pitch background with shallow depth of field blur.
  Figures placed lower-center-right of frame, upper-left corner left
  relatively open. No readable text, no watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-group-04.webp

### 5. 천타버스 치킨집 회식 — `wallpaper-group-05.webp`

- **참여 인물**: 문모모, 빙밍_ (2명)
- **파일 경로**: `public/wallpapers/wallpaper-group-05.webp`
- **레퍼런스**: 2명의 (a) 실제 레퍼런스 사진
- **프롬프트**:
  ```
  A cozy warm-toned webtoon-style illustration wallpaper of two close
  friends sitting across a small table at a fried-chicken restaurant,
  clinking beer/soda glasses together, a plate of fried chicken and
  sides between them, both laughing mid-toast. The two characters are
  the exact people in the attached reference photos, redrawn in a clean
  Korean webtoon illustration style with soft cel shading and warm color
  grading (keep faces and hairstyles recognizable, redraw only the
  rendering technique). Both in relaxed casual streetwear (not the team
  uniform), different outfits from each other. Warm indoor restaurant
  lighting, neon sign glow visible through a window in the background
  (no readable text on the sign). Figures placed center-right, upper-
  left corner left relatively open. No readable menu text, no watermark.
  Landscape, 3840x2160.
  ```
- [x] wallpaper-group-05.webp

### 6. 전술 보드 앞에서 — `wallpaper-group-06.webp`

- **참여 인물**: 우왁굳, 하치_HACHI, 한결___ (3명)
- **파일 경로**: `public/wallpapers/wallpaper-group-06.webp`
- **레퍼런스**: 3명의 (a) 실제 레퍼런스 사진
- **프롬프트**:
  ```
  A moody monochrome-with-color-accent comic-panel style wallpaper of
  the manager pointing at a tactics whiteboard covered in Xs, Os and
  arrows (no readable text, only abstract diagram marks), while two
  players lean in listening intently, arms crossed. The three characters
  are the exact people in the attached reference photos, redrawn in a
  high-contrast black-and-white comic ink style with a single mint-green
  (#00e9ae) color accent glow from the whiteboard (keep faces and
  hairstyles recognizable, redraw only the rendering technique). The
  manager in a sharp suit with sleeves rolled up, the two players in
  training kit with mint-green trim. Indoor locker-room/meeting-room
  setting, dramatic single-source lighting. Figures placed center-right,
  upper-left corner left relatively open. No readable text, no
  watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-group-06.webp

### 7. 락커룸 파이팅 구호 — `wallpaper-group-07.webp`

- **참여 인물**: 뽀린걸, 쥬멩이, 다시바, 리냐_LINYA (4명)
- **파일 경로**: `public/wallpapers/wallpaper-group-07.webp`
- **레퍼런스**: 4명의 (a) 실제 레퍼런스 사진 + (b) 유니폼 레퍼런스
- **프롬프트**:
  ```
  A punchy neon pop-art poster style wallpaper of four teammates in the
  locker room just before kickoff, stacking hands together in the center
  for a team cheer, big energetic grins, mid-shout. The four characters
  are the exact people in the attached reference photos, redrawn in a
  bold pop-art style with thick outlines, halftone-dot shading and
  vivid neon color accents (keep faces and hairstyles recognizable,
  redraw only the rendering technique). All wearing the exact jersey
  design from the attached uniform reference image. Locker room
  background with neon-tinted rim lighting, mint-green (#00e9ae) and hot
  pink accent lights. Figures placed lower-center of frame, upper-left
  corner left relatively open. No readable text, no watermark.
  Landscape, 3840x2160.
  ```
- [x] wallpaper-group-07.webp

### 8. 원정 버스 안 쪽잠 — `wallpaper-group-08.webp`

- **참여 인물**: 재닌, 핑구, 해파린, 문모모 (4명)
- **파일 경로**: `public/wallpapers/wallpaper-group-08.webp`
- **레퍼런스**: 4명의 (a) 실제 레퍼런스 사진
- **프롬프트**:
  ```
  A soft pastel colored-pencil illustration wallpaper of four teammates
  dozing off together on a team bus during a long away trip — leaning on
  each other's shoulders, one hugging a small travel pillow, soft warm
  window light streaming in, peaceful sleepy expressions. The four
  characters are the exact people in the attached reference photos,
  redrawn in a soft pastel colored-pencil illustration style with
  visible pencil texture and gentle warm lighting (keep faces and
  hairstyles recognizable, redraw only the rendering technique). Casual
  travel outfits — team tracksuit tops over comfortable joggers, each
  person's exact combination slightly different. Bus interior with
  sunset light through the windows, blurred road scenery outside.
  Figures placed center-right, upper-left corner left relatively open.
  No readable text, no watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-group-08.webp

### 9. 결승골 다이빙 세레머니 — `wallpaper-group-09.webp`

- **참여 인물**: 하치_HACHI, 쥬멩이, 다시바, 한결___, 뽀린걸 (5명)
- **파일 경로**: `public/wallpapers/wallpaper-group-09.webp`
- **레퍼런스**: 5명의 (a) 실제 레퍼런스 사진 + (b) 유니폼 레퍼런스
- **프롬프트**:
  ```
  A dynamic comic-book splash-panel style wallpaper of five teammates
  celebrating a decisive goal — sliding on their knees across the grass
  in a line, arms out, mouths open mid-cheer, speed lines and small
  motion-impact marks radiating outward (no text/sound-effect lettering,
  motion graphics only). The five characters are the exact people in the
  attached reference photos, redrawn in a bold American-comic-book ink
  and color style with dynamic foreshortening (keep faces and
  hairstyles recognizable, redraw only the rendering technique). All
  wearing the exact jersey design from the attached uniform reference
  image, grass stains on the knees. Stadium pitch background with
  blurred cheering crowd. Figures placed lower two-thirds of frame,
  upper-left corner left relatively open. No readable text, no
  watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-group-09.webp

### 10. 감독의 특별 골키퍼 클리닉 — `wallpaper-group-10.webp`

- **참여 인물**: 우왁굳, 재닌 (2명)
- **파일 경로**: `public/wallpapers/wallpaper-group-10.webp`
- **레퍼런스**: 2명의 (a) 실제 레퍼런스 사진 + 재닌의 (b) 유니폼 레퍼런스(골키퍼 버전)
- **프롬프트**:
  ```
  A retro 8-bit pixel-art wallpaper styled like a classic sports game
  cutscene, showing the manager rolling a ball toward the goalkeeper for
  one-on-one shot-stopping practice in front of an empty goal, both mid-
  motion. The two characters are chunky, charming 8-bit pixel-art
  sprites whose face/hair silhouette and color palette are clearly
  recognizable as the people in their attached reference photos (keep
  identity readable at pixel scale, redraw only the rendering
  technique). The goalkeeper in the recolored goalkeeper kit from the
  attached uniform reference image with padded gloves, the manager in a
  pixel-art tracksuit. Retro pixel-art training pitch background, goal
  net, limited retro palette, subtle scanline vignette. Figures placed
  lower-center, upper-left corner left open. No readable text, no
  watermark. Landscape, 3840x2160, crisp pixel edges (nearest-neighbor
  upscale).
  ```
- [x] wallpaper-group-10.webp

### 11. 편의점 야식 파티 — `wallpaper-group-11.webp`

- **참여 인물**: 빙밍_, 리냐_LINYA, 해파린~ (3명)
- **파일 경로**: `public/wallpapers/wallpaper-group-11.webp`
- **레퍼런스**: 3명의 (a) 실제 레퍼런스 사진
- **프롬프트**:
  ```
  A cozy nighttime watercolor illustration wallpaper of three friends
  sitting on the curb outside a convenience store at night, eating cup
  noodles and holding canned drinks, warm store lighting spilling out
  behind them, relaxed and giggling. The three characters are the exact
  people in the attached reference photos, redrawn in a warm nighttime
  watercolor style with soft glowing highlights and deep blue-toned
  shadows (keep faces and hairstyles recognizable, redraw only the
  rendering technique). Casual loungewear/streetwear outfits, each
  different. Convenience-store storefront background with warm interior
  light through the windows (no readable store branding/text), a few
  soft bokeh city lights behind. Figures placed lower-center-right,
  upper-left corner left relatively open. No readable text, no
  watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-group-11.webp

### 12. 노래방 뒷풀이 — `wallpaper-group-12.webp`

- **참여 인물**: 쥬멩이, 다시바, 뽀린걸 (3명)
- **파일 경로**: `public/wallpapers/wallpaper-group-12.webp`
- **레퍼런스**: 3명의 (a) 실제 레퍼런스 사진
- **프롬프트**:
  ```
  A sparkly holographic-glitter flat chibi illustration wallpaper of
  three friends singing together at a karaoke room after a match, one
  holding a microphone mid-song, tambourine in the air, colorful
  karaoke-room mood lighting, tiny sparkle and music-note graphic
  accents floating around them (no readable lyrics/text). The three
  characters are the exact people in the attached reference photos,
  redrawn as chibi (super-deformed, big head/small body) characters with
  flat cel shading and a soft holographic sheen on the color palette
  (keep faces and hairstyles recognizable, redraw only the rendering
  technique). Casual party-ready outfits, each different. Karaoke room
  background with neon disco lighting. Figures placed lower-center,
  upper-left corner left relatively open. No readable text, no
  watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-group-12.webp

### 13. 벤치 작전 브리핑 — `wallpaper-group-13.webp`

- **참여 인물**: 우왁굳, 문모모, 핑구, 한결___ (4명)
- **파일 경로**: `public/wallpapers/wallpaper-group-13.webp`
- **레퍼런스**: 4명의 (a) 실제 레퍼런스 사진 + 문모모/핑구/한결의 (b) 유니폼 레퍼런스
- **프롬프트**:
  ```
  A cinematic semi-realistic illustration wallpaper of the manager
  crouching in front of the substitutes' bench, giving last-minute
  instructions to three attentive players sitting on the bench, focused
  and serious expressions, half-time atmosphere. The four characters are
  the exact people in the attached reference photos, rendered with
  cinematic semi-realistic lighting and rich color grading close to the
  reference photos' own art style (keep the reference photos' existing
  rendering technique, just change pose/setting). Players wear the exact
  jersey design from the attached uniform reference image, the manager
  in a tracksuit with the team crest, headset around his neck. Stadium
  tunnel/bench-side background, dramatic stadium floodlight beams. Group
  placed center-right, upper-left corner left relatively open. No
  readable text, no watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-group-13.webp

### 14. 빗속의 운동장 — `wallpaper-group-14.webp`

- **참여 인물**: 하치_HACHI, 리냐_LINYA (2명)
- **파일 경로**: `public/wallpapers/wallpaper-group-14.webp`
- **레퍼런스**: 2명의 (a) 실제 레퍼런스 사진 + (b) 유니폼 레퍼런스
- **프롬프트**:
  ```
  A moody, atmospheric ink-and-watercolor wash illustration wallpaper of
  two players training in the pouring rain, soaked jerseys clinging,
  raindrops splashing off the wet grass, one mid-slide-tackle kicking up
  a spray of water, determined expressions. The two characters are the
  exact people in the attached reference photos, redrawn in a moody
  desaturated ink-wash watercolor style with soft bleeding rain streaks
  (keep faces and hairstyles recognizable, redraw only the rendering
  technique). Both wearing the exact jersey design from the attached
  uniform reference image, visibly rain-soaked. Grey overcast stadium
  background, heavy rain streaks across the whole frame, puddle
  reflections on the pitch. Figures placed lower-center-right, upper-
  left corner left relatively open. No readable text, no watermark.
  Landscape, 3840x2160.
  ```
- [x] wallpaper-group-14.webp

### 15. 시상식 셀카 — `wallpaper-group-15.webp`

- **참여 인물**: 재닌, 뽀린걸, 쥬멩이, 우왁굳 (4명)
- **파일 경로**: `public/wallpapers/wallpaper-group-15.webp`
- **레퍼런스**: 4명의 (a) 실제 레퍼런스 사진 + 재닌/뽀린걸/쥬멩이의 (b) 유니폼 레퍼런스
- **프롬프트**:
  ```
  A festive, sparkling award-ceremony poster style wallpaper of four
  teammates crowding together for a selfie right after winning a trophy
  — one holding a small gold trophy up toward the camera lens, medals
  around their necks, huge happy grins, gold confetti frozen mid-air
  around them. The four characters are the exact people in the attached
  reference photos, redrawn in a glossy celebratory poster-illustration
  style with warm golden rim lighting and sparkle highlights (keep faces
  and hairstyles recognizable, redraw only the rendering technique).
  Players wear the exact jersey design from the attached uniform
  reference image with medals, the manager in a suit with his tie
  loosened, also wearing a medal. Stadium background with warm gold
  confetti and soft bokeh floodlights. Group placed lower-center-right,
  upper-left corner left relatively open. No readable text, no
  watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-group-15.webp

### 16. 보드게임 카페 대결 — `wallpaper-group-16.webp`

- **참여 인물**: 핑구, 해파린~, 문모모 (3명)
- **파일 경로**: `public/wallpapers/wallpaper-group-16.webp`
- **레퍼런스**: 3명의 (a) 실제 레퍼런스 사진
- **프롬프트**:
  ```
  A charming isometric flat-illustration style wallpaper of three
  friends gathered around a small table at a board-game cafe on a day
  off, leaning in over a colorful abstract board game with dice and
  tokens (no readable text/numbers on the board), competitive playful
  grins, one triumphantly holding up a die. The three characters are the
  exact people in the attached reference photos, redrawn in a cozy
  isometric flat-illustration style with soft rounded shapes, warm
  cafe-toned flat colors and simple long shadows (keep faces and
  hairstyles recognizable, redraw only the rendering technique). Casual
  comfortable outfits (sweaters/cardigans), each different, not the
  uniform. Warm board-game cafe interior background with shelves of
  games softly blurred behind them. Figures placed lower-center-right,
  upper-left corner left relatively open. No readable text, no
  watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-group-16.webp

### 17. 헬스장 웨이트 트레이닝 — `wallpaper-group-17.webp`

- **참여 인물**: 빙밍_, 핑구, 우왁굳 (3명)
- **파일 경로**: `public/wallpapers/wallpaper-group-17.webp`
- **레퍼런스**: 3명의 (a) 실제 레퍼런스 사진
- **프롬프트**:
  ```
  A high-contrast monochrome illustration wallpaper with a single hot
  neon-magenta rim-light accent, showing two players doing gym weight
  training (one spotting a barbell, one mid-rep on a bench) while the
  manager stands nearby with a clipboard checking their form, gritty
  determined gym atmosphere. The three characters are the exact people
  in the attached reference photos, redrawn in a bold monochrome
  illustration style (black/grey/white) with a single vivid neon-magenta
  rim-light accent glowing along their silhouettes (keep faces and
  hairstyles recognizable, redraw only the rendering technique). Players
  in athletic gym wear (tank top, shorts, lifting gloves), the manager in
  a fitted track jacket, not the match uniform. Dim gym interior
  background with equipment silhouettes, dramatic side lighting. Figures
  placed lower-center-right, upper-left corner left relatively open. No
  readable text, no watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-group-17.webp

### 18. 영화관 팝콘 데이트 — `wallpaper-group-18.webp`

- **참여 인물**: 문모모, 빙밍_, 해파린~ (3명)
- **파일 경로**: `public/wallpapers/wallpaper-group-18.webp`
- **레퍼런스**: 3명의 (a) 실제 레퍼런스 사진
- **프롬프트**:
  ```
  A soft pastel romantic illustration wallpaper of three friends sitting
  together in a movie theater on an off day, sharing a big bucket of
  popcorn between them, 3D glasses pushed up on their foreheads, faces
  lit by the glow of the screen, cozy relaxed smiles. The three
  characters are the exact people in the attached reference photos,
  redrawn in a soft pastel romantic-illustration style with warm/cool
  screen-glow contrast lighting (keep faces and hairstyles recognizable,
  redraw only the rendering technique). Casual comfortable outfits
  (hoodies/cardigans), each different, not the uniform. Dark movie-
  theater background with a bright out-of-focus screen glow behind them
  (no readable screen content). Figures placed lower-center-right, upper-
  left corner left relatively open. No readable text, no watermark.
  Landscape, 3840x2160.
  ```
- [x] wallpaper-group-18.webp

### 19. 놀이공원 롤러코스터 — `wallpaper-group-19.webp`

- **참여 인물**: 핑구, 다시바, 리냐_LINYA (3명)
- **파일 경로**: `public/wallpapers/wallpaper-group-19.webp`
- **레퍼런스**: 3명의 (a) 실제 레퍼런스 사진
- **프롬프트**:
  ```
  An exaggerated, energetic comic-illustration style wallpaper of three
  friends riding a roller coaster together at an amusement park, arms
  thrown up in the air, exaggerated screaming/laughing expressions, hair
  whipped back by the speed, the coaster track curving dramatically
  behind them. The three characters are the exact people in the attached
  reference photos, redrawn in a bold exaggerated comic-illustration
  style with bouncy motion lines and vivid saturated color (keep faces
  and hairstyles recognizable, redraw only the rendering technique).
  Casual amusement-park outfits, each different, not the uniform. Bright
  amusement-park background with a Ferris wheel and colorful ride lights
  softly blurred behind them. Figures placed lower-center-right, upper-
  left corner left relatively open. No readable text, no watermark.
  Landscape, 3840x2160.
  ```
- [x] wallpaper-group-19.webp

---

## C. 개인 솔로 (12명 × 2장 = 24장)

### 재닌 (`janine95kim`)

#### 1. 결정적인 다이빙 세이브 — `wallpaper-solo-janine95kim-1.webp`

- **파일 경로**: `public/wallpapers/wallpaper-solo-janine95kim-1.webp`
- **레퍼런스**: 재닌의 (a) 실제 레퍼런스 사진 + (b) 유니폼 레퍼런스(골키퍼 버전)
- **프롬프트**:
  ```
  A dramatic Japanese shonen-manga "finishing move" splash-illustration
  style wallpaper of a goalkeeper making a spectacular full-stretch
  diving save, fully airborne, ball just grazing her fingertips, intense
  focused expression, dramatic speed lines radiating from the point of
  impact, dust and grass kicked up beneath her. The character is the
  exact person in the attached reference photo, redrawn in a bold
  shonen-manga splash-page style with dynamic ink linework and dramatic
  screentone-style shading (keep face and hairstyle recognizable, redraw
  only the rendering technique). Wearing the recolored goalkeeper
  version of the exact kit shown in the attached uniform reference
  image, padded gloves. Stadium goal-net background, dramatic low
  camera angle, sun flare. Character placed lower-center-right of frame,
  upper-left corner left relatively open for desktop icons. No readable
  text, no watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-solo-janine95kim-1.webp

#### 2. 회식 자리 건배 — `wallpaper-solo-janine95kim-2.webp`

- **파일 경로**: `public/wallpapers/wallpaper-solo-janine95kim-2.webp`
- **레퍼런스**: 재닌의 (a) 실제 레퍼런스 사진 + (c) 펫 레퍼런스(구르미, `tmp/pitch-src/pets/pet-gureumi.png`)
- **프롬프트**:
  ```
  A gentle warm watercolor illustration wallpaper of her sitting at a
  restaurant table, raising a drink glass with a bright cheerful smile
  mid-toast, her fluffy round cloud-shaped pet with tiny round glasses
  (exactly like the attached pet reference image) perched happily on the
  table beside her plate. The character is the exact person in the
  attached reference photo, redrawn in a soft warm watercolor painting
  style with visible paper texture (keep face and hairstyle recognizable,
  redraw only the rendering technique). Wearing a cozy casual knit
  sweater, not the uniform. Warm restaurant interior background with
  string lights, soft bokeh. Character placed lower-center-right, upper-
  left corner left relatively open. No readable text, no watermark.
  Landscape, 3840x2160.
  ```
- [x] wallpaper-solo-janine95kim-2.webp

### 뽀린걸 (`bboringirl`)

#### 1. 락커룸, 신발끈을 묶으며 — `wallpaper-solo-bboringirl-1.webp`

- **파일 경로**: `public/wallpapers/wallpaper-solo-bboringirl-1.webp`
- **레퍼런스**: 뽀린걸의 (a) 실제 레퍼런스 사진 + (b) 유니폼 레퍼런스
- **프롬프트**:
  ```
  A moody black-and-white ink line-art wallpaper with sparse light
  color accents (Japanese sports-manga pre-match panel style), showing
  her sitting on a locker-room bench, one foot up, focused expression
  while tying her boot laces, kit bag beside her, quiet pre-match
  determination. The character is the exact person in the attached
  reference photo, redrawn in a fine monochrome ink line-art style with
  cross-hatched shading and a single warm accent color on the jersey
  (keep face and hairstyle recognizable, redraw only the rendering
  technique). Wearing the exact jersey/shorts/socks design from the
  attached uniform reference image. Locker room background, single
  overhead light source, soft shadows. Character placed lower-center-
  right, upper-left corner left relatively open. No readable text, no
  watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-solo-bboringirl-1.webp

#### 2. 치비 프로필 — `wallpaper-solo-bboringirl-2.webp`

- **파일 경로**: `public/wallpapers/wallpaper-solo-bboringirl-2.webp`
- **레퍼런스**: 뽀린걸의 (a) 실제 레퍼런스 사진 + (c) 펫 레퍼런스(뽀글스, `tmp/pitch-src/pets/pet-bbogeulseu.png`)
- **프롬프트**:
  ```
  A cute flat-color SD chibi illustration wallpaper on a single solid
  mint-green (#00e9ae) background — her drawn as a chibi (super-deformed,
  big head/small body) character striking a cheerful peace-sign pose,
  her round owl-like pet with striped belly (exactly like the attached
  pet reference image) sitting on her shoulder. The character is the
  exact person in the attached reference photo, redrawn as a chibi
  character with flat cel shading, thick clean outlines and simple
  rounded shapes (keep face and hairstyle recognizable, redraw only the
  rendering technique). Casual comfy tracksuit outfit, not the uniform.
  Completely flat solid-color background with no scenery, small simple
  decorative shapes (stars/sparkles) scattered around. Character and pet
  placed lower-center-right, upper-left corner left relatively open. No
  readable text, no watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-solo-bboringirl-2.webp

### 핑구 (`sjh4018`)

#### 1. 헤더 경합 — `wallpaper-solo-sjh4018-1.webp`

- **파일 경로**: `public/wallpapers/wallpaper-solo-sjh4018-1.webp`
- **레퍼런스**: 핑구의 (a) 실제 레퍼런스 사진 + (b) 유니폼 레퍼런스
- **프롬프트**:
  ```
  A vibrant 3D Pixar-style rendered wallpaper of a center-back leaping
  high to win a header, body fully extended mid-air, eyes locked on the
  ball, intense athletic expression. The character is the exact person
  in the attached reference photo, redrawn as a clean stylized 3D
  character with soft global illumination and glossy highlights (keep
  face shape, hairstyle and identity recognizable, redraw only the
  rendering technique). Wearing the exact jersey/shorts/socks design
  from the attached uniform reference image. Bright stadium pitch
  background with shallow depth-of-field blur, sunlight rim-lighting the
  silhouette. Character placed lower-center-right of frame, upper-left
  corner left relatively open. No readable text, no watermark.
  Landscape, 3840x2160, cinematic 3D render quality.
  ```
- [x] wallpaper-solo-sjh4018-1.webp

#### 2. 겨울 패딩 입고 원정길 — `wallpaper-solo-sjh4018-2.webp`

- **파일 경로**: `public/wallpapers/wallpaper-solo-sjh4018-2.webp`
- **레퍼런스**: 핑구의 (a) 실제 레퍼런스 사진 + (c) 펫 레퍼런스(펭귄, `tmp/pitch-src/pets/pet-penguin.png`)
- **프롬프트**:
  ```
  A soft pastel colored-pencil illustration wallpaper of him bundled up
  in a big fluffy winter parka and scarf, walking through a snowy street
  toward an away match, breath visible in the cold air, his little crown
  -wearing penguin pet (exactly like the attached pet reference image)
  waddling along beside him in the snow — a playful visual pun about
  penguins in winter. The character is the exact person in the attached
  reference photo, redrawn in a soft pastel colored-pencil style with
  visible pencil texture (keep face and hairstyle recognizable, redraw
  only the rendering technique). Wearing a thick casual winter coat/
  parka, scarf and beanie, not the uniform. Snowy city-street background
  with soft falling snow, warm streetlights. Character placed lower-
  center-right, upper-left corner left relatively open. No readable
  text, no watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-solo-sjh4018-2.webp

### 문모모 (`doormomo`)

#### 1. 전술 노트를 보며 — `wallpaper-solo-doormomo-1.webp`

- **파일 경로**: `public/wallpapers/wallpaper-solo-doormomo-1.webp`
- **레퍼런스**: 문모모의 (a) 실제 레퍼런스 사진 + (b) 유니폼 레퍼런스
- **프롬프트**:
  ```
  A cinematic semi-realistic illustration wallpaper of her sitting on
  the locker-room bench studying a small tactics notebook, focused calm
  expression, boots and kit bag beside her. The character is the exact
  person in the attached reference photo, rendered with cinematic
  semi-realistic lighting and rich color grading close to the reference
  photo's own art style (keep the reference photo's existing rendering
  technique, just change pose/setting). Wearing the exact jersey/shorts/
  socks design from the attached uniform reference image. Locker room
  background, single warm spotlight, soft shadow. Character placed
  lower-center-right, upper-left corner left relatively open. No
  readable text on the notebook, no watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-solo-doormomo-1.webp

#### 2. 시상식 정장 — `wallpaper-solo-doormomo-2.webp`

- **파일 경로**: `public/wallpapers/wallpaper-solo-doormomo-2.webp`
- **레퍼런스**: 문모모의 (a) 실제 레퍼런스 사진 + (c) 펫 레퍼런스(웅냐미, `tmp/pitch-src/pets/pet-ungnami.png`)
- **프롬프트**:
  ```
  A glossy magazine-cover vector illustration wallpaper of her dressed
  up for an awards ceremony in an elegant outfit, confident pose with
  one hand on her hip, holding a small trophy, her stitched teddy-bear
  plush pet with button eyes and a red ribbon (exactly like the attached
  pet reference image) tucked under her other arm. The character is the
  exact person in the attached reference photo, redrawn in a clean
  glossy vector-illustration magazine-cover style with bold flat shapes
  and smooth gradients (keep face and hairstyle recognizable, redraw
  only the rendering technique). Wearing an elegant formal outfit (dress
  or tailored suit), not the team uniform. Soft studio-backdrop
  background with a subtle spotlight and sparkle bokeh. Character placed
  lower-center-right, upper-left corner left relatively open. No
  readable text, no watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-solo-doormomo-2.webp

### 하치_HACHI (`hachi97`)

#### 1. 필살 슈팅 — `wallpaper-solo-hachi97-1.webp`

- **파일 경로**: `public/wallpapers/wallpaper-solo-hachi97-1.webp`
- **레퍼런스**: 하치의 (a) 실제 레퍼런스 사진 + (b) 유니폼 레퍼런스
- **프롬프트**:
  ```
  A dramatic Japanese shonen-manga "finishing move" splash-illustration
  style wallpaper of him unleashing a powerful shot, leg fully extended
  mid-strike, a stylized swirling dragon-shaped energy effect coiling
  around the striking leg and the ball (a nod to his "dragon" persona,
  effect only, no literal creature), intense fierce expression, dramatic
  speed lines. The character is the exact person in the attached
  reference photo, redrawn in a bold shonen-manga splash-page style with
  dynamic ink linework and screentone-style shading (keep face and
  hairstyle recognizable, redraw only the rendering technique). Wearing
  the exact jersey/shorts/socks design from the attached uniform
  reference image. Stadium pitch background, dramatic low camera angle,
  sun flare behind him. Character placed lower-center-right, upper-left
  corner left relatively open. No readable text, no watermark.
  Landscape, 3840x2160.
  ```
- [x] wallpaper-solo-hachi97-1.webp

#### 2. 편의점 야식 컵라면 — `wallpaper-solo-hachi97-2.webp`

- **파일 경로**: `public/wallpapers/wallpaper-solo-hachi97-2.webp`
- **레퍼런스**: 하치의 (a) 실제 레퍼런스 사진 + (c) 펫 레퍼런스(용볼이, `src/web/assets/pitch/pets/pet-yongboli.webp`)
- **프롬프트**:
  ```
  A retro 16-bit pixel-art wallpaper of him sitting on a convenience-
  store bench late at night eating cup noodles with chopsticks, content
  relaxed expression, his tiny yellow chick-like pet with a heart-shaped
  mouth (exactly like the attached pet reference image) perched on the
  bench beside him. The character is a chunky, charming 16-bit pixel-art
  sprite whose face/hair silhouette and color palette are clearly
  recognizable as the person in the attached reference photo (keep
  identity readable at pixel scale, redraw only the rendering
  technique). Wearing a casual hoodie/sweatshirt, not the uniform. Retro
  pixel-art convenience-store storefront background at night with warm
  glowing windows, limited retro color palette. Character placed lower-
  center-right, upper-left corner left relatively open. No readable
  text, no watermark. Landscape, 3840x2160, crisp pixel edges
  (nearest-neighbor upscale).
  ```
- [x] wallpaper-solo-hachi97-2.webp

### 한결___ (`kaksjak0730`)

#### 1. 프리킥 앞에서 — `wallpaper-solo-kaksjak0730-1.webp`

- **파일 경로**: `public/wallpapers/wallpaper-solo-kaksjak0730-1.webp`
- **레퍼런스**: 한결의 (a) 실제 레퍼런스 사진 + (b) 유니폼 레퍼런스
- **프롬프트**:
  ```
  A cool-toned Japanese anime illustration wallpaper of her standing
  perfectly still behind a free kick, eyes closed for a moment of
  concentration, faint icy-blue particle/frost effects drifting off her
  silhouette (a nod to her "ice princess" nickname, effect only, subtle
  and elegant), the wall of defenders blurred in the far background. The
  character is the exact person in the attached reference photo, redrawn
  in a crisp cool-toned anime cel-shading style with blue-tinted
  lighting (keep face and hairstyle recognizable, redraw only the
  rendering technique). Wearing the exact jersey/shorts/socks design
  from the attached uniform reference image. Cool overcast stadium pitch
  background, soft blue color grade. Character placed lower-center-
  right, upper-left corner left relatively open. No readable text, no
  watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-solo-kaksjak0730-1.webp

#### 2. 카페에서의 오후 — `wallpaper-solo-kaksjak0730-2.webp`

- **파일 경로**: `public/wallpapers/wallpaper-solo-kaksjak0730-2.webp`
- **레퍼런스**: 한결의 (a) 실제 레퍼런스 사진 + (c) 펫 레퍼런스(단결, `tmp/pitch-src/pets/pet-dangyeol.png`)
- **프롬프트**:
  ```
  A soft pastel watercolor illustration wallpaper of her relaxing at a
  window-side cafe table with a warm drink, gentle content smile looking
  out the window, her fluffy white kitten pet with multiple pink-tipped
  tails (exactly like the attached pet reference image) curled up asleep
  on the table beside her cup. The character is the exact person in the
  attached reference photo, redrawn in a soft pastel watercolor
  illustration style with gentle washes of color (keep face and
  hairstyle recognizable, redraw only the rendering technique). Wearing
  a cozy casual knit outfit, not the uniform. Warm sunlit cafe interior
  background, soft bokeh. Character placed lower-center-right, upper-
  left corner left relatively open. No readable text, no watermark.
  Landscape, 3840x2160.
  ```
- [x] wallpaper-solo-kaksjak0730-2.webp

### 쥬멩이 (`ju010228`)

#### 1. 결승골의 순간 — `wallpaper-solo-ju010228-1.webp`

- **파일 경로**: `public/wallpapers/wallpaper-solo-ju010228-1.webp`
- **레퍼런스**: 쥬멩이의 (a) 실제 레퍼런스 사진 + (b) 유니폼 레퍼런스
- **프롬프트**:
  ```
  A dynamic Korean webtoon comic-panel style wallpaper of her sliding on
  her knees across the grass in a solo goal celebration right after
  scoring the winning goal, arms spread wide, fists clenched, huge
  triumphant grin, small motion-impact marks around her (no text/sound-
  effect lettering, motion graphics only). The character is the exact
  person in the attached reference photo, redrawn in a clean modern
  webtoon illustration style with bold outlines and vivid flat-cel
  coloring (keep face and hairstyle recognizable, redraw only the
  rendering technique). Wearing the exact jersey/shorts/socks design
  from the attached uniform reference image, grass stains on the knees.
  Stadium pitch background with blurred cheering crowd. Character placed
  lower-center-right, upper-left corner left relatively open. No
  readable text, no watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-solo-ju010228-1.webp

#### 2. 원정 숙소, 잠옷 차림 — `wallpaper-solo-ju010228-2.webp`

- **파일 경로**: `public/wallpapers/wallpaper-solo-ju010228-2.webp`
- **레퍼런스**: 쥬멩이의 (a) 실제 레퍼런스 사진 + (c) 펫 레퍼런스(돌멩이, `tmp/pitch-src/pets/pet-dolmengi.png`)
- **프롬프트**:
  ```
  A cute flat pastel chibi illustration wallpaper of her lounging on a
  hotel bed in comfy pajamas during an away trip, hugging a pillow with
  a sleepy happy expression, her round smiling grey pebble-shaped pet
  (exactly like the attached pet reference image) sitting on the
  blanket beside her. The character is the exact person in the attached
  reference photo, redrawn as a chibi character with flat cel shading
  and soft pastel colors (keep face and hairstyle recognizable, redraw
  only the rendering technique). Wearing cozy pajamas, not the uniform.
  Simple cozy hotel-room background, warm lamp light, soft pastel color
  grade. Character placed lower-center-right, upper-left corner left
  relatively open. No readable text, no watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-solo-ju010228-2.webp

### 빙밍_ (`tleod1818`)

#### 1. 오버래핑 크로스 — `wallpaper-solo-tleod1818-1.webp`

- **파일 경로**: `public/wallpapers/wallpaper-solo-tleod1818-1.webp`
- **레퍼런스**: 빙밍의 (a) 실제 레퍼런스 사진 + (b) 유니폼 레퍼런스
- **프롬프트**:
  ```
  A warm, hand-painted Ghibli-inspired anime illustration wallpaper of
  her mid-sprint down the wing about to whip in a cross, hair and jersey
  flowing with the motion, focused determined expression, painterly
  natural lighting. The character is the exact person in the attached
  reference photo, redrawn in a warm hand-painted Ghibli-style anime
  illustration with soft natural light and gentle color grading (keep
  face and hairstyle recognizable, redraw only the rendering technique).
  Wearing the exact jersey/shorts/socks design from the attached uniform
  reference image. Sunny training-pitch background with soft painterly
  clouds. Character placed lower-center-right, upper-left corner left
  relatively open. No readable text, no watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-solo-tleod1818-1.webp

#### 2. 노래방 마이크 — `wallpaper-solo-tleod1818-2.webp`

- **파일 경로**: `public/wallpapers/wallpaper-solo-tleod1818-2.webp`
- **레퍼런스**: 빙밍의 (a) 실제 레퍼런스 사진 + (c) 펫 레퍼런스(봉바비, `tmp/pitch-src/pets/pet-bongbabi.png`)
- **프롬프트**:
  ```
  A vivid neon pop-art illustration wallpaper of her singing into a
  karaoke microphone with an energetic joyful expression, colorful stage
  -light beams behind her, her round white rice-cake-shaped pet with a
  little green sprout on top (exactly like the attached pet reference
  image) bouncing along beside her feet. The character is the exact
  person in the attached reference photo, redrawn in a bold neon pop-art
  style with thick outlines and vivid magenta/cyan lighting (keep face
  and hairstyle recognizable, redraw only the rendering technique).
  Wearing a fun casual party outfit, not the uniform. Karaoke-room
  background with colorful disco lighting. Character placed lower-
  center-right, upper-left corner left relatively open. No readable
  text, no watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-solo-tleod1818-2.webp

### 리냐_LINYA (`lina0108`)

#### 1. 사이드라인 드리블 돌파 — `wallpaper-solo-lina0108-1.webp`

- **파일 경로**: `public/wallpapers/wallpaper-solo-lina0108-1.webp`
- **레퍼런스**: 리냐의 (a) 실제 레퍼런스 사진 + (b) 유니폼 레퍼런스
- **프롬프트**:
  ```
  A sleek stylized 3D rendered wallpaper of her dribbling at full speed
  past a defender along the touchline, ball glued to her feet, sharp
  focused competitive expression, motion blur trailing behind her boots.
  The character is the exact person in the attached reference photo,
  redrawn as a clean stylized 3D character with soft studio-quality
  lighting and glossy highlights (keep face shape, hairstyle and
  identity recognizable, redraw only the rendering technique). Wearing
  the exact jersey/shorts/socks design from the attached uniform
  reference image. Bright stadium pitch background with shallow depth-
  of-field blur. Character placed lower-center-right, upper-left corner
  left relatively open. No readable text, no watermark. Landscape,
  3840x2160, cinematic 3D render quality.
  ```
- [x] wallpaper-solo-lina0108-1.webp

#### 2. 장난스러운 셀카 — `wallpaper-solo-lina0108-2.webp`

- **파일 경로**: `public/wallpapers/wallpaper-solo-lina0108-2.webp`
- **레퍼런스**: 리냐의 (a) 실제 레퍼런스 사진 + (c) 펫 레퍼런스(뱀수리, `tmp/pitch-src/pets/pet-baemsuri.png`)
- **프롬프트**:
  ```
  A cute flat SNS-sticker style illustration wallpaper of her taking a
  playful selfie, holding up a peace sign with a silly cross-eyed
  expression (a nod to her "cross-eyed" nickname, playful and cute, not
  unflattering), her small pale-lavender round egg-shaped pet (exactly
  like the attached pet reference image) peeking into the frame from one
  side. The character is the exact person in the attached reference
  photo, redrawn as a flat sticker-style illustration with bold clean
  outlines and a thin white sticker border implied around the whole
  scene's focal subject (subtle, not a literal die-cut sticker over the
  whole wallpaper) (keep face and hairstyle recognizable, redraw only
  the rendering technique). Wearing a cute casual outfit, not the
  uniform. Bright simple pastel-gradient background. Character placed
  lower-center-right, upper-left corner left relatively open. No
  readable text, no watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-solo-lina0108-2.webp

### 해파린~ (`haepalin`)

#### 1. 완벽한 태클 — `wallpaper-solo-haepalin-1.webp`

- **파일 경로**: `public/wallpapers/wallpaper-solo-haepalin-1.webp`
- **레퍼런스**: 해파린의 (a) 실제 레퍼런스 사진 + (b) 유니폼 레퍼런스
- **프롬프트**:
  ```
  A striking monochrome-with-single-color-accent sports poster style
  wallpaper of her executing a perfectly timed sliding tackle, sliding
  low across the grass with the ball cleanly won, intense focused
  expression, dust/grass kicked up around the slide. The character is
  the exact person in the attached reference photo, redrawn in a bold
  monochrome poster-illustration style with a single mint-green
  (#00e9ae) color accent on the jersey trim (keep face and hairstyle
  recognizable, redraw only the rendering technique). Wearing the exact
  jersey/shorts/socks design from the attached uniform reference image.
  Stadium pitch background rendered in the same desaturated monochrome
  tone. Character placed lower-center-right, upper-left corner left
  relatively open. No readable text, no watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-solo-haepalin-1.webp

#### 2. 여름 바닷가 나들이 — `wallpaper-solo-haepalin-2.webp`

- **파일 경로**: `public/wallpapers/wallpaper-solo-haepalin-2.webp`
- **레퍼런스**: 해파린의 (a) 실제 레퍼런스 사진 + (c) 펫 레퍼런스(해피, `tmp/pitch-src/pets/pet-haepi.png`)
- **프롬프트**:
  ```
  A breezy summer watercolor illustration wallpaper of her walking along
  a sunny beach boardwalk in a light summer outfit, holding sandals in
  one hand, relaxed happy smile, her small purple jellyfish-shaped pet
  with dangling tentacle-legs (exactly like the attached pet reference
  image) floating playfully beside her — a gentle visual pun about
  jellyfish at the beach. The character is the exact person in the
  attached reference photo, redrawn in a light airy watercolor
  illustration style with bright summery color washes (keep face and
  hairstyle recognizable, redraw only the rendering technique). Wearing
  a light casual summer dress/outfit, not the uniform. Sunny beach
  background with turquoise ocean and soft clouds. Character placed
  lower-center-right, upper-left corner left relatively open. No
  readable text, no watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-solo-haepalin-2.webp

### 다시바 (`tdnlamuron`)

#### 1. 스피드 돌파 — `wallpaper-solo-tdnlamuron-1.webp`

- **파일 경로**: `public/wallpapers/wallpaper-solo-tdnlamuron-1.webp`
- **레퍼런스**: 다시바의 (a) 실제 레퍼런스 사진 + (b) 유니폼 레퍼런스
- **프롬프트**:
  ```
  A high-energy dynamic illustration wallpaper with heavy motion-blur
  emphasis, showing her bursting past a defender at full sprint with the
  ball, strong forward-leaning motion, hair and jersey streaking behind
  her from the speed, fierce competitive expression. The character is
  the exact person in the attached reference photo, redrawn in a dynamic
  illustration style with exaggerated motion-blur streaks and radial
  speed lines (keep face and hairstyle recognizable, redraw only the
  rendering technique). Wearing the exact jersey/shorts/socks design
  from the attached uniform reference image. Blurred stadium pitch
  background emphasizing the sense of speed. Character placed lower-
  center-right, upper-left corner left relatively open. No readable
  text, no watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-solo-tdnlamuron-1.webp

#### 2. 공원 산책 — `wallpaper-solo-tdnlamuron-2.webp`

- **파일 경로**: `public/wallpapers/wallpaper-solo-tdnlamuron-2.webp`
- **레퍼런스**: 다시바의 (a) 실제 레퍼런스 사진 + (c) 펫 레퍼런스(시바꺼, `tmp/pitch-src/pets/pet-sibakkeo.png`)
- **프롬프트**:
  ```
  A warm colored-pencil illustration wallpaper of her walking through a
  sunny park path in a casual tracksuit, relaxed content smile, her
  small orange shiba-inu puppy pet with a curled tail and a bone-shaped
  collar charm (exactly like the attached pet reference image) trotting
  happily beside her on a leash. The character is the exact person in
  the attached reference photo, redrawn in a warm colored-pencil
  illustration style with visible pencil texture and soft natural
  lighting (keep face and hairstyle recognizable, redraw only the
  rendering technique). Wearing a comfortable casual tracksuit/athleisure
  outfit, not the match uniform. Sunny park background with trees and
  soft dappled light. Character placed lower-center-right, upper-left
  corner left relatively open. No readable text, no watermark.
  Landscape, 3840x2160.
  ```
- [x] wallpaper-solo-tdnlamuron-2.webp

### 우왁굳 (`woowakgood`)

#### 1. 사이드라인의 지휘 — `wallpaper-solo-woowakgood-1.webp`

- **파일 경로**: `public/wallpapers/wallpaper-solo-woowakgood-1.webp`
- **레퍼런스**: 우왁굳의 (a) 실제 레퍼런스 사진(유니폼 레퍼런스 불필요 — 정장)
- **프롬프트**:
  ```
  A cinematic semi-realistic illustration wallpaper of the manager
  standing on the touchline mid-match, one arm raised shouting
  instructions toward the pitch, tie loosened, sleeves rolled up,
  intense focused expression, headset around his neck. The character is
  the exact person in the attached reference image — keep the face,
  hairstyle, and headset design identical to the reference. Rendered
  with cinematic semi-realistic lighting and rich color grading close to
  the reference photo's own art style (keep the reference photo's
  existing rendering technique, just change pose/setting). Wearing a
  sharp well-tailored suit (dark navy or charcoal jacket and trousers,
  white dress shirt) with a tie in mint-green (#00e9ae). Stadium
  touchline background with dramatic floodlights, blurred pitch action
  behind him. Character placed lower-center-right, upper-left corner
  left relatively open. No readable text, no watermark. Landscape,
  3840x2160.
  ```
- [x] wallpaper-solo-woowakgood-1.webp

#### 2. 회식 자리 건배사 — `wallpaper-solo-woowakgood-2.webp`

- **파일 경로**: `public/wallpapers/wallpaper-solo-woowakgood-2.webp`
- **레퍼런스**: 우왁굳의 (a) 실제 레퍼런스 사진 + (c) 펫 레퍼런스(판치, `tmp/pitch-src/pets/pet-panchi.png`)
- **프롬프트**:
  ```
  A warm, friendly webtoon-style illustration wallpaper of the manager
  standing up at the head of the team dinner table, raising his glass
  high mid-toast-speech with a big warm proud smile, his chubby
  black-furred monkey-like pet with cream ears/paws and a mint-blue hair
  streak (exactly like the attached pet reference image) sitting on the
  table looking up at him. The character is the exact person in the
  attached reference image — keep the face, hairstyle, and headset
  design identical to the reference, redrawn in a clean warm webtoon
  illustration style with soft cel shading (redraw only the rendering
  technique). Wearing a casual open-collar shirt, not a suit. Warm
  restaurant interior background with string lights and soft bokeh.
  Character placed lower-center-right, upper-left corner left relatively
  open. No readable text, no watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-solo-woowakgood-2.webp

---

## D. 추가 이미지 — 화풍 다양화 (10장)

기존 44장이 애니메이션/수채화/웹툰 계열 그림체 위주로 겹치는 느낌이 있어서, 지금까지 문서에 없던 화풍만 골라 10장을 더 추가함(픽셀아트, 우키요에, 클레이메이션, 로우폴리 3D, 민화, 스테인드글라스, 페이퍼크래프트, 리소그래프, 분필 낙서, 펠트 디오라마). 12명 전원이 나오는 컷은 마찬가지로 없음(2~3명 소그룹). 파일명은 `wallpaper-extra-01.webp` ~ `wallpaper-extra-10.webp`.

### 1. 리프팅 챌린지 — `wallpaper-extra-01.webp`

- **참여 인물**: 쥬멩이, 다시바 (2명)
- **파일 경로**: `public/wallpapers/wallpaper-extra-01.webp`
- **레퍼런스**: 2명의 (a) 실제 레퍼런스 사진 + (b) 유니폼 레퍼런스
- **프롬프트**:
  ```
  A retro 16-bit pixel-art wallpaper styled like a classic SNES-era RPG
  town scene, showing two players having a playful keepy-uppy (ball
  juggling) contest on a training pitch at golden hour, one mid-flick
  with the ball above their head, the other watching and laughing,
  small retro sparkle effect above the ball. The two characters are
  chunky, charming 16-bit pixel-art sprites whose face/hair silhouette
  and color palette are clearly recognizable as the people in their
  attached reference photos (keep identity readable at pixel scale,
  redraw only the rendering technique). Both wearing the exact jersey
  design from the attached uniform reference image. Retro pixel-art
  training-pitch background with a warm orange sunset gradient sky and
  small pixel-art trees, limited retro color palette. Figures placed
  lower-center-right, upper-left corner left relatively open. No
  readable text, no watermark. Landscape, 3840x2160, crisp pixel edges
  (nearest-neighbor upscale).
  ```
- [x] wallpaper-extra-01.webp

### 2. 벚꽃 아래 피크닉 — `wallpaper-extra-02.webp`

- **참여 인물**: 한결___, 리냐_LINYA (2명)
- **파일 경로**: `public/wallpapers/wallpaper-extra-02.webp`
- **레퍼런스**: 2명의 (a) 실제 레퍼런스 사진
- **프롬프트**:
  ```
  A traditional Japanese ukiyo-e woodblock-print style wallpaper of two
  friends sitting on a picnic mat under a blooming cherry-blossom tree,
  petals drifting through the air, one holding up a rice cake snack, the
  other looking up at the blossoms with a peaceful smile — composed like
  a classic ukiyo-e seasonal print. The two characters are the exact
  people in the attached reference photos, redrawn in an authentic
  ukiyo-e woodblock style with flat bold color fields, visible woodgrain
  print texture, bold black outlines and a muted traditional palette
  (keep faces and hairstyles recognizable, redraw only the rendering
  technique). Wearing flowing kimono-inspired robes loosely patterned
  with a subtle mint-green (#00e9ae) accent trim, not the team uniform.
  Stylized flat cherry-blossom-tree and distant hills background in the
  same woodblock-print style. Figures placed lower-center-right, upper-
  left corner left relatively open. No readable text/seal stamps, no
  watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-extra-02.webp

### 3. 진흙탕 볼 장난 — `wallpaper-extra-03.webp`

- **참여 인물**: 빙밍_, 핑구, 해파린~ (3명)
- **파일 경로**: `public/wallpapers/wallpaper-extra-03.webp`
- **레퍼런스**: 3명의 (a) 실제 레퍼런스 사진 + (b) 유니폼 레퍼런스
- **프롬프트**:
  ```
  A charming stop-motion claymation style wallpaper of three players
  goofing around after a rainy practice, kicking up mud splashes while
  play-fighting over the ball, big playful grins, visible mud splatters
  on their kits. The three characters are the exact people in the
  attached reference photos, redrawn as handcrafted claymation-style
  characters with visible clay/plasticine texture, subtle fingerprint
  dents, soft studio stop-motion lighting and slightly asymmetric
  handmade shapes (keep faces and hairstyles recognizable, redraw only
  the rendering technique). Wearing the exact jersey design from the
  attached uniform reference image, visibly mud-splattered. Overcast
  claymation-style training-pitch background with tiny handcrafted
  puddle props. Figures placed lower-center-right, upper-left corner
  left relatively open. No readable text, no watermark. Landscape,
  3840x2160.
  ```
- [x] wallpaper-extra-03.webp

### 4. 시상대 위에서 — `wallpaper-extra-04.webp`

- **참여 인물**: 재닌, 쥬멩이 (2명)
- **파일 경로**: `public/wallpapers/wallpaper-extra-04.webp`
- **레퍼런스**: 2명의 (a) 실제 레퍼런스 사진 + (b) 유니폼 레퍼런스
- **프롬프트**:
  ```
  A sleek low-poly 3D geometric illustration wallpaper of two players
  standing together on a winner's podium, one holding a low-poly trophy
  overhead, both with confident triumphant smiles, faceted geometric
  confetti frozen mid-air around them. The two characters are the exact
  people in the attached reference photos, redrawn as clean low-poly 3D
  characters built from flat triangular/faceted shapes with simple
  directional lighting (keep face shape, hairstyle and identity
  recognizable through the faceted style, redraw only the rendering
  technique). Wearing the exact jersey design from the attached uniform
  reference image, low-poly medals around their necks. Low-poly stadium
  background with a faceted geometric sunset sky. Figures placed lower-
  center-right, upper-left corner left relatively open. No readable
  text, no watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-extra-04.webp

### 5. 설날 세배 — `wallpaper-extra-05.webp`

- **참여 인물**: 뽀린걸, 문모모, 우왁굳 (3명)
- **파일 경로**: `public/wallpapers/wallpaper-extra-05.webp`
- **레퍼런스**: 3명의 (a) 실제 레퍼런스 사진
- **프롬프트**:
  ```
  A traditional Korean minhwa folk-painting style wallpaper depicting a
  warm Lunar New Year scene — two players performing a respectful
  New Year's bow (sebae) to the manager, who sits with a gentle smile
  ready to hand over a small lucky-money envelope, a low traditional
  table with tea nearby. The three characters are the exact people in
  the attached reference photos, redrawn in an authentic minhwa
  folk-painting style with flat bold colors, decorative stylized
  patterning and traditional Korean painting linework (keep faces and
  hairstyles recognizable, redraw only the rendering technique). All
  three wearing traditional hanbok, each a different color, with a
  small subtle mint-green (#00e9ae) accent ribbon as a nod to the team.
  Traditional minhwa-style interior background with stylized folding
  screen and floor cushions. Figures placed lower-center-right, upper-
  left corner left relatively open. No readable text, no watermark.
  Landscape, 3840x2160.
  ```
- [x] wallpaper-extra-05.webp

### 6. 스테인드글라스 골든부트 — `wallpaper-extra-06.webp`

- **참여 인물**: 하치_HACHI, 다시바 (2명)
- **파일 경로**: `public/wallpapers/wallpaper-extra-06.webp`
- **레퍼런스**: 2명의 (a) 실제 레퍼런스 사진 + (b) 유니폼 레퍼런스
- **프롬프트**:
  ```
  A radiant stained-glass mosaic style wallpaper of the two wingers
  posed heroically back-to-back mid-action (one striking a ball, one
  sprinting), framed like a grand stained-glass window with a golden
  boot trophy motif radiating light rays between them. The two
  characters are the exact people in the attached reference photos,
  redrawn as a stained-glass mosaic composition — bold black leading
  lines dividing flat jewel-toned color segments, backlit glowing
  translucent color (keep faces and hairstyles recognizable through the
  mosaic segmentation, redraw only the rendering technique). Wearing the
  exact jersey design from the attached uniform reference image,
  reinterpreted in stained-glass color segments. Deep-toned stained-
  glass window background with radiating light-ray patterns. Figures
  placed lower-center-right, upper-left corner left relatively open. No
  readable text, no watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-extra-06.webp

### 7. 페이퍼크래프트 락커룸 — `wallpaper-extra-07.webp`

- **참여 인물**: 한결___, 뽀린걸, 쥬멩이 (3명)
- **파일 경로**: `public/wallpapers/wallpaper-extra-07.webp`
- **레퍼런스**: 3명의 (a) 실제 레퍼런스 사진 + (b) 유니폼 레퍼런스
- **프롬프트**:
  ```
  A charming layered papercraft diorama style wallpaper of three players
  in the locker room getting ready before a match, one lacing up boots,
  one adjusting a captain's armband, one stretching — built entirely
  like a miniature cut-paper shadow-box diorama with visible layered
  paper depth and soft directional studio lighting casting gentle
  shadows between the paper layers. The three characters are the exact
  people in the attached reference photos, redrawn as flat cut-paper
  character cutouts with visible paper edges and subtle layered
  drop-shadows (keep faces and hairstyles recognizable, redraw only the
  rendering technique). Wearing the exact jersey design from the
  attached uniform reference image, reinterpreted as cut-paper shapes.
  Papercraft locker-room background built from layered cut-paper lockers
  and benches. Figures placed lower-center-right, upper-left corner left
  relatively open. No readable text, no watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-extra-07.webp

### 8. 리소그래프 응원 포스터 — `wallpaper-extra-08.webp`

- **참여 인물**: 리냐_LINYA, 다시바 (2명)
- **파일 경로**: `public/wallpapers/wallpaper-extra-08.webp`
- **레퍼런스**: 2명의 (a) 실제 레퍼런스 사진 + (b) 유니폼 레퍼런스
- **프롬프트**:
  ```
  A retro riso-print style wallpaper of two fullbacks striking a bold
  confident dual pose side by side, arms crossed, like a limited-edition
  fan-club promo poster, slight visible print misregistration and grain
  texture between color layers. The two characters are the exact people
  in the attached reference photos, redrawn in an authentic risograph
  print style using only 2-3 overlapping flat spot colors (e.g. mint-
  green, hot coral, deep navy) with visible halftone grain and slight
  layer offset (keep faces and hairstyles recognizable, redraw only the
  rendering technique). Wearing the exact jersey design from the
  attached uniform reference image, reduced to the limited riso color
  palette. Flat textured riso-print background with a simple sunburst
  pattern. Figures placed lower-center-right, upper-left corner left
  relatively open. No readable text, no watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-extra-08.webp

### 9. 칠판 낙서 전술 브리핑 — `wallpaper-extra-09.webp`

- **참여 인물**: 우왁굳, 핑구, 해파린~ (3명)
- **파일 경로**: `public/wallpapers/wallpaper-extra-09.webp`
- **레퍼런스**: 3명의 (a) 실제 레퍼런스 사진
- **프롬프트**:
  ```
  A playful chalk-on-blackboard doodle style wallpaper of the manager
  and two players huddled around a big blackboard, all three drawn as if
  sketched entirely in white/colored chalk, the manager mid-explanation
  pointing at chalk-drawn tactical arrows and stick-figure diagrams (no
  readable text, only abstract chalk diagram marks), players grinning
  and nodding along. The three characters are the exact people in the
  attached reference photos, redrawn entirely in a loose hand-drawn
  chalk-on-blackboard style with visible chalk dust texture and smudged
  edges, dark blackboard-green background (keep faces and hairstyles
  recognizable through the chalk linework, redraw only the rendering
  technique). Wearing casual training-jacket outlines sketched in chalk,
  not the match uniform. Figures placed lower-center-right, upper-left
  corner left relatively open. No readable text, no watermark.
  Landscape, 3840x2160.
  ```
- [x] wallpaper-extra-09.webp

### 10. 캠프파이어 앞에서 — `wallpaper-extra-10.webp`

- **참여 인물**: 재닌, 빙밍_ (2명)
- **파일 경로**: `public/wallpapers/wallpaper-extra-10.webp`
- **레퍼런스**: 2명의 (a) 실제 레퍼런스 사진
- **프롬프트**:
  ```
  A cozy handcrafted felt/wool-felt diorama photography style wallpaper
  of two friends sitting on little felt log stools around a felt
  campfire at a team camping trip, roasting felt marshmallows on
  skewers, warm contented smiles, tiny stitched felt stars in the night
  sky above. The two characters are the exact people in the attached
  reference photos, redrawn as adorable handcrafted needle-felted wool
  characters with visible felted fiber texture, photographed like a
  real miniature diorama with soft warm firelight and shallow depth of
  field (keep faces and hairstyles recognizable through the felted-doll
  style, redraw only the rendering technique). Wearing cozy felt sweater
  textures, not the uniform. Felt-craft campsite background with tiny
  felt trees and a dark blue night sky. Figures placed lower-center-
  right, upper-left corner left relatively open. No readable text, no
  watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-extra-10.webp

---

## E. 하치_HACHI 추가 솔로 (4장)

하치 개인 이미지를 다양한 화풍/컨셉으로 4장 더 추가. 기존 하치 등장 컷(필살 슈팅=소년만화 스플래시, 편의점 야식=16비트 픽셀아트, 리프팅 챌린지=SNES 픽셀아트, 스테인드글라스 골든부트, 사이드라인 드리블=정통 애니메이션, 전술 보드=모노크롬 코믹, 결승골 세레머니=코믹북 스플래시, 빗속 운동장=잉크워시 수채화)와 겹치지 않는 화풍만 골랐음. 파일명은 `wallpaper-hachi-01.webp` ~ `wallpaper-hachi-04.webp`.

### 1. 노을 아래 마지막 슈팅 — `wallpaper-hachi-01.webp`

- **파일 경로**: `public/wallpapers/wallpaper-hachi-01.webp`
- **레퍼런스**: 하치의 (a) 실제 레퍼런스 사진 + (b) 유니폼 레퍼런스
- **프롬프트**:
  ```
  A hyper-detailed modern anime-background style wallpaper (in the vein
  of Makoto Shinkai-esque cinematic sky work) of him standing alone on
  the pitch just before a decisive shot at golden hour, ball at his
  feet, calm focused gaze toward the goal. The character is the exact
  person in the attached reference photo, with the character itself kept
  in a clean flat anime cel-shading style matching the reference (keep
  face and hairstyle recognizable, redraw only the rendering technique
  for the pose), while the surrounding environment is rendered in an
  extremely detailed, painterly, almost photorealistic anime-background
  style: a vast dramatic sunset sky with layered clouds catching orange
  and violet light, warm lens flare bleeding across the frame, glowing
  rim light on the grass blades, tiny sparkling light particles drifting
  in the air. Wearing the exact jersey/shorts/socks design from the
  attached uniform reference image. Character placed lower-center-right
  of frame, upper-left corner left relatively open for desktop icons. No
  readable text, no watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-hachi-01.webp

### 2. 훈련 후 인터뷰 — `wallpaper-hachi-02.webp`

- **파일 경로**: `public/wallpapers/wallpaper-hachi-02.webp`
- **레퍼런스**: 하치의 (a) 실제 레퍼런스 사진
- **프롬프트**:
  ```
  A vibrant Copic-marker fanart illustration style wallpaper of him
  mid-interview right after training, a handheld microphone near his
  mouth, sweat towel around his neck, easy confident grin mid-laugh. The
  character is the exact person in the attached reference photo, redrawn
  in an authentic alcohol-marker illustration style — visible marker
  streak strokes, layered color blending, crisp fineliner outlines and
  bright paper-white highlights left unblended (keep face and hairstyle
  recognizable, redraw only the rendering technique). Wearing a casual
  post-training tracksuit top, not the match uniform, towel draped over
  shoulders. Soft blurred training-ground background sketched loosely in
  the same marker style. Character placed lower-center-right, upper-left
  corner left relatively open. No readable text, no watermark.
  Landscape, 3840x2160.
  ```
- [x] wallpaper-hachi-02.webp

### 3. 경기장 앞 동상 — `wallpaper-hachi-03.webp`

- **파일 경로**: `public/wallpapers/wallpaper-hachi-03.webp`
- **레퍼런스**: 하치의 (a) 실제 레퍼런스 사진 + (b) 유니폼 레퍼런스
- **프롬프트**:
  ```
  A striking bronze-and-gold monument statue style wallpaper — a heroic
  commemorative statue of him erected on a stone pedestal outside the
  stadium, frozen mid-strike in a dynamic shooting pose, cast in warm
  polished bronze with gilded gold highlights on the jersey trim and
  boots. The statue's face and hairstyle are sculpted to clearly
  resemble the exact person in the attached reference photo, translated
  into smooth sculptural bronze forms (keep the likeness readable in the
  sculpted shapes, this is a statue reinterpretation, not the original
  rendering style). The sculpted kit follows the exact jersey/shorts/
  socks design from the attached uniform reference image, rendered as
  sculpted metal relief. Plaza background with soft overcast daylight,
  the statue's long shadow cast on the stone pavement, a few blurred
  pigeons for scale. Statue placed lower-center-right, upper-left corner
  left relatively open. No readable plaque text, no watermark.
  Landscape, 3840x2160.
  ```
- [x] wallpaper-hachi-03.webp

### 4. 골목 벽화 속 하치 — `wallpaper-hachi-04.webp`

- **파일 경로**: `public/wallpapers/wallpaper-hachi-04.webp`
- **레퍼런스**: 하치의 (a) 실제 레퍼런스 사진 + (b) 유니폼 레퍼런스
- **프롬프트**:
  ```
  A bold graffiti street-art mural style wallpaper — a large spray-paint
  mural of him painted on a rough brick alley wall, dynamic action pose
  mid-dribble, rendered with the exact visual language of urban graffiti
  art: thick spray-can outlines, dripping paint accents, layered stencil
  -style color blocks, a soft spray-paint halo/glow behind his head. The
  muralized face and hairstyle clearly resemble the exact person in the
  attached reference photo, stylized into graffiti-art forms (keep the
  likeness readable within the mural style, this is a street-art
  reinterpretation, not the original rendering style). The painted kit
  follows the exact jersey/shorts/socks design from the attached uniform
  reference image, simplified into flat stencil color blocks. Weathered
  brick-wall background with some spray-paint splatter and tag-like
  abstract marks around the edges (no readable text/lettering anywhere).
  Mural placed to fill the lower-center-right of frame, upper-left
  corner left relatively open. No readable text, no watermark.
  Landscape, 3840x2160.
  ```
- [x] wallpaper-hachi-04.webp

---

## F. 픽셀 그림체 + 특이한 그림체 (10장)

일반적인 애니메이션/일러스트 화풍이 아닌 것만 모은 섹션. 앞쪽(픽셀 4장)은 기존에 쓴 픽셀아트(8비트 NES풍, SNES풍, 16비트 일반)와 겹치지 않는 픽셀 하위 스타일만 골랐고, 뒤쪽(특이한 그림체 6장)은 지금까지 문서에 없던 완전히 다른 매체/질감(타투 플래시, 나전칠기, 레고 브릭, 블랙라이트, 홀로그램 포토카드, 그림자극)만 골랐음. 전부 2~3명 소그룹.

### 픽셀 그림체 (4장)

#### 1. 트릭슛 연습 — `wallpaper-pixel-01.webp`

- **참여 인물**: 재닌, 핑구 (2명)
- **파일 경로**: `public/wallpapers/wallpaper-pixel-01.webp`
- **레퍼런스**: 2명의 (a) 실제 레퍼런스 사진 + (b) 유니폼 레퍼런스
- **프롬프트**:
  ```
  A classic 1990s handheld-console monochrome pixel-art wallpaper —
  rendered entirely in the limited 4-shade dot-matrix green palette of a
  vintage handheld game screen (dark olive to pale lime green only, no
  other colors), showing two players practicing trick shots on a
  training pitch, one flicking the ball up for a juggling trick, the
  other applauding. The two characters are chunky, charming pixel-art
  sprites whose face/hair silhouette is clearly recognizable as the
  people in their attached reference photos, built from the exact same
  4-tone green dot-matrix palette (keep identity readable within the
  monochrome palette, redraw only the rendering technique). Wearing the
  exact jersey design from the attached uniform reference image,
  simplified into the same green tones. Faint visible pixel grid /
  dot-matrix screen texture and a subtle vignette like looking through a
  handheld console's screen. Figures placed lower-center-right, upper-
  left corner left relatively open. No readable text, no watermark.
  Landscape, 3840x2160, crisp pixel edges (nearest-neighbor upscale).
  ```
- [x] wallpaper-pixel-01.webp

#### 2. 클럽하우스 라운지 — `wallpaper-pixel-02.webp`

- **참여 인물**: 뽀린걸, 쥬멩이, 다시바 (3명)
- **파일 경로**: `public/wallpapers/wallpaper-pixel-02.webp`
- **레퍼런스**: 3명의 (a) 실제 레퍼런스 사진
- **프롬프트**:
  ```
  An isometric pixel-art diorama wallpaper — a cutaway isometric-view
  pixel-art room (like a classic city-builder/strategy game tile) of a
  cozy clubhouse lounge, complete with tiny pixel-art sofas, a trophy
  shelf and a rug, viewed from a 3/4 isometric angle. Three players sit
  and stand around chatting and relaxing inside the room, rendered as
  small isometric pixel-art characters whose color palette and
  silhouette clearly resemble the people in their attached reference
  photos (keep identity readable at isometric pixel scale, redraw only
  the rendering technique). Casual loungewear, not the uniform. Warm
  indoor isometric pixel-art lighting with tiny pixel light-bulb glow
  accents. The whole scene sits as a floating isometric diorama block
  against a plain dark background. No readable text, no watermark.
  Landscape, 3840x2160, crisp pixel edges (nearest-neighbor upscale).
  ```
- [x] wallpaper-pixel-02.webp

#### 3. 야간 조명 아래 대결 — `wallpaper-pixel-03.webp`

- **참여 인물**: 한결___, 빙밍_ (2명)
- **파일 경로**: `public/wallpapers/wallpaper-pixel-03.webp`
- **레퍼런스**: 2명의 (a) 실제 레퍼런스 사진 + (b) 유니폼 레퍼런스
- **프롬프트**:
  ```
  A retro 32-bit "5th-generation console" style wallpaper — chunky
  low-polygon 3D characters with visibly low-resolution, dithered
  textures and a soft affine-warped texture wobble, like an early
  PlayStation/Saturn-era game render, showing two players in a tense
  1v1 duel for the ball under bright stadium floodlights at night. The
  two low-poly, dithered-texture characters clearly resemble the exact
  people in their attached reference photos through their silhouette,
  hair shape and jersey colors (keep identity readable within the
  low-poly style, redraw only the rendering technique). Wearing the
  exact jersey design from the attached uniform reference image,
  simplified into low-poly dithered texture. Blocky low-poly stadium
  floodlight-tower silhouettes and a foggy night sky background, faint
  scanline/CRT texture over the whole image. Figures placed lower-
  center-right, upper-left corner left relatively open. No readable
  text, no watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-pixel-03.webp

#### 4. 우정 사진 — `wallpaper-pixel-04.webp`

- **참여 인물**: 리냐_LINYA, 해파린~ (2명)
- **파일 경로**: `public/wallpapers/wallpaper-pixel-04.webp`
- **레퍼런스**: 2명의 (a) 실제 레퍼런스 사진
- **프롬프트**:
  ```
  A highly detailed dithered pixel-art portrait wallpaper — in the style
  of modern indie pixel-art RPG character portraits (dense fine
  dithering for soft gradients, painterly pixel shading rather than flat
  sprite colors), a close-up bust portrait of two friends leaning their
  heads together, warm genuine smiles, arms around each other's
  shoulders. The two characters are rendered as richly detailed pixel-
  art portraits whose faces and hairstyles clearly resemble the exact
  people in their attached reference photos, with fine dithered shading
  giving a soft painterly gradient despite being pure pixel art (keep
  identity clearly readable, redraw only the rendering technique).
  Casual outfits, not the uniform. Simple softly dithered gradient
  background (warm dusk colors), no scenery detail. Portrait placed
  lower-center-right, upper-left corner left relatively open. No
  readable text, no watermark. Landscape, 3840x2160, crisp pixel edges
  (nearest-neighbor upscale, fine dithering preserved).
  ```
- [x] wallpaper-pixel-04.webp

### 특이한 그림체 (6장)

#### 1. 올드스쿨 타투 플래시 — `wallpaper-unique-01.webp`

- **참여 인물**: 하치_HACHI, 다시바 (2명)
- **파일 경로**: `public/wallpapers/wallpaper-unique-01.webp`
- **레퍼런스**: 2명의 (a) 실제 레퍼런스 사진
- **프롬프트**:
  ```
  An authentic old-school American traditional tattoo flash-sheet style
  wallpaper — two bust portraits side by side laid out like a classic
  tattoo parlor flash sheet, surrounded by small soccer-themed flash
  motifs (a ball, crossed boots, a banner ribbon shape left blank of any
  text, a star) filling the empty space. The two portraits are rendered
  in bold thick black tattoo linework with the classic limited flash
  palette (red, green, yellow, black, cream paper tone), heavy uniform
  line weight and simple flat color fills, clearly resembling the exact
  people in their attached reference photos through face shape and
  hairstyle (keep identity readable within the tattoo-flash linework,
  redraw only the rendering technique). Aged cream parchment-paper
  background texture with faint stains, like a genuine vintage flash
  sheet. Portraits placed across the lower two-thirds of frame, upper-
  left corner left relatively open. No readable text/banners, no
  watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-unique-01.webp

#### 2. 자개 병풍 속 감독과 문모모 — `wallpaper-unique-02.webp`

- **참여 인물**: 우왁굳, 문모모 (2명)
- **파일 경로**: `public/wallpapers/wallpaper-unique-02.webp`
- **레퍼런스**: 2명의 (a) 실제 레퍼런스 사진
- **프롬프트**:
  ```
  An exquisite traditional Korean najeonchilgi (mother-of-pearl inlaid
  black lacquerware) style wallpaper — the manager and a player depicted
  standing together side by side in dignified formal poses, as
  if inlaid into a black lacquer folding-screen panel with iridescent
  mother-of-pearl shell fragments forming their silhouettes, clothing
  patterns and a border of stylized clouds/pine-branch motifs. The two
  figures are built entirely from shimmering abalone-shell-like
  iridescent fragments (shifting green/blue/pink pearlescent sheen)
  against deep glossy black lacquer, their face shapes and hairstyles
  still clearly resembling the exact people in their attached reference
  photos through the inlaid silhouette (keep identity readable within
  the lacquerware style, redraw only the rendering technique). Deep
  glossy black lacquer background with a fine decorative inlaid border
  framing the whole scene. Figures placed lower-center-right, upper-left
  corner left relatively open. No readable text, no watermark.
  Landscape, 3840x2160.
  ```
- [x] wallpaper-unique-02.webp

#### 3. 레고 락커룸 디오라마 — `wallpaper-unique-03.webp`

- **참여 인물**: 쥬멩이, 한결___, 뽀린걸 (3명)
- **파일 경로**: `public/wallpapers/wallpaper-unique-03.webp`
- **레퍼런스**: 3명의 (a) 실제 레퍼런스 사진 + (b) 유니폼 레퍼런스
- **프롬프트**:
  ```
  A charming LEGO brick-built diorama style wallpaper — a photorealistic
  render of a miniature locker room built entirely out of LEGO bricks,
  with three LEGO minifigures standing among LEGO-brick lockers and
  benches, tiny printed minifigure torsos and interchangeable smiling
  minifigure heads. The three minifigures' hairpiece shapes and torso
  colors clearly reference the exact people in their attached reference
  photos (keep identity readable through the LEGO minifigure design
  language, redraw only the rendering technique — this is a toy
  reinterpretation, not the original art style). Minifigure torsos
  printed with the exact jersey design from the attached uniform
  reference image, simplified into LEGO-print graphics. Studio product-
  photography lighting on the brick diorama, shallow depth of field
  with soft background blur, visible plastic brick texture and stud
  studs throughout. Diorama placed lower-center-right, upper-left corner
  left relatively open. No readable text/logos, no watermark. Landscape,
  3840x2160.
  ```
- [x] wallpaper-unique-03.webp

#### 4. 블랙라이트 파티 포스터 — `wallpaper-unique-04.webp`

- **참여 인물**: 빙밍_, 리냐_LINYA (2명)
- **파일 경로**: `public/wallpapers/wallpaper-unique-04.webp`
- **레퍼런스**: 2명의 (a) 실제 레퍼런스 사진
- **프롬프트**:
  ```
  A trippy blacklight/UV-reactive poster style wallpaper — as if painted
  entirely in fluorescent neon poster paint and photographed glowing
  under a blacklight, the background deep near-black with only vividly
  glowing fluorescent pink, electric green, and UV-orange shapes
  visible. Two friends dance/pose together mid-laugh, painted as bold
  glowing fluorescent outlines and flat glow-in-the-dark color fields
  with visible paint-drip texture. The two characters' faces and
  hairstyles are clearly recognizable as the exact people in their
  attached reference photos through the glowing fluorescent silhouette
  (keep identity readable within the blacklight-poster style, redraw
  only the rendering technique). Fun glowing fluorescent party outfits,
  not the uniform. A few glowing abstract swirl/splatter shapes floating
  around them, deep black background making everything appear to glow.
  Figures placed lower-center-right, upper-left corner left relatively
  open. No readable text, no watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-unique-04.webp

#### 5. 홀로그램 포토카드 — `wallpaper-unique-05.webp`

- **참여 인물**: 재닌, 해파린~ (2명)
- **파일 경로**: `public/wallpapers/wallpaper-unique-05.webp`
- **레퍼런스**: 2명의 (a) 실제 레퍼런스 사진
- **프롬프트**:
  ```
  A glossy K-pop idol holographic photocard style wallpaper — two
  rectangular photocards laid side by side at a slight tilt on a soft
  reflective surface, each card showing a cute close-up portrait with a
  sparkly holographic rainbow foil overlay catching the light in
  diagonal prism streaks, a thin glossy card border, and small soft
  bokeh sparkle particles floating above the cards. The two portraits
  clearly resemble the exact people in their attached reference photos
  (keep faces and hairstyles recognizable, redraw only the rendering
  technique for the cute photocard pose — peace sign, playful wink).
  Casual cute outfits, not the uniform. Soft pastel gradient background
  behind the cards with a gentle reflection of the cards on the glossy
  surface below. Cards placed lower-center-right, upper-left corner left
  relatively open. No readable text/logos/serial numbers on the cards,
  no watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-unique-05.webp

#### 6. 노을 그림자극 — `wallpaper-unique-06.webp`

- **참여 인물**: 하치_HACHI, 우왁굳 (2명)
- **파일 경로**: `public/wallpapers/wallpaper-unique-06.webp`
- **레퍼런스**: 2명의 (a) 실제 레퍼런스 사진
- **프롬프트**:
  ```
  A poetic shadow-puppet theater style wallpaper — two figures rendered
  as flat, fully black silhouette cutouts (like traditional shadow-
  puppet theater figures) posed against a huge glowing orange-to-purple
  sunset gradient sky, the manager resting a hand on the young player's
  shoulder, both looking out toward the horizon where a distant goalpost
  silhouette stands. The two silhouettes' hairstyle shapes and posture
  are distinct enough to clearly reference the exact people in their
  attached reference photos even in pure flat silhouette (keep identity
  readable through silhouette shape alone, redraw only the rendering
  technique — no interior detail, pure flat black cutout shapes with
  crisp paper-cutout edges). A few silhouetted birds and soft cloud
  wisps in the sky, warm sunset light gradient filling the frame.
  Silhouettes placed lower-center-right, upper-left corner left
  relatively open. No readable text, no watermark. Landscape, 3840x2160.
  ```
- [x] wallpaper-unique-06.webp

---

## G. 미니멀 단색 배경 (12장)

12명 전원 각자 1장씩 — 아주 작은 픽셀아트 캐릭터 + 본인 펫을 화면 정중앙에 조그맣게(전체 프레임의 12~15% 높이 정도) 배치하고, 배경은 그 사람에게 어울리는 연한 단색 하나로만 채운 미니멀 컨셉. 전부 같은 픽셀아트 스타일/구도를 공유하고 인물별로 배경색·포즈·펫만 다름. 파일명은 `wallpaper-minimal-<id>.webp`.

### 1. 우왁굳 — `wallpaper-minimal-woowakgood.webp`

- **파일 경로**: `public/wallpapers/wallpaper-minimal-woowakgood.webp`
- **레퍼런스**: 우왁굳의 (a) 실제 레퍼런스 사진 + (c) 펫 레퍼런스(판치, `tmp/pitch-src/pets/pet-panchi.png`)
- **프롬프트**:
  ```
  A charming retro pixel-art wallpaper on a solid pale mint (#d7f7ec)
  background — one flat color filling the entire frame, no scenery, no
  texture, no gradient, no scanline/CRT effect. In the exact center, a
  small chunky pixel-art sprite of him stands facing forward with arms
  crossed in a confident, friendly pose, built from clearly visible
  square pixels with a limited color palette (drastically simplified
  from the reference photo — keep just enough of the face, hairstyle
  and headset shape to be recognizable at pixel scale, redraw only the
  rendering technique). Beside him, his chubby black-furred monkey-like
  pet with cream ears/paws and a mint hair streak (exactly like the
  attached pet reference image) rendered as a small matching pixel-art
  sprite. No background elements, no props, no text, no logos, no
  watermark, only a tiny flat pixel-art shadow beneath their feet.
  Render the character and pet quite small — only about a quarter the
  size of a typical centered subject, together taking up roughly 12-15%
  of the frame's height — like a tiny sprite floating in the middle of
  a vast, empty expanse of flat color. Placed in the exact center of
  the frame with very generous, dominant empty space filling most of
  the frame on all sides. Landscape, 3840x2160, crisp pixel edges
  (nearest-neighbor upscale).
  ```
- [x] wallpaper-minimal-woowakgood.webp

### 2. 재닌 — `wallpaper-minimal-janine95kim.webp`

- **파일 경로**: `public/wallpapers/wallpaper-minimal-janine95kim.webp`
- **레퍼런스**: 재닌의 (a) 실제 레퍼런스 사진 + (c) 펫 레퍼런스(구르미, `tmp/pitch-src/pets/pet-gureumi.png`)
- **프롬프트**:
  ```
  A charming retro pixel-art wallpaper on a solid pale sky blue
  (#dcefff) background — one flat color filling the entire frame, no
  scenery, no texture, no gradient, no scanline/CRT effect. In the
  exact center, a small chunky pixel-art sprite of her stands facing
  forward with a gentle wave, built from clearly visible square pixels
  with a limited color palette (drastically simplified from the
  reference photo — keep just enough of the face and hairstyle to be
  recognizable at pixel scale, redraw only the rendering technique).
  Beside her, her fluffy round cloud-shaped pet with tiny round glasses
  (exactly like the attached pet reference image) rendered as a small
  matching pixel-art sprite. No background elements, no props, no text,
  no logos, no watermark, only a tiny flat pixel-art shadow beneath
  their feet. Render the character and pet quite small — only about a
  quarter the size of a typical centered subject, together taking up
  roughly 12-15% of the frame's height — like a tiny sprite floating in
  the middle of a vast, empty expanse of flat color. Placed in the
  exact center of the frame with very generous, dominant empty space
  filling most of the frame on all sides. Landscape, 3840x2160, crisp
  pixel edges (nearest-neighbor upscale).
  ```
- [x] wallpaper-minimal-janine95kim.webp

### 3. 뽀린걸 — `wallpaper-minimal-bboringirl.webp`

- **파일 경로**: `public/wallpapers/wallpaper-minimal-bboringirl.webp`
- **레퍼런스**: 뽀린걸의 (a) 실제 레퍼런스 사진 + (c) 펫 레퍼런스(뽀글스, `tmp/pitch-src/pets/pet-bbogeulseu.png`)
- **프롬프트**:
  ```
  A charming retro pixel-art wallpaper on a solid pale ivory (#f6efe3)
  background — one flat color filling the entire frame, no scenery, no
  texture, no gradient, no scanline/CRT effect. In the exact center, a
  small chunky pixel-art sprite of her stands facing forward striking a
  cheerful peace-sign pose, built from clearly visible square pixels
  with a limited color palette (drastically simplified from the
  reference photo — keep just enough of the face and hairstyle to be
  recognizable at pixel scale, redraw only the rendering technique).
  Beside her, her round owl-like pet with striped belly (exactly like
  the attached pet reference image) rendered as a small matching
  pixel-art sprite. No background elements, no props, no text, no
  logos, no watermark, only a tiny flat pixel-art shadow beneath their
  feet. Render the character and pet quite small — only about a quarter
  the size of a typical centered subject, together taking up roughly
  12-15% of the frame's height — like a tiny sprite floating in the
  middle of a vast, empty expanse of flat color. Placed in the exact
  center of the frame with very generous, dominant empty space filling
  most of the frame on all sides. Landscape, 3840x2160, crisp pixel
  edges (nearest-neighbor upscale).
  ```
- [x] wallpaper-minimal-bboringirl.webp

### 4. 핑구 — `wallpaper-minimal-sjh4018.webp`

- **파일 경로**: `public/wallpapers/wallpaper-minimal-sjh4018.webp`
- **레퍼런스**: 핑구의 (a) 실제 레퍼런스 사진 + (c) 펫 레퍼런스(펭귄, `tmp/pitch-src/pets/pet-penguin.png`)
- **프롬프트**:
  ```
  A charming retro pixel-art wallpaper on a solid pale ice-blue-gray
  (#e2edf2) background — one flat color filling the entire frame, no
  scenery, no texture, no gradient, no scanline/CRT effect. In the
  exact center, a small chunky pixel-art sprite of him stands facing
  forward with hands in pockets, relaxed and cool, built from clearly
  visible square pixels with a limited color palette (drastically
  simplified from the reference photo — keep just enough of the face
  and hairstyle to be recognizable at pixel scale, redraw only the
  rendering technique). Beside him, his crown-wearing penguin pet with
  sleepy eyes (exactly like the attached pet reference image) rendered
  as a small matching pixel-art sprite. No background elements, no
  props, no text, no logos, no watermark, only a tiny flat pixel-art
  shadow beneath their feet. Render the character and pet quite small —
  only about a quarter the size of a typical centered subject, together
  taking up roughly 12-15% of the frame's height — like a tiny sprite
  floating in the middle of a vast, empty expanse of flat color. Placed
  in the exact center of the frame with very generous, dominant empty
  space filling most of the frame on all sides. Landscape, 3840x2160,
  crisp pixel edges (nearest-neighbor upscale).
  ```
- [x] wallpaper-minimal-sjh4018.webp

### 5. 문모모 — `wallpaper-minimal-doormomo.webp`

- **파일 경로**: `public/wallpapers/wallpaper-minimal-doormomo.webp`
- **레퍼런스**: 문모모의 (a) 실제 레퍼런스 사진 + (c) 펫 레퍼런스(웅냐미, `tmp/pitch-src/pets/pet-ungnami.png`)
- **프롬프트**:
  ```
  A charming retro pixel-art wallpaper on a solid pale beige (#f3e6d5)
  background — one flat color filling the entire frame, no scenery, no
  texture, no gradient, no scanline/CRT effect. In the exact center, a
  small chunky pixel-art sprite of her stands facing forward with one
  hand on her hip, confident and composed, built from clearly visible
  square pixels with a limited color palette (drastically simplified
  from the reference photo — keep just enough of the face and hairstyle
  to be recognizable at pixel scale, redraw only the rendering
  technique). Beside her, her stitched teddy-bear plush pet with button
  eyes and a red ribbon (exactly like the attached pet reference image)
  rendered as a small matching pixel-art sprite. No background
  elements, no props, no text, no logos, no watermark, only a tiny flat
  pixel-art shadow beneath their feet. Render the character and pet
  quite small — only about a quarter the size of a typical centered
  subject, together taking up roughly 12-15% of the frame's height —
  like a tiny sprite floating in the middle of a vast, empty expanse of
  flat color. Placed in the exact center of the frame with very
  generous, dominant empty space filling most of the frame on all
  sides. Landscape, 3840x2160, crisp pixel edges (nearest-neighbor
  upscale).
  ```
- [x] wallpaper-minimal-doormomo.webp

### 6. 하치_HACHI — `wallpaper-minimal-hachi97.webp`

- **파일 경로**: `public/wallpapers/wallpaper-minimal-hachi97.webp`
- **레퍼런스**: 하치의 (a) 실제 레퍼런스 사진 + (c) 펫 레퍼런스(용볼이, `src/web/assets/pitch/pets/pet-yongboli.webp`)
- **프롬프트**:
  ```
  A charming retro pixel-art wallpaper on a solid pale golden yellow
  (#fbf0c2) background — one flat color filling the entire frame, no
  scenery, no texture, no gradient, no scanline/CRT effect. In the
  exact center, a small chunky pixel-art sprite of him stands facing
  forward mid-cheerful laugh, one fist raised, built from clearly
  visible square pixels with a limited color palette (drastically
  simplified from the reference photo — keep just enough of the face
  and hairstyle to be recognizable at pixel scale, redraw only the
  rendering technique). Beside him, his tiny yellow chick-like pet with
  a heart-shaped mouth (exactly like the attached pet reference image)
  rendered as a small matching pixel-art sprite. No background
  elements, no props, no text, no logos, no watermark, only a tiny flat
  pixel-art shadow beneath their feet. Render the character and pet
  quite small — only about a quarter the size of a typical centered
  subject, together taking up roughly 12-15% of the frame's height —
  like a tiny sprite floating in the middle of a vast, empty expanse of
  flat color. Placed in the exact center of the frame with very
  generous, dominant empty space filling most of the frame on all
  sides. Landscape, 3840x2160, crisp pixel edges (nearest-neighbor
  upscale).
  ```
- [x] wallpaper-minimal-hachi97.webp

### 7. 한결___ — `wallpaper-minimal-kaksjak0730.webp`

- **파일 경로**: `public/wallpapers/wallpaper-minimal-kaksjak0730.webp`
- **레퍼런스**: 한결의 (a) 실제 레퍼런스 사진 + (c) 펫 레퍼런스(단결, `tmp/pitch-src/pets/pet-dangyeol.png`)
- **프롬프트**:
  ```
  A charming retro pixel-art wallpaper on a solid pale periwinkle
  lavender (#e3e2f7) background — one flat color filling the entire
  frame, no scenery, no texture, no gradient, no scanline/CRT effect.
  In the exact center, a small chunky pixel-art sprite of her stands
  facing forward with a calm, elegant posture, hands loosely clasped in
  front, built from clearly visible square pixels with a limited color
  palette (drastically simplified from the reference photo — keep just
  enough of the face and hairstyle to be recognizable at pixel scale,
  redraw only the rendering technique). Beside her, her fluffy white
  kitten pet with multiple pink-tipped tails (exactly like the attached
  pet reference image) rendered as a small matching pixel-art sprite.
  No background elements, no props, no text, no logos, no watermark,
  only a tiny flat pixel-art shadow beneath their feet. Render the
  character and pet quite small — only about a quarter the size of a
  typical centered subject, together taking up roughly 12-15% of the
  frame's height — like a tiny sprite floating in the middle of a vast,
  empty expanse of flat color. Placed in the exact center of the frame
  with very generous, dominant empty space filling most of the frame on
  all sides. Landscape, 3840x2160, crisp pixel edges (nearest-neighbor
  upscale).
  ```
- [x] wallpaper-minimal-kaksjak0730.webp

### 8. 쥬멩이 — `wallpaper-minimal-ju010228.webp`

- **파일 경로**: `public/wallpapers/wallpaper-minimal-ju010228.webp`
- **레퍼런스**: 쥬멩이의 (a) 실제 레퍼런스 사진 + (c) 펫 레퍼런스(돌멩이, `tmp/pitch-src/pets/pet-dolmengi.png`)
- **프롬프트**:
  ```
  A charming retro pixel-art wallpaper on a solid pale stone gray
  (#e8e6df) background — one flat color filling the entire frame, no
  scenery, no texture, no gradient, no scanline/CRT effect. In the
  exact center, a small chunky pixel-art sprite of her stands facing
  forward mid-jump with both arms up, energetic and playful, built from
  clearly visible square pixels with a limited color palette
  (drastically simplified from the reference photo — keep just enough
  of the face and hairstyle to be recognizable at pixel scale, redraw
  only the rendering technique). Beside her, her round smiling grey
  pebble-shaped pet (exactly like the attached pet reference image)
  rendered as a small matching pixel-art sprite. No background
  elements, no props, no text, no logos, no watermark, only a tiny flat
  pixel-art shadow beneath their feet. Render the character and pet
  quite small — only about a quarter the size of a typical centered
  subject, together taking up roughly 12-15% of the frame's height —
  like a tiny sprite floating in the middle of a vast, empty expanse of
  flat color. Placed in the exact center of the frame with very
  generous, dominant empty space filling most of the frame on all
  sides. Landscape, 3840x2160, crisp pixel edges (nearest-neighbor
  upscale).
  ```
- [x] wallpaper-minimal-ju010228.webp

### 9. 빙밍_ — `wallpaper-minimal-tleod1818.webp`

- **파일 경로**: `public/wallpapers/wallpaper-minimal-tleod1818.webp`
- **레퍼런스**: 빙밍의 (a) 실제 레퍼런스 사진 + (c) 펫 레퍼런스(봉바비, `tmp/pitch-src/pets/pet-bongbabi.png`)
- **프롬프트**:
  ```
  A charming retro pixel-art wallpaper on a solid pale pistachio green
  (#e4f2df) background — one flat color filling the entire frame, no
  scenery, no texture, no gradient, no scanline/CRT effect. In the
  exact center, a small chunky pixel-art sprite of her stands facing
  forward mid-giggle, both hands near her cheeks, cute and bubbly,
  built from clearly visible square pixels with a limited color palette
  (drastically simplified from the reference photo — keep just enough
  of the face and hairstyle to be recognizable at pixel scale, redraw
  only the rendering technique). Beside her, her round white rice-cake-
  shaped pet with a little green sprout on top (exactly like the
  attached pet reference image) rendered as a small matching pixel-art
  sprite. No background elements, no props, no text, no logos, no
  watermark, only a tiny flat pixel-art shadow beneath their feet.
  Render the character and pet quite small — only about a quarter the
  size of a typical centered subject, together taking up roughly 12-15%
  of the frame's height — like a tiny sprite floating in the middle of
  a vast, empty expanse of flat color. Placed in the exact center of
  the frame with very generous, dominant empty space filling most of
  the frame on all sides. Landscape, 3840x2160, crisp pixel edges
  (nearest-neighbor upscale).
  ```
- [x] wallpaper-minimal-tleod1818.webp

### 10. 리냐_LINYA — `wallpaper-minimal-lina0108.webp`

- **파일 경로**: `public/wallpapers/wallpaper-minimal-lina0108.webp`
- **레퍼런스**: 리냐의 (a) 실제 레퍼런스 사진 + (c) 펫 레퍼런스(뱀수리, `tmp/pitch-src/pets/pet-baemsuri.png`)
- **프롬프트**:
  ```
  A charming retro pixel-art wallpaper on a solid pale lilac purple
  (#f1e3f7) background — one flat color filling the entire frame, no
  scenery, no texture, no gradient, no scanline/CRT effect. In the
  exact center, a small chunky pixel-art sprite of her stands facing
  forward with a playful wink and a peace sign, built from clearly
  visible square pixels with a limited color palette (drastically
  simplified from the reference photo — keep just enough of the face
  and hairstyle to be recognizable at pixel scale, redraw only the
  rendering technique). Beside her, her small pale-lavender round
  egg-shaped pet (exactly like the attached pet reference image)
  rendered as a small matching pixel-art sprite. No background
  elements, no props, no text, no logos, no watermark, only a tiny flat
  pixel-art shadow beneath their feet. Render the character and pet
  quite small — only about a quarter the size of a typical centered
  subject, together taking up roughly 12-15% of the frame's height —
  like a tiny sprite floating in the middle of a vast, empty expanse of
  flat color. Placed in the exact center of the frame with very
  generous, dominant empty space filling most of the frame on all
  sides. Landscape, 3840x2160, crisp pixel edges (nearest-neighbor
  upscale).
  ```
- [x] wallpaper-minimal-lina0108.webp

### 11. 해파린~ — `wallpaper-minimal-haepalin.webp`

- **파일 경로**: `public/wallpapers/wallpaper-minimal-haepalin.webp`
- **레퍼런스**: 해파린의 (a) 실제 레퍼런스 사진 + (c) 펫 레퍼런스(해피, `tmp/pitch-src/pets/pet-haepi.png`)
- **프롬프트**:
  ```
  A charming retro pixel-art wallpaper on a solid pale aqua teal
  (#dbf3ee) background — one flat color filling the entire frame, no
  scenery, no texture, no gradient, no scanline/CRT effect. In the
  exact center, a small chunky pixel-art sprite of her stands facing
  forward with a soft gentle smile, hands clasped behind her back,
  built from clearly visible square pixels with a limited color palette
  (drastically simplified from the reference photo — keep just enough
  of the face and hairstyle to be recognizable at pixel scale, redraw
  only the rendering technique). Beside her, her small purple
  jellyfish-shaped pet with dangling tentacle-legs (exactly like the
  attached pet reference image) rendered as a small matching pixel-art
  sprite. No background elements, no props, no text, no logos, no
  watermark, only a tiny flat pixel-art shadow beneath their feet.
  Render the character and pet quite small — only about a quarter the
  size of a typical centered subject, together taking up roughly 12-15%
  of the frame's height — like a tiny sprite floating in the middle of
  a vast, empty expanse of flat color. Placed in the exact center of
  the frame with very generous, dominant empty space filling most of
  the frame on all sides. Landscape, 3840x2160, crisp pixel edges
  (nearest-neighbor upscale).
  ```
- [x] wallpaper-minimal-haepalin.webp

### 12. 다시바 — `wallpaper-minimal-tdnlamuron.webp`

- **파일 경로**: `public/wallpapers/wallpaper-minimal-tdnlamuron.webp`
- **레퍼런스**: 다시바의 (a) 실제 레퍼런스 사진 + (c) 펫 레퍼런스(시바꺼, `tmp/pitch-src/pets/pet-sibakkeo.png`)
- **프롬프트**:
  ```
  A charming retro pixel-art wallpaper on a solid pale peach (#fbe4d6)
  background — one flat color filling the entire frame, no scenery, no
  texture, no gradient, no scanline/CRT effect. In the exact center, a
  small chunky pixel-art sprite of her stands facing forward mid-stride
  with a bright confident smile, built from clearly visible square
  pixels with a limited color palette (drastically simplified from the
  reference photo — keep just enough of the face and hairstyle to be
  recognizable at pixel scale, redraw only the rendering technique).
  Beside her, her small orange shiba-inu puppy pet with a curled tail
  and bone-shaped collar charm (exactly like the attached pet reference
  image) rendered as a small matching pixel-art sprite. No background
  elements, no props, no text, no logos, no watermark, only a tiny flat
  pixel-art shadow beneath their feet. Render the character and pet
  quite small — only about a quarter the size of a typical centered
  subject, together taking up roughly 12-15% of the frame's height —
  like a tiny sprite floating in the middle of a vast, empty expanse of
  flat color. Placed in the exact center of the frame with very
  generous, dominant empty space filling most of the frame on all
  sides. Landscape, 3840x2160, crisp pixel edges (nearest-neighbor
  upscale).
  ```
- [x] wallpaper-minimal-tdnlamuron.webp

---

각 이미지 섹션은 파일이 생성되어 `public/wallpapers/`에 들어갈 때마다 위 체크박스를 체크해서 진행 상황을 표시할 것.
