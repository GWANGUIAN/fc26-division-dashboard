# 13. 락커룸 캐비닛 · 인벤토리(캐릭터 꾸미기 + 펫) 사양

락커룸에 **캐비닛 상호작용**을 추가하고, 열면 **인벤토리 창**이 떠서 캐릭터를 꾸민다(착용 아이템 + 펫). 착용 상태는 **캐릭터별로 저장**되고, 캐릭터가 움직이는 **모든 방향·모든 애니메이션**에서 유지된다. 이 문서가 구현의 기준이고, 이미지 생성 지시는 [14-inventory-image-runbook.md](14-inventory-image-runbook.md)(생성기 `tools/build-inventory-runbook.mjs`)에 있다. **구현보다 이 두 문서가 먼저**다.

> 기존 사실(탐색 결과): 피치 전체가 클라이언트 캔버스(960×540), 상태는 localStorage(`storage.ts` `pitchRead/pitchWrite`), 캐릭터 아틀라스는 960×960(96×96 셀 10×10, 방향 3종 `down`/`side`/`up`, 좌향 = `side` 미러, 80프레임: idle·run·shoot·skill·celebrate·disappointed — `data/animations.ts`, `engine/sprite.ts drawFrame`), 락커룸은 `scenes/LockerScene.ts` + `game/locker.ts`(원형 상호작용·`lockerTargetAt`·`drawPrompt`), 스탯 화면은 `manager.push(new StatScene(...))` 오버레이. 03 §4 가 락커룸 좌표의 기준이다.

## 1. 범위와 아이템 종류 검토

| 슬롯 | 판정 | 이유 · 방식 |
| --- | --- | --- |
| 모자 `hat` | ✅ v1 | 머리 위치를 프레임별로 자동 추적하면 3방향 전부 자연스럽다 |
| 얼굴 `face` (안경·안대) | ✅ v1 | `down`·`side` 에서만 표시, `up` 은 숨김. 머리 기준 고정 오프셋 |
| 등 `back` (망토·날개·가방) | ✅ v1 | 방향별 레이어 순서만 다르다: `down`·`side` = 몸 **뒤**, `up` = 몸 **앞** |
| 펫 `pet` | ✅ v1 | 별도 스프라이트가 캐릭터 뒤를 따라다닌다. 게임플레이(볼·충돌·슛)에 영향 없음 |
| 목(스카프) | △ 백로그 | 달리기 때 몸통 흔들림에 맞추기 애매 |
| 신발·장갑·완장·유니폼 | ❌ 제외 | 달리기·슛·개인기에서 팔다리 포즈가 프레임마다 달라 **프레임별 원본 아트**가 필요(아틀라스 80프레임×아이템 수) |
| 공 스킨·트레일 | △ 백로그 | 쉽지만 이번 범위 밖 |

v1 은 **hat / face / back / pet 각 1개씩** 장착. 아이템은 **전원 해금**(진행도·획득 없음). 착용 아이템 16종 + 펫 18종(공용 6 + 캐릭터 전용 12).

## 2. 카탈로그 (`data/equipment.ts`, 신규)

```ts
type EquipSlot = "hat" | "face" | "back";
interface EquipItem { id: string; slot: EquipSlot; name: string; sheet: string; row: number; dx?: number; dy?: number }
interface PetDef { id: string; name: string; exclusiveTo?: string }
```

`sheet` = 시트 키(`hat-a` 등), `row` = 시트 행(0~3), `dx`/`dy` = 구운 픽셀 단위 미세 조정(예: 헤드폰 `dy: 8`). 크기는 시트 변환 때 `scripts/pitch-art-manifest.json` 의 `equipment.sheets.<시트>.items[[id, 구운 정면 폭]]` 로 정해진다. 카탈로그(`data/equipment.ts`)는 매니페스트를 미러링하고, 시트·셀 크기·행 순서·펫 id 가 어긋나면 `__tests__/equipment.test.ts` 가 실패한다.

**착용 아이템 16종**

| 시트 | 행 순서 (id · 이름) |
| --- | --- |
| `hat-a` | `cap` 야구모자 · `beanie` 비니 · `crown` 왕관 · `wizard` 마법사 모자 |
| `hat-b` | `straw` 밀짚모자 · `headphones` 헤드폰 · `santa` 산타 모자 · `cowboy` 카우보이 모자 |
| `face-a` | `sunglasses` 선글라스 · `roundglasses` 동그란 안경 · `heartglasses` 하트 안경 · `eyepatch` 안대 |
| `back-a` | `cape` 붉은 망토 · `angelwings` 천사 날개 · `devilwings` 악마 날개 · `backpack` 책가방 |

