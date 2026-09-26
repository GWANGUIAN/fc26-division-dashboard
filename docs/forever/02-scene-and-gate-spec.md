# 02. 씬 · 게이트 스펙

구현의 기준 문서. 수치는 **초기 제안값**이며, 아트가 확정되는 세션 3에서 보정하고 이 문서를 같이 고친다. 코드 위치는 조사 시점(2026-09-26)의 `src/web/pitch/` 기준.

## 1. 씬 흐름

```
LoadingScene → PitchScene ─(E: 락커 게이트)→ LockerScene ─→ PitchScene(fromLocker)
                    │
                    └─(E: 잔디 포에버 게이트, wipe)→ ForeverLoadingScene ─(fade)→ ForeverScene
                                                                                     │
                                       귀환석 캐스팅 완료 / 그리핀 조련사 → PitchScene(fromForever)
```

- 진입: `PitchScene.enterForever()` → `forever-portal-enter`(파일 없으면 `gate-open` 폴백) + `transition-wipe` sfx, 점수·힌트를 기존 `carry`에 저장, `manager.replace(new ForeverLoadingScene(...), undefined, {transition:"wipe"})`.
- `ForeverLoadingScene`: 에셋 그룹 `forever`를 `assets.loadGroup("forever", {onProgress, minMs})`로 로드. **최소 표시 시간 `minMs`는 1800ms**(팁이 읽히도록). 끝나면 `replace(new ForeverScene(...), undefined, {transition:"fade"})`.
- 복귀: `manager.replace(new PitchScene(), {fromForever:true}, {transition:"wipe"})`. `PitchEnterParams`(현재 `fromLocker`만 있음, `LockerScene.ts:96` 정의)에 `fromForever?: boolean` 추가.

## 2. 피치 쪽 게이트

락커 게이트(`game/locker.ts`의 `GATE`)를 **좌우 대칭**으로 오른쪽에 둔다. 같은 y 라인.

| 항목 | 락커(기존) | 잔디 포에버(신규) |
| --- | --- | --- |
| 게이트 박스 | `x:16 y:316 w:166 h:166` | `x:778 y:316 w:166 h:166` (16 → 960-16-166) |
| 중심 | `99, 399` | `861, 399` |
| promptRadius / preloadRadius | 70 / 200 | 70 / 200 |
| 복귀 스폰 | `GATE_SPAWN {215,440}` | `FOREVER_SPAWN {745,440}` (게이트 안쪽으로 좌측 이동) |
| 아트 배율 | `GATE_SCALE=1.3` (128px 원본) | 동일 |

- 신규 파일 `game/forever.ts`에 `GATE_FOREVER`, `FOREVER_SPAWN`, `gateForeverDistance`, `nearGateForever`, `nearGateForeverPreload` 정의(락커의 `gateDistance`/`nearGate`/`nearGatePreload`와 같은 시그니처).
- `PitchScene` 변경:
  - 상태: `gateNear`/`gateApproach`/`lockerRequested`(207~212행)에 대응하는 `foreverNear`, `foreverApproach`, `foreverRequested` 추가.
  - `updateGate()`(335): 두 게이트 모두 갱신. preload 반경 진입 시 `assets.loadGroup("forever")` 1회 요청(락커의 `loadGroup("locker")` 패턴).
  - `gatePromptVisible()`(347): 두 게이트 각각 판정하는 함수로 분리(입력 살아있음, 슛 idle, 스킬 없음 조건 동일).
  - 키 처리(803~808): `KeyE`/`Enter`/`NumpadEnter` → **프롬프트가 떠 있는 게이트로 진입**. 둘 다 근접이면 더 가까운 쪽.
  - `drawGate()`(951) → 게이트 정의를 인자로 받는 `drawGateSprite(def, near)`로 일반화. 잔디 포에버는 `env/forever-gate-closed|open|glow`, `env/forever-gate-arrow`, `env/forever-gate-plate` 사용.
  - 플레이트 텍스트: `FOREVER`(락커의 `LOCKER`와 같은 방식 `drawText`). 출시일/D-day 문구는 **표시하지 않는다**.
  - 프롬프트: `drawPrompt(g, "ui/dialog-small", "E", "잔디 포에버 입장", ...)` (`hudCommon.ts:82`).
