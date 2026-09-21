# 축구 매치3 — 미니게임 기획 · 에셋 · 이미지 프롬프트

8×8 보드에서 인접한 축구 용품 두 칸을 맞바꿔 같은 것 3개 이상을 잇는 매치3 퍼즐이다. 시간이 아니라 **30턴** 안에 최대한 높은 점수를 낸다.
이 문서 하나만 읽고 다른 세션에서 구현·이미지 생성을 끝낼 수 있도록 자기완결로 쓴다. 다른 미니게임 문서: [minigame-grass-merge.md](minigame-grass-merge.md), [minigame-keeper-breakout.md](minigame-keeper-breakout.md). 서식 선례: [soccer-sum10-minigame-assets.md](soccer-sum10-minigame-assets.md).

**상태**: 기획 완료 · 구현 전 (2026-09-21). **범위**: 대시보드 왼쪽 아래 `미니게임` 메뉴만. 월드 오락실·랭크·미션 연동은 후속 작업이다.

## 0. 한눈에 보기

| 항목 | 내용 |
| --- | --- |
| 게임 id / 메뉴 라벨 | `football-match3` / `축구 매치3` |
| 장르 | 스왑 매치3 퍼즐 |
| 사과게임(합 10)과의 차이 | 사과게임은 드래그 박스로 숫자 합을 만드는 **60초 시간제**. 이 게임은 인접 교환 + 연쇄 + 특수 타일의 **30턴 제한제**라 조작·목표·리듬이 다르다 |
| 조작 | 타일 클릭 후 인접 타일 클릭, 또는 이웃 방향으로 드래그. 키보드 커서(←↑→↓ 이동, Space 선택, 방향키로 교환)도 지원. 데스크톱 전용 |
| 종료 조건 | 남은 턴 0 (마지막 교환의 연쇄가 모두 끝난 뒤) |
| 점수 | 타일 1개 제거 10점 + 4연속 +20, 5연속 +50, 특수 발동 타일당 +10, 연쇄 배수 ×(1 + 0.5 × (연쇄 − 1)) 최대 ×3 |
| 저장 | 최고 점수 `fc26-football-match3-highscore` (localStorage) |
| 온라인 순위 | [minigame-ranking.md](minigame-ranking.md)의 공용 시스템에 연결. `SCORE_GAMES["football-match3"]`는 이미 등록돼 있고(`max`는 임시값 1,000,000), 모달에 `useRanking` + `RankingPanel`을 붙인다 (3-5). 연쇄 배수 때문에 이론 상한은 비현실적으로 커서 **봇 시뮬레이션으로 현실적인 `max`를 잡는다** |
| 구현 방식 | 순수 엔진(매치 탐지·낙하·리필·특수 타일·시드 RNG) + 애니메이션은 렌더 계층이 결과 스텝을 재생. 새 의존성 없음 |
| 에셋 | 이미지 6장 생성(스레드 2개), 오디오 6개. **에셋이 없어도 CSS/Canvas 폴백으로 동작** |
| 이미지 스타일 | 광택 카툰 스티커 (두꺼운 검정 외곽선). 월드의 픽셀아트가 **아님** |

## 1. 규칙 · 조작 · 화면

### 1-1. 규칙

1. 보드는 8×8, 타일은 6종. 시작 보드에는 이미 완성된 3연속이 없고, 가능한 교환이 최소 1개 있다.
2. 인접한 두 칸(상하좌우)을 교환한다. 교환 결과 3연속 이상이 생기거나 특수 타일이 발동해야 유효하다. 유효하지 않으면 교환이 되돌려지고 턴이 줄지 않는다.
3. 유효한 교환 1회 = 1턴. 가로·세로로 같은 종류 3개 이상이 이어지면 제거되고, 위 타일이 떨어지고, 빈 곳은 새 타일로 채워진다. 새로 생긴 3연속도 자동으로 제거된다 (연쇄).
4. 남은 턴이 0이 되고 연쇄가 끝나면 종료. 보드에 가능한 교환이 없으면 자동으로 섞는다 (턴 소모 없음, 특수 타일은 유지).
5. 결과 화면에 별 1~3개: 점수 1500 / 3000 / 5000 이상 (구현 세션에서 플레이해 보고 조정).

### 1-2. 타일 6종

| id | 이름 | 실루엣 | 색 | 이미지 파일 접미사 |
| --- | --- | --- | --- | --- |
| 0 | 축구공 | 원형 | 흰색·검정 | `ball` |
| 1 | 유니폼 | T셔츠형 | 민트 | `jersey` |
| 2 | 축구화 | 길쭉한 신발형 | 주황 | `boots` |
| 3 | 휘슬 | 작은 원통+고리 | 금색 | `whistle` |
| 4 | 장갑 | 손 모양 | 파랑 | `glove` |
| 5 | 레드카드 | 세로 직사각형 | 빨강 | `redcard` |

색맹 사용자와 작은 크기를 고려해 **색과 실루엣이 모두 다르게** 만든다.

### 1-3. 특수 타일

