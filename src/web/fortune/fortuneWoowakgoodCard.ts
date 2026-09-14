import type { FortuneCardEntry } from "./fortuneCardData";

// 우왁굳 is the host running this whole club, not an applicant — he never
// appears in roster.yaml (same convention as toty-card/woowakgoodBonusCard.ts).
// Kept as its own standalone module (not inside fortuneCardData.ts, and not
// part of FORTUNE_CARDS) so the "must draw all 11 real cards" unlock check
// in useFortuneBonusUnlock.ts can stay a plain FORTUNE_CARDS.every(...) —
// this card is composed in separately by whoever needs it, once unlocked.
export const FORTUNE_WOOWAKGOOD_ID = "woowakgood";
export const FORTUNE_WOOWAKGOOD_DISPLAY_NAME = "우왁굳";

export const FORTUNE_WOOWAKGOOD_CARD: FortuneCardEntry = {
  id: FORTUNE_WOOWAKGOOD_ID,
  cardName: "벤치에 있던 감독",
  fortuneText:
    "벤치에 있던 감독이 심판 몰래 유니폼으로 갈아입고 그라운드에 난입한다.\n실력은 하나도 안 늘었지만, 그 텐션 하나로 팀 전체가 웃음바다가 된다.",
  glowColor: "#ffd76a",
  glowColorSoft: "#fff0c2",
};
