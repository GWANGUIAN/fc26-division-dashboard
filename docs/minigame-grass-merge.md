# 잔디 머지 — 미니게임 기획 · 에셋 · 이미지 프롬프트

같은 단계의 아이템이 맞닿으면 다음 단계로 합쳐지는 물리 퍼즐(수박게임형)이다. 씨앗에서 시작해 황금 왕관 잔디구까지 키운다.
이 문서 하나만 읽고 다른 세션에서 구현·이미지 생성을 끝낼 수 있도록 자기완결로 쓴다. 다른 미니게임 문서: [minigame-keeper-breakout.md](minigame-keeper-breakout.md), [minigame-football-match3.md](minigame-football-match3.md). 서식 선례: [soccer-sum10-minigame-assets.md](soccer-sum10-minigame-assets.md).

**상태**: 기획 완료 · 구현 전 (2026-09-21). **범위**: 대시보드 왼쪽 아래 `미니게임` 메뉴만. 월드 오락실·랭크·미션 연동은 후속 작업이다 (이 문서에서는 다루지 않음).

## 0. 한눈에 보기

| 항목 | 내용 |
| --- | --- |
| 게임 id / 메뉴 라벨 | `grass-merge` / `잔디 머지` |
| 장르 | 물리 합체 퍼즐. 기존 5종(러너·키업스·프리킥·카드 짝·사과게임)과 겹치지 않음 |
| 조작 | 마우스 X로 조준, 클릭 또는 Space로 낙하 (키보드 ←/→로 조준 이동도 지원). 데스크톱 전용 |
| 종료 조건 | 경계선 위에 1.5초 이상 머무는 아이템이 있으면 종료 |
| 점수 | 합체로 새 단계가 만들어질 때 `n(n+1)/2`점 (n = 만들어진 단계, 2단계 3점 … 11단계 66점). 마지막 단계끼리 합치면 둘 다 사라지고 +100점 |
| 저장 | 최고 점수 `fc26-grass-merge-highscore` (localStorage) |
| 온라인 순위 | [minigame-ranking.md](minigame-ranking.md)의 공용 시스템에 연결. `SCORE_GAMES["grass-merge"]`는 이미 등록돼 있고(`max`는 임시값 1,000,000), 모달에 `useRanking` + `RankingPanel`을 붙인다 (3-5) |
| 구현 방식 | 자체 고정 스텝 원-원 충돌 엔진(순수 함수, 시드 RNG) + Canvas 2D. 새 의존성 없음 |
| 에셋 | 이미지 5장 생성(스레드 2개), 오디오 4개. **에셋이 없어도 CSS/Canvas 폴백으로 동작** |
| 이미지 스타일 | 광택 카툰 스티커 (두꺼운 검정 외곽선). 월드의 픽셀아트가 **아님** — `public/soccer-sum10-icon.webp`, `public/goalpost.webp`와 같은 결 |

## 1. 규칙 · 조작 · 화면

### 1-1. 규칙

1. 보드 위 낙하 위치(`y = 50`)에 현재 아이템이 떠 있고 마우스 X를 따라 움직인다. 클릭하면 떨어진다.
2. 낙하 후보는 **1~5단계만** (가중치 1단계 35% · 2단계 30% · 3단계 20% · 4단계 10% · 5단계 5%). 다음 아이템을 미리 보여 준다.
3. 같은 단계 두 개가 닿으면 둘이 사라지고 **중점**에 다음 단계 하나가 생긴다. 연쇄 합체도 허용한다.
4. 낙하 직후 0.5초는 경계선 판정에서 제외한다. 그 뒤 아이템 윗면이 경계선(`y = 90`)보다 위에 1.5초 연속 머물면 종료.
5. 낙하 쿨다운은 0.45초.

### 1-2. 단계 표 (반지름은 보드 논리 좌표 기준, 보드 400×600)

| 단계 | 아이템 | 반지름 | 합체 점수 | 식별 포인트 (실루엣·색) |
| --- | --- | --- | --- | --- |
| 1 | 씨앗 | 14 | — | 작은 갈색 씨앗 |
| 2 | 새싹 | 20 | 3 | 연두 떡잎 두 장 |
| 3 | 클로버 | 27 | 6 | 네잎클로버, 진한 초록 |
| 4 | 잔디 뭉치 | 34 | 10 | 풀잎이 뭉친 둥근 덤불 |
| 5 | 낡은 축구공 | 42 | 15 | 흙 묻은 흑백 공 |
| 6 | 새 축구공 | 52 | 21 | 반짝이는 흰 공 + 민트 패널 |
| 7 | 은메달 | 63 | 28 | 은색 원형 메달 |
| 8 | 금메달 | 76 | 36 | 금색 원형 메달 |
| 9 | 트로피 | 90 | 45 | 월계관 원형 안의 금색 트로피 |
| 10 | 잔디동 엠블럼 | 106 | 55 | 민트·흰색 원형 배지, 새싹 방패 |
| 11 | 황금 왕관 잔디구 | 124 | 66 | 작은 왕관을 쓴 황금 공 |

