import {
  CAST_SCRIPTS, FINALE_SCRIPT, MISSION_SCRIPTS, STORY_SCRIPT, cheerLine, type CastScript, type CutLine, type Line, type MissionScript,
} from "../data/dialogueData";
import { MINIGAME_INFO, finaleRoundGoal, missionDefsFor, type MissionDef } from "../data/missionDefs";
import type { CastDef, CastId, SceneId } from "../types";
import type { DialogueChoice, DialogueEffect, DialogueLine, DialogueNode } from "./dialogue";
import { missionStatus, type MissionSave } from "./missions";
import { availableGoldenBalls, spentGoldenBalls } from "./finaleBalls";
import { asProgress, canSpendBalls, describeProgress } from "./missionEval";
import { ENDING_SEEN_FLAG, pendingStoryBeat } from "./story";

// Turns the mission state and the story flags into what an NPC says (docs/world/02 §6). The wording is all in
// `data/dialogueData.ts`; this module only decides which lines come when. Priority inside one conversation:
//
//   first meeting → parcel that arrives → rumor being asked → the NPC's own mission (report > offer > progress)
//   → the director's story talk → otherwise one rotating filler line (before the main missions / at home /
//   after the ending / plain idle).
//
// Lines are concatenated; the choices of the last part that has any come at the end.

export interface Conversation {
  node: DialogueNode;
  /** Applied when the conversation ends, in order (a completed report, a finished talk mission, story flags). */
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
  /** Where the talk happens (a member says other things at home). Defaults to the overworld. */
  scene?: SceneId;
}

export const MAIN_OPEN_FLAG = "main-open";

// ── building blocks ─────────────────────────────────────────────────────────────────────────

function lineOf(speaker: CastId | null, spec: Line): DialogueLine {
  return typeof spec === "string" ? { speaker, text: spec } : { speaker, text: spec[0], mood: spec[1] };
}

const lines = (speaker: CastId | null, specs: readonly Line[]): DialogueLine[] => specs.map((spec) => lineOf(speaker, spec));

const cutLines = (cut: readonly CutLine[]): DialogueLine[] =>
  cut.map((entry) => ({ speaker: entry.who, text: entry.text, ...(entry.mood ? { mood: entry.mood } : {}) }));

const narration = (text: string): DialogueLine => ({ speaker: null, text });

interface Part {
  lines: DialogueLine[];
  choices?: DialogueChoice[];
  end?: DialogueEffect[];
}

const quote = (def: MissionDef) => `「${def.title}」`;

function scriptOf(def: MissionDef): MissionScript {
  const script = MISSION_SCRIPTS[def.id];
  if (!script) throw new Error(`no dialogue for mission ${def.id}`);
  return script;
}

// ── a mission of the NPC ────────────────────────────────────────────────────────────────────

function offerPart(cast: CastDef, def: MissionDef): Part {
  const script = scriptOf(def);
  const timed = def.kind === "delivery" && def.seconds !== undefined;
  return {
    lines: lines(cast.id, script.offer ?? []),
    choices: [
      {
        label: timed ? `받는다 (${def.seconds}초)` : "받는다",
        next: script.accept ? { lines: [lineOf(cast.id, script.accept)] } : null,
        effect: { type: "accept", mission: def.id },
      },
      { label: "나중에", next: null },
    ],
  };
}

function activePart(cast: CastDef, def: MissionDef, save: MissionSave, running: boolean): Part {
  const script = scriptOf(def);
  const progress = describeProgress(def, save.missions[def.id]?.progress, save.collected, spentGoldenBalls(save.missions));
  const detail = progress ? [narration(`진행 ${progress}`)] : [];
  if (def.kind === "delivery" && def.seconds !== undefined && !running) {
    // The round ran out: the parcels went back and the giver hands them over again on request.
    return {
      lines: [...lines(cast.id, script.retryOffer ? [script.retryOffer] : script.active ?? []), ...detail],
      choices: [
        { label: `다시 받는다 (${def.seconds}초)`, next: script.retry ? { lines: [lineOf(cast.id, script.retry)] } : null, effect: { type: "retry", mission: def.id } },
        { label: "닫기", next: null },
      ],
    };
  }
  return { lines: [...lines(cast.id, script.active ?? []), ...detail] };
}

