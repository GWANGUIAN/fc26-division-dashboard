# 프로젝트 인수인계: 잰디 동아리 후보 대시보드

> 이 문서는 새 세션에서 프로젝트의 목적, 데이터 흐름, 운영 방법을 빠르게 파악하기 위한 기준 문서다. 코드와 운영 설정이 바뀌면 함께 갱신한다.

## 한눈에 보기

- 목적: 왁물원 FC26 잔디동 관련 게시글을 수집하여 후보자의 디비전, 활동글, 1:1 평가 신청·결과, 업적을 보여준다.
- 프런트: React 19 + Vite 정적 사이트를 Cloudflare Worker Static Assets로 제공한다.
- 백엔드: AWS Lambda 컨테이너가 Naver Café를 Playwright로 수집하고 DynamoDB에 저장한다.
- 공개 경로: 브라우저 → Cloudflare Worker(`/api/snapshot`) → Reader Lambda → DynamoDB.
- 관리 데이터: `roster.yaml`, `one-vs-one-results.yaml`, `division-overrides.yaml`, `record-overrides.yaml`, `review-context.yaml`이 Git의 기준값이며, GitHub Actions가 Config Sync Lambda로 전송한다.
- 기준 시간대: 수집·표시는 Asia/Seoul. 야간 전체 재조정은 매일 03:00 KST(18:00 UTC)다.
- 통산 전적(W-D-L): 승급 게시글 스크린샷을 Gemini(멀티모달 LLM)로 읽어 자동 추출한다. 실패/오탐 시 `record-overrides.yaml`로 수동 보정한다.
- Gemini 한줄평: 통산 전적이 확정된 승급 게시글마다 Gemini(텍스트 전용)로 "방송각" 있는 짧은 코멘트를 생성해 상세 모달에 타이핑 애니메이션과 함께 보여준다.

## 데이터 흐름

```text
EventBridge Scheduler
  ├─ 3분마다 incremental 수집
  └─ 매일 03:00 KST reconcile 수집
          │
          ▼
Scraper Lambda (Playwright + Naver Café)
  ├─ 디비전 보고소: 승격 글과 게시글 이미지
  │     ├─ 이미지가 있는데 record가 없는 글: Gemini로 W-D-L 추출 시도 (실행당 최대 5건, 글당 최대 3회 재시도)
  │     └─ record는 있는데 review가 없는 글: Gemini로 한줄평 생성 시도 (실행당 최대 5건, 글당 최대 3회 재시도)
  ├─ 1대1 평가 신청: 신청 글
  ├─ 잔디동 스코프: [내가 직접 홍보] 글만
  └─ 11대11 플레이 영상: 전체 일반 글
          │
          ▼
DynamoDB (원본 글, 로스터, 오버라이드 설정, 상태, 단일 공개 스냅샷)
          │
          ▼
Reader Lambda ── 인증 헤더 ── Cloudflare Worker 2분 캐시 ── React UI

GitHub push (roster/results/overrides YAML) → Config Sync Lambda → DynamoDB 설정/스냅샷 재생성
```

## 코드 지도

