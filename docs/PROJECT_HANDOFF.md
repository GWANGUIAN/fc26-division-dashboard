# 프로젝트 인수인계: 잰디 동아리 후보 대시보드

> 이 문서는 새 세션에서 프로젝트의 목적, 데이터 흐름, 운영 방법을 빠르게 파악하기 위한 기준 문서다. 코드와 운영 설정이 바뀌면 함께 갱신한다.

## 한눈에 보기

- 목적: 왁물원 FC26 잔디동 관련 게시글을 수집하여 후보자의 디비전, 활동글, 1:1 평가 신청·결과, 업적을 보여준다.
- 프런트: React 19 + Vite 정적 사이트를 Cloudflare Worker Static Assets로 제공한다.
- 백엔드: AWS Lambda 컨테이너가 Naver Café를 Playwright로 수집하고 DynamoDB에 저장한다.
- 공개 경로: 브라우저 → Cloudflare Worker(`/api/snapshot`) → Reader Lambda → DynamoDB.
- 관리 데이터: `roster.yaml`과 `one-vs-one-results.yaml`이 Git의 기준값이며, GitHub Actions가 Config Sync Lambda로 전송한다.
- 기준 시간대: 수집·표시는 Asia/Seoul. 야간 전체 재조정은 매일 03:00 KST(18:00 UTC)다.

## 데이터 흐름

```text
EventBridge Scheduler
  ├─ 3분마다 incremental 수집
  └─ 매일 03:00 KST reconcile 수집
          │
          ▼
Scraper Lambda (Playwright + Naver Café)
  ├─ 디비전 보고소: 승격 글과 게시글 이미지
  ├─ 1대1 평가 신청: 신청 글
  ├─ 잔디동 스코프: [내가 직접 홍보] 글만
  └─ 11대11 플레이 영상: 전체 일반 글
          │
          ▼
DynamoDB (원본 글, 로스터, 상태, 단일 공개 스냅샷)
          │
          ▼
Reader Lambda ── 인증 헤더 ── Cloudflare Worker 2분 캐시 ── React UI

GitHub push (roster/results YAML) → Config Sync Lambda → DynamoDB 로스터/결과/스냅샷 재생성
```

## 코드 지도

| 위치 | 책임 |
| --- | --- |
| `src/web/App.tsx` | 두 화면(디비전/1:1), 검색·필터, 상세 모달, 승급 타임라인, 업적, VOD 카드 |
| `src/web/api.ts` | 개발 시 데모 데이터, 운영 시 같은 출처 `/api/snapshot` 호출 |
| `src/worker.ts` | Cloudflare API 프록시·2분 Edge 캐시·`/healthz`·정적 자산 캐시 방어 |
| `src/functions/scraper.ts` | 스케줄 수집, 게시판별 체크포인트, 이미지 재시도, 스냅샷 발행 |
| `src/functions/naver.ts` | Naver Café 목록/본문 렌더링, CAPTCHA·접근 차단 감지, 이미지 추출 |
| `src/functions/store.ts` | DynamoDB 읽기/쓰기와 파티션 키 정의 |
| `src/functions/reader.ts` | 인증된 읽기 전용 Lambda Function URL (`/`, `/latest`, `/one-vs-one`) |
| `src/functions/config-sync.ts` | YAML 검증 후 DynamoDB 설정 및 스냅샷 재구축 |
| `src/shared/*.ts` | 타입, 디비전 산정, 별칭 매칭, 1:1 판정, 타임라인, 트로피, 이미지 필터 |
| `infrastructure/` | AWS 인프라 Terraform |
| `.github/workflows/sync-roster.yml` | main의 YAML 변경을 Config Sync Lambda로 전송 |
| `.github/workflows/deploy-backend.yml` | main의 백엔드 코드 변경을 감지해 Lambda 이미지 자동 빌드·배포 |

## 핵심 도메인 규칙

### 디비전과 후보 매칭

