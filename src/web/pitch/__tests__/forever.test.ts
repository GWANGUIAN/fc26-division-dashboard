import { describe, expect, it } from "vitest";
import {
  FIELD_MOBS,
  FIELD_NPCS,
  FOREVER_AREA,
  FOREVER_COLLIDERS,
  FOREVER_MAPS,
  FOREVER_NPCS,
  FOREVER_PROPS,
  LETTER_LINES,
  LETTER_TITLE,
  FOREVER_SPAWN,
  FOREVER_ZONES,
  GATE_FOREVER,
  foreverTargetAt,
  gateForeverDistance,
  nearGateForever,
  nearGateForeverPreload,
  type ForeverTarget,
} from "../game/forever";
import { GATE, insideBox, resolveBoxes, type Body } from "../game/locker";
import { LOGICAL_WIDTH } from "../engine/stage";

describe("GATE_FOREVER", () => {
  it("has the values of docs/forever/02 §2", () => {
    expect(GATE_FOREVER).toEqual({ x: 778, y: 316, w: 166, h: 166, centerX: 861, centerY: 399, promptRadius: 70, preloadRadius: 200 });
    expect(FOREVER_SPAWN).toEqual({ x: 745, y: 440 });
  });

  it("mirrors the locker gate: same y line and size, x + w + 16 === 960", () => {
    expect(GATE_FOREVER.x + GATE_FOREVER.w + GATE.x).toBe(LOGICAL_WIDTH);
    expect(GATE_FOREVER.y).toBe(GATE.y);
    expect(GATE_FOREVER.w).toBe(GATE.w);
    expect(GATE_FOREVER.h).toBe(GATE.h);
    expect(GATE_FOREVER.centerX).toBe(GATE_FOREVER.x + GATE_FOREVER.w / 2);
    expect(GATE_FOREVER.centerY).toBe(GATE.centerY);
    expect(GATE_FOREVER.promptRadius).toBe(GATE.promptRadius);
    expect(GATE_FOREVER.preloadRadius).toBe(GATE.preloadRadius);
  });

  it("the return spawn is outside the prompt radius", () => {
    expect(nearGateForever(FOREVER_SPAWN.x, FOREVER_SPAWN.y)).toBe(false);
  });
});

describe("gate proximity", () => {
  it("measures from the gate centre; the prompt radius includes its border", () => {
    expect(gateForeverDistance(861, 399)).toBe(0);
    expect(nearGateForever(861 - 70, 399)).toBe(true);
    expect(nearGateForever(861 - 71, 399)).toBe(false);
  });

  it("preloads strictly inside 200px", () => {
    expect(nearGateForeverPreload(861 - 199, 399)).toBe(true);
    expect(nearGateForeverPreload(861 - 200, 399)).toBe(false);
  });
});

describe("foreverTargetAt", () => {
  it("finds every target at its centre", () => {
    for (const id of Object.keys(FOREVER_ZONES) as ForeverTarget[]) {
      const { x, y } = FOREVER_ZONES[id];
      expect(foreverTargetAt(x, y), id).toBe(id);
    }
  });

  it("includes the radius border and excludes just outside", () => {
    const z = FOREVER_ZONES.questgiver;
    expect(foreverTargetAt(z.x + z.r, z.y)).toBe("questgiver");
    expect(foreverTargetAt(z.x + z.r + 1, z.y)).toBeNull();
  });

  it("is null in open ground", () => {
    expect(foreverTargetAt(480, 300)).toBeNull();
  });
});

