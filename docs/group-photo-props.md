# 잔디동 단체사진 — 소품 & 이스터에그 이미지 생성 프롬프트 레퍼런스

`src/web/group-photo/`의 "단체샷 구경하기" 오버레이는 캐릭터 좌우·앞쪽이 휑해서, **축구장 소품 7종**을 캐릭터 뒤/앞에 얹고 그중 **공을 클릭하면 골대로 차 넣는 이스터에그**를 넣는다. 이 문서는 그 소품 이미지를 AI로 생성할 때 쓰는 파일명·레퍼런스·프롬프트·배치 좌표를 정리한 것이고, 구현(2단계)보다 먼저 작성됐다. 캐릭터/배경/유니폼 쪽 프롬프트는 [`group-photo-prompts.md`](group-photo-prompts.md)를 참고.

진행 순서: 이 문서의 소품 섹션대로 이미지 생성 → 파일명 규칙대로 저장 → 변환 스크립트 실행 → 코드(2단계) 구현/좌표 튜닝. 코드는 이미지가 없어도 깨지지 않게(파일이 없는 소품은 렌더 안 함) 만들기 때문에 이미지는 한 장씩 순서 없이 채워도 된다.

## 디자인 방향 (중요)

- **소품 1개 = 이미지 1장 (개별 컷아웃)**: 배경(`background.webp`)에 소품을 그려 넣은 새 배경을 만들지 않는다. 소품별로 위치를 코드에서 조정해야 하고, 공처럼 **클릭/애니메이션되는 소품**은 반드시 분리돼 있어야 하며, 저장 이미지(PNG)도 배경 + 캐릭터 + 소품을 캔버스에서 다시 합성하기 때문이다. 캐릭터와 같은 "1개 = 1장" 원칙.
- **화풍은 캐릭터와 동일**: 캐릭터 스프라이트(`src/web/assets/group-photo/<id>.webp`)의 깔끔한 애니 셀셰이딩 화풍에 맞춘다. 배경은 사실적인 사진 톤이지만 캐릭터가 이미 애니 화풍으로 그 위에 올라가 있으므로, 소품도 캐릭터 쪽에 맞춰야 이질감이 없다. **광원·색감·시점은 배경에 맞춘다** (밝은 한낮, 왼쪽 위에서 오는 자연광, 약간 따뜻한 톤, 눈높이 카메라·수평선).
- **팀 컬러**: 기본은 흰색, 포인트로 민트그린(`#00e9ae`)만 소량 — 유니폼과 같은 규칙(초록 일색 금지). 잔디동 문장(초록 방패 + 잎 아이콘)이 어울리는 곳(깃발, 가방)에만 작게.
- **이미지에 글자 넣지 않기**: AI가 한글/영문을 자주 깨뜨리므로 모든 소품에서 글자·숫자·로고 문구 금지 ("no text or letters anywhere"). 글자가 필요하면 코드에서 얹는다(예: 골 넣었을 때 전광판 문구).
- **원근감은 이미지에 굽는다**: 캐릭터 뒤쪽 멀리 있는 소품(골대, 코너 플래그, 공 카트)은 살짝 부드럽고 채도가 낮게(대기 원근) 생성한다. CSS `blur`/`filter`로 처리하면 캔버스 저장 이미지와 화면이 달라지므로 쓰지 않는다. 접지 그림자도 이미지에 구워 넣는다(알파 포함, 아래 공통 규칙).
- **골대는 미니골대(연습용 팝업 골대)로 결정**: 배경은 눈높이에서 스탠드를 찍은 사진이라 잔디 영역이 얕다(지평선 ≈ 24vw, 잔디 먼 끝 ≈ 38.6vw, 뒷줄 발 ≈ 46.4vw — 아래 "좌표계" 참고). 이 깊이에 규격 골대(7.32×2.44m)를 놓으면 원근상 화면 폭보다 커진다. 1.8×1.2m 미니골대는 캐릭터보다 약간 작은 크기로 자연스럽게 들어간다.

## 좌표계 · 크기 규약

기존 캐릭터와 **같은 vw 앵커**를 쓴다. 그래야 브라우저 확대·축소, 창 비율 변화, 모바일에서도 배경과 소품이 함께 움직인다. px 단위나 min/max 클램프는 쓰지 않는다.