- `1부 리거 달성`, `2부 승격`부터 `9부 승격` 형식의 카테고리 또는 제목만 디비전 보고로 인식한다.
- 숫자가 작을수록 높은 디비전이다. 후보의 자동 현재 디비전은 모든 보고 중 가장 작은 숫자다.
- 보고가 없는 로스터 후보는 10부(시즌 미참여)로 표시된다.
- `cafeAliases`는 NFC 정규화, 공백 제거, 한국어 소문자화 후 비교한다. 별칭 누락 시 해당 작성자는 미연결 후보로 표시된다.
- `override.policy`는 다음과 같다.
  - `auto`: 자동 산정값 사용.
  - `until-next-post`: 고정 디비전보다 더 높은(숫자가 작은) 보고가 생길 때만 자동 복귀.
  - `until-manual-release`: 수동 해제 전까지 고정.

### 축하 배너

- 상단 `FavoriteCelebration` 배너는 공개 스냅샷의 `latestPosts[0]`(가장 최근 승격 글)이 **2시간 이내**일 때만 문구를 바꾼다. `src/web/App.tsx`의 `celebrationMessage`가 계산 위치다.
- 해당 스트리머의 `roster.yaml` `celebrationMessage`가 있으면 그 문구의 `{n}`을 승격된 디비전 숫자로 치환해 보여준다. 없으면 `{displayName}의 {n}부 리그 승격을 축하합니다~!!` 기본 문구를 쓴다.
- 2시간이 지나거나 오늘 승격 글이 없으면 기본값 `축 왁굳형 즐겨찾기 목록 입성`으로 돌아간다.
- `celebrationMessage`는 `RosterEntry`와 `StreamerRecord` 양쪽 타입에 있어야 하며, `buildStreamerRecords`(`src/shared/promotion.ts`)가 로스터 → 스트리머 레코드 변환 시 이 필드를 빠뜨리지 않아야 프런트까지 전달된다. 백엔드 로직이라 반영에는 `deploy-backend.yml` 배포 + scraper의 다음 3분 주기 실행이 필요하다.

### 활동글·1:1 평가

- 스코프 게시판은 `[내가 직접 홍보]` 카테고리만 후보 활동으로 반영한다.
- 11대11 게시판은 모든 일반 글을 반영하지만 로스터 별칭과 일치한 글만 후보 상세에 붙는다.
- 1:1 신청은 `[1대1 평가 신청]` 카테고리 또는 제목으로 판별한다.
- 결과는 `one-vs-one-results.yaml`에서 신청 게시글 ID로 연결한다. 점수 판정 로직은 `src/shared/one-vs-one.ts`가 단일 기준이다.

### 업적

- 상단 트로피 버튼은 공개 스냅샷의 `streamers`만으로 계산하는 표시 전용 업적 모달을 연다. 별도의 API·DynamoDB 저장 항목은 없다.
- `오늘의 급성장`: 한국 시간 날짜별로 해당 후보의 첫 승격 글 직전 부수부터 마지막 승격 글까지의 상승 단계를 계산한다. 중간 단계가 누락돼도 최종 부수까지 반영하며, 하루에 보고가 한 건이어도 1단계다. 가장 큰 기록은 동률자를 모두 표시한다.
- `정상 정복자`: 현재 가장 높은 디비전(가장 작은 부수)의 후보를 표시한다. 동률이면 해당 디비전에 더 먼저 도달한 후보가 선정된다.
- `자기 PR 왕`: 스코프의 `[내가 직접 홍보]` 글 수와 11대11 플레이 영상 글 수를 합산한다. 최다 기록은 동률자를 모두 표시한다.
- 계산 기준은 `src/shared/trophy.ts`, 회귀 테스트는 `src/shared/trophy.test.ts`에 있다. 업적 기준을 바꾸면 UI 도움말(`TrophyHelp`)과 테스트를 함께 수정한다.

### 수집 안전 원칙

- CAPTCHA, 자동입력, 접근 제한 신호를 만나면 우회하지 않고 실패 처리하며 기존 정상 스냅샷을 보존한다.
- 본문 이미지 렌더링 실패는 디비전 데이터는 보존하고 이미지 없이 저장한다. 최신 보고에 한해 실행당 최대 3개, 글당 최대 3회 재시도한다.
- `incremental`은 각 게시판 1페이지부터 이미 수집한 목록을 만날 때까지 읽는다. `reconcile`은 DynamoDB의 게시판별 page 체크포인트에서 이어서 과거 글을 채운다. 한 실행의 페이지 상한은 기본 20이다.