**펫 18종** (id = 파일 `pets/pet-<id>`)

| 구분 | 펫 (id) | 전용 대상 (캐릭터 id) |
| --- | --- | --- |
| 전용 | 팬치 `panchi` (침팬치) | 우왁굳 `woowakgood` |
| 전용 | 해피 `haepi` (해파리) | 해파린 `haepalin` |
| 전용 | 구르미 `gureumi` (구름) | 재닌 `janine95kim` |
| 전용 | 용볼이 `yongboli` (드래곤볼) | 하치 `hachi97` |
| 전용 | 뱀술이 `baemsuri` (뱀을 형상화했지만 둥글고 뱀과 안 닮음) | 리냐 `lina0108` |
| 전용 | 돌멩이 `dolmengi` (돌) | 쥬멩이 `ju010228` |
| 전용 | 시바꺼 `sibakkeo` (시바견) | 다시바 `tdnlamuron` (요청의 "시바") |
| 전용 | 펭귄 `penguin` | 핑구 `sjh4018` |
| 전용 | 봉밥이 `bongbabi` | 빙밍 `tleod1818` |
| 전용 | 단결 `dangyeol` | 한결 `kaksjak0730` |
| 전용 | 뽀글스 `bbogeulseu` | 뽀린걸 `bboringirl` |
| 전용 | 웅남이 `ungnami` | 문모모 `doormomo` |
| 공용 | 치즈냥 `cheezenyang` · 꽥이 `kkwaegi` · 말랑이 `mallangi` · 공돌이 `gongdori` · 삐약이 `ppiyagi` · 뚜뚜 `ttuttu` | — |

전용 펫은 해당 캐릭터의 펫 탭에만 나온다(공용 6 + 전용 1 = 7종). 전용 펫의 외형은 사용자 제공 레퍼런스가 기준이며 이 문서·프롬프트에 글로 묘사하지 않는다.

## 3. 저장

`fc26-pitch-loadout-v1` (localStorage, `storage.ts` 에 `loadPitchLoadout / savePitchLoadout` 추가, 기존 `pitchRead/pitchWrite` 메모리 폴백 재사용):

```json
{ "woowakgood": { "hat": "cap", "back": "cape", "pet": "panchi" }, "hachi97": { "face": "sunglasses" } }
```

- 키 = 캐릭터 id, 값 = 슬롯별 아이템 id(없으면 생략).
- 로드 시 **정정**: 알 수 없는 캐릭터 키·아이템 id·슬롯 불일치 → 해당 항목 제거, 다른 캐릭터 전용 펫 → 제거. JSON 깨짐 → 빈 객체.
- **기본값**: 저장 기록이 없는 캐릭터는 **자기 전용 펫만** 착용한 상태(`defaultLoadout`). 인벤토리에서 한 번이라도 적용하면 그 내용이 저장되고, 전부 벗고 적용한 경우는 빈 `{}` 로 저장되어 기본값으로 되돌아가지 않는다.
- 캐릭터를 바꾸면(`CharacterSelectScene` 확정) 그 캐릭터의 로드아웃이 즉시 적용된다. 통계(`fc26-pitch-stats-v1`)와 달리 **캐릭터별**이다.
- 08 §5 의 localStorage 표에 이 키를 추가한다.

## 4. 렌더링 (모든 방향·애니메이션에서 유지)

### 4-1. 아이템 아트 = 방향별 정지 이미지
시트 1장에 아이템 4종 × 3방향(FRONT=`down`, SIDE=오른쪽 `side`, BACK=`up`)을 생성한다(14 §셀 규격). 프레임별 아트는 만들지 않는다. 좌향은 `side` 컷을 **미러**해 그린다(캐릭터와 동일 규칙; 비대칭 아이템은 미러돼도 어색하지 않게 프롬프트에서 좌우 대칭 위주로 요청).