| 만드는 조건 | 결과 | 발동 |
| --- | --- | --- |
| 가로 4연속 | `line-h` (같은 색 타일 + 가로 화살표 덧그림) | 발동 시 그 행 전체 제거 |
| 세로 4연속 | `line-v` (같은 색 타일 + 세로 화살표 덧그림) | 발동 시 그 열 전체 제거 |
| 5연속 이상 | `golden` (황금 공) | 교환한 상대 타일과 같은 색을 보드 전체에서 제거. 황금 공끼리 교환하면 보드 전체 제거 |

- 특수 타일은 매치에 포함되거나 교환될 때 발동한다. 새 특수 타일은 **플레이어가 교환한 칸**(연쇄로 생겼으면 매치의 가운데 칸)에 생긴다.
- 세로 화살표는 가로 화살표 덧그림 이미지를 90° 회전해서 쓴다 (이미지 1장으로 둘 다 처리).
- L자·T자 모양 매치는 이번 범위에서 **일반 3연속처럼만** 처리한다 (특수 타일 없음). 나중 확장 후보.

### 1-4. 화면 구성 (모달 `wide`, 기존 `Modal` 셸 재사용)

- 헤더: `eyebrow "MINIGAME"` + 제목 `축구 매치3` + 한 줄 설명.
- **온라인 순위 패널이 모달 오른쪽 280px을 차지한다** (`MinigameStage`가 왼쪽 게임 / 오른쪽 `RankingPanel`로 나눔, 1000px 이하에서는 게임 아래로 쌓임). 게임 영역(왼쪽)은 `wide` 모달 기준 약 796px이므로 아래 HUD와 플레이 영역은 모두 이 안에 들어간다.
- HUD 뱃지(사과게임의 `.soccer-sum10-badge`와 같은 pill): 남은 턴 · 점수 · 최고 · 연쇄 표시(연쇄 2 이상일 때만 `연쇄 ×N` 팝).
- 플레이 영역: `aspect-ratio: 4 / 3`, 폭 최대 760px. 안에 보드 논리 512×512 캔버스(타일 64×64)를 세로 88% 크기로 가운데 배치, 그 뒤에 배경 이미지, 앞에 보드 프레임.
- 사운드: 기존 `SoundControl` 재사용.
- 시작/결과 패널: 사과게임의 시작 패널·결과 패널 패턴 (금색 pill 버튼). 결과에 별 표시.
- 5초간 입력이 없으면 가능한 교환 하나를 반짝이게 알려 준다 (캔버스로 그림, 이미지 불필요).

## 2. 레퍼런스

**코드는 복사하지 않는다.** 동작 방식만 참고해 자체 구현하고, 라이선스가 확인된 것만 구조 참고로 명시한다.

| 이름 | URL | 라이선스 | 참고할 것 | 쓰지 않을 것 |
| --- | --- | --- | --- | --- |
| remarkablegames/match3 (TS + Canvas + Vite) | https://github.com/remarkablegames/match3 | MIT (README 확인) | 스왑·연쇄·콤보 배수 흐름, 레벨/타임어택/무한 모드 구분, 터치·마우스·키보드 입력 지원 | 이모지 타일, js13k용 압축 구조, 유니콘 테마 |
| rembound/Match-3-Game-HTML5 (튜토리얼) | https://github.com/rembound/Match-3-Game-HTML5 | 미확인 | 클러스터 찾기 · 가능한 수 없음 검사 · 리필 알고리즘 설명 | 코드 |
| bazhanius/match-3-game (HTML5 canvas + JS) | https://github.com/bazhanius/match-3-game | 미확인 | 캔버스 렌더 분리 방식 | 코드 |

- 매치3는 장르 관행(Bejeweled, Candy Crush 계열)이라 규칙은 자유롭게 쓸 수 있다. 특정 게임의 이름·이미지·특수 캔디 디자인은 쓰지 않는다.
- 핵심 설계: **엔진은 교환 한 번에 대해 "스텝 배열"을 한꺼번에 계산해 돌려주고, 렌더 계층이 스텝을 하나씩 애니메이션으로 재생**한다. 그래야 엔진이 시간 개념 없이 순수 함수로 테스트된다.

## 3. 구현 설계

### 3-1. 파일 (사과게임 폴더 구조를 그대로 따른다)

| 파일 | 역할 |
| --- | --- |
| `src/web/minigame/football-match3/footballMatch3Engine.ts` | 순수 엔진. `createGame(seed)`, `trySwap(state, a, b)`, `findHint(state)`, `hasMoves(board)`, `shuffle(state)`. `Date`·`Math.random` 금지 |
| `src/web/minigame/football-match3/footballMatch3Engine.test.ts` | 엔진 테스트 (3-3) |
| `src/web/minigame/football-match3/FootballMatch3Canvas.tsx` | 캔버스 렌더, 스텝 재생 애니메이션(스왑·제거·낙하·스폰), 클릭/드래그/키보드 입력, 재생 중 입력 잠금 |
| `src/web/minigame/football-match3/useFootballMatch3Game.ts` | React 상태 (phase, 점수, 최고 점수, 남은 턴, 종료 결과 1회 보고 — 사과게임의 end-latch 패턴) |
| `src/web/minigame/football-match3/useFootballMatch3Sfx.ts` · `useFootballMatch3Music.ts` | `useSoccerSum10Sfx/Music` 복제 후 키 이름 교체 |
| `src/web/minigame/football-match3/FootballMatch3Modal.tsx` | 모달 셸. `onClose`, 선택적 `onRoundEnd?(result)` |
| `src/web/minigame/football-match3/football-match3.css` | 접두사 `.football-match3-*`, 폴백 색 필수 |
| `src/web/minigame/football-match3/footballMatch3Assets.ts` | 이미지 URL 상수와 `Image` 로더 (실패 시 `undefined` → 폴백 렌더) |