- 겹침 점검(하드코딩된 우측 요소):
  - 하단 우측 `H 조작법` 텍스트 (944, 526) — 게이트 박스(y 316~482) 아래라 충돌 없음.
  - 코너 플래그 x=180, 781 (`FLAG_CORNERS_X`) — 게이트 박스 x 778~944와 x=781이 겹칠 수 있음 → **깃발 y가 게이트 y 범위 밖인지 확인**, 겹치면 게이트가 위에 그려지므로 그대로 두되 시각 확인은 사용자.
  - `PLAY_AREA {minX:40,maxX:920,minY:178,maxY:510}`: 게이트 중심 x=861은 플레이 영역 안 → 플레이어가 게이트 위를 걸을 수 있음. 락커 게이트와 동일하게 처리(충돌 없음, 접근만 판정).
  - 배경 `env/pitch-bg` 우하단이 비어 있는지는 **아트 통합 세션에서 사용자가 확인**(`docs/pitch/05`는 좌하단만 터널용으로 비워둠).
- 기존 테스트 영향: `locker.test.ts`(GATE 값 고정 검증), `lockerScene.test.ts`(게이트→wipe). 락커 상수는 **바꾸지 않는다**(새 게이트는 별도 상수라 기존 테스트가 깨지지 않아야 함).

## 3. ForeverScene (맵)

`scenes/LockerScene.ts` 패턴을 그대로 복사해 시작한다(props + `DRAW_ORDER` y정렬, 원형 interaction zone, 콜라이더, 펫/장비 그리기, 진입/이탈 전환).

- 배경: `env/forever-hub-bg` (960x540 한 장, 타일맵 없음).
- 이동: `stepPlayer(p, input, dt, FOREVER_STEP_AREA)` 후 `resolveBoxes(FOREVER_COLLIDERS)`.
- 캐릭터: 락커와 같은 `LOCKER_PLAYER_SCALE = 1.5`, `depthScale(y)`, `drawEquippedFrame` 적용. 펫은 `createPet`/`updatePet`/y정렬 그대로(`pet` 로드아웃이 있을 때만).
- 초기 스폰: `(480, 440)`, 진입 시 존 배너 3초.

### 3.1 걷기 영역 · 콜라이더 (세션 3에서 `env/forever-hub-bg`에 맞춰 보정, 눈으로 확인 필요)

배경(960x540)에서 여관·계단·분수·풍차의 발치는 y≈285에서 끝나고 그 아래가 넓은 흙길/잔디다. 좌우 큰 나무가 x<90, x>850을 가린다. 그래서 건물별 콜라이더 대신 **걷기 영역 자체를 잘라** 건물을 막고, 콜라이더는 앞쪽 덤불과 소품 발치에만 둔다.

```ts
export const FOREVER_AREA = { minX: 90, maxX: 850, minY: 290, maxY: 505 };
export const FOREVER_COLLIDERS: Box[] = [
  { x: 75,  y: 405, w: 85, h: 70 },  // 좌측 앞 덤불
  { x: 772, y: 490, w: 56, h: 10 },  // 몬스터 초원행 포털 발치 (우측 앞 덤불 자리, 세션 6)
  // 소품 발치(작은 박스): 통 88,292 · 간판 기둥 288,288 · 우편함 226,424 · 모닥불 407,318
  //                      귀환석 458,462 · 표지판 546,304 · 허수아비 688,434 · 그리핀 횃대 758,332
];
export const FOREVER_SPAWN_POINT = { x: 480, y: 392 };  // 모든 상호작용 원 중심에서 반경+20 이상 (입장 직후 E로 바로 귀환되지 않게)
```

소품 배치(`FOREVER_PROPS`, 발 기준 하단 중앙, y정렬): 통 (108,300) · 여관 간판 (300,296) · 우편함 (240,432) · 모닥불 (430,330) · 귀환석 (480,472) · 표지판 (560,312) · 허수아비 (700,442) · 그리핀 횃대 (770,340). 스프라이트는 1배.

### 3.2 상호작용 대상 (`forever.ts`의 `foreverTargetAt(x, y)`, 락커의 `lockerTargetAt`와 같은 원형 판정)

