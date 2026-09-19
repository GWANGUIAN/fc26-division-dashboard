# 05. 월드 아트 — 지면·소품·건물·실내·FX·러시 게임

> **생성 실행용 문서**: 이미지를 실제로 만들 때는 스타일 문구가 프롬프트마다 풀어 들어 있고 스레드·레퍼런스·순서가 정리된 [10-image-generation-runbook.md](10-image-generation-runbook.md)를 사용한다. 이 문서는 설계·프롬프트의 원천이며, 고치면 `node docs/world/tools/build-image-runbook.mjs`로 10번 문서를 재생성한다.

맵을 구성하는 이미지의 프롬프트와 파일명 문서다. **스타일 바이블/STYLE_BLOCK/gpt-image 팁은 [04 §1](04-art-characters.md#1-스타일-바이블-모든-이미지-공통)를 그대로 사용**한다(스레드 첫 메시지로 STYLE_BLOCK을 먼저 붙여넣기; 배경 규칙만 이 문서의 항목별 지시가 우선). 좌표·배치는 [03](03-map-design.md), 전체 체크리스트는 [09](09-asset-checklist.md).

## 0. 공통 작업 방식

1. **스레드 분리**: 지면 / 소품 시트 / 건물 / 실내 / FX·러시를 각각 별도 스레드(STYLE_BLOCK 먼저)로 진행. 같은 카테고리는 한 스레드에서 이어서 만들어 톤을 맞춘다.
2. **시트 규칙**: 소품·FX는 **1536×1024 캔버스, 4열×3행(12칸, 칸당 384×341)**, 칸마다 오브젝트 1개를 중앙에 약 80% 크기로 그린다. 최종 크기는 표의 값으로 **변환 스크립트가 각 칸을 트림해 리사이즈**한다(AI가 상대 크기를 못 맞춰도 됨).
3. **지면 시트 규칙**: **1024×1024, 4×4(16타일, 칸당 256px)**, 모든 타일은 **네 변이 서로 이어지는 심리스**. 최종 32px 타일(시트 128×128).
4. **그림자**: 바닥에 떨어지는 그림자는 그리지 않는다(코드가 그림). 빛은 좌상단.
5. **저장**: 원본 PNG를 `tmp/world-src/<카테고리>/<원본이름>.png`로 저장 후 `pnpm convert:world-art`(S1에서 구현, [08](08-implementation-roadmap.md#3-변환-스크립트-사양)).
6. **시든 버전은 생성하지 않는다**: 지면·식물 소품은 스크립트가 `-withered`를 자동 파생([09 자동 생성](09-asset-checklist.md#자동-생성-파생-에셋)).

### 지면 시트 프롬프트 템플릿

```text
Create a seamless tileset texture sheet for a top-down pixel-art RPG on one 1024x1024 canvas: a strict 4x4 grid of 16 square tiles (each 256x256, no gaps, no borders, no grid lines, tiles fill the whole canvas, no transparency). EVERY tile must tile seamlessly with itself on all four edges (left edge matches right edge, top matches bottom). Straight top-down texture, no perspective, no objects casting shadows, no text. Each visible pixel block is about 8 px so the art reads as a 32x32-pixel tile. Keep large shapes bold so the texture stays readable when scaled down.
Theme: {{THEME}}
Tiles in order (left to right, top to bottom):
{{LIST}}
```

### 소품 시트 프롬프트 템플릿

```text
Create a pixel-art prop sheet for a top-down 3/4-view RPG on one 1536x1024 canvas: a strict grid of 4 columns x 3 rows (12 cells, each 384x341), exactly one object per cell, centred and filling about 80% of its cell. Transparent background (or flat #FF00FF), no ground plane, NO cast shadow on the ground, light from the top-left, no cell borders or grid lines, at least 8% empty margin inside every cell, no text or letters.
Theme: {{THEME}}
Objects in order (left to right, top to bottom):
{{LIST}}
```

## 1. 지면 텍스처 시트 (8장)

최종 위치 `src/web/assets/world/terrain/<시트>.webp`(128×128, 4×4 아틀라스). 슬롯 이름은 `terrainDefs.ts`가 (열,행)에 매핑한다. **슬롯 순서 = 좌→우, 위→아래**. 원본 이름 `terrain-<시트>.png`.

### 1-1. `terrain-core` — 잔디·길·광장
`THEME`: `warm sunny meadow park: lush grass with subtle mowing variation, tidy dirt paths, cobblestone paths and a paved plaza`
`LIST`: `1) lush grass A, 2) lush grass B (slightly darker), 3) lush grass C (with small clover), 4) lush grass D (lighter), 5) grass with tiny white and yellow flowers A, 6) grass with tiny flowers B, 7) grass with a few taller tufts, 8) darker shaded grass, 9) packed dirt path A, 10) packed dirt path B with pebbles, 11) grey cobblestone path A, 12) cobblestone path B, 13) light paved plaza stones A, 14) paved plaza stones B, 15) plaza checker tiles cream and pale mint, 16) plaza tile with a faint football emblem in the centre`
슬롯 ID: `grass-a, grass-b, grass-c, grass-d, grass-flower-a, grass-flower-b, grass-tuft, grass-shade, path-dirt-a, path-dirt-b, path-stone-a, path-stone-b, plaza-a, plaza-b, plaza-c, plaza-d`

### 1-2. `terrain-water` — 물·모래·다리
`THEME`: `calm blue lake water with animated ripple variations, deep water, sandy shore and wooden boardwalk planks`
`LIST`: `1-4) shallow water frames 1 to 4 (same tile with ripples shifted a little each frame so they loop), 5-8) deep water frames 1 to 4 (darker, looping ripples), 9) pale sand A, 10) pale sand B, 11) wet dark sand, 12) sand with pebbles A, 13) sand with pebbles B, 14) wooden bridge planks A (horizontal), 15) wooden bridge planks B (worn), 16) water with a lily pad`
슬롯 ID: `water-1..4, water-deep-1..4, sand-a, sand-b, sand-wet, pebble-a, pebble-b, bridge-plank-a, bridge-plank-b, water-lily`

### 1-3. `terrain-spring` — 봄 정원·용의 언덕
`THEME`: `pastel spring garden: pink cherry-blossom petals on grass, clover, flowerbeds, moss, soft earth, pink garden stones, tall meadow grass and a golden-tinted dragon hill grass`
`LIST`: `1) grass covered with sparse pink petals, 2) petals denser, 3) petals dense pink carpet, 4) clover patch A, 5) clover patch B, 6) pink flowerbed, 7) yellow flowerbed, 8) mossy ground, 9) soft dark earth A, 10) soft earth B, 11) ground with small creeping vines, 12) pink-grey garden path stones A, 13) garden path stones B, 14) tall meadow grass A, 15) tall meadow grass B, 16) grass with a golden tint and tiny gold sparkles`
슬롯 ID: `sakura-ground-a..c, clover-a, clover-b, flowerbed-pink, flowerbed-yellow, moss-a, soft-dirt-a, soft-dirt-b, vine-ground, garden-path-a, garden-path-b, meadow-tall-a, meadow-tall-b, dragon-gold-grass`

### 1-4. `terrain-frost` — 서리·달빛 호수
`THEME`: `cold twilight lakeside: snow, smooth ice rink surface, frosted grass, dark blue night grass with tiny glowing specks, star-patterned stone`
`LIST`: `1) snow A, 2) snow B, 3) snow with footprints, 4) smooth pale-blue ice A, 5) ice B with cracks, 6) ice C with scratch marks from skates, 7) frosted grass A, 8) frosted grass B, 9) deep blue night grass A, 10) night grass B with tiny glowing specks, 11) night grass C, 12) dark blue stone with tiny star patterns A, 13) star stone B, 14) starlit path stones A (faint glow), 15) starlit path stones B, 16) ice with a faint blue rink line`
슬롯 ID: `snow-a..c, ice-a..c, frozen-grass-a, frozen-grass-b, night-grass-a..c, star-stone-a, star-stone-b, starlit-path-a, starlit-path-b, ice-line`

### 1-5. `terrain-industrial` — 공업지구·용암
`THEME`: `hot industrial district: cracked volcanic rock, glowing orange lava cracks, ash, riveted metal plates, grates, asphalt with caution stripes, red circuit-pattern floor`
`LIST`: `1) cracked dark rock A, 2) cracked rock B, 3) rock with glowing lava cracks A, 4) lava cracks B (brighter), 5) grey ash ground A, 6) ash B, 7) riveted metal plate A, 8) metal plate B (scratched), 9) metal floor grate, 10) worn asphalt A, 11) asphalt B, 12) yellow-black caution stripe tile, 13) dark gunmetal floor with red circuit lines A, 14) circuit floor B, 15) scorched dirt, 16) bubbling lava pool`
슬롯 ID: `cracked-rock-a, cracked-rock-b, lava-crack-a, lava-crack-b, ash-a, ash-b, metal-plate-a, metal-plate-b, grate-a, asphalt-a, asphalt-b, caution-stripe, circuit-floor-a, circuit-floor-b, scorched-dirt, lava-pool`

### 1-6. `terrain-cloud` — 구름 언덕·룬
`THEME`: `sky-high stone terrace with fluffy cloud puffs, pale blue-white cloud stone, glowing violet rune slabs, sky tiles, wind-swept grass and blue marble`
`LIST`: `1) pale cloud-stone A, 2) cloud-stone B, 3) soft cloud puff ground A, 4) cloud puff B, 5) violet rune slab with glowing symbol A (abstract runes, not letters), 6) rune slab B, 7) dim inactive rune slab, 8) sky-blue glass tile A, 9) sky tile B, 10) wind-swept grass A, 11) wind grass B, 12) blue marble A, 13) blue marble B, 14) mossy stone A, 15) mossy stone B, 16) large glowing rune circle centre tile`
슬롯 ID: `cloud-stone-a, cloud-stone-b, cloud-puff-a, cloud-puff-b, rune-slab-a, rune-slab-b, rune-slab-dim, sky-tile-a, sky-tile-b, wind-grass-a, wind-grass-b, blue-marble-a, blue-marble-b, moss-stone-a, moss-stone-b, rune-glow`

### 1-7. `terrain-weed` — 제초동 구역
`THEME`: `barren grey land of a weed-killing factory: shaved bare ground, cracked concrete, over-mowed stripes, gravel, oil stains, sawdust, mower tracks, dead weed patches. Desaturated grey with rust-orange accents`
`LIST`: `1) bare grey ground A, 2) ground B, 3) ground C, 4) ground D, 5) cracked concrete A, 6) concrete B, 7) over-mown pale stripes A (very short dead grass), 8) stripes B, 9) gravel A, 10) gravel B, 11) dark oil stain, 12) sawdust and wood chips, 13) mower wheel tracks A, 14) tracks B, 15) barren dry dirt, 16) patch of dead brown weeds`
슬롯 ID: `gray-ground-a..d, concrete-a, concrete-b, mowed-stripe-a, mowed-stripe-b, gravel-a, gravel-b, oil-stain, sawdust, mower-track-a, mower-track-b, barren-dirt, dead-weed-patch`

### 1-8. `terrain-pitch` — 경기장·훈련장
`THEME`: `football pitch surfaces and stadium ground: light and dark mowing stripes, worn pitch, red running track, training turf, artificial turf, sand pit, stadium concourse, and a golden grass tile. Do NOT draw pitch lines (they are drawn by code)`
`LIST`: `1) light-stripe pitch grass, 2) dark-stripe pitch grass, 3) worn pitch A (bare patches), 4) worn pitch B, 5) red running track A, 6) red track B, 7) training turf A, 8) training turf B, 9) artificial turf A, 10) artificial turf B, 11) sand pit A, 12) sand pit B, 13) stadium concourse grey concrete, 14) goal-area dirt, 15) worn corner patch, 16) golden grass tile (lush gold-tinted grass with faint sparkles)`
슬롯 ID: `pitch-light, pitch-dark, pitch-worn-a, pitch-worn-b, track-red-a, track-red-b, turf-train-a, turf-train-b, turf-artificial-a, turf-artificial-b, sandpit-a, sandpit-b, concourse, goal-dirt, corner-worn, pitch-golden`

## 2. 소품 시트 (11장)

최종 `src/web/assets/world/props/<id>.webp`. 표의 **크기(px)** 는 최종 스프라이트 크기, **충돌(px)** 은 발끝(하단 중앙) 기준 충돌 사각형 `w×h`(`—`은 충돌 없음, `above`는 상단을 플레이어 위 레이어로 그림). 원본 이름 `props-<시트>.png`. 식물류(`*`)는 `-withered` 자동 파생.

> **S2 구현 메모**: 변환 파일 크기는 이 표의 px와 같지만 그림이 그보다 작게 그려진 소품이 많아, 코드(`data/propDefs.ts`)는 이 표의 충돌 값을 **보이는 그림 크기로 줄여** 쓴다([09 §11](09-asset-checklist.md#11-s2-소품-충돌-크기-대조-2026-09-19)). `above`는 표에 높이가 없어 소품별 px(`aboveFrom`)로 정했다: 나무 40(큰 참나무 48) = 줄기 높이, 아치 48–64 = 기둥 높이([01 §5](01-concept-and-architecture.md#5-렌더링-설계), [03 §11](03-map-design.md#11-충돌정렬-규칙-요약)).

### 2-1. `props-trees` — 나무
`THEME`: `trees for a top-down RPG village: leafy canopy and trunk clearly separated, canopy is bold and readable`
`LIST`: `1) round green oak tree, 2) big old oak tree, 3) tall green pine, 4) white birch tree, 5) pink cherry-blossom tree in full bloom, 6) fluffy pale-blue-and-white cloud tree, 7) snow-covered pine, 8) dark blue-purple night tree with glowing fruit, 9) bare dead tree with no leaves, 10) charred tree with glowing embers, 11) golden-leaf tree, 12) small tree stump with rings`

| 슬롯 | ID | 크기 | 충돌 | 비고 |
| --- | --- | --- | --- | --- |
| 1 | `tree-oak`* | 96×128 | 16×12, above 캐노피 | 기본 |
| 2 | `tree-oak-big`* | 128×160 | 20×14, above | 광장·경계 |
| 3 | `tree-pine`* | 80×128 | 14×12, above | 경계 숲 |
| 4 | `tree-birch`* | 80×120 | 14×12, above | |
| 5 | `tree-sakura`* | 112×136 | 16×12, above | 봄 지구 |
| 6 | `tree-cloud` | 96×128 | 16×12, above | 구름 지구 |
| 7 | `tree-frost` | 80×128 | 14×12, above | 서리 지구 |
| 8 | `tree-night` | 96×128 | 16×12, above | 호수 밤 |
| 9 | `tree-dead` | 88×128 | 14×12, above | 시든 표현·제초동 |
| 10 | `tree-lava` | 88×128 | 14×12, above | 공업지구 |
| 11 | `tree-golden` | 96×128 | 16×12, above | 용의 언덕 |
| 12 | `tree-stump` | 40×32 | 32×20 | |

### 2-2. `props-plants` — 덤불·꽃·풀
`THEME`: `small plants and bushes: readable silhouettes, bright colours`
`LIST`: `1) round green bush, 2) leafy bush with berries, 3) round bush covered in pink flowers, 4) hedge segment (a straight trimmed hedge, wide), 5) red flower patch, 6) yellow flower patch, 7) white flower patch, 8) blue flower patch, 9) tall grass tuft, 10) fern, 11) mushroom cluster, 12) reed clump (for lakeside)`

| 슬롯 | ID | 크기 | 충돌 |
| --- | --- | --- | --- |
| 1 | `bush-a`* | 48×40 | 32×16 |
| 2 | `bush-berry`* | 48×40 | 32×16 |
| 3 | `bush-flower`* | 56×44 | 36×16 |
| 4 | `hedge-h`* | 64×40 | 64×14 |
| 5 | `flower-red`* | 32×24 | — |
| 6 | `flower-yellow`* | 32×24 | — |
| 7 | `flower-white`* | 32×24 | — |
| 8 | `flower-blue`* | 32×24 | — |
| 9 | `grass-tuft-prop`* | 24×24 | — |
| 10 | `fern`* | 32×28 | — |
| 11 | `mushrooms` | 24×20 | — |
| 12 | `reeds` | 40×48 | 16×8 |

### 2-3. `props-rocks` — 바위·통나무·울타리
`THEME`: `rocks, logs, wooden fences and stone walls, cliff face segments`
`LIST`: `1) small rock, 2) medium rock, 3) large rock, 4) big mossy boulder, 5) single log, 6) stacked log pile, 7) wooden fence segment horizontal (wide), 8) wooden fence segment vertical (post seen from the side), 9) wooden fence corner, 10) stone wall segment horizontal, 11) stone wall segment vertical, 12) cliff face segment (grey rock wall with grass on top)`

| 슬롯 | ID | 크기 | 충돌 |
| --- | --- | --- | --- |
| 1 | `rock-small` | 24×20 | 20×10 |
| 2 | `rock-medium` | 40×32 | 34×14 |
| 3 | `rock-large` | 64×48 | 56×20 |
| 4 | `boulder-mossy` | 80×64 | 68×24 |
| 5 | `log` | 48×24 | 44×12 |
| 6 | `log-pile` | 56×40 | 48×16 |
| 7 | `fence-wood-h` | 64×32 | 64×10 |
| 8 | `fence-wood-v` | 16×48 | 12×44 |
| 9 | `fence-wood-corner` | 32×48 | 32×10 + 12×44 |
| 10 | `stone-wall-h` | 64×40 | 64×14 |
| 11 | `stone-wall-v` | 24×64 | 20×60 |
| 12 | `cliff-face` | 96×64 | 96×24 (맵 가장자리) |

### 2-4. `props-town` — 마을 소품
`THEME`: `village street furniture in warm wood, iron and mint-green accents; NO readable text on any sign`
`LIST`: `1) iron street lamp post, 2) wooden park bench facing the viewer, 3) wooden park bench seen from the side, 4) wooden arrow signpost (blank boards), 5) large community notice board with pinned blank papers, 6) village mailbox on a post, 7) metal trash bin, 8) flagpole with a mint flag showing a text-free sprout shield, 9) wooden planter box with flowers, 10) small market stall with fruit crates, 11) bicycle rack with two bikes, 12) doormat (top-down, flat)`

| 슬롯 | ID | 크기 | 충돌 |
| --- | --- | --- | --- |
| 1 | `lamp-post` | 24×64 | 10×8 |
| 2 | `bench-h` | 48×32 | 44×12 |
| 3 | `bench-v` | 24×40 | 20×30 |
| 4 | `signpost-arrow` | 32×56 | 10×8 |
| 5 | `board-daily` | 96×80 | 88×14 (상호작용 `board`) |
| 6 | `mailbox` | 24×40 | 12×8 (배달 대상) |
| 7 | `trash-bin` | 20×28 | 16×8 |
| 8 | `flagpole` | 32×96 | 10×8 |
| 9 | `planter` | 40×32 | 36×14 |
| 10 | `market-stall` | 64×56 | 56×16 |
| 11 | `bike-rack` | 56×32 | 48×12 |
| 12 | `mat-door` | 56×32 | — (바닥 데칼) |

### 2-5. `props-football` — 축구 소품
`THEME`: `football training and stadium props: mint and white team colours, bright orange cones`
`LIST`: `1) football goal seen from the side with the net opening facing right, 2) football goal seen from the front, 3) corner flag, 4) single orange cone, 5) a row of three orange cones, 6) training hurdle, 7) a classic black-and-white football, 8) blank LED advertising board (a wide dark panel, no text), 9) small stadium bleacher block with mint seats, 10) team dugout bench with a roof, 11) free-kick wall of three training mannequins, 12) a mesh bag full of footballs`

| 슬롯 | ID | 크기 | 충돌 |
| --- | --- | --- | --- |
| 1 | `goal-west` | 64×96 | 백네트 충돌 + 골 트리거(입구) |
| 2 | `goal-front` | 96×64 | 〃 |
| 3 | `corner-flag` | 16×40 | — |
| 4 | `cone-orange` | 20×24 | 트리거(콘 코스, 접촉 패널티) |
| 5 | `cone-row` | 64×24 | — |
| 6 | `hurdle` | 40×28 | 34×8 |
| 7 | `ball-standard` | 16×16 | 월드 볼(물리) |
| 8 | `ad-board` | 96×32 | 96×10 |
| 9 | `bleacher` | 128×96 | 120×40 |
| 10 | `dugout` | 96×64 | 90×24 |
| 11 | `dummy-wall` | 72×56 | 68×14 |
| 12 | `ball-bag` | 32×28 | 28×10 |

### 2-6. `props-spring` — 봄 정원·용의 언덕
`THEME`: `pastel spring garden and a golden dragon hill: pink and lime colours, gold and red accents`
`LIST`: `1) arch gate covered in cherry blossoms, 2) flower arch in mixed colours, 3) wooden vine trellis with green vines, 4) pink stone garden lantern, 5) pile of pink petals on the ground, 6) large coiled golden dragon statue, 7) golden dragon egg on a stone stand, 8) small koi pond with a stone rim, 9) tiny arched wooden bridge, 10) scarecrow wearing a mint scarf, 11) picnic blanket with a basket (top-down flat), 12) hanging wind chime on a post`

| 슬롯 | ID | 크기 | 충돌 |
| --- | --- | --- | --- |
| 1 | `sakura-arch` | 128×128 | 기둥 2개 12×10, above 상부 |
| 2 | `flower-arch` | 112×112 | 기둥 2개 |
| 3 | `vine-trellis` | 64×96 | 56×12 |
| 4 | `lantern-pink` | 24×48 | 14×10 |
| 5 | `petal-pile` | 48×24 | — |
| 6 | `dragon-statue` | 128×160 | 80×28 |
| 7 | `dragon-egg` | 40×56 | 28×14 |
| 8 | `pond-small` | 96×64 | 84×40 |
| 9 | `bridge-mini` | 64×48 | — |
| 10 | `scarecrow` | 40×72 | 12×10 |
| 11 | `picnic-blanket` | 56×40 | — |
| 12 | `windchime` | 24×56 | 10×8 |

### 2-7. `props-frost` — 서리·달빛 호수
`THEME`: `cold twilight lakeside: blue-white ice crystals, star lamps, dark blue night flowers, wooden docks`
`LIST`: `1) tall blue ice crystal cluster A, 2) ice crystal cluster B, 3) friendly snowman with a mint scarf, 4) outdoor brass telescope on a tripod, 5) glowing star-shaped street lamp, 6) ice-rink boards horizontal (white barrier with blue top), 7) ice-rink boards vertical, 8) glowing night flower patch, 9) small wooden rowing boat, 10) wooden dock post with a rope, 11) pier lantern glowing warm yellow, 12) cluster of lily pads with a pink flower`

| 슬롯 | ID | 크기 | 충돌 |
| --- | --- | --- | --- |
| 1 | `ice-crystal-a` | 56×80 | 32×14 |
| 2 | `ice-crystal-b` | 48×64 | 28×12 |
| 3 | `snowman` | 40×56 | 24×12 |
| 4 | `telescope` | 40×64 | 20×12 |
| 5 | `star-lamp` | 24×72 | 10×8 |
| 6 | `rink-board-h` | 64×32 | 64×10 |
| 7 | `rink-board-v` | 16×48 | 12×44 |
| 8 | `night-flower` | 32×24 | — |
| 9 | `boat-small` | 72×40 | 64×18 |
| 10 | `dock-post` | 16×40 | 10×8 |
| 11 | `pier-lantern` | 20×48 | 10×8 |
| 12 | `lily-pads` | 40×24 | — |

### 2-8. `props-forge` — 번개·불꽃 공업지구
`THEME`: `industrial workshop yard with orange lava glow and navy-emerald lightning accents: pipes, barrels, crates, generators`
`LIST`: `1) horizontal steel pipe, 2) vertical steel pipe, 3) pipe corner joint, 4) red oil barrel, 5) grey metal barrel, 6) stack of wooden crates, 7) portable generator with a lightning symbol (no text), 8) lava vent with rising embers, 9) small brick chimney with smoke, 10) blacksmith anvil, 11) wall tool rack with wrenches, 12) scrap metal pile`

| 슬롯 | ID | 크기 | 충돌 |
| --- | --- | --- | --- |
| 1 | `pipe-h` | 64×24 | 64×10 |
| 2 | `pipe-v` | 24×64 | 12×56 |
| 3 | `pipe-corner` | 32×32 | 28×28 |
| 4 | `barrel-red` | 28×36 | 22×10 |
| 5 | `barrel-gray` | 28×36 | 22×10 |
| 6 | `crate-stack` | 48×48 | 44×16 |
| 7 | `generator` | 56×48 | 52×18 |
| 8 | `lava-vent` | 40×32 | 32×12 (주변 접근 가능) |
| 9 | `chimney-small` | 32×72 | 22×14 |
| 10 | `anvil` | 40×32 | 32×12 |
| 11 | `tool-rack` | 56×40 | 52×10 |
| 12 | `scrap-pile` | 56×36 | 48×14 |

### 2-9. `props-cloud` — 구름 언덕·룬
`THEME`: `floating sky terrace and arcane rune hill: white and sky-blue stone, glowing violet runes and crystals`
`LIST`: `1) fluffy cloud pillar, 2) bench shaped like a cloud, 3) standing rune stone A with glowing violet abstract symbols, 4) standing rune stone B, 5) large ground rune circle decal (top-down flat, glowing violet), 6) floating violet crystal, 7) floating open book with glowing pages (no readable text), 8) wind vane, 9) cloud fountain with pale water, 10) sky-blue banner on a pole with a text-free sprout shield, 11) stone archway, 12) small cloud staircase (three steps)`

| 슬롯 | ID | 크기 | 충돌 |
| --- | --- | --- | --- |
| 1 | `cloud-pillar` | 40×88 | 28×14 |
| 2 | `cloud-bench` | 56×32 | 50×12 |
| 3 | `rune-stone-a` | 40×72 | 26×12 |
| 4 | `rune-stone-b` | 40×64 | 26×12 |
| 5 | `rune-circle` | 128×96 | — (바닥 데칼) |
| 6 | `crystal-purple` | 32×56 | 20×10 |
| 7 | `floating-book` | 32×32 | — |
| 8 | `wind-vane` | 32×72 | 10×8 |
| 9 | `cloud-fountain` | 80×64 | 72×28 |
| 10 | `banner-blue` | 24×72 | 10×8 |
| 11 | `stone-arch` | 96×96 | 기둥 2개, above 상부 |
| 12 | `cloud-stairs` | 64×32 | — |

### 2-10. `props-weed` — 제초동 구역
`THEME`: `grey weed-killing factory yard: rusty grey and rust-orange metal, warning colours, sinister but comedic`
`LIST`: `1) large ride-on lawn mower with big blades, 2) push lawn mower, 3) barbed-wire fence segment horizontal, 4) barbed-wire fence segment vertical, 5) warning sign with a crossed-out sprout symbol (no text), 6) heap of cut grass clippings, 7) striped barricade, 8) rusty oil drum, 9) stack of old tires, 10) tall floodlight on a pole, 11) tall factory chimney with grey smoke, 12) stone statue of a grumpy king holding a grass trimmer`

| 슬롯 | ID | 크기 | 충돌 |
| --- | --- | --- | --- |
| 1 | `mower-ride-on` | 80×64 | 72×24 |
| 2 | `mower-push` | 40×40 | 32×14 |
| 3 | `fence-barbed-h` | 64×40 | 64×10 |
| 4 | `fence-barbed-v` | 16×56 | 12×52 |
| 5 | `warning-sign` | 32×56 | 10×8 |
| 6 | `cut-grass-pile` | 40×24 | — |
| 7 | `barricade` | 72×32 | 72×12 (제초동 게이트) |
| 8 | `oil-drum` | 28×36 | 22×10 |
| 9 | `tire-stack` | 40×40 | 34×14 |
| 10 | `floodlight` | 24×88 | 10×8 |
| 11 | `chimney-tall` | 48×128 | 32×16 |
| 12 | `king-statue` | 56×88 | 36×14 |

### 2-11. `props-collect` — 수집품·미션 아이템
`THEME`: `glowing collectibles and mission items with a clear golden highlight so they read from far away`
`LIST`: `1-3) a mint-and-gold grass-blade crystal shard (the 'grass shard'), pulse animation frames 1 to 3 with growing glow, 4-6) a golden football, animation frames 1 to 3 with a sparkle moving across, 7) a glowing blue jellyfish lantern (colour A), 8) jellyfish lantern colour B (pink), 9) jellyfish lantern colour C (lavender), 10) a cardboard parcel with a blue tape, 11) a cardboard parcel with a red tape, 12) a cardboard parcel with a green tape`

| 슬롯 | ID | 크기 | 충돌/트리거 |
| --- | --- | --- | --- |
| 1~3 | `shard-1`, `shard-2`, `shard-3` | 32×32 | UI/획득 연출 |
| 4~6 | `goldball-1`, `goldball-2`, `goldball-3` | 24×24 | `pickup` 트리거 |
| 7 | `jelly-lantern-a` | 32×40 | `pickup` |
| 8 | `jelly-lantern-b` | 32×40 | `pickup` |
| 9 | `jelly-lantern-c` | 32×40 | `pickup` |
| 10~12 | `parcel-a`, `parcel-b`, `parcel-c` | 24×24 | 인벤토리 아이콘 겸용 |

## 3. 건물 외관 (17)

최종 `src/web/assets/world/buildings/<id>.webp`, 크기는 [03 §4](03-map-design.md#4-랜드마크건물-좌표표)의 스프라이트(px). 원본 이름 `bld-<id>.png`. 건물마다 **개별 생성**(1장씩).

### 건물 프롬프트 템플릿

```text
Draw a single building for a top-down 3/4-view pixel-art RPG (classic Pokemon/Zelda camera: you see the front facade and the roof from above at about 45 degrees). {{DESC}}
Rules: the door is at the bottom centre of the front facade with a small step; transparent background (or flat #FF00FF); NO ground, NO cast shadow, NO grass around the base; the building fills about 90% of the canvas width and sits on the bottom edge; light from the top-left; no text or letters anywhere (signs and boards are blank shapes, emblems are text-free); crisp pixel outline, three-step shading.
Canvas: {{CANVAS}}.
```

| ID | 원본 이름 | 캔버스 | 최종 px | `DESC` |
| --- | --- | --- | --- | --- |
| `clubhouse` | `bld-clubhouse.png` | 1536×1024 | 384×256 | a modern two-storey football clubhouse with white walls and a mint-green roof, a big glass entrance with a small canopy, blank stone sign plate above the door, trophy display windows, mint flags with a text-free sprout shield, a football-shaped weathervane on the roof, warm and inviting |
| `stadium` | `bld-stadium.png` | 1536×1024 | 832×512 | a compact football stadium seen from the front at 3/4 view, curved white-and-mint grandstand roof, four floodlight towers, a big arched north gate with a dark tunnel at the bottom centre, mint banners with a text-free sprout shield, a blank scoreboard on top, golden glow leaking over the wall from the pitch |
| `fountain` | `bld-fountain.png` | 1024×1024 | 192×160 | a circular stone plaza fountain in cream and mint with a large statue of a small grass fairy holding a football up on top, arcs of water, a few petals floating; the door rule does not apply |
| `house-sjh4018` | `bld-house-sjh4018.png` | 1536×1024 | 320×288 | a small cloud fortress: white and sky-blue stone keep with round windows and tiny turrets, sitting on top of fluffy clouds, a blue shield emblem (text-free) above the arched door, banners, sunlit |
| `house-doormomo` | `bld-house-doormomo.png` | 1024×1536 | 224×352 | a tall stone rune tower, violet roof and a glowing crystal at the top, glowing violet abstract rune symbols on the walls, a spiral outside staircase, an arched door at the base, mystical and strategic |
| `house-ju010228` | `bld-house-ju010228.png` | 1536×1024 | 256×192 | a spring garden cottage-greenhouse with a lime-green wooden frame and glass panels, vines and flower pots all around, blooming pink and yellow flowers, a green thatched roof, cheerful |
| `house-lina0108` | `bld-house-lina0108.png` | 1536×1024 | 256×192 | a cosy cottage under a big blossoming cherry tree, pink tiled roof, cream walls, petals falling, paper lanterns hanging from the eaves, a wooden porch with a small table and a sketchbook |
| `house-hachi97` | `bld-house-hachi97.png` | 1536×1024 | 256×224 | a small house on a grassy hill with a red-and-gold roof of dragon-scale tiles, a golden dragon statue coiled around the chimney, a round door with a dragon-eye window, gold trim |
| `house-janine95kim` | `bld-house-janine95kim.png` | 1536×1024 | 256×224 | a frosty house beside an ice rink: sky-blue and white walls, a snow-dusted roof with icicles, a goalkeeper-glove-shaped blank sign, a pair of ice skates hanging by the door, frosted windows |
| `house-kaksjak0730` | `bld-house-kaksjak0730.png` | 1024×1024 | 256×256 | a starlit observatory: black-navy dome with sapphire star patterns and an open slit with a telescope pointing up, a round brick base with a round door, glowing star lanterns |
| `house-haepalin` | `bld-house-haepalin.png` | 1536×1024 | 224×192 | a lavender wooden stilt house over water: the roof is shaped like a jellyfish bell, glowing jellyfish-shaped lanterns hang around, a short pier with steps at the front, soft glow |
| `house-bboringirl` | `bld-house-bboringirl.png` | 1536×1024 | 256×192 | a gunmetal workshop: grey steel building with red neon strips, a big roll-up garage door, exposed pipes, a satellite dish, circuit-board patterned panels and a small robot arm on the roof |
| `house-tleod1818` | `bld-house-tleod1818.png` | 1536×1024 | 256×192 | a lightning delivery depot: navy-blue building with emerald stripes and a lightning-bolt sign (no text), a wide parcel counter window, stacked parcels, a bicycle and a small scooter parked outside, a roof antenna |
| `house-tdnlamuron` | `bld-house-tdnlamuron.png` | 1536×1024 | 224×192 | a lava training house: apricot-orange walls on dark rock, glowing lava cracks beside it, an iron gate, training dummies out front, a chimney with a flame torch |
| `store` | `bld-store.png` | 1536×1024 | 224×160 | a small convenience store: white and mint building with a striped awning, a big front window with shelves visible, a blank hanging sign, a vending machine and crates outside |
| `cafe` | `bld-cafe.png` | 1536×1024 | 224×160 | a cosy community cafe: warm wood building with green ivy, a blank chalkboard, round windows, string lights, outdoor tables with umbrellas, a steaming cup sign shape (no text) |
| `factory` | `bld-factory.png` | 1536×1024 | 416×320 | a grey industrial weed-killing factory: rusty grey and orange steel building, a tall smokestack, conveyor pipes, a big spinning mower-blade emblem above the gate, warning stripes, barbed fence sections, a few withered plants |

- 건물의 **어둡게 시든 버전은 자동 파생하지 않는다**(건물은 색이 바래지 않음). 필요하면 P2에서 채도만 낮춘 파생을 스크립트로 추가.
- 캔버스 종횡비와 최종 px 비율이 다르면 스크립트가 **트림 후 최종 px에 맞춰 리사이즈**(비율 왜곡 없음, 트림된 bbox 기준).

## 4. 실내 (19)

최종 `src/web/assets/world/interiors/int-<id>.webp`, **640×384px**. 원본 이름 `int-<id>.png`(1536×1024 생성 → 스크립트가 중앙 16:9.6 영역 크롭 후 640×384 다운스케일). 가구 배치는 [03 §9](03-map-design.md#9-실내-19곳)의 조사 포인트 좌표와 맞춘다.

### 실내 프롬프트 템플릿

```text
Draw a single-screen interior of {{ROOM}} for a top-down 3/4-view pixel-art RPG (classic Pokemon/Stardew interior: cutaway room with the back wall and side walls visible, the floor seen from about 45 degrees). Landscape 1536x1024; the room fills the frame edge to edge with a thin dark wall border. Keep a clear open floor area in the lower-middle for walking and a door opening with a small doormat at the bottom centre. {{LAYOUT}}
Rules: no characters, no people; no readable text or letters anywhere (papers, boards and screens show abstract shapes); light from the top-left; crisp pixel outline, three-step shading; warm and cosy. Furniture is placed as described (left/right are from the viewer's view).
```

| ID | 원본 이름 | `ROOM` | `LAYOUT` |
| --- | --- | --- | --- |
| `house-janine95kim` | `int-house-janine95kim.png` | an icy sky-blue and white home of a goalkeeper | A window on the left wall shows a frozen rink; a glass cabinet with goalkeeper gloves at the back left; a frosted potted plant at the back right; a small table with a cloth at the middle left; a bed and a soft rug on the far right; ice-blue lighting |
| `house-bboringirl` | `int-house-bboringirl.png` | a gunmetal electronics workshop lit by red neon | A soldering workbench at the back left with tools; three glowing monitors at the back right (one showing a retro pixel game as abstract blocks); a parts drawer cabinet at the left wall; a cot in the far right corner; cables and circuit patterns on the floor |
| `house-sjh4018` | `int-house-sjh4018.png` | the cosy interior of a small cloud fortress, all pale stone and soft clouds | A shield emblem on the back wall centre; a round window at the back left showing sky; a big comfy armchair at the right; a fluffy cloud-shaped sofa on the left; cloud wisps drifting near the floor |
| `house-doormomo` | `int-house-doormomo.png` | a violet rune scholar's study in a tower | A tactics board full of abstract arrows in the back centre; a bookshelf with glowing rune books at the back left; a crystal ball on a stand at the right; a desk with scrolls at the left; violet glow |
| `house-hachi97` | `int-house-hachi97.png` | a golden dragon-themed home | A display of golden dragon eggs on a stand at the back right; framed fan art (abstract) on the back left; a weapon rack with flags at the back centre; red-and-gold carpet in the middle; a low table |
| `house-kaksjak0730` | `int-house-kaksjak0730.png` | the interior of a starlit observatory dome | A large brass telescope pointing at the open dome slit in the centre; a star-map table at the left; a potted grass plant at the bottom right; a constellation pattern on the ceiling edge; deep blue and sapphire tones |
| `house-ju010228` | `int-house-ju010228.png` | a bright spring greenhouse home full of plants | Potted plants along the left wall; a goal-record board on the back right wall (abstract tally marks); a watering can at the bottom right; vines climbing the glass walls; a bed and a small table; lime and pink tones |
| `house-haepalin` | `int-house-haepalin.png` | a lavender stilt house with water visible through the floor edges | A big glowing jellyfish aquarium in the back centre; a window with ripples at the back left; a shell collection shelf at the right; soft floating light orbs; a fluffy rug |
| `house-tleod1818` | `int-house-tleod1818.png` | a delivery depot office with parcel shelves | Shelves stacked with parcels at the back left; a lightning-bolt emblem on the back right wall (text-free); a bicycle at the bottom right; a sorting table in the middle; navy and emerald tones |
| `house-tdnlamuron` | `int-house-tdnlamuron.png` | a training house with warm apricot lighting | A training notebook desk at the left; a lava-view window at the back right; a stack of orange cones at the bottom right; a punching mat; trophies on a shelf; orange and dark rock tones |
| `house-lina0108` | `int-house-lina0108.png` | a pink cherry-blossom cottage room | A sketchbook on a table at the left; a vase of cherry blossoms at the back right; a coat rack at the bottom right; a pink bed with drawings pinned above; a round rug |
| `clubhouse-lobby` | `int-clubhouse-lobby.png` | the lobby of a modern football clubhouse | A reception desk at the back centre; a trophy display at the right; stairs going down at the back right (to the basement arcade); a door on the left wall (to the manager's office); a door on the right wall (to the trophy room); mint and white |
| `clubhouse-office` | `int-clubhouse-office.png` | a football manager's office | A tactics chalkboard on the left wall (abstract lines); a large wooden desk at the back centre with a notebook; a tall card cabinet with many small drawers on the right wall; a comfy chair; a window with a stadium view |
| `clubhouse-trophy` | `int-clubhouse-trophy.png` | a trophy room | A large empty photo frame hanging on the back centre wall; glass cases with cups and medals along both walls; a red carpet runner; warm spotlights |
| `arcade` | `int-arcade.png` | a basement arcade with neon lights | Five arcade cabinets in a row along the back wall with glowing screens (abstract); a prize shelf at the left; a counter at the right; carpet with a neon pattern; purple and mint neon |
| `stadium` | `int-stadium.png` | the inside of a small stadium seen from behind the goal | The pitch in the centre with a glowing golden patch of grass at the centre circle; grandstands with empty seats along the back and sides; floodlights; a dark machine (the weed core) half-buried at the centre |
| `store` | `int-store.png` | a convenience store interior | Shelves of snacks and drinks at the back left; a fridge with milk cartons at the back right; a counter at the right; a magazine corner at the bottom left; mint and white |
| `cafe` | `int-cafe.png` | a cosy community cafe | Round tables with chairs; a coffee machine at the back right; a big blank message board on the back wall covered with pinned papers (abstract); warm lamps |
| `factory` | `int-factory.png` | the inside of a grey weed-killing factory | A conveyor belt carrying lawn mower blades across the middle; a heavy safe at the back right; warning signs (no text); pipes on the walls; grey and rust-orange |

> 실내 ID(첫 열)는 `interior:<id>` 씬 ID와 동일하고, 원본 이름·최종 파일은 `int-` 접두를 붙인다(예: `house-doormomo` → `int-house-doormomo.png` → `interiors/int-house-doormomo.webp`).

## 5. 잔디 러시 에셋

신규 미니게임 「잔디 러시」([02 §11](02-story-and-missions.md#11-엔딩-후--지속-유입-콘텐츠))용. 러너는 **선택 캐릭터의 걷기 프레임(우측)**을 재사용하므로 캐릭터는 그리지 않는다. 최종 `src/web/assets/world/rush/<id>.webp`.

| ID | 원본 이름 | 캔버스 | 최종 px | 프롬프트 |
| --- | --- | --- | --- | --- |
| `bg-far` | `rush-bg-far.png` | 1536×1024 | 640×360(가로 심리스) | `A wide 2D side-scrolling background layer, far distance: a bright sky with soft clouds and a distant football stadium skyline with floodlights, gentle hills. Seamless horizontally (left edge matches right edge). Pixel art, calm colours, no characters, no text.` |
| `bg-mid` | `rush-bg-mid.png` | 1536×1024 | 640×360(가로 심리스) | `A wide 2D side-scrolling background layer, mid distance, transparent above the horizon: a row of trees, hedges, a wooden fence and small grandstands along the ground line, at the bottom third of the image. Seamless horizontally. Pixel art, no characters, no text.` |
| `ground` | `rush-ground.png` | 1536×1024 | 640×96(가로 심리스) | `A horizontal strip of football pitch grass seen from the side for a 2D runner: the top edge is a crisp grass line with tiny blades, under it lush striped grass and soil. Seamless horizontally. Pixel art, no characters, no text.` |
| `obstacles` (시트) | `rush-obstacles.png` | 1536×1024 | (아래 표) | 소품 시트 템플릿 + `THEME: side-view obstacles and pickups for a 2D runner`, `LIST: 1) a grey ride-on lawn mower facing left, 2) an orange cone, 3) a training hurdle, 4) a sliding-tackle defender in a grey kit lying low (no face detail), 5) a standing defender in a grey kit with arms out, 6) a low hanging banner (must be slid under, text-free), 7) a puddle, 8) a lawn sprinkler spraying water, 9) a mint-and-gold grass seed, 10) a golden football, 11) a magnet power-up, 12) a shield power-up` |
| `bg-factory` (P2) | `rush-bg-factory.png` | 1536×1024 | 640×360 | `bg-far`와 같은 지시, 단 `a grey weed-killing factory skyline with smokestacks and orange sunset, desaturated`. 엔딩 후 제초동 코스 스킨용 |

`obstacles` 시트 슬롯 ID·크기: `mower`(64×40), `cone`(20×24), `hurdle`(40×28), `tackler-low`(56×24), `tackler-stand`(40×56), `banner-low`(72×32), `puddle`(48×12), `sprinkler`(28×36), `seed`(20×20), `goldball`(20×20), `magnet`(24×24), `shield`(24×24). 충돌은 스프라이트 bbox 80%.

## 6. FX·이모트·마커 (3장)

최종 `src/web/assets/world/fx/<id>.webp`. 소품 시트 템플릿 사용. 원본 이름 `fx-<시트>.png`. **`!`·`?`·`…` 같은 기호는 글자가 아니라 도형 아이콘**으로 그리도록 요청한다.

### 6-1. `fx-emotes` — 이모트 말풍선 (각 24×24)
`THEME`: `tiny round emote speech balloons with a white bubble and a small tail at the bottom, each containing one icon`
`LIST`: `1) an exclamation-mark symbol, 2) a question-mark symbol, 3) three dots, 4) a pink heart, 5) a music note, 6) an angry vein mark, 7) a sweat drop, 8) a sparkle, 9) sleeping z symbols, 10) a double exclamation-mark symbol, 11) an exclamation-mark and question-mark pair, 12) a gold star`
슬롯 ID: `emote-exclaim, emote-question, emote-dots, emote-heart, emote-note, emote-anger, emote-sweat, emote-sparkle, emote-zzz, emote-exclaim2, emote-exq, emote-star`

### 6-2. `fx-markers` — 미션 마커·반짝임·먼지
`THEME`: `small game markers and effects: quest markers above heads, sparkles, footstep dust`
`LIST`: `1) a blue round speech balloon containing a white question-mark symbol (new quest available), 2) a glowing GOLD round balloon containing a bold white exclamation-mark symbol with small sparkles around it (quest complete, report now), 3) a small grey round balloon with three dots (quest in progress), 4-7) a four-frame sparkle burst animation (small to large to fading), 8-11) a four-frame small footstep dust puff animation, 12) a flat thin mint ground ring seen from above (target ring)`
슬롯 ID·크기: `mark-new`(20×28), `mark-complete`(24×32), `mark-progress`(20×28), `sparkle-1..4`(16×16), `dust-1..4`(16×12), `target-ring`(32×16)
- 마커는 위아래 바운스(코드)로 움직이므로 정지 이미지 1장씩이면 충분.

### 6-3. `fx-world` — 월드 이펙트
`THEME`: `nature effects for a top-down RPG: grass growing burst, water ripples, splash`
`LIST`: `1-6) a six-frame animation of grass and flowers rapidly sprouting and blooming out from a centre point (frame 1 tiny sprouts, frame 6 lush blossoms), 7-10) a four-frame expanding water ripple ring seen from above, 11) a water splash small, 12) a water splash large`
슬롯 ID·크기: `grow-1..6`(96×64), `ripple-1..4`(32×16), `splash-1`(32×32), `splash-2`(40×40)
- `grow-*`는 잔디 조각을 받을 때·황금 잔디 개화 컷에서 재생.

## 7. 파생·후처리 (스크립트가 자동)

시든 버전, 팔레트 스왑(`weeder-grunt-gardener`), 심리스 보정, 아틀라스 패킹은 [09 §자동 생성 파생 에셋](09-asset-checklist.md#자동-생성-파생-에셋)과 [08 §변환 스크립트 사양](08-implementation-roadmap.md#3-변환-스크립트-사양) 참고.

## 8. 생성 개수 (이 문서 범위)

| 구분 | 장수 |
| --- | --- |
| 지면 시트 | 8 |
| 소품 시트 | 11 |
| 건물 | 17 |
| 실내 | 19 |
| 러시(배경 3 + 시트 1 + P2 1) | 5 |
| FX(이모트/마커/월드) | 3 |
| **합계** | **63장** |

우선순위: **P0** = `terrain-core`, `terrain-pitch`, `terrain-water`, 소품 `trees/plants/rocks/town/football/collect`, 건물 15곳(`clubhouse`, `stadium`, `fountain`, `store`, 집 11), 실내 P0 16곳(11 집 + `clubhouse-lobby/office` + `arcade` + `stadium` + `store`), `fx-markers`. **P1** = 나머지 지면(테마 지구), 소품 지구별 시트, 건물 `cafe/factory`, 실내 `cafe/trophy/factory`, `fx-emotes/fx-world`, 러시 3장 + 시트. **P2** = `rush-bg-factory`.
