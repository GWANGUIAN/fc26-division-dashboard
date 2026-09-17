# 커스텀 응원 유니폼 — 이미지 생성 프롬프트 레퍼런스

`src/web/uniform-customizer/`에 구현될 "응원 유니폼 만들기" 모달에 쓰이는 유니폼 아트 생성용 프롬프트 모음. 한 장씩 이미지를 만들 때마다 이 문서의 해당 섹션을 참고해서 생성 → 파일명 규칙대로 저장 → 변환 스크립트 실행 순으로 진행하면 됨.

## 디자인 방향 (중요)

- **총 4장, 한 장에 앞면(왼쪽)+뒷면(오른쪽)을 함께 담은 구도**: 홈/어웨이 × 일반(아웃필드)/골키퍼 조합. 캔버스 2000×1600px 한 장 안에 같은 유니폼을 **왼쪽 절반(대략 x: 0~1000px)에는 앞면, 오른쪽 절반(대략 x: 1000~2000px)에는 뒷면**을 나란히 배치 — 두 뷰가 서로 겹치지 않게 중앙에 여백을 두고, 각자 절반 안에서 비슷한 크기로 중앙 정렬. 앞면이 있어야 모달에서 유니폼 썸네일/미리보기를 볼 때 어떤 디자인인지 한눈에 파악되고, 뒷면에는 사용자가 입력한 등번호·이름이 실시간으로 얹힘.
- **팀 크레스트·등번호·이름은 전부 오른쪽 뒷면 절반 위에 코드가 그려 넣음**: 사용자가 모달에서 등번호·이름을 입력하면, 사이트가 이미지 위 오른쪽 절반(뒷면) 자리에 `잔디동` 팀 크레스트(`public/team/team-jandy.webp`, 작게)를 위쪽에, 이름을 그 아래, 번호를 가장 아래에 실시간으로 그려 넣는다(카드/캐릭터에 텍스트를 굽지 않고 매번 canvas로 합성하는 TOTY 카드 방식과 동일). **그래서 오른쪽 뒷면의 등 중앙 상단~허리 위 영역은 완전히 비워둬야 한다** — 실제 저지처럼 그 자리에 크레스트·숫자·이름 등 아무것도 인쇄되어 있으면 안 됨(placeholder도 넣지 말 것). 왼쪽 앞면에는 원래 디자인대로 "잔디동" 워드마크·엠블럼이 들어가도 됨(앞면은 합성 대상이 아님).
- **기존 프론트뷰 레퍼런스를 스타일 잠금 용도로 재사용**: `잔디동 단체샷` 기능을 위해 이미 만들어둔 홈 아웃필드 유니폼의 앞면 플랫레이 레퍼런스 이미지가 있다(파일: 사용자 로컬 `uniform.png`, 저장소 밖 작업 폴더 보관 — 흰색 베이스 + 민트그린(`#00e9ae`) 포인트, 가슴에 "잔디동" 워드마크, 왼쪽 가슴 하단에 방패형 "JANDIDONG" 엠블럼, 소매에 "F" 로고). `home-outfield` 프롬프트의 왼쪽 앞면은 이 이미지를 **그대로 재현**하고, 오른쪽 뒷면은 같은 유니폼을 뒤에서 본 새 구도로 그린다.
- **어웨이는 홈의 "대각선 숄더 액센트"를 그대로 재색상만 바꾸지 않고, 컬러+패턴을 모두 다르게**: 첫 시도(딥그린 단색 리컬러)가 밋밋하고 촌스럽다는 피드백을 받아, **딥 네이비 베이스 + 얇은 민트그린 세로 핀스트라이프**로 방향을 바꿨다 — 깔끔하고 고급스러운 유러피안 클럽 어웨이 키트 느낌의 줄무늬 패턴을 넣어서 홈과는 확실히 다른 디자인 언어를 갖게 함(단순 리컬러가 아니라 별도 디자인). 골키퍼 버전(`away-gk`)도 같은 핀스트라이프 모티프를 이어받아 패밀리감을 유지한다. 실제 생성 결과가 마음에 안 들면 아래 프롬프트의 색상/줄무늬 지시만 바꿔서 재생성하면 됨.
- **골키퍼는 아웃필드와 뚜렷이 다른 색 + 같은 컷/로고 배치**: `group-photo` 기능의 재닌(골키퍼) 프롬프트와 동일한 원칙 — 커스텀 유니폼 4장도 GK 버전은 딥 차콜/블랙 베이스에 민트그린 트림만 유지해서 아웃필드와 구분한다. 재닌이 실제로 입고 있는 골키퍼 유니폼 레퍼런스(`src/web/assets/group-photo/janine95kim.webp`)를 컬러/실루엣 참고용으로 함께 첨부한다.
- **생성 순서가 곧 레퍼런스 체인**: 홈 아웃필드(①)를 가장 먼저 만들고, 홈 GK(②)·어웨이 아웃필드(③)는 ①의 앞면+뒷면 합성 이미지를 컷/구조 레퍼런스로 재사용한다. 어웨이 GK(④)는 색상·핀스트라이프 모티프를 맞춰야 하므로 ①이 아니라 **③(어웨이 아웃필드) 결과물**을 레퍼런스로 재사용한다(순서를 바꾸면 안 됨).

