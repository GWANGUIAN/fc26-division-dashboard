# 06. 오디오 — 잔디 포에버 BGM·효과음 목록과 검색 키워드

잔디 포에버에 필요한 **BGM 2곡, 신규 효과음 22개, 재사용 후보**를 정리한다. 형식은 `docs/pitch/06-audio.md`와 같고, 코드 쪽 규칙(`src/web/pitch/audio/sfxMap.ts`)을 그대로 따른다. **파일이 없으면 무음(또는 재사용 후보)으로 재생**되므로, 파일 확보는 구현과 독립적으로 진행해도 된다.

## 0. 규칙

| 항목 | 규칙 |
| --- | --- |
| 형식 | `mp3`(44.1kHz). BGM 128kbps 이하 스테레오, SFX 96~128kbps 모노/스테레오 |
| **SFX 저장 위치** | `public/sfxes/pitch-forever-<이름>.mp3` |
| **BGM 저장 위치** | `public/pitch-bgm-forever*.mp3` (`public/` 루트, 기존 `pitch-bgm-*.mp3` 관례) |
| **코드 id** | `PitchSfxId` 에 `forever-<이름>` 으로 추가(파일 `pitch-forever-<이름>.mp3` ↔ id `forever-<이름>`, sfxMap 의 기존 "파일명에서 `pitch-`와 `.mp3` 제거" 규칙) |
| BGM 길이 | 끊김 없는 **60~120초 무보컬 루프**, 개별 ≤ 2.5MB |
| SFX 길이 | 대부분 0.1~1.5초, 팡파르·징글 1.5~3초 |
| 음량 | BGM 약 −16 LUFS, SFX 피크 −3dB, 시작/끝 무음 제거 |
| 신규 총량 | 약 8MB 이내 |
| **예약 파일** | **`victory.mp3`(및 `pitch-victory*`)는 다른 기능 전용이라 사용 금지.** sfxMap 테스트가 강제한다 |
| **저작권** | **와우/블리자드 원본 음원·효과음·음성 대사를 쓰지 않는다**(추출·리핑·유튜브 클립 포함). 분위기가 비슷한 **저작권 프리 일반 소스**를 검색해서 쓴다. 검색어에 "warcraft", "wow"를 넣지 말 것(원본이 나옴) |
| 라이선스 | 다운로드한 **각 파일의 라이선스를 그 페이지에서 확인**하고 §4 표에 기록. CC-BY는 출처 표기 필요, 상업 이용 가능 여부 확인. AI 생성 오디오는 약관 확인 |
| 추천 사이트 | Pixabay(Sound Effects·Music), Mixkit, freesound.org(CC0/CC-BY 확인), OpenGameArt, Kenney(CC0), YouTube 오디오 라이브러리, 공유마당 |

표의 **P**: P0=1차 구현에 필요(세션 4), P1=콘텐츠 완성, P2=여력이 되면. `✓`는 확보 체크. **재사용**은 파일이 없을 때 sfxMap 후보 목록에 뒤에 붙일 기존 파일(기존 `pitch-*` 또는 `public/sfxes/` 파일).

## 1. BGM (2곡)

| # | 파일명 | 용도 | 무드/템포 | 한글 검색 키워드 | 영어 검색 키워드 | P | ✓ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| FB1 | `pitch-bgm-forever.mp3` | 스톰피치 성문 광장(맵) | 따뜻한 중세 판타지 마을, 플루트·류트·하프 중심 포크, 느긋한 중간 템포 | `중세 판타지 마을 BGM 루프`, `RPG 마을 음악 어쿠스틱`, `판타지 음유시인 류트` | `medieval fantasy village music loop`, `RPG town theme acoustic lute flute`, `peaceful fantasy tavern music` | P0 | [x] |
| FB2 | `pitch-bgm-forever-loading.mp3` | 잔디 포에버 로딩 화면 | 웅장하고 신비로운 오케스트라 타이틀풍(호른·현·합창 패드), 느린 템포 | `판타지 게임 타이틀 오케스트라`, `웅장한 RPG 로딩 음악`, `신비로운 포탈 음악` | `epic fantasy title screen orchestral loop`, `mysterious portal ambient orchestral`, `fantasy game loading theme` | P1 | [x] |

