/**
 * 우왁굳이 1차 합격자 개개인에 대해 남긴 평가 메모.
 * roster.yaml의 slug(= StreamerRecord.id)를 키로 사용한다.
 */
export const WAKGOOD_NOTES: Record<string, string[]> = {
  ditosak: [
    "볼키핑 가능",
    "WF에서 볼처리 느림(패스길 시야 아쉽)",
    "오프더볼 무난",
  ],
  sjh4018: [
    "오프더볼 좋음",
    "패스 좋음",
    "수비 좋음",
  ],
};

export function getWakgoodNotes(streamerId: string): string[] | undefined {
  return WAKGOOD_NOTES[streamerId];
}