- 배경은 `100% auto`로 폭에 맞춰 중앙 정렬된다. 배경 상단 모서리의 화면 y좌표 = `50vh − 28.125vw`. 소품의 세로 위치는 이 모서리에서 아래로 몇 vw인지로 정한다 (`groupPhotoRoster.ts`의 `BACK_TOP_VW` 등과 같은 방식).
- 소품 데이터 항목:
  - `left` — 소품 **중심**의 가로 위치 (스테이지 폭 대비 %; 스테이지 폭 = 100vw라 % = vw).
  - `bottomVw` — 소품이 **땅에 닿는 지점**의 세로 위치 (배경 상단에서 아래로, vw). 캐릭터는 머리 쪽(top) 앵커지만, 소품은 높이가 제각각이라 접지점 앵커가 튜닝하기 쉽다.
  - `widthVw` — 소품 이미지 폭 (vw). 높이는 이미지 비율로 자동.
- **배경 실측: 3344×1882 → 1vw ≈ 33.44px.** 생성 캔버스는 화면 표시 크기의 2배 이상으로 만들어 두어야 고해상도 화면/저장 이미지에서 안 뭉개진다.
- 화면과 저장 PNG는 **같은 소품 데이터(`groupPhotoProps.ts`)** 를 읽는다. 저장 이미지는 배경 원본 해상도 캔버스에 `x = left% × 배경폭 / 100`, `접지 y = bottomVw × 배경폭 / 100`으로 그린다.
- **눈으로 확인하는 법**: 이미지 편집기에서 `background.webp`(3344×1882) 위에 소품을 올릴 때, 폭 = `widthVw × 33.44`px, 중심 x = `left × 33.44`px, 접지 y = `bottomVw × 33.44`px.

### 배경 랜드마크 (배경 상단 기준 vw, 스크린샷 실측 환산)

| 위치 | 값 |
|---|---|
| 지평선(눈높이) | ≈ 24vw |
| 잔디 먼 끝(광고판 하단) | ≈ 38.6vw |
| 뒷줄 캐릭터 머리끝 / 발 | ≈ 22.4vw / ≈ 46.4vw |
| 앞줄 캐릭터 발 | ≈ 49.1vw |
| 전광판(LED) 영역 | 가로 33~66%, 세로 ≈ 5.3~11vw |
| 캐릭터 무리 가로 범위 | ≈ 24.5% ~ 78.5% |

- 크기 산정: 지평선 기준 원근 스케일 `k(y) = (y − 24) / 1.6` vw/m (y = 접지 vw). 예: 뒷줄(46.4) 1m ≈ 14vw, 골대가 서는 42.5 지점은 1m ≈ 11.6vw.
- **안전 영역**: 21:9처럼 가로로 넓은 창에서는 배경의 위·아래가 각 약 6.7vw씩 잘린다. 핵심 소품(특히 클릭 대상)은 **배경 상단 기준 6.7vw ~ 49.5vw 안**에 둔다.
- 금지: 전광판 영역 가리기, 캐릭터 얼굴 가리기.
- 이 문서의 좌표는 스크린샷 눈대중 환산 **시작값**이다. 이미지가 채워진 뒤 화면에서 보면서 조정한다 (`groupPhotoRoster.ts` 주석과 같은 이유).

## 공통 작업 방식

1. **캔버스**: 소품별 캔버스는 아래 배치표 참고. 전부 **알파 채널 있는 투명 PNG**. 생성 도구가 진짜 투명(RGBA)을 지원하는지 먼저 확인하고, 지원하지 않으면 순수 마젠타/그린 단색 배경으로 생성 후 배경 제거 도구로 따로 제거. 어두운 색/체크무늬 배경에 올려 가장자리에 원래 배경색 잔여 테두리(halo)가 없는지 꼭 확인.
2. **레퍼런스 첨부** (모든 소품 공통):
   - **(a)** `src/web/assets/group-photo/background.webp` — 광원 방향·색감·시점(눈높이) 참고용.
   - **(b)** 캐릭터 스프라이트 1장 (예: `janine95kim.webp`) — 애니 셀셰이딩 화풍(선 굵기, 명암 처리) 참고용.
   - **(c)** *(문장이 들어가는 소품만: `corner-flag`, `gear-bag`)* 캐릭터 스프라이트의 **유니폼 가슴 문장 부분 크롭** (예: `haepalin.webp`의 가슴) — 방패 + 잎 문장 모양 참고용. 크롭 이미지는 작업용이라 프로젝트에 넣지 않는다.
