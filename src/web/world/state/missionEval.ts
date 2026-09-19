import type { DeliveryTarget, MissionDef } from "../data/missionDefs";
import type { CastId, MinigameRoundResult } from "../types";

// Mission judging (docs/world/02 §12): given a mission, what it has recorded so far and one thing that just
// happened in the world, decide the new progress and whether the goal is met. Pure — `missions.ts` applies
// the result to the save. Only events that come from the world itself count (a minigame or card popup opened
// by the world overlay, a pickup, a delivery…), never a dashboard play.

export type MissionEvent =
  | { type: "minigame"; result: MinigameRoundResult }
  | { type: "card-view"; cardId: string; variant: string }
  | { type: "pickup"; id: string }
  | { type: "delivered"; item: string; to: DeliveryTarget }
  | { type: "talk"; cast: CastId }
  | { type: "trial-finished"; mission: string; seconds: number }
  | { type: "kick-finished"; mission: string; goals: number }
  /** A round of a minigame opened from the stadium's showdown (an arcade play never counts for it). */
  | { type: "finale-round"; result: MinigameRoundResult };

/** What a mission remembers between events (`WorldSave.missions[id].progress`). */
export interface MissionProgressData {
  /** Best score so far (lowest turns for the card game, lowest seconds for a time trial). */
  best?: number;
  /** talk_chain: cast ids already asked. */
  asked?: CastId[];
  /** delivery: item ids handed over. */
  delivered?: string[];
  /** untimed delivery: item ids the player is carrying. */
  carrying?: string[];
  /** finale: rounds cleared so far. */
  round?: number;
}

export interface EvalContext {
  player: CastId | null;
  /** Everything picked up so far, including the pickup this event reports. */
  collected: readonly string[];
}

export interface EvalResult {
  progress: MissionProgressData;
  ready: boolean;
}

export const asProgress = (raw: unknown): MissionProgressData => (typeof raw === "object" && raw !== null ? (raw as MissionProgressData) : {});

const lowerIsBetter = (def: MissionDef) => def.kind === "minigame_best" && def.game === "cardmatch";

/** Does one finished round meet a minigame mission's threshold? (turns ≤ max for the card game, score ≥ min otherwise) */
export function meetsMinigameGoal(def: Extract<MissionDef, { kind: "minigame_best" }>, result: MinigameRoundResult): boolean {
  if (def.game !== "any" && def.game !== result.game) return false;
  if (def.max !== undefined && !(result.score <= def.max)) return false;
  if (def.min !== undefined && !(result.score >= def.min)) return false;
  return true;
}

const better = (def: MissionDef, best: number | undefined, value: number) =>
  best === undefined ? value : lowerIsBetter(def) || def.kind === "time_trial" ? Math.min(best, value) : Math.max(best, value);

export type FinaleOutcome = "cleared" | "failed" | "ignored";

/** What a finished stadium round means for the showdown: the next round cleared, tried and missed, or a game that is not on the card. */
export function finaleRoundOutcome(def: Extract<MissionDef, { kind: "finale" }>, raw: unknown, result: MinigameRoundResult): FinaleOutcome {
  const round = def.rounds[asProgress(raw).round ?? 0];
  if (!round || round.game !== result.game) return "ignored";
  return result.score >= round.min ? "cleared" : "failed";
}

/** Untimed deliveries are picked up on accept; the item id list to carry. */
export function initialProgress(def: MissionDef): MissionProgressData {
  if (def.kind === "delivery" && def.seconds === undefined) return { carrying: def.items.map((item) => item.id), delivered: [] };
  if (def.kind === "delivery") return { delivered: [] };
  if (def.kind === "talk_chain") return { asked: [] };
  if (def.kind === "finale") return { round: 0 };
  return {};
}

/**
 * Applies one event to one active mission. Returns null when the event is irrelevant to it (nothing to save),
 * otherwise the new progress and whether the goal is now met.
 */