| id | 종류 | 중심 (x,y) | 반경 | E 동작 |
| --- | --- | --- | --- | --- |
| `questgiver` | NPC | 330, 365 | 46 | 대화 → 퀘스트 수락/보고 |
| `leroy` | NPC | 620, 395 | 46 | 대사 → Q2 진행 |
| `innkeeper` | NPC | 200, 315 | 46 | "휴식 상태" 대사 |
| `flightmaster` | NPC | 820, 350 | 46 | 그리핀 연출 후 피치 복귀 |
| `mailbox` | 오브젝트 | 240, 420 | 40 | `우왁굳에게 온 편지` 오버레이 (세션 6, §12) |
| `dummy` | 오브젝트 | 700, 430 | 44 | (P2) 슈팅 미니게임, 그 전엔 대사 |
| `hearthstone` | 오브젝트 | 480, 460 | 44 | 캐스팅 바 → 피치 복귀 |
| `portal` | 오브젝트 | 800, 472 | 50 | 몬스터 초원으로 이동 (세션 6, §12) |
| `mob_<i>` | 몬스터 | 몬스터 초원의 12마리 | 30 | E로 처치 (토끼만 Q1 카운트, §12) |

- 프롬프트 라벨은 락커의 `drawInteractHints`/`drawPromptBubble`를 재사용(대상 이름: 퀘스트 NPC → "대화", 귀환석 → "귀환").

### 3.3 귀환석 캐스팅

- E 누르면 캐스트 바 시작, `CAST_SECONDS = 5`(와우 원작은 10초. 설정 상수로 분리).
- 이동하거나 다른 키(방향키)를 누르면 **캐스트 취소**(시스템 채팅: "시전이 취소되었습니다"). 완료 시 wipe로 피치 복귀.
- sfx: 진행 중 `forever-cast-loop`(반복), 취소 시 `forever-cast-cancel`, 완료 시 `forever-cast-complete` (06-audio.md §2-3). 없으면 재사용 폴백 또는 무음.

### 3.4 그리핀 조련사

- E → 짧은 페이드 연출(0.6s) + 그리핀 이동 텍스트 "그리핀 비행 중…" → 피치 복귀. 귀환석의 즉시 버전.

## 4. 진행 데이터 (localStorage)

키: `fc26-forever-progress` (`fc26-pitch-character` 저장 방식과 동일한 try/catch 래핑, 실패 시 메모리 폴백).

```ts
interface ForeverProgress {
  version: 1;
  level: number;          // 1부터
  xp: number;
  quests: Record<string, { state: "none" | "active" | "done"; count: number }>;
  achievements: string[]; // 획득한 id
}
```

- 레벨 곡선: `xpToNext(level) = 100 + 150 * (level - 1)` (1→2: 100, 2→3: 250).
- **DING!**: 레벨업 순간 화면 중앙 "DING!" + 빛기둥 스프라이트 1.2s + `forever-ding` sfx. 채팅에 `축하합니다! 레벨 {n}에 도달했습니다.`
- 순수 함수(`addXp`, `advanceQuest`, `loadProgress`, `saveProgress`)는 `game/foreverProgress.ts`로 분리해 유닛 테스트한다.

## 5. 퀘스트 데이터 (P0/P1)

| id | 이름 | 수락 NPC | 조건 | 보상 |
| --- | --- | --- | --- | --- |
| `q_rabbits` | 잔디밭의 불청객 | `questgiver` | 토끼 5마리 처치 | 100 XP → 레벨 2 DING |
| `q_leroy` | 리로이를 말려라 | `questgiver`(q_rabbits 완료 후) | `leroy`에게 말 걸기 | 150 XP |
| `q_hearth` | 집으로 돌아가는 길 | `innkeeper` | 귀환석으로 귀환 1회 | 업적 "잔디 귀환자" |

- 머리 위 마크: 수락 가능 → 노란 `!`, 진행 중 → 회색 `?`, 완료 가능 → 노란 `?`.
- 퀘스트 팝업: `ui/forever-quest-scroll`(두루마리) 위에 제목/본문/보상 텍스트, [수락] 키 `E`, [닫기] `Esc`. 팝업이 떠 있는 동안 이동 입력은 막는다(`manager.push`로 오버레이 씬 패턴, `InventoryScene` 참고).

