import { describe, expect, it } from "vitest";
import { CAST_SCRIPTS, FINALE_SCRIPT, MISSION_SCRIPTS, PROLOGUE_LINES, STORY_SCRIPT, type Line } from "./dialogueData";
import { MISSION_DEFS, getMissionDef } from "./missionDefs";
import { PLAYABLE_CAST, WORLD_CAST } from "./worldCast";

// The dialogue is data (docs/world/02): these checks keep it complete for every mission and every person, and
// keep a stray placeholder or a runaway line out of it.

const textOf = (line: Line) => (typeof line === "string" ? line : line[0]);

function everyText(): string[] {
  const out: string[] = [...PROLOGUE_LINES];
  for (const script of Object.values(MISSION_SCRIPTS)) {
    for (const group of [script.offer ?? [], script.active ?? [], script.complete]) out.push(...group.map(textOf));
    for (const single of [script.accept, script.retry, script.retryOffer]) if (single) out.push(textOf(single));
    for (const topic of script.topics ?? []) out.push(topic.label, ...topic.lines.map(textOf));
  }
  for (const script of Object.values(CAST_SCRIPTS)) {
    for (const group of [script.first ?? [], script.pre ?? [], script.idle, script.post ?? [], script.home ?? []]) out.push(...group.map(textOf));
    for (const single of [script.rumor, script.cheer, script.receive]) if (single) out.push(textOf(single));
  }
  for (const group of [FINALE_SCRIPT.intro, FINALE_SCRIPT.victory, FINALE_SCRIPT.ending]) out.push(...group.map((line) => line.text));
  out.push(...FINALE_SCRIPT.rounds.flatMap((round) => [round.taunt, round.cleared]).filter(Boolean), ...FINALE_SCRIPT.credits);
  for (const beat of Object.values(STORY_SCRIPT.beats)) out.push(...beat.map(textOf));
  out.push(...STORY_SCRIPT.finaleOffer.map(textOf));
  return out;
}

describe("dialogue data", () => {
  it("scripts every mission, with the parts its kind needs", () => {
    for (const def of MISSION_DEFS) {
      if (def.kind === "finale") continue; // the showdown has its own script (FINALE_SCRIPT)
      const script = MISSION_SCRIPTS[def.id];
      expect(script, def.id).toBeDefined();
      expect(script.complete.length, def.id).toBeGreaterThan(0);
      if (def.kind === "talk") {
        expect(script.topics?.length, def.id).toBeGreaterThan(0);
        continue;
      }
      expect(script.offer?.length, `${def.id} offer`).toBeGreaterThan(0);
      expect(script.active?.length, `${def.id} active`).toBeGreaterThan(0);
      expect(script.accept, `${def.id} accept`).toBeTruthy();
      if (def.kind === "delivery" && def.seconds !== undefined) {
        expect(script.retryOffer, `${def.id} retryOffer`).toBeTruthy();
        expect(script.retry, `${def.id} retry`).toBeTruthy();
      }
    }
  });

  it("has no script for a mission that does not exist", () => {
    for (const id of Object.keys(MISSION_SCRIPTS)) expect(getMissionDef(id), id).toBeDefined();
  });

  it("gives every one of the 20 people something to say", () => {
    for (const cast of WORLD_CAST) {
      const script = CAST_SCRIPTS[cast.id];
      expect(script, cast.id).toBeDefined();
      expect(script!.idle.length, cast.id).toBeGreaterThan(0);
    }
  });

  it("gives every member the full set: first meeting, pre-mission, idle, after-ending, home, cheer", () => {
    for (const cast of PLAYABLE_CAST) {
      const script = CAST_SCRIPTS[cast.id]!;
      expect(script.first?.length, `${cast.id} first`).toBeGreaterThan(0);
      expect(script.pre?.length, `${cast.id} pre`).toBeGreaterThan(0);
      expect(script.idle.length, `${cast.id} idle`).toBeGreaterThanOrEqual(2);
      expect(script.post?.length, `${cast.id} post`).toBeGreaterThan(0);
      expect(script.home?.length, `${cast.id} home`).toBeGreaterThanOrEqual(2);
      expect(script.cheer, `${cast.id} cheer`).toBeTruthy();
    }
  });

  it("gives what the original NPCs need for the story: rumors, the milk, both ending states", () => {
    for (const cast of ["kid", "shopkeeper", "elder"] as const) expect(CAST_SCRIPTS[cast]!.rumor, cast).toBeTruthy();
    expect(CAST_SCRIPTS.elder!.receive).toBeTruthy();
    for (const cast of ["woowakgood", "elder", "shopkeeper", "kid", "referee", "weedking", "weeder-grunt"] as const) expect(CAST_SCRIPTS[cast]!.post?.length, cast).toBeGreaterThan(0);
  });

  it("scripts one taunt per round of the showdown, and three rounds", () => {
    const finale = getMissionDef("m-90-finale");
    if (finale?.kind !== "finale") throw new Error("finale");
    expect(FINALE_SCRIPT.rounds).toHaveLength(finale.rounds.length);
    // The last round has nothing to react to afterwards.
    expect(FINALE_SCRIPT.rounds.at(-1)!.cleared).toBe("");
    for (const round of FINALE_SCRIPT.rounds.slice(0, -1)) expect(round.cleared.length).toBeGreaterThan(0);
  });

  it("keeps every line short enough for the box, free of stray placeholders and temporary markers", () => {
    for (const line of everyText()) {
      expect(Array.from(line).length, line).toBeLessThanOrEqual(100);
      expect(line.length, "empty line").toBeGreaterThan(0);
      expect(line, line).not.toMatch(/임시|TODO|검수/);
      for (const token of line.match(/\{[^}]*\}/g) ?? []) expect(token, line).toBe("{player}");
    }
  });

  it("has the four reviewed prologue lines", () => {
    expect(PROLOGUE_LINES).toHaveLength(4);
    expect(PROLOGUE_LINES[0]).toContain("{player}");
  });
});
