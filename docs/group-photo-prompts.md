# 잔디동 단체사진 — 이미지 생성 프롬프트 레퍼런스

`src/web/group-photo/`에 구현될 "단체샷 구경하기" 오버레이에 쓰이는 단체사진 아트 생성용 프롬프트 모음. 한 명씩 이미지를 만들 때마다 이 문서의 해당 섹션을 참고해서 생성 → 파일명 규칙대로 저장 → 변환 스크립트 실행 순으로 진행하면 됨.

> **참고**: 아래 캔버스 규격(배경 3840×2160, 인물 1400×2400)은 초기 계획값이다. 실제로 생성돼 `src/web/assets/group-photo/`에 들어간 에셋은 배경 3344×1882, 인물 958×1642이며 13장 모두 완료 상태다(섹션 제목의 "미구현" 표기는 갱신 전). 캐릭터 뒤/앞에 놓는 축구장 소품과 공 차기 이스터에그는 [`group-photo-props.md`](group-photo-props.md)에 정리돼 있다.

## 디자인 방향 (중요)

- **범위는 12명으로 고정**: `passedSecondRound: true`인 11명의 최종합격자(재닌·뽀린걸·핑구·문모모·하치·한결·쥬멩이·빙밍·리냐·해파린·다시바) + 로스터에 없는 감독 우왁굳. 새로 2차 합격자가 추가되더라도 이 문서/에셋은 자동으로 늘어나지 않음 — 새 인물이 생기면 이 문서에 섹션을 추가하고 이미지를 새로 생성해야 함(TOTY 카드 시스템과 동일한 수동 유지보수 방식).
- **화풍은 레퍼런스 그대로**: TOTY 카드처럼 새로운 판타지 일러스트 화풍을 입히지 않는다. 사용자가 첨부하는 각 스트리머의 실제 아바타/레퍼런스 사진이 이미 가진 캐릭터 디자인·화풍·비율·표현 기법을 최대한 그대로 유지한 채, 포즈와 의상(유니폼)만 새로 그린다. 그래서 모든 프롬프트에 "Match the art style ... of the attached reference image as closely as possible" 문구가 공통으로 들어감.
- **배경 1장 + 인물 12장을 각각 따로 생성 후 CSS로 합성**: 한 장에 12명을 동시에 그리게 하면 인물 수가 틀리거나 얼굴이 뭉개지는 등 AI 생성 특성상 신뢰하기 어려움 (TOTY 카드가 이미 "선수 1명 = 이미지 1장" 원칙을 쓰는 이유와 동일). 대신 텅 빈 그라운드 배경 1장을 만들고, 그 위에 투명 배경의 인물 컷아웃 12장을 코드에서 각각 절대 위치로 배치한다 (`src/web/photo-booth/photo-booth.css`의 `.photo-booth-director` vw 사이징 기법 재사용).
- **팀 구성**: 축구팀 단체사진의 정석대로 뒷줄은 서 있고 앞줄은 한쪽 무릎을 꿇고 앉은 자세. 재닌만 골키퍼라서 나머지 팀 유니폼과 뚜렷이 다른 색 키트를 입고, 우왁굳은 선수가 아니라 감독이므로 유니폼이 아니라 정장을 입는다. 팀 이름 "잔디동"은 모든 유니폼에 공통으로 들어가되, **메인 컬러는 흰색, 사이트 시그니처 민트그린(`#00e9ae`)은 포인트 컬러**로만 사용(초록 일색은 촌스러워 보인다는 피드백 반영 — 아래 "유니폼 레퍼런스" 참고).
- **유니폼은 먼저 디자인 레퍼런스로 1장 생성 후 모든 선수 프롬프트에 공통으로 첨부**: 11명을 각자 따로 생성하면서 매번 "mint-green jersey with white trim" 같은 말로만 유니폼을 설명하면 사람마다 디테일(카라 모양, 로고 위치, 줄무늬 두께 등)이 미묘하게 달라질 위험이 큼. 그래서 사람이 하나도 없는 유니폼 자체의 레퍼런스 이미지를 가장 먼저 1장 생성해두고, 이후 모든 아웃필드 선수 프롬프트에 그 이미지를 스트리머 본인 사진과 함께 "이 유니폼 디자인 그대로" 첨부한다. 재닌(골키퍼)도 같은 유니폼 레퍼런스를 첨부하되 "같은 디자인, 색만 다르게"로 지시해서 컷/재단/로고 배치는 동일하고 색상만 구분되게 한다.

