# 골키퍼 벽돌깨기 — 미니게임 기획 · 에셋 · 이미지 프롬프트

골키퍼 장갑 패들로 축구공을 받아 쳐서 광고판 벽돌을 깨는 브레이크아웃형 게임이다.
이 문서 하나만 읽고 다른 세션에서 구현·이미지 생성을 끝낼 수 있도록 자기완결로 쓴다. 다른 미니게임 문서: [minigame-grass-merge.md](minigame-grass-merge.md), [minigame-football-match3.md](minigame-football-match3.md). 서식 선례: [soccer-sum10-minigame-assets.md](soccer-sum10-minigame-assets.md).

**상태**: 기획 완료 · 구현 전 (2026-09-21). **범위**: 대시보드 왼쪽 아래 `미니게임` 메뉴만. 월드 오락실·랭크·미션 연동은 후속 작업이다.

## 0. 한눈에 보기

| 항목 | 내용 |
| --- | --- |
| 게임 id / 메뉴 라벨 | `keeper-breakout` / `골키퍼 벽돌깨기` |
| 장르 | 브레이크아웃(벽돌깨기). 기존 5종과 겹치지 않음. 키업스(공 튀기기)와는 "패들 + 벽돌 + 스테이지" 구조가 다르다 |
| 조작 | 마우스 X로 패들 이동, 클릭 또는 Space로 발사, ←/→ 키로도 이동. 데스크톱 전용 |
| 진행 | 목숨 3개, 스테이지 5개, 전부 깨면 클리어 |
| 점수 | 벽돌 종류별 10/20/30/50/15점 + 스테이지 클리어 보너스 `100 × 남은 목숨` |
| 저장 | 최고 점수 `fc26-keeper-breakout-highscore` (localStorage) |
| 온라인 순위 | [minigame-ranking.md](minigame-ranking.md)의 공용 시스템에 연결. `SCORE_GAMES["keeper-breakout"]`는 이미 등록돼 있고(`max`는 임시값 1,000,000), 모달에 `useRanking` + `RankingPanel`을 붙인다 (3-5). 이 게임은 점수 이론 상한을 **계산할 수 있어서** `max`를 정확히 잡는다 |
| 구현 방식 | 순수 엔진(원-사각 충돌, 시드 RNG, 스테이지 데이터 배열) + Canvas 2D. 새 의존성 없음 |
| 에셋 | 이미지 5장 생성(스레드 2개) + **기존 `public/soccer_ball.webp` 재사용**, 오디오 8개. 에셋이 없어도 CSS/Canvas 폴백으로 동작 |
| 이미지 스타일 | 광택 카툰 스티커 (두꺼운 검정 외곽선). 월드의 픽셀아트가 **아님** |

## 1. 규칙 · 조작 · 화면

### 1-1. 규칙

1. 시작하면 공이 패들 위에 붙어 있다. 클릭/Space로 발사한다 (위쪽 ±15° 무작위 각도).
2. 공이 패들에 맞는 위치로 반사각이 정해진다: 패들 중앙 = 수직, 양 끝 = 수직에서 ±60°.
3. 공이 바닥 아래로 빠지면 목숨 −1, 새 공이 패들에 붙는다. 목숨 0이면 종료.
4. 파괴 가능한 벽돌을 모두 없애면 스테이지 클리어 (강철 벽돌은 세지 않는다).
5. 공 속도는 스테이지 시작 340 px/s, 스테이지마다 +6% (최대 520 px/s). 공이 너무 수평으로 날지 않게 `|vy| ≥ 0.3 × 속력`을 유지한다.

### 1-2. 벽돌 6종 (광고판 벽돌)

| id | 이름 | 체력 | 점수 | 효과 | 스테이지 문자 |
| --- | --- | --- | --- | --- | --- |
| `hp1` | 민트 광고판 | 1 | 10 | — | `1` |
| `hp2` | 파랑 광고판 | 2 | 20 | 한 대 맞으면 `hp1` 그림으로 바뀜 | `2` |
| `hp3` | 주황 광고판 | 3 | 30 | 맞을 때마다 `hp2`→`hp1` 그림으로 바뀜 | `3` |
| `gold` | 금 광고판 | 1 | 50 | 파워업을 반드시 떨어뜨림 | `G` |
| `steel` | 강철 판 | ∞ | 0 | 깨지지 않음 (반사만) | `S` |
| `burst` | 신호탄 벽돌 | 1 | 15 | 부서질 때 이웃 8칸의 파괴 가능 벽돌에 1 피해 | `B` |

체력별 색이 그대로 체력 표시다 (금이 간 모양 그림은 만들지 않는다).

### 1-3. 파워업 4종 (벽돌이 부서질 때 8% 확률, `gold`는 100%)

| id | 이름 | 효과 | 지속 |
| --- | --- | --- | --- |
| `wide` | 장갑 확대 | 패들 폭 112 → 168 | 12초 |
| `multi` | 멀티볼 | 현재 공 하나에서 ±20°로 두 개 추가 | 즉시 |
| `slow` | 슬로우 | 공 속력 ×0.7 | 8초 |
| `shield` | 그물 보호막 | 바닥에 그물선이 생겨 공이 한 번 튕겨 올라감 | 한 번 쓰면 사라짐 |

파워업은 140 px/s로 떨어지고 패들에 닿으면 획득한다. 놓치면 사라진다 (페널티 없음).

### 1-4. 스테이지 데이터 (문자 10열, 위→아래, `.` 은 빈칸)

`STAGES: string[][]` 로 `keeperBreakoutStages.ts`에 둔다. 아래 5개를 시작 데이터로 쓴다.

