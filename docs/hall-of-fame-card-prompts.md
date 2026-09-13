# 명예의 전당 트로피 카드 — 이미지 생성 프롬프트 레퍼런스

`src/web/hall-of-fame/`에 구현된 "명예의 전당"(업적) 모달의 트로피 카드 아트 생성용 프롬프트 모음. TOTY 3D 카드(`docs/toty-card-prompts.md`)와는 완전히 다른 재질 언어를 쓴다 — 캐릭터 일러스트가 아니라 **금속 명판/훈장(medallion) 아트**를 카테고리당 생성하고, 수상자 아바타는 런타임에 그 위에 합성한다.

## 디자인 방향 (중요)

TOTY 카드와 겹치지 않도록 의도적으로 다른 실루엣/재질을 쓴다:

| | TOTY 선수 카드 | 명예의 전당 트로피 카드 |
|---|---|---|
| 형태 | 세로형 트레이딩카드 | 원형 메달/명판 |
| 재질 | 판타지 일러스트, 캐릭터 초상 | 브러시드 메탈 + 에나멜 인레이, 조각(engraving) |
| 인물 | 스트리머별 전신 캐릭터 아트 | 원형 인셋에 기존 아바타 사진 합성 (캐릭터 아트 없음) |
| 생성량 | 스트리머당 여러 장 | **카테고리당 최대 4장** (메달 + 메달 빛 효과 + 배경 + 배경 빛 효과, 메달 외엔 전부 선택) |

모든 카테고리가 "같은 세트"로 보이도록 실루엣(원형 명판 + 로럴 테두리)은 통일하고, 중앙 모티프와 에나멜 컬러만 카테고리마다 다르게 한다.

## 레이어 구성

카테고리 하나당 최대 4개 레이어(전부 `src/web/hall-of-fame/hallOfFameArt.ts`가 자동 스캔):

| 레이어 | 파일명 | 상태 | 용도 |
|---|---|---|---|
| 메달 | `<id>-emblem.webp` | **완료 (6/6)** | 카드 원판 아트. 없으면 `FifaShield` SVG로 폴백. |
| 메달 빛 효과 | `<id>-emblem-glow.webp` | 미구현 (선택) | 메달 위에 얹혀 마우스와 무관하게 계속 반짝이는 파티클/빛. |
| 섹션 배경 | `<id>-backdrop.webp` | 미구현 (선택) | 모달 안 그 카테고리 헤딩+카드 그리드 전체에 깔리는 무드 배경. |
| 섹션 배경 빛 효과 | `<id>-backdrop-glow.webp` | 미구현 (선택) | 섹션 배경 위에 겹쳐서 계속 드리프트하는 빛/파티클 오버레이. |

메달을 제외한 3개는 전부 선택 사항 — 없어도 정상 동작하고(메달 빛 효과/배경 빛 효과는 렌더 자체가 스킵되고, 배경은 기존 플레인 그라데이션이 유지됨), 나중에 하나씩 추가해도 즉시 반영됨.

## 공통 작업 방식

1. **레퍼런스 이미지**: 이미 완성된 메달 6장(`src/web/assets/hall-of-fame/`) 중 하나를 "같은 세트의 실루엣/재질 레퍼런스"로 첨부하면 신규 레이어들의 톤이 기존 메달과 잘 어울림.
2. **파일명 규칙**: 아래 표의 `id` 컬럼 + 레이어별 접미사(`-emblem.webp`, `-emblem-glow.webp`, `-backdrop.webp`, `-backdrop-glow.webp`). `id`는 `src/shared/trophy.ts`의 `TrophyBadge["key"]`와 동일한 문자열.
3. **변환**: PNG로 받으면 `public/test/`에 파트 이름 그대로(`emblem.png` / `emblem-glow.png` / `backdrop.png` / `backdrop-glow.png`) 저장 후:
   ```bash
   pnpm convert:hof-art -- <category> <PNG가 들어있는 폴더 경로>
   ```
   예: "최고 승률"의 배경+배경 빛 효과 2장을 `public/test/`에 `backdrop.png`/`backdrop-glow.png`로 받아뒀다면 `pnpm convert:hof-art -- best-win-rate`. 같은 폴더에 이미 만든 `emblem.png`이 없어도(그 파트만 "not found" 경고를 찍고) 나머지는 정상 변환됨.
