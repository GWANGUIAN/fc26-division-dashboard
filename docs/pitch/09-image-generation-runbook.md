# 09. 이미지 생성 실행 순서표 — 잔디동 피치 (ChatGPT gpt-image)

**#001부터 순서대로** 이미지를 만들 수 있게 정리한 실행 문서다. 각 스텝에 **저장 이름 / 스레드(새로 열지·이어서 할지) / 첨부할 레퍼런스 / 검수 체크 / 변환 명령 / 프롬프트(독립형)** 가 있다. 프롬프트는 스타일 문구를 **전부 풀어서** 담고 있어 복사해 그대로 붙여넣으면 된다. 총 **123스텝**(필드 플레이어 12명×8 + 골키퍼 5 + 환경·이펙트·UI 22).

> **이 문서는 스크립트로 생성된다.** 캐릭터 특징은 [04 §5](04-art-characters.md), 환경·UI 시트 규격과 셀 목록은 [05](05-art-world-and-ui.md)를 고친 뒤 `node docs/pitch/tools/build-image-runbook.mjs`를 실행한다. 프롬프트 **골격**(달리기/슛/개인기 문구 등)은 스크립트의 `charPrompt`·`keeperPrompt`·`sheetPrompt` 함수에 있다. 이 문서를 직접 고치면 재생성 시 덮어써진다.
>
> **잔디동 월드와 다른 컨셉**: 이 프롬프트들은 16비트 아케이드 스포츠·4.5등신·네이비 2px 외곽선·야간 경기장 조명이다. 월드 캐릭터/맵 이미지를 **레퍼런스로 첨부하지 않는다**(정체성 혼입 방지). [04 §0](04-art-characters.md) 비교표 참고.

## 사용법

1. 스텝의 **스레드** 지시를 따른다. `🆕 새 스레드`면 새 대화를 열고, `↪ 이어서`면 그 스레드를 만든 **같은 대화**에 계속 요청한다.
2. **레퍼런스 첨부**의 **필수** 파일을 올린 뒤 **프롬프트 전체**를 붙여넣는다. "(권장)/(선택)"은 일관성·톤이 흔들릴 때 올린다. 선수 레퍼런스(`tmp/pitch-src/refs/<id>-ref.png`)는 사용자가 가진 이미지를 해당 경로에 미리 복사해 둔다.
3. 결과를 **검수 체크**로 확인하고, 마음에 안 들면 같은 스레드에서 `Keep everything, but fix: …`로 수정 요청한다.
4. 통과하면 **저장 이름**으로 저장한다(폴더는 없으면 만든다). 다음 스텝의 레퍼런스가 이 파일이다.
5. 스텝 끝의 `- [ ]`를 체크한다. 변환은 구현 세션 A1에서 만드는 `pnpm convert:pitch-art`(각 스텝의 "변환" 줄).
6. 캔버스 크기는 프롬프트 문장에 적혀 있다(gpt-image: 1024×1024 / 1536×1024 / 1024×1536). 투명 배경이 안 나오면 `#FF00FF` 단색 배경 결과를 그대로 저장해도 된다(스크립트가 제거). **그리드 열×행과 프레임 순서**만 지켜지면 크기 드리프트는 스크립트가 처리한다.
7. 스레드가 길어져(대략 12장 이상) 품질이 떨어지면 새 스레드를 열고 **직전에 승인한 결과 1장**을 톤 샘플로 첨부한다.
8. **파일럿 우선**: Phase 1(우왁굳 8시트)을 끝까지 승인받은 뒤 다른 캐릭터를 시작한다. 이후 캐릭터 스레드에는 우왁굳 승인 시트를 "레이아웃·스타일 샘플"로 함께 첨부하되 **정체성은 복사하지 않는다**(프롬프트에 규칙이 들어 있음).
9. 글자·숫자가 이미지에 생기면 **재생성**한다(텍스트는 캔버스가 그린다).
10. 진행 표의 `[x]`=검토 통과, `[ ] 🔁`=**검토 후 재생성 필요**(스텝의 "상태(검토 결과)"에 이유와 수정 요청 문구가 있음). 셀 여백·후광·초상화 간격 규칙은 이 검토에서 얻은 것으로 모든 캐릭터 프롬프트에 이미 반영돼 있다([04 §8](04-art-characters.md)). **재생성은 수정 요청보다 새 프롬프트로 전체 다시 만드는 쪽을 권장**(같은 스레드에서 승인본 stand·idle을 다시 첨부).

## 세션 ↔ 페이즈 매핑

| 세션 | 페이즈 | 스텝 |
| --- | --- | --- |
| A1 | 1·2·3 | #001~#008, #009~#020, #021~#025 |
| A2 | 4·5 | #026~#113, #114~#116 |
| A3 | 6 | #117~#121 |
| P7 전후 | 7 | #122~#123 |

## 스레드 목록

| 스레드 | 설명 | 스텝 |
| --- | --- | --- |
| `T-PCH-woowakgood` | 캐릭터 1명 = 스레드 1개 (①→⑧ 이어서, **파일럿**) | #001, #002, #003, #004, #005, #006, #007, #008 |
| `T-PCH-ENV` | 환경·키아트 | #009, #010 … #123 (9장) |
| `T-PCH-FX` | 이펙트 | #012, #013, #116 |
| `T-PCH-UI` | UI (프레임이 스타일 앵커) | #014, #015 … #121 (10장) |
| `T-PCH-KEEPER` | AI 골키퍼 (K①→K⑤) | #021, #022, #023, #024, #025 |
| `T-PCH-janine95kim` | 캐릭터 1명 = 스레드 1개 (①→⑧ 이어서) | #026, #027, #028, #029, #030, #031, #032, #033 |
| `T-PCH-bboringirl` | 캐릭터 1명 = 스레드 1개 (①→⑧ 이어서) | #034, #035, #036, #037, #038, #039, #040, #041 |
| `T-PCH-sjh4018` | 캐릭터 1명 = 스레드 1개 (①→⑧ 이어서) | #042, #043, #044, #045, #046, #047, #048, #049 |
| `T-PCH-doormomo` | 캐릭터 1명 = 스레드 1개 (①→⑧ 이어서) | #050, #051, #052, #053, #054, #055, #056, #057 |
| `T-PCH-hachi97` | 캐릭터 1명 = 스레드 1개 (①→⑧ 이어서) | #058, #059, #060, #061, #062, #063, #064, #065 |
| `T-PCH-kaksjak0730` | 캐릭터 1명 = 스레드 1개 (①→⑧ 이어서) | #066, #067, #068, #069, #070, #071, #072, #073 |
| `T-PCH-ju010228` | 캐릭터 1명 = 스레드 1개 (①→⑧ 이어서) | #074, #075, #076, #077, #078, #079, #080, #081 |
| `T-PCH-haepalin` | 캐릭터 1명 = 스레드 1개 (①→⑧ 이어서) | #082, #083, #084, #085, #086, #087, #088, #089 |
| `T-PCH-tleod1818` | 캐릭터 1명 = 스레드 1개 (①→⑧ 이어서) | #090, #091, #092, #093, #094, #095, #096, #097 |
| `T-PCH-tdnlamuron` | 캐릭터 1명 = 스레드 1개 (①→⑧ 이어서) | #098, #099, #100, #101, #102, #103, #104, #105 |
| `T-PCH-lina0108` | 캐릭터 1명 = 스레드 1개 (①→⑧ 이어서) | #106, #107, #108, #109, #110, #111, #112, #113 |

## 진행 표

| # | 저장 이름 | 스레드 | 우선순위 | ✓ |
| --- | --- | --- | --- | --- |
| #001 | `char-woowakgood-stand.png` | `T-PCH-woowakgood` 🆕 | P0 | [x] |
| #002 | `char-woowakgood-idle.png` | `T-PCH-woowakgood` | P0 | [x] |
| #003 | `char-woowakgood-run.png` | `T-PCH-woowakgood` | P0 | [x] |
| #004 | `char-woowakgood-shoot.png` | `T-PCH-woowakgood` | P0 | [x] |
| #005 | `char-woowakgood-skill-side.png` | `T-PCH-woowakgood` | P0 | [x] |
| #006 | `char-woowakgood-skill-up.png` | `T-PCH-woowakgood` | P0 | [x] |
| #007 | `char-woowakgood-emote.png` | `T-PCH-woowakgood` | P0 | [x] |
| #008 | `char-woowakgood-portrait.png` | `T-PCH-woowakgood` | P0 | [x] |
| #009 | `env-pitch-bg.png` | `T-PCH-ENV` 🆕 | P0 | [x] |
| #010 | `env-goal.png` | `T-PCH-ENV` | P0 | [x] |
| #011 | `env-ball.png` | `T-PCH-ENV` | P0 | [x] |
| #012 | `fx-impact.png` | `T-PCH-FX` 🆕 | P0 | [x] |
| #013 | `fx-shot.png` | `T-PCH-FX` | P0 | [x] |
| #014 | `ui-frames.png` | `T-PCH-UI` 🆕 | P0 | [x] |
| #015 | `ui-buttons.png` | `T-PCH-UI` | P0 | [x] |
| #016 | `ui-hud-gauges.png` | `T-PCH-UI` | P0 | [x] |
| #017 | `ui-hud-keys.png` | `T-PCH-UI` | P0 | [x] |
| #018 | `ui-hud-banners.png` | `T-PCH-UI` | P0 | [x] |
| #019 | `keyart-loading-bg.png` | `T-PCH-ENV` | P0 | [x] |
| #020 | `ui-loader.png` | `T-PCH-UI` | P0 | [x] |
| #021 | `char-keeper-ai-stand.png` | `T-PCH-KEEPER` 🆕 | P0 | [x] |
| #022 | `char-keeper-ai-ready.png` | `T-PCH-KEEPER` | P0 | [x] |
| #023 | `char-keeper-ai-dive.png` | `T-PCH-KEEPER` | P0 | [x] |
| #024 | `char-keeper-ai-save.png` | `T-PCH-KEEPER` | P0 | [x] |
| #025 | `char-keeper-ai-react.png` | `T-PCH-KEEPER` | P0 | [x] |
| #026 | `char-janine95kim-stand.png` | `T-PCH-janine95kim` 🆕 | P1 | [x] |
| #027 | `char-janine95kim-idle.png` | `T-PCH-janine95kim` | P1 | [x] |
| #028 | `char-janine95kim-run.png` | `T-PCH-janine95kim` | P1 | [x] |
| #029 | `char-janine95kim-shoot.png` | `T-PCH-janine95kim` | P1 | [x] |
| #030 | `char-janine95kim-skill-side.png` | `T-PCH-janine95kim` | P1 | [x] |
| #031 | `char-janine95kim-skill-up.png` | `T-PCH-janine95kim` | P1 | [x] |
| #032 | `char-janine95kim-emote.png` | `T-PCH-janine95kim` | P1 | [x] |
| #033 | `char-janine95kim-portrait.png` | `T-PCH-janine95kim` | P1 | [x] |
| #034 | `char-bboringirl-stand.png` | `T-PCH-bboringirl` 🆕 | P1 | [x] |
| #035 | `char-bboringirl-idle.png` | `T-PCH-bboringirl` | P1 | [x] |
| #036 | `char-bboringirl-run.png` | `T-PCH-bboringirl` | P1 | [x] |
| #037 | `char-bboringirl-shoot.png` | `T-PCH-bboringirl` | P1 | [x] |
| #038 | `char-bboringirl-skill-side.png` | `T-PCH-bboringirl` | P1 | [x] |
| #039 | `char-bboringirl-skill-up.png` | `T-PCH-bboringirl` | P1 | [x] |
| #040 | `char-bboringirl-emote.png` | `T-PCH-bboringirl` | P1 | [x] |
| #041 | `char-bboringirl-portrait.png` | `T-PCH-bboringirl` | P1 | [x] |
| #042 | `char-sjh4018-stand.png` | `T-PCH-sjh4018` 🆕 | P1 | [x] |
| #043 | `char-sjh4018-idle.png` | `T-PCH-sjh4018` | P1 | [x] |
| #044 | `char-sjh4018-run.png` | `T-PCH-sjh4018` | P1 | [x] |
| #045 | `char-sjh4018-shoot.png` | `T-PCH-sjh4018` | P1 | [x] |
| #046 | `char-sjh4018-skill-side.png` | `T-PCH-sjh4018` | P1 | [x] |
| #047 | `char-sjh4018-skill-up.png` | `T-PCH-sjh4018` | P1 | [x] |
| #048 | `char-sjh4018-emote.png` | `T-PCH-sjh4018` | P1 | [x] |
| #049 | `char-sjh4018-portrait.png` | `T-PCH-sjh4018` | P1 | [x] |
| #050 | `char-doormomo-stand.png` | `T-PCH-doormomo` 🆕 | P1 | [x] |
| #051 | `char-doormomo-idle.png` | `T-PCH-doormomo` | P1 | [x] |
| #052 | `char-doormomo-run.png` | `T-PCH-doormomo` | P1 | [x] |
| #053 | `char-doormomo-shoot.png` | `T-PCH-doormomo` | P1 | [x] |
| #054 | `char-doormomo-skill-side.png` | `T-PCH-doormomo` | P1 | [x] |
| #055 | `char-doormomo-skill-up.png` | `T-PCH-doormomo` | P1 | [x] |
| #056 | `char-doormomo-emote.png` | `T-PCH-doormomo` | P1 | [x] |
| #057 | `char-doormomo-portrait.png` | `T-PCH-doormomo` | P1 | [x] |
| #058 | `char-hachi97-stand.png` | `T-PCH-hachi97` 🆕 | P1 | [x] |
| #059 | `char-hachi97-idle.png` | `T-PCH-hachi97` | P1 | [x] |
| #060 | `char-hachi97-run.png` | `T-PCH-hachi97` | P1 | [x] |
| #061 | `char-hachi97-shoot.png` | `T-PCH-hachi97` | P1 | [x] |
| #062 | `char-hachi97-skill-side.png` | `T-PCH-hachi97` | P1 | [x] |
| #063 | `char-hachi97-skill-up.png` | `T-PCH-hachi97` | P1 | [x] |
| #064 | `char-hachi97-emote.png` | `T-PCH-hachi97` | P1 | [x] |
| #065 | `char-hachi97-portrait.png` | `T-PCH-hachi97` | P1 | [x] |
| #066 | `char-kaksjak0730-stand.png` | `T-PCH-kaksjak0730` 🆕 | P1 | [x] |
| #067 | `char-kaksjak0730-idle.png` | `T-PCH-kaksjak0730` | P1 | [x] |
| #068 | `char-kaksjak0730-run.png` | `T-PCH-kaksjak0730` | P1 | [x] |
| #069 | `char-kaksjak0730-shoot.png` | `T-PCH-kaksjak0730` | P1 | [x] |
| #070 | `char-kaksjak0730-skill-side.png` | `T-PCH-kaksjak0730` | P1 | [x] |
| #071 | `char-kaksjak0730-skill-up.png` | `T-PCH-kaksjak0730` | P1 | [x] |
| #072 | `char-kaksjak0730-emote.png` | `T-PCH-kaksjak0730` | P1 | [x] |
| #073 | `char-kaksjak0730-portrait.png` | `T-PCH-kaksjak0730` | P1 | [x] |
| #074 | `char-ju010228-stand.png` | `T-PCH-ju010228` 🆕 | P1 | [x] |
| #075 | `char-ju010228-idle.png` | `T-PCH-ju010228` | P1 | [x] |
| #076 | `char-ju010228-run.png` | `T-PCH-ju010228` | P1 | [x] |
| #077 | `char-ju010228-shoot.png` | `T-PCH-ju010228` | P1 | [x] |
| #078 | `char-ju010228-skill-side.png` | `T-PCH-ju010228` | P1 | [x] |
| #079 | `char-ju010228-skill-up.png` | `T-PCH-ju010228` | P1 | [x] |
| #080 | `char-ju010228-emote.png` | `T-PCH-ju010228` | P1 | [x] |
| #081 | `char-ju010228-portrait.png` | `T-PCH-ju010228` | P1 | [x] |
| #082 | `char-haepalin-stand.png` | `T-PCH-haepalin` 🆕 | P1 | [x] |
| #083 | `char-haepalin-idle.png` | `T-PCH-haepalin` | P1 | [x] |
| #084 | `char-haepalin-run.png` | `T-PCH-haepalin` | P1 | [x] |
| #085 | `char-haepalin-shoot.png` | `T-PCH-haepalin` | P1 | [x] |
| #086 | `char-haepalin-skill-side.png` | `T-PCH-haepalin` | P1 | [x] |
| #087 | `char-haepalin-skill-up.png` | `T-PCH-haepalin` | P1 | [x] |
| #088 | `char-haepalin-emote.png` | `T-PCH-haepalin` | P1 | [x] |
| #089 | `char-haepalin-portrait.png` | `T-PCH-haepalin` | P1 | [x] |
| #090 | `char-tleod1818-stand.png` | `T-PCH-tleod1818` 🆕 | P1 | [x] |
| #091 | `char-tleod1818-idle.png` | `T-PCH-tleod1818` | P1 | [x] |
| #092 | `char-tleod1818-run.png` | `T-PCH-tleod1818` | P1 | [x] |
| #093 | `char-tleod1818-shoot.png` | `T-PCH-tleod1818` | P1 | [x] |
| #094 | `char-tleod1818-skill-side.png` | `T-PCH-tleod1818` | P1 | [x] |
| #095 | `char-tleod1818-skill-up.png` | `T-PCH-tleod1818` | P1 | [x] |
| #096 | `char-tleod1818-emote.png` | `T-PCH-tleod1818` | P1 | [x] |
| #097 | `char-tleod1818-portrait.png` | `T-PCH-tleod1818` | P1 | [x] |
| #098 | `char-tdnlamuron-stand.png` | `T-PCH-tdnlamuron` 🆕 | P1 | [x] |
| #099 | `char-tdnlamuron-idle.png` | `T-PCH-tdnlamuron` | P1 | [x] |
| #100 | `char-tdnlamuron-run.png` | `T-PCH-tdnlamuron` | P1 | [x] |
| #101 | `char-tdnlamuron-shoot.png` | `T-PCH-tdnlamuron` | P1 | [x] |
| #102 | `char-tdnlamuron-skill-side.png` | `T-PCH-tdnlamuron` | P1 | [x] |
| #103 | `char-tdnlamuron-skill-up.png` | `T-PCH-tdnlamuron` | P1 | [x] |
| #104 | `char-tdnlamuron-emote.png` | `T-PCH-tdnlamuron` | P1 | [x] |
| #105 | `char-tdnlamuron-portrait.png` | `T-PCH-tdnlamuron` | P1 | [x] |
| #106 | `char-lina0108-stand.png` | `T-PCH-lina0108` 🆕 | P1 | [x] |
| #107 | `char-lina0108-idle.png` | `T-PCH-lina0108` | P1 | [x] |
| #108 | `char-lina0108-run.png` | `T-PCH-lina0108` | P1 | [x] |
| #109 | `char-lina0108-shoot.png` | `T-PCH-lina0108` | P1 | [x] |
| #110 | `char-lina0108-skill-side.png` | `T-PCH-lina0108` | P1 | [x] |
| #111 | `char-lina0108-skill-up.png` | `T-PCH-lina0108` | P1 | [x] |
| #112 | `char-lina0108-emote.png` | `T-PCH-lina0108` | P1 | [x] |
| #113 | `char-lina0108-portrait.png` | `T-PCH-lina0108` | P1 | [x] |
| #114 | `ui-select.png` | `T-PCH-UI` | P1 | [x] |
| #115 | `keyart-select-bg.png` | `T-PCH-UI` | P1 | [x] |
| #116 | `fx-celebrate.png` | `T-PCH-FX` | P1 | [x] |
| #117 | `env-locker-gate.png` | `T-PCH-ENV` | P1 | [x] |
| #118 | `env-locker-bg.png` | `T-PCH-ENV` | P1 | [x] |
| #119 | `env-locker-props.png` | `T-PCH-ENV` | P1 | [x] |
| #120 | `ui-stat.png` | `T-PCH-UI` | P1 | [x] |
| #121 | `ui-icons.png` | `T-PCH-UI` | P1 | [x] |
| #122 | `env-props.png` | `T-PCH-ENV` | P2 | [x] |
| #123 | `env-crowd.png` | `T-PCH-ENV` | P2 | [x] |

---

# Phase 1 — 스타일 파일럿: 우왁굳 8시트 (전체 스타일·포즈 문법 승인용, A1 세션)

## #001 · 우왁굳 — ① stand (정면 서기 마스터)

- **저장 이름**: `tmp/pitch-src/characters/char-woowakgood-stand.png` (1024×1024, P0)
- **스레드**: 🆕 **새 스레드 시작** — `T-PCH-woowakgood`
- **레퍼런스 첨부**:
  - **필수** 선수 레퍼런스(전신): `tmp/pitch-src/refs/woowakgood-ref.png` (사용자 보유 이미지를 이 경로에 복사)
  - (선택) 얼굴 클로즈업 레퍼런스: `tmp/pitch-src/refs/woowakgood-ref-face.png`