## 공통 작업 방식

1. **캔버스**: 전부 **2000×1600px**, PNG(투명 불필요, 이후 webp로 변환) — 기존 유니폼 레퍼런스(`uniform.png`)와 동일 규격. 왼쪽 절반(앞면)/오른쪽 절반(뒷면) 구도는 위 "디자인 방향" 참고.
2. **생성 순서**: ① `home-outfield` → ② `home-gk` → ③ `away-outfield` → ④ `away-gk`. 반드시 이 순서로 진행 — ②③④는 전 단계 결과물을 레퍼런스로 쓰기 때문.
3. **레퍼런스 이미지 첨부**: 아래 각 섹션의 "레퍼런스" 항목 참고. 공통으로 등장하는 "기존 유니폼 레퍼런스"는 사용자 로컬 `uniform.png`(앞면, 저장소에는 없음)를 가리킴.
4. **파일명 규칙**: `<id>.webp`(아래 표의 `id` 컬럼 사용). PNG로 받으면 아래 명령으로 변환·이동:
   ```bash
   pnpm convert:uniform-art -- <id> <PNG가 들어있는 폴더 경로>
   ```
   예: `홈 · 일반` 이미지를 `public/test/`에 `character.png`로 받아뒀다면 `pnpm convert:uniform-art -- home-outfield`.
5. `src/web/uniform-customizer/uniformKits.ts`가 `src/web/assets/uniform-customizer/`를 자동 스캔하므로(`import.meta.glob`), 이미지가 갖춰지는 대로 모달에 바로 반영됨 — 4장이 모두 없어도 준비된 것만 선택지에 나타남.
6. 등번호/이름 텍스트가 그려지는 정확한 좌표(퍼센트)는 이미지가 아니라 `src/web/uniform-customizer/exportUniformImage.ts`와 `styles.css`의 `.uniform-customizer__preview` 쪽 코드 설정값이므로, 아래 각 이미지의 "빈 자리"가 오른쪽 뒷면 절반의 등 중앙 상단(이름)·그 아래(번호)에 위치하기만 하면 세부 좌표는 코드에서 조정 가능함.

## 홈 · 일반(아웃필드) — `home-outfield` (완료)

기존 앞면 레퍼런스 그대로의 앞면(왼쪽) + 같은 유니폼을 뒤에서 본 뒷면(오른쪽)을 한 캔버스에 나란히. 뒷면의 이름/번호 자리(어깨 아래 등 중앙 상단부터 허리 위까지)는 완전히 비워둘 것.

