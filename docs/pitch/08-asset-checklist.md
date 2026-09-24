# 08. 에셋·산출물 체크리스트

전체 에셋과 구현 산출물의 **진행 현황판**이다. 이미지의 개별 진행(#001~#123)은 [09 진행 표](09-image-generation-runbook.md#진행-표)에서 체크하고, 이 문서에는 **그룹별 합계와 변환 산출물**을 기록한다. 상태 표기: `[ ]` 미착수 · `[~]` 원본 생성됨(변환 전) · `[x]` 변환·통합 완료. 우선순위: P0=A1 필요 · P1=A2·A3 필요 · P2=폴리시.

## 1. 이미지 생성 합계 (원본 → `tmp/pitch-src/`)

| 그룹 | 스텝 | 수 | 우선순위 | 세션 | 상태 |
| --- | --- | --- | --- | --- | --- |
| 필드 플레이어 12명 × 8시트 — 우왁굳(파일럿) | #001~#008 | 8 | P0 | A1 | [x] |
| 공용 코어(피치 배경·골·볼·FX2·UI 프레임/버튼/HUD 3·로딩·로더) | #009~#020 | 12 | P0 | A1 | [x] |
| AI 골키퍼 K①~K⑤ | #021~#025 | 5 | P0 | A1 | [x] |
| 필드 플레이어 나머지 11명 × 8시트 | #026~#113 | 88 | P1 | A2 | [x] |
| 선택 UI·선택 배경·연출 FX | #114~#116 | 3 | P1 | A2 | [x] |
| 락커룸 게이트·배경·소품·스탯 UI·아이콘 | #117~#121 | 5 | P1 | A3 | [x] |
| 폴리시(필드 소품·관중) | #122~#123 | 2 | P2 | P7 | [~] 변환 완료(`env/crowd-*`·`ad-*`·콘·플래그 등). **코너 플래그 2장만 사용**(core), 나머지는 미사용(README 백로그 B7) |
| **합계** | | **123** | | | |

- 캐릭터 진행(12명, 각 8시트): 우왁굳 [ ] · 재닌 [ ] · 뽀린걸 [ ] · 핑구 [ ] · 문모모 [ ] · 하치 [ ] · 한결 [ ] · 쥬멩이 [ ] · 해파린 [ ] · 빙밍 [ ] · 다시바 [ ] · 리냐 [ ] · keeper-ai [ ]

## 2. 변환 산출물 (`src/web/assets/pitch/`)

| 파일 | 규격 | 수 | 생성 세션 | 상태 |
| --- | --- | --- | --- | --- |
| `characters/<id>-atlas.webp` (12명) | 960×960(10×10셀 96×96) | 12 | A1·A2 | [x] 12/12 |
| `characters/keeper-ai-atlas.webp` (+ 다이브 셀 192×96) | 시트별 | 1 | A1 | [x] |
| `characters/<id>-hero.webp` | 최대 높이 384 | 12 | A1·A2 | [x] 12/12 |
| `portraits/<id>-<neutral\|confident\|celebrate\|disappointed>.webp` | 192×192 | 48 | A1·A2 | [x] 48/48 |
| `env/pitch-bg.webp`, `env/locker-bg.webp` | 960×540 | 2 | A1·A3 | [x] |
| `env/goal-*.webp`(뒤/앞/리플4), `env/ball-*.webp`(회전8+그림자 등) | 셀별 | ~14 | A1 | [x] |
| `env/gate-*.webp`, `env/terminal-*`·`exit-*`·`locker-unit*`·소품 | 셀별 | 17 | A3 | [x] |
| `fx/*.webp`(impact, shot, celebrate) | 스트립/셀 | ~40 | A1·A2 | [x] |
| `ui/*.webp`(frames, buttons, hud, select, stat, icons, loader) | 셀별 + 9-slice | ~120 | A1~A3 | [~] select·stat·locker 전부 [x] (A3: 9-slice 대칭 경고 수용, 05 §7) |
| `keyart/loading-bg.webp`, `keyart/select-bg.webp` | 960×540 | 2 | A1·A2 | [x] |
| `tmp/pitch-src/qa-report.json` | QA 리포트 | 1 | A1~ | [x] |

## 3. 오디오 ([06](06-audio.md))

| 구분 | 수 | P0 | P1 | 확보 |
| --- | --- | --- | --- | --- |
| BGM | 3 | B1·B2 | B3 | 3 / 3 |
| SFX | 50 | 32 | 18 | 44 / 50 (+ `pitch-miss-whoos.mp3` 이름 오타 1개 — 코드는 두 철자 모두 인식) |

- 미확보(P4 시점 실측, [06 §3-1](06-audio.md)): `pitch-aim-tick`(P0) · `pitch-ball-loose`·`pitch-goal-horn`·`pitch-stat-on`·`pitch-stat-soon`(P1). 없는 소리는 무음으로 동작한다.
- 출처/라이선스는 06 §5 표에 누적(확보 파일 47개의 출처는 아직 미기록). CC-BY 표기가 필요한 파일이 생기면 크레딧 항목 추가(P7 에서는 근거가 없어 미구현, README 백로그 B4).
- **`victory.mp3` 사용 금지**(다른 기능 전용).

## 4. 구현 산출물 (코드)

| 세션 | 산출물 | 상태 |
| --- | --- | --- |
| P1 | `Root.tsx`, `entryMode.ts`, `storage.ts` 추가분, `TopBar.tsx` 복귀 버튼, `pitch/PitchEntry.tsx`, `pitch/engine/{stage,input,sceneManager,assets,text}.ts`, `LoadingScene`, 임시 `PitchScene`, 테스트 | [x] |
| A1 | `scripts/convert-pitch-art.mjs`, `scripts/pitch-art-manifest.json`, `package.json` script, `pitch/data/animations.ts`, 에셋 키 맵, 테스트 | [x] |
| P2 | `game/{player,ball,tuning}.ts`, `engine/{sprite,particles}.ts`, `data/characters.ts`(1명), 실제 `PitchScene`, 테스트(player 17 · ball 17 · particles 4) | [x] |
| P3 | `game/{shot,keeper,match,montecarlo,rng,tuning}.ts`, `ball.ts`(shot 모드), 게이지 HUD(`scenes/shotHud.ts`), 디버그 패널(`scenes/pitchDebug.ts`), Monte Carlo 테스트 | [x] |
| P4 | `game/{skills,stats}.ts`, `audio/{pitchAudio,sfxMap}.ts`, `engine/{tween,effects}.ts`, `scenes/styleHud.ts`, 연출·배너·소리·기록 저장, 테스트 | [x] |
| A2 | `characterAssets.test.ts`(12명 atlas/초상화/hero/select 그룹/9-slice), 04 §10 검수 기록(변환 자체는 A1 `--all`) | [x] |
| P5 | `scenes/{CharacterSelectScene,selectGrid}.ts`, `data/characters.ts`(12명), lazy 그룹 로딩 | [x] |
| P6 | `scenes/{LockerScene,StatScene,hudCommon}.ts`, `game/locker.ts`, `data/stats.ts`, `ui/hexagon.ts`, 게이트 상호작용(`PitchScene`), `SceneHost.announce`, 테스트 4파일 | [x] |
| P6b | `data/stats.ts` 실제 스탯 정의, `ui/statDetail.ts`, 스탯 패널 UI(태그·판정 기준·세부 항목), 범례, 휠 스크롤 | [x] |
| P7 | `engine/perf.ts`(프레임 미터), `entryNotice.ts`, `storage.ts` 메모리 폴백, Backspace 탈출, 코너 플래그, `goal-horn` 연결, 성능 리포트(01 §7-1), 테스트(perf·assetBudget 등). prefetch·난이도·크레딧은 미구현 결정 | [x] |
| P8 | 터치 기기 = 항상 대시보드, 피치 복귀 버튼 숨김(`entryMode.ts`·`Root.tsx`) | [x] |

## 5. 파일명 규칙

| 종류 | 규칙 | 예 |
| --- | --- | --- |
| 캐릭터 원본 | `tmp/pitch-src/characters/char-<id>-<sheet>.png` (`stand idle run shoot skill-side skill-up emote portrait`) | `char-woowakgood-run.png` |
| 골키퍼 원본 | `char-keeper-ai-<sheet>.png` (`stand ready dive save react`) | `char-keeper-ai-dive.png` |
| 환경 원본 | `tmp/pitch-src/env/env-<name>.png` | `env-pitch-bg.png` |
| FX 원본 | `tmp/pitch-src/fx/fx-<name>.png` | `fx-impact.png` |
| UI 원본 | `tmp/pitch-src/ui/ui-<name>.png` | `ui-buttons.png` |
| 키아트 원본 | `tmp/pitch-src/keyart/keyart-<name>.png` | `keyart-loading-bg.png` |
| 선수 레퍼런스(사용자 보유) | `tmp/pitch-src/refs/<id>-ref.webp(또는 .png)`, `<id>-ref-face.png` | `janine95kim-ref.webp` |
| 변환 결과 | `src/web/assets/pitch/<category>/...webp` | `characters/woowakgood-atlas.webp` |
| SFX | `public/sfxes/pitch-<이름>.mp3` | `pitch-kick-mid.mp3` |
| BGM | `public/pitch-bgm-<이름>.mp3` | `pitch-bgm-pitch.mp3` |
| localStorage | `fc26-entry-mode`, `fc26-pitch-character`, `fc26-pitch-settings-v1`, `fc26-pitch-stats-v1` | |

> 이미지 원본(`tmp/`)은 git 추적 여부를 프로젝트 관례에 따른다(월드 `tmp/world-src` 확인). 원본은 삭제하지 않는다.
