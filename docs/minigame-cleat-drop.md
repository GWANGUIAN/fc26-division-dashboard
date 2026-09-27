# 축구화 던지기 — 기획 · 에셋 · 이미지 프롬프트

스팀 게임 "소시지에 관한 이상한 게임"(젓가락에 매달려 좌우로 흔들리는 소시지를 타이밍 맞춰 떨어뜨리고, 프라이팬을 플리퍼처럼 튕겨 소시지를 오른쪽 목표물 위에 3초간 정지시키면 클리어, 스테이지마다 목표물이 다름)을 축구 소재로 패러디한 미니게임이다. 소시지 → **축구화**, 프라이팬 → **축구선수 발**로 바꾸고, 오른쪽 목표물은 전부 축구/경기장 소재, 스테이지는 30개다.

**이 문서 하나만 읽고 다른 세션에서 구현·이미지 생성을 끝낼 수 있도록 자기완결로 쓴다.** 서식 선례: [minigame-football-match3.md](minigame-football-match3.md), [forever/06-audio.md](forever/06-audio.md). 다른 미니게임 문서: [minigame-football-match3.md](minigame-football-match3.md), [minigame-grass-merge.md](minigame-grass-merge.md), [minigame-keeper-breakout.md](minigame-keeper-breakout.md). **세션별로 그대로 붙여넣을 지시 프롬프트**: [minigame-cleat-drop-session-prompts.md](minigame-cleat-drop-session-prompts.md).

**상태**: 기획 완료 · 구현 전 (2026-09-27). **범위**: 대시보드 "심심풀이" 메뉴만. 온라인 랭킹·월드 연동은 후속 작업(필요하면 [minigame-ranking.md](minigame-ranking.md) 레시피를 그대로 따른다).

> **원칙: 문서가 코드보다 먼저다.** 코드는 이 문서(특히 "3. 구현 설계"·"4. 스테이지 데이터")와 다르게 짜지 않는다. 바꿔야 하면 문서를 먼저 고친다.

## 0. 한눈에 보기

| 항목 | 내용 |
| --- | --- |
| 게임 id / 메뉴 라벨 | `cleat-drop` / "축구화 던지기" |
| 장르 | 타이밍 낙하 + 플리퍼 킥 물리 퍼즐 (원작 패러디) |
| 원작과 다른 점 | 소시지→축구화, 프라이팬→축구선수 발, 오른쪽 목표물 30종이 전부 축구/경기장 소재, 시도 횟수 누적 저장 + 전체 클리어 시 총 시도 횟수 공개 |
| 조작 | 좌클릭 1회: 진자로 흔들리는 축구화의 신발끈을 풀어 낙하. 좌클릭 2회째(낙하 중 아무 때나): 대기 중인 발을 스윙해 낙하하는 축구화를 타격. 데스크톱 클릭 + 모바일 탭 |
| 목표 | 타격된 축구화가 스테이지 오른쪽 목표물 위에 얹혀 3초간 정지(속도 임계값 이하) 유지 |
| 스테이지 | 30개 (5티어 × 6단계). 난이도는 목표물의 **형태**(판정폭/기울기·곡률/재질 반발계수)와 **환경**(바람, 흔들림·회전)으로 결정. 전반적으로 쉽지 않고 꽤 어려운 난이도로 튜닝 |
| 저장 | `fc26-cleat-drop-progress` (localStorage): 스테이지별 클리어 여부 + 스테이지별/누적 시도 횟수. 30개 전부 클리어 시 완료 화면에 누적 시도 횟수 표시 |
| 구현 방식 | 순수 엔진(진자 → 자유낙하 → 타격 임펄스 → 중력+스핀+반발 바운스 → 정지 판정), 새 물리엔진 의존성 추가 없음. 레포의 다른 미니게임(`freekickEngine.ts` 등)과 같은 손물리엔진 컨벤션 |
| 에셋 | 이미지 8장(그룹 생성, 총 생성 횟수 절감), 효과음 다수 + BGM 1곡. 에셋이 없어도 CSS/Canvas 폴백으로 동작 |
| 이미지 스타일 | **살짝 리얼한 3D 렌더 일러스트**(원작 스팀 게임 카드 이미지처럼 부드러운 스튜디오 조명·매트한 질감, 두꺼운 만화 외곽선이나 셀 셰이딩 없음). 레포의 다른 미니게임 이미지를 레퍼런스로 쓰지 않고, 이 게임만의 독립된 톤으로 새로 만든다 |

## 1. 규칙 · 조작 · 화면

### 1-1. 규칙

1. 대기 상태: 화면 왼쪽 위 훅에 신발끈으로 매달린 축구화가 좌우로 진자운동을 한다. 초기 진폭이 크고 시간이 지날수록 감쇠해 결국 정지한다(원작처럼 "타이밍"이 실력 요소가 되도록 감쇠 도중 아무 때나 떨어뜨릴 수 있음).
2. **좌클릭 ①**: 신발끈이 풀리며 축구화가 그 순간의 진자 위치/각속도를 초기값으로 자유낙하를 시작한다.
3. 화면 왼쪽 아래에는 대기 중인 축구선수 다리(엉덩이 관절을 축으로 회전하는 플리퍼)가 있다.
4. **좌클릭 ②**(낙하 중 아무 때나): 다리가 빠르게 스윙한다. 스윙 궤적과 낙하 중인 축구화가 접촉하는 순간, 접촉 시점의 상대 위치(발등의 어느 지점에 맞았는지)와 다리 각속도로 파워·발사각·스핀을 계산해 축구화에 임펄스를 전달한다(설계 참고: `src/web/minigame/freekickEngine.ts`의 `computeShotVelocity`처럼 타격 오프셋 → 스핀, 드래그/스윙 세기 → 파워 매핑).
5. 스윙이 축구화와 만나지 못하면(너무 이르거나 늦으면) 축구화는 그대로 바닥에 떨어져 **실패**.
6. 타격된 축구화는 중력 + 스핀에 의한 곡선(Magnus 근사) + 스테이지별 바람(횡가속도)을 받아 날아가고, 땅이나 목표물에 닿으면 스테이지별 반발계수로 튕기거나 구른다. 축구화는 소시지처럼 **좌우 비대칭 형태**(발볼이 넓고 뒤꿈치가 좁음)라 회전축이 고정된 원형 공보다 훨씬 불규칙하게 튀고 구른다 — 이게 원작의 "우연성"을 재현하는 핵심 설계 포인트다.
7. 축구화가 목표물의 판정 영역 위에 놓이고 속도가 임계값 이하로 3초간 유지되면 **스테이지 클리어**. 목표물에서 미끄러지거나 떨어지거나, 3초를 채우기 전에 다시 크게 움직이면(자세가 무너지면) 실패로 처리하고 타이머를 리셋한다.
8. 실패 시 축구화·다리·진자를 즉시 리셋하고 바로 재도전 가능. 시도마다 해당 스테이지 시도 횟수 +1, 전체 누적 시도 횟수 +1 (저장 방식은 아래 "5. 저장 스펙" 참고).
9. 클리어하면 다음 스테이지로 자동 전환(또는 스테이지 선택 화면 복귀 — 구현 세션에서 결정). 30개를 모두 클리어하면 완료 화면에 누적 시도 횟수를 보여준다.

### 1-2. 조작

좌클릭(또는 탭) 단 하나만 쓴다 — 원작처럼 미니멀한 조작을 유지한다. 클릭 시점 외에 별도 드래그·조준은 없다(타이밍이 전부인 게임이므로).

### 1-3. 물리 설계 메모

- 새 물리엔진 라이브러리(Matter.js 등)를 추가하지 않는다. 레포의 모든 미니게임이 손물리엔진(순수 함수, 프레임마다 `stepPhysics(state, dt)`)이라 그 컨벤션을 따른다.
- 상태는 위치/속도/각도/각속도를 가진 강체 근사(단순화된 2점 접촉 모델: 발볼 접점 + 뒤꿈치 접점)로 표현해 비대칭 바운스를 낸다. 완전한 강체 회전 시뮬레이션까지는 필요 없고, "두 접점 중 먼저 닿는 쪽에 따라 반사각이 갈린다" 정도의 근사로 충분히 불규칙해진다.
- 스핀에 의한 곡선은 `freekickEngine.ts`의 `spin * MAGNUS_COEFFICIENT * dt` 패턴을 그대로 참고한다.
- 스테이지별 변수(아래 "4. 스테이지 데이터" 표): 목표물 판정폭, 기울기/곡률, 반발계수, 바람 가속도, (있다면) 목표물 자체의 흔들림·회전. 전부 순수 데이터로 `cleatDropStages.ts`에 둔다("3-1. 파일" 참고).

### 1-4. 화면 구성

- 기존 `Modal`(wide) 셸 재사용.
- 왼쪽 위: 훅 + 진자 축구화. 왼쪽 아래: 축구선수 다리(대기/스윙). 오른쪽: 스테이지별 배경(경기장 사이드라인 톤) 위에 목표물.
- HUD: 스테이지 번호(`n / 30`), 이번 스테이지 시도 횟수, 클리어한 스테이지 도트 인디케이터(30개, 클리어한 것만 채움).
- 목표물 위에 3초 유지 게이지(원형 프로그레스 링)를 표시해 "지금 판정 중"임을 알려준다.
- 사운드: 기존 `SoundControl` 재사용.