4. **금/은/동 등급**: `division-one`은 메달 1장만 있고, 금·은·동 구분은 `src/web/hall-of-fame/hallOfFameTheme.ts`의 `tierTint()`가 CSS로 파생함 (별도 이미지 3장 불필요).

## 카테고리별 세트 (6개)

| # | 카테고리 | id (파일명 접두사) | 모티프 | 에나멜 컬러 |
|---|----------|---------------------|--------|-------------|
| 1 | 1부 리그 달성 🥇🥈🥉 | `division-one` | 로럴로 감싼 방패 위에 떠오르는 별 하나 | 골드 톤 메탈 |
| 2 | 최다 경기 출전 ⚔️ | `most-matches` | 메달 뒤로 교차된 두 검 | 건메탈 + 딥 레드 |
| 3 | 최고 승률 👑 | `best-win-rate` | 메달 위에 얹힌 작은 왕관 | 로열 퍼플 + 골드 트림 |
| 4 | 하루 급성장 🚀 | `daily-promotion` | 메달을 가로지르는 로켓/코멧 궤적 | 시안 → 오렌지 그래디언트 |
| 5 | 자기 PR 왕 📣 | `self-promotion` | 메가폰 + 사운드웨이브/별 폭발 | 마젠타 + 골드 트림 |
| 6 | 노력왕 🔥 | `hard-worker` | 불꽃 아래 교차된 망치와 모루 | 앰버 오렌지 + 다크 차콜 |

## 1. 메달 (완료 — 참고용으로 남겨둠)

- **캔버스**: 정사각형 1000×1000px, 알파 채널 있는 투명 PNG.
- **공통 스타일 지시문**:
  ```
  Photoreal 3D-rendered esports achievement medallion, circular rounded
  plaque, brushed metal base with fine engraved border ornamentation,
  subtle laurel leaf motifs along the rim, colored enamel inlay accent,
  dramatic studio rim lighting, high detail, clean transparent background
  (alpha PNG), no text, no characters, no people, no photograph, square
  canvas, 1000x1000.
  ```

| 카테고리 | 프롬프트 |
|---|---|
| `division-one-emblem.webp` | `...laurel-wreathed shield emblem with a single ascending star at its center, warm gold-toned brushed metal, soft upward light beam behind the star...` |
| `most-matches-emblem.webp` | `...two crossed swords behind the medallion, gunmetal-grey brushed metal base, deep red enamel accent line along the rim...` |
| `best-win-rate-emblem.webp` | `...a small ornate crown resting atop the medallion, royal purple enamel inlay with gold trim...` |
| `daily-promotion-emblem.webp` | `...a rocket trail arcing across the medallion like a comet, cyan-to-orange gradient enamel, small spark particles trailing behind it...` |
| `self-promotion-emblem.webp` | `...a megaphone emblem at the center with radiating soundwave / starburst lines, magenta enamel inlay with gold trim...` |
| `hard-worker-emblem.webp` | `...crossed hammer and anvil beneath a small flame, ember-orange enamel inlay with a dark charcoal metal base...` |

## 2. 메달 빛 효과 오버레이 (미구현 — 선택)

지금 메달은 정적 이미지라 호버하지 않는 동안은 가만히 있음 — 그 위에 겹쳐서 CSS로 계속 은은하게 반짝이는(트윙클 + 드리프트) "빛 효과만 있는" 투명 오버레이. 캐릭터/아바타를 가리면 안 되므로 **중앙(아바타 위치)은 비우고 테두리 쪽 위주로** 입자를 배치.

- **캔버스**: 1000×1000px (메달과 동일 비율), 알파 채널 있는 투명 PNG — 반짝이는 입자/빛만 그리고 나머지는 전부 투명.
- **레퍼런스**: 해당 카테고리의 완성된 메달(`<id>-emblem.webp`)을 "이 색·모티프에 맞춰 반짝임만 그려줘" 참고용으로 첨부.
- **공통 스타일 지시문**:
  ```
  Transparent overlay of glowing light particles and sparkles only, matching
  the enamel color of the referenced medallion, small and sparse, arranged
  around the outer rim — leave the center circle (where a portrait sits)
  completely empty, no shapes, no text, alpha PNG, square canvas, 1000x1000.
  ```