3. **생성 추천 순서**: `ball` → `goal` → `corner-flag` → `ball-cart` → `cones`/`water-crate`/`gear-bag`. 공은 가장 단순해서 화풍/색감을 먼저 잡기 좋고, 골대가 인터랙션의 목적지라 두 번째로 확정한다. 모든 소품은 앞서 마음에 든 결과 한 장을 추가 레퍼런스로 더 붙이면 소품끼리 화풍이 더 잘 맞는다.
4. **파일명 규칙**: `props/<id>.webp` (id는 아래 배치표 사용). 생성한 이미지를 파일명 `<id>.png` 또는 `<id>.webp`(예: `goal.webp`)로 한 폴더에 모아 두고 아래 명령으로 변환·이동한다:
   ```bash
   pnpm convert:group-photo-art -- props/<id> <이미지가 있는 폴더>
   ```
   예: `pnpm convert:group-photo-art -- props/goal C:/Users/me/Downloads/props` → `src/web/assets/group-photo/props/goal.webp`. 폴더를 생략하면 `public/test/`에서 `<id>.png` → `<id>.webp` → `prop.png` 순으로 찾는다.
   - 스크립트가 **투명 여백을 자동으로 트림**한다(알파 20 초과인 픽셀의 경계 상자). 소품은 접지점(하단 중앙) 기준으로 배치되므로, 여백이 남아 있으면 소품이 땅에서 떠 보이기 때문이다. 그래서 생성할 때 여백을 정확히 맞출 필요는 없다.
   - 생성 결과의 좌우 방향이 마음에 안 들면 명령 끝에 `--flop`을 붙여 좌우 반전해서 저장한다 (현재 `goal`이 이 옵션으로 반전돼 있음 — 다시 변환할 땐 `--flop`을 같이 줄 것).
   - 캐릭터/배경과 달리 **원본 파일을 지우지 않는다**(소품 원본은 보통 다운로드 폴더에 있어서).
5. `src/web/group-photo/groupPhotoAssets.ts`가 `src/web/assets/group-photo/props/`를 `import.meta.glob`으로 자동 스캔하므로 이미지가 갖춰지는 대로 사이트에 바로 반영된다 — 별도 매니페스트 수정 불필요. 위치/크기는 이미지가 아니라 `groupPhotoProps.ts`의 코드 설정값이다.
6. 이미지 한 장을 넣을 때마다 이 문서의 해당 섹션 "미구현"을 "완료"로 바꿔 진행 상황을 표시할 것.

## 프롬프트 공통 골격

아래 소품별 프롬프트는 모두 이 골격에 `<PROP-SPECIFIC>`만 바꾼 것이다. 새 소품을 추가할 땐 이 골격을 그대로 복사해서 쓴다.

```
A single <PROP> for a soccer team-photo scene, drawn in the same clean
anime cel-shaded illustration style as reference image (b) — match its
line weight, soft shading and color rendering. Lighting, color grade and
camera height (standing eye level, level horizon) must match reference
image (a): bright natural daylight from the upper left, slightly warm.
<PROP-SPECIFIC DESCRIPTION>. Color scheme: white as the base color with
sparing mint-green (#00e9ae) accents. No text, no letters, no numbers
anywhere. Isolated on a fully transparent background — only the object
and a soft contact shadow directly beneath it, no ground plane, no
people, no other props. PNG with alpha channel, <W>x<H>, the object
filling most of the frame with a small margin.
```