export function evaluateEvent(def: MissionDef, raw: unknown, event: MissionEvent, ctx: EvalContext): EvalResult | null {
  const progress = asProgress(raw);
  switch (def.kind) {
    case "talk":
      return null; // finished by the conversation itself (missions.completeTalk)

    case "card_reveal": {
      if (event.type !== "card-view") return null;
      const wanted = def.cardId === "@player" ? ctx.player : def.cardId;
      return wanted !== null && event.cardId === wanted ? { progress, ready: true } : null;
    }

    case "card_variant":
      if (event.type !== "card-view") return null;
      return event.cardId === def.cardId && event.variant === def.variant ? { progress, ready: true } : null;

    case "minigame_best": {
      if (event.type !== "minigame") return null;
      if (def.game !== "any" && def.game !== event.result.game) return null;
      const next = { ...progress, best: better(def, progress.best, event.result.score) };
      return { progress: next, ready: meetsMinigameGoal(def, event.result) };
    }

    case "collect": {
      if (event.type !== "pickup" || !def.items.includes(event.id)) return null;
      return { progress, ready: def.items.every((id) => ctx.collected.includes(id)) };
    }

    case "delivery": {
      const delivered = progress.delivered ?? [];
      const carrying = progress.carrying ?? [];
      let handed: string[] = [];
      if (event.type === "delivered") {
        const item = def.items.find((entry) => entry.id === event.item);
        if (item && sameTarget(item.to, event.to)) handed = [item.id];
      } else if (event.type === "talk") {
        // A parcel meant for a person is handed over by talking to them while carrying it.
        handed = def.items.filter((item) => "cast" in item.to && item.to.cast === event.cast && carrying.includes(item.id)).map((item) => item.id);
      }
      handed = handed.filter((id) => !delivered.includes(id));
      if (handed.length === 0) return null;
      const nextDelivered = [...delivered, ...handed];
      return {
        progress: { ...progress, delivered: nextDelivered, carrying: carrying.filter((id) => !handed.includes(id)) },
        ready: def.items.every((entry) => nextDelivered.includes(entry.id)),
      };
    }

    case "time_trial": {
      if (event.type !== "trial-finished" || event.mission !== def.id) return null;
      return { progress: { ...progress, best: better(def, progress.best, event.seconds) }, ready: event.seconds <= def.seconds };
    }

    case "kick_goals": {
      if (event.type !== "kick-finished" || event.mission !== def.id) return null;
      return { progress: { ...progress, best: better(def, progress.best, event.goals) }, ready: event.goals >= def.goals };
    }

    case "finale": {
      if (event.type !== "finale-round" || finaleRoundOutcome(def, progress, event.result) !== "cleared") return null;
      const round = (progress.round ?? 0) + 1;
      return { progress: { ...progress, round }, ready: round >= def.rounds.length };
    }

    case "talk_chain": {
      if (event.type !== "talk" || !def.targets.includes(event.cast)) return null;
      const asked = progress.asked ?? [];
      if (asked.includes(event.cast)) return null;
      const nextAsked = [...asked, event.cast];
      return { progress: { ...progress, asked: nextAsked }, ready: def.targets.every((cast) => nextAsked.includes(cast)) };
    }
  }
}

function sameTarget(a: DeliveryTarget, b: DeliveryTarget): boolean {
  if ("mailbox" in a && "mailbox" in b) return a.mailbox === b.mailbox;
  if ("cast" in a && "cast" in b) return a.cast === b.cast;
  return false;
}

/** Short progress text for the tracker and the mission log ("2/3", "최고 42점"). Empty when there is nothing to show. */
export function describeProgress(def: MissionDef, raw: unknown, collected: readonly string[]): string {
  const progress = asProgress(raw);
  switch (def.kind) {
    case "collect":
      return `${def.items.filter((id) => collected.includes(id)).length}/${def.items.length} ${def.noun}`;
    case "delivery":
      return `${(progress.delivered ?? []).length}/${def.items.length} 배달${def.seconds ? ` · 제한 ${def.seconds}초` : ""}`;
    case "talk_chain":
      return `${(progress.asked ?? []).length}/${def.targets.length} 명`;
    case "minigame_best": {
      if (progress.best === undefined) return "";
      return def.game === "cardmatch" ? `최고 ${progress.best}턴` : `최고 ${progress.best}${def.game === "kickups" ? "회" : def.game === "freekick" ? "골" : "점"}`;
    }
    case "time_trial":
      return progress.best === undefined ? `제한 ${def.seconds}초` : `최고 ${progress.best.toFixed(1)}초`;
    case "kick_goals":
      return progress.best === undefined ? `${def.goals}골 · ${def.seconds}초` : `최고 ${progress.best}골`;
    case "finale":
      return `${Math.min(def.rounds.length, progress.round ?? 0)}/${def.rounds.length} 라운드`;
    default:
      return "";
  }
}