- FB2가 없으면 기존 `pitch-bgm-loading.mp3`(로딩 BGM)를 그대로 쓴다. FB1이 없으면 BGM은 무음.
- 코드: `PitchBgmId`에 `"forever" | "forever-loading"` 추가, `BGM_FILES`에 `/pitch-bgm-forever.mp3`, `/pitch-bgm-forever-loading.mp3`.

## 2. 신규 효과음 (22개)

### 2-1. 게이트 / 전환 / 존

| # | 파일명 | 용도 | 길이 | 한글 검색 키워드 | 영어 검색 키워드 | 재사용(폴백) | P | ✓ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F1 | `pitch-forever-portal-enter.mp3` | 게이트 E 입장 시 마법 포탈 빨려 들어가는 소리 | 1.2s | `마법 포탈 입장 소리`, `차원문 워프`, `순간이동 휙` | `magic portal enter whoosh`, `dimensional warp teleport`, `fantasy portal open` | `pitch-gate-open` | P0 | [x] |
| F2 | `pitch-forever-portal-hum.mp3` | 게이트 근접 시 은은한 포탈 웅웅(루프, 낮은 볼륨) | 2.0s 루프 | `마법 웅웅 앰비언트`, `에너지 험 루프` | `magic portal hum loop`, `arcane energy ambient loop` | (없음, 무음) | P2 | [x] |
| F3 | `pitch-forever-zone-enter.mp3` | 존 진입 배너 "잔디 포에버 — 엘윈 잔디숲" | 2.0s | `판타지 지역 진입 알림`, `부드러운 호른 징글` | `fantasy zone discovered chime`, `area entered horn soft fanfare` | `pitch-banner-in` | P0 | [x] |

### 2-2. 퀘스트 / 레벨업 / 업적

| # | 파일명 | 용도 | 길이 | 한글 검색 키워드 | 영어 검색 키워드 | 재사용(폴백) | P | ✓ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F4 | `pitch-forever-quest-accept.mp3` | 퀘스트 수락 (두루마리 펼침 + 짧은 금속 종) | 0.8s | `퀘스트 수락 소리`, `두루마리 펼치는 소리 종`, `RPG 퀘스트 받기` | `quest accept sound rpg`, `scroll unroll bell`, `quest received chime` | `pitch-ui-select` | P0 | [x] |
| F5 | `pitch-forever-quest-complete.mp3` | 퀘스트 완료 (짧은 팡파르) | 1.6s | `퀘스트 완료 팡파르`, `RPG 미션 클리어 징글`, `보상 획득 소리` | `quest complete fanfare short rpg`, `mission accomplished jingle`, `reward received chime` | `pitch-style-tier` | P0 | [x] |
| F6 | `pitch-forever-quest-progress.mp3` | 퀘스트 진행(토끼 처치 카운트 +1) | 0.3s | `퀘스트 진행 알림 톡`, `아이템 획득 소리 짧게` | `quest progress blip`, `objective updated ping` | `pitch-style-gain` | P0 | [x] |
| F7 | `pitch-forever-ding.mp3` | **DING! 레벨업** (트럼펫 짧게 + 벨 한 번, 시원한 상승음) | 1.6s | `레벨업 효과음`, `레벨 업 팡파르 짧게`, `RPG 레벨업 벨소리` | `level up sound effect rpg`, `level up fanfare short bell`, `ding level up chime` | `pitch-style-tier` | P0 | [x] |
| F8 | `pitch-forever-achievement.mp3` | 업적 토스트 (부드러운 상승 차임) | 2.0s | `업적 달성 소리`, `트로피 획득 차임` | `achievement unlocked chime`, `trophy earned soft fanfare` | `pitch-style-tier` | P1 | [x] |

