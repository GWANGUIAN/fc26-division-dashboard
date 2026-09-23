# 커버 루프 플레이리스트 — 다음 구현 세션 계획

## 목표와 범위

현재의 YouTube 음악 플레이어 플로팅 아이콘을 없애고, 같은 오른쪽 아래 영역에 잔디동 플레이리스트 진입 버튼을 둔다. 버튼을 누르면 전체 화면 커버 플레이어 팝업이 열리고, 먼저 하치의 완성된 루프 영상과 음악을 구현한다. 나머지 10명은 이번에는 구현하지 않고, 아래 프롬프트와 에셋 규칙으로 후속 추가한다.

- 기존 직접 주소 /cover-loop-lab 은 개발·검수용으로 유지한다.
- 메인 메뉴에 새 항목을 추가하지 않는다.
- 하치의 기존 hachi-cover-loop.mp4 와 hachi-cover-poster.webp 를 우선 사용한다.
- 선수와 배경은 이후에도 한 장의 완성된 16:9 장면으로 생성한다. 따로 합성하지 않는다.

## 입구와 전체 화면 플레이리스트 팝업

### 진입 버튼

App.tsx 의 floating-toolbar 안에서 MusicPlayer 컴포넌트를 제거한다. 그 자리에 Playlist 또는 Music4 Lucide 아이콘과 잔디동 플레이리스트 텍스트를 가진 버튼을 둔다.

- 위치: 기존 음악 플로팅 버튼 자리, 오른쪽 아래. 기존 SFX 컨트롤과 충돌하지 않게 간격을 유지한다.
- 모양: 얇은 흰색 테두리, rgba(255,255,255,.10) 배경, 각진 모서리, 흰색 아이콘과 텍스트. 원형/캡슐 모양과 주황·크림 그라데이션은 쓰지 않는다.
- 클릭: 전체 화면 overlay를 열고 body scroll을 잠근다. Escape, 배경이 아닌 명시적인 닫기 버튼으로 닫을 수 있어야 한다.
- 접근성: 버튼은 44px 이상의 클릭 영역, aria-label, 명확한 focus-visible 상태를 갖는다.

### 첫 방문 강조 상태

잔디동 월드 구경하기 버튼의 발견 상태 패턴을 재사용한다. 플레이리스트를 **한 번도 열지 않은 브라우저**에서만 버튼을 강조하고, 첫 클릭으로 영구 해제한다.

1. 전용 storage 키와 `hasDiscoveredPlaylist`/`markPlaylistDiscovered` 헬퍼를 만든다. 월드의 `isWorldDiscovered`/`markWorldDiscovered` 패턴을 참고하되 키는 공유하지 않는다.
2. 미발견 상태에서는 버튼에 `--new` 클래스를 붙여 2.2초 주기의 얇은 흰색 테두리 펄스와 아주 작은 밝기 변화를 준다. 플레이리스트의 미니멀한 분위기를 지키기 위해 민트 폭발, 큰 배지, 반복 이동 애니메이션은 쓰지 않는다.
3. 버튼 위에는 `새 플레이리스트`라는 짧은 각진 안내 라벨을 한 번만 보인다. 장식용 반짝임은 쓰지 않아도 되며, 사용한다면 aria-hidden으로 둔다.
4. 첫 클릭 시 storage를 기록하고 강조/라벨을 즉시 제거한 뒤 팝업을 연다. 닫았다가 다시 열어도 강조는 돌아오지 않는다.
5. `prefers-reduced-motion`에서는 펄스 애니메이션 대신 얇은 고정 테두리와 안내 라벨만 보인다.

### 팝업과 닫기 제어

팝업은 viewport 전체를 쓰는 fixed overlay다. 처음 열렸을 때는 장면과 하단 플레이어만 보이고, 상단 닫기 버튼은 숨긴다.

- 팝업 root에서 pointermove, pointerenter, focus-within 이벤트가 오면 controls-visible 상태를 켠다.
- 상단 가운데에 X 아이콘과 닫기 텍스트를 가진 작은 각진 버튼을 둔다.
- 마우스나 키보드 입력이 2.5초 없으면 닫기 버튼만 부드럽게 숨긴다. 포커스가 버튼 안에 있으면 절대 숨기지 않는다.
- 터치 기기에서는 첫 탭으로 controls-visible 상태를 토글하며, 닫기 버튼은 최소 44px 영역으로 3초 이상 유지한다.
- Escape는 언제나 닫는다. 열기 버튼으로 포커스를 되돌린다.
- reduced-motion에서는 자동 fade 시간을 없애고, 닫기 버튼을 항상 보이게 한다.

## 하치 음악: YouTube 확정

SOOP VOD는 재생 제어가 어려워 사용하지 않는다. 하치 음악은 아래 YouTube 영상을 기본 미디어로 확정한다.