```text
스테이지 1 (기본)     스테이지 2 (지그재그)   스테이지 3 (기둥)
1111111111           1.1.1.1.1.              S.11GG11.S
1111111111           .2.2.2.2.2              S.22..22.S
2222222222           1.1.1.1.1.              S.33..33.S
2222222222           .2.2.2.2.2              S.22GG22.S
                     3333333333              S.11..11.S

스테이지 4 (다이아)   스테이지 5 (전체 벽)
....11....           3333333333
...2BB2...           2S2S2S2S2S
..22GG22..           1B1B1B1B1B
.33333333.           G22222222G
..22BB22..           1111111111
...2222...           S.S.S.S.S.
```

### 1-5. 화면 구성 (모달 `wide`, 기존 `Modal` 셸 재사용)

- 헤더: `eyebrow "MINIGAME"` + 제목 `골키퍼 벽돌깨기` + 한 줄 설명.
- **온라인 순위 패널이 모달 오른쪽 280px을 차지한다** (`MinigameStage`가 왼쪽 게임 / 오른쪽 `RankingPanel`로 나눔, 1000px 이하에서는 게임 아래로 쌓임). 게임 영역(왼쪽)은 `wide` 모달 기준 약 796px이므로 아래 캔버스와 HUD는 모두 이 안에 들어간다.
- HUD 뱃지(사과게임의 `.soccer-sum10-badge`와 같은 pill): 스테이지 · 점수 · 최고 · 목숨(공 아이콘 ×N).
- 가운데: 논리 640×480 캔버스, `aspect-ratio: 4 / 3`, 폭 최대 760px. 아래쪽 y=440에 패들.
- 벽돌 격자: 10열, 셀 60×24 (그림 56×20 + 간격 4), 위 여백 60, 좌우 여백 20.
- 사운드: 기존 `SoundControl` 재사용.
- 시작/결과 패널: 사과게임의 시작 패널·결과 패널 패턴 (금색 pill 버튼).

## 2. 레퍼런스

**코드는 복사하지 않는다.** 동작 방식만 참고해 자체 구현한다.

| 이름 | URL | 라이선스 | 참고할 것 | 쓰지 않을 것 |
| --- | --- | --- | --- | --- |
| collidingScopes/manual-brick-breaker (JS + canvas) | https://github.com/collidingScopes/manual-brick-breaker | MIT (검색 결과 표기, 착수 시 LICENSE 재확인) | 캔버스 루프, 벽돌 배열 처리 | 손 추적(mediapipe) 입력 |
| suketubhavsar/BrickBreaker (HTML5 + CSS + TypeScript) | https://github.com/suketubhavsar/BrickBreaker | 미확인 | TS로 게임 클래스를 나눈 구조 | 코드 |
| staringelf/Breakout (vanilla JS + Canvas) | https://github.com/staringelf/Breakout | 미확인 | 패들 반사각 계산 | 코드 |
| MDN "2D breakout game using pure JavaScript" 튜토리얼 | https://developer.mozilla.org/en-US/docs/Games/Tutorials/2D_Breakout_game_pure_JavaScript | 예제 코드 라이선스는 착수 시 페이지 하단에서 확인 | 충돌·점수·목숨 단계별 설명 | 코드 |

- 브레이크아웃 규칙 자체는 장르 관행이라 자유롭게 쓸 수 있다. 특정 게임(Arkanoid 등)의 벽돌 배치·이미지·이름은 쓰지 않는다.
- 충돌은 "원 대 사각형(AABB)에서 관통 깊이가 얕은 축으로 반사"가 가장 단순하다. 프레임당 이동거리를 공 반지름 이하로 쪼개(서브스텝) 벽돌 사이를 뚫고 지나가지 않게 한다.

## 3. 구현 설계

### 3-1. 파일 (사과게임 폴더 구조를 그대로 따른다)

| 파일 | 역할 |
| --- | --- |
| `src/web/minigame/keeper-breakout/keeperBreakoutEngine.ts` | 순수 엔진. `createGame(seed)`, `setPaddleTarget(state, x)`, `launch(state)`, `step(state, dt)`. `Date`·`Math.random` 금지 |
| `src/web/minigame/keeper-breakout/keeperBreakoutStages.ts` | 1-4의 스테이지 문자 배열과 파서 (`parseStage`) |
| `src/web/minigame/keeper-breakout/keeperBreakoutEngine.test.ts` | 엔진 테스트 (3-3) |
| `src/web/minigame/keeper-breakout/KeeperBreakoutCanvas.tsx` | 캔버스 렌더 + 포인터/키보드 입력 + rAF 루프 (고정 스텝 누적기) |
| `src/web/minigame/keeper-breakout/useKeeperBreakoutGame.ts` | React 상태 (phase, 점수, 최고 점수, 종료 결과 1회 보고) |
| `src/web/minigame/keeper-breakout/useKeeperBreakoutSfx.ts` · `useKeeperBreakoutMusic.ts` | `useSoccerSum10Sfx/Music` 복제 후 키 이름 교체 |
| `src/web/minigame/keeper-breakout/KeeperBreakoutModal.tsx` | 모달 셸. `onClose`, 선택적 `onRoundEnd?(result)` |
| `src/web/minigame/keeper-breakout/keeper-breakout.css` | 접두사 `.keeper-breakout-*`, 폴백 색 필수 |
| `src/web/minigame/keeper-breakout/keeperBreakoutAssets.ts` | 이미지 URL 상수와 `Image` 로더 (실패 시 `undefined` → 폴백 렌더) |