가장 큰 지름(248)이 보드 폭의 62%다. 값은 구현 세션에서 플레이해 보며 조정해도 된다 (`TIERS` 상수 한 곳만 고치면 되게 만든다).

### 1-3. 화면 구성 (모달 `wide`, 기존 `Modal` 셸 재사용)

- 헤더: `eyebrow "MINIGAME"` + 제목 `잔디 머지` + 한 줄 설명 (사과게임 모달과 같은 구조).
- **온라인 순위 패널이 모달 오른쪽 280px을 차지한다** (`MinigameStage`가 왼쪽 게임 / 오른쪽 `RankingPanel`로 나눔, 1000px 이하에서는 게임 아래로 쌓임). 그래서 게임 영역(왼쪽)은 `wide` 모달 기준 약 796px이고, 아래 요소는 모두 **이 왼쪽 게임 영역 안에** 배치한다.
- 게임 영역 상단 HUD: 현재 점수 · 최고 점수 · 다음 아이템 미리보기.
- 게임 영역 안 **진화 순서표**: 보드 옆 또는 아래에 1→11단계 작은 아이콘 한 줄 (`grass-merge-tier-XX.webp` 재사용).
- 가운데: 보드 논리 400×600 캔버스. CSS로 `height: min(64vh, 600px)`, `aspect-ratio: 2 / 3`로 축소해 세로 스크롤이 생기지 않게 한다.
- 사운드: 기존 `SoundControl` 재사용 (배경음악·효과음 각각 켜기/끄기·볼륨).
- 시작/결과 패널은 사과게임의 `.soccer-sum10-start-panel` / `.soccer-sum10-result` 마크업과 같은 패턴 (금색 pill 버튼).

## 2. 레퍼런스

**코드는 복사하지 않는다.** 동작 방식만 참고해 자체 구현하고, 라이선스가 확인된 것만 구조 참고로 명시한다. 라이선스 미확인 저장소는 열어 보되 코드를 옮기지 않는다.

| 이름 | URL | 라이선스 | 참고할 것 | 쓰지 않을 것 |
| --- | --- | --- | --- | --- |
| Coteh/suika-clone (Phaser 3 + TS) | https://github.com/Coteh/suika-clone | MIT (README 확인) | 단계 정의를 데이터 배열로 두는 구조, 합체 처리 흐름 | Phaser·Webpack 의존성, 임시 이미지 |
| Matter.js | https://github.com/liabru/matter-js | MIT | 원-원 충돌·반발·수면(sleeping) 개념 | 라이브러리 자체 (번들 추가 회피. 자체 엔진이 막히면 대안으로 사용 가능) |
| sgbj/suika-clone (Phaser + Matter + TS) | https://github.com/sgbj/suika-clone | 미확인 | 데모 https://batary.dev/suika-clone/ 로 체감 확인 | 코드 |
| moonfloof/suika-game (Matter.js 순수 JS) | https://github.com/moonfloof/suika-game | LICENSE 파일 있음, 종류 미확인 | 데모로 체감 확인 | 코드, `assets/` |
| JhrJianRan/suika-melon (Next.js + TS + Matter.js) | https://github.com/JhrJianRan/suika-melon | 미확인 | React 안에서 캔버스를 다루는 방식 | 코드 |

- 원작 "Suika Game"(수박게임)의 과일 세트·이름·이미지는 사용하지 않는다. 이 문서의 씨앗→왕관 진화표가 자체 테마다.
- 자체 엔진 권장 이유: 이 프로젝트는 게임 라이브러리를 쓰지 않고(`Canvas 2D 직접 구현`), 잔디 러시 엔진처럼 **DOM·시계가 없는 순수 엔진 + Vitest**로 검증한다.

## 3. 구현 설계

### 3-1. 파일 (사과게임 폴더 구조를 그대로 따른다)

| 파일 | 역할 |
| --- | --- |
| `src/web/minigame/grass-merge/grassMergeEngine.ts` | 순수 엔진. `TIERS`, `createGame(seed)`, `setAim(state, x)`, `drop(state)`, `step(state, dt)`. 상태 직렬화 가능, `Date`·`Math.random` 금지 (시드 RNG 사용) |
| `src/web/minigame/grass-merge/grassMergeEngine.test.ts` | 엔진 테스트 (3-3 참고) |
| `src/web/minigame/grass-merge/GrassMergeCanvas.tsx` | 캔버스 렌더 + 마우스/키보드 입력 + `requestAnimationFrame` 루프 (고정 스텝 누적기) |
| `src/web/minigame/grass-merge/useGrassMergeGame.ts` | React 상태: phase(`ready`/`playing`/`over`), 점수, 최고 점수, 종료 시 1회만 결과 보고(사과게임의 end-latch 패턴) |
| `src/web/minigame/grass-merge/useGrassMergeSfx.ts` · `useGrassMergeMusic.ts` | `useSoccerSum10Sfx/Music`을 복제해 키 이름만 교체 |
| `src/web/minigame/grass-merge/GrassMergeModal.tsx` | 모달 셸. `onClose`, 선택적 `onRoundEnd?(result)` (지금은 안 써도 시그니처만 열어 둔다) |
| `src/web/minigame/grass-merge/grass-merge.css` | 접두사 `.grass-merge-*`. 에셋이 없어도 보이도록 폴백 색 필수 |
| `src/web/minigame/grass-merge/grassMergeAssets.ts` | 이미지 URL 상수와 `Image` 로더. 로딩 실패 시 `undefined`를 반환해 폴백으로 그린다 |

