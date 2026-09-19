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
| 화면 배율 | `floor(min(W/640, H/360))`, 최소 1 | 남는 영역은 레터박스(어두운 배경). `image-rendering: pixelated`, `ctx.imageSmoothingEnabled = false` |
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
| Esc | 메뉴(일시정지). 대사/모달이 열려 있으면 그것부터 닫기 |
| J | 미션 로그 |
| M | 전체 지도 |
| ↑ ↓ (선택지/메뉴) | 항목 이동 |

첫 진입 시 가이드(코치마크)를 띄운다 → [02 §튜토리얼](02-story-and-missions.md#4-튜토리얼-가이드).

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
  world.css / world-toggle.css
  storage.ts                 fc26-world-* (schemaVersion + validator, group-photo/storage.ts 패턴)
  worldAssets.ts             import.meta.glob 매니페스트 + 프리로더(우선순위 그룹, 진행률)
  engine/
    loop.ts                  고정 스텝 루프
    input.ts                 키 상태, 포커스 스택(대사/모달 우선)
    camera.ts                추적 + 맵 경계 클램프 + 실내 고정
    collision.ts             AABB 슬라이드, 공간 해시 (순수, *.test.ts)
    scene.ts                 overworld / interior 씬, 문 전환·페이드
    render.ts                레이어 그리기, 지면 청크 캐시, y-sort
    particles.ts             꽃잎/눈/불씨/반딧불 (코드 생성)
    npcAi.ts                 idle/wander/face-player
    ball.ts                  월드 킥 볼 물리(마찰·벽 반사)
  state/
    worldState.ts            리듀서(순수) + 이벤트
    missions.ts              미션 상태기계 (locked→available→active→ready→completed)
    dialogue.ts              대사 선택기(상태별 노드 선택, 순환 대사)
    daily.ts                 날짜 시드 일일 미션
    progress.ts              잔디 조각 진행도 → 색 복원 단계(0~10)
  data/
    worldCast.ts             캐스트 20명 (하드코딩, roster.yaml 미사용)
    missionDefs.ts           미션 정의 + 임계값
    dialogueData.ts          NPC별 대사 노드
    maps/overworld.json      맵 데이터 (03 스키마)
    maps/interiors/*.json
  ui/
    LoadingScreen.tsx  TitleScreen.tsx  CharacterSelect.tsx  DialogueBox.tsx
    ChoiceMenu.tsx  MissionLog.tsx  PauseMenu.tsx  WorldMap.tsx  CoachMarks.tsx
    Hud.tsx  Toast.tsx  DailyBoard.tsx
  arcade/
    GrassRushModal.tsx  GrassRushCanvas.tsx  grassRushEngine.ts(+test)  useGrassRush*.ts
  audio/
    worldAudio.ts            BGM 크로스페이드, SFX 풀
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
- **상호작용**: 바라보는 방향 앞 28px 반경 안 상호작용 대상(NPC·표지판·조사 포인트·기계) 중 가장 가까운 것. 대상이 있으면 머리 위/하단에 `E` 프롬프트.
- **트리거 종류**: `door`(씬 전환), `zone`(진입 시 이벤트: 지구 진입 토스트·BGM 전환), `examine`(텍스트 조사), `npc`, `machine`(오락실), `board`(일일 게시판), `pickup`(수집품), `goal`(킥 미션 골대), `checkpoint`.
- **NPC AI**: `idle`(제자리+가끔 방향 전환), `wander`(지정 사각형 안 랜덤 이동), `stay`(고정). 대화 시작 시 플레이어를 향해 돌아보고, 종료 후 복귀. 미션 대상 NPC는 `stay` 고정 권장(위치 예측 가능).
- **월드 킥(쥬멩이 미션·훈련장 상시)**: E로 공 방향 킥, 마찰 감속, 벽 반사. 골대 트리거에 들어가면 득점.

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
  | "collect" | "delivery" | "time_trial" | "kick_goals" | "talk_chain" | "visit";

interface MissionDef {
  id: string;                       // "m-doormomo-sum10"
  giver: CastId;
  title: string;
  kind: MissionKind;
  params: Record<string, unknown>;  // 예: { game: "soccer-sum10", minScore: 60 } / { cardId, variant: "retro" }
  requires?: string[];              // 선행 미션 id
  reward: { shard?: number; badge?: string; flags?: string[] };
  main: boolean;                    // 메인(잔디 조각) 여부
}

type MissionStatus = "locked" | "available" | "active" | "ready" | "completed";

interface WorldSave {
  schemaVersion: 1;
  player: CastId | null;
  scene: SceneId; x: number; y: number; facing: "down" | "up" | "left" | "right";
  missions: Record<string, { status: MissionStatus; progress?: unknown; startedAt?: number }>;
  shards: number;                   // 0~10 (플레이어 자신 제외 10명 기준)
  flags: Record<string, true>;      // tutorial-done, ending-seen, area-weed-open ...
  collected: string[];              // 황금 축구공 id, 해파리 랜턴 id 등
  talked: Record<string, number>;   // NPC별 대화 횟수(순환 대사 인덱스)
  bests: { rush?: number; sum10?: number; kickups?: number; freekick?: number; cardmatch?: number };
  daily: { date: string; picks: string[]; done: string[]; stamps: string[] };
  settings: { bgm: boolean; bgmVolume: number; sfx: boolean; sfxVolume: number };
  coachDone: boolean;
}

interface MinigameRoundResult {
  game: "soccer-sum10" | "kickups" | "freekick" | "cardmatch";
  score: number;                    // cardmatch는 "턴 수"(낮을수록 좋음)
  cleared?: boolean;                // sum10 전체 제거
}
```

- 저장 키: `fc26-world-save-v1`(전체), `fc26-world-discovered-v1`(첫 방문 글로우 해제), `fc26-world-settings-v1`(사운드). 모두 try/catch로 감싸고 검증 실패 시 새 게임.
- 일일 미션 날짜 기준: KST(`Asia/Seoul`) `YYYY-MM-DD`, 시드로 `daily.picks`를 결정론적으로 뽑는다.

## 8. 로딩 화면과 프리로더

- `worldAssets.ts`가 `import.meta.glob("../assets/world/**/*.webp", { eager: true, import: "default", query: "?url" })`로 URL 맵을 만들고, 그룹별 목록을 제공한다.

| 그룹 | 내용 | 시점 |
| --- | --- | --- |
| `boot` | 로딩 키아트, 로고, 타이틀/선택 화면 UI, 11명 선택용 초상·서 있는 스프라이트 | 오버레이 열자마자, 이것만 끝나면 타이틀로 진행 가능 |
| `core` | 지면 텍스처, 오버월드 소품/건물, 플레이어+오버월드 NPC 아틀라스, UI 프레임(대사창 등), 마커/FX, 핵심 SFX 메타 | 캐릭터 선택 후(또는 이어하기 시) 로딩 화면에서 |
| `interior` | 실내 통그림 | 문 진입 직전 지연 로드(진입 전 페이드 동안), 한 번 로드하면 캐시 |
| `audio` | BGM(현재 씬 것 우선), 자주 쓰는 SFX | `core`와 병행, 실패해도 진행 |

- 진행률 = 완료 바이트(불가하면 완료 개수) / 전체. 로딩 화면은 진행률바(코드) + 팁 문구 순환 + 키아트. 최소 표시 시간 0.6초(깜빡임 방지).
- 이미지 로드 실패 시 **플레이스홀더로 폴백**(색 사각형/이니셜) — 에셋이 아직 없어도 게임이 돈다. 이것이 코딩과 아트 제작을 병렬로 진행하는 핵심 규칙이다.
- 오디오 자동재생 정책: 플로팅 버튼 클릭이 사용자 제스처이므로 로딩 중 BGM 컨텍스트를 준비하고, 타이틀에서 재생 시작. `.catch(() => {})` 처리.

## 9. 오디오 설계

- BGM: 씬/지구 전환 시 1초 크로스페이드, 진행도 낮음(시든) ↔ 높음(복원) 필드 BGM 두 트랙을 진행도 5 기준으로 전환. `new Audio()` 2개를 핑퐁.
- SFX: 동시 재생이 필요하므로 기존 `playSfx()`(단일 슬롯, `sfxAudio.ts`) 대신 월드 전용 풀(`worldAudio.ts`, 이름별 3~4개 Audio 인스턴스 재사용).
- 설정: BGM/효과음 on-off·볼륨을 `fc26-world-settings-v1`에 저장, 기본 BGM 35 / SFX 55(기존 게임 기본값과 동일). 기존 `SoundControl.tsx`(`minigame/`) UI 재사용 검토.
- **사이트 전역 `MusicPlayer`(YouTube iframe)**는 독립 재생이므로 월드 진입 시 겹친다 → 구현 세션에서 "월드 열 때 전역 음악 일시정지/복귀" 옵션을 확인하고 결정(미해결 항목, [08](08-implementation-roadmap.md#5-미해결-항목)).
- 기존 효과음 재사용 목록과 신규 목록은 [07-audio.md](07-audio.md).

## 10. 기존 코드 통합 지점

탐색으로 확인한 현재 위치(라인은 2026-09-19 기준 근사치, 구현 시 재확인).

| 파일 | 변경 | 근거/패턴 |
| --- | --- | --- |
| `src/web/App.tsx` | `worldOpen` 상태(`:87-105` 상태 영역), `lazy(() => import("./world/WorldOverlay"))`(`:78` 패턴), 오버레이 렌더(`:311-448` 모달 영역, `<Suspense fallback={null}>`), 좌상단 `<WorldToggle>` 마운트(`:456` `.bottom-left-toolbar` 옆) | 미니게임은 `activeMinigame` 단일 슬롯. 월드는 별도 상태 + 열려 있는 동안 대시보드 토글 무시 |
| `src/web/styles.css` 관련 | 직접 수정 없음. `.topbar`(min-height 76px, `main`이 `min(1400px, 100%-40px)` 중앙 정렬) 때문에 좌상단 고정 버튼이 뷰포트 < 1440px에서 브랜드와 겹칠 수 있음 → 버튼을 `top:12px; left:12px`의 컴팩트 크기로 두거나 `.topbar` 좌측 패딩 확장 | 탐색 결과 |
| `src/web/minigame/soccer-sum10/SoccerSum10Modal.tsx` + `useSoccerSum10Game.ts` | optional `onRoundEnd?: (r: MinigameRoundResult) => void` — phase가 `timeup`/`cleared`가 되는 지점(`:62-66`, `:105-111`)에서 1회 호출 | 기존 동작 불변 |
| `KickupsModal.tsx` + `useKickupsGame.ts` | 동일 prop, phase → `grounded` 시(`:38` 근처) | |
| `FreekickModal.tsx` + `useFreekickGame.ts` | 동일 prop, phase → `gameover` 시 | lazy 모달 유지 |
| `CardMatchModal.tsx` + `useCardMatchGame.ts` | 동일 prop, phase → `won` 시(`:90` 근처), score = 턴 수 | |
| `src/web/toty-card/TotyCardPopup.tsx` | optional `onView?: (id: string, variant: TotyCardVariant) => void` — `onRevealed`(`:419`)와 `handleVariantChange`(`:280`)에서 호출 | 카드 **공개** 여부는 `totyCardRevealedStore.ts`(`isTotyCardRevealed`, `subscribeTotyCardRevealed`)로 이미 조회 가능 |
| `src/web/announcementsData.tsx` | 신규 공지 1건(`"2026-09-jandi-world"` 형식 id) | 기존 항목 패턴 |
| `package.json` | `convert:world-art` 스크립트 | `convert-group-photo-art.mjs` 패턴 |
| `.gitignore` | `tmp/world-src/` 추가 | 원본 PNG 커밋 방지 |
| `docs/PROJECT_HANDOFF.md` | 프런트엔드 구조 표에 world 행 추가(구현 후) | 문서 규칙 |

### 월드 안에서 기존 모달 띄우기
`Modal.tsx`는 포털이 아니라 **제자리 렌더**(`.modal-backdrop`, `position: fixed`, z-index 20)이고, `TotyCardPopup`은 z-index 90의 자체 fixed 오버레이다. 월드 오버레이(z 90, 자체 스태킹 컨텍스트) 안에서 이들을 **자식으로 렌더**하면 오버레이 컨텍스트 안에서 그려지므로 월드 HUD(z < 20)보다 위에 보인다. 규칙:
- 월드 HUD/대사 z-index는 20 미만, 미니게임 모달 래퍼는 그 위, `TotyCardPopup`은 그 위.
- 모달이 열려 있는 동안 월드 입력(이동·E)은 정지, `Esc`는 모달만 닫는다(`useEscape` 중첩 주의 → 월드 쪽 Esc 핸들러가 "열린 모달 없음"일 때만 동작).
- 미션 판정은 **월드가 렌더한 모달의 콜백**만 인정한다(대시보드 토글로 한 플레이는 무관).

### 멤버 데이터
`roster.yaml` 수정 금지(웹앱은 `snapshotFixture.json`을 읽고, 게스트는 코드에 하드코딩하는 것이 프로젝트 규칙). 월드는 `worldCast.ts`에 20명을 **하드코딩**하고, 이름·id는 저장소 기준([02 §캐스트](02-story-and-missions.md#3-캐스트)). `snapshot?.streamers`는 카드 짝맞추기 등 기존 모달에 넘기는 용도로만 App에서 받아 전달한다.

## 11. 접근성·제약
- `prefers-reduced-motion`: 카메라 흔들림·파티클 감소, 마커 바운스 정지.
- 대사창은 DOM이므로 스크린리더 라이브 리전(`aria-live="polite"`) 적용.
- 팝업 열림 중 body 스크롤 잠금·Esc 닫기 등은 `FortunePopup.tsx`의 `useBodyScrollLock`/`useEscape` 패턴을 그대로 복사(각 오버레이가 자체 사본을 갖는 것이 프로젝트 관례).
- 키보드 전용 게임이므로 포커스가 캔버스 밖 버튼에 남지 않게 오버레이 진입 시 포커스를 오버레이 루트로 이동.

## 12. 테스트 계획 요약 (상세는 08)
순수 로직만 vitest: 충돌·슬라이드, 미션 상태기계, 세이브 검증/마이그레이션, 대사 선택(순환 인덱스), 일일 시드 결정성, 잔디 러시 엔진, 맵 무결성(문 목적지 존재 · 스폰이 충돌 밖 · NPC id ∈ 캐스트 · 참조 에셋 존재). UI/캔버스는 자동 테스트하지 않으며 `?worldDebug`로 사용자가 배포 후 확인한다.