- **검수 체크**: 배경 투명/마젠타 단색, 글자·숫자 없음, 레퍼런스의 SIGNATURE 유지, 4.5등신 운동선수 비례(치비 아님), 네이비 2px 외곽선, 전신 잘림 없음
- **상태(검토 결과)**: 검토 통과(2026-09-25). 재생성 불필요.
- **변환**: `pnpm convert:pitch-art -- characters woowakgood`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Attached (first image) is the reference of the real streamer character "우왁굳". Redraw this exact character as a 16-bit arcade football game player sprite with athletic proportions (about 4.5 heads tall, NOT chibi).
Keep: adult man's athletic body; head is a stylised golden-tan animal-like mascot head (capybara-like) with small round ears, a black headset with a boom microphone and a small red badge. Keep the same colours and the same face vibe.
Outfit: the 잔디동 home kit: mint-green (#2ee8b6) short-sleeve football jersey with white shoulder-and-sleeve stripes and a small text-free white shield-with-sprout crest on the chest (no number), dark navy (#1b2050) shorts with a thin mint side stripe, white knee-high socks with a mint band, white football boots with mint soles, plus a black captain's armband
Pose: standing ready, front view (facing the camera), feet shoulder-width apart on one baseline, arms relaxed at the sides with loosely clenched fists, confident athletic stance, full body visible with a little empty margin on all sides.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
Keep the animal-like mascot face; never turn it into a human face. No suit and no necktie (athlete kit only). The headset earcup badge is a plain red disc with no digits or letters.
```

- [x] #001 생성·저장 완료

## #002 · 우왁굳 — ② idle (준비 자세 2프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-woowakgood-idle.png` (1024×1024, P0)
- **스레드**: ↪ **이어서** — `T-PCH-woowakgood` (이 스레드의 첫 스텝은 #001 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-woowakgood-stand.png` (#001)
- **검수 체크**: 3행 방향 정확(정면/우측/후면), 2열이 서로 다른 호흡 프레임, 볼 없음, 발끝 기준선 일치
- **상태(검토 결과)**: 검토 통과(2026-09-25). 재생성 불필요.
- **변환**: `pnpm convert:pitch-art -- characters woowakgood`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite as the exact reference, draw the SAME character's idle animation as a sprite sheet on one 1024x1024 canvas: a strict grid of 2 columns x 3 rows.
Row 1: facing the camera (front view). Row 2: facing right (side view, profile). Row 3: facing away from the camera (back view).
The head-to-foot height of the three figures must match the attached standing sprite and stay within 72% of the cell height.
Column 1: ready stance, knees slightly bent, weight forward on the toes, arms loose and slightly away from the body, eyes/head toward where the ball would be. Column 2: the same stance breathing: torso about 2 pixels lower, shoulders dropped, hair and accessories shifted by one pixel.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
```

- [x] #002 생성·저장 완료

## #003 · 우왁굳 — ③ run (달리기 6프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-woowakgood-run.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-PCH-woowakgood` (이 스레드의 첫 스텝은 #001 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-woowakgood-stand.png` (#001)
  - **필수** 이 캐릭터의 승인본 idle: `tmp/pitch-src/characters/char-woowakgood-idle.png` (#002)
- **검수 체크**: **측면 행 접지 프레임 1·4에서 앞발이 교대로 보임**, 프레임 2·5에서 두 발이 지면에서 뜸, 6프레임 모두 서로 다름, 걷기가 아닌 전력 질주 느낌
- **상태(검토 결과)**: 재생성본 검토 통과(2026-09-25). 후면 행이 실제 달리기(발바닥 교대), 후면·정면 체격 비슷, 측면 행 양호. 남은 사항은 변환 단계에서 처리: 반투명 후광(알파 이진화), 측면 행이 셀 폭을 꽉 채움(연결요소로 분리), 도약 프레임은 발이 접지 프레임보다 높이 있으므로 **행 단위로 접지 프레임 기준 발끝 정렬**(프레임마다 발끝을 바닥에 맞추면 도약이 사라짐).
- **변환**: `pnpm convert:pitch-art -- characters woowakgood`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and idle sheet as the exact references, draw the SAME character's RUN cycle (a fast sprint, not a walk) as a sprite sheet on one 1536x1024 canvas: a strict grid of 6 columns x 3 rows.
Row 1 (top): running toward the camera (front view), 6 frames. Row 2 (middle): running to the right (side view), 6 frames. Row 3 (bottom): running away from the camera (back view), 6 frames.
Frame order in every row: (1) contact, left foot planted forward; (2) drive/airborne, both feet off the ground, body at its highest; (3) passing pose, right knee driving up; (4) contact, right foot planted forward; (5) drive/airborne, both feet off the ground; (6) passing pose, left knee driving up. Torso leans forward about 15 degrees, arms bent at about 90 degrees and swinging opposite to the legs, hair and accessories trailing by one or two pixels.
NON-NEGOTIABLE SIDE-VIEW CHECK (middle row, running right): in frame 1 the LEFT boot is the frontmost/rightmost boot and in frame 4 the RIGHT boot is the frontmost/rightmost boot. In those two contact frames show two fully visible, separate boots with a clear horizontal gap, and the front boot must swap sides between frame 1 and frame 4. Do not draw the same stride twice, do not put one boot directly behind the other, and do not hide a boot behind hair, clothes or a prop. Frames 2 and 5 must show both feet clearly off the ground. Before returning the image, inspect only the middle row and confirm the alternating leading boot is obvious.
BACK-VIEW ROW (bottom row, running away from the camera) must be a real sprint in EVERY frame, never a standing stance: the torso leans forward, the head stays small and compact between the shoulders (same size as in the front row), and each frame shows a different leg action: frame 1 right boot planted and left knee already lifting with the sole visible; frame 2 both boots off the ground; frame 3 right knee driving up with the sole visible; frame 4 left boot planted and right knee lifting; frame 5 both boots off the ground; frame 6 left knee driving up. Never draw the two legs side by side with both feet flat on the ground.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
```

- [x] #003 생성·저장 완료

## #004 · 우왁굳 — ④ shoot (슛 4프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-woowakgood-shoot.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-PCH-woowakgood` (이 스레드의 첫 스텝은 #001 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-woowakgood-stand.png` (#001)
  - **필수** 이 캐릭터의 승인본 run: `tmp/pitch-src/characters/char-woowakgood-run.png` (#003)
- **검수 체크**: 임팩트(3번째) 프레임에서 킥 다리가 완전히 뻗음, 상체가 셀 안에 있음, 후면 행(3행)이 명확, 볼 없음
- **상태(검토 결과)**: 재생성본 검토 통과(2026-09-25). 후면 임팩트에서 상체가 곧고 머리가 어깨 위에 있음, 정면·측면·후면 임팩트가 모두 강하게 읽힘. 알려진 한계(수용): 측면 행 4번째(팔로스루)가 뒤로 접은 다리라 백스윙처럼 보임, 후면 행 2번째(디딤)가 두 발이 모여 서 있는 듯함. 변환 단계 처리: 후광(알파 이진화), 캐릭터가 셀 경계를 넘어 위아래 행 사이 간격이 20~25px뿐이므로 고정 그리드가 아니라 연결요소로 프레임 분리.
- **부분 수정 요청(같은 스레드, 선택)**: `Keep everything, but fix only row 2 (side view) frame 4 (follow-through): the kicking leg swings forward and UP past the impact point with the knee bent in front of the body and the boot high in front, NOT folded back behind the body; keep every other frame unchanged.`
- **변환**: `pnpm convert:pitch-art -- characters woowakgood`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and run sheet as the exact references, draw the SAME character's SHOOTING animation as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows.
Row 1: kicking toward the camera (front view). Row 2: kicking toward the right (side view). Row 3: kicking away from the camera (back view, the most important row).
Frame order in every row: (1) wind-up: the kicking leg drawn far back with the knee bent, arms thrown out for balance, body leaning back slightly; (2) plant: the support foot planted firmly, torso rotating forward, kicking leg about to swing; (3) IMPACT: the kicking leg fully extended through the point where the ball would be, toes pointed, body low and driving, a sharp powerful pose; (4) follow-through: the kicking leg raised high past the impact point, torso rotated, the support leg lifting off the ground.
POSTURE RULES (all rows, especially the back-view row 3): the torso never folds forward more than about 25 degrees; the head always stays clearly ABOVE and between the shoulders and is never sunk into or hidden by the shoulders; only the hips and the kicking leg rotate hard. In the back-view row, frame 3 (IMPACT) shows the figure from behind with the upright torso, the head visible above the shoulders, the support leg planted and the kicking leg swung out to the upper right with the boot sole visible, arms out for balance. The front-view row impact frame keeps the torso upright and the head level, the kicking leg extended toward the camera without shrinking the torso.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
```

- [x] #004 생성·저장 완료

## #005 · 우왁굳 — ⑤ skill-side (개인기 4종, 측면)

- **저장 이름**: `tmp/pitch-src/characters/char-woowakgood-skill-side.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-PCH-woowakgood` (이 스레드의 첫 스텝은 #001 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-woowakgood-stand.png` (#001)
  - **필수** 이 캐릭터의 승인본 shoot: `tmp/pitch-src/characters/char-woowakgood-shoot.png` (#004)
- **검수 체크**: 4행이 서로 다른 개인기로 읽힘, 각 행 4프레임이 순서대로 진행, 레인보우 행에서 점프 프레임 확인, 볼 없음
- **상태(검토 결과)**: 재생성본 검토 통과(2026-09-25). 4종이 서로 구분됨(스텝오버=한쪽 다리 들고 페이크→와이드 런지, 룰렛=등을 보이는 회전, 레인보우=양발 모으기→도약→다리 접은 공중→착지, 엘라스티코=와이드 스탠스 좌우 페이크). 알려진 한계(수용): 스텝오버 2프레임이 무릎 들기처럼 보임, 4행 모두 4번째 프레임이 거의 같은 스프린트 출발 자세(공통 출구 자세로 취급), 행 2는 셀 높이 100%로 위아래 행과 간격 13~22px뿐. 변환 단계 처리: 후광(알파 이진화), 연결요소로 프레임 분리.
- **부분 수정 요청(같은 스레드, 선택)**: `Keep everything, but fix only row 1 (stepover) frame 2: the right leg swings in a wide arc OVER and across the front of the standing left leg at knee height with the boot sole facing down and the toes pointing to the left, the torso leaning right as a feint, NOT a plain knee lift; keep every other frame unchanged.`
- **변환**: `pnpm convert:pitch-art -- characters woowakgood`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and shoot sheet as the exact references, draw the SAME character performing four football skill moves as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 4 rows, all in right-side view (profile, facing right).
Each row is a DIFFERENT move with its own clearly different silhouette; a crouch followed by a sprint must NOT be reused in more than one row. Keep the frame order of every row.
Row 1: STEPOVER (one leg circles over the ball spot while the other stays planted): (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
Row 2: ROULETTE (Marseille turn, the whole body spins around the planted foot): (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
Row 3: RAINBOW FLICK (a small hop, the heels flick the ball up and over the head): (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
Row 4: ELASTICO (flip-flap, a wide sideways fake): (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet. Every frame in the sheet must be different from the others, and each row must read as a different move even without the ball.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
```

- [x] #005 생성·저장 완료

## #006 · 우왁굳 — ⑥ skill-up (개인기 4종, 후면)

- **저장 이름**: `tmp/pitch-src/characters/char-woowakgood-skill-up.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-PCH-woowakgood` (이 스레드의 첫 스텝은 #001 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-woowakgood-stand.png` (#001)
  - **필수** 이 캐릭터의 승인본 skill-side: `tmp/pitch-src/characters/char-woowakgood-skill-side.png` (#005)
- **검수 체크**: skill-side와 같은 4종이 후면에서 읽힘, 머리·소품 유지, 볼 없음
- **상태(검토 결과)**: 재생성본 검토 통과(2026-09-25). 후면 4종이 구분됨(스텝오버=다리를 반대편으로 휘두름, 룰렛=몸 비틀며 다리 교차, 레인보우=발 모으기→발바닥이 보이게 뒤로 차올림→공중→착지, 엘라스티코=다리 교차 후 넓은 스윕), 체격·머리 크기·헤드셋 일관, 머리가 어깨에 묻히지 않음. 알려진 한계(수용): 후면이라 룰렛의 회전은 측면보다 약하게 읽힘, 4번째 프레임은 공통 스프린트 출구 자세. 변환 단계 주의: 3·4행 프레임이 셀 높이 100%라 위아래 행 발–머리 간격이 7~15px뿐 → 연결요소 병합 gap 값을 그보다 작게(≤4px) 하거나 셀 중심 기준으로 성분을 선택할 것. 후광은 알파 이진화.
- **변환**: `pnpm convert:pitch-art -- characters woowakgood`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and shoot sheet as the exact references, draw the SAME character performing four football skill moves as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 4 rows, all in back view (facing away from the camera toward the goal).
Each row is a DIFFERENT move with its own clearly different silhouette; a crouch followed by a sprint must NOT be reused in more than one row. Keep the frame order of every row.
Row 1: STEPOVER (one leg circles over the ball spot while the other stays planted): (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
Row 2: ROULETTE (Marseille turn, the whole body spins around the planted foot): (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
Row 3: RAINBOW FLICK (a small hop, the heels flick the ball up and over the head): (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
Row 4: ELASTICO (flip-flap, a wide sideways fake): (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet. Every frame in the sheet must be different from the others, and each row must read as a different move even without the ball.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
```

- [x] #006 생성·저장 완료

## #007 · 우왁굳 — ⑦ emote (세리머니·아쉬움)

- **저장 이름**: `tmp/pitch-src/characters/char-woowakgood-emote.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-PCH-woowakgood` (이 스레드의 첫 스텝은 #001 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-woowakgood-stand.png` (#001)
  - **필수** 이 캐릭터의 승인본 idle: `tmp/pitch-src/characters/char-woowakgood-idle.png` (#002)
- **검수 체크**: 정면, 3행이 서로 구별(팔 벌림 달리기 / 무릎 슬라이드 / 좌절), 셀 잘림 없음
- **상태(검토 결과)**: 사용 가능(2026-09-25). 자세 양호. 다만 2·3행이 셀을 꽉 채우고 후광이 있으므로 변환 시 알파 이진화 필요. 마음에 걸리면 새 프롬프트로 재생성해도 됨(선택).
- **변환**: `pnpm convert:pitch-art -- characters woowakgood`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and idle sheet as the exact references, draw the SAME character's reaction animations, all facing the camera (front view), as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows.
Row 1: GOAL CELEBRATION A: running with both arms spread wide and mouth open in a shout, 4 frames of a run cycle. Row 2: GOAL CELEBRATION B: a knee slide with a raised fist: (1) leap forward, (2) landing on the knees, (3) sliding with the chest out and the fist up, (4) settling with a roar. Row 3: DISAPPOINTED: (1) hands rising to the head, (2) falling to the knees, (3) head in both hands, (4) shoulders slumped, slow sway.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
```

- [x] #007 생성·저장 완료

## #008 · 우왁굳 — ⑧ portrait (표정 4종 2×2)

- **저장 이름**: `tmp/pitch-src/characters/char-woowakgood-portrait.png` (1024×1024, P0)
- **스레드**: ↪ **이어서** — `T-PCH-woowakgood` (이 스레드의 첫 스텝은 #001 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-woowakgood-stand.png` (#001)
- **검수 체크**: 4표정 구별, 머리색·소품 유지, 가장자리 잘림 없음(긴 머리 끝·주먹이 칸 가장자리에 닿지 않게), 비대칭 소품이 있는 쪽(좌/우) 기록 — 좌향은 측면 프레임을 미러하므로
- **상태(검토 결과)**: 재생성본 검토 통과(2026-09-25). 4표정(무표정/자신감/환호+주먹/실망)이 구분되고 머리·귀·헤드셋·유니폼 일관, 주먹·팔이 셀 안에 들어옴(지난번 잘림 해결). 한계(수용): 칸 사이 투명 간격이 세로 7px·가로 23px뿐(요청한 60px 미달)이라 어깨가 중앙선 근처까지 옴 → 변환은 정확히 반으로 나누어 자르고 프레임별로 바운딩 박스 크롭. 헤드셋 배지에 숫자 비슷한 흰 표식이 있으나 192px 축소에서는 읽히지 않음. 얇은 시안 테두리 프린지는 알파 이진화/디프린지로 제거.
- **변환**: `pnpm convert:pitch-art -- characters woowakgood`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite as the exact reference, draw a portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, drawn with more pixel detail than the sprite but in the same style, with the same bold navy outline.
Top-left: neutral focused expression. Top-right: confident smirk with a raised chin. Bottom-left: celebrating, shouting with joy and a raised fist near the face. Bottom-right: disappointed, eyes down and a grimace.
LAYOUT RULES (very important): draw each bust NARROWER than its cell: at most 80% of the cell width, centred horizontally in its own cell, so that a wide empty transparent gutter is left naturally between neighbouring busts. The four portraits sit in four equal square cells with a clear empty transparent gutter of at least 60 px between neighbouring portraits (they must never touch each other), and every portrait keeps at least 8% empty margin on its left, right and top edges. Each figure is a bust that is cut flat only along its own cell's bottom edge; the shoulders, arms, fists, headset, ears and hair must be COMPLETELY inside the cell on the left, right and top: a raised fist or elbow (bottom-left portrait) must be drawn fully inside the cell, so make that portrait's pose more compact. Identical hairstyle, accessories, kit colours and proportions in all four; same framing and scale (same head size); no glow, halo or coloured blur; no cell borders or grid lines; no text.
```

- [x] #008 생성·저장 완료


---

# Phase 2 — 공용 코어 시트 P0 (A1 세션)

## #009 · E1 피치 배경 (스타일 앵커)

- **저장 이름**: `tmp/pitch-src/env/env-pitch-bg.png` (1536×1024, P0)
- **스레드**: 🆕 **새 스레드 시작** — `T-PCH-ENV`
- **레퍼런스 첨부**:
  - 없음 (이 스레드의 첫 시트 = **스타일 앵커**)
- **검수 체크**: 글자 없음, 스타일 앵커(피치 배경/로딩)와 조명·팔레트 일치, 중앙 16:9 밴드 안에 핵심 내용
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 아직 하지 않음 — A1 변환 QA에서 확인.
- **변환**: `pnpm convert:pitch-art -- env pitch-bg`
- **최종 사용**: 중앙 16:9 밴드를 크롭해 960×540으로 축소. 잔디 줄무늬 폭은 픽셀 정수배 유지(convert 옵션 --scene)

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: this is a FULL opaque scene, no transparency, no magenta.
The attacking half of a football pitch at night under floodlights, seen from a high 3/4 broadcast camera angle (about 35 degrees) looking toward the goal at the top centre of the image. Show alternating bright and mid green mowing stripes, white pitch lines, the penalty box, the six-yard box, the penalty spot and the top of the penalty arc, corner arcs. IMPORTANT: leave the goal mouth area completely EMPTY (no goal posts, no crossbar, no net, no players, no ball): the goal is a separate sprite. Along the top edge and both sides draw tiered stands packed with a colourful crowd of tiny pixel spectators (blocky, no faces, no text) and a row of LED-style advertising boards made of abstract colour blocks and stripes (no letters, no logos). Cool cyan-white floodlight glow from the upper left, violet shadows, a subtle vignette. Keep the bottom-left corner of the pitch clear along the touchline (a tunnel sprite will be placed there). Keep all important content inside the central 1536x864 band (top and bottom 80px are safe overflow).
Canvas: 1536x1024. No text, no letters, no numbers, no logos anywhere in the image.
```

- [x] #009 생성·저장 완료

## #010 · E2 골대

- **저장 이름**: `tmp/pitch-src/env/env-goal.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-PCH-ENV` (이 스레드의 첫 스텝은 #009 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/env/env-pitch-bg.png` (#009) — 픽셀 크기·외곽선·팔레트·조명 기준
- **검수 체크**: 3열×2행 그리드 정확, 셀당 1개, 요청한 가로세로비 준수(얇은 바·타일·구분선이 두껍게 나오면 변환 시 왜곡됨, A1 관찰), 글자·숫자 없음, 마젠타/핑크 잔여 없음, 이전 시트와 픽셀 크기·외곽선 일치
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 아직 하지 않음 — A1 변환 QA에서 확인.
- **변환**: `pnpm convert:pitch-art -- env goal`
- **최종 사용**: 골 프레임 폭 약 300px(논리 좌표), 뒷/앞 레이어와 리플 4프레임으로 분리

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
The football goal sprites for the same pitch, drawn from the same high 3/4 camera angle and the same pixel size as the attached pitch background. White steel posts and crossbar with a subtle cyan rim light, a fine net drawn as a pixel mesh.
Canvas: 1536x1024: a strict grid of 3 columns x 2 rows, every cell exactly the same size, one item per cell, centred, items sitting on the same baseline within their row where they are objects.
Row 1: (1) goal BACK layer: two posts, crossbar and the back and side net in shadow, seen from the front-above, wide and shallow (about 3:1); (2) goal FRONT net layer: only the front-facing net mesh with a transparent hole area where the ball can pass (this is drawn over the ball); (3) net ripple frame 1 (front net layer, slight bulge at the centre)
Row 2: (1) net ripple frame 2 (bulge larger, mesh stretched); (2) net ripple frame 3 (bulge released, mesh rebounding); (3) net ripple frame 4 (almost back to rest, tiny wobble)
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; consistent pixel size, outline and lighting in all cells; no text, letters, numbers or logos.
Use the attached image(s) as the style reference (same game, same pixel size, outline and palette).
```

- [x] #010 생성·저장 완료

## #011 · E3 볼

- **저장 이름**: `tmp/pitch-src/env/env-ball.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-PCH-ENV` (이 스레드의 첫 스텝은 #009 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/env/env-pitch-bg.png` (#009) — 픽셀 크기·외곽선·팔레트·조명 기준
- **검수 체크**: 4열×3행 그리드 정확, 셀당 1개, 요청한 가로세로비 준수(얇은 바·타일·구분선이 두껍게 나오면 변환 시 왜곡됨, A1 관찰), 글자·숫자 없음, 마젠타/핑크 잔여 없음, 이전 시트와 픽셀 크기·외곽선 일치
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 아직 하지 않음 — A1 변환 QA에서 확인.
- **변환**: `pnpm convert:pitch-art -- env ball`
- **최종 사용**: 볼 셀 16×16 논리 px 기준으로 축소, 회전 8프레임

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
A football (soccer ball) for a 16-bit arcade football game, classic black-and-white pentagon pattern with cyan rim light, drawn in a rotation cycle, with helper sprites.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly the same size, one item per cell, centred, items sitting on the same baseline within their row where they are objects.
Row 1: (1) ball rotation frame 1 (rotated 0 degrees); (2) ball rotation frame 2 (45 degrees); (3) ball rotation frame 3 (90 degrees); (4) ball rotation frame 4 (135 degrees)
Row 2: (1) ball rotation frame 5 (180 degrees); (2) ball rotation frame 6 (225 degrees); (3) ball rotation frame 7 (270 degrees); (4) ball rotation frame 8 (315 degrees)
Row 3: (1) flat oval ground shadow (soft dark violet, no ball); (2) motion streak trail (a tapering white-cyan streak, horizontal, no ball); (3) glowing ring flash (gold ring for a perfect shot, no ball); (4) small impact sparkle (white four-point star)
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; consistent pixel size, outline and lighting in all cells; no text, letters, numbers or logos.
Use the attached image(s) as the style reference (same game, same pixel size, outline and palette).
```

- [x] #011 생성·저장 완료

## #012 · F1 임팩트 이펙트

- **저장 이름**: `tmp/pitch-src/fx/fx-impact.png` (1536×1024, P0)
- **스레드**: 🆕 **새 스레드 시작** — `T-PCH-FX`
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/env/env-ball.png` (#011) — 픽셀 크기·외곽선·팔레트·조명 기준
  - (권장) 환경 스타일 앵커: `tmp/pitch-src/env/env-pitch-bg.png`
- **검수 체크**: 4열×4행 그리드 정확, 셀당 1개, 요청한 가로세로비 준수(얇은 바·타일·구분선이 두껍게 나오면 변환 시 왜곡됨, A1 관찰), 글자·숫자 없음, 마젠타/핑크 잔여 없음, 이전 시트와 픽셀 크기·외곽선 일치
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 아직 하지 않음 — A1 변환 QA에서 확인.
- **변환**: `pnpm convert:pitch-art -- fx fx-impact`
- **최종 사용**: 달리기 먼지, 킥 임팩트, 스프린트 라인

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Short 4-frame arcade effect animations in the same 16-bit pixel style, drawn on their own with no characters. Each row is one effect, four frames left to right, growing then fading.
Canvas: 1536x1024: a strict grid of 4 columns x 4 rows, every cell exactly the same size, one item per cell, centred, items sitting on the same baseline within their row where they are objects.
Row 1: (1) dust puff frame 1; (2) dust puff frame 2; (3) dust puff frame 3; (4) dust puff frame 4
Row 2: (1) grass shard burst frame 1; (2) grass shard burst frame 2; (3) grass shard burst frame 3; (4) grass shard burst frame 4
Row 3: (1) white-gold impact star burst frame 1; (2) impact star burst frame 2; (3) impact star burst frame 3; (4) impact star burst frame 4
Row 4: (1) horizontal speed lines frame 1; (2) speed lines frame 2; (3) speed lines frame 3; (4) speed lines frame 4
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; consistent pixel size, outline and lighting in all cells; no text, letters, numbers or logos.
Use the attached image(s) as the style reference (same game, same pixel size, outline and palette).
```

- [x] #012 생성·저장 완료

## #013 · F2 조준·게이지 이펙트

- **저장 이름**: `tmp/pitch-src/fx/fx-shot.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-PCH-FX` (이 스레드의 첫 스텝은 #012 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/fx/fx-impact.png` (#012) — 픽셀 크기·외곽선·팔레트·조명 기준
  - (권장) 환경 스타일 앵커: `tmp/pitch-src/env/env-pitch-bg.png`
- **검수 체크**: 4열×3행 그리드 정확, 셀당 1개, 요청한 가로세로비 준수(얇은 바·타일·구분선이 두껍게 나오면 변환 시 왜곡됨, A1 관찰), 글자·숫자 없음, 마젠타/핑크 잔여 없음, 이전 시트와 픽셀 크기·외곽선 일치
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 아직 하지 않음 — A1 변환 QA에서 확인.
- **변환**: `pnpm convert:pitch-art -- fx fx-shot`
- **최종 사용**: 화살표는 각도로 회전해서 그림

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Shooting-aim effects for an arcade football game, same pixel style: glowing cyan and gold graphic elements on a transparent background.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly the same size, one item per cell, centred, items sitting on the same baseline within their row where they are objects.
Row 1: (1) aim arrow pointing up, pulse frame 1 (a chunky chevron arrow with a cyan glow); (2) aim arrow pulse frame 2; (3) aim arrow pulse frame 3; (4) aim arrow pulse frame 4
Row 2: (1) ground target reticle ring frame 1 (cyan ring with four ticks); (2) reticle frame 2 (slightly larger); (3) reticle frame 3 (locked, gold, contracted); (4) reticle frame 4 (locked flash)
Row 3: (1) gold sweet-spot sparkle frame 1; (2) sweet-spot sparkle frame 2; (3) sweet-spot sparkle frame 3; (4) sweet-spot sparkle frame 4
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; consistent pixel size, outline and lighting in all cells; no text, letters, numbers or logos.
Use the attached image(s) as the style reference (same game, same pixel size, outline and palette).
```

- [x] #013 생성·저장 완료

## #014 · U1 프레임/패널 (스타일 앵커)

- **저장 이름**: `tmp/pitch-src/ui/ui-frames.png` (1536×1024, P0)
- **스레드**: 🆕 **새 스레드 시작** — `T-PCH-UI`
- **레퍼런스 첨부**:
  - 없음 (이 스레드의 첫 시트 = **스타일 앵커**)
  - (권장) 환경 스타일 앵커: `tmp/pitch-src/env/env-pitch-bg.png`
- **검수 체크**: 4열×3행 그리드 정확, 셀당 1개, 요청한 가로세로비 준수(얇은 바·타일·구분선이 두껍게 나오면 변환 시 왜곡됨, A1 관찰), 글자·숫자 없음, 마젠타/핑크 잔여 없음, 이전 시트와 픽셀 크기·외곽선 일치
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 아직 하지 않음 — A1 변환 QA에서 확인.
- **변환**: `pnpm convert:pitch-art -- ui ui-frames`
- **최종 사용**: 9-slice 인셋은 매니페스트에서 지정

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
UI frame elements for a 16-bit arcade sports game in the look of a retro stadium scoreboard: dark navy brushed metal (#23264a) with electric cyan (#2be4ff) trim, small corner bolts, amber LED (#ffb400) accents, angular chamfered corners. Empty inner areas (dark, flat), no text, no icons.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly the same size, one item per cell, centred, items vertically centred in the cell.
Row 1: (1) large rectangular panel frame (9-slice friendly: symmetric corners and straight edges, empty dark centre); (2) medium panel frame with a gold trim variant; (3) small dialog frame with corner bolts; (4) wide horizontal ribbon (blank, three-part: left cap, middle, right cap in one cell)
Row 2: (1) name plate (blank, wide and short); (2) tooltip speech bubble frame (blank); (3) thin horizontal divider; (4) thin vertical divider
Row 3: (1) corner bracket ornament; (2) tab-shaped header plate (blank); (3) LED dot-matrix overlay tile (subtle, seamless); (4) dark translucent-looking modal backdrop tile (flat navy, seamless)
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; consistent pixel size, outline and lighting in all cells; no text, letters, numbers or logos.
```

- [x] #014 생성·저장 완료

## #015 · U2 버튼 (대시보드 이동 / 캐릭터 변경 / 피치 복귀)

- **저장 이름**: `tmp/pitch-src/ui/ui-buttons.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-PCH-UI` (이 스레드의 첫 스텝은 #014 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/ui/ui-frames.png` (#014) — 픽셀 크기·외곽선·팔레트·조명 기준
  - (권장) 환경 스타일 앵커: `tmp/pitch-src/env/env-pitch-bg.png`
- **검수 체크**: 3열×5행 그리드 정확, 셀당 1개, 요청한 가로세로비 준수(얇은 바·타일·구분선이 두껍게 나오면 변환 시 왜곡됨, A1 관찰), 글자·숫자 없음, 마젠타/핑크 잔여 없음, 이전 시트와 픽셀 크기·외곽선 일치
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 아직 하지 않음 — A1 변환 QA에서 확인.
- **변환**: `pnpm convert:pitch-art -- ui ui-buttons`
- **최종 사용**: dashboard 212×48, change 212×40, pill 120×36, return 168×40, square 40×40 논리 px. return 버튼은 대시보드 DOM에서 <img>/CSS로 사용

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Button sprites for the same arcade scoreboard UI as the attached frames. Every row is ONE button in three states left to right: normal, hover (brighter cyan glow, raised), pressed (darker, pushed down 2 pixels). Each button is a wide blank plate with NO text, and a small icon at its left end. Keep the identical button size within a row.
Canvas: 1536x1024: a strict grid of 3 columns x 5 rows, every cell exactly the same size, one item per cell, centred, items vertically centred in the cell.
Row 1: (1) [row 1, wide 4.4:1] dashboard button: an LED scoreboard plate with a small bar-chart-and-trophy icon at the left, normal; (2) dashboard button hover; (3) dashboard button pressed
Row 2: (1) [row 2, wide 4.5:1] change-character button: navy plate with a small two-arrows swap icon at the left and a tiny silhouette-of-a-player-head icon, normal; (2) change-character hover; (3) change-character pressed
Row 3: (1) [row 3, wide 3:1] generic pill button, blank plate, normal; (2) generic hover; (3) generic pressed
Row 4: (1) [row 4, wide 4:1] return-to-pitch button for the website: a mint-green (#2ee8b6) plate with a small football-pitch-goal icon at the left, normal; (2) return-to-pitch hover; (3) return-to-pitch pressed
Row 5: (1) [row 5, square 1:1] square icon button, blank, normal; (2) square icon button hover; (3) square icon button pressed
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; consistent pixel size, outline and lighting in all cells; no text, letters, numbers or logos.
Use the attached image(s) as the style reference (same game, same pixel size, outline and palette).
```

- [x] #015 생성·저장 완료

## #016 · U3 슛 게이지·스코어보드

- **저장 이름**: `tmp/pitch-src/ui/ui-hud-gauges.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-PCH-UI` (이 스레드의 첫 스텝은 #014 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/ui/ui-buttons.png` (#015) — 픽셀 크기·외곽선·팔레트·조명 기준
  - (권장) 환경 스타일 앵커: `tmp/pitch-src/env/env-pitch-bg.png`
- **검수 체크**: 4열×3행 그리드 정확, 셀당 1개, 요청한 가로세로비 준수(얇은 바·타일·구분선이 두껍게 나오면 변환 시 왜곡됨, A1 관찰), 글자·숫자 없음, 마젠타/핑크 잔여 없음, 이전 시트와 픽셀 크기·외곽선 일치
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 아직 하지 않음 — A1 변환 QA에서 확인.
- **변환**: `pnpm convert:pitch-art -- ui ui-hud-gauges`
- **최종 사용**: 조준 바 320×20, 파워 바 320×28, 스타일 미터 24×160

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
HUD elements for the shooting mini-game in the same arcade scoreboard UI, no text and no digits.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly the same size, one item per cell, centred, items vertically centred in the cell.
Row 1: (1) scoreboard frame, wide LED plate with two empty dark digit windows separated by a small dot and a slot for a keeper icon; (2) horizontal aim bar frame (long thin metal track with empty dark inside, tick marks); (3) horizontal power bar frame (long chunky track with empty dark inside); (4) power bar fill segment tile: green
Row 2: (1) power bar fill segment tile: gold; (2) power bar fill segment tile: coral-red; (3) sweet-spot marker overlay (a bright gold bracket for the perfect zone); (4) aim bar cursor (a cyan diamond marker)
Row 3: (1) style meter frame (vertical bar with empty inside); (2) style meter fill tile (cyan to gold, seamless vertical); (3) combo pip lit (small gold hexagon); (4) combo pip unlit (dark hexagon)
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; consistent pixel size, outline and lighting in all cells; no text, letters, numbers or logos.
Use the attached image(s) as the style reference (same game, same pixel size, outline and palette).
```

- [x] #016 생성·저장 완료

## #017 · U4 키캡·프롬프트

- **저장 이름**: `tmp/pitch-src/ui/ui-hud-keys.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-PCH-UI` (이 스레드의 첫 스텝은 #014 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/ui/ui-hud-gauges.png` (#016) — 픽셀 크기·외곽선·팔레트·조명 기준
  - (권장) 환경 스타일 앵커: `tmp/pitch-src/env/env-pitch-bg.png`
- **검수 체크**: 4열×3행 그리드 정확, 셀당 1개, 요청한 가로세로비 준수(얇은 바·타일·구분선이 두껍게 나오면 변환 시 왜곡됨, A1 관찰), 글자·숫자 없음, 마젠타/핑크 잔여 없음, 이전 시트와 픽셀 크기·외곽선 일치
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 아직 하지 않음 — A1 변환 QA에서 확인.
- **변환**: `pnpm convert:pitch-art -- ui ui-hud-keys`
- **최종 사용**: 키 32×32, 스페이스 96×32

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Keyboard key cap sprites and prompts for on-screen controls in the same arcade UI. The key caps are blank (the game draws the letter itself) except the arrow keys, which show arrow triangles. No letters or digits anywhere.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly the same size, one item per cell, centred, items vertically centred in the cell.
Row 1: (1) blank square key cap, up state; (2) blank square key cap, pressed state; (3) arrow-up key cap; (4) arrow-down key cap
Row 2: (1) arrow-left key cap; (2) arrow-right key cap; (3) wide blank space-bar key cap, up; (4) wide space-bar key cap, pressed
Row 3: (1) wide blank shift key cap; (2) interaction prompt speech bubble (small, blank, with a downward tail); (3) gold glow outline for a highlighted key (frame only); (4) small blank round mouse-click icon (a mouse with a left button lit)
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; consistent pixel size, outline and lighting in all cells; no text, letters, numbers or logos.
Use the attached image(s) as the style reference (same game, same pixel size, outline and palette).
```

- [x] #017 생성·저장 완료

## #018 · U5 결과 배너

- **저장 이름**: `tmp/pitch-src/ui/ui-hud-banners.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-PCH-UI` (이 스레드의 첫 스텝은 #014 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/ui/ui-hud-gauges.png` (#016) — 픽셀 크기·외곽선·팔레트·조명 기준
  - (권장) 환경 스타일 앵커: `tmp/pitch-src/env/env-pitch-bg.png`
- **검수 체크**: 2열×6행 그리드 정확, 셀당 1개, 요청한 가로세로비 준수(얇은 바·타일·구분선이 두껍게 나오면 변환 시 왜곡됨, A1 관찰), 글자·숫자 없음, 마젠타/핑크 잔여 없음, 이전 시트와 픽셀 크기·외곽선 일치
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 아직 하지 않음 — A1 변환 QA에서 확인.
- **변환**: `pnpm convert:pitch-art -- ui ui-hud-banners`
- **최종 사용**: 배너 480×80 논리 px

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Result banner backdrops for an arcade football game: wide angular banner plates with speed-stripe edges and no text (the game draws the words). Each banner is wide (about 6:1), colour-coded, glossy metal with a light streak. Two cells per row: the banner and a matching small burst decoration.
Canvas: 1536x1024: a strict grid of 2 columns x 6 rows, every cell exactly the same size, one item per cell, centred, items vertically centred in the cell.
Row 1: (1) GOAL banner plate in gold and mint; (2) burst decoration in gold
Row 2: (1) SAVE banner plate in cyan and navy; (2) burst decoration in cyan
Row 3: (1) POST banner plate in white and steel blue; (2) burst decoration in white
Row 4: (1) MISS banner plate in coral red and navy; (2) burst decoration in coral
Row 5: (1) STYLE callout ribbon in gold and cyan; (2) small star decoration
Row 6: (1) PERFECT callout ribbon in gold; (2) small gold ring decoration
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; consistent pixel size, outline and lighting in all cells; no text, letters, numbers or logos.
Use the attached image(s) as the style reference (same game, same pixel size, outline and palette).
```

- [x] #018 생성·저장 완료

## #019 · E8 로딩 키아트

- **저장 이름**: `tmp/pitch-src/keyart/keyart-loading-bg.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-PCH-ENV` (이 스레드의 첫 스텝은 #009 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/env/env-pitch-bg.png` (#009) — 픽셀 크기·외곽선·팔레트·조명 기준
- **검수 체크**: 글자 없음, 스타일 앵커(피치 배경/로딩)와 조명·팔레트 일치, 중앙 16:9 밴드 안에 핵심 내용
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 아직 하지 않음 — A1 변환 QA에서 확인.
- **변환**: `pnpm convert:pitch-art -- keyart loading-bg`
- **최종 사용**: 960×540

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: this is a FULL opaque scene, no transparency, no magenta.
A dramatic loading-screen key art in the same 16-bit arcade pixel style: looking down a dark player tunnel toward a blazing bright football stadium at night, with silhouetted stands and floodlight stars, a single football resting on the grass in the light at the end of the tunnel, cyan and gold light rays, violet shadows. No people, no text. Leave the lower third calmer and darker so a progress bar can be placed there.
Canvas: 1536x1024. No text, no letters, no numbers, no logos anywhere in the image.
Use the attached image(s) as the style reference for pixel size, outline, palette and lighting (they show the SAME game), but do not copy their subject unless the description says so.
```

- [x] #019 생성·저장 완료

## #020 · U10 로더·진행 바

- **저장 이름**: `tmp/pitch-src/ui/ui-loader.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-PCH-UI` (이 스레드의 첫 스텝은 #014 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/env/env-ball.png` (#011) — 픽셀 크기·외곽선·팔레트·조명 기준
  - **필수** 승인본 `tmp/pitch-src/ui/ui-frames.png` (#014) — 픽셀 크기·외곽선·팔레트·조명 기준
  - (권장) 환경 스타일 앵커: `tmp/pitch-src/env/env-pitch-bg.png`
- **검수 체크**: 4열×3행 그리드 정확, 셀당 1개, 요청한 가로세로비 준수(얇은 바·타일·구분선이 두껍게 나오면 변환 시 왜곡됨, A1 관찰), 글자·숫자 없음, 마젠타/핑크 잔여 없음, 이전 시트와 픽셀 크기·외곽선 일치
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 아직 하지 않음 — A1 변환 QA에서 확인.
- **변환**: `pnpm convert:pitch-art -- ui loader`
- **최종 사용**: 프로그레스 바 480×24, 볼 32×32

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Loading-screen parts in the same 16-bit arcade UI style. The football matches the attached ball sprites. No text.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly the same size, one item per cell, centred, items vertically centred in the cell.
Row 1: (1) spinning football frame 1; (2) spinning football frame 2; (3) spinning football frame 3; (4) spinning football frame 4
Row 2: (1) spinning football frame 5; (2) spinning football frame 6; (3) spinning football frame 7; (4) spinning football frame 8
Row 3: (1) progress bar frame (long metal track, empty dark inside, rivets); (2) progress bar fill tile (mint-cyan gradient-free segments with a light streak, seamless horizontally); (3) progress bar shine overlay (a moving diagonal highlight, transparent); (4) tip plate (blank dark plate with cyan trim for tip text)
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; consistent pixel size, outline and lighting in all cells; no text, letters, numbers or logos.
Use the attached image(s) as the style reference (same game, same pixel size, outline and palette).
```

- [x] #020 생성·저장 완료


---

# Phase 3 — AI 골키퍼 5시트 (A1 세션)

## #021 · AI 골키퍼 — K① stand (정면 준비 자세 마스터)

- **저장 이름**: `tmp/pitch-src/characters/char-keeper-ai-stand.png` (1024×1024, P0)
- **스레드**: 🆕 **새 스레드 시작** — `T-PCH-KEEPER`
- **레퍼런스 첨부**:
  - (권장) 파일럿 우왁굳의 승인본 stand: `tmp/pitch-src/characters/char-woowakgood-stand.png` (#001) — 픽셀 스타일 샘플 전용
- **검수 체크**: 네온 오렌지 GK 키트, 4.5등신 운동선수 비례, 글자 없음, 정면
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 하지 않음(요청 범위 밖).
- **변환**: `pnpm convert:pitch-art -- characters keeper-ai`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Create an original goalkeeper character: broad-shouldered burly keeper, neon orange (#ff7a1a) long-sleeve goalkeeper jersey with black trim, black shorts, black knee-high socks, big black-and-orange goalkeeper gloves, black boots, short cropped dark grey hair with a yellow (#ffd23f) headband, a confident smirk, as a 16-bit arcade football game sprite with athletic proportions (about 4.5 heads tall, NOT chibi).
Pose: standing in the goalkeeper ready stance facing the camera, feet wider than the shoulders, knees slightly bent, hands open in front of the body at hip height, full body visible with a little empty margin.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #021 생성·저장 완료

## #022 · AI 골키퍼 — K② ready (대기·좌우 이동)

- **저장 이름**: `tmp/pitch-src/characters/char-keeper-ai-ready.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-PCH-KEEPER` (이 스레드의 첫 스텝은 #021 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 골키퍼 stand: `tmp/pitch-src/characters/char-keeper-ai-stand.png` (#021)
  - (권장) 파일럿 우왁굳의 idle 시트: 그리드 레이아웃 샘플 전용
- **검수 체크**: 정면(키퍼는 슈터를 향함), 프레임 순서 진행, 다이브 셀은 가로로 넓어도 잘림 없음, 볼 없음
- **상태(검토 결과)**: 검토 통과(2026-09-25, 프롬프트 보강 전 생성본). 대기 2프레임 + 좌/우 셔플 4프레임씩이 읽히고 키퍼 정체성(주황 저지, 노란 헤어밴드, 장갑) 일관. 한계(수용): 셔플이 정면이 아니라 3/4로 몸을 돌린 자세, 캐릭터가 셀을 꽉 채움, 반투명 후광. 셔플 행의 방향은 **화면 기준**(행2=화면 왼쪽으로, 행3=화면 오른쪽으로 이동)으로 그려져 있음 → 04 §6에 화면 기준이라고 명시.
- **변환**: `pnpm convert:pitch-art -- characters keeper-ai`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
The character is the AI goalkeeper: an original goalkeeper character: broad-shouldered burly keeper, neon orange (#ff7a1a) long-sleeve goalkeeper jersey with black trim, black shorts, black knee-high socks, big black-and-orange goalkeeper gloves, black boots, short cropped dark grey hair with a yellow (#ffd23f) headband, a confident smirk. Using the attached standing sprite as the exact reference, draw the ready animations on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows, all facing the camera (front view, the keeper faces the shooter).
Row 1: ready idle, 2 frames (a small bounce on the toes, hands up) in columns 1-2, columns 3-4 left completely empty. Row 2: side-shuffle toward the LEFT side of the image (screen left), 4 frames (crossing steps, hands low and wide, body turned three-quarters toward the direction of travel). Row 3: side-shuffle toward the RIGHT side of the image (screen right), 4 frames.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
```

- [x] #022 생성·저장 완료

## #023 · AI 골키퍼 — K③ dive (다이브 저/고 × 좌/우)

- **저장 이름**: `tmp/pitch-src/characters/char-keeper-ai-dive.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-PCH-KEEPER` (이 스레드의 첫 스텝은 #021 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 골키퍼 stand: `tmp/pitch-src/characters/char-keeper-ai-stand.png` (#021)
  - (권장) 직전 승인본 ready: `tmp/pitch-src/characters/char-keeper-ai-ready.png`
  - (권장) 파일럿 우왁굳의 shoot 시트: 그리드 레이아웃 샘플 전용
- **검수 체크**: 정면(키퍼는 슈터를 향함), 프레임 순서 진행, 다이브 셀은 가로로 넓어도 잘림 없음, 볼 없음
- **상태(검토 결과)**: 검토 통과(2026-09-25, 프롬프트 보강 전 생성본). 4행(저·좌/저·우/고·좌/고·우) 방향이 정확하고 5프레임 진행(웅크림→도약→최대 신장→하강→착지)이 잘 읽혀 골키퍼 시트 중 가장 좋음. 한계(수용): 프레임이 셀 폭을 꽉 채우고 서로 4px 이내로 맞닿는 곳이 있음(연결요소 병합 gap 24px를 쓰면 20프레임이 6덩어리로 합쳐짐, gap ≤3px에서 20프레임 정상 분리) → 변환은 gap ≤2px. 반투명 후광은 알파 이진화. 다이브 셀은 가로가 넓으므로 192×96 정규화, 행 단위로 접지 기준선 정렬.
- **변환**: `pnpm convert:pitch-art -- characters keeper-ai`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
The character is the AI goalkeeper: an original goalkeeper character: broad-shouldered burly keeper, neon orange (#ff7a1a) long-sleeve goalkeeper jersey with black trim, black shorts, black knee-high socks, big black-and-orange goalkeeper gloves, black boots, short cropped dark grey hair with a yellow (#ffd23f) headband, a confident smirk. Using the attached standing sprite as the exact reference, draw the DIVE animations on one 1536x1024 canvas: a strict grid of 5 columns x 4 rows, front-facing dives toward the screen's left or right. Each cell is a wide pose, so allow generous horizontal margin.
Row 1: low dive to screen LEFT along the ground, 5 frames (crouch, push off, stretched out and low, skidding on the grass, landing). Row 2: low dive to screen RIGHT, 5 frames. Row 3: high dive to screen LEFT, body stretched fully horizontal in the air with the hands reaching, 5 frames (crouch, leap, full stretch at the peak, descent, landing on the side). Row 4: high dive to screen RIGHT, 5 frames.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
```

- [x] #023 생성·저장 완료

## #024 · AI 골키퍼 — K④ save (캐치·펀치·발 선방)

- **저장 이름**: `tmp/pitch-src/characters/char-keeper-ai-save.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-PCH-KEEPER` (이 스레드의 첫 스텝은 #021 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 골키퍼 stand: `tmp/pitch-src/characters/char-keeper-ai-stand.png` (#021)
  - (권장) 직전 승인본 dive: `tmp/pitch-src/characters/char-keeper-ai-dive.png`
  - (권장) 파일럿 우왁굳의 emote 시트: 그리드 레이아웃 샘플 전용
- **검수 체크**: 정면(키퍼는 슈터를 향함), 프레임 순서 진행, 다이브 셀은 가로로 넓어도 잘림 없음, 볼 없음
- **상태(검토 결과)**: 검토 통과(2026-09-25, 프롬프트 보강 전 생성본). 캐치(손 뻗기→모으기→가슴 품기→웅크림), 펀치(주먹 뒤로→치켜올림→점프 양팔 위→회복), 발 선방(다리 들기→수평 뻗기→도약→회복)이 명확히 구분됨, 볼 없음 규칙 준수. 한계(수용): 셀을 꽉 채움, 후광. gap ≤3px에서 12프레임 정상 분리.
- **변환**: `pnpm convert:pitch-art -- characters keeper-ai`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
The character is the AI goalkeeper: an original goalkeeper character: broad-shouldered burly keeper, neon orange (#ff7a1a) long-sleeve goalkeeper jersey with black trim, black shorts, black knee-high socks, big black-and-orange goalkeeper gloves, black boots, short cropped dark grey hair with a yellow (#ffd23f) headband, a confident smirk. Using the attached standing sprite as the exact reference, draw the SAVE animations on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows, front view.
Row 1: CATCH: (1) hands reaching up and forward, (2) fingers closing, (3) clutching the imaginary ball to the chest, (4) dropping into a crouch with the ball held tight. Row 2: PUNCH: (1) both fists drawn back, (2) fists swinging up, (3) impact with arms fully extended above the head, (4) recovery. Row 3: FOOT DEFLECT: (1) one leg swinging out to the side, (2) the boot fully extended, (3) the body off balance with the arms out, (4) recovering.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
```

- [x] #024 생성·저장 완료

## #025 · AI 골키퍼 — K⑤ react (실점·세이브 세리머니·분노)

- **저장 이름**: `tmp/pitch-src/characters/char-keeper-ai-react.png` (1536×1024, P0)
- **스레드**: ↪ **이어서** — `T-PCH-KEEPER` (이 스레드의 첫 스텝은 #021 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 골키퍼 stand: `tmp/pitch-src/characters/char-keeper-ai-stand.png` (#021)
  - (권장) 직전 승인본 save: `tmp/pitch-src/characters/char-keeper-ai-save.png`
  - (권장) 파일럿 우왁굳의 emote 시트: 그리드 레이아웃 샘플 전용
- **검수 체크**: 정면(키퍼는 슈터를 향함), 프레임 순서 진행, 다이브 셀은 가로로 넓어도 잘림 없음, 볼 없음
- **상태(검토 결과)**: 검토 통과(2026-09-25, 프롬프트 보강 전 생성본). 실점(엎드림→팔꿈치로 상체 일으킴→주저앉아 멍함→고개 숙임), 세이브 세리머니(점프 주먹→주먹 치켜올림→가슴 두드리기→슈터 가리킴), 분노(무릎 꿇고 고개 숙임→주먹 들기→바닥 내려치기→고개 젓기)가 모두 감정이 잘 읽힘. 한계(수용): 2행 2~4프레임과 3행 일부가 셀 높이 100%, 시트 좌우 가장자리 6~8px 여백, 후광. gap ≤2px에서 12프레임 정상 분리(4px에서 1쌍이 합쳐짐).
- **변환**: `pnpm convert:pitch-art -- characters keeper-ai`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
The character is the AI goalkeeper: an original goalkeeper character: broad-shouldered burly keeper, neon orange (#ff7a1a) long-sleeve goalkeeper jersey with black trim, black shorts, black knee-high socks, big black-and-orange goalkeeper gloves, black boots, short cropped dark grey hair with a yellow (#ffd23f) headband, a confident smirk. Using the attached standing sprite as the exact reference, draw the REACTION animations on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows, front view.
Row 1: BEATEN (conceded a goal): (1) lying on the ground after a dive, (2) head turning back toward the goal, (3) sitting up with a stunned face, (4) slumping. Row 2: SAVE CELEBRATE: (1) a small hop, (2) a fist pump, (3) a chest-thump roar, (4) a confident point at the shooter. Row 3: RAGE SLAM: (1) kneeling, (2) raising a fist, (3) slamming the fist into the grass, (4) shaking the head.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
```

- [x] #025 생성·저장 완료


---

# Phase 4 — 나머지 필드 플레이어 11명 (A2 세션)

## #026 · 재닌 — ① stand (정면 서기 마스터)

- **저장 이름**: `tmp/pitch-src/characters/char-janine95kim-stand.png` (1024×1024, P1)
- **스레드**: 🆕 **새 스레드 시작** — `T-PCH-janine95kim`
- **레퍼런스 첨부**:
  - **필수** 선수 레퍼런스(전신): `tmp/pitch-src/refs/janine95kim-ref.png` (사용자 보유 이미지를 이 경로에 복사)
  - (선택) 얼굴 클로즈업 레퍼런스: `tmp/pitch-src/refs/janine95kim-ref-face.png`
  - (권장) 파일럿 우왁굳의 승인본 stand: `tmp/pitch-src/characters/char-woowakgood-stand.png` (#001) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 배경 투명/마젠타 단색, 글자·숫자 없음, 레퍼런스의 SIGNATURE 유지, 4.5등신 운동선수 비례(치비 아님), 네이비 2px 외곽선, 전신 잘림 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters janine95kim`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Attached (first image) is the reference of the real streamer character "재닌". Redraw this exact character as a 16-bit arcade football game player sprite with athletic proportions (about 4.5 heads tall, NOT chibi).
Keep: long wavy vivid blue hair, round glasses, white cap-style headband with a tiny ornament and a small black headset microphone, black choker. Keep the same colours and the same face vibe.
Outfit: GK-style: black long-sleeve jersey with mint side panels and white gloves, black shorts with mint stripe, black socks, black boots with mint soles
Pose: standing ready, front view (facing the camera), feet shoulder-width apart on one baseline, arms relaxed at the sides with loosely clenched fists, confident athletic stance, full body visible with a little empty margin on all sides.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
The glasses reflections are just two white pixels.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #026 생성·저장 완료

## #027 · 재닌 — ② idle (준비 자세 2프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-janine95kim-idle.png` (1024×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-janine95kim` (이 스레드의 첫 스텝은 #026 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-janine95kim-stand.png` (#026)
  - (권장) 파일럿 우왁굳의 승인본 idle: `tmp/pitch-src/characters/char-woowakgood-idle.png` (#002) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 3행 방향 정확(정면/우측/후면), 2열이 서로 다른 호흡 프레임, 볼 없음, 발끝 기준선 일치
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters janine95kim`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite as the exact reference, draw the SAME character's idle animation as a sprite sheet on one 1024x1024 canvas: a strict grid of 2 columns x 3 rows.
Row 1: facing the camera (front view). Row 2: facing right (side view, profile). Row 3: facing away from the camera (back view).
The head-to-foot height of the three figures must match the attached standing sprite and stay within 72% of the cell height.
Column 1: ready stance, knees slightly bent, weight forward on the toes, arms loose and slightly away from the body, eyes/head toward where the ball would be. Column 2: the same stance breathing: torso about 2 pixels lower, shoulders dropped, hair and accessories shifted by one pixel.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #027 생성·저장 완료

## #028 · 재닌 — ③ run (달리기 6프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-janine95kim-run.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-janine95kim` (이 스레드의 첫 스텝은 #026 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-janine95kim-stand.png` (#026)
  - **필수** 이 캐릭터의 승인본 idle: `tmp/pitch-src/characters/char-janine95kim-idle.png` (#027)
  - (권장) 파일럿 우왁굳의 승인본 run: `tmp/pitch-src/characters/char-woowakgood-run.png` (#003) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: **측면 행 접지 프레임 1·4에서 앞발이 교대로 보임**, 프레임 2·5에서 두 발이 지면에서 뜸, 6프레임 모두 서로 다름, 걷기가 아닌 전력 질주 느낌
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters janine95kim`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and idle sheet as the exact references, draw the SAME character's RUN cycle (a fast sprint, not a walk) as a sprite sheet on one 1536x1024 canvas: a strict grid of 6 columns x 3 rows.
Row 1 (top): running toward the camera (front view), 6 frames. Row 2 (middle): running to the right (side view), 6 frames. Row 3 (bottom): running away from the camera (back view), 6 frames.
Frame order in every row: (1) contact, left foot planted forward; (2) drive/airborne, both feet off the ground, body at its highest; (3) passing pose, right knee driving up; (4) contact, right foot planted forward; (5) drive/airborne, both feet off the ground; (6) passing pose, left knee driving up. Torso leans forward about 15 degrees, arms bent at about 90 degrees and swinging opposite to the legs, hair and accessories trailing by one or two pixels.
NON-NEGOTIABLE SIDE-VIEW CHECK (middle row, running right): in frame 1 the LEFT boot is the frontmost/rightmost boot and in frame 4 the RIGHT boot is the frontmost/rightmost boot. In those two contact frames show two fully visible, separate boots with a clear horizontal gap, and the front boot must swap sides between frame 1 and frame 4. Do not draw the same stride twice, do not put one boot directly behind the other, and do not hide a boot behind hair, clothes or a prop. Frames 2 and 5 must show both feet clearly off the ground. Before returning the image, inspect only the middle row and confirm the alternating leading boot is obvious.
BACK-VIEW ROW (bottom row, running away from the camera) must be a real sprint in EVERY frame, never a standing stance: the torso leans forward, the head stays small and compact between the shoulders (same size as in the front row), and each frame shows a different leg action: frame 1 right boot planted and left knee already lifting with the sole visible; frame 2 both boots off the ground; frame 3 right knee driving up with the sole visible; frame 4 left boot planted and right knee lifting; frame 5 both boots off the ground; frame 6 left knee driving up. Never draw the two legs side by side with both feet flat on the ground.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #028 생성·저장 완료

## #029 · 재닌 — ④ shoot (슛 4프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-janine95kim-shoot.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-janine95kim` (이 스레드의 첫 스텝은 #026 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-janine95kim-stand.png` (#026)
  - **필수** 이 캐릭터의 승인본 run: `tmp/pitch-src/characters/char-janine95kim-run.png` (#028)
  - (권장) 파일럿 우왁굳의 승인본 shoot: `tmp/pitch-src/characters/char-woowakgood-shoot.png` (#004) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 임팩트(3번째) 프레임에서 킥 다리가 완전히 뻗음, 상체가 셀 안에 있음, 후면 행(3행)이 명확, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters janine95kim`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and run sheet as the exact references, draw the SAME character's SHOOTING animation as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows.
Row 1: kicking toward the camera (front view). Row 2: kicking toward the right (side view). Row 3: kicking away from the camera (back view, the most important row).
Frame order in every row: (1) wind-up: the kicking leg drawn far back with the knee bent, arms thrown out for balance, body leaning back slightly; (2) plant: the support foot planted firmly, torso rotating forward, kicking leg about to swing; (3) IMPACT: the kicking leg fully extended through the point where the ball would be, toes pointed, body low and driving, a sharp powerful pose; (4) follow-through: the kicking leg raised high past the impact point, torso rotated, the support leg lifting off the ground.
POSTURE RULES (all rows, especially the back-view row 3): the torso never folds forward more than about 25 degrees; the head always stays clearly ABOVE and between the shoulders and is never sunk into or hidden by the shoulders; only the hips and the kicking leg rotate hard. In the back-view row, frame 3 (IMPACT) shows the figure from behind with the upright torso, the head visible above the shoulders, the support leg planted and the kicking leg swung out to the upper right with the boot sole visible, arms out for balance. The front-view row impact frame keeps the torso upright and the head level, the kicking leg extended toward the camera without shrinking the torso.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #029 생성·저장 완료

## #030 · 재닌 — ⑤ skill-side (개인기 4종, 측면)

- **저장 이름**: `tmp/pitch-src/characters/char-janine95kim-skill-side.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-janine95kim` (이 스레드의 첫 스텝은 #026 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-janine95kim-stand.png` (#026)
  - **필수** 이 캐릭터의 승인본 shoot: `tmp/pitch-src/characters/char-janine95kim-shoot.png` (#029)
  - (권장) 파일럿 우왁굳의 승인본 skill-side: `tmp/pitch-src/characters/char-woowakgood-skill-side.png` (#005) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 4행이 서로 다른 개인기로 읽힘, 각 행 4프레임이 순서대로 진행, 레인보우 행에서 점프 프레임 확인, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters janine95kim`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and shoot sheet as the exact references, draw the SAME character performing four football skill moves as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 4 rows, all in right-side view (profile, facing right).
Each row is a DIFFERENT move with its own clearly different silhouette; a crouch followed by a sprint must NOT be reused in more than one row. Keep the frame order of every row.
Row 1: STEPOVER (one leg circles over the ball spot while the other stays planted): (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
Row 2: ROULETTE (Marseille turn, the whole body spins around the planted foot): (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
Row 3: RAINBOW FLICK (a small hop, the heels flick the ball up and over the head): (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
Row 4: ELASTICO (flip-flap, a wide sideways fake): (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet. Every frame in the sheet must be different from the others, and each row must read as a different move even without the ball.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #030 생성·저장 완료

## #031 · 재닌 — ⑥ skill-up (개인기 4종, 후면)

- **저장 이름**: `tmp/pitch-src/characters/char-janine95kim-skill-up.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-janine95kim` (이 스레드의 첫 스텝은 #026 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-janine95kim-stand.png` (#026)
  - **필수** 이 캐릭터의 승인본 skill-side: `tmp/pitch-src/characters/char-janine95kim-skill-side.png` (#030)
  - (권장) 파일럿 우왁굳의 승인본 skill-up: `tmp/pitch-src/characters/char-woowakgood-skill-up.png` (#006) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: skill-side와 같은 4종이 후면에서 읽힘, 머리·소품 유지, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters janine95kim`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and shoot sheet as the exact references, draw the SAME character performing four football skill moves as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 4 rows, all in back view (facing away from the camera toward the goal).
Each row is a DIFFERENT move with its own clearly different silhouette; a crouch followed by a sprint must NOT be reused in more than one row. Keep the frame order of every row.
Row 1: STEPOVER (one leg circles over the ball spot while the other stays planted): (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
Row 2: ROULETTE (Marseille turn, the whole body spins around the planted foot): (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
Row 3: RAINBOW FLICK (a small hop, the heels flick the ball up and over the head): (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
Row 4: ELASTICO (flip-flap, a wide sideways fake): (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet. Every frame in the sheet must be different from the others, and each row must read as a different move even without the ball.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #031 생성·저장 완료

## #032 · 재닌 — ⑦ emote (세리머니·아쉬움)

- **저장 이름**: `tmp/pitch-src/characters/char-janine95kim-emote.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-janine95kim` (이 스레드의 첫 스텝은 #026 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-janine95kim-stand.png` (#026)
  - **필수** 이 캐릭터의 승인본 idle: `tmp/pitch-src/characters/char-janine95kim-idle.png` (#027)
  - (권장) 파일럿 우왁굳의 승인본 emote: `tmp/pitch-src/characters/char-woowakgood-emote.png` (#007) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 정면, 3행이 서로 구별(팔 벌림 달리기 / 무릎 슬라이드 / 좌절), 셀 잘림 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters janine95kim`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and idle sheet as the exact references, draw the SAME character's reaction animations, all facing the camera (front view), as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows.
Row 1: GOAL CELEBRATION A: running with both arms spread wide and mouth open in a shout, 4 frames of a run cycle. Row 2: GOAL CELEBRATION B: a knee slide with a raised fist: (1) leap forward, (2) landing on the knees, (3) sliding with the chest out and the fist up, (4) settling with a roar. Row 3: DISAPPOINTED: (1) hands rising to the head, (2) falling to the knees, (3) head in both hands, (4) shoulders slumped, slow sway.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #032 생성·저장 완료

## #033 · 재닌 — ⑧ portrait (표정 4종 2×2)

- **저장 이름**: `tmp/pitch-src/characters/char-janine95kim-portrait.png` (1024×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-janine95kim` (이 스레드의 첫 스텝은 #026 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-janine95kim-stand.png` (#026)
  - (권장) 파일럿 우왁굳의 승인본 portrait: `tmp/pitch-src/characters/char-woowakgood-portrait.png` (#008) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 4표정 구별, 머리색·소품 유지, 가장자리 잘림 없음(긴 머리 끝·주먹이 칸 가장자리에 닿지 않게), 비대칭 소품이 있는 쪽(좌/우) 기록 — 좌향은 측면 프레임을 미러하므로
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters janine95kim`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite as the exact reference, draw a portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, drawn with more pixel detail than the sprite but in the same style, with the same bold navy outline.
Top-left: neutral focused expression. Top-right: confident smirk with a raised chin. Bottom-left: celebrating, shouting with joy and a raised fist near the face. Bottom-right: disappointed, eyes down and a grimace.
LAYOUT RULES (very important): draw each bust NARROWER than its cell: at most 80% of the cell width, centred horizontally in its own cell, so that a wide empty transparent gutter is left naturally between neighbouring busts. The four portraits sit in four equal square cells with a clear empty transparent gutter of at least 60 px between neighbouring portraits (they must never touch each other), and every portrait keeps at least 8% empty margin on its left, right and top edges. Each figure is a bust that is cut flat only along its own cell's bottom edge; the shoulders, arms, fists, headset, ears and hair must be COMPLETELY inside the cell on the left, right and top: a raised fist or elbow (bottom-left portrait) must be drawn fully inside the cell, so make that portrait's pose more compact. Identical hairstyle, accessories, kit colours and proportions in all four; same framing and scale (same head size); no glow, halo or coloured blur; no cell borders or grid lines; no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #033 생성·저장 완료

## #034 · 뽀린걸 — ① stand (정면 서기 마스터)

- **저장 이름**: `tmp/pitch-src/characters/char-bboringirl-stand.png` (1024×1024, P1)
- **스레드**: 🆕 **새 스레드 시작** — `T-PCH-bboringirl`
- **레퍼런스 첨부**:
  - **필수** 선수 레퍼런스(전신): `tmp/pitch-src/refs/bboringirl-ref.png` (사용자 보유 이미지를 이 경로에 복사)
  - (선택) 얼굴 클로즈업 레퍼런스: `tmp/pitch-src/refs/bboringirl-ref-face.png`
  - (권장) 파일럿 우왁굳의 승인본 stand: `tmp/pitch-src/characters/char-woowakgood-stand.png` (#001) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 배경 투명/마젠타 단색, 글자·숫자 없음, 레퍼런스의 SIGNATURE 유지, 4.5등신 운동선수 비례(치비 아님), 네이비 2px 외곽선, 전신 잘림 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters bboringirl`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Attached (first image) is the reference of the real streamer character "뽀린걸". Redraw this exact character as a 16-bit arcade football game player sprite with athletic proportions (about 4.5 heads tall, NOT chibi).
Keep: silver-grey hair with red-pink streaks in the side locks, a low side ponytail draped over the shoulder, amber eyes, one small ahoge strand. Keep the same colours and the same face vibe.
Outfit: the 잔디동 home kit: mint-green (#2ee8b6) short-sleeve football jersey with white shoulder-and-sleeve stripes and a small text-free white shield-with-sprout crest on the chest (no number), dark navy (#1b2050) shorts with a thin mint side stripe, white knee-high socks with a mint band, white football boots with mint soles
Pose: standing ready, front view (facing the camera), feet shoulder-width apart on one baseline, arms relaxed at the sides with loosely clenched fists, confident athletic stance, full body visible with a little empty margin on all sides.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
Make the red-pink hair streaks clearly visible, drawn in coral red (#ff4d6d), never magenta or hot pink.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #034 생성·저장 완료

## #035 · 뽀린걸 — ② idle (준비 자세 2프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-bboringirl-idle.png` (1024×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-bboringirl` (이 스레드의 첫 스텝은 #034 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-bboringirl-stand.png` (#034)
  - (권장) 파일럿 우왁굳의 승인본 idle: `tmp/pitch-src/characters/char-woowakgood-idle.png` (#002) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 3행 방향 정확(정면/우측/후면), 2열이 서로 다른 호흡 프레임, 볼 없음, 발끝 기준선 일치
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters bboringirl`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite as the exact reference, draw the SAME character's idle animation as a sprite sheet on one 1024x1024 canvas: a strict grid of 2 columns x 3 rows.
Row 1: facing the camera (front view). Row 2: facing right (side view, profile). Row 3: facing away from the camera (back view).
The head-to-foot height of the three figures must match the attached standing sprite and stay within 72% of the cell height.
Column 1: ready stance, knees slightly bent, weight forward on the toes, arms loose and slightly away from the body, eyes/head toward where the ball would be. Column 2: the same stance breathing: torso about 2 pixels lower, shoulders dropped, hair and accessories shifted by one pixel.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #035 생성·저장 완료

## #036 · 뽀린걸 — ③ run (달리기 6프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-bboringirl-run.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-bboringirl` (이 스레드의 첫 스텝은 #034 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-bboringirl-stand.png` (#034)
  - **필수** 이 캐릭터의 승인본 idle: `tmp/pitch-src/characters/char-bboringirl-idle.png` (#035)
  - (권장) 파일럿 우왁굳의 승인본 run: `tmp/pitch-src/characters/char-woowakgood-run.png` (#003) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: **측면 행 접지 프레임 1·4에서 앞발이 교대로 보임**, 프레임 2·5에서 두 발이 지면에서 뜸, 6프레임 모두 서로 다름, 걷기가 아닌 전력 질주 느낌
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters bboringirl`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and idle sheet as the exact references, draw the SAME character's RUN cycle (a fast sprint, not a walk) as a sprite sheet on one 1536x1024 canvas: a strict grid of 6 columns x 3 rows.
Row 1 (top): running toward the camera (front view), 6 frames. Row 2 (middle): running to the right (side view), 6 frames. Row 3 (bottom): running away from the camera (back view), 6 frames.
Frame order in every row: (1) contact, left foot planted forward; (2) drive/airborne, both feet off the ground, body at its highest; (3) passing pose, right knee driving up; (4) contact, right foot planted forward; (5) drive/airborne, both feet off the ground; (6) passing pose, left knee driving up. Torso leans forward about 15 degrees, arms bent at about 90 degrees and swinging opposite to the legs, hair and accessories trailing by one or two pixels.
NON-NEGOTIABLE SIDE-VIEW CHECK (middle row, running right): in frame 1 the LEFT boot is the frontmost/rightmost boot and in frame 4 the RIGHT boot is the frontmost/rightmost boot. In those two contact frames show two fully visible, separate boots with a clear horizontal gap, and the front boot must swap sides between frame 1 and frame 4. Do not draw the same stride twice, do not put one boot directly behind the other, and do not hide a boot behind hair, clothes or a prop. Frames 2 and 5 must show both feet clearly off the ground. Before returning the image, inspect only the middle row and confirm the alternating leading boot is obvious.
BACK-VIEW ROW (bottom row, running away from the camera) must be a real sprint in EVERY frame, never a standing stance: the torso leans forward, the head stays small and compact between the shoulders (same size as in the front row), and each frame shows a different leg action: frame 1 right boot planted and left knee already lifting with the sole visible; frame 2 both boots off the ground; frame 3 right knee driving up with the sole visible; frame 4 left boot planted and right knee lifting; frame 5 both boots off the ground; frame 6 left knee driving up. Never draw the two legs side by side with both feet flat on the ground.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #036 생성·저장 완료

## #037 · 뽀린걸 — ④ shoot (슛 4프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-bboringirl-shoot.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-bboringirl` (이 스레드의 첫 스텝은 #034 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-bboringirl-stand.png` (#034)
  - **필수** 이 캐릭터의 승인본 run: `tmp/pitch-src/characters/char-bboringirl-run.png` (#036)
  - (권장) 파일럿 우왁굳의 승인본 shoot: `tmp/pitch-src/characters/char-woowakgood-shoot.png` (#004) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 임팩트(3번째) 프레임에서 킥 다리가 완전히 뻗음, 상체가 셀 안에 있음, 후면 행(3행)이 명확, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters bboringirl`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and run sheet as the exact references, draw the SAME character's SHOOTING animation as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows.
Row 1: kicking toward the camera (front view). Row 2: kicking toward the right (side view). Row 3: kicking away from the camera (back view, the most important row).
Frame order in every row: (1) wind-up: the kicking leg drawn far back with the knee bent, arms thrown out for balance, body leaning back slightly; (2) plant: the support foot planted firmly, torso rotating forward, kicking leg about to swing; (3) IMPACT: the kicking leg fully extended through the point where the ball would be, toes pointed, body low and driving, a sharp powerful pose; (4) follow-through: the kicking leg raised high past the impact point, torso rotated, the support leg lifting off the ground.
POSTURE RULES (all rows, especially the back-view row 3): the torso never folds forward more than about 25 degrees; the head always stays clearly ABOVE and between the shoulders and is never sunk into or hidden by the shoulders; only the hips and the kicking leg rotate hard. In the back-view row, frame 3 (IMPACT) shows the figure from behind with the upright torso, the head visible above the shoulders, the support leg planted and the kicking leg swung out to the upper right with the boot sole visible, arms out for balance. The front-view row impact frame keeps the torso upright and the head level, the kicking leg extended toward the camera without shrinking the torso.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #037 생성·저장 완료

## #038 · 뽀린걸 — ⑤ skill-side (개인기 4종, 측면)

- **저장 이름**: `tmp/pitch-src/characters/char-bboringirl-skill-side.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-bboringirl` (이 스레드의 첫 스텝은 #034 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-bboringirl-stand.png` (#034)
  - **필수** 이 캐릭터의 승인본 shoot: `tmp/pitch-src/characters/char-bboringirl-shoot.png` (#037)
  - (권장) 파일럿 우왁굳의 승인본 skill-side: `tmp/pitch-src/characters/char-woowakgood-skill-side.png` (#005) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 4행이 서로 다른 개인기로 읽힘, 각 행 4프레임이 순서대로 진행, 레인보우 행에서 점프 프레임 확인, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters bboringirl`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and shoot sheet as the exact references, draw the SAME character performing four football skill moves as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 4 rows, all in right-side view (profile, facing right).
Each row is a DIFFERENT move with its own clearly different silhouette; a crouch followed by a sprint must NOT be reused in more than one row. Keep the frame order of every row.
Row 1: STEPOVER (one leg circles over the ball spot while the other stays planted): (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
Row 2: ROULETTE (Marseille turn, the whole body spins around the planted foot): (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
Row 3: RAINBOW FLICK (a small hop, the heels flick the ball up and over the head): (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
Row 4: ELASTICO (flip-flap, a wide sideways fake): (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet. Every frame in the sheet must be different from the others, and each row must read as a different move even without the ball.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #038 생성·저장 완료

## #039 · 뽀린걸 — ⑥ skill-up (개인기 4종, 후면)

- **저장 이름**: `tmp/pitch-src/characters/char-bboringirl-skill-up.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-bboringirl` (이 스레드의 첫 스텝은 #034 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-bboringirl-stand.png` (#034)
  - **필수** 이 캐릭터의 승인본 skill-side: `tmp/pitch-src/characters/char-bboringirl-skill-side.png` (#038)
  - (권장) 파일럿 우왁굳의 승인본 skill-up: `tmp/pitch-src/characters/char-woowakgood-skill-up.png` (#006) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: skill-side와 같은 4종이 후면에서 읽힘, 머리·소품 유지, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters bboringirl`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and shoot sheet as the exact references, draw the SAME character performing four football skill moves as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 4 rows, all in back view (facing away from the camera toward the goal).
Each row is a DIFFERENT move with its own clearly different silhouette; a crouch followed by a sprint must NOT be reused in more than one row. Keep the frame order of every row.
Row 1: STEPOVER (one leg circles over the ball spot while the other stays planted): (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
Row 2: ROULETTE (Marseille turn, the whole body spins around the planted foot): (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
Row 3: RAINBOW FLICK (a small hop, the heels flick the ball up and over the head): (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
Row 4: ELASTICO (flip-flap, a wide sideways fake): (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet. Every frame in the sheet must be different from the others, and each row must read as a different move even without the ball.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #039 생성·저장 완료

## #040 · 뽀린걸 — ⑦ emote (세리머니·아쉬움)

- **저장 이름**: `tmp/pitch-src/characters/char-bboringirl-emote.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-bboringirl` (이 스레드의 첫 스텝은 #034 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-bboringirl-stand.png` (#034)
  - **필수** 이 캐릭터의 승인본 idle: `tmp/pitch-src/characters/char-bboringirl-idle.png` (#035)
  - (권장) 파일럿 우왁굳의 승인본 emote: `tmp/pitch-src/characters/char-woowakgood-emote.png` (#007) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 정면, 3행이 서로 구별(팔 벌림 달리기 / 무릎 슬라이드 / 좌절), 셀 잘림 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters bboringirl`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and idle sheet as the exact references, draw the SAME character's reaction animations, all facing the camera (front view), as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows.
Row 1: GOAL CELEBRATION A: running with both arms spread wide and mouth open in a shout, 4 frames of a run cycle. Row 2: GOAL CELEBRATION B: a knee slide with a raised fist: (1) leap forward, (2) landing on the knees, (3) sliding with the chest out and the fist up, (4) settling with a roar. Row 3: DISAPPOINTED: (1) hands rising to the head, (2) falling to the knees, (3) head in both hands, (4) shoulders slumped, slow sway.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #040 생성·저장 완료

## #041 · 뽀린걸 — ⑧ portrait (표정 4종 2×2)

- **저장 이름**: `tmp/pitch-src/characters/char-bboringirl-portrait.png` (1024×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-bboringirl` (이 스레드의 첫 스텝은 #034 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-bboringirl-stand.png` (#034)
  - (권장) 파일럿 우왁굳의 승인본 portrait: `tmp/pitch-src/characters/char-woowakgood-portrait.png` (#008) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 4표정 구별, 머리색·소품 유지, 가장자리 잘림 없음(긴 머리 끝·주먹이 칸 가장자리에 닿지 않게), 비대칭 소품이 있는 쪽(좌/우) 기록 — 좌향은 측면 프레임을 미러하므로
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters bboringirl`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite as the exact reference, draw a portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, drawn with more pixel detail than the sprite but in the same style, with the same bold navy outline.
Top-left: neutral focused expression. Top-right: confident smirk with a raised chin. Bottom-left: celebrating, shouting with joy and a raised fist near the face. Bottom-right: disappointed, eyes down and a grimace.
LAYOUT RULES (very important): draw each bust NARROWER than its cell: at most 80% of the cell width, centred horizontally in its own cell, so that a wide empty transparent gutter is left naturally between neighbouring busts. The four portraits sit in four equal square cells with a clear empty transparent gutter of at least 60 px between neighbouring portraits (they must never touch each other), and every portrait keeps at least 8% empty margin on its left, right and top edges. Each figure is a bust that is cut flat only along its own cell's bottom edge; the shoulders, arms, fists, headset, ears and hair must be COMPLETELY inside the cell on the left, right and top: a raised fist or elbow (bottom-left portrait) must be drawn fully inside the cell, so make that portrait's pose more compact. Identical hairstyle, accessories, kit colours and proportions in all four; same framing and scale (same head size); no glow, halo or coloured blur; no cell borders or grid lines; no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #041 생성·저장 완료

## #042 · 핑구 — ① stand (정면 서기 마스터)

- **저장 이름**: `tmp/pitch-src/characters/char-sjh4018-stand.png` (1024×1024, P1)
- **스레드**: 🆕 **새 스레드 시작** — `T-PCH-sjh4018`
- **레퍼런스 첨부**:
  - **필수** 선수 레퍼런스(전신): `tmp/pitch-src/refs/sjh4018-ref.png` (사용자 보유 이미지를 이 경로에 복사)
  - (선택) 얼굴 클로즈업 레퍼런스: `tmp/pitch-src/refs/sjh4018-ref-face.png`
  - (권장) 파일럿 우왁굳의 승인본 stand: `tmp/pitch-src/characters/char-woowakgood-stand.png` (#001) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 배경 투명/마젠타 단색, 글자·숫자 없음, 레퍼런스의 SIGNATURE 유지, 4.5등신 운동선수 비례(치비 아님), 네이비 2px 외곽선, 전신 잘림 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters sjh4018`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Attached (first image) is the reference of the real streamer character "핑구". Redraw this exact character as a 16-bit arcade football game player sprite with athletic proportions (about 4.5 heads tall, NOT chibi).
Keep: very long sky-blue hair with straight parted bangs, black hairband, small hair clip, blue eyes, cheerful open smile. Keep the same colours and the same face vibe.
Outfit: the 잔디동 home kit: mint-green (#2ee8b6) short-sleeve football jersey with white shoulder-and-sleeve stripes and a small text-free white shield-with-sprout crest on the chest (no number), dark navy (#1b2050) shorts with a thin mint side stripe, white knee-high socks with a mint band, white football boots with mint soles
Pose: standing ready, front view (facing the camera), feet shoulder-width apart on one baseline, arms relaxed at the sides with loosely clenched fists, confident athletic stance, full body visible with a little empty margin on all sides.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
The hair is very long: keep a compact silhouette by tying it into a long ponytail behind the back, but keep the sky-blue colour and the straight bangs.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #042 생성·저장 완료

## #043 · 핑구 — ② idle (준비 자세 2프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-sjh4018-idle.png` (1024×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-sjh4018` (이 스레드의 첫 스텝은 #042 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-sjh4018-stand.png` (#042)
  - (권장) 파일럿 우왁굳의 승인본 idle: `tmp/pitch-src/characters/char-woowakgood-idle.png` (#002) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 3행 방향 정확(정면/우측/후면), 2열이 서로 다른 호흡 프레임, 볼 없음, 발끝 기준선 일치
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters sjh4018`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite as the exact reference, draw the SAME character's idle animation as a sprite sheet on one 1024x1024 canvas: a strict grid of 2 columns x 3 rows.
Row 1: facing the camera (front view). Row 2: facing right (side view, profile). Row 3: facing away from the camera (back view).
The head-to-foot height of the three figures must match the attached standing sprite and stay within 72% of the cell height.
Column 1: ready stance, knees slightly bent, weight forward on the toes, arms loose and slightly away from the body, eyes/head toward where the ball would be. Column 2: the same stance breathing: torso about 2 pixels lower, shoulders dropped, hair and accessories shifted by one pixel.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #043 생성·저장 완료

## #044 · 핑구 — ③ run (달리기 6프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-sjh4018-run.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-sjh4018` (이 스레드의 첫 스텝은 #042 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-sjh4018-stand.png` (#042)
  - **필수** 이 캐릭터의 승인본 idle: `tmp/pitch-src/characters/char-sjh4018-idle.png` (#043)
  - (권장) 파일럿 우왁굳의 승인본 run: `tmp/pitch-src/characters/char-woowakgood-run.png` (#003) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: **측면 행 접지 프레임 1·4에서 앞발이 교대로 보임**, 프레임 2·5에서 두 발이 지면에서 뜸, 6프레임 모두 서로 다름, 걷기가 아닌 전력 질주 느낌
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters sjh4018`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and idle sheet as the exact references, draw the SAME character's RUN cycle (a fast sprint, not a walk) as a sprite sheet on one 1536x1024 canvas: a strict grid of 6 columns x 3 rows.
Row 1 (top): running toward the camera (front view), 6 frames. Row 2 (middle): running to the right (side view), 6 frames. Row 3 (bottom): running away from the camera (back view), 6 frames.
Frame order in every row: (1) contact, left foot planted forward; (2) drive/airborne, both feet off the ground, body at its highest; (3) passing pose, right knee driving up; (4) contact, right foot planted forward; (5) drive/airborne, both feet off the ground; (6) passing pose, left knee driving up. Torso leans forward about 15 degrees, arms bent at about 90 degrees and swinging opposite to the legs, hair and accessories trailing by one or two pixels.
NON-NEGOTIABLE SIDE-VIEW CHECK (middle row, running right): in frame 1 the LEFT boot is the frontmost/rightmost boot and in frame 4 the RIGHT boot is the frontmost/rightmost boot. In those two contact frames show two fully visible, separate boots with a clear horizontal gap, and the front boot must swap sides between frame 1 and frame 4. Do not draw the same stride twice, do not put one boot directly behind the other, and do not hide a boot behind hair, clothes or a prop. Frames 2 and 5 must show both feet clearly off the ground. Before returning the image, inspect only the middle row and confirm the alternating leading boot is obvious.
BACK-VIEW ROW (bottom row, running away from the camera) must be a real sprint in EVERY frame, never a standing stance: the torso leans forward, the head stays small and compact between the shoulders (same size as in the front row), and each frame shows a different leg action: frame 1 right boot planted and left knee already lifting with the sole visible; frame 2 both boots off the ground; frame 3 right knee driving up with the sole visible; frame 4 left boot planted and right knee lifting; frame 5 both boots off the ground; frame 6 left knee driving up. Never draw the two legs side by side with both feet flat on the ground.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #044 생성·저장 완료

## #045 · 핑구 — ④ shoot (슛 4프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-sjh4018-shoot.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-sjh4018` (이 스레드의 첫 스텝은 #042 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-sjh4018-stand.png` (#042)
  - **필수** 이 캐릭터의 승인본 run: `tmp/pitch-src/characters/char-sjh4018-run.png` (#044)
  - (권장) 파일럿 우왁굳의 승인본 shoot: `tmp/pitch-src/characters/char-woowakgood-shoot.png` (#004) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 임팩트(3번째) 프레임에서 킥 다리가 완전히 뻗음, 상체가 셀 안에 있음, 후면 행(3행)이 명확, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters sjh4018`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and run sheet as the exact references, draw the SAME character's SHOOTING animation as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows.
Row 1: kicking toward the camera (front view). Row 2: kicking toward the right (side view). Row 3: kicking away from the camera (back view, the most important row).
Frame order in every row: (1) wind-up: the kicking leg drawn far back with the knee bent, arms thrown out for balance, body leaning back slightly; (2) plant: the support foot planted firmly, torso rotating forward, kicking leg about to swing; (3) IMPACT: the kicking leg fully extended through the point where the ball would be, toes pointed, body low and driving, a sharp powerful pose; (4) follow-through: the kicking leg raised high past the impact point, torso rotated, the support leg lifting off the ground.
POSTURE RULES (all rows, especially the back-view row 3): the torso never folds forward more than about 25 degrees; the head always stays clearly ABOVE and between the shoulders and is never sunk into or hidden by the shoulders; only the hips and the kicking leg rotate hard. In the back-view row, frame 3 (IMPACT) shows the figure from behind with the upright torso, the head visible above the shoulders, the support leg planted and the kicking leg swung out to the upper right with the boot sole visible, arms out for balance. The front-view row impact frame keeps the torso upright and the head level, the kicking leg extended toward the camera without shrinking the torso.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #045 생성·저장 완료

## #046 · 핑구 — ⑤ skill-side (개인기 4종, 측면)

- **저장 이름**: `tmp/pitch-src/characters/char-sjh4018-skill-side.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-sjh4018` (이 스레드의 첫 스텝은 #042 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-sjh4018-stand.png` (#042)
  - **필수** 이 캐릭터의 승인본 shoot: `tmp/pitch-src/characters/char-sjh4018-shoot.png` (#045)
  - (권장) 파일럿 우왁굳의 승인본 skill-side: `tmp/pitch-src/characters/char-woowakgood-skill-side.png` (#005) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 4행이 서로 다른 개인기로 읽힘, 각 행 4프레임이 순서대로 진행, 레인보우 행에서 점프 프레임 확인, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters sjh4018`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and shoot sheet as the exact references, draw the SAME character performing four football skill moves as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 4 rows, all in right-side view (profile, facing right).
Each row is a DIFFERENT move with its own clearly different silhouette; a crouch followed by a sprint must NOT be reused in more than one row. Keep the frame order of every row.
Row 1: STEPOVER (one leg circles over the ball spot while the other stays planted): (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
Row 2: ROULETTE (Marseille turn, the whole body spins around the planted foot): (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
Row 3: RAINBOW FLICK (a small hop, the heels flick the ball up and over the head): (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
Row 4: ELASTICO (flip-flap, a wide sideways fake): (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet. Every frame in the sheet must be different from the others, and each row must read as a different move even without the ball.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #046 생성·저장 완료

## #047 · 핑구 — ⑥ skill-up (개인기 4종, 후면)

- **저장 이름**: `tmp/pitch-src/characters/char-sjh4018-skill-up.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-sjh4018` (이 스레드의 첫 스텝은 #042 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-sjh4018-stand.png` (#042)
  - **필수** 이 캐릭터의 승인본 skill-side: `tmp/pitch-src/characters/char-sjh4018-skill-side.png` (#046)
  - (권장) 파일럿 우왁굳의 승인본 skill-up: `tmp/pitch-src/characters/char-woowakgood-skill-up.png` (#006) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: skill-side와 같은 4종이 후면에서 읽힘, 머리·소품 유지, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters sjh4018`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and shoot sheet as the exact references, draw the SAME character performing four football skill moves as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 4 rows, all in back view (facing away from the camera toward the goal).
Each row is a DIFFERENT move with its own clearly different silhouette; a crouch followed by a sprint must NOT be reused in more than one row. Keep the frame order of every row.
Row 1: STEPOVER (one leg circles over the ball spot while the other stays planted): (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
Row 2: ROULETTE (Marseille turn, the whole body spins around the planted foot): (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
Row 3: RAINBOW FLICK (a small hop, the heels flick the ball up and over the head): (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
Row 4: ELASTICO (flip-flap, a wide sideways fake): (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet. Every frame in the sheet must be different from the others, and each row must read as a different move even without the ball.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #047 생성·저장 완료

## #048 · 핑구 — ⑦ emote (세리머니·아쉬움)

- **저장 이름**: `tmp/pitch-src/characters/char-sjh4018-emote.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-sjh4018` (이 스레드의 첫 스텝은 #042 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-sjh4018-stand.png` (#042)
  - **필수** 이 캐릭터의 승인본 idle: `tmp/pitch-src/characters/char-sjh4018-idle.png` (#043)
  - (권장) 파일럿 우왁굳의 승인본 emote: `tmp/pitch-src/characters/char-woowakgood-emote.png` (#007) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 정면, 3행이 서로 구별(팔 벌림 달리기 / 무릎 슬라이드 / 좌절), 셀 잘림 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters sjh4018`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and idle sheet as the exact references, draw the SAME character's reaction animations, all facing the camera (front view), as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows.
Row 1: GOAL CELEBRATION A: running with both arms spread wide and mouth open in a shout, 4 frames of a run cycle. Row 2: GOAL CELEBRATION B: a knee slide with a raised fist: (1) leap forward, (2) landing on the knees, (3) sliding with the chest out and the fist up, (4) settling with a roar. Row 3: DISAPPOINTED: (1) hands rising to the head, (2) falling to the knees, (3) head in both hands, (4) shoulders slumped, slow sway.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #048 생성·저장 완료

## #049 · 핑구 — ⑧ portrait (표정 4종 2×2)

- **저장 이름**: `tmp/pitch-src/characters/char-sjh4018-portrait.png` (1024×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-sjh4018` (이 스레드의 첫 스텝은 #042 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-sjh4018-stand.png` (#042)
  - (권장) 파일럿 우왁굳의 승인본 portrait: `tmp/pitch-src/characters/char-woowakgood-portrait.png` (#008) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 4표정 구별, 머리색·소품 유지, 가장자리 잘림 없음(긴 머리 끝·주먹이 칸 가장자리에 닿지 않게), 비대칭 소품이 있는 쪽(좌/우) 기록 — 좌향은 측면 프레임을 미러하므로
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters sjh4018`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite as the exact reference, draw a portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, drawn with more pixel detail than the sprite but in the same style, with the same bold navy outline.
Top-left: neutral focused expression. Top-right: confident smirk with a raised chin. Bottom-left: celebrating, shouting with joy and a raised fist near the face. Bottom-right: disappointed, eyes down and a grimace.
LAYOUT RULES (very important): draw each bust NARROWER than its cell: at most 80% of the cell width, centred horizontally in its own cell, so that a wide empty transparent gutter is left naturally between neighbouring busts. The four portraits sit in four equal square cells with a clear empty transparent gutter of at least 60 px between neighbouring portraits (they must never touch each other), and every portrait keeps at least 8% empty margin on its left, right and top edges. Each figure is a bust that is cut flat only along its own cell's bottom edge; the shoulders, arms, fists, headset, ears and hair must be COMPLETELY inside the cell on the left, right and top: a raised fist or elbow (bottom-left portrait) must be drawn fully inside the cell, so make that portrait's pose more compact. Identical hairstyle, accessories, kit colours and proportions in all four; same framing and scale (same head size); no glow, halo or coloured blur; no cell borders or grid lines; no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #049 생성·저장 완료

## #050 · 문모모 — ① stand (정면 서기 마스터)

- **저장 이름**: `tmp/pitch-src/characters/char-doormomo-stand.png` (1024×1024, P1)
- **스레드**: 🆕 **새 스레드 시작** — `T-PCH-doormomo`
- **레퍼런스 첨부**:
  - **필수** 선수 레퍼런스(전신): `tmp/pitch-src/refs/doormomo-ref.png` (사용자 보유 이미지를 이 경로에 복사)
  - (선택) 얼굴 클로즈업 레퍼런스: `tmp/pitch-src/refs/doormomo-ref-face.png`
  - (권장) 파일럿 우왁굳의 승인본 stand: `tmp/pitch-src/characters/char-woowakgood-stand.png` (#001) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 배경 투명/마젠타 단색, 글자·숫자 없음, 레퍼런스의 SIGNATURE 유지, 4.5등신 운동선수 비례(치비 아님), 네이비 2px 외곽선, 전신 잘림 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters doormomo`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Attached (first image) is the reference of the real streamer character "문모모". Redraw this exact character as a 16-bit arcade football game player sprite with athletic proportions (about 4.5 heads tall, NOT chibi).
Keep: short purple-black bob with blunt bangs and purple hair tips, white headband with a small red block badge (no text), silver star hairpin, purple eyes. Keep the same colours and the same face vibe.
Outfit: the 잔디동 home kit: mint-green (#2ee8b6) short-sleeve football jersey with white shoulder-and-sleeve stripes and a small text-free white shield-with-sprout crest on the chest (no number), dark navy (#1b2050) shorts with a thin mint side stripe, white knee-high socks with a mint band, white football boots with mint soles
Pose: standing ready, front view (facing the camera), feet shoulder-width apart on one baseline, arms relaxed at the sides with loosely clenched fists, confident athletic stance, full body visible with a little empty margin on all sides.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
The headband badge is a text-free red block.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #050 생성·저장 완료

## #051 · 문모모 — ② idle (준비 자세 2프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-doormomo-idle.png` (1024×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-doormomo` (이 스레드의 첫 스텝은 #050 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-doormomo-stand.png` (#050)
  - (권장) 파일럿 우왁굳의 승인본 idle: `tmp/pitch-src/characters/char-woowakgood-idle.png` (#002) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 3행 방향 정확(정면/우측/후면), 2열이 서로 다른 호흡 프레임, 볼 없음, 발끝 기준선 일치
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters doormomo`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite as the exact reference, draw the SAME character's idle animation as a sprite sheet on one 1024x1024 canvas: a strict grid of 2 columns x 3 rows.
Row 1: facing the camera (front view). Row 2: facing right (side view, profile). Row 3: facing away from the camera (back view).
The head-to-foot height of the three figures must match the attached standing sprite and stay within 72% of the cell height.
Column 1: ready stance, knees slightly bent, weight forward on the toes, arms loose and slightly away from the body, eyes/head toward where the ball would be. Column 2: the same stance breathing: torso about 2 pixels lower, shoulders dropped, hair and accessories shifted by one pixel.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #051 생성·저장 완료

## #052 · 문모모 — ③ run (달리기 6프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-doormomo-run.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-doormomo` (이 스레드의 첫 스텝은 #050 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-doormomo-stand.png` (#050)
  - **필수** 이 캐릭터의 승인본 idle: `tmp/pitch-src/characters/char-doormomo-idle.png` (#051)
  - (권장) 파일럿 우왁굳의 승인본 run: `tmp/pitch-src/characters/char-woowakgood-run.png` (#003) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: **측면 행 접지 프레임 1·4에서 앞발이 교대로 보임**, 프레임 2·5에서 두 발이 지면에서 뜸, 6프레임 모두 서로 다름, 걷기가 아닌 전력 질주 느낌
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters doormomo`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and idle sheet as the exact references, draw the SAME character's RUN cycle (a fast sprint, not a walk) as a sprite sheet on one 1536x1024 canvas: a strict grid of 6 columns x 3 rows.
Row 1 (top): running toward the camera (front view), 6 frames. Row 2 (middle): running to the right (side view), 6 frames. Row 3 (bottom): running away from the camera (back view), 6 frames.
Frame order in every row: (1) contact, left foot planted forward; (2) drive/airborne, both feet off the ground, body at its highest; (3) passing pose, right knee driving up; (4) contact, right foot planted forward; (5) drive/airborne, both feet off the ground; (6) passing pose, left knee driving up. Torso leans forward about 15 degrees, arms bent at about 90 degrees and swinging opposite to the legs, hair and accessories trailing by one or two pixels.
NON-NEGOTIABLE SIDE-VIEW CHECK (middle row, running right): in frame 1 the LEFT boot is the frontmost/rightmost boot and in frame 4 the RIGHT boot is the frontmost/rightmost boot. In those two contact frames show two fully visible, separate boots with a clear horizontal gap, and the front boot must swap sides between frame 1 and frame 4. Do not draw the same stride twice, do not put one boot directly behind the other, and do not hide a boot behind hair, clothes or a prop. Frames 2 and 5 must show both feet clearly off the ground. Before returning the image, inspect only the middle row and confirm the alternating leading boot is obvious.
BACK-VIEW ROW (bottom row, running away from the camera) must be a real sprint in EVERY frame, never a standing stance: the torso leans forward, the head stays small and compact between the shoulders (same size as in the front row), and each frame shows a different leg action: frame 1 right boot planted and left knee already lifting with the sole visible; frame 2 both boots off the ground; frame 3 right knee driving up with the sole visible; frame 4 left boot planted and right knee lifting; frame 5 both boots off the ground; frame 6 left knee driving up. Never draw the two legs side by side with both feet flat on the ground.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #052 생성·저장 완료

## #053 · 문모모 — ④ shoot (슛 4프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-doormomo-shoot.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-doormomo` (이 스레드의 첫 스텝은 #050 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-doormomo-stand.png` (#050)
  - **필수** 이 캐릭터의 승인본 run: `tmp/pitch-src/characters/char-doormomo-run.png` (#052)
  - (권장) 파일럿 우왁굳의 승인본 shoot: `tmp/pitch-src/characters/char-woowakgood-shoot.png` (#004) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 임팩트(3번째) 프레임에서 킥 다리가 완전히 뻗음, 상체가 셀 안에 있음, 후면 행(3행)이 명확, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters doormomo`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and run sheet as the exact references, draw the SAME character's SHOOTING animation as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows.
Row 1: kicking toward the camera (front view). Row 2: kicking toward the right (side view). Row 3: kicking away from the camera (back view, the most important row).
Frame order in every row: (1) wind-up: the kicking leg drawn far back with the knee bent, arms thrown out for balance, body leaning back slightly; (2) plant: the support foot planted firmly, torso rotating forward, kicking leg about to swing; (3) IMPACT: the kicking leg fully extended through the point where the ball would be, toes pointed, body low and driving, a sharp powerful pose; (4) follow-through: the kicking leg raised high past the impact point, torso rotated, the support leg lifting off the ground.
POSTURE RULES (all rows, especially the back-view row 3): the torso never folds forward more than about 25 degrees; the head always stays clearly ABOVE and between the shoulders and is never sunk into or hidden by the shoulders; only the hips and the kicking leg rotate hard. In the back-view row, frame 3 (IMPACT) shows the figure from behind with the upright torso, the head visible above the shoulders, the support leg planted and the kicking leg swung out to the upper right with the boot sole visible, arms out for balance. The front-view row impact frame keeps the torso upright and the head level, the kicking leg extended toward the camera without shrinking the torso.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #053 생성·저장 완료

## #054 · 문모모 — ⑤ skill-side (개인기 4종, 측면)

- **저장 이름**: `tmp/pitch-src/characters/char-doormomo-skill-side.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-doormomo` (이 스레드의 첫 스텝은 #050 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-doormomo-stand.png` (#050)
  - **필수** 이 캐릭터의 승인본 shoot: `tmp/pitch-src/characters/char-doormomo-shoot.png` (#053)
  - (권장) 파일럿 우왁굳의 승인본 skill-side: `tmp/pitch-src/characters/char-woowakgood-skill-side.png` (#005) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 4행이 서로 다른 개인기로 읽힘, 각 행 4프레임이 순서대로 진행, 레인보우 행에서 점프 프레임 확인, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters doormomo`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and shoot sheet as the exact references, draw the SAME character performing four football skill moves as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 4 rows, all in right-side view (profile, facing right).
Each row is a DIFFERENT move with its own clearly different silhouette; a crouch followed by a sprint must NOT be reused in more than one row. Keep the frame order of every row.
Row 1: STEPOVER (one leg circles over the ball spot while the other stays planted): (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
Row 2: ROULETTE (Marseille turn, the whole body spins around the planted foot): (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
Row 3: RAINBOW FLICK (a small hop, the heels flick the ball up and over the head): (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
Row 4: ELASTICO (flip-flap, a wide sideways fake): (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet. Every frame in the sheet must be different from the others, and each row must read as a different move even without the ball.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #054 생성·저장 완료

## #055 · 문모모 — ⑥ skill-up (개인기 4종, 후면)

- **저장 이름**: `tmp/pitch-src/characters/char-doormomo-skill-up.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-doormomo` (이 스레드의 첫 스텝은 #050 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-doormomo-stand.png` (#050)
  - **필수** 이 캐릭터의 승인본 skill-side: `tmp/pitch-src/characters/char-doormomo-skill-side.png` (#054)
  - (권장) 파일럿 우왁굳의 승인본 skill-up: `tmp/pitch-src/characters/char-woowakgood-skill-up.png` (#006) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: skill-side와 같은 4종이 후면에서 읽힘, 머리·소품 유지, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters doormomo`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and shoot sheet as the exact references, draw the SAME character performing four football skill moves as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 4 rows, all in back view (facing away from the camera toward the goal).
Each row is a DIFFERENT move with its own clearly different silhouette; a crouch followed by a sprint must NOT be reused in more than one row. Keep the frame order of every row.
Row 1: STEPOVER (one leg circles over the ball spot while the other stays planted): (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
Row 2: ROULETTE (Marseille turn, the whole body spins around the planted foot): (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
Row 3: RAINBOW FLICK (a small hop, the heels flick the ball up and over the head): (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
Row 4: ELASTICO (flip-flap, a wide sideways fake): (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet. Every frame in the sheet must be different from the others, and each row must read as a different move even without the ball.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #055 생성·저장 완료

## #056 · 문모모 — ⑦ emote (세리머니·아쉬움)

- **저장 이름**: `tmp/pitch-src/characters/char-doormomo-emote.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-doormomo` (이 스레드의 첫 스텝은 #050 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-doormomo-stand.png` (#050)
  - **필수** 이 캐릭터의 승인본 idle: `tmp/pitch-src/characters/char-doormomo-idle.png` (#051)
  - (권장) 파일럿 우왁굳의 승인본 emote: `tmp/pitch-src/characters/char-woowakgood-emote.png` (#007) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 정면, 3행이 서로 구별(팔 벌림 달리기 / 무릎 슬라이드 / 좌절), 셀 잘림 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters doormomo`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and idle sheet as the exact references, draw the SAME character's reaction animations, all facing the camera (front view), as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows.
Row 1: GOAL CELEBRATION A: running with both arms spread wide and mouth open in a shout, 4 frames of a run cycle. Row 2: GOAL CELEBRATION B: a knee slide with a raised fist: (1) leap forward, (2) landing on the knees, (3) sliding with the chest out and the fist up, (4) settling with a roar. Row 3: DISAPPOINTED: (1) hands rising to the head, (2) falling to the knees, (3) head in both hands, (4) shoulders slumped, slow sway.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #056 생성·저장 완료

## #057 · 문모모 — ⑧ portrait (표정 4종 2×2)

- **저장 이름**: `tmp/pitch-src/characters/char-doormomo-portrait.png` (1024×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-doormomo` (이 스레드의 첫 스텝은 #050 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-doormomo-stand.png` (#050)
  - (권장) 파일럿 우왁굳의 승인본 portrait: `tmp/pitch-src/characters/char-woowakgood-portrait.png` (#008) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 4표정 구별, 머리색·소품 유지, 가장자리 잘림 없음(긴 머리 끝·주먹이 칸 가장자리에 닿지 않게), 비대칭 소품이 있는 쪽(좌/우) 기록 — 좌향은 측면 프레임을 미러하므로
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters doormomo`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite as the exact reference, draw a portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, drawn with more pixel detail than the sprite but in the same style, with the same bold navy outline.
Top-left: neutral focused expression. Top-right: confident smirk with a raised chin. Bottom-left: celebrating, shouting with joy and a raised fist near the face. Bottom-right: disappointed, eyes down and a grimace.
LAYOUT RULES (very important): draw each bust NARROWER than its cell: at most 80% of the cell width, centred horizontally in its own cell, so that a wide empty transparent gutter is left naturally between neighbouring busts. The four portraits sit in four equal square cells with a clear empty transparent gutter of at least 60 px between neighbouring portraits (they must never touch each other), and every portrait keeps at least 8% empty margin on its left, right and top edges. Each figure is a bust that is cut flat only along its own cell's bottom edge; the shoulders, arms, fists, headset, ears and hair must be COMPLETELY inside the cell on the left, right and top: a raised fist or elbow (bottom-left portrait) must be drawn fully inside the cell, so make that portrait's pose more compact. Identical hairstyle, accessories, kit colours and proportions in all four; same framing and scale (same head size); no glow, halo or coloured blur; no cell borders or grid lines; no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #057 생성·저장 완료

## #058 · 하치 — ① stand (정면 서기 마스터)

- **저장 이름**: `tmp/pitch-src/characters/char-hachi97-stand.png` (1024×1024, P1)
- **스레드**: 🆕 **새 스레드 시작** — `T-PCH-hachi97`
- **레퍼런스 첨부**:
  - **필수** 선수 레퍼런스(전신): `tmp/pitch-src/refs/hachi97-ref.png` (사용자 보유 이미지를 이 경로에 복사)
  - (선택) 얼굴 클로즈업 레퍼런스: `tmp/pitch-src/refs/hachi97-ref-face.png`
  - (권장) 파일럿 우왁굳의 승인본 stand: `tmp/pitch-src/characters/char-woowakgood-stand.png` (#001) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 배경 투명/마젠타 단색, 글자·숫자 없음, 레퍼런스의 SIGNATURE 유지, 4.5등신 운동선수 비례(치비 아님), 네이비 2px 외곽선, 전신 잘림 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters hachi97`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Attached (first image) is the reference of the real streamer character "하치". Redraw this exact character as a 16-bit arcade football game player sprite with athletic proportions (about 4.5 heads tall, NOT chibi).
Keep: short black bob with a white streak, small white antler-like horn ornaments on the head, purple eyes, big open-mouth smile. Keep the same colours and the same face vibe.
Outfit: the 잔디동 home kit: mint-green (#2ee8b6) short-sleeve football jersey with white shoulder-and-sleeve stripes and a small text-free white shield-with-sprout crest on the chest (no number), dark navy (#1b2050) shorts with a thin mint side stripe, white knee-high socks with a mint band, white football boots with mint soles
Pose: standing ready, front view (facing the camera), feet shoulder-width apart on one baseline, arms relaxed at the sides with loosely clenched fists, confident athletic stance, full body visible with a little empty margin on all sides.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
Leave extra empty space above the head so the horns are not cut off.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #058 생성·저장 완료

## #059 · 하치 — ② idle (준비 자세 2프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-hachi97-idle.png` (1024×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-hachi97` (이 스레드의 첫 스텝은 #058 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-hachi97-stand.png` (#058)
  - (권장) 파일럿 우왁굳의 승인본 idle: `tmp/pitch-src/characters/char-woowakgood-idle.png` (#002) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 3행 방향 정확(정면/우측/후면), 2열이 서로 다른 호흡 프레임, 볼 없음, 발끝 기준선 일치
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters hachi97`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite as the exact reference, draw the SAME character's idle animation as a sprite sheet on one 1024x1024 canvas: a strict grid of 2 columns x 3 rows.
Row 1: facing the camera (front view). Row 2: facing right (side view, profile). Row 3: facing away from the camera (back view).
The head-to-foot height of the three figures must match the attached standing sprite and stay within 72% of the cell height.
Column 1: ready stance, knees slightly bent, weight forward on the toes, arms loose and slightly away from the body, eyes/head toward where the ball would be. Column 2: the same stance breathing: torso about 2 pixels lower, shoulders dropped, hair and accessories shifted by one pixel.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #059 생성·저장 완료

## #060 · 하치 — ③ run (달리기 6프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-hachi97-run.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-hachi97` (이 스레드의 첫 스텝은 #058 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-hachi97-stand.png` (#058)
  - **필수** 이 캐릭터의 승인본 idle: `tmp/pitch-src/characters/char-hachi97-idle.png` (#059)
  - (권장) 파일럿 우왁굳의 승인본 run: `tmp/pitch-src/characters/char-woowakgood-run.png` (#003) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: **측면 행 접지 프레임 1·4에서 앞발이 교대로 보임**, 프레임 2·5에서 두 발이 지면에서 뜸, 6프레임 모두 서로 다름, 걷기가 아닌 전력 질주 느낌
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters hachi97`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and idle sheet as the exact references, draw the SAME character's RUN cycle (a fast sprint, not a walk) as a sprite sheet on one 1536x1024 canvas: a strict grid of 6 columns x 3 rows.
Row 1 (top): running toward the camera (front view), 6 frames. Row 2 (middle): running to the right (side view), 6 frames. Row 3 (bottom): running away from the camera (back view), 6 frames.
Frame order in every row: (1) contact, left foot planted forward; (2) drive/airborne, both feet off the ground, body at its highest; (3) passing pose, right knee driving up; (4) contact, right foot planted forward; (5) drive/airborne, both feet off the ground; (6) passing pose, left knee driving up. Torso leans forward about 15 degrees, arms bent at about 90 degrees and swinging opposite to the legs, hair and accessories trailing by one or two pixels.
NON-NEGOTIABLE SIDE-VIEW CHECK (middle row, running right): in frame 1 the LEFT boot is the frontmost/rightmost boot and in frame 4 the RIGHT boot is the frontmost/rightmost boot. In those two contact frames show two fully visible, separate boots with a clear horizontal gap, and the front boot must swap sides between frame 1 and frame 4. Do not draw the same stride twice, do not put one boot directly behind the other, and do not hide a boot behind hair, clothes or a prop. Frames 2 and 5 must show both feet clearly off the ground. Before returning the image, inspect only the middle row and confirm the alternating leading boot is obvious.
BACK-VIEW ROW (bottom row, running away from the camera) must be a real sprint in EVERY frame, never a standing stance: the torso leans forward, the head stays small and compact between the shoulders (same size as in the front row), and each frame shows a different leg action: frame 1 right boot planted and left knee already lifting with the sole visible; frame 2 both boots off the ground; frame 3 right knee driving up with the sole visible; frame 4 left boot planted and right knee lifting; frame 5 both boots off the ground; frame 6 left knee driving up. Never draw the two legs side by side with both feet flat on the ground.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #060 생성·저장 완료

## #061 · 하치 — ④ shoot (슛 4프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-hachi97-shoot.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-hachi97` (이 스레드의 첫 스텝은 #058 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-hachi97-stand.png` (#058)
  - **필수** 이 캐릭터의 승인본 run: `tmp/pitch-src/characters/char-hachi97-run.png` (#060)
  - (권장) 파일럿 우왁굳의 승인본 shoot: `tmp/pitch-src/characters/char-woowakgood-shoot.png` (#004) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 임팩트(3번째) 프레임에서 킥 다리가 완전히 뻗음, 상체가 셀 안에 있음, 후면 행(3행)이 명확, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters hachi97`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and run sheet as the exact references, draw the SAME character's SHOOTING animation as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows.
Row 1: kicking toward the camera (front view). Row 2: kicking toward the right (side view). Row 3: kicking away from the camera (back view, the most important row).
Frame order in every row: (1) wind-up: the kicking leg drawn far back with the knee bent, arms thrown out for balance, body leaning back slightly; (2) plant: the support foot planted firmly, torso rotating forward, kicking leg about to swing; (3) IMPACT: the kicking leg fully extended through the point where the ball would be, toes pointed, body low and driving, a sharp powerful pose; (4) follow-through: the kicking leg raised high past the impact point, torso rotated, the support leg lifting off the ground.
POSTURE RULES (all rows, especially the back-view row 3): the torso never folds forward more than about 25 degrees; the head always stays clearly ABOVE and between the shoulders and is never sunk into or hidden by the shoulders; only the hips and the kicking leg rotate hard. In the back-view row, frame 3 (IMPACT) shows the figure from behind with the upright torso, the head visible above the shoulders, the support leg planted and the kicking leg swung out to the upper right with the boot sole visible, arms out for balance. The front-view row impact frame keeps the torso upright and the head level, the kicking leg extended toward the camera without shrinking the torso.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #061 생성·저장 완료

## #062 · 하치 — ⑤ skill-side (개인기 4종, 측면)

- **저장 이름**: `tmp/pitch-src/characters/char-hachi97-skill-side.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-hachi97` (이 스레드의 첫 스텝은 #058 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-hachi97-stand.png` (#058)
  - **필수** 이 캐릭터의 승인본 shoot: `tmp/pitch-src/characters/char-hachi97-shoot.png` (#061)
  - (권장) 파일럿 우왁굳의 승인본 skill-side: `tmp/pitch-src/characters/char-woowakgood-skill-side.png` (#005) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 4행이 서로 다른 개인기로 읽힘, 각 행 4프레임이 순서대로 진행, 레인보우 행에서 점프 프레임 확인, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters hachi97`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and shoot sheet as the exact references, draw the SAME character performing four football skill moves as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 4 rows, all in right-side view (profile, facing right).
Each row is a DIFFERENT move with its own clearly different silhouette; a crouch followed by a sprint must NOT be reused in more than one row. Keep the frame order of every row.
Row 1: STEPOVER (one leg circles over the ball spot while the other stays planted): (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
Row 2: ROULETTE (Marseille turn, the whole body spins around the planted foot): (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
Row 3: RAINBOW FLICK (a small hop, the heels flick the ball up and over the head): (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
Row 4: ELASTICO (flip-flap, a wide sideways fake): (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet. Every frame in the sheet must be different from the others, and each row must read as a different move even without the ball.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #062 생성·저장 완료

## #063 · 하치 — ⑥ skill-up (개인기 4종, 후면)

- **저장 이름**: `tmp/pitch-src/characters/char-hachi97-skill-up.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-hachi97` (이 스레드의 첫 스텝은 #058 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-hachi97-stand.png` (#058)
  - **필수** 이 캐릭터의 승인본 skill-side: `tmp/pitch-src/characters/char-hachi97-skill-side.png` (#062)
  - (권장) 파일럿 우왁굳의 승인본 skill-up: `tmp/pitch-src/characters/char-woowakgood-skill-up.png` (#006) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: skill-side와 같은 4종이 후면에서 읽힘, 머리·소품 유지, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters hachi97`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and shoot sheet as the exact references, draw the SAME character performing four football skill moves as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 4 rows, all in back view (facing away from the camera toward the goal).
Each row is a DIFFERENT move with its own clearly different silhouette; a crouch followed by a sprint must NOT be reused in more than one row. Keep the frame order of every row.
Row 1: STEPOVER (one leg circles over the ball spot while the other stays planted): (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
Row 2: ROULETTE (Marseille turn, the whole body spins around the planted foot): (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
Row 3: RAINBOW FLICK (a small hop, the heels flick the ball up and over the head): (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
Row 4: ELASTICO (flip-flap, a wide sideways fake): (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet. Every frame in the sheet must be different from the others, and each row must read as a different move even without the ball.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #063 생성·저장 완료

## #064 · 하치 — ⑦ emote (세리머니·아쉬움)

- **저장 이름**: `tmp/pitch-src/characters/char-hachi97-emote.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-hachi97` (이 스레드의 첫 스텝은 #058 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-hachi97-stand.png` (#058)
  - **필수** 이 캐릭터의 승인본 idle: `tmp/pitch-src/characters/char-hachi97-idle.png` (#059)
  - (권장) 파일럿 우왁굳의 승인본 emote: `tmp/pitch-src/characters/char-woowakgood-emote.png` (#007) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 정면, 3행이 서로 구별(팔 벌림 달리기 / 무릎 슬라이드 / 좌절), 셀 잘림 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters hachi97`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and idle sheet as the exact references, draw the SAME character's reaction animations, all facing the camera (front view), as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows.
Row 1: GOAL CELEBRATION A: running with both arms spread wide and mouth open in a shout, 4 frames of a run cycle. Row 2: GOAL CELEBRATION B: a knee slide with a raised fist: (1) leap forward, (2) landing on the knees, (3) sliding with the chest out and the fist up, (4) settling with a roar. Row 3: DISAPPOINTED: (1) hands rising to the head, (2) falling to the knees, (3) head in both hands, (4) shoulders slumped, slow sway.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #064 생성·저장 완료

## #065 · 하치 — ⑧ portrait (표정 4종 2×2)

- **저장 이름**: `tmp/pitch-src/characters/char-hachi97-portrait.png` (1024×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-hachi97` (이 스레드의 첫 스텝은 #058 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-hachi97-stand.png` (#058)
  - (권장) 파일럿 우왁굳의 승인본 portrait: `tmp/pitch-src/characters/char-woowakgood-portrait.png` (#008) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 4표정 구별, 머리색·소품 유지, 가장자리 잘림 없음(긴 머리 끝·주먹이 칸 가장자리에 닿지 않게), 비대칭 소품이 있는 쪽(좌/우) 기록 — 좌향은 측면 프레임을 미러하므로
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters hachi97`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite as the exact reference, draw a portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, drawn with more pixel detail than the sprite but in the same style, with the same bold navy outline.
Top-left: neutral focused expression. Top-right: confident smirk with a raised chin. Bottom-left: celebrating, shouting with joy and a raised fist near the face. Bottom-right: disappointed, eyes down and a grimace.
LAYOUT RULES (very important): draw each bust NARROWER than its cell: at most 80% of the cell width, centred horizontally in its own cell, so that a wide empty transparent gutter is left naturally between neighbouring busts. The four portraits sit in four equal square cells with a clear empty transparent gutter of at least 60 px between neighbouring portraits (they must never touch each other), and every portrait keeps at least 8% empty margin on its left, right and top edges. Each figure is a bust that is cut flat only along its own cell's bottom edge; the shoulders, arms, fists, headset, ears and hair must be COMPLETELY inside the cell on the left, right and top: a raised fist or elbow (bottom-left portrait) must be drawn fully inside the cell, so make that portrait's pose more compact. Identical hairstyle, accessories, kit colours and proportions in all four; same framing and scale (same head size); no glow, halo or coloured blur; no cell borders or grid lines; no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #065 생성·저장 완료

## #066 · 한결 — ① stand (정면 서기 마스터)

- **저장 이름**: `tmp/pitch-src/characters/char-kaksjak0730-stand.png` (1024×1024, P1)
- **스레드**: 🆕 **새 스레드 시작** — `T-PCH-kaksjak0730`
- **레퍼런스 첨부**:
  - **필수** 선수 레퍼런스(전신): `tmp/pitch-src/refs/kaksjak0730-ref.png` (사용자 보유 이미지를 이 경로에 복사)
  - (선택) 얼굴 클로즈업 레퍼런스: `tmp/pitch-src/refs/kaksjak0730-ref-face.png`
  - (권장) 파일럿 우왁굳의 승인본 stand: `tmp/pitch-src/characters/char-woowakgood-stand.png` (#001) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 배경 투명/마젠타 단색, 글자·숫자 없음, 레퍼런스의 SIGNATURE 유지, 4.5등신 운동선수 비례(치비 아님), 네이비 2px 외곽선, 전신 잘림 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters kaksjak0730`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Attached (first image) is the reference of the real streamer character "한결". Redraw this exact character as a 16-bit arcade football game player sprite with athletic proportions (about 4.5 heads tall, NOT chibi).
Keep: very long black hair in a high ponytail, blue eyes, white headphones with a mint-outlined cat-ear band, small star hairpin. Keep the same colours and the same face vibe.
Outfit: the 잔디동 home kit: mint-green (#2ee8b6) short-sleeve football jersey with white shoulder-and-sleeve stripes and a small text-free white shield-with-sprout crest on the chest (no number), dark navy (#1b2050) shorts with a thin mint side stripe, white knee-high socks with a mint band, white football boots with mint soles
Pose: standing ready, front view (facing the camera), feet shoulder-width apart on one baseline, arms relaxed at the sides with loosely clenched fists, confident athletic stance, full body visible with a little empty margin on all sides.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
Emphasise the cat-ear headphone silhouette.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #066 생성·저장 완료

## #067 · 한결 — ② idle (준비 자세 2프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-kaksjak0730-idle.png` (1024×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-kaksjak0730` (이 스레드의 첫 스텝은 #066 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-kaksjak0730-stand.png` (#066)
  - (권장) 파일럿 우왁굳의 승인본 idle: `tmp/pitch-src/characters/char-woowakgood-idle.png` (#002) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 3행 방향 정확(정면/우측/후면), 2열이 서로 다른 호흡 프레임, 볼 없음, 발끝 기준선 일치
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters kaksjak0730`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite as the exact reference, draw the SAME character's idle animation as a sprite sheet on one 1024x1024 canvas: a strict grid of 2 columns x 3 rows.
Row 1: facing the camera (front view). Row 2: facing right (side view, profile). Row 3: facing away from the camera (back view).
The head-to-foot height of the three figures must match the attached standing sprite and stay within 72% of the cell height.
Column 1: ready stance, knees slightly bent, weight forward on the toes, arms loose and slightly away from the body, eyes/head toward where the ball would be. Column 2: the same stance breathing: torso about 2 pixels lower, shoulders dropped, hair and accessories shifted by one pixel.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #067 생성·저장 완료

## #068 · 한결 — ③ run (달리기 6프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-kaksjak0730-run.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-kaksjak0730` (이 스레드의 첫 스텝은 #066 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-kaksjak0730-stand.png` (#066)
  - **필수** 이 캐릭터의 승인본 idle: `tmp/pitch-src/characters/char-kaksjak0730-idle.png` (#067)
  - (권장) 파일럿 우왁굳의 승인본 run: `tmp/pitch-src/characters/char-woowakgood-run.png` (#003) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: **측면 행 접지 프레임 1·4에서 앞발이 교대로 보임**, 프레임 2·5에서 두 발이 지면에서 뜸, 6프레임 모두 서로 다름, 걷기가 아닌 전력 질주 느낌
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters kaksjak0730`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and idle sheet as the exact references, draw the SAME character's RUN cycle (a fast sprint, not a walk) as a sprite sheet on one 1536x1024 canvas: a strict grid of 6 columns x 3 rows.
Row 1 (top): running toward the camera (front view), 6 frames. Row 2 (middle): running to the right (side view), 6 frames. Row 3 (bottom): running away from the camera (back view), 6 frames.
Frame order in every row: (1) contact, left foot planted forward; (2) drive/airborne, both feet off the ground, body at its highest; (3) passing pose, right knee driving up; (4) contact, right foot planted forward; (5) drive/airborne, both feet off the ground; (6) passing pose, left knee driving up. Torso leans forward about 15 degrees, arms bent at about 90 degrees and swinging opposite to the legs, hair and accessories trailing by one or two pixels.
NON-NEGOTIABLE SIDE-VIEW CHECK (middle row, running right): in frame 1 the LEFT boot is the frontmost/rightmost boot and in frame 4 the RIGHT boot is the frontmost/rightmost boot. In those two contact frames show two fully visible, separate boots with a clear horizontal gap, and the front boot must swap sides between frame 1 and frame 4. Do not draw the same stride twice, do not put one boot directly behind the other, and do not hide a boot behind hair, clothes or a prop. Frames 2 and 5 must show both feet clearly off the ground. Before returning the image, inspect only the middle row and confirm the alternating leading boot is obvious.
BACK-VIEW ROW (bottom row, running away from the camera) must be a real sprint in EVERY frame, never a standing stance: the torso leans forward, the head stays small and compact between the shoulders (same size as in the front row), and each frame shows a different leg action: frame 1 right boot planted and left knee already lifting with the sole visible; frame 2 both boots off the ground; frame 3 right knee driving up with the sole visible; frame 4 left boot planted and right knee lifting; frame 5 both boots off the ground; frame 6 left knee driving up. Never draw the two legs side by side with both feet flat on the ground.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #068 생성·저장 완료

## #069 · 한결 — ④ shoot (슛 4프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-kaksjak0730-shoot.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-kaksjak0730` (이 스레드의 첫 스텝은 #066 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-kaksjak0730-stand.png` (#066)
  - **필수** 이 캐릭터의 승인본 run: `tmp/pitch-src/characters/char-kaksjak0730-run.png` (#068)
  - (권장) 파일럿 우왁굳의 승인본 shoot: `tmp/pitch-src/characters/char-woowakgood-shoot.png` (#004) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 임팩트(3번째) 프레임에서 킥 다리가 완전히 뻗음, 상체가 셀 안에 있음, 후면 행(3행)이 명확, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters kaksjak0730`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and run sheet as the exact references, draw the SAME character's SHOOTING animation as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows.
Row 1: kicking toward the camera (front view). Row 2: kicking toward the right (side view). Row 3: kicking away from the camera (back view, the most important row).
Frame order in every row: (1) wind-up: the kicking leg drawn far back with the knee bent, arms thrown out for balance, body leaning back slightly; (2) plant: the support foot planted firmly, torso rotating forward, kicking leg about to swing; (3) IMPACT: the kicking leg fully extended through the point where the ball would be, toes pointed, body low and driving, a sharp powerful pose; (4) follow-through: the kicking leg raised high past the impact point, torso rotated, the support leg lifting off the ground.
POSTURE RULES (all rows, especially the back-view row 3): the torso never folds forward more than about 25 degrees; the head always stays clearly ABOVE and between the shoulders and is never sunk into or hidden by the shoulders; only the hips and the kicking leg rotate hard. In the back-view row, frame 3 (IMPACT) shows the figure from behind with the upright torso, the head visible above the shoulders, the support leg planted and the kicking leg swung out to the upper right with the boot sole visible, arms out for balance. The front-view row impact frame keeps the torso upright and the head level, the kicking leg extended toward the camera without shrinking the torso.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #069 생성·저장 완료

## #070 · 한결 — ⑤ skill-side (개인기 4종, 측면)

- **저장 이름**: `tmp/pitch-src/characters/char-kaksjak0730-skill-side.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-kaksjak0730` (이 스레드의 첫 스텝은 #066 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-kaksjak0730-stand.png` (#066)
  - **필수** 이 캐릭터의 승인본 shoot: `tmp/pitch-src/characters/char-kaksjak0730-shoot.png` (#069)
  - (권장) 파일럿 우왁굳의 승인본 skill-side: `tmp/pitch-src/characters/char-woowakgood-skill-side.png` (#005) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 4행이 서로 다른 개인기로 읽힘, 각 행 4프레임이 순서대로 진행, 레인보우 행에서 점프 프레임 확인, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters kaksjak0730`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and shoot sheet as the exact references, draw the SAME character performing four football skill moves as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 4 rows, all in right-side view (profile, facing right).
Each row is a DIFFERENT move with its own clearly different silhouette; a crouch followed by a sprint must NOT be reused in more than one row. Keep the frame order of every row.
Row 1: STEPOVER (one leg circles over the ball spot while the other stays planted): (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
Row 2: ROULETTE (Marseille turn, the whole body spins around the planted foot): (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
Row 3: RAINBOW FLICK (a small hop, the heels flick the ball up and over the head): (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
Row 4: ELASTICO (flip-flap, a wide sideways fake): (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet. Every frame in the sheet must be different from the others, and each row must read as a different move even without the ball.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #070 생성·저장 완료

## #071 · 한결 — ⑥ skill-up (개인기 4종, 후면)

- **저장 이름**: `tmp/pitch-src/characters/char-kaksjak0730-skill-up.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-kaksjak0730` (이 스레드의 첫 스텝은 #066 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-kaksjak0730-stand.png` (#066)
  - **필수** 이 캐릭터의 승인본 skill-side: `tmp/pitch-src/characters/char-kaksjak0730-skill-side.png` (#070)
  - (권장) 파일럿 우왁굳의 승인본 skill-up: `tmp/pitch-src/characters/char-woowakgood-skill-up.png` (#006) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: skill-side와 같은 4종이 후면에서 읽힘, 머리·소품 유지, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters kaksjak0730`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and shoot sheet as the exact references, draw the SAME character performing four football skill moves as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 4 rows, all in back view (facing away from the camera toward the goal).
Each row is a DIFFERENT move with its own clearly different silhouette; a crouch followed by a sprint must NOT be reused in more than one row. Keep the frame order of every row.
Row 1: STEPOVER (one leg circles over the ball spot while the other stays planted): (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
Row 2: ROULETTE (Marseille turn, the whole body spins around the planted foot): (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
Row 3: RAINBOW FLICK (a small hop, the heels flick the ball up and over the head): (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
Row 4: ELASTICO (flip-flap, a wide sideways fake): (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet. Every frame in the sheet must be different from the others, and each row must read as a different move even without the ball.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #071 생성·저장 완료

## #072 · 한결 — ⑦ emote (세리머니·아쉬움)

- **저장 이름**: `tmp/pitch-src/characters/char-kaksjak0730-emote.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-kaksjak0730` (이 스레드의 첫 스텝은 #066 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-kaksjak0730-stand.png` (#066)
  - **필수** 이 캐릭터의 승인본 idle: `tmp/pitch-src/characters/char-kaksjak0730-idle.png` (#067)
  - (권장) 파일럿 우왁굳의 승인본 emote: `tmp/pitch-src/characters/char-woowakgood-emote.png` (#007) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 정면, 3행이 서로 구별(팔 벌림 달리기 / 무릎 슬라이드 / 좌절), 셀 잘림 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters kaksjak0730`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and idle sheet as the exact references, draw the SAME character's reaction animations, all facing the camera (front view), as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows.
Row 1: GOAL CELEBRATION A: running with both arms spread wide and mouth open in a shout, 4 frames of a run cycle. Row 2: GOAL CELEBRATION B: a knee slide with a raised fist: (1) leap forward, (2) landing on the knees, (3) sliding with the chest out and the fist up, (4) settling with a roar. Row 3: DISAPPOINTED: (1) hands rising to the head, (2) falling to the knees, (3) head in both hands, (4) shoulders slumped, slow sway.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #072 생성·저장 완료

## #073 · 한결 — ⑧ portrait (표정 4종 2×2)

- **저장 이름**: `tmp/pitch-src/characters/char-kaksjak0730-portrait.png` (1024×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-kaksjak0730` (이 스레드의 첫 스텝은 #066 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-kaksjak0730-stand.png` (#066)
  - (권장) 파일럿 우왁굳의 승인본 portrait: `tmp/pitch-src/characters/char-woowakgood-portrait.png` (#008) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 4표정 구별, 머리색·소품 유지, 가장자리 잘림 없음(긴 머리 끝·주먹이 칸 가장자리에 닿지 않게), 비대칭 소품이 있는 쪽(좌/우) 기록 — 좌향은 측면 프레임을 미러하므로
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters kaksjak0730`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite as the exact reference, draw a portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, drawn with more pixel detail than the sprite but in the same style, with the same bold navy outline.
Top-left: neutral focused expression. Top-right: confident smirk with a raised chin. Bottom-left: celebrating, shouting with joy and a raised fist near the face. Bottom-right: disappointed, eyes down and a grimace.
LAYOUT RULES (very important): draw each bust NARROWER than its cell: at most 80% of the cell width, centred horizontally in its own cell, so that a wide empty transparent gutter is left naturally between neighbouring busts. The four portraits sit in four equal square cells with a clear empty transparent gutter of at least 60 px between neighbouring portraits (they must never touch each other), and every portrait keeps at least 8% empty margin on its left, right and top edges. Each figure is a bust that is cut flat only along its own cell's bottom edge; the shoulders, arms, fists, headset, ears and hair must be COMPLETELY inside the cell on the left, right and top: a raised fist or elbow (bottom-left portrait) must be drawn fully inside the cell, so make that portrait's pose more compact. Identical hairstyle, accessories, kit colours and proportions in all four; same framing and scale (same head size); no glow, halo or coloured blur; no cell borders or grid lines; no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #073 생성·저장 완료

## #074 · 쥬멩이 — ① stand (정면 서기 마스터)

- **저장 이름**: `tmp/pitch-src/characters/char-ju010228-stand.png` (1024×1024, P1)
- **스레드**: 🆕 **새 스레드 시작** — `T-PCH-ju010228`
- **레퍼런스 첨부**:
  - **필수** 선수 레퍼런스(전신): `tmp/pitch-src/refs/ju010228-ref.png` (사용자 보유 이미지를 이 경로에 복사)
  - (선택) 얼굴 클로즈업 레퍼런스: `tmp/pitch-src/refs/ju010228-ref-face.png`
  - (권장) 파일럿 우왁굳의 승인본 stand: `tmp/pitch-src/characters/char-woowakgood-stand.png` (#001) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 배경 투명/마젠타 단색, 글자·숫자 없음, 레퍼런스의 SIGNATURE 유지, 4.5등신 운동선수 비례(치비 아님), 네이비 2px 외곽선, 전신 잘림 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters ju010228`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Attached (first image) is the reference of the real streamer character "쥬멩이". Redraw this exact character as a 16-bit arcade football game player sprite with athletic proportions (about 4.5 heads tall, NOT chibi).
Keep: very long green hair with a white streak and a white ribbon at the side, amber eyes, gentle smile. Keep the same colours and the same face vibe.
Outfit: the 잔디동 home kit: mint-green (#2ee8b6) short-sleeve football jersey with white shoulder-and-sleeve stripes and a small text-free white shield-with-sprout crest on the chest (no number), dark navy (#1b2050) shorts with a thin mint side stripe, white knee-high socks with a mint band, white football boots with mint soles
Pose: standing ready, front view (facing the camera), feet shoulder-width apart on one baseline, arms relaxed at the sides with loosely clenched fists, confident athletic stance, full body visible with a little empty margin on all sides.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
Tie the long hair up high so it swings little during motion; keep the green colour and the white streak.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #074 생성·저장 완료

## #075 · 쥬멩이 — ② idle (준비 자세 2프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-ju010228-idle.png` (1024×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-ju010228` (이 스레드의 첫 스텝은 #074 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-ju010228-stand.png` (#074)
  - (권장) 파일럿 우왁굳의 승인본 idle: `tmp/pitch-src/characters/char-woowakgood-idle.png` (#002) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 3행 방향 정확(정면/우측/후면), 2열이 서로 다른 호흡 프레임, 볼 없음, 발끝 기준선 일치
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters ju010228`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite as the exact reference, draw the SAME character's idle animation as a sprite sheet on one 1024x1024 canvas: a strict grid of 2 columns x 3 rows.
Row 1: facing the camera (front view). Row 2: facing right (side view, profile). Row 3: facing away from the camera (back view).
The head-to-foot height of the three figures must match the attached standing sprite and stay within 72% of the cell height.
Column 1: ready stance, knees slightly bent, weight forward on the toes, arms loose and slightly away from the body, eyes/head toward where the ball would be. Column 2: the same stance breathing: torso about 2 pixels lower, shoulders dropped, hair and accessories shifted by one pixel.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #075 생성·저장 완료

## #076 · 쥬멩이 — ③ run (달리기 6프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-ju010228-run.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-ju010228` (이 스레드의 첫 스텝은 #074 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-ju010228-stand.png` (#074)
  - **필수** 이 캐릭터의 승인본 idle: `tmp/pitch-src/characters/char-ju010228-idle.png` (#075)
  - (권장) 파일럿 우왁굳의 승인본 run: `tmp/pitch-src/characters/char-woowakgood-run.png` (#003) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: **측면 행 접지 프레임 1·4에서 앞발이 교대로 보임**, 프레임 2·5에서 두 발이 지면에서 뜸, 6프레임 모두 서로 다름, 걷기가 아닌 전력 질주 느낌
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters ju010228`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and idle sheet as the exact references, draw the SAME character's RUN cycle (a fast sprint, not a walk) as a sprite sheet on one 1536x1024 canvas: a strict grid of 6 columns x 3 rows.
Row 1 (top): running toward the camera (front view), 6 frames. Row 2 (middle): running to the right (side view), 6 frames. Row 3 (bottom): running away from the camera (back view), 6 frames.
Frame order in every row: (1) contact, left foot planted forward; (2) drive/airborne, both feet off the ground, body at its highest; (3) passing pose, right knee driving up; (4) contact, right foot planted forward; (5) drive/airborne, both feet off the ground; (6) passing pose, left knee driving up. Torso leans forward about 15 degrees, arms bent at about 90 degrees and swinging opposite to the legs, hair and accessories trailing by one or two pixels.
NON-NEGOTIABLE SIDE-VIEW CHECK (middle row, running right): in frame 1 the LEFT boot is the frontmost/rightmost boot and in frame 4 the RIGHT boot is the frontmost/rightmost boot. In those two contact frames show two fully visible, separate boots with a clear horizontal gap, and the front boot must swap sides between frame 1 and frame 4. Do not draw the same stride twice, do not put one boot directly behind the other, and do not hide a boot behind hair, clothes or a prop. Frames 2 and 5 must show both feet clearly off the ground. Before returning the image, inspect only the middle row and confirm the alternating leading boot is obvious.
BACK-VIEW ROW (bottom row, running away from the camera) must be a real sprint in EVERY frame, never a standing stance: the torso leans forward, the head stays small and compact between the shoulders (same size as in the front row), and each frame shows a different leg action: frame 1 right boot planted and left knee already lifting with the sole visible; frame 2 both boots off the ground; frame 3 right knee driving up with the sole visible; frame 4 left boot planted and right knee lifting; frame 5 both boots off the ground; frame 6 left knee driving up. Never draw the two legs side by side with both feet flat on the ground.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #076 생성·저장 완료

## #077 · 쥬멩이 — ④ shoot (슛 4프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-ju010228-shoot.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-ju010228` (이 스레드의 첫 스텝은 #074 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-ju010228-stand.png` (#074)
  - **필수** 이 캐릭터의 승인본 run: `tmp/pitch-src/characters/char-ju010228-run.png` (#076)
  - (권장) 파일럿 우왁굳의 승인본 shoot: `tmp/pitch-src/characters/char-woowakgood-shoot.png` (#004) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 임팩트(3번째) 프레임에서 킥 다리가 완전히 뻗음, 상체가 셀 안에 있음, 후면 행(3행)이 명확, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters ju010228`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and run sheet as the exact references, draw the SAME character's SHOOTING animation as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows.
Row 1: kicking toward the camera (front view). Row 2: kicking toward the right (side view). Row 3: kicking away from the camera (back view, the most important row).
Frame order in every row: (1) wind-up: the kicking leg drawn far back with the knee bent, arms thrown out for balance, body leaning back slightly; (2) plant: the support foot planted firmly, torso rotating forward, kicking leg about to swing; (3) IMPACT: the kicking leg fully extended through the point where the ball would be, toes pointed, body low and driving, a sharp powerful pose; (4) follow-through: the kicking leg raised high past the impact point, torso rotated, the support leg lifting off the ground.
POSTURE RULES (all rows, especially the back-view row 3): the torso never folds forward more than about 25 degrees; the head always stays clearly ABOVE and between the shoulders and is never sunk into or hidden by the shoulders; only the hips and the kicking leg rotate hard. In the back-view row, frame 3 (IMPACT) shows the figure from behind with the upright torso, the head visible above the shoulders, the support leg planted and the kicking leg swung out to the upper right with the boot sole visible, arms out for balance. The front-view row impact frame keeps the torso upright and the head level, the kicking leg extended toward the camera without shrinking the torso.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #077 생성·저장 완료

## #078 · 쥬멩이 — ⑤ skill-side (개인기 4종, 측면)

- **저장 이름**: `tmp/pitch-src/characters/char-ju010228-skill-side.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-ju010228` (이 스레드의 첫 스텝은 #074 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-ju010228-stand.png` (#074)
  - **필수** 이 캐릭터의 승인본 shoot: `tmp/pitch-src/characters/char-ju010228-shoot.png` (#077)
  - (권장) 파일럿 우왁굳의 승인본 skill-side: `tmp/pitch-src/characters/char-woowakgood-skill-side.png` (#005) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 4행이 서로 다른 개인기로 읽힘, 각 행 4프레임이 순서대로 진행, 레인보우 행에서 점프 프레임 확인, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters ju010228`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and shoot sheet as the exact references, draw the SAME character performing four football skill moves as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 4 rows, all in right-side view (profile, facing right).
Each row is a DIFFERENT move with its own clearly different silhouette; a crouch followed by a sprint must NOT be reused in more than one row. Keep the frame order of every row.
Row 1: STEPOVER (one leg circles over the ball spot while the other stays planted): (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
Row 2: ROULETTE (Marseille turn, the whole body spins around the planted foot): (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
Row 3: RAINBOW FLICK (a small hop, the heels flick the ball up and over the head): (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
Row 4: ELASTICO (flip-flap, a wide sideways fake): (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet. Every frame in the sheet must be different from the others, and each row must read as a different move even without the ball.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #078 생성·저장 완료

## #079 · 쥬멩이 — ⑥ skill-up (개인기 4종, 후면)

- **저장 이름**: `tmp/pitch-src/characters/char-ju010228-skill-up.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-ju010228` (이 스레드의 첫 스텝은 #074 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-ju010228-stand.png` (#074)
  - **필수** 이 캐릭터의 승인본 skill-side: `tmp/pitch-src/characters/char-ju010228-skill-side.png` (#078)
  - (권장) 파일럿 우왁굳의 승인본 skill-up: `tmp/pitch-src/characters/char-woowakgood-skill-up.png` (#006) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: skill-side와 같은 4종이 후면에서 읽힘, 머리·소품 유지, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters ju010228`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and shoot sheet as the exact references, draw the SAME character performing four football skill moves as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 4 rows, all in back view (facing away from the camera toward the goal).
Each row is a DIFFERENT move with its own clearly different silhouette; a crouch followed by a sprint must NOT be reused in more than one row. Keep the frame order of every row.
Row 1: STEPOVER (one leg circles over the ball spot while the other stays planted): (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
Row 2: ROULETTE (Marseille turn, the whole body spins around the planted foot): (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
Row 3: RAINBOW FLICK (a small hop, the heels flick the ball up and over the head): (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
Row 4: ELASTICO (flip-flap, a wide sideways fake): (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet. Every frame in the sheet must be different from the others, and each row must read as a different move even without the ball.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #079 생성·저장 완료

## #080 · 쥬멩이 — ⑦ emote (세리머니·아쉬움)

- **저장 이름**: `tmp/pitch-src/characters/char-ju010228-emote.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-ju010228` (이 스레드의 첫 스텝은 #074 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-ju010228-stand.png` (#074)
  - **필수** 이 캐릭터의 승인본 idle: `tmp/pitch-src/characters/char-ju010228-idle.png` (#075)
  - (권장) 파일럿 우왁굳의 승인본 emote: `tmp/pitch-src/characters/char-woowakgood-emote.png` (#007) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 정면, 3행이 서로 구별(팔 벌림 달리기 / 무릎 슬라이드 / 좌절), 셀 잘림 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters ju010228`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and idle sheet as the exact references, draw the SAME character's reaction animations, all facing the camera (front view), as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows.
Row 1: GOAL CELEBRATION A: running with both arms spread wide and mouth open in a shout, 4 frames of a run cycle. Row 2: GOAL CELEBRATION B: a knee slide with a raised fist: (1) leap forward, (2) landing on the knees, (3) sliding with the chest out and the fist up, (4) settling with a roar. Row 3: DISAPPOINTED: (1) hands rising to the head, (2) falling to the knees, (3) head in both hands, (4) shoulders slumped, slow sway.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #080 생성·저장 완료

## #081 · 쥬멩이 — ⑧ portrait (표정 4종 2×2)

- **저장 이름**: `tmp/pitch-src/characters/char-ju010228-portrait.png` (1024×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-ju010228` (이 스레드의 첫 스텝은 #074 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-ju010228-stand.png` (#074)
  - (권장) 파일럿 우왁굳의 승인본 portrait: `tmp/pitch-src/characters/char-woowakgood-portrait.png` (#008) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 4표정 구별, 머리색·소품 유지, 가장자리 잘림 없음(긴 머리 끝·주먹이 칸 가장자리에 닿지 않게), 비대칭 소품이 있는 쪽(좌/우) 기록 — 좌향은 측면 프레임을 미러하므로
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters ju010228`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite as the exact reference, draw a portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, drawn with more pixel detail than the sprite but in the same style, with the same bold navy outline.
Top-left: neutral focused expression. Top-right: confident smirk with a raised chin. Bottom-left: celebrating, shouting with joy and a raised fist near the face. Bottom-right: disappointed, eyes down and a grimace.
LAYOUT RULES (very important): draw each bust NARROWER than its cell: at most 80% of the cell width, centred horizontally in its own cell, so that a wide empty transparent gutter is left naturally between neighbouring busts. The four portraits sit in four equal square cells with a clear empty transparent gutter of at least 60 px between neighbouring portraits (they must never touch each other), and every portrait keeps at least 8% empty margin on its left, right and top edges. Each figure is a bust that is cut flat only along its own cell's bottom edge; the shoulders, arms, fists, headset, ears and hair must be COMPLETELY inside the cell on the left, right and top: a raised fist or elbow (bottom-left portrait) must be drawn fully inside the cell, so make that portrait's pose more compact. Identical hairstyle, accessories, kit colours and proportions in all four; same framing and scale (same head size); no glow, halo or coloured blur; no cell borders or grid lines; no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #081 생성·저장 완료

## #082 · 해파린 — ① stand (정면 서기 마스터)

- **저장 이름**: `tmp/pitch-src/characters/char-haepalin-stand.png` (1024×1024, P1)
- **스레드**: 🆕 **새 스레드 시작** — `T-PCH-haepalin`
- **레퍼런스 첨부**:
  - **필수** 선수 레퍼런스(전신): `tmp/pitch-src/refs/haepalin-ref.png` (사용자 보유 이미지를 이 경로에 복사)
  - (선택) 얼굴 클로즈업 레퍼런스: `tmp/pitch-src/refs/haepalin-ref-face.png`
  - (권장) 파일럿 우왁굳의 승인본 stand: `tmp/pitch-src/characters/char-woowakgood-stand.png` (#001) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 배경 투명/마젠타 단색, 글자·숫자 없음, 레퍼런스의 SIGNATURE 유지, 4.5등신 운동선수 비례(치비 아님), 네이비 2px 외곽선, 전신 잘림 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters haepalin`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Attached (first image) is the reference of the real streamer character "해파린". Redraw this exact character as a 16-bit arcade football game player sprite with athletic proportions (about 4.5 heads tall, NOT chibi).
Keep: short lavender-periwinkle bob with one ahoge, blue eyes, a jellyfish-shaped hair ornament and small heart hair clips. Keep the same colours and the same face vibe.
Outfit: the 잔디동 home kit: mint-green (#2ee8b6) short-sleeve football jersey with white shoulder-and-sleeve stripes and a small text-free white shield-with-sprout crest on the chest (no number), dark navy (#1b2050) shorts with a thin mint side stripe, white knee-high socks with a mint band, white football boots with mint soles
Pose: standing ready, front view (facing the camera), feet shoulder-width apart on one baseline, arms relaxed at the sides with loosely clenched fists, confident athletic stance, full body visible with a little empty margin on all sides.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
The jellyfish hairpin is made of blue and white pixel blocks.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #082 생성·저장 완료

## #083 · 해파린 — ② idle (준비 자세 2프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-haepalin-idle.png` (1024×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-haepalin` (이 스레드의 첫 스텝은 #082 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-haepalin-stand.png` (#082)
  - (권장) 파일럿 우왁굳의 승인본 idle: `tmp/pitch-src/characters/char-woowakgood-idle.png` (#002) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 3행 방향 정확(정면/우측/후면), 2열이 서로 다른 호흡 프레임, 볼 없음, 발끝 기준선 일치
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters haepalin`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite as the exact reference, draw the SAME character's idle animation as a sprite sheet on one 1024x1024 canvas: a strict grid of 2 columns x 3 rows.
Row 1: facing the camera (front view). Row 2: facing right (side view, profile). Row 3: facing away from the camera (back view).
The head-to-foot height of the three figures must match the attached standing sprite and stay within 72% of the cell height.
Column 1: ready stance, knees slightly bent, weight forward on the toes, arms loose and slightly away from the body, eyes/head toward where the ball would be. Column 2: the same stance breathing: torso about 2 pixels lower, shoulders dropped, hair and accessories shifted by one pixel.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #083 생성·저장 완료

## #084 · 해파린 — ③ run (달리기 6프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-haepalin-run.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-haepalin` (이 스레드의 첫 스텝은 #082 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-haepalin-stand.png` (#082)
  - **필수** 이 캐릭터의 승인본 idle: `tmp/pitch-src/characters/char-haepalin-idle.png` (#083)
  - (권장) 파일럿 우왁굳의 승인본 run: `tmp/pitch-src/characters/char-woowakgood-run.png` (#003) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: **측면 행 접지 프레임 1·4에서 앞발이 교대로 보임**, 프레임 2·5에서 두 발이 지면에서 뜸, 6프레임 모두 서로 다름, 걷기가 아닌 전력 질주 느낌
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters haepalin`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and idle sheet as the exact references, draw the SAME character's RUN cycle (a fast sprint, not a walk) as a sprite sheet on one 1536x1024 canvas: a strict grid of 6 columns x 3 rows.
Row 1 (top): running toward the camera (front view), 6 frames. Row 2 (middle): running to the right (side view), 6 frames. Row 3 (bottom): running away from the camera (back view), 6 frames.
Frame order in every row: (1) contact, left foot planted forward; (2) drive/airborne, both feet off the ground, body at its highest; (3) passing pose, right knee driving up; (4) contact, right foot planted forward; (5) drive/airborne, both feet off the ground; (6) passing pose, left knee driving up. Torso leans forward about 15 degrees, arms bent at about 90 degrees and swinging opposite to the legs, hair and accessories trailing by one or two pixels.
NON-NEGOTIABLE SIDE-VIEW CHECK (middle row, running right): in frame 1 the LEFT boot is the frontmost/rightmost boot and in frame 4 the RIGHT boot is the frontmost/rightmost boot. In those two contact frames show two fully visible, separate boots with a clear horizontal gap, and the front boot must swap sides between frame 1 and frame 4. Do not draw the same stride twice, do not put one boot directly behind the other, and do not hide a boot behind hair, clothes or a prop. Frames 2 and 5 must show both feet clearly off the ground. Before returning the image, inspect only the middle row and confirm the alternating leading boot is obvious.
BACK-VIEW ROW (bottom row, running away from the camera) must be a real sprint in EVERY frame, never a standing stance: the torso leans forward, the head stays small and compact between the shoulders (same size as in the front row), and each frame shows a different leg action: frame 1 right boot planted and left knee already lifting with the sole visible; frame 2 both boots off the ground; frame 3 right knee driving up with the sole visible; frame 4 left boot planted and right knee lifting; frame 5 both boots off the ground; frame 6 left knee driving up. Never draw the two legs side by side with both feet flat on the ground.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #084 생성·저장 완료

## #085 · 해파린 — ④ shoot (슛 4프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-haepalin-shoot.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-haepalin` (이 스레드의 첫 스텝은 #082 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-haepalin-stand.png` (#082)
  - **필수** 이 캐릭터의 승인본 run: `tmp/pitch-src/characters/char-haepalin-run.png` (#084)
  - (권장) 파일럿 우왁굳의 승인본 shoot: `tmp/pitch-src/characters/char-woowakgood-shoot.png` (#004) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 임팩트(3번째) 프레임에서 킥 다리가 완전히 뻗음, 상체가 셀 안에 있음, 후면 행(3행)이 명확, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters haepalin`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and run sheet as the exact references, draw the SAME character's SHOOTING animation as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows.
Row 1: kicking toward the camera (front view). Row 2: kicking toward the right (side view). Row 3: kicking away from the camera (back view, the most important row).
Frame order in every row: (1) wind-up: the kicking leg drawn far back with the knee bent, arms thrown out for balance, body leaning back slightly; (2) plant: the support foot planted firmly, torso rotating forward, kicking leg about to swing; (3) IMPACT: the kicking leg fully extended through the point where the ball would be, toes pointed, body low and driving, a sharp powerful pose; (4) follow-through: the kicking leg raised high past the impact point, torso rotated, the support leg lifting off the ground.
POSTURE RULES (all rows, especially the back-view row 3): the torso never folds forward more than about 25 degrees; the head always stays clearly ABOVE and between the shoulders and is never sunk into or hidden by the shoulders; only the hips and the kicking leg rotate hard. In the back-view row, frame 3 (IMPACT) shows the figure from behind with the upright torso, the head visible above the shoulders, the support leg planted and the kicking leg swung out to the upper right with the boot sole visible, arms out for balance. The front-view row impact frame keeps the torso upright and the head level, the kicking leg extended toward the camera without shrinking the torso.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #085 생성·저장 완료

## #086 · 해파린 — ⑤ skill-side (개인기 4종, 측면)

- **저장 이름**: `tmp/pitch-src/characters/char-haepalin-skill-side.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-haepalin` (이 스레드의 첫 스텝은 #082 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-haepalin-stand.png` (#082)
  - **필수** 이 캐릭터의 승인본 shoot: `tmp/pitch-src/characters/char-haepalin-shoot.png` (#085)
  - (권장) 파일럿 우왁굳의 승인본 skill-side: `tmp/pitch-src/characters/char-woowakgood-skill-side.png` (#005) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 4행이 서로 다른 개인기로 읽힘, 각 행 4프레임이 순서대로 진행, 레인보우 행에서 점프 프레임 확인, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters haepalin`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and shoot sheet as the exact references, draw the SAME character performing four football skill moves as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 4 rows, all in right-side view (profile, facing right).
Each row is a DIFFERENT move with its own clearly different silhouette; a crouch followed by a sprint must NOT be reused in more than one row. Keep the frame order of every row.
Row 1: STEPOVER (one leg circles over the ball spot while the other stays planted): (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
Row 2: ROULETTE (Marseille turn, the whole body spins around the planted foot): (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
Row 3: RAINBOW FLICK (a small hop, the heels flick the ball up and over the head): (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
Row 4: ELASTICO (flip-flap, a wide sideways fake): (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet. Every frame in the sheet must be different from the others, and each row must read as a different move even without the ball.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #086 생성·저장 완료

## #087 · 해파린 — ⑥ skill-up (개인기 4종, 후면)

- **저장 이름**: `tmp/pitch-src/characters/char-haepalin-skill-up.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-haepalin` (이 스레드의 첫 스텝은 #082 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-haepalin-stand.png` (#082)
  - **필수** 이 캐릭터의 승인본 skill-side: `tmp/pitch-src/characters/char-haepalin-skill-side.png` (#086)
  - (권장) 파일럿 우왁굳의 승인본 skill-up: `tmp/pitch-src/characters/char-woowakgood-skill-up.png` (#006) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: skill-side와 같은 4종이 후면에서 읽힘, 머리·소품 유지, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters haepalin`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and shoot sheet as the exact references, draw the SAME character performing four football skill moves as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 4 rows, all in back view (facing away from the camera toward the goal).
Each row is a DIFFERENT move with its own clearly different silhouette; a crouch followed by a sprint must NOT be reused in more than one row. Keep the frame order of every row.
Row 1: STEPOVER (one leg circles over the ball spot while the other stays planted): (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
Row 2: ROULETTE (Marseille turn, the whole body spins around the planted foot): (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
Row 3: RAINBOW FLICK (a small hop, the heels flick the ball up and over the head): (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
Row 4: ELASTICO (flip-flap, a wide sideways fake): (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet. Every frame in the sheet must be different from the others, and each row must read as a different move even without the ball.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #087 생성·저장 완료

## #088 · 해파린 — ⑦ emote (세리머니·아쉬움)

- **저장 이름**: `tmp/pitch-src/characters/char-haepalin-emote.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-haepalin` (이 스레드의 첫 스텝은 #082 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-haepalin-stand.png` (#082)
  - **필수** 이 캐릭터의 승인본 idle: `tmp/pitch-src/characters/char-haepalin-idle.png` (#083)
  - (권장) 파일럿 우왁굳의 승인본 emote: `tmp/pitch-src/characters/char-woowakgood-emote.png` (#007) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 정면, 3행이 서로 구별(팔 벌림 달리기 / 무릎 슬라이드 / 좌절), 셀 잘림 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters haepalin`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and idle sheet as the exact references, draw the SAME character's reaction animations, all facing the camera (front view), as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows.
Row 1: GOAL CELEBRATION A: running with both arms spread wide and mouth open in a shout, 4 frames of a run cycle. Row 2: GOAL CELEBRATION B: a knee slide with a raised fist: (1) leap forward, (2) landing on the knees, (3) sliding with the chest out and the fist up, (4) settling with a roar. Row 3: DISAPPOINTED: (1) hands rising to the head, (2) falling to the knees, (3) head in both hands, (4) shoulders slumped, slow sway.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #088 생성·저장 완료

## #089 · 해파린 — ⑧ portrait (표정 4종 2×2)

- **저장 이름**: `tmp/pitch-src/characters/char-haepalin-portrait.png` (1024×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-haepalin` (이 스레드의 첫 스텝은 #082 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-haepalin-stand.png` (#082)
  - (권장) 파일럿 우왁굳의 승인본 portrait: `tmp/pitch-src/characters/char-woowakgood-portrait.png` (#008) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 4표정 구별, 머리색·소품 유지, 가장자리 잘림 없음(긴 머리 끝·주먹이 칸 가장자리에 닿지 않게), 비대칭 소품이 있는 쪽(좌/우) 기록 — 좌향은 측면 프레임을 미러하므로
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters haepalin`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite as the exact reference, draw a portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, drawn with more pixel detail than the sprite but in the same style, with the same bold navy outline.
Top-left: neutral focused expression. Top-right: confident smirk with a raised chin. Bottom-left: celebrating, shouting with joy and a raised fist near the face. Bottom-right: disappointed, eyes down and a grimace.
LAYOUT RULES (very important): draw each bust NARROWER than its cell: at most 80% of the cell width, centred horizontally in its own cell, so that a wide empty transparent gutter is left naturally between neighbouring busts. The four portraits sit in four equal square cells with a clear empty transparent gutter of at least 60 px between neighbouring portraits (they must never touch each other), and every portrait keeps at least 8% empty margin on its left, right and top edges. Each figure is a bust that is cut flat only along its own cell's bottom edge; the shoulders, arms, fists, headset, ears and hair must be COMPLETELY inside the cell on the left, right and top: a raised fist or elbow (bottom-left portrait) must be drawn fully inside the cell, so make that portrait's pose more compact. Identical hairstyle, accessories, kit colours and proportions in all four; same framing and scale (same head size); no glow, halo or coloured blur; no cell borders or grid lines; no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #089 생성·저장 완료

## #090 · 빙밍 — ① stand (정면 서기 마스터)

- **저장 이름**: `tmp/pitch-src/characters/char-tleod1818-stand.png` (1024×1024, P1)
- **스레드**: 🆕 **새 스레드 시작** — `T-PCH-tleod1818`
- **레퍼런스 첨부**:
  - **필수** 선수 레퍼런스(전신): `tmp/pitch-src/refs/tleod1818-ref.png` (사용자 보유 이미지를 이 경로에 복사)
  - (선택) 얼굴 클로즈업 레퍼런스: `tmp/pitch-src/refs/tleod1818-ref-face.png`
  - (권장) 파일럿 우왁굳의 승인본 stand: `tmp/pitch-src/characters/char-woowakgood-stand.png` (#001) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 배경 투명/마젠타 단색, 글자·숫자 없음, 레퍼런스의 SIGNATURE 유지, 4.5등신 운동선수 비례(치비 아님), 네이비 2px 외곽선, 전신 잘림 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters tleod1818`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Attached (first image) is the reference of the real streamer character "빙밍". Redraw this exact character as a 16-bit arcade football game player sprite with athletic proportions (about 4.5 heads tall, NOT chibi).
Keep: black hair in a bun with a green leaf hairpin and a small white flower, blunt bangs, green eyes, black ribbon choker. Keep the same colours and the same face vibe.
Outfit: the 잔디동 home kit: mint-green (#2ee8b6) short-sleeve football jersey with white shoulder-and-sleeve stripes and a small text-free white shield-with-sprout crest on the chest (no number), dark navy (#1b2050) shorts with a thin mint side stripe, white knee-high socks with a mint band, white football boots with mint soles
Pose: standing ready, front view (facing the camera), feet shoulder-width apart on one baseline, arms relaxed at the sides with loosely clenched fists, confident athletic stance, full body visible with a little empty margin on all sides.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
Keep the leaf hairpin green.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #090 생성·저장 완료

## #091 · 빙밍 — ② idle (준비 자세 2프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-tleod1818-idle.png` (1024×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-tleod1818` (이 스레드의 첫 스텝은 #090 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-tleod1818-stand.png` (#090)
  - (권장) 파일럿 우왁굳의 승인본 idle: `tmp/pitch-src/characters/char-woowakgood-idle.png` (#002) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 3행 방향 정확(정면/우측/후면), 2열이 서로 다른 호흡 프레임, 볼 없음, 발끝 기준선 일치
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters tleod1818`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite as the exact reference, draw the SAME character's idle animation as a sprite sheet on one 1024x1024 canvas: a strict grid of 2 columns x 3 rows.
Row 1: facing the camera (front view). Row 2: facing right (side view, profile). Row 3: facing away from the camera (back view).
The head-to-foot height of the three figures must match the attached standing sprite and stay within 72% of the cell height.
Column 1: ready stance, knees slightly bent, weight forward on the toes, arms loose and slightly away from the body, eyes/head toward where the ball would be. Column 2: the same stance breathing: torso about 2 pixels lower, shoulders dropped, hair and accessories shifted by one pixel.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #091 생성·저장 완료

## #092 · 빙밍 — ③ run (달리기 6프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-tleod1818-run.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-tleod1818` (이 스레드의 첫 스텝은 #090 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-tleod1818-stand.png` (#090)
  - **필수** 이 캐릭터의 승인본 idle: `tmp/pitch-src/characters/char-tleod1818-idle.png` (#091)
  - (권장) 파일럿 우왁굳의 승인본 run: `tmp/pitch-src/characters/char-woowakgood-run.png` (#003) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: **측면 행 접지 프레임 1·4에서 앞발이 교대로 보임**, 프레임 2·5에서 두 발이 지면에서 뜸, 6프레임 모두 서로 다름, 걷기가 아닌 전력 질주 느낌
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters tleod1818`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and idle sheet as the exact references, draw the SAME character's RUN cycle (a fast sprint, not a walk) as a sprite sheet on one 1536x1024 canvas: a strict grid of 6 columns x 3 rows.
Row 1 (top): running toward the camera (front view), 6 frames. Row 2 (middle): running to the right (side view), 6 frames. Row 3 (bottom): running away from the camera (back view), 6 frames.
Frame order in every row: (1) contact, left foot planted forward; (2) drive/airborne, both feet off the ground, body at its highest; (3) passing pose, right knee driving up; (4) contact, right foot planted forward; (5) drive/airborne, both feet off the ground; (6) passing pose, left knee driving up. Torso leans forward about 15 degrees, arms bent at about 90 degrees and swinging opposite to the legs, hair and accessories trailing by one or two pixels.
NON-NEGOTIABLE SIDE-VIEW CHECK (middle row, running right): in frame 1 the LEFT boot is the frontmost/rightmost boot and in frame 4 the RIGHT boot is the frontmost/rightmost boot. In those two contact frames show two fully visible, separate boots with a clear horizontal gap, and the front boot must swap sides between frame 1 and frame 4. Do not draw the same stride twice, do not put one boot directly behind the other, and do not hide a boot behind hair, clothes or a prop. Frames 2 and 5 must show both feet clearly off the ground. Before returning the image, inspect only the middle row and confirm the alternating leading boot is obvious.
BACK-VIEW ROW (bottom row, running away from the camera) must be a real sprint in EVERY frame, never a standing stance: the torso leans forward, the head stays small and compact between the shoulders (same size as in the front row), and each frame shows a different leg action: frame 1 right boot planted and left knee already lifting with the sole visible; frame 2 both boots off the ground; frame 3 right knee driving up with the sole visible; frame 4 left boot planted and right knee lifting; frame 5 both boots off the ground; frame 6 left knee driving up. Never draw the two legs side by side with both feet flat on the ground.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #092 생성·저장 완료

## #093 · 빙밍 — ④ shoot (슛 4프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-tleod1818-shoot.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-tleod1818` (이 스레드의 첫 스텝은 #090 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-tleod1818-stand.png` (#090)
  - **필수** 이 캐릭터의 승인본 run: `tmp/pitch-src/characters/char-tleod1818-run.png` (#092)
  - (권장) 파일럿 우왁굳의 승인본 shoot: `tmp/pitch-src/characters/char-woowakgood-shoot.png` (#004) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 임팩트(3번째) 프레임에서 킥 다리가 완전히 뻗음, 상체가 셀 안에 있음, 후면 행(3행)이 명확, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters tleod1818`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and run sheet as the exact references, draw the SAME character's SHOOTING animation as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows.
Row 1: kicking toward the camera (front view). Row 2: kicking toward the right (side view). Row 3: kicking away from the camera (back view, the most important row).
Frame order in every row: (1) wind-up: the kicking leg drawn far back with the knee bent, arms thrown out for balance, body leaning back slightly; (2) plant: the support foot planted firmly, torso rotating forward, kicking leg about to swing; (3) IMPACT: the kicking leg fully extended through the point where the ball would be, toes pointed, body low and driving, a sharp powerful pose; (4) follow-through: the kicking leg raised high past the impact point, torso rotated, the support leg lifting off the ground.
POSTURE RULES (all rows, especially the back-view row 3): the torso never folds forward more than about 25 degrees; the head always stays clearly ABOVE and between the shoulders and is never sunk into or hidden by the shoulders; only the hips and the kicking leg rotate hard. In the back-view row, frame 3 (IMPACT) shows the figure from behind with the upright torso, the head visible above the shoulders, the support leg planted and the kicking leg swung out to the upper right with the boot sole visible, arms out for balance. The front-view row impact frame keeps the torso upright and the head level, the kicking leg extended toward the camera without shrinking the torso.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #093 생성·저장 완료

## #094 · 빙밍 — ⑤ skill-side (개인기 4종, 측면)

- **저장 이름**: `tmp/pitch-src/characters/char-tleod1818-skill-side.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-tleod1818` (이 스레드의 첫 스텝은 #090 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-tleod1818-stand.png` (#090)
  - **필수** 이 캐릭터의 승인본 shoot: `tmp/pitch-src/characters/char-tleod1818-shoot.png` (#093)
  - (권장) 파일럿 우왁굳의 승인본 skill-side: `tmp/pitch-src/characters/char-woowakgood-skill-side.png` (#005) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 4행이 서로 다른 개인기로 읽힘, 각 행 4프레임이 순서대로 진행, 레인보우 행에서 점프 프레임 확인, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters tleod1818`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and shoot sheet as the exact references, draw the SAME character performing four football skill moves as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 4 rows, all in right-side view (profile, facing right).
Each row is a DIFFERENT move with its own clearly different silhouette; a crouch followed by a sprint must NOT be reused in more than one row. Keep the frame order of every row.
Row 1: STEPOVER (one leg circles over the ball spot while the other stays planted): (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
Row 2: ROULETTE (Marseille turn, the whole body spins around the planted foot): (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
Row 3: RAINBOW FLICK (a small hop, the heels flick the ball up and over the head): (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
Row 4: ELASTICO (flip-flap, a wide sideways fake): (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet. Every frame in the sheet must be different from the others, and each row must read as a different move even without the ball.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #094 생성·저장 완료

## #095 · 빙밍 — ⑥ skill-up (개인기 4종, 후면)

- **저장 이름**: `tmp/pitch-src/characters/char-tleod1818-skill-up.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-tleod1818` (이 스레드의 첫 스텝은 #090 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-tleod1818-stand.png` (#090)
  - **필수** 이 캐릭터의 승인본 skill-side: `tmp/pitch-src/characters/char-tleod1818-skill-side.png` (#094)
  - (권장) 파일럿 우왁굳의 승인본 skill-up: `tmp/pitch-src/characters/char-woowakgood-skill-up.png` (#006) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: skill-side와 같은 4종이 후면에서 읽힘, 머리·소품 유지, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters tleod1818`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and shoot sheet as the exact references, draw the SAME character performing four football skill moves as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 4 rows, all in back view (facing away from the camera toward the goal).
Each row is a DIFFERENT move with its own clearly different silhouette; a crouch followed by a sprint must NOT be reused in more than one row. Keep the frame order of every row.
Row 1: STEPOVER (one leg circles over the ball spot while the other stays planted): (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
Row 2: ROULETTE (Marseille turn, the whole body spins around the planted foot): (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
Row 3: RAINBOW FLICK (a small hop, the heels flick the ball up and over the head): (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
Row 4: ELASTICO (flip-flap, a wide sideways fake): (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet. Every frame in the sheet must be different from the others, and each row must read as a different move even without the ball.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #095 생성·저장 완료

## #096 · 빙밍 — ⑦ emote (세리머니·아쉬움)

- **저장 이름**: `tmp/pitch-src/characters/char-tleod1818-emote.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-tleod1818` (이 스레드의 첫 스텝은 #090 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-tleod1818-stand.png` (#090)
  - **필수** 이 캐릭터의 승인본 idle: `tmp/pitch-src/characters/char-tleod1818-idle.png` (#091)
  - (권장) 파일럿 우왁굳의 승인본 emote: `tmp/pitch-src/characters/char-woowakgood-emote.png` (#007) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 정면, 3행이 서로 구별(팔 벌림 달리기 / 무릎 슬라이드 / 좌절), 셀 잘림 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters tleod1818`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and idle sheet as the exact references, draw the SAME character's reaction animations, all facing the camera (front view), as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows.
Row 1: GOAL CELEBRATION A: running with both arms spread wide and mouth open in a shout, 4 frames of a run cycle. Row 2: GOAL CELEBRATION B: a knee slide with a raised fist: (1) leap forward, (2) landing on the knees, (3) sliding with the chest out and the fist up, (4) settling with a roar. Row 3: DISAPPOINTED: (1) hands rising to the head, (2) falling to the knees, (3) head in both hands, (4) shoulders slumped, slow sway.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #096 생성·저장 완료

## #097 · 빙밍 — ⑧ portrait (표정 4종 2×2)

- **저장 이름**: `tmp/pitch-src/characters/char-tleod1818-portrait.png` (1024×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-tleod1818` (이 스레드의 첫 스텝은 #090 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-tleod1818-stand.png` (#090)
  - (권장) 파일럿 우왁굳의 승인본 portrait: `tmp/pitch-src/characters/char-woowakgood-portrait.png` (#008) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 4표정 구별, 머리색·소품 유지, 가장자리 잘림 없음(긴 머리 끝·주먹이 칸 가장자리에 닿지 않게), 비대칭 소품이 있는 쪽(좌/우) 기록 — 좌향은 측면 프레임을 미러하므로
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters tleod1818`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite as the exact reference, draw a portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, drawn with more pixel detail than the sprite but in the same style, with the same bold navy outline.
Top-left: neutral focused expression. Top-right: confident smirk with a raised chin. Bottom-left: celebrating, shouting with joy and a raised fist near the face. Bottom-right: disappointed, eyes down and a grimace.
LAYOUT RULES (very important): draw each bust NARROWER than its cell: at most 80% of the cell width, centred horizontally in its own cell, so that a wide empty transparent gutter is left naturally between neighbouring busts. The four portraits sit in four equal square cells with a clear empty transparent gutter of at least 60 px between neighbouring portraits (they must never touch each other), and every portrait keeps at least 8% empty margin on its left, right and top edges. Each figure is a bust that is cut flat only along its own cell's bottom edge; the shoulders, arms, fists, headset, ears and hair must be COMPLETELY inside the cell on the left, right and top: a raised fist or elbow (bottom-left portrait) must be drawn fully inside the cell, so make that portrait's pose more compact. Identical hairstyle, accessories, kit colours and proportions in all four; same framing and scale (same head size); no glow, halo or coloured blur; no cell borders or grid lines; no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #097 생성·저장 완료

## #098 · 다시바 — ① stand (정면 서기 마스터)

- **저장 이름**: `tmp/pitch-src/characters/char-tdnlamuron-stand.png` (1024×1024, P1)
- **스레드**: 🆕 **새 스레드 시작** — `T-PCH-tdnlamuron`
- **레퍼런스 첨부**:
  - **필수** 선수 레퍼런스(전신): `tmp/pitch-src/refs/tdnlamuron-ref.png` (사용자 보유 이미지를 이 경로에 복사)
  - (선택) 얼굴 클로즈업 레퍼런스: `tmp/pitch-src/refs/tdnlamuron-ref-face.png`
  - (권장) 파일럿 우왁굳의 승인본 stand: `tmp/pitch-src/characters/char-woowakgood-stand.png` (#001) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 배경 투명/마젠타 단색, 글자·숫자 없음, 레퍼런스의 SIGNATURE 유지, 4.5등신 운동선수 비례(치비 아님), 네이비 2px 외곽선, 전신 잘림 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters tdnlamuron`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Attached (first image) is the reference of the real streamer character "다시바". Redraw this exact character as a 16-bit arcade football game player sprite with athletic proportions (about 4.5 heads tall, NOT chibi).
Keep: short black hair with orange and white streaks, cat ears with pink inner ear, a small round badge hairpin (no number), amber eyes, black choker. Keep the same colours and the same face vibe.
Outfit: the 잔디동 home kit: mint-green (#2ee8b6) short-sleeve football jersey with white shoulder-and-sleeve stripes and a small text-free white shield-with-sprout crest on the chest (no number), dark navy (#1b2050) shorts with a thin mint side stripe, white knee-high socks with a mint band, white football boots with mint soles
Pose: standing ready, front view (facing the camera), feet shoulder-width apart on one baseline, arms relaxed at the sides with loosely clenched fists, confident athletic stance, full body visible with a little empty margin on all sides.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
Leave extra empty space above the ears; draw the inner-ear pink in coral (#ff4d6d), never magenta.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #098 생성·저장 완료

## #099 · 다시바 — ② idle (준비 자세 2프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-tdnlamuron-idle.png` (1024×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-tdnlamuron` (이 스레드의 첫 스텝은 #098 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-tdnlamuron-stand.png` (#098)
  - (권장) 파일럿 우왁굳의 승인본 idle: `tmp/pitch-src/characters/char-woowakgood-idle.png` (#002) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 3행 방향 정확(정면/우측/후면), 2열이 서로 다른 호흡 프레임, 볼 없음, 발끝 기준선 일치
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters tdnlamuron`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite as the exact reference, draw the SAME character's idle animation as a sprite sheet on one 1024x1024 canvas: a strict grid of 2 columns x 3 rows.
Row 1: facing the camera (front view). Row 2: facing right (side view, profile). Row 3: facing away from the camera (back view).
The head-to-foot height of the three figures must match the attached standing sprite and stay within 72% of the cell height.
Column 1: ready stance, knees slightly bent, weight forward on the toes, arms loose and slightly away from the body, eyes/head toward where the ball would be. Column 2: the same stance breathing: torso about 2 pixels lower, shoulders dropped, hair and accessories shifted by one pixel.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #099 생성·저장 완료

## #100 · 다시바 — ③ run (달리기 6프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-tdnlamuron-run.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-tdnlamuron` (이 스레드의 첫 스텝은 #098 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-tdnlamuron-stand.png` (#098)
  - **필수** 이 캐릭터의 승인본 idle: `tmp/pitch-src/characters/char-tdnlamuron-idle.png` (#099)
  - (권장) 파일럿 우왁굳의 승인본 run: `tmp/pitch-src/characters/char-woowakgood-run.png` (#003) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: **측면 행 접지 프레임 1·4에서 앞발이 교대로 보임**, 프레임 2·5에서 두 발이 지면에서 뜸, 6프레임 모두 서로 다름, 걷기가 아닌 전력 질주 느낌
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters tdnlamuron`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and idle sheet as the exact references, draw the SAME character's RUN cycle (a fast sprint, not a walk) as a sprite sheet on one 1536x1024 canvas: a strict grid of 6 columns x 3 rows.
Row 1 (top): running toward the camera (front view), 6 frames. Row 2 (middle): running to the right (side view), 6 frames. Row 3 (bottom): running away from the camera (back view), 6 frames.
Frame order in every row: (1) contact, left foot planted forward; (2) drive/airborne, both feet off the ground, body at its highest; (3) passing pose, right knee driving up; (4) contact, right foot planted forward; (5) drive/airborne, both feet off the ground; (6) passing pose, left knee driving up. Torso leans forward about 15 degrees, arms bent at about 90 degrees and swinging opposite to the legs, hair and accessories trailing by one or two pixels.
NON-NEGOTIABLE SIDE-VIEW CHECK (middle row, running right): in frame 1 the LEFT boot is the frontmost/rightmost boot and in frame 4 the RIGHT boot is the frontmost/rightmost boot. In those two contact frames show two fully visible, separate boots with a clear horizontal gap, and the front boot must swap sides between frame 1 and frame 4. Do not draw the same stride twice, do not put one boot directly behind the other, and do not hide a boot behind hair, clothes or a prop. Frames 2 and 5 must show both feet clearly off the ground. Before returning the image, inspect only the middle row and confirm the alternating leading boot is obvious.
BACK-VIEW ROW (bottom row, running away from the camera) must be a real sprint in EVERY frame, never a standing stance: the torso leans forward, the head stays small and compact between the shoulders (same size as in the front row), and each frame shows a different leg action: frame 1 right boot planted and left knee already lifting with the sole visible; frame 2 both boots off the ground; frame 3 right knee driving up with the sole visible; frame 4 left boot planted and right knee lifting; frame 5 both boots off the ground; frame 6 left knee driving up. Never draw the two legs side by side with both feet flat on the ground.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #100 생성·저장 완료

## #101 · 다시바 — ④ shoot (슛 4프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-tdnlamuron-shoot.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-tdnlamuron` (이 스레드의 첫 스텝은 #098 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-tdnlamuron-stand.png` (#098)
  - **필수** 이 캐릭터의 승인본 run: `tmp/pitch-src/characters/char-tdnlamuron-run.png` (#100)
  - (권장) 파일럿 우왁굳의 승인본 shoot: `tmp/pitch-src/characters/char-woowakgood-shoot.png` (#004) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 임팩트(3번째) 프레임에서 킥 다리가 완전히 뻗음, 상체가 셀 안에 있음, 후면 행(3행)이 명확, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters tdnlamuron`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and run sheet as the exact references, draw the SAME character's SHOOTING animation as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows.
Row 1: kicking toward the camera (front view). Row 2: kicking toward the right (side view). Row 3: kicking away from the camera (back view, the most important row).
Frame order in every row: (1) wind-up: the kicking leg drawn far back with the knee bent, arms thrown out for balance, body leaning back slightly; (2) plant: the support foot planted firmly, torso rotating forward, kicking leg about to swing; (3) IMPACT: the kicking leg fully extended through the point where the ball would be, toes pointed, body low and driving, a sharp powerful pose; (4) follow-through: the kicking leg raised high past the impact point, torso rotated, the support leg lifting off the ground.
POSTURE RULES (all rows, especially the back-view row 3): the torso never folds forward more than about 25 degrees; the head always stays clearly ABOVE and between the shoulders and is never sunk into or hidden by the shoulders; only the hips and the kicking leg rotate hard. In the back-view row, frame 3 (IMPACT) shows the figure from behind with the upright torso, the head visible above the shoulders, the support leg planted and the kicking leg swung out to the upper right with the boot sole visible, arms out for balance. The front-view row impact frame keeps the torso upright and the head level, the kicking leg extended toward the camera without shrinking the torso.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #101 생성·저장 완료

## #102 · 다시바 — ⑤ skill-side (개인기 4종, 측면)

- **저장 이름**: `tmp/pitch-src/characters/char-tdnlamuron-skill-side.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-tdnlamuron` (이 스레드의 첫 스텝은 #098 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-tdnlamuron-stand.png` (#098)
  - **필수** 이 캐릭터의 승인본 shoot: `tmp/pitch-src/characters/char-tdnlamuron-shoot.png` (#101)
  - (권장) 파일럿 우왁굳의 승인본 skill-side: `tmp/pitch-src/characters/char-woowakgood-skill-side.png` (#005) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 4행이 서로 다른 개인기로 읽힘, 각 행 4프레임이 순서대로 진행, 레인보우 행에서 점프 프레임 확인, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters tdnlamuron`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and shoot sheet as the exact references, draw the SAME character performing four football skill moves as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 4 rows, all in right-side view (profile, facing right).
Each row is a DIFFERENT move with its own clearly different silhouette; a crouch followed by a sprint must NOT be reused in more than one row. Keep the frame order of every row.
Row 1: STEPOVER (one leg circles over the ball spot while the other stays planted): (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
Row 2: ROULETTE (Marseille turn, the whole body spins around the planted foot): (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
Row 3: RAINBOW FLICK (a small hop, the heels flick the ball up and over the head): (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
Row 4: ELASTICO (flip-flap, a wide sideways fake): (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet. Every frame in the sheet must be different from the others, and each row must read as a different move even without the ball.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #102 생성·저장 완료

## #103 · 다시바 — ⑥ skill-up (개인기 4종, 후면)

- **저장 이름**: `tmp/pitch-src/characters/char-tdnlamuron-skill-up.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-tdnlamuron` (이 스레드의 첫 스텝은 #098 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-tdnlamuron-stand.png` (#098)
  - **필수** 이 캐릭터의 승인본 skill-side: `tmp/pitch-src/characters/char-tdnlamuron-skill-side.png` (#102)
  - (권장) 파일럿 우왁굳의 승인본 skill-up: `tmp/pitch-src/characters/char-woowakgood-skill-up.png` (#006) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: skill-side와 같은 4종이 후면에서 읽힘, 머리·소품 유지, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters tdnlamuron`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and shoot sheet as the exact references, draw the SAME character performing four football skill moves as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 4 rows, all in back view (facing away from the camera toward the goal).
Each row is a DIFFERENT move with its own clearly different silhouette; a crouch followed by a sprint must NOT be reused in more than one row. Keep the frame order of every row.
Row 1: STEPOVER (one leg circles over the ball spot while the other stays planted): (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
Row 2: ROULETTE (Marseille turn, the whole body spins around the planted foot): (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
Row 3: RAINBOW FLICK (a small hop, the heels flick the ball up and over the head): (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
Row 4: ELASTICO (flip-flap, a wide sideways fake): (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet. Every frame in the sheet must be different from the others, and each row must read as a different move even without the ball.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #103 생성·저장 완료

## #104 · 다시바 — ⑦ emote (세리머니·아쉬움)

- **저장 이름**: `tmp/pitch-src/characters/char-tdnlamuron-emote.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-tdnlamuron` (이 스레드의 첫 스텝은 #098 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-tdnlamuron-stand.png` (#098)
  - **필수** 이 캐릭터의 승인본 idle: `tmp/pitch-src/characters/char-tdnlamuron-idle.png` (#099)
  - (권장) 파일럿 우왁굳의 승인본 emote: `tmp/pitch-src/characters/char-woowakgood-emote.png` (#007) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 정면, 3행이 서로 구별(팔 벌림 달리기 / 무릎 슬라이드 / 좌절), 셀 잘림 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters tdnlamuron`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and idle sheet as the exact references, draw the SAME character's reaction animations, all facing the camera (front view), as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows.
Row 1: GOAL CELEBRATION A: running with both arms spread wide and mouth open in a shout, 4 frames of a run cycle. Row 2: GOAL CELEBRATION B: a knee slide with a raised fist: (1) leap forward, (2) landing on the knees, (3) sliding with the chest out and the fist up, (4) settling with a roar. Row 3: DISAPPOINTED: (1) hands rising to the head, (2) falling to the knees, (3) head in both hands, (4) shoulders slumped, slow sway.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #104 생성·저장 완료

## #105 · 다시바 — ⑧ portrait (표정 4종 2×2)

- **저장 이름**: `tmp/pitch-src/characters/char-tdnlamuron-portrait.png` (1024×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-tdnlamuron` (이 스레드의 첫 스텝은 #098 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-tdnlamuron-stand.png` (#098)
  - (권장) 파일럿 우왁굳의 승인본 portrait: `tmp/pitch-src/characters/char-woowakgood-portrait.png` (#008) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 4표정 구별, 머리색·소품 유지, 가장자리 잘림 없음(긴 머리 끝·주먹이 칸 가장자리에 닿지 않게), 비대칭 소품이 있는 쪽(좌/우) 기록 — 좌향은 측면 프레임을 미러하므로
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters tdnlamuron`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite as the exact reference, draw a portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, drawn with more pixel detail than the sprite but in the same style, with the same bold navy outline.
Top-left: neutral focused expression. Top-right: confident smirk with a raised chin. Bottom-left: celebrating, shouting with joy and a raised fist near the face. Bottom-right: disappointed, eyes down and a grimace.
LAYOUT RULES (very important): draw each bust NARROWER than its cell: at most 80% of the cell width, centred horizontally in its own cell, so that a wide empty transparent gutter is left naturally between neighbouring busts. The four portraits sit in four equal square cells with a clear empty transparent gutter of at least 60 px between neighbouring portraits (they must never touch each other), and every portrait keeps at least 8% empty margin on its left, right and top edges. Each figure is a bust that is cut flat only along its own cell's bottom edge; the shoulders, arms, fists, headset, ears and hair must be COMPLETELY inside the cell on the left, right and top: a raised fist or elbow (bottom-left portrait) must be drawn fully inside the cell, so make that portrait's pose more compact. Identical hairstyle, accessories, kit colours and proportions in all four; same framing and scale (same head size); no glow, halo or coloured blur; no cell borders or grid lines; no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #105 생성·저장 완료

## #106 · 리냐 — ① stand (정면 서기 마스터)

- **저장 이름**: `tmp/pitch-src/characters/char-lina0108-stand.png` (1024×1024, P1)
- **스레드**: 🆕 **새 스레드 시작** — `T-PCH-lina0108`
- **레퍼런스 첨부**:
  - **필수** 선수 레퍼런스(전신): `tmp/pitch-src/refs/lina0108-ref.png` (사용자 보유 이미지를 이 경로에 복사)
  - (선택) 얼굴 클로즈업 레퍼런스: `tmp/pitch-src/refs/lina0108-ref-face.png`
  - (권장) 파일럿 우왁굳의 승인본 stand: `tmp/pitch-src/characters/char-woowakgood-stand.png` (#001) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 배경 투명/마젠타 단색, 글자·숫자 없음, 레퍼런스의 SIGNATURE 유지, 4.5등신 운동선수 비례(치비 아님), 네이비 2px 외곽선, 전신 잘림 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters lina0108`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Attached (first image) is the reference of the real streamer character "리냐". Redraw this exact character as a 16-bit arcade football game player sprite with athletic proportions (about 4.5 heads tall, NOT chibi).
Keep: long messy red-pink hair with a white streak, small pink-and-white horns, amber eyes, playful smirk. Keep the same colours and the same face vibe.
Outfit: the 잔디동 home kit: mint-green (#2ee8b6) short-sleeve football jersey with white shoulder-and-sleeve stripes and a small text-free white shield-with-sprout crest on the chest (no number), dark navy (#1b2050) shorts with a thin mint side stripe, white knee-high socks with a mint band, white football boots with mint soles
Pose: standing ready, front view (facing the camera), feet shoulder-width apart on one baseline, arms relaxed at the sides with loosely clenched fists, confident athletic stance, full body visible with a little empty margin on all sides.
Canvas: 1024x1024, the character centred, about 85% of the canvas height. Single character only.
The hair is voluminous, so leave generous frame margin; draw pinks as coral or apricot tones, never magenta.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #106 생성·저장 완료

## #107 · 리냐 — ② idle (준비 자세 2프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-lina0108-idle.png` (1024×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-lina0108` (이 스레드의 첫 스텝은 #106 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-lina0108-stand.png` (#106)
  - (권장) 파일럿 우왁굳의 승인본 idle: `tmp/pitch-src/characters/char-woowakgood-idle.png` (#002) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 3행 방향 정확(정면/우측/후면), 2열이 서로 다른 호흡 프레임, 볼 없음, 발끝 기준선 일치
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters lina0108`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite as the exact reference, draw the SAME character's idle animation as a sprite sheet on one 1024x1024 canvas: a strict grid of 2 columns x 3 rows.
Row 1: facing the camera (front view). Row 2: facing right (side view, profile). Row 3: facing away from the camera (back view).
The head-to-foot height of the three figures must match the attached standing sprite and stay within 72% of the cell height.
Column 1: ready stance, knees slightly bent, weight forward on the toes, arms loose and slightly away from the body, eyes/head toward where the ball would be. Column 2: the same stance breathing: torso about 2 pixels lower, shoulders dropped, hair and accessories shifted by one pixel.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #107 생성·저장 완료

## #108 · 리냐 — ③ run (달리기 6프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-lina0108-run.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-lina0108` (이 스레드의 첫 스텝은 #106 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-lina0108-stand.png` (#106)
  - **필수** 이 캐릭터의 승인본 idle: `tmp/pitch-src/characters/char-lina0108-idle.png` (#107)
  - (권장) 파일럿 우왁굳의 승인본 run: `tmp/pitch-src/characters/char-woowakgood-run.png` (#003) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: **측면 행 접지 프레임 1·4에서 앞발이 교대로 보임**, 프레임 2·5에서 두 발이 지면에서 뜸, 6프레임 모두 서로 다름, 걷기가 아닌 전력 질주 느낌
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters lina0108`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and idle sheet as the exact references, draw the SAME character's RUN cycle (a fast sprint, not a walk) as a sprite sheet on one 1536x1024 canvas: a strict grid of 6 columns x 3 rows.
Row 1 (top): running toward the camera (front view), 6 frames. Row 2 (middle): running to the right (side view), 6 frames. Row 3 (bottom): running away from the camera (back view), 6 frames.
Frame order in every row: (1) contact, left foot planted forward; (2) drive/airborne, both feet off the ground, body at its highest; (3) passing pose, right knee driving up; (4) contact, right foot planted forward; (5) drive/airborne, both feet off the ground; (6) passing pose, left knee driving up. Torso leans forward about 15 degrees, arms bent at about 90 degrees and swinging opposite to the legs, hair and accessories trailing by one or two pixels.
NON-NEGOTIABLE SIDE-VIEW CHECK (middle row, running right): in frame 1 the LEFT boot is the frontmost/rightmost boot and in frame 4 the RIGHT boot is the frontmost/rightmost boot. In those two contact frames show two fully visible, separate boots with a clear horizontal gap, and the front boot must swap sides between frame 1 and frame 4. Do not draw the same stride twice, do not put one boot directly behind the other, and do not hide a boot behind hair, clothes or a prop. Frames 2 and 5 must show both feet clearly off the ground. Before returning the image, inspect only the middle row and confirm the alternating leading boot is obvious.
BACK-VIEW ROW (bottom row, running away from the camera) must be a real sprint in EVERY frame, never a standing stance: the torso leans forward, the head stays small and compact between the shoulders (same size as in the front row), and each frame shows a different leg action: frame 1 right boot planted and left knee already lifting with the sole visible; frame 2 both boots off the ground; frame 3 right knee driving up with the sole visible; frame 4 left boot planted and right knee lifting; frame 5 both boots off the ground; frame 6 left knee driving up. Never draw the two legs side by side with both feet flat on the ground.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #108 생성·저장 완료

## #109 · 리냐 — ④ shoot (슛 4프레임 × 3방향)

- **저장 이름**: `tmp/pitch-src/characters/char-lina0108-shoot.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-lina0108` (이 스레드의 첫 스텝은 #106 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-lina0108-stand.png` (#106)
  - **필수** 이 캐릭터의 승인본 run: `tmp/pitch-src/characters/char-lina0108-run.png` (#108)
  - (권장) 파일럿 우왁굳의 승인본 shoot: `tmp/pitch-src/characters/char-woowakgood-shoot.png` (#004) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 임팩트(3번째) 프레임에서 킥 다리가 완전히 뻗음, 상체가 셀 안에 있음, 후면 행(3행)이 명확, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters lina0108`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and run sheet as the exact references, draw the SAME character's SHOOTING animation as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows.
Row 1: kicking toward the camera (front view). Row 2: kicking toward the right (side view). Row 3: kicking away from the camera (back view, the most important row).
Frame order in every row: (1) wind-up: the kicking leg drawn far back with the knee bent, arms thrown out for balance, body leaning back slightly; (2) plant: the support foot planted firmly, torso rotating forward, kicking leg about to swing; (3) IMPACT: the kicking leg fully extended through the point where the ball would be, toes pointed, body low and driving, a sharp powerful pose; (4) follow-through: the kicking leg raised high past the impact point, torso rotated, the support leg lifting off the ground.
POSTURE RULES (all rows, especially the back-view row 3): the torso never folds forward more than about 25 degrees; the head always stays clearly ABOVE and between the shoulders and is never sunk into or hidden by the shoulders; only the hips and the kicking leg rotate hard. In the back-view row, frame 3 (IMPACT) shows the figure from behind with the upright torso, the head visible above the shoulders, the support leg planted and the kicking leg swung out to the upper right with the boot sole visible, arms out for balance. The front-view row impact frame keeps the torso upright and the head level, the kicking leg extended toward the camera without shrinking the torso.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #109 생성·저장 완료

## #110 · 리냐 — ⑤ skill-side (개인기 4종, 측면)

- **저장 이름**: `tmp/pitch-src/characters/char-lina0108-skill-side.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-lina0108` (이 스레드의 첫 스텝은 #106 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-lina0108-stand.png` (#106)
  - **필수** 이 캐릭터의 승인본 shoot: `tmp/pitch-src/characters/char-lina0108-shoot.png` (#109)
  - (권장) 파일럿 우왁굳의 승인본 skill-side: `tmp/pitch-src/characters/char-woowakgood-skill-side.png` (#005) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 4행이 서로 다른 개인기로 읽힘, 각 행 4프레임이 순서대로 진행, 레인보우 행에서 점프 프레임 확인, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters lina0108`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and shoot sheet as the exact references, draw the SAME character performing four football skill moves as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 4 rows, all in right-side view (profile, facing right).
Each row is a DIFFERENT move with its own clearly different silhouette; a crouch followed by a sprint must NOT be reused in more than one row. Keep the frame order of every row.
Row 1: STEPOVER (one leg circles over the ball spot while the other stays planted): (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
Row 2: ROULETTE (Marseille turn, the whole body spins around the planted foot): (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
Row 3: RAINBOW FLICK (a small hop, the heels flick the ball up and over the head): (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
Row 4: ELASTICO (flip-flap, a wide sideways fake): (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet. Every frame in the sheet must be different from the others, and each row must read as a different move even without the ball.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #110 생성·저장 완료

## #111 · 리냐 — ⑥ skill-up (개인기 4종, 후면)

- **저장 이름**: `tmp/pitch-src/characters/char-lina0108-skill-up.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-lina0108` (이 스레드의 첫 스텝은 #106 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-lina0108-stand.png` (#106)
  - **필수** 이 캐릭터의 승인본 skill-side: `tmp/pitch-src/characters/char-lina0108-skill-side.png` (#110)
  - (권장) 파일럿 우왁굳의 승인본 skill-up: `tmp/pitch-src/characters/char-woowakgood-skill-up.png` (#006) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: skill-side와 같은 4종이 후면에서 읽힘, 머리·소품 유지, 볼 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters lina0108`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and shoot sheet as the exact references, draw the SAME character performing four football skill moves as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 4 rows, all in back view (facing away from the camera toward the goal).
Each row is a DIFFERENT move with its own clearly different silhouette; a crouch followed by a sprint must NOT be reused in more than one row. Keep the frame order of every row.
Row 1: STEPOVER (one leg circles over the ball spot while the other stays planted): (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
Row 2: ROULETTE (Marseille turn, the whole body spins around the planted foot): (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
Row 3: RAINBOW FLICK (a small hop, the heels flick the ball up and over the head): (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
Row 4: ELASTICO (flip-flap, a wide sideways fake): (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet. Every frame in the sheet must be different from the others, and each row must read as a different move even without the ball.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #111 생성·저장 완료

## #112 · 리냐 — ⑦ emote (세리머니·아쉬움)

- **저장 이름**: `tmp/pitch-src/characters/char-lina0108-emote.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-lina0108` (이 스레드의 첫 스텝은 #106 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-lina0108-stand.png` (#106)
  - **필수** 이 캐릭터의 승인본 idle: `tmp/pitch-src/characters/char-lina0108-idle.png` (#107)
  - (권장) 파일럿 우왁굳의 승인본 emote: `tmp/pitch-src/characters/char-woowakgood-emote.png` (#007) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 정면, 3행이 서로 구별(팔 벌림 달리기 / 무릎 슬라이드 / 좌절), 셀 잘림 없음
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters lina0108`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite and idle sheet as the exact references, draw the SAME character's reaction animations, all facing the camera (front view), as a sprite sheet on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows.
Row 1: GOAL CELEBRATION A: running with both arms spread wide and mouth open in a shout, 4 frames of a run cycle. Row 2: GOAL CELEBRATION B: a knee slide with a raised fist: (1) leap forward, (2) landing on the knees, (3) sliding with the chest out and the fist up, (4) settling with a roar. Row 3: DISAPPOINTED: (1) hands rising to the head, (2) falling to the knees, (3) head in both hands, (4) shoulders slumped, slow sway.
Do NOT draw a football anywhere (the ball is a separate sprite); animate the legs as if a ball were at the feet.
Rules: strict grid, every cell exactly the same size, one pose per cell, centred, feet on the same baseline row in every cell of a row; identical character design, palette, proportions and pixel size in every cell. SCALE AND MARGIN (very important): the standing figure is at most 72% of the cell height and 80% of the cell width, so even jumping, kicking or sliding poses stay inside 82% of the cell height, with at least 12% empty transparent space above the head and below the feet and at least 8% at both sides in EVERY cell; no part of the character (head, hair, ears, fists, boots) may touch or cross a cell edge, and characters in neighbouring rows must never touch each other. The back-view and side-view figures are the SAME figure at the SAME scale as the front view: identical height, head size and shoulder width, no bulkier torso. No glow, halo, aura or coloured blur around the figures. No motion blur, no shadows, no cell borders or grid lines, no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #112 생성·저장 완료

## #113 · 리냐 — ⑧ portrait (표정 4종 2×2)

- **저장 이름**: `tmp/pitch-src/characters/char-lina0108-portrait.png` (1024×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-lina0108` (이 스레드의 첫 스텝은 #106 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-lina0108-stand.png` (#106)
  - (권장) 파일럿 우왁굳의 승인본 portrait: `tmp/pitch-src/characters/char-woowakgood-portrait.png` (#008) — **포즈 레이아웃·픽셀 스타일 샘플 전용**, 정체성 복사 금지
- **검수 체크**: 4표정 구별, 머리색·소품 유지, 가장자리 잘림 없음(긴 머리 끝·주먹이 칸 가장자리에 닿지 않게), 비대칭 소품이 있는 쪽(좌/우) 기록 — 좌향은 측면 프레임을 미러하므로
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 A1 변환 QA 로 대체(QA 경고 없음).
- **변환**: `pnpm convert:pitch-art -- characters lina0108`

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. Players have athletic proportions about 4.5 heads tall (small head, long legs, broad shoulders). They are NOT chibi and NOT cute-deformed. Hands and boots are clearly readable. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Using the attached standing sprite as the exact reference, draw a portrait sheet of the SAME character on one 1024x1024 canvas: a 2x2 grid of head-and-shoulders portraits (bust, facing the camera, slightly angled), each cell the same size, drawn with more pixel detail than the sprite but in the same style, with the same bold navy outline.
Top-left: neutral focused expression. Top-right: confident smirk with a raised chin. Bottom-left: celebrating, shouting with joy and a raised fist near the face. Bottom-right: disappointed, eyes down and a grimace.
LAYOUT RULES (very important): draw each bust NARROWER than its cell: at most 80% of the cell width, centred horizontally in its own cell, so that a wide empty transparent gutter is left naturally between neighbouring busts. The four portraits sit in four equal square cells with a clear empty transparent gutter of at least 60 px between neighbouring portraits (they must never touch each other), and every portrait keeps at least 8% empty margin on its left, right and top edges. Each figure is a bust that is cut flat only along its own cell's bottom edge; the shoulders, arms, fists, headset, ears and hair must be COMPLETELY inside the cell on the left, right and top: a raised fist or elbow (bottom-left portrait) must be drawn fully inside the cell, so make that portrait's pose more compact. Identical hairstyle, accessories, kit colours and proportions in all four; same framing and scale (same head size); no glow, halo or coloured blur; no cell borders or grid lines; no text.
If an extra image is attached, it is only a layout and pixel-style sample of a DIFFERENT character from the same game: copy its pose layout, pixel size, outline and shading, but never its face, hair, colours or identity.
```

- [x] #113 생성·저장 완료


---

# Phase 5 — 선택 화면·연출 UI (A2 세션)

## #114 · U6 캐릭터 선택 UI

- **저장 이름**: `tmp/pitch-src/ui/ui-select.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-UI` (이 스레드의 첫 스텝은 #014 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/ui/ui-frames.png` (#014) — 픽셀 크기·외곽선·팔레트·조명 기준
  - (권장) 환경 스타일 앵커: `tmp/pitch-src/env/env-pitch-bg.png`
- **검수 체크**: 4열×3행 그리드 정확, 셀당 1개, 요청한 가로세로비 준수(얇은 바·타일·구분선이 두껍게 나오면 변환 시 왜곡됨, A1 관찰), 글자·숫자 없음, 마젠타/핑크 잔여 없음, 이전 시트와 픽셀 크기·외곽선 일치
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 아직 하지 않음 — A1 변환 QA에서 확인.
- **변환**: `pnpm convert:pitch-art -- ui ui-select`
- **최종 사용**: 카드 96×128 논리 px(초상화 96×96 + 이름 판)

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Character-select screen UI parts in the same arcade scoreboard style, blank, no text.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly the same size, one item per cell, centred, items vertically centred in the cell.
Row 1: (1) character card frame, normal (tall, about 3:4, dark navy, empty inner area); (2) character card frame, hover (cyan glow); (3) character card frame, selected (gold border, corner brackets); (4) "current character" tag plate (small blank gold plate)
Row 2: (1) left arrow button, normal; (2) left arrow button, pressed; (3) right arrow button, normal; (4) right arrow button, pressed
Row 3: (1) big name plate (blank, wide, gold trim); (2) position badge (blank small hexagon plate); (3) confirm button plate (blank, mint-green, wide) normal; (4) confirm button plate pressed
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; consistent pixel size, outline and lighting in all cells; no text, letters, numbers or logos.
Use the attached image(s) as the style reference (same game, same pixel size, outline and palette).
```

- [x] #114 생성·저장 완료

## #115 · U7 선택 화면 배경

- **저장 이름**: `tmp/pitch-src/keyart/keyart-select-bg.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-UI` (이 스레드의 첫 스텝은 #014 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/keyart/keyart-loading-bg.png` (#019) — 픽셀 크기·외곽선·팔레트·조명 기준
  - (권장) 환경 스타일 앵커: `tmp/pitch-src/env/env-pitch-bg.png`
- **검수 체크**: 글자 없음, 스타일 앵커(피치 배경/로딩)와 조명·팔레트 일치, 중앙 16:9 밴드 안에 핵심 내용
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 아직 하지 않음 — A1 변환 QA에서 확인.
- **변환**: `pnpm convert:pitch-art -- keyart select-bg`
- **최종 사용**: 960×540

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: this is a FULL opaque scene, no transparency, no magenta.
A character-select stage backdrop in the same 16-bit arcade pixel style: a dark stadium tunnel-hall stage with a glowing cyan spotlight cone on a raised podium in the centre-left, a large empty dark area on the right for panels, floor reflections, violet shadows, tiny floodlight stars. No people, no text.
Canvas: 1536x1024. No text, no letters, no numbers, no logos anywhere in the image.
Use the attached image(s) as the style reference for pixel size, outline, palette and lighting (they show the SAME game), but do not copy their subject unless the description says so.
```

- [x] #115 생성·저장 완료

## #116 · F3 골 연출 이펙트

- **저장 이름**: `tmp/pitch-src/fx/fx-celebrate.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-FX` (이 스레드의 첫 스텝은 #012 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/fx/fx-impact.png` (#012) — 픽셀 크기·외곽선·팔레트·조명 기준
  - (권장) 환경 스타일 앵커: `tmp/pitch-src/env/env-pitch-bg.png`
- **검수 체크**: 4열×4행 그리드 정확, 셀당 1개, 요청한 가로세로비 준수(얇은 바·타일·구분선이 두껍게 나오면 변환 시 왜곡됨, A1 관찰), 글자·숫자 없음, 마젠타/핑크 잔여 없음, 이전 시트와 픽셀 크기·외곽선 일치
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 아직 하지 않음 — A1 변환 QA에서 확인.
- **변환**: `pnpm convert:pitch-art -- fx fx-celebrate`
- **최종 사용**: GOAL/SAVE 순간

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Celebration and reaction effects in the same 16-bit arcade pixel style, 4 frames per row.
Canvas: 1536x1024: a strict grid of 4 columns x 4 rows, every cell exactly the same size, one item per cell, centred, items sitting on the same baseline within their row where they are objects.
Row 1: (1) confetti burst frame 1 (mint, gold, white, cyan pieces only); (2) confetti burst frame 2; (3) confetti burst frame 3; (4) confetti burst frame 4
Row 2: (1) firework burst frame 1 (gold); (2) firework frame 2; (3) firework frame 3; (4) firework frame 4
Row 3: (1) radial gold light rays frame 1; (2) light rays frame 2; (3) light rays frame 3; (4) light rays frame 4
Row 4: (1) blue shield sparkle for a save frame 1; (2) save sparkle frame 2; (3) save sparkle frame 3; (4) save sparkle frame 4
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; consistent pixel size, outline and lighting in all cells; no text, letters, numbers or logos.
Use the attached image(s) as the style reference (same game, same pixel size, outline and palette).
```

- [x] #116 생성·저장 완료


---

# Phase 6 — 락커룸·스탯 화면 (A3 세션)

## #117 · E5 락커룸 게이트 (피치 좌하단)

- **저장 이름**: `tmp/pitch-src/env/env-locker-gate.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-ENV` (이 스레드의 첫 스텝은 #009 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/env/env-pitch-bg.png` (#009) — 픽셀 크기·외곽선·팔레트·조명 기준
- **검수 체크**: 3열×2행 그리드 정확, 셀당 1개, 요청한 가로세로비 준수(얇은 바·타일·구분선이 두껍게 나오면 변환 시 왜곡됨, A1 관찰), 글자·숫자 없음, 마젠타/핑크 잔여 없음, 이전 시트와 픽셀 크기·외곽선 일치
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 아직 하지 않음 — A1 변환 QA에서 확인.
- **변환**: `pnpm convert:pitch-art -- env locker-gate`
- **최종 사용**: 게이트 최종 약 128×128 논리 px

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
The players' tunnel entrance to the locker room at the corner of the pitch, seen from the same high 3/4 broadcast angle, a concrete and steel tunnel mouth cut into the stand wall with a heavy steel door, hazard-stripe trim in gold and navy, a blank label plate above the door (no letters), floodlit from above.
Canvas: 1536x1024: a strict grid of 3 columns x 2 rows, every cell exactly the same size, one item per cell, centred, items sitting on the same baseline within their row where they are objects.
Row 1: (1) tunnel gate with the steel door CLOSED; (2) tunnel gate with the steel door OPEN and warm light spilling out; (3) tunnel gate CLOSED with a soft cyan glow outline (interaction highlight)
Row 2: (1) a bobbing down-arrow marker in gold (frame 1, arrow only); (2) the same gold down-arrow marker (frame 2, 6 pixels higher); (3) the blank label plate on its own (metal, empty, no letters)
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; consistent pixel size, outline and lighting in all cells; no text, letters, numbers or logos.
Use the attached image(s) as the style reference (same game, same pixel size, outline and palette).
```

- [x] #117 생성·저장 완료

## #118 · E6 락커룸 배경

- **저장 이름**: `tmp/pitch-src/env/env-locker-bg.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-ENV` (이 스레드의 첫 스텝은 #009 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/env/env-locker-gate.png` (#117) — 픽셀 크기·외곽선·팔레트·조명 기준
- **검수 체크**: 글자 없음, 스타일 앵커(피치 배경/로딩)와 조명·팔레트 일치, 중앙 16:9 밴드 안에 핵심 내용
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 아직 하지 않음 — A1 변환 QA에서 확인.
- **변환**: `pnpm convert:pitch-art -- env locker-bg`
- **최종 사용**: 중앙 16:9 밴드 크롭 → 960×540

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: this is a FULL opaque scene, no transparency, no magenta.
The interior of a football club locker room seen from a high 3/4 angle (about 35 degrees) in the same 16-bit arcade pixel style: a wide room with polished blue-grey floor tiles, a back wall lined with navy metal lockers with mint stripes, benches along the side walls, cool fluorescent cyan-white ceiling light and violet shadows. Leave a clear walkable open floor in the middle, an EMPTY spot at the centre-left where a stat terminal sprite will be placed, and an EMPTY doorway at the bottom centre where an exit door sprite will be placed. No characters, no text, no numbers on the lockers.
Canvas: 1536x1024. No text, no letters, no numbers, no logos anywhere in the image.
Use the attached image(s) as the style reference for pixel size, outline, palette and lighting (they show the SAME game), but do not copy their subject unless the description says so.
```

- [x] #118 생성·저장 완료

## #119 · E7 락커룸 소품

- **저장 이름**: `tmp/pitch-src/env/env-locker-props.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-ENV` (이 스레드의 첫 스텝은 #009 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/env/env-locker-bg.png` (#118) — 픽셀 크기·외곽선·팔레트·조명 기준
- **검수 체크**: 4열×3행 그리드 정확, 셀당 1개, 요청한 가로세로비 준수(얇은 바·타일·구분선이 두껍게 나오면 변환 시 왜곡됨, A1 관찰), 글자·숫자 없음, 마젠타/핑크 잔여 없음, 이전 시트와 픽셀 크기·외곽선 일치
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 아직 하지 않음 — A1 변환 QA에서 확인.
- **변환**: `pnpm convert:pitch-art -- env locker-props`
- **최종 사용**: 스탯 분석기 3상태가 상호작용 대상

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Locker room props for the attached locker room, same pixel style and camera angle, one object per cell, no ground shadow, no text.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly the same size, one item per cell, centred, items sitting on the same baseline within their row where they are objects.
Row 1: (1) stat analysis terminal, a standing scouting kiosk with a dark screen (OFF); (2) the same terminal with the screen glowing cyan and a hexagon-shaped radar icon (IDLE); (3) the same terminal with the screen bright, gold-lit and a small spark (ACTIVE); (4) exit door closed (steel door with a small window)
Row 2: (1) exit door open with light spilling in; (2) navy locker unit with mint stripe, door closed; (3) navy locker unit with the door open and gear inside; (4) wooden team bench
Row 3: (1) tactics whiteboard on wheels with abstract pitch diagram (no letters); (2) water cooler; (3) kit bag with a football; (4) boot rack with white boots
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; consistent pixel size, outline and lighting in all cells; no text, letters, numbers or logos.
Use the attached image(s) as the style reference (same game, same pixel size, outline and palette).
```

- [x] #119 생성·저장 완료

## #120 · U8 스탯 육각형·설명 패널

- **저장 이름**: `tmp/pitch-src/ui/ui-stat.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-UI` (이 스레드의 첫 스텝은 #014 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/ui/ui-frames.png` (#014) — 픽셀 크기·외곽선·팔레트·조명 기준
  - (권장) 환경 스타일 앵커: `tmp/pitch-src/env/env-pitch-bg.png`
- **검수 체크**: 4열×3행 그리드 정확, 셀당 1개, 요청한 가로세로비 준수(얇은 바·타일·구분선이 두껍게 나오면 변환 시 왜곡됨, A1 관찰), 글자·숫자 없음, 마젠타/핑크 잔여 없음, 이전 시트와 픽셀 크기·외곽선 일치
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 아직 하지 않음 — A1 변환 QA에서 확인.
- **변환**: `pnpm convert:pitch-art -- ui ui-stat`
- **최종 사용**: 육각형 320×280, 패널 340×300

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Stat-screen UI parts (like a football-game player attribute hexagon) in the same arcade scoreboard style, blank, no text, no digits, no question marks.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly the same size, one item per cell, centred, items vertically centred in the cell.
Row 1: (1) hexagon radar background: six concentric hexagon rings with six spokes (cyan lines on dark navy), square cell; (2) hexagon outer frame ornament (metal hexagon border); (3) radar fill polygon overlay (semi-solid cyan hexagon shape, flat colour); (4) vertex node normal (small cyan round node)
Row 2: (1) vertex node hover (larger, bright); (2) vertex node selected (gold, glowing); (3) axis label plate (small blank dark plate with cyan trim); (4) detail panel frame (large, empty inside, top header slot)
Row 3: (1) COMING SOON ribbon (wide diagonal-cut gold ribbon, blank); (2) terminal screen frame (rounded screen bezel, dark glass inside, scan lines); (3) scan-line sweep overlay (thin cyan glowing horizontal line, transparent); (4) padlock icon (small, gold)
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; consistent pixel size, outline and lighting in all cells; no text, letters, numbers or logos.
Use the attached image(s) as the style reference (same game, same pixel size, outline and palette).
```

- [x] #120 생성·저장 완료

## #121 · U9 아이콘

- **저장 이름**: `tmp/pitch-src/ui/ui-icons.png` (1536×1024, P1)
- **스레드**: ↪ **이어서** — `T-PCH-UI` (이 스레드의 첫 스텝은 #014 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/ui/ui-buttons.png` (#015) — 픽셀 크기·외곽선·팔레트·조명 기준
  - (권장) 환경 스타일 앵커: `tmp/pitch-src/env/env-pitch-bg.png`
- **검수 체크**: 6열×4행 그리드 정확, 셀당 1개, 요청한 가로세로비 준수(얇은 바·타일·구분선이 두껍게 나오면 변환 시 왜곡됨, A1 관찰), 글자·숫자 없음, 마젠타/핑크 잔여 없음, 이전 시트와 픽셀 크기·외곽선 일치
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 아직 하지 않음 — A1 변환 QA에서 확인.
- **변환**: `pnpm convert:pitch-art -- ui ui-icons`
- **최종 사용**: 아이콘 24×24 논리 px

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
24 small icons for an arcade football game UI, each a simple bold symbol with a navy outline in cyan, gold or white, one per cell, no text.
Canvas: 1536x1024: a strict grid of 6 columns x 4 rows, every cell exactly the same size, one item per cell, centred, items vertically centred in the cell.
Row 1: (1) speaker on; (2) speaker muted; (3) music note; (4) music note muted; (5) close X; (6) back arrow
Row 2: (1) gear; (2) scoreboard; (3) locker; (4) football; (5) goal; (6) goalkeeper glove
Row 3: (1) star; (2) trophy; (3) lightning bolt (sprint); (4) shoe (kick); (5) shield with sprout; (6) hexagon radar
Row 4: (1) question badge; (2) lock; (3) keyboard; (4) refresh arrows; (5) pause bars; (6) play triangle
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; consistent pixel size, outline and lighting in all cells; no text, letters, numbers or logos.
Use the attached image(s) as the style reference (same game, same pixel size, outline and palette).
```

- [x] #121 생성·저장 완료


---

# Phase 7 — 폴리시 P2 (P7 세션 전후)

## #122 · E4 필드 소품 (P2)

- **저장 이름**: `tmp/pitch-src/env/env-props.png` (1536×1024, P2)
- **스레드**: ↪ **이어서** — `T-PCH-ENV` (이 스레드의 첫 스텝은 #009 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/env/env-ball.png` (#011) — 픽셀 크기·외곽선·팔레트·조명 기준
- **검수 체크**: 4열×3행 그리드 정확, 셀당 1개, 요청한 가로세로비 준수(얇은 바·타일·구분선이 두껍게 나오면 변환 시 왜곡됨, A1 관찰), 글자·숫자 없음, 마젠타/핑크 잔여 없음, 이전 시트와 픽셀 크기·외곽선 일치
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 아직 하지 않음 — A1 변환 QA에서 확인.
- **변환**: `pnpm convert:pitch-art -- env props`
- **최종 사용**: 광고판은 피치 배경 위 오버레이로도 사용

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Small football pitch props in the same arcade pixel style and camera angle, one prop per cell, no shadow on the ground.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly the same size, one item per cell, centred, items sitting on the same baseline within their row where they are objects.
Row 1: (1) orange training cone; (2) yellow training cone; (3) corner flag on a pole (still); (4) corner flag on a pole (waving, different frame)
Row 2: (1) advertising board A (abstract cyan and white block pattern, no letters); (2) advertising board B (abstract gold and navy stripes, no letters); (3) advertising board C (abstract mint and coral diamonds, no letters); (4) water bottle
Row 3: (1) pile of training bibs; (2) ball bag full of footballs; (3) small training hurdle; (4) agility ladder segment
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; consistent pixel size, outline and lighting in all cells; no text, letters, numbers or logos.
Use the attached image(s) as the style reference (same game, same pixel size, outline and palette).
```

- [x] #122 생성·저장 완료

## #123 · E9 관중 애니메이션 (P2)

- **저장 이름**: `tmp/pitch-src/env/env-crowd.png` (1536×1024, P2)
- **스레드**: ↪ **이어서** — `T-PCH-ENV` (이 스레드의 첫 스텝은 #009 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/env/env-pitch-bg.png` (#009) — 픽셀 크기·외곽선·팔레트·조명 기준
- **검수 체크**: 4열×3행 그리드 정확, 셀당 1개, 요청한 가로세로비 준수(얇은 바·타일·구분선이 두껍게 나오면 변환 시 왜곡됨, A1 관찰), 글자·숫자 없음, 마젠타/핑크 잔여 없음, 이전 시트와 픽셀 크기·외곽선 일치
- **상태(검토 결과)**: 파일 존재 확인(2026-09-25). 내용 검토는 아직 하지 않음 — A1 변환 QA에서 확인.
- **변환**: `pnpm convert:pitch-art -- env crowd`
- **최종 사용**: 골/선방 순간 관중석 오버레이 교체용

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the transparent background: NO outer glow, halo, aura, light bloom, cyan or orange rim fringe, ambient light blobs or background tint outside the outline (the rim light is painted inside the figure only). Never render readable text, letters, numbers or logos, and add no watermark or signature. Camera: high 3/4 broadcast angle (about 35 degrees), the way a football video game shows the pitch from behind the attacking player. The football club 잔디동 uses mint green (#2ee8b6) and white.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Animated stadium crowd bands matching the crowd in the attached pitch background: each cell is one frame of a wide horizontal band of tiny blocky pixel spectators (no faces, no text, seamless left and right edges, about 3:1 wide), lit from the upper left.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly the same size, one item per cell, centred, items sitting on the same baseline within their row where they are objects.
Row 1: (1) idle crowd swaying frame 1; (2) idle crowd swaying frame 2; (3) idle crowd swaying frame 3; (4) idle crowd swaying frame 4
Row 2: (1) cheering crowd with arms up frame 1; (2) cheering crowd frame 2; (3) cheering crowd frame 3; (4) cheering crowd frame 4
Row 3: (1) groaning crowd with hands on heads frame 1; (2) groaning crowd frame 2; (3) groaning crowd frame 3; (4) groaning crowd frame 4
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; consistent pixel size, outline and lighting in all cells; no text, letters, numbers or logos.
Use the attached image(s) as the style reference (same game, same pixel size, outline and palette).
```

- [x] #123 생성·저장 완료


---

## 부록 A. A1 변환 QA 결과 — 재생성(수정 요청) 대상 7시트 (✔ 2026-09-25 전부 재생성·재변환 완료)

`pnpm convert:pitch-art -- --all` 결과, 아래 7시트는 **프레임끼리 붙어 있어서**(연결요소 gap 2px 에서도 한 덩어리로 인식) 변환 후 atlas 에 빈 셀이 생기거나, 한 프레임이 너무 커서 그 행 전체가 59~70%로 축소됐다. 나머지 시트는 문제 없음. 각 시트마다 **독립형 수정 프롬프트**가 있다(기존 이미지를 레퍼런스로 붙여 고쳐 달라고 요청). 원본 프롬프트는 해당 #번호 스텝에 그대로 있다.

> 이 부록은 `docs/pitch/tools/regen-appendix.md` 를 생성기가 09 맨 아래에 붙인 것이다. 09 를 직접 고치지 말고 그 파일을 고친 뒤 `node docs/pitch/tools/build-image-runbook.mjs` 를 실행한다.

### 진행 방법 (7시트 공통)

1. 프롬프트와 함께 **① 고칠 시트(기존 이미지) ② 같은 캐릭터의 승인본 stand** 를 첨부한다(같은 캐릭터 스레드가 남아 있으면 이어서).
2. 결과가 마음에 들면 기존 파일을 `tmp/pitch-src/_old/` 로 옮겨 백업하고 새 이미지를 **같은 파일명**으로 저장.
3. `--only` 변환으로 해당 시트만 atlas 에 끼워 넣는다(다른 행은 그대로).
4. QA 리포트에서 그 시트의 `empty`·`grid`·`scale` 경고가 사라졌는지 확인하고, 이 문서 진행 표의 `🔁` 를 `[x]` 로 바꾼다.
5. 수정 요청으로 잘 안 고쳐지면 해당 스텝(#번호)의 원본 프롬프트 맨 끝에 다음 문장을 덧붙여 **처음부터 재생성**한다: *SPACING (critical): draw every figure noticeably smaller than you think is needed. Leave a wide empty transparent gutter between every two neighbouring cells, at least 40 px both horizontally and vertically, so that no frame ever touches, overlaps or shares a pixel with another one. The widest pose in a row must still be at most 80% of the cell width. Long hair, ponytails, buns, horns and ears count as part of the figure and must stay inside the cell too.*

행/프레임 번호는 위→아래(행 1~), 왼→오(프레임 1~) 기준. skill 시트 행 순서 = 스텝오버 / 룰렛 / 레인보우 / 엘라스티코, shoot 시트 행 순서 = 정면 / 측면 / 후면.

### #062 · 하치 — ⑤ skill-side (재생성)

- **저장 이름**: `tmp/pitch-src/characters/char-hachi97-skill-side.png` (1536×1024, 기존 파일은 `tmp/pitch-src/_old/` 로 백업 후 같은 이름으로 저장)
- **QA 결과**: 행3(레인보우) 프레임 1이 이웃과 붙어 사라짐 · 행4(엘라스티코)에 셀보다 큰 프레임(행 70% 축소)
- **레퍼런스 첨부**:
  - **필수** 고칠 시트 자체: `tmp/pitch-src/characters/char-hachi97-skill-side.png` (#062)
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-hachi97-stand.png` (#058)
- **변환**: `pnpm convert:pitch-art -- characters hachi97 --only skill-side`

**프롬프트**

```text
Keep everything from the attached sprite sheet exactly as it is: the same character design, palette, outline, pixel size, pose in every cell, grid layout (a strict grid of 4 columns x 4 rows), row order and frame order, on the same 1536x1024 canvas with a transparent background (or a flat #FF00FF background if transparency is impossible; never magenta on the subject).
The sheet shows the same character performing four football skill moves in right-side view (profile, facing right). Row order: Row 1 = STEPOVER (one leg circles over the ball spot while the other stays planted); Row 2 = ROULETTE (Marseille turn, the whole body spins around the planted foot); Row 3 = RAINBOW FLICK (a small hop, the heels flick the ball up and over the head); Row 4 = ELASTICO (flip-flap, a wide sideways fake). Each move keeps its own silhouette and its four frames in order:
- Row 1 = STEPOVER: (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
- Row 2 = ROULETTE: (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
- Row 3 = RAINBOW FLICK: (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
- Row 4 = ELASTICO: (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Keep the character-defining features in every frame: the small white antler-like horn ornaments and the short black bob with the white streak.
Only fix these problems, and redraw ONLY the frames named here, leaving every other frame unchanged:
Row 3 (RAINBOW FLICK), frame 1: this figure is glued to the frame next to it; redraw it (both feet close together squeezing the ball spot, knees only slightly bent, head up) with clear empty space on all sides, the horns fully inside the cell.
Row 4 (ELASTICO): one frame is much wider than the others and reaches the cell edge; redraw the widest frame smaller and more compact (still a wide fake step, but inside 80% of the cell width).
Spacing rule (very important): in the whole sheet, every figure must be separated from the figures next to it by clear empty transparent space, at least 40 px between any two neighbouring frames horizontally and vertically, so that no frame touches or overlaps another one, not even with a boot, a fist, a hair tip or a motion pose. Each figure stays fully inside its own cell with at least 12% empty space above the head and below the feet and at least 8% at both sides. If a pose is too wide or too tall, make the figure slightly smaller in that frame rather than letting it reach the cell edge; every frame must still be the same figure at the same scale as the neighbouring frames (no bigger than the standing figure of the attached stand image). The widest pose in a row must be at most 80% of the cell width.
Do NOT draw a football, text, numbers, logos, cell borders or grid lines, and add no glow, halo, aura or coloured blur around the figures.
```

- [x] #062 수정본 저장·재변환 완료

### #078 · 쥬멩이 — ⑤ skill-side (재생성)

- **저장 이름**: `tmp/pitch-src/characters/char-ju010228-skill-side.png` (1536×1024, 기존 파일은 `tmp/pitch-src/_old/` 로 백업 후 같은 이름으로 저장)
- **QA 결과**: 행2(룰렛) 프레임 1·2가 서로 붙어 둘 다 사라짐 · 행3(레인보우)에 셀보다 큰 프레임(행 61% 축소)
- **레퍼런스 첨부**:
  - **필수** 고칠 시트 자체: `tmp/pitch-src/characters/char-ju010228-skill-side.png` (#078)
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-ju010228-stand.png` (#074)
- **변환**: `pnpm convert:pitch-art -- characters ju010228 --only skill-side`

**프롬프트**

```text
Keep everything from the attached sprite sheet exactly as it is: the same character design, palette, outline, pixel size, pose in every cell, grid layout (a strict grid of 4 columns x 4 rows), row order and frame order, on the same 1536x1024 canvas with a transparent background (or a flat #FF00FF background if transparency is impossible; never magenta on the subject).
The sheet shows the same character performing four football skill moves in right-side view (profile, facing right). Row order: Row 1 = STEPOVER (one leg circles over the ball spot while the other stays planted); Row 2 = ROULETTE (Marseille turn, the whole body spins around the planted foot); Row 3 = RAINBOW FLICK (a small hop, the heels flick the ball up and over the head); Row 4 = ELASTICO (flip-flap, a wide sideways fake). Each move keeps its own silhouette and its four frames in order:
- Row 1 = STEPOVER: (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
- Row 2 = ROULETTE: (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
- Row 3 = RAINBOW FLICK: (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
- Row 4 = ELASTICO: (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Keep the character-defining features in every frame: the long green hair tied up high with the white streak and the white ribbon.
Only fix these problems, and redraw ONLY the frames named here, leaving every other frame unchanged:
Row 2 (ROULETTE), frames 1 and 2: these two figures overlap each other; redraw frame 1 (right boot sole on the ball spot, arms out) and frame 2 (body pivoting on the left foot, chest turning away) so that they are clearly separated, each centred in its own cell.
Row 3 (RAINBOW FLICK): one frame (the airborne pose) is much taller or wider than the others; keep the airborne frame at only about 10% of the cell height above the ground and keep the whole figure, including the hair, inside the cell with margin.
Spacing rule (very important): in the whole sheet, every figure must be separated from the figures next to it by clear empty transparent space, at least 40 px between any two neighbouring frames horizontally and vertically, so that no frame touches or overlaps another one, not even with a boot, a fist, a hair tip or a motion pose. Each figure stays fully inside its own cell with at least 12% empty space above the head and below the feet and at least 8% at both sides. If a pose is too wide or too tall, make the figure slightly smaller in that frame rather than letting it reach the cell edge; every frame must still be the same figure at the same scale as the neighbouring frames (no bigger than the standing figure of the attached stand image). The widest pose in a row must be at most 80% of the cell width.
Do NOT draw a football, text, numbers, logos, cell borders or grid lines, and add no glow, halo, aura or coloured blur around the figures.
```

- [x] #078 수정본 저장·재변환 완료

### #085 · 해파린 — ④ shoot (재생성)

- **저장 이름**: `tmp/pitch-src/characters/char-haepalin-shoot.png` (1536×1024, 기존 파일은 `tmp/pitch-src/_old/` 로 백업 후 같은 이름으로 저장)
- **QA 결과**: 행1(정면) 프레임 2가 셀 밖으로 나감(행 61% 축소) · 행2(측면) 프레임 2가 이웃과 붙어 사라짐
- **레퍼런스 첨부**:
  - **필수** 고칠 시트 자체: `tmp/pitch-src/characters/char-haepalin-shoot.png` (#085)
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-haepalin-stand.png` (#082)
- **변환**: `pnpm convert:pitch-art -- characters haepalin --only shoot`

**프롬프트**

```text
Keep everything from the attached sprite sheet exactly as it is: the same character design, palette, outline, pixel size, pose in every cell, grid layout (a strict grid of 4 columns x 3 rows), row order and frame order, on the same 1536x1024 canvas with a transparent background (or a flat #FF00FF background if transparency is impossible; never magenta on the subject).
The sheet shows the same character's SHOOTING animation with four frames per row (1 backswing, 2 planted standing foot, 3 impact with the kicking leg fully extended, 4 follow-through). Row order: Row 1 = kicking toward the camera (front view); Row 2 = kicking toward the right (side view); Row 3 = kicking away from the camera (back view). The upper body tilts at most 25 degrees and the head stays above the shoulders.
Keep the character-defining features in every frame: the short lavender-periwinkle bob with the ahoge and the jellyfish hair ornament.
Only fix these problems, and redraw ONLY the frames named here, leaving every other frame unchanged:
Row 1 (front view kick), frame 2: the figure extends beyond its cell; redraw it smaller, with the kicking leg and both arms fully inside the cell.
Row 2 (side view kick), frame 2: this figure is glued to a neighbouring frame; redraw it (standing leg planted, kicking leg cocked back) with clear empty space on all sides.
Spacing rule (very important): in the whole sheet, every figure must be separated from the figures next to it by clear empty transparent space, at least 40 px between any two neighbouring frames horizontally and vertically, so that no frame touches or overlaps another one, not even with a boot, a fist, a hair tip or a motion pose. Each figure stays fully inside its own cell with at least 12% empty space above the head and below the feet and at least 8% at both sides. If a pose is too wide or too tall, make the figure slightly smaller in that frame rather than letting it reach the cell edge; every frame must still be the same figure at the same scale as the neighbouring frames (no bigger than the standing figure of the attached stand image). The widest pose in a row must be at most 80% of the cell width.
Do NOT draw a football, text, numbers, logos, cell borders or grid lines, and add no glow, halo, aura or coloured blur around the figures.
```

- [x] #085 수정본 저장·재변환 완료

### #093 · 빙밍 — ④ shoot (재생성)

- **저장 이름**: `tmp/pitch-src/characters/char-tleod1818-shoot.png` (1536×1024, 기존 파일은 `tmp/pitch-src/_old/` 로 백업 후 같은 이름으로 저장)
- **QA 결과**: 행1(정면) 프레임 2가 이웃과 붙어 사라짐 · 행2(측면)에 셀보다 큰 프레임(행 61% 축소)
- **레퍼런스 첨부**:
  - **필수** 고칠 시트 자체: `tmp/pitch-src/characters/char-tleod1818-shoot.png` (#093)
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-tleod1818-stand.png` (#090)
- **변환**: `pnpm convert:pitch-art -- characters tleod1818 --only shoot`

**프롬프트**

```text
Keep everything from the attached sprite sheet exactly as it is: the same character design, palette, outline, pixel size, pose in every cell, grid layout (a strict grid of 4 columns x 3 rows), row order and frame order, on the same 1536x1024 canvas with a transparent background (or a flat #FF00FF background if transparency is impossible; never magenta on the subject).
The sheet shows the same character's SHOOTING animation with four frames per row (1 backswing, 2 planted standing foot, 3 impact with the kicking leg fully extended, 4 follow-through). Row order: Row 1 = kicking toward the camera (front view); Row 2 = kicking toward the right (side view); Row 3 = kicking away from the camera (back view). The upper body tilts at most 25 degrees and the head stays above the shoulders.
Keep the character-defining features in every frame: the black hair bun with the green leaf hairpin and the small white flower.
Only fix these problems, and redraw ONLY the frames named here, leaving every other frame unchanged:
Row 1 (front view kick), frame 2: this figure is glued to a neighbouring frame; redraw it (planted standing foot, arms out for balance) centred in its own cell with clear empty space on all sides.
Row 2 (side view kick): one frame is much wider than the others; redraw the widest frame more compactly so that the kicking leg and the hair bun stay inside 80% of the cell width.
Spacing rule (very important): in the whole sheet, every figure must be separated from the figures next to it by clear empty transparent space, at least 40 px between any two neighbouring frames horizontally and vertically, so that no frame touches or overlaps another one, not even with a boot, a fist, a hair tip or a motion pose. Each figure stays fully inside its own cell with at least 12% empty space above the head and below the feet and at least 8% at both sides. If a pose is too wide or too tall, make the figure slightly smaller in that frame rather than letting it reach the cell edge; every frame must still be the same figure at the same scale as the neighbouring frames (no bigger than the standing figure of the attached stand image). The widest pose in a row must be at most 80% of the cell width.
Do NOT draw a football, text, numbers, logos, cell borders or grid lines, and add no glow, halo, aura or coloured blur around the figures.
```

- [x] #093 수정본 저장·재변환 완료

### #095 · 빙밍 — ⑥ skill-up (재생성)

- **저장 이름**: `tmp/pitch-src/characters/char-tleod1818-skill-up.png` (1536×1024, 기존 파일은 `tmp/pitch-src/_old/` 로 백업 후 같은 이름으로 저장)
- **QA 결과**: 행3(레인보우) 프레임 1·2가 붙어 둘 다 사라짐 · 행4(엘라스티코)에 셀보다 큰 프레임(행 67% 축소)
- **레퍼런스 첨부**:
  - **필수** 고칠 시트 자체: `tmp/pitch-src/characters/char-tleod1818-skill-up.png` (#095)
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-tleod1818-stand.png` (#090)
- **변환**: `pnpm convert:pitch-art -- characters tleod1818 --only skill-up`

**프롬프트**

```text
Keep everything from the attached sprite sheet exactly as it is: the same character design, palette, outline, pixel size, pose in every cell, grid layout (a strict grid of 4 columns x 4 rows), row order and frame order, on the same 1536x1024 canvas with a transparent background (or a flat #FF00FF background if transparency is impossible; never magenta on the subject).
The sheet shows the same character performing four football skill moves in back view (facing away from the camera toward the goal). Row order: Row 1 = STEPOVER (one leg circles over the ball spot while the other stays planted); Row 2 = ROULETTE (Marseille turn, the whole body spins around the planted foot); Row 3 = RAINBOW FLICK (a small hop, the heels flick the ball up and over the head); Row 4 = ELASTICO (flip-flap, a wide sideways fake). Each move keeps its own silhouette and its four frames in order:
- Row 1 = STEPOVER: (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
- Row 2 = ROULETTE: (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
- Row 3 = RAINBOW FLICK: (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
- Row 4 = ELASTICO: (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Keep the character-defining features in every frame: the black hair bun with the green leaf hairpin and the small white flower.
Only fix these problems, and redraw ONLY the frames named here, leaving every other frame unchanged:
Row 3 (RAINBOW FLICK, back view), frames 1 and 2: these two figures are glued to each other and to the frames next to them; redraw both (frame 1: both feet close together, knees slightly bent; frame 2: both heels kicking up and back, just leaving the ground) with clear empty space around each.
Row 4 (ELASTICO, back view): one frame is much wider than the others; redraw the widest frame more compactly, inside 80% of the cell width.
Spacing rule (very important): in the whole sheet, every figure must be separated from the figures next to it by clear empty transparent space, at least 40 px between any two neighbouring frames horizontally and vertically, so that no frame touches or overlaps another one, not even with a boot, a fist, a hair tip or a motion pose. Each figure stays fully inside its own cell with at least 12% empty space above the head and below the feet and at least 8% at both sides. If a pose is too wide or too tall, make the figure slightly smaller in that frame rather than letting it reach the cell edge; every frame must still be the same figure at the same scale as the neighbouring frames (no bigger than the standing figure of the attached stand image). The widest pose in a row must be at most 80% of the cell width.
Do NOT draw a football, text, numbers, logos, cell borders or grid lines, and add no glow, halo, aura or coloured blur around the figures.
```

- [-] #095 수정본 저장·재변환 완료

### #110 · 리냐 — ⑤ skill-side (재생성)

- **저장 이름**: `tmp/pitch-src/characters/char-lina0108-skill-side.png` (1536×1024, 기존 파일은 `tmp/pitch-src/_old/` 로 백업 후 같은 이름으로 저장)
- **QA 결과**: 행3(레인보우) 프레임 2가 붙어 사라짐 · 행2(룰렛) 프레임 2가 셀 밖으로 나감(행 67% 축소)
- **레퍼런스 첨부**:
  - **필수** 고칠 시트 자체: `tmp/pitch-src/characters/char-lina0108-skill-side.png` (#110)
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-lina0108-stand.png` (#106)
- **변환**: `pnpm convert:pitch-art -- characters lina0108 --only skill-side`

**프롬프트**

```text
Keep everything from the attached sprite sheet exactly as it is: the same character design, palette, outline, pixel size, pose in every cell, grid layout (a strict grid of 4 columns x 4 rows), row order and frame order, on the same 1536x1024 canvas with a transparent background (or a flat #FF00FF background if transparency is impossible; never magenta on the subject).
The sheet shows the same character performing four football skill moves in right-side view (profile, facing right). Row order: Row 1 = STEPOVER (one leg circles over the ball spot while the other stays planted); Row 2 = ROULETTE (Marseille turn, the whole body spins around the planted foot); Row 3 = RAINBOW FLICK (a small hop, the heels flick the ball up and over the head); Row 4 = ELASTICO (flip-flap, a wide sideways fake). Each move keeps its own silhouette and its four frames in order:
- Row 1 = STEPOVER: (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
- Row 2 = ROULETTE: (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
- Row 3 = RAINBOW FLICK: (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
- Row 4 = ELASTICO: (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Keep the character-defining features in every frame: the long messy red-pink (coral) hair with the white streak and the small pink-and-white horns.
Only fix these problems, and redraw ONLY the frames named here, leaving every other frame unchanged:
Row 3 (RAINBOW FLICK), frame 2: this figure is glued to a neighbouring frame; redraw it (both heels kicking up and back, just leaving the ground) with clear empty space around it. The long voluminous hair must stay inside the cell.
Row 2 (ROULETTE), frame 2: the figure reaches beyond its cell; redraw it smaller and more compact, the hair and arms fully inside the cell.
Spacing rule (very important): in the whole sheet, every figure must be separated from the figures next to it by clear empty transparent space, at least 40 px between any two neighbouring frames horizontally and vertically, so that no frame touches or overlaps another one, not even with a boot, a fist, a hair tip or a motion pose. Each figure stays fully inside its own cell with at least 12% empty space above the head and below the feet and at least 8% at both sides. If a pose is too wide or too tall, make the figure slightly smaller in that frame rather than letting it reach the cell edge; every frame must still be the same figure at the same scale as the neighbouring frames (no bigger than the standing figure of the attached stand image). The widest pose in a row must be at most 80% of the cell width.
Do NOT draw a football, text, numbers, logos, cell borders or grid lines, and add no glow, halo, aura or coloured blur around the figures.
```

- [x] #110 수정본 저장·재변환 완료

### #111 · 리냐 — ⑥ skill-up (재생성)

- **저장 이름**: `tmp/pitch-src/characters/char-lina0108-skill-up.png` (1536×1024, 기존 파일은 `tmp/pitch-src/_old/` 로 백업 후 같은 이름으로 저장)
- **QA 결과**: 행1(스텝오버) 프레임 2 · 행3(레인보우) 프레임 1이 붙어 사라짐 · 행2(룰렛) 59%·행4(엘라스티코) 63% 축소
- **레퍼런스 첨부**:
  - **필수** 고칠 시트 자체: `tmp/pitch-src/characters/char-lina0108-skill-up.png` (#111)
  - **필수** 이 캐릭터의 승인본 stand: `tmp/pitch-src/characters/char-lina0108-stand.png` (#106)
- **변환**: `pnpm convert:pitch-art -- characters lina0108 --only skill-up`

**프롬프트**

```text
Keep everything from the attached sprite sheet exactly as it is: the same character design, palette, outline, pixel size, pose in every cell, grid layout (a strict grid of 4 columns x 4 rows), row order and frame order, on the same 1536x1024 canvas with a transparent background (or a flat #FF00FF background if transparency is impossible; never magenta on the subject).
The sheet shows the same character performing four football skill moves in back view (facing away from the camera toward the goal). Row order: Row 1 = STEPOVER (one leg circles over the ball spot while the other stays planted); Row 2 = ROULETTE (Marseille turn, the whole body spins around the planted foot); Row 3 = RAINBOW FLICK (a small hop, the heels flick the ball up and over the head); Row 4 = ELASTICO (flip-flap, a wide sideways fake). Each move keeps its own silhouette and its four frames in order:
- Row 1 = STEPOVER: (1) standing tall on the left leg, the right foot lifted just beside the ball spot; (2) the right leg swung in a wide arc OVER and across to the left of the ball spot, the right knee high and the boot sole facing down, the torso leaning to the right as a feint; (3) the right foot planted on the far side, both arms swung to the left, the shoulders turned; (4) the body pushes off to the right in a low sprint lean.
- Row 2 = ROULETTE: (1) the right boot sole pressed on the ball spot, the weight over the left leg, the arms out; (2) the body pivoting on the left foot with the chest turning away, the right leg dragging back; (3) the body half turned away from the camera, the arms wide, the head turned back over the shoulder; (4) the body turned forward again and accelerating into a sprint.
- Row 3 = RAINBOW FLICK: (1) both feet close together squeezing the ball spot, the knees only slightly bent, the head up (not a deep crouch); (2) both heels kicking up and back, the body just leaving the ground; (3) airborne at the peak, only about 10% of the cell height above the ground, both legs tucked behind with the heels together, the arms out, the whole figure still inside the cell with margin above the head; (4) landing with bent knees, then stepping into a stride.
- Row 4 = ELASTICO: (1) the outside edge of the right boot pushing outward to the right, the torso feinting to the right, the legs wide; (2) the foot snapped back inward across the body to the left, the shoulders already swinging left; (3) the left leg stepping wide across, the body leaning far to the left; (4) a low sprint away.
Keep the character-defining features in every frame: the long messy red-pink (coral) hair with the white streak and the small pink-and-white horns.
Only fix these problems, and redraw ONLY the frames named here, leaving every other frame unchanged:
Row 1 (STEPOVER, back view), frame 2: this figure is glued to a neighbouring frame; redraw it (right leg swung in a wide arc over the ball spot) with clear empty space around it.
Row 3 (RAINBOW FLICK, back view), frame 1: this figure is glued to a neighbouring frame; redraw it (both feet close together, knees slightly bent) with clear empty space around it.
Rows 2 (ROULETTE) and 4 (ELASTICO): at least one frame per row is much larger than the rest and touches the cell edge; redraw the largest frame of each of these two rows smaller and more compact so that the hair and arms stay inside 80% of the cell width. Keep the hair volume tied up so it does not spread across neighbouring cells.
Spacing rule (very important): in the whole sheet, every figure must be separated from the figures next to it by clear empty transparent space, at least 40 px between any two neighbouring frames horizontally and vertically, so that no frame touches or overlaps another one, not even with a boot, a fist, a hair tip or a motion pose. Each figure stays fully inside its own cell with at least 12% empty space above the head and below the feet and at least 8% at both sides. If a pose is too wide or too tall, make the figure slightly smaller in that frame rather than letting it reach the cell edge; every frame must still be the same figure at the same scale as the neighbouring frames (no bigger than the standing figure of the attached stand image). The widest pose in a row must be at most 80% of the cell width.
Do NOT draw a football, text, numbers, logos, cell borders or grid lines, and add no glow, halo, aura or coloured blur around the figures.
```

- [x] #111 수정본 저장·재변환 완료