- **원거리 소품**(`goal`, `corner-flag`, `ball-cart`)에는 아래 문장을 추가: `This object stands far behind the players, so render it with slightly softened detail and slightly lower color saturation, as if seen through a little atmospheric haze.`
- **`ball`은 접지 그림자를 넣지 않는다**: 공은 클릭하면 날아가므로 그림자가 함께 날아가면 어색하다. 그림자는 코드(CSS 타원)로 따로 그린다. 공 프롬프트에서만 `soft contact shadow` 문구를 `NO shadow at all`로 바꾼다.

## 소품 배치표 (7종)

| id | 레이어 | left (%) | bottomVw | widthVw | 생성 캔버스(권장) | 상태 |
|---|---|---|---|---|---|---|
| `goal` | 캐릭터 뒤 (behind) | 11 | 42.5 | 20 | 1600×1100 | 완료 |
| `corner-flag` | 캐릭터 뒤 | 83.5 | 41.5 | 4.45 | 400×1100 | 완료 |
| `ball-cart` | 캐릭터 뒤 | 92.5 | 44.5 | 13 | 1200×1000 | 완료 |
| `cones` | 캐릭터 앞 (front) | 12 | 49.5 | 11.5 | 1000×450 | 완료 |
| `water-crate` | 캐릭터 앞 | 21.5 | 48 | 8 | 900×500 | 완료 |
| `gear-bag` | 캐릭터 앞 | 84 | 49 | 10 | 900×500 | 완료 |
| `ball` | 캐릭터 앞 (인터랙션) | 45.5 | 49.4 | 3.6 | 512×512 | 완료 |

- **좌표는 최종값**(`src/web/group-photo/groupPhotoProps.ts`가 정본 — 이 표와 다르면 코드가 맞다). 생성된 이미지를 실제 배경·캐릭터 위에 합성해 본 뒤 조정한 값: 코너 플래그를 공 카트에 가려지지 않게 감독 오른쪽(83.5%)으로, 콘·공 카트·가방은 캐릭터 대비 커 보여서 소폭 축소.
- **실제 생성된 이미지는 위 권장 캔버스와 크기가 다르다**(예: `goal` 1513×1039, `ball` 1254×1254). 변환 스크립트가 투명 여백을 자동으로 트림해서 저장하므로, `widthVw`/`bottomVw`는 **트림된(보이는 픽셀) 이미지 기준**이다 — 캔버스 크기·비율이 권장과 조금 달라도 상관없다.
- 레이어: **behind** = 배경 위 · 뒷줄 캐릭터 아래(z-index 1), **front** = 앞줄 캐릭터와 같은 층에서 DOM 순서로 위(z-index 3), 전광판·상단바(z-index 4)는 그대로.
- 화면 표시 높이(참고): `goal` 20×1100/1600 ≈ 13.8vw, `corner-flag` ≈ 14.3vw, `ball-cart` 12.5vw, `cones` 6.3vw, `water-crate` 4.4vw, `gear-bag` 5.8vw, `ball` 3.6vw. (실물 환산: 골대 1.8×1.2m, 깃발 약 1.35m, 카트 약 1.2×1.0m, 물병 상자 약 0.5×0.3m.)
- 좌/우 배치 의도: 좌측(0~24%)은 골대 + 콘 + 물병 상자, 우측(79~100%)은 코너 플래그 + 공 카트 + 가방. 캐릭터 무리는 24.5~78.5%이므로 좌우 여백을 채우는 구성이다. 공은 앞줄 가운데 두 캐릭터(핑구/한결) 사이 발밑 — 축구 단체사진의 정석 구도.

## 골대 — `goal` (완료)

