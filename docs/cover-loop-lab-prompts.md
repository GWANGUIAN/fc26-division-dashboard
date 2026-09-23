# 하치 커버 루프 랩 — 생성·납품 가이드

`/cover-loop-lab` 실험 페이지에서 재생할 고정 구도 커버 영상을 만들기 위한 프롬프트와 작업 절차다. 최종 곡 링크와 가사는 코드의 `coverLoopLabData.ts`에서 바꾸며, 여기서는 **고화질 장면과 무음 루프 영상**만 만든다.

## 권장 방식: 통합 장면 + 미세 모션

배경과 캐릭터를 따로 합성하는 방식은 그림체·광원·접지 그림자가 어긋날 가능성이 높다. 첫 테스트는 배경과 하치를 한 장면에서 확정한 뒤, 눈 깜빡임·호흡·아주 미세한 먼지에만 작은 움직임을 주는 방식으로 진행한다.

- **마스터 스틸**: 16:9, 최소 1920×1080, PNG 또는 WebP. 화면 속 글자·로고·워터마크는 넣지 않는다.
- **루프**: 기본은 5초, 24fps, 고정 카메라, 무음 H.264 MP4. Animate Keyframes가 8초로 고정된 경우에는 8초 결과를 그대로 사용해도 된다. 결과물은 브라우저에서 GIF보다 화질과 제어가 좋다.
- **웹 납품물**: `hachi-cover-loop.mp4`와 첫 프레임을 내보낸 `hachi-cover-poster.webp`. MP4는 배경 애니메이션이고 음악은 YouTube 플레이어가 담당한다.
- **하치 레퍼런스**: 실사/아바타 이미지를 받은 뒤 반드시 함께 업로드한다. 정면 또는 3/4 각도, 얼굴·머리·의상이 또렷하고 과도한 표정·필터가 없는 이미지가 가장 안정적이다.

## 이미지 생성 프롬프트

아래 프롬프트는 영어로 복사해 사용한다. 레퍼런스 이미지가 있는 서비스에서는 첨부한 **캐릭터 아바타 레퍼런스**를 정체성 참고로, 이 문서 첫머리의 스크린샷은 조명·여백·앨범 커버 같은 구도 참고로만 넣는다. 프롬프트 안의 이름은 모델의 정체성 정보가 아니므로 쓰지 않는다.

### 1) 배경 단독 — 탐색용

캐릭터를 따로 만들거나 배경 분위기를 먼저 고정하고 싶을 때 쓰는 보조 프롬프트다. 최종 권장 결과물은 이 배경만 사용하지 않고 아래 통합 장면으로 다시 생성한다.

```
A cinematic anime-inspired illustration for a YouTube music cover, a quiet
empty community football ground at sunset after practice. Wide 16:9 frame,
low camera angle, a worn running track in the foreground, one small goal and
floodlight poles in the distance, soft silhouettes of trees, amber sunlight
near the horizon, dusty peach clouds, deep indigo shadows, faint floating dust
particles. Leave clean breathing room in the lower left and lower right for a
minimal music player overlay. Warm nostalgic mood, painterly but crisp,
high-detail background, natural atmospheric perspective, fixed composition.
No people, no character, no text, no logo, no watermark, no motion blur.
```

### 2) 하치 캐릭터 단독 — 탐색용

최종 통합 장면을 만들기 전 의상·실루엣을 잡는 용도다. 투명 배경 기능이 있는 도구에서만 투명 PNG를 요청한다. 그렇지 않으면 중립 회색 배경으로 만들고 합성은 권장하지 않는다.

```
Use the attached character avatar reference only to preserve the character's
recognizable facial features, hair, and signature accessories. Full-body
anime-inspired football player, three-quarter view facing slightly left, just
after exhausting practice: hands resting on thighs, a tired but quietly
determined expression. Breathing is conveyed only by a subtle rise and fall of
the shoulders and upper chest, with clear air around the face. A premium dark
charcoal football kit with restrained mint-green trim and scuffed football
boots. Soft sunset rim light from the left, grounded natural shadow directly beneath the shoes,
clean readable silhouette, detailed fabric folds. Isolated character only,
transparent background, no ball, no text, no logo, no watermark, no cropped
feet, no extra limbs.
```

