# 10. 세션별 지시문 — 복붙용 프롬프트

각 구현 세션을 **새 Claude Code 세션**에서 시작할 때, 해당 절의 ```text 블록을 그대로 붙여 넣는다. 이전 세션의 결과에 따라 이 문서가 바뀌므로 **세션을 시작하기 전에 항상 이 문서의 최신 상태를 확인**한다. 개요·의존성은 [07](07-implementation-roadmap.md).

## 변경 전파 프로토콜 (모든 세션 공통 의무)

구현하다 보면 수치·파일명·API·구조가 바뀐다. **코드만 고치고 끝내지 않는다.** 세션 종료 전에 아래를 반드시 수행하고, 프롬프트의 "세션 종료 의무" 항목이 이를 강제한다.

1. **원천 스펙 먼저**: 바뀐 내용이 속한 문서(01 구조 · 02 게임플레이 · 03 화면 · 04/05 아트 · 06 오디오)를 고친다. 이 문서들이 단일 진실 원천이다. 04/05를 고쳤으면 `node docs/pitch/tools/build-image-runbook.mjs`로 09를 재생성한다.
2. **후속 세션 지시문 재작성**: 이 문서(10)에서 **영향받는 이후 세션의 프롬프트**를 새 사실에 맞게 다시 쓴다(파일 경로·함수 시그니처·수치·전제 조건). 각 프롬프트 첫머리의 `전제`·`마지막 갱신`도 갱신한다.
3. **로드맵·체크리스트 동기화**: 07의 세션 상태(`[ ] [~] [x]`)와 산출물, 08의 에셋/구현 체크박스.
4. **README 세션 로그**: `날짜 | 세션 | 한 일 | 결정/변경점 | 영향받는 후속 세션` 한 줄 추가.
5. **불일치 점검**: `grep`으로 옛 파일명·옛 수치·옛 함수명이 docs/pitch/에 남았는지 확인하고, 결과를 세션 로그에 한 줄 남긴다.
6. **사용자 확인 목록**: 브라우저 수동 검증은 하지 않으므로(프로젝트 메모리 규칙), 사용자가 배포 후 확인할 항목을 세션 마지막 메시지에 체크리스트로 제시한다.

## 공통 머리말 (모든 프롬프트 첫 문단에 포함됨)

```text
[공통] 이 프로젝트의 피치(2D 픽셀 축구 진입 화면) 계획 문서는 docs/pitch/ 에 있다. 먼저 docs/pitch/README.md 와 아래에 적힌 문서를 읽어라.
이전 세션의 README "세션 로그"에 적힌 '결정/변경점'이 이 지시문과 충돌하면, 코드를 짜기 전에 문서(특히 docs/pitch/10-session-prompts.md 의 이 세션 절)를 먼저 고쳐라.
작업 원칙: 게임 화면은 반드시 2D Canvas. 잔디동 월드 이미지 에셋은 사용 금지. 텍스트는 이미지가 아니라 캔버스에서 Galmuri11로 그린다. 누락된 에셋은 undefined 처리하고 도형 플레이스홀더로 대체한다.
브라우저 미리보기/수동 검증은 하지 마라(사용자가 배포 후 직접 확인한다). 대신 pnpm typecheck, pnpm test, pnpm build 로 검증하고, 세션 마지막에 사용자가 확인할 체크리스트를 제시하라.
셸 편집 주의: Bash heredoc 은 작은따옴표가 있는 한글 텍스트에서 실패하기 쉽다. 파일은 Write/Edit 도구로 쓰고, 일괄 변환은 Node 스크립트로 하라. 커밋은 내가 요청할 때만 한다.
```

---

## 세션 P1 — 기반 공사

- **상태**: ✔ 완료(2026-09-25). 아래 프롬프트는 기록용이며 재실행하지 않는다. 결과는 README 세션 로그와 01 §3-1·§3-3·§3-4·§3-4b·§4-1에 반영됨.
- **전제**: S0 완료(docs/pitch/ 존재). 이미지 아트 없이 진행(플레이스홀더).
- **마지막 갱신**: P1 완료 시점

```text
[공통] 이 프로젝트의 피치(2D 픽셀 축구 진입 화면) 계획 문서는 docs/pitch/ 에 있다. 먼저 docs/pitch/README.md 와 아래에 적힌 문서를 읽어라.
이전 세션의 README "세션 로그"에 적힌 '결정/변경점'이 이 지시문과 충돌하면, 코드를 짜기 전에 문서(특히 docs/pitch/10-session-prompts.md 의 이 세션 절)를 먼저 고쳐라.
작업 원칙: 게임 화면은 반드시 2D Canvas. 잔디동 월드 이미지 에셋은 사용 금지. 텍스트는 이미지가 아니라 캔버스에서 Galmuri11로 그린다. 누락된 에셋은 undefined 처리하고 도형 플레이스홀더로 대체한다.
브라우저 미리보기/수동 검증은 하지 마라(사용자가 배포 후 직접 확인한다). 대신 pnpm typecheck, pnpm test, pnpm build 로 검증하고, 세션 마지막에 사용자가 확인할 체크리스트를 제시하라.
셸 편집 주의: Bash heredoc 은 작은따옴표가 있는 한글 텍스트에서 실패하기 쉽다. 파일은 Write/Edit 도구로 쓰고, 일괄 변환은 Node 스크립트로 하라. 커밋은 내가 요청할 때만 한다.

# 세션 P1 — 기반 공사
먼저 읽을 문서: docs/pitch/README.md, 01-concept-and-architecture.md, 03-screens-and-ui.md(§0,§1,§7), 07-implementation-roadmap.md.

## 목표
사이트 진입점을 "pitch 모드"로 바꾸는 기반을 만든다. 에셋 없이 동작하는 Canvas 쉘 + 로딩 화면 + 우상단 대시보드 버튼(임시 도형) + 대시보드 쪽 "피치로 돌아가기" 버튼(임시 텍스트) + localStorage 저장.

## 범위
1. Galmuri11 폰트 출처 확인: grep(index.html, src/web/styles.css, toty-card.css, group-photo/led-signboard.css). @font-face 로 실제 로드되는지 확인하고 없으면 로드 방법을 정해 문서(01 §3-4b)에 기록.
2. src/web/storage.ts 에 fc26-entry-mode, fc26-pitch-character(기본 woowakgood), fc26-pitch-settings-v1 의 load/save 함수를 기존 컨벤션(try/catch, 실패 시 기본값)으로 추가.
3. src/web/entryMode.ts: 순수 함수 resolveInitialMode({search, hash, stored, coarsePointer}) 와 훅 useEntryMode(). 규칙은 01 §4-1 (딥링크 ?view=/?totyCapture/해시 → dashboard, ?mode= 오버라이드, 저장값, 기본 pitch, 터치 기기는 dashboard). 동기 초기화.
4. src/web/Root.tsx: mode 에 따라 lazy(PitchEntry) 또는 기존 App(대시보드) 렌더. 기존 App.tsx 내부 로직은 건드리지 말고 필요한 prop(onGoPitch)만 추가. src/web/main.tsx 의 ?totyCapture 분기는 Root 보다 먼저 유지.
5. src/web/TopBar.tsx 의 topbar__actions 에 "피치로 돌아가기" 임시 버튼(텍스트+aria-label) 추가, WorldToggle(좌상단 고정, z-index 75)과 겹치지 않는지 확인.
6. src/web/pitch/engine/: stage.ts(960x540 논리 캔버스 contain 스케일, renderScale=clamp(floor(cssScale*dpr),1,2), toLogical 좌표 변환, imageSmoothingEnabled=false), input.ts(키 상태 + 눌림 이벤트 큐, code 기준, 방향키/Space/Tab preventDefault, 블러 시 해제), sceneManager.ts(스택, 전환 와이프 0.35s, prefers-reduced-motion 처리), assets.ts(import.meta.glob 기반 그룹 로더, 누락=undefined, 바이트/파일 가중 진행률, 최소 표시 600ms).
   기존 src/web/world/engine/loop.ts 의 createLoop 를 재사용하고, world/stageLayout.ts·gameFrame.ts 재사용 가능 여부를 검토해 결과를 01 §3-1 에 기록.
7. src/web/pitch/scenes/: LoadingScene(03 §1 레이아웃을 도형+텍스트로 구현, 팁 회전, 8초 초과 시 대시보드 링크), PitchScene(임시: 초록 배경 + "PITCH" 텍스트 + 우상단 대시보드 버튼 히트영역/호버 상태).
8. src/web/pitch/PitchEntry.tsx: 캔버스 마운트, 루프 시작/정지, visibilitychange 일시정지, 언마운트 정리, 초기화 실패 시 goDashboard 폴백 + 콘솔 경고. suspendGlobalMusic/resumeGlobalMusic 호출(src/web/musicControl.ts).
9. 단위 테스트(vitest): resolveInitialMode 표 기반 케이스(딥링크/저장값/기본/터치), storage 접근 실패 폴백, sceneManager 스택 push/pop·전환, stage toLogical 좌표.

## 비범위
게임플레이, 이미지 에셋, 오디오, 캐릭터 선택.

## 종료 조건(DoD)
- pnpm typecheck / test / build 통과
- 기존 대시보드 회귀 없음(?view=evaluation, ?totyCapture, 월드 오버레이) — 코드 리뷰로 확인
- pitch 모드에서 대시보드/스냅샷 fetch 가 마운트되지 않음(코드로 확인)
- 사용자 확인 체크리스트를 세션 마지막에 제시(첫 방문 pitch 진입, 버튼 전환, 새로고침 시 상태 유지, 딥링크 시 대시보드)

## 세션 종료 의무
docs/pitch/10-session-prompts.md 상단의 "변경 전파 프로토콜" 1~6을 모두 수행하라. — 특히 01 §3-1(스테이지 재사용 결과), §3-4b(폰트), §4-1(실제 구현된 결정 규칙)과 이 문서의 A1·P2 프롬프트(engine/assets.ts 실제 API, PitchScene 구조)를 갱신할 것.
```

---

## 세션 A1 — 아트 파이프라인 1

- **상태**: ✔ 완료(2026-09-25). 아래 프롬프트는 기록용이며 재실행하지 않는다(우왁굳·keeper-ai·코어 변환 완료, 결과는 README 세션 로그·04 §4·§6-1·§9·05 §6). 나머지 캐릭터는 A2, 재변환은 `pnpm convert:pitch-art -- characters <id> [--only <sheet>]`.

- **전제**: P1 완료(✔), 이미지 #001~#025 생성·저장 완료(`tmp/pitch-src/`, 러닝북 [09](09-image-generation-runbook.md) Phase 1~3).
- **마지막 갱신**: P1 완료 시점(assets.ts 실제 API 반영)

```text
[공통] 이 프로젝트의 피치(2D 픽셀 축구 진입 화면) 계획 문서는 docs/pitch/ 에 있다. 먼저 docs/pitch/README.md 와 아래에 적힌 문서를 읽어라.
이전 세션의 README "세션 로그"에 적힌 '결정/변경점'이 이 지시문과 충돌하면, 코드를 짜기 전에 문서(특히 docs/pitch/10-session-prompts.md 의 이 세션 절)를 먼저 고쳐라.
작업 원칙: 게임 화면은 반드시 2D Canvas. 잔디동 월드 이미지 에셋은 사용 금지. 텍스트는 이미지가 아니라 캔버스에서 Galmuri11로 그린다. 누락된 에셋은 undefined 처리하고 도형 플레이스홀더로 대체한다.
브라우저 미리보기/수동 검증은 하지 마라(사용자가 배포 후 직접 확인한다). 대신 pnpm typecheck, pnpm test, pnpm build 로 검증하고, 세션 마지막에 사용자가 확인할 체크리스트를 제시하라.
셸 편집 주의: Bash heredoc 은 작은따옴표가 있는 한글 텍스트에서 실패하기 쉽다. 파일은 Write/Edit 도구로 쓰고, 일괄 변환은 Node 스크립트로 하라. 커밋은 내가 요청할 때만 한다.