~~~
https://youtu.be/JZTxKMRYC_Y?si=VAuxJ-KDynU66R3B
videoId: JZTxKMRYC_Y
~~~

이 YouTube는 아이묭의 마리골드이고, 첫 가사 시작 기준은 6초다. 기존 YouTube IFrame API 코드를 재사용해 재생, 정지, 시크, 음량, 시간, 루프 배경 동기화를 구현한다.

가사 문구는 사용자가 제공하거나 사용 권한이 확인된 텍스트만 LyricCue에 넣는다. 가사를 웹에서 복사하거나 추정하지 않는다. 우선 hachi 데이터에는 lyricStartSeconds: 6 만 기록하고 lyrics는 빈 배열로 둔다. 허가된 가사가 오면 첫 Cue의 startSeconds는 6으로 시작한다.

## 하치 구현 파일과 데이터 구조

현재 관련 파일은 다음과 같다.

- src/web/App.tsx
- src/web/MusicPlayer.tsx
- src/web/CoverLoopLab.tsx
- src/web/cover-loop-lab.css
- src/web/coverLoopLabData.ts
- src/web/assets/cover-loop/hachi-cover-poster.webp
- src/web/assets/cover-loop/hachi-cover-loop.mp4

권장 변경 구조:

1. App.tsx 에 PlaylistLauncher 상태와 전체 화면 CoverLoopPlaylistOverlay를 추가한다. 기존 MusicPlayer import/render를 제거하고, 필요 없어진 musicControl 결합도 영향 범위를 확인해 정리한다.
2. CoverLoopLab을 전체 라우트와 overlay에서 함께 쓸 수 있는 플레이어 본체로 분리하거나, CoverLoopPlaylistOverlay 내부에서 재사용한다.
3. coverLoopLabData.ts 에 YouTube videoId와 나머지 메타데이터를 둔다. 현재는 SOOP source나 adapter를 만들지 않는다.
4. 하치 데이터는 id, displayName, position, title, artist, media, poster, loopVideo, objectPosition, lyricStartSeconds, lyrics를 가진다.
5. 필요하면 YouTubePlayerAdapter만 새 파일에 분리한다.
6. 배경 비디오 video 태그는 항상 muted, loop, playsInline을 유지한다. 외부 음악이 PLAYING 상태일 때만 배경 루프를 재생한다.

## 장면 크롭 해결

현재 scene의 object-fit: cover는 세로로 긴 화면에서 16:9 영상의 좌우를 자른다. 아래의 두 레이어를 사용한다.

1. 채움 배경: 같은 포스터 또는 동영상을 object-fit: cover로 화면 끝까지 채우고 blur와 어두운 오버레이를 적용한다.
2. 주 장면: 그 위에 같은 에셋을 object-fit: contain으로 놓아 원본 16:9 프레임과 선수 얼굴, 신체, 장면 가장자리를 모두 보존한다.
3. 불투명 검은 레터박스는 만들지 않는다. 채움 배경이 빈 영역을 자연스럽게 채운다.
4. 선수별 objectPosition 데이터를 지원해 모바일에서도 얼굴과 상체가 UI에 가려지지 않게 한다.
5. prefers-reduced-motion에서는 주 장면을 포스터로 바꾸고, 채움 배경도 같은 포스터로 유지한다.

## 루프 영상 저장·배포 결정

20MB를 넘는다는 사실만으로 Cloudflare Pages 정적 배포가 불가능한 것은 아니다. Pages의 **개별 정적 에셋 상한은 25MiB**다. 따라서 하치의 8초 무음 루프가 20~25MiB 사이라면 별도 동영상 플랫폼이나 URL 없이 현재처럼 프로젝트의 정적 에셋으로 배포할 수 있다.

### 이번 구현의 기본안: Pages 정적 에셋

1. 먼저 원본을 시각 검수하면서 H.264 MP4로 재인코딩해 **24MiB 이하**로 맞춘다. 25MiB에 딱 맞추지 말고 배포 오차를 피할 1MiB 여유를 둔다.
2. 8초 1080p 루프라면 H.264 6~10Mbps부터 테스트한다. 얼굴, 손, 유니폼 선, 하늘 그라데이션에 뭉개짐이나 밴딩이 없는 가장 낮은 비트레이트를 선택한다.
3. 파일은 `src/web/assets/cover-loop/`에 두고, 코드에서는 파일 import 대신 `LoopScene.loopVideoUrl` 데이터 필드를 통해 연결한다. 첫 구현에서는 그 값이 로컬 Vite asset URL이고, 추후 R2 URL로 바꿔도 컴포넌트는 수정하지 않는다.
4. 11명의 영상이 모두 준비되기 전까지는 하치 한 개만 넣는다. 구현 테스트에 필요한 포스터는 계속 정적 에셋으로 둔다.