### 3) 권장 통합 장면 — 실제 웹용 스틸

캐릭터 레퍼런스와 함께 생성한다. 마음에 드는 결과를 뽑은 뒤 그 **한 장**을 루프 영상의 첫·마지막 프레임에 재사용한다.

```
Use the attached character avatar reference only to preserve the character's
recognizable identity. Create a single polished anime-inspired illustration
for a YouTube music cover: a football player has just finished a hard
sunset training session and leans lightly against the low rail beside an empty
football ground. He is catching his breath with both hands resting on his
knees, tired but calm and resilient. Full body visible, three-quarter view,
positioned a little right of center. Behind him: a quiet running track, one
distant goal, floodlight poles and tree silhouettes. Amber sun low on the left
horizon, peach-orange sky, deep violet-blue shadows, soft golden rim light,
physically coherent contact shadow and reflected warm light on the kit.
Premium emotional album-cover composition, cinematic depth, painterly yet
high-detail clean anime illustration, fixed camera, 16:9, 1920x1080 or larger.
Reserve uncluttered darkened space along the lower 22 percent of the frame for
a music player UI. No words, no captions, no logos, no watermark, no visible
brand marks, no extra people, no duplicated limbs, no motion blur.
```

### 4) Image-to-video 루프 — 실제 웹용 MP4

이미지-to-비디오에서는 장면 묘사를 반복하지 말고 **움직임만** 적는다. 특히 `visible breath`, `dust particles`, `exhausted` 같은 말은 입김·연기·먼지 구름으로 과장될 수 있으므로 첫 생성에서는 넣지 않는다. 호흡은 공기가 아니라 **어깨·쇄골·상체와 유니폼의 작은 왕복 움직임**으로 표현한다.

최종 프롬프트와 생성 순서는 아래 Runway의 `C. 미세 동작을 성공시키는 2단계 프롬프트`를 기준으로 한다.

## Runway — 완성된 합성 이미지로 바로 5초 루프 만들기

이미 GPT로 **배경과 하치가 합성된 최종 스틸 이미지**를 만들었다면, 이 절만 따르면 된다. `Image` 탭에서 새 그림을 생성하거나 `@Image 1` 프롬프트를 쓸 필요가 없다. 완성된 이미지는 영상의 **첫 프레임을 고정하는 입력값**으로만 쓴다.

### A. Image 화면에서 Video 화면으로 이동

1. 현재 화면의 상단 탭에서 **Video**를 누른다. `Image`가 아니라 Video 탭이 선택돼야 한다.
2. Video 화면에서 **Image to Video** 또는 입력 이미지/`First frame` 칸을 찾는다. 모델마다 표기가 다르지만, 핵심은 영상 생성 화면에 이미지 한 장을 넣는 것이다.
3. 완성된 합성 이미지를 그 칸에 업로드한다. 방금 Image 화면에 `Image 1`으로 올라가 있다면 업로드 대신 **Assets/현재 세션에서 Image 1 선택**을 사용해도 된다.
4. 미리보기에서 장면 전체가 보이는지 확인한다. 이미지를 다시 자르지 말고, 비율은 원본과 같은 **16:9**로 맞춘다. 하단 플레이바를 넣어 둔 어두운 여백이 잘리지 않아야 한다.

### B. 모델·설정 선택

1. 모델 선택 메뉴에서 **Gen-4.5**를 고른다. Runway가 현재 Image-to-Video의 최고 품질 모델로 권장하는 모델이다. 메뉴에 없거나 크레딧을 아끼며 구도만 먼저 시험할 때만 **Gen-4 Video**를 사용한다.
2. 길이는 **5 seconds**, 비율은 **16:9**로 설정한다. 10초는 첫 실험에서 형태가 흔들릴 확률이 높으므로 사용하지 않는다.
3. FPS 선택이 보이면 **24fps**를 고른다. Camera/Motion 메뉴가 있다면 **Static**, **Fixed**, 또는 가장 움직임이 적은 옵션을 고른다. Pan, Zoom, Handheld, Orbit은 선택하지 않는다.
4. 설정을 마친 뒤, 오른쪽 아래 버튼을 확인한다.
   - **Generate**: 아래 프롬프트를 넣고 생성한다.
   - **Upgrade**: 현재 선택 모델이 플랜에서 생성 불가다. 모델 메뉴를 열어 Generate 버튼이 보이는 image-to-video 모델로 바꾼다. 업그레이드는 누를 필요 없다.

