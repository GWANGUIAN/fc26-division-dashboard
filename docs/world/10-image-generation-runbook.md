# 10. 이미지 생성 실행 순서표 (ChatGPT gpt-image)

**#001부터 순서대로** 이미지를 만들 수 있게 정리한 실행 문서다. 각 스텝에 **저장 이름 / 스레드 / 첨부할 레퍼런스 / 프롬프트(독립형)**가 있다. 프롬프트는 스타일 문구를 **전부 풀어서** 담고 있어 복사해 그대로 붙여넣으면 된다. 배경·설계 이유는 [04](04-art-characters.md)~[06](06-art-ui.md), 진행 체크는 [09](09-asset-checklist.md).

> **이 문서는 스크립트로 생성된다.** 프롬프트를 고치려면 04~06(원천)을 고친 뒤 `node docs/world/tools/build-image-runbook.mjs`를 실행한다. 이 문서를 직접 고쳐도 되지만 재생성하면 덮어써진다.

## 사용법

1. 스텝의 **스레드** 지시를 따른다. `🆕 새 스레드`면 새 대화를 열고, `↪ 이어서`면 그 스레드를 만든 **같은 대화**에 계속 요청한다.
2. **레퍼런스 첨부**의 필수 파일을 올린 뒤 **프롬프트 전체**를 붙여넣는다. "(선택)"은 톤을 맞추고 싶을 때만 올린다. `src/web/assets/group-photo/*.webp`가 업로드되지 않으면 PNG로 변환해서 올린다.
3. 결과를 확인(**검수 체크**)하고, 마음에 안 들면 같은 스레드에서 `Keep everything, but fix: …`로 수정 요청한다.
4. 통과하면 **저장 이름**으로 저장한다(`tmp/world-src/<카테고리>/<이름>.png`, 폴더는 없으면 만든다). 다음 스텝의 레퍼런스가 이 파일이다.
5. 각 스텝 끝의 `- [ ]`를 체크한다. 변환은 구현 세션 S1에서 만드는 `pnpm convert:world-art` 사용(각 스텝의 "변환" 줄).
6. 캔버스 크기는 프롬프트 문장에 적혀 있다(gpt-image 지원: 1024×1024 / 1536×1024 / 1024×1536). 투명 배경이 안 나오면 `#FF00FF` 단색 배경 결과를 그대로 저장해도 된다(스크립트가 제거).
7. 스레드가 길어져(대략 12장 이상) 품질·속도가 떨어지면 새 스레드를 열고 **직전에 승인한 결과 1장**을 톤 샘플로 첨부한다(프롬프트에 대응 문장이 이미 들어 있다).

## 스레드 목록 (한 스레드에서 이어서 만들 것)

| 스레드 | 설명 | 스텝 |
| --- | --- | --- |
| `T-FAB` | 플로팅 버튼 3장 | #001, #002, #003 |
| `T-CH-janine95kim` | (캐릭터 1명 = 스레드 1개, ①→④ 이어서) | #004, #005, #006, #007 |
| `T-TERRAIN` | 지면 텍스처 시트 8장 | #008, #060, #061, #129, #130, #131, #132, #133 |
| `T-BLD-1` | 건물(집 8채) | #009, #068, #069, #070, #071, #072, #073, #074 |
| `T-INT-1` | 실내(집 8곳) | #010, #082, #083, #084, #085, #086, #087, #088 |
| `T-UI-FRAMES` | UI 프레임/버튼/아이콘 시트(프레임 디자인 통일) | #011, #101, #102, #103, #104, #105, #144 |
| `T-CH-bboringirl` | (캐릭터 1명 = 스레드 1개, ①→④ 이어서) | #012, #013, #014, #015 |
| `T-CH-sjh4018` | (캐릭터 1명 = 스레드 1개, ①→④ 이어서) | #016, #017, #018, #019 |
| `T-CH-doormomo` | (캐릭터 1명 = 스레드 1개, ①→④ 이어서) | #020, #021, #022, #023 |
| `T-CH-hachi97` | (캐릭터 1명 = 스레드 1개, ①→④ 이어서) | #024, #025, #026, #027 |
| `T-CH-kaksjak0730` | (캐릭터 1명 = 스레드 1개, ①→④ 이어서) | #028, #029, #030, #031 |
| `T-CH-ju010228` | (캐릭터 1명 = 스레드 1개, ①→④ 이어서) | #032, #033, #034, #035 |
| `T-CH-haepalin` | (캐릭터 1명 = 스레드 1개, ①→④ 이어서) | #036, #037, #038, #039 |
| `T-CH-tleod1818` | (캐릭터 1명 = 스레드 1개, ①→④ 이어서) | #040, #041, #042, #043 |
| `T-CH-tdnlamuron` | (캐릭터 1명 = 스레드 1개, ①→④ 이어서) | #044, #045, #046, #047 |
| `T-CH-lina0108` | (캐릭터 1명 = 스레드 1개, ①→④ 이어서) | #048, #049, #050, #051 |
| `T-CH-woowakgood` | (캐릭터 1명 = 스레드 1개, ①→④ 이어서) | #052, #053, #054, #055 |
| `T-CH-elder` | (캐릭터 1명 = 스레드 1개, ①→④ 이어서) | #056, #057, #058, #059 |
| `T-PROPS-1` | 소품 시트 P0 6장 | #062, #063, #064, #065, #066, #067 |
| `T-BLD-2` | 건물(나머지) | #075, #076, #077, #078 … #139, #140 (9장) |
| `T-INT-2` | 실내(나머지) | #089, #090, #091, #092 … #142, #143 (11장) |
| `T-UI-ART` | 키아트(로딩·타이틀·로고·선택 배경) | #097, #098, #099, #100 |
| `T-FX` | FX 시트 3장 | #106, #145, #146 |
| `T-CH-shopkeeper` | (캐릭터 1명 = 스레드 1개, ①→④ 이어서) | #107, #108, #109, #110 |
| `T-CH-kid` | (캐릭터 1명 = 스레드 1개, ①→④ 이어서) | #111, #112, #113, #114 |
| `T-CH-referee` | (캐릭터 1명 = 스레드 1개, ①→④ 이어서) | #115, #116, #117, #118 |
| `T-CH-weedking` | (캐릭터 1명 = 스레드 1개, ①→④ 이어서) | #119, #120, #121, #122 |
| `T-CH-weeder-grunt` | (캐릭터 1명 = 스레드 1개, ①→④ 이어서) | #123, #124, #125, #126 |
| `T-ANIMALS` | 동물 2종 | #127, #128 |
| `T-PROPS-2` | 소품 시트 P1 5장 | #134, #135, #136, #137, #138 |
| `T-RUSH` | 잔디 러시 배경·시트 | #147, #148, #149, #150, #151 |

## 진행 표

| # | 저장 이름 | 스레드 | 우선순위 | ✓ |
| --- | --- | --- | --- | --- |
| #001 | `ui-fab-normal.png` | `T-FAB` 🆕 | P0 | [ ] |
| #002 | `ui-fab-hover.png` | `T-FAB` | P0 | [ ] |
| #003 | `ui-fab-icon.png` | `T-FAB` | P0 | [ ] |
| #004 | `char-janine95kim-stand.png` | `T-CH-janine95kim` 🆕 | P0 | [ ] |
| #005 | `char-janine95kim-turn.png` | `T-CH-janine95kim` | P0 | [ ] |
| #006 | `char-janine95kim-walk.png` | `T-CH-janine95kim` | P0 | [ ] |
| #007 | `char-janine95kim-portrait.png` | `T-CH-janine95kim` | P0 | [ ] |
| #008 | `terrain-core.png` | `T-TERRAIN` 🆕 | P0 | [ ] |
| #009 | `bld-house-janine95kim.png` | `T-BLD-1` 🆕 | P0 | [ ] |
| #010 | `int-house-janine95kim.png` | `T-INT-1` 🆕 | P0 | [ ] |
| #011 | `ui-frames-dialog.png` | `T-UI-FRAMES` 🆕 | P0 | [ ] |
| #012 | `char-bboringirl-stand.png` | `T-CH-bboringirl` 🆕 | P0 | [ ] |
| #013 | `char-bboringirl-turn.png` | `T-CH-bboringirl` | P0 | [ ] |
| #014 | `char-bboringirl-walk.png` | `T-CH-bboringirl` | P0 | [ ] |
| #015 | `char-bboringirl-portrait.png` | `T-CH-bboringirl` | P0 | [ ] |
| #016 | `char-sjh4018-stand.png` | `T-CH-sjh4018` 🆕 | P0 | [ ] |
| #017 | `char-sjh4018-turn.png` | `T-CH-sjh4018` | P0 | [ ] |
| #018 | `char-sjh4018-walk.png` | `T-CH-sjh4018` | P0 | [ ] |
| #019 | `char-sjh4018-portrait.png` | `T-CH-sjh4018` | P0 | [ ] |
| #020 | `char-doormomo-stand.png` | `T-CH-doormomo` 🆕 | P0 | [ ] |
| #021 | `char-doormomo-turn.png` | `T-CH-doormomo` | P0 | [ ] |
| #022 | `char-doormomo-walk.png` | `T-CH-doormomo` | P0 | [ ] |
| #023 | `char-doormomo-portrait.png` | `T-CH-doormomo` | P0 | [ ] |
| #024 | `char-hachi97-stand.png` | `T-CH-hachi97` 🆕 | P0 | [ ] |
| #025 | `char-hachi97-turn.png` | `T-CH-hachi97` | P0 | [ ] |
| #026 | `char-hachi97-walk.png` | `T-CH-hachi97` | P0 | [ ] |
| #027 | `char-hachi97-portrait.png` | `T-CH-hachi97` | P0 | [ ] |
| #028 | `char-kaksjak0730-stand.png` | `T-CH-kaksjak0730` 🆕 | P0 | [ ] |
| #029 | `char-kaksjak0730-turn.png` | `T-CH-kaksjak0730` | P0 | [ ] |
| #030 | `char-kaksjak0730-walk.png` | `T-CH-kaksjak0730` | P0 | [ ] |
| #031 | `char-kaksjak0730-portrait.png` | `T-CH-kaksjak0730` | P0 | [ ] |
| #032 | `char-ju010228-stand.png` | `T-CH-ju010228` 🆕 | P0 | [ ] |
| #033 | `char-ju010228-turn.png` | `T-CH-ju010228` | P0 | [ ] |
| #034 | `char-ju010228-walk.png` | `T-CH-ju010228` | P0 | [ ] |
| #035 | `char-ju010228-portrait.png` | `T-CH-ju010228` | P0 | [ ] |
| #036 | `char-haepalin-stand.png` | `T-CH-haepalin` 🆕 | P0 | [ ] |
| #037 | `char-haepalin-turn.png` | `T-CH-haepalin` | P0 | [ ] |
| #038 | `char-haepalin-walk.png` | `T-CH-haepalin` | P0 | [ ] |
| #039 | `char-haepalin-portrait.png` | `T-CH-haepalin` | P0 | [ ] |
| #040 | `char-tleod1818-stand.png` | `T-CH-tleod1818` 🆕 | P0 | [ ] |
| #041 | `char-tleod1818-turn.png` | `T-CH-tleod1818` | P0 | [ ] |
| #042 | `char-tleod1818-walk.png` | `T-CH-tleod1818` | P0 | [ ] |
| #043 | `char-tleod1818-portrait.png` | `T-CH-tleod1818` | P0 | [ ] |
| #044 | `char-tdnlamuron-stand.png` | `T-CH-tdnlamuron` 🆕 | P0 | [ ] |
| #045 | `char-tdnlamuron-turn.png` | `T-CH-tdnlamuron` | P0 | [ ] |
| #046 | `char-tdnlamuron-walk.png` | `T-CH-tdnlamuron` | P0 | [ ] |
| #047 | `char-tdnlamuron-portrait.png` | `T-CH-tdnlamuron` | P0 | [ ] |
| #048 | `char-lina0108-stand.png` | `T-CH-lina0108` 🆕 | P0 | [ ] |
| #049 | `char-lina0108-turn.png` | `T-CH-lina0108` | P0 | [ ] |
| #050 | `char-lina0108-walk.png` | `T-CH-lina0108` | P0 | [ ] |
| #051 | `char-lina0108-portrait.png` | `T-CH-lina0108` | P0 | [ ] |
| #052 | `char-woowakgood-stand.png` | `T-CH-woowakgood` 🆕 | P0 | [ ] |
| #053 | `char-woowakgood-turn.png` | `T-CH-woowakgood` | P0 | [ ] |
| #054 | `char-woowakgood-walk.png` | `T-CH-woowakgood` | P0 | [ ] |
| #055 | `char-woowakgood-portrait.png` | `T-CH-woowakgood` | P0 | [ ] |
| #056 | `char-elder-stand.png` | `T-CH-elder` 🆕 | P0 | [ ] |
| #057 | `char-elder-turn.png` | `T-CH-elder` | P0 | [ ] |
| #058 | `char-elder-walk.png` | `T-CH-elder` | P0 | [ ] |
| #059 | `char-elder-portrait.png` | `T-CH-elder` | P0 | [ ] |
| #060 | `terrain-pitch.png` | `T-TERRAIN` | P0 | [ ] |
| #061 | `terrain-water.png` | `T-TERRAIN` | P0 | [ ] |
| #062 | `props-trees.png` | `T-PROPS-1` 🆕 | P0 | [ ] |
| #063 | `props-plants.png` | `T-PROPS-1` | P0 | [ ] |
| #064 | `props-rocks.png` | `T-PROPS-1` | P0 | [ ] |
| #065 | `props-town.png` | `T-PROPS-1` | P0 | [ ] |
| #066 | `props-football.png` | `T-PROPS-1` | P0 | [ ] |
| #067 | `props-collect.png` | `T-PROPS-1` | P0 | [ ] |
| #068 | `bld-house-bboringirl.png` | `T-BLD-1` | P0 | [ ] |
| #069 | `bld-house-sjh4018.png` | `T-BLD-1` | P0 | [ ] |
| #070 | `bld-house-doormomo.png` | `T-BLD-1` | P0 | [ ] |
| #071 | `bld-house-hachi97.png` | `T-BLD-1` | P0 | [ ] |
| #072 | `bld-house-kaksjak0730.png` | `T-BLD-1` | P0 | [ ] |
| #073 | `bld-house-ju010228.png` | `T-BLD-1` | P0 | [ ] |
| #074 | `bld-house-haepalin.png` | `T-BLD-1` | P0 | [ ] |
| #075 | `bld-house-tleod1818.png` | `T-BLD-2` 🆕 | P0 | [ ] |
| #076 | `bld-house-tdnlamuron.png` | `T-BLD-2` | P0 | [ ] |
| #077 | `bld-house-lina0108.png` | `T-BLD-2` | P0 | [ ] |
| #078 | `bld-clubhouse.png` | `T-BLD-2` | P0 | [ ] |
| #079 | `bld-stadium.png` | `T-BLD-2` | P0 | [ ] |
| #080 | `bld-fountain.png` | `T-BLD-2` | P0 | [ ] |
| #081 | `bld-store.png` | `T-BLD-2` | P0 | [ ] |
| #082 | `int-house-bboringirl.png` | `T-INT-1` | P0 | [ ] |
| #083 | `int-house-sjh4018.png` | `T-INT-1` | P0 | [ ] |
| #084 | `int-house-doormomo.png` | `T-INT-1` | P0 | [ ] |
| #085 | `int-house-hachi97.png` | `T-INT-1` | P0 | [ ] |
| #086 | `int-house-kaksjak0730.png` | `T-INT-1` | P0 | [ ] |
| #087 | `int-house-ju010228.png` | `T-INT-1` | P0 | [ ] |
| #088 | `int-house-haepalin.png` | `T-INT-1` | P0 | [ ] |
| #089 | `int-house-tleod1818.png` | `T-INT-2` 🆕 | P0 | [ ] |
| #090 | `int-house-tdnlamuron.png` | `T-INT-2` | P0 | [ ] |
| #091 | `int-house-lina0108.png` | `T-INT-2` | P0 | [ ] |
| #092 | `int-clubhouse-lobby.png` | `T-INT-2` | P0 | [ ] |
| #093 | `int-clubhouse-office.png` | `T-INT-2` | P0 | [ ] |
| #094 | `int-arcade.png` | `T-INT-2` | P0 | [ ] |
| #095 | `int-stadium.png` | `T-INT-2` | P0 | [ ] |
| #096 | `int-store.png` | `T-INT-2` | P0 | [ ] |
| #097 | `ui-loading-bg.png` | `T-UI-ART` 🆕 | P0 | [ ] |
| #098 | `ui-title-bg.png` | `T-UI-ART` | P0 | [ ] |
| #099 | `ui-logo-emblem.png` | `T-UI-ART` | P0 | [ ] |
| #100 | `ui-select-bg.png` | `T-UI-ART` | P0 | [ ] |
| #101 | `ui-frames-panel.png` | `T-UI-FRAMES` | P0 | [ ] |
| #102 | `ui-buttons.png` | `T-UI-FRAMES` | P0 | [ ] |
| #103 | `ui-select-cards.png` | `T-UI-FRAMES` | P0 | [ ] |
| #104 | `ui-icons-mission.png` | `T-UI-FRAMES` | P0 | [ ] |
| #105 | `ui-icons-menu.png` | `T-UI-FRAMES` | P0 | [ ] |
| #106 | `fx-markers.png` | `T-FX` 🆕 | P0 | [ ] |
| #107 | `char-shopkeeper-stand.png` | `T-CH-shopkeeper` 🆕 | P1 | [ ] |
| #108 | `char-shopkeeper-turn.png` | `T-CH-shopkeeper` | P1 | [ ] |
| #109 | `char-shopkeeper-walk.png` | `T-CH-shopkeeper` | P1 | [ ] |
| #110 | `char-shopkeeper-portrait.png` | `T-CH-shopkeeper` | P1 | [ ] |
| #111 | `char-kid-stand.png` | `T-CH-kid` 🆕 | P1 | [ ] |
| #112 | `char-kid-turn.png` | `T-CH-kid` | P1 | [ ] |
| #113 | `char-kid-walk.png` | `T-CH-kid` | P1 | [ ] |
| #114 | `char-kid-portrait.png` | `T-CH-kid` | P1 | [ ] |
| #115 | `char-referee-stand.png` | `T-CH-referee` 🆕 | P1 | [ ] |
| #116 | `char-referee-turn.png` | `T-CH-referee` | P1 | [ ] |
| #117 | `char-referee-walk.png` | `T-CH-referee` | P1 | [ ] |
| #118 | `char-referee-portrait.png` | `T-CH-referee` | P1 | [ ] |
| #119 | `char-weedking-stand.png` | `T-CH-weedking` 🆕 | P1 | [ ] |
| #120 | `char-weedking-turn.png` | `T-CH-weedking` | P1 | [ ] |
| #121 | `char-weedking-walk.png` | `T-CH-weedking` | P1 | [ ] |
| #122 | `char-weedking-portrait.png` | `T-CH-weedking` | P1 | [ ] |
| #123 | `char-weeder-grunt-stand.png` | `T-CH-weeder-grunt` 🆕 | P1 | [ ] |
| #124 | `char-weeder-grunt-turn.png` | `T-CH-weeder-grunt` | P1 | [ ] |
| #125 | `char-weeder-grunt-walk.png` | `T-CH-weeder-grunt` | P1 | [ ] |
| #126 | `char-weeder-grunt-portrait.png` | `T-CH-weeder-grunt` | P1 | [ ] |
| #127 | `char-cat-jandi-walk.png` | `T-ANIMALS` 🆕 | P1 | [ ] |
| #128 | `char-dog-ball-walk.png` | `T-ANIMALS` | P1 | [ ] |
| #129 | `terrain-spring.png` | `T-TERRAIN` | P1 | [ ] |
| #130 | `terrain-frost.png` | `T-TERRAIN` | P1 | [ ] |
| #131 | `terrain-industrial.png` | `T-TERRAIN` | P1 | [ ] |
| #132 | `terrain-cloud.png` | `T-TERRAIN` | P1 | [ ] |
| #133 | `terrain-weed.png` | `T-TERRAIN` | P1 | [ ] |
| #134 | `props-spring.png` | `T-PROPS-2` 🆕 | P1 | [ ] |
| #135 | `props-frost.png` | `T-PROPS-2` | P1 | [ ] |
| #136 | `props-forge.png` | `T-PROPS-2` | P1 | [ ] |
| #137 | `props-cloud.png` | `T-PROPS-2` | P1 | [ ] |
| #138 | `props-weed.png` | `T-PROPS-2` | P1 | [ ] |
| #139 | `bld-cafe.png` | `T-BLD-2` | P1 | [ ] |
| #140 | `bld-factory.png` | `T-BLD-2` | P1 | [ ] |
| #141 | `int-cafe.png` | `T-INT-2` | P1 | [ ] |
| #142 | `int-clubhouse-trophy.png` | `T-INT-2` | P1 | [ ] |
| #143 | `int-factory.png` | `T-INT-2` | P1 | [ ] |
| #144 | `ui-badges.png` | `T-UI-FRAMES` | P1 | [ ] |
| #145 | `fx-emotes.png` | `T-FX` | P1 | [ ] |
| #146 | `fx-world.png` | `T-FX` | P1 | [ ] |
| #147 | `rush-bg-far.png` | `T-RUSH` 🆕 | P1 | [ ] |
| #148 | `rush-bg-mid.png` | `T-RUSH` | P1 | [ ] |
| #149 | `rush-ground.png` | `T-RUSH` | P1 | [ ] |
| #150 | `rush-obstacles.png` | `T-RUSH` | P1 | [ ] |
| #151 | `rush-bg-factory.png` | `T-RUSH` | P2 | [ ] |

총 **151장** (P0 106 / P1 44 / P2 1).

---

# Phase 1 — 플로팅 버튼 + 스타일 테스트 (P0)

재닌 캐릭터 세트, `terrain-core`, 재닌 집 외관/실내, UI 프레임 시트 A를 먼저 만들어 **톤을 확정**한다. 마음에 들지 않으면 해당 프롬프트의 스타일 문구(맨 앞 두 문단)를 고쳐 다시 생성하고, 확정된 문구로 이후 단계를 진행한다.

## #001 · 플로팅 버튼 — 기본

- **저장 이름**: `tmp/world-src/ui/ui-fab-normal.png` (1536×1024, P0)
- **스레드**: 🆕 **새 스레드 시작** — `T-FAB`
- **레퍼런스 첨부**: 없음
- **검수 체크**: 판 중앙-오른쪽이 완전히 비어 있음(글자는 CSS), 배경 투명/마젠타, 그림자 없음
- **변환**: `pnpm convert:world-art -- ui fab-normal`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.

