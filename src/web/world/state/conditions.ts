import type { WorldSave } from "../types";
import { missionStatusById, type MissionSave } from "./missions";

// Small condition language for map JSON (`npcs[].when`, `objects[].when`). An expression is one or more
// atoms joined by `&`; an atom can be negated with a `not:` prefix.
//
//   flag:<name>                 the flag is set                       (flag:ending-seen)
//   mission-available:<id>      the mission can be accepted
//   mission-active:<id>         accepted, goal not met yet
//   mission-ready:<id>          goal met, waiting for the report
//   mission-completed:<id>      done and paid out
//   shards>=<n>                 at least n grass shards
//
// Unknown atoms are false, so a typo hides the thing instead of showing it at the wrong time.

export type ConditionSave = Pick<WorldSave, "player" | "missions" | "shards" | "flags" | "collected">;

const STATUS_ATOMS: Record<string, string> = {
  "mission-available": "available",
  "mission-active": "active",
  "mission-ready": "ready",
  "mission-completed": "completed",
};

function evalAtom(atom: string, save: MissionSave): boolean {
  if (atom.startsWith("not:")) return !evalAtom(atom.slice(4), save);
  if (atom.startsWith("shards>=")) {
    const need = Number(atom.slice(8));
    return Number.isFinite(need) && save.shards >= need;
  }
  const colon = atom.indexOf(":");
  if (colon < 0) return false;
  const head = atom.slice(0, colon);
  const arg = atom.slice(colon + 1);
  if (head === "flag") return save.flags[arg] === true;
  const status = STATUS_ATOMS[head];
  return status !== undefined && missionStatusById(save, arg) === status;
}

/** True when there is no expression, or every atom holds. */
export function evalCondition(expr: string | undefined, save: ConditionSave): boolean {
  if (!expr) return true;
  return expr.split("&").every((atom) => evalAtom(atom.trim(), save));
}

/** Atom heads and flag/mission names an expression mentions, for the map integrity test. */
export function conditionRefs(expr: string): { heads: string[]; ids: string[] } {
  const heads: string[] = [];
  const ids: string[] = [];
  for (const raw of expr.split("&")) {
    let atom = raw.trim();
    while (atom.startsWith("not:")) atom = atom.slice(4);
    if (atom.startsWith("shards>=")) {
      heads.push("shards");
      continue;
    }
    const colon = atom.indexOf(":");
    heads.push(colon < 0 ? atom : atom.slice(0, colon));
    ids.push(colon < 0 ? "" : atom.slice(colon + 1));
  }
  return { heads, ids };
}

export const KNOWN_CONDITION_HEADS: readonly string[] = ["flag", "shards", ...Object.keys(STATUS_ATOMS)];
