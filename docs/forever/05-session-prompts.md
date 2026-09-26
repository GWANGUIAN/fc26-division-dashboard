# 05. 세션별 지시 프롬프트

새 세션을 열 때 해당 세션의 ```text 블록을 **그대로 붙여넣는다**. 각 프롬프트는 자체 완결형이라 이전 대화 없이도 동작한다.

## 세션 순서와 의존성

| 세션 | 목적 | 선행 조건 | 병렬 가능 |
| --- | --- | --- | --- |
| 0 | 문서 작성 | — | 완료 |
| 1 | 이미지 생성 (사용자 수동) | 04 문서 | 세션 2와 병렬 |
| 2 | 게이트 + 씬 골격 (플레이스홀더 아트) | 01·02 문서 | 세션 1과 병렬 |
| 3 | 아트 통합 | 세션 1의 J1~J8 원본 PNG, 세션 2 완료 | — |
| 4 | 와우 요소 (NPC/퀘스트/캐스트/DING/채팅/업적) | 세션 3 | — |
| 5 | 마감 (사운드, 미니게임, 2차 맵 옵션, 문서 갱신) | 세션 4 | — |

## 공통 머리말 (모든 코드 세션 프롬프트의 맨 앞에 이미 포함됨)

- 먼저 `docs/forever/README.md`와 해당 세션이 지정한 문서를 읽고, **코드보다 문서를 따른다**. 문서와 다르게 구현해야 하면 문서를 먼저 고치고 이유를 남긴다.
- 브라우저 수동 확인/프리뷰 실행은 하지 않는다. 검증은 `pnpm test`(관련 파일)와 타입체크만. 사용자가 배포 후 직접 확인한다.
- 셸 편집 주의: Bash heredoc에 아포스트로피가 있으면 실패하고, Python은 Windows에서 CRLF로 쓴다. 긴 파일 편집은 Write/Edit 도구, 스크립트가 필요하면 Write 도구로 `.mjs`를 만들어 Node로 실행. grep의 CR 검사는 신뢰하지 말 것.
- `victory.mp3`(`pitch-victory` 계열)는 다른 기능 전용이라 **절대 재사용하지 않는다**.
- 커밋은 사용자가 요청할 때만 한다. `tmp/` 하위 원본 PNG는 gitignore라 커밋하지 않는다.
- 블리자드 로고·공식 에셋·정확한 문양을 쓰지 않는다(패러디풍 자체 제작만).

---

## 세션 1 — 이미지 생성 (사용자 수동, 코드 없음)

이 세션은 코드 세션이 아니다. 이미지 생성 AI 대화를 열어 `04-image-runbook.md`의 항목을 순서대로 진행한다.

```text
docs/forever/04-image-runbook.md 를 읽고 J1 → J3 → J4 → J6 → J5 → J7 → J2 → J8 순서로 진행한다.
각 항목마다 (1) 스레드 규칙(🆕 새 대화 / ↪ 이어서)을 지키고 (2) 필수 레퍼런스를 첨부하고 (3) 프롬프트 블록을 그대로 붙여넣고 (4) 검수 체크를 통과한 결과를 저장 이름 그대로 tmp/pitch-src/ 아래에 저장한다.
저장 후 04 문서의 해당 항목 체크박스([ ] → [x])와 진행 표를 갱신한다.
레퍼런스 파일이 실제로 없으면 tmp/pitch-src/ 를 나열해서 가장 가까운 승인본으로 대체하고, 04 문서의 그 항목 레퍼런스 줄을 실제 파일명으로 고친다.
J9, J10은 옵션이므로 J1~J8이 끝난 뒤 사용자가 원할 때만 진행한다.
```

세션 1 종료 조건: J1~J8 원본 PNG가 `tmp/pitch-src/`에 있고 04 문서 체크박스가 갱신됨.

---

## 세션 2 — 게이트 + 씬 골격 (플레이스홀더 아트)

```text
[공통 머리말] docs/forever/README.md 를 먼저 읽고, 브라우저 수동 확인은 하지 말고 pnpm test 와 타입체크로만 검증한다. 셸 편집은 Write/Edit 도구 또는 Write로 만든 Node 스크립트를 쓴다(heredoc 아포스트로피, Python CRLF 문제). victory.mp3 계열 사운드는 재사용 금지. 문서와 다르게 구현해야 하면 문서를 먼저 고친다. 커밋은 요청 시에만.

