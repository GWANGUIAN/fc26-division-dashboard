# 08. 구현 로드맵 — 세션 계획, 변환 스크립트 사양, 테스트, 리스크

이 문서는 **구현 세션 S1~S6의 범위·산출물·완료 기준**과, 병렬로 진행하는 **아트 트랙 A1~A7**, 이미지 변환 스크립트 사양, 테스트 계획, 미해결 항목을 정리한다. 전체 진행 체크는 [README.md](README.md)의 핸드오프 체크리스트와 [09-asset-checklist.md](09-asset-checklist.md)를 갱신한다.

## 0. 진행 원칙

1. **코드와 아트는 병렬**: 에셋이 없으면 색 사각형·이니셜 플레이스홀더로 돌아가도록 처음부터 만든다([01 §8](01-concept-and-architecture.md#8-로딩-화면과-프리로더)). 아트가 도착하는 대로 파일만 교체.
2. **한 세션 = 한 덩어리**: 세션 끝에는 항상 (a) `pnpm typecheck && pnpm test` 통과, (b) 배포 후 사용자가 확인할 수 있는 상태, (c) README 체크리스트 갱신.
3. **기존 동작 불변**: 기존 미니게임/카드에는 optional prop만 추가. 기존 테스트가 깨지면 안 된다.
4. **검수 방식**: 브라우저 자동 검증 대신 `?worldDebug`(충돌박스·트리거·좌표·텔레포트·플래그/조각 설정)를 두어 사용자가 배포본에서 빠르게 확인한다(프로젝트 메모리 규칙: 사용자가 배포 후 직접 확인).
5. **데이터 주도**: 미션·대사·맵은 코드가 아니라 `data/`의 데이터. 임계값 튜닝이 코드 수정 없이 가능해야 한다.
6. **각 세션 시작 절차**: `docs/world/README.md` 읽기 → `git status`/`git log -5` → `pnpm typecheck && pnpm test` 기준선 확인 → 이 문서의 해당 S# 섹션 실행.

## 1. 세션 로드맵

| 세션 | 이름 | 핵심 산출 | 필요한 아트(P0) |
| --- | --- | --- | --- |
| **S0** | 기획 문서 (완료) | `docs/world/*` | — |
| **S1** | 기반 | 오버레이·버튼·로딩·캔버스 루프·입력·충돌·저장 | 없음(플레이스홀더) |
| **S2** | 월드 뼈대 | 맵 로더·지면/소품/건물 렌더·씬 전환·NPC·대화 UI·캐릭터 선택·가이드 | 캐릭터 P0, `terrain-core`, 프레임 시트 A |
| **S3** | 미션·진행 | 미션 상태기계·마커·로그·HUD·기존 기능 연동·월드 미션 메커닉·진행도 색 복원 | 프레임 시트 B, 아이콘, `props-collect` |
| **S4** | 스토리 콘텐츠 | 전 대사·전 실내·지구 연출·결전·엔딩(단체샷) | 건물/실내 P0 |
| **S5** | 엔딩 후 | 잔디 러시·랭크·일일 미션·수집·카드 도감·제초동 구역 | 러시 에셋, 오리지널 NPC |
| **S6** | 폴리시·릴리스 | 오디오 통합·성능·접근성·크레딧·공지·핸드오프 | 오디오 P0/P1, 나머지 |

### S1 — 기반 (Foundation) — ✅ 구현 완료 (2026-09-19, 아래 "구현 결과" 참고)
**범위**
- 저장소 준비: `.gitignore`에 `tmp/world-src/` 추가, `package.json`에 `convert:world-art` 스크립트, `scripts/convert-world-art.mjs` 뼈대(캐릭터·지면 우선, [§3](#3-변환-스크립트-사양)).
- `src/web/world/` 폴더 생성, `WorldToggle`(좌상단, 이미지 없을 때 CSS 폴백 판+글자), `WorldOverlay`(lazy, z90, `useBodyScrollLock`/`useEscape`, 포커스 이동), `WorldCanvas`(논리 640×360 + 정수 배율 + `pixelated`).
- `engine/`: `loop`, `input`, `camera`, `collision`(+ test), `scene` 뼈대.
- `worldAssets.ts`(glob 매니페스트 + 프리로더 + 진행률) + `LoadingScreen` + `TitleScreen`(플레이스홀더 배경).
- `storage.ts`(`fc26-world-save-v1` 검증/마이그레이션 + `fc26-world-discovered-v1` + 설정) + test.
- `data/worldCast.ts`(20명 하드코딩).
- `?worldDebug` 오버레이(충돌박스/좌표/FPS).
- `App.tsx`: `worldOpen` 상태 + lazy + 토글, 모바일(≤680px)에서 버튼 숨김.
**완료 기준(DoD)**
- 버튼 클릭 → 로딩(진행률) → 타이틀 → 빈 평지에서 플레이스홀더 캐릭터가 이동·충돌·정수 배율로 선명하게 렌더, Esc/닫기 버튼으로 종료, 재진입 정상.
- 세이브 검증 테스트, 충돌 테스트 통과. 기존 앱 동작 불변.
**수정 기존 파일**: `App.tsx`, `package.json`, `.gitignore`(+ 신규 파일들)

**구현 결과 (S1)**
- 범위 밖이던 **변환 스크립트를 카테고리 전부로 완성**하고 원본 151장을 변환했다(447 webp). 결과·QA는 [09 §10](09-asset-checklist.md#10-변환-결과와-qa-s1-2026-09-19).
- 추가로 바뀐 기존 파일: `MusicPlayer.tsx`(전역 음악 일시정지/복귀 훅, 결정 #1), `.gitignore`에 `tmp/world-src/` 추가 + 이미 커밋돼 있던 원본 PNG 151장을 `git rm --cached`로 추적 해제(디스크 파일은 유지). `styles.css`는 수정하지 않았다(결정 #2의 여백 예약은 `world-toggle.css`의 `:has()` 규칙).
- 신규: `src/web/world/`(`WorldToggle`·`WorldOverlay`·`WorldCanvas`·`storage`·`worldAssets`·`stageLayout`·`debug`, `engine/{loop,input,camera,collision,scene,render,world}`, `data/{worldCast,sandboxMap}`, `ui/{LoadingScreen,TitleScreen}`), `src/web/musicControl.ts`, `scripts/{convert-world-art.mjs,lib/world-art-math.mjs,world-art-manifest.json}`.
- **S1 한정 임시 요소**(S2에서 교체): 캐릭터 선택이 없어 새 게임은 항상 재닌으로 시작, 맵은 `data/sandboxMap.ts`의 40×30타일 빈 평지(소품 몇 개로 충돌 확인), 지면은 `terrain/core`의 잔디 4종을 해시로 깐 1장짜리 캔버스, Esc는 어느 화면에서든 곧바로 월드를 닫는다(대사/모달 우선 처리는 S3 스택, #3).
- 테스트: 충돌·카메라·입력·루프·씬 전환·세이브 검증/마이그레이션·스테이지 배율·음악 일시정지·변환 수학·매니페스트 무결성.

### S2 — 월드 뼈대 — ✅ 구현 완료 (2026-09-19, 아래 "구현 결과" 참고)
**범위**
- 맵 데이터(JSON) 로더, `scripts/build-world-map.mjs`(존/길/건물 표로 `terrainRows` 초안 생성), 지면 청크 캐시 렌더 + 지구 경계 블렌딩, y-sort, `above` 레이어, 소품/건물 스프라이트 배치(`propDefs.ts`).
- 씬 전환(문 트리거 → 페이드 → 실내), 실내 이미지 렌더(640×384 고정 카메라) + 충돌 사각형.
- NPC 엔티티(stay/idle/wander/face-player), 상호작용(전방 28px, `E` 프롬프트), `DialogueBox`(DOM, 타이프라이터, 초상, 선택지), 임시 대사.
- `CharacterSelect`(11명), 프롤로그 컷, 집에서 시작, `CoachMarks`(C1~C3), 지구 진입 토스트.
- `audio/worldAudio.ts` 뼈대(BGM 크로스페이드, SFX 풀).
**DoD**: 캐릭터 선택 → 집에서 시작 → 밖으로 나와 마을 이동 → NPC와 임시 대사 → 집 입장/퇴장, 코치마크 완료, 맵 무결성 테스트(문 목적지/스폰/NPC id/에셋 존재) 통과.
**아트 도착 시 교체**: 캐릭터 아틀라스·초상, `terrain-core`, 건물 이미지.

**구현 결과 (S2)**
- **맵**: `scripts/build-world-map.mjs`(존/길/건물 표 → 지면·충돌·문·NPC·소품, `--ascii`/`--terrain-only`)가 `data/maps/overworld.json`(543 소품·55 충돌·17 NPC)을 만들었고 실내 19곳 JSON은 이미지를 보며 손으로 잡았다. 문서 표끼리 부딪치던 곳(길이 집을 관통, 스타디움 문이 그림과 반대, 지구 사이 빈 줄, 우편함이 집 안)을 [03](03-map-design.md)에서 고쳤다.
- **렌더**: 512px 지면 청크 캐시(lush/withered) + 지구 경계 디더 블렌딩 + 지구 복원값 크로스페이드 훅, 정적 y-sort 병합, `above`(소품별 px), 소품 lush/withered 크로스페이드, 캐릭터 그림자, 집 이름표(코드).
- **씬/월드**: 문 트리거 → 페이드 → 실내(이미지는 페이드 동안 지연 로드·캐시), NPC 4종 AI, 전방 28px 프로브 상호작용 + `E` 프롬프트, 임시 대사 상자(타자기·초상·선택지), 캐릭터 선택(4×3 카드), 프롤로그, 코치마크 C1~C3(J 키는 통과 + 토스트만), 지구 토스트, 오디오 뼈대, 세이브(이어하기는 `prologue-done`만).
- **디버그(`?worldDebug`)**: 격자 타일 좌표, 충돌(빨강)·문(청록)·조사 영역(보라)·NPC 몸/걷기 영역(주황)·상호작용 프로브(연두), 좌측 DOM 패널(씬 20곳 텔레포트+타일 지정, 색 복원 0~100% 미리보기, 벽 통과, 캔버스 클릭 좌표 px/타일 표시·복사).
- **테스트**: 맵 무결성·도달성(스폰에서 모든 문 앞·NPC까지 걸어갈 수 있는지), 맵 스크립트, 씬 빌드, 충돌 합성, NPC AI, 상호작용, 지면 블렌딩 수학, 대사 러너, Esc 우선순위, 코치 진행, 캐릭터 선택 격자, 오디오(크로스페이드·없는 파일 무음), 세이브(새 게임/이어하기 조건), 씬 전환(비동기 유지), 그리고 **가짜 캔버스로 진짜 엔진을 헤드리스로 돌리는 스모크 테스트**(20개 씬 렌더·문 왕복·엘더 대화·입력 잠금).
- **S2 결정**: ① `above`는 소품별 px(나무 40/큰 참나무 48/아치 48–64), 나머지는 y-sort만. ② 건물은 보이는 스프라이트 전체가 벽·문 칸만 통과(트리거 아래 12px 깎음). ③ 코치마크는 이동을 막지 않는 말풍선(Esc로 건너뜀). ④ "새로 시작"은 프롤로그를 마칠 때까지 기존 세이브를 지우지 않는다. ⑤ 소품 충돌은 05 표를 옮기되 보이는 그림보다 크면 그림 크기로 줄임([09 §11](09-asset-checklist.md#11-s2-소품-충돌-크기-대조-2026-09-19)).
- **범위 밖으로 남긴 것**: 물 애니메이션·지구별 파티클/앰비언스/색조, 미션·마커·HUD·미션 로그·일시정지 메뉴(S3), 실제 대사(S4), 모달(미니게임·카드) 연결, 제초동 구역 개방.

### S3 — 미션·진행 — ✅ 구현 완료 (2026-09-19, 아래 "구현 결과" 참고)
**범위**
- `state/missions.ts` 상태기계(locked→available→active→ready→completed) + test, `data/missionDefs.ts`(11개 + 튜토리얼 + 서브), 플레이어 본인 미션 제외 규칙.
- 마커(`?`, `!`), `MissionLog`(J), `Hud`(트래커, 잔디 조각 게이지), `Toast`, 세이브/로드 완결.
- **기존 코드 연동**: 4개 미니게임 `onRoundEnd`, `TotyCardPopup` `onView`(카드 공개·변형 열람 판정은 이 콜백만, `totyCardRevealedStore`는 쓰지 않음 — 결정), 월드 오버레이 안에서 모달 렌더(z-index/Esc 규칙, [01 §10](01-concept-and-architecture.md#10-기존-코드-통합-지점)).
- 오락실(기계 5기 중 기존 4종) 상호작용 → 모달 실행 → 결과 판정.
- 월드 미션 메커닉: `collect`(pickup 트리거), `delivery`(택배+타이머+우편함), `time_trial`(체크포인트+패널티), `kick_goals`(`ball.ts`+골대), `talk_chain`.
- 진행도에 따른 색 복원(`progress.ts`: lush/withered 크로스페이드, 지구별 복원값).
**DoD**: 튜토리얼 + 메인 미션 11개(본인 제외 10개)가 `?worldDebug`로 각각 완료 가능, `!` 마커/보고/조각 획득/맵 복원 확인, 미션 판정 단위 테스트 통과.
**수정 기존 파일**: 미니게임 4종(모달+훅), `TotyCardPopup.tsx`, `App.tsx`(월드에 명단·사운드 설정 전달), (테스트 추가)

**구현 결과 (S3)**
- **상태기계**(`state/missions.ts`): `locked`/`available`은 선행 조건에서 계산하고 `active`/`ready`/`completed`만 저장. 수락은 대화 선택지, 완료·보상은 **보고 대화가 끝날 때** 1회 지급(조각은 메인 미션만, 상한 10, 조각 5·10개 뱃지 자동). 본인 미션은 `missionDefsFor(player)`에서 빠져 항상 잠김 → 누구를 골라도 조각 10개. 판정은 `state/missionEval.ts`(종류별 `evaluateEvent`, 카드 짝 맞추기는 턴 ≤ max).
- **정의**(`data/missionDefs.ts`): 튜토리얼 3(`m-00-hello`·`m-01-mycard`·`m-02-arcade`) + 메인 11(본인 제외 10) + 서브 2(`s-shop-milk`·`s-elder-water`). 임계값·시간·개수가 전부 여기 있다. 대사는 미션 정보로 만든 **임시 대사**(`state/npcDialogue.ts`).
- **월드 메커닉**: `collect`(E로 줍기, `pickup` 오브젝트, 미션이 `active`일 때만 보임), `delivery`(택배 3개+90초+우편함 3곳, `engine/runs.ts`; 사람에게 전하는 우유는 대화로), `time_trial`(콘 코스 게이트 7개·콘 5개·+1초, 25초), `kick_goals`(`engine/ball.ts` 킥 볼+골대, 60초 5골), `talk_chain`(꼬마·사장·할아버지에게 소문 묻기). 시간제 시도는 대화·메뉴·모달 중에 멈추고 저장하지 않는다.
- **UI**: 마커(?·…·!, `mark-*` 그림), `Hud`(조각 게이지+트래커, 좌상단), `MissionLog`(J: 진행/완료 탭·상세·트래커 지정), `PauseMenu`(Esc: 이어하기·로그·설정·가이드·새로 시작·나가기), `Toast`로 수락·달성·완료·조각·뱃지 안내(간격을 두고 순서대로), 캔버스에 시간제 시도 타이머.
- **연동**: 미니게임 4종 `onRoundEnd`, `TotyCardPopup` `onView`, 오락실 기계 4대·감독실 카드 수납장이 월드 안에서 각각 모달로 열린다(스케일되는 스테이지 밖에 렌더, Esc는 월드가 캡처해 스택 처리). 기존 대시보드 동작은 그대로(모두 optional prop).
- **진행도 색 복원**(`state/progress.ts`): 지구별 `0.6·s + 0.4·zoneDone`(멤버 없는 지구는 s), 제초동은 엔딩 전 고정. 값이 바뀌면 크로스페이드로 따라간다.
- **맵**: `build-world-map.mjs`에 훈련장 펜스·골대·우편함 3·콘 코스 깃발과 `objects[]`를 추가해 재생성했다(스캐터 소품 2개는 펜스에 밀려 빠짐). 상세 좌표는 [03 §7](03-map-design.md#7-미션용-월드-오브젝트).
- **`?worldDebug`**: 조각 −/＋, 튜토리얼 건너뛰기, 메인 전부 완료, 진행 초기화, 미션별 상태 지정(초기화·진행 중·보고 가능·완료), 플래그 설정/해제, 타이머 취소, 공 리셋, 미션 상태·플래그·수집 목록. 오브젝트(골·게이트·줍는 것·콘·공)는 격자 위에 id와 함께 그려진다.
- **S3 결정**: ① 서브는 S3 메커닉으로 되는 2개만(나머지는 S5). ② 대사는 임시(검수 전). ③ 카드 미션은 월드 팝업 `onView`만 인정. ④ **Esc는 이제 일시정지 메뉴**(월드 나가기는 메뉴/X). ⑤ 콘 코스는 가운데 줄 콘 + 위/아래 레인 게이트로 재설계(03 §7). ⑥ 공은 NPC를 무시. ⑦ 세이브 스키마는 v1 유지(마이그레이션 규칙은 §5 #11).
- **범위 밖으로 남긴 것**: 지도(M) 화면, 엔딩 컷·실제 대사(S4), `clubhouse-trophy` 액자(엔딩 연결 자리), 광장 잔디 영구 복원의 화면 반영(`plaza-restored` 플래그만 저장), 택배·황금 공 그림, 뱃지 화면, 지구별 파티클·색조(S4).
- **테스트(추가 130개, 487 → 618)**: 상태기계(전이·선행·본인 제외·1회 지급·상한·마커·뷰), 종류별 판정, 조건식, 지구별 복원, 대화 조립, Esc 스택, 액션 해석, 디버그 도구, 킥 볼 물리, 시간제 시도, 헤드리스 엔진(줍기·킥→골·콘 코스 슬랄롬·직진 실패·택배·조건부 NPC·기계 액션), 맵 무결성(미션 오브젝트·콘 코스 구조·조건/액션 문법·미션↔맵 참조).

### S4 — 스토리 콘텐츠
**범위**: `dialogueData.ts` 전 NPC 노드(사용자 검수 반영본), 실내 19곳 통합(조사 포인트·충돌·NPC 스폰 `when`), 지구별 파티클·색조·앰비언스 훅, 진행도 이벤트(`beat-3/6/9`), **3막 결전**(심판/제초왕 컷, 3연전 판정, 코어 정지, 황금 잔디 개화 연출), **엔딩(GroupPhotoOverlay 재사용)**, 엔딩 후 플래그.
**DoD**: 처음부터 엔딩까지 한 번에 클리어 가능(디버그 없이), 모든 NPC 대사 상태별 정상, 집 전부 입장 가능.

### S5 — 엔딩 후 콘텐츠
**범위**: `arcade/GrassRush*`(엔진+test+캔버스+모달+저장), 오락실 5번 기계, 랭크 판정(`s-arcade-rank`), 일일 미션(`daily.ts` 시드 + 게시판 UI + 스탬프 카드), 황금 축구공 20개, 뱃지/칭호, 카드 도감 미션(`m-91-cards`, 우왁굳 히든 카드 연동 안내), 제초동 구역 개방 + 공장 실내, NPC `post[]`/`home[]` 대사, 타이틀 배경 전환, 서브 미션.
**DoD**: 엔딩 후 하루 단위로 일일 미션이 바뀌고 스탬프 누적, 러시 최고 기록·랭크 표시, 황금 공 도감.

### S6 — 폴리시·릴리스
**범위**: 오디오 전 트랙 통합(지구 BGM·앰비언스·지면별 발소리), 성능 프로파일링(컬링·청크·GC), `prefers-reduced-motion`, 크레딧 화면(`world-credits`), 공지(`announcementsData.tsx`), `docs/PROJECT_HANDOFF.md` 구조 표 갱신, README 상태 최종화, 에셋 용량 점검(총량 예산), 버그 정리.
**DoD**: 60fps 목표 확인(중급 노트북), 에셋 예산 이내, 배포.

## 2. 아트 트랙 (사용자 작업, 코드 세션과 병렬)

| 트랙 | 내용 | 참고 문서 | 이 트랙이 필요한 세션 |
| --- | --- | --- | --- |
| **A1** | **스타일 테스트**: 재닌 4단계 1세트 + `terrain-core` + `house-janine95kim` 외관·실내 + `ui-frames-dialog`. 톤 승인 후 STYLE_BLOCK/프롬프트 수정 | 04, 05, 06 | S1과 병행, **모든 양산 전 필수** |
| **A2** | 캐릭터 P0: 멤버 11 + 우왁굳 + `elder` (각 4단계 = 52장) | 04 | S2 |
| **A3** | 지면 + 기본 소품: `terrain-core/pitch/water`, `props-trees/plants/rocks/town/football/collect` | 05 | S2~S3 |
| **A4** | 건물 P0 15 + 실내 P0 16 | 05 | S4 (S2에서 일부 미리보기) |
| **A5** | UI P0: 플로팅 버튼, 키아트 3, 프레임 시트 A·B, 버튼, 선택 화면, 미션·메뉴 아이콘 | 06 | S1(버튼)·S2(프레임)·S3 |
| **A6** | 오디오 P0: BGM B1~B5, SFX P0 19개 | 07 | S2~S6 |
| **A7** | 나머지 P1/P2: 지구 지면·소품, 오리지널 캐릭터 P1(5+동물 2), 건물 `cafe/factory`, 실내 P1, 러시, FX, 오디오 P1/P2 | 04~07 | S4~S6 |

권장 순서: **A1 → (승인) → A5(버튼) → A2 → A3 → A4 → A6 → A7**. A5의 플로팅 버튼은 S1에서 바로 쓰이므로 가장 먼저.

## 3. 변환 스크립트 사양

`scripts/convert-world-art.mjs` (S1에서 전 카테고리 완성). 기존 `convert-group-photo-art.mjs`처럼 **sharp**를 쓰되, 원본을 지우지 않는다(사용자가 재작업할 수 있도록).

### CLI
```bash
pnpm convert:world-art -- characters janine95kim      # 캐릭터 1명 (stand/turn/walk/portrait 있는 만큼)
pnpm convert:world-art -- terrain core                # 지면 시트 1개
pnpm convert:world-art -- props trees                 # 소품 시트 1개
pnpm convert:world-art -- buildings clubhouse         # 건물 1개
pnpm convert:world-art -- interiors house-doormomo    # 실내 1개
pnpm convert:world-art -- ui frames-dialog            # UI 시트/단일
pnpm convert:world-art -- fx markers | rush obstacles # FX/러시
pnpm convert:world-art -- --all                       # 원본 폴더의 전부
```
입력: `tmp/world-src/<카테고리>/<원본이름>.png`, 출력: `src/web/assets/world/<카테고리>/…webp`. 캐릭터·지면·소품·FX·UI·러시 스프라이트는 **lossless**, 건물·실내·큰 배경(loading/title/select, `rush/bg-far`)은 **q92 lossy**(`--quality`).

### 공통 처리 파이프라인
1. **알파 정리**: 알파가 있으면 그대로 쓰되 알파 16 미만을 지운다. 알파가 없고 네 모서리가 `#FF00FF`면 크로마키(허용오차 40, `--tolerance`) + 가장자리 디스필. **알파 240 미만은 지운다(하드닝)**: 생성기가 스프라이트 둘레에 알파 128~250의 넓은 발광(후광)을 구워 넣어 트림·경계 판정을 망치기 때문이다. 발광이 의도인 슬롯(매니페스트 `soft`: 스포트라이트·반짝임·먼지·잔물결·조각/공 펄스·`fab-hover` 등)은 하드닝하지 않고 알파를 유지한다.
2. **스프라이트 추출**: 시트는 고정 격자로 자르지 않는다. 생성 시트의 오브젝트가 격자에 정확히 맞지 않고 칸 경계를 넘나들기 때문이다. 알파 마스크의 **연결 성분(8방향)**을 구해 각 성분을 **무게중심이 속한 칸**에 배정하고, 칸마다 가장 큰 성분 + 가까운(24px 이내) 또는 충분히 큰(2% 이상) 성분만 남긴다(떨어진 잡티 제외). 이 결과가 곧 **트림**이다(여백 0).
3. **다운스케일**: 박스(area) 평균을 **프리멀티플라이드 알파**로 계산해 목표 크기로 줄이고, 소프트가 아니면 알파를 128 기준 **하드 엣지**로 스냅한다(문서 초안의 "최근접 정수 스냅" 대신). 종횡비는 유지하고 남는 쪽은 투명 여백(아래 정렬 또는 중앙, 매니페스트 `align`). 원본이 목표보다 작으면 확대 경고.
4. **팔레트 정리(옵션 `--palette N`)**: N색(기본 48) 양자화. 기본은 꺼짐.
5. **webp 출력**.

### 카테고리별 규칙

| 카테고리 | 입력 | 처리 | 출력 |
| --- | --- | --- | --- |
| characters `walk` | 4열×3행 | 프레임 12개 추출 → 시트 자체의 스케일 산출(앞모습 걷기 4프레임 높이의 중앙값 → **`standHeight` 58px**, 어떤 프레임이 48×60 안에 안 들어가면 그만큼만 축소) → **발끝을 셀 하단 4px에 정렬, 가로는 알파 무게중심을 셀 중앙에** → 48×64 셀 | 아틀라스 `characters/<id>-atlas.webp`(192×256) |
| characters `turn` | 3컷(3열×1행) | 위와 동일하되 **turn 시트의 서 있는 정면 높이 → 58px**(turn과 walk는 원본 스케일이 서로 달라 각자 스케일) → 아틀라스 0행(idle 하·우·상) | (아틀라스에 병합) |
| characters `stand` | 단일 | 트림 → 높이 256px(최대) | `characters/<id>-stand.webp` |
| characters `portrait` | 2×2 | 4칸 추출 → **4장 공통 스케일**(최소 맞춤) → 128×128에 아래 정렬 | `portraits/<id>-<neutral,happy,surprised,worried>.webp` |
| animals | 4×3 | 프레임 32×32(발끝 여백 2px), 시트 전체에 공통 스케일, idle=passing(2번째) 프레임 | `characters/<id>-atlas.webp`(128×128) |
| terrain | 4×4 | 16분할 → 32px 박스 다운스케일 → 128×128 시트. `--seamless`는 가장자리 교차 블렌딩 | `terrain/<시트>.webp` + 파생 `-withered` |
| props | 4×3 | 12개 추출 → **표의 최종 px**(`world-art-manifest.json`)에 종횡비 유지로 맞춤. `anim` 그룹(조각·공 펄스, 반짝임·먼지, 잔물결, 성장)은 **한 스케일을 공유**해 프레임 간 크기 변화를 보존 | `props/<id>.webp` (+ 식물 `-withered`) |
| buildings | 단일 | 추출 → 최종 px, 아래 정렬(문이 하단 중앙) | `buildings/<id>.webp` |
| interiors | 단일(알파 없음) | 중앙 크롭(원본 비율 → 5:3) → 640×384 다운스케일 | `interiors/int-<id>.webp` |
| ui frames/icons | 4×3 등 | 추출 → 최종 px. **9‑slice 프레임(`slice`)은 원본 비율을 유지**하고 여백을 채우지 않는다(크기가 표와 달라짐, 스크립트가 slice 가능 여부와 대칭 오차를 검사). 탭은 좌우 대칭만 검사 | `ui/<id>.webp` |
| ui 단일 | 단일 | `fab-*`·`fab-icon`·`logo-emblem`: 추출 후 중앙 정렬, `*-bg`: 중앙 크롭 960×540 | `ui/<id>.webp` |
| fx | 4×3 | props와 동일(이모트 24×24, 마커, 성장·잔물결 그룹) | `fx/<id>.webp` |
| rush | 단일/시트 | 배경 `bg-far`·`bg-factory`는 중앙 크롭 640×360, `bg-mid`·`ground`는 **가로 640에 맞춰 아래 정렬**(알파 배경), 셋 다 가로 이음매 블렌딩. 시트는 props 규칙 | `rush/<id>.webp` |

- **매니페스트**: 슬롯→ID→최종 px는 `scripts/world-art-manifest.json`에 05/06 문서의 표를 그대로 옮겨 두었다(문서가 원천, 옵션 키는 파일 첫 `_comment` 참고). `characters`(프레임 규격·파생 정의), `withered`(채도 0.35·명도 0.95·색조 −12 + `#b9a86a` 25%)도 여기 있다.
- **QA 출력**: 각 실행이 콘솔에 종류별(`foot` 발끝 편차 · `magenta` 마젠타 잔여 · `symmetry` 9‑slice 대칭 · `aspect` 종횡비 · `edge` 시트 가장자리 접촉 · `seam` 타일 이음매 · `scale` 확대 · `empty` 빈 칸) 경고를 낸다. 임계: 발끝 편차 3px, 대칭 0.08, 이음매 0.25, 종횡비 25%, 마젠타 스프라이트 3px/불투명 50px. `--all`은 종류별 요약과 함께 `tmp/world-src/qa-report.json`(누락된 원본 목록 포함)을 쓴다.
- **테스트**: 슬라이스·성분 추출·정렬·다운스케일·시임 수학(순수 함수, `scripts/lib/world-art-math.mjs`)과 매니페스트 무결성을 `scripts/convert-world-art.test.mjs`로 검증(기존 `scripts/*.test.mjs` 관례).


### 자동 파생 (생성 불필요)
- `*-withered`: 지면 시트/식물 소품에 `modulate(saturation 0.35, brightness 0.95, hue -12)` + `#b9a86a` 25% 틴트 오버레이.
- `weeder-grunt-gardener`: 팔레트 스왑(회색→초록 `#3f9e46`, 주황→밝은 갈색, 헬멧→밀짚 톤)으로 아틀라스 복제.
- `weedking-reformed`: 채도 +, 색조 밝게(엔딩 후 코치 스킨, P2).

## 4. 테스트 계획 (vitest, 순수 로직만)

`*.test.ts`는 대상 파일 옆에 둔다(기존 관례). UI/캔버스 렌더는 자동 테스트하지 않는다.

| 대상 | 테스트 파일 | 검증 |
| --- | --- | --- |
| 충돌 | `engine/collision.test.ts` | AABB 슬라이드, 코너 끼임 없음, 공간 해시 경계 |
| 카메라 | `engine/camera.test.ts` | 맵 경계 클램프, 정수 스냅 |
| 세이브 | `storage.test.ts` | 검증 실패 시 새 게임, 마이그레이션, 잘못된 값 무시 |
| 미션 상태기계 | `state/missions.test.ts` | 전이 전부, 본인 미션 제외, 선행 조건, 보상 1회 지급 |
| 미션 판정 | `state/missionEval.test.ts` | `minigame_best` 임계(카드짝맞추기는 낮을수록), `card_variant`, `collect/delivery/time_trial/kick_goals` |
| 대사 선택 | `state/dialogue.test.ts` | 상태→노드, 순환 인덱스, `post[]` 교체, `{player}` 치환 |
| 진행도 | `state/progress.test.ts` | shards→복원값, 지구별 복원 혼합 |
| 일일 미션 | `state/daily.test.ts` | 날짜 시드 결정성(KST), 자정 경계, 스탬프 중복 방지 |
| 맵 무결성 | `data/maps/mapIntegrity.test.ts` | 문 목적지 존재, 스폰이 충돌 밖, NPC id∈캐스트, `props.prop`∈propDefs, `pickup.id` 고유, 참조 이미지 존재 |
| 잔디 러시 | `arcade/grassRushEngine.test.ts` | 난이도 곡선, 충돌, 점수, 결정적 시드 |
| 변환 스크립트 | `scripts/convert-world-art.test.mjs` | 그리드 분할/정렬 수학 |

기준선: 매 세션 `pnpm typecheck && pnpm test`.

## 5. 미해결 항목

구현 세션에서 결정·확인해야 하는 것들.

| # | 항목 | 내용 | 결정 시점 |
| --- | --- | --- | --- |
| 1 | 전역 `MusicPlayer` 충돌 | YouTube iframe 음악이 월드 BGM과 겹침. 월드 열 때 일시정지/복귀 옵션 확인(`MusicPlayer.tsx` API) | S1 — **결정됨(2026-09-19)**: 월드가 열리면 재생 중이던 전역 음악을 일시정지하고, 닫을 때 **월드가 멈춘 경우에만** 재개한다. `MusicPlayer.tsx`는 외부 API가 없어 `src/web/musicControl.ts`(등록형 소형 스토어)를 통해 `pause/resume`을 받도록 수정(기존 미니게임은 계속 전역 음악을 안 건드림). 월드 BGM 설정과 무관하게 항상 적용하고, 월드 BGM 설정에 따른 분기는 하지 않는다. |
| 2 | 좌상단 버튼과 `.topbar` 겹침 | 뷰포트 < 1440px에서 브랜드와 겹칠 수 있음. `top:12px; left:12px` 컴팩트 또는 topbar 좌측 패딩 | S1 — **결정됨(2026-09-19)**: 버튼(220×60 표시)이 사실상 모든 뷰포트(≈1950px 미만)에서 브랜드를 가리고, 스크롤하면 `position: sticky` 검색바도 가리는 것을 확인. **`top:12px; left:12px` 고정 + 여백 예약 + 스크롤 시 축소**: 맨 위에서는 풀 판, `scrollY > 80`이면 원형 아이콘(`fab-icon`, 48px)으로 축소. `world-toggle.css`가 `main:has(.world-toggle)`로 `.topbar`(판 폭 244px)와 sticky 상태의 `.controls`(아이콘 폭 66px) 좌측 패딩을 `<main>`의 왼쪽 여백만큼 빼고 예약한다. `styles.css`는 수정하지 않음. 컴팩트 아이콘은 스크롤 위치 80px~검색바가 붙기 전 구간에서 히어로 좌상단 모서리를 잠깐 덮을 수 있음(허용). |
| 3 | Esc/모달 중첩 (S1 임시: 오버레이가 캡처 단계에서 Esc를 받아 `stopPropagation` 후 바로 월드를 닫음) | `useEscape`가 window keydown이라 중첩 시 동시 반응 가능 → 월드 쪽 핸들러가 "열린 모달 없음"일 때만 동작하도록 스택화 | S3 — **결정됨(2026-09-19)**: S2에서 대사·코치마크·프롤로그·캐릭터 선택까지 구현한 `state/escape.ts`에 **미니게임/카드 모달 → 일시정지 메뉴(하위 페이지 → 메뉴) → 미션 로그 → 대사 → 코치마크** 순으로 추가. 월드의 캡처 단계 핸들러가 Esc를 `stopPropagation`으로 삼키므로 모달들의 window `useEscape`는 월드 안에서 발동하지 않고(모달 X·배경 클릭은 `onClose`로 같은 경로), 아무것도 열려 있지 않을 때의 Esc는 **월드 종료가 아니라 일시정지 메뉴**를 연다 |
| 4 | J/M 등 키 충돌 | 대시보드에 전역 단축키가 있는지 확인(월드 열림 동안 입력 캡처) | S1 — **결정됨(2026-09-19)**: 코드 확인 결과 대시보드에 문자 단축키는 없고(전역 `keydown`은 각 모달/팝오버의 Esc 닫기뿐, `SoccerSum10Canvas`는 요소 로컬) J/M 충돌은 없다. **01의 키를 그대로 유지**하고 `window` 캡처로 받는다: `KeyboardEvent.code` 기반(한글 IME가 켜져 있어도 WASD 동작), 게임 키는 `preventDefault`(방향키·Space 스크롤 방지), Ctrl/Alt/Meta 조합과 입력 필드는 무시, 열릴 때 포커스를 오버레이 루트로 이동(플로팅 버튼 재클릭 방지), 탭 숨김/blur 시 눌린 키 초기화. 구현: `engine/input.ts`. |
| 5 | AI 도트 순도 | 생성 이미지가 정확한 픽셀 격자가 아님 → 다운스케일+팔레트 양자화로 보정, 결과가 불만족이면 목표 해상도(타일 32→48)나 스타일 재조정 | A1 후 |
| 6 | 좌향 반전 비대칭 | 비대칭 소품이 어색하면 좌향 전용 시트 추가 생성 | A2 |
| 7 | 미션 임계값 | placeholder 점수/시간의 난이도 튜닝(`missionDefs.ts`만 수정) | S3~S4 후 플레이 — **S3 관찰**: 콘 코스 25초는 깨끗한 주행이 약 5초라 너무 후하다(택배 90초도 여유 있음 — 경로 약 30초). 플레이해 본 뒤 줄이면 된다 |
| 8 | 실명 대사 검수 | 12명 실존 스트리머 대사를 사용자가 검수(02) | S4 시작 전 |
| 9 | 로딩 용량 | 총 에셋 예산(디코드 ≈150MB, 전송 수십 MB). 실내 지연 로드, 이미지 압축 확인 | S6 |
| 10 | 오디오 라이선스 | CC‑BY 표기 화면, 상업 이용 가능 여부 | S6 |
| 11 | 세이브 마이그레이션 | 콘텐츠 확장 시 `schemaVersion` 올리는 규칙 | S3 — **결정됨(2026-09-19)**: 저장 **구조**(필드 추가·삭제·의미 변경)가 바뀔 때만 버전을 올리고 `MIGRATIONS`에 단계를 추가한다. 미션·임계값·맵 수정, `progress` 안쪽 모양 확장, 새 플래그/뱃지는 올리지 않는다. S3는 v1 유지 ([01 §7](01-concept-and-architecture.md#7-데이터-스키마-typescript-초안)) |
| 12 | 다른 진입 경로 | 딥링크(`?world`)나 공지 클릭으로 열기 여부 | S6 |
| 13 | 서버 리더보드 | 범위 밖. 필요 시 Worker + KV/D1 설계 별도 문서 | 미정 |
| 14 | `roster.yaml`/스냅샷 불일치 | 스냅샷의 닉네임이 YAML과 다름(하치·해파린) → 월드는 하드코딩 캐스트 사용으로 회피 | 확정 |
| 15 | 원본 PNG 추적 | `tmp/world-src/`의 PNG 151장이 이미 커밋돼 있어 `.gitignore`만으로는 추적이 안 풀림 | S1 — **결정됨(2026-09-19)**: `git rm -r --cached tmp/world-src`로 인덱스에서만 제거(디스크 파일 유지, 이 세션에서 커밋하지 않음). 과거 커밋의 용량은 그대로 남는다. |

## 6. 세션 종료 체크리스트
- [ ] `pnpm typecheck && pnpm test` 통과
- [ ] `git status`로 의도한 변경만 존재
- [ ] `docs/world/README.md`의 핸드오프 체크리스트 갱신(완료/다음/막힌 점)
- [ ] 새로 정한 규격·ID·파일명이 있으면 01/09에 반영
- [ ] 아트/오디오가 필요한 새 항목이 생기면 09에 추가
