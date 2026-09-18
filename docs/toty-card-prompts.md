# TOTY 3D 카드 — 이미지 생성 프롬프트 레퍼런스

`src/web/toty-card/`에 구현된 "3D 카드 보기" 팝업에 쓰이는 카드 아트 생성용 프롬프트 모음. 한 명씩 이미지를 만들 때마다 이 문서의 해당 섹션을 참고해서 생성 → 파일명 규칙대로 저장 → 변환 스크립트 실행 순으로 진행하면 됨.

## 디자인 방향 (중요)

**테두리(프레임) 모양은 전부 하치 카드와 동일한 방패형 실루엣을 유지**하되(카드 안쪽 창 위치가 하치와 같아야 CSS 틸트/패럴랙스 레이아웃이 그대로 재사용됨), **테두리에 박힌 장식과 배경 재질은 선수마다 완전히 다른 모티프**로 감. 즉 "크리스탈을 색만 바꾼 버전"이 아니라 "같은 방패 틀 안에 서로 다른 소재(용암/식물/룬문양/기계 회로/유리별/구름/등나무꽃/벚꽃/심해생물/서리)가 들어간 카드 시리즈"임. 아래 표의 "모티프" 컬럼 참고.

## 공통 작업 방식

1. **캔버스**: 프레임/배경/캐릭터 전부 **1060×1484px** (5:7, 하치 카드와 동일 비율), 알파 채널 있는 투명 PNG로 생성.
   - 사용하는 생성 도구가 진짜 투명 배경(RGBA)을 지원하는지 먼저 확인 (예: ChatGPT 이미지 생성에 "배경 투명"을 명시, Adobe Firefly/Recraft의 투명 배경 옵션 등). 지원 안 하면 순수 그린/마젠타 배경으로 생성 후 배경 제거 도구로 따로 제거.
   - 생성 후 어두운 배경이나 체크무늬 배경에 올려서 가장자리에 원래 배경색 잔여 테두리(halo)가 없는지 꼭 확인.
2. **레퍼런스 이미지 첨부**: 프레임은 하치 프레임(`src/web/assets/toty-cards/hachi97-frame.webp`)을 **구조/실루엣 레퍼런스로만** 첨부 (장식·소재는 아래 프롬프트대로 완전히 다르게). 배경은 소재 자체가 다르므로 레퍼런스 없이 프롬프트만으로 생성해도 됨(원하면 하치 배경을 "구도" 참고용으로만 첨부). 캐릭터는 해당 스트리머의 실제 사진을 레퍼런스로 첨부.
3. **파일명 규칙**: `<id>-frame.webp`, `<id>-background.webp`, `<id>-character.webp` (아래 표의 `id` 컬럼 사용). PNG로 받으면 아래 명령으로 변환·이동:
   ```bash
   pnpm convert:card-art -- <id> <PNG가 들어있는 폴더 경로>
   ```
   예: `다시바` 3장을 `public/test/`에 `frame.png`/`background.png`/`character.png`로 받아뒀다면 `pnpm convert:card-art -- tdnlamuron`.
4. 3장(frame/background/character)이 모두 갖춰진 선수만 사이트에 "3D 카드 보기" 버튼이 자동으로 뜸 (`src/web/toty-card/totyCardAssets.ts`가 `src/web/assets/toty-cards/`를 자동 스캔).
5. **포지션/디비전/이름 글자색**은 이미지와 별개로 `src/web/toty-card/totyCardTheme.ts`에 선수 `id`별로 지정되어 있음. 새 선수를 추가하면 이 파일에 `{ color, glow }` 항목을 하나 추가해서 그 선수 카드 팔레트에 어울리는 색으로 맞춰야 함 (안 넣으면 하치 금색으로 기본 표시됨). `color`는 본문 글자색, `glow`는 카드 호버 시 이름 주변에 번지는 은은한 하이라이트 색.
6. **(선택) 움짤 다운로드용 애니메이션 WebP**: 팝업의 "움짤로 저장" 버튼은 `<id>-preview.webp`가 있을 때만 뜸. 3장 이미지 다 넣은 뒤 `pnpm dev`를 켜둔 상태에서:
   ```bash
   pnpm generate:toty-preview -- <id>
   ```
   를 실행하면 실제 카드를 헤드리스 브라우저로 열어 가상 마우스 경로로 훑으면서 프레임을 캡처하고, 투명 배경 애니메이션 WebP로 합쳐서 `src/web/assets/toty-cards/<id>-preview.webp`에 저장함(브라우저에서 실시간으로 만드는 게 아니라 미리 만들어두는 방식). Playwright 크로미움이 없으면 최초 1회 `npx playwright install chromium` 필요.

## 공용 팝업 배경 이미지 (완료 — 1장, 폴백용)

3D 카드 팝업을 열었을 때 카드 뒤에 깔리는 전체화면 배경. `src/web/assets/toty-cards/popup-backdrop.webp`로 이미 추가됨. **아래 "스트리머별 팝업 배경" 섹션에서 그 선수 전용 배경(`<id>-popup-backdrop.webp`)이 없을 때만 쓰이는 폴백**임 — `getPopupBackdropUrl(streamerId)`가 전용 배경을 먼저 찾고, 없으면 이 공용 이미지로 떨어짐.

- **캔버스**: 2560×1440px, PNG 또는 JPG (투명 불필요, 이후 webp로 변환)
- **프롬프트**:
  ```
  A premium dark studio showcase backdrop for a trading-card reveal screen.
  Deep navy-to-black radial gradient, a soft faint spotlight glow centered in
  the frame, fine floating dust and bokeh light particles drifting in the air,
  subtle out-of-focus stadium light beams crossing diagonally in the distant
  background. Low contrast, desaturated, moody and cinematic — neutral enough
  that any brightly colored object placed in front of it (gold, pink, emerald
  green, sky blue) will stand out clearly. No text, no logos, no people, no
  readable shapes. Ultra-wide, minimal, elegant, 4K, 2560x1440.
  ```

## 스트리머별 팝업 배경 (선수별로 각각 생성 — 미구현)

