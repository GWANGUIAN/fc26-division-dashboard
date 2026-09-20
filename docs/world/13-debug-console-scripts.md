# 13. 브라우저 콘솔용 세이브 편집 스크립트

테스트할 때 처음부터 다시 플레이하지 않도록, 브라우저 개발자 도구 콘솔에 붙여넣어 세이브를 바로 원하는 상태로 바꾸는 스크립트 모음이다. 세이브는 `localStorage`의 `fc26-world-save-v1` 키에 JSON으로 들어 있다([01 §7](01-concept-and-architecture.md)).

> 이 문서의 스크립트는 `src/web/world/state/consoleScripts.test.ts`가 그대로 읽어 실행해서, 저장 형식·미션 id가 바뀌어 스크립트가 어긋나면 테스트가 실패한다. 스크립트를 고치면 이 파일의 코드 블록만 고치면 된다.

## 사용 순서

1. **월드 창을 닫는다.** 월드가 열려 있으면 5초마다 자동 저장이 돌면서 콘솔로 바꾼 세이브를 덮어쓴다. 대시보드 화면(월드가 열려 있지 않은 상태)에서 실행한다.
2. 개발자 도구(`F12`) → **Console** 탭에 아래 스크립트를 붙여넣고 Enter. Chrome이 붙여넣기를 막으면 콘솔에 `allow pasting`을 먼저 입력한 뒤 다시 붙여넣는다.
3. 성공 메시지가 나오면 월드를 열고 **이어하기**를 누른다. (실행 전 세이브는 `fc26-world-save-v1-backup` 키에 남는다.)
4. 세이브가 없으면(캐릭터를 아직 안 골랐으면) 스크립트가 오류 메시지를 띄우고 아무것도 바꾸지 않는다. 월드에서 캐릭터를 고르고 프롤로그를 끝낸 뒤 다시 실행한다.

## 1. 결전만 남은 상태로 만들기

지금 고른 캐릭터 기준으로 다음 상태가 된다.

- 튜토리얼(`m-00`, `m-01`)과 메인 미션 10개(본인 미션 제외)가 모두 **완료**, 잔디 조각 **10/10**, 지도 전체 복원
- 감독 보고 미션 `m-89-director-report`(결전 준비) 완료 → **스타디움 개방**, 감독의 진행 대화(3·6·9) 확인 처리
- 결전 미션 `m-90-finale`(제초동 결전)은 **처음 상태**(수락 가능). 이미 결전·엔딩을 본 세이브라면 결전과 엔딩 플래그를 되돌린다.
- 위치, 수집한 아이템, 오락실 기록, 일일 기록은 그대로 둔다.

<!-- script: finale -->
```js
(() => {
  const KEY = "fc26-world-save-v1";
  const raw = localStorage.getItem(KEY);
  if (!raw) return console.error("세이브가 없습니다. 월드에서 캐릭터를 고르고 프롤로그를 끝낸 뒤 다시 실행하세요.");
  let save;
  try { save = JSON.parse(raw); } catch { return console.error("세이브를 읽을 수 없습니다."); }
  if (!save || !save.player) return console.error("캐릭터를 아직 고르지 않은 세이브입니다.");

  // 되돌릴 수 있게 실행 전 세이브를 남긴다.
  localStorage.setItem(KEY + "-backup", raw);

  // 메인 미션 11개(id → 의뢰인). 캐릭터 본인의 미션은 그 캐릭터에게 없다.
  const MAIN = {
    "m-doormomo-sum10": "doormomo",
    "m-sjh4018-kickups": "sjh4018",
    "m-kaksjak0730-freekick": "kaksjak0730",
    "m-janine95kim-cardmatch": "janine95kim",
    "m-haepalin-lanterns": "haepalin",
    "m-ju010228-kickgoals": "ju010228",
    "m-lina0108-card-lowq": "lina0108",
    "m-hachi97-talkchain": "hachi97",
    "m-bboringirl-card-retro": "bboringirl",
    "m-tleod1818-delivery": "tleod1818",
    "m-tdnlamuron-conerun": "tdnlamuron",
  };

  const missions = { ...save.missions };
  const complete = (id) => { missions[id] = { ...missions[id], status: "completed" }; };
  complete("m-00-hello");
  complete("m-01-mycard");
  let shards = 0;
  for (const [id, giver] of Object.entries(MAIN)) {
    if (giver === save.player) { delete missions[id]; continue; }
    complete(id);
    shards++;
  }
  complete("m-89-director-report");
  delete missions["m-90-finale"];

  const flags = { ...save.flags };
  for (const name of ["finale-won", "ending-seen", "area-weed-open", "weed-restored"]) delete flags[name];
  for (const name of ["main-open", "stadium-open", "beat-3", "beat-6", "beat-9", "badge:shard-5", "badge:shard-10"]) flags[name] = true;

  localStorage.setItem(KEY, JSON.stringify({ ...save, missions, shards, flags, coachDone: true }));
  console.log(`완료: 잔디 조각 ${shards}/10, 스타디움 개방. 월드를 열고 이어하기 → 스타디움의 심판(또는 제초왕)에게 말을 거세요.`);
})();
```