### 3-2. 엔진 상수 (시작값)

| 이름 | 값 | 설명 |
| --- | --- | --- |
| 보드 논리 크기 | 400×600 | 벽은 x=0, x=400, 바닥은 y=600 |
| 경계선 y | 90 | 낙하 위치 y=50 |
| 고정 스텝 | 1/60초, 서브스텝 4 | 프레임 누적기로 돌린다 |
| 중력 | 1400 px/s² | |
| 반발 · 마찰 · 감쇠 | 0.15 · 0.4 · 0.995/스텝 | 너무 통통 튀면 반발을 낮춘다 |
| 수면 임계 속도 | 8 px/s 이하 30스텝 | 쌓인 더미가 떨리지 않게 |
| 종료 유예 | 낙하 후 0.5초, 경계선 위 1.5초 | |

### 3-3. 엔진 테스트 항목 (`*.test.ts`, DOM 없이)

1. 같은 시드 + 같은 입력이면 프레임 수와 무관하게 결과 상태가 같다 (결정성).
2. 같은 단계 두 개가 닿으면 다음 단계 하나로 바뀌고 점수가 `n(n+1)/2`만큼 오른다. 중점에 생성된다.
3. 한 번의 스텝에 3개가 동시에 닿아도 중복 합체(아이템이 늘어나는 버그)가 없다.
4. 11단계끼리 닿으면 둘 다 사라지고 +100점.
5. 경계선 위 머무름이 1.5초를 넘으면 `over`, 낙하 직후 0.5초 이내에는 종료되지 않는다.
6. 낙하 후보는 1~5단계만 나온다 (시드 1000회 표본).
7. 바닥에 놓인 아이템 더미가 600스텝 뒤 속도 임계 이하로 안정된다 (튕겨 나가지 않음).

### 3-4. 등록 4곳 체크리스트 (반드시 4곳 모두)

| 파일 | 위치 | 할 일 |
| --- | --- | --- |
| `src/web/minigame/MinigameMenu.tsx` | 8행 `MinigameId` | `"grass-merge"` 추가 |
| 〃 | 75~94행 `games` 배열 | `{ id: "grass-merge", label: "잔디 머지", icon: <img src="/grass-merge-icon.webp" alt="" className="minigame-menu__icon" /> }` |
| 〃 | 14~35행 `WARMUP_URLS` | `/grass-merge-bgm.mp3`, `/sfxes/grass-merge-drop.mp3`, `/sfxes/grass-merge-merge.mp3` 추가 |
| `src/web/App.tsx` | 110행 `useState<…>` 유니온 | `"grass-merge"` 추가 |
| 〃 | 427~455행 모달 렌더 | `{activeMinigame === "grass-merge" && <GrassMergeModal onClose={() => setActiveMinigame(null)} />}` |
| `src/web/storage.ts` | 256~340행 사과게임 블록 | `fc26-grass-merge-highscore`, `-sfx-enabled`, `-sfx-volume`, `-music-enabled`, `-music-volume` 키와 `load/save` 함수 쌍을 같은 try/catch 패턴으로 복제 |

- 로딩: 코드가 크지 않으면 `SoccerSum10Modal`처럼 정적 import도 되지만, 메인 번들을 키우지 않으려면 `FreekickModal`처럼 `lazy(() => import(...))` + `<Suspense fallback={null}>`(default export)을 권장한다.
- 메뉴는 `max-width: 680px`에서 숨겨지므로 모바일 대응은 필요 없다.
- 순위 연동은 위 표의 등록과 별개로 3-5를 따른다. 순위 시스템 파일(`src/shared/minigame-scores.ts`의 다른 게임 줄, `src/worker*.ts`, `migrations/`, `src/web/minigame/ranking/*`)은 **수정하지 않는다** — 이 게임의 `SCORE_GAMES` 한 줄만 고친다.

### 3-5. 온라인 순위 연동 ([minigame-ranking.md](minigame-ranking.md) 레시피)

순위 시스템은 이미 있다 (Cloudflare Worker + D1, 게임×플레이어당 최고기록 1행). 이 게임이 할 일은 다음 셋이다. **D1 마이그레이션은 필요 없다** (허용 게임 목록은 `SCORE_GAMES` 코드이고 `scores` 테이블은 게임 공용).