### 3-2. 엔진 상태와 상수 (시작값)

```ts
// 엔진이 들고 있는 상태 (직렬화 가능한 순수 데이터)
interface KeeperBreakoutState {
  phase: "ready" | "playing" | "stageclear" | "over" | "cleared";
  stage: number;                 // 0-based
  lives: number;
  score: number;
  paddle: { x: number; w: number; targetX: number };
  balls: { x: number; y: number; vx: number; vy: number; stuck: boolean }[];
  bricks: { col: number; row: number; type: BrickType; hp: number }[];
  drops: { x: number; y: number; kind: PowerUpKind }[];
  effects: { wideUntil: number; slowUntil: number; shield: boolean };
  time: number;                  // 누적 시뮬레이션 시간(초) — 지속 효과 만료 계산용
  rngState: number;
}
```

| 상수 | 값 |
| --- | --- |
| 논리 크기 | 640×480, 패들 y=440, 패들 높이 28 |
| 패들 폭 | 112 (확대 168) |
| 공 반지름 | 8 |
| 고정 스텝 / 서브스텝 | 1/60초, 서브스텝 3 |
| 키보드 이동 속도 | 420 px/s |
| 그물 보호막 y | 470 |

### 3-3. 엔진 테스트 항목

1. 같은 시드 + 같은 입력이면 결과가 같다 (결정성).
2. 공이 벽·천장에서 반사되고, 패들 중앙은 수직·끝은 ±60°로 반사된다.
3. `|vy| ≥ 0.3 × 속력` 하한이 지켜진다.
4. `hp3`는 세 번 맞아야 사라지고 맞을 때마다 표시 체력이 줄어든다. `steel`은 반사만 하고 남는다.
5. `burst`가 부서지면 이웃 8칸의 파괴 가능한 벽돌이 1 피해를 받고, `steel`은 영향이 없다.
6. `gold`는 항상 파워업을 떨어뜨리고, 다른 벽돌은 시드 표본 1000개에서 약 8%다.
7. `wide` 12초 뒤 폭이 복구되고 `slow` 8초 뒤 속도가 복구된다. `multi`는 공 3개가 된다. `shield`는 한 번만 공을 구한다.
8. 공을 놓치면 목숨 −1 · 공이 패들에 붙음, 0이 되면 `over`. 파괴 가능한 벽돌이 0이면 `stageclear`, 마지막 스테이지면 `cleared`.
9. 빠른 공이 벽돌 사이 틈으로 뚫고 지나가지 않는다 (속도 520, 서브스텝 검증).

### 3-4. 등록 4곳 체크리스트 (반드시 4곳 모두)

| 파일 | 위치 | 할 일 |
| --- | --- | --- |
| `src/web/minigame/MinigameMenu.tsx` | 8행 `MinigameId` | `"keeper-breakout"` 추가 |
| 〃 | 75~94행 `games` 배열 | `{ id: "keeper-breakout", label: "골키퍼 벽돌깨기", icon: <img src="/keeper-breakout-icon.webp" alt="" className="minigame-menu__icon" /> }` |
| 〃 | 14~35행 `WARMUP_URLS` | `/keeper-breakout-bgm.mp3`, `/sfxes/keeper-breakout-paddle.mp3`, `/sfxes/keeper-breakout-brick.mp3` 추가 |
| `src/web/App.tsx` | 110행 `useState<…>` 유니온 | `"keeper-breakout"` 추가 |
| 〃 | 427~455행 모달 렌더 | `{activeMinigame === "keeper-breakout" && <KeeperBreakoutModal onClose={() => setActiveMinigame(null)} />}` |
| `src/web/storage.ts` | 256~340행 사과게임 블록 | `fc26-keeper-breakout-highscore`, `-sfx-enabled`, `-sfx-volume`, `-music-enabled`, `-music-volume` 키와 `load/save` 함수 쌍을 같은 try/catch 패턴으로 복제 |

- 로딩: 코드가 크지 않으면 정적 import, 메인 번들을 키우고 싶지 않으면 `FreekickModal`처럼 `lazy(() => import(...))` + `<Suspense fallback={null}>`(default export).
- 메뉴는 `max-width: 680px`에서 숨겨지므로 모바일 대응은 필요 없다.
- 순위 연동은 위 표의 등록과 별개로 3-5를 따른다. 순위 시스템 파일(`src/shared/minigame-scores.ts`의 다른 게임 줄, `src/worker*.ts`, `migrations/`, `src/web/minigame/ranking/*`)은 **수정하지 않는다** — 이 게임의 `SCORE_GAMES` 한 줄만 고친다.

### 3-5. 온라인 순위 연동 ([minigame-ranking.md](minigame-ranking.md) 레시피)

순위 시스템은 이미 있다 (Cloudflare Worker + D1, 게임×플레이어당 최고기록 1행). 이 게임이 할 일은 다음 셋이다. **D1 마이그레이션은 필요 없다** (허용 게임 목록은 `SCORE_GAMES` 코드이고 `scores` 테이블은 게임 공용).