- **캔버스**: 1600×1100px, 투명 PNG · **파일명**: `props/goal.webp`
- **레퍼런스**: (a) `background.webp`, (b) 캐릭터 스프라이트 1장
- **동작**: 공의 목적지. 골이 들어가면 그물이 출렁인다(CSS). 공은 골대보다 한 층 **아래**(z-index 0)에서 골문 안쪽으로 들어가므로, 그물/뒷면은 반투명이어야 공이 비쳐 보인다.
- **프롬프트**:
  ```
  A single small portable pop-up training goal (about 1.8 m wide and
  1.2 m tall) for a soccer team-photo scene, drawn in the same clean
  anime cel-shaded illustration style as reference image (b) — match its
  line weight, soft shading and color rendering. Lighting, color grade
  and camera height (standing eye level, level horizon) must match
  reference image (a): bright natural daylight from the upper left,
  slightly warm. Viewed from the front with a very slight three-quarter
  angle so the depth of the net is visible. White metal posts and
  crossbar with a thin mint-green (#00e9ae) binding along the net edges.
  The goal opening faces the camera and must stay clearly open and empty
  inside. The netting is drawn as fine light-gray mesh lines only —
  mostly transparent between the lines so whatever is behind it stays
  visible through the net; the back net panel is likewise a light
  transparent mesh. This object stands far behind the players, so render
  it with slightly softened detail and slightly lower color saturation,
  as if seen through a little atmospheric haze. Color scheme: white as
  the base color with sparing mint-green accents. No text, no letters,
  no numbers anywhere. Isolated on a fully transparent background — only
  the goal and a soft contact shadow directly beneath the posts, no
  ground plane, no people, no ball, no other props. PNG with alpha
  channel, 1600x1100, the goal filling most of the frame with a small
  margin.
  ```
- **대체안**: 도구가 반투명 그물을 못 만들면 "가는 격자선만 남기고 나머지는 완전 투명"을 재시도. 그래도 안 되면 그물을 통째로 단색으로 그려도 되지만, 그 경우 공이 골대 앞(z-index 위)에서 사라지는 연출로 코드를 바꿔야 하므로 사전 공유 필요.

## 코너 플래그 — `corner-flag` (완료)

- **캔버스**: 400×1100px, 투명 PNG · **파일명**: `props/corner-flag.webp`
- **레퍼런스**: (a) `background.webp`, (b) 캐릭터 스프라이트 1장, (c) 유니폼 가슴 문장 크롭
- **동작**: (P2) 클릭하면 좌우로 흔들리는 CSS 애니메이션. 저장 이미지에는 정지 상태로 그려진다.
- **프롬프트**:
  ```
  A single soccer corner flag for a soccer team-photo scene, drawn in the
  same clean anime cel-shaded illustration style as reference image (b)
  — match its line weight, soft shading and color rendering. Lighting,
  color grade and camera height (standing eye level, level horizon) must
  match reference image (a): bright natural daylight from the upper
  left, slightly warm. A slim white pole about 1.4 m tall standing
  upright on a small spring base, with a small rectangular mint-green
  (#00e9ae) flag near the top gently waving to the right, and a tiny
  white leaf-shield crest on the flag that follows the crest shown in
  reference image (c). This object stands far behind the players, so
  render it with slightly softened detail and slightly lower color
  saturation, as if seen through a little atmospheric haze. No text, no
  letters, no numbers anywhere. Isolated on a fully transparent
  background — only the flag and a soft contact shadow directly beneath
  the base, no ground plane, no people, no other props. PNG with alpha
  channel, 400x1100, tall portrait orientation, the flag pole filling
  most of the vertical frame with a small margin.
  ```

## 공 카트 — `ball-cart` (완료)

- **캔버스**: 1200×1000px, 투명 PNG · **파일명**: `props/ball-cart.webp`
- **레퍼런스**: (a) `background.webp`, (b) 캐릭터 스프라이트 1장
- **동작**: 장식 (클릭 반응 없음).
- **프롬프트**:
  ```
  A single wheeled soccer ball cart (ball trolley) for a soccer
  team-photo scene, drawn in the same clean anime cel-shaded
  illustration style as reference image (b) — match its line weight,
  soft shading and color rendering. Lighting, color grade and camera
  height (standing eye level, level horizon) must match reference image
  (a): bright natural daylight from the upper left, slightly warm.
  Three-quarter front view of an open wire-mesh basket cart on two large
  rubber wheels with a push handle, white/light-gray frame with mint-green
  (#00e9ae) trim, filled with about ten white soccer balls that have
  mint-green panels. This object stands far behind the players, so
  render it with slightly softened detail and slightly lower color
  saturation, as if seen through a little atmospheric haze. No text, no
  letters, no numbers anywhere. Isolated on a fully transparent
  background — only the cart and a soft contact shadow directly beneath
  the wheels, no ground plane, no people, no other props. PNG with alpha
  channel, 1200x1000, the cart filling most of the frame with a small
  margin.
  ```