## 6. 하단 채팅 로그 (읽기 전용 장식)

- 좌하단 최대 5줄, 새 줄이 생기면 8초 후 페이드. 채널 색: `[월드]` 주황 · `[길드]` 초록 · `[파티]` 파랑 · 시스템 노랑.
- 이벤트 훅: 입장/퀘스트/DING/업적/캐스트 취소 + 45~90초 간격 랜덤 `[월드]` 밈 한 줄.

## 7. 확인이 필요한 값

| 항목 | 상태 |
| --- | --- |
| BGM/효과음 원본 | 사용자 제공 — **파일명·저장 위치·검색 키워드는 `06-audio.md`** (없으면 재사용 폴백/무음). `pitch-victory` 계열 사용 금지 |
| 2차 맵 착수 여부 | 세션 5에서 결정 |

## 8. 신규/변경 파일 (예정)

| 구분 | 경로 |
| --- | --- |
| 신규 | `src/web/pitch/game/forever.ts` (게이트/맵/대상 상수, 순수 함수) |
| 신규 | `src/web/pitch/game/foreverProgress.ts` (진행 데이터) |
| 신규 | `src/web/pitch/scenes/ForeverLoadingScene.ts`, `ForeverScene.ts` |
| 변경 | `scenes/PitchScene.ts` (게이트 일반화, `fromForever`), `scenes/LockerScene.ts`의 `PitchEnterParams` |
| 변경 | `engine/assets.ts` (그룹 `forever`), `scripts/pitch-art-manifest.json`, `data/assetMeta.generated.ts`(자동), `audio/sfxMap.ts` |
| 문서 | `docs/pitch/03-screens-and-ui.md` (게이트 항목 갱신) |

## 10. 구현 메모 (스펙과 달라진 점)

### 세션 4 (와우 요소)