| 위치 | 책임 |
| --- | --- |
| `src/web/App.tsx` | 두 화면(디비전/1:1)을 그리는 오케스트레이터. 상태는 `use*.ts` 훅에서 모으고 화면은 섹션 컴포넌트에 위임한다 — 아래 "프런트엔드 구조" 참고 |
| `src/web/api.ts` | 개발 시 데모 데이터, 운영 시 같은 출처 `/api/snapshot` 호출 |
| `src/worker.ts` | Cloudflare API 프록시·2분 Edge 캐시·`/healthz`·정적 자산 캐시 방어 |
| `src/functions/scraper.ts` | 스케줄 수집, 게시판별 체크포인트, 이미지 재시도, 전적 추출 재시도, 스냅샷 발행 |
| `src/functions/naver.ts` | Naver Café 목록/본문 렌더링, CAPTCHA·접근 차단 감지, 이미지 추출 |
| `src/functions/store.ts` | DynamoDB 읽기/쓰기와 파티션 키 정의 |
| `src/functions/reader.ts` | 인증된 읽기 전용 Lambda Function URL (`/`, `/latest`, `/one-vs-one`) |
| `src/functions/config-sync.ts` | YAML 검증 후 DynamoDB 설정 및 스냅샷 재구축 |
| `src/functions/record-extraction.ts` | Gemini(`@google/genai`, `generateContent`) 호출, 이미지 fetch, 재시도·타임아웃 |
| `src/shared/record-extraction.ts` | 응답 파싱(`parseRecordScreenResult`), 다중 이미지 선택(`chooseRecord`), 프런트용 상태(`recordExtractionStatus`) — 순수 함수라 단위 테스트 가능 |
| `src/shared/record-overrides.ts` | `record-overrides.yaml` 파싱·검증 |
| `src/functions/streamer-review.ts` | Gemini(텍스트 전용) 호출로 한줄평 생성, 프롬프트 조립(`buildPrompt`), 재시도·타임아웃 |
| `src/shared/review-context.ts` | `review-context.yaml` 파싱·검증 |
| `scripts/backfill-reviews.ts` | 기존 백로그(전적은 있는데 한줄평이 없는 게시글)를 한 번에 채우는 백필 스크립트 (`pnpm run backfill:reviews -- --dry-run`, `--exclude-top N`으로 최신 N명은 배포 후 스케줄러가 처리하도록 남겨둘 수 있음) |
| `scripts/test-streamer-review.ts` | 실제 스트리머 한 명으로 한줄평 프롬프트 품질을 로컬에서 확인하는 스모크 테스트 (`pnpm run test:streamer-review -- --slug <slug>`, DB에 쓰지 않음) |
| `src/shared/division-theme.ts` | 디비전 1~10 색상 매핑(`DIVISION_COLORS`, `divisionColor()`) — 리스트 뱃지·상세 모달·카드형 보기가 공유하는 단일 기준 |
| `scripts/backfill-records.ts` | 기존 스트리머의 `lastPost`를 대상으로 한 번만 돌리는 백필 스크립트 (`pnpm run backfill:records -- --dry-run --limit 5`) |
| `src/shared/*.ts` | 타입, 디비전 산정, 별칭 매칭, 1:1 판정, 타임라인, 트로피, 이미지 필터 |
| `infrastructure/` | AWS 인프라 Terraform |
| `.github/workflows/sync-roster.yml` | main의 YAML 변경을 Config Sync Lambda로 전송 |
| `.github/workflows/deploy-backend.yml` | main의 백엔드 코드 변경을 감지해 Lambda 이미지 자동 빌드·배포 |
| `.github/workflows/sync-roster-collabot.yml` | CollaBot 신청자 목록으로 `roster.yaml`을 양방향 자동 동기화 (현재 `workflow_dispatch`만, 스케줄 미등록) |
| `scripts/fetch-collabot-export.mjs` | CollaBot 신청자 게시글의 "Excel로 내보내기" 버튼을 Playwright로 자동화해 xlsx를 내려받음 |
| `scripts/sync-roster-from-collabot-xlsx.mjs` | 위 xlsx와 `roster.yaml`을 SOOP ID 기준 비교해 추가/제거 계산·적용, 안전장치·검증 포함 |
| `scripts/sync-roster-from-comments-xlsx.mjs` | 로컬에 수동으로 내려받은 같은 xlsx에서 신규 신청자만 추가(제거 없음, 수동 실행용) |
| `scripts/lib/collabot-xlsx.mjs`, `scripts/lib/roster-text.mjs` | 위 두 xlsx→roster 스크립트가 공유하는 xlsx 파싱·`roster.yaml` 원문 텍스트 편집 헬퍼 |

### 프런트엔드 구조 (`src/web`)

원래 하나의 파일(약 3,200줄)이던 `App.tsx`를 상태 로직(훅)과 화면(섹션 컴포넌트)으로 분리했다. `App.tsx`는 훅으로 상태를 모아 컴포넌트에 props로 넘기는 얇은 오케스트레이터만 남아 있다. 아래 표 이후 이 문서의 다른 절에서 "`src/web/App.tsx`"를 언급하는 부분은 실제로는 이 파일들에 있을 수 있으니 먼저 이 표에서 찾는다.

커스텀 훅(상태·파생 데이터):

| 파일 | 책임 |
| --- | --- |
| `useDashboardSnapshot.ts` | 스냅샷 로딩(`api.ts`) + `?fancyMembers=` URL 오버라이드 적용 |
| `useToast.ts` | 하단 토스트 알림 표시·자동 소멸 |
| `useSfxSettings.ts` | 효과음 on/off·볼륨 상태와 localStorage 동기화 |
| `usePendingAnnouncements.ts` | 미확인 공지 계산·확인 처리 |
| `useViewPreferences.ts` | 목록/카드 뷰 모드, 카드 줌, 카드 정렬 모드 |
| `useControlsStuck.ts` | 검색바가 상단에 고정됐는지(`IntersectionObserver`) |
| `useStreamerFilters.ts` | 검색·활동/효과음/업적 필터, 업적 판정, 디비전 통계, 카드 정렬 |
| `useEvaluationApplications.ts` | 1:1 평가 신청 검색·상태 필터 |
| `useLatestActivity.ts` | 최근 24시간 게시글(`latest`)과 축하 배너 슬라이드 계산 |