1. **`SCORE_GAMES["grass-merge"]`의 `max`를 현실적인 값으로 좁힌다** (`src/shared/minigame-scores.ts`). 지금은 임시값 1,000,000이다. 서버는 `min`~`max` 밖의 점수를 위조로 보고 거절하고, 클라이언트도 범위 밖이면 조용히 제출하지 않는다. 그래서 **너무 낮게 잡으면 정상 고득점이 등록되지 않는다.** 이 게임은 오래 하면 이론상 상한이 없으므로, 시작값 `200_000`(합체 점수 평균 30점 기준 약 6,700번 낙하 분량)을 쓰고 근거를 줄 주석으로 남긴다. 실제 플레이에서 이 값 근처까지 갈 수 있으면 올린다. `min`은 1 그대로 (0점은 제출되지 않는다).
2. **모달 연결** — `GrassMergeModal`:

```tsx
import { MinigameStage } from "../ranking/MinigameStage.js";
import { RankingPanel } from "../ranking/RankingPanel.js";
import { useRanking } from "../ranking/useRanking.js";
import { loadGrassMergeHighScore } from "../../storage.js";

const ranking = useRanking("grass-merge", () => loadGrassMergeHighScore() || null); // 기존 localStorage 기록을 1회 등록할 수 있게
const game = useGrassMergeGame({
  sfxOn, sfxVolume,
  onRoundEnd: (result) => {
    stopMusic();
    onRoundEnd?.(result);
    ranking.report(result.score); // 라운드 종료 때 정확히 1회. 더 좋을 때만 서버로 제출됨
  },
});
// …
<Modal … wide>
  <MinigameStage panel={<RankingPanel {...ranking.panel} />}>
    {/* 기존 게임 영역(HUD + play-area + 진화 순서표)을 그대로 여기 */}
  </MinigameStage>
</Modal>
```

3. **패널은 반드시 `Modal`의 children 안**에 둔다. `.modal` 밖에 두면 클릭이 backdrop으로 전달돼 모달이 닫힌다. 참고 구현: `src/web/minigame/soccer-sum10/SoccerSum10Modal.tsx`.

- 순위 서버가 없거나(`pnpm dev`만 켠 경우) 실패해도 게임은 정상 동작하고 패널만 "순위를 불러올 수 없어요"로 보인다. 게임 로직은 순위에 의존하면 안 된다.
- 종료 결과 보고는 `onRoundEnd`가 라운드당 한 번만 불리는 것(end-latch)에 기대므로, 그 한 곳에서만 `ranking.report`를 부른다.

> **세션 간 충돌 주의**: 미니게임 3종을 각각 다른 세션에서 구현하면 세 세션 모두 `MinigameMenu.tsx`, `App.tsx`, `storage.ts`의 같은 줄 부근을 수정한다. 하나씩 순서대로 머지하고, 나중 세션은 시작 전에 최신 `main`을 받아 라인 번호를 다시 확인한다. 위 줄 번호는 2026-09-21 기준이다.

## 4. 에셋 목록

모든 이미지는 `public/`에 웹피 파일로 둔다. 원본 PNG는 `tmp/minigame-src/grass-merge/`에 저장한다. `.gitignore`에는 지금 `tmp/world-src/`만 있으므로 구현 세션에서 `tmp/minigame-src/` 줄을 추가해 원본이 커밋되지 않게 한다.

| 원본 저장 파일 (`tmp/minigame-src/grass-merge/`) | 최종 파일 (`public/`) | 최종 규격 | 용도 | 폴백 |
| --- | --- | --- | --- | --- |
| `tiers-sheet.png` | `grass-merge-tier-01.webp` … `grass-merge-tier-11.webp` | 각 256×256 투명 | 보드 아이템 · 진화 순서표 · 다음 미리보기 | 단계별 색 원 + 단계 번호 |
| `icon.png` | `grass-merge-icon.webp` | 256×256 투명 | 메뉴 아이콘 · 모달 제목 아이콘 · 시작 패널 | 🌱 이모지 (`minigame-menu__icon--fallback`) |
| `board-frame.png` | `grass-merge-board.webp` | 480×720 투명 (내부 개구부는 투명) | 보드 테두리 | 둥근 사각 CSS 테두리 |
| `background.png` | `grass-merge-background.webp` | 1536×864 (16:9) 불투명 | 플레이 영역 배경 | `#063d24` 잔디 그라데이션 |
| `burst.png` | `grass-merge-burst.webp` | 512×512 투명, 2×2 시트(프레임 256²) | 합체 이펙트 (선택) | 캔버스 파티클(원 확산) |

### 변환 안내

