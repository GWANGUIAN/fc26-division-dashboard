# 미니게임 온라인 순위

미니게임 최고기록을 닉네임과 함께 서버에 제출하고, 게임 모달 오른쪽 패널에서 TOP 10과 내 순위를 보여준다.
**AWS가 아니라 Cloudflare Worker + D1**을 쓴다(사이트가 이미 Worker라서 같은 오리진, CORS·토큰 불필요). D1 무료 한도를 넘으면 과금이 아니라 요청이 실패할 뿐이며, 그때 패널은 "순위를 불러올 수 없어요"로 저하된다.

## 구성

| 파일 | 역할 |
|---|---|
| `src/shared/minigame-scores.ts` | 게임 레지스트리 `SCORE_GAMES`(허용 목록·단위·정렬·점수 범위), 닉네임 정제, 점수 검증, `hashPlayerId` |
| `src/worker-scores.ts` | `/api/scores/*` 핸들러 (D1). `src/worker.ts`는 라우팅만 |
| `migrations/0001_scores.sql` | `scores` 테이블 — 게임×플레이어당 1행(본인 최고기록) |
| `src/web/minigame/ranking/` | `useRanking`(상태·제출), `RankingPanel`(UI), `MinigameStage`(좌 게임 / 우 패널 레이아웃), `scoreApi`, `shouldSubmit` |
| `src/web/storage.ts` | `fc26-player-id`(비밀 기기 ID), `fc26-player-nickname`, `fc26-score-submitted-<game>` |

### API

| 요청 | 설명 | 캐시 |
|---|---|---|
| `GET /api/scores/:game?limit=10` | `{order, unit, total, entries:[{rank,key,name,score}]}` | 엣지 30초 (점수 등록 시 `limit=10` 키 삭제) |
| `GET /api/scores/:game/me?k=<playerKey>` | `{rank, score, name}` 또는 `{rank:null}` | no-store |
| `POST /api/scores/:game` `{pid,name,score}` | 검증 → 더 좋을 때만 갱신 → `{improved,rank,total,best}` | no-store |

- **신원**: 클라이언트가 만든 `pid`(UUID)가 쓰기 권한이고, 서버에는 `sha256(pid)`(=`player_key`)만 저장한다. 목록에는 key만 나가므로 남이 내 기록을 덮어쓸 수 없다. 기기를 바꾸거나 저장소를 지우면 새 신원이 된다(로그인 없는 설계의 한계).
- **동점**은 먼저 달성한 사람이 상위. 카드 짝 맞추기처럼 낮을수록 좋은 게임은 `order: "asc"`로 등록하면 서버가 `rank_score`를 부호 반전해 저장한다.
- **방어**: 게임 허용목록, 점수 정수·범위(`min`/`max`), 닉네임 2~12자·허용 문자·금칙어, 본문 ≤1KB, JSON만, `Origin`이 같은 오리진(또는 localhost)일 것, 같은 플레이어·게임 5초 쿨다운(429).
- **한계**: 클라이언트 점수는 콘솔에서 위조할 수 있다. 상한 검증과 운영자 삭제로 대응하고, 필요하면 Cloudflare WAF 레이트리밋 규칙(POST `/api/scores/*`)이나 서버 발급 nonce를 추가한다.

## 최초 설정 (운영) — 완료

2026-09-21에 D1 `fc26-minigame-scores`(APAC)를 만들고 `wrangler.toml`에 `DB` 바인딩을 넣었으며 `0001_scores.sql`을 원격에 적용했다. 새 환경(다른 계정 등)에서 다시 만들 때만 아래 순서를 따른다.

1. `npx wrangler d1 create fc26-minigame-scores` → 출력된 `database_id`를 `wrangler.toml`의 `[[d1_databases]]`에 넣는다(바인딩 이름은 `DB` 유지).
2. 스키마를 **배포 전에** 원격에 적용한다. Cloudflare Git 연동은 마이그레이션을 실행하지 않는다.

```bash
npx wrangler d1 migrations apply fc26-minigame-scores --remote
```

3. push → 자동 배포. 바인딩이 없으면 사이트는 정상이고 `/api/scores/*`만 503이다. 배포 로그의 `--env` 권고 경고는 `env.dev`(로컬 개발용) 때문이며 무시해도 된다.

## 로컬 개발

```bash
pnpm db:migrate:local   # 최초 1회: 로컬 D1(.wrangler/state)에 스키마 적용
pnpm dev:api            # 127.0.0.1:8787 에서 Worker + 로컬 D1
pnpm dev                # 별도 터미널. vite가 /api/scores 를 8787로 프록시
```

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

3. 패널은 반드시 `Modal`의 children 안에 둔다. `.modal` 섹션 밖에 두면 클릭이 backdrop으로 전달돼 모달이 닫힌다.
4. 잔디 러시(월드, 공용 `Modal`이 아닌 640×360 스테이지)는 아직 연결하지 않았다. `SCORE_GAMES.rush`(거리 m 기준)만 등록돼 있다.
