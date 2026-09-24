# 07. 구현 로드맵 — 세션 구성, 의존성, 종료 조건

> 세션별 **실제 지시문(복붙용)** 은 [10-session-prompts.md](10-session-prompts.md)에 있다. 이 문서는 세션의 목적·순서·의존성·종료 조건(DoD)을 한눈에 보는 **개요**다. 구현 중 바뀐 내용은 [README 변경 전파 프로토콜](README.md#변경-전파-프로토콜)에 따라 이 문서와 10을 함께 고친다.

## 1. 세션 한눈에

상태: `[ ]` 미착수 · `[~]` 진행 중 · `[x]` 완료

| 상태 | 세션 | 이름 | 한 줄 목표 | 선행 | 사용자 작업(이미지·소리) |
| --- | --- | --- | --- | --- | --- |
| [x] | **S0** | 계획 문서 | 이 `docs/pitch/` 문서 세트 | — | — |
| [x] | **P1** | 기반 공사 | 진입 게이트·전환 버튼·캔버스 쉘·로딩 화면·저장 키(플레이스홀더 아트) | S0 | (병행) 파일럿 이미지 생성 시작 |
| [x] | **A1** | 아트 파이프라인 1 | 변환 스크립트·에셋 매니페스트·우왁굳+코어+골키퍼 변환 | P1 + 이미지 #001~#025 | 이미지 #001~#025 생성·저장 |
| [x] | **P2** | 이동·드리블·볼 | 실제 아트로 피치 화면, 달리기 이동, 볼 소유/드리블 | A1 | — |
| [x] | **P3** | 슛·골키퍼 | 3단계 슛, 골키퍼 AI, 판정, 스코어, 튜닝, Monte Carlo 테스트 | P2 | — |
| [x] | **P4** | 개인기·연출·사운드 | 개인기 4종·스타일 게이지·이펙트·SFX/BGM·설정 저장 | P3 | SFX 44/50 + BGM 3/3 확보됨(P0 중 `pitch-aim-tick` 만 미확보 — [06 §3-1](06-audio.md)) |
| [x] | **A2** | 아트 파이프라인 2 | 나머지 11명·선택 UI·연출 이펙트 변환 | P4 진행과 병행 가능 | 이미지 #026~#116 생성·저장 |
| [x] | **P5** | 캐릭터 선택 | 12명 레지스트리·선택창·lazy 로딩·저장 | A2 | SFX P1 일부 |
| [x] | **A3** | 아트 파이프라인 3 | 락커룸·스탯 UI 변환 | P5 병행 가능 | 이미지 #117~#121 생성·저장 |
| [x] | **P6** | 락커룸·스탯 | 게이트·락커룸·스탯 육각형(`???`/COMING SOON)·전환 | P5, A3 | SFX 락커·스탯, BGM B3 |
| [x] | **P6b** | 스탯 정의 반영 | 포지션별 스탯 이름·설명(공통 3+고유 3, GK 고유 6)과 구조화된 설명 패널 UI, 능력치 숫자는 `???` 유지 — 명세 [11](11-stat-definitions.md) | P6 | — |
| [x] | **P7** | 성능·QA·마감 | 성능 리포트(01 §7-1)·프레임 미터·접근성(Backspace)·폴백 토스트·저장소 메모리 폴백·코너 플래그. prefetch·난이도 3단계·크레딧은 근거 없어 미구현(README 백로그) | P6 | 이미지 P2(#122~#123: 코너 플래그만 통합), SFX P1 나머지(전부 미확보, 백로그 B3) |
| [x] | **P8** | 모바일 정책 | 터치 컨트롤 대신 **터치 기기는 항상 대시보드 + `피치로 돌아가기` 숨김**으로 확정(사용자 결정) | P7 | — |

```
S0 ─ P1 ─ A1 ─ P2 ─ P3 ─ P4 ─ P5 ─ P6 ─ P6b ─ P7 ─ P8
          └(이미지 #001~#025)   └ A2(#026~#116) ┘   └ A3(#117~#121) ┘
```
- 이미지 생성은 코드 세션과 **병행 가능**하다. 사용자가 미리 만들어 두면 해당 A 세션에서 변환만 하면 된다.
- 에셋이 아직 없어도 P2~P4는 **플레이스홀더 도형**으로 진행 가능(누락 에셋 = undefined → 도형).

## 2. 세션별 산출물 요약

| 세션 | 주요 산출물(파일) | 테스트 |
| --- | --- | --- |
| P1 ✔ | `src/web/Root.tsx`, `entryMode.ts`, `storage.ts`(추가), `pitch-return.css`, `pitch/PitchEntry.tsx`, `pitch/engine/{stage,input,sceneManager,assets,text}.ts`, `pitch/scenes/{LoadingScene,PitchScene}.ts`, `TopBar.tsx`(복귀 버튼), `App.tsx`(`onGoPitch` prop), `main.tsx`(Root), `pitch/__tests__/{entryMode,pitchStorage,stage,sceneManager,assets}.test.ts` | entryMode 결정 규칙, storage, 씬 스택, 좌표 변환 |
| A1 | `scripts/convert-pitch-art.mjs`, `scripts/pitch-art-manifest.json`, `package.json` script, `pitch/engine/assets.ts` 키 맵, `pitch/data/animations.ts`, `src/web/assets/pitch/**` | 아틀라스 크기·셀 좌표 범위 테스트, QA 리포트 |
| P2 | `game/{player,ball}.ts`, `data/characters.ts`(우왁굳), `scenes/PitchScene.ts`, `engine/{sprite,particles}.ts` | player/ball 물리 |
| P3 ✔ | `game/{shot,keeper,match,montecarlo,rng,tuning}.ts`, `ball.ts`(shot 모드), `scenes/{shotHud,pitchDebug}.ts`, `PitchScene` 슛 루프 | shot, keeper Monte Carlo(9셀×20,000), match, ball shot, PitchScene 슛 루프·렌더 스모크 |
| P4 ✔ | `game/{skills,stats}.ts`, `audio/{pitchAudio,sfxMap}.ts`, `engine/{tween,effects}.ts`, `scenes/styleHud.ts`, `tuning.ts`(`SKILLS/STYLE/JUICE`), `storage.ts`(stats), `SceneHost.audio/reducedMotion`, PitchScene 개인기·게이지·연출·소리·통계 | skills 20, sfxMap(06 표 대조), pitchAudio 11, effects/tween, storage stats, PitchScene 개인기·연출·소리 24 |
| A2 ✔ | 아틀라스/초상화 11명, 선택 UI, celebrate FX 변환(변환은 A1 `--all` 이 수행, A2 는 검수·`characterAssets.test.ts`·04 §10) | 아틀라스 12종 960×960·초상화 48·hero·select 그룹·9-slice 인셋 |
| P5 ✔ | `scenes/{CharacterSelectScene,selectGrid}.ts`, `data/characters.ts`(12명·`resolveStoredCharacter`), `engine/assets.ts`(공유 파일 보존 release), `PitchScene.openSelect/setCharacter` | characters 7 · selectGrid 6 · characterSelect 16(확정·실패 폴백·취소·더블클릭·프리뷰 지연·해제) · assets release |
| A3 | 락커룸 배경·소품, 스탯 UI 변환 | 매니페스트 |
| P6 | `scenes/{LockerScene,StatScene,hudCommon}.ts`, `game/locker.ts`, `data/stats.ts`, `ui/hexagon.ts`, `PitchScene` 게이트 | 육각형 기하(꼭짓점·hit test)·선택 순환·stats 완전성(8종×6축)·게이트/문 반경·충돌·씬 흐름 (`hexagon`·`stats`·`locker`·`lockerScene` 테스트 4파일) |
| P6b | `data/stats.ts`(공통·고유·GK 스탯 정의·`isPlaceholderAxis`·`axisTag`), `ui/statDetail.ts`(`wrapText`·`layoutStatDetail`·`clampScroll`), `scenes/StatScene.ts`(구조화 패널·스크롤·`announcementFor`)·`ui/hexagon.ts`(`KIND_COLORS`·노드 링), `engine/sceneManager.ts` `onWheel`·`PitchEntry` 휠 연결 | 스탯 완전성(42축), 구성, wrapText, 레이아웃(42축 ≤ 204px), 스크롤, aria 문구 |

## 3. 공통 종료 조건(DoD) — 모든 코드 세션

- [ ] `pnpm typecheck` 통과
- [ ] `pnpm test` 통과(신규 로직에 단위 테스트 추가)
- [ ] `pnpm build` 통과
- [ ] 기존 대시보드 회귀 없음(`?view=`, `?totyCapture`, 월드 오버레이 진입)
- [ ] **브라우저 수동 검증은 하지 않는다**(사용자가 배포 후 확인 — 프로젝트 메모리 규칙). 대신 타입·테스트·빌드와 코드 리뷰로 검증하고, 사용자가 확인할 체크리스트를 세션 마지막에 제시한다.
- [ ] 문서 갱신: README 세션 로그, 바뀐 스펙 문서, **후속 세션 지시문(10)**, 07/08 상태([변경 전파 프로토콜](README.md#변경-전파-프로토콜))
- [ ] 커밋은 사용자가 요청할 때만

## 4. 세션 크기 가이드

한 세션이 너무 커지면 품질이 떨어지므로 아래 경계를 지킨다. 넘치면 세션을 쪼개고 10의 프롬프트를 수정한다.

| 세션 | 크기 기준 |
| --- | --- |
| P1 | 신규 파일 ~12개, 기존 파일 수정 3개(`main.tsx`, `TopBar.tsx`, `storage.ts`) 이내 |
| P3 | (완료) 슛과 키퍼를 한 세션에서 끝냄 — 분리 불필요했음 |
| P4 | (완료) 개인기·연출·사운드를 한 세션에서 끝냄 — 분리 불필요했음 |
