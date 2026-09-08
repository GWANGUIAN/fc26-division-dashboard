/**
 * 하나의 평가 회차(또는 포지션)에 해당하는 메모 묶음.
 * 같은 선수를 여러 번(1트/2트) 또는 여러 포지션(FB/CB 등)으로 평가한 경우
 * 각각을 별도 그룹으로 나눠서 라벨과 함께 보여준다.
 */
export interface WakgoodNoteGroup {
  /** 그룹 제목 (예: "1트", "2트", "FB", "CB"). 없으면 라벨 없이 메모만 표시. */
  label?: string;
  notes: string[];
}

export interface WakgoodNoteEntry {
  noteGroups: WakgoodNoteGroup[];
  /**
   * SOOP VOD 다시보기 링크(들). 특정 구간(그 선수 차례)부터 바로 재생되도록
   * 타임스탬프가 포함된 URL을 그대로 넣으면 된다. 두 번에 나눠서 평가받은
   * 사람은 원소 두 개(각 회차 링크)를 넣는다.
   */
  vodUrls?: string[];
  /** 이 평가를 무지개색으로 반짝이게 강조 표시할지 여부 (재미용 하이라이트). */
  fancy?: boolean;
}

/** 라벨 없이 메모 한 묶음만 있는 흔한 케이스(평가를 한 번만 받은 선수)를 짧게 쓰기 위한 헬퍼. */
function notes(...notes: string[]): WakgoodNoteGroup[] {
  return [{ notes }];
}

/**
 * 9/4 2차 평가 다시보기 VOD (잔디동 2차 테스트 분석 새벽반). change_second
 * 쿼리로 해당 초부터 바로 재생된다 — SOOP 공유하기 다이얼로그의
 * "OO:OO:OO부터 재생 시작" 체크박스가 만드는 링크와 동일한 형식.
 */
const NOTE_VOD_BASE_URL = "https://vod.sooplive.com/player/206248931";
const noteVodUrl = (seconds: number) =>
  `${NOTE_VOD_BASE_URL}?change_second=${seconds}`;

/** 잔디동 2차 테스트 분석 • 평가 2 다시보기 VOD. */
const NOTE_VOD_BASE_URL_2 = "https://vod.sooplive.com/player/206348423";
const noteVodUrl2 = (seconds: number) =>
  `${NOTE_VOD_BASE_URL_2}?change_second=${seconds}`;

/** 잔디동 2차 테스트 분석 • 평가 3 다시보기 VOD. */
const NOTE_VOD_BASE_URL_3 = "https://vod.sooplive.com/player/206393463";
const noteVodUrl3 = (seconds: number) =>
  `${NOTE_VOD_BASE_URL_3}?change_second=${seconds}`;

/** 잔디동 2차 테스트 분석 • 평가 4 다시보기 VOD. */
const NOTE_VOD_BASE_URL_4 = "https://vod.sooplive.com/player/206531121";
const noteVodUrl4 = (seconds: number) =>
  `${NOTE_VOD_BASE_URL_4}?change_second=${seconds}`;

/**
 * 우왁굳이 1차 합격자 개개인에 대해 남긴 평가 메모 (+ 다시보기 링크).
 * roster.yaml의 slug(= StreamerRecord.id)를 키로 사용한다.
 */