### C. 한 번에 만드는 호흡 + 눈 깜빡임 + 완전 루프

Runway의 **Enhance prompt는 끈다.** 이 작업은 장면을 새로 해석하는 것이 아니라 한 장면에 아주 작은 동작만 넣는 일이라, 강화 기능이 `breathing`, `dust`, 여러 금지문을 길게 풀어쓰면 입김·연기 같은 원치 않는 움직임이 생길 수 있다. 입력 이미지는 이미 구도·광원·캐릭터를 담당하므로 프롬프트에는 모션만 남긴다.

#### 1) 프롬프트만으로 끝 프레임을 최대한 맞추는 경우

일반 **Gen-4.5 Image-to-Video** 화면에 `Last frame` 입력란이 없다면, 아래가 가능한 최선이다. 마지막 프레임 일치를 요청할 수는 있지만 모델이 보장하지는 않는다.

```
Locked camera. A five-second seamless loop. The subject quietly catches her
breath after practice. Her shoulders, collarbones, and upper chest complete one
tiny natural cycle: they rise together slightly, pause, then settle precisely
back into the initial pose by the final frame. The upper chest of the jersey
shifts subtly with this motion. At the midpoint, she closes both eyelids fully
once for a brief natural blink and opens them to the identical gaze. Her head,
hands, and lower body hold the initial pose. The air in front of her face stays
clear. The background, lighting, and contact shadow remain unchanged. The final
frame matches the initial frame exactly. Continuous single shot.
```

`visible breath`, `exhale`, `dust`, `smoke`, `panting hard`는 넣지 않는다. 이 장면에서 숨참은 공기 효과가 아니라 어깨·쇄골·상체·유니폼의 아주 작은 왕복으로만 보인다.

#### 2) Animate Keyframes — 8초 고정 루프용 프롬프트

화면에 보이는 **Animate Keyframes**는 현재 8초 클립으로 동작한다. 이 길이를 줄이려 하지 말고, 아래처럼 8초 안에서 한 번의 아주 작은 호흡과 한 번의 깜빡임만 마친 뒤 첫 자세로 돌아오게 한다.

`First frame`과 `Last frame`에 **정확히 같은 원본 파일**을 넣는다. 별도로 캡처하거나 저장한 비슷한 이미지를 쓰면 안 된다. 오디오 토글(하단의 스피커/음표 아이콘 또는 `Audio`)이 보이면 생성 전에 **Off**로 바꾼다.

```
An eight-second seamless silent loop. The first frame and final frame are
identical. Preserve the character exactly as shown in both keyframes: identical
facial proportions, eye shape, hairstyle, expression, uniform, hands, pose,
linework, lighting, and composition. The locked camera remains still.

Only two tiny motions occur. From 0 to 2.5 seconds, the shoulder line and upper
chest rise together by a few pixels. From 3 to 5.5 seconds, they settle exactly
back into the initial pose; the upper chest of the jersey shifts subtly with this
single body-only breathing cycle. At 4 seconds, both eyelids close fully once
and reopen to the identical gaze. The face remains otherwise still. The air in
front of the mouth stays completely transparent and unchanged, without vapor,
mist, smoke, or visible exhalation. From 5.5 to 8 seconds, hold the exact
initial pose. Silent video: no generated audio, breathing sound, ambience,
sound effects, dialogue, or music. Continuous single shot.
```

이 프롬프트는 `catches her breath`, `panting`, `visible breath`, `dust`를 의도적으로 빼고, 입김 대신 상체의 픽셀 단위 움직임만 요구한다. 얼굴은 `only eyelids`로 제한해 원본 캐릭터와 다르게 재해석되는 범위를 줄인다.

1. 16:9와 1080p는 유지하고, 길이는 앱의 **8s** 그대로 둔다.
2. 프롬프트 강화는 끈다.
3. Generate 뒤 재생 바의 **스피커 아이콘은 단순 재생 음소거**다. 결과에 실제 사운드 트랙이 있다면 생성 화면의 Audio 토글을 Off로 바꾼 뒤 다시 생성한다. Audio 토글이 없는 앱이라면 내려받은 MP4에서 오디오 트랙만 제거해 웹에는 무음 파일을 넣는다.
4. 0초, 4초, 5.5초, 8초를 확인한다. 0초와 8초의 눈·어깨·손·그림자가 다르면 채택하지 않는다.