Draw a horizontal pixel-art floating-button plate for a website, aspect ratio about 3.7:1, centred on the canvas on a transparent background (or flat #FF00FF), for a football club's pixel RPG world.
Design: the left end has a round medallion showing a tiny bright pixel village with a football stadium and a sprouting green seedling; the plate body is warm wooden planks with a mint-green (#2ee8b6) trim, tiny grass tufts growing on the top edge, and a small golden rivet at each corner. The middle-right area of the plate must be a calm, flat, darker green panel that is EMPTY (no text, no letters, no symbols) because text is added later by code. Crisp pixel outline, three-step shading, cheerful and inviting.
No cast shadow, no text anywhere, no watermark.
```

- [x] #001 생성·저장 완료

## #002 · 플로팅 버튼 — 호버

- **저장 이름**: `tmp/world-src/ui/ui-fab-hover.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-FAB` (이 스레드의 첫 스텝 #001을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 직전 결과 ui-fab-normal: `tmp/world-src/ui/ui-fab-normal.png`
- **검수 체크**: 기본 버전과 구도·크기 동일(겹쳤을 때 위치 일치), 글자 영역 비어 있음
- **변환**: `pnpm convert:world-art -- ui fab-hover`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.

Keep exactly the same layout, size and design as the attached image (a horizontal pixel-art floating-button plate for a football club's pixel RPG world), but make it brighter with a soft mint glow around the plate, tiny gold sparkles near the medallion, and the plate looking lifted slightly. Keep the text area empty. Transparent background (or flat #FF00FF), no cast shadow, no text anywhere, no watermark. Canvas 1536x1024.
```

- [x] #002 생성·저장 완료

## #003 · 플로팅 버튼 — 원형 아이콘 단독

- **저장 이름**: `tmp/world-src/ui/ui-fab-icon.png` (1024×1024, P0)
- **스레드**: ↪ **이어서** — `T-FAB` (이 스레드의 첫 스텝 #001을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 직전 결과 ui-fab-normal: `tmp/world-src/ui/ui-fab-normal.png`
- **검수 체크**: 메달리온이 중앙, 글자 없음
- **변환**: `pnpm convert:world-art -- ui fab-icon`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.

Draw only the round medallion from the attached button plate as a standalone icon: a tiny bright pixel village with a football stadium and a sprouting green seedling inside a round frame. Same style, colours and outline as the attached image. Canvas 1024x1024, centred, transparent background (or flat #FF00FF), no cast shadow, no text.
```

- [x] #003 생성·저장 완료

## #004 · 재닌 — ① stand (정면 서기 마스터)

- **저장 이름**: `tmp/world-src/characters/char-janine95kim-stand.png` (1024×1024, P0)
- **스레드**: 🆕 **새 스레드 시작** — `T-CH-janine95kim`
- **레퍼런스 첨부**:
  - **필수** 캐릭터 원본 일러스트(전신 컷아웃): `src/web/assets/group-photo/janine95kim.webp`
- **검수 체크**: 배경 투명/마젠타 단색, 글자 없음, 레퍼런스의 헤어 색·소품 유지, 전신이 잘리지 않음
- **변환**: `pnpm convert:world-art -- characters janine95kim`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
The football club 잔디동 wears a white kit with mint-green (#2ee8b6) trim and a small text-free mint shield-with-sprout crest.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.
Attached (first image) is the original character illustration of "재닌". Redraw this exact character as a chibi pixel-art game sprite.
Keep: the same hairstyle and hair colours, long wavy vivid blue hair, round glasses, white cap-style headband with a tiny ornament and a small black headset microphone, black choker, the same face vibe, and the outfit colours.
Outfit: GK kit: black long-sleeve goalkeeper jersey with mint side panels and a small text-free mint shield crest, white goalkeeper gloves, black shorts with a mint stripe, black knee-high socks, black boots with mint studs
Pose: standing idle, front view (facing the camera, slightly looking down at the viewer as in a top-down RPG), arms on her hips, confident, feet together on one baseline, full body visible with a little empty margin on all sides.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
The glasses' reflections are just two white pixels.
```

- [x] #004 생성·저장 완료

## #005 · 재닌 — ② turn (3방향 서기)

- **저장 이름**: `tmp/world-src/characters/char-janine95kim-turn.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-janine95kim` (이 스레드의 첫 스텝 #004을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-janine95kim-stand.png`
- **검수 체크**: 정면·우측·후면 3컷 크기·발끝 기준선 동일, 후면 뒷모습(머리 길이·장식) 자연스러움
- **변환**: `pnpm convert:world-art -- characters janine95kim`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw the SAME character as a turnaround sheet with three standing poses side by side on one 1536x1024 canvas, evenly spaced with clear gaps:
1) front view (facing the camera), 2) right-side view (facing right, profile), 3) back view (facing away).
Rules: identical character design, palette, proportions and pixel size in all three; same scale; all feet on the exact same baseline; standing idle with arms relaxed; no motion; no shadows; keep at least 10% empty margin around each pose; do not add any text or guide lines.
The glasses' reflections are just two white pixels.
```

- [x] #005 생성·저장 완료

## #006 · 재닌 — ③ walk (걷기 4프레임×3방향)

- **저장 이름**: `tmp/world-src/characters/char-janine95kim-walk.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-janine95kim` (이 스레드의 첫 스텝 #004을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ② 결과: `tmp/world-src/characters/char-janine95kim-turn.png`
- **검수 체크**: 4×3 그리드 12칸 모두 같은 크기·같은 캐릭터, 발끝 행 동일, 칸 경계선 없음, 인접 칸으로 삐져나온 부분 없음
- **변환**: `pnpm convert:world-art -- characters janine95kim`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached turnaround sheet as the exact reference, draw the SAME character's walk cycle as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows, each cell the same size, one pose per cell, centred, feet on the same baseline row in every cell.
Row 1 (top): walking toward the camera (front view), 4 frames.
Row 2 (middle): walking to the right (side view), 4 frames.
Row 3 (bottom): walking away from the camera (back view), 4 frames.
Frame order in every row: (1) left foot forward contact, (2) passing pose with the body slightly higher, (3) right foot forward contact, (4) passing pose with the body slightly higher. Arms swing opposite to the legs. Hair, ribbons and accessories move by at most one or two pixels.
Rules: identical design, palette, proportions and pixel size in all 12 cells; no motion blur; no shadows; no cell borders or grid lines; leave at least 10% empty margin inside every cell; no text.
The glasses' reflections are just two white pixels.
```

- [x] #006 생성·저장 완료

## #007 · 재닌 — ④ portrait (표정 4종 2×2)

- **저장 이름**: `tmp/world-src/characters/char-janine95kim-portrait.png` (1024×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-janine95kim` (이 스레드의 첫 스텝 #004을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-janine95kim-stand.png`
- **검수 체크**: 4칸 표정 구분 명확(기본/기쁨/놀람/걱정), 헤어·소품 동일, 프레이밍 동일
- **변환**: `pnpm convert:world-art -- characters janine95kim`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw a dialogue portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, same pixel style as the sprite but more detailed.
Top-left: neutral, calm expression. Top-right: happy, smiling with sparkling eyes. Bottom-left: surprised, wide eyes and open mouth. Bottom-right: worried, slightly sweating, eyebrows down.
Rules: identical hairstyle, accessories and outfit colours in all four; same framing and scale; no cell borders or grid lines; no text.
The glasses' reflections are just two white pixels.
```

- [x] #007 생성·저장 완료

## #008 · 지면 시트 — core

- **저장 이름**: `tmp/world-src/terrain/terrain-core.png` (1024×1024 (4×4), P0)
- **스레드**: 🆕 **새 스레드 시작** — `T-TERRAIN`
- **레퍼런스 첨부**: 없음
- **검수 체크**: 16칸 모두 꽉 채워짐, 타일 사이 경계선 없음, 가장자리가 이어져 보임, 글자/그림자 없음
- **변환**: `pnpm convert:world-art -- terrain core`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.

Create a seamless tileset texture sheet for a top-down pixel-art RPG on one 1024x1024 canvas: a strict 4x4 grid of 16 square tiles (each 256x256, no gaps, no borders, no grid lines, tiles fill the whole canvas, no transparency). EVERY tile must tile seamlessly with itself on all four edges (left edge matches right edge, top matches bottom). Straight top-down texture, no perspective, no objects casting shadows, no text. Each visible pixel block is about 8 px so the art reads as a 32x32-pixel tile. Keep large shapes bold so the texture stays readable when scaled down.
Theme: warm sunny meadow park: lush grass with subtle mowing variation, tidy dirt paths, cobblestone paths and a paved plaza
Tiles in order (left to right, top to bottom):
1) lush grass A, 2) lush grass B (slightly darker), 3) lush grass C (with small clover), 4) lush grass D (lighter), 5) grass with tiny white and yellow flowers A, 6) grass with tiny flowers B, 7) grass with a few taller tufts, 8) darker shaded grass, 9) packed dirt path A, 10) packed dirt path B with pebbles, 11) grey cobblestone path A, 12) cobblestone path B, 13) light paved plaza stones A, 14) paved plaza stones B, 15) plaza checker tiles cream and pale mint, 16) plaza tile with a faint football emblem in the centre
```

- [x] #008 생성·저장 완료

## #009 · 건물 — house-janine95kim (최종 256×224px)

- **저장 이름**: `tmp/world-src/buildings/bld-house-janine95kim.png` (1536×1024, P0)
- **스레드**: 🆕 **새 스레드 시작** — `T-BLD-1`
- **레퍼런스 첨부**:
  - (선택) 카드 테마 색·모티프 참고: `src/web/assets/toty-cards/janine95kim-background.webp`
- **검수 체크**: 문이 하단 중앙, 배경 투명/마젠타 단색, 지면·그림자 없음, 글자 없음
- **변환**: `pnpm convert:world-art -- buildings house-janine95kim`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
The attached card artwork (if provided) is only a colour and motif reference for the theme; do not copy its characters or layout.

Draw a single building for a top-down 3/4-view pixel-art RPG (classic Pokemon/Zelda camera: you see the front facade and the roof from above at about 45 degrees). a frosty house beside an ice rink: sky-blue and white walls, a snow-dusted roof with icicles, a goalkeeper-glove-shaped blank sign, a pair of ice skates hanging by the door, frosted windows
Rules: the door is at the bottom centre of the front facade with a small step; transparent background (or flat #FF00FF); NO ground, NO cast shadow, NO grass around the base; the building fills about 90% of the canvas width and sits on the bottom edge; light from the top-left; no text or letters anywhere (signs and boards are blank shapes, emblems are text-free); crisp pixel outline, three-step shading.
Canvas: 1536×1024.
```

- [x] #009 생성·저장 완료

## #010 · 실내 — house-janine95kim (최종 640×384)

- **저장 이름**: `tmp/world-src/interiors/int-house-janine95kim.png` (1536×1024, P0)
- **스레드**: 🆕 **새 스레드 시작** — `T-INT-1`
- **레퍼런스 첨부**:
  - (선택) 같은 집 외관(방금 만든 결과): `tmp/world-src/buildings/bld-house-janine95kim.png`
- **검수 체크**: 문(하단 중앙)·열린 바닥 공간 확보, 캐릭터 없음, 글자 없음, 가구 배치가 03 문서 조사 포인트와 대체로 일치
- **변환**: `pnpm convert:world-art -- interiors house-janine95kim`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
The attached image (if provided) is the exterior or a sibling room of this place: match its colours, materials and mood.

Draw a single-screen interior of an icy sky-blue and white home of a goalkeeper for a top-down 3/4-view pixel-art RPG (classic Pokemon/Stardew interior: cutaway room with the back wall and side walls visible, the floor seen from about 45 degrees). Landscape 1536x1024; the room fills the frame edge to edge with a thin dark wall border. Keep a clear open floor area in the lower-middle for walking and a door opening with a small doormat at the bottom centre. A window on the left wall shows a frozen rink; a glass cabinet with goalkeeper gloves at the back left; a frosted potted plant at the back right; a small table with a cloth at the middle left; a bed and a soft rug on the far right; ice-blue lighting
Rules: no characters, no people; no readable text or letters anywhere (papers, boards and screens show abstract shapes); light from the top-left; crisp pixel outline, three-step shading; warm and cosy. Furniture is placed as described (left/right are from the viewer's view).
```

- [x] #010 생성·저장 완료

## #011 · UI 프레임 시트 A — 대사·선택·토스트 (12칸)

- **저장 이름**: `tmp/world-src/ui/ui-frames-dialog.png` (1536×1024 (4×3), P0)
- **스레드**: 🆕 **새 스레드 시작** — `T-UI-FRAMES`
- **레퍼런스 첨부**: 없음
- **검수 체크**: 프레임이 좌우·상하 완전 대칭, 모서리 장식 동일, 가장자리 단순 반복, 글자 없음
- **변환**: `pnpm convert:world-art -- ui frames-dialog`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.

Create a UI frame kit for a pixel-art RPG on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows (12 cells, each 384x341), exactly one UI element per cell, centred, transparent background (or flat #FF00FF), no cell borders or grid lines, at least 8% empty margin inside each cell, no text or letters anywhere (labels and text areas are blank), crisp pixel outline, three-step shading. Design language: dark teal panels (#0b1614) with mint (#00e9ae) pixel trim and small leaf-shaped corner ornaments, warm gold accents (#ffd54a), matching a football club identity (mint and white, sprout shield). Every frame must be perfectly symmetrical left-right and top-bottom, with identical corner ornaments and plain repeating straight edges so it can be stretched as a 9-slice frame, and a flat calm centre area.
Elements in order (left to right, top to bottom):
1) large dialogue box frame (wide rectangle), 2) name plate frame (small wide tag), 3) square portrait frame with a slightly thicker ornate border, 4) choice item frame normal (wide short bar), 5) choice item frame selected (same bar, glowing mint border and gold edge), 6) menu cursor: a small pixel football pointing right, 7) dialogue-next indicator frame 1: a small mint downward triangle, 8) dialogue-next indicator frame 2: the same triangle slightly lower with a soft glow, 9) toast banner frame (wide short with ribbon ends), 10) coach-mark tutorial bubble frame (rounded rectangle, no tail), 11) tooltip frame (small rounded rectangle), 12) loading-bar frame (a long thin empty groove with a mint trim, the inside completely empty and dark)
```

- [x] #011 생성·저장 완료

---

# Phase 2 — P0 캐릭터 12명

멤버 10명 + 우왁굳 + 잔디 할아버지. 캐릭터 1명당 스레드 1개.

## #012 · 뽀린걸 — ① stand (정면 서기 마스터)

- **저장 이름**: `tmp/world-src/characters/char-bboringirl-stand.png` (1024×1024, P0)
- **스레드**: 🆕 **새 스레드 시작** — `T-CH-bboringirl`
- **레퍼런스 첨부**:
  - **필수** 캐릭터 원본 일러스트(전신 컷아웃): `src/web/assets/group-photo/bboringirl.webp`
  - (선택) 톤 통일용 승인된 결과 1장: `tmp/world-src/characters/char-janine95kim-stand.png`
- **검수 체크**: 배경 투명/마젠타 단색, 글자 없음, 레퍼런스의 헤어 색·소품 유지, 전신이 잘리지 않음
- **변환**: `pnpm convert:world-art -- characters bboringirl`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
The football club 잔디동 wears a white kit with mint-green (#2ee8b6) trim and a small text-free mint shield-with-sprout crest.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.
Attached (first image) is the original character illustration of "뽀린걸". Redraw this exact character as a chibi pixel-art game sprite.
Keep: the same hairstyle and hair colours, silver-grey hair with red-pink streaks in the side locks, a low side ponytail draped over the shoulder, amber eyes, one small ahoge strand, warm smile, the same face vibe, and the outfit colours.
Outfit: the 잔디동 club kit: white short-sleeve jersey with mint-green side panels, sleeve trim and a small text-free mint shield crest with a sprout on the chest, white shorts with mint side stripe, white knee-high socks with a mint band, white football boots with mint studs.
Pose: standing idle, front view (facing the camera, slightly looking down at the viewer as in a top-down RPG), arms relaxed at sides, feet together on one baseline, full body visible with a little empty margin on all sides.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
Make the red-pink streaks in the hair clearly visible.
```

- [x] #012 생성·저장 완료

## #013 · 뽀린걸 — ② turn (3방향 서기)

- **저장 이름**: `tmp/world-src/characters/char-bboringirl-turn.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-bboringirl` (이 스레드의 첫 스텝 #012을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-bboringirl-stand.png`
- **검수 체크**: 정면·우측·후면 3컷 크기·발끝 기준선 동일, 후면 뒷모습(머리 길이·장식) 자연스러움
- **변환**: `pnpm convert:world-art -- characters bboringirl`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw the SAME character as a turnaround sheet with three standing poses side by side on one 1536x1024 canvas, evenly spaced with clear gaps:
1) front view (facing the camera), 2) right-side view (facing right, profile), 3) back view (facing away).
Rules: identical character design, palette, proportions and pixel size in all three; same scale; all feet on the exact same baseline; standing idle with arms relaxed; no motion; no shadows; keep at least 10% empty margin around each pose; do not add any text or guide lines.
Make the red-pink streaks in the hair clearly visible.
```

- [x] #013 생성·저장 완료

## #014 · 뽀린걸 — ③ walk (걷기 4프레임×3방향)

- **저장 이름**: `tmp/world-src/characters/char-bboringirl-walk.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-bboringirl` (이 스레드의 첫 스텝 #012을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ② 결과: `tmp/world-src/characters/char-bboringirl-turn.png`
- **검수 체크**: 4×3 그리드 12칸 모두 같은 크기·같은 캐릭터, 발끝 행 동일, 칸 경계선 없음, 인접 칸으로 삐져나온 부분 없음
- **변환**: `pnpm convert:world-art -- characters bboringirl`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached turnaround sheet as the exact reference, draw the SAME character's walk cycle as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows, each cell the same size, one pose per cell, centred, feet on the same baseline row in every cell.
Row 1 (top): walking toward the camera (front view), 4 frames.
Row 2 (middle): walking to the right (side view), 4 frames.
Row 3 (bottom): walking away from the camera (back view), 4 frames.
Frame order in every row: (1) left foot forward contact, (2) passing pose with the body slightly higher, (3) right foot forward contact, (4) passing pose with the body slightly higher. Arms swing opposite to the legs. Hair, ribbons and accessories move by at most one or two pixels.
Rules: identical design, palette, proportions and pixel size in all 12 cells; no motion blur; no shadows; no cell borders or grid lines; leave at least 10% empty margin inside every cell; no text.
Make the red-pink streaks in the hair clearly visible.
```

- [ ] #014 생성·저장 완료

## #015 · 뽀린걸 — ④ portrait (표정 4종 2×2)

- **저장 이름**: `tmp/world-src/characters/char-bboringirl-portrait.png` (1024×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-bboringirl` (이 스레드의 첫 스텝 #012을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-bboringirl-stand.png`
- **검수 체크**: 4칸 표정 구분 명확(기본/기쁨/놀람/걱정), 헤어·소품 동일, 프레이밍 동일
- **변환**: `pnpm convert:world-art -- characters bboringirl`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw a dialogue portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, same pixel style as the sprite but more detailed.
Top-left: neutral, calm expression. Top-right: happy, smiling with sparkling eyes. Bottom-left: surprised, wide eyes and open mouth. Bottom-right: worried, slightly sweating, eyebrows down.
Rules: identical hairstyle, accessories and outfit colours in all four; same framing and scale; no cell borders or grid lines; no text.
Make the red-pink streaks in the hair clearly visible.
```

- [x] #015 생성·저장 완료

## #016 · 핑구 — ① stand (정면 서기 마스터)

- **저장 이름**: `tmp/world-src/characters/char-sjh4018-stand.png` (1024×1024, P0)
- **스레드**: 🆕 **새 스레드 시작** — `T-CH-sjh4018`
- **레퍼런스 첨부**:
  - **필수** 캐릭터 원본 일러스트(전신 컷아웃): `src/web/assets/group-photo/sjh4018.webp`
  - (선택) 톤 통일용 승인된 결과 1장: `tmp/world-src/characters/char-janine95kim-stand.png`
- **검수 체크**: 배경 투명/마젠타 단색, 글자 없음, 레퍼런스의 헤어 색·소품 유지, 전신이 잘리지 않음
- **변환**: `pnpm convert:world-art -- characters sjh4018`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
The football club 잔디동 wears a white kit with mint-green (#2ee8b6) trim and a small text-free mint shield-with-sprout crest.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.
Attached (first image) is the original character illustration of "핑구". Redraw this exact character as a chibi pixel-art game sprite.
Keep: the same hairstyle and hair colours, very long sky-blue hair with straight parted bangs, black hairband, small hair clip at the side, blue eyes, cheerful open smile, the same face vibe, and the outfit colours.
Outfit: the 잔디동 club kit: white short-sleeve jersey with mint-green side panels, sleeve trim and a small text-free mint shield crest with a sprout on the chest, white shorts with mint side stripe, white knee-high socks with a mint band, white football boots with mint studs.
Pose: standing idle, front view (facing the camera, slightly looking down at the viewer as in a top-down RPG), arms relaxed at sides, feet together on one baseline, full body visible with a little empty margin on all sides.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
The hair is very long (down to the ankles): keep it a compact silhouette so it animates with minimal swing.
```

- [x] #016 생성·저장 완료

## #017 · 핑구 — ② turn (3방향 서기)

- **저장 이름**: `tmp/world-src/characters/char-sjh4018-turn.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-sjh4018` (이 스레드의 첫 스텝 #016을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-sjh4018-stand.png`
- **검수 체크**: 정면·우측·후면 3컷 크기·발끝 기준선 동일, 후면 뒷모습(머리 길이·장식) 자연스러움
- **변환**: `pnpm convert:world-art -- characters sjh4018`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw the SAME character as a turnaround sheet with three standing poses side by side on one 1536x1024 canvas, evenly spaced with clear gaps:
1) front view (facing the camera), 2) right-side view (facing right, profile), 3) back view (facing away).
Rules: identical character design, palette, proportions and pixel size in all three; same scale; all feet on the exact same baseline; standing idle with arms relaxed; no motion; no shadows; keep at least 10% empty margin around each pose; do not add any text or guide lines.
The hair is very long (down to the ankles): keep it a compact silhouette so it animates with minimal swing.
```

- [x] #017 생성·저장 완료

## #018 · 핑구 — ③ walk (걷기 4프레임×3방향)

- **저장 이름**: `tmp/world-src/characters/char-sjh4018-walk.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-sjh4018` (이 스레드의 첫 스텝 #016을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ② 결과: `tmp/world-src/characters/char-sjh4018-turn.png`
- **검수 체크**: 4×3 그리드 12칸 모두 같은 크기·같은 캐릭터, 발끝 행 동일, 칸 경계선 없음, 인접 칸으로 삐져나온 부분 없음
- **변환**: `pnpm convert:world-art -- characters sjh4018`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached turnaround sheet as the exact reference, draw the SAME character's walk cycle as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows, each cell the same size, one pose per cell, centred, feet on the same baseline row in every cell.
Row 1 (top): walking toward the camera (front view), 4 frames.
Row 2 (middle): walking to the right (side view), 4 frames.
Row 3 (bottom): walking away from the camera (back view), 4 frames.
Frame order in every row: (1) left foot forward contact, (2) passing pose with the body slightly higher, (3) right foot forward contact, (4) passing pose with the body slightly higher. Arms swing opposite to the legs. Hair, ribbons and accessories move by at most one or two pixels.
Rules: identical design, palette, proportions and pixel size in all 12 cells; no motion blur; no shadows; no cell borders or grid lines; leave at least 10% empty margin inside every cell; no text.
The hair is very long (down to the ankles): keep it a compact silhouette so it animates with minimal swing.
```

- [x] #018 생성·저장 완료

## #019 · 핑구 — ④ portrait (표정 4종 2×2)

- **저장 이름**: `tmp/world-src/characters/char-sjh4018-portrait.png` (1024×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-sjh4018` (이 스레드의 첫 스텝 #016을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-sjh4018-stand.png`
- **검수 체크**: 4칸 표정 구분 명확(기본/기쁨/놀람/걱정), 헤어·소품 동일, 프레이밍 동일
- **변환**: `pnpm convert:world-art -- characters sjh4018`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw a dialogue portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, same pixel style as the sprite but more detailed.
Top-left: neutral, calm expression. Top-right: happy, smiling with sparkling eyes. Bottom-left: surprised, wide eyes and open mouth. Bottom-right: worried, slightly sweating, eyebrows down.
Rules: identical hairstyle, accessories and outfit colours in all four; same framing and scale; no cell borders or grid lines; no text.
The hair is very long (down to the ankles): keep it a compact silhouette so it animates with minimal swing.
```

- [x] #019 생성·저장 완료

## #020 · 문모모 — ① stand (정면 서기 마스터)

- **저장 이름**: `tmp/world-src/characters/char-doormomo-stand.png` (1024×1024, P0)
- **스레드**: 🆕 **새 스레드 시작** — `T-CH-doormomo`
- **레퍼런스 첨부**:
  - **필수** 캐릭터 원본 일러스트(전신 컷아웃): `src/web/assets/group-photo/doormomo.webp`
  - (선택) 톤 통일용 승인된 결과 1장: `tmp/world-src/characters/char-janine95kim-stand.png`
- **검수 체크**: 배경 투명/마젠타 단색, 글자 없음, 레퍼런스의 헤어 색·소품 유지, 전신이 잘리지 않음
- **변환**: `pnpm convert:world-art -- characters doormomo`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
The football club 잔디동 wears a white kit with mint-green (#2ee8b6) trim and a small text-free mint shield-with-sprout crest.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.
Attached (first image) is the original character illustration of "문모모". Redraw this exact character as a chibi pixel-art game sprite.
Keep: the same hairstyle and hair colours, short purple-black bob with blunt bangs and purple hair tips, white headband with a small red badge shape (no readable text), silver star hairpin, purple eyes, the same face vibe, and the outfit colours.
Outfit: the 잔디동 club kit: white short-sleeve jersey with mint-green side panels, sleeve trim and a small text-free mint shield crest with a sprout on the chest, white shorts with mint side stripe, white knee-high socks with a mint band, white football boots with mint studs.
Pose: standing idle, front view (facing the camera, slightly looking down at the viewer as in a top-down RPG), arms crossed over the chest, feet together on one baseline, full body visible with a little empty margin on all sides.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
The headband badge is a text-free red block.
```

- [x] #020 생성·저장 완료

## #021 · 문모모 — ② turn (3방향 서기)

- **저장 이름**: `tmp/world-src/characters/char-doormomo-turn.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-doormomo` (이 스레드의 첫 스텝 #020을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-doormomo-stand.png`
- **검수 체크**: 정면·우측·후면 3컷 크기·발끝 기준선 동일, 후면 뒷모습(머리 길이·장식) 자연스러움
- **변환**: `pnpm convert:world-art -- characters doormomo`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw the SAME character as a turnaround sheet with three standing poses side by side on one 1536x1024 canvas, evenly spaced with clear gaps:
1) front view (facing the camera), 2) right-side view (facing right, profile), 3) back view (facing away).
Rules: identical character design, palette, proportions and pixel size in all three; same scale; all feet on the exact same baseline; standing idle with arms relaxed; no motion; no shadows; keep at least 10% empty margin around each pose; do not add any text or guide lines.
The headband badge is a text-free red block.
```

- [x] #021 생성·저장 완료

## #022 · 문모모 — ③ walk (걷기 4프레임×3방향)

- **저장 이름**: `tmp/world-src/characters/char-doormomo-walk.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-doormomo` (이 스레드의 첫 스텝 #020을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ② 결과: `tmp/world-src/characters/char-doormomo-turn.png`
- **검수 체크**: 4×3 그리드 12칸 모두 같은 크기·같은 캐릭터, 발끝 행 동일, 칸 경계선 없음, 인접 칸으로 삐져나온 부분 없음
- **변환**: `pnpm convert:world-art -- characters doormomo`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached turnaround sheet as the exact reference, draw the SAME character's walk cycle as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows, each cell the same size, one pose per cell, centred, feet on the same baseline row in every cell.
Row 1 (top): walking toward the camera (front view), 4 frames.
Row 2 (middle): walking to the right (side view), 4 frames.
Row 3 (bottom): walking away from the camera (back view), 4 frames.
Frame order in every row: (1) left foot forward contact, (2) passing pose with the body slightly higher, (3) right foot forward contact, (4) passing pose with the body slightly higher. Arms swing opposite to the legs. Hair, ribbons and accessories move by at most one or two pixels.
Rules: identical design, palette, proportions and pixel size in all 12 cells; no motion blur; no shadows; no cell borders or grid lines; leave at least 10% empty margin inside every cell; no text.
The headband badge is a text-free red block.
```

- [x] #022 생성·저장 완료

## #023 · 문모모 — ④ portrait (표정 4종 2×2)

- **저장 이름**: `tmp/world-src/characters/char-doormomo-portrait.png` (1024×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-doormomo` (이 스레드의 첫 스텝 #020을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-doormomo-stand.png`
- **검수 체크**: 4칸 표정 구분 명확(기본/기쁨/놀람/걱정), 헤어·소품 동일, 프레이밍 동일
- **변환**: `pnpm convert:world-art -- characters doormomo`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw a dialogue portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, same pixel style as the sprite but more detailed.
Top-left: neutral, calm expression. Top-right: happy, smiling with sparkling eyes. Bottom-left: surprised, wide eyes and open mouth. Bottom-right: worried, slightly sweating, eyebrows down.
Rules: identical hairstyle, accessories and outfit colours in all four; same framing and scale; no cell borders or grid lines; no text.
The headband badge is a text-free red block.
```

- [x] #023 생성·저장 완료

## #024 · 하치 — ① stand (정면 서기 마스터)

- **저장 이름**: `tmp/world-src/characters/char-hachi97-stand.png` (1024×1024, P0)
- **스레드**: 🆕 **새 스레드 시작** — `T-CH-hachi97`
- **레퍼런스 첨부**:
  - **필수** 캐릭터 원본 일러스트(전신 컷아웃): `src/web/assets/group-photo/hachi97.webp`
  - (선택) 톤 통일용 승인된 결과 1장: `tmp/world-src/characters/char-janine95kim-stand.png`
- **검수 체크**: 배경 투명/마젠타 단색, 글자 없음, 레퍼런스의 헤어 색·소품 유지, 전신이 잘리지 않음
- **변환**: `pnpm convert:world-art -- characters hachi97`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
The football club 잔디동 wears a white kit with mint-green (#2ee8b6) trim and a small text-free mint shield-with-sprout crest.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.
Attached (first image) is the original character illustration of "하치". Redraw this exact character as a chibi pixel-art game sprite.
Keep: the same hairstyle and hair colours, short black bob with a white streak, small white antler-like horn ornaments on the head, purple eyes, big open-mouth smile, the same face vibe, and the outfit colours.
Outfit: the 잔디동 club kit: white short-sleeve jersey with mint-green side panels, sleeve trim and a small text-free mint shield crest with a sprout on the chest, white shorts with mint side stripe, white knee-high socks with a mint band, white football boots with mint studs.
Pose: standing idle, front view (facing the camera, slightly looking down at the viewer as in a top-down RPG), arms crossed over the chest, feet together on one baseline, full body visible with a little empty margin on all sides.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
Leave extra empty space above the head so the horns are not cut off.
```

- [x] #024 생성·저장 완료

## #025 · 하치 — ② turn (3방향 서기)

- **저장 이름**: `tmp/world-src/characters/char-hachi97-turn.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-hachi97` (이 스레드의 첫 스텝 #024을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-hachi97-stand.png`
- **검수 체크**: 정면·우측·후면 3컷 크기·발끝 기준선 동일, 후면 뒷모습(머리 길이·장식) 자연스러움
- **변환**: `pnpm convert:world-art -- characters hachi97`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw the SAME character as a turnaround sheet with three standing poses side by side on one 1536x1024 canvas, evenly spaced with clear gaps:
1) front view (facing the camera), 2) right-side view (facing right, profile), 3) back view (facing away).
Rules: identical character design, palette, proportions and pixel size in all three; same scale; all feet on the exact same baseline; standing idle with arms relaxed; no motion; no shadows; keep at least 10% empty margin around each pose; do not add any text or guide lines.
Leave extra empty space above the head so the horns are not cut off.
```

- [x] #025 생성·저장 완료

## #026 · 하치 — ③ walk (걷기 4프레임×3방향)

- **저장 이름**: `tmp/world-src/characters/char-hachi97-walk.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-hachi97` (이 스레드의 첫 스텝 #024을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ② 결과: `tmp/world-src/characters/char-hachi97-turn.png`
- **검수 체크**: 4×3 그리드 12칸 모두 같은 크기·같은 캐릭터, 발끝 행 동일, 칸 경계선 없음, 인접 칸으로 삐져나온 부분 없음
- **변환**: `pnpm convert:world-art -- characters hachi97`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached turnaround sheet as the exact reference, draw the SAME character's walk cycle as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows, each cell the same size, one pose per cell, centred, feet on the same baseline row in every cell.
Row 1 (top): walking toward the camera (front view), 4 frames.
Row 2 (middle): walking to the right (side view), 4 frames.
Row 3 (bottom): walking away from the camera (back view), 4 frames.
Frame order in every row: (1) left foot forward contact, (2) passing pose with the body slightly higher, (3) right foot forward contact, (4) passing pose with the body slightly higher. Arms swing opposite to the legs. Hair, ribbons and accessories move by at most one or two pixels.
Rules: identical design, palette, proportions and pixel size in all 12 cells; no motion blur; no shadows; no cell borders or grid lines; leave at least 10% empty margin inside every cell; no text.
Leave extra empty space above the head so the horns are not cut off.
```

