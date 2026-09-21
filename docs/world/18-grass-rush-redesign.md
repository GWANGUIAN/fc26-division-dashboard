# 18. 잔디 러시 개선안 — 게임 UI로 다시 만들기

오락실·제초 공장의 미니게임 **잔디 러시** 모달을 게시판·도감([17](17-daily-board-codex-redesign.md))처럼 **월드 안 UI**로 다시 만든 기록이자 **추가 이미지 생성 요청서**다. 상태: **코드 구현 완료(2026-09-21), 화면 확인은 개발 서버에서 시작 창·HUD·결과 창까지 확인**. 새 이미지 1장은 선택 사항이고, 없어도 지금 있는 에셋과 CSS로 화면이 정상이다. 스타일 바이블은 [04 §1](04-art-characters.md#1-스타일-바이블-모든-이미지-공통), UI 규격은 [06 §0](06-art-ui.md#0-ui-규격)을 따른다.

## 0. 한눈에 보기

| 항목 | 내용 |
| --- | --- |
| 핵심 문제 | ① 스테이지 **밖**에서 실제 픽셀로 그린 웹 카드(24px 제목·둥근 웹 버튼·회색 안내 문장)라 게임 화면과 따로 놂 ② 거리·씨앗·점수가 **캔버스에 굵은 산세리프 한 줄**로만 그려짐 ③ 시작 화면이 없고 버튼을 누르면 곧바로 장애물이 옴 ④ 결과는 글 한 줄, 랭크·신기록·뱃지 진행이 안 보임 |
| 방향 | 640×360 캔버스가 **스테이지를 꽉 채우고**, 그 위에 게임 에셋 프레임의 HUD와 창을 DOM으로 얹는다. 시작 창 → 3·2·1 → 달리기 → 결과 창 |
| 새 이미지 | **1장(선택)**: `ui-rush-kit`(랭크 메달 8 + 카운트 판 + 신기록 판) |
| 폴백 | 새 이미지가 없으면 랭크는 이름 칩만, 카운트다운은 큰 글자만, 신기록은 반짝이는 글자만 나온다. 파일이 생기면 **코드 수정 없이** 자동으로 쓴다 |

## 1. 진단 (이전 화면)

코드: 옛 `arcade/GrassRushModal.tsx`(`RepeatPanel` 안에 캔버스와 버튼). 이번에 `RepeatPanel`을 더는 안 쓴다(`ui/RepeatPanel.tsx`·`repeat-content.css`는 남겨 두었지만 쓰는 곳이 없다).

| # | 문제 | 원인 |
| --- | --- | --- |
| 1 | 게임 UI 같지 않음 | `WorldModals`가 스테이지 밖(실제 픽셀)에 그림. 메뉴·미션 로그와 프레임·색이 다름 |
| 2 | HUD가 밋밋함 | 캔버스에 `18px bold sans-serif`로 `123m · 씨앗 5 · 150점`을 한 줄로 그림 |
| 3 | 시작·재도전 흐름이 거침 | "시작" 버튼을 누르면 카운트 없이 바로 달림, 죽으면 글 한 줄과 버튼 |
| 4 | 랭크·기록 정보가 묻힘 | 최고 기록·랭크가 긴 문장 안에 있고, 다음 랭크까지 얼마 남았는지·러시 1000m 뱃지 진행이 없음 |
| 5 | 화면이 다시 뜨면 깜빡임 | 달리기 상태가 바뀔 때마다 이미지 8장을 새로 만들어 로드함 |

## 2. 구현 결과

파일: [`arcade/GrassRushModal.tsx`](../../src/web/world/arcade/GrassRushModal.tsx), [`arcade/grass-rush.css`](../../src/web/world/arcade/grass-rush.css). 엔진(`GrassRushEngine.ts`)은 그대로다.

### 2-1. 화면 흐름

| 단계 | 화면 |
| --- | --- |
| 시작 | 캔버스(배경·잔디·캐릭터) 위에 **`panel-frame` 창**: 제목 + `mi-rush`, 조작 설명(키캡 + 씨앗 아이콘), **기록 칸**(최고 m·랭크 칩·다음 랭크 목표·`bd-rush-1000` 뱃지 실루엣), `btn-primary` "시작" |
| 카운트 | 큰 **3 · 2 · 1 → GO!**(`count-tick`·`count-go` 효과음). 이 동안 게임은 멈춰 있다 |
| 달리기 | 좌상단 **거리 칩**, 우상단 **씨앗×n·점수 칩**(둘 다 `tooltip-frame`, 황금 공 카운터와 같은 판), 상단 가운데 **다음 랭크 게이지**(`loading-bar-frame` + 채움, 그 아래 "다음 랭크 · 상현급 600m"), 좌하단 키캡 힌트 |
| 게임 오버 | 화면이 붉게 번쩍이고 캔버스가 흔들린 뒤(0.45초 후) **결과 창**: `toast-frame` 리본 "게임 종료", 큰 거리, **신기록!**(`sparkle-ring`), 씨앗·점수, 랭크 칩·"다음 랭크까지 n m", 뱃지 획득 표시, "다시 도전"/"닫기" |

- 게이지는 지금 달리는 거리 기준이다. 300m를 넘으면 라벨이 "상현급 600m"로 바뀌고 게이지가 300→600 구간으로 다시 채워진다(`state/ranks.ts` `nextRankGoal`). 최고 랭크에서는 "최고 랭크!".
- 신기록은 **달리기를 시작할 때의 최고 기록**과 비교한다(결과가 저장되면 `best`가 바로 갱신되므로).

### 2-2. 조작

| 키 | 동작 |
| --- | --- |
| **Space / ↑ / W** | 점프(달리는 중), **E / Enter / Space** = 시작·다시 도전 |
| **↓ / S** | 슬라이드 |
| **Esc** | 닫기(오버레이가 처리) |

- 키를 누르고 있어도(자동 반복) 한 번만 동작한다.
- **게임 오버 직후 0.6초**는 다시 도전 키를 무시한다(죽는 순간 누르던 점프 키로 바로 재시작되는 것을 막음).
- 시작·카운트·결과 창에서는 Space·화살표가 페이지를 스크롤하지 않는다.

### 2-3. 그 밖의 변경

| 파일 | 변경 |
| --- | --- |
| `WorldOverlay.tsx`·`ui/WorldModals.tsx` | 러시를 스테이지 안(미션 로그·게시판·도감 옆)에서 그림. `WorldModals`는 이제 프리킥·카드 팝업 같은 웹 미니게임만 담당 |
| `state/ranks.ts` | `nextRankGoal`(다음 랭크·목표 점수·게이지 시작점) |
| 결전 1라운드 목표 | 별개 작업: 80→70(`e74cf16`)에 맞춰 `npcDialogue.test.ts`와 문서 02·08·README의 수치를 70점으로 고침 |

## 3. 지금 있는 에셋 사용처

| 에셋 | 어디에 |
| --- | --- |
| `ui/panel-frame` | 시작·결과 창 바깥 틀 |
| `ui/tooltip-frame` | 거리 칩, 씨앗·점수 칩 |
| `ui/loading-bar-frame` | 다음 랭크 게이지 틀 |
| `ui/toast-frame` | 결과 창 리본 |
| `ui/btn-primary-*`, `ui/btn-secondary-*` | 시작·다시 도전 / 닫기 |
| `ui/mi-rush`, `ui/bd-rush-1000`, `rush/seed`, `ui/sparkle-ring` | 제목 아이콘, 뱃지 진행, 씨앗 표시, 신기록 반짝임 |
| `rush/bg-*`·`ground`·장애물·`characters/<id>-atlas` | 캔버스(기존 그대로) |
| 효과음 `rush-jump/slide/hit/collect/gameover`, `count-tick/go`, `ui-select/close` | 기존 SFX 재사용, 새 파일 없음 |

`rush/` 폴더에는 아직 게임에 나오지 않는 `hurdle`·`puddle`·`sprinkler`·`magnet`·`shield`·`goldball`·`tackler-low`가 있다(엔진이 만들지 않음). 이번 개선 범위 밖이다.

## 4. 이미지 생성 요청서

> 생성 위치·흐름은 [17 §4](17-daily-board-codex-redesign.md#4-이미지-생성-요청서)와 같다: 원본을 `tmp/world-src/ui/`에 아래 **파일명 그대로** 저장 → `pnpm convert:world-art -- ui rush-kit` → `src/web/assets/world/ui/`에 WebP가 생기면 코드가 자동으로 집는다. 배경은 **투명 또는 #FF00FF**. 프롬프트에 레퍼런스를 **다시 첨부**한다.

| # | 저장 파일 | 캔버스 | 최종 에셋(px) | 우선순위 | 첨부 레퍼런스 | 변환 |
| --- | --- | --- | --- | --- | --- | --- |
| ① | `ui-rush-kit.png` | 1536×1024 (5×2, 칸당 307×512) | `rush-rank-0`~`rush-rank-7`(32×32), `rush-count-plate`(96×96), `rush-newbest`(96×32) | P1 (없어도 됨) | `ui-icons-mission.png`(둥근 판 아이콘), `ui-badges.png`(금속·월계관 톤), `ui-title-kit.png`(금 칸 장식) | `pnpm convert:world-art -- ui rush-kit` |

새 채팅에 [17의 공통 머리말](17-daily-board-codex-redesign.md#4-이미지-생성-요청서)을 첫 메시지로 붙이고 시작한다(이미 열려 있는 스레드가 있으면 이어서).

### 4-1. `ui-rush-kit.png` — 랭크 메달 8 + 카운트 판 + 신기록 판

칸 순서(왼→오, 위→아래): 1) `rush-rank-0` 2) `rush-rank-1` 3) `rush-rank-2` 4) `rush-rank-3` 5) `rush-rank-4` / 6) `rush-rank-5` 7) `rush-rank-6` 8) `rush-rank-7` 9) `rush-count-plate` 10) `rush-newbest`.