Animate Keyframes가 계정/화면에 보이지 않으면, 위 `1)`의 Gen-4.5 I2V 방식으로 만들고 마지막 프레임이 다른 결과는 채택하지 않는다. 이 경우에는 Adobe Firefly의 First/Last frame 기능에 같은 파일을 양쪽으로 넣는 방법이 다음 선택지다.

### D. 생성·선별·재시도

1. 일반 Gen-4.5 I2V는 5초당 60 크레딧이므로, 같은 프롬프트로 **세 개**를 생성한다. Animate Keyframes의 비용은 화면 표시를 기준으로 확인한다. 어느 도구든 첫 결과 하나만 채택하지 말고 같은 방식으로 여러 개를 비교한다.
2. 각 결과의 시작과 끝을 번갈아 보며 아래를 확인한다: 어깨 높이, 눈 위치, 손가락, 신발, 접지 그림자, 골대와 가로등 위치.
3. 아래 중 하나라도 보이면 그 영상은 버리고 같은 입력 이미지와 프롬프트로 다시 생성한다: 입 앞에 안개·연기·입김이 생김, 카메라가 움직임, 얼굴이 바뀜, 손가락/다리 변형, 배경 물체가 움직임, 마지막 프레임이 첫 프레임과 크게 다름.
4. 가장 안정적인 결과를 선택한다. 첫·끝 프레임이 다르면 프롬프트만 더 길게 쓰지 말고, 동일 이미지를 First/Last frame에 넣는 Animate Frames 또는 Firefly 방식으로 바꾼다.
5. 결과 메뉴에서 **무음 MP4**를 내려받는다. 최초 이미지는 포스터로 계속 쓴다. 루프 영상에 별도 오디오를 섞지 않는다. 실제 음악은 웹페이지의 YouTube 플레이어가 재생한다.

### E. 프로젝트에 넣기

1. 내려받은 MP4 이름을 `hachi-cover-loop.mp4`로 바꾼다.
2. 프로젝트의 `src/web/assets/cover-loop/`에 넣는다.
3. 같은 장면의 포스터는 `hachi-cover-poster.webp`로 넣는다. 현재 임시 PNG 포스터는 그 뒤에 교체한다.
4. 개발 서버에서 `/cover-loop-lab`를 새로고침한다. MP4가 있으면 정지 이미지 대신 영상이 보이며, 재생 버튼을 누를 때만 무음 루프도 재생된다.

