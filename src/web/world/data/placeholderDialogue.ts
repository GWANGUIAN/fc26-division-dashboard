import type { DialogueNode } from "../state/dialogue";
import type { CastDef } from "../types";

// S2 placeholder conversations. The real, reviewed dialogue (docs/world/02 §7–§9) arrives with
// `dialogueData.ts` in S4; nothing here quotes it. Every line is generic on purpose and the first
// meeting says so, which is also the marker for the 검수 pass: replace this module, don't edit it.

const TEMP = "(임시 대사)";

const ELDER_FIRST: DialogueNode = {
  lines: [
    { speaker: "elder", text: "허허, 새 얼굴이구나. 잔디동은 처음인가?", mood: "happy" },
    { speaker: "elder", text: `방향키로 걷고, 누군가에게 다가가서 E를 누르면 말을 걸 수 있단다. ${TEMP}` },
  ],
  choices: [
    {
      label: "마을 안내를 듣는다",
      next: {
        lines: [
          { speaker: "elder", text: "북쪽의 큰 건물이 클럽하우스, 한가운데가 스타디움이란다." },
          { speaker: "elder", text: "집마다 주인이 있으니 하나씩 찾아가 보렴. 문 앞에서 위로 걸으면 들어갈 수 있단다." },
        ],
      },
    },
    { label: "괜찮아요", next: { lines: [{ speaker: "elder", text: "그래, 천천히 둘러보렴." }] } },
  ],
};

const ELDER_REPEAT: DialogueNode[] = [
  { lines: [{ speaker: "elder", text: "오늘도 잔디가 조금 힘이 없어 보이는구나." }] },
  { lines: [{ speaker: "elder", text: "궁금한 게 있으면 언제든 물어보렴. (임시 대사)" }] },
];

/** Conversation with an NPC. `talked` is how many times the player has already spoken with them. */
export function buildNpcDialogue(cast: CastDef, talked: number): DialogueNode {
  if (cast.id === "elder") return talked === 0 ? ELDER_FIRST : ELDER_REPEAT[(talked - 1) % ELDER_REPEAT.length];

  if (cast.role === "animal") {
    return { lines: [{ speaker: null, text: cast.id === "cat-jandi" ? "잔디냥이 야옹— 하고 짧게 울었다." : "공돌이가 꼬리를 흔들며 발치를 맴돈다." }] };
  }

  const name = cast.displayName;
  if (talked === 0) {
    const greeting =
      cast.role === "member"
        ? `어서 와, {player}! 나는 ${name}이야.`
        : cast.role === "host"
          ? "왔구나, {player}. 잔디동에 온 걸 환영한다."
          : "처음 보는 얼굴이네요. 반갑습니다, {player}.";
    return {
      lines: [
        { speaker: cast.id, text: greeting, mood: "happy" },
        { speaker: cast.id, text: `이야기는 나중에 더 나누자. ${TEMP}` },
      ],
    };
  }
  const repeats = ["오늘도 잔디가 조금 힘이 없어 보이네…", "다음에 또 얘기하자!", `${name}에게서 아직 들을 이야기가 많다. ${TEMP}`];
  return { lines: [{ speaker: cast.id, text: repeats[(talked - 1) % repeats.length] }] };
}

/** A read-only object (sign, furniture): narration with no portrait. */
export function buildExamineDialogue(text: string): DialogueNode {
  return { lines: [{ speaker: null, text }] };
}

/** The prologue cut (docs/world/01 §3). Placeholder text — needs the 검수 pass before S4. */
export const PROLOGUE_LINES: string[] = [
  "{player}은(는) 오늘 잔디동에 입단했다.",
  "창밖의 잔디가 어쩐지 색이 바랜 듯 보인다.",
  "마을 한가운데 스타디움의 황금 잔디가 시들어 간다고 한다.",
  "일단 밖으로 나가 보자. 누군가 도움이 필요할지도 모른다.",
];
