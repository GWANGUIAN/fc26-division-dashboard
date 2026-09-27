# 세션별 지시 프롬프트 — 축구화 던지기 (cleat-drop)

새 세션을 열 때 해당 세션의 ```text``` 블록을 **그대로 붙여넣는다**. 각 프롬프트는 자체 완결형이라 이전 대화 없이도 동작한다. 서식 선례: [docs/forever/05-session-prompts.md](forever/05-session-prompts.md). 기획 원문: [docs/minigame-cleat-drop.md](minigame-cleat-drop.md).

## 세션 순서와 의존성

| 세션 | 목적 | 선행 조건 | 병렬 가능 |
| --- | --- | --- | --- |
| 0 | 문서 작성 | — | 완료 (2026-09-27) |
| 1 | 이미지 생성 (사용자 수동) | 문서 "6. 아트 스펙" | 세션 2와 병렬 |
| 2 | 엔진 골격 + 스테이지 데이터 (플레이스홀더 아트) | 문서 "1. 규칙·조작"·"3. 구현 설계"·"4. 스테이지 데이터" | 세션 1과 병렬 |
| 3 | 아트 통합 | 세션 1의 G1~G8 원본 PNG, 세션 2 완료 | — |
| 4 | 저장 · 오디오 · 완료 화면 | 세션 3 | — |
| 5 | 메뉴 등록 · 마감 | 세션 4 | — |

## 공통 머리말 (모든 코드 세션 프롬프트의 맨 앞에 이미 포함됨)

- 먼저 `docs/minigame-cleat-drop.md`와 해당 세션이 지정한 절을 읽고, **코드보다 문서를 따른다**. 문서와 다르게 구현해야 하면 문서를 먼저 고치고 이유를 남긴다.
- 브라우저 수동 확인/프리뷰 실행은 하지 않는다. 검증은 `pnpm test`(관련 파일)와 타입체크만. 사용자가 배포 후 직접 확인한다.
- 셸 편집 주의: Bash heredoc에 아포스트로피가 있으면 실패하고, Python은 Windows에서 CRLF로 쓴다. 긴 파일 편집은 Write/Edit 도구, 스크립트가 필요하면 Write 도구로 `.mjs`를 만들어 Node로 실행. grep의 CR 검사는 신뢰하지 말 것.
- `victory.mp3`(`pitch-victory` 계열)는 다른 기능 전용이라 **절대 재사용하지 않는다**.
- 커밋은 사용자가 요청할 때만 하고, 별도 브랜치를 만들지 않고 main에 직접 한다.
- 원작(Steam 소시지 게임) 이름·로고·정확한 아트를 그대로 베끼지 않는다(패러디풍 자체 제작만). 이미지는 레포의 기존 미니게임 이미지도 레퍼런스로 쓰지 않고, 문서가 정한 "살짝 리얼한 3D 렌더" 스타일을 프롬프트 텍스트만으로 고정한다.

---

## 세션 1 — 이미지 생성 (사용자 수동, 코드 없음)

이 세션은 코드 세션이 아니다. 이미지 생성 AI 대화를 열어 `minigame-cleat-drop.md`의 "6. 아트 스펙 · 이미지 생성 지시서" 항목을 순서대로 진행한다.

```text
docs/minigame-cleat-drop.md 의 "6. 아트 스펙 · 이미지 생성 지시서"를 읽고 G1 → G2 → G3 → G4 → G5 → G6 → G7 → G8 순서로 진행한다.
각 항목마다 (1) 스레드 규칙(🆕 새 대화 / ↪ 이어서)을 지키고 (2) 레퍼런스 이미지는 첨부하지 않는다(문서가 레포의 기존 이미지를 참고하지 말라고 정했으므로, 프롬프트 안의 스타일 문단만으로 톤을 고정한다) (3) 프롬프트 코드블록을 그대로 붙여넣고 (4) 각 카드의 검수 체크를 통과한 결과를 저장 이름 그대로 tmp/minigame-src/cleat-drop/ 아래에 저장한다.
tmp/ 가 아직 .gitignore에 없으면 tmp/minigame-src/ 줄을 추가한다.
저장할 때마다 해당 카드의 프롬프트 코드블록 바로 아래에 있는 "- [ ] `파일명.png`" 줄을 "- [x]"로 바꾸고, "8. 진행 체크리스트"의 "세션 1" 항목도 갱신한다.
검수를 3번 이상 고쳐도 통과 못 하면 새 스레드에서 프롬프트를 처음부터 다시 시도한다.
```

세션 1 종료 조건: G1~G8 원본 PNG가 `tmp/minigame-src/cleat-drop/`에 모두 있고, 문서의 8개 체크박스와 "8. 진행 체크리스트"가 모두 갱신됨.

