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

S7부터는 `tmp/world-src/interiors/int-*.png`의 1536px 폭 원본을 현재 5:3 화면비로 먼저 크롭한 뒤, 최종 논리 화면 크기 640×384로 다운스케일한 **무손실 WebP**를 사용한다.

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
| `ui-frames-panel.png` (12) | `ui/panel-frame, panel-parchment, tab-normal, tab-active, hud-tracker, minimap-frame, shard-gauge-legacy, shard-empty, shard-filled, board-paper, stamp-card, stamp-mark` | P0 | [x] | [x] |
| `ui-shard-gauge.png` | `ui/shard-gauge` | P0 (S7) | [x] | [x] |
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
- [x] B1 title (P0) · [x] B2 field-lush (P0) · [x] B3 field-withered (P0) · [x] B4 interior (P0) · [x] B5 arcade (P0)
- [x] B6 stadium (P1) · [x] B7 boss (P1) · [x] B8 ending (P1) · [x] B9 rush (P1)
- [x] B10 region-sky (P2) · [x] B11 region-spring (P2) · [x] B12 region-frost (P2) · [x] B13 region-forge (P2) · [ ] B14 region-weed (P2)

### 신규 SFX (53)

> 2026-09-19 수집 완료: BGM 13곡(B14 `region-weed`만 남음)과 SFX 53개를 `public/`·`public/sfxes/`에 넣었다(합계 약 25MB). 받은 파일명 오타 2개(`region-forg`→`region-forge`, `step-meta`→`step-metal`)는 복사하며 고쳤다. **출처/라이선스는 아직 07 표에 기록 전** — CC-BY 표기가 필요한 파일이 있는지 S6 크레딧 전에 확인.

- **P0 (19)**: [x] S1 [x] S2 [x] S3 [x] S4 [x] S5 [x] S7 [x] S8 [x] S10 [x] S11 [x] S12 [x] S18 [x] S19 [x] S23 [x] S25 [x] S26 [x] S27 [x] S28 [x] S32 [x] S34
- **P1 (26)**: [x] S6 [x] S9 [x] S13 [x] S14 [x] S15 [x] S20 [x] S21 [x] S22 [x] S24 [x] S29 [x] S30 [x] S33 [x] S35 [x] S36 [x] S37 [x] S38 [x] S39 [x] S40 [x] S41 [x] S42 [x] S45 [x] S47 [x] S48 [x] S49 [x] S50 [x] S51
- **P2 (8)**: [x] S16 [x] S17 [x] S31 [x] S43 [x] S44 [x] S46 [x] S52 [x] S53

### 앰비언스 (9, 옵션)

> 2026-09-19 수집·배치 완료: `C:\Users\bbaa3\Downloads\ambes`의 9개 MP3를 모두 `public/world-amb-*.mp3`로 복사했다(합계 약 2.2MB). 런타임은 중앙/상점·구름/룬·봄·서리·공업·제초동·스타디움·오락실의 8개를 즉시 선택하며, `water`는 호수 전용 존/상호작용 앰비언스가 추가될 때 같은 이름으로 쓸 수 있다.

- [x] A1 field-day (P1) · [x] A2 sky-wind · [x] A3 spring · [x] A4 frost-night · [x] A5 forge · [x] A6 weed · [x] A7 water · [x] A8 crowd · [x] A9 arcade (모두 P2)

### S6 파일·용량 감사 (2026-09-19)