### 3-2. 엔진 데이터와 API (시작 설계)

```ts
type TileKind = "normal" | "line-h" | "line-v" | "golden";
interface Tile { color: 0 | 1 | 2 | 3 | 4 | 5; kind: TileKind }   // golden은 color 무시
type Board = (Tile | null)[];                                       // 길이 64, index = row * 8 + col

interface Step {
  swapped?: [number, number];                       // 첫 스텝에만
  removed: number[];                                // 이번 스텝에서 사라지는 칸 index
  created: { index: number; tile: Tile }[];         // 이번 스텝에서 새로 생기는 특수 타일
  fall: { from: number; to: number }[];             // 낙하 이동
  spawn: { index: number; tile: Tile }[];           // 위에서 새로 채워지는 타일
  gained: number;                                   // 이 스텝의 점수 (배수 적용 후)
  chain: number;                                    // 1부터 시작
}
type SwapResult = { ok: false } | { ok: true; steps: Step[]; shuffled: boolean };

interface FootballMatch3State { board: Board; score: number; movesLeft: number; phase: "playing" | "over"; rngState: number }
```

| 상수 | 값 |
| --- | --- |
| 보드 | 8×8, 타일 6종 |
| 논리 크기 | 512×512 (타일 64) |
| 시작 턴 | 30 |
| 힌트 대기 | 5초 |

### 3-3. 엔진 테스트 항목

1. `createGame(seed)`로 만든 보드에 3연속이 없고 유효한 교환이 최소 1개 있다 (시드 500개 표본).
2. 같은 시드 + 같은 교환 순서면 결과가 같다 (결정성).
3. 유효하지 않은 교환은 `ok: false`이고 보드·점수·턴이 그대로다. 비인접 칸 교환도 `ok: false`.
4. 3연속 제거 → 중력 → 리필 후 보드에 빈 칸(`null`)이 없다.
5. 연쇄가 2단계 이상이면 `chain`이 1,2,3…으로 증가하고 배수가 적용된다 (최대 ×3).
6. 가로 4연속은 `line-h`, 세로 4연속은 `line-v`, 5연속은 `golden`을 교환한 칸에 만든다.
7. `line-h`/`line-v`가 발동하면 해당 행/열이 전부 제거된다. `golden`은 상대 색 전체를 제거하고, 황금 공끼리는 보드 전체를 제거한다.
8. 유효한 교환에서만 `movesLeft`가 1 줄고, 0이 되면 (연쇄 스텝 계산 후) `phase`가 `over`가 된다.
9. 가능한 교환이 없으면 자동 섞기 후 `shuffled: true`이고, 섞은 뒤에도 3연속이 없고 유효 교환이 있다. 특수 타일은 유지된다.
10. `findHint`가 돌려준 교환은 항상 유효하다.

### 3-4. 등록 4곳 체크리스트 (반드시 4곳 모두)

| 파일 | 위치 | 할 일 |
| --- | --- | --- |
| `src/web/minigame/MinigameMenu.tsx` | 8행 `MinigameId` | `"football-match3"` 추가 |
| 〃 | 75~94행 `games` 배열 | `{ id: "football-match3", label: "축구 매치3", icon: <img src="/football-match3-icon.webp" alt="" className="minigame-menu__icon" /> }` |
| 〃 | 14~35행 `WARMUP_URLS` | `/football-match3-bgm.mp3`, `/sfxes/football-match3-swap.mp3`, `/sfxes/football-match3-match.mp3` 추가 |
| `src/web/App.tsx` | 110행 `useState<…>` 유니온 | `"football-match3"` 추가 |
| 〃 | 427~455행 모달 렌더 | `{activeMinigame === "football-match3" && <FootballMatch3Modal onClose={() => setActiveMinigame(null)} />}` |
| `src/web/storage.ts` | 256~340행 사과게임 블록 | `fc26-football-match3-highscore`, `-sfx-enabled`, `-sfx-volume`, `-music-enabled`, `-music-volume` 키와 `load/save` 함수 쌍을 같은 try/catch 패턴으로 복제 |

- 로딩: 코드가 크지 않으면 정적 import, 메인 번들을 키우고 싶지 않으면 `FreekickModal`처럼 `lazy(() => import(...))` + `<Suspense fallback={null}>`(default export).
- 메뉴는 `max-width: 680px`에서 숨겨지므로 모바일 대응은 필요 없다.
- 순위 연동은 위 표의 등록과 별개로 3-5를 따른다. 순위 시스템 파일(`src/shared/minigame-scores.ts`의 다른 게임 줄, `src/worker*.ts`, `migrations/`, `src/web/minigame/ranking/*`)은 **수정하지 않는다** — 이 게임의 `SCORE_GAMES` 한 줄만 고친다.