---

## 세션 2 — 엔진 골격 + 스테이지 데이터 (플레이스홀더 아트)

```text
[공통 머리말] docs/minigame-cleat-drop.md 를 먼저 읽고, 브라우저 수동 확인은 하지 말고 pnpm test 와 타입체크로만 검증한다. 셸 편집은 Write/Edit 도구 또는 Write로 만든 Node 스크립트를 쓴다(heredoc 아포스트로피, Python CRLF 문제). victory.mp3 계열 사운드는 재사용 금지. 문서와 다르게 구현해야 하면 문서를 먼저 고친다. 커밋은 요청 시에만, 별도 브랜치 없이 main에.

작업: "축구화 던지기"(cleat-drop) 미니게임의 순수 물리 엔진과 30개 스테이지 데이터를 만든다. 이미지는 아직 없으므로 단색 도형 플레이스홀더로 그리고, 에셋이 생기면 나중에 자동으로 교체 가능하게 짠다.

먼저 읽을 문서: docs/minigame-cleat-drop.md 전체, 특히 "1. 규칙·조작·화면"(물리 설계 메모 포함), "3. 구현 설계"(파일 목록/데이터 타입/엔진 테스트 항목), "4. 스테이지 데이터"(30개 표).
먼저 읽을 코드: src/web/minigame/freekickEngine.ts(순수 함수 물리 엔진 스타일, 스핀/파워 계산 패턴), src/web/minigame/freekickEngine.test.ts(테스트 스타일), src/web/minigame/keeper-breakout/keeperBreakoutStages.ts(스테이지 데이터를 별도 파일로 분리하는 패턴), src/web/minigame/football-match3/footballMatch3Engine.ts(엔진/렌더 분리 구조).

구현 범위:
1. src/web/minigame/cleat-drop/cleatDropStages.ts 신규: "4. 스테이지 데이터"의 30개 스테이지를 그대로 데이터로 옮긴다(목표물 이름, 에셋 키, 판정폭, 기울기/곡면, 반발계수, 바람, 동적 요소). Date·Math.random 금지.
2. src/web/minigame/cleat-drop/cleatDropEngine.ts 신규: 진자(대기) → 낙하(신발끈 풀림) → 타격(다리 스윙 접촉) → 중력+스핀+반발 바운스 → 목표물 위 3초 정지 판정까지 순수 함수로 구현(state in, dt/입력 in → state out). "3-1. 파일" 표의 함수 시그니처를 참고하되 필요하면 조정하고 문서를 갱신한다.
3. src/web/minigame/cleat-drop/cleatDropEngine.test.ts: "3-2. 엔진 테스트 항목"(결정성, 타격 오프셋에 따른 반응, 3초 판정 타이머 리셋, 시도 횟수 증가, all-clear 래치)을 구현한다.
4. 렌더/UI(캔버스, 모달, 메뉴 등록)는 이번 세션 범위가 아니다. 만들지 않는다.

완료 기준: pnpm test(cleat-drop 관련 파일)와 타입체크 통과. docs/minigame-cleat-drop.md "8. 진행 체크리스트"의 "세션 2"를 체크하고, "3. 구현 설계"·"4. 스테이지 데이터"와 실제 구현이 달라졌으면 문서를 갱신한다. 변경 요약과 남은 이슈를 보고한다.
```

---

## 세션 3 — 아트 통합

