import type { FortuneCardEntry } from "./fortuneCardData";

// 우왁굳 is the host running this whole club, not an applicant — he never
// appears in roster.yaml (same convention as toty-card/woowakgoodBonusCard.ts).
// Kept as its own standalone module (not inside fortuneCardData.ts, and not
// part of FORTUNE_CARDS) so the "must draw all 11 real cards" unlock check
// in useFortuneBonusUnlock.ts can stay a plain FORTUNE_CARDS.every(...) —
// these cards are composed in separately by whoever needs them, once
// unlocked.
export const FORTUNE_WOOWAKGOOD_ID = "woowakgood";
export const FORTUNE_WOOWAKGOOD_DISPLAY_NAME = "우왁굳";
// Same file TOTY's own WOOWAKGOOD_BONUS_STREAMER.sfx points at — he's not in
// streamers (see above), so FortuneDraw.tsx's normal StreamerRecord.sfx
// lookup can't find this on its own and checks this constant instead. Only
// FORTUNE_WOOWAKGOOD_CARD (his first card) uses this as a fallback — his
// second card sets its own `sfxOverride` instead (see below).
export const FORTUNE_WOOWAKGOOD_SFX = "/sfxes/woowakgood.mp3";

export const FORTUNE_WOOWAKGOOD_CARD: FortuneCardEntry = {
  id: FORTUNE_WOOWAKGOOD_ID,
  cardName: "벤치에 있던 감독",
  fortuneText:
    "벤치에 있던 감독이 심판 몰래 유니폼으로 갈아입고 그라운드에 난입한다. 실력은 하나도 안 늘었지만, 그 텐션 하나로 팀 전체가 웃음바다가 된다.",
  glowColor: "#ffd76a",
  glowColorSoft: "#fff0c2",
};

export const FORTUNE_WOOWAKGOOD_ID_2 = "woowakgood2";

// 우왁굳의 두 번째(보너스) 카드 — "왁초리"(우왁굳 + 회초리) 패러디. 1번
// 카드(신나는 개그)와 달리 안 좋은 내용의 카드로 설계함(사용자 요청).
// `streamerId`를 FORTUNE_WOOWAKGOOD_ID로 지정해서, id는 다르지만(전용
// 이미지/기록을 가지려면 필요) getFortuneCardOrdinal/formatFortuneCardEyebrow
// 등 "~의 첫번째/두번째 카드" 계산 로직이 두 카드를 같은 "우왁굳"으로 묶어
// 인식하게 함 — 다만 표시 이름 자체는 그가 streamers 목록에 없어서(위 설명
// 참고) FortuneDraw.tsx/FortuneHistoryModal.tsx가 여전히
// FORTUNE_WOOWAKGOOD_ID 특수 케이스로 하드코딩해서 채워줌.
export const FORTUNE_WOOWAKGOOD_CARD_2: FortuneCardEntry = {
  id: FORTUNE_WOOWAKGOOD_ID_2,
  streamerId: FORTUNE_WOOWAKGOOD_ID,
  cardName: "회초리를 든 왁초리",
  fortuneText:
    "벤치에서 조용히 왁초리가 등장하는 순간, 팀 전체에 서늘한 침묵이 흐른다. 오늘 훈련은 웃을 일이 없다.",
  glowColor: "#8a2f2f",
  glowColorSoft: "#e0a3a3",
  // 사용자가 직접 효과음 파일을 추가할 예정 — public/sfxes/wakchori.mp3로
  // 넣으면 코드 수정 없이 바로 재생됨(파일이 없는 동안엔 조용히 무음 처리).
  sfxOverride: "/sfxes/wakchori.mp3",
};

/** Both of 우왁굳's cards, in reveal-pool order — folded into the draw pool
 * together once useFortuneBonusUnlock.ts says the achievement is unlocked
 * (see FortuneDraw.tsx's hiddenPool) and into the "뽑았던 카드" history list
 * together (see FortuneHistoryModal.tsx's ALL_FORTUNE_CARDS). */
export const FORTUNE_WOOWAKGOOD_CARDS: FortuneCardEntry[] = [FORTUNE_WOOWAKGOOD_CARD, FORTUNE_WOOWAKGOOD_CARD_2];