### R2로 옮길 조건과 무료 범위

아래 중 하나면 Cloudflare R2 Standard 버킷으로 루프 MP4만 분리한다.

- 품질을 유지하려면 한 파일이 24MiB를 넘는다. (25MiB 초과 파일은 Pages에 올릴 수 없다.)
- 여러 선수 영상 때문에 Git 저장소·빌드 산출물이 과도하게 커진다.

R2의 무료 할당은 월 10GB Standard 저장공간, Class A 100만 회, Class B 1,000만 회이며 R2 egress는 무료다. 11개 영상이 각 20MB 안팎이면 저장공간은 약 220MB라 무료 범위에 충분히 들어간다. 다만 이는 **무제한 무료가 아니다.** 트래픽/요청이 무료 할당을 초과하면 비용이 생길 수 있으므로, “어떤 상황에서도 비용 0원”이 절대 조건이면 Pages의 24MiB 이하 정적 파일 전략을 우선한다.

R2를 쓸 때의 운영 규칙은 다음과 같다.

1. `cover-loop-media` 같은 Standard 버킷을 만들고, `cover-loop/hachi-v1.mp4`처럼 파일명을 버전으로 관리한다. 교체 시 같은 URL을 덮어쓰지 않는다.
2. 프로덕션에서는 `media.<서비스 도메인>`의 **커스텀 도메인**을 연결한다. `r2.dev` 주소는 개발/검수용이며 속도·요청 제한 때문에 프로덕션 배경 영상 URL로 쓰지 않는다.
3. 객체는 `Content-Type: video/mp4`, `Cache-Control: public, max-age=31536000, immutable`으로 업로드한다. 버전 파일명이라 긴 캐시가 안전하다.
4. 코드의 `loopVideoUrl`만 `https://media.<서비스 도메인>/cover-loop/hachi-v1.mp4`로 교체한다. 비디오 태그는 `preload="metadata"`, `muted`, `loop`, `playsInline`을 유지한다.
5. 배포 전 모바일과 데스크톱에서 HTTP Range 요청(시크 가능 여부), `Content-Type`, 최초 재생, 무한 루프를 확인한다.

YouTube·SOOP·일반 무료 동영상 호스팅을 배경 루프 파일 저장소로 쓰지 않는다. 제어 UI, 광고/정책, 재인코딩, 영구 URL 및 재생 동작이 페이지의 무음 배경 루프 요구와 맞지 않는다.

## UI 명세

첨부 레퍼런스처럼 장면이 주인공이고 UI는 조용한 흰색 레이어다.

- 색: 기본 #fff, 보조 rgba(255,255,255,.74), 표면 rgba(255,255,255,.08), 구분선 rgba(255,255,255,.42).
- 주황, 크림, 베이지 그라데이션, glow, 둥근 캡슐은 제거한다.
- 플레이 버튼만 흰색 원형 44px 이상이다. 그 외 패널, 선, 버튼, 비주얼라이저 막대는 border-radius: 0이다.
- 상단 좌측: NOW PLAYING, 곡명, 아티스트.
- 상단 우측: HACHI · 01.
- 상단 중앙: 활성 가사 한두 줄. 가사가 없으면 아무 것도 렌더하지 않는다.
- 하단: 얇은 흰색 비주얼라이저, 곡 메타, 재생/볼륨, 시간, 1px 진행선으로 구성한다. 불필요한 카드 배경은 만들지 않는다.
- 비주얼라이저는 실제 오디오 분석이 아닌 재생 시간과 음량에 따른 모사형이다. 1–2px의 각진 흰색 막대로 만들고 reduced-motion에서는 고정한다.

### 볼륨

- volume-group:hover 와 volume-group:focus-within 에서만 데스크톱 가로 range가 0에서 112px까지 열린다.
- opacity와 max-width만 전환하고 layout shift는 만들지 않는다.
- 키보드 포커스가 range에 있으면 열린 상태를 유지한다.
- 터치 환경에서는 아이콘 탭으로 열거나 짧은 range를 항상 보이게 한다. hover에만 의존하지 않는다.
- mute 상태는 aria-pressed, 아이콘, range 값으로 모두 전달한다.

## 하치 전용 Runway Animate Keyframes 루프

완성된 합성 스틸 원본 파일 하나를 First frame과 Last frame에 같은 파일로 넣는다. Animate Keyframes는 8초를 사용한다. Prompt Enhance와 Audio는 끈다. 아래 동작은 숲 클립의 하치에게만 적용한다. 하치의 핵심 연출은 조용히 숨을 고르는 동작이므로 상체 호흡을 쓴다.

~~~
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
~~~

0초와 8초의 눈, 어깨, 손, 그림자, 배경이 다르거나 입김/연기/오디오/얼굴 변화가 있으면 해당 생성본은 채택하지 않는다.