## 2. 레퍼런스 · 저작권

| 항목 | 내용 |
| --- | --- |
| 메커니즘 출처 | Steam "A Wonderful Sausage"류(젓가락 낙하 타이밍 + 프라이팬 플리퍼 + 3초 정지 판정 + 다중 스테이지)의 **규칙만** 패러디한다. 캐주얼 물리 퍼즐 장르 관행(핀볼 플리퍼, 진자 낙하 타이밍)은 자유롭게 쓸 수 있다 |
| 쓰지 않을 것 | 원작 이름·로고·정확한 아트(젓가락/프라이팬/소시지 디자인)를 그대로 베끼지 않는다. 이미지 생성 프롬프트에도 원작 명칭을 넣지 않는다 |
| 내부 참고 구현 | `src/web/minigame/freekickEngine.ts` — 순수 함수 물리 엔진 스타일(스핀·파워 계산, 상태 in/out, 결정론적 테스트 가능한 구조)의 코드 패턴 참고용 |
| 내부 참고 문서 | [docs/forever/04-image-runbook.md](forever/04-image-runbook.md)(그리드 이미지 배치), [docs/forever/06-audio.md](forever/06-audio.md)(오디오 표 형식) |

## 3. 구현 설계 (다음 세션)

### 3-1. 파일 (football-match3 폴더 구조를 그대로 따른다)

| 파일 | 역할 |
| --- | --- |
| `src/web/minigame/cleat-drop/cleatDropStages.ts` | 30개 스테이지 정의 데이터("4. 스테이지 데이터" 표를 그대로 코드화). `Date`·`Math.random` 금지 |
| `src/web/minigame/cleat-drop/cleatDropEngine.ts` | 순수 엔진. `createGame(stageIndex)`, `releasePendulum(state, t)`, `swingLeg(state, t)`, `stepPhysics(state, dt)`, `isSettled(state)` |
| `src/web/minigame/cleat-drop/cleatDropEngine.test.ts` | 엔진 테스트 (3-2) |
| `src/web/minigame/cleat-drop/CleatDropCanvas.tsx` | 캔버스 렌더 + 클릭 입력(진자/스윙 2단계) |
| `src/web/minigame/cleat-drop/useCleatDropGame.ts` | React 상태, 스테이지 진행, `cleatDropProgress.ts` 연동, end-latch로 클리어/전체클리어 1회 보고 |
| `src/web/minigame/cleat-drop/cleatDropProgress.ts` | 저장/불러오기 (아래 "5. 저장 스펙" 참고) |
| `src/web/minigame/cleat-drop/useCleatDropSfx.ts` / `useCleatDropMusic.ts` | 기존 `useFootballMatch3Sfx/Music` 복제 후 키 이름 교체 |
| `src/web/minigame/cleat-drop/cleatDropSfxMap.ts` | "7. 오디오" S1~S12 이벤트 → 후보 파일 목록(자기 파일 우선, 재사용 폴백 다음) + `playCleatDropSfx(id, volume)` |
| `src/web/minigame/cleat-drop/CleatDropModal.tsx` | 모달 셸. `onClose` |
| `src/web/minigame/cleat-drop/cleat-drop.css` | 접두사 `.cleat-drop-*`, 폴백 색 필수 |
| `src/web/minigame/cleat-drop/cleatDropAssets.ts` | 이미지 URL 상수 + `Image` 로더(실패 시 `undefined` → 폴백 렌더) |

### 3-2. 엔진 테스트 항목(초안)

1. 같은 시드/같은 클릭 타이밍이면 결과가 같다(결정성 — 타이밍 값을 인자로 받아 `Date.now()`를 쓰지 않는다).
2. 스윙이 축구화 궤적과 겹치지 않으면 축구화는 초기 낙하 궤적 그대로 바닥에 닿는다(타격 없음).
3. 타격 임펄스는 접촉 오프셋에 단조적으로 반응한다(오프셋이 클수록 스핀이 커짐 등, `freekickEngine.test.ts`의 검증 스타일 참고).
4. 목표물 판정폭 안에서 속도가 임계값 이하로 3초 누적되면 `phase`가 `cleared`가 된다. 중간에 속도가 임계값을 넘으면 타이머가 0으로 리셋된다.
5. 실패 시(바닥 낙하 / 목표물 이탈) 해당 스테이지 `attemptsByStage[i]`와 전체 `attempts`가 각각 1 증가한다.
6. 30번째 스테이지 클리어 시점에만 `allCleared` 플래그가 한 번 켜진다(end-latch).

### 3-2b. 세션 2 구현 메모 (문서와 달라진/구체화된 부분)

- `STAGE_COUNT`는 `cleatDropProgress.ts`(세션 4)가 아니라 `cleatDropStages.ts`에 `export const STAGE_COUNT = STAGES.length;`로 정의했다. 세션 4의 `cleatDropProgress.ts`는 이 값을 import해서 쓴다(재정의하지 않는다).
- 엔진 함수 시그니처는 아래처럼 확정했다(대부분 doc 초안과 동일, 이름만 소폭 조정):
  - `createGame(stageIndex: number, resume?: { cleared?: boolean[]; attempts?: number; attemptsByStage?: number[] })` — `resume`은 세션 4에서 저장된 진행도로 이어할 때 쓰는 선택 인자(생략 시 처음부터).
  - `releasePendulum(state, t)` / `swingLeg(state, t)` — `t`는 호출 시점의 엔진 경과 시간(초). `Date.now()`를 쓰지 않고 호출부(추후 `useCleatDropGame.ts`)가 프레임 누적 시간을 넘긴다.
  - `stepPhysics(state, dtSeconds)` — `phase`에 따라 내부에서 진자/낙하/비행 스텝으로 분기.
  - `isSettled(state)` — 축구화가 지면/목표물 평면에 정지해 있는지(성공·실패 무관, `state.resting`).
  - 추가로 `advanceStage(state)`(클리어 후 다음 스테이지로, `cleared`/`attempts`/`attemptsByStage` 이력 유지), `retryStage(state)`(실패 후 같은 스테이지 재도전)를 뒀다 — doc 3-1 표에는 없었지만 "클리어 시 다음 스테이지로 자동 전환", "실패 시 즉시 재도전"(1-1 규칙 8, 9)을 구현하려면 필요해 추가했다.
