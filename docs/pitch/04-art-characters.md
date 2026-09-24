# 04. 캐릭터 아트 — 스타일 바이블, 애니메이션 세트, 시트 규격

> **생성 실행용 문서**: 프롬프트는 [09-image-generation-runbook.md](09-image-generation-runbook.md)에 이미지별로 풀어 들어 있다(스크립트 생성). 이 문서는 **스타일·규격·애니메이션 세트·캐릭터 특징의 원천**이다. 여기 §5 표를 고치면 `node docs/pitch/tools/build-image-runbook.mjs`로 09를 재생성한다.
> 환경·UI 시트 규격은 [05](05-art-world-and-ui.md), 화면 배치는 [03](03-screens-and-ui.md), 게임 규칙은 [02](02-gameplay-spec.md).

## 0. 잔디동 월드와 무엇이 다른가 (컨셉 분리 원칙)

피치 화면은 잔디동 월드(`docs/world/`)와 **시각적으로 다른 게임**처럼 보여야 한다. 월드의 에셋은 사용하지 않고, 아래 차이를 모든 프롬프트에 반영한다.

| 항목 | 잔디동 월드 (쓰지 않음) | **피치 (이 문서)** |
| --- | --- | --- |
| 장르 감성 | 32비트 JRPG, 스타듀밸리풍 | **16비트 아케이드 스포츠**(네오지오·슈퍼패미컴 축구 게임) |
| 비례 | 2.5등신 치비 | **4.5등신 운동선수 비례**(작은 머리, 긴 다리, 넓은 어깨) |
| 외곽선 | 1px 짙은 청록 `#16302e` | **2px 진한 네이비 `#0a0a1a`** 실루엣 전체를 감쌈 |
| 셰이딩 | 3단 셀 | **4단 + 딱 떨어지는 밝은 하이라이트 + 보라/파랑 그림자 램프** |
| 색감 | 따뜻하고 산뜻함 | **고채도 원색, 야간 경기장 조명**(림라이트 시안-화이트) |
| 시점 | 45° 탑다운 RPG | **35° 고각 방송 중계 시점**(공격 하프에서 골대 방향) |
| 포즈 | 정적, 걷기 | **역동적·과장된 액션**(예비동작·팔로스루 강조) |
| UI 언어 | 짙은 청록 패널 + 잎 장식 | **아케이드 스코어보드·LED·금속 프레임·네온** |
| 공유하는 것 | 클럽 정체성만: 민트+화이트 유니폼 | (동일) — 단, 유니폼 배색은 다르게(§1) |

## 1. 스타일 바이블 (모든 캐릭터·환경·UI 공통)

### 방향
- **16비트 아케이드 스포츠 픽셀 아트**: 90년대 네오지오/슈퍼패미컴 축구 게임의 감성에 현대적인 선명함. 픽셀 블록이 또렷하게 보이되(1024px 캔버스 기준 픽셀 블록 약 8px) 디테일은 충분.
- **운동선수 비례(약 4.5등신)**: 머리는 작고 다리가 길다. **치비 금지**. 손·발도 알아볼 수 있게 그린다.
- **굵은 진한 네이비 외곽선 2px**(순검정 `#000` 금지, `#0a0a1a`). 안티앨리어싱 번짐·부드러운 그라디언트·사진 질감·3D 렌더·회화적 붓터치 금지.
- **4단 셰이딩**: 베이스 / 하이라이트(면이 딱 떨어지는 밝은 색) / 그림자 / 딥 섀도우(보라·파랑 계열). 조명은 **좌상단 림라이트(시안-화이트)**.
- 글자·숫자·로고·워터마크 **절대 생성 금지**(텍스트는 캔버스에서 Galmuri11로 렌더). 등번호도 그리지 않는다.

### 팔레트 기준