## 이후 10명과 감독 커버 스틸 프롬프트

모든 프롬프트는 해당 선수의 아바타 레퍼런스를 첨부한 뒤 사용한다. 공통 요구는 한 장의 완성 16:9 장면, 전신, 원본 얼굴·헤어·액세서리·선화·비율 유지, 하단 24%의 어두운 UI 안전 영역, 상단 중앙 가사 여백, 읽을 수 있는 글자·로고·워터마크 없는 이미지다.

### 우왁굳 / 잔디동 감독

선수 아바타가 아니라 **감독 아바타 레퍼런스**를 첨부한다. 감독이 주인공임이 분명해야 하므로 선수 유니폼, 공을 차는 동작, 관중석의 과도한 군중은 넣지 않는다.

~~~
Use the attached coach avatar reference to preserve the exact face,
hairstyle, accessories, proportions, and illustration style. Create one
cinematic 16:9 music-cover illustration: a football club head coach
alone in the technical area of an empty small stadium at blue hour, quietly
watching the floodlit pitch after training. Wear a refined dark coach jacket and
subtle staff lanyard, not a player uniform. A closed tactics folder rests under
one arm; a few training cones and a distant goal softly establish football
without becoming busy. The expression is calm, observant, and responsible, as
if checking that every player has made it home. Full body, three-quarter view,
slightly left of center, facing the field. Cool stadium light meets one warm
sideline lamp; use a coherent contact shadow. Leave the lower 24 percent dark
and uncluttered for player controls and keep open upper-center space for lyrics.
No readable text, logos, scoreboards, watermarks, crowd, whistle, action pose,
or camera drama. Fixed composition, high-resolution unlettered image.
~~~

### 재닌 / janine95kim / GK

~~~
Use the attached character reference to preserve the exact face, eye shape,
hairstyle, accessories, proportions, and illustration style. Create one
cinematic 16:9 music-cover illustration: a goalkeeper mentally resetting after
training in a quiet indoor goalkeeping hall at blue hour. The goalkeeper stands beside a
full-size goal in the warm pool of a single floodlight, goalkeeper gloves at the
sides, a focused calm expression, damp floor reflections and cool pale-blue
shadows. The goal net and neatly stacked training cones establish the goalkeeper
setting. Full body, three-quarter view, slightly right of center. Keep the lower
24 percent calm and dark for player controls, and open space above for lyrics.
Faithful reference rendering, coherent contact shadow, fixed composition,
high-resolution unlettered image.
~~~

### 뽀린걸 / bboringirl / CM

~~~
Use the attached character reference to preserve the exact character identity
and existing illustration style. Create one cinematic 16:9 music-cover
illustration: a central midfielder recovering alone in a softly sunlit locker
room after a long match. The character sits upright on a simple wooden bench,
football boots nearby, elbows loosely on the knees, calm and resilient. Open
lockers, folded training towels, and late-afternoon light create quiet depth.
Full body, three-quarter view, a little left of center. Reserve a dark,
uncluttered lower 24 percent for the player UI and upper-center lyric space.
Premium reflective sports album mood, fixed composition, high-resolution
unlettered image.
~~~

### 핑구 / sjh4018 / CB

~~~
Use the attached character reference to preserve the exact character identity and
art style. Create one cinematic 16:9 music-cover illustration: a center back
standing in a quiet concrete stadium stairwell before dawn, taking a moment to
reset after defending all night. A cool skylight frames fading stars; a football
and folded training jacket rest on a step behind. The posture is grounded,
protective, and composed. Full body, three-quarter view, slightly right of
center. Lower 24 percent is dark and uncluttered for player UI; upper center is
clear for lyrics. Preserve face, hair, proportions, and rendering method;
fixed composition, high-resolution unlettered image.
~~~

### 문모모 / doormomo / CDM

~~~
Use the attached character reference to preserve the exact character identity and
illustration style. Create one cinematic 16:9 music-cover illustration: a deep
midfielder alone in a dim recovery and video-analysis room after practice.
The character stands beside a plain tactical board with abstract non-readable
markings and a softly glowing overhead projector, thoughtful and in control. A
football rests near one shoe; navy shadows and a warm desk lamp make clean
geometric light across the floor. Full body, three-quarter view, slightly left
of center. Reserve lower 24 percent for UI and upper-center lyric space. Keep
reference face, hair, proportions, and linework; fixed composition,
high-resolution unlettered image.
~~~

### 한결 / kaksjak0730 / CM·CDM

~~~
Use the attached character reference to preserve exact identity and existing art
style. Create one cinematic 16:9 music-cover illustration: a midfielder resting
on the quiet rooftop of a small observatory after evening training. The character
stands beside a telescope and low parapet, one football at the feet, watching a
clear indigo sky where a few stars emerge. Cool moonlight and one warm interior
window suggest patience and field vision. Full body, three-quarter view, a little
right of center. Leave dark lower 24 percent for UI and open upper-center lyrics
space. Faithfully preserve face, hair, proportions, and rendering style; fixed
composition, high-resolution unlettered image.
~~~