### 4-2. 앵커 자동 추출
`pnpm build:pitch-anchors`(`scripts/build-pitch-anchors.mjs`)가 12명의 아틀라스를 읽어 셀마다 **머리 꼭대기 y, 머리 중심 x, 머리 폭**을 알파(≥128)에서 측정한다 → `data/equipmentAnchors.generated.ts`(`cells[row*10+col] = [x, y, w] | null`, 캐릭터별 `headW` = idle 프레임 머리 폭의 중앙값). 아틀라스를 다시 변환하면 이 스크립트를 다시 돌린다.
- 측정: 최상단 행(불투명 픽셀 2개 이상) → 그 아래 7행의 x 평균 = 중심, 최상단+3~10행의 가장 넓은 폭(중심 ±14px) = 머리 폭(머리카락 포함). 빈 셀은 `null`(80프레임 × 12명 전부 채워짐, 테스트로 확인).
- 아이템은 `HEAD_REF`(=매니페스트 `equipment.headRef` 23px)의 머리 폭 기준으로 구워져 있고, 런타임 배율 = `headW / HEAD_REF` 를 0.7~1.3 으로 자르고 0.05 단위로 맞춘다(`itemScale`).
- 머리 대비 위치(머리 폭 배수, `engine/equipment.ts` 상수): 모자 밑단 = 머리 꼭대기 + 0.22, 얼굴 중심 = + 0.5(측면은 앞쪽으로 0.12), 등 윗변 = + 0.85(측면은 뒤쪽으로 0.4). 캐릭터별 추가 튜닝이 필요하면 카탈로그 `dx`/`dy` 또는 이 상수를 조정한다.
- 알려진 한계: 만세·무릎 세리머니처럼 손이 머리보다 높은 프레임은 손 끝이 머리 꼭대기로 측정될 수 있다(프레임 보간·예외 처리는 하지 않음 — 눈으로 보고 필요한 프레임만 후속 조정).

### 4-3. 합성 (`engine/sprite.ts`)
`engine/equipment.ts` 의 `drawEquippedFrame(g, atlas, rect, characterId, loadout, lookup, footX, footY, options)` 가 `drawFrame` 을 감싼다(방향은 셀 위치에서 `directionOfCell` 로 판정). 레이어 순서:

| 방향 | 순서 (아래→위) |
| --- | --- |
| `down` | back → 몸 → face → hat |
| `side` | back → 몸 → face → hat |
| `up` | 몸 → back → hat (face 숨김) |

- 미러 시 오버레이도 함께 미러(앵커 x 를 좌우 반전).
- 스케일·depth scaling 은 몸과 동일하게 적용(`LockerScene` 의 1.5배 포함).
- 사용처: `PitchScene`, `LockerScene`, `InventoryScene` 미리보기. 골키퍼(`keeper-ai`)와 캐릭터 선택창 히어로는 대상 아님(선택창 카드/프리뷰에는 v1 미적용).
- 에셋: 아이템 시트 4장(≈47KB)은 **`core` 그룹**에 들어가고, 펫은 **`pets:<캐릭터id>` 그룹**(그 캐릭터가 입을 수 있는 7종, 약 150KB)으로 로드한다. `PitchScene`/`LockerScene` 이 착용 중인 펫이 있을 때, 인벤토리가 열릴 때 로드한다(`char:<id>` 그룹은 그대로). 아트가 없거나 아직 로드 전이면 몸만 그려진다.

### 4-4. 펫 (`game/pet.ts`, 신규)
- 캐릭터 발 위치 궤적을 기록해 **0.25s 전** 위치 + 옆 오프셋 26px(캐릭터가 향하는 쪽의 반대편)로 따라온다(지수 접근 `FOLLOW_RATE` 10). 속도 18px/s 초과면 move, 아니면 idle.
- 스프라이트: 방향 3종(down/side/up, 행) × (idle A·B, move A·B, 열), 셀 48×48, 접지선 y=45. 방향은 이동 벡터에서 정하고 좌향은 side 미러. 그릴 때 배율 = 소유자 depth 배율 × `PET_DRAW_SCALE` 0.8(락커룸은 ×1.5).
- y 정렬 그리기에 참여(피치 `drawActors` 4번째 요소, 락커룸 `drawSorted` 의 이동 요소), **충돌·볼·슛 판정에 관여하지 않음**. 피치·락커룸·인벤토리 미리보기에 표시. 캐릭터 교체·`R` 리셋 때 `resetPet` 으로 바로 옆에 다시 놓는다.
- 아트가 없으면 펫은 그려지지 않는다.

## 5. 캐비닛 상호작용과 인벤토리 씬

