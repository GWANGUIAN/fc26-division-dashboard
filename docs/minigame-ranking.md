# 미니게임 온라인 순위

미니게임 최고기록을 닉네임과 함께 서버에 제출하고, 게임 모달 오른쪽 패널에서 TOP 10과 내 순위를 보여준다.
**AWS가 아니라 Cloudflare Worker + D1**을 쓴다(사이트가 이미 Worker라서 같은 오리진, CORS·토큰 불필요). D1 무료 한도를 넘으면 과금이 아니라 요청이 실패할 뿐이며, 그때 패널은 "순위를 불러올 수 없어요"로 저하된다.

## 구성

| 파일 | 역할 |
|---|---|
| `src/shared/minigame-scores.ts` | 게임 레지스트리 `SCORE_GAMES`(허용 목록·단위·정렬·점수 범위), 닉네임 정제, 점수 검증, `hashPlayerId` |
| `src/shared/run-token.ts` | 런 토큰 서명·검증(HMAC-SHA256, Web Crypto) |
| `src/worker-scores.ts` | `/api/scores/*` 핸들러 (D1). `src/worker.ts`는 라우팅만 |
| `migrations/0001_scores.sql` | `scores` 테이블 — 게임×플레이어당 1행(본인 최고기록) |
| `src/web/minigame/ranking/` | `useRanking`(상태·제출), `RankingPanel`(UI), `MinigameStage`(좌 게임 / 우 패널 레이아웃), `scoreApi`, `shouldSubmit` |
| `src/web/storage.ts` | `fc26-player-id`(비밀 기기 ID), `fc26-player-nickname`, `fc26-score-submitted-<game>` |

### API

| 요청 | 설명 | 캐시 |
|---|---|---|
| `GET /api/scores/:game?limit=10` | `{order, unit, total, entries:[{rank,key,name,score}]}` | 엣지 30초 (점수 등록 시 `limit=10` 키 삭제) |
| `GET /api/scores/:game/me?k=<playerKey>` | `{rank, score, name}` 또는 `{rank:null}` | no-store |
| `POST /api/scores/:game/start` `{pid}` | 서명된 런 토큰 발급 `{token}` (토큰을 안 쓰는 게임·시크릿 미설정이면 `null`) | no-store |
| `POST /api/scores/:game` `{pid,name,score,token?}` | 검증 → 더 좋을 때만 갱신 → `{improved,rank,total,best}` | no-store |
| `POST /api/scores/:game/rename` `{pid,name}` | 점수는 건드리지 않고 이 플레이어의 모든 게임 닉네임 변경 `{changed}` (토큰 불필요) | no-store |