| 카테고리 | 프롬프트 |
|---|---|
| `division-one-emblem-glow.webp` | `...soft golden star-dust motes drifting near the rim, warm gold sparkle...` |
| `most-matches-emblem-glow.webp` | `...small red ember sparks along the rim, faint steel-grey glints...` |
| `best-win-rate-emblem-glow.webp` | `...tiny violet-and-gold sparkles drifting near the rim, regal shimmer...` |
| `daily-promotion-emblem-glow.webp` | `...cyan-to-orange spark trail wisps near the rim, comet-dust motes...` |
| `self-promotion-emblem-glow.webp` | `...magenta-and-gold starburst sparkle motes near the rim...` |
| `hard-worker-emblem-glow.webp` | `...small ember/cinder particles drifting near the rim, warm orange glow...` |

## 3. 섹션 배경 (미구현 — 선택)

모달을 열었을 때 각 카테고리(1부 리그 달성/최다 경기 출전/…) 헤딩과 카드 그리드 전체에 깔리는 무드 배경 — 그 카테고리 메달의 분위기를 넓은 화면으로 확장한 "무대" 느낌. 카드가 배경 위에 얹히므로 **저채도·저대비**를 유지해서 메달/아바타가 잘 보이게 하고, 위에 어두운 스크림(비네트)이 자동으로 덧씌워지므로 배경 자체는 다소 밝게 만들어도 됨.

- **캔버스**: 1600×900px 이상 와이드, PNG 또는 JPG (투명 불필요, 이후 webp로 변환).
- **레퍼런스**: 해당 카테고리의 메달을 "이 모티프/컬러를 넓은 환경 샷으로 확장" 참고용으로 첨부.
- **공통 스타일 지시문**:
  ```
  Wide cinematic atmospheric backdrop matching the mood and color of the
  referenced medallion — soft depth-of-field, dark moody studio environment
  with a faint spotlight glow, low contrast, no readable shapes, no text, no
  people, no logos. Wide aspect ratio, 1600x900 or larger.
  ```

| 카테고리 | 프롬프트 |
|---|---|
| `division-one-backdrop.webp` | `...deep navy-to-black gradient with warm golden light rays sweeping down from above, faint floating dust motes...` |
| `most-matches-backdrop.webp` | `...dark battlefield haze, gunmetal fog with faint red battle-torch glow on the horizon...` |
| `best-win-rate-backdrop.webp` | `...regal royal-purple velvet gradient with soft golden light pooling at the center...` |
| `daily-promotion-backdrop.webp` | `...deep space gradient with a faint cyan-to-orange comet streak arcing across the distance, scattered stars...` |
| `self-promotion-backdrop.webp` | `...dark stage gradient with a soft magenta spotlight beam and faint gold confetti dust drifting...` |
| `hard-worker-backdrop.webp` | `...dark blacksmith forge atmosphere, warm ember-orange glow rising from below, faint smoke haze...` |

## 4. 섹션 배경 빛 효과 오버레이 (미구현 — 선택)

배경 이미지를 다시 만들지 않고, 그 위에 겹쳐서 CSS로 계속 드리프트/펄스하는 "빛 효과만 있는" 투명 오버레이 — 모달을 열자마자 그 카테고리만의 분위기가 살아있게 움직이게 함.

- **캔버스**: 배경과 동일 비율(1600×900 이상), 알파 채널 있는 투명 PNG.
- **레퍼런스**: 불필요 (섹션 배경 프롬프트에 이미 쓴 설명 재사용).
- **공통 스타일 지시문**:
  ```
  Transparent overlay of drifting light particles / glow only, matching the
  mood described for the section backdrop, sparse and soft, no shapes, no
  text, alpha PNG, same wide aspect ratio as the backdrop.
  ```

| 카테고리 | 프롬프트 |
|---|---|
| `division-one-backdrop-glow.webp` | `...slow-drifting golden light rays and faint sparkle dust...` |
| `most-matches-backdrop-glow.webp` | `...faint drifting embers and red torch-light flicker...` |
| `best-win-rate-backdrop-glow.webp` | `...slow-drifting violet-gold sparkle dust...` |
| `daily-promotion-backdrop-glow.webp` | `...slow-drifting star-dust and a faint comet-trail shimmer...` |
| `self-promotion-backdrop-glow.webp` | `...drifting magenta-gold confetti sparkle...` |
| `hard-worker-backdrop-glow.webp` | `...drifting ember sparks and faint smoke wisps...` |