1. **`SCORE_GAMES["keeper-breakout"]`의 `max`를 이론 상한으로 정한다** (`src/shared/minigame-scores.ts`). 지금은 임시값 1,000,000이다. 서버는 `min`~`max` 밖의 점수를 위조로 보고 거절하고, 클라이언트도 범위 밖이면 조용히 제출하지 않는다. 이 게임은 상한을 계산할 수 있다:
   - `keeperBreakoutEngine.ts`(또는 stages 파일)에 `maxPossibleScore()`를 만든다: 5개 스테이지의 **모든 파괴 가능한 벽돌 점수 합**(`hp1` 10 · `hp2` 20 · `hp3` 30 · `gold` 50 · `burst` 15 · `steel` 0) + 스테이지 클리어 보너스 `100 × 3(목숨 최대) × 5`.
   - 공유 모듈이 웹 엔진을 import하면 Worker 번들이 커지므로 **`max`는 숫자로 직접 적고**(계산 결과를 100 단위로 올림), 줄 주석에 근거를 남긴다.
   - 엔진 테스트에 `expect(SCORE_GAMES["keeper-breakout"].max).toBeGreaterThanOrEqual(maxPossibleScore())`를 넣어 나중에 스테이지·점수를 바꿔도 상한이 어긋나면 테스트가 깨지게 한다. `min`은 1 그대로 (0점은 제출되지 않는다).
2. **모달 연결** — `KeeperBreakoutModal`:

```tsx
import { MinigameStage } from "../ranking/MinigameStage.js";
import { RankingPanel } from "../ranking/RankingPanel.js";
import { useRanking } from "../ranking/useRanking.js";
import { loadKeeperBreakoutHighScore } from "../../storage.js";

const ranking = useRanking("keeper-breakout", () => loadKeeperBreakoutHighScore() || null); // 기존 localStorage 기록을 1회 등록할 수 있게
const game = useKeeperBreakoutGame({
  sfxOn, sfxVolume,
  onRoundEnd: (result) => {
    stopMusic();
    onRoundEnd?.(result);
    ranking.report(result.score); // 종료(over)·전체 클리어(cleared) 때 정확히 1회. 더 좋을 때만 서버로 제출됨
  },
});
// …
<Modal … wide>
  <MinigameStage panel={<RankingPanel {...ranking.panel} />}>
    {/* 기존 게임 영역(HUD + 캔버스 + 시작/결과 패널)을 그대로 여기 */}
  </MinigameStage>
</Modal>
```

3. **패널은 반드시 `Modal`의 children 안**에 둔다. `.modal` 밖에 두면 클릭이 backdrop으로 전달돼 모달이 닫힌다. 참고 구현: `src/web/minigame/soccer-sum10/SoccerSum10Modal.tsx`.

- 순위 서버가 없거나(`pnpm dev`만 켠 경우) 실패해도 게임은 정상 동작하고 패널만 "순위를 불러올 수 없어요"로 보인다. 게임 로직은 순위에 의존하면 안 된다.
- 종료 결과 보고는 `onRoundEnd`가 라운드당 한 번만 불리는 것(end-latch)에 기대므로, 그 한 곳에서만 `ranking.report`를 부른다.

> **세션 간 충돌 주의**: 미니게임 3종을 각각 다른 세션에서 구현하면 세 세션 모두 `MinigameMenu.tsx`, `App.tsx`, `storage.ts`의 같은 줄 부근을 수정한다. 하나씩 순서대로 머지하고, 나중 세션은 시작 전에 최신 `main`을 받아 라인 번호를 다시 확인한다. 위 줄 번호는 2026-09-21 기준이다.

## 4. 에셋 목록

모든 이미지는 `public/`에 웹피 파일로 둔다. 원본 PNG는 `tmp/minigame-src/keeper-breakout/`에 저장한다. `.gitignore`에는 지금 `tmp/world-src/`만 있으므로 구현 세션에서 `tmp/minigame-src/` 줄을 추가해 원본이 커밋되지 않게 한다.

| 원본 저장 파일 (`tmp/minigame-src/keeper-breakout/`) | 최종 파일 (`public/`) | 최종 규격 | 용도 | 폴백 |
| --- | --- | --- | --- | --- |
| `bricks-sheet.png` | `keeper-breakout-brick-hp1.webp` `-hp2` `-hp3` `-gold` `-steel` `-burst` | 각 112×40 투명 (논리 56×20의 2배) | 벽돌 6종 | 종류별 색 둥근 사각형 |
| `powerups-sheet.png` | `keeper-breakout-powerup-wide.webp` `-multi` `-slow` `-shield` | 각 64×64 투명 | 파워업 4종 | 색 원 + 글자 아이콘(W/M/S/N) |
| `paddles.png` | `keeper-breakout-paddle.webp` (224×56), `keeper-breakout-paddle-wide.webp` (336×56) | 투명 | 패들 두 폭 | 민트색 둥근 막대 |
| `icon.png` | `keeper-breakout-icon.webp` | 256×256 투명 | 메뉴 아이콘 · 모달 제목 아이콘 | 🧤 이모지 (`minigame-menu__icon--fallback`) |
| `background.png` | `keeper-breakout-background.webp` | 1280×960 (4:3) 불투명 | 플레이 영역 배경 | `#063d24` 잔디 + CSS 페널티박스 선 |
| (기존 파일 재사용) | `soccer_ball.webp` | 462×462 투명 (이미 있음) | 공 · 목숨 아이콘 | 흰 원 |

### 변환 안내

- 변환 스크립트는 아직 없다 (`public/*.webp`는 수동 배치). 구현 세션에서 `sharp`로 처리한다 (`sharp`는 devDependency에 이미 있음).
  1. `#FF00FF` 배경을 투명으로 (모서리 색 기준, 허용오차 약 40, 테두리 마젠타 번짐 제거).
  2. 시트는 셀별로 잘라 여백을 트림한 뒤 목표 규격에 비율 유지로 맞춤.
  3. `paddles.png`는 두 패들 높이가 같으므로 **같은 배율**로 줄여 높이를 56에 맞춘다 (폭은 224와 336이 되는지 확인).
  4. `webp({ quality: 92 })` 또는 무손실로 저장.