- [x] #026 생성·저장 완료

## #027 · 하치 — ④ portrait (표정 4종 2×2)

- **저장 이름**: `tmp/world-src/characters/char-hachi97-portrait.png` (1024×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-hachi97` (이 스레드의 첫 스텝 #024을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-hachi97-stand.png`
- **검수 체크**: 4칸 표정 구분 명확(기본/기쁨/놀람/걱정), 헤어·소품 동일, 프레이밍 동일
- **변환**: `pnpm convert:world-art -- characters hachi97`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw a dialogue portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, same pixel style as the sprite but more detailed.
Top-left: neutral, calm expression. Top-right: happy, smiling with sparkling eyes. Bottom-left: surprised, wide eyes and open mouth. Bottom-right: worried, slightly sweating, eyebrows down.
Rules: identical hairstyle, accessories and outfit colours in all four; same framing and scale; no cell borders or grid lines; no text.
Leave extra empty space above the head so the horns are not cut off.
```

- [x] #027 생성·저장 완료

## #028 · 한결 — ① stand (정면 서기 마스터)

- **저장 이름**: `tmp/world-src/characters/char-kaksjak0730-stand.png` (1024×1024, P0)
- **스레드**: 🆕 **새 스레드 시작** — `T-CH-kaksjak0730`
- **레퍼런스 첨부**:
  - **필수** 캐릭터 원본 일러스트(전신 컷아웃): `src/web/assets/group-photo/kaksjak0730.webp`
  - (선택) 톤 통일용 승인된 결과 1장: `tmp/world-src/characters/char-janine95kim-stand.png`
- **검수 체크**: 배경 투명/마젠타 단색, 글자 없음, 레퍼런스의 헤어 색·소품 유지, 전신이 잘리지 않음
- **변환**: `pnpm convert:world-art -- characters kaksjak0730`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
The football club 잔디동 wears a white kit with mint-green (#2ee8b6) trim and a small text-free mint shield-with-sprout crest.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.
Attached (first image) is the original character illustration of "한결". Redraw this exact character as a chibi pixel-art game sprite.
Keep: the same hairstyle and hair colours, very long black hair in a high ponytail, blue eyes, white headphones with a mint-outlined cat-ear band, small star hairpin, gentle smile, the same face vibe, and the outfit colours.
Outfit: the 잔디동 club kit: white short-sleeve jersey with mint-green side panels, sleeve trim and a small text-free mint shield crest with a sprout on the chest, white shorts with mint side stripe, white knee-high socks with a mint band, white football boots with mint studs.
Pose: standing idle, front view (facing the camera, slightly looking down at the viewer as in a top-down RPG), arms relaxed at sides, feet together on one baseline, full body visible with a little empty margin on all sides.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
Emphasise the cat-ear headphone silhouette.
```

- [x] #028 생성·저장 완료

## #029 · 한결 — ② turn (3방향 서기)

- **저장 이름**: `tmp/world-src/characters/char-kaksjak0730-turn.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-kaksjak0730` (이 스레드의 첫 스텝 #028을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-kaksjak0730-stand.png`
- **검수 체크**: 정면·우측·후면 3컷 크기·발끝 기준선 동일, 후면 뒷모습(머리 길이·장식) 자연스러움
- **변환**: `pnpm convert:world-art -- characters kaksjak0730`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw the SAME character as a turnaround sheet with three standing poses side by side on one 1536x1024 canvas, evenly spaced with clear gaps:
1) front view (facing the camera), 2) right-side view (facing right, profile), 3) back view (facing away).
Rules: identical character design, palette, proportions and pixel size in all three; same scale; all feet on the exact same baseline; standing idle with arms relaxed; no motion; no shadows; keep at least 10% empty margin around each pose; do not add any text or guide lines.
Emphasise the cat-ear headphone silhouette.
```

- [x] #029 생성·저장 완료

## #030 · 한결 — ③ walk (걷기 4프레임×3방향)

- **저장 이름**: `tmp/world-src/characters/char-kaksjak0730-walk.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-kaksjak0730` (이 스레드의 첫 스텝 #028을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ② 결과: `tmp/world-src/characters/char-kaksjak0730-turn.png`
- **검수 체크**: 4×3 그리드 12칸 모두 같은 크기·같은 캐릭터, 발끝 행 동일, 칸 경계선 없음, 인접 칸으로 삐져나온 부분 없음
- **변환**: `pnpm convert:world-art -- characters kaksjak0730`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached turnaround sheet as the exact reference, draw the SAME character's walk cycle as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows, each cell the same size, one pose per cell, centred, feet on the same baseline row in every cell.
Row 1 (top): walking toward the camera (front view), 4 frames.
Row 2 (middle): walking to the right (side view), 4 frames.
Row 3 (bottom): walking away from the camera (back view), 4 frames.
Frame order in every row: (1) left foot forward contact, (2) passing pose with the body slightly higher, (3) right foot forward contact, (4) passing pose with the body slightly higher. Arms swing opposite to the legs. Hair, ribbons and accessories move by at most one or two pixels.
Rules: identical design, palette, proportions and pixel size in all 12 cells; no motion blur; no shadows; no cell borders or grid lines; leave at least 10% empty margin inside every cell; no text.
Emphasise the cat-ear headphone silhouette.
```

- [x] #030 생성·저장 완료

## #031 · 한결 — ④ portrait (표정 4종 2×2)

- **저장 이름**: `tmp/world-src/characters/char-kaksjak0730-portrait.png` (1024×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-kaksjak0730` (이 스레드의 첫 스텝 #028을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-kaksjak0730-stand.png`
- **검수 체크**: 4칸 표정 구분 명확(기본/기쁨/놀람/걱정), 헤어·소품 동일, 프레이밍 동일
- **변환**: `pnpm convert:world-art -- characters kaksjak0730`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw a dialogue portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, same pixel style as the sprite but more detailed.
Top-left: neutral, calm expression. Top-right: happy, smiling with sparkling eyes. Bottom-left: surprised, wide eyes and open mouth. Bottom-right: worried, slightly sweating, eyebrows down.
Rules: identical hairstyle, accessories and outfit colours in all four; same framing and scale; no cell borders or grid lines; no text.
Emphasise the cat-ear headphone silhouette.
```

- [x] #031 생성·저장 완료

## #032 · 쥬멩이 — ① stand (정면 서기 마스터)

- **저장 이름**: `tmp/world-src/characters/char-ju010228-stand.png` (1024×1024, P0)
- **스레드**: 🆕 **새 스레드 시작** — `T-CH-ju010228`
- **레퍼런스 첨부**:
  - **필수** 캐릭터 원본 일러스트(전신 컷아웃): `src/web/assets/group-photo/ju010228.webp`
  - (선택) 톤 통일용 승인된 결과 1장: `tmp/world-src/characters/char-janine95kim-stand.png`
- **검수 체크**: 배경 투명/마젠타 단색, 글자 없음, 레퍼런스의 헤어 색·소품 유지, 전신이 잘리지 않음
- **변환**: `pnpm convert:world-art -- characters ju010228`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
The football club 잔디동 wears a white kit with mint-green (#2ee8b6) trim and a small text-free mint shield-with-sprout crest.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.
Attached (first image) is the original character illustration of "쥬멩이". Redraw this exact character as a chibi pixel-art game sprite.
Keep: the same hairstyle and hair colours, very long green hair with a white streak and a white ribbon at the side, amber eyes, gentle smile, the same face vibe, and the outfit colours.
Outfit: the 잔디동 club kit: white short-sleeve jersey with mint-green side panels, sleeve trim and a small text-free mint shield crest with a sprout on the chest, white shorts with mint side stripe, white knee-high socks with a mint band, white football boots with mint studs.
Pose: standing idle, front view (facing the camera, slightly looking down at the viewer as in a top-down RPG), arms hands clasped behind the back, feet together on one baseline, full body visible with a little empty margin on all sides.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
The hair is very long: keep it a compact silhouette so it animates with minimal swing.
```

- [x] #032 생성·저장 완료

## #033 · 쥬멩이 — ② turn (3방향 서기)

- **저장 이름**: `tmp/world-src/characters/char-ju010228-turn.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-ju010228` (이 스레드의 첫 스텝 #032을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-ju010228-stand.png`
- **검수 체크**: 정면·우측·후면 3컷 크기·발끝 기준선 동일, 후면 뒷모습(머리 길이·장식) 자연스러움
- **변환**: `pnpm convert:world-art -- characters ju010228`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw the SAME character as a turnaround sheet with three standing poses side by side on one 1536x1024 canvas, evenly spaced with clear gaps:
1) front view (facing the camera), 2) right-side view (facing right, profile), 3) back view (facing away).
Rules: identical character design, palette, proportions and pixel size in all three; same scale; all feet on the exact same baseline; standing idle with arms relaxed; no motion; no shadows; keep at least 10% empty margin around each pose; do not add any text or guide lines.
The hair is very long: keep it a compact silhouette so it animates with minimal swing.
```

- [x] #033 생성·저장 완료

## #034 · 쥬멩이 — ③ walk (걷기 4프레임×3방향)

- **저장 이름**: `tmp/world-src/characters/char-ju010228-walk.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-ju010228` (이 스레드의 첫 스텝 #032을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ② 결과: `tmp/world-src/characters/char-ju010228-turn.png`
- **검수 체크**: 4×3 그리드 12칸 모두 같은 크기·같은 캐릭터, 발끝 행 동일, 칸 경계선 없음, 인접 칸으로 삐져나온 부분 없음
- **변환**: `pnpm convert:world-art -- characters ju010228`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached turnaround sheet as the exact reference, draw the SAME character's walk cycle as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows, each cell the same size, one pose per cell, centred, feet on the same baseline row in every cell.
Row 1 (top): walking toward the camera (front view), 4 frames.
Row 2 (middle): walking to the right (side view), 4 frames.
Row 3 (bottom): walking away from the camera (back view), 4 frames.
Frame order in every row: (1) left foot forward contact, (2) passing pose with the body slightly higher, (3) right foot forward contact, (4) passing pose with the body slightly higher. Arms swing opposite to the legs. Hair, ribbons and accessories move by at most one or two pixels.
Rules: identical design, palette, proportions and pixel size in all 12 cells; no motion blur; no shadows; no cell borders or grid lines; leave at least 10% empty margin inside every cell; no text.
The hair is very long: keep it a compact silhouette so it animates with minimal swing.
```

- [x] #034 생성·저장 완료

## #035 · 쥬멩이 — ④ portrait (표정 4종 2×2)

- **저장 이름**: `tmp/world-src/characters/char-ju010228-portrait.png` (1024×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-ju010228` (이 스레드의 첫 스텝 #032을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-ju010228-stand.png`
- **검수 체크**: 4칸 표정 구분 명확(기본/기쁨/놀람/걱정), 헤어·소품 동일, 프레이밍 동일
- **변환**: `pnpm convert:world-art -- characters ju010228`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw a dialogue portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, same pixel style as the sprite but more detailed.
Top-left: neutral, calm expression. Top-right: happy, smiling with sparkling eyes. Bottom-left: surprised, wide eyes and open mouth. Bottom-right: worried, slightly sweating, eyebrows down.
Rules: identical hairstyle, accessories and outfit colours in all four; same framing and scale; no cell borders or grid lines; no text.
The hair is very long: keep it a compact silhouette so it animates with minimal swing.
```

- [x] #035 생성·저장 완료

## #036 · 해파린 — ① stand (정면 서기 마스터)

- **저장 이름**: `tmp/world-src/characters/char-haepalin-stand.png` (1024×1024, P0)
- **스레드**: 🆕 **새 스레드 시작** — `T-CH-haepalin`
- **레퍼런스 첨부**:
  - **필수** 캐릭터 원본 일러스트(전신 컷아웃): `src/web/assets/group-photo/haepalin.webp`
  - (선택) 톤 통일용 승인된 결과 1장: `tmp/world-src/characters/char-janine95kim-stand.png`
- **검수 체크**: 배경 투명/마젠타 단색, 글자 없음, 레퍼런스의 헤어 색·소품 유지, 전신이 잘리지 않음
- **변환**: `pnpm convert:world-art -- characters haepalin`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
The football club 잔디동 wears a white kit with mint-green (#2ee8b6) trim and a small text-free mint shield-with-sprout crest.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.
Attached (first image) is the original character illustration of "해파린". Redraw this exact character as a chibi pixel-art game sprite.
Keep: the same hairstyle and hair colours, short lavender-periwinkle bob with one ahoge, blue eyes, a jellyfish-shaped hair ornament and small heart hair clips, soft smile, the same face vibe, and the outfit colours.
Outfit: the 잔디동 club kit: white short-sleeve jersey with mint-green side panels, sleeve trim and a small text-free mint shield crest with a sprout on the chest, white shorts with mint side stripe, white knee-high socks with a mint band, white football boots with mint studs.
Pose: standing idle, front view (facing the camera, slightly looking down at the viewer as in a top-down RPG), arms relaxed at sides, feet together on one baseline, full body visible with a little empty margin on all sides.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
The jellyfish hairpin is made of blue and white pixel blocks.
```

- [x] #036 생성·저장 완료

## #037 · 해파린 — ② turn (3방향 서기)

- **저장 이름**: `tmp/world-src/characters/char-haepalin-turn.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-haepalin` (이 스레드의 첫 스텝 #036을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-haepalin-stand.png`
- **검수 체크**: 정면·우측·후면 3컷 크기·발끝 기준선 동일, 후면 뒷모습(머리 길이·장식) 자연스러움
- **변환**: `pnpm convert:world-art -- characters haepalin`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw the SAME character as a turnaround sheet with three standing poses side by side on one 1536x1024 canvas, evenly spaced with clear gaps:
1) front view (facing the camera), 2) right-side view (facing right, profile), 3) back view (facing away).
Rules: identical character design, palette, proportions and pixel size in all three; same scale; all feet on the exact same baseline; standing idle with arms relaxed; no motion; no shadows; keep at least 10% empty margin around each pose; do not add any text or guide lines.
The jellyfish hairpin is made of blue and white pixel blocks.
```

- [x] #037 생성·저장 완료

## #038 · 해파린 — ③ walk (걷기 4프레임×3방향)

- **저장 이름**: `tmp/world-src/characters/char-haepalin-walk.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-haepalin` (이 스레드의 첫 스텝 #036을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ② 결과: `tmp/world-src/characters/char-haepalin-turn.png`
- **검수 체크**: 4×3 그리드 12칸 모두 같은 크기·같은 캐릭터, 발끝 행 동일, 칸 경계선 없음, 인접 칸으로 삐져나온 부분 없음
- **변환**: `pnpm convert:world-art -- characters haepalin`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached turnaround sheet as the exact reference, draw the SAME character's walk cycle as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows, each cell the same size, one pose per cell, centred, feet on the same baseline row in every cell.
Row 1 (top): walking toward the camera (front view), 4 frames.
Row 2 (middle): walking to the right (side view), 4 frames.
Row 3 (bottom): walking away from the camera (back view), 4 frames.
Frame order in every row: (1) left foot forward contact, (2) passing pose with the body slightly higher, (3) right foot forward contact, (4) passing pose with the body slightly higher. Arms swing opposite to the legs. Hair, ribbons and accessories move by at most one or two pixels.
Rules: identical design, palette, proportions and pixel size in all 12 cells; no motion blur; no shadows; no cell borders or grid lines; leave at least 10% empty margin inside every cell; no text.
The jellyfish hairpin is made of blue and white pixel blocks.
```

- [x] #038 생성·저장 완료

## #039 · 해파린 — ④ portrait (표정 4종 2×2)

- **저장 이름**: `tmp/world-src/characters/char-haepalin-portrait.png` (1024×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-haepalin` (이 스레드의 첫 스텝 #036을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-haepalin-stand.png`
- **검수 체크**: 4칸 표정 구분 명확(기본/기쁨/놀람/걱정), 헤어·소품 동일, 프레이밍 동일
- **변환**: `pnpm convert:world-art -- characters haepalin`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw a dialogue portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, same pixel style as the sprite but more detailed.
Top-left: neutral, calm expression. Top-right: happy, smiling with sparkling eyes. Bottom-left: surprised, wide eyes and open mouth. Bottom-right: worried, slightly sweating, eyebrows down.
Rules: identical hairstyle, accessories and outfit colours in all four; same framing and scale; no cell borders or grid lines; no text.
The jellyfish hairpin is made of blue and white pixel blocks.
```

- [x] #039 생성·저장 완료

## #040 · 빙밍 — ① stand (정면 서기 마스터)

- **저장 이름**: `tmp/world-src/characters/char-tleod1818-stand.png` (1024×1024, P0)
- **스레드**: 🆕 **새 스레드 시작** — `T-CH-tleod1818`
- **레퍼런스 첨부**:
  - **필수** 캐릭터 원본 일러스트(전신 컷아웃): `src/web/assets/group-photo/tleod1818.webp`
  - (선택) 톤 통일용 승인된 결과 1장: `tmp/world-src/characters/char-janine95kim-stand.png`
- **검수 체크**: 배경 투명/마젠타 단색, 글자 없음, 레퍼런스의 헤어 색·소품 유지, 전신이 잘리지 않음
- **변환**: `pnpm convert:world-art -- characters tleod1818`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
The football club 잔디동 wears a white kit with mint-green (#2ee8b6) trim and a small text-free mint shield-with-sprout crest.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.
Attached (first image) is the original character illustration of "빙밍". Redraw this exact character as a chibi pixel-art game sprite.
Keep: the same hairstyle and hair colours, black hair in a bun with a green leaf hairpin and a small white flower, blunt bangs, green eyes, black ribbon choker, the same face vibe, and the outfit colours.
Outfit: the 잔디동 club kit: white short-sleeve jersey with mint-green side panels, sleeve trim and a small text-free mint shield crest with a sprout on the chest, white shorts with mint side stripe, white knee-high socks with a mint band, white football boots with mint studs.
Pose: standing idle, front view (facing the camera, slightly looking down at the viewer as in a top-down RPG), arms relaxed at sides, feet together on one baseline, full body visible with a little empty margin on all sides.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
Keep the leaf hairpin bright green.
```

- [x] #040 생성·저장 완료

## #041 · 빙밍 — ② turn (3방향 서기)

- **저장 이름**: `tmp/world-src/characters/char-tleod1818-turn.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-tleod1818` (이 스레드의 첫 스텝 #040을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-tleod1818-stand.png`
- **검수 체크**: 정면·우측·후면 3컷 크기·발끝 기준선 동일, 후면 뒷모습(머리 길이·장식) 자연스러움
- **변환**: `pnpm convert:world-art -- characters tleod1818`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw the SAME character as a turnaround sheet with three standing poses side by side on one 1536x1024 canvas, evenly spaced with clear gaps:
1) front view (facing the camera), 2) right-side view (facing right, profile), 3) back view (facing away).
Rules: identical character design, palette, proportions and pixel size in all three; same scale; all feet on the exact same baseline; standing idle with arms relaxed; no motion; no shadows; keep at least 10% empty margin around each pose; do not add any text or guide lines.
Keep the leaf hairpin bright green.
```

- [x] #041 생성·저장 완료

## #042 · 빙밍 — ③ walk (걷기 4프레임×3방향)

- **저장 이름**: `tmp/world-src/characters/char-tleod1818-walk.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-tleod1818` (이 스레드의 첫 스텝 #040을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ② 결과: `tmp/world-src/characters/char-tleod1818-turn.png`
- **검수 체크**: 4×3 그리드 12칸 모두 같은 크기·같은 캐릭터, 발끝 행 동일, 칸 경계선 없음, 인접 칸으로 삐져나온 부분 없음
- **변환**: `pnpm convert:world-art -- characters tleod1818`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached turnaround sheet as the exact reference, draw the SAME character's walk cycle as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows, each cell the same size, one pose per cell, centred, feet on the same baseline row in every cell.
Row 1 (top): walking toward the camera (front view), 4 frames.
Row 2 (middle): walking to the right (side view), 4 frames.
Row 3 (bottom): walking away from the camera (back view), 4 frames.
Frame order in every row: (1) left foot forward contact, (2) passing pose with the body slightly higher, (3) right foot forward contact, (4) passing pose with the body slightly higher. Arms swing opposite to the legs. Hair, ribbons and accessories move by at most one or two pixels.
Rules: identical design, palette, proportions and pixel size in all 12 cells; no motion blur; no shadows; no cell borders or grid lines; leave at least 10% empty margin inside every cell; no text.
Keep the leaf hairpin bright green.
```

- [x] #042 생성·저장 완료

## #043 · 빙밍 — ④ portrait (표정 4종 2×2)

- **저장 이름**: `tmp/world-src/characters/char-tleod1818-portrait.png` (1024×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-tleod1818` (이 스레드의 첫 스텝 #040을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-tleod1818-stand.png`
- **검수 체크**: 4칸 표정 구분 명확(기본/기쁨/놀람/걱정), 헤어·소품 동일, 프레이밍 동일
- **변환**: `pnpm convert:world-art -- characters tleod1818`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw a dialogue portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, same pixel style as the sprite but more detailed.
Top-left: neutral, calm expression. Top-right: happy, smiling with sparkling eyes. Bottom-left: surprised, wide eyes and open mouth. Bottom-right: worried, slightly sweating, eyebrows down.
Rules: identical hairstyle, accessories and outfit colours in all four; same framing and scale; no cell borders or grid lines; no text.
Keep the leaf hairpin bright green.
```

- [x] #043 생성·저장 완료

## #044 · 다시바 — ① stand (정면 서기 마스터)

- **저장 이름**: `tmp/world-src/characters/char-tdnlamuron-stand.png` (1024×1024, P0)
- **스레드**: 🆕 **새 스레드 시작** — `T-CH-tdnlamuron`
- **레퍼런스 첨부**:
  - **필수** 캐릭터 원본 일러스트(전신 컷아웃): `src/web/assets/group-photo/tdnlamuron.webp`
  - (선택) 톤 통일용 승인된 결과 1장: `tmp/world-src/characters/char-janine95kim-stand.png`
- **검수 체크**: 배경 투명/마젠타 단색, 글자 없음, 레퍼런스의 헤어 색·소품 유지, 전신이 잘리지 않음
- **변환**: `pnpm convert:world-art -- characters tdnlamuron`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
The football club 잔디동 wears a white kit with mint-green (#2ee8b6) trim and a small text-free mint shield-with-sprout crest.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.
Attached (first image) is the original character illustration of "다시바". Redraw this exact character as a chibi pixel-art game sprite.
Keep: the same hairstyle and hair colours, short black hair with orange and white streaks, cat ears with pink inner ear, a hairpin shaped like a small round badge (no readable number), amber eyes, black choker, the same face vibe, and the outfit colours.
Outfit: the 잔디동 club kit: white short-sleeve jersey with mint-green side panels, sleeve trim and a small text-free mint shield crest with a sprout on the chest, white shorts with mint side stripe, white knee-high socks with a mint band, white football boots with mint studs.
Pose: standing idle, front view (facing the camera, slightly looking down at the viewer as in a top-down RPG), arms crossed over the chest, feet together on one baseline, full body visible with a little empty margin on all sides.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
Leave extra empty space above the ears.
```

- [x] #044 생성·저장 완료

## #045 · 다시바 — ② turn (3방향 서기)

- **저장 이름**: `tmp/world-src/characters/char-tdnlamuron-turn.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-tdnlamuron` (이 스레드의 첫 스텝 #044을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-tdnlamuron-stand.png`
- **검수 체크**: 정면·우측·후면 3컷 크기·발끝 기준선 동일, 후면 뒷모습(머리 길이·장식) 자연스러움
- **변환**: `pnpm convert:world-art -- characters tdnlamuron`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw the SAME character as a turnaround sheet with three standing poses side by side on one 1536x1024 canvas, evenly spaced with clear gaps:
1) front view (facing the camera), 2) right-side view (facing right, profile), 3) back view (facing away).
Rules: identical character design, palette, proportions and pixel size in all three; same scale; all feet on the exact same baseline; standing idle with arms relaxed; no motion; no shadows; keep at least 10% empty margin around each pose; do not add any text or guide lines.
Leave extra empty space above the ears.
```

- [x] #045 생성·저장 완료

## #046 · 다시바 — ③ walk (걷기 4프레임×3방향)

- **저장 이름**: `tmp/world-src/characters/char-tdnlamuron-walk.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-tdnlamuron` (이 스레드의 첫 스텝 #044을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ② 결과: `tmp/world-src/characters/char-tdnlamuron-turn.png`
- **검수 체크**: 4×3 그리드 12칸 모두 같은 크기·같은 캐릭터, 발끝 행 동일, 칸 경계선 없음, 인접 칸으로 삐져나온 부분 없음
- **변환**: `pnpm convert:world-art -- characters tdnlamuron`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached turnaround sheet as the exact reference, draw the SAME character's walk cycle as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows, each cell the same size, one pose per cell, centred, feet on the same baseline row in every cell.
Row 1 (top): walking toward the camera (front view), 4 frames.
Row 2 (middle): walking to the right (side view), 4 frames.
Row 3 (bottom): walking away from the camera (back view), 4 frames.
Frame order in every row: (1) left foot forward contact, (2) passing pose with the body slightly higher, (3) right foot forward contact, (4) passing pose with the body slightly higher. Arms swing opposite to the legs. Hair, ribbons and accessories move by at most one or two pixels.
Rules: identical design, palette, proportions and pixel size in all 12 cells; no motion blur; no shadows; no cell borders or grid lines; leave at least 10% empty margin inside every cell; no text.
Leave extra empty space above the ears.
```

- [x] #046 생성·저장 완료

## #047 · 다시바 — ④ portrait (표정 4종 2×2)