## DynamoDB 논리 스키마

단일 테이블(`jandy-fc26-dashboard` 기본값)을 사용한다. 모든 항목은 `PK`, `SK`를 갖는다.

| PK | SK | 내용 |
| --- | --- | --- |
| `POST` | article ID | 디비전 보고 원본 |
| `ONE_VS_ONE_APPLICATION` | article ID | 1:1 신청 원본 |
| `STREAMER_ACTIVITY_POST` | `{board}#{articleId}` | 스코프/11대11 활동 글 |
| `ROSTER` | `CONFIG` | 파싱된 `roster.yaml` |
| `CONFIG` | `ONE_VS_ONE_RESULTS` | 파싱된 결과 YAML |
| `SYNC` | `STATE` | 수집 상태, 각 게시판 페이지·최근 ID |
| `STREAMER` | streamer ID | 파생 후보 레코드(참고용) |
| `SNAPSHOT` | `CURRENT` | Reader가 반환하는 완성된 공개 스냅샷 |

`SNAPSHOT/CURRENT`가 API의 주 데이터다. 수집기와 Config Sync는 원본 데이터와 현재 로스터로 매번 스냅샷을 재생성한다.

## 로컬 개발과 검증

```powershell
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

- `pnpm dev`는 `VITE_DATA_API_URL`이 없으면 안전한 데모 스냅샷을 표시한다.
- 실제 Reader Lambda를 직접 검증하려면 `.env.example`을 참고해 `VITE_DATA_API_URL`을 설정한다. 운영 프런트에는 이 값을 설정하지 않는다.
- Worker 인증 프록시를 로컬에서 확인하려면 `.dev.vars.example`을 `.dev.vars`로 복사해 실제 값으로 채운 뒤 `npx wrangler dev`를 사용한다. `.dev.vars`는 커밋하지 않는다.
- Lambda 컨테이너의 번들만 검증하려면 `pnpm build:lambda`를 실행한다.

## 운영 절차

### 후보·결과 변경

1. `roster.yaml` 또는 `one-vs-one-results.yaml`을 수정한다.
2. `pnpm typecheck && pnpm test`를 실행한다.
3. main에 반영하면 GitHub Actions가 자동으로 Config Sync Lambda를 호출한다.
4. Actions를 쓸 수 없으면 README의 `aws lambda invoke` 명령으로 직접 동기화한다.

`roster.yaml`의 필수 실무 필드는 `displayName`, `autoUpdate`이며, `slug`는 생략하면 `soopId`로 만든다. 카페 작성자와 연결하려면 `cafeAliases`를 반드시 실제 표기대로 채운다. 완전히 빈 템플릿 행은 무시된다.

### 배포 순서

최초 인프라 구축(1회):

1. ECR 저장소를 Terraform으로 먼저 만든다.
2. `./scripts/deploy.ps1 -ImageTag <tag>`로 Lambda 이미지 빌드·푸시한다.
3. `terraform apply -var='image_uri=<pushed-uri>'`로 나머지 AWS 인프라를 적용한다.
4. Terraform의 `reader_function_url`, `reader_origin_token`을 Cloudflare Worker Secret `API_ORIGIN_URL`, `ORIGIN_AUTH_TOKEN`에 각각 설정하고 `npx wrangler deploy`한다.
5. GitHub OIDC를 쓸 경우 Terraform 출력값을 Actions Secret `AWS_ROSTER_SYNC_ROLE_ARN`, `AWS_ROSTER_SYNC_FUNCTION_NAME`, `AWS_BACKEND_DEPLOY_ROLE_ARN`에 설정한다.

이후 일상적인 변경(자동):

- **백엔드**(`src/functions`, `src/shared`, `Dockerfile` 등): main에 push하면 `deploy-backend.yml`이 이미지를 빌드·ECR 푸시하고 4개 Lambda를 `aws lambda update-function-code`로 갱신한다. Terraform은 이 이미지 태그를 관리하지 않도록 각 `aws_lambda_function`에 `lifecycle { ignore_changes = [image_uri] }`가 설정돼 있다 — 인프라 변경으로 `terraform apply`를 다시 돌려도 배포된 이미지가 되돌아가지 않는다.
- **프런트**(`src/web`): Cloudflare가 GitHub 저장소와 연동돼 있어 push 시 자동 배포된다.
- **로스터/결과 YAML**: `sync-roster.yml`이 Config Sync Lambda를 호출한다.
- 세 워크플로 모두 `push` 파일 경로 기준으로 독립 트리거되므로, 한 커밋에 여러 영역이 섞여도 필요한 워크플로만 돈다.

### 장애 확인 순서

1. `https://<worker-domain>/healthz`를 확인한다. `ok`, `collection_degraded`, `snapshot_stale`, `snapshot_empty`, `upstream_unavailable` 중 하나를 반환한다.
2. CloudWatch의 Scraper Lambda 로그와 `*-scraper-errors` 알람을 확인한다.
3. `SYNC/STATE`의 `status`, `message`, `boards` 체크포인트를 확인한다. Naver 차단이면 데이터를 임의로 비우지 말고 차단 해소 후 다음 스케줄을 기다린다.
4. 로스터 변경이 화면에 없으면 GitHub Actions(`sync-roster.yml`) 결과와 Config Sync Lambda 로그를 확인한다.
5. 백엔드 코드 변경(예: `src/shared`, `src/functions`)이 화면에 반영되지 않으면 `deploy-backend.yml` 실행 결과를 먼저 확인한다. 워크플로가 성공했어도 scraper는 3분 주기로만 스냅샷을 재생성하므로 반영까지 수 분 걸릴 수 있다.
6. 비용 한도에 도달한 경우 Budget Guard가 두 Scheduler를 `DISABLED`로 바꾼다. 예산 상태를 해제한 뒤 두 스케줄을 다시 활성화해야 수집이 재개된다.

