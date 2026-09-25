# 14. 락커룸 인벤토리 이미지 생성 실행 순서표 (ChatGPT gpt-image)

락커룸 캐비닛 인벤토리(캐릭터 꾸미기 + 펫) 기능에 필요한 이미지 **30장**의 개별 지시서다. 각 스텝에 **저장 이름 / 스레드 / 첨부할 레퍼런스 / 검수 체크 / 변환 명령 / 프롬프트(독립형)** 가 있다. 설계는 [13-locker-inventory-spec.md](13-locker-inventory-spec.md). 사용법·검수 규칙은 [09](09-image-generation-runbook.md)와 같다(같은 게임이므로 스타일 문단도 동일).

> **이 문서는 스크립트로 생성된다.** `node docs/pitch/tools/build-inventory-runbook.mjs` 로 재생성한다. 목록·프롬프트를 고치려면 생성기를 수정한다(문서를 직접 고치면 덮어써진다). 스텝 번호는 09 와 겹치지 않도록 `#I01`~`#I30` 를 쓴다.
>
> **월드 이미지는 레퍼런스로 첨부하지 않는다**(프로젝트 원칙). 이 이미지들은 16비트 아케이드 스포츠 스타일의 피치 게임용이다.

## 사용법

1. 스텝의 **스레드** 지시를 따른다. `🆕 새 스레드`면 새 대화를 열고, `↪ 이어서`면 그 스레드를 만든 **같은 대화**에 계속 요청한다.
2. **레퍼런스 첨부**의 필수 파일을 올린 뒤 **프롬프트 전체**를 붙여넣는다. 프롬프트는 스타일 문단을 전부 풀어 담고 있어 그대로 복사하면 된다.
3. 결과를 **검수 체크**로 확인하고, 마음에 안 들면 같은 스레드에서 `Keep everything, but fix: …` 로 수정을 요청한다(전체 재생성이 더 안전할 때가 많다).
4. 통과하면 **저장 이름**으로 저장한다(폴더가 없으면 만든다). 다음 스텝의 레퍼런스가 이 파일이다.
5. 스텝 끝의 `- [ ]` 를 체크한다.
6. 투명 배경이 안 나오면 `#FF00FF` 단색 배경 결과를 그대로 저장해도 된다(변환기가 키잉). **그리드 열×행과 셀 순서**만 지켜지면 크기 드리프트는 변환기가 처리한다.
7. 글자·숫자가 이미지에 생기면 **재생성**한다(텍스트는 캔버스가 그린다).
8. **첨부는 이미지로**: 펫 프롬프트에는 펫의 생김새를 글로 묘사하지 않는다. 전용 펫은 **사용자 제공 레퍼런스를 첨부**하고 "그대로 따라 그려라"만 지시한다(공용 펫 6종만 짧은 묘사가 있다).
9. **사용자 준비물**: 전용 펫 12장의 레퍼런스를 `tmp/pitch-src/refs/pet-<펫id>-ref.png` 로 미리 복사해 둔다(펫 id 는 아래 진행 표의 저장 이름 참고). 변환은 각 스텝의 **변환** 줄 명령(`pnpm convert:pitch-art -- equipment|pets|ui|fx <id>`)으로 한다. 이미지가 아직 없는 스텝은 코드가 기본 도형/무표시로 동작하므로 나중에 저장·변환만 하면 된다.

## 셀 규격 요약

| 종류 | 캔버스 | 그리드 | 셀 | 방향 |
| --- | --- | --- | --- | --- |
| 착용 아이템 시트 | 1536×1024 | 3열×4행 | 512×256 | 열 = FRONT(down) / SIDE(오른쪽) / BACK(up), 행 = 아이템 4종 |
| 펫 시트 | 1536×1024 | 4열×3행 | 384×341 | 열 = idle A·B / move A·B, 행 = FRONT / SIDE(오른쪽) / BACK |
| UI | 스텝별 | 스텝별 | 스텝별 | 각 스텝 프롬프트의 Canvas 문장 |

## 스레드 목록

| 스레드 | 설명 | 스텝 |
| --- | --- | --- |
| `T-PCH-EQP` | 착용 아이템 시트 4장 (모자 A·B, 얼굴, 등) | #I01, #I02, #I03, #I04 |
| `T-PCH-PET-COM` | 공용 펫 6장 (첫 장 = 스타일 앵커) | #I05, #I06, #I07, #I08, #I09, #I10 |
| `T-PCH-PET-EXC-1` | 전용 펫 4장 (팬치·해피·구르미·용볼이) | #I11, #I12, #I13, #I14 |
| `T-PCH-PET-EXC-2` | 전용 펫 4장 (뱀술이·돌멩이·시바꺼·펭귄) | #I15, #I16, #I17, #I18 |
| `T-PCH-PET-EXC-3` | 전용 펫 4장 (봉밥이·단결·뽀글스·웅남이) | #I19, #I20, #I21, #I22 |
| `T-PCH-UI-INV` | 인벤토리 UI 8장 (프레임이 스타일 앵커) | #I23, #I24, #I25, #I26, #I27, #I28, #I29, #I30 |

> 스레드가 길어져 품질이 떨어지면 새 스레드를 열고 **직전에 승인한 결과 1장**을 톤 샘플로 첨부한다. 전용 펫은 스레드를 4장 단위로 끊어 다른 펫의 디자인이 섞이는 것을 막는다.

## 진행 표

| # | 저장 이름 | 스레드 | ✓ |
| --- | --- | --- | --- |
| #I01 | `equipment/acc-hat-a.png` | `T-PCH-EQP` 🆕 | [ ] |
| #I02 | `equipment/acc-hat-b.png` | `T-PCH-EQP` | [ ] |
| #I03 | `equipment/acc-face-a.png` | `T-PCH-EQP` | [ ] |
| #I04 | `equipment/acc-back-a.png` | `T-PCH-EQP` | [ ] |
| #I05 | `pets/pet-cheezenyang.png` | `T-PCH-PET-COM` 🆕 | [ ] |
| #I06 | `pets/pet-kkwaegi.png` | `T-PCH-PET-COM` | [ ] |
| #I07 | `pets/pet-mallangi.png` | `T-PCH-PET-COM` | [ ] |
| #I08 | `pets/pet-gongdori.png` | `T-PCH-PET-COM` | [ ] |
| #I09 | `pets/pet-ppiyagi.png` | `T-PCH-PET-COM` | [ ] |
| #I10 | `pets/pet-ttuttu.png` | `T-PCH-PET-COM` | [ ] |
| #I11 | `pets/pet-panchi.png` | `T-PCH-PET-EXC-1` 🆕 | [ ] |
| #I12 | `pets/pet-haepi.png` | `T-PCH-PET-EXC-1` | [ ] |
| #I13 | `pets/pet-gureumi.png` | `T-PCH-PET-EXC-1` | [ ] |
| #I14 | `pets/pet-yongboli.png` | `T-PCH-PET-EXC-1` | [ ] |
| #I15 | `pets/pet-baemsuri.png` | `T-PCH-PET-EXC-2` 🆕 | [ ] |
| #I16 | `pets/pet-dolmengi.png` | `T-PCH-PET-EXC-2` | [ ] |
| #I17 | `pets/pet-sibakkeo.png` | `T-PCH-PET-EXC-2` | [ ] |
| #I18 | `pets/pet-penguin.png` | `T-PCH-PET-EXC-2` | [ ] |
| #I19 | `pets/pet-bongbabi.png` | `T-PCH-PET-EXC-3` 🆕 | [ ] |
| #I20 | `pets/pet-dangyeol.png` | `T-PCH-PET-EXC-3` | [ ] |
| #I21 | `pets/pet-bbogeulseu.png` | `T-PCH-PET-EXC-3` | [ ] |
| #I22 | `pets/pet-ungnami.png` | `T-PCH-PET-EXC-3` | [ ] |
| #I23 | `ui/ui-inv-frame.png` | `T-PCH-UI-INV` 🆕 | [ ] |
| #I24 | `ui/ui-inv-preview-stage.png` | `T-PCH-UI-INV` | [ ] |
| #I25 | `ui/ui-inv-tabs.png` | `T-PCH-UI-INV` | [ ] |
| #I26 | `ui/ui-inv-slot.png` | `T-PCH-UI-INV` | [ ] |
| #I27 | `ui/ui-inv-btn.png` | `T-PCH-UI-INV` | [ ] |
| #I28 | `ui/ui-inv-infocard.png` | `T-PCH-UI-INV` | [ ] |
| #I29 | `ui/ui-inv-badges.png` | `T-PCH-UI-INV` | [ ] |
| #I30 | `fx/fx-equip-sparkle.png` | `T-PCH-UI-INV` | [ ] |

## 권장 순서

1. #I01~#I04 (착용 아이템) → 2. #I05~#I10 (공용 펫, #I05 가 펫 시트 스타일 앵커) → 3. #I23~#I30 (UI, 프레임 먼저) → 4. #I11~#I22 (전용 펫, 사용자 레퍼런스 준비 후). 코드는 아트가 없으면 사각형·기본 폴백으로 동작하므로 이미지 생성과 구현을 병행할 수 있다.

## #I01 · 모자 시트 A (야구모자·비니·왕관·마법사 모자)

