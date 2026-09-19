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

### S1 — 기반 (Foundation)
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

### S2 — 월드 뼈대
**범위**
- 맵 데이터(JSON) 로더, `scripts/build-world-map.mjs`(존/길/건물 표로 `terrainRows` 초안 생성), 지면 청크 캐시 렌더 + 지구 경계 블렌딩, y-sort, `above` 레이어, 소품/건물 스프라이트 배치(`propDefs.ts`).
- 씬 전환(문 트리거 → 페이드 → 실내), 실내 이미지 렌더(640×384 고정 카메라) + 충돌 사각형.
- NPC 엔티티(stay/idle/wander/face-player), 상호작용(전방 28px, `E` 프롬프트), `DialogueBox`(DOM, 타이프라이터, 초상, 선택지), 임시 대사.
- `CharacterSelect`(11명), 프롤로그 컷, 집에서 시작, `CoachMarks`(C1~C3), 지구 진입 토스트.
- `audio/worldAudio.ts` 뼈대(BGM 크로스페이드, SFX 풀).
**DoD**: 캐릭터 선택 → 집에서 시작 → 밖으로 나와 마을 이동 → NPC와 임시 대사 → 집 입장/퇴장, 코치마크 완료, 맵 무결성 테스트(문 목적지/스폰/NPC id/에셋 존재) 통과.
**아트 도착 시 교체**: 캐릭터 아틀라스·초상, `terrain-core`, 건물 이미지.