## 변경 시 주의할 점

- Naver DOM 셀 위치·iframe·모바일 폴백은 쉽게 바뀔 수 있다. 수집기 변경 전 `naver.ts`의 CAPTCHA 감지와 이미지 호스트 필터를 유지하고, 실제 빈 게시판도 정상으로 처리하는 동작을 깨지지 않게 한다.
- Cloudflare Worker의 정적 진입 번들 이름(`assets/app.js`, `assets/app.css`)과 오래된 Vite 해시 경로 호환 처리는 배포 직후 캐시된 HTML이 깨지는 문제를 막는다. Vite 출력 규칙을 바꾸면 `src/worker.ts`도 함께 검토한다.
- Reader Lambda Function URL은 AWS 레벨에서 공개지만 `x-dashboard-origin` 비밀 헤더 없이는 403이다. 브라우저가 Function URL을 직접 사용하게 하거나 토큰을 `VITE_*` 환경 변수에 넣으면 안 된다.
- Lambda는 Playwright/Chromium을 사용하므로 로컬 Node 실행만으로 실제 수집 동작을 보장하지 않는다. 인프라 변경 뒤에는 컨테이너 이미지와 스케줄러 입력(`{ mode: ... }`)을 함께 확인한다.
- `store.ts`의 파티션별 읽기는 DynamoDB `Scan`을 쓴다. 데이터량이 커지면 GSI 또는 Query 가능한 키 설계로 바꾸는 것이 우선 개선 지점이다.
- `roster.yaml`에 새 선택 필드를 추가할 때는 `RosterEntry`(`src/shared/model.ts`), `StreamerRecord`(같은 파일), 그리고 `buildStreamerRecords`(`src/shared/promotion.ts`)의 반환 객체 세 곳 모두에 반영해야 한다. 타입에만 추가하고 `buildStreamerRecords`에서 값을 옮기지 않으면 컴파일은 통과하지만 스냅샷·프런트까지 값이 전달되지 않는다(`celebrationMessage`에서 실제로 발생했던 문제).

## 새 세션 시작용 체크리스트

1. 이 문서와 `README.md`를 읽는다.
2. `git status --short`, `git log --oneline -8`로 작업 상태와 최근 의도를 확인한다.
3. UI는 `src/web/App.tsx`, 수집은 `src/functions/scraper.ts`, Naver 셀렉터는 `src/functions/naver.ts`, 배포는 `infrastructure/main.tf`부터 본다.
4. 변경 전 `pnpm typecheck && pnpm test`를 기준선으로 실행한다.