### 5-1. 락커룸 캐비닛 (`game/locker.ts`, `LockerScene.ts`)
- **닫힌 사물함 `env/locker-unit`(스프라이트 기준 (677,238), 03 §4 사물함1)** 이 "내 캐비닛"이다. 뒤쪽 줄은 걸을 수 없어 **상호작용 원 `CABINET` = 중심 (677, 258), r=56** 을 그 바로 앞 바닥에 둔다(분석기·출구 원·충돌 상자와 겹치지 않음, 테스트). 위치는 눈대중이라 사용자 확인 후 조정 가능. `ANALYZER`/`EXIT_DOOR` 와 같은 방식으로 `lockerTargetAt` 에 `"cabinet"` 분기, 프롬프트 `캐비닛 열기`(`drawPrompt` `E`), `onKey` 에서 E/Enter → `manager.push(new InventoryScene(...))`.
- 인벤토리가 열려 있는 동안 소품 스프라이트를 `locker-unit` → `locker-unit-open` 으로 교체(닫히면 복귀). 분석기와 반경이 겹치지 않는지 `game/locker.ts` 테스트에 추가.
- 락커룸 플레이어와 펫은 인벤토리에서 저장한 로드아웃을 닫힌 뒤 즉시 반영.

### 5-2. 인벤토리 창 레이아웃 (`scenes/InventoryScene.ts`, 캔버스, 논리 960×540)
창은 **720×480, 화면 좌표 (120, 30)**. 뒤는 반투명 네이비 딤(코드). 좌표는 창 기준 상대값이며 눈대중으로 조정 가능(03 §4 처럼 조정 이력을 README 세션 로그에 남긴다).