작업: "잔디 포에버" 기능의 게이트와 씬 골격을 만든다. 이미지는 아직 없을 수 있으므로 단색/도형 플레이스홀더로 그리고, 에셋 파일이 생기면 자동으로 쓰도록 나중에 교체 가능하게 짠다.

먼저 읽을 문서: docs/forever/01-concept-and-features.md, docs/forever/02-scene-and-gate-spec.md (특히 §1 씬 흐름, §2 게이트, §3 ForeverScene, §9 테스트).
먼저 읽을 코드: src/web/pitch/game/locker.ts, src/web/pitch/scenes/PitchScene.ts (updateGate, gatePromptVisible, enterLocker, drawGate, 키 처리), src/web/pitch/scenes/LockerScene.ts (복사 패턴, PitchEnterParams), src/web/pitch/scenes/LoadingScene.ts, src/web/pitch/__tests__/lockerScene.test.ts (makeCtx).

구현 범위:
1. src/web/pitch/game/forever.ts 신규: GATE_FOREVER, FOREVER_SPAWN, 거리/근접 판정 함수, FOREVER_AREA/FOREVER_COLLIDERS, foreverTargetAt (02 §2, §3.1, §3.2 표 그대로).
2. PitchScene: 락커 게이트와 잔디 포에버 게이트 두 개를 지원하도록 일반화. 프롬프트 "잔디 포에버 입장", 플레이트 텍스트 FOREVER, (출시일/D-day 표시는 하지 않는다). E/Enter 는 프롬프트가 뜬 게이트로 진입(둘 다 근접이면 가까운 쪽). 락커 게이트 상수·동작은 바꾸지 않는다.
3. PitchEnterParams 에 fromForever 추가, 복귀 시 FOREVER_SPAWN 에서 시작하고 점수/힌트(carry) 유지.
4. ForeverLoadingScene(로딩 화면, 진행 바, 팁 로테이션 — 팁 문구는 01 문서의 초안 사용, minMs 1800) 와 ForeverScene(배경 없으면 단색, 플레이어/펫 이동·y정렬·충돌, 상호작용 대상 프롬프트, 귀환석 위치에서 E → 바로 피치 복귀). 아직 NPC/퀘스트/캐스트 바는 만들지 않는다(세션 4).
5. 에셋 그룹 "forever" 는 이 세션에서 최소 정의(파일이 없어도 로딩이 실패하지 않도록 폴백)만 하고, 실제 아트 연결은 세션 3에서 한다.
6. 테스트: 02 §9 의 forever.test.ts, foreverScene.test.ts(귀환 흐름 위주), PitchScene 두 게이트 관련 테스트를 추가하고 기존 locker 관련 테스트가 그대로 통과하는지 확인.

완료 기준: pnpm test(관련 파일) 와 타입체크 통과. 마지막에 docs/forever/README.md 체크리스트의 세션 2를 체크하고, 02 문서와 달라진 점이 있으면 02를 고친다. 변경 요약과 남은 이슈를 보고한다.
```

---

## 세션 3 — 아트 통합

```text
[공통 머리말] docs/forever/README.md 를 먼저 읽고, 브라우저 수동 확인은 하지 말고 pnpm test 와 타입체크로만 검증한다. 셸 편집은 Write/Edit 도구 또는 Write로 만든 Node 스크립트를 쓴다(heredoc 아포스트로피, Python CRLF 문제). victory.mp3 계열 사운드는 재사용 금지. 문서와 다르게 구현해야 하면 문서를 먼저 고친다. 커밋은 요청 시에만.

