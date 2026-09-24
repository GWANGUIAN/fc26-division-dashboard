# 12. 로딩 화면 타이틀 로고 — 이미지 프롬프트

로딩 화면의 캔버스 텍스트 `잔디동 PITCH` 를 **이미지 로고**로 교체하기 위한 1장짜리 생성 지시서다(09 러닝북의 123스텝과 별개, 번호 없음). 코드는 준비되어 있어서 **파일만 변환해 넣으면 자동으로 적용**된다(없으면 지금처럼 텍스트로 그림).

## 저장 이름 · 변환 · 적용

| 항목 | 값 |
| --- | --- |
| 원본 저장 | `tmp/pitch-src/ui/ui-title-logo.png` |
| 캔버스 | **1536×512 (3:1)** — 최종 480×160 으로 줄어든다(3:1 을 못 지키면 늘어나 왜곡됨) |
| 배경 | 투명 PNG(가능하면) 또는 순수 `#FF00FF` 마젠타(변환기가 자동으로 키잉) |
| 변환 | `pnpm convert:pitch-art -- ui title` → `src/web/assets/pitch/ui/title-logo.webp` |
| 적용 | 자동. `assets.ts` 가 파일이 생기면 `boot` 그룹에 넣고(약 30~60KB, boot 예산 300KB 안), `LoadingScene` 이 화면 중앙 상단 y=40 에 1:1 로 그린다 |

> 로고는 **키아트 위**(스타디움 입구 위쪽 하늘·관중석 영역, 어두운 파랑)에 올라간다. 밝은 금색·흰색 글자와 진한 네이비 외곽선이 잘 보인다.

## 레퍼런스 첨부

1. **필수** `tmp/pitch-src/keyart/keyart-loading-bg.png` — 배경 키아트(색감·픽셀 크기·조명 기준). 로고가 이 위에 놓인다는 점을 알려줄 것.
2. 선택 `tmp/pitch-src/ui/ui-loader.png` 또는 `ui-hud-banners.png` — 같은 게임 UI 의 외곽선 두께·금색/민트 팔레트 기준.
3. 잔디동 정체성이 필요하면 사이트 로고/엠블럼이 있는 이미지(없으면 생략). **월드 이미지는 붙이지 않는다**(프로젝트 원칙).

## 프롬프트 A — 글자 포함(권장 시도)

한글 글자는 AI 가 자주 틀린다. 3~4장 뽑아 `잔디동` 이 정확한 것을 고르고, 안 나오면 프롬프트 B 로 간다.

```text
Style: 16-bit arcade sports game pixel art in the spirit of early-90s Neo Geo and Super Nintendo football games, with modern crisp clarity. Chunky clearly visible pixel blocks (each about 8 px on a 1024 px canvas), a bold 2-pixel dark navy outline (#0a0a1a, never pure black) around every silhouette and every letter, high-saturation colours, four-tone shading (base, hard-edged bright highlight, shadow, deep violet-blue shadow), cool cyan-white floodlight rim light from the upper left. No anti-aliasing blur, no smooth gradients, no photo texture, no 3D-render look, no painterly strokes. The navy outline sits directly against the background: NO outer glow, halo, aura, light bloom or background tint outside the outline. Add no watermark or signature.
Background: fully transparent (PNG with alpha) if possible; otherwise a perfectly flat solid #FF00FF magenta with no shadow, floor, gradient or border, and no magenta or hot pink anywhere on the logo (use coral red #ff4d6d instead).
Subject: a game title logo for a football arcade game, wide 3:1 lockup, centred, with at least 8% empty margin on every side. The big top line is the Korean word "잔디동" in chunky blocky pixel-style Hangul (three syllables exactly: 잔 디 동), letters filled with a mint-green (#2ee8b6) to white two-tone gradient made of hard pixel steps, thick navy outline, a gold (#ffd23f) hard-edged extrusion/drop-shadow below and to the right, a few tiny white sparkle pixels. Under it, the Latin word "PITCH" in wide chunky pixel capitals, gold (#ffd23f) with a white top highlight and navy outline, flanked on both sides by a small pixel football icon and a short mint speed-line. Behind the whole lockup a subtle navy banner/ribbon plate with a thin mint trim, slightly wider than the text. Spell the text exactly: 잔디동 and PITCH, nothing else, no extra letters, numbers or slogans.
Canvas: 1536x512 (3:1).
Use the attached image(s) as the style and colour reference (same game, same pixel size, outline and palette); the logo will be placed over the attached loading key art.
```

## 프롬프트 B — 글자 없는 엠블럼(폴백)

Hangul 이 계속 틀리면 **글자 자리를 비운 판/리본 + 볼 장식**만 받고, 텍스트는 코드가 Galmuri11 로 그 위에 그린다(`LoadingScene` 에서 텍스트를 판 위에 올리도록 내가 바꿔 준다). 스타일·배경 문단은 프롬프트 A 와 동일하고 `Subject` 만 아래로 교체:

```text
Subject: an empty game-title plate for a football arcade game, wide 3:1, centred, with at least 8% empty margin on every side: a chunky navy banner/ribbon with a thin mint trim and a gold (#ffd23f) frame, its centre area a flat dark navy band left completely EMPTY for text to be added later, a pixel football on each end of the banner, two small crossed corner flags above it, tiny white sparkle pixels, a gold hard-edged drop-shadow below. Absolutely no letters, numbers, symbols or logos anywhere.
```

(프롬프트 B 를 쓸 때는 Style/Background/Canvas/레퍼런스 문장은 A 의 것을 그대로 붙인다.)

## 검수 체크

- 3:1 캔버스 정확, 좌우상하 여백 ≥8%, 로고가 캔버스를 꽉 채우지 않음
- `잔디동` 세 글자가 정확(잔·디·동) / `PITCH` 철자 정확 — 다른 글자·숫자·워터마크 없음
- 네이비 2px 외곽선이 글자 전체에 있고 바깥 후광·발광 없음
- 마젠타/핑크 잔여 없음(배경이 마젠타였다면 변환 로그의 `chroma-keyed` 확인)
- 배경 키아트(어두운 파랑) 위에서 읽히는 대비 — 어두운 글자색 금지
