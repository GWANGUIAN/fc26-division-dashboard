# 01. 컨셉과 아키텍처 — 확정 사양, 캔버스 구조, 진입/전환, 성능 예산

> 게임 규칙은 [02](02-gameplay-spec.md), 화면 레이아웃은 [03](03-screens-and-ui.md), 아트는 [04](04-art-characters.md)·[05](05-art-world-and-ui.md), 소리는 [06](06-audio.md), 구현 순서는 [07](07-implementation-roadmap.md).

## 1. 컨셉 한 줄

**사이트에 처음 들어오면 FIFA 스타일의 2D 픽셀 축구장이 열린다.** 플레이어(기본 우왁굳)를 방향키로 움직여 드리블·개인기로 골키퍼를 흔들고 슛을 찬다. 우상단 버튼으로 기존 잔디동 대시보드로 이동하고, 대시보드의 버튼으로 다시 피치로 돌아온다. 피치 좌측 터널은 락커룸으로 이어지고, 락커룸의 스탯 분석기에서 선수 스탯 육각형(현재는 `???` / COMING SOON)을 본다.

## 2. 확정 사양

| 항목 | 결정 |
| --- | --- |
| 렌더링 | **2D Canvas**(성능 요구). 게임 화면 전부 단일 `<canvas>`, DOM은 대시보드 복귀 버튼과 접근성 대체 텍스트뿐 |
| 논리 해상도 | **960×540**(16:9). 정수 배율 우선(×1, ×2), 그 외 컨테이너 fit + nearest-neighbor |
| 시점 | 3/4 탑다운(고각 35°), 하프코트, **골대 위쪽**, 플레이어는 아래에서 위로 공격 |
| 아트 컨셉 | 16비트 아케이드 스포츠, 4.5등신, 야간 경기장 — 잔디동 월드와 **완전 별개**([04 §0](04-art-characters.md)) |
| 조작 | 방향키 이동(필수) + Space 3단계 슛(조준→파워) + Z/X/C/V 개인기 + Shift 스프린트 + E 상호작용 |
| 캐릭터 | 12명(우왁굳 + 잔디동 11명) 선택 가능. **첫 진입 기본 = 우왁굳** |
| 골키퍼 | AI 오리지널 캐릭터 `keeper-ai`. 슛 품질에 따라 선방/실점 |
| 락커룸 | 피치 좌하단 게이트 → 락커룸(탑다운 실내) → 스탯 분석기 → 육각형 화면 |
| 상태 저장 | localStorage(진입 모드, 선택 캐릭터, 설정) — [§5](#5-localstorage-키) |
| 에셋 | 월드 에셋 **미사용**, 전부 신규 생성(시트 → 스크립트 가공) |
| 로딩 | 진입 시 에셋 로딩 UI → 완료되면 경기장 화면 |

## 3. 렌더링 아키텍처

### 3-1. 캔버스와 스케일
- 컨테이너는 `position: fixed; inset: 0`(대시보드가 언마운트된 상태). 논리 960×540을 **contain 방식**으로 배치하고 남는 영역은 배경색 `#05060f`.
- 백킹 스토어 = 논리 × `renderScale`, `renderScale = clamp(floor(cssScale × devicePixelRatio), 1, 2)`. 항상 `ctx.imageSmoothingEnabled = false`. CSS는 `image-rendering: pixelated`.
- 리사이즈는 `ResizeObserver`, 마우스/포인터 좌표는 논리 좌표로 변환(`toLogical(clientX, clientY)`)해서 씬에 전달한다.
- **재사용 검토 결과(P1)**: `world/stageLayout.ts`는 640×360 상수·정수 배율 고정·액자(`gameFrame.ts`, 월드 전용 아트) 계산이 묶여 있어 **재사용하지 않고** `pitch/engine/stage.ts`를 새로 만들었다(월드 모듈 import 금지 원칙과도 일치). 루프만 `world/engine/loop.ts`의 `createLoop`를 그대로 재사용.
- 실제 구현(`pitch/engine/stage.ts`): 순수 `computeStageMetrics(containerW, containerH, dpr)`(contain, 소수 배율 허용, `renderScale = clamp(floor(cssScale×dpr), 1, 2)`), 순수 `toLogical(rect, clientX, clientY)`, `createStage(container)` → `{ canvas, metrics, beginFrame(), toLogical(), destroy() }`. `beginFrame()`이 프레임마다 `setTransform(renderScale…)` + `imageSmoothingEnabled=false`를 적용(리사이즈로 백킹 스토어가 바뀌면 컨텍스트 상태가 초기화되기 때문). 캔버스는 컨테이너 안에 절대 배치, `alpha:false`, `image-rendering: pixelated`. 2D 컨텍스트 획득 실패 시 throw → PitchEntry가 대시보드로 폴백.

### 3-2. 루프
- `world/engine/loop.ts`의 `createLoop({ update, render, step: 1/60, maxFrame })`를 재사용(고정 스텝 누산기). `maxFrame`으로 dt 폭주 방지(≤ 1/20s).
- `document.visibilitychange`로 숨김 시 정지, 복귀 시 재개(시간 점프 방지).
- 물리/AI는 고정 스텝 `update`, 보간이 필요한 렌더는 `alpha`를 받아 그린다.

### 3-3. 씬 관리
```ts
interface Scene {
  enter?(ctx: SceneCtx, params?: unknown): void;   // 동기. 비동기 로딩은 씬이 스스로 시작하고 완료 시 manager.replace
  exit?(): void;
  update(dt: number): void;
  render(g: CanvasRenderingContext2D): void;
  onKey?(e: { code: string }): void;                // 눌림 순간(에지), KeyboardEvent.code
  onPointer?(e: { type: "move" | "down" | "up"; x: number; y: number }): void;  // 논리 좌표
}
interface SceneCtx { width; height; manager: SceneManager; host: SceneHost }
interface SceneHost { assets: PitchAssets; input: Pick<PitchInput, "isDown">; hasKeyboardFocus(): boolean; goDashboard(): void; setCursor("default" | "pointer"): void; audio?: PitchAudioLike; reducedMotion?(): boolean; announce?(text: string): void }
```
- 구현: `pitch/engine/sceneManager.ts` `createSceneManager({ width, height, host, reducedMotion })` → `replace(scene, params?, { transition?: "wipe" | "fade" | "none" })`(스택이 비어 있으면 즉시), `push`, `pop`(마지막 씬은 pop 불가), `update/render/key/pointer/dispose`, `top/depth/transitionProgress`. 전환 = 덮기→중간에 교체→걷기, 진행 중 입력 차단. `wipe` 0.35s(네이비 사선 슬라이스 + 민트 테두리), `fade` 0.3s, `prefers-reduced-motion`이면 모두 0.1s 페이드. 전환 중 `replace`가 또 오면 대기 중인 교체 대상만 바뀐다.
- **P2 추가**: `SceneHost.input`(`isDown(code)` — 이동처럼 누르고 있는 키는 씬이 `update`에서 직접 읽고, 한 번 누름은 `onKey`) 와 `SceneHost.hasKeyboardFocus()`(`document.hasFocus() && 포커스가 입력창/버튼/링크가 아님` — 거짓이면 씬이 `클릭해서 시작` 안내를 그림)가 PitchEntry 에서 주입된다. 캔버스는 `tabIndex=-1` 이고 클릭 및 로딩 씬 시작 시 `focus()` 한다. `LoadingScene` 은 `core` 와 함께 `char:<loadPitchCharacter()>` 그룹(레지스트리에 없는 id 면 우왁굳)을 로드해 선택 캐릭터의 atlas 를 확보한다(진행률 core 80% / 캐릭터 20%).
- 입력 구현: `pitch/engine/input.ts` `createInput(target=window)` → `isDown(code)`, `drainPresses()`(자동 반복 제외, 다음 호출 전까지만 유효), `reset()`, `setEnabled()`. `PitchEntry`의 update에서 `drainPresses()` → `manager.key(code)`. 포인터는 캔버스 `pointermove/down/up` → `stage.toLogical` → `manager.pointer`. 방향키/Space/Tab만 `preventDefault`(Ctrl/Alt/Meta 조합·입력창·`<button>`/`<a>` 대상은 제외), 창 blur·탭 숨김 시 전부 해제.
- 씬: `LoadingScene` → `PitchScene` ⇄ `LockerScene`, 오버레이 `CharacterSelectScene`(피치 위에 스택), `StatScene`(락커룸 위에 스택).
- **P6 추가**: 피치↔락커룸은 `manager.replace(..., {transition:"wipe"})` 라서 그때마다 씬이 새로 만들어진다. `LockerScene` 은 `PitchScene` 을 import 하지 않고 생성자 인자 `createPitch()` 팩토리로 돌아갈 씬을 받는다(순환 import 방지). 락커룸에서 나갈 때 새 `PitchScene.enter(ctx, {fromLocker:true})` 가 게이트 앞 (170,470) 에 스폰시키고, **스코어·힌트 표시는 `PitchScene.ts` 의 모듈 변수 `carry` 로 이어받는다**(락커룸 진입 때만 저장, 다음 `enter` 에서 소비 — 대시보드 왕복이나 새 방문에서는 0부터). `locker` 에셋 그룹은 한 번 받으면 해제하지 않는다(디코드 약 4MB, 게이트 재접근 때 재로딩 방지). `SceneHost.announce?(text)` 는 PitchEntry 의 숨김 `aria-live="polite"` 단락에 글자를 쓴다(스탯 화면이 선택 축을 읽어줌).
- `SceneManager`: 스택(오버레이 push/pop), 전환 효과(캔버스 와이프 0.35s, `prefers-reduced-motion`이면 즉시), 아래 씬은 오버레이 중 `update` 정지·`render`는 유지.
- 입력: `InputState`(키 up/down 집합) + 눌림 순간 이벤트 큐. 방향키/Space/Tab의 브라우저 기본 동작(스크롤)은 캔버스 활성 중 `preventDefault`. 포커스 잃으면 모든 키 해제.

### 3-4. 에셋 로딩
- `pitch/engine/assets.ts`(파일명은 `pitchAssets.ts`가 아니라 `assets.ts`): `import.meta.glob("../../assets/pitch/**/*.webp", { eager: true, query: "?url&no-inline", import: "default" })` 패턴(월드 `worldAssets.ts`와 동일), 키 = `characters/woowakgood-atlas` 형태. **누락 에셋은 undefined 반환 → 플레이스홀더 도형으로 대체**(에셋 없이도 P1~P4 개발 가능).
- **실제 API(P1)**: `createPitchAssets(deps?)` → `PitchAssets { get(key), has(key), loadGroup(group, { onProgress?, minMs? }) → { loaded, failed, missing }, release(group), dispose() }`. `AssetGroupName = "boot" | "core" | "select" | "locker" | `char:${id}``. 그룹 → 파일 표는 `ASSET_GROUPS`(`AssetSpec { key, bytes? }[]`, A1이 실제 키를 채움, `bytes`는 변환 스크립트가 생성하는 `data/assetMeta.generated.ts`(`PITCH_ASSET_META[key]`)에서 가져옴), `char:<id>` 그룹은 `groupSpecs`가 `characters/<id>-atlas` + `portraits/<id>-<neutral|confident|celebrate|disappointed>` 5개로 파생(A1 확정, `hero`는 `select` 그룹). 진행률은 모든 파일에 `bytes`가 있으면 바이트 가중, 하나라도 없으면 파일 수 가중. **파일이 없는 키는 `missing`(진행률·실패에서 제외), 있는데 로드 실패면 `failed`(플레이스홀더로 진행, 콘솔 경고)**. `minMs`는 resolve를 그 시간 이후로 미룬다(로딩 화면 600ms). 디코딩은 `fetch → createImageBitmap`(불가 시 `<img>`), `release`/`dispose`가 `ImageBitmap.close()`. `boot` 그룹에 `failed`가 있으면 PitchEntry가 대시보드로 폴백.
- 그룹(lazy 단위):

| 그룹 | 내용 | 로딩 시점 |
| --- | --- | --- |
| `boot` | 로딩 키아트, 로더 스프라이트, 프로그레스 바, Galmuri11 폰트 | 즉시(로딩 화면용, 작게) |
| `core` | 피치 배경, 골대, 볼, 이펙트, HUD, 버튼, 프레임, 골키퍼 atlas, **선택된 캐릭터 atlas** | 로딩 화면에서 |
| `select` | 12명 초상화·히어로, 선택 UI, 선택 배경 | 캐릭터 선택창 최초 오픈 시(오픈 즉시 스켈레톤 표시) |
| `locker` | 락커룸 배경·소품, 스탯 UI | 게이트 접근(거리 < 200px) 시 프리로드 |
| `char:<id>` | 캐릭터 atlas | 선택 확정 시(현재 캐릭터 교체 전 로드 완료 대기) |

- 로딩 진행률 = 바이트 가중치(파일 크기 매니페스트) 또는 파일 수 가중. **최소 표시 600ms**(깜빡임 방지, 월드 LoadingScene 관례).
- 이미지는 `createImageBitmap` 디코딩(지원 시), 아틀라스는 프레임 좌표표(`animations.ts`)와 함께 `SpriteSheet` 객체로 보관.
- 로딩 실패: 개별 에셋은 플레이스홀더로 진행, `boot` 또는 캔버스 초기화 실패는 **대시보드로 자동 폴백** + 콘솔 경고.

### 3-4b. 폰트
- 화면 텍스트는 캔버스에서 **Galmuri11**(한글 픽셀 폰트)로 그린다.
- **출처(P1 확인 완료)**: `src/web/styles.css` 3~4행의 `@import url('https://cdn.jsdelivr.net/npm/galmuri@latest/dist/galmuri.css')`(jsDelivr)가 `Galmuri11` `@font-face`를 정의한다. `led-signboard.css`·`toty-card.css`·`world.css`·`exportGroupPhotoImage.ts`는 이 전역 정의를 이름으로 사용. `styles.css`는 `main.tsx`에서 항상 로드되므로 **피치 모드에서도 별도 작업 없이 정의는 존재**하지만, 폰트 파일은 실제로 쓰일 때 지연 다운로드된다 → 캔버스는 `font-display`와 무관하게 첫 프레임 전에 로드를 보장해야 한다.
- 구현(`pitch/engine/text.ts`): `ensurePixelFont(timeoutMs=4000)`가 `document.fonts.load("12px Galmuri11", <한글+영문 샘플>)`을 호출(샘플 문자열로 올바른 서브셋을 받게 함), 타임아웃/실패 시 `false`를 돌려주고 그리기는 `"Galmuri11", "Courier New", monospace` 폴백으로 진행. PitchEntry가 `boot` 그룹 로드와 함께 `Promise.all`로 기다린 뒤 로딩 씬을 시작한다. 오프라인 등으로 CDN 접근이 안 되면 monospace로 그려진다(기능 영향 없음, 픽셀 룩만 저하) — 자체 호스팅은 P7 검토 항목.
- 텍스트 렌더 유틸: `drawText(g, str, x, y, {size=12, color, align, baseline, shadow=true})`(1px 네이비 그림자, **좌표를 `Math.round`**해 블러 방지), 색 상수 `TEXT_COLORS`(03 §0 팔레트).

## 4. 진입/전환 구조

### 4-1. 컴포넌트 분리
```
main.tsx
 └─ Root (신규, 진입 게이트)
     ├─ entryMode === "pitch"     → <Suspense><PitchEntry/></Suspense>   (lazy)
     └─ entryMode === "dashboard" → <App/> (기존 App.tsx, 문서에서는 DashboardApp이라 부름)
```
- 기존 `App.tsx`는 **파일·이름 변경 없이 Root가 import**한다(문서에서는 편의상 `DashboardApp`). 내부 로직은 바꾸지 않고 `onGoPitch` prop만 추가한다. 대시보드/스냅샷 fetch/월드 오버레이는 피치 모드에서 **마운트되지 않는다**(피치 성능 보호).
- 모드 상태는 `useEntryMode()` 훅(`src/web/entryMode.ts`): `{ mode, goDashboard(), goPitch() }`. 상태는 `useState` + localStorage 저장(전환 시 즉시 write).
- **초기값은 동기 결정**(useState initializer) → 잘못된 화면이 잠깐 보이는 깜빡임 없음:
  0. **터치 전용 기기**(`matchMedia("(pointer: coarse)")`)는 **무조건 `dashboard`**(P8 결정: 터치 컨트롤은 만들지 않음 — `?mode=pitch`·저장값도 무시). 대시보드의 `피치로 돌아가기` 버튼도 숨긴다.
  1. 딥링크 규칙: URL에 `?view=`, `?totyCapture`, `#` 앵커(대시보드 섹션) 등 **기존 대시보드용 쿼리/해시가 있으면 `dashboard`**(공유 링크 보존). `?mode=pitch`/`?mode=dashboard`는 명시 오버라이드.
  2. 저장값 `fc26-entry-mode`가 유효하면 그 값.
  3. 없으면 `pitch`(첫 방문 기본값). (터치 기기는 위 0번으로 항상 대시보드.)
- **실제 구현된 규칙(P1, `src/web/entryMode.ts` `resolveInitialMode({ search, hash, stored, coarsePointer })`, 위에서 아래로 첫 일치)**:

| 순서 | 조건 | 결과 |
| --- | --- | --- |
| 0 | `(pointer: coarse)` (P8: 최우선) | `dashboard` — `?mode=`·딥링크·저장값보다 우선 |
| 1 | `?mode=pitch` / `?mode=dashboard` (그 외 값은 무시) | 그 값 — **딥링크보다 우선** |
| 2 | 쿼리에 `view`, `totyCapture`, `fancyMembers`, `worldDebug` 중 하나가 있음, 또는 해시가 `#` 뒤에 글자가 있음 | `dashboard` (`DASHBOARD_DEEP_LINK_PARAMS`에 이름을 추가하면 규칙이 확장됨) |
| 3 | `fc26-entry-mode` 저장값이 `pitch`/`dashboard` | 저장값 |
| 4 | 그 외 | `pitch` |

- 딥링크로 진입해 `dashboard`가 되어도 **저장값은 바꾸지 않는다**(전환 버튼을 눌렀을 때만 저장). 그래서 공유 링크를 열어도 다음 방문의 기본 모드가 오염되지 않는다.
- **전환 시 주소창 정리(추가 결정)**: `urlAfterSwitch(target, pathname, search, hash)`. 전환하면 `?mode=`를 항상 제거하고, **피치로 갈 때는 대시보드 딥링크 쿼리·해시도 제거**한다(안 그러면 `?view=evaluation`으로 들어온 방문자가 피치에서 새로고침할 때 규칙 2 때문에 대시보드로 되돌아감). 그 외 쿼리(`utm_*` 등)와 대시보드로 갈 때의 해시는 보존. 이는 아래 "`?mode=`를 건드리지 않는다"는 초안 문장을 대체한다.
- `main.tsx`의 `?totyCapture`(카드 캡처 페이지)는 Root보다 **먼저** 분기한다(기존 동작 보존).
- 전환은 `history.replaceState`만 쓴다(히스토리 항목을 만들지 않음). 어떤 쿼리를 정리하는지는 위 "전환 시 주소창 정리". 브라우저 뒤로가기는 사이트 이탈(기존과 동일).
- `Root.tsx`: `mode === "dashboard"`면 `<App onGoPitch={goPitch} />`, 아니면 `<PitchBoundary><Suspense><PitchEntry onGoDashboard={goDashboard} /></Suspense></PitchBoundary>`. `PitchEntry`는 `lazy()`(별도 청크 `assets/chunks/PitchEntry-*.js`, 진입 파일명 `assets/app.js` 유지). 청크 로드 실패·렌더 예외는 `PitchBoundary`가 잡아 `goDashboard()` + 콘솔 경고. `main.tsx`의 `?totyCapture` 분기는 `Root`보다 먼저(변경 없음).

### 4-2. 버튼
- **피치 → 대시보드**: 캔버스 우상단 이미지 버튼(`ui-buttons` dashboard-go), 클릭/Enter(포커스 시)로 `goDashboard()`. 전환 직전 `pitch-stats`를 저장한다.
- **대시보드 → 피치**: `TopBar.tsx`의 `topbar__actions` 영역에 이미지 버튼(`ui-buttons` return-to-pitch, DOM `<button><img/></button>`, 접근성 `aria-label="피치로 돌아가기"`). 클릭 시 `goPitch()`. 월드 토글(`WorldToggle`, 좌상단 고정 z-index 75)과 겹치지 않게 배치 확인. **P1 구현(임시)**: 이미지 없이 lucide `Goal` 아이콘 + 텍스트 `피치로 돌아가기` 버튼(`.pitch-return`, `src/web/pitch-return.css`), `TopBar`의 선택적 prop `onGoPitch`가 있을 때만 렌더(`App`이 `onGoPitch`를 그대로 전달). `WorldToggle`은 좌상단 고정, 이 버튼은 상단바 오른쪽 그룹 안이라 겹치지 않음(코드 리뷰로 확인), ≤680px에서는 아이콘만 표시. 실제 아트 적용은 A2 이후.
- 전환 시 이전 모드 스크롤/상태는 보존하지 않는다(대시보드는 언마운트).
- 대시보드 prefetch: **미구현(P7 결정)** — 스냅샷이 고정 픽스처라 예열할 fetch 가 없다(§9 참고). 실시간 수집을 재개하면 로딩 완료 2초 뒤 `requestIdleCallback` 으로 예열.

## 5. localStorage 키

`storage.ts` 컨벤션(`fc26-<kebab>[-vN]`, try/catch, 접근 실패 시에도 정상 동작)을 따른다. 신규 함수는 `src/web/storage.ts`에 추가한다.

| 키 | 값 | 기본 | 설명 |
| --- | --- | --- | --- |
| `fc26-entry-mode` | `"pitch"` \| `"dashboard"` | (동기 결정 규칙 §4-1) | 진입/전환 상태 |
| `fc26-pitch-character` | 캐릭터 id(12종 중) | `woowakgood` | 선택 캐릭터. P1의 `loadPitchCharacter()`는 형식(`/^[a-z0-9][a-z0-9_-]{0,63}$/`)만 검사해 어긋나면 기본값을 돌려준다 — 레지스트리에 없는 id 는 `data/characters.ts` 의 `resolveStoredCharacter()` 가 기본값으로 덮어써 정정한다(P5; `LoadingScene`·`PitchScene.enter` 가 사용) |
| `fc26-pitch-settings-v1` | JSON `{sfxVolume, musicVolume, sfxOn, musicOn}` | 0.8/0.5/true/true | 소리 설정 |
| `fc26-pitch-stats-v1` | JSON `{goals, saves, bestStreak, shots}` | 0 | 누적 기록(P4 ✔ — 결과가 나올 때마다 저장) |

기존 전역 `fc26-sfx-enabled`/`fc26-sfx-volume`은 대시보드 쪽 설정이므로 **건드리지 않는다**(피치는 자체 설정).

**P1 구현(`src/web/storage.ts` 하단)**: `EntryMode`, `ENTRY_MODE_STORAGE_KEY` 등 키 상수, `loadEntryMode(): EntryMode | null`(값이 없거나 이상하면 null → 호출부가 기본 규칙 적용), `saveEntryMode`, `loadPitchCharacter(): string`, `savePitchCharacter`, `loadPitchSettings(): PitchSettings`(필드별 검증·0~1 클램프, 깨진 JSON/접근 실패 시 `DEFAULT_PITCH_SETTINGS`의 복사본), `savePitchSettings`. 전부 try/catch. **P4 추가분**: `PitchStats{goals,saves,bestStreak,shots}`, `DEFAULT_PITCH_STATS`, `PITCH_STATS_STORAGE_KEY`, `loadPitchStats()`(필드별로 음수·비정수·비숫자를 0/내림으로 복구, 깨진 JSON·접근 실패 시 기본값 복사본), `savePitchStats`. 합산은 `pitch/game/stats.ts` 의 `recordShot(stats, outcome, sessionBest)`(순수).

## 6. 오디오 아키텍처
- `pitch/audio/pitchAudio.ts`(P4 ✔): `world/audio/worldAudio.ts` 구조를 따른 `PitchAudio` 클래스(월드의 `AudioLike`·`AudioDeps`·`defaultAudioDeps`(HEAD probe)·`crossfadeGains`·`BGM_FADE_SECONDS` 를 재사용). API: `playBgm("loading"|"pitch"|"locker"|null)`(1s 크로스페이드, 요청만 기억하다 `unlock()` 후 재생), `unlock()`, `playSfx(id, volume=1)`(이벤트 후보 파일 중 **존재하는 첫 파일**을 한 번만 probe 해 캐시, 파일당 3개 풀, 음량 = `sfxVolume` × `SFX_GAIN[id]` × `volume`), `stopSfx(id)`, `preload(ids)`, `setSettings(PitchSettings)`(`sfxOn`/`musicOn`/볼륨 반영), `dispose()`. 씬은 `PitchAudioLike`(같은 4메서드) 만 알고, `SILENT_PITCH_AUDIO` 가 무음 대역. 누락·probe 실패·재생 거부는 전부 무음.
- `pitch/audio/sfxMap.ts`(P4 ✔): `PitchSfxId`(06 의 SFX 50개 = `pitch-<id>.mp3`), `SFX_CANDIDATES[id]`(첫 항목 = 06 의 `pitch-` 파일, 뒤는 06 §3 재사용 후보), `SFX_GAIN`(반복음은 낮게), `resolveSfx/resolveSfxAsync`, `kickSfx(power)`(<40 soft · <78 mid · 그 이상 hard), `BGM_FILES`. `victory.mp3` 는 어떤 후보에도 없다(테스트가 검사).
- 연결: `SceneHost.audio?`(PitchEntry 가 `PitchAudio` 를 만들어 주입, 없으면 무음)와 `SceneHost.reducedMotion?()`(`prefers-reduced-motion`). PitchEntry 가 `window` 의 첫 `keydown`/`pointerdown` 에서 `audio.unlock()`. LoadingScene 은 `loading` BGM·`load-complete`, PitchScene 은 `pitch` BGM. 파일명·검색 키워드는 [06](06-audio.md).
- 자동재생 정책: BGM은 **첫 키 입력/클릭 시 시작**(브라우저 제한). 로딩 화면에서 소리 없이 시작해도 정상.
- `musicControl.ts`의 `suspendGlobalMusic`/`resumeGlobalMusic`은 피치 진입/이탈 시 호출(월드 오버레이와 동일한 방식).
- `victory.mp3`는 다른 기능 전용이므로 **사용 금지**.

## 7. 성능 예산 (필수 요구: Canvas)

| 항목 | 목표 |
| --- | --- |
| 프레임 | 60fps, `update+render` ≤ 4ms(중급 노트북), 최소 30fps 방어(dt 클램프) |
| 초기 로딩 | `boot` ≤ 300KB, `boot+core` ≤ **3MB**(WebP, 선택 캐릭터 포함) |
| 캐릭터 | atlas ≤ 350KB, 포트레잇+히어로 포함 ≤ 550KB/명 |
| 드로우 | 프레임당 `drawImage` ≤ ~80회. 정적 레이어(피치 배경·스탠드·HUD 프레임)는 **오프스크린 캔버스 캐시**, 변하는 것만 다시 그림 |
| 할당 | 프레임 루프 내 객체 생성 금지(파티클·이펙트 풀링, 벡터는 재사용) |
| 메모리 | 씬 이탈 시 그룹별 `ImageBitmap.close()`(락커룸/선택 그룹) |
| 백그라운드 | 탭 비활성 시 루프·오디오 정지 |
| 접근성 | `prefers-reduced-motion`이면 카메라 흔들림/플래시/와이프 축소 |

### 7-1. P7 성능 리포트(빌드 산출물 기준, 2026-09-25)

`pnpm exec vitest run src/web/pitch/__tests__/assetBudget.test.ts` 가 이 표를 콘솔에 출력하고 boot ≤300KB · boot+core+최대 캐릭터 ≤3MB 를 **테스트로 강제**한다(바이트 = 변환기가 만든 `assetMeta.generated.ts`, dist 의 .webp 와 동일 크기 확인).

| 그룹 | 파일 | 전송 | 디코드(RGBA) | 예산 |
| --- | --- | --- | --- | --- |
| `boot` | 6 | **156KB** | 2.1MB | ≤300KB ✔ |
| `core` | 82 | 1311KB | 7.9MB | boot+core+캐릭터 ≤3MB |
| `char:<id>` 최대(lina0108) | 5 | 653KB (아틀라스 최대 481KB) | 약 4.7MB | 목표 550KB/명은 초과 — 1명만 로드, 총합 예산 안이라 수용(백로그 B9) |
| **boot+core+최대 캐릭터** | | **2.07MB** | | ≤3MB ✔ |
| `select`(오버레이 동안만) | 50 | 1833KB | 8.8MB | 닫으면 해제 |
| `locker`(상주) | 28 | 431KB | 4.0MB | 상주 허용(재진입 즉시) |

- 최악 동시 디코드 메모리 ≈ boot 2.1 + core 7.9 + 캐릭터 4.7 + locker 4.0 + select 8.8 ≈ **27MB**(선택창을 연 동안) — 수용.
- JS: `assets/app.js`(진입 파일명 유지, Cloudflare HTML 캐시 이유) 와 별개로 `PitchEntry` 청크 155KB(gzip 52KB) 가 lazy 로 분리됨. 대시보드 경로는 피치 코드를 받지 않는다.
- BGM(loading 2.3MB · pitch 1.6MB · locker 0.7MB)은 `<audio>` 스트리밍이라 로딩 예산 밖.
- **프레임 시간은 사용자가 배포 후 측정**: `?pitchDebug=1` 로 열면 `engine/perf.ts` 가 좌상단(y=104)에 `avg ms · p95 · max · drawImage 평균/최대` 를 표시하고 콘솔에 5초마다 `[pitch] perf …` 한 줄을 남긴다(링버퍼 120프레임, 프레임당 할당 없음, 예산 4ms·`drawImage` 80 초과 시 금색). 디버그 파라미터 패널(`B`)과 함께 쓴다. 쿼리가 없으면 `FramePerf` 는 생성되지 않는다.
- 코드 점검 결과: 정적 레이어(피치+스탠드+골대 뒤)는 오프스크린 캔버스 1장 캐시, 먼지·콘페티·이펙트는 풀, 프레임 루프에서 `map/filter/slice/spread` 없음. 남은 프레임당 작업은 힌트 줄 `measureText` 5회(무시 가능). 탭 비활성 시 루프 정지(`visibilitychange`).

## 8. 모듈 구조

```
src/web/
├─ Root.tsx                  # 진입 게이트 (신규)
├─ entryMode.ts              # useEntryMode, 딥링크 규칙 (신규)
├─ App.tsx (DashboardApp)    # 이름 변경 없음, onGoPitch prop + TopBar 복귀 버튼 추가
└─ pitch/
   ├─ PitchEntry.tsx         # lazy 엔트리: 캔버스 마운트, 루프/씬 생성, 폴백 처리
   ├─ engine/                # stage.ts, input.ts, sceneManager.ts, assets.ts, text.ts (P1 완료) · sprite.ts, particles.ts (P2 완료) · tween.ts(이징·트윈 타이머), effects.ts(한 번 재생되는 스트립 이펙트 풀) (P4 완료)
   ├─ scenes/                # LoadingScene, PitchScene(+ shotHud.ts, pitchDebug.ts: P3 · styleHud.ts: P4), LockerScene, CharacterSelectScene, StatScene
   ├─ game/                  # player.ts, ball.ts(+shot 모드), tuning.ts (P2 완료) · shot.ts, keeper.ts, match.ts(결과·스코어·리셋), montecarlo.ts(선방률 표 검증), rng.ts (P3 완료) · skills.ts(개인기 4종·스타일 게이지·체인·Tier), stats.ts(누적 통계 합산) (P4 완료)
   ├─ data/                  # characters.ts(12명·포지션·색), animations.ts(클립→셀 좌표), stats.ts(포지션별 축 자리표시자)
   ├─ ui/                    # button.ts, panel9.ts, hud.ts, hexagon.ts, banner.ts (캔버스 위젯)
   ├─ audio/                 # pitchAudio.ts, sfxMap.ts (P4 완료)
   └─ __tests__/             # vitest: physics, shot, keeper 확률, storage, entryMode
scripts/convert-pitch-art.mjs, scripts/pitch-art-manifest.json     # A1에서 작성
src/web/assets/pitch/**       # 변환 결과 webp
public/sfxes/pitch-*.mp3, public/pitch-bgm-*.mp3
```

- `characters.ts`의 id/이름/포지션/테마색은 `world/data/worldCast.ts`·`cursorCatalog.ts`를 **참고만** 하고 값은 피치 쪽에 하드코딩한다(월드 모듈 import 금지 → 월드 코드와 결합 방지). 우왁굳은 `position: "감독"` → 스탯 축은 `MGR` 자리표시자.

## 9. 폴백/오류 처리
- 캔버스 2D 컨텍스트 획득 실패, `boot` 로딩 실패, 예외로 루프 중단 시 → `goDashboard()` 자동 폴백 + 상단 토스트("피치를 불러오지 못해 대시보드로 이동했어요").
- 화면 우상단 대시보드 버튼은 **모든 씬에서 항상 보인다**(락커룸·선택창 포함, 오버레이 중에는 ESC/뒤로).
- 저장소 접근 불가(프라이빗 모드 등): 세션 동안 메모리 값 사용(**P7 구현**: `storage.ts` 의 `pitchRead/pitchWrite` — `localStorage` 접근·쓰기가 예외를 던지면 모듈 변수 Map 에 보관하고, 쓰기가 다시 성공하면 Map 항목을 지운다. `localStorage` 객체 자체가 없는 환경(ReferenceError)은 폴백 대상이 아님. 대상 키 4종: entry-mode · character · settings · stats).
- **폴백 토스트(P7 구현)**: 폴백 시 `entryNotice.ts` 의 `setEntryNotice("피치를 불러오지 못해 대시보드로 이동했어요")` 를 남기고 `goDashboard()` 한다. `App` 이 마운트 때 `consumeEntryNotice()` 로 한 번 읽어 기존 `useToast` 로 표시한다. 발동 조건: 2D 컨텍스트 실패 · boot 에셋 실패 · `update/render` 예외 · **캔버스 `contextlost` 이벤트** · `PitchEntry` 청크 로드/렌더 예외(`PitchBoundary`). 사용자가 직접 대시보드 버튼을 누른 경우는 토스트 없음.
- **대시보드 prefetch(§4-2)는 구현하지 않음**: `loadSnapshot()` 이 고정 픽스처를 돌려주므로(네트워크 없음) 예열할 것이 없다. 실시간 수집을 재개하면 로딩 완료 2초 뒤 `requestIdleCallback` 에서 호출하도록 추가.

## 10. 리스크

| 리스크 | 대응 |
| --- | --- |
| AI 이미지 일관성(12명 × 8시트) | 우왁굳 파일럿 선승인, 레이아웃 샘플 첨부, 스레드 분리([09](09-image-generation-runbook.md)) |
| 측면 달리기 발 겹침 등 월드에서 겪은 문제 재발 | 러닝북에 검수 게이트 내장, 변환 QA 리포트 |
| Galmuri11이 외부 CDN(jsDelivr)에 의존 | P1에서 출처 확인·선로딩 구현(§3-4b), CDN 불가 시 monospace 폴백, 자체 호스팅은 P7 검토 |
| 게임 밸런스(선방률) | Monte Carlo 테스트로 목표 선방률 표 검증([02 §6](02-gameplay-spec.md)) |
| 모바일 미지원 | 열린 결정 #1 확정(P8): 터치 기기는 항상 대시보드, 피치 복귀 버튼 숨김, 터치 컨트롤은 만들지 않음 |
| 대시보드 분리 시 기존 딥링크/캡처 페이지 회귀 | P1 DoD에 `?view=`, `?totyCapture` 회귀 테스트 |