작업: 세션 1에서 만든 원본 PNG(J1~J8)를 변환해 게임에 연결한다.

먼저 읽을 문서: docs/forever/03-art-spec.md, docs/forever/04-image-runbook.md (각 항목의 저장 이름·변환·최종 사용), docs/forever/02-scene-and-gate-spec.md §2, §3.
먼저 읽을 코드/스크립트: scripts/convert-pitch-art.mjs (헤더의 사용법), scripts/pitch-art-manifest.json (env 시트 locker-gate / locker-bg 항목이 참고 모델), src/web/pitch/engine/assets.ts (그룹 정의, import.meta.glob), src/web/pitch/__tests__/assetBudget.test.ts, lockerAssets.test.ts.

절차:
1. tmp/pitch-src/ 에 J1~J8 원본이 있는지 확인하고, 없거나 크기가 문서와 다르면 보고하고 멈춘다(임의로 만들지 않는다).
2. scripts/pitch-art-manifest.json 에 forever-gate, forever-logo, forever-loading-bg, forever-hub-bg, forever-npc, forever-props, forever-mobs, forever-hud 슬롯을 추가한다(03 §3 의 최종 파일 이름/크기 준수). 변환 명령은 04 문서의 변환 줄과 일치시킨다.
3. pnpm convert:pitch-art 로 각각 변환하고 로그(크로마키, 크기)를 확인한다. data/assetMeta.generated.ts 는 스크립트가 생성한 결과를 그대로 반영한다.
4. engine/assets.ts 의 그룹 "forever" 에 변환된 파일을 연결(boot 에는 forever-logo 는 넣지 않고 forever 그룹 안에 넣는다). assetBudget.test.ts 에 forever 그룹 예산을 실측 기반으로 추가한다.
5. PitchScene 게이트를 forever-gate-* 스프라이트로, ForeverLoadingScene 을 loading-bg + logo 로, ForeverScene 을 hub-bg + 소품(J6, 02 §3.2 위치)로 교체한다. 위치·반경·콜라이더는 배경 이미지를 보고 02 §3.1/§3.2 를 보정하고 문서를 같이 갱신한다.
6. 테스트: assets.test.ts, assetBudget.test.ts, 게이트/포에버 관련 테스트 통과.

완료 기준: 위 테스트와 타입체크 통과, README 체크리스트 세션 3 체크. 시각 확인은 하지 않고, 사용자가 확인할 항목(게이트 위치 겹침, 배경 소품 위치)을 목록으로 보고한다.
```

---

## 세션 4 — 와우 요소

```text
[공통 머리말] docs/forever/README.md 를 먼저 읽고, 브라우저 수동 확인은 하지 말고 pnpm test 와 타입체크로만 검증한다. 셸 편집은 Write/Edit 도구 또는 Write로 만든 Node 스크립트를 쓴다(heredoc 아포스트로피, Python CRLF 문제). victory.mp3 계열 사운드는 재사용 금지. 문서와 다르게 구현해야 하면 문서를 먼저 고친다. 커밋은 요청 시에만.

작업: ForeverScene 에 와우 유저가 알아볼 요소들을 구현한다.

먼저 읽을 문서: docs/forever/01-concept-and-features.md (P0/P1, 대사 초안), docs/forever/02-scene-and-gate-spec.md §3.2~§6, §9.
먼저 읽을 코드: src/web/pitch/scenes/ForeverScene.ts, scenes/InventoryScene.ts (오버레이 push 패턴), scenes/hudCommon.ts, PitchScene 의 toast(showToast/drawToast), audio/sfxMap.ts.