완성 스틸을 Video의 입력 이미지/First frame으로 쓸 때는 `@Image 1`을 프롬프트에 넣을 필요가 없다. `@`는 별도의 스타일·캐릭터 참조를 추가할 때만 쓴다. [Reference media guide](https://help.runwayml.com/hc/en-us/articles/52963720640275-Using-reference-media-to-guide-your-generations) 입력 이미지는 구도·대상·광원·스타일을, video 프롬프트는 동작을 담당하도록 권장한다. Runway는 Gen-4.5를 현행 최고 Image-to-Video 모델로, Gen-4/Gen-4 Turbo를 더 빠르고 저렴한 이전 모델로 안내한다. [Getting Started with Generative Video](https://help.runwayml.com/hc/en-us/articles/37425232841875-Getting-Started-with-Generative-Video)

## 모델 선택: 이 장면에는 무엇이 가장 적합한가

- **1순위 — Runway Gen-4.5**: 지금처럼 한 장의 완성 스틸에서 상체 호흡·눈 한 번 같은 순차 미세 동작을 만들 때 가장 먼저 시도한다. Image-to-Video, 2–10초, 16:9, 24/25fps를 지원하며 5초 루프에 맞는다. 단, 720p 출력이고 12 크레딧/초이므로 5초 한 번은 60 크레딧이다. 최종 선택본만 업스케일하거나 편집 프로그램에서 1080p로 내보낸다. [Gen-4.5 사양](https://help.runwayml.com/hc/en-us/articles/46974685288467-Creating-with-Gen-4-5)
- **2순위 — 기존 Gen-4**: 이미 접근 가능하고 크레딧을 아끼는 탐색용으로 적절하다. 다만 이 모델은 간결한 긍정형 모션 프롬프트와 한 요소씩의 반복을 특히 권장하므로, 위의 1단계 → 2단계 순서를 지킨다. `No …`로 길게 막는 방식보다 `Locked camera. The camera remains still.`처럼 원하는 상태를 쓰는 편이 낫다. [Gen-4 프롬프팅 가이드](https://help.runwayml.com/hc/en-us/articles/39789879462419-Gen-4-Video-Prompting-Guide)
- **루프 경계가 최우선일 때 — 같은 이미지로 First/Last frame을 모두 넣을 수 있는 모델**: Runway의 Animate Frames 또는 Adobe Firefly 대안을 먼저 쓴다. 시작·끝이 같은 이미지를 향하도록 고정할 수 있어 5초 MP4 접합에는 장점이 있다. Runway도 고정 카메라 루프에서 동일 이미지를 양쪽 입력으로 쓰는 Animate Frames를 더 강한 제어 수단으로 제안한다. [Runway I2V 가이드](https://help.runwayml.com/hc/en-us/articles/48324313115155-Image-to-Video-Prompting-Guide)
- **Runway 결과가 계속 흔들릴 때만 — Veo 3.1**: Google의 First and Last Frame 기능을 써서 같은 합성 이미지를 양 끝 프레임으로 넣는 대안이다. 공식 사양상 1080p/4K와 첫·마지막 프레임 제어를 제공한다. 다만 이 서비스의 접근 경로·요금은 Runway와 별도이고, Google의 품질 비교 수치는 자체 벤치마크이므로 실제 이미지를 같은 프롬프트로 2~3개 생성해 보고 채택한다. [Veo 3.1](https://deepmind.google/models/veo/)

## Adobe Firefly 대안: 양 끝 키프레임 고정

1. **Video → Generate video**에서 통합 장면 스틸을 `First frame`과 `Last frame`에 **같은 파일로** 각각 넣는다.
2. 16:9, 5초, 24fps를 선택하고 위 루프 프롬프트를 입력한다. 끝 프레임도 넣었을 때는 카메라 모션 옵션이 제한되는 것이 정상이며, 이 테스트에는 오히려 적합하다.
3. 세 결과를 나란히 놓고 프레임 0초/5초를 비교한다. 더 매끈한 쪽을 채택하고, 단순한 영상 편집기로 끝 프레임 한 장이 중복되지 않게 정리한다.

Firefly는 첫·마지막 키프레임을 고정점으로 사용하며, 현재 기본 영상 출력은 24fps·5초다. [Firefly image-to-video guide](https://helpx.adobe.com/sg/firefly/web/work-with-audio-and-video/work-with-video/generate-videos-using-images.html)

## 납품 전 품질 체크

- 루프 첫 프레임과 마지막 프레임을 번갈아 보았을 때 위치가 튀지 않는가.
- 얼굴 윤곽, 눈, 손가락, 유니폼 문양이 프레임 사이에서 변형되지 않는가.
- 인물의 신발이 바닥에서 뜨지 않고 접지 그림자가 유지되는가.
- 배경의 골대·가로등·태양·난간이 움직이거나 새로 생기지 않는가.
- 1080p에서 UI 하단 22% 영역이 충분히 어두워 플레이바의 흰 글자가 읽히는가.
- 사용자에게 해당 아바타·YouTube 영상·AI 서비스 출력물을 사용할 권리가 있는지 확인한다.

## 프로젝트 배치

최종 파일은 `src/web/assets/cover-loop/`에 아래 이름으로 둔다.

```
hachi-cover-loop.mp4
hachi-cover-poster.webp
```

현재 저장소에는 화면 구도 검수용으로 `hachi-cover-poster.png`가 먼저 들어 있다. 최종 납품 때는 같은 구도의 WebP 포스터로 교체해 용량을 줄이고, `hachi-cover-loop.mp4`를 추가하면 테스트 화면이 해당 영상을 자동으로 사용한다.

신규 하치 레퍼런스와 최종 YouTube 영상 ID, 가사가 준비되면 테스트 데이터의 `videoId`, `title`, `artist`, `lyrics`만 교체한다.
