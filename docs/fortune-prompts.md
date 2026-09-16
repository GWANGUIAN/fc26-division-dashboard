# 오늘의 운세 — 이미지 생성 프롬프트 레퍼런스

`src/web/fortune/`에 구현되는 "오늘의 운세" 타로 팝업에 쓰이는 이미지 생성용 프롬프트 모음. `docs/toty-card-prompts.md`(3D 카드)와 같은 방식으로, 한 개씩 생성할 때마다 이 문서의 해당 섹션을 참고해서 생성 → 파일명 규칙대로 저장하면 됨.

## 디자인 방향 (중요)

- **캐릭터 스타일**: TOTY 카드(세미 리얼)와 달리 이번엔 **SD(2~3등신 귀여운 치비) 타로카드 일러스트** 톤으로 통일. 모든 캐릭터 프롬프트에 "chibi/SD, big head small body, cute mystical tarot illustration style" 명시.
- **"축구공 들고 포즈" 구도 지양 — 실제 타로 카드처럼 의미가 담긴 장면으로**: TOTY 3D 카드는 "캐릭터가 축구공과 함께 역동적인 포즈"였지만, 이번 타로 카드는 그 컨셉을 그대로 따라가지 않는다. 실제 타로 카드(예: The Chariot, The Star, Strength 등)가 그렇듯, **각 카드에 적힌 운세 문구(`fortuneCardData.ts`)의 의미를 상징적으로 표현하는 한 장면**을 그림 — 인물의 포즈, 배경 요소, 소품, 구도 전체가 그 문구의 스토리를 말해줘야 함(아래 각 프롬프트에 이미 그 장면을 구체적으로 설계해뒀음). **축구와 직접 관련될 필요는 없음** — 운세 내용이 자연스럽게 축구 장면(예: 수비를 뚫고 나가는 질주, 골키퍼의 선방)을 요구하면 그대로 담되, 좀 더 추상적/신비로운 상징(예: 서로 다른 방향을 보는 시선, 필드를 내려다보는 예언의 거울, 고요한 물결로 상대를 부드럽게 묶어두는 장면)이 문구를 더 잘 표현한다면 그쪽으로 감.
- **TOTY 3D 카드의 대표 색상·모티프를 그대로 따라가지 않음**: 같은 선수라도 이 타로 카드는 3D 카드(`totyCardTheme.ts`/`docs/toty-card-prompts.md`)와 **완전히 다른 색상·소재·컨셉**으로 독립적으로 설계함(예: 다시바=3D 카드는 용암/화산암이었지만 타로 카드는 진홍빛 혜성, 문모모=3D 카드는 마법진/룬문양이었지만 타로 카드는 예언의 거울 등). 운세 문구에 이미 들어있는 단어(예: 다시바 문구의 "불이 붙는다"🔥, 재닌 문구의 "얼어붙는다")는 문구 자체가 요구하는 요소라 어쩔 수 없이 겹칠 수 있지만, 그런 경우에도 **구체적인 장면·소재·주변 색상 구성은 3D 카드와 다르게** 감(아래 각 프롬프트에 반영됨). 유일한 예외는 **하치**(11번) — 카드 이름 자체가 "황금 드래곤의 강림"이라 드래곤 모티프는 유지하되, 장면 구성은 3D 카드와 다르게 새로 그림.
- **카드 실루엣 — 장식이 바깥으로 삐져나온 유기적인 모양** (중요, 아래에서 변경됨): 카드를 단순 사각형이 아니라, **둥근 사각형 몸체 + 네 모서리마다 바깥으로 뻗어나가는 금색 필리그리(덩굴무늬) 장식 + 상단 중앙의 작은 아치형 크레스트 + 하단 중앙의 작은 뾰족한 피니얼(장식 돌기)**을 가진 타로카드 특유의 윤곽선으로 생성함. 이 장식 돌기들이 카드의 사각형 경계 바깥으로 살짝 삐져나오는 게 포인트 — TOTY 카드의 방패형 프레임과 같은 기법(알파 채널로 실루엣 자체를 그려냄)이되, 모양은 "축구 FIFA 카드"가 아니라 "타로카드"답게 곡선+필리그리 장식으로 감. 그래서 **카드 앞/뒷면 전부 알파 채널 있는 투명 PNG로 생성**하고 실루엣 바깥은 완전히 투명하게 만들어야 함(이전 버전 문서에서는 "불투명 사각형 + CSS로 모서리만 둥글게"였는데, 이번에 이 방식으로 변경함).
- **레이어 안 나눔**: TOTY처럼 frame/background/character를 따로 합성하지 않고, **카드 앞면은 한 장짜리 완성 일러스트**로 생성한다(실루엣 장식 + 일러스트 + 캐릭터가 전부 한 이미지 안에 있음). 대신 **카드 뒷면(`fortune-card-back.webp`)을 가장 먼저 만들어서 이 장식 실루엣을 확정**하고, 이후 각 앞면을 생성할 때마다 그 뒷면 이미지를 "동일한 외곽 실루엣/장식 테두리 레퍼런스"로 같이 첨부해서 **전체 카드가 전부 정확히 같은 윤곽선**을 갖도록 함(뒷면이 진짜 뒷면이니 앞면과 크기·윤곽이 안 맞으면 셔플/딜 애니메이션에서 카드들이 서로 다른 모양으로 보여 어색해짐).
- **텍스트는 이미지에 굽지 않음**: 카드 이름(예: "타오르는 돌격병")은 AI 이미지에 직접 그리지 않고 웹에서 HTML로 오버레이함 — AI가 한글 텍스트를 그리면 깨지기 쉽다는 게 TOTY 작업에서 이미 확인된 교훈. 그래서 모든 캐릭터 프롬프트에 "no text, no logos"를 명시하고, **하단 12~15% 영역(장식 실루엣 안쪽)은 비워두도록**(카드 이름 오버레이 자리) 요청함.
- **운세 설명 문구는 전부 축구 드립**: 실제 문구는 이미 `src/web/fortune/fortuneCardData.ts`에 확정되어 있음 — "~수도/~지도" 식으로 얼버무리지 않고, 실제 타로 카드를 해석해주는 것처럼 단정적인 문장으로 씀. 모든 카드가 다 좋은 얘기일 필요는 없고, 몇 장은 "서두르면 놓친다", "초반엔 힘들지만" 처럼 주의를 주는 카드로도 섞어뒀음. 이 문서는 이미지만 다룸 — 문구 자체를 수정하고 싶으면 그 파일을 고치면 됨.
- **리냐 카드 — 사시(사팔눈) 컨셉**: 실제 전달할 리냐 레퍼런스 사진이 사시(두 눈이 서로 다른 방향을 보는) 특징을 가지고 있음. 이걸 결점이 아니라 **귀엽고 코믹한 매력 포인트**로 명시적으로 살릴 것(아래 8번 섹션 프롬프트 참고). 운세 문구도 "시선이 어디로 향하는지 모르겠다 → 그런데 그 끝에 의외의 행운이 있다"는 개그로 이미 연결해뒀음.
- **재닌의 두 번째 카드 — 도라에몽 "퉁퉁이" 패러디 컨셉** (10번 원래 카드는 그대로 두고, 별도 보너스 카드로 추가함 — 아래 "13. 재닌 (두 번째 카드)" 섹션 참고): 재닌은 평소 목소리가 걸걸하고 노래를 잘 못해서 팬들 사이에서 도라에몽의 "퉁퉁이"(그 유명한 음치 골목 리사이틀 캐릭터)라는 별명으로 불림. 이 카드는 **재닌 실제 사진 + 퉁퉁이 캐릭터 사진, 두 장을 합성 레퍼런스로 같이 전달**해서 얼굴은 재닌 그대로 알아볼 수 있게 유지하되, 의상·체형·포즈는 퉁퉁이 스타일(황토색/겨자색 라운드넥 니트, 다부진 체형, 골목대장 특유의 당당한 자세)을 입힌 패러디 캐릭터로 그림(다른 카드들처럼 진지한 톤이 아니라 **12번 우왁굳 카드처럼 개그 톤**). 원래 카드의 서리(얼음) 모티프는 "노래/포효가 너무 강력해서 상대가 얼어붙는다"는 개그로 재해석해 소리 충격파가 서리로 얼어붙는 형태로 살짝 남겨둠. `fortuneCardData.ts`에는 `janine95kim`(원래 카드)과 별개로 `janine95kim2`(이 패러디 카드) 항목이 추가되어 있고, 이미지도 `janine95kim2-fortune-card.webp`로 독립된 파일임 — 뽑기 풀/기록/이미지 전부 원래 카드와 완전히 별개로 취급됨.
- **하치의 두 번째 카드 — "두고하치" 밈 패러디 컨셉** (11번 원래 카드는 그대로 두고, 별도 보너스 카드로 추가함 — 아래 "14. 하치 (두 번째 카드)" 섹션 참고): 하치가 우왁굳에게 어떤 게임을 강력 추천해서 실제로 플레이까지 이어졌는데, 그 결과가 호불호가 갈리면서 일부 팬들이 "두고보자"와 "하치"를 합쳐 "두고하치..."라는 채팅을 치는 게 굳어져 밈이 됨. 이 카드는 하치 얼굴/정체성은 그대로 유지한 채, 뒤에서 그를 벼르는(하지만 전혀 안 무서운, 코믹한) 작은 군중 실루엣이 등장하는 장면으로 그려서 이 밈을 패러디함(11번 카드처럼 진지한 판타지 톤이 아니라 **12번 우왁굳 카드처럼 개그 톤**). 이미지/문구 어디에도 실제 게임 이름은 언급하지 않음 — "두고하치"라는 밈 자체와 그 반응(벼르는 군중)만 그림으로 표현. `fortuneCardData.ts`에는 `hachi97`(원래 카드)과 별개로 `hachi972`(이 패러디 카드) 항목이 추가되어 있고, 이미지도 `hachi972-fortune-card.webp`로 독립된 파일임.
- **다시바의 두 번째 카드 — "수은추" 별명 패러디 컨셉** (1번 원래 카드는 그대로 두고, 별도 보너스 카드로 추가함 — 아래 "15. 다시바 (두 번째 카드)" 섹션 참고): 다시바는 "수은추"라는 별명이 있음 — "수은"은 리그 오브 레전드에서 모든 디버프를 제거하는 아이템 "수은 장식띠"에서 따온 말로, 안 좋은 분위기를 잘 환기시키거나 곁에 있으면 힐링되는 사람을 뜻하고, "추"는 실제로는 여자인데 장난삼아 "남자"라고 놀리는 접미사임. 이 카드는 그 "수은"(정화/디버프 제거) 쪽 이미지를 정면으로 살려서, 다시바가 지나가기만 해도 팀원들의 어두운 기운(디버프 같은 그림자/사슬)이 씻겨나가는 장면으로 그림 — 1번 카드(진홍빛 혜성)와는 완전히 다른 은빛/백금 "정화" 팔레트. 성별을 놀리는 뉘앙스("추")는 이미지가 아니라 카드 이름·운세 문구 쪽의 애정 어린 드립으로만 살짝 살림. `fortuneCardData.ts`에는 `tdnlamuron`(원래 카드)과 별개로 `tdnlamuron2`(이 패러디 카드) 항목이 추가되어 있고, 이미지도 `tdnlamuron2-fortune-card.webp`로 독립된 파일임. 효과음은 전용 파일 `public/sfxes/tdnlamuron-2.mp3`를 사용(사용자가 직접 추가).
- **나머지 8명(재닌·하치·다시바를 제외한 전원)의 두 번째 카드 — 밈 패러디가 아니라 "역방향 타로"(리버스 카드) 컨셉, 전부 안 좋은 내용** (아래 "16~23" 섹션 참고): 위 세 장은 특정 밈/별명을 패러디한 카드지만, 나머지 8명(쥬멩이/문모모/뽀린걸/한결/핑구/해파린/리냐/빙밍)에게는 그런 밈이 없어서 대신 **자신의 1번 카드를 정반대로 뒤집은 "리버스 카드"**로 설계함 — 실제 타로에서 같은 카드가 정방향/역방향으로 정반대 의미를 갖는 것처럼, 모티프·소품·구도는 1번 카드와 거의 유사하게 유지하되 **결과만 실패/불운으로 뒤집음**(예: "떠오르는 태양"→"저무는 태양", "무엇도 뚫을 수 없는 요새"→"무너지는 요새"). **사용자 요청에 따라 이 8장은 전부 안 좋은 내용으로만 구성**(기존 11장이 전반적으로 좋은 내용인 것과 의도적으로 대비됨) — 이 문서의 다른 카드들과 달리 "몇 장만 주의를 주는" 게 아니라 이 배치 전체가 그러함. 톤은 12번 우왁굳처럼 코믹하게 웃기는 게 아니라, **실제 타로의 The Tower/Ten of Swords 역방향 카드들처럼 진지하고 불길한 분위기**로 그림(캐릭터 스타일 자체는 다른 카드들과 동일하게 chibi/SD 유지). 각 카드는 원래 카드와 같은 실루엣 레퍼런스를 쓰고, 3D 카드와도 무관하게 독자적으로 설계함. 8장 모두 `streamerId`로 원래 선수를 가리키고, 8장 전부 전용 효과음(`ju010228-2.mp3`, `doormomo-2.mp3`, `bboringirl-2.mp3`, `kaksjak0730-2.mp3`, `sjh4018-2.mp3`, `haepalin-2.mp3`, `lina0108-2.mp3`, `tleod1818-2.mp3`)이 추가되어 각자 `sfxOverride`로 지정되어 있음.
- **우왁굳의 두 번째 카드 — "왁초리"(우왁굳+회초리) 패러디, 안 좋은 내용** (아래 "12-2. 우왁굳 (두 번째 카드)" 섹션 참고): 1번 우왁굳 카드는 신나는 개그 톤이지만, 이 두 번째 카드는 사용자 요청대로 **정반대로 안 좋은 내용**임 — 우왁굳이 회초리를 손에 들고 무서운 코치 모드로 등장해서 팀 전체가 얼어붙는다는 컨셉. 이미지에도 실제로 **회초리를 든 모습**을 담음(사용자가 명시적으로 요청). 다른 8명의 "역방향 타로"들과 마찬가지로 톤은 심각/불길하게 잡되(코믹 아님), `fortuneWoowakgoodCard.ts`에 `FORTUNE_WOOWAKGOOD_CARD_2`(id: `woowakgood2`)로 별도 추가되어 있고, 1번 카드와 함께 `FORTUNE_WOOWAKGOOD_CARDS` 배열로 묶여서 언락 시 동시에 뽑기 풀에 들어감. 효과음은 사용자가 직접 준비 예정 — 파일명은 아래 12-2 섹션 참고.