- 신규: `game/foreverProgress.ts`(진행 데이터·퀘스트 표·업적·순수 함수·저장), `scenes/ForeverQuestScene.ts`(두루마리 오버레이, `manager.push`). 상수(캐스트 5초·그리핀 0.6초·DING 1.2초·채팅 5줄/8초·월드 밈 45~90초·토끼 반경 30/리스폰 8초), NPC 배치, 토끼 좌표, 월드 밈 문구는 `game/forever.ts`.
- **NPC 6종 모두 배치**: 상호작용 4종(`questgiver` 잔디지기 노병 · `leroy` 리로이 잔킨스 · `innkeeper` 여관주인 포근 · `flightmaster` 그리핀 조련사)은 `FOREVER_ZONES` 원 중심에 서 있고, 장식 2종(`streamer` 주황 이름표 — 세션 6에서 "투르카 (전설)"로 이름 변경 후 몬스터 초원으로 이동 · `guard` 성문 경비병)은 상호작용이 없다. 머리 위에 이름표, 퀘스트 NPC에는 J8 마크(`quest-available`=노란 !, `quest-progress`=회색 ?, `quest-complete`=노란 ?). 2프레임 idle은 0.5초 간격.
- **토끼**: 5마리 고정 좌표(`RABBIT_SPOTS`), E로 처치, 8초 뒤 부활(퀘스트를 언제든 끝낼 수 있게). 퀘스트가 활성일 때만 카운트. 토끼 근접이 정적 대상(`foreverTargetAt`)보다 **우선**한다. `interaction()` 반환은 `ForeverTarget | "rabbit_<0-based>"`.
- **퀘스트 흐름**: `q_rabbits`(수락·보고 모두 잔디지기) → `q_leroy`(잔디지기가 수락, **리로이에게 말을 걸면 목표 달성 → 같은 두루마리에서 완료**, 150 XP) · `q_hearth`(여관주인이 수락, 귀환 캐스트 완료 시 카운트 +1, **다음 방문에 여관주인에게 완료 보고** → 업적 「잔디 귀환자」). 보상은 두루마리에서 E를 눌러야 지급된다. 진행 중 NPC를 다시 누르면 진행 상황 팝업(E/Esc로 닫기), 할 게 없으면 채팅 한 줄.
- **업적**: `recall` 잔디 귀환자, `leroy` 적어도 치킨은 있다, `level2` 새싹 잔디(DING으로 레벨 2). 토스트는 `ui/forever-toast` 4초, 큐로 순서대로.
- **캐스트**: 귀환석에서 E → 5초 바(`CAST_SECONDS`). 캐스트 동안 플레이어 고정, 방향키를 누르거나 누르고 있으면 취소. 캐스트 사운드가 2.5초 루프 파일이라 2.5초마다 다시 재생하고 취소/완료 때 `stopSfx`. 완료 시 sfx는 `forever-cast-complete` 하나만(폴백이 wipe와 같은 파일이라 wipe를 따로 중복 재생하지 않음). 이전 스켈레톤의 즉시 귀환과 `gate-open` 재생은 없어졌다.
- **그리핀**: E → 0.6초 검은 페이드 + "그리핀 비행 중…" → wipe로 피치 복귀. sfx `forever-griffin`(폴백 wipe).
- **DING!**: 퀘스트 보상으로 레벨이 오르면 `ding-pillar`(플레이어 뒤 빛기둥) + `ding-burst`(커지며 페이드) + 화면 위쪽 "DING!"과 `레벨 n` 1.2초, `forever-ding`, 채팅 "축하합니다! 레벨 n에 도달했습니다."
- **HUD**: 하단 좌측 채팅(최대 5줄, 8초 뒤 소멸, 마지막 1초 페이드, 채널색: 월드 주황·길드 초록·파티 파랑·시스템 노랑·NPC 대사 연노랑, 반투명 검정 패널). 입장 시 시스템/길드 한 줄, 그 뒤 45~90초마다 `[월드]` 밈. 하단 중앙 경험치 바(`xp-bar` 0.75배, 안쪽을 코드로 채움), 캐스트 중엔 그 위에 `cast-bar`(1배). 프레임 이미지 안쪽 위치(x 9~91%, y 34~66%)는 그림을 보고 잡은 근사값이라 **배포 후 눈으로 확인 필요**. `chat`·`slot`·`coin` 스프라이트는 아직 쓰지 않는다(채팅은 코드 패널).
- 플레이어 머리 위에 `<잔디동>`(초록) + 캐릭터 이름. 프롬프트는 이름표 위로 올렸다.
- **사운드(06 §3 연결 완료)**: `PitchSfxId` 22종 `forever-*`, `SFX_CANDIDATES`(자기 파일 + 06의 재사용 폴백), `SFX_GAIN`(chat 0.4, portal-hum 0.3, cast-loop 0.6), `PitchBgmId` `forever`(맵)·`forever-loading`(로딩). 게이트 진입은 `forever-portal-enter`(락커는 그대로 `gate-open`). 지금 코드가 재생하는 것: zone-enter, popup-open, npc-greet, quest-accept/progress/complete, ding, achievement, cast-loop/cancel/complete, rabbit-hit, griffin, mailbox, dummy-hit, leroy-charge, chat(월드 밈). **아직 안 쓰는 id**: portal-hum(게이트 근접 웅웅, 세션 5), murloc, mob-defeat, coin. 파일이 없으면 폴백 또는 무음.
- 스펙과 다른 점: `ForeverParams`에 테스트용 `random?`, `ForeverScene`에 읽기용 접근자(`level`, `castSeconds`, `dinging`, `flying`, `progressSnapshot()`, `chatLines()`, `rabbitsAlive()`). 03 §3의 멀록·멧돼지·코볼트 몬스터와 `slot`·`coin` UI는 미사용.

### 세션 3 (아트 통합)

