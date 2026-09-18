# 축구공 합 10 미니게임 — 에셋 준비 가이드

`축구공 합 10` 미니게임에 사용하는 이미지와 오디오의 파일명 규칙이다. 게임 보드는 스크린샷의 17열×10행 기준을 따라, 빈칸 없이 총 170개 공을 채운다. 파일을 아래 위치와 이름으로 준비하면 구현이 자동으로 연결한다.

## 축구공 이미지

| 파일명 | 저장 위치 | 용도 |
| --- | --- | --- |
| `soccer-sum10-ball.webp` | `public/` | 숫자를 캔버스에 얹어 그리는 기본 축구공 |
| `soccer-sum10-icon.webp` | `public/` | 플로팅 버튼 및 모달 제목 왼쪽 아이콘 |

사용자가 제공한 다운로드 폴더의 `game-soccer-ball.webp`를 위 이름으로 복사한다. 배경이 투명하거나 단색일수록 숫자와 선택 글로우가 또렷하다.

## 오디오

| 파일명 | 저장 위치 | 용도 | 검색 키워드 (한글 / 영어) |
| --- | --- | --- | --- |
| `soccer-sum10-bgm.mp3` | `public/` | 게임 진행 중 반복되는 BGM | `경쾌한 축구 경기장 게임 BGM 루프`, `upbeat football stadium game music loop` |
| `soccer-sum10-start.mp3` | `public/sfxes/` | 시작 버튼 클릭, 경기 시작 휘슬 | `축구 경기 시작 휘슬 효과음`, `football kickoff whistle sound effect` |
| `soccer-sum10-clear.mp3` | `public/sfxes/` | 합계 10 성공 및 공 제거 | `축구공 골망 성공 짧은 효과음`, `football net swish success ui sound` |
| `soccer-sum10-invalid.mp3` | `public/sfxes/` | 합계가 10이 아닌 선택 | `짧은 실패 삑 소리 게임 UI`, `soft game ui error blip` |
| `soccer-sum10-timeup.mp3` | `public/sfxes/` | 1분 시간 종료 | `축구 경기 종료 휘슬 효과음`, `football full time whistle sound effect` |
| `soccer-sum10-complete.mp3` | `public/sfxes/` | 보드 전체 제거 | `축구 관중 환호 짧은 성공 효과음`, `football crowd cheer victory stinger` |

- BGM은 끊김 없이 반복 가능한 60~120초 길이의 무보컬 트랙을 권장한다.
- 효과음은 다른 UI 효과음을 덮지 않도록 0.2~1.5초 길이의 짧은 파일을 권장한다.
- 사용자는 모달에서 BGM과 효과음을 각각 켜고 끌 수 있고, BGM과 효과음 볼륨을 조절할 수 있다.

## 배경 이미지

| 파일명 | 저장 위치 | 권장 규격 |
| --- | --- | --- |
| `soccer-sum10-background.webp` | `public/` | 1600×900 이상, 16:9 |

아래 프롬프트로 생성한다. 공과 숫자가 읽혀야 하므로 중앙 플레이 영역에는 강한 조명·선수·큰 로고를 두지 않는다.

```text
A polished top-down football pitch background for a casual number puzzle game,
deep emerald grass with subtle mowing stripes and faint tactical field markings,
soft stadium floodlight glow around the outer edges, dark navy vignette for strong
contrast, a calm uncluttered center area for a grid of soccer balls, premium modern
football game interface art, energetic but not busy, no players, no ball, no text,
no logos, no scoreboard, no watermark, landscape 16:9.
```

배경 에셋이 아직 없을 때에도 게임은 CSS의 잔디색 그라데이션과 필드 라인으로 정상 표시된다.
