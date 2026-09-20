# 15. ON AIR 전광판 — 멤버 집 문 위의 방송 표시

멤버 11명의 집 문 위에 걸린 **ON AIR 전광판**. 그 멤버가 SOOP에서 방송 중이면 불이 켜지고(붉은 글자·노란 전구·경광등 + 벽에 번지는 붉은 빛), 아니면 꺼져 있다. **전광판을 클릭하면 새 탭이 열린다** — 방송 중이면 생방송(`https://play.sooplive.com/<id>`), 꺼져 있으면 방송국(`https://www.sooplive.com/station/<id>`).

## 동작

| 항목 | 내용 |
| --- | --- |
| 대상 | `house-<id>` 11채(`WORLD_ONAIR_SOOP_IDS`). 멤버의 월드 id = SOOP id(roster.yaml) |
| 조회 | `GET /api/soop-onair` → `{ generatedAt, streamers: [{ soopId, live, broadNo? }] }`. Worker가 11명의 SOOP 플레이어 API(`live.sooplive.com/afreeca/player_live_api.php`, `CHANNEL.RESULT` 1 = 방송 중)를 병렬로 묻는다. **FC26/27 카테고리 목록이 아니라 각자의 채널**을 보므로 다른 게임을 방송해도 켜진다 |
| 캐시 | 엣지 115초. 조회에 실패한 멤버는 응답에서 빠진다("모름"이지 "꺼짐"이 아님). 전부 실패하면 502(캐시 안 함) |
| 폴링 | 브라우저 2분 간격, **월드가 열려 있고 탭이 보일 때만**. 월드를 닫으면 멈추고 다시 열면 즉시 1회. `VITE_ENABLE_SOOP_LIVE=true`일 때만(대시보드 LIVE 레일과 같은 스위치) |
| 만료 | 마지막 성공 조회가 6분(폴링 3회) 지나면 그 멤버는 꺼진 것으로 그린다 |
| 클릭 | 캔버스 클릭만(키보드 없음). 위에 마우스를 올리면 손가락 커서. 대사·패널이 입력을 잡고 있거나 화면 전환 중에는 무시. 링크는 `<a target=_blank rel="noopener noreferrer">` 클릭으로 열어 **팝업이 아닌 새 탭**이 된다 |

코드: [`src/shared/world-onair.ts`](../../src/shared/world-onair.ts)(id·URL·조회·파싱), [`src/worker.ts`](../../src/worker.ts)(`serveWorldOnAir`), [`state/onAir.ts`](../../src/web/world/state/onAir.ts)(폴링 `OnAirTracker`·링크), [`engine/onAirSign.ts`](../../src/web/world/engine/onAirSign.ts)(배치·판정·그리기).

## 배치

- **가로**: 그 집의 **입구 발판(`mat-door` 소품)의 x 가운데**. 맵 작성자가 눈으로 문 가운데에 맞춰 손으로 놓은 값이라 문 타일 가운데(`door[0]+1`)와 최대 21px 다르다(문모모 +21, 재닌 +19, 리냐 +13 …). 발판이 없으면 문 타일 가운데로 대체.
- **세로**: 문턱 행 아래 가장자리에서 **72px 위**가 전광판의 아래 가장자리(`ON_AIR_RISE = HOME_SIGN_RISE(66) + 6`). 본인 집에 뜨는 "○○의 집" 이름표(문턱 위 66~52px)보다 위라 **겹치지 않는다**. 이름표 위치를 바꾸면 `render.ts`의 `HOME_SIGN_RISE`만 고치면 전광판이 따라간다.
- **깊이**: 건물의 마지막 그릴 조각(strip) 직후에 그려서 벽과 같이 정렬된다(플레이어가 집 뒤로 가면 가려지고, 앞을 지나면 위로 보인다).
- 이름표("○○의 집")는 아직 문 타일 가운데 기준이라 발판 x와 최대 21px 어긋날 수 있다(전광판만 발판 기준). 맞추려면 `world.ts`의 `homeSign.x`도 `entranceX()`를 쓰게 하면 된다.

## 에셋

| 상태 | 원본 | 변환 결과 |
| --- | --- | --- |
| 켜짐 | `tmp/world-src/props/onair-sign-on.png` | `src/web/assets/world/props/onair-sign-on.webp` (58×33) |
| 꺼짐 | `tmp/world-src/props/onair-sign-off.png` | `src/web/assets/world/props/onair-sign-off.webp` (58×33) |

- 변환: `pnpm convert:world-art -- onair`. 생성 이미지는 **다리·받침대가 달린 독립형**이라, 벽에 다는 용도로 **보드 아래 좁아지는 행에서 자동으로 잘라** 보드+경광등만 쓴다(`boardBottomRow`). 켜짐/꺼짐은 **한 배율**로 변환돼 갈아 끼워도 흔들리지 않는다. 두 실루엣 비율이 4% 넘게 다르면 경고.
- 원본 조건: 투명 배경(꺼짐도 알파가 있어야 함), 실루엣은 두 장이 같아야 함, 그림 밖으로 번지는 후광 금지(번지는 빛은 켜졌을 때 코드가 덧그린다). 재생성 시 켜짐 그림을 수정하는 방식으로 꺼짐을 만들 것.
- 크기: 원래 72×41로 만들었다가 **0.8배(58×33)**로 줄였다. 바꾸려면 `world-art-manifest.json`의 `onair.w/h`와 `onAirSign.ts`의 `ON_AIR_FALLBACK_SIZE`를 같이 고치고 다시 변환(테스트가 둘의 일치를 검사). 폭은 **짝수**여야 그림 가운데가 정수 픽셀에 놓인다(테스트가 검사).
- 이미지가 아직 없거나 로딩에 실패하면 코드가 그린 대체 전광판(`drawFallbackSign`)이 대신 나온다.

## 조정 지점

| 바꾸고 싶은 것 | 고칠 곳 |
| --- | --- |
| 전광판 높이(문·지붕과의 거리) | `onAirSign.ts` `NAME_PLATE_GAP` (또는 집마다 다르게 하려면 `findOnAirSigns`에 오프셋 표 추가) |
| 켜졌을 때 붉은 빛 세기·번짐 | `onAirSign.ts` `drawGlow` (알파 0.2~0.3, 반경 `w*0.78`, reduced-motion이면 맥동 없음) |
| 폴링 주기·만료 | `state/onAir.ts` `ON_AIR_POLL_MS`, `ON_AIR_STALE_MS` |
| 클릭 판정 여유 | `onAirSign.ts` `HIT_PAD` |

## 확인 (배포 후)

1. 방송 중인 멤버 집(예: 하치·리냐·해파린)의 전광판이 켜져 있고 붉은 빛이 은은하게 맥동, 나머지는 꺼져 있다. 2분 안에 방송 상태 변화가 반영된다.
2. 11채 모두 전광판 가운데가 발판 가운데와 같은 세로선 위에 있고, 본인 집의 "○○의 집" 이름표와 겹치지 않는다.
3. 켜진 전광판 클릭 → 그 멤버 생방송이 **새 탭**, 꺼진 전광판 클릭 → 방송국이 **새 탭**. 손가락 커서가 뜬다. 대사 중·메뉴 중에는 클릭해도 안 열린다.
4. 월드를 닫으면 `/api/soop-onair` 요청이 멈춘다(Network 탭). 로컬(`.env.local`의 `VITE_ENABLE_SOOP_LIVE=true`)에서는 dev 프록시가 운영 도메인으로 가므로, 이 엔드포인트가 배포되기 전에는 전부 꺼진 채로 보인다.