## 훈련 콘 — `cones` (완료)

- **캔버스**: 1000×450px, 투명 PNG · **파일명**: `props/cones.webp`
- **레퍼런스**: (a) `background.webp`, (b) 캐릭터 스프라이트 1장
- **동작**: 클릭하면 콘이 휘청거린다(이미지 1장 전체가 짧게 흔들렸다 제자리로 돌아옴, `ball-bounce.mp3`). 개별 콘이 쓰러지게 하려면 콘 1개짜리 이미지 3장(`cone-1..3`)으로 분리해서 다시 생성해야 하므로, 필요해지면 이 문서에 섹션 추가.
- **프롬프트**:
  ```
  A group of three small soccer training cones for a soccer team-photo
  scene, drawn in the same clean anime cel-shaded illustration style as
  reference image (b) — match its line weight, soft shading and color
  rendering. Lighting, color grade and camera height (standing eye
  level, level horizon) must match reference image (a): bright natural
  daylight from the upper left, slightly warm. Three classic 30 cm tall
  training cones standing in a slightly staggered row about half a meter
  apart, seen from a three-quarter front angle, mint-green (#00e9ae)
  cones each with one white band. No text, no letters, no numbers
  anywhere. Isolated on a fully transparent background — only the cones
  and a soft contact shadow directly beneath each one, no ground plane,
  no people, no other props. PNG with alpha channel, 1000x450, wide
  landscape orientation, the row of cones filling most of the width with
  a small margin.
  ```

## 물병 상자 — `water-crate` (완료)

- **캔버스**: 900×500px, 투명 PNG · **파일명**: `props/water-crate.webp`
- **레퍼런스**: (a) `background.webp`, (b) 캐릭터 스프라이트 1장
- **동작**: 장식.
- **프롬프트**:
  ```
  A single plastic drink crate full of sports water bottles for a soccer
  team-photo scene, drawn in the same clean anime cel-shaded
  illustration style as reference image (b) — match its line weight,
  soft shading and color rendering. Lighting, color grade and camera
  height (standing eye level, level horizon) must match reference image
  (a): bright natural daylight from the upper left, slightly warm.
  Three-quarter front view of a white plastic crate holding about eight
  clear sports water bottles with mint-green (#00e9ae) caps, with one
  white folded towel resting on top. No text, no letters, no numbers
  anywhere — the bottles carry no labels. Isolated on a fully
  transparent background — only the crate and a soft contact shadow
  directly beneath it, no ground plane, no people, no other props. PNG
  with alpha channel, 900x500, the crate filling most of the frame with
  a small margin.
  ```

## 가방 · 조끼 — `gear-bag` (완료)

- **캔버스**: 900×500px, 투명 PNG · **파일명**: `props/gear-bag.webp`
- **레퍼런스**: (a) `background.webp`, (b) 캐릭터 스프라이트 1장, (c) 유니폼 가슴 문장 크롭
- **동작**: 장식.
- **프롬프트**:
  ```
  A single white sports duffel bag with a small pile of training bibs for
  a soccer team-photo scene, drawn in the same clean anime cel-shaded
  illustration style as reference image (b) — match its line weight,
  soft shading and color rendering. Lighting, color grade and camera
  height (standing eye level, level horizon) must match reference image
  (a): bright natural daylight from the upper left, slightly warm. A
  white duffel bag lying on the ground in three-quarter front view with
  one mint-green (#00e9ae) side panel and a tiny white leaf-shield crest
  that follows the crest shown in reference image (c), next to a small
  neatly folded pile of mint-green and white training bibs. No text, no
  letters, no numbers anywhere. Isolated on a fully transparent
  background — only the bag, the bibs and a soft contact shadow directly
  beneath them, no ground plane, no people, no other props. PNG with
  alpha channel, 900x500, the objects filling most of the frame with a
  small margin.
  ```

## 축구공 — `ball` (완료)

