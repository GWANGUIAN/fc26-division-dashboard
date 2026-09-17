import { WOOWAKGOOD_BONUS_STREAMER } from "../toty-card/woowakgoodBonusCard.js";

export type GroupPhotoSlot = {
  id: string;
  row: "back" | "front";
  /** Horizontal center position, as a percentage of the stage width. */
  left: number;
  /** Character width, in vw — pure-vw sizing so it tracks the background at any zoom level, same convention as photo-booth.css's .photo-booth-director. */
  widthVw: number;
  /** Extra vertical nudge in vw (negative = up), applied on top of the row's shared `top`. Since every character in a row shares the same `top` (anchored to its top edge) but scales via `widthVw`, a wider-than-its-row-mates character is also taller and its feet drift lower than the rest — this compensates so feet stay lined up. */
  topAdjustVw?: number;
};

// Hardcoded 잔디동 단체사진 배치 — 11명의 최종합격자(passedSecondRound) +
// 로스터에 없는 감독 우왁굳(WOOWAKGOOD_BONUS_STREAMER 재사용, 하드코딩 게스트
// 컨벤션은 src/web/toty-card/woowakgoodBonusCard.ts 참고). 실제 배경/캐릭터
// 아트가 나오기 전에 작성된 좌표라 근사치임 — docs/group-photo-prompts.md의
// 이미지가 실제로 채워진 뒤 group-photo.css의 top 오프셋과 함께 눈으로 보면서
// 조정해야 함 (photo-booth.css의 .photo-booth-director--round2 코멘트와 같은
// 이유).
export const GROUP_PHOTO_ROSTER: GroupPhotoSlot[] = [
  // 뒷줄 (서기) — 7명. left 간격(8)이 widthVw(14.85)보다 좁아서 어깨가 겹치도록.
  { id: "doormomo", row: "back", left: 27.5, widthVw: 14.85 },
  { id: "hachi97", row: "back", left: 34, widthVw: 14.85 },
  { id: "janine95kim", row: "back", left: 42, widthVw: 14.85 },
  { id: "ju010228", row: "back", left: 50, widthVw: 14.85 },
  { id: "lina0108", row: "back", left: 58.8, widthVw: 14.85 },
  { id: "tdnlamuron", row: "back", left: 66, widthVw: 14.85 },
  { id: WOOWAKGOOD_BONUS_STREAMER.id, row: "back", left: 74, widthVw: 16.34, topAdjustVw: -2.5 },
  // 앞줄 (쭈그려 앉기) — 5명, 뒷줄 사이사이에 배치. 같은 이유로 left 간격(9)이
  // widthVw(11)보다 좁게.
  { id: "bboringirl", row: "front", left: 32, widthVw: 11 },
  { id: "sjh4018", row: "front", left: 41, widthVw: 11 },
  { id: "kaksjak0730", row: "front", left: 50, widthVw: 11 },
  { id: "tleod1818", row: "front", left: 57.5, widthVw: 11 },
  { id: "haepalin", row: "front", left: 65, widthVw: 11 },
];