### 쥬멩이 / ju010228 / ST

~~~
Use the attached character reference to preserve exact identity and existing
illustration style. Create one cinematic 16:9 music-cover illustration: a
striker recharging in a quiet glass greenhouse beside a training center at early
morning. The character leans lightly against the doorway with a football by one foot,
soft spring leaves, pale sunlight, and condensation on the glass. The feeling is
hopeful after a difficult session, never an action shot. Full body,
three-quarter view, slightly left of center. Keep lower 24 percent dark and
uncluttered for controls and upper center clear for lyrics. Preserve reference
face, hairstyle, proportions, and linework; fixed composition, high-resolution
unlettered image.
~~~

### 해파린 / haepalin / CB

~~~
Use the attached character reference only to preserve the exact face, hairstyle,
accessories, proportions, and existing illustration style. Create one cinematic
16:9 music-cover illustration: a calm center back resetting alone in a quiet
stadium equipment room after a rainy practice. The character sits on a simple
wooden equipment trunk beside matte slate-blue lockers, with a folded training
jacket and one football on the floor. Use soft, even side light from outside the
frame and a plain, darker locker surface behind the head; keep all light sources
away from the head and shoulders. The feeling is patient, grounded, and quietly
protective. Full body, three-quarter view, a little right of center. Reserve a
dark, low-detail lower 24 percent for player controls and open upper-center
space for lyrics. No readable text, logos, or watermarks. Keep the lighting
soft, practical, and diffuse; every prop rests naturally on the floor or an
existing surface. Fixed composition, high-resolution unlettered image.
~~~

### 빙밍 / tleod1818 / FB

~~~
Use the attached character reference to preserve exact identity and existing art
style. Create one cinematic 16:9 music-cover illustration: a fullback taking a
quiet break on a pedestrian bridge over an empty city canal after light rain.
The character stands beside a bicycle rack with a football kit bag at the feet, city
lights reflecting on wet pavement and a thin cool sunrise in the distance. The
scene implies speed finally slowing down without running. Full body,
three-quarter view, slightly left of center. Keep lower 24 percent dark and
simple for controls and upper center clear for lyrics. Preserve reference face,
hair, proportions, and linework; fixed composition, high-resolution unlettered
image.
~~~

### 다시바 / tdnlamuron / WF

~~~
Use the attached character reference to preserve exact identity and existing art
style. Create one cinematic 16:9 music-cover illustration: a winger cooling
down in a quiet indoor recovery room lit by deep ember-red sunset through high
windows. The character sits on a low bench with a football at the side, relaxed after
an intense session, warm red light fading into charcoal shadows and simple
recovery towels behind. The mood is controlled energy returning to calm, with
no flames, smoke, or fantasy effects. Full body, three-quarter view, slightly
right of center. Reserve low-detail lower 24 percent for controls and open
upper-center lyric space. Preserve reference face, hairstyle, proportions, and
rendering method; fixed composition, high-resolution unlettered image.
~~~

### 리냐 / lina0108 / FB

~~~
Use the attached character reference to preserve exact identity and existing art
style. Create one cinematic 16:9 music-cover illustration: a fullback pausing
at a quiet forked path in a riverside cherry-blossom park at late golden hour.
The character rests one hand on a bicycle-style training bag, football near the shoes,
with two soft diverging paths and petals on the ground. The character stays
calm and still; the scene suggests awareness and unexpected options. Full body,
three-quarter view, a little left of center. Keep lower 24 percent dark and
simple for controls and upper-center lyric space. Preserve face, hair,
proportions, and linework from the reference; fixed composition,
high-resolution unlettered image.
~~~

## 10명과 감독 전용 루프 애니메이션 프롬프트

아래 프롬프트는 각 선수의 해당 완성 스틸을 First frame과 Last frame에 같은 파일로 넣고 Animate Keyframes의 8초 클립에서 사용한다. Prompt Enhance와 Audio는 끈다. 공통적으로 locked camera, silent video, identical first/final frame, 그리고 원본의 얼굴·헤어·의상·손·배경·광원을 그대로 유지한다. 한 번에 두 가지보다 많은 움직임을 넣지 않는다.

### 우왁굳 / 잔디동 감독 — 비어 있는 피치를 바라보는 감독

재킷 자락·전술 폴더·손은 형태가 바뀌기 쉬우므로 움직이지 않는다. 이 장면은 한 번의 눈 깜빡임만으로 충분하며, 원본 의상 실루엣을 완전히 고정한다.