function completePart(cast: CastDef, def: MissionDef): Part {
  const out = lines(cast.id, scriptOf(def).complete);
  if (def.main) out.push(narration("잔디 조각을 건네받았다."));
  return { lines: out, end: [{ type: "complete", mission: def.id }] };
}

// ── the showdown (02 §9) ─────────────────────────────────────────────────────────────────────

/** "1라운드! 축구공 사과게임, 70점 이상이면 통과!" — built from the mission data so retuning a threshold retunes the line. */
export function roundCall(def: Extract<MissionDef, { kind: "finale" }>, round: number): string {
  const spec = def.rounds[round];
  return `${round + 1}라운드! ${MINIGAME_INFO[spec.game].name}, ${finaleRoundGoal(spec, "if")} 통과!`;
}

/** The golden-ball way out of one round: asked about, sure-check, and the scene once the balls are spent. */
function ballChoice(def: Extract<MissionDef, { kind: "finale" }>, round: number, cost: number, menu: DialogueNode, enough: boolean): DialogueChoice {
  const last = round + 1 >= def.rounds.length;
  const spent: DialogueNode = {
    lines: [
      { speaker: null, text: `황금 공 ${cost}개가 눈부시게 빛나더니, ${round + 1}라운드의 승부를 대신 결정지었다!` },
      { speaker: "weedking", text: "뭐, 뭐야 그 황금빛은?! 심판, 저건 반칙 아니냐!", mood: "surprised" },
      { speaker: "referee", text: `규칙에 있는 거야. 황금 공은 한 번 쓰면 사라져. ${round + 1}라운드는 통과!` },
      { speaker: "referee", text: last ? "이걸로 모든 라운드 통과야! 나한테 다시 말을 걸어 줘." : `다음은 ${round + 2}라운드야. 준비되면 다시 말을 걸어 줘.` },
    ],
  };
  const sure: DialogueNode = {
    lines: [
      { speaker: "referee", text: `황금 공 ${cost}개를 쓰면 ${round + 1}라운드를 바로 통과할 수 있어. 하지만 결전 중 딱 한 라운드에만 쓸 수 있고, 쓴 공은 돌려받지 못해.` },
      { speaker: "referee", text: "정말 사용할래?" },
    ],
    choices: [
      { label: "사용한다", next: spent, effect: { type: "finale-balls", mission: def.id } },
      { label: "다시 생각할게", next: menu },
    ],
  };
  return { label: `황금 공 ${cost}개로 승리`, next: sure, disabled: !enough };
}

/**
 * The prompt of one round: the King's reaction to the last round, his taunt and the referee's call, then
 * "start / spend golden balls / later". The ball choice is there until it has been used, greyed out while the player holds too few.
 */
function roundNode(def: Extract<MissionDef, { kind: "finale" }>, round: number, save: MissionSave): DialogueNode {
  const script = FINALE_SCRIPT.rounds[round];
  const out: DialogueLine[] = [];
  const reaction = round > 0 ? FINALE_SCRIPT.rounds[round - 1].cleared : "";
  if (reaction) out.push({ speaker: "weedking", text: reaction, mood: "surprised" });
  if (script) out.push({ speaker: "weedking", text: script.taunt });
  out.push({ speaker: "referee", text: roundCall(def, round) });

  const choices: DialogueChoice[] = [{ label: `${round + 1}라운드 도전!`, next: null, effect: { type: "start-round", mission: def.id } }];
  const progress = save.missions[def.id]?.progress;
  if (def.ballSkip !== undefined && !asProgress(progress).balls?.length) {
    const held = availableGoldenBalls(save.collected).length;
    out.push({ speaker: "referee", text: `황금 공이 ${def.ballSkip}개 이상 있으면 한 라운드는 공으로 통과할 수 있어. (지금 ${held}개)` });
    // Backing out of the sure-check comes back to the same three choices.
    const menu: DialogueNode = { lines: [{ speaker: "referee", text: "어떻게 할래?" }], choices };
    choices.push(ballChoice(def, round, def.ballSkip, menu, canSpendBalls(def, progress, save.collected)));
  }
  choices.push({ label: "잠깐 준비할게", next: null });
  return { lines: out, choices };
}

