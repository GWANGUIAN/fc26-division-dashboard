# 잰디 동아리 후보 대시보드

FC26 디비전 보고소를 읽어 후보의 1~10부 현황을 보여주는 대시보드입니다. 10부는 **시즌 미참여** 후보를 뜻합니다.

## 구성

- `src/web`: Cloudflare Workers Static Assets에 올릴 React/Vite 정적 대시보드
- `src/functions`: Lambda 수집기, 공개 읽기 API, Git 기반 로스터 동기화, 비용 안전장치
- `roster.yaml`: 카페 닉네임 ↔ SOOP ID/표시명 및 수동 보정의 유일한 관리 파일
- `infrastructure`: EventBridge Scheduler, DynamoDB, ECR, Lambda, 로그, Budget 안전장치 Terraform

수집기는 3분마다 첫 페이지부터 새 글을 확인합니다. 최초/야간 재조정은 마지막 일반 글 페이지까지 이어서 읽습니다. 카페가 접근을 제한하거나 CAPTCHA를 표시하면 우회하지 않고 마지막 정상 데이터를 유지합니다.

## 로컬 실행

```powershell
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

`VITE_DATA_API_URL`을 지정하지 않으면 실제 UI 검증을 위한 데모 데이터가 표시됩니다. 배포 뒤에는 Cloudflare Worker Builds의 Build variable에 Reader Lambda Function URL을 설정합니다.

## 로스터 관리

`roster.yaml`의 `cafeAliases`에는 카페에 실제로 보이는 작성자명을 넣습니다. 공백 차이는 자동으로 무시합니다.

```yaml
streamers:
  - slug: streamer-id
    displayName: 스트리머 표시명
    cafeAliases: ["카페 닉네임", "이전 닉네임"]
    soopId: soop-channel-id # 선택
    profileImageUrl: https://... # 선택, 없으면 SOOP 규칙 URL을 시도
    soopTags: ["루키존", "스포츠"] # 선택: 파트너 | 베스트 | 루키존 | 스포츠 | 서포터즈
    autoUpdate: true
    override:
      division: 7
      policy: until-next-post # auto | until-next-post | until-manual-release
```

`until-next-post`은 더 높은 부수(예: 7부 고정 중 6부 승격)가 발견될 때만 자동 복귀합니다. 늦게 등록된 낮은 등급 글은 고정을 해제하지 않습니다.

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

5. `reader_function_url`을 Cloudflare Worker의 Settings → Builds → Build variables에 `VITE_DATA_API_URL`로 설정하고 새 빌드를 실행합니다. Workers Builds는 `pnpm build` 뒤 `npx wrangler deploy`를 실행하며, `wrangler.toml`의 Static Assets 설정이 `dist/web`을 배포합니다.
6. 첫 로스터 동기화는 GitHub Actions를 실행하거나 다음처럼 직접 Lambda를 호출합니다.

   ```powershell
   $payload = @{ rosterYaml = Get-Content -Raw roster.yaml; oneVsOneResultsYaml = Get-Content -Raw one-vs-one-results.yaml } | ConvertTo-Json -Compress
   aws lambda invoke --function-name jandy-fc26-dashboard-config-sync --cli-binary-format raw-in-base64-out --payload $payload response.json
   ```

GitHub Actions를 사용하려면 기존 GitHub OIDC Provider ARN을 Terraform 변수에 넣고, 출력되는 `github_roster_sync_role_arn`과 `config_sync_function_name`을 각각 `AWS_ROSTER_SYNC_ROLE_ARN`, `AWS_ROSTER_SYNC_FUNCTION_NAME` Secret으로 설정합니다. 역할은 config-sync 함수에만 `lambda:InvokeFunction`을 허용합니다.

## 비용 안전장치

Terraform은 기본으로 **계정 전체 월 실제 비용이 USD 20 이상**이면 SNS → `budget-guard` Lambda를 통해 이 프로젝트의 3분 수집 및 야간 재조정 Scheduler를 `DISABLED`로 바꾸는 별도 Budget을 만듭니다. 따라서 다른 프로젝트 비용을 포함한 총액이 한도에 도달해도 이 프로젝트는 중지됩니다.

AWS Budget은 기본 알림만으로는 서비스를 자동 중지하지 않습니다. 기존 USD 20 Budget이 단순 알림인지, 이미 자동 조치가 연결되어 있는지는 배포 전 다음 명령으로 확인하세요.

```powershell
aws budgets describe-budgets --account-id (aws sts get-caller-identity --query Account --output text)
```

이 안전장치는 추가 Budget을 만들며, 기존 Budget을 수정하거나 삭제하지 않습니다. 한도 초과 뒤 재개하려면 Budget 상태를 해제한 뒤 EventBridge Scheduler 두 개를 다시 활성화합니다.
