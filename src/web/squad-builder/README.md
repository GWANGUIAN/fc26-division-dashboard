# 스쿼드 빌더 (Squad Builder)

FC26 게임의 스쿼드 배치 화면처럼, 스트리머 카드를 포메이션 위에 드래그 앤 드랍으로 배치해보는 기능. 진입 버튼은 카드뷰/리스트뷰 상단(넓은 화면: 오른쪽 스티키 세로 레일, 좁은 화면: 툴바 인라인 버튼)에 "나만의 스쿼드 빌더"로 노출되며, 모바일(≤680px)에서는 숨겨진다.

이 기능은 순수 시각적 편성 도구다 — `StreamerRecord`에는 포지션/스탯 필드가 없으므로, 포메이션 슬롯은 어떤 스트리머든 배치 가능한 자리일 뿐 실제 축구 포지션 적합성 로직은 없다.

## 파일 구조

| 파일 | 역할 |
|---|---|
| `types.ts` | `FormationSlot`/`FormationPreset`/`SquadPlacement`/`Squad`/`SquadBuilderState` 타입 |
| `formations.ts` | FC26 UT에서 선택 가능한 포메이션 30종. GK~전방 사이를 아웃필드 줄 수(3/4/5줄)에 따라 균등 분할한 `ROWS_3`/`ROWS_4`/`ROWS_5` 좌표를 기본으로 쓰고, 사용자 피드백으로 조정된 포메이션은 개별 오버라이드 좌표를 씀(주석 참고) |
| `formationRemap.ts` | 포메이션 변경 시 기존 배치를 최근접 슬롯으로 재매칭(GK는 항상 1:1, 나머지는 유클리드 거리 기반 그리디 매칭) |
| `reconcile.ts` | 라이브 스트리머 명단이 바뀔 때 각 스쿼드의 배치/후보 목록을 정합화 |
| `storage.ts` | localStorage 영속화(`fc26-squad-builder-v1`), 최초 진입 시 "기본" 스쿼드(4-3-3) 부트스트랩 |
| `squadBuilderReducer.ts` | 스쿼드 CRUD, 배치/스왑/삽입/정렬을 처리하는 순수 리듀서 |
| `useSquadBuilder.ts` | 리듀서 + localStorage 저장 + 라이브 roster 변경 시 reconcile을 묶는 훅 |
| `dragInteraction.ts` | 충돌 판정(`createSquadBuilderCollisionDetection`), 스왑/삽입 판정(`classifyDropIntent`), 삽입 인덱스 계산(`resolveInsertIndex`) |
| `SquadBuilderOverlay.tsx` | 전체화면 셸: `DndContext` 마운트, 스크롤 잠금, 서랍 열림/닫힘 상태 머신, 드롭 결과에 따른 리듀서 디스패치 |
| `SquadControls.tsx` | 스쿼드 선택 드롭다운 + 편집/삭제/추가 아이콘 버튼(모달로 이름 입력) + 포메이션 드롭다운, 헤더 정중앙 |
| `SquadDropdown.tsx` | Radix Select 기반 커스텀 드롭다운(앱 테마에 맞춘 각진 스타일) |
| `Pitch.tsx` | CSS로 그린 피치 + 슬롯별 드롭존(빈 슬롯은 FIFA 카드와 동일한 방패 실루엣) + 배치된 카드 |
| `CandidateDrawer.tsx` | 하단 후보 선수 서랍: 검색, 정렬 버튼(디비전순/승률순/가나다순), 카드 그리드 |
| `SquadBuilderCard.tsx` | 카드 표시 컴포넌트. `variant="candidate"`(디비전+프로필+이름만, 크게) / `variant="placed"`(추가로 승무패+승률, 작게) |
| `squad-builder.css` | 전용 스타일시트 |

`cardVisuals.tsx`(App.tsx에서 추출, `../cardVisuals.js`)의 `FifaShield`/`mixHex`/`hexToRgba`/`FancyAvatar`/`FancyName`/`RecordBadge`를 재사용한다. 마우스 틸트/홀로그램 반사 효과는 의도적으로 없음 — dnd-kit이 드래그 중 `transform`을 직접 제어하므로 카드 자체의 틸트 핸들러와 충돌한다.

## 데이터 모델

```
Squad { id, name, formationId, placements: {slotId, streamerId}[], candidateOrder: string[] }
```

불변식(리듀서가 보장): 한 Squad 내에서 특정 streamerId는 `placements` 또는 `candidateOrder` 중 정확히 한 곳에만 존재. Squad마다 독립적이므로 같은 스트리머가 여러 스쿼드에 동시에 등장 가능.

## 드래그 앤 드랍 — 후보 서랍 열림/닫힘 로직 (가장 많이 고친 부분)

`SquadBuilderOverlay.tsx`의 `dragDrawerExpanded` 상태(`boolean | null`)가 드래그 중 서랍을 강제로 열거나 닫는다. `null`은 드래그 중이 아님(평소 CSS `:hover`/`:focus-within` 동작을 따름).

**두 드래그 종류가 서로 다른 초기값/기준으로 시작한다:**