- **저장 이름**: `tmp/world-src/characters/char-tdnlamuron-portrait.png` (1024×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-tdnlamuron` (이 스레드의 첫 스텝 #044을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-tdnlamuron-stand.png`
- **검수 체크**: 4칸 표정 구분 명확(기본/기쁨/놀람/걱정), 헤어·소품 동일, 프레이밍 동일
- **변환**: `pnpm convert:world-art -- characters tdnlamuron`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw a dialogue portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, same pixel style as the sprite but more detailed.
Top-left: neutral, calm expression. Top-right: happy, smiling with sparkling eyes. Bottom-left: surprised, wide eyes and open mouth. Bottom-right: worried, slightly sweating, eyebrows down.
Rules: identical hairstyle, accessories and outfit colours in all four; same framing and scale; no cell borders or grid lines; no text.
Leave extra empty space above the ears.
```

- [x] #047 생성·저장 완료

## #048 · 리냐 — ① stand (정면 서기 마스터)

- **저장 이름**: `tmp/world-src/characters/char-lina0108-stand.png` (1024×1024, P0)
- **스레드**: 🆕 **새 스레드 시작** — `T-CH-lina0108`
- **레퍼런스 첨부**:
  - **필수** 캐릭터 원본 일러스트(전신 컷아웃): `src/web/assets/group-photo/lina0108.webp`
  - (선택) 톤 통일용 승인된 결과 1장: `tmp/world-src/characters/char-janine95kim-stand.png`
- **검수 체크**: 배경 투명/마젠타 단색, 글자 없음, 레퍼런스의 헤어 색·소품 유지, 전신이 잘리지 않음
- **변환**: `pnpm convert:world-art -- characters lina0108`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
The football club 잔디동 wears a white kit with mint-green (#2ee8b6) trim and a small text-free mint shield-with-sprout crest.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.
Attached (first image) is the original character illustration of "리냐". Redraw this exact character as a chibi pixel-art game sprite.
Keep: the same hairstyle and hair colours, long messy red-pink hair with a white streak, small pink-and-white horns, amber eyes, playful smirk, the same face vibe, and the outfit colours.
Outfit: the 잔디동 club kit: white short-sleeve jersey with mint-green side panels, sleeve trim and a small text-free mint shield crest with a sprout on the chest, white shorts with mint side stripe, white knee-high socks with a mint band, white football boots with mint studs.
Pose: standing idle, front view (facing the camera, slightly looking down at the viewer as in a top-down RPG), arms crossed over the chest, feet together on one baseline, full body visible with a little empty margin on all sides.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
The hair is voluminous: leave enough margin so nothing is cut off.
```

- [x] #048 생성·저장 완료

## #049 · 리냐 — ② turn (3방향 서기)

- **저장 이름**: `tmp/world-src/characters/char-lina0108-turn.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-lina0108` (이 스레드의 첫 스텝 #048을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-lina0108-stand.png`
- **검수 체크**: 정면·우측·후면 3컷 크기·발끝 기준선 동일, 후면 뒷모습(머리 길이·장식) 자연스러움
- **변환**: `pnpm convert:world-art -- characters lina0108`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw the SAME character as a turnaround sheet with three standing poses side by side on one 1536x1024 canvas, evenly spaced with clear gaps:
1) front view (facing the camera), 2) right-side view (facing right, profile), 3) back view (facing away).
Rules: identical character design, palette, proportions and pixel size in all three; same scale; all feet on the exact same baseline; standing idle with arms relaxed; no motion; no shadows; keep at least 10% empty margin around each pose; do not add any text or guide lines.
The hair is voluminous: leave enough margin so nothing is cut off.
```

- [x] #049 생성·저장 완료

## #050 · 리냐 — ③ walk (걷기 4프레임×3방향)

- **저장 이름**: `tmp/world-src/characters/char-lina0108-walk.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-lina0108` (이 스레드의 첫 스텝 #048을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ② 결과: `tmp/world-src/characters/char-lina0108-turn.png`
- **검수 체크**: 4×3 그리드 12칸 모두 같은 크기·같은 캐릭터, 발끝 행 동일, 칸 경계선 없음, 인접 칸으로 삐져나온 부분 없음
- **변환**: `pnpm convert:world-art -- characters lina0108`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached turnaround sheet as the exact reference, draw the SAME character's walk cycle as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows, each cell the same size, one pose per cell, centred, feet on the same baseline row in every cell.
Row 1 (top): walking toward the camera (front view), 4 frames.
Row 2 (middle): walking to the right (side view), 4 frames.
Row 3 (bottom): walking away from the camera (back view), 4 frames.
Frame order in every row: (1) left foot forward contact, (2) passing pose with the body slightly higher, (3) right foot forward contact, (4) passing pose with the body slightly higher. Arms swing opposite to the legs. Hair, ribbons and accessories move by at most one or two pixels.
Rules: identical design, palette, proportions and pixel size in all 12 cells; no motion blur; no shadows; no cell borders or grid lines; leave at least 10% empty margin inside every cell; no text.
The hair is voluminous: leave enough margin so nothing is cut off.
```

- [x] #050 생성·저장 완료

## #051 · 리냐 — ④ portrait (표정 4종 2×2)

- **저장 이름**: `tmp/world-src/characters/char-lina0108-portrait.png` (1024×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-lina0108` (이 스레드의 첫 스텝 #048을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-lina0108-stand.png`
- **검수 체크**: 4칸 표정 구분 명확(기본/기쁨/놀람/걱정), 헤어·소품 동일, 프레이밍 동일
- **변환**: `pnpm convert:world-art -- characters lina0108`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw a dialogue portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, same pixel style as the sprite but more detailed.
Top-left: neutral, calm expression. Top-right: happy, smiling with sparkling eyes. Bottom-left: surprised, wide eyes and open mouth. Bottom-right: worried, slightly sweating, eyebrows down.
Rules: identical hairstyle, accessories and outfit colours in all four; same framing and scale; no cell borders or grid lines; no text.
The hair is voluminous: leave enough margin so nothing is cut off.
```

- [x] #051 생성·저장 완료

## #052 · 우왁굳 — ① stand (정면 서기 마스터)

- **저장 이름**: `tmp/world-src/characters/char-woowakgood-stand.png` (1024×1024, P0)
- **스레드**: 🆕 **새 스레드 시작** — `T-CH-woowakgood`
- **레퍼런스 첨부**:
  - **필수** 캐릭터 원본 일러스트(전신 컷아웃): `src/web/assets/group-photo/woowakgood.webp`
  - (선택) 톤 통일용 승인된 결과 1장: `tmp/world-src/characters/char-janine95kim-stand.png`
- **검수 체크**: 배경 투명/마젠타 단색, 글자 없음, 레퍼런스의 헤어 색·소품 유지, 전신이 잘리지 않음
- **변환**: `pnpm convert:world-art -- characters woowakgood`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.
Attached (first image) is the original character illustration of "우왁굳". Redraw this exact character as a chibi pixel-art game sprite.
Keep: the same hairstyle and hair colours, adult man's body in a black suit, white shirt, mint-green necktie and mint pocket square, black dress shoes; head is a stylised golden-tan animal-like mascot head (capybara-like) with small round ears and a black headset with a boom microphone and a small red badge, the same face vibe, and the outfit colours.
Outfit: black formal suit with mint tie and pocket square
Pose: standing idle, front view (facing the camera, slightly looking down at the viewer as in a top-down RPG), arms one hand in the trouser pocket, the other adjusting the jacket, feet together on one baseline, full body visible with a little empty margin on all sides.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
Keep the stylised animal-like mascot head; do not turn it into a human face.
```

- [x] #052 생성·저장 완료

## #053 · 우왁굳 — ② turn (3방향 서기)

- **저장 이름**: `tmp/world-src/characters/char-woowakgood-turn.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-woowakgood` (이 스레드의 첫 스텝 #052을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-woowakgood-stand.png`
- **검수 체크**: 정면·우측·후면 3컷 크기·발끝 기준선 동일, 후면 뒷모습(머리 길이·장식) 자연스러움
- **변환**: `pnpm convert:world-art -- characters woowakgood`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw the SAME character as a turnaround sheet with three standing poses side by side on one 1536x1024 canvas, evenly spaced with clear gaps:
1) front view (facing the camera), 2) right-side view (facing right, profile), 3) back view (facing away).
Rules: identical character design, palette, proportions and pixel size in all three; same scale; all feet on the exact same baseline; standing idle with arms relaxed; no motion; no shadows; keep at least 10% empty margin around each pose; do not add any text or guide lines.
Keep the stylised animal-like mascot head; do not turn it into a human face.
```

- [x] #053 생성·저장 완료

## #054 · 우왁굳 — ③ walk (걷기 4프레임×3방향)

- **저장 이름**: `tmp/world-src/characters/char-woowakgood-walk.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-woowakgood` (이 스레드의 첫 스텝 #052을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ② 결과: `tmp/world-src/characters/char-woowakgood-turn.png`
- **검수 체크**: 4×3 그리드 12칸 모두 같은 크기·같은 캐릭터, 발끝 행 동일, 칸 경계선 없음, 인접 칸으로 삐져나온 부분 없음
- **변환**: `pnpm convert:world-art -- characters woowakgood`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached turnaround sheet as the exact reference, draw the SAME character's walk cycle as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows, each cell the same size, one pose per cell, centred, feet on the same baseline row in every cell.
Row 1 (top): walking toward the camera (front view), 4 frames.
Row 2 (middle): walking to the right (side view), 4 frames.
Row 3 (bottom): walking away from the camera (back view), 4 frames.
Frame order in every row: (1) left foot forward contact, (2) passing pose with the body slightly higher, (3) right foot forward contact, (4) passing pose with the body slightly higher. Arms swing opposite to the legs. Hair, ribbons and accessories move by at most one or two pixels.
Rules: identical design, palette, proportions and pixel size in all 12 cells; no motion blur; no shadows; no cell borders or grid lines; leave at least 10% empty margin inside every cell; no text.
Keep the stylised animal-like mascot head; do not turn it into a human face.
```

- [x] #054 생성·저장 완료

## #055 · 우왁굳 — ④ portrait (표정 4종 2×2)

- **저장 이름**: `tmp/world-src/characters/char-woowakgood-portrait.png` (1024×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-woowakgood` (이 스레드의 첫 스텝 #052을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-woowakgood-stand.png`
- **검수 체크**: 4칸 표정 구분 명확(기본/기쁨/놀람/걱정), 헤어·소품 동일, 프레이밍 동일
- **변환**: `pnpm convert:world-art -- characters woowakgood`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw a dialogue portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, same pixel style as the sprite but more detailed.
Top-left: neutral, calm expression. Top-right: happy, smiling with sparkling eyes. Bottom-left: surprised, wide eyes and open mouth. Bottom-right: worried, slightly sweating, eyebrows down.
Rules: identical hairstyle, accessories and outfit colours in all four; same framing and scale; no cell borders or grid lines; no text.
Keep the stylised animal-like mascot head; do not turn it into a human face.
```

- [x] #055 생성·저장 완료

## #056 · 잔디 할아버지 — ① stand (정면 서기 마스터)

- **저장 이름**: `tmp/world-src/characters/char-elder-stand.png` (1024×1024, P0)
- **스레드**: 🆕 **새 스레드 시작** — `T-CH-elder`
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 승인된 결과 1장: `tmp/world-src/characters/char-janine95kim-stand.png`
- **검수 체크**: 배경 투명/마젠타 단색, 글자 없음, 설명한 외형·색 반영, 전신이 잘리지 않음
- **변환**: `pnpm convert:world-art -- characters elder`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.
Create an original chibi pixel-art game character sprite: an elderly village groundskeeper, kind face, big white moustache, bald head with a worn straw hat, green work apron over a beige shirt with rolled sleeves, brown trousers and boots, holding a small metal watering can in one hand, slightly hunched, warm smile, earthy green and beige palette
Pose: standing idle, front view, arms relaxed, feet together on one baseline, full body visible with a little empty margin.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
```

- [x] #056 생성·저장 완료

## #057 · 잔디 할아버지 — ② turn (3방향 서기)

- **저장 이름**: `tmp/world-src/characters/char-elder-turn.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-elder` (이 스레드의 첫 스텝 #056을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-elder-stand.png`
- **검수 체크**: 정면·우측·후면 3컷 크기·발끝 기준선 동일, 후면 뒷모습(머리 길이·장식) 자연스러움
- **변환**: `pnpm convert:world-art -- characters elder`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw the SAME character as a turnaround sheet with three standing poses side by side on one 1536x1024 canvas, evenly spaced with clear gaps:
1) front view (facing the camera), 2) right-side view (facing right, profile), 3) back view (facing away).
Rules: identical character design, palette, proportions and pixel size in all three; same scale; all feet on the exact same baseline; standing idle with arms relaxed; no motion; no shadows; keep at least 10% empty margin around each pose; do not add any text or guide lines.
```

- [x] #057 생성·저장 완료

## #058 · 잔디 할아버지 — ③ walk (걷기 4프레임×3방향)

- **저장 이름**: `tmp/world-src/characters/char-elder-walk.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-elder` (이 스레드의 첫 스텝 #056을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ② 결과: `tmp/world-src/characters/char-elder-turn.png`
- **검수 체크**: 4×3 그리드 12칸 모두 같은 크기·같은 캐릭터, 발끝 행 동일, 칸 경계선 없음, 인접 칸으로 삐져나온 부분 없음
- **변환**: `pnpm convert:world-art -- characters elder`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached turnaround sheet as the exact reference, draw the SAME character's walk cycle as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows, each cell the same size, one pose per cell, centred, feet on the same baseline row in every cell.
Row 1 (top): walking toward the camera (front view), 4 frames.
Row 2 (middle): walking to the right (side view), 4 frames.
Row 3 (bottom): walking away from the camera (back view), 4 frames.
Frame order in every row: (1) left foot forward contact, (2) passing pose with the body slightly higher, (3) right foot forward contact, (4) passing pose with the body slightly higher. Arms swing opposite to the legs. Hair, ribbons and accessories move by at most one or two pixels.
Rules: identical design, palette, proportions and pixel size in all 12 cells; no motion blur; no shadows; no cell borders or grid lines; leave at least 10% empty margin inside every cell; no text.
```

- [x] #058 생성·저장 완료

## #059 · 잔디 할아버지 — ④ portrait (표정 4종 2×2)

- **저장 이름**: `tmp/world-src/characters/char-elder-portrait.png` (1024×1024, P0)
- **스레드**: ↪ **이어서** — `T-CH-elder` (이 스레드의 첫 스텝 #056을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-elder-stand.png`
- **검수 체크**: 4칸 표정 구분 명확(기본/기쁨/놀람/걱정), 헤어·소품 동일, 프레이밍 동일
- **변환**: `pnpm convert:world-art -- characters elder`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw a dialogue portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, same pixel style as the sprite but more detailed.
Top-left: neutral, calm expression. Top-right: happy, smiling with sparkling eyes. Bottom-left: surprised, wide eyes and open mouth. Bottom-right: worried, slightly sweating, eyebrows down.
Rules: identical hairstyle, accessories and outfit colours in all four; same framing and scale; no cell borders or grid lines; no text.
```

- [x] #059 생성·저장 완료

---

# Phase 3 — P0 지면·소품

`T-TERRAIN`은 Phase 1에서 연 스레드에서 이어서 진행.

## #060 · 지면 시트 — pitch

- **저장 이름**: `tmp/world-src/terrain/terrain-pitch.png` (1024×1024 (4×4), P0)
- **스레드**: ↪ **이어서** — `T-TERRAIN` (이 스레드의 첫 스텝 #008을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 terrain-core 결과: `tmp/world-src/terrain/terrain-core.png`
- **검수 체크**: 16칸 모두 꽉 채워짐, 타일 사이 경계선 없음, 가장자리가 이어져 보임, 글자/그림자 없음
- **변환**: `pnpm convert:world-art -- terrain pitch`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Create a seamless tileset texture sheet for a top-down pixel-art RPG on one 1024x1024 canvas: a strict 4x4 grid of 16 square tiles (each 256x256, no gaps, no borders, no grid lines, tiles fill the whole canvas, no transparency). EVERY tile must tile seamlessly with itself on all four edges (left edge matches right edge, top matches bottom). Straight top-down texture, no perspective, no objects casting shadows, no text. Each visible pixel block is about 8 px so the art reads as a 32x32-pixel tile. Keep large shapes bold so the texture stays readable when scaled down.
Theme: football pitch surfaces and stadium ground: light and dark mowing stripes, worn pitch, red running track, training turf, artificial turf, sand pit, stadium concourse, and a golden grass tile. Do NOT draw pitch lines (they are drawn by code)
Tiles in order (left to right, top to bottom):
1) light-stripe pitch grass, 2) dark-stripe pitch grass, 3) worn pitch A (bare patches), 4) worn pitch B, 5) red running track A, 6) red track B, 7) training turf A, 8) training turf B, 9) artificial turf A, 10) artificial turf B, 11) sand pit A, 12) sand pit B, 13) stadium concourse grey concrete, 14) goal-area dirt, 15) worn corner patch, 16) golden grass tile (lush gold-tinted grass with faint sparkles)
```

- [x] #060 생성·저장 완료

## #061 · 지면 시트 — water

- **저장 이름**: `tmp/world-src/terrain/terrain-water.png` (1024×1024 (4×4), P0)
- **스레드**: ↪ **이어서** — `T-TERRAIN` (이 스레드의 첫 스텝 #008을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 terrain-core 결과: `tmp/world-src/terrain/terrain-core.png`
- **검수 체크**: 16칸 모두 꽉 채워짐, 타일 사이 경계선 없음, 가장자리가 이어져 보임, 글자/그림자 없음
- **변환**: `pnpm convert:world-art -- terrain water`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Create a seamless tileset texture sheet for a top-down pixel-art RPG on one 1024x1024 canvas: a strict 4x4 grid of 16 square tiles (each 256x256, no gaps, no borders, no grid lines, tiles fill the whole canvas, no transparency). EVERY tile must tile seamlessly with itself on all four edges (left edge matches right edge, top matches bottom). Straight top-down texture, no perspective, no objects casting shadows, no text. Each visible pixel block is about 8 px so the art reads as a 32x32-pixel tile. Keep large shapes bold so the texture stays readable when scaled down.
Theme: calm blue lake water with animated ripple variations, deep water, sandy shore and wooden boardwalk planks
Tiles in order (left to right, top to bottom):
1-4) shallow water frames 1 to 4 (same tile with ripples shifted a little each frame so they loop), 5-8) deep water frames 1 to 4 (darker, looping ripples), 9) pale sand A, 10) pale sand B, 11) wet dark sand, 12) sand with pebbles A, 13) sand with pebbles B, 14) wooden bridge planks A (horizontal), 15) wooden bridge planks B (worn), 16) water with a lily pad
```

- [x] #061 생성·저장 완료

## #062 · 소품 시트 — trees

- **저장 이름**: `tmp/world-src/props/props-trees.png` (1536×1024 (4×3), P0)
- **스레드**: 🆕 **새 스레드 시작** — `T-PROPS-1`
- **레퍼런스 첨부**: 없음
- **검수 체크**: 12칸에 오브젝트 1개씩, 각 칸 중앙·80% 크기, 바닥 그림자/배경 잔여물 없음, 칸 경계선 없음
- **변환**: `pnpm convert:world-art -- props trees`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).

Create a pixel-art prop sheet for a top-down 3/4-view RPG on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows (12 cells, each 384x341), exactly one object per cell, centred and filling about 80% of its cell. Transparent background (or flat #FF00FF), no ground plane, NO cast shadow on the ground, light from the top-left, no cell borders or grid lines, at least 8% empty margin inside every cell, no text or letters.
Theme: trees for a top-down RPG village: leafy canopy and trunk clearly separated, canopy is bold and readable
Objects in order (left to right, top to bottom):
1) round green oak tree, 2) big old oak tree, 3) tall green pine, 4) white birch tree, 5) pink cherry-blossom tree in full bloom, 6) fluffy pale-blue-and-white cloud tree, 7) snow-covered pine, 8) dark blue-purple night tree with glowing fruit, 9) bare dead tree with no leaves, 10) charred tree with glowing embers, 11) golden-leaf tree, 12) small tree stump with rings
```

- [x] #062 생성·저장 완료

## #063 · 소품 시트 — plants

- **저장 이름**: `tmp/world-src/props/props-plants.png` (1536×1024 (4×3), P0)
- **스레드**: ↪ **이어서** — `T-PROPS-1` (이 스레드의 첫 스텝 #062을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 props-trees 결과: `tmp/world-src/props/props-trees.png`
- **검수 체크**: 12칸에 오브젝트 1개씩, 각 칸 중앙·80% 크기, 바닥 그림자/배경 잔여물 없음, 칸 경계선 없음
- **변환**: `pnpm convert:world-art -- props plants`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Create a pixel-art prop sheet for a top-down 3/4-view RPG on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows (12 cells, each 384x341), exactly one object per cell, centred and filling about 80% of its cell. Transparent background (or flat #FF00FF), no ground plane, NO cast shadow on the ground, light from the top-left, no cell borders or grid lines, at least 8% empty margin inside every cell, no text or letters.
Theme: small plants and bushes: readable silhouettes, bright colours
Objects in order (left to right, top to bottom):
1) round green bush, 2) leafy bush with berries, 3) round bush covered in pink flowers, 4) hedge segment (a straight trimmed hedge, wide), 5) red flower patch, 6) yellow flower patch, 7) white flower patch, 8) blue flower patch, 9) tall grass tuft, 10) fern, 11) mushroom cluster, 12) reed clump (for lakeside)
```

- [x] #063 생성·저장 완료

## #064 · 소품 시트 — rocks

- **저장 이름**: `tmp/world-src/props/props-rocks.png` (1536×1024 (4×3), P0)
- **스레드**: ↪ **이어서** — `T-PROPS-1` (이 스레드의 첫 스텝 #062을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 props-trees 결과: `tmp/world-src/props/props-trees.png`
- **검수 체크**: 12칸에 오브젝트 1개씩, 각 칸 중앙·80% 크기, 바닥 그림자/배경 잔여물 없음, 칸 경계선 없음
- **변환**: `pnpm convert:world-art -- props rocks`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Create a pixel-art prop sheet for a top-down 3/4-view RPG on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows (12 cells, each 384x341), exactly one object per cell, centred and filling about 80% of its cell. Transparent background (or flat #FF00FF), no ground plane, NO cast shadow on the ground, light from the top-left, no cell borders or grid lines, at least 8% empty margin inside every cell, no text or letters.
Theme: rocks, logs, wooden fences and stone walls, cliff face segments
Objects in order (left to right, top to bottom):
1) small rock, 2) medium rock, 3) large rock, 4) big mossy boulder, 5) single log, 6) stacked log pile, 7) wooden fence segment horizontal (wide), 8) wooden fence segment vertical (post seen from the side), 9) wooden fence corner, 10) stone wall segment horizontal, 11) stone wall segment vertical, 12) cliff face segment (grey rock wall with grass on top)
```

- [x] #064 생성·저장 완료

## #065 · 소품 시트 — town

- **저장 이름**: `tmp/world-src/props/props-town.png` (1536×1024 (4×3), P0)
- **스레드**: ↪ **이어서** — `T-PROPS-1` (이 스레드의 첫 스텝 #062을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 props-trees 결과: `tmp/world-src/props/props-trees.png`
- **검수 체크**: 12칸에 오브젝트 1개씩, 각 칸 중앙·80% 크기, 바닥 그림자/배경 잔여물 없음, 칸 경계선 없음
- **변환**: `pnpm convert:world-art -- props town`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Create a pixel-art prop sheet for a top-down 3/4-view RPG on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows (12 cells, each 384x341), exactly one object per cell, centred and filling about 80% of its cell. Transparent background (or flat #FF00FF), no ground plane, NO cast shadow on the ground, light from the top-left, no cell borders or grid lines, at least 8% empty margin inside every cell, no text or letters.
Theme: village street furniture in warm wood, iron and mint-green accents; NO readable text on any sign
Objects in order (left to right, top to bottom):
1) iron street lamp post, 2) wooden park bench facing the viewer, 3) wooden park bench seen from the side, 4) wooden arrow signpost (blank boards), 5) large community notice board with pinned blank papers, 6) village mailbox on a post, 7) metal trash bin, 8) flagpole with a mint flag showing a text-free sprout shield, 9) wooden planter box with flowers, 10) small market stall with fruit crates, 11) bicycle rack with two bikes, 12) doormat (top-down, flat)
```

- [x] #065 생성·저장 완료

## #066 · 소품 시트 — football

- **저장 이름**: `tmp/world-src/props/props-football.png` (1536×1024 (4×3), P0)
- **스레드**: ↪ **이어서** — `T-PROPS-1` (이 스레드의 첫 스텝 #062을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 props-trees 결과: `tmp/world-src/props/props-trees.png`
- **검수 체크**: 12칸에 오브젝트 1개씩, 각 칸 중앙·80% 크기, 바닥 그림자/배경 잔여물 없음, 칸 경계선 없음
- **변환**: `pnpm convert:world-art -- props football`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Create a pixel-art prop sheet for a top-down 3/4-view RPG on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows (12 cells, each 384x341), exactly one object per cell, centred and filling about 80% of its cell. Transparent background (or flat #FF00FF), no ground plane, NO cast shadow on the ground, light from the top-left, no cell borders or grid lines, at least 8% empty margin inside every cell, no text or letters.
Theme: football training and stadium props: mint and white team colours, bright orange cones
Objects in order (left to right, top to bottom):
1) football goal seen from the side with the net opening facing right, 2) football goal seen from the front, 3) corner flag, 4) single orange cone, 5) a row of three orange cones, 6) training hurdle, 7) a classic black-and-white football, 8) blank LED advertising board (a wide dark panel, no text), 9) small stadium bleacher block with mint seats, 10) team dugout bench with a roof, 11) free-kick wall of three training mannequins, 12) a mesh bag full of footballs
```

- [x] #066 생성·저장 완료

## #067 · 소품 시트 — collect

- **저장 이름**: `tmp/world-src/props/props-collect.png` (1536×1024 (4×3), P0)
- **스레드**: ↪ **이어서** — `T-PROPS-1` (이 스레드의 첫 스텝 #062을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 props-trees 결과: `tmp/world-src/props/props-trees.png`
- **검수 체크**: 12칸에 오브젝트 1개씩, 각 칸 중앙·80% 크기, 바닥 그림자/배경 잔여물 없음, 칸 경계선 없음
- **변환**: `pnpm convert:world-art -- props collect`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Create a pixel-art prop sheet for a top-down 3/4-view RPG on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows (12 cells, each 384x341), exactly one object per cell, centred and filling about 80% of its cell. Transparent background (or flat #FF00FF), no ground plane, NO cast shadow on the ground, light from the top-left, no cell borders or grid lines, at least 8% empty margin inside every cell, no text or letters.
Theme: glowing collectibles and mission items with a clear golden highlight so they read from far away
Objects in order (left to right, top to bottom):
1-3) a mint-and-gold grass-blade crystal shard (the 'grass shard'), pulse animation frames 1 to 3 with growing glow, 4-6) a golden football, animation frames 1 to 3 with a sparkle moving across, 7) a glowing blue jellyfish lantern (colour A), 8) jellyfish lantern colour B (pink), 9) jellyfish lantern colour C (lavender), 10) a cardboard parcel with a blue tape, 11) a cardboard parcel with a red tape, 12) a cardboard parcel with a green tape
```

- [x] #067 생성·저장 완료

---

# Phase 4 — P0 건물·실내

건물을 먼저 모두 만들고 실내를 만든다(실내가 같은 건물 외관을 참조). `T-BLD-1`/`T-INT-1`은 Phase 1에서 연 스레드에서 이어서.

## #068 · 건물 — house-bboringirl (최종 256×192px)

- **저장 이름**: `tmp/world-src/buildings/bld-house-bboringirl.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-BLD-1` (이 스레드의 첫 스텝 #009을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 카드 테마 색·모티프 참고: `src/web/assets/toty-cards/bboringirl-background.webp`
- **검수 체크**: 문이 하단 중앙, 배경 투명/마젠타 단색, 지면·그림자 없음, 글자 없음
- **변환**: `pnpm convert:world-art -- buildings house-bboringirl`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
The attached card artwork (if provided) is only a colour and motif reference for the theme; do not copy its characters or layout.

Draw a single building for a top-down 3/4-view pixel-art RPG (classic Pokemon/Zelda camera: you see the front facade and the roof from above at about 45 degrees). a gunmetal workshop: grey steel building with red neon strips, a big roll-up garage door, exposed pipes, a satellite dish, circuit-board patterned panels and a small robot arm on the roof
Rules: the door is at the bottom centre of the front facade with a small step; transparent background (or flat #FF00FF); NO ground, NO cast shadow, NO grass around the base; the building fills about 90% of the canvas width and sits on the bottom edge; light from the top-left; no text or letters anywhere (signs and boards are blank shapes, emblems are text-free); crisp pixel outline, three-step shading.
Canvas: 1536×1024.
```

- [x] #068 생성·저장 완료

## #069 · 건물 — house-sjh4018 (최종 320×288px)