섹션 컴포넌트(화면)와 공용 UI:

| 파일 | 책임 |
| --- | --- |
| `TopBar.tsx` | 상단 브랜드·네비·최신소식/업적 버튼 |
| `HeroSection.tsx` | 히어로 타이틀, 동기화 상태 표시 |
| `ControlsBar.tsx` | 검색창 + 디비전 필터 or 1:1 평가 필터 세그먼트 |
| `ViewToolbar.tsx` | 신청 현황 요약, 뷰 모드/줌/정렬 컨트롤 |
| `DivisionResults.tsx` | 디비전 보드(목록 `StreamerCard` / 카드 `CardBoard`), 스쿼드 빌더 진입 버튼 |
| `EvaluationList.tsx`, `EvaluationViews.tsx` | 1:1 평가 카드 목록과 상세 모달 |
| `LatestFeedDrawer.tsx` | 최신 소식(24시간) 드로어 |
| `DetailModal.tsx` | 스트리머 상세 모달(승급 타임라인·활동글·Gemini 한줄평 포함) |
| `TrophyModal.tsx` | 업적 모달 |
| `GeminiReviewSection.tsx` | Gemini 한줄평 표시(타이핑 애니메이션) |
| `StreamerActivitySection.tsx` | 스코프/11대11 활동 목록, 승급 타임라인, 이전 승격 게시글 |
| `StreamerCards.tsx` | `StreamerCard`(목록), `StreamerFifaCard`·`CardBoard`(카드형 보기) |
| `cardVisuals.tsx` | `RecordBadge`, `FifaShield`, `FancyAvatar`/`FancyName` 등 카드 시각 요소(리팩터 이전부터 별도 파일) |
| `Modal.tsx` | 공용 모달 셸, `FancyBurst`, `CafeLink`/`SoopLink` |
| `AnnouncementModal.tsx` | 공지 모달·상단 공지 위젯 |
| `SfxControls.tsx` | 효과음 토글, 최초 진입 안내 팝업 |
| `JandyVideoSection.tsx` | 잔디동 참고 영상 캐러셀 |
| `FavoriteCelebration.tsx` | 상단 축하 배너 |

데이터·유틸:

| 파일 | 책임 |
| --- | --- |
| `appHelpers.ts` | `divisions` 배열, `?fancyMembers=` 오버라이드, 목록 텍스트 빌더 |
| `storage.ts` | localStorage 헬퍼 전체(공지/업데이트 seen, sfx, 뷰 모드, 카드 줌) |
| `sfxAudio.ts` | 효과음 재생/정지 |
| `formatters.ts` | 날짜·기간 포맷터 |
| `jandyVideosData.ts`, `announcementsData.tsx` | 정적 콘텐츠 데이터 |

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

- 상단 `FavoriteCelebration` 배너는 공개 스냅샷의 `latestPosts[0]`(가장 최근 승격 글)이 **2시간 이내**일 때만 문구를 바꾼다. `src/web/useLatestActivity.ts`의 `celebrationSlides` 계산이 이 로직의 위치다.
- 해당 스트리머의 `roster.yaml` `celebrationMessage`가 있으면 그 문구의 `{n}`을 승격된 디비전 숫자로 치환해 보여준다. 없으면 `{displayName}의 {n}부 리그 승격을 축하합니다~!!` 기본 문구를 쓴다.
- 2시간이 지나거나 오늘 승격 글이 없으면 기본값 `축 왁굳형, 핫짱 즐겨찾기 목록 입성`으로 돌아간다.
- `celebrationMessage`는 `RosterEntry`와 `StreamerRecord` 양쪽 타입에 있어야 하며, `buildStreamerRecords`(`src/shared/promotion.ts`)가 로스터 → 스트리머 레코드 변환 시 이 필드를 빠뜨리지 않아야 프런트까지 전달된다. 백엔드 로직이라 반영에는 `deploy-backend.yml` 배포 + scraper의 다음 3분 주기 실행이 필요하다.

### 통산 전적(W-D-L) 자동 인식