랭크 이름과 뜻(`state/ranks.ts` `RANKS`): 입구컷 → 합격 불투명 → 합격 조건 충족 → 상현급 → 에이스급 → 반장급 → 운영급 → 회장. **오를수록 금속과 장식이 좋아지는 8단**이다.

```text
Using the attached mission icons, achievement badges and title-kit gold ornaments as exact style references, create one sheet on a 1536x1024 canvas: a strict grid of 5 columns x 2 rows (10 cells, each about 307x512), exactly one element per cell, centred, on a flat #FF00FF magenta background, no cell borders or grid lines, at least 12% empty margin inside each cell, no text, letters or numbers anywhere.
Elements 1 to 8 are a rank-medal ladder for an endless-runner game, each a small round medal about 32x32-pixel-style with a dark teal rim, all the same round size and the same viewing angle, each clearly better than the previous one so the eight read as one rising series:
1) rank 0: a dull grey-brown stone token, cracked, no ornament,
2) rank 1: a pale copper coin, plain, faint shine,
3) rank 2: a bronze medal with a small green check mark,
4) rank 3: a silver medal with one mint-green gem in the centre,
5) rank 4: a gold medal with one big four-point star,
6) rank 5: a gold medal with a laurel wreath around a star,
7) rank 6: a gold medal with a ruby gem and a small crown on top,
8) rank 7: the finest one: a grand golden crest with a crown, a sprouting green seedling, laurel wings and tiny sparkles, richer than all the others but still the same round size.
9) countdown plate: a round dark teal (#052720) plate about 96x96-pixel-style with a mint (#00e9ae) rim and one small gold diamond at each of the four compass points, perfectly symmetrical, the centre EMPTY and calm (a big number is drawn there by code),
10) new-record plate: a wide small plate about 96x32-pixel-style, a gold four-point starburst behind a slim dark teal ribbon, perfectly symmetrical left-right, the centre of the ribbon EMPTY (text is drawn by code).
No text anywhere. Crisp pixel outlines, no blur, no glow outside the drawn shapes.
```