## 공통 작업 방식

1. **캔버스**: 배경은 **3840×2160px**(16:9, 최대 12명 + 여백을 담을 수 있는 와이드 사이즈), 불투명 PNG 또는 JPG(투명 불필요, 이후 webp로 변환). 인물 컷아웃은 전부 **1400×2400px**(약 1:1.7, 세로로 긴 비율), 알파 채널 있는 투명 PNG로 생성 — 카드 프레임이 없는 순수 전신 컷아웃이라 TOTY 카드(1060×1484, 약 1:1.4)보다 세로 비율을 더 크게 잡았음. 서 있는 포즈는 캔버스에 여백이 좀 남고 쭈그려 앉은 포즈(한쪽 무릎 세우고 팔 얹기로 옆으로 더 퍼짐)는 폭을 거의 다 채우는 정도가 적당.
   - 사용하는 생성 도구가 진짜 투명 배경(RGBA)을 지원하는지 먼저 확인. 지원 안 하면 순수 그린/마젠타 배경으로 생성 후 배경 제거 도구로 따로 제거.
   - 생성 후 어두운 배경이나 체크무늬 배경에 올려서 가장자리에 원래 배경색 잔여 테두리(halo)가 없는지 꼭 확인.
2. **생성 순서**: 아래 "유니폼 레퍼런스" 섹션을 **가장 먼저** 생성해서 따로 저장해둘 것 — 이후 모든 아웃필드/골키퍼 선수 프롬프트를 생성할 때마다 이 이미지를 매번 함께 첨부해야 함(사이트에 올라가는 에셋은 아니라서 `src/web/assets/group-photo/`에 넣지 않아도 됨, 생성 작업용 레퍼런스일 뿐).
3. **레퍼런스 이미지 첨부**: 배경과 유니폼 레퍼런스 자체는 참고 이미지 없이 프롬프트만으로 생성. 각 아웃필드/골키퍼 선수는 **(a) 해당 스트리머의 실제 아바타/레퍼런스 사진을 얼굴·헤어스타일·기존 캐릭터 화풍 참고용으로, (b) 위에서 만든 유니폼 레퍼런스 이미지를 유니폼 디자인 참고용으로** 함께 첨부 — 포즈만 아래 프롬프트대로 새로 그리고, 그림체는 (a)에서, 유니폼 디테일은 (b)에서 그대로 가져올 것. 우왁굳은 유니폼이 아니라 정장이므로 (b) 없이 본인 사진만 첨부.
4. **파일명 규칙**: `<id>.webp`(인물, 아래 표의 `id` 컬럼 사용), `background.webp`(공유 배경). PNG로 받으면 아래 명령으로 변환·이동:
   ```bash
   pnpm convert:group-photo-art -- <id> <PNG가 들어있는 폴더 경로>
   ```
   예: `핑구` 캐릭터를 `public/test/`에 `character.png`로 받아뒀다면 `pnpm convert:group-photo-art -- sjh4018`. 배경은 `public/test/`에 `background.png`로 받아뒀다면 `pnpm convert:group-photo-art -- background`.
5. `src/web/group-photo/groupPhotoAssets.ts`가 `src/web/assets/group-photo/`를 자동 스캔하므로(`import.meta.glob`), 이미지가 갖춰지는 대로 사이트에 바로 반영됨 — 별도 매니페스트 수정 불필요.
6. 인물의 그라운드 위 배치(앞줄/뒷줄, 좌우 위치)는 이미지가 아니라 `src/web/group-photo/groupPhotoRoster.ts`의 코드 설정값이므로, 아래 배치표의 줄(row) 구성은 얼마든지 코드에서 다시 조정 가능함.

## 공유 배경 (미구현 — 1장)

오버레이를 열었을 때 전체 화면에 깔리는 그라운드 잔디밭 배경.