- **캔버스**: 512×512px, 투명 PNG · **파일명**: `props/ball.webp`
- **레퍼런스**: (a) `background.webp`, (b) 캐릭터 스프라이트 1장
- **동작 (이스터에그, 아래 "동작 스펙" 참고)**: 클릭하면 골대로 날아가 골이 된다. **접지 그림자 없이** 생성 — 날아갈 때 그림자가 같이 따라가면 어색해서 그림자는 코드에서 따로 그린다. 회전하며 날아가므로 좌우/상하로 봐도 자연스러운 무늬여야 한다.
- **프롬프트**:
  ```
  A single soccer ball for a soccer team-photo scene, drawn in the same
  clean anime cel-shaded illustration style as reference image (b) —
  match its line weight, soft shading and color rendering. Lighting,
  color grade and camera height (standing eye level, level horizon) must
  match reference image (a): bright natural daylight from the upper
  left, slightly warm. A classic white soccer ball with mint-green
  (#00e9ae) pentagon panels instead of black ones, seen from slightly
  above with a crisp, perfectly circular silhouette and simple cel
  shading (a soft shade on the lower right, a small white highlight on
  the upper left). No text, no letters, no numbers, no logos anywhere.
  Isolated on a fully transparent background — only the ball itself,
  NO shadow at all, no ground plane, no people, no other props. PNG with
  alpha channel, 512x512, the ball filling the frame with about a 6%
  margin on every side.
  ```

## 동작 스펙 (2단계 구현 시 기준)

공 클릭 → 골 넣기:

1. 공은 버튼(`aria-label="공 차기"`). 클릭하면 `goal`의 골문 안쪽(시작값: 가로 11%, 세로 ≈ 38.5vw 지점)까지 약 1.1초 동안 포물선으로 날아간다 — 가로는 등속, 세로는 올라갈 땐 ease-out, 내려올 땐 ease-in, 회전하며 3.6vw → 약 2.4vw로 원근 축소. 비행 중에는 캐릭터 위(z-index 3)를 지나다가 마지막 15% 구간에서 골대 뒤(z-index 0)로 이산 전환. `ball-bounce.mp3` 재생. 비행 중 재클릭은 무시.
2. 도착 시: 그물 출렁임(CSS), `goal.mp3`, 전광판 문구를 약 3초간 "GOAL!! 골~~~인!"으로 교체 후 원래 문구("○○ 화이팅~!!")로 복귀, 콘페티(CSS 파티클, 민트/흰/금색). 3초 뒤 공이 제자리에서 팝인으로 다시 나타남.
3. 3번째 골마다(메모리 카운터, 저장 안 함 — 오버레이를 닫으면 초기화): "HAT-TRICK!!" + `cheer.mp3`. (`victory.mp3`는 다른 용도의 효과음이라 이 기능에서 쓰지 않는다.)
4. 소소한 반응: 코너 플래그 클릭 → 좌우로 흔들림, 콘 클릭 → 휘청(`ball-bounce.mp3`). 저장 이미지에는 반영하지 않음.
5. `prefers-reduced-motion`: 비행/콘페티 생략, 효과음 + 전광판 문구만.
6. 모바일 터치: 공(3.6vw)은 작아서 투명 히트 영역을 최소 32px로 확장.
7. **이미지로 저장**: 소품은 정지 상태(공 제자리)로 그려지고, 골 문구·콘페티·킥 애니메이션은 저장하지 않는다. 그리기 순서 = 배경 → behind 소품 → 캐릭터(뒷줄 → 앞줄) → front 소품 → LED 전광판.
8. 효과음은 `sfxEnabled`/`sfxVolume` 설정을 따른다. `playSfx`(`src/web/sfxAudio.ts`)는 **단일 채널**이라 새 소리가 이전 소리를 끊고 재생됨 — 킥음 → 골음처럼 순차 재생이면 문제없음.

## 필요 사운드

전부 `public/sfxes/`의 기존 파일 재사용, 신규 사운드 없음: `ball-bounce.mp3`(킥/콘 반응), `goal.mp3`(골), `cheer.mp3`(해트트릭 + 기존 캐릭터 선택음). **`victory.mp3`는 다른 용도의 효과음이므로 사용 금지.**

## 구현 메모 (2단계 — 구현 완료)

