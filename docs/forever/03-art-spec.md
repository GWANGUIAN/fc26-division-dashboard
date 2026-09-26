# 03. 아트 스펙

## 1. 스타일 규칙 (모든 이미지 공통)

- 기존 피치와 **같은 게임**으로 보여야 한다: 16-bit 아케이드 스포츠 게임 픽셀 아트, 픽셀 블록 약 8px(1024px 캔버스 기준), 2px 다크 네이비 외곽선 `#0a0a1a`(순수 검정 금지), 4톤 셰이딩, 좌상단 시안-화이트 조명.
- 팔레트 기준: 클럽 컬러 민트 `#2ee8b6` · 화이트 · 골드 `#ffd23f` · 코랄 `#ff4d6d`. **포에버 전용 포인트 컬러**: 포탈 보라-파랑(`#6a5cff`~`#38c8ff`), 연합풍 파랑 `#2a5bd7` + 금색 장식.
- **후광/글로우 금지**(외곽선 바깥 발광, 헤일로 없음). 단, J1 셀 3(상호작용 글로우 외곽선)과 J8의 DING 버스트/빛기둥은 예외로 명시된 셀에서만 허용.
- **글자·숫자·로고 금지**(J2 로고 제외). 간판/플레이트는 비워서 그린다. 텍스트는 코드(Galmuri11)가 얹는다.
- 크로마키: 스프라이트 시트는 투명 PNG(가능하면) 또는 순수 `#FF00FF` 배경. 피사체에 마젠타/핫핑크 사용 금지(대신 코랄 `#ff4d6d`).
- 배경(J3, J4, J9)은 **완전 불투명 풀씬**, 마젠타 없음. 1536x1024로 생성 → **중앙 16:9 밴드**를 잘라 960x540. 중요한 내용(건물, 길, 오브젝트 자리)은 중앙 밴드(세로 약 216~808px) 안에 둔다.
- 저작권: 블리자드 로고·사자 문장·공식 캐릭터·정확한 건물 도면을 흉내내지 않는다. "중세 판타지 인간 왕국풍 / 오크 요새풍"의 **일반 묘사**로만 지시.
- **월드(`src/web/world/`) 이미지는 레퍼런스로 붙이지 않는다** (`docs/pitch/04 §0`).

## 2. 레퍼런스 앵커 (기존 승인본)

| 용도 | 파일 |
| --- | --- |
| 픽셀 크기·외곽선·팔레트·조명 (환경) | `tmp/pitch-src/env/env-pitch-bg.png` |
| 게이트 형제 시트 | `tmp/pitch-src/env/env-locker-gate.png` |
| 배경 풀씬 톤 | `tmp/pitch-src/env/env-locker-bg-v2.png`, `tmp/pitch-src/keyart/keyart-loading-bg.png` |
| 캐릭터 톤/크기 | `tmp/pitch-src/characters/` 의 승인된 캐릭터 시트 아무거나 (파일명은 실행 시 확인) |
| 펫/작은 몬스터 톤 | `tmp/pitch-src/pets/` 의 `murloc` 관련 PNG |
| UI 톤 | `tmp/pitch-src/ui/ui-hud-banners.png`, `ui-loader.png` |
| 로고 템플릿 | `docs/pitch/12-title-logo-prompt.md` |

> 파일이 없으면 세션 1 시작 시 `tmp/pitch-src/` 를 나열해 가장 가까운 승인본을 대신 붙이고 04 문서의 해당 항목 레퍼런스 줄을 고친다.

## 3. 시트별 그리드와 최종 슬롯

각 셀은 `Canvas 1536x1024`의 균등 그리드이며 셀당 1개, 셀 안쪽 여백 ≥10%.

