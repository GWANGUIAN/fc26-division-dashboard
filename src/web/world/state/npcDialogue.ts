import { ELDER_FIRST, buildNpcDialogue, greetingLine } from "../data/placeholderDialogue";
import { missionDefsFor, type MissionDef } from "../data/missionDefs";
import type { CastDef, CastId } from "../types";
import type { DialogueChoice, DialogueEffect, DialogueLine, DialogueNode } from "./dialogue";
import { missionStatus, type MissionSave } from "./missions";
import { asProgress, describeProgress } from "./missionEval";

// Turns the mission state into what an NPC says (docs/world/02 §6 node kinds: offer / active / complete /
// rumor / idle). The text is generated from the mission data and is TEMPORARY: it marks itself
// "(임시 대사)" like `placeholderDialogue.ts`. The reviewed lines (docs/world/02 §7–§9) replace this in S4
// through `dialogueData.ts`; the selection rules below (which node when) stay.
//
// One conversation can stack several small parts: a parcel that arrives, a rumor being asked, and then the
// NPC's own mission (report > offer > progress). Lines are concatenated; the choices of the last part
// that has any come at the end.

const TEMP = "(임시 대사)";

export interface Conversation {
  node: DialogueNode;
  /** Applied when the conversation ends, in order (a completed report, a finished talk mission). */
  endEffects: DialogueEffect[];
}

export interface ConversationContext {
  cast: CastDef;
  /** The save with the player set (missions the player owns are already excluded by `missionStatus`). */
  save: MissionSave;
  /** How many times the player has spoken with this NPC before. */
  talked: number;
  /** A timed delivery is running right now (the parcels are in the player's bag). */
  deliveryRunning: boolean;
}

/** What the people on the rumor route say (docs/world/02 §7 M-하치). Placeholder wording. */
const RUMOR_TEXT: Partial<Record<CastId, string>> = {
  kid: `용볼 소문이요? 언덕 위에서 뭔가 반짝이는 게 굴러갔다는 얘기는 들었어요. ${TEMP}`,
  shopkeeper: `용볼이라… 요즘 그 얘기를 하는 손님이 부쩍 늘었지. ${TEMP}`,
  elder: `허허, 옛날부터 언덕에는 용이 산다는 이야기가 있었단다. ${TEMP}`,
};

const line = (cast: CastDef, text: string, mood?: DialogueLine["mood"]): DialogueLine => ({ speaker: cast.id, text, ...(mood ? { mood } : {}) });

interface Part {
  lines: DialogueLine[];
  choices?: DialogueChoice[];
  end?: DialogueEffect[];
}

const quote = (def: MissionDef) => `「${def.title}」`;

function offerPart(cast: CastDef, def: MissionDef): Part {
  const timed = def.kind === "delivery" && def.seconds !== undefined;
  return {
    lines: [line(cast, `${quote(def)} ${def.objective}. 도와줄 수 있어? ${TEMP}`)],
    choices: [
      { label: timed ? `받는다 (${def.seconds}초)` : "받는다", next: { lines: [line(cast, `고마워! ${def.hint}. ${TEMP}`, "happy")] }, effect: { type: "accept", mission: def.id } },
      { label: "나중에", next: null },
    ],
  };
}

function activePart(cast: CastDef, def: MissionDef, save: MissionSave, running: boolean): Part {
  const progress = describeProgress(def, save.missions[def.id]?.progress, save.collected);
  const detail = progress ? ` (${progress})` : "";
  if (def.kind === "delivery" && def.seconds !== undefined) {
    if (running) return { lines: [line(cast, `택배는 이미 네 손에 있어. 서둘러, 시간이 없어! ${TEMP}`)] };
    return {
      lines: [line(cast, `${quote(def)}${detail} 택배를 다시 받을래? ${TEMP}`)],
      choices: [
        { label: `다시 받는다 (${def.seconds}초)`, next: { lines: [line(cast, `좋아, 다시 달려! ${TEMP}`, "happy")] }, effect: { type: "retry", mission: def.id } },
        { label: "닫기", next: null },
      ],
    };
  }
  return { lines: [line(cast, `${quote(def)} 진행 중이야. ${def.hint}.${detail} ${TEMP}`)] };
}