# 세션 A1 — 아트 파이프라인 1 (변환 스크립트 + 코어 에셋)
먼저 읽을 문서: docs/pitch/README.md, 04-art-characters.md(§2~§4), 05-art-world-and-ui.md, 09-image-generation-runbook.md(진행 표), 01 §3-4.
참고 코드: scripts/convert-world-art.mjs, scripts/convert-minigame-art.mjs, scripts/lib/world-art-math.mjs, scripts/world-art-manifest.json (로직 참고만, 월드 에셋 사용 금지).

## 목표
tmp/pitch-src/ 의 생성 시트를 게임용 webp 로 변환하는 스크립트를 만들고, 파일럿(우왁굳)+공용 코어+골키퍼를 src/web/assets/pitch/ 로 변환한다. 클립→셀 좌표표(animations.ts)와 에셋 키 맵을 만든다.

## 범위
1. scripts/convert-pitch-art.mjs + scripts/pitch-art-manifest.json + package.json 의 "convert:pitch-art" 스크립트. 사용법: pnpm convert:pitch-art -- <category> [id]. 카테고리: characters, env, fx, ui, keyart. 옵션: --tolerance, --scene(16:9 중앙 밴드 크롭 후 960x540 축소), --quality.
2. 캐릭터 변환: 시트별 그리드(04 §4 표)로 셀 배정(연결요소 방식 재사용), 스탠드 키 기준으로 96x96 셀 정규화(발끝 y=92, 중앙 x=48). 알파 이진화로 반투명 후광 제거. 연결요소 병합 gap 은 ≤2px(빽빽한 시트에서 프레임 간격이 4~15px, 골키퍼 dive 는 gap 24에서 20프레임이 6덩어리로 합쳐짐, 04 §8). 발끝 정렬은 프레임별이 아니라 행(클립) 단위로 접지 프레임을 기준선에 맞추고 같은 오프셋을 적용(도약 프레임 보존, 04 §8), 아틀라스 960x960(04 §4 셀 배치표)로 조립, hero(최대 384px 높이)·portraits 4종(192x192) 생성. 골키퍼는 시트별 정규화(다이브 셀 192x96).
3. 환경/FX/UI 변환: 그리드 시트를 셀별로 잘라 개별 webp 또는 스프라이트 스트립으로 저장(매니페스트에 정의), 9-slice 인셋 지정, scene/keyart 는 960x540.
4. QA 리포트(tmp/pitch-src/qa-report.json): 발끝 기준선 편차>3px, 마젠타 잔여, 셀 경계 클립, 그리드 개수 불일치, 스케일 이상.
5. src/web/pitch/data/animations.ts: 클립(idle, run, shoot, skill_*, celebrate_*, disappointed)과 방향(down/side/up)→아틀라스 셀 좌표·프레임 수·fps 를 정의(04 §4 표가 정답, 표와 코드가 다르면 표를 먼저 고친다).
6. src/web/pitch/engine/assets.ts 의 `ASSET_GROUPS`(P1에서는 boot/core/select/locker 전부 빈 배열 `AssetSpec{key, bytes?}[]`)를 실제 키와 **파일 바이트 크기**로 채운다(키 = `src/web/assets/pitch/` 아래 경로에서 `.webp` 뺀 것, 예 `characters/woowakgood-atlas`. 모든 파일에 bytes 가 있어야 바이트 가중 진행률이 켜진다). `groupSpecs()` 의 `char:<id>` 파생 규칙(현재 `characters/<id>-atlas`, `characters/<id>-portrait`)을 실제 변환 파일 구성(portraits 4종·hero 포함 여부)에 맞게 고친다. API(`createPitchAssets → get/has/loadGroup/release/dispose`, `LoadGroupResult{loaded,failed,missing}`)는 바꾸지 말고 01 §3-4 에 적힌 대로 유지 — 필요하면 문서를 먼저 고친다. 바이트 크기를 손으로 적지 말고 변환 스크립트가 생성하는 매니페스트(예: `src/web/pitch/data/assetSizes.generated.ts`)에서 가져오게 한다. boot 그룹 파일이 하나라도 로드 실패하면 PitchEntry 가 대시보드로 폴백한다는 점에 유의(boot 는 작고 필수인 것만).
7. 테스트: 매니페스트 셀 좌표가 아틀라스 범위 안, animations.ts 프레임 총합 80, 아틀라스 크기 960x960.
8. 재변환 주의: 캐릭터 시트를 전부 다시 변환하면 달리기 행이 틀어질 수 있다(월드에서 겪은 문제). 일부만 고칠 때는 변경된 시트/행만 기존 결과에 끼워 넣는 옵션(--only <sheet>)을 제공.

## 비범위
게임 로직. (변환 결과 시각 확인은 사용자가 한다. 스크립트가 만든 QA 리포트 요약을 세션 결과에 첨부.)

## 종료 조건(DoD)
- pnpm typecheck / test / build 통과
- 우왁굳 atlas·portraits·hero, keeper-ai atlas, 코어 env/fx/ui 파일이 src/web/assets/pitch/ 에 생성되고 QA 리포트에 치명적 오류 없음(경고는 나열)
- 캔버스 크기 드리프트, 실제 사용한 tolerance 등 관찰한 사실을 04·05 에 반영