## 공통 작업 방식

1. **캔버스**: 카드 앞/뒷면 전부 **1060×1484px** (5:7, TOTY 카드와 동일 비율 — 기존 `aspect-ratio: 1060/1484` CSS를 그대로 재사용하기 위함) 캔버스 안에, 위에서 설명한 **장식 실루엣**(둥근 사각형 몸체 + 네 모서리 필리그리 + 상단 크레스트 + 하단 피니얼)을 가진 카드 하나를 그리고, **그 실루엣 바깥 캔버스 전체는 완전히 투명**(알파 채널 있는 투명 PNG)하게 생성.
   - 사용하는 생성 도구가 진짜 투명 배경(RGBA)을 지원하는지 먼저 확인 (예: ChatGPT 이미지 생성에 "배경 투명"을 명시, Adobe Firefly/Recraft의 투명 배경 옵션 등). 지원 안 하면 순수 그린/마젠타 배경으로 생성 후 배경 제거 도구로 따로 제거.
   - 생성 후 어두운 배경이나 체크무늬 배경에 올려서 가장자리(특히 필리그리 돌기 끝부분)에 원래 배경색 잔여 테두리(halo)가 없는지 꼭 확인.
2. **레퍼런스 이미지 첨부**:
   - ① 먼저 **카드 뒷면**(`fortune-card-back.webp`)부터 생성해서 장식 실루엣을 확정.
   - ② 이후 **각 선수 카드 앞면** 생성 시, (a) 확정된 카드 뒷면 이미지를 "동일한 외곽 실루엣/장식 테두리 구조 레퍼런스"로(장식 자체의 디자인 디테일은 앞면마다 살짝 달라도 되지만, 전체적인 윤곽선 구조·비율은 반드시 동일해야 함), (b) 그 선수 실제 사진을 "얼굴/헤어 특징 레퍼런스"로 같이 첨부.
3. **파일명 규칙**: `fortune-card-back.webp`(공용, 1장), `<id>-fortune-card.webp`(11명 선수 1번 카드 + 11명 전원의 두 번째 보너스 카드 + 우왁굳 1번·2번 숨겨진 카드, 총 24장) — 아래 표의 `id` 컬럼 사용. `src/web/assets/fortune/` 폴더에 저장(이미 폴더 생성해둠). PNG로 받으면 webp로 변환 후 이 폴더에 그대로 넣으면 `fortuneCardAssets.ts`가 자동으로 인식함(빌드 시 `import.meta.glob`으로 스캔 — 별도 등록 코드 필요 없음).
4. 앞면이 다 없어도 사이트는 정상 동작함(없는 카드는 "?" 플레이스홀더 박스로 대체) — 급하지 않게 하나씩 채워 넣으면 됨. 카드 뒷면만 먼저 넣어도 셔플/딜 애니메이션은 바로 확인 가능.
5. **팝업 배경/제목/마스코트/버튼 이미지**는 아래 "공용 팝업 에셋" 섹션 참고 — 이것도 같은 `src/web/assets/fortune/` 폴더에 파일명 규칙대로 저장.

## 선수별 카드 데이터 요약

| # | 선수 | id | 포지션 | 컬러·모티프 (3D 카드와 무관한 독자 컨셉) | 카드 이름 |
|---|------|-----|--------|-------------|-----------|
| 1 | 다시바 | `tdnlamuron` | WF | 진홍+백광 · 질주하는 혜성 | 타오르는 돌격병 |
| 2 | 쥬멩이 | `ju010228` | ST | 황금빛 노랑+주홍 · 떠오르는 태양 | 봄의 골잡이 |
| 3 | 문모모 | `doormomo` | CDM | 남색+은빛 · 천리안의 거울 | 천리안의 지휘관 |
| 4 | 뽀린걸 | `bboringirl` | CM | 버건디+청동 · 불타는 심장의 전사 | 강철 심장 미드필더 |
| 5 | 한결 | `kaksjak0730` | CM | 은빛+짙은 자주 · 달빛 궁수 | 밤하늘의 프리키커 |
| 6 | 핑구 | `sjh4018` | CB | 강철청+대리석흰 · 공중 요새의 수호기사 | 공중 요새의 수문장 |
| 7 | 해파린 | `haepalin` | CB | 세이지그린+연회색 · 고요한 물결의 파수꾼 | 고요한 물결의 파수꾼 |
| 8 | 리냐 | `lina0108` | FB | 오팔빛 무지개색 · 갈림길의 요정 (사시 컨셉) | 엇갈린 시선의 갈림길 요정 |
| 9 | 빙밍 | `tleod1818` | FB | 터콰이즈+흰색 · 번개의 전령 | 번개의 질주자 |
| 10 | 재닌 | `janine95kim` | GK | 옅은 시안+차콜 · 서리의 수호자 | 서리의 골키퍼 |
| 11 | 하치 | `hachi97` | WF | 골드+보라 · 황금 드래곤 (스페셜, 유일한 예외) | 황금 드래곤의 강림 |
| 12 | 우왁굳 (숨겨진 카드) | `woowakgood` | — | 샴페인 골드+차콜 · 개그 | 벤치에 있던 감독 |
| 13 | 재닌 (두 번째 카드) | `janine95kim2` | GK | 겨자색+차콜 · 도라에몽 퉁퉁이 패러디(골목대장의 포효) | 울부짖는 수문장 |
| 14 | 하치 (두 번째 카드) | `hachi972` | WF | 주황+차콜 · "두고하치" 밈 패러디(벼르는 군중) | 두고하치의 심판 |
| 15 | 다시바 (두 번째 카드) | `tdnlamuron2` | WF | 은빛+백금 · "수은추" 별명 패러디(정화의 오라) | 수은추의 정화 |
| 16 | 쥬멩이 (두 번째 카드) | `ju0102282` | ST | 탁한 황갈+회갈 · 역방향(저무는 태양) | 저무는 태양 |
| 17 | 문모모 (두 번째 카드) | `doormomo2` | CDM | 슬레이트 그레이+금 간 은빛 · 역방향(깨진 거울) | 깨진 거울 |
| 18 | 뽀린걸 (두 번째 카드) | `bboringirl2` | CM | 녹슨 오렌지+갈색 · 역방향(멈춘 엔진) | 녹슨 엔진 |
| 19 | 한결 (두 번째 카드) | `kaksjak07302` | CM | 탁한 자수정+회보라 · 역방향(빗나간 화살) | 빗나간 화살 |
| 20 | 핑구 (두 번째 카드) | `sjh40182` | CB | 무너진 석재 회색 · 역방향(균열) | 무너지는 요새 |
| 21 | 해파린 (두 번째 카드) | `haepalin2` | CB | 짙은 폭풍청 · 역방향(집어삼키는 파도) | 휩쓸리는 파도 |
| 22 | 리냐 (두 번째 카드) | `lina01082` | FB | 탁한 자보라+회색 · 역방향(막다른 길) | 엇나간 갈림길 |
| 23 | 빙밍 (두 번째 카드) | `tleod18182` | FB | 그을린 터콰이즈 · 역방향(균형을 잃은 질주) | 헛디딘 질주 |
| 24 | 우왁굳 (두 번째 카드, 숨겨진 카드) | `woowakgood2` | — | 짙은 적갈+차콜 · "왁초리" 패러디, 안 좋은 내용 | 회초리를 든 왁초리 |

