# 01. 컨셉과 아키텍처 — 잔디동 월드

`src/web/world/`(신규)에 만들 2D 도트 RPG의 **규격·구조·데이터 스키마·기존 코드 통합 지점**을 고정하는 문서다. 다른 문서(02~09)의 ID·파일명·좌표 규칙은 모두 여기를 기준으로 한다. 구현 순서는 [08-implementation-roadmap.md](08-implementation-roadmap.md), 진행 상태는 [README.md](README.md)를 본다.

## 1. 한 줄 정의

좌측 상단 플로팅 버튼 **"잔디동 월드 구경하기"** → 전체 화면 팝업 안에서 **잔디동 멤버 11명 중 1명을 골라** 도트 마을을 걸어 다니며, 다른 멤버·우왁굳·오리지널 NPC와 대화하고, 기존 기능(3D 카드, 미니게임)을 활용한 미션을 풀어 "시들어가는 황금 잔디"를 살리는 캔버스 RPG. 스토리는 [02](02-story-and-missions.md).

### 목표
- 둘러보는 맛이 있는 큰 맵(80×60 타일), 집마다 들어가 볼 수 있는 실내.
- 미션은 **기존 기능 재사용**(3D 카드 열람, 미니게임 점수)과 **월드 내 미션**(배달·수집·타임트라이얼·킥)을 섞는다.
- 엔딩 후에도 계속 들어올 이유: 오락실(미니게임 5종), 일일 미션, 수집품, 카드 도감.
- 고퀄리티 AI 도트 에셋을 쓰되, 글자·게이지·키캡 등 코드로 되는 요소는 코드로 만든다.

### 비목표 (이번 범위 밖)
- 모바일 터치 조작(월드 버튼은 ≤680px에서 숨김), 서버 랭킹/멀티플레이(Worker에 KV/D1 바인딩 없음), 실시간 SOOP 연동.

## 2. 확정 사양

| 항목 | 값 | 비고 |
| --- | --- | --- |
| 렌더러 | Canvas 2D 직접 구현 | Phaser/Pixi 미사용. 기존 `KickupsCanvas.tsx` 패턴(논리 해상도 + rAF + ref) |
| 논리 해상도 | **640×360** (16:9) | 오프스크린이 아닌 메인 캔버스를 논리 크기로 두고 CSS로 정수 배율 확대 |
| 화면 배율 | 논리 1픽셀 = **정수 개의 화면(디바이스) 픽셀**: `n = floor(min(W·dpr/640, H·dpr/360))`(최소 1), CSS 배율 = `n / dpr` (`stageLayout.ts`) | dpr 1·2에서는 `floor(min(W/640, H/360))`와 같고, 125%·150% 같은 분수 배율 화면에서도 픽셀이 뭉개지지 않는다. 남는 영역은 레터박스. `image-rendering: pixelated`, `ctx.imageSmoothingEnabled = false` |
| 타일 | **32×32 px** | 지면 텍스처·충돌 격자·좌표 단위 |
| 맵 크기 | **80×60 타일 = 2560×1920 px** | [03](03-map-design.md) |
| 캐릭터 프레임 | **48×64 px** (동물 32×32) | 발끝 기준(anchor: 하단 중앙) |
| 충돌 박스(캐릭터) | 20×10 px, 발밑 중앙 | 위/아래 이동 시 소품 뒤로 자연스럽게 지나가도록 발밑만 충돌 |
| 이동 속도 | 걷기 90 px/s, 달리기(Shift) 150 px/s | 맵 종단 약 17~28초 |
| 게임 루프 | 고정 스텝 update 60Hz + rAF render | 탭 비활성 시 일시정지 |
| 실내 | 한 화면 **640×384 px(20×12 타일)** 통그림 | 스크롤 없음, 640×360 뷰포트 위아래 12px씩 여유 → 카메라 y 중앙 고정 |
| 파일 포맷 | 이미지 webp(q92), 오디오 mp3 | 기존 관례 |
| 폰트 | Galmuri11 | `styles.css:1-5`에서 이미 로드 |
| 언어 | 한국어 UI, 코드 식별자는 영어 | |

### 조작

| 키 | 동작 |
| --- | --- |
| ← ↑ → ↓ / W A S D | 이동 |
| Shift(누르는 동안) | 달리기 |
| E / Space / Enter | 상호작용, 대사 넘기기, 선택 확정 |
| Esc | 열려 있는 UI를 **위에서부터 하나씩** 닫는다: 미니게임/카드 모달 → 일시정지 메뉴(하위 페이지면 메뉴로 한 단계 뒤로) → 미션 로그 → 대사 → 코치마크(가이드 건너뛰기). **아무것도 없으면 Esc가 일시정지 메뉴를 연다**(월드 나가기는 메뉴 항목이나 우상단 X). 프롤로그는 건너뛰기, 캐릭터 선택은 타이틀로. 판정은 `state/escape.ts`의 `resolveEscape` |
| J | 미션 로그(S3 구현. 열린 상태에서 J를 다시 누르면 닫힘) |
| M | 전체 지도(아직 없음, 키만 예약) |
| ↑ ↓ (선택지/메뉴) | 항목 이동 |