결전 진행은 스타디움에서 한다: 맵 중앙 아래의 **잔디동 스타디움**(문은 남쪽)으로 들어가 심판이나 제초왕에게 말을 걸면 "결전을 시작한다"가 나온다.

## 2. 결전 3라운드만 남기기 (1·2라운드 클리어 + 황금 공 12개)

§1의 준비 상태에 더해 **결전을 수락하고 1·2라운드를 클리어한 상태**로 만든다. 마지막 3라운드(**카드 짝 맞추기, 17턴 이하**)와 황금 공 선택지(12개로 승리)를 바로 시험할 수 있다.

- 튜토리얼·메인 미션 10개 완료, 잔디 조각 **10/10**, 스타디움 개방, 감독의 진행 대화 처리(§1과 같음)
- `m-90-finale`: **진행 중, 2라운드까지 클리어**(`progress.round = 2`). 심판이나 제초왕에게 말을 걸면 3라운드 안내가 나온다.
- 황금 공은 `gb-01`~`gb-12` **정확히 12개**를 가진 상태로 맞춘다(그 외 황금 공 기록은 지우고, 랜턴 같은 다른 수집품은 그대로 둔다). 황금 공을 쓰지 않은 상태라 3라운드에서 "황금 공 12개로 승리"를 고를 수 있다.
- 결전·엔딩 플래그(`finale-won`, `ending-seen` 등)는 되돌린다. 위치, 오락실 기록, 일일 기록은 그대로 둔다. 이미 결전이 진행 중이었다면 시작 시각(`startedAt`)만 유지하고 진행도는 2라운드로 덮어쓴다.