공용 팝업 배경 대신, 그 선수 카드의 모티프에 맞춘 전용 팝업 배경. 카드 자체(배경 반짝임 오버레이)와 같은 이유로 **정적인 배경 이미지 한 장이 아니라 "빛 효과 없는 배경" + "빛 효과만 있는 투명 오버레이"를 따로 만들어서 CSS로 합성** — 오버레이는 마우스와 무관하게 항상 느리게 드리프트/펄스해서 팝업을 열자마자 그 선수만의 분위기가 살아있게 움직임. 아래 선수별 세트 섹션마다 **팝업 배경**/**팝업 배경 빛 효과** 프롬프트가 같이 있음.

- **캔버스**: 2560×1440px, PNG 또는 JPG (투명 불필요, 이후 webp로 변환) — 단, 빛 효과 레이어는 알파 채널 있는 투명 PNG
- **레퍼런스**: 불필요 (카드 프레임/캐릭터와 다른 넓은 환경 샷이라 참고 이미지 없이 프롬프트만으로 생성)
- **파일명**: `<id>-popup-backdrop.webp` (배경), `<id>-popup-backdrop-glow.webp` (빛 효과, 둘 다 `totyCardAssets.ts`가 자동 스캔 — 둘 다 없으면 공용 배경으로 폴백, 배경만 있고 빛 효과가 없어도 정상 동작)
- **적용 방식**: `TotyCardPopup.tsx`에서 배경은 팝업의 `background-image`로, 빛 효과는 그 위·스크림(어둡게 깔리는 비네트) 아래에 별도 레이어로 얹혀서 어두운 톤은 유지한 채로 반짝임만 살아있게 함.
- **주의**: 카드가 배경 위에 얹히므로(카드 뒤 전체화면), 배경/빛 효과 모두 카드가 잘 보이도록 **저채도·저대비의 무드있는 톤**을 유지하고 화면 중앙에 지나치게 밝은 요소를 두지 말 것 (공용 배경 프롬프트의 "neutral enough that any brightly colored object... will stand out clearly" 원칙 그대로 적용).

## 카드 뒷면 (선수별로 각각 생성 — 미구현)

팝업이 열리면 카드가 "팩 오프닝"처럼 미스터리 뒷면 → 실제 앞면으로 뒤집히는 리빌 연출(`TotyCardReveal.tsx`)에 쓰이는 카드 뒷면 이미지. **프레임/배경/캐릭터처럼 선수마다 따로 생성** — 그 선수 카드의 모티프/컬러를 그대로 살린 "봉인된 상태"의 뒷면이 되도록. 아래 선수별 세트 섹션마다 **뒷면** 프롬프트가 같이 있음.

- **캔버스**: 1060×1484px (다른 3장과 동일 비율), 알파 채널 있는 투명 PNG
- **레퍼런스**: 하치 프레임 이미지를 실루엣 참고용으로만 첨부 (프레임과 동일한 방식)
- **파일명**: `<id>-card-back.webp` (`totyCardAssets.ts`가 자동 스캔 — 없어도 다른 3장만으로 카드는 정상 동작하고, 리빌 연출은 플레이스홀더 "?"로 대체됨)

## 배경 반짝임 오버레이 (선수별로 각각 생성 — 미구현)

지금 배경(`<id>-background.webp`)은 정적 이미지라 카드가 심심해 보이는 문제 — **기존 배경은 그대로 두고**, 그 위에 겹쳐서 CSS로 계속 은은하게 움직이는(느린 드리프트 + opacity 펄스) "빛 효과만 있는" 투명 오버레이 레이어를 선수마다 추가함. 배경 자체를 다시 만들지 않는 이유: 이미 확정된 10장+보너스 배경을 전부 재생성하면 작업량이 두 배가 되고, 오버레이를 옅고 성기게 만들면 기존 배경에 박힌 빛 효과와 겹쳐도 자연스러움. 아래 선수별 세트 섹션마다 **빛 효과** 프롬프트가 같이 있음.

- **캔버스**: 1060×1484px (다른 레이어와 동일 비율), 알파 채널 있는 투명 PNG — 반짝이는 입자/빛만 그리고 나머지는 전부 투명
- **레퍼런스**: 불필요 (소재가 아니라 빛 자체라 프레임/배경 참고 없이 프롬프트만으로 생성)
- **파일명**: `<id>-background-glow.webp` (`totyCardAssets.ts`가 자동 스캔 — 없어도 나머지 레이어만으로 카드는 정상 동작함)
- **적용 방식**: `TotyCardVisual.tsx`에서 이 레이어가 **캐릭터 바로 위**에 얹힘(캐릭터보다 나중에 그려짐), 마우스와 무관하게 항상 재생되는 느린 CSS 키프레임(드리프트 이동 + 옅은 opacity 깜빡임)을 적용 — 기존 `.toty-card__idle-bg`/`__idle-char`와 같은 패턴.
- **주의 (중요)**: 캐릭터 위에 그대로 얹히는 레이어라, 입자가 크거나 캔버스 중앙에 몰려 있으면(특히 "마법진"처럼 원형 도형을 큼직하게 그리는 모티프) 캐릭터를 가려버림. **작고 성긴 입자를 화면 가장자리·모서리 위주로 흩뿌리고, 캐릭터가 서는 중앙~하단 영역은 비워두도록** 프롬프트에 명시할 것.

## 캐릭터 호버 대체 이미지 (선수별로 각각 생성 — 미구현, 우왁굳만 완료)

마우스를 카드에 올리고 있는 동안(`.toty-card--active`)만 기본 `<id>-character.webp`가 완전히 사라지고 대체 캐릭터 렌더로 크로스페이드 교체됨 — 겹쳐 보이는 게 아니라 진짜로 다른 이미지로 스왑되는 것이라 기본 포즈와 실루엣이 많이 달라도 됨. 좀 더 이쁘거나 역동적인 포즈로 "호버했을 때 반응한다"는 느낌을 주기 위한 용도. 아래 선수별 세트 섹션마다 **캐릭터 호버** 프롬프트가 같이 있음.

- **캔버스**: 1060×1484px (다른 레이어와 동일 비율), 알파 채널 있는 투명 PNG
- **레퍼런스**: 같은 인물의 정체성/키트 색상을 유지해야 하므로 **기존에 이미 생성된 그 선수의 `<id>-character.webp`를 레퍼런스로 첨부**(스트리머 실사진이 아님) — 포즈는 그대로 베끼지 말고 새로운 포즈로.
- **파일명**: `<id>-character-hover.webp` (`totyCardAssets.ts`가 자동 스캔 — 없어도 기본 캐릭터 이미지만으로 카드는 정상 동작함)
- **적용 방식**: `TotyCardVisual.tsx`에서 기본 캐릭터 이미지와 이 이미지가 같은 자리에 겹쳐 있다가, 호버 시작 시 기본 이미지는 0.25초에 걸쳐 사라지고 이 이미지가 그만큼 나타남(크로스페이드), 호버가 끝나면 반대로 되돌아감 — `toty-card.css`의 `.toty-card__char--has-hover`/`.toty-card__char-hover`.

## 이스터에그: 저퀄리티(크레파스) 3D 카드 (선수별로 각각 생성 — 미구현)

팝업을 열 때마다, 진짜 카드 대신 그 선수의 카드를 "유치원생이 스케치북에 크레파스로 그린 듯한" 완전히 저퀄리티 버전으로 보여주는 숨겨진 이스터에그. 선수별로 독립적으로 굴림(`totyCardLowQualityRoll.ts`) — **그 선수 카드를 처음 여는 순간은 50/50 랜덤**이고, **그다음부터는 열 때마다 직전과 번갈아가며(alternate)** 나옴(연속으로 같은 버전이 두 번 뜨지 않음), localStorage에 선수별로 마지막 결과를 저장해서 세션이 바뀌어도 이어짐. 프레임/배경/캐릭터 **3장만** 따로 만들고, **캐릭터 호버 대체 이미지와 배경 반짝임(빛 효과) 오버레이는 이 버전에서 아예 쓰지 않음**(그런 게 있을 리 없는 조악한 카드라는 컨셉). 카드 뒷면(`<id>-card-back.webp`)과 리빌 연출(터널/플립/버스트), 팝업 배경은 전부 기존 것 그대로 사용 — 뒤집었을 때 앞면 그림 3장만 저퀄리티로 바뀌는 것.

- **캔버스**: 1060×1484px (다른 3장과 동일 비율). **프레임**과 **캐릭터**는 알파 채널 있는 투명 PNG(도안 바깥은 완전 투명 — 나머지 레이어처럼), **배경**은 불투명 PNG(스케치북 종이 바탕까지 포함해서 꽉 채움).
- **레퍼런스**: 프레임은 하치 프레임이 아니라 **그 선수의 이미 생성된 `<id>-frame.webp`**를 첨부 — 실루엣뿐 아니라 이미 완성된 모티프·컬러까지 그대로 참고해서 "그 프레임을 크레파스로 다시 그린 버전"을 만드는 것(용암/서리/해파리 등 모티프 자체는 유지, 표현만 조악하게). 배경은 참고 이미지 불필요. 캐릭터는 그 선수의 **이미 생성된 `<id>-character.webp`**를 정체성/키트 컬러 참고용으로만 첨부(스트리머 실사진이 아님) — 포즈·비율은 그대로 베끼지 않고 크레파스 낙서 수준으로 뭉개도 됨.
- **파일명**: `<id>-lowq-frame.webp`, `<id>-lowq-background.webp`, `<id>-lowq-character.webp`. 변환 스크립트를 그대로 재사용 가능 — PNG 3장을 `public/test/`에 `frame.png`/`background.png`/`character.png`로 받아뒀다면:
  ```bash
  pnpm convert:card-art -- <id>-lowq
  ```
  (예: 다시바용이면 `pnpm convert:card-art -- tdnlamuron-lowq`) — 스크립트는 `<streamerId>-<part>.webp`로만 저장하므로 `<id>-lowq`를 그대로 id처럼 넘기면 파일명 규칙이 자동으로 맞음.
- **자동 인식**: `totyCardAssets.ts`의 `getLowQualityTotyCardAssets`가 `-lowq-` 트리오를 따로 스캔함 — 3장이 모두 갖춰진 선수만 이스터에그 대상이 되고, 아직 없는 선수는 항상 원래 카드만 나옴(=순차 추가 가능). 버튼이나 별도 UI는 없고, `TotyCardPopup`이 팝업을 열 때마다 조용히 위의 "처음엔 50/50, 그다음부턴 번갈아" 규칙을 굴림.
- **공용 크레파스 화풍 문구**: 아래 12명(선수 10명 + 하치·우왁굳 보너스 2명) 프롬프트 전부 다음 문구를 그대로 포함함 — *"in the style of a small child's crayon drawing on lined sketchbook paper — thick waxy crayon strokes, wobbly crooked outlines that don't quite close, visible paper texture and faint pencil guide lines peeking through, colors scribbled messily outside the lines, crude flat proportions, no shading or gradients, looks like an actual elementary schooler's homework drawing, intentionally bad and charming — NOT a polished 'cute chibi' illustration, NOT clean vector art."*
- **우왁굳(보너스) 주의**: 위 "보너스: 우왁굳" 섹션과 동일하게, 실제 BMW 로고/라운델/워드마크를 그대로 그리게 하면 안 됨 — 아래 우왁굳 저퀄리티 프롬프트에도 같은 금지 문구를 넣어뒀으니 생성 결과에 실제 브랜드 마크가 비치면 반드시 다시 생성할 것.

### 1. 다시바 — `tdnlamuron`

**프레임** (기존 `tdnlamuron-frame.webp`를 실루엣+모티프+컬러 참고용으로 첨부):
```
A trading-card frame in the style of a small child's crayon drawing on
lined sketchbook paper — thick waxy crayon strokes, wobbly crooked
outlines that don't quite close, visible paper texture and faint pencil
guide lines peeking through, colors scribbled messily outside the lines,
crude flat proportions, no shading or gradients, looks like an actual
elementary schooler's homework drawing, intentionally bad and charming —
NOT a polished "cute chibi" illustration, NOT clean vector art. Using the
attached card frame image as a full reference (not just a shape) — same
shield-shaped outer silhouette, same crest bump at the top center, same
inner window opening, and the same molten-lava/ember motif and
orange-and-black color palette already on it — redraw this exact frame
as if a small child copied it freehand in crayon: keep the same corner
decoration idea but make it crude, lopsided, and scribbled. No player, no
text, no stats. Entire canvas outside the drawn shield's own outline
(including the inner window) must be fully transparent. PNG with alpha
channel, 1060x1484.
```

**배경**:
```
A trading-card background in the style of a small child's crayon drawing
on a single flat sheet of lined notebook paper — thick waxy crayon
strokes, wobbly crooked lines, visible paper texture and faint blue
ruled lines and pencil guide lines peeking through, colors scribbled
messily outside the lines, crude flat shapes, no shading or gradients,
looks like an actual elementary schooler's homework drawing,
intentionally bad and charming. This is a full-bleed close-up crop of
just the paper's flat surface, filling the entire canvas edge-to-edge —
do NOT depict a spiral-bound notebook, ring binder, hole-punch holes,
perforated edge, torn edge, page corner/curl, or any part of a book or
notebook itself; there must be no holes, rings, wire coil, or binding of
any kind anywhere in the image, just the flat ruled paper texture itself
filling the whole frame. Portrait orientation, a
messy orange-and-red crayon scribble of a volcano with lava and a few
triangle "fire" shapes in the corner, filling the whole page including
the visible lined sketchbook paper background. No characters, no people,
no border/frame, no text. PNG, 1060x1484.
```

**캐릭터** (기존 `tdnlamuron-character.webp`를 정체성/키트 컬러 참고용으로만 첨부):
```
Using the attached character render ONLY as a loose identity/kit-color
reference (same person, same apricot-orange and cream soccer kit) — redraw
it MUCH more crudely, like a genuinely bad drawing by a 5-year-old just
learning to hold a crayon: lopsided potato-shaped head far too big for the
body, one arm noticeably longer than the other, legs of uneven thickness,
no neck, hands and feet drawn as simple round blobs with no fingers or
toes, facial features uneven and off-center (eyes different sizes, crooked
scribbled smile), thick shaky crayon outlines that overshoot and don't
fully close, color scribbled sloppily outside the lines with visible gaps
of blank space showing through, no shading, no clean linework, no correct
anatomy or proportion anywhere. This must look like an actual amateur
child's homework drawing — clumsy and a little ugly — NOT cute, NOT
polished, NOT chibi, NOT a skillful "bad on purpose" stylization; it
should read as genuinely, artlessly poorly drawn. Draw a crude standing
soccer pose with a wobbly circle for a ball near one foot. No frame, no
text, no background — fully transparent PNG with alpha channel, 1060x1484,
leave open space above the head and below the waist for name/stat
overlays.
```

### 2. 쥬멩이 — `ju010228`

**프레임** (기존 `ju010228-frame.webp`를 실루엣+모티프+컬러 참고용으로 첨부):
```
A trading-card frame in the style of a small child's crayon drawing on
lined sketchbook paper — thick waxy crayon strokes, wobbly crooked
outlines that don't quite close, visible paper texture and faint pencil
guide lines peeking through, colors scribbled messily outside the lines,
crude flat proportions, no shading or gradients, looks like an actual
elementary schooler's homework drawing, intentionally bad and charming —
NOT a polished "cute chibi" illustration, NOT clean vector art. Using the
attached card frame image as a full reference (not just a shape) — same
shield-shaped outer silhouette, same crest bump at the top center, same
inner window opening, and the same spring-vine/budding-leaf motif and
lime-green color palette already on it — redraw this exact frame as if a
small child copied it freehand in crayon: keep the same corner decoration
idea but make it crude, lopsided, and scribbled. No player, no text, no
stats. Entire canvas outside the drawn shield's own outline (including
the inner window) must be fully transparent. PNG with alpha channel,
1060x1484.
```

**배경**:
```
A trading-card background in the style of a small child's crayon drawing
on a single flat sheet of lined notebook paper — thick waxy crayon
strokes, wobbly crooked lines, visible paper texture and faint blue
ruled lines and pencil guide lines peeking through, colors scribbled
messily outside the lines, crude flat shapes, no shading or gradients,
looks like an actual elementary schooler's homework drawing,
intentionally bad and charming. This is a full-bleed close-up crop of
just the paper's flat surface, filling the entire canvas edge-to-edge —
do NOT depict a spiral-bound notebook, ring binder, hole-punch holes,
perforated edge, torn edge, page corner/curl, or any part of a book or
notebook itself; there must be no holes, rings, wire coil, or binding of
any kind anywhere in the image, just the flat ruled paper texture itself
filling the whole frame. Portrait orientation, a
messy lime-green crayon scribble of vines, leaves and a couple of round
"flower" doodles in the corner, filling the whole page including the
visible lined sketchbook paper background. No characters, no people, no
border/frame, no text. PNG, 1060x1484.
```

**캐릭터** (기존 `ju010228-character.webp`를 정체성/키트 컬러 참고용으로만 첨부):
```
Using the attached character render ONLY as a loose identity/kit-color
reference (same person, same lime-green and white soccer kit) — redraw it
MUCH more crudely, like a genuinely bad drawing by a 5-year-old just
learning to hold a crayon: lopsided potato-shaped head far too big for the
body, one arm noticeably longer than the other, legs of uneven thickness,
no neck, hands and feet drawn as simple round blobs with no fingers or
toes, facial features uneven and off-center (eyes different sizes, crooked
scribbled smile), thick shaky crayon outlines that overshoot and don't
fully close, color scribbled sloppily outside the lines with visible gaps
of blank space showing through, no shading, no clean linework, no correct
anatomy or proportion anywhere. This must look like an actual amateur
child's homework drawing — clumsy and a little ugly — NOT cute, NOT
polished, NOT chibi, NOT a skillful "bad on purpose" stylization; it
should read as genuinely, artlessly poorly drawn. Draw a crude pose with
both arms thrown straight up in a lopsided "hooray" celebration. No frame,
no text, no background — fully transparent PNG with alpha channel,
1060x1484, leave open space above the head and below the waist for
name/stat overlays.
```

### 3. 문모모 — `doormomo`

**프레임** (기존 `doormomo-frame.webp`를 실루엣+모티프+컬러 참고용으로 첨부):
```
A trading-card frame in the style of a small child's crayon drawing on
lined sketchbook paper — thick waxy crayon strokes, wobbly crooked
outlines that don't quite close, visible paper texture and faint pencil
guide lines peeking through, colors scribbled messily outside the lines,
crude flat proportions, no shading or gradients, looks like an actual
elementary schooler's homework drawing, intentionally bad and charming —
NOT a polished "cute chibi" illustration, NOT clean vector art. Using the
attached card frame image as a full reference (not just a shape) — same
shield-shaped outer silhouette, same crest bump at the top center, same
inner window opening, and the same magic-circle/rune motif and purple
color palette already on it — redraw this exact frame as if a small
child copied it freehand in crayon: keep the same corner decoration idea
but make it crude, lopsided, and scribbled. No player, no text, no stats.
Entire canvas outside the drawn shield's own outline (including the
inner window) must be fully transparent. PNG with alpha channel,
1060x1484.
```

**배경**:
```
A trading-card background in the style of a small child's crayon drawing
on a single flat sheet of lined notebook paper — thick waxy crayon
strokes, wobbly crooked lines, visible paper texture and faint blue
ruled lines and pencil guide lines peeking through, colors scribbled
messily outside the lines, crude flat shapes, no shading or gradients,
looks like an actual elementary schooler's homework drawing,
intentionally bad and charming. This is a full-bleed close-up crop of
just the paper's flat surface, filling the entire canvas edge-to-edge —
do NOT depict a spiral-bound notebook, ring binder, hole-punch holes,
perforated edge, torn edge, page corner/curl, or any part of a book or
notebook itself; there must be no holes, rings, wire coil, or binding of
any kind anywhere in the image, just the flat ruled paper texture itself
filling the whole frame. Portrait orientation, a
messy purple crayon scribble of a lopsided magic circle, star shapes and
squiggly rune symbols in the corner, filling the whole page including the
visible lined sketchbook paper background. No characters, no people, no
border/frame, no text. PNG, 1060x1484.
```

**캐릭터** (기존 `doormomo-character.webp`를 정체성/키트 컬러 참고용으로만 첨부):
```
Using the attached character render ONLY as a loose identity/kit-color
reference (same person, same purple and silver soccer kit) — redraw it
MUCH more crudely, like a genuinely bad drawing by a 5-year-old just
learning to hold a crayon: lopsided potato-shaped head far too big for the
body, one arm noticeably longer than the other, legs of uneven thickness,
no neck, hands and feet drawn as simple round blobs with no fingers or
toes, facial features uneven and off-center (eyes different sizes, crooked
scribbled smile), thick shaky crayon outlines that overshoot and don't
fully close, color scribbled sloppily outside the lines with visible gaps
of blank space showing through, no shading, no clean linework, no correct
anatomy or proportion anywhere. This must look like an actual amateur
child's homework drawing — clumsy and a little ugly — NOT cute, NOT
polished, NOT chibi, NOT a skillful "bad on purpose" stylization; it
should read as genuinely, artlessly poorly drawn. Draw a crude standing
pose with arms crossed and a wobbly circle for a ball under one foot. No
frame, no text, no background — fully transparent PNG with alpha channel,
1060x1484, leave open space above the head and below the waist for
name/stat overlays.
```

### 4. 뽀린걸 — `bboringirl`

**프레임** (기존 `bboringirl-frame.webp`를 실루엣+모티프+컬러 참고용으로 첨부):
```
A trading-card frame in the style of a small child's crayon drawing on
lined sketchbook paper — thick waxy crayon strokes, wobbly crooked
outlines that don't quite close, visible paper texture and faint pencil
guide lines peeking through, colors scribbled messily outside the lines,
crude flat proportions, no shading or gradients, looks like an actual
elementary schooler's homework drawing, intentionally bad and charming —
NOT a polished "cute chibi" illustration, NOT clean vector art. Using the
attached card frame image as a full reference (not just a shape) — same
shield-shaped outer silhouette, same crest bump at the top center, same
inner window opening, and the same robot-plate/circuit motif and
gray-and-red color palette already on it — redraw this exact frame as if
a small child copied it freehand in crayon: keep the same corner
decoration idea but make it crude, lopsided, and scribbled. No player, no
text, no stats. Entire canvas outside the drawn shield's own outline
(including the inner window) must be fully transparent. PNG with alpha
channel, 1060x1484.
```

**배경**:
```
A trading-card background in the style of a small child's crayon drawing
on a single flat sheet of lined notebook paper — thick waxy crayon
strokes, wobbly crooked lines, visible paper texture and faint blue
ruled lines and pencil guide lines peeking through, colors scribbled
messily outside the lines, crude flat shapes, no shading or gradients,
looks like an actual elementary schooler's homework drawing,
intentionally bad and charming. This is a full-bleed close-up crop of
just the paper's flat surface, filling the entire canvas edge-to-edge —
do NOT depict a spiral-bound notebook, ring binder, hole-punch holes,
perforated edge, torn edge, page corner/curl, or any part of a book or
notebook itself; there must be no holes, rings, wire coil, or binding of
any kind anywhere in the image, just the flat ruled paper texture itself
filling the whole frame. Portrait orientation, a
messy gray crayon scribble of blocky robot armor plates with red zigzag
"circuit" lines scrawled through them in the corner, filling the whole
page including the visible lined sketchbook paper background. No
characters, no people, no border/frame, no text. PNG, 1060x1484.
```

**캐릭터** (기존 `bboringirl-character.webp`를 정체성/키트 컬러 참고용으로만 첨부):
```
Using the attached character render ONLY as a loose identity/kit-color
reference (same person, same gunmetal-gray kit with red trim) — redraw it
MUCH more crudely, like a genuinely bad drawing by a 5-year-old just
learning to hold a crayon: lopsided potato-shaped head far too big for the
body, one arm noticeably longer than the other, legs of uneven thickness,
no neck, hands and feet drawn as simple round blobs with no fingers or
toes, facial features uneven and off-center (eyes different sizes, crooked
scribbled smile), thick shaky crayon outlines that overshoot and don't
fully close, color scribbled sloppily outside the lines with visible gaps
of blank space showing through, no shading, no clean linework, no correct
anatomy or proportion anywhere. This must look like an actual amateur
child's homework drawing — clumsy and a little ugly — NOT cute, NOT
polished, NOT chibi, NOT a skillful "bad on purpose" stylization; it
should read as genuinely, artlessly poorly drawn. Draw a crude running
pose with one stick arm pointing forward. No frame, no text, no
background — fully transparent PNG with alpha channel, 1060x1484, leave
open space above the head and below the waist for name/stat overlays.
```

### 5. 한결 — `kaksjak0730`

**프레임** (기존 `kaksjak0730-frame.webp`를 실루엣+모티프+컬러 참고용으로 첨부):
```
A trading-card frame in the style of a small child's crayon drawing on
lined sketchbook paper — thick waxy crayon strokes, wobbly crooked
outlines that don't quite close, visible paper texture and faint pencil
guide lines peeking through, colors scribbled messily outside the lines,
crude flat proportions, no shading or gradients, looks like an actual
elementary schooler's homework drawing, intentionally bad and charming —
NOT a polished "cute chibi" illustration, NOT clean vector art. Using the
attached card frame image as a full reference (not just a shape) — same
shield-shaped outer silhouette, same crest bump at the top center, same
inner window opening, and the same night-sky/glass-shard motif and
black-and-blue color palette already on it — redraw this exact frame as
if a small child copied it freehand in crayon: keep the same corner
decoration idea but make it crude, lopsided, and scribbled. No player, no
text, no stats. Entire canvas outside the drawn shield's own outline
(including the inner window) must be fully transparent. PNG with alpha
channel, 1060x1484.
```

**배경**:
```
A trading-card background in the style of a small child's crayon drawing
on a single flat sheet of lined notebook paper — thick waxy crayon
strokes, wobbly crooked lines, visible paper texture and faint blue
ruled lines and pencil guide lines peeking through, colors scribbled
messily outside the lines, crude flat shapes, no shading or gradients,
looks like an actual elementary schooler's homework drawing,
intentionally bad and charming. This is a full-bleed close-up crop of
just the paper's flat surface, filling the entire canvas edge-to-edge —
do NOT depict a spiral-bound notebook, ring binder, hole-punch holes,
perforated edge, torn edge, page corner/curl, or any part of a book or
notebook itself; there must be no holes, rings, wire coil, or binding of
any kind anywhere in the image, just the flat ruled paper texture itself
filling the whole frame. Portrait orientation, a
messy dark navy-and-black crayon scribble of a night sky with a bunch of
crooked star shapes and a few jagged "glass shard" doodles in the corner,
filling the whole page including the visible lined sketchbook paper
background. No characters, no people, no border/frame, no text. PNG,
1060x1484.
```

**캐릭터** (기존 `kaksjak0730-character.webp`를 정체성/키트 컬러 참고용으로만 첨부):
```
Using the attached character render ONLY as a loose identity/kit-color
reference (same person, same matte black kit with sapphire-blue trim) —
redraw it MUCH more crudely, like a genuinely bad drawing by a 5-year-old
just learning to hold a crayon: lopsided potato-shaped head far too big
for the body, one arm noticeably longer than the other, legs of uneven
thickness, no neck, hands and feet drawn as simple round blobs with no
fingers or toes, facial features uneven and off-center (eyes different
sizes, crooked scribbled smile), thick shaky crayon outlines that
overshoot and don't fully close, color scribbled sloppily outside the
lines with visible gaps of blank space showing through, no shading, no
clean linework, no correct anatomy or proportion anywhere. This must look
like an actual amateur child's homework drawing — clumsy and a little
ugly — NOT cute, NOT polished, NOT chibi, NOT a skillful "bad on purpose"
stylization; it should read as genuinely, artlessly poorly drawn. Draw a
crude free-kick stance with one stick leg drawn mid-swing. No frame, no
text, no background — fully transparent PNG with alpha channel,
1060x1484, leave open space above the head and below the waist for
name/stat overlays.
```

### 6. 핑구 — `sjh4018`

**프레임** (기존 `sjh4018-frame.webp`를 실루엣+모티프+컬러 참고용으로 첨부):
```
A trading-card frame in the style of a small child's crayon drawing on
lined sketchbook paper — thick waxy crayon strokes, wobbly crooked
outlines that don't quite close, visible paper texture and faint pencil
guide lines peeking through, colors scribbled messily outside the lines,
crude flat proportions, no shading or gradients, looks like an actual
elementary schooler's homework drawing, intentionally bad and charming —
NOT a polished "cute chibi" illustration, NOT clean vector art. Using the
attached card frame image as a full reference (not just a shape) — same
shield-shaped outer silhouette, same crest bump at the top center, same
inner window opening, and the same cloud/feather motif and
sky-blue-and-lavender color palette already on it — redraw this exact
frame as if a small child copied it freehand in crayon: keep the same
corner decoration idea but make it crude, lopsided, and scribbled. No
player, no text, no stats. Entire canvas outside the drawn shield's own
outline (including the inner window) must be fully transparent. PNG with
alpha channel, 1060x1484.
```

**배경**:
```
A trading-card background in the style of a small child's crayon drawing
on a single flat sheet of lined notebook paper — thick waxy crayon
strokes, wobbly crooked lines, visible paper texture and faint blue
ruled lines and pencil guide lines peeking through, colors scribbled
messily outside the lines, crude flat shapes, no shading or gradients,
looks like an actual elementary schooler's homework drawing,
intentionally bad and charming. This is a full-bleed close-up crop of
just the paper's flat surface, filling the entire canvas edge-to-edge —
do NOT depict a spiral-bound notebook, ring binder, hole-punch holes,
perforated edge, torn edge, page corner/curl, or any part of a book or
notebook itself; there must be no holes, rings, wire coil, or binding of
any kind anywhere in the image, just the flat ruled paper texture itself
filling the whole frame. Portrait orientation, a
messy sky-blue crayon scribble of a few lumpy cloud shapes and lavender
feather doodles in the corner, filling the whole page including the
visible lined sketchbook paper background. No characters, no people, no
border/frame, no text. PNG, 1060x1484.
```

**캐릭터** (기존 `sjh4018-character.webp`를 정체성/키트 컬러 참고용으로만 첨부):
```
Using the attached character render ONLY as a loose identity/kit-color
reference (same person, same sky-blue kit with pale lavender trim) —
redraw it MUCH more crudely, like a genuinely bad drawing by a 5-year-old
just learning to hold a crayon: lopsided potato-shaped head far too big
for the body, one arm noticeably longer than the other, legs of uneven
thickness, no neck, hands and feet drawn as simple round blobs with no
fingers or toes, facial features uneven and off-center (eyes different
sizes, crooked scribbled smile), thick shaky crayon outlines that
overshoot and don't fully close, color scribbled sloppily outside the
lines with visible gaps of blank space showing through, no shading, no
clean linework, no correct anatomy or proportion anywhere. This must look
like an actual amateur child's homework drawing — clumsy and a little
ugly — NOT cute, NOT polished, NOT chibi, NOT a skillful "bad on purpose"
stylization; it should read as genuinely, artlessly poorly drawn. Draw a
crude wide defensive stance with both stick arms out. No frame, no text,
no background — fully transparent PNG with alpha channel, 1060x1484,
leave open space above the head and below the waist for name/stat
overlays.
```

### 7. 해파린 — `haepalin`

**프레임** (기존 `haepalin-frame.webp`를 실루엣+모티프+컬러 참고용으로 첨부):
```
A trading-card frame in the style of a small child's crayon drawing on
lined sketchbook paper — thick waxy crayon strokes, wobbly crooked
outlines that don't quite close, visible paper texture and faint pencil
guide lines peeking through, colors scribbled messily outside the lines,
crude flat proportions, no shading or gradients, looks like an actual
elementary schooler's homework drawing, intentionally bad and charming —
NOT a polished "cute chibi" illustration, NOT clean vector art. Using the
attached card frame image as a full reference (not just a shape) — same
shield-shaped outer silhouette, same crest bump at the top center, same
inner window opening, and the same jellyfish/bioluminescent motif and
lavender-and-purple color palette already on it — redraw this exact
frame as if a small child copied it freehand in crayon: keep the same
corner decoration idea but make it crude, lopsided, and scribbled. No
player, no text, no stats. Entire canvas outside the drawn shield's own
outline (including the inner window) must be fully transparent. PNG with
alpha channel, 1060x1484.
```

**배경**:
```
A trading-card background in the style of a small child's crayon drawing
on a single flat sheet of lined notebook paper — thick waxy crayon
strokes, wobbly crooked lines, visible paper texture and faint blue
ruled lines and pencil guide lines peeking through, colors scribbled
messily outside the lines, crude flat shapes, no shading or gradients,
looks like an actual elementary schooler's homework drawing,
intentionally bad and charming. This is a full-bleed close-up crop of
just the paper's flat surface, filling the entire canvas edge-to-edge —
do NOT depict a spiral-bound notebook, ring binder, hole-punch holes,
perforated edge, torn edge, page corner/curl, or any part of a book or
notebook itself; there must be no holes, rings, wire coil, or binding of
any kind anywhere in the image, just the flat ruled paper texture itself
filling the whole frame. Portrait orientation, a
messy pale-lilac crayon scribble of a couple of round jellyfish with wavy
purple tentacle lines dangling down in the corner, filling the whole page
including the visible lined sketchbook paper background. No characters,
no people, no border/frame, no text. PNG, 1060x1484.
```

**캐릭터** (기존 `haepalin-character.webp`를 정체성/키트 컬러 참고용으로만 첨부):
```
Using the attached character render ONLY as a loose identity/kit-color
reference (same person, same pale lavender kit with deep purple trim) —
redraw it MUCH more crudely, like a genuinely bad drawing by a 5-year-old
just learning to hold a crayon: lopsided potato-shaped head far too big
for the body, one arm noticeably longer than the other, legs of uneven
thickness, no neck, hands and feet drawn as simple round blobs with no
fingers or toes, facial features uneven and off-center (eyes different
sizes, crooked scribbled smile), thick shaky crayon outlines that
overshoot and don't fully close, color scribbled sloppily outside the
lines with visible gaps of blank space showing through, no shading, no
clean linework, no correct anatomy or proportion anywhere. This must look
like an actual amateur child's homework drawing — clumsy and a little
ugly — NOT cute, NOT polished, NOT chibi, NOT a skillful "bad on purpose"
stylization; it should read as genuinely, artlessly poorly drawn. Draw a
crude pose jumping with both stick arms up for a header. No frame, no
text, no background — fully transparent PNG with alpha channel,
1060x1484, leave open space above the head and below the waist for
name/stat overlays.
```

### 8. 리냐 — `lina0108`

**프레임** (기존 `lina0108-frame.webp`를 실루엣+모티프+컬러 참고용으로 첨부):
```
A trading-card frame in the style of a small child's crayon drawing on
lined sketchbook paper — thick waxy crayon strokes, wobbly crooked
outlines that don't quite close, visible paper texture and faint pencil
guide lines peeking through, colors scribbled messily outside the lines,
crude flat proportions, no shading or gradients, looks like an actual
elementary schooler's homework drawing, intentionally bad and charming —
NOT a polished "cute chibi" illustration, NOT clean vector art. Using the
attached card frame image as a full reference (not just a shape) — same
shield-shaped outer silhouette, same crest bump at the top center, same
inner window opening, and the same cherry-blossom motif and vivid-pink
color palette already on it — redraw this exact frame as if a small
child copied it freehand in crayon: keep the same corner decoration idea
but make it crude, lopsided, and scribbled. No player, no text, no
stats. Entire canvas outside the drawn shield's own outline (including
the inner window) must be fully transparent. PNG with alpha channel,
1060x1484.
```

**배경**:
```
A trading-card background in the style of a small child's crayon drawing
on a single flat sheet of lined notebook paper — thick waxy crayon
strokes, wobbly crooked lines, visible paper texture and faint blue
ruled lines and pencil guide lines peeking through, colors scribbled
messily outside the lines, crude flat shapes, no shading or gradients,
looks like an actual elementary schooler's homework drawing,
intentionally bad and charming. This is a full-bleed close-up crop of
just the paper's flat surface, filling the entire canvas edge-to-edge —
do NOT depict a spiral-bound notebook, ring binder, hole-punch holes,
perforated edge, torn edge, page corner/curl, or any part of a book or
notebook itself; there must be no holes, rings, wire coil, or binding of
any kind anywhere in the image, just the flat ruled paper texture itself
filling the whole frame. Portrait orientation, a
messy pink crayon scribble of a wobbly tree branch with round pink petal
dots scattered around it in the corner, filling the whole page including
the visible lined sketchbook paper background. No characters, no people,
no border/frame, no text. PNG, 1060x1484.
```

**캐릭터** (기존 `lina0108-character.webp`를 정체성/키트 컬러 참고용으로만 첨부):
```
Using the attached character render ONLY as a loose identity/kit-color
reference (same person, same vivid pink kit with pale-pink trim) — redraw
it MUCH more crudely, like a genuinely bad drawing by a 5-year-old just
learning to hold a crayon: lopsided potato-shaped head far too big for the
body, one arm noticeably longer than the other, legs of uneven thickness,
no neck, hands and feet drawn as simple round blobs with no fingers or
toes, facial features uneven and off-center (eyes different sizes, crooked
scribbled smile), thick shaky crayon outlines that overshoot and don't
fully close, color scribbled sloppily outside the lines with visible gaps
of blank space showing through, no shading, no clean linework, no correct
anatomy or proportion anywhere. This must look like an actual amateur
child's homework drawing — clumsy and a little ugly — NOT cute, NOT
polished, NOT chibi, NOT a skillful "bad on purpose" stylization; it
should read as genuinely, artlessly poorly drawn. Draw a crude running
pose with one stick hand waving. No frame, no text, no background — fully
transparent PNG with alpha channel, 1060x1484, leave open space above the
head and below the waist for name/stat overlays.
```

### 9. 빙밍 — `tleod1818`

**프레임** (기존 `tleod1818-frame.webp`를 실루엣+모티프+컬러 참고용으로 첨부):
```
A trading-card frame in the style of a small child's crayon drawing on
lined sketchbook paper — thick waxy crayon strokes, wobbly crooked
outlines that don't quite close, visible paper texture and faint pencil
guide lines peeking through, colors scribbled messily outside the lines,
crude flat proportions, no shading or gradients, looks like an actual
elementary schooler's homework drawing, intentionally bad and charming —
NOT a polished "cute chibi" illustration, NOT clean vector art. Using the
attached card frame image as a full reference (not just a shape) — same
shield-shaped outer silhouette, same crest bump at the top center, same
inner window opening, and the same storm/lightning motif and
navy-and-emerald color palette already on it — redraw this exact frame
as if a small child copied it freehand in crayon: keep the same corner
decoration idea but make it crude, lopsided, and scribbled. No player, no
text, no stats. Entire canvas outside the drawn shield's own outline
(including the inner window) must be fully transparent. PNG with alpha
channel, 1060x1484.
```

**배경**:
```
A trading-card background in the style of a small child's crayon drawing
on a single flat sheet of lined notebook paper — thick waxy crayon
strokes, wobbly crooked lines, visible paper texture and faint blue
ruled lines and pencil guide lines peeking through, colors scribbled
messily outside the lines, crude flat shapes, no shading or gradients,
looks like an actual elementary schooler's homework drawing,
intentionally bad and charming. This is a full-bleed close-up crop of
just the paper's flat surface, filling the entire canvas edge-to-edge —
do NOT depict a spiral-bound notebook, ring binder, hole-punch holes,
perforated edge, torn edge, page corner/curl, or any part of a book or
notebook itself; there must be no holes, rings, wire coil, or binding of
any kind anywhere in the image, just the flat ruled paper texture itself
filling the whole frame. Portrait orientation, a
messy dark-navy crayon scribble of lumpy storm clouds with a jagged
emerald-green lightning-bolt zigzag in the corner, filling the whole page
including the visible lined sketchbook paper background. No characters,
no people, no border/frame, no text. PNG, 1060x1484.
```

**캐릭터** (기존 `tleod1818-character.webp`를 정체성/키트 컬러 참고용으로만 첨부):
```
Using the attached character render ONLY as a loose identity/kit-color
reference (same person, same dark navy kit with emerald trim) — redraw it
MUCH more crudely, like a genuinely bad drawing by a 5-year-old just
learning to hold a crayon: lopsided potato-shaped head far too big for the
body, one arm noticeably longer than the other, legs of uneven thickness,
no neck, hands and feet drawn as simple round blobs with no fingers or
toes, facial features uneven and off-center (eyes different sizes, crooked
scribbled smile), thick shaky crayon outlines that overshoot and don't
fully close, color scribbled sloppily outside the lines with visible gaps
of blank space showing through, no shading, no clean linework, no correct
anatomy or proportion anywhere. This must look like an actual amateur
child's homework drawing — clumsy and a little ugly — NOT cute, NOT
polished, NOT chibi, NOT a skillful "bad on purpose" stylization; it
should read as genuinely, artlessly poorly drawn. Draw a crude mid-tackle
pose leaning sideways with a stick leg stretched out. No frame, no text,
no background — fully transparent PNG with alpha channel, 1060x1484,
leave open space above the head and below the waist for name/stat
overlays.
```

### 10. 재닌 — `janine95kim`

**프레임** (기존 `janine95kim-frame.webp`를 실루엣+모티프+컬러 참고용으로 첨부):
```
A trading-card frame in the style of a small child's crayon drawing on
lined sketchbook paper — thick waxy crayon strokes, wobbly crooked
outlines that don't quite close, visible paper texture and faint pencil
guide lines peeking through, colors scribbled messily outside the lines,
crude flat proportions, no shading or gradients, looks like an actual
elementary schooler's homework drawing, intentionally bad and charming —
NOT a polished "cute chibi" illustration, NOT clean vector art. Using the
attached card frame image as a full reference (not just a shape) — same
shield-shaped outer silhouette, same crest bump at the top center, same
inner window opening, and the same frost/aurora motif and
sky-blue-and-white color palette already on it — redraw this exact frame
as if a small child copied it freehand in crayon: keep the same corner
decoration idea but make it crude, lopsided, and scribbled. No player, no
text, no stats. Entire canvas outside the drawn shield's own outline
(including the inner window) must be fully transparent. PNG with alpha
channel, 1060x1484.
```

**배경**:
```
A trading-card background in the style of a small child's crayon drawing
on a single flat sheet of lined notebook paper — thick waxy crayon
strokes, wobbly crooked lines, visible paper texture and faint blue
ruled lines and pencil guide lines peeking through, colors scribbled
messily outside the lines, crude flat shapes, no shading or gradients,
looks like an actual elementary schooler's homework drawing,
intentionally bad and charming. This is a full-bleed close-up crop of
just the paper's flat surface, filling the entire canvas edge-to-edge —
do NOT depict a spiral-bound notebook, ring binder, hole-punch holes,
perforated edge, torn edge, page corner/curl, or any part of a book or
notebook itself; there must be no holes, rings, wire coil, or binding of
any kind anywhere in the image, just the flat ruled paper texture itself
filling the whole frame. Portrait orientation, a
messy sky-blue crayon scribble of lopsided snowflake shapes and a couple
of frosty swirl doodles in the corner, filling the whole page including
the visible lined sketchbook paper background. No characters, no people,
no border/frame, no text. PNG, 1060x1484.
```

**캐릭터** (기존 `janine95kim-character.webp`를 정체성/키트 컬러 참고용으로만 첨부):
```
Using the attached character render ONLY as a loose identity/kit-color
reference (same person, same sky-blue goalkeeper kit) — redraw it MUCH
more crudely, like a genuinely bad drawing by a 5-year-old just learning
to hold a crayon: lopsided potato-shaped head far too big for the body,
one arm noticeably longer than the other, legs of uneven thickness, no
neck, hands and feet drawn as simple round blobs with no fingers or toes,
facial features uneven and off-center (eyes different sizes, crooked
scribbled smile), thick shaky crayon outlines that overshoot and don't
fully close, color scribbled sloppily outside the lines with visible gaps
of blank space showing through, no shading, no clean linework, no correct
anatomy or proportion anywhere. This must look like an actual amateur
child's homework drawing — clumsy and a little ugly — NOT cute, NOT
polished, NOT chibi, NOT a skillful "bad on purpose" stylization; it
should read as genuinely, artlessly poorly drawn. Draw a crude pose diving
sideways with both stick arms stretched out. No frame, no text, no
background — fully transparent PNG with alpha channel, 1060x1484, leave
open space above the head and below the waist for name/stat overlays.
```

### 11. 하치 (보너스) — `hachi97`

**프레임** (기존 `hachi97-frame.webp`를 실루엣+모티프+컬러 참고용으로 첨부):
```
A trading-card frame in the style of a small child's crayon drawing on
lined sketchbook paper — thick waxy crayon strokes, wobbly crooked
outlines that don't quite close, visible paper texture and faint pencil
guide lines peeking through, colors scribbled messily outside the lines,
crude flat proportions, no shading or gradients, looks like an actual
elementary schooler's homework drawing, intentionally bad and charming —
NOT a polished "cute chibi" illustration, NOT clean vector art. Using the
attached card frame image as a full reference (not just a shape) — same
shield-shaped outer silhouette, same crest bump at the top center, same
inner window opening, and the same dragon-claw/dragon-scale motif and
golden-amber + amethyst-violet color palette already on it — redraw this
exact frame as if a small child copied it freehand in crayon: keep the
same corner decoration idea but make it crude, lopsided, and scribbled.
No player, no text, no stats. Entire canvas outside the drawn shield's
own outline (including the inner window) must be fully transparent. PNG
with alpha channel, 1060x1484.
```

**배경**:
```
A trading-card background in the style of a small child's crayon drawing
on a single flat sheet of lined notebook paper — thick waxy crayon
strokes, wobbly crooked lines, visible paper texture and faint blue
ruled lines and pencil guide lines peeking through, colors scribbled
messily outside the lines, crude flat shapes, no shading or gradients,
looks like an actual elementary schooler's homework drawing,
intentionally bad and charming. This is a full-bleed close-up crop of
just the paper's flat surface, filling the entire canvas edge-to-edge —
do NOT depict a spiral-bound notebook, ring binder, hole-punch holes,
perforated edge, torn edge, page corner/curl, or any part of a book or
notebook itself; there must be no holes, rings, wire coil, or binding of
any kind anywhere in the image, just the flat ruled paper texture itself
filling the whole frame. Portrait orientation, a messy gold-and-violet
crayon scribble of a lopsided dragon claw with a few triangle "scale" and
wavy "fire" shapes in the corner, filling the whole page including the
visible lined sketchbook paper background. No characters, no people, no
border/frame, no text. PNG, 1060x1484.
```

**캐릭터** (기존 `hachi97-character.webp`를 정체성/키트 컬러 참고용으로만 첨부):
```
Using the attached character render ONLY as a loose identity/kit-color
reference (same person, same golden-amber and amethyst-violet
dragon-themed kit) — redraw it MUCH more crudely, like a genuinely bad
drawing by a 5-year-old just learning to hold a crayon: lopsided
potato-shaped head far too big for the body, one arm noticeably longer
than the other, legs of uneven thickness, no neck, hands and feet drawn
as simple round blobs with no fingers or toes, facial features uneven
and off-center (eyes different sizes, crooked scribbled smile), thick
shaky crayon outlines that overshoot and don't fully close, color
scribbled sloppily outside the lines with visible gaps of blank space
showing through, no shading, no clean linework, no correct anatomy or
proportion anywhere. This must look like an actual amateur child's
homework drawing — clumsy and a little ugly — NOT cute, NOT polished,
NOT chibi, NOT a skillful "bad on purpose" stylization; it should read
as genuinely, artlessly poorly drawn. Draw a crude standing pose giving a
big lopsided thumbs-up, with a couple of squiggly "fire" scribbles near
the hand. No frame, no text, no background — fully transparent PNG with
alpha channel, 1060x1484, leave open space above the head and below the
waist for name/stat overlays.
```

### 12. 우왁굳 (보너스) — `woowakgood`

**⚠️ 상표 주의**: 위 "보너스: 우왁굳" 섹션과 동일 — 실제 BMW 로고(키드니 그릴, 프로펠러 라운델)나 "BMW" 워드마크가 그대로 그려지면 안 됨. 아래 프롬프트에도 금지 문구를 넣어뒀지만, 생성 결과에 실제 브랜드 마크가 비치면 반드시 다시 생성할 것.

**프레임** (기존 `woowakgood-frame.webp`를 실루엣+모티프+컬러 참고용으로 첨부):
```
A trading-card frame in the style of a small child's crayon drawing on
lined sketchbook paper — thick waxy crayon strokes, wobbly crooked
outlines that don't quite close, visible paper texture and faint pencil
guide lines peeking through, colors scribbled messily outside the lines,
crude flat proportions, no shading or gradients, looks like an actual
elementary schooler's homework drawing, intentionally bad and charming —
NOT a polished "cute chibi" illustration, NOT clean vector art. Using the
attached card frame image as a full reference (not just a shape) — same
shield-shaped outer silhouette, same crest bump at the top center, same
inner window opening, and the same motorsport speed-line motif and vivid
peridot-green + teal-violet-crimson racing-stripe color palette already
on it — redraw this exact frame as if a small child copied it freehand in
crayon: keep the same corner decoration idea but make it crude, lopsided,
and scribbled. No real car logos, badges, roundels, or brand wordmarks of
any kind — only generic scribbled stripes and speed-lines. No player, no
text, no stats. Entire canvas outside the drawn shield's own outline
(including the inner window) must be fully transparent. PNG with alpha
channel, 1060x1484.
```

**배경**:
```
A trading-card background in the style of a small child's crayon drawing
on a single flat sheet of lined notebook paper — thick waxy crayon
strokes, wobbly crooked lines, visible paper texture and faint blue
ruled lines and pencil guide lines peeking through, colors scribbled
messily outside the lines, crude flat shapes, no shading or gradients,
looks like an actual elementary schooler's homework drawing,
intentionally bad and charming. This is a full-bleed close-up crop of
just the paper's flat surface, filling the entire canvas edge-to-edge —
do NOT depict a spiral-bound notebook, ring binder, hole-punch holes,
perforated edge, torn edge, page corner/curl, or any part of a book or
notebook itself; there must be no holes, rings, wire coil, or binding of
any kind anywhere in the image, just the flat ruled paper texture itself
filling the whole frame. Portrait orientation, a messy green crayon
scribble of a few speed-line stripes and a lopsided checkered-flag doodle
in the corner (no real car logos or brand marks of any kind), filling the
whole page including the visible lined sketchbook paper background. No
characters, no people, no border/frame, no text. PNG, 1060x1484.
```

**캐릭터** (기존 `woowakgood-character.webp`를 정체성/키트 컬러 참고용으로만 첨부):
```
Using the attached character render ONLY as a loose identity/kit-color
reference (same person, same peridot-green suit with teal-violet-crimson
tie accent — dressed as a club manager, NOT a soccer kit) — redraw it
MUCH more crudely, like a genuinely bad drawing by a 5-year-old just
learning to hold a crayon: lopsided potato-shaped head far too big for
the body, one arm noticeably longer than the other, legs of uneven
thickness, no neck, hands and feet drawn as simple round blobs with no
fingers or toes, facial features uneven and off-center (eyes different
sizes, crooked scribbled smile), thick shaky crayon outlines that
overshoot and don't fully close, color scribbled sloppily outside the
lines with visible gaps of blank space showing through, no shading, no
clean linework, no correct anatomy or proportion anywhere, no real car
logos, badges, or brand marks anywhere on the outfit. This must look like
an actual amateur child's homework drawing — clumsy and a little ugly —
NOT cute, NOT polished, NOT chibi, NOT a skillful "bad on purpose"
stylization; it should read as genuinely, artlessly poorly drawn. Draw a
crude standing pose with arms crossed and a big lopsided grin. No frame,
no text, no background — fully transparent PNG with alpha channel,
1060x1484, leave open space above the head and below the waist for
name/stat overlays.
```

---

## 이스터에그: 90년대 고전 도트 (8-Bit Arcade Edition) 3D 카드 (선수별로 각각 생성 — 미구현)

기본(실사풍) 카드, 위 저퀄리티(크레파스) 카드에 이어 세 번째 카드 비주얼 버전. 90년대 아케이드 축구 게임의 "플레이어 선택 화면"을 컨셉으로, 픽셀 아트로 그려진 캐릭터와 CRT 모니터 주사선(스캔라인) 필터가 핵심 비주얼. 팝업을 열 때 **처음 한 번은 기본/저퀄리티/고전도트 3가지 중 1/3 확률로 랜덤 선택**되고, **그다음부터는 열 때마다 직전 버전의 다음 순서로 순환**(기본 → 저퀄리티 → 고전도트 → 기본 → ...)되도록 할 예정 — 연속으로 같은 버전이 두 번 뜨지 않음, 선수별로 독립적으로 굴림(기존 `totyCardLowQualityRoll.ts`를 2-way에서 3-way 순환으로 확장). 카드가 한 번 공개된 뒤에는 팝업 좌상단에 select 드롭다운을 띄워서 세 버전 중 원하는 걸 직접 골라볼 수 있게 할 예정. **이 문서에서는 이미지 프롬프트만 먼저 정리하고, 롤링 로직·select UI 코드는 이후 별도로 구현함.**

저퀄리티 버전과 동일하게 **프레임/배경/캐릭터 3장만** 따로 만들고, **캐릭터 호버 대체 이미지와 배경 반짝임(빛 효과) 오버레이는 이 버전에서도 쓰지 않음**(아케이드 게임의 캐릭터 선택 화면 스프라이트라는 컨셉상 그런 연출이 없는 게 자연스러움). 카드 뒷면(`<id>-card-back.webp`), 리빌 연출, 팝업 배경은 전부 기존 것 그대로 사용 — 뒤집었을 때 앞면 그림 3장만 픽셀 아트로 바뀌는 것.

- **캔버스**: 1060×1484px (다른 3장과 동일 비율). **프레임**과 **캐릭터**는 알파 채널 있는 투명 PNG(도안 바깥은 완전 투명), **배경**은 불투명 PNG(CRT 스캔라인·비네트까지 포함해서 꽉 채움).
- **레퍼런스**: 저퀄리티 버전과 동일한 방식 — 프레임은 그 선수의 이미 생성된 `<id>-frame.webp`를 실루엣·모티프·컬러 참고용으로 첨부("그 프레임을 픽셀 아트로 다시 그린 버전"을 만드는 것). 배경은 참고 이미지 불필요. 캐릭터는 그 선수의 이미 생성된 `<id>-character.webp`를 정체성/키트 컬러 참고용으로만 첨부(스트리머 실사진이 아님) — 포즈는 그대로 베끼지 않고 새 스프라이트 포즈로.
- **파일명**: `<id>-retro-frame.webp`, `<id>-retro-background.webp`, `<id>-retro-character.webp`. 변환 스크립트를 그대로 재사용 가능 — PNG 3장을 `public/test/`에 `frame.png`/`background.png`/`character.png`로 받아뒀다면:
  ```bash
  pnpm convert:card-art -- <id>-retro
  ```
  (예: 다시바용이면 `pnpm convert:card-art -- tdnlamuron-retro`) — `<id>-retro`를 그대로 id처럼 넘기면 파일명 규칙이 자동으로 맞음.
- **자동 인식**: 저퀄리티의 `getLowQualityTotyCardAssets`와 같은 방식으로 `-retro-` 트리오를 따로 스캔하는 함수를 추가할 예정 — 3장이 모두 갖춰진 선수만 이 버전 대상이 되고, 아직 없는 선수는 롤링 시 이 옵션이 빠짐(=순차 추가 가능).
- **스탯 폰트 주의**: "레트로 게임 폰트로 표시된 스탯"은 사용자가 폰트 파일을 나중에 전달할 예정 — 그러므로 아래 프롬프트에는 읽을 수 있는 텍스트/숫자/스탯 UI를 절대 그리지 않도록 명시해뒀음. 실제 스탯 표기는 전부 코드 쪽에서 그 폰트를 적용한 CSS 오버레이로 처리할 것.
- **공용 8비트 화풍 문구 (프레임/캐릭터용)**: 아래 12명 프레임·캐릭터 프롬프트 전부 다음 문구를 그대로 포함함 — *"in the style of a 1990s arcade soccer video game's character-select screen — chunky 16-bit-era pixel art, hard-edged square pixels with zero anti-aliasing, a strictly limited retro color palette with visible dithering instead of smooth gradients, thick solid pixel outlines, flat blocky shading in only two or three tones per color, a subtle CRT scanline filter (fine horizontal lines) and a faint warm phosphor glow laid over the whole image — looks like an actual screenshot from a real 16-bit arcade cabinet, NOT a smooth modern 'pixelated filter' illustration, NOT vector art, NOT a high-resolution digital painting."*
- **공용 8비트 화풍 문구 (배경용)**: 아래 12명 배경 프롬프트 전부 다음 문구를 그대로 포함함 — *"in the style of a 1990s arcade soccer video game's full-screen background art — chunky 16-bit-era pixel art tile work, hard-edged square pixels with zero anti-aliasing, a strictly limited retro color palette with visible dithering instead of smooth gradients, a subtle CRT scanline filter (fine horizontal lines) running across the whole image, a faint warm phosphor glow, and a soft dark vignette fading in at the very edges like the curved glass and bezel of an old arcade cabinet monitor — looks like an actual screenshot from a real 16-bit arcade cabinet, NOT a smooth modern 'pixelated filter' illustration, NOT vector art, NOT a high-resolution digital painting."*
- **우왁굳(보너스) 주의**: 위 저퀄리티 섹션과 동일하게, 실제 BMW 로고/라운델/워드마크를 그대로 그리게 하면 안 됨 — 아래 우왁굳 고전도트 프롬프트에도 같은 금지 문구를 넣어뒀으니 생성 결과에 실제 브랜드 마크가 비치면 반드시 다시 생성할 것.

### 1. 다시바 — `tdnlamuron`

**프레임** (기존 `tdnlamuron-frame.webp`를 실루엣+모티프+컬러 참고용으로 첨부):
```
A trading-card frame in the style of a 1990s arcade soccer video game's
character-select screen — chunky 16-bit-era pixel art, hard-edged square
pixels with zero anti-aliasing, a strictly limited retro color palette
with visible dithering instead of smooth gradients, thick solid pixel
outlines, flat blocky shading in only two or three tones per color, a
subtle CRT scanline filter (fine horizontal lines) and a faint warm
phosphor glow laid over the whole image — looks like an actual
screenshot from a real 16-bit arcade cabinet, NOT a smooth modern
"pixelated filter" illustration, NOT vector art, NOT a high-resolution
digital painting. Using the attached card frame image as a full
reference (not just a shape) — same shield-shaped outer silhouette,
same crest bump at the top center, same inner window opening, and the
same molten-lava/ember motif and orange-and-black color palette already
on it — rebuild this exact frame entirely out of visible square pixel
blocks with thick solid outlines, keeping the same corner decoration
idea. No player, no text, no stats. Entire canvas outside the drawn
shield's own outline (including the inner window) must be fully
transparent. PNG with alpha channel, 1060x1484.
```

**배경**:
```
A trading-card background in the style of a 1990s arcade soccer video
game's full-screen background art — chunky 16-bit-era pixel art tile
work, hard-edged square pixels with zero anti-aliasing, a strictly
limited retro color palette with visible dithering instead of smooth
gradients, a subtle CRT scanline filter (fine horizontal lines) running
across the whole image, a faint warm phosphor glow, and a soft dark
vignette fading in at the very edges like the curved glass and bezel of
an old arcade cabinet monitor — looks like an actual screenshot from a
real 16-bit arcade cabinet, NOT a smooth modern "pixelated filter"
illustration, NOT vector art, NOT a high-resolution digital painting.
Portrait orientation, a pixel-art volcanic rock stage backdrop with
blocky orange-and-black lava cracks glowing across the ground and a
chunky pixelated volcano silhouette erupting in the distance, drifting
square-pixel embers. No characters, no people, no border/frame, no
readable text, no UI elements, no numbers. PNG, 1060x1484.
```

**캐릭터** (기존 `tdnlamuron-character.webp`를 정체성/키트 컬러 참고용으로만 첨부):
```
Using the attached character render ONLY as a loose identity/kit-color
reference (same person, same apricot-orange and cream soccer kit) —
redraw it entirely in the style of a 1990s arcade soccer video game's
character-select screen — chunky 16-bit-era pixel art, hard-edged square
pixels with zero anti-aliasing, a strictly limited retro color palette
with visible dithering instead of smooth gradients, thick solid pixel
outlines, flat blocky shading in only two or three tones per color, a
subtle CRT scanline filter (fine horizontal lines) and a faint warm
phosphor glow laid over the whole image — looks like an actual
screenshot from a real 16-bit arcade cabinet, NOT a smooth modern
"pixelated filter" illustration, NOT vector art, NOT a high-resolution
digital painting. Draw a confident running-dribble sprite pose, ball
pixelated at the feet mid-stride, facing slightly toward the viewer like
a character-select portrait. No frame, no text, no background — fully
transparent PNG with alpha channel, 1060x1484, leave open space above
the head and below the waist for name/stat overlays.
```

### 2. 쥬멩이 — `ju010228`

**프레임** (기존 `ju010228-frame.webp`를 실루엣+모티프+컬러 참고용으로 첨부):
```
A trading-card frame in the style of a 1990s arcade soccer video game's
character-select screen — chunky 16-bit-era pixel art, hard-edged square
pixels with zero anti-aliasing, a strictly limited retro color palette
with visible dithering instead of smooth gradients, thick solid pixel
outlines, flat blocky shading in only two or three tones per color, a
subtle CRT scanline filter (fine horizontal lines) and a faint warm
phosphor glow laid over the whole image — looks like an actual
screenshot from a real 16-bit arcade cabinet, NOT a smooth modern
"pixelated filter" illustration, NOT vector art, NOT a high-resolution
digital painting. Using the attached card frame image as a full
reference (not just a shape) — same shield-shaped outer silhouette,
same crest bump at the top center, same inner window opening, and the
same spring-vine/budding-leaf motif and lime-green color palette already
on it — rebuild this exact frame entirely out of visible square pixel
blocks with thick solid outlines, keeping the same corner decoration
idea. No player, no text, no stats. Entire canvas outside the drawn
shield's own outline (including the inner window) must be fully
transparent. PNG with alpha channel, 1060x1484.
```

**배경**:
```
A trading-card background in the style of a 1990s arcade soccer video
game's full-screen background art — chunky 16-bit-era pixel art tile
work, hard-edged square pixels with zero anti-aliasing, a strictly
limited retro color palette with visible dithering instead of smooth
gradients, a subtle CRT scanline filter (fine horizontal lines) running
across the whole image, a faint warm phosphor glow, and a soft dark
vignette fading in at the very edges like the curved glass and bezel of
an old arcade cabinet monitor — looks like an actual screenshot from a
real 16-bit arcade cabinet, NOT a smooth modern "pixelated filter"
illustration, NOT vector art, NOT a high-resolution digital painting.
Portrait orientation, a pixel-art spring meadow stage backdrop with
blocky lime-green vines and chunky leaf-shaped bushes lining the ground,
a few square-pixel flower dots scattered around. No characters, no
people, no border/frame, no readable text, no UI elements, no numbers.
PNG, 1060x1484.
```

**캐릭터** (기존 `ju010228-character.webp`를 정체성/키트 컬러 참고용으로만 첨부):
```
Using the attached character render ONLY as a loose identity/kit-color
reference (same person, same lime-green and white soccer kit) — redraw
it entirely in the style of a 1990s arcade soccer video game's
character-select screen — chunky 16-bit-era pixel art, hard-edged square
pixels with zero anti-aliasing, a strictly limited retro color palette
with visible dithering instead of smooth gradients, thick solid pixel
outlines, flat blocky shading in only two or three tones per color, a
subtle CRT scanline filter (fine horizontal lines) and a faint warm
phosphor glow laid over the whole image — looks like an actual
screenshot from a real 16-bit arcade cabinet, NOT a smooth modern
"pixelated filter" illustration, NOT vector art, NOT a high-resolution
digital painting. Draw a joyful victory-jump sprite pose, one pixelated
fist raised overhead, facing slightly toward the viewer like a
character-select portrait. No frame, no text, no background — fully
transparent PNG with alpha channel, 1060x1484, leave open space above
the head and below the waist for name/stat overlays.
```

### 3. 문모모 — `doormomo`

**프레임** (기존 `doormomo-frame.webp`를 실루엣+모티프+컬러 참고용으로 첨부):
```
A trading-card frame in the style of a 1990s arcade soccer video game's
character-select screen — chunky 16-bit-era pixel art, hard-edged square
pixels with zero anti-aliasing, a strictly limited retro color palette
with visible dithering instead of smooth gradients, thick solid pixel
outlines, flat blocky shading in only two or three tones per color, a
subtle CRT scanline filter (fine horizontal lines) and a faint warm
phosphor glow laid over the whole image — looks like an actual
screenshot from a real 16-bit arcade cabinet, NOT a smooth modern
"pixelated filter" illustration, NOT vector art, NOT a high-resolution
digital painting. Using the attached card frame image as a full
reference (not just a shape) — same shield-shaped outer silhouette,
same crest bump at the top center, same inner window opening, and the
same magic-circle/rune motif and purple color palette already on it —
rebuild this exact frame entirely out of visible square pixel blocks
with thick solid outlines, keeping the same corner decoration idea. No
player, no text, no stats. Entire canvas outside the drawn shield's own
outline (including the inner window) must be fully transparent. PNG with
alpha channel, 1060x1484.
```

**배경**:
```
A trading-card background in the style of a 1990s arcade soccer video
game's full-screen background art — chunky 16-bit-era pixel art tile
work, hard-edged square pixels with zero anti-aliasing, a strictly
limited retro color palette with visible dithering instead of smooth
gradients, a subtle CRT scanline filter (fine horizontal lines) running
across the whole image, a faint warm phosphor glow, and a soft dark
vignette fading in at the very edges like the curved glass and bezel of
an old arcade cabinet monitor — looks like an actual screenshot from a
real 16-bit arcade cabinet, NOT a smooth modern "pixelated filter"
illustration, NOT vector art, NOT a high-resolution digital painting.
Portrait orientation, a pixel-art ancient stone-chamber stage backdrop
with a blocky purple magic-circle etched into the floor and chunky
rune-carved pillars flanking the sides, glowing pixel-block sigils. No
characters, no people, no border/frame, no readable text, no UI
elements, no numbers. PNG, 1060x1484.
```

**캐릭터** (기존 `doormomo-character.webp`를 정체성/키트 컬러 참고용으로만 첨부):
```
Using the attached character render ONLY as a loose identity/kit-color
reference (same person, same purple and silver soccer kit) — redraw it
entirely in the style of a 1990s arcade soccer video game's
character-select screen — chunky 16-bit-era pixel art, hard-edged square
pixels with zero anti-aliasing, a strictly limited retro color palette
with visible dithering instead of smooth gradients, thick solid pixel
outlines, flat blocky shading in only two or three tones per color, a
subtle CRT scanline filter (fine horizontal lines) and a faint warm
phosphor glow laid over the whole image — looks like an actual
screenshot from a real 16-bit arcade cabinet, NOT a smooth modern
"pixelated filter" illustration, NOT vector art, NOT a high-resolution
digital painting. Draw a calm ready-stance sprite pose, arms crossed,
ball resting pixelated under one foot, facing slightly toward the viewer
like a character-select portrait. No frame, no text, no background —
fully transparent PNG with alpha channel, 1060x1484, leave open space
above the head and below the waist for name/stat overlays.
```

### 4. 뽀린걸 — `bboringirl`

**프레임** (기존 `bboringirl-frame.webp`를 실루엣+모티프+컬러 참고용으로 첨부):
```
A trading-card frame in the style of a 1990s arcade soccer video game's
character-select screen — chunky 16-bit-era pixel art, hard-edged square
pixels with zero anti-aliasing, a strictly limited retro color palette
with visible dithering instead of smooth gradients, thick solid pixel
outlines, flat blocky shading in only two or three tones per color, a
subtle CRT scanline filter (fine horizontal lines) and a faint warm
phosphor glow laid over the whole image — looks like an actual
screenshot from a real 16-bit arcade cabinet, NOT a smooth modern
"pixelated filter" illustration, NOT vector art, NOT a high-resolution
digital painting. Using the attached card frame image as a full
reference (not just a shape) — same shield-shaped outer silhouette,
same crest bump at the top center, same inner window opening, and the
same robot-plate/circuit motif and gray-and-red color palette already on
it — rebuild this exact frame entirely out of visible square pixel
blocks with thick solid outlines, keeping the same corner decoration
idea. No player, no text, no stats. Entire canvas outside the drawn
shield's own outline (including the inner window) must be fully
transparent. PNG with alpha channel, 1060x1484.
```

**배경**:
```
A trading-card background in the style of a 1990s arcade soccer video
game's full-screen background art — chunky 16-bit-era pixel art tile
work, hard-edged square pixels with zero anti-aliasing, a strictly
limited retro color palette with visible dithering instead of smooth
gradients, a subtle CRT scanline filter (fine horizontal lines) running
across the whole image, a faint warm phosphor glow, and a soft dark
vignette fading in at the very edges like the curved glass and bezel of
an old arcade cabinet monitor — looks like an actual screenshot from a
real 16-bit arcade cabinet, NOT a smooth modern "pixelated filter"
illustration, NOT vector art, NOT a high-resolution digital painting.
Portrait orientation, a pixel-art robotic factory-floor stage backdrop
with blocky gunmetal-gray armor panels lining the ground and chunky red
circuit-line pixels running across them, a few glowing pixel-block
conduit lights. No characters, no people, no border/frame, no readable
text, no UI elements, no numbers. PNG, 1060x1484.
```

**캐릭터** (기존 `bboringirl-character.webp`를 정체성/키트 컬러 참고용으로만 첨부):
```
Using the attached character render ONLY as a loose identity/kit-color
reference (same person, same gunmetal-gray kit with red trim) — redraw
it entirely in the style of a 1990s arcade soccer video game's
character-select screen — chunky 16-bit-era pixel art, hard-edged square
pixels with zero anti-aliasing, a strictly limited retro color palette
with visible dithering instead of smooth gradients, thick solid pixel
outlines, flat blocky shading in only two or three tones per color, a
subtle CRT scanline filter (fine horizontal lines) and a faint warm
phosphor glow laid over the whole image — looks like an actual
screenshot from a real 16-bit arcade cabinet, NOT a smooth modern
"pixelated filter" illustration, NOT vector art, NOT a high-resolution
digital painting. Draw a determined pointing-forward sprite pose,
mid-stride as if directing a teammate, facing slightly toward the viewer
like a character-select portrait. No frame, no text, no background —
fully transparent PNG with alpha channel, 1060x1484, leave open space
above the head and below the waist for name/stat overlays.
```

### 5. 한결 — `kaksjak0730`

**프레임** (기존 `kaksjak0730-frame.webp`를 실루엣+모티프+컬러 참고용으로 첨부):
```
A trading-card frame in the style of a 1990s arcade soccer video game's
character-select screen — chunky 16-bit-era pixel art, hard-edged square
pixels with zero anti-aliasing, a strictly limited retro color palette
with visible dithering instead of smooth gradients, thick solid pixel
outlines, flat blocky shading in only two or three tones per color, a
subtle CRT scanline filter (fine horizontal lines) and a faint warm
phosphor glow laid over the whole image — looks like an actual
screenshot from a real 16-bit arcade cabinet, NOT a smooth modern
"pixelated filter" illustration, NOT vector art, NOT a high-resolution
digital painting. Using the attached card frame image as a full
reference (not just a shape) — same shield-shaped outer silhouette,
same crest bump at the top center, same inner window opening, and the
same night-sky/glass-shard motif and black-and-blue color palette
already on it — rebuild this exact frame entirely out of visible square
pixel blocks with thick solid outlines, keeping the same corner
decoration idea. No player, no text, no stats. Entire canvas outside the
drawn shield's own outline (including the inner window) must be fully
transparent. PNG with alpha channel, 1060x1484.
```

**배경**:
```
A trading-card background in the style of a 1990s arcade soccer video
game's full-screen background art — chunky 16-bit-era pixel art tile
work, hard-edged square pixels with zero anti-aliasing, a strictly
limited retro color palette with visible dithering instead of smooth
gradients, a subtle CRT scanline filter (fine horizontal lines) running
across the whole image, a faint warm phosphor glow, and a soft dark
vignette fading in at the very edges like the curved glass and bezel of
an old arcade cabinet monitor — looks like an actual screenshot from a
real 16-bit arcade cabinet, NOT a smooth modern "pixelated filter"
illustration, NOT vector art, NOT a high-resolution digital painting.
Portrait orientation, a pixel-art midnight stadium stage backdrop with a
blocky dark-navy night sky full of small square-pixel stars and a few
jagged blue glass-shard silhouettes jutting up from the ground. No
characters, no people, no border/frame, no readable text, no UI
elements, no numbers. PNG, 1060x1484.
```

**캐릭터** (기존 `kaksjak0730-character.webp`를 정체성/키트 컬러 참고용으로만 첨부):
```
Using the attached character render ONLY as a loose identity/kit-color
reference (same person, same matte black kit with sapphire-blue trim) —
redraw it entirely in the style of a 1990s arcade soccer video game's
character-select screen — chunky 16-bit-era pixel art, hard-edged square
pixels with zero anti-aliasing, a strictly limited retro color palette
with visible dithering instead of smooth gradients, thick solid pixel
outlines, flat blocky shading in only two or three tones per color, a
subtle CRT scanline filter (fine horizontal lines) and a faint warm
phosphor glow laid over the whole image — looks like an actual
screenshot from a real 16-bit arcade cabinet, NOT a smooth modern
"pixelated filter" illustration, NOT vector art, NOT a high-resolution
digital painting. Draw a free-kick wind-up sprite pose, one leg cocked
back mid-swing, facing slightly toward the viewer like a character-select
portrait. No frame, no text, no background — fully transparent PNG with
alpha channel, 1060x1484, leave open space above the head and below the
waist for name/stat overlays.
```

### 6. 핑구 — `sjh4018`

**프레임** (기존 `sjh4018-frame.webp`를 실루엣+모티프+컬러 참고용으로 첨부):
```
A trading-card frame in the style of a 1990s arcade soccer video game's
character-select screen — chunky 16-bit-era pixel art, hard-edged square
pixels with zero anti-aliasing, a strictly limited retro color palette
with visible dithering instead of smooth gradients, thick solid pixel
outlines, flat blocky shading in only two or three tones per color, a
subtle CRT scanline filter (fine horizontal lines) and a faint warm
phosphor glow laid over the whole image — looks like an actual
screenshot from a real 16-bit arcade cabinet, NOT a smooth modern
"pixelated filter" illustration, NOT vector art, NOT a high-resolution
digital painting. Using the attached card frame image as a full
reference (not just a shape) — same shield-shaped outer silhouette,
same crest bump at the top center, same inner window opening, and the
same cloud/feather motif and sky-blue-and-lavender color palette already
on it — rebuild this exact frame entirely out of visible square pixel
blocks with thick solid outlines, keeping the same corner decoration
idea. No player, no text, no stats. Entire canvas outside the drawn
shield's own outline (including the inner window) must be fully
transparent. PNG with alpha channel, 1060x1484.
```

**배경**:
```
A trading-card background in the style of a 1990s arcade soccer video
game's full-screen background art — chunky 16-bit-era pixel art tile
work, hard-edged square pixels with zero anti-aliasing, a strictly
limited retro color palette with visible dithering instead of smooth
gradients, a subtle CRT scanline filter (fine horizontal lines) running
across the whole image, a faint warm phosphor glow, and a soft dark
vignette fading in at the very edges like the curved glass and bezel of
an old arcade cabinet monitor — looks like an actual screenshot from a
real 16-bit arcade cabinet, NOT a smooth modern "pixelated filter"
illustration, NOT vector art, NOT a high-resolution digital painting.
Portrait orientation, a pixel-art open-sky stage backdrop with blocky
sky-blue gradient bands and a few lumpy lavender cloud shapes drifting
across, small pixel-block feather sprites scattered near the top. No
characters, no people, no border/frame, no readable text, no UI
elements, no numbers. PNG, 1060x1484.
```

**캐릭터** (기존 `sjh4018-character.webp`를 정체성/키트 컬러 참고용으로만 첨부):
```
Using the attached character render ONLY as a loose identity/kit-color
reference (same person, same sky-blue kit with pale lavender trim) —
redraw it entirely in the style of a 1990s arcade soccer video game's
character-select screen — chunky 16-bit-era pixel art, hard-edged square
pixels with zero anti-aliasing, a strictly limited retro color palette
with visible dithering instead of smooth gradients, thick solid pixel
outlines, flat blocky shading in only two or three tones per color, a
subtle CRT scanline filter (fine horizontal lines) and a faint warm
phosphor glow laid over the whole image — looks like an actual
screenshot from a real 16-bit arcade cabinet, NOT a smooth modern
"pixelated filter" illustration, NOT vector art, NOT a high-resolution
digital painting. Draw a wide defensive-stance sprite pose, both arms
held out to the sides, facing slightly toward the viewer like a
character-select portrait. No frame, no text, no background — fully
transparent PNG with alpha channel, 1060x1484, leave open space above
the head and below the waist for name/stat overlays.
```

### 7. 해파린 — `haepalin`

**프레임** (기존 `haepalin-frame.webp`를 실루엣+모티프+컬러 참고용으로 첨부):
```
A trading-card frame in the style of a 1990s arcade soccer video game's
character-select screen — chunky 16-bit-era pixel art, hard-edged square
pixels with zero anti-aliasing, a strictly limited retro color palette
with visible dithering instead of smooth gradients, thick solid pixel
outlines, flat blocky shading in only two or three tones per color, a
subtle CRT scanline filter (fine horizontal lines) and a faint warm
phosphor glow laid over the whole image — looks like an actual
screenshot from a real 16-bit arcade cabinet, NOT a smooth modern
"pixelated filter" illustration, NOT vector art, NOT a high-resolution
digital painting. Using the attached card frame image as a full
reference (not just a shape) — same shield-shaped outer silhouette,
same crest bump at the top center, same inner window opening, and the
same jellyfish/bioluminescent motif and lavender-and-purple color
palette already on it — rebuild this exact frame entirely out of visible
square pixel blocks with thick solid outlines, keeping the same corner
decoration idea. No player, no text, no stats. Entire canvas outside the
drawn shield's own outline (including the inner window) must be fully
transparent. PNG with alpha channel, 1060x1484.
```

**배경**:
```
A trading-card background in the style of a 1990s arcade soccer video
game's full-screen background art — chunky 16-bit-era pixel art tile
work, hard-edged square pixels with zero anti-aliasing, a strictly
limited retro color palette with visible dithering instead of smooth
gradients, a subtle CRT scanline filter (fine horizontal lines) running
across the whole image, a faint warm phosphor glow, and a soft dark
vignette fading in at the very edges like the curved glass and bezel of
an old arcade cabinet monitor — looks like an actual screenshot from a
real 16-bit arcade cabinet, NOT a smooth modern "pixelated filter"
illustration, NOT vector art, NOT a high-resolution digital painting.
Portrait orientation, a pixel-art deep-sea stage backdrop with a blocky
dark-purple gradient and a couple of glowing lavender pixel-block
jellyfish silhouettes with wavy tentacle pixels dangling down. No
characters, no people, no border/frame, no readable text, no UI
elements, no numbers. PNG, 1060x1484.
```

**캐릭터** (기존 `haepalin-character.webp`를 정체성/키트 컬러 참고용으로만 첨부):
```
Using the attached character render ONLY as a loose identity/kit-color
reference (same person, same pale lavender kit with deep purple trim) —
redraw it entirely in the style of a 1990s arcade soccer video game's
character-select screen — chunky 16-bit-era pixel art, hard-edged square
pixels with zero anti-aliasing, a strictly limited retro color palette
with visible dithering instead of smooth gradients, thick solid pixel
outlines, flat blocky shading in only two or three tones per color, a
subtle CRT scanline filter (fine horizontal lines) and a faint warm
phosphor glow laid over the whole image — looks like an actual
screenshot from a real 16-bit arcade cabinet, NOT a smooth modern
"pixelated filter" illustration, NOT vector art, NOT a high-resolution
digital painting. Draw a jumping-header sprite pose, both arms up
mid-air, facing slightly toward the viewer like a character-select
portrait. No frame, no text, no background — fully transparent PNG with
alpha channel, 1060x1484, leave open space above the head and below the
waist for name/stat overlays.
```

### 8. 리냐 — `lina0108`

**프레임** (기존 `lina0108-frame.webp`를 실루엣+모티프+컬러 참고용으로 첨부):
```
A trading-card frame in the style of a 1990s arcade soccer video game's
character-select screen — chunky 16-bit-era pixel art, hard-edged square
pixels with zero anti-aliasing, a strictly limited retro color palette
with visible dithering instead of smooth gradients, thick solid pixel
outlines, flat blocky shading in only two or three tones per color, a
subtle CRT scanline filter (fine horizontal lines) and a faint warm
phosphor glow laid over the whole image — looks like an actual
screenshot from a real 16-bit arcade cabinet, NOT a smooth modern
"pixelated filter" illustration, NOT vector art, NOT a high-resolution
digital painting. Using the attached card frame image as a full
reference (not just a shape) — same shield-shaped outer silhouette,
same crest bump at the top center, same inner window opening, and the
same cherry-blossom motif and vivid-pink color palette already on it —
rebuild this exact frame entirely out of visible square pixel blocks
with thick solid outlines, keeping the same corner decoration idea. No
player, no text, no stats. Entire canvas outside the drawn shield's own
outline (including the inner window) must be fully transparent. PNG with
alpha channel, 1060x1484.
```

**배경**:
```
A trading-card background in the style of a 1990s arcade soccer video
game's full-screen background art — chunky 16-bit-era pixel art tile
work, hard-edged square pixels with zero anti-aliasing, a strictly
limited retro color palette with visible dithering instead of smooth
gradients, a subtle CRT scanline filter (fine horizontal lines) running
across the whole image, a faint warm phosphor glow, and a soft dark
vignette fading in at the very edges like the curved glass and bezel of
an old arcade cabinet monitor — looks like an actual screenshot from a
real 16-bit arcade cabinet, NOT a smooth modern "pixelated filter"
illustration, NOT vector art, NOT a high-resolution digital painting.
Portrait orientation, a pixel-art cherry-blossom park stage backdrop with
a blocky pink tree branch reaching in from one side and small square-
pixel petal dots drifting through the air. No characters, no people, no
border/frame, no readable text, no UI elements, no numbers. PNG,
1060x1484.
```

**캐릭터** (기존 `lina0108-character.webp`를 정체성/키트 컬러 참고용으로만 첨부):
```
Using the attached character render ONLY as a loose identity/kit-color
reference (same person, same vivid pink kit with pale-pink trim) —
redraw it entirely in the style of a 1990s arcade soccer video game's
character-select screen — chunky 16-bit-era pixel art, hard-edged square
pixels with zero anti-aliasing, a strictly limited retro color palette
with visible dithering instead of smooth gradients, thick solid pixel
outlines, flat blocky shading in only two or three tones per color, a
subtle CRT scanline filter (fine horizontal lines) and a faint warm
phosphor glow laid over the whole image — looks like an actual
screenshot from a real 16-bit arcade cabinet, NOT a smooth modern
"pixelated filter" illustration, NOT vector art, NOT a high-resolution
digital painting. Draw a cheerful sprinting sprite pose, one hand waving
toward the viewer, facing slightly toward the viewer like a
character-select portrait. No frame, no text, no background — fully
transparent PNG with alpha channel, 1060x1484, leave open space above
the head and below the waist for name/stat overlays.
```

### 9. 빙밍 — `tleod1818`

**프레임** (기존 `tleod1818-frame.webp`를 실루엣+모티프+컬러 참고용으로 첨부):
```
A trading-card frame in the style of a 1990s arcade soccer video game's
character-select screen — chunky 16-bit-era pixel art, hard-edged square
pixels with zero anti-aliasing, a strictly limited retro color palette
with visible dithering instead of smooth gradients, thick solid pixel
outlines, flat blocky shading in only two or three tones per color, a
subtle CRT scanline filter (fine horizontal lines) and a faint warm
phosphor glow laid over the whole image — looks like an actual
screenshot from a real 16-bit arcade cabinet, NOT a smooth modern
"pixelated filter" illustration, NOT vector art, NOT a high-resolution
digital painting. Using the attached card frame image as a full
reference (not just a shape) — same shield-shaped outer silhouette,
same crest bump at the top center, same inner window opening, and the
same storm/lightning motif and navy-and-emerald color palette already on
it — rebuild this exact frame entirely out of visible square pixel
blocks with thick solid outlines, keeping the same corner decoration
idea. No player, no text, no stats. Entire canvas outside the drawn
shield's own outline (including the inner window) must be fully
transparent. PNG with alpha channel, 1060x1484.
```

**배경**:
```
A trading-card background in the style of a 1990s arcade soccer video
game's full-screen background art — chunky 16-bit-era pixel art tile
work, hard-edged square pixels with zero anti-aliasing, a strictly
limited retro color palette with visible dithering instead of smooth
gradients, a subtle CRT scanline filter (fine horizontal lines) running
across the whole image, a faint warm phosphor glow, and a soft dark
vignette fading in at the very edges like the curved glass and bezel of
an old arcade cabinet monitor — looks like an actual screenshot from a
real 16-bit arcade cabinet, NOT a smooth modern "pixelated filter"
illustration, NOT vector art, NOT a high-resolution digital painting.
Portrait orientation, a pixel-art stormy pitch stage backdrop with a
blocky dark-navy sky full of lumpy storm-cloud pixels and a jagged
emerald-green lightning-bolt streak cutting across it. No characters, no
people, no border/frame, no readable text, no UI elements, no numbers.
PNG, 1060x1484.
```

**캐릭터** (기존 `tleod1818-character.webp`를 정체성/키트 컬러 참고용으로만 첨부):
```
Using the attached character render ONLY as a loose identity/kit-color
reference (same person, same dark navy kit with emerald trim) — redraw
it entirely in the style of a 1990s arcade soccer video game's
character-select screen — chunky 16-bit-era pixel art, hard-edged square
pixels with zero anti-aliasing, a strictly limited retro color palette
with visible dithering instead of smooth gradients, thick solid pixel
outlines, flat blocky shading in only two or three tones per color, a
subtle CRT scanline filter (fine horizontal lines) and a faint warm
phosphor glow laid over the whole image — looks like an actual
screenshot from a real 16-bit arcade cabinet, NOT a smooth modern
"pixelated filter" illustration, NOT vector art, NOT a high-resolution
digital painting. Draw a mid-slide-tackle sprite pose, leaning sideways
with one leg stretched out, facing slightly toward the viewer like a
character-select portrait. No frame, no text, no background — fully
transparent PNG with alpha channel, 1060x1484, leave open space above
the head and below the waist for name/stat overlays.
```

### 10. 재닌 — `janine95kim`

**프레임** (기존 `janine95kim-frame.webp`를 실루엣+모티프+컬러 참고용으로 첨부):
```
A trading-card frame in the style of a 1990s arcade soccer video game's
character-select screen — chunky 16-bit-era pixel art, hard-edged square
pixels with zero anti-aliasing, a strictly limited retro color palette
with visible dithering instead of smooth gradients, thick solid pixel
outlines, flat blocky shading in only two or three tones per color, a
subtle CRT scanline filter (fine horizontal lines) and a faint warm
phosphor glow laid over the whole image — looks like an actual
screenshot from a real 16-bit arcade cabinet, NOT a smooth modern
"pixelated filter" illustration, NOT vector art, NOT a high-resolution
digital painting. Using the attached card frame image as a full
reference (not just a shape) — same shield-shaped outer silhouette,
same crest bump at the top center, same inner window opening, and the
same frost/aurora motif and sky-blue-and-white color palette already on
it — rebuild this exact frame entirely out of visible square pixel
blocks with thick solid outlines, keeping the same corner decoration
idea. No player, no text, no stats. Entire canvas outside the drawn
shield's own outline (including the inner window) must be fully
transparent. PNG with alpha channel, 1060x1484.
```

**배경**:
```
A trading-card background in the style of a 1990s arcade soccer video
game's full-screen background art — chunky 16-bit-era pixel art tile
work, hard-edged square pixels with zero anti-aliasing, a strictly
limited retro color palette with visible dithering instead of smooth
gradients, a subtle CRT scanline filter (fine horizontal lines) running
across the whole image, a faint warm phosphor glow, and a soft dark
vignette fading in at the very edges like the curved glass and bezel of
an old arcade cabinet monitor — looks like an actual screenshot from a
real 16-bit arcade cabinet, NOT a smooth modern "pixelated filter"
illustration, NOT vector art, NOT a high-resolution digital painting.
Portrait orientation, a pixel-art frozen pitch stage backdrop with blocky
sky-blue-and-white snowdrift mounds and a faint pixelated aurora band
glowing across the sky, a few small snowflake-shaped pixel sprites
drifting down. No characters, no people, no border/frame, no readable
text, no UI elements, no numbers. PNG, 1060x1484.
```

**캐릭터** (기존 `janine95kim-character.webp`를 정체성/키트 컬러 참고용으로만 첨부):
```
Using the attached character render ONLY as a loose identity/kit-color
reference (same person, same sky-blue goalkeeper kit) — redraw it
entirely in the style of a 1990s arcade soccer video game's
character-select screen — chunky 16-bit-era pixel art, hard-edged square
pixels with zero anti-aliasing, a strictly limited retro color palette
with visible dithering instead of smooth gradients, thick solid pixel
outlines, flat blocky shading in only two or three tones per color, a
subtle CRT scanline filter (fine horizontal lines) and a faint warm
phosphor glow laid over the whole image — looks like an actual
screenshot from a real 16-bit arcade cabinet, NOT a smooth modern
"pixelated filter" illustration, NOT vector art, NOT a high-resolution
digital painting. Draw a diving-save sprite pose, both arms stretched out
sideways mid-air, facing slightly toward the viewer like a
character-select portrait. No frame, no text, no background — fully
transparent PNG with alpha channel, 1060x1484, leave open space above
the head and below the waist for name/stat overlays.
```

### 11. 하치 (보너스) — `hachi97`

**프레임** (기존 `hachi97-frame.webp`를 실루엣+모티프+컬러 참고용으로 첨부):
```
A trading-card frame in the style of a 1990s arcade soccer video game's
character-select screen — chunky 16-bit-era pixel art, hard-edged square
pixels with zero anti-aliasing, a strictly limited retro color palette
with visible dithering instead of smooth gradients, thick solid pixel
outlines, flat blocky shading in only two or three tones per color, a
subtle CRT scanline filter (fine horizontal lines) and a faint warm
phosphor glow laid over the whole image — looks like an actual
screenshot from a real 16-bit arcade cabinet, NOT a smooth modern
"pixelated filter" illustration, NOT vector art, NOT a high-resolution
digital painting. Using the attached card frame image as a full
reference (not just a shape) — same shield-shaped outer silhouette,
same crest bump at the top center, same inner window opening, and the
same dragon-claw/dragon-scale motif and golden-amber + amethyst-violet
color palette already on it — rebuild this exact frame entirely out of
visible square pixel blocks with thick solid outlines, keeping the same
corner decoration idea. No player, no text, no stats. Entire canvas
outside the drawn shield's own outline (including the inner window) must
be fully transparent. PNG with alpha channel, 1060x1484.
```

**배경**:
```
A trading-card background in the style of a 1990s arcade soccer video
game's full-screen background art — chunky 16-bit-era pixel art tile
work, hard-edged square pixels with zero anti-aliasing, a strictly
limited retro color palette with visible dithering instead of smooth
gradients, a subtle CRT scanline filter (fine horizontal lines) running
across the whole image, a faint warm phosphor glow, and a soft dark
vignette fading in at the very edges like the curved glass and bezel of
an old arcade cabinet monitor — looks like an actual screenshot from a
real 16-bit arcade cabinet, NOT a smooth modern "pixelated filter"
illustration, NOT vector art, NOT a high-resolution digital painting.
Portrait orientation, a pixel-art dragon-lair stage backdrop with blocky
golden-amber rock formations and a couple of chunky amethyst-violet
dragon-claw silhouettes jutting up from the ground, a few glowing
pixel-block ember sprites. No characters, no people, no border/frame, no
readable text, no UI elements, no numbers. PNG, 1060x1484.
```

**캐릭터** (기존 `hachi97-character.webp`를 정체성/키트 컬러 참고용으로만 첨부):
```
Using the attached character render ONLY as a loose identity/kit-color
reference (same person, same golden-amber and amethyst-violet
dragon-themed kit) — redraw it entirely in the style of a 1990s arcade
soccer video game's character-select screen — chunky 16-bit-era pixel
art, hard-edged square pixels with zero anti-aliasing, a strictly
limited retro color palette with visible dithering instead of smooth
gradients, thick solid pixel outlines, flat blocky shading in only two
or three tones per color, a subtle CRT scanline filter (fine horizontal
lines) and a faint warm phosphor glow laid over the whole image — looks
like an actual screenshot from a real 16-bit arcade cabinet, NOT a
smooth modern "pixelated filter" illustration, NOT vector art, NOT a
high-resolution digital painting. Draw a big pixelated thumbs-up sprite
pose, facing slightly toward the viewer like a character-select
portrait. No frame, no text, no background — fully transparent PNG with
alpha channel, 1060x1484, leave open space above the head and below the
waist for name/stat overlays.
```

### 12. 우왁굳 (보너스) — `woowakgood`

**⚠️ 상표 주의**: 위 저퀄리티 섹션과 동일 — 실제 BMW 로고(키드니 그릴, 프로펠러 라운델)나 "BMW" 워드마크가 그대로 그려지면 안 됨. 아래 프롬프트에도 금지 문구를 넣어뒀지만, 생성 결과에 실제 브랜드 마크가 비치면 반드시 다시 생성할 것.

**프레임** (기존 `woowakgood-frame.webp`를 실루엣+모티프+컬러 참고용으로 첨부):
```
A trading-card frame in the style of a 1990s arcade soccer video game's
character-select screen — chunky 16-bit-era pixel art, hard-edged square
pixels with zero anti-aliasing, a strictly limited retro color palette
with visible dithering instead of smooth gradients, thick solid pixel
outlines, flat blocky shading in only two or three tones per color, a
subtle CRT scanline filter (fine horizontal lines) and a faint warm
phosphor glow laid over the whole image — looks like an actual
screenshot from a real 16-bit arcade cabinet, NOT a smooth modern
"pixelated filter" illustration, NOT vector art, NOT a high-resolution
digital painting. Using the attached card frame image as a full
reference (not just a shape) — same shield-shaped outer silhouette,
same crest bump at the top center, same inner window opening, and the
same motorsport speed-line motif and vivid peridot-green +
teal-violet-crimson racing-stripe color palette already on it — rebuild
this exact frame entirely out of visible square pixel blocks with thick
solid outlines, keeping the same corner decoration idea. No real car
logos, badges, roundels, or brand wordmarks of any kind — only generic
pixelated stripes and speed-lines. No player, no text, no stats. Entire
canvas outside the drawn shield's own outline (including the inner
window) must be fully transparent. PNG with alpha channel, 1060x1484.
```

**배경**:
```
A trading-card background in the style of a 1990s arcade soccer video
game's full-screen background art — chunky 16-bit-era pixel art tile
work, hard-edged square pixels with zero anti-aliasing, a strictly
limited retro color palette with visible dithering instead of smooth
gradients, a subtle CRT scanline filter (fine horizontal lines) running
across the whole image, a faint warm phosphor glow, and a soft dark
vignette fading in at the very edges like the curved glass and bezel of
an old arcade cabinet monitor — looks like an actual screenshot from a
real 16-bit arcade cabinet, NOT a smooth modern "pixelated filter"
illustration, NOT vector art, NOT a high-resolution digital painting.
Portrait orientation, a pixel-art night garage stage backdrop with blocky
peridot-green speed-line streaks racing across the ground and a
pixelated checkered-flag pattern in one corner (no real car logos or
brand marks of any kind). No characters, no people, no border/frame, no
readable text, no UI elements, no numbers. PNG, 1060x1484.
```

**캐릭터** (기존 `woowakgood-character.webp`를 정체성/키트 컬러 참고용으로만 첨부):
```
Using the attached character render ONLY as a loose identity/kit-color
reference (same person, same peridot-green suit with teal-violet-crimson
tie accent — dressed as a club manager, NOT a soccer kit) — redraw it
entirely in the style of a 1990s arcade soccer video game's
character-select screen — chunky 16-bit-era pixel art, hard-edged square
pixels with zero anti-aliasing, a strictly limited retro color palette
with visible dithering instead of smooth gradients, thick solid pixel
outlines, flat blocky shading in only two or three tones per color, a
subtle CRT scanline filter (fine horizontal lines) and a faint warm
phosphor glow laid over the whole image — looks like an actual
screenshot from a real 16-bit arcade cabinet, NOT a smooth modern
"pixelated filter" illustration, NOT vector art, NOT a high-resolution
digital painting. No real car logos, badges, or brand marks anywhere on
the outfit. Draw a confident arms-crossed sprite pose with a big grin,
facing slightly toward the viewer like a character-select portrait. No
frame, no text, no background — fully transparent PNG with alpha
channel, 1060x1484, leave open space above the head and below the waist
for name/stat overlays.
```

---

## 이스터에그: 하루고멤 콜라보 3D 카드 (12명 전원 매칭 + 프롬프트 작성 완료, 이미지 생성·연동 완료)

기본/저퀄리티(크레파스)/고전도트(8비트)에 이어 네 번째 카드 비주얼 버전. 우왁굳이 별도로 운영하는 "하루 고멤"(멤버마다 고유한 RP 컨셉을 가진 캐릭터들) 중 한 명을 선수 한 명과 1:1로 매칭해서, 그 멤버의 컨셉(의상·소품·분위기)을 선수 카드에 녹여 합성하는 콜라보 테마. 총 12명(선수 10명 + 보너스 2명) 전원에게 하루고멤 멤버를 매칭할 예정이며, 사용자가 멤버 이미지+설명+합성 대상 선수를 하나씩 전달할 때마다 아래에 매칭 정보를 등록하고 곧바로 프레임/배경/캐릭터 프롬프트까지 작성함(순차 추가 방식).

- **레퍼런스 방식**: 프레임 생성 시 기존 `<id>-frame.webp`(실루엣·모티프 참고) + 하루고멤 멤버 이미지(장식·테마 참고)를 함께 첨부. 배경은 참고 이미지 없이 프롬프트만으로 생성(필요하면 하루고멤 이미지를 무드 참고용으로 추가 첨부 가능). 캐릭터 생성 시 기존 `<id>-character.webp`(선수 정체성·얼굴 참고) + 하루고멤 멤버 이미지(의상·소품·포즈 컨셉 참고)를 함께 첨부해서 합성 — 선수는 그 하루고멤 멤버의 의상/소품을 입은 모습으로 재구성하되 원래 선수의 얼굴·정체성은 유지.
- **화풍**: 크레파스/8비트 버전과 달리 이 테마는 별도의 화풍 필터가 없음 — 기존 기본 카드와 동일한 세미리얼리스틱 프리미엄 3D 렌더 톤 유지, 달라지는 건 프레임 장식·배경 소재·캐릭터 의상뿐.
- **파일명**: 기존 이스터에그 명명 규칙(`-lowq-`, `-retro-`)을 따라 `<id>-harugomem-frame.webp` / `<id>-harugomem-background.webp` / `<id>-harugomem-character.webp` — 12명 전원 `src/web/assets/toty-cards/`에 저장 완료, `totyCardAssets.ts`/`totyCardVariantRoll.ts`/`TotyCardPopup.tsx`/`TotyCardVisual.tsx`에 `"harugomem"` variant로 연동 완료 (기본→저퀄리티→고전도트→하루고멤 순환 및 수동 선택 모두 지원).
- **폰트**: 포지션/디비전/이름 텍스트는 `'Eutman'`(noonfonts OKCHAN) 적용 완료 — `styles.css`의 `@font-face`, `toty-card.css`의 `.toty-card--harugomem`.
- **사운드**: 카드를 클릭했을 때 재생되는 선수별 클릭 효과음(기본 카드의 `streamer.sfx`)을 하루고멤 변형에서는 `public/sfxes/<id>-harugomem.mp3`로 교체 — 12명 전원 적용 완료 (`TotyCardPopup.tsx`의 `handleCardClick`). 팝업 오픈 시 앰비언트 스팅(`playPopupOpenSfx`)은 변형과 무관하게 원래 카드 것 그대로 유지.
- **움짤(GIF)**: `pnpm generate:toty-preview -- <id> <port> --harugomem`로 12명 전원 `<id>-harugomem-preview.gif` 생성 완료 — "움짤로 저장" 메뉴에서 다운로드 가능.

### 한결 × 천사 RP 멤버 — `kaksjak0730`

**멤버 컨셉/RP**: 천사 RP. 싸가지 없는(불량한/새침한) 태도, 등에 새하얀 천사 날개, 입에 풍선껌을 불고 있는 모습, 손에는 과하게 핑크색으로 꾸민(참 장식이 주렁주렁 달린) 핸드폰을 들고 있음. 금발 업스타일 헤어에 체크 리본 헤어핀, 베이지 가디건 + 체크 교복 미니스커트, 오프화이트 니트 레그워머, 이마에 세이프티핀 장식.

**프레임** (기존 `kaksjak0730-frame.webp` + 하루고멤 멤버 레퍼런스 이미지 첨부):
```
Using the first attached image (this player's existing card frame) ONLY as
a silhouette/structure reference — same ornate shield-shaped outer
silhouette, same scalloped border curve, same laurel-wreath crest position
at the top center, same inner content window position — and using the
second attached image (a "하루고멤" angel-concept character) as a theme
reference for materials and ornamentation only: redesign the frame's
surface material as soft pearlescent cream-white, with the corner ornaments
reimagined as small fluffy feathered angel wings and a delicate
black-and-white checkered ribbon-bow motif at the top crest, a thin trail
of tiny bubblegum-pink bubbles drifting along the inner border, faint
silver safety-pin charm details tucked into the scalloped edge. Warm soft
pink-gold glow against the cream surface. No player, no text, no stats.
Entire canvas outside the frame's own linework (including the inner
content window) must be fully transparent. PNG with alpha channel,
1060x1484.
```

**배경**:
```
Abstract premium trading-card background art, portrait orientation. Soft
pastel cream-and-blush sky with faint drifting white feathers and small
translucent bubblegum-pink bubbles floating upward, a scattering of tiny
sparkling safety-pin and checkered ribbon-bow motifs catching a warm
pink-gold rim light. No characters, no people, no border/frame, no text.
High detail, dreamy but slightly bratty/mischievous mood, 4K, PNG,
1060x1484.
```

**캐릭터** (기존 `kaksjak0730-character.webp` + 하루고멤 멤버 레퍼런스 이미지 첨부):
```
Using the first attached image ONLY as an identity/likeness reference (same
player's face and build) and the second attached image (a "하루고멤"
angel-concept character) as a costume/prop/pose reference — redraw the
player wearing that angel concept's outfit: a beige cardigan over a school
uniform with a black-and-white checkered ribbon tie, a black-and-white
plaid mini skirt, off-white knit leg warmers, soft white feathered angel
wings on the back, hair pinned up with a checkered bow and a small safety
pin accessory near the brow. Give her a bratty, unimpressed, smug
expression (never sweet or docile), blowing a bubblegum bubble from her
mouth, holding an over-decorated bright bubblegum-pink phone charm case
covered in pink beads and charms in one hand. Semi-realistic premium
trading-card 3D render style consistent with the base card set (not chibi,
not flat 2D). Viewed from a slight low front 3/4 angle, visible head to
mid-thigh. Soft warm pink-gold rim lighting. No frame, no text, no
background — fully transparent PNG with alpha channel, 1060x1484, leave
open space above the head and below the waist for name/stat overlays.
```

---

### 뽀린걸 × 라이프가드 RP 멤버 — `bboringirl`

**멤버 컨셉/RP**: 라이프가드(안전요원) RP. 금발 숏컷, 레드 바이저(챙 모자), "LIFEGUARD" 문구가 적힌 레드 홀터넥 크롭탑에 호루라기 목걸이, 하트+맥박 아이콘이 그려진 레드 응급처치 파우치를 허리에 착용, 레드 크롭탑과 어울리는 랩스커트(허리에 묶은 레드 천 + 안에 블랙/레드 반바지), 플랫폼 슬리퍼 샌들.

**프레임** (기존 `bboringirl-frame.webp` + 하루고멤 멤버 레퍼런스 이미지 첨부):
```
Using the first attached image (this player's existing card frame) ONLY as
a silhouette/structure reference — same ornate shield-shaped outer
silhouette, same scalloped border curve, same laurel-wreath crest position
at the top center, same inner content window position — and using the
second attached image (a "하루고멤" lifeguard-concept character) as a theme
reference for materials and ornamentation only: keep the frame's existing
gunmetal-grey mechanical armor-plate base, but reimagine the corner
ornaments as glossy red rescue-buoy rings and a small silver whistle charm
at the top crest, with the existing circuit-line engravings reworked into a
pulsing red heartbeat/EKG line motif tracing the inner border. Warm red
emergency-light glow against the grey metal. No player, no text, no stats.
Entire canvas outside the frame's own linework (including the inner
content window) must be fully transparent. PNG with alpha channel,
1060x1484.
```

**배경**:
```
Abstract premium trading-card background art, portrait orientation. Dim
industrial gunmetal-grey hangar texture blended with a warm poolside/beach
patrol mood — a glossy red rescue-buoy ring and a coil of red-and-white
striped rope resting in soft-focus at the edge of frame, faint red
emergency-light glow and a subtle pulsing heartbeat/EKG line motif glowing
along the lower edge. No characters, no people, no border/frame, no text.
High detail, 4K, PNG, 1060x1484.
```

**캐릭터** (기존 `bboringirl-character.webp` + 하루고멤 멤버 레퍼런스 이미지 첨부):
```
Using the first attached image ONLY as an identity/likeness reference (same
player's face and build) and the second attached image (a "하루고멤"
lifeguard-concept character) as a costume/prop/pose reference — redraw the
player wearing that lifeguard concept's outfit: a red halter-neck crop top
printed with "LIFEGUARD", a whistle on a cord necklace, a red first-aid
pouch printed with a heart/pulse icon strapped at the waist, a red wrap
skirt tied over black-and-red athletic shorts, platform slide sandals.
Confident, capable, hands-on-hips lifeguard stance. Semi-realistic premium
trading-card 3D render style consistent with the base card set (not chibi,
not flat 2D). Viewed from a slight low front 3/4 angle, visible head to
mid-thigh. Warm red rim lighting mixed with cool gunmetal undertones. No
frame, no text, no background — fully transparent PNG with alpha channel,
1060x1484, leave open space above the head and below the waist for
name/stat overlays.
```

---

### 빙밍 × 교포 컨셉 멤버 — `tleod1818`

**멤버 컨셉/RP**: 교포(해외 교포) 느낌 캐릭터. 금발에 뿌리 쪽 블랙 브릿지가 보이는 하이 포니테일(반묶음), 태닝된 피부, 손가락에 골드 링 여러 개를 낀 채 피스사인 포즈, 영문 그래픽("Thinking of you") 프린트가 들어간 핑크 크롭 티셔츠, 오버사이즈 핑크 카고 배기팬츠, 허리에 걸쳐 맨 핑크 미니 백팩, 화이트 슬라이드 샌들, 발목에 비즈 장식(앵클릿).

**프레임** (기존 `tleod1818-frame.webp` + 하루고멤 멤버 레퍼런스 이미지 첨부):
```
Using the first attached image (this player's existing card frame) ONLY as
a silhouette/structure reference — same ornate shield-shaped outer
silhouette, same scalloped border curve, same laurel-wreath crest position
at the top center, same inner content window position — and using the
second attached image (a "하루고멤" streetwear-concept character) as a
theme reference for materials and ornamentation only: keep the frame's
existing dark navy storm-cloud base and jagged emerald lightning-bolt
accents, but recolor the lightning bolts and corner ornaments to a hot
bubblegum-pink neon glow, add small gold-ring charm details at the corners
and a scattering of tiny pink bead/anklet-charm motifs along the inner
border, like the storm has been reimagined as a glossy street-fashion
neon-pink lightning theme. No player, no text, no stats. Entire canvas
outside the frame's own linework (including the inner content window) must
be fully transparent. PNG with alpha channel, 1060x1484.
```

**배경**:
```
Abstract premium trading-card background art, portrait orientation. Dark
navy stormy-sky base with jagged lightning-bolt streaks recolored into a
hot bubblegum-pink neon glow (instead of the original emerald), faint
drifting gold ring and pink bead charm particles, a subtle urban
streetwear mood — like neon city lights reflected in storm clouds. No
characters, no people, no border/frame, no text. High detail, 4K, PNG,
1060x1484.
```

**캐릭터** (기존 `tleod1818-character.webp` + 하루고멤 멤버 레퍼런스 이미지 첨부):
```
Using the first attached image ONLY as an identity/likeness reference (same
player's face and build) and the second attached image (a "하루고멤"
streetwear-concept character) as a costume/prop/pose reference — redraw
the player wearing that concept's outfit: a pink graphic crop t-shirt
printed with "Thinking of you", oversized pink cargo baggy pants, a small
pink mini backpack slung low across the hip, white slide sandals, a beaded
anklet, several gold rings on the fingers. Give the character a sun-tanned,
golden-bronze skin tone (noticeably tanned, not pale) to match the
Korean-American "gyopo" streetwear concept. Hair styled as a half-up high
ponytail matching the silhouette of the reference, keeping the player's own
original dark hair color from the first attached image as the base tone —
do NOT switch the base color to the blonde shown in the second reference
image — but since the player's base hair is dark, add a visible light
blonde/ash-blonde bridge streak near the roots (bright enough to contrast
clearly against the dark base), the same bridge/root-streak concept as the
reference but with the light/dark relationship flipped to stay visible.
Playful confident pose, both hands up near the face making peace signs.
Semi-realistic
premium trading-card 3D render style consistent with the base card set
(not chibi, not flat 2D). Viewed from a slight low front 3/4 angle, visible
head to mid-thigh. Cool navy undertones with hot neon-pink rim lighting.
No frame, no text, no background — fully transparent PNG with alpha
channel, 1060x1484, leave open space above the head and below the waist
for name/stat overlays.
```

---

### 다시바 × 쥐 수인 RP 멤버 — `tdnlamuron`

**멤버 컨셉/RP**: 쥐(마우스) 수인 컨셉. 크고 둥근 회색 쥐 귀와 은발/그레이 헤어, 무표정에 가까운 새침한 얼굴, 흑백 톤의 세일러풍 고딕 아웃핏(케이프 소매 재킷 + 타이 + 크로스 브로치와 체인 장식), 서스펜더가 달린 블랙 반바지, 화이트 니삭스, 블랙 레이스업 부츠, 귀에 작은 참 귀걸이.

**프레임** (기존 `tdnlamuron-frame.webp` + 하루고멤 멤버 레퍼런스 이미지 첨부):
```
Using the first attached image (this player's existing card frame) ONLY as
a silhouette/structure reference — same ornate shield-shaped outer
silhouette, same scalloped border curve, same laurel-wreath crest position
at the top center, same inner content window position — and using the
second attached image (a "하루고멤" mouse-kemonomimi gothic character) as a
theme reference for materials and ornamentation only: keep the frame's
existing warm apricot-orange volcanic-rock base and glowing ember cracks,
but reimagine the corner ornaments as a pair of small round grey mouse-ear
silhouettes trimmed in silver, a fine silver chain-and-cross charm draped
along the top crest, thin monochrome gothic piping tracing the scalloped
edge — silver-grey gothic ornamentation glowing warm from the embers
beneath it, like moonlight over lava rock. No player, no text, no stats.
Entire canvas outside the frame's own linework (including the inner
content window) must be fully transparent. PNG with alpha channel,
1060x1484.
```

**배경**:
```
Abstract premium trading-card background art, portrait orientation. Dim
volcanic cavern with glowing apricot-orange ember cracks in the rock, cool
silver-grey moonlight cutting across the scene, faint drifting motes that
read like both floating embers and dust in equal measure, a couple of soft
round mouse-ear-shaped rock silhouettes in the distant background. No
characters, no people, no border/frame, no text. High detail, moody
gothic-meets-molten mood, 4K, PNG, 1060x1484.
```

**캐릭터** (기존 `tdnlamuron-character.webp` + 하루고멤 멤버 레퍼런스 이미지 첨부):
```
Using the first attached image ONLY as an identity/likeness reference (same
player's face and build) and the second attached image (a "하루고멤"
mouse-kemonomimi gothic character) as a costume/prop/pose reference —
redraw the player wearing that concept's outfit: a monochrome gothic
sailor-style outfit with short cape sleeves, a black necktie with a
cross-shaped brooch and a fine draped chain, black shorts with suspenders,
white knee-high socks, black lace-up boots, and a pair of large round grey
mouse ears on top of the head. Composed, slightly aloof deadpan
expression. Semi-realistic premium trading-card 3D render style consistent
with the base card set (not chibi, not flat 2D). Viewed from a slight low
front 3/4 angle, visible head to mid-thigh. Warm ember rim lighting mixed
with cool silver-grey undertones. No frame, no text, no background — fully
transparent PNG with alpha channel, 1060x1484, leave open space above the
head and below the waist for name/stat overlays.
```

---

### 하치 × 일본 유학생 RP 멤버 — `hachi97`

**멤버 컨셉/RP**: 일본에서 유학 온 고등학생 유학생 컨셉. 긴 검은 생머리(반묶음, 흰색 리본), 차분한 미소. 라벤더 톤 교복 원피스(하얀 세일러 칼라 + 브라운 리본 타이, 퍼프 소매, 무릎 아래 A라인 스커트, 브라운 라인 밑단), 그레이 타이츠, 브라운 로퍼, 금장 버클이 달린 블랙 가죽 사첼(서류가방형 책가방)을 들고 있음.

**주의**: 하치는 보너스 리메이크 규칙상 팔레트가 **금색(골드/앰버) + 자수정(바이올렛) 용의 기운으로 고정**됨(위 "보너스: 하치" 섹션 참고, `totyCardTheme.ts`의 `hachi97` 항목과 일치). 하루고멤 유학생 컨셉의 라벤더/브라운/블랙 색감은 그 골드+자수정 팔레트 위에 얹는 디테일(리본·가방·타이 색 정도)로만 반영하고, 프레임·배경의 메인 컬러는 반드시 골드-자수정을 유지할 것 — 라벤더로 전체 톤이 바뀌면 다시 생성.

**프레임** (기존 `hachi97-frame.webp` + 하루고멤 멤버 레퍼런스 이미지 첨부, 골드+자수정 팔레트 유지):
```
Using a warm golden-amber palette with soft amethyst-violet accents (this
card's fixed dragon-fire palette — do not substitute a different color
scheme such as lavender or blue), and using the first attached image (this
player's existing lavish dragon-themed card frame) ONLY as a
silhouette/structure and color reference — same ornate shield-shaped outer
silhouette, same scalloped border curve, same coiling dragon-claw and
dragon-scale corner ornaments, same overall gold-amber/amethyst palette —
add a small refined addition inspired by the second attached image (a
"하루고멤" Japanese-exchange-student-concept character): a delicate
white-ribbon bow motif woven into the top crest alongside the dragon
emblem, and a fine gold-buckled black-leather satchel-strap texture traced
along the lower inner border. Keep the dragon claws, scales, and mystical
draconic-fire wisps as the dominant motif — the ribbon/satchel details are
a small accent, not a theme change. No player, no text, no stats. Entire
canvas outside the frame's own linework (including the inner content
window) must be fully transparent. PNG with alpha channel, 1060x1484.
```

**배경** (완성된 하치 프레임 이미지를 색상 참고용으로 함께 첨부):
```
Abstract premium trading-card background art, portrait orientation, using
the exact same warm golden-amber + amethyst-violet color palette as the
attached frame image — match those colors closely, do not introduce a
different color scheme such as lavender or blue. A dense, richly detailed
cracked slab with glowing veins, coiling dragon claws and dragon scales
bursting from one corner, wisps of mystical dragon-fire swirling through
the air, a few drifting white ribbon-like light streaks and faint
gold-buckle glints woven subtly into the sparkle/ember dust. No
characters, no people, no border/frame, no text. High detail, 4K, PNG,
1060x1484.
```

**캐릭터** (기존 `hachi97-character.webp` + 완성된 하치 프레임 이미지(색상 참고) + 하루고멤 멤버 레퍼런스 이미지 첨부):
```
Using the first attached image ONLY as an identity/likeness reference (same
player's face and build), the frame image for its exact warm golden-amber
+ amethyst-violet palette (do not introduce a different color scheme such
as lavender or blue), and the third attached image (a "하루고멤" Japanese
exchange-student character) as a costume/prop reference — redraw the
player wearing that exchange-student concept's outfit re-rendered in the
card's fixed gold-amber/amethyst palette: a school uniform dress with a
sailor collar and ribbon-tie bow, puffy long sleeves, a knee-length
A-line skirt, tights, loafers, carrying a gold-buckled black leather
satchel bag in one hand, long straight dark hair tied with a ribbon. Keep
a subtle aura of glowing draconic energy or wisps of mystical fire curling
around her (she stays fully human — a subtle aura/accessory effect, not a
literal dragon transformation), matching the lavish, higher-rarity
treatment of the rest of this card. Calm, composed, gentle smile. Viewed
from a slight low front 3/4 angle, visible head to mid-thigh. Rich,
dramatic rim lighting with a touch of sparkle/ember. No frame, no text, no
background — fully transparent PNG with alpha channel, 1060x1484, leave
open space above the head and below the waist for name/stat overlays.
```

---

### 리냐 × 수녀 RP 멤버 — `lina0108`

**멤버 컨셉/RP**: 고딕 수녀 RP. 금장 체인 트림이 들어간 블랙 베일/후드, 화이트 블라우스 위에 블랙 코르셋풍 보디스(붉은 보석 브로치), 목에 겹겹이 두른 크로스 펜던트 목걸이, 허리에 두른 골드 체인 벨트(펜던트 장식), 허벅지에 크로스 참이 달린 가터 스트랩, 화이트 삭스 위로 보이는 블랙 앵클스트랩 메리제인 힐, 곳곳에 세공된 자수정/십자가 자수 장식.

**프레임** (기존 `lina0108-frame.webp` + 하루고멤 멤버 레퍼런스 이미지 첨부):
```
Using the first attached image (this player's existing card frame) ONLY as
a silhouette/structure reference — same ornate shield-shaped outer
silhouette, same scalloped border curve, same laurel-wreath crest position
at the top center, same inner content window position — and using the
second attached image (a "하루고멤" gothic-nun-concept character) as a
theme reference for materials and ornamentation only: keep the frame's
existing vivid-pink cherry-blossom base, but reimagine the corner
ornaments as draped gold chain jewelry with small cross-shaped charms
threading through drifting sakura petals, a single soft-pink gemstone set
at the top crest like a rosary centerpiece, fine gothic filigree tracing
the scalloped edge in place of plain metalwork. Warm gold-pink glow
against the blossom-pink surface. No player, no text, no stats. Entire
canvas outside the frame's own linework (including the inner content
window) must be fully transparent. PNG with alpha channel, 1060x1484.
```

**배경**:
```
Abstract premium trading-card background art, portrait orientation. Soft
dusk garden in vivid pink and pale blush cherry-blossom tones, drifting
sakura petals catching a warm gold rim light, faint gothic stained-glass
archway silhouettes glowing softly in the background, delicate gold-chain
and cross-charm motifs woven subtly among the falling petals. No
characters, no people, no border/frame, no text. High detail, romantic
gothic-meets-sakura mood, 4K, PNG, 1060x1484.
```

**캐릭터** (기존 `lina0108-character.webp` + 하루고멤 멤버 레퍼런스 이미지 첨부):
```
Using the first attached image ONLY as an identity/likeness reference (same
player's face, hair color, and build) and the second attached image (a
"하루고멤" gothic-nun-concept character) as a costume/prop/pose reference
— redraw the player wearing that gothic-nun concept's outfit, recolored to
tie into her own vivid-pink cherry-blossom palette: a black hooded veil
trimmed with gold chain, a white blouse under a black corset-style bodice
with a soft-pink gemstone brooch, layered cross pendant necklaces, a
draped gold chain belt, cross-charm garter straps over white socks, black
ankle-strap mary jane heels. Serene, composed expression. Semi-realistic
premium trading-card 3D render style consistent with the base card set
(not chibi, not flat 2D). Viewed from a slight low front 3/4 angle,
visible head to mid-thigh. Warm gold-pink rim lighting. No frame, no
text, no background — fully transparent PNG with alpha channel,
1060x1484, leave open space above the head and below the waist for
name/stat overlays.
```

---

### 문모모 × 여왕 RP 멤버 — `doormomo`

**멤버 컨셉/RP**: 고딕 여왕 RP. 큼직한 블랙 로즈 헤드피스(보석 장식), 늘어뜨린 체인 귀걸이, 보석 초커, 오프숄더 코르셋 보디스(레이스 러플 트림), 여러 겹의 블랙 튤/레이스 튜튜 스커트, 레이스 언더스커트 사이로 보이는 망사 스타킹, 블랙 레이스업 앵클부츠, 도도하고 기품 있는 표정과 우아한 손짓.

**프레임** (기존 `doormomo-frame.webp` + 하루고멤 멤버 레퍼런스 이미지 첨부):
```
Using the first attached image (this player's existing card frame) ONLY as
a silhouette/structure reference — same ornate shield-shaped outer
silhouette, same scalloped border curve, same laurel-wreath crest position
at the top center, same inner content window position — and using the
second attached image (a "하루고멤" gothic-queen-concept character) as a
theme reference for materials and ornamentation only: keep the frame's
existing purple ancient-stonework base with glowing rune engravings, but
reimagine the corner ornaments as an ornate black rose crown motif with a
deep-amethyst gem at its center, delicate draped chain-and-gem jewelry
tracing the scalloped edge like a queen's regalia, rune symbols worked
subtly into the black rose petals. Rich royal-purple glow against the
dark stone surface. No player, no text, no stats. Entire canvas outside
the frame's own linework (including the inner content window) must be
fully transparent. PNG with alpha channel, 1060x1484.
```

**배경**:
```
Abstract premium trading-card background art, portrait orientation. Vast
dim ancient stone chamber lined with glowing purple rune engravings, a
large ornate black rose motif carved into the stonework in one corner with
a deep-amethyst gem glinting at its center, faint drifting petals of dark
rose and rune-light sparks, regal purple rim lighting. No characters, no
people, no border/frame, no text. High detail, majestic gothic-royalty
mood, 4K, PNG, 1060x1484.
```

**캐릭터** (기존 `doormomo-character.webp` + 하루고멤 멤버 레퍼런스 이미지 첨부):
```
Using the first attached image ONLY as an identity/likeness reference (same
player's face, hair color, and build) and the second attached image (a
"하루고멤" gothic-queen-concept character) as a costume/prop/pose
reference — redraw the player wearing that gothic-queen concept's outfit,
recolored to tie into her own purple rune/magic-circle palette: a large
black rose headpiece with a deep-amethyst gem, a draped gem-chain choker
and earrings, an off-shoulder corset bodice with lace ruffle trim, a
layered black tulle-and-lace tutu skirt with faint glowing rune patterns
woven into the lace, sheer fishnet stockings, black lace-up ankle boots.
Poised, regal, commanding expression, an elegant hand gesture as if
holding court. Semi-realistic premium trading-card 3D render style
consistent with the base card set (not chibi, not flat 2D). Viewed from a
slight low front 3/4 angle, visible head to mid-thigh. Rich royal-purple
rim lighting. No frame, no text, no background — fully transparent PNG
with alpha channel, 1060x1484, leave open space above the head and below
the waist for name/stat overlays.
```

---

### 쥬멩이 × 남자 아이돌 RP 멤버 — `ju010228`

**멤버 컨셉/RP**: 남자 아이돌(래빗 모티프) RP. 화이트+옐로우 버니이어 후드/모자(안쪽 연두색 안감), 연두색 드롭 귀걸이, 화이트+옐로우 세일러풍 크롭탑(큼직한 실버 리본 보우 + 벨 폼폼 장식), 탠 컬러 벨트에 체인과 크로스 참 장식, 화이트 배기 플레어 팬츠(옐로우 패치 + 연두색 하트 패치 + 옐로우 리본 패치가 덧대어진 디스트레스드 디테일), 옐로우-화이트-연두 스트라이프 플랫폼 스니커즈.

**프레임** (기존 `ju010228-frame.webp` + 하루고멤 멤버 레퍼런스 이미지 첨부):
```
Using the first attached image (this player's existing card frame) ONLY as
a silhouette/structure reference — same ornate shield-shaped outer
silhouette, same scalloped border curve, same laurel-wreath crest position
at the top center, same inner content window position — and using the
second attached image (a "하루고멤" male-idol bunny-concept character) as
a theme reference for materials and ornamentation only: keep the frame's
existing spring-vine-and-sprout base in fresh light green, but reimagine
the corner ornaments as a pair of soft bunny-ear-shaped vine loops with
small silver ribbon-bow charms and tiny bell pom-poms dangling among the
sprouts, a small cross-charm pendant motif worked into the top crest,
scattered light-green heart-shaped leaf patches along the scalloped edge.
Bright, cheerful idol-stage golden-white glow against the fresh green
surface. No player, no text, no stats. Entire canvas outside the frame's
own linework (including the inner content window) must be fully
transparent. PNG with alpha channel, 1060x1484.
```

**배경**:
```
Abstract premium trading-card background art, portrait orientation. Soft
misty spring forest clearing in fresh light green, young vines and sprouts
climbing at the edges, a pair of gentle bunny-ear-shaped leaf silhouettes
peeking from the foliage, tiny silver ribbon-bow and bell pom-pom charms
drifting like confetti, warm golden idol-stage spotlight glow cutting
through the mist. No characters, no people, no border/frame, no text. High
detail, bright cheerful mood, 4K, PNG, 1060x1484.
```

**캐릭터** (기존 `ju010228-character.webp` + 하루고멤 멤버 레퍼런스 이미지 첨부):
```
Using the first attached image ONLY as an identity/likeness reference (same
player's face, hair color, and build) and the second attached image (a
"하루고멤" male-idol bunny-concept character) as a costume/prop/pose
reference — redraw the player wearing that bunny-idol concept's outfit: a
white-and-yellow bunny-ear hood with a light-green lining, light-green
dangling drop earrings, a white-and-yellow sailor-style crop top with a
large silver ribbon bow and bell pom-pom charms, a tan belt with a chain
and small cross charm, white flared distressed pants patched with yellow
panels, light-green heart patches, and yellow ribbon-bow patches, striped
yellow-white-green platform sneakers. Playful, confident idol pose, one
hand raised near a bunny ear like striking a stage pose. Semi-realistic
premium trading-card 3D render style consistent with the base card set
(not chibi, not flat 2D). Viewed from a slight low front 3/4 angle,
visible head to mid-thigh. Bright golden-white idol-stage rim lighting. No
frame, no text, no background — fully transparent PNG with alpha channel,
1060x1484, leave open space above the head and below the waist for
name/stat overlays.
```

---

### 핑구 × 주작의 딸 RP 멤버 — `sjh4018`

**멤버 컨셉/RP**: 주작(붉은 봉황)의 딸 RP, 화를 잘 내는 성격. 거대한 불타는 듯한 크림슨-오렌지 봉황 깃털 날개, 붉은 머리를 금색 비녀로 틀어 올림, 오프숄더 레드+블랙 한풍(hanfu) 상의(금색 트림), 블랙 가죽 암가드, 금장 디테일이 들어간 블랙 롱스커트(하카마풍), 다크 부츠, 손에 작은 불꽃 이펙트, 날카롭고 화난 표정.

**프레임** (기존 `sjh4018-frame.webp` + 하루고멤 멤버 레퍼런스 이미지 첨부):
```
Using the first attached image (this player's existing card frame) ONLY as
a silhouette/structure reference — same ornate shield-shaped outer
silhouette, same scalloped border curve, same laurel-wreath crest position
at the top center, same inner content window position — and using the
second attached image (a "하루고멤" vermilion-bird/phoenix-concept
character) as a theme reference for materials and ornamentation only:
keep the frame's existing sky-blue and soft-lavender cloud base, but
reimagine the corner ornaments as blazing crimson-orange phoenix feather
wings bursting from the top-left and bottom-right corners, streaked with
gold filigree, as if phoenix fire is breaking through the dusk clouds — a
striking contrast of cool sky-blue cloud texture against hot
crimson-orange feathered fire. Small gold hairpin-shaped accents worked
into the top crest. No player, no text, no stats. Entire canvas outside
the frame's own linework (including the inner content window) must be
fully transparent. PNG with alpha channel, 1060x1484.
```

**배경**:
```
Abstract premium trading-card background art, portrait orientation. Soft
dusk sky above distant layered clouds in sky-blue and pale lavender, with
a dramatic burst of blazing crimson-orange phoenix feathers and fire
streaking across one side of the frame like a phoenix tearing through the
clouds, drifting embers and gold sparks mixing with the cool cloud haze.
No characters, no people, no border/frame, no text. High detail, dramatic
fire-meets-sky mood, 4K, PNG, 1060x1484.
```

**캐릭터** (기존 `sjh4018-character.webp` + 하루고멤 멤버 레퍼런스 이미지 첨부):
```
Using the first attached image ONLY as an identity/likeness reference (same
player's face, hair color, and build) and the second attached image (a
"하루고멤" vermilion-bird/phoenix-concept character) as a costume/prop/pose
reference — redraw the player wearing that phoenix concept's outfit: a
red-and-black off-shoulder hanfu-style top with gold trim, black leather
arm guards, a black long hakama-style skirt with gold detailing, dark
boots, hair swept up with a gold hairpin ornament, and a pair of massive
blazing crimson-orange phoenix feather wings spread open behind her. Sharp,
fierce, easily-angered expression (never soft or gentle), a small flame
effect flickering in one hand. Semi-realistic premium trading-card 3D
render style consistent with the base card set (not chibi, not flat 2D).
Viewed from a slight low front 3/4 angle, visible head to mid-thigh, wings
may extend beyond the shoulders. Warm crimson-gold rim lighting mixed with
cool sky-blue undertones. No frame, no text, no background — fully
transparent PNG with alpha channel, 1060x1484, leave open space above the
head and below the waist for name/stat overlays.
```

---

### 해파린 × 체스왕국 문지기 병사 RP 멤버 — `haepalin`

**멤버 컨셉/RP**: 체스왕국의 문지기 병사 RP. 머리 위에 링 모양 받침대로 지지된 커다란 구체(체스 폰 말을 형상화, 표면에 전기/번개 같은 질감)를 얹고 있음, 크림+골드 트림의 갑옷형 드레스(숄더 판금, 클럽 슈트(♣) 문양 장식), 허리에 파우치가 달린 벨트, 골드 버클 장식의 부츠, 은발/실버-화이트 헤어, 차분하고 무표정에 가까운 얼굴.

**프레임** (기존 `haepalin-frame.webp` + 하루고멤 멤버 레퍼런스 이미지 첨부):
```
Using the first attached image (this player's existing card frame) ONLY as
a silhouette/structure reference — same ornate shield-shaped outer
silhouette, same scalloped border curve, same laurel-wreath crest position
at the top center, same inner content window position — and using the
second attached image (a "하루고멤" chess-kingdom gatekeeper-concept
character) as a theme reference for materials and ornamentation only:
keep the frame's existing pale-lavender and deep-violet deep-sea
bioluminescent base, but reimagine the corner ornaments as ringed armor
plating like a chess pawn's layered silhouette, with a glowing dark orb
crackling with faint electric bioluminescent light set at the top crest
(styled like a jellyfish's glow rather than literal lightning), small
club-suit (♣) emblem engravings tracing the scalloped edge. Cool violet
glow against the pale surface. No player, no text, no stats. Entire canvas
outside the frame's own linework (including the inner content window) must
be fully transparent. PNG with alpha channel, 1060x1484.
```

**배경**:
```
Abstract premium trading-card background art, portrait orientation. Deep
dim underwater scene in pale lavender and deep violet, with a large
glowing dark orb drifting like a jellyfish bell crackling with soft
bioluminescent electric light, faint club-suit (♣) shaped light patterns
pulsing along drifting jellyfish tendrils, cool violet rim lighting. No
characters, no people, no border/frame, no text. High detail, 4K, PNG,
1060x1484.
```

**캐릭터** (기존 `haepalin-character.webp` + 하루고멤 멤버 레퍼런스 이미지 첨부):
```
Using the first attached image ONLY as an identity/likeness reference (same
player's face, hair color, and build) and the second attached image (a
"하루고멤" chess-kingdom gatekeeper-concept character) as a
costume/prop/pose reference — redraw the player wearing that gatekeeper
concept's outfit, recolored to tie into her own pale-lavender and
deep-violet deep-sea palette: a pale lavender-and-silver armored dress
with shoulder pauldrons, club-suit (♣) emblem engravings on the chest and
skirt panels, a belt with a small pouch, silver-buckled boots, and a large
ringed headpiece supporting a dark glowing orb above her head (styled like
a chess pawn fused with a bioluminescent jellyfish, crackling with soft
violet electric light). Calm, composed, quietly watchful expression, stiff
formal guard posture. Semi-realistic premium trading-card 3D render style
consistent with the base card set (not chibi, not flat 2D). Viewed from a
slight low front 3/4 angle, visible head to mid-thigh (leave extra headroom
above for the orb headpiece). Cool violet rim lighting. No frame, no text,
no background — fully transparent PNG with alpha channel, 1060x1484, leave
open space above the head and below the waist for name/stat overlays.
```

---

### 재닌 × 어인 RP 멤버 — `janine95kim`

**멤버 컨셉/RP**: 어인(물고기 수인) RP, 개그 컨셉. 머리에 금붕어와 수초가 들어있는 둥근 유리 어항을 뒤집어쓰고 있음, 볼을 물고기처럼 빵빵하게 부풀린 표정, 네이비 블루 더블브레스티드 재킷(은색 버튼 여러 줄, 한쪽 소매에서 수초가 자라나 있음), 가슴에 작은 빨간 불가사리 브로치, 블랙 슬랙스, 블랙 드레스 슈즈. 장난스럽고 능청스러운 분위기.

**프레임** (기존 `janine95kim-frame.webp` + 하루고멤 멤버 레퍼런스 이미지 첨부):
```
Using the first attached image (this player's existing card frame) ONLY as
a silhouette/structure reference — same ornate shield-shaped outer
silhouette, same scalloped border curve, same laurel-wreath crest position
at the top center, same inner content window position — and using the
second attached image (a "하루고멤" fish-person/fishbowl-concept character)
as a theme reference for materials and ornamentation only: keep the
frame's existing icy pale-blue frosted base with aurora-light streaks, but
reimagine the corner ornaments as a round frosted-glass fishbowl shape with
tiny frost-blue fish and delicate ice-crystal "seaweed" fronds drifting
inside, a small red starfish-shaped ice charm set at the top crest. Crisp
cold aurora glow against the frosted surface. No player, no text, no
stats. Entire canvas outside the frame's own linework (including the inner
content window) must be fully transparent. PNG with alpha channel,
1060x1484.
```

**배경**:
```
Abstract premium trading-card background art, portrait orientation. Icy
pale-blue frosted stone slab with silvery frost-vein cracks and streaks of
faint aurora light, a large round frosted-glass fishbowl shape resting in
soft-focus at one edge with tiny frost-blue fish and ice-crystal seaweed
fronds inside it, a small red starfish-shaped ice charm glinting nearby.
No characters, no people, no border/frame, no text. High detail, crisp
cold and slightly whimsical mood, 4K, PNG, 1060x1484.
```

**캐릭터** (기존 `janine95kim-character.webp` + 하루고멤 멤버 레퍼런스 이미지 첨부):
```
Using the first attached image ONLY as an identity/likeness reference (same
player's face and build, though here mostly obscured/de-emphasized by the
fishbowl headpiece) and the second attached image (a "하루고멤"
fish-person/fishbowl-concept character) as a costume/prop/pose reference —
redraw the player wearing that fish-person concept: a round frosted glass
fishbowl worn over the head like a helmet, with a couple of small
frost-blue fish and ice-crystal seaweed fronds drifting inside it, cheeks
comically puffed out like a fish visible through the glass, a navy-blue
double-breasted jacket with rows of silver buttons and icy frost-crystal
"seaweed" sprouting from one sleeve, a small red starfish-shaped ice charm
on the chest, black slacks, black dress shoes. Playful, silly,
deadpan-comedic mood — keep it lighthearted and a little absurd, not
serious or dramatic. Semi-realistic premium trading-card 3D render style
consistent with the base card set (not chibi, not flat 2D). Viewed from a
slight low front 3/4 angle, visible head to mid-thigh (leave extra headroom
for the fishbowl). Crisp bright cold rim lighting. No frame, no text, no
background — fully transparent PNG with alpha channel, 1060x1484, leave
open space above the head and below the waist for name/stat overlays.
```

---

### 우왁굳 × 멀티버스 여행자 RP 멤버 — `woowakgood`

**멤버 컨셉/RP**: 멀티버스를 넘나드는 컨셉. 그레이 정장에 안경, 넥타이 차림, 특징적으로 갈라진(클레프트) 턱, 드레스 슈즈 밑창에 인라인스케이트 바퀴가 달려 있음, 허공에 뜬 보라색 홀로그램 레이저 키보드/화면을 손가락으로 조작하며 기록을 남기는 포즈.

**주의**: 우왁굳은 보너스 리메이크 규칙상 팔레트가 **비비드 페리도트 그린 메인 + 청록-보라-적(티일-바이올렛-크림슨) 레이싱 스트라이프 악센트로 고정**됨(위 "보너스: 우왁굳" 섹션 참고, `totyCardTheme.ts`의 `woowakgood` 항목과 일치). 마침 이 멀티버스 멤버의 보라색 홀로그램 키보드가 기존 바이올렛 악센트와 색이 겹치므로 잘 녹여 넣을 것 — 단, **실제 BMW 로고(키드니 그릴, 프로펠러 라운델)나 "BMW" 워드마크는 절대 그리지 말 것** (기존 우왁굳 프롬프트와 동일한 상표 금지 규칙 적용).

**프레임** (기존 `woowakgood-frame.webp` + 하루고멤 멤버 레퍼런스 이미지 첨부, 페리도트+레이싱스트라이프 팔레트 유지):
```
Using a vivid peridot-green primary palette with teal-violet-crimson
racing-stripe accents (this card's fixed motorsport palette — do not
substitute a different color scheme), and using the first attached image
(this player's existing lavish motorsport-themed card frame) ONLY as a
silhouette/structure and color reference — same brushed-chrome and
matte-black carbon-fiber frame, same speed-line streaks and racing-stripe
accents — add a small refined addition inspired by the second attached
image (a "하루고멤" multiverse-traveler-concept character): thin glowing
violet holographic keyboard/interface panel motifs woven into the speed-line
bursts at the corners, and faint circular light-trail streaks like
inline-skate wheel tracks curving along the scalloped edge. Keep the
brushed-chrome, carbon-fiber, and racing-stripe elements as the dominant
motif — the hologram/wheel-trail details are a small accent, not a theme
change. No real car logos, badges, roundels, or wordmarks of any kind. No
player, no text, no stats. Entire canvas outside the frame's own linework
(including the inner content window) must be fully transparent. PNG with
alpha channel, 1060x1484.
```

**배경** (완성된 우왁굳 프레임 이미지를 색상 참고용으로 함께 첨부):
```
Abstract premium trading-card background art, portrait orientation, using
the exact same vivid peridot-green primary palette as the attached frame
image (with subtle teal-violet-crimson racing-stripe accents) — match
those colors closely. A dense brushed-chrome and carbon-fiber slab with
glowing green speed-line veins, motorsport-inspired chrome shards and
racing-stripe light streaks bursting from one corner, thin glowing violet
holographic keyboard/interface panels floating faintly in the air, soft
circular light-trail streaks like inline-skate wheel tracks curving
through the scene. No real car logos, badges, or brand marks of any kind.
No characters, no people, no border/frame, no text. High detail, 4K, PNG,
1060x1484.
```

**캐릭터** (기존 `woowakgood-character.webp` + 완성된 우왁굳 프레임 이미지(색상 참고) + 하루고멤 멤버 레퍼런스 이미지 첨부):
```
Using the first attached image ONLY as an identity/likeness reference (same
person, same overall art style), the frame image for its exact vivid
peridot-green + teal-violet-crimson racing-stripe palette (do not
introduce a different color scheme), and the third attached image (a
"하루고멤" multiverse-traveler character) as a costume/prop/pose
reference — keep him dressed as the elite club manager/director (sharply
tailored grey blazer, crisp dress shirt, slim racing-stripe silk tie in
the teal-violet-crimson accent colors, peridot-green pocket square,
glasses, a distinctly cleft chin) but add inline-skate wheels fitted to
the soles of his dress shoes, and have him mid-gesture typing on a
floating glowing violet holographic keyboard/interface panel hovering in
the air in front of him — as if recording notes while traveling between
realities. Confident, composed, slightly eccentric "manager who also
happens to be a multiversal traveler" energy. A faint aura of glowing
peridot-green energy with streaks of the racing-stripe accent colors
curling around him. No real car logos, badges, or brand marks of any kind
anywhere on the outfit. Viewed from a slight low front 3/4 angle, visible
head to mid-thigh. Rich, dramatic rim lighting matching the lavish,
higher-rarity treatment of the rest of this card. No frame, no text, no
background — fully transparent PNG with alpha channel, 1060x1484, leave
open space above the head and below the waist for name/stat overlays.
```

---

## 선수별 세트 (10개)

순서·컬러·모티프 확정본:

| # | 선수 | id (파일명 접두사) | 포지션 | 메인 컬러 | 모티프 (크리스탈 대체) |
|---|------|---------------------|--------|-----------|--------------------------|
| 1 | 다시바 | `tdnlamuron` | WF | 살구주황빛 | 용암/잉걸불 (화산암 + 마그마) |
| 2 | 쥬멩이 | `ju010228` | ST | 연두색 | 봄 넝쿨/새싹 (이끼 낀 돌 + 덩굴) |
| 3 | 문모모 | `doormomo` | CDM | 보라색 | 마법진/룬문양 (석판 + 보라빛 룬) |
| 4 | 뽀린걸 | `bboringirl` | CM | 회색 + 빨강 | 기계 장갑판 + 붉은 회로 |
| 5 | 한결 | `kaksjak0730` | CM | 딥블랙 + 사파이어 블루 | 밤하늘 유리 파편 (별빛 조각) |
| 6 | 핑구 | `sjh4018` | CB | 하늘색 + 연보라 | 구름/깃털 |
| 7 | 해파린 | `haepalin` | CB | 연한 라벤더 + 진보라 | 심해 해파리/발광생물 |
| 8 | 리냐 | `lina0108` | FB | 선명한 핑크 + 연분홍 | 벚꽃 가지/꽃잎 |
| 9 | 빙밍 | `tleod1818` | FB | 어두운 남색 + 에메랄드 | 폭풍우/번개 |
| 10 | 재닌 | `janine95kim` | GK | 스카이 블루 | 서리/오로라 |

각 세트마다 자세는 서로 겹치지 않게, 포지션·모티프 무드에 맞춰 배정함.

> **모티프 수정 이력**: 원래 빙밍이 심해 산호/해파리 모티프였는데, 해파린이 실제로 해파리 RP를 가지고 있어서 서로 뒤바뀌어 있던 것 — 심해/해파리는 해파린으로, 빙밍은 겹치지 않는 폭풍우/번개 모티프로 변경함. **해파린·빙밍은 이미 생성된 이미지(`haepalin-*.webp`, `tleod1818-*.webp`)가 옛 모티프라서, 아래 새 프롬프트로 재생성해서 같은 파일명으로 덮어써야 함.**

---

### 1. 다시바 — `tdnlamuron` — 살구주황빛 · 용암/잉걸불 (WF)

**프레임** (하치 프레임 이미지는 실루엣 참고용으로만 첨부):
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at the top center, same inner content
window position — but redesign the surface material completely: a
dark volcanic obsidian-rock frame with a molten lava/ember motif bursting
from the top-left and bottom-right corners instead of crystal shards —
glowing amber-orange magma cracks running through the black rock, small
embers and sparks drifting off the lava cluster. No player, no text, no
stats. Entire canvas outside the frame's own linework (including the inner
content window) must be fully transparent. PNG with alpha channel,
1060x1484.
```

**배경**:
```
Abstract premium trading-card background art, portrait orientation. Cracked
dark volcanic rock slab with glowing amber-orange magma veins running
through it, a cluster of molten lava and embers bursting from the
upper-right corner, drifting spark particles and heat haze, dramatic warm
rim lighting. No characters, no people, no border/frame, no text. High
detail, 4K, PNG, 1060x1484.
```

**캐릭터** (다시바 참고 사진 첨부):
```
Turn the reference photo into a stylized premium trading-card 3D player
render, semi-realistic style. Soccer kit in warm apricot-orange and cream
tones. Dynamic explosive mid-sprint dribbling pose, ball just ahead of the
feet, leaning forward with determination, one arm pumping forward for
momentum. Viewed from a slight low front 3/4 angle, visible head to
mid-thigh. Warm ember-lit rim lighting matching the lava palette. No frame,
no text, no background — fully transparent PNG with alpha channel,
1060x1484, leave open space above the head and below the waist for
name/stat overlays.
```

**캐릭터 호버** (기존 다시바 캐릭터 이미지를 참고로 첨부):
```
Using the attached existing character render ONLY as an identity/likeness
and kit-color reference (same person, same warm apricot-orange and cream
kit, same overall art style) — do NOT repeat the same pose. Design a NEW,
more dynamic and eye-catching alternate pose for this same player: an
airborne bicycle-kick / overhead strike, body twisting dramatically in
mid-air, embers and sparks trailing off the striking boot. Viewed from a
slight low front 3/4 angle, visible head to mid-thigh. Warm ember-lit rim
lighting matching the lava palette. No frame, no text, no background —
fully transparent PNG with alpha channel, 1060x1484, leave open space
above the head and below the waist for name/stat overlays.
```

**뒷면**:
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at top center — design the BACK of this
same card (not the front): a dark volcanic obsidian holographic foil
surface, with faint glowing amber-orange magma cracks running beneath the
prismatic sheen, a single bold ember/flame emblem centered in the middle of
the shield (no readable text, no logos, no player), warm amber-orange
metallic trim tracing the inner border. Moody, premium, mysterious — looks
like the unrevealed back of this card before it's flipped. No text, no
numbers, no real brand marks. Entire canvas outside the frame's own
linework must stay fully transparent (alpha 0), only the shield shape
itself is opaque. 1060x1484px, transparent PNG.
```

**빛 효과**:
```
Abstract loose particle/light-effect overlay ONLY, portrait orientation,
1060x1484. Floating embers and sparks drifting slowly upward, with a soft
warm amber-orange heat-haze glow, like cinders rising off molten lava.
No solid material, no rock or stone texture, no border/frame, no
characters, no text — this is a light layer meant to be composited on top
of the existing card background, not a full scene. High detail, soft glow
bloom, 4K. Entire canvas outside the glowing particles themselves must
stay fully transparent (alpha 0), transparent PNG.
```

**팝업 배경**:
```
A premium dark studio showcase backdrop for a trading-card reveal screen,
themed around volcanic rock. A vast dim volcanic cavern with distant
glowing amber-orange lava veins faintly visible in the rock walls, drifting
heat haze. Low contrast, desaturated, moody and cinematic — no glow
effects, no sparks, no particles (those are added separately), just the
base environment/material. No text, no logos, no people, no readable
shapes, no bright highlights. Ultra-wide, minimal, elegant, 4K, 2560x1440.
```

**팝업 배경 빛 효과**:
```
Abstract loose particle/light-effect overlay ONLY, ultra-wide, 2560x1440.
Floating embers and sparks drifting slowly upward, soft warm amber-orange
heat-haze glow — sparse and soft, concentrated toward the edges and
corners, keep the vertical center column (a card sits there) mostly clear.
No solid material, no border/frame, no characters, no text — this is a
light layer meant to be composited on top of a popup backdrop behind a
trading card, not a full scene. High detail, soft glow bloom, 4K. Entire
canvas outside the glowing particles themselves must stay fully
transparent (alpha 0), transparent PNG.
```

---

### 2. 쥬멩이 — `ju010228` — 연두색 · 봄 넝쿨/새싹 (ST)

**프레임** (하치 프레임 이미지는 실루엣 참고용으로만 첨부):
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at the top center, same inner content
window position — but redesign the surface material completely: pale mossy
stone, with fresh spring vines, budding leaves, and tiny dew-lit sprouts
bursting from the top-left and bottom-right corners instead of crystal
shards — lime-green foliage with soft morning dew sparkle. No player, no
text, no stats. Entire canvas outside the frame's own linework (including
the inner content window) must be fully transparent. PNG with alpha
channel, 1060x1484.
```

**배경**:
```
Abstract premium trading-card background art, portrait orientation. Pale
moss-covered stone slab with soft green vine-veins running through it, a
cluster of fresh spring vines and budding leaves bursting from the
upper-right corner, dew droplets catching the light, soft fresh daylight
rim lighting. No characters, no people, no border/frame, no text. High
detail, 4K, PNG, 1060x1484.
```

**캐릭터** (쥬멩이 참고 사진 첨부):
```
Turn the reference photo into a stylized premium trading-card 3D player
render, semi-realistic style. Soccer kit in fresh lime-green and white
tones. Joyful mid-air celebration pose right after scoring — knee raised,
both arms spread wide, big excited smile, hair/clothing caught mid-motion.
Viewed from a slight low front 3/4 angle, visible head to mid-thigh. Bright
fresh lighting matching the lime-green palette. No frame, no text, no
background — fully transparent PNG with alpha channel, 1060x1484, leave
open space above the head and below the waist for name/stat overlays.
```

**캐릭터 호버** (기존 쥬멩이 캐릭터 이미지를 참고로 첨부):
```
Using the attached existing character render ONLY as an identity/likeness
and kit-color reference (same person, same fresh lime-green and white kit,
same overall art style) — do NOT repeat the same pose. Design a NEW, more
dynamic and eye-catching alternate pose for this same player: a full-power
side-volley strike caught mid-air, body twisted sideways, spring vines and
budding leaves whipping around the striking leg. Viewed from a slight low
front 3/4 angle, visible head to mid-thigh. Bright fresh lighting matching
the lime-green palette. No frame, no text, no background — fully
transparent PNG with alpha channel, 1060x1484, leave open space above the
head and below the waist for name/stat overlays.
```

**뒷면**:
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at top center — design the BACK of this
same card (not the front): a pale moss-covered holographic foil surface,
with faint lime-green vine-line patterns running beneath the prismatic
sheen, a single bold budding-leaf emblem centered in the middle of the
shield (no readable text, no logos, no player), soft lime-green metallic
trim tracing the inner border. Moody, premium, mysterious — looks like the
unrevealed back of this card before it's flipped. No text, no numbers, no
real brand marks. Entire canvas outside the frame's own linework must stay
fully transparent (alpha 0), only the shield shape itself is opaque.
1060x1484px, transparent PNG.
```

**빛 효과**:
```
Abstract loose particle/light-effect overlay ONLY, portrait orientation,
1060x1484. Tiny drifting motes of soft lime-green light and sparkling
dew-drop glints catching the sun, like fireflies floating over spring
vines. No solid material, no rock or stone texture, no border/frame, no
characters, no text — this is a light layer meant to be composited on top
of the existing card background, not a full scene. High detail, soft glow
bloom, 4K. Entire canvas outside the glowing particles themselves must
stay fully transparent (alpha 0), transparent PNG.
```

**팝업 배경**:
```
A premium dark studio showcase backdrop for a trading-card reveal screen,
themed around a spring forest. A soft misty spring forest clearing at
dusk, distant moss-covered stone silhouettes fading into darkness. Low
contrast, desaturated, moody and cinematic — no glow effects, no dew
sparkle, no particles (those are added separately), just the base
environment/material. No text, no logos, no people, no readable shapes,
no bright highlights. Ultra-wide, minimal, elegant, 4K, 2560x1440.
```

**팝업 배경 빛 효과**:
```
Abstract loose particle/light-effect overlay ONLY, ultra-wide, 2560x1440.
Tiny drifting motes of soft lime-green light and sparkling dew-drop
glints — sparse and soft, concentrated toward the edges and corners, keep
the vertical center column (a card sits there) mostly clear. No solid
material, no border/frame, no characters, no text — this is a light layer
meant to be composited on top of a popup backdrop behind a trading card,
not a full scene. High detail, soft glow bloom, 4K. Entire canvas outside
the glowing particles themselves must stay fully transparent (alpha 0),
transparent PNG.
```

---

### 3. 문모모 — `doormomo` — 보라색 · 마법진/룬문양 (CDM)

**프레임** (하치 프레임 이미지는 실루엣 참고용으로만 첨부):
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at the top center, same inner content
window position — but redesign the surface material completely: a dark
engraved stone tablet, with glowing violet runic sigils and arcane
magic-circle patterns etched into it, mystical purple energy wisps bursting
from the top-left and bottom-right corners instead of crystal shards. No
player, no text, no stats. Entire canvas outside the frame's own linework
(including the inner content window) must be fully transparent. PNG with
alpha channel, 1060x1484.
```

**배경**:
```
Abstract premium trading-card background art, portrait orientation. Dark
engraved stone slab covered in glowing violet runic carvings, a cluster of
swirling arcane energy and floating rune fragments bursting from the
upper-right corner, faint magic-circle glow, cool moody purple rim
lighting. No characters, no people, no border/frame, no text. High detail,
4K, PNG, 1060x1484.
```

**캐릭터** (문모모 참고 사진 첨부):
```
Turn the reference photo into a stylized premium trading-card 3D player
render, semi-realistic style. Soccer kit in deep amethyst-purple and silver
tones. Calm, commanding stance — arms crossed, ball resting still under one
foot, chin slightly raised, composed confident expression (a midfield
playmaker controlling the tempo of the game, not celebrating). Viewed from
a slight low front 3/4 angle, visible head to mid-thigh. Cool violet rim
lighting. No frame, no text, no background — fully transparent PNG with
alpha channel, 1060x1484, leave open space above the head and below the
waist for name/stat overlays.
```

**캐릭터 호버** (기존 문모모 캐릭터 이미지를 참고로 첨부):
```
Using the attached existing character render ONLY as an identity/likeness
and kit-color reference (same person, same deep amethyst-purple and silver
kit, same overall art style) — do NOT repeat the same pose. Design a NEW,
more dynamic and eye-catching alternate pose for this same player:
mid-stride, whipping a long diagonal through-ball pass, coat hem and
violet arcane energy trailing dramatically behind the motion. Viewed from
a slight low front 3/4 angle, visible head to mid-thigh. Cool violet rim
lighting. No frame, no text, no background — fully transparent PNG with
alpha channel, 1060x1484, leave open space above the head and below the
waist for name/stat overlays.
```

**뒷면**:
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at top center — design the BACK of this
same card (not the front): a dark engraved-stone holographic foil surface,
with faint glowing violet runic sigils running beneath the prismatic
sheen, a single bold magic-circle emblem centered in the middle of the
shield (no readable text, no logos, no player), violet metallic trim
tracing the inner border. Moody, premium, mysterious — looks like the
unrevealed back of this card before it's flipped. No text, no numbers, no
real brand marks. Entire canvas outside the frame's own linework must stay
fully transparent (alpha 0), only the shield shape itself is opaque.
1060x1484px, transparent PNG.
```

**빛 효과**:
```
Abstract loose particle/light-effect overlay ONLY, portrait orientation,
1060x1484. Small, sparse, scattered wisps of glowing violet arcane energy
and tiny floating rune-light specks, drifting slowly — NOT one large
centered magic-circle diagram. This overlay is composited directly on top
of a player render standing in the center of the frame, so the entire
center column and lower two-thirds (where the player's body is) must stay
almost completely empty/transparent — keep all particles small and
concentrated near the top corners and edges only. No solid material, no
rock or stone texture, no border/frame, no characters, no text — this is a
light layer, not a full scene. High detail, soft glow bloom, 4K. Entire
canvas outside the sparse glowing particles themselves must stay fully
transparent (alpha 0), transparent PNG.
```

**팝업 배경**:
```
A premium dark studio showcase backdrop for a trading-card reveal screen,
themed around ancient stonework. A vast dim ancient stone chamber lined
with faint carved rune pillars fading into darkness. Low contrast,
desaturated, moody and cinematic — no glow effects, no magic-circle light,
no particles (those are added separately), just the base
environment/material. No text, no logos, no people, no readable shapes,
no bright highlights. Ultra-wide, minimal, elegant, 4K, 2560x1440.
```

**팝업 배경 빛 효과**:
```
Abstract loose particle/light-effect overlay ONLY, ultra-wide, 2560x1440.
Small, sparse, scattered wisps of glowing violet arcane energy and tiny
rune-light specks — NOT one large centered magic-circle diagram. Sparse
and soft, concentrated toward the edges and corners, keep the vertical
center column (a card sits there) mostly clear. No solid material, no
border/frame, no characters, no text — this is a light layer meant to be
composited on top of a popup backdrop behind a trading card, not a full
scene. High detail, soft glow bloom, 4K. Entire canvas outside the glowing
particles themselves must stay fully transparent (alpha 0), transparent
PNG.
```

---

### 4. 뽀린걸 — `bboringirl` — 회색 + 빨강 · 기계 장갑판/회로 (CM)

**프레임** (하치 프레임 이미지는 실루엣 참고용으로만 첨부):
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at the top center, same inner content
window position — but redesign the surface material completely: brushed
gunmetal-gray riveted armor plating, with glowing red energy circuit-lines
running through it, small red circuit-light clusters bursting from the
top-left and bottom-right corners instead of crystal shards — industrial
mecha aesthetic. No player, no text, no stats. Entire canvas outside the
frame's own linework (including the inner content window) must be fully
transparent. PNG with alpha channel, 1060x1484.
```

**배경**:
```
Abstract premium trading-card background art, portrait orientation. Brushed
gunmetal armor-plate slab with glowing red circuit-line veins running
through it, a cluster of red energy conduits and small glowing nodes
bursting from the upper-right corner, cool steel-toned rim lighting with
red accent glow. No characters, no people, no border/frame, no text. High
detail, 4K, PNG, 1060x1484.
```

**캐릭터** (뽀린걸 참고 사진 첨부):
```
Turn the reference photo into a stylized premium trading-card 3D player
render, semi-realistic style. Soccer kit in gunmetal-gray with red trim
accents. Gritty determined mid-run pose, leaning forward, one arm extended
pointing forward as if directing a teammate, intense focused expression.
Viewed from a slight low front 3/4 angle, visible head to mid-thigh. Cool
steel-gray rim lighting with a touch of red accent light. No frame, no
text, no background — fully transparent PNG with alpha channel, 1060x1484,
leave open space above the head and below the waist for name/stat
overlays.
```

**캐릭터 호버** (기존 뽀린걸 캐릭터 이미지를 참고로 첨부):
```
Using the attached existing character render ONLY as an identity/likeness
and kit-color reference (same person, same gunmetal-gray kit with red trim,
same overall art style) — do NOT repeat the same pose. Design a NEW, more
dynamic and eye-catching alternate pose for this same player: the explosive
follow-through of a long-range strike, leg fully extended after the kick,
red circuit-energy crackling off the striking boot. Viewed from a slight
low front 3/4 angle, visible head to mid-thigh. Cool steel-gray rim
lighting with a touch of red accent light. No frame, no text, no
background — fully transparent PNG with alpha channel, 1060x1484, leave
open space above the head and below the waist for name/stat overlays.
```

**뒷면**:
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at top center — design the BACK of this
same card (not the front): a brushed gunmetal holographic foil surface,
with faint glowing red circuit-line patterns running beneath the prismatic
sheen, a single bold circuit-node emblem centered in the middle of the
shield (no readable text, no logos, no player), red metallic trim tracing
the inner border. Moody, premium, mysterious — looks like the unrevealed
back of this card before it's flipped. No text, no numbers, no real brand
marks. Entire canvas outside the frame's own linework must stay fully
transparent (alpha 0), only the shield shape itself is opaque. 1060x1484px,
transparent PNG.
```

**빛 효과**:
```
Abstract loose particle/light-effect overlay ONLY, portrait orientation,
1060x1484. Small pulsing red circuit-light sparks and drifting glowing
data-node particles, flickering gently. No solid material, no rock or
stone texture, no border/frame, no characters, no text — this is a light
layer meant to be composited on top of the existing card background, not a
full scene. High detail, soft glow bloom, 4K. Entire canvas outside the
glowing particles themselves must stay fully transparent (alpha 0),
transparent PNG.
```

**팝업 배경**:
```
A premium dark studio showcase backdrop for a trading-card reveal screen,
themed around industrial machinery. A dim industrial hangar with distant
rows of gunmetal paneling and cabling fading into darkness. Low contrast,
desaturated, moody and cinematic — no glow effects, no circuit sparks, no
particles (those are added separately), just the base environment/material.
No text, no logos, no people, no readable shapes, no bright highlights.
Ultra-wide, minimal, elegant, 4K, 2560x1440.
```

**팝업 배경 빛 효과**:
```
Abstract loose particle/light-effect overlay ONLY, ultra-wide, 2560x1440.
Small pulsing red circuit-light sparks and drifting glowing data-node
particles — sparse and soft, concentrated toward the edges and corners,
keep the vertical center column (a card sits there) mostly clear. No solid
material, no border/frame, no characters, no text — this is a light layer
meant to be composited on top of a popup backdrop behind a trading card,
not a full scene. High detail, soft glow bloom, 4K. Entire canvas outside
the glowing particles themselves must stay fully transparent (alpha 0),
transparent PNG.
```

---

### 5. 한결 — `kaksjak0730` — 딥블랙 + 사파이어 블루 · 밤하늘 유리 파편 (CM)

**프레임** (하치 프레임 이미지는 실루엣 참고용으로만 첨부):
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at the top center, same inner content
window position — but redesign the surface material completely: matte
deep-black obsidian, with the corner ornament reimagined as shattered
night-sky glass shards embedded with tiny starlight glimmers (not generic
gem crystals) bursting from the top-left and bottom-right corners — cool
sapphire-blue starlight glow against the black. No player, no text, no
stats. Entire canvas outside the frame's own linework (including the inner
content window) must be fully transparent. PNG with alpha channel,
1060x1484.
```

**배경**:
```
Abstract premium trading-card background art, portrait orientation.
Near-black obsidian slab with faint star-like sparkle veins running through
it, a cluster of shattered glass-like shards glowing with sapphire
starlight bursting from the upper-right corner, tiny drifting light motes,
cool icy-blue rim lighting. No characters, no people, no border/frame, no
text. High detail, 4K, PNG, 1060x1484.
```

**캐릭터** (한결 참고 사진 첨부):
```
Turn the reference photo into a stylized premium trading-card 3D player
render, semi-realistic style. Soccer kit in matte black with sapphire-blue
trim. Poised, elegant free-kick stance — one leg planted firmly, the other
mid-swing, calm and focused gaze, composed rather than aggressive. Viewed
from a slight low front 3/4 angle, visible head to mid-thigh. Cool icy-blue
rim lighting against dark tones. No frame, no text, no background — fully
transparent PNG with alpha channel, 1060x1484, leave open space above the
head and below the waist for name/stat overlays.
```

**캐릭터 호버** (기존 한결 캐릭터 이미지를 참고로 첨부):
```
Using the attached existing character render ONLY as an identity/likeness
and kit-color reference (same person, same matte black kit with
sapphire-blue trim, same overall art style) — do NOT repeat the same pose.
Design a NEW, more dynamic and eye-catching alternate pose for this same
player: the explosive follow-through of a free-kick strike, leg fully
extended after the kick, a comet-like trail of sapphire starlight bursting
off the ball. Viewed from a slight low front 3/4 angle, visible head to
mid-thigh. Cool icy-blue rim lighting against dark tones. No frame, no
text, no background — fully transparent PNG with alpha channel, 1060x1484,
leave open space above the head and below the waist for name/stat
overlays.
```

**뒷면**:
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at top center — design the BACK of this
same card (not the front): a matte deep-black holographic foil surface,
with faint sapphire-blue starlight-shard patterns running beneath the
prismatic sheen, a single bold star-shard emblem centered in the middle of
the shield (no readable text, no logos, no player), sapphire-blue metallic
trim tracing the inner border. Moody, premium, mysterious — looks like the
unrevealed back of this card before it's flipped. No text, no numbers, no
real brand marks. Entire canvas outside the frame's own linework must stay
fully transparent (alpha 0), only the shield shape itself is opaque.
1060x1484px, transparent PNG.
```

**빛 효과**:
```
Abstract loose particle/light-effect overlay ONLY, portrait orientation,
1060x1484. Tiny drifting sapphire-blue starlight motes and soft glass-shard
glints, like starlight scattering slowly through the air. No solid
material, no rock or stone texture, no border/frame, no characters, no
text — this is a light layer meant to be composited on top of the existing
card background, not a full scene. High detail, soft glow bloom, 4K.
Entire canvas outside the glowing particles themselves must stay fully
transparent (alpha 0), transparent PNG.
```

**팝업 배경**:
```
A premium dark studio showcase backdrop for a trading-card reveal screen,
themed around a starlit night. A vast dark starlit night sky with faint
distant silhouettes of jagged glass-like peaks. Low contrast, desaturated,
moody and cinematic — no glow effects, no starlight sparkle, no particles
(those are added separately), just the base environment/material. No text,
no logos, no people, no readable shapes, no bright highlights. Ultra-wide,
minimal, elegant, 4K, 2560x1440.
```

**팝업 배경 빛 효과**:
```
Abstract loose particle/light-effect overlay ONLY, ultra-wide, 2560x1440.
Tiny drifting sapphire-blue starlight motes and soft glass-shard glints —
sparse and soft, concentrated toward the edges and corners, keep the
vertical center column (a card sits there) mostly clear. No solid
material, no border/frame, no characters, no text — this is a light layer
meant to be composited on top of a popup backdrop behind a trading card,
not a full scene. High detail, soft glow bloom, 4K. Entire canvas outside
the glowing particles themselves must stay fully transparent (alpha 0),
transparent PNG.
```

---

### 6. 핑구 — `sjh4018` — 하늘색 + 연보라 · 구름/깃털 (CB)

**프레임** (하치 프레임 이미지는 실루엣 참고용으로만 첨부):
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at the top center, same inner content
window position — but redesign the surface material completely: soft pale
sky-blue cloud-marble, with fluffy cloud wisps and pale lavender feathers
bursting from the top-left and bottom-right corners instead of crystal
shards — airy, soft, dreamlike. No player, no text, no stats. Entire canvas
outside the frame's own linework (including the inner content window) must
be fully transparent. PNG with alpha channel, 1060x1484.
```

**배경**:
```
Abstract premium trading-card background art, portrait orientation. Soft
pale sky-blue cloud-textured slab with faint lavender veins, a cluster of
fluffy clouds and drifting pale feathers bursting from the upper-right
corner, soft airy daylight rim lighting. No characters, no people, no
border/frame, no text. High detail, 4K, PNG, 1060x1484.
```

**캐릭터** (핑구 참고 사진 첨부):
```
Turn the reference photo into a stylized premium trading-card 3D player
render, semi-realistic style. Soccer kit in sky-blue with pale lavender
trim. Grounded, reliable defensive stance — low center of gravity, knees
bent, arms out ready to block, alert and steady expression (a center-back
holding the line, not celebrating). Viewed from a slight low front 3/4
angle, visible head to mid-thigh. Soft airy blue-lavender rim lighting. No
frame, no text, no background — fully transparent PNG with alpha channel,
1060x1484, leave open space above the head and below the waist for
name/stat overlays.
```

**캐릭터 호버** (기존 핑구 캐릭터 이미지를 참고로 첨부):
```
Using the attached existing character render ONLY as an identity/likeness
and kit-color reference (same person, same sky-blue kit with pale lavender
trim, same overall art style) — do NOT repeat the same pose. Design a NEW,
more dynamic and eye-catching alternate pose for this same player: a
leaping diving header clearance, body arched in mid-air, fluffy clouds and
pale lavender feathers scattering dramatically around the motion. Viewed
from a slight low front 3/4 angle, visible head to mid-thigh. Soft airy
blue-lavender rim lighting. No frame, no text, no background — fully
transparent PNG with alpha channel, 1060x1484, leave open space above the
head and below the waist for name/stat overlays.
```

**뒷면**:
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at top center — design the BACK of this
same card (not the front): a soft pale sky-blue holographic foil surface,
with faint lavender cloud-and-feather patterns running beneath the
prismatic sheen, a single bold cloud emblem centered in the middle of the
shield (no readable text, no logos, no player), pale lavender metallic trim
tracing the inner border. Moody, premium, mysterious — looks like the
unrevealed back of this card before it's flipped. No text, no numbers, no
real brand marks. Entire canvas outside the frame's own linework must stay
fully transparent (alpha 0), only the shield shape itself is opaque.
1060x1484px, transparent PNG.
```

**빛 효과**:
```
Abstract loose particle/light-effect overlay ONLY, portrait orientation,
1060x1484. Softly drifting pale lavender light motes and a faint glowing
cloud-wisp haze, floating gently. No solid material, no rock or stone
texture, no border/frame, no characters, no text — this is a light layer
meant to be composited on top of the existing card background, not a full
scene. High detail, soft glow bloom, 4K. Entire canvas outside the glowing
particles themselves must stay fully transparent (alpha 0), transparent
PNG.
```

**팝업 배경**:
```
A premium dark studio showcase backdrop for a trading-card reveal screen,
themed around a dusk sky. A soft dusk sky above distant layered clouds
fading into darkness. Low contrast, desaturated, moody and cinematic — no
glow effects, no feather sparkle, no particles (those are added
separately), just the base environment/material. No text, no logos, no
people, no readable shapes, no bright highlights. Ultra-wide, minimal,
elegant, 4K, 2560x1440.
```

**팝업 배경 빛 효과**:
```
Abstract loose particle/light-effect overlay ONLY, ultra-wide, 2560x1440.
Softly drifting pale lavender light motes and a faint glowing cloud-wisp
haze — sparse and soft, concentrated toward the edges and corners, keep
the vertical center column (a card sits there) mostly clear. No solid
material, no border/frame, no characters, no text — this is a light layer
meant to be composited on top of a popup backdrop behind a trading card,
not a full scene. High detail, soft glow bloom, 4K. Entire canvas outside
the glowing particles themselves must stay fully transparent (alpha 0),
transparent PNG.
```

---

### 7. 해파린 — `haepalin` — 연한 라벤더 + 진보라 · 심해 해파리/발광생물 (CB)

해파린의 실제 해파리(jellyfish) RP를 반영한 모티프 — 색은 원래 배정된 라벤더/진보라 그대로, 소재만 심해/해파리 컨셉으로.

**프레임** (하치 프레임 이미지는 실루엣 참고용으로만 첨부):
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at the top center, same inner content
window position — but redesign the surface material completely: pale
lilac-white coral-like stone, with glowing lavender-to-deep-purple
bioluminescent jellyfish tendrils and soft glowing sea anemone wisps
bursting from the top-left and bottom-right corners instead of crystal
shards — dreamy, ethereal, deep-sea glow. No player, no text, no stats.
Entire canvas outside the frame's own linework (including the inner
content window) must be fully transparent. PNG with alpha channel,
1060x1484.
```

**배경**:
```
Abstract premium trading-card background art, portrait orientation. Very
pale lilac coral-textured stone slab with soft violet current-like veins,
a cluster of glowing lavender-purple bioluminescent jellyfish drifting and
trailing tendrils bursting from the upper-right corner, tiny glowing
plankton particles drifting in the water, dreamy soft-focus underwater rim
lighting. No characters, no people, no border/frame, no text. High detail,
4K, PNG, 1060x1484.
```

**캐릭터** (해파린 참고 사진 첨부):
```
Turn the reference photo into a stylized premium trading-card 3D player
render, semi-realistic style. Soccer kit in pale lavender with deep purple
trim. Graceful heading pose — jumping to win an aerial ball, body arched,
hair and clothing flowing weightlessly like jellyfish tendrils, elegant
and controlled rather than aggressive, a faint soft bioluminescent glow
trailing off the hair/fabric edges. Viewed from a slight low front 3/4
angle, visible head to mid-thigh. Soft dreamy lavender-purple rim
lighting. No frame, no text, no background — fully transparent PNG with
alpha channel, 1060x1484, leave open space above the head and below the
waist for name/stat overlays.
```

**캐릭터 호버** (기존 해파린 캐릭터 이미지를 참고로 첨부):
```
Using the attached existing character render ONLY as an identity/likeness
and kit-color reference (same person, same pale lavender kit with deep
purple trim, same overall art style) — do NOT repeat the same pose. Design
a NEW, more dynamic and eye-catching alternate pose for this same player: a
full-stretch sliding tackle/interception, body extended low across the
ground, glowing lavender-purple jellyfish tendrils trailing weightlessly
behind the motion. Viewed from a slight low front 3/4 angle, visible head
to mid-thigh. Soft dreamy lavender-purple rim lighting. No frame, no text,
no background — fully transparent PNG with alpha channel, 1060x1484, leave
open space above the head and below the waist for name/stat overlays.
```

**뒷면**:
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at top center — design the BACK of this
same card (not the front): a pale lilac holographic foil surface, with
faint deep-purple bioluminescent jellyfish-tendril patterns running
beneath the prismatic sheen, a single bold jellyfish-silhouette emblem
centered in the middle of the shield (no readable text, no logos, no
player), deep-purple metallic trim tracing the inner border. Moody,
premium, mysterious — looks like the unrevealed back of this card before
it's flipped. No text, no numbers, no real brand marks. Entire canvas
outside the frame's own linework must stay fully transparent (alpha 0),
only the shield shape itself is opaque. 1060x1484px, transparent PNG.
```

**빛 효과**:
```
Abstract loose particle/light-effect overlay ONLY, portrait orientation,
1060x1484. Drifting lavender-purple bioluminescent glow particles and tiny
glowing plankton specks, pulsing softly like underwater bioluminescence.
No solid material, no rock or stone texture, no border/frame, no
characters, no text — this is a light layer meant to be composited on top
of the existing card background, not a full scene. High detail, soft glow
bloom, 4K. Entire canvas outside the glowing particles themselves must
stay fully transparent (alpha 0), transparent PNG.
```

**팝업 배경**:
```
A premium dark studio showcase backdrop for a trading-card reveal screen,
themed around a deep-sea environment. A deep dim underwater scene with
faint distant silhouettes and soft caustic light fading into darkness. Low
contrast, desaturated, moody and cinematic — no glow effects, no
bioluminescence, no particles (those are added separately), just the base
environment/material. No text, no logos, no people, no readable shapes,
no bright highlights. Ultra-wide, minimal, elegant, 4K, 2560x1440.
```

**팝업 배경 빛 효과**:
```
Abstract loose particle/light-effect overlay ONLY, ultra-wide, 2560x1440.
Drifting lavender-purple bioluminescent glow particles and tiny glowing
plankton specks — sparse and soft, concentrated toward the edges and
corners, keep the vertical center column (a card sits there) mostly clear.
No solid material, no border/frame, no characters, no text — this is a
light layer meant to be composited on top of a popup backdrop behind a
trading card, not a full scene. High detail, soft glow bloom, 4K. Entire
canvas outside the glowing particles themselves must stay fully
transparent (alpha 0), transparent PNG.
```

---

### 8. 리냐 — `lina0108` — 선명한 핑크 + 연분홍 · 벚꽃 (FB)

**프레임** (하치 프레임 이미지는 실루엣 참고용으로만 첨부):
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at the top center, same inner content
window position — but redesign the surface material completely: pale
blush-pink stone, with a cherry-blossom branch and swirling sakura petals
in vivid pink bursting from the top-left and bottom-right corners instead
of crystal shards — playful, romantic spring aesthetic. No player, no
text, no stats. Entire canvas outside the frame's own linework (including
the inner content window) must be fully transparent. PNG with alpha
channel, 1060x1484.
```

**배경**:
```
Abstract premium trading-card background art, portrait orientation. Pale
blush-pink stone slab with soft pink veins, a cherry-blossom branch with
vivid pink blossoms bursting from the upper-right corner, swirling petals
drifting through the air, warm playful rim lighting. No characters, no
people, no border/frame, no text. High detail, 4K, PNG, 1060x1484.
```

**캐릭터** (리냐 참고 사진 첨부):
```
Turn the reference photo into a stylized premium trading-card 3D player
render, semi-realistic style. Soccer kit in vivid pink with pale-pink trim.
Playful, energetic overlapping run down the wing — mid-stride, one hand
raised in a cheerful wave/celebration gesture, bright fun-loving grin.
Viewed from a slight low front 3/4 angle, visible head to mid-thigh. Warm
vivid pink rim lighting. No frame, no text, no background — fully
transparent PNG with alpha channel, 1060x1484, leave open space above the
head and below the waist for name/stat overlays.
```

**캐릭터 호버** (기존 리냐 캐릭터 이미지를 참고로 첨부):
```
Using the attached existing character render ONLY as an identity/likeness
and kit-color reference (same person, same vivid pink kit with pale-pink
trim, same overall art style) — do NOT repeat the same pose. Design a NEW,
more dynamic and eye-catching alternate pose for this same player: a
dynamic crossing strike caught mid-run, body leaning into the kick, sakura
petals bursting off the striking foot. Viewed from a slight low front 3/4
angle, visible head to mid-thigh. Warm vivid pink rim lighting. No frame,
no text, no background — fully transparent PNG with alpha channel,
1060x1484, leave open space above the head and below the waist for
name/stat overlays.
```

**뒷면**:
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at top center — design the BACK of this
same card (not the front): a pale blush-pink holographic foil surface,
with faint vivid-pink sakura-branch patterns running beneath the prismatic
sheen, a single bold cherry-blossom emblem centered in the middle of the
shield (no readable text, no logos, no player), vivid-pink metallic trim
tracing the inner border. Moody, premium, mysterious — looks like the
unrevealed back of this card before it's flipped. No text, no numbers, no
real brand marks. Entire canvas outside the frame's own linework must stay
fully transparent (alpha 0), only the shield shape itself is opaque.
1060x1484px, transparent PNG.
```

**빛 효과**:
```
Abstract loose particle/light-effect overlay ONLY, portrait orientation,
1060x1484. Softly drifting glowing pink sparkle motes and faint light
glints, like sunlight catching falling petals. No solid material, no rock
or stone texture, no border/frame, no characters, no text — this is a
light layer meant to be composited on top of the existing card background,
not a full scene. High detail, soft glow bloom, 4K. Entire canvas outside
the glowing particles themselves must stay fully transparent (alpha 0),
transparent PNG.
```

**팝업 배경**:
```
A premium dark studio showcase backdrop for a trading-card reveal screen,
themed around a spring garden at dusk. A soft dusk garden with distant
cherry-blossom tree silhouettes fading into darkness. Low contrast,
desaturated, moody and cinematic — no glow effects, no petal sparkle, no
particles (those are added separately), just the base environment/material.
No text, no logos, no people, no readable shapes, no bright highlights.
Ultra-wide, minimal, elegant, 4K, 2560x1440.
```

**팝업 배경 빛 효과**:
```
Abstract loose particle/light-effect overlay ONLY, ultra-wide, 2560x1440.
Softly drifting glowing pink sparkle motes and faint light glints — sparse
and soft, concentrated toward the edges and corners, keep the vertical
center column (a card sits there) mostly clear. No solid material, no
border/frame, no characters, no text — this is a light layer meant to be
composited on top of a popup backdrop behind a trading card, not a full
scene. High detail, soft glow bloom, 4K. Entire canvas outside the glowing
particles themselves must stay fully transparent (alpha 0), transparent
PNG.
```

---

### 9. 빙밍 — `tleod1818` — 어두운 남색 + 에메랄드 · 폭풍우/번개 (FB)

해파린에게 심해/해파리 모티프를 넘기면서, 빙밍은 다른 선수와 안 겹치는 폭풍우/번개 모티프로 변경 — 색은 원래 배정된 어두운 남색+에메랄드 그대로.

**프레임** (하치 프레임 이미지는 실루엣 참고용으로만 첨부):
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at the top center, same inner content
window position — but redesign the surface material completely: a very
dark storm-cloud-textured navy rock, with crackling emerald-green
lightning bolts and swirling storm-cloud wisps bursting from the top-left
and bottom-right corners instead of crystal shards — intense, electric,
stormy. No player, no text, no stats. Entire canvas outside the frame's
own linework (including the inner content window) must be fully
transparent. PNG with alpha channel, 1060x1484.
```

**배경**:
```
Abstract premium trading-card background art, portrait orientation.
Near-black navy storm-cloud-textured slab with faint electric-blue vein
cracks, a cluster of crackling emerald-green lightning bolts and dark
storm clouds bursting from the upper-right corner, tiny drifting spark
particles, cool dramatic stormy rim lighting. No characters, no people, no
border/frame, no text. High detail, 4K, PNG, 1060x1484.
```

**캐릭터** (빙밍 참고 사진 첨부):
```
Turn the reference photo into a stylized premium trading-card 3D player
render, semi-realistic style. Soccer kit in dark navy with emerald-green
trim. Intense low defensive sliding-tackle pose — body low to the ground,
one leg extended, sharp focused determination, a crack of emerald-green
lightning lighting up the scene behind. Viewed from a slight low front 3/4
angle, visible head to mid-thigh. Cool dramatic rim lighting with an
emerald-green electric highlight. No frame, no text, no background —
fully transparent PNG with alpha channel, 1060x1484, leave open space
above the head and below the waist for name/stat overlays.
```

**캐릭터 호버** (기존 빙밍 캐릭터 이미지를 참고로 첨부):
```
Using the attached existing character render ONLY as an identity/likeness
and kit-color reference (same person, same dark navy kit with
emerald-green trim, same overall art style) — do NOT repeat the same pose.
Design a NEW, more dynamic and eye-catching alternate pose for this same
player: an explosive upright sprint, one arm driving forward, a crackling
emerald-green lightning bolt streaking off the trailing boot — a more
vertical, powerful motion than a low tackle. Viewed from a slight low
front 3/4 angle, visible head to mid-thigh. Cool dramatic rim lighting
with an emerald-green electric highlight. No frame, no text, no
background — fully transparent PNG with alpha channel, 1060x1484, leave
open space above the head and below the waist for name/stat overlays.
```

**뒷면**:
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at top center — design the BACK of this
same card (not the front): a near-black navy holographic foil surface,
with faint crackling emerald-green lightning-vein patterns running beneath
the prismatic sheen, a single bold lightning-bolt emblem centered in the
middle of the shield (no readable text, no logos, no player), emerald-green
metallic trim tracing the inner border. Moody, premium, mysterious — looks
like the unrevealed back of this card before it's flipped. No text, no
numbers, no real brand marks. Entire canvas outside the frame's own
linework must stay fully transparent (alpha 0), only the shield shape
itself is opaque. 1060x1484px, transparent PNG.
```

**빛 효과**:
```
Abstract loose particle/light-effect overlay ONLY, portrait orientation,
1060x1484. Crackling emerald-green lightning-spark particles and faint
electric-blue glow flickers, sparking intermittently. No solid material,
no rock or stone texture, no border/frame, no characters, no text — this
is a light layer meant to be composited on top of the existing card
background, not a full scene. High detail, soft glow bloom, 4K. Entire
canvas outside the glowing particles themselves must stay fully
transparent (alpha 0), transparent PNG.
```

**팝업 배경**:
```
A premium dark studio showcase backdrop for a trading-card reveal screen,
themed around a storm. A vast dark stormy sky with distant silhouettes of
heavy storm clouds. Low contrast, desaturated, moody and cinematic — no
glow effects, no lightning sparks, no particles (those are added
separately), just the base environment/material. No text, no logos, no
people, no readable shapes, no bright highlights. Ultra-wide, minimal,
elegant, 4K, 2560x1440.
```

**팝업 배경 빛 효과**:
```
Abstract loose particle/light-effect overlay ONLY, ultra-wide, 2560x1440.
Crackling emerald-green lightning-spark particles and faint electric-blue
glow flickers — sparse and soft, concentrated toward the edges and
corners, keep the vertical center column (a card sits there) mostly clear.
No solid material, no border/frame, no characters, no text — this is a
light layer meant to be composited on top of a popup backdrop behind a
trading card, not a full scene. High detail, soft glow bloom, 4K. Entire
canvas outside the glowing particles themselves must stay fully
transparent (alpha 0), transparent PNG.
```

---

### 10. 재닌 — `janine95kim` — 스카이 블루 · 서리/오로라 (GK)

**프레임** (하치 프레임 이미지는 실루엣 참고용으로만 첨부):
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at the top center, same inner content
window position — but redesign the surface material completely: clean icy
pale-blue frosted stone, with sharp frost patterns and a faint aurora-light
streak in silvery-white bursting from the top-left and bottom-right
corners instead of crystal shards — crisp, clean, wintry. No player, no
text, no stats. Entire canvas outside the frame's own linework (including
the inner content window) must be fully transparent. PNG with alpha
channel, 1060x1484.
```

**배경**:
```
Abstract premium trading-card background art, portrait orientation. Icy
pale-blue frosted stone slab with silvery frost-vein cracks, a streak of
faint aurora-like light and frost crystals bursting from the upper-right
corner, crisp bright cold rim lighting. No characters, no people, no
border/frame, no text. High detail, 4K, PNG, 1060x1484.
```

**캐릭터** (재닌 참고 사진 첨부):
```
Turn the reference photo into a stylized premium trading-card 3D player
render, semi-realistic style. Goalkeeper kit in sky-blue with silver trim,
goalkeeper gloves. Dramatic full-stretch diving save pose — body fully
extended horizontally in mid-air, both arms reaching out toward the ball,
intense focused expression. Viewed from a slight low front 3/4 angle,
visible head to mid-thigh (crop to keep the diving pose readable within the
card's portrait canvas). Crisp bright rim lighting. No frame, no text, no
background — fully transparent PNG with alpha channel, 1060x1484, leave
open space above the head and below the waist for name/stat overlays.
```

**캐릭터 호버** (기존 재닌 캐릭터 이미지를 참고로 첨부):
```
Using the attached existing character render ONLY as an identity/likeness
and kit-color reference (same person, same goalkeeper kit in sky-blue with
silver trim and goalkeeper gloves, same overall art style) — do NOT repeat
the same pose. Design a NEW, more dynamic and eye-catching alternate pose
for this same player: an acrobatic one-handed tip-over-the-bar save, body
arched vertically upward (a different axis of motion than the horizontal
dive), silvery aurora light trailing off the outstretched glove. Viewed
from a slight low front 3/4 angle, visible head to mid-thigh (crop to keep
the pose readable within the card's portrait canvas). Crisp bright rim
lighting. No frame, no text, no background — fully transparent PNG with
alpha channel, 1060x1484, leave open space above the head and below the
waist for name/stat overlays.
```

**뒷면**:
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at top center — design the BACK of this
same card (not the front): an icy pale-blue holographic foil surface, with
faint silvery aurora-streak patterns running beneath the prismatic sheen, a
single bold frost-crystal emblem centered in the middle of the shield (no
readable text, no logos, no player), silvery-white metallic trim tracing
the inner border. Moody, premium, mysterious — looks like the unrevealed
back of this card before it's flipped. No text, no numbers, no real brand
marks. Entire canvas outside the frame's own linework must stay fully
transparent (alpha 0), only the shield shape itself is opaque. 1060x1484px,
transparent PNG.
```

**빛 효과**:
```
Abstract loose particle/light-effect overlay ONLY, portrait orientation,
1060x1484. Softly drifting silvery-white aurora light streaks and tiny
glowing frost-crystal sparkle particles, shimmering gently. No solid
material, no rock or stone texture, no border/frame, no characters, no
text — this is a light layer meant to be composited on top of the existing
card background, not a full scene. High detail, soft glow bloom, 4K.
Entire canvas outside the glowing particles themselves must stay fully
transparent (alpha 0), transparent PNG.
```

**팝업 배경**:
```
A premium dark studio showcase backdrop for a trading-card reveal screen,
themed around an icy tundra. A vast dim icy tundra horizon fading into
darkness. Low contrast, desaturated, moody and cinematic — no glow
effects, no aurora light, no particles (those are added separately), just
the base environment/material. No text, no logos, no people, no readable
shapes, no bright highlights. Ultra-wide, minimal, elegant, 4K, 2560x1440.
```

**팝업 배경 빛 효과**:
```
Abstract loose particle/light-effect overlay ONLY, ultra-wide, 2560x1440.
Softly drifting silvery-white aurora light streaks and tiny glowing
frost-crystal sparkle particles — sparse and soft, concentrated toward the
edges and corners, keep the vertical center column (a card sits there)
mostly clear. No solid material, no border/frame, no characters, no text —
this is a light layer meant to be composited on top of a popup backdrop
behind a trading card, not a full scene. High detail, soft glow bloom, 4K.
Entire canvas outside the glowing particles themselves must stay fully
transparent (alpha 0), transparent PNG.
```

---

## 보너스: 하치 — 화려한 스페셜 리메이크 (`hachi97`)

하치는 이 카드 시리즈의 첫 번째 테스트 카드이자 제일 좋아하는 캐릭터라, 다른 10명과 똑같은 톤으로 두지 않고 **더 화려하고 장식이 많은 상위 등급 느낌**으로 새로 만들고 싶을 때 쓰는 프롬프트. 하치 RP가 **용(龍)**이라(팬닉도 "용볼") 모티프를 용으로 고정 — 다른 9명처럼 크리스탈/식물/룬문양 같은 무생물 모티프가 아니라, 용 비늘·발톱·날개·용의 기운(불/신비로운 에너지) 같은 "용" 자체를 형상화한 장식으로.

**팔레트는 고정: 금색(골드/앰버) + 자수정(바이올렛) 용의 기운** — `totyCardTheme.ts`의 `hachi97` 항목(`color: #ffe29e`, `glow: #d9b3ff`)과 이미 맞춰져 있는 값. 원래는 "캐릭터 사진에서 어울리는 색을 생성 도구가 스스로 고르게" 하려 했는데, 프레임/배경/캐릭터/뒷면/빛효과가 전부 **별도의 생성 요청**이다 보니 매번 새로 색을 추론하면서 서로 어긋남 — 실제로 프레임은 금색+자수정으로 나왔는데 배경은 하늘색으로 나오는 불일치가 발생했음. 그래서 **팔레트를 텍스트로 고정**하고, **프레임 이미지를 실루엣뿐 아니라 색상 참고용으로도 함께 첨부**하도록 아래 프롬프트를 수정함 — 하늘색 등으로 다시 어긋나면 이 두 가지(고정 팔레트 문구 + 프레임 이미지 색상 참고 첨부)가 실제로 지켜졌는지 먼저 확인.

**프레임** (하치 캐릭터 참고 사진 첨부 + 기존 하치 프레임 이미지를 실루엣 참고용으로 첨부):
```
Using a warm golden-amber palette with soft amethyst-violet accents (the
same palette this card's dragon-fire motif always uses — do not substitute
a different color scheme such as blue), and using the attached card frame
image ONLY as a silhouette/structure reference (same ornate shield-shaped
outer silhouette, same scalloped border curve, same inner content window
position), design a noticeably more lavish, higher-rarity dragon-themed
version of this frame using that palette: the corner ornament reimagined
as coiling dragon
claws and dragon scales bursting from the top-left and bottom-right
corners (instead of generic crystal shards), fine dragon-scale texture
etched into the metal along the whole border, small dragon horns or
wing-tip motifs flanking the top crest. Replace the plain laurel-wreath
crest with a larger, more intricate crest featuring a small coiled dragon
emblem. Add wisps of mystical dragon-fire or glowing draconic energy
drifting from the claw clusters, extra sparkle/ember particles, and a
subtle prismatic sheen along the metal edges to read as the rarest tier in
the set — more ornate and detailed than a standard card in this series,
while keeping the same overall silhouette. No player, no text, no stats.
Entire canvas outside the frame's own linework (including the inner
content window) must be fully transparent. PNG with alpha channel,
1060x1484.
```

**배경** (완성된 하치 프레임 이미지를 색상 참고용으로 함께 첨부 — 구도가 아니라 팔레트를 그 이미지에 맞추라는 의미):
```
Abstract premium trading-card background art, portrait orientation, using
the exact same warm golden-amber + amethyst-violet color palette as the
attached frame image — match those colors closely, do not introduce a
different color scheme such as blue. A dense, richly detailed cracked slab
with glowing veins, a large cluster of coiling dragon claws and dragon
scales bursting from one corner, wisps of mystical dragon-fire or glowing
draconic energy swirling through the air, extra layers of sparkle, ember,
and glitter dust, dramatic rim lighting for a noticeably more lavish,
higher-rarity look than a standard card in this series. No characters, no
people, no border/frame, no text. High detail, 4K, PNG, 1060x1484.
```

**캐릭터** (하치 참고 사진 + 완성된 하치 프레임 이미지를 색상 참고용으로 함께 첨부):
```
Turn the reference photo into a stylized premium trading-card 3D player
render, semi-realistic style, using the same warm golden-amber +
amethyst-violet palette as the attached frame image (not a palette
re-derived from her hair/eye/outfit colors — match the frame's colors
specifically). A confident, dynamic hero pose (keep
her signature thumbs-up-forward energy if it fits, or a slightly more
dynamic action variant), full of personality. Subtle draconic accents tying
into her dragon RP — small dragon-scale pattern trim or a tiny dragon
emblem on the kit, and a faint aura of glowing draconic energy or wisps of
mystical fire curling around her (she stays fully human — this is a subtle
aura/accessory effect, not a literal dragon transformation). Viewed from a
slight low front 3/4 angle, visible head to mid-thigh. Rich, dramatic rim
lighting with a touch of sparkle/ember, matching the more lavish,
higher-rarity treatment of the rest of this card (more detail and polish
than a standard card in this series). No frame, no text, no background —
fully transparent PNG with alpha channel, 1060x1484, leave open space
above the head and below the waist for name/stat overlays.
```

**캐릭터 호버** (기존 하치 캐릭터 이미지 + 완성된 하치 프레임 이미지를 색상 참고용으로 함께 첨부):
```
Using the attached existing character render ONLY as an identity/likeness
reference (same person, same overall art style) and the attached frame
image for its exact warm golden-amber + amethyst-violet palette (do not
introduce a different color scheme such as blue) — do NOT repeat the same
pose. Design a NEW, even more dynamic and dramatic alternate pose for this
same player, matching the more lavish, higher-rarity treatment of the rest
of this card: a leaping mid-air action pose with wings of glowing draconic
fire flaring open behind her, full of theatrical energy. Viewed from a
slight low front 3/4 angle, visible head to mid-thigh. Rich, dramatic rim
lighting with a touch of sparkle/ember. No frame, no text, no background —
fully transparent PNG with alpha channel, 1060x1484, leave open space
above the head and below the waist for name/stat overlays.
```

**뒷면** (완성된 하치 프레임 이미지를 실루엣 + 색상 참고용으로 함께 첨부):
```
Using the attached card frame image as a silhouette/structure reference
(same ornate shield-shaped outer silhouette, same scalloped border curve,
same inner content window position) AND matching its exact warm
golden-amber + amethyst-violet color palette (do not introduce a different
color scheme such as blue), design the BACK of this same card (not the
front): a dark holographic foil surface with faint dragon-scale texture
and wisps of
glowing draconic energy drifting beneath the prismatic sheen, a single bold
coiled-dragon emblem centered in the middle of the shield (no readable
text, no logos, no player), metallic trim in that same palette tracing the
inner border — noticeably more lavish and detailed than a standard card in
this series, matching the higher-rarity treatment of the rest of this card.
Moody, premium, mysterious — looks like the unrevealed back of this card
before it's flipped. No text, no numbers, no real brand marks. Entire
canvas outside the frame's own linework must stay fully transparent
(alpha 0), only the shield shape itself is opaque. 1060x1484px, transparent
PNG.
```

**빛 효과** (완성된 하치 프레임 이미지를 색상 참고용으로 함께 첨부):
```
Abstract loose particle/light-effect overlay ONLY, portrait orientation,
1060x1484, matching the exact warm golden-amber + amethyst-violet color
palette of the attached frame image (do not introduce a different color
scheme such as blue). Wisps of glowing draconic energy, sparkle, ember,
and glitter dust drifting slowly through the air — noticeably more lavish
and dense than a
standard card in this series, matching the higher-rarity treatment of the
rest of this card. No solid material, no rock or stone texture, no
border/frame, no characters, no text — this is a light layer meant to be
composited on top of the existing card background, not a full scene. High
detail, soft glow bloom, 4K. Entire canvas outside the glowing particles
themselves must stay fully transparent (alpha 0), transparent PNG.
```

**팝업 배경** (완성된 하치 프레임 이미지를 색상 참고용으로 함께 첨부):
```
A premium dark studio showcase backdrop for a trading-card reveal screen,
themed around an ancient dragon lair. A vast dim ancient dragon lair with
faint distant silhouettes of jagged claw/rock formations fading into
darkness, using the exact same warm golden-amber + amethyst-violet color
palette as the attached frame image (do not introduce a different color
scheme such as blue). Low contrast, desaturated, moody and cinematic — no
glow effects, no ember sparkle, no particles (those are added separately),
just the base environment/material. No text, no logos, no people, no
readable shapes, no bright highlights. Ultra-wide, minimal, elegant, 4K,
2560x1440.
```

**팝업 배경 빛 효과** (완성된 하치 프레임 이미지를 색상 참고용으로 함께 첨부):
```
Abstract loose particle/light-effect overlay ONLY, ultra-wide, 2560x1440,
matching the exact warm golden-amber + amethyst-violet color palette of
the attached frame image. Wisps of glowing draconic energy, sparkle,
ember, and glitter dust drifting slowly — sparse and soft, concentrated
toward the edges and corners, keep the vertical center column (a card sits
there) mostly clear. No solid material, no border/frame, no characters, no
text — this is a light layer meant to be composited on top of a popup
backdrop behind a trading card, not a full scene. High detail, soft glow
bloom, 4K. Entire canvas outside the glowing particles themselves must
stay fully transparent (alpha 0), transparent PNG.
```

---

## 보너스: 우왁굳 — 숨겨진 이스터에그 카드 (`woowakgood`)

이 동아리(디비전 테스트)를 운영하는 방장 우왁굳을 소재로 한 **숨겨진 12번째 카드**. 신청자가 아니라서 `roster.yaml`에는 없고, 코드에도 하드코딩된 별도 객체(`src/web/toty-card/woowakgoodBonusCard.ts`)로만 존재함. 사이트 방문자가 **위의 11장(선수 10명 + 하치 보너스) 카드를 전부 한 번씩 열람(공개)하면** 그 순간 화면 상단 가운데에 해금 토스트가 뜨고 우측 상단에 반짝이는 플로팅 버튼이 나타나며, 눌러야만 이 카드를 열람할 수 있음(`useWoowakgoodBonusUnlock.ts`). 포지션은 "ALL", 디비전은 1(=1부 리그, 이 사이트 기준 최상위 등급)로 고정 — 숨겨진 만큼 "궁극/전설급" 카드로 읽히게 하려는 의도.

**팔레트/모티프는 고정: 페리도트 그린(연두빛 보석 톤) 메인 + BMW를 좋아하는 취향을 반영한 모터스포츠 모티프.** `totyCardTheme.ts`의 `woowakgood` 항목(`color: #7fdca4`, `glow: #4a7fff`)과 맞춰져 있음 — 초록이 메인 텍스트/장식색, 파랑은 은은한 글로우 악센트. 하치 섹션과 같은 이유로(프레임/배경/캐릭터가 각각 별도 생성 요청이라 색이 서로 어긋나기 쉬움) **완성된 프레임 이미지를 이후 배경/캐릭터/뒷면/빛효과 프롬프트에 색상 참고용으로 같이 첨부**할 것.

**⚠️ 상표 주의 (이 섹션에만 해당)**: BMW는 실존 브랜드이므로, 실제 BMW 로고(키드니 그릴, 프로펠러 라운델 엠블럼)나 "BMW" 워드마크를 그대로 그리게 하면 안 됨. 아래 프롬프트들은 전부 "모터스포츠 실루엣 / 스피드라인 / 카본파이버·크롬 질감 / M 스트라이프 느낌의 청록-보라-적 3색 악센트"처럼 **연상되는 요소만** 쓰고 실제 로고 재현은 명시적으로 금지하는 문구를 넣었음 — 생성 결과에 라운델이나 로고가 비친다면 반드시 다시 생성할 것.

**프레임** (하치 프레임 이미지는 실루엣 참고용으로만 첨부):
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at the top center, same inner content
window position — but redesign the surface material completely: a sleek
brushed-chrome and matte-black carbon-fiber-weave frame in a vivid
peridot-green primary tone, with sharp motorsport speed-line streaks and a
subtle tricolor racing-stripe accent (teal, violet, crimson — evoking a
premium German sports-sedan racing livery WITHOUT reproducing any real car
brand's actual logo, badge, roundel, or wordmark) bursting from the
top-left and bottom-right corners instead of crystal shards. Replace the
plain laurel-wreath crest with a larger, more intricate crest featuring a
small stylized checkered-flag/speed-chevron emblem (generic motorsport
iconography only, no real brand marks). This is the rarest, most lavish
card in the whole set — more ornate and detailed than a standard card,
with a subtle prismatic sheen along the metal edges. No player, no text,
no stats, no real logos or trademarks of any kind. Entire canvas outside
the frame's own linework (including the inner content window) must be
fully transparent. PNG with alpha channel, 1060x1484.
```

**배경** (완성된 프레임 이미지를 색상 참고용으로 함께 첨부):
```
Abstract premium trading-card background art, portrait orientation, using
the exact same vivid peridot-green primary palette as the attached frame
image (with subtle teal-violet-crimson racing-stripe accents) — match those
colors closely. A dense, richly detailed brushed-chrome and carbon-fiber
slab with glowing green speed-line veins running through it, a large
cluster of motorsport-inspired chrome shards and racing-stripe light
streaks bursting from the upper-right corner, dramatic garage/track rim
lighting. No real car logos, badges, or brand marks of any kind — evoke a
premium sports-sedan racing aesthetic abstractly only. No characters, no
people, no border/frame, no text. High detail, 4K, PNG, 1060x1484.
```

**캐릭터** (우왁굳 참고 사진 첨부 + 완성된 프레임 이미지를 색상 참고용으로 함께 첨부):
```
Turn the reference photo into a stylized premium trading-card 3D render,
semi-realistic style, using the same vivid peridot-green +
teal-violet-crimson racing-stripe palette as the attached frame image. The
reference photo's headphone ear-cup shows the number "30" — change this to
"40" in the render (keep the same font/style/red badge look, digits only
changed). Dressed as an elite football club manager/director rather than a
player —
a sharply tailored blazer over a crisp dress shirt, a slim racing-stripe
silk tie in the teal-violet-crimson accent colors, a peridot-green pocket
square, sleeve cuffs precise (no real car brand logos or badges anywhere
on the outfit). A confident, commanding "club owner / manager" stance —
arms crossed or one hand tucked into the blazer pocket, standing tall with
a knowing grin, radiating authority over the whole club rather than a
playing pose. A faint aura of glowing peridot-green energy with streaks of
light like motion-blur speed lines curling around him. Viewed from a
slight low front 3/4 angle, visible head to mid-thigh. Rich, dramatic rim
lighting with a touch of chrome sparkle, matching the most lavish,
highest-rarity treatment in this whole card series. No frame, no text, no
background, no real brand logos — fully transparent PNG with alpha
channel, 1060x1484, leave open space above the head and below the waist
for name/stat overlays.
```

**캐릭터 호버** (기존 우왁굳 캐릭터 이미지를 참고로 첨부 + 완성된 프레임 이미지를 색상 참고용으로 함께 첨부):
```
Using the attached existing character render ONLY as an identity/likeness
and outfit-color reference (same person, same tailored peridot-green +
teal-violet-crimson racing-stripe manager's suit, same overall art style).
That reference render's headphone ear-cup shows the number "30" — change
this to "40" in the new render (keep the same font/style/red badge look,
digits only changed). Do NOT repeat the same pose, and do NOT have him
tearing, opening, or
removing his shirt/jacket to reveal his body; keep him fully and sharply
dressed in the suit throughout. Design a NEW, more dynamic and
eye-catching alternate pose for this same "club director" character: a
passionate touchline outburst — tie loosened, blazer caught flaring open
like a cape in the wind (still worn, not shed), sleeves rolled up to the
forearm, one arm thrust forward in a sharp pointing gesture as if barking
tactical orders to the team, fierce determined expression. Streaks of
glowing peridot-green motion-blur speed lines and chrome sparkle surge
more intensely around him than in the base pose. Viewed from a slight low
front 3/4 angle, visible head to mid-thigh. Rich, dramatic rim lighting
with a touch of chrome sparkle, matching the most lavish, highest-rarity
treatment in this whole card series. No frame, no text, no background, no
real brand logos, no exposed torso — fully transparent PNG with alpha
channel, 1060x1484, leave open space above the head and below the waist
for name/stat overlays.
```

**뒷면** (완성된 프레임 이미지를 실루엣 + 색상 참고용으로 함께 첨부):
```
Using the attached card frame image as a silhouette/structure reference
(same ornate shield-shaped outer silhouette, same scalloped border curve,
same inner content window position) AND matching its exact vivid
peridot-green + teal-violet-crimson racing-stripe palette, design the BACK
of this same card (not the front): a dark holographic foil surface with
faint carbon-fiber-weave texture and streaks of glowing peridot-green
speed-line energy drifting beneath the prismatic sheen, a single bold
stylized checkered-flag/speed-chevron emblem centered in the middle of the
shield (no readable text, no real car logos, no player), chrome metallic
trim tracing the inner border — noticeably more lavish and detailed than a
standard card in this series. Moody, premium, mysterious — looks like the
unrevealed back of the rarest hidden card in the set. No text, no numbers,
no real brand marks of any kind. Entire canvas outside the frame's own
linework must stay fully transparent (alpha 0), only the shield shape
itself is opaque. 1060x1484px, transparent PNG.
```

**빛 효과** (완성된 프레임 이미지를 색상 참고용으로 함께 첨부):
```
Abstract loose particle/light-effect overlay ONLY, portrait orientation,
1060x1484, matching the exact vivid peridot-green + teal-violet-crimson
racing-stripe palette of the attached frame image. Streaks of glowing
peridot-green motion-blur speed lines, chrome sparkle, and drifting light
motes — noticeably more lavish and dense than a standard card in this
series, matching the highest-rarity treatment of the rest of this card. No
solid material, no rock or stone texture, no border/frame, no characters,
no text, no real brand marks — this is a light layer meant to be
composited on top of the existing card background, not a full scene. High
detail, soft glow bloom, 4K. Entire canvas outside the glowing particles
themselves must stay fully transparent (alpha 0), transparent PNG.
```

**팝업 배경** (완성된 프레임 이미지를 색상 참고용으로 함께 첨부):
```
A premium dark studio showcase backdrop for a trading-card reveal screen,
themed around a moody night garage/showroom. A vast dim showroom with
distant silhouettes of sleek car forms and chrome paneling fading into
darkness, faint peridot-green ambient light glowing from below, using the
exact same vivid peridot-green primary tone as the attached frame image
(do not introduce a different dominant color). Low contrast, desaturated,
moody and cinematic — no glow effects, no sparkle, no particles (those are
added separately), just the base environment/material. No text, no real
car logos or brand marks of any kind, no people, no readable shapes, no
bright highlights. Ultra-wide, minimal, elegant, 4K, 2560x1440.
```

**팝업 배경 빛 효과** (완성된 프레임 이미지를 색상 참고용으로 함께 첨부):
```
Abstract loose particle/light-effect overlay ONLY, ultra-wide, 2560x1440,
matching the exact vivid peridot-green + teal-violet-crimson racing-stripe
palette of the attached frame image. Streaks of glowing peridot-green
motion-blur speed lines and chrome sparkle drifting slowly — sparse and
soft, concentrated toward the edges and corners, keep the vertical center
column (a card sits there) mostly clear. No solid material, no border/
frame, no characters, no text, no real brand marks — this is a light layer
meant to be composited on top of a popup backdrop behind a trading card,
not a full scene. High detail, soft glow bloom, 4K. Entire canvas outside
the glowing particles themselves must stay fully transparent (alpha 0),
transparent PNG.
```

---

## 미니게임 공용 카드 뒷면 (카드 짝 맞추기, 미구현)

`src/web/minigame/`에 구현된 "카드 짝 맞추기" 미니게임(20장 뒤집어서 짝 맞추기)에 쓰이는 **모든 카드가 공유하는 단일 뒷면 이미지**. 위 "카드 뒷면" 섹션의 `<id>-card-back.webp`들은 선수마다 디자인이 전부 달라서 뒷면만 보고도 어떤 카드인지 구별되기 때문에 이 미니게임에는 쓸 수 없음 — 대신 어떤 선수 카드에도 어울리는 중립적인 "?" 디자인 한 장만 생성하면 됨.

- **캔버스**: 1060×1484px (다른 카드 아트와 동일 비율), 알파 채널 있는 투명 PNG
- **레퍼런스**: 하치 프레임 이미지(`src/web/assets/toty-cards/hachi97-frame.webp`)를 실루엣 참고용으로만 첨부
- **파일명**: `card-match-back.webp` → `src/web/assets/minigame/card-match-back.webp`에 저장 (기존 `totyCardAssets.ts`가 스캔하는 `<id>-card-back.webp`와는 별도 경로 — `cardMatchAssets.ts`가 이 폴더를 자동 스캔함). 이미지가 없어도 게임은 CSS로 그린 "?" 플레이스홀더로 정상 동작하고, 파일을 넣으면 자동으로 교체됨.

**뒷면**:
```
Using the attached card frame image ONLY as a silhouette/structure reference
— same ornate shield-shaped outer silhouette, same scalloped border curve,
same laurel-wreath crest position at top center, same inner content window
position — design a neutral, player-agnostic "mystery" card back meant to be
reused across an entire deck (not themed to any single character's colors):
a cool silver-and-slate holographic foil surface with a faint prismatic
sheen, subtle engraved constellation-like line patterns beneath the foil,
and one large bold glowing question mark ("?") centered in the middle of
the shield, rendered in a soft cyan-white glow. Silvery-white metallic trim
tracing the inner border. Moody, premium, mysterious — looks like the
unrevealed back of any card in the set, generic enough to represent all of
them equally. No text other than the single "?" glyph, no numbers, no
logos, no player art. Entire canvas outside the frame's own linework must
stay fully transparent (alpha 0), only the shield shape itself is opaque.
1060x1484px, transparent PNG.
```