### 2-3. 귀환석 캐스팅

| # | 파일명 | 용도 | 길이 | 한글 검색 키워드 | 영어 검색 키워드 | 재사용(폴백) | P | ✓ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F9 | `pitch-forever-cast-loop.mp3` | 캐스트 바 진행 중 마법 시전(5초 동안 반복 재생) | 2.5s 루프 | `마법 시전 소리 루프`, `주문 캐스팅 차징`, `마력 모으는 소리` | `spell casting loop magic charge`, `magic channeling sound loop` | `pitch-power-charge` | P0 | [x] |
| F10 | `pitch-forever-cast-cancel.mp3` | 캐스트 취소("시전이 취소되었습니다") | 0.5s | `마법 취소 소리`, `주문 실패 피식`, `스펠 피즐` | `spell fizzle cancel`, `magic fail fizzle short` | `pitch-ui-back` | P0 | [x] |
| F11 | `pitch-forever-cast-complete.mp3` | 캐스트 완료, 귀환 텔레포트 | 1.2s | `순간이동 마법 완료`, `텔레포트 휙 반짝`, `귀환 마법 소리` | `teleport spell complete whoosh sparkle`, `recall teleport sfx fantasy` | `pitch-transition-wipe` | P0 | [x] |

### 2-4. NPC / 몬스터 / 소품

| # | 파일명 | 용도 | 길이 | 한글 검색 키워드 | 영어 검색 키워드 | 재사용(폴백) | P | ✓ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F12 | `pitch-forever-npc-greet.mp3` | NPC 말 걸 때 짧은 "흠?"/헛기침 대체 UI 소리 | 0.4s | `NPC 대화 시작 소리`, `대화창 열림 팝`, `RPG 다이얼로그 오픈` | `npc dialogue open blip`, `rpg conversation start pop` | `pitch-ui-click` | P0 | [x] |
| F13 | `pitch-forever-leroy-charge.mp3` | 리로이 잔킨스 돌진 함성 (남성 전투 함성, **원본 밈 음성 사용 금지** — 일반 함성 소스나 직접 녹음) | 1.8s | `남자 돌격 함성`, `전투 함성 외침`, `용감한 전사 외침` | `male battle cry charge shout`, `warrior yell charge`, `berserker war cry` | (없음, 무음) | P1 | [x] |
| F14 | `pitch-forever-murloc.mp3` | 멀록 "음르글글글" 계열 (물 속에서 웅얼거리는 어인 소리, **원작 음성 금지**) | 1.0s | `물고기 인간 웅얼거림`, `괴물 꾸르륵 소리`, `어인 몬스터 소리` | `fish creature gurgle monster`, `amphibian gurgling voice`, `swamp creature babble` | (없음, 무음) | P1 | [x] |
| F15 | `pitch-forever-rabbit-hit.mp3` | 토끼 처치 (짧은 찍 + 퍽) | 0.35s | `작은 동물 찍 소리`, `쥐 비명 짧게`, `타격 퍽` | `small animal squeak hit`, `critter squeak thud short` | `pitch-ball-touch` | P0 | [x] |
| F16 | `pitch-forever-mob-defeat.mp3` | 몬스터 처치 일반 (팝 + 반짝) | 0.5s | `몬스터 처치 소리`, `적 쓰러짐 팝 반짝` | `enemy defeat pop sparkle`, `monster dies puff` | `pitch-ball-trap` | P1 | [x] |
| F17 | `pitch-forever-griffin.mp3` | 그리핀 조련사 이동 (날갯짓 + 독수리 울음) | 1.8s | `독수리 날갯짓 울음`, `날개 펄럭 새 울음`, `하늘 비행 소리` | `eagle screech wing flap fly`, `griffin flight cry`, `large bird takeoff wing flaps` | `pitch-transition-wipe` | P1 | [x] |
| F18 | `pitch-forever-mailbox.mp3` | 우편함 열림 (금속 뚜껑 + 종이) | 0.5s | `우체통 여는 소리`, `금속 뚜껑 열림 종이` | `mailbox open metal lid paper`, `letter box creak` | `pitch-ui-click` | P2 | [x] |
| F19 | `pitch-forever-dummy-hit.mp3` | 허수아비 타격 (짚 퍽 + 나무) | 0.35s | `허수아비 때리는 소리`, `짚 나무 타격` | `training dummy hit straw wood thud`, `wooden target strike` | `pitch-net-hit` | P2 | [x] |
| F20 | `pitch-forever-coin.mp3` | 코인/보상 획득 | 0.4s | `동전 획득 소리`, `골드 줍는 소리` | `gold coin pickup`, `coins clink reward` | `pitch-style-gain` | P2 | [x] |