~~~
An eight-second seamless silent loop. The first and final frame are identical.
Preserve the coach's exact face, hairstyle, calm expression, dark coach jacket,
staff lanyard, closed tactics folder, technical area, distant goal, cones,
stadium lights, contact shadow, and composition. Locked camera. Use the input
image as a frozen plate. The only permitted animation is one natural blink: at
4 seconds both eyelids close once and reopen to the identical gaze toward the
pitch by 4.3 seconds. The original jacket silhouette is immutable: its hem,
sleeve length, lapels, shoulders, fabric texture, and every edge remain exactly
as in the input for all eight seconds. The head, mouth, body, hands, lanyard,
folder, cones, goal, floodlights, grass, and background remain perfectly still.
From 5.5 to 8 seconds, hold the exact initial pose. Silent video: no generated
audio, speech, whistle, crowd sound, music, camera movement, text, or added
objects.
~~~

### 재닌 / GK — 골문 앞 준비 자세

장면의 골키퍼 정체성은 남기되, 손가락 변형을 줄이기 위해 장갑 자체를 움직이지 않는다. 긴장된 발끝과 눈만 작게 쓴다.

~~~
An eight-second seamless silent loop. The first and final frame are identical.
Preserve the attached character's exact face, hairstyle, goalkeeper gloves, goal net, lighting,
and composition. Locked camera. From 0 to 2.5 seconds, she makes one tiny
goalkeeper readiness shift: weight settles very slightly from the back foot to
a centered stance while both gloves hold the exact starting position. From 3 to
5.5 seconds, the stance returns precisely to the initial pose. At 4 seconds,
both eyelids close once and reopen to the identical focused gaze. From 5.5 to 8
seconds, hold the initial pose. Silent video, no generated audio, no mist, no
new motion in the goal net or background.
~~~

### 뽀린걸 / CM — 라커룸 벤치의 리듬 회복

벤치에 앉은 중앙 미드필더의 지속력은 발끝의 작은 리듬으로 표현한다. 상체·손·부츠 끈은 고정한다.

~~~
An eight-second seamless silent loop. The first and final frame are identical.
Preserve the attached character's exact face, hair, seated pose, locker room, bench,
football boots, lighting, and composition. Locked camera. From 0 to 2.5
seconds, the toe of the forward foot lifts a few millimeters in one quiet
rhythmic tap while the heel remains in place. From 3 to 5.5 seconds, the toe
returns exactly to the initial position. At 4 seconds, both eyelids close once
and reopen to the same calm gaze. Hands, torso, boot laces, lockers, towels,
and all background objects remain in the initial pose. From 5.5 to 8 seconds,
hold the initial pose. The bottom area is only the original dark locker-room
floor and lighting; it remains completely empty and unchanged. Do not generate
or reveal any video-player controls, progress bar, timeline, play or pause
icon, scrubber, captions, text, border, frame, watermark, interface overlay,
or fade-in/fade-out graphic at any time. Silent video, no generated audio.
~~~

### 핑구 / CB — 새벽 계단의 수비 집중

수비수의 단단함은 눈 한 번과 어깨의 아주 작은 무게 정리만으로 표현한다. 재킷·하늘·계단에 움직임을 지시하면 의상이나 배경 효과로 과장될 수 있으므로 모두 고정한다.

~~~
An eight-second seamless silent loop. The first and final frame are identical.
Preserve the attached character's exact face, hair, stairwell, football, jacket, skylight,
lighting, and composition. Locked camera. From 0.8 to 2.5 seconds, both
shoulders settle downward by only one or two pixels in one tiny natural posture
adjustment; the head, jacket shape, and hands do not move independently. From
3 to 5.5 seconds, the shoulders return precisely to the initial pose. At 4
seconds, both eyelids close once and reopen to the identical steady gaze. The
head, hands, legs, jacket, football, stairs, skylight, sky, and every background
object remain completely still. No wind, moving fabric, light flicker, stars,
mist, glow, magic, particles, overlays, or new objects. From 5.5 to 8 seconds,
hold the exact initial pose. Silent video, no generated audio.
~~~

### 문모모 / CDM — 전술실의 정적

문모모는 장면의 프로젝터 빛만 아주 약하게 호흡시키고, 선수는 눈 한 번만 움직인다. 전술판의 글자나 도형을 새로 만들지 않는다.

~~~
An eight-second seamless silent loop. The first and final frame are identical.
Preserve the attached character's exact face, hair, pose, tactical room, board markings,
football, lamp, and composition. Locked camera. From 0 to 2.5 seconds, the
soft projector glow on the floor becomes fractionally brighter without changing
its shape. From 3 to 5.5 seconds, it returns exactly to the initial brightness.
At 4 seconds, both eyelids close once and reopen to the identical thoughtful
gaze. The body, hands, tactical board, football, lamp, and all room objects
hold the initial pose. From 5.5 to 8 seconds, hold the initial pose. Silent
video, no generated audio, no new text or symbols.
~~~