- **캔버스**: 3840×2160px, PNG 또는 JPG (투명 불필요, 이후 webp로 변환)
- **파일명**: `background.webp`
- **프롬프트**:
  ```
  A lush green grass football pitch as a wide-angle team-photo backdrop,
  photographed at standing eye level (camera roughly 1.6-1.7m off the
  ground, level horizon, NOT a low ground-level shot looking up) —
  exactly the framing of a real team's official group-photo backdrop.
  The grass fills only the lower third to lower quarter of the frame,
  with faint white pitch markings visible close to the camera; the
  middle of the frame is a softly blurred stadium stand with scattered
  colorful crowd silhouettes in bokeh, and the upper third is a clear
  blue sky with a few soft clouds. Bright natural daylight, vivid
  emerald green turf, slightly warm professional sports-photography
  color grade. No people in sharp focus anywhere in the frame — this is
  a backdrop only, all human figures will be composited on top of it
  separately. No text, no logos, no banners with readable text.
  Ultra-wide, clean. 3840x2160, landscape.
  ```

## 유니폼 레퍼런스 (가장 먼저 생성 — 완료)

사람 없이 유니폼 자체만 담은 디자인 레퍼런스. 아래 아웃필드/골키퍼 선수 프롬프트를 생성할 때마다 이 이미지를 매번 함께 첨부해서 카라 모양·로고 위치·줄무늬 등 유니폼 디테일이 선수마다 흔들리지 않게 한다. 사이트에 실제로 올라가는 에셋이 아니므로 `src/web/assets/group-photo/`에 넣지 않고 작업 폴더에만 보관.

- **캔버스**: 2000×1600px, PNG (투명 불필요)
- **참고 이미지**: 불필요 (프롬프트만으로 생성)
- **프롬프트**:
  ```
  A flat, front-facing product/catalog-style reference sheet of a
  modern soccer team kit (jersey + shorts + socks) laid flat, no person
  or mannequin wearing it. Primarily WHITE jersey as the base color,
  with a sleek mint-green (#00e9ae) accent used sparingly — a thin
  diagonal or side-panel color-block running from one shoulder down the
  side, and thin mint-green trim on the collar and sleeve cuffs.
  "잔디동" printed across the chest in a clean, modern, minimal
  sport-jersey typeface (small and tasteful, not a huge block logo).
  White shorts with a single thin mint-green side stripe, white socks
  with a mint-green trim band. Contemporary, premium athletic-wear
  design — like a modern European club's clean white away kit, sleek
  minimal silhouette. Explicitly avoid: a dated/retro look, busy
  patterns, thick old-fashioned block stripes, or the jersey reading as
  mostly green — white must clearly be the dominant color and green only
  an accent. Clean, evenly lit product photography style, plain neutral
  light-gray background, symmetrical front view, no wrinkles obscuring
  the design, no person, no mannequin. This is a flat design reference
  only. PNG, 2000x1600, landscape.
  ```

## 인물 배치표 (12명)

| id | 이름 | 줄 | 비고 |
|---|---|---|---|
| janine95kim | 재닌 | 뒷줄 | 골키퍼 전용 프롬프트 |
| woowakgood | 우왁굳 | 뒷줄 끝 | 정장, 감독 — 로스터에 없는 하드코딩 게스트 |
| bboringirl | 뽀린걸 | 앞줄 | |
| sjh4018 | 핑구 | 앞줄 | |
| doormomo | 문모모 | 뒷줄 | |
| hachi97 | 하치_HACHI | 뒷줄 | |
| kaksjak0730 | 한결___ | 앞줄 | |
| ju010228 | 쥬멩이 | 뒷줄 | |
| tleod1818 | 빙밍_ | 앞줄 | |
| lina0108 | 리냐_LINYA | 뒷줄 | |
| haepalin | 해파린~ | 앞줄 | |
| tdnlamuron | 다시바 | 뒷줄 | |

(5명 앞줄 쭈그려 앉기 / 7명 뒷줄 서기로 균형 배치한 예시 구성. 순서·좌우 위치는 `groupPhotoRoster.ts`에서 자유롭게 조정 가능.)

## 우왁굳 (감독, 정장) — `woowakgood` (미구현)