- **캔버스**: 2000×1600px, PNG
- **레퍼런스**: 기존 유니폼 레퍼런스(`uniform.png`, 앞면) — 왼쪽 앞면은 이 이미지 그대로 재현, 뒷면 디자인(색상·카라/커프 트림·로고 스타일)도 이 이미지 기준으로 통일
- **프롬프트**:
  ```
  A flat, product/catalog-style reference sheet showing the SAME modern
  soccer jersey from two angles side by side on one canvas, laid flat,
  no person or mannequin wearing it. On the LEFT half of the frame
  (roughly x: 0-1000px of a 2000px-wide canvas): the FRONT of the
  jersey, reproduced exactly like the attached front-view reference
  image — primarily WHITE base, sleek mint-green (#00e9ae) diagonal
  shoulder accent, thin mint-green trim on collar and cuffs, "잔디동"
  printed across the chest, small shield "JANDIDONG" emblem on the
  lower-left chest, small "F" swoosh logo on the sleeve. On the RIGHT
  half of the frame (roughly x: 1000-2000px): the BACK of the exact
  same jersey, same white base and mint-green accent (the diagonal
  accent mirrored to flow across the back), same collar/cuff trim —
  but with NO name or number printed. The entire upper-back area
  (below the collar, spanning shoulder to shoulder, down to roughly
  mid-back) must be left completely plain and empty, no placeholder
  text, no numerals, no nameplate, nothing printed there at all — this
  blank area will have a player name and number added digitally later.
  A small "F" swoosh logo may appear low on the back near the hem. Both
  views are the same jersey, same scale, each centered within its own
  half with a clear gap between them so they don't overlap or touch.
  Clean, evenly lit product photography style, plain neutral light-gray
  background, no wrinkles obscuring the design, no person, no mannequin.
  This is a flat design reference only. PNG, 2000x1600, landscape.
  ```

## 홈 · 골키퍼 — `home-gk` (완료)

같은 앞면(왼쪽)+뒷면(오른쪽) 구도를 유지한 채 골키퍼 전용 배색으로 리컬러.

- **캔버스**: 2000×1600px, PNG
- **레퍼런스**: (a) 기존 유니폼 레퍼런스(`uniform.png`, 앞면), (b) `src/web/assets/group-photo/janine95kim.webp`(재닌이 입은 골키퍼 유니폼) — 두 장 함께 첨부
- **프롬프트**:
  ```
  A flat, product/catalog-style reference sheet showing a GOALKEEPER
  version of the jersey in attached reference image (a) from two angles
  side by side on one canvas, laid flat, no person or mannequin
  wearing it. On the LEFT half of the frame (roughly x: 0-1000px of a
  2000px-wide canvas): the FRONT of the goalkeeper jersey — same cut,
  collar/cuff trim style, chest wordmark and emblem placement as
  reference (a), but recolored to a solid deep charcoal/black base
  (matching the goalkeeper kit worn by the character in reference image
  (b)), keeping only a small mint-green (#00e9ae) trim/piping accent on
  the collar and cuffs. On the RIGHT half of the frame (roughly x:
  1000-2000px): the BACK of the exact same goalkeeper jersey, same
  charcoal/black base and mint-green trim — but with NO name or number
  printed. The entire upper-back area (below the collar, spanning
  shoulder to shoulder, down to roughly mid-back) must be left
  completely plain and empty, no placeholder text, no numerals, no
  nameplate. A small "F" swoosh logo may appear low on the back near
  the hem. Both views are the same jersey, same scale, each centered
  within its own half with a clear gap between them so they don't
  overlap or touch. Clean, evenly lit product photography style, plain
  neutral light-gray background, no wrinkles obscuring the design, no
  person, no mannequin, no gloves (jersey only). This is a flat design
  reference only. PNG, 2000x1600, landscape.
  ```

## 어웨이 · 일반(아웃필드) — `away-outfield` (완료)

홈의 "대각선 숄더 액센트"를 재색상만 바꾸는 대신, **딥 네이비 베이스 + 얇은 민트그린 세로 핀스트라이프**로 컬러와 패턴을 모두 새로 디자인. 같은 앞면(왼쪽)+뒷면(오른쪽) 구도는 유지.

