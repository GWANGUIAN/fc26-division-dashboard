# 잰디 동아리 후보 대시보드

왁물원(다음 카페) FC26 게시글을 자동 수집해, 스트리머 동아리 지원자들의 디비전(1~10부) 현황·활동 이력·1:1 평가·업적을 실시간으로 보여주는 대시보드입니다. AWS 서버리스 백엔드가 3분마다 새 글을 수집하고, Gemini Vision으로 전적 스크린샷을 자동 판독하며, 수집된 데이터를 근거로 AI가 스트리머별 한줄평을 생성합니다.

**배포 주소: [https://wakjandy.stream](https://wakjandy.stream/)**

> 현재 카페 수집 Lambda(EventBridge Scheduler)는 운영상의 이유로 일시 중지된 상태이며, 아래 기능 설명은 정상 동작 시 기준입니다.

## 주요 기능

- **디비전 현황 대시보드**: 게시판 글을 파싱해 지원자별 현재 디비전을 자동 산정하고, 승급 이력을 타임라인으로 표시
- **디비전 분포 히스토그램 / 성장 그래프**: 전체 지원자의 디비전 분포와 개인별 승급 추이를 시각화
- **1:1 평가 신청·결과 관리**: 평가 신청 게시글과 결과를 자동 매칭해 목록으로 제공
- **업적(트로피) 시스템**: 통산 전적·승급 이력 기반으로 지원자별 업적을 계산해 표시
- **SOOP 실시간 방송 현황**: 지원자들의 SOOP(숲) 라이브 상태를 함께 노출
- **미니게임 · 포토부스 · 스쿼드 빌더 · 합격 발표 연출** 등 대시보드를 즐길 수 있는 부가 인터랙션 다수
- **닉네임 변경/오탈자에 강한 매칭**: 카페 닉네임 별칭(alias) 등록으로 작성자 표기가 달라져도 동일 인물로 추적

### AI 기능 (Google Gemini)

- **전적 스크린샷 자동 판독 (Vision OCR)**: 지원자가 올린 게임 내 전적 화면 스크린샷을 Gemini Vision에 전달해, 통산 승/무/패를 자동으로 추출합니다. 시즌 중 기록·최근 폼(Form) 스트릭·방송 오버레이(얼굴캠, 채팅창 등)를 통산 기록과 구분하도록 프롬프트로 엄격히 제약했고, 전적 화면이 아니거나 값이 불확실하면 추출을 포기하도록 설계했습니다. ([record-extraction.ts](src/functions/record-extraction.ts))
- **AI 한줄평 생성**: 지원자의 디비전, 통산 전적, 승급 이력, 1차 합격 여부, 전체 지원자 대비 위치를 컨텍스트로 구성해 Gemini에 전달하고, 순한맛(따뜻한 응원)·매운맛(예능감 있는 디스/극찬) 두 가지 톤의 한줄평을 JSON 스키마로 생성합니다. 프런트에서는 타이핑 애니메이션으로 노출됩니다. ([streamer-review.ts](src/functions/streamer-review.ts), [GeminiReviewSection.tsx](src/web/GeminiReviewSection.tsx))
- 두 기능 모두 일시적 오류(429/503/504, 타임아웃)에 대비해 자동 재시도 로직을 갖추고 있습니다.

## 아키텍처

```
EventBridge Scheduler (3분 주기 수집 / 매일 03:00 KST 야간 재조정)
        │
        ▼
Scraper Lambda (Playwright로 Naver Café 수집 + Gemini Vision 전적 판독)
        │
        ▼
DynamoDB (원본 게시글, 로스터, 오버라이드 설정, 수집 상태, 공개 스냅샷)
        │
        ▼
Reader Lambda (인증된 읽기 전용 Function URL)
        │
        ▼
Cloudflare Worker (/api/snapshot, 2분 Edge 캐시, 정적 자산 서빙)
        │
        ▼
React 19 + Vite 정적 대시보드 (브라우저)

GitHub push (roster.yaml 등 YAML) → Config Sync Lambda → DynamoDB 설정 갱신
```

- **프런트엔드**: `src/web` — React 19 + Vite, Cloudflare Workers Static Assets로 배포
- **엣지**: `src/worker.ts` — Reader Lambda 인증 프록시, 2분 Edge 캐시, `/healthz`
- **백엔드**: `src/functions` — Lambda 수집기(Playwright), 읽기 API, Git 기반 설정 동기화, 비용 안전장치
- **도메인 로직**: `src/shared` — 디비전 산정·별칭 매칭·1:1 판정·업적·스냅샷 등 (단위 테스트 포함)
- **인프라**: `infrastructure` — EventBridge Scheduler, DynamoDB, ECR, Lambda, Budget 안전장치 (Terraform)

## 기술 스택

`TypeScript` `React 19` `Vite` `Cloudflare Workers` `AWS Lambda (컨테이너)` `DynamoDB` `EventBridge Scheduler` `Terraform` `Playwright` `Google Gemini (@google/genai)` `Vitest`

## 로스터 관리

수집기는 3분마다 각 게시판의 첫 페이지부터 새 글을 확인합니다. 최초/야간 재조정(매일 03:00 KST)은 마지막 일반 글 페이지까지 이어서 읽습니다. 카페가 접근을 제한하거나 CAPTCHA를 표시하면 우회하지 않고 마지막 정상 데이터를 유지합니다.

`roster.yaml`의 `cafeAliases`에는 카페에 실제로 보이는 작성자명을 넣습니다. 공백 차이는 자동으로 무시합니다.

```yaml
streamers:
  - slug: streamer-id
    displayName: 스트리머 표시명
    cafeAliases: ["카페 닉네임", "이전 닉네임"]
    soopId: soop-channel-id # 선택
    profileImageUrl: https://... # 선택, 없으면 SOOP 규칙 URL을 시도
    autoUpdate: true
    override:
      division: 7
      policy: until-next-post # auto | until-next-post | until-manual-release
    celebrationMessage: "{n}부 리그 승격을 축하합니다." # 선택, {n}이 승격된 디비전 숫자로 치환됨
```

`until-next-post`은 더 높은 부수(예: 7부 고정 중 6부 승격)가 발견될 때만 자동 복귀합니다. 늦게 등록된 낮은 등급 글은 고정을 해제하지 않습니다.

`celebrationMessage`는 해당 스트리머의 디비전 승격 게시글이 **2시간 이내**에 올라왔을 때만 상단 배너(`FavoriteCelebration`)에 표시됩니다. `{n}`은 승격된 디비전 숫자로 치환됩니다. 값을 넣지 않으면 `{displayName}의 {n}부 리그 승격을 축하합니다~!!` 형식의 기본 문구가 쓰이고, 2시간이 지나면 배너는 다시 기본 문구(`축 왁굳형, 핫짱 즐겨찾기 목록 입성`)로 돌아갑니다.

### CollaBot 댓글 Excel에서 후보 추가

다운로드 폴더의 `댓글_ecvhao_204050719.xlsx`에서 닉네임 셀에 담긴 SOOP 방송국 링크를 읽어, 아직 `soopId`가 없는 후보만 추가합니다. 기존 스트리머 행은 수정하지 않고, 새 후보의 카페 별칭은 확인 전까지 `['']`로 둡니다. 외부 웹사이트에 접속하지 않습니다.

```powershell
pnpm sync:comments-roster                         # 다운로드 폴더의 기본 파일로 실제 갱신
pnpm sync:comments-roster -- --dry-run            # 추가 대상만 미리 보기
pnpm sync:comments-roster -- --xlsx C:\\path\\comments.xlsx
```

프로젝트의 Node 의존성만 사용하므로 Python이나 브라우저 설치는 필요 없습니다.

### CollaBot 실시간 동기화 (GitHub Actions)

`.github/workflows/sync-roster-collabot.yml`은 위 CollaBot 게시글(https://colla.bot/station/ecvhao/post/204050719)에서 "Excel로 내보내기"를 직접 자동화(Playwright)해 매번 최신 신청자 목록을 가져온 뒤 `roster.yaml`을 **양방향**으로 동기화합니다: 목록에 없어진 스트리머는 제거하고, 새 신청자는 SOOP 닉네임을 `cafeAliases` 기본값으로 삼아 추가합니다. 변경 사항은 `main`에 직접 커밋·push되며, 이 push가 기존 `sync-roster.yml`을 트리거해 AWS까지 자동 반영됩니다.

같은 로직을 로컬에서 미리 확인하려면:

```powershell
pnpm exec playwright install chromium   # 최초 1회만 필요
pnpm fetch:collabot -- --out collabot-export.xlsx
pnpm sync:collabot-live -- --xlsx collabot-export.xlsx --dry-run
```

**필요한 GitHub Secrets** (Settings → Secrets and variables → Actions):

- `MAIL_USERNAME` / `MAIL_PASSWORD`: 발신용 Gmail 주소와 앱 비밀번호(로그인 비밀번호 아님). 변경사항이 있거나 안전장치가 발동했을 때 결과를 메일로 보냅니다.
- `ROSTER_AUTOSYNC_TOKEN`: 이 저장소 전용 fine-grained PAT(Contents: Read and write 권한만). 기본 `GITHUB_TOKEN`으로 push하면 다른 워크플로(`sync-roster.yml`)가 자동으로 트리거되지 않는 GitHub 정책 때문에 필요합니다.

**안전장치**: 새로 가져온 신청자 수가 0명이거나 현재 roster의 절반 미만이면 동기화 전체를 중단하고 `roster.yaml`을 건드리지 않습니다 — CollaBot 페이지 로딩 실패를 "다들 신청을 취소함"으로 오인해 로스터를 지우는 사고를 막기 위함입니다. 이 경우에도 이상 상황을 알리는 메일이 발송됩니다. 임계값은 워크플로의 `MIN_LIVE_APPLICANT_RATIO` 환경변수(기본 `0.5`)로 조정합니다.

현재는 `workflow_dispatch`(수동 실행, `dry_run` 입력 기본 `true`)만 등록되어 있습니다. Actions 탭에서 실행해 로그와 커밋·메일을 확인한 뒤에만 `schedule: - cron: "0 0 * * *"`(09:00 KST)을 추가해 매일 자동 실행하도록 합니다.

## 로컬 실행

```powershell
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

`VITE_DATA_API_URL`을 지정하지 않으면 실제 UI 검증을 위한 데모 데이터가 표시됩니다. 운영 빌드에서는 이 값을 설정하지 마세요. 프런트는 같은 출처의 Cloudflare Worker `/api/snapshot`을 통해 인증된 Reader Lambda 데이터를 받습니다.

Lambda 번들만 별도로 확인할 때는 다음을 실행합니다.

```powershell
pnpm build:lambda
```

## AWS 배포

Terraform과 Docker, AWS CLI 로그인이 필요합니다.

1. `infrastructure/terraform.tfvars.example`를 `terraform.tfvars`로 복사하고 Cloudflare Worker 주소와 GitHub 저장소를 채웁니다.
2. ECR만 먼저 만듭니다.

   ```powershell
   cd infrastructure
   terraform init
   terraform apply -target=aws_ecr_repository.app -var='image_uri=placeholder'
   cd ..
   ```

3. 이미지를 빌드·푸시합니다.

   ```powershell
   ./scripts/deploy.ps1 -ImageTag v1
   ```

4. `image_uri`를 방금 출력된 URI로 바꾼 뒤 전체 인프라를 적용합니다.

   ```powershell
   cd infrastructure
   terraform apply
   ```

5. 공개 API는 Cloudflare Worker를 통해서만 제공됩니다. Terraform이 생성한 `reader_origin_token` 출력값을 Cloudflare Worker Secret `ORIGIN_AUTH_TOKEN`으로, Reader Function URL을 `API_ORIGIN_URL` Secret으로 설정한 뒤 새 빌드를 실행합니다. 프런트에는 `VITE_DATA_API_URL`을 설정하지 않습니다. Worker는 `/api/snapshot`을 2분간 캐시하고, Lambda Reader는 단일 DynamoDB 스냅샷만 읽습니다.

   ```powershell
   npx wrangler secret put API_ORIGIN_URL
   npx wrangler secret put ORIGIN_AUTH_TOKEN
   npx wrangler deploy
   ```
6. 첫 로스터 동기화는 GitHub Actions를 실행하거나 다음처럼 직접 Lambda를 호출합니다.

   ```powershell
   $payload = @{ rosterYaml = Get-Content -Raw roster.yaml; oneVsOneResultsYaml = Get-Content -Raw one-vs-one-results.yaml } | ConvertTo-Json -Compress
   aws lambda invoke --function-name jandy-fc26-dashboard-config-sync --cli-binary-format raw-in-base64-out --payload $payload response.json
   ```

GitHub Actions를 사용하려면 기존 GitHub OIDC Provider ARN을 Terraform 변수에 넣고, 출력되는 `github_roster_sync_role_arn`과 `config_sync_function_name`을 각각 `AWS_ROSTER_SYNC_ROLE_ARN`, `AWS_ROSTER_SYNC_FUNCTION_NAME` Secret으로 설정합니다. 역할은 config-sync 함수에만 `lambda:InvokeFunction`을 허용합니다.

`src/functions`, `src/shared`, `Dockerfile` 등 백엔드 코드는 위 초기 설정 이후 수동 배포가 필요 없습니다. `.github/workflows/deploy-backend.yml`이 해당 경로 변경을 main에 push할 때마다 이미지를 빌드·ECR 푸시하고 4개 Lambda(`scraper`/`reader`/`config-sync`/`budget-guard`)를 자동으로 갱신합니다. 이 워크플로가 assume하는 역할은 Terraform 출력 `github_backend_deploy_role_arn`이며, `AWS_BACKEND_DEPLOY_ROLE_ARN` Secret으로 설정합니다. 새 Lambda 코드가 반영되려면 워크플로 완료 후 scraper의 다음 3분 주기 실행까지 기다려야 스냅샷이 재생성됩니다 — push 직후 화면에 안 보인다고 코드가 잘못된 것은 아닙니다.

배포 이후에는 `https://<Worker 도메인>/healthz`로 상태를 확인할 수 있습니다. 이 엔드포인트는 실제 Reader Lambda와 스냅샷 신선도(12분 이내)를 확인하며, 대시보드 데이터나 인증 토큰은 노출하지 않습니다.

## 비용 안전장치

Terraform은 기본으로 **계정 전체 월 실제 비용이 USD 20 이상**이면 SNS → `budget-guard` Lambda를 통해 이 프로젝트의 3분 수집 및 야간 재조정 Scheduler를 `DISABLED`로 바꾸는 별도 Budget을 만듭니다. 따라서 다른 프로젝트 비용을 포함한 총액이 한도에 도달해도 이 프로젝트는 중지됩니다.

AWS Budget은 기본 알림만으로는 서비스를 자동 중지하지 않습니다. 기존 USD 20 Budget이 단순 알림인지, 이미 자동 조치가 연결되어 있는지는 배포 전 다음 명령으로 확인하세요.

```powershell
aws budgets describe-budgets --account-id (aws sts get-caller-identity --query Account --output text)
```

이 안전장치는 추가 Budget을 만들며, 기존 Budget을 수정하거나 삭제하지 않습니다. 한도 초과 뒤 재개하려면 Budget 상태를 해제한 뒤 EventBridge Scheduler 두 개를 다시 활성화합니다.

## 더 읽어보기

새 세션에서 프로젝트를 빠르게 이어서 작업하려면 [프로젝트 인수인계 문서](docs/PROJECT_HANDOFF.md)를 참고하세요. 데이터 흐름, 도메인 규칙, DynamoDB 스키마, 장애 대응, 변경 주의사항을 정리해 두었습니다.