- **레퍼런스**: 우왁굳의 실제 레퍼런스 사진만 첨부 (정장이라 유니폼 레퍼런스는 불필요). **얼굴·헤어스타일·헤드셋 디자인은 레퍼런스 그대로 유지**하고, 헤드셋 이어컵에 적힌 숫자만 "3D"에서 "40"으로 바꿀 것.
- **프롬프트**:
  ```
  Full-body portrait of the exact character in the attached reference
  image — keep the face, hairstyle, and headset design identical to the
  reference. The ONLY change to the character's existing design is the
  number printed on the headset's ear cup: it must read "40" instead of
  "3D". As a soccer team's manager/coach, standing at the end of the
  back row of a team photo — upright posture, hands clasped in front or
  one hand in a trouser pocket, warm proud smile, NOT wearing a
  player's kit. Instead wearing a sharp well-tailored suit: dark navy
  or charcoal jacket and trousers, white dress shirt, a tie or pocket
  square in mint-green (#00e9ae) as the one visible nod to "잔디동" team
  colors, dress shoes. Match the art style, proportions, and rendering
  technique of the attached reference image as closely as possible —
  this is the same character, just redrawn in this pose and outfit
  (and the "40" ear cup change), not a new illustration style. Isolated
  on a fully transparent background — only the character and a soft
  cast shadow directly beneath the feet, no ground, no other people, no
  props. PNG with alpha channel, 1400x2400, portrait orientation,
  character filling most of the vertical frame with a small margin top
  and bottom for compositing.
  ```

## 재닌 (골키퍼) — `janine95kim` (미구현)

- **레퍼런스**: (a) 재닌의 실제 아바타/레퍼런스 사진, (b) 위 "유니폼 레퍼런스" 이미지 — 두 장 함께 첨부
- **프롬프트**:
  ```
  Full-body portrait of the character in reference image (a), in a
  standing/ready team-photo pose in the BACK row (weight balanced,
  hands on hips or loosely at sides, confident smile — standing
  straight, not crouching). Wearing a GOALKEEPER version of the exact
  jersey/shorts/socks design shown in reference image (b) — same cut,
  collar/cuff trim style, and "잔디동" chest wordmark placement — but
  recolored to a solid bold color clearly different from the outfield
  kit's white base (e.g. deep charcoal/black or bold yellow), keeping
  only a small mint-green (#00e9ae) trim/piping accent (same as the
  outfield kit's accent), plus padded goalkeeper gloves. Match the art
  style, proportions, and rendering technique of reference image (a) as
  closely as possible — same character, new pose and outfit only.
  Isolated on a fully transparent background, only the character and a
  soft cast shadow beneath the feet, no ground, no other people. PNG
  with alpha channel, 1400x2400, portrait orientation.
  ```

## 뽀린걸 — `bboringirl` (미구현)

- **레퍼런스**: (a) 뽀린걸의 실제 아바타/레퍼런스 사진, (b) 위 "유니폼 레퍼런스" 이미지 — 두 장 함께 첨부
- **프롬프트**:
  ```
  Full-body portrait of the character in reference image (a), in a
  crouching/kneeling front-row team-photo pose (one knee down, hands
  resting on the raised knee, looking toward camera, friendly confident
  smile). Wearing the exact jersey/shorts/socks design shown in
  reference image (b) — same white base color with mint-green (#00e9ae)
  accent, same cut, collar/cuff trim, and "잔디동" chest wordmark
  placement, white cleats. Match the art style, proportions, and
  rendering technique of reference image (a) as closely as possible —
  same character, new pose only. Isolated on a fully transparent
  background, only the character and a soft cast shadow beneath the
  feet, no ground, no other people, no props. PNG with alpha channel,
  1400x2400, portrait orientation.
  ```

## 핑구 — `sjh4018` (미구현)

- **레퍼런스**: (a) 핑구의 실제 아바타/레퍼런스 사진, (b) 위 "유니폼 레퍼런스" 이미지 — 두 장 함께 첨부
- **프롬프트**:
  ```
  Full-body portrait of the character in reference image (a), in a
  crouching/kneeling front-row team-photo pose (one knee down, hands
  resting on the raised knee, looking toward camera, friendly confident
  smile). Wearing the exact jersey/shorts/socks design shown in
  reference image (b) — same white base color with mint-green (#00e9ae)
  accent, same cut, collar/cuff trim, and "잔디동" chest wordmark
  placement, white cleats. Match the art style, proportions, and
  rendering technique of reference image (a) as closely as possible —
  same character, new pose only. Isolated on a fully transparent
  background, only the character and a soft cast shadow beneath the
  feet, no ground, no other people, no props. PNG with alpha channel,
  1400x2400, portrait orientation.
  ```

