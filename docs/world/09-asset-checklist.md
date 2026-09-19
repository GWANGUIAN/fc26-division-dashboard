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
| `janine95kim` | 재닌 | P0 (A1 테스트) | [ ] | [ ] | [ ] | [ ] | [ ] |
| `bboringirl` | 뽀린걸 | P0 | [ ] | [ ] | [ ] | [ ] | [ ] |
| `sjh4018` | 핑구 | P0 | [ ] | [ ] | [ ] | [ ] | [ ] |
| `doormomo` | 문모모 | P0 | [ ] | [ ] | [ ] | [ ] | [ ] |
| `hachi97` | 하치 | P0 | [ ] | [ ] | [ ] | [ ] | [ ] |
| `kaksjak0730` | 한결 | P0 | [ ] | [ ] | [ ] | [ ] | [ ] |
| `ju010228` | 쥬멩이 | P0 | [ ] | [ ] | [ ] | [ ] | [ ] |
| `haepalin` | 해파린 | P0 | [ ] | [ ] | [ ] | [ ] | [ ] |
| `tleod1818` | 빙밍 | P0 | [ ] | [ ] | [ ] | [ ] | [ ] |
| `tdnlamuron` | 다시바 | P0 | [ ] | [ ] | [ ] | [ ] | [ ] |
| `lina0108` | 리냐 | P0 | [ ] | [ ] | [ ] | [ ] | [ ] |
| `woowakgood` | 우왁굳 | P0 | [ ] | [ ] | [ ] | [ ] | [ ] |
| `elder` | 잔디 할아버지 | P0 | [ ] | [ ] | [ ] | [ ] | [ ] |
| `shopkeeper` | 편의점 사장님 | P1 | [ ] | [ ] | [ ] | [ ] | [ ] |
| `kid` | 꼬마 팬 | P1 | [ ] | [ ] | [ ] | [ ] | [ ] |
| `referee` | 심판 | P1 | [ ] | [ ] | [ ] | [ ] | [ ] |
| `weedking` | 제초왕 | P1 | [ ] | [ ] | [ ] | [ ] | [ ] |
| `weeder-grunt` | 제초 요원 | P1 | [ ] | [ ] | [ ] | [ ] | [ ] |
| `cat-jandi` | 잔디냥 | P1 | — | — | [ ] | — | [ ] |
| `dog-ball` | 공돌이 | P1 | — | — | [ ] | — | [ ] |

(생성 74 = 인간 18 × 4 + 동물 2 × 1. P0 = 13 × 4 = 52, P1 = 5 × 4 + 2 = 22.)

## 2. 지면 텍스처 시트 (05 §1) — 8

| 시트 | 원본 | 최종 | P | 원본 | 변환 |
| --- | --- | --- | --- | --- | --- |
| `core` | `terrain-core.png` | `terrain/core.webp` (+`core-withered`) | P0 | [ ] | [ ] |
| `pitch` | `terrain-pitch.png` | `terrain/pitch.webp` (+withered) | P0 | [ ] | [ ] |
| `water` | `terrain-water.png` | `terrain/water.webp` | P0 | [ ] | [ ] |
| `spring` | `terrain-spring.png` | `terrain/spring.webp` (+withered) | P1 | [ ] | [ ] |
| `frost` | `terrain-frost.png` | `terrain/frost.webp` (+withered) | P1 | [ ] | [ ] |
| `industrial` | `terrain-industrial.png` | `terrain/industrial.webp` | P1 | [ ] | [ ] |
| `cloud` | `terrain-cloud.png` | `terrain/cloud.webp` (+withered) | P1 | [ ] | [ ] |
| `weed` | `terrain-weed.png` | `terrain/weed.webp` | P1 | [ ] | [ ] |

## 3. 소품 시트 (05 §2) — 11 (슬라이스 후 132개)