| 용도 | 색 | 비고 |
| --- | --- | --- |
| 외곽선 | `#0a0a1a` | 진한 네이비 |
| 유니폼 민트(홈) | `#2ee8b6` (하이라이트 `#8dfbe0`, 그림자 `#12907a`, 딥 `#0b4f5c`) | 잔디동 정체성 |
| 유니폼 흰색 | `#f7f7ff` (그림자 `#b9b9e6`, 딥 `#6f6fb3`) | 슬리브 스트라이프·양말·부츠 |
| 반바지 | 진한 네이비 `#1b2050` | 월드(흰 반바지)와 구분 |
| 잔디 3톤 | `#4fd35a` / `#2e9e4a` / `#17693a` | 예초 줄무늬는 밝음/중간 교차 |
| 일렉트릭 시안 | `#2be4ff` | 림라이트·UI 하이라이트·조준선 |
| 아케이드 골드 | `#ffd23f` | 스코어·선택 강조·스윗스팟 |
| 코랄 레드 | `#ff4d6d` | 경고·실점·LED — **마젠타/핫핑크 금지**(크로마키 `#FF00FF`와 충돌) |
| UI 금속 | `#23264a` / `#3a3f7a` / `#6b74c9` | 패널·프레임 |
| LED 앰버 | `#ffb400` | 전광판 |
| 골키퍼 키트(AI 키퍼) | 네온 오렌지 `#ff7a1a` + 검정 | 슈터와 즉시 구분 |

### 유니폼 (홈 키트, 모든 필드 플레이어)
`the 잔디동 home kit: mint-green (#2ee8b6) short-sleeve football jersey with white shoulder-and-sleeve stripes and a small text-free white shield-with-sprout crest on the chest (no number), dark navy (#1b2050) shorts with a thin mint side stripe, white knee-high socks with a mint band, white football boots with mint soles.`

캐릭터별 예외는 §5 표의 `KIT` 열(재닌=GK 스타일 키트, 우왁굳=시그니처 헤드셋 유지 등).

## 2. 규격

- **캐릭터 셀: 96×96px**, 발끝 기준선 y=92, 가로 중앙 x=48. 선수 키 약 84px(머리 약 19px).
- 방향 3: **down(정면=카메라 쪽, 골대 반대)**, **side(우향, 좌향은 런타임 미러)**, **up(후면=골대 방향)**. 피치에서는 골대 위쪽이므로 `up`이 주 방향이다.
- 공(볼)은 캐릭터 시트에 그리지 않는다(캔버스 스프라이트). 캐릭터는 **볼 없이** 달리기·슛·개인기 동작만 그린다(임팩트 프레임에서 "공이 있을 위치"를 향해 발이 뻗음).
- 최종 아틀라스: `src/web/assets/pitch/characters/<id>-atlas.webp`, **960×960px = 10열×10행, 셀 96×96**(레이아웃 §4). 초상화: `portraits/<id>-<neutral|confident|celebrate|disappointed>.webp` 각 **192×192**. 히어로(선택 카드 큰 그림): `characters/<id>-hero.webp`(최대 384px 높이).

## 3. 애니메이션 세트 (필드 플레이어)

| 클립 | 프레임 | 방향 | 시트 | 설명 |
| --- | --- | --- | --- | --- |
| `idle` | 2 | down/side/up | ② idle | 볼 준비 자세, 무릎 살짝 굽힘, 호흡 2프레임 |
| `run` | 6 | down/side/up | ③ run | 접지L → 도약 → 통과R → 접지R → 도약 → 통과L. **걷기가 아닌 달리기**(상체 전경, 팔 90° 스윙, 도약 프레임에서 두 발이 지면에서 뜸) |
| `shoot` | 4 | down/side/up | ④ shoot | ①백스윙 ②디딤발 고정 ③임팩트(킥 다리 완전 신전) ④팔로스루 |
| `skill_stepover` | 4 | side/up | ⑤/⑥ | 발이 볼 위로 원을 그리는 스텝오버(Z) |
| `skill_roulette` | 4 | side/up | ⑤/⑥ | 볼을 굴리며 360° 회전(마르세유 턴, X) |
| `skill_rainbow` | 4 | side/up | ⑤/⑥ | 볼을 뒤꿈치로 머리 위로 넘기는 레인보우 플릭, 점프(C) |
| `skill_elastico` | 4 | side/up | ⑤/⑥ | 바깥→안쪽 페이크 엘라스티코(V) |
| `celebrate_a` | 4 | down | ⑦ emote | 팔 벌리고 달리는 골 세리머니 |
| `celebrate_b` | 4 | down | ⑦ emote | 무릎 슬라이드 + 주먹 |
| `disappointed` | 4 | down | ⑦ emote | 무릎 꿇고 머리 감싸기 |

- `down` 방향 개인기는 만들지 않는다(`side` 미러로 대체). 총 프레임 = idle 6 + run 18 + shoot 12 + skill 32 + emote 12 = **80프레임**.
- 좌향은 우향 프레임 미러. 비대칭 소품 캐릭터는 QA에서 별도 확인.