**12번(우왁굳)과 24번(우왁굳 두 번째 카드)은 정규 22장을 전부 뽑기 전까지는 뽑기 풀에 등장하지 않는 숨겨진 보너스 카드이며, 언락되는 순간 둘 다 동시에 뽑기 풀에 섞여 들어감**(순차 언락 아님) — 자세한 내용은 아래 "12. 우왁굳"·"12-2. 우왁굳 (두 번째 카드)" 섹션 참고.

**13~23번(재닌·하치·다시바·쥬멩이·문모모·뽀린걸·한결·핑구·해파린·리냐·빙밍의 두 번째 카드, 즉 로스터 11명 전원)은 숨겨진 카드가 아님** — 12/24번 우왁굳과 달리 처음부터 나머지 카드들과 함께 뽑기 풀에 항상 포함되는 "보너스 카드"(로스터 11명 전원이 카드 2장씩 가짐). `fortuneCardData.ts`의 `FORTUNE_CARDS` 배열에 정식 항목으로 들어있어서, 우왁굳 언락 조건("전부 뽑아야 함")도 이제 이 8장까지 포함한 전체 22장 기준으로 판정됨. 16~23번(쥬멩이~빙밍의 두 번째 카드)과 24번(우왁굳 두 번째 카드)은 **전부 안 좋은 내용**으로만 구성된 카드임 — 자세한 배경은 위 디자인 방향 항목 참고.

**컬러/모티프는 3D 카드(`totyCardTheme.ts`/`docs/toty-card-prompts.md`)와 의도적으로 다르게 설계** — 같은 선수라도 두 카드 시리즈가 서로 다른 독자적인 정체성을 갖도록 함(하치만 예외, 위 디자인 방향 참고). 카드 이름은 이전 초안에서 3D 카드 모티프를 그대로 언급하던 것들(룬문양/구름/심해/폭풍/오로라)을 이번 새 컨셉에 맞게 다시 지었음 — 실제 운세 문구(`fortuneCardData.ts`)는 그대로 유지.

---

## 카드 뒷면 (공용, 가장 먼저 생성 — 장식 실루엣을 여기서 확정)

**파일명**: `fortune-card-back.webp`

```
A mystical tarot card back design, ornate and symmetrical, portrait
orientation. IMPORTANT — the card itself is NOT a plain rectangle: it has
a rounded-rectangle body with elegant gold filigree/vine-scroll ornaments
curling outward PAST the rectangle's edges at all four corners, a small
arched crest ornament poking out above the top-center edge, and a small
pointed decorative finial poking out below the bottom-center edge — like
a classic ornate tarot card silhouette, not a simple rounded square. Deep
midnight-navy card face with delicate gold linework border just inside
the silhouette's edge, a central emblem combining a crescent moon, a
small five-pointed star cluster, and a subtle soccer-ball silhouette
woven into the pattern (as if the mystic and the sport are one motif) —
mint-teal and gold accent colors. Symmetrical repeating corner
ornaments, elegant and premium, Rider-Waite-inspired but original. No
text, no logos, no numbers, no readable characters. Entire canvas
OUTSIDE the card's own decorative silhouette (including between the
filigree curls) must be fully transparent (alpha 0) — this is a
cutout-shaped card, not a filled rectangle. PNG with alpha channel, high
detail, portrait orientation, 1060x1484.
```

---

## 1. 다시바 — `tdnlamuron` — 진홍+백광 · 질주하는 혜성 (WF)

**카드 앞면** (다시바 참고 사진 + 확정된 `fortune-card-back.webp`를 실루엣 레퍼런스로 첨부):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge (the card's outer decorative
outline must match exactly) — but redesign the illustration and palette
completely and independently for this player (do NOT reuse this
player's 3D-card look of orange volcanic rock/lava — this is a
different, unrelated design).

A cute chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card (a symbolic scene, not a simple action pose) —
big head small body, 2-3 head-tall proportions. The character (from the
attached reference photo) streaks forward like a blazing comet against a
deep crimson-red night sky, a trail of white-hot light and fire
particles burning behind them. Three dark shadow-silhouette figures
shatter like cracked glass and scatter into embers as the character
bursts straight through them, arriving at a small glowing goal-shaped
portal of light just ahead — visually telling the story "unstoppable
speed breaks through every defender and scores." Crimson-red and
white-hot color palette, small streaking spark-trail and comet-dust
flourishes decorate the corner ornaments (replacing the back's
mint-gold cosmic motif with this player's own colors, while keeping the
same silhouette shape). Leave the bottom ~15% of the card's inner area
as a simple, uncluttered space (no text) for a card-name overlay to be
added later on the website. No text, no logos, no numbers. Entire canvas
outside the card's own decorative silhouette must be fully transparent
(alpha 0). Portrait orientation, 1060x1484, PNG with alpha channel.
```

## 2. 쥬멩이 — `ju010228` — 황금빛 노랑+주홍 · 떠오르는 태양 (ST)

**카드 앞면** (쥬멩이 참고 사진 + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely and independently for this player (do NOT reuse this
player's 3D-card look of lime-green vines — this is a different,
unrelated design).

A cute chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card (a symbolic scene, not a simple action pose) —
big head small body, 2-3 head-tall proportions. The character (from the
attached reference photo) stands triumphantly as a brilliant morning sun
rises directly behind them, radiant golden-yellow and warm orange
sunbeams shooting outward in every direction like unstoppable growth;
both arms raised joyfully, a trail of light arcs from their foot like a
shooting star straight into a distant glowing goal net — visually
telling the story "unstoppable rising momentum, every shot finds the net
today." Golden-yellow and warm orange sunrise color palette, small
sunburst-ray flourishes decorate the corner ornaments (replacing the
back's mint-gold cosmic motif with this player's own colors, while
keeping the same silhouette shape). Bright warm sunrise lighting. Leave
the bottom ~15% of the card's inner area as a simple, uncluttered space
(no text) for a card-name overlay to be added later. No text, no logos,
no numbers. Entire canvas outside the card's own decorative silhouette
must be fully transparent (alpha 0). Portrait orientation, 1060x1484,
PNG with alpha channel.
```

## 3. 문모모 — `doormomo` — 남색+은빛 · 천리안의 거울 (CDM)

