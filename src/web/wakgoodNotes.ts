/**
 * 우왁굳이 1차 합격자 개개인에 대해 남긴 평가 메모.
 * roster.yaml의 slug(= StreamerRecord.id)를 키로 사용한다.
 */
export const WAKGOOD_NOTES: Record<string, string[]> = {
  ditosak: [
    "볼키핑 가능",
    "WF에서 볼처리 느림(패스길 시야 아쉽)",
    "오프더볼 무난",
  ], //오슈이
  sjh4018: ["오프더볼 좋음", "패스 좋음", "수비 좋음"], //핑구
  ddalgishoux: [
    "공격성 있고 온더볼에서 슈팅 능력",
    "오프더볼 bad",
    "패스, 시야 bad",
  ], // 딸기슈몽
  esoj001: ["성장 필요", "RT 무조건 누르고 있는 습관"], // 도이지
  tleod1818: [], // 빙밍_
  haepalin: [], // 해파린~
  sircharlee: [], // 찰리씨
  nsnowthemoon: [], // 설빈달
  kur0ch4t: [], // 쿠로샤
  been11060: [], // 오구
  hobal115end: [], // 호발☆
  janine95kim: [], // 재닌
  y0unggam: [], // 영감__
  alice427: [], // 미르_MIR
  kaksjak0730: [], // 한결___
  sookbong777: [], // 숙봉이
  kirababy2: [], // 유키라
  dokkhye0000: [], // 독고혜지
  ttu0221: [], // 흠냥b
  lina0108: [], // 리냐_LINYA
};

export function getWakgoodNotes(streamerId: string): string[] | undefined {
  return WAKGOOD_NOTES[streamerId];
}
