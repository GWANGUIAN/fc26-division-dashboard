export interface WakgoodNoteEntry {
  notes: string[];
  /**
   * SOOP VOD 다시보기 링크. 특정 구간(그 선수 차례)부터 바로 재생되도록
   * 타임스탬프가 포함된 URL을 그대로 넣으면 된다.
   */
  vodUrl?: string;
}

/**
 * 9/4 2차 평가 다시보기 VOD (잔디동 2차 테스트 분석 새벽반). change_second
 * 쿼리로 해당 초부터 바로 재생된다 — SOOP 공유하기 다이얼로그의
 * "OO:OO:OO부터 재생 시작" 체크박스가 만드는 링크와 동일한 형식.
 */
const NOTE_VOD_BASE_URL = "https://vod.sooplive.com/player/206248931";
const noteVodUrl = (seconds: number) =>
  `${NOTE_VOD_BASE_URL}?change_second=${seconds}`;

/**
 * 우왁굳이 1차 합격자 개개인에 대해 남긴 평가 메모 (+ 다시보기 링크).
 * roster.yaml의 slug(= StreamerRecord.id)를 키로 사용한다.
 */
export const WAKGOOD_NOTES: Record<string, WakgoodNoteEntry> = {
  ditosak: {
    notes: [
      "볼키핑 가능",
      "WF에서 볼처리 느림(패스길 시야 아쉽)",
      "오프더볼 무난",
    ],
    vodUrl: noteVodUrl(142), // 02:22
  }, //오슈이
  sjh4018: {
    notes: ["오프더볼 좋음", "패스 좋음", "수비 좋음"],
    vodUrl: noteVodUrl(981), // 16:21
  }, //핑구
  ddalgishoux: {
    notes: [
      "공격성 있고 온더볼에서 슈팅 능력",
      "오프더볼 bad",
      "패스, 시야 bad",
    ],
    vodUrl: noteVodUrl(1897), // 31:37
  }, // 딸기슈몽
  esoj001: {
    notes: ["성장 필요", "RT 무조건 누르고 있는 습관"],
    vodUrl: noteVodUrl(3088), // 00:51:28
  }, // 도이지
  tleod1818: {
    notes: ["초보."],
    vodUrl: noteVodUrl(3740), // 01:02:20
  }, // 빙밍_
  janine95kim: {
    notes: ["(넘어감)"],
    vodUrl: noteVodUrl(4359), // 01:12:39
  }, // 재닌
  been11060: {
    notes: ["오프더볼 낫배드", "로빙스루 없음"],
    vodUrl: noteVodUrl(4362), // 01:12:42
  }, // 오구
  lina0108: {
    notes: [
      "오버래핑 오프더볼 좋음",
      "볼배급 괜찮은데 너무 약하게 참",
      "전방 수비 리스크 너무큼. 양학 용.",
      "화면에 자기 캐릭터 없을때 위치선정 못함.",
      "역습에 뒷공간 다털림.",
      "그럼에도 불구하고 흥미로운 선수",
    ],
    vodUrl: noteVodUrl(5064), // 01:24:24
  }, // 리냐_LINYA
  hobal115end: {
    notes: ["오프더볼 좋음. 로빙스로도 장착.", "잘 풀리는 경기데이터 부족"],
    vodUrl: noteVodUrl(6443), // 01:47:23
  }, // 호발☆
  sircharlee: {
    notes: [
      "위치 선정이 애매함..",
      "뭔가 열심히 극 수비적으로 하긴하는데 막 크게 도움은 안되는 느낌스.",
      "커버 가능. 조금 과한 커버성향.",
    ],
    vodUrl: noteVodUrl(7268), // 02:01:08
  }, // 찰리씨
  kur0ch4t: {
    notes: [
      "상당히 저돌적이고 무조건 뒷공간만 파는 성향",
      "(장점도 많은데 단점도 많음)",
      "드리븐 패스 가능",
      "볼 배급 무난",
    ],
    vodUrl: noteVodUrl(8193), // 02:16:33
  }, // 쿠로샤
  dokkhye0000: { notes: [] }, // 독고혜지
  kirababy2: { notes: [] }, // 유키라
  haepalin: { notes: [] }, // 해파린~
  alice427: { notes: [] }, // 미르_MIR
  kaksjak0730: { notes: [] }, // 한결___
  y0unggam: { notes: [] }, // 영감__
  ttu0221: { notes: [] }, // 흠냥b
  nsnowthemoon: { notes: [] }, // 설빈달
  sookbong777: { notes: [] }, // 숙봉이
  // 9/5 (ST)
  gofl2237: { notes: [] }, // 해리
  yourdarky: { notes: [] }, // 다키_
  // 9/5 (WF)
  nlsb9718: { notes: [] }, // 판다비♥
  tdnlamuron: { notes: [] }, // 다시바
  chebi2: { notes: [] }, // 체비
  // 9/5 (RW)
  aryenne: { notes: [] }, // 이부키에사
  // 9/5 (CM)
  bboringirl: { notes: [] }, // 뽀린걸
  zzimio3o: { notes: [] }, // 찌미
  nanamoon777: {
    notes: [
      "활동량 매우 좋고 수비가담 매우 좋음.",
      "공격성 매우 좋고 볼키핑 가능. 패스 바로바로 뿌려줌.",
      "접중각 볼줄앎.",
      "다만 경기장 전체에서 좌우무빙만 반복하는 스타일이라 수비력이 강한 팀을 만났을때 모든 스탯이 하락할 수 있는 스타일로 보임.",
    ],
  }, // 나나문
  doormomo: { notes: ["잘했음"] }, //문모모
  // 9/5 (CDM)
  villlo: {
    notes: [
      "위치선정 좋음.",
      "볼배급 괜찮음.",
      "강한 압박 상황에서의 배급 미스는 있음.",
      "빠른 속공 시 흐름따라 패스하는 경향",
    ],
  }, // 왜냐니
  // 9/5 (FB)
  secretto486: { notes: ["위치선정이 너무 안좋음...", "패스도 급합니다."] }, // 비밀소녀♥
  danchu17: { notes: [] }, // 단츄♪
  etwo22: { notes: [] }, // 이투__
  // 9/5 (CB)
  leuni158: { notes: [] }, // 르니
  // 9/7 (ST)
  ju010228: { notes: [] }, // 쥬멩이
  habee511: { notes: [] }, // 망야_
  // 9/7 (WF)
  jejong5: { notes: [] }, // 제이제이잉
  hachi97: { notes: [] }, // 하치_HACHI
  cjstkdbsl3: { notes: [] }, // 깡담비
  hikicomoring: { notes: [] }, // 히키☆
  // 9/7 (FB)
  secymyong: { notes: [] }, // 묭씨
  whiteone325: { notes: [] }, // 난워니-_-+
};

export function getWakgoodNote(
  streamerId: string,
): WakgoodNoteEntry | undefined {
  return WAKGOOD_NOTES[streamerId];
}

/** Sentinel note body meaning "평가를 의도적으로 건너뜀" — rendered without a bullet, in its own style. */
export const WAKGOOD_NOTE_SKIPPED = "(넘어감)";

export function isSkippedWakgoodNote(notes: string[] | undefined): boolean {
  return notes?.length === 1 && notes[0] === WAKGOOD_NOTE_SKIPPED;
}