| # | 시트 | 그리드 | 최종 파일(`src/web/assets/pitch/…`) | 논리 크기 |
| --- | --- | --- | --- | --- |
| J1 | env-forever-gate | 3x2 | `env/forever-gate-closed`, `-open`, `-glow`, `-arrow`(2프레임 중 1개 사용), `-plate` | 게이트 128x128, 화살표 24x32, 플레이트 64x24 |
| J2 | ui-forever-logo | 단일 3:1 (1536x512) | `ui/forever-logo` | 480x160 |
| J3 | env-forever-loading-bg | 풀씬 | `env/forever-loading-bg` | 960x540 |
| J4 | env-forever-hub-bg | 풀씬 | `env/forever-hub-bg` | 960x540 |
| J5 | forever-npc | 4x3 | `characters/forever-npc-<id>` (6종, **2프레임 가로 스트립** 192x96) — id: `questgiver` `streamer` `leroy` `innkeeper` `flightmaster` `guard` | 프레임 96x96 |
| J6 | env-forever-props | 4x2 | `env/forever-prop-<id>` 8종 — id: `mailbox`(48x64) `signboard`(80x80) `hearthstone`(64x80) `campfire`(64x64) `dummy`(64x88) `signpost`(64x80) `perch`(64x96) `barrels`(80x72) | 오브젝트별 |
| J7 | forever-mobs | 4x2 | `characters/forever-mob-<id>` 4종(`rabbit` 48x56 · `boar` 64x52 · `murloc` 56x56 · `kobold` 56x64), 2프레임 가로 스트립 | 48~64px |
| J8 | ui-forever-hud | 4x3 | `ui/forever-<id>` 12종 — `quest-available` `quest-complete` `quest-progress`(24x32) · `ding-burst`(128x128) · `quest-scroll`(360x240) · `cast-bar` `xp-bar`(240x80) · `toast`(240x120) · `chat`(320x160) · `slot`(64x64) · `ding-pillar`(96x128) · `coin`(32x32) | 마크 24~32px, 프레임 가변 |
| J9(옵션) | env-forever-orgrimmar-bg | 풀씬 | `env/forever-orgrimmar-bg` | 960x540 |
| J11 | env-forever-field-bg | 풀씬 | `env/forever-field-bg` | 960x540 |
| J12 | env-forever-portal | 3x2 | `env/forever-portal-field`(윗행), `env/forever-portal-town`(아랫행), 각 **3프레임 스트립 112x104** | 프레임 112x104 |
| J13 | ui-forever-letter | 2x2 | `ui/forever-letter`(400x230), `ui/forever-seal`(32x32), `ui/forever-mail-icon`·`ui/forever-mail-open-icon`(32x24) | 가변 |
| J14 | env-forever-props-2 | 4x2 | `env/forever-prop-mailbox-mail`(48x64) `-burrow`(64x40) `-stump`(56x48) `-boulder`(72x56) `-bush`(64x56) `-mushrooms`(48x40) `-fence`(80x48) `-warnsign`(48x72) | 오브젝트별 |
| J10(옵션) | forever-npc-2 | 4x3 | `characters/forever-npc2-<id>-a|b` | 96x96 |

- 원본 PNG 저장 위치는 `tmp/pitch-src/<카테고리>/` (gitignore됨, 커밋하지 않음).
- 변환: `pnpm convert:pitch-art -- <category> <sheet>`. 매니페스트 슬롯(세션 3 추가): env `forever-gate` `forever-loading-bg` `forever-hub-bg` `forever-props`, ui `forever-logo` `forever-hud`, characters `forever-npc` `forever-mobs` — 04의 변환 명령과 같다. J3/J4 배경은 원본이 이미 16:9(1672x941)라 크롭 없이 960x540로 축소된다.
- 예산(세션 3 실측): 그룹 `forever` 33개 파일 약 0.89MB, 디코딩 5.8MB (`locker` 0.84MB / 7.6MB). `assetBudget.test.ts`에서 ≤ 1MB, ≤ 6MB 디코딩으로 고정. 게이트 5개(약 82KB)는 `core`에 들어가 boot+core+캐릭터 ≤ 3MB 예산 안에 있다(2.2MB).
- 얇은 바·타일·구분선은 시트에서 늘어나 왜곡되므로 **두껍게** 요청한다(#117 관찰). 가는 캐스트 바/경험치 바는 프레임만 이미지, 채움은 코드로 그린다.