- **스쿼드(피치) 카드 드래그**: `false`(접힘)로 시작. 포인터가 접힌 서랍 자체의 좁은 띠(`DRAWER_PEEK_PX = 132px`, CSS `--drawer-peek`와 동일해야 함) 안으로 내려가야만 열린다. 그래서 피치 안에서 드래그(수비 라인/GK 포함)할 때는 절대 서랍이 막지 않는다.
- **후보 카드 드래그**: `true`(열림)로 시작 — 서랍을 호버해서 열어둔 상태에서 카드를 잡았다고 가정. **히스테리시스**로 동작: 열린 상태에서는 실제 열린 서랍 높이(`DRAWER_EXPANDED_FRACTION = 0.46`, CSS `46vh`와 동일해야 함) 선을 벗어나야만 닫히고, 일단 닫히면 다시 접힌 서랍의 좁은 띠(132px)까지 내려와야만 열린다. 두 기준을 하나로 합치려던 시도들은 전부 실패했다 — 아래 "실패했던 접근들" 참고.

실제 커서 위치는 dnd-kit의 `active.rect.current.translated`(드래그 중인 요소 자체의 박스, 카드 어디를 잡았는지에 따라 실제 커서와 어긋남)가 아니라 `window`에 직접 붙인 `pointermove` 리스너의 `event.clientY`로 추적한다.

### 충돌 판정 (`dragInteraction.ts`)

`createSquadBuilderCollisionDetection(drawerCoversTheScreen)` — `drawerCoversTheScreen`은 `dragDrawerExpanded === true`일 때만 true이고, `SquadBuilderOverlay`에서 `useMemo`로 매번 새로 만들어 `DndContext`에 넘긴다.

- `rectIntersection` 기반(포인터 "점" 하나가 아니라 **드래그 중인 카드 박스와 대상 박스가 조금이라도 겹치면** 인식) — 화면에 보이는 DragOverlay 카드 위치와 실제 판정이 일치해야 하기 때문.
- 서랍이 **실제로 화면을 덮고 있는 동안**(`drawerCoversTheScreen === true`)은 슬롯(`slot:*`) 후보를 결과에서 **아예 제외**한다 — 안 그러면 dnd-kit의 자체 겹침 비율 계산이 (의도와 무관하게) 큰 서랍 패널보다 작은 슬롯을 우연히 선호해서, 서랍이 시각적으로 덮고 있는 자리에도 드랍이 되는 버그가 생긴다.
- 서랍이 닫힌 뒤(또는 드래그 중이 아닐 때)는 슬롯이 여러 후보 중 항상 우선한다.

### 실패했던 접근들 (다시 시도하지 말 것)

1. **드롭존을 `disabled`로 토글** — 서랍이 닫혀야 할 때 `useDroppable({ disabled: ... })`로 후보 서랍 드롭존을 껐다 켰다 했는데, dnd-kit이 드래그 도중 `disabled`를 계속 토글하는 걸 안정적으로 처리하지 못해서 오히려 빈 슬롯 드랍이 불안정해졌다. 지금은 드롭존을 항상 활성 상태로 두고 충돌 판정 함수 하나로만 우선순위를 정한다.
2. **열림/닫힘 기준을 하나로 통일** — "닫히는 기준"과 "닫혔을 때 드랍이 통과하는가"를 같은 임계값 하나로 해결하려 하면 한쪽을 고치면 다른 쪽이 깨진다. 반드시 분리해서: (a) 서랍이 언제 열리고 닫히는지는 `dragDrawerExpanded`의 히스테리시스로, (b) 닫힌 상태에서 슬롯이 우선하는지는 충돌 판정 함수의 `drawerCoversTheScreen` 파라미터로 — 서로 다른 메커니즘으로 처리해야 한다.
3. **후보 서랍의 "삽입 미리보기"를 `SortableContext`의 `items`를 드래그 중 실시간으로 재정렬해서 구현** — 재정렬 → 카드 위치(rect) 변경 → 다음 `dragOver` 판정이 바뀜 → 다시 재정렬... 하는 피드백 루프가 생겨 카드가 깜빡이며 위치가 왔다갔다하다가 결국 `Maximum update depth exceeded` 크래시로 이어졌다. `SortableContext`엔 항상 실제(불변) 순서만 넘기고, 삽입 위치는 대상 카드 가장자리에 정적인 teal 하이라이트 바(`.candidate-card--insert-before`/`--insert-after`)로만 표시한다. 실제 재정렬 애니메이션은 드롭이 확정된 뒤(진짜 상태가 바뀔 때)만 일어난다.

### 스왑 시 트랜지션

피치 안에서 카드를 스왑할 때, 방금 드래그한 카드는 이미 DragOverlay로 드롭 위치까지 시각적으로 이동해 있으므로 자기 위치 트랜지션을 건너뛰어야 자연스럽다(`SquadBuilderOverlay`의 `snapStreamerId` + `Pitch.tsx`의 `.pitch-card--snap { transition: none; }`, 드롭 2프레임 뒤 해제). 반대로 자리를 비켜준 카드는 원래 위치에서 새 위치로 정상적으로 슬라이드해야 한다.

## 검증

`vitest run`으로 `formationRemap`/`squadBuilderReducer`/`reconcile`/`dragInteraction`의 순수 로직을 커버한다. 이 저장소엔 e2e 하네스가 없으므로, 드래그 앤 드랍 관련 변경은 반드시 브라우저에서 직접 확인해야 한다 — 특히 서랍 열림/닫힘 히스테리시스와 충돌 판정은 순수 함수 테스트만으로는 회귀를 못 잡는다.