- **검수**: 메달 8장이 **같은 지름·같은 시점**이고 위로 갈수록 확실히 좋아 보이는가 · 32px로 줄여도 0~2(회색·구리)와 3(은)·4(금)가 구분되는가 · 카운트 판·신기록 판 가운데가 비어 있는가 · 글자·숫자 없음 · 판 바깥으로 번지는 빛 없음.
- **변환 전 매니페스트**: `scripts/world-art-manifest.json` `ui.sheets.rush-kit`이 이미 있다(메달 8개 32×32, `rush-count-plate` 96×96, `rush-newbest` 96×32). 변환기가 원본 비율을 지키므로 결과 크기가 다르면 눈으로 확인한다(공 슬롯처럼 칸을 꽉 채워야 하면 슬롯에 `"fill": true`).
- **자동 반영**: `RankMedal`(`GrassRushModal.tsx`)이 `ui/rush-rank-0~7`을 시작 창·결과 창의 기록 칸에 32px로 그리고, 카운트다운은 `--count-plate`, 신기록은 `--burst`를 쓴다.
- **다른 화면에 재사용(선택)**: 같은 메달을 도감 기록 탭의 등급 칩에 붙일 수 있다(`.world-codex__rank` 앞).

## 5. 이미지 도착 후

1. 원본을 `tmp/world-src/ui/ui-rush-kit.png`로 저장 → `pnpm convert:world-art -- ui rush-kit`(QA 경고 확인).
2. 시작 창의 기록 칸(메달 32px + 이름 칩 + 뱃지)과 카운트 숫자가 판 가운데에 오는지 확인한다. 어긋나면 `grass-rush.css`의 `.world-rush__count--art span`(96px)·`.world-rush__medal`(32px)만 고친다.
3. [09 에셋 체크리스트](09-asset-checklist.md)에 체크하고, 크레딧의 "월드 전용 변환 에셋 N개"(`WorldCredits.tsx`, 손으로 관리하는 수치)를 늘어난 개수만큼 고친다.

## 6. 확인 체크리스트 (배포 후)

1. 오락실 5번 기계·제초 공장 컨베이어에서 러시를 열면 **월드 화면 안**에서 열리고 시작 창의 기록·랭크·뱃지 진행이 맞다. 공장 코스는 부제가 "제초 공장 코스"다.
2. Enter/Space/버튼으로 시작하면 3·2·1·GO! 뒤에 달리기가 시작되고 그 전에는 장애물이 오지 않는다.
3. 달리는 동안 거리·씨앗·점수가 갱신되고 게이지가 채워진다. 300m·600m를 넘으면 라벨이 바뀐다.
4. 죽으면 붉은 번쩍임 후 결과 창이 뜨고, 신기록이면 "신기록!"이 보이며, 죽는 순간 누르던 키로 바로 재시작되지 않는다.
5. 1000m를 넘으면 뱃지가 "획득"으로 바뀌고 기존처럼 미션·뱃지 토스트가 결과 창 위에 뜬다.
6. Esc·"닫기"로 닫히고 배경음이 월드 음악으로 돌아온다. 러시 결과가 도감 기록 탭·일일 과제("잔디 러시 300m")에 반영된다.
7. `prefers-reduced-motion`에서 번쩍임·흔들림·카운트 애니메이션이 없다.
