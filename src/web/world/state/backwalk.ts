import type { Facing, WorldSave } from "../types";
import type { DialogueChoice, DialogueLine, DialogueNode } from "./dialogue";

// The backwards-walking statue (an Easter egg on the rune hill): its "blessing" makes the player's sprite face and
// walk the opposite way of where they go. Only the drawing flips; movement, collision and interaction use the real facing.

/** Set while the blessing is on; removed again when the statue takes it back. */
export const BACKWALK_FLAG = "backwalk";
/** Set the first time the blessing was taken, so the statue can greet a repeat visitor differently. */
export const BACKWALK_SEEN_FLAG = "backwalk-seen";

const OPPOSITE: Record<Facing, Facing> = { down: "up", up: "down", left: "right", right: "left" };

export const oppositeFacing = (facing: Facing): Facing => OPPOSITE[facing];

export const isBackwalk = (save: Pick<WorldSave, "flags">): boolean => save.flags[BACKWALK_FLAG] === true;

const narration = (text: string): DialogueLine => ({ speaker: null, text });

const declined = (text: string): DialogueNode => ({ lines: [narration(text)] });

const BLESSING_GIVEN: DialogueNode = {
  lines: [
    narration("「좋다… 두 눈을 감고, 마음을 비우거라.」"),
    narration("석상의 눈이 밝게 빛나더니, 발밑에서 따스한 바람이 일었다!"),
    narration("「이제 걸어가 보거라. 앞으로 나아가는 것이 이렇게 쉬웠던가 싶을 게다. …후후.」"),
    narration("…방금 석상이 웃은 것 같은데, 기분 탓이겠지?"),
  ],
};

const BLESSING_TAKEN_BACK: DialogueNode = {
  lines: [
    narration("「좋다… 두 눈을 감거라.」"),
    narration("석상의 눈이 다시 빛나더니, 뒤틀렸던 발걸음이 제자리를 찾았다."),
    narration("「이제 앞은 앞이고, 뒤는 뒤다. 다음부터는 수상한 석상의 말을 함부로 믿지 말거라. 허허허.」"),
  ],
};

const offer = (): DialogueChoice[] => [
  { label: "축복을 받는다", next: BLESSING_GIVEN, effect: { type: "backwalk", on: true } },
  { label: "그만둔다", next: declined("「…그래, 강요는 않으마. 마음이 바뀌면 언제든 다시 오거라.」") },
];

const takeBack = (): DialogueChoice[] => [
  { label: "거두어 주세요", next: BLESSING_TAKEN_BACK, effect: { type: "backwalk", on: false } },
  { label: "그만둔다", next: declined("「호오, 이 맛에 빠졌느냐? 좋다, 좋아. 마음이 바뀌면 언제든 오거라.」") },
];

/** What the statue says: the offer of the blessing, or (while it is on) the offer to take it back. */
export function buildBackwalkDialogue(save: Pick<WorldSave, "flags">): DialogueNode {
  if (isBackwalk(save)) {
    return {
      lines: [
        narration("석상이 말없이 당신을 내려다보고 있다. 왠지 즐거워 보인다."),
        narration("「오오, 돌아왔구나. 축복은 어떠하냐? 걸음이 아주 가볍지 않더냐?」"),
        narration("「…응? 걷는 것이 어색하다고? 앞이 뒤 같고 뒤가 앞 같다고?」"),
        narration("「허허, 착각이겠지. 하지만 정 불편하다면 축복을 거두어 주마.」"),
        narration("「축복을 거두겠느냐?」"),
      ],
      choices: takeBack(),
    };
  }
  const seen = save.flags[BACKWALK_SEEN_FLAG] === true;
  const opening = seen
    ? [
        narration("…또 그 석상이다. 석상의 입꼬리가 살짝 올라간 것 같다."),
        narration("「돌아왔구나. 지난번 일은 잊거라. 이번에야말로 진짜 ‘순풍의 축복’이다.」"),
      ]
    : [
        narration("이끼 낀 낡은 석상이다. 눈이 마주친 순간, 석상의 눈동자가 희미하게 빛난 것 같다."),
        narration("「…오랜만에 손님이 왔구나, 작은 여행자여.」"),
        narration("「내가 잔디동에 전해 내려오는 ‘순풍의 축복’을 내려주마. 이 축복을 받은 자는 발걸음이 깃털처럼 가벼워지고, 어떤 길이든 막힘없이 나아가게 된다.」"),
      ];
  return {
    lines: [
      ...opening,
      narration("「부작용? 그런 건 없다. 돌의 이름을 걸고 맹세하마.」"),
      narration("「자, 축복을 받겠느냐?」"),
    ],
    choices: offer(),
  };
}

/** The flags after the blessing is switched on or off (the "seen" mark stays once it has been taken). */
export function withBackwalk(flags: WorldSave["flags"], on: boolean): WorldSave["flags"] {
  if (on) return { ...flags, [BACKWALK_FLAG]: true, [BACKWALK_SEEN_FLAG]: true };
  const { [BACKWALK_FLAG]: _removed, ...rest } = flags;
  return rest;
}