### 2-5. 채팅 / UI

| # | 파일명 | 용도 | 길이 | 한글 검색 키워드 | 영어 검색 키워드 | 재사용(폴백) | P | ✓ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F21 | `pitch-forever-chat.mp3` | 하단 채팅 새 줄 (아주 작은 팝, 반복 재생이라 낮은 볼륨) | 0.1s | `채팅 알림 톡`, `메시지 도착 짧게` | `chat message pop short`, `notification blip quiet` | (없음, 무음) | P2 | [x] |
| F22 | `pitch-forever-popup-open.mp3` | 퀘스트 두루마리 팝업 열림 | 0.4s | `두루마리 팝업 열림`, `종이 펼침 UI` | `parchment popup open`, `paper unfold ui` | `pitch-ui-select` | P1 | [x] |

## 3. 코드 연결 규칙 (세션 4·5)

- `PitchSfxId`에 `forever-portal-enter | forever-portal-hum | forever-zone-enter | forever-quest-accept | forever-quest-complete | forever-quest-progress | forever-ding | forever-achievement | forever-cast-loop | forever-cast-cancel | forever-cast-complete | forever-npc-greet | forever-leroy-charge | forever-murloc | forever-rabbit-hit | forever-mob-defeat | forever-griffin | forever-mailbox | forever-dummy-hit | forever-coin | forever-chat | forever-popup-open` 을 추가한다.
- `SFX_CANDIDATES` 각 항목: `[sfx("pitch-forever-<이름>"), sfx("<재사용 폴백>")]`. 재사용이 "(없음)"이면 자기 파일 하나만.
- `SFX_GAIN`: `forever-chat` 0.4, `forever-portal-hum` 0.3, `forever-cast-loop` 0.6 (반복/배경 성격은 낮게).
- **`victory` 계열 파일은 후보에 절대 넣지 않는다.** `sfxMap.test.ts`가 이를 검사하므로 그대로 통과해야 한다.
- 진입 연출은 `forever-portal-enter` → (없으면 `pitch-gate-open`) 후 `transition-wipe` 순서. 기존 `gate-open` 은 락커룸 진입에 그대로 쓴다.
- `allSfxFiles()` 결과에 신규 파일이 포함되는지 `sfxMap.test.ts` 케이스를 추가한다.

## 4. 출처/라이선스 기록 (확보하면 이 표에 누적)

`파일명 | 제목 | 제작자 | URL | 라이선스 | 표기 필요`

| 파일명 | 제목 | 제작자 | URL | 라이선스 | 표기 필요 |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

## 5. 확보 우선순위 (1차)

파일이 없어도 게임은 동작한다. **P0(F1, F3~F7, F9~F12, F15 + BGM FB1)** 만 있어도 체감이 크고, 그중 가장 먼저 F7 **DING**, F4/F5 퀘스트, F9~F11 귀환석 3종을 확보한다. 그다음 P1(F8, F13, F14, F16, F17, F22, FB2), 마지막에 P2(F2, F18~F21).