describe("colliders", () => {
  const body = (x: number, y: number, vx = 0, vy = 0): Body => ({ x, y, vx, vy });

  it("pushes a foot out of a box and drops the velocity into it", () => {
    const fire = FOREVER_COLLIDERS.find((box) => box.x === 407)!; // campfire base
    const b = body(fire.x + fire.w / 2, fire.y + 5, 0, 60);
    resolveBoxes(b, FOREVER_COLLIDERS, undefined, FOREVER_AREA);
    expect(b.y).toBeLessThan(fire.y);
    expect(b.vy).toBe(0);
  });

  it("clamps to the hub floor, not the locker room's", () => {
    const b = body(0, 1000);
    resolveBoxes(b, FOREVER_COLLIDERS, undefined, FOREVER_AREA);
    expect(b.x).toBe(FOREVER_AREA.minX);
    expect(b.y).toBe(FOREVER_AREA.maxY);
  });

  it("leaves a free foot alone", () => {
    const b = body(600, 480);
    resolveBoxes(b, FOREVER_COLLIDERS, undefined, FOREVER_AREA);
    expect(b).toMatchObject({ x: 600, y: 480 });
  });
});

describe("town square declutter (docs/forever/07 §1-1)", () => {
  const hub = FOREVER_MAPS.elwynn;
  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
  /** Props that belong to an NPC and may stand beside it. */
  const OWN_PROP: Record<string, string[]> = { flightmaster: ["perch"], innkeeper: ["signboard"] };

  it("has five NPCs, no monsters, and the streamer has left for the meadow", () => {
    expect(FOREVER_NPCS.map((npc) => npc.id)).toEqual(["questgiver", "leroy", "innkeeper", "flightmaster", "guard"]);
    expect(hub.mobs).toHaveLength(0);
    expect(FIELD_NPCS.map((npc) => npc.id)).toEqual(["streamer"]);
  });

  it("keeps NPCs at least 100px apart", () => {
    for (const a of FOREVER_NPCS) for (const b of FOREVER_NPCS) if (a.id < b.id) expect(dist(a, b), `${a.id}/${b.id}`).toBeGreaterThanOrEqual(100);
  });

  it("keeps NPCs at least 70px from every prop that is not theirs, and from the portal", () => {
    for (const npc of FOREVER_NPCS) {
      for (const prop of FOREVER_PROPS) {
        if (OWN_PROP[npc.id]?.includes(prop.id)) continue;
        expect(dist(npc, prop), `${npc.id}/${prop.id}`).toBeGreaterThanOrEqual(70);
      }
      expect(dist(npc, hub.portal!), `${npc.id}/portal`).toBeGreaterThanOrEqual(70);
    }
  });

  it("the interactive NPCs stand on their circle's centre", () => {
    for (const npc of FOREVER_NPCS) {
      const zone = FOREVER_ZONES[npc.id as keyof typeof FOREVER_ZONES];
      if (zone) expect({ x: npc.x, y: npc.y }, npc.id).toEqual({ x: zone.x, y: zone.y });
    }
  });

  it("the player spawns at least 20px outside every interaction circle, on every map", () => {
    for (const map of Object.values(FOREVER_MAPS)) {
      for (const [id, zone] of Object.entries(map.zones)) expect(dist(map.spawn, zone!), `${map.id}/${id}`).toBeGreaterThanOrEqual(zone!.r + 20);
    }
  });

  it("the spawn and every interaction spot are on the floor and out of the colliders (square and meadow)", () => {
    for (const map of [FOREVER_MAPS.elwynn, FOREVER_MAPS.field]) {
      const { area } = map;
      const onFloor = (p: { x: number; y: number }) => p.x >= area.minX && p.x <= area.maxX && p.y >= area.minY && p.y <= area.maxY;
      const free = (p: { x: number; y: number }) => !map.colliders.some((box) => p.x >= box.x && p.x <= box.x + box.w && p.y >= box.y && p.y <= box.y + box.h);
      expect(onFloor(map.spawn) && free(map.spawn), `${map.id} spawn`).toBe(true);
      for (const [id, zone] of Object.entries(map.zones)) expect(onFloor(zone!) && free(zone!), `${map.id}/${id}`).toBe(true);
    }
  });

  it("the mailbox's circle and the portal's circle do not overlap another circle", () => {
    const ids = Object.keys(FOREVER_ZONES) as Array<keyof typeof FOREVER_ZONES>;
    for (const a of ids) for (const b of ids) if (a < b) expect(dist(FOREVER_ZONES[a], FOREVER_ZONES[b]), `${a}/${b}`).toBeGreaterThan(FOREVER_ZONES[a].r + FOREVER_ZONES[b].r - 30);
  });
});