### 3-5. 온라인 순위 연동 ([minigame-ranking.md](minigame-ranking.md) 레시피)

순위 시스템은 이미 있다 (Cloudflare Worker + D1, 게임×플레이어당 최고기록 1행). 이 게임이 할 일은 다음 셋이다. **D1 마이그레이션은 필요 없다** (허용 게임 목록은 `SCORE_GAMES` 코드이고 `scores` 테이블은 게임 공용).

1. **`SCORE_GAMES["football-match3"]`의 `max`를 현실적인 값으로 정한다** (`src/shared/minigame-scores.ts`). 지금은 임시값 1,000,000이다. 서버는 `min`~`max` 밖의 점수를 위조로 보고 거절하고, 클라이언트도 범위 밖이면 조용히 제출하지 않는다. 그래서 **너무 낮게 잡으면 정상 고득점이 등록되지 않는다.** 30턴 게임이지만 연쇄가 이론상 길게 이어질 수 있어 순수 계산으로는 상한이 의미 없게 커진다. 다음 순서로 정한다:
   - 엔진 테스트 파일에 시드 500~2000판을 도는 **탐욕 봇**(매 턴 유효한 교환 중 그 턴 점수가 가장 큰 것을 선택)을 만들어 관측 최고점을 얻는다 (테스트로 상시 돌리지 말고, 상한 검증용 1회 스크립트나 `it.skip`/작은 표본으로 둔다).
   - `max` = 관측 최고점 × 3 이상으로 올림 (사람이 봇보다 잘 두므로 여유를 크게). 시작값은 `60_000`이고, 봇 결과가 이 값의 1/3을 넘으면 올린다.
   - 값과 근거(봇 표본 수·관측 최고점·배율)를 `SCORE_GAMES` 줄 주석에 남긴다. `min`은 1 그대로 (0점은 제출되지 않는다).
2. **모달 연결** — `FootballMatch3Modal`:

```tsx
import { MinigameStage } from "../ranking/MinigameStage.js";
import { RankingPanel } from "../ranking/RankingPanel.js";
import { useRanking } from "../ranking/useRanking.js";
import { loadFootballMatch3HighScore } from "../../storage.js";

const ranking = useRanking("football-match3", () => loadFootballMatch3HighScore() || null); // 기존 localStorage 기록을 1회 등록할 수 있게
const game = useFootballMatch3Game({
  sfxOn, sfxVolume,
  onRoundEnd: (result) => {
    stopMusic();
    onRoundEnd?.(result);
    ranking.report(result.score); // 30턴 종료 때 정확히 1회. 더 좋을 때만 서버로 제출됨
  },
});
// …
<Modal … wide>
  <MinigameStage panel={<RankingPanel {...ranking.panel} />}>
    {/* 기존 게임 영역(HUD + 플레이 영역 + 시작/결과 패널)을 그대로 여기 */}
  </MinigameStage>
</Modal>
```

3. **패널은 반드시 `Modal`의 children 안**에 둔다. `.modal` 밖에 두면 클릭이 backdrop으로 전달돼 모달이 닫힌다. 참고 구현: `src/web/minigame/soccer-sum10/SoccerSum10Modal.tsx`.

- 순위 서버가 없거나(`pnpm dev`만 켠 경우) 실패해도 게임은 정상 동작하고 패널만 "순위를 불러올 수 없어요"로 보인다. 게임 로직은 순위에 의존하면 안 된다.
- 종료 결과 보고는 `onRoundEnd`가 라운드당 한 번만 불리는 것(end-latch)에 기대므로, 그 한 곳에서만 `ranking.report`를 부른다. 마지막 턴의 연쇄 애니메이션이 모두 끝난 뒤에 불려야 한다.

> **세션 간 충돌 주의**: 미니게임 3종을 각각 다른 세션에서 구현하면 세 세션 모두 `MinigameMenu.tsx`, `App.tsx`, `storage.ts`의 같은 줄 부근을 수정한다. 하나씩 순서대로 머지하고, 나중 세션은 시작 전에 최신 `main`을 받아 라인 번호를 다시 확인한다. 위 줄 번호는 2026-09-21 기준이다.

## 4. 에셋 목록

모든 이미지는 `public/`에 웹피 파일로 둔다. 원본 PNG는 `tmp/minigame-src/football-match3/`에 저장한다. `.gitignore`에는 지금 `tmp/world-src/`만 있으므로 구현 세션에서 `tmp/minigame-src/` 줄을 추가해 원본이 커밋되지 않게 한다.