- **캔버스**: 2000×1600px, PNG
- **레퍼런스**: 위 ① `home-outfield`에서 새로 생성한 앞면+뒷면 합성 이미지 — 컷·로고 배치·트림 구조 참고용 (색상·패턴은 아래 지시를 따름, 리컬러가 아니라 새 디자인)
- **프롬프트**:
  ```
  A flat, product/catalog-style reference sheet showing an AWAY
  colorway version of the jersey in the attached reference image from
  two angles side by side on one canvas, laid flat, no person or
  mannequin wearing it. On the LEFT half of the frame (roughly x:
  0-1000px of a 2000px-wide canvas): the FRONT of the away jersey —
  same cut and collar/cuff trim silhouette as the reference, but a
  genuinely new colorway and pattern, NOT just a recolor of the home
  kit's diagonal shoulder accent. Base color: a deep navy/ink-blue
  (clearly distinct from the home kit's white base and from a plain
  dated-looking solid green). Pattern: thin, evenly-spaced mint-green
  (#00e9ae) vertical pinstripes running the full length of the jersey
  body, front and back — subtle and refined, like a premium tailored
  European club away kit, NOT thick old-fashioned block stripes and NOT
  a diagonal accent. Crisp white piping trim on the collar and sleeve
  cuffs for contrast against the navy. "잔디동" printed across the chest
  in white, small shield "JANDIDONG" emblem on the lower-left chest in
  white/mint, small "F" swoosh logo on the sleeve in mint-green. On the
  RIGHT half of the frame (roughly x: 1000-2000px): the BACK of the
  exact same away jersey, same navy base and mint pinstripes (continuing
  across the back), same white collar/cuff trim — but with NO name or
  number printed. The entire upper-back area (below the collar, spanning
  shoulder to shoulder, down to roughly mid-back) must be left
  completely plain and empty, no placeholder text, no numerals, no
  nameplate — the pinstripes may run through this area but nothing else
  may be printed there. Premium, sleek, sophisticated modern away-kit
  color story — clearly a different jersey from the white home kit at a
  glance, while still reading as the same team through the shared cut
  and the mint-green pinstripes/trim. Explicitly avoid: a plain solid
  block color with no pattern, a dated or cheap-looking finish, thick
  clashing stripes. Both views are the same jersey, same scale, each
  centered within its own half with a clear gap between them so they
  don't overlap or touch. Clean, evenly lit product photography style,
  plain neutral light-gray background, no wrinkles obscuring the
  design, no person, no mannequin. This is a flat design reference
  only. PNG, 2000x1600, landscape.
  ```

## 어웨이 · 골키퍼 — `away-gk` (완료)

어웨이 아웃필드의 **핀스트라이프 모티프**를 이어받되, 골키퍼답게 아웃필드(네이비)와 뚜렷이 구분되는 베이스 컬러로. 같은 앞면(왼쪽)+뒷면(오른쪽) 구도로.

- **캔버스**: 2000×1600px, PNG
- **레퍼런스**: 위 ③ `away-outfield`에서 새로 생성한 앞면+뒷면 합성 이미지 — 컷·로고 배치·핀스트라이프 패턴 참고용, 베이스 컬러만 아래 프롬프트 지시를 따름
- **프롬프트**:
  ```
  A flat, product/catalog-style reference sheet showing an AWAY
  GOALKEEPER version of the jersey in the attached reference image from
  two angles side by side on one canvas, laid flat, no person or
  mannequin wearing it. On the LEFT half of the frame (roughly x:
  0-1000px of a 2000px-wide canvas): the FRONT of the away goalkeeper
  jersey — same cut and collar/cuff trim style as the reference, and
  the SAME thin vertical pinstripe pattern, but recolored to a bold
  burnt-orange or mustard-yellow solid base (a goalkeeper color clearly
  distinct from both the home goalkeeper's charcoal/black and the away
  outfield kit's navy) with the pinstripes now rendered in mint-green
  (#00e9ae) against the orange/mustard base, keeping a small mint-green
  trim/piping accent on the collar and cuffs to tie it back to the team
  identity. On the RIGHT half of the frame (roughly x: 1000-2000px):
  the BACK of the exact same away goalkeeper jersey, same
  burnt-orange/mustard base with mint pinstripes continuing across the
  back, same mint-green trim — but with NO name or number printed. The
  entire upper-back area (below the collar, spanning shoulder to
  shoulder, down to roughly mid-back) must be left completely plain and
  empty, no placeholder text, no numerals, no nameplate — the
  pinstripes may run through this area but nothing else may be printed
  there. Both views are the same jersey, same scale, each centered
  within its own half with a clear gap between them so they don't
  overlap or touch. Clean, evenly lit product photography style, plain
  neutral light-gray background, no wrinkles obscuring the design, no
  person, no mannequin, no gloves (jersey only). This is a flat design
  reference only. PNG, 2000x1600, landscape.
  ```

각 섹션은 이미지가 생성되어 `src/web/assets/uniform-customizer/`에 들어갈 때마다 "미구현"을 "완료"로 바꿔서 진행 상황을 표시할 것.
