export interface WakgoodNoteEntry {
  notes: string[];
  /**
   * SOOP VOD 다시보기 링크. 특정 구간(그 선수 차례)부터 바로 재생되도록
   * 타임스탬프가 포함된 URL을 그대로 넣으면 된다.
   */
  vodUrl?: string;
}

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
  }, //오슈이
  sjh4018: { notes: ["오프더볼 좋음", "패스 좋음", "수비 좋음"] }, //핑구
  ddalgishoux: {
    notes: [
      "공격성 있고 온더볼에서 슈팅 능력",
      "오프더볼 bad",
      "패스, 시야 bad",
    ],
  }, // 딸기슈몽
  esoj001: { notes: ["성장 필요", "RT 무조건 누르고 있는 습관"] }, // 도이지
  tleod1818: { notes: ["초보."] }, // 빙밍_
  janine95kim: { notes: ["(넘어감)"] }, // 재닌
  been11060: { notes: ["오프더볼 낫배드", "로빙스루 없음"] }, // 오구
  lina0108: {
    notes: [
      "오버래핑 오프더볼 좋음",
      "볼배급 괜찮은데 너무 약하게 참",
      "전방 수비 리슼느 너무큼. 양학 용.",
      "화면에 자기 캐릭터 없을때 위치선정 못함.",
      "역습에 뒷공간 다털림.",
      "그럼에도 불구하고 흥미로운 선수",
    ],
  }, // 리냐_LINYA
  hobal115end: {
    notes: ["오프더볼 좋음. 로빙스로도 장착.", "잘 풀리는 경기데이터 부족"],
  }, // 호발☆
  haepalin: { notes: [] }, // 해파린~
  sircharlee: { notes: [] }, // 찰리씨
  nsnowthemoon: { notes: [] }, // 설빈달
  kur0ch4t: { notes: [] }, // 쿠로샤
  y0unggam: { notes: [] }, // 영감__
  alice427: { notes: [] }, // 미르_MIR
  kaksjak0730: { notes: [] }, // 한결___
  sookbong777: { notes: [] }, // 숙봉이
  kirababy2: { notes: [] }, // 유키라
  dokkhye0000: { notes: [] }, // 독고혜지
  ttu0221: { notes: [] }, // 흠냥b
};

export function getWakgoodNote(streamerId: string): WakgoodNoteEntry | undefined {
  return WAKGOOD_NOTES[streamerId];
}

/** Sentinel note body meaning "평가를 의도적으로 건너뜀" — rendered without a bullet, in its own style. */
export const WAKGOOD_NOTE_SKIPPED = "(넘어감)";

export function isSkippedWakgoodNote(notes: string[] | undefined): boolean {
  return notes?.length === 1 && notes[0] === WAKGOOD_NOTE_SKIPPED;
}