| 시트 | 원본 | 슬롯 수 | P | 원본 | 변환 |
| --- | --- | --- | --- | --- | --- |
| `trees` | `props-trees.png` | 12 | P0 | [ ] | [ ] |
| `plants` | `props-plants.png` | 12 | P0 | [ ] | [ ] |
| `rocks` | `props-rocks.png` | 12 | P0 | [ ] | [ ] |
| `town` | `props-town.png` | 12 | P0 | [ ] | [ ] |
| `football` | `props-football.png` | 12 | P0 | [ ] | [ ] |
| `collect` | `props-collect.png` | 12 | P0 | [ ] | [ ] |
| `spring` | `props-spring.png` | 12 | P1 | [ ] | [ ] |
| `frost` | `props-frost.png` | 12 | P1 | [ ] | [ ] |
| `forge` | `props-forge.png` | 12 | P1 | [ ] | [ ] |
| `cloud` | `props-cloud.png` | 12 | P1 | [ ] | [ ] |
| `weed` | `props-weed.png` | 12 | P1 | [ ] | [ ] |

## 4. 건물 외관 (05 §3) — 17

| id | 이름 | 최종 px | P | 원본 | 변환 |
| --- | --- | --- | --- | --- | --- |
| `clubhouse` | 클럽하우스 | 384×256 | P0 | [ ] | [ ] |
| `stadium` | 스타디움 | 832×512 | P0 | [ ] | [ ] |
| `fountain` | 분수 조형 | 192×160 | P0 | [ ] | [ ] |
| `store` | 편의점 | 224×160 | P0 | [ ] | [ ] |
| `house-janine95kim` | 재닌 집 | 256×224 | P0 (A1) | [ ] | [ ] |
| `house-bboringirl` | 뽀린걸 집 | 256×192 | P0 | [ ] | [ ] |
| `house-sjh4018` | 핑구 집 | 320×288 | P0 | [ ] | [ ] |
| `house-doormomo` | 문모모 집 | 224×352 | P0 | [ ] | [ ] |
| `house-hachi97` | 하치 집 | 256×224 | P0 | [ ] | [ ] |
| `house-kaksjak0730` | 한결 집 | 256×256 | P0 | [ ] | [ ] |
| `house-ju010228` | 쥬멩이 집 | 256×192 | P0 | [ ] | [ ] |
| `house-haepalin` | 해파린 집 | 224×192 | P0 | [ ] | [ ] |
| `house-tleod1818` | 빙밍 집 | 256×192 | P0 | [ ] | [ ] |
| `house-tdnlamuron` | 다시바 집 | 224×192 | P0 | [ ] | [ ] |
| `house-lina0108` | 리냐 집 | 256×192 | P0 | [ ] | [ ] |
| `cafe` | 왁물원 카페 | 224×160 | P1 | [ ] | [ ] |
| `factory` | 제초 공장 | 416×320 | P1 | [ ] | [ ] |

## 5. 실내 (05 §4) — 19 (모두 640×384)

| id | 이름 | P | 원본 `int-<id>.png` | 변환 |
| --- | --- | --- | --- | --- |
| `house-janine95kim` | 재닌 | P0 (A1) | [ ] | [ ] |
| `house-bboringirl` | 뽀린걸 | P0 | [ ] | [ ] |
| `house-sjh4018` | 핑구 | P0 | [ ] | [ ] |
| `house-doormomo` | 문모모 | P0 | [ ] | [ ] |
| `house-hachi97` | 하치 | P0 | [ ] | [ ] |
| `house-kaksjak0730` | 한결 | P0 | [ ] | [ ] |
| `house-ju010228` | 쥬멩이 | P0 | [ ] | [ ] |
| `house-haepalin` | 해파린 | P0 | [ ] | [ ] |
| `house-tleod1818` | 빙밍 | P0 | [ ] | [ ] |
| `house-tdnlamuron` | 다시바 | P0 | [ ] | [ ] |
| `house-lina0108` | 리냐 | P0 | [ ] | [ ] |
| `clubhouse-lobby` | 클럽하우스 로비 | P0 | [ ] | [ ] |
| `clubhouse-office` | 감독실 | P0 | [ ] | [ ] |
| `arcade` | 지하 오락실 | P0 | [ ] | [ ] |
| `stadium` | 스타디움 내부 | P0 | [ ] | [ ] |
| `store` | 편의점 | P0 | [ ] | [ ] |
| `cafe` | 카페 | P1 | [ ] | [ ] |
| `clubhouse-trophy` | 트로피룸 | P1 | [ ] | [ ] |
| `factory` | 제초 공장 내부 | P1 | [ ] | [ ] |