- **저장 이름**: `tmp/world-src/buildings/bld-house-sjh4018.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-BLD-1` (이 스레드의 첫 스텝 #009을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 카드 테마 색·모티프 참고: `src/web/assets/toty-cards/sjh4018-background.webp`
- **검수 체크**: 문이 하단 중앙, 배경 투명/마젠타 단색, 지면·그림자 없음, 글자 없음
- **변환**: `pnpm convert:world-art -- buildings house-sjh4018`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
The attached card artwork (if provided) is only a colour and motif reference for the theme; do not copy its characters or layout.

Draw a single building for a top-down 3/4-view pixel-art RPG (classic Pokemon/Zelda camera: you see the front facade and the roof from above at about 45 degrees). a small cloud fortress: white and sky-blue stone keep with round windows and tiny turrets, sitting on top of fluffy clouds, a blue shield emblem (text-free) above the arched door, banners, sunlit
Rules: the door is at the bottom centre of the front facade with a small step; transparent background (or flat #FF00FF); NO ground, NO cast shadow, NO grass around the base; the building fills about 90% of the canvas width and sits on the bottom edge; light from the top-left; no text or letters anywhere (signs and boards are blank shapes, emblems are text-free); crisp pixel outline, three-step shading.
Canvas: 1536×1024.
```

- [x] #069 생성·저장 완료

## #070 · 건물 — house-doormomo (최종 224×352px)

- **저장 이름**: `tmp/world-src/buildings/bld-house-doormomo.png` (1024×1536, P0)
- **스레드**: ↪ **이어서** — `T-BLD-1` (이 스레드의 첫 스텝 #009을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 카드 테마 색·모티프 참고: `src/web/assets/toty-cards/doormomo-background.webp`
- **검수 체크**: 문이 하단 중앙, 배경 투명/마젠타 단색, 지면·그림자 없음, 글자 없음
- **변환**: `pnpm convert:world-art -- buildings house-doormomo`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
The attached card artwork (if provided) is only a colour and motif reference for the theme; do not copy its characters or layout.

Draw a single building for a top-down 3/4-view pixel-art RPG (classic Pokemon/Zelda camera: you see the front facade and the roof from above at about 45 degrees). a tall stone rune tower, violet roof and a glowing crystal at the top, glowing violet abstract rune symbols on the walls, a spiral outside staircase, an arched door at the base, mystical and strategic
Rules: the door is at the bottom centre of the front facade with a small step; transparent background (or flat #FF00FF); NO ground, NO cast shadow, NO grass around the base; the building fills about 90% of the canvas width and sits on the bottom edge; light from the top-left; no text or letters anywhere (signs and boards are blank shapes, emblems are text-free); crisp pixel outline, three-step shading.
Canvas: 1024×1536.
```

- [x] #070 생성·저장 완료

## #071 · 건물 — house-hachi97 (최종 256×224px)

- **저장 이름**: `tmp/world-src/buildings/bld-house-hachi97.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-BLD-1` (이 스레드의 첫 스텝 #009을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 카드 테마 색·모티프 참고: `src/web/assets/toty-cards/hachi97-background.webp`
- **검수 체크**: 문이 하단 중앙, 배경 투명/마젠타 단색, 지면·그림자 없음, 글자 없음
- **변환**: `pnpm convert:world-art -- buildings house-hachi97`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
The attached card artwork (if provided) is only a colour and motif reference for the theme; do not copy its characters or layout.

Draw a single building for a top-down 3/4-view pixel-art RPG (classic Pokemon/Zelda camera: you see the front facade and the roof from above at about 45 degrees). a small house on a grassy hill with a red-and-gold roof of dragon-scale tiles, a golden dragon statue coiled around the chimney, a round door with a dragon-eye window, gold trim
Rules: the door is at the bottom centre of the front facade with a small step; transparent background (or flat #FF00FF); NO ground, NO cast shadow, NO grass around the base; the building fills about 90% of the canvas width and sits on the bottom edge; light from the top-left; no text or letters anywhere (signs and boards are blank shapes, emblems are text-free); crisp pixel outline, three-step shading.
Canvas: 1536×1024.
```

- [x] #071 생성·저장 완료

## #072 · 건물 — house-kaksjak0730 (최종 256×256px)

- **저장 이름**: `tmp/world-src/buildings/bld-house-kaksjak0730.png` (1024×1024, P0)
- **스레드**: ↪ **이어서** — `T-BLD-1` (이 스레드의 첫 스텝 #009을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 카드 테마 색·모티프 참고: `src/web/assets/toty-cards/kaksjak0730-background.webp`
- **검수 체크**: 문이 하단 중앙, 배경 투명/마젠타 단색, 지면·그림자 없음, 글자 없음
- **변환**: `pnpm convert:world-art -- buildings house-kaksjak0730`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
The attached card artwork (if provided) is only a colour and motif reference for the theme; do not copy its characters or layout.

Draw a single building for a top-down 3/4-view pixel-art RPG (classic Pokemon/Zelda camera: you see the front facade and the roof from above at about 45 degrees). a starlit observatory: black-navy dome with sapphire star patterns and an open slit with a telescope pointing up, a round brick base with a round door, glowing star lanterns
Rules: the door is at the bottom centre of the front facade with a small step; transparent background (or flat #FF00FF); NO ground, NO cast shadow, NO grass around the base; the building fills about 90% of the canvas width and sits on the bottom edge; light from the top-left; no text or letters anywhere (signs and boards are blank shapes, emblems are text-free); crisp pixel outline, three-step shading.
Canvas: 1024×1024.
```

- [x] #072 생성·저장 완료

## #073 · 건물 — house-ju010228 (최종 256×192px)

- **저장 이름**: `tmp/world-src/buildings/bld-house-ju010228.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-BLD-1` (이 스레드의 첫 스텝 #009을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 카드 테마 색·모티프 참고: `src/web/assets/toty-cards/ju010228-background.webp`
- **검수 체크**: 문이 하단 중앙, 배경 투명/마젠타 단색, 지면·그림자 없음, 글자 없음
- **변환**: `pnpm convert:world-art -- buildings house-ju010228`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
The attached card artwork (if provided) is only a colour and motif reference for the theme; do not copy its characters or layout.

Draw a single building for a top-down 3/4-view pixel-art RPG (classic Pokemon/Zelda camera: you see the front facade and the roof from above at about 45 degrees). a spring garden cottage-greenhouse with a lime-green wooden frame and glass panels, vines and flower pots all around, blooming pink and yellow flowers, a green thatched roof, cheerful
Rules: the door is at the bottom centre of the front facade with a small step; transparent background (or flat #FF00FF); NO ground, NO cast shadow, NO grass around the base; the building fills about 90% of the canvas width and sits on the bottom edge; light from the top-left; no text or letters anywhere (signs and boards are blank shapes, emblems are text-free); crisp pixel outline, three-step shading.
Canvas: 1536×1024.
```

- [x] #073 생성·저장 완료

## #074 · 건물 — house-haepalin (최종 224×192px)

- **저장 이름**: `tmp/world-src/buildings/bld-house-haepalin.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-BLD-1` (이 스레드의 첫 스텝 #009을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 카드 테마 색·모티프 참고: `src/web/assets/toty-cards/haepalin-background.webp`
- **검수 체크**: 문이 하단 중앙, 배경 투명/마젠타 단색, 지면·그림자 없음, 글자 없음
- **변환**: `pnpm convert:world-art -- buildings house-haepalin`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
The attached card artwork (if provided) is only a colour and motif reference for the theme; do not copy its characters or layout.

Draw a single building for a top-down 3/4-view pixel-art RPG (classic Pokemon/Zelda camera: you see the front facade and the roof from above at about 45 degrees). a lavender wooden stilt house over water: the roof is shaped like a jellyfish bell, glowing jellyfish-shaped lanterns hang around, a short pier with steps at the front, soft glow
Rules: the door is at the bottom centre of the front facade with a small step; transparent background (or flat #FF00FF); NO ground, NO cast shadow, NO grass around the base; the building fills about 90% of the canvas width and sits on the bottom edge; light from the top-left; no text or letters anywhere (signs and boards are blank shapes, emblems are text-free); crisp pixel outline, three-step shading.
Canvas: 1536×1024.
```

- [x] #074 생성·저장 완료

## #075 · 건물 — house-tleod1818 (최종 256×192px)

- **저장 이름**: `tmp/world-src/buildings/bld-house-tleod1818.png` (1536×1024, P0)
- **스레드**: 🆕 **새 스레드 시작** — `T-BLD-2`
- **레퍼런스 첨부**:
  - (선택) 카드 테마 색·모티프 참고: `src/web/assets/toty-cards/tleod1818-background.webp`
  - (선택) 톤 통일용 승인된 건물 1장: `tmp/world-src/buildings/bld-house-janine95kim.png`
- **검수 체크**: 문이 하단 중앙, 배경 투명/마젠타 단색, 지면·그림자 없음, 글자 없음
- **변환**: `pnpm convert:world-art -- buildings house-tleod1818`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
The attached card artwork (if provided) is only a colour and motif reference for the theme; do not copy its characters or layout.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Draw a single building for a top-down 3/4-view pixel-art RPG (classic Pokemon/Zelda camera: you see the front facade and the roof from above at about 45 degrees). a lightning delivery depot: navy-blue building with emerald stripes and a lightning-bolt sign (no text), a wide parcel counter window, stacked parcels, a bicycle and a small scooter parked outside, a roof antenna
Rules: the door is at the bottom centre of the front facade with a small step; transparent background (or flat #FF00FF); NO ground, NO cast shadow, NO grass around the base; the building fills about 90% of the canvas width and sits on the bottom edge; light from the top-left; no text or letters anywhere (signs and boards are blank shapes, emblems are text-free); crisp pixel outline, three-step shading.
Canvas: 1536×1024.
```

- [x] #075 생성·저장 완료

## #076 · 건물 — house-tdnlamuron (최종 224×192px)

- **저장 이름**: `tmp/world-src/buildings/bld-house-tdnlamuron.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-BLD-2` (이 스레드의 첫 스텝 #075을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 카드 테마 색·모티프 참고: `src/web/assets/toty-cards/tdnlamuron-background.webp`
  - (선택) 톤 통일용 승인된 건물 1장: `tmp/world-src/buildings/bld-house-janine95kim.png`
- **검수 체크**: 문이 하단 중앙, 배경 투명/마젠타 단색, 지면·그림자 없음, 글자 없음
- **변환**: `pnpm convert:world-art -- buildings house-tdnlamuron`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
The attached card artwork (if provided) is only a colour and motif reference for the theme; do not copy its characters or layout.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Draw a single building for a top-down 3/4-view pixel-art RPG (classic Pokemon/Zelda camera: you see the front facade and the roof from above at about 45 degrees). a lava training house: apricot-orange walls on dark rock, glowing lava cracks beside it, an iron gate, training dummies out front, a chimney with a flame torch
Rules: the door is at the bottom centre of the front facade with a small step; transparent background (or flat #FF00FF); NO ground, NO cast shadow, NO grass around the base; the building fills about 90% of the canvas width and sits on the bottom edge; light from the top-left; no text or letters anywhere (signs and boards are blank shapes, emblems are text-free); crisp pixel outline, three-step shading.
Canvas: 1536×1024.
```

- [x] #076 생성·저장 완료

## #077 · 건물 — house-lina0108 (최종 256×192px)

- **저장 이름**: `tmp/world-src/buildings/bld-house-lina0108.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-BLD-2` (이 스레드의 첫 스텝 #075을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 카드 테마 색·모티프 참고: `src/web/assets/toty-cards/lina0108-background.webp`
  - (선택) 톤 통일용 승인된 건물 1장: `tmp/world-src/buildings/bld-house-janine95kim.png`
- **검수 체크**: 문이 하단 중앙, 배경 투명/마젠타 단색, 지면·그림자 없음, 글자 없음
- **변환**: `pnpm convert:world-art -- buildings house-lina0108`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
The attached card artwork (if provided) is only a colour and motif reference for the theme; do not copy its characters or layout.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Draw a single building for a top-down 3/4-view pixel-art RPG (classic Pokemon/Zelda camera: you see the front facade and the roof from above at about 45 degrees). a cosy cottage under a big blossoming cherry tree, pink tiled roof, cream walls, petals falling, paper lanterns hanging from the eaves, a wooden porch with a small table and a sketchbook
Rules: the door is at the bottom centre of the front facade with a small step; transparent background (or flat #FF00FF); NO ground, NO cast shadow, NO grass around the base; the building fills about 90% of the canvas width and sits on the bottom edge; light from the top-left; no text or letters anywhere (signs and boards are blank shapes, emblems are text-free); crisp pixel outline, three-step shading.
Canvas: 1536×1024.
```

- [x] #077 생성·저장 완료

## #078 · 건물 — clubhouse (최종 384×256px)

- **저장 이름**: `tmp/world-src/buildings/bld-clubhouse.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-BLD-2` (이 스레드의 첫 스텝 #075을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 승인된 건물 1장: `tmp/world-src/buildings/bld-house-janine95kim.png`
- **검수 체크**: 문이 하단 중앙, 배경 투명/마젠타 단색, 지면·그림자 없음, 글자 없음
- **변환**: `pnpm convert:world-art -- buildings clubhouse`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Draw a single building for a top-down 3/4-view pixel-art RPG (classic Pokemon/Zelda camera: you see the front facade and the roof from above at about 45 degrees). a modern two-storey football clubhouse with white walls and a mint-green roof, a big glass entrance with a small canopy, blank stone sign plate above the door, trophy display windows, mint flags with a text-free sprout shield, a football-shaped weathervane on the roof, warm and inviting
Rules: the door is at the bottom centre of the front facade with a small step; transparent background (or flat #FF00FF); NO ground, NO cast shadow, NO grass around the base; the building fills about 90% of the canvas width and sits on the bottom edge; light from the top-left; no text or letters anywhere (signs and boards are blank shapes, emblems are text-free); crisp pixel outline, three-step shading.
Canvas: 1536×1024.
```

- [x] #078 생성·저장 완료

## #079 · 건물 — stadium (최종 832×512px)

- **저장 이름**: `tmp/world-src/buildings/bld-stadium.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-BLD-2` (이 스레드의 첫 스텝 #075을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 승인된 건물 1장: `tmp/world-src/buildings/bld-house-janine95kim.png`
- **검수 체크**: 문이 하단 중앙, 배경 투명/마젠타 단색, 지면·그림자 없음, 글자 없음
- **변환**: `pnpm convert:world-art -- buildings stadium`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Draw a single building for a top-down 3/4-view pixel-art RPG (classic Pokemon/Zelda camera: you see the front facade and the roof from above at about 45 degrees). a compact football stadium seen from the front at 3/4 view, curved white-and-mint grandstand roof, four floodlight towers, a big arched north gate with a dark tunnel at the bottom centre, mint banners with a text-free sprout shield, a blank scoreboard on top, golden glow leaking over the wall from the pitch
Rules: the door is at the bottom centre of the front facade with a small step; transparent background (or flat #FF00FF); NO ground, NO cast shadow, NO grass around the base; the building fills about 90% of the canvas width and sits on the bottom edge; light from the top-left; no text or letters anywhere (signs and boards are blank shapes, emblems are text-free); crisp pixel outline, three-step shading.
Canvas: 1536×1024.
```

- [x] #079 생성·저장 완료

## #080 · 건물 — fountain (최종 192×160px)

- **저장 이름**: `tmp/world-src/buildings/bld-fountain.png` (1024×1024, P0)
- **스레드**: ↪ **이어서** — `T-BLD-2` (이 스레드의 첫 스텝 #075을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 승인된 건물 1장: `tmp/world-src/buildings/bld-house-janine95kim.png`
- **검수 체크**: 문이 하단 중앙, 배경 투명/마젠타 단색, 지면·그림자 없음, 글자 없음
- **변환**: `pnpm convert:world-art -- buildings fountain`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Draw a single building for a top-down 3/4-view pixel-art RPG (classic Pokemon/Zelda camera: you see the front facade and the roof from above at about 45 degrees). a circular stone plaza fountain in cream and mint with a large statue of a small grass fairy holding a football up on top, arcs of water, a few petals floating; the door rule does not apply
Rules: the door is at the bottom centre of the front facade with a small step; transparent background (or flat #FF00FF); NO ground, NO cast shadow, NO grass around the base; the building fills about 90% of the canvas width and sits on the bottom edge; light from the top-left; no text or letters anywhere (signs and boards are blank shapes, emblems are text-free); crisp pixel outline, three-step shading.
Canvas: 1024×1024.
```

- [x] #080 생성·저장 완료

## #081 · 건물 — store (최종 224×160px)

- **저장 이름**: `tmp/world-src/buildings/bld-store.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-BLD-2` (이 스레드의 첫 스텝 #075을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 승인된 건물 1장: `tmp/world-src/buildings/bld-house-janine95kim.png`
- **검수 체크**: 문이 하단 중앙, 배경 투명/마젠타 단색, 지면·그림자 없음, 글자 없음
- **변환**: `pnpm convert:world-art -- buildings store`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Draw a single building for a top-down 3/4-view pixel-art RPG (classic Pokemon/Zelda camera: you see the front facade and the roof from above at about 45 degrees). a small convenience store: white and mint building with a striped awning, a big front window with shelves visible, a blank hanging sign, a vending machine and crates outside
Rules: the door is at the bottom centre of the front facade with a small step; transparent background (or flat #FF00FF); NO ground, NO cast shadow, NO grass around the base; the building fills about 90% of the canvas width and sits on the bottom edge; light from the top-left; no text or letters anywhere (signs and boards are blank shapes, emblems are text-free); crisp pixel outline, three-step shading.
Canvas: 1536×1024.
```

- [x] #081 생성·저장 완료

## #082 · 실내 — house-bboringirl (최종 640×384)

- **저장 이름**: `tmp/world-src/interiors/int-house-bboringirl.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-INT-1` (이 스레드의 첫 스텝 #010을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 같은 집 외관: `tmp/world-src/buildings/bld-house-bboringirl.png`
- **검수 체크**: 문(하단 중앙)·열린 바닥 공간 확보, 캐릭터 없음, 글자 없음, 가구 배치가 03 문서 조사 포인트와 대체로 일치
- **변환**: `pnpm convert:world-art -- interiors house-bboringirl`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
The attached image (if provided) is the exterior or a sibling room of this place: match its colours, materials and mood.

Draw a single-screen interior of a gunmetal electronics workshop lit by red neon for a top-down 3/4-view pixel-art RPG (classic Pokemon/Stardew interior: cutaway room with the back wall and side walls visible, the floor seen from about 45 degrees). Landscape 1536x1024; the room fills the frame edge to edge with a thin dark wall border. Keep a clear open floor area in the lower-middle for walking and a door opening with a small doormat at the bottom centre. A soldering workbench at the back left with tools; three glowing monitors at the back right (one showing a retro pixel game as abstract blocks); a parts drawer cabinet at the left wall; a cot in the far right corner; cables and circuit patterns on the floor
Rules: no characters, no people; no readable text or letters anywhere (papers, boards and screens show abstract shapes); light from the top-left; crisp pixel outline, three-step shading; warm and cosy. Furniture is placed as described (left/right are from the viewer's view).
```

- [x] #082 생성·저장 완료

## #083 · 실내 — house-sjh4018 (최종 640×384)

- **저장 이름**: `tmp/world-src/interiors/int-house-sjh4018.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-INT-1` (이 스레드의 첫 스텝 #010을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 같은 집 외관: `tmp/world-src/buildings/bld-house-sjh4018.png`
- **검수 체크**: 문(하단 중앙)·열린 바닥 공간 확보, 캐릭터 없음, 글자 없음, 가구 배치가 03 문서 조사 포인트와 대체로 일치
- **변환**: `pnpm convert:world-art -- interiors house-sjh4018`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
The attached image (if provided) is the exterior or a sibling room of this place: match its colours, materials and mood.

Draw a single-screen interior of the cosy interior of a small cloud fortress, all pale stone and soft clouds for a top-down 3/4-view pixel-art RPG (classic Pokemon/Stardew interior: cutaway room with the back wall and side walls visible, the floor seen from about 45 degrees). Landscape 1536x1024; the room fills the frame edge to edge with a thin dark wall border. Keep a clear open floor area in the lower-middle for walking and a door opening with a small doormat at the bottom centre. A shield emblem on the back wall centre; a round window at the back left showing sky; a big comfy armchair at the right; a fluffy cloud-shaped sofa on the left; cloud wisps drifting near the floor
Rules: no characters, no people; no readable text or letters anywhere (papers, boards and screens show abstract shapes); light from the top-left; crisp pixel outline, three-step shading; warm and cosy. Furniture is placed as described (left/right are from the viewer's view).
```

- [x] #083 생성·저장 완료

## #084 · 실내 — house-doormomo (최종 640×384)

- **저장 이름**: `tmp/world-src/interiors/int-house-doormomo.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-INT-1` (이 스레드의 첫 스텝 #010을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 같은 집 외관: `tmp/world-src/buildings/bld-house-doormomo.png`
- **검수 체크**: 문(하단 중앙)·열린 바닥 공간 확보, 캐릭터 없음, 글자 없음, 가구 배치가 03 문서 조사 포인트와 대체로 일치
- **변환**: `pnpm convert:world-art -- interiors house-doormomo`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
The attached image (if provided) is the exterior or a sibling room of this place: match its colours, materials and mood.

Draw a single-screen interior of a violet rune scholar's study in a tower for a top-down 3/4-view pixel-art RPG (classic Pokemon/Stardew interior: cutaway room with the back wall and side walls visible, the floor seen from about 45 degrees). Landscape 1536x1024; the room fills the frame edge to edge with a thin dark wall border. Keep a clear open floor area in the lower-middle for walking and a door opening with a small doormat at the bottom centre. A tactics board full of abstract arrows in the back centre; a bookshelf with glowing rune books at the back left; a crystal ball on a stand at the right; a desk with scrolls at the left; violet glow
Rules: no characters, no people; no readable text or letters anywhere (papers, boards and screens show abstract shapes); light from the top-left; crisp pixel outline, three-step shading; warm and cosy. Furniture is placed as described (left/right are from the viewer's view).
```

- [x] #084 생성·저장 완료

## #085 · 실내 — house-hachi97 (최종 640×384)

- **저장 이름**: `tmp/world-src/interiors/int-house-hachi97.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-INT-1` (이 스레드의 첫 스텝 #010을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 같은 집 외관: `tmp/world-src/buildings/bld-house-hachi97.png`
- **검수 체크**: 문(하단 중앙)·열린 바닥 공간 확보, 캐릭터 없음, 글자 없음, 가구 배치가 03 문서 조사 포인트와 대체로 일치
- **변환**: `pnpm convert:world-art -- interiors house-hachi97`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
The attached image (if provided) is the exterior or a sibling room of this place: match its colours, materials and mood.

Draw a single-screen interior of a golden dragon-themed home for a top-down 3/4-view pixel-art RPG (classic Pokemon/Stardew interior: cutaway room with the back wall and side walls visible, the floor seen from about 45 degrees). Landscape 1536x1024; the room fills the frame edge to edge with a thin dark wall border. Keep a clear open floor area in the lower-middle for walking and a door opening with a small doormat at the bottom centre. A display of golden dragon eggs on a stand at the back right; framed fan art (abstract) on the back left; a weapon rack with flags at the back centre; red-and-gold carpet in the middle; a low table
Rules: no characters, no people; no readable text or letters anywhere (papers, boards and screens show abstract shapes); light from the top-left; crisp pixel outline, three-step shading; warm and cosy. Furniture is placed as described (left/right are from the viewer's view).
```

- [x] #085 생성·저장 완료

## #086 · 실내 — house-kaksjak0730 (최종 640×384)

- **저장 이름**: `tmp/world-src/interiors/int-house-kaksjak0730.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-INT-1` (이 스레드의 첫 스텝 #010을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 같은 집 외관: `tmp/world-src/buildings/bld-house-kaksjak0730.png`
- **검수 체크**: 문(하단 중앙)·열린 바닥 공간 확보, 캐릭터 없음, 글자 없음, 가구 배치가 03 문서 조사 포인트와 대체로 일치
- **변환**: `pnpm convert:world-art -- interiors house-kaksjak0730`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
The attached image (if provided) is the exterior or a sibling room of this place: match its colours, materials and mood.

Draw a single-screen interior of the interior of a starlit observatory dome for a top-down 3/4-view pixel-art RPG (classic Pokemon/Stardew interior: cutaway room with the back wall and side walls visible, the floor seen from about 45 degrees). Landscape 1536x1024; the room fills the frame edge to edge with a thin dark wall border. Keep a clear open floor area in the lower-middle for walking and a door opening with a small doormat at the bottom centre. A large brass telescope pointing at the open dome slit in the centre; a star-map table at the left; a potted grass plant at the bottom right; a constellation pattern on the ceiling edge; deep blue and sapphire tones
Rules: no characters, no people; no readable text or letters anywhere (papers, boards and screens show abstract shapes); light from the top-left; crisp pixel outline, three-step shading; warm and cosy. Furniture is placed as described (left/right are from the viewer's view).
```

- [x] #086 생성·저장 완료

## #087 · 실내 — house-ju010228 (최종 640×384)

- **저장 이름**: `tmp/world-src/interiors/int-house-ju010228.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-INT-1` (이 스레드의 첫 스텝 #010을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 같은 집 외관: `tmp/world-src/buildings/bld-house-ju010228.png`
- **검수 체크**: 문(하단 중앙)·열린 바닥 공간 확보, 캐릭터 없음, 글자 없음, 가구 배치가 03 문서 조사 포인트와 대체로 일치
- **변환**: `pnpm convert:world-art -- interiors house-ju010228`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
The attached image (if provided) is the exterior or a sibling room of this place: match its colours, materials and mood.

Draw a single-screen interior of a bright spring greenhouse home full of plants for a top-down 3/4-view pixel-art RPG (classic Pokemon/Stardew interior: cutaway room with the back wall and side walls visible, the floor seen from about 45 degrees). Landscape 1536x1024; the room fills the frame edge to edge with a thin dark wall border. Keep a clear open floor area in the lower-middle for walking and a door opening with a small doormat at the bottom centre. Potted plants along the left wall; a goal-record board on the back right wall (abstract tally marks); a watering can at the bottom right; vines climbing the glass walls; a bed and a small table; lime and pink tones
Rules: no characters, no people; no readable text or letters anywhere (papers, boards and screens show abstract shapes); light from the top-left; crisp pixel outline, three-step shading; warm and cosy. Furniture is placed as described (left/right are from the viewer's view).
```

- [x] #087 생성·저장 완료

## #088 · 실내 — house-haepalin (최종 640×384)

- **저장 이름**: `tmp/world-src/interiors/int-house-haepalin.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-INT-1` (이 스레드의 첫 스텝 #010을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 같은 집 외관: `tmp/world-src/buildings/bld-house-haepalin.png`
- **검수 체크**: 문(하단 중앙)·열린 바닥 공간 확보, 캐릭터 없음, 글자 없음, 가구 배치가 03 문서 조사 포인트와 대체로 일치
- **변환**: `pnpm convert:world-art -- interiors house-haepalin`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
The attached image (if provided) is the exterior or a sibling room of this place: match its colours, materials and mood.

Draw a single-screen interior of a lavender stilt house with water visible through the floor edges for a top-down 3/4-view pixel-art RPG (classic Pokemon/Stardew interior: cutaway room with the back wall and side walls visible, the floor seen from about 45 degrees). Landscape 1536x1024; the room fills the frame edge to edge with a thin dark wall border. Keep a clear open floor area in the lower-middle for walking and a door opening with a small doormat at the bottom centre. A big glowing jellyfish aquarium in the back centre; a window with ripples at the back left; a shell collection shelf at the right; soft floating light orbs; a fluffy rug
Rules: no characters, no people; no readable text or letters anywhere (papers, boards and screens show abstract shapes); light from the top-left; crisp pixel outline, three-step shading; warm and cosy. Furniture is placed as described (left/right are from the viewer's view).
```

- [x] #088 생성·저장 완료

## #089 · 실내 — house-tleod1818 (최종 640×384)

- **저장 이름**: `tmp/world-src/interiors/int-house-tleod1818.png` (1536×1024, P0)
- **스레드**: 🆕 **새 스레드 시작** — `T-INT-2`
- **레퍼런스 첨부**:
  - (선택) 같은 집 외관: `tmp/world-src/buildings/bld-house-tleod1818.png`
  - (선택) 톤 통일용 승인된 실내 1장: `tmp/world-src/interiors/int-house-janine95kim.png`
- **검수 체크**: 문(하단 중앙)·열린 바닥 공간 확보, 캐릭터 없음, 글자 없음, 가구 배치가 03 문서 조사 포인트와 대체로 일치
- **변환**: `pnpm convert:world-art -- interiors house-tleod1818`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
The attached image (if provided) is the exterior or a sibling room of this place: match its colours, materials and mood.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Draw a single-screen interior of a delivery depot office with parcel shelves for a top-down 3/4-view pixel-art RPG (classic Pokemon/Stardew interior: cutaway room with the back wall and side walls visible, the floor seen from about 45 degrees). Landscape 1536x1024; the room fills the frame edge to edge with a thin dark wall border. Keep a clear open floor area in the lower-middle for walking and a door opening with a small doormat at the bottom centre. Shelves stacked with parcels at the back left; a lightning-bolt emblem on the back right wall (text-free); a bicycle at the bottom right; a sorting table in the middle; navy and emerald tones
Rules: no characters, no people; no readable text or letters anywhere (papers, boards and screens show abstract shapes); light from the top-left; crisp pixel outline, three-step shading; warm and cosy. Furniture is placed as described (left/right are from the viewer's view).
```

- [x] #089 생성·저장 완료

## #090 · 실내 — house-tdnlamuron (최종 640×384)

- **저장 이름**: `tmp/world-src/interiors/int-house-tdnlamuron.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-INT-2` (이 스레드의 첫 스텝 #089을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 같은 집 외관: `tmp/world-src/buildings/bld-house-tdnlamuron.png`
  - (선택) 톤 통일용 승인된 실내 1장: `tmp/world-src/interiors/int-house-janine95kim.png`
- **검수 체크**: 문(하단 중앙)·열린 바닥 공간 확보, 캐릭터 없음, 글자 없음, 가구 배치가 03 문서 조사 포인트와 대체로 일치
- **변환**: `pnpm convert:world-art -- interiors house-tdnlamuron`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
The attached image (if provided) is the exterior or a sibling room of this place: match its colours, materials and mood.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Draw a single-screen interior of a training house with warm apricot lighting for a top-down 3/4-view pixel-art RPG (classic Pokemon/Stardew interior: cutaway room with the back wall and side walls visible, the floor seen from about 45 degrees). Landscape 1536x1024; the room fills the frame edge to edge with a thin dark wall border. Keep a clear open floor area in the lower-middle for walking and a door opening with a small doormat at the bottom centre. A training notebook desk at the left; a lava-view window at the back right; a stack of orange cones at the bottom right; a punching mat; trophies on a shelf; orange and dark rock tones
Rules: no characters, no people; no readable text or letters anywhere (papers, boards and screens show abstract shapes); light from the top-left; crisp pixel outline, three-step shading; warm and cosy. Furniture is placed as described (left/right are from the viewer's view).
```

- [x] #090 생성·저장 완료

## #091 · 실내 — house-lina0108 (최종 640×384)

- **저장 이름**: `tmp/world-src/interiors/int-house-lina0108.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-INT-2` (이 스레드의 첫 스텝 #089을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 같은 집 외관: `tmp/world-src/buildings/bld-house-lina0108.png`
  - (선택) 톤 통일용 승인된 실내 1장: `tmp/world-src/interiors/int-house-janine95kim.png`
- **검수 체크**: 문(하단 중앙)·열린 바닥 공간 확보, 캐릭터 없음, 글자 없음, 가구 배치가 03 문서 조사 포인트와 대체로 일치
- **변환**: `pnpm convert:world-art -- interiors house-lina0108`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
The attached image (if provided) is the exterior or a sibling room of this place: match its colours, materials and mood.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Draw a single-screen interior of a pink cherry-blossom cottage room for a top-down 3/4-view pixel-art RPG (classic Pokemon/Stardew interior: cutaway room with the back wall and side walls visible, the floor seen from about 45 degrees). Landscape 1536x1024; the room fills the frame edge to edge with a thin dark wall border. Keep a clear open floor area in the lower-middle for walking and a door opening with a small doormat at the bottom centre. A sketchbook on a table at the left; a vase of cherry blossoms at the back right; a coat rack at the bottom right; a pink bed with drawings pinned above; a round rug
Rules: no characters, no people; no readable text or letters anywhere (papers, boards and screens show abstract shapes); light from the top-left; crisp pixel outline, three-step shading; warm and cosy. Furniture is placed as described (left/right are from the viewer's view).
```

- [x] #091 생성·저장 완료

## #092 · 실내 — clubhouse-lobby (최종 640×384)

- **저장 이름**: `tmp/world-src/interiors/int-clubhouse-lobby.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-INT-2` (이 스레드의 첫 스텝 #089을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 클럽하우스 외관: `tmp/world-src/buildings/bld-clubhouse.png`
  - (선택) 톤 통일용 승인된 실내 1장: `tmp/world-src/interiors/int-house-janine95kim.png`
- **검수 체크**: 문(하단 중앙)·열린 바닥 공간 확보, 캐릭터 없음, 글자 없음, 가구 배치가 03 문서 조사 포인트와 대체로 일치
- **변환**: `pnpm convert:world-art -- interiors clubhouse-lobby`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
The attached image (if provided) is the exterior or a sibling room of this place: match its colours, materials and mood.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Draw a single-screen interior of the lobby of a modern football clubhouse for a top-down 3/4-view pixel-art RPG (classic Pokemon/Stardew interior: cutaway room with the back wall and side walls visible, the floor seen from about 45 degrees). Landscape 1536x1024; the room fills the frame edge to edge with a thin dark wall border. Keep a clear open floor area in the lower-middle for walking and a door opening with a small doormat at the bottom centre. A reception desk at the back centre; a trophy display at the right; stairs going down at the back right (to the basement arcade); a door on the left wall (to the manager's office); a door on the right wall (to the trophy room); mint and white
Rules: no characters, no people; no readable text or letters anywhere (papers, boards and screens show abstract shapes); light from the top-left; crisp pixel outline, three-step shading; warm and cosy. Furniture is placed as described (left/right are from the viewer's view).
```

- [x] #092 생성·저장 완료

## #093 · 실내 — clubhouse-office (최종 640×384)

- **저장 이름**: `tmp/world-src/interiors/int-clubhouse-office.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-INT-2` (이 스레드의 첫 스텝 #089을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 같은 건물 로비 실내: `tmp/world-src/interiors/int-clubhouse-lobby.png`
- **검수 체크**: 문(하단 중앙)·열린 바닥 공간 확보, 캐릭터 없음, 글자 없음, 가구 배치가 03 문서 조사 포인트와 대체로 일치
- **변환**: `pnpm convert:world-art -- interiors clubhouse-office`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
The attached image (if provided) is the exterior or a sibling room of this place: match its colours, materials and mood.

Draw a single-screen interior of a football manager's office for a top-down 3/4-view pixel-art RPG (classic Pokemon/Stardew interior: cutaway room with the back wall and side walls visible, the floor seen from about 45 degrees). Landscape 1536x1024; the room fills the frame edge to edge with a thin dark wall border. Keep a clear open floor area in the lower-middle for walking and a door opening with a small doormat at the bottom centre. A tactics chalkboard on the left wall (abstract lines); a large wooden desk at the back centre with a notebook; a tall card cabinet with many small drawers on the right wall; a comfy chair; a window with a stadium view
Rules: no characters, no people; no readable text or letters anywhere (papers, boards and screens show abstract shapes); light from the top-left; crisp pixel outline, three-step shading; warm and cosy. Furniture is placed as described (left/right are from the viewer's view).
```

- [x] #093 생성·저장 완료

## #094 · 실내 — arcade (최종 640×384)

- **저장 이름**: `tmp/world-src/interiors/int-arcade.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-INT-2` (이 스레드의 첫 스텝 #089을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 같은 건물 로비 실내: `tmp/world-src/interiors/int-clubhouse-lobby.png`
- **검수 체크**: 문(하단 중앙)·열린 바닥 공간 확보, 캐릭터 없음, 글자 없음, 가구 배치가 03 문서 조사 포인트와 대체로 일치
- **변환**: `pnpm convert:world-art -- interiors arcade`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
The attached image (if provided) is the exterior or a sibling room of this place: match its colours, materials and mood.

Draw a single-screen interior of a basement arcade with neon lights for a top-down 3/4-view pixel-art RPG (classic Pokemon/Stardew interior: cutaway room with the back wall and side walls visible, the floor seen from about 45 degrees). Landscape 1536x1024; the room fills the frame edge to edge with a thin dark wall border. Keep a clear open floor area in the lower-middle for walking and a door opening with a small doormat at the bottom centre. Five arcade cabinets in a row along the back wall with glowing screens (abstract); a prize shelf at the left; a counter at the right; carpet with a neon pattern; purple and mint neon
Rules: no characters, no people; no readable text or letters anywhere (papers, boards and screens show abstract shapes); light from the top-left; crisp pixel outline, three-step shading; warm and cosy. Furniture is placed as described (left/right are from the viewer's view).
```

- [x] #094 생성·저장 완료

## #095 · 실내 — stadium (최종 640×384)

- **저장 이름**: `tmp/world-src/interiors/int-stadium.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-INT-2` (이 스레드의 첫 스텝 #089을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 스타디움 외관: `tmp/world-src/buildings/bld-stadium.png`
- **검수 체크**: 문(하단 중앙)·열린 바닥 공간 확보, 캐릭터 없음, 글자 없음, 가구 배치가 03 문서 조사 포인트와 대체로 일치
- **변환**: `pnpm convert:world-art -- interiors stadium`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
The attached image (if provided) is the exterior or a sibling room of this place: match its colours, materials and mood.

Draw a single-screen interior of the inside of a small stadium seen from behind the goal for a top-down 3/4-view pixel-art RPG (classic Pokemon/Stardew interior: cutaway room with the back wall and side walls visible, the floor seen from about 45 degrees). Landscape 1536x1024; the room fills the frame edge to edge with a thin dark wall border. Keep a clear open floor area in the lower-middle for walking and a door opening with a small doormat at the bottom centre. The pitch in the centre with a glowing golden patch of grass at the centre circle; grandstands with empty seats along the back and sides; floodlights; a dark machine (the weed core) half-buried at the centre
Rules: no characters, no people; no readable text or letters anywhere (papers, boards and screens show abstract shapes); light from the top-left; crisp pixel outline, three-step shading; warm and cosy. Furniture is placed as described (left/right are from the viewer's view).
```

- [x] #095 생성·저장 완료

## #096 · 실내 — store (최종 640×384)

- **저장 이름**: `tmp/world-src/interiors/int-store.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-INT-2` (이 스레드의 첫 스텝 #089을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 편의점 외관: `tmp/world-src/buildings/bld-store.png`
- **검수 체크**: 문(하단 중앙)·열린 바닥 공간 확보, 캐릭터 없음, 글자 없음, 가구 배치가 03 문서 조사 포인트와 대체로 일치
- **변환**: `pnpm convert:world-art -- interiors store`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
The attached image (if provided) is the exterior or a sibling room of this place: match its colours, materials and mood.

Draw a single-screen interior of a convenience store interior for a top-down 3/4-view pixel-art RPG (classic Pokemon/Stardew interior: cutaway room with the back wall and side walls visible, the floor seen from about 45 degrees). Landscape 1536x1024; the room fills the frame edge to edge with a thin dark wall border. Keep a clear open floor area in the lower-middle for walking and a door opening with a small doormat at the bottom centre. Shelves of snacks and drinks at the back left; a fridge with milk cartons at the back right; a counter at the right; a magazine corner at the bottom left; mint and white
Rules: no characters, no people; no readable text or letters anywhere (papers, boards and screens show abstract shapes); light from the top-left; crisp pixel outline, three-step shading; warm and cosy. Furniture is placed as described (left/right are from the viewer's view).
```

- [x] #096 생성·저장 완료

---

# Phase 5 — P0 UI·FX

`T-UI-FRAMES`는 Phase 1에서 연 스레드에서 이어서.

## #097 · 로딩 화면 키아트(활기찬 마을)

- **저장 이름**: `tmp/world-src/ui/ui-loading-bg.png` (1536×1024, P0)
- **스레드**: 🆕 **새 스레드 시작** — `T-UI-ART`
- **레퍼런스 첨부**: 없음
- **검수 체크**: 16:9 중앙 영역에 중요 요소, 사람·글자 없음
- **변환**: `pnpm convert:world-art -- ui loading-bg`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.

A wide panoramic pixel-art illustration (16:9 composition inside a 1536x1024 canvas, keep the important content in the central 16:9 area) of the football-club village "잔디동" at golden hour, viewed from a high 3/4 angle: a big football stadium in the centre with mint banners and a glowing golden patch of grass, a plaza with a fountain in front, and five districts around it: pink cherry-blossom garden on the left, a frozen night lake on the right, a cloud castle at the top left, a violet rune tower at the top right, and orange lava workshops at the bottom left. Warm light, tiny detailed houses, winding paths, lush green grass. No people, no text, no letters, no logos.
```

- [x] #097 생성·저장 완료

## #098 · 타이틀 화면 키아트(시든 버전)

- **저장 이름**: `tmp/world-src/ui/ui-title-bg.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-UI-ART` (이 스레드의 첫 스텝 #097을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 직전 결과 ui-loading-bg: `tmp/world-src/ui/ui-loading-bg.png`
- **검수 체크**: loading-bg와 같은 구도·건물 배치, 색만 시듦
- **변환**: `pnpm convert:world-art -- ui title-bg`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.

Keep exactly the same composition and buildings as the attached image, but show the village WITHERING: the grass is faded yellow-grey, the sky is a dull dusk, the cherry blossoms are bare, the colours are desaturated, weed-cutting machines and grey smoke appear at the far bottom right, and only the golden patch of grass at the stadium still glows faintly. Melancholic but not scary. No people, no text, no letters, no logos.
```

- [x] #098 생성·저장 완료

## #099 · 로고 엠블럼(글자 없음)

- **저장 이름**: `tmp/world-src/ui/ui-logo-emblem.png` (1024×1024, P0)
- **스레드**: ↪ **이어서** — `T-UI-ART` (이 스레드의 첫 스텝 #097을 만든 대화)
- **레퍼런스 첨부**: 없음
- **검수 체크**: 글자·숫자 없음, 배경 투명/마젠타
- **변환**: `pnpm convert:world-art -- ui logo-emblem`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.

A round-cornered football-club shield emblem, centred, transparent background: a mint-and-white shield with gold trim, a sprouting green seedling growing out of a classic football at the centre, small laurel leaves on both sides, a subtle glow. Pixel art, crisp outline. Absolutely no text, no letters, no numbers.
```

- [x] #099 생성·저장 완료

## #100 · 캐릭터 선택 배경

- **저장 이름**: `tmp/world-src/ui/ui-select-bg.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-UI-ART` (이 스레드의 첫 스텝 #097을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 ui-loading-bg: `tmp/world-src/ui/ui-loading-bg.png`
- **검수 체크**: 사람 없음, 중앙이 비어 있음
- **변환**: `pnpm convert:world-art -- ui select-bg`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

A soft pixel-art background for a character-selection screen: a football pitch at dusk with a large soft spotlight cone in the centre, gentle floating cherry-blossom petals and fireflies, mint and teal tones, the centre area empty and calm so that character cards can be placed on top. 16:9 composition inside a 1536x1024 canvas (keep important content in the central 16:9). No people, no text, no letters.
```

- [x] #100 생성·저장 완료

## #101 · UI 프레임 시트 B — 패널·HUD·게시판 (12칸)

- **저장 이름**: `tmp/world-src/ui/ui-frames-panel.png` (1536×1024 (4×3), P0)
- **스레드**: ↪ **이어서** — `T-UI-FRAMES` (이 스레드의 첫 스텝 #011을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 프레임 디자인 통일용 ui-frames-dialog 결과: `tmp/world-src/ui/ui-frames-dialog.png`
- **검수 체크**: 프레임 대칭, 종이/게이지 칸은 비어 있음, 글자 없음
- **변환**: `pnpm convert:world-art -- ui frames-panel`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Match the frame design (border, ornaments, colours) of the attached image.

Create a UI frame kit for a pixel-art RPG on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows (12 cells, each 384x341), exactly one UI element per cell, centred, transparent background (or flat #FF00FF), no cell borders or grid lines, at least 8% empty margin inside each cell, no text or letters anywhere (labels and text areas are blank), crisp pixel outline, three-step shading. Design language: dark teal panels (#0b1614) with mint (#00e9ae) pixel trim and small leaf-shaped corner ornaments, warm gold accents (#ffd54a), matching a football club identity (mint and white, sprout shield). Every frame must be perfectly symmetrical left-right and top-bottom, with identical corner ornaments and plain repeating straight edges so it can be stretched as a 9-slice frame, and a flat calm centre area.
Elements in order (left to right, top to bottom):
1) large menu window frame (near-square), 2) parchment notebook page for a mission log (cream paper with faint ruled lines, soft dark-green binding on the left, no writing), 3) tab button normal (small wide tag with top corners rounded), 4) tab button active (same tag, brighter, gold underline), 5) HUD mission-tracker frame (small wide dark panel with a tiny gold leaf icon slot at the left), 6) minimap frame (rectangle with thicker ornate corners, empty dark inside), 7) shard gauge bar frame (long thin bar holding ten round slots in a row, all slots empty), 8) one empty round shard slot (dark socket with mint rim), 9) one filled round shard slot (the same socket filled with a glowing mint-and-gold grass-blade crystal), 10) community notice board paper (pinned cream paper with a pin at the top, no writing), 11) daily stamp card frame (a cream card with a grid area of 6x5 empty circles, no writing), 12) a round red-and-mint completed stamp mark (a paw-print-like sprout stamp, no letters)
```

- [x] #101 생성·저장 완료

## #102 · UI 버튼 시트 (8칸)

- **저장 이름**: `tmp/world-src/ui/ui-buttons.png` (1536×1024 (4×2), P0)
- **스레드**: ↪ **이어서** — `T-UI-FRAMES` (이 스레드의 첫 스텝 #011을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 프레임 디자인 통일용 ui-frames-dialog 결과: `tmp/world-src/ui/ui-frames-dialog.png`
- **검수 체크**: 버튼이 좌우 대칭, 글자 영역 비어 있음, 4단계 상태 차이 명확
- **변환**: `pnpm convert:world-art -- ui buttons`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Match the design language of the attached image.

Create a UI frame kit for a pixel-art RPG on one 1536x1024 canvas: a strict grid of 4 columns x 2 rows (8 cells, each 384x512), exactly one UI element per cell, centred, transparent background (or flat #FF00FF), no cell borders or grid lines, at least 8% empty margin inside each cell, no text or letters anywhere (labels and text areas are blank), crisp pixel outline, three-step shading. Design language: dark teal panels (#0b1614) with mint (#00e9ae) pixel trim and small leaf-shaped corner ornaments, warm gold accents (#ffd54a), matching a football club identity (mint and white, sprout shield). Every frame must be perfectly symmetrical left-right and top-bottom, with identical corner ornaments and plain repeating straight edges so it can be stretched as a 9-slice frame, and a flat calm centre area.
grid of 4 columns x 2 rows (8 cells). Elements in order (left to right, top to bottom):
1) primary button normal (wide rounded plate, mint-green with white top highlight and dark teal bottom edge, the centre area EMPTY), 2) primary button hover (brighter with a glow), 3) primary button pressed (darker, shifted down by a few pixels, no bottom edge), 4) primary button disabled (desaturated grey),
5) secondary button normal (dark teal plate with mint outline, centre EMPTY), 6) secondary hover (brighter outline), 7) secondary pressed (darker), 8) secondary disabled (grey outline)
Each button is perfectly symmetrical left-right so it can be stretched as a 9-slice. No text.
```

- [x] #102 생성·저장 완료

## #103 · 캐릭터 선택 카드·장식 시트 (12칸)

- **저장 이름**: `tmp/world-src/ui/ui-select-cards.png` (1536×1024 (4×3), P0)
- **스레드**: ↪ **이어서** — `T-UI-FRAMES` (이 스레드의 첫 스텝 #011을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 프레임 디자인 통일용 ui-frames-dialog 결과: `tmp/world-src/ui/ui-frames-dialog.png`
- **검수 체크**: 카드 4종 대칭·같은 크기, 화살표/장식 각 칸 중앙
- **변환**: `pnpm convert:world-art -- ui select-cards`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Match the design language of the attached image.

Create a UI frame kit for a pixel-art RPG on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows (12 cells, each 384x341), exactly one UI element per cell, centred, transparent background (or flat #FF00FF), no cell borders or grid lines, at least 8% empty margin inside each cell, no text or letters anywhere (labels and text areas are blank), crisp pixel outline, three-step shading. Design language: dark teal panels (#0b1614) with mint (#00e9ae) pixel trim and small leaf-shaped corner ornaments, warm gold accents (#ffd54a), matching a football club identity (mint and white, sprout shield). Every frame must be perfectly symmetrical left-right and top-bottom, with identical corner ornaments and plain repeating straight edges so it can be stretched as a 9-slice frame, and a flat calm centre area.
Elements in order (left to right, top to bottom):
1) character card frame normal (tall portrait-oriented dark teal card with mint trim, empty inside with a subtle pedestal at the bottom), 2) card frame hover (brighter, mint glow), 3) card frame selected (gold trim, strong glow, small gold sparkles), 4) card frame dimmed (darker, desaturated), 5) left arrow button (pixel arrow on a round plate), 6) right arrow button, 7) name ribbon (wide ribbon banner, empty), 8) spotlight cone (soft, additive glow, transparent), 9) ground shadow ellipse (soft dark ellipse), 10) small floating football marker (bobbing above the selected card), 11) sparkle ring (thin gold ring with sparkles, for selection confirmation), 12) confirm check mark badge (mint circle with a white check)
```

- [x] #103 생성·저장 완료

## #104 · 아이콘 시트 — 미션 상태/유형 (12칸)

- **저장 이름**: `tmp/world-src/ui/ui-icons-mission.png` (1536×1024 (4×3), P0)
- **스레드**: ↪ **이어서** — `T-UI-FRAMES` (이 스레드의 첫 스텝 #011을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 프레임 디자인 통일용 ui-frames-dialog 결과: `tmp/world-src/ui/ui-frames-dialog.png`
- **검수 체크**: 12개 아이콘이 32px에서 읽힘, 글자 없음(! ? 은 기호 도형)
- **변환**: `pnpm convert:world-art -- ui icons-mission`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Match the design language of the attached image.

Create a pixel-art UI icon sheet for a game on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows (12 cells, each 384x341), exactly one icon per cell, centred, transparent background (or flat #FF00FF), no cell borders or grid lines, at least 10% empty margin in each cell, no text or letters. Each icon is a simple bold symbol on a small round or square plate, readable at 32x32 px. Design language: dark teal panels (#0b1614) with mint (#00e9ae) pixel trim and small leaf-shaped corner ornaments, cream paper for parchment items, warm gold accents (#ffd54a), matching the 잔디동 football club identity (mint and white, sprout shield).
Icons in order (left to right, top to bottom):
1) mission in progress (a small clock), 2) mission ready to report (a gold exclamation-mark symbol), 3) mission completed (a green check), 4) mission locked (a padlock), 5) 3D card mission (a card with a star), 6) sum-ten puzzle game (a football with abstract number dots), 7) juggling game (a football bouncing on a foot), 8) free-kick game (a goal with a football), 9) card matching game (two overlapping cards), 10) delivery mission (a parcel with an arrow), 11) collect mission (a sparkle over a jar), 12) talk mission (a speech bubble)
```

- [x] #104 생성·저장 완료

## #105 · 아이콘 시트 — 메뉴 (12칸)

- **저장 이름**: `tmp/world-src/ui/ui-icons-menu.png` (1536×1024 (4×3), P0)
- **스레드**: ↪ **이어서** — `T-UI-FRAMES` (이 스레드의 첫 스텝 #011을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 프레임 디자인 통일용 ui-frames-dialog 결과: `tmp/world-src/ui/ui-frames-dialog.png`
- **검수 체크**: 12개 아이콘이 24px에서 읽힘
- **변환**: `pnpm convert:world-art -- ui icons-menu`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Match the design language of the attached image.

Create a pixel-art UI icon sheet for a game on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows (12 cells, each 384x341), exactly one icon per cell, centred, transparent background (or flat #FF00FF), no cell borders or grid lines, at least 10% empty margin in each cell, no text or letters. Each icon is a simple bold symbol on a small round or square plate, readable at 32x32 px. Design language: dark teal panels (#0b1614) with mint (#00e9ae) pixel trim and small leaf-shaped corner ornaments, cream paper for parchment items, warm gold accents (#ffd54a), matching the 잔디동 football club identity (mint and white, sprout shield).
Icons in order (left to right, top to bottom):
1) resume (play triangle), 2) mission log (open book), 3) world map (folded map), 4) settings (gear), 5) guide (question-mark symbol in a bubble), 6) sound on (speaker with waves), 7) sound off (speaker with a slash), 8) close (x mark), 9) back (left arrow), 10) exit (door with an arrow), 11) new game (circular refresh arrows), 12) info (small i-shaped symbol in a circle)
```

- [x] #105 생성·저장 완료

## #106 · FX 시트 — markers

- **저장 이름**: `tmp/world-src/fx/fx-markers.png` (1536×1024 (4×3), P0)
- **스레드**: 🆕 **새 스레드 시작** — `T-FX`
- **레퍼런스 첨부**: 없음
- **검수 체크**: 12칸 1개씩, 기호(! ? …)는 도형, 글자 없음, 경계선 없음
- **변환**: `pnpm convert:world-art -- fx markers`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.

Create a pixel-art prop sheet for a top-down 3/4-view RPG on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows (12 cells, each 384x341), exactly one object per cell, centred and filling about 80% of its cell. Transparent background (or flat #FF00FF), no ground plane, NO cast shadow on the ground, light from the top-left, no cell borders or grid lines, at least 8% empty margin inside every cell, no text or letters.
Theme: small game markers and effects: quest markers above heads, sparkles, footstep dust
Objects in order (left to right, top to bottom):
1) a blue round speech balloon containing a white question-mark symbol (new quest available), 2) a glowing GOLD round balloon containing a bold white exclamation-mark symbol with small sparkles around it (quest complete, report now), 3) a small grey round balloon with three dots (quest in progress), 4-7) a four-frame sparkle burst animation (small to large to fading), 8-11) a four-frame small footstep dust puff animation, 12) a flat thin mint ground ring seen from above (target ring)
```