- 변환 결과는 03 §3의 키. **NPC/몬스터는 `-a|b` 두 파일이 아니라 2프레임 가로 스트립 한 파일**(`characters/forever-npc-<id>`, 192x96, meta `frames: 2`)로 만들었다. NPC id: `questgiver` `streamer` `leroy` `innkeeper` `flightmaster` `guard`. 몬스터: `rabbit` `boar` `murloc` `kobold`.
- 에셋 그룹: 피치 게이트 아트 `env/forever-gate-*`는 **`core`**(첫 프레임부터 보이므로), 나머지 33개(배경 2, 로고, 소품 8, NPC 6, 몬스터 4, HUD 12)는 **`forever`** 그룹(약 0.9MB, 디코딩 5.8MB). 로고는 boot에 넣지 않았다. 로딩 화면의 배경/로고는 그룹 안에 있으므로 피치 게이트 preload(200px)로 이미 받아 둔 경우에만 보이고, 아니면 도형+텍스트 폴백이 잠깐 보인다.
- 컨버터: `characters <시트>` 가 기존 캐릭터 id 외에 `manifest.sheets.characters` 의 격자 시트(`forever-npc`, `forever-mobs`)도 처리하도록 확장.
- ForeverScene은 배경 + 소품(y정렬)까지. NPC/몬스터/HUD 그리기는 세션 4.

### 세션 2

- `PitchScene`: `gatePromptVisible()`/`enterLocker()`는 `promptGate(): "locker" | "forever" | null`/`enterGate()`로 대체. `drawGate`는 `drawGateSprite(def, {art, ...})`로 일반화(`art` = env 키 접두어: `gate` / `forever-gate`). 출시일/D-day 표시는 결정에 따라 제외(상수·함수·테스트 없음).
- `resolveBoxes`(locker.ts)에 4번째 인자 `area`(기본 `LOCKER_AREA`) 추가 — 기존엔 항상 락커 바닥으로 클램프되어 포에버 영역이 적용되지 않았다. 락커 동작은 그대로.
- `forever.ts`: 초기 스폰 `FOREVER_SPAWN_POINT {480,440}`, 타겟 원은 `FOREVER_ZONES`. `foreverTargetAt`은 원이 겹치면 **중심이 가장 가까운 대상**을 고른다. 토끼(`rabbit_*`)는 세션 4에서 추가.
- 에셋 그룹 `forever`: `env/forever-hub-bg`, `env/forever-gate-closed|open|glow|arrow|plate`, `ui/forever-quest-scroll` 중 **변환된 파일이 있는 키만** 포함(assetMeta 필터). 세션 3에서 키/예산 확정. 게이트 아트는 그룹이 preload(200px)될 때만 보이므로, 세션 3에서 core로 옮길지 결정.
- `ForeverLoadingScene`/`ForeverScene`은 `LockerScene`처럼 `createPitch` 팩토리를 받는다(PitchScene 순환 import 방지). 로딩은 그룹 실패해도 맵으로 진행. 맵 골격은 귀환석(`hearthstone`)에서 E → 즉시 wipe 복귀만 동작(캐스트 바·그리핀 연출은 세션 4). BGM은 임시로 `pitch`/`loading` 재사용, `cast` sfx는 미추가.
- 로딩 화면은 배경 아트 없이 도형만(로고/배경 연결은 세션 3).

## 11. 구현 메모 — 세션 5 (허수아비 슈팅 · 2차 맵)