- 기존 `scripts/lib/world-art-math.mjs`의 마젠타 키·despill 헬퍼를 재사용하는 `scripts/convert-minigame-art.mjs`를 만들면 다른 두 게임과 공유할 수 있다 (선택 선행 작업).
- 그물 보호막 선과 조준선은 이미지 없이 캔버스로 그린다.

## 5. 이미지 생성 카드

생성 도구는 ChatGPT gpt-image(레퍼런스 이미지 첨부 가능). **각 카드는 단독으로 복사해 쓸 수 있게 스타일 문구를 전부 안에 담았다.** 프롬프트 코드블록만 통째로 붙여넣으면 된다.

### 스레드 구성

| 스레드 | 만드는 이미지 | 이유 |
| --- | --- | --- |
| **스레드 A** (새 대화) | 5-1 벽돌 시트 → 5-2 파워업 시트 → 5-3 패들 → 5-4 아이콘 | 벽돌·파워업·패들·아이콘은 하나의 그림체와 채도로 이어져야 한다. 5-1 결과가 스타일 앵커가 된다 |
| **스레드 B** (새 대화) | 5-5 배경 | 배경은 오브젝트 그림체를 기억할 필요가 없고, 스레드 A에 섞으면 컨텍스트가 길어져 스타일이 흔들린다 |

- 결과가 마음에 들지 않으면 같은 스레드에서 각 카드의 **재생성 문구**로 고친다. 3번 이상 고쳐도 안 되면 새 스레드에서 프롬프트를 처음부터 다시 붙여넣는다.
- 첨부 레퍼런스 3장은 스레드마다 첫 메시지에만 첨부한다: `public/soccer-sum10-icon.webp`, `public/goalpost.webp`, `public/soccer_ball.webp`.

---

### 5-1. 벽돌 시트 (벽돌 6종)

- **저장**: `tmp/minigame-src/keeper-breakout/bricks-sheet.png` → `public/keeper-breakout-brick-hp1.webp` 외 5종 (각 112×40)
- **🧵 스레드**: **새 스레드 A 시작** — 이 카드가 스레드 A의 첫 메시지다.
- **첨부**: `public/soccer-sum10-icon.webp`, `public/goalpost.webp`, `public/soccer_ball.webp` 3장을 프롬프트와 같은 메시지에 첨부.
- **캔버스**: 1536×1024 가로. 3열 × 2행 (6칸, 각 512×512).

```text
Using the three attached images as exact style references, create ONE sprite sheet of six breakable bricks for a football-themed brick-breaker game. Canvas 1536x1024 landscape. Strict grid of 3 columns x 2 rows (6 cells, each 512x512). Exactly one brick per cell, centred. Every brick is the SAME size and shape: a wide rounded rectangle with about a 2.8 : 1 width-to-height ratio, filling about 76% of the cell width, with at least 12% empty margin around it, seen straight from the front with a slight bevelled edge. The bricks look like LED stadium advertising boards, decorated only with simple pattern shapes, never with words. Reading order left to right, top to bottom:
1. a bright mint (#00e9ae) board with a row of white chevron arrows pattern.
2. a bright blue board with a row of white diamond shapes.
3. a bright orange board with white diagonal stripes.
4. a shiny gold board with a big white-gold star in the middle and two tiny sparkles.
5. an unbreakable dark steel plate in grey-blue metal with four rivets and yellow-black hazard stripes along the bottom edge.
6. a red-and-white striped signal flare canister brick with a small burning fuse and a tiny orange spark at one end.
The colours must be clearly distinct from each other so they can be told apart at a small size. Art style: glossy cartoon sticker game art matching the attached reference images exactly - thick clean black outline, soft top-left specular highlights, gentle cel shading, rounded friendly shapes, saturated but not neon colours. Flat solid #FF00FF magenta background with no gradient, no floor shadow, and no glow, halo or shadow outside the drawn shapes. No text, letters, numbers, logos, watermark or signature anywhere.
```

- **검수**: ① 6개 벽돌의 크기·비율·외곽선 굵기가 같은가 ② 색이 서로 확실히 다른가 (특히 1·2·3) ③ 글자·숫자가 없는가 ④ 칸 경계에서 떨어져 있는가 ⑤ 배경에 마젠타 외 색·그림자·후광이 없는가.
- **재생성 문구**:

```text
Keep everything, but fix: the bricks are not all the same size - redraw all six with exactly the same width, height and outline thickness, only the colours and patterns differ.
```

```text
Keep everything, but fix: remove the letters on the boards and replace them with simple geometric patterns; no text of any kind.
```

---

### 5-2. 파워업 시트 (4종)

- **저장**: `tmp/minigame-src/keeper-breakout/powerups-sheet.png` → `public/keeper-breakout-powerup-wide.webp` `-multi` `-slow` `-shield` (각 64×64)
- **🧵 스레드**: **스레드 A에서 이어서** — 5-1 결과를 받은 직후 같은 대화창에 그대로 전송. 레퍼런스 재첨부 불필요 (이미 첨부되어 있고 5-1 결과도 스타일 앵커로 남아 있다).
- **캔버스**: 1024×1024 정사각. 2열 × 2행 (각 512×512).