- `CleatDropPhase = "pendulum" | "falling" | "flight" | "cleared" | "failed"`. 목표물 위 3초 판정은 별도 phase 없이 `flight` 상태에서 `holdTimer`로 추적한다(판정 중에도 렌더 쪽에서 `state.holdTimer / 3`로 게이지를 그릴 수 있음).
- 물리는 px 단위(논리 캔버스 960×540) 손물리엔진. 진자·다리 스윙은 감쇠진동/이징의 닫힌형 함수(`pendulumAngleAt(t)`, `legAngleAt(progress)` 등)로 계산해 결정성을 확보했고, 낙하·비행 단계만 `stepPhysics(state, dt)`로 매 프레임 적분한다.
- 스테이지 데이터의 "동적 요소" 중 진폭/주파수가 명시된 것(#21, #25, #26, #28, #29, #30)만 `motion` 필드로 구조화해 실제 판정(목표물 좌표/유효 판정폭)에 반영했다. 수치가 없는 것(#12, #15, #20, "굴림 진동 소" 등)은 `dynamicNote`(자유 텍스트)로만 남기고 물리에는 반영하지 않았다 — 렌더 세션(3)에서 시각 연출로만 처리하면 된다.
- 곡면(`curved: true`) 목표물은 문서 4절의 문구대로 `catchWidthPx`를 그대로 유효 판정폭으로 쓴다(곡률 보정을 이중으로 걸지 않음). 평평하지만 기울어진(`tiltDeg`) 목표물만 `catchWidthPx * cos(tiltDeg)`로 유효 판정폭을 줄인다.

### 3-2c. 세션 3 구현 메모 (아트 통합 · 캔버스)

- `tmp/minigame-src/cleat-drop/leg-sheet.png`의 실제 픽셀 크기는 1254×1254로, "6. 아트 스펙"에 적힌 1024×1024와 다르다. 다만 격자 슬라이싱이 비율 기반(`gridCells`가 폭/높이를 컬럼·로우 수로 나눔)이라 크기 차이는 결과물에 영향이 없고, 실제로 열어 확인한 결과 2×2 격자·좌상단(idle)/우상단(swing-a)/좌하단(swing-b) 배치·우하단 빈칸까지 기획과 정확히 일치해 그대로 사용했다(멈추지 않고 진행). 나머지 7장(G1, G3~G8)은 픽셀 크기·격자 배치 모두 문서와 일치.
- `scripts/minigame-art-manifest.json`에 `cleat-drop` 그룹을 추가했다(`key: "magenta"` 없이 — 원본이 실제로 알파 투명이라 크로마키 단계가 불필요). `pnpm convert:minigame-art -- cleat-drop`으로 43개 파일 모두 변환 성공(누락 스프라이트 없음).
- 렌더가 목표물 위치/유효폭·3초 게이지 진행률을 물리와 동일한 공식으로 그리려면 엔진의 순수 헬퍼가 필요해 `cleatDropEngine.ts`의 `targetCenterX`·`effectiveCatchWidth`·`HOLD_DURATION_SECONDS`를 `export`로 바꿨다(로직 변경 없음, 캔버스가 같은 수식을 중복 구현하지 않도록 하기 위함).
- `CleatDropCanvas.tsx`: 축구화는 `state.phase`/`pendulumAngle`/`resting`으로 5프레임(G1) 중 하나를 고르고, 다리는 `leg.swinging`/`leg.hasContacted`로 3프레임(G2) 중 하나를 고르는 **이산 프레임 전환** 방식으로 구현했다(문서의 "보간 또는 2프레임 애니메이션" 중 후자에 해당, `LEG_SWING_DURATION`처럼 비공개 상수를 새로 export하지 않고 진행률 보간 없이 처리). 이미지가 없으면 색상 도형(진자/다리/축구화/목표물 모두)으로 폴백한다.
- 3초 유지 게이지(원형 링)와 스테이지 30개 도트 인디케이터는 이 세션의 지시에 따라 **캔버스 안에서** 그린다(다른 미니게임처럼 HTML 배지로 빼지 않음). 이후 세션(4·5)에서 별도 HTML HUD를 추가할 때 도트를 중복해서 그리지 않도록 주의.
- 목표물 스프라이트 크기(56~140px, `catchWidthPx * 1.15` 기준)와 축구화 스프라이트 크기(64px 고정, 중심 앵커)는 임시 발견적 값이다 — 정확한 정렬은 아래 "완료 기준"의 배포 후 확인 목록 참고.

### 3-2d. 세션 4 구현 메모 (진행 저장 · 오디오 · React 상태 · 완료 화면)

- `cleatDropProgress.ts`는 "5. 저장 스펙"의 코드 스니펫을 그대로 구현했다(`STAGE_COUNT`는 `cleatDropStages.ts`에서 import, 재정의하지 않음). `parseProgress`는 버전/길이(모두 `STAGE_COUNT`)/타입(불리언 배열·음이 아닌 정수)을 전부 검증하고, 하나라도 어긋나면 `defaultProgress()`로 폴백한다.
- 오디오는 `pitch/audio/sfxMap.ts`의 "이벤트 → 후보 파일 목록" 아이디어만 가져오되, 구현은 훨씬 가볍게 했다 — 비동기 `probe`/풀링 없이 `sfxAudio.ts`의 기존 `playSfx(url, volume, onCreate)`를 재사용해, 후보 파일의 `error` 이벤트가 뜨면 다음 후보를 이어서 재생하는 방식(`cleatDropSfxMap.ts`의 `playCleatDropSfx`). `useCleatDropSfx.ts`/`useCleatDropMusic.ts` 자체는 문서 지시대로 `useFootballMatch3Sfx/Music`을 복제해 키 이름만 바꿨다(on/off·볼륨 상태만 가짐, 실제 재생 호출은 게임 훅 쪽에 있는 것도 football-match3와 동일).
- `useCleatDropGame.ts`는 세션 2 엔진이 프레임마다 `t`를 스스로 갱신한다는 점(`releasePendulum`/`swingLeg`가 받는 `t`는 클릭 시점의 `state.t`를 그대로 넘기면 됨, `performance.now()` 불필요)을 그대로 활용했다. `CleatDropCanvas.tsx`가 `state`를 prop으로 받아 prop이 바뀔 때만 다시 그리는 구조(세션 3에서 확정)라, `useKickupsGame`/`useFreekickGame`처럼 `liveStateRef` + 체크포인트에서만 `setState`하는 최적화 대신 물리 프레임마다 `setState`한다 — 이 게임은 스프라이트 하나+목표물 하나뿐이라 60fps 리렌더 비용이 무시할 만하다고 보고 내린 절충.
- 사운드 큐(S1~S12)는 엔진 상태에 오디오 개념을 넣지 않고, 훅에서 이전 프레임과 현재 프레임을 diff해서 추론한다: 착지 후 튐(S5/S6)은 `vy`가 양수→음수로 뒤집히는 프레임을 "방금 튐"으로 보고, `stage.restitution < 0.4`면 soft, 아니면 hard로 갈랐다(문서에 수치 기준이 없어 임의로 정한 임계값). 실패(S4/S9)는 `failed` 직전 phase가 `falling`이면 미스(안 맞고 바닥), `flight`면 슬립오프(맞고 날아갔다가 실패)로 나눴다 — 엔진이 이 둘을 별도 원인으로 구분하지 않아 phase 전이만으로 유추한 근사다. `timer-tick`(S8)은 `holdTimer`를 0.5초 버킷으로 나눠 버킷이 올라갈 때만 재생한다.
- "완료 화면"은 문서의 두 옵션 중 **캔버스 오버레이**로 구현했다(`CleatDropCanvas.tsx`에 `allClear?: { attempts } | null` prop 추가, 있으면 배경+스테이지 도트+문구만 그리고 입력을 막는다). 별도 `CleatDropModal.tsx`가 아직 없어(세션 5 몫) 완료 화면을 감싸는 셸이 없기 때문. `useCleatDropGame`의 `showAllClear`는 엔진의 `allClearLatched`(그 판의 처음 한 번만 true가 되는 세션 한정 플래그)와는 별개로, "이미 다 깬 상태로 저장을 불러왔는지"까지 포함한다 — 그래야 문서 5절의 "이후에도 모달을 다시 열면 완료 화면을 계속 보여준다"가 성립한다. 이 경우 all-clear 사운드는 재생하지 않는다(이미 이전 세션에서 들었을 것이므로) — 훅 내부의 일회성 래치(`createCleatDropAllClearLatch`, football-match3/soccer-sum10의 end-latch와 동일한 `claim()`/`reset()` 패턴)를 불러오자마자 미리 한 번 `claim()`해 둬서 처리했다.
- 클리어 후 다음 스테이지 자동 전환은 900ms, 실패 후 재도전은 550ms 지연을 두었다(문서의 "즉시 재도전"을 0ms로 하면 팡파르/실패 연출을 볼 새 없이 바로 넘어가 버림) — 정확한 값은 플레이테스트(세션 5)에서 조정 가능한 임의값이다.
- 사용자가 아직 오디오 파일을 확보하지 않은 상태로 구현을 요청해 BGM 1개 + SFX 12개가 전부 미확보다: `public/cleat-drop-bgm.mp3`, `public/sfxes/cleat-drop-{lace-release,leg-swing,kick-impact,miss-ground,bounce-soft,bounce-hard,land-settle,timer-tick,slip-off,stage-clear,all-clear,ui-click}.mp3`. 파일이 없는 동안은 각 이벤트가 "7-2. 효과음" 표의 재사용 폴백(`pitch-*.mp3`, 전부 레포에 이미 존재 확인함)으로 재생되거나(`timer-tick`은 폴백이 없어 무음) 조용히 무음 처리된다.

### 3-2e. 세션 5 구현 메모 (등록 · 메뉴 라벨 최종화)

- 메뉴 라벨을 "축구화에 대한 이상한 게임"에서 **"축구화 던지기"**로 바꿨다(사용자 지시, 2026-09-27). 이 문서의 "0. 한눈에 보기" 표, "3-3. 등록 체크리스트", [minigame-cleat-drop-session-prompts.md](minigame-cleat-drop-session-prompts.md)의 세션 1·5 프롬프트, `CleatDropCanvas.tsx`의 캔버스 `aria-label`을 전부 새 이름으로 맞췄다. 게임 id(`cleat-drop`)와 파일/에셋/사운드 이름은 그대로 둔다(라벨만 바뀐 것이라 다시 지을 필요 없음).
- `CleatDropModal.tsx`는 이 세션에서 신규 작성했다. football-match3/grass-merge 계열(순위표 있는 게임)이 아니라 `football-rules-quiz` 계열(순위표 없이 `Modal` + 자체 HUD `div`)을 본떴다 — 이 문서 어디에도 cleat-drop용 랭킹이 없고, `useCleatDropGame`도 `useRanking`을 쓰지 않기 때문.
- `useCleatDropGame`이 만드는 `state`는 `createGame()`이 곧장 `phase: "pendulum"`으로 시작해 다른 미니게임들의 "게임 시작" 버튼이 걸리는 `ready` 단계가 아예 없다. 그래서 `CleatDropModal`도 시작 버튼 없이 마운트되자마자 `useEffect`에서 바로 `music.startMusic()`을 호출하고, 언마운트 시 `stopMusic()`한다(전체 클리어 상태로 불러온 경우는 재생하지 않음).
- HUD는 "스테이지 n/30", "이번 스테이지 시도 횟수", "클리어 m/30"(텍스트) 세 배지만 넣었다 — "3-2c. 세션 3 구현 메모"가 못박은 대로 클리어 스테이지 30개 도트 인디케이터와 3초 게이지는 이미 `CleatDropCanvas.tsx`가 캔버스 안에 그리고 있어서, HTML HUD에 다시 그리면 중복이라 뺐다.
- 전체 클리어 화면도 캔버스 오버레이(세션 4에서 이미 구현)를 그대로 쓴다. `CleatDropModal`은 `game.showAllClear`가 true면 `CleatDropCanvas`에 `allClear={{ attempts: game.state.attempts }}`만 넘기고, 별도의 HTML 완료 패널은 만들지 않았다(캔버스가 이미 배경·도트·문구를 전부 그림).

### 3-3. 등록 체크리스트 (다음 세션에서 반드시 4곳 모두)

| 파일 | 위치 | 할 일 |
| --- | --- | --- |
| `src/web/minigame/MinigameMenu.tsx` | `MinigameId` 유니언 | `"cleat-drop"` 추가 |
| 〃 | `games` 배열 | `{ id: "cleat-drop", label: "축구화 던지기", icon: <img src="/cleat-drop-icon.webp" alt="" className="minigame-menu__icon" /> }` |
| 〃 | `WARMUP_URLS` | `/cleat-drop-bgm.mp3`, `/sfxes/cleat-drop-swing.mp3`, `/sfxes/cleat-drop-kick.mp3` 등 자주 재생되는 sfx 추가 |
| `src/web/App.tsx` | `activeMinigame` 상태 유니언 + 모달 렌더 분기 | `"cleat-drop"` 추가, `{activeMinigame === "cleat-drop" && <CleatDropModal onClose={() => setActiveMinigame(null)} />}` |

## 4. 스테이지 데이터 (30개 = 5티어 × 6단계)

목표물은 전부 축구/경기장 소재다. 판정폭은 논리 캔버스 **960×540** 기준 가로 px(값이 작을수록 어려움). 기울기는 도(°, 음수=왼쪽으로 기움), 곡면 목표물은 기울기 대신 `곡면`으로 표기하고 판정폭이 곡률을 대신 반영한다. 반발계수는 0(전혀 안 튐)~1(완전탄성)에 가까운 상대값. 바람은 좌우 횡가속도(px/s², 음수=왼쪽). 동적 요소가 있으면 흔들림/회전 진폭·속도를 적는다. **아래 수치는 초안이며 구현 세션 플레이테스트로 조정한다.**

### 티어 1 — 쉬움 (넓고 평평, 바람 없음)

| # | 목표물 | 에셋 키 | 판정폭 | 기울기 | 반발계수 | 바람 | 동적 요소 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 코치 벤치 좌석 | `target-bench` | 150 | 0° | 0.15 | 0 | — |
| 2 | 선수 가방 위 | `target-kitbag` | 140 | 0° | 0.20 | 0 | — |
| 3 | 물통 캐리어 상단 | `target-bottle-carrier` | 135 | 0° | 0.35 | 0 | — |
| 4 | 코치 클립보드 | `target-clipboard` | 130 | 0° | 0.40 | 0 | — |
| 5 | 접은 응원 배너 뭉치 | `target-banner-roll` | 125 | 0° | 0.10 | 0 | — |
| 6 | 골키퍼 훈련 매트 | `target-gk-mat` | 120 | 0° | 0.25 | 0 | — |

### 티어 2 — 보통 (약간 좁거나 기울어짐, 약한 바람)

| # | 목표물 | 에셋 키 | 판정폭 | 기울기 | 반발계수 | 바람 | 동적 요소 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | 축구 콘(주황 삼각뿔) | `target-cone` | 110 | 5° | 0.35 | +15 | — |
| 8 | 코너 깃발 받침대 | `target-corner-flag-base` | 105 | −6° | 0.30 | −15 | — |
| 9 | 세숫대야(아이싱용) | `target-basin` | 100 | 7° | 0.30 | +20 | — |
| 10 | 접이식 응원 의자 등받이 | `target-chair-back` | 95 | −8° | 0.30 | −20 | — |
| 11 | 팀 로고 방석 | `target-team-cushion` | 90 | 9° | 0.15 | +25 | — |
| 12 | 라인기(라인 마카) 손잡이 | `target-line-marker` | 85 | −10° | 0.40 | −25 | 굴림 진동 소 |

### 티어 3 — 어려움 (곡면·좁음, 중간 바람)

| # | 목표물 | 에셋 키 | 판정폭 | 기울기/곡률 | 반발계수 | 바람 | 동적 요소 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 13 | 트로피 컵 테두리 | `target-trophy-rim` | 80 | 곡면 | 0.55 | +30 | — |
| 14 | 골대 크로스바 위 | `target-crossbar` | 75 | 곡면(원통) | 0.60 | −30 | — |
| 15 | 코너킥 깃대 꼭대기 | `target-corner-flag-top` | 72 | 곡면 | 0.50 | +35 | 깃발 펄럭임(시각) |
| 16 | 축구공 카트 테두리 | `target-ball-cart-rim` | 68 | 곡면 | 0.45 | −35 | — |
| 17 | 호루라기 걸이 | `target-whistle-hook` | 64 | 12° | 0.50 | +40 | — |
| 18 | 스코어보드 상단 모서리 | `target-scoreboard-corner` | 60 | −14° | 0.55 | −40 | — |

### 티어 4 — 매우 어려움 (작고 불안정, 강한 바람)

| # | 목표물 | 에셋 키 | 판정폭 | 기울기/곡률 | 반발계수 | 바람 | 동적 요소 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 19 | 물병 뚜껑 | `target-bottle-cap` | 55 | 곡면 | 0.40 | +45 | — |
| 20 | 골키퍼 장갑 손등 | `target-gk-glove-back` | 52 | 10° | 0.30 | −45 | 미세 진동 |
| 21 | 주장 완장 걸이 | `target-armband-hook` | 48 | −12° | 0.25 | +50 | 좌우로 살짝 흔들림(진폭 6px, 1.2Hz) |
| 22 | 심판 카드 지갑 | `target-card-wallet` | 45 | 14° | 0.35 | −50 | — |
| 23 | 축구화 끈 고리(다른 신발 위) | `target-lace-loop` | 42 | 곡면 | 0.20 | +55 | — |
| 24 | 응원 뿔나팔 입구 | `target-megaphone-mouth` | 38 | 곡면 | 0.35 | −55 | — |

### 티어 5 — 최상 (매우 좁고 움직이거나 경사짐)

| # | 목표물 | 에셋 키 | 판정폭 | 기울기/곡률 | 반발계수 | 바람 | 동적 요소 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 25 | 회전하는 스프링클러 헤드 | `target-sprinkler` | 34 | 곡면 | 0.40 | +60 | 90°/s로 계속 회전 |
| 26 | 흔들리는 응원 풍선 꼭대기 | `target-balloon-top` | 30 | 곡면 | 0.60 | −65 | 좌우 스윙(진폭 20px, 0.8Hz) |
| 27 | 기울어진 전광판 모서리 | `target-tilted-board-corner` | 28 | −18° | 0.50 | +70 | — |
| 28 | 회전하는 드론 카메라 위 | `target-drone-top` | 25 | 0° | 0.35 | −70 | 상하 호버링(진폭 10px, 1.5Hz) |
| 29 | 흔들리는 그물망 상단 로프 | `target-net-rope` | 22 | 곡면 | 0.15 | +80 | 좌우 출렁임(진폭 14px, 1Hz) |
| 30 | 바람에 펄럭이는 우승기 깃대 끝 | `target-flagpole-tip` | 20 | 곡면 | 0.45 | −80(강풍, 방향도 5초마다 반전) | 깃발 펄럭임이 유효 판정폭을 ±5px 흔듦 |

### 4-1. 세션 5 난이도 메모 (코드만 보고 판단, 실측 아님)

`cleatDropEngine.ts`를 실측 없이 코드로만 따라가 보면, 안착(`resting`)한 축구화는 `stepFlight`에서 x좌표가 고정된 채 매 프레임 `withinTargetZone(x, stage, t)`만 재검사하고(자체 참고: [cleatDropEngine.ts:264-282](../src/web/minigame/cleat-drop/cleatDropEngine.ts)), 목표물을 따라 움직이지 않는다. 여기서 두 가지가 눈에 띈다:

- **#26(응원 풍선, `swayAmplitudePx: 20` vs 유효 판정폭 30 → 반폭 15), #29(그물망 로프, `swayAmplitudePx: 14` vs 유효 판정폭 22 → 반폭 11)는 흔들림 진폭이 반폭보다 커서, 축구화가 정중앙에 안착해도 한 주기(#26 1.25초, #29 1초) 안에 반드시 판정 구간을 벗어나는 순간이 생긴다.** `withinTargetZone`이 한 번이라도 거짓이 되면 `holdTimer`가 리셋되는 게 아니라 그 시도 자체가 즉시 `failed`로 끝나므로(9절 규칙과 달리 "정중앙 유지 중 크게 움직이면 리셋"이 아니라 "정중앙이어도 목표물이 알아서 비켜나가면 즉시 실패"), 계산상 연속 3초 유지 가능한 최대 구간이 각각 약 0.34초/0.29초뿐이라 **현재 수치로는 이 두 스테이지가 사실상 클리어 불가능하다.** 배포 후 실측으로 막힌다면, 두 스테이지 중 하나를 고치는 방향(흔들림 진폭을 반폭보다 작게 줄이거나, 안착 후 축구화가 목표물과 같이 움직이도록 엔진에 보정 로직 추가)을 검토할 것.
- **#28(드론 위)의 `motion: { swayAxis: "y", ... }`은 실제로는 판정에 전혀 반영되지 않는다.** `targetCenterX`/`effectiveCatchWidth`는 `swayAxis === "x"`만 처리하고 y축은 읽지 않으므로("3-2b. 세션 2 구현 메모"에 "#28은 실제 판정에 반영했다"고 적었던 것과 다르게), 지금은 정적 목표물과 동일하게 동작한다. 시각적 호버링 연출만 남기고 넘어갈지, y축 흔들림도 유효폭에 반영할지 후속 세션에서 결정 필요.

## 5. 저장 스펙

`src/web/pitch/game/foreverProgress.ts` 패턴(버전 있는 JSON blob + 검증 파서 + 메모리 폴백, `load/save`가 절대 throw하지 않음)을 그대로 따른다.

```ts
// src/web/minigame/cleat-drop/cleatDropProgress.ts
export const CLEAT_DROP_PROGRESS_KEY = "fc26-cleat-drop-progress";
export const STAGE_COUNT = 30;

export interface CleatDropProgress {
  version: 1;
  cleared: boolean[];        // length 30, index = stage - 1
  attempts: number;          // 전체 누적 시도 횟수(성공+실패 모두 카운트)
  attemptsByStage: number[]; // length 30, 스테이지별 누적 시도 횟수
}

export function defaultProgress(): CleatDropProgress {
  return {
    version: 1,
    cleared: Array(STAGE_COUNT).fill(false),
    attempts: 0,
    attemptsByStage: Array(STAGE_COUNT).fill(0),
  };
}

export function isAllCleared(progress: CleatDropProgress): boolean {
  return progress.cleared.every(Boolean);
}

// parseProgress(raw): 버전/길이/타입이 안 맞으면 defaultProgress()로 폴백 (foreverProgress.parseProgress와 동일 원칙)
// loadProgress()/saveProgress(progress): localStorage 접근을 try/catch로 감싸고, 실패 시 메모리 캐시로 그 세션 안에서만 유지
```

- 클리어 처리: 스테이지 n 클리어 시 `cleared[n-1] = true`. 이미 클리어한 스테이지를 다시 클리어해도 `attempts`/`attemptsByStage`는 계속 누적한다(재도전 방지 목적이 아니라 순수 기록이므로).
- 실패 처리: 시도할 때마다(성공 여부와 무관하게) `attempts += 1`, `attemptsByStage[stage-1] += 1`.
- 완료 화면: `isAllCleared(progress)`가 처음 `true`가 되는 순간 "총 **{attempts}**번 만에 30 스테이지 모두 클리어!" 문구와 함께 완료 연출(효과음은 아래 "7. 오디오" 절의 S11 `cleat-drop-all-clear.mp3`) 표시. 이후에도 모달을 다시 열면 완료 화면에서 누적 시도 횟수를 계속 보여준다.

## 6. 아트 스펙 · 이미지 생성 지시서

### 6-0. 스타일 · 스레드 안내

- 생성 도구는 이미지 생성 모델(ChatGPT gpt-image 등)을 가정한다. **레포의 기존 미니게임 이미지(football-match3, soccer-sum10, goalpost 등)는 레퍼런스로 첨부하지 않는다** — 이 게임은 그것들과 다른, 독립된 톤을 새로 만든다.
- **스타일**: 원작 스팀 게임의 카드 이미지처럼 **살짝 리얼한 3D 렌더 일러스트**다. 두꺼운 만화 외곽선·셀 셰이딩 없이, 부드러운 스튜디오 조명과 매트~새틴 질감으로 그린다. 아래 모든 프롬프트에 이 문단을 그대로 반복해서 넣는다(스타일 고정용):
  ```text
  Art style: a softly realistic 3D-rendered illustration, like a clean studio product render — not a flat cartoon. Smooth matte-to-satin surface materials with subtle realistic micro-texture (fabric weave, leather grain, brushed metal, rubber), soft global illumination, gentle soft-edged shadows, warm soft key light from the upper left and a soft fill from the right, naturalistic proportions and colours. No thick outlines, no cel-shading, no flat colour fills — all shading is smooth and gradual. Colours are warm and true-to-life, not neon or oversaturated. No text, letters, numbers, logos, watermark or signature anywhere.
  ```
- **배경**: 가능하면 도구가 지원하는 **알파 투명 PNG**로 직접 받는다. 지원하지 않으면 `#FF00FF` 마젠타 플랫로 받되, 오브젝트의 부드러운 접지 그림자가 배경 가장자리까지 번지지 않고 중간에 사라지도록 프롬프트에 못박는다(그림자가 마젠타에 섞이면 나중에 키잉이 지저분해짐).
- 레퍼런스 이미지를 첨부하지 않는 대신 프롬프트의 스타일 문단을 매번 반복해 톤을 고정한다. 같은 스레드에서 이어 생성하면(↪) 직전 결과가 자연히 스타일 앵커 역할을 한다.
- 원본은 `tmp/minigame-src/cleat-drop/`에 저장(`tmp/`는 gitignore, 필요 시 `tmp/minigame-src/` 줄 추가), 변환은 기존 `scripts/convert-minigame-art.mjs`(있으면 재사용) + `scripts/minigame-art-manifest.json`에 슬롯만 추가하는 방식으로 처리한다. 신규 변환 스크립트를 만들지 않는다. 알파 배경으로 받은 파일은 크롭·리사이즈만 하면 되고, 마젠타 플랫로 받은 파일만 색상 유사도 기반으로 키잉한다(경계가 부드러우므로 하드 크로마키가 아니라 소프트 매팅).
- **스레드 구성**: 캐릭터(축구화·다리)는 스레드 C, 목표물 5시트는 스레드 D(티어끼리 톤이 이어지도록 한 스레드에서 순서대로 이어감), 배경/HUD는 스레드 E로 나눈다 — 스레드를 섞으면 스타일이 흔들리기 쉽다.

| 카드 | 저장 이름(`tmp/minigame-src/cleat-drop/`) → 최종(`public/`) | 스레드 | 캔버스 |
| --- | --- | --- | --- |
| G1 | `cleat-sheet.png` → `cleat-drop-cleat-idle/-swing-l/-swing-r/-fall/-land.webp` | 🆕 스레드 C | 1536×1024, 3×2 |
| G2 | `leg-sheet.png` → `cleat-drop-leg-idle/-swing-a/-swing-b.webp` | ↪ 스레드 C | 1024×1024, 2×2(3칸 사용) |
| G3 | `targets-tier1.png` → target-bench 등 6종 | 🆕 스레드 D | 1536×1024, 3×2 |
| G4 | `targets-tier2.png` → target-cone 등 6종 | ↪ 스레드 D | 1536×1024, 3×2 |
| G5 | `targets-tier3.png` → target-trophy-rim 등 6종 | ↪ 스레드 D | 1536×1024, 3×2 |
| G6 | `targets-tier4.png` → target-bottle-cap 등 6종 | ↪ 스레드 D | 1536×1024, 3×2 |
| G7 | `targets-tier5.png` → target-sprinkler 등 6종 | ↪ 스레드 D | 1536×1024, 3×2 |
| G8 | `env-and-ui.png` → 배경/훅/HUD 소품 | 🆕 스레드 E | 1536×1024, 3×2 |

30개 목표물을 낱개로 생성하면 30번이 필요하지만, 티어당 6종씩 한 시트에 몰아 **5장**으로 줄인다. 캐릭터 2종(축구화 5프레임 + 다리 3프레임)도 각 1장씩 총 2장, 배경/HUD 1장 — **전체 생성 8회**로 30여 개 에셋을 확보한다.

---

### G1. 축구화 상태 시트 (5프레임)

- **저장**: `tmp/minigame-src/cleat-drop/cleat-sheet.png` (1536×1024) → `public/cleat-drop-cleat-idle.webp`, `-swing-left.webp`, `-swing-right.webp`, `-falling.webp`, `-landed.webp` (각 512×512, 셀당 크롭)
- **스레드**: 🆕 새 대화 — 스레드 C 시작
- **레퍼런스**: 없음 — 첨부하지 않는다. 프롬프트 안의 스타일 문단(위 "6-0. 스타일 · 스레드 안내")으로 톤을 고정한다.
- **검수 체크**: 3열×2행 정확(아래 1행 3칸만 사용, 위 1행은 idle/left/right), 신발끈이 훅에 걸린 모습이 idle에서 명확, 5프레임 모두 같은 축구화(같은 색·같은 스터드), 두꺼운 만화 외곽선 없이 부드럽게 음영진 리얼풍인지, 배경(마젠타 또는 알파) 잔여 없음, 글자 없음

```text
Create ONE sprite sheet of a single football boot (soccer cleat) in five states, on a 1536x1024 canvas, strict grid of 3 columns x 2 rows (6 cells, each 512x512), one pose per cell, centred, at least 10% empty margin per cell, the two right cells of the bottom row left empty. Reading order:
(1) IDLE: the boot hanging by its own laces looped over a small hook above it, laces taut, boot pointing straight down, seen from the side.
(2) SWING LEFT: same hanging boot, swung to the left like a pendulum, laces still attached to the hook, a soft motion trail behind it.
(3) SWING RIGHT: same hanging boot, swung to the right, mirrored motion trail.
(4) FALLING: the boot in mid-air, laces now loose and trailing above it (just released from the hook), tumbling at a slight diagonal angle.
(5) LANDED: the boot resting flat on its sole, laces settled, a soft contact shadow beneath it that fades out quickly.
The boot itself: a bright orange leather football boot with white laces and white studs, the same design in all five cells.
Art style: a softly realistic 3D-rendered illustration, like a clean studio product render — not a flat cartoon. Smooth matte-to-satin surface materials with subtle realistic micro-texture (leather grain, stitched seams, rubber studs), soft global illumination, gentle soft-edged shadows, warm soft key light from the upper left and a soft fill from the right, naturalistic proportions and colours. No thick outlines, no cel-shading, no flat colour fills — all shading is smooth and gradual. Colours are warm and true-to-life, not neon or oversaturated. No text, letters, numbers, logos, watermark or signature anywhere.
Background: fully transparent (PNG with alpha channel) if possible; otherwise a perfectly flat solid #FF00FF magenta with no gradient, each boot's soft contact shadow fading out well before the cell edge so it never touches or blends into the magenta.
```

- [x] `cleat-sheet.png` — 재생성본 확인 완료(2026-09-27): 마젠타 헤일로 사라짐(알파 채널 실측 결과 마젠타 계열 픽셀 0%), 배경 코너까지 완전 투명(alpha 0). 격자가 완벽한 등분은 아니지만(위 3칸/아래 2칸이 대략적인 3×2 배치) 셀별 수동 크롭에는 무리 없는 수준. 통과.
- **최종 사용**: 훅 진자(idle/swing) 애니메이션 프레임, 낙하 중(falling), 목표물 착지 성공 연출(landed)

---

### G2. 축구선수 다리 시트 (3프레임)

- **저장**: `tmp/minigame-src/cleat-drop/leg-sheet.png` (1024×1024) → `public/cleat-drop-leg-idle.webp`, `-swing-a.webp`, `-swing-b.webp` (각 512×512)
- **스레드**: ↪ 스레드 C에서 이어서(G1 직후)
- **레퍼런스**: 첨부 불필요 — 같은 스레드의 G1 결과가 자연히 스타일 앵커가 된다.
- **검수 체크**: 2열×2행 중 위 2칸만 사용(idle, swing-a), 아래 왼쪽 1칸만 사용(swing-b), 나머지 1칸 빈 배경. 엉덩이 관절 축 위치가 세 프레임에서 동일(합성 시 회전 중심으로 씀), 반바지·양말·정강이보호대까지 그려진 무릎 위~발끝 다리 하나, 신발은 G1과 다른 디자인(민트색 신발)으로 구분, G1과 같은 리얼풍 질감·조명

```text
Using the cleat sprite sheet made earlier in this thread as the style anchor (match its rendering exactly), create ONE sprite sheet of a single football player's leg (from mid-thigh down to the boot) acting like a pinball flipper, on a 1024x1024 canvas, strict grid of 2 columns x 2 rows, only three cells used (top-left, top-right, bottom-left; bottom-right stays empty), one pose per cell, centred, at least 10% empty margin, the hip-joint pivot point at the same relative position (top area of the cell) in all three poses so the frames can be rotated around it.
Top-left IDLE: the leg hanging down relaxed, knee slightly bent, wearing a mint-green sock, a dark shin guard visible under the sock, and a mint-green football boot, resting pose, waiting to swing.
Top-right SWING A: the leg swung forward and up mid-motion, knee extended, a soft motion trail behind the boot.
Bottom-left SWING B: the leg at the peak of the swing, fully extended forward and slightly upward, strongest motion trail, as if it just made contact with something.
Art style: a softly realistic 3D-rendered illustration, like a clean studio product render — not a flat cartoon. Smooth matte-to-satin surface materials with subtle realistic micro-texture (fabric weave on the sock, leather grain on the boot), soft global illumination, gentle soft-edged shadows, warm soft key light from the upper left and a soft fill from the right, naturalistic proportions and colours. No thick outlines, no cel-shading, no flat colour fills — all shading is smooth and gradual. Colours are warm and true-to-life, not neon or oversaturated. No text, letters, numbers, logos, watermark or signature anywhere.
Background: fully transparent (PNG with alpha channel) if possible; otherwise a perfectly flat solid #FF00FF magenta with no gradient, soft shadows fading out well before the cell edge.
```

- [x] `leg-sheet.png`
- **최종 사용**: 대기(idle)·스윙(swing-a→swing-b 보간 또는 2프레임 애니메이션) 플리퍼 렌더

---

### G3~G7. 목표물 5시트 (티어당 6종)

- **저장**: `tmp/minigame-src/cleat-drop/targets-tier{1..5}.png` (각 1536×1024) → 티어별 6개 webp (각 512×512, 위 "4. 스테이지 데이터" 표의 `에셋 키` 그대로 파일명에 사용, 예: `public/cleat-drop-target-bench.webp`)
- **스레드**: G3는 🆕 새 대화(스레드 D 시작), G4~G7은 ↪ 이어서(같은 스레드 D, 직전 시트 결과가 다음 시트의 스타일 앵커가 됨)
- **레퍼런스**: 없음 — 첨부하지 않는다. G3는 프롬프트의 스타일 문단으로 톤을 고정하고, G4~G7은 같은 스레드 D의 직전 티어 시트가 자연히 스타일 앵커가 된다(재첨부 불필요).
- **검수 체크**(공통): 3열×2행 정확, 셀당 목표물 1개, 목표물이 "위에 무언가 얹혀서 3초간 버텨야 하는" 물건으로 읽히는가(윗면/테두리가 시각적으로 구분됨), 같은 시트 안 6개의 크기감이 자연스러운가, 두꺼운 외곽선·셀 셰이딩 없이 부드러운 리얼풍인지, 배경(마젠타 또는 알파)·글자·로고 잔여 없음
- 아래 5개 프롬프트는 각각 스타일·배경 지시를 전부 포함한 완전한 프롬프트다(따로 덧붙일 문단 없음, 그대로 복사해서 쓴다).

**G3 · 티어 1 (넓고 평평)**

```text
Create ONE sprite sheet of six wide, flat football-related landing objects, on a 1536x1024 canvas, strict grid of 3 columns x 2 rows, one object per cell, seen from a slight 3/4 angle so its flat top surface reads clearly, centred, at least 10% empty margin per cell. Reading order:
(1) a wooden coach's bench seat, dark green, seen from the side with the flat seat top facing up;
(2) a round team kit bag lying on its side, navy with a mint stripe, its rounded top forming a wide flat-ish resting spot;
(3) a wheeled water bottle carrier crate, mint green plastic, flat open top with round bottle-holder holes visible;
(4) a large white coach's clipboard lying flat, a football play diagram sketched on it in thin mint lines (no readable text);
(5) a rolled-up fan banner bundle tied with a ribbon, red and white striped cloth, lying on its side;
(6) a rectangular goalkeeper training mat, blue foam with a white cross pattern, lying flat on the ground.
Each object clearly has one obvious flat-ish top area meant for something small to land and rest on.
Art style: a softly realistic 3D-rendered illustration, like a clean studio product render — not a flat cartoon. Smooth matte-to-satin surface materials with subtle realistic micro-texture, soft global illumination, gentle soft-edged shadows, warm soft key light from the upper left and a soft fill from the right, naturalistic proportions and colours. No thick outlines, no cel-shading, no flat colour fills — all shading is smooth and gradual. Colours are warm and true-to-life, not neon or oversaturated. No text, letters, numbers, logos, watermark or signature anywhere.
Background: fully transparent (PNG with alpha channel) if possible; otherwise a perfectly flat solid #FF00FF magenta with no gradient, each object's soft contact shadow fading out well before the cell edge.
```

- [x] `targets-tier1.png`

**G4 · 티어 2 (약간 좁거나 기울어짐)**

```text
Using the tier-1 sheet made earlier in this thread as the style anchor (match its rendering exactly), create ONE sprite sheet of six narrower or tilted football-related landing objects, on a 1536x1024 canvas, strict grid of 3 columns x 2 rows, one object per cell, centred, at least 10% empty margin per cell. Reading order:
(1) an orange traffic-cone-style football training cone, its flat truncated top facing slightly up and to the side;
(2) a corner-flag base, a weighted round rubber disc with a short pole stub, the flat disc top facing up;
(3) a round plastic basin (icing tub) tilted at a slight angle, white with a blue rim;
(4) a folding fan chair, seen from behind so its narrow top backrest bar faces the viewer, red and white;
(5) a round team-logo-less cushion (plain mint circle with piping trim) propped at a slight tilt against something implied off-frame;
(6) a football field line-marker (line-painting trolley) seen from the side, its narrow top handle bar facing up.
Each object has a visibly narrower or tilted resting surface than a flat bench.
Art style: a softly realistic 3D-rendered illustration, like a clean studio product render — not a flat cartoon. Smooth matte-to-satin surface materials with subtle realistic micro-texture, soft global illumination, gentle soft-edged shadows, warm soft key light from the upper left and a soft fill from the right, naturalistic proportions and colours. No thick outlines, no cel-shading, no flat colour fills — all shading is smooth and gradual. Colours are warm and true-to-life, not neon or oversaturated. No text, letters, numbers, logos, watermark or signature anywhere.
Background: fully transparent (PNG with alpha channel) if possible; otherwise a perfectly flat solid #FF00FF magenta with no gradient, each object's soft contact shadow fading out well before the cell edge.
```

- [x] `targets-tier2.png`

**G5 · 티어 3 (곡면·좁음)**

```text
Using the tier-2 sheet made earlier in this thread as the style anchor (match its rendering exactly), create ONE sprite sheet of six curved or narrow football trophy/goal-related objects, on a 1536x1024 canvas, strict grid of 3 columns x 2 rows, one object per cell, centred, at least 10% empty margin per cell. Reading order:
(1) a gold trophy cup, its wide circular rim facing the viewer, seen slightly from above so the rim reads as a landing ring;
(2) a white goalpost crossbar segment, a horizontal white cylindrical bar, seen from a low angle so its round top is visible;
(3) the top of a yellow corner-kick flag pole, a short curved cap at the very top with the flag flapping below it;
(4) the round metal rim of a wheeled ball cart full of footballs, seen from above at an angle;
(5) a small gold whistle hanging from a hook by its black lanyard, the whistle's rounded top facing up;
(6) the top corner of a chunky portable scoreboard, its beveled corner edge facing the viewer.
Each surface is visibly curved or narrow, harder to balance something on than the tier-2 set.
Art style: a softly realistic 3D-rendered illustration, like a clean studio product render — not a flat cartoon. Smooth matte-to-satin surface materials with subtle realistic micro-texture, soft global illumination, gentle soft-edged shadows, warm soft key light from the upper left and a soft fill from the right, naturalistic proportions and colours. No thick outlines, no cel-shading, no flat colour fills — all shading is smooth and gradual. Colours are warm and true-to-life, not neon or oversaturated. No text, letters, numbers, logos, watermark or signature anywhere.
Background: fully transparent (PNG with alpha channel) if possible; otherwise a perfectly flat solid #FF00FF magenta with no gradient, each object's soft contact shadow fading out well before the cell edge.
```

- [x] `targets-tier3.png` — 3차 재생성본 확인 완료(2026-09-27): 셀 6 LED 화면이 무작위로 흩어진 점 몇 개만 켜진 모습으로 바뀌어 숫자·글자 실루엣이 전혀 읽히지 않음, 통과. 나머지 5칸(트로피/크로스바+네트/코너깃발/볼카트/호루라기)도 이상 없음. 배경 코너 3곳 alpha 0으로 투명 확인.

**G6 · 티어 4 (작고 불안정)**

```text
Using the tier-3 sheet made earlier in this thread as the style anchor (match its rendering exactly), create ONE sprite sheet of six small, delicate football-related objects, on a 1536x1024 canvas, strict grid of 3 columns x 2 rows, one object per cell, centred, at least 10% empty margin per cell, each object noticeably smaller and more delicate-looking than the tier-3 set. Reading order:
(1) a small white sports-bottle cap, ridged plastic, round top facing up;
(2) the back of a blue goalkeeper glove lying palm-down, its slightly domed knuckle padding facing up;
(3) a small elastic captain's armband hanging from a thin wall hook, the armband's folded top edge facing up;
(4) a slim referee card wallet (holding a yellow and a red card) standing propped at a slight angle;
(5) a small loop of spare bootlace resting on top of another boot's toe, the loop itself the landing spot;
(6) the mouth opening of a small plastic fan megaphone lying on its side, the rim of the opening facing the viewer.
Art style: a softly realistic 3D-rendered illustration, like a clean studio product render — not a flat cartoon. Smooth matte-to-satin surface materials with subtle realistic micro-texture, soft global illumination, gentle soft-edged shadows, warm soft key light from the upper left and a soft fill from the right, naturalistic proportions and colours. No thick outlines, no cel-shading, no flat colour fills — all shading is smooth and gradual. Colours are warm and true-to-life, not neon or oversaturated. No text, letters, numbers, logos, watermark or signature anywhere.
Background: fully transparent (PNG with alpha channel) if possible; otherwise a perfectly flat solid #FF00FF magenta with no gradient, each object's soft contact shadow fading out well before the cell edge.
```

- [x] `targets-tier4.png`

**G7 · 티어 5 (매우 좁고 움직이거나 경사짐)**

```text
Using the tier-4 sheet made earlier in this thread as the style anchor (match its rendering exactly), create ONE sprite sheet of six tiny, unstable-looking football/stadium objects implying motion, on a 1536x1024 canvas, strict grid of 3 columns x 2 rows, one object per cell, centred, at least 10% empty margin per cell, each the smallest and most precarious of the whole set. Reading order:
(1) a small lawn sprinkler head on the pitch, a rotating nozzle on top, tiny motion arc lines around it to imply spinning;
(2) a round fan balloon on a stick, swaying, thin motion-blur curve on one side to imply swinging;
(3) the tilted top corner of a large stadium scoreboard screen, drawn at a visible diagonal angle;
(4) the top of a small toy-like camera drone hovering just above the pitch, tiny motion lines beneath its rotors to imply hovering;
(5) the top rope of a football goal net, sagging slightly, a couple of small wave-curve lines to imply it swaying;
(6) the very tip of a champion's flagpole with a small pennant flag flapping hard sideways in wind, strong motion lines on the flag.
Art style: a softly realistic 3D-rendered illustration, like a clean studio product render — not a flat cartoon. Smooth matte-to-satin surface materials with subtle realistic micro-texture, soft global illumination, gentle soft-edged shadows, warm soft key light from the upper left and a soft fill from the right, naturalistic proportions and colours. No thick outlines, no cel-shading, no flat colour fills — all shading is smooth and gradual. Colours are warm and true-to-life, not neon or oversaturated. No text, letters, numbers, logos, watermark or signature anywhere.
Background: fully transparent (PNG with alpha channel) if possible; otherwise a perfectly flat solid #FF00FF magenta with no gradient, each object's soft contact shadow fading out well before the cell edge.
```

- [x] `targets-tier5.png`

---

### G8. 배경 · 훅 · HUD 소품

- **저장**: `tmp/minigame-src/cleat-drop/env-and-ui.png` (1536×1024) → `public/cleat-drop-bg.webp`(배경, 불투명), `cleat-drop-hook.webp`, `cleat-drop-icon.webp`, `cleat-drop-timer-ring.webp`, `cleat-drop-stage-dot-empty.webp`, `cleat-drop-stage-dot-filled.webp` (각 512×512, 배경 제외 투명)
- **스레드**: 🆕 새 대화 — 스레드 E
- **레퍼런스**: 없음 — 첨부하지 않는다. 프롬프트 안의 스타일 문단(위 "6-0. 스타일 · 스레드 안내")으로 톤을 고정한다.
- **검수 체크**: 배경(셀 1)만 불투명 전체 그림이고 나머지 5칸은 배경(마젠타/알파)의 소품, 메뉴 아이콘(셀 3)이 24×24에서도 읽히는가, 도트 인디케이터 두 상태가 명확히 구분되는가, 두꺼운 외곽선·셀 셰이딩 없이 부드러운 리얼풍인지

```text
Create ONE sheet with a background and five small UI props, on a 1536x1024 canvas, strict grid of 3 columns x 2 rows, at least 10% margin per cell except cell 1.
Cell 1 (fully opaque, no transparency): a wide stadium sideline background, blurred grandstand and floodlights in the distance, a strip of pitch grass with faint white lines in the foreground, calm and low-contrast in the centre so gameplay objects stand out, warm daylight.
Cell 2: a simple curved metal hook mounted on a short wooden post, side view, meant for a boot's laces to hang from.
Cell 3: a menu icon — a single orange football boot mid-swing with a small motion trail, bold simple shapes readable at 24x24 pixels.
Cell 4: a circular progress-ring frame (thick mint green ring, mostly empty/unfilled), meant to fill up over 3 seconds.
Cell 5: a small empty stage-progress dot, a plain grey circle outline.
Cell 6: the same dot filled solid gold, meant to mark a cleared stage.
Art style: a softly realistic 3D-rendered illustration, like a clean studio product render — not a flat cartoon (cell 1 is a softly painted realistic scene, cells 2-6 are small realistic-rendered props). Smooth matte-to-satin surface materials with subtle realistic micro-texture, soft global illumination, gentle soft-edged shadows, warm soft key light from the upper left and a soft fill from the right, naturalistic proportions and colours. No thick outlines, no cel-shading, no flat colour fills — all shading is smooth and gradual. Colours are warm and true-to-life, not neon or oversaturated. No text, letters, numbers, logos, watermark or signature anywhere.
Cells 2-6 background: fully transparent (PNG with alpha channel) if possible; otherwise a perfectly flat solid #FF00FF magenta with no gradient, soft shadows fading out well before the cell edge.
```

- [x] `env-and-ui.png`

## 7. 오디오 — BGM · 효과음

형식은 [docs/forever/06-audio.md](forever/06-audio.md)와 같다. **파일이 없으면 무음(또는 재사용 폴백)으로 재생**되므로 파일 확보는 구현과 독립적으로 진행해도 된다.

| 항목 | 규칙 |
| --- | --- |
| 형식 | `mp3`(44.1kHz). BGM 128kbps 이하 스테레오, SFX 96~128kbps |
| SFX 저장 위치 | `public/sfxes/cleat-drop-<이름>.mp3` |
| BGM 저장 위치 | `public/cleat-drop-bgm.mp3` |
| BGM 길이 | 끊김 없는 60~120초 무보컬 루프, ≤2.5MB |
| SFX 길이 | 대부분 0.1~1.2초, 팡파르류 1.5~3초 |
| **예약 파일** | **`victory.mp3`(및 `pitch-victory*`) 계열은 다른 기능 전용이라 재사용 후보에 절대 넣지 않는다** |
| 저작권 | 상용 게임 음원·대사를 쓰지 않는다. 검색어에 특정 상용 게임명을 넣지 않는다 |
| 추천 사이트 | Pixabay, Mixkit, freesound.org(CC0/CC-BY 확인), OpenGameArt, Kenney(CC0) |

### 7-1. BGM (1곡)

| 파일명 | 용도 | 무드/템포 | 한글 검색 키워드 | 영어 검색 키워드 |
| --- | --- | --- | --- | --- |
| `cleat-drop-bgm.mp3` | 게임 진행 중 루프 | 경쾌하고 살짝 긴장감 있는 아케이드 퍼즐 BGM, 빠른 중간 템포 | `아케이드 퍼즐 게임 BGM 루프`, `경쾌한 캐주얼 게임 음악` | `arcade puzzle game music loop`, `upbeat casual mobile game bgm` |

### 7-2. 효과음

| # | 파일명 | 용도 | 길이 | 한글 검색 키워드 | 영어 검색 키워드 | 재사용 폴백 |
| --- | --- | --- | --- | --- | --- | --- |
| S1 | `cleat-drop-lace-release.mp3` | 신발끈이 풀리며 낙하 시작 | 0.3s | `끈 풀리는 소리`, `옷감 스치는 짧은 소리` | `shoelace unravel quick`, `fabric whoosh short` | `pitch-ui-click` |
| S2 | `cleat-drop-leg-swing.mp3` | 다리 스윙 시작(바람 가르는 소리) | 0.3s | `휙 스윙 소리`, `발차기 준비 바람소리` | `quick swing whoosh`, `swing fast air` | `pitch-ui-select` |
| S3 | `cleat-drop-kick-impact.mp3` | 다리가 축구화를 타격 | 0.25s | `발로 차는 소리`, `축구공 임팩트 소리` | `kick impact thud`, `soccer ball kick hit` | `pitch-power-charge` |
| S4 | `cleat-drop-miss-ground.mp3` | 타이밍 실패, 바닥에 떨어짐 | 0.4s | `물체 떨어지는 소리`, `둔탁하게 떨어짐` | `object drop thud`, `soft fall bump` | `pitch-net-hit` |
| S5 | `cleat-drop-bounce-soft.mp3` | 부드러운 재질 목표물 바운스(천/매트) | 0.3s | `푹신하게 튀는 소리`, `쿠션 바운스` | `soft cushion bounce`, `foam bounce thud` | `pitch-ball-touch` |
| S6 | `cleat-drop-bounce-hard.mp3` | 단단한 재질 목표물 바운스(금속/플라스틱) | 0.3s | `딱딱하게 튀는 소리`, `플라스틱 통통 튀는 소리` | `hard plastic bounce`, `metal object bounce` | `pitch-ball-touch` |
| S7 | `cleat-drop-land-settle.mp3` | 목표물 위에 정확히 안착(판정 타이머 시작) | 0.3s | `살짝 안착하는 소리`, `사뿐히 내려앉음` | `soft landing settle`, `gentle land thump` | `pitch-style-gain` |
| S8 | `cleat-drop-timer-tick.mp3` | 3초 유지 게이지 진행 중 반복 틱(낮은 볼륨) | 0.1s | `타이머 틱 소리`, `카운트다운 짧은 틱` | `timer tick short`, `countdown blip quiet` | (없음, 무음) |
| S9 | `cleat-drop-slip-off.mp3` | 3초 채우기 전에 미끄러져 떨어짐(실패) | 0.35s | `미끄러지는 소리`, `주르륵 미끄러짐` | `slip slide fail`, `sliding off surface` | `pitch-ui-back` |
| S10 | `cleat-drop-stage-clear.mp3` | 스테이지 클리어(짧은 팡파르) | 1.2s | `스테이지 클리어 팡파르`, `짧은 성공 징글` | `stage clear fanfare short`, `level complete jingle` | `pitch-style-tier` |
| S11 | `cleat-drop-all-clear.mp3` | 30 스테이지 전체 클리어(긴 축하 팡파르) | 2.5s | `게임 올클리어 팡파르`, `엔딩 축하 음악 짧게` | `game complete fanfare long`, `all stages cleared celebration` | `pitch-style-tier` |
| S12 | `cleat-drop-ui-click.mp3` | 메뉴/버튼 클릭 | 0.15s | `버튼 클릭 소리`, `UI 클릭 짧게` | `ui button click short`, `menu select blip` | `pitch-ui-click` |

### 7-3. 코드 연결 규칙 (구현 세션)

- `CleatDropSfxId`에 `lace-release | leg-swing | kick-impact | miss-ground | bounce-soft | bounce-hard | land-settle | timer-tick | slip-off | stage-clear | all-clear | ui-click` 추가(파일 `cleat-drop-<이름>.mp3` ↔ id `<이름>`, 기존 sfxMap의 "파일명에서 접두사·`.mp3` 제거" 규칙과 동일).
- `timer-tick`은 반복 재생이라 게인을 낮게(`0.3` 내외) 잡는다.
- **`victory` 계열 파일은 후보에 절대 넣지 않는다** — 다른 기능 전용 예약 파일이다.

## 8. 진행 체크리스트

세션별로 그대로 붙여넣을 지시 프롬프트는 [minigame-cleat-drop-session-prompts.md](minigame-cleat-drop-session-prompts.md)에 있다.

- [x] 세션 0 — 문서 작성(이 문서, 2026-09-27)
- [x] 세션 1 — 이미지 생성 (G1~G8 모두 저장·검수 완료, 2026-09-27 — 위 "6. 아트 스펙"의 카드별 메모 참고)
- [x] 세션 2 — 엔진 골격("3-1. 파일", "3-2. 엔진 테스트 항목") + 유닛 테스트, 플레이스홀더 아트로 스테이지 30개 순회 가능하게(2026-09-27 — `cleatDropStages.ts`·`cleatDropEngine.ts`·`cleatDropEngine.test.ts` 구현 완료, `pnpm test`/`pnpm typecheck` 통과. 아래 "3. 구현 설계" 갱신 내용 참고)
- [x] 세션 3 — 아트 통합(변환, `cleatDropAssets.ts`) + 캔버스 렌더(2026-09-27 — `scripts/minigame-art-manifest.json`에 슬롯 추가 후 `pnpm convert:minigame-art -- cleat-drop`으로 43개 에셋 변환, `cleatDropAssets.ts`·`CleatDropCanvas.tsx`·`cleat-drop.css` 구현. `pnpm test`/`pnpm typecheck` 통과. 위 "3-2c. 세션 3 구현 메모" 참고)
- [x] 세션 4 — 오디오 연결("7. 오디오"), 저장 스펙 연동("5. 저장 스펙"), 완료 화면(누적 시도 횟수 표시)(2026-09-27 — `cleatDropProgress.ts`·`cleatDropSfxMap.ts`·`useCleatDropSfx.ts`·`useCleatDropMusic.ts`·`useCleatDropGame.ts` 구현, 완료 화면은 `CleatDropCanvas.tsx`의 캔버스 오버레이로 처리. `pnpm test`/`pnpm typecheck` 통과. 오디오 파일 12+1개는 전부 미확보 — 위 "3-2d. 세션 4 구현 메모" 참고. 위 "3. 구현 설계" 갱신 내용 참고)
- [x] 세션 5 — `MinigameMenu.tsx`/`App.tsx` 등록("3-3. 등록 체크리스트"), 마감(2026-09-27 — 메뉴 라벨을 "축구화 던지기"로 확정하고 문서 전체에 반영, `CleatDropModal.tsx` 신규 작성 후 4곳 모두 등록, `pnpm test`/`pnpm typecheck` 통과. 아래 "3-2e. 세션 5 구현 메모"와 "4. 스테이지 데이터" 절 끝의 메모 참고. 실측 난이도 조정은 배포 후 플레이테스트로 후속 세션에서 진행)