| 요소 | 창 기준 위치/크기 | 이미지(14) |
| --- | --- | --- |
| 창 프레임 | 0,0 · 720×480 | `ui/inv-frame` (#I23) |
| 제목 | 상단 바 중앙 (360, 40) `캐비닛 · 캐릭터 이름` | 캔버스 텍스트(Galmuri11) |
| **미리보기 패널(왼쪽)** | 29,74 · 212×337 (프레임의 왼쪽 오목 패널), 무대 이미지는 그 안 29,121 · 212×233 | `ui/inv-preview-stage` (#I24, 원본에서 자체 테두리를 잘라 안쪽만 사용) |
| 미리보기 캐릭터 | 무대 연단 중심 (135, 319) 발 기준, 배율 2배, 펫은 캐릭터 옆 70px | 아틀라스 idle/run + 오버레이 |
| 방향 회전 ◀▶ | (34,372)·(208,372) 원형 28×28 | `ui/inv-arrow-left/right` |
| 자세 토글 (대기/달리기) · 자동 회전 | (66,372) 68×28 · (138,372) 68×28 | `ui/inv-btn` 판 |
| **오른쪽 패널** | 261,74 · 430×337 | (프레임 안 패널) |
| 탭 4개(모자/얼굴/등/펫) | (275,82) 각 96×36, 간격 6 | `ui/inv-tabs` (#I25) |
| 아이템 그리드 | (275,128) 4열×3행 슬롯 64×64 간격 6 | `ui/inv-slot` (#I26) + 아이콘 |
| 정보 카드 | (557,128) 126×204 | `ui/inv-infocard` (#I28) |
| 페이지 ◀ n/m ▶ | (275,340)·(367,340) 28×28, 12개 초과일 때만 | `ui/inv-arrow-*` + 텍스트 |
| 하단 버튼 4개 `적용`·`해제`·`전체 해제`·`닫기` | 프레임 하단 바 안 y 429, 각 96×32, x 156/260/364/468 | `ui/inv-btn` 판 |
| 배지(착용중 ✔·전용 ★) | 슬롯 우상단 16×16 | `ui/inv-badges` (#I29) |
| 착용 이펙트 | 미리보기 캐릭터 머리 위 64×64(2배) 6프레임 | `fx/fx-equip-sparkle` (#I30) |

### 5-3. 동작
- **선택 = 미리보기**: 슬롯을 선택(클릭·방향키)하면 왼쪽 미리보기 캐릭터에 **즉시 미리 착용**된다(로드아웃 초안 `draft`). 저장된 로드아웃은 그대로.
- **적용**: `draft` 를 저장(`savePitchLoadout`) + 스파클 + 소리. **해제**: 현재 탭 슬롯 비움(초안). **전체 해제**: 4슬롯 모두 비움(초안). 초안이 저장본과 다르면 `적용` 활성.
- **닫기·Esc**: 초안 폐기하고 닫기(초안이 다르면 한 번 확인 토스트 `저장하지 않고 닫으려면 한 번 더`).
- 탭 = 슬롯(모자/얼굴/등/펫). 펫 탭은 공용 6 + 현재 캐릭터 전용 1(전용은 맨 앞, ★ 배지). 슬롯이 12개 초과 시 페이지.
- 선택된 슬롯을 다시 누르면 초안에서 해제(토글). 정보 카드: 아이템 이름, 슬롯 종류, 전용 펫이면 `○○ 전용`.
- 입력: 방향키 = 그리드 이동, Tab = 다음 탭, `Delete`/`Backspace` = 해제, `R` = 자세 토글, Enter = 선택(토글), `A` = 적용, Esc = 닫기, `Q`/`E` 또는 ◀▶ = 미리보기 방향 회전, 마우스 hover/클릭 모두 지원. 미리보기는 **down → side → up → side(미러)** 를 자동 회전(자동 회전 토글), 자세 idle/run 토글.
- 아이콘은 별도 이미지 없이 런타임에 시트의 FRONT 컷/펫 FRONT idle A 를 정수 배율로 그린다(`drawIcon`).
- SFX: 새 이벤트·파일 없이 기존 `ui-select`(열기·미리 착용·적용)·`ui-cursor`(방향키)·`ui-click`(탭·버튼)·`ui-back`(해제·닫기)·`ui-hover` 를 쓴다. `sfxMap` 은 06 의 50개 그대로(`victory.mp3` 금지 테스트 유지).
- 창은 UI 아트가 없어도 동작한다: 프레임·슬롯·탭·버튼·정보 카드는 단색 판으로 그려지고, 이미지(`ui/inv-*`, `fx/fx-equip-sparkle`)가 변환되면 자동으로 `locker` 그룹에 들어가 적용된다(`assets.ts` `INVENTORY_KEYS`; 파일이 없으면 그룹에서 빠짐).
- 접근성: `announce()` 로 선택·적용 결과 안내, `prefers-reduced-motion` 이면 자동 회전·스파클 생략.

## 6. 이미지 목록 요약 (상세·프롬프트는 14)

착용 아이템 시트 4 + 공용 펫 6 + 전용 펫 12 + UI 7 + FX 1 = **30장**. 파일명 규칙(08 §5 에 추가): 착용 시트 `tmp/pitch-src/equipment/acc-<sheet>.png`, 펫 `tmp/pitch-src/pets/pet-<id>.png`, 펫 레퍼런스(사용자 보유) `tmp/pitch-src/refs/pet-<id>-ref.png`, UI `tmp/pitch-src/ui/ui-inv-<name>.png`, FX `tmp/pitch-src/fx/fx-equip-sparkle.png`. 변환 결과는 `src/web/assets/pitch/{equipment,pets,ui,fx}/`.

## 7. 구현 단계와 산출물

| 단계 | 내용 | 주요 파일 |
| --- | --- | --- |
| 0 | **문서**(이 문서, 14, 생성기, README·08 갱신) | `docs/pitch/13`, `14`, `tools/build-inventory-runbook.mjs` |
| 1 | 카탈로그·저장·앵커 추출 | `data/equipment.ts`, `storage.ts`, `scripts/build-pitch-anchors.mjs`, `data/equipmentAnchors.generated.ts` |
| 2 | 변환 파이프라인 `equipment` / `pets` 모드(시트 슬라이스·정규화 셀·`assetMeta` 갱신) + `ui inv-*`·`fx equip-sparkle` 매니페스트 시트(`crop`·`parts` 지원) | `scripts/convert-pitch-art.mjs`, `scripts/pitch-art-manifest.json` |
| 3 | 합성·펫·씬 적용, 에셋 그룹(`core` 에 시트, `pets:<id>`) | `engine/equipment.ts`, `game/pet.ts`, `PitchScene`, `LockerScene`, `engine/assets.ts` |
| 4 | 캐비닛 + 인벤토리 씬 | `game/locker.ts`, `LockerScene.ts`, `scenes/InventoryScene.ts`, `ui/inventoryLayout.ts` |
| 5 | 테스트·문서 동기화 | 아래 |

### 테스트 계획
- 로드아웃 저장·정정(알 수 없는 id·타 캐릭터 전용 펫·깨진 JSON·메모리 폴백).
- 카탈로그 ↔ 14 시트 행 순서 ↔ 펫 id ↔ `PITCH_CHARACTER_IDS` 일치(전용 펫 12개가 12명과 1:1).
- 전용 펫 필터(캐릭터별 펫 목록 = 공용 6 + 전용 1).
- 앵커 생성 결과 스냅샷(프레임 80 × 12명, 보간 비율 상한).
- `drawCharacter` 레이어 순서(방향별 호출 순서를 fake `g` 로 검증), 미러 시 x 반전.
- `CABINET` 반경이 분석기·출구와 겹치지 않음, `lockerTargetAt` 우선순위.
- `InventoryScene`: 선택=초안 미리보기, 적용=저장, Esc=폐기, 페이지·탭 키 입력.
- `sfxMap` 은 변경 없음(기존 테스트가 `victory.mp3` 부재와 50개를 보장).
- 검증은 `pnpm test`·타입체크·빌드까지(브라우저 수동 확인은 사용자가 배포 후 진행 — 메모리 방침).

## 8. 열린 결정 (기본값 + 변경 방법)

| 결정 | 기본값 | 바꾸려면 |
| --- | --- | --- |
| "시바" 캐릭터 | `tdnlamuron`(다시바) | `PetDef.exclusiveTo` 한 줄 |
| 핑구 펫 이름 | `펭귄` | `data/equipment.ts` 이름만 |
| 해금 | 전원 해금 | 카탈로그에 `unlock` 조건 추가(스키마 호환) |
| 슬롯 수 | 슬롯당 1개, 펫 1마리 | — |
| 캐릭터 선택창 히어로에 착용 반영 | v1 미적용 | 백로그 |

## 9. 구현 현황 (2026-09-25)

| 단계 | 상태 | 비고 |
| --- | --- | --- |
| 0 문서 | 완료 | 13·14·생성기 |
| 1 카탈로그·저장·앵커 | 완료 | `data/equipment.ts`, `storage.ts`(`loadPitchLoadouts`/`savePitchLoadouts`), `pnpm build:pitch-anchors` |
| 2 변환 | 완료 | `pnpm convert:pitch-art -- equipment`(4시트) · `pets`(16종 변환, **penguin·ungnami 원본 없음**) · UI/FX 7+1 시트는 원본 도착 후 `ui inv-*`, `fx equip-sparkle` |
| 3 합성·펫 | 완료 | `engine/equipment.ts`, `game/pet.ts`, `PitchScene`, `LockerScene` |
| 4 캐비닛·인벤토리 | 완료(UI 아트 없이 단색 폴백) | `scenes/InventoryScene.ts`, `ui/inventoryLayout.ts` |
| 5 테스트 | 완료 | `equipment`·`equipmentDraw`·`pet`·`inventoryLayout`·`inventoryScene` + 매니페스트 테스트 |

**남은 일 (이미지 도착 후)**: #I23~#I30(UI·FX)와 펭귄·웅남이 펫 이미지를 `tmp/pitch-src/` 에 저장 → `pnpm convert:pitch-art -- ui` / `-- fx equip-sparkle` / `-- pets penguin` / `-- pets ungnami`(변환 후 `assetMeta` 가 갱신되고 UI 키가 `locker` 그룹에 자동으로 들어옴) → 창 좌표(§5-2)·아이템 위치 상수를 눈으로 보고 조정. 브라우저 확인은 사용자가 배포본에서 진행.

**2026-09-25 최종**: 모든 원본(펫 18종·UI 7장·FX 1장)이 변환되어 `ui/inv-*`·`fx/fx-equip-sparkle`·`pets/pet-*` 가 실제 아트로 동작한다. 생성 이미지가 요청한 캔버스와 달라 매니페스트의 `crop` 을 실제 배치에 맞췄다(tabs 0.49, btn 두 밴드 0.27·0.28~0.55, badges 0.7, preview-stage 안쪽 [0.075,0.095,0.85,0.68] → 212×233). §5-2 좌표는 프레임 이미지의 오목 패널·하단 바에 맞춰 위 표로 갱신했다. 원본 두 장(`pet-penguin`, `fx-equip-sparkle`)이 `tmp/pitch-src/ui/` 에 저장돼 있어 `pets/`·`fx/` 로 복사해 변환했다(원본은 삭제하지 않음).