## 4. 시트 → 아틀라스 레이아웃

생성 시트(원본 `tmp/pitch-src/characters/char-<id>-<sheet>.png`)는 스크립트가 셀로 잘라 96×96로 정규화(발끝 정렬, 스탠드 키 기준 스케일)해 아틀라스에 배치한다.

| 시트 | 저장 이름 | 캔버스(권장) | 그리드 | 내용 |
| --- | --- | --- | --- | --- |
| ① `stand` | `char-<id>-stand.png` | 1024×1024 | 단일 | 정면 마스터. **유일한 정체성 기준**, 히어로 아트 원본 |
| ② `idle` | `char-<id>-idle.png` | 1024×1024 | 2열×3행 | 행: down / side / up, 열: 호흡 프레임 1·2 |
| ③ `run` | `char-<id>-run.png` | 1536×1024 | 6열×3행 | 행: down / side / up, 6프레임 |
| ④ `shoot` | `char-<id>-shoot.png` | 1536×1024 | 4열×3행 | 행: down / side / up, 4프레임 |
| ⑤ `skill-side` | `char-<id>-skill-side.png` | 1536×1024 | 4열×4행 | 행: 스텝오버/룰렛/레인보우/엘라스티코, 측면 |
| ⑥ `skill-up` | `char-<id>-skill-up.png` | 1536×1024 | 4열×4행 | 같은 4스킬, 후면 |
| ⑦ `emote` | `char-<id>-emote.png` | 1536×1024 | 4열×3행 | 행: celebrate_a / celebrate_b / disappointed |
| ⑧ `portrait` | `char-<id>-portrait.png` | 1024×1024 | 2×2 | neutral / confident / celebrate / disappointed |

**아틀라스 셀 배치(10열×10행 = 960×960)** — 좌표는 `src/web/pitch/data/animations.ts`가 유일한 진실이고 `pitch-art-manifest.json`이 같은 값을 쓴다:

| 행 | 셀 0~5 | 셀 6~9 |
| --- | --- | --- |
| 0 | idle-down 2, idle-side 2, idle-up 2 | (비움) |
| 1 | run-down 6 | shoot-down 4 |
| 2 | run-side 6 | shoot-side 4 |
| 3 | run-up 6 | shoot-up 4 |
| 4 | stepover-side 4, roulette-side 4 (셀 0~7) | (비움 8~9) |
| 5 | rainbow-side 4, elastico-side 4 (셀 0~7) | (비움 8~9) |
| 6 | stepover-up 4, roulette-up 4 (셀 0~7) | (비움 8~9) |
| 7 | rainbow-up 4, elastico-up 4 (셀 0~7) | (비움 8~9) |
| 8 | celebrate_a 4, celebrate_b 4 (셀 0~7) | (비움 8~9) |
| 9 | disappointed 4 (셀 0~3) | (비움) |

- **셀 좌표는 `src/web/pitch/data/animations.ts`(`CLIPS`)가 진실**이고 `scripts/pitch-art-manifest.json`의 `field.sheets[*].rows`가 같은 값을 쓴다(`animations.test.ts`가 일치를 검사). 표 셀 값 = (행, 열) 시작 위치, 프레임은 오른쪽으로 이어진다. A1 시점 fps: idle 2·run 12·shoot 16(비반복)·skill 12(레인보우 10, 비반복)·celebrate 8·disappointed 6.
- 캔버스 크기는 AI가 문서와 다르게 낼 수 있다(1254², 1672×941 등). 스크립트는 비례로 스케일한다. **그리드 개수(열×행)와 프레임 순서**만 지키면 된다.
- 알려진 함정([world 09 §10](../world/09-asset-checklist.md) 참고): 발끝 기준선 3px 초과 드리프트, 측면 달리기에서 발이 겹쳐 보임, stand와 다른 시트의 키/비례 불일치, 셀 밖으로 삐져나감.

## 5. 캐스트 디자인 필드 — 필드 플레이어 12명

레퍼런스는 사용자가 보유한 선수별 이미지(`tmp/pitch-src/refs/<id>-ref.webp(또는 .png)` 전신 필수, `<id>-ref-face.png` 얼굴 선택). `SIGNATURE`·`KIT`·`EXTRA`는 **영어 그대로 프롬프트에 삽입**된다. `SIGNATURE`는 레퍼런스에서 반드시 유지할 특징이고 **의상·비례·스타일은 피치 컨셉으로 새로 그린다**. `KIT` 가 `HOME`이면 §1 홈 키트.