- **신원**: 클라이언트가 만든 `pid`(UUID)가 쓰기 권한이고, 서버에는 `sha256(pid)`(=`player_key`)만 저장한다. 목록에는 key만 나가므로 남이 내 기록을 덮어쓸 수 없다. 기기를 바꾸거나 저장소를 지우면 새 신원이 된다(로그인 없는 설계의 한계).
- **동점**은 먼저 달성한 사람이 상위. 카드 짝 맞추기처럼 낮을수록 좋은 게임은 `order: "asc"`로 등록하면 서버가 `rank_score`를 부호 반전해 저장한다.
- **기본 방어**: 게임 허용목록, 점수 정수·범위(`min`/`max`), 닉네임 2~12자·허용 문자·금칙어, 본문 ≤1KB, JSON만, `Origin`이 같은 오리진(또는 localhost)일 것, 같은 플레이어·게임 5초 쿨다운(429 `too_frequent`).
- **닉네임 금지어 필터** (`src/shared/nickname-filter.ts`, 서버와 클라이언트가 같은 코드를 쓴다): 금지어가 들어 있으면 서버가 `blocked_nickname`(400)으로 거부하고, 형식 오류(`invalid_nickname`)와 구분해 화면에 "사용할 수 없는 단어가 포함되어 있어요"를 띄운다. 등록과 닉네임 변경 모두에 적용된다.
  - **단어 목록**(모두 공개 목록을 복사해 생성한 파일, 머리말에 출처·변경점 기록):
    `nickname-blocklist-ldnoobw.ts` — [LDNOOBW](https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words) 한국어 72개·영어 403개(CC BY 4.0, 노모·유모·망가 포함, 수정 없이 그대로),
    `nickname-blocklist-badwords-ko.ts` — [badwords-ko](https://github.com/yoonheyjung/badwords-ko)(MIT) 한글 항목,
    `nickname-blocklist-slang.ts` — [korean-profanity-resources](https://github.com/Tanat05/korean-profanity-resources)의 `slang.csv` 한글 항목(중국어·일본어 제외). 이 파일에는 게임사 채팅 필터 잔재(게임·회사·직원·정치인 이름, 시간·박사·개발자 같은 일상어)가 섞여 있어 그런 항목은 걸러냈다.
    직접 관리하는 `nickname-blocklist-extra.ts` — 변형 표기, 초성 약어, 선정·혐오 표현, 영타 입력("tlqkf") 등.
  - **우회 대응**: 이름과 단어를 모두 자모로 분해해 비교한다. 띄어쓰기·숫자·기호("씨 1 발", "씨.발"), 자모 분리("ㅅㅣㅂㅏㄹ"), 모음 늘이기("시이이발"), 영문 변형("f.u_c-k", "sh1t")을 잡는다. 초성 약어(ㅅㅂ, ㅂㅅ 등)는 **직접 입력한 자모에만** 적용해서 "옷발" 같은 정상 이름은 걸리지 않는다.
  - **영어 짧은 단어**(4글자 이하)는 단독 단어일 때만 막는다("ass"는 막고 "Assassin"·"Classic"은 통과). 부분 일치로 막아도 정상 단어가 없는 것(fuck, shit, porn, sex …)만 `SUBSTRING_SHORT_LATIN`에 있다.
  - **단어 추가/예외**: 막고 싶은 단어는 `EXTRA_KO`/`EXTRA_EN`에, 정상 이름이 잘못 걸리면 `ALLOWED_PHRASES`에 넣는다(그 구절만 검사 전에 잘라내므로 "시바견"은 통과하고 "시바견씨발"은 막힌다). `nickname-filter.test.ts`가 `roster.yaml`의 모든 스트리머 이름이 통과하는지 확인하므로, 새 스트리머 이름이 걸리면 테스트가 알려 준다. 생성 파일은 직접 고치지 않는다.
  - **한계**: 한국어는 부분 일치라 "보지마"처럼 금지어가 들어간 정상 문장도 막힌다(엄격한 쪽을 택함). 새로운 은어·신조어는 목록에 없으면 통과하므로 눈에 띄면 위의 운영 SQL로 지우고 단어를 추가한다.
- **런 토큰(시간 증명)**: `SCORE_GAMES[game].timing`이 있는 게임은 제출에 토큰이 필요하다. 토큰 = `발급시각.HMAC(비밀키, game|playerKey|발급시각)`이라 저장소가 필요 없고 다른 플레이어·게임에는 쓸 수 없다. 서버는 **발급 후 실제 경과 시간**으로 `경과 ≥ minRunMs` 그리고 `경과 ≥ 점수 × minMsPerUnit`을 검사하고(`implausible_score`), `tokenTtlMs`가 지난 토큰은 거부한다(`token_expired`). 즉 콘솔에서 점수를 바로 POST할 수 없고 "그 점수만큼의 시간을 기다려야" 한다. 클라이언트(`useRanking`)는 모달을 열 때와 매 라운드가 끝날 때 토큰을 새로 받는다.
  - 기준값: kickups 히트당 200ms / freekick 골당 1200ms / 사과게임 점수당 200ms(최소 30초) / 카드 짝 맞추기 턴당 600ms(최소 8초).
  - **비밀키 `SCORE_TOKEN_SECRET`(Worker secret)이 없으면 토큰을 발급도 요구도 하지 않는다**(예전 동작). 그래서 코드를 먼저 배포하고 나중에 시크릿을 넣어도 안전하다.
  - 토큰이 켜지면 "내 예전 로컬 기록 등록" 카드는 뜨지 않는다(시간 증명이 불가능하므로 다시 플레이해서 갱신).
- **IP별 요청 제한**: 엣지 캐시 카운터로 IP당 분당 점수/닉네임 쓰기 30회, 런 시작 60회(`rate_limited`, 429). 데이터센터별 best-effort라 완벽하진 않지만 무료이고 D1 쓰기를 쓰지 않는다. 로컬 개발(IP 헤더 없음)에서는 꺼진다.
- **한계**: 토큰은 "시간 비용"을 강제할 뿐 게임을 실제로 플레이했다는 증명은 아니다. 스크립트로 기다렸다가 상한 근처 점수를 보내는 것은 여전히 가능하고, 카드 짝 맞추기·매치3처럼 시간과 점수의 관계가 약한 게임은 효과가 작다. 눈에 띄는 위조는 아래 "운영"의 SQL로 지운다. 더 강하게 막으려면 Cloudflare WAF 레이트리밋 규칙(POST `/api/scores/*`)을 대시보드에서 추가한다.

## 최초 설정 (운영) — 완료

2026-09-21에 D1 `fc26-minigame-scores`(APAC)를 만들고 `wrangler.toml`에 `DB` 바인딩을 넣었으며 `0001_scores.sql`을 원격에 적용했다. 새 환경(다른 계정 등)에서 다시 만들 때만 아래 순서를 따른다.

1. `npx wrangler d1 create fc26-minigame-scores` → 출력된 `database_id`를 `wrangler.toml`의 `[[d1_databases]]`에 넣는다(바인딩 이름은 `DB` 유지).
2. 스키마를 **배포 전에** 원격에 적용한다. Cloudflare Git 연동은 마이그레이션을 실행하지 않는다.

```bash
npx wrangler d1 migrations apply fc26-minigame-scores --remote
```

3. 런 토큰 비밀키를 넣는다(값은 어디에도 남기지 않는다). **코드가 배포된 뒤에** 넣는 게 안전하다 — 클라이언트가 토큰을 보내기 전에 켜면 이전 버전 화면의 제출이 `token_required`로 거부된다.

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" | npx wrangler secret put SCORE_TOKEN_SECRET
```

4. push → 자동 배포. 바인딩이 없으면 사이트는 정상이고 `/api/scores/*`만 503이다. 배포 로그의 `--env` 권고 경고는 `env.dev`(로컬 개발용) 때문이며 무시해도 된다.
5. 토큰을 끄려면 `npx wrangler secret delete SCORE_TOKEN_SECRET`. 비밀키를 바꾸면 이미 발급된 토큰은 모두 무효가 되고(클라이언트는 다음 라운드에 새로 받음) 저장된 순위에는 영향이 없다.

## 로컬 개발

```bash
pnpm db:migrate:local   # 최초 1회: 로컬 D1(.wrangler/state)에 스키마 적용
pnpm dev:api            # 127.0.0.1:8787 에서 Worker + 로컬 D1
pnpm dev                # 별도 터미널. vite가 /api/scores 를 8787로 프록시
```

런 토큰까지 로컬에서 시험하려면 저장소 루트에 `.dev.vars`(gitignore 됨)를 만들고 `SCORE_TOKEN_SECRET=아무값`을 넣은 뒤 `pnpm dev:api`를 다시 시작한다. 없으면 토큰 검사는 꺼진 채로 동작한다.

`/api/scores`를 운영으로 프록시하지 않는 이유: 개발 중 점수가 실제 순위표에 들어가기 때문이다. `pnpm dev:api` 없이 `pnpm dev`만 켜면 패널이 오류 상태로 보일 뿐 게임은 정상 동작한다.

## 운영

```bash
# 행 확인 / 부정 기록 삭제 / 닉네임 정리 (원격)
npx wrangler d1 execute fc26-minigame-scores --remote --command "SELECT game, nickname, score FROM scores ORDER BY game, rank_score DESC LIMIT 50"
npx wrangler d1 execute fc26-minigame-scores --remote --command "DELETE FROM scores WHERE game = 'kickups' AND nickname = '문제닉네임'"
```

삭제 직후 최대 30초는 엣지 캐시에 남아 있을 수 있다. 무료 한도는 대시보드의 D1/Workers 사용량에서 확인한다(쓰기 10만 행/일, 읽기 500만 행/일, Workers 요청 10만/일).

## 새 미니게임에 순위 붙이기 (레시피)

1. `SCORE_GAMES`에 한 줄 추가 (`order`, `unit`, 현실적인 `min`/`max` — 엔진에서 이론상 상한을 계산해 넣는다). 서버 허용목록을 겸하므로 이게 없으면 제출이 404다.
2. 모달에서:

```tsx
const ranking = useRanking("grass-merge", () => loadGrassMergeHighScore() || null); // 낮을수록 좋은 게임은 null 가능한 loader
const game = useGrassMergeGame({
  onRoundEnd: (result) => {
    onRoundEnd?.(result);
    ranking.report(result.score); // 라운드 종료 때 1회. 더 좋을 때만 제출된다
  },
});
// ...
<Modal ... wide>
  <MinigameStage panel={<RankingPanel {...ranking.panel} />}>
    {/* 기존 게임 영역 그대로 */}
  </MinigameStage>
</Modal>
```

3. 런 토큰을 쓰려면 `SCORE_GAMES` 항목에 `timing: { minRunMs, minMsPerUnit, tokenTtlMs }`를 추가한다. 엔진에서 "이보다 빠를 수 없다"는 속도(점수 1점에 걸리는 최소 시간, 라운드 최소 길이)를 보수적으로 잡는다. 훅이 토큰 발급·전송을 알아서 하므로 모달 코드는 바뀌지 않는다. `timing`이 없으면 토큰 없이 제출된다(상한 검증만).
4. 패널은 반드시 `Modal`의 children 안에 둔다. `.modal` 섹션 밖에 두면 클릭이 backdrop으로 전달돼 모달이 닫힌다.
5. **잔디동 월드 안에서는 순위를 쓰지 않는다.** `WorldModals`가 미니게임 모달을 `RankingEnabledContext`(false)로 감싸므로 패널이 안 보이고, 서버 요청·제출도 하지 않으며, 게임 영역은 원래 레이아웃 그대로다. 새 게임은 `MinigameStage`와 `useRanking`만 쓰면 이 동작을 자동으로 따른다(월드 기록은 순위에 올라가지 않는다).
6. **"새 게임"(진행 중 포기)**: 프리킥·사과게임·잔디 머지·골키퍼 벽돌깨기·매치3 모달에는 `NewGameButton`이 있다. 라운드 도중에 누르면 게임을 새로 시작하되 **`onRoundEnd`도 `ranking.report`도 부르지 않는다**(포기한 판은 월드 미션에도, 순위에도 반영되지 않는다). 대신 `ranking.abandon()`이 런 토큰만 새로 받아 다음 판의 시계를 지금부터 잰다(월드에서는 아무것도 보내지 않는다). 새 게임에 이 버튼을 붙일 때는 종료 판정이 이미 난 순간(매치3의 마지막 수 애니메이션 등)에는 숨기고, 게임 훅의 타이머·루프 effect가 `phase`뿐 아니라 `roundId`에도 반응하는지 확인한다(사과게임은 이걸 빠뜨려 판 중간 재시작이 즉시 타임업이 됐었다).
7. 잔디 러시(월드, 공용 `Modal`이 아닌 640×360 스테이지)는 아직 연결하지 않았다. `SCORE_GAMES.rush`(거리 m 기준)만 등록돼 있다.