## 문모모 — `doormomo` (미구현)

- **레퍼런스**: (a) 문모모의 실제 아바타/레퍼런스 사진, (b) 위 "유니폼 레퍼런스" 이미지 — 두 장 함께 첨부
- **프롬프트**:
  ```
  Full-body portrait of the character in reference image (a), in a
  standing/ready back-row team-photo pose (weight balanced, hands
  loosely at sides or arms crossed, looking toward camera, friendly
  confident smile — standing straight, not crouching). Wearing the
  exact jersey/shorts/socks design shown in reference image (b) — same
  white base color with mint-green (#00e9ae) accent, same cut,
  collar/cuff trim, and "잔디동" chest wordmark placement, white cleats.
  Match the art style, proportions, and rendering technique of
  reference image (a) as closely as possible — same character, new
  pose only. Isolated on a fully transparent background, only the
  character and a soft cast shadow beneath the feet, no ground, no
  other people, no props. PNG with alpha channel, 1400x2400, portrait
  orientation.
  ```

## 하치_HACHI — `hachi97` (미구현)

- **레퍼런스**: (a) 하치의 실제 아바타/레퍼런스 사진, (b) 위 "유니폼 레퍼런스" 이미지 — 두 장 함께 첨부
- **프롬프트**:
  ```
  Full-body portrait of the character in reference image (a), in a
  standing/ready back-row team-photo pose (weight balanced, hands
  loosely at sides or arms crossed, looking toward camera, friendly
  confident smile — standing straight, not crouching). Wearing the
  exact jersey/shorts/socks design shown in reference image (b) — same
  white base color with mint-green (#00e9ae) accent, same cut,
  collar/cuff trim, and "잔디동" chest wordmark placement, white cleats.
  Match the art style, proportions, and rendering technique of
  reference image (a) as closely as possible — same character, new
  pose only. Isolated on a fully transparent background, only the
  character and a soft cast shadow beneath the feet, no ground, no
  other people, no props. PNG with alpha channel, 1400x2400, portrait
  orientation.
  ```

## 한결___ — `kaksjak0730` (미구현)

- **레퍼런스**: (a) 한결의 실제 아바타/레퍼런스 사진, (b) 위 "유니폼 레퍼런스" 이미지 — 두 장 함께 첨부
- **프롬프트**:
  ```
  Full-body portrait of the character in reference image (a), in a
  crouching/kneeling front-row team-photo pose (one knee down, hands
  resting on the raised knee, looking toward camera, friendly confident
  smile). Wearing the exact jersey/shorts/socks design shown in
  reference image (b) — same white base color with mint-green (#00e9ae)
  accent, same cut, collar/cuff trim, and "잔디동" chest wordmark
  placement, white cleats. Match the art style, proportions, and
  rendering technique of reference image (a) as closely as possible —
  same character, new pose only. Isolated on a fully transparent
  background, only the character and a soft cast shadow beneath the
  feet, no ground, no other people, no props. PNG with alpha channel,
  1400x2400, portrait orientation.
  ```

## 쥬멩이 — `ju010228` (미구현)

- **레퍼런스**: (a) 쥬멩이의 실제 아바타/레퍼런스 사진, (b) 위 "유니폼 레퍼런스" 이미지 — 두 장 함께 첨부
- **프롬프트**:
  ```
  Full-body portrait of the character in reference image (a), in a
  standing/ready back-row team-photo pose (weight balanced, hands
  loosely at sides or arms crossed, looking toward camera, friendly
  confident smile — standing straight, not crouching). Wearing the
  exact jersey/shorts/socks design shown in reference image (b) — same
  white base color with mint-green (#00e9ae) accent, same cut,
  collar/cuff trim, and "잔디동" chest wordmark placement, white cleats.
  Match the art style, proportions, and rendering technique of
  reference image (a) as closely as possible — same character, new
  pose only. Isolated on a fully transparent background, only the
  character and a soft cast shadow beneath the feet, no ground, no
  other people, no props. PNG with alpha channel, 1400x2400, portrait
  orientation.
  ```

