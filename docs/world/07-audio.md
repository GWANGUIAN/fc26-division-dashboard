# 07. 오디오 — BGM·효과음 목록과 검색 키워드

잔디동 월드에 필요한 **BGM 14곡, 신규 효과음 53개(+앰비언스 옵션 9), 재사용할 기존 파일**을 정리한다. 각 항목에 **저장 파일명 / 저장 위치 / 길이 / 루프 / 한글·영어 검색 키워드**가 있어서, 검색해서 받은 파일을 이름만 바꿔 넣으면 구현이 자동으로 연결한다(기존 `docs/soccer-sum10-minigame-assets.md`와 같은 방식). 오디오 시스템 설계는 [01 §9](01-concept-and-architecture.md#9-오디오-설계), 체크리스트 통합본은 [09](09-asset-checklist.md).

## 0. 규칙

| 항목 | 규칙 |
| --- | --- |
| 형식 | `mp3`(44.1kHz). BGM 128kbps 이하 스테레오, SFX 96~128kbps 모노/스테레오 |
| BGM 위치 | `public/world-bgm-<이름>.mp3` (기존 BGM 관례: `public/` 루트) |
| SFX 위치 | `public/sfxes/world-<분류>-<이름>.mp3` (기존 `soccer-sum10-*` 관례) |
| BGM 길이 | **끊김 없이 반복되는 60~120초 무보컬 루프** 권장(`soccer-sum10-bgm.mp3`가 참고 사례, 약 2.3MB). 개별 ≤ 2.5MB |
| SFX 길이 | 대부분 0.1~1.5초. 팡파르/징글은 2~4초, 앰비언스는 10~30초 루프 |
| 음량 | BGM 약 -16 LUFS, SFX 최대 피크 -3dB. 시작/끝 무음 제거, BGM은 시작·끝이 자연스럽게 이어지도록 편집 |
| 신규 총량 | 약 25MB 이내(기존 BGM 5.8MB 등을 고려해 과도한 용량 방지) |
| 라이선스 | 다운로드한 **각 파일의 라이선스를 그 페이지에서 확인**하고 아래 표의 "출처/라이선스" 칸에 기록. CC‑BY는 출처 표기 필요 → 게임 메뉴 "크레딧" 화면에 표시. 상업적 이용 가능 여부 확인 |
| 추천 사이트 | Pixabay(Sound Effects·Music), Mixkit, freesound.org(파일별 CC0/CC‑BY 확인), OpenGameArt(CC0/CC‑BY), Kenney(UI/Impact Audio, CC0), YouTube 오디오 라이브러리, 공유마당(gongu.copyright.or.kr), incompetech |
| 앰비언스 | 지구 진입 시 BGM 아래에 낮은 볼륨(BGM의 40%)으로 깔린다 |

표의 **P**는 우선순위(P0=1차 구현에 필요, P1=콘텐츠 완성, P2=여력이 되면). `[ ]`는 진행 체크용.

> **S3 연결 상태**: S23(줍기)·S24(택배)·S25~S28(미션 수락/목표 달성/완료/조각)·S29(조각 10개)·S40(체크포인트)와 킥·골·포스트·콘 접촉·카운트·시간 초과·짧은 휘슬·배지·UI 오류음이 코드에 연결돼 있다(`audio/worldAudio.ts`의 `SFX_FILES`). 파일이 없으면 무음이다.

## 1. BGM (14곡)

| # | 파일명 | 용도 | 무드/템포 | 한글 검색 키워드 | 영어 검색 키워드 | P | 출처/라이선스 | ✓ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| B1 | `world-bgm-title.mp3` | 타이틀·캐릭터 선택 | 서정적이고 설레는 도트 오프닝, 중간 템포 | `서정적 도트 게임 오프닝 BGM`, `설레는 RPG 타이틀 음악 루프` | `pixel rpg title screen music loop`, `hopeful chiptune adventure theme` | P0 | | [ ] |
| B2 | `world-bgm-field-lush.mp3` | 오버월드 낮(복원 진행도 5 이상) | 경쾌한 어쿠스틱+칩튠, 산책하는 느낌, 밝음 | `경쾌한 마을 필드 BGM 루프`, `평화로운 RPG 마을 음악` | `cheerful village overworld music loop`, `upbeat acoustic chiptune town theme` | P0 | | [ ] |
| B3 | `world-bgm-field-withered.mp3` | 오버월드 낮(진행도 5 미만, 시든 상태) | B2의 쓸쓸한 변주, 느리고 단조 | `쓸쓸한 마을 BGM 루프`, `황량한 RPG 필드 음악` | `melancholic village overworld music loop`, `sad slow pixel rpg field theme` | P0 | | [ ] |
| B4 | `world-bgm-interior.mp3` | 집·상점 실내 | 아늑하고 잔잔, 어쿠스틱 기타/피아노 | `아늑한 실내 BGM 루프`, `잔잔한 게임 집 안 음악` | `cozy indoor house music loop`, `calm rpg house theme piano guitar` | P0 | | [ ] |
| B5 | `world-bgm-arcade.mp3` | 지하 오락실 | 네온 신스/칩튠, 신나고 빠름 | `오락실 게임장 BGM`, `8비트 신나는 아케이드 음악` | `arcade room synthwave chiptune loop`, `retro arcade hall background music` | P0 | | [ ] |
| B6 | `world-bgm-stadium.mp3` | 스타디움 입장·결전 전 | 웅장하지만 절제, 관중 열기 | `웅장한 스타디움 입장 BGM`, `긴장감 있는 축구 경기장 음악` | `epic football stadium entrance music`, `tense sports arena orchestral loop` | P1 | | [ ] |
| B7 | `world-bgm-boss.mp3` | 제초왕 결전 | 긴박하고 코믹한 보스, 빠름 | `보스전 BGM 코믹 긴박`, `RPG 최종 보스 음악 루프` | `comic boss battle music chiptune loop`, `fast rpg final boss theme` | P1 | | [ ] |
| B8 | `world-bgm-ending.mp3` | 엔딩·단체샷 | 감동적이고 따뜻한 결말, 느림→밝게 | `감동적인 엔딩 BGM`, `따뜻한 게임 엔딩 음악` | `heartwarming game ending theme`, `emotional pixel rpg credits music` | P1 | | [ ] |
| B9 | `world-bgm-rush.mp3` | 잔디 러시 미니게임 | 질주감 있는 업비트 | `러닝 게임 BGM 빠른`, `러너 게임 신나는 음악 루프` | `endless runner game music loop upbeat`, `fast chiptune running theme` | P1 | | [ ] |
| B10 | `world-bgm-region-sky.mp3` | 구름 언덕·룬 언덕 | 몽환적, 하프/벨, 넓은 공간감 | `몽환적인 하늘 마을 BGM`, `신비로운 마법 탑 음악` | `dreamy sky castle music loop`, `mystical wizard tower ambient theme` | P2 | | [ ] |
| B11 | `world-bgm-region-spring.mp3` | 봄 정원 | 파스텔, 플루트·가벼운 리듬 | `봄 정원 벚꽃 BGM`, `귀여운 봄 마을 음악` | `cherry blossom spring garden music loop`, `cute pastel flute village theme` | P2 | | [ ] |
| B12 | `world-bgm-region-frost.mp3` | 달빛·서리 호수 | 고요한 겨울밤, 글로켄슈필·피아노 | `고요한 겨울 호수 BGM`, `별이 빛나는 밤 게임 음악` | `quiet frozen lake night music loop`, `starry night ice village piano theme` | P2 | | [ ] |
| B13 | `world-bgm-region-forge.mp3` | 번개·불꽃 공업지구 | 리드미컬한 산업/기타, 뜨거움 | `공업 지대 BGM 리드미컬`, `용암 대장간 게임 음악` | `industrial forge area music loop rhythmic`, `lava workshop rpg theme` | P2 | | [ ] |
| B14 | `world-bgm-region-weed.mp3` | 제초동 구역 | 삭막·기계적, 코믹한 위협 | `삭막한 공장 BGM 코믹`, `악당 기지 음악` | `villain factory theme comic menacing loop`, `industrial villain base music` | P2 | | [ ] |

- 지구 BGM(B10~B14)은 옵션이다. 없으면 오버월드 기본 BGM(B2/B3)을 그대로 쓴다.
- 필드 BGM 전환 규칙: 잔디 조각 5개 이상이면 B2, 미만이면 B3(1초 크로스페이드).
- **AI 작곡을 쓸 경우(선택)** 프롬프트 예시: B2 `Cheerful acoustic-guitar and chiptune village overworld loop, 110 BPM, major key, instrumental, seamless loop, 90 seconds`, B3 `Same melody as a slow, sparse, minor-key, lonely arrangement, 80 BPM, instrumental, loop`, B7 `Comic fast boss battle chiptune with brass stabs, 160 BPM, instrumental, loop`. 나머지는 위 "영어 검색 키워드"를 스타일 문구로 그대로 사용. AI 생성물은 서비스 약관의 상업 이용 조건 확인 필요.

## 2. 신규 효과음 (53개)

저장 위치는 모두 `public/sfxes/`. 파일명은 `world-<분류>-<이름>.mp3`.

### 2-1. UI (9)

| # | 파일명 | 용도 | 길이 | 한글 검색 키워드 | 영어 검색 키워드 | P |
| --- | --- | --- | --- | --- | --- | --- |
| S1 | `world-ui-move.mp3` | 메뉴/선택지 커서 이동 | 0.1s | `게임 메뉴 커서 이동 효과음` | `ui menu cursor move blip` | P0 |
| S2 | `world-ui-select.mp3` | 선택 확정 | 0.2s | `게임 선택 확인 효과음 도트` | `pixel ui confirm select sound` | P0 |
| S3 | `world-ui-cancel.mp3` | 취소/뒤로 | 0.2s | `게임 취소 효과음 짧은` | `ui cancel back blip` | P0 |
| S4 | `world-ui-open.mp3` | 메뉴/로그 열기 | 0.3s | `메뉴 열기 효과음 슥`, `페이지 넘기는 소리 게임` | `menu open whoosh ui`, `journal page open` | P0 |
| S5 | `world-ui-close.mp3` | 메뉴/로그 닫기 | 0.3s | `메뉴 닫기 효과음` | `menu close whoosh ui` | P0 |
| S6 | `world-ui-error.mp3` | 불가 동작 | 0.3s | `게임 불가 삑 소리` | `ui error denied blip` | P1 |
| S7 | `world-dialog-tick.mp3` | 대사 글자 출력 틱(짧게 반복) | 0.05s | `대화 텍스트 타이핑 소리 게임`, `동물의 숲 말소리` | `dialogue text blip typewriter game`, `rpg speech blip` | P0 |
| S8 | `world-dialog-next.mp3` | 대사 다음으로 | 0.15s | `대화창 넘김 효과음` | `dialogue advance click` | P0 |
| S9 | `world-dialog-open.mp3` | 대화 시작 | 0.3s | `대화 시작 효과음 띠링` | `dialogue start chime` | P1 |

### 2-2. 이동·충돌 (8)

| # | 파일명 | 용도 | 길이 | 한글 검색 키워드 | 영어 검색 키워드 | P |
| --- | --- | --- | --- | --- | --- | --- |
| S10 | `world-step-grass.mp3` | 잔디 발소리(1스텝) | 0.2s | `잔디 발소리 효과음`, `풀밭 걷는 소리` | `footstep grass single`, `walking on grass sfx` | P0 |
| S11 | `world-step-stone.mp3` | 돌/광장 발소리 | 0.2s | `돌바닥 발소리` | `footstep stone pavement single` | P0 |
| S12 | `world-step-wood.mp3` | 나무/실내 발소리 | 0.2s | `나무 바닥 발소리` | `footstep wood floor single` | P0 |
| S13 | `world-step-dirt.mp3` | 흙길 발소리 | 0.2s | `흙길 발소리` | `footstep dirt gravel single` | P1 |
| S14 | `world-step-snow.mp3` | 눈/얼음 발소리 | 0.25s | `눈 밟는 소리` | `footstep snow crunch single` | P1 |
| S15 | `world-step-metal.mp3` | 금속 바닥 발소리(공업지구) | 0.2s | `철판 발소리` | `footstep metal grate single` | P1 |
| S16 | `world-step-water.mp3` | 얕은 물 걷는 소리(호숫가) | 0.3s | `물 첨벙 발소리 얕은` | `footstep shallow water splash single` | P2 |
| S17 | `world-bump.mp3` | 벽/오브젝트 충돌 | 0.1s | `툭 부딪히는 소리 게임` | `soft bump thud ui` | P2 |

### 2-3. 문·상호작용·수집 (7)

| # | 파일명 | 용도 | 길이 | 한글 검색 키워드 | 영어 검색 키워드 | P |
| --- | --- | --- | --- | --- | --- | --- |
| S18 | `world-door-open.mp3` | 집 문 열림(씬 전환) | 0.5s | `문 열리는 소리 나무 짧게` | `wooden door open short` | P0 |
| S19 | `world-door-close.mp3` | 문 닫힘(입장/퇴장) | 0.4s | `문 닫히는 소리` | `door close soft` | P0 |
| S20 | `world-door-bell.mp3` | 편의점/카페 문종 | 0.8s | `가게 문 종소리 딸랑` | `shop door bell ding` | P1 |
| S21 | `world-interact-ping.mp3` | 상호작용 가능 표시(E 프롬프트 등장) | 0.15s | `상호작용 가능 띠링 짧은` | `interaction prompt ping small` | P1 |
| S22 | `world-examine.mp3` | 조사(표지판·가구) | 0.3s | `조사 효과음 반짝` | `examine inspect sparkle short` | P1 |
| S23 | `world-pickup.mp3` | 황금 축구공/랜턴 획득 | 0.6s | `아이템 획득 효과음 반짝 코인` | `item pickup sparkle chime` | P0 |
| S24 | `world-parcel-get.mp3` | 택배 수령 | 0.4s | `물건 받는 소리 포장 박스` | `pick up parcel box rustle` | P1 |

### 2-4. 미션·진행 (7)

| # | 파일명 | 용도 | 길이 | 한글 검색 키워드 | 영어 검색 키워드 | P |
| --- | --- | --- | --- | --- | --- | --- |
| S25 | `world-mission-accept.mp3` | 미션 수락 | 0.8s | `퀘스트 수락 효과음`, `임무 시작 띠링` | `quest accepted jingle short`, `mission start chime` | P0 |
| S26 | `world-mission-ready.mp3` | 조건 달성(머리 위 `!` 등장) | 0.6s | `퀘스트 목표 달성 알림음`, `업적 알림 띠링` | `quest objective complete notification chime` | P0 |
| S27 | `world-mission-complete.mp3` | 미션 완료 팡파르 | 2.5s | `퀘스트 완료 팡파르 짧은`, `게임 클리어 징글` | `quest complete fanfare short jingle`, `level clear jingle` | P0 |
| S28 | `world-shard-get.mp3` | 잔디 조각 획득 | 1.5s | `마법 수정 획득 효과음 반짝` | `crystal collected magic sparkle chime` | P0 |
| S29 | `world-shard-restore.mp3` | 조각 10개·황금 잔디 복원 | 4s | `웅장한 복원 마법 효과음 성장`, `자연 성장 반짝 풍성한` | `magical restoration swell nature growth`, `epic grow bloom sparkle` | P1 |
| S30 | `world-badge-get.mp3` | 뱃지/칭호 획득 | 1.2s | `업적 달성 효과음`, `뱃지 획득` | `achievement unlocked sound short`, `badge earned chime` | P1 |
| S31 | `world-stamp.mp3` | 출석 스탬프 찍기 | 0.4s | `도장 찍는 소리 쿵` | `rubber stamp thud` | P2 |

### 2-5. 볼·경기 (6)

| # | 파일명 | 용도 | 길이 | 한글 검색 키워드 | 영어 검색 키워드 | P |
| --- | --- | --- | --- | --- | --- | --- |
| S32 | `world-ball-kick.mp3` | 공 차기 | 0.3s | `축구공 킥 효과음 뻥`, `공 차는 소리` | `soccer ball kick thump`, `football kick sfx` | P0 |
| S33 | `world-ball-post.mp3` | 공이 골대 프레임에 맞음 | 0.4s | `골대 맞는 소리 쨍`, `크로스바 맞는 소리` | `football hits goalpost crossbar ping` | P1 |
| S34 | `world-ball-net.mp3` | 골망 흔들림 | 0.5s | `골망 흔들리는 소리 슉` | `soccer ball net swish` | P0 |
| S35 | `world-whistle-short.mp3` | 짧은 휘슬 | 0.4s | `호루라기 짧게 심판` | `referee whistle short blow` | P1 |
| S36 | `world-whistle-long.mp3` | 긴 휘슬(결전 시작/종료) | 1.2s | `심판 호루라기 길게 경기 종료` | `referee whistle long full time` | P1 |
| S37 | `world-crowd-roar.mp3` | 관중 함성(결전 승리) | 3s | `관중 함성 환호 경기장 짧은` | `stadium crowd roar cheer short` | P1 |

### 2-6. 타임트라이얼 (5)

| # | 파일명 | 용도 | 길이 | 한글 검색 키워드 | 영어 검색 키워드 | P |
| --- | --- | --- | --- | --- | --- | --- |
| S38 | `world-count-tick.mp3` | 카운트다운 틱 | 0.2s | `카운트다운 삑 게임` | `countdown beep tick game` | P1 |
| S39 | `world-count-go.mp3` | 시작(GO!) | 0.5s | `스타트 신호음 삐 하이톤` | `race start go beep high` | P1 |
| S40 | `world-checkpoint.mp3` | 체크포인트 통과 | 0.3s | `체크포인트 통과 효과음` | `checkpoint passed blip` | P1 |
| S41 | `world-cone-hit.mp3` | 콘 접촉(패널티) | 0.25s | `플라스틱 콘 쓰러지는 소리` | `plastic cone knocked bonk` | P1 |
| S42 | `world-timeup.mp3` | 시간 초과 | 0.8s | `시간 종료 삐익 실패 게임` | `time up fail buzzer short` | P1 |

### 2-7. 동물·연출 (5)

| # | 파일명 | 용도 | 길이 | 한글 검색 키워드 | 영어 검색 키워드 | P |
| --- | --- | --- | --- | --- | --- | --- |
| S43 | `world-cat-meow.mp3` | 잔디냥 조사 | 0.7s | `고양이 야옹 귀여운 짧게` | `cute cat meow short` | P2 |
| S44 | `world-dog-bark.mp3` | 공돌이 반응 | 0.5s | `강아지 짖는 소리 귀여운` | `small puppy bark cute` | P2 |
| S45 | `world-core-stop.mp3` | 제초 코어 정지(승리 연출) | 2.5s | `기계 전원 꺼지는 소리 파워다운` | `machine power down shutdown whirr` | P1 |
| S46 | `world-mower-rev.mp3` | 제초기 위협(제초동 구역·결전 컷) | 1.5s | `예초기 엔진 소리 부릉` | `lawn mower engine rev` | P2 |
| S47 | `world-grow.mp3` | 풀·꽃이 자라나는 소리(`grow-*` FX) | 1.5s | `식물 자라는 소리 효과음 뿅뿅` | `plant growing sprout bloom sfx` | P1 |

### 2-8. 잔디 러시 미니게임 (6)

| # | 파일명 | 용도 | 길이 | 한글 검색 키워드 | 영어 검색 키워드 | P |
| --- | --- | --- | --- | --- | --- | --- |
| S48 | `world-rush-jump.mp3` | 점프 | 0.2s | `점프 효과음 8비트 뿅` | `8-bit jump sfx` | P1 |
| S49 | `world-rush-slide.mp3` | 슬라이드 | 0.3s | `슬라이딩 슥 효과음` | `slide whoosh short` | P1 |
| S50 | `world-rush-hit.mp3` | 장애물 충돌 | 0.5s | `충돌 쿵 게임 오버 짧은` | `crash hit game over short` | P1 |
| S51 | `world-rush-collect.mp3` | 씨앗/공 획득 | 0.2s | `코인 획득 효과음` | `coin collect pickup blip` | P1 |
| S52 | `world-rush-boost.mp3` | 파워업(자석/방패) | 0.6s | `파워업 효과음 상승` | `power up rising chime` | P2 |
| S53 | `world-rush-gameover.mp3` | 러시 종료(기록 표시) | 1.5s | `게임 오버 징글 짧은` | `game over jingle short` | P2 |

### 2-9. 앰비언스 루프 (옵션 9)

앰비언스는 10~30초 **끊김 없는 루프**. 개수는 위 53개에 포함하지 않는 옵션 트랙이며 파일명 규칙은 `world-amb-<이름>.mp3`.

| # | 파일명 | 지구 | 한글 검색 키워드 | 영어 검색 키워드 | P |
| --- | --- | --- | --- | --- | --- |
| A1 | `world-amb-field-day.mp3` | 중앙·상점가 | `낮 새소리 바람 환경음 루프` | `daytime birds light wind ambience loop` | P1 |
| A2 | `world-amb-sky-wind.mp3` | 구름·룬 | `높은 곳 바람 소리 환경음` | `high altitude wind ambience loop` | P2 |
| A3 | `world-amb-spring.mp3` | 봄 정원 | `봄 정원 새소리 벌 소리` | `spring garden birds bees ambience loop` | P2 |
| A4 | `world-amb-frost-night.mp3` | 서리 호수 | `겨울밤 귀뚜라미 바람 환경음` | `winter night crickets wind ambience loop` | P2 |
| A5 | `world-amb-forge.mp3` | 공업지구 | `공장 소음 용광로 환경음` | `forge furnace factory hum ambience loop` | P2 |
| A6 | `world-amb-weed.mp3` | 제초동 | `공장 기계 소음 예초기 환경음` | `machine drone mower ambience loop` | P2 |
| A7 | `world-amb-water.mp3` | 호수 | `잔잔한 호수 물결 소리` | `lake water lapping ambience loop` | P2 |
| A8 | `world-amb-crowd.mp3` | 스타디움 실내 | `경기장 관중 웅성거림` | `stadium crowd murmur ambience loop` | P2 |
| A9 | `world-amb-arcade.mp3` | 오락실 | `오락실 게임 소리 환경음` | `arcade hall ambience beeps loop` | P2 |

## 3. 재사용할 기존 파일 (신규 제작 불필요)

`public/sfxes/`에 이미 있는 파일. 구현 시 `worldAudio.ts`의 이름 → URL 매핑에서 그대로 가리킨다.

| 월드 용도 | 기존 파일 | 비고 |
| --- | --- | --- |
| 버튼 클릭 | `/sfxes/button-click.mp3` | 플로팅 버튼·타이틀 버튼 |
| 버튼 호버 | `/sfxes/button-hover.mp3` | |
| 미션 로그 넘김 | `/sfxes/card-flip.mp3` | S4 대체 가능 |
| 카드 열람 연출 | `/sfxes/card-reveal.mp3` | 카드 미션 팝업은 기존 것 그대로 |
| 골 성공(킥 미션) | `/sfxes/goal.mp3` | S34와 겹치면 한쪽만 |
| 관중 환호 | `/sfxes/cheer.mp3` | S37 대체 가능 |
| 승리 | `/sfxes/card-match-victory..mp3` | 결전 승리 |
| 게임 오버 | `/sfxes/game-over.mp3` | |
| 공 튀김 | `/sfxes/ball-bounce.mp3` | 월드 볼 반사 |
| 킥오프 휘슬 | `/sfxes/soccer-sum10-start.mp3` | S35 대체 가능 |
| 종료 휘슬 | `/sfxes/soccer-sum10-timeup.mp3` | S36 대체 가능 |
| 성공 스윕 | `/sfxes/soccer-sum10-clear.mp3` | 체크포인트 대체 가능 |
| 실패 삑 | `/sfxes/soccer-sum10-invalid.mp3` | S6 대체 가능 |
| 전광판/네온 | `/sfxes/neon-sign-on.mp3`, `/sfxes/neon-sign-off.mp3`, `/sfxes/turn-on.mp3` | 오락실 전원/네온 |
| 미니게임 BGM | `/soccer-sum10-bgm.mp3`, `/background-mini-game.mp3`, `/fortune-bgm.mp3` | 각 게임 모달은 자체 BGM 유지(월드 BGM은 모달 열림 중 일시정지) |

### 멤버 음성 (첫 만남 인사 재생)
멤버 NPC와 **처음 대화**할 때 고유 음성을 한 번 재생한다. 파일은 이미 존재한다(`roster.yaml`의 `sfx`와 동일).

| id | 재생 파일 | 추가 사용 가능 |
| --- | --- | --- |
| `janine95kim` | `/sfxes/jaenin.mp3` | `jaenin-tongtongi.mp3`, `janine95kim-popup-open.mp3` |
| `bboringirl` | `/sfxes/bboringirl.mp3` | `bboringirl-2.mp3`, `-popup-open.mp3` |
| `sjh4018` | `/sfxes/pinggu.mp3` | `sjh4018-2.mp3`, `-popup-open.mp3` |
| `doormomo` | `/sfxes/doormomo.mp3` | `doormomo-2.mp3`, `-popup-open.mp3` |
| `hachi97` | `/sfxes/hachi.mp3` | `hachi-dugohachi.mp3`, `hachi97-popup-open.mp3` |
| `kaksjak0730` | `/sfxes/hangyeul.mp3` | `kaksjak0730-2.mp3`, `-popup-open.mp3` |
| `ju010228` | `/sfxes/jyumenge.mp3` | `ju010228-2.mp3`, `-popup-open.mp3` |
| `haepalin` | `/sfxes/haeparin.mp3` | `haepalin-2.mp3`, `-popup-open.mp3` |
| `tleod1818` | `/sfxes/bingming.mp3` | `tleod1818-2.mp3`, `-popup-open.mp3` |
| `tdnlamuron` | `/sfxes/dashiba.mp3` | `tdnlamuron-2.mp3`, `-popup-open.mp3` |
| `lina0108` | `/sfxes/linya.mp3` | `lina0108-2.mp3`, `-popup-open.mp3` |
| `woowakgood` | `/sfxes/woowakgood.mp3` | `woowakgood-popup-open.mp3` |

- 미션 완료(`complete` 노드) 시에는 `-2.mp3`(있으면)를 재생해 변화를 준다. 파일 유무는 구현 세션에서 `ls public/sfxes`로 다시 확인한다.
- 이 음성이 이미 [01 §7](01-concept-and-architecture.md#7-데이터-스키마-typescript-초안)의 `CastDef.voiceSfx`에 대응한다(파일 경로는 위 표가 기준, `<id>.mp3` 규칙이 아님에 주의).

## 4. 총계

| 구분 | 개수 | P0 | P1 | P2 |
| --- | --- | --- | --- | --- |
| BGM | 14 | 5 (B1~B5) | 4 (B6~B9) | 5 (B10~B14) |
| 신규 SFX | 53 (S1~S53) | 19 | 26 | 8 |
| 앰비언스(옵션) | 9 | 0 | 1 | 8 |

> 마스터 체크리스트([09](09-asset-checklist.md))는 이 표의 번호(B#, S#, A#)를 그대로 사용한다.

## 5. 크레딧 기록 양식

받은 파일마다 아래를 이 문서 표의 "출처/라이선스" 칸에 적고, 구현 세션에서 `public/world-credits.json`(또는 메뉴 크레딧 화면)으로 옮긴다.

`파일명 | 제목 | 제작자 | 사이트/URL | 라이선스(예: CC0, CC BY 4.0, Pixabay License) | 표기 필요 여부`

### S6 출처 감사 결과 (2026-09-19)

- 저장소에는 BGM 13/14, SFX 53/53, 앰비언스 9/9가 있으며 런타임 매핑·누락 파일 폴백은 자동 검사한다. `world-bgm-region-weed.mp3`만 실제로 없다.
- 내려받은 원본의 URL·제작자·라이선스 메타데이터는 저장소와 MP3 파일명에서 확인할 수 없었다. 파일명이나 추측으로 CC0/CC-BY를 선언하지 않는다.
- 따라서 오디오 출처 검증은 월드 UI와 별도로 이 문서에서 계속 관리한다. 각 파일의 위 양식 기록과 상업적 이용 가능 여부를 복원한 뒤에만 공개 오디오 크레딧을 확정한다.