<!-- script: round3 -->
```js
(() => {
  const KEY = "fc26-world-save-v1";
  const BALLS = 12;
  const CLEARED_ROUNDS = 2;
  const raw = localStorage.getItem(KEY);
  if (!raw) return console.error("세이브가 없습니다. 월드에서 캐릭터를 고르고 프롤로그를 끝낸 뒤 다시 실행하세요.");
  let save;
  try { save = JSON.parse(raw); } catch { return console.error("세이브를 읽을 수 없습니다."); }
  if (!save || !save.player) return console.error("캐릭터를 아직 고르지 않은 세이브입니다.");

  // 되돌릴 수 있게 실행 전 세이브를 남긴다.
  localStorage.setItem(KEY + "-backup", raw);

  // 메인 미션 11개(id → 의뢰인). 캐릭터 본인의 미션은 그 캐릭터에게 없다.
  const MAIN = {
    "m-doormomo-sum10": "doormomo",
    "m-sjh4018-kickups": "sjh4018",
    "m-kaksjak0730-freekick": "kaksjak0730",
    "m-janine95kim-cardmatch": "janine95kim",
    "m-haepalin-lanterns": "haepalin",
    "m-ju010228-kickgoals": "ju010228",
    "m-lina0108-card-lowq": "lina0108",
    "m-hachi97-talkchain": "hachi97",
    "m-bboringirl-card-retro": "bboringirl",
    "m-tleod1818-delivery": "tleod1818",
    "m-tdnlamuron-conerun": "tdnlamuron",
  };

  const missions = { ...save.missions };
  const complete = (id) => { missions[id] = { ...missions[id], status: "completed" }; };
  complete("m-00-hello");
  complete("m-01-mycard");
  let shards = 0;
  for (const [id, giver] of Object.entries(MAIN)) {
    if (giver === save.player) { delete missions[id]; continue; }
    complete(id);
    shards++;
  }
  complete("m-89-director-report");

  // 결전: 수락한 뒤 1·2라운드까지 클리어. 황금 공으로 통과한 기록(balls)은 남기지 않는다.
  missions["m-90-finale"] = {
    status: "active",
    startedAt: (missions["m-90-finale"] && missions["m-90-finale"].startedAt) || Date.now(),
    progress: { round: CLEARED_ROUNDS },
  };

  const flags = { ...save.flags };
  for (const name of ["finale-won", "ending-seen", "area-weed-open", "weed-restored"]) delete flags[name];
  for (const name of ["main-open", "stadium-open", "beat-3", "beat-6", "beat-9", "badge:shard-5", "badge:shard-10"]) flags[name] = true;

  // 황금 공은 gb-01 ~ gb-12 정확히 12개. 다른 수집품(해파리 랜턴 등)은 그대로 둔다.
  const ids = Array.from({ length: BALLS }, (_, i) => "gb-" + String(i + 1).padStart(2, "0"));
  const collected = [...new Set([...(save.collected || []).filter((id) => !/^gb-\d+$/.test(id)), ...ids])];

  localStorage.setItem(KEY, JSON.stringify({ ...save, missions, shards, flags, collected, coachDone: true }));
  console.log(`완료: 결전 ${CLEARED_ROUNDS}라운드 클리어, 황금 공 ${BALLS}개. 월드를 열고 이어하기 → 스타디움의 심판(또는 제초왕)에게 말을 거세요. 남은 것: 3라운드(카드 짝 맞추기 17턴 이하).`);
})();
```

## 3. (선택) 황금 공 12개 지급

결전의 "황금 공 12개로 승리" 선택지를 시험할 때 쓴다. 이미 가진 공은 그대로 두고 `gb-01`~`gb-12`를 채운다(월드에 있는 공은 먹은 것으로 처리되어 사라진다). 공 개수는 `N`만 바꾸면 된다. 월드를 닫은 상태에서 실행한다.

<!-- script: balls -->
```js
(() => {
  const KEY = "fc26-world-save-v1";
  const N = 12;
  const raw = localStorage.getItem(KEY);
  if (!raw) return console.error("세이브가 없습니다.");
  const save = JSON.parse(raw);
  localStorage.setItem(KEY + "-backup", raw);
  const ids = Array.from({ length: N }, (_, i) => "gb-" + String(i + 1).padStart(2, "0"));
  save.collected = [...new Set([...(save.collected || []), ...ids])];
  localStorage.setItem(KEY, JSON.stringify(save));
  console.log(`황금 공 ${N}개를 지급했습니다.`);
})();
```

## 4. 원래 세이브로 되돌리기

위 스크립트를 실행하기 직전의 세이브로 복원한다(가장 최근 실행 기준 한 단계만 남는다). 월드를 닫은 상태에서 실행한다.

<!-- script: restore -->
```js
(() => {
  const KEY = "fc26-world-save-v1";
  const backup = localStorage.getItem(KEY + "-backup");
  if (!backup) return console.error("되돌릴 백업이 없습니다.");
  localStorage.setItem(KEY, backup);
  console.log("실행 전 세이브로 되돌렸습니다.");
})();
```

## 참고

- 세이브는 브라우저·도메인마다 따로 저장된다. 배포 사이트와 로컬 개발 서버는 서로 다른 세이브를 쓰므로, 시험하려는 주소의 콘솔에서 실행해야 한다.
- 위 스크립트는 세이브 형식(`schemaVersion`)을 바꾸지 않는다. 형식이 바뀌면 [01 §7](01-concept-and-architecture.md)의 마이그레이션을 따르고 이 문서와 테스트를 갱신한다.
- 코드 안에서 같은 일을 하려면 `src/web/world/state/debugTools.ts`의 `debugPrepareFinale`(조각 10개·스타디움 개방)을 쓴다. 콘솔 스크립트는 여기에 감독 보고 미션 완료와 진행 대화 처리, 엔딩 되돌리기를 더한 것이다.