- **저장 이름**: `tmp/pitch-src/equipment/acc-hat-a.png` (1536×1024)
- **스레드**: 🆕 **새 스레드 시작** — `T-PCH-EQP` (착용 아이템 4시트가 공유하는 스레드)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/characters/char-woowakgood-stand.png` — **머리 크기 기준용**(아이템 크기 판단에만 쓰고 캐릭터는 그리지 말라고 프롬프트에 명시)
  - 선택 `tmp/pitch-src/characters/char-woowakgood-idle.png` — 정면·측면·후면 idle 3방향 머리 위치 확인용
- **검수 체크**: 3열×4행 그리드 정확, 셀당 1개, 캐릭터·머리·몸 없음, 같은 아이템의 세 방향이 색·비율·픽셀 크기 일치, 크기가 레퍼런스 캐릭터 머리 기준으로 자연스러움, 글자·숫자 없음, 마젠타/핑크 잔여 없음, 외곽 후광 없음, 모자 아래쪽 밑단이 행마다 같은 기준선에 놓임, 모자 안쪽 머리 없음
- **변환**: `pnpm convert:pitch-art -- equipment hat-a`
- **최종 사용**: 변환 시 셀별로 알파 bbox 를 잘라 정규화 셀(앵커 = 밑단 중앙)로 만들고 카탈로그 `wearScale` 로 머리 폭에 맞춘다. 아이콘 = FRONT 컷

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: wearable hat items for a small football-game character, drawn as isolated items WITHOUT any character, body or head. Each item is drawn at the size and orientation it would have when worn by the character shown in the attached reference image (the reference is used ONLY to judge the head size; do not draw the character).
Canvas: 1536x1024: a strict grid of 3 columns x 4 rows, every cell exactly 512x256, one item view per cell, centred.
Columns (left to right, identical in every row): column 1 = FRONT view (the item as seen from the front of the wearer, wearer facing the camera), column 2 = SIDE view (item as seen from the wearer's right side, wearer facing right), column 3 = BACK view (item as seen from behind the wearer).
Row 1: a navy baseball cap with a mint front panel, a curved brim and a small round pixel emblem (no letters)
Row 2: a mustard-yellow knit beanie with a folded cuff and a round pom-pom on top
Row 3: a gold royal crown with five points and red round gems
Row 4: a tall purple wizard hat with a floppy bent tip, a wide brim and gold stars
Placement rule for hats: in every cell the hat is centred horizontally on the head axis and its lower edge (brim edge or band edge) touches the same horizontal baseline near the lower part of the cell, as if resting on the top of a head; the interior space under the hat is transparent (the head is NOT drawn).
Size rule: the hat band is about 1.15x the head width of the reference character; the baseball cap is about 260 px wide in its cell, the other hats scale proportionally; keep every item fully inside its cell.
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; the same item keeps identical colours, proportions and pixel size in all its views; No text, no letters, no numbers, no logos anywhere in the image.
Use the attached image(s) as the style reference for pixel size, outline, palette and lighting (they show the SAME game), but do not copy their subject unless the description says so.
```

- [x] #I01 생성·저장 완료

## #I02 · 모자 시트 B (밀짚모자·헤드폰·산타 모자·카우보이 모자)