## 세션 종료 의무
docs/pitch/10-session-prompts.md 상단의 "변경 전파 프로토콜" 1~6을 모두 수행하라. — 특히 04 §4(실제 셀 좌표), animations.ts 의 실제 형태를 P2 프롬프트에 반영하고, 아트 문제가 발견되면 09 러닝북 검수 체크에 항목을 추가(04/05 수정 후 재생성).
```

---

## 세션 P2 — 이동·드리블·볼

- **상태**: ✔ 완료(2026-09-25). 아래 프롬프트는 기록용이며 재실행하지 않는다. 결과는 README 세션 로그와 02 §2·§3, 01 §3-3, 03 §2-1 에 반영됨. 후속 세션이 쓰는 API 는 아래 **P2가 남긴 것**.
- **전제**: A1 완료(✔ 우왁굳 atlas·pitch-bg·goal·ball 변환됨), P1 완료(✔).
- **마지막 갱신**: P2 완료 시점
- **P2가 남긴 것(P3~P5가 그대로 사용)**:
  - `game/tuning.ts`: `PLAY_AREA`·`SPAWN`·`GOAL`·`MOVE`·`DEPTH`·`DRIBBLE`(ζ 포함)·`SHOOT_MAX_DISTANCE`(=520, 슛 진입 거리는 P3 가 사용)·`DUST`, `clamp`, `depthScale(y)`. 02 §2·§3 표와 같은 값.
  - `game/player.ts`: `PlayerState{x,y,vx,vy,fx,fy,sprinting,idleTime,runPhase}`, `createPlayer/resetPlayer`, `stepPlayer(p, {dx,dy,sprint}, dt)`, `playerPose(p) → {clip:"idle"|"run", dir, mirror, frame}`, `playerSpeed`, `facingDirection`, `runFps`. 슛·개인기 중 이동 잠금은 호출부(씬)가 입력을 0 으로 넣어 처리한다(player.ts 에는 잠금 상태가 없음).
  - `game/ball.ts`: `BallState{x,y,vx,vy,mode:"carried"|"loose"|"dead",trap,deadTimer,spin}`, `createBall/resetBall`, `stepBall(b, p, dt)`(플레이어를 먼저 스텝한 뒤 호출), `touchTarget(p)`, `ballDistance`, `ballSpinFrame`. 볼 좌표 = 지면 접점(그림자 위치), 스프라이트는 그 위에 그린다. P3 는 `BallMode` 에 `shot` 을 추가하고 `stepBall` 분기·z(높이)를 확장한다.
  - `engine/sprite.ts`: `drawFrame(g, image, rect, footX, footY, {scale, mirror, alpha})`(셀의 FOOT_Y·가로 중앙을 앵커에 맞춤 — 키퍼 dive 192 셀도 동일), `stripRect`/`drawStripFrame`(스트립의 하단 중앙 앵커), `drawNineSlice`. `engine/particles.ts`: `createParticlePool(capacity)`(emit/update(dt, drag)/clear, 고정 풀), `particleProgress`.
  - `data/characters.ts`: `PitchCharacter{id,name,positionLabel,position,themeColor}`, `PITCH_CHARACTERS`(우왁굳 1명), `getCharacter(id)`(모르는 id 는 첫 캐릭터).
  - `scenes/PitchScene.ts`(단일 클래스, 렌더 순서: 정적 캐시[pitch-bg + goal-back] → 먼지 → y 정렬 액터[키퍼 ready 고정·플레이어·볼, 볼 그림자는 그 아래] → goal-front → HUD[스코어보드·버튼 3·캐릭터 판·힌트·토스트·포커스 안내] → 페이드). 입력은 `host.input.isDown` 로 이동, `onKey` 로 R/M/H/Tab. 버튼 목록 `BUTTONS`+`onButton(id)`, 점수 자리 `this.score{goals,saves,streak}`(P3 가 match 상태로 교체), 힌트 목록 `HINT_ITEMS`, 결과 배너·조준/파워 바 자리 없음(P3 가 추가). 파일이 커지면 P3 에서 `scenes/pitch/*` 로 분리 검토.
  - 알려진 임의 결정: 스코어보드 숫자 칸 좌표(x+120/x+160, y+33)는 시안 눈대중, 컨트롤 힌트는 구현된 조작만(Space·Z X C V 는 각 세션이 추가), 소리 버튼/M 은 `sfxOn`/`musicOn` 을 함께 토글해 `fc26-pitch-settings-v1` 에만 저장(실제 소리는 P4).
- **A1이 남긴 것(P2가 그대로 사용)**:
  - `src/web/pitch/data/animations.ts`: `CLIPS[clip][dir] → {row, col, frames, fps, loop, cellW}`, `clipDef(name, dir)`(없는 방향은 side/down 으로 대체), `frameRect(def, frame) → {sx, sy, sw, sh}`, `frameAt(def, seconds)`, `CELL_SIZE=96`, `FOOT_Y=92`(발끝 = 셀 y 92, 중앙 x 48). 좌향은 side 프레임을 미러. 골키퍼는 `KEEPER_CLIPS`(dive 셀 192×96, 아틀라스 960×768). 클립 이름: idle run shoot skill_stepover|roulette|rainbow|elastico celebrate_a celebrate_b disappointed / ready shuffle_left shuffle_right catch punch foot_deflect beaten save_celebrate rage_slam dive_(low|high)_(left|right).
  - 에셋 키(`assets.get(key)`): 캐릭터 `characters/<id>-atlas`(960×960)·`characters/<id>-hero`, `portraits/<id>-<neutral|confident|celebrate|disappointed>`(192²), `characters/keeper-ai-atlas`. 환경 `env/pitch-bg`(960×540), `env/goal-back`·`goal-front`(300×74)·`goal-ripple`(4프레임 스트립 1200×74), `env/ball-spin`(8프레임 128×16)·`ball-shadow`·`ball-trail`·`ball-ring`·`ball-sparkle`, `env/gate-closed|open|glow`(128²)·`gate-arrow`·`gate-plate`. FX 는 4프레임 스트립 `fx/fx-dust|fx-grass|fx-star|fx-speed|fx-aim-arrow|fx-reticle|fx-sweet`. UI 는 `ui/<id>`(전체 목록은 `data/assetMeta.generated.ts`; 스트립은 `frames`, 9-slice 는 `slice` 필드). 스트립 프레임 폭 = `w / frames`.
  - 그룹: `ASSET_GROUPS.core`(피치 배경·골·볼·FX·HUD·버튼·아이콘·keeper atlas), `char:<id>`(atlas + 초상화 4), `select`, `locker`. **선택 캐릭터 atlas 는 core 에 없다** → LoadingScene 이 `loadPitchCharacter()` 값으로 `char:<id>` 를 core 와 함께 로드해야 한다(P2 작업). 바이트 크기는 `PITCH_ASSET_META` 에서 자동.
  - 볼(16px)·프레임 크기는 논리 px 기준: 캐릭터 셀 96, 볼 셀 16, 그림자 24×10. 캐릭터 시각 높이 약 78~82px(스탠드 기준 80).
- **P1이 남긴 구조(P2가 이어받는 것)**: `src/web/pitch/scenes/PitchScene.ts` 는 `class PitchScene implements Scene` — 임시 본문(초록 배경 + `PITCH` + 대시보드 버튼 히트영역 `DASHBOARD_BUTTON = {x:732,y:16,w:212,h:48}`, hover/pressed, 클릭 시 0.2s 페이드아웃 후 `ctx.host.goDashboard()`). 이 버튼 로직은 **그대로 유지**하고 본문(배경·플레이어·볼·HUD)을 교체·확장한다. 입력은 `PitchEntry` 가 `createInput()` 을 만들지만 씬에는 현재 **눌림 이벤트(`onKey({code})`)만** 전달된다 → 달리기처럼 **held 상태**가 필요하면 `SceneHost` 에 `input: PitchInput`(`isDown(code)`)을 추가해 PitchEntry 에서 주입한다(01 §3-3 도 같이 갱신). 씬 API: `enter(ctx)`(ctx.host.assets/goDashboard/setCursor, ctx.manager), `update(dt)`(고정 1/60), `render(g)`(논리 960×540 좌표, 변환은 stage 가 처리), `onPointer({type,x,y})`. 텍스트는 `engine/text.ts` 의 `drawText`(정수 좌표·그림자). 에셋은 `ctx.host.assets.get(key)`(없으면 undefined → 도형). `LoadingScene` 이 `core` 그룹을 로드한 뒤 `manager.replace(new PitchScene(), undefined, {transition:"fade"})` 로 넘긴다 — 선택 캐릭터 atlas 로드가 core 에 포함되도록 `loadPitchCharacter()` 값으로 `char:<id>` 를 함께 로드하는 것도 이때 결정할 것.

```text
[공통] 이 프로젝트의 피치(2D 픽셀 축구 진입 화면) 계획 문서는 docs/pitch/ 에 있다. 먼저 docs/pitch/README.md 와 아래에 적힌 문서를 읽어라.
이전 세션의 README "세션 로그"에 적힌 '결정/변경점'이 이 지시문과 충돌하면, 코드를 짜기 전에 문서(특히 docs/pitch/10-session-prompts.md 의 이 세션 절)를 먼저 고쳐라.
작업 원칙: 게임 화면은 반드시 2D Canvas. 잔디동 월드 이미지 에셋은 사용 금지. 텍스트는 이미지가 아니라 캔버스에서 Galmuri11로 그린다. 누락된 에셋은 undefined 처리하고 도형 플레이스홀더로 대체한다.
브라우저 미리보기/수동 검증은 하지 마라(사용자가 배포 후 직접 확인한다). 대신 pnpm typecheck, pnpm test, pnpm build 로 검증하고, 세션 마지막에 사용자가 확인할 체크리스트를 제시하라.
셸 편집 주의: Bash heredoc 은 작은따옴표가 있는 한글 텍스트에서 실패하기 쉽다. 파일은 Write/Edit 도구로 쓰고, 일괄 변환은 Node 스크립트로 하라. 커밋은 내가 요청할 때만 한다.

# 세션 P2 — 이동·드리블·볼 물리
먼저 읽을 문서: docs/pitch/README.md, 02-gameplay-spec.md(§1~§3), 03-screens-and-ui.md(§2), 01 §3, 10 의 이전 세션 로그(README).

## 목표
피치 화면에서 우왁굳을 방향키로 달리게 하고, 볼을 드리블할 수 있게 한다(실제 아트).

## 범위
1. src/web/pitch/game/player.ts(이동 수치 02 §2, 8방향 정규화, 가감속, y 속도 0.75, 경계·골 라인 뒤 진입 불가, 방향→클립 선택), ball.ts(carried 스프링, 스프린트 시 loose 전환 90px, 재소유 20px, dead/경계 리셋). 수치는 game/tuning.ts 로 분리하고 02 표와 일치시킨다.
2. engine/sprite.ts(아틀라스 셀 그리기, 좌향 미러, depthScale, 발끝 정렬), engine/particles.ts(먼지 풀링).
3. data/characters.ts(우왁굳 1명, 나중에 12명으로 확장할 구조: id, name, position, themeColor).
4. scenes/PitchScene.ts: 정적 캐시 레이어(피치 배경), 골대 뒤/앞 레이어, y 정렬 렌더, 키퍼 idle 고정, 스코어보드/대시보드 버튼/소리 버튼/캐릭터 변경 버튼(선택창은 미구현이므로 클릭 무동작 또는 토스트), 컨트롤 힌트(첫 12초), 포커스 안내.
5. 스프린트/달리기 먼지 이펙트, 볼 그림자/회전 프레임(속도 비례).
6. R 키 리셋, 캔버스 포커스 처리.
7. 테스트: player(정규화·경계·골라인), ball(소유·loose·재소유·경계) — 고정 스텝 시뮬레이션으로.

## 비범위
슛, 골키퍼 동작, 개인기, 사운드, 캐릭터 선택.

## 종료 조건(DoD)
- typecheck/test/build 통과, 기존 회귀 없음
- 02 §2·§3 수치가 tuning.ts 와 문서에서 동일
- 사용자 확인 체크리스트 제시(달리기 느낌·드리블 터치·스프린트 리스크·경계)

## 세션 종료 의무
docs/pitch/10-session-prompts.md 상단의 "변경 전파 프로토콜" 1~6을 모두 수행하라. — 사용자가 체감 피드백으로 수치를 바꾸면 02 표와 tuning.ts 를 같이 고치고, P3·P4 프롬프트의 수치·API 를 갱신.
```

---

## 세션 P3 — 슛·골키퍼

- **상태**: ✔ 완료(2026-09-25). 아래 프롬프트는 기록용이며 재실행하지 않는다. 결과는 README 세션 로그와 02 §3·§4·§6·§7·§8, 03 §2, 01 §8 에 반영됨. 후속 세션이 쓰는 API 는 아래 **P3가 남긴 것**.
- **전제**: P2 완료(✔ 2026-09-25, API 요약은 P2 절의 "P2가 남긴 것").
- **마지막 갱신**: P3 완료 시점
- **P3가 남긴 것(P4~P7이 그대로 사용)**:
  - `game/tuning.ts` 추가분: `GOAL_MOUTH{width 240, height 80}`, `GOAL_SCREEN{planeY 118, zScale 74/80, keeperY 128}`, `ShotTuning`/`SHOT`(조준 1.1s·파워 1.8s·타임아웃 3s·오버슈트 0.12·스윗 78~92·속도 420~1100·h/지터/아치 계수·포스트/바 허용 6·킥 클립 0.25s), `KeeperTuning`/`KEEPER`(D: react 0.20 · diveSpeed 328 · maxReach 92 · predErr 0.08 · bodyReach 13.5 · reachSpread 0.23 · centerZone 30 · sweetReach 0.95, Tier 표 `tierReact/tierPredErr/tierFooled=[0,0,0.08]`, 포지셔닝·머뭇거림 수치), `MATCH{resultSeconds 2.0, fadeSeconds 0.3, bannerSeconds 1.4, tooFarSeconds 0.7}`. 디버그가 복사본을 바꾸도록 슛/키퍼 함수는 튜닝을 인자로 받는다(기본 = 위 상수).
  - `game/rng.ts`: `Rng = () => number`, `createRng(seed)`(mulberry32), `gaussian(rng)`. 게임은 `Math.random`, 테스트는 시드.
  - `game/shot.ts`: `ShotState{phase: idle|aim|power|released, elapsed, aim(-1..1), power(0..100)}`, `createShot/resetShot/pressShot(s) → "start"|"lock-aim"|"release"|null/cancelShot/stepShot(s, dt, tuning) → "timeout"|null`, `aimWave/powerWave`, `aimRay(ballX, ballY, aim) → {tx, angleDeg}`·`aimForTx`, `shotHeight/shotSpeed/shotJitterSigma/isSweet`, `classifyShot(tx, h) → onTarget|post|bar|wide|over`, `computeShot(input, rng) → ShotFlight{power, sweet, aimTx, tx, h, dist, speed, time, sigma, kind, ...}`, `flightHeight`.
  - `game/keeper.ts`: `planSave(kick, keeperX, tier: StyleTier, rng, D, hesitateLeft) → SavePlan{reactDelay, dir, high, startX, endX, reach, mode: stay|dive, saved, kind: CATCH|PUNCH|DEFLECT|null, grazed, fooled, flightTime}`, `KeeperState{phase: ready|track|dive|resolve|recover, x, vx, plan, outcome, ...}`, `createKeeper/resetKeeper/stepKeeper(k, dt, ballX, rng, D)/startDive(k, plan)/keeperBallArrived/resolveKeeper(k, outcome)/keeperPose(k) → {clip, def, frame}/keeperTargetX`. **스타일 Tier 는 `planSave` 의 `tier` 인자 하나**(`StyleTier = 0|1|2`).
  - `game/match.ts`: `ShotResult{outcome: GOAL|SAVE|POST|BAR|MISS, detail, power, sweet, tx, h, grazed}`(결과 이벤트 페이로드), `resolveShot(flight, plan, forced?)`, `ballExit(result, plan, fx, fy, rng) → {vx, vy, vz, inNet, held}`, `MatchState{goals, saves, streak, bestStreak, shots, phase: play|flight|result|fade, timer, result}`, `createMatch/beginFlight/registerResult/stepMatch(m, dt) → "reset"|null/fadeAlpha`.
  - `game/ball.ts`: `BallMode` 에 `shot` 추가, `BallState` 에 `z, vz, flight`(스크립트 비행) 추가, `launchBall(b, flight, arc)`·`ballArrived`·`releaseBall(b, vx, vy, vz)`, `FREE_BALL{gravity 900, bounce 0.5, friction 3}`. 볼 (x, y)는 화면 지면 좌표.
  - `game/montecarlo.ts`: `ZONES`, `POWER_BANDS`, `TARGET_SAVE_TABLE`(중앙×스윗스팟 60), `MC_SCENARIO`, `saveRate/saveRateTable(n, seed, tier, D, shot)`, `formatSaveTable`.
  - `scenes/PitchScene.ts`: 슛 루프(`tryShotPress` → `kick` → `updateShot` → `finishShot` → `onShotResult(result)` 빈 훅 → `stepMatch` 의 `reset` 에서 `resetPitch`), `styleTier()`(P3 는 디버그 Tier 만 반환 — **P4 가 스타일 게이지로 교체하는 유일한 지점**), `setRng`(테스트), `R` = `hardReset`(시퀀스 중단·점수 유지). 렌더 순서: 정적 레이어 → 먼지 → (득점 볼: 그림자+볼) → goal-front → 네트 리플 → 액터(키퍼·플레이어·볼 y 정렬) → 조준 화살표/리티클 → 디버그 → HUD(스코어·버튼·판·조준/파워 바·TOO FAR·결과 배너·힌트·토스트·포커스) → 페이드(이탈 + 리셋). 스코어보드는 `match` 값.
  - `scenes/shotHud.ts`: 조준/파워 바·가이드·배너·TOO FAR·스윗 링·네트 리플 그리기 함수와 레이아웃 상수(`AIM_BAR`·`POWER_BAR`·`BANNER`). `scenes/pitchDebug.ts`: `PitchDebug`(키: B · [ ] · - = · 1~5 · T · 0), `pitchDebugEnabled()` — 02 §8.
  - 알려진 임의 결정: 파워 바 인셋(6/5)·눈금·조준 화살표 앵커(볼 위 26px, 그림이 위쪽을 향한다고 가정)·볼 트레일(도형 점)은 시안 눈대중이라 사용자 확인 필요. `ui/sweet-spot`·관중·`fx-sweet`·`fx-star` 등 이펙트 이미지는 P4 에서 사용. 세리머니는 최소 표시(GOAL 에 celebrate A/B, 그 외 disappointed 클립).

```text
[공통] 이 프로젝트의 피치(2D 픽셀 축구 진입 화면) 계획 문서는 docs/pitch/ 에 있다. 먼저 docs/pitch/README.md 와 아래에 적힌 문서를 읽어라.
이전 세션의 README "세션 로그"에 적힌 '결정/변경점'이 이 지시문과 충돌하면, 코드를 짜기 전에 문서(특히 docs/pitch/10-session-prompts.md 의 이 세션 절)를 먼저 고쳐라.
작업 원칙: 게임 화면은 반드시 2D Canvas. 잔디동 월드 이미지 에셋은 사용 금지. 텍스트는 이미지가 아니라 캔버스에서 Galmuri11로 그린다. 누락된 에셋은 undefined 처리하고 도형 플레이스홀더로 대체한다.
브라우저 미리보기/수동 검증은 하지 마라(사용자가 배포 후 직접 확인한다). 대신 pnpm typecheck, pnpm test, pnpm build 로 검증하고, 세션 마지막에 사용자가 확인할 체크리스트를 제시하라.
셸 편집 주의: Bash heredoc 은 작은따옴표가 있는 한글 텍스트에서 실패하기 쉽다. 파일은 Write/Edit 도구로 쓰고, 일괄 변환은 Node 스크립트로 하라. 커밋은 내가 요청할 때만 한다.

# 세션 P3 — 3단계 슛 + 골키퍼 AI + 판정
먼저 읽을 문서: docs/pitch/README.md, 02-gameplay-spec.md(§4, §6, §7, §9), 03-screens-and-ui.md(§2-1, §2-2), 04 §6(keeper-ai 클립), 10 의 P2 절 "P2가 남긴 것", 코드 game/tuning.ts·game/player.ts·game/ball.ts·scenes/PitchScene.ts.

## 목표
Space 3단계 슛(조준 화살표 → 파워 게이지)과 확률 기반 AI 골키퍼로 골/선방/포스트/빗나감이 나뉘는 루프를 완성한다.

## 범위
1. game/shot.ts: 상태기계(idle→aim→power→released, 3s 타임아웃, Esc 취소), 삼각파(조준 1.1s, 파워 1.8s), tx/h/속도/지터/스윗스팟(02 §4 공식), 포스트/바 판정, 비행 시간·z 아치.
2. game/keeper.ts: 상태기계(02 §6), 포지셔닝(0.35 팔로우, 머뭇거림), 반응·예측·도달·판정·결과 종류(CATCH/PUNCH/DEFLECT), 난이도 변수 D(tuning.ts), RNG 주입(시드 가능).
3. game/match.ts: 결과(GOAL/SAVE/POST/BAR/MISS) 처리, 스코어/연속 골, 2.0s 리셋 시퀀스, 볼 리바운드.
4. PitchScene 연결: 골키퍼 클립(ready/shuffle/dive/save/react)·볼 궤적·골 앞 네트 리플, 조준 바/파워 바/리티클 HUD, 결과 배너(기본 텍스트/도형, 이미지는 있으면 사용), TOO FAR. P2 의 PitchScene 은 키퍼를 `KEEPER_CLIPS.ready` 로 고정해 그리고(화면 발 (480,128) — 로직 골 라인 y=150 은 화면 골면 y=118 로 매핑, 02 §2), 볼은 `game/ball.ts` 의 3모드(`carried/loose/dead`)뿐이다 — 슛은 `BallMode` 에 `shot`(z 높이 포함)을 추가하고, `SHOOT_MAX_DISTANCE`(tuning.ts)로 진입 거리를 판정하며, 슛 중에는 씬이 `stepPlayer` 입력을 0 으로 넣어 플레이어를 정지시킨다. 점수는 `PitchScene.score` 자리에 match.ts 결과를 연결하고, HUD 힌트(`HINT_ITEMS`)에 Space 슛을 추가한다. 스프린트 시 볼 소유 상실 튜닝은 P2 에서 끝났으므로 건드리지 않는다.
5. 디버그(?pitchDebug=1): 히트박스, 골평면, 키퍼 도달 반경, 튜닝 슬라이더, 강제 결과 키, Monte Carlo 콘솔 출력.
6. 테스트: shot(공식·판정·타임아웃), keeper(02 §6 목표 선방률 표를 셀당 20,000회 Monte Carlo 시드 고정으로 ±6pt 검증, Tier 효과), match(스코어/리셋).
   튜닝은 D 값으로 목표 표에 맞추고, 표를 바꿔야 한다면 근거를 남기고 02 를 고친다.

## 비범위
개인기(스타일 게이지 입력은 자리만), 사운드, 세리머니 연출(최소 상태 표시만).

## 종료 조건(DoD)
- typecheck/test/build 통과
- Monte Carlo 테스트가 목표 선방률 표에 통과
- 사용자 확인 체크리스트: 골/선방 비율 체감(평균 45~55%), 스윗스팟 체감, 조준/파워 타이밍 난이도

## 세션 종료 의무
docs/pitch/10-session-prompts.md 상단의 "변경 전파 프로토콜" 1~6을 모두 수행하라. — 최종 D 값, 공식 변경, 상태기계 이름을 02·tuning.ts 에 동기화하고 P4 프롬프트(스타일 Tier 훅 위치, 결과 이벤트 이름) 갱신.
```

---

## 세션 P4 — 개인기·연출·사운드

- **상태**: ✔ 완료(2026-09-25). 아래 프롬프트는 기록용이며 재실행하지 않는다. 결과는 README 세션 로그와 02 §5·§7, 03 §2, 01 §5·§6, 06 §3-1 에 반영됨. 후속 세션이 쓰는 API 는 아래 **P4가 남긴 것**.
- **전제**: P3 완료(✔ — API 는 P3 절의 "P3가 남긴 것"). SFX P0 일부 확보(없으면 무음 폴백). P2 의 `PitchScene` 소리 버튼/M 키는 이미 `toggleMute()` 로 `fc26-pitch-settings-v1`(`sfxOn`·`musicOn` 동시 토글)에 저장한다 — 오디오 매니저는 이 값을 읽어 시작한다.
- **마지막 갱신**: P4 완료 시점
- **P4가 남긴 것(P5~P7이 그대로 사용)**:
  - `game/tuning.ts` 추가분: `SkillId`, `SKILLS`(키 코드·클립·지속·이동·스타일·hop 4종), `SKILL_IDS`, `STYLE`(쿨다운 0.5·캔슬 0.15·체인 창 2.0·보너스 1.5·반복 0.5·감소 지연 2.0·15/s·Tier 50/80·핍 5), `JUICE`(흔들림 6/0.25s·포스트 3/0.15s·히트스톱 0.06·콘페티 36·관중 0.4s·콜아웃 1.1s·라벨 0.9s).
  - `game/skills.ts`: `SkillState`(active·whiff·elapsed·cooldown·style·combo·stepX/stepY 등), `createSkills/resetSkills`, `skillForKey(code)`, `startSkill(s, id, carried, fx, fy) → SkillStart|null`(`whiff·gain·chained·repeated·tierBefore·tierAfter`), `stepSkills(s, dt, hold)`(이동은 `s.stepX/stepY` 로 나옴), `canCancelSkill/cancelSkill`, `consumeStyle(s) → StyleTier`, `styleTierOf/tierOf`, `skillPose(s)`(클립·방향·미러·프레임)·`skillHop(s)`. `game/stats.ts`: `recordShot(stats, outcome, sessionBest)`.
  - `storage.ts`: `PitchStats`, `loadPitchStats/savePitchStats`(`fc26-pitch-stats-v1`), `DEFAULT_PITCH_STATS`.
  - `engine/tween.ts`(이징·`Tween`·`approach`), `engine/effects.ts`(`createEffectPool(capacity)`: `spawn({key, frames, x, y, vx, vy, life, scale, color})` — 바닥 중앙 앵커의 한 번 재생 스트립, 이미지 없으면 `color` 사각형; `drawEffects(g, pool, image)`).
  - `audio/sfxMap.ts`: `PitchSfxId`(06 의 SFX 50개 = `pitch-<id>.mp3`), `SFX_CANDIDATES`, `SFX_GAIN`, `BGM_FILES`, `PitchBgmId = "loading"|"pitch"|"locker"`, `resolveSfx/resolveSfxAsync`, `kickSfx(power)`. `audio/pitchAudio.ts`: `PitchAudio`(`playBgm/unlock/playSfx(id, volume)/stopSfx/preload/setSettings/dispose`), `PitchAudioLike`, `SILENT_PITCH_AUDIO`.
  - `SceneHost` 에 선택 필드 `audio?: PitchAudioLike`(PitchEntry 가 주입, 첫 `keydown`/`pointerdown` 에서 `unlock`)와 `reducedMotion?(): boolean` 추가. **씬은 `ctx.host.audio ?? SILENT_PITCH_AUDIO`** 로 쓰면 테스트·폴백에서도 안전.
  - `scenes/styleHud.ts`: `drawStyleMeter`·`drawCallout`·`drawSkillLabel`·`STYLE_METER`·`CALLOUT`. `scenes/PitchScene.ts` 추가분: 개인기 Z X C V(`onKey` 기본 분기 → `tryStartSkill`), Space = `onSpace`(개인기 캔슬 창 → `tryShotPress`), `styleTier()` = 게이지(디버그 T 우선), `kick()` 이 Tier 를 읽고 `consumeStyle`, `onShotResult` 가 소리·흔들림·히트스톱(`update` 초반에서 시뮬 스킵)·콘페티·관중(스탠드 띠 흔들기)·통계 저장, `syncAudio()`(발소리·터치·스프린트·볼 상태·슛 단계 소리), `resetPitch()` 가 개인기·이펙트·소리 추적 상태도 리셋, `toggleMute()` 가 `audio.setSettings`.
  - 알려진 임의 결정(사용자 확인 필요): 스타일 미터 그림 인셋(6/10)·핍 위치(x 900)·콜아웃 위치(300,150)는 눈대중, 카메라 흔들림은 월드 레이어만 이동해 6px 가장자리가 잠깐 비칠 수 있음, 관중 스프라이트(`env/crowd-*`)는 스탠드 위치 정보가 없어 쓰지 않고 스탠드 띠를 흔드는 방식으로 대체, 누적 통계는 화면에 표시하지 않음, 볼륨 조절 UI 없음(저장된 `sfxVolume`/`musicVolume` 사용).

```text
[공통] 이 프로젝트의 피치(2D 픽셀 축구 진입 화면) 계획 문서는 docs/pitch/ 에 있다. 먼저 docs/pitch/README.md 와 아래에 적힌 문서를 읽어라.
이전 세션의 README "세션 로그"에 적힌 '결정/변경점'이 이 지시문과 충돌하면, 코드를 짜기 전에 문서(특히 docs/pitch/10-session-prompts.md 의 이 세션 절)를 먼저 고쳐라.
작업 원칙: 게임 화면은 반드시 2D Canvas. 잔디동 월드 이미지 에셋은 사용 금지. 텍스트는 이미지가 아니라 캔버스에서 Galmuri11로 그린다. 누락된 에셋은 undefined 처리하고 도형 플레이스홀더로 대체한다.
브라우저 미리보기/수동 검증은 하지 마라(사용자가 배포 후 직접 확인한다). 대신 pnpm typecheck, pnpm test, pnpm build 로 검증하고, 세션 마지막에 사용자가 확인할 체크리스트를 제시하라.
셸 편집 주의: Bash heredoc 은 작은따옴표가 있는 한글 텍스트에서 실패하기 쉽다. 파일은 Write/Edit 도구로 쓰고, 일괄 변환은 Node 스크립트로 하라. 커밋은 내가 요청할 때만 한다.

# 세션 P4 — 개인기 4종 + 스타일 게이지 + 연출 + 사운드
먼저 읽을 문서: docs/pitch/README.md, 02-gameplay-spec.md(§5, §7), 03 §2, 06-audio.md, 01 §6.

## 목표
개인기(Z/X/C/V)와 스타일 게이지가 골키퍼 속임(Tier)으로 이어지게 하고, 골/선방 연출과 사운드·설정 저장을 완성한다.

## 범위
1. game/skills.ts: 4종(지속·이동량·스타일 값 02 §5), 쿨다운 0.5s, 볼 소유 조건, 헛스윙, 체인 배율, 게이지 감소, Tier1/2 임계값, 마지막 0.15s 슛 캔슬(P3 의 슛 상태기계 `pressShot` 은 `idle` 에서만 시작하므로, 개인기 중 캔슬 창에서는 씬이 개인기 상태를 끝내고 `tryShotPress` 를 호출), side 미러 재생. **Tier 연결은 `PitchScene.styleTier()` 한 함수를 스타일 게이지 값(≥50 → 1, ≥80 → 2)으로 바꾸면 끝** — 효과(반응 +0.10/+0.20s, 예측 오차 ×1.25/×1.5, 완전 속임 8%)는 P3 `planSave` 가 이미 처리한다. 킥 순간 스타일 소비(0 리셋)는 `kick()` 안에서 `styleTier()` 를 읽은 직후.
2. HUD: 스타일 미터+콤보 핍, 스타일 콜아웃 배너(STYLE/PERFECT).
3. 연출: 카메라 흔들림(reduced-motion 대응), 히트스톱 60ms, 콘페티/스파클, 관중 반응(있으면), 이펙트 이미지(`fx-star`·`fx-sweet`·`ball-sparkle` 등). 결과 배너·네트 리플·세리머니 A/B·볼 트레일은 P3 에서 이미 구현됨. **결과 연출·사운드·통계는 모두 `PitchScene.onShotResult(result: ShotResult)` 빈 훅에 연결**(GOAL/SAVE/POST/BAR/MISS, `detail`, `sweet`, `grazed`). 히트스톱은 `update` 에서 `dt` 를 잠깐 0 으로 만드는 방식을 검토.
4. engine/tween.ts, 이펙트 풀링 점검.
5. audio/pitchAudio.ts(06 참고: BGM 2채널 크로스페이드, SFX 풀, 누락 파일 무음, 첫 입력 시 BGM 시작), audio/sfxMap.ts(이벤트→파일, 06 §3 재사용 후보 폴백, victory.mp3 연결 금지), 이벤트 연결(발소리, 터치, 킥 강도별, 조준/게이지 틱, 스윗스팟, 개인기, 골/선방/포스트/미스, UI hover/click).
6. 설정/기록 저장: `loadPitchSettings/savePitchSettings`(fc26-pitch-settings-v1)는 **P1에서 이미 구현됨**(`src/web/storage.ts`, `PitchSettings{sfxVolume,musicVolume,sfxOn,musicOn}` 0~1 클램프) — 사용만 하고 소리 버튼/M 키에 연결(P2 가 `PitchScene.toggleMute()` 로 저장까지는 이미 구현 — 여기서는 오디오 매니저가 그 값을 따르게 하고, 볼륨은 `sfxVolume/musicVolume`). 컨트롤 힌트(`HINT_ITEMS`)에 Z X C V 개인기를 추가(Space 슛 항목은 P3 에서 이미 추가됨). `fc26-pitch-stats-v1` 의 최고 연속 골은 `MatchState.bestStreak`(P3)를 저장. fc26-pitch-stats-v1(골/선방/최고 연속)의 load/save 는 새로 추가.
7. 테스트: skills(쿨다운·체인·감소·Tier), storage(stats만 신규 — settings 는 `pitch/__tests__/pitchStorage.test.ts` 에 이미 있음), sfxMap(누락 시 무음).

## 비범위
캐릭터 선택, 락커룸.

## 종료 조건(DoD)
- typecheck/test/build 통과
- 06 의 P0 파일명 규칙이 코드와 일치
- 사용자 확인 체크리스트: 개인기 구별감, 속임 체감, 연출 과함/부족, 소리 타이밍

## 세션 종료 의무
docs/pitch/10-session-prompts.md 상단의 "변경 전파 프로토콜" 1~6을 모두 수행하라. — 실제 사용한 SFX 파일명·우선순위 변경을 06 에 반영, 확보 상태 체크, P5·P6·P7 프롬프트 갱신.
```

---

## 세션 A2 — 아트 파이프라인 2

- **상태**: ✔ 완료(2026-09-25). 아래 프롬프트는 기록용이며 재실행하지 않는다. A1 의 `--all` 변환이 이미 12명·select UI·fx-celebrate 를 만들었고, A2 는 검수·테스트(`characterAssets.test.ts`)·04 §10(QA 결과·미러 확인 목록·인셋 확정)을 남겼다. 재생성 필요 목록 없음.
- **전제**: 이미지 #026~#116 생성·저장(러닝북 Phase 4~5).
- **마지막 갱신**: A2 완료 시점

```text
[공통] 이 프로젝트의 피치(2D 픽셀 축구 진입 화면) 계획 문서는 docs/pitch/ 에 있다. 먼저 docs/pitch/README.md 와 아래에 적힌 문서를 읽어라.
이전 세션의 README "세션 로그"에 적힌 '결정/변경점'이 이 지시문과 충돌하면, 코드를 짜기 전에 문서(특히 docs/pitch/10-session-prompts.md 의 이 세션 절)를 먼저 고쳐라.
작업 원칙: 게임 화면은 반드시 2D Canvas. 잔디동 월드 이미지 에셋은 사용 금지. 텍스트는 이미지가 아니라 캔버스에서 Galmuri11로 그린다. 누락된 에셋은 undefined 처리하고 도형 플레이스홀더로 대체한다.
브라우저 미리보기/수동 검증은 하지 마라(사용자가 배포 후 직접 확인한다). 대신 pnpm typecheck, pnpm test, pnpm build 로 검증하고, 세션 마지막에 사용자가 확인할 체크리스트를 제시하라.
셸 편집 주의: Bash heredoc 은 작은따옴표가 있는 한글 텍스트에서 실패하기 쉽다. 파일은 Write/Edit 도구로 쓰고, 일괄 변환은 Node 스크립트로 하라. 커밋은 내가 요청할 때만 한다.

# 세션 A2 — 나머지 11명 + 선택 UI + 연출 FX 변환
먼저 읽을 문서: docs/pitch/README.md, 04 §2~§5, 09 진행 표(Phase 4~5), A1 세션 로그(README).

## 목표
scripts/convert-pitch-art.mjs 로 11명의 atlas·portraits·hero, ui-select/select-bg/fx-celebrate 를 변환하고 QA 한다.

## 범위
1. 11명 일괄 변환(pnpm convert:pitch-art -- characters <id>) + qa-report 검토. 문제가 있는 캐릭터는 문제 시트만 재변환(--only)하도록 하고, 원본 재생성이 필요하면 09 에 "재생성 필요" 목록과 수정 문구(Keep everything, but fix: …) 를 정리해 사용자에게 전달.
2. 12명 atlas 크기 일괄 테스트(960x960), portraits(4x192x192), hero.
3. ui-select, ui-select-bg, fx-celebrate 변환, 9-slice 인셋 확정.
4. assets.ts 의 select 그룹 키/가중치, char:<id> 그룹 채움.
5. 좌향 미러 시 비대칭 소품 캐릭터(예: 헤드셋) 확인 목록을 QA 결과에 남김.

## 종료 조건(DoD)
- typecheck/test/build 통과, 12명 자산 존재
- 문제 목록/재생성 필요 목록을 사용자에게 제시(사용자가 시각 확인)

## 세션 종료 의무
docs/pitch/10-session-prompts.md 상단의 "변경 전파 프로토콜" 1~6을 모두 수행하라. — 04 §5 캐릭터 특징 표에 반영할 교정 사항과 09 검수 체크 개선을 갱신 후 재생성.
```

---

## 세션 P5 — 캐릭터 선택

- **상태**: ✔ 완료(2026-09-25). 아래 프롬프트는 기록용이며 재실행하지 않는다. 결과는 README 세션 로그와 03 §3에 반영됨(확정 순서 = 로드 성공 후 저장, 프리뷰는 0.25s 머문 뒤 지연 로드, 화살표는 이름 판 옆).
- **전제**: A2 완료(✔, 12명 atlas·hero·초상화 48·select UI·select-bg 전부 `src/web/assets/pitch` 에 있고 `ASSET_GROUPS.select`(50키)와 `groupSpecs("char:<id>")`(atlas+초상화 4)가 채워져 있음 — 선택창은 `assets.loadGroup("select")` 후 hero(높이 383~384, 폭 165~203)·`portraits/<id>-neutral|confident` 를 그리고, 카드는 `ui/card-normal|hover|selected`(96×128 고정, 9-slice 없음), 이름판 `ui/name-plate`(104×40 원본, 인셋 12, 가로만 늘림), 확정 `ui/confirm|confirm-pressed`(216×48), 화살표 32×32, 현재 사용 중 `ui/tag-current`(56×16), 포지션 `ui/pos-badge`(32×32) — 크기는 `PITCH_ASSET_META`). 좌향은 측면 프레임 미러이며 비대칭 소품 목록은 04 §10. P4 완료(✔). P2 가 `data/characters.ts`(우왁굳 1명, `getCharacter(id)`), 로딩 씬의 `char:<선택 id>` 선로딩, `PitchScene.onButton("change")`(현재 토스트) 를 마련해 두었고, P4 가 오디오(`SceneHost.audio`, `ui-cursor`/`ui-select`/`ui-back` 이벤트 이름과 파일이 이미 있음)와 개인기 상태(`resetPitch()` 가 함께 리셋)를 추가했다. 선택창을 `manager.push` 하면 아래 PitchScene 은 update 되지 않는다(스택 규칙) — 개인기·히트스톱·이펙트 타이머도 멈춘다.
- **마지막 갱신**: A2 완료 시점

```text
[공통] 이 프로젝트의 피치(2D 픽셀 축구 진입 화면) 계획 문서는 docs/pitch/ 에 있다. 먼저 docs/pitch/README.md 와 아래에 적힌 문서를 읽어라.
이전 세션의 README "세션 로그"에 적힌 '결정/변경점'이 이 지시문과 충돌하면, 코드를 짜기 전에 문서(특히 docs/pitch/10-session-prompts.md 의 이 세션 절)를 먼저 고쳐라.
작업 원칙: 게임 화면은 반드시 2D Canvas. 잔디동 월드 이미지 에셋은 사용 금지. 텍스트는 이미지가 아니라 캔버스에서 Galmuri11로 그린다. 누락된 에셋은 undefined 처리하고 도형 플레이스홀더로 대체한다.
브라우저 미리보기/수동 검증은 하지 마라(사용자가 배포 후 직접 확인한다). 대신 pnpm typecheck, pnpm test, pnpm build 로 검증하고, 세션 마지막에 사용자가 확인할 체크리스트를 제시하라.
셸 편집 주의: Bash heredoc 은 작은따옴표가 있는 한글 텍스트에서 실패하기 쉽다. 파일은 Write/Edit 도구로 쓰고, 일괄 변환은 Node 스크립트로 하라. 커밋은 내가 요청할 때만 한다.

# 세션 P5 — 12명 레지스트리 + 캐릭터 선택창
먼저 읽을 문서: docs/pitch/README.md, 03-screens-and-ui.md(§2-3, §3), 01 §3-4(그룹 lazy), 04 §5(12명 표).

## 목표
"캐릭터 변경" 버튼/Tab 으로 선택창을 열어 12명 중 하나로 바꾸고 localStorage 로 유지한다. 첫 진입 기본은 우왁굳.

## 범위
1. data/characters.ts 를 12명(우왁굳 첫째, 이름·포지션·테마색·아틀라스 키)으로 확장, 03 §3 순서 고정.
2. scenes/CharacterSelectScene.ts(오버레이): 히어로+프리뷰(idle→run), 6x2 카드 그리드, 현재 사용 중 태그, 이름/포지션 판, 확정/취소, 키보드(←→↑↓ Enter Esc Tab)/마우스(hover·클릭·더블클릭), select 그룹 지연 로딩과 스켈레톤.
3. 확정 → `savePitchCharacter`(P1에서 구현됨, 형식만 검사) 로 저장. **레지스트리에 없는 id 를 기본 woowakgood 로 정정하는 로직은 여기서 추가**(`loadPitchCharacter()` 결과를 characters.ts 에 대조; P2 의 `getCharacter(id)` 는 모르는 id 를 첫 캐릭터로 돌려주고 LoadingScene·PitchScene 이 이미 이를 통해 해석하므로, 여기서는 저장값 자체를 덮어쓰는 정정과 `PITCH_CHARACTERS` 12명 확장만 하면 된다. `PitchScene.onButton("change")` 의 토스트는 선택창 push 로 교체하고, 캐릭터 교체 시 `PitchScene.character` 를 갱신하는 메서드를 추가할 것) → char:<id> 그룹 로드 완료까지 카드에 로더 표시 → 플레이어 교체(볼/키퍼 리셋 — `hardReset()` 를 그대로 부르면 개인기·스타일 게이지·이펙트도 함께 초기화됨). 이전 캐릭터 그룹 메모리 해제.
4. 사운드: `ctx.host.audio?.playSfx("ui-cursor" | "ui-select" | "ui-back")`(이벤트 이름은 `audio/sfxMap.ts`, 세 파일 모두 `public/sfxes` 에 있음). 카드 hover/클릭은 기존 `ui-hover`/`ui-click`.
5. 대시보드 버튼은 선택창에서도 표시, ESC 우선순위(선택창 닫기 → 그다음).
6. 테스트: 레지스트리(12명 고유 id, 포지션 유효), 저장값 정정, 커서 이동 격자 로직, 로딩 실패 폴백(현재 캐릭터 유지).

## 종료 조건(DoD)
- typecheck/test/build 통과
- 사용자 확인 체크리스트: 12명 모두 선택 가능, 새로고침 후 선택 유지, 첫 방문 우왁굳, 로딩 지연 시 UX

## 세션 종료 의무
docs/pitch/10-session-prompts.md 상단의 "변경 전파 프로토콜" 1~6을 모두 수행하라. — P6 프롬프트(락커룸에서 현재 캐릭터 사용 방식) 갱신.
```

---

## 세션 A3 — 아트 파이프라인 3

- **상태**: ✔ 완료(2026-09-25). A1 `--all` 이 5개 시트를 이미 변환했고 A3 는 검수·테스트(`lockerAssets.test.ts`)·locker 그룹 아이콘 3개 추가만 했다. 아래 프롬프트는 기록용이며 재실행하지 않는다. 결과·앵커 표는 05 §7.

```text
[공통] 이 프로젝트의 피치(2D 픽셀 축구 진입 화면) 계획 문서는 docs/pitch/ 에 있다. 먼저 docs/pitch/README.md 와 아래에 적힌 문서를 읽어라.
이전 세션의 README "세션 로그"에 적힌 '결정/변경점'이 이 지시문과 충돌하면, 코드를 짜기 전에 문서(특히 docs/pitch/10-session-prompts.md 의 이 세션 절)를 먼저 고쳐라.
작업 원칙: 게임 화면은 반드시 2D Canvas. 잔디동 월드 이미지 에셋은 사용 금지. 텍스트는 이미지가 아니라 캔버스에서 Galmuri11로 그린다. 누락된 에셋은 undefined 처리하고 도형 플레이스홀더로 대체한다.
브라우저 미리보기/수동 검증은 하지 마라(사용자가 배포 후 직접 확인한다). 대신 pnpm typecheck, pnpm test, pnpm build 로 검증하고, 세션 마지막에 사용자가 확인할 체크리스트를 제시하라.
셸 편집 주의: Bash heredoc 은 작은따옴표가 있는 한글 텍스트에서 실패하기 쉽다. 파일은 Write/Edit 도구로 쓰고, 일괄 변환은 Node 스크립트로 하라. 커밋은 내가 요청할 때만 한다.

# 세션 A3 — 락커룸·스탯 UI 변환
먼저 읽을 문서: docs/pitch/README.md, 05 (E5~E7, U8, U9), 09 진행 표(Phase 6).

## 목표
locker-gate, locker-bg, locker-props, ui-stat, ui-icons 를 변환하고 매니페스트/에셋 키를 채운다.

## 범위
- pnpm convert:pitch-art 로 5개 시트 변환(scene 은 --scene), 셀 분리(스탯 분석기 3상태, 문 2상태, 노드 3상태 등), 9-slice 인셋, QA.
- assets.ts 의 locker 그룹 키/가중치 채움(게이트 접근 시 프리로드 대상).

## 종료 조건(DoD): typecheck/test/build 통과, QA 리포트 요약을 사용자에게 제시.

## 세션 종료 의무
docs/pitch/10-session-prompts.md 상단의 "변경 전파 프로토콜" 1~6을 모두 수행하라. — P6 프롬프트에 실제 스프라이트 크기·앵커 좌표를 반영.
```

---

## 세션 P6 — 락커룸·스탯

- **상태**: ✔ 완료(2026-09-25). 아래 프롬프트는 기록용이며 재실행하지 않는다. 결과는 README 세션 로그와 03 §2·§4·§5, 01 §3-3, 02 §2, 06 §3-1 에 반영됨. 후속 세션이 쓰는 API 는 아래 **P6가 남긴 것**.
- **P6가 남긴 것(P7이 그대로 사용)**:
  - `game/locker.ts`(순수): `GATE{x16,y400,w128,h128,centerX80,centerY470,promptRadius70,preloadRadius200}`·`GATE_SPAWN(170,470)`·`LOCKER_AREA`·`LOCKER_SPAWN(480,470)`·`ANALYZER{baseX248,baseY394,r64}`·`EXIT_DOOR{baseX480,baseY520,r60}`, `nearGate/nearGatePreload/nearAnalyzer/nearExit`, `LOCKER_COLLIDERS`·`FOOT_PAD`·`resolveBoxes(body)`·`clampToArea`.
  - `data/stats.ts`: `POSITION_KEYS`(8)·`StatAxis/StatSheet`·`STAT_SHEETS`(P6 때는 전부 `???`/null → P6b 에서 이름·설명 반영, 숫자 `values` 만 null)·`statSheetFor(position)`·`axisLabel/axisDescription/isPlaceholderSheet`. 숫자 교체 = `STAT_SHEETS[*].values` 만(03 §5).
  - `ui/hexagon.ts`: `HEX{cx276,cy304,radius140}`·`hexVertex(i)`(12시 시계방향)·`fillPolygon`·`labelPlateRect`·`hitNode/hitAxis`·`cycleAxis(current, "cw"|"ccw"|"next")`·`drawHexagon`.
  - `scenes/hudCommon.ts`: 대시보드/변경/소리 버튼 그리기·히트(`hudButtonAt`)·`soundState/syncSoundState/toggleSound`·`drawPrompt(g, plate, key, label, x, y, t)`. 피치는 P2 때의 자체 버튼 코드를 그대로 쓴다(같은 값).
  - `scenes/LockerScene.ts`(`new LockerScene({createPitch})`, `interaction()`·`analyzerState()`, 소품 목록 `PROPS`)·`scenes/StatScene.ts`(`new StatScene({character, onClose})`, `selectedAxis`·`announcement()`)·`PitchEnterParams{fromLocker}`. `PitchScene.enter(ctx, params)` 가 `fromLocker` 면 게이트 앞에 스폰, 스코어·힌트 표시는 모듈 변수 `carry` 로 이어받음. `SceneHost.announce?(text)`.
  - 알려진 임의 결정(사용자 확인 필요): 락커룸 소품 배치·충돌 상자·`LOCKER` 판 글자·프롬프트 모양(`ui/dialog-small` + 코드 키캡)·게이트 글로우/화살표 위치·분석기 반경을 발밑 기준으로 정정한 것·`PLAYER STATS` 자리(x=660 우측 정렬)·헤더의 포지션 칸(코드로 그린 사각형). `locker` 그룹은 한 번 받으면 해제하지 않음.
- **전제**: P5 ✔, A3 완료. **P5 가 남긴 것(락커룸에서 현재 캐릭터 사용법)**: 현재 캐릭터는 `data/characters.ts` 의 `resolveStoredCharacter()` 로 읽는다(저장값을 레지스트리에 대조·정정; `getCharacter(loadPitchCharacter())` 를 직접 쓰지 말 것). 그 캐릭터의 `char:<id>` 그룹(atlas + 초상화)은 피치에서 이미 로드돼 있으므로 락커룸은 `characters/<id>-atlas` 를 그대로 쓴다(클립은 `idle`/`run` 만). Tab(캐릭터 변경)은 `ctx.manager.push(new CharacterSelectScene({ currentId, onApply }))` — `onApply(character)` 가 불릴 때는 이미 `char:<id>` 로드·`savePitchCharacter`·이전 그룹 해제가 끝나 있으니 락커룸은 자기 `character` 만 교체하면 된다(피치로 돌아가면 `PitchScene.enter` 가 저장값을 다시 읽어 맞춘다). 선택창은 오버레이라 락커룸이 update 되지 않고, 닫을 때 `select` 그룹을 해제하며 대시보드 버튼은 선택창이 스스로 그린다. `PitchScene.setCharacter()` 는 피치 전용(`hardReset` 포함). `assets.release` 는 다른 그룹이 아직 가진 파일을 지우지 않으므로 `locker` 해제도 안전하다. (에셋 계약은 05 §7: 분석기·문·사물함·소품은 **하단 중앙 앵커**, 게이트는 타일 좌상단 (16,400), 육각형 3장은 중심 (276,304) 에 중앙 정렬, 프레임 9-slice 인셋 detail-panel 16 · terminal-frame 24). P4 의 오디오 API(`ctx.host.audio`: `playBgm("locker")`·`playSfx("gate-open"|"gate-close"|"stat-select"|"transition-wipe")`, 이벤트 이름은 `audio/sfxMap.ts`)를 사용한다. `pitch-stat-on`·`pitch-stat-soon` 은 아직 파일이 없어 무음(06 §3-1). 피치로 돌아오면 `PitchScene.enter` 가 `playBgm("pitch")` 로 크로스페이드한다.
- **마지막 갱신**: P6 완료 시점

```text
[공통] 이 프로젝트의 피치(2D 픽셀 축구 진입 화면) 계획 문서는 docs/pitch/ 에 있다. 먼저 docs/pitch/README.md 와 아래에 적힌 문서를 읽어라.
이전 세션의 README "세션 로그"에 적힌 '결정/변경점'이 이 지시문과 충돌하면, 코드를 짜기 전에 문서(특히 docs/pitch/10-session-prompts.md 의 이 세션 절)를 먼저 고쳐라.
작업 원칙: 게임 화면은 반드시 2D Canvas. 잔디동 월드 이미지 에셋은 사용 금지. 텍스트는 이미지가 아니라 캔버스에서 Galmuri11로 그린다. 누락된 에셋은 undefined 처리하고 도형 플레이스홀더로 대체한다.
브라우저 미리보기/수동 검증은 하지 마라(사용자가 배포 후 직접 확인한다). 대신 pnpm typecheck, pnpm test, pnpm build 로 검증하고, 세션 마지막에 사용자가 확인할 체크리스트를 제시하라.
셸 편집 주의: Bash heredoc 은 작은따옴표가 있는 한글 텍스트에서 실패하기 쉽다. 파일은 Write/Edit 도구로 쓰고, 일괄 변환은 Node 스크립트로 하라. 커밋은 내가 요청할 때만 한다.

# 세션 P6 — 락커룸 게이트 + 락커룸 + 스탯 육각형
먼저 읽을 문서: docs/pitch/README.md, 03-screens-and-ui.md(§2-2, §4, §5, §6), 02 §2(게이트 좌표), 05 §7(실제 스프라이트 크기·앵커·9-slice 인셋), 06(락커 SFX·B3).

## 목표
피치 좌하단 게이트로 락커룸에 이동하고, 스탯 분석기 상호작용으로 육각형 스탯 화면(좌: 육각형 / 우: 선택 스탯 설명, 기본 = 맨 위 축)을 띄운다. 값·라벨·설명은 전부 "???" + COMING SOON.

## 범위
1. PitchScene: 게이트 스프라이트(`env/gate-*` 128×128 좌상단 (16,400), `core` 그룹이라 이미 로드됨. 닫힘/열림/글로우/화살표 바운스, `gate-plate` 64×24), 근접 시 프롬프트 `E 락커룸`(반경 70px), E/Enter → 와이프 → LockerScene, 락커룸 프리로드(거리<200px).
2. scenes/LockerScene.ts: 배경/소품(`ASSET_GROUPS.locker` 28개를 `loadGroup("locker")`; 분석기 96×128·문 64×96·사물함 48×80·소품은 **하단 중앙 앵커**, 분석기 좌상단 = (200,266)), 플레이어 이동(볼 없음, idle/run), 충돌(벤치·사물함), 스탯 분석기 3상태 + 상호작용 반경 r=64, 출구 문 r=60, 출구 시 피치 게이트 앞(170,470) 스폰, BGM B3(`audio.playBgm("locker")`), 문 SFX(`gate-open`/`gate-close`). 피치의 컨트롤 힌트 줄(y 490, 첫 12초, 개인기 항목까지 넣으면 x 16~약 780)이 게이트(16~144, 400~528)와 겹치므로 힌트를 게이트 오른쪽으로 옮기거나 게이트를 우선 그릴지 결정할 것(03 §2-1).
3. data/stats.ts: PositionKey 8종, StatAxis/StatSheet 타입, STAT_SHEETS 자리표시자(전부 "???", 값 null). 캐릭터 포지션 연동.
4. ui/hexagon.ts: 링 6개(아트는 `ui/hex-bg`·`hex-fill`·`hex-frame` 를 중심 (276,304) 에 중앙 정렬로 겹치고, 노드는 `node-normal/hover/selected` 를 꼭짓점 좌표에 덧그림. 아트가 꼭짓점 노드를 이미 포함하므로 폴리곤 채움 알파만 코드로 펄스), 꼭짓점 좌표(12시 시계방향), 채움 폴리곤(60% 균일 펄스), 노드 hit test, 라벨 판.
5. scenes/StatScene.ts(오버레이): 03 §5 레이아웃(`terminal-frame` 9-slice 인셋 24 로 896×492, `detail-panel` 인셋 16, `axis-plate` 72×22, `coming-soon` 216×40 — 이미지에는 글자가 없으므로 `COMING SOON` 은 캔버스 텍스트로 덧그림), 기본 선택 = 맨 위 축, 클릭/←→/Tab 선택, 설명 패널 갱신("???"), COMING SOON 리본, Esc 닫기, aria-live 대체 텍스트.
6. 락커룸/스탯에서도 대시보드 버튼·소리 버튼·Tab(캐릭터 변경) 동작(Tab = 위 전제의 `CharacterSelectScene` push, 스탯 오버레이가 열려 있을 땐 Tab 이 스탯 축 순환이므로 선택창은 락커룸 상태에서만 연다).
7. 테스트: hexagon 기하(꼭짓점 6개 좌표·hit test), 선택 순환(시계/반시계/Tab), stats 자리표시자 완전성(8종 × 6축), 게이트/문 상호작용 반경 판정.

## 종료 조건(DoD)
- typecheck/test/build 통과
- 사용자 확인 체크리스트: 게이트 진입/복귀 위치, 스탯 화면 좌우 구조, 기본 선택 축, "???"·COMING SOON 표기

## 세션 종료 의무
docs/pitch/10-session-prompts.md 상단의 "변경 전파 프로토콜" 1~6을 모두 수행하라. — stats.ts 교체 방법(확정 데이터가 오면 어디를 고치는지)을 03 §5 에 명시하고 P7 프롬프트 갱신.
```

---

## 세션 P6b — 스탯 정의(이름·설명) 반영

- **상태**: ✔ 완료(2026-09-25). 아래 프롬프트는 기록용이며 재실행하지 않는다. 결과는 README 세션 로그와 11(원천)·03 §5 에 반영됨. **실제 패널 아트 때문에 내용 영역이 316px 가 아니라 (40,82) 320×204** 이며(11 §6-1), 42축은 전부 스크롤 없이 들어간다. 후속 세션이 쓰는 API: `data/stats.ts`(`StatAxis{kind,plus,minus,subs}`·`COMMON_AXES`·`isPlaceholderAxis`·`axisTag`), `ui/statDetail.ts`(`wrapText`·`layoutStatDetail`·`clampScroll`·`DETAIL_CONTENT`), `StatScene`(`announcementFor`·`scrollOffset`/`scrollMax`·`onWheel`), `Scene.onWheel`·`SceneManager.wheel`, `ui/hexagon.ts` `KIND_COLORS`.
- **전제**: P6 완료(`data/stats.ts` 에 8종 자리표시자 시트, `scenes/StatScene.ts` 의 육각형+설명 패널, `ui/hexagon.ts`, `STAT_DETAIL_PANEL`(512,104,400×392)·`drawRibbon`·`ui/detail-panel` 9-slice 가 있음). **능력치 숫자는 계속 `???`**(값 `null`, COMING SOON 유지) — 이름·설명·판정 기준·세부 항목만 실제 내용으로 바꾼다. 신규 이미지는 필요 없다(기존 `ui-stat` 재사용 + 캔버스 도형).
- **마지막 갱신**: P6 완료 시점에 실제 코드와 대조함 — 이 절이 쓰는 이름(`data/stats.ts`·`STAT_SHEETS`·`statSheetFor/axisLabel/axisDescription/STAT_PLACEHOLDER/isPlaceholderSheet`·`scenes/StatScene.ts` 의 `STAT_DETAIL_PANEL`/`drawRibbon`·`ui/hexagon.ts`·`__tests__/stats.test.ts`)은 모두 그대로 존재한다. 추가로 알아 둘 P6 사실: 설명 패널은 `drawDetailPanel`(위에 `AXIS n/6`·축 이름 20px·구분선·설명 12px, 하단 `drawRibbon`), 축 라벨 판은 `drawAxisPlate`(72×22 `ui/axis-plate` 늘림, 10px 글자), 스탯 화면 aria 안내는 `announcement()`(`선택한 스탯 n/6: <label>`)라 라벨이 바뀌면 자동 반영, `__tests__/stats.test.ts` 의 `???` 기대값(라벨·설명·값 null)은 이 세션이 갱신할 대상. P6 의 03 §5 "확정 데이터로 교체하는 방법" 문단이 이 세션의 정리 대상.

```text
[공통] 이 프로젝트의 피치(2D 픽셀 축구 진입 화면) 계획 문서는 docs/pitch/ 에 있다. 먼저 docs/pitch/README.md 와 아래에 적힌 문서를 읽어라.
이전 세션의 README "세션 로그"에 적힌 '결정/변경점'이 이 지시문과 충돌하면, 코드를 짜기 전에 문서(특히 docs/pitch/10-session-prompts.md 의 이 세션 절)를 먼저 고쳐라.
작업 원칙: 게임 화면은 반드시 2D Canvas. 잔디동 월드 이미지 에셋은 사용 금지. 텍스트는 이미지가 아니라 캔버스에서 Galmuri11로 그린다. 누락된 에셋은 undefined 처리하고 도형 플레이스홀더로 대체한다.
브라우저 미리보기/수동 검증은 하지 마라(사용자가 배포 후 직접 확인한다). 대신 pnpm typecheck, pnpm test, pnpm build 로 검증하고, 세션 마지막에 사용자가 확인할 체크리스트를 제시하라.
셸 편집 주의: Bash heredoc 은 작은따옴표가 있는 한글 텍스트에서 실패하기 쉽다. 파일은 Write/Edit 도구로 쓰고, 일괄 변환은 Node 스크립트로 하라. 커밋은 내가 요청할 때만 한다.

# 세션 P6b — 포지션별 스탯 이름·설명 반영
먼저 읽을 문서: docs/pitch/11-stat-definitions.md(이 세션의 유일한 명세 — 스탯 이름·설명·판정 기준·세부 항목의 한국어 원문, 데이터 모델, 패널 UI, 테스트 계획), 03-screens-and-ui.md §5, 그리고 현재 코드 src/web/pitch/data/stats.ts, data/characters.ts(포지션), scenes/StatScene.ts, ui/hexagon.ts, engine/text.ts, __tests__/stats.test.ts 와 StatScene 관련 테스트.

## 목표
락커룸 스탯 화면의 육각형 6축 라벨과 우측 설명 패널을 `???` 에서 **실제 스탯 이름·설명**으로 바꾼다. 필드 포지션(ST·WF·CB·FB·CM·CDM)은 공통 3(위치선정·탈압박·패스)+고유 3, **GK 는 공통 없이 GK 고유 6**, 감독(MGR, 우왁굳)은 정의가 없어 `???` ×6 유지. **능력치 숫자는 정해지지 않았으므로 계속 `???`(값 null, 60% 균일 폴리곤, COMING SOON 리본 유지).** 각 스탯의 설명은 구조화된 UI(태그 칩·판정 기준 +/− 행·세부 항목 트리·자식 칩)로 보여준다.

## 범위
1. data/stats.ts (11 §2~§5): `StatKind`("common"|"unique")·`StatSub`(title/text/plus/minus/children)를 추가하고 `StatAxis` 에 `kind`, `plus?`, `minus?`, `subs?` 를 추가(기존 `id/label/description` 과 `statSheetFor/axisLabel/axisDescription/STAT_PLACEHOLDER/isPlaceholderSheet` 는 유지). 공통 3개는 한 곳에서 정의해 6개 필드 포지션이 같은 객체를 공유하고, `골 결정력`(ST·WF·CM)·`창조`(CB·FB·CDM 동일 문구)·`수비`(CB·FB) 도 공유 상수로 재사용. 11 §3~§5 의 한국어 문구·id·순서를 그대로 옮긴다(공통 3 → 고유 3, 12시 = 위치선정, GK 는 위치 선정부터 6개). `MGR` 은 자리표시자 시트 유지 + `isPlaceholderAxis(axis)` 헬퍼. `values` 는 8종 모두 null.
2. ui/statDetail.ts(신규, 순수 함수): `wrapText(text, maxWidth, measure)`(한글 글자 단위, 공백·부호 우선 끊기, 폭보다 넓은 글자도 무한 루프 없이) 와 `layoutStatDetail(axis, availableWidth, measure)` → 블록 배열(머리줄·제목·구분선·설명·판정 기준·세부 항목, 각 y·높이·줄 목록). `plus/minus/subs` 가 없으면 블록 생략(빈 칸 금지). 11 §6-1 의 폭·줄 수·색을 따른다.
3. scenes/StatScene.ts: 설명 패널을 위 레이아웃 결과로 그린다 — 태그 칩(공통 청록/고유 골드, GK 는 `GK 고유`), 20px 골드 제목+kind 색 세로 막대, 12px 설명, `판정 기준`(`+` 초록·`−` 코랄 칩 행), `세부 항목`(골드 ■ 불릿·제목·11px 부가 설명·± 미니 행·자식 칩), 고정 하단 `능력치 ???` 빈 바 + 기존 `drawRibbon`. 레이아웃은 축이 바뀔 때만 계산해 캐시(프레임마다 재계산 금지). 내용이 204px(패널 아트 기준 (40,82) 320×204)를 넘으면 클립+하단 페이드+`▼`, 마우스 휠·↑↓ 로 스크롤(축 변경 시 0, 상한 클램프). 축 변경 0.12s 페이드+8px 슬라이드(prefers-reduced-motion 이면 즉시). aria-live 문구는 `선택한 스탯 n/6: <이름> — <설명>. 판정 기준: 플러스 …, 마이너스 …. 능력치: 미정` 형식으로 확장.
4. ui/hexagon.ts + StatScene: 축 라벨 판 텍스트를 실제 `label`(6자 이내)로, 글자색은 공통 청록/고유 골드(선택 시 기존 골드 강조), 노드에 kind 색 얇은 링, 육각형 하단 (56,486) 범례 `● 공통 스탯 ● 포지션 고유 스탯`(GK 는 `● GK 고유 스탯` 하나). 기본 선택 = 12시 축, ←→/Tab/클릭 선택 규칙은 그대로. 폴리곤은 값 null 이라 60% 균일 펄스 그대로.
5. 테스트(vitest, 11 §7): stats 완전성(필드 6종×6축+GK 6축=42축이 `???` 아님, MGR 6축은 모두 `???`, 시트 안 id 유일, label ≤ 6자, description 비어 있지 않음), 구성(필드 6종 앞 3축 = 공통 3 같은 객체, 뒤 3축 = 11 §4 표와 일치, GK 6축 전부 unique·공통 없음, 골 결정력 ST/WF/CM 동일 객체), 공통 3개 subs 개수(3·2·2)와 plus/minus, wrapText(폭·손실 없음·빈 문자열·넓은 글자), layoutStatDetail(가짜 측정기 = 글자당 size px 로 42개 전 축 총 높이 ≤ 204px, 블록 순서, 없는 블록 생략), 스크롤 클램프, aria 문구.
6. 문서: 03 §5 를 실제 구조로 갱신(`???` 정책 → "이름·설명은 표시, 숫자만 ???", 패널 블록, 라벨 판·범례 변경, 데이터 모델은 11 로 링크), 11 의 열린 결정과 `설명(정리)` 문구를 실제 반영 내용에 맞게 수정, 03 의 P6 가 남긴 `stats.ts 교체 방법` 문단을 "숫자 확정 시 `values` 만 채우기" 로 정리.

## 비범위
능력치 숫자·게임 내 효과(스탯이 플레이에 영향 주는 것), 감독(MGR) 스탯 정의, 신규 이미지(11 §6-4 의 U11 시트는 요청이 있을 때만).

## 종료 조건(DoD)
- typecheck/test/build 통과, 락커룸·스탯 기존 동작(게이트·락커룸·Tab/←→ 선택·Esc)과 캐릭터 변경 회귀 없음
- 42개 전 축(≤204px)이 스크롤 없이 패널에 들어간다는 테스트 통과(들어가지 않는 축이 있으면 문구를 줄이거나 스크롤을 유지하고 그 축을 세션 결과에 보고)
- 사용자 확인 체크리스트: 재닌(GK 6개, 공통 없음) · 쥬멩이(ST) · 하치/다시바(WF) · 뽀린걸/한결(CM) · 문모모(CDM) · 핑구/해파린(CB) · 빙밍/리냐(FB) 각각 6축 이름과 12시 기본 선택(위치선정), 탈압박/위치선정/패스의 세부 항목 표시, 판정 기준 +/− 색, 공통/고유 색 구분과 범례, 우왁굳(MGR)은 `???`·COMING SOON, 모든 능력치가 `???` 로 표시, 글자 줄바꿈·잘림 여부

## 세션 종료 의무
docs/pitch/10-session-prompts.md 상단의 "변경 전파 프로토콜" 1~6을 모두 수행하라. — 특히 11(원천), 03 §5, 07/08/README(P6b 상태·산출물), P7 프롬프트(스탯 화면 접근성·성능 점검 대상에 새 패널 레이아웃 캐시·스크롤 포함)를 갱신하고, 숫자가 확정될 때 고칠 곳(`STAT_SHEETS[*].values`)을 03 §5 에 남겨라.
```

---

## 세션 P7 — 성능·QA·마감

- **상태**: ✔ 완료(2026-09-25). 아래 프롬프트는 기록용이며 재실행하지 않는다. 결과·성능 리포트는 README 세션 로그(P7 행)와 01 §7-1·§9, 03 §8.
- **P7 이 남긴 것**: `?pitchDebug=1` 프레임 미터(`engine/perf.ts`, 배포 후 사용자가 실측), 폴백 토스트(`entryNotice.ts`), `storage.ts` 메모리 폴백(`resetPitchStorageMemory` 테스트 훅), 피치 `Backspace` = 대시보드, 코너 플래그(`env/flag`·`flag-wave`, core 그룹), 스윗스팟 골 `goal-horn`. 미구현 결정(prefetch·난이도 3단계·크레딧·필드 소품/관중 스프라이트)과 나머지 후속은 README **백로그 B1~B10**.

- **전제**: P6 완료(✔ — API 는 P6 절의 "P6가 남긴 것"). P6 가 남긴 점검 항목: (h) 락커룸 소품 배치·충돌·게이트 글로우/화살표/`LOCKER` 판 위치 사용자 확인 후 조정, (i) `locker` 그룹이 해제되지 않고 상주(약 4MB 디코드)하는 것의 메모리 예산 확인, (j) `SceneHost.announce` aria-live 가 스탯 화면 밖(캐릭터 선택창·락커룸 프롬프트)에도 필요한지, (k) 누적 통계(`fc26-pitch-stats-v1`)를 스탯 화면·락커룸 어디에 보일지(P6 는 표시하지 않음), (m) P6b 스탯 패널: 레이아웃 캐시(축 변경 때만 계산, 첫 렌더에서 실제 폰트로 1회 재측정)·스크롤(휠 `preventDefault`·↑↓)·aria-live 긴 문구(판정 기준·세부 항목 포함)의 접근성·성능 점검, 실제 Galmuri11 폭에서 잘림·줄바꿈 확인, (l) 락커룸에서 대시보드 왕복 후 재진입·Tab 캐릭터 변경 후 스탯 화면의 초상화/포지션 갱신 확인. P4 가 남긴 점검 항목: (a) 06 §3-1 의 미확보 소리(`pitch-aim-tick` P0 · `ball-loose`·`goal-horn`·`stat-on`·`stat-soon` P1)와 `pitch-miss-whoos.mp3` 이름 오타, (b) 확보한 47개 오디오 파일의 출처/라이선스 미기록(크레딧 필요 여부), (c) 볼륨 조절 UI 없음(저장된 `sfxVolume`/`musicVolume` 만 사용), (d) 아직 쓰지 않는 이미지: `env/crowd-idle|cheer|groan`(core 그룹에도 없음)·`env/ball-sparkle`·`ui/sweet-spot`·`ui/ring-perfect`·`ui/star-style`(그 밖의 P4 이펙트는 `fx-star`·`fx-sweet`·`fx-save-sparkle`·`fx-confetti`·`fx-rays`·`fx-firework`·`fx-grass`·`fx-speed` 사용), (e) 이펙트 풀 용량(이펙트 24 · 콘페티 36 · 먼지 48)과 셰이크·히트스톱의 reduced-motion 재확인, (f) 누적 통계(`fc26-pitch-stats-v1`)를 화면 어디에 보일지, (g) P5 선택창: 히어로/프리뷰/카드 배치는 눈대중(03 §3)이라 사용자 확인 후 조정, 프리뷰 지연 로드(0.25s)와 `select` 그룹 재오픈 비용, 선택창 열림 중 BGM/입력 상태, 로딩 실패 문구 노출 시간.
- **마지막 갱신**: P7 완료 시점(전제 문단은 P7 착수 당시의 기록)

```text
[공통] 이 프로젝트의 피치(2D 픽셀 축구 진입 화면) 계획 문서는 docs/pitch/ 에 있다. 먼저 docs/pitch/README.md 와 아래에 적힌 문서를 읽어라.
이전 세션의 README "세션 로그"에 적힌 '결정/변경점'이 이 지시문과 충돌하면, 코드를 짜기 전에 문서(특히 docs/pitch/10-session-prompts.md 의 이 세션 절)를 먼저 고쳐라.
작업 원칙: 게임 화면은 반드시 2D Canvas. 잔디동 월드 이미지 에셋은 사용 금지. 텍스트는 이미지가 아니라 캔버스에서 Galmuri11로 그린다. 누락된 에셋은 undefined 처리하고 도형 플레이스홀더로 대체한다.
브라우저 미리보기/수동 검증은 하지 마라(사용자가 배포 후 직접 확인한다). 대신 pnpm typecheck, pnpm test, pnpm build 로 검증하고, 세션 마지막에 사용자가 확인할 체크리스트를 제시하라.
셸 편집 주의: Bash heredoc 은 작은따옴표가 있는 한글 텍스트에서 실패하기 쉽다. 파일은 Write/Edit 도구로 쓰고, 일괄 변환은 Node 스크립트로 하라. 커밋은 내가 요청할 때만 한다.

# 세션 P7 — 성능, 접근성, 폴백, 마감
먼저 읽을 문서: docs/pitch/README.md, 01 §7~§9, 03 §8, 06 §5, 08-asset-checklist.md.

## 목표
성능 예산 달성과 안정화, 접근성/폴백, 문서 최종 정리.

## 범위
1. 성능 점검: 프레임 시간 측정 로그(디버그 오버레이 ?pitchDebug=1), 드로우 콜/할당 점검, 정적 레이어 캐시·풀링·ImageBitmap 해제, 로딩 예산(boot ≤300KB, boot+core ≤3MB) 확인 리포트(빌드 산출물 크기 기준).
2. 접근성: role/aria, Skip to dashboard 링크, reduced-motion, 키보드 전용 흐름 점검.
3. 폴백: 컨텍스트 실패/부트 실패/예외 시 대시보드 자동 이동 + 토스트, 저장소 접근 불가.
4. 대시보드 prefetch(유휴 시 스냅샷 예열), 난이도 3단계(선택 사항이면 README 열린 결정 확인), 크레딧(CC-BY 항목이 있으면).
5. 누락 SFX/BGM 목록 점검(06 ✓), P1/P2 이미지(#122~#123) 통합.
6. 회귀 점검: 대시보드 딥링크/월드/미니게임, 번들 분할(엔트리 파일명 assets/app.js 유지 — Cloudflare HTML 캐시 이유, vite.config.ts 확인).
7. 문서 최종 정리: README 상태 요약, 08 체크리스트 최종, 옛 세션 프롬프트 정리.

## 종료 조건(DoD): typecheck/test/build 통과, 성능 리포트 첨부, 사용자 확인 체크리스트 제시.

## 세션 종료 의무
docs/pitch/10-session-prompts.md 상단의 "변경 전파 프로토콜" 1~6을 모두 수행하라. — 남은 후속(P8 은 터치 = 대시보드 전용으로 종료)을 README 열린 결정/백로그에 정리.
```

---

## 세션 P8 — 모바일 정책

- **상태**: ✔ 완료(2026-09-25). 원안(온스크린 방향 패드 + 슛/개인기/스프린트 버튼)은 **사용자 결정으로 취소**되고, 터치 기기는 항상 대시보드로 열리며 `피치로 돌아가기` 버튼은 숨겨진다(`entryMode.ts` `resolveInitialMode` 최우선 규칙, `Root.tsx` 가 `onGoPitch` 를 넘기지 않음). 재실행하지 않는다. 결과는 README 세션 로그·01 §4-1 에 반영됨.