| 원본 저장 파일 (`tmp/minigame-src/football-match3/`) | 최종 파일 (`public/`) | 최종 규격 | 용도 | 폴백 |
| --- | --- | --- | --- | --- |
| `tiles-sheet.png` | `football-match3-tile-ball.webp` `-jersey` `-boots` `-whistle` `-glove` `-redcard` | 각 128×128 투명 | 타일 6종 | 타일별 색 원 + 첫 글자 |
| `specials-sheet.png` | `football-match3-special-line.webp`, `football-match3-special-golden.webp` | 각 128×128 투명 | 줄 폭발 덧그림(가로, 코드로 90° 회전), 황금 공 | 흰 화살표 도형, 금색 원 |
| `icon.png` | `football-match3-icon.webp` | 256×256 투명 | 메뉴 아이콘 · 모달 제목 아이콘 | ⚽ 이모지 (`minigame-menu__icon--fallback`) |
| `background.png` | `football-match3-background.webp` | 1280×960 (4:3) 불투명 | 플레이 영역 배경 | `#063d24` 잔디 그라데이션 |
| `board-frame.png` | `football-match3-board.webp` | 560×560 투명 (내부 개구부는 투명) | 보드 테두리 | 둥근 사각 CSS 테두리 |
| `sparkle.png` | `football-match3-sparkle.webp` | 512×512 투명, 2×2 시트(프레임 256²) | 제거 이펙트 (선택) | 캔버스 파티클 |

### 변환 안내

- 변환 스크립트는 아직 없다 (`public/*.webp`는 수동 배치). 구현 세션에서 `sharp`로 처리한다 (`sharp`는 devDependency에 이미 있음).
  1. `#FF00FF` 배경을 투명으로 (모서리 색 기준, 허용오차 약 40, 테두리 마젠타 번짐 제거).
  2. 시트는 셀별로 잘라 여백을 트림한 뒤 128×128 안에 비율 유지로 맞춤 (중앙 정렬).
  3. `webp({ quality: 92 })` 또는 무손실로 저장.
- 기존 `scripts/lib/world-art-math.mjs`의 마젠타 키·despill 헬퍼를 재사용하는 `scripts/convert-minigame-art.mjs`를 만들면 다른 두 게임과 공유할 수 있다 (선택 선행 작업).
- 보드 프레임은 변환 후 **투명 개구부의 bbox를 측정해 `BOARD_INTERIOR` 상수를 확정**하고, 캔버스 위치를 그 값에 맞춘다. AI가 개구부를 정확히 512×512로 그려 주지 않기 때문이다.
- 선택 링·힌트 반짝임·연쇄 팝 글자는 이미지 없이 캔버스/CSS로 그린다.

## 5. 이미지 생성 카드

생성 도구는 ChatGPT gpt-image(레퍼런스 이미지 첨부 가능). **각 카드는 단독으로 복사해 쓸 수 있게 스타일 문구를 전부 안에 담았다.** 프롬프트 코드블록만 통째로 붙여넣으면 된다.

### 스레드 구성

| 스레드 | 만드는 이미지 | 이유 |
| --- | --- | --- |
| **스레드 A** (새 대화) | 5-1 타일 시트 → 5-2 특수 타일 시트 → 5-3 아이콘 | 타일·특수 타일·아이콘은 같은 그림체와 채도로 이어져야 한다. 5-1 결과가 스타일 앵커가 된다 |
| **스레드 B** (새 대화) | 5-4 배경 → 5-5 보드 프레임 → 5-6 이펙트 | 환경 이미지는 타일 그림체를 기억할 필요가 없고, 스레드 A에 섞으면 컨텍스트가 길어져 스타일이 흔들린다 |

- 결과가 마음에 들지 않으면 같은 스레드에서 각 카드의 **재생성 문구**로 고친다. 3번 이상 고쳐도 안 되면 새 스레드에서 프롬프트를 처음부터 다시 붙여넣는다.
- 첨부 레퍼런스 3장은 스레드마다 첫 메시지에만 첨부한다: `public/soccer-sum10-icon.webp`, `public/goalpost.webp`, `public/soccer_ball.webp`.

---

### 5-1. 타일 시트 (타일 6종)

- **저장**: `tmp/minigame-src/football-match3/tiles-sheet.png` → `public/football-match3-tile-ball.webp` 외 5종 (각 128×128)
- **🧵 스레드**: **새 스레드 A 시작** — 이 카드가 스레드 A의 첫 메시지다.
- **첨부**: `public/soccer-sum10-icon.webp`, `public/goalpost.webp`, `public/soccer_ball.webp` 3장을 프롬프트와 같은 메시지에 첨부.
- **캔버스**: 1536×1024 가로. 3열 × 2행 (6칸, 각 512×512).

```text
Using the three attached images as exact style references, create ONE sprite sheet of six match-3 puzzle tiles with a football theme. Canvas 1536x1024 landscape. Strict grid of 3 columns x 2 rows (6 cells, each 512x512). Exactly one item per cell, centred, its longest side filling about 78% of the cell, with at least 12% empty margin inside every cell. No cell borders, no grid lines. Reading order left to right, top to bottom:
1. a classic black-and-white soccer ball, round.
2. a mint (#00e9ae) football jersey T-shirt with a white collar and white sleeve trim, front view, no number and no logo.
3. a single bright orange football boot with white studs and white laces, side view, toe pointing right.
4. a shiny gold referee whistle with a small black lanyard ring, side view.
5. a bright blue goalkeeper glove with a white palm and white cuff, fingers pointing up.
6. a glossy red referee red card, a tall rounded rectangle tilted slightly to the right.
The six items must have clearly different silhouettes AND clearly different main colours (white-black, mint, orange, gold, blue, red) so they can be told apart at a small size, and all six must look like they belong to the same set with the same outline thickness. Art style: glossy cartoon sticker game art matching the attached reference images exactly - thick clean black outline, soft top-left specular highlights, gentle cel shading, rounded friendly shapes, saturated but not neon colours. Flat solid #FF00FF magenta background with no gradient, no floor shadow, and no glow, halo or shadow outside the drawn shapes. No text, letters, numbers, logos, watermark or signature anywhere.
```