## 빙밍_ — `tleod1818` (미구현)

- **레퍼런스**: (a) 빙밍의 실제 아바타/레퍼런스 사진, (b) 위 "유니폼 레퍼런스" 이미지 — 두 장 함께 첨부
- **프롬프트**:
  ```
  Full-body portrait of the character in reference image (a), in a
  crouching/kneeling front-row team-photo pose (one knee down, hands
  resting on the raised knee, looking toward camera, friendly confident
  smile). Wearing the exact jersey/shorts/socks design shown in
  reference image (b) — same white base color with mint-green (#00e9ae)
  accent, same cut, collar/cuff trim, and "잔디동" chest wordmark
  placement, white cleats. Match the art style, proportions, and
  rendering technique of reference image (a) as closely as possible —
  same character, new pose only. Isolated on a fully transparent
  background, only the character and a soft cast shadow beneath the
  feet, no ground, no other people, no props. PNG with alpha channel,
  1400x2400, portrait orientation.
  ```

## 리냐_LINYA — `lina0108` (미구현)

- **레퍼런스**: (a) 리냐의 실제 아바타/레퍼런스 사진, (b) 위 "유니폼 레퍼런스" 이미지 — 두 장 함께 첨부
- **프롬프트**:
  ```
  Full-body portrait of the character in reference image (a), in a
  standing/ready back-row team-photo pose (weight balanced, hands
  loosely at sides or arms crossed, looking toward camera, friendly
  confident smile — standing straight, not crouching). Wearing the
  exact jersey/shorts/socks design shown in reference image (b) — same
  white base color with mint-green (#00e9ae) accent, same cut,
  collar/cuff trim, and "잔디동" chest wordmark placement, white cleats.
  Match the art style, proportions, and rendering technique of
  reference image (a) as closely as possible — same character, new
  pose only. Isolated on a fully transparent background, only the
  character and a soft cast shadow beneath the feet, no ground, no
  other people, no props. PNG with alpha channel, 1400x2400, portrait
  orientation.
  ```

## 해파린~ — `haepalin` (미구현)

- **레퍼런스**: (a) 해파린의 실제 아바타/레퍼런스 사진, (b) 위 "유니폼 레퍼런스" 이미지 — 두 장 함께 첨부
- **프롬프트**:
  ```
  Full-body portrait of the character in reference image (a), in a
  crouching/kneeling front-row team-photo pose (one knee down, hands
  resting on the raised knee, looking toward camera, friendly confident
  smile). Wearing the exact jersey/shorts/socks design shown in
  reference image (b) — same white base color with mint-green (#00e9ae)
  accent, same cut, collar/cuff trim, and "잔디동" chest wordmark
  placement, white cleats. Match the art style, proportions, and
  rendering technique of reference image (a) as closely as possible —
  same character, new pose only. Isolated on a fully transparent
  background, only the character and a soft cast shadow beneath the
  feet, no ground, no other people, no props. PNG with alpha channel,
  1400x2400, portrait orientation.
  ```

## 다시바 — `tdnlamuron` (미구현)

- **레퍼런스**: (a) 다시바의 실제 아바타/레퍼런스 사진, (b) 위 "유니폼 레퍼런스" 이미지 — 두 장 함께 첨부
- **프롬프트**:
  ```
  Full-body portrait of the character in reference image (a), in a
  standing/ready back-row team-photo pose (weight balanced, hands
  loosely at sides or arms crossed, looking toward camera, friendly
  confident smile — standing straight, not crouching). Wearing the
  exact jersey/shorts/socks design shown in reference image (b) — same
  white base color with mint-green (#00e9ae) accent, same cut,
  collar/cuff trim, and "잔디동" chest wordmark placement, white cleats.
  Match the art style, proportions, and rendering technique of
  reference image (a) as closely as possible — same character, new
  pose only. Isolated on a fully transparent background, only the
  character and a soft cast shadow beneath the feet, no ground, no
  other people, no props. PNG with alpha channel, 1400x2400, portrait
  orientation.
  ```

각 인물 섹션은 이미지가 생성되어 `src/web/assets/group-photo/`에 들어갈 때마다 "미구현"을 "완료"로 바꿔서 진행 상황을 표시할 것.