### S3 — 미션·진행
**범위**
- `state/missions.ts` 상태기계(locked→available→active→ready→completed) + test, `data/missionDefs.ts`(11개 + 튜토리얼 + 서브), 플레이어 본인 미션 제외 규칙.
- 마커(`?`, `!`), `MissionLog`(J), `Hud`(트래커, 잔디 조각 게이지), `Toast`, 세이브/로드 완결.
- **기존 코드 연동**: 4개 미니게임 `onRoundEnd`, `TotyCardPopup` `onView`, `totyCardRevealedStore` 구독(카드 공개), 월드 오버레이 안에서 모달 렌더(z-index/Esc 규칙, [01 §10](01-concept-and-architecture.md#10-기존-코드-통합-지점)).
- 오락실(기계 5기 중 기존 4종) 상호작용 → 모달 실행 → 결과 판정.
- 월드 미션 메커닉: `collect`(pickup 트리거), `delivery`(택배+타이머+우편함), `time_trial`(체크포인트+패널티), `kick_goals`(`ball.ts`+골대), `talk_chain`.
- 진행도에 따른 색 복원(`progress.ts`: lush/withered 크로스페이드, 지구별 복원값).
**DoD**: 튜토리얼 + 메인 미션 11개(본인 제외 10개)가 `?worldDebug`로 각각 완료 가능, `!` 마커/보고/조각 획득/맵 복원 확인, 미션 판정 단위 테스트 통과.
**수정 기존 파일**: 미니게임 4종(모달+훅), `TotyCardPopup.tsx`, (테스트 추가)

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

`scripts/convert-world-art.mjs` (S1 뼈대, 이후 카테고리별 확장). 기존 `convert-group-photo-art.mjs`처럼 **sharp**를 쓰되, 원본을 지우지 않는다(사용자가 재작업할 수 있도록).

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
입력: `tmp/world-src/<카테고리>/<원본이름>.png`, 출력: `src/web/assets/world/<카테고리>/…webp`(webp q92, lossless가 유리한 UI 프레임은 `lossless`).

### 공통 처리 파이프라인
1. **배경 제거**: PNG에 알파가 있으면 그대로, 없으면 `#FF00FF` 크로마키(허용오차 기본 40, `--tolerance`) → 알파. 가장자리 마젠타 번짐 제거(디스필).
2. **트림**: 알파 bbox로 자르고 여백 0~2px.
3. **최근접 다운스케일**: 목표 최종 크기로 축소. **박스(area) 필터로 1차 축소 후 최근접 정수 스냅**해 픽셀 블록이 또렷하게 유지되게 한다. 종횡비 유지(왜곡 없음).
4. **팔레트 정리(옵션 `--palette N`)**: 색 수를 N(기본 48)으로 양자화해 번짐 제거.
5. **webp 출력**.

### 카테고리별 규칙

| 카테고리 | 입력 | 처리 | 출력 |
| --- | --- | --- | --- |
| characters `walk` | 1536×1024, 4열×3행 | 셀 균등 분할(384×341) → 셀별 알파 bbox → **공통 스케일**(turn 시트 정면 서기 bbox 높이를 64px 기준으로 산출) → 발끝(bbox 하단)을 셀 하단 4px에 정렬, 가로는 bbox 무게중심 기준 중앙 → 48×64 셀 | 아틀라스 `characters/<id>-atlas.webp`(192×256) |
| characters `turn` | 1536×1024, 3컷 | 3등분 → 위와 동일 정렬 → 아틀라스 0행(idle 하·우·상) | (아틀라스에 병합) |
| characters `stand` | 1024×1024 | 트림 → 높이 256px 최근접 | `characters/<id>-stand.webp` |
| characters `portrait` | 1024×1024, 2×2 | 4분할 → 트림 후 128×128(중앙) | `portraits/<id>-<neutral,happy,surprised,worried>.webp` |
| animals | 1536×1024 4×3 | 셀 32×32, idle=passing 프레임 | `characters/<id>-atlas.webp`(128×128) |
| terrain | 1024×1024 4×4 | 16분할 → 256→32px 다운스케일 → **심리스 보정**(가장자리 오프셋 블렌딩 옵션 `--seamless`) → 128×128 시트 | `terrain/<시트>.webp` + 파생 `-withered` |
| props | 1536×1024 4×3 | 12분할 → 트림 → **표의 최종 px에 맞춰 리사이즈**(스프라이트별 목표 크기는 `scripts/world-art-manifest.json`) | `props/<id>.webp` (+ 식물 `-withered`) |
| buildings | 단일 | 트림 → 최종 px | `buildings/<id>.webp` |
| interiors | 1536×1024 | 중앙 크롭(1536×922) → 640×384로 다운스케일 | `interiors/int-<id>.webp` |
| ui frames/icons | 4×3 시트 | 12분할 → 트림 → 최종 px(9‑slice 프레임은 정중앙 대칭 확인 로그) | `ui/<id>.webp` |
| fx | 4×3 | 12분할 → 트림 → 최종 px | `fx/<id>.webp` |
| rush | 단일/시트 | 배경 3장은 가로 심리스 보정 후 최종 크기, 시트는 소품 규칙 | `rush/<id>.webp` |

- **매니페스트**: 슬롯→ID→최종 px는 `scripts/world-art-manifest.json`에 05/06 문서의 표를 그대로 옮겨 둔다(S1에서 작성, 문서가 원천).
- **QA 출력**: 각 실행이 (a) 셀별 bbox 크기, (b) 발끝 y 편차, (c) 대칭도(9‑slice), (d) 남은 마젠타 픽셀 수를 콘솔에 표시. 임계 초과 시 경고.
- **테스트**: 슬라이스/정렬 수학(순수 함수)만 `scripts/convert-world-art.test.mjs`로 검증(기존 `scripts/*.test.mjs` 관례).

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
| 1 | 전역 `MusicPlayer` 충돌 | YouTube iframe 음악이 월드 BGM과 겹침. 월드 열 때 일시정지/복귀 옵션 확인(`MusicPlayer.tsx` API) | S1 |
| 2 | 좌상단 버튼과 `.topbar` 겹침 | 뷰포트 < 1440px에서 브랜드와 겹칠 수 있음. `top:12px; left:12px` 컴팩트 또는 topbar 좌측 패딩 | S1 |
| 3 | Esc/모달 중첩 | `useEscape`가 window keydown이라 중첩 시 동시 반응 가능 → 월드 쪽 핸들러가 "열린 모달 없음"일 때만 동작하도록 스택화 | S3 |
| 4 | J/M 등 키 충돌 | 대시보드에 전역 단축키가 있는지 확인(월드 열림 동안 입력 캡처) | S1 |
| 5 | AI 도트 순도 | 생성 이미지가 정확한 픽셀 격자가 아님 → 다운스케일+팔레트 양자화로 보정, 결과가 불만족이면 목표 해상도(타일 32→48)나 스타일 재조정 | A1 후 |
| 6 | 좌향 반전 비대칭 | 비대칭 소품이 어색하면 좌향 전용 시트 추가 생성 | A2 |
| 7 | 미션 임계값 | placeholder 점수/시간의 난이도 튜닝(`missionDefs.ts`만 수정) | S3~S4 후 플레이 |
| 8 | 실명 대사 검수 | 12명 실존 스트리머 대사를 사용자가 검수(02) | S4 시작 전 |
| 9 | 로딩 용량 | 총 에셋 예산(디코드 ≈150MB, 전송 수십 MB). 실내 지연 로드, 이미지 압축 확인 | S6 |
| 10 | 오디오 라이선스 | CC‑BY 표기 화면, 상업 이용 가능 여부 | S6 |
| 11 | 세이브 마이그레이션 | 콘텐츠 확장 시 `schemaVersion` 올리는 규칙 | S3 |
| 12 | 다른 진입 경로 | 딥링크(`?world`)나 공지 클릭으로 열기 여부 | S6 |
| 13 | 서버 리더보드 | 범위 밖. 필요 시 Worker + KV/D1 설계 별도 문서 | 미정 |
| 14 | `roster.yaml`/스냅샷 불일치 | 스냅샷의 닉네임이 YAML과 다름(하치·해파린) → 월드는 하드코딩 캐스트 사용으로 회피 | 확정 |

## 6. 세션 종료 체크리스트
- [ ] `pnpm typecheck && pnpm test` 통과
- [ ] `git status`로 의도한 변경만 존재
- [ ] `docs/world/README.md`의 핸드오프 체크리스트 갱신(완료/다음/막힌 점)
- [ ] 새로 정한 규격·ID·파일명이 있으면 01/09에 반영
- [ ] 아트/오디오가 필요한 새 항목이 생기면 09에 추가