- 승급 게시글 이미지(`PromotionPost.imageUrls`)를 Gemini(`gemini-3.6-flash`, 모델명은 `GEMINI_MODEL`로 재정의 가능)에 보내 화면을 읽게 한다. 프롬프트는 다음을 명시적으로 구분한다: (1) "현재 시즌" 패널/문구가 붙은 시즌 중 기록은 무시, (2) "시즌: N" 표기와 함께 있는(현재 시즌이라 불리지 않는) 쪽이 통산 누적, (3) "폼(Form)" W/L/D 스트릭은 전적이 아님, (4) 얼굴캠·채팅·알림 배너는 무시. 로비 메인 화면과 경기 중 워크아웃/선수카드 오버레이 두 화면 종류를 모두 지원한다.
- `temperature: 0`으로 호출하지만 완전히 결정적이지 않다 — 명백한 전적 화면에서도 가끔 `isRecordScreen: false`를 반환하는 게 실측됐다. `extractFromImage`(`src/functions/record-extraction.ts`)가 이미지당 최대 3회(`GEMINI_MAX_ATTEMPTS_PER_IMAGE`) 재시도한다.
- `responseSchema`는 `wins`/`draws`/`losses`도 `required`에 포함해야 한다. `isRecordScreen`만 필수였을 때 모델이 `{isRecordScreen:true, wins:53}`처럼 나머지 필드를 생략한 불완전 JSON을 반환하는 게 실측으로 확인됐다 — 스키마를 건드릴 때 이 required 목록을 지키지 않으면 조용히 스킵되는 회귀가 재발한다.
- SDK의 `httpOptions.timeout`만으로는 모든 행(hang)을 못 막는 게 실측됐다(Windows 로컬 환경에서 30초+ 무응답 관찰). `extractFromImageOnce`를 `Promise.race` 기반 `withTimeout`으로 한 번 더 감싼 것이 그래서다 — 이 바깥쪽 타임아웃을 제거하지 말 것.
- 게시글에 이미지가 여러 장이면 순서대로 시도해 첫 유효 매치를 채택한다(`chooseRecord`, `src/shared/record-extraction.ts`). 이후 이미지에서 다른 값이 나오면 `PromotionPost.recordNeedsReview`를 세워 사람이 볼 수 있게 하되, 자동으로 다수결·평균을 내지 않는다.
- `recordExtractionStatus(post)`(같은 파일)가 프런트에서 쓸 `"pending" | "success" | "failed"` 상태를 `record`/`imageUrls`/`recordExtractionAttempts`로부터 계산한다. 별도 필드로 저장하지 않으므로 값이 어긋날 일이 없다.
- **Gemini 무료 티어는 모델당 하루 20건**으로 매우 낮다(`GenerateRequestsPerDayPerProjectPerModel-FreeTier`). 이 프로젝트 규모(스트리머 다수, 매일 새 글)에서는 며칠 안에 소진된다 — 이 API 키가 속한 Google Cloud 프로젝트에 **결제 계정 연결이 필수**다. 결제를 연결하면 요청당 종량제로 바뀌며 이미지 1장당 비용은 여전히 매우 낮다.
- 수동 보정은 `record-overrides.yaml`(`src/shared/record-overrides.ts`)로 한다. `soopId` + `division`으로 스트리머를 특정하며, **그 스트리머의 현재 디비전이 `division`과 일치할 때만** 적용된다(`buildStreamerRecords`, `src/shared/promotion.ts`) — 승급/강등 후에는 자동으로 무효화되므로 오래된 값이 실수로 남아 적용될 수 없다. 적용된 값은 `StreamerRecord.record`에 실리며 없으면 `lastPost.record`로 폴백한다.
- 기존 스트리머를 한 번에 채우는 백필은 `pnpm run backfill:records`(`scripts/backfill-records.ts`)로 한다. `--dry-run --limit N`으로 DB에 쓰지 않고 먼저 확인할 수 있다.

### Gemini 한줄평 (AI 코멘트)