### 한결 / CM·CDM — 천문대 옥상의 별똥별

한결 이미지에 이미 있는 별똥별을 쓰는 연출이다. 첫·끝 키프레임이 같아야 하므로 별이 화면을 가로질러 사라지는 긴 이동은 쓰지 않는다. 기존 짧은 궤적을 따라 별똥별의 빛과 꼬리만 잠깐 더 길어지고, 한결이 이를 보며 턱과 시선을 아주 작게 올렸다가 복귀한다.

~~~
An eight-second seamless silent loop. The first and final frame are identical.
Preserve the attached character's exact face, eye shape, hairstyle, observatory roof,
telescope, football, parapet, moonlight, and composition. Locked camera. Use
the single existing shooting star already visible in the upper sky; do not add
another star. From 0.8 to 2.8 seconds, the shooting star glides only a very
short distance along its existing diagonal path, its thin tail briefly grows
brighter and longer, then settles back to the exact original star position and
tail by 3.5 seconds. While the shooting star moves, the character gently lifts the
chin by a few pixels and the eyes follow it upward. From 3.5 to 5.5 seconds,
the chin and gaze return precisely to the initial pose. At 5.8 seconds, both
eyelids close once and reopen to the identical original gaze. The hair, hands,
torso, telescope, football, rooftop, and all other stars remain unchanged. From
6.5 to 8 seconds, hold the exact initial pose. Silent video, no generated
audio, no new text, no camera movement.
~~~

### 쥬멩이 / ST — 온실의 아침

온실의 빛·유리·나뭇잎은 변화시키지 않는다. 캐릭터가 문틀에 기대며 아주 작게 무게를 정리하고 눈을 한 번 깜빡이는 것만 사용한다.

~~~
An eight-second seamless silent loop. The first and final frame are identical.
Preserve the attached character's exact face, hair, doorway pose, football, greenhouse glass,
leaves, sunlight, and composition. Locked camera. From 0.8 to 2.5 seconds, the
upper torso settles toward the existing doorway by only one or two pixels in a
single tiny weight adjustment; face, head angle, arms, hands, and clothing shape
remain unchanged. From 3 to 5.5 seconds, the torso returns precisely to the
initial pose. At 4 seconds, both eyelids close once and reopen to the identical
hopeful gaze. The football, greenhouse glass, leaves, sunlight, condensation,
doorway, and all background objects remain completely still. No changing light,
moving leaves, wind, bloom, flare, particles, mist, magic, overlays, or new
objects. From 5.5 to 8 seconds, hold the exact initial pose. Silent video, no
generated audio.
~~~

### 해파린 / CB — 장비실의 고요한 회복

원본을 거의 완전히 고정한 뒤 눈과 앉은 발끝만 허용한다. 머리 주변·조명·배경을 전부 고정해, 캐릭터 위에 새 시각 요소가 생길 여지를 없앤다.

~~~
An eight-second seamless silent loop. The first and final frame are identical.
Use the input image as a frozen plate. Preserve the attached character's exact
face, hair, head silhouette, seated pose, equipment trunk, lockers, jacket,
football, side lighting, and composition exactly as in the input. Locked
camera. There are only two permitted changes in the entire clip. First, from
0.8 to 2.5 seconds, the toe of the forward foot lifts by only a few millimeters
while the heel stays planted, then returns precisely to its initial position by
3.5 seconds; the head, face, hands, torso, and clothing outline stay fixed.
Second, at 4 seconds, both eyelids close once and reopen to the identical
patient gaze by 4.3 seconds. Every other part of the input image remains a
perfectly still, unchanged freeze-frame for all eight seconds, including the
area around the head, the lockers, and the lighting. From 5.5 to 8 seconds,
hold the exact initial pose. Silent video, no generated audio.
~~~

### 빙밍 / FB — 비 갠 도시 다리

빠른 풀백이 멈춘 순간을 신발의 미세한 무게 이동으로 표현한다. 가방 끈, 물웅덩이, 도시 불빛은 고정한다.

~~~
An eight-second seamless silent loop. The first and final frame are identical.
Preserve the attached character's exact face, hair, bridge, kit bag, shoes, wet pavement,
city lights, and composition. Locked camera. From 0 to 2.5 seconds, weight
settles very slightly onto the front foot, moving only the ankle and shoe by a
few pixels. From 3 to 5.5 seconds, the foot returns exactly to the initial
pose. At 4 seconds, both eyelids close once and reopen to the identical calm
gaze. The hands, kit bag, puddles, railings, and city lights remain unchanged.
From 5.5 to 8 seconds, hold the initial pose. Silent video, no generated audio.
~~~

### 다시바 / WF — 붉은 회복실

붉은 창문빛도 고정한다. 빛 변화가 불꽃·열기·연기 효과로 번질 수 있으므로, 앉은 캐릭터의 발끝과 눈 한 번만 움직인다.