function finalePart(def: Extract<MissionDef, { kind: "finale" }>, status: "available" | "active" | "ready", save: MissionSave): Part {
  if (status === "ready") {
    return { lines: cutLines(FINALE_SCRIPT.victory), end: [{ type: "complete", mission: def.id }] };
  }
  if (status === "available") {
    const first = roundNode(def, 0, save);
    return {
      lines: cutLines(FINALE_SCRIPT.intro),
      choices: [
        { label: "결전을 시작한다", next: first, effect: { type: "accept", mission: def.id } },
        { label: "잠깐만", next: null },
      ],
    };
  }
  const cleared = Math.min(def.rounds.length - 1, asProgress(save.missions[def.id]?.progress).round ?? 0);
  const node = roundNode(def, cleared, save);
  return { lines: node.lines, choices: node.choices };
}

/** The mission part of a conversation with a giver: report first, then a new offer, then the progress hint. */
function missionPart(ctx: ConversationContext): Part | null {
  // The Weeder King stands in the stadium next to the referee: either of them runs the showdown.
  const mine = missionDefsFor(ctx.save.player).filter((def) => def.giver === ctx.cast.id || (def.kind === "finale" && ctx.cast.id === "weedking"));
  const withStatus = mine.map((def) => ({ def, status: missionStatus(ctx.save, def) }));

  const ready = withStatus.find((entry) => entry.status === "ready");
  if (ready) return ready.def.kind === "finale" ? finalePart(ready.def, "ready", ctx.save) : completePart(ctx.cast, ready.def);
  const fresh = withStatus.find((entry) => entry.status === "available");
  if (fresh) {
    if (fresh.def.kind === "talk") return null; // handled as the tutorial conversation
    return fresh.def.kind === "finale" ? finalePart(fresh.def, "available", ctx.save) : offerPart(ctx.cast, fresh.def);
  }
  const active = withStatus.find((entry) => entry.status === "active");
  if (!active) return null;
  return active.def.kind === "finale" ? finalePart(active.def, "active", ctx.save) : activePart(ctx.cast, active.def, ctx.save, ctx.deliveryRunning);
}

/** The director's progress talk or the finale offer (02 §8), when one is waiting. */
function storyPart(ctx: ConversationContext): Part | null {
  if (ctx.cast.role !== "host") return null;
  const beat = pendingStoryBeat({ player: ctx.save.player, shards: ctx.save.shards, flags: ctx.save.flags });
  if (!beat) return null;
  const script = STORY_SCRIPT.beats[beat.shards];
  if (!script) return null;
  return { lines: lines(ctx.cast.id, script), end: [{ type: "flags", flags: beat.flags }] };
}

// ── people with nothing else to say ─────────────────────────────────────────────────────────

function fillerPool(cast: CastDef, script: CastScript, ctx: ConversationContext): readonly Line[] {
  const ended = ctx.save.flags[ENDING_SEEN_FLAG] === true;
  const before = cast.role === "member" && script.pre && ctx.save.flags[MAIN_OPEN_FLAG] !== true;
  if (before && script.pre) return script.pre;
  const atHome = cast.home !== undefined && ctx.scene === cast.home && script.home;
  if (atHome && script.home) return ended && script.post ? [...script.home, ...script.post] : script.home;
  if (ended && script.post) return script.post;
  return script.idle;
}