- 트리거 조건은 정확히 하나다: `StreamerRecord.record`가 있고(자동 추출 성공이든 `record-overrides.yaml` 수동 지정이든 무관) 그 스트리머의 `lastPost.review`가 아직 없을 것. `backfillMissingReviews`(`src/functions/scraper.ts`)가 매 실행마다 조건을 만족하는 게시글을 최신순으로 최대 5건(`MAX_REVIEW_BACKFILLS_PER_RUN`) 골라 시도하고, 글당 최대 3회(`MAX_REVIEW_ATTEMPTS`)까지만 재시도한다 — 실패해도 무한정 재시도하지 않는다.
- 이미지 없이 텍스트 프롬프트만 보낸다(`generateStreamerReview`, `src/functions/streamer-review.ts`). 모델은 `GEMINI_REVIEW_MODEL`이 없으면 record-extraction과 같은 `GEMINI_MODEL`(기본 `gemini-3.6-flash`)로 폴백한다 — 재배포 없이 record-extraction과 같은 모델을 그대로 쓴다.
- 프롬프트는 (1) 사이트 목적(잔디동 지원자 디비전 현황 대시보드라는 고정 문구), (2) 이 스트리머의 디비전·전적·승급 이력, (3) `RosterEntry.reviewNote`(있으면), (4) 전체 로스터의 디비전 현황 목록, (5) `review-context.yaml`의 시사성 안내(있으면) 순으로 구성된다.
- 톤 지침이 명확하다: 형식적인 "응원합니다/화이팅" 같은 멘트로 끝맺지 않고, 성적이 나쁘면 예능감 있게 신랄하게, 좋으면 오버스럽게 과장해서 극찬하는 "방송각" 톤을 쓴다(인신공격은 금지). `temperature: 0.9`로 표현력을 확보한다. 이 톤은 사용자가 명시적으로 요청한 것이라 임의로 밋밋하게 되돌리면 안 된다.
- `review-context.yaml`은 "지금은 유효하지만 나중엔 바뀌거나 필요 없어질 수 있는 시사성 안내"(예: 진행 중인 잔디동 모집 공고)를 담는 용도다. `record-overrides.yaml`과 동일한 파이프라인(Git → `sync-roster.yml` → `config-sync.ts` → DynamoDB `CONFIG/REVIEW_CONTEXT`)을 타므로, 캠페인이 끝나면 `context`를 빈 문자열로 바꿔 push하기만 하면 되고 코드 재배포는 필요 없다.
- `RosterEntry.reviewNote`(선택)는 스트리머 개인에 대한 자유 텍스트 배경 정보다. 값이 있으면 프롬프트의 "추가 정보"로 그대로 들어간다. `celebrationMessage`와 마찬가지로 `RosterEntry`/`StreamerRecord`/`buildStreamerRecords` 세 곳 모두에 반영돼 있어야 스냅샷까지 전달된다(아래 "변경 시 주의할 점" 참고).
- 프런트(`src/web/GeminiReviewSection.tsx`)가 실제로 표시하는 건 게시글의 `review` 문자열이 아니라 `StreamerRecord.latestReview`라는 파생 필드다. `latestReviewFrom`(`src/shared/promotion.ts`)이 이 스트리머의 게시글 중 `review`가 있는 가장 최신 것을 찾고, 그 게시글이 `lastPost`와 같으면 `isCurrent: true`(현재 평가), 다르면 `isCurrent: false`(새 게시글은 올라왔지만 아직 조건 미충족이거나 분석 중 — UI에 "이전 평가" 뱃지와 별도 안내문으로 표시)로 표시한다.
- `latestReview`는 저장되지 않고 매번 `buildStreamerRecords`가 게시글에서 다시 계산한다(`record`가 항상 재계산되는 것과 동일한 이유) — 따라서 이 필드가 화면에 보이려면 **`review`가 붙은 코드가 실제로 배포된 뒤** scraper가 최소 한 번 더 돌아야 한다. 코드 배포와 데이터 배포(3분 스케줄러)는 별개다.
- 기존 백로그(record는 있는데 review가 없는 게시글)를 한 번에 채우는 백필은 `pnpm run backfill:reviews`로 한다. 처음 배포할 때는 `--exclude-top 5` 정도로 최신 몇 명은 일부러 남겨서, 실제 배포된 scraper가 정상적으로 한줄평을 만들어내는지 라이브로 확인하는 용도로 쓸 수 있다.

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

### 디비전 색상·전적 배지·카드형 보기 (프런트엔드, `src/web/StreamerCards.tsx` · `cardVisuals.tsx` · `ViewToolbar.tsx`)