- **저장 이름**: `tmp/pitch-src/equipment/acc-hat-b.png` (1536×1024)
- **스레드**: ↪ **이어서** — `T-PCH-EQP` (이 스레드의 첫 스텝은 #I01 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/equipment/acc-hat-a.png` (#I01) — 같은 배치·크기·기준선·스타일
  - **필수** `tmp/pitch-src/characters/char-woowakgood-stand.png` — 머리 크기 기준
- **검수 체크**: 3열×4행 그리드 정확, 셀당 1개, 캐릭터·머리·몸 없음, 같은 아이템의 세 방향이 색·비율·픽셀 크기 일치, 크기가 레퍼런스 캐릭터 머리 기준으로 자연스러움, 글자·숫자 없음, 마젠타/핑크 잔여 없음, 외곽 후광 없음, 헤드폰은 정면 = 밴드+양쪽 컵, 측면 = 컵 1개+밴드, 후면 = 정면과 같은 구성
- **변환**: `pnpm convert:pitch-art -- equipment hat-b`
- **최종 사용**: hat-a 와 같은 규칙. 헤드폰은 모자 슬롯(밑단 = 컵 중심선 근처)이라 앵커 오프셋을 카탈로그에서 개별 지정

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: wearable hat items for a small football-game character, drawn as isolated items WITHOUT any character, body or head. Each item is drawn at the size and orientation it would have when worn by the character shown in the attached reference image (the reference is used ONLY to judge the head size; do not draw the character).
Canvas: 1536x1024: a strict grid of 3 columns x 4 rows, every cell exactly 512x256, one item view per cell, centred.
Columns (left to right, identical in every row): column 1 = FRONT view (the item as seen from the front of the wearer, wearer facing the camera), column 2 = SIDE view (item as seen from the wearer's right side, wearer facing right), column 3 = BACK view (item as seen from behind the wearer).
Row 1: a woven straw hat with a wide round brim and a red band
Row 2: over-ear headphones: a navy headband arching over where the head would be and two mint ear cups on the sides (in SIDE view only one ear cup and the band are visible)
Row 3: a red Santa hat with a white fur cuff and a white pom-pom hanging at the tip
Row 4: a brown cowboy hat with a curled wide brim, a dented crown and a yellow band
Placement rule: identical to the previous hat sheet: centred on the head axis, lower edge on a common baseline, nothing drawn inside where the head would be. For the headphones the ear cups sit level with the baseline area and the band arcs above it.
Size rule: same scale as the previous hat sheet (the attached approved sheet); the straw hat and cowboy hat brims are about 1.5x the head width.
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; the same item keeps identical colours, proportions and pixel size in all its views; No text, no letters, no numbers, no logos anywhere in the image.
Use the attached image(s) as the style reference for pixel size, outline, palette and lighting (they show the SAME game), but do not copy their subject unless the description says so.
```

- [x] #I02 생성·저장 완료

## #I03 · 얼굴 시트 A (선글라스·동그란 안경·하트 안경·안대)

- **저장 이름**: `tmp/pitch-src/equipment/acc-face-a.png` (1536×1024)
- **스레드**: ↪ **이어서** — `T-PCH-EQP` (이 스레드의 첫 스텝은 #I01 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/equipment/acc-hat-a.png` (#I01) — 스타일·픽셀 크기·머리 대비 스케일
  - **필수** `tmp/pitch-src/characters/char-woowakgood-stand.png` — 머리 크기 기준
- **검수 체크**: 3열×4행 그리드 정확, 셀당 1개, 캐릭터·머리·몸 없음, 같은 아이템의 세 방향이 색·비율·픽셀 크기 일치, 크기가 레퍼런스 캐릭터 머리 기준으로 자연스러움, 글자·숫자 없음, 마젠타/핑크 잔여 없음, 외곽 후광 없음, 3열(후면)은 완전히 비어 있음(런타임은 up 방향에서 얼굴 아이템을 숨김), 정면/측면만 채워짐
- **변환**: `pnpm convert:pitch-art -- equipment face-a`
- **최종 사용**: FRONT·SIDE 컷만 사용, 앵커 = 눈높이 중앙. up 방향에서는 그리지 않음

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: wearable face items for a small football-game character, drawn as isolated items WITHOUT any character, body or head. Each item is drawn at the size and orientation it would have when worn by the character shown in the attached reference image (the reference is used ONLY to judge the head size; do not draw the character).
Canvas: 1536x1024: a strict grid of 3 columns x 4 rows, every cell exactly 512x256, one item view per cell, centred.
Columns (left to right, identical in every row): column 1 = FRONT view (the item as seen from the front of the wearer, wearer facing the camera), column 2 = SIDE view (item as seen from the wearer's right side, wearer facing right), column 3 = BACK view (item as seen from behind the wearer).
Row 1: black wrap sunglasses with a small cyan glint on each lens
Row 2: thin round gold-frame glasses with clear pale-blue lenses
Row 3: heart-shaped glasses with a coral-red frame (#ff4d6d) and clear lenses
Row 4: a black pirate eye patch over the right eye with a thin strap going around (in FRONT view the strap runs diagonally across where the forehead would be)
Placement rule for face items: in every cell the item is centred horizontally on the face axis and vertically centred on the eye line, which is the middle of the cell height; in SIDE view show the item in profile including the temple arm going back; nothing is drawn behind or around the item (no face, no head).
Size rule: the glasses are about 0.85x the head width of the reference character (about 190 px wide in FRONT view in a 512 px cell); same scale for all four items.
The BACK column (column 3) stays completely empty in every row.
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; the same item keeps identical colours, proportions and pixel size in all its views; No text, no letters, no numbers, no logos anywhere in the image.
Use the attached image(s) as the style reference for pixel size, outline, palette and lighting (they show the SAME game), but do not copy their subject unless the description says so.
```

- [x] #I03 생성·저장 완료

## #I04 · 등 시트 A (붉은 망토·천사 날개·악마 날개·책가방)

- **저장 이름**: `tmp/pitch-src/equipment/acc-back-a.png` (1536×1024)
- **스레드**: ↪ **이어서** — `T-PCH-EQP` (이 스레드의 첫 스텝은 #I01 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/equipment/acc-hat-a.png` (#I01) — 스타일·픽셀 크기
  - **필수** `tmp/pitch-src/characters/char-woowakgood-stand.png` — 몸·머리 크기 기준
  - **필수** `tmp/pitch-src/characters/char-woowakgood-idle.png` — 후면(up) idle 몸통 크기·위치 확인용(등 아이템이 몸 뒤/앞에 어떻게 놓이는지)
- **검수 체크**: 3열×4행 그리드 정확, 셀당 1개, 캐릭터·머리·몸 없음, 같은 아이템의 세 방향이 색·비율·픽셀 크기 일치, 크기가 레퍼런스 캐릭터 머리 기준으로 자연스러움, 글자·숫자 없음, 마젠타/핑크 잔여 없음, 외곽 후광 없음, 세 방향이 같은 아이템으로 읽힘, 앵커 기준선(상단)이 행마다 일치
- **변환**: `pnpm convert:pitch-art -- equipment back-a`
- **최종 사용**: 레이어 순서: FRONT·SIDE = 몸 뒤, BACK = 몸 앞. 앵커 = 목덜미(머리 꼭대기 + 몸통 오프셋)

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: wearable back items for a small football-game character, drawn as isolated items WITHOUT any character, body or head. Each item is drawn at the size and orientation it would have when worn by the character shown in the attached reference image (the reference is used ONLY to judge the head size; do not draw the character).
Canvas: 1536x1024: a strict grid of 3 columns x 4 rows, every cell exactly 512x256, one item view per cell, centred.
Columns (left to right, identical in every row): column 1 = FRONT view (the item as seen from the front of the wearer, wearer facing the camera), column 2 = SIDE view (item as seen from the wearer's right side, wearer facing right), column 3 = BACK view (item as seen from behind the wearer).
Row 1: a red hero cape with a gold clasp and gold trim, hanging straight down with a slightly flared hem
Row 2: a pair of white angel wings with soft layered feathers and pale-blue shading
Row 3: a pair of dark purple bat-like devil wings with a coral-red inner membrane (no pink, no magenta)
Row 4: a navy school backpack with a mint stripe, two straps and a small buckle
Placement rule for back items: draw the COMPLETE item as it looks from that direction, without any body (the body will be drawn over or under it by the game). Anchor: in every cell the item is centred horizontally on the body axis and its top edge (cape collar, wing base, backpack top) sits on the same horizontal line in the upper part of the cell. FRONT view = item seen from the front side of the wearer (its inner side, wings spread behind), SIDE view = profile facing right (the item hangs behind the wearer's back, on the left of the cell), BACK view = the outer side of the item as seen from behind.
Size rule: the cape and backpack are about 1.5x the head width; the wing pair spans about 2.6x the head width in FRONT and BACK views; scale relative to the head size of the reference character; keep every item fully inside its cell.
Rules: no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; the same item keeps identical colours, proportions and pixel size in all its views; No text, no letters, no numbers, no logos anywhere in the image.
Use the attached image(s) as the style reference for pixel size, outline, palette and lighting (they show the SAME game), but do not copy their subject unless the description says so.
```

- [x] #I04 생성·저장 완료

## #I05 · 공용 펫 · 치즈냥

- **저장 이름**: `tmp/pitch-src/pets/pet-cheezenyang.png` (1536×1024)
- **스레드**: 🆕 **새 스레드 시작** — `T-PCH-PET-COM` (공용 펫 6장)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/characters/char-woowakgood-stand.png` — 게임 스타일·픽셀 크기 기준(캐릭터는 그리지 않음)
  - 선택 기존 `tmp/pitch-src/env/env-ball.png` — 공돌이처럼 공 소재가 있을 때 색 기준
- **검수 체크**: 4열×3행 그리드 정확, 12칸 모두 같은 펫(색·비율·얼굴 일치), 앞/옆(오른쪽)/뒤 방향이 맞음, idle A/B·move A/B 가 확실히 다른 포즈, 발 기준선 일치, 접지 그림자·글자 없음, 마젠타/핑크 잔여 없음
- **변환**: `pnpm convert:pitch-art -- pets cheezenyang`
- **최종 사용**: 펫 `cheezenyang` (공용). 변환: 셀 슬라이스 → 셀당 48×48 정규화(발 기준선 맞춤) → 아틀라스 12프레임 + 인벤토리 아이콘(FRONT idle A)

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: a small cute mascot pet for a football arcade game: a small chubby orange tabby kitten with a cream belly, pointed ears, a coral nose and a short curled tail. Chibi proportions, a big readable face, no accessories unless described.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly 384x341, one pet pose per cell, centred.
Columns (left to right, identical in every row): column 1 = idle frame A, column 2 = idle frame B (a tiny 2-pixel breathing bob or squash difference from A), column 3 = move frame A, column 4 = move frame B (a two-frame hop or waddle cycle; B is the opposite pose of A).
Rows (top to bottom): row 1 = FRONT view (facing the camera), row 2 = SIDE view (facing right), row 3 = BACK view (seen from behind).
Rules: the same pet, identical colours, proportions and pixel size in all 12 cells; the feet or the bottom of the body of every cell sit on a common baseline at about 80% of the cell height; the pet fills about 60-70% of the cell width; no ground shadow, no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; No text, no letters, no numbers, no logos anywhere in the image.
Use the attached image as the style reference for pixel size, outline, palette and lighting (it shows the SAME game); do not copy its subject.
```

- [x] #I05 생성·저장 완료

## #I06 · 공용 펫 · 꽥이

- **저장 이름**: `tmp/pitch-src/pets/pet-kkwaegi.png` (1536×1024)
- **스레드**: ↪ **이어서** — `T-PCH-PET-COM` (이 스레드의 첫 스텝은 #I05 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/pets/pet-cheezenyang.png` (#I05) — 그리드·포즈·스타일 기준
- **검수 체크**: 4열×3행 그리드 정확, 12칸 모두 같은 펫(색·비율·얼굴 일치), 앞/옆(오른쪽)/뒤 방향이 맞음, idle A/B·move A/B 가 확실히 다른 포즈, 발 기준선 일치, 접지 그림자·글자 없음, 마젠타/핑크 잔여 없음
- **변환**: `pnpm convert:pitch-art -- pets kkwaegi`
- **최종 사용**: 펫 `kkwaegi` (공용). 변환: 셀 슬라이스 → 셀당 48×48 정규화(발 기준선 맞춤) → 아틀라스 12프레임 + 인벤토리 아이콘(FRONT idle A)

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: a small cute mascot pet for a football arcade game: a round yellow duckling with a flat orange beak, tiny wings and small orange webbed feet. Chibi proportions, a big readable face, no accessories unless described.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly 384x341, one pet pose per cell, centred.
Columns (left to right, identical in every row): column 1 = idle frame A, column 2 = idle frame B (a tiny 2-pixel breathing bob or squash difference from A), column 3 = move frame A, column 4 = move frame B (a two-frame hop or waddle cycle; B is the opposite pose of A).
Rows (top to bottom): row 1 = FRONT view (facing the camera), row 2 = SIDE view (facing right), row 3 = BACK view (seen from behind).
Rules: the same pet, identical colours, proportions and pixel size in all 12 cells; the feet or the bottom of the body of every cell sit on a common baseline at about 80% of the cell height; the pet fills about 60-70% of the cell width; no ground shadow, no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; No text, no letters, no numbers, no logos anywhere in the image.
Use the attached approved pet sheet as the layout AND style reference (same grid, same pose logic, same pixel size, outline and palette), but draw the different pet described above.
```

- [x] #I06 생성·저장 완료

## #I07 · 공용 펫 · 말랑이

- **저장 이름**: `tmp/pitch-src/pets/pet-mallangi.png` (1536×1024)
- **스레드**: ↪ **이어서** — `T-PCH-PET-COM` (이 스레드의 첫 스텝은 #I05 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/pets/pet-cheezenyang.png` (#I05) — 그리드·포즈·스타일 기준
- **검수 체크**: 4열×3행 그리드 정확, 12칸 모두 같은 펫(색·비율·얼굴 일치), 앞/옆(오른쪽)/뒤 방향이 맞음, idle A/B·move A/B 가 확실히 다른 포즈, 발 기준선 일치, 접지 그림자·글자 없음, 마젠타/핑크 잔여 없음
- **변환**: `pnpm convert:pitch-art -- pets mallangi`
- **최종 사용**: 펫 `mallangi` (공용). 변환: 셀 슬라이스 → 셀당 48×48 정규화(발 기준선 맞춤) → 아틀라스 12프레임 + 인벤토리 아이콘(FRONT idle A)

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: a small cute mascot pet for a football arcade game: a glossy translucent mint-green slime blob with a bright highlight, two small dot eyes, a small smile and a tiny drip on one side. Chibi proportions, a big readable face, no accessories unless described.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly 384x341, one pet pose per cell, centred.
Columns (left to right, identical in every row): column 1 = idle frame A, column 2 = idle frame B (a tiny 2-pixel breathing bob or squash difference from A), column 3 = move frame A, column 4 = move frame B (a two-frame hop or waddle cycle; B is the opposite pose of A).
Rows (top to bottom): row 1 = FRONT view (facing the camera), row 2 = SIDE view (facing right), row 3 = BACK view (seen from behind).
Rules: the same pet, identical colours, proportions and pixel size in all 12 cells; the feet or the bottom of the body of every cell sit on a common baseline at about 80% of the cell height; the pet fills about 60-70% of the cell width; no ground shadow, no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; No text, no letters, no numbers, no logos anywhere in the image.
Use the attached approved pet sheet as the layout AND style reference (same grid, same pose logic, same pixel size, outline and palette), but draw the different pet described above.
```

- [x] #I07 생성·저장 완료

## #I08 · 공용 펫 · 공돌이

- **저장 이름**: `tmp/pitch-src/pets/pet-gongdori.png` (1536×1024)
- **스레드**: ↪ **이어서** — `T-PCH-PET-COM` (이 스레드의 첫 스텝은 #I05 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/pets/pet-cheezenyang.png` (#I05) — 그리드·포즈·스타일 기준
- **검수 체크**: 4열×3행 그리드 정확, 12칸 모두 같은 펫(색·비율·얼굴 일치), 앞/옆(오른쪽)/뒤 방향이 맞음, idle A/B·move A/B 가 확실히 다른 포즈, 발 기준선 일치, 접지 그림자·글자 없음, 마젠타/핑크 잔여 없음
- **변환**: `pnpm convert:pitch-art -- pets gongdori`
- **최종 사용**: 펫 `gongdori` (공용). 변환: 셀 슬라이스 → 셀당 48×48 정규화(발 기준선 맞춤) → 아틀라스 12프레임 + 인벤토리 아이콘(FRONT idle A)

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: a small cute mascot pet for a football arcade game: a small white football with navy pentagon patches that has two tiny arms, two tiny legs and two round eyes on its front, a football spirit. Chibi proportions, a big readable face, no accessories unless described.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly 384x341, one pet pose per cell, centred.
Columns (left to right, identical in every row): column 1 = idle frame A, column 2 = idle frame B (a tiny 2-pixel breathing bob or squash difference from A), column 3 = move frame A, column 4 = move frame B (a two-frame hop or waddle cycle; B is the opposite pose of A).
Rows (top to bottom): row 1 = FRONT view (facing the camera), row 2 = SIDE view (facing right), row 3 = BACK view (seen from behind).
Rules: the same pet, identical colours, proportions and pixel size in all 12 cells; the feet or the bottom of the body of every cell sit on a common baseline at about 80% of the cell height; the pet fills about 60-70% of the cell width; no ground shadow, no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; No text, no letters, no numbers, no logos anywhere in the image.
Use the attached approved pet sheet as the layout AND style reference (same grid, same pose logic, same pixel size, outline and palette), but draw the different pet described above.
```

- [x] #I08 생성·저장 완료

## #I09 · 공용 펫 · 삐약이

- **저장 이름**: `tmp/pitch-src/pets/pet-ppiyagi.png` (1536×1024)
- **스레드**: ↪ **이어서** — `T-PCH-PET-COM` (이 스레드의 첫 스텝은 #I05 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/pets/pet-cheezenyang.png` (#I05) — 그리드·포즈·스타일 기준
- **검수 체크**: 4열×3행 그리드 정확, 12칸 모두 같은 펫(색·비율·얼굴 일치), 앞/옆(오른쪽)/뒤 방향이 맞음, idle A/B·move A/B 가 확실히 다른 포즈, 발 기준선 일치, 접지 그림자·글자 없음, 마젠타/핑크 잔여 없음
- **변환**: `pnpm convert:pitch-art -- pets ppiyagi`
- **최종 사용**: 펫 `ppiyagi` (공용). 변환: 셀 슬라이스 → 셀당 48×48 정규화(발 기준선 맞춤) → 아틀라스 12프레임 + 인벤토리 아이콘(FRONT idle A)

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: a small cute mascot pet for a football arcade game: a fluffy round pale-yellow chick with a tiny orange beak, tiny orange legs and a small tuft on its head. Chibi proportions, a big readable face, no accessories unless described.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly 384x341, one pet pose per cell, centred.
Columns (left to right, identical in every row): column 1 = idle frame A, column 2 = idle frame B (a tiny 2-pixel breathing bob or squash difference from A), column 3 = move frame A, column 4 = move frame B (a two-frame hop or waddle cycle; B is the opposite pose of A).
Rows (top to bottom): row 1 = FRONT view (facing the camera), row 2 = SIDE view (facing right), row 3 = BACK view (seen from behind).
Rules: the same pet, identical colours, proportions and pixel size in all 12 cells; the feet or the bottom of the body of every cell sit on a common baseline at about 80% of the cell height; the pet fills about 60-70% of the cell width; no ground shadow, no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; No text, no letters, no numbers, no logos anywhere in the image.
Use the attached approved pet sheet as the layout AND style reference (same grid, same pose logic, same pixel size, outline and palette), but draw the different pet described above.
```

- [x] #I09 생성·저장 완료

## #I10 · 공용 펫 · 뚜뚜

- **저장 이름**: `tmp/pitch-src/pets/pet-ttuttu.png` (1536×1024)
- **스레드**: ↪ **이어서** — `T-PCH-PET-COM` (이 스레드의 첫 스텝은 #I05 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/pets/pet-cheezenyang.png` (#I05) — 그리드·포즈·스타일 기준
- **검수 체크**: 4열×3행 그리드 정확, 12칸 모두 같은 펫(색·비율·얼굴 일치), 앞/옆(오른쪽)/뒤 방향이 맞음, idle A/B·move A/B 가 확실히 다른 포즈, 발 기준선 일치, 접지 그림자·글자 없음, 마젠타/핑크 잔여 없음
- **변환**: `pnpm convert:pitch-art -- pets ttuttu`
- **최종 사용**: 펫 `ttuttu` (공용). 변환: 셀 슬라이스 → 셀당 48×48 정규화(발 기준선 맞춤) → 아틀라스 12프레임 + 인벤토리 아이콘(FRONT idle A)

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: a small cute mascot pet for a football arcade game: a boxy little silver-blue robot with a round screen face showing two cyan eyes, one antenna with a glowing cyan bulb and tiny wheels. Chibi proportions, a big readable face, no accessories unless described.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly 384x341, one pet pose per cell, centred.
Columns (left to right, identical in every row): column 1 = idle frame A, column 2 = idle frame B (a tiny 2-pixel breathing bob or squash difference from A), column 3 = move frame A, column 4 = move frame B (a two-frame hop or waddle cycle; B is the opposite pose of A).
Rows (top to bottom): row 1 = FRONT view (facing the camera), row 2 = SIDE view (facing right), row 3 = BACK view (seen from behind).
Rules: the same pet, identical colours, proportions and pixel size in all 12 cells; the feet or the bottom of the body of every cell sit on a common baseline at about 80% of the cell height; the pet fills about 60-70% of the cell width; no ground shadow, no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; No text, no letters, no numbers, no logos anywhere in the image.
Use the attached approved pet sheet as the layout AND style reference (same grid, same pose logic, same pixel size, outline and palette), but draw the different pet described above.
```

- [x] #I10 생성·저장 완료

## #I11 · 전용 펫 · 팬치 (우왁굳 (woowakgood) 전용)

- **저장 이름**: `tmp/pitch-src/pets/pet-panchi.png` (1536×1024)
- **스레드**: 🆕 **새 스레드 시작** — `T-PCH-PET-EXC-1` (전용 펫 4장)
- **레퍼런스 첨부**:
  - **필수 1** 사용자 제공 펫 레퍼런스 `tmp/pitch-src/refs/pet-panchi-ref.png` — 디자인 기준 (침팬치를 형상화한 펫)
  - **필수 2** 승인본 `tmp/pitch-src/pets/pet-cheezenyang.png` (#I05) — 시트 그리드·포즈·스타일 기준(이 펫의 디자인은 복사하지 않음)
- **검수 체크**: 4열×3행 그리드 정확, 12칸 모두 같은 펫(색·비율·얼굴 일치), 앞/옆(오른쪽)/뒤 방향이 맞음, idle A/B·move A/B 가 확실히 다른 포즈, 발 기준선 일치, 접지 그림자·글자 없음, 마젠타/핑크 잔여 없음, **레퍼런스와 디자인이 동일**(형태·색·얼굴 재해석 금지)
- **변환**: `pnpm convert:pitch-art -- pets panchi`
- **최종 사용**: `우왁굳 (woowakgood)` 전용 펫 `panchi`. 카탈로그 `exclusiveTo` 로 해당 캐릭터의 펫 탭에서만 노출

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: a small game mascot pet. Attached image 1 is the EXACT design of this pet: keep its shapes, proportions, colours, face and every detail identical; do not redesign, reinterpret, simplify into something else, or add or remove features. Re-draw it as a small game pet in the pixel art style of attached image 2.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly 384x341, one pet pose per cell, centred.
Columns (left to right, identical in every row): column 1 = idle frame A, column 2 = idle frame B (a tiny 2-pixel breathing bob or squash difference from A), column 3 = move frame A, column 4 = move frame B (a two-frame hop or waddle cycle; B is the opposite pose of A).
Rows (top to bottom): row 1 = FRONT view (facing the camera), row 2 = SIDE view (facing right), row 3 = BACK view (seen from behind).
For the BACK row, draw the back side of the same creature in a way that is consistent with attached image 1; do not invent new features.
Rules: the same pet, identical colours, proportions and pixel size in all 12 cells; the feet or the bottom of the body of every cell sit on a common baseline at about 80% of the cell height; the pet fills about 60-70% of the cell width; no ground shadow, no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; No text, no letters, no numbers, no logos anywhere in the image.
Attached image 2 is the approved pet sheet: use it for the grid layout, pose logic, pixel size, outline and palette treatment only, never for the design of the creature.
```

- [x] #I11 생성·저장 완료

## #I12 · 전용 펫 · 해피 (해파린 (haepalin) 전용)

- **저장 이름**: `tmp/pitch-src/pets/pet-haepi.png` (1536×1024)
- **스레드**: ↪ **이어서** — `T-PCH-PET-EXC-1` (이 스레드의 첫 스텝은 #I11 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수 1** 사용자 제공 펫 레퍼런스 `tmp/pitch-src/refs/pet-haepi-ref.png` — 디자인 기준 (해파리를 형상화한 펫)
  - **필수 2** 승인본 `tmp/pitch-src/pets/pet-cheezenyang.png` (#I05) — 시트 그리드·포즈·스타일 기준(이 펫의 디자인은 복사하지 않음)
- **검수 체크**: 4열×3행 그리드 정확, 12칸 모두 같은 펫(색·비율·얼굴 일치), 앞/옆(오른쪽)/뒤 방향이 맞음, idle A/B·move A/B 가 확실히 다른 포즈, 발 기준선 일치, 접지 그림자·글자 없음, 마젠타/핑크 잔여 없음, **레퍼런스와 디자인이 동일**(형태·색·얼굴 재해석 금지)
- **변환**: `pnpm convert:pitch-art -- pets haepi`
- **최종 사용**: `해파린 (haepalin)` 전용 펫 `haepi`. 카탈로그 `exclusiveTo` 로 해당 캐릭터의 펫 탭에서만 노출

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: a small game mascot pet. Attached image 1 is the EXACT design of this pet: keep its shapes, proportions, colours, face and every detail identical; do not redesign, reinterpret, simplify into something else, or add or remove features. Re-draw it as a small game pet in the pixel art style of attached image 2.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly 384x341, one pet pose per cell, centred.
Columns (left to right, identical in every row): column 1 = idle frame A, column 2 = idle frame B (a tiny 2-pixel breathing bob or squash difference from A), column 3 = move frame A, column 4 = move frame B (a two-frame hop or waddle cycle; B is the opposite pose of A).
Rows (top to bottom): row 1 = FRONT view (facing the camera), row 2 = SIDE view (facing right), row 3 = BACK view (seen from behind).
For the BACK row, draw the back side of the same creature in a way that is consistent with attached image 1; do not invent new features.
Rules: the same pet, identical colours, proportions and pixel size in all 12 cells; the feet or the bottom of the body of every cell sit on a common baseline at about 80% of the cell height; the pet fills about 60-70% of the cell width; no ground shadow, no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; No text, no letters, no numbers, no logos anywhere in the image.
Attached image 2 is the approved pet sheet: use it for the grid layout, pose logic, pixel size, outline and palette treatment only, never for the design of the creature.
```

- [x] #I12 생성·저장 완료

## #I13 · 전용 펫 · 구르미 (재닌 (janine95kim) 전용)

- **저장 이름**: `tmp/pitch-src/pets/pet-gureumi.png` (1536×1024)
- **스레드**: ↪ **이어서** — `T-PCH-PET-EXC-1` (이 스레드의 첫 스텝은 #I11 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수 1** 사용자 제공 펫 레퍼런스 `tmp/pitch-src/refs/pet-gureumi-ref.png` — 디자인 기준 (구름을 형상화한 펫)
  - **필수 2** 승인본 `tmp/pitch-src/pets/pet-cheezenyang.png` (#I05) — 시트 그리드·포즈·스타일 기준(이 펫의 디자인은 복사하지 않음)
- **검수 체크**: 4열×3행 그리드 정확, 12칸 모두 같은 펫(색·비율·얼굴 일치), 앞/옆(오른쪽)/뒤 방향이 맞음, idle A/B·move A/B 가 확실히 다른 포즈, 발 기준선 일치, 접지 그림자·글자 없음, 마젠타/핑크 잔여 없음, **레퍼런스와 디자인이 동일**(형태·색·얼굴 재해석 금지)
- **변환**: `pnpm convert:pitch-art -- pets gureumi`
- **최종 사용**: `재닌 (janine95kim)` 전용 펫 `gureumi`. 카탈로그 `exclusiveTo` 로 해당 캐릭터의 펫 탭에서만 노출

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: a small game mascot pet. Attached image 1 is the EXACT design of this pet: keep its shapes, proportions, colours, face and every detail identical; do not redesign, reinterpret, simplify into something else, or add or remove features. Re-draw it as a small game pet in the pixel art style of attached image 2.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly 384x341, one pet pose per cell, centred.
Columns (left to right, identical in every row): column 1 = idle frame A, column 2 = idle frame B (a tiny 2-pixel breathing bob or squash difference from A), column 3 = move frame A, column 4 = move frame B (a two-frame hop or waddle cycle; B is the opposite pose of A).
Rows (top to bottom): row 1 = FRONT view (facing the camera), row 2 = SIDE view (facing right), row 3 = BACK view (seen from behind).
For the BACK row, draw the back side of the same creature in a way that is consistent with attached image 1; do not invent new features.
Rules: the same pet, identical colours, proportions and pixel size in all 12 cells; the feet or the bottom of the body of every cell sit on a common baseline at about 80% of the cell height; the pet fills about 60-70% of the cell width; no ground shadow, no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; No text, no letters, no numbers, no logos anywhere in the image.
Attached image 2 is the approved pet sheet: use it for the grid layout, pose logic, pixel size, outline and palette treatment only, never for the design of the creature.
```

- [x] #I13 생성·저장 완료

## #I14 · 전용 펫 · 용볼이 (하치 (hachi97) 전용)

- **저장 이름**: `tmp/pitch-src/pets/pet-yongboli.png` (1536×1024)
- **스레드**: ↪ **이어서** — `T-PCH-PET-EXC-1` (이 스레드의 첫 스텝은 #I11 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수 1** 사용자 제공 펫 레퍼런스 `tmp/pitch-src/refs/pet-yongboli-ref.png` — 디자인 기준 (드래곤볼을 형상화한 펫)
  - **필수 2** 승인본 `tmp/pitch-src/pets/pet-cheezenyang.png` (#I05) — 시트 그리드·포즈·스타일 기준(이 펫의 디자인은 복사하지 않음)
- **검수 체크**: 4열×3행 그리드 정확, 12칸 모두 같은 펫(색·비율·얼굴 일치), 앞/옆(오른쪽)/뒤 방향이 맞음, idle A/B·move A/B 가 확실히 다른 포즈, 발 기준선 일치, 접지 그림자·글자 없음, 마젠타/핑크 잔여 없음, **레퍼런스와 디자인이 동일**(형태·색·얼굴 재해석 금지)
- **변환**: `pnpm convert:pitch-art -- pets yongboli`
- **최종 사용**: `하치 (hachi97)` 전용 펫 `yongboli`. 카탈로그 `exclusiveTo` 로 해당 캐릭터의 펫 탭에서만 노출

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: a small game mascot pet. Attached image 1 is the EXACT design of this pet: keep its shapes, proportions, colours, face and every detail identical; do not redesign, reinterpret, simplify into something else, or add or remove features. Re-draw it as a small game pet in the pixel art style of attached image 2.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly 384x341, one pet pose per cell, centred.
Columns (left to right, identical in every row): column 1 = idle frame A, column 2 = idle frame B (a tiny 2-pixel breathing bob or squash difference from A), column 3 = move frame A, column 4 = move frame B (a two-frame hop or waddle cycle; B is the opposite pose of A).
Rows (top to bottom): row 1 = FRONT view (facing the camera), row 2 = SIDE view (facing right), row 3 = BACK view (seen from behind).
For the BACK row, draw the back side of the same creature in a way that is consistent with attached image 1; do not invent new features.
Rules: the same pet, identical colours, proportions and pixel size in all 12 cells; the feet or the bottom of the body of every cell sit on a common baseline at about 80% of the cell height; the pet fills about 60-70% of the cell width; no ground shadow, no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; No text, no letters, no numbers, no logos anywhere in the image.
Attached image 2 is the approved pet sheet: use it for the grid layout, pose logic, pixel size, outline and palette treatment only, never for the design of the creature.
```

- [x] #I14 생성·저장 완료

## #I15 · 전용 펫 · 뱀술이 (리냐 (lina0108) 전용)

- **저장 이름**: `tmp/pitch-src/pets/pet-baemsuri.png` (1536×1024)
- **스레드**: 🆕 **새 스레드 시작** — `T-PCH-PET-EXC-2` (전용 펫 4장)
- **레퍼런스 첨부**:
  - **필수 1** 사용자 제공 펫 레퍼런스 `tmp/pitch-src/refs/pet-baemsuri-ref.png` — 디자인 기준 (뱀을 형상화했지만 둥근 형태이고 뱀과 닮지 않았음 — 레퍼런스를 있는 그대로 따를 것(뱀답게 고치지 말 것))
  - **필수 2** 승인본 `tmp/pitch-src/pets/pet-cheezenyang.png` (#I05) — 시트 그리드·포즈·스타일 기준(이 펫의 디자인은 복사하지 않음)
- **검수 체크**: 4열×3행 그리드 정확, 12칸 모두 같은 펫(색·비율·얼굴 일치), 앞/옆(오른쪽)/뒤 방향이 맞음, idle A/B·move A/B 가 확실히 다른 포즈, 발 기준선 일치, 접지 그림자·글자 없음, 마젠타/핑크 잔여 없음, **레퍼런스와 디자인이 동일**(형태·색·얼굴 재해석 금지, 특히 뱀답게 고치지 않았는지)
- **변환**: `pnpm convert:pitch-art -- pets baemsuri`
- **최종 사용**: `리냐 (lina0108)` 전용 펫 `baemsuri`. 카탈로그 `exclusiveTo` 로 해당 캐릭터의 펫 탭에서만 노출

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: a small game mascot pet. Attached image 1 is the EXACT design of this pet: keep its shapes, proportions, colours, face and every detail identical; do not redesign, reinterpret, simplify into something else, or add or remove features. Re-draw it as a small game pet in the pixel art style of attached image 2.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly 384x341, one pet pose per cell, centred.
Columns (left to right, identical in every row): column 1 = idle frame A, column 2 = idle frame B (a tiny 2-pixel breathing bob or squash difference from A), column 3 = move frame A, column 4 = move frame B (a two-frame hop or waddle cycle; B is the opposite pose of A).
Rows (top to bottom): row 1 = FRONT view (facing the camera), row 2 = SIDE view (facing right), row 3 = BACK view (seen from behind).
For the BACK row, draw the back side of the same creature in a way that is consistent with attached image 1; do not invent new features.
Rules: the same pet, identical colours, proportions and pixel size in all 12 cells; the feet or the bottom of the body of every cell sit on a common baseline at about 80% of the cell height; the pet fills about 60-70% of the cell width; no ground shadow, no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; No text, no letters, no numbers, no logos anywhere in the image.
Attached image 2 is the approved pet sheet: use it for the grid layout, pose logic, pixel size, outline and palette treatment only, never for the design of the creature.
```

- [x] #I15 생성·저장 완료

## #I16 · 전용 펫 · 돌멩이 (쥬멩이 (ju010228) 전용)

- **저장 이름**: `tmp/pitch-src/pets/pet-dolmengi.png` (1536×1024)
- **스레드**: ↪ **이어서** — `T-PCH-PET-EXC-2` (이 스레드의 첫 스텝은 #I15 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수 1** 사용자 제공 펫 레퍼런스 `tmp/pitch-src/refs/pet-dolmengi-ref.png` — 디자인 기준 (돌을 형상화한 펫)
  - **필수 2** 승인본 `tmp/pitch-src/pets/pet-cheezenyang.png` (#I05) — 시트 그리드·포즈·스타일 기준(이 펫의 디자인은 복사하지 않음)
- **검수 체크**: 4열×3행 그리드 정확, 12칸 모두 같은 펫(색·비율·얼굴 일치), 앞/옆(오른쪽)/뒤 방향이 맞음, idle A/B·move A/B 가 확실히 다른 포즈, 발 기준선 일치, 접지 그림자·글자 없음, 마젠타/핑크 잔여 없음, **레퍼런스와 디자인이 동일**(형태·색·얼굴 재해석 금지)
- **변환**: `pnpm convert:pitch-art -- pets dolmengi`
- **최종 사용**: `쥬멩이 (ju010228)` 전용 펫 `dolmengi`. 카탈로그 `exclusiveTo` 로 해당 캐릭터의 펫 탭에서만 노출

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: a small game mascot pet. Attached image 1 is the EXACT design of this pet: keep its shapes, proportions, colours, face and every detail identical; do not redesign, reinterpret, simplify into something else, or add or remove features. Re-draw it as a small game pet in the pixel art style of attached image 2.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly 384x341, one pet pose per cell, centred.
Columns (left to right, identical in every row): column 1 = idle frame A, column 2 = idle frame B (a tiny 2-pixel breathing bob or squash difference from A), column 3 = move frame A, column 4 = move frame B (a two-frame hop or waddle cycle; B is the opposite pose of A).
Rows (top to bottom): row 1 = FRONT view (facing the camera), row 2 = SIDE view (facing right), row 3 = BACK view (seen from behind).
For the BACK row, draw the back side of the same creature in a way that is consistent with attached image 1; do not invent new features.
Rules: the same pet, identical colours, proportions and pixel size in all 12 cells; the feet or the bottom of the body of every cell sit on a common baseline at about 80% of the cell height; the pet fills about 60-70% of the cell width; no ground shadow, no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; No text, no letters, no numbers, no logos anywhere in the image.
Attached image 2 is the approved pet sheet: use it for the grid layout, pose logic, pixel size, outline and palette treatment only, never for the design of the creature.
```

- [x] #I16 생성·저장 완료

## #I17 · 전용 펫 · 시바꺼 (다시바 (tdnlamuron, 요청의 '시바') 전용)

- **저장 이름**: `tmp/pitch-src/pets/pet-sibakkeo.png` (1536×1024)
- **스레드**: ↪ **이어서** — `T-PCH-PET-EXC-2` (이 스레드의 첫 스텝은 #I15 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수 1** 사용자 제공 펫 레퍼런스 `tmp/pitch-src/refs/pet-sibakkeo-ref.png` — 디자인 기준 (시바견을 형상화한 펫)
  - **필수 2** 승인본 `tmp/pitch-src/pets/pet-cheezenyang.png` (#I05) — 시트 그리드·포즈·스타일 기준(이 펫의 디자인은 복사하지 않음)
- **검수 체크**: 4열×3행 그리드 정확, 12칸 모두 같은 펫(색·비율·얼굴 일치), 앞/옆(오른쪽)/뒤 방향이 맞음, idle A/B·move A/B 가 확실히 다른 포즈, 발 기준선 일치, 접지 그림자·글자 없음, 마젠타/핑크 잔여 없음, **레퍼런스와 디자인이 동일**(형태·색·얼굴 재해석 금지)
- **변환**: `pnpm convert:pitch-art -- pets sibakkeo`
- **최종 사용**: `다시바 (tdnlamuron, 요청의 '시바')` 전용 펫 `sibakkeo`. 카탈로그 `exclusiveTo` 로 해당 캐릭터의 펫 탭에서만 노출

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: a small game mascot pet. Attached image 1 is the EXACT design of this pet: keep its shapes, proportions, colours, face and every detail identical; do not redesign, reinterpret, simplify into something else, or add or remove features. Re-draw it as a small game pet in the pixel art style of attached image 2.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly 384x341, one pet pose per cell, centred.
Columns (left to right, identical in every row): column 1 = idle frame A, column 2 = idle frame B (a tiny 2-pixel breathing bob or squash difference from A), column 3 = move frame A, column 4 = move frame B (a two-frame hop or waddle cycle; B is the opposite pose of A).
Rows (top to bottom): row 1 = FRONT view (facing the camera), row 2 = SIDE view (facing right), row 3 = BACK view (seen from behind).
For the BACK row, draw the back side of the same creature in a way that is consistent with attached image 1; do not invent new features.
Rules: the same pet, identical colours, proportions and pixel size in all 12 cells; the feet or the bottom of the body of every cell sit on a common baseline at about 80% of the cell height; the pet fills about 60-70% of the cell width; no ground shadow, no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; No text, no letters, no numbers, no logos anywhere in the image.
Attached image 2 is the approved pet sheet: use it for the grid layout, pose logic, pixel size, outline and palette treatment only, never for the design of the creature.
```

- [x] #I17 생성·저장 완료

## #I18 · 전용 펫 · 펭귄 (핑구 (sjh4018) 전용)

- **저장 이름**: `tmp/pitch-src/pets/pet-penguin.png` (1536×1024)
- **스레드**: ↪ **이어서** — `T-PCH-PET-EXC-2` (이 스레드의 첫 스텝은 #I15 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수 1** 사용자 제공 펫 레퍼런스 `tmp/pitch-src/refs/pet-penguin-ref.png` — 디자인 기준 (펭귄)
  - **필수 2** 승인본 `tmp/pitch-src/pets/pet-cheezenyang.png` (#I05) — 시트 그리드·포즈·스타일 기준(이 펫의 디자인은 복사하지 않음)
- **검수 체크**: 4열×3행 그리드 정확, 12칸 모두 같은 펫(색·비율·얼굴 일치), 앞/옆(오른쪽)/뒤 방향이 맞음, idle A/B·move A/B 가 확실히 다른 포즈, 발 기준선 일치, 접지 그림자·글자 없음, 마젠타/핑크 잔여 없음, **레퍼런스와 디자인이 동일**(형태·색·얼굴 재해석 금지)
- **변환**: `pnpm convert:pitch-art -- pets penguin`
- **최종 사용**: `핑구 (sjh4018)` 전용 펫 `penguin`. 카탈로그 `exclusiveTo` 로 해당 캐릭터의 펫 탭에서만 노출

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: a small game mascot pet. Attached image 1 is the EXACT design of this pet: keep its shapes, proportions, colours, face and every detail identical; do not redesign, reinterpret, simplify into something else, or add or remove features. Re-draw it as a small game pet in the pixel art style of attached image 2.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly 384x341, one pet pose per cell, centred.
Columns (left to right, identical in every row): column 1 = idle frame A, column 2 = idle frame B (a tiny 2-pixel breathing bob or squash difference from A), column 3 = move frame A, column 4 = move frame B (a two-frame hop or waddle cycle; B is the opposite pose of A).
Rows (top to bottom): row 1 = FRONT view (facing the camera), row 2 = SIDE view (facing right), row 3 = BACK view (seen from behind).
For the BACK row, draw the back side of the same creature in a way that is consistent with attached image 1; do not invent new features.
Rules: the same pet, identical colours, proportions and pixel size in all 12 cells; the feet or the bottom of the body of every cell sit on a common baseline at about 80% of the cell height; the pet fills about 60-70% of the cell width; no ground shadow, no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; No text, no letters, no numbers, no logos anywhere in the image.
Attached image 2 is the approved pet sheet: use it for the grid layout, pose logic, pixel size, outline and palette treatment only, never for the design of the creature.
```

- [-] #I18 생성·저장 완료

## #I19 · 전용 펫 · 봉밥이 (빙밍 (tleod1818) 전용)

- **저장 이름**: `tmp/pitch-src/pets/pet-bongbabi.png` (1536×1024)
- **스레드**: 🆕 **새 스레드 시작** — `T-PCH-PET-EXC-3` (전용 펫 4장)
- **레퍼런스 첨부**:
  - **필수 1** 사용자 제공 펫 레퍼런스 `tmp/pitch-src/refs/pet-bongbabi-ref.png` — 디자인 기준
  - **필수 2** 승인본 `tmp/pitch-src/pets/pet-cheezenyang.png` (#I05) — 시트 그리드·포즈·스타일 기준(이 펫의 디자인은 복사하지 않음)
- **검수 체크**: 4열×3행 그리드 정확, 12칸 모두 같은 펫(색·비율·얼굴 일치), 앞/옆(오른쪽)/뒤 방향이 맞음, idle A/B·move A/B 가 확실히 다른 포즈, 발 기준선 일치, 접지 그림자·글자 없음, 마젠타/핑크 잔여 없음, **레퍼런스와 디자인이 동일**(형태·색·얼굴 재해석 금지)
- **변환**: `pnpm convert:pitch-art -- pets bongbabi`
- **최종 사용**: `빙밍 (tleod1818)` 전용 펫 `bongbabi`. 카탈로그 `exclusiveTo` 로 해당 캐릭터의 펫 탭에서만 노출

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: a small game mascot pet. Attached image 1 is the EXACT design of this pet: keep its shapes, proportions, colours, face and every detail identical; do not redesign, reinterpret, simplify into something else, or add or remove features. Re-draw it as a small game pet in the pixel art style of attached image 2.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly 384x341, one pet pose per cell, centred.
Columns (left to right, identical in every row): column 1 = idle frame A, column 2 = idle frame B (a tiny 2-pixel breathing bob or squash difference from A), column 3 = move frame A, column 4 = move frame B (a two-frame hop or waddle cycle; B is the opposite pose of A).
Rows (top to bottom): row 1 = FRONT view (facing the camera), row 2 = SIDE view (facing right), row 3 = BACK view (seen from behind).
For the BACK row, draw the back side of the same creature in a way that is consistent with attached image 1; do not invent new features.
Rules: the same pet, identical colours, proportions and pixel size in all 12 cells; the feet or the bottom of the body of every cell sit on a common baseline at about 80% of the cell height; the pet fills about 60-70% of the cell width; no ground shadow, no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; No text, no letters, no numbers, no logos anywhere in the image.
Attached image 2 is the approved pet sheet: use it for the grid layout, pose logic, pixel size, outline and palette treatment only, never for the design of the creature.
```

- [x] #I19 생성·저장 완료

## #I20 · 전용 펫 · 단결 (한결 (kaksjak0730) 전용)

- **저장 이름**: `tmp/pitch-src/pets/pet-dangyeol.png` (1536×1024)
- **스레드**: ↪ **이어서** — `T-PCH-PET-EXC-3` (이 스레드의 첫 스텝은 #I19 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수 1** 사용자 제공 펫 레퍼런스 `tmp/pitch-src/refs/pet-dangyeol-ref.png` — 디자인 기준
  - **필수 2** 승인본 `tmp/pitch-src/pets/pet-cheezenyang.png` (#I05) — 시트 그리드·포즈·스타일 기준(이 펫의 디자인은 복사하지 않음)
- **검수 체크**: 4열×3행 그리드 정확, 12칸 모두 같은 펫(색·비율·얼굴 일치), 앞/옆(오른쪽)/뒤 방향이 맞음, idle A/B·move A/B 가 확실히 다른 포즈, 발 기준선 일치, 접지 그림자·글자 없음, 마젠타/핑크 잔여 없음, **레퍼런스와 디자인이 동일**(형태·색·얼굴 재해석 금지)
- **변환**: `pnpm convert:pitch-art -- pets dangyeol`
- **최종 사용**: `한결 (kaksjak0730)` 전용 펫 `dangyeol`. 카탈로그 `exclusiveTo` 로 해당 캐릭터의 펫 탭에서만 노출

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: a small game mascot pet. Attached image 1 is the EXACT design of this pet: keep its shapes, proportions, colours, face and every detail identical; do not redesign, reinterpret, simplify into something else, or add or remove features. Re-draw it as a small game pet in the pixel art style of attached image 2.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly 384x341, one pet pose per cell, centred.
Columns (left to right, identical in every row): column 1 = idle frame A, column 2 = idle frame B (a tiny 2-pixel breathing bob or squash difference from A), column 3 = move frame A, column 4 = move frame B (a two-frame hop or waddle cycle; B is the opposite pose of A).
Rows (top to bottom): row 1 = FRONT view (facing the camera), row 2 = SIDE view (facing right), row 3 = BACK view (seen from behind).
For the BACK row, draw the back side of the same creature in a way that is consistent with attached image 1; do not invent new features.
Rules: the same pet, identical colours, proportions and pixel size in all 12 cells; the feet or the bottom of the body of every cell sit on a common baseline at about 80% of the cell height; the pet fills about 60-70% of the cell width; no ground shadow, no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; No text, no letters, no numbers, no logos anywhere in the image.
Attached image 2 is the approved pet sheet: use it for the grid layout, pose logic, pixel size, outline and palette treatment only, never for the design of the creature.
```

- [x] #I20 생성·저장 완료

## #I21 · 전용 펫 · 뽀글스 (뽀린걸 (bboringirl) 전용)

- **저장 이름**: `tmp/pitch-src/pets/pet-bbogeulseu.png` (1536×1024)
- **스레드**: ↪ **이어서** — `T-PCH-PET-EXC-3` (이 스레드의 첫 스텝은 #I19 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수 1** 사용자 제공 펫 레퍼런스 `tmp/pitch-src/refs/pet-bbogeulseu-ref.png` — 디자인 기준
  - **필수 2** 승인본 `tmp/pitch-src/pets/pet-cheezenyang.png` (#I05) — 시트 그리드·포즈·스타일 기준(이 펫의 디자인은 복사하지 않음)
- **검수 체크**: 4열×3행 그리드 정확, 12칸 모두 같은 펫(색·비율·얼굴 일치), 앞/옆(오른쪽)/뒤 방향이 맞음, idle A/B·move A/B 가 확실히 다른 포즈, 발 기준선 일치, 접지 그림자·글자 없음, 마젠타/핑크 잔여 없음, **레퍼런스와 디자인이 동일**(형태·색·얼굴 재해석 금지)
- **변환**: `pnpm convert:pitch-art -- pets bbogeulseu`
- **최종 사용**: `뽀린걸 (bboringirl)` 전용 펫 `bbogeulseu`. 카탈로그 `exclusiveTo` 로 해당 캐릭터의 펫 탭에서만 노출

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: a small game mascot pet. Attached image 1 is the EXACT design of this pet: keep its shapes, proportions, colours, face and every detail identical; do not redesign, reinterpret, simplify into something else, or add or remove features. Re-draw it as a small game pet in the pixel art style of attached image 2.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly 384x341, one pet pose per cell, centred.
Columns (left to right, identical in every row): column 1 = idle frame A, column 2 = idle frame B (a tiny 2-pixel breathing bob or squash difference from A), column 3 = move frame A, column 4 = move frame B (a two-frame hop or waddle cycle; B is the opposite pose of A).
Rows (top to bottom): row 1 = FRONT view (facing the camera), row 2 = SIDE view (facing right), row 3 = BACK view (seen from behind).
For the BACK row, draw the back side of the same creature in a way that is consistent with attached image 1; do not invent new features.
Rules: the same pet, identical colours, proportions and pixel size in all 12 cells; the feet or the bottom of the body of every cell sit on a common baseline at about 80% of the cell height; the pet fills about 60-70% of the cell width; no ground shadow, no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; No text, no letters, no numbers, no logos anywhere in the image.
Attached image 2 is the approved pet sheet: use it for the grid layout, pose logic, pixel size, outline and palette treatment only, never for the design of the creature.
```

- [x] #I21 생성·저장 완료

## #I22 · 전용 펫 · 웅남이 (문모모 (doormomo) 전용)

- **저장 이름**: `tmp/pitch-src/pets/pet-ungnami.png` (1536×1024)
- **스레드**: ↪ **이어서** — `T-PCH-PET-EXC-3` (이 스레드의 첫 스텝은 #I19 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수 1** 사용자 제공 펫 레퍼런스 `tmp/pitch-src/refs/pet-ungnami-ref.png` — 디자인 기준
  - **필수 2** 승인본 `tmp/pitch-src/pets/pet-cheezenyang.png` (#I05) — 시트 그리드·포즈·스타일 기준(이 펫의 디자인은 복사하지 않음)
- **검수 체크**: 4열×3행 그리드 정확, 12칸 모두 같은 펫(색·비율·얼굴 일치), 앞/옆(오른쪽)/뒤 방향이 맞음, idle A/B·move A/B 가 확실히 다른 포즈, 발 기준선 일치, 접지 그림자·글자 없음, 마젠타/핑크 잔여 없음, **레퍼런스와 디자인이 동일**(형태·색·얼굴 재해석 금지)
- **변환**: `pnpm convert:pitch-art -- pets ungnami`
- **최종 사용**: `문모모 (doormomo)` 전용 펫 `ungnami`. 카탈로그 `exclusiveTo` 로 해당 캐릭터의 펫 탭에서만 노출

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: a small game mascot pet. Attached image 1 is the EXACT design of this pet: keep its shapes, proportions, colours, face and every detail identical; do not redesign, reinterpret, simplify into something else, or add or remove features. Re-draw it as a small game pet in the pixel art style of attached image 2.
Canvas: 1536x1024: a strict grid of 4 columns x 3 rows, every cell exactly 384x341, one pet pose per cell, centred.
Columns (left to right, identical in every row): column 1 = idle frame A, column 2 = idle frame B (a tiny 2-pixel breathing bob or squash difference from A), column 3 = move frame A, column 4 = move frame B (a two-frame hop or waddle cycle; B is the opposite pose of A).
Rows (top to bottom): row 1 = FRONT view (facing the camera), row 2 = SIDE view (facing right), row 3 = BACK view (seen from behind).
For the BACK row, draw the back side of the same creature in a way that is consistent with attached image 1; do not invent new features.
Rules: the same pet, identical colours, proportions and pixel size in all 12 cells; the feet or the bottom of the body of every cell sit on a common baseline at about 80% of the cell height; the pet fills about 60-70% of the cell width; no ground shadow, no cell borders, grid lines or labels; leave at least 10% empty margin inside every cell; No text, no letters, no numbers, no logos anywhere in the image.
Attached image 2 is the approved pet sheet: use it for the grid layout, pose logic, pixel size, outline and palette treatment only, never for the design of the creature.
```

- [x] #I22 생성·저장 완료

## #I23 · 인벤토리 창 프레임

- **저장 이름**: `tmp/pitch-src/ui/ui-inv-frame.png` (1536×1024 (3:2, 최종 720×480))
- **스레드**: 🆕 **새 스레드 시작** — `T-PCH-UI-INV` (인벤토리 UI 8장, 프레임이 스타일 앵커)
- **레퍼런스 첨부**:
  - **필수** 기존 승인본 `tmp/pitch-src/ui/terminal-frame.png` — 프레임 외곽선·금색/민트 팔레트·픽셀 크기
  - **필수** 기존 승인본 `tmp/pitch-src/ui/detail-panel.png` — 패널 안쪽 질감·두께
- **검수 체크**: 정확히 3:2, 창이 캔버스를 가득 채움, 좌(좁음)/우(넓음) 패널이 지정 비율 위치, 패널 안이 완전히 비어 있음(슬롯·버튼·캐릭터·글자 없음), 프레임 좌우상하 대칭, 마젠타 잔여 없음
- **변환**: `pnpm convert:pitch-art -- ui inv-frame`
- **최종 사용**: `InventoryScene` 배경(720×480, 창 위치 (120,30)). 패널 좌표는 `13-locker-inventory-spec.md` §5 의 레이아웃 표를 따른다

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: the full window frame of a locker-cabinet inventory screen for a football arcade game, seen straight-on. A chunky navy window with a gold (#ffd23f) frame and a thin mint trim, a slim title bar along the top (empty, no text), two large recessed dark-navy panels below it: a NARROW LEFT panel (a display area for a character preview) and a WIDER RIGHT panel (an item list area), with a slim empty bottom bar under both panels for buttons. The interiors of both panels are flat dark navy with a very subtle pixel texture, completely EMPTY, no slots, no buttons, no icons, no characters. Small rivets or corner brackets on the frame corners, a subtle locker-door slot pattern (thin vertical vent lines) only on the title bar.
Canvas: 1536x1024 (exact 3:2). The window fills the WHOLE canvas edge to edge (the outer frame touches all four canvas edges). Layout in canvas fractions: title bar = top 10%; left panel = x 2.2% to 37.8%, y 11.7% to 85%; right panel = x 40% to 97.8%, y 11.7% to 85%; bottom bar = y 86.7% to 98%.
Rules: perfectly symmetric outer frame, thick enough (about 3% of the width) to be used as a 9-slice, flat empty panel interiors, no shadows outside the frame, no cell borders or grid lines inside the panels.
No text, no letters, no numbers, no logos anywhere in the image. All UI is delivered WITHOUT any lettering; text is drawn later by the game.
Use the attached image(s) as the style reference for pixel size, outline, palette and lighting (they show the SAME game), but do not copy their subject unless the description says so.
```

- [x] #I23 생성·저장 완료

## #I24 · 미리보기 무대 (스포트라이트 바닥)

- **저장 이름**: `tmp/pitch-src/ui/ui-inv-preview-stage.png` (1024×1536 (상단 1024×1408 = 8:11 영역 사용, 최종 256×352))
- **스레드**: ↪ **이어서** — `T-PCH-UI-INV` (이 스레드의 첫 스텝은 #I23 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/ui/ui-inv-frame.png` (#I23) — 인벤토리 UI 스타일 앵커
- **검수 체크**: 상단 8:11 영역만 사용, 하단 128px 비어 있음, 연단이 하단 3분의 1 중앙에 있고 캐릭터가 서기 좋은 평평한 타원, 스포트라이트가 가운데를 비춤, 캐릭터·글자 없음
- **변환**: `pnpm convert:pitch-art -- ui inv-preview-stage`
- **최종 사용**: 미리보기 캐릭터 뒤 배경. 연단 중심 좌표가 캐릭터 발 위치(스펙 §5)

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: a character display stage for the left panel of the inventory: a dark navy back wall with faint vertical locker-door lines, a round raised podium floor in the lower third with a mint rim and a soft cool-white spotlight cone falling from the top centre onto the podium, tiny floating sparkle pixels near the podium, no character on it.
Canvas: 1024x1536. The stage art fills the full width and ONLY the top 1408 px (aspect exactly 8:11); the bottom 128 px of the canvas stays completely empty/transparent. The podium centre is at 50% width and 76% of the 1408 px height.
Rules: the podium top surface is a flat ellipse where a character can stand; the stage art has its own opaque dark background (it fills its whole area, no transparency inside), no text, no character, no props.
No text, no letters, no numbers, no logos anywhere in the image. All UI is delivered WITHOUT any lettering; text is drawn later by the game.
Use the attached image(s) as the style reference for pixel size, outline, palette and lighting (they show the SAME game), but do not copy their subject unless the description says so.
```

- [x] #I24 생성·저장 완료

## #I25 · 탭 버튼 4종 × 3상태

- **저장 이름**: `tmp/pitch-src/ui/ui-inv-tabs.png` (1536×1024 (상단 1536×432 사용, 최종 96×36 ×12))
- **스레드**: ↪ **이어서** — `T-PCH-UI-INV` (이 스레드의 첫 스텝은 #I23 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/ui/ui-inv-frame.png` (#I23) — 인벤토리 UI 스타일 앵커
- **검수 체크**: 상단 1536×432 안에 4열×3행, 12칸 모두 같은 판 모양, 아이콘 4종이 열마다 일치, 상태(normal/hover/active)가 행으로 구분됨, 오른쪽 60%는 비어 있음, 글자 없음
- **변환**: `pnpm convert:pitch-art -- ui inv-tabs`
- **최종 사용**: 탭 4개 (모자/얼굴/등/펫). 라벨은 캔버스 텍스트

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: category tab plates for the inventory, four categories in four columns: (1) HAT tab with a small pixel cap icon on the left of the plate, (2) FACE tab with a small pixel glasses icon, (3) BACK tab with a small pixel cape/wings icon, (4) PET tab with a small pixel paw print icon. Rows are states: row 1 = NORMAL (dark navy plate, mint outline), row 2 = HOVER (slightly brighter plate, gold outline), row 3 = ACTIVE/SELECTED (bright gold-lit plate that looks joined to the panel below, mint icon glow limited to inside the outline). The right 60% of every plate is left flat EMPTY for a text label added later.
Canvas: 1536x1024, but the grid occupies ONLY the top 1536x432: 4 columns x 3 rows, every cell exactly 384x144, one plate per cell filling about 92% of the cell width; the remaining canvas below y=432 stays completely empty/transparent.
Rules: all 12 plates have the identical outline shape and size; icons are simple and readable at 20x20 px; no lettering.
No text, no letters, no numbers, no logos anywhere in the image. All UI is delivered WITHOUT any lettering; text is drawn later by the game.
Use the attached image(s) as the style reference for pixel size, outline, palette and lighting (they show the SAME game), but do not copy their subject unless the description says so.
```

- [x] #I25 생성·저장 완료

## #I26 · 아이템 슬롯 5상태

- **저장 이름**: `tmp/pitch-src/ui/ui-inv-slot.png` (1536×1024 (3×2 그리드, 셀 512×512 → 최종 64×64))
- **스레드**: ↪ **이어서** — `T-PCH-UI-INV` (이 스레드의 첫 스텝은 #I23 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/ui/ui-inv-frame.png` (#I23) — 인벤토리 UI 스타일 앵커
- **검수 체크**: 3×2 그리드, 5개 상태가 순서대로, 6번째 칸 비어 있음, 타일이 모두 같은 크기의 정사각형, 중앙이 비어 있음, 글자·아이콘 없음
- **변환**: `pnpm convert:pitch-art -- ui inv-slot`
- **최종 사용**: 아이템 그리드 슬롯 (4×3, 64×64)

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: an inventory item slot tile (a square recessed dark-navy tile with a thin mint outline and slightly bevelled corners) drawn in five states, all with an EMPTY centre for an item icon: (1) NORMAL, (2) HOVER (brighter outline, faint lighter fill), (3) SELECTED (thick gold outline with small gold corner brackets), (4) EQUIPPED (mint outline with a mint corner ribbon in the top-left, no lettering), (5) EMPTY/NONE (dashed-look dim outline, darker fill).
Canvas: 1536x1024: a strict grid of 3 columns x 2 rows, every cell exactly 512x512, states in reading order (NORMAL, HOVER, SELECTED / EQUIPPED, EMPTY, and the sixth cell left completely empty). Each tile fills about 92% of its cell and is a perfect square.
Rules: all tiles have exactly the same size and outline thickness; the tile centre area (about 70%) is flat and empty; no icons, no text.
No text, no letters, no numbers, no logos anywhere in the image. All UI is delivered WITHOUT any lettering; text is drawn later by the game.
Use the attached image(s) as the style reference for pixel size, outline, palette and lighting (they show the SAME game), but do not copy their subject unless the description says so.
```

- [x] #I26 생성·저장 완료

## #I27 · 버튼 판 3상태 + 화살표 원형 버튼

- **저장 이름**: `tmp/pitch-src/ui/ui-inv-btn.png` (1536×1024 (상단 밴드 사용, 판 최종 96×36, 원형 28×28))
- **스레드**: ↪ **이어서** — `T-PCH-UI-INV` (이 스레드의 첫 스텝은 #I23 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/ui/ui-inv-frame.png` (#I23) — 인벤토리 UI 스타일 앵커
  - 선택 기존 `tmp/pitch-src/ui/ui-buttons.png` — 게임 전반 버튼 톤
- **검수 체크**: 밴드 A 3칸(512×192)·밴드 B 6칸(256×256) 위치 정확, 판 3상태 구분, 화살표 좌/우 × 3상태 순서, 판 중앙 비어 있음, 글자 없음
- **변환**: `pnpm convert:pitch-art -- ui inv-btn`
- **최종 사용**: [적용][해제][전체 해제][닫기] 버튼 (텍스트는 캔버스), 방향 회전 ◀▶·페이지 넘김 ◀▶

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: row A: one rectangular action button plate (dark navy fill, gold outline, chunky bevel) in three states: NORMAL, HOVER (brighter with a mint top highlight), PRESSED (darker, shifted 2 px down); the centre of the plate is EMPTY for a text label. Row B: six small round buttons: a LEFT arrow and a RIGHT arrow (chunky pixel triangles), each in NORMAL, HOVER and PRESSED states.
Canvas: 1536x1024 with two bands: band A = y 0 to 192: 3 cells side by side, each exactly 512x192, one plate per cell filling about 92% of the cell width; band B = y 192 to 448: 6 cells side by side, each exactly 256x256, order LEFT-normal, LEFT-hover, LEFT-pressed, RIGHT-normal, RIGHT-hover, RIGHT-pressed, each circle filling about 88% of its cell; everything below y=448 stays empty/transparent.
Rules: same outline thickness and palette as the approved frame; no lettering on any button.
No text, no letters, no numbers, no logos anywhere in the image. All UI is delivered WITHOUT any lettering; text is drawn later by the game.
Use the attached image(s) as the style reference for pixel size, outline, palette and lighting (they show the SAME game), but do not copy their subject unless the description says so.
```

- [x] #I27 생성·저장 완료

## #I28 · 정보 카드 판 (9-slice)

- **저장 이름**: `tmp/pitch-src/ui/ui-inv-infocard.png` (1024×1024 (정사각형 9-slice, 가로세로 늘려 사용))
- **스레드**: ↪ **이어서** — `T-PCH-UI-INV` (이 스레드의 첫 스텝은 #I23 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/ui/ui-inv-frame.png` (#I23) — 인벤토리 UI 스타일 앵커
- **검수 체크**: 정사각형, 좌우 대칭, 장식이 바깥 14% 안에만 있음(9-slice 가능), 가운데가 평평하고 비어 있음, 글자 없음
- **변환**: `pnpm convert:pitch-art -- ui inv-infocard`
- **최종 사용**: 아이템 선택 시 이름·슬롯·전용 배지를 보여주는 카드. 9-slice 인셋 ≈ 12px(구현 시 확정)

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: an item information card plate: a dark-navy rounded-rectangle panel with a mint outline and gold corner brackets, a slightly lighter header band along the top (empty) and a flat empty body area, matching the approved window frame style.
Canvas: 1024x1024 square. The plate fills about 96% of the canvas. All decorative details (corner brackets, outline, header band) stay within the outer 14% of each side so the flat centre can be stretched.
Rules: perfectly symmetric left/right, flat and empty centre, no text, no icons.
No text, no letters, no numbers, no logos anywhere in the image. All UI is delivered WITHOUT any lettering; text is drawn later by the game.
Use the attached image(s) as the style reference for pixel size, outline, palette and lighting (they show the SAME game), but do not copy their subject unless the description says so.
```

- [x] #I28 생성·저장 완료

## #I29 · 배지 4종 (착용중·전용·NEW·잠금)

- **저장 이름**: `tmp/pitch-src/ui/ui-inv-badges.png` (1024×1024 (상단 밴드 사용, 최종 16×16 ×4))
- **스레드**: ↪ **이어서** — `T-PCH-UI-INV` (이 스레드의 첫 스텝은 #I23 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/ui/ui-inv-frame.png` (#I23) — 인벤토리 UI 스타일 앵커
- **검수 체크**: 상단 밴드 4칸(256×256), 배지 4종이 순서대로, 16px 크기에서도 읽힐 만큼 단순함, 글자·숫자 없음
- **변환**: `pnpm convert:pitch-art -- ui inv-badges`
- **최종 사용**: 슬롯 모서리 배지(착용중 ✔·전용 ★). NEW·잠금은 v1 미사용 예약

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: four tiny slot badges: (1) EQUIPPED: a mint circle with a white check mark, (2) EXCLUSIVE: a gold five-point star on a navy circle, (3) NEW: a coral-red (#ff4d6d) diamond with a white exclamation-like sparkle (no letters), (4) LOCKED: a grey padlock on a navy circle.
Canvas: 1024x1024, but only the top band y 0 to 256 is used: 4 cells side by side, each exactly 256x256, one badge per cell filling about 80% of the cell; everything below y=256 stays empty/transparent.
Rules: each badge is readable at 16x16 px, uses a thick navy outline, and contains no text or numerals.
No text, no letters, no numbers, no logos anywhere in the image. All UI is delivered WITHOUT any lettering; text is drawn later by the game.
Use the attached image(s) as the style reference for pixel size, outline, palette and lighting (they show the SAME game), but do not copy their subject unless the description says so.
```

- [x] #I29 생성·저장 완료

## #I30 · 착용 이펙트 스파클 6프레임

- **저장 이름**: `tmp/pitch-src/fx/fx-equip-sparkle.png` (1536×1024 (3×2 그리드, 셀 512×512 → 최종 64×64))
- **스레드**: ↪ **이어서** — `T-PCH-UI-INV` (이 스레드의 첫 스텝은 #I23 — 그 스텝을 만든 대화)
- **레퍼런스 첨부**:
  - **필수** 승인본 `tmp/pitch-src/ui/ui-inv-frame.png` (#I23) — 인벤토리 UI 스타일 앵커
- **검수 체크**: 3×2 그리드 6프레임이 순서대로 커졌다 사라짐, 셀 중앙 정렬, 3번째가 최대 크기, 후광·글자 없음
- **변환**: `pnpm convert:pitch-art -- fx equip-sparkle`
- **최종 사용**: 아이템 착용·펫 변경 시 미리보기 캐릭터 위에 재생(fx 그룹). 기존 `fx-*` 와 같은 톤

**프롬프트**

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks, a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: the background MUST be fully transparent: a real PNG alpha channel with alpha 0 on every pixel outside the artwork. Do NOT render a white, black, grey, coloured, gradient or checkerboard background, and no scene, floor, wall, vignette or shadow behind the subject. Surfaces that the Subject explicitly describes as part of the artwork (for example a panel interior) stay opaque. Only if transparency is truly impossible, use a perfectly flat solid #FF00FF magenta background with no shadow, floor, gradient or border. No magenta or hot pink anywhere on the subject (use coral red #ff4d6d instead).
Subject: a six-frame equip sparkle effect, in reading order: (1) a small white-gold star flash, (2) the flash growing with four tiny stars around it, (3) a ring of gold and mint sparkles at maximum size, (4) the ring expanding and thinning, (5) a few scattered fading sparkle pixels, (6) two last tiny pixels. The effect is centred in each cell and radially symmetric.
Canvas: 1536x1024: a strict grid of 3 columns x 2 rows, every cell exactly 512x512, one frame per cell, the effect centred; peak size (frame 3) fills about 85% of the cell.
Rules: pure effect, no character, no item, no text; no glow halo (hard-edged pixels only, gold #ffd23f, mint #2ee8b6, white).
No text, no letters, no numbers, no logos anywhere in the image. All UI is delivered WITHOUT any lettering; text is drawn later by the game.
Use the attached image(s) as the style reference for pixel size, outline, palette and lighting (they show the SAME game), but do not copy their subject unless the description says so.
```

- [x] #I30 생성·저장 완료