```text
Using the three reference images from the start of this conversation and the brick sheet you just made as exact style references, create ONE sprite sheet of four power-up badges on a 1024x1024 canvas. Strict grid of 2 columns x 2 rows (4 cells, each 512x512). Exactly one badge per cell, centred. Every badge is a round coin-shaped badge with the SAME diameter, filling about 76% of the cell, with at least 12% empty margin. Each badge has a coloured ring and one big simple icon in the middle, readable at 32x32 pixels. Reading order left to right, top to bottom:
1. mint (#00e9ae) ring: a white goalkeeper glove with a left-right double arrow under it (wider paddle).
2. gold ring: three small soccer balls arranged in a triangle (multi ball).
3. blue ring: a white stopwatch (slow motion).
4. white-and-teal ring: a shield covered with a net pattern (protective net).
Art style: glossy cartoon sticker game art matching the reference images exactly - thick clean black outline, soft top-left specular highlights, gentle cel shading, rounded friendly shapes, saturated but not neon colours. Flat solid #FF00FF magenta background with no gradient, no floor shadow, and no glow, halo or shadow outside the drawn shapes. No text, letters, numbers, logos, watermark or signature anywhere.
```

- **검수**: 32×32로 줄여도 아이콘이 읽히는가, 4개 링 색이 확실히 다른가, 지름이 같은가, 글자가 없는가.
- **재생성 문구**:

```text
Keep everything, but fix: the icons inside the badges are too small and detailed - make each icon fill about 60% of the badge with bolder shapes and a thicker outline.
```

---

### 5-3. 패들 두 폭

- **저장**: `tmp/minigame-src/keeper-breakout/paddles.png` → `public/keeper-breakout-paddle.webp` (224×56), `public/keeper-breakout-paddle-wide.webp` (336×56)
- **🧵 스레드**: **스레드 A에서 이어서** — 5-2 결과를 받은 직후 같은 대화창에 전송. 레퍼런스 재첨부 불필요.
- **캔버스**: 1536×1024 가로. 위아래 2행 (각 1536×512), 열은 1개.

```text
Using the three reference images from the start of this conversation and the sheets you already made as exact style references, create ONE image on a 1536x1024 canvas containing two goalkeeper paddles for a brick-breaker game, stacked in two rows (each row 1536x512), exactly one paddle per row, centred horizontally, seen straight from the front. Each paddle is a long horizontal mint (#00e9ae) pill-shaped bar with a big white goalkeeper glove with mint fingers at each end, with a thin darker mint stripe along the middle of the bar. Both paddles have EXACTLY the same height (about 190 pixels), the same glove size and the same outline thickness. Row 1: the normal paddle, exactly 4 times as wide as it is tall. Row 2: the wide paddle, exactly 6 times as wide as it is tall, made by lengthening only the middle bar while the two gloves stay the same size. Leave at least 12% empty margin around each paddle. Art style: glossy cartoon sticker game art matching the reference images exactly - thick clean black outline, soft top-left specular highlights, gentle cel shading, rounded friendly shapes. Flat solid #FF00FF magenta background with no gradient, no floor shadow, and no glow, halo or shadow outside the drawn shapes. No text, letters, numbers, logos, watermark or signature anywhere.
```

- **검수**: 두 패들의 높이·장갑 크기·외곽선이 같은가, 폭 비율이 4:1과 6:1에 가까운가 (변환 시 224×56, 336×56이 나와야 한다), 글자가 없는가.
- **재생성 문구**:

```text
Keep everything, but fix: the wide paddle in row 2 has bigger gloves than the normal paddle - keep both gloves exactly the same size and only make the middle bar longer.
```

---

### 5-4. 메뉴 아이콘

- **저장**: `tmp/minigame-src/keeper-breakout/icon.png` → `public/keeper-breakout-icon.webp` (256×256)
- **🧵 스레드**: **스레드 A에서 이어서** — 5-3 결과를 받은 직후 같은 대화창에 전송. 레퍼런스 재첨부 불필요.
- **캔버스**: 1024×1024 정사각.

```text
Using the three reference images from the start of this conversation and the sheets you already made as exact style references, create ONE menu icon on a 1024x1024 square canvas: a pair of white goalkeeper gloves with mint fingers catching a classic black-and-white soccer ball between them, with two small orange and blue brick chips flying off at the top corners. Centred, filling about 80% of the canvas, with at least 10% empty margin on every side. It must read clearly at 24x24 pixels: bold simple shapes, strong silhouette, no tiny details. Art style: glossy cartoon sticker game art matching the reference images exactly - thick clean black outline, soft top-left specular highlights, gentle cel shading, rounded friendly shapes, saturated but not neon colours. Flat solid #FF00FF magenta background with no gradient, no floor shadow, and no glow, halo or shadow outside the drawn shapes. No text, letters, numbers, logos, watermark or signature anywhere.
```

- **검수**: 24×24에서 장갑+공 실루엣이 읽히는가, 사과게임 아이콘과 같은 결인가, 배경에 마젠타 외 요소가 없는가.
- **재생성 문구**:

```text
Keep everything, but fix: make the gloves and ball larger, remove the brick chips, and thicken the black outline so the icon is readable at 24x24 pixels.
```

---

### 5-5. 플레이 영역 배경

- **저장**: `tmp/minigame-src/keeper-breakout/background.png` → `public/keeper-breakout-background.webp` (중앙 4:3으로 크롭 후 1280×960)
- **🧵 스레드**: **새 스레드 B 시작** — 이 카드가 스레드 B의 첫 메시지다. 스레드 A와 섞지 않는다.
- **첨부**: `public/soccer-sum10-icon.webp`, `public/goalpost.webp`, `public/soccer_ball.webp` (분위기와 그림체 기준).
- **캔버스**: 1536×1024 가로. 배경은 마젠타가 아니라 그림 전체가 배경이다 (불투명).