- [x] #106 생성·저장 완료

---

# Phase 6 — P1 콘텐츠 완성

오리지널 캐릭터, 동물, 지구별 지면·소품, 카페·공장, 뱃지, 이모트/월드 FX, 러시 배경·시트.

## #107 · 편의점 사장님 — ① stand (정면 서기 마스터)

- **저장 이름**: `tmp/world-src/characters/char-shopkeeper-stand.png` (1024×1024, P1)
- **스레드**: 🆕 **새 스레드 시작** — `T-CH-shopkeeper`
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 승인된 결과 1장: `tmp/world-src/characters/char-janine95kim-stand.png`
- **검수 체크**: 배경 투명/마젠타 단색, 글자 없음, 설명한 외형·색 반영, 전신이 잘리지 않음
- **변환**: `pnpm convert:world-art -- characters shopkeeper`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.
Create an original chibi pixel-art game character sprite: a friendly middle-aged convenience-store owner, round glasses, short tidy hair, a mint-green striped store apron over a white shirt, a small name-tag shape (no readable text), sleeves rolled, holding a small cardboard box, cheerful expression, mint and white palette
Pose: standing idle, front view, arms relaxed, feet together on one baseline, full body visible with a little empty margin.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
```

- [x] #107 생성·저장 완료

## #108 · 편의점 사장님 — ② turn (3방향 서기)

- **저장 이름**: `tmp/world-src/characters/char-shopkeeper-turn.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-CH-shopkeeper` (이 스레드의 첫 스텝 #107을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-shopkeeper-stand.png`
- **검수 체크**: 정면·우측·후면 3컷 크기·발끝 기준선 동일, 후면 뒷모습(머리 길이·장식) 자연스러움
- **변환**: `pnpm convert:world-art -- characters shopkeeper`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw the SAME character as a turnaround sheet with three standing poses side by side on one 1536x1024 canvas, evenly spaced with clear gaps:
1) front view (facing the camera), 2) right-side view (facing right, profile), 3) back view (facing away).
Rules: identical character design, palette, proportions and pixel size in all three; same scale; all feet on the exact same baseline; standing idle with arms relaxed; no motion; no shadows; keep at least 10% empty margin around each pose; do not add any text or guide lines.
```

- [x] #108 생성·저장 완료

## #109 · 편의점 사장님 — ③ walk (걷기 4프레임×3방향)

- **저장 이름**: `tmp/world-src/characters/char-shopkeeper-walk.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-CH-shopkeeper` (이 스레드의 첫 스텝 #107을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ② 결과: `tmp/world-src/characters/char-shopkeeper-turn.png`
- **검수 체크**: 4×3 그리드 12칸 모두 같은 크기·같은 캐릭터, 발끝 행 동일, 칸 경계선 없음, 인접 칸으로 삐져나온 부분 없음
- **변환**: `pnpm convert:world-art -- characters shopkeeper`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached turnaround sheet as the exact reference, draw the SAME character's walk cycle as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows, each cell the same size, one pose per cell, centred, feet on the same baseline row in every cell.
Row 1 (top): walking toward the camera (front view), 4 frames.
Row 2 (middle): walking to the right (side view), 4 frames.
Row 3 (bottom): walking away from the camera (back view), 4 frames.
Frame order in every row: (1) left foot forward contact, (2) passing pose with the body slightly higher, (3) right foot forward contact, (4) passing pose with the body slightly higher. Arms swing opposite to the legs. Hair, ribbons and accessories move by at most one or two pixels.
Rules: identical design, palette, proportions and pixel size in all 12 cells; no motion blur; no shadows; no cell borders or grid lines; leave at least 10% empty margin inside every cell; no text.
```