- **검수**: ① 6칸이 모두 채워졌고 칸 경계에서 떨어져 있는가 ② 실루엣과 주색이 6개 모두 다른가 (특히 유니폼 민트 ↔ 장갑 파랑) ③ 외곽선 굵기·광택이 같은 세트로 보이는가 ④ 유니폼에 숫자·로고가 없는가 ⑤ 배경에 마젠타 외 색·그림자·후광이 없는가.
- **재생성 문구** (같은 스레드에서 상황에 맞게 골라 붙여넣기):

```text
Keep everything, but fix: the mint jersey and the blue glove look too close in colour - make the jersey a clearly greener mint (#00e9ae) and the glove a clearly deeper royal blue.
```

```text
Keep everything, but fix: remove the number and the logo from the jersey, and remove the glow and drop shadow that spill onto the magenta background.
```

---

### 5-2. 특수 타일 시트 (2종)

- **저장**: `tmp/minigame-src/football-match3/specials-sheet.png` → `public/football-match3-special-line.webp`, `public/football-match3-special-golden.webp` (각 128×128)
- **🧵 스레드**: **스레드 A에서 이어서** — 5-1 결과를 받은 직후 같은 대화창에 그대로 전송. 레퍼런스 재첨부 불필요 (이미 첨부되어 있고 5-1 결과도 스타일 앵커로 남아 있다).
- **캔버스**: 1024×1024 정사각. 2열 × 2행 (각 512×512). 위 행 2칸만 사용.

```text
Using the three reference images from the start of this conversation and the tile sheet you just made as exact style references, create ONE sprite sheet of two special puzzle pieces on a 1024x1024 canvas. Strict grid of 2 columns x 2 rows (4 cells, each 512x512). Only the top row is used: exactly one item in each of the top two cells, centred, filling about 84% of the cell width, with at least 8% empty margin. The two bottom cells stay completely empty magenta.
Top left: a horizontal blast band overlay, a bold white double-headed arrow pointing left and right with a thin mint (#00e9ae) inner stripe and three small curved sound-wave arcs on each end, drawn as solid opaque shapes with the same thick black outline, meant to be laid over a tile.
Top right: a glossy golden soccer ball, the richest and most eye-catching item of the set, with small multi-coloured star sparkles (mint, pink, blue, yellow) around it, all sparkles drawn as solid hard-edged shapes with a black outline.
Art style: glossy cartoon sticker game art matching the reference images exactly - thick clean black outline, soft top-left specular highlights, gentle cel shading, rounded friendly shapes, saturated but not neon colours. Flat solid #FF00FF magenta background with no gradient, no floor shadow, and no glow, halo or shadow outside the drawn shapes. No text, letters, numbers, logos, watermark or signature anywhere.
```

- **검수**: 화살표 덧그림이 좌우 대칭이고 가로로 곧은가 (코드가 90° 회전해 세로로도 쓴다), 황금 공이 일반 축구공 타일과 확실히 구분되는가, 아래 두 칸이 비었는가.
- **재생성 문구**:

```text
Keep everything, but fix: make the blast band perfectly symmetrical left to right and perfectly horizontal, with bolder shapes so it is readable at 128x128 pixels.
```

---

### 5-3. 메뉴 아이콘

- **저장**: `tmp/minigame-src/football-match3/icon.png` → `public/football-match3-icon.webp` (256×256)
- **🧵 스레드**: **스레드 A에서 이어서** — 5-2 결과를 받은 직후 같은 대화창에 전송. 레퍼런스 재첨부 불필요.
- **캔버스**: 1024×1024 정사각.

```text
Using the three reference images from the start of this conversation and the sheets you already made as exact style references, create ONE menu icon on a 1024x1024 square canvas: a big shiny soccer ball in the centre, with a gold referee whistle and a blue goalkeeper glove tucked behind it at the lower left and lower right, and one bright four-point sparkle star at the upper right, like a match-3 puzzle group. Centred, filling about 80% of the canvas, with at least 10% empty margin on every side. It must read clearly at 24x24 pixels: bold simple shapes, strong silhouette, no tiny details. Art style: glossy cartoon sticker game art matching the reference images exactly - thick clean black outline, soft top-left specular highlights, gentle cel shading, rounded friendly shapes, saturated but not neon colours. Flat solid #FF00FF magenta background with no gradient, no floor shadow, and no glow, halo or shadow outside the drawn shapes. No text, letters, numbers, logos, watermark or signature anywhere.
```

- **검수**: 24×24에서 공 + 휘슬 + 장갑 덩어리가 읽히는가, 사과게임 아이콘과 같은 결인가, 배경에 마젠타 외 요소가 없는가.
- **재생성 문구**:

```text
Keep everything, but fix: remove the whistle and glove, keep only the soccer ball with the sparkle star, larger and with a thicker outline so it is readable at 24x24 pixels.
```

---

### 5-4. 플레이 영역 배경

- **저장**: `tmp/minigame-src/football-match3/background.png` → `public/football-match3-background.webp` (중앙 4:3으로 크롭 후 1280×960)
- **🧵 스레드**: **새 스레드 B 시작** — 이 카드가 스레드 B의 첫 메시지다. 스레드 A와 섞지 않는다.
- **첨부**: `public/soccer-sum10-icon.webp`, `public/goalpost.webp`, `public/soccer_ball.webp` (분위기와 그림체 기준).
- **캔버스**: 1536×1024 가로. 배경은 마젠타가 아니라 그림 전체가 배경이다 (불투명).

```text
Using the three attached images only as a loose style and mood reference, create ONE background illustration for a casual match-3 puzzle game, canvas 1536x1024 landscape, no transparency. Scene: a cosy football club locker room seen from the front and softly out of focus, a row of mint-green lockers along the back wall, a warm wooden bench and a few hanging scarves and blurred kit shapes at the sides, warm ceiling light from the top, a soft dark teal (#0b1614) vignette around the edges. The central 65% of the image must stay calm, low-contrast and uncluttered because a square puzzle board will be drawn on top of it, and it should be a bit darker than the edges so bright tiles stand out. Painted glossy cartoon game-art look with gentle soft shading, saturated but not neon colours. No readable players, no characters, no text, letters, numbers, logos, scoreboard, watermark or signature.
```

- **검수**: ① 중앙이 비어 있고 살짝 어두운가 ② 사물이 흐릿해서 타일과 경쟁하지 않는가 ③ 인물·글자·로고가 없는가 ④ 3:2를 4:3으로 좌우 크롭해도 구도가 괜찮은가.
- **재생성 문구**:

```text
Keep everything, but fix: the centre is too busy and too bright - blur and darken the middle 65%, remove any sharp objects there, and keep the detail only near the edges.
```

---

### 5-5. 보드 프레임

- **저장**: `tmp/minigame-src/football-match3/board-frame.png` → `public/football-match3-board.webp` (560×560, 개구부 투명)
- **🧵 스레드**: **스레드 B에서 이어서** — 5-4 결과를 받은 직후 같은 대화창에 전송. 레퍼런스 재첨부 불필요.
- **캔버스**: 1024×1024 정사각.

```text
Using the three reference images from the start of this conversation as exact style references for outline and shading, create ONE square board frame for a puzzle game on a 1024x1024 canvas. The frame is a thick rounded-square border in deep teal (#0b1614) with a thin mint (#00e9ae) trim line along its inner edge and a small gold rivet in each of the four corners. The frame border is perfectly symmetrical on all four sides and about 5% of the frame width thick, and the outer edge of the frame fills about 96% of the canvas. The whole inside of the frame (a large square opening) and everything outside the frame must be filled with flat solid #FF00FF magenta, so the opening will become transparent. The inner opening edges are clean straight lines with small rounded corners. Art style: glossy cartoon sticker game art matching the reference images - thick clean black outline around the frame, soft top-left specular highlights, gentle cel shading, no glow, halo or shadow outside the drawn shapes. No text, letters, numbers, logos, watermark or signature anywhere.
```

- **검수**: ① 네 변의 두께가 같은가 ② 개구부가 마젠타로 완전히 채워졌는가 ③ 안쪽 모서리가 곧은 선인가 (개구부 bbox 측정이 쉬워야 한다) ④ 프레임 바깥에 그림자·후광이 없는가.
- **재생성 문구**:

```text
Keep everything, but fix: the four sides are different thicknesses - make the frame perfectly symmetrical and keep the inside opening a clean straight-edged square filled with flat magenta.
```

---

### 5-6. 제거 이펙트 (선택)

- **저장**: `tmp/minigame-src/football-match3/sparkle.png` → `public/football-match3-sparkle.webp` (512×512, 2×2 시트, 프레임 256×256)
- **🧵 스레드**: **스레드 B에서 이어서** — 5-5 결과를 받은 직후 같은 대화창에 전송. 레퍼런스 재첨부 불필요.
- **캔버스**: 1024×1024 정사각. 2열 × 2행.
- 이 이미지는 선택이다. 만들지 않으면 캔버스 파티클로 대체한다 (폴백).

```text
Using the reference images from the start of this conversation as style references, create ONE 2x2 animation sheet of a tile-pop effect on a 1024x1024 canvas: 4 cells of 512x512, reading order left to right, top to bottom, exactly one frame per cell, centred, with at least 12% margin. Frame 1: a tiny bright white star flash. Frame 2: the flash grows into a six-point star with a thin mint #00e9ae ring. Frame 3: the ring is larger and thinner, small gold and mint confetti pieces and tiny star shapes fly outward. Frame 4: only a few faint scattered confetti pieces remain. All shapes are hard-edged cartoon shapes with a thin dark teal (#0b1614) outline, cel shaded, no soft glow, no blur, no gradients, no transparency effects. Flat solid #FF00FF magenta background and nothing spilling outside the shapes. No text, letters, numbers, logos, watermark or signature anywhere.
```