- 디비전 1~10은 각각 다른 색을 쓴다(1~3부는 금·은·동). 색상 표는 `src/shared/division-theme.ts`의 `DIVISION_COLORS`가 유일한 기준이며, 리스트의 `D{n}` 뱃지·상세 모달의 `{n}부` 텍스트·카드형 보기의 방패 배경이 모두 이 값을 `--division-color` CSS 변수 또는 직접 hex로 넘겨받아 쓴다. 색을 바꾸려면 이 파일 하나만 고치면 된다.
- 전적(W/D/L) 배지는 `RecordBadge` 컴포넌트(`src/web/cardVisuals.tsx`)가 그린다. `streamer.record`가 있으면 파랑/회색/빨강으로 승/무/패를 표기하고, 없으면 두 경우로 나뉜다: `lastPost`가 아예 없으면(보고 없음) 회색 `-/-/-`, `lastPost`는 있는데 `record`가 없으면 `recordExtractionStatus(lastPost)`(`src/shared/record-extraction.ts`)를 봐서 `"pending"`이면 "집계중", 그 외(`"failed"`)는 마찬가지로 회색 `-/-/-`로 표시한다 — 추출 실패와 데이터 없음을 프런트에서 굳이 구분하지 않기로 한 의도적 선택이다.
- 목록/카드 뷰 토글(`viewMode: "list" | "card"`, `src/web/useViewPreferences.ts`)과 카드 뷰 전용 정렬 토글(`sortMode: "division" | "winRate"`, 승률 없는 스트리머는 정렬 방향과 무관하게 항상 맨 뒤)이 검색창과 디비전 보드 사이, `controls-bar`(스티키 영역) 바깥의 `view-toolbar`(`src/web/ViewToolbar.tsx`)에 있다. `viewMode`와 카드 줌 단계는 새로고침 후에도 유지되도록 localStorage에 저장한다(`loadViewMode`/`saveViewMode`, `loadCardZoomLevel`/`saveCardZoomLevel`, `src/web/storage.ts`). `sortMode`만 새로고침 시 `"division"`으로 초기화되며 의도적으로 저장하지 않는다.
- 카드형 보기(`StreamerFifaCard`, `src/web/StreamerCards.tsx`)는 디비전 구분 없이 정렬된 스트리머를 방패 모양 SVG(`FifaShield`, `src/web/cardVisuals.tsx`) 위에 얹는다. `FIFA_SHIELD_OUTER`/`FIFA_SHIELD_INNER`의 path 좌표(`viewBox 0 0 300 450`)는 사용자가 제공한 참고 SVG를 그대로 가져온 것이라 임의로 좌표를 손보면 방패 윤곽이 깨질 수 있다 — 바깥 테두리·안쪽 흰색 하이라이트 테두리는 고정이고, 배경 그라데이션(`mixHex()`로 디비전 색을 검정/흰색과 섞어 생성)만 디비전별로 바뀐다. 이름은 카드색 계열의 진한 색, 나머지 텍스트는 흰색이며 전부 8방향 `text-shadow`(`--text-outline` CSS 변수)로 검정 외곽선을 둘러 어떤 배경 색에서도 읽히게 했다.

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
| `CONFIG` | `DIVISION_OVERRIDES` | 파싱된 `division-overrides.yaml` |
| `CONFIG` | `RECORD_OVERRIDES` | 파싱된 `record-overrides.yaml` |
| `CONFIG` | `REVIEW_CONTEXT` | 파싱된 `review-context.yaml` |
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

1. `roster.yaml`, `one-vs-one-results.yaml`, `division-overrides.yaml`, `record-overrides.yaml`, `review-context.yaml` 중 필요한 파일을 수정한다.
2. `pnpm typecheck && pnpm test`를 실행한다.
3. main에 반영하면 GitHub Actions(`sync-roster.yml`)가 자동으로 네 파일을 모두 읽어 Config Sync Lambda를 호출한다.
4. Actions를 쓸 수 없으면 README의 `aws lambda invoke` 명령으로 직접 동기화한다.

`record-overrides.yaml`은 `soopId` + `division`으로 스트리머를 특정하는 항목의 배열이며, 그 스트리머의 **현재** 디비전이 `division`과 일치할 때만 적용된다. 자세한 규칙은 위 "통산 전적(W-D-L) 자동 인식" 절을 본다.

`roster.yaml`의 필수 실무 필드는 `displayName`, `autoUpdate`이며, `slug`는 생략하면 `soopId`로 만든다. 카페 작성자와 연결하려면 `cafeAliases`를 반드시 실제 표기대로 채운다. 완전히 빈 템플릿 행은 무시된다.

### CollaBot 신청자 자동 동기화

