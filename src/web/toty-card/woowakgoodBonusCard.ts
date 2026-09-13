import type { StreamerRecord } from "../../shared/model.js";

// 우왁굳 is the host running this whole club, not an applicant — he never
// appears in roster.yaml, so his TOTY card data is a hardcoded synthetic
// object rather than a real streamer record (same convention as other
// non-applicant guests referenced elsewhere in the app). Position "ALL" +
// division 1 (the app's top tier, 1부 리그) is deliberate: this card is the
// hidden bonus unlocked only after every real player's card has been
// revealed — see useWoowakgoodBonusUnlock.ts.
export const WOOWAKGOOD_ID = "woowakgood";

export const WOOWAKGOOD_BONUS_STREAMER: Pick<
  StreamerRecord,
  "id" | "displayName" | "hopedPosition1" | "currentDivision" | "sfx"
> = {
  id: WOOWAKGOOD_ID,
  displayName: "우왁굳",
  hopedPosition1: "ALL",
  currentDivision: 1,
  // public/sfxes/woowakgood.mp3 — TotyCardPopup's handleCardClick already
  // plays streamer.sfx on every card click for real streamers, so setting
  // this is the only change needed to wire it up here too.
  sfx: "/sfxes/woowakgood.mp3",
};