- **검수**: 4프레임이 같은 중심에서 커지는가, 셀 경계에 닿지 않는가, 흐림·후광 없이 마젠타 키가 깨끗이 빠지는가.
- **재생성 문구**:

```text
Keep everything, but fix: the frames are not centred at the same point - align the pop centre exactly to the middle of each cell.
```

## 6. 오디오

파일은 `public/`(BGM) 또는 `public/sfxes/`(효과음)에 mp3로 둔다. 재생은 `src/web/sfxAudio.ts`의 `playSfx(url, volume, onCreate?)`를 쓴다. 재생 실패는 `playSfx`가 무시하므로 파일이 없어도 조용히 넘어가고, 효과음은 한 번에 하나만 재생된다 (새 효과음이 이전 것을 끊음). 무료 소스를 쓸 때는 CC0/CC-BY 여부를 확인하고 출처를 커밋 메시지나 PR에 남긴다.

| 파일명 | 저장 위치 | 용도 | 검색 키워드 (한글 / 영어) |
| --- | --- | --- | --- |
| `football-match3-bgm.mp3` | `public/` | 진행 중 반복 BGM (60~120초, 무보컬, 끊김 없는 루프) | `밝은 캐주얼 퍼즐 게임 BGM 루프`, `bright casual match-3 puzzle game music loop` |
| `football-match3-swap.mp3` | `public/sfxes/` | 타일 교환 (0.1~0.2초) | `짧은 슥 스왑 효과음`, `short swipe swap sound effect ui` |
| `football-match3-match.mp3` | `public/sfxes/` | 매치 제거 (0.3~0.6초). `playSfx`의 `onCreate`에서 `audio.playbackRate`를 연쇄 수에 따라 올려 재사용 | `반짝이는 매치 성공 효과음`, `sparkly match-3 clear pop sound effect` |
| `football-match3-invalid.mp3` | `public/sfxes/` | 유효하지 않은 교환 되돌림 | `짧은 실패 삑 소리 게임 UI`, `soft game ui error blip` |
| `football-match3-special.mp3` | `public/sfxes/` | 특수 타일 생성·발동 (0.5~1초) | `휘슬 후 폭발하는 파워업 효과음`, `whistle blast power up burst sound effect` |
| `football-match3-end.mp3` | `public/sfxes/` | 30턴 종료 (1~1.5초) | `축구 경기 종료 휘슬 짧은`, `short football full time whistle game over` |

## 7. 구현 순서 · 완료 기준

1. `footballMatch3Engine.ts` + `footballMatch3Engine.test.ts` (3-3 항목 전부). 스텝 배열 구조를 먼저 확정한다.
2. `storage.ts` 키·함수 추가, `useFootballMatch3Game.ts`, Sfx·Music 훅.
3. `FootballMatch3Canvas.tsx` (스텝 재생 애니메이션, 입력 잠금) + `FootballMatch3Modal.tsx` + `football-match3.css`. **에셋 없이 폴백 렌더로 먼저 완성한다.**
4. 3-4의 등록 4곳(+저장)을 반영한다.
5. 3-5의 온라인 순위 연동: 탐욕 봇으로 `SCORE_GAMES["football-match3"].max` 조정(근거 주석), 모달에 `MinigameStage` + `RankingPanel` + `useRanking` 연결.
6. 이미지를 6장 생성해 변환·배치하고 `footballMatch3Assets.ts`가 잡는지 확인한다. `BOARD_INTERIOR`를 확정한다. (이 게임의 에셋은 아직 생성 전이다. 앞의 두 게임처럼 원본이 `tmp/minigame-src/football-match3/`에 있는지 먼저 확인하고, 없으면 폴백 상태로 두고 보고한다.)
7. 오디오를 배치한다.
8. `pnpm typecheck`와 `pnpm test`를 통과시킨다. 브라우저 수동 확인은 사용자가 배포 후 직접 한다 (요청이 있을 때만 프리뷰).

완료 기준: 에셋 없이도 플레이 가능 · 애니메이션 재생 중 클릭이 무시됨 · 종료 결과가 한 번만 보고되고 `ranking.report`도 그 한 곳에서만 호출됨 · 순위 패널이 모달 안(children)에 있어 클릭해도 모달이 안 닫힘 · `SCORE_GAMES["football-match3"].max`가 봇 표본 근거 주석과 함께 조정됨 · Esc로 닫힘 · `prefers-reduced-motion`에서 이펙트 축소 · 메뉴 아이콘 24×24에서 판독 가능 · 다른 미니게임의 저장 키와 충돌 없음.

## 8. 후속 작업 (이번 범위 아님)

월드 오락실 기계 연동(랭크 임계값, 미션, `MinigameRoundResult` 보고, 월드 스타일 640×360 도트 에셋), L/T자 매치 특수 타일, 레벨/무한 모드는 별도 문서로 다룬다. 이 문서의 `onRoundEnd?` 시그니처는 그때를 위한 자리만 남겨 둔 것이다.