```text
[공통 머리말] docs/minigame-cleat-drop.md 를 먼저 읽고, 브라우저 수동 확인은 하지 말고 pnpm test 와 타입체크로만 검증한다. 셸 편집은 Write/Edit 도구 또는 Write로 만든 Node 스크립트를 쓴다(heredoc 아포스트로피, Python CRLF 문제). victory.mp3 계열 사운드는 재사용 금지. 문서와 다르게 구현해야 하면 문서를 먼저 고친다. 커밋은 요청 시에만, 별도 브랜치 없이 main에.

작업: 세션 1에서 만든 원본 PNG(G1~G8)를 변환해 캔버스 렌더에 연결한다.

먼저 읽을 문서: docs/minigame-cleat-drop.md "6. 아트 스펙 · 이미지 생성 지시서"(카드별 저장 이름·최종 규격·최종 사용, 알파 투명 우선 / 마젠타 폴백 규칙), "3-1. 파일"(cleatDropAssets.ts 항목).
먼저 읽을 코드/스크립트: scripts/convert-minigame-art.mjs(있으면 그대로 재사용, 없으면 scripts/convert-pitch-art.mjs 구조를 참고해 동등한 것을 새로 만들되 먼저 다른 미니게임과 공유 가능한지 확인), scripts/minigame-art-manifest.json, src/web/minigame/football-match3/footballMatch3Assets.ts(Image 로더 + 실패 시 undefined 폴백 패턴), src/web/pitch/engine/assets.ts(그룹 정의 참고용).

절차:
1. tmp/minigame-src/cleat-drop/ 에 G1~G8 원본이 있는지 확인한다. 없거나 크기가 "6. 아트 스펙"과 다르면 보고하고 멈춘다(임의로 만들지 않는다). 알파 투명으로 받은 파일과 마젠타 플랫로 받은 파일이 섞여 있을 수 있으니 카드별로 확인한다.
2. scripts/minigame-art-manifest.json 에 cleat-drop 그룹 슬롯을 추가한다("6. 아트 스펙"의 카드 표에 있는 최종 파일 이름/규격 준수). 캐릭터 시트(G1·G2)는 프레임별로 크롭, 목표물 시트(G3~G7)는 "4. 스테이지 데이터"의 에셋 키 그대로 30개 파일로 크롭, G8은 배경 1장 + 소품 5장으로 분리한다. 알파 투명 원본은 크롭·리사이즈만, 마젠타 원본만 색상 유사도 기반 소프트 매팅으로 배경을 제거한다.
3. pnpm convert:minigame-art (또는 해당 스크립트)로 변환하고 결과 크기/투명도를 확인한다.
4. src/web/minigame/cleat-drop/cleatDropAssets.ts 신규: 이미지 URL 상수 + Image 로더, 실패 시 undefined를 돌려줘서 렌더 쪽에서 도형 폴백을 쓰게 한다.
5. src/web/minigame/cleat-drop/CleatDropCanvas.tsx 신규: 세션 2의 엔진 상태를 받아 캔버스에 그린다(진자/스윙/낙하/바운스/목표물/3초 게이지/도트 인디케이터). 이미지가 없으면 4번 항목의 Image 로더 폴백 규칙대로 색상 도형으로 그린다. 좌클릭/탭 입력 2단계(낙하 트리거, 스윙 트리거)를 여기서 처리한다.
6. 테스트: 에셋 로더 실패 폴백 테스트(선택), 기존 캔버스 계열 테스트 패턴이 있으면 맞춘다.

완료 기준: pnpm test(cleat-drop 관련)와 타입체크 통과, docs/minigame-cleat-drop.md "8. 진행 체크리스트"의 "세션 3" 체크. 시각 확인은 하지 않고, 사용자가 배포 후 확인할 항목(크롭 경계, 캐릭터 크기감, 목표물 판정 영역과 그림의 정렬)을 목록으로 보고한다.
```

---

## 세션 4 — 저장 · 오디오 · 완료 화면

```text
[공통 머리말] docs/minigame-cleat-drop.md 를 먼저 읽고, 브라우저 수동 확인은 하지 말고 pnpm test 와 타입체크로만 검증한다. 셸 편집은 Write/Edit 도구 또는 Write로 만든 Node 스크립트를 쓴다(heredoc 아포스트로피, Python CRLF 문제). victory.mp3 계열 사운드는 재사용 금지. 문서와 다르게 구현해야 하면 문서를 먼저 고친다. 커밋은 요청 시에만, 별도 브랜치 없이 main에.

작업: 진행 저장(스테이지 클리어 + 시도 횟수), 효과음/BGM, React 상태 훅과 전체 클리어 완료 화면을 만든다.

먼저 읽을 문서: docs/minigame-cleat-drop.md "5. 저장 스펙"(코드 스니펫 그대로 구현), "7. 오디오 — BGM · 효과음"(표).
먼저 읽을 코드: src/web/pitch/game/foreverProgress.ts(버전 있는 JSON blob + 검증 파서 + 메모리 폴백 + try/catch load/save 패턴을 그대로 따라간다), src/web/minigame/football-match3/useFootballMatch3Sfx.ts / useFootballMatch3Music.ts(복제해서 키 이름만 바꾸는 패턴), src/web/minigame/football-match3/useFootballMatch3Game.ts(React 상태, end-latch로 라운드 종료를 한 번만 보고하는 패턴), src/web/audio/sfxMap.ts 또는 해당 미니게임군의 sfx 후보 등록 위치.

구현 범위:
1. src/web/minigame/cleat-drop/cleatDropProgress.ts 신규: "5. 저장 스펙"의 CleatDropProgress 타입, defaultProgress, isAllCleared, parseProgress(버전/길이/타입 검증, 이상하면 defaultProgress), loadProgress/saveProgress(localStorage try/catch, 실패 시 메모리 폴백), 키는 fc26-cleat-drop-progress.
2. src/web/minigame/cleat-drop/useCleatDropSfx.ts, useCleatDropMusic.ts 신규: "7. 오디오"의 사운드 id들을 등록(파일 있으면 재생, 없으면 재사용 폴백 또는 무음). victory 계열은 후보에 넣지 않는다.
3. src/web/minigame/cleat-drop/useCleatDropGame.ts 신규: 세션 2의 엔진을 감싸는 React 상태. 스테이지 진행, 시도할 때마다 cleatDropProgress에 시도 횟수 반영, 스테이지 클리어 시 cleared 갱신, isAllCleared가 처음 true가 되는 순간(end-latch)에만 전체 클리어 콜백을 부른다.
4. 완료 화면 UI(또는 CleatDropCanvas 오버레이): "총 {attempts}번 만에 30 스테이지 모두 클리어!" 문구, "7. 오디오" 표의 S11(all-clear) 사운드 재생.
5. 테스트: cleatDropProgress.test.ts(파싱 검증, 손상 데이터 폴백, save/load 왕복), useCleatDropGame 관련 로직 테스트(시도 횟수 누적, end-latch가 정확히 한 번만 트리거).

완료 기준: pnpm test(cleat-drop 관련)와 타입체크 통과, docs/minigame-cleat-drop.md "8. 진행 체크리스트"의 "세션 4" 체크. 사용자가 확보해야 할 미확보 사운드 파일 목록("7. 오디오" 표에서 아직 없는 것)을 보고한다.
```