~~~
An eight-second seamless silent loop. The first and final frame are identical.
Preserve the attached character's exact face, hair, seated pose, bench, football, towels,
windows, and composition. Locked camera. From 0.8 to 2.5 seconds, the toe of
the forward foot lifts only a few millimeters while the heel stays planted; the
rest of the leg, torso, hands, and clothing remain still. From 3 to 5.5 seconds,
the toe returns precisely to the initial position. At 4 seconds, both eyelids
close once and reopen to the identical composed gaze. The football, bench,
towels, windows, red light, floor, and every background object remain completely
still. No light change, fire, smoke, heat distortion, glow, flare, particles,
wind, magic, overlay, or new object. From 5.5 to 8 seconds, hold the exact
initial pose. Silent video, no generated audio.
~~~

### 리냐 / FB — 벚꽃 갈림길

리냐는 갈림길의 분위기를 유지하면서 땅 위 꽃잎 한 장의 미세한 이동과 눈 한 번으로 처리한다. 꽃잎이 많이 날리면 루프와 얼굴 안정성이 나빠진다.

~~~
An eight-second seamless silent loop. The first and final frame are identical.
Preserve the attached character's exact face, hair, forked path, training bag, football, cherry
trees, petals, sunset, and composition. Locked camera. From 0 to 2.5 seconds,
one single petal resting near the edge of the path slides a few pixels. From 3
to 5.5 seconds, it returns exactly to the initial position. At 4 seconds, both
eyelids close once and reopen to the identical calm gaze. The body, hands,
training bag, football, paths, trees, and every other petal remain unchanged.
From 5.5 to 8 seconds, hold the initial pose. Silent video, no generated audio.
~~~


## 검증

- pnpm typecheck, pnpm test, pnpm build를 실행한다.
- 16:9 데스크톱, 1440×900, 375px 모바일, 모바일 가로에서 검수한다.
- 주 장면은 자르지 않고, 채움 배경은 여백 없이 viewport를 채우는지 확인한다.
- 열기, 닫기, Escape, focus return, mouse reveal, touch reveal, 볼륨 hover/focus/touch, seek, mute, reduced-motion을 검수한다.
- YouTube 재생 상태, 시간, 가사 cue, 루프 배경, 모사형 visualizer가 함께 동기화되는지 확인한다.

## 다음 세션에 전달할 지시문

~~~
docs/cover-loop-lab-next-implementation.md를 먼저 읽고 그대로 구현해줘.

기존 YouTube MusicPlayer 플로팅 아이콘은 제거하고, 그 위치에 각진 흰색/반투명 흰색 잔디동 플레이리스트 버튼을 넣어줘. 버튼을 한 번도 열지 않은 브라우저에서는 잔디동 월드 구경하기 버튼처럼 짧은 첫 방문 강조 효과와 `새 플레이리스트` 안내 라벨을 보이고, 첫 클릭 후 localStorage에 기록해 다시는 강조하지 마. 클릭하면 전체 화면 커버 플레이어 팝업을 열어. 팝업 상단 중앙의 닫기 버튼은 처음엔 숨기고 마우스 이동 또는 키보드 포커스 때 나타나게 해. 터치, Escape, focus return, reduced-motion 접근성도 계획대로 구현해.

하치만 우선 구현해. 기존 hachi-cover-loop.mp4와 포스터를 쓰고, 16:9 영상 좌우가 잘리지 않도록 contain 주 장면과 cover/blur 배경 채움 레이어를 구현해. UI는 첨부 레퍼런스처럼 얇은 흰색/반투명 흰색, 각진 형태로 단순화하고 플레이 버튼만 원형으로 둬. 볼륨은 데스크톱 hover와 keyboard focus에서 열리고 터치에서 hover에 의존하지 않게 해.

하치 루프 MP4가 24MiB 이하라면 우선 Pages 정적 에셋으로 유지해. 품질상 이를 넘거나 선수 영상 수가 늘어날 때만 문서의 R2 Standard + 커스텀 도메인 절차를 적용하고, 컴포넌트는 `loopVideoUrl`만 교체할 수 있게 만들어.

SOOP VOD는 사용하지 마. 하치 음악은 YouTube videoId JZTxKMRYC_Y 를 사용해. 곡은 아이묭 마리골드이고 첫 가사 시작은 6초다. 사용자가 제공하거나 권한이 확인된 가사만 LyricCue에 넣고, 그 전에는 lyricStartSeconds: 6만 반영해.

나머지 10명은 이번에 구현하지 말고 문서의 프롬프트와 에셋 규칙만 유지해. 마지막에 pnpm typecheck, pnpm test, pnpm build와 데스크톱/모바일/reduced-motion 검수 결과를 보고해.
~~~