export const WAKGOOD_NOTES: Record<string, WakgoodNoteEntry> = {
  ditosak: {
    noteGroups: notes(
      "볼키핑 가능",
      "WF에서 볼처리 느림(패스길 시야 아쉽)",
      "오프더볼 무난",
    ),
    vodUrls: [noteVodUrl(142)], // 02:22
  }, //오슈이
  sjh4018: {
    noteGroups: notes("오프더볼 좋음", "패스 좋음", "수비 좋음"),
    vodUrls: [noteVodUrl(981)], // 16:21
  }, //핑구
  ddalgishoux: {
    noteGroups: notes(
      "공격성 있고 온더볼에서 슈팅 능력",
      "오프더볼 bad",
      "패스, 시야 bad",
    ),
    vodUrls: [noteVodUrl(1897)], // 31:37
  }, // 딸기슈몽
  esoj001: {
    noteGroups: notes("성장 필요", "RT 무조건 누르고 있는 습관"),
    vodUrls: [noteVodUrl(3088)], // 00:51:28
  }, // 도이지
  tleod1818: {
    noteGroups: notes("초보."),
    vodUrls: [noteVodUrl(3740)], // 01:02:20
  }, // 빙밍_
  janine95kim: {
    noteGroups: notes("(넘어감)"),
    vodUrls: [noteVodUrl(4359)], // 01:12:39
  }, // 재닌
  been11060: {
    noteGroups: notes("오프더볼 낫배드", "로빙스루 없음"),
    vodUrls: [noteVodUrl(4362)], // 01:12:42
  }, // 오구
  lina0108: {
    noteGroups: notes(
      "오버래핑 오프더볼 좋음",
      "볼배급 괜찮은데 너무 약하게 참",
      "전방 수비 리스크 너무큼. 양학 용.",
      "화면에 자기 캐릭터 없을때 위치선정 못함.",
      "역습에 뒷공간 다털림. 수비 그냥 못함. 선수 너무 크고 무거운거 씀.",
      "그럼에도 불구하고 흥미로운 선수. 축구를 잘함",
    ),
    // 9/4 1차 평가 + 9/5 "평가 2"에서 재평가(버튜버 풀백 1황 / 총평 추가)
    vodUrls: [noteVodUrl(5064), noteVodUrl2(16240)], // 01:24:24, 04:30:40
  }, // 리냐_LINYA
  hobal115end: {
    noteGroups: notes(
      "오프더볼 좋음. 로빙스로도 장착.",
      "잘 풀리는 경기데이터 부족",
    ),
    vodUrls: [noteVodUrl(6443)], // 01:47:23
  }, // 호발☆
  sircharlee: {
    noteGroups: notes(
      "위치 선정이 애매함..",
      "뭔가 열심히 극 수비적으로 하긴하는데 막 크게 도움은 안되는 느낌스.",
      "커버 가능. 조금 과한 커버성향.",
    ),
    vodUrls: [noteVodUrl(7268)], // 02:01:08
  }, // 찰리씨
  kur0ch4t: {
    noteGroups: notes(
      "상당히 저돌적이고 무조건 뒷공간만 파는 성향",
      "(장점도 많은데 단점도 많음)",
      "드리븐 패스 가능",
      "볼 배급 무난",
    ),
    vodUrls: [noteVodUrl(8193)], // 02:16:33
  }, // 쿠로샤
  dokkhye0000: {
    noteGroups: notes(
      "코너킥 상황에서 수비로 돌아가지 않는 경향",
      "드리븐 전방 패스 무난",
      "수비 위치선정 불안",
      "몸 앞으로 쏠리는 현상 + 서포팅할때 너무 접근",
    ),
    vodUrls: [noteVodUrl3(1882)], // 31:22
  }, // 독고혜지
  kirababy2: {
    noteGroups: notes(
      "위치선정 꽤 괜찮음",
      "패스성공률 100%임(그런데 팀을 죽이는 패스도 많음)",
      "패스를 매우 신중하게 함. 백패스 많음.",
      "캐릭터 컨트롤이 아직 미숙해서 180도 터닝패스 + 걷다가 패스, 급하게 패스 등 불안요소 많음 그래도 조작 익숙해지면 축구지능 있어보이긴함",
    ),
    vodUrls: [noteVodUrl2(16945)], // 04:42:25
  }, // 유키라
  haepalin: {
    noteGroups: notes(
      "1:1 수비력, 커버력 좋음. 다만 1:1상황에서 무조건 슛수비 하는 경향있음",
      "상대 사이드로 몰 시 중앙 고목나무 못하고 무조건 인터셋트 하려 공쪽으로 쏠려서 크로스에서 취약점 있음.(가장 큰 단점)",
      "위치선정 좋긴한데 좀더 확실히 확확 빼주면 좋은데 살짝 걷는 성향",
    ),
    vodUrls: [noteVodUrl3(2842)], // 00:47:22
  }, // 해파린~
  alice427: {
    noteGroups: notes(
      "얼크각을 보는 선수가 미르님이었을 줄이야... 그런데 너무 급하게 바로 논스톱으로만 올려서 크로스의 질이 좋지 않음..",
      "천천히 잘 올렸으면 좋았을텐데 아쉽스",
      "생각보다 안전하게 패스를 잘 돌림. 그리고 노답 백패스 안하고 크로스도 잘 하심.",
      "그런데 좋은 기회가 왔을때도 기회인지 모르고 그냥 패스 돌리거나 크로스해버림.(본인이 돌파해서 슛각 나오는걸 못봄)",
      "전체적으로 컨트롤 초보이슈가 있음. 뚝딱이슈.",
    ),
    vodUrls: [noteVodUrl3(3859)], // 01:04:19
  }, // 미르_MIR
  kaksjak0730: {
    noteGroups: notes(
      "너무 모범생처럼 나는 LCM이니까 LCM의 위치에만 있는 플레이.",
      "스루패스각에서 너무 일반 패스같은게 많이 나감.",
      "접중 잘하시는걸로 아는데 접중할 상황 안나오는 경기맞이하니까 사이드를 못감...",
      "잘하시는 걸로 아는데 이번 소스에는 '연결'만 한 느낌스...",
    ),
    vodUrls: [noteVodUrl3(4636)], // 01:17:16
  }, // 한결___
  y0unggam: {
    noteGroups: notes(
      "소스 부족. 한데 일단 크게 못한건 없어서. 재시험 하면 좋을듯.",
    ),
    vodUrls: [noteVodUrl3(6306)], // 01:45:06
  }, // 영감__
  ttu0221: {
    noteGroups: notes(
      "그냥 무난~하신데.. 수비할때 어깨를 못넣고 대충 뒤로 빼기만 해서 디테일한 스루나 로빙에 털릴 가능성 있음.",
      "빌드업 가담력 없음. 뒤로빼서 안전수비.",
      "1:1 수비력은 소스가 부족한데 무난한듯",
    ),
    vodUrls: [noteVodUrl3(6914)], // 01:55:14
  }, // 흠냥b
  nsnowthemoon: {
    noteGroups: notes(
      "너무 우리팀을 도와주려는 성향이 강해서 5백을 만들어버려서 상대 중원이 너무 널널해짐",
      "세트피스때 몸 앞으로 쏠리는 성향",
      "컨트롤은 날렵하신데 막상 커버를 못친게 꽤 많이 나와서 아쉽스",
    ),
    vodUrls: [noteVodUrl3(7543)], // 02:05:43
  }, // 설빈달
  sookbong777: {
    noteGroups: notes(
      "쇄도력은 좋은데 살짝 쇄도 원툴 느낌스. 나나문에서 수비가담 살짝 덜하고 쇄도 살짝 덜하는 느낌",
      "패스는 그냥 무난한 느낌스. 뒷대각은 잘 못보고 평범한 일반패스 예측범위안에서 패스",
    ),
    vodUrls: [noteVodUrl3(8689)], // 02:24:49
  }, // 숙봉이
  // 9/5 (ST)
  gofl2237: {
    noteGroups: notes(
      "소스없음. 헤딩 위치선정 좋아보임. 무난한 느낌스 일단.",
      "백패스 안내줌",
    ),
    vodUrls: [noteVodUrl2(11470)], // 03:11:10
  }, // 해리
  yourdarky: {
    noteGroups: notes(
      "소스부족. 움직임 빠르고 바로바로 슈팅각 보려고함",
      "퍼스트 터치? 잘모르겠음",
      "수비 가담 많이 하고 위치선정 괜찮은 것 같음.",
      "라인브레이킹 좋았음",
    ),
    vodUrls: [noteVodUrl2(18857)], // 05:14:17
  }, // 다키_
  // 9/5 (WF)
  nlsb9718: {
    noteGroups: notes(
      "완벽한 크로스 상황을 너무.. 놓침",
      "기본실력은 있어보입니다.",
    ),
    vodUrls: [noteVodUrl2(6445)], // 01:47:25
  }, // 판다비♥
  tdnlamuron: {
    noteGroups: notes(
      "윙어로써의 폭 조절 움직임이 괜찮음",
      "기본실력은 있어보입니다.",
      "맛있는 공간 주어졌을때도 접어버림...(돌파를 끝까지 못함)",
    ),
    vodUrls: [noteVodUrl2(7884)], // 02:11:24
  }, // 다시바
  chebi2: {
    noteGroups: notes(
      "쇄도 타이밍이 너무 빠름 혹은 안맞음. 혹은 쇄도 해야할때 안함. 혹은 폭이 안맞음.",
      "그래도 패널티 박스로 도움줘야 할 때 주는 경우 있음.",
    ),
    vodUrls: [noteVodUrl2(5481)], // 01:31:21
  }, // 체비
  // 9/5 (RW)
  aryenne: {
    noteGroups: notes(
      "드리블 되고 개인기도 쓰시는데 오프사이드를 너무 많이 걸림.",
      "쇄도하는 중미에게 주는 패스가 너무 많이 끊김. 크로스 없음.",
      "접는 컨트롤 볼키핑은 괜찮아보임.",
      "뭔가 움직임에서 포텐은 보이는데 현재로써는 아쉬운느낌스",
    ),
    vodUrls: [noteVodUrl2(13804)], // 03:50:04
  }, // 이부키에사
  // 9/5 (CM)
  bboringirl: {
    noteGroups: [
      {
        label: "1트",
        notes: [
          "많이 불쌍했지만... 이겨내지 못했다.. 몇안되는 기회를... 버렸다.",
        ],
      },
      {
        label: "2트",
        notes: [
          "볼키핑이나 온더볼은 나쁘지 않아 근데 오프더볼이 아직은 1. 나는 LCM이니까 + 2. 우리팀 도와주러 열심히 띄어다니는..? 느낌스",
          "뭔가 내가 통나무를 들어야돼라는 생각으로 뛰고 있는 선수라는 생각이듬",
          "이번에는 하프 안파고 사이드좀 뿌리고 수미 역할을 좀 하신듯 함.",
          "생각보다 뒤에서 대기하면서 플레이하심.",
        ],
      },
    ],
    vodUrls: [noteVodUrl2(9101)], // 02:31:41
  }, // 뽀린걸
  zzimio3o: {
    noteGroups: notes(
      "드리블 볼키핑 가능",
      "앞으로 갈때의 위치선정은 좋음. 뒤로 빠지거나 절제할때의 위치선정 아쉽",
      "사이드 스루각을 잘 못봄. 뒤로 오는 접중 잘 못봄",
      "상대 수비수 사이 쇄도각을 잘봄. 돌파력 있음.",
    ),
    vodUrls: [noteVodUrl2(12481)], // 03:28:01
  }, // 찌미
  nanamoon777: {
    noteGroups: notes(
      "활동량 매우 좋고 수비가담 매우 좋음.",
      "공격성 매우 좋고 볼키핑 가능. 패스 바로바로 뿌려줌.",
      "접중각 볼줄앎.",
      "다만 경기장 전체에서 좌우무빙만 반복하는 스타일이라 수비력이 강한 팀을 만났을때 모든 스탯이 하락할 수 있는 스타일로 보임.",
    ),
    vodUrls: [noteVodUrl2(1131)], // 18:51, 00:53:03
  }, // 나나문
  doormomo: {
    noteGroups: notes("잘했음"),
    fancy: true,
    vodUrls: [noteVodUrl2(3183)], // 00:53:03
  }, //문모모
  // 9/5 (CDM)
  villlo: {
    noteGroups: notes(
      "위치선정 좋음.",
      "볼배급 괜찮음.",
      "강한 압박 상황에서의 배급 미스는 있음.",
      "빠른 속공 시 흐름따라 패스하는 경향",
    ),
    vodUrls: [noteVodUrl2(3970)], // 01:06:10
  }, // 왜냐니
  // 9/5 (FB)
  secretto486: {
    noteGroups: notes("위치선정이 너무 안좋음...", "패스도 급합니다."),
    vodUrls: [noteVodUrl2(4792)], // 01:19:52
  }, // 비밀소녀♥
  danchu17: {
    noteGroups: notes(
      "수비는 잘 하시는 것 같음.(패스 무난?)",
      "그런데 위치선정과 움직임이 너무나 안좋고 무조건 상대 선수에게 붙어있으려는 성향 때문에 우리팀이 절대 패스를 줄 수가 없음...",
    ),
    vodUrls: [noteVodUrl2(14355)], // 03:59:15
  }, // 단츄♪
  etwo22: {
    noteGroups: [
      {
        label: "1트",
        notes: [
          "앞으로 나가서 수비하는 성향이 너무 강해서 뒷공간이 다 털려버림스...",
          "공걱시 오버래핑 움직임도 아쉬움..",
          "공격시 뒷대각 만드는거 공부해오신 티가 나서 좋았음.",
        ],
      },
      {
        label: "2트",
        notes: [
          "뒷공간은 이제 안털리는데 공격 빌드업이 사라짐",
          "순수 수비 커버력이 아쉬움",
        ],
      },
    ],
    vodUrls: [noteVodUrl2(15461)], // 04:17:41
  }, // 이투__
  // 9/5 (CB)
  leuni158: {
    noteGroups: notes(
      "위치선정 살짝 아쉬움",
      "패스시야 살짝 아쉬움",
      "드리블...?",
      "사이드 롱볼, 걷어내기 할줄 아심.(질질끌다가 뺏기는건 없음)",
    ),
    vodUrls: [noteVodUrl2(11819)], // 03:16:59
  }, // 르니
  // 9/7 (ST)
  ju010228: {
    noteGroups: notes(
      "움직임이 굉장히 좋아보임.",
      "공간창출 하려는 움직임 + 막힐시 다른 포지션으로 바로바로 찾는 모습 좋음.",
      "침착함도 있어보이고 패스 연계도 빠르고 논스톱 리턴패스도 가능함.",
      "골넣는 기회는 안와서 소스가 살짝 더 필요하긴함",
    ),
    vodUrls: [noteVodUrl4(1548)], // 25:48
  }, // 쥬멩이
  habee511: {
    noteGroups: notes(
      "큰 캐릭으로 너무 사이드만 파는거 같긴한데 그건 둘째치고 센터에는 무징을 잘 안치시고 패스도 살짝 자세 안좋게 나가고 슛도 뭔가 이상하고.. 전체적으로 애매쓰야.. 소스가 부족하긴 한데 좋은 장면이 없었쓰야...",
    ),
  }, // 망야_
  // 9/7 (WF)
  jejong5: {
    noteGroups: notes(
      "윙포 위치선정은 괜찮음.",
      "윙포쪽에 공간있어도 못가고 횡패스나 백패스 해버림",
      "반대편 크로스각에서 헤딩이나 쇄도력 부족",
    ),
    vodUrls: [noteVodUrl4(3698)], // 01:01:38
  }, // 제이제이잉
  hachi97: {
    noteGroups: notes(
      "윙포워드인데 클랙식 윙어처럼 플레이를 해서 뒷공간 활용도가 0인 상황 그리고 우리팀 쇄도를 보지 못함.",
      "얼크를 하거나 엔드라인 활용은 잘하시고 접중도 잘 보시려고 하는듯",
    ),
    vodUrls: [noteVodUrl4(2047)], // 00:34:07
  }, // 하치_HACHI
  cjstkdbsl3: {
    noteGroups: notes(
      "오프더볼 괜찮은편이고 드리블링 가능하고 마지막에 드리블 훼이크좀 치는거 가능.",
      "접중각 살짝 아쉽스 마무리도 조금 살짝 아쉽스. 뒷공간 가끔씩 못파고듬",
    ),
    vodUrls: [noteVodUrl4(5536)], // 01:32:16
  }, // 깡담비
  hikicomoring: {
    noteGroups: notes(
      "오프더볼 움직임은 제일 좋음. 벌려야할때 오므려야할때를 정확히 알고 있음. 근데 마무리가 안되고 억접이 너무 많음.",
      "거의 100% 사이드에서 접어서 중앙 주는데 접지 않아야 할때도 무조건 접음",
    ),
    vodUrls: [noteVodUrl4(4362)], // 01:12:42
  }, // 히키☆
  // 9/7 (FB)
  secymyong: {
    noteGroups: [
      {
        label: "FB",
        notes: [
          "달리기 버튼 누르고 있고 오버래핑 없음 사이드에서만 패스함. 아직은 초보스멜스. 너무 벌리고 수비.",
        ],
      },
      {
        label: "CB",
        notes: ["수비는 무난해쓰야. 배급이 너무 평범해서 불안해쓰야."],
      },
    ],
  }, // 묭씨
  whiteone325: {
    noteGroups: notes(
      "캐릭터 조작이슈로 커버링이 미숙해서 공간을 털리거나 선수를 지나가게 하는 경향있음.",
      "뒷공간은 인지하고 로빙스루 날림.",
      "위치선정 아쉽스.. 계속 상대방 선수하고 붙어있으려는 성향.(수비걱정되서 앞으로 가지도 못하고 뒤로 빼주지도 못하는 어중간한 느낌스)",
    ),
    vodUrls: [noteVodUrl4(635)], // 10:35
  }, // 난워니-_-+
  toocats: {
    noteGroups: notes(
      "최전방 뒷공간을 잘봄. 스루도 시원시원하게 함.",
      "다만 모든 상황에서 최전방을 보는 버릇이있어 조율이나 만들어가는 느낌이 적은편.(1경기만봐서 잘 모르겠는데 알론소병일수도 있어보임.. 무조건 최전방 때리는 원툴성향 살짝보임)",
      "수비가담은 전후좌우 다 폭 넓게 하는편이나 인터셉트 후 역습을 노리는 수비를 많이 하는 편. (4백 스위칭 커버 대비)",
    ),
    vodUrls: [noteVodUrl4(6515)], // 01:48:35
  }, // 투냥츠
};

export function getWakgoodNote(
  streamerId: string,
): WakgoodNoteEntry | undefined {
  return WAKGOOD_NOTES[streamerId];
}

/** 그룹으로 나뉜 메모를 하나의 배열로 펼친다 (상태 판정, 엑셀 내보내기 등에 사용). */
export function flattenWakgoodNotes(
  noteGroups: WakgoodNoteGroup[] | undefined,
): string[] {
  return noteGroups?.flatMap((group) => group.notes) ?? [];
}

/** Sentinel note body meaning "평가를 의도적으로 건너뜀" — rendered without a bullet, in its own style. */
export const WAKGOOD_NOTE_SKIPPED = "(넘어감)";

export function isSkippedWakgoodNote(
  noteGroups: WakgoodNoteGroup[] | undefined,
): boolean {
  const flat = flattenWakgoodNotes(noteGroups);
  return flat.length === 1 && flat[0] === WAKGOOD_NOTE_SKIPPED;
}