## 6. UI (06) — 14장 (슬라이스 후 약 100개)

| 원본 | 최종 | P | 원본 | 변환 |
| --- | --- | --- | --- | --- |
| `ui-fab-normal.png` | `ui/fab-normal.webp` | P0 (S1) | [ ] | [ ] |
| `ui-fab-hover.png` | `ui/fab-hover.webp` | P0 (S1) | [ ] | [ ] |
| `ui-fab-icon.png` | `ui/fab-icon.webp` | P0 | [ ] | [ ] |
| `ui-loading-bg.png` | `ui/loading-bg.webp` | P0 | [ ] | [ ] |
| `ui-title-bg.png` | `ui/title-bg.webp` | P0 | [ ] | [ ] |
| `ui-logo-emblem.png` | `ui/logo-emblem.webp` | P0 | [ ] | [ ] |
| `ui-frames-dialog.png` (12) | `ui/dialog-frame, nameplate, portrait-frame, choice-normal, choice-selected, cursor, next-1, next-2, toast-frame, coach-frame, tooltip-frame, loading-bar-frame` | P0 (A1) | [ ] | [ ] |
| `ui-frames-panel.png` (12) | `ui/panel-frame, panel-parchment, tab-normal, tab-active, hud-tracker, minimap-frame, shard-gauge, shard-empty, shard-filled, board-paper, stamp-card, stamp-mark` | P0 | [ ] | [ ] |
| `ui-buttons.png` (8) | `ui/btn-{primary,secondary}-{normal,hover,pressed,disabled}` | P0 | [ ] | [ ] |
| `ui-select-bg.png` | `ui/select-bg.webp` | P0 | [ ] | [ ] |
| `ui-select-cards.png` (12) | `ui/card-normal, card-hover, card-selected, card-dim, arrow-left, arrow-right, name-ribbon, spotlight, shadow-ellipse, ball-marker, sparkle-ring, check-badge` | P0 | [ ] | [ ] |
| `ui-icons-mission.png` (12) | `ui/mi-*` | P0 | [ ] | [ ] |
| `ui-icons-menu.png` (12) | `ui/mn-*` | P0 | [ ] | [ ] |
| `ui-badges.png` (12) | `ui/bd-*` | P1 | [ ] | [ ] |

## 7. FX·러시 (05 §5~6) — 8

| 원본 | 최종 | P | 원본 | 변환 |
| --- | --- | --- | --- | --- |
| `fx-markers.png` (12) | `fx/mark-new, mark-complete, mark-progress, sparkle-1..4, dust-1..4, target-ring` | P0 | [ ] | [ ] |
| `fx-emotes.png` (12) | `fx/emote-*` | P1 | [ ] | [ ] |
| `fx-world.png` (12) | `fx/grow-1..6, ripple-1..4, splash-1, splash-2` | P1 | [ ] | [ ] |
| `rush-bg-far.png` | `rush/bg-far.webp` | P1 | [ ] | [ ] |
| `rush-bg-mid.png` | `rush/bg-mid.webp` | P1 | [ ] | [ ] |
| `rush-ground.png` | `rush/ground.webp` | P1 | [ ] | [ ] |
| `rush-obstacles.png` (12) | `rush/mower, cone, hurdle, tackler-low, tackler-stand, banner-low, puddle, sprinkler, seed, goldball, magnet, shield` | P1 | [ ] | [ ] |
| `rush-bg-factory.png` | `rush/bg-factory.webp` | P2 | [ ] | [ ] |

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