`sync-roster-collabot.yml`이 CollaBot 신청자 게시글(https://colla.bot/station/ecvhao/post/204050719)을 기준으로 `roster.yaml`을 자동 갱신한다. 흐름: Playwright로 그리드가 렌더링될 때까지 기다렸다가(`.ag-row` 등장, AG Grid 사용) "Excel로 내보내기" 클릭 → 다운로드된 xlsx를 `roster.yaml`과 SOOP ID로 비교 → 신청자에 없는 로스터 항목 제거, 로스터에 없는 신청자 추가(`cafeAliases`는 SOOP 닉네임 기본값) → `main`에 직접 커밋·push.

- **트리거 체인**: 이 워크플로의 push는 일반 `GITHUB_TOKEN`이 아니라 `ROSTER_AUTOSYNC_TOKEN`(레포 전용 fine-grained PAT, Contents: Read/write)으로 인증한다 — `GITHUB_TOKEN`으로 push하면 GitHub가 다른 워크플로 트리거를 막기 때문에, PAT를 안 쓰면 `sync-roster.yml`(AWS 반영)이 조용히 발동하지 않는다.
- **안전장치**: 새로 가져온 신청자 수가 0명이거나 현재 로스터의 절반 미만이면(`MIN_LIVE_APPLICANT_RATIO`, 기본 0.5) 전체 동기화를 중단하고 `roster.yaml`을 건드리지 않는다 — CollaBot 페이지 로딩 실패를 "다들 신청 취소함"으로 오인해 로스터를 날리는 사고 방지.
- **필요 Secrets**: `MAIL_USERNAME`, `MAIL_PASSWORD`(Gmail 앱 비밀번호), `ROSTER_AUTOSYNC_TOKEN`.
- **결과 확인**: 실행마다 추가/제거 요약이 Actions 실행 화면의 Job Summary(`$GITHUB_STEP_SUMMARY`)에 표시된다. 변경이 있거나 안전장치가 발동하면 `bbaa3218@gmail.com`으로 메일도 간다.
- 현재는 `workflow_dispatch`(`dry_run` 입력, 기본 `true`)만 등록돼 있고 `schedule:`은 아직 없다. 매일 자동 실행하려면 `dry_run: false`로 최소 1회 실제 실행해 커밋·`sync-roster.yml` 발동·메일 수신까지 확인한 뒤 `schedule: - cron: "0 0 * * *"`(09:00 KST)을 추가한다.

### 배포 순서

최초 인프라 구축(1회):

1. ECR 저장소를 Terraform으로 먼저 만든다.
2. `./scripts/deploy.ps1 -ImageTag <tag>`로 Lambda 이미지 빌드·푸시한다.
3. `terraform apply -var='image_uri=<pushed-uri>' -var='gemini_api_key=<key>'`로 나머지 AWS 인프라를 적용한다. `gemini_api_key`가 비어 있으면 전적 자동 추출이 조용히 꺼진다(에러 없이 스킵). 키는 [aistudio.google.com/apikey](https://aistudio.google.com/apikey)에서 발급하며, **해당 키의 Google Cloud 프로젝트에 결제 계정을 연결해야** 무료 티어의 하루 20건 한도가 풀린다.
4. Terraform의 `reader_function_url`, `reader_origin_token`을 Cloudflare Worker Secret `API_ORIGIN_URL`, `ORIGIN_AUTH_TOKEN`에 각각 설정하고 `npx wrangler deploy`한다.
5. GitHub OIDC를 쓸 경우 Terraform 출력값을 Actions Secret `AWS_ROSTER_SYNC_ROLE_ARN`, `AWS_ROSTER_SYNC_FUNCTION_NAME`, `AWS_BACKEND_DEPLOY_ROLE_ARN`에 설정한다.

이후 일상적인 변경(자동, 단 **처음 한 번은 아래 순서를 지켜야 함** — 자세한 내용은 바로 다음 항목 참고):

- **백엔드**(`src/functions`, `src/shared`, `Dockerfile` 등): main에 push하면 `deploy-backend.yml`이 이미지를 빌드·ECR 푸시하고 4개 Lambda를 `aws lambda update-function-code`로 갱신한다. Terraform은 이 이미지 태그를 관리하지 않도록 각 `aws_lambda_function`에 `lifecycle { ignore_changes = [image_uri] }`가 설정돼 있다 — 인프라 변경으로 `terraform apply`를 다시 돌려도 배포된 이미지가 되돌아가지 않는다.
- **프런트**(`src/web`): Cloudflare가 GitHub 저장소와 연동돼 있어 push 시 자동 배포된다.
- **로스터/결과/오버라이드 YAML**(`roster.yaml`, `one-vs-one-results.yaml`, `division-overrides.yaml`, `record-overrides.yaml`, `review-context.yaml`): `sync-roster.yml`이 Config Sync Lambda를 호출한다.
- 세 워크플로 모두 `push` 파일 경로 기준으로 독립 트리거되므로, 한 커밋에 여러 영역이 섞여도 필요한 워크플로만 돈다.
- **주의**: `sync-roster.yml`이 새 필드(예: `recordOverridesYaml`)를 Config Sync Lambda 이벤트에 실어 보내도, **그 필드를 읽는 코드가 실제로 배포된 Lambda에 없으면 조용히 무시된다** (핸들러가 모르는 키는 그냥 버려짐, 에러 없음). 즉 `record-overrides.yaml`처럼 YAML 스키마와 백엔드 파싱 로직을 같이 추가한 커밋은, `deploy-backend.yml`이 새 Lambda 코드를 실제로 배포한 **이후에** push된 YAML 변경부터 정상 반영된다. 같은 커밋에 코드와 YAML을 함께 올리면 두 워크플로가 동시에 트리거되어 순서가 보장되지 않으므로, 새 오버라이드 기능을 처음 쓸 때는 배포 완료를 확인한 뒤 YAML을 한 번 다시 push(또는 workflow_dispatch로 `sync-roster.yml` 재실행)해서 확실히 반영한다.

### 장애 확인 순서

1. `https://<worker-domain>/healthz`를 확인한다. `ok`, `collection_degraded`, `snapshot_stale`, `snapshot_empty`, `upstream_unavailable` 중 하나를 반환한다.
2. CloudWatch의 Scraper Lambda 로그와 `*-scraper-errors` 알람을 확인한다.
3. `SYNC/STATE`의 `status`, `message`, `boards` 체크포인트를 확인한다. Naver 차단이면 데이터를 임의로 비우지 말고 차단 해소 후 다음 스케줄을 기다린다.
4. 로스터 변경이 화면에 없으면 GitHub Actions(`sync-roster.yml`) 결과와 Config Sync Lambda 로그를 확인한다.
4-1. `roster.yaml`이 CollaBot 신청자 목록과 어긋나 보이면 `sync-roster-collabot.yml` 실행 이력의 Job Summary를 먼저 본다 — 실행 자체가 안 됐는지(스케줄 미등록), 안전장치로 중단됐는지(신청자 수 급감), 아니면 정상 커밋됐는데 `sync-roster.yml`이 안 이어졌는지(PAT 만료·권한 문제)를 구분할 수 있다.
5. 백엔드 코드 변경(예: `src/shared`, `src/functions`)이 화면에 반영되지 않으면 `deploy-backend.yml` 실행 결과를 먼저 확인한다. 워크플로가 성공했어도 scraper는 3분 주기로만 스냅샷을 재생성하므로 반영까지 수 분 걸릴 수 있다.
6. 비용 한도에 도달한 경우 Budget Guard가 두 Scheduler를 `DISABLED`로 바꾼다. 예산 상태를 해제한 뒤 두 스케줄을 다시 활성화해야 수집이 재개된다.

## 변경 시 주의할 점

- Naver DOM 셀 위치·iframe·모바일 폴백은 쉽게 바뀔 수 있다. 수집기 변경 전 `naver.ts`의 CAPTCHA 감지와 이미지 호스트 필터를 유지하고, 실제 빈 게시판도 정상으로 처리하는 동작을 깨지지 않게 한다.
- Cloudflare Worker의 정적 진입 번들 이름(`assets/app.js`, `assets/app.css`)과 오래된 Vite 해시 경로 호환 처리는 배포 직후 캐시된 HTML이 깨지는 문제를 막는다. Vite 출력 규칙을 바꾸면 `src/worker.ts`도 함께 검토한다.
- Reader Lambda Function URL은 AWS 레벨에서 공개지만 `x-dashboard-origin` 비밀 헤더 없이는 403이다. 브라우저가 Function URL을 직접 사용하게 하거나 토큰을 `VITE_*` 환경 변수에 넣으면 안 된다.
- Lambda는 Playwright/Chromium을 사용하므로 로컬 Node 실행만으로 실제 수집 동작을 보장하지 않는다. 인프라 변경 뒤에는 컨테이너 이미지와 스케줄러 입력(`{ mode: ... }`)을 함께 확인한다.
- `store.ts`의 파티션별 읽기는 DynamoDB `Scan`을 쓴다. 데이터량이 커지면 GSI 또는 Query 가능한 키 설계로 바꾸는 것이 우선 개선 지점이다.
- `roster.yaml`에 새 선택 필드를 추가할 때는 `RosterEntry`(`src/shared/model.ts`), `StreamerRecord`(같은 파일), 그리고 `buildStreamerRecords`(`src/shared/promotion.ts`)의 반환 객체 세 곳 모두에 반영해야 한다. 타입에만 추가하고 `buildStreamerRecords`에서 값을 옮기지 않으면 컴파일은 통과하지만 스냅샷·프런트까지 값이 전달되지 않는다(`celebrationMessage`에서 실제로 발생했던 문제).
- `scripts/fetch-collabot-export.mjs`의 그리드 준비 감지는 `.ag-row`(AG Grid) 셀렉터에 의존한다. 실측 결과 화면의 "선택한 스트리머..." 버튼은 로드 상태와 무관하게 항상 비활성 상태라 신뢰할 수 없었다 — CollaBot이 그리드 라이브러리를 바꾸거나 클래스명을 바꾸면 이 스크립트가 조용히 타임아웃(30초)으로 실패한다. 실패 시 `--debug-prefix` 스크린샷·HTML을 워크플로 아티팩트로 남기니 먼저 그걸로 실제 렌더링 상태를 확인한다.

## 새 세션 시작용 체크리스트

1. 이 문서와 `README.md`를 읽는다.
2. `git status --short`, `git log --oneline -8`로 작업 상태와 최근 의도를 확인한다.
3. UI는 `src/web/App.tsx`(오케스트레이터, 상태는 `use*.ts` 훅·화면은 섹션 컴포넌트로 분리 — "프런트엔드 구조" 표 참고), 수집은 `src/functions/scraper.ts`, Naver 셀렉터는 `src/functions/naver.ts`, 배포는 `infrastructure/main.tf`부터 본다.
4. 변경 전 `pnpm typecheck && pnpm test`를 기준선으로 실행한다.