- 변환은 아직 스크립트가 없다 (`public/*.webp`는 지금까지 수동 배치). 구현 세션에서 `sharp`로 처리하면 된다 (`sharp`는 devDependency에 이미 있음).
  1. `#FF00FF` 배경을 투명으로 (모서리 색 기준, 허용오차 약 40, 테두리 마젠타 번짐 제거).
  2. 시트는 셀별로 잘라 여백을 트림한 뒤 256×256 안에 비율 유지로 맞춤 (중앙 정렬).
  3. `webp({ quality: 92 })` 또는 무손실로 저장.
- 기존 `scripts/lib/world-art-math.mjs`에 마젠타 키·despill 헬퍼가 있으니 재사용하는 `scripts/convert-minigame-art.mjs`를 먼저 만들면 다른 두 게임과 공유할 수 있다 (선택 선행 작업).
- 보드 프레임은 변환 후 **투명 개구부의 bbox를 측정해 `BOARD_INTERIOR` 상수(예: x 40·y 70·w 400·h 600)를 확정**하고, 벽 좌표를 그 값에 맞춘다. AI가 개구부를 정확히 400×600으로 그려 주지 않기 때문이다.

## 5. 이미지 생성 카드

생성 도구는 ChatGPT gpt-image(레퍼런스 이미지 첨부 가능). **각 카드는 단독으로 복사해 쓸 수 있게 스타일 문구를 전부 안에 담았다.** 프롬프트 코드블록만 통째로 붙여넣으면 된다.

### 스레드 구성

| 스레드 | 만드는 이미지 | 이유 |
| --- | --- | --- |
| **스레드 A** (새 대화) | 5-1 티어 시트 → 5-2 아이콘 | 아이템과 아이콘은 같은 그림체가 이어져야 한다. 5-1 결과가 스타일 앵커가 된다 |
| **스레드 B** (새 대화) | 5-3 배경 → 5-4 보드 프레임 → 5-5 이펙트 | 환경 이미지는 아이템 그림체를 기억할 필요가 없고, 스레드 A에 섞으면 컨텍스트가 길어져 스타일이 흔들린다 |

- 결과가 마음에 들지 않으면 같은 스레드에서 각 카드의 **재생성 문구**로 고친다. 3번 이상 고쳐도 안 되면 새 스레드에서 프롬프트를 처음부터 다시 붙여넣는다.
- 첨부 레퍼런스 3장은 스레드마다 첫 메시지에만 첨부한다: `public/soccer-sum10-icon.webp`, `public/goalpost.webp`, `public/soccer_ball.webp`.

---

### 5-1. 티어 시트 (아이템 11종)

- **저장**: `tmp/minigame-src/grass-merge/tiers-sheet.png` → `public/grass-merge-tier-01.webp … 11.webp` (각 256×256)
- **🧵 스레드**: **새 스레드 A 시작** — 이 카드가 스레드 A의 첫 메시지다.
- **첨부**: `public/soccer-sum10-icon.webp`, `public/goalpost.webp`, `public/soccer_ball.webp` 3장을 프롬프트와 같은 메시지에 첨부.
- **캔버스**: 1536×1024 가로. 4열 × 3행 (12칸, 마지막 12번째 칸은 비움).

```text
Using the three attached images as exact style references, create ONE sprite sheet for a casual physics merge puzzle game. Canvas 1536x1024 landscape. Strict grid of 4 columns x 3 rows (12 cells, each about 384x341). Exactly one item per cell, centred, filling about 76% of the cell width regardless of the item's real-world size, with at least 12% empty margin inside every cell. No cell borders, no grid lines. Reading order left to right, top to bottom:
1. a small brown grass seed with a tiny cream highlight, plump oval shape.
2. a sprout: two bright lime-green seed leaves on a tiny round soil mound, overall round silhouette.
3. a four-leaf clover in deep emerald green, compact and round overall.
4. a round bushy tuft of green grass blades shaped like a soft green ball, two tones of green.
5. an old worn classic black-and-white soccer ball with light brown dirt smudges and scuffs.
6. a brand-new shiny soccer ball, white with mint (#00e9ae) panels and a small sparkle star on the highlight.
7. a round silver medal with an embossed football emblem, a short silver ribbon tucked behind it so the silhouette stays round.
8. a round gold medal with an embossed football emblem, a short gold ribbon tucked behind it so the silhouette stays round.
9. a golden trophy cup framed inside a round green laurel wreath medallion, overall round silhouette.
10. a round club badge in mint and white with a sprouting seedling inside a small shield in the centre, gold rim, no letters.
11. a glossy golden soccer ball wearing a small jewelled gold crown, with two tiny green grass sprouts growing on top, the richest and most eye-catching item.
12. leave the 12th cell (bottom right) completely empty magenta.
Every item must have a clearly different colour and silhouette so it can be told apart at a small size, and the items should feel progressively richer from item 1 to item 11. Art style: glossy cartoon sticker game art matching the attached reference images exactly - thick clean black outline, soft top-left specular highlights, gentle cel shading, rounded friendly shapes, saturated but not neon colours. Colour mood: emerald grass green, mint #00e9ae, warm gold #ffd44f, cream white, with small deep teal-black accents. Flat solid #FF00FF magenta background with no gradient, no floor shadow, and no glow, halo or shadow outside the drawn shapes. No text, letters, numbers, logos, watermark or signature anywhere.
```