대사·미션 로그·일시정지 메뉴·모달·프롤로그·캐릭터 선택이 열려 있는 동안 이동·E는 멈춘다(오버레이가 `uiOpen` 하나로 엔진의 `setUiBlocked`를 건다). 코치마크는 걷기(C1)를 요구하므로 **이동을 막지 않는 말풍선**이다. 첫 진입 시 가이드(코치마크)를 띄운다 → [02 §튜토리얼](02-story-and-missions.md#4-튜토리얼-가이드).

## 3. 화면 흐름

```
[좌상단 플로팅 버튼 "잔디동 월드 구경하기"]      (모바일 ≤680px 숨김)
        │ 클릭 (사용자 제스처 → 오디오 재생 가능)
        ▼
[WorldOverlay lazy chunk 로드]  →  [로딩 화면 + 에셋 프리로드(boot→core)]
        ▼
[타이틀]  ── 이어하기(저장 있을 때) / 새로 시작 / 종료
        ▼ (새로 시작)
[캐릭터 선택: 11명 카드, 좌우 이동 + 확정]
        ▼
[프롤로그 컷(대사 3~4줄)] → [월드: 선택 캐릭터의 집 실내에서 시작]
        ▼
[코치마크 가이드] → 집 밖으로 나감 → 자유 탐험
   ├─ Esc 메뉴: 이어하기 / 미션 로그 / 지도 / 설정(BGM·효과음) / 가이드 / 새로 시작 / 월드 나가기
   ├─ 문(트리거) → 페이드 → 실내 씬 ↔ 오버월드 씬
   ├─ 오락실 기계 → 기존 미니게임 모달(월드 안에서 열림)
   └─ 3D 카드 상호작용(메모장 등) → 기존 TotyCardPopup(월드 안에서 열림)
```

## 4. 폴더 구조 (구현 목표)

기존 미니게임 컨벤션(`XModal/XCanvas/XToggle/xEngine.ts+test/useX*.ts/css/storage`)을 따른다.

```
src/web/world/
  WorldToggle.tsx            좌상단 플로팅 이미지 버튼 (+ 발견 플래그 글로우)
  WorldOverlay.tsx           lazy, fixed inset:0, z-index 90, useBodyScrollLock/useEscape
  WorldCanvas.tsx            <canvas> + 게임 루프 마운트, ResizeObserver, DPR
  world.css / world-ui.css(S2 화면들) / world-mission.css(S3: HUD·미션 로그·메뉴·디버그 도구) / world-toggle.css
  storage.ts                 fc26-world-* (schemaVersion + validator, group-photo/storage.ts 패턴)
  worldAssets.ts             import.meta.glob(`?url&no-inline`) 매니페스트 + 프리로더(우선순위 그룹, 진행률)
  stageLayout.ts             640×360 스테이지의 정수 배율/레터박스 계산(순수, test)
  debug.ts                   `?worldDebug` 플래그
  engine/
    loop.ts                  고정 스텝 루프
    input.ts                 키 상태(UI가 잡고 있는 동안 비활성)
    camera.ts                추적 + 맵 경계 클램프 + 실내 고정
    collision.ts             AABB 슬라이드, 공간 해시, `composeObstacles`(NPC를 장애물로) (순수, *.test.ts)
    scene.ts                 씬 타입 + `SceneTransition`(문 전환·페이드, 실내 이미지 로딩 동안 검게 유지)
    mapScene.ts              맵 JSON → `WorldScene`(충돌·문·조사·NPC 스폰·지구), 씬 캐시
    terrain.ts               지면 청크 캐시(512px, lush/withered 2벌) + 지구 경계 디더 블렌딩 + 복원 크로스페이드
    npc.ts                   NPC 엔티티(stay/idle/wander/대화 시 플레이어 보기)
    interaction.ts           전방 28px 프로브로 상호작용 대상 고르기
    world.ts                 엔진 본체(루프·이동·문 전환·상호작용·카메라·렌더 호출·자동 저장·디버그 훅)
    render.ts                y-sort 정적 순서, 소품/건물/캐릭터/`above`, 프롬프트, 9-slice, 디버그 오버레이
    particles.ts             꽃잎/눈/불씨/반딧불 (코드 생성) — S4
    ball.ts                  (S3) 킥 볼: 마찰·벽/소품 반사·골 판정(순수, test)
    runs.ts                  (S3) 시간제 시도 관리자(택배 90초·콘 코스·킥 챌린지)와 캔버스 HUD 글(순수, test)
  state/
    missions.ts              (S3) 미션 상태기계 locked→available→active→ready→completed, 보상 1회, 마커·로그 뷰(순수, test)
    missionEval.ts           (S3) 종류별 판정(`evaluateEvent`)과 진행 문구(순수, test)
    conditions.ts            (S3) 맵 JSON `when` 조건식 (`flag:`, `mission-active:` …, test)
    npcDialogue.ts           (S3) 미션 상태 → NPC 대화 조립(임시 대사, S4에서 dialogueData.ts로 교체, test)
    actions.ts               (S3) `examine[].action` 해석(`minigame:`·`cards`·`mailbox:`, test)
    debugTools.ts            (S3) `?worldDebug`용 세이브 편집(조각·플래그·미션 상태, test)
    dialogue.ts              (S2) 대사 러너: 타자기·줄 넘김·선택지 순수 함수(S3: 선택지에 `effect`)
    coach.ts                 (S2) 코치마크 C1~C3 진행 조건
    escape.ts                (S2→S3) Esc 우선순위(모달·메뉴·로그 포함)
    selection.ts             (S2) 캐릭터 선택 4열 격자 이동
    daily.ts                 날짜 시드 일일 미션 — S5
    progress.ts              (S3) 지구별 색 복원값 `0.6·s + 0.4·zoneDone`(test)
  data/
    worldCast.ts             캐스트 20명 (하드코딩, roster.yaml 미사용)
    castProfiles.ts          캐릭터 선택 카드 문구(포지션·별명·집)
    propDefs.ts              소품 정의(스프라이트 크기·보이는 크기·발자국·`aboveFrom`·decal·withered)
    terrainDefs.ts           지면 시트 슬롯 목록·시든 변형 유무·경계 블렌딩 대상·발소리 재질
    placeholderDialogue.ts   S2 임시 대사·프롤로그 문구 (S4에서 dialogueData.ts로 교체)
    missionDefs.ts           미션 정의 + 임계값
    dialogueData.ts          NPC별 대사 노드
    maps/overworld.json      맵 데이터 (03 스키마, `scripts/build-world-map.mjs`로 첫 생성)
    maps/index.ts            JSON 로더(`OVERWORLD_MAP`, `INTERIOR_MAPS`)
    maps/mapIntegrity.test.ts 맵 무결성·도달성 테스트
    maps/interiors/*.json    실내 19곳
  ui/
    LoadingScreen.tsx  TitleScreen.tsx  CharacterSelect.tsx  Prologue.tsx  DialogueBox.tsx(선택지 포함)
    CoachMarks.tsx  Toast.tsx  DebugPanel.tsx  buttonProps.ts
    MissionLog.tsx  PauseMenu.tsx  Hud.tsx  WorldModals.tsx  missionIcons.ts  useWorldKeys.ts   (S3)
    WorldMap.tsx  DailyBoard.tsx   (S5 이후)
  arcade/
    GrassRushModal.tsx  GrassRushCanvas.tsx  grassRushEngine.ts(+test)  useGrassRush*.ts
  audio/
    worldAudio.ts            BGM 크로스페이드(선호 목록 → 처음 존재하는 파일), SFX 풀. 파일이 없으면 무음
```

에셋: `src/web/assets/world/{characters,portraits,terrain,props,buildings,interiors,ui,fx,rush}/`(glob 자동 스캔, 파일명은 [09](09-asset-checklist.md)). 사운드: `public/sfxes/world-*.mp3`, `public/world-bgm-*.mp3`([07](07-audio.md)). 원본 PNG: `tmp/world-src/<카테고리>/`(커밋 제외).

## 5. 렌더링 설계

### 레이어 (아래 → 위)
1. **ground**: 지면 청크(512×512px, 오프스크린 캔버스 캐시). 텍스처 타일을 맵 데이터의 terrain 코드대로 깔고, 다른 terrain과 맞닿는 가장자리는 코드로 블렌딩(그라디언트 마스크 + 디더). 진행도 단계별로 **lush**와 **withered** 두 벌을 캐시하고 알파 크로스페이드([09 시든 버전 자동 생성](09-asset-checklist.md#자동-생성-파생-에셋)).
2. **decals**: 바닥에 붙는 장식(길 가장자리 얼룩, 그림자 등).
3. **entities (y-sort)**: 발 y 기준 정렬 — 건물, 소품, NPC, 플레이어, 볼, 수집품. 각 항목은 `sortY = y + sortOffset`.
4. **above**: 플레이어 위를 덮는 부분(나뭇잎 캐노피, 지붕 처마, 다리 난간 등). 소품 정의의 `above: true` 스트립.
5. **particles / ambient**: 지구별 꽃잎·눈·불씨·반딧불, 물 반짝임.
6. **light/tint**: 지구별 비네트·색조(코드). 실내는 별도 톤.
7. **markers**: NPC 머리 위 `?`/`!` 마커(위아래 바운스), 상호작용 말풍선 "E".
8. DOM 레이어(React): 대사창, HUD, 미션 로그, 메뉴, 토스트, 코치마크 — 캔버스 위 절대 배치.

### S2에서 정한 구현 규칙
- **ground**: 512px 청크를 처음 보일 때 굽고(lush/withered 각 1벌) 타일 단위로 지구 복원값에 따라 크로스페이드한다. 복원값은 `restoreOfZone(zoneIndex)` 훅 하나로 들어온다. **S3부터 지구별 값**(`state/progress.ts`의 `restoreOfZoneId`)이 들어가고, 값이 바뀌면 엔진이 1.5/초 지수로 따라가 크로스페이드한다(장면 진입 시에는 즉시 맞춤). `?worldDebug` 슬라이더는 모든 지구를 한 값으로 덮어쓴다. 지구 경계는 서로 다른 시트의 *기본 지면*끼리만 12px 폭 4×4 순서 디더로 섞고, 길·광장·물·얼음·피치는 선명하게 둔다.
- **entities**: 건물·소품은 씬 로드 때 한 번 정렬한 정적 목록, NPC·플레이어는 프레임마다 정렬해 두 목록을 병합해 그린다(`sortY` = 발 y). 그림자는 코드가 그린다(캐릭터 발밑 타원).
- **above**: `propDefs.aboveFrom` 위쪽 부분만 모든 엔티티 위에 다시 그린다. 나머지(줄기)는 y-sort.
- 소품 lush/withered도 **소품이 서 있는 지구의** 복원값으로 크로스페이드한다(시든 이미지가 있는 15종).
- 물 애니메이션·지구별 파티클·앰비언스·색조는 S4/S6.

### 성능 예산
- 목표 60fps, 1프레임 update+render ≤ 6ms(중급 노트북).
- 화면에 보이는 청크·엔티티만 그린다(카메라 컬링). 엔티티 수천 개가 아니라 수백 개 규모.
- 디코드된 텍스처 총량 ≤ 약 150MB (지면 청크 2벌 ≈ 40MB + 스프라이트/건물 + 현재 실내 1장). 실내는 진입 시 로드, 이탈 시 해제.
- `ImageBitmap`(`createImageBitmap`) 사용, 스프라이트 시트는 캐릭터당 1장(192×256).
- React 리렌더는 HUD/대사 상태 변화 때만. 게임 상태는 ref/엔진 객체에 두고 이벤트로만 React에 통지.

### 카메라
- 오버월드: 플레이어 중심 lerp 추적(0.15), 맵 경계 클램프, 정수 픽셀 스냅(`Math.round`)으로 서브픽셀 떨림 방지.
- 실내: 고정(뷰포트 중앙), 640×384 이미지의 위아래를 뷰포트에 맞춰 12px씩 잘라 그린다.
- 씬 전환: 0.25초 페이드아웃 → 씬 교체 → 0.25초 페이드인.

## 6. 이동·충돌·상호작용

- **이동**: 입력 벡터 정규화 후 속도 곱. 축 분리 충돌(x 먼저, y 다음)로 벽 슬라이드.
- **충돌 데이터**: 맵 JSON의 충돌 사각형(px) + 소품 정의의 footprint. 공간 해시(64px 셀)로 근처만 검사. 물(deep water)·낭떠러지는 사각형/terrain 플래그로 막는다. 실내는 이미지 위 손으로 튜닝한 사각형 배열(`?worldDebug`로 오버레이해 확인).
- **상호작용**: 바라보는 방향으로 발 상자 앞 **28px 프로브**(폭 24, 옆 방향은 높이 18)가 닿는 대상 중 가장 가까운 것. NPC는 몸 크기(24×40, 동물 28×26) 상자, 조사 포인트는 영역(기본 64×48)으로 맞고 같은 거리면 NPC가 우선. 대상이 있으면 머리 위에 `E` 프롬프트(캔버스에 `tooltip-frame`으로 그림). `E`/Space/Enter로 대화·조사가 열리면 그 사이 이동·E는 멈추고, NPC는 플레이어를 바라본다.
- **트리거 종류**: `door`(씬 전환), `examine`(텍스트 조사, S3부터 `action`으로 오락실 기계·카드 수납장·우편함), `npc`, 지구 진입은 `zones`(토스트·BGM). **S3의 월드 오브젝트**는 맵 JSON `objects[]`: `pickup`(E로 줍는 랜턴·시든 잔디 자리), `ball`(킥 볼), `goal`(골대 판정 사각형), `gate`(콘 코스 체크포인트), `hazard`(콘). `board`(일일 게시판)는 S5.
- **NPC AI**(`engine/npc.ts`): `idle`(제자리+가끔 방향 전환), `wander`(지정 사각형 안 랜덤 이동, 34px/s·동물 52px/s, 0.6초 막히면 목적지를 다시 고름), `stay`(고정). 대화 시작 시 플레이어를 향해 돌아보고 멈추며, 종료 후 원래 방향으로 복귀(걷는 NPC는 그대로 진행). NPC는 16×8px 충돌 상자로 플레이어를 막는다. 미션 대상 NPC는 `stay` 고정 권장(위치 예측 가능).
- **문**: 발 상자가 문 트리거에 닿으면 페이드(0.25초) → 씬 교체 → 페이드. 도착 직후 0.35초와 문 위에 서 있는 동안은 다시 발동하지 않는다(왔다갔다 방지). 실외 문 트리거는 아래 12px을 깎아 건물 앞을 따라 걷는 것만으로는 들어가지 않는다.
- **월드 킥(쥬멩이 미션·훈련장 상시)**(`engine/ball.ts`): 공 앞에서 E = **바라보는 방향으로** 380px/s 킥(약 340px 굴러감), 210px/s² 마찰, 벽·소품·훈련장 사각형에 0.72 반발. 공은 NPC(공돌이)에 걸리지 않는다. 골대 소품은 단단하고, 공이 **골 사각형(골대 면 +4px)**에 닿으면 득점 → 0.7초 뒤 제자리에 재스폰. 챌린지가 `active`일 때 첫 킥이 60초를 시작하고, 아닐 때는 그냥 연습(득점 집계 없음).
- **시간제 시도**(`engine/runs.ts`): 택배 90초(수락하면 시작, 우편함에서 E로 배달, 실내로 들어가도 계속), 콘 코스 25초(시작 게이트를 지나면 시작, 체크포인트를 순서대로, 콘 접촉 +1초, 실패하면 시작 게이트를 다시 지나 재도전), 킥 60초. 대사·메뉴·모달이 열려 있는 동안 시계가 멈춘다. 진행 중인 시도는 저장하지 않는다(새로고침하면 사라지고 미션은 `active`로 남아 다시 도전).

## 7. 데이터 스키마 (TypeScript 초안)

```ts
type CastId =
  | "janine95kim" | "bboringirl" | "sjh4018" | "doormomo" | "hachi97" | "kaksjak0730"
  | "ju010228" | "haepalin" | "tleod1818" | "tdnlamuron" | "lina0108"      // 멤버 11 (선택 가능)
  | "woowakgood" | "elder" | "shopkeeper" | "kid" | "referee" | "weedking" | "weeder-grunt"
  | "cat-jandi" | "dog-ball";                                             // NPC 전용

interface CastDef {
  id: CastId;
  displayName: string;              // "재닌", "잔디 할아버지"
  playable: boolean;                // 11명만 true
  role: "member" | "host" | "original" | "animal";
  home?: string;                    // 집 id (멤버만)
  themeColor: string;               // TOTY 카드 테마 색 (UI 강조)
  voiceSfx?: string;                // 기존 음성 파일 경로 (07-audio.md "멤버 음성" 표 기준, 파일명이 id와 다를 수 있음)
  spawn: { scene: SceneId; x: number; y: number; ai: "stay" | "idle" | "wander"; wanderRect?: Rect };
}

type SceneId = "overworld" | `interior:${string}`;

type MissionKind =
  | "talk" | "card_reveal" | "card_variant" | "minigame_best"
  | "collect" | "delivery" | "time_trial" | "kick_goals" | "talk_chain";   // "visit"은 collect로 흡수(광장 물 주기)

// 실제 구현(data/missionDefs.ts): 공통 필드 + kind별 필드가 평평하게 붙은 판별 유니온. `params` 상자는 없다.
interface MissionBase {
  id: string;                       // "m-doormomo-sum10"
  giver: CastId;
  title: string;
  objective: string;                // 로그·트래커 한 줄
  hint: string;                     // 로그의 "장소"
  requires?: string[];              // 선행 미션 id(완료해야 함)
  requiresFlags?: string[];         // 필요한 플래그(메인 미션은 "main-open")
  reward: { shard?: number; badge?: string; flags?: string[] };
  main: boolean;                    // 메인(잔디 조각) 여부
  tutorial?: boolean;
}
// 예: { kind: "minigame_best", game: "soccer-sum10", min: 60 } / { kind: "card_variant", cardId, variant: "retro" }
//     { kind: "time_trial", gates: [...], hazards: [...], seconds: 25, penalty: 1 } / { kind: "delivery", items: [...], seconds: 90 }

type MissionStatus = "locked" | "available" | "active" | "ready" | "completed";

interface WorldSave {
  schemaVersion: number;            // 현재 1. 올릴 때 storage.ts의 MIGRATIONS에 단계 추가
  player: CastId | null;
  scene: SceneId; x: number; y: number; facing: "down" | "up" | "left" | "right";
  missions: Record<string, { status: MissionStatus; progress?: unknown; startedAt?: number }>;
  shards: number;                   // 0~10 (플레이어 자신 제외 10명 기준)
  flags: Record<string, true>;      // tutorial-done, ending-seen, area-weed-open ...
  collected: string[];              // 황금 축구공 id, 해파리 랜턴 id 등
  talked: Record<string, number>;   // NPC별 대화 횟수(순환 대사 인덱스)
  bests: { rush?: number; sum10?: number; kickups?: number; freekick?: number; cardmatch?: number };
  daily: { date: string; picks: string[]; done: string[]; stamps: string[] };
  coachDone: boolean;
}

interface MinigameRoundResult {
  game: "soccer-sum10" | "kickups" | "freekick" | "cardmatch";
  score: number;                    // cardmatch는 "턴 수"(낮을수록 좋음)
  cleared?: boolean;                // sum10 전체 제거
}
```

- **이어하기 조건(S2)**: `flags["prologue-done"]`가 있는 세이브만 "이어하기"로 노출한다. S1 샌드박스 세이브는 이 플래그가 없어 새 게임으로 취급한다. "새로 시작"은 캐릭터를 고르고 프롤로그를 마칠 때까지 기존 세이브를 지우지 않는다(중간에 나가도 이어하기가 남는다). 새 게임은 고른 멤버의 **집 실내 `(10, 10)`, 위를 보는 방향**에서 시작한다.
- **저장 마이그레이션 규칙(08 §5 #11, S3 결정)**: `WORLD_SAVE_SCHEMA_VERSION`은 **저장 구조가 바뀔 때만** 올리고 `storage.ts`의 `MIGRATIONS`에 한 단계를 추가한다(필드 추가·삭제·의미 변경). 미션 정의·임계값·맵을 고치는 것, `missions[id].progress` 안쪽 모양이 늘어나는 것, 새 플래그/뱃지는 버전을 올리지 않는다(검증기가 모르는 플래그는 그대로 두고, 진행도는 없는 필드를 기본값으로 읽는다). S3는 스키마를 바꾸지 않았다(v1). `missions`에는 `active`/`ready`/`completed`만 저장하고 `locked`/`available`은 선행 조건에서 계산한다.
- 저장 키: `fc26-world-save-v1`(전체), `fc26-world-discovered-v1`(첫 방문 글로우 해제), `fc26-world-settings-v1`(사운드). 모두 try/catch로 감싸고 검증 실패 시 새 게임. **사운드 설정은 `WorldSave`에 넣지 않고 자기 키에만 둔다**("새로 시작"이 사운드 설정을 지우지 않도록). 세이브 검증은 구조 오류(버전·씬·좌표·미션·일일)면 통째로 거부하고, `bests`·`talked`·`flags`의 잘못된 항목만 버린다.
- 일일 미션 날짜 기준: KST(`Asia/Seoul`) `YYYY-MM-DD`, 시드로 `daily.picks`를 결정론적으로 뽑는다.

## 8. 로딩 화면과 프리로더

- `worldAssets.ts`가 `import.meta.glob("../assets/world/**/*.webp", { eager: true, import: "default", query: "?url" })`로 URL 맵을 만들고, 그룹별 목록을 제공한다.

| 그룹 | 내용 | 시점 |
| --- | --- | --- |
| `boot` | 로딩 키아트, 로고, 타이틀/선택 화면 UI, 11명 선택용 초상·서 있는 스프라이트 | 오버레이 열자마자, 이것만 끝나면 타이틀로 진행 가능 |
| `core` | 지면 텍스처, 오버월드 소품/건물, 플레이어+오버월드 NPC 아틀라스, UI 프레임(대사창 등), 마커/FX, 핵심 SFX 메타 | 캐릭터 선택 후(또는 이어하기 시) 로딩 화면에서 |
| `interior` | 실내 통그림 | 문 진입 직전 지연 로드(진입 전 페이드 동안), 한 번 로드하면 캐시 |
| `audio` | BGM(현재 씬 것 우선), 자주 쓰는 SFX | `core`와 병행, 실패해도 진행 |

- 진행률 = 완료 개수 / 전체(구현: 파일이 실제로 있는 키만 분모에 넣어, 아트가 덜 채워져도 100%에 도달). 로딩 화면은 진행률바(코드) + 팁 문구 순환 + 키아트. 최소 표시 시간 0.6초(깜빡임 방지). 이미지는 `fetch → createImageBitmap`으로 디코드하고 오버레이가 닫힐 때 `close()`한다.
- 에셋 URL은 `?url&no-inline`으로 가져온다: 4KB 미만 이미지가 base64로 JS 청크에 인라인되면 월드 청크가 530KB로 부풀기 때문(끄면 56KB). 월드 이미지 파일은 모두 `dist/`에 복사된다.
- **S2 그룹**: `boot` = 로딩·타이틀 UI + 캐릭터 선택 화면(배경·카드·화살표·리본, 11명의 스탠딩과 중립 초상). `core` = 지면 시트 8(+시든 5) + **맵이 쓰는 소품(시든 포함)·건물 17** + 캐스트 20명 아틀라스 + 대사·토스트·코치마크 프레임 + **시작하는 집의 실내 이미지**. 나머지 실내는 문을 지날 때 페이드 동안 지연 로드하고 캐시한다(로드가 끝날 때까지 화면은 검게 유지).
- 이미지 로드 실패 시 **플레이스홀더로 폴백**(색 사각형/이니셜) — 에셋이 아직 없어도 게임이 돈다. 이것이 코딩과 아트 제작을 병렬로 진행하는 핵심 규칙이다.
- 오디오 자동재생 정책: 플로팅 버튼 클릭이 사용자 제스처이므로 로딩 중 BGM 컨텍스트를 준비하고, 타이틀에서 재생 시작. `.catch(() => {})` 처리.

## 9. 오디오 설계

- BGM: 씬/지구 전환 시 1초 크로스페이드, 진행도 낮음(시든) ↔ 높음(복원) 필드 BGM 두 트랙을 진행도 5 기준으로 전환. `new Audio()` 2개를 핑퐁.
- SFX: 동시 재생이 필요하므로 기존 `playSfx()`(단일 슬롯, `sfxAudio.ts`) 대신 월드 전용 풀(`worldAudio.ts`, 이름별 3~4개 Audio 인스턴스 재사용).
- 설정: BGM/효과음 on-off·볼륨을 `fc26-world-settings-v1`에 저장, 기본 BGM 35 / SFX 55(기존 게임 기본값과 동일). 기존 `SoundControl.tsx`(`minigame/`) UI 재사용 검토.
- **사이트 전역 `MusicPlayer`(YouTube iframe)**는 독립 재생이라 월드 진입 시 겹친다 → **결정(S1)**: 월드가 열리면 재생 중이던 전역 음악을 일시정지하고, 닫을 때 월드가 멈춘 경우에만 재개한다(`src/web/musicControl.ts`, [08 §5 #1](08-implementation-roadmap.md#5-미해결-항목)).
- **S2 구현 상태**(`audio/worldAudio.ts`): 파일은 전부 선택 사항이다. `public/world-bgm-*.mp3`·`public/sfxes/world-*.mp3`를 이름으로 찾아(HEAD 요청, 오디오 타입이 아니면 없는 파일) 있으면 재생하고 없으면 조용히 무음이다. BGM은 선호 목록(`[지구 BGM, 필드 BGM]`)에서 처음 존재하는 파일을 1초 크로스페이드로 튼다. 연결된 효과음은 UI 이동/선택, 대사 틱/넘김/시작, 발소리(잔디·돌·나무·흙·눈·금속·물), 문 열림/닫힘, 상호작용 핑, 조사(07의 S1–S5·S7–S12·S18–S19·S21–S22 중 해당분). **S3에서 추가**: 미션 수락/목표 달성/완료(S25–S27), 잔디 조각·뱃지 획득(S28, badge-get), 줍기(S23), 택배 수령(S24), 체크포인트(S40)·콘 접촉·카운트, 킥/골/포스트, 시간 초과, 짧은 휘슬, 조각 10개(S29), UI 오류음(파일명은 `SFX_FILES`). BGM 13곡과 SFX 53개는 2026-09-19에 `public/`에 들어왔다(`world-bgm-region-weed.mp3`만 없어 제초동 구역은 필드 BGM으로 대체).
- 기존 효과음 재사용 목록과 신규 목록은 [07-audio.md](07-audio.md).

## 10. 기존 코드 통합 지점

탐색으로 확인한 현재 위치(라인은 2026-09-19 기준 근사치, 구현 시 재확인).

| 파일 | 변경 | 근거/패턴 |
| --- | --- | --- |
| `src/web/App.tsx` | **(S1 완료)** `worldOpen` 상태, `lazy(() => import("./world/WorldOverlay"))`, `<Suspense fallback={null}>` 오버레이, `<WorldToggle>`은 `<main>` 안 `<FakeAdRail />` 바로 뒤(고정 위치라 DOM 위치는 무관하지만 CSS `main:has(.world-toggle)`가 `<main>` 안에 있어야 동작) | 미니게임은 `activeMinigame` 단일 슬롯. 월드는 별도 상태 + 오버레이(z90)가 열려 있는 동안 대시보드를 덮음 |
| `src/web/MusicPlayer.tsx` | **(S1 완료)** `registerMusicHandler`로 `pause/play/isPlaying`을 `musicControl.ts`에 등록(+14줄) | 월드 열림/닫힘 시 전역 음악 일시정지·복귀 |
| `src/web/styles.css` 관련 | 직접 수정 없음(S1). 좌상단 고정 버튼이 `.topbar` 브랜드와 sticky `.controls-bar`를 가리는 문제는 **`world-toggle.css`의 `main:has(.world-toggle)` 규칙**으로 `.topbar`/스티키 `.controls` 좌측 패딩을 예약하고, 스크롤 시 버튼을 원형 아이콘으로 축소해 푼다([08 §5 #2](08-implementation-roadmap.md#5-미해결-항목)) | 탐색 결과 |
| `src/web/minigame/soccer-sum10/SoccerSum10Modal.tsx` + `useSoccerSum10Game.ts` | **(S3 완료)** optional `onRoundEnd?: (r: {game, score, cleared}) => void` — 시간 종료/전부 제거 시 1회. 훅의 기존 `onRoundEnd`(음악 정지)는 결과를 받도록 바꾸고 모달이 음악 정지 + 바깥 콜백을 부른다 | 기존 동작 불변 |
| `KickupsModal.tsx` + `useKickupsGame.ts` | **(S3 완료)** 동일 prop, phase → `grounded`로 바뀔 때 1회(score = 이번 판 횟수) | |
| `FreekickModal.tsx` + `useFreekickGame.ts` | **(S3 완료)** 동일 prop, `flight → gameover`(목숨 소진) 때 1회(score = 이번 판 골 수) | lazy 모달 유지 |
| `CardMatchModal.tsx` + `useCardMatchGame.ts` | **(S3 완료)** 동일 prop, `won` 전이 때 1회(score = 턴 수) | |
| `src/web/toty-card/TotyCardPopup.tsx` | **(S3 완료)** optional `onView?: (id, variant) => void` — 카드가 **공개될 때**(그때의 테마)와 **테마를 바꿀 때마다** 호출 | **결정(S3)**: 카드 미션은 이 콜백만 인정한다. `totyCardRevealedStore`(대시보드 전체의 공개 기록)는 판정에 쓰지 않는다 — 팝업은 열 때마다 뒤집기 연출을 다시 하므로 놓치는 것이 없고, 대시보드에서 미리 공개한 사람도 월드에서 다시 열어야 M-01이 진행된다([02 §12](02-story-and-missions.md#12-미션-판정-요약-표-구현-참고)) |
| `src/web/App.tsx` (S3) | `<WorldOverlay dashboard={…}>`로 명단(`snapshot?.streamers`), `woowakgoodUnlocked`, 사이트 효과음 설정(`sfxEnabled/sfxVolume/토글/변경`)을 넘긴다 — 카드 짝 맞추기와 카드 팝업이 쓴다 | `world/ui/WorldModals.tsx`의 `DashboardBridge` |
| `src/web/announcementsData.tsx` | 신규 공지 1건(`"2026-09-jandi-world"` 형식 id) | 기존 항목 패턴 |
| `package.json` | `convert:world-art` 스크립트 | `convert-group-photo-art.mjs` 패턴 |
| `.gitignore` | `tmp/world-src/` 추가 | 원본 PNG 커밋 방지 |
| `docs/PROJECT_HANDOFF.md` | 프런트엔드 구조 표에 world 행 추가(구현 후) | 문서 규칙 |

### 월드 안에서 기존 모달 띄우기
`Modal.tsx`는 포털이 아니라 **제자리 렌더**(`.modal-backdrop`, `position: fixed`, z-index 20)이고, `TotyCardPopup`은 z-index 90의 자체 fixed 오버레이다. 월드 오버레이(z 90, 자체 스태킹 컨텍스트) 안에서 이들을 **자식으로 렌더**하면 오버레이 컨텍스트 안에서 그려지므로 월드 HUD(z < 20)보다 위에 보인다. **S3 구현**(`ui/WorldModals.tsx`):
- 모달은 **스케일되는 `.world-stage` 밖**(오버레이 직속 자식)에 렌더한다. 스테이지는 `transform`을 가져서 그 안의 `position: fixed`는 뷰포트가 아니라 스테이지 기준이 되기 때문이다.
- 월드 HUD/대사/토스트/미션 로그/메뉴의 z-index는 20 미만(10~16), 미니게임 모달은 20, `TotyCardPopup`은 90.
- 모달이 열려 있는 동안 월드 입력(이동·E)은 정지하고 월드 BGM은 끄며(모달이 자기 음악을 튼다), 닫으면 BGM이 돌아온다.
- `Esc`는 **월드의 캡처 단계 핸들러**가 `stopPropagation`하고 `resolveEscape`로 처리한다(가장 위 = 모달 닫기). 그래서 모달들의 window `useEscape`는 월드 안에서는 발동하지 않는다.
- 미션 판정은 **월드가 렌더한 모달의 콜백**만 인정한다(대시보드 토글로 한 플레이는 무관).
- 오락실 기계 4대(`minigame:*`)는 각각 그 게임 모달, 감독실 카드 수납장(`cards`)은 내 카드(없으면 카드가 있는 첫 멤버)로 카드 팝업을 연다. 팝업 안의 "다른 선수 카드 보기"로 리냐·뽀린걸 카드를 고른다.

### 멤버 데이터
`roster.yaml` 수정 금지(웹앱은 `snapshotFixture.json`을 읽고, 게스트는 코드에 하드코딩하는 것이 프로젝트 규칙). 월드는 `worldCast.ts`에 20명을 **하드코딩**하고, 이름·id는 저장소 기준([02 §캐스트](02-story-and-missions.md#3-캐스트)). `snapshot?.streamers`는 카드 짝맞추기 등 기존 모달에 넘기는 용도로만 App에서 받아 전달한다.

## 11. 접근성·제약
- `prefers-reduced-motion`: 카메라 흔들림·파티클 감소, 마커 바운스 정지.
- 대사창은 DOM이므로 스크린리더 라이브 리전(`aria-live="polite"`) 적용.
- 팝업 열림 중 body 스크롤 잠금·Esc 닫기 등은 `FortunePopup.tsx`의 `useBodyScrollLock`/`useEscape` 패턴을 그대로 복사(각 오버레이가 자체 사본을 갖는 것이 프로젝트 관례).
- 키보드 전용 게임이므로 포커스가 캔버스 밖 버튼에 남지 않게 오버레이 진입 시 포커스를 오버레이 루트로 이동.

## 12. 테스트 계획 요약 (상세는 08)
순수 로직만 vitest: 충돌·슬라이드, 미션 상태기계, 세이브 검증/마이그레이션, 대사 선택(순환 인덱스), 일일 시드 결정성, 잔디 러시 엔진, 맵 무결성(문 목적지 존재 · 스폰이 충돌 밖 · NPC id ∈ 캐스트 · 참조 에셋 존재). UI/캔버스는 자동 테스트하지 않으며 `?worldDebug`로 사용자가 배포 후 확인한다.