- 실제 파일: BGM **13/14**(`world-bgm-region-weed.mp3` 없음), SFX **53/53**, 앰비언스 **9/9**. 코드의 BGM/SFX/선택 앰비언스(8개) 매핑과 이 파일 상태를 테스트한다. `water`는 파일만 보관하며 호수 전용 존이 생기기 전에는 선택하지 않는다.
- 월드 이미지 447개는 7,974,656 bytes(약 7.6MiB), 월드 오디오 75개는 27,638,376 bytes(약 26.4MiB)다. 가장 큰 파일은 `world-bgm-title.mp3`(3,902,664 bytes)이며, 현 연결 규칙상 미사용 대용량 원본/중복을 삭제하지 않았다.
- 오디오 출처/라이선스는 아직 파일별로 복원되지 않았다. 07 §5 양식을 채우기 전까지는 외부 공개 배포를 막는 항목이며, 크레딧 화면에도 이 상태를 표시한다.

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
- **종횡비 차이 25% 초과 59건**: AI가 문서의 비율과 다르게 그려서, 비율을 유지하고 남는 쪽을 투명 여백으로 채웠다(왜곡 없음). 결과적으로 스프라이트가 문서 크기(px)보다 작게 보인다. 특히 세로로 길어야 하는 것(`fence-wood-v`, `flagpole`, `dock-post`, `rink-board-v`, `star-lamp`, `wind-vane`, `pier-lantern`, `banner-blue`, `fence-barbed-v`, `stone-wall-v`, `chimney-tall`)은 실제 그려진 크기가 눈에 띄게 작다. S2에서 파일 크기를 재 보니 **변환 파일의 가로×세로는 05 표의 px와 정확히 같고**(종횡비가 다른 만큼 위쪽/옆이 투명), 줄어든 것은 *보이는 그림*뿐이다. 그래서 스프라이트는 파일 전체를 아래 중앙 앵커로 그리고, 충돌은 05 표 값을 **보이는 그림 크기로 줄여** 쓴다([§11](#11-s2-소품-충돌-크기-대조-2026-09-19)).
  > tree-oak-big, tree-sakura, tree-cloud, tree-night, tree-dead, log, fence-wood-v, fence-wood-corner, stone-wall-v, cliff-face, lamp-post, signpost-arrow, flagpole, goal-west, corner-flag, ad-board, vine-trellis, lantern-pink, dragon-egg, scarecrow, windchime, ice-crystal-a, snowman, telescope, scrap-pile, pipe-v, pipe-corner, chimney-small, boat-small, rink-board-v, star-lamp, dock-post, pier-lantern, cloud-pillar, rune-stone-a, rune-stone-b, crystal-purple, wind-vane, banner-blue, cloud-stairs, fence-barbed-v, barricade, floodlight, chimney-tall, house-janine95kim, house-sjh4018, house-tdnlamuron, cursor, next-1, ball-marker, sparkle-ring, mark-complete, mark-progress, splash-1, tackler-stand, puddle, sprinkler, goldball, magnet

### 문서와 달라진 규격 (원본이 문서 캔버스와 다르게 나옴)
- 원본 캔버스 크기가 문서(1024/1536)와 다른 파일이 많다: 캐릭터 stand·portrait 1254², 지면 시트 1254², UI 배경 1672×941, `fab-normal` 2086×754, `fab-hover` 2032×774, `logo-emblem` 1230×1278, `bld-fountain`·`house-kaksjak0730` 1254², `house-doormomo` 1024×1536. 변환 스크립트는 해상도에 의존하지 않도록 비례로 처리한다.
- 9‑slice 프레임과 버튼·카드는 **원본 비율을 유지**하므로 최종 크기가 06의 표와 다르다(늘려 쓰는 프레임이라 문제 없음). 예: `dialog-frame` 96×43(표 96×96), `btn-*` 약 62×28(표 96×28), `tooltip-frame` 52×32, `loading-bar-frame` 210×32, `shard-gauge` 120×28, `card-*` 72×79~91(표 72×104, 카드 4종의 높이가 서로 다름). `border-image-slice`가 크기의 절반을 넘지 않는지만 확인하면 된다(스크립트가 검사).
- `fab-normal`/`fab-hover`는 264×72로 변환됐다(비율 3.67로 일치). 플로팅 버튼은 CSS로 220×60에 맞춰 표시한다.

## 11. S2 소품 충돌 크기 대조 (2026-09-19)

`data/propDefs.ts`는 05 §2 표의 충돌 값을 옮기되, **표의 충돌이 실제로 보이는 그림보다 크면 그림 크기로 줄였다**(보이지 않는 벽으로 막히지 않도록). 각 소품의 `content`는 투명 여백을 뺀 그림 크기(알파 40 초과)이며 propDefs에 함께 들어 있다. 줄인 29개:

| 소품 | 파일 크기(=05 표의 px) | 05 표의 충돌 | 실제로 보이는 그림 | S2에서 쓴 충돌 |
| --- | --- | --- | --- | --- |
| `rock-large` | 64×48 | 56×20 | 52×48 | 52×20 |
| `log` | 48×24 | 44×12 | 34×24 | 34×12 |
| `fence-wood-h` | 64×32 | 64×10 | 52×32 | 52×10 |
| `fence-wood-v` | 16×48 | 12×44 | 16×20 | 12×20 |
| `stone-wall-v` | 24×64 | 20×60 | 24×35 | 20×35 |
| `cliff-face` | 96×64 | 96×24 | 66×64 | 66×24 |
| `planter` | 40×32 | 36×14 | 34×32 | 34×14 |
| `bike-rack` | 56×32 | 48×12 | 44×32 | 44×12 |
| `goal-west` | 64×96 | 64×96 | 64×71 | 64×71 |
| `goal-front` | 96×64 | 96×64 | 96×60 | 96×60 |
| `ad-board` | 96×32 | 96×10 | 51×32 | 51×10 |
| `bleacher` | 128×96 | 120×40 | 118×96 | 118×40 |
| `dugout` | 96×64 | 90×24 | 75×64 | 75×24 |
| `dummy-wall` | 72×56 | 68×14 | 56×56 | 56×14 |
| `ball-bag` | 32×28 | 28×10 | 24×28 | 24×10 |
| `pond-small` | 96×64 | 84×40 | 78×64 | 78×40 |
| `rink-board-h` | 64×32 | 64×10 | 52×32 | 52×10 |
| `rink-board-v` | 16×48 | 12×44 | 16×21 | 12×21 |
| `boat-small` | 72×40 | 64×18 | 42×40 | 42×18 |
| `pipe-h` | 64×24 | 64×10 | 53×24 | 53×10 |
| `pipe-v` | 24×64 | 12×56 | 24×45 | 12×45 |
| `pipe-corner` | 32×32 | 28×28 | 32×25 | 28×25 |
| `tool-rack` | 56×40 | 52×10 | 49×40 | 49×10 |
| `scrap-pile` | 56×36 | 48×14 | 41×36 | 41×14 |
| `cloud-bench` | 56×32 | 50×12 | 43×32 | 43×12 |
| `cloud-fountain` | 80×64 | 72×28 | 62×64 | 62×28 |
| `mower-ride-on` | 80×64 | 72×24 | 69×64 | 69×24 |
| `fence-barbed-v` | 16×56 | 12×52 | 16×29 | 12×29 |
| `barricade` | 72×32 | 72×12 | 36×32 | 36×12 |

- 조정한 소품의 원래 표 값은 `propDefs.ts` 각 줄 끝 주석에 남겼다. 나머지 소품은 표 그대로다.
- **어긋남 0건**: 소품 130종·건물 17·실내 19·아틀라스·지면 시트의 파일 크기가 표/`propDefs`와 모두 일치한다(`data/maps/assetSizes.test.ts`가 webp 헤더를 읽어 검사하므로, 다시 변환했는데 크기가 달라지면 테스트가 알려 준다). 렌더링은 디코드된 이미지의 실제 크기를 기준으로 하단 중앙에 앵커한다.
- 특히 세로로 길어야 할 **`fence-wood-v`(16×20), `stone-wall-v`(24×35), `rink-board-v`(16×21), `fence-barbed-v`(16×29), `pipe-v`(24×45)** 등은 표가 가정한 높이의 절반도 안 되게 그려졌다. 세로 울타리로 긴 벽을 만들려면 더 많이 이어 붙여야 한다. 마음에 안 들면 [10 runbook](10-image-generation-runbook.md)의 해당 스텝만 재생성.
- `ad-board`(보이는 폭 51 / 파일 96)·`barricade`(36 / 72)·`boat-small`(42 / 72)는 표 폭의 절반 남짓만 그려졌다. 제초동 게이트는 바리케이드를 세 개 나란히 세운다.
- `goal-west`/`goal-front`의 발자국은 S2 맵에는 놓지 않았고, **S3에서 `goal-west`를 훈련장 서쪽에 세웠다**(발자국 64×71 전체가 단단함. 공은 골대 면에 닿으면 득점, [03 §7](03-map-design.md#7-미션용-월드-오브젝트)). `goal-front`는 아직 안 쓴다.

### S2에서 코드로 대신한 것 (에셋 없음)
- 내 집 이름표 `sign-home`(03 §4): 문 위에 캔버스로 그린 작은 판.
- `E` 상호작용 프롬프트: `tooltip-frame` 9-slice + 글자 `E`(캔버스), 튜토리얼 화살표(황금 삼각형)와 화면 밖 방향 표시.
- 캐릭터·집 그림자 타원, 프롤로그 배경(`title-bg` 위에 어두운 막).
- 사용 중인 신규 UI: `select-bg`, `card-*`, `ball-marker`(선택 카드 위 공), `dialog-frame`·`nameplate`·`portrait-frame`·`choice-*`·`cursor`·`next-1/2`·`toast-frame`·`coach-frame`·`tooltip-frame`. `arrow-*`·`name-ribbon`·`sparkle-ring`·`check-badge`(카드 격자·이름 글자·CSS로 대체해 S2에서는 미사용), 마커(`mark-*`)·이모트·러시 에셋은 S3 이후.

## 12. S3~S4에서 코드에 연결된 에셋 (2026-09-19)

| 종류 | 키 | 쓰임 |
| --- | --- | --- |
| FX(캔버스) | `fx/mark-new`(?), `fx/mark-progress`(…), `fx/mark-complete`(!), `fx/sparkle-1..4` | NPC 머리 위 미션 마커. `!`에는 반짝임 4프레임을 옆에 돌린다. 그림이 없으면 글자 상자로 대신 그린다 |
| 소품(캔버스) | `props/jelly-lantern-a/b/c`, `props/grass-tuft-prop(-withered)`, `props/cone-orange`, `props/ball-standard` | 랜턴 줍기(위아래로 둥실), 광장 잔디 자리(시든 이미지), 콘 코스 콘, 킥 볼 |
| 소품(맵) | `goal-west`, `mailbox`, `fence-wood-h/v`, `corner-flag` | 훈련장 골대·펜스, 배달 우편함, 콘 코스 시작/도착 깃발 |
| UI(DOM) | `ui/shard-gauge`, `ui/shard-filled`, `ui/hud-tracker` | HUD 조각 게이지·트래커 |
| UI(DOM) | `ui/panel-parchment`, `ui/tab-active`, `ui/tab-normal`, `ui/mi-*` | 미션 로그(종이·탭·아이콘) |
| UI(DOM) | `ui/panel-frame`, `ui/mn-*`, `ui/btn-secondary-*` | 일시정지 메뉴 |

### S4 추가 연결

| 종류 | 키/파일 | 쓰임 |
| --- | --- | --- |
| 소품(캔버스) | `props/grass-tuft-prop`, `props/barricade` | `plaza-restored` 뒤 광장 새싹, 엔딩 전 제초동 바리케이드 3개 |
| 캐릭터(캔버스) | 멤버 `characters/<id>-atlas` idle-down | 스타디움 결전 관중석 0.6배 정적 스프라이트(플레이어 본인 제외) |
| 기존 UI(DOM) | `group-photo/*` | 엔딩 및 트로피룸 액자에서 `GroupPhotoOverlay` 재사용(신규 이미지 없음) |
| 오디오(선택) | `world-bgm-boss/ending.mp3`, `world-amb-*.mp3`, `world-core-stop/grow/crowd-roar.mp3` | 결전·개화·엔딩·지구 앰비언스. 파일이 없어도 런타임은 무음으로 안전하게 폴백 |

- **아직 안 쓴 것**: `props/parcel-a/b/c`(택배 그림 — 가방/HUD 문구로만 다룬다), `props/goldball-*`·`shard-*`(황금 공 수집·획득 연출은 S5), `fx/emote-*`·`grow-*`·`ripple-*`·`splash-*`·`dust-*`·`target-ring`, `ui/minimap-frame`(지도 M), `ui/board-paper`·`stamp-*`(일일 게시판, S5), `ui/bd-*`(뱃지 아이콘은 뱃지 화면이 생기는 S5에서 — 지금은 토스트 글자만), `ui/check-badge`.
- **HUD 게이지 칸 위치**는 프레임 그림에 맞춘 눈대중이다. 어긋나면 `world-mission.css`의 `--gauge-x`·`--gauge-pitch`·`--gauge-pip` 세 값만 고친다.
- 뱃지 「배달 왕초보」에는 `bd-*` 아이콘이 없다(06의 12종에 없음). 필요하면 06 §5에 슬롯을 추가한다.


## 13. S5 연결 결과 (2026-09-19)
- 러시: `rush/bg-far`, `bg-mid`, `ground` 3겹 스크롤, 공장 테마 `bg-factory`, 장애물 `cone`, `mower`, `banner-low`, `tackler-stand`, 수집 `seed`. 선택 캐릭터 `characters/<id>-atlas` 오른쪽 걷기 4프레임 재사용, 점프/슬라이드 코드 변형. 신규 이미지 생성 없음.
- 월드 수집: `props/goldball-1`을 20개 접촉 수집품에 사용. `props/board-daily`를 광장 게시판 장식에 연결. 실내 공장 gb-20도 같은 사전 로딩 에셋 사용.
- 패널: 일일 게시판·30칸 스탬프·도감/뱃지는 기존 월드 색을 쓰는 DOM/CSS와 글자 상태 표시. `ui/board-paper`, `stamp-*`, 추가 `bd-*` 그림 적용은 S6 시각 폴리시로 남긴다.
- 오디오: `world-bgm-rush.mp3`와 `sfxes/world-stamp.mp3` 연결. 러시 개별 동작 SFX 추가 폴리시는 S6. 앰비언스 9개 배치와 8개 선택 지점 유지, `world-amb-water.mp3`는 미사용 유지.
- 데이터/액션: `pickup.autoCollect`(황금 공), `daily`/`collection`/`minigame:rush`/`rush-factory`의 연결은 types·맵 무결성 테스트에 반영. 기존 엔딩 플래그와 추가 `factory-garden` 조건으로 표시, 새 호수 존 없음.
- 시각 QA는 README S5 `?worldDebug` 목록으로 사용자 확인. 자동 검증은 도달성·에셋 경로·서버 렌더 패널·헤드리스 접촉 수집을 포함한 670개 테스트 통과.

## 14. S7 아트 교정 대기 목록 (2026-09-19)

- [ ] **walk 20장 교체**: `char-{bboringirl,cat-jandi,dog-ball,doormomo,elder,hachi97,haepalin,janine95kim,ju010228,kaksjak0730,kid,lina0108,referee,shopkeeper,sjh4018,tdnlamuron,tleod1818,weeder-grunt,weedking,woowakgood}-walk.png`. [04 §9](04-art-characters.md#9-s7-보행스탠딩-교정)의 발 교대 QA를 통과한 뒤 캐릭터별 변환을 실행한다.
- [x] **S7 부분 반영 (2026-09-19)**: 사용자 제공 재생성본 중 `bboringirl`, `janine95kim`, `kaksjak0730`, `sjh4018`의 walk를 변환해 `characters/<id>-atlas.webp`에 반영했다. 원본은 모두 알파 포함 `1536×1024`였다.
- [ ] **재생성 필요 — `haepalin` walk**: 오른쪽 보행 행의 두 번째 칸에 유효한 스프라이트 성분이 없어 변환 QA가 `r2c2` 빈 프레임을 보고했다. 기존 아틀라스는 유지하며, [11의 해당 캐릭터 프롬프트](11-s7-image-generation-briefs.md)와 옆모습 실패 재생성 요청을 사용해 고친 뒤 이 파일만 다시 변환한다.
- [ ] **stand 18장 교체**: 위 목록에서 `cat-jandi`, `dog-ball`을 뺀 `char-<id>-stand.png`. 새 walk 시트를 레퍼런스로 사용해 비율을 맞춘다.
- [x] **S7 stand 부분 반영 (2026-09-19)**: 사용자 제공 `bboringirl`, `doormomo`, `hachi97`, `haepalin`, `janine95kim`, `ju010228`, `kaksjak0730`, `lina0108`, `sjh4018`, `tdnlamuron`, `tleod1818`, `woowakgood` 12장을 `--stand-only`로 변환했다. 원본이 규격 문서의 1024px가 아닌 `1254×1254`이지만, 변환기는 비율을 보존해 게임용 stand 높이로 맞춘다.
- [ ] **외곽 프레임 1장**: `ui-game-outer-frame.png` → `ui/game-outer-frame.webp`. 중앙 투명·비상호작용 레이어 규격은 [06 §10](06-art-ui.md#10-s7-선택적-게임-외곽-프레임)을 따른다.
- [x] **고해상도 재변환**: `ui-{loading,title,select}-bg.png` 3장은 1672×940 무손실 WebP, `int-*.png` 19장은 1536px 원본 크롭 후 640×384 무손실 WebP로 재변환했다. `assetSizes.test.ts`가 두 규격을 검사한다.
- 생성 요청은 [11-s7-image-generation-briefs.md](11-s7-image-generation-briefs.md)에 별도 정리했다. 파일마다 레퍼런스·세션 유지 여부·저장 이름·프롬프트를 분리한다.
- 자동 검증: S7 변환 후 `assetSizes.test.ts`가 실내 19장의 640×384 논리 크기와 UI 배경 3장의 1672×940 크기를 확인한다. 전체 `pnpm typecheck && pnpm test`는 2026-09-19에 679개 테스트를 통과했다.

## 15. 엔딩 크레딧 이후 스팅어 에셋 (2026-09-20)

[14-postcredits-image-briefs.md](14-postcredits-image-briefs.md)의 컷 6장. 원본은 `tmp/world-src/ending/`(1672×941 불투명 PNG), 최종은 `src/web/assets/world/ending/`. 변환은 `pnpm convert:world-art -- ending --quality 90`(`world-art-manifest.json`의 `ending.singles`, 1672×940 `cover`, 손실 WebP q90). 6장 합계 약 2.2MB이며 엔딩이 되어서야 `img`로 불려 나온다(개화 시작 때 미리 내려받기 시작, 로딩 프리로더 대상 아님). 크기는 `assetSizes.test.ts`가, 타임라인·에셋 존재는 `state/stinger.test.ts`가 검사한다.

| 파일 | 원본 | 상태 |
| --- | --- | --- |
| `ending/pc-01-dropped-trimmer.webp` | `pc-01-dropped-trimmer.png` | [x] |
| `ending/pc-02-glove-grab.webp` | `pc-02-glove-grab.png` | [x] |
| `ending/pc-03-silhouette-rise.webp` | `pc-03-silhouette-rise.png` | [x] |
| `ending/pc-04-scheme-room.webp` | `pc-04-scheme-room.png` | [x] |
| `ending/pc-05-eye-v-sign.webp` | `pc-05-eye-v-sign.png` | [x] |
| `ending/pc-06-village-hint.webp` | `pc-06-village-hint.png` | [x] |

- 레퍼런스 전용(게임에 싣지 않음): `pc-qqq-stand.png`, `pc-qqq-turn.png`, `ref-qqq-original.png/.webp`.
- 연결: `data/stingerData.ts`(컷·자막·소리 큐) → `state/stinger.ts`(타임라인) → `ui/StingerOverlay.tsx` → `WorldOverlay.tsx`(크레딧 뒤 단계). 스타일은 `world-mission.css`의 `.world-stinger*`.
- 월드 전용 변환 에셋은 447 → 453개(크레딧 표기 `WorldCredits.tsx`도 같이 고쳤다).

## 16. ON AIR 전광판 에셋 (2026-09-20)

| 원본 | 변환 결과 | 크기 | 상태 |
| --- | --- | --- | --- |
| `tmp/world-src/props/onair-sign-on.png` | `props/onair-sign-on.webp` | 58×33 | [x] |
| `tmp/world-src/props/onair-sign-off.png` | `props/onair-sign-off.webp` | 58×33 | [x] |

- 변환은 `pnpm convert:world-art -- onair`(두 장을 한 배율로, 보드 아래 다리·받침대 자동 제거). 사용처는 `engine/onAirSign.ts`, 사전 로딩은 `worldAssets.ts`의 `overworldKeys()`. 자세한 내용은 [15](15-onair-sign.md).
- 월드 전용 변환 에셋은 453 → 455개.