- **검수**: ① 12칸 중 11칸만 채워졌고 12번째가 비었는가 ② 모든 아이템이 칸 경계에서 떨어져 있는가 ③ 1~11번이 크기와 상관없이 비슷한 비율로 칸을 채우는가 (실제 반지름은 코드가 정함) ④ 외곽선 굵기가 레퍼런스와 비슷한가 ⑤ 배경에 마젠타 외 색·그림자·후광이 없는가 ⑥ 글자·숫자가 없는가 ⑦ 4·5번, 7·8번이 작은 크기에서도 구분되는가.
- **재생성 문구** (같은 스레드에서 상황에 맞게 골라 붙여넣기):

```text
Keep everything, but fix: the item in row 2 column 3 touches the cell border - shrink it so it fills about 76% of the cell and keep a clear magenta margin.
```

```text
Keep everything, but fix: items 5 and 6 look too similar - make item 5 clearly dirtier and duller (grey-white with brown dirt) and item 6 clearly cleaner and brighter with mint panels.
```

```text
Keep everything, but fix: remove the glow and drop shadow that spill onto the magenta background; every glow must stay inside the drawn shape.
```

---

### 5-2. 메뉴 아이콘

- **저장**: `tmp/minigame-src/grass-merge/icon.png` → `public/grass-merge-icon.webp` (256×256)
- **🧵 스레드**: **스레드 A에서 이어서** — 5-1 결과를 받은 직후 같은 대화창에 그대로 전송. 레퍼런스 재첨부 불필요 (이미 첨부되어 있고 5-1 결과 시트도 스타일 앵커로 남아 있다).
- **캔버스**: 1024×1024 정사각.

```text
Using the three reference images from the start of this conversation and the tier sheet you just made as exact style references, create ONE menu icon on a 1024x1024 square canvas: a single shiny soccer ball (white with mint #00e9ae panels) sitting on a small tuft of green grass, with a bright lime-green sprout with two leaves growing out of the top of the ball, like a football that is sprouting. Centred, filling about 80% of the canvas, with at least 10% empty margin on every side. It must read clearly at 24x24 pixels: bold simple shapes, strong silhouette, no tiny details. Art style: glossy cartoon sticker game art matching the attached reference images exactly - thick clean black outline, soft top-left specular highlights, gentle cel shading, rounded friendly shapes, saturated but not neon colours, emerald grass green, mint #00e9ae, warm gold #ffd44f, cream white. Flat solid #FF00FF magenta background with no gradient, no floor shadow, and no glow, halo or shadow outside the drawn shapes. No text, letters, numbers, logos, watermark or signature anywhere.
```

- **검수**: 24×24로 줄여도 공+새싹 실루엣이 읽히는가, 사과게임 아이콘(`soccer-sum10-icon.webp`)과 같은 결인가, 배경에 마젠타 외 요소가 없는가.
- **재생성 문구**:

```text
Keep everything, but fix: make the sprout larger and the black outline thicker so the icon is readable at 24x24 pixels.
```

---

### 5-3. 플레이 영역 배경

- **저장**: `tmp/minigame-src/grass-merge/background.png` → `public/grass-merge-background.webp` (중앙 16:9로 크롭 후 1536×864)
- **🧵 스레드**: **새 스레드 B 시작** — 이 카드가 스레드 B의 첫 메시지다. 스레드 A와 섞지 않는다.
- **첨부**: `public/soccer-sum10-icon.webp`, `public/goalpost.webp`, `public/soccer_ball.webp` (분위기와 그림체 기준).
- **캔버스**: 1536×1024 가로. 배경은 마젠타가 아니라 그림 전체가 배경이다 (불투명).

```text
Using the three attached images only as a loose style and mood reference, create ONE wide background illustration for a casual physics puzzle game, canvas 1536x1024 landscape, no transparency. Scene: a cosy football-club training ground at golden hour seen from the side, soft rolling emerald grass with subtle mowing stripes, a few tiny mint-coloured wildflowers and clovers at the bottom edge, distant blurred stadium floodlights and warm sky in the top third, a soft dark teal (#0b1614) vignette around the edges. The central 60% of the image must stay calm, low-contrast and uncluttered because a game board and score panels will be drawn on top of it. Painted glossy cartoon game-art look with gentle soft shading, saturated but not neon colours, emerald green, mint #00e9ae and warm gold accents. No players, no ball, no goalposts, no characters, no text, letters, numbers, logos, scoreboard, watermark or signature.
```

- **검수**: ① 중앙이 비어 있고 대비가 낮은가 ② 어두운 가장자리가 있어 카드 UI가 떠 보이는가 ③ 인물·공·골대·글자가 없는가 ④ 위 3분의 1이 잘려도(16:9 크롭) 어색하지 않은가.
- **재생성 문구**:

```text
Keep everything, but fix: the centre is too busy and too bright - make the middle 60% smoother, darker and lower in contrast, and keep the detail only near the edges.
```

---

### 5-4. 보드 프레임

- **저장**: `tmp/minigame-src/grass-merge/board-frame.png` → `public/grass-merge-board.webp` (480×720, 개구부 투명)
- **🧵 스레드**: **스레드 B에서 이어서** — 5-3 결과를 받은 직후 같은 대화창에 전송. 레퍼런스 재첨부 불필요.
- **캔버스**: 1024×1536 세로.

```text
Using the three reference images from the start of this conversation as exact style references for outline and shading, create ONE tall open-top container frame for a physics puzzle game on a 1024x1536 portrait canvas. The frame is the two side walls and the bottom of a tall open-top box, built from chunky white football goalpost tubing with rounded corners, like the attached goalpost, with a subtle white net texture only on the thick bottom rim. The frame is perfectly symmetrical, with side walls about 8% of the canvas width thick and a bottom rim about 6% of the canvas height thick, with a small mint #00e9ae stripe along the inside edge. The frame outer edge fills about 90% of the canvas. The whole inside of the box (the large empty opening) and everything outside the frame must be filled with flat solid #FF00FF magenta, so the opening will become transparent. The top edge of the box is open: no lid, no top bar. Art style: glossy cartoon sticker game art - thick clean black outline, soft top-left specular highlights, gentle cel shading, rounded shapes, no glow, halo or shadow outside the drawn shapes. No text, letters, numbers, logos, watermark or signature anywhere.
```

- **검수**: ① 좌우 대칭인가 ② 개구부가 마젠타로 완전히 채워졌는가 ③ 윗면이 열려 있는가 ④ 벽 안쪽 모서리가 곧은가 (개구부 bbox 측정이 쉬워야 한다).
- **재생성 문구**:

```text
Keep everything, but fix: the left and right walls are different thicknesses - make the frame perfectly symmetrical and keep the inside opening a clean straight-edged rectangle filled with flat magenta.
```

---

### 5-5. 합체 이펙트 (선택)

- **저장**: `tmp/minigame-src/grass-merge/burst.png` → `public/grass-merge-burst.webp` (512×512, 2×2 시트, 프레임 256×256)
- **🧵 스레드**: **스레드 B에서 이어서** — 5-4 결과를 받은 직후 같은 대화창에 전송. 레퍼런스 재첨부 불필요.
- **캔버스**: 1024×1024 정사각. 2열 × 2행.
- 이 이미지는 선택이다. 만들지 않으면 캔버스 파티클로 대체한다 (폴백).

```text
Using the reference images from the start of this conversation as style references, create ONE 2x2 animation sheet of a merge burst effect on a 1024x1024 canvas: 4 cells of 512x512, reading order left to right, top to bottom, exactly one frame per cell, centred, with at least 12% margin. Frame 1: a tiny bright white-gold star flash. Frame 2: the flash expands into an eight-point starburst with a thin mint #00e9ae ring. Frame 3: the ring is larger and thinner, small gold diamond sparkles and tiny green leaf shapes fly outward. Frame 4: only faint scattered sparkles and leaf shapes remain. All shapes are hard-edged cartoon shapes with a thin dark teal (#0b1614) outline, cel shaded, no soft glow, no blur, no gradients, no transparency effects. Flat solid #FF00FF magenta background and nothing spilling outside the shapes. No text, letters, numbers, logos, watermark or signature anywhere.
```

- **검수**: 4프레임이 같은 중심에서 커지는가, 셀 경계에 닿지 않는가, 흐림·후광 없이 마젠타 키가 깨끗이 빠지는가.
- **재생성 문구**:

```text
Keep everything, but fix: the frames are not centred at the same point - align the burst centre exactly to the middle of each cell.
```

## 6. 오디오

파일은 `public/`(BGM) 또는 `public/sfxes/`(효과음)에 mp3로 둔다. 재생은 `src/web/sfxAudio.ts`의 `playSfx(url, volume, onCreate?)`를 쓴다. 재생 실패는 `playSfx`가 무시하므로 파일이 없어도 조용히 넘어가고, 효과음은 한 번에 하나만 재생된다 (새 효과음이 이전 것을 끊음). 무료 소스를 쓸 때는 CC0/CC-BY 여부를 확인하고 출처를 커밋 메시지나 PR에 남긴다.