```text
Using the three attached images only as a loose style and mood reference, create ONE background illustration for a brick-breaker game, canvas 1536x1024 landscape, no transparency. Scene: a top-down view of a football penalty area at night, deep emerald grass with subtle mowing stripes, faint white penalty-box lines and a faint penalty spot near the bottom, a dark navy-teal (#0b1614) vignette around the edges with soft stadium floodlight glow only at the four corners. Keep the whole picture low in contrast and dark enough that bright coloured bricks, a white ball and mint paddles drawn on top of it will stand out; the centre 70% must be calm and uncluttered. Painted glossy cartoon game-art look with gentle soft shading. No players, no ball, no goalposts, no characters, no crowd, no text, letters, numbers, logos, scoreboard, watermark or signature.
```

- **검수**: ① 중앙이 어둡고 단순한가 ② 페널티박스 선이 흐릿한가(게임 오브젝트를 가리지 않게) ③ 인물·공·골대·글자가 없는가 ④ 3:2를 4:3으로 좌우 크롭해도 구도가 괜찮은가.
- **재생성 문구**:

```text
Keep everything, but fix: make the picture darker and lower in contrast, fade the white pitch lines to about 25% strength, and remove any bright area in the middle.
```

## 6. 오디오

파일은 `public/`(BGM) 또는 `public/sfxes/`(효과음)에 mp3로 둔다. 재생은 `src/web/sfxAudio.ts`의 `playSfx(url, volume, onCreate?)`를 쓴다. 재생 실패는 `playSfx`가 무시하므로 파일이 없어도 조용히 넘어가고, 효과음은 한 번에 하나만 재생된다 (새 효과음이 이전 것을 끊음). 무료 소스를 쓸 때는 CC0/CC-BY 여부를 확인하고 출처를 커밋 메시지나 PR에 남긴다.

| 파일명 | 저장 위치 | 용도 | 검색 키워드 (한글 / 영어) |
| --- | --- | --- | --- |
| `keeper-breakout-bgm.mp3` | `public/` | 진행 중 반복 BGM (60~120초, 무보컬, 끊김 없는 루프) | `경쾌한 아케이드 스포츠 게임 BGM 루프`, `upbeat arcade sports game music loop` |
| `keeper-breakout-paddle.mp3` | `public/sfxes/` | 공이 패들에 맞음 (0.1~0.25초) | `가죽 공 차는 짧은 효과음`, `short soccer ball kick thud sound effect` |
| `keeper-breakout-brick.mp3` | `public/sfxes/` | 벽돌 파괴 (0.15~0.3초) | `짧은 경쾌한 팝 블록 깨짐 효과음`, `short arcade brick break pop sound effect` |
| `keeper-breakout-clank.mp3` | `public/sfxes/` | 체력이 남은 벽돌·강철 벽돌에 맞음 (0.1~0.2초) | `짧은 금속 땡 효과음`, `short metal clank hit sound effect` |
| `keeper-breakout-powerup.mp3` | `public/sfxes/` | 파워업 획득 (0.4~0.8초) | `상승하는 아이템 획득 효과음`, `rising power up pickup sound effect` |
| `keeper-breakout-lifelost.mp3` | `public/sfxes/` | 공을 놓침 (0.6~1초) | `아쉬운 하강 실패 효과음`, `short descending fail sound game` |
| `keeper-breakout-stageclear.mp3` | `public/sfxes/` | 스테이지 클리어 (1~2초) | `축구 관중 환호 짧은 성공 효과음`, `football crowd cheer victory stinger` |
| `keeper-breakout-gameover.mp3` | `public/sfxes/` | 종료 (1~1.5초) | `축구 경기 종료 휘슬 짧은`, `short football full time whistle game over` |

## 7. 구현 순서 · 완료 기준

1. `keeperBreakoutStages.ts` + `keeperBreakoutEngine.ts` + `keeperBreakoutEngine.test.ts` (3-3 항목 전부). 여기서 반사·속도 상수를 다듬는다.
2. `storage.ts` 키·함수 추가, `useKeeperBreakoutGame.ts`, Sfx·Music 훅.
3. `KeeperBreakoutCanvas.tsx` + `KeeperBreakoutModal.tsx` + `keeper-breakout.css`. **에셋 없이 폴백 렌더로 먼저 완성한다.**
4. 3-4의 등록 4곳(+저장)을 반영한다.
5. 3-5의 온라인 순위 연동: `maxPossibleScore()` + `SCORE_GAMES["keeper-breakout"].max` 조정 + 상한 테스트, 모달에 `MinigameStage` + `RankingPanel` + `useRanking` 연결.
6. 이미지: 9-1 현황대로 원본 4장이 이미 있으므로 매니페스트에 `keeper-breakout` 항목을 추가해 변환하고(아이콘은 9-A 카드로 도착할 때까지 폴백), `keeperBreakoutAssets.ts`가 잡는지 확인한다.
7. 오디오: 8개가 이미 `public/`에 있으므로 훅의 경로·`WARMUP_URLS`가 파일명과 일치하는지만 확인한다.
8. `pnpm typecheck`와 `pnpm test`를 통과시킨다. 브라우저 수동 확인은 사용자가 배포 후 직접 한다 (요청이 있을 때만 프리뷰).