function completePart(cast: CastDef, def: MissionDef): Part {
  const lines: DialogueLine[] = [line(cast, `${quote(def)} 완료! 수고했어, {player}. ${TEMP}`, "happy")];
  if (def.id === "m-01-mycard") lines.push(line(cast, `스타디움의 잔디가 시들고 있어. 멤버들을 도와 잔디 조각을 모아 줘. ${TEMP}`, "worried"));
  if (def.main) lines.push({ speaker: null, text: "잔디 조각을 건네받았다." });
  return { lines, end: [{ type: "complete", mission: def.id }] };
}

/** The mission part of a conversation with a giver: report first, then a new offer, then the progress hint. */
function missionPart(ctx: ConversationContext): Part | null {
  const mine = missionDefsFor(ctx.save.player).filter((def) => def.giver === ctx.cast.id);
  const withStatus = mine.map((def) => ({ def, status: missionStatus(ctx.save, def) }));
  const ready = withStatus.find((entry) => entry.status === "ready");
  if (ready) return completePart(ctx.cast, ready.def);
  const fresh = withStatus.find((entry) => entry.status === "available");
  if (fresh) {
    if (fresh.def.kind === "talk") return null; // handled as the tutorial conversation
    return offerPart(ctx.cast, fresh.def);
  }
  const active = withStatus.find((entry) => entry.status === "active");
  return active ? activePart(ctx.cast, active.def, ctx.save, ctx.deliveryRunning) : null;
}

function merge(parts: Part[]): Conversation {
  const lines = parts.flatMap((part) => part.lines);
  const withChoices = [...parts].reverse().find((part) => part.choices);
  const endEffects = parts.flatMap((part) => part.end ?? []);
  return { node: { lines, ...(withChoices ? { choices: withChoices.choices } : {}) }, endEffects };
}

export function buildConversation(ctx: ConversationContext): Conversation {
  const { cast, save } = ctx;
  const defs = missionDefsFor(save.player);
  const active = defs.filter((def) => missionStatus(save, def) === "active");

  // The tutorial greeting of the elder is the conversation that completes `m-00-hello`.
  const talkMission = defs.find((def) => def.kind === "talk" && def.giver === cast.id && missionStatus(save, def) === "available");
  if (talkMission) return { node: cast.id === "elder" ? ELDER_FIRST : { lines: [line(cast, `안녕, {player}. ${TEMP}`)] }, endEffects: [{ type: "finish-talk", mission: talkMission.id }] };

  const parts: Part[] = [];

  // A parcel meant for this person (the milk for the elder).
  for (const def of active) {
    if (def.kind !== "delivery") continue;
    const carrying = asProgress(save.missions[def.id]?.progress).carrying ?? [];
    for (const item of def.items) {
      if ("cast" in item.to && item.to.cast === cast.id && carrying.includes(item.id)) parts.push({ lines: [line(cast, `${item.label} 배달이구나! 고마워. ${TEMP}`, "happy")] });
    }
  }

  // Asked about the rumor by an active talk chain.
  for (const def of active) {
    if (def.kind !== "talk_chain" || !def.targets.includes(cast.id)) continue;
    const asked = asProgress(save.missions[def.id]?.progress).asked ?? [];
    if (!asked.includes(cast.id)) parts.push({ lines: [line(cast, RUMOR_TEXT[cast.id] ?? `그런 소문이라면 들은 적이 있어. ${TEMP}`)] });
  }

  const own = missionPart(ctx);
  if (own) {
    if (ctx.talked === 0 && parts.length === 0 && (cast.role === "member" || cast.role === "host")) parts.push({ lines: [greetingLine(cast)] });
    parts.push(own);
  }

  if (parts.length === 0) return { node: buildNpcDialogue(cast, ctx.talked), endEffects: [] };
  return merge(parts);
}