| 파일명 | 저장 위치 | 용도 | 검색 키워드 (한글 / 영어) |
| --- | --- | --- | --- |
| `grass-merge-bgm.mp3` | `public/` | 진행 중 반복 BGM (60~120초, 무보컬, 끊김 없는 루프) | `잔잔한 캐주얼 퍼즐 게임 BGM 루프`, `relaxed casual puzzle game music loop` |
| `grass-merge-drop.mp3` | `public/sfxes/` | 아이템 낙하 (0.2~0.4초) | `부드러운 톡 떨어지는 효과음`, `soft pop drop game sound effect` |
| `grass-merge-merge.mp3` | `public/sfxes/` | 합체 (0.3~0.6초). `playSfx`의 `onCreate`에서 `audio.playbackRate`를 단계에 따라 올려 재사용 | `귀여운 합체 뽕 효과음`, `cute bubble merge pop level up sound effect` |
| `grass-merge-gameover.mp3` | `public/sfxes/` | 종료 (1~1.5초) | `축구 경기 종료 휘슬 짧은`, `short football full time whistle game over` |

## 7. 구현 순서 · 완료 기준

1. `grassMergeEngine.ts` + `grassMergeEngine.test.ts` (3-3 항목 전부). 여기서 물리 상수를 다듬는다.
2. `storage.ts` 키·함수 추가, `useGrassMergeGame.ts`, Sfx·Music 훅.
3. `GrassMergeCanvas.tsx` + `GrassMergeModal.tsx` + `grass-merge.css`. **에셋 없이 폴백 렌더로 먼저 완성한다.**
4. 3-4의 등록 4곳(+저장)을 반영한다.
5. 3-5의 온라인 순위 연동: `SCORE_GAMES["grass-merge"].max` 조정, 모달에 `MinigameStage` + `RankingPanel` + `useRanking` 연결.
6. 이미지: 9-1 현황대로 원본 5장이 이미 있으므로 `pnpm convert:minigame-art -- grass-merge`로 변환하고 `grassMergeAssets.ts`가 잡는지 확인한다. `BOARD_INTERIOR`를 확정한다.
7. 오디오: 4개가 이미 `public/`에 있으므로 훅의 경로·`WARMUP_URLS`가 파일명과 일치하는지만 확인한다.
8. `pnpm typecheck`와 `pnpm test`를 통과시킨다. 브라우저 수동 확인은 사용자가 배포 후 직접 한다 (요청이 있을 때만 프리뷰).

완료 기준: 에셋 없이도 플레이 가능 · 종료 결과가 한 번만 보고되고 `ranking.report`도 그 한 곳에서만 호출됨 · 순위 패널이 모달 안(children)에 있어 클릭해도 모달이 안 닫힘 · `SCORE_GAMES["grass-merge"].max`가 근거 주석과 함께 조정됨 · Esc로 닫힘 · `prefers-reduced-motion`에서 이펙트 축소 · 메뉴 아이콘 24×24에서 판독 가능 · 다른 미니게임의 저장 키와 충돌 없음.

## 8. 후속 작업 (이번 범위 아님)

월드 오락실 기계 연동(랭크 임계값, 미션, `MinigameRoundResult` 보고, 월드 스타일 640×360 도트 에셋)은 별도 문서로 다룬다. 이 문서의 `onRoundEnd?` 시그니처는 그때를 위한 자리만 남겨 둔 것이다.

## 9. 에셋 현황 · 추가 에셋

### 9-1. 현황 (2026-09-21 확인)

이미지·오디오는 이미 준비돼 있다. **구현 세션은 이미지·오디오를 새로 만들지 않고, 아래 상태를 확인해 연결만 한다.**

| 구분 | 파일 | 상태 |
| --- | --- | --- |
| 원본 이미지 5장 | `tmp/minigame-src/grass-merge/` 의 `tiers-sheet.png` · `icon.png` · `board-frame.png` · `background.png` · `burst.png` | 있음 |
| 변환 결과 | `public/grass-merge-tier-01…11.webp` · `-icon` · `-board` · `-background` · `-burst` | 변환 스크립트(`pnpm convert:minigame-art -- grass-merge`)와 매니페스트 항목은 있음. **`public/`에 webp가 아직 없으면 변환을 실행한다** (원본이 하나라도 없으면 스크립트가 멈춘다) |
| 오디오 4개 | `public/grass-merge-bgm.mp3`, `public/sfxes/grass-merge-drop.mp3` · `-merge.mp3` · `-gameover.mp3` | 있음 (6장 표와 파일명 일치) |

### 9-2. 추가로 필요한 에셋

**없음.** 구현 코드가 참조하는 파일(`grassMergeAssets.ts`, 훅의 오디오 경로)이 4장·6장 표와 일치한다.

### 9-3. 추가 에셋을 넣는 법

구현하다가 새 에셋이 필요해지면 **이 절 아래에 카드로 추가**한다. 카드는 5장과 같은 형식(저장 원본명 → 최종 파일명·규격, 🧵 스레드 지시, 첨부 레퍼런스, 스타일 문구를 전부 인라인한 프롬프트, 검수, 재생성 문구)이고 번호는 `9-A`, `9-B`…로 매긴다. 추가한 파일은 4장 표에도 한 줄 넣고 `scripts/minigame-art-manifest.json`의 `grass-merge` 항목에 등록한다. 새 카드가 없는 동안은 비워 둔다.