완료 기준: 에셋 없이도 플레이 가능 · 종료·클리어 결과가 한 번만 보고되고 `ranking.report`도 그 한 곳에서만 호출됨 · 순위 패널이 모달 안(children)에 있어 클릭해도 모달이 안 닫힘 · `SCORE_GAMES["keeper-breakout"].max`가 `maxPossibleScore()` 이상이고 그 테스트가 있음 · Esc로 닫힘 · 창이 비활성일 때 루프 정지 · 메뉴 아이콘 24×24에서 판독 가능 · 다른 미니게임의 저장 키와 충돌 없음.

## 8. 후속 작업 (이번 범위 아님)

월드 오락실 기계 연동(랭크 임계값, 미션, `MinigameRoundResult` 보고, 월드 스타일 640×360 도트 에셋)은 별도 문서로 다룬다. 이 문서의 `onRoundEnd?` 시그니처는 그때를 위한 자리만 남겨 둔 것이다.

## 9. 에셋 현황 · 추가 에셋

### 9-1. 현황 (2026-09-21 확인)

**구현 세션은 이미지·오디오를 새로 만들지 않고, 아래 상태를 확인해 연결만 한다.**

| 구분 | 파일 | 상태 |
| --- | --- | --- |
| 원본 이미지 | `tmp/minigame-src/keeper-breakout/` 의 `bricks-sheet.png` · `powerups-sheet.png` · `paddles.png` · `background.png` | 있음 (4장) |
| 원본 이미지 | 같은 폴더의 `icon.png` | **없음** — 9-2의 카드로 만든다 |
| 변환 결과 | `public/keeper-breakout-*.webp` | 아직 없음. 매니페스트(`scripts/minigame-art-manifest.json`)에 `keeper-breakout` 항목을 추가한 뒤 변환한다 |
| 오디오 8개 | `public/keeper-breakout-bgm.mp3`, `public/sfxes/keeper-breakout-paddle.mp3` · `-brick.mp3` · `-clank.mp3` · `-powerup.mp3` · `-lifelost.mp3` · `-stageclear.mp3` · `-gameover.mp3` | 있음 (6장 표와 파일명 일치) |
| 공 이미지 | `public/soccer_ball.webp` | 기존 파일 재사용 |

- 변환 스크립트는 **원본이 하나라도 없으면 멈추므로**, `icon.png`가 도착하기 전에 4장을 먼저 변환하려면 스크립트에 `--skip-missing`(없는 원본은 경고만 하고 건너뜀) 옵션을 더한다. 메뉴 아이콘은 그동안 🧤 폴백으로 보인다.

### 9-2. 추가로 필요한 에셋: 메뉴 아이콘 1장

5-4 카드는 "스레드 A에서 이어서"인데, 스레드 A가 이미 닫혔을 수 있다. 그 경우 아래 **새 스레드용 카드**를 쓴다 (5-4와 같은 이미지를 만들며, 스타일 앵커를 직접 첨부한다). 스레드 A가 아직 열려 있으면 5-4를 그대로 써도 된다.

#### 9-A. 메뉴 아이콘 (새 스레드용)

- **저장**: `tmp/minigame-src/keeper-breakout/icon.png` → `public/keeper-breakout-icon.webp` (256×256)
- **🧵 스레드**: **새 스레드 시작** (이 카드가 그 스레드의 첫 메시지다).
- **첨부** (5장을 프롬프트와 같은 메시지에 첨부): `public/soccer-sum10-icon.webp`, `public/goalpost.webp`, `public/soccer_ball.webp`, `tmp/minigame-src/keeper-breakout/paddles.png`(장갑 그림체 기준), `tmp/minigame-src/keeper-breakout/powerups-sheet.png`(외곽선·광택 기준).
- **캔버스**: 1024×1024 정사각.

```text
Using the five attached images as exact style references (the first three are existing game icons, the fourth shows the goalkeeper gloves of this game, the fifth is a sheet of power-up badges from the same game), create ONE menu icon on a 1024x1024 square canvas: a pair of white goalkeeper gloves with mint (#00e9ae) fingers catching a classic black-and-white soccer ball between them, with two small orange and blue brick chips flying off at the top corners. Centred, filling about 80% of the canvas, with at least 10% empty margin on every side. It must read clearly at 24x24 pixels: bold simple shapes, strong silhouette, no tiny details. Art style: glossy cartoon sticker game art matching the attached reference images exactly - thick clean black outline, soft top-left specular highlights, gentle cel shading, rounded friendly shapes, saturated but not neon colours. Flat solid #FF00FF magenta background with no gradient, no floor shadow, and no glow, halo or shadow outside the drawn shapes. No text, letters, numbers, logos, watermark or signature anywhere.
```

- **검수**: 24×24에서 장갑+공 실루엣이 읽히는가, 장갑이 `paddles.png`의 장갑과 같은 결(흰 장갑+민트 손가락)인가, 사과게임 아이콘과 같은 결인가, 배경에 마젠타 외 요소가 없는가.
- **재생성 문구**:

```text
Keep everything, but fix: make the gloves and ball larger, remove the brick chips, and thicken the black outline so the icon is readable at 24x24 pixels.
```

### 9-3. 추가 에셋을 넣는 법

그 밖에 구현 중 새 에셋이 필요해지면 **이 절 아래에 카드로 추가**한다. 카드는 5장과 같은 형식(저장 원본명 → 최종 파일명·규격, 🧵 스레드 지시, 첨부 레퍼런스, 스타일 문구를 전부 인라인한 프롬프트, 검수, 재생성 문구)이고 번호는 `9-B`, `9-C`…로 매긴다. 추가한 파일은 4장 표에도 한 줄 넣고 매니페스트의 `keeper-breakout` 항목에 등록한다.