- 신규: `src/web/group-photo/groupPhotoProps.ts`(소품 슬롯 + 공 + 골 목표점, 화면·캔버스 공용 단일 소스), `GroupPhotoProp.tsx`(정지 소품 + 클릭 반응), `GroupPhotoBall.tsx`(공 킥 단계 머신), `GroupPhotoConfetti.tsx`(골 색종이), `groupPhotoProps.test.ts`. 수정: `groupPhotoAssets.ts`(`props/*.webp` glob), `GroupPhotoOverlay.tsx`, `group-photo.css`, `exportGroupPhotoImage.ts`, `scripts/convert-group-photo-art.mjs`(`props/` 접두어 + 트림).
- **소품 위치를 바꾸려면** `groupPhotoProps.ts`의 `left`/`bottomVw`/`widthVw`만 고치면 화면과 저장 이미지가 함께 바뀐다. `goal`을 옮기면 같은 파일의 `GROUP_PHOTO_GOAL_TARGET`(공이 도착하는 골문 안쪽)도 같이 옮길 것 — 테스트가 목표점이 골대 범위 안인지 검사한다.
- 킥 비행 시간은 `GroupPhotoBall.tsx`의 `FLIGHT_MS`(1100)와 `group-photo.css`의 `--kick-duration` 기본값이 같은 값이어야 한다(컴포넌트가 CSS 변수로 내려주므로 `FLIGHT_MS`만 바꿔도 됨). 원근 축소 배율 `.62`는 CSS `gp-kick-y`와 `GROUP_PHOTO_BALL_END_SCALE`에 있다.
- **저장 이미지 동기화 주의**: 기존 `exportGroupPhotoImage.ts`는 캐릭터 줄 위치(`BACK_TOP_VW`/`FRONT_TOP_VW`)를 CSS와 손으로 이중 관리한다. 소품은 이 방식을 따라하지 말고 데이터 파일 하나만 읽는다. DOM에만 추가한 요소는 PNG에 찍히지 않는다.
- 이미지는 Vite가 번들하는 same-origin 자산이어야 캔버스가 오염(taint)되지 않는다 (`crossOrigin` 미설정). 외부 CDN 이미지 금지.
- 이 오버레이는 잔디동 월드 엔딩 사진 액자([`WorldOverlay.tsx`](../src/web/world/WorldOverlay.tsx))에서도 재사용되므로 소품도 거기서 같이 나온다.

## 보류 아이디어 (이번 범위 밖)

이번에는 "축구장 소품 + 골 넣기"만 진행한다. 아래는 나중에 이어서 할 후보들.

| 아이디어 | 내용 | 필요한 것 | 난이도 |
|---|---|---|---|
| 야간 조명 모드 + 하늘 요소 | 경기장 조명을 클릭하면 `light-on.mp3`와 함께 해질녘/야간 분위기로 전환(CSS 오버레이, 저장 이미지에도 합성). 하늘엔 "잔디동 화이팅" 현수막 비행선/새 떼가 천천히 이동 | 비행선 이미지 1장(+ 새 실루엣), 사운드는 기존 `light-on/off.mp3` | 중 (저장 이미지 합성 포함) |
| 사진사 + 셀프타이머 점프샷 | 앞줄 좌하단에 삼각대 카메라/사진사 소품. 클릭하면 3-2-1 카운트 후 플래시와 함께 전원이 점프 — 캐릭터는 분리 컷아웃이라 이미지 추가 없이 CSS 모션 가능 | 카메라/사진사 이미지 1장, 셔터음 1개(신규) | 중 |
| 숨은 이스터에그 도감 | 네잎클로버, 스탠드에서 내다보는 마스코트, 옐로/레드카드 든 심판 등 숨은 소품을 찾으면 `shine.mp3`와 함께 발견 카운터(localStorage, `storage.ts` 스키마 v2) 증가 | 숨은 소품 이미지 5~6장 | 상 (저장 상태 + UI) |
| 감독(우왁굳) 클릭 반응 | 감독을 클릭하면 호루라기 + 말풍선("집중!!") + 헤드셋 "40" 반짝 | 호루라기 사운드(신규) | 하 |

각 아이디어를 진행하게 되면 이 문서에 섹션을 추가하고(소품 배치표 + 프롬프트), 저장 이미지 합성이 필요한지부터 결정할 것.