- **허수아비 슈팅(P2)**: 허수아비에서 E → `DummyShootScene` 오버레이(`manager.push`). 파워 미터가 0.9초에 0→100으로 왕복하고 Space/E로 멈추면 그 지점으로 데미지가 결정된다(`game/dummy.ts`: 8 미만 빗나감, 78~92 크리티컬 ×2, ±10% 편차). 데미지 숫자가 떠오르고 슛 수·누적·최고를 표시한다. **시도 제한 없음, 보상·경험치·진행 데이터는 건드리지 않는다**(테스트로 고정). Esc로 나간다. sfx: `forever-dummy-hit`, 크리티컬은 `forever-mob-defeat`도.
- **맵 정의 일반화**: `ForeverMapDef`(`game/forever.ts`) = 맵 id, 존 이름, 배경 키, 에셋 그룹, 스폰, 걷기 영역, 콜라이더, 소품, 상호작용 원, NPC(스프라이트 키 포함), 토끼 좌표, `quests` 여부, 잡담 대사, 그리핀 목적지. `FOREVER_MAPS = { elwynn, orgrimmar }`. `ForeverScene`은 맵 정의만 읽고, `ForeverParams.map`으로 시작 맵을 고른다. `foreverTargetAt`/`rabbitAt`은 원/좌표 인자를 받는다(기본값은 1차 맵).
- **2차 맵 오그리 잔디마**: 배경 `env/forever-orgrimmar-bg`(J9), NPC 6종 `characters/forever-npc2-{orc,elder,goblin,grunt,rider,cook}`(J10 — 04 문서의 `-a|b` 두 파일이 아니라 세션 3과 같은 2프레임 스트립). **별도 그룹 `forever2`**(7개, 348KB, 디코딩 2.4MB — 첫 방문이 비용을 치르지 않도록 `forever`와 분리, 예산 테스트 추가). 소품은 1차 맵 것(우편함·귀환석·허수아비·횃대)을 재사용. 1차 맵과 같은 상호작용 슬롯이라 오크 족장(=questgiver 슬롯)·고블린 상인(=leroy 슬롯)·요리사(=innkeeper 슬롯)는 **퀘스트 없이 잡담만**, 장로·척후병은 장식. 토끼·퀘스트 마크·퀘스트 없음. 귀환석 캐스트와 허수아비는 동일하게 동작(귀환은 피치로).
- **맵 간 이동**: 그리핀 조련사 E → 번호 메뉴(`QuestPopupScene` 의 `menu` 모드, 숫자키 1~n, Esc 닫기): 1 피치로 돌아가기 · 2 반대편 맵으로 이동. 이동은 0.6초 비행 연출 동안 `forever2`를 받고(1차→2차), 로드가 끝나야 착지한다(실패해도 도형 폴백으로 착지). 착지 시 새 스폰·배너·zone-enter 소리·채팅 줄, 채팅과 진행 데이터는 유지. 2차 맵 좌표(영역 x 90~870 y 305~505, 콜라이더, 원)는 배경 그림에서 잡은 근사값이라 **배포 후 눈으로 확인 필요**.
- 사운드: 배포된 파일 중 `quest-progress`는 온디스크 철자가 `pitch-forever-quest-progres.mp3`(h 없음)라서 `SFX_CANDIDATES`에 그 철자도 후보로 넣었다. 06 §2 확보 체크박스는 존재하는 파일 기준으로 갱신.

## 12. 구현 메모 — 세션 6 (광장 정리 · 몬스터 초원 · 포털 · 우편함 편지)

계획서는 `07-hub-declutter-field-map-letter.md`. 스펙과 달라진 점:

- **광장 정리**: 광장 토끼 0마리. NPC는 5명(`questgiver` (330,365) · `leroy` (620,395) · `innkeeper` (200,315) · `flightmaster` (820,350) · `guard` (690,312)), `streamer`는 몬스터 초원으로 이동해 이름을 **"투르카 (전설)"**(주황 `#ff8000`)로 바꿨다(코드·문서·테스트의 "우왁 (전설)" 제거, 이름표만 있고 상호작용 없음). 모닥불 (430,330). 간격 규칙 — NPC끼리 ≥ 100px, NPC와 남의 소품 ≥ 70px(그리핀 조련사–횃대만 예외), 스폰과 모든 원 중심 ≥ 반경+20 — 을 `forever.test.ts`가 검사한다. 오그리 잔디마 스폰만 (480,385)로 5px 올려 같은 규칙에 맞췄다.
- **몬스터 초원(`field`, 3번째 맵)**: 배경 `env/forever-field-bg`(J11), 존 이름 "잔디 포에버 — 토끼 초원", 그룹 `forever-field`(배경 + J14 소품 7종, 327KB / 디코딩 2.1MB, 첫 맵 그룹과 파일이 겹치지 않음). 걷기 영역 `{75..875, 195..510}`, 콜라이더는 돌 제단 앞 벽 · 연못 · 양쪽 아래 덤불 · 그루터기 · 바위. 스폰 (340,275). 몬스터 12마리(`FIELD_MOBS`: 토끼 6 · 멧돼지 2 · 멀록 2 · 코볼트 2, 서로 ≥ 110px, 테스트로 고정), 8초 뒤 부활. 좌표는 배경을 보고 잡은 값이라 사용자가 확인한다.
- **토끼 로직 일반화**: `ForeverMapDef.rabbits` → `mobs: {kind,x,y}[]`, `rabbitAt` → `mobAt`, `RABBIT_*` → `MOB_*`, `interaction()` 은 `mob_<index>`, 접근자 `rabbitsAlive()` → `mobsAlive()`. 토끼만 `q_rabbits`를 센다. 다른 몬스터는 채팅 "○○을(를) 처치했습니다." + `forever-mob-defeat`, 멀록은 `forever-murloc` 추가(그동안 안 쓰던 두 id 연결). `q_rabbits`의 보고는 광장의 잔디지기에게 하므로 초원에서 5마리를 잡고 포털로 돌아온다.
- **포털**: `ForeverTarget`에 `portal` 추가, `ForeverMapDef.portal = {sprite, x, y, to}` + `zones.portal`(반경 50). 광장 (800,500 발치, 원 (800,472)) → 초원 `env/forever-portal-field`, 초원 돌 제단 (255,158 발치, 원 (285,195)) → 광장 `env/forever-portal-town`. 스프라이트는 3프레임 스트립 112x104(원본이 가로로 넓어 문서의 96x128 대신), 4fps, 감소된 모션이면 1프레임. E → 0.5초 검은 페이드(`PORTAL_SECONDS`) + `forever-portal-enter` 후 `switchMap`(그리핀 비행 로직 재사용, "그리핀 비행 중…" 텍스트·사운드 없음). 목적지 그룹은 포털 200px 안에서 미리 받고(`PORTAL_PRELOAD_RADIUS`), 로드가 실패해도 맵이 열린다. `ForeverMapDef.zones`는 `Partial`(초원엔 포털 원만 있다). 초원에는 귀환석·그리핀 조련사가 없다: 피치로 가려면 광장으로 돌아가 귀환석/그리핀을 쓴다.
- **우편함 편지**: `ForeverLetterScene`(오버레이, E/Enter/Esc 닫기, 이동 차단, `forever-popup-open`), 제목 "우왁굳에게 온 편지"(종이 위 y+38), 본문은 첫 줄 `??? 님께,` · 내용 전부 `~~~~` · 서명 `- 우왁굳 드림`만 읽히고, 본문은 `game/forever.ts`의 `LETTER_LINES`(보이는 글자 진한 갈색 `#3a2410`, `~~~~`/`???` 연한 갈색 `#b39866`, 종이 400x230 위 11줄, 도장 `ui/forever-seal`). 처음 읽으면 채팅 "우편함: 우왁굳에게 온 편지를 읽었습니다." + `ForeverProgress.letterRead?: boolean`(선택 필드, `version` 유지, true일 때만 보존). 안 읽은 동안 우편함이 `forever-prop-mailbox-mail`로 바뀌고 위에 `ui/forever-mail-icon`이 떠오른다(아트 없으면 "편지" 글자). 월드 채팅 "우편함에 편지 왔대요 ㅋㅋ".
- 에셋 그룹 크기(측정 2026-09-27): `forever` 40개 1.10MB / 디코딩 6.5MB(포털·편지 추가, 예산을 1.25MB / 7MB로 조정), `forever-field` 8개, `forever2` 7개.

## 9. 테스트 항목

- `forever.test.ts`: `GATE_FOREVER` 값, 좌우 대칭 관계(`x + w + 16 === 960`), 거리/근접 판정, `foreverTargetAt` 경계, 콜라이더 `resolveBoxes`.
- `foreverProgress.test.ts`: `addXp` 레벨업 경계, 퀘스트 상태 전이, 손상/누락 localStorage 폴백, 버전 불일치.
- `foreverScene.test.ts` (`lockerScene.test.ts`의 `makeCtx` 재사용): 로딩 미완료 시 로딩 표시, NPC E 상호작용, 귀환석 캐스트 취소/완료, 완료 시 `replace(PitchScene, {fromForever:true}, {transition:"wipe"})`.
- `pitchScene` 관련: 두 게이트 프롬프트 동시 근접 시 가까운 쪽 선택, `fromForever` 복귀 시 `FOREVER_SPAWN`에서 시작하고 점수 유지.
- 에셋: `assetBudget`(그룹 `forever` 예산 추가), `assets.test.ts`(그룹 정의), sfxMap 신규 id 폴백.