function fillerPart(cast: CastDef, ctx: ConversationContext): Part {
  const script = CAST_SCRIPTS[cast.id];
  if (!script) return { lines: [narration("…")] };
  const pool = fillerPool(cast, script, ctx);
  const spec = pool[Math.max(0, ctx.talked - 1) % pool.length];
  return { lines: [lineOf(script.narrate ? null : cast.id, spec)] };
}

// ── the conversation ────────────────────────────────────────────────────────────────────────

function merge(parts: Part[]): Conversation {
  const all = parts.flatMap((part) => part.lines);
  const withChoices = [...parts].reverse().find((part) => part.choices);
  const endEffects = parts.flatMap((part) => part.end ?? []);
  return { node: { lines: all, ...(withChoices ? { choices: withChoices.choices } : {}) }, endEffects };
}

export function buildConversation(ctx: ConversationContext): Conversation {
  const { cast, save } = ctx;
  const defs = missionDefsFor(save.player);
  const active = defs.filter((def) => missionStatus(save, def) === "active");
  const script = CAST_SCRIPTS[cast.id];
  const greeting: Part | null = ctx.talked === 0 && script?.first && !script.narrate ? { lines: lines(cast.id, script.first) } : null;

  // A tutorial talk is the conversation that completes it: the greeting, the wrap-up and the topics to pick from.
  const talkMission = defs.find((def) => def.kind === "talk" && def.giver === cast.id && missionStatus(save, def) === "available");
  if (talkMission) {
    const talk = MISSION_SCRIPTS[talkMission.id];
    const topics = talk?.topics ?? [];
    return {
      node: {
        lines: [...(greeting?.lines ?? []), ...lines(cast.id, talk?.complete ?? [])],
        ...(topics.length > 0 ? { choices: topics.map((topic) => ({ label: topic.label, next: { lines: lines(cast.id, topic.lines) } })) } : {}),
      },
      endEffects: [{ type: "finish-talk", mission: talkMission.id }],
    };
  }

  const parts: Part[] = greeting ? [greeting] : [];

  // A parcel meant for this person (the milk for the elder).
  for (const def of active) {
    if (def.kind !== "delivery") continue;
    const carrying = asProgress(save.missions[def.id]?.progress).carrying ?? [];
    for (const item of def.items) {
      if ("cast" in item.to && item.to.cast === cast.id && carrying.includes(item.id)) {
        parts.push({ lines: lines(cast.id, script?.receive ? [script.receive] : [[`${item.label} 배달이구나! 고마워.`, "happy"]]) });
      }
    }
  }

  // Asked about the rumor by an active talk chain.
  for (const def of active) {
    if (def.kind !== "talk_chain" || !def.targets.includes(cast.id)) continue;
    const asked = asProgress(save.missions[def.id]?.progress).asked ?? [];
    if (!asked.includes(cast.id)) parts.push({ lines: lines(cast.id, [script?.rumor ?? "그런 소문이라면 들은 적이 있어."]) });
  }

  const own = missionPart(ctx) ?? storyPart(ctx);
  if (own) parts.push(own);

  if (parts.length === 0) parts.push(fillerPart(cast, ctx));
  return merge(parts);
}

// ── other dialogue ──────────────────────────────────────────────────────────────────────────

/** A read-only object (sign, furniture): narration with no portrait. */
export function buildExamineDialogue(text: string): DialogueNode {
  return { lines: [{ speaker: null, text }] };
}

/** What a member in the stands shouts when spoken to during the showdown (examine action `cheer:<cast>`). */
export function buildCheerDialogue(cast: CastId): DialogueNode {
  const spec = cheerLine(cast);
  return { lines: spec ? [lineOf(cast, spec)] : [narration("…")] };
}

/** The ending cut after the golden grass bloomed: the King's change of heart and the call for the photo. The last line hands over to the photo. */
export function buildEndingDialogue(): Conversation {
  return { node: { lines: cutLines(FINALE_SCRIPT.ending) }, endEffects: [{ type: "ending-photo" }] };
}
