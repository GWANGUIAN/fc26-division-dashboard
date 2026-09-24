# 06. 오디오 — BGM·효과음 목록과 검색 키워드

잔디동 피치에 필요한 **BGM 3곡, 신규 효과음 50개, 재사용 후보**를 정리한다. 각 항목에 **저장 파일명 / 저장 위치 / 길이 / 한글·영어 검색 키워드**가 있어 검색 사이트에서 바로 찾을 수 있다. 재생 구조는 [01 §6](01-concept-and-architecture.md#6-오디오-아키텍처), 재생 시점은 [02](02-gameplay-spec.md)·[03](03-screens-and-ui.md).

## 0. 규칙

| 항목 | 규칙 |
| --- | --- |
| 형식 | `mp3`(44.1kHz). BGM 128kbps 이하 스테레오, SFX 96~128kbps 모노/스테레오 |
| **SFX 위치** | `public/sfxes/pitch-<이름>.mp3` (기존 `public/sfxes/` 관례) |
| **BGM 위치** | `public/pitch-bgm-<이름>.mp3` (기존 BGM은 `public/` 루트) |
| BGM 길이 | 끊김 없는 **60~120초 무보컬 루프**, 개별 ≤ 2.5MB |
| SFX 길이 | 대부분 0.1~1.5초, 함성·징글 2~4초 |
| 음량 | BGM 약 −16 LUFS, SFX 피크 −3dB, 시작/끝 무음 제거. 연타되는 소리(발소리·틱)는 짧고 볼륨 낮게 |
| 신규 총량 | 약 12MB 이내 |
| **예약 파일** | **`victory.mp3`는 다른 기능 전용이라 사용 금지**(이름 재사용 금지, `pitch-` 접두사 신규 파일만) |
| 라이선스 | 다운로드한 **각 파일의 라이선스를 그 페이지에서 확인**하고 "출처/라이선스" 칸에 기록. CC-BY는 출처 표기 필요. 상업 이용 가능 여부 확인. AI 생성 오디오는 약관 확인 |
| 추천 사이트 | Pixabay(Sound Effects·Music), Mixkit, freesound.org(CC0/CC-BY 확인), OpenGameArt, Kenney(CC0), YouTube 오디오 라이브러리, 공유마당 |
| 기록 형식 | `파일명 \| 제목 \| 제작자 \| URL \| 라이선스 \| 표기 필요` (아래 §5 표에 누적) |

표의 **P**: P0=1차 구현에 필요(P4까지), P1=콘텐츠 완성(P5~P6), P2=여력이 되면. `✓`는 확보 체크.

## 1. BGM (3곡)

| # | 파일명 | 용도 | 무드/템포 | 한글 검색 키워드 | 영어 검색 키워드 | P | 출처/라이선스 | ✓ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| B1 | `pitch-bgm-loading.mp3` | 로딩 화면 | 기대감 있는 16비트 아케이드 인트로, 중간 템포 | `16비트 아케이드 축구 게임 BGM`, `레트로 스포츠 게임 타이틀 음악 루프` | `16-bit arcade sports game title music loop`, `retro football game intro chiptune` | P0 | | [x] |
| B2 | `pitch-bgm-pitch.mp3` | 피치(플레이) | 경쾌하고 에너지 넘치는 아케이드 스포츠, 빠른 템포 | `신나는 레트로 축구 게임 배경음악`, `아케이드 스포츠 BGM 루프` | `upbeat arcade soccer game music loop`, `retro sports chiptune energetic 16-bit` | P0 | | [x] |
| B3 | `pitch-bgm-locker.mp3` | 락커룸·스탯 화면 | 차분한 라운지풍 일렉트로닉, 느린 템포 | `차분한 게임 메뉴 BGM 루프`, `락커룸 분위기 로파이 게임 음악` | `calm locker room lounge game music loop`, `mellow synth menu music 16-bit` | P1 | | [x] |

## 2. 신규 효과음 (50개)

### 2-1. UI / 로딩 / 전환

| # | 파일명 | 용도 | 길이 | 한글 검색 키워드 | 영어 검색 키워드 | P |
| --- | --- | --- | --- | --- | --- | --- |
| S1 | `pitch-ui-hover.mp3` | 버튼 hover | 0.1s | `게임 UI 호버 소리`, `아케이드 메뉴 틱` | `arcade ui hover tick`, `menu hover blip 8-bit` | P0 |
| S2 | `pitch-ui-click.mp3` | 버튼 클릭 | 0.2s | `게임 UI 클릭 소리`, `레트로 버튼 클릭` | `arcade ui click`, `retro button press blip` | P0 |
| S3 | `pitch-ui-select.mp3` | 캐릭터 확정 | 0.6s | `캐릭터 선택 확정음`, `격투 게임 선택 소리` | `character select confirm arcade`, `fighting game select sound` | P1 |
| S4 | `pitch-ui-cursor.mp3` | 선택 커서 이동 | 0.1s | `메뉴 커서 이동음`, `레트로 커서 틱` | `menu cursor move blip`, `retro cursor tick` | P1 |
| S5 | `pitch-ui-back.mp3` | 취소/닫기 | 0.3s | `메뉴 취소 소리`, `뒤로가기 효과음` | `menu cancel back sound`, `ui back blip` | P1 |
| S6 | `pitch-load-complete.mp3` | 로딩 완료 | 0.8s | `로딩 완료 소리`, `게임 시작 준비 징글` | `loading complete jingle arcade`, `ready confirm chime` | P0 |
| S7 | `pitch-transition-wipe.mp3` | 씬 와이프 전환 | 0.4s | `화면 전환 휙 소리`, `게임 트랜지션 스윕` | `screen wipe transition swoosh game`, `arcade transition whoosh` | P1 |
| S8 | `pitch-mode-switch.mp3` | 대시보드 전환 | 0.5s | `화면 넘어가는 소리`, `UI 페이지 전환 팝` | `mode switch ui whoosh`, `page transition pop` | P1 |

### 2-2. 이동 / 볼 터치 / 드리블

| # | 파일명 | 용도 | 길이 | 한글 검색 키워드 | 영어 검색 키워드 | P |
| --- | --- | --- | --- | --- | --- | --- |
| S9 | `pitch-step-grass-a.mp3` | 달리기 발소리 A | 0.15s | `잔디 발소리`, `축구장 달리기 소리` | `running on grass footstep`, `football pitch footstep` | P0 |
| S10 | `pitch-step-grass-b.mp3` | 달리기 발소리 B(변주) | 0.15s | `잔디 발소리 2` | `grass footstep variation` | P0 |
| S11 | `pitch-sprint-start.mp3` | 스프린트 시작 | 0.3s | `스프린트 시작 소리`, `대시 스피드업` | `sprint burst whoosh`, `dash speed up short` | P1 |
| S12 | `pitch-ball-touch.mp3` | 드리블 볼 터치 | 0.12s | `축구공 터치 소리`, `볼 드리블 톡` | `soccer ball dribble touch`, `light ball tap` | P0 |
| S13 | `pitch-ball-trap.mp3` | 볼 트래핑(재소유) | 0.25s | `축구공 트래핑`, `볼 잡는 소리` | `soccer ball trap control`, `ball stop thud` | P0 |
| S14 | `pitch-ball-loose.mp3` | 볼 놓침/굴러감 | 0.6s | `굴러가는 축구공`, `공 굴러가는 소리` | `soccer ball rolling on grass`, `ball roll loop short` | P1 |
| S15 | `pitch-ball-out.mp3` | 볼 아웃/리셋 | 0.5s | `공 아웃 소리`, `호루라기 짧게` | `ball out of play short whistle`, `reset blip` | P1 |

### 2-3. 슛 (조준 · 게이지 · 킥)

| # | 파일명 | 용도 | 길이 | 한글 검색 키워드 | 영어 검색 키워드 | P |
| --- | --- | --- | --- | --- | --- | --- |
| S16 | `pitch-aim-start.mp3` | 조준 시작 | 0.3s | `조준 시작 소리`, `락온 시작음` | `aim start lock-on beep`, `targeting activate blip` | P0 |
| S17 | `pitch-aim-tick.mp3` | 조준 화살표 틱(루프용) | 0.08s | `조준 틱 소리`, `레이더 스윕 틱` | `aiming sweep tick`, `radar ping tick 8-bit` | P0 |
| S18 | `pitch-aim-lock.mp3` | 조준 확정 | 0.25s | `조준 확정 소리`, `락온 완료` | `aim lock confirm`, `target locked blip` | P0 |
| S19 | `pitch-power-charge.mp3` | 파워 게이지 상승(루프) | 1.8s | `게이지 충전 소리`, `파워 차징 상승음` | `power charge rising loop`, `charge meter fill sfx` | P0 |
| S20 | `pitch-power-lock.mp3` | 파워 확정 | 0.25s | `파워 확정 타격음` | `power lock confirm hit`, `charge release blip` | P0 |
| S21 | `pitch-power-sweet.mp3` | 스윗스팟 성공 | 0.6s | `퍼펙트 판정 소리`, `크리티컬 성공음` | `perfect hit chime`, `critical success sparkle` | P0 |
| S22 | `pitch-kick-soft.mp3` | 킥(약) | 0.3s | `약한 킥 소리`, `축구공 살짝 차는 소리` | `soft soccer ball kick`, `gentle ball pass` | P0 |
| S23 | `pitch-kick-mid.mp3` | 킥(중) | 0.35s | `축구 슛 킥 소리`, `공 차는 소리` | `soccer ball kick`, `football shot thud` | P0 |
| S24 | `pitch-kick-hard.mp3` | 킥(강) | 0.45s | `강한 슛 소리`, `대포알 슛` | `powerful soccer shot kick`, `hard ball strike` | P0 |
| S25 | `pitch-too-far.mp3` | 슛 불가(TOO FAR) | 0.3s | `불가 삐 소리`, `오류음 짧게` | `error buzz short arcade`, `denied blip` | P0 |

### 2-4. 개인기 / 스타일

| # | 파일명 | 용도 | 길이 | 한글 검색 키워드 | 영어 검색 키워드 | P |
| --- | --- | --- | --- | --- | --- | --- |
| S26 | `pitch-skill-stepover.mp3` | 스텝오버 | 0.35s | `빠른 휙 소리`, `발 스윕 효과음` | `quick swoosh footwork`, `fast foot swish` | P0 |
| S27 | `pitch-skill-roulette.mp3` | 룰렛(회전) | 0.45s | `회전 스핀 휙`, `빙글 도는 소리` | `spin whoosh turn`, `body spin swish` | P0 |
| S28 | `pitch-skill-rainbow.mp3` | 레인보우 플릭 | 0.6s | `점프 휙 스파클`, `공중 플립 소리` | `jump flick whoosh sparkle`, `aerial flip sfx` | P0 |
| S29 | `pitch-skill-elastico.mp3` | 엘라스티코 | 0.45s | `연속 휙휙 페이크`, `빠른 스윕 2연속` | `double swish fake`, `quick sweep pair` | P0 |
| S30 | `pitch-style-gain.mp3` | 스타일 게이지 상승 | 0.3s | `게이지 충전 반짝`, `콤보 상승음` | `combo meter up blip`, `style gain sparkle` | P0 |
| S31 | `pitch-style-tier.mp3` | Tier 달성 | 0.7s | `콤보 단계 달성`, `레벨업 짧은 징글` | `combo tier up jingle`, `power up short chime` | P1 |

### 2-5. 골 / 선방 / 결과

| # | 파일명 | 용도 | 길이 | 한글 검색 키워드 | 영어 검색 키워드 | P |
| --- | --- | --- | --- | --- | --- | --- |
| S32 | `pitch-net-hit.mp3` | 네트에 꽂힘 | 0.7s | `골네트 출렁 소리`, `그물에 공 맞는 소리` | `soccer ball hits net`, `goal net swish` | P0 |
| S33 | `pitch-goal-cheer.mp3` | GOAL 함성 | 3s | `관중 골 함성`, `축구장 환호` | `stadium goal cheer crowd roar`, `soccer crowd celebration` | P0 |
| S34 | `pitch-goal-horn.mp3` | 골 사이렌/뿔피리 | 1.5s | `골 사이렌`, `경기장 에어혼` | `goal horn stadium air horn`, `goal siren arcade` | P1 |
| S35 | `pitch-save-glove.mp3` | 캐치(글러브) | 0.4s | `골키퍼 캐치 소리`, `글러브에 공 잡히는 소리` | `goalkeeper catch glove smack`, `ball caught in gloves` | P0 |
| S36 | `pitch-save-punch.mp3` | 펀칭 | 0.4s | `골키퍼 펀치 소리`, `공을 쳐내는 소리` | `goalkeeper punch ball clear`, `fist ball thump` | P0 |
| S37 | `pitch-save-deflect.mp3` | 발/손끝 쳐내기 | 0.4s | `발로 막는 소리`, `손끝 굴절 소리` | `goalkeeper deflect save thud`, `ball parry` | P0 |
| S38 | `pitch-save-groan.mp3` | 선방 관중 탄식 | 2s | `관중 아쉬운 탄식`, `아 하는 함성` | `crowd groan disappointed oh`, `near miss crowd ooh` | P0 |
| S39 | `pitch-post-hit.mp3` | 골포스트 | 0.6s | `골포스트 맞는 소리`, `쇠 울리는 땡` | `soccer ball hits goalpost ping`, `metal post clang` | P0 |
| S40 | `pitch-bar-hit.mp3` | 크로스바 | 0.6s | `크로스바 맞는 소리` | `ball hits crossbar bang`, `crossbar clang` | P0 |
| S41 | `pitch-miss-whoosh.mp3` | MISS(빗나감) | 0.8s | `공 빗나가는 소리`, `휙 지나가는 소리` | `ball flies past miss whoosh`, `shot wide crowd sigh` | P0 |
| S42 | `pitch-whistle-short.mp3` | 리셋 짧은 휘슬 | 0.4s | `심판 호루라기 짧게`, `축구 휘슬` | `referee whistle short`, `soccer whistle blow` | P1 |
| S43 | `pitch-banner-in.mp3` | 결과 배너 등장 | 0.5s | `배너 등장 스윕`, `스포츠 그래픽 전환` | `sports banner slide in whoosh`, `broadcast graphic stinger` | P1 |
| S44 | `pitch-celebrate.mp3` | 세리머니 스팅 | 1.5s | `승리 세리머니 효과음`, `경쾌한 팡파르 짧게` | `short victory fanfare arcade`, `celebration sting` | P1 |

### 2-6. 골키퍼 다이브 / 락커룸 / 스탯

| # | 파일명 | 용도 | 길이 | 한글 검색 키워드 | 영어 검색 키워드 | P |
| --- | --- | --- | --- | --- | --- | --- |
| S45 | `pitch-keeper-dive.mp3` | 골키퍼 다이브 | 0.5s | `골키퍼 다이빙 소리`, `몸 던지는 소리` | `goalkeeper dive slide grass`, `body dive thud` | P0 |
| S46 | `pitch-gate-open.mp3` | 락커룸 문 열림 | 0.8s | `철문 열리는 소리`, `터널 문 열림` | `heavy metal door open`, `locker room door open` | P1 |
| S47 | `pitch-gate-close.mp3` | 락커룸 문 닫힘 | 0.8s | `철문 닫히는 소리` | `heavy metal door close`, `door slam` | P1 |
| S48 | `pitch-stat-on.mp3` | 스탯 분석기 켜짐 | 1s | `전자기기 켜지는 소리`, `터미널 부팅음` | `terminal power on sci-fi`, `computer boot up short` | P1 |
| S49 | `pitch-stat-select.mp3` | 육각형 축 선택 | 0.15s | `선택 틱 소리`, `레이더 노드 선택` | `node select tick`, `hologram select blip` | P1 |
| S50 | `pitch-stat-soon.mp3` | COMING SOON 안내 | 0.6s | `준비 중 알림음`, `부드러운 알림` | `coming soon notification chime`, `soft locked feature blip` | P1 |

## 3. 재사용 후보 (기존 파일, 신규 확보 전 임시 사용)

신규 파일이 오기 전까지 코드에서 **폴백**으로 아래 기존 SFX를 가리킬 수 있다(누락 파일은 무음이 기본이므로 필수는 아님). 확정 후에는 `pitch-` 신규 파일로 교체한다. **`victory.mp3`는 절대 연결하지 않는다.**

| 신규 항목 | 임시 재사용 후보(`public/sfxes/…`) |
| --- | --- |
| S2 클릭 / S1 hover | `button-click.mp3` / `button-hover.mp3` |
| S23·S24 킥 | `world-ball-kick.mp3` |
| S32 네트 | `world-ball-net.mp3` |
| S39·S40 포스트/바 | `world-ball-post.mp3` |
| S33 골 함성 | `goal.mp3`, `cheer.mp3`, `world-crowd-roar.mp3` |
| S42 휘슬 | `world-whistle-short.mp3` |
| S12·S13 터치 | `ball-bounce.mp3` |

## 3-1. 코드 연결과 확보 현황 (P4 시점)

코드는 `pitch/audio/sfxMap.ts` 의 이벤트 이름 = 이 문서 파일명에서 `pitch-`·`.mp3` 를 뺀 것(예 `pitch-kick-mid.mp3` → `kick-mid`)이고, 후보의 **첫 항목이 항상 이 문서의 파일명**이다(`sfxMap.test.ts` 가 이 문서 표를 읽어 50개 전부 대조). 파일이 없으면 §3 재사용 후보, 그것도 없으면 무음.

**`public/` 확보 상태(P4 시점 실측)**: BGM 3/3 (B1·B2·B3 존재). SFX 44/50 존재 + 이름이 틀린 1개.

| # | 파일 | 상태 | 코드 동작 |
| --- | --- | --- | --- |
| S17 | `pitch-aim-tick.mp3` | **없음(P0)** | 조준 화살표가 방향을 바꿀 때마다 재생하는 틱 — 파일이 오면 자동으로 켜짐(현재 무음) |
| S41 | `pitch-miss-whoosh.mp3` | **이름 오타**: 실제 파일은 `pitch-miss-whoos.mp3` | 코드가 두 철자를 모두 찾으므로 지금도 재생됨. 파일 이름을 `whoosh` 로 고치면 깔끔(고쳐도 코드 변경 없음) |
| S14 | `pitch-ball-loose.mp3` | 없음(P1) | 드리블 중 볼을 놓칠 때 — 무음 |
| S34 | `pitch-goal-horn.mp3` | 없음(P1) | **P7 연결 완료**: 스윗스팟 골에서 `goal-cheer`·`celebrate` 와 함께 재생 — 파일이 오면 자동으로 켜짐(현재 무음) |
| S48 | `pitch-stat-on.mp3` | 없음(P1) | **P6 연결 완료**: 스탯 화면이 열릴 때 재생 — 파일이 오면 자동으로 켜짐(현재 무음) |
| S50 | `pitch-stat-soon.mp3` | 없음(P1) | **P6 연결 완료**: 스탯 설명 패널의 빈 곳을 클릭할 때 — 파일이 오면 자동으로 켜짐(현재 무음) |

**P4 가 재생 시점에 연결한 이벤트**(나머지 — `gate-*`·`stat-*`·`transition-wipe` 등 — 는 이름만 준비돼 있었고 P5·P6 가 씬에서 호출 — P6: `gate-open`(게이트 진입·락커룸 출구)·`gate-close`(락커룸 입장)·`transition-wipe`(두 전환)·`stat-on`·`stat-select`·`stat-soon`, BGM `locker`):

| 시점 | 이벤트 |
| --- | --- |
| 달리기(발 접지 프레임 0·3 교대) · 드리블 터치(프레임 1·4) · 스프린트 시작 | `step-grass-a/b`(게인 0.35) · `ball-touch`(0.5) · `sprint-start` |
| 볼 소유 회복 · 놓침 · 아웃 | `ball-trap` · `ball-loose` · `ball-out` |
| 조준 시작 · 방향 전환 틱 · 조준 확정 | `aim-start` · `aim-tick`(0.4) · `aim-lock` |
| 파워 상승(루프 → 킥/취소 때 `stopSfx`) · 킥 · 스윗스팟 | `power-charge` · `power-lock` + `kick-soft/mid/hard`(파워 <40 / <78 / 그 이상) · `power-sweet` |
| 조준·파워 취소(Esc·타임아웃) · TOO FAR | `ui-back` · `too-far` |
| 개인기 Z X C V · 획득 · Tier 넘김 | `skill-stepover/roulette/rainbow/elastico` · `style-gain`(0.7) · `style-tier` |
| 키퍼 다이브(반응 지연 뒤) | `keeper-dive` |
| 결과 | 전부 `banner-in` + GOAL `net-hit`·`goal-cheer`(+`celebrate`) / SAVE `save-glove·punch·deflect`+`save-groan` / POST `post-hit`+약한 `save-groan` / BAR `bar-hit`+약한 `save-groan` / MISS `miss-whoosh` |
| 캐릭터 선택창(P5) | 열기·확정 `ui-select` · 커서 이동 `ui-cursor` · 취소·로딩 실패 `ui-back` · 카드/버튼 클릭 `ui-click` · 버튼 hover `ui-hover` · 대시보드 `mode-switch` |
| UI | hover `ui-hover`(0.5) · 대시보드 `mode-switch` · 소리 켤 때 `ui-click` · 로딩 완료 `load-complete` |
| BGM | 로딩 `loading` → 피치 `pitch`(1s 크로스페이드, 첫 입력 후) |

- 소리 버튼/M = `sfxOn`·`musicOn` 동시 토글(P2)을 오디오 매니저가 즉시 따른다(`setSettings`). 별도 볼륨 UI 는 없고 `sfxVolume`(0.8)·`musicVolume`(0.5)은 저장된 값을 그대로 쓴다(설정 화면 = 백로그 B5).
- **P0 목록 점검**: `S17 aim-tick` 만 P0 인데 없음. 나머지 P0 SFX 31개와 BGM B1·B2 는 존재.

## 4. 총계

| 구분 | 개수 |
| --- | --- |
| BGM | 3 |
| 신규 SFX | **50** (P0 32 / P1 18 / P2 0) |
| 재사용 후보 | 7군 |

## 5. 출처/라이선스 기록 (확보하면 채움)

| 파일명 | 제목 | 제작자 | URL | 라이선스 | 표기 필요 |
| --- | --- | --- | --- | --- | --- |
| (예) `pitch-kick-mid.mp3` | | | | | |

> 이미 `public/` 에 들어온 파일(BGM 3 + SFX 44)의 출처/라이선스는 아직 이 표에 기록되지 않았다 — 확보한 사용자가 채울 것(P7 크레딧 판단에 필요).
>
> CC-BY 등 표기가 필요한 파일이 생기면 피치 화면 설정/크레딧에 표시하는 항목을 P7 체크리스트에 추가한다.