---

## 세션 5 — 메뉴 등록 · 마감

```text
[공통 머리말] docs/minigame-cleat-drop.md 를 먼저 읽고, 브라우저 수동 확인은 하지 말고 pnpm test 와 타입체크로만 검증한다. 셸 편집은 Write/Edit 도구 또는 Write로 만든 Node 스크립트를 쓴다(heredoc 아포스트로피, Python CRLF 문제). victory.mp3 계열 사운드는 재사용 금지. 문서와 다르게 구현해야 하면 문서를 먼저 고친다. 커밋은 요청 시에만, 별도 브랜치 없이 main에.

작업: "심심풀이" 팝오버 메뉴에 cleat-drop을 등록하고, 마지막 마감을 한다.

먼저 읽을 문서: docs/minigame-cleat-drop.md "3-3. 등록 체크리스트"(반드시 4곳 모두).
먼저 읽을 코드: src/web/minigame/MinigameMenu.tsx(MinigameId 유니언, games 배열, WARMUP_URLS), src/web/App.tsx(activeMinigame 상태 유니언과 모달 렌더 분기, football-match3나 keeper-breakout 항목을 그대로 본떠 추가), src/web/minigame/cleat-drop/CleatDropModal.tsx(세션 2~4에서 만든 엔진/캔버스/저장/사운드 훅을 여기서 조립).

구현 범위:
1. src/web/minigame/cleat-drop/CleatDropModal.tsx 신규(없었다면): 기존 Modal(wide) 셸 재사용, HUD(스테이지 번호, 이번 스테이지 시도 횟수, 클리어 도트 인디케이터), CleatDropCanvas, SoundControl.
2. MinigameMenu.tsx: MinigameId에 "cleat-drop" 추가, games 배열에 { id: "cleat-drop", label: "축구화 던지기", icon: <img src="/cleat-drop-icon.webp" alt="" className="minigame-menu__icon" /> } 추가(아이콘 로드 실패 폴백은 기존 KeeperBreakoutMenuIcon 패턴처럼 이모지로), WARMUP_URLS에 자주 재생되는 sfx 몇 개 추가.
3. App.tsx: activeMinigame 상태 유니언에 "cleat-drop" 추가, 모달 렌더 분기에 { activeMinigame === "cleat-drop" && <CleatDropModal onClose={() => setActiveMinigame(null)} /> } 추가. onSelect 라우팅에서 "cleat-drop" 선택 시 setActiveMinigame("cleat-drop") 되는지 확인.
4. 전체 pnpm test 와 타입체크를 돌려 다른 미니게임에 회귀가 없는지 확인한다.
5. docs/minigame-cleat-drop.md "8. 진행 체크리스트"를 전부 체크하고, "4. 스테이지 데이터"의 난이도 수치(판정폭/반발계수/바람)가 실제 플레이 감각과 다르게 느껴질 만한 부분이 있으면(코드만 보고 판단 가능한 범위에서) 메모를 남긴다 — 실측 튜닝은 사용자가 배포 후 플레이해 보고 후속 세션에서 조정한다.

완료 기준: 전체 pnpm test와 타입체크 통과, docs/minigame-cleat-drop.md "8. 진행 체크리스트" 전부 완료. 변경 요약과 사용자가 배포 후 확인해야 할 목록(등록 4곳, 난이도 체감)을 보고한다.
```