**카드 앞면** (문모모 참고 사진 + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely and independently for this player (do NOT reuse this
player's 3D-card look of violet runes/magic-circles — this is a
different, unrelated design).

A cute chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card (a symbolic scene, not a simple action pose) —
big head small body, 2-3 head-tall proportions. The character (from the
attached reference photo) stands calmly holding an ornate hand mirror
that shows a tiny glowing reflection of an entire soccer pitch seen from
above, a thin thread of silver-blue light extending from the mirror
across the scene toward a distant point — visually telling the story
"seeing the whole field, one perfect pass changes everything." Deep
navy-blue and silver color palette, small star-map and
constellation-line flourishes decorate the corner ornaments (replacing
the back's mint-gold cosmic motif with this player's own colors, while
keeping the same silhouette shape). Calm, composed expression, cool
navy-silver lighting. Leave the bottom ~15% of the card's inner area as
a simple, uncluttered space (no text) for a card-name overlay to be
added later. No text, no logos, no numbers. Entire canvas outside the
card's own decorative silhouette must be fully transparent (alpha 0).
Portrait orientation, 1060x1484, PNG with alpha channel.
```

## 4. 뽀린걸 — `bboringirl` — 버건디+청동 · 불타는 심장의 전사 (CM)

**카드 앞면** (뽀린걸 참고 사진 + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely and independently for this player (do NOT reuse this
player's 3D-card look of gunmetal-gray mecha armor/red circuits — this
is a different, unrelated design).

A cute chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card (a symbolic scene, not a simple action pose) —
big head small body, 2-3 head-tall proportions. The character (from the
attached reference photo), dressed as a small warrior in burnished
bronze armor, stands unwavering as a glowing ember-red heart burns
steadily through a crack in their breastplate; behind them an hourglass
keeps flowing without ever emptying, sand endlessly refilling itself —
visually telling the story "an engine that never tires, still fighting
hard in the final minute." Deep burgundy and bronze color palette, small
gear and ember flourishes decorate the corner ornaments (replacing the
back's mint-gold cosmic motif with this player's own colors, while
keeping the same silhouette shape). Determined, steady expression, warm
bronze rim lighting. Leave the bottom ~15% of the card's inner area as a
simple, uncluttered space (no text) for a card-name overlay to be added
later. No text, no logos, no numbers. Entire canvas outside the card's
own decorative silhouette must be fully transparent (alpha 0). Portrait
orientation, 1060x1484, PNG with alpha channel.
```

## 5. 한결 — `kaksjak0730` — 은빛+짙은 자주 · 달빛 궁수 (CM)

**카드 앞면** (한결 참고 사진 + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely and independently for this player (do NOT reuse this
player's 3D-card look of deep-black shattered glass shards — this is a
different, unrelated design).

A cute chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card (a symbolic scene, not a simple action pose) —
big head small body, 2-3 head-tall proportions. The character (from the
attached reference photo), dressed like a calm moonlit archer, draws
back a single bow with an arrow made of pure silver moonlight, aiming
steadily under a full moon and a sky full of stars; the target ahead is
already beginning to frost over in anticipation — visually telling the
story "calm like starlight, but powerful enough to freeze the keeper."
Silver moonlight and deep plum-violet night-sky color palette, small
crescent-moon and star flourishes decorate the corner ornaments
(replacing the back's mint-gold cosmic motif with this player's own
colors, while keeping the same silhouette shape). Poised, serene
expression, cool silver-plum rim lighting. Leave the bottom ~15% of the
card's inner area as a simple, uncluttered space (no text) for a
card-name overlay to be added later. No text, no logos, no numbers.
Entire canvas outside the card's own decorative silhouette must be
fully transparent (alpha 0). Portrait orientation, 1060x1484, PNG with
alpha channel.
```

## 6. 핑구 — `sjh4018` — 강철청+대리석흰 · 공중 요새의 수호기사 (CB)

**카드 앞면** (핑구 참고 사진 + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely and independently for this player (do NOT reuse this
player's 3D-card look of pastel sky-blue clouds/feathers — this is a
different, unrelated design).

A cute chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card (a symbolic scene, not a simple action pose) —
big head small body, 2-3 head-tall proportions. The character (from the
attached reference photo), dressed as a small guardian knight in
polished steel-blue armor, leaps effortlessly from a floating
marble-white rampart high in the sky, holding up a large glowing shield
that a dark shadowy comet bounces harmlessly off of — visually telling
the story "floating up lightly for the header, an unbreakable wall of
defense." Steel-blue and marble-white color palette, small rampart and
shield flourishes decorate the corner ornaments (replacing the back's
mint-gold cosmic motif with this player's own colors, while keeping the
same silhouette shape). Alert, grounded expression despite floating,
cool steel-white lighting. Leave the bottom ~15% of the card's inner
area as a simple, uncluttered space (no text) for a card-name overlay
to be added later. No text, no logos, no numbers. Entire canvas outside
the card's own decorative silhouette must be fully transparent (alpha
0). Portrait orientation, 1060x1484, PNG with alpha channel.
```

## 7. 해파린 — `haepalin` — 세이지그린+연회색 · 고요한 물결의 파수꾼 (CB)

**카드 앞면** (해파린 참고 사진 + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely and independently for this player (do NOT reuse this
player's 3D-card look of lavender-purple deep-sea jellyfish — this is a
different, unrelated design).

A cute chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card (a symbolic scene, not a simple action pose) —
big head small body, 2-3 head-tall proportions. The character (from the
attached reference photo) stands at the edge of a perfectly calm lake,
gently guiding rippling ribbons of flowing water that wrap softly but
firmly around a slumping shadow-silhouette figure, who looks exhausted
and about to collapse; the character themself remains serene and
untired — visually telling the story "marking like flowing water, until
the opponent tires out first." Soft sage-green and pale grey-blue color
palette, small ripple and water-droplet flourishes decorate the corner
ornaments (replacing the back's mint-gold cosmic motif with this
player's own colors, while keeping the same silhouette shape). Calm,
unbothered expression, soft misty lighting. Leave the bottom ~15% of the
card's inner area as a simple, uncluttered space (no text) for a
card-name overlay to be added later. No text, no logos, no numbers.
Entire canvas outside the card's own decorative silhouette must be
fully transparent (alpha 0). Portrait orientation, 1060x1484, PNG with
alpha channel.
```

## 8. 리냐 — `lina0108` — 오팔빛 무지개색 · 갈림길의 요정 (FB) — 사시 컨셉 반영

**카드 앞면** (리냐 참고 사진[사시 특징 포함] + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely and independently for this player (do NOT reuse this
player's 3D-card look of vivid pink cherry blossoms — this is a
different, unrelated design).

A cute chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card (a symbolic scene, not a simple action pose) —
big head small body, 2-3 head-tall proportions. The character (from the
attached reference photo, including her distinctive slightly wall-eyed/
cross-eyed gaze — her two eyes looking in subtly different directions,
kept exactly as shown, an endearing charming quirk to lean into rather
than correct or normalize) stands at a glowing magical crossroads where
two shimmering trails of light diverge from her — one trail from each
eye, since she's looking two ways at once. One trail wanders off and
fizzles into nothing; the other, unexpectedly, curves back around
through a hedge of glowing flowers and arrives directly at a hidden
goal — visually telling the story "nobody knows where her gaze is
really going, but somehow it finds the net." Shimmering opal/iridescent
color palette that shifts between soft teal, lavender and gold, small
prism and light-trail flourishes decorate the corner ornaments
(replacing the back's mint-gold cosmic motif with this player's own
colors, while keeping the same silhouette shape). Playful, slightly
dazed and lucky expression, dreamy prismatic lighting. Leave the bottom
~15% of the card's inner area as a simple, uncluttered space (no text)
for a card-name overlay to be added later. No text, no logos, no
numbers. Entire canvas outside the card's own decorative silhouette
must be fully transparent (alpha 0). Portrait orientation, 1060x1484,
PNG with alpha channel.
```

> 이 카드의 운세 문구("리냐의 시선이 어디를 향하는지는 아무도 모른다. 하지만 그 알 수 없는 방향 끝에, 아무도 예상 못한 찬스가 기다리고 있다.")는 이 사시 컨셉 그림과 짝을 이루도록 이미 작성해뒀음 — 그림에서 시선이 서로 다른 방향을 보고 있는 게 잘 드러나야 문구와 맞아떨어짐.

## 9. 빙밍 — `tleod1818` — 터콰이즈+흰색 · 번개의 전령 (FB)

**카드 앞면** (빙밍 참고 사진 + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely and independently for this player (do NOT reuse this
player's 3D-card look of deep-navy storm clouds/emerald lightning —
this is a different, unrelated design).

A cute chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card (a symbolic scene, not a simple action pose) —
big head small body, 2-3 head-tall proportions. The character (from the
attached reference photo) sprints along a bright coastal cliff edge, a
single ribbon of turquoise lightning trailing from their heel like a
wind-spirit's scarf; the lightning arcs forward through the air and
connects directly to a distant silhouetted teammate, delivering the
ball to them in an instant — visually telling the story "lightning-fast
overlapping run, one perfect cross becomes an assist." Bright turquoise
and white color palette, small wind-ribbon and spark flourishes
decorate the corner ornaments (replacing the back's mint-gold cosmic
motif with this player's own colors, while keeping the same silhouette
shape). Dynamic, joyful sprinting pose, bright turquoise rim lighting.
Leave the bottom ~15% of the card's inner area as a simple, uncluttered
space (no text) for a card-name overlay to be added later. No text, no
logos, no numbers. Entire canvas outside the card's own decorative
silhouette must be fully transparent (alpha 0). Portrait orientation,
1060x1484, PNG with alpha channel.
```

## 10. 재닌 — `janine95kim` — 옅은 시안+차콜 · 서리의 수호자 (GK)

**카드 앞면** (재닌 참고 사진 + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely and independently for this player (do NOT reuse this
player's 3D-card look of sky-blue with aurora ribbons — this is a
different, unrelated design; frost/ice is kept since the fortune text
itself calls for it, but skip aurora entirely).

A cute chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card (a symbolic scene, not a simple action pose) —
big head small body, 2-3 head-tall proportions. The character (from the
attached reference photo), dressed in dark charcoal goalkeeper gear with
pale icy-cyan gloves, reaches out mid-save with delicate ice crystals
blooming outward from her fingertips in a bursting star pattern,
freezing a dark silhouetted ball in place mid-air just before the goal
line — visually telling the story "frost blooms from her fingertips,
nothing gets past the perfect save." Pale icy-cyan and deep charcoal
color palette (no aurora), small snowflake and ice-crystal flourishes
decorate the corner ornaments (replacing the back's mint-gold cosmic
motif with this player's own colors, while keeping the same silhouette
shape). Focused, confident expression, cool icy rim lighting. Leave the
bottom ~15% of the card's inner area as a simple, uncluttered space (no
text) for a card-name overlay to be added later. No text, no logos, no
numbers. Entire canvas outside the card's own decorative silhouette
must be fully transparent (alpha 0). Portrait orientation, 1060x1484,
PNG with alpha channel.
```

## 11. 하치 — `hachi97` — 골드+보라 · 황금 드래곤 (스페셜, 유일한 예외, WF)

**카드 앞면** (하치 참고 사진 + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely for this player (and make the ornamentation a bit
more lavish/elaborate than the others — this is the "special/highest
rarity" card of the set). NOTE: this is the one deliberate exception
where the golden-dragon motif is intentionally kept, since it's this
player's own core signature identity tied to the card's name "황금
드래곤의 강림" — even so, compose a genuinely different scene from the
3D card, not the same pose.

A cute chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card (a symbolic scene, not a simple action pose) —
big head small body, 2-3 head-tall proportions. The character (from the
attached reference photo) dribbles confidently through a burst of
golden dragon-shaped light and smoke swirling around them, while three
shadowy stone-guardian statues crack and crumble to golden dust as they
pass by untouched; the ball trails a comet of golden light into a goal
that bursts open with radiant sunburst light — visually telling the
story "today, everything just works — even the impossible dribble
becomes real." Radiant gold and deep violet dragon-fire color palette,
small golden dragon-scale and flame-wisp flourishes decorate the corner
ornaments (replacing the back's mint-gold cosmic motif with this
player's own colors, while keeping the same silhouette shape).
Triumphant, glowing expression, radiant golden rim lighting. Leave the
bottom ~15% of the card's inner area as a simple, uncluttered space (no
text) for a card-name overlay to be added later. No text, no logos, no
numbers. Entire canvas outside the card's own decorative silhouette
must be fully transparent (alpha 0). Portrait orientation, 1060x1484,
PNG with alpha channel.
```

---

## 12. 우왁굳 — `woowakgood` — 샴페인 골드+차콜 · 벤치에 있던 감독 (숨겨진 보너스 카드)

**11명 카드를 전부 뽑아야만 등장하는 숨겨진 카드** — TOTY 3D 카드의 "숨겨진 우왁굳 보너스 카드"(`useWoowakgoodBonusUnlock.ts`)와 똑같은 방식으로 구현됨: 뽑았던 11장이 전부 채워지는 순간 화면 상단에 "숨겨진 카드가 공개되었습니다" 안내가 뜨고(`FortuneBonusAnnounce.tsx`), 그 다음부터 운세 뽑기 풀에 이 카드가 섞여서 나올 수 있음(`fortuneWoowakgoodCard.ts`). roster.yaml에 없는 인물이라 다른 11장과 달리 스트리머 실사진 대신 **우왁굳 본인 참고 사진**을 얼굴 레퍼런스로 첨부.

카드 이름·운세 문구는 이미 확정됨 — 우왁굳이 원래는 감독(그라운드 밖에서 지시만 내리는 역할)인데, 벤치에 가만히 못 있고 몰래 유니폼으로 갈아입고 심판 눈을 피해 경기에 난입한다는 컨셉의 **개그 카드**. **이미지도 이 상황을 코믹하게 담아야 함** — 실력과 무관하게 텐션만 넘치는 느낌.

**카드 앞면** (우왁굳 참고 사진 + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely for this player (this is a hidden bonus card, so a
slightly more lavish/eye-catching ornament treatment than the regular 11
is fine, similar in spirit to the "special rarity" card but with its own
champagne-gold palette, not gold-and-violet dragon).

A cute chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card, but played for laughs (a comedic scene, not a
solemn one) — big head small body, 2-3 head-tall proportions. The
character (from the attached reference photo, keep his actual face and
likeness clearly recognizable) is a soccer team's manager who couldn't
resist watching from the bench any longer: his tracksuit jacket is
flying open mid-sprint to reveal a hastily half-buttoned team jersey
underneath, one sock comically slipping down, a coach's whistle and
clipboard flung into the air behind him with papers scattering
everywhere, sprinting onto the pitch with a huge determined grin and
comically wide eyes. In the background, a shocked referee blows a
whistle and points dramatically at him, and small chibi teammates on
the sideline are doubled over laughing. Champagne-gold and charcoal
color palette (his tracksuit/manager colors), small whistle and
scattered-paper flourishes decorate the corner ornaments (replacing the
back's mint-gold cosmic motif with this palette, while keeping the same
silhouette shape). Chaotic, joyful, over-the-top comedic energy, warm
golden rim lighting. Leave the bottom ~15% of the card's inner area as a
simple, uncluttered space (no text) for a card-name overlay to be added
later. No text, no logos, no numbers. Entire canvas outside the card's
own decorative silhouette must be fully transparent (alpha 0). Portrait
orientation, 1060x1484, PNG with alpha channel.
```

**파일명**: `woowakgood-fortune-card.webp` (다른 11장과 동일 규칙, `src/web/assets/fortune/`에 저장)

**효과음**: `/sfxes/woowakgood.mp3` (기존 3D 카드 기능의 우왁굳 보너스 카드와 동일 파일 재사용).

---

## 12-2. 우왁굳 (두 번째 카드) — `woowakgood2` — 짙은 적갈+차콜 · "왁초리" 패러디 (숨겨진 보너스 카드) — 안 좋은 내용

**1번 우왁굳 카드와 함께 묶여서 언락되는 두 번째 숨겨진 카드** — 11명 전원의 카드를 전부 뽑으면(1번 카드 포함 총 22장) `useFortuneBonusUnlock.ts`가 언락시키는데, 이번엔 우왁굳 카드가 1장이 아니라 2장(`FORTUNE_WOOWAKGOOD_CARDS`) 한꺼번에 뽑기 풀에 섞여 들어감 — 순차 언락이 아니라 둘 다 동시에 나타남. 1번 카드(신나는 개그, 텐션 만점)와 정반대로 **"왁초리"(우왁굳 + 회초리)라는 패러디 컨셉의 안 좋은 내용 카드**임(사용자 요청) — 우왁굳이 회초리를 든 무서운 코치 모드로 등장해서 팀 전체가 얼어붙는다는 컨셉. roster.yaml에 없는 인물이라 1번 카드와 마찬가지로 **우왁굳 본인 참고 사진**을 얼굴 레퍼런스로 첨부.

**카드 앞면** (우왁굳 참고 사진 + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely for this second hidden bonus card (do NOT reuse this
player's first tarot card's joyful champagne-gold "sneaking onto the
pitch" look — this is the polar-opposite mood: same "special/hidden
rarity" lavish ornament treatment is fine, but in a dark, ominous
palette instead).

A chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card, but in an unsettling, dread-inducing mood (NOT
comedic this time — a serious, foreboding scene) — big head small body,
2-3 head-tall proportions. The character (from the attached reference
photo, keep his actual face and likeness clearly recognizable) stands
perfectly still at the center in full coach's tracksuit, properly
zipped up (unlike his chaotic first card), holding a long thin wooden
switch/cane in one hand, slowly tapping it against his other open palm;
his expression has gone sharp and stern, a faint shadow cast over his
eyes. Behind him a chalkboard looms with only harsh red scribbled X
marks and slash-marks on it (no readable text or numbers). In the
foreground, small chibi teammate silhouettes huddle together, frozen
stiff and wide-eyed with fear, one visibly trembling — visually telling
the story "the fun coach is gone; today's training is going to hurt."
Deep blood-red and charcoal color palette (a darker, harsher inversion
of the first card's champagne-gold/charcoal), small switch/cane and
jagged crack flourishes decorate the corner ornaments (replacing the
back's mint-gold cosmic motif with this palette, while keeping the same
silhouette shape). Cold, harsh, dramatic side lighting with a long
ominous shadow stretching from the character. Leave the bottom ~15% of
the card's inner area as a simple, uncluttered space (no text) for a
card-name overlay to be added later. No text, no logos, no numbers, no
readable words of any kind anywhere in the scene. Entire canvas outside
the card's own decorative silhouette must be fully transparent (alpha
0). Portrait orientation, 1060x1484, PNG with alpha channel.
```

**파일명**: `woowakgood2-fortune-card.webp` (다른 카드들과 동일 규칙, `src/web/assets/fortune/`에 저장)

**효과음**: 사용자가 직접 추가 예정 — **`public/sfxes/wakchori.mp3`** 라는 이름으로 그 폴더에 넣으면 됨(`fortuneWoowakgoodCard.ts`의 `FORTUNE_WOOWAKGOOD_CARD_2`에 이미 이 경로가 `sfxOverride`로 지정되어 있어서, 파일만 추가하면 코드 수정 없이 바로 재생됨 — 파일이 없는 동안에는 조용히 무음 처리됨).

---

## 13. 재닌 (두 번째 카드) — `janine95kim2` — 겨자색+차콜 · 도라에몽 퉁퉁이 패러디 (GK, 보너스 카드) — ✅ 이미지 완료

**12번 우왁굳과 달리 숨겨진 카드가 아님** — 처음부터 나머지 11장과 함께 항상 뽑기 풀에 포함되는 재닌만의 두 번째 카드. 재닌이 평소 목소리가 걸걸하고 노래를 잘 못해서 팬들 사이에서 도라에몽 "퉁퉁이"(그 유명한 음치 골목 리사이틀 캐릭터)라는 별명으로 불리는 걸 패러디함. 얼굴은 재닌 본인 그대로, 의상·체형·포즈만 퉁퉁이 스타일을 입힌 합성 캐릭터로 그림(다른 카드들처럼 진지한 톤이 아니라 12번 우왁굳 카드처럼 개그 톤). 10번 원래 카드의 서리(얼음) 모티프는 "포효가 너무 강력해서 상대가 얼어붙는다"는 개그로 재해석해 소리 충격파가 서리로 얼어붙는 형태로 살짝 남겨둠.

**카드 앞면** (①카드 뒷면 레퍼런스 + ②재닌 실제 참고 사진[얼굴 레퍼런스] + ③도라에몽 퉁퉁이 캐릭터 참고 이미지[의상·체형·포즈 레퍼런스], 이 순서로 총 3장 첨부 — 프롬프트 안의 "second/third attached image"가 이 순서를 가리킴):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely for this player's second/bonus card (do NOT reuse
this player's 3D-card look of sky-blue with aurora ribbons, and do NOT
reuse this player's own first tarot card's "frost goalkeeper" concept
either — this is a separate, standalone comedic design for a second
card).

Using the second attached photo (the player's own face) for the face —
this must clearly be the same person as that reference photo (keep her
actual face and hairstyle recognizable). Using the third attached image
(a well-known bully character from a classic Japanese kids' cartoon,
known for his terrible off-key singing recitals that clear the whole
neighborhood) ONLY as a costume/body-type/pose reference — dress the
player's character in that character's signature mustard-yellow
round-neck knit sweater with dark ribbed trim, give her that same
stocky, sturdy, confident chibi body type and cocky "neighborhood boss"
stance (one fist on hip, chest out), but keep it clearly HER face, not
his.

A cute chibi/SD-style tarot illustration played for laughs (a comedic
scene, not a solemn one) — big head small body, 2-3 head-tall
proportions, composed like a real Major-Arcana tarot card. The character
stands on a small overturned crate like a makeshift stage, mid-shout
with her mouth wide open belting out an off-key note, holding a dented
tin-can "microphone"; visible sound-wave rings blast outward from her
mouth and crystallize into sharp ice crystals as they travel, freezing a
dark silhouetted striker and the ball solid in mid-air just before the
goal line — visually telling the story "her battle-cry is so loud and
off-key it freezes the shot cold, nothing gets past this recital."
Mustard-yellow and deep charcoal color palette with pale icy-cyan crack
accents where the sound freezes, small musical-note and ice-crystal
flourishes decorate the corner ornaments (replacing the back's
mint-gold cosmic motif with this player's own colors, while keeping the
same silhouette shape). Comically confident, eyes-closed belting
expression, warm mischievous energy despite the icy effect. Leave the
bottom ~15% of the card's inner area as a simple, uncluttered space (no
text) for a card-name overlay to be added later. No text, no logos, no
numbers. Entire canvas outside the card's own decorative silhouette
must be fully transparent (alpha 0). Portrait orientation, 1060x1484,
PNG with alpha channel.
```

**파일명**: `janine95kim2-fortune-card.webp` (다른 카드들과 동일 규칙, `src/web/assets/fortune/`에 저장 — 이미 생성 완료)

**효과음**: 본인의 원래 카드(`janine95kim`, `jaenin.mp3`)와 겹치지 않도록, git 히스토리에서 복원한 재닌의 예전 효과음을 `public/sfxes/jaenin-tongtongi.mp3`로 별도 저장하고 `fortuneCardData.ts`의 `janine95kim2` 항목에서 `sfxOverride`로 지정해뒀음(코드가 `streamers` 목록의 `sfx`를 자동으로 가져오는 대신 이 값을 우선 사용함).

---

## 14. 하치 (두 번째 카드) — `hachi972` — 주황+차콜 · "두고하치" 밈 패러디 (WF, 보너스 카드)

**12번 우왁굳과 달리 숨겨진 카드가 아님** — 처음부터 나머지 카드들과 함께 항상 뽑기 풀에 포함되는 하치만의 두 번째 카드. 하치가 우왁굳에게 어떤 게임을 강력 추천해서 실제로 플레이까지 이어졌는데, 그 결과가 호불호가 갈리면서 일부 팬들이 "두고보자"와 "하치"를 합쳐 "두고하치..."라는 채팅을 치는 게 굳어져 밈이 된 걸 패러디함. **이미지와 문구 어디에도 실제 게임 이름은 넣지 않고**, "두고하치"라는 밈과 그 반응(전혀 안 무섭고 코믹하게 그를 벼르는 작은 군중)만으로 장면을 구성함. 11번 원래 카드(황금 드래곤)의 진지한 판타지 톤이 아니라 **12번 우왁굳 카드처럼 개그 톤**.

**카드 앞면** (하치 참고 사진 + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely for this player's second/bonus card (do NOT reuse
this player's first tarot card's golden-dragon look — this is a
separate, standalone comedic design for a second card, parodying the
traditional "Judgement" Major Arcana card instead).

A cute chibi/SD-style tarot illustration played for laughs (a comedic
scene, not a solemn one) — big head small body, 2-3 head-tall
proportions. The character (from the attached reference photo, keep his
actual face and likeness clearly recognizable) stands triumphantly in
the foreground, grinning obliviously wide as he enthusiastically holds
a glowing golden game controller high overhead like a torch, clearly in
the middle of confidently recommending something to someone off-frame;
below and behind him, rising out of a low mist, a small crowd of tiny
dark shadow-silhouette chibi figures shake tiny fists and wave tiny
blank pitchfork-shaped banners (no readable text or symbols on them),
narrow-eyed and comically vengeful rather than genuinely scary —
visually telling the story "he recommends something with total
confidence, chaos follows, and somewhere out there a small crowd is
quietly plotting revenge... which never actually arrives." Warm gold
(his own signature color) mixed with a deep burnt-orange and charcoal
"warning" color palette, small tiny-pitchfork and warning-spark
flourishes decorate the corner ornaments (replacing the back's
mint-gold cosmic motif with this palette, while keeping the same
silhouette shape). Oblivious, beaming, over-the-top confident
expression up front contrasted with the comically ominous crowd below,
warm golden rim lighting fading into dramatic orange backlight from the
crowd. Leave the bottom ~15% of the card's inner area as a simple,
uncluttered space (no text) for a card-name overlay to be added later.
No text, no logos, no numbers, no readable words of any kind anywhere
in the scene. Entire canvas outside the card's own decorative
silhouette must be fully transparent (alpha 0). Portrait orientation,
1060x1484, PNG with alpha channel.
```

**파일명**: `hachi972-fortune-card.webp` (다른 카드들과 동일 규칙, `src/web/assets/fortune/`에 저장)

**효과음**: 본인의 원래 카드(`hachi97`, `hachi.mp3`)와 겹치지 않는 전용 효과음 — **`public/sfxes/hachi-dugohachi.mp3`** (이미 추가 완료). `fortuneCardData.ts`의 `hachi972` 항목에 이 경로가 `sfxOverride`로 지정되어 있어서 바로 재생됨. 나중에 파일을 다른 걸로 교체하고 싶으면 같은 파일명으로 덮어쓰기만 하면 됨(코드 수정 불필요).

---

## 15. 다시바 (두 번째 카드) — `tdnlamuron2` — 은빛+백금 · "수은추" 별명 패러디 (WF, 보너스 카드)

**12번 우왁굳과 달리 숨겨진 카드가 아님** — 처음부터 나머지 카드들과 함께 항상 뽑기 풀에 포함되는 다시바만의 두 번째 카드. 다시바는 "수은추"라는 별명이 있음 — "수은"은 리그 오브 레전드에서 모든 디버프를 제거하는 아이템 "수은 장식띠"에서 따온 말로 안 좋은 분위기를 환기시키거나 곁에 있으면 힐링되는 사람을 뜻하고, "추"는 실제로는 여자인데 장난삼아 "남자"라고 놀리는 접미사임. 이미지는 그 "수은"(정화/디버프 제거) 쪽을 정면으로 살려서 그리고, 성별을 놀리는 뉘앙스는 카드 이름·운세 문구 쪽에서만 살짝 담음. 1번 원래 카드(진홍빛 혜성)와는 완전히 다른 은빛/백금 "정화" 팔레트.

**카드 앞면** (다시바 참고 사진 + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely for this player's second/bonus card (do NOT reuse
this player's first tarot card's crimson-comet look, and do NOT reuse
this player's 3D-card look of orange volcanic rock/lava either — this
is a separate, standalone design for a second card).

A cute chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card (parodying the traditional "Temperance" card's
purifying, harmonizing energy) — big head small body, 2-3 head-tall
proportions. The character (from the attached reference photo) walks
forward with a cool, confident, effortless swagger, hands loosely in
pockets, a faint knowing half-smile; a soft argent-silver cleansing
aura radiates outward from her like liquid mercury, and as it washes
over two small shadow-silhouette teammates flanking her, dark
chain-like tangles and gloomy storm-cloud wisps clinging to them
visibly dissolve into bright silver sparkles and drift away — visually
telling the story "she doesn't even try, and the bad vibes just wash
right off everyone around her." A pair of small stylized winged silver
ankle-bands glint faintly at her feet (a subtle nod to a
cleansing/purification charm, not any specific real-world logo or
brand). Silver-white and pale platinum color palette with the faintest
warm gold shimmer, small winged-anklet and mercury-droplet flourishes
decorate the corner ornaments (replacing the back's mint-gold cosmic
motif with this palette, while keeping the same silhouette shape).
Cool, breezy, unbothered confident expression, soft silver rim
lighting. Leave the bottom ~15% of the card's inner area as a simple,
uncluttered space (no text) for a card-name overlay to be added later.
No text, no logos, no numbers, no real brand names or game UI anywhere
in the scene. Entire canvas outside the card's own decorative
silhouette must be fully transparent (alpha 0). Portrait orientation,
1060x1484, PNG with alpha channel.
```

**파일명**: `tdnlamuron2-fortune-card.webp` (다른 카드들과 동일 규칙, `src/web/assets/fortune/`에 저장)

**효과음**: 전용 효과음 `public/sfxes/tdnlamuron-2.mp3` (사용자가 직접 추가, `fortuneCardData.ts`의 `tdnlamuron2` 항목에 `sfxOverride`로 지정되어 있음).

---

## 16~23. 나머지 8명의 두 번째 카드 — 전부 "역방향 타로"(안 좋은 내용)

아래 8장은 재닌/하치/다시바처럼 특정 밈을 패러디한 게 아니라, **그 선수의 1번 카드를 정반대로 뒤집은 "리버스 카드"**임 — 소품·구도·모티프는 1번 카드와 거의 그대로 이어가되 결과만 실패로 뒤집는 방식(실제 타로에서 같은 카드의 정방향/역방향이 정반대 의미를 갖는 것과 동일한 원리). **8장 전부 안 좋은 내용**(사용자 요청)이라 이 문서의 다른 카드들과 톤이 다름 — 12번 우왁굳처럼 웃긴 개그가 아니라, 실제 타로의 역방향 메이저 카드(The Tower, Ten of Swords 등)처럼 **진지하고 불길한 분위기**로 그려야 함. 캐릭터 스타일 자체(chibi/SD)는 다른 카드들과 동일하게 유지. 8장 모두 전용 효과음 없이 원래 카드의 sfx를 그대로 재사용함.

### 16. 쥬멩이 (두 번째 카드) — `ju0102282` — 탁한 황갈+회갈 · 저무는 태양 (ST)

**카드 앞면** (쥬멩이 참고 사진 + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely for this player's second/bonus card (do NOT reuse
this player's 3D-card look of lime-green vines, and do NOT reuse this
player's own first tarot card's bright golden-sunrise look either —
this is the "reversed" mirror-image of that first card: same pose
language, opposite fortune).

A chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card, but in its REVERSED / bad-omen reading (a
somber, foreboding mood, not comedic) — big head small body, 2-3
head-tall proportions. The character (from the attached reference
photo) stands in the same triumphant arms-raised pose as their first
card, but the sun behind them is now a dim, dying orange disc being
swallowed by an eclipse-like shadow; the once-radiant sunbeams have gone
dull and grey, wilting like dry grass. A faint trail of light still arcs
from their foot toward a goal net in the distance, but it visibly curves
and fizzles out just short of the goal line — visually telling the
story "the momentum that used to carry every shot home has quietly run
out today." Dull burnt-ochre and ash-grey color palette (a faded,
sun-drained version of the first card's gold/orange), small wilted-ray
and dying-ember flourishes decorate the corner ornaments (replacing the
back's mint-gold cosmic motif with this palette, while keeping the same
silhouette shape). Deflated, quietly disappointed expression, flat
overcast lighting. Leave the bottom ~15% of the card's inner area as a
simple, uncluttered space (no text) for a card-name overlay to be added
later. No text, no logos, no numbers. Entire canvas outside the card's
own decorative silhouette must be fully transparent (alpha 0). Portrait
orientation, 1060x1484, PNG with alpha channel.
```

**파일명**: `ju0102282-fortune-card.webp`

**효과음**: 전용 효과음 `public/sfxes/ju010228-2.mp3` (사용자가 직접 추가, `fortuneCardData.ts`의 `ju0102282` 항목에 `sfxOverride`로 지정되어 있음).

---

### 17. 문모모 (두 번째 카드) — `doormomo2` — 슬레이트 그레이+금 간 은빛 · 깨진 거울 (CDM)

**카드 앞면** (문모모 참고 사진 + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely for this player's second/bonus card (do NOT reuse
this player's 3D-card look of violet runes/magic-circles, and do NOT
reuse this player's own first tarot card's calm navy-silver mirror look
either — this is the "reversed" mirror-image of that first card: same
pose language, opposite fortune).

A chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card, but in its REVERSED / bad-omen reading (a
somber, foreboding mood, not comedic) — big head small body, 2-3
head-tall proportions. The character (from the attached reference
photo) holds up the same ornate hand mirror as their first card, but
now it's visibly cracked with a jagged spiderweb fracture across it; the
tiny reflection of the soccer pitch inside is warped and upside-down,
and the thin thread of silver-blue light that once extended toward a
perfect pass now splits into several directions and scatters uselessly
— visually telling the story "the clear sight that once saw everything
now shows only a distorted, unreliable picture." Slate-grey and
tarnished silver color palette (a cracked, dimmed version of the first
card's navy/silver), small crack-line and shattered-star-map flourishes
decorate the corner ornaments (replacing the back's mint-gold cosmic
motif with this palette, while keeping the same silhouette shape).
Uneasy, second-guessing expression, cold flat lighting with a harsh
crack-shaped shadow across the face. Leave the bottom ~15% of the
card's inner area as a simple, uncluttered space (no text) for a
card-name overlay to be added later. No text, no logos, no numbers.
Entire canvas outside the card's own decorative silhouette must be
fully transparent (alpha 0). Portrait orientation, 1060x1484, PNG with
alpha channel.
```

**파일명**: `doormomo2-fortune-card.webp`

**효과음**: 전용 효과음 `public/sfxes/doormomo-2.mp3` (사용자가 직접 추가, `fortuneCardData.ts`의 `doormomo2` 항목에 `sfxOverride`로 지정되어 있음).

---

### 18. 뽀린걸 (두 번째 카드) — `bboringirl2` — 녹슨 오렌지+갈색 · 녹슨 엔진 (CM)

**카드 앞면** (뽀린걸 참고 사진 + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely for this player's second/bonus card (do NOT reuse
this player's 3D-card look of gunmetal-gray mecha armor/red circuits,
and do NOT reuse this player's own first tarot card's burnished-bronze
ember-heart look either — this is the "reversed" mirror-image of that
first card: same pose language, opposite fortune).

A chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card, but in its REVERSED / bad-omen reading (a
somber, foreboding mood, not comedic) — big head small body, 2-3
head-tall proportions. The character (from the attached reference
photo), in the same small warrior armor as their first card, now stands
slumped with one knee bent, the once-glowing ember-red heart in their
breastplate reduced to grey smothered ash with only a faint dying
flicker; behind them the hourglass that used to endlessly refill itself
now sits cracked and completely empty, its sand spilled and still —
visually telling the story "even the engine that never tired has
finally run dry, and today it stalls early." Rusted burnt-orange and
dull ash-brown color palette (a corroded, faded version of the first
card's burgundy/bronze), small broken-gear and cold-ember flourishes
decorate the corner ornaments (replacing the back's mint-gold cosmic
motif with this palette, while keeping the same silhouette shape).
Exhausted, drained expression, dim flat lighting. Leave the bottom ~15%
of the card's inner area as a simple, uncluttered space (no text) for a
card-name overlay to be added later. No text, no logos, no numbers.
Entire canvas outside the card's own decorative silhouette must be
fully transparent (alpha 0). Portrait orientation, 1060x1484, PNG with
alpha channel.
```

**파일명**: `bboringirl2-fortune-card.webp`

**효과음**: 전용 효과음 `public/sfxes/bboringirl-2.mp3` (사용자가 직접 추가, `fortuneCardData.ts`의 `bboringirl2` 항목에 `sfxOverride`로 지정되어 있음).

---

### 19. 한결 (두 번째 카드) — `kaksjak07302` — 탁한 자수정+회보라 · 빗나간 화살 (CM)

**카드 앞면** (한결 참고 사진 + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely for this player's second/bonus card (do NOT reuse
this player's 3D-card look of deep-black shattered glass shards, and do
NOT reuse this player's own first tarot card's calm silver-moonlight
archer look either — this is the "reversed" mirror-image of that first
card: same pose language, opposite fortune).

A chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card, but in its REVERSED / bad-omen reading (a
somber, foreboding mood, not comedic) — big head small body, 2-3
head-tall proportions. The character (from the attached reference
photo), the same calm moonlit archer as their first card, releases the
same silver-moonlight arrow, but this time it visibly curves and veers
wide past a goalpost silhouette in the distance, breaking apart into
scattered dim light shards instead of striking true; the full moon
behind them is half-swallowed by drifting storm clouds. — visually
telling the story "even the steadiest hand can overreach, and tonight
the shot drifts just wide." Muted amethyst and dull grey-violet color
palette (a dimmed, clouded version of the first card's silver/plum),
small broken-arrow and clouded-crescent flourishes decorate the corner
ornaments (replacing the back's mint-gold cosmic motif with this
palette, while keeping the same silhouette shape). Tense, faintly
frustrated expression, cold dim moonlight partly obscured by shadow.
Leave the bottom ~15% of the card's inner area as a simple, uncluttered
space (no text) for a card-name overlay to be added later. No text, no
logos, no numbers. Entire canvas outside the card's own decorative
silhouette must be fully transparent (alpha 0). Portrait orientation,
1060x1484, PNG with alpha channel.
```

**파일명**: `kaksjak07302-fortune-card.webp`

**효과음**: 전용 효과음 `public/sfxes/kaksjak0730-2.mp3` (사용자가 직접 추가, `fortuneCardData.ts`의 `kaksjak07302` 항목에 `sfxOverride`로 지정되어 있음).

---

### 20. 핑구 (두 번째 카드) — `sjh40182` — 무너진 석재 회색 · 무너지는 요새 (CB)

**카드 앞면** (핑구 참고 사진 + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely for this player's second/bonus card (do NOT reuse
this player's 3D-card look of pastel sky-blue clouds/feathers, and do
NOT reuse this player's own first tarot card's steel-blue/marble-white
guardian-knight look either — this is the "reversed" mirror-image of
that first card: same pose language, opposite fortune).

A chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card, but in its REVERSED / bad-omen reading (a
somber, foreboding mood, not comedic) — big head small body, 2-3
head-tall proportions. The character (from the attached reference
photo), the same small guardian knight as their first card, still
leaps from the same floating rampart, but now visible cracks are
spreading across the marble-white stone and chunks are crumbling away
beneath their feet; the large shield they raise has a spiderweb crack
across it, and this time the dark shadowy comet is breaking straight
through it instead of bouncing off — visually telling the story "the
wall that never broke finally shows a crack, right when it matters
most." Weathered stone-grey and dull steel color palette (a cracked,
crumbling version of the first card's steel-blue/marble-white), small
falling-rubble and crack-line flourishes decorate the corner ornaments
(replacing the back's mint-gold cosmic motif with this palette, while
keeping the same silhouette shape). Startled, off-balance expression,
harsh cold overcast lighting. Leave the bottom ~15% of the card's inner
area as a simple, uncluttered space (no text) for a card-name overlay
to be added later. No text, no logos, no numbers. Entire canvas outside
the card's own decorative silhouette must be fully transparent (alpha
0). Portrait orientation, 1060x1484, PNG with alpha channel.
```

**파일명**: `sjh40182-fortune-card.webp`

**효과음**: 전용 효과음 `public/sfxes/sjh4018-2.mp3` (사용자가 직접 추가, `fortuneCardData.ts`의 `sjh40182` 항목에 `sfxOverride`로 지정되어 있음).

---

### 21. 해파린 (두 번째 카드) — `haepalin2` — 짙은 폭풍청 · 휩쓸리는 파도 (CB)

**카드 앞면** (해파린 참고 사진 + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely for this player's second/bonus card (do NOT reuse
this player's 3D-card look of lavender-purple deep-sea jellyfish, and
do NOT reuse this player's own first tarot card's calm sage-green lake
look either — this is the "reversed" mirror-image of that first card:
same pose language, opposite fortune).

A chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card, but in its REVERSED / bad-omen reading (a
somber, foreboding mood, not comedic) — big head small body, 2-3
head-tall proportions. The character (from the attached reference
photo) stands at the edge of the same lake as their first card, but it
has turned into a churning, stormy whirlpool; the ribbons of water they
once used to calmly bind an exhausted opponent are now wrapped around
their OWN ankles instead, visibly pulling them off balance, while the
dark shadow-silhouette figure that used to tire out first now looms
larger and reaches toward them — visually telling the story "the
patience that always outlasted the opponent finally runs out first
today." Dark storm-teal and murky slate-blue color palette (a
turbulent, darkened version of the first card's sage-green/grey-blue),
small churning-whirlpool and storm-spray flourishes decorate the corner
ornaments (replacing the back's mint-gold cosmic motif with this
palette, while keeping the same silhouette shape). Off-balance,
startled expression, cold stormy lighting. Leave the bottom ~15% of the
card's inner area as a simple, uncluttered space (no text) for a
card-name overlay to be added later. No text, no logos, no numbers.
Entire canvas outside the card's own decorative silhouette must be
fully transparent (alpha 0). Portrait orientation, 1060x1484, PNG with
alpha channel.
```

**파일명**: `haepalin2-fortune-card.webp`

**효과음**: 전용 효과음 `public/sfxes/haepalin-2.mp3` (사용자가 직접 추가, `fortuneCardData.ts`의 `haepalin2` 항목에 `sfxOverride`로 지정되어 있음).

---

### 22. 리냐 (두 번째 카드) — `lina01082` — 탁한 자보라+회색 · 엇나간 갈림길 (FB)

**카드 앞면** (리냐 참고 사진[사시 특징 포함] + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely for this player's second/bonus card (do NOT reuse
this player's 3D-card look of vivid pink cherry blossoms, and do NOT
reuse this player's own first tarot card's shimmering opal crossroads
look either — this is the "reversed" mirror-image of that first card:
same pose language, opposite fortune).

A chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card, but in its REVERSED / bad-omen reading (a
somber, foreboding mood, not comedic) — big head small body, 2-3
head-tall proportions. The character (from the attached reference
photo, keeping her distinctive slightly wall-eyed/cross-eyed gaze
exactly as shown — still an endearing quirk, not the source of the bad
luck here) stands at the same glowing crossroads as their first card,
with the same two shimmering trails of light diverging from her eyes —
but this time BOTH trails wander off and dead-end into withered, thorny
dark hedges with no goal or chance in sight, the once-glowing flowers
along the path now wilted and grey — visually telling the story
"even her unpredictable luck runs out sometimes, and today both paths
lead nowhere." Faded murky violet and ash-grey color palette (a dimmed,
withered version of the first card's opal/teal/lavender), small wilted
petal and dead-end-path flourishes decorate the corner ornaments
(replacing the back's mint-gold cosmic motif with this palette, while
keeping the same silhouette shape). Confused, slightly deflated
expression, flat dim lighting. Leave the bottom ~15% of the card's
inner area as a simple, uncluttered space (no text) for a card-name
overlay to be added later. No text, no logos, no numbers. Entire canvas
outside the card's own decorative silhouette must be fully transparent
(alpha 0). Portrait orientation, 1060x1484, PNG with alpha channel.
```

**파일명**: `lina01082-fortune-card.webp`

**효과음**: 전용 효과음 `public/sfxes/lina0108-2.mp3` (사용자가 직접 추가, `fortuneCardData.ts`의 `lina01082` 항목에 `sfxOverride`로 지정되어 있음).

---

### 23. 빙밍 (두 번째 카드) — `tleod18182` — 그을린 터콰이즈 · 헛디딘 질주 (FB)

**카드 앞면** (빙밍 참고 사진 + 카드 뒷면 레퍼런스):
```
Using the attached card-back image ONLY as a silhouette/structure
reference — same rounded-rectangle card body with gold filigree
ornaments curling outward past the edges at all four corners, same
small arched crest above the top-center edge, same small pointed
finial below the bottom-center edge — but redesign the illustration and
palette completely for this player's second/bonus card (do NOT reuse
this player's 3D-card look of deep-navy storm clouds/emerald lightning,
and do NOT reuse this player's own first tarot card's bright turquoise
cliff-sprint look either — this is the "reversed" mirror-image of that
first card: same pose language, opposite fortune).

A chibi/SD-style mystical tarot illustration composed like a real
Major-Arcana tarot card, but in its REVERSED / bad-omen reading (a
somber, foreboding mood, not comedic) — big head small body, 2-3
head-tall proportions. The character (from the attached reference
photo) sprints along the same coastal cliff edge as their first card,
the same ribbon of turquoise lightning trailing from their heel — but
this time they're caught mid-stumble, one foot catching on nothing,
body pitching off balance; the lightning trail crackles erratically and
snaps back on itself instead of reaching a teammate, and the ball
squirts away from their control toward the cliff's edge — visually
telling the story "speed without control just trips over its own
feet." Scorched dull turquoise and ash-grey color palette (a dimmed,
static-crackling version of the first card's bright turquoise/white),
small broken-lightning and stumbling-dust flourishes decorate the
corner ornaments (replacing the back's mint-gold cosmic motif with this
palette, while keeping the same silhouette shape). Startled,
off-balance expression, harsh flickering lighting. Leave the bottom
~15% of the card's inner area as a simple, uncluttered space (no text)
for a card-name overlay to be added later. No text, no logos, no
numbers. Entire canvas outside the card's own decorative silhouette
must be fully transparent (alpha 0). Portrait orientation, 1060x1484,
PNG with alpha channel.
```

**파일명**: `tleod18182-fortune-card.webp`

**효과음**: 전용 효과음 `public/sfxes/tleod1818-2.mp3` (사용자가 직접 추가, `fortuneCardData.ts`의 `tleod18182` 항목에 `sfxOverride`로 지정되어 있음).

---

## 공용 팝업 에셋

### `fortune-popup-backdrop.webp` (2560×1440, 불투명)

```
A premium dark studio showcase backdrop for a mystical tarot-reading
popup. A cozy dim witch's study / starlit library at night — soft candle
glow, distant floating dust motes, a faint hint of bookshelves and star
charts fading into darkness, deep navy-to-black gradient overall. Low
contrast, desaturated, moody and cinematic — neutral enough that bright
tarot cards and character art placed in front of it will stand out
clearly. No text, no logos, no readable shapes, no bright highlights.
Ultra-wide, minimal, elegant, 4K, 2560x1440.
```

### `fortune-popup-backdrop-glow.webp` (2560×1440, 알파 채널 있는 투명 PNG)

```
Abstract loose particle/light-effect overlay ONLY, ultra-wide, 2560x1440.
Softly drifting golden-mint sparkle motes and faint floating star
glints, like magical dust in candlelight — sparse and soft, concentrated
toward the edges and corners, keep the vertical center column (where the
popup content sits) mostly clear. No solid material, no border/frame, no
characters, no text — this is a light layer meant to be composited on
top of the popup backdrop, not a full scene. High detail, soft glow
bloom, 4K. Entire canvas outside the glowing particles themselves must
stay fully transparent (alpha 0), transparent PNG.
```

### `fortune-title.webp` (약 1400×420, 알파 채널 있는 투명 PNG)

```
A decorative fantasy typography lockup reading "오늘의 운세 뽑아보기" in
Korean, designed as an ornate mystical/tarot-style title graphic — gold
and mint-teal color scheme, delicate star and crescent-moon flourishes
around the lettering, elegant serif-ish fantasy lettering style (legible
Korean Hangul, not decorative to the point of being unreadable). No
background, no box, no frame — just the lettering and its small
decorative flourishes floating on transparent space. Landscape
orientation, roughly 1400x420, transparent PNG with alpha channel.
```

### `fortune-mascot.webp` (약 1200×1600, 알파 채널 있는 투명 PNG)

**우왁굳 참고 사진을 반드시 같이 첨부** — 마녀 복장의 얼굴이 우왁굳 본인이어야 함(코스프레하듯 우왁굳 얼굴/헤어 그대로에 마녀 옷만 입힌 느낌).

```
Using the attached reference photo for the face — this must clearly be
the same person as the reference photo (keep his actual face, hairstyle
and likeness recognizable, like he's cosplaying as a witch rather than
becoming a generic fantasy character). Draw him wearing a witch's cloak
and a pointed witch hat over his own look, holding a glowing tarot card
in one hand, warm mischievous mystical smile, standing in a confident
half-body/three-quarter pose as if presenting a fortune-telling show to
the viewer. Soft magical sparkle particles around the hands. Mint-teal
and gold color accents on the witch outfit. No background, no frame, no
text — character cutout only, floating on transparent space. Portrait
orientation, roughly 1200x1600, transparent PNG with alpha channel.
```

*(SD/치비 톤으로 맞출지, 카드들보다 조금 더 정성스러운 일러스트 톤으로 할지는 취향껏 — 어느 쪽이든 코드 동작에는 영향 없음. 얼굴만큼은 레퍼런스 사진과 동일 인물로 나오는지 꼭 확인.)*

### `fortune-draw-button.webp` (약 560×160, 알파 채널 있는 투명 PNG)

```
A game-UI call-to-action button graphic reading "운세 뽑기" in Korean,
designed as an ornate mystical/tarot-style button — a rounded pill or
scroll-like shape with gold trim and a soft mint-teal glow, small star/
card-suit icon decorations flanking the text, glossy premium game-UI
finish (legible Korean Hangul text). No background beyond the button
shape itself — floating on transparent space so it can be placed
directly over the popup backdrop. Landscape orientation, roughly
560x160, transparent PNG with alpha channel.
```

*(버튼의 호버 상태는 별도 이미지 없이 웹에서 CSS로 밝기/확대 효과를 줄 예정이라 이 한 장이면 충분함.)*

> **"다시 뽑기" 버튼은 이미지가 아니라 일반 UI 엘리먼트(아이콘+텍스트 버튼)로 구현되어 있음** — 별도 이미지 생성 불필요.

---

## 필요 효과음 목록 & 검색 키워드

이미지와 별개로, 아래 효과음/배경음악 파일도 준비되면 `public/` 폴더(배경음악은 루트, 효과음은 `public/sfxes/`)에 아래 파일명으로 넣으면 자동으로 연결됨.

| 파일명 | 위치 | 용도 | 검색 키워드(한/영) |
|---|---|---|---|
| `fortune-bgm.mp3` | `public/` | 팝업 배경음악(루프) | "mystical ambient loop", "tarot reading background music", "신비로운 마법 배경음악", "fortune telling bgm loop" |
| `fortune-shuffle.mp3` | `public/sfxes/` | 카드 셔플 효과음 | "card shuffle sound effect", "tarot card shuffle sfx", "카드 섞는 소리" |
| `fortune-card-hover.mp3` | `public/sfxes/` | 카드 호버 시 | "magic chime hover", "soft sparkle ui sound", "마법 반짝임 효과음" |
| `fortune-card-select.mp3` | `public/sfxes/` | 카드 선택/플립 임팩트 | "card flip whoosh reveal", "magic reveal impact sound", "타로 카드 공개 효과음" |