- [x] #109 생성·저장 완료

## #110 · 편의점 사장님 — ④ portrait (표정 4종 2×2)

- **저장 이름**: `tmp/world-src/characters/char-shopkeeper-portrait.png` (1024×1024, P1)
- **스레드**: ↪ **이어서** — `T-CH-shopkeeper` (이 스레드의 첫 스텝 #107을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-shopkeeper-stand.png`
- **검수 체크**: 4칸 표정 구분 명확(기본/기쁨/놀람/걱정), 헤어·소품 동일, 프레이밍 동일
- **변환**: `pnpm convert:world-art -- characters shopkeeper`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw a dialogue portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, same pixel style as the sprite but more detailed.
Top-left: neutral, calm expression. Top-right: happy, smiling with sparkling eyes. Bottom-left: surprised, wide eyes and open mouth. Bottom-right: worried, slightly sweating, eyebrows down.
Rules: identical hairstyle, accessories and outfit colours in all four; same framing and scale; no cell borders or grid lines; no text.
```

- [x] #110 생성·저장 완료

## #111 · 꼬마 팬 — ① stand (정면 서기 마스터)

- **저장 이름**: `tmp/world-src/characters/char-kid-stand.png` (1024×1024, P1)
- **스레드**: 🆕 **새 스레드 시작** — `T-CH-kid`
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 승인된 결과 1장: `tmp/world-src/characters/char-janine95kim-stand.png`
- **검수 체크**: 배경 투명/마젠타 단색, 글자 없음, 설명한 외형·색 반영, 전신이 잘리지 않음
- **변환**: `pnpm convert:world-art -- characters kid`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.
Create an original chibi pixel-art game character sprite: a small child fan, drawn smaller than the adults (about 75% of the standard height but still centred in the same canvas), wearing an oversized white-and-mint football jersey that reaches the knees, a red scarf, a bucket cap, holding a small mint pennant flag, huge excited eyes
Pose: standing idle, front view, arms relaxed, feet together on one baseline, full body visible with a little empty margin.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
```

- [x] #111 생성·저장 완료

## #112 · 꼬마 팬 — ② turn (3방향 서기)

- **저장 이름**: `tmp/world-src/characters/char-kid-turn.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-CH-kid` (이 스레드의 첫 스텝 #111을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-kid-stand.png`
- **검수 체크**: 정면·우측·후면 3컷 크기·발끝 기준선 동일, 후면 뒷모습(머리 길이·장식) 자연스러움
- **변환**: `pnpm convert:world-art -- characters kid`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw the SAME character as a turnaround sheet with three standing poses side by side on one 1536x1024 canvas, evenly spaced with clear gaps:
1) front view (facing the camera), 2) right-side view (facing right, profile), 3) back view (facing away).
Rules: identical character design, palette, proportions and pixel size in all three; same scale; all feet on the exact same baseline; standing idle with arms relaxed; no motion; no shadows; keep at least 10% empty margin around each pose; do not add any text or guide lines.
```

- [x] #112 생성·저장 완료

## #113 · 꼬마 팬 — ③ walk (걷기 4프레임×3방향)

- **저장 이름**: `tmp/world-src/characters/char-kid-walk.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-CH-kid` (이 스레드의 첫 스텝 #111을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ② 결과: `tmp/world-src/characters/char-kid-turn.png`
- **검수 체크**: 4×3 그리드 12칸 모두 같은 크기·같은 캐릭터, 발끝 행 동일, 칸 경계선 없음, 인접 칸으로 삐져나온 부분 없음
- **변환**: `pnpm convert:world-art -- characters kid`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached turnaround sheet as the exact reference, draw the SAME character's walk cycle as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows, each cell the same size, one pose per cell, centred, feet on the same baseline row in every cell.
Row 1 (top): walking toward the camera (front view), 4 frames.
Row 2 (middle): walking to the right (side view), 4 frames.
Row 3 (bottom): walking away from the camera (back view), 4 frames.
Frame order in every row: (1) left foot forward contact, (2) passing pose with the body slightly higher, (3) right foot forward contact, (4) passing pose with the body slightly higher. Arms swing opposite to the legs. Hair, ribbons and accessories move by at most one or two pixels.
Rules: identical design, palette, proportions and pixel size in all 12 cells; no motion blur; no shadows; no cell borders or grid lines; leave at least 10% empty margin inside every cell; no text.
```

- [x] #113 생성·저장 완료

## #114 · 꼬마 팬 — ④ portrait (표정 4종 2×2)

- **저장 이름**: `tmp/world-src/characters/char-kid-portrait.png` (1024×1024, P1)
- **스레드**: ↪ **이어서** — `T-CH-kid` (이 스레드의 첫 스텝 #111을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-kid-stand.png`
- **검수 체크**: 4칸 표정 구분 명확(기본/기쁨/놀람/걱정), 헤어·소품 동일, 프레이밍 동일
- **변환**: `pnpm convert:world-art -- characters kid`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw a dialogue portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, same pixel style as the sprite but more detailed.
Top-left: neutral, calm expression. Top-right: happy, smiling with sparkling eyes. Bottom-left: surprised, wide eyes and open mouth. Bottom-right: worried, slightly sweating, eyebrows down.
Rules: identical hairstyle, accessories and outfit colours in all four; same framing and scale; no cell borders or grid lines; no text.
```

- [x] #114 생성·저장 완료

## #115 · 심판 — ① stand (정면 서기 마스터)

- **저장 이름**: `tmp/world-src/characters/char-referee-stand.png` (1024×1024, P1)
- **스레드**: 🆕 **새 스레드 시작** — `T-CH-referee`
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 승인된 결과 1장: `tmp/world-src/characters/char-janine95kim-stand.png`
- **검수 체크**: 배경 투명/마젠타 단색, 글자 없음, 설명한 외형·색 반영, 전신이 잘리지 않음
- **변환**: `pnpm convert:world-art -- characters referee`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.
Create an original chibi pixel-art game character sprite: a football referee, athletic build, black referee kit with yellow trim, a silver whistle in the mouth or hanging on a lanyard, a small yellow card and a red card sticking out of the chest pocket, a short cap, serious but fair expression
Pose: standing idle, front view, arms relaxed, feet together on one baseline, full body visible with a little empty margin.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
```

- [x] #115 생성·저장 완료

## #116 · 심판 — ② turn (3방향 서기)

- **저장 이름**: `tmp/world-src/characters/char-referee-turn.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-CH-referee` (이 스레드의 첫 스텝 #115을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-referee-stand.png`
- **검수 체크**: 정면·우측·후면 3컷 크기·발끝 기준선 동일, 후면 뒷모습(머리 길이·장식) 자연스러움
- **변환**: `pnpm convert:world-art -- characters referee`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw the SAME character as a turnaround sheet with three standing poses side by side on one 1536x1024 canvas, evenly spaced with clear gaps:
1) front view (facing the camera), 2) right-side view (facing right, profile), 3) back view (facing away).
Rules: identical character design, palette, proportions and pixel size in all three; same scale; all feet on the exact same baseline; standing idle with arms relaxed; no motion; no shadows; keep at least 10% empty margin around each pose; do not add any text or guide lines.
```

- [x] #116 생성·저장 완료

## #117 · 심판 — ③ walk (걷기 4프레임×3방향)

- **저장 이름**: `tmp/world-src/characters/char-referee-walk.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-CH-referee` (이 스레드의 첫 스텝 #115을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ② 결과: `tmp/world-src/characters/char-referee-turn.png`
- **검수 체크**: 4×3 그리드 12칸 모두 같은 크기·같은 캐릭터, 발끝 행 동일, 칸 경계선 없음, 인접 칸으로 삐져나온 부분 없음
- **변환**: `pnpm convert:world-art -- characters referee`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached turnaround sheet as the exact reference, draw the SAME character's walk cycle as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows, each cell the same size, one pose per cell, centred, feet on the same baseline row in every cell.
Row 1 (top): walking toward the camera (front view), 4 frames.
Row 2 (middle): walking to the right (side view), 4 frames.
Row 3 (bottom): walking away from the camera (back view), 4 frames.
Frame order in every row: (1) left foot forward contact, (2) passing pose with the body slightly higher, (3) right foot forward contact, (4) passing pose with the body slightly higher. Arms swing opposite to the legs. Hair, ribbons and accessories move by at most one or two pixels.
Rules: identical design, palette, proportions and pixel size in all 12 cells; no motion blur; no shadows; no cell borders or grid lines; leave at least 10% empty margin inside every cell; no text.
```

- [x] #117 생성·저장 완료

## #118 · 심판 — ④ portrait (표정 4종 2×2)

- **저장 이름**: `tmp/world-src/characters/char-referee-portrait.png` (1024×1024, P1)
- **스레드**: ↪ **이어서** — `T-CH-referee` (이 스레드의 첫 스텝 #115을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-referee-stand.png`
- **검수 체크**: 4칸 표정 구분 명확(기본/기쁨/놀람/걱정), 헤어·소품 동일, 프레이밍 동일
- **변환**: `pnpm convert:world-art -- characters referee`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw a dialogue portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, same pixel style as the sprite but more detailed.
Top-left: neutral, calm expression. Top-right: happy, smiling with sparkling eyes. Bottom-left: surprised, wide eyes and open mouth. Bottom-right: worried, slightly sweating, eyebrows down.
Rules: identical hairstyle, accessories and outfit colours in all four; same framing and scale; no cell borders or grid lines; no text.
```

- [x] #118 생성·저장 완료

## #119 · 제초왕 — ① stand (정면 서기 마스터)

- **저장 이름**: `tmp/world-src/characters/char-weedking-stand.png` (1024×1024, P1)
- **스레드**: 🆕 **새 스레드 시작** — `T-CH-weedking`
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 승인된 결과 1장: `tmp/world-src/characters/char-janine95kim-stand.png`
- **검수 체크**: 배경 투명/마젠타 단색, 글자 없음, 설명한 외형·색 반영, 전신이 잘리지 않음
- **변환**: `pnpm convert:world-art -- characters weedking`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.
Create an original chibi pixel-art game character sprite: a comical villain "weed king", tall and imposing (drawn slightly taller, about 95% of the canvas height), long grey-brown coat with a high collar, dark sunglasses, a big curled moustache, a crown made of spinning lawn-mower blades, a petrol grass-trimmer carried over the shoulder, a round badge showing a crossed-out sprout (no text), grey and rust-orange palette with a hint of purple, smug grin
Pose: standing idle, front view, arms relaxed, feet together on one baseline, full body visible with a little empty margin.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
```

- [x] #119 생성·저장 완료

## #120 · 제초왕 — ② turn (3방향 서기)

- **저장 이름**: `tmp/world-src/characters/char-weedking-turn.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-CH-weedking` (이 스레드의 첫 스텝 #119을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-weedking-stand.png`
- **검수 체크**: 정면·우측·후면 3컷 크기·발끝 기준선 동일, 후면 뒷모습(머리 길이·장식) 자연스러움
- **변환**: `pnpm convert:world-art -- characters weedking`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw the SAME character as a turnaround sheet with three standing poses side by side on one 1536x1024 canvas, evenly spaced with clear gaps:
1) front view (facing the camera), 2) right-side view (facing right, profile), 3) back view (facing away).
Rules: identical character design, palette, proportions and pixel size in all three; same scale; all feet on the exact same baseline; standing idle with arms relaxed; no motion; no shadows; keep at least 10% empty margin around each pose; do not add any text or guide lines.
```

- [x] #120 생성·저장 완료

## #121 · 제초왕 — ③ walk (걷기 4프레임×3방향)

- **저장 이름**: `tmp/world-src/characters/char-weedking-walk.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-CH-weedking` (이 스레드의 첫 스텝 #119을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ② 결과: `tmp/world-src/characters/char-weedking-turn.png`
- **검수 체크**: 4×3 그리드 12칸 모두 같은 크기·같은 캐릭터, 발끝 행 동일, 칸 경계선 없음, 인접 칸으로 삐져나온 부분 없음
- **변환**: `pnpm convert:world-art -- characters weedking`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached turnaround sheet as the exact reference, draw the SAME character's walk cycle as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows, each cell the same size, one pose per cell, centred, feet on the same baseline row in every cell.
Row 1 (top): walking toward the camera (front view), 4 frames.
Row 2 (middle): walking to the right (side view), 4 frames.
Row 3 (bottom): walking away from the camera (back view), 4 frames.
Frame order in every row: (1) left foot forward contact, (2) passing pose with the body slightly higher, (3) right foot forward contact, (4) passing pose with the body slightly higher. Arms swing opposite to the legs. Hair, ribbons and accessories move by at most one or two pixels.
Rules: identical design, palette, proportions and pixel size in all 12 cells; no motion blur; no shadows; no cell borders or grid lines; leave at least 10% empty margin inside every cell; no text.
```

- [x] #121 생성·저장 완료

## #122 · 제초왕 — ④ portrait (표정 4종 2×2)

- **저장 이름**: `tmp/world-src/characters/char-weedking-portrait.png` (1024×1024, P1)
- **스레드**: ↪ **이어서** — `T-CH-weedking` (이 스레드의 첫 스텝 #119을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-weedking-stand.png`
- **검수 체크**: 4칸 표정 구분 명확(기본/기쁨/놀람/걱정), 헤어·소품 동일, 프레이밍 동일
- **변환**: `pnpm convert:world-art -- characters weedking`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw a dialogue portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, same pixel style as the sprite but more detailed.
Top-left: neutral, calm expression. Top-right: happy, smiling with sparkling eyes. Bottom-left: surprised, wide eyes and open mouth. Bottom-right: worried, slightly sweating, eyebrows down.
Rules: identical hairstyle, accessories and outfit colours in all four; same framing and scale; no cell borders or grid lines; no text.
```

- [x] #122 생성·저장 완료

## #123 · 제초 요원 — ① stand (정면 서기 마스터)

- **저장 이름**: `tmp/world-src/characters/char-weeder-grunt-stand.png` (1024×1024, P1)
- **스레드**: 🆕 **새 스레드 시작** — `T-CH-weeder-grunt`
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 승인된 결과 1장: `tmp/world-src/characters/char-janine95kim-stand.png`
- **검수 체크**: 배경 투명/마젠타 단색, 글자 없음, 설명한 외형·색 반영, 전신이 잘리지 않음
- **변환**: `pnpm convert:world-art -- characters weeder-grunt`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.
Create an original chibi pixel-art game character sprite: a factory-worker minion, grey coverall with rust-orange stripes, a hard hat with a face visor, thick gloves, holding a hand-held grass trimmer, goggles, expressionless, grey and rust-orange palette (same palette family as the weed king but plainer)
Pose: standing idle, front view, arms relaxed, feet together on one baseline, full body visible with a little empty margin.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
```

- [x] #123 생성·저장 완료

## #124 · 제초 요원 — ② turn (3방향 서기)

- **저장 이름**: `tmp/world-src/characters/char-weeder-grunt-turn.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-CH-weeder-grunt` (이 스레드의 첫 스텝 #123을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-weeder-grunt-stand.png`
- **검수 체크**: 정면·우측·후면 3컷 크기·발끝 기준선 동일, 후면 뒷모습(머리 길이·장식) 자연스러움
- **변환**: `pnpm convert:world-art -- characters weeder-grunt`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw the SAME character as a turnaround sheet with three standing poses side by side on one 1536x1024 canvas, evenly spaced with clear gaps:
1) front view (facing the camera), 2) right-side view (facing right, profile), 3) back view (facing away).
Rules: identical character design, palette, proportions and pixel size in all three; same scale; all feet on the exact same baseline; standing idle with arms relaxed; no motion; no shadows; keep at least 10% empty margin around each pose; do not add any text or guide lines.
```

- [x] #124 생성·저장 완료

## #125 · 제초 요원 — ③ walk (걷기 4프레임×3방향)

- **저장 이름**: `tmp/world-src/characters/char-weeder-grunt-walk.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-CH-weeder-grunt` (이 스레드의 첫 스텝 #123을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ② 결과: `tmp/world-src/characters/char-weeder-grunt-turn.png`
- **검수 체크**: 4×3 그리드 12칸 모두 같은 크기·같은 캐릭터, 발끝 행 동일, 칸 경계선 없음, 인접 칸으로 삐져나온 부분 없음
- **변환**: `pnpm convert:world-art -- characters weeder-grunt`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached turnaround sheet as the exact reference, draw the SAME character's walk cycle as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows, each cell the same size, one pose per cell, centred, feet on the same baseline row in every cell.
Row 1 (top): walking toward the camera (front view), 4 frames.
Row 2 (middle): walking to the right (side view), 4 frames.
Row 3 (bottom): walking away from the camera (back view), 4 frames.
Frame order in every row: (1) left foot forward contact, (2) passing pose with the body slightly higher, (3) right foot forward contact, (4) passing pose with the body slightly higher. Arms swing opposite to the legs. Hair, ribbons and accessories move by at most one or two pixels.
Rules: identical design, palette, proportions and pixel size in all 12 cells; no motion blur; no shadows; no cell borders or grid lines; leave at least 10% empty margin inside every cell; no text.
```

- [x] #125 생성·저장 완료

## #126 · 제초 요원 — ④ portrait (표정 4종 2×2)

- **저장 이름**: `tmp/world-src/characters/char-weeder-grunt-portrait.png` (1024×1024, P1)
- **스레드**: ↪ **이어서** — `T-CH-weeder-grunt` (이 스레드의 첫 스텝 #123을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** ① 결과: `tmp/world-src/characters/char-weeder-grunt-stand.png`
- **검수 체크**: 4칸 표정 구분 명확(기본/기쁨/놀람/걱정), 헤어·소품 동일, 프레이밍 동일
- **변환**: `pnpm convert:world-art -- characters weeder-grunt`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: classic 3/4 top-down RPG view (about 45 degrees). Characters are chibi, about 2.5 heads tall (head about 40% of the total height), with big simple eyes and tiny simplified hands.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.

Using the attached standing sprite as the exact reference, draw a dialogue portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, same pixel style as the sprite but more detailed.
Top-left: neutral, calm expression. Top-right: happy, smiling with sparkling eyes. Bottom-left: surprised, wide eyes and open mouth. Bottom-right: worried, slightly sweating, eyebrows down.
Rules: identical hairstyle, accessories and outfit colours in all four; same framing and scale; no cell borders or grid lines; no text.
```

- [x] #126 생성·저장 완료

## #127 · 잔디냥 — walk 시트

- **저장 이름**: `tmp/world-src/characters/char-cat-jandi-walk.png` (1536×1024, P1)
- **스레드**: 🆕 **새 스레드 시작** — `T-ANIMALS`
- **레퍼런스 첨부**:
  - (선택) 픽셀 크기·외곽선 톤 통일용 승인 결과 1장: `tmp/world-src/characters/char-janine95kim-walk.png`
- **검수 체크**: 4×3 그리드 12칸, 발(paw) 행 동일, 같은 크기, 칸 경계선 없음
- **변환**: `pnpm convert:world-art -- characters cat-jandi`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Create a pixel-art walk-cycle sprite sheet of a small cute mascot cat on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows, each cell the same size, one pose per cell, centred, paws on the same baseline row in every cell.
Design: a chubby cream-white cat with mint-green patches and a tiny green leaf on its head, a small bell collar, big simple eyes.
Row 1: walking toward the camera (front view), 4 frames. Row 2: walking to the right (side view), 4 frames. Row 3: walking away (back view), 4 frames.
Frame order: left paw forward, passing, right paw forward, passing. Same scale in all cells, no shadows, no cell borders, at least 10% margin in each cell, no text.
```

- [x] #127 생성·저장 완료

## #128 · 공돌이 — walk 시트

- **저장 이름**: `tmp/world-src/characters/char-dog-ball-walk.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-ANIMALS` (이 스레드의 첫 스텝 #127을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 픽셀 크기·외곽선 톤 통일용 승인 결과 1장: `tmp/world-src/characters/char-janine95kim-walk.png`
- **검수 체크**: 4×3 그리드 12칸, 발(paw) 행 동일, 같은 크기, 칸 경계선 없음
- **변환**: `pnpm convert:world-art -- characters dog-ball`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta anywhere on the subject.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Create a pixel-art walk-cycle sprite sheet of a small playful puppy on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows, each cell the same size, one pose per cell, centred, paws on the same baseline row in every cell.
Design: a brown-and-white puppy with floppy ears carrying a tiny mint-and-white football in its mouth, wagging tail, big simple eyes.
Row 1: walking toward the camera (front view), 4 frames. Row 2: walking to the right (side view), 4 frames. Row 3: walking away (back view), 4 frames.
Frame order: left paw forward, passing, right paw forward, passing. Same scale in all cells, no shadows, no cell borders, at least 10% margin in each cell, no text.
```

- [x] #128 생성·저장 완료

## #129 · 지면 시트 — spring

- **저장 이름**: `tmp/world-src/terrain/terrain-spring.png` (1024×1024 (4×4), P1)
- **스레드**: ↪ **이어서** — `T-TERRAIN` (이 스레드의 첫 스텝 #008을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 terrain-core 결과: `tmp/world-src/terrain/terrain-core.png`
- **검수 체크**: 16칸 모두 꽉 채워짐, 타일 사이 경계선 없음, 가장자리가 이어져 보임, 글자/그림자 없음
- **변환**: `pnpm convert:world-art -- terrain spring`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Create a seamless tileset texture sheet for a top-down pixel-art RPG on one 1024x1024 canvas: a strict 4x4 grid of 16 square tiles (each 256x256, no gaps, no borders, no grid lines, tiles fill the whole canvas, no transparency). EVERY tile must tile seamlessly with itself on all four edges (left edge matches right edge, top matches bottom). Straight top-down texture, no perspective, no objects casting shadows, no text. Each visible pixel block is about 8 px so the art reads as a 32x32-pixel tile. Keep large shapes bold so the texture stays readable when scaled down.
Theme: pastel spring garden: pink cherry-blossom petals on grass, clover, flowerbeds, moss, soft earth, pink garden stones, tall meadow grass and a golden-tinted dragon hill grass
Tiles in order (left to right, top to bottom):
1) grass covered with sparse pink petals, 2) petals denser, 3) petals dense pink carpet, 4) clover patch A, 5) clover patch B, 6) pink flowerbed, 7) yellow flowerbed, 8) mossy ground, 9) soft dark earth A, 10) soft earth B, 11) ground with small creeping vines, 12) pink-grey garden path stones A, 13) garden path stones B, 14) tall meadow grass A, 15) tall meadow grass B, 16) grass with a golden tint and tiny gold sparkles
```

- [x] #129 생성·저장 완료

## #130 · 지면 시트 — frost

- **저장 이름**: `tmp/world-src/terrain/terrain-frost.png` (1024×1024 (4×4), P1)
- **스레드**: ↪ **이어서** — `T-TERRAIN` (이 스레드의 첫 스텝 #008을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 terrain-core 결과: `tmp/world-src/terrain/terrain-core.png`
- **검수 체크**: 16칸 모두 꽉 채워짐, 타일 사이 경계선 없음, 가장자리가 이어져 보임, 글자/그림자 없음
- **변환**: `pnpm convert:world-art -- terrain frost`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Create a seamless tileset texture sheet for a top-down pixel-art RPG on one 1024x1024 canvas: a strict 4x4 grid of 16 square tiles (each 256x256, no gaps, no borders, no grid lines, tiles fill the whole canvas, no transparency). EVERY tile must tile seamlessly with itself on all four edges (left edge matches right edge, top matches bottom). Straight top-down texture, no perspective, no objects casting shadows, no text. Each visible pixel block is about 8 px so the art reads as a 32x32-pixel tile. Keep large shapes bold so the texture stays readable when scaled down.
Theme: cold twilight lakeside: snow, smooth ice rink surface, frosted grass, dark blue night grass with tiny glowing specks, star-patterned stone
Tiles in order (left to right, top to bottom):
1) snow A, 2) snow B, 3) snow with footprints, 4) smooth pale-blue ice A, 5) ice B with cracks, 6) ice C with scratch marks from skates, 7) frosted grass A, 8) frosted grass B, 9) deep blue night grass A, 10) night grass B with tiny glowing specks, 11) night grass C, 12) dark blue stone with tiny star patterns A, 13) star stone B, 14) starlit path stones A (faint glow), 15) starlit path stones B, 16) ice with a faint blue rink line
```

- [x] #130 생성·저장 완료

## #131 · 지면 시트 — industrial

- **저장 이름**: `tmp/world-src/terrain/terrain-industrial.png` (1024×1024 (4×4), P1)
- **스레드**: ↪ **이어서** — `T-TERRAIN` (이 스레드의 첫 스텝 #008을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 terrain-core 결과: `tmp/world-src/terrain/terrain-core.png`
- **검수 체크**: 16칸 모두 꽉 채워짐, 타일 사이 경계선 없음, 가장자리가 이어져 보임, 글자/그림자 없음
- **변환**: `pnpm convert:world-art -- terrain industrial`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Create a seamless tileset texture sheet for a top-down pixel-art RPG on one 1024x1024 canvas: a strict 4x4 grid of 16 square tiles (each 256x256, no gaps, no borders, no grid lines, tiles fill the whole canvas, no transparency). EVERY tile must tile seamlessly with itself on all four edges (left edge matches right edge, top matches bottom). Straight top-down texture, no perspective, no objects casting shadows, no text. Each visible pixel block is about 8 px so the art reads as a 32x32-pixel tile. Keep large shapes bold so the texture stays readable when scaled down.
Theme: hot industrial district: cracked volcanic rock, glowing orange lava cracks, ash, riveted metal plates, grates, asphalt with caution stripes, red circuit-pattern floor
Tiles in order (left to right, top to bottom):
1) cracked dark rock A, 2) cracked rock B, 3) rock with glowing lava cracks A, 4) lava cracks B (brighter), 5) grey ash ground A, 6) ash B, 7) riveted metal plate A, 8) metal plate B (scratched), 9) metal floor grate, 10) worn asphalt A, 11) asphalt B, 12) yellow-black caution stripe tile, 13) dark gunmetal floor with red circuit lines A, 14) circuit floor B, 15) scorched dirt, 16) bubbling lava pool
```

