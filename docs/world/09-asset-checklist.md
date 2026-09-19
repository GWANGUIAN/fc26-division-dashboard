# 09. 에셋 마스터 체크리스트

잔디동 월드의 **모든 이미지·오디오 에셋**의 진행 상태를 한 곳에서 추적한다. 프롬프트/검색 키워드는 각 문서를 본다: 캐릭터 [04](04-art-characters.md), 월드 [05](05-art-world.md), UI [06](06-art-ui.md), 오디오 [07](07-audio.md). 작업 후 `[ ]`를 `[x]`로 바꾸고 [README.md](README.md)의 진행 요약을 갱신한다.

> 이미지 생성 순서·스레드·프롬프트는 [10-image-generation-runbook.md](10-image-generation-runbook.md)(#001~#151).

- 상태: `[ ]` 미착수 · `[~]` 진행 중(원본 있음, 미변환) · `[x]` 완료(최종 파일이 저장소에 있음)
- P0 = 해당 구현 세션에 필요, P1 = 콘텐츠 완성, P2 = 여력 시. 세션별 필요 트랙은 [08 §2](08-implementation-roadmap.md#2-아트-트랙-사용자-작업-코드-세션과-병렬).
- 원본은 `tmp/world-src/<카테고리>/`, 최종은 `src/web/assets/world/<카테고리>/`(이미지) / `public/`(오디오).

## 총계

| 구분 | 생성 장수 | P0 | P1 | P2 |
| --- | --- | --- | --- | --- |
| 캐릭터 (04) | 74 | 52 | 22 | 0 |
| 월드 (05) | 63 | 41 | 21 | 1 |
| UI (06) | 14 | 13 | 1 | 0 |
| **이미지 합계** | **151** | **106** | **44** | **1** |
| BGM (07) | 14곡 | 5 | 4 | 5 |
| 신규 SFX (07) | 53개 | 19 | 26 | 8 |
| 앰비언스 (07, 옵션) | 9개 | 0 | 1 | 8 |

월드 P0 41 = 지면 3 + 소품 6 + 건물 15 + 실내 16 + `fx-markers` 1. 월드 P1 21 = 지면 5 + 소품 5 + 건물 2 + 실내 3 + 러시 4 + FX 2. 절별 표가 진실이며 이 요약과 다르면 절별 표를 따른다.

## 자동 생성 파생 에셋

**AI로 만들지 않는 것**(변환 스크립트가 원본에서 생성, [08 §3](08-implementation-roadmap.md#3-변환-스크립트-사양)).

| 파생 | 원본 | 규칙 |
| --- | --- | --- |
| `terrain/core-withered.webp`, `pitch-withered`, `spring-withered`, `frost-withered`, `cloud-withered` | 같은 이름 지면 시트 | 채도 0.35 + 노란 틴트 |
| `props/<id>-withered.webp` (15개) | `tree-oak`, `tree-oak-big`, `tree-pine`, `tree-birch`, `tree-sakura`, `bush-a`, `bush-berry`, `bush-flower`, `hedge-h`, `flower-red`, `flower-yellow`, `flower-white`, `flower-blue`, `grass-tuft-prop`, `fern` | 〃 |
| `characters/weeder-grunt-gardener-atlas.webp` | `weeder-grunt-atlas.webp` | 팔레트 스왑(회색→초록) |
| `characters/weedking-reformed-atlas.webp` (P2) | `weedking-atlas.webp` | 채도+·밝게 |
| `characters/<id>-stand.webp` | `char-<id>-stand.png` | 높이 256px 최근접 |
| 좌향 프레임 | 우향 프레임 | 런타임 좌우 반전(비대칭 시 별도 시트 P2) |

## 1. 캐릭터 (04)

각 칸: stand / turn / walk / portrait 원본 완료 여부, 마지막 열은 변환 완료(아틀라스+초상 4개).

| id | 이름 | P | stand | turn | walk | portrait | 변환 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `janine95kim` | 재닌 | P0 (A1 테스트) | [x] | [x] | [x] | [x] | [x] |
| `bboringirl` | 뽀린걸 | P0 | [x] | [x] | [x] | [x] | [x] |
| `sjh4018` | 핑구 | P0 | [x] | [x] | [x] | [x] | [x] |
| `doormomo` | 문모모 | P0 | [x] | [x] | [x] | [x] | [x] |
| `hachi97` | 하치 | P0 | [x] | [x] | [x] | [x] | [x] |
| `kaksjak0730` | 한결 | P0 | [x] | [x] | [x] | [x] | [x] |
| `ju010228` | 쥬멩이 | P0 | [x] | [x] | [x] | [x] | [x] |
| `haepalin` | 해파린 | P0 | [x] | [x] | [x] | [x] | [x] |
| `tleod1818` | 빙밍 | P0 | [x] | [x] | [x] | [x] | [x] |
| `tdnlamuron` | 다시바 | P0 | [x] | [x] | [x] | [x] | [x] |
| `lina0108` | 리냐 | P0 | [x] | [x] | [x] | [x] | [x] |
| `woowakgood` | 우왁굳 | P0 | [x] | [x] | [x] | [x] | [x] |
| `elder` | 잔디 할아버지 | P0 | [x] | [x] | [x] | [x] | [x] |
| `shopkeeper` | 편의점 사장님 | P1 | [x] | [x] | [x] | [x] | [x] |
| `kid` | 꼬마 팬 | P1 | [x] | [x] | [x] | [x] | [x] |
| `referee` | 심판 | P1 | [x] | [x] | [x] | [x] | [x] |
| `weedking` | 제초왕 | P1 | [x] | [x] | [x] | [x] | [x] |
| `weeder-grunt` | 제초 요원 | P1 | [x] | [x] | [x] | [x] | [x] |
| `cat-jandi` | 잔디냥 | P1 | — | — | [x] | — | [x] |
| `dog-ball` | 공돌이 | P1 | — | — | [x] | — | [x] |

(생성 74 = 인간 18 × 4 + 동물 2 × 1. P0 = 13 × 4 = 52, P1 = 5 × 4 + 2 = 22.)

## 2. 지면 텍스처 시트 (05 §1) — 8

| 시트 | 원본 | 최종 | P | 원본 | 변환 |
| --- | --- | --- | --- | --- | --- |
| `core` | `terrain-core.png` | `terrain/core.webp` (+`core-withered`) | P0 | [x] | [x] |
| `pitch` | `terrain-pitch.png` | `terrain/pitch.webp` (+withered) | P0 | [x] | [x] |
| `water` | `terrain-water.png` | `terrain/water.webp` | P0 | [x] | [x] |
| `spring` | `terrain-spring.png` | `terrain/spring.webp` (+withered) | P1 | [x] | [x] |
| `frost` | `terrain-frost.png` | `terrain/frost.webp` (+withered) | P1 | [x] | [x] |
| `industrial` | `terrain-industrial.png` | `terrain/industrial.webp` | P1 | [x] | [x] |
| `cloud` | `terrain-cloud.png` | `terrain/cloud.webp` (+withered) | P1 | [x] | [x] |
| `weed` | `terrain-weed.png` | `terrain/weed.webp` | P1 | [x] | [x] |

## 3. 소품 시트 (05 §2) — 11 (슬라이스 후 132개)

| 시트 | 원본 | 슬롯 수 | P | 원본 | 변환 |
| --- | --- | --- | --- | --- | --- |
| `trees` | `props-trees.png` | 12 | P0 | [x] | [x] |
| `plants` | `props-plants.png` | 12 | P0 | [x] | [x] |
| `rocks` | `props-rocks.png` | 12 | P0 | [x] | [x] |
| `town` | `props-town.png` | 12 | P0 | [x] | [x] |
| `football` | `props-football.png` | 12 | P0 | [x] | [x] |
| `collect` | `props-collect.png` | 12 | P0 | [x] | [x] |
| `spring` | `props-spring.png` | 12 | P1 | [x] | [x] |
| `frost` | `props-frost.png` | 12 | P1 | [x] | [x] |
| `forge` | `props-forge.png` | 12 | P1 | [x] | [x] |
| `cloud` | `props-cloud.png` | 12 | P1 | [x] | [x] |
| `weed` | `props-weed.png` | 12 | P1 | [x] | [x] |

## 4. 건물 외관 (05 §3) — 17

| id | 이름 | 최종 px | P | 원본 | 변환 |
| --- | --- | --- | --- | --- | --- |
| `clubhouse` | 클럽하우스 | 384×256 | P0 | [x] | [x] |
| `stadium` | 스타디움 | 832×512 | P0 | [x] | [x] |
| `fountain` | 분수 조형 | 192×160 | P0 | [x] | [x] |
| `store` | 편의점 | 224×160 | P0 | [x] | [x] |
| `house-janine95kim` | 재닌 집 | 256×224 | P0 (A1) | [x] | [x] |
| `house-bboringirl` | 뽀린걸 집 | 256×192 | P0 | [x] | [x] |
| `house-sjh4018` | 핑구 집 | 320×288 | P0 | [x] | [x] |
| `house-doormomo` | 문모모 집 | 224×352 | P0 | [x] | [x] |
| `house-hachi97` | 하치 집 | 256×224 | P0 | [x] | [x] |
| `house-kaksjak0730` | 한결 집 | 256×256 | P0 | [x] | [x] |
| `house-ju010228` | 쥬멩이 집 | 256×192 | P0 | [x] | [x] |
| `house-haepalin` | 해파린 집 | 224×192 | P0 | [x] | [x] |
| `house-tleod1818` | 빙밍 집 | 256×192 | P0 | [x] | [x] |
| `house-tdnlamuron` | 다시바 집 | 224×192 | P0 | [x] | [x] |
| `house-lina0108` | 리냐 집 | 256×192 | P0 | [x] | [x] |
| `cafe` | 왁물원 카페 | 224×160 | P1 | [x] | [x] |
| `factory` | 제초 공장 | 416×320 | P1 | [x] | [x] |

## 5. 실내 (05 §4) — 19 (모두 640×384)

| id | 이름 | P | 원본 `int-<id>.png` | 변환 |
| --- | --- | --- | --- | --- |
| `house-janine95kim` | 재닌 | P0 (A1) | [x] | [x] |
| `house-bboringirl` | 뽀린걸 | P0 | [x] | [x] |
| `house-sjh4018` | 핑구 | P0 | [x] | [x] |
| `house-doormomo` | 문모모 | P0 | [x] | [x] |
| `house-hachi97` | 하치 | P0 | [x] | [x] |
| `house-kaksjak0730` | 한결 | P0 | [x] | [x] |
| `house-ju010228` | 쥬멩이 | P0 | [x] | [x] |
| `house-haepalin` | 해파린 | P0 | [x] | [x] |
| `house-tleod1818` | 빙밍 | P0 | [x] | [x] |
| `house-tdnlamuron` | 다시바 | P0 | [x] | [x] |
| `house-lina0108` | 리냐 | P0 | [x] | [x] |
| `clubhouse-lobby` | 클럽하우스 로비 | P0 | [x] | [x] |
| `clubhouse-office` | 감독실 | P0 | [x] | [x] |
| `arcade` | 지하 오락실 | P0 | [x] | [x] |
| `stadium` | 스타디움 내부 | P0 | [x] | [x] |
| `store` | 편의점 | P0 | [x] | [x] |
| `cafe` | 카페 | P1 | [x] | [x] |
| `clubhouse-trophy` | 트로피룸 | P1 | [x] | [x] |
| `factory` | 제초 공장 내부 | P1 | [x] | [x] |

## 6. UI (06) — 14장 (슬라이스 후 약 100개)

| 원본 | 최종 | P | 원본 | 변환 |
| --- | --- | --- | --- | --- |
| `ui-fab-normal.png` | `ui/fab-normal.webp` | P0 (S1) | [x] | [x] |
| `ui-fab-hover.png` | `ui/fab-hover.webp` | P0 (S1) | [x] | [x] |
| `ui-fab-icon.png` | `ui/fab-icon.webp` | P0 | [x] | [x] |
| `ui-loading-bg.png` | `ui/loading-bg.webp` | P0 | [x] | [x] |
| `ui-title-bg.png` | `ui/title-bg.webp` | P0 | [x] | [x] |
| `ui-logo-emblem.png` | `ui/logo-emblem.webp` | P0 | [x] | [x] |
| `ui-frames-dialog.png` (12) | `ui/dialog-frame, nameplate, portrait-frame, choice-normal, choice-selected, cursor, next-1, next-2, toast-frame, coach-frame, tooltip-frame, loading-bar-frame` | P0 (A1) | [x] | [x] |
| `ui-frames-panel.png` (12) | `ui/panel-frame, panel-parchment, tab-normal, tab-active, hud-tracker, minimap-frame, shard-gauge, shard-empty, shard-filled, board-paper, stamp-card, stamp-mark` | P0 | [x] | [x] |
| `ui-buttons.png` (8) | `ui/btn-{primary,secondary}-{normal,hover,pressed,disabled}` | P0 | [x] | [x] |
| `ui-select-bg.png` | `ui/select-bg.webp` | P0 | [x] | [x] |
| `ui-select-cards.png` (12) | `ui/card-normal, card-hover, card-selected, card-dim, arrow-left, arrow-right, name-ribbon, spotlight, shadow-ellipse, ball-marker, sparkle-ring, check-badge` | P0 | [x] | [x] |
| `ui-icons-mission.png` (12) | `ui/mi-*` | P0 | [x] | [x] |
| `ui-icons-menu.png` (12) | `ui/mn-*` | P0 | [x] | [x] |
| `ui-badges.png` (12) | `ui/bd-*` | P1 | [x] | [x] |

## 7. FX·러시 (05 §5~6) — 8

| 원본 | 최종 | P | 원본 | 변환 |
| --- | --- | --- | --- | --- |
| `fx-markers.png` (12) | `fx/mark-new, mark-complete, mark-progress, sparkle-1..4, dust-1..4, target-ring` | P0 | [x] | [x] |
| `fx-emotes.png` (12) | `fx/emote-*` | P1 | [x] | [x] |
| `fx-world.png` (12) | `fx/grow-1..6, ripple-1..4, splash-1, splash-2` | P1 | [x] | [x] |
| `rush-bg-far.png` | `rush/bg-far.webp` | P1 | [x] | [x] |
| `rush-bg-mid.png` | `rush/bg-mid.webp` | P1 | [x] | [x] |
| `rush-ground.png` | `rush/ground.webp` | P1 | [x] | [x] |
| `rush-obstacles.png` (12) | `rush/mower, cone, hurdle, tackler-low, tackler-stand, banner-low, puddle, sprinkler, seed, goldball, magnet, shield` | P1 | [x] | [x] |
| `rush-bg-factory.png` | `rush/bg-factory.webp` | P2 | [x] | [x] |

## 8. 오디오 (07)

번호는 [07-audio.md](07-audio.md)의 표 번호와 동일. 세부 파일명·키워드는 07, 여기서는 진행만 체크한다.

### BGM (14)
- [ ] B1 title (P0) · [ ] B2 field-lush (P0) · [ ] B3 field-withered (P0) · [ ] B4 interior (P0) · [ ] B5 arcade (P0)
- [ ] B6 stadium (P1) · [ ] B7 boss (P1) · [ ] B8 ending (P1) · [ ] B9 rush (P1)
- [ ] B10 region-sky (P2) · [ ] B11 region-spring (P2) · [ ] B12 region-frost (P2) · [ ] B13 region-forge (P2) · [ ] B14 region-weed (P2)

### 신규 SFX (53)
- **P0 (19)**: [ ] S1 [ ] S2 [ ] S3 [ ] S4 [ ] S5 [ ] S7 [ ] S8 [ ] S10 [ ] S11 [ ] S12 [ ] S18 [ ] S19 [ ] S23 [ ] S25 [ ] S26 [ ] S27 [ ] S28 [ ] S32 [ ] S34
- **P1 (26)**: [ ] S6 [ ] S9 [ ] S13 [ ] S14 [ ] S15 [ ] S20 [ ] S21 [ ] S22 [ ] S24 [ ] S29 [ ] S30 [ ] S33 [ ] S35 [ ] S36 [ ] S37 [ ] S38 [ ] S39 [ ] S40 [ ] S41 [ ] S42 [ ] S45 [ ] S47 [ ] S48 [ ] S49 [ ] S50 [ ] S51
- **P2 (8)**: [ ] S16 [ ] S17 [ ] S31 [ ] S43 [ ] S44 [ ] S46 [ ] S52 [ ] S53

### 앰비언스 (9, 옵션)
- [ ] A1 field-day (P1) · [ ] A2 sky-wind · [ ] A3 spring · [ ] A4 frost-night · [ ] A5 forge · [ ] A6 weed · [ ] A7 water · [ ] A8 crowd · [ ] A9 arcade (모두 P2)

## 9. 파일명 규칙 요약

| 종류 | 원본 | 최종 |
| --- | --- | --- |
| 캐릭터 | `char-<id>-{stand,turn,walk,portrait}.png` | `characters/<id>-atlas.webp`, `characters/<id>-stand.webp`, `portraits/<id>-{neutral,happy,surprised,worried}.webp` |
| 지면 | `terrain-<시트>.png` | `terrain/<시트>.webp` |
| 소품 | `props-<시트>.png` | `props/<id>.webp` |
| 건물 | `bld-<id>.png` | `buildings/<id>.webp` |
| 실내 | `int-<id>.png` | `interiors/int-<id>.webp` |
| UI | `ui-<시트>.png` | `ui/<id>.webp` |
| FX | `fx-<시트>.png` | `fx/<id>.webp` |
| 러시 | `rush-<이름>.png` | `rush/<id>.webp` |
| BGM | (다운로드 원본) | `public/world-bgm-<이름>.mp3` |
| SFX | (다운로드 원본) | `public/sfxes/world-<분류>-<이름>.mp3` |

## 10. 변환 결과와 QA (S1, 2026-09-19)

`pnpm convert:world-art -- --all`로 `tmp/world-src/`의 원본 **151장 전부**(누락 0)를 `src/web/assets/world/`에 **447개 webp**로 변환했다(캐릭터 아틀라스·스탠딩 40 · 초상 72 · 지면 13 · 소품 147 · 건물 17 · 실내 19 · UI 87 · FX 36 · 러시 16). 위 §1~§7의 원본·변환 칸은 이 결과로 `[x]`가 되었다. 스크립트가 QA 경고 76건을 냈고(전체 목록은 `tmp/world-src/qa-report.json`, 커밋 제외), 종류별로 아래에 정리한다. 스크립트 규칙은 [08 §3](08-implementation-roadmap.md#3-변환-스크립트-사양).

- **원본 파일 없음: 0건.** 파생 에셋(`*-withered` 지면 5 + 소품 15, `weeder-grunt-gardener-atlas`, `weedking-reformed-atlas`)도 함께 생성됐다.
- **마젠타 잔여: 실질 0건.** 경고는 `buildings/house-doormomo` 1건(201px)뿐이며, 저장 후 재측정하면 7px이고 육안으로도 보라색 룬 발광이라 배경 잔여가 아니다. 나머지 원본은 모두 진짜 알파 배경이라 크로마키는 쓰이지 않았다.

### 발끝 편차 (걷기 시트, 허용 3px 초과 10명)
스크립트가 발끝을 정렬해 주므로 화면 어긋남은 없지만, 원본 걸음에서 발 높이가 3px 넘게 오르내리는 캐릭터다. 걸을 때 위아래로 튀어 보이면 이 캐릭터의 walk를 재생성한다.

| 캐릭터 | 편차(px) | 캐릭터 | 편차(px) |
| --- | --- | --- | --- |
| `kid` 꼬마 팬 | 5.6 | `weeder-grunt` 제초 요원 | 3.8 |
| `dog-ball` 공돌이 | 5.1 | `kaksjak0730` 한결 | 3.7 |
| `cat-jandi` 잔디냥 | 5.0 | `bboringirl` 뽀린걸 | 3.4 |
| `weedking` 제초왕 | 4.9 | `woowakgood` 우왁굳 | 3.4 |
| `shopkeeper` 편의점 사장님 | 4.4 | `doormomo` 문모모 | 3.2 |

turn(서 있는 자세) 시트의 발끝 편차는 전원 허용 이내였다.

### 9‑slice 대칭 오차 (허용 0.08 초과 3건, 모두 경계선)
`choice-selected`(상하 0.088, 금색 발광 테두리), `board-paper`(상하 0.081, 상단 핀), `card-selected`(상하 0.084, 반짝임). 의도된 비대칭에 가까워 그대로 써도 되지만, 늘렸을 때 테두리가 어긋나면 재생성한다. 탭(`tab-normal/active`)은 위쪽 모서리가 둥근 디자인이라 좌우만 검사했고 통과했다.

### 기타 경고
- **셀/시트 가장자리 접촉 2건**: `portraits/kaksjak0730-happy`, `kaksjak0730-worried`(초상이 시트 가장자리에 닿아 잘렸을 수 있음). 반신상이라 하단 접촉은 무시하고 좌·우·상단만 검사한 결과다. 육안 확인 후 필요하면 재생성.
- **타일 이음매 1건**: `terrain/industrial`의 `caution-stripe` 타일(오차 0.251, 사선 줄무늬라 이음매가 보이기 쉬움). 필요하면 `pnpm convert:world-art -- terrain industrial --seamless`.
- **종횡비 차이 25% 초과 59건**: AI가 문서의 비율과 다르게 그려서, 비율을 유지하고 남는 쪽을 투명 여백으로 채웠다(왜곡 없음). 결과적으로 스프라이트가 문서 크기(px)보다 작게 보인다. 특히 세로로 길어야 하는 것(`fence-wood-v`, `flagpole`, `dock-post`, `rink-board-v`, `star-lamp`, `wind-vane`, `pier-lantern`, `banner-blue`, `fence-barbed-v`, `stone-wall-v`, `chimney-tall`)은 실제 그려진 크기가 눈에 띄게 작다. S2 `propDefs.ts`는 **문서 표의 px가 아니라 변환된 실제 이미지 크기**(`img.width/height`)를 기준으로 충돌 사각형을 잡는다.
  > tree-oak-big, tree-sakura, tree-cloud, tree-night, tree-dead, log, fence-wood-v, fence-wood-corner, stone-wall-v, cliff-face, lamp-post, signpost-arrow, flagpole, goal-west, corner-flag, ad-board, vine-trellis, lantern-pink, dragon-egg, scarecrow, windchime, ice-crystal-a, snowman, telescope, scrap-pile, pipe-v, pipe-corner, chimney-small, boat-small, rink-board-v, star-lamp, dock-post, pier-lantern, cloud-pillar, rune-stone-a, rune-stone-b, crystal-purple, wind-vane, banner-blue, cloud-stairs, fence-barbed-v, barricade, floodlight, chimney-tall, house-janine95kim, house-sjh4018, house-tdnlamuron, cursor, next-1, ball-marker, sparkle-ring, mark-complete, mark-progress, splash-1, tackler-stand, puddle, sprinkler, goldball, magnet

### 문서와 달라진 규격 (원본이 문서 캔버스와 다르게 나옴)
- 원본 캔버스 크기가 문서(1024/1536)와 다른 파일이 많다: 캐릭터 stand·portrait 1254², 지면 시트 1254², UI 배경 1672×941, `fab-normal` 2086×754, `fab-hover` 2032×774, `logo-emblem` 1230×1278, `bld-fountain`·`house-kaksjak0730` 1254², `house-doormomo` 1024×1536. 변환 스크립트는 해상도에 의존하지 않도록 비례로 처리한다.
- 9‑slice 프레임과 버튼·카드는 **원본 비율을 유지**하므로 최종 크기가 06의 표와 다르다(늘려 쓰는 프레임이라 문제 없음). 예: `dialog-frame` 96×43(표 96×96), `btn-*` 약 62×28(표 96×28), `tooltip-frame` 52×32, `loading-bar-frame` 210×32, `shard-gauge` 120×28, `card-*` 72×79~91(표 72×104, 카드 4종의 높이가 서로 다름). `border-image-slice`가 크기의 절반을 넘지 않는지만 확인하면 된다(스크립트가 검사).
- `fab-normal`/`fab-hover`는 264×72로 변환됐다(비율 3.67로 일치). 플로팅 버튼은 CSS로 220×60에 맞춰 표시한다.