구현 범위(02 문서 그대로):
1. game/foreverProgress.ts: ForeverProgress, xpToNext, addXp, advanceQuest, loadProgress/saveProgress(try/catch 래핑, localStorage 키 fc26-forever-progress, 손상 데이터 폴백).
2. NPC 배치·머리 위 !/?/회색? 마크(J8 스프라이트, 2프레임 idle 은 J5), 퀘스트 팝업(두루마리 오버레이, E 수락/Esc 닫기, 팝업 중 이동 차단).
3. 퀘스트 3종(q_rabbits, q_leroy, q_hearth), 토끼 5마리 처치 카운트, 완료 시 XP → 레벨업이면 DING!(버스트+빛기둥+텍스트 1.2s).
4. 귀환석 캐스트 바(CAST_SECONDS=5 상수, 이동 시 취소, 완료 시 wipe 로 피치 복귀), 그리핀 조련사 연출.
5. 존 진입 배너, 하단 채팅 로그(채널 색, 최대 5줄, 8초 페이드, 랜덤 [월드] 밈), 업적 토스트, 머리 위 이름표 + <잔디동> 길드 태그.
6. 사운드 훅: docs/forever/06-audio.md §3 에 따라 sfxMap 의 PitchSfxId 에 forever-* id 를 추가하고 SFX_CANDIDATES(자기 파일 + 표의 재사용 폴백)/SFX_GAIN, PitchBgmId 에 forever, forever-loading 을 추가한다. 파일이 없으면 폴백 또는 무음이며 기존 pitch-victory 계열은 절대 후보에 넣지 않는다(sfxMap.test.ts 통과 필수).
7. 테스트: foreverProgress.test.ts, foreverScene.test.ts 확장(NPC 상호작용, 캐스트 취소/완료, 퀘스트 흐름, DING 트리거), sfxMap 신규 id 폴백.

완료 기준: pnpm test(관련 파일) 와 타입체크 통과, README 체크리스트 세션 4 체크, 02 문서와 달라진 점 갱신. 사용자가 배포 후 확인할 목록을 보고한다.
```

---

## 세션 5 — 마감과 옵션

```text
[공통 머리말] docs/forever/README.md 를 먼저 읽고, 브라우저 수동 확인은 하지 말고 pnpm test 와 타입체크로만 검증한다. 셸 편집은 Write/Edit 도구 또는 Write로 만든 Node 스크립트를 쓴다(heredoc 아포스트로피, Python CRLF 문제). victory.mp3 계열 사운드는 재사용 금지. 문서와 다르게 구현해야 하면 문서를 먼저 고친다. 커밋은 요청 시에만.

작업: 잔디 포에버 마감. 아래 중 사용자가 원하는 항목만 진행한다(먼저 어떤 항목을 할지 물어본다).

(a) 사운드 연결: docs/forever/06-audio.md 의 표에서 ✓ 표시된 파일(public/sfxes/pitch-forever-*.mp3, public/pitch-bgm-forever*.mp3)을 sfxMap/BGM 후보에 연결. 파일이 없으면 무음 폴백 유지. pitch-victory 는 사용 금지.
(b) 허수아비 슈팅 미니게임(02/01 의 P2): 데미지 숫자, 1회 시도 제한 없음, 진행 데이터는 건드리지 않기.
(c) 2차 맵 오그리 잔디마: 04 문서 J9/J10 원본이 있어야 한다. ForeverScene 을 맵 정의 기반으로 일반화하고(맵 id, 배경, 콜라이더, 대상), 맵 간 이동은 그리핀 조련사로 한다.
(d) 문서 갱신: docs/pitch/03-screens-and-ui.md 의 게이트 항목에 잔디 포에버 게이트를 추가하고, docs/forever/README.md 체크리스트를 정리한다.

완료 기준: 진행한 항목별로 관련 테스트와 타입체크 통과, 전체 pnpm test 정리(실패 원인이 이번 변경 때문인지 구분해서 보고).
```