| id | `NAME` | `POS` | `SIGNATURE` | `KIT` | `EXTRA` |
| --- | --- | --- | --- | --- | --- |
| `woowakgood` | 우왁굳 | 감독 | adult man's athletic body; head is a stylised golden-tan animal-like mascot head (capybara-like) with small round ears, a black headset with a boom microphone and a small red badge | HOME + a black captain's armband | Keep the animal-like mascot face; never turn it into a human face. No suit and no necktie (athlete kit only). The headset earcup badge is a plain red disc with no digits or letters. |
| `janine95kim` | 재닌 | GK | long wavy vivid blue hair, round glasses, white cap-style headband with a tiny ornament and a small black headset microphone, black choker | GK-style: black long-sleeve jersey with mint side panels and white gloves, black shorts with mint stripe, black socks, black boots with mint soles | The glasses reflections are just two white pixels. |
| `bboringirl` | 뽀린걸 | CM | silver-grey hair with red-pink streaks in the side locks, a low side ponytail draped over the shoulder, amber eyes, one small ahoge strand | HOME | Make the red-pink hair streaks clearly visible, drawn in coral red (#ff4d6d), never magenta or hot pink. |
| `sjh4018` | 핑구 | CB | very long sky-blue hair with straight parted bangs, black hairband, small hair clip, blue eyes, cheerful open smile | HOME | The hair is very long: keep a compact silhouette by tying it into a long ponytail behind the back, but keep the sky-blue colour and the straight bangs. |
| `doormomo` | 문모모 | CDM | short purple-black bob with blunt bangs and purple hair tips, white headband with a small red block badge (no text), silver star hairpin, purple eyes | HOME | The headband badge is a text-free red block. |
| `hachi97` | 하치 | WF | short black bob with a white streak, small white antler-like horn ornaments on the head, purple eyes, big open-mouth smile | HOME | Leave extra empty space above the head so the horns are not cut off. |
| `kaksjak0730` | 한결 | CM | very long black hair in a high ponytail, blue eyes, white headphones with a mint-outlined cat-ear band, small star hairpin | HOME | Emphasise the cat-ear headphone silhouette. |
| `ju010228` | 쥬멩이 | ST | very long green hair with a white streak and a white ribbon at the side, amber eyes, gentle smile | HOME | Tie the long hair up high so it swings little during motion; keep the green colour and the white streak. |
| `haepalin` | 해파린 | CB | short lavender-periwinkle bob with one ahoge, blue eyes, a jellyfish-shaped hair ornament and small heart hair clips | HOME | The jellyfish hairpin is made of blue and white pixel blocks. |
| `tleod1818` | 빙밍 | FB | black hair in a bun with a green leaf hairpin and a small white flower, blunt bangs, green eyes, black ribbon choker | HOME | Keep the leaf hairpin green. |
| `tdnlamuron` | 다시바 | WF | short black hair with orange and white streaks, cat ears with pink inner ear, a small round badge hairpin (no number), amber eyes, black choker | HOME | Leave extra empty space above the ears; draw the inner-ear pink in coral (#ff4d6d), never magenta. |
| `lina0108` | 리냐 | FB | long messy red-pink hair with a white streak, small pink-and-white horns, amber eyes, playful smirk | HOME | The hair is voluminous, so leave generous frame margin; draw pinks as coral or apricot tones, never magenta. |

> 재닌은 GK 포지션이지만 **피치에서는 필드 플레이어**로 선택 가능하다(포지션 값은 락커룸 스탯 축 결정에만 사용, [03 §6](03-screens-and-ui.md)).

## 6. AI 골키퍼 `keeper-ai` (오리지널, 선택 불가)

슈터가 누구든 충돌하지 않도록 **전용 오리지널 골키퍼**를 쓴다. 디자인: 어깨 넓은 거구 골키퍼, 네온 오렌지 롱슬리브 저지, 검정 반바지·장갑·양말, 짧게 깎은 진회색 머리에 노란 헤어밴드, 자신만만한 표정. 레퍼런스 없음(텍스트 프롬프트).

| 시트 | 저장 이름 | 캔버스 | 그리드 | 내용 |
| --- | --- | --- | --- | --- |
| K① `stand` | `char-keeper-ai-stand.png` | 1024² | 단일 | 정면 마스터 |
| K② `ready` | `char-keeper-ai-ready.png` | 1536×1024 | 4열×3행 | 행1 ready idle 2프레임(+2칸 비움) / 행2 shuffle-left 4 / 행3 shuffle-right 4 (**화면 기준**: 행2=화면 왼쪽으로 이동, 행3=화면 오른쪽으로 이동) (모두 정면) |
| K③ `dive` | `char-keeper-ai-dive.png` | 1536×1024 | 5열×4행 | 행1 dive-low-left 5 / 행2 dive-low-right 5 / 행3 dive-high-left 5 / 행4 dive-high-right 5 |
| K④ `save` | `char-keeper-ai-save.png` | 1536×1024 | 4열×3행 | 행1 catch 4 / 행2 punch 4 / 행3 foot-deflect 4 |
| K⑤ `react` | `char-keeper-ai-react.png` | 1536×1024 | 4열×3행 | 행1 beaten(실점 후 주저앉음) 4 / 행2 save-celebrate 4 / 행3 rage-slam(바닥 치기) 4 |

- 셀 규격은 필드 플레이어와 동일 96×96(다이브 프레임은 가로로 넓은 포즈이므로 **다이브 셀은 192×96**로 정규화 — 매니페스트에서 지정).
- 컬러 스킨 2종(난이도 표시용): 팔레트 스왑 스크립트로 생성(이미지 생성 불필요).

### 6-1. 골키퍼 아틀라스 배치 (A1 확정, 960×768)

| 행 | 내용 |
| --- | --- |
| 0 | ready 2 (셀 0~1), shuffle_left 4 (2~5), shuffle_right 4 (6~9) |
| 1 | catch 4 (0~3), punch 4 (4~7) |
| 2 | foot_deflect 4 (0~3), beaten 4 (4~7) |
| 3 | save_celebrate 4 (0~3), rage_slam 4 (4~7) |
| 4~7 | dive_low_left / dive_low_right / dive_high_left / dive_high_right 각 5프레임, **셀 192×96**(행당 5칸 = 960) |

- 좌표는 `animations.ts`의 `KEEPER_CLIPS`. `shuffle_left`는 **화면 왼쪽**으로 이동하는 행. 스킨 2종 팔레트 스왑은 아직 미구현(A1 비범위).

## 7. QA 체크리스트

- [ ] 12명 모두 4.5등신 운동선수 비례, 치비처럼 보이지 않음(월드 캐릭터와 나란히 놓아 구분되는지)
- [ ] 외곽선 2px 네이비, 순검정·안티앨리어싱 번짐 없음
- [ ] 발끝 기준선 편차 ≤ 3px (스크립트 QA 리포트)
- [ ] 측면 run 접지 프레임에서 앞발이 교대로 보임(발 겹침 없음)
- [ ] shoot 임팩트 프레임에서 킥 다리가 완전히 뻗고 상체가 셀 안에 있음
- [ ] 스킬 4종이 서로 구별됨(스텝오버/룰렛/레인보우/엘라스티코)
- [ ] 캐릭터별 SIGNATURE(머리색·소품)가 모든 시트에서 유지
- [ ] 마젠타 잔여 픽셀 없음, 셀 가장자리 잘림 없음
- [ ] 텍스트·숫자·로고 없음
- [ ] 셀 여백: 인체가 셀 높이의 82% 이하, 위·아래 여백 ≥ 12%, 이웃 행과 접촉 없음
- [ ] 외곽선 밖 글로우·후광 없음
- [ ] 후면·측면 행이 정면과 같은 스케일(머리·어깨 폭)
- [ ] 후면 행 달리기·슛이 실제 동작(서 있는 자세 아님), 임팩트에서 머리가 어깨 위
- [ ] 초상화 4칸 사이 투명 간격, 팔·주먹이 셀 안에 포함

## 8. 첫 생성 검토에서 얻은 규칙 (2026-09-25, 우왁굳 파일럿 검토)

우왁굳 파일럿 7장을 검토해서 나온 문제와 프롬프트 반영 내용이다. 모든 캐릭터·골키퍼 프롬프트(09)에 이미 들어 있다.

| 발견된 문제 | 원인 | 프롬프트 반영 |
| --- | --- | --- |
| 캐릭터가 셀 높이를 꽉 채우고 위아래 행이 맞닿음, 머리가 셀 위에 걸림 | "여백 10%" 지시가 약함 | 서 있는 키 ≤ 셀 높이 72%, 어떤 자세든 ≤ 82%, 머리 위·발 아래 ≥ 12%, 좌우 ≥ 8%, 이웃 행이 맞닿지 않게 |
| 시안·오렌지 반투명 후광(run/shoot/skill/emote), stand/idle에는 없음 | 림라이트 지시가 외곽선 밖으로 번짐 | "림라이트는 형체 안쪽에만, 외곽선 밖 글로우·후광·색 번짐 금지" (STYLE 문단) |
| 후면 행 상체가 정면보다 굵고 머리가 큼 | 방향별로 다른 체형으로 그림 | "후면·측면은 정면과 같은 스케일·머리 크기·어깨 폭" |
| run 후면 1프레임이 서 있는 자세 | 후면 프레임 동작 미지정 | 후면 행 프레임 1~6 다리 동작을 프레임별로 지정, 두 발 평행 서기 금지 |
| shoot 후면 임팩트에서 상체가 90° 꺾여 머리가 묻힘 | 임팩트를 "몸을 낮춤"으로 지시 | 상체 기울기 ≤ 25°, 머리는 항상 어깨 위, 킥 다리와 골반만 크게 회전 |
| skill 4종이 "웅크림→달리기"로 비슷 | 동작 서술이 추상적 | 행마다 다른 실루엣, 프레임별 다리·팔·몸통 동작 구체 서술, 레인보우는 점프 높이 ≤ 셀 10% |
| portrait 4칸이 붙고 팔·주먹이 가장자리에서 잘림 | 간격 미지정 | 칸 사이 투명 간격 ≥ 60px, 어깨·팔·주먹은 좌우·위 셀 안에 완전히 포함(하단만 절단), 주먹 포즈는 컴팩트하게 |

**변환 스크립트(A1)에서 방어할 것**: 알파 이진화(반투명 후광 제거), 셀 경계에 닿는 프레임 QA 경고(셀 가장자리 2px 이내 불투명 픽셀), 셀 대비 인체 높이 비율 리포트(72% 초과 경고), 초상화 간격 검사.

**변환 시 발끝 정렬 주의**: 달리기·슛·개인기처럼 공중 프레임이 있는 클립은 프레임마다 발끝을 바닥에 맞추면 도약이 사라진다. **행(클립) 단위로 접지 프레임의 발끝을 기준선(y=92)에 맞추고** 나머지 프레임은 같은 오프셋을 적용한다(우왁굳 run 재생성본 검토에서 확인).

**초상화 분리 주의**: 재생성본도 칸 사이 간격이 세로 7px·가로 23px로 요청(60px)에 못 미쳤다. 다른 캐릭터에는 "각 흉상 폭 ≤ 셀 폭의 80%"를 프롬프트에 추가했다. 변환은 이미지를 정확히 2×2로 나눠 프레임별 바운딩 박스로 크롭한다.

**연결요소 분리 주의**: 재생성본에서도 빽빽한 시트는 위아래 행의 발–머리 간격이 7~15px밖에 안 된다(skill-up). 월드 스크립트의 연결요소 병합 gap(24px)을 그대로 쓰면 행이 서로 병합될 수 있으므로 gap은 ≤2px(골키퍼 dive/react는 4px에서도 일부 병합)로 낮추거나 프레임 셀 중심에 가장 가까운 성분만 채택한다.

**검토 방법(다음 캐릭터에도 동일)**: 각 시트에서 ①방향 행이 맞는지 ②프레임 순서가 진행되는지 ③후면·측면 행 스케일 ④셀 여백·이웃 행 접촉 ⑤개인기 행 구별 ⑥머리·소품 유지 ⑦후광 유무를 확인한다.

## 9. A1 변환 결과에서 관찰한 사실 (2026-09-25, 우왁굳·keeper-ai)

- **실제 원본 캔버스**: stand·idle·portrait·keeper-stand = 1254×1254, run/shoot/skill/emote/ready/dive/save/react = 1536×1024 (요청 1024² 대비 stand·idle·portrait 는 1254² 로 드리프트). 환경/FX/UI 시트는 전부 1536×1024, pitch-bg·locker-bg·keyart 는 불투명(알파 없음).
- **변환 파라미터**: 알파 이진화 임계 128, 연결요소 gap **2px**(전 시트에서 프레임 수와 큰 덩어리 수가 일치, 그리드 불일치 0), minArea 30, 마젠타 크로마키는 캐릭터 시트가 이미 투명이라 사용되지 않음(`--tolerance` 기본 40, 실제 사용 0회).
- **원본은 셀을 꽉 채운다**: 기준 행 인체 높이가 셀 대비 idle 93%·run 85%·shoot 96%·skill-side 94%·skill-up 99%·emote 89%(권장 ≤72% 초과, 프롬프트의 여백 지시가 지켜지지 않음). 이웃 행과 병합되지는 않았지만(gap 2px 분리 성공) 다음 캐릭터에서도 같은 경향이면 09 프롬프트의 여백 문구를 더 강하게 한다.
- **스케일 규칙**: 시트별로 기준 행 프레임 높이의 중앙값을 목표 높이로 맞춘다(idle 80, run/shoot/skill/emote 78px; `pitch-art-manifest.json` `ref.height`). 행에서 가장 큰 프레임이 셀을 넘으면 **그 행만** 스케일을 줄인다(우왁굳은 축소 없음, keeper 는 foot_deflect 90%·beaten 81%·save_celebrate 86%). keeper 의 save/react/dive 는 기준 행이 없어 **ready 시트 스케일을 격자 셀 높이 비례**로 적용(ready 0.2606 → dive 0.3471).
- **발끝 정렬**: 행 단위 접지선 = 하위 절반 발끝 중앙값, 공중 허용 행(run·shoot·skill·celebrate·keeper 동작)은 ±3px 이내만 접지선에 붙이고 나머지 오프셋은 유지, 접지 행(idle·disappointed·ready·shuffle·beaten)은 전 프레임을 접지선에 맞추고 원본 편차가 3px 넘으면 경고. 우왁굳은 발끝 경고 0건, keeper beaten f1·f2 는 5px 편차 경고(웅크린 프레임, 수용).
- **초상화**: 우왁굳 4칸의 흉상 폭이 칸의 94~97% 로 칸 사이 간격이 매우 좁다(요청 60px 간격 미달). 정확히 2×2 로 나눠 프레임별 바운딩 박스를 공통 스케일로 192×192 에 하단 정렬. neutral·celebrate 는 측면이 칸 가장자리에 닿아 경고(어깨가 잘리는 방식이라 결과물은 정상으로 보임, 사용자 확인 필요).
- **골키퍼**: foot_deflect f2 · beaten f1 은 무게중심 정렬 시 셀 밖으로 나가 좌우로 1~2px 밀어 넣음. dive 20프레임은 gap 2px 에서 전부 분리됨.
- **전체 변환(12명) QA**: 프레임이 서로 붙은 시트 7개는 연결요소 분리가 안 돼 셀이 비고(`empty`) 행 스케일이 59~70%로 줄었다 — hachi97 skill-side(rainbow f1), ju010228 skill-side(roulette f1·f2), haepalin shoot(side f2, down f2 잘림), tleod1818 shoot(down f2)·skill-up(rainbow f1·f2), lina0108 skill-side(rainbow f2)·skill-up(stepover f2, rainbow f1). 프롬프트의 "프레임 사이 간격" 지시를 더 강하게 해 재생성한다. 초상화는 12명 대부분 흉상 폭이 칸의 94~97%, doormomo 초상화에 마젠타 계열 18~26px 잔여.
- **재생성 결과(2026-09-25)**: 7시트 재생성 후 6개는 그대로 통과, 해파린 shoot 은 프레임이 꼭지점만 닿아 여전히 병합 → 변환기 `splitTouching`(침식 분리)으로 해결. 이후 12명 atlas 모두 빈 셀 0.

## 10. A2 결과 — 12명 검수 (2026-09-25)

A1 의 `--all` 변환이 이미 12명·select UI·fx-celebrate 를 만들었고, A2 는 그 결과를 검수하고 계약을 테스트로 고정했다(`__tests__/characterAssets.test.ts`: 12명 atlas 960×960 · 초상화 4×192×192 · hero 높이 383~384 · `char:<id>` 5파일 · select 그룹 전 키 존재/바이트 · card 96×128 · name-plate 9-slice 12 · celebrate FX 4프레임).

- **재생성 필요 목록: 없음.** 12명 atlas 전 셀 채워짐(빈 셀 0), 프레임 순서·방향 이상 없음. 남은 QA 경고는 전부 수용 대상:
  - `clip 14`(초상화 칸 가장자리 접촉: woowakgood·bboringirl·sjh4018·kaksjak0730·ju010228 의 neutral/celebrate 등) — 긴 머리·주먹이 칸 끝에 닿아 있으나 하단 절단형 흉상이라 화면에서는 자연스러움. `gap`(흉상 폭 83~99%)은 A1 부터의 만성 경향, 변환이 2×2 균등 분할 + 프레임별 바운딩 박스로 처리.
  - `magenta`(doormomo 초상화 18~26px) — 실제로는 **보라색 머리끝**(디자인 의도)이 마젠타 판정에 걸린 오탐. 수정 불필요.
  - `edge`(skill/emote 프레임 좌우 1~2px 밀어 넣음), `foot`(keeper beaten, lina0108 disappointed f2 4px) — 웅크림·주저앉음 프레임, 수용.
  - `symmetry`(nameplate·tooltip·detail-panel·terminal-frame 9-slice 상하 오차 0.09~0.19)는 select 그룹이 아니라 A3 에서 확인 완료(수용, 05 §7). 선택 UI 의 `name-plate`(대칭 통과)는 인셋 **12** 로 확정.
- **9-slice 인셋 확정(select)**: `name-plate` 104×40 원본 프레임 = 인셋 12(가로만 늘려 320×40 이상으로 사용, 세로는 40 유지). `card-*` 96×128·`confirm*` 216×48·화살표 32×32·`pos-badge` 32×32·`tag-current` 56×16 은 9-slice 없이 고정 크기 → 화면에서는 **정수 배율/1:1**로 그린다. 종횡비 차이 경고(`confirm` 32%)는 채움(fill) 늘림으로 이미 반영된 값.
- **select 그룹**: `keyart/select-bg` + UI 13종 + 12명 × (`hero`, `portraits/neutral`, `portraits/confident`) = 50키(`assets.ts` `SELECT_KEYS`, 바이트는 `assetMeta.generated.ts` 자동). `char:<id>` = atlas + 초상화 4. `PitchScene` 등에서 celebrate FX 4종은 core 그룹.
- **좌향 미러 확인 목록(사용자가 직접 확인)**: 좌향은 측면 프레임(`side`)을 좌우 반전해 그린다. 반전으로 읽히는 방향이 바뀌는 **비대칭 소품**이 있는 캐릭터:
  - `woowakgood` — 헤드셋 붐 마이크·빨간 이어컵 배지(한쪽 귀) / 주장 완장은 **팔에 붙어** 미러 시 반대 팔로 이동
  - `janine95kim` — 헤드셋 마이크·한쪽 손 장갑 흰색 강조, 흰 캡 헤어밴드 장식
  - `bboringirl` — 어깨에 걸친 **한쪽 사이드 포니테일**·빨강 브레이드
  - `doormomo` — 헤어핀 별(한쪽)·헤드밴드 빨간 블록
  - `ju010228` — 옆머리 **흰 리본**(한쪽)
  - `haepalin` — 해파리 헤어핀·하트 클립(한쪽)
  - `tleod1818` — 잎 헤어핀·흰 꽃(번 옆 한쪽)
  - `tdnlamuron` — 흰 십자 모양 헤어핀 배지(한쪽 귀 앞)
  - 나머지(hachi97 뿔·kaksjak0730 고양이귀 헤드폰·sjh4018·lina0108) 는 좌우 거의 대칭. 소품이 반대편에 나타나도 **정체성에는 문제 없음**(텍스트/숫자가 없으므로 뒤집혀도 안 읽힘) → 수용 기본값. 마음에 걸리는 캐릭터만 09 에서 해당 시트 재생성 또는 후속 세션에서 `mirror` 미사용 예외 처리.
- **관찰 사실**: 측면 idle(row 0, col 2~3)은 순수 측면이 아니라 3/4 뷰로 그려진 캐릭터가 많다(달리기 측면과 약간 다르게 보임) — idle 로 서 있다가 달릴 때 시점이 살짝 바뀌는 것은 수용. tdnlamuron 의 "배지 헤어핀"은 십자 꽃 모양으로 그려졌음(글자·숫자 없음이라 통과).
- **09 검수 체크 개선**: 다음 재생성부터 `portrait` 검수에 "소품이 있는 쪽(좌/우)을 기록"과 "긴 머리 끝이 칸 가장자리에 닿지 않게"를 추가(러닝북 생성기 검수 줄 반영).