describe("monster meadow (docs/forever/07 §1-2)", () => {
  const field = FOREVER_MAPS.field;

  it("is the third map with its own group, a portal home and no quests, flight master or NPC circles", () => {
    expect(field).toMatchObject({ id: "field", group: "forever-field", bg: "env/forever-field-bg", quests: false });
    expect(field.portal).toMatchObject({ to: "elwynn", sprite: "env/forever-portal-town" });
    expect(FOREVER_MAPS.elwynn.portal).toMatchObject({ to: "field", sprite: "env/forever-portal-field" });
    expect(Object.keys(field.zones)).toEqual(["portal"]);
    expect(foreverTargetAt(field.spawn.x, field.spawn.y, field.zones)).toBeNull();
    expect(foreverTargetAt(field.zones.portal!.x, field.zones.portal!.y, field.zones)).toBe("portal");
  });

  it("keeps the monsters at least 110px apart, on the floor and out of the colliders", () => {
    expect(FIELD_MOBS).toHaveLength(12);
    for (const a of FIELD_MOBS) for (const b of FIELD_MOBS) if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y), `${a.kind}@${a.x},${a.y} / ${b.kind}@${b.x},${b.y}`).toBeGreaterThanOrEqual(110);
    for (const mob of FIELD_MOBS) {
      const { area, colliders } = field;
      expect(mob.x >= area.minX && mob.x <= area.maxX && mob.y >= area.minY && mob.y <= area.maxY, `${mob.kind}@${mob.x},${mob.y}`).toBe(true);
      expect(colliders.some((box) => insideBox(mob.x, mob.y, box)), `${mob.kind}@${mob.x},${mob.y} in a collider`).toBe(false);
    }
  });

  it("only the rabbits are the quest's; the other kinds are boar, murloc and kobold", () => {
    expect([...new Set(FIELD_MOBS.map((mob) => mob.kind))].sort()).toEqual(["boar", "kobold", "murloc", "rabbit"]);
  });

  it("the orange veteran is called 투르카 (전설); no NPC on any map keeps the old name", () => {
    expect(FIELD_NPCS[0]).toMatchObject({ name: "투르카 (전설)", color: "#ff8000" });
    for (const map of Object.values(FOREVER_MAPS)) for (const npc of map.npcs) expect(npc.name).not.toContain("우왁");
  });
});

describe("letter of the mailbox (docs/forever/07 §1-3)", () => {
  const text = LETTER_LINES.map((line) => line.map((part) => part.text).join("")).join("\n");

  it("has the title and hides most of its content behind ~~~~ and ???", () => {
    expect(LETTER_TITLE).toBe("우왁굳에게 온 편지");
    expect(text).toContain("~~~~~~");
    expect(text).toContain("???");
    const hidden = LETTER_LINES.flat().filter((part) => part.hidden);
    expect(hidden.length).toBeGreaterThanOrEqual(6);
    for (const part of hidden) expect(part.text).toMatch(/^(~+|\?+)$/);
  });

  it("greets `??? 님께,`, keeps the body fully smudged and signs `우왁굳 드림`", () => {
    const lines = text.split("\n");
    expect(lines[0]).toBe("??? 님께,");
    expect(lines).toContain("- 우왁굳 드림");
    // the only readable words are the greeting, the signature and 추신
    const readable = LETTER_LINES.flat().filter((part) => !part.hidden).map((part) => part.text).join("");
    expect(readable).toBe(" 님께,- 우왁굳 드림추신. ");
    expect(text).not.toContain("우왁굳 님께");
  });

  it("fits the paper: at most 11 lines, none longer than 30 characters", () => {
    expect(LETTER_LINES.length).toBeLessThanOrEqual(11);
    for (const line of text.split("\n")) expect(line.length).toBeLessThanOrEqual(30);
  });
});