- [x] #131 생성·저장 완료

## #132 · 지면 시트 — cloud

- **저장 이름**: `tmp/world-src/terrain/terrain-cloud.png` (1024×1024 (4×4), P1)
- **스레드**: ↪ **이어서** — `T-TERRAIN` (이 스레드의 첫 스텝 #008을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 terrain-core 결과: `tmp/world-src/terrain/terrain-core.png`
- **검수 체크**: 16칸 모두 꽉 채워짐, 타일 사이 경계선 없음, 가장자리가 이어져 보임, 글자/그림자 없음
- **변환**: `pnpm convert:world-art -- terrain cloud`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Create a seamless tileset texture sheet for a top-down pixel-art RPG on one 1024x1024 canvas: a strict 4x4 grid of 16 square tiles (each 256x256, no gaps, no borders, no grid lines, tiles fill the whole canvas, no transparency). EVERY tile must tile seamlessly with itself on all four edges (left edge matches right edge, top matches bottom). Straight top-down texture, no perspective, no objects casting shadows, no text. Each visible pixel block is about 8 px so the art reads as a 32x32-pixel tile. Keep large shapes bold so the texture stays readable when scaled down.
Theme: sky-high stone terrace with fluffy cloud puffs, pale blue-white cloud stone, glowing violet rune slabs, sky tiles, wind-swept grass and blue marble
Tiles in order (left to right, top to bottom):
1) pale cloud-stone A, 2) cloud-stone B, 3) soft cloud puff ground A, 4) cloud puff B, 5) violet rune slab with glowing symbol A (abstract runes, not letters), 6) rune slab B, 7) dim inactive rune slab, 8) sky-blue glass tile A, 9) sky tile B, 10) wind-swept grass A, 11) wind grass B, 12) blue marble A, 13) blue marble B, 14) mossy stone A, 15) mossy stone B, 16) large glowing rune circle centre tile
```

- [x] #132 생성·저장 완료

## #133 · 지면 시트 — weed

- **저장 이름**: `tmp/world-src/terrain/terrain-weed.png` (1024×1024 (4×4), P1)
- **스레드**: ↪ **이어서** — `T-TERRAIN` (이 스레드의 첫 스텝 #008을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 terrain-core 결과: `tmp/world-src/terrain/terrain-core.png`
- **검수 체크**: 16칸 모두 꽉 채워짐, 타일 사이 경계선 없음, 가장자리가 이어져 보임, 글자/그림자 없음
- **변환**: `pnpm convert:world-art -- terrain weed`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Create a seamless tileset texture sheet for a top-down pixel-art RPG on one 1024x1024 canvas: a strict 4x4 grid of 16 square tiles (each 256x256, no gaps, no borders, no grid lines, tiles fill the whole canvas, no transparency). EVERY tile must tile seamlessly with itself on all four edges (left edge matches right edge, top matches bottom). Straight top-down texture, no perspective, no objects casting shadows, no text. Each visible pixel block is about 8 px so the art reads as a 32x32-pixel tile. Keep large shapes bold so the texture stays readable when scaled down.
Theme: barren grey land of a weed-killing factory: shaved bare ground, cracked concrete, over-mowed stripes, gravel, oil stains, sawdust, mower tracks, dead weed patches. Desaturated grey with rust-orange accents
Tiles in order (left to right, top to bottom):
1) bare grey ground A, 2) ground B, 3) ground C, 4) ground D, 5) cracked concrete A, 6) concrete B, 7) over-mown pale stripes A (very short dead grass), 8) stripes B, 9) gravel A, 10) gravel B, 11) dark oil stain, 12) sawdust and wood chips, 13) mower wheel tracks A, 14) tracks B, 15) barren dry dirt, 16) patch of dead brown weeds
```

- [x] #133 생성·저장 완료

## #134 · 소품 시트 — spring

- **저장 이름**: `tmp/world-src/props/props-spring.png` (1536×1024 (4×3), P1)
- **스레드**: 🆕 **새 스레드 시작** — `T-PROPS-2`
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 props-trees 결과: `tmp/world-src/props/props-trees.png`
- **검수 체크**: 12칸에 오브젝트 1개씩, 각 칸 중앙·80% 크기, 바닥 그림자/배경 잔여물 없음, 칸 경계선 없음
- **변환**: `pnpm convert:world-art -- props spring`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Create a pixel-art prop sheet for a top-down 3/4-view RPG on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows (12 cells, each 384x341), exactly one object per cell, centred and filling about 80% of its cell. Transparent background (or flat #FF00FF), no ground plane, NO cast shadow on the ground, light from the top-left, no cell borders or grid lines, at least 8% empty margin inside every cell, no text or letters.
Theme: pastel spring garden and a golden dragon hill: pink and lime colours, gold and red accents
Objects in order (left to right, top to bottom):
1) arch gate covered in cherry blossoms, 2) flower arch in mixed colours, 3) wooden vine trellis with green vines, 4) pink stone garden lantern, 5) pile of pink petals on the ground, 6) large coiled golden dragon statue, 7) golden dragon egg on a stone stand, 8) small koi pond with a stone rim, 9) tiny arched wooden bridge, 10) scarecrow wearing a mint scarf, 11) picnic blanket with a basket (top-down flat), 12) hanging wind chime on a post
```

- [x] #134 생성·저장 완료

## #135 · 소품 시트 — frost

- **저장 이름**: `tmp/world-src/props/props-frost.png` (1536×1024 (4×3), P1)
- **스레드**: ↪ **이어서** — `T-PROPS-2` (이 스레드의 첫 스텝 #134을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 props-trees 결과: `tmp/world-src/props/props-trees.png`
- **검수 체크**: 12칸에 오브젝트 1개씩, 각 칸 중앙·80% 크기, 바닥 그림자/배경 잔여물 없음, 칸 경계선 없음
- **변환**: `pnpm convert:world-art -- props frost`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Create a pixel-art prop sheet for a top-down 3/4-view RPG on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows (12 cells, each 384x341), exactly one object per cell, centred and filling about 80% of its cell. Transparent background (or flat #FF00FF), no ground plane, NO cast shadow on the ground, light from the top-left, no cell borders or grid lines, at least 8% empty margin inside every cell, no text or letters.
Theme: cold twilight lakeside: blue-white ice crystals, star lamps, dark blue night flowers, wooden docks
Objects in order (left to right, top to bottom):
1) tall blue ice crystal cluster A, 2) ice crystal cluster B, 3) friendly snowman with a mint scarf, 4) outdoor brass telescope on a tripod, 5) glowing star-shaped street lamp, 6) ice-rink boards horizontal (white barrier with blue top), 7) ice-rink boards vertical, 8) glowing night flower patch, 9) small wooden rowing boat, 10) wooden dock post with a rope, 11) pier lantern glowing warm yellow, 12) cluster of lily pads with a pink flower
```

- [x] #135 생성·저장 완료

## #136 · 소품 시트 — forge

- **저장 이름**: `tmp/world-src/props/props-forge.png` (1536×1024 (4×3), P1)
- **스레드**: ↪ **이어서** — `T-PROPS-2` (이 스레드의 첫 스텝 #134을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 props-trees 결과: `tmp/world-src/props/props-trees.png`
- **검수 체크**: 12칸에 오브젝트 1개씩, 각 칸 중앙·80% 크기, 바닥 그림자/배경 잔여물 없음, 칸 경계선 없음
- **변환**: `pnpm convert:world-art -- props forge`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Create a pixel-art prop sheet for a top-down 3/4-view RPG on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows (12 cells, each 384x341), exactly one object per cell, centred and filling about 80% of its cell. Transparent background (or flat #FF00FF), no ground plane, NO cast shadow on the ground, light from the top-left, no cell borders or grid lines, at least 8% empty margin inside every cell, no text or letters.
Theme: industrial workshop yard with orange lava glow and navy-emerald lightning accents: pipes, barrels, crates, generators
Objects in order (left to right, top to bottom):
1) horizontal steel pipe, 2) vertical steel pipe, 3) pipe corner joint, 4) red oil barrel, 5) grey metal barrel, 6) stack of wooden crates, 7) portable generator with a lightning symbol (no text), 8) lava vent with rising embers, 9) small brick chimney with smoke, 10) blacksmith anvil, 11) wall tool rack with wrenches, 12) scrap metal pile
```

- [x] #136 생성·저장 완료

## #137 · 소품 시트 — cloud

- **저장 이름**: `tmp/world-src/props/props-cloud.png` (1536×1024 (4×3), P1)
- **스레드**: ↪ **이어서** — `T-PROPS-2` (이 스레드의 첫 스텝 #134을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 props-trees 결과: `tmp/world-src/props/props-trees.png`
- **검수 체크**: 12칸에 오브젝트 1개씩, 각 칸 중앙·80% 크기, 바닥 그림자/배경 잔여물 없음, 칸 경계선 없음
- **변환**: `pnpm convert:world-art -- props cloud`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Create a pixel-art prop sheet for a top-down 3/4-view RPG on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows (12 cells, each 384x341), exactly one object per cell, centred and filling about 80% of its cell. Transparent background (or flat #FF00FF), no ground plane, NO cast shadow on the ground, light from the top-left, no cell borders or grid lines, at least 8% empty margin inside every cell, no text or letters.
Theme: floating sky terrace and arcane rune hill: white and sky-blue stone, glowing violet runes and crystals
Objects in order (left to right, top to bottom):
1) fluffy cloud pillar, 2) bench shaped like a cloud, 3) standing rune stone A with glowing violet abstract symbols, 4) standing rune stone B, 5) large ground rune circle decal (top-down flat, glowing violet), 6) floating violet crystal, 7) floating open book with glowing pages (no readable text), 8) wind vane, 9) cloud fountain with pale water, 10) sky-blue banner on a pole with a text-free sprout shield, 11) stone archway, 12) small cloud staircase (three steps)
```

- [x] #137 생성·저장 완료

## #138 · 소품 시트 — weed

- **저장 이름**: `tmp/world-src/props/props-weed.png` (1536×1024 (4×3), P1)
- **스레드**: ↪ **이어서** — `T-PROPS-2` (이 스레드의 첫 스텝 #134을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 props-trees 결과: `tmp/world-src/props/props-trees.png`
- **검수 체크**: 12칸에 오브젝트 1개씩, 각 칸 중앙·80% 크기, 바닥 그림자/배경 잔여물 없음, 칸 경계선 없음
- **변환**: `pnpm convert:world-art -- props weed`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Create a pixel-art prop sheet for a top-down 3/4-view RPG on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows (12 cells, each 384x341), exactly one object per cell, centred and filling about 80% of its cell. Transparent background (or flat #FF00FF), no ground plane, NO cast shadow on the ground, light from the top-left, no cell borders or grid lines, at least 8% empty margin inside every cell, no text or letters.
Theme: grey weed-killing factory yard: rusty grey and rust-orange metal, warning colours, sinister but comedic
Objects in order (left to right, top to bottom):
1) large ride-on lawn mower with big blades, 2) push lawn mower, 3) barbed-wire fence segment horizontal, 4) barbed-wire fence segment vertical, 5) warning sign with a crossed-out sprout symbol (no text), 6) heap of cut grass clippings, 7) striped barricade, 8) rusty oil drum, 9) stack of old tires, 10) tall floodlight on a pole, 11) tall factory chimney with grey smoke, 12) stone statue of a grumpy king holding a grass trimmer
```

- [x] #138 생성·저장 완료

## #139 · 건물 — cafe (최종 224×160px)

- **저장 이름**: `tmp/world-src/buildings/bld-cafe.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-BLD-2` (이 스레드의 첫 스텝 #075을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 승인된 건물 1장: `tmp/world-src/buildings/bld-house-janine95kim.png`
- **검수 체크**: 문이 하단 중앙, 배경 투명/마젠타 단색, 지면·그림자 없음, 글자 없음
- **변환**: `pnpm convert:world-art -- buildings cafe`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Draw a single building for a top-down 3/4-view pixel-art RPG (classic Pokemon/Zelda camera: you see the front facade and the roof from above at about 45 degrees). a cosy community cafe: warm wood building with green ivy, a blank chalkboard, round windows, string lights, outdoor tables with umbrellas, a steaming cup sign shape (no text)
Rules: the door is at the bottom centre of the front facade with a small step; transparent background (or flat #FF00FF); NO ground, NO cast shadow, NO grass around the base; the building fills about 90% of the canvas width and sits on the bottom edge; light from the top-left; no text or letters anywhere (signs and boards are blank shapes, emblems are text-free); crisp pixel outline, three-step shading.
Canvas: 1536×1024.
```

- [x] #139 생성·저장 완료

## #140 · 건물 — factory (최종 416×320px)

- **저장 이름**: `tmp/world-src/buildings/bld-factory.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-BLD-2` (이 스레드의 첫 스텝 #075을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 승인된 건물 1장: `tmp/world-src/buildings/bld-house-janine95kim.png`
- **검수 체크**: 문이 하단 중앙, 배경 투명/마젠타 단색, 지면·그림자 없음, 글자 없음
- **변환**: `pnpm convert:world-art -- buildings factory`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Draw a single building for a top-down 3/4-view pixel-art RPG (classic Pokemon/Zelda camera: you see the front facade and the roof from above at about 45 degrees). a grey industrial weed-killing factory: rusty grey and orange steel building, a tall smokestack, conveyor pipes, a big spinning mower-blade emblem above the gate, warning stripes, barbed fence sections, a few withered plants
Rules: the door is at the bottom centre of the front facade with a small step; transparent background (or flat #FF00FF); NO ground, NO cast shadow, NO grass around the base; the building fills about 90% of the canvas width and sits on the bottom edge; light from the top-left; no text or letters anywhere (signs and boards are blank shapes, emblems are text-free); crisp pixel outline, three-step shading.
Canvas: 1536×1024.
```

- [x] #140 생성·저장 완료

## #141 · 실내 — cafe (최종 640×384)

- **저장 이름**: `tmp/world-src/interiors/int-cafe.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-INT-2` (이 스레드의 첫 스텝 #089을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 카페 외관: `tmp/world-src/buildings/bld-cafe.png`
  - (선택) 톤 통일용 승인된 실내 1장: `tmp/world-src/interiors/int-house-janine95kim.png`
- **검수 체크**: 문(하단 중앙)·열린 바닥 공간 확보, 캐릭터 없음, 글자 없음, 가구 배치가 03 문서 조사 포인트와 대체로 일치
- **변환**: `pnpm convert:world-art -- interiors cafe`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
The attached image (if provided) is the exterior or a sibling room of this place: match its colours, materials and mood.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Draw a single-screen interior of a cosy community cafe for a top-down 3/4-view pixel-art RPG (classic Pokemon/Stardew interior: cutaway room with the back wall and side walls visible, the floor seen from about 45 degrees). Landscape 1536x1024; the room fills the frame edge to edge with a thin dark wall border. Keep a clear open floor area in the lower-middle for walking and a door opening with a small doormat at the bottom centre. Round tables with chairs; a coffee machine at the back right; a big blank message board on the back wall covered with pinned papers (abstract); warm lamps
Rules: no characters, no people; no readable text or letters anywhere (papers, boards and screens show abstract shapes); light from the top-left; crisp pixel outline, three-step shading; warm and cosy. Furniture is placed as described (left/right are from the viewer's view).
```

- [x] #141 생성·저장 완료

## #142 · 실내 — clubhouse-trophy (최종 640×384)

- **저장 이름**: `tmp/world-src/interiors/int-clubhouse-trophy.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-INT-2` (이 스레드의 첫 스텝 #089을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 같은 건물 로비 실내: `tmp/world-src/interiors/int-clubhouse-lobby.png`
- **검수 체크**: 문(하단 중앙)·열린 바닥 공간 확보, 캐릭터 없음, 글자 없음, 가구 배치가 03 문서 조사 포인트와 대체로 일치
- **변환**: `pnpm convert:world-art -- interiors clubhouse-trophy`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
The attached image (if provided) is the exterior or a sibling room of this place: match its colours, materials and mood.

Draw a single-screen interior of a trophy room for a top-down 3/4-view pixel-art RPG (classic Pokemon/Stardew interior: cutaway room with the back wall and side walls visible, the floor seen from about 45 degrees). Landscape 1536x1024; the room fills the frame edge to edge with a thin dark wall border. Keep a clear open floor area in the lower-middle for walking and a door opening with a small doormat at the bottom centre. A large empty photo frame hanging on the back centre wall; glass cases with cups and medals along both walls; a red carpet runner; warm spotlights
Rules: no characters, no people; no readable text or letters anywhere (papers, boards and screens show abstract shapes); light from the top-left; crisp pixel outline, three-step shading; warm and cosy. Furniture is placed as described (left/right are from the viewer's view).
```

- [x] #142 생성·저장 완료

## #143 · 실내 — factory (최종 640×384)

- **저장 이름**: `tmp/world-src/interiors/int-factory.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-INT-2` (이 스레드의 첫 스텝 #089을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 공장 외관: `tmp/world-src/buildings/bld-factory.png`
  - (선택) 톤 통일용 승인된 실내 1장: `tmp/world-src/interiors/int-house-janine95kim.png`
- **검수 체크**: 문(하단 중앙)·열린 바닥 공간 확보, 캐릭터 없음, 글자 없음, 가구 배치가 03 문서 조사 포인트와 대체로 일치
- **변환**: `pnpm convert:world-art -- interiors factory`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Camera: classic 3/4 top-down RPG view (about 45 degrees).
The attached image (if provided) is the exterior or a sibling room of this place: match its colours, materials and mood.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Draw a single-screen interior of the inside of a grey weed-killing factory for a top-down 3/4-view pixel-art RPG (classic Pokemon/Stardew interior: cutaway room with the back wall and side walls visible, the floor seen from about 45 degrees). Landscape 1536x1024; the room fills the frame edge to edge with a thin dark wall border. Keep a clear open floor area in the lower-middle for walking and a door opening with a small doormat at the bottom centre. A conveyor belt carrying lawn mower blades across the middle; a heavy safe at the back right; warning signs (no text); pipes on the walls; grey and rust-orange
Rules: no characters, no people; no readable text or letters anywhere (papers, boards and screens show abstract shapes); light from the top-left; crisp pixel outline, three-step shading; warm and cosy. Furniture is placed as described (left/right are from the viewer's view).
```

- [x] #143 생성·저장 완료

## #144 · 아이콘 시트 — 뱃지 (12칸)

- **저장 이름**: `tmp/world-src/ui/ui-badges.png` (1536×1024 (4×3), P1)
- **스레드**: ↪ **이어서** — `T-UI-FRAMES` (이 스레드의 첫 스텝 #011을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 프레임 디자인 통일용 ui-frames-dialog 결과: `tmp/world-src/ui/ui-frames-dialog.png`
- **검수 체크**: 12개 뱃지가 48px에서 읽힘, 글자 없음
- **변환**: `pnpm convert:world-art -- ui badges`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Match the design language of the attached image.

Create a pixel-art UI badge sheet for a game on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows (12 cells, each 384x341), exactly one icon per cell, centred, transparent background (or flat #FF00FF), no cell borders or grid lines, at least 10% empty margin in each cell, no text or letters. Each icon is a simple bold symbol on a small round or square plate, readable at 32x32 px. Design language: dark teal panels (#0b1614) with mint (#00e9ae) pixel trim and small leaf-shaped corner ornaments, cream paper for parchment items, warm gold accents (#ffd54a), matching the 잔디동 football club identity (mint and white, sprout shield).
Badges in order (left to right, top to bottom):
1) first game badge (a small arcade joystick), 2) five grass shards badge (five green crystals), 3) ten grass shards badge (ten crystals in a golden ring), 4) defeated the weed king badge (a broken mower blade), 5) ball hunter badge (a football with a magnifying glass), 6) ball collector badge (a bronze football trophy), 7) ball master badge (a golden football trophy), 8) green thumb badge (a watering can with a sprout), 9) card collector badge (three fanned cards), 10) runner 1000 metres badge (a running shoe with wings), 11) daily stamp 7 badge (a calendar with a check, silver), 12) daily stamp 30 badge (a calendar with a check, gold)
```

- [x] #144 생성·저장 완료

## #145 · FX 시트 — emotes

- **저장 이름**: `tmp/world-src/fx/fx-emotes.png` (1536×1024 (4×3), P1)
- **스레드**: ↪ **이어서** — `T-FX` (이 스레드의 첫 스텝 #106을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 fx-markers 결과: `tmp/world-src/fx/fx-markers.png`
- **검수 체크**: 12칸 1개씩, 기호(! ? …)는 도형, 글자 없음, 경계선 없음
- **변환**: `pnpm convert:world-art -- fx emotes`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Create a pixel-art prop sheet for a top-down 3/4-view RPG on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows (12 cells, each 384x341), exactly one object per cell, centred and filling about 80% of its cell. Transparent background (or flat #FF00FF), no ground plane, NO cast shadow on the ground, light from the top-left, no cell borders or grid lines, at least 8% empty margin inside every cell, no text or letters.
Theme: tiny round emote speech balloons with a white bubble and a small tail at the bottom, each containing one icon
Objects in order (left to right, top to bottom):
1) an exclamation-mark symbol, 2) a question-mark symbol, 3) three dots, 4) a pink heart, 5) a music note, 6) an angry vein mark, 7) a sweat drop, 8) a sparkle, 9) sleeping z symbols, 10) a double exclamation-mark symbol, 11) an exclamation-mark and question-mark pair, 12) a gold star
```

- [x] #145 생성·저장 완료

## #146 · FX 시트 — world

- **저장 이름**: `tmp/world-src/fx/fx-world.png` (1536×1024 (4×3), P1)
- **스레드**: ↪ **이어서** — `T-FX` (이 스레드의 첫 스텝 #106을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 톤 통일용 fx-markers 결과: `tmp/world-src/fx/fx-markers.png`
- **검수 체크**: 12칸 1개씩, 기호(! ? …)는 도형, 글자 없음, 경계선 없음
- **변환**: `pnpm convert:world-art -- fx world`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
If an extra image is attached, it is only a style sample from the same game (a different subject): match its pixel size, outline and shading, but do not copy its subject.

Create a pixel-art prop sheet for a top-down 3/4-view RPG on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows (12 cells, each 384x341), exactly one object per cell, centred and filling about 80% of its cell. Transparent background (or flat #FF00FF), no ground plane, NO cast shadow on the ground, light from the top-left, no cell borders or grid lines, at least 8% empty margin inside every cell, no text or letters.
Theme: nature effects for a top-down RPG: grass growing burst, water ripples, splash
Objects in order (left to right, top to bottom):
1-6) a six-frame animation of grass and flowers rapidly sprouting and blooming out from a centre point (frame 1 tiny sprouts, frame 6 lush blossoms), 7-10) a four-frame expanding water ripple ring seen from above, 11) a water splash small, 12) a water splash large
```

- [x] #146 생성·저장 완료

## #147 · 잔디 러시 — 원경 배경

- **저장 이름**: `tmp/world-src/rush/rush-bg-far.png` (1536×1024, P1)
- **스레드**: 🆕 **새 스레드 시작** — `T-RUSH`
- **레퍼런스 첨부**: 없음
- **검수 체크**: 좌우 가장자리가 이어짐, 캐릭터·글자 없음
- **변환**: `pnpm convert:world-art -- rush bg-far`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.

A wide 2D side-scrolling background layer, far distance: a bright sky with soft clouds and a distant football stadium skyline with floodlights, gentle hills. Seamless horizontally (left edge matches right edge). Pixel art, calm colours, no characters, no text. Canvas 1536x1024.
```

- [x] #147 생성·저장 완료

## #148 · 잔디 러시 — 중경 배경

- **저장 이름**: `tmp/world-src/rush/rush-bg-mid.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-RUSH` (이 스레드의 첫 스텝 #147을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 직전 결과 rush-bg-far: `tmp/world-src/rush/rush-bg-far.png`
- **검수 체크**: 지평선 위쪽 투명, 좌우 가장자리 이어짐
- **변환**: `pnpm convert:world-art -- rush bg-mid`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Match the style, colours and horizon of the attached image.

A wide 2D side-scrolling background layer, mid distance, transparent above the horizon: a row of trees, hedges, a wooden fence and small grandstands along the ground line, at the bottom third of the image. Seamless horizontally. Pixel art, no characters, no text. Canvas 1536x1024.
```

- [x] #148 생성·저장 완료

## #149 · 잔디 러시 — 지면 띠

- **저장 이름**: `tmp/world-src/rush/rush-ground.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-RUSH` (이 스레드의 첫 스텝 #147을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 직전 결과 rush-bg-far: `tmp/world-src/rush/rush-bg-far.png`
- **검수 체크**: 좌우 가장자리 이어짐, 윗선이 선명
- **변환**: `pnpm convert:world-art -- rush ground`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Match the style and colours of the attached image.

A horizontal strip of football pitch grass seen from the side for a 2D runner: the top edge is a crisp grass line with tiny blades, under it lush striped grass and soil. Seamless horizontally. Pixel art, no characters, no text. Canvas 1536x1024, the strip centred vertically.
```

- [x] #149 생성·저장 완료

## #150 · 잔디 러시 — 장애물·수집품 시트 (12칸)

- **저장 이름**: `tmp/world-src/rush/rush-obstacles.png` (1536×1024 (4×3), P1)
- **스레드**: ↪ **이어서** — `T-RUSH` (이 스레드의 첫 스텝 #147을 만든 대화)
- **레퍼런스 첨부**:
  - (선택) 직전 결과 rush-ground: `tmp/world-src/rush/rush-ground.png`
- **검수 체크**: 12칸 1개씩, 모두 옆에서 본 시점, 그림자 없음
- **변환**: `pnpm convert:world-art -- rush obstacles`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Match the style of the attached image if provided.

Create a pixel-art prop sheet for a 2D side-view runner on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows (12 cells, each 384x341), exactly one object per cell, centred and filling about 80% of its cell. Transparent background (or flat #FF00FF), no ground plane, NO cast shadow on the ground, light from the top-left, no cell borders or grid lines, at least 8% empty margin inside every cell, no text or letters.
Theme: side-view obstacles and pickups for a 2D runner
Objects in order (left to right, top to bottom):
1) a grey ride-on lawn mower facing left, 2) an orange cone, 3) a training hurdle, 4) a sliding-tackle defender in a grey kit lying low (no face detail), 5) a standing defender in a grey kit with arms out, 6) a low hanging banner (must be slid under, text-free), 7) a puddle, 8) a lawn sprinkler spraying water, 9) a mint-and-gold grass seed, 10) a golden football, 11) a magnet power-up, 12) a shield power-up
```

- [x] #150 생성·저장 완료

---

# Phase 7 — P2 (여력 시)

## #151 · 잔디 러시 — 제초 공장 배경(엔딩 후 스킨)

- **저장 이름**: `tmp/world-src/rush/rush-bg-factory.png` (1536×1024, P2)
- **스레드**: ↪ **이어서** — `T-RUSH` (이 스레드의 첫 스텝 #147을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** rush-bg-far 결과: `tmp/world-src/rush/rush-bg-far.png`
- **검수 체크**: bg-far와 같은 구도, 색만 산업 톤
- **변환**: `pnpm convert:world-art -- rush bg-factory`

**프롬프트**

```text
Style: high-detail 2D pixel art in the look of a modern 32-bit JRPG (Stardew Valley / Octopath sprite quality), chunky clearly visible pixel blocks (each about 14 px on a 1024 px canvas), crisp 1-pixel outlines in dark teal (#16302e, never pure black), three-step cel shading, warm clean cheerful colours. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. Never render readable text, letters, numbers or logos, and add no watermark or signature.
Keep the same composition, horizon and pixel style as the attached image.

A wide 2D side-scrolling background layer, far distance: a grey weed-killing factory skyline with smokestacks under an orange sunset sky, desaturated colours. Seamless horizontally (left edge matches right edge). Pixel art, calm colours, no characters, no text. Canvas 1536x1024.
```

- [x] #151 생성·저장 완료
